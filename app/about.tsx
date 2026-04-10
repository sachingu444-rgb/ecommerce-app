import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import { colors, radius, spacing } from "../constants/theme";

export default function AboutScreen() {
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
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>About ShopApp</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>Marketplace shopping and selling in one app.</Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.xl }}>
          <Text style={{ fontSize: 32, fontWeight: "900", color: colors.primary }}>🛒 ShopApp</Text>
          <Text style={{ color: colors.muted, marginTop: spacing.md, lineHeight: 22 }}>
            ShopApp brings together a buyer portal and seller portal in a single mobile experience.
            Buyers can discover products, track orders and pay securely with Stripe, while sellers manage
            inventory, fulfill orders and grow revenue through Firebase-powered tools.
          </Text>

          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <Text style={{ color: colors.text, fontWeight: "900" }}>Version 1.0.0</Text>
            <Text style={{ color: colors.muted }}>Built with Expo Router, Firebase, Stripe and Zustand.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
