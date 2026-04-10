import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { signOut } from "firebase/auth";

import DesktopSiteFooter from "../../components/DesktopSiteFooter";
import EmptyState from "../../components/EmptyState";
import FormField from "../../components/FormField";
import { colors, radius, shadows, spacing } from "../../constants/theme";
import { auth } from "../../firebaseConfig";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import {
  fetchBuyerOrders,
  fetchCoupons,
  fetchProducts,
  fetchReviewsByUser,
  fetchWishlistIds,
  saveUserProfile,
  submitWalletTopUpRequest,
  subscribeToUserWalletTopUpRequests,
  subscribeToWalletTransactions,
} from "../../lib/firebaseApi";
import {
  buildUpiPaymentUri,
  buildUpiQrCodeUrl,
  merchantUpiId,
  merchantUpiName,
} from "../../lib/payment";
import { showToast } from "../../lib/toast";
import { formatCurrency, formatDate, getInitials } from "../../lib/utils";
import { Coupon, Product, Review, WalletTopUpRequest, WalletTransaction } from "../../types";

type InlineSection =
  | "profile-information"
  | "manage-addresses"
  | "pan-card-information"
  | "wallet"
  | "saved-upi"
  | "saved-cards"
  | "my-coupons"
  | "my-reviews-ratings";

interface NavItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  section?: InlineSection;
  route?: string;
  action?: () => void;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const panelStyle = {
  backgroundColor: colors.white,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
} as const;

const splitFullName = (name?: string) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const parseListInput = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const serializeList = (value?: string[]) => (value || []).join("\n");

