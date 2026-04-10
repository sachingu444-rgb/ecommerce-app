import { Ionicons } from "@expo/vector-icons";
import { Pressable, Switch, Text, View } from "react-native";

import { colors, radius, spacing } from "../constants/theme";
import { formatCurrency } from "../lib/utils";
import { Product } from "../types";
import AppImage from "./AppImage";

interface SellerProductCardProps {
  product: Product;
  onToggleActive: (value: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SellerProductCard = ({
  product,
  onToggleActive,
  onEdit,
  onDelete,
}: SellerProductCardProps) => {
  const lowStock = product.stock < 5;

  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.md,
        flexDirection: "row",
        gap: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      <AppImage
        uri={product.images?.[0]}
        resizeMode="contain"
        containerStyle={{ width: 80, height: 80, borderRadius: radius.md, backgroundColor: colors.bg }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: "900", fontSize: 14 }} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{product.category}</Text>
        <Text style={{ color: colors.primary, fontWeight: "900", marginTop: spacing.sm }}>
          {formatCurrency(product.price)}
        </Text>
        <Text
          style={{
            color: lowStock ? colors.danger : colors.muted,
            fontWeight: lowStock ? "800" : "600",
            marginTop: 4,
            fontSize: 12,
          }}
        >
          Stock: {product.stock}
        </Text>

        <View
          style={{
            marginTop: spacing.md,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Active</Text>
            <Switch
              value={product.isActive}
              onValueChange={onToggleActive}
              thumbColor={colors.white}
              trackColor={{ false: "#CBD5E1", true: colors.primary }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Pressable
              onPress={onEdit}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.primaryLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={onDelete}
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
    </View>
  );
};

export default SellerProductCard;
