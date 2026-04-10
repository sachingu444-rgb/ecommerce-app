import * as ImagePicker from "expo-image-picker";
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  where,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import { mockCoupons, mockProducts, mockReviews } from "../constants/mockData";
import { auth, db, storage } from "../firebaseConfig";
import { isPrivilegedAdminEmail, resolveRoleForEmail } from "./admin";
import {
  AppNotification,
  CartItem,
  Coupon,
  Order,
  Product,
  PushTokenRecord,
  Review,
  UserProfile,
  WalletTopUpRequest,
  WalletTransaction,
} from "../types";
import { calculateDiscount, safeProduct, toDateValue } from "./utils";

const productCollection = collection(db, "products");
const orderCollection = collection(db, "orders");
const reviewCollection = collection(db, "reviews");
const couponCollection = collection(db, "coupons");
const userCollection = collection(db, "users");
const walletTopUpCollection = collection(db, "walletTopUps");
const walletTopUpUtrCollection = collection(db, "walletTopUpUtrs");
const walletTransactionCollection = collection(db, "walletTransactions");

const notificationCollection = (uid: string) =>
  collection(db, "users", uid, "notifications");

const toPushTokenDocumentId = (token: string) => encodeURIComponent(token);

const sortByNewest = <T extends { createdAt?: unknown }>(items: T[]) =>
  [...items].sort((left, right) => {
    const leftTime = toDateValue(left.createdAt)?.getTime() || 0;
    const rightTime = toDateValue(right.createdAt)?.getTime() || 0;
    return rightTime - leftTime;
  });

const sortWalletTopUpsByNewest = (items: WalletTopUpRequest[]) =>
  [...items].sort((left, right) => {
    const leftTime = toDateValue(left.submittedAt || left.updatedAt)?.getTime() || 0;
    const rightTime = toDateValue(right.submittedAt || right.updatedAt)?.getTime() || 0;
    return rightTime - leftTime;
  });

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const stripUndefinedDeep = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedDeep(item))
      .filter((item) => item !== undefined) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, stripUndefinedDeep(entryValue)])
        .filter(([, entryValue]) => entryValue !== undefined)
    ) as T;
  }

  return value;
};

const requireAdminSession = () => {
  if (!isPrivilegedAdminEmail(auth.currentUser?.email)) {
    throw new Error("admin-required");
  }
};

const toWalletTopUpRequest = (value: { id: string; data: () => unknown }) =>
  ({
    id: value.id,
    ...(value.data() as WalletTopUpRequest),
  }) as WalletTopUpRequest;

const toWalletTransaction = (value: { id: string; data: () => unknown }) =>
  ({
    id: value.id,
    ...(value.data() as WalletTransaction),
  }) as WalletTransaction;

export const fetchProducts = async () => {
  try {
    const snapshot = await getDocs(query(productCollection, orderBy("createdAt", "desc")));
    if (snapshot.empty) {
      return mockProducts;
    }

    return snapshot.docs
      .map((item) => safeProduct({ id: item.id, ...item.data() }))
      .filter((product) => product.isActive);
  } catch {
    return mockProducts;
  }
};

export const subscribeToProducts = (
  onProducts: (products: Product[]) => void
) => {
  try {
    return onSnapshot(
      query(productCollection, orderBy("createdAt", "desc")),
      (snapshot) => {
        if (snapshot.empty) {
          onProducts(mockProducts);
          return;
        }

        onProducts(
          snapshot.docs
            .map((item) => safeProduct({ id: item.id, ...item.data() }))
            .filter((product) => product.isActive)
        );
      },
      () => {
        onProducts(mockProducts);
      }
    );
  } catch {
    onProducts(mockProducts);
    return () => undefined;
  }
};

export const fetchProductById = async (productId: string) => {
  try {
    const snapshot = await getDoc(doc(db, "products", productId));
    if (snapshot.exists()) {
      return safeProduct({ id: snapshot.id, ...snapshot.data() });
    }
  } catch {
    // Swallow and use fallback below.
  }

  return mockProducts.find((product) => product.id === productId) || null;
};

export const fetchFeaturedProducts = async () => {
  const products = await fetchProducts();
  return products.filter((product) => product.isFeatured).slice(0, 10);
};

export const fetchDealProducts = async () => {
  const products = await fetchProducts();
  return products.filter((product) => product.isDeal).slice(0, 10);
};

