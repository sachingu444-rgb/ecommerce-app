import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors, radius, spacing } from "../constants/theme";
import { formatCurrency } from "../lib/utils";
import { CartItem as CartItemType } from "../types";
import AppImage from "./AppImage";

interface CartItemProps {
  item: CartItemType;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

const CartItem = ({ item, onIncrease, onDecrease, onRemove }: CartItemProps) => {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.white,
        borderRadius: radius.md,
        padding: spacing.md,
        gap: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      <AppImage
        uri={item.image}
        resizeMode="contain"
        containerStyle={{ width: 80, height: 80, borderRadius: radius.md, backgroundColor: colors.bg }}
      />

      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: "800", fontSize: 14 }} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
          {item.category || "General"}
        </Text>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "900", marginTop: spacing.sm }}>
          {formatCurrency(item.price)}
        </Text>

        <View
          style={{
            marginTop: spacing.sm,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.pill,
              overflow: "hidden",
            }}
          >
            <Pressable
              onPress={onDecrease}
              style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
            >
              <Ionicons name="remove" size={18} color={colors.text} />
            </Pressable>
            <Text style={{ minWidth: 28, textAlign: "center", fontWeight: "800" }}>
              {item.quantity}
            </Text>
            <Pressable
              onPress={onIncrease}
              style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
            >
              <Ionicons name="add" size={18} color={colors.text} />
            </Pressable>
          </View>

          <Pressable
            onPress={onRemove}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#FEE2E2",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default CartItem;

