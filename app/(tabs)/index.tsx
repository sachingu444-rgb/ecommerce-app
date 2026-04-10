import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { collection, onSnapshot } from "firebase/firestore";

import CategoryChip from "../../components/CategoryChip";
import DesktopSiteFooter from "../../components/DesktopSiteFooter";
import DealCard from "../../components/DealCard";
import ProductCard from "../../components/ProductCard";
import { categoryList, homeBanners, mockProducts } from "../../constants/mockData";
import { bannerGradients, colors, radius, spacing } from "../../constants/theme";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../../lib/toast";
import { getGreeting, safeProduct } from "../../lib/utils";
import { useCartStore } from "../../store/cartStore";
import { Product } from "../../types";

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
    icon: "happy-outline",
    color: "#EAB308",
  },
  {
    id: "food",
    label: "Food & Health",
    category: "Food",
    icon: "nutrition-outline",
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
    icon: "bed-outline",
    color: "#CA8A04",
  },
];

const HomeDesktopCategoryButton = ({
  item,
  active,
  hovered,
  compact,
  onHoverIn,
  onHoverOut,
  onPress,
}: {
  item: DesktopCategoryItem;
  active: boolean;
  hovered: boolean;
  compact: boolean;
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
        borderBottomColor: highlighted ? colors.primary : "transparent",
        backgroundColor: highlighted ? "rgba(0,102,204,0.04)" : "transparent",
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
            color={highlighted ? item.color : colors.text}
          />
        </View>
      ) : null}
      <Text
        numberOfLines={1}
        style={{
          marginTop: compact ? 0 : spacing.sm,
          color: highlighted ? colors.text : colors.muted,
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
  onPress,
}: {
  item: HeaderMenuItem;
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
      backgroundColor: pressed ? colors.primaryLight : colors.white,
    })}
  >
    <Ionicons name={item.icon} size={20} color={colors.text} />
    <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>
      {item.label}
    </Text>
  </Pressable>
);

