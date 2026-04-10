import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import FullScreenLoader from "../../components/FullScreenLoader";
import { colors, orderStatusColors, radius, spacing } from "../../constants/theme";
import { auth } from "../../firebaseConfig";
import { useAuth } from "../../hooks/useAuth";
import {
  approveWalletTopUpRequest,
  rejectWalletTopUpRequest,
  saveUserProfile,
  subscribeToAllOrders,
  subscribeToProducts,
  subscribeToUsers,
  subscribeToWalletTopUpRequests,
  updateOrderStatus,
} from "../../lib/firebaseApi";
import { showToast } from "../../lib/toast";
import { formatCurrency, formatDate, truncateId } from "../../lib/utils";
import { Order, OrderStatus, Product, UserProfile, WalletTopUpRequest } from "../../types";

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "shipped",
  shipped: "delivered",
};

const panelStyle = {
  backgroundColor: colors.white,
  borderRadius: radius.xl,
  padding: spacing.lg,
  borderWidth: 1,
  borderColor: colors.border,
} as const;

const Section = ({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  action?: ReactNode;
}) => (
  <View style={panelStyle}>
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: spacing.md,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 20 }}>
          {subtitle}
        </Text>
      </View>
      {action}
    </View>
    <View style={{ marginTop: spacing.lg }}>{children}</View>
  </View>
);

const StatCard = ({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
}) => (
  <View
    style={{
      flex: 1,
      minWidth: 170,
      backgroundColor: `${tone}12`,
      borderRadius: radius.lg,
      padding: spacing.lg,
    }}
  >
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: `${tone}20`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={22} color={tone} />
    </View>
    <Text style={{ color: colors.text, fontSize: 26, fontWeight: "900", marginTop: spacing.md }}>
      {value}
    </Text>
    <Text style={{ color: colors.muted, marginTop: spacing.xs }}>{label}</Text>
  </View>
);

