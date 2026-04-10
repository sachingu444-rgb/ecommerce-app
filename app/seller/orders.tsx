import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import OrderCard from "../../components/OrderCard";
import { colors, orderStatusColors, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { fetchSellerOrders, updateOrderStatus } from "../../lib/firebaseApi";
import { showToast } from "../../lib/toast";
import { formatCurrency, toDateValue } from "../../lib/utils";
import { Order, OrderStatus } from "../../types";

const filters: Array<{ label: string; value: "all" | OrderStatus }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const sellerStatuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
];

export default function SellerOrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | OrderStatus>("all");
  const [statusDrafts, setStatusDrafts] = useState<Record<string, OrderStatus>>({});

  const loadOrders = useCallback(() => {
    if (!user) {
      return;
    }
    fetchSellerOrders(user.uid).then((sellerOrders) => {
      setOrders(sellerOrders);
      const nextDrafts = sellerOrders.reduce<Record<string, OrderStatus>>((acc, order) => {
        acc[order.orderId] = order.status;
        return acc;
      }, {});
      setStatusDrafts(nextDrafts);
    });
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const filteredOrders = useMemo(
    () =>
      activeFilter === "all"
        ? orders
        : orders.filter((order) => order.status === activeFilter),
    [activeFilter, orders]
  );

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyOrders = orders.filter((order) => {
    const orderDate = toDateValue(order.createdAt) || new Date();
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  });
  const monthlyRevenue = monthlyOrders.reduce((total, order) => {
    return (
      total +
      order.items
        .filter((item) => item.sellerId === user?.uid)
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
    );
  }, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>Seller Orders</Text>
        <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
          Keep fulfillment moving with live status updates.
        </Text>

        <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }}>
          <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg }}>
            <Text style={{ color: colors.muted }}>Orders This Month</Text>
            <Text style={{ color: colors.text, fontWeight: "900", fontSize: 22, marginTop: spacing.sm }}>
              {monthlyOrders.length}
            </Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg }}>
            <Text style={{ color: colors.muted }}>Revenue This Month</Text>
            <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 22, marginTop: spacing.sm }}>
              {formatCurrency(monthlyRevenue)}
            </Text>
          </View>
        </View>

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

        {filteredOrders.map((order) => (
          <OrderCard
            key={order.orderId}
            order={order}
            sellerId={user?.uid}
            footer={
              <View>
                <Text style={{ color: colors.text, fontWeight: "800" }}>
                  Buyer: {order.buyerName}
                </Text>
                <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                  {order.items
                    .filter((item) => item.sellerId === user?.uid)
                    .map((item) => (
                      <View
                        key={`${order.orderId}-${item.productId}`}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text style={{ color: colors.muted, flex: 1 }}>
                          {item.name} x {item.quantity}
                        </Text>
                        <Text style={{ color: colors.text, fontWeight: "800" }}>
                          {formatCurrency(item.price * item.quantity)}
                        </Text>
                      </View>
                    ))}
                </View>
                <Text style={{ color: colors.text, fontWeight: "800", marginTop: spacing.lg, marginBottom: spacing.sm }}>
                  Update Status
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {sellerStatuses.map((status) => {
                    const active = statusDrafts[order.orderId] === status;
                    return (
                      <Pressable
                        key={`${order.orderId}-${status}`}
                        onPress={() =>
                          setStatusDrafts((current) => ({ ...current, [order.orderId]: status }))
                        }
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: radius.pill,
                          marginRight: spacing.sm,
                          backgroundColor: active ? orderStatusColors[status] : colors.bg,
                        }}
                      >
                        <Text style={{ color: active ? colors.white : colors.text, fontWeight: "800" }}>
                          {status}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Pressable
                  onPress={async () => {
                    await updateOrderStatus(order.orderId, statusDrafts[order.orderId]);
                    showToast("success", "Order status updated");
                    loadOrders();
                  }}
                  style={{
                    marginTop: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    borderRadius: radius.md,
                    alignItems: "center",
                    paddingVertical: spacing.sm + 2,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "800" }}>Update</Text>
                </Pressable>
              </View>
            }
          />
        ))}

        {filteredOrders.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              padding: spacing.xl,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "900", fontSize: 18 }}>
              No seller orders yet
            </Text>
            <Text style={{ color: colors.muted, marginTop: spacing.sm, textAlign: "center" }}>
              Orders containing your products will appear here once buyers check out.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
