import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Linking, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import { colors, radius, shadows, spacing } from "../constants/theme";

const githubProfileUrl = "https://github.com/sachingu444-rgb";
const githubRepositoryUrl = "https://github.com/sachingu444-rgb/ecommerce-app";

const skills = [
  "React Native",
  "Expo Router",
  "Firebase Auth",
  "Firestore",
  "Firebase Storage",
  "Stripe",
  "TypeScript",
  "Zustand",
];

const highlights = [
  "Built SachinIndia as a cross-platform ecommerce marketplace for buyers, sellers, and admins.",
  "Implemented authentication, role-based routing, product management, cart, orders, wallet, and notifications.",
  "Connected Firebase services for real-time app data and integrated payments for checkout flows.",
];

const projects = [
  {
    title: "SachinIndia Ecommerce Marketplace",
    detail:
      "Full-stack Expo app with buyer shopping, seller inventory tools, admin dashboard, wishlist, checkout, wallet top-ups, and order tracking.",
  },
  {
    title: "Seller Portal",
    detail:
      "Product upload, profile management, order handling, and store setup flows designed for mobile and web sellers.",
  },
  {
    title: "Admin Dashboard",
    detail:
      "Operational dashboard for reviewing products, users, orders, coupons, wallet requests, and marketplace activity.",
  },
];

const openUrl = (url: string) => {
  Linking.openURL(url).catch(() => undefined);
};

const ResumeSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View
    style={{
      backgroundColor: colors.white,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      gap: spacing.md,
      ...shadows.card,
    }}
  >
    <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>{title}</Text>
    {children}
  </View>
);

const LinkButton = ({
  label,
  icon,
  url,
  filled = false,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  url: string;
  filled?: boolean;
}) => (
  <Pressable
    onPress={() => openUrl(url)}
    style={{
      minHeight: 46,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: filled ? colors.primary : colors.white,
      borderWidth: 1,
      borderColor: filled ? colors.primary : colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    }}
  >
    <Ionicons name={icon} size={18} color={filled ? colors.white : colors.text} />
    <Text style={{ color: filled ? colors.white : colors.text, fontWeight: "900" }}>{label}</Text>
  </Pressable>
);

export default function ResumeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <View style={{ width: "100%", maxWidth: 980, alignSelf: "center", gap: spacing.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: colors.white,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
            <View>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: "900" }}>Resume</Text>
              <Text style={{ color: colors.muted, marginTop: 2 }}>SachinIndia developer profile</Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.primaryDark,
              borderRadius: radius.lg,
              padding: spacing.xxl,
              gap: spacing.lg,
            }}
          >
            <View style={{ gap: spacing.sm }}>
              <Text style={{ color: colors.white, fontSize: 34, fontWeight: "900" }}>Sachin</Text>
              <Text style={{ color: "#DCEBFA", fontSize: 18, fontWeight: "700" }}>
                Full-stack mobile and web app developer
              </Text>
              <Text style={{ color: "#E8F1FB", lineHeight: 23, maxWidth: 760 }}>
                I build practical commerce products with React Native, Expo, Firebase, and modern
                TypeScript. My current work is SachinIndia, an ecommerce marketplace with buyer,
                seller, and admin experiences.
              </Text>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
              <LinkButton label="GitHub Profile" icon="logo-github" url={githubProfileUrl} filled />
              <LinkButton label="Project Repository" icon="code-slash-outline" url={githubRepositoryUrl} />
            </View>
          </View>

          <ResumeSection title="Professional Summary">
            {highlights.map((item) => (
              <View key={item} style={{ flexDirection: "row", gap: spacing.sm }}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={{ color: colors.text, flex: 1, lineHeight: 22 }}>{item}</Text>
              </View>
            ))}
          </ResumeSection>

          <ResumeSection title="Technical Skills">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {skills.map((skill) => (
                <View
                  key={skill}
                  style={{
                    backgroundColor: colors.primaryLight,
                    borderRadius: radius.pill,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  }}
                >
                  <Text style={{ color: colors.primaryDark, fontWeight: "800" }}>{skill}</Text>
                </View>
              ))}
            </View>
          </ResumeSection>

          <ResumeSection title="Projects">
            {projects.map((project) => (
              <View key={project.title} style={{ gap: spacing.xs }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>
                  {project.title}
                </Text>
                <Text style={{ color: colors.muted, lineHeight: 22 }}>{project.detail}</Text>
              </View>
            ))}
          </ResumeSection>

          <ResumeSection title="Links">
            <View style={{ gap: spacing.sm }}>
              <Pressable onPress={() => openUrl(githubProfileUrl)}>
                <Text style={{ color: colors.primary, fontWeight: "800" }}>{githubProfileUrl}</Text>
              </Pressable>
              <Pressable onPress={() => openUrl(githubRepositoryUrl)}>
                <Text style={{ color: colors.primary, fontWeight: "800" }}>
                  {githubRepositoryUrl}
                </Text>
              </Pressable>
            </View>
          </ResumeSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
