export const colors = {
  primary: "#0066CC",
  primaryDark: "#004A99",
  primaryLight: "#E8F1FB",
  accent: "#FF9900",
  white: "#FFFFFF",
  bg: "#F0F2F5",
  card: "#FFFFFF",
  text: "#1A1A2E",
  muted: "#6B7280",
  border: "#E5E7EB",
  danger: "#EF4444",
  success: "#16A34A",
  star: "#F59E0B",
  warning: "#FACC15",
  purple: "#8B5CF6",
  teal: "#14B8A6",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
};

export const categoryMeta: Record<
  string,
  { color: string; icon: string }
> = {
  All: { color: colors.primary, icon: "grid-outline" },
  Electronics: { color: "#2563EB", icon: "phone-portrait-outline" },
  Fashion: { color: "#EC4899", icon: "shirt-outline" },
  Home: { color: "#10B981", icon: "home-outline" },
  Sports: { color: "#F97316", icon: "barbell-outline" },
  Books: { color: "#7C3AED", icon: "book-outline" },
  Beauty: { color: "#DB2777", icon: "sparkles-outline" },
  Toys: { color: "#EAB308", icon: "game-controller-outline" },
  Food: { color: "#F97316", icon: "restaurant-outline" },
  Automotive: { color: "#374151", icon: "car-sport-outline" },
};

export const orderStatusColors: Record<string, string> = {
  pending: colors.warning,
  confirmed: colors.primary,
  shipped: colors.purple,
  delivered: colors.success,
  cancelled: colors.danger,
};

export const bannerGradients = [
  ["rgba(0,102,204,0.15)", "rgba(0,74,153,0.85)"],
  ["rgba(255,153,0,0.15)", "rgba(0,102,204,0.92)"],
  ["rgba(20,184,166,0.2)", "rgba(0,74,153,0.9)"],
] as const;

export type AppColors = typeof colors;

