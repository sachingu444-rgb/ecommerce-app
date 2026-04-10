import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db, logCurrentAuthUser, waitForAuthReady } from "../firebaseConfig";
import { uploadImageToCloudinary } from "./cloudinary";
import { ProductListingOption, ProductSpecification } from "../types";

interface UploadProductInput {
  name: string;
  price: number;
  imageUris: string[];
  isActive?: boolean;
  originalPrice?: number;
  category?: string;
  description?: string;
  stock?: number;
  sellerName?: string;
  isFeatured?: boolean;
  isDeal?: boolean;
  subtitle?: string;
  brand?: string;
  highlights?: string[];
  specifications?: ProductSpecification[];
  options?: ProductListingOption[];
  deliveryInfo?: string[];
  returnPolicy?: string;
  warranty?: string;
  onProgress?: (progress: number) => void;
}

export const uploadProduct = async ({
  name,
  price,
  imageUris,
  isActive = true,
  originalPrice = price,
  category = "Electronics",
  description = "",
  stock = 0,
  sellerName = "",
  isFeatured = false,
  isDeal = false,
  subtitle = "",
  brand = "",
  highlights = [],
  specifications = [],
  options = [],
  deliveryInfo = [],
  returnPolicy = "",
  warranty = "",
  onProgress,
}: UploadProductInput) => {
  try {
    const currentUser = await waitForAuthReady();

    logCurrentAuthUser();

    if (!currentUser) {
      throw new Error("No logged-in user found. Please sign in again.");
    }

    if (imageUris.length === 0) {
      throw new Error("Please select at least one product image.");
    }

    await currentUser.getIdToken(true);

    const uploadedImageUrls: string[] = [];

    for (let index = 0; index < imageUris.length; index += 1) {
      const secureUrl = await uploadImageToCloudinary(imageUris[index]);
      uploadedImageUrls.push(secureUrl);
      onProgress?.(((index + 1) / imageUris.length) * 100);
    }

    const primaryImage = uploadedImageUrls[0];
    const safeOriginalPrice = originalPrice > 0 ? originalPrice : price;
    const discount =
      safeOriginalPrice > price
        ? Math.round(((safeOriginalPrice - price) / safeOriginalPrice) * 100)
        : 0;

    console.log("[uploadProduct] Uploaded primary image", primaryImage);
    console.log("[uploadProduct] Writing product to Firestore", {
      uid: currentUser.uid,
      email: currentUser.email,
      name: name.trim(),
      price,
      image: primaryImage,
      isActive,
    });

    return addDoc(collection(db, "products"), {
      name: name.trim(),
      price,
      image: primaryImage,
      images: uploadedImageUrls,
      isActive,
      originalPrice: safeOriginalPrice,
      discount,
      category,
      description: description.trim(),
      stock,
      sellerId: currentUser.uid,
      sellerName: sellerName.trim() || currentUser.displayName || "ShopApp Seller",
      isFeatured,
      isDeal,
      subtitle: subtitle.trim() || null,
      brand: brand.trim() || null,
      highlights,
      specifications,
      options,
      deliveryInfo,
      returnPolicy: returnPolicy.trim() || null,
      warranty: warranty.trim() || null,
      rating: 0,
      reviews: 0,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("[uploadProduct] Error uploading product", error);
    throw error;
  }
};
