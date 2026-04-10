import Constants from "expo-constants";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { deletePushToken, savePushToken } from "../lib/firebaseApi";

const isNativeNotificationsSupported = Platform.OS !== "web";

if (isNativeNotificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const expoProjectId =
  Constants.easConfig?.projectId ||
  Constants.expoConfig?.extra?.eas?.projectId ||
  null;

const getNotificationRoute = (data: unknown) => {
  if (!data || typeof data !== "object") {
    return null;
  }

  if ("route" in data && typeof data.route === "string" && data.route.trim()) {
    return data.route;
  }

  if ("orderId" in data && typeof data.orderId === "string" && data.orderId.trim()) {
    return `/order/${data.orderId}`;
  }

  return null;
};

export const usePushNotifications = (uid?: string | null) => {
  const router = useRouter();
  const tokenRef = useRef<string | null>(null);
  const tokenOwnerRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isNativeNotificationsSupported) {
      return;
    }

    const hydrateLastNotificationResponse = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      const routeToOpen = getNotificationRoute(
        response?.notification.request.content.data
      );

      if (routeToOpen) {
        router.push(routeToOpen as never);
        await Notifications.clearLastNotificationResponseAsync();
      }
    };

    void hydrateLastNotificationResponse();
  }, [router]);

  useEffect(() => {
    if (!isNativeNotificationsSupported) {
      return;
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const routeToOpen = getNotificationRoute(
          response.notification.request.content.data
        );

        if (routeToOpen) {
          router.push(routeToOpen as never);
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (!isNativeNotificationsSupported) {
      return;
    }

    let cancelled = false;

    const registerForPushNotifications = async () => {
      try {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("orders", {
            name: "Orders",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#0066CC",
          });
        }

        const existingPermissions = await Notifications.getPermissionsAsync();
        const permissions =
          existingPermissions.granted ||
          existingPermissions.ios?.status ===
            Notifications.IosAuthorizationStatus.PROVISIONAL
            ? existingPermissions
            : await Notifications.requestPermissionsAsync();

        const granted =
          permissions.granted ||
          permissions.ios?.status ===
            Notifications.IosAuthorizationStatus.PROVISIONAL;

        if (!granted || !expoProjectId) {
          return;
        }

        const pushToken = await Notifications.getExpoPushTokenAsync({
          projectId: expoProjectId,
        });

        if (cancelled) {
          return;
        }

        if (!uid) {
          tokenRef.current = pushToken.data;
          return;
        }

        if (
          tokenRef.current &&
          tokenOwnerRef.current &&
          tokenOwnerRef.current !== uid
        ) {
          await deletePushToken(tokenOwnerRef.current, tokenRef.current);
        }

        await savePushToken(uid, pushToken.data, Platform.OS);
        tokenRef.current = pushToken.data;
        tokenOwnerRef.current = uid;
      } catch (error) {
        console.warn("[Notifications] Push registration skipped:", error);
      }
    };

    void registerForPushNotifications();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    if (uid || !tokenRef.current || !tokenOwnerRef.current) {
      return;
    }

    void deletePushToken(tokenOwnerRef.current, tokenRef.current);
    tokenOwnerRef.current = null;
  }, [uid]);
};
