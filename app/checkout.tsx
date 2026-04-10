import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

import AppImage from "../components/AppImage";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import { colors, radius, spacing } from "../constants/theme";
import { useAuth } from "../hooks/useAuth";
import {
  clearFirestoreCart,
  placeWalletOrder,
  saveOrder,
  saveUserProfile,
} from "../lib/firebaseApi";
import {
  buildUpiPaymentUri,
  buildUpiQrCodeUrl,
  merchantUpiId,
  merchantUpiName,
} from "../lib/payment";
import { showToast } from "../lib/toast";
import { formatAddress, formatCurrency } from "../lib/utils";
import { useCartStore } from "../store/cartStore";
import { CartItem, DeliveryAddress, Order } from "../types";

type CheckoutPaymentMethod = "cash_on_delivery" | "upi" | "wallet";

const checkoutSteps = ["Address", "Order Summary", "Payment"];

const paymentOptions: Array<{
  value: CheckoutPaymentMethod;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    value: "cash_on_delivery",
    label: "Cash on Delivery",
    description: "Place the order now and pay when it reaches your doorstep.",
    icon: "cash-outline",
  },
  {
    value: "upi",
    label: "UPI QR",
    description: "Scan the QR code or open a UPI app to transfer instantly.",
    icon: "qr-code-outline",
  },
  {
    value: "wallet",
    label: "Wallet",
    description: "Use your approved wallet balance for instant prepaid checkout.",
    icon: "wallet-outline",
  },
];

const PriceRow = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
    <Text
      style={{
        color: highlight ? colors.text : colors.muted,
        fontWeight: highlight ? "900" : "600",
        fontSize: highlight ? 17 : 14,
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        color: highlight ? colors.primary : colors.text,
        fontWeight: "900",
        fontSize: highlight ? 18 : 14,
      }}
    >
      {value}
    </Text>
  </View>
);

