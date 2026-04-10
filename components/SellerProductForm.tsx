import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";

import { getCategoryListingTemplate } from "../constants/productListing";
import { categoryList } from "../constants/mockData";
import { colors, radius, spacing } from "../constants/theme";
import {
  buildOptionGroupsFromInputs,
  buildSpecificationsFromInputs,
  optionGroupsToInputMap,
  parseMultilineList,
  serializeMultilineList,
  specificationsToInputMap,
} from "../lib/productListing";
import { showToast } from "../lib/toast";
import { Product, ProductListingOption, ProductSpecification } from "../types";
import AppImage from "./AppImage";
import FormField from "./FormField";

export interface SellerProductFormValues {
  name: string;
  subtitle: string;
  brand: string;
  category: string;
  description: string;
  price: string;
  originalPrice: string;
  stock: string;
  isFeatured: boolean;
  isDeal: boolean;
  highlights: string[];
  specifications: ProductSpecification[];
  options: ProductListingOption[];
  deliveryInfo: string[];
  returnPolicy: string;
  warranty: string;
  existingImages: string[];
  newAssets: ImagePicker.ImagePickerAsset[];
}

interface SellerProductFormProps {
  initialProduct?: Product | null;
  loading?: boolean;
  uploadProgress?: number;
  submitLabel: string;
  onSubmit: (values: SellerProductFormValues) => Promise<void>;
}

const categories = categoryList.filter((item) => item.name !== "All");

const helperTextStyle = {
  color: colors.muted,
  fontSize: 12,
  marginTop: -6,
  marginBottom: spacing.md,
  lineHeight: 18,
} as const;

const sectionCardStyle = {
  marginTop: spacing.xl,
  backgroundColor: colors.white,
  borderRadius: radius.lg,
  padding: spacing.lg,
} as const;

