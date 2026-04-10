import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";

import FullScreenLoader from "../../components/FullScreenLoader";
import { colors } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";

export default function AdminLayout() {
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

    if (profile?.role !== "admin") {
      router.replace("/");
    }
  }, [loading, pathname, profile?.role, router, user]);

  if (loading) {
    return <FullScreenLoader label="Opening admin command center..." />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}
