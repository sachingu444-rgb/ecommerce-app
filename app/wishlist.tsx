import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import EmptyState from "../components/EmptyState";
import ProductCard from "../components/ProductCard";
import { colors, spacing } from "../constants/theme";
import { useAuth } from "../hooks/useAuth";
import { fetchWishlistProducts, toggleWishlist } from "../lib/firebaseApi";
import { showToast } from "../lib/toast";
import { useCartStore } from "../store/cartStore";
import { Product } from "../types";

export default function WishlistScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const addItem = useCartStore((state) => state.addItem);
  const [products, setProducts] = useState<Product[]>([]);

  const loadWishlist = useCallback(() => {
    if (!user) {
      setProducts([]);
      return;
    }

    fetchWishlistProducts(user.uid).then(setProducts);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [loadWishlist])
  );

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
          <EmptyState
            icon="heart-outline"
            title="Sign in to save favorites"
            subtitle="Your wishlist syncs across devices and stays ready for checkout."
            buttonLabel="Sign In"
            onPress={() => router.push("/(auth)/login")}
          />
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>My Wishlist</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>Your saved finds, all in one place.</Text>
          </View>
        </View>

        {products.length === 0 ? (
          <EmptyState
            icon="heart-outline"
            title="No saved items"
            subtitle="Tap the heart on any product to save it here for later."
            buttonLabel="Browse Products"
            onPress={() => router.push("/")}
          />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                inWishlist
                onToggleWishlist={async () => {
                  await toggleWishlist(user.uid, product.id, true);
                  showToast("success", "Removed from wishlist", product.name);
                  loadWishlist();
                }}
                onPress={() => router.push(`/product/${product.id}`)}
                onAddToCart={() => {
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

