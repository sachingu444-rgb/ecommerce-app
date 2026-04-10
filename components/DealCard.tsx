import { Pressable, Text, View } from "react-native";

import { colors, radius, shadows, spacing } from "../constants/theme";
import { formatCurrency } from "../lib/utils";
import { Product } from "../types";
import AppImage from "./AppImage";

interface DealCardProps {
  product: Product;
  onPress?: () => void;
}

const DealCard = ({ product, onPress }: DealCardProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 150,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        marginRight: spacing.md,
        overflow: "hidden",
        ...shadows.card,
      }}
    >
      <View style={{ position: "relative" }}>
        <AppImage
          uri={product.images?.[0]}
          resizeMode="contain"
          containerStyle={{ width: "100%", height: 120, borderRadius: 0, backgroundColor: colors.bg }}
        />
        <View
          style={{
            position: "absolute",
            top: spacing.sm,
            left: spacing.sm,
            backgroundColor: colors.danger,
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: radius.pill,
          }}
        >
          <Text style={{ color: colors.white, fontSize: 10, fontWeight: "800" }}>
            {product.discount}% OFF
          </Text>
        </View>
      </View>

      <View style={{ padding: spacing.sm }}>
        <Text numberOfLines={1} style={{ color: colors.text, fontWeight: "800", fontSize: 13 }}>
          {product.name}
        </Text>
        <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 15, marginTop: spacing.sm }}>
          {formatCurrency(product.price)}
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: 11,
            textDecorationLine: "line-through",
            marginTop: 2,
          }}
        >
          {formatCurrency(product.originalPrice)}
        </Text>
      </View>
    </Pressable>
  );
};

export default DealCard;