const StatTile = ({
  label,
  value,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={[
      panelStyle,
      {
        flex: 1,
        minWidth: 110,
        padding: spacing.md,
      },
    ]}
  >
    <View
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={18} color={colors.primary} />
    </View>
    <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900", marginTop: spacing.md }}>
      {value}
    </Text>
    <Text style={{ color: colors.muted, marginTop: 2 }}>{label}</Text>
  </Pressable>
);

const SidebarItem = ({
  item,
  active,
  onPress,
}: {
  item: NavItem;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: active ? colors.primaryLight : "transparent",
      marginBottom: 2,
    }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flex: 1 }}>
      <Ionicons
        name={item.icon}
        size={18}
        color={active ? colors.primary : colors.muted}
      />
      <Text
        style={{
          flex: 1,
          color: active ? colors.primaryDark : colors.text,
          fontWeight: active ? "800" : "600",
        }}
      >
        {item.label}
      </Text>
    </View>
    {item.badge ? (
      <View
        style={{
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radius.pill,
          backgroundColor: active ? colors.white : colors.bg,
        }}
      >
        <Text style={{ color: active ? colors.primary : colors.text, fontSize: 12, fontWeight: "800" }}>
          {item.badge}
        </Text>
      </View>
    ) : (
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    )}
  </Pressable>
);

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <View style={{ marginBottom: spacing.lg }}>
    <Text style={{ color: colors.text, fontSize: 24, fontWeight: "900" }}>{title}</Text>
    <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 20 }}>{subtitle}</Text>
  </View>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { unreadCount: unreadNotificationCount } = useNotifications(user?.uid);
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 1100;

  const [activeSection, setActiveSection] = useState<InlineSection>("profile-information");
  const [searchText, setSearchText] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [walletTopUps, setWalletTopUps] = useState<WalletTopUpRequest[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [address, setAddress] = useState("");
  const [panCardName, setPanCardName] = useState("");
  const [panCardNumber, setPanCardNumber] = useState("");
  const [savedUpiInput, setSavedUpiInput] = useState("");
  const [savedCardsInput, setSavedCardsInput] = useState("");
  const [walletTopUpAmount, setWalletTopUpAmount] = useState("");
  const [walletUtr, setWalletUtr] = useState("");
  const [walletSubmitting, setWalletSubmitting] = useState(false);
  const [walletQrLoadFailed, setWalletQrLoadFailed] = useState(false);
  const [walletReference] = useState(() => `WALLET-${Date.now()}`);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const { firstName: nextFirstName, lastName: nextLastName } = splitFullName(profile.name);
    setFirstName(nextFirstName);
    setLastName(nextLastName);
    setMobile(profile.phone || "");
    setGender(profile.gender || "male");
    setAddress(profile.address || "");
    setPanCardName(profile.panCardName || "");
    setPanCardNumber(profile.panCardNumber || "");
    setSavedUpiInput(
      serializeList(
        profile.savedUpiIds && profile.savedUpiIds.length > 0
          ? profile.savedUpiIds
          : profile.upiId
            ? [profile.upiId]
            : []
      )
    );
    setSavedCardsInput(serializeList(profile.savedCards));
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        return;
      }

      let active = true;

      Promise.all([
        fetchBuyerOrders(user.uid),
        fetchWishlistIds(user.uid),
        fetchCoupons(),
        fetchReviewsByUser(user.uid),
        fetchProducts(),
      ]).then(([orders, wishlistIds, couponItems, reviews, catalog]) => {
        if (!active) {
          return;
        }

        setOrderCount(orders.length);
        setWishlistCount(wishlistIds.length);
        setCoupons(couponItems);
        setUserReviews(reviews);
        setProducts(catalog);
      });

      return () => {
        active = false;
      };
    }, [user])
  );

  useEffect(() => {
    if (!user) {
      setWalletTopUps([]);
      setWalletTransactions([]);
      return;
    }

    const unsubscribeTopUps = subscribeToUserWalletTopUpRequests(user.uid, setWalletTopUps);
    const unsubscribeTransactions = subscribeToWalletTransactions(user.uid, setWalletTransactions);

    return () => {
      unsubscribeTopUps();
      unsubscribeTransactions();
    };
  }, [user]);

  const walletBalance = profile?.walletBalance ?? 0;
  const pendingWalletTopUps = useMemo(
    () => walletTopUps.filter((item) => item.status === "pending"),
    [walletTopUps]
  );
  const approvedWalletTopUps = useMemo(
    () => walletTopUps.filter((item) => item.status === "approved"),
    [walletTopUps]
  );
  const walletTopUpAmountValue = Number(walletTopUpAmount);
  const validWalletTopUpAmount =
    Number.isFinite(walletTopUpAmountValue) && walletTopUpAmountValue > 0
      ? walletTopUpAmountValue
      : 0;
  const walletUpiUri = useMemo(
    () =>
      validWalletTopUpAmount > 0
        ? buildUpiPaymentUri(
            validWalletTopUpAmount,
            `Wallet top up for ${profile?.name || "SACHINDIA user"}`,
            walletReference
          )
        : "",
    [profile?.name, validWalletTopUpAmount, walletReference]
  );
  const walletQrCodeUrl = useMemo(
    () => (walletUpiUri ? buildUpiQrCodeUrl(walletUpiUri) : ""),
    [walletUpiUri]
  );
  const productNameMap = useMemo(
    () =>
      products.reduce<Record<string, string>>((accumulator, item) => {
        accumulator[item.id] = item.name;
        return accumulator;
      }, {}),
    [products]
  );

  useEffect(() => {
    setWalletQrLoadFailed(false);
  }, [walletQrCodeUrl]);

  const handleSignOut = async () => {
    await signOut(auth);
    showToast("success", "Signed out", "See you again soon.");
    router.replace("/(auth)/login");
  };

  const handleOpenWalletUpi = async () => {
    if (validWalletTopUpAmount <= 0 || !walletUpiUri) {
      showToast("error", "Enter top-up amount", "Add an amount before opening UPI.");
      return;
    }

    if (Platform.OS === "web") {
      showToast(
        "info",
        "Use any UPI app",
        `Pay ${formatCurrency(validWalletTopUpAmount)} to ${merchantUpiId}.`
      );
      return;
    }

    try {
      await Linking.openURL(walletUpiUri);
    } catch {
      showToast(
        "info",
        "Use any UPI app",
        `Pay ${formatCurrency(validWalletTopUpAmount)} to ${merchantUpiId}.`
      );
    }
  };

  const handleSubmitWalletTopUp = async () => {
    if (!user || !profile) {
      return;
    }

    if (validWalletTopUpAmount <= 0) {
      showToast("error", "Enter top-up amount", "Please enter how much you sent by UPI.");
      return;
    }

    if (walletUtr.trim().length < 8) {
      showToast("error", "Enter valid UTR", "Please add the bank UTR after payment.");
      return;
    }

    try {
      setWalletSubmitting(true);
      const walletRequesterName =
        profile.name?.trim() || user.displayName?.trim() || "ShopApp User";
      const walletRequesterEmail =
        profile.email?.trim() || user.email?.trim() || "";

      await submitWalletTopUpRequest({
        userId: user.uid,
        userName: walletRequesterName,
        userEmail: walletRequesterEmail,
        amount: validWalletTopUpAmount,
        utr: walletUtr,
        upiId: merchantUpiId,
      });
      setWalletUtr("");
      setWalletTopUpAmount("");
      showToast(
        "success",
        "Top-up submitted",
        "Your request is waiting for admin confirmation."
      );
    } catch (error) {
      console.error("[wallet-top-up] submit failed", error);

      const isPermissionDenied =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "permission-denied";
      const message =
        error instanceof Error && error.message === "duplicate-utr"
          ? "This UTR was already submitted. Please check the number and try again."
          : isPermissionDenied
            ? "Firestore rules are blocking wallet top-ups. Deploy the updated firestore.rules to ecommerce-baf11 and try again."
          : error instanceof Error && error.message === "invalid-utr"
            ? "Please add the bank UTR after payment."
            : error instanceof Error && error.message === "invalid-amount"
              ? "Please enter a valid top-up amount."
              : error instanceof Error && error.message === "invalid-upi-id"
                ? "Wallet payment details are incomplete right now. Please contact support."
          : "Please try again after confirming your payment details.";
      showToast("error", "Wallet request failed", message);
    } finally {
      setWalletSubmitting(false);
    }
  };

  const handleNavigation = (item: NavItem) => {
    if (item.section) {
      setActiveSection(item.section);
      return;
    }

    if (item.route) {
      router.push(item.route as never);
      return;
    }

    item.action?.();
  };

  const saveSection = async (key: string, payload: Record<string, unknown>, successMessage: string) => {
    if (!user) {
      return;
    }

    setSavingKey(key);
    try {
      await saveUserProfile(user.uid, payload);
      showToast("success", successMessage);
    } finally {
      setSavingKey(null);
    }
  };

  if (!user || !profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, padding: spacing.lg, justifyContent: "center" }}>
          <EmptyState
            icon="person-circle-outline"
            title="Sign in to unlock your account"
            subtitle="Access saved orders, wishlist, addresses and personalized offers."
            buttonLabel="Login or Register"
            onPress={() => router.push("/(auth)/login")}
          />
        </View>
      </SafeAreaView>
    );
  }

  const navigationGroups: NavGroup[] = [
    {
      title: "MY ORDERS",
      items: [
        {
          id: "my-orders",
          label: "My Orders",
          icon: "cube-outline" as const,
          route: "/orders",
          badge: orderCount ? `${orderCount}` : "0",
        },
      ],
    },
    {
      title: "ACCOUNT SETTINGS",
      items: [
        {
          id: "profile-information",
          label: "Profile Information",
          icon: "person-outline" as const,
          section: "profile-information" as const,
        },
        {
          id: "manage-addresses",
          label: "Manage Addresses",
          icon: "location-outline" as const,
          section: "manage-addresses" as const,
        },
        {
          id: "pan-card-information",
          label: "PAN Card Information",
          icon: "card-outline" as const,
          section: "pan-card-information" as const,
        },
      ],
    },
    {
      title: "PAYMENTS",
      items: [
        {
          id: "wallet",
          label: "Wallet",
          icon: "wallet-outline" as const,
          section: "wallet" as const,
          badge: formatCurrency(walletBalance),
        },
        {
          id: "saved-upi",
          label: "Saved UPI",
          icon: "phone-portrait-outline" as const,
          section: "saved-upi" as const,
        },
        {
          id: "saved-cards",
          label: "Saved Cards",
          icon: "albums-outline" as const,
          section: "saved-cards" as const,
        },
      ],
    },
    {
      title: "MY STUFF",
      items: [
        {
          id: "my-coupons",
          label: "My Coupons",
          icon: "pricetags-outline" as const,
          section: "my-coupons" as const,
          badge: `${coupons.length}`,
        },
        {
          id: "my-reviews-ratings",
          label: "My Reviews & Ratings",
          icon: "star-outline" as const,
          section: "my-reviews-ratings" as const,
          badge: `${userReviews.length}`,
        },
        {
          id: "all-notifications",
          label: "All Notifications",
          icon: "notifications-outline" as const,
          route: "/notifications",
          badge: `${unreadNotificationCount}`,
        },
        {
          id: "my-wishlist",
          label: "My Wishlist",
          icon: "heart-outline" as const,
          route: "/wishlist",
          badge: `${wishlistCount}`,
        },
        {
          id: "logout",
          label: "Logout",
          icon: "log-out-outline" as const,
          action: handleSignOut,
        },
      ],
    },
  ];

  const inlineSectionChips: NavItem[] = navigationGroups
    .flatMap((group) => group.items)
    .filter((item): item is NavItem => Boolean(item.section));
  const renderContent = () => {
    if (activeSection === "profile-information") {
      return (
        <View style={{ gap: spacing.lg }}>
          <SectionHeader
            title="Profile Information"
            subtitle="Keep your personal details updated so orders, support, and checkout work smoothly."
          />

          <View style={{ flexDirection: isDesktopWeb ? "row" : "column", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <FormField
                label="First Name"
                icon="person-outline"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label="Last Name"
                icon="person-outline"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
              />
            </View>
          </View>

          <View>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: spacing.sm }}>
              Your Gender
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
              ].map((item) => {
                const active = gender === item.value;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setGender(item.value as "male" | "female" | "other")}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm + 2,
                      borderRadius: radius.pill,
                      backgroundColor: active ? colors.primary : colors.bg,
                    }}
                  >
                    <Text style={{ color: active ? colors.white : colors.text, fontWeight: "800" }}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <FormField
            label="Email Address"
            icon="mail-outline"
            value={profile.email}
            editable={false}
            placeholder="Email address"
          />
          <FormField
            label="Mobile Number"
            icon="call-outline"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            placeholder="Mobile number"
          />

          <View style={{ flexDirection: isDesktopWeb ? "row" : "column", gap: spacing.md }}>
            <StatTile label="Orders" value={`${orderCount}`} icon="cube-outline" onPress={() => router.push("/orders")} />
            <StatTile label="Wishlist" value={`${wishlistCount}`} icon="heart-outline" onPress={() => router.push("/wishlist")} />
            <StatTile label="Unread Alerts" value={`${unreadNotificationCount}`} icon="notifications-outline" onPress={() => router.push("/notifications")} />
          </View>

          <Pressable
            onPress={() =>
              saveSection(
                "profile-information",
                {
                  name: `${firstName} ${lastName}`.trim() || profile.name,
                  phone: mobile.trim(),
                  gender,
                },
                "Profile information saved"
              )
            }
            style={{
              backgroundColor: colors.primary,
              borderRadius: radius.md,
              alignItems: "center",
              paddingVertical: spacing.md + 2,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: "900" }}>
              {savingKey === "profile-information" ? "Saving..." : "Save Profile"}
            </Text>
          </Pressable>
        </View>
      );
    }

    if (activeSection === "manage-addresses") {
      return (
        <View style={{ gap: spacing.lg }}>
          <SectionHeader
            title="Manage Addresses"
            subtitle="Save your default address here and jump to the full address screen whenever you need more detail."
          />

          <View
            style={{
              backgroundColor: colors.primaryLight,
              borderRadius: radius.lg,
              padding: spacing.lg,
            }}
          >
            <Text style={{ color: colors.primaryDark, fontWeight: "900" }}>Default Delivery Address</Text>
            <Text style={{ color: colors.primaryDark, marginTop: spacing.sm, lineHeight: 22 }}>
              {address || "No delivery address saved yet. Add your home or work address to speed up checkout."}
            </Text>
          </View>

          <FormField
            label="Saved Address"
            icon="home-outline"
            value={address}
            onChangeText={setAddress}
            placeholder="Street, city, state, pincode"
            multiline
            inputStyle={{ minHeight: 120, textAlignVertical: "top" }}
          />

          <View style={{ flexDirection: isDesktopWeb ? "row" : "column", gap: spacing.md }}>
            <Pressable
              onPress={() =>
                saveSection("manage-addresses", { address: address.trim() }, "Address saved")
              }
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: radius.md,
                alignItems: "center",
                paddingVertical: spacing.md + 2,
              }}
            >
              <Text style={{ color: colors.white, fontWeight: "900" }}>
                {savingKey === "manage-addresses" ? "Saving..." : "Save Address"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/addresses")}
              style={{
                flex: 1,
                backgroundColor: colors.white,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                paddingVertical: spacing.md + 2,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "800" }}>Open Full Address Book</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (activeSection === "pan-card-information") {
      const linked = panCardNumber.trim().length >= 10;

      return (
        <View style={{ gap: spacing.lg }}>
          <SectionHeader
            title="PAN Card Information"
            subtitle="Keep your PAN details saved for tax-compliant invoices and smoother account verification."
          />

          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: spacing.md,
              paddingVertical: 6,
              borderRadius: radius.pill,
              backgroundColor: linked ? "#DCFCE7" : "#FEF3C7",
            }}
          >
            <Text style={{ color: linked ? colors.success : "#B45309", fontWeight: "800" }}>
              {linked ? "PAN linked" : "PAN not linked"}
            </Text>
          </View>

          <FormField
            label="PAN Card Holder Name"
            icon="person-circle-outline"
            value={panCardName}
            onChangeText={setPanCardName}
            placeholder="Name as on PAN card"
          />
          <FormField
            label="PAN Number"
            icon="card-outline"
            value={panCardNumber}
            onChangeText={(value: string) => setPanCardNumber(value.toUpperCase())}
            autoCapitalize="characters"
            placeholder="ABCDE1234F"
          />

          <Pressable
            onPress={() =>
              saveSection(
                "pan-card-information",
                {
                  panCardName: panCardName.trim(),
                  panCardNumber: panCardNumber.trim().toUpperCase(),
                },
                "PAN information saved"
              )
            }
            style={{
              backgroundColor: colors.primary,
              borderRadius: radius.md,
              alignItems: "center",
              paddingVertical: spacing.md + 2,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: "900" }}>
              {savingKey === "pan-card-information" ? "Saving..." : "Save PAN Details"}
            </Text>
          </Pressable>
        </View>
      );
    }

    if (activeSection === "wallet") {
      return (
        <View style={{ gap: spacing.lg }}>
          <SectionHeader
            title="Wallet"
            subtitle="Add funds by UPI, submit the UTR, and spend your approved wallet balance during checkout."
          />

          <View
            style={{
              borderRadius: radius.xl,
              padding: spacing.xl,
              backgroundColor: colors.primary,
              ...shadows.card,
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.82)", fontWeight: "700" }}>
              Available Wallet Balance
            </Text>
            <Text style={{ color: colors.white, fontSize: 38, fontWeight: "900", marginTop: spacing.sm }}>
              {formatCurrency(walletBalance)}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.82)", marginTop: spacing.sm, lineHeight: 20 }}>
              Send money to {merchantUpiId}, submit the UTR below, and the admin dashboard will
              approve the wallet credit.
            </Text>
          </View>

          <View style={{ flexDirection: isDesktopWeb ? "row" : "column", gap: spacing.md }}>
            <StatTile
              label="Pending Top-ups"
              value={`${pendingWalletTopUps.length}`}
              icon="time-outline"
            />
            <StatTile
              label="Approved Top-ups"
              value={`${approvedWalletTopUps.length}`}
              icon="checkmark-circle-outline"
            />
            <StatTile
              label="Wallet Entries"
              value={`${walletTransactions.length}`}
              icon="swap-horizontal-outline"
            />
          </View>

          <View
            style={{
              ...panelStyle,
              padding: spacing.lg,
              backgroundColor: "#FFF7ED",
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "900" }}>Top up by UPI</Text>
            <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 20 }}>
              Pay to {merchantUpiName} on {merchantUpiId}. After payment, paste the UTR so admin
              can confirm and credit your wallet.
            </Text>

            <View
              style={{
                marginTop: spacing.md,
                backgroundColor: colors.white,
                borderRadius: radius.md,
                padding: spacing.md,
                gap: spacing.sm,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: "800" }}>
                Payee: {merchantUpiName}
              </Text>
              <Text style={{ color: colors.muted }}>UPI ID: {merchantUpiId}</Text>
              <Text style={{ color: colors.muted }}>Reference: {walletReference}</Text>
            </View>
          </View>

          <FormField
            label="Top-up Amount"
            icon="wallet-outline"
            value={walletTopUpAmount}
            onChangeText={setWalletTopUpAmount}
            keyboardType="number-pad"
            placeholder="Enter amount to add"
          />

          {validWalletTopUpAmount > 0 ? (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.lg,
                padding: spacing.lg,
                backgroundColor: colors.bg,
              }}
            >
              {!walletQrLoadFailed && walletQrCodeUrl ? (
                <Image
                  source={{ uri: walletQrCodeUrl }}
                  resizeMode="contain"
                  style={{ width: 220, height: 220, borderRadius: radius.md }}
                  onError={() => setWalletQrLoadFailed(true)}
                />
              ) : (
                <View
                  style={{
                    width: 220,
                    minHeight: 220,
                    borderRadius: radius.md,
                    backgroundColor: colors.white,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: spacing.lg,
                  }}
                >
                  <Ionicons name="warning-outline" size={28} color={colors.accent} />
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "800",
                      textAlign: "center",
                      marginTop: spacing.sm,
                    }}
                  >
                    QR preview could not be loaded.
                  </Text>
                  <Text
                    style={{
                      color: colors.muted,
                      textAlign: "center",
                      lineHeight: 20,
                      marginTop: spacing.sm,
                    }}
                  >
                    You can still pay manually to {merchantUpiId}.
                  </Text>
                </View>
              )}
              <Text style={{ color: colors.primaryDark, fontWeight: "900", marginTop: spacing.md }}>
                Pay {formatCurrency(validWalletTopUpAmount)}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleOpenWalletUpi}
            style={{
              backgroundColor: colors.white,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.primary,
              alignItems: "center",
              paddingVertical: spacing.md + 2,
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: "900" }}>
              {Platform.OS === "web" ? "Pay with Any UPI App" : "Open UPI App"}
            </Text>
          </Pressable>

          <FormField
            label="UTR Number"
            icon="document-text-outline"
            value={walletUtr}
            onChangeText={(value) => setWalletUtr(value.toUpperCase())}
            autoCapitalize="characters"
            placeholder="Enter UTR after payment"
          />

          <Pressable
            onPress={handleSubmitWalletTopUp}
            disabled={walletSubmitting}
            style={{
              backgroundColor: walletSubmitting ? colors.primaryDark : colors.primary,
              borderRadius: radius.md,
              alignItems: "center",
              paddingVertical: spacing.md + 2,
            }}
          >
            {walletSubmitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={{ color: colors.white, fontWeight: "900" }}>Submit Wallet Request</Text>
            )}
          </Pressable>

          <View style={{ gap: spacing.md }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
              Recent Top-up Requests
            </Text>
            {walletTopUps.length === 0 ? (
              <Text style={{ color: colors.muted }}>
                No wallet requests submitted yet.
              </Text>
            ) : (
              walletTopUps.slice(0, 5).map((item) => {
                const tone =
                  item.status === "approved"
                    ? colors.success
                    : item.status === "rejected"
                      ? colors.danger
                      : colors.accent;
                return (
                  <View
                    key={item.id}
                    style={{
                      ...panelStyle,
                      padding: spacing.lg,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: spacing.md,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: "900" }}>
                          {formatCurrency(item.amount)}
                        </Text>
                        <Text style={{ color: colors.muted, marginTop: spacing.xs }}>
                          UTR: {item.utr}
                        </Text>
                        <Text style={{ color: colors.muted, marginTop: spacing.xs }}>
                          {formatDate(item.submittedAt, true)}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: 6,
                          borderRadius: radius.pill,
                          backgroundColor: `${tone}18`,
                        }}
                      >
                        <Text style={{ color: tone, fontWeight: "800", textTransform: "capitalize" }}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={{ gap: spacing.md }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
              Wallet Activity
            </Text>
            {walletTransactions.length === 0 ? (
              <Text style={{ color: colors.muted }}>
                Approved credits and wallet payments will appear here.
              </Text>
            ) : (
              walletTransactions.slice(0, 6).map((item) => {
                const tone = item.type === "credit" ? colors.success : colors.primary;
                const prefix = item.type === "credit" ? "+" : "-";

                return (
                  <View
                    key={item.id}
                    style={{
                      ...panelStyle,
                      padding: spacing.lg,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: spacing.md,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: "900" }}>
                          {item.description}
                        </Text>
                        <Text style={{ color: colors.muted, marginTop: spacing.xs }}>
                          {formatDate(item.createdAt, true)}
                        </Text>
                        <Text style={{ color: colors.muted, marginTop: spacing.xs }}>
                          Balance after: {formatCurrency(item.balanceAfter)}
                        </Text>
                      </View>
                      <Text style={{ color: tone, fontWeight: "900", fontSize: 18 }}>
                        {prefix}{formatCurrency(item.amount)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      );
    }

    if (activeSection === "saved-upi") {
      const upiItems = parseListInput(savedUpiInput);

      return (
        <View style={{ gap: spacing.lg }}>
          <SectionHeader
            title="Saved UPI"
            subtitle="Store your frequently used UPI IDs to make checkout feel faster and more consistent."
          />

          <FormField
            label="Saved UPI IDs"
            icon="phone-portrait-outline"
            value={savedUpiInput}
            onChangeText={setSavedUpiInput}
            placeholder={"name@bank\nshop@upi"}
            multiline
            inputStyle={{ minHeight: 120, textAlignVertical: "top" }}
          />

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {upiItems.length > 0 ? (
              upiItems.map((item) => (
                <View
                  key={item}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.pill,
                    backgroundColor: colors.primaryLight,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: "800" }}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: colors.muted }}>No UPI IDs saved yet.</Text>
            )}
          </View>

          <Pressable
            onPress={() =>
              saveSection(
                "saved-upi",
                {
                  upiId: upiItems[0] || "",
                  savedUpiIds: upiItems,
                },
                "Saved UPI updated"
              )
            }
            style={{
              backgroundColor: colors.primary,
              borderRadius: radius.md,
              alignItems: "center",
              paddingVertical: spacing.md + 2,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: "900" }}>
              {savingKey === "saved-upi" ? "Saving..." : "Save UPI IDs"}
            </Text>
          </Pressable>
        </View>
      );
    }

    if (activeSection === "saved-cards") {
      const cards = parseListInput(savedCardsInput);

      return (
        <View style={{ gap: spacing.lg }}>
          <SectionHeader
            title="Saved Cards"
            subtitle="Keep masked card labels saved here so your account feels complete even before live card vaulting is added."
          />

          <FormField
            label="Saved Cards"
            icon="albums-outline"
            value={savedCardsInput}
            onChangeText={setSavedCardsInput}
            placeholder={"Visa ending 4242\nMastercard ending 8765"}
            multiline
            inputStyle={{ minHeight: 120, textAlignVertical: "top" }}
          />

          <View style={{ gap: spacing.md }}>
            {cards.length > 0 ? (
              cards.map((item, index) => (
                <View
                  key={`${item}-${index}`}
                  style={{
                    borderRadius: radius.lg,
                    padding: spacing.lg,
                    backgroundColor: index % 2 === 0 ? colors.primaryDark : colors.text,
                  }}
                >
                  <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: "700" }}>
                    Saved card
                  </Text>
                  <Text style={{ color: colors.white, fontSize: 18, fontWeight: "900", marginTop: spacing.sm }}>
                    {item}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: colors.muted }}>No cards saved yet.</Text>
            )}
          </View>

          <Pressable
            onPress={() =>
              saveSection("saved-cards", { savedCards: cards }, "Saved cards updated")
            }
            style={{
              backgroundColor: colors.primary,
              borderRadius: radius.md,
              alignItems: "center",
              paddingVertical: spacing.md + 2,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: "900" }}>
              {savingKey === "saved-cards" ? "Saving..." : "Save Card Labels"}
            </Text>
          </Pressable>
        </View>
      );
    }

    if (activeSection === "my-coupons") {
      return (
        <View style={{ gap: spacing.lg }}>
          <SectionHeader
            title="My Coupons"
            subtitle="These offers are ready to apply when your cart matches the coupon conditions."
          />

          {coupons.length === 0 ? (
            <Text style={{ color: colors.muted }}>No coupons are available right now.</Text>
          ) : (
            coupons.map((coupon) => (
              <View
                key={coupon.code}
                style={{
                  ...panelStyle,
                  padding: spacing.lg,
                  borderStyle: "dashed",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
                    {coupon.code}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 4,
                      borderRadius: radius.pill,
                      backgroundColor: colors.primaryLight,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: "800" }}>
                      {coupon.type === "percent" ? `${coupon.value}% OFF` : `${formatCurrency(coupon.value)} OFF`}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.muted, marginTop: spacing.sm }}>
                  {coupon.minAmount
                    ? `Valid on orders above ${formatCurrency(coupon.minAmount)}.`
                    : "Can be applied on eligible orders."}
                </Text>
                <Pressable
                  onPress={() =>
                    showToast("success", "Coupon ready", `${coupon.code} can be used at checkout.`)
                  }
                  style={{
                    marginTop: spacing.md,
                    alignSelf: "flex-start",
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.md,
                    backgroundColor: colors.bg,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "800" }}>Use at Checkout</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      );
    }

    return (
      <View style={{ gap: spacing.lg }}>
        <SectionHeader
          title="My Reviews & Ratings"
          subtitle="Reviews you submit after purchase will stay visible here for quick reference."
        />

        {userReviews.length === 0 ? (
          <EmptyState
            icon="star-outline"
            title="No reviews yet"
            subtitle="Buy a product, rate it, and your review history will appear here."
            buttonLabel="Open Orders"
            onPress={() => router.push("/orders")}
          />
        ) : (
          userReviews.map((review) => (
            <View
              key={review.id || `${review.productId}-${review.comment}`}
              style={{ ...panelStyle, padding: spacing.lg }}
            >
              <Text style={{ color: colors.text, fontWeight: "900", fontSize: 16 }}>
                {productNameMap[review.productId] || "Purchased Product"}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.sm }}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Ionicons
                    key={`${review.productId}-${value}`}
                    name={review.rating >= value ? "star" : "star-outline"}
                    size={16}
                    color={colors.star}
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>
              <Text style={{ color: colors.muted, marginTop: spacing.sm, lineHeight: 20 }}>
                {review.comment}
              </Text>
              <Text style={{ color: colors.muted, marginTop: spacing.md, fontSize: 12 }}>
                {formatDate(review.createdAt, true)}
              </Text>
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {isDesktopWeb ? (
          <View style={{ backgroundColor: colors.primary }}>
            <View
              style={{
                width: "100%",
                maxWidth: 1480,
                alignSelf: "center",
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.lg,
              }}
            >
              <Pressable
                onPress={() => router.push("/")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <Text style={{ color: colors.white, fontSize: 24, fontWeight: "900" }}>ShopApp</Text>
              </Pressable>

              <View
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: radius.md,
                  backgroundColor: colors.white,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: spacing.md,
                }}
              >
                <Ionicons name="search-outline" size={20} color={colors.muted} />
                <TextInput
                  value={searchText}
                  onChangeText={setSearchText}
                  onSubmitEditing={() =>
                    router.push({ pathname: "/search", params: { q: searchText } })
                  }
                  placeholder="Search for products, brands and more"
                  placeholderTextColor={colors.muted}
                  style={{ flex: 1, minHeight: 44, marginLeft: spacing.sm, color: colors.text }}
                />
              </View>

              <Pressable onPress={() => router.push("/wishlist")}>
                <Text style={{ color: colors.white, fontWeight: "700" }}>
                  {profile.name.split(" ")[0]}
                </Text>
              </Pressable>
              <Pressable onPress={() => router.push("/seller/register")}>
                <Text style={{ color: colors.white, fontWeight: "700" }}>Become a Seller</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/cart")}
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}
              >
                <Ionicons name="cart-outline" size={20} color={colors.white} />
                <Text style={{ color: colors.white, fontWeight: "700" }}>Cart</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View
          style={{
            width: "100%",
            maxWidth: isDesktopWeb ? 1480 : undefined,
            alignSelf: isDesktopWeb ? "center" : undefined,
            paddingHorizontal: isDesktopWeb ? spacing.xl : spacing.lg,
            paddingTop: spacing.lg,
          }}
        >
          <View
            style={
              isDesktopWeb
                ? {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: spacing.lg,
                  }
                : undefined
            }
          >
            <View style={isDesktopWeb ? { width: 300 } : undefined}>
              <View
                style={{
                  ...panelStyle,
                  padding: spacing.lg,
                  marginBottom: spacing.md,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: colors.white, fontSize: 22, fontWeight: "900" }}>
                      {getInitials(profile.name)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>Hello,</Text>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900", marginTop: 4 }}>
                      {profile.name}
                    </Text>
                    <Text style={{ color: colors.muted, marginTop: 4 }}>{profile.email}</Text>
                  </View>
                </View>
              </View>

              {!isDesktopWeb ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.md }}>
                  {inlineSectionChips.map((item) => {
                    const active = item.section === activeSection;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => handleNavigation(item)}
                        style={{
                          marginRight: spacing.sm,
                          paddingHorizontal: spacing.lg,
                          paddingVertical: spacing.sm + 2,
                          borderRadius: radius.pill,
                          backgroundColor: active ? colors.primary : colors.white,
                          borderWidth: 1,
                          borderColor: active ? colors.primary : colors.border,
                        }}
                      >
                        <Text style={{ color: active ? colors.white : colors.text, fontWeight: "800" }}>
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}

              {navigationGroups.map((group) => (
                <View
                  key={group.title}
                  style={{
                    ...panelStyle,
                    padding: spacing.md,
                    marginBottom: spacing.md,
                  }}
                >
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 12,
                      fontWeight: "900",
                      marginBottom: spacing.sm,
                    }}
                  >
                    {group.title}
                  </Text>
                  {group.items.map((item) => (
                    <SidebarItem
                      key={item.id}
                      item={item}
                      active={item.section ? activeSection === item.section : false}
                      onPress={() => handleNavigation(item)}
                    />
                  ))}
                </View>
              ))}
            </View>

            <View style={isDesktopWeb ? { flex: 1 } : undefined}>
              <View
                style={{
                  ...panelStyle,
                  padding: spacing.xl,
                }}
              >
                {renderContent()}
              </View>

              {!isDesktopWeb ? (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: spacing.md,
                    marginTop: spacing.lg,
                  }}
                >
                  <StatTile label="Orders" value={`${orderCount}`} icon="cube-outline" onPress={() => router.push("/orders")} />
                  <StatTile label="Wishlist" value={`${wishlistCount}`} icon="heart-outline" onPress={() => router.push("/wishlist")} />
                  <StatTile label="Alerts" value={`${unreadNotificationCount}`} icon="notifications-outline" onPress={() => router.push("/notifications")} />
                </View>
              ) : null}

              {isDesktopWeb ? <DesktopSiteFooter /> : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
