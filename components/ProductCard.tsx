import { Ionicons } from "@expo/vector-icons";
import { Dimensions, Pressable, Text, View } from "react-native";

import { colors, radius, shadows, spacing } from "../constants/theme";
import { formatCurrency } from "../lib/utils";
import { Product } from "../types";
import SmartImage from "./SmartImage";
import StarRating from "./StarRating";

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  inWishlist?: boolean;
  palette?: {
    card: string;
    text: string;
    muted: string;
    border: string;
    imageFallback: string;
    primary: string;
  };
}

const ProductCard = ({
  product,
  onPress,
  onAddToCart,
  onToggleWishlist,
  inWishlist = false,
  palette,
}: ProductCardProps) => {
  const windowWidth = Dimensions.get("window").width;
  const rawCardWidth = (windowWidth - spacing.lg * 2 - spacing.md) / 2;
  const cardWidth = windowWidth >= 768 ? Math.min(rawCardWidth, 220) : rawCardWidth;
  const imageHeight = Math.max(144, Math.min(180, cardWidth * 0.95));
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
        width: cardWidth,
        backgroundColor: cardPalette.card,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: cardPalette.border,
        padding: spacing.sm,
        marginBottom: spacing.md,
        ...shadows.card,
      }}
    >
      <View style={{ position: "relative" }}>
        <SmartImage
          uri={product.images?.[0]}
          width="100%"
          height={imageHeight}
          borderRadius={radius.md}
          resizeMode="contain"
          fallbackEmoji="S"
          fallbackColor={cardPalette.imageFallback}
        />
        {product.discount > 0 ? (
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
            <Text style={{ color: colors.white, fontSize: 11, fontWeight: "800" }}>
              -{product.discount}%
            </Text>
          </View>
        ) : null}
        {onToggleWishlist ? (
          <Pressable
            onPress={onToggleWishlist}
            style={{
              position: "absolute",
              top: spacing.sm,
              right: spacing.sm,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: cardPalette.card,
              borderWidth: 1,
              borderColor: cardPalette.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={inWishlist ? "heart" : "heart-outline"}
              size={18}
              color={inWishlist ? colors.danger : cardPalette.text}
            />
          </Pressable>
        ) : null}
      </View>

      <Text
        numberOfLines={2}
        style={{
          marginTop: spacing.sm,
          fontSize: 13,
          fontWeight: "800",
          color: cardPalette.text,
          minHeight: 36,
        }}
      >
        {product.name}
      </Text>

      <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <StarRating rating={product.rating} size={13} />
        <Text style={{ fontSize: 12, color: cardPalette.muted }}>({product.reviews})</Text>
      </View>

      <View style={{ marginTop: spacing.sm, gap: 2 }}>
        <Text style={{ fontSize: 16, color: cardPalette.primary, fontWeight: "900" }}>
          {formatCurrency(product.price)}
        </Text>
        {product.originalPrice > product.price ? (
          <Text
            style={{
              fontSize: 11,
              color: cardPalette.muted,
              textDecorationLine: "line-through",
            }}
          >
            {formatCurrency(product.originalPrice)}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={onAddToCart}
        style={{
          backgroundColor: cardPalette.primary,
          paddingVertical: spacing.sm + 2,
          borderRadius: radius.md,
          alignItems: "center",
          marginTop: spacing.md,
        }}
      >
        <Text style={{ color: colors.white, fontWeight: "800", fontSize: 13 }}>
          Add to Cart
        </Text>
      </Pressable>
    </Pressable>
  );
};

export default ProductCard;