export default function HomeTabScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const { user, profile } = useAuth();
  const windowWidth = Dimensions.get("window").width;
  const isDesktopWeb = Platform.OS === "web" && windowWidth >= 1080;
  const mobileTopInset = Platform.OS === "android" ? StatusBar.currentHeight || spacing.lg : 0;
  const contentHorizontalPadding = isDesktopWeb ? spacing.xl : spacing.lg;
  const bannerWidth = isDesktopWeb
    ? Math.min(Math.max(windowWidth * 0.34, 360), 520)
    : windowWidth - contentHorizontalPadding * 2;
  const bannerStep = bannerWidth + spacing.md;
  const addItem = useCartStore((state) => state.addItem);
  const totalItems = useCartStore((state) => state.totalItems());

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [openMenu, setOpenMenu] = useState<HeaderMenuKey>(null);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [activeDesktopCategoryId, setActiveDesktopCategoryId] = useState("for-you");
  const [desktopCategoryCompact, setDesktopCategoryCompact] = useState(false);

  useEffect(() => {
    setLoading(true);
    const productsCollection = collection(db, "products");
    const unsubscribe = onSnapshot(
      productsCollection,
      (snapshot) => {
        if (snapshot.empty) {
          setProducts(mockProducts.filter((product) => product.isActive));
          setLoading(false);
          return;
        }

        const liveProducts = snapshot.docs
          .map((item) => safeProduct({ id: item.id, ...item.data() }))
          .filter((product) => product.isActive)
          .sort((left, right) =>
            String(right.createdAt || "").localeCompare(String(left.createdAt || ""))
          );

        setProducts(liveProducts);
        setLoading(false);
      },
      () => {
        setProducts(mockProducts.filter((product) => product.isActive));
        setLoading(false);
        showToast(
          "info",
          "Live updates unavailable",
          "Showing available products from local fallback data."
        );
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (bannerIndex + 1) % homeBanners.length;
      scrollRef.current?.scrollTo({
        x: nextIndex * bannerStep,
        animated: true,
      });
      setBannerIndex(nextIndex);
    }, 3500);

    return () => clearInterval(timer);
  }, [bannerIndex, bannerStep]);

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

  const featuredProducts = useMemo(
    () => filteredProducts.filter((product) => product.isFeatured || !product.isDeal),
    [filteredProducts]
  );

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
      label: "ShopApp Plus Zone",
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
        showComingSoon("Gift Cards", "Gift cards are being prepared for ShopApp."),
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
      label: "Advertise on ShopApp",
      icon: "megaphone-outline",
      onPress: () =>
        showComingSoon("Advertise on ShopApp", "Seller promotion tools are coming soon."),
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={isDesktopWeb ? [0, 1] : undefined}
        scrollEventThrottle={16}
        onScrollBeginDrag={closeOpenMenu}
        onScroll={(event) => {
          if (!isDesktopWeb) {
            return;
          }

          const nextCompact = event.nativeEvent.contentOffset.y > 36;
          setDesktopCategoryCompact((current) => (current === nextCompact ? current : nextCompact));
        }}
      >
        {isDesktopWeb ? (
          <>
            <View
              style={{
                backgroundColor: colors.white,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
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
                      backgroundColor: "#FFD84D",
                      borderRadius: radius.lg,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                    }}
                  >
                    <Ionicons name="bag-handle" size={22} color={colors.primaryDark} />
                    <Text style={{ color: colors.primaryDark, fontWeight: "900", fontSize: 22 }}>
                      ShopApp
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.primaryDark} />
                  </Pressable>

                  <View
                    style={{
                      flex: 1,
                      minHeight: 56,
                      borderRadius: radius.lg,
                      borderWidth: 2,
                      borderColor: "rgba(0,102,204,0.35)",
                      backgroundColor: colors.white,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: spacing.lg,
                    }}
                  >
                    <Ionicons name="search-outline" size={24} color={colors.muted} />
                    <TextInput
                      value={searchText}
                      onChangeText={setSearchText}
                      onSubmitEditing={openSearchResults}
                      placeholder="Search for Products, Brands and More"
                      placeholderTextColor={colors.muted}
                      style={{
                        flex: 1,
                        minHeight: 50,
                        marginLeft: spacing.md,
                        color: colors.text,
                        fontSize: 16,
                      }}
                    />
                    {searchText ? (
                      <Pressable onPress={() => setSearchText("")} style={{ marginRight: spacing.sm }}>
                        <Ionicons name="close-circle" size={20} color={colors.muted} />
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={openSearchResults}
                      style={{
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.sm,
                        borderRadius: radius.md,
                        backgroundColor: colors.primaryLight,
                      }}
                    >
                      <Text style={{ color: colors.primary, fontWeight: "800" }}>Search</Text>
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
                          backgroundColor: openMenu === "login" ? colors.primaryLight : "transparent",
                        }}
                      >
                        <Ionicons name="person-circle-outline" size={25} color={colors.text} />
                        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
                          {user ? profile?.name?.split(" ")[0] || "Account" : "Login"}
                        </Text>
                        <Ionicons
                          name={openMenu === "login" ? "chevron-up" : "chevron-down"}
                          size={14}
                          color={colors.text}
                        />
                      </Pressable>

                      {openMenu === "login" ? (
                        <Pressable
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            width: 320,
                            backgroundColor: colors.white,
                            borderRadius: radius.xl,
                            borderWidth: 1,
                            borderColor: "#E2E8F0",
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
                              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>
                                {user ? `Hello, ${profile?.name?.split(" ")[0] || "ShopApp User"}` : "New customer?"}
                              </Text>
                              <Text style={{ color: colors.muted, marginTop: 4 }}>
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

                          <View style={{ height: 1, backgroundColor: "#E2E8F0" }} />

                          {loginMenuItems.map((item) => (
                            <HeaderDropdownItem key={item.id} item={item} onPress={item.onPress} />
                          ))}

                          {!user ? (
                            <>
                              <View style={{ height: 1, backgroundColor: "#E2E8F0" }} />
                              <Pressable
                                onPress={goToLogin}
                                style={{
                                  paddingHorizontal: spacing.lg,
                                  paddingVertical: spacing.md + 2,
                                  backgroundColor: colors.primaryLight,
                                }}
                              >
                                <Text style={{ color: colors.primary, fontWeight: "800", textAlign: "center" }}>
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
                          backgroundColor: openMenu === "more" ? colors.primaryLight : "transparent",
                        }}
                      >
                        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
                          More
                        </Text>
                        <Ionicons
                          name={openMenu === "more" ? "chevron-up" : "chevron-down"}
                          size={14}
                          color={colors.text}
                        />
                      </Pressable>

                      {openMenu === "more" ? (
                        <Pressable
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 0,
                            width: 280,
                            backgroundColor: colors.white,
                            borderRadius: radius.xl,
                            borderWidth: 1,
                            borderColor: "#E2E8F0",
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
                              color: colors.text,
                              fontSize: 16,
                              fontWeight: "900",
                              paddingHorizontal: spacing.lg,
                              paddingVertical: spacing.lg,
                            }}
                          >
                            More
                          </Text>
                          <View style={{ height: 1, backgroundColor: "#E2E8F0" }} />
                          {moreMenuItems.map((item) => (
                            <HeaderDropdownItem key={item.id} item={item} onPress={item.onPress} />
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
                        <Ionicons name="cart-outline" size={26} color={colors.text} />
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
                      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>Cart</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            <View
              style={{
                backgroundColor: colors.white,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
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
          <View
            style={{
              backgroundColor: colors.primary,
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
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.white, fontSize: 28, fontWeight: "900" }}>
                ShopApp
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

            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Pressable
                onPress={() => router.push("/notifications")}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: "rgba(255,255,255,0.14)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.white} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/cart")}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: "rgba(255,255,255,0.14)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="cart-outline" size={20} color={colors.white} />
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
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: "rgba(255,255,255,0.14)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="person-outline" size={20} color={colors.white} />
              </Pressable>
            </View>
          </View>

          <View
            style={{
              marginTop: spacing.lg,
              backgroundColor: colors.white,
              borderRadius: radius.pill,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <Ionicons name="search-outline" size={18} color={colors.muted} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search products, brands, categories..."
              placeholderTextColor={colors.muted}
              style={{ flex: 1, marginHorizontal: spacing.sm, color: colors.text, minHeight: 40 }}
            />
            {searchText ? (
              <Pressable onPress={() => setSearchText("")} style={{ marginRight: spacing.sm }}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
            <Pressable onPress={openSearchResults}>
              <Ionicons name="options-outline" size={18} color={colors.primary} />
            </Pressable>
          </View>
          </View>
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
                backgroundColor: colors.primaryLight,
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
                    backgroundColor: colors.white,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="storefront-outline" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.primaryDark, fontSize: 18, fontWeight: "900" }}>
                    Seller Dashboard
                  </Text>
                  <Text style={{ color: colors.primaryDark, marginTop: 4 }}>
                    Manage products, inventory and orders.
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
            </Pressable>
          ) : null}

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled={!isDesktopWeb}
            snapToInterval={isDesktopWeb ? bannerStep : undefined}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: isDesktopWeb ? spacing.md : 0 }}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / bannerStep);
              setBannerIndex(index);
            }}
          >
            {homeBanners.map((banner, index) => (
              <Pressable
                key={banner.id}
                onPress={() => router.push(index === 0 ? "/deals" : "/search")}
                style={{
                  width: bannerWidth,
                  height: isDesktopWeb ? 210 : 180,
                  borderRadius: radius.xl,
                  marginRight: spacing.md,
                  overflow: "hidden",
                }}
              >
                <ImageBackground source={{ uri: banner.image }} style={{ flex: 1 }}>
                  <LinearGradient colors={bannerGradients[index]} style={{ flex: 1, padding: spacing.xl, justifyContent: "flex-end" }}>
                    <Text style={{ color: colors.white, fontSize: 24, fontWeight: "900" }}>
                      {banner.title}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.82)", marginTop: spacing.sm, maxWidth: "80%" }}>
                      {banner.subtitle}
                    </Text>
                    <View
                      style={{
                        marginTop: spacing.lg,
                        alignSelf: "flex-start",
                        backgroundColor: colors.white,
                        borderRadius: radius.pill,
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.sm,
                      }}
                    >
                      <Text style={{ color: colors.primaryDark, fontWeight: "800" }}>
                        {banner.cta} →
                      </Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.md, marginBottom: spacing.xl, gap: spacing.sm }}>
            {homeBanners.map((banner, index) => (
              <View
                key={banner.id}
                style={{
                  width: bannerIndex === index ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: bannerIndex === index ? colors.primary : "#CBD5E1",
                }}
              />
            ))}
          </View>

          {!isDesktopWeb ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.sm }}>
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
                    onPress={() => setActiveCategory(category.name)}
                  />
                ))}
            </ScrollView>
          ) : null}

          <View
            style={{
              marginTop: spacing.xl,
              marginBottom: spacing.md,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>
              🔥 Deal of the Day
            </Text>
            <Pressable onPress={() => router.push("/deals")}>
              <Text style={{ color: colors.primary, fontWeight: "800" }}>See All →</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dealProducts.map((product) => (
              <DealCard
                key={product.id}
                product={product}
                onPress={() => router.push(`/product/${product.id}`)}
              />
            ))}
          </ScrollView>

          <View
            style={{
              marginTop: spacing.xl,
              marginBottom: spacing.md,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>
              ⭐ Featured Products
            </Text>
            <Pressable onPress={() => router.push({ pathname: "/search", params: { q: searchText, category: activeCategory } })}>
              <Text style={{ color: colors.primary, fontWeight: "800" }}>See All →</Text>
            </Pressable>
          </View>

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
                  onPress={() => router.push(`/product/${product.id}`)}
                  onAddToCart={() => handleAddToCart(product)}
                />
              ))}
            </View>
          )}

          {featuredProducts.length === 0 && !loading ? (
            <View
              style={{
                backgroundColor: colors.white,
                padding: spacing.xl,
                borderRadius: radius.lg,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
                No products match that search yet.
              </Text>
              <Text style={{ color: colors.muted, marginTop: spacing.sm, textAlign: "center" }}>
                Try a different keyword or category to find more products.
              </Text>
            </View>
          ) : null}

          <DesktopSiteFooter />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
