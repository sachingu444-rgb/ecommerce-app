import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useMemo, useState } from "react";
import { Platform } from "react-native";

import { auth } from "../firebaseConfig";
import { getFirebaseAuthErrorMessage } from "../lib/firebaseErrors";
import { ensureUserProfile } from "../lib/authProfile";
import { showToast } from "../lib/toast";
import { UserRole } from "../types";

WebBrowser.maybeCompleteAuthSession();

interface UseGoogleAuthOptions {
  preferredRole?: UserRole;
}

export const useGoogleAuth = ({
  preferredRole = "buyer",
}: UseGoogleAuthOptions = {}) => {
  const [loading, setLoading] = useState(false);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const isExpoGo =
    Platform.OS !== "web" &&
    Constants.executionEnvironment === "storeClient";

  const googleConfig = useMemo(
    () => ({
      clientId: webClientId || "missing-google-client-id",
      webClientId,
      androidClientId,
      iosClientId,
      selectAccount: true,
    }),
    [androidClientId, iosClientId, webClientId]
  );

  const platformClientId =
    Platform.OS === "android"
      ? androidClientId
      : Platform.OS === "ios"
        ? iosClientId
        : webClientId;

  const isConfigured = Boolean(platformClientId);

  const [request, , promptAsync] = Google.useIdTokenAuthRequest(googleConfig, {
    native: "shopapp:/oauthredirect",
  });

  const signInWithGoogle = async () => {
    if (isExpoGo) {
      showToast(
        "info",
        "Google sign-in needs a development build",
        "Expo Go cannot complete this native Google OAuth redirect. Build the app with expo run:android or EAS first."
      );
      return null;
    }

    if (!isConfigured) {
      showToast(
        "info",
        "Google sign-in needs setup",
        Platform.OS === "android"
          ? "Add EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID after creating the Android OAuth client with your package name and SHA-1."
          : Platform.OS === "ios"
            ? "Add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID to the Expo public env variables first."
            : "Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to the Expo public env variables first."
      );
      return null;
    }

    if (!request) {
      showToast(
        "info",
        "Google sign-in is preparing",
        "Please try again in a moment."
      );
      return null;
    }

    try {
      setLoading(true);
      const result = await promptAsync();

      if (result.type !== "success") {
        return null;
      }

      const idToken =
        result.params.id_token || result.authentication?.idToken;

      if (!idToken) {
        showToast(
          "error",
          "Google sign-in failed",
          "No ID token was returned from Google."
        );
        return null;
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const authResult = await signInWithCredential(auth, credential);
      const profileResult = await ensureUserProfile(
        authResult.user,
        preferredRole
      );

      showToast(
        "success",
        profileResult.isNewUser
          ? "Google account connected"
          : "Signed in with Google",
        profileResult.role === "admin"
          ? "Welcome to the admin command center."
          : profileResult.role === "seller"
            ? "Welcome to your seller workspace."
            : "Welcome back to ShopApp."
      );

      return profileResult;
    } catch (error) {
      showToast(
        "error",
        "Google sign-in failed",
        getFirebaseAuthErrorMessage(error)
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    googleReady: Boolean(request) && isConfigured,
    loading,
    signInWithGoogle,
  };
};
