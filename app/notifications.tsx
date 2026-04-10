import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import EmptyState from "../components/EmptyState";
import { colors, radius, spacing } from "../constants/theme";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { formatDate } from "../lib/utils";
import { AppNotification } from "../types";

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAllAsRead, markAsRead } =
    useNotifications(user?.uid);

  const handleNotificationPress = async (notification: AppNotification) => {
    if (user && !notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.route) {
      router.push(notification.route as never);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
          <EmptyState
            icon="notifications-outline"
            title="Sign in to view alerts"
            subtitle="Order alerts for sellers and delivery alerts for customers show up here after login."
            buttonLabel="Sign In"
            onPress={() => router.push("/(auth)/login")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            marginBottom: spacing.lg,
          }}
        >
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
              Notifications
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              Live order alerts synced from Firebase.
            </Text>
          </View>
          {unreadCount > 0 ? (
            <Pressable
              onPress={() => void markAllAsRead()}
              style={{
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
            >
              <Text style={{ color: colors.white, fontWeight: "800" }}>Mark all read</Text>
            </Pressable>
          ) : null}
        </View>

        <View
          style={{
            backgroundColor: colors.white,
            borderRadius: radius.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "900", fontSize: 18 }}>
            Alert Center
          </Text>
          <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 20 }}>
            Sellers get new-order alerts. Customers get a delivery alert once an order is marked
            delivered.
          </Text>
          <Text style={{ color: colors.primary, marginTop: spacing.md, fontWeight: "900" }}>
            {unreadCount} unread alert{unreadCount === 1 ? "" : "s"}
          </Text>
        </View>

        {notifications.map((notification) => (
          <Pressable
            key={notification.id}
            onPress={() => void handleNotificationPress(notification)}
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginBottom: spacing.md,
              borderLeftWidth: 4,
              borderLeftColor: notification.read ? colors.border : colors.accent,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: spacing.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>
                  {notification.title}
                </Text>
                <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 20 }}>
                  {notification.message}
                </Text>
                <Text style={{ color: colors.muted, marginTop: spacing.md, fontSize: 12 }}>
                  {formatDate(notification.createdAt, true)}
                </Text>
              </View>
              {!notification.read ? (
                <View
                  style={{
                    minWidth: 62,
                    alignItems: "center",
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                    backgroundColor: colors.primaryLight,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 12 }}>
                    New
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ))}

        {!loading && notifications.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.lg,
              padding: spacing.xl,
              alignItems: "center",
            }}
          >
            <Ionicons name="notifications-off-outline" size={28} color={colors.muted} />
            <Text
              style={{
                color: colors.text,
                fontWeight: "900",
                fontSize: 18,
                marginTop: spacing.md,
              }}
            >
              No notifications yet
            </Text>
            <Text
              style={{
                color: colors.muted,
                marginTop: spacing.sm,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Your latest seller and customer alerts will appear here automatically.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
