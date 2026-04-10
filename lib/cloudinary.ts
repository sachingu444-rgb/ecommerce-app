import { Platform } from "react-native";

const CLOUDINARY_CLOUD_NAME = "dlslhejke";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_upload";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const getFileName = (imageUri: string) =>
  imageUri.split("/").pop()?.split("?")[0] || `product-${Date.now()}.jpg`;

const getMimeType = (imageUri: string) => {
  const extension = imageUri.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    default:
      return "image/jpeg";
  }
};

export const uploadImageToCloudinary = async (imageUri: string) => {
  try {
    console.log("[Cloudinary] Starting upload", { imageUri, platform: Platform.OS });

    const formData = new FormData();

    if (Platform.OS === "web") {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append("file", blob, getFileName(imageUri));
    } else {
      formData.append("file", {
        uri: imageUri,
        type: getMimeType(imageUri),
        name: getFileName(imageUri),
      } as never);
    }

    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.secure_url) {
      console.error("[Cloudinary] Upload failed", {
        status: response.status,
        data,
      });
      throw new Error(data?.error?.message || "Cloudinary upload failed.");
    }

    console.log("[Cloudinary] Uploaded image URL", data.secure_url);
    return data.secure_url as string;
  } catch (error) {
    console.error("[Cloudinary] uploadImageToCloudinary error", error);
    throw error;
  }
};
