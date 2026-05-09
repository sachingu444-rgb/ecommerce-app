import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";

import EmptyState from "../components/EmptyState";
import ProductCard from "../components/ProductCard";
import { colors, radius, spacing } from "../constants/theme";
import { useAuth } from "../hooks/useAuth";
import { fetchProducts } from "../lib/firebaseApi";
import { showToast } from "../lib/toast";
import { useCartStore } from "../store/cartStore";
import { Product } from "../types";

export default function ProductsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const addItem = useCartStore((state) => state.addItem);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      fetchProducts().then(setProducts);
    }, [])
  );

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
              🛍 All Products
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              Browse every active product in the store.
            </Text>
          </View>
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
            placeholder="Search products..."
            placeholderTextColor={colors.muted}
            style={{ flex: 1, minHeight: 50, marginLeft: spacing.sm, color: colors.text }}
          />
        </View>

        {filteredProducts.length === 0 ? (
          <EmptyState
            icon="bag-handle-outline"
            title="Products Coming Soon"
            subtitle="New arrivals will appear here as sellers publish them."
            buttonLabel="Back to Home"
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
