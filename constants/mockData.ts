import { categoryMeta, colors } from "../constants/theme";
import {
  AppNotification,
  BannerItem,
  CategoryItem,
  Coupon,
  Review,
} from "../types";

export const fallbackImage =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400";

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

