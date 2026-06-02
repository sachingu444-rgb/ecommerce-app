import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from "react-native";

import EmptyState from "../../components/EmptyState";
import SellerProductForm from "../../components/SellerProductForm";
import { MOBILE_BREAKPOINT } from "../../constants/layout";
import { colors, spacing } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { fetchProductById, updateProduct, uploadImages } from "../../lib/firebaseApi";
import { showToast } from "../../lib/toast";
import { Product } from "../../types";

export default function EditProductScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < MOBILE_BREAKPOINT;
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          padding: compact ? spacing.md : spacing.lg,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: compact ? spacing.md : spacing.lg }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: compact ? 38 : 42,
              height: compact ? 38 : 42,
              borderRadius: compact ? 19 : 21,
              backgroundColor: colors.white,
              alignItems: "center",
              justifyContent: "center",
              marginTop: compact ? 2 : 0,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: compact ? 24 : 28, lineHeight: compact ? 30 : 34, fontWeight: "900", color: colors.text }}>Edit Product</Text>
            <Text style={{ color: colors.muted, marginTop: 4, fontSize: compact ? 13 : 14, lineHeight: compact ? 20 : 21 }}>
              Update pricing, stock and media for this listing.
            </Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}