export const fetchProductsBySeller = async (sellerId: string) => {
  try {
    const snapshot = await getDocs(
      query(productCollection, where("sellerId", "==", sellerId), orderBy("createdAt", "desc"))
    );

    if (snapshot.empty) {
      return mockProducts.filter((product) => product.sellerId === sellerId);
    }

    return snapshot.docs.map((item) => safeProduct({ id: item.id, ...item.data() }));
  } catch {
    try {
      const snapshot = await getDocs(productCollection);
      const docs = snapshot.docs.map((item) =>
        safeProduct({ id: item.id, ...item.data() })
      );
      return docs
        .filter((product) => product.sellerId === sellerId)
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    } catch {
      return mockProducts.filter((product) => product.sellerId === sellerId);
    }
  }
};

export const fetchTopReviews = async (productId: string) => {
  try {
    const snapshot = await getDocs(
      query(
        reviewCollection,
        where("productId", "==", productId),
        orderBy("createdAt", "desc"),
        limit(3)
      )
    );
    if (snapshot.empty) {
      return mockReviews.filter((review) => review.productId === productId).slice(0, 3);
    }
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Review));
  } catch {
    try {
      const snapshot = await getDocs(reviewCollection);
      const docs = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Review));
      return docs
        .filter((review) => review.productId === productId)
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
        .slice(0, 3);
    } catch {
      return mockReviews.filter((review) => review.productId === productId).slice(0, 3);
    }
  }
};

export const fetchReviewsByUser = async (userId: string) => {
  try {
    const snapshot = await getDocs(
      query(
        reviewCollection,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      )
    );
    if (snapshot.empty) {
      return mockReviews.filter((review) => review.userId === userId);
    }
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Review));
  } catch {
    try {
      const snapshot = await getDocs(reviewCollection);
      const docs = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Review));
      return docs
        .filter((review) => review.userId === userId)
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    } catch {
      return mockReviews.filter((review) => review.userId === userId);
    }
  }
};

export const submitReview = async (review: Review) => {
  const reviewRef = doc(collection(db, "reviews"));
  await setDoc(reviewRef, {
    ...review,
    createdAt: serverTimestamp(),
  });

  const productRef = doc(db, "products", review.productId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(productRef);
    if (!snapshot.exists()) {
      return;
    }
    const current = snapshot.data() as Product;
    const existingReviews = current.reviews || 0;
    const existingRating = current.rating || 0;
    const newReviewCount = existingReviews + 1;
    const newRating =
      (existingRating * existingReviews + review.rating) / newReviewCount;

    transaction.update(productRef, {
      rating: Number(newRating.toFixed(1)),
      reviews: newReviewCount,
    });
  });
};

export const userHasPurchasedProduct = async (userId: string, productId: string) => {
  const orders = await fetchBuyerOrders(userId);
  return orders.some((order) =>
    order.items.some((item) => item.productId === productId)
  );
};

export const fetchBuyerOrders = async (buyerId: string) => {
  try {
    const snapshot = await getDocs(
      query(orderCollection, where("buyerId", "==", buyerId), orderBy("createdAt", "desc"))
    );
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as unknown as Order));
  } catch {
    try {
      const snapshot = await getDocs(orderCollection);
      return snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() } as unknown as Order))
        .filter((order) => order.buyerId === buyerId)
        .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    } catch {
      return [];
    }
  }
};

export const fetchSellerOrders = async (sellerId: string) => {
  try {
    const snapshot = await getDocs(query(orderCollection, orderBy("createdAt", "desc")));
    return snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() } as unknown as Order))
      .filter((order) => order.items.some((item) => item.sellerId === sellerId));
  } catch {
    return [];
  }
};

export const fetchOrderById = async (orderId: string) => {
  try {
    const snapshot = await getDoc(doc(db, "orders", orderId));
    if (snapshot.exists()) {
      return snapshot.data() as Order;
    }
  } catch {
    // Ignore and use null fallback.
  }

  return null;
};

