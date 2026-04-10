import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import FormField from "../../components/FormField";
import GoogleAuthButton from "../../components/GoogleAuthButton";
import { colors, radius, spacing } from "../../constants/theme";
import { auth, db } from "../../firebaseConfig";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { resolveRoleForEmail } from "../../lib/admin";
import { getFirebaseAuthErrorMessage } from "../../lib/firebaseErrors";
import { getDefaultRouteForRole } from "../../lib/roleRoutes";
import { showToast } from "../../lib/toast";
import { UserRole } from "../../types";

export default function RegisterScreen() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [confirmSecure, setConfirmSecure] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    loading: googleLoading,
    signInWithGoogle,
  } = useGoogleAuth({ preferredRole: role });

  const passwordMismatch =
    confirmPassword.length > 0 && confirmPassword !== password;

  const buttonText = role === "seller" ? "Create Seller Account" : "Create Account";

  const roleCards = useMemo(
    () => [
      {
        key: "buyer" as UserRole,
        label: "Shop / Buy",
        icon: "bag-handle-outline" as const,
        activeColor: colors.primary,
      },
      {
        key: "seller" as UserRole,
        label: "Sell Products",
        icon: "storefront-outline" as const,
        activeColor: colors.accent,
      },
    ],
    []
  );

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    if (passwordMismatch) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const resolvedRole = resolveRoleForEmail(role, email.trim());
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      await updateProfile(credential.user, {
        displayName: name.trim(),
      });
      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        name: name.trim(),
        email: email.trim(),
        role: resolvedRole,
        createdAt: serverTimestamp(),
        storeName: "",
        storeApproved: resolvedRole === "admin",
      });

      showToast(
        "success",
        resolvedRole === "admin"
          ? "Admin account ready"
          : resolvedRole === "seller"
            ? "Seller account created"
            : "Account created",
        resolvedRole === "admin"
          ? "Admin dashboard access is ready."
          : resolvedRole === "seller"
          ? "Welcome to the seller portal."
          : "Welcome to ShopApp."
      );
      router.replace(getDefaultRouteForRole(resolvedRole));
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
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
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ flex: 1 }}>
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

              <View style={{ marginTop: spacing.xxxl, marginBottom: spacing.xxl }}>
                <Text style={{ fontSize: 32, color: colors.white, fontWeight: "900" }}>
                  🛒 ShopApp
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.82)", marginTop: spacing.sm }}>
                  Create a buyer or seller account and start shopping or selling today.
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
              }}
            >
              <Text style={{ fontSize: 26, fontWeight: "900", color: colors.text }}>
                Join ShopApp
              </Text>
              <Text style={{ color: colors.muted, marginTop: spacing.sm, marginBottom: spacing.xl }}>
                Choose the experience that fits you best.
              </Text>

              <View style={{ flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl }}>
                {roleCards.map((item) => {
                  const active = role === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => setRole(item.key)}
                      style={{
                        flex: 1,
                        borderRadius: radius.lg,
                        padding: spacing.lg,
                        borderWidth: 1,
                        borderColor: active ? item.activeColor : colors.border,
                        backgroundColor: active ? item.activeColor : colors.white,
                      }}
                    >
                      <Ionicons
                        name={item.icon}
                        size={26}
                        color={active ? colors.white : item.activeColor}
                      />
                      <Text
                        style={{
                          marginTop: spacing.sm,
                          fontWeight: "900",
                          color: active ? colors.white : colors.text,
                        }}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {role === "seller" ? (
                <View
                  style={{
                    backgroundColor: colors.primaryLight,
                    borderRadius: radius.md,
                    padding: spacing.md,
                    marginBottom: spacing.lg,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.primary,
                  }}
                >
                  <Text style={{ color: colors.primaryDark, fontWeight: "800" }}>
                    As a seller you can upload products, manage inventory, track orders and grow your store.
                  </Text>
                </View>
              ) : null}

              <FormField
                icon="person-outline"
                value={name}
                onChangeText={setName}
                placeholder="Full name"
              />
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
                placeholder="Password (min 6 chars)"
                secureToggle
                secureVisible={!secure}
                onToggleSecure={() => setSecure((current) => !current)}
              />
              <FormField
                icon="shield-checkmark-outline"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={confirmSecure}
                placeholder="Confirm password"
                secureToggle
                secureVisible={!confirmSecure}
                onToggleSecure={() => setConfirmSecure((current) => !current)}
                error={passwordMismatch ? "Passwords do not match" : error}
              />

              <Pressable
                onPress={handleRegister}
                disabled={loading}
                style={{
                  backgroundColor: loading
                    ? role === "seller"
                      ? "#C97800"
                      : colors.primaryDark
                    : role === "seller"
                    ? colors.accent
                    : colors.primary,
                  borderRadius: radius.md,
                  paddingVertical: spacing.md + 2,
                  alignItems: "center",
                  marginTop: spacing.sm,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={{ color: colors.white, fontSize: 16, fontWeight: "900" }}>
                    {buttonText}
                  </Text>
                )}
              </Pressable>

              <GoogleAuthButton
                label={
                  role === "seller"
                    ? "Create Seller Account with Google"
                    : "Continue with Google"
                }
                loading={googleLoading}
                onPress={handleGoogleRegister}
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
                <Text style={{ color: colors.muted }}>Already have an account?</Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable>
                    <Text style={{ color: colors.primary, fontWeight: "800" }}>Sign In</Text>
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