const SellerProductForm = ({
  initialProduct,
  loading = false,
  uploadProgress = 0,
  submitLabel,
  onSubmit,
}: SellerProductFormProps) => {
  const [name, setName] = useState(initialProduct?.name || "");
  const [subtitle, setSubtitle] = useState(initialProduct?.subtitle || "");
  const [brand, setBrand] = useState(initialProduct?.brand || "");
  const [category, setCategory] = useState(initialProduct?.category || "Electronics");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [price, setPrice] = useState(initialProduct ? String(initialProduct.price) : "");
  const [originalPrice, setOriginalPrice] = useState(
    initialProduct ? String(initialProduct.originalPrice) : ""
  );
  const [stock, setStock] = useState(initialProduct ? String(initialProduct.stock) : "");
  const [isFeatured, setIsFeatured] = useState(initialProduct?.isFeatured || false);
  const [isDeal, setIsDeal] = useState(initialProduct?.isDeal || false);
  const [highlightsInput, setHighlightsInput] = useState(
    serializeMultilineList(initialProduct?.highlights)
  );
  const [deliveryInfoInput, setDeliveryInfoInput] = useState(
    serializeMultilineList(initialProduct?.deliveryInfo)
  );
  const [returnPolicy, setReturnPolicy] = useState(initialProduct?.returnPolicy || "");
  const [warranty, setWarranty] = useState(initialProduct?.warranty || "");
  const [optionInputs, setOptionInputs] = useState<Record<string, string>>(() =>
    optionGroupsToInputMap(initialProduct?.options)
  );
  const [specificationInputs, setSpecificationInputs] = useState<Record<string, string>>(() =>
    specificationsToInputMap(initialProduct?.specifications)
  );
  const [existingImages, setExistingImages] = useState<string[]>(
    initialProduct?.images || []
  );
  const [newAssets, setNewAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const totalImages = useMemo(
    () => existingImages.length + newAssets.length,
    [existingImages.length, newAssets.length]
  );
  const categoryTemplate = useMemo(
    () => getCategoryListingTemplate(category),
    [category]
  );

  const pickImages = async () => {
    if (totalImages >= 5) {
      showToast("error", "Maximum 5 images allowed");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast("error", "Gallery permission is required to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.9,
      selectionLimit: 5 - totalImages,
    });

    if (result.canceled) {
      return;
    }

    setNewAssets((current) =>
      [...current, ...result.assets].slice(0, 5 - existingImages.length)
    );
  };

  const currentOptionInputs = categoryTemplate.optionFields.reduce<Record<string, string>>(
    (accumulator, field) => {
      accumulator[field.label] = optionInputs[field.label] || "";
      return accumulator;
    },
    {}
  );

  const currentSpecificationInputs = categoryTemplate.specFields.reduce<Record<string, string>>(
    (accumulator, field) => {
      accumulator[field.label] = specificationInputs[field.label] || "";
      return accumulator;
    },
    {}
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "900",
          color: colors.text,
          marginBottom: spacing.md,
        }}
      >
        Product Images
      </Text>

      <Pressable
        onPress={pickImages}
        style={{
          borderWidth: 1.5,
          borderColor: colors.border,
          borderStyle: "dashed",
          borderRadius: radius.lg,
          backgroundColor: colors.white,
          minHeight: 150,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.lg,
        }}
      >
        <Ionicons name="add-circle-outline" size={34} color={colors.primary} />
        <Text style={{ color: colors.text, fontWeight: "900", marginTop: spacing.sm }}>
          Upload product images
        </Text>
        <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
          Tap to choose up to 5 images from your gallery
        </Text>
      </Pressable>

      {uploadProgress > 0 && loading ? (
        <View style={{ marginTop: spacing.md }}>
          <Text style={{ color: colors.muted, marginBottom: spacing.sm }}>
            Uploading images... {Math.round(uploadProgress)}%
          </Text>
          <View
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.border,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${uploadProgress}%`,
                height: "100%",
                backgroundColor: colors.primary,
              }}
            />
          </View>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ marginTop: spacing.md }}
      >
        {existingImages.map((image) => (
          <View key={image} style={{ marginRight: spacing.md }}>
            <AppImage
              uri={image}
              resizeMode="contain"
              containerStyle={{
                width: 110,
                height: 110,
                borderRadius: radius.lg,
                backgroundColor: colors.bg,
              }}
            />
            <Pressable
              onPress={() =>
                setExistingImages((current) => current.filter((item) => item !== image))
              }
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: "rgba(0,0,0,0.62)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={16} color={colors.white} />
            </Pressable>
          </View>
        ))}
        {newAssets.map((asset) => (
          <View key={asset.uri} style={{ marginRight: spacing.md }}>
            <AppImage
              uri={asset.uri}
              resizeMode="contain"
              containerStyle={{
                width: 110,
                height: 110,
                borderRadius: radius.lg,
                backgroundColor: colors.bg,
              }}
            />
            <Pressable
              onPress={() =>
                setNewAssets((current) => current.filter((item) => item.uri !== asset.uri))
              }
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: "rgba(0,0,0,0.62)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={16} color={colors.white} />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View style={sectionCardStyle}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: colors.text,
            marginBottom: spacing.md,
          }}
        >
          Product Details
        </Text>
        <FormField
          label="Product Name"
          icon="cube-outline"
          value={name}
          onChangeText={setName}
          placeholder="Product name"
        />
        <FormField
          label="Listing Subtitle"
          icon="information-circle-outline"
          value={subtitle}
          onChangeText={setSubtitle}
          placeholder="Short subtitle shown below the product name"
        />
        <FormField
          label="Brand / Label"
          icon="ribbon-outline"
          value={brand}
          onChangeText={setBrand}
          placeholder="Brand name or store label"
        />

        <Text
          style={{
            color: colors.text,
            fontSize: 13,
            fontWeight: "700",
            marginBottom: spacing.sm,
          }}
        >
          Category
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.sm }}
        >
          {categories.map((item) => {
            const active = category === item.name;
            return (
              <Pressable
                key={item.id}
                onPress={() => setCategory(item.name)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm + 2,
                  borderRadius: radius.pill,
                  marginRight: spacing.sm,
                  backgroundColor: active ? item.color : colors.bg,
                }}
              >
                <Text style={{ color: active ? colors.white : colors.text, fontWeight: "800" }}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <FormField
          label="Description"
          icon="document-text-outline"
          value={description}
          onChangeText={setDescription}
          placeholder="Write a product description"
          multiline
          inputStyle={{ minHeight: 120, textAlignVertical: "top" }}
        />
        <FormField
          label="Price"
          icon="cash-outline"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          placeholder="Selling price"
        />
        <FormField
          label="Original Price"
          icon="pricetags-outline"
          value={originalPrice}
          onChangeText={setOriginalPrice}
          keyboardType="decimal-pad"
          placeholder="Original price"
        />
        <FormField
          label="Stock Quantity"
          icon="layers-outline"
          value={stock}
          onChangeText={setStock}
          keyboardType="number-pad"
          placeholder="Available stock"
        />
      </View>

      <View style={sectionCardStyle}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: colors.text,
            marginBottom: spacing.xs,
          }}
        >
          Marketplace Listing
        </Text>
        <Text style={{ color: colors.muted, marginBottom: spacing.lg, lineHeight: 20 }}>
          Buyer options, product specs, delivery notes, and policy details update automatically
          based on the selected category.
        </Text>

        <Text
          style={{
            color: colors.text,
            fontSize: 15,
            fontWeight: "900",
            marginBottom: spacing.md,
          }}
        >
          Buyer Options for {category}
        </Text>
        {categoryTemplate.optionFields.map((field) => (
          <View key={field.label}>
            <FormField
              label={field.label}
              icon="git-branch-outline"
              value={currentOptionInputs[field.label]}
              onChangeText={(value: string) =>
                setOptionInputs((current) => ({ ...current, [field.label]: value }))
              }
              placeholder={field.placeholder}
            />
            <Text style={helperTextStyle}>{field.helper}</Text>
          </View>
        ))}

        <Text
          style={{
            color: colors.text,
            fontSize: 15,
            fontWeight: "900",
            marginTop: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          Key Specifications
        </Text>
        {categoryTemplate.specFields.map((field) => (
          <View key={field.label}>
            <FormField
              label={field.label}
              icon="list-outline"
              value={currentSpecificationInputs[field.label]}
              onChangeText={(value: string) =>
                setSpecificationInputs((current) => ({
                  ...current,
                  [field.label]: value,
                }))
              }
              placeholder={field.placeholder}
            />
            <Text style={helperTextStyle}>{field.helper}</Text>
          </View>
        ))}

        <FormField
          label="Product Highlights"
          icon="sparkles-outline"
          value={highlightsInput}
          onChangeText={setHighlightsInput}
          placeholder={categoryTemplate.highlightSuggestions.join("\n")}
          multiline
          inputStyle={{ minHeight: 120, textAlignVertical: "top" }}
        />
        <Text style={helperTextStyle}>
          Add one highlight per line. Lead with the top reason a shopper should choose this product.
        </Text>

        <FormField
          label="Delivery Notes"
          icon="car-outline"
          value={deliveryInfoInput}
          onChangeText={setDeliveryInfoInput}
          placeholder={categoryTemplate.deliverySuggestions.join("\n")}
          multiline
          inputStyle={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <Text style={helperTextStyle}>
          Add one delivery or support point per line, like dispatch speed or packaging.
        </Text>

        <FormField
          label="Return Policy"
          icon="refresh-outline"
          value={returnPolicy}
          onChangeText={setReturnPolicy}
          placeholder={categoryTemplate.returnPolicyHint}
        />
        <FormField
          label="Warranty / Seller Support"
          icon="shield-checkmark-outline"
          value={warranty}
          onChangeText={setWarranty}
          placeholder={categoryTemplate.warrantyHint}
        />
      </View>

      <View style={sectionCardStyle}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: colors.text,
            marginBottom: spacing.md,
          }}
        >
          Merchandising
        </Text>

        <View style={{ gap: spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={{ color: colors.text, fontWeight: "800" }}>Featured Product</Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                Show this listing in featured product grids and collections.
              </Text>
            </View>
            <Switch
              value={isFeatured}
              onValueChange={setIsFeatured}
              trackColor={{ false: "#CBD5E1", true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={{ color: colors.text, fontWeight: "800" }}>Deal of the Day</Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                Surface this item in deal modules for stronger buyer visibility.
              </Text>
            </View>
            <Switch
              value={isDeal}
              onValueChange={setIsDeal}
              trackColor={{ false: "#CBD5E1", true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <Pressable
          disabled={loading}
          onPress={async () => {
            if (!name.trim() || !description.trim() || description.trim().length < 20) {
              showToast(
                "error",
                "Add a clearer description",
                "Descriptions should be at least 20 characters."
              );
              return;
            }

            if (!price.trim() || !originalPrice.trim() || !stock.trim()) {
              showToast("error", "Price, original price and stock are required.");
              return;
            }

            if (totalImages === 0) {
              showToast("error", "At least one image is required.");
              return;
            }

            await onSubmit({
              name: name.trim(),
              subtitle: subtitle.trim(),
              brand: brand.trim(),
              category,
              description: description.trim(),
              price,
              originalPrice,
              stock,
              isFeatured,
              isDeal,
              highlights: parseMultilineList(highlightsInput),
              specifications: buildSpecificationsFromInputs(currentSpecificationInputs),
              options: buildOptionGroupsFromInputs(currentOptionInputs),
              deliveryInfo: parseMultilineList(deliveryInfoInput),
              returnPolicy: returnPolicy.trim(),
              warranty: warranty.trim(),
              existingImages,
              newAssets,
            });
          }}
          style={{
            marginTop: spacing.xl,
            backgroundColor: colors.primary,
            borderRadius: radius.md,
            alignItems: "center",
            paddingVertical: spacing.md + 2,
          }}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={{ color: colors.white, fontWeight: "900" }}>{submitLabel}</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default SellerProductForm;
