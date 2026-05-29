import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import SmartImage from "../components/SmartImage";
import { defaultBuyerEditablePages, defaultBuyerPageContent } from "../constants/buyerPageContent";
import { colors, radius, spacing } from "../constants/theme";
import { subscribeToBuyerPageContent } from "../lib/firebaseApi";
import { BuyerPageContent } from "../types";

export default function SupportScreen() {
  const router = useRouter();
  const [pageContent, setPageContent] = useState<BuyerPageContent>(defaultBuyerPageContent);
  const page = pageContent.editablePages?.find((item) => item.id === "support") || defaultBuyerEditablePages[4];

  useEffect(() => {
    const unsubscribe = subscribeToBuyerPageContent(setPageContent);
    return () => unsubscribe();
  }, []);

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
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>{page.title}</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>{page.subtitle}</Text>
          </View>
        </View>

        <View style={{ height: 220, borderRadius: radius.xl, overflow: "hidden", marginBottom: spacing.lg }}>
          <SmartImage uri={page.heroImage} width="100%" height="100%" resizeMode="cover" />
          <LinearGradient
            colors={["rgba(3,7,18,0.12)", "rgba(3,7,18,0.78)"]}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, padding: spacing.lg, justifyContent: "flex-end" }}
          >
            <Text style={{ color: colors.white, fontWeight: "900", fontSize: 12 }}>{page.badge}</Text>
            <Text style={{ color: colors.white, fontWeight: "900", fontSize: 28, marginTop: spacing.xs }}>
              {page.sectionTitle}
            </Text>
          </LinearGradient>
        </View>

        {page.cards.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginBottom: spacing.md,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: `${page.accent}16`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={22}
                color={page.accent}
              />
            </View>
            <Text style={{ marginTop: spacing.md, color: colors.text, fontWeight: "900", fontSize: 16 }}>
              {item.title}
            </Text>
            <Text style={{ marginTop: spacing.sm, color: colors.muted, lineHeight: 20 }}>
              {item.description}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
