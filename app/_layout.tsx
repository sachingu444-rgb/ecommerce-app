import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

import FullScreenLoader from "../components/FullScreenLoader";
import { colors } from "../constants/theme";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { useCartSync } from "../hooks/useCartSync";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { stripePublishableKey } from "../lib/payment";
import { StripeProvider } from "../lib/stripe";

const RootNavigator = () => {
  const { loading, user, isSeller, isBuyer, isAdmin } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  useCartSync();
  usePushNotifications(user?.uid);

  useEffect(() => {
    if (loading) {
      return;
    }

    const firstSegment = segments[0];
    const inAuth = firstSegment === "(auth)";
    const inSeller = firstSegment === "seller";
    const inAdmin = firstSegment === "admin";

    if (!user && (inSeller || inAdmin)) {
      router.replace("/(auth)/login");
      return;
    }

    if (user && isAdmin && !inAdmin) {
      router.replace("/admin/dashboard");
      return;
    }

    if (user && isSeller && !inSeller) {
      router.replace("/seller/dashboard");
      return;
    }

    if (user && isBuyer && inAuth) {
      router.replace("/(tabs)");
    }
  }, [isAdmin, isBuyer, isSeller, loading, pathname, router, segments, user]);

  if (loading) {
    return <FullScreenLoader label="Checking your account..." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" backgroundColor={colors.primary} translucent={false} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="order-confirmation" />
        <Stack.Screen name="search" />
        <Stack.Screen name="deals" />
        <Stack.Screen name="wishlist" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="permissions" />
        <Stack.Screen name="addresses" />
        <Stack.Screen name="support" />
        <Stack.Screen name="about" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen name="seller" />
        <Stack.Screen name="admin" />
      </Stack>
      <Toast />
    </View>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider
        publishableKey={stripePublishableKey}
        merchantIdentifier="merchant.com.shopapp.marketplace"
      >
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
