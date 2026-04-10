import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";

import EmptyState from "../../components/EmptyState";
import SellerProductForm from "../../components/SellerProductForm";
import { colors, spacing } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { fetchProductById, updateProduct, uploadImages } from "../../lib/firebaseApi";
import { showToast } from "../../lib/toast";
import { Product } from "../../types";

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!id) {
        return;
      }

      fetchProductById(id).then(setProduct);
    }, [id])
  );

  if (!user) {
    return null;
  }

  if (!product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
          <EmptyState
            icon="create-outline"
            title="Product not found"
            subtitle="We couldn't load this listing for editing."
            buttonLabel="Back to products"
            onPress={() => router.replace("/seller/products")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.lg }}>
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
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text }}>Edit Product</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>Update pricing, stock and media for this listing.</Text>
          </View>
        </View>

        <SellerProductForm
          initialProduct={product}
          loading={loading}
          uploadProgress={uploadProgress}
          submitLabel="Save Changes"
          onSubmit={async (values) => {
            setLoading(true);
            setUploadProgress(0);
            try {
              const uploaded = values.newAssets.length
                ? await uploadImages(user.uid, values.newAssets, setUploadProgress)
                : [];
              const nextImages = [...values.existingImages, ...uploaded].slice(0, 5);

              await updateProduct(product.id, {
                name: values.name,
                subtitle: values.subtitle,
                brand: values.brand,
                category: values.category,
                description: values.description,
                price: Number(values.price),
                originalPrice: Number(values.originalPrice),
                stock: Number(values.stock),
                isFeatured: values.isFeatured,
                isDeal: values.isDeal,
                highlights: values.highlights,
                specifications: values.specifications,
                options: values.options,
                deliveryInfo: values.deliveryInfo,
                returnPolicy: values.returnPolicy,
                warranty: values.warranty,
                image: nextImages[0] || "",
                images: nextImages,
              });
              showToast("success", "Product updated");
              router.replace("/seller/products");
            } catch {
              showToast("error", "Could not update product", "Please try again.");
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
