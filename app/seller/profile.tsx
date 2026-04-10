import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { signOut } from "firebase/auth";

import AppImage from "../../components/AppImage";
import FormField from "../../components/FormField";
import { colors, radius, spacing } from "../../constants/theme";
import { auth } from "../../firebaseConfig";
import { useAuth } from "../../hooks/useAuth";
import { saveUserProfile, uploadSingleAsset } from "../../lib/firebaseApi";
import { showToast } from "../../lib/toast";

export default function SellerProfileScreen() {
  const { user, profile } = useAuth();
  const [storeName, setStoreName] = useState(profile?.storeName || "");
  const [ownerName, setOwnerName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [storeDescription, setStoreDescription] = useState(profile?.storeDescription || "");
  const [logo, setLogo] = useState(profile?.storeLogo || "");
  const [upiId, setUpiId] = useState(profile?.upiId || "");
  const [bankAccountName, setBankAccountName] = useState(profile?.bankAccountName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(profile?.bankAccountNumber || "");
  const [ifscCode, setIfscCode] = useState(profile?.ifscCode || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStoreName(profile?.storeName || "");
    setOwnerName(profile?.name || "");
    setPhone(profile?.phone || "");
    setStoreDescription(profile?.storeDescription || "");
    setLogo(profile?.storeLogo || "");
    setUpiId(profile?.upiId || "");
    setBankAccountName(profile?.bankAccountName || "");
    setBankAccountNumber(profile?.bankAccountNumber || "");
    setIfscCode(profile?.ifscCode || "");
  }, [profile]);

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>Store Profile</Text>
        <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
          Update how your storefront appears and where payouts should go.
        </Text>

        <View style={{ marginTop: spacing.lg, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: spacing.md }}>
            Store Logo
          </Text>
          <View style={{ alignItems: "center", marginBottom: spacing.lg }}>
            <AppImage
              uri={logo}
              containerStyle={{ width: 96, height: 96, borderRadius: 48 }}
            />
            <Pressable
              onPress={async () => {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) {
                  showToast("error", "Gallery permission is required.");
                  return;
                }
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  quality: 0.9,
                });
                if (result.canceled) {
                  return;
                }
                setLoading(true);
                try {
                  const uploadedLogo = await uploadSingleAsset(
                    `stores/${user.uid}/logo-${Date.now()}.jpg`,
                    result.assets[0].uri
                  );
                  setLogo(uploadedLogo);
                  showToast("success", "Store logo updated");
                } finally {
                  setLoading(false);
                }
              }}
              style={{
                marginTop: spacing.md,
                borderWidth: 1,
                borderColor: colors.primary,
                borderRadius: radius.md,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: "800" }}>Upload Logo</Text>
            </Pressable>
          </View>

          <FormField
            label="Store Name"
            icon="storefront-outline"
            value={storeName}
            onChangeText={setStoreName}
            placeholder="Store name"
          />
          <FormField
            label="Owner Name"
            icon="person-outline"
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Owner name"
          />
          <FormField
            label="Email"
            icon="mail-outline"
            value={profile?.email || ""}
            editable={false}
            placeholder="Email address"
          />
          <FormField
            label="Phone Number"
            icon="call-outline"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Store phone number"
          />
          <FormField
            label="Store Description"
            icon="document-text-outline"
          value={storeDescription}
          onChangeText={setStoreDescription}
          placeholder="Describe your store"
          multiline
          inputStyle={{ minHeight: 100, textAlignVertical: "top" }}
        />

          <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md }}>
            Bank / UPI Details
          </Text>
          <FormField
            label="UPI ID"
            icon="card-outline"
            value={upiId}
            onChangeText={setUpiId}
            placeholder="name@bank"
          />
          <FormField
            label="Bank Account Name"
            icon="person-circle-outline"
            value={bankAccountName}
            onChangeText={setBankAccountName}
            placeholder="Account holder name"
          />
          <FormField
            label="Bank Account Number"
            icon="cash-outline"
            value={bankAccountNumber}
            onChangeText={setBankAccountNumber}
            keyboardType="number-pad"
            placeholder="Account number"
          />
          <FormField
            label="IFSC Code"
            icon="business-outline"
            value={ifscCode}
            onChangeText={setIfscCode}
            placeholder="IFSC code"
          />

          <Pressable
            disabled={loading}
            onPress={async () => {
              setLoading(true);
              try {
                await saveUserProfile(user.uid, {
                  name: ownerName.trim(),
                  storeName: storeName.trim(),
                  phone: phone.trim(),
                  storeDescription: storeDescription.trim(),
                  storeLogo: logo,
                  upiId: upiId.trim(),
                  bankAccountName: bankAccountName.trim(),
                  bankAccountNumber: bankAccountNumber.trim(),
                  ifscCode: ifscCode.trim(),
                });
                showToast("success", "Store profile saved");
              } finally {
                setLoading(false);
              }
            }}
            style={{
              marginTop: spacing.md,
              backgroundColor: colors.primary,
              borderRadius: radius.md,
              alignItems: "center",
              paddingVertical: spacing.md,
            }}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={{ color: colors.white, fontWeight: "900" }}>Save Changes</Text>
            )}
          </Pressable>

          <Pressable
            onPress={async () => {
              await signOut(auth);
            }}
            style={{
              marginTop: spacing.md,
              backgroundColor: "#FEE2E2",
              borderRadius: radius.md,
              alignItems: "center",
              paddingVertical: spacing.md,
            }}
          >
            <Text style={{ color: colors.danger, fontWeight: "900" }}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
