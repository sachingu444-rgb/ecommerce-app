import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import AppImage from "../../components/AppImage";
import EmptyState from "../../components/EmptyState";
import { colors, orderStatusColors, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { fetchOrderById } from "../../lib/firebaseApi";
import {
  formatAddress,
  formatCurrency,
  formatDate,
  formatPaymentMethodLabel,
  formatPaymentStatusLabel,
  truncateId,
} from "../../lib/utils";
import { Order } from "../../types";

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!id) {
        return;
      }

      fetchOrderById(id).then(setOrder);
    }, [id])
  );

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
          <EmptyState
            icon="lock-closed-outline"
            title="Sign in to view order details"
            subtitle="Order timelines and delivery information are available after login."
            buttonLabel="Sign In"
            onPress={() => router.push("/(auth)/login")}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
          <EmptyState
            icon="receipt-outline"
            title="Order not found"
            subtitle="We couldn't load this order right now."
            buttonLabel="Back to Orders"
            onPress={() => router.push("/orders")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg }}>
          <Pressable
            onPress={() => router.back()}
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
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>
              Order #{truncateId(order.orderId)}
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>{formatDate(order.createdAt)}</Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginBottom: spacing.md,
          }}
        >
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: `${orderStatusColors[order.status] || colors.primary}18`,
              paddingHorizontal: spacing.md,
              paddingVertical: 6,
              borderRadius: radius.pill,
            }}
          >
            <Text
              style={{
                color: orderStatusColors[order.status] || colors.primary,
                fontWeight: "800",
                textTransform: "capitalize",
              }}
            >
              {order.status}
            </Text>
          </View>
          <Text style={{ color: colors.text, fontWeight: "800", marginTop: spacing.lg }}>
            Payment Method: {formatPaymentMethodLabel(order.paymentMethod)}
          </Text>
          <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
            Payment status: {formatPaymentStatusLabel(order.paymentStatus)}
          </Text>
          {order.paymentReference ? (
            <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
              Payment reference: {order.paymentReference}
            </Text>
          ) : null}
        </View>

        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginBottom: spacing.md,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: spacing.md }}>
            Delivery Address
          </Text>
          <Text style={{ color: colors.text, fontWeight: "800" }}>{order.deliveryAddress.name}</Text>
          <Text style={{ color: colors.muted, marginTop: spacing.sm }}>{order.deliveryAddress.phone}</Text>
          <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
            {formatAddress(order.deliveryAddress)}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: radius.lg,
            padding: spacing.lg,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: spacing.md }}>
            Items
          </Text>
          {order.items.map((item) => (
            <View key={`${item.productId}-${item.name}`} style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.md }}>
              <AppImage
                uri={item.image}
                resizeMode="contain"
                containerStyle={{ width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.bg }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "800" }}>{item.name}</Text>
                <Text style={{ color: colors.muted, marginTop: 4 }}>Qty: {item.quantity}</Text>
                <Text style={{ color: colors.primary, marginTop: 4, fontWeight: "900" }}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            </View>
          ))}

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text }}>Total</Text>
            <Text style={{ fontSize: 18, fontWeight: "900", color: colors.primary }}>
              {formatCurrency(order.totalAmount)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