export default function CheckoutScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const items = useCartStore((state: { items: CartItem[] }) => state.items);
  const cartTotal = useCartStore((state: { totalPrice: () => number }) => state.totalPrice());
  const clearCart = useCartStore((state: { clearCart: () => void }) => state.clearCart);

  const [step, setStep] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<CheckoutPaymentMethod>("cash_on_delivery");
  const [submitting, setSubmitting] = useState(false);
  const [upiReference] = useState(() => `SHOPAPP-${Date.now()}`);
  const [address, setAddress] = useState<DeliveryAddress>({
    name: profile?.name || "",
    phone: profile?.phone || "",
    street: profile?.address || "",
    city: "",
    state: "",
    pincode: "",
  });
  const [qrLoadFailed, setQrLoadFailed] = useState(false);

  useEffect(() => {
    setAddress((current: DeliveryAddress) => ({
      ...current,
      name: profile?.name || current.name,
      phone: profile?.phone || current.phone,
      street: profile?.address || current.street,
    }));
  }, [profile?.address, profile?.name, profile?.phone]);

  const subtotal = cartTotal;
  const shipping = subtotal > 500 || subtotal === 0 ? 0 : 50;
  const total = subtotal + shipping;
  const walletBalance = profile?.walletBalance ?? 0;
  const walletShortfall = Math.max(total - walletBalance, 0);
  const hasEnoughWalletBalance = walletBalance >= total;
  const addressPreview = formatAddress(address);
  const totalUnits = useMemo(
    () => items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
    [items]
  );

  const deliveryValid = useMemo(
    () =>
      address.name.trim().length > 1 &&
      address.phone.trim().length >= 10 &&
      address.street.trim().length > 5 &&
      address.city.trim().length > 1 &&
      address.state.trim().length > 1 &&
      address.pincode.trim().length >= 6,
    [address]
  );

  const upiUri = useMemo(
    () => buildUpiPaymentUri(total, `ShopApp order ${upiReference}`, upiReference),
    [total, upiReference]
  );
  const upiQrCodeUrl = useMemo(() => buildUpiQrCodeUrl(upiUri), [upiUri]);

  useEffect(() => {
    setQrLoadFailed(false);
  }, [upiQrCodeUrl]);

  const updateAddressField = <K extends keyof DeliveryAddress>(
    key: K,
    value: DeliveryAddress[K]
  ) => {
    setAddress((current: DeliveryAddress) => ({
      ...current,
      [key]: value,
    }));
  };

  const ensureDeliveryDetails = () => {
    if (!deliveryValid) {
      showToast("error", "Complete delivery details", "All address fields are required.");
      return false;
    }

    return true;
  };

  const buildOrderPayload = (
    paymentMethod: CheckoutPaymentMethod,
    paymentStatus: Order["paymentStatus"],
    paymentReference?: string,
    walletAmountUsed?: number
  ): Order => {
    const orderId = `ORD-${Date.now()}`;

    return {
      orderId,
      buyerId: user?.uid || "",
      buyerName: profile?.name || user?.displayName || address.name || "ShopApp Buyer",
      buyerEmail: user?.email || profile?.email || "",
      items: items.map((item: CartItem) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        sellerId: item.sellerId,
        category: item.category,
      })),
      totalAmount: total,
      status: "confirmed",
      paymentStatus,
      paymentMethod,
      deliveryAddress: address,
      ...(paymentReference ? { paymentReference } : {}),
      ...(walletAmountUsed !== undefined ? { walletAmountUsed } : {}),
    };
  };

  const finalizeOrder = async (order: Order, successMessage: string) => {
    if (!user || items.length === 0) {
      return;
    }

    clearCart();
    await Promise.allSettled([
      clearFirestoreCart(user.uid),
      saveUserProfile(user.uid, {
        name: address.name,
        phone: address.phone,
        address: addressPreview || address.street,
      }),
    ]);

    showToast("success", "Order placed", successMessage);
    router.replace({
      pathname: "/order-confirmation",
      params: {
        orderId: order.orderId,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentReference: order.paymentReference || "",
      },
    });
  };

  const handleContinueToSummary = () => {
    if (!ensureDeliveryDetails()) {
      return;
    }

    setStep(1);
  };

  const handleContinueToPayment = () => {
    if (!ensureDeliveryDetails()) {
      return;
    }

    setStep(2);
  };

  const handleOpenUpiApp = async () => {
    if (Platform.OS === "web") {
      showToast("info", "Scan the QR code", `Pay to ${merchantUpiId} from any UPI app.`);
      return;
    }

    try {
      await Linking.openURL(upiUri);
    } catch {
      showToast("info", "Scan the QR code", `Pay to ${merchantUpiId} from any UPI app.`);
    }
  };

  const handleCashOnDelivery = async () => {
    if (!ensureDeliveryDetails()) {
      return;
    }

    try {
      setSubmitting(true);
      const order = buildOrderPayload("cash_on_delivery", "pending");
      await saveOrder(order);
      await finalizeOrder(order, "Your order is confirmed. Pay when the package arrives.");
    } catch {
      showToast("error", "Checkout failed", "Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpiPayment = async () => {
    if (!ensureDeliveryDetails()) {
      return;
    }

    try {
      setSubmitting(true);
      const order = buildOrderPayload("upi", "paid", upiReference);
      await saveOrder(order);
      await finalizeOrder(
        order,
        "Your order has been placed with UPI payment marked as completed."
      );
    } catch {
      showToast("error", "Payment confirmation failed", "Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWalletPayment = async () => {
    if (!ensureDeliveryDetails()) {
      return;
    }

    if (!hasEnoughWalletBalance) {
      showToast(
        "error",
        "Insufficient wallet balance",
        `Add ${formatCurrency(walletShortfall)} more to use wallet payment.`
      );
      return;
    }

    try {
      setSubmitting(true);
      const order = buildOrderPayload("wallet", "paid", undefined, total);
      const walletPayment = await placeWalletOrder(order);
      await finalizeOrder(
        {
          ...order,
          paymentReference: walletPayment.transactionId,
        },
        `Wallet charged ${formatCurrency(total)}. Remaining balance: ${formatCurrency(walletPayment.balanceAfter)}.`
      );
    } catch (error) {
      const message =
        error instanceof Error && error.message === "wallet-insufficient-balance"
          ? "Your wallet balance changed. Please add funds and try again."
          : "Please try again in a moment.";
      showToast("error", "Wallet payment failed", message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
          <EmptyState
            icon="card-outline"
            title="Sign in to checkout"
            subtitle="Secure payments and order placement require an active account."
            buttonLabel="Sign In"
            onPress={() => router.push("/(auth)/login")}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
          <EmptyState
            icon="cart-outline"
            title="Your cart is empty"
            subtitle="Add at least one item before starting checkout."
            buttonLabel="Back to Home"
            onPress={() => router.push("/")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              marginBottom: spacing.lg,
            }}
          >
            <Pressable
              onPress={() => (step > 0 ? setStep((current) => current - 1) : router.back())}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: colors.white,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
            <View>
              <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>Checkout</Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                {"Address -> Order Summary -> Payment"}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xl }}>
            {checkoutSteps.map((label, index) => {
              const active = index <= step;
              return (
                <View key={label} style={{ flex: 1, alignItems: "center" }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: active ? colors.primary : "#D1D5DB",
                    }}
                  >
                    <Text style={{ color: colors.white, fontWeight: "900" }}>{index + 1}</Text>
                  </View>
                  <Text
                    style={{
                      marginTop: spacing.sm,
                      color: active ? colors.primaryDark : colors.muted,
                      fontWeight: "800",
                      textAlign: "center",
                    }}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>

          {step === 0 ? (
            <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg }}>
              <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text }}>
                Delivery Address
              </Text>
              <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 20 }}>
                Add the shipping details for your order. We will use this address for delivery updates.
              </Text>

              <View
                style={{
                  marginTop: spacing.lg,
                  backgroundColor: colors.bg,
                  borderRadius: radius.md,
                  padding: spacing.md,
                }}
              >
                <Text style={{ color: colors.primaryDark, fontWeight: "900" }}>Current payable</Text>
                <Text style={{ color: colors.text, marginTop: 6 }}>
                  {items.length} item{items.length > 1 ? "s" : ""} in cart
                </Text>
                <Text style={{ color: colors.primary, fontSize: 22, fontWeight: "900", marginTop: 6 }}>
                  {formatCurrency(total)}
                </Text>
              </View>

              <View style={{ marginTop: spacing.lg }}>
                <FormField
                  label="Full Name"
                  icon="person-outline"
                  value={address.name}
                  onChangeText={(value: string) => updateAddressField("name", value)}
                  placeholder="Receiver's full name"
                />
                <FormField
                  label="Phone Number"
                  icon="call-outline"
                  value={address.phone}
                  onChangeText={(value: string) => updateAddressField("phone", value)}
                  keyboardType="phone-pad"
                  placeholder="Phone number"
                />
                <FormField
                  label="Street Address"
                  icon="home-outline"
                  value={address.street}
                  onChangeText={(value: string) => updateAddressField("street", value)}
                  placeholder="House number, street and landmark"
                  multiline
                  inputStyle={{ minHeight: 80, textAlignVertical: "top" }}
                />
                <FormField
                  label="City"
                  icon="business-outline"
                  value={address.city}
                  onChangeText={(value: string) => updateAddressField("city", value)}
                  placeholder="City"
                />
                <FormField
                  label="State"
                  icon="map-outline"
                  value={address.state}
                  onChangeText={(value: string) => updateAddressField("state", value)}
                  placeholder="State"
                />
                <FormField
                  label="Pincode"
                  icon="locate-outline"
                  value={address.pincode}
                  onChangeText={(value: string) => updateAddressField("pincode", value)}
                  keyboardType="number-pad"
                  placeholder="Pincode"
                />
              </View>

              <Pressable
                onPress={handleContinueToSummary}
                style={{
                  marginTop: spacing.md,
                  backgroundColor: colors.primary,
                  borderRadius: radius.md,
                  alignItems: "center",
                  paddingVertical: spacing.md,
                }}
              >
                <Text style={{ color: colors.white, fontWeight: "900" }}>
                  Continue to Order Summary
                </Text>
              </Pressable>
            </View>
          ) : null}

          {step === 1 ? (
            <View style={{ gap: spacing.lg }}>
              <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: spacing.md,
                  }}
                >
                  <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>
                    Shipping To
                  </Text>
                  <Pressable onPress={() => setStep(0)}>
                    <Text style={{ color: colors.primary, fontWeight: "800" }}>Edit</Text>
                  </Pressable>
                </View>
                <Text style={{ color: colors.text, fontWeight: "900" }}>{address.name}</Text>
                <Text style={{ color: colors.muted, marginTop: 4 }}>{address.phone}</Text>
                <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 20 }}>
                  {addressPreview}
                </Text>
              </View>

              <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text, marginBottom: spacing.md }}>
                  Order Summary
                </Text>
                {items.map((item: CartItem) => (
                  <View
                    key={item.productId}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                      marginBottom: spacing.md,
                    }}
                  >
                    <AppImage
                      uri={item.image}
                      resizeMode="contain"
                      containerStyle={{
                        width: 64,
                        height: 64,
                        borderRadius: radius.md,
                        backgroundColor: colors.bg,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "800" }} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={{ color: colors.muted, marginTop: 4 }}>
                        Qty {item.quantity}
                      </Text>
                    </View>
                    <Text style={{ color: colors.text, fontWeight: "900" }}>
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </View>
                ))}

                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />
                <PriceRow label="Items Total" value={formatCurrency(subtotal)} />
                <PriceRow
                  label="Shipping"
                  value={shipping === 0 ? "Free" : formatCurrency(shipping)}
                />
                <PriceRow label="Total" value={formatCurrency(total)} highlight />
              </View>

              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <Pressable
                  onPress={() => setStep(0)}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    borderRadius: radius.md,
                    alignItems: "center",
                    paddingVertical: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "900" }}>Edit Address</Text>
                </Pressable>
                <Pressable
                  onPress={handleContinueToPayment}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    borderRadius: radius.md,
                    alignItems: "center",
                    paddingVertical: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.white, fontWeight: "900" }}>Continue to Payment</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          {step === 2 ? (
            <View style={{ gap: spacing.lg }}>
              <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg }}>
                <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text }}>
                  Payment Method
                </Text>
                <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 20 }}>
                  Choose how you want to complete this order. Cash on Delivery, UPI, and wallet
                  payments are ready below.
                </Text>

                <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
                  {paymentOptions.map((option) => {
                    const selected = option.value === selectedPaymentMethod;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setSelectedPaymentMethod(option.value)}
                        style={{
                          borderWidth: 1.5,
                          borderColor: selected ? colors.primary : colors.border,
                          backgroundColor: selected ? colors.primaryLight : colors.white,
                          borderRadius: radius.lg,
                          padding: spacing.md,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: selected ? colors.primary : colors.bg,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons
                              name={option.icon}
                              size={22}
                              color={selected ? colors.white : colors.primaryDark}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
                              {option.label}
                            </Text>
                            <Text style={{ color: colors.muted, marginTop: 4, lineHeight: 20 }}>
                              {option.description}
                            </Text>
                          </View>
                          <Ionicons
                            name={selected ? "radio-button-on" : "radio-button-off"}
                            size={22}
                            color={selected ? colors.primary : colors.muted}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>
                  Payment Summary
                </Text>
                <View
                  style={{
                    marginTop: spacing.md,
                    backgroundColor: colors.bg,
                    borderRadius: radius.md,
                    padding: spacing.md,
                    gap: spacing.sm,
                  }}
                >
                  <PriceRow label="Items" value={`${totalUnits} unit${totalUnits === 1 ? "" : "s"}`} />
                  <PriceRow label="Items Total" value={formatCurrency(subtotal)} />
                  <PriceRow
                    label="Shipping"
                    value={shipping === 0 ? "Free" : formatCurrency(shipping)}
                  />
                  <PriceRow label="Amount to Pay" value={formatCurrency(total)} highlight />
                </View>
              </View>

              {selectedPaymentMethod === "cash_on_delivery" ? (
                <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg }}>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>
                    Cash on Delivery
                  </Text>
                  <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 22 }}>
                    Place the order now and collect the payment when the parcel is delivered.
                    Payment status will stay pending until delivery is completed.
                  </Text>

                  <View
                    style={{
                      marginTop: spacing.lg,
                      backgroundColor: "#FFF7ED",
                      borderRadius: radius.md,
                      padding: spacing.md,
                      gap: spacing.sm,
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: "900" }}>Delivery address</Text>
                    <Text style={{ color: colors.muted, lineHeight: 20 }}>{addressPreview}</Text>
                    <Text style={{ color: colors.primaryDark, fontWeight: "800" }}>
                      Collect {formatCurrency(total)} at delivery time.
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleCashOnDelivery}
                    disabled={submitting}
                    style={{
                      marginTop: spacing.lg,
                      backgroundColor: colors.primary,
                      borderRadius: radius.md,
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 52,
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={{ color: colors.white, fontWeight: "900" }}>
                        Place Order with Cash on Delivery
                      </Text>
                    )}
                  </Pressable>
                </View>
              ) : selectedPaymentMethod === "upi" ? (
                <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg }}>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>
                    Pay with UPI QR
                  </Text>
                  <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 22 }}>
                    Scan this QR code in PhonePe, Google Pay, Paytm, BHIM, or any UPI app. Once
                    you complete payment, tap the button below to mark it as paid and place the
                    order.
                  </Text>

                  <View
                    style={{
                      marginTop: spacing.lg,
                      backgroundColor: colors.bg,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      gap: spacing.sm,
                    }}
                  >
                    <PriceRow label="Payee" value={merchantUpiName} />
                    <PriceRow label="UPI ID" value={merchantUpiId} />
                    <PriceRow label="Reference" value={upiReference} />
                    <PriceRow label="Amount" value={formatCurrency(total)} highlight />
                  </View>

                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: spacing.lg,
                      padding: spacing.md,
                      borderRadius: radius.lg,
                      backgroundColor: colors.bg,
                    }}
                  >
                    {!qrLoadFailed ? (
                      <Image
                        source={{ uri: upiQrCodeUrl }}
                        style={{ width: 240, height: 240, borderRadius: radius.md }}
                        resizeMode="contain"
                        onError={() => setQrLoadFailed(true)}
                      />
                    ) : (
                      <View
                        style={{
                          width: 240,
                          minHeight: 240,
                          borderRadius: radius.md,
                          backgroundColor: colors.white,
                          alignItems: "center",
                          justifyContent: "center",
                          padding: spacing.lg,
                        }}
                      >
                        <Ionicons name="warning-outline" size={28} color={colors.accent} />
                        <Text
                          style={{
                            marginTop: spacing.sm,
                            color: colors.text,
                            fontWeight: "800",
                            textAlign: "center",
                          }}
                        >
                          QR preview could not be loaded.
                        </Text>
                        <Text
                          style={{
                            marginTop: spacing.sm,
                            color: colors.muted,
                            textAlign: "center",
                            lineHeight: 20,
                          }}
                        >
                          You can still pay manually to {merchantUpiId} using any UPI app.
                        </Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={{
                      marginTop: spacing.lg,
                      backgroundColor: "#ECFDF5",
                      borderRadius: radius.md,
                      padding: spacing.md,
                    }}
                  >
                    <Text style={{ color: colors.success, fontWeight: "900" }}>
                      Manual confirmation step
                    </Text>
                    <Text style={{ color: colors.text, marginTop: spacing.sm, lineHeight: 20 }}>
                      This checkout flow does not auto-verify UPI transfers yet. After you pay in
                      your UPI app, tap the final button below so the order can be saved with the
                      payment marked as completed.
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleOpenUpiApp}
                    style={{
                      marginTop: spacing.lg,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      borderRadius: radius.md,
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 52,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: "900" }}>
                      {Platform.OS === "web" ? "Use Any UPI App" : "Open UPI App"}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleUpiPayment}
                    disabled={submitting}
                    style={{
                      marginTop: spacing.md,
                      backgroundColor: colors.primary,
                      borderRadius: radius.md,
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 52,
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={{ color: colors.white, fontWeight: "900" }}>
                        I Have Paid, Place My Order
                      </Text>
                    )}
                  </Pressable>
                </View>
              ) : (
                <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg }}>
                  <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>
                    Wallet Payment
                  </Text>
                  <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 22 }}>
                    Spend from your approved wallet balance. If your balance is low, add money
                    from the Wallet section in your account and wait for admin approval.
                  </Text>

                  <View
                    style={{
                      marginTop: spacing.lg,
                      backgroundColor: hasEnoughWalletBalance ? "#ECFDF5" : "#FFF7ED",
                      borderRadius: radius.md,
                      padding: spacing.md,
                      gap: spacing.sm,
                    }}
                  >
                    <PriceRow label="Available Balance" value={formatCurrency(walletBalance)} />
                    <PriceRow label="Amount to Deduct" value={formatCurrency(total)} />
                    <PriceRow
                      label={hasEnoughWalletBalance ? "Balance After Order" : "Need to Add"}
                      value={formatCurrency(
                        hasEnoughWalletBalance ? walletBalance - total : walletShortfall
                      )}
                      highlight
                    />
                  </View>

                  <View
                    style={{
                      marginTop: spacing.lg,
                      backgroundColor: colors.bg,
                      borderRadius: radius.md,
                      padding: spacing.md,
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: "900" }}>
                      {hasEnoughWalletBalance
                        ? "Wallet is ready for this order."
                        : "Wallet balance is not enough yet."}
                    </Text>
                    <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 20 }}>
                      {hasEnoughWalletBalance
                        ? "The full amount will be deducted instantly once you place the order."
                        : `Add ${formatCurrency(walletShortfall)} or more in Wallet before paying from balance.`}
                    </Text>
                  </View>

                  <Pressable
                    onPress={handleWalletPayment}
                    disabled={submitting || !hasEnoughWalletBalance}
                    style={{
                      marginTop: spacing.lg,
                      backgroundColor:
                        submitting || !hasEnoughWalletBalance ? "#93C5FD" : colors.primary,
                      borderRadius: radius.md,
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 52,
                    }}
                  >
                    {submitting ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={{ color: colors.white, fontWeight: "900" }}>
                        Pay with Wallet
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}

              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <Pressable
                  onPress={() => setStep(1)}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    borderRadius: radius.md,
                    alignItems: "center",
                    paddingVertical: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "900" }}>Back to Summary</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push("/cart")}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    alignItems: "center",
                    paddingVertical: spacing.md,
                    backgroundColor: colors.white,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "800" }}>Review Cart</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
