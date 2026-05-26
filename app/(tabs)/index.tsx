import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";

import CategoryChip from "../../components/CategoryChip";
import DesktopSiteFooter from "../../components/DesktopSiteFooter";
import DealCard from "../../components/DealCard";
import ProductCard from "../../components/ProductCard";
import SmartImage from "../../components/SmartImage";
import { defaultBuyerPageContent, normalizeBuyerHomeSectionOrder } from "../../constants/buyerPageContent";
import { categoryList } from "../../constants/mockData";
import { colors, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { subscribeToActiveProducts, subscribeToBuyerPageContent } from "../../lib/firebaseApi";
import { showToast } from "../../lib/toast";
import { getGreeting } from "../../lib/utils";
import { useCartStore } from "../../store/cartStore";
import { BuyerHomeSectionKey, BuyerMediaShowcaseItem, BuyerPageContent, Product } from "../../types";

type HeaderMenuKey = "login" | "more" | null;

interface DesktopCategoryItem {
  id: string;
  label: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface HeaderMenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface SectionHeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  actionLabel: string;
  onActionPress: () => void;
}

interface SaleBannerItem {
  id: string;
  brand: string;
  partner: string;
  title: string;
  offer: string;
  image: string;
  category: string;
}

interface VisualCategoryItem {
  id: string;
  label: string;
  image: string;
  category: string;
}

interface LovedOneItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  category: string;
}

interface PremiumHeroItem {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  offer: string;
  image: string;
  category: string;
  accent: string;
  endTime?: number;
}

interface PromoGridItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  category: string;
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
  tag?: string;
}

interface HomePalette {
  bg: string;
  surface: string;
  elevated: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  inverseText: string;
  headerBg: string;
  headerBorder: string;
  searchBg: string;
  navHover: string;
  chipBg: string;
  dot: string;
  imageFallback: string;
  heroStart: string;
  heroEnd: string;
  shadow: string;
}

const homePalettes: Record<"light" | "dark", HomePalette> = {
  light: {
    bg: "#F0F2F5",
    surface: "#FFFFFF",
    elevated: "#FFFFFF",
    text: "#111827",
    muted: "#64748B",
    border: "#E2E8F0",
    primary: colors.primary,
    primaryDark: colors.primaryDark,
    primarySoft: "#E8F1FB",
    accent: colors.accent,
    inverseText: "#FFFFFF",
    headerBg: "#FFFFFF",
    headerBorder: "#E5E7EB",
    searchBg: "#FFFFFF",
    navHover: "rgba(0,102,204,0.06)",
    chipBg: "rgba(255,255,255,0.72)",
    dot: "#CBD5E1",
    imageFallback: "#EAF2FB",
    heroStart: "rgba(5,20,45,0.10)",
    heroEnd: "rgba(4,18,44,0.82)",
    shadow: "#0F172A",
  },
  dark: {
    bg: "#060B12",
    surface: "#0D1624",
    elevated: "#111D2E",
    text: "#F8FAFC",
    muted: "#94A3B8",
    border: "#223047",
    primary: "#63B3FF",
    primaryDark: "#B9DEFF",
    primarySoft: "rgba(99,179,255,0.16)",
    accent: "#FBBF24",
    inverseText: "#020617",
    headerBg: "#09111D",
    headerBorder: "#1E293B",
    searchBg: "#111D2E",
    navHover: "rgba(99,179,255,0.12)",
    chipBg: "rgba(15,23,42,0.76)",
    dot: "#334155",
    imageFallback: "#172338",
    heroStart: "rgba(2,6,23,0.08)",
    heroEnd: "rgba(2,6,23,0.92)",
    shadow: "#000000",
  },
};

const desktopCategoryItems: DesktopCategoryItem[] = [
  {
    id: "for-you",
    label: "For You",
    category: "All",
    icon: "bag-handle-outline",
    color: colors.primary,
  },
  {
    id: "fashion",
    label: "Fashion",
    category: "Fashion",
    icon: "shirt-outline",
    color: "#EC4899",
  },
  {
    id: "mobiles",
    label: "Mobiles",
    category: "Electronics",
    icon: "phone-portrait-outline",
    color: "#2563EB",
  },
  {
    id: "beauty",
    label: "Beauty",
    category: "Beauty",
    icon: "sparkles-outline",
    color: "#DB2777",
  },
  {
    id: "electronics",
    label: "Electronics",
    category: "Electronics",
    icon: "laptop-outline",
    color: "#2563EB",
  },
  {
    id: "home",
    label: "Home",
    category: "Home",
    icon: "home-outline",
    color: "#10B981",
  },
  {
    id: "appliances",
    label: "Appliances",
    category: "Home",
    icon: "tv-outline",
    color: "#0891B2",
  },
  {
    id: "toys",
    label: "Toys, baby",
    category: "Toys",
    icon: "game-controller-outline",
    color: "#EAB308",
  },
  {
    id: "food",
    label: "Food & Health",
    category: "Food",
    icon: "restaurant-outline",
    color: "#F97316",
  },
  {
    id: "auto-accessories",
    label: "Auto Acc...",
    category: "Automotive",
    icon: "car-sport-outline",
    color: "#374151",
  },
  {
    id: "two-wheelers",
    label: "2 Wheelers",
    category: "Automotive",
    icon: "bicycle-outline",
    color: "#EA580C",
  },
  {
    id: "sports",
    label: "Sports & Fitness",
    category: "Sports",
    icon: "barbell-outline",
    color: "#F97316",
  },
  {
    id: "books",
    label: "Books & More",
    category: "Books",
    icon: "book-outline",
    color: "#7C3AED",
  },
  {
    id: "furniture",
    label: "Furniture",
    category: "Home",
    icon: "home-outline",
    color: "#14B8A6",
  },
];

const saleBannerItems: SaleBannerItem[] = [
  {
    id: "sale-dresses",
    brand: "SASA LELE",
    partner: "Janaysa",
    title: "Trendy dresses...",
    offer: "Min. 75% Off",
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=700",
    category: "Fashion",
  },
  {
    id: "sale-shoes",
    brand: "SASA LELE",
    partner: "Allen Cooper",
    title: "Men's casual shoes...",
    offer: "Min. 70% Off",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700",
    category: "Sports",
  },
  {
    id: "sale-bags",
    brand: "SASA LELE",
    partner: "Safari",
    title: "Trolley bags",
    offer: "Min. 85% Off",
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=700",
    category: "Fashion",
  },
  {
    id: "sale-watches",
    brand: "SASA LELE",
    partner: "Prime Time",
    title: "Smart watches...",
    offer: "From Rs 999",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700",
    category: "Electronics",
  },
];

