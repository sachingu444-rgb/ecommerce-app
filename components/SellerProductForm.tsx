import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";

import { getCategoryListingTemplate } from "../constants/productListing";
import { categoryList } from "../constants/mockData";
import { colors, radius, shadows, spacing } from "../constants/theme";
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
  marginTop: -4,
  marginBottom: spacing.md,
  lineHeight: 18,
} as const;

// Accordion Component for Advanced Form Sections
const AccordionSection = ({
  title,
  icon,
  subtitle,
  children,
  defaultExpanded = false,
  isComplete = false,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isComplete?: boolean;
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: expanded ? colors.primary : colors.border,
        overflow: "hidden",
        ...shadows.card,
        shadowOpacity: expanded ? 0.08 : 0.03,
      }}
    >
      <Pressable
        onPress={toggleExpand}
        style={({ hovered }) => ({
          flexDirection: "row",
          alignItems: "center",
          padding: spacing.lg,
          backgroundColor: expanded ? `${colors.primary}05` : hovered ? colors.bg : colors.white,
        })}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.md,
            backgroundColor: isComplete ? `${colors.success}15` : expanded ? `${colors.primary}15` : colors.bg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: spacing.md,
          }}
        >
          <Ionicons name={isComplete ? "checkmark" : icon} size={20} color={isComplete ? colors.success : expanded ? colors.primary : colors.muted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: expanded ? colors.primaryDark : colors.text }}>
            {title}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{subtitle}</Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.muted}
        />
      </Pressable>
      
      {expanded && (
        <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white }}>
          {children}
        </View>
      )}
    </View>
  );
};

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
  const [customOptionLabels, setCustomOptionLabels] = useState<string[]>([]);
  const [customSpecLabels, setCustomSpecLabels] = useState<string[]>([]);
  
  // Extract existing custom fields that aren't in the template when editing
  useEffect(() => {
    if (initialProduct) {
      const template = getCategoryListingTemplate(initialProduct.category);
      const templateOptLabels = template.optionFields.map(f => f.label);
      const templateSpecLabels = template.specFields.map(f => f.label);
      
      const customOpts = (initialProduct.options || [])
        .map(o => o.name)
        .filter(name => !templateOptLabels.includes(name));
      
      const customSpecs = (initialProduct.specifications || [])
        .map(s => s.label)
        .filter(label => !templateSpecLabels.includes(label));
        
      if (customOpts.length > 0) setCustomOptionLabels(customOpts);
      if (customSpecs.length > 0) setCustomSpecLabels(customSpecs);
    }
  }, [initialProduct]);

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

  // Completion calculations for visual progress
  const isMediaComplete = totalImages > 0;
  const isDetailsComplete = name.length > 3 && description.length > 20 && !!category;
  const isPricingComplete = price.length > 0 && originalPrice.length > 0 && stock.length > 0;
  const completionPercentage = [isMediaComplete, isDetailsComplete, isPricingComplete].filter(Boolean).length / 3 * 100;

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
    <View style={{ paddingBottom: 120 }}>
      {/* Progress Header */}
      <View style={{ marginBottom: spacing.xl, paddingHorizontal: spacing.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
          <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16 }}>Listing Completion</Text>
          <Text style={{ color: colors.primary, fontWeight: "800" }}>{Math.round(completionPercentage)}%</Text>
        </View>
        <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: "hidden" }}>
          <LinearGradient
            colors={[colors.primaryLight, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${completionPercentage}%`, height: "100%", borderRadius: radius.pill }}
          />
        </View>
      </View>

      <AccordionSection
        title="Product Media"
        icon="images-outline"
        subtitle="High quality images increase sales by up to 40%."
        defaultExpanded={true}
        isComplete={isMediaComplete}
      >
        <Pressable
          onPress={pickImages}
          style={({ hovered }) => ({
            borderWidth: 2,
            borderColor: hovered ? colors.primary : colors.border,
            borderStyle: "dashed",
            borderRadius: radius.lg,
            backgroundColor: hovered ? `${colors.primary}05` : colors.bg,
            minHeight: 160,
            alignItems: "center",
            justifyContent: "center",
            padding: spacing.xl,
            marginBottom: spacing.md,
          })}
        >
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", marginBottom: spacing.md, ...shadows.card }}>
            <Ionicons name="cloud-upload" size={28} color={colors.primary} />
          </View>
          <Text style={{ color: colors.text, fontWeight: "800", fontSize: 16, marginBottom: 4 }}>
            Drag & Drop or Click to Upload
          </Text>
          <Text style={{ color: colors.muted, textAlign: "center" }}>
            Add up to 5 high-resolution images (JPEG, PNG). The first image will be the cover.
          </Text>
        </Pressable>

        {uploadProgress > 0 && loading ? (
          <View style={{ marginBottom: spacing.md, padding: spacing.md, backgroundColor: `${colors.primary}10`, borderRadius: radius.md }}>
            <Text style={{ color: colors.primaryDark, fontWeight: "700", marginBottom: spacing.xs }}>
              Uploading Media ({Math.round(uploadProgress)}%)
            </Text>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(0,0,0,0.1)", overflow: "hidden" }}>
              <View style={{ width: `${uploadProgress}%`, height: "100%", backgroundColor: colors.primary }} />
            </View>
          </View>
        ) : null}

        {(existingImages.length > 0 || newAssets.length > 0) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {existingImages.map((image, index) => (
              <View key={image} style={{ marginRight: spacing.md }}>
                <AppImage
                  uri={image}
                  resizeMode="cover"
                  containerStyle={{
                    width: 120,
                    height: 120,
                    borderRadius: radius.md,
                    backgroundColor: colors.bg,
                    borderWidth: index === 0 ? 2 : 1,
                    borderColor: index === 0 ? colors.primary : colors.border,
                  }}
                />
                {index === 0 && (
                  <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.primary, paddingVertical: 4, borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md }}>
                    <Text style={{ color: colors.white, fontSize: 10, fontWeight: "800", textAlign: "center", textTransform: "uppercase" }}>COVER</Text>
                  </View>
                )}
                <Pressable
                  onPress={() => setExistingImages((current) => current.filter((item) => item !== image))}
                  style={{
                    position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: 14,
                    backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Ionicons name="close" size={18} color={colors.white} />
                </Pressable>
              </View>
            ))}
            {newAssets.map((asset, index) => {
              const isCover = existingImages.length === 0 && index === 0;
              return (
                <View key={asset.uri} style={{ marginRight: spacing.md }}>
                  <AppImage
                    uri={asset.uri}
                    resizeMode="cover"
                    containerStyle={{
                      width: 120,
                      height: 120,
                      borderRadius: radius.md,
                      backgroundColor: colors.bg,
                      borderWidth: isCover ? 2 : 1,
                      borderColor: isCover ? colors.primary : colors.border,
                    }}
                  />
                  {isCover && (
                    <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.primary, paddingVertical: 4, borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md }}>
                      <Text style={{ color: colors.white, fontSize: 10, fontWeight: "800", textAlign: "center", textTransform: "uppercase" }}>COVER</Text>
                    </View>
                  )}
                  <Pressable
                    onPress={() => setNewAssets((current) => current.filter((item) => item.uri !== asset.uri))}
                    style={{
                      position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: 14,
                      backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Ionicons name="close" size={18} color={colors.white} />
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        )}
      </AccordionSection>

      <AccordionSection
        title="Core Information"
        icon="document-text-outline"
        subtitle="Title, category, and main description."
        defaultExpanded={true}
        isComplete={isDetailsComplete}
      >
        <FormField
          label="Product Name (Required)"
          icon="text"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Apple AirPods Pro (2nd Gen)"
        />
        
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "800", marginTop: spacing.xs, marginBottom: spacing.sm }}>
          Primary Category
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.lg }}>
          {categories.map((item) => {
            const active = category === item.name;
            return (
              <Pressable
                key={item.id}
                onPress={() => setCategory(item.name)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: spacing.lg,
                  paddingVertical: 10,
                  borderRadius: radius.pill,
                  marginRight: spacing.sm,
                  backgroundColor: active ? item.color : colors.bg,
                  borderWidth: 1,
                  borderColor: active ? item.color : colors.border,
                }}
              >
                <Ionicons name={item.icon as any} size={16} color={active ? colors.white : colors.muted} style={{ marginRight: 6 }} />
                <Text style={{ color: active ? colors.white : colors.text, fontWeight: active ? "800" : "600" }}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <FormField
              label="Brand Name"
              icon="ribbon-outline"
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. Apple"
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormField
              label="Subtitle (Optional)"
              icon="information-circle-outline"
              value={subtitle}
              onChangeText={setSubtitle}
              placeholder="Short catchy phrase"
            />
          </View>
        </View>

        <FormField
          label="Detailed Description"
          icon="reader-outline"
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the product, its features, and what makes it great..."
          multiline
          inputStyle={{ minHeight: 140, textAlignVertical: "top" }}
        />
      </AccordionSection>

      <AccordionSection
        title="Pricing & Inventory"
        icon="pricetags-outline"
        subtitle="Manage cost, discounts, and available stock."
        isComplete={isPricingComplete}
      >
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <FormField
              label="Selling Price (â‚¹)"
              icon="cash"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder="e.g. 24900"
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormField
              label="MRP / Original Price (â‚¹)"
              icon="pricetag-outline"
              value={originalPrice}
              onChangeText={setOriginalPrice}
              keyboardType="decimal-pad"
              placeholder="e.g. 26900"
            />
          </View>
        </View>
        
        {Number(originalPrice) > Number(price) && price !== "" && (
          <View style={{ backgroundColor: `${colors.success}15`, padding: spacing.sm, borderRadius: radius.md, marginBottom: spacing.md, flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="pricetag" size={16} color={colors.success} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.success, fontWeight: "700" }}>
              Discount: {Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)}% off
            </Text>
          </View>
        )}

        <View style={{ width: "50%" }}>
          <FormField
            label="Initial Stock Quantity"
            icon="layers-outline"
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
            placeholder="Available units"
          />
        </View>
      </AccordionSection>

      <AccordionSection
        title={`Variants & Specifications (${category})`}
        icon="options-outline"
        subtitle="Dynamic options based on the chosen category."
      >
        <View style={{ backgroundColor: `${colors.primary}0A`, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg }}>
          <Text style={{ color: colors.primaryDark, fontWeight: "700", marginBottom: 4 }}>Dynamic Template Active</Text>
          <Text style={{ color: colors.text, fontSize: 13 }}>Showing specification fields recommended for {category} products.</Text>
        </View>

        {categoryTemplate.optionFields.length > 0 && (
          <>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "900", marginBottom: spacing.sm }}>
              Buyer Options
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
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />
          </>
        )}

        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "900", marginBottom: spacing.sm }}>
          Technical Specifications
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
          label="Bullet Highlights"
          icon="sparkles-outline"
          value={highlightsInput}
          onChangeText={setHighlightsInput}
          placeholder={categoryTemplate.highlightSuggestions.join("\n")}
          multiline
          inputStyle={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <Text style={helperTextStyle}>Provide key marketing points (one per line).</Text>
      </AccordionSection>

      <AccordionSection
        title="Shipping & Policies"
        icon="cube-outline"
        subtitle="Delivery expectations and return rules."
      >
        <FormField
          label="Delivery Details & Speed"
          icon="car-outline"
          value={deliveryInfoInput}
          onChangeText={setDeliveryInfoInput}
          placeholder={categoryTemplate.deliverySuggestions.join("\n")}
          multiline
          inputStyle={{ minHeight: 80, textAlignVertical: "top" }}
        />
        <Text style={helperTextStyle}>e.g. Dispatches in 24 hours (one per line).</Text>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <FormField
              label="Return Policy"
              icon="refresh-outline"
              value={returnPolicy}
              onChangeText={setReturnPolicy}
              placeholder={categoryTemplate.returnPolicyHint}
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormField
              label="Warranty Provider"
              icon="shield-checkmark-outline"
              value={warranty}
              onChangeText={setWarranty}
              placeholder={categoryTemplate.warrantyHint}
            />
          </View>
        </View>
      </AccordionSection>

      <AccordionSection
        title="Publishing Details"
        icon="rocket-outline"
        subtitle="Visibility and merchandising controls."
      >
        <Pressable
          onPress={() => setIsFeatured(!isFeatured)}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.bg }}
        >
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15 }}>Featured Product</Text>
            <Text style={{ color: colors.muted, marginTop: 4, fontSize: 13 }}>
              Boost visibility in category pages and search results.
            </Text>
          </View>
          <Switch
            value={isFeatured}
            onValueChange={setIsFeatured}
            trackColor={{ false: "#CBD5E1", true: colors.primary }}
            thumbColor={colors.white}
          />
        </Pressable>

        <Pressable
          onPress={() => setIsDeal(!isDeal)}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md }}
        >
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15 }}>Promote as Deal</Text>
            <Text style={{ color: colors.muted, marginTop: 4, fontSize: 13 }}>
              Highlight this item in "Deals of the Day" collections.
            </Text>
          </View>
          <Switch
            value={isDeal}
            onValueChange={setIsDeal}
            trackColor={{ false: "#CBD5E1", true: colors.accent }}
            thumbColor={colors.white}
          />
        </Pressable>
      </AccordionSection>

      <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.sm }}>
        <Pressable
          disabled={loading}
          onPress={async () => {
            if (!name.trim() || !description.trim() || description.trim().length < 20) {
              showToast(
                "error",
                "More details needed",
                "Product name and description (min 20 chars) are required."
              );
              return;
            }

            if (!price.trim() || !originalPrice.trim() || !stock.trim()) {
              showToast("error", "Missing Information", "Price, original price and stock are required.");
              return;
            }

            if (totalImages === 0) {
              showToast("error", "Missing Media", "At least one product image is required.");
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
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            borderRadius: radius.md,
            alignItems: "center",
            paddingVertical: 16,
            flexDirection: "row",
            justifyContent: "center",
            gap: spacing.sm,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
            ...shadows.card,
            shadowColor: colors.primary,
          })}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color={colors.white} />
              <Text style={{ color: colors.white, fontWeight: "900", fontSize: 16 }}>{submitLabel}</Text>
            </>
          )}
        </Pressable>
        <Text style={{ color: colors.muted, textAlign: "center", marginTop: spacing.md, fontSize: 13 }}>
          By publishing, you agree to the Seller Marketplace Guidelines.
        </Text>
      </View>
    </View>
  );
};

export default SellerProductForm;

