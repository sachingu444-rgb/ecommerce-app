import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import { colors, radius, spacing } from "../constants/theme";
import { useAuth } from "../hooks/useAuth";
import { saveUserProfile } from "../lib/firebaseApi";
import { showToast } from "../lib/toast";

export default function AddressesScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [address, setAddress] = useState("");

  useEffect(() => {
    setAddress(profile?.address || "");
  }, [profile?.address]);

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
          <EmptyState
            icon="location-outline"
            title="Sign in to manage addresses"
            subtitle="Save delivery locations so checkout is faster next time."
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
          <View>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>My Addresses</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>Keep your most-used delivery details saved.</Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg }}>
          <FormField
            label="Saved address"
            icon="home-outline"
            value={address}
            onChangeText={setAddress}
            placeholder="Street, city, state, pincode"
            multiline
            inputStyle={{ minHeight: 80, textAlignVertical: "top" }}
          />

          <Pressable
            onPress={async () => {
              await saveUserProfile(user.uid, { address });
              showToast("success", "Address saved");
            }}
            style={{
              marginTop: spacing.md,
              backgroundColor: colors.primary,
              borderRadius: radius.md,
              alignItems: "center",
              paddingVertical: spacing.md,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: "900" }}>Save Address</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
