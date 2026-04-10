import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useMemo, useState } from "react";
import {
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

import DesktopSiteFooter from "../components/DesktopSiteFooter";
import { colors, radius, spacing } from "../constants/theme";
import { showToast } from "../lib/toast";

type PermissionStatusLabel = "unknown" | "granted" | "denied" | "unsupported" | "prompt";
type PermissionCardId = "notifications" | "storage";

const permissionCards: Array<{
  id: PermissionCardId;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    id: "notifications",
    title: "Notifications",
    subtitle: "Order updates, offers, and important account alerts.",
    icon: "notifications-outline",
  },
  {
    id: "storage",
    title: "Storage and Photos",
    subtitle: "Pick product photos, upload store images, and access gallery files.",
    icon: "images-outline",
  },
];

const statusMeta = {
  granted: { label: "Allowed", color: colors.success, bg: "#DCFCE7" },
  denied: { label: "Blocked", color: colors.danger, bg: "#FEE2E2" },
  prompt: { label: "Ask", color: colors.accent, bg: "#FEF3C7" },
  unknown: { label: "Unknown", color: colors.muted, bg: "#E5E7EB" },
  unsupported: { label: "Unsupported", color: colors.muted, bg: "#E5E7EB" },
} as const;

const toStorageStatus = (permission?: {
  granted?: boolean;
  canAskAgain?: boolean;
  status?: string;
}): PermissionStatusLabel => {
  if (permission?.granted) {
    return "granted";
  }

  if (permission?.canAskAgain === false || permission?.status === "denied") {
    return "denied";
  }

  return "prompt";
};

