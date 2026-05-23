import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import type { DimensionValue } from "react-native";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import FormField from "../../components/FormField";
import SellerProductCard from "../../components/SellerProductCard";
import SellerProductForm from "../../components/SellerProductForm";
import type { SellerProductFormValues } from "../../components/SellerProductForm";
import { colors, orderStatusColors, radius, shadows, spacing } from "../../constants/theme";
import { auth } from "../../firebaseConfig";
import { useAuth } from "../../hooks/useAuth";
import { getFirebaseGenericErrorMessage } from "../../lib/firebaseErrors";
import {
  deleteProduct,
  saveUserProfile,
  subscribeToSellerOrders,
  subscribeToSellerProducts,
  updateProduct,
} from "../../lib/firebaseApi";
import { showToast } from "../../lib/toast";
import { uploadProduct } from "../../lib/uploadProduct";
import { formatCurrency, formatDate, toDateValue, truncateId } from "../../lib/utils";
import { Order, OrderStatus, Product } from "../../types";

type SellerPanel = "dashboard" | "inventory" | "orders" | "add-product" | "profile";

interface MetricCardProps {
  label: string;
  value: string;
  sublabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const actionItems: Array<{
  label: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  panel: SellerPanel;
}> = [
  {
    label: "Add Product",
    detail: "Publish a new listing",
    icon: "add-circle-outline",
    panel: "add-product",
  },
  {
    label: "Inventory",
    detail: "Manage stock and listings",
    icon: "file-tray-stacked-outline",
    panel: "inventory",
  },
  {
    label: "Orders",
    detail: "Update fulfillment status",
    icon: "receipt-outline",
    panel: "orders",
  },
  {
    label: "Store Profile",
    detail: "Payout and storefront details",
    icon: "storefront-outline",
    panel: "profile",
  },
];

const toolbarItems: Array<{
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  panel: SellerPanel;
}> = [
  { label: "Dashboard", icon: "grid-outline", panel: "dashboard" },
  { label: "Inventory", icon: "file-tray-stacked-outline", panel: "inventory" },
  { label: "Orders", icon: "receipt-outline", panel: "orders" },
  { label: "Add Product", icon: "add-circle-outline", panel: "add-product" },
  { label: "Store Profile", icon: "person-circle-outline", panel: "profile" },
];

const orderPipeline: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];

const panelStyle = {
  backgroundColor: colors.white,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.card,
} as const;

const sellerOrderAmount = (order: Order, sellerId?: string) =>
  order.items
    .filter((item) => item.sellerId === sellerId)
    .reduce((total, item) => total + item.price * item.quantity, 0);

const getMonthlyOrders = (orders: Order[]) => {
  const now = new Date();
  return orders.filter((order) => {
    const orderDate = toDateValue(order.createdAt) || new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  });
};

const MetricCard = ({ label, value, sublabel, icon, color }: MetricCardProps) => (
  <View
    style={[
      panelStyle,
      {
        flex: 1,
        minWidth: 165,
        padding: spacing.lg,
      },
    ]}
  >
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: `${color}18`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={21} color={color} />
    </View>
    <Text style={{ color: colors.text, fontSize: 24, fontWeight: "900", marginTop: spacing.md }}>
      {value}
    </Text>
    <Text style={{ color: colors.text, fontWeight: "800", marginTop: 2 }}>{label}</Text>
    <Text style={{ color: colors.muted, marginTop: spacing.xs, lineHeight: 18 }}>{sublabel}</Text>
  </View>
);

