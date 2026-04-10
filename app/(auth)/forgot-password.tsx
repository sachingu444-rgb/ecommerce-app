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
import { sendPasswordResetEmail } from "firebase/auth";

import FormField from "../../components/FormField";
import { colors, radius, spacing } from "../../constants/theme";
import { auth } from "../../firebaseConfig";
import { getFirebaseAuthErrorMessage } from "../../lib/firebaseErrors";
import { showToast } from "../../lib/toast";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReset = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await sendPasswordResetEmail(auth, email.trim());
      const message = "Password reset email sent. Check your inbox.";
      setSuccess(message);
      showToast("success", "Email sent", message);
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
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

              <View style={{ marginTop: spacing.xxxl, marginBottom: spacing.xxxl }}>
                <Text style={{ fontSize: 32, color: colors.white, fontWeight: "900" }}>
                  Reset Password
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.82)", marginTop: spacing.sm }}>
                  Enter the email linked to your ShopApp account and we will send reset instructions.
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
                minHeight: 420,
              }}
            >
              <FormField
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Email address"
                error={error}
              />

              {success ? (
                <View
                  style={{
                    backgroundColor: "#DCFCE7",
                    borderRadius: radius.md,
                    padding: spacing.md,
                    marginBottom: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.success, fontWeight: "700" }}>{success}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleReset}
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
                    Send Reset Link
                  </Text>
                )}
              </Pressable>

              <Link href="/(auth)/login" asChild>
                <Pressable style={{ alignSelf: "center", marginTop: spacing.xl }}>
                  <Text style={{ color: colors.primary, fontWeight: "800" }}>Back to login</Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

