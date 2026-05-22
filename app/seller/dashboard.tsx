import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import { sellerQuickActionColors } from "../../constants/mockData";
import { colors, orderStatusColors, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { subscribeToSellerOrders, subscribeToSellerProducts } from "../../lib/firebaseApi";
import { formatCurrency, formatDate, toDateValue, truncateId } from "../../lib/utils";
import { Order, Product } from "../../types";

const quickActions = [
  { label: "Add Product", icon: "add-circle-outline", route: "/seller/add-product" },
  { label: "View Products", icon: "cube-outline", route: "/seller/products" },
  { label: "View Orders", icon: "receipt-outline", route: "/seller/orders" },
  { label: "Edit Profile", icon: "create-outline", route: "/seller/profile" },
];

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setProducts([]);
      setOrders([]);
      return;
    }

    const unsubscribeProducts = subscribeToSellerProducts(user.uid, setProducts);
    const unsubscribeOrders = subscribeToSellerOrders(user.uid, setOrders);

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, [user?.uid]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const revenueThisMonth = useMemo(() => {
    return orders.reduce((total, order) => {
      const orderDate = toDateValue(order.createdAt) || new Date();
      if (orderDate.getMonth() !== currentMonth || orderDate.getFullYear() !== currentYear) {
        return total;
      }

      return (
        total +
        order.items
          .filter((item) => item.sellerId === user?.uid)
          .reduce((sum, item) => sum + item.price * item.quantity, 0)
      );
    }, 0);
  }, [currentMonth, currentYear, orders, user?.uid]);

  const activeProducts = products.filter((product) => product.isActive);
  const pausedProducts = products.filter((product) => !product.isActive);
  const dealProducts = products.filter((product) => product.isDeal);
  const outOfStockProducts = products.filter((product) => product.stock <= 0);
  const activeOrders = orders.filter(
    (order) => order.status !== "delivered" && order.status !== "cancelled"
  );
  const pendingOrders = orders.filter((order) => order.status === "pending").length;
  const lowStock = products.filter((product) => product.stock > 0 && product.stock < 5);
  const recentOrders = orders.slice(0, 5);
  const stats = [
    { label: "Total Products", value: products.length, icon: "cube-outline", color: colors.primary },
    { label: "Live Products", value: activeProducts.length, icon: "storefront-outline", color: colors.success },
    { label: "Orders In Progress", value: activeOrders.length, icon: "receipt-outline", color: colors.teal },
    {
      label: "Revenue This Month",
      value: formatCurrency(revenueThisMonth),
      icon: "wallet-outline",
      color: colors.accent,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ backgroundColor: colors.primary, padding: spacing.lg }}>
          <Text style={{ color: colors.white, fontSize: 30, fontWeight: "900" }}>Seller Dashboard</Text>
          <Text style={{ color: "rgba(255,255,255,0.82)", marginTop: spacing.sm }}>
            {profile?.storeName || "Your Store"}
          </Text>
          <View
            style={{
              alignSelf: "flex-start",
              marginTop: spacing.md,
              backgroundColor: colors.accent,
              paddingHorizontal: spacing.md,
              paddingVertical: 6,
              borderRadius: radius.pill,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: "800" }}>Seller</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={{
                width: 180,
                backgroundColor: `${stat.color}16`,
                borderRadius: radius.lg,
                padding: spacing.lg,
                marginRight: spacing.md,
              }}
            >
              <Ionicons name={stat.icon as keyof typeof Ionicons.glyphMap} size={24} color={stat.color} />
              <Text style={{ color: colors.text, fontWeight: "900", fontSize: 22, marginTop: spacing.md }}>
                {stat.value}
              </Text>
              <Text style={{ color: colors.muted, marginTop: spacing.sm }}>{stat.label}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={{ padding: spacing.lg }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, marginBottom: spacing.md }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {quickActions.map((action, index) => (
              <Pressable
                key={action.label}
                onPress={() => router.push(action.route as never)}
                style={{
                  width: "48%",
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  backgroundColor: sellerQuickActionColors[index],
                  marginBottom: spacing.md,
                }}
              >
                <Ionicons
                  name={action.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={colors.white}
                />
                <Text style={{ color: colors.white, fontWeight: "900", fontSize: 16, marginTop: spacing.md }}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginTop: spacing.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
              Store Health
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.md }}>
              {[
                { label: "Paused", value: pausedProducts.length, color: colors.muted },
                { label: "Out of Stock", value: outOfStockProducts.length, color: colors.danger },
                { label: "Deals", value: dealProducts.length, color: colors.accent },
                { label: "Pending Orders", value: pendingOrders, color: colors.purple },
              ].map((item) => (
                <View
                  key={item.label}
                  style={{
                    flex: 1,
                    minWidth: 130,
                    backgroundColor: `${item.color}12`,
                    borderRadius: radius.md,
                    padding: spacing.md,
                  }}
                >
                  <Text style={{ color: item.color, fontSize: 22, fontWeight: "900" }}>
                    {item.value}
                  </Text>
                  <Text style={{ color: colors.muted, marginTop: 4, fontWeight: "700" }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View
            style={{
              marginTop: spacing.xl,
              marginBottom: spacing.md,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text }}>Recent Orders</Text>
            <Pressable onPress={() => router.push("/seller/orders")}>
              <Text style={{ color: colors.primary, fontWeight: "800" }}>View All</Text>
            </Pressable>
          </View>

          {recentOrders.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.white,
                borderRadius: radius.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "900" }}>
                No seller orders yet
              </Text>
              <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
                Buyer orders for your live products will appear here automatically.
              </Text>
            </View>
          ) : null}

          {recentOrders.map((order) => {
            const sellerAmount = order.items
              .filter((item) => item.sellerId === user?.uid)
              .reduce((total, item) => total + item.price * item.quantity, 0);
            return (
              <View
                key={order.orderId}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={{ color: colors.text, fontWeight: "900" }}>
                      Order #{truncateId(order.orderId)}
                    </Text>
                    <Text style={{ color: colors.muted, marginTop: 4 }}>{formatDate(order.createdAt)}</Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: `${orderStatusColors[order.status] || colors.primary}18`,
                      borderRadius: radius.pill,
                      paddingHorizontal: spacing.md,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ color: orderStatusColors[order.status] || colors.primary, fontWeight: "800" }}>
                      {order.status}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.primary, marginTop: spacing.md, fontWeight: "900" }}>
                  {formatCurrency(sellerAmount)}
                </Text>
              </View>
            );
          })}

          {lowStock.length > 0 ? (
            <>
              <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, marginBottom: spacing.md, marginTop: spacing.lg }}>
                Low Stock Alert
              </Text>
              {lowStock.map((product) => (
                <View
                  key={product.id}
                  style={{
                    backgroundColor: "#FEF2F2",
                    borderRadius: radius.lg,
                    padding: spacing.lg,
                    marginBottom: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.danger, fontWeight: "900" }}>{product.name}</Text>
                  <Text style={{ color: colors.danger, marginTop: spacing.sm }}>
                    Only {product.stock} units left. Restock soon to avoid missed sales.
                  </Text>
                </View>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
