import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import EmptyState from "../../components/EmptyState";
import OrderCard from "../../components/OrderCard";
import { colors, orderStatusColors, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { fetchBuyerOrders } from "../../lib/firebaseApi";
import { Order, OrderStatus } from "../../types";

const filters: Array<{ label: string; value: "all" | OrderStatus }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | OrderStatus>("all");

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setOrders([]);
        return;
      }

      fetchBuyerOrders(user.uid).then(setOrders);
    }, [user])
  );

  const filteredOrders = useMemo(
    () =>
      activeFilter === "all"
        ? orders
        : orders.filter((order) => order.status === activeFilter),
    [activeFilter, orders]
  );

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
          <EmptyState
            icon="receipt-outline"
            title="Sign in to track orders"
            subtitle="Your order history and live status updates will show up here after login."
            buttonLabel="Sign In"
            onPress={() => router.push("/(auth)/login")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>My Orders</Text>
        <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
          Review, reorder and track every purchase.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.lg }}>
          {filters.map((filter) => {
            const active = activeFilter === filter.value;
            return (
              <Pressable
                key={filter.value}
                onPress={() => setActiveFilter(filter.value)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm + 2,
                  borderRadius: radius.pill,
                  marginRight: spacing.sm,
                  backgroundColor: active ? orderStatusColors[filter.value] || colors.primary : colors.white,
                }}
              >
                <Text style={{ color: active ? colors.white : colors.text, fontWeight: "800" }}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filteredOrders.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="No orders yet"
            subtitle="Your confirmed purchases will appear here with live delivery updates."
            buttonLabel="Start Shopping"
            onPress={() => router.push("/")}
          />
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              actionLabel="Track Order"
              onActionPress={() => router.push(`/order/${order.orderId}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
