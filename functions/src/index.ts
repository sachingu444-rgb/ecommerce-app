import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import Stripe from "stripe";

initializeApp();

const adminDb = getFirestore();
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const fallbackStripeSecret = "sk_test_4eC39HqLyjWDarjtT1zdp7dc";
const fallbackPublishableKey = "pk_test_TYooMQauvdEDq54NiTphI7jx";
const expoPushApiUrl = "https://exp.host/--/api/v2/push/send";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  sellerId: string;
}

interface Order {
  orderId: string;
  buyerId: string;
  buyerName: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
}

interface StoredPushToken {
  token?: string;
  provider?: string;
}

interface UserNotificationPayload {
  title: string;
  message: string;
  type: "seller_new_order" | "buyer_delivery_alert";
  orderId: string;
  route: string;
}

interface ExpoPushTokenDocument {
  id: string;
  token: string;
  uid: string;
  provider: string;
}

const createStripeClient = () =>
  new Stripe(stripeSecretKey.value() || fallbackStripeSecret, {
    apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion,
  });

const truncateOrderId = (orderId: string) => orderId.slice(0, 8).toUpperCase();

const chunkItems = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const getExpoPushTokensForUser = async (uid: string) => {
  const snapshot = await adminDb.collection("users").doc(uid).collection("pushTokens").get();

  return snapshot.docs
    .map((item) => {
      const data = item.data() as StoredPushToken;
      return {
        id: item.id,
        uid,
        token: data.token || "",
        provider: data.provider || "",
      };
    })
    .filter(
      (item): item is ExpoPushTokenDocument =>
        item.provider === "expo" &&
        Boolean(item.token) &&
        (item.token.startsWith("ExponentPushToken[") ||
          item.token.startsWith("ExpoPushToken["))
    );
};

const createUserNotification = async (
  uid: string,
  payload: UserNotificationPayload
) => {
  const notificationRef = adminDb
    .collection("users")
    .doc(uid)
    .collection("notifications")
    .doc();

  await notificationRef.set({
    ...payload,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
};

const removeInvalidExpoPushTokens = async (invalidTokens: ExpoPushTokenDocument[]) => {
  await Promise.all(
    invalidTokens.map((tokenDoc) =>
      adminDb
        .collection("users")
        .doc(tokenDoc.uid)
        .collection("pushTokens")
        .doc(tokenDoc.id)
        .delete()
    )
  );
};

const sendExpoPushNotifications = async (
  tokenDocs: ExpoPushTokenDocument[],
  payload: UserNotificationPayload
) => {
  if (tokenDocs.length === 0) {
    return;
  }

  for (const tokenBatch of chunkItems(tokenDocs, 100)) {
    const messages = tokenBatch.map((tokenDoc) => ({
      to: tokenDoc.token,
      sound: "default",
      channelId: "orders",
      title: payload.title,
      body: payload.message,
      data: {
        orderId: payload.orderId,
        route: payload.route,
        type: payload.type,
      },
    }));

    try {
      const response = await fetch(expoPushApiUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        console.error(
          "[Notifications] Expo push request failed:",
          response.status,
          response.statusText
        );
        continue;
      }

      const body = (await response.json()) as {
        data?: Array<{
          details?: { error?: string };
          status?: string;
        }>;
      };

      const invalidTokens = tokenBatch.filter((tokenDoc, index) => {
        const result = body.data?.[index];
        return result?.details?.error === "DeviceNotRegistered";
      });

      if (invalidTokens.length > 0) {
        await removeInvalidExpoPushTokens(invalidTokens);
      }
    } catch (error) {
      console.error("[Notifications] Expo push send failed:", error);
    }
  }
};

const notifyUser = async (uid: string, payload: UserNotificationPayload) => {
  await createUserNotification(uid, payload);
  const tokenDocs = await getExpoPushTokensForUser(uid);
  await sendExpoPushNotifications(tokenDocs, payload);
};

export const createPaymentSheet = onCall(
  {
    secrets: [stripeSecretKey],
    cors: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication is required.");
    }

    const amount = Number(request.data?.amount);
    const email = String(
      request.data?.email || request.auth.token.email || ""
    ).trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new HttpsError("invalid-argument", "Amount must be greater than zero.");
    }

    const stripe = createStripeClient();
    const customer = await stripe.customers.create({
      email: email || undefined,
      metadata: {
        firebaseUid: request.auth.uid,
      },
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2026-02-25.clover" as Stripe.LatestApiVersion }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "inr",
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        firebaseUid: request.auth.uid,
      },
    });

    if (!paymentIntent.client_secret || !ephemeralKey.secret) {
      throw new HttpsError("internal", "Unable to initialize payment sheet.");
    }

    return {
      customerId: customer.id,
      ephemeralKeySecret: ephemeralKey.secret,
      paymentIntentClientSecret: paymentIntent.client_secret,
      publishableKey:
        process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || fallbackPublishableKey,
    };
  }
);

export const notifySellersOnNewOrder = onDocumentCreated("orders/{orderId}", async (event) => {
  const order = event.data?.data() as Order | undefined;

  if (!order) {
    return;
  }

  const sellerIds = [...new Set(order.items.map((item) => item.sellerId).filter(Boolean))];

  await Promise.all(
    sellerIds.map(async (sellerId) => {
      const sellerItemCount = order.items
        .filter((item) => item.sellerId === sellerId)
        .reduce((count, item) => count + item.quantity, 0);

      await notifyUser(sellerId, {
        title: "New order received",
        message: `${order.buyerName} placed ${sellerItemCount} item(s) in order #${truncateOrderId(order.orderId)}.`,
        type: "seller_new_order",
        orderId: order.orderId,
        route: "/seller/orders",
      });
    })
  );
});

export const notifyBuyerOnDeliveredOrder = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const before = event.data?.before.data() as Order | undefined;
    const after = event.data?.after.data() as Order | undefined;

    if (!before || !after || before.status === after.status || after.status !== "delivered") {
      return;
    }

    await notifyUser(after.buyerId, {
      title: "Order delivered",
      message: `Your order #${truncateOrderId(after.orderId)} has been marked delivered.`,
      type: "buyer_delivery_alert",
      orderId: after.orderId,
      route: `/order/${after.orderId}`,
    });
  }
);
