import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, Platform } from "react-native";

import { defaultBuyerPageContent } from "../../constants/buyerPageContent";
import { colors } from "../../constants/theme";
import { subscribeToBuyerPageContent } from "../../lib/firebaseApi";
import { useCartStore } from "../../store/cartStore";
import { BuyerPageContent } from "../../types";

export default function BuyerTabsLayout() {
  const totalItems = useCartStore((state) => state.totalItems());
  const isDesktopWeb = Platform.OS === "web" && Dimensions.get("window").width >= 1080;
  const [pageContent, setPageContent] = useState<BuyerPageContent>(defaultBuyerPageContent);

  useEffect(() => {
    const unsubscribe = subscribeToBuyerPageContent(setPageContent);
    return () => unsubscribe();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          display: isDesktopWeb ? "none" : "flex",
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: pageContent.pages.homeTitle,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: pageContent.pages.categoriesTitle,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.accent,
            color: colors.white,
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
