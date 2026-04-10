import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import EmptyState from "../components/EmptyState";
import ProductCard from "../components/ProductCard";
import { colors, spacing } from "../constants/theme";
import { useAuth } from "../hooks/useAuth";
import { fetchDealProducts } from "../lib/firebaseApi";
import { showToast } from "../lib/toast";
import { useCartStore } from "../store/cartStore";
import { Product } from "../types";

export default function DealsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const addItem = useCartStore((state) => state.addItem);
  const [products, setProducts] = useState<Product[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchDealProducts().then(setProducts);
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
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
          <View>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>Deal Zone</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              Hand-picked offers you can grab today.
            </Text>
          </View>
        </View>

        {products.length === 0 ? (
          <EmptyState
            icon="flash-outline"
            title="No deals live right now"
            subtitle="Fresh promotions will show up here as sellers publish them."
            buttonLabel="Explore Home"
            onPress={() => router.push("/")}
          />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {products.map((product) => (
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
