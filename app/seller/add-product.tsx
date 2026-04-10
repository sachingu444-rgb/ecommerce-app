import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";

import SellerProductForm from "../../components/SellerProductForm";
import { colors, spacing } from "../../constants/theme";
import { auth } from "../../firebaseConfig";
import { useAuth } from "../../hooks/useAuth";
import { getFirebaseGenericErrorMessage } from "../../lib/firebaseErrors";
import { showToast } from "../../lib/toast";
import { uploadProduct } from "../../lib/uploadProduct";

export default function AddProductScreen() {
  const router = useRouter();
  const { loading: authLoading, user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const currentUser = auth.currentUser || user;

  const sellerName = useMemo(
    () =>
      profile?.storeName?.trim() ||
      profile?.name?.trim() ||
      currentUser?.displayName ||
      "ShopApp Seller",
    [currentUser?.displayName, profile?.name, profile?.storeName]
  );

  if (!currentUser) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.xl,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
            Seller login required
          </Text>
          <Text
            style={{
              marginTop: spacing.sm,
              color: colors.muted,
              textAlign: "center",
            }}
          >
            Sign in to add and manage products in your store.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, padding: spacing.lg }}>
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
              Add Product
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              Create a richer marketplace listing with category-based options and specs.
            </Text>
          </View>
        </View>

        <SellerProductForm
          loading={loading}
          uploadProgress={uploadProgress}
          submitLabel="Publish Product"
          onSubmit={async (values) => {
            if (authLoading) {
              showToast(
                "info",
                "Checking your account",
                "Please wait a moment and try again."
              );
              return;
            }

            const parsedPrice = Number(values.price);
            const parsedOriginalPrice = Number(values.originalPrice);
            const parsedStock = Number(values.stock);

            if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
              showToast("error", "Invalid price", "Enter a valid selling price.");
              return;
            }

            if (!Number.isFinite(parsedOriginalPrice) || parsedOriginalPrice <= 0) {
              showToast("error", "Invalid original price", "Enter a valid original price.");
              return;
            }

            if (!Number.isFinite(parsedStock) || parsedStock < 0) {
              showToast("error", "Invalid stock", "Enter a valid stock quantity.");
              return;
            }

            try {
              setLoading(true);
              setUploadProgress(0);

              await uploadProduct({
                name: values.name,
                subtitle: values.subtitle,
                brand: values.brand,
                price: parsedPrice,
                originalPrice: parsedOriginalPrice,
                imageUris: values.newAssets.map((asset) => asset.uri),
                category: values.category,
                description: values.description,
                stock: parsedStock,
                sellerName,
                isFeatured: values.isFeatured,
                isDeal: values.isDeal,
                highlights: values.highlights,
                specifications: values.specifications,
                options: values.options,
                deliveryInfo: values.deliveryInfo,
                returnPolicy: values.returnPolicy,
                warranty: values.warranty,
                onProgress: setUploadProgress,
              });

              showToast("success", "Product added", "Your product is now live for buyers.");
              router.replace("/seller/products");
            } catch (error) {
              console.error("[AddProductScreen] Failed to add product", error);
              showToast(
                "error",
                "Could not add product",
                getFirebaseGenericErrorMessage(
                  error,
                  "Please check your connection and try again."
                )
              );
            } finally {
              setLoading(false);
              setUploadProgress(0);
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}