export default function PermissionsScreen() {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<PermissionCardId, PermissionStatusLabel>>({
    notifications: "unknown",
    storage: "unknown",
  });
  const [busyId, setBusyId] = useState<PermissionCardId | null>(null);

  const refreshStatuses = useCallback(async () => {
    const next: Record<PermissionCardId, PermissionStatusLabel> = {
      notifications: "unsupported",
      storage: "unsupported",
    };

    try {
      if (Platform.OS === "web") {
        const notificationApi = (globalThis as { Notification?: { permission?: string } }).Notification;
        if (notificationApi) {
          const permission = String(notificationApi.permission || "default");
          next.notifications =
            permission === "granted"
              ? "granted"
              : permission === "denied"
                ? "denied"
                : "prompt";
        }
      } else if (Platform.OS === "android") {
        const androidVersion = Number(Platform.Version || 0);
        if (
          androidVersion < 33 ||
          !PermissionsAndroid?.PERMISSIONS?.POST_NOTIFICATIONS ||
          !PermissionsAndroid?.check
        ) {
          next.notifications = "granted";
        } else {
          const allowed = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          next.notifications = allowed ? "granted" : "prompt";
        }
      }

      const mediaPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      next.storage = toStorageStatus(mediaPermission);
    } catch {
      // Keep the fallback statuses above.
    }

    setStatuses(next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStatuses();
    }, [refreshStatuses])
  );

  const openAppSettings = useCallback(async () => {
    try {
      if (Linking?.openSettings) {
        await Linking.openSettings();
        return;
      }
    } catch {
      // Fall through to the toast below.
    }

    showToast("info", "Open settings", "Please open the app settings and allow the permission.");
  }, []);

  const requestPermission = useCallback(
    async (id: PermissionCardId) => {
      setBusyId(id);

      try {
        if (id === "notifications") {
          if (Platform.OS === "web") {
            const notificationApi = (globalThis as {
              Notification?: {
                requestPermission?: () => Promise<string>;
              };
            }).Notification;

            if (!notificationApi?.requestPermission) {
              showToast("info", "Unsupported", "Notifications are not available here.");
              return;
            }

            const result = await notificationApi.requestPermission();
            showToast(
              result === "granted" ? "success" : "info",
              result === "granted" ? "Notifications enabled" : "Notification permission updated"
            );
            return;
          }

          if (Platform.OS !== "android") {
            showToast(
              "info",
              "Android permission ready",
              "Notification access is configured for the Android app build."
            );
            return;
          }

          const androidVersion = Number(Platform.Version || 0);
          if (
            androidVersion < 33 ||
            !PermissionsAndroid?.PERMISSIONS?.POST_NOTIFICATIONS ||
            !PermissionsAndroid?.request
          ) {
            showToast("success", "Notifications ready", "This Android version does not need a runtime notification prompt.");
            return;
          }

          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: "Allow notifications",
              message: "ShopApp uses notifications for order updates and important alerts.",
              buttonPositive: "Allow",
              buttonNegative: "Not now",
            }
          );

          if (result === PermissionsAndroid.RESULTS.GRANTED) {
            showToast("success", "Notifications enabled");
            return;
          }

          if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            showToast("info", "Blocked in settings", "Open app settings to enable notifications.");
            await openAppSettings();
            return;
          }

          showToast("info", "Notifications not allowed");
          return;
        }

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.granted) {
          showToast("success", "Storage access enabled");
          return;
        }

        if (permission.canAskAgain === false) {
          showToast("info", "Blocked in settings", "Open app settings to enable storage access.");
          await openAppSettings();
          return;
        }

        showToast("error", "Storage permission is required", "Please allow photo and file access.");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Please allow the permission when the app asks for it.";
        showToast("error", "Permission request failed", message);
      } finally {
        setBusyId(null);
        refreshStatuses();
      }
    },
    [openAppSettings, refreshStatuses]
  );

  const requestAll = useCallback(async () => {
    for (const item of permissionCards) {
      await requestPermission(item.id);
    }
  }, [requestPermission]);

  const allGranted = useMemo(
    () => permissionCards.every((item) => statuses[item.id] === "granted"),
    [statuses]
  );

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
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>
              App Permissions
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              Allow notifications and storage access for the Android app.
            </Text>
          </View>
          <Pressable
            onPress={requestAll}
            disabled={busyId !== null}
            style={{
              backgroundColor: colors.primary,
              borderRadius: radius.md,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              opacity: busyId ? 0.7 : 1,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: "800" }}>Allow All</Text>
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "900" }}>
            Permission Center
          </Text>
          <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 22 }}>
            Notifications help with order updates. Storage access is needed for gallery uploads and
            store images. If you blocked a permission before, use app settings to enable it again.
          </Text>

          <View
            style={{
              marginTop: spacing.lg,
              backgroundColor: allGranted ? "#DCFCE7" : colors.bg,
              borderRadius: radius.md,
              padding: spacing.md,
            }}
          >
            <Text
              style={{
                color: allGranted ? colors.success : colors.text,
                fontWeight: "900",
              }}
            >
              {allGranted ? "All required permissions are enabled." : "Some permissions still need your approval."}
            </Text>
          </View>
        </View>

        <View style={{ gap: spacing.md }}>
          {permissionCards.map((item) => {
            const meta = statusMeta[statuses[item.id] || "unknown"];
            const busy = busyId === item.id;
            const blocked = statuses[item.id] === "denied";

            return (
              <View
                key={item.id}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: spacing.lg,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 }}>
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      backgroundColor: colors.primaryLight,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name={item.icon} size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>
                      {item.title}
                    </Text>
                    <Text style={{ color: colors.muted, marginTop: 4 }}>
                      {item.subtitle}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end", gap: spacing.sm }}>
                  <View
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: 6,
                      borderRadius: radius.pill,
                      backgroundColor: meta.bg,
                    }}
                  >
                    <Text style={{ color: meta.color, fontWeight: "800" }}>{meta.label}</Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      blocked ? openAppSettings() : requestPermission(item.id)
                    }
                    disabled={busy}
                    style={{
                      backgroundColor: busy ? colors.primaryDark : colors.primary,
                      borderRadius: radius.md,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm + 2,
                    }}
                  >
                    <Text style={{ color: colors.white, fontWeight: "800" }}>
                      {busy ? "Requesting..." : blocked ? "Settings" : "Allow"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        {Platform.OS === "web" ? <DesktopSiteFooter /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
