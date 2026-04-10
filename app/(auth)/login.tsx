import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";

import FormField from "../../components/FormField";
import GoogleAuthButton from "../../components/GoogleAuthButton";
import { colors, radius, spacing } from "../../constants/theme";
import { auth } from "../../firebaseConfig";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { resolveRoleForEmail } from "../../lib/admin";
import { getFirebaseAuthErrorMessage } from "../../lib/firebaseErrors";
import { fetchUserProfile } from "../../lib/firebaseApi";
import { getDefaultRouteForRole } from "../../lib/roleRoutes";
import { showToast } from "../../lib/toast";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    loading: googleLoading,
    signInWithGoogle,
  } = useGoogleAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const profile = await fetchUserProfile(credential.user.uid);
      const role = resolveRoleForEmail(
        profile?.role || "buyer",
        credential.user.email || email.trim()
      );
      showToast("success", "Welcome back", "Your account is ready.");
      router.replace(getDefaultRouteForRole(role));
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const result = await signInWithGoogle();
    if (!result) {
      return;
    }

    router.replace(getDefaultRouteForRole(result.role));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={{ flex: 1 }}
        >
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl }}>
              <Pressable
                onPress={() => router.back()}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.18)",
                }}
              >
                <Ionicons name="arrow-back" size={20} color={colors.white} />
              </Pressable>

              <View style={{ marginTop: spacing.xxxl, marginBottom: spacing.xxxl }}>
                <Text style={{ fontSize: 32, color: colors.white, fontWeight: "900" }}>
                  🛒 ShopApp
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.82)", marginTop: spacing.sm }}>
                  Sign in to unlock faster checkout, saved carts and personalized deals.
                </Text>
              </View>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: colors.white,
                borderTopLeftRadius: 34,
                borderTopRightRadius: 34,
                padding: spacing.xl,
                paddingTop: spacing.xxxl,
                minHeight: 560,
              }}
            >
              <Text style={{ fontSize: 26, fontWeight: "900", color: colors.text }}>
                Welcome Back 👋
              </Text>
              <Text style={{ color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.xl }}>
                Pick up right where you left off.
              </Text>

              <FormField
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Email address"
              />
              <FormField
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secure}
                placeholder="Password"
                secureToggle
                secureVisible={!secure}
                onToggleSecure={() => setSecure((current) => !current)}
                error={error}
              />

              <Link href="/(auth)/forgot-password" asChild>
                <Pressable style={{ alignSelf: "flex-end", marginBottom: spacing.xl }}>
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>Forgot Password?</Text>
                </Pressable>
              </Link>

              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={{
                  backgroundColor: loading ? colors.primaryDark : colors.primary,
                  borderRadius: radius.md,
                  paddingVertical: spacing.md + 2,
                  alignItems: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={{ color: colors.white, fontSize: 16, fontWeight: "900" }}>
                    Sign In
                  </Text>
                )}
              </Pressable>

              <GoogleAuthButton
                label="Continue with Google"
                loading={googleLoading}
                onPress={handleGoogleLogin}
              />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: spacing.xl,
                  gap: spacing.sm,
                }}
              >
                <Text style={{ color: colors.muted }}>New here?</Text>
                <Link href="/(auth)/register" asChild>
                  <Pressable>
                    <Text style={{ color: colors.primary, fontWeight: "800" }}>
                      Create Account
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