const SectionHeader = ({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
    <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>{title}</Text>
    {actionLabel && onAction ? (
      <Pressable onPress={onAction}>
        <Text style={{ color: colors.primary, fontWeight: "900" }}>{actionLabel}</Text>
      </Pressable>
    ) : null}
  </View>
);

const SellerToolbar = ({
  activePanel,
  compact,
  storeName,
  onNavigate,
}: {
  activePanel: SellerPanel;
  compact: boolean;
  storeName: string;
  onNavigate: (panel: SellerPanel) => void;
}) => {
  if (compact) {
    return (
      <View
        style={{
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingVertical: spacing.sm,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
        >
          {toolbarItems.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => onNavigate(item.panel)}
              style={{
                minHeight: 42,
                borderRadius: radius.pill,
                paddingHorizontal: spacing.md,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                backgroundColor: item.panel === activePanel ? colors.primary : colors.bg,
                borderWidth: 1,
                borderColor: item.panel === activePanel ? colors.primary : colors.border,
              }}
            >
              <Ionicons
                name={item.icon}
                size={17}
                color={item.panel === activePanel ? colors.white : colors.text}
              />
              <Text
                style={{
                  color: item.panel === activePanel ? colors.white : colors.text,
                  fontWeight: "900",
                  fontSize: 13,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={{
        width: 238,
        backgroundColor: colors.white,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        padding: spacing.lg,
        gap: spacing.lg,
      }}
    >
      <View style={{ gap: spacing.xs }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="storefront" size={22} color={colors.white} />
        </View>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", marginTop: spacing.sm }}>
          Seller Panel
        </Text>
        <Text style={{ color: colors.muted, lineHeight: 18 }}>{storeName}</Text>
      </View>

      <View style={{ gap: spacing.xs }}>
        {toolbarItems.map((item) => (
          <Pressable
            key={item.label}
            onPress={() => onNavigate(item.panel)}
            style={{
              minHeight: 46,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              backgroundColor: item.panel === activePanel ? colors.primaryLight : colors.white,
            }}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={item.panel === activePanel ? colors.primary : colors.muted}
            />
            <Text
              style={{
                color: item.panel === activePanel ? colors.primaryDark : colors.text,
                flex: 1,
                fontWeight: item.panel === activePanel ? "900" : "800",
              }}
            >
              {item.label}
            </Text>
            {item.panel === activePanel ? (
              <View style={{ width: 6, height: 24, borderRadius: 3, backgroundColor: colors.primary }} />
            ) : null}
          </Pressable>
        ))}
      </View>

      <View
        style={{
          marginTop: "auto",
          backgroundColor: colors.bg,
          borderRadius: radius.lg,
          padding: spacing.md,
          gap: spacing.sm,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: "900" }}>Today focus</Text>
        <Text style={{ color: colors.muted, lineHeight: 19 }}>
          Confirm new orders, restock low inventory, and keep listings live.
        </Text>
      </View>
    </View>
  );
};

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activePanel, setActivePanel] = useState<SellerPanel>("dashboard");
  const [inventoryQuery, setInventoryQuery] = useState("");
  const [inventoryFilter, setInventoryFilter] = useState<"all" | "active" | "low" | "out" | "paused">("all");
  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all");
  const [productLoading, setProductLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [profileLoading, setProfileLoading] = useState(false);
  const [storeNameInput, setStoreNameInput] = useState(profile?.storeName || "");
  const [ownerNameInput, setOwnerNameInput] = useState(profile?.name || "");
  const [phoneInput, setPhoneInput] = useState(profile?.phone || "");
  const [storeDescriptionInput, setStoreDescriptionInput] = useState(profile?.storeDescription || "");
  const [upiIdInput, setUpiIdInput] = useState(profile?.upiId || "");
  const [bankAccountNameInput, setBankAccountNameInput] = useState(profile?.bankAccountName || "");
  const [bankAccountNumberInput, setBankAccountNumberInput] = useState(profile?.bankAccountNumber || "");
  const [ifscCodeInput, setIfscCodeInput] = useState(profile?.ifscCode || "");

  const isWide = width >= 900;

  useEffect(() => {
    setStoreNameInput(profile?.storeName || "");
    setOwnerNameInput(profile?.name || "");
    setPhoneInput(profile?.phone || "");
    setStoreDescriptionInput(profile?.storeDescription || "");
    setUpiIdInput(profile?.upiId || "");
    setBankAccountNameInput(profile?.bankAccountName || "");
    setBankAccountNumberInput(profile?.bankAccountNumber || "");
    setIfscCodeInput(profile?.ifscCode || "");
  }, [profile]);

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

  const dashboard = useMemo(() => {
    const monthlyOrders = getMonthlyOrders(orders);
    const monthlyRevenue = monthlyOrders.reduce(
      (total, order) => total + sellerOrderAmount(order, user?.uid),
      0
    );
    const totalRevenue = orders.reduce(
      (total, order) => total + sellerOrderAmount(order, user?.uid),
      0
    );
    const activeProducts = products.filter((product) => product.isActive);
    const pausedProducts = products.filter((product) => !product.isActive);
    const outOfStockProducts = products.filter((product) => product.stock <= 0);
    const lowStockProducts = products
      .filter((product) => product.stock > 0 && product.stock <= 5)
      .sort((a, b) => a.stock - b.stock);
    const inventoryValue = products.reduce(
      (total, product) => total + product.price * Math.max(product.stock, 0),
      0
    );
    const pendingOrders = orders.filter((order) => order.status === "pending");
    const activeOrders = orders.filter(
      (order) => order.status !== "delivered" && order.status !== "cancelled"
    );
    const averageOrderValue = orders.length ? totalRevenue / orders.length : 0;
    const liveRate = products.length ? Math.round((activeProducts.length / products.length) * 100) : 0;
    const stockRiskCount = lowStockProducts.length + outOfStockProducts.length;
    const topProducts = [...products]
      .sort((a, b) => b.reviews - a.reviews || b.rating - a.rating || b.stock - a.stock)
      .slice(0, 4);
    const categories = products.reduce<Record<string, number>>((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {});
    const topCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      activeOrders,
      activeProducts,
      averageOrderValue,
      inventoryValue,
      liveRate,
      lowStockProducts,
      monthlyOrders,
      monthlyRevenue,
      outOfStockProducts,
      pausedProducts,
      pendingOrders,
      stockRiskCount,
      topCategories,
      topProducts,
      totalRevenue,
    };
  }, [orders, products, user?.uid]);

  const checklist = [
    {
      label: "Store name",
      complete: Boolean(profile?.storeName?.trim()),
      panel: "profile" as SellerPanel,
    },
    {
      label: "Payout UPI or bank details",
      complete: Boolean(profile?.upiId || profile?.bankAccountNumber),
      panel: "profile" as SellerPanel,
    },
    {
      label: "At least one live product",
      complete: dashboard.activeProducts.length > 0,
      panel: "add-product" as SellerPanel,
    },
    {
      label: "No out-of-stock listings",
      complete: dashboard.outOfStockProducts.length === 0,
      panel: "inventory" as SellerPanel,
    },
  ];
  const checklistDone = checklist.filter((item) => item.complete).length;
  const recentOrders = orders.slice(0, 5);
  const storeName = profile?.storeName || "Your Store";
  const currentUser = auth.currentUser || user;
  const sellerName =
    profile?.storeName?.trim() ||
    profile?.name?.trim() ||
    currentUser?.displayName ||
    "ShopApp Seller";
  const maxPipelineCount = Math.max(
    1,
    ...orderPipeline.map((status) => orders.filter((order) => order.status === status).length)
  );
  const maxCategoryCount = Math.max(1, ...dashboard.topCategories.map(([, count]) => count));
  const filteredProducts = products.filter((product) => {
    const query = inventoryQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.sellerName.toLowerCase().includes(query);
    const matchesFilter =
      inventoryFilter === "all" ||
      (inventoryFilter === "active" && product.isActive) ||
      (inventoryFilter === "low" && product.stock > 0 && product.stock <= 5) ||
      (inventoryFilter === "out" && product.stock <= 0) ||
      (inventoryFilter === "paused" && !product.isActive);
    return matchesQuery && matchesFilter;
  });
  const filteredOrders =
    orderFilter === "all" ? orders : orders.filter((order) => order.status === orderFilter);

  const handleAddProduct = async (values: SellerProductFormValues) => {
    const parsedPrice = Number(values.price);
    const parsedOriginalPrice = Number(values.originalPrice);
    const parsedStock = Number(values.stock);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      showToast("error", "Invalid price", "Enter a valid selling price.");
      return;
    }

    if (!Number.isFinite(parsedOriginalPrice) || parsedOriginalPrice <= 0) {
      showToast("error", "Invalid original price", "Enter a valid original price.");
      return;
    }

    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      showToast("error", "Invalid stock", "Enter a valid stock quantity.");
      return;
    }

    try {
      setProductLoading(true);
      setUploadProgress(0);
      await uploadProduct({
        name: values.name,
        subtitle: values.subtitle,
        brand: values.brand,
        price: parsedPrice,
        originalPrice: parsedOriginalPrice,
        imageUris: values.newAssets.map((asset) => asset.uri),
        category: values.category,
        description: values.description,
        stock: parsedStock,
        sellerName,
        isFeatured: values.isFeatured,
        isDeal: values.isDeal,
        highlights: values.highlights,
        specifications: values.specifications,
        options: values.options,
        deliveryInfo: values.deliveryInfo,
        returnPolicy: values.returnPolicy,
        warranty: values.warranty,
        onProgress: setUploadProgress,
      });
      showToast("success", "Product added", "Your listing is live in seller inventory.");
      setActivePanel("inventory");
    } catch (error) {
      console.error("[SellerDashboard] Failed to add product", error);
      showToast(
        "error",
        "Could not add product",
        getFirebaseGenericErrorMessage(error, "Please check your connection and try again.")
      );
    } finally {
      setProductLoading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setProfileLoading(true);
      await saveUserProfile(user.uid, {
        name: ownerNameInput.trim(),
        storeName: storeNameInput.trim(),
        phone: phoneInput.trim(),
        storeDescription: storeDescriptionInput.trim(),
        upiId: upiIdInput.trim(),
        bankAccountName: bankAccountNameInput.trim(),
        bankAccountNumber: bankAccountNumberInput.trim(),
        ifscCode: ifscCodeInput.trim(),
      });
      showToast("success", "Store profile saved");
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, flexDirection: isWide ? "row" : "column" }}>
        <SellerToolbar
          activePanel={activePanel}
          compact={!isWide}
          storeName={storeName}
          onNavigate={setActivePanel}
        />
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} style={{ flex: 1 }}>
        <View
          style={{
            backgroundColor: colors.primaryDark,
            padding: spacing.lg,
            paddingBottom: spacing.xxl,
          }}
        >
          <View style={{ width: "100%", maxWidth: 1180, alignSelf: "center" }}>
            <View
              style={{
                flexDirection: isWide ? "row" : "column",
                justifyContent: "space-between",
                gap: spacing.lg,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.white, fontSize: 31, fontWeight: "900" }}>
                  Seller Dashboard
                </Text>
                <Text style={{ color: "#DCEBFA", marginTop: spacing.sm, lineHeight: 22 }}>
                  {storeName} inventory, orders, revenue, and setup tasks in one easy workspace.
                </Text>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                <Pressable
                  onPress={() => setActivePanel("add-product")}
                  style={{
                    backgroundColor: colors.accent,
                    borderRadius: radius.md,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                >
                  <Ionicons name="add" size={18} color={colors.white} />
                  <Text style={{ color: colors.white, fontWeight: "900" }}>Add Product</Text>
                </Pressable>
                <Pressable
                  onPress={() => setActivePanel("orders")}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.25)",
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                  }}
                >
                  <Ionicons name="receipt-outline" size={18} color={colors.white} />
                  <Text style={{ color: colors.white, fontWeight: "900" }}>Orders</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View style={{ width: "100%", maxWidth: 1180, alignSelf: "center", padding: spacing.lg }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: -42 }}>
            <MetricCard
              label="Monthly Revenue"
              value={formatCurrency(dashboard.monthlyRevenue)}
              sublabel={`${dashboard.monthlyOrders.length} orders this month`}
              icon="trending-up-outline"
              color={colors.success}
            />
            <MetricCard
              label="Active Orders"
              value={`${dashboard.activeOrders.length}`}
              sublabel={`${dashboard.pendingOrders.length} waiting for confirmation`}
              icon="timer-outline"
              color={colors.teal}
            />
            <MetricCard
              label="Inventory Value"
              value={formatCurrency(dashboard.inventoryValue)}
              sublabel={`${products.length} total listings`}
              icon="file-tray-stacked-outline"
              color={colors.primary}
            />
            <MetricCard
              label="Average Order"
              value={formatCurrency(dashboard.averageOrderValue)}
              sublabel={`${dashboard.liveRate}% listings are live`}
              icon="card-outline"
              color={colors.accent}
            />
          </View>

          {activePanel === "dashboard" ? (
          <View
            style={{
              flexDirection: isWide ? "row" : "column",
              gap: spacing.lg,
              marginTop: spacing.lg,
              alignItems: "stretch",
            }}
          >
            <View style={{ flex: 1.45, gap: spacing.lg }}>
              <View style={[panelStyle, { padding: spacing.lg, gap: spacing.lg }]}>
                <SectionHeader
                  title="Fulfillment Pipeline"
                  actionLabel="Manage"
                  onAction={() => setActivePanel("orders")}
                />
                {orderPipeline.map((status) => {
                  const count = orders.filter((order) => order.status === status).length;
                  const statusColor = orderStatusColors[status] || colors.primary;
                  const widthPercent: DimensionValue = `${Math.max(
                    8,
                    (count / maxPipelineCount) * 100
                  )}%`;

                  return (
                    <View key={status} style={{ gap: spacing.sm }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ color: colors.text, fontWeight: "800", textTransform: "capitalize" }}>
                          {status}
                        </Text>
                        <Text style={{ color: colors.muted, fontWeight: "800" }}>{count}</Text>
                      </View>
                      <View
                        style={{
                          height: 10,
                          borderRadius: radius.pill,
                          backgroundColor: colors.bg,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            width: widthPercent,
                            height: "100%",
                            backgroundColor: statusColor,
                            borderRadius: radius.pill,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={[panelStyle, { padding: spacing.lg, gap: spacing.lg }]}>
                <SectionHeader
                  title="Inventory Control"
                  actionLabel="Open Inventory"
                  onAction={() => setActivePanel("inventory")}
                />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
                  {[
                    { label: "Live", value: dashboard.activeProducts.length, color: colors.success },
                    { label: "Paused", value: dashboard.pausedProducts.length, color: colors.muted },
                    { label: "Low Stock", value: dashboard.lowStockProducts.length, color: colors.warning },
                    { label: "Out", value: dashboard.outOfStockProducts.length, color: colors.danger },
                  ].map((item) => (
                    <View
                      key={item.label}
                      style={{
                        flex: 1,
                        minWidth: 115,
                        backgroundColor: `${item.color}14`,
                        borderRadius: radius.md,
                        padding: spacing.md,
                      }}
                    >
                      <Text style={{ color: item.color, fontSize: 24, fontWeight: "900" }}>
                        {item.value}
                      </Text>
                      <Text style={{ color: colors.text, fontWeight: "800", marginTop: 2 }}>
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {dashboard.stockRiskCount === 0 ? (
                  <View
                    style={{
                      backgroundColor: `${colors.success}12`,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      flexDirection: "row",
                      gap: spacing.sm,
                    }}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
                    <Text style={{ color: colors.text, flex: 1, lineHeight: 21 }}>
                      Inventory looks healthy. No low-stock or out-of-stock products need attention.
                    </Text>
                  </View>
                ) : (
                  dashboard.lowStockProducts.slice(0, 4).map((product) => (
                    <Pressable
                      key={product.id}
                      onPress={() =>
                        router.push({ pathname: "/seller/edit-product", params: { id: product.id } })
                      }
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        paddingTop: spacing.md,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        gap: spacing.md,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: "900" }}>{product.name}</Text>
                        <Text style={{ color: colors.muted, marginTop: 3 }}>{product.category}</Text>
                      </View>
                      <Text style={{ color: colors.danger, fontWeight: "900" }}>
                        {product.stock} left
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>

              <View style={[panelStyle, { padding: spacing.lg, gap: spacing.md }]}>
                <SectionHeader
                  title="Recent Orders"
                  actionLabel="View All"
                  onAction={() => setActivePanel("orders")}
                />
                {recentOrders.length === 0 ? (
                  <Text style={{ color: colors.muted, lineHeight: 22 }}>
                    Orders containing your products will appear here once buyers check out.
                  </Text>
                ) : (
                  recentOrders.map((order) => {
                    const statusColor = orderStatusColors[order.status] || colors.primary;
                    return (
                      <Pressable
                        key={order.orderId}
                        onPress={() => setActivePanel("orders")}
                        style={{
                          borderTopWidth: 1,
                          borderTopColor: colors.border,
                          paddingTop: spacing.md,
                          gap: spacing.sm,
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.text, fontWeight: "900" }}>
                              Order #{truncateId(order.orderId)}
                            </Text>
                            <Text style={{ color: colors.muted, marginTop: 3 }}>
                              {order.buyerName} - {formatDate(order.createdAt)}
                            </Text>
                          </View>
                          <View
                            style={{
                              backgroundColor: `${statusColor}16`,
                              borderRadius: radius.pill,
                              paddingHorizontal: spacing.md,
                              paddingVertical: 6,
                              alignSelf: "flex-start",
                            }}
                          >
                            <Text style={{ color: statusColor, fontWeight: "900", textTransform: "capitalize" }}>
                              {order.status}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ color: colors.primary, fontWeight: "900" }}>
                          {formatCurrency(sellerOrderAmount(order, user?.uid))}
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </View>

            <View style={{ flex: 1, gap: spacing.lg }}>
              <View style={[panelStyle, { padding: spacing.lg, gap: spacing.md }]}>
                <SectionHeader title="Seller Shortcuts" />
                {actionItems.map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={() => setActivePanel(item.panel)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.md,
                      paddingVertical: spacing.sm,
                    }}
                  >
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 21,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: colors.primaryLight,
                      }}
                    >
                      <Ionicons name={item.icon} size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "900" }}>{item.label}</Text>
                      <Text style={{ color: colors.muted, marginTop: 2 }}>{item.detail}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </Pressable>
                ))}
              </View>

              <View style={[panelStyle, { padding: spacing.lg, gap: spacing.md }]}>
                <SectionHeader title="Store Setup" />
                <View
                  style={{
                    height: 10,
                    borderRadius: radius.pill,
                    backgroundColor: colors.bg,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: `${(checklistDone / checklist.length) * 100}%` as DimensionValue,
                      height: "100%",
                      borderRadius: radius.pill,
                      backgroundColor: colors.success,
                    }}
                  />
                </View>
                <Text style={{ color: colors.muted, fontWeight: "800" }}>
                  {checklistDone} of {checklist.length} steps complete
                </Text>
                {checklist.map((item) => (
                  <Pressable
                    key={item.label}
                    onPress={() => setActivePanel(item.panel)}
                    style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
                  >
                    <Ionicons
                      name={item.complete ? "checkmark-circle" : "ellipse-outline"}
                      size={20}
                      color={item.complete ? colors.success : colors.muted}
                    />
                    <Text style={{ color: colors.text, flex: 1, fontWeight: "800" }}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={[panelStyle, { padding: spacing.lg, gap: spacing.md }]}>
                <SectionHeader title="Category Mix" />
                {dashboard.topCategories.length === 0 ? (
                  <Text style={{ color: colors.muted }}>Add products to see category distribution.</Text>
                ) : (
                  dashboard.topCategories.map(([category, count]) => (
                    <View key={category} style={{ gap: spacing.sm }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ color: colors.text, fontWeight: "800" }}>{category}</Text>
                        <Text style={{ color: colors.muted, fontWeight: "800" }}>{count}</Text>
                      </View>
                      <View
                        style={{
                          height: 8,
                          borderRadius: radius.pill,
                          backgroundColor: colors.bg,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            height: "100%",
                            width: `${Math.max(
                              8,
                              (count / maxCategoryCount) * 100
                            )}%` as DimensionValue,
                            backgroundColor: colors.primary,
                          }}
                        />
                      </View>
                    </View>
                  ))
                )}
              </View>

              <View style={[panelStyle, { padding: spacing.lg, gap: spacing.md }]}>
                <SectionHeader
                  title="Product Performance"
                  actionLabel="Products"
                  onAction={() => setActivePanel("inventory")}
                />
                {dashboard.topProducts.length === 0 ? (
                  <Text style={{ color: colors.muted }}>Your strongest listings will appear here.</Text>
                ) : (
                  dashboard.topProducts.map((product) => (
                    <Pressable
                      key={product.id}
                      onPress={() =>
                        router.push({ pathname: "/seller/edit-product", params: { id: product.id } })
                      }
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        paddingTop: spacing.md,
                      }}
                    >
                      <Text style={{ color: colors.text, fontWeight: "900" }}>{product.name}</Text>
                      <Text style={{ color: colors.muted, marginTop: 3 }}>
                        {formatCurrency(product.price)} - {product.rating.toFixed(1)} rating - {product.stock} stock
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            </View>
          </View>
          ) : null}

          {activePanel === "inventory" ? (
            <View style={[panelStyle, { marginTop: spacing.lg, padding: spacing.lg, gap: spacing.lg }]}>
              <SectionHeader
                title="Inventory Workspace"
                actionLabel="Add Product"
                onAction={() => setActivePanel("add-product")}
              />
              <View
                style={{
                  flexDirection: isWide ? "row" : "column",
                  gap: spacing.md,
                  alignItems: isWide ? "center" : "stretch",
                }}
              >
                <View
                  style={{
                    flex: 1,
                    minHeight: 48,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.bg,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: spacing.md,
                  }}
                >
                  <Ionicons name="search-outline" size={18} color={colors.muted} />
                  <TextInput
                    value={inventoryQuery}
                    onChangeText={setInventoryQuery}
                    placeholder="Search products, category, seller"
                    placeholderTextColor={colors.muted}
                    style={{ flex: 1, color: colors.text, minHeight: 48, marginLeft: spacing.sm }}
                  />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {[
                    { label: "All", value: "all" },
                    { label: "Live", value: "active" },
                    { label: "Low Stock", value: "low" },
                    { label: "Out", value: "out" },
                    { label: "Paused", value: "paused" },
                  ].map((filter) => {
                    const active = inventoryFilter === filter.value;
                    return (
                      <Pressable
                        key={filter.value}
                        onPress={() => setInventoryFilter(filter.value as typeof inventoryFilter)}
                        style={{
                          minHeight: 42,
                          borderRadius: radius.pill,
                          paddingHorizontal: spacing.md,
                          justifyContent: "center",
                          marginRight: spacing.sm,
                          backgroundColor: active ? colors.primary : colors.bg,
                        }}
                      >
                        <Text style={{ color: active ? colors.white : colors.text, fontWeight: "900" }}>
                          {filter.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {filteredProducts.length === 0 ? (
                <View style={{ alignItems: "center", padding: spacing.xxl, gap: spacing.sm }}>
                  <Ionicons name="cube-outline" size={34} color={colors.muted} />
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
                    No matching products
                  </Text>
                  <Text style={{ color: colors.muted, textAlign: "center" }}>
                    Add a product or change filters to see your inventory here.
                  </Text>
                </View>
              ) : (
                filteredProducts.map((product) => (
                  <SellerProductCard
                    key={product.id}
                    product={product}
                    onToggleActive={async (value) => {
                      await updateProduct(product.id, { isActive: value });
                      showToast("success", value ? "Product activated" : "Product paused");
                    }}
                    onEdit={() =>
                      router.push({ pathname: "/seller/edit-product", params: { id: product.id } })
                    }
                    onDelete={() =>
                      Alert.alert("Delete product", "Are you sure you want to delete this listing?", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: async () => {
                            await deleteProduct(product.id);
                            showToast("success", "Product deleted");
                          },
                        },
                      ])
                    }
                  />
                ))
              )}
            </View>
          ) : null}

          {activePanel === "orders" ? (
            <View style={[panelStyle, { marginTop: spacing.lg, padding: spacing.lg, gap: spacing.lg }]}>
              <SectionHeader title="Orders Workspace" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(["all", "pending", "confirmed", "shipped", "delivered", "cancelled"] as const).map(
                  (status) => {
                    const active = orderFilter === status;
                    const color = status === "all" ? colors.primary : orderStatusColors[status] || colors.primary;
                    return (
                      <Pressable
                        key={status}
                        onPress={() => setOrderFilter(status)}
                        style={{
                          minHeight: 42,
                          borderRadius: radius.pill,
                          paddingHorizontal: spacing.md,
                          justifyContent: "center",
                          marginRight: spacing.sm,
                          backgroundColor: active ? color : colors.bg,
                        }}
                      >
                        <Text
                          style={{
                            color: active ? colors.white : colors.text,
                            fontWeight: "900",
                            textTransform: "capitalize",
                          }}
                        >
                          {status}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </ScrollView>

              {filteredOrders.length === 0 ? (
                <Text style={{ color: colors.muted, lineHeight: 22 }}>
                  Orders containing your products will appear here when buyers check out.
                </Text>
              ) : (
                filteredOrders.map((order) => {
                  const statusColor = orderStatusColors[order.status] || colors.primary;
                  return (
                    <View
                      key={order.orderId}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.lg,
                        padding: spacing.lg,
                        gap: spacing.md,
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.text, fontWeight: "900" }}>
                            Order #{truncateId(order.orderId)}
                          </Text>
                          <Text style={{ color: colors.muted, marginTop: 4 }}>
                            {order.buyerName} - {formatDate(order.createdAt, true)}
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: `${statusColor}16`,
                            borderRadius: radius.pill,
                            paddingHorizontal: spacing.md,
                            paddingVertical: 6,
                            alignSelf: "flex-start",
                          }}
                        >
                          <Text style={{ color: statusColor, fontWeight: "900", textTransform: "capitalize" }}>
                            {order.status}
                          </Text>
                        </View>
                      </View>
                      {order.items
                        .filter((item) => item.sellerId === user?.uid)
                        .map((item) => (
                          <View
                            key={`${order.orderId}-${item.productId}`}
                            style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}
                          >
                            <Text style={{ color: colors.muted, flex: 1 }}>
                              {item.name} x {item.quantity}
                            </Text>
                            <Text style={{ color: colors.text, fontWeight: "900" }}>
                              {formatCurrency(item.price * item.quantity)}
                            </Text>
                          </View>
                        ))}
                      <Text style={{ color: colors.primary, fontSize: 18, fontWeight: "900" }}>
                        {formatCurrency(sellerOrderAmount(order, user?.uid))}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          ) : null}

          {activePanel === "add-product" ? (
            <View style={{ marginTop: spacing.lg }}>
              <View style={[panelStyle, { padding: spacing.lg, marginBottom: spacing.lg }]}>
                <SectionHeader title="Add Product Workspace" />
                <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 22 }}>
                  Create a complete listing from this dashboard. After publishing, you will stay in
                  the seller workspace and move to Inventory.
                </Text>
              </View>
              <SellerProductForm
                loading={productLoading}
                uploadProgress={uploadProgress}
                submitLabel="Publish Product"
                onSubmit={handleAddProduct}
              />
            </View>
          ) : null}

          {activePanel === "profile" ? (
            <View style={[panelStyle, { marginTop: spacing.lg, padding: spacing.lg, gap: spacing.md }]}>
              <SectionHeader title="Store Profile Workspace" />
              <Text style={{ color: colors.muted, lineHeight: 22 }}>
                Keep seller identity, contact, payout, and storefront details updated from the same panel.
              </Text>
              <View style={{ flexDirection: isWide ? "row" : "column", gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Store Name"
                    icon="storefront-outline"
                    value={storeNameInput}
                    onChangeText={setStoreNameInput}
                    placeholder="Store name"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Owner Name"
                    icon="person-outline"
                    value={ownerNameInput}
                    onChangeText={setOwnerNameInput}
                    placeholder="Owner name"
                  />
                </View>
              </View>
              <View style={{ flexDirection: isWide ? "row" : "column", gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Email"
                    icon="mail-outline"
                    value={profile?.email || ""}
                    editable={false}
                    placeholder="Email address"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Phone Number"
                    icon="call-outline"
                    value={phoneInput}
                    onChangeText={setPhoneInput}
                    keyboardType="phone-pad"
                    placeholder="Store phone number"
                  />
                </View>
              </View>
              <FormField
                label="Store Description"
                icon="document-text-outline"
                value={storeDescriptionInput}
                onChangeText={setStoreDescriptionInput}
                placeholder="Describe your store"
                multiline
                inputStyle={{ minHeight: 100, textAlignVertical: "top" }}
              />

              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", marginTop: spacing.md }}>
                Payout Details
              </Text>
              <View style={{ flexDirection: isWide ? "row" : "column", gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="UPI ID"
                    icon="card-outline"
                    value={upiIdInput}
                    onChangeText={setUpiIdInput}
                    placeholder="name@bank"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Bank Account Name"
                    icon="person-circle-outline"
                    value={bankAccountNameInput}
                    onChangeText={setBankAccountNameInput}
                    placeholder="Account holder name"
                  />
                </View>
              </View>
              <View style={{ flexDirection: isWide ? "row" : "column", gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Bank Account Number"
                    icon="cash-outline"
                    value={bankAccountNumberInput}
                    onChangeText={setBankAccountNumberInput}
                    keyboardType="number-pad"
                    placeholder="Account number"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="IFSC Code"
                    icon="business-outline"
                    value={ifscCodeInput}
                    onChangeText={setIfscCodeInput}
                    placeholder="IFSC code"
                  />
                </View>
              </View>
              <Pressable
                disabled={profileLoading}
                onPress={handleSaveProfile}
                style={{
                  minHeight: 48,
                  borderRadius: radius.md,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: spacing.sm,
                }}
              >
                {profileLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={{ color: colors.white, fontWeight: "900" }}>Save Store Profile</Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
