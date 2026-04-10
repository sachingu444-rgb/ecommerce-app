import { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors, orderStatusColors, radius, spacing } from "../constants/theme";
import { formatCurrency, formatDate, truncateId } from "../lib/utils";
import { Order } from "../types";
import AppImage from "./AppImage";

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  actionLabel?: string;
  onActionPress?: () => void;
  sellerId?: string;
  footer?: ReactNode;
}

const OrderCard = ({
  order,
  onPress,
  actionLabel,
  onActionPress,
  sellerId,
  footer,
}: OrderCardProps) => {
  const relevantItems = sellerId
    ? order.items.filter((item) => item.sellerId === sellerId)
    : order.items;

  const firstItem = relevantItems[0] || order.items[0];
  const otherItems = Math.max(relevantItems.length - 1, 0);
  const sellerTotal = relevantItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.md,
        }}
      >
        <View>
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 14 }}>
            Order #{truncateId(order.orderId)}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
            {formatDate(order.createdAt)}
          </Text>
        </View>
        <View
          style={{
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
              fontSize: 12,
            }}
          >
            {order.status}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <AppImage
          uri={firstItem?.image}
          resizeMode="contain"
          containerStyle={{ width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.bg }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "800", fontSize: 14 }} numberOfLines={1}>
            {firstItem?.name || "Order items"}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 4, fontSize: 12 }}>
            {otherItems > 0 ? `+${otherItems} more item${otherItems > 1 ? "s" : ""}` : "Single item order"}
          </Text>
          <Text style={{ color: colors.primary, fontWeight: "900", marginTop: spacing.sm }}>
            {formatCurrency(sellerId ? sellerTotal : order.totalAmount)}
          </Text>
        </View>
      </View>

      {footer ? <View style={{ marginTop: spacing.md }}>{footer}</View> : null}

      {actionLabel && onActionPress ? (
        <Pressable
          onPress={onActionPress}
          style={{
            marginTop: spacing.md,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: radius.md,
            paddingVertical: spacing.sm + 2,
          }}
        >
          <Ionicons name="navigate-outline" size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "800" }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
};

export default OrderCard;
