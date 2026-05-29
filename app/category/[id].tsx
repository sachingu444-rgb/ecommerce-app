import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import EmptyState from "../../components/EmptyState";
import SmartImage from "../../components/SmartImage";
import { defaultBuyerPageContent } from "../../constants/buyerPageContent";
import { colors, radius, spacing } from "../../constants/theme";
import { subscribeToActiveProducts, subscribeToBuyerPageContent } from "../../lib/firebaseApi";
import { BuyerCategoryPage, Product } from "../../types";

const fallbackCategoryPage = defaultBuyerPageContent.categoryPages[0];

const resolveCategoryPage = (pages: BuyerCategoryPage[], id?: string): BuyerCategoryPage =>
  pages.find((page) => page.id === id) || fallbackCategoryPage;

const CategoryProductTile = ({
  product,
  buttonLabel,
  width,
  gap,
  onPress,
}: {
  product: Product;
  buttonLabel: string;
  width: number;
  gap: number;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={{
      width,
      borderRadius: 8,
      backgroundColor: colors.white,
      padding: spacing.xs,
      marginRight: gap,
      borderWidth: 1,
      borderColor: "rgba(15,23,42,0.08)",
    }}
  >
    <View style={{ height: width - 4, borderRadius: 7, overflow: "hidden", backgroundColor: colors.bg }}>
      <SmartImage uri={product.images[0] || product.image || ""} width="100%" height="100%" resizeMode="cover" />
    </View>
    <Text style={{ color: colors.muted, marginTop: spacing.sm, fontSize: 14 }} numberOfLines={1}>
      {product.name}
    </Text>
    <Text style={{ color: colors.text, fontWeight: "900", fontSize: 15 }} numberOfLines={1}>
      {buttonLabel}
    </Text>
  </Pressable>
);

export default function BuyerCategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryPages, setCategoryPages] = useState<BuyerCategoryPage[]>(defaultBuyerPageContent.categoryPages);

  const categoryPage = useMemo(
    () => resolveCategoryPage(categoryPages, params.id),
    [categoryPages, params.id]
  );
  const banners = categoryPage.banners?.length
    ? categoryPage.banners
    : [{ id: "fallback", image: categoryPage.heroImage, title: categoryPage.title, subtitle: categoryPage.subtitle, linkCategory: categoryPage.category }];
  const tiles = categoryPage.tiles || [];
  const horizontalGap = categoryPage.horizontalGap ?? 8;
  const verticalGap = categoryPage.verticalGap ?? 24;
  const tileSize = categoryPage.tileSize || 106;
  const bannerHeight = categoryPage.bannerHeight || 247;
  const productWidth = Math.max(160, 900 / Math.max(categoryPage.columns || 4, 1));

  useEffect(() => {
    const unsubscribe = subscribeToActiveProducts(setProducts);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToBuyerPageContent((content) => setCategoryPages(content.categoryPages));
    return () => unsubscribe();
  }, []);

  const pageProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.isActive &&
          (categoryPage.category === "All" || product.category === categoryPage.category)
      ),
    [categoryPage.category, products]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: "#D9DDE3",
            alignItems: "center",
          }}
        >
          {categoryPages.map((page) => {
            const active = page.id === categoryPage.id;

            return (
              <Pressable
                key={page.id}
                onPress={() => router.push({ pathname: "/category/[id]", params: { id: page.id } })}
                style={{
                  width: 92,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: spacing.sm,
                  paddingBottom: spacing.xs,
                  borderBottomWidth: 3,
                  borderBottomColor: active ? colors.primary : "transparent",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 38,
                    borderRadius: 8,
                    backgroundColor: active ? `${page.accent}18` : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name={page.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={active ? page.accent : colors.text}
                  />
                </View>
                <Text
                  style={{ color: colors.text, fontWeight: active ? "900" : "700", fontSize: 13, textAlign: "center" }}
                  numberOfLines={1}
                >
                  {page.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {banners.map((banner, index) => (
              <Pressable
                key={banner.id}
                onPress={() => router.push({ pathname: "/search", params: { category: banner.linkCategory } })}
                style={{
                  width: index === 1 ? 508 : 506,
                  height: bannerHeight,
                  borderRadius: 14,
                  overflow: "hidden",
                  marginRight: spacing.xl,
                  backgroundColor: colors.bg,
                }}
              >
                <SmartImage uri={banner.image} width="100%" height="100%" resizeMode="cover" />
              </Pressable>
            ))}
          </ScrollView>

          {tiles.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: spacing.lg }}>
              {tiles.map((tile) => (
                <Pressable
                  key={tile.id}
                  onPress={() => router.push({ pathname: "/search", params: { category: tile.linkCategory } })}
                  style={{ width: tileSize, marginRight: horizontalGap, alignItems: "center" }}
                >
                  <View style={{ width: tileSize, height: tileSize, borderRadius: 10, overflow: "hidden", backgroundColor: "#FFF5C7" }}>
                    <SmartImage uri={tile.image} width="100%" height="100%" resizeMode="cover" />
                  </View>
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: "800", marginTop: spacing.xs, textAlign: "center" }} numberOfLines={1}>
                    {tile.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          <View
            style={{
              marginTop: verticalGap,
              borderRadius: 16,
              backgroundColor: categoryPage.highlightBackground || "#F2FF00",
              paddingTop: categoryPage.paddingTop ?? spacing.md,
              paddingBottom: categoryPage.paddingBottom ?? spacing.md,
              paddingHorizontal: spacing.md,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: categoryPage.typographyPreset === "Heading 4" ? 28 : 22,
                fontWeight: "900",
                marginBottom: spacing.md,
                textAlign: categoryPage.alignment || "left",
              }}
            >
              {categoryPage.highlightTitle || categoryPage.featuredTitle}
            </Text>
            {pageProducts.length === 0 ? (
              <EmptyState
                icon={(categoryPage.icon as keyof typeof Ionicons.glyphMap) || "grid-outline"}
                title={categoryPage.emptyTitle}
                subtitle={categoryPage.emptySubtitle}
                buttonLabel="Back Home"
                onPress={() => router.push("/")}
              />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {pageProducts.slice(0, categoryPage.productCount || 8).map((product) => (
                  <CategoryProductTile
                    key={product.id}
                    product={product}
                    buttonLabel={categoryPage.productCardCta || "View Store"}
                    width={productWidth}
                    gap={horizontalGap}
                    onPress={() => router.push(`/product/${product.id}`)}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
