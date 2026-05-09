import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { User, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

import { ErrorBoundary } from "../components/ErrorBoundary";
import { colors } from "../constants/theme";
import { auth } from "../firebaseConfig";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { useCartSync } from "../hooks/useCartSync";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { stripePublishableKey } from "../lib/payment";
import { StripeProvider } from "../lib/stripe";

const SplashScreen = () => (
  <View
    style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FFFFFF",
    }}
  >
    <Text style={{ fontSize: 24, fontWeight: "800", color: "#0066CC" }}>
      SachinIndia
    </Text>
    <ActivityIndicator color="#0066CC" style={{ marginTop: 16 }} />
  </View>
);

const RootNavigator = () => {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { isSeller, isBuyer, isAdmin, userRole } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  useCartSync();
  usePushNotifications(user?.uid);

  useEffect(() => {
    const hideWebSplash = () => {
      const webGlobal = globalThis as typeof globalThis & {
        __hideSplash?: () => void;
      };
      webGlobal.__hideSplash?.();
    };

    const timer = setTimeout(() => {
      setAuthReady(true);
      hideWebSplash();
    }, 1500);

    const unsub = onAuthStateChanged(auth, (nextUser) => {
      clearTimeout(timer);
      setUser(nextUser);
      setAuthReady(true);
      hideWebSplash();
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!authReady) {
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

    if (user && userRole === null) {
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
  }, [authReady, isAdmin, isBuyer, isSeller, pathname, router, segments, user, userRole]);

  if (!authReady) {
    return <SplashScreen />;
  }

  return (
    <ErrorBoundary>
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
          <Stack.Screen name="products" />
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
    </ErrorBoundary>
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