export const saveOrder = async (order: Order) => {
  const sanitizedOrder = stripUndefinedDeep(order);

  await setDoc(doc(db, "orders", order.orderId), {
    ...sanitizedOrder,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateOrderStatus = async (
  orderId: string,
  status: Order["status"]
) => {
  await updateDoc(doc(db, "orders", orderId), {
    status,
    updatedAt: serverTimestamp(),
  });
};

export const fetchWishlistIds = async (uid: string) => {
  try {
    const snapshot = await getDoc(doc(db, "wishlist", uid));
    return (snapshot.data()?.items as string[]) || [];
  } catch {
    return [];
  }
};

export const toggleWishlist = async (uid: string, productId: string, isSaved: boolean) => {
  await setDoc(
    doc(db, "wishlist", uid),
    {
      items: isSaved ? arrayRemove(productId) : arrayUnion(productId),
    },
    { merge: true }
  );
};

export const fetchWishlistProducts = async (uid: string) => {
  const wishlistIds = await fetchWishlistIds(uid);
  const products = await fetchProducts();
  return products.filter((product) => wishlistIds.includes(product.id));
};

export const fetchCoupons = async (): Promise<Coupon[]> => {
  try {
    const snapshot = await getDocs(couponCollection);
    if (snapshot.empty) {
      return mockCoupons;
    }
    return snapshot.docs.map((item) => item.data() as Coupon);
  } catch {
    return mockCoupons;
  }
};

export const fetchUserProfile = async (uid: string) => {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
};

export const saveUserProfile = async (
  uid: string,
  payload: Partial<UserProfile>
) => {
  const sanitizedPayload = stripUndefinedDeep(payload);

  await setDoc(
    doc(db, "users", uid),
    {
      ...sanitizedPayload,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const submitWalletTopUpRequest = async ({
  userId,
  userName,
  userEmail,
  amount,
  utr,
  upiId,
}: {
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  utr: string;
  upiId: string;
}) => {
  const normalizedUserName =
    typeof userName === "string" && userName.trim()
      ? userName.trim()
      : "ShopApp User";
  const normalizedUserEmail =
    typeof userEmail === "string" ? userEmail.trim() : "";
  const normalizedUtr = utr.trim().toUpperCase();
  const normalizedAmount = Number(amount);
  const normalizedUpiId =
    typeof upiId === "string" ? upiId.trim() : "";

  if (!normalizedUtr || normalizedUtr.length < 8) {
    throw new Error("invalid-utr");
  }

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error("invalid-amount");
  }

  if (!normalizedUpiId) {
    throw new Error("invalid-upi-id");
  }

  const utrLockRef = doc(walletTopUpUtrCollection, normalizedUtr);
  const requestRef = doc(collection(db, "walletTopUps"));
  const batch = writeBatch(db);

  batch.set(utrLockRef, {
    id: normalizedUtr,
    userId,
    requestId: requestRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(requestRef, {
    id: requestRef.id,
    userId,
    userName: normalizedUserName,
    userEmail: normalizedUserEmail,
    amount: normalizedAmount,
    utr: normalizedUtr,
    upiId: normalizedUpiId,
    status: "pending",
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    const isPermissionDenied =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "permission-denied";

    if (isPermissionDenied) {
      throw new Error("duplicate-utr");
    }

    throw error;
  }

  return requestRef.id;
};

export const subscribeToWalletTopUpRequests = (
  onRequests: (requests: WalletTopUpRequest[]) => void
) =>
  onSnapshot(
    walletTopUpCollection,
    (snapshot: any) => {
      onRequests(sortWalletTopUpsByNewest(snapshot.docs.map(toWalletTopUpRequest)));
    },
    (error: any) => {
      console.error("[wallet-top-ups] admin subscription failed", error);
      onRequests([]);
    }
  );

export const subscribeToUserWalletTopUpRequests = (
  uid: string,
  onRequests: (requests: WalletTopUpRequest[]) => void
) =>
  onSnapshot(
    query(walletTopUpCollection, where("userId", "==", uid)),
    (snapshot: any) => {
      onRequests(sortWalletTopUpsByNewest(snapshot.docs.map(toWalletTopUpRequest)));
    },
    (error: any) => {
      console.error("[wallet-top-ups] user subscription failed", error);
      onRequests([]);
    }
  );

export const subscribeToWalletTransactions = (
  uid: string,
  onTransactions: (transactions: WalletTransaction[]) => void
) =>
  onSnapshot(
    query(walletTransactionCollection, where("userId", "==", uid)),
    (snapshot) => {
      onTransactions(sortByNewest(snapshot.docs.map(toWalletTransaction)));
    },
    () => {
      onTransactions([]);
    }
  );

export const approveWalletTopUpRequest = async (
  requestId: string,
  reviewer: {
    uid: string;
    email?: string | null;
  }
) => {
  requireAdminSession();

  return runTransaction(db, async (transaction) => {
    const requestRef = doc(db, "walletTopUps", requestId);
    const requestSnapshot = await transaction.get(requestRef);

    if (!requestSnapshot.exists()) {
      throw new Error("wallet-request-not-found");
    }

    const request = requestSnapshot.data() as WalletTopUpRequest;
    if (request.status !== "pending") {
      throw new Error("wallet-request-already-reviewed");
    }

    const userRef = doc(db, "users", request.userId);
    const userSnapshot = await transaction.get(userRef);
    const currentUser = userSnapshot.exists()
      ? (userSnapshot.data() as UserProfile)
      : null;
    const currentBalance = currentUser?.walletBalance || 0;
    const nextBalance = currentBalance + request.amount;
    const walletTransactionRef = doc(collection(db, "walletTransactions"));

    transaction.set(
      userRef,
      {
        uid: request.userId,
        name: currentUser?.name || request.userName,
        email: currentUser?.email || request.userEmail,
        role: resolveRoleForEmail(currentUser?.role, request.userEmail),
        walletBalance: nextBalance,
        walletUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      requestRef,
      {
        status: "approved",
        reviewedAt: serverTimestamp(),
        reviewedById: reviewer.uid,
        reviewedByEmail: reviewer.email || "",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(walletTransactionRef, {
      id: walletTransactionRef.id,
      userId: request.userId,
      amount: request.amount,
      type: "credit",
      source: "wallet_top_up",
      status: "completed",
      description: `Wallet top-up approved for UTR ${request.utr}`,
      balanceAfter: nextBalance,
      topUpRequestId: requestId,
      utr: request.utr,
      createdAt: serverTimestamp(),
    });

    return {
      balanceAfter: nextBalance,
      transactionId: walletTransactionRef.id,
      request,
    };
  });
};

export const rejectWalletTopUpRequest = async (
  requestId: string,
  reviewer: {
    uid: string;
    email?: string | null;
  },
  note?: string
) => {
  requireAdminSession();

  await setDoc(
    doc(db, "walletTopUps", requestId),
    {
      status: "rejected",
      reviewedAt: serverTimestamp(),
      reviewedById: reviewer.uid,
      reviewedByEmail: reviewer.email || "",
      updatedAt: serverTimestamp(),
      ...(note ? { note } : {}),
    },
    { merge: true }
  );
};

export const placeWalletOrder = async (order: Order) => {
  if (auth.currentUser?.uid !== order.buyerId) {
    throw new Error("wallet-user-mismatch");
  }

  return runTransaction(db, async (transaction) => {
    const userRef = doc(db, "users", order.buyerId);
    const userSnapshot = await transaction.get(userRef);

    if (!userSnapshot.exists()) {
      throw new Error("wallet-user-not-found");
    }

    const userProfile = userSnapshot.data() as UserProfile;
    const currentBalance = userProfile.walletBalance || 0;
    if (currentBalance < order.totalAmount) {
      throw new Error("wallet-insufficient-balance");
    }

    const nextBalance = currentBalance - order.totalAmount;
    const orderRef = doc(db, "orders", order.orderId);
    const walletTransactionRef = doc(collection(db, "walletTransactions"));
    const orderPayload = stripUndefinedDeep({
      ...order,
      paymentReference: order.paymentReference || walletTransactionRef.id,
    });

    transaction.set(orderRef, {
      ...orderPayload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(
      userRef,
      {
        walletBalance: nextBalance,
        walletUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(walletTransactionRef, {
      id: walletTransactionRef.id,
      userId: order.buyerId,
      amount: order.totalAmount,
      type: "debit",
      source: "wallet_order",
      status: "completed",
      description: `Wallet payment for order ${order.orderId}`,
      balanceAfter: nextBalance,
      orderId: order.orderId,
      createdAt: serverTimestamp(),
    });

    return {
      balanceAfter: nextBalance,
      transactionId: walletTransactionRef.id,
    };
  });
};

export const subscribeToAllOrders = (
  onOrders: (orders: Order[]) => void
) =>
  onSnapshot(
    orderCollection,
    (snapshot) => {
      onOrders(
        sortByNewest(
          snapshot.docs.map(
            (item) => ({ id: item.id, ...item.data() } as unknown as Order)
          )
        )
      );
    },
    () => {
      onOrders([]);
    }
  );

export const subscribeToUsers = (
  onUsers: (users: UserProfile[]) => void
) =>
  onSnapshot(
    userCollection,
    (snapshot: any) => {
      onUsers(
        sortByNewest(
          snapshot.docs.map((item) => item.data() as UserProfile)
        )
      );
    },
    (error: any) => {
      console.error("[users] subscription failed", error);
      onUsers([]);
    }
  );

export const subscribeToUserNotifications = (
  uid: string,
  onNotifications: (notifications: AppNotification[]) => void
) =>
  onSnapshot(
    query(notificationCollection(uid), orderBy("createdAt", "desc")),
    (snapshot) => {
      onNotifications(
        snapshot.docs.map(
          (item) =>
            ({
              id: item.id,
              ...item.data(),
            }) as AppNotification
        )
      );
    },
    () => {
      onNotifications([]);
    }
  );

export const markNotificationAsRead = async (
  uid: string,
  notificationId: string
) => {
  await updateDoc(doc(db, "users", uid, "notifications", notificationId), {
    read: true,
    updatedAt: serverTimestamp(),
  });
};

export const markAllNotificationsAsRead = async (uid: string) => {
  const snapshot = await getDocs(
    query(notificationCollection(uid), where("read", "==", false))
  );

  if (snapshot.empty) {
    return;
  }

  await Promise.all(
    snapshot.docs.map((item) =>
      updateDoc(item.ref, {
        read: true,
        updatedAt: serverTimestamp(),
      })
    )
  );
};

export const savePushToken = async (
  uid: string,
  token: string,
  platform: string
) => {
  const tokenRef = doc(
    db,
    "users",
    uid,
    "pushTokens",
    toPushTokenDocumentId(token)
  );
  const existingToken = await getDoc(tokenRef);

  const payload: PushTokenRecord = {
    token,
    provider: "expo",
    platform,
    updatedAt: serverTimestamp(),
  };

  await setDoc(
    tokenRef,
    {
      ...payload,
      ...(existingToken.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  );
};

export const deletePushToken = async (uid: string, token: string) => {
  const tokenRef = doc(
    db,
    "users",
    uid,
    "pushTokens",
    toPushTokenDocumentId(token)
  );
  const snapshot = await getDoc(tokenRef);

  if (!snapshot.exists()) {
    return;
  }

  await deleteDoc(tokenRef);
};

export const addProduct = async (
  product: Omit<Product, "id" | "discount" | "createdAt"> & { originalPrice: number }
) => {
  const productRef = doc(collection(db, "products"));
  const payload: Product = {
    ...product,
    id: productRef.id,
    discount: calculateDiscount(product.price, product.originalPrice),
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "products", productRef.id), {
    ...payload,
    createdAt: serverTimestamp(),
  });

  return payload;
};

export const updateProduct = async (
  productId: string,
  payload: Partial<Product> & { price?: number; originalPrice?: number }
) => {
  const nextDiscount =
    payload.price !== undefined && payload.originalPrice !== undefined
      ? calculateDiscount(payload.price, payload.originalPrice)
      : payload.discount;

  await updateDoc(doc(db, "products", productId), {
    ...payload,
    ...(nextDiscount !== undefined ? { discount: nextDiscount } : {}),
  });
};

export const deleteProduct = async (productId: string) => {
  await deleteDoc(doc(db, "products", productId));
};

export const uploadImages = async (
  sellerId: string,
  assets: ImagePicker.ImagePickerAsset[],
  onProgress?: (value: number) => void
) => {
  const total = assets.length;
  const urls: string[] = [];

  for (let index = 0; index < assets.length; index += 1) {
    const asset = assets[index];
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    const filename = asset.fileName || `image-${Date.now()}-${index}.jpg`;
    const storageRef = ref(
      storage,
      `products/${sellerId}/${Date.now()}_${filename}`
    );

    await new Promise<void>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            ((index + snapshot.bytesTransferred / snapshot.totalBytes) / total) * 100;
          onProgress?.(progress);
        },
        reject,
        async () => {
          urls.push(await getDownloadURL(uploadTask.snapshot.ref));
          resolve();
        }
      );
    });
  }

  return urls;
};

export const uploadSingleAsset = async (
  path: string,
  fileUri: string,
  onProgress?: (progress: number) => void
) => {
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const storageRef = ref(storage, path);

  return new Promise<string>((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, blob);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        onProgress?.(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
      },
      reject,
      async () => {
        resolve(await getDownloadURL(uploadTask.snapshot.ref));
      }
    );
  });
};

export const clearFirestoreCart = async (uid: string) => {
  await setDoc(doc(db, "cart", uid), { items: [] }, { merge: true });
};

export const syncCartToFirestore = async (uid: string, items: CartItem[]) => {
  await setDoc(doc(db, "cart", uid), { items }, { merge: true });
};