const premiumHeroItems: PremiumHeroItem[] = [
  {
    id: "premium-fashion",
    eyebrow: "Premium edit",
    title: "Elevated everyday style",
    subtitle: "Curated fashion, shoes and watches with quick checkout and fresh drops.",
    offer: "Up to 75% off",
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1400",
    category: "Fashion",
    accent: "#FBBF24",
    endTime: Date.now() + 86400000,
  },
  {
    id: "premium-tech",
    eyebrow: "Smart upgrades",
    title: "Tech that feels flagship",
    subtitle: "Mobiles, audio and work essentials selected for sharper daily use.",
    offer: "Deals from Rs 999",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400",
    category: "Electronics",
    accent: "#38BDF8",
    endTime: Date.now() + 172800000,
  },
  {
    id: "premium-home",
    eyebrow: "Home refresh",
    title: "Comfort, storage and shine",
    subtitle: "Make the rooms you use most feel more finished by tonight.",
    offer: "New arrivals",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400",
    category: "Home",
    accent: "#34D399",
    endTime: Date.now() + 259200000,
  },
];

const promoGridItems: PromoGridItem[] = [
  {
    id: "grid-luxe-fashion",
    title: "Statement fits",
    subtitle: "Denim, dresses and occasion-ready layers",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900",
    category: "Fashion",
    accent: "#EC4899",
    icon: "shirt-outline",
    tag: "Trending",
  },
  {
    id: "grid-tech",
    title: "Pocket power",
    subtitle: "Phones, audio and smarter accessories",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900",
    category: "Electronics",
    accent: "#2563EB",
    icon: "phone-portrait-outline",
    tag: "New",
  },
  {
    id: "grid-wellness",
    title: "Active hours",
    subtitle: "Shoes and gear built for daily movement",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900",
    category: "Sports",
    accent: "#F97316",
    icon: "barbell-outline",
  },
  {
    id: "grid-home",
    title: "Quiet home wins",
    subtitle: "Storage, decor and comfort picks",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900",
    category: "Home",
    accent: "#14B8A6",
    icon: "home-outline",
    tag: "Hot",
  },
];

const visualCategoryItems: VisualCategoryItem[] = [
  {
    id: "trendy",
    label: "Trendy",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400",
    category: "Fashion",
  },
  {
    id: "shirts",
    label: "Shirts, Tees",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    category: "Fashion",
  },
  {
    id: "jeans-men",
    label: "Jeans",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
    category: "Fashion",
  },
  {
    id: "sports-shoes",
    label: "Sports Shoes",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    category: "Sports",
  },
  {
    id: "watches",
    label: "Watches",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    category: "Electronics",
  },
  {
    id: "kids",
    label: "Kids' clothing",
    image: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400",
    category: "Fashion",
  },
  {
    id: "luggage",
    label: "Luggage",
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400",
    category: "Fashion",
  },
  {
    id: "formal",
    label: "Formal Wear",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400",
    category: "Fashion",
  },
  {
    id: "vests",
    label: "Briefs Vests...",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
    category: "Fashion",
  },
  {
    id: "casual-shirt",
    label: "Casual Shirt",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400",
    category: "Fashion",
  },
  {
    id: "top-50",
    label: "Top-50",
    image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400",
    category: "All",
  },
  {
    id: "kurta",
    label: "Kurta sets",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400",
    category: "Fashion",
  },
  {
    id: "dresses",
    label: "Dresses",
    image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400",
    category: "Fashion",
  },
  {
    id: "casual-shoes",
    label: "Casual shoes",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",
    category: "Sports",
  },
  {
    id: "trolley",
    label: "Trolley bag",
    image: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=400",
    category: "Fashion",
  },
  {
    id: "jewellery",
    label: "Jewellery",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400",
    category: "Fashion",
  },
  {
    id: "sarees",
    label: "Sarees",
    image: "https://images.unsplash.com/photo-1610189020967-4e001d2f30db?w=400",
    category: "Fashion",
  },
  {
    id: "kurtis",
    label: "Kurtis",
    image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400",
    category: "Fashion",
  },
];

const lovedOneItems: LovedOneItem[] = [
  {
    id: "loved-men",
    title: "For him",
    subtitle: "Smart casual styles",
    image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=600",
    category: "Fashion",
  },
  {
    id: "loved-women",
    title: "For her",
    subtitle: "Fresh fashion picks",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600",
    category: "Fashion",
  },
  {
    id: "loved-couple",
    title: "For everyone",
    subtitle: "Daily deal combos",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600",
    category: "All",
  },
];

const resolveDesktopCategoryId = (category: string) =>
  desktopCategoryItems.find((item) => item.category === category)?.id || "for-you";

const HomeDesktopCategoryButton = ({
  item,
  active,
  hovered,
  compact,
  palette,
  onHoverIn,
  onHoverOut,
  onPress,
}: {
  item: DesktopCategoryItem;
  active: boolean;
  hovered: boolean;
  compact: boolean;
  palette: HomePalette;
  onHoverIn: () => void;
  onHoverOut: () => void;
  onPress: () => void;
}) => {
  const highlighted = active || hovered;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: compact ? "auto" : 100,
        minWidth: compact ? 92 : 100,
        paddingHorizontal: compact ? spacing.lg : spacing.sm,
        paddingTop: compact ? spacing.sm : spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 3,
        borderBottomColor: highlighted ? palette.primary : "transparent",
        backgroundColor: highlighted ? palette.navHover : "transparent",
        transform: [{ translateY: hovered && !active && !compact ? -2 : 0 }],
      }}
    >
      {!compact ? (
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: highlighted ? `${item.color}14` : "transparent",
          }}
        >
          <Ionicons
            name={item.icon}
            size={24}
            color={highlighted ? item.color : palette.text}
          />
        </View>
      ) : null}
      <Text
        numberOfLines={1}
        style={{
          marginTop: compact ? 0 : spacing.sm,
          color: highlighted ? palette.text : palette.muted,
          fontSize: 13,
          fontWeight: highlighted ? "800" : "600",
          textAlign: "center",
          minHeight: compact ? undefined : 32,
        }}
      >
        {item.label}
      </Text>
    </Pressable>
  );
};

const HeaderDropdownItem = ({
  item,
  palette,
  onPress,
}: {
  item: HeaderMenuItem;
  palette: HomePalette;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: pressed ? palette.primarySoft : palette.elevated,
    })}
  >
    <Ionicons name={item.icon} size={20} color={palette.text} />
    <Text style={{ color: palette.text, fontSize: 15, fontWeight: "600" }}>
      {item.label}
    </Text>
  </Pressable>
);

const SectionHeader = ({
  title,
  icon,
  iconColor,
  actionLabel,
  palette,
  onActionPress,
}: SectionHeaderProps & { palette: HomePalette }) => (
  <View
    style={{
      marginTop: spacing.xl,
      marginBottom: spacing.md,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.md,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: palette.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: "900", color: palette.text }}>
        {title}
      </Text>
    </View>
    <Pressable
      onPress={onActionPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
      }}
    >
      <Text style={{ color: palette.primary, fontWeight: "800" }}>{actionLabel}</Text>
      <Ionicons name="chevron-forward" size={16} color={palette.primary} />
    </Pressable>
  </View>
);

