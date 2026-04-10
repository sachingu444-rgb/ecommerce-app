import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import { colors, radius, spacing } from "../constants/theme";

const supportItems = [
  {
    title: "Order help",
    description: "Track a package, request delivery help, or understand order status updates.",
    icon: "cube-outline",
  },
  {
    title: "Payments and refunds",
    description: "Need help with card payments, cancellations or refunds? Start here.",
    icon: "card-outline",
  },
  {
    title: "Seller support",
    description: "Get help with product uploads, payouts, and managing your storefront.",
    icon: "storefront-outline",
  },
];

export default function SupportScreen() {
  const router = useRouter();

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
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>Help & Support</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>We're here when something needs attention.</Text>
          </View>
        </View>

        {supportItems.map((item) => (
          <View
            key={item.title}
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
                backgroundColor: colors.primaryLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={22}
                color={colors.primary}
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
