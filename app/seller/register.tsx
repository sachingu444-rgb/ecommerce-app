import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

import FormField from "../../components/FormField";
import { colors, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { saveUserProfile } from "../../lib/firebaseApi";
import { showToast } from "../../lib/toast";

export default function SellerRegisterScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [storeName, setStoreName] = useState(profile?.storeName || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [storeDescription, setStoreDescription] = useState(profile?.storeDescription || "");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
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
              <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>Become a Seller</Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>Create your storefront in a few quick steps.</Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.primaryLight,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            <Text style={{ color: colors.primaryDark, fontWeight: "900", fontSize: 18 }}>
              Sell on ShopApp
            </Text>
            <Text style={{ color: colors.primaryDark, marginTop: spacing.sm, lineHeight: 20 }}>
              Upload products, manage stock, track incoming orders and build recurring revenue from your mobile storefront.
            </Text>
          </View>

          <View style={{ backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg }}>
            <FormField
              label="Store Name"
              icon="storefront-outline"
              value={storeName}
              onChangeText={setStoreName}
              placeholder="Enter your store name"
            />
            <FormField
              label="Phone Number"
              icon="call-outline"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Business phone number"
            />
            <FormField
              label="Store Description"
              icon="document-text-outline"
              value={storeDescription}
              onChangeText={setStoreDescription}
              placeholder="Tell customers what you sell"
              multiline
              inputStyle={{ minHeight: 100, textAlignVertical: "top" }}
            />

            <Pressable
              disabled={loading}
              onPress={async () => {
                if (!storeName.trim() || !phone.trim()) {
                  showToast("error", "Store name and phone number are required.");
                  return;
                }
                setLoading(true);
                await saveUserProfile(user.uid, {
                  role: "seller",
                  storeName: storeName.trim(),
                  phone: phone.trim(),
                  storeDescription: storeDescription.trim(),
                  storeApproved: false,
                });
                setLoading(false);
                showToast("success", "Seller profile created", "Welcome to the seller portal.");
                router.replace("/seller/dashboard");
              }}
              style={{
                marginTop: spacing.md,
                backgroundColor: colors.accent,
                borderRadius: radius.md,
                alignItems: "center",
                paddingVertical: spacing.md,
              }}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={{ color: colors.white, fontWeight: "900" }}>Create Seller Account</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