export default function AdminDashboardScreen() {
  const { profile, user, loading } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1100;

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [walletTopUps, setWalletTopUps] = useState<WalletTopUpRequest[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState({
    orders: true,
    products: true,
    users: true,
    walletTopUps: true,
  });

  useEffect(() => {
    const unsubscribeOrders = subscribeToAllOrders((value) => {
      setOrders(value);
      setLoadingState((current) => ({ ...current, orders: false }));
    });
    const unsubscribeProducts = subscribeToProducts((value) => {
      setProducts(value);
      setLoadingState((current) => ({ ...current, products: false }));
    });
    const unsubscribeUsers = subscribeToUsers((value) => {
      setUsers(value);
      setLoadingState((current) => ({ ...current, users: false }));
    });
    const unsubscribeWalletTopUps = subscribeToWalletTopUpRequests((value) => {
      setWalletTopUps(value);
      setLoadingState((current) => ({ ...current, walletTopUps: false }));
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeUsers();
      unsubscribeWalletTopUps();
    };
  }, []);

  const isLoading =
    loading ||
    loadingState.orders ||
    loadingState.products ||
    loadingState.users ||
    loadingState.walletTopUps;

  const pendingWalletTopUps = useMemo(
    () => walletTopUps.filter((item) => item.status === "pending"),
    [walletTopUps]
  );
  const pendingSellers = useMemo(
    () => users.filter((item) => item.role === "seller" && !item.storeApproved),
    [users]
  );
  const liveOrders = useMemo(
    () =>
      orders.filter(
        (item) => item.status !== "delivered" && item.status !== "cancelled"
      ),
    [orders]
  );
  const totalWalletBalance = useMemo(
    () => users.reduce((sum, item) => sum + (item.walletBalance || 0), 0),
    [users]
  );
  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);
  const recentUsers = useMemo(() => users.slice(0, 8), [users]);

  const runAction = async (key: string, action: () => Promise<void>) => {
    setBusyKey(key);
    try {
      await action();
    } catch {
      showToast("error", "Admin action failed", "Please try again in a moment.");
    } finally {
      setBusyKey(null);
    }
  };

  const handleAdvanceOrder = async (order: Order) => {
    const nextStatus = nextStatusMap[order.status];
    if (!nextStatus) {
      return;
    }

    await updateOrderStatus(order.orderId, nextStatus);
    showToast(
      "success",
      "Order updated",
      `Order #${truncateId(order.orderId)} moved to ${nextStatus}.`
    );
  };

  const handleApproveSeller = async (target: UserProfile) => {
    await saveUserProfile(target.uid, {
      role: "seller",
      storeApproved: true,
      storeName: target.storeName || target.name,
    });
    showToast("success", "Seller approved", `${target.name} can now start selling.`);
  };

  const handleApproveWalletTopUp = async (request: WalletTopUpRequest) => {
    if (!user) {
      return;
    }

    const result = await approveWalletTopUpRequest(request.id, {
      uid: user.uid,
      email: user.email,
    });

    showToast(
      "success",
      "Wallet credited",
      `${request.userName} now has ${formatCurrency(result.balanceAfter)} in wallet.`
    );
  };

  const handleRejectWalletTopUp = async (request: WalletTopUpRequest) => {
    if (!user) {
      return;
    }

    await rejectWalletTopUpRequest(
      request.id,
      {
        uid: user.uid,
        email: user.email,
      },
      "Rejected from admin dashboard"
    );
    showToast("success", "Wallet request rejected", `${request.userName} was notified.`);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    showToast("success", "Signed out", "Admin session closed.");
  };

  if (isLoading) {
    return <FullScreenLoader label="Loading admin controls..." />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <View
          style={{
            flexDirection: isDesktop ? "row" : "column",
            justifyContent: "space-between",
            alignItems: isDesktop ? "center" : "flex-start",
            gap: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <View>
            <Text style={{ color: colors.text, fontSize: 30, fontWeight: "900" }}>
              Admin Dashboard
            </Text>
            <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
              Signed in as {profile?.email || "admin"}.
            </Text>
          </View>

          <Pressable
            onPress={handleSignOut}
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "800" }}>Sign Out</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.lg }}>
          <StatCard
            label="Pending wallet approvals"
            value={`${pendingWalletTopUps.length}`}
            icon="wallet-outline"
            tone={colors.accent}
          />
          <StatCard
            label="Live orders"
            value={`${liveOrders.length}`}
            icon="receipt-outline"
            tone={colors.primary}
          />
          <StatCard
            label="Pending sellers"
            value={`${pendingSellers.length}`}
            icon="storefront-outline"
            tone={colors.success}
          />
          <StatCard
            label="User wallet total"
            value={formatCurrency(totalWalletBalance)}
            icon="cash-outline"
            tone={colors.teal}
          />
        </View>

        <View
          style={{
            flexDirection: isDesktop ? "row" : "column",
            gap: spacing.lg,
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 1, width: "100%", gap: spacing.lg }}>
            <Section
              title="Wallet Approval Queue"
              subtitle="Review UTR submissions and credit customer wallets after checking the payment."
              action={
                <View
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                    backgroundColor: colors.primaryLight,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "800" }}>
                    {pendingWalletTopUps.length} pending
                  </Text>
                </View>
              }
            >
              {pendingWalletTopUps.length === 0 ? (
                <Text style={{ color: colors.muted }}>
                  No wallet requests are waiting for approval right now.
                </Text>
              ) : (
                <View style={{ gap: spacing.md }}>
                  {pendingWalletTopUps.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.lg,
                        padding: spacing.lg,
                        backgroundColor: colors.bg,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: isDesktop ? "row" : "column",
                          justifyContent: "space-between",
                          gap: spacing.md,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 18 }}>
                            {item.userName}
                          </Text>
                          <Text style={{ color: colors.muted, marginTop: spacing.xs }}>
                            {item.userEmail}
                          </Text>
                          <Text style={{ color: colors.muted, marginTop: spacing.xs }}>
                            UTR: {item.utr}
                          </Text>
                          <Text style={{ color: colors.muted, marginTop: spacing.xs }}>
                            Submitted {formatDate(item.submittedAt, true)}
                          </Text>
                        </View>

                        <View style={{ alignItems: isDesktop ? "flex-end" : "flex-start" }}>
                          <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 24 }}>
                            {formatCurrency(item.amount)}
                          </Text>
                          <Text style={{ color: colors.muted, marginTop: spacing.xs }}>
                            UPI: {item.upiId}
                          </Text>
                        </View>
                      </View>

                      <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
                        <Pressable
                          onPress={() =>
                            runAction(`approve-${item.id}`, () => handleApproveWalletTopUp(item))
                          }
                          style={{
                            flex: 1,
                            backgroundColor: colors.primary,
                            borderRadius: radius.md,
                            alignItems: "center",
                            paddingVertical: spacing.md,
                            opacity: busyKey === `approve-${item.id}` ? 0.7 : 1,
                          }}
                        >
                          <Text style={{ color: colors.white, fontWeight: "900" }}>
                            {busyKey === `approve-${item.id}` ? "Approving..." : "Approve & Credit"}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            runAction(`reject-${item.id}`, () => handleRejectWalletTopUp(item))
                          }
                          style={{
                            flex: 1,
                            borderWidth: 1,
                            borderColor: colors.danger,
                            borderRadius: radius.md,
                            alignItems: "center",
                            paddingVertical: spacing.md,
                            backgroundColor: colors.white,
                            opacity: busyKey === `reject-${item.id}` ? 0.7 : 1,
                          }}
                        >
                          <Text style={{ color: colors.danger, fontWeight: "900" }}>
                            {busyKey === `reject-${item.id}` ? "Rejecting..." : "Reject"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Section>

            <Section
              title="Recent Orders"
              subtitle="Move active orders through the delivery pipeline."
            >
              {recentOrders.length === 0 ? (
                <Text style={{ color: colors.muted }}>Orders will appear here once buyers start checking out.</Text>
              ) : (
                <View style={{ gap: spacing.md }}>
                  {recentOrders.map((order) => {
                    const nextStatus = nextStatusMap[order.status];
                    return (
                      <View
                        key={order.orderId}
                        style={{
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: radius.lg,
                          padding: spacing.lg,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: spacing.md,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: "900" }}>
                              Order #{truncateId(order.orderId)}
                            </Text>
                            <Text style={{ color: colors.muted, marginTop: spacing.xs }}>
                              {order.buyerName} | {formatCurrency(order.totalAmount)}
                            </Text>
                            <Text style={{ color: colors.muted, marginTop: spacing.xs }}>
                              {formatDate(order.createdAt, true)}
                            </Text>
                          </View>

                          <View
                            style={{
                              paddingHorizontal: spacing.md,
                              paddingVertical: 6,
                              borderRadius: radius.pill,
                              backgroundColor: `${orderStatusColors[order.status] || colors.primary}18`,
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
                        </View>

                        {nextStatus ? (
                          <Pressable
                            onPress={() =>
                              runAction(`order-${order.orderId}`, () => handleAdvanceOrder(order))
                            }
                            style={{
                              marginTop: spacing.md,
                              backgroundColor: colors.primaryLight,
                              borderRadius: radius.md,
                              alignItems: "center",
                              paddingVertical: spacing.md,
                            }}
                          >
                            <Text style={{ color: colors.primaryDark, fontWeight: "900" }}>
                              {busyKey === `order-${order.orderId}`
                                ? "Updating..."
                                : `Move to ${nextStatus}`}
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </Section>
          </View>

          <View style={{ flex: 1, width: "100%", gap: spacing.lg }}>
            <Section
              title="Seller Approvals"
              subtitle="Approve seller accounts that are waiting for access."
            >
              {pendingSellers.length === 0 ? (
                <Text style={{ color: colors.muted }}>
                  No seller approvals are waiting right now.
                </Text>
              ) : (
                <View style={{ gap: spacing.md }}>
                  {pendingSellers.map((seller) => (
                    <View
                      key={seller.uid}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.lg,
                        padding: spacing.lg,
                      }}
                    >
                      <Text style={{ color: colors.text, fontWeight: "900" }}>{seller.name}</Text>
                      <Text style={{ color: colors.muted, marginTop: spacing.xs }}>
                        {seller.email}
                      </Text>
                      <Text style={{ color: colors.muted, marginTop: spacing.xs }}>
                        Store: {seller.storeName || "Not added yet"}
                      </Text>

                      <Pressable
                        onPress={() =>
                          runAction(`seller-${seller.uid}`, () => handleApproveSeller(seller))
                        }
                        style={{
                          marginTop: spacing.md,
                          backgroundColor: colors.success,
                          borderRadius: radius.md,
                          alignItems: "center",
                          paddingVertical: spacing.md,
                          opacity: busyKey === `seller-${seller.uid}` ? 0.7 : 1,
                        }}
                      >
                        <Text style={{ color: colors.white, fontWeight: "900" }}>
                          {busyKey === `seller-${seller.uid}` ? "Approving..." : "Approve Seller"}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </Section>

            <Section
              title="Users & Wallet Balances"
              subtitle="Quick view of account roles and current wallet balances."
            >
              {recentUsers.length === 0 ? (
                <Text style={{ color: colors.muted }}>Users will appear here after registration.</Text>
              ) : (
                <View style={{ gap: spacing.sm }}>
                  {recentUsers.map((item) => (
                    <View
                      key={item.uid}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: spacing.md,
                        paddingVertical: spacing.md,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: "800" }}>{item.name}</Text>
                        <Text style={{ color: colors.muted, marginTop: 2 }}>
                          {item.email}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ color: colors.primary, fontWeight: "900" }}>
                          {formatCurrency(item.walletBalance || 0)}
                        </Text>
                        <Text style={{ color: colors.muted, marginTop: 2, textTransform: "capitalize" }}>
                          {item.role}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Section>

            <Section
              title="Catalog Snapshot"
              subtitle="A quick pulse on the current marketplace catalog."
            >
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
                <StatCard
                  label="Active products"
                  value={`${products.length}`}
                  icon="grid-outline"
                  tone={colors.primary}
                />
                <StatCard
                  label="Total users"
                  value={`${users.length}`}
                  icon="people-outline"
                  tone={colors.accent}
                />
              </View>
            </Section>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
