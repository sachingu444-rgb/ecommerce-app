import { DimensionValue, Pressable, Text, View } from "react-native";

import { colors, radius, shadows, spacing } from "../constants/theme";
import { formatCurrency } from "../lib/utils";
import { Product } from "../types";
import SmartImage from "./SmartImage";

interface DealCardProps {
  product: Product;
  onPress?: () => void;
  width?: DimensionValue;
  marginRight?: number;
  palette?: {
    card: string;
    text: string;
    muted: string;
    border: string;
    imageFallback: string;
    primary: string;
  };
}

const DealCard = ({ product, onPress, width = 150, marginRight = spacing.md, palette }: DealCardProps) => {
  const cardPalette = palette || {
    card: colors.card,
    text: colors.text,
    muted: colors.muted,
    border: colors.border,
    imageFallback: colors.bg,
    primary: colors.primary,
  };

  return (
    <Pressable
      onPress={onPress}
      style={{
        width,
        backgroundColor: cardPalette.card,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: cardPalette.border,
        marginRight,
        overflow: "hidden",
        ...shadows.card,
      }}
    >
      <View style={{ position: "relative" }}>
        <SmartImage
          uri={product.images?.[0]}
          width="100%"
          height={120}
          borderRadius={0}
          resizeMode="contain"
          fallbackEmoji="S"
          fallbackColor={cardPalette.imageFallback}
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
        <Text numberOfLines={1} style={{ color: cardPalette.text, fontWeight: "800", fontSize: 13 }}>
          {product.name}
        </Text>
        <Text style={{ color: cardPalette.primary, fontWeight: "900", fontSize: 15, marginTop: spacing.sm }}>
          {formatCurrency(product.price)}
        </Text>
        <Text
          style={{
            color: cardPalette.muted,
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
