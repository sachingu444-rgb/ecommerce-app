import { useEffect } from "react";
import { Href, useRouter } from "expo-router";

import { useAuth } from "./useAuth";
import { UserRole } from "../types";

export function useRequireAuth(redirectTo = "/(auth)/login") {
  const { user, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!user) {
      router.replace(redirectTo as Href);
    }
  }, [authReady, redirectTo, router, user]);

  return { user, authReady, isAuthed: Boolean(user) };
}

export function useRequireRole(role: UserRole) {
  const { user, userRole, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    if (userRole && userRole !== role) {
      router.replace("/");
    }
  }, [authReady, role, router, user, userRole]);

  return { user, userRole, authReady };
}
