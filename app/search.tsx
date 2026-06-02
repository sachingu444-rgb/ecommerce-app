import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";

import CategoryChip from "../components/CategoryChip";
import EmptyState from "../components/EmptyState";
import ProductCard from "../components/ProductCard";
import ResponsiveGrid from "../components/ResponsiveGrid";
import { APP_MAX_WIDTH, DESKTOP_BREAKPOINT } from "../constants/layout";
import { categoryList } from "../constants/mockData";
import { colors, radius, spacing } from "../constants/theme";
import { useAuth } from "../hooks/useAuth";
import { subscribeToActiveProducts } from "../lib/firebaseApi";
import { showToast } from "../lib/toast";
import { useCartStore } from "../store/cartStore";
import { Product } from "../types";

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const addItem = useCartStore((state) => state.addItem);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState(params.q || "");
  const [category, setCategory] = useState(params.category || "All");
  const isDesktopWeb = Platform.OS === "web" && width >= DESKTOP_BREAKPOINT;
  const searchCategoryItems = categoryList.filter((item) =>
    ["All", "Electronics", "Fashion", "Home", "Sports", "Books", "Beauty", "Toys", "Food", "Automotive"].includes(item.name)
  );

  useEffect(() => {
    const unsubscribe = subscribeToActiveProducts(setProducts);
    return () => unsubscribe();
  }, []);

  const results = useMemo(() => {
    return products.filter((product) => {
      const search = query.trim().toLowerCase();
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);
      const matchesCategory = category === "All" || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, products, query]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ width: "100%", maxWidth: APP_MAX_WIDTH, alignSelf: "center", padding: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: colors.white,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.white,
              borderRadius: radius.pill,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.md,
            }}
          >
            <Ionicons name="search-outline" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search products, brands, categories..."
              placeholderTextColor={colors.muted}
              style={{ flex: 1, minHeight: 50, marginLeft: spacing.sm, color: colors.text }}
            />
          </View>
        </View>

        {isDesktopWeb ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {searchCategoryItems.map((item) => (
              <CategoryChip
                key={item.id}
                icon={item.icon as keyof typeof Ionicons.glyphMap}
                label={item.name}
                color={item.color}
                active={category === item.name}
                onPress={() => setCategory(item.name)}
              />
            ))}
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.sm }}>
            {searchCategoryItems.map((item) => (
              <CategoryChip
                key={item.id}
                icon={item.icon as keyof typeof Ionicons.glyphMap}
                label={item.name}
                color={item.color}
                active={category === item.name}
                onPress={() => setCategory(item.name)}
              />
            ))}
          </ScrollView>
        )}

        <Text style={{ marginTop: spacing.lg, marginBottom: spacing.md, color: colors.muted, fontWeight: "700" }}>
          {results.length} result{results.length === 1 ? "" : "s"} found
        </Text>

        {results.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No products found"
            subtitle="Try a different keyword, or explore another category."
            buttonLabel="Back Home"
            onPress={() => router.push("/")}
          />
        ) : (
          <ResponsiveGrid
            items={results}
            minItemWidth={156}
            maxItemWidth={230}
            horizontalPadding={spacing.lg}
            renderItem={(product, cardWidth) => (
              <ProductCard
                key={product.id}
                product={product}
                cardWidth={cardWidth}
                onPress={() => router.push(`/product/${product.id}`)}
                onAddToCart={() => {
                  if (!user) {
                    router.push("/(auth)/login");
                    return;
                  }
                  addItem({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0],
                    quantity: 1,
                    sellerId: product.sellerId,
                    category: product.category,
                  });
                  showToast("success", "Added to cart", product.name);
                }}
              />
            )}
          />
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

