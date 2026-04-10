import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import { categoryList } from "../../constants/mockData";
import DesktopSiteFooter from "../../components/DesktopSiteFooter";
import { colors, radius, spacing } from "../../constants/theme";
import { fetchProducts } from "../../lib/firebaseApi";
import { Product } from "../../types";

export default function CategoriesScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchProducts().then(setProducts);
    }, [])
  );

  const categories = useMemo(
    () =>
      categoryList.filter((category) => category.name !== "All").map((category) => ({
        ...category,
        count: products.filter((product) => product.category === category.name).length,
      })),
    [products]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>Categories</Text>
        <Text style={{ color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.xl }}>
          Explore every aisle across the marketplace.
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() =>
                router.push({
                  pathname: "/search",
                  params: { category: category.name },
                })
              }
              style={{
                width: "48%",
                backgroundColor: `${category.color}16`,
                borderRadius: radius.lg,
                padding: spacing.lg,
                marginBottom: spacing.md,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.white,
                }}
              >
                <Ionicons
                  name={category.icon as keyof typeof Ionicons.glyphMap}
                  size={22}
                  color={category.color}
                />
              </View>
              <Text style={{ marginTop: spacing.md, fontSize: 16, fontWeight: "900", color: colors.text }}>
                {category.name}
              </Text>
              <Text style={{ marginTop: spacing.sm, color: colors.muted }}>
                {category.count} products
              </Text>
            </Pressable>
          ))}
        </View>

        <DesktopSiteFooter />
      </ScrollView>
    </SafeAreaView>
  );
}
