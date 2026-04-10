import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, SafeAreaView, Text, View } from "react-native";

import { colors, radius, spacing } from "../constants/theme";
import { formatPaymentMethodLabel, formatPaymentStatusLabel } from "../lib/utils";

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { orderId, paymentMethod, paymentReference, paymentStatus } = useLocalSearchParams<{
    orderId: string;
    paymentMethod?: string;
    paymentReference?: string;
    paymentStatus?: string;
  }>();
  const scale = useRef(new Animated.Value(0.8)).current;
  const paymentMethodLabel = formatPaymentMethodLabel(paymentMethod);
  const paymentStatusLabel = formatPaymentStatusLabel(paymentStatus);
  const isCashOnDelivery = paymentMethod === "cash_on_delivery";
  const isWalletPayment = paymentMethod === "wallet";
  const title = isCashOnDelivery ? "Order Confirmed" : "Order Placed";
  const subtitle = isCashOnDelivery
    ? "Your order is confirmed. Please pay the delivery partner when the parcel arrives."
    : isWalletPayment
      ? "Your order is confirmed and the payment has been deducted from your wallet balance."
      : "Your order is saved with UPI payment marked as completed based on your confirmation.";

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  }, [scale]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flex: 1,
          padding: spacing.xxl,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale }],
            width: 112,
            height: 112,
            borderRadius: 56,
            backgroundColor: "#DCFCE7",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="checkmark" size={58} color={colors.success} />
        </Animated.View>

        <Text
          style={{
            marginTop: spacing.xl,
            fontSize: 28,
            fontWeight: "900",
            color: colors.text,
            textAlign: "center",
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            marginTop: spacing.sm,
            color: colors.muted,
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          {subtitle}
        </Text>

        <View
          style={{
            width: "100%",
            backgroundColor: colors.white,
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginTop: spacing.xl,
          }}
        >
          <Text style={{ color: colors.muted }}>Order ID</Text>
          <Text
            style={{
              color: colors.primaryDark,
              fontSize: 18,
              fontWeight: "900",
              marginTop: spacing.sm,
            }}
          >
            {orderId || "Processing"}
          </Text>
          <Text style={{ color: colors.muted, marginTop: spacing.lg }}>Payment Method</Text>
          <Text style={{ color: colors.text, fontWeight: "800", marginTop: spacing.sm }}>
            {paymentMethodLabel}
          </Text>
          <Text style={{ color: colors.muted, marginTop: spacing.lg }}>Payment Status</Text>
          <Text style={{ color: colors.text, fontWeight: "800", marginTop: spacing.sm }}>
            {paymentStatusLabel}
          </Text>
          {paymentReference ? (
            <>
              <Text style={{ color: colors.muted, marginTop: spacing.lg }}>Payment Reference</Text>
              <Text style={{ color: colors.text, fontWeight: "800", marginTop: spacing.sm }}>
                {paymentReference}
              </Text>
            </>
          ) : null}
          <Text style={{ color: colors.muted, marginTop: spacing.lg }}>Estimated delivery</Text>
          <Text style={{ color: colors.text, fontWeight: "800", marginTop: spacing.sm }}>
            3-5 business days
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/orders")}
          style={{
            marginTop: spacing.xl,
            width: "100%",
            backgroundColor: colors.primary,
            borderRadius: radius.md,
            alignItems: "center",
            paddingVertical: spacing.md,
          }}
        >
          <Text style={{ color: colors.white, fontWeight: "900" }}>Track Order</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/")}
          style={{
            marginTop: spacing.md,
            width: "100%",
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: radius.md,
            alignItems: "center",
            paddingVertical: spacing.md,
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: "900" }}>Continue Shopping</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
