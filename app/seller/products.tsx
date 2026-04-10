import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import EmptyState from "../../components/EmptyState";
import SellerProductCard from "../../components/SellerProductCard";
import { colors, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import {
  deleteProduct,
  fetchProductsBySeller,
  updateProduct,
} from "../../lib/firebaseApi";
import { showToast } from "../../lib/toast";
import { Product } from "../../types";

const filters = ["All", "Active", "Out of Stock", "Deals"];

export default function SellerProductsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const loadProducts = useCallback(() => {
    if (!user) {
      setProducts([]);
      return;
    }

    fetchProductsBySeller(user.uid).then(setProducts);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !query.trim() ||
        product.name.toLowerCase().includes(query.trim().toLowerCase()) ||
        product.category.toLowerCase().includes(query.trim().toLowerCase());

      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Active" && product.isActive) ||
        (activeFilter === "Out of Stock" && product.stock <= 0) ||
        (activeFilter === "Deals" && product.isDeal);

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, products, query]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>My Products</Text>
        <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
          Search, update, activate and manage every listing you own.
        </Text>

        <View
          style={{
            marginTop: spacing.lg,
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
            placeholder="Search your products"
            placeholderTextColor={colors.muted}
            style={{ flex: 1, minHeight: 50, marginLeft: spacing.sm, color: colors.text }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.lg }}>
          {filters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm + 2,
                  borderRadius: radius.pill,
                  marginRight: spacing.sm,
                  backgroundColor: active ? colors.primary : colors.white,
                }}
              >
                <Text style={{ color: active ? colors.white : colors.text, fontWeight: "800" }}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filteredProducts.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="No products yet"
            subtitle="Add your first product to start receiving orders."
            buttonLabel="Add Product"
            onPress={() => router.push("/seller/add-product")}
          />
        ) : (
          filteredProducts.map((product) => (
            <SellerProductCard
              key={product.id}
              product={product}
              onToggleActive={async (value) => {
                await updateProduct(product.id, { isActive: value });
                showToast("success", value ? "Product activated" : "Product paused");
                loadProducts();
              }}
              onEdit={() =>
                router.push({
                  pathname: "/seller/edit-product",
                  params: { id: product.id },
                })
              }
              onDelete={() =>
                Alert.alert("Delete product", "Are you sure you want to delete this listing?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      await deleteProduct(product.id);
                      showToast("success", "Product deleted");
                      loadProducts();
                    },
                  },
                ])
              }
            />
          ))
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push("/seller/add-product")}
        style={{
          position: "absolute",
          right: spacing.lg,
          bottom: spacing.xl,
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}