const CountdownTimer = ({ endTime }: { endTime: number }) => {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, endTime - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
      {[
        { v: timeLeft.h, l: "H" },
        { v: timeLeft.m, l: "M" },
        { v: timeLeft.s, l: "S" },
      ].map((t, i) => (
        <View key={i} style={{ alignItems: "center" }}>
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.45)",
              borderRadius: radius.sm,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.xs,
              minWidth: 36,
              alignItems: "center",
            }}
          >
            <Text style={{ color: colors.white, fontSize: 14, fontWeight: "900" }}>
              {String(t.v).padStart(2, "0")}
            </Text>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 2 }}>
            {t.l}
          </Text>
        </View>
      ))}
    </View>
  );
};

const PremiumHeroBanner = ({
  item,
  palette,
  isDesktop,
  parallaxOffset,
  onPress,
  isActive,
}: {
  item: PremiumHeroItem;
  palette: HomePalette;
  isDesktop: boolean;
  parallaxOffset: number;
  onPress: () => void;
  isActive: boolean;
}) => {
  const heroHeight = isDesktop ? 400 : 340;
  const imageShift = Math.min(44, Math.max(0, parallaxOffset * 0.16));
  const imageScale = 1 + Math.min(0.08, Math.max(0, parallaxOffset) / 2200);

  return (
    <Pressable
      onPress={onPress}
      style={{
        height: heroHeight,
        borderRadius: isDesktop ? radius.xl : radius.lg,
        overflow: "hidden",
        backgroundColor: palette.surface,
        shadowColor: palette.shadow,
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: isDesktop ? 0.18 : 0.12,
        shadowRadius: 34,
        elevation: 5,
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          top: -30,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateY: -imageShift }, { scale: imageScale }],
        }}
      >
        <SmartImage
          uri={item.image}
          width="100%"
          height={heroHeight + 60}
          borderRadius={0}
          resizeMode="cover"
          fallbackEmoji="S"
          fallbackColor={palette.imageFallback}
        />
      </Animated.View>

      <LinearGradient
        colors={[palette.heroStart, palette.heroEnd]}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <View
        style={{
          flex: 1,
          padding: isDesktop ? spacing.xxxl : spacing.xl,
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              borderRadius: radius.pill,
              backgroundColor: "rgba(255,255,255,0.12)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: item.accent,
              }}
            />
            <Text style={{ color: colors.white, fontSize: 12, fontWeight: "900" }}>
              {item.eyebrow.toUpperCase()}
            </Text>
          </View>

          {item.endTime && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                backgroundColor: "rgba(0,0,0,0.35)",
                borderRadius: radius.pill,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
            >
              <Ionicons name="time-outline" size={14} color={colors.white} />
              <CountdownTimer endTime={item.endTime!} />
            </View>
          )}
        </View>

        <View style={{ maxWidth: isDesktop ? 680 : 320 }}>
          <Text
            style={{
              color: colors.white,
              fontSize: isDesktop ? 54 : 34,
              lineHeight: isDesktop ? 58 : 38,
              fontWeight: "900",
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: isDesktop ? 18 : 15,
              lineHeight: isDesktop ? 28 : 22,
              marginTop: spacing.md,
              maxWidth: isDesktop ? 560 : 300,
              fontWeight: "600",
            }}
          >
            {item.subtitle}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <View
              style={{
                backgroundColor: item.accent,
                borderRadius: radius.md,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
              }}
            >
              <Text style={{ color: "#111827", fontSize: 14, fontWeight: "900" }}>
                {item.offer}
              </Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.72)", fontWeight: "700" }}>
              Tap to explore
            </Text>
          </View>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.white,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            }}
          >
            <Ionicons name="arrow-forward" size={22} color={colors.primaryDark} />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const PromoGridCard = ({
  item,
  palette,
  large,
  onPress,
}: {
  item: PromoGridItem;
  palette: HomePalette;
  large?: boolean;
  onPress: () => void;
}) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            minHeight: large ? 336 : 160,
            borderRadius: radius.lg,
            overflow: "hidden",
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.border,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          <SmartImage
            uri={item.image}
            width="100%"
            height="100%"
            borderRadius={0}
            resizeMode="cover"
            fallbackEmoji="S"
            fallbackColor={palette.imageFallback}
          />
        </View>

        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.35)",
          }}
        />

        <LinearGradient
          colors={["rgba(0,0,0,0.02)", "rgba(0,0,0,0.7)"]}
          style={{
            flex: 1,
            justifyContent: "space-between",
            padding: large ? spacing.xl : spacing.lg,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: item.accent,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: item.accent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name={item.icon} size={22} color={colors.white} />
            </View>

            {item.tag && (
              <View
                style={{
                  backgroundColor: item.accent,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                }}
              >
                <Text style={{ color: colors.white, fontSize: 10, fontWeight: "900" }}>
                  {item.tag}
                </Text>
              </View>
            )}
          </View>

          <View>
            <Text
              numberOfLines={large ? 2 : 1}
              style={{
                color: colors.white,
                fontSize: large ? 28 : 18,
                lineHeight: large ? 32 : 22,
                fontWeight: "900",
                textShadowColor: "rgba(0,0,0,0.3)",
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}
            >
              {item.title}
            </Text>
            <Text
              numberOfLines={large ? 2 : 1}
              style={{
                color: "rgba(255,255,255,0.88)",
                marginTop: spacing.xs,
                fontSize: large ? 14 : 12,
                fontWeight: "700",
              }}
            >
              {item.subtitle}
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: spacing.md,
              }}
            >
              <Text style={{ color: item.accent, fontWeight: "800", fontSize: 13 }}>
                Explore
              </Text>
              <Ionicons name="arrow-forward" size={14} color={item.accent} style={{ marginLeft: spacing.xs }} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const AsymmetricPromoGrid = ({
  items,
  palette,
  isDesktop,
  onItemPress,
}: {
  items: PromoGridItem[];
  palette: HomePalette;
  isDesktop: boolean;
  onItemPress: (item: PromoGridItem) => void;
}) => {
  const [primary, ...secondaryItems] = items;

  if (!primary) {
    return null;
  }

  return (
    <View
      style={{
        marginTop: spacing.xl,
        flexDirection: isDesktop ? "row" : "column",
        gap: spacing.md,
      }}
    >
      <View style={{ flex: isDesktop ? 1.25 : undefined }}>
        <PromoGridCard
          item={primary}
          palette={palette}
          large
          onPress={() => onItemPress(primary)}
        />
      </View>
      {secondaryItems.length > 0 ? (
        <View style={{ flex: 1, gap: spacing.md }}>
          {secondaryItems.slice(0, 3).map((item, index) =>
            index === 0 ? (
              <PromoGridCard
                key={item.id}
                item={item}
                palette={palette}
                onPress={() => onItemPress(item)}
              />
            ) : null
          )}
          {secondaryItems.length > 1 ? (
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              {secondaryItems.slice(1, 3).map((item) => (
                <PromoGridCard
                  key={item.id}
                  item={item}
                  palette={palette}
                  onPress={() => onItemPress(item)}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const SaleBannerCard = ({
  item,
  width,
  onPress,
}: {
  item: SaleBannerItem;
  width: number;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={{
      width,
      height: 224,
      marginRight: spacing.xl,
      borderRadius: radius.lg,
      overflow: "hidden",
      backgroundColor: "#E52B1E",
    }}
  >
    <LinearGradient
      colors={["#F43F2E", "#D9281C"]}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "stretch",
        padding: spacing.xl,
      }}
    >
      <View style={{ flex: 1, justifyContent: "space-between", paddingRight: spacing.md }}>
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: "#FACC15",
            paddingHorizontal: spacing.xs,
            paddingVertical: 3,
            transform: [{ rotate: "-5deg" }],
          }}
        >
          <Text style={{ color: "#111827", fontSize: 20, fontWeight: "900", lineHeight: 20 }}>
            {item.brand}
          </Text>
        </View>

        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: colors.white,
            borderRadius: radius.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            maxWidth: 150,
          }}
        >
          <Text numberOfLines={1} style={{ color: colors.primaryDark, fontWeight: "900" }}>
            {item.partner}
          </Text>
        </View>

        <View>
          <Text numberOfLines={1} style={{ color: colors.white, fontSize: 20, fontWeight: "800" }}>
            {item.title}
          </Text>
          <Text style={{ color: colors.white, fontSize: 24, fontWeight: "900", marginTop: 6 }}>
            {item.offer}
          </Text>
        </View>
      </View>

      <View
        style={{
          width: "42%",
          minWidth: 150,
          borderRadius: radius.md,
          borderWidth: 3,
          borderColor: "#FACC15",
          backgroundColor: "#FDE68A",
          overflow: "hidden",
          alignSelf: "center",
          height: 178,
        }}
      >
        <SmartImage
          uri={item.image}
          width="100%"
          height="100%"
          borderRadius={0}
          resizeMode="cover"
          fallbackEmoji="S"
          fallbackColor="#FDE68A"
        />
      </View>
    </LinearGradient>
  </Pressable>
);

const VisualCategoryTile = ({
  item,
  palette,
  onPress,
}: {
  item: VisualCategoryItem;
  palette: HomePalette;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={{
      width: 96,
      alignItems: "center",
      marginRight: spacing.xl,
      marginBottom: spacing.md,
    }}
  >
    <View
      style={{
        width: 92,
        height: 82,
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <View
        style={{
          position: "absolute",
          bottom: 0,
          width: 88,
          height: 30,
          borderRadius: 14,
          backgroundColor: "#2F80ED",
          borderBottomWidth: 5,
          borderBottomColor: "#1D4ED8",
        }}
      />
      <SmartImage
        uri={item.image}
        width={78}
        height={72}
        borderRadius={12}
        resizeMode="cover"
        fallbackEmoji="S"
        fallbackColor="#DBEAFE"
      />
    </View>
    <Text
      numberOfLines={1}
      style={{
        color: palette.text,
        fontSize: 11,
        fontWeight: "800",
        marginTop: spacing.xs,
        textAlign: "center",
      }}
    >
      {item.label}
    </Text>
  </Pressable>
);

const LovedOneCard = ({
  item,
  width,
  palette,
  onPress,
}: {
  item: LovedOneItem;
  width: number;
  palette: HomePalette;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={{
      width,
      height: 170,
      borderRadius: radius.md,
      overflow: "hidden",
      backgroundColor: palette.primary,
      marginRight: spacing.xl,
    }}
  >
    <SmartImage
      uri={item.image}
      width="100%"
      height="100%"
      borderRadius={0}
      resizeMode="cover"
      fallbackEmoji="S"
      fallbackColor={palette.imageFallback}
    />
    <LinearGradient
      colors={["rgba(0,30,80,0.08)", "rgba(0,34,90,0.82)"]}
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        justifyContent: "flex-end",
        padding: spacing.lg,
      }}
    >
      <Text style={{ color: colors.white, fontSize: 21, fontWeight: "900" }}>
        {item.title}
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.84)", marginTop: 4, fontWeight: "700" }}>
        {item.subtitle}
      </Text>
    </LinearGradient>
  </Pressable>
);

const MediaShowcaseCard = ({
  item,
  width,
  autoplay,
  onPress,
}: {
  item: BuyerMediaShowcaseItem;
  width: number;
  autoplay: boolean;
  onPress: () => void;
}) => {
  const canRenderVideo = Platform.OS === "web" && Boolean(item.videoUrl?.trim());

  return (
    <Pressable
      onPress={onPress}
      style={{
        width,
        marginRight: spacing.md,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: "100%",
          aspectRatio: 1,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#000000",
        }}
      >
        {canRenderVideo ? (
          createElement("video", {
            src: item.videoUrl,
            poster: item.image,
            autoPlay: autoplay,
            muted: true,
            loop: true,
            playsInline: true,
            style: {
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            },
          })
        ) : (
          <SmartImage
            uri={item.image}
            width="100%"
            height="100%"
            borderRadius={0}
            resizeMode="cover"
          />
        )}
      </View>
      <Text
        numberOfLines={1}
        style={{
          color: colors.text,
          fontWeight: "900",
          marginTop: spacing.xs,
          textAlign: "center",
          width: "100%",
        }}
      >
        {item.label}
      </Text>
    </Pressable>
  );
};

const MediaShowcaseSection = ({
  title,
  items,
  autoplay,
  isDesktop,
  onItemPress,
}: {
  title: string;
  items: BuyerMediaShowcaseItem[];
  autoplay: boolean;
  isDesktop: boolean;
  onItemPress: (item: BuyerMediaShowcaseItem) => void;
}) => {
  const scrollRef = useRef<ScrollView | null>(null);
  const itemWidth = isDesktop ? 320 : 168;
  const stepWidth = itemWidth + spacing.md;

  useEffect(() => {
    if (!autoplay || items.length <= 1) {
      return;
    }

    let index = 0;
    const timer = setInterval(() => {
      index = (index + 1) % items.length;
      scrollRef.current?.scrollTo({ x: index * stepWidth, animated: true });
    }, 3200);

    return () => clearInterval(timer);
  }, [autoplay, items.length, stepWidth]);

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}>
      <Text
        style={{
          color: colors.text,
          fontSize: isDesktop ? 26 : 22,
          fontWeight: "900",
          marginBottom: spacing.md,
        }}
      >
        {title}
      </Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: spacing.xl }}
      >
        {items.map((item) => (
          <MediaShowcaseCard
            key={item.id}
            item={item}
            width={itemWidth}
            autoplay={autoplay}
            onPress={() => onItemPress(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default function HomeTabScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const homeColors = homePalettes[colorScheme === "dark" ? "dark" : "light"];
  const windowWidth = Dimensions.get("window").width;
  const isDesktopWeb = Platform.OS === "web" && windowWidth >= 1080;
  const mobileTopInset = Platform.OS === "android" ? StatusBar.currentHeight || spacing.lg : 0;
  const contentHorizontalPadding = isDesktopWeb ? spacing.xl : spacing.lg;
  const contentWidth = isDesktopWeb
    ? Math.min(windowWidth - contentHorizontalPadding * 2, 1480)
    : windowWidth - contentHorizontalPadding * 2;
  const lovedCardWidth = isDesktopWeb
    ? Math.max(300, (contentWidth - spacing.xl * 2) / 3)
    : Math.min(contentWidth * 0.82, 340);
  const addItem = useCartStore((state) => state.addItem);
  const totalItems = useCartStore((state) => state.totalItems());

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("Fashion");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [openMenu, setOpenMenu] = useState<HeaderMenuKey>(null);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [activeDesktopCategoryId, setActiveDesktopCategoryId] = useState("fashion");
  const [desktopCategoryCompact, setDesktopCategoryCompact] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [pageContent, setPageContent] = useState<BuyerPageContent>(defaultBuyerPageContent);
  const homeContent = pageContent.home;
  const hiddenHomeSections = homeContent.hiddenSections || [];
  const homeSectionOrder = normalizeBuyerHomeSectionOrder(homeContent.sectionOrder);
  const getHomeSectionOrder = (section: BuyerHomeSectionKey) => homeSectionOrder.indexOf(section);
  const isHomeSectionHidden = (section: BuyerHomeSectionKey) =>
    hiddenHomeSections.includes(section);
  const premiumHeroItems = useMemo<PremiumHeroItem[]>(
    () =>
      isHomeSectionHidden("hero") ? [] : homeContent.heroes.map((hero) => ({
        ...hero,
        endTime: Date.now() + Math.max(hero.durationHours || 24, 1) * 60 * 60 * 1000,
      })),
    [hiddenHomeSections, homeContent.heroes]
  );
  const promoGridItems = useMemo<PromoGridItem[]>(
    () =>
      isHomeSectionHidden("promo") ? [] : homeContent.promoGrid.map((item) => ({
        ...item,
        icon: item.icon as keyof typeof Ionicons.glyphMap,
      })),
    [hiddenHomeSections, homeContent.promoGrid]
  );
  const visualCategoryItems = isHomeSectionHidden("category") ? [] : homeContent.visualCategories;
  const lovedOneItems = isHomeSectionHidden("lovedOnes") ? [] : homeContent.lovedOnes;
  const activeHero =
    premiumHeroItems.length > 0 ? premiumHeroItems[bannerIndex % premiumHeroItems.length] : null;
  const homeCardPalette = useMemo(
    () => ({
      card: homeColors.surface,
      text: homeColors.text,
      muted: homeColors.muted,
      border: homeColors.border,
      imageFallback: homeColors.imageFallback,
      primary: homeColors.primary,
    }),
    [homeColors]
  );

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToActiveProducts((liveProducts) => {
      setProducts(liveProducts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToBuyerPageContent(setPageContent);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (premiumHeroItems.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setBannerIndex((current) => (current + 1) % premiumHeroItems.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [premiumHeroItems.length]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      const search = searchText.trim().toLowerCase();
      const matchesSearch =
        search.length === 0 ||
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search);

      return matchesCategory && matchesSearch && product.isActive;
    });
  }, [activeCategory, products, searchText]);

  const dealProducts = useMemo(
    () => products.filter((product) => product.isDeal).slice(0, 10),
    [products]
  );

  const featuredProducts = useMemo(() => {
    const categoryMatches = filteredProducts.filter(
      (product) => product.isFeatured || !product.isDeal
    );

    if (categoryMatches.length > 0) {
      return categoryMatches;
    }

    return products.filter((product) => product.isFeatured || !product.isDeal);
  }, [filteredProducts, products]);

  const closeOpenMenu = () => {
    setOpenMenu(null);
  };

  const openSearchResults = () => {
    closeOpenMenu();
    router.push({
      pathname: "/search",
      params: {
        q: searchText,
        category: activeCategory === "All" ? undefined : activeCategory,
      },
    });
  };

  const goToLogin = () => {
    closeOpenMenu();
    router.push("/(auth)/login");
  };

  const goToRegister = () => {
    closeOpenMenu();
    router.push("/(auth)/register");
  };

  const goToProfile = () => {
    closeOpenMenu();
    router.push(user ? "/profile" : "/(auth)/login");
  };

  const goToOrders = () => {
    closeOpenMenu();
    router.push(user ? "/orders" : "/(auth)/login");
  };

  const goToWishlist = () => {
    closeOpenMenu();
    router.push(user ? "/wishlist" : "/(auth)/login");
  };

  const goToNotifications = () => {
    closeOpenMenu();
    router.push(user ? "/notifications" : "/(auth)/login");
  };

  const goToPermissions = () => {
    closeOpenMenu();
    router.push("/permissions");
  };

  const goToSupport = () => {
    closeOpenMenu();
    router.push("/support");
  };

  const goToSeller = () => {
    closeOpenMenu();
    if (!user) {
      router.push("/(auth)/login");
      return;
    }

    router.push(profile?.role === "seller" ? "/seller/dashboard" : "/seller/register");
  };

  const showComingSoon = (title: string, message: string) => {
    closeOpenMenu();
    showToast("info", title, message);
  };

  const loginMenuItems: HeaderMenuItem[] = [
    {
      id: "profile",
      label: "My Profile",
      icon: "person-circle-outline",
      onPress: goToProfile,
    },
    {
      id: "plus",
      label: "SachinIndia Plus Zone",
      icon: "sparkles-outline",
      onPress: () =>
        showComingSoon("Plus Zone", "Exclusive member benefits are coming soon."),
    },
    {
      id: "orders",
      label: "Orders",
      icon: "cube-outline",
      onPress: goToOrders,
    },
    {
      id: "wishlist",
      label: "Wishlist",
      icon: "heart-outline",
      onPress: goToWishlist,
    },
    {
      id: "seller",
      label: "Become a Seller",
      icon: "storefront-outline",
      onPress: goToSeller,
    },
    {
      id: "rewards",
      label: "Rewards",
      icon: "gift-outline",
      onPress: () =>
        showComingSoon("Rewards", "Reward points and offers will appear here soon."),
    },
    {
      id: "gift-cards",
      label: "Gift Cards",
      icon: "gift-outline",
      onPress: () =>
        showComingSoon("Gift Cards", "Gift cards are being prepared for SachinIndia."),
    },
    {
      id: "notification-preferences",
      label: "Permissions & Privacy",
      icon: "shield-checkmark-outline",
      onPress: goToPermissions,
    },
    {
      id: "care",
      label: "24x7 Customer Care",
      icon: "headset-outline",
      onPress: goToSupport,
    },
    {
      id: "advertise",
      label: "Advertise",
      icon: "megaphone-outline",
      onPress: () =>
        showComingSoon("Advertise", "Ad placements for sellers will launch soon."),
    },
    {
      id: "download",
      label: "Download App",
      icon: "download-outline",
      onPress: () =>
        showComingSoon("Download App", "Android and iOS app download links are coming soon."),
    },
  ];

  const moreMenuItems: HeaderMenuItem[] = [
    {
      id: "more-seller",
      label: "Become a Seller",
      icon: "storefront-outline",
      onPress: goToSeller,
    },
    {
      id: "more-notifications",
      label: "Notification Settings",
      icon: "notifications-outline",
      onPress: goToNotifications,
    },
    {
      id: "more-permissions",
      label: "Permissions",
      icon: "shield-checkmark-outline",
      onPress: goToPermissions,
    },
    {
      id: "more-care",
      label: "24x7 Customer Care",
      icon: "headset-outline",
      onPress: goToSupport,
    },
    {
      id: "more-advertise",
      label: "Advertise on SachinIndia",
      icon: "megaphone-outline",
      onPress: () =>
        showComingSoon("Advertise on SachinIndia", "Seller promotion tools are coming soon."),
    },
  ];

  const handleAddToCart = (product: Product) => {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: 1,
      sellerId: product.sellerId,
      category: product.category,
    });
    showToast("success", "Added to cart", product.name);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: homeColors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={isDesktopWeb ? [0, 1] : undefined}
        scrollEventThrottle={16}
        onScrollBeginDrag={closeOpenMenu}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          setScrollY((current) =>
            Math.abs(current - offsetY) < 2 ? current : offsetY
          );

          if (!isDesktopWeb) {
            return;
          }

          const nextCompact = offsetY > 36;
          setDesktopCategoryCompact((current) => (current === nextCompact ? current : nextCompact));
        }}
      >
        {isDesktopWeb ? (
          <>
            <View
              style={{
                backgroundColor: homeColors.headerBg,
                borderBottomWidth: 1,
                borderBottomColor: homeColors.headerBorder,
                position: "relative",
                zIndex: 90,
                overflow: "visible",
              }}
            >
              <View
                style={{
                  width: "100%",
                  maxWidth: 1480,
                  alignSelf: "center",
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.md,
                  position: "relative",
                  zIndex: 90,
                  overflow: "visible",
                }}
              >
                {openMenu ? (
                  <Pressable
                    onPress={closeOpenMenu}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4000,
                      zIndex: 120,
                      backgroundColor: "transparent",
                    }}
                  />
                ) : null}

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.lg,
                    position: "relative",
                    zIndex: 150,
                    overflow: "visible",
                  }}
                >
                  <Pressable
                    onPress={() => {
                      setActiveDesktopCategoryId("for-you");
                      setActiveCategory("All");
                      closeOpenMenu();
                      router.push("/");
                    }}
                    style={{
                      backgroundColor: homeColors.accent,
                      borderRadius: radius.lg,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                    }}
                  >
                    <Ionicons name="bag-handle" size={22} color={homeColors.inverseText} />
                    <Text style={{ color: homeColors.inverseText, fontWeight: "900", fontSize: 22 }}>
                      SachinIndia
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={homeColors.inverseText} />
                  </Pressable>

                  <View
                    style={{
                      flex: 1,
                      minHeight: 56,
                      borderRadius: radius.lg,
                      borderWidth: 2,
                      borderColor: homeColors.border,
                      backgroundColor: homeColors.searchBg,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: spacing.lg,
                    }}
                  >
                    <Ionicons name="search-outline" size={24} color={homeColors.muted} />
                    <TextInput
                      value={searchText}
                      onChangeText={setSearchText}
                      onSubmitEditing={openSearchResults}
                      placeholder="Search for Products, Brands and More"
                      placeholderTextColor={homeColors.muted}
                      style={{
                        flex: 1,
                        minHeight: 50,
                        marginLeft: spacing.md,
                        color: homeColors.text,
                        fontSize: 16,
                      }}
                    />
                    {searchText ? (
                      <Pressable onPress={() => setSearchText("")} style={{ marginRight: spacing.sm }}>
                        <Ionicons name="close-circle" size={20} color={homeColors.muted} />
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={openSearchResults}
                      style={{
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.sm,
                        borderRadius: radius.md,
                        backgroundColor: homeColors.primarySoft,
                      }}
                    >
                      <Text style={{ color: homeColors.primary, fontWeight: "800" }}>Search</Text>
                    </Pressable>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
                    <View style={{ position: "relative", zIndex: openMenu === "login" ? 210 : 5 }}>
                      <Pressable
                        onPress={() => setOpenMenu((current) => (current === "login" ? null : "login"))}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: spacing.sm,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.sm,
                          borderRadius: radius.md,
                          backgroundColor: openMenu === "login" ? homeColors.primarySoft : "transparent",
                        }}
                      >
                        <Ionicons name="person-circle-outline" size={25} color={homeColors.text} />
                        <Text style={{ color: homeColors.text, fontSize: 15, fontWeight: "700" }}>
                          {user ? profile?.name?.split(" ")[0] || "Account" : "Login"}
                        </Text>
                        <Ionicons
                          name={openMenu === "login" ? "chevron-up" : "chevron-down"}
                          size={14}
                          color={homeColors.text}
                        />
                      </Pressable>

                      {openMenu === "login" ? (
                        <Pressable
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            width: 320,
                            backgroundColor: homeColors.elevated,
                            borderRadius: radius.xl,
                            borderWidth: 1,
                            borderColor: homeColors.border,
                            overflow: "hidden",
                            shadowColor: "#0F172A",
                            shadowOffset: { width: 0, height: 12 },
                            shadowOpacity: 0.12,
                            shadowRadius: 30,
                            elevation: 8,
                            zIndex: 220,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              paddingHorizontal: spacing.lg,
                              paddingVertical: spacing.lg,
                            }}
                          >
                            <View style={{ flex: 1, paddingRight: spacing.md }}>
                              <Text style={{ color: homeColors.text, fontSize: 16, fontWeight: "800" }}>
                                {user ? `Hello, ${profile?.name?.split(" ")[0] || "SachinIndia user"}` : "New customer?"}
                              </Text>
                              <Text style={{ color: homeColors.muted, marginTop: 4 }}>
                                {user ? "Access your shortcuts, orders and saved items." : "Create your account in seconds."}
                              </Text>
                            </View>
                            {!user ? (
                              <Pressable onPress={goToRegister}>
                                <Text style={{ color: colors.primary, fontWeight: "900", fontSize: 16 }}>
                                  Sign Up
                                </Text>
                              </Pressable>
                            ) : null}
                          </View>

                          <View style={{ height: 1, backgroundColor: homeColors.border }} />

                          {loginMenuItems.map((item) => (
                            <HeaderDropdownItem key={item.id} item={item} palette={homeColors} onPress={item.onPress} />
                          ))}

                          {!user ? (
                            <>
                              <View style={{ height: 1, backgroundColor: homeColors.border }} />
                              <Pressable
                                onPress={goToLogin}
                                style={{
                                  paddingHorizontal: spacing.lg,
                                  paddingVertical: spacing.md + 2,
                                  backgroundColor: homeColors.primarySoft,
                                }}
                              >
                                <Text style={{ color: homeColors.primary, fontWeight: "800", textAlign: "center" }}>
                                  Sign In to unlock more
                                </Text>
                              </Pressable>
                            </>
                          ) : null}
                        </Pressable>
                      ) : null}
                    </View>

                    <View style={{ position: "relative", zIndex: openMenu === "more" ? 205 : 4 }}>
                      <Pressable
                        onPress={() => setOpenMenu((current) => (current === "more" ? null : "more"))}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: spacing.xs,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.sm,
                          borderRadius: radius.md,
                          backgroundColor: openMenu === "more" ? homeColors.primarySoft : "transparent",
                        }}
                      >
                        <Text style={{ color: homeColors.text, fontSize: 15, fontWeight: "700" }}>
                          More
                        </Text>
                        <Ionicons
                          name={openMenu === "more" ? "chevron-up" : "chevron-down"}
                          size={14}
                          color={homeColors.text}
                        />
                      </Pressable>

                      {openMenu === "more" ? (
                        <Pressable
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            width: 280,
                            backgroundColor: homeColors.elevated,
                            borderRadius: radius.xl,
                            borderWidth: 1,
                            borderColor: homeColors.border,
                            overflow: "hidden",
                            shadowColor: "#0F172A",
                            shadowOffset: { width: 0, height: 12 },
                            shadowOpacity: 0.12,
                            shadowRadius: 30,
                            elevation: 8,
                            zIndex: 215,
                          }}
                        >
                          <Text
                            style={{
                              color: homeColors.text,
                              fontSize: 16,
                              fontWeight: "900",
                              paddingHorizontal: spacing.lg,
                              paddingVertical: spacing.lg,
                            }}
                          >
                            More
                          </Text>
                          <View style={{ height: 1, backgroundColor: homeColors.border }} />
                          {moreMenuItems.map((item) => (
                            <HeaderDropdownItem key={item.id} item={item} palette={homeColors} onPress={item.onPress} />
                          ))}
                        </Pressable>
                      ) : null}
                    </View>

                    <Pressable
                      onPress={() => {
                        closeOpenMenu();
                        router.push("/cart");
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.sm,
                      }}
                    >
                      <View style={{ position: "relative" }}>
                        <Ionicons name="cart-outline" size={26} color={homeColors.text} />
                        {totalItems > 0 ? (
                          <View
                            style={{
                              position: "absolute",
                              top: -6,
                              right: -8,
                              minWidth: 18,
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: colors.primary,
                              alignItems: "center",
                              justifyContent: "center",
                              paddingHorizontal: 4,
                            }}
                          >
                            <Text style={{ color: colors.white, fontWeight: "900", fontSize: 10 }}>
                              {totalItems}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={{ color: homeColors.text, fontSize: 15, fontWeight: "700" }}>Cart</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            <View
              style={{
                backgroundColor: homeColors.headerBg,
                borderBottomWidth: 1,
                borderBottomColor: homeColors.headerBorder,
                position: "relative",
                zIndex: 40,
                minHeight: desktopCategoryCompact ? 50 : 98,
              }}
            >
              <View
                style={{
                  width: "100%",
                  maxWidth: 1480,
                  alignSelf: "center",
                  paddingHorizontal: spacing.xl,
                  position: "relative",
                  zIndex: 40,
                }}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingVertical: desktopCategoryCompact ? 0 : spacing.xs,
                    alignItems: "center",
                  }}
                >
                  {desktopCategoryItems.map((item) => (
                    <HomeDesktopCategoryButton
                      key={item.id}
                      item={item}
                      active={activeDesktopCategoryId === item.id}
                      hovered={hoveredCategoryId === item.id}
                      compact={desktopCategoryCompact}
                      palette={homeColors}
                      onHoverIn={() => setHoveredCategoryId(item.id)}
                      onHoverOut={() =>
                        setHoveredCategoryId((current) => (current === item.id ? null : current))
                      }
                      onPress={() => {
                        closeOpenMenu();
                        setActiveDesktopCategoryId(item.id);
                        setActiveCategory(item.category);
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>
          </>
        ) : null}

        {!isDesktopWeb ? (
          <LinearGradient
            colors={
              colorScheme === "dark"
                ? ["#020617", "#0F172A"]
                : [colors.primary, colors.primaryDark]
            }
            style={{
              paddingHorizontal: spacing.lg,
              paddingTop: mobileTopInset,
              paddingBottom: spacing.xl,
            }}
          >
          <View
            style={{
              paddingTop: spacing.md,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{ width: "56%", minWidth: 0, paddingRight: spacing.sm }}>
              <Text
                numberOfLines={1}
                style={{ color: colors.white, fontSize: 26, fontWeight: "900" }}
              >
                SachinIndia
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs }}>
                <Text style={{ color: "rgba(255,255,255,0.86)", fontSize: 14 }}>
                  {getGreeting()}
                  {profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
                </Text>
                {profile?.role === "seller" ? (
                  <Pressable
                    onPress={() => router.push("/seller/dashboard")}
                    style={{
                      backgroundColor: colors.accent,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 4,
                      borderRadius: radius.pill,
                    }}
                  >
                    <Text style={{ color: colors.white, fontWeight: "800", fontSize: 11 }}>
                      Seller
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, flexShrink: 0 }}>
              <Pressable
                onPress={() => router.push("/notifications")}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: "rgba(255,255,255,0.14)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="notifications-outline" size={19} color={colors.white} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/cart")}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: "rgba(255,255,255,0.14)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="cart-outline" size={19} color={colors.white} />
                {totalItems > 0 ? (
                  <View
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: colors.accent,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text style={{ color: colors.white, fontWeight: "900", fontSize: 10 }}>
                      {totalItems}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => router.push(user ? "/profile" : "/(auth)/login")}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: "rgba(255,255,255,0.14)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="person-outline" size={19} color={colors.white} />
              </Pressable>
            </View>
          </View>

          <View
            style={{
              marginTop: spacing.lg,
              backgroundColor: homeColors.searchBg,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.16)",
              borderRadius: radius.pill,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <Ionicons name="search-outline" size={18} color={homeColors.muted} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search products, brands, categories..."
              placeholderTextColor={homeColors.muted}
              style={{ flex: 1, marginHorizontal: spacing.sm, color: homeColors.text, minHeight: 40 }}
            />
            {searchText ? (
              <Pressable onPress={() => setSearchText("")} style={{ marginRight: spacing.sm }}>
                <Ionicons name="close-circle" size={18} color={homeColors.muted} />
              </Pressable>
            ) : null}
            <Pressable onPress={openSearchResults}>
              <Ionicons name="options-outline" size={18} color={homeColors.primary} />
            </Pressable>
          </View>
          </LinearGradient>
        ) : null}

        <View
          style={{
            paddingHorizontal: contentHorizontalPadding,
            paddingTop: spacing.lg,
            paddingBottom: 120,
            width: "100%",
            maxWidth: isDesktopWeb ? 1480 : undefined,
            alignSelf: isDesktopWeb ? "center" : undefined,
            position: "relative",
            zIndex: 1,
          }}
        >
          {profile?.role === "seller" ? (
            <Pressable
              onPress={() => router.push("/seller/dashboard")}
              style={{
                backgroundColor: homeColors.primarySoft,
                borderRadius: radius.lg,
                padding: spacing.lg,
                marginBottom: spacing.lg,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: homeColors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="storefront-outline" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: homeColors.primaryDark, fontSize: 18, fontWeight: "900" }}>
                    Seller Dashboard
                  </Text>
                  <Text style={{ color: homeColors.primaryDark, marginTop: 4 }}>
                    Manage products, inventory and orders.
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={homeColors.primaryDark} />
            </Pressable>
          ) : null}

          {activeHero ? (
            <View style={{ order: getHomeSectionOrder("hero") } as ViewStyle}>
              <PremiumHeroBanner
                item={activeHero}
                palette={homeColors}
                isDesktop={isDesktopWeb}
                parallaxOffset={scrollY}
                onPress={() => {
                  setActiveCategory(activeHero.category);
                  setActiveDesktopCategoryId(resolveDesktopCategoryId(activeHero.category));
                  router.push({ pathname: "/search", params: { category: activeHero.category } });
                }}
                isActive={true}
              />

              <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.md, marginBottom: spacing.xl, gap: spacing.sm }}>
                {premiumHeroItems.map((hero, index) => {
                  const active = bannerIndex % premiumHeroItems.length === index;

                  return (
                    <Pressable
                      key={hero.id}
                      onPress={() => setBannerIndex(index)}
                      style={{
                        width: active ? 28 : 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: active ? homeColors.primary : homeColors.dot,
                      }}
                    />
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={{ order: getHomeSectionOrder("promo") } as ViewStyle}>
            <AsymmetricPromoGrid
              items={promoGridItems}
              palette={homeColors}
              isDesktop={isDesktopWeb}
              onItemPress={(item) => {
                setActiveCategory(item.category);
                setActiveDesktopCategoryId(resolveDesktopCategoryId(item.category));
                router.push({ pathname: "/search", params: { category: item.category } });
              }}
            />
          </View>

          {!isHomeSectionHidden("mediaShowcase") ? (
            <View style={{ order: getHomeSectionOrder("mediaShowcase") } as ViewStyle}>
              <MediaShowcaseSection
                title={homeContent.mediaShowcase.title}
                items={homeContent.mediaShowcase.items}
                autoplay={homeContent.mediaShowcase.autoplay}
                isDesktop={isDesktopWeb}
                onItemPress={(item) => {
                  setActiveCategory(item.category);
                  setActiveDesktopCategoryId(resolveDesktopCategoryId(item.category));
                  router.push({ pathname: "/search", params: { category: item.category } });
                }}
              />
            </View>
          ) : null}

          {visualCategoryItems.length > 0 ? (
            <View style={{ order: getHomeSectionOrder("category") } as ViewStyle}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingRight: spacing.xl,
                }}
              >
                <View>
                  <View style={{ flexDirection: "row" }}>
                    {visualCategoryItems.slice(0, 10).map((item) => (
                      <VisualCategoryTile
                        key={item.id}
                        item={item}
                        palette={homeColors}
                        onPress={() => {
                          setActiveCategory(item.category);
                          setActiveDesktopCategoryId(resolveDesktopCategoryId(item.category));
                        }}
                      />
                    ))}
                  </View>
                  <View style={{ flexDirection: "row" }}>
                    {visualCategoryItems.slice(10).map((item) => (
                      <VisualCategoryTile
                        key={item.id}
                        item={item}
                        palette={homeColors}
                        onPress={() => {
                          setActiveCategory(item.category);
                          setActiveDesktopCategoryId(resolveDesktopCategoryId(item.category));
                        }}
                      />
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          ) : null}

          {lovedOneItems.length > 0 ? (
            <View style={{ order: getHomeSectionOrder("lovedOnes") } as ViewStyle}>
              <Text
                style={{
                  marginTop: spacing.lg,
                  marginBottom: spacing.md,
                  color: homeColors.text,
                  fontSize: 24,
                  fontWeight: "900",
                }}
              >
                {homeContent.lovedOnesTitle}
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {lovedOneItems.map((item) => (
                  <LovedOneCard
                    key={item.id}
                    item={item}
                    width={lovedCardWidth}
                    palette={homeColors}
                    onPress={() => {
                      setActiveCategory(item.category);
                      setActiveDesktopCategoryId(resolveDesktopCategoryId(item.category));
                      router.push({ pathname: "/search", params: { category: item.category } });
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {!isDesktopWeb ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ order: 20 } as ViewStyle} contentContainerStyle={{ paddingBottom: spacing.sm }}>
              {categoryList
                .filter((category) =>
                  ["All", "Electronics", "Fashion", "Home", "Sports", "Books", "Beauty"].includes(category.name)
                )
                .map((category) => (
                  <CategoryChip
                    key={category.id}
                    icon={category.icon as keyof typeof Ionicons.glyphMap}
                    label={category.name}
                    color={category.color}
                    active={activeCategory === category.name}
                    palette={{
                      surface: homeColors.chipBg,
                      text: homeColors.text,
                      border: homeColors.border,
                    }}
                    onPress={() => setActiveCategory(category.name)}
                  />
                ))}
            </ScrollView>
          ) : null}

          <View style={{ order: 21 } as ViewStyle}>
            <SectionHeader
              title={homeContent.dealsTitle}
              icon="flash"
              iconColor={colors.accent}
              actionLabel={homeContent.dealsActionLabel}
              palette={homeColors}
              onActionPress={() => router.push("/deals")}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dealProducts.map((product) => (
                <DealCard
                  key={product.id}
                  product={product}
                  palette={homeCardPalette}
                  onPress={() => router.push(`/product/${product.id}`)}
                />
              ))}
            </ScrollView>

            <SectionHeader
              title={homeContent.featuredTitle}
              icon="star"
              iconColor={colors.star}
              actionLabel={homeContent.featuredActionLabel}
              palette={homeColors}
              onActionPress={() =>
                router.push({
                  pathname: "/search",
                  params: { q: searchText, category: activeCategory },
                })
              }
            />

            {loading ? (
              <View style={{ paddingVertical: spacing.xxxl }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    palette={homeCardPalette}
                    onPress={() => router.push(`/product/${product.id}`)}
                    onAddToCart={() => handleAddToCart(product)}
                  />
                ))}
              </View>
            )}
          </View>

          {featuredProducts.length === 0 && !loading ? (
            <View
              style={{
                order: 22,
                backgroundColor: homeColors.surface,
                padding: spacing.xl,
                borderRadius: radius.lg,
                alignItems: "center",
                borderWidth: 1,
                borderColor: homeColors.border,
              } as ViewStyle}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: homeColors.text }}>
                No products match that search yet.
              </Text>
              <Text style={{ color: homeColors.muted, marginTop: spacing.sm, textAlign: "center" }}>
                Try a different keyword or category to find more products.
              </Text>
            </View>
          ) : null}

          <View style={{ order: 23 } as ViewStyle}>
            <DesktopSiteFooter />
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
