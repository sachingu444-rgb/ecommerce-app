import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";

import EmptyState from "../components/EmptyState";
import ProductCard from "../components/ProductCard";
import SmartImage from "../components/SmartImage";
import { defaultBuyerEditablePages, defaultBuyerPageContent } from "../constants/buyerPageContent";
import { colors, radius, spacing } from "../constants/theme";
import { useAuth } from "../hooks/useAuth";
import { subscribeToActiveProducts, subscribeToBuyerPageContent } from "../lib/firebaseApi";
import { showToast } from "../lib/toast";
import { useCartStore } from "../store/cartStore";
import { BuyerPageContent, Product } from "../types";

export default function ProductsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const addItem = useCartStore((state) => state.addItem);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [pageContent, setPageContent] = useState<BuyerPageContent>(defaultBuyerPageContent);
  const page = pageContent.editablePages?.find((item) => item.id === "products") || defaultBuyerEditablePages[1];

  useEffect(() => {
    const unsubscribe = subscribeToActiveProducts(setProducts);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToBuyerPageContent(setPageContent);
    return () => unsubscribe();
  }, []);

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return products;
    }

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search)
    );
  }, [products, query]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            marginBottom: spacing.lg,
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
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>
              {page.title}
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              {page.subtitle}
            </Text>
          </View>
        </View>

        <View style={{ height: 210, borderRadius: radius.xl, overflow: "hidden", marginBottom: spacing.lg }}>
          <SmartImage uri={page.heroImage} width="100%" height="100%" resizeMode="cover" />
          <LinearGradient
            colors={["rgba(3,7,18,0.12)", "rgba(3,7,18,0.78)"]}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, padding: spacing.lg, justifyContent: "flex-end" }}
          >
            <Text style={{ color: colors.white, fontWeight: "900", fontSize: 12 }}>{page.badge}</Text>
            <Text style={{ color: colors.white, fontWeight: "900", fontSize: 26, marginTop: spacing.xs }}>
              {page.sectionTitle}
            </Text>
          </LinearGradient>
        </View>

        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: radius.pill,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.md,
            marginBottom: spacing.lg,
          }}
        >
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={page.searchPlaceholder || "Search products..."}
            placeholderTextColor={colors.muted}
            style={{ flex: 1, minHeight: 50, marginLeft: spacing.sm, color: colors.text }}
          />
        </View>

        {filteredProducts.length === 0 ? (
          <EmptyState
            icon="bag-handle-outline"
            title={page.emptyTitle}
            subtitle={page.emptySubtitle}
            buttonLabel={page.emptyButtonLabel}
            onPress={() => router.push("/")}
          />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
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
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
