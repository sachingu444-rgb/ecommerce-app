import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import AppImage from "../../components/AppImage";
import CategoryChip from "../../components/CategoryChip";
import DesktopSiteFooter from "../../components/DesktopSiteFooter";
import EmptyState from "../../components/EmptyState";
import StarRating from "../../components/StarRating";
import { categoryMeta, colors, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import {
  fetchProductById,
  fetchProducts,
  fetchTopReviews,
  fetchWishlistIds,
  submitReview,
  toggleWishlist,
  userHasPurchasedProduct,
} from "../../lib/firebaseApi";
import { getResolvedProductListing } from "../../lib/productListing";
import { showToast } from "../../lib/toast";
import { formatCurrency, formatDate } from "../../lib/utils";
import { useCartStore } from "../../store/cartStore";
import { Product, Review } from "../../types";

const CompactCard = ({ product, onPress }: { product: Product; onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    style={{
      width: 180,
      marginRight: spacing.md,
      backgroundColor: colors.white,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
    }}
  >
    <AppImage
      uri={product.images[0]}
      resizeMode="contain"
      containerStyle={{
        width: "100%",
        height: 150,
        borderRadius: radius.md,
        backgroundColor: colors.bg,
      }}
    />
    <Text
      numberOfLines={2}
      style={{
        color: colors.text,
        fontWeight: "800",
        marginTop: spacing.sm,
        minHeight: 36,
      }}
    >
      {product.name}
    </Text>
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: 6 }}>
      <StarRating rating={product.rating} size={12} />
      <Text style={{ color: colors.muted, fontSize: 11 }}>({product.reviews})</Text>
    </View>
    <Text style={{ color: colors.primary, fontWeight: "900", marginTop: spacing.sm }}>
      {formatCurrency(product.price)}
    </Text>
  </Pressable>
);

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { width } = useWindowDimensions();
  const addItem = useCartStore((state: any) => state.addItem);
  const cartCount = useCartStore((state: any) => state.totalItems());
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [showReviewComposer, setShowReviewComposer] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [searchText, setSearchText] = useState("");

  const isDesktopWeb = Platform.OS === "web" && width >= 1180;
  const contentWidth = isDesktopWeb ? Math.min(width - spacing.xxxl * 2, 1480) : width;
  const mediaWidth = isDesktopWeb
    ? Math.min(Math.max(contentWidth * 0.36, 360), 520)
    : width - spacing.lg * 2;

  const loadProduct = useCallback(async () => {
    if (!id) {
      return;
    }

    const productData = await fetchProductById(id);
    setProduct(productData);

    if (productData) {
      const [catalog, topReviews] = await Promise.all([
        fetchProducts(),
        fetchTopReviews(productData.id),
      ]);
      setAllProducts(catalog);
      setReviews(topReviews);
    }

    if (user) {
      const [savedIds, purchased] = await Promise.all([
        fetchWishlistIds(user.uid),
        userHasPurchasedProduct(user.uid, id),
      ]);
      setWishlistIds(savedIds);
      setCanReview(purchased);
    }
  }, [id, user]);

  useFocusEffect(
    useCallback(() => {
      loadProduct();
    }, [loadProduct])
  );

  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);
    setExpandedDescription(false);
  }, [product?.id]);

  const listing = useMemo(
    () => (product ? getResolvedProductListing(product) : null),
    [product]
  );
  const isSaved = product ? wishlistIds.includes(product.id) : false;
  const outOfStock = (product?.stock || 0) <= 0;
  const selectedImage = product?.images[selectedImageIndex] || product?.images[0];
  const descriptionText = product?.description
    ? expandedDescription || product.description.length <= 260
      ? product.description
      : `${product.description.slice(0, 260)}...`
    : "";

  const similarProducts = useMemo(() => {
    if (!product) {
      return [];
    }
    return allProducts
      .filter(
        (item) =>
          item.id !== product.id &&
          (item.category === product.category || item.sellerId === product.sellerId)
      )
      .slice(0, 10);
  }, [allProducts, product]);

  const sameCategoryProducts = useMemo(() => {
    if (!product) {
      return [];
    }
    return allProducts
      .filter((item) => item.id !== product.id && item.category === product.category)
      .slice(0, 10);
  }, [allProducts, product]);

  const sameSellerProducts = useMemo(() => {
    if (!product) {
      return [];
    }
    return allProducts
      .filter((item) => item.id !== product.id && item.sellerId === product.sellerId)
      .slice(0, 10);
  }, [allProducts, product]);

  const addCurrentItem = useCallback(() => {
    if (!product) {
      return;
    }
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity,
      sellerId: product.sellerId,
      category: product.category,
    });
    showToast("success", "Added to cart", product.name);
  }, [addItem, product, quantity, router, user]);

  if (!product || !listing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
          <EmptyState
            icon="pricetag-outline"
            title="Product not found"
            subtitle="This listing could not be loaded right now."
            buttonLabel="Back Home"
            onPress={() => router.push("/")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {isDesktopWeb ? (
          <View
            style={{
              backgroundColor: colors.white,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 1480,
                alignSelf: "center",
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.lg,
              }}
            >
              <Pressable
                onPress={() => router.push("/")}
                style={{
                  backgroundColor: "#FFD84D",
                  borderRadius: radius.lg,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Ionicons name="bag-handle" size={22} color={colors.primaryDark} />
                <Text style={{ color: colors.primaryDark, fontWeight: "900", fontSize: 22 }}>
                  ShopApp
                </Text>
              </Pressable>
              <View
                style={{
                  flex: 1,
                  minHeight: 56,
                  borderRadius: radius.lg,
                  borderWidth: 2,
                  borderColor: "rgba(0,102,204,0.35)",
                  backgroundColor: colors.white,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: spacing.lg,
                }}
              >
                <Ionicons name="search-outline" size={24} color={colors.muted} />
                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  onSubmitEditing={() =>
                    router.push({
                      pathname: "/search",
                      params: { q: searchText.trim() || product.name },
                    })
                  }
                  placeholder="Search for products, brands and more"
                  placeholderTextColor={colors.muted}
                  style={{
                    flex: 1,
                    minHeight: 50,
                    marginLeft: spacing.md,
                    color: colors.text,
                    fontSize: 16,
                  }}
                />
              </View>
              {profile?.role === "seller" ? (
                <Pressable
                  onPress={() => router.push("/seller/dashboard")}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.md,
                    backgroundColor: colors.primaryLight,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "800" }}>Seller</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => router.push("/cart")}
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <View style={{ position: "relative" }}>
                  <Ionicons name="cart-outline" size={26} color={colors.text} />
                  {cartCount > 0 ? (
                    <View
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -8,
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 4,
                      }}
                    >
                      <Text style={{ color: colors.white, fontWeight: "900", fontSize: 10 }}>
                        {cartCount}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={{ color: colors.text, fontWeight: "700" }}>Cart</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View
          style={{
            width: "100%",
            maxWidth: isDesktopWeb ? 1480 : undefined,
            alignSelf: isDesktopWeb ? "center" : undefined,
            paddingHorizontal: isDesktopWeb ? spacing.xl : spacing.lg,
            paddingTop: spacing.md,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              marginBottom: spacing.md,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: colors.white,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
            {isDesktopWeb ? (
              <Text style={{ color: colors.muted }}>
                {product.category} / {listing.brand} / {product.name}
              </Text>
            ) : null}
          </View>

          <View
            style={{
              flexDirection: isDesktopWeb ? "row" : "column",
              alignItems: "flex-start",
              gap: spacing.lg,
            }}
          >
            <View style={{ width: isDesktopWeb ? mediaWidth : "100%" }}>
              <View
                style={{
                  backgroundColor: colors.white,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.md,
                }}
              >
                <AppImage
                  uri={selectedImage}
                  resizeMode="contain"
                  containerStyle={{
                    width: "100%",
                    height: isDesktopWeb ? 430 : 320,
                    borderRadius: radius.md,
                    backgroundColor: colors.bg,
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: isDesktopWeb ? "wrap" : "nowrap",
                  gap: spacing.sm,
                  marginTop: spacing.sm,
                }}
              >
                {product.images.map((image, index) => (
                  <Pressable
                    key={`${image}-${index}`}
                    onPress={() => setSelectedImageIndex(index)}
                    style={{
                      width: isDesktopWeb ? (mediaWidth - spacing.sm) / 2 - 2 : 88,
                      padding: spacing.xs,
                      borderRadius: radius.md,
                      borderWidth: selectedImageIndex === index ? 2 : 1,
                      borderColor:
                        selectedImageIndex === index ? colors.primary : colors.border,
                      backgroundColor: colors.white,
                    }}
                  >
                    <AppImage
                      uri={image}
                      resizeMode="contain"
                      containerStyle={{
                        width: "100%",
                        height: isDesktopWeb ? 120 : 72,
                        borderRadius: radius.md,
                        backgroundColor: colors.bg,
                      }}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ flex: 1, width: "100%", gap: spacing.lg }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                <CategoryChip
                  icon={
                    (categoryMeta[product.category]?.icon ||
                      "grid-outline") as keyof typeof Ionicons.glyphMap
                  }
                  label={product.category}
                  color={categoryMeta[product.category]?.color || colors.primary}
                  active
                />
                {product.discount > 0 ? (
                  <View
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: 6,
                      borderRadius: radius.pill,
                      backgroundColor: "#FEE2E2",
                      marginRight: spacing.sm,
                      marginBottom: spacing.sm,
                    }}
                  >
                    <Text style={{ color: colors.danger, fontWeight: "800", fontSize: 12 }}>
                      {product.discount}% OFF
                    </Text>
                  </View>
                ) : null}
                <View
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                    backgroundColor: colors.primaryLight,
                    marginBottom: spacing.sm,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 12 }}>
                    Seller supported
                  </Text>
                </View>
              </View>

              <View>
                <Text style={{ color: colors.muted, fontWeight: "700", fontSize: 13 }}>
                  {listing.brand}
                </Text>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: isDesktopWeb ? 30 : 24,
                    fontWeight: "900",
                  }}
                >
                  {product.name}
                </Text>
                <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 20 }}>
                  {listing.subtitle}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: spacing.sm,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    backgroundColor: "#DCFCE7",
                    borderRadius: radius.pill,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 6,
                  }}
                >
                  <Text style={{ color: colors.success, fontWeight: "900" }}>
                    {product.rating.toFixed(1)}
                  </Text>
                  <StarRating rating={product.rating} size={13} />
                </View>
                <Text style={{ color: colors.muted }}>{product.reviews} reviews</Text>
                <Text style={{ color: colors.muted }}>Sold by {product.sellerName}</Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: spacing.sm,
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 32, fontWeight: "900" }}>
                  {formatCurrency(product.price)}
                </Text>
                {product.originalPrice > product.price ? (
                  <Text
                    style={{
                      color: colors.muted,
                      textDecorationLine: "line-through",
                      fontSize: 16,
                    }}
                  >
                    {formatCurrency(product.originalPrice)}
                  </Text>
                ) : null}
                <Text style={{ color: outOfStock ? colors.danger : colors.success, fontWeight: "800" }}>
                  {outOfStock ? "Out of Stock" : "In Stock"}
                </Text>
              </View>

              {listing.options.length > 0 ? (
                <View
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: spacing.lg,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
                    Available Options
                  </Text>
                  <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 20 }}>
                    These values come from the seller's category-based listing fields.
                  </Text>
                  <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
                    {listing.options.map((group) => (
                      <View key={group.name}>
                        <Text style={{ color: colors.text, fontWeight: "800", marginBottom: spacing.sm }}>
                          {group.name}
                        </Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                          {group.values.map((value) => (
                            <View
                              key={`${group.name}-${value}`}
                              style={{
                                paddingHorizontal: spacing.md,
                                paddingVertical: 6,
                                borderRadius: radius.pill,
                                backgroundColor: colors.bg,
                                marginRight: spacing.sm,
                                marginBottom: spacing.sm,
                              }}
                            >
                              <Text style={{ color: colors.text, fontWeight: "700", fontSize: 12 }}>
                                {value}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              <View
                style={{
                  backgroundColor: colors.white,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.lg,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
                  Product Highlights
                </Text>
                <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
                  {listing.highlights.map((highlight) => (
                    <View
                      key={highlight}
                      style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={colors.success}
                        style={{ marginTop: 2 }}
                      />
                      <Text style={{ flex: 1, color: colors.muted, lineHeight: 21 }}>{highlight}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View
                style={{
                  backgroundColor: colors.white,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.lg,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
                  About This Item
                </Text>
                <Text style={{ color: colors.muted, marginTop: spacing.lg, lineHeight: 22 }}>
                  {descriptionText}
                </Text>
                {product.description.length > 260 ? (
                  <Pressable onPress={() => setExpandedDescription((current) => !current)} style={{ marginTop: spacing.md }}>
                    <Text style={{ color: colors.primary, fontWeight: "800" }}>
                      {expandedDescription ? "Read less" : "Read more"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <View
                style={{
                  backgroundColor: colors.white,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.lg,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
                  Specifications
                </Text>
                <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
                  {listing.specifications.map((item) => (
                    <View
                      key={`${item.label}-${item.value}`}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        gap: spacing.md,
                        paddingVertical: spacing.sm,
                        borderBottomWidth: 1,
                        borderBottomColor: "#F1F5F9",
                      }}
                    >
                      <Text style={{ flex: 1, color: colors.muted }}>{item.label}</Text>
                      <Text style={{ flex: 1, color: colors.text, fontWeight: "700", textAlign: "right" }}>
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {isDesktopWeb ? (
              <View
                style={{
                  width: 320,
                  backgroundColor: colors.white,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: spacing.lg,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
                  Purchase Options
                </Text>
                <View
                  style={{
                    backgroundColor: colors.primaryLight,
                    borderRadius: radius.md,
                    padding: spacing.md,
                    marginTop: spacing.lg,
                  }}
                >
                  <Text style={{ color: colors.primaryDark, fontWeight: "900", fontSize: 20 }}>
                    {formatCurrency(product.price)}
                  </Text>
                  <Text style={{ color: colors.primaryDark, marginTop: 4 }}>
                    {product.discount > 0
                      ? `You save ${formatCurrency(product.originalPrice - product.price)} on this listing.`
                      : "Marketplace price updated by the seller."}
                  </Text>
                </View>
                <Text style={{ color: colors.text, fontWeight: "900", marginTop: spacing.lg, marginBottom: spacing.sm }}>
                  Quantity
                </Text>
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
                  <Pressable onPress={() => setQuantity((current) => Math.max(1, current - 1))} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
                    <Ionicons name="remove" size={18} color={colors.text} />
                  </Pressable>
                  <Text style={{ minWidth: 40, textAlign: "center", fontWeight: "900" }}>{quantity}</Text>
                  <Pressable onPress={() => setQuantity((current) => Math.min(product.stock || 1, current + 1))} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
                    <Ionicons name="add" size={18} color={colors.text} />
                  </Pressable>
                </View>
                <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
                  {listing.deliveryInfo.map((item) => (
                    <Text key={item} style={{ color: colors.muted, lineHeight: 20 }}>
                      * {item}
                    </Text>
                  ))}
                  <Text style={{ color: colors.text, fontWeight: "800" }}>{listing.returnPolicy}</Text>
                  <Text style={{ color: colors.text, fontWeight: "800" }}>{listing.warranty}</Text>
                </View>
                <Pressable disabled={outOfStock} onPress={addCurrentItem} style={{ marginTop: spacing.lg, backgroundColor: outOfStock ? "#93C5FD" : colors.primary, borderRadius: radius.md, alignItems: "center", paddingVertical: spacing.md + 2 }}>
                  <Text style={{ color: colors.white, fontWeight: "900", fontSize: 16 }}>Add to Cart</Text>
                </Pressable>
                <Pressable disabled={outOfStock} onPress={() => { addCurrentItem(); if (user) { router.push("/checkout"); } }} style={{ marginTop: spacing.md, backgroundColor: outOfStock ? "#F8D58B" : colors.accent, borderRadius: radius.md, alignItems: "center", paddingVertical: spacing.md + 2 }}>
                  <Text style={{ color: colors.white, fontWeight: "900", fontSize: 16 }}>Buy Now</Text>
                </Pressable>
                <Pressable onPress={async () => {
                  if (!user) {
                    router.push("/(auth)/login");
                    return;
                  }
                  await toggleWishlist(user.uid, product.id, isSaved);
                  setWishlistIds((current) => isSaved ? current.filter((item) => item !== product.id) : [...current, product.id]);
                  showToast("success", isSaved ? "Removed from wishlist" : "Saved to wishlist", product.name);
                }} style={{ marginTop: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, alignItems: "center", paddingVertical: spacing.md }}>
                  <Text style={{ color: colors.text, fontWeight: "800" }}>{isSaved ? "Saved to Wishlist" : "Save for Later"}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {!isDesktopWeb ? (
            <View
              style={{
                backgroundColor: colors.white,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.lg,
                marginTop: spacing.lg,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
                Purchase Options
              </Text>
              <Text style={{ color: colors.text, fontWeight: "900", marginTop: spacing.lg, marginBottom: spacing.sm }}>
                Quantity
              </Text>
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
                <Pressable onPress={() => setQuantity((current) => Math.max(1, current - 1))} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
                  <Ionicons name="remove" size={18} color={colors.text} />
                </Pressable>
                <Text style={{ minWidth: 40, textAlign: "center", fontWeight: "900" }}>{quantity}</Text>
                <Pressable onPress={() => setQuantity((current) => Math.min(product.stock || 1, current + 1))} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
                  <Ionicons name="add" size={18} color={colors.text} />
                </Pressable>
              </View>
              <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
                {listing.deliveryInfo.map((item) => (
                  <Text key={item} style={{ color: colors.muted, lineHeight: 20 }}>
                    * {item}
                  </Text>
                ))}
              </View>
              <Text style={{ color: colors.text, fontWeight: "800", marginTop: spacing.md }}>
                {listing.returnPolicy}
              </Text>
              <Text style={{ color: colors.text, fontWeight: "800", marginTop: 4 }}>
                {listing.warranty}
              </Text>
              <Pressable disabled={outOfStock} onPress={addCurrentItem} style={{ marginTop: spacing.lg, backgroundColor: outOfStock ? "#93C5FD" : colors.primary, borderRadius: radius.md, alignItems: "center", paddingVertical: spacing.md + 2 }}>
                <Text style={{ color: colors.white, fontWeight: "900", fontSize: 16 }}>Add to Cart</Text>
              </Pressable>
              <Pressable disabled={outOfStock} onPress={() => { addCurrentItem(); if (user) { router.push("/checkout"); } }} style={{ marginTop: spacing.md, backgroundColor: outOfStock ? "#F8D58B" : colors.accent, borderRadius: radius.md, alignItems: "center", paddingVertical: spacing.md + 2 }}>
                <Text style={{ color: colors.white, fontWeight: "900", fontSize: 16 }}>Buy Now</Text>
              </Pressable>
            </View>
          ) : null}

          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.lg,
              marginTop: spacing.xl,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
              Ratings and Reviews
            </Text>
            <Text style={{ color: colors.muted, marginTop: 6 }}>
              {product.rating.toFixed(1)} average rating from {product.reviews} buyer reviews.
            </Text>
            <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <View
                    key={review.id || `${review.userId}-${review.comment}`}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                      padding: spacing.md,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ color: colors.text, fontWeight: "800" }}>
                        {review.userName}
                      </Text>
                      <StarRating rating={review.rating} size={14} />
                    </View>
                    <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 20 }}>
                      {review.comment}
                    </Text>
                    <Text style={{ color: colors.muted, marginTop: spacing.sm, fontSize: 12 }}>
                      {formatDate(review.createdAt)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.muted }}>
                  Reviews will appear here as buyers start sharing feedback.
                </Text>
              )}
            </View>

            {user && canReview ? (
              <>
                <Pressable onPress={() => setShowReviewComposer((current) => !current)} style={{ marginTop: spacing.lg, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, alignItems: "center", paddingVertical: spacing.md }}>
                  <Text style={{ color: colors.primary, fontWeight: "900" }}>{showReviewComposer ? "Close Review Form" : "Write a Review"}</Text>
                </Pressable>

                {showReviewComposer ? (
                  <View style={{ marginTop: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md }}>
                    <Text style={{ color: colors.text, fontWeight: "900" }}>Rate this product</Text>
                    <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.md }}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Pressable key={value} onPress={() => setReviewRating(value)}>
                          <Ionicons name={reviewRating >= value ? "star" : "star-outline"} size={24} color={colors.star} />
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      value={reviewComment}
                      onChangeText={setReviewComment}
                      placeholder="Share your experience with this product"
                      placeholderTextColor={colors.muted}
                      multiline
                      style={{ minHeight: 100, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, color: colors.text, textAlignVertical: "top" }}
                    />
                    <Pressable onPress={async () => {
                      if (!reviewComment.trim() || !user) {
                        showToast("error", "Write a short review before submitting.");
                        return;
                      }
                      await submitReview({
                        productId: product.id,
                        userId: user.uid,
                        userName: profile?.name || user.displayName || "ShopApp User",
                        rating: reviewRating,
                        comment: reviewComment.trim(),
                      });
                      showToast("success", "Review submitted");
                      setReviewComment("");
                      setShowReviewComposer(false);
                      loadProduct();
                    }} style={{ marginTop: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md, alignItems: "center", paddingVertical: spacing.md }}>
                      <Text style={{ color: colors.white, fontWeight: "900" }}>Submit Review</Text>
                    </Pressable>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>

          {similarProducts.length > 0 ? (
            <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.xl }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>Similar Products</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: spacing.lg }}>
                {similarProducts.map((item) => (
                  <CompactCard key={item.id} product={item} onPress={() => router.push(`/product/${item.id}`)} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {sameCategoryProducts.length > 0 ? (
            <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.xl }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>More in {product.category}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: spacing.lg }}>
                {sameCategoryProducts.map((item) => (
                  <CompactCard key={item.id} product={item} onPress={() => router.push(`/product/${item.id}`)} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {sameSellerProducts.length > 0 ? (
            <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.xl }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>More from {product.sellerName}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginTop: spacing.lg }}>
                {sameSellerProducts.map((item) => (
                  <CompactCard key={item.id} product={item} onPress={() => router.push(`/product/${item.id}`)} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {isDesktopWeb ? <DesktopSiteFooter /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
