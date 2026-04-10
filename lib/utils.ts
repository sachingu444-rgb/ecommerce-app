import { fallbackImage } from "../constants/mockData";
import { Product } from "../types";

export const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);

const toDate = (value?: unknown) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    return new Date(value);
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as { seconds: number }).seconds === "number"
  ) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }

  return null;
};

export const toDateValue = (value?: unknown) => toDate(value);

export const formatDate = (value?: unknown, withTime = false) => {
  const parsed = toDate(value);
  if (!parsed) {
    return "Just now";
  }

  return parsed.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime
      ? { hour: "numeric", minute: "2-digit" }
      : {}),
  });
};

export const truncateId = (value?: string, length = 8) =>
  value ? value.slice(0, length).toUpperCase() : "N/A";

export const getInitials = (name?: string) => {
  if (!name) {
    return "GU";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
};

export const ensureImage = (value?: string | null) => value || fallbackImage;

const safeStringList = (value?: unknown) =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;

export const safeProduct = (product: Partial<Product>): Product => ({
  id: product.id || `product-${Date.now()}`,
  sellerId: product.sellerId || "seller-demo",
  sellerName: product.sellerName || "ShopApp Seller",
  name: product.name || "Untitled Product",
  subtitle: product.subtitle?.trim() || undefined,
  brand: product.brand?.trim() || undefined,
  image: product.image || product.images?.[0] || fallbackImage,
  description: product.description || "Product details coming soon.",
  price: product.price ?? 0,
  originalPrice: product.originalPrice ?? product.price ?? 0,
  discount: product.discount ?? 0,
  images:
    product.images && product.images.length > 0
      ? product.images
      : [product.image || fallbackImage],
  category: product.category || "Electronics",
  stock: product.stock ?? 0,
  rating: product.rating ?? 0,
  reviews: product.reviews ?? 0,
  isFeatured: product.isFeatured ?? false,
  isDeal: product.isDeal ?? false,
  isActive: product.isActive ?? true,
  highlights: safeStringList(product.highlights),
  deliveryInfo: safeStringList(product.deliveryInfo),
  specifications: Array.isArray(product.specifications)
    ? product.specifications
        .filter(
          (
            item
          ): item is {
            label: string;
            value: string;
          } => typeof item?.label === "string" && typeof item?.value === "string"
        )
        .map((item) => ({
          label: item.label.trim(),
          value: item.value.trim(),
        }))
        .filter((item) => item.label && item.value)
    : undefined,
  options: Array.isArray(product.options)
    ? product.options
        .filter(
          (
            item
          ): item is {
            name: string;
            values: string[];
          } => typeof item?.name === "string" && Array.isArray(item?.values)
        )
        .map((item) => ({
          name: item.name.trim(),
          values: item.values
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.trim())
            .filter(Boolean),
        }))
        .filter((item) => item.name && item.values.length > 0)
    : undefined,
  returnPolicy: product.returnPolicy?.trim() || undefined,
  warranty: product.warranty?.trim() || undefined,
  createdAt: product.createdAt,
});

export const calculateDiscount = (price: number, originalPrice: number) => {
  if (!originalPrice || originalPrice <= price) {
    return 0;
  }

  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

export const formatAddress = (address?: {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) =>
  [address?.street, address?.city, address?.state, address?.pincode]
    .filter(Boolean)
    .join(", ");

const toTitleCase = (value?: string) =>
  value
    ? value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase())
    : "N/A";

export const formatPaymentMethodLabel = (value?: string) => {
  switch (value) {
    case "cash_on_delivery":
      return "Cash on Delivery";
    case "upi":
      return "UPI QR";
    case "wallet":
      return "Wallet";
    case "card":
      return "Card";
    default:
      return toTitleCase(value);
  }
};

export const formatPaymentStatusLabel = (value?: string) => toTitleCase(value);
