import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

import CartItem from "../../components/CartItem";
import DesktopSiteFooter from "../../components/DesktopSiteFooter";
import EmptyState from "../../components/EmptyState";
import FormField from "../../components/FormField";
import { colors, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { fetchCoupons } from "../../lib/firebaseApi";
import { showToast } from "../../lib/toast";
import { formatCurrency } from "../../lib/utils";
import { useCartStore } from "../../store/cartStore";

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const items = useCartStore((state) => state.items);
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const totalItems = useCartStore((state) => state.totalItems());
  const cartTotal = useCartStore((state) => state.totalPrice());

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponLabel, setCouponLabel] = useState("");

  const subtotal = cartTotal;
  const shipping = subtotal > 500 || subtotal === 0 ? 0 : 50;
  const total = Math.max(subtotal + shipping - discount, 0);

  const summaryRows = useMemo(
    () => [
      { label: "Subtotal", value: formatCurrency(subtotal) },
      { label: "Shipping", value: shipping === 0 ? "Free" : formatCurrency(shipping) },
      { label: "Discount", value: discount > 0 ? `- ${formatCurrency(discount)}` : formatCurrency(0) },
    ],
    [discount, shipping, subtotal]
  );

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      showToast("error", "Enter a coupon code");
      return;
    }

    const coupons = await fetchCoupons();
    const found = coupons.find(
      (coupon) => coupon.code.toLowerCase() === couponCode.trim().toLowerCase() && coupon.active !== false
    );

    if (!found) {
      setDiscount(0);
      setCouponLabel("");
      showToast("error", "Coupon not found", "Try SAVE10 or WELCOME50.");
      return;
    }

    if (found.minAmount && subtotal < found.minAmount) {
      showToast(
        "error",
        "Minimum cart value not met",
        `This code requires ${formatCurrency(found.minAmount)}.`
      );
      return;
    }

    const nextDiscount =
      found.type === "percent"
        ? Math.round((subtotal * found.value) / 100)
        : found.value;
    setDiscount(nextDiscount);
    setCouponLabel(found.code.toUpperCase());
    showToast("success", "Coupon applied", `${found.code.toUpperCase()} saved you ${formatCurrency(nextDiscount)}.`);
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
          <EmptyState
            icon="lock-closed-outline"
            title="Sign in to view your cart"
            subtitle="Protected shopping actions like cart and checkout are available after login."
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: spacing.lg,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>My Cart</Text>
          <Text style={{ color: colors.muted, fontWeight: "700" }}>{totalItems} items</Text>
        </View>

        {items.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title="Your cart is empty"
            subtitle="Browse featured products and come back when you find something you love."
            buttonLabel="Start Shopping"
            onPress={() => router.push("/")}
          />
        ) : (
          <>
            {items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onIncrease={() => updateQty(item.productId, item.quantity + 1)}
                onDecrease={() => updateQty(item.productId, item.quantity - 1)}
                onRemove={() => removeItem(item.productId)}
              />
            ))}

            <View
              style={{
                backgroundColor: colors.white,
                borderRadius: radius.lg,
                padding: spacing.lg,
                marginTop: spacing.sm,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", marginBottom: spacing.md }}>
                Order Summary
              </Text>
              {summaryRows.map((row) => (
                <View
                  key={row.label}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: spacing.sm,
                  }}
                >
                  <Text style={{ color: colors.muted }}>{row.label}</Text>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>{row.value}</Text>
                </View>
              ))}

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>Total</Text>
                <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "900" }}>
                  {formatCurrency(total)}
                </Text>
              </View>

              {couponLabel ? (
                <Text style={{ color: colors.success, marginTop: spacing.sm, fontWeight: "700" }}>
                  Applied coupon: {couponLabel}
                </Text>
              ) : null}
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <FormField
                icon="pricetag-outline"
                value={couponCode}
                onChangeText={setCouponCode}
                placeholder="Enter coupon code"
              />
              <Pressable
                onPress={handleApplyCoupon}
                style={{
                  borderWidth: 1,
                  borderColor: colors.primary,
                  borderRadius: radius.md,
                  alignItems: "center",
                  paddingVertical: spacing.md,
                  marginTop: spacing.xs,
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: "800" }}>Apply Coupon</Text>
              </Pressable>
            </View>

            <Pressable
              disabled={items.length === 0}
              onPress={() => router.push("/checkout")}
              style={{
                marginTop: spacing.xl,
                backgroundColor: items.length === 0 ? "#93C5FD" : colors.primary,
                borderRadius: radius.md,
                alignItems: "center",
                paddingVertical: spacing.md + 2,
              }}
            >
              <Text style={{ color: colors.white, fontWeight: "900", fontSize: 16 }}>
                Proceed to Checkout
              </Text>
            </Pressable>
          </>
        )}

        <DesktopSiteFooter />
      </ScrollView>
    </SafeAreaView>
  );
}
