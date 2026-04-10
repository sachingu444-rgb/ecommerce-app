import { Ionicons } from "@expo/vector-icons";
import { Dimensions, Platform, Pressable, Text, View } from "react-native";

import { colors, spacing } from "../constants/theme";

const footerColumns = [
  {
    title: "ABOUT",
    links: ["Contact Us", "About Us", "Careers", "Stories", "Press", "Corporate Information"],
  },
  {
    title: "GROUP COMPANIES",
    links: ["Myntra", "Cleartrip", "Shopsy"],
  },
  {
    title: "HELP",
    links: ["Payments", "Shipping", "Cancellation & Returns", "FAQ"],
  },
  {
    title: "CONSUMER POLICY",
    links: [
      "Cancellation & Returns",
      "Terms Of Use",
      "Security",
      "Privacy",
      "Sitemap",
      "Grievance Redressal",
      "ERP Compliance",
    ],
  },
];

const footerQuickLinks = [
  { label: "Become a Seller", icon: "storefront-outline" as const },
  { label: "Advertise", icon: "megaphone-outline" as const },
  { label: "Gift Cards", icon: "gift-outline" as const },
  { label: "Help Center", icon: "help-circle-outline" as const },
];

const paymentMethods = [
  "VISA",
  "Mastercard",
  "Maestro",
  "Amex",
  "UPI",
  "RuPay",
  "Net Banking",
  "Cash",
];

export default function DesktopSiteFooter() {
  const isDesktopWeb = Platform.OS === "web" && Dimensions.get("window").width >= 1080;

  if (!isDesktopWeb) {
    return null;
  }

  return (
    <View
      style={{
        marginTop: spacing.xxxl,
        backgroundColor: "#17212B",
        borderTopWidth: 1,
        borderTopColor: "#243243",
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1480,
          alignSelf: "center",
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xxxl,
          paddingBottom: spacing.xxl,
        }}
      >
        <View style={{ flexDirection: "row", gap: spacing.xxxl }}>
          {footerColumns.map((column) => (
            <View key={column.title} style={{ flex: 1 }}>
              <Text style={{ color: "#8FA2B7", fontSize: 12, marginBottom: spacing.lg }}>
                {column.title}
              </Text>
              {column.links.map((link) => (
                <Pressable key={link} style={{ marginBottom: spacing.sm }}>
                  <Text style={{ color: colors.white, fontSize: 15, fontWeight: "700" }}>
                    {link}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}

          <View
            style={{
              width: 1,
              backgroundColor: "#314256",
              marginHorizontal: spacing.md,
            }}
          />

          <View style={{ width: 300 }}>
            <Text style={{ color: "#8FA2B7", fontSize: 12, marginBottom: spacing.lg }}>
              Mail Us:
            </Text>
            <Text style={{ color: colors.white, fontSize: 15, lineHeight: 30, fontWeight: "700" }}>
              ShopApp Internet Private Limited,{"\n"}
              Buildings Alyssa, Begonia &{"\n"}
              Clover Embassy Tech Village,{"\n"}
              Outer Ring Road, Bengaluru,{"\n"}
              Karnataka, India
            </Text>

            <Text
              style={{
                color: "#8FA2B7",
                fontSize: 12,
                marginTop: spacing.xl,
                marginBottom: spacing.md,
              }}
            >
              Social:
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              {(["logo-facebook", "logo-x", "logo-youtube", "logo-instagram"] as const).map((icon) => (
                <Pressable
                  key={icon}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: "#3A4C61",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={icon} size={18} color={colors.white} />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ width: 340 }}>
            <Text style={{ color: "#8FA2B7", fontSize: 12, marginBottom: spacing.lg }}>
              Registered Office Address:
            </Text>
            <Text style={{ color: colors.white, fontSize: 15, lineHeight: 30, fontWeight: "700" }}>
              ShopApp Internet Private Limited,{"\n"}
              Buildings Alyssa, Begonia &{"\n"}
              Clover Embassy Tech Village,{"\n"}
              Outer Ring Road, Bengaluru,{"\n"}
              Karnataka, India{"\n"}
              CIN: U51109KA2012PTC066107{"\n"}
              Telephone: 044-45614700
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: "#314256",
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 1480,
            alignSelf: "center",
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.lg,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xl }}>
            {footerQuickLinks.map((item) => (
              <Pressable key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Ionicons name={item.icon} size={16} color="#FACC15" />
                <Text style={{ color: colors.white, fontSize: 15 }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={{ color: colors.white, fontSize: 15 }}>(c) 2007-2026 ShopApp.com</Text>

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {paymentMethods.map((item) => (
              <View
                key={item}
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: colors.white,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 11, fontWeight: "800" }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
