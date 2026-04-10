import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";

import FullScreenLoader from "../../components/FullScreenLoader";
import { colors } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";

export default function SellerLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, user, profile } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    if (profile?.role !== "seller" && pathname !== "/seller/register") {
      router.replace("/");
      return;
    }

    if (profile?.role === "seller" && pathname === "/seller/register") {
      router.replace("/seller/dashboard");
    }
  }, [loading, pathname, profile?.role, router, user]);

  if (loading) {
    return <FullScreenLoader label="Opening seller portal..." />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
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
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
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
      <Tabs.Screen name="add-product" options={{ href: null }} />
      <Tabs.Screen name="edit-product" options={{ href: null }} />
      <Tabs.Screen name="register" options={{ href: null }} />
    </Tabs>
  );
}

