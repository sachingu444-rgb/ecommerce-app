import { useEffect, useMemo, useState } from "react";

import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToUserNotifications,
} from "../lib/firebaseApi";
import { AppNotification } from "../types";

export const useNotifications = (uid?: string | null) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToUserNotifications(uid, (nextNotifications) => {
      setNotifications(nextNotifications);
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    loading,
    markAllAsRead: uid
      ? () => markAllNotificationsAsRead(uid)
      : async () => undefined,
    markAsRead: uid
      ? (notificationId: string) => markNotificationAsRead(uid, notificationId)
      : async (_notificationId: string) => undefined,
  };
};
