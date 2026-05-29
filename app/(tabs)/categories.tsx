import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import { categoryList } from "../../constants/mockData";
import DesktopSiteFooter from "../../components/DesktopSiteFooter";
import SmartImage from "../../components/SmartImage";
import { defaultBuyerEditablePages, defaultBuyerPageContent } from "../../constants/buyerPageContent";
import { colors, radius, spacing } from "../../constants/theme";
import { subscribeToActiveProducts, subscribeToBuyerPageContent } from "../../lib/firebaseApi";
import { BuyerPageContent, Product } from "../../types";

export default function CategoriesScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [pageContent, setPageContent] = useState<BuyerPageContent>(defaultBuyerPageContent);
  const page = pageContent.editablePages?.find((item) => item.id === "categories") || defaultBuyerEditablePages[0];

  useEffect(() => {
    const unsubscribe = subscribeToActiveProducts(setProducts);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToBuyerPageContent(setPageContent);
    return () => unsubscribe();
  }, []);

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
        <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>
          {page.title}
        </Text>
        <Text style={{ color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.xl }}>
          {page.subtitle}
        </Text>

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
