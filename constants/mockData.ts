import { categoryMeta, colors } from "../constants/theme";
import {
  AppNotification,
  BannerItem,
  CategoryItem,
  Coupon,
  Product,
  Review,
} from "../types";

export const fallbackImage =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400";

export const mockProducts: Product[] = [
  {
    id: "mock-earbuds",
    sellerId: "seller-demo-1",
    sellerName: "SoundWave Store",
    name: "Noise Cancelling Wireless Earbuds",
    description:
      "Premium wireless earbuds with active noise cancellation, 24-hour battery life, low-latency mode, and crystal clear calling for work, travel, and workouts.",
    price: 1999,
    originalPrice: 2999,
    discount: 33,
    images: [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
    ],
    category: "Electronics",
    stock: 18,
    rating: 4.5,
    reviews: 146,
    isFeatured: true,
    isDeal: true,
    isActive: true,
  },
  {
    id: "mock-watch",
    sellerId: "seller-demo-2",
    sellerName: "Prime Time",
    name: "Classic Smart Watch with AMOLED Display",
    description:
      "A stylish smartwatch with fitness tracking, message alerts, AMOLED display, water resistance, and a lightweight all-day design.",
    price: 3499,
    originalPrice: 4999,
    discount: 30,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    ],
    category: "Electronics",
    stock: 7,
    rating: 4.2,
    reviews: 89,
    isFeatured: true,
    isDeal: false,
    isActive: true,
  },
  {
    id: "mock-shoes",
    sellerId: "seller-demo-3",
    sellerName: "FitStep",
    name: "Men's Running Shoes",
    description:
      "Lightweight running shoes with breathable mesh, responsive cushioning, durable grip, and a bold modern silhouette for daily training.",
    price: 2599,
    originalPrice: 3899,
    discount: 33,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    ],
    category: "Sports",
    stock: 12,
    rating: 4.6,
    reviews: 203,
    isFeatured: true,
    isDeal: true,
    isActive: true,
  },
  {
    id: "mock-tshirt",
    sellerId: "seller-demo-4",
    sellerName: "Urban Loom",
    name: "Oversized Cotton T-Shirt",
    description:
      "Comfortable oversized cotton t-shirt with premium combed fabric, durable stitching, and a relaxed fit that works year-round.",
    price: 799,
    originalPrice: 1299,
    discount: 38,
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    ],
    category: "Fashion",
    stock: 26,
    rating: 4.3,
    reviews: 67,
    isFeatured: false,
    isDeal: true,
    isActive: true,
  },
  {
    id: "mock-speaker",
    sellerId: "seller-demo-1",
    sellerName: "SoundWave Store",
    name: "Portable Bluetooth Speaker",
    description:
      "Portable speaker with rich bass, 12-hour playback, splash resistance, and compact carry-anywhere design for indoor and outdoor use.",
    price: 2299,
    originalPrice: 3199,
    discount: 28,
    images: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
    ],
    category: "Electronics",
    stock: 5,
    rating: 4.4,
    reviews: 112,
    isFeatured: true,
    isDeal: false,
    isActive: true,
  },
  {
    id: "mock-yogamat",
    sellerId: "seller-demo-5",
    sellerName: "Zen Move",
    name: "Eco Yoga Mat",
    description:
      "Non-slip yoga mat with comfortable density, alignment marks, moisture resistance, and eco-conscious materials for home workouts.",
    price: 1199,
    originalPrice: 1699,
    discount: 29,
    images: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
    ],
    category: "Sports",
    stock: 14,
    rating: 4.7,
    reviews: 58,
    isFeatured: false,
    isDeal: true,
    isActive: true,
  },
];

export const mockReviews: Review[] = [
  {
    id: "review-1",
    productId: "mock-earbuds",
    userId: "buyer-1",
    userName: "Aarav",
    rating: 5,
    comment: "Great sound quality and the battery lasts me all day.",
  },
  {
    id: "review-2",
    productId: "mock-earbuds",
    userId: "buyer-2",
    userName: "Maya",
    rating: 4,
    comment: "Noise cancellation is solid and the fit is comfortable.",
  },
  {
    id: "review-3",
    productId: "mock-shoes",
    userId: "buyer-3",
    userName: "Rohan",
    rating: 5,
    comment: "Super comfortable for long runs and still looks stylish.",
  },
];

export const homeBanners: BannerItem[] = [
  {
    id: "banner-1",
    title: "Electronics Mega Sale",
    subtitle: "Save big on earbuds, watches, speakers and more.",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200",
    cta: "Shop Now",
  },
  {
    id: "banner-2",
    title: "Fashion New Arrivals",
    subtitle: "Fresh styles landing every day with fast delivery.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200",
    cta: "Explore Trends",
  },
  {
    id: "banner-3",
    title: "Home Essentials Refresh",
    subtitle: "Upgrade your space with smart and practical finds.",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200",
    cta: "View Deals",
  },
];

export const categoryList: CategoryItem[] = [
  { id: "all", name: "All", icon: categoryMeta.All.icon, color: categoryMeta.All.color },
  {
    id: "electronics",
    name: "Electronics",
    icon: categoryMeta.Electronics.icon,
    color: categoryMeta.Electronics.color,
  },
  {
    id: "fashion",
    name: "Fashion",
    icon: categoryMeta.Fashion.icon,
    color: categoryMeta.Fashion.color,
  },
  { id: "home", name: "Home", icon: categoryMeta.Home.icon, color: categoryMeta.Home.color },
  {
    id: "sports",
    name: "Sports",
    icon: categoryMeta.Sports.icon,
    color: categoryMeta.Sports.color,
  },
  { id: "books", name: "Books", icon: categoryMeta.Books.icon, color: categoryMeta.Books.color },
  {
    id: "beauty",
    name: "Beauty",
    icon: categoryMeta.Beauty.icon,
    color: categoryMeta.Beauty.color,
  },
  { id: "toys", name: "Toys", icon: categoryMeta.Toys.icon, color: categoryMeta.Toys.color },
  { id: "food", name: "Food", icon: categoryMeta.Food.icon, color: categoryMeta.Food.color },
  {
    id: "automotive",
    name: "Automotive",
    icon: categoryMeta.Automotive.icon,
    color: categoryMeta.Automotive.color,
  },
];

export const mockCoupons: Coupon[] = [
  { code: "SAVE10", type: "percent", value: 10, minAmount: 500, active: true },
  { code: "WELCOME50", type: "flat", value: 50, minAmount: 300, active: true },
  { code: "DEAL20", type: "percent", value: 20, minAmount: 1500, active: true },
];

export const mockNotifications: AppNotification[] = [
  {
    id: "notif-1",
    title: "Flash deal unlocked",
    message: "Wireless earbuds just dropped to ₹1,999 for the next 2 hours.",
    createdAt: "2026-04-02T09:00:00.000Z",
    read: false,
  },
  {
    id: "notif-2",
    title: "Order shipped",
    message: "Your running shoes are on the way and should arrive soon.",
    createdAt: "2026-04-01T13:15:00.000Z",
    read: true,
  },
];

export const sellerQuickActionColors = [
  colors.primary,
  colors.teal,
  colors.accent,
  colors.purple,
];

