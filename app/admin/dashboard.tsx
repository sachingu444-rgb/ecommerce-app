import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { signOut } from "firebase/auth";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";

import FullScreenLoader from "../../components/FullScreenLoader";
import {
  defaultBuyerHomeSectionOrder,
  defaultBuyerPageContent,
  normalizeBuyerHomeSectionOrder,
} from "../../constants/buyerPageContent";
import { colors, orderStatusColors, radius, shadows, spacing } from "../../constants/theme";
import { auth } from "../../firebaseConfig";
import { useAuth } from "../../hooks/useAuth";
import {
  approveWalletTopUpRequest,
  rejectWalletTopUpRequest,
  saveBuyerPageContent,
  saveUserProfile,
  subscribeToAllOrders,
  subscribeToBuyerPageContent,
  subscribeToProducts,
  subscribeToUsers,
  subscribeToWalletTopUpRequests,
  updateOrderStatus,
  updateProduct,
} from "../../lib/firebaseApi";
import { showToast } from "../../lib/toast";
import { formatCurrency, formatDate, getInitials, toDateValue, truncateId } from "../../lib/utils";
import {
  BuyerPageContent,
  BuyerHomeSectionKey,
  Order,
  OrderStatus,
  Product,
  UserProfile,
  UserRole,
  WalletTopUpRequest,
  WalletTopUpStatus,
} from "../../types";

const startupLogo = require("../../assets/branding/sachindia-startup-logo.png");

type IconName = keyof typeof Ionicons.glyphMap;
type AdminView = "dashboard" | "editor" | "orders" | "wallet" | "sellers" | "catalog" | "users";
type OrderSortMode = "latest" | "oldest" | "amount";
type StatusFilter = "all" | OrderStatus;
type WalletStatusFilter = "all" | WalletTopUpStatus;
type ProductStatusFilter = "all" | "active" | "paused" | "deal" | "out";
type UserRoleFilter = "all" | UserRole;
type SellerStatusFilter = "all" | "pending" | "approved";
type EditorSection = "pageLabels" | "hero" | "promo" | "category" | "mediaShowcase" | "sections" | "lovedOnes";
type HideableEditorSection = BuyerHomeSectionKey;

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "shipped",
  shipped: "delivered",
};

const adminColors = {
  shell: "#D9DDE2",
  canvas: "#F7F8FA",
  line: "#EEF1F4",
  lineStrong: "#E1E6EC",
  ink: "#101827",
  muted: "#707784",
  softMuted: "#A1A8B3",
  teal: "#0B887B",
  tealSoft: "#E8F6F3",
  blueSoft: "#EEF5FF",
  orangeSoft: "#FFF5E8",
  redSoft: "#FFF0EA",
  greenSoft: "#EAF9F1",
  purpleSoft: "#F2EDFF",
};

const avatarColors = [
  "#0B887B",
  "#2563EB",
  "#F97316",
  "#7C3AED",
  "#DB2777",
  "#16A34A",
  "#374151",
];

const adminViews: {
  key: AdminView;
  label: string;
  title: string;
  subtitle: string;
  icon: IconName;
}[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    title: "Overview",
    subtitle: "Live control center for orders, wallets, sellers, products, and users.",
    icon: "grid-outline",
  },
  {
    key: "editor",
    label: "Store Editor",
    title: "Edit Online Store",
    subtitle: "Change buyer home page sections, page titles, images, and publish them live.",
    icon: "create-outline",
  },
  {
    key: "orders",
    label: "Invoice",
    title: "Invoice List",
    subtitle: "Manage order invoices, delivery progress, filters, and sorting.",
    icon: "receipt-outline",
  },
  {
    key: "wallet",
    label: "Wallet",
    title: "Wallet Queue",
    subtitle: "Approve or reject UTR top-up requests and track wallet balances.",
    icon: "wallet-outline",
  },
  {
    key: "sellers",
    label: "Sellers",
    title: "Seller Reviews",
    subtitle: "Approve sellers, pause stores, and check seller account health.",
    icon: "storefront-outline",
  },
  {
    key: "catalog",
    label: "Catalog",
    title: "Catalog Manager",
    subtitle: "Toggle product visibility, deal flags, featured products, and stock health.",
    icon: "cube-outline",
  },
  {
    key: "users",
    label: "Users",
    title: "User Accounts",
    subtitle: "Review buyers, sellers, admins, wallet balances, and account roles.",
    icon: "people-outline",
  },
];

const orderStatusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
];

const walletStatusFilters: { label: string; value: WalletStatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

const productStatusFilters: { label: string; value: ProductStatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Deals", value: "deal" },
  { label: "Out Stock", value: "out" },
];

const sellerStatusFilters: { label: string; value: SellerStatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
];

const roleFilters: { label: string; value: UserRoleFilter }[] = [
  { label: "All", value: "all" },
  { label: "Buyers", value: "buyer" },
  { label: "Sellers", value: "seller" },
  { label: "Admins", value: "admin" },
];

const queryMatches = (query: string, values: unknown[]) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return values
    .filter((value) => value !== undefined && value !== null)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

const getOrderTime = (order: Order) => toDateValue(order.createdAt)?.getTime() || 0;

const Panel = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View
    style={[
      {
        backgroundColor: colors.white,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: adminColors.line,
      },
      style,
    ]}
  >
    {children}
  </View>
);

const IconButton = ({
  icon,
  color = adminColors.ink,
  backgroundColor = colors.white,
  onPress,
  badge,
  disabled,
}: {
  icon: IconName;
  color?: string;
  backgroundColor?: string;
  onPress?: () => void;
  badge?: boolean;
  disabled?: boolean;
}) => (
  <Pressable
    accessibilityRole="button"
    disabled={disabled}
    onPress={onPress}
    style={{
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor,
      opacity: disabled ? 0.45 : 1,
    }}
  >
    <Ionicons name={icon} size={17} color={color} />
    {badge ? (
      <View
        style={{
          position: "absolute",
          right: 6,
          top: 5,
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: colors.danger,
          borderWidth: 1,
          borderColor: colors.white,
        }}
      />
    ) : null}
  </Pressable>
);

const ActionButton = ({
  label,
  icon,
  onPress,
  tone = adminColors.teal,
  ghost,
  disabled,
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  tone?: string;
  ghost?: boolean;
  disabled?: boolean;
}) => (
  <Pressable
    accessibilityRole="button"
    disabled={disabled}
    onPress={onPress}
    style={{
      minHeight: 36,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: spacing.sm,
      backgroundColor: ghost ? `${tone}12` : tone,
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {icon ? <Ionicons name={icon} size={15} color={ghost ? tone : colors.white} /> : null}
    <Text
      style={{
        color: ghost ? tone : colors.white,
        fontWeight: "900",
        fontSize: 12,
      }}
      numberOfLines={1}
    >
      {label}
    </Text>
  </Pressable>
);

const SearchField = ({
  value,
  onChangeText,
  compact,
  placeholder = "Search",
}: {
  value: string;
  onChangeText: (value: string) => void;
  compact?: boolean;
  placeholder?: string;
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: "#FAFBFC",
      borderWidth: 1,
      borderColor: adminColors.lineStrong,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      height: compact ? 38 : 42,
      minWidth: compact ? 220 : 300,
      flex: compact ? 0 : 1,
      maxWidth: compact ? undefined : 520,
    }}
  >
    <Ionicons name="search-outline" size={17} color={adminColors.muted} />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={adminColors.softMuted}
      style={{
        flex: 1,
        color: adminColors.ink,
        fontSize: 13,
        outlineStyle: "none" as never,
      }}
    />
  </View>
);

const EditorField = ({
  label,
  value,
  onChangeText,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) => (
  <View style={{ gap: 6 }}>
    <Text style={{ color: adminColors.ink, fontSize: 12, fontWeight: "900" }}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      placeholderTextColor={adminColors.softMuted}
      style={{
        minHeight: multiline ? 78 : 42,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: adminColors.lineStrong,
        backgroundColor: "#FAFBFC",
        color: adminColors.ink,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: 13,
        textAlignVertical: multiline ? "top" : "center",
        outlineStyle: "none" as never,
      }}
    />
  </View>
);

const StoreEditorPanel = ({
  draft,
  onChange,
  activeSection,
  onActiveSectionChange,
  isDesktop,
  isDirty,
  busyKey,
  onPublish,
  onReset,
  onClose,
}: {
  draft: BuyerPageContent;
  onChange: (content: BuyerPageContent) => void;
  activeSection: EditorSection;
  onActiveSectionChange: (section: EditorSection) => void;
  isDesktop: boolean;
  isDirty: boolean;
  busyKey: string | null;
  onPublish: () => void;
  onReset: () => void;
  onClose: () => void;
}) => {
  const defaultHero = defaultBuyerPageContent.home.heroes[0];
  const hero = draft.home.heroes[0];
  const previewHero = hero || defaultHero;
  const promoItems = draft.home.promoGrid;
  const categoryItems = draft.home.visualCategories;
  const isPublishing = busyKey === "publish-buyer-pages";
  const [selectedPromoIndex, setSelectedPromoIndex] = useState(0);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [selectedLovedIndex, setSelectedLovedIndex] = useState(0);
  const [selectedHeroIndex, setSelectedHeroIndex] = useState(0);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [editorShellWidth, setEditorShellWidth] = useState(0);
  const [leftPaneWidth, setLeftPaneWidth] = useState(248);
  const [inspectorWidth, setInspectorWidth] = useState(340);
  const [draggingSplitter, setDraggingSplitter] = useState<"left" | "right" | null>(null);
  const resizeStartRef = useRef({
    pageX: 0,
    leftPaneWidth: 248,
    inspectorWidth: 340,
  });
  const selectedPromo = promoItems[Math.min(selectedPromoIndex, Math.max(promoItems.length - 1, 0))];
  const selectedCategory = categoryItems[Math.min(selectedCategoryIndex, Math.max(categoryItems.length - 1, 0))];
  const mediaItems = draft.home.mediaShowcase.items;
  const selectedMedia = mediaItems[Math.min(selectedMediaIndex, Math.max(mediaItems.length - 1, 0))];
  const selectedAccent =
    activeSection === "hero"
      ? previewHero.accent
      : activeSection === "promo"
        ? "#2563EB"
        : activeSection === "category"
          ? "#F59E0B"
          : activeSection === "mediaShowcase"
            ? "#111827"
            : adminColors.teal;

  const updatePages = (key: keyof BuyerPageContent["pages"], value: string) => {
    onChange({
      ...draft,
      pages: {
        ...draft.pages,
        [key]: value,
      },
    });
  };

  const updateHome = (value: Partial<BuyerPageContent["home"]>) => {
    onChange({
      ...draft,
      home: {
        ...draft.home,
        ...value,
      },
    });
  };

  const selectedHero = draft.home.heroes[Math.min(selectedHeroIndex, Math.max(draft.home.heroes.length - 1, 0))];

  const updateHeroAt = (
    index: number,
    key: keyof BuyerPageContent["home"]["heroes"][number],
    value: string
  ) => {
    const heroes = [...draft.home.heroes];
    if (!heroes[index]) return;
    heroes[index] = {
      ...heroes[index],
      [key]: key === "durationHours" ? Number(value) || 24 : value,
    };
    updateHome({ heroes });
  };

  const updateHero = (
    key: keyof BuyerPageContent["home"]["heroes"][number],
    value: string
  ) => {
    if (draft.home.heroes.length === 0) {
      const source = { ...defaultHero, id: `hero-${Date.now()}` };
      updateHome({ heroes: [{ ...source, [key]: key === "durationHours" ? Number(value) || 24 : value }] });
      return;
    }
    updateHeroAt(selectedHeroIndex, key, value);
  };

  const addHero = () => {
    const heroes = [
      ...draft.home.heroes,
      { ...defaultHero, id: `hero-${Date.now()}`, title: "New hero slide", subtitle: "Add a compelling subtitle" },
    ];
    updateHome({ heroes });
    setSelectedHeroIndex(heroes.length - 1);
    onActiveSectionChange("hero");
  };

  const restoreHero = () => {
    updateHome({
      heroes: [
        {
          ...defaultHero,
          id: `hero-${Date.now()}`,
        },
      ],
    });
    setSelectedHeroIndex(0);
    onActiveSectionChange("hero");
  };

  const removeHero = () => {
    if (draft.home.heroes.length <= 1) {
      updateHome({ heroes: [] });
      onActiveSectionChange("promo");
      return;
    }
    const heroes = draft.home.heroes.filter((_, i) => i !== selectedHeroIndex);
    updateHome({ heroes });
    setSelectedHeroIndex(Math.max(0, selectedHeroIndex - 1));
  };

  const updatePromo = (
    index: number,
    key: keyof BuyerPageContent["home"]["promoGrid"][number],
    value: string
  ) => {
    const promoGrid = [...draft.home.promoGrid];
    promoGrid[index] = {
      ...promoGrid[index],
      [key]: value,
    };
    updateHome({ promoGrid });
  };

  const addPromo = () => {
    const source = selectedPromo || defaultBuyerPageContent.home.promoGrid[0];
    const promoGrid = [
      ...draft.home.promoGrid,
      {
        ...source,
        id: `promo-${Date.now()}`,
        title: "New promo block",
        subtitle: "Add a short selling line",
      },
    ];
    updateHome({ promoGrid });
    setSelectedPromoIndex(promoGrid.length - 1);
    onActiveSectionChange("promo");
  };

  const removePromo = () => {
    if (draft.home.promoGrid.length === 0) {
      return;
    }
    const promoGrid = draft.home.promoGrid.filter((_, index) => index !== selectedPromoIndex);
    updateHome({ promoGrid });
    setSelectedPromoIndex(clamp(selectedPromoIndex - 1, 0, Math.max(promoGrid.length - 1, 0)));
  };

  const updateCategory = (
    index: number,
    key: keyof BuyerPageContent["home"]["visualCategories"][number],
    value: string
  ) => {
    const visualCategories = [...draft.home.visualCategories];
    visualCategories[index] = {
      ...visualCategories[index],
      [key]: value,
    };
    updateHome({ visualCategories });
  };

  const addCategory = () => {
    const source = selectedCategory || defaultBuyerPageContent.home.visualCategories[0];
    const visualCategories = [
      ...draft.home.visualCategories,
      {
        ...source,
        id: `category-${Date.now()}`,
        label: "New category",
      },
    ];
    updateHome({ visualCategories });
    setSelectedCategoryIndex(visualCategories.length - 1);
    onActiveSectionChange("category");
  };

  const removeCategory = () => {
    if (draft.home.visualCategories.length === 0) {
      return;
    }
    const visualCategories = draft.home.visualCategories.filter((_, index) => index !== selectedCategoryIndex);
    updateHome({ visualCategories });
    setSelectedCategoryIndex(clamp(selectedCategoryIndex - 1, 0, Math.max(visualCategories.length - 1, 0)));
  };

  const selectedLoved = draft.home.lovedOnes[Math.min(selectedLovedIndex, Math.max(draft.home.lovedOnes.length - 1, 0))];

  const updateLovedOne = (
    index: number,
    key: keyof BuyerPageContent["home"]["lovedOnes"][number],
    value: string
  ) => {
    const lovedOnes = [...draft.home.lovedOnes];
    lovedOnes[index] = { ...lovedOnes[index], [key]: value };
    updateHome({ lovedOnes });
  };

  const addLovedOne = () => {
    const source = selectedLoved || defaultBuyerPageContent.home.lovedOnes[0];
    const lovedOnes = [
      ...draft.home.lovedOnes,
      { ...source, id: `loved-${Date.now()}`, title: "New card", subtitle: "Add subtitle" },
    ];
    updateHome({ lovedOnes });
    setSelectedLovedIndex(lovedOnes.length - 1);
    onActiveSectionChange("lovedOnes");
  };

  const removeLovedOne = () => {
    if (draft.home.lovedOnes.length === 0) return;
    const lovedOnes = draft.home.lovedOnes.filter((_, i) => i !== selectedLovedIndex);
    updateHome({ lovedOnes });
    setSelectedLovedIndex(clamp(selectedLovedIndex - 1, 0, Math.max(lovedOnes.length - 1, 0)));
  };

  const updateMediaShowcase = (value: Partial<BuyerPageContent["home"]["mediaShowcase"]>) => {
    updateHome({
      mediaShowcase: {
        ...draft.home.mediaShowcase,
        ...value,
      },
    });
  };

  const updateMediaItem = (
    index: number,
    key: keyof BuyerPageContent["home"]["mediaShowcase"]["items"][number],
    value: string
  ) => {
    const items = [...draft.home.mediaShowcase.items];
    items[index] = {
      ...items[index],
      [key]: value,
    };
    updateMediaShowcase({ items });
  };

  const addMediaItem = () => {
    const source = selectedMedia || defaultBuyerPageContent.home.mediaShowcase.items[0];
    const items = [
      ...draft.home.mediaShowcase.items,
      {
        ...source,
        id: `media-${Date.now()}`,
        label: "New bestseller",
        videoUrl: "",
      },
    ];
    updateMediaShowcase({ items });
    setSelectedMediaIndex(items.length - 1);
    onActiveSectionChange("mediaShowcase");
  };

  const removeMediaItem = () => {
    if (draft.home.mediaShowcase.items.length === 0) {
      return;
    }
    const items = draft.home.mediaShowcase.items.filter((_, index) => index !== selectedMediaIndex);
    updateMediaShowcase({ items });
    setSelectedMediaIndex(clamp(selectedMediaIndex - 1, 0, Math.max(items.length - 1, 0)));
  };

  const addActiveSectionItem = () => {
    if (activeSection === "hero") {
      addHero();
    } else if (activeSection === "promo") {
      addPromo();
    } else if (activeSection === "category") {
      addCategory();
    } else if (activeSection === "mediaShowcase") {
      addMediaItem();
    } else if (activeSection === "lovedOnes") {
      addLovedOne();
    }
  };

  const removeActiveSectionItem = () => {
    if (activeSection === "hero") {
      removeHero();
    } else if (activeSection === "promo") {
      removePromo();
    } else if (activeSection === "category") {
      removeCategory();
    } else if (activeSection === "mediaShowcase") {
      removeMediaItem();
    } else if (activeSection === "lovedOnes") {
      removeLovedOne();
    }
  };

  const canAddActiveSection =
    activeSection === "hero" ||
    activeSection === "promo" ||
    activeSection === "category" ||
    activeSection === "mediaShowcase" ||
    activeSection === "lovedOnes";
  const canRemoveActiveSection =
    (activeSection === "hero" && draft.home.heroes.length > 0) ||
    (activeSection === "promo" && draft.home.promoGrid.length > 0) ||
    (activeSection === "category" && draft.home.visualCategories.length > 0) ||
    (activeSection === "mediaShowcase" && draft.home.mediaShowcase.items.length > 0) ||
    (activeSection === "lovedOnes" && draft.home.lovedOnes.length > 0);
  const hideableSections: HideableEditorSection[] = defaultBuyerHomeSectionOrder;
  const isHideableSection = (section: EditorSection): section is HideableEditorSection =>
    hideableSections.includes(section as HideableEditorSection);
  const hiddenSections = draft.home.hiddenSections || [];
  const orderedHomeSections = normalizeBuyerHomeSectionOrder(draft.home.sectionOrder);
  const isSectionHidden = (section: EditorSection) =>
    isHideableSection(section) && hiddenSections.includes(section);
  const toggleSectionHidden = (section: HideableEditorSection) => {
    updateHome({
      hiddenSections: hiddenSections.includes(section)
        ? hiddenSections.filter((item) => item !== section)
        : [...hiddenSections, section],
    });
  };
  const moveHomeSection = (section: HideableEditorSection, direction: -1 | 1) => {
    const currentOrder = normalizeBuyerHomeSectionOrder(draft.home.sectionOrder);
    const fromIndex = currentOrder.indexOf(section);
    const toIndex = fromIndex + direction;

    if (fromIndex < 0 || toIndex < 0 || toIndex >= currentOrder.length) {
      return;
    }

    const nextOrder = [...currentOrder];
    const [movedSection] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, movedSection);
    updateHome({ sectionOrder: nextOrder });
  };
  const reorderHomeSectionByDrag = (section: HideableEditorSection, dragY: number) => {
    if (Math.abs(dragY) < 24) {
      return;
    }

    moveHomeSection(section, dragY > 0 ? 1 : -1);
  };

  const allSections = [
    { key: "hero" as EditorSection, label: "Hero Banner", icon: "image-outline" as IconName, depth: 1 },
    { key: "pageLabels" as EditorSection, label: "Nav Labels", icon: "menu-outline" as IconName, depth: 1 },
    { key: "promo" as EditorSection, label: "Promo Grid", icon: "grid-outline" as IconName, depth: 1 },
    { key: "mediaShowcase" as EditorSection, label: "Bestsellers", icon: "play-circle-outline" as IconName, depth: 1 },
    { key: "lovedOnes" as EditorSection, label: "Loved Ones", icon: "heart-outline" as IconName, depth: 1 },
    { key: "sections" as EditorSection, label: "Headings", icon: "reorder-four-outline" as IconName, depth: 1 },
    { key: "category" as EditorSection, label: "Categories", icon: "images-outline" as IconName, depth: 1 },
  ];
  const sectionByKey = Object.fromEntries(allSections.map((section) => [section.key, section])) as Record<
    EditorSection,
    (typeof allSections)[number]
  >;
  const sections = [
    ...orderedHomeSections.map((section) => sectionByKey[section]),
    sectionByKey.sections,
    sectionByKey.pageLabels,
  ];
  const blockLibrary = [
    { label: "Sections", caption: "Add column", icon: "albums-outline" as IconName },
    { label: "Container", caption: "Add button for action", icon: "file-tray-stacked-outline" as IconName },
    { label: "Grid", caption: "Divide blocks visually", icon: "grid-outline" as IconName },
    { label: "Columns", caption: "Add menu to navigate", icon: "columns-outline" as IconName },
    { label: "Div Block", caption: "Add column", icon: "square-outline" as IconName },
    { label: "List", caption: "Add button for action", icon: "list-outline" as IconName },
    { label: "Button", caption: "Set link or action", icon: "chatbox-outline" as IconName },
  ];
  const productCards = [
    { title: "Macbook Pro M1 Pro 14\"", image: promoItems[0]?.image || previewHero.image },
    { title: "Studio Monitor 27\"", image: promoItems[1]?.image || previewHero.image },
    { title: "Travel Essentials", image: promoItems[2]?.image || previewHero.image },
    { title: "Premium Accessories", image: promoItems[3]?.image || previewHero.image },
  ];
  const lovedItems = draft.home.lovedOnes.slice(0, 3);
  const showHeroPreview = !isSectionHidden("hero");
  const showPromoPreview = !isSectionHidden("promo");
  const showMediaPreview = !isSectionHidden("mediaShowcase");
  const showCategoryPreview = !isSectionHidden("category");
  const showLovedPreview = !isSectionHidden("lovedOnes");
  const getHomeSectionOrder = (section: HideableEditorSection) => orderedHomeSections.indexOf(section);
  const isPreviewDesktop = previewMode === "desktop";
  const canvasMaxWidth = isPreviewDesktop ? 1040 : 390;
  const canvasPadding = isPreviewDesktop ? spacing.xl : spacing.lg;
  const livePreviewColors = {
    background: "#F6F8FB",
    surface: "#FFFFFF",
    text: "#111827",
    muted: "#64748B",
    border: "#E5E7EB",
    primary: "#0B887B",
    primarySoft: "#E8F6F3",
    heroStart: "rgba(3,7,18,0.15)",
    heroEnd: "rgba(3,7,18,0.82)",
    dot: "#CBD5E1",
  };
  const inspectorTitle =
    activeSection === "hero"
      ? "Hero Settings"
      : activeSection === "promo"
        ? "Grid Settings"
        : activeSection === "category"
          ? "Image Settings"
          : activeSection === "mediaShowcase"
            ? "Video Section Settings"
            : activeSection === "lovedOnes"
              ? "Loved Ones Settings"
              : activeSection === "sections"
                ? "Section Settings"
                : "Page Settings";

  const selectFrame = (section: EditorSection) => ({
    borderWidth: activeSection === section ? 2 : 1,
    borderColor: activeSection === section ? "#1688F0" : "transparent",
  });

  const editorSectionLabel = sections.find((item) => item.key === activeSection)?.label || "Home page";

  const resizePane = (side: "left" | "right", delta: number) => {
    if (!isDesktop || !editorShellWidth) return;

    const inspectorReserve = inspectorOpen ? inspectorWidth : 0;
    if (side === "left") {
      setLeftPaneWidth(
        clamp(
          resizeStartRef.current.leftPaneWidth + delta,
          196,
          Math.min(420, editorShellWidth - inspectorReserve - 420)
        )
      );
      return;
    }

    setInspectorWidth(
      clamp(
        resizeStartRef.current.inspectorWidth - delta,
        280,
        Math.min(560, editorShellWidth - leftPaneWidth - 420)
      )
    );
  };

  const leftSplitterResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isDesktop,
        onMoveShouldSetPanResponder: () => isDesktop,
        onPanResponderGrant: () => {
          resizeStartRef.current = { pageX: 0, leftPaneWidth, inspectorWidth };
          setDraggingSplitter("left");
        },
        onPanResponderMove: (_, gestureState) => resizePane("left", gestureState.dx),
        onPanResponderRelease: () => setDraggingSplitter(null),
        onPanResponderTerminate: () => setDraggingSplitter(null),
      }),
    [editorShellWidth, inspectorOpen, inspectorWidth, isDesktop, leftPaneWidth]
  );

  const rightSplitterResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isDesktop,
        onMoveShouldSetPanResponder: () => isDesktop,
        onPanResponderGrant: () => {
          resizeStartRef.current = { pageX: 0, leftPaneWidth, inspectorWidth };
          setDraggingSplitter("right");
        },
        onPanResponderMove: (_, gestureState) => resizePane("right", gestureState.dx),
        onPanResponderRelease: () => setDraggingSplitter(null),
        onPanResponderTerminate: () => setDraggingSplitter(null),
      }),
    [editorShellWidth, inspectorOpen, inspectorWidth, isDesktop, leftPaneWidth]
  );

  const Splitter = ({ side }: { side: "left" | "right" }) =>
    isDesktop ? (
      <View
        {...(side === "left" ? leftSplitterResponder.panHandlers : rightSplitterResponder.panHandlers)}
        style={{
          width: 18,
          marginHorizontal: -9,
          zIndex: 20,
          alignItems: "center",
          justifyContent: "center",
          cursor: "col-resize" as never,
          backgroundColor: draggingSplitter === side ? "rgba(22,136,240,0.08)" : "transparent",
        }}
      >
        <View
          style={{
            width: 7,
            height: 56,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: draggingSplitter === side ? "#1688F0" : "#D6DEE8",
            backgroundColor: draggingSplitter === side ? "#DCEBFF" : colors.white,
            alignItems: "center",
            justifyContent: "center",
            ...shadows.card,
          }}
        >
          <View
            style={{
              width: 2,
              height: 30,
              borderRadius: 999,
              backgroundColor: draggingSplitter === side ? "#1688F0" : "#9AA6B2",
            }}
          />
        </View>
      </View>
    ) : null;

  const LayerRow = ({
    item,
  }: {
    item: (typeof sections)[number];
  }) => {
    const active = activeSection === item.key;
    const hidden = isSectionHidden(item.key);
    const canAddItem = item.key !== "pageLabels" && item.key !== "sections";
    const canReorder = isHideableSection(item.key);
    const orderIndex = canReorder ? orderedHomeSections.indexOf(item.key as HideableEditorSection) : -1;
    const dragResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => canReorder,
          onMoveShouldSetPanResponder: (_, gestureState) => canReorder && Math.abs(gestureState.dy) > 8,
          onPanResponderRelease: (_, gestureState) => {
            if (canReorder) {
              reorderHomeSectionByDrag(item.key as HideableEditorSection, gestureState.dy);
            }
          },
        }),
      [canReorder, item.key, orderedHomeSections.join("|")]
    );

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => onActiveSectionChange(item.key)}
        style={{
          minHeight: 34,
          paddingLeft: spacing.md + item.depth * 6,
          paddingRight: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          backgroundColor: active ? "#0B5ED7" : "transparent",
          borderRadius: 8,
          opacity: hidden ? 0.62 : 1,
        }}
      >
        {canReorder ? (
          <View
            {...dragResponder.panHandlers}
            style={{
              width: 18,
              height: 26,
              alignItems: "center",
              justifyContent: "center",
              cursor: "grab" as never,
            }}
          >
            <Ionicons name="reorder-three-outline" size={16} color={active ? colors.white : adminColors.softMuted} />
          </View>
        ) : null}
        <Ionicons name={item.icon} size={14} color={active ? colors.white : adminColors.muted} />
        <Text
          style={{
            flex: 1,
            color: active ? colors.white : adminColors.ink,
            fontSize: 12,
            fontWeight: active ? "900" : "800",
          }}
          numberOfLines={1}
        >
          {item.label}
        </Text>
        {isHideableSection(item.key) ? (
          <Pressable
            accessibilityRole="button"
            onPress={(event) => {
              event.stopPropagation();
              toggleSectionHidden(item.key as HideableEditorSection);
            }}
            style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={14}
              color={active ? colors.white : hidden ? colors.danger : adminColors.softMuted}
            />
          </Pressable>
        ) : null}
        {canReorder ? (
          <>
            <Pressable
              accessibilityRole="button"
              disabled={orderIndex <= 0}
              onPress={(event) => {
                event.stopPropagation();
                moveHomeSection(item.key as HideableEditorSection, -1);
              }}
              style={{ width: 22, height: 24, alignItems: "center", justifyContent: "center", opacity: orderIndex <= 0 ? 0.35 : 1 }}
            >
              <Ionicons name="chevron-up-outline" size={13} color={active ? colors.white : adminColors.softMuted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={orderIndex >= orderedHomeSections.length - 1}
              onPress={(event) => {
                event.stopPropagation();
                moveHomeSection(item.key as HideableEditorSection, 1);
              }}
              style={{
                width: 22,
                height: 24,
                alignItems: "center",
                justifyContent: "center",
                opacity: orderIndex >= orderedHomeSections.length - 1 ? 0.35 : 1,
              }}
            >
              <Ionicons name="chevron-down-outline" size={13} color={active ? colors.white : adminColors.softMuted} />
            </Pressable>
          </>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={!canAddItem}
          onPress={() => {
            if (item.key === "hero") {
              addHero();
            } else if (item.key === "promo") {
              addPromo();
            } else if (item.key === "category") {
              addCategory();
            } else if (item.key === "mediaShowcase") {
              addMediaItem();
            } else if (item.key === "lovedOnes") {
              addLovedOne();
            } else {
              onActiveSectionChange(item.key);
            }
          }}
          style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center" }}
        >
          <Ionicons
            name="add-outline"
            size={14}
            color={!canAddItem ? (active ? "rgba(255,255,255,0.45)" : adminColors.lineStrong) : active ? colors.white : adminColors.softMuted}
          />
        </Pressable>
      </Pressable>
    );
  };

  const InspectorGroup = ({ title, children }: { title: string; children: ReactNode }) => (
    <View style={{ gap: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: adminColors.line }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ color: adminColors.muted, fontSize: 12, fontWeight: "900" }}>{title}</Text>
        <Ionicons name="remove-outline" size={15} color={adminColors.softMuted} />
      </View>
      {children}
    </View>
  );

  const InspectorPill = ({ label, active }: { label: string; active?: boolean }) => (
    <View
      style={{
        height: 30,
        minWidth: 48,
        borderRadius: 7,
        paddingHorizontal: spacing.sm,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? colors.white : "#F6F7F9",
        borderWidth: 1,
        borderColor: active ? adminColors.lineStrong : "#EEF1F4",
      }}
    >
      <Text style={{ color: active ? adminColors.ink : adminColors.muted, fontSize: 11, fontWeight: "800" }}>
        {label}
      </Text>
    </View>
  );

  const NumberBox = ({ value, label }: { value: string; label: string }) => (
    <View
      style={{
        flex: 1,
        height: 34,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: adminColors.line,
        backgroundColor: "#FAFBFC",
        paddingHorizontal: spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text style={{ color: adminColors.ink, fontSize: 12, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: adminColors.muted, fontSize: 11 }}>{label}</Text>
    </View>
  );

  const RenderActiveFields = () => (
    <>
      {activeSection === "pageLabels" ? (
        <>
          <EditorField label="Home Tab Title" value={draft.pages.homeTitle} onChangeText={(value) => updatePages("homeTitle", value)} />
          <EditorField label="Categories Title" value={draft.pages.categoriesTitle} onChangeText={(value) => updatePages("categoriesTitle", value)} />
          <EditorField label="Categories Subtitle" value={draft.pages.categoriesSubtitle} onChangeText={(value) => updatePages("categoriesSubtitle", value)} multiline />
          <EditorField label="Products Title" value={draft.pages.productsTitle} onChangeText={(value) => updatePages("productsTitle", value)} />
          <EditorField label="Products Subtitle" value={draft.pages.productsSubtitle} onChangeText={(value) => updatePages("productsSubtitle", value)} multiline />
          <EditorField label="Deals Title" value={draft.pages.dealsTitle} onChangeText={(value) => updatePages("dealsTitle", value)} />
          <EditorField label="Deals Subtitle" value={draft.pages.dealsSubtitle} onChangeText={(value) => updatePages("dealsSubtitle", value)} multiline />
        </>
      ) : null}

      {activeSection === "hero" ? (
        <Panel style={{ padding: spacing.md, gap: spacing.sm }}>
          {draft.home.heroes.length > 0 && selectedHero ? (
            <>
              <Text style={{ color: adminColors.ink, fontWeight: "900" }}>Editing Hero {selectedHeroIndex + 1} of {draft.home.heroes.length}</Text>
              <EditorField label="Eyebrow" value={selectedHero.eyebrow} onChangeText={(value) => updateHero("eyebrow", value)} />
              <EditorField label="Headline" value={selectedHero.title} onChangeText={(value) => updateHero("title", value)} multiline />
              <EditorField label="Subtitle" value={selectedHero.subtitle} onChangeText={(value) => updateHero("subtitle", value)} multiline />
              <EditorField label="Offer Button" value={selectedHero.offer} onChangeText={(value) => updateHero("offer", value)} />
              <EditorField label="Image URL" value={selectedHero.image} onChangeText={(value) => updateHero("image", value)} multiline />
              <EditorField label="Category Route" value={selectedHero.category} onChangeText={(value) => updateHero("category", value)} />
              <EditorField label="Accent Color" value={selectedHero.accent} onChangeText={(value) => updateHero("accent", value)} />
              <EditorField label="Countdown Hours" value={`${selectedHero.durationHours || 24}`} onChangeText={(value) => updateHero("durationHours", value)} />
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <ActionButton label="Add Slide" icon="add-outline" ghost onPress={addHero} />
                <ActionButton label="Remove" icon="trash-outline" tone={colors.danger} ghost onPress={removeHero} />
              </View>
            </>
          ) : (
            <>
              <Text style={{ color: adminColors.ink, fontWeight: "900" }}>Hero Section Removed</Text>
              <Text style={{ color: adminColors.muted, fontSize: 12, lineHeight: 18 }}>
                Restore it to show the large home page banner again.
              </Text>
              <ActionButton label="Restore Hero Section" icon="add-outline" onPress={restoreHero} />
            </>
          )}
        </Panel>
      ) : null}

      {activeSection === "promo" && selectedPromo ? (
        <Panel style={{ padding: spacing.md, gap: spacing.sm }}>
          <Text style={{ color: adminColors.ink, fontWeight: "900" }}>Editing Promo {selectedPromoIndex + 1}</Text>
          <EditorField label="Title" value={selectedPromo.title} onChangeText={(value) => updatePromo(selectedPromoIndex, "title", value)} />
          <EditorField label="Subtitle" value={selectedPromo.subtitle} onChangeText={(value) => updatePromo(selectedPromoIndex, "subtitle", value)} multiline />
          <EditorField label="Image URL" value={selectedPromo.image} onChangeText={(value) => updatePromo(selectedPromoIndex, "image", value)} multiline />
          <EditorField label="Category" value={selectedPromo.category} onChangeText={(value) => updatePromo(selectedPromoIndex, "category", value)} />
          <EditorField label="Accent Color" value={selectedPromo.accent} onChangeText={(value) => updatePromo(selectedPromoIndex, "accent", value)} />
          <EditorField label="Icon (Ionicons)" value={selectedPromo.icon} onChangeText={(value) => updatePromo(selectedPromoIndex, "icon", value)} />
          <EditorField label="Tag (e.g. Trending, Hot, New)" value={selectedPromo.tag || ""} onChangeText={(value) => updatePromo(selectedPromoIndex, "tag", value)} />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <ActionButton label="Add" icon="add-outline" ghost onPress={addPromo} />
            <ActionButton label="Remove" icon="trash-outline" tone={colors.danger} ghost onPress={removePromo} />
          </View>
        </Panel>
      ) : null}

      {activeSection === "promo" && !selectedPromo ? (
        <Panel style={{ padding: spacing.md, gap: spacing.sm }}>
          <Text style={{ color: adminColors.ink, fontWeight: "900" }}>Promo Grid Removed</Text>
          <Text style={{ color: adminColors.muted, fontSize: 12, lineHeight: 18 }}>
            Add a promo card to show this section in the live preview.
          </Text>
          <ActionButton label="Add Promo Card" icon="add-outline" onPress={addPromo} />
        </Panel>
      ) : null}

      {activeSection === "category" && selectedCategory ? (
        <Panel style={{ padding: spacing.md, gap: spacing.sm }}>
          <Text style={{ color: adminColors.ink, fontWeight: "900" }}>Editing Image {selectedCategoryIndex + 1}</Text>
          <EditorField label="Label" value={selectedCategory.label} onChangeText={(value) => updateCategory(selectedCategoryIndex, "label", value)} />
          <EditorField label="Image URL" value={selectedCategory.image} onChangeText={(value) => updateCategory(selectedCategoryIndex, "image", value)} multiline />
          <EditorField label="Category Route" value={selectedCategory.category} onChangeText={(value) => updateCategory(selectedCategoryIndex, "category", value)} />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <ActionButton label="Add" icon="add-outline" ghost onPress={addCategory} />
            <ActionButton label="Remove" icon="trash-outline" tone={colors.danger} ghost onPress={removeCategory} />
          </View>
        </Panel>
      ) : null}

      {activeSection === "category" && !selectedCategory ? (
        <Panel style={{ padding: spacing.md, gap: spacing.sm }}>
          <Text style={{ color: adminColors.ink, fontWeight: "900" }}>Categories Removed</Text>
          <Text style={{ color: adminColors.muted, fontSize: 12, lineHeight: 18 }}>
            Add a category image to show this section in the live preview.
          </Text>
          <ActionButton label="Add Category" icon="add-outline" onPress={addCategory} />
        </Panel>
      ) : null}

      {activeSection === "mediaShowcase" && selectedMedia ? (
        <Panel style={{ padding: spacing.md, gap: spacing.sm }}>
          <Text style={{ color: adminColors.ink, fontWeight: "900" }}>
            Editing Bestseller {selectedMediaIndex + 1}
          </Text>
          <EditorField
            label="Section Heading"
            value={draft.home.mediaShowcase.title}
            onChangeText={(value) => updateMediaShowcase({ title: value })}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => updateMediaShowcase({ autoplay: !draft.home.mediaShowcase.autoplay })}
            style={{
              minHeight: 42,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: draft.home.mediaShowcase.autoplay ? colors.success : adminColors.lineStrong,
              backgroundColor: draft.home.mediaShowcase.autoplay ? "#ECFDF3" : "#FAFBFC",
              paddingHorizontal: spacing.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: adminColors.ink, fontSize: 12, fontWeight: "900" }}>
              Autoplay carousel and videos
            </Text>
            <Ionicons
              name={draft.home.mediaShowcase.autoplay ? "toggle" : "toggle-outline"}
              size={24}
              color={draft.home.mediaShowcase.autoplay ? colors.success : adminColors.muted}
            />
          </Pressable>
          <EditorField
            label="Card Label"
            value={selectedMedia.label}
            onChangeText={(value) => updateMediaItem(selectedMediaIndex, "label", value)}
          />
          <EditorField
            label="Poster / Image URL"
            value={selectedMedia.image}
            onChangeText={(value) => updateMediaItem(selectedMediaIndex, "image", value)}
            multiline
          />
          <EditorField
            label="Video URL"
            value={selectedMedia.videoUrl || ""}
            onChangeText={(value) => updateMediaItem(selectedMediaIndex, "videoUrl", value)}
            multiline
          />
          <EditorField
            label="Category Route"
            value={selectedMedia.category}
            onChangeText={(value) => updateMediaItem(selectedMediaIndex, "category", value)}
          />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <ActionButton label="Add" icon="add-outline" ghost onPress={addMediaItem} />
            <ActionButton
              label="Remove"
              icon="trash-outline"
              tone={colors.danger}
              ghost
              onPress={removeMediaItem}
            />
          </View>
        </Panel>
      ) : null}

      {activeSection === "mediaShowcase" && !selectedMedia ? (
        <Panel style={{ padding: spacing.md, gap: spacing.sm }}>
          <EditorField
            label="Section Heading"
            value={draft.home.mediaShowcase.title}
            onChangeText={(value) => updateMediaShowcase({ title: value })}
          />
          <Text style={{ color: adminColors.muted, fontSize: 12, lineHeight: 18 }}>
            Add a bestseller card to show this section in the live preview.
          </Text>
          <ActionButton label="Add Bestseller" icon="add-outline" onPress={addMediaItem} />
        </Panel>
      ) : null}

      {activeSection === "lovedOnes" && selectedLoved ? (
        <Panel style={{ padding: spacing.md, gap: spacing.sm }}>
          <Text style={{ color: adminColors.ink, fontWeight: "900" }}>Editing Loved One {selectedLovedIndex + 1}</Text>
          <EditorField label="Title" value={selectedLoved.title} onChangeText={(value) => updateLovedOne(selectedLovedIndex, "title", value)} />
          <EditorField label="Subtitle" value={selectedLoved.subtitle} onChangeText={(value) => updateLovedOne(selectedLovedIndex, "subtitle", value)} />
          <EditorField label="Image URL" value={selectedLoved.image} onChangeText={(value) => updateLovedOne(selectedLovedIndex, "image", value)} multiline />
          <EditorField label="Category Route" value={selectedLoved.category} onChangeText={(value) => updateLovedOne(selectedLovedIndex, "category", value)} />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <ActionButton label="Add" icon="add-outline" ghost onPress={addLovedOne} />
            <ActionButton label="Remove" icon="trash-outline" tone={colors.danger} ghost onPress={removeLovedOne} />
          </View>
        </Panel>
      ) : null}

      {activeSection === "lovedOnes" && !selectedLoved ? (
        <Panel style={{ padding: spacing.md, gap: spacing.sm }}>
          <EditorField label="Loved Ones Heading" value={draft.home.lovedOnesTitle} onChangeText={(value) => updateHome({ lovedOnesTitle: value })} />
          <Text style={{ color: adminColors.muted, fontSize: 12, lineHeight: 18 }}>
            Add a loved ones card to show this section in the live preview.
          </Text>
          <ActionButton label="Add Loved Ones Card" icon="add-outline" onPress={addLovedOne} />
        </Panel>
      ) : null}

      {activeSection === "sections" ? (
        <>
          <EditorField label="Loved Ones Heading" value={draft.home.lovedOnesTitle} onChangeText={(value) => updateHome({ lovedOnesTitle: value })} />
          <EditorField label="Deals Heading" value={draft.home.dealsTitle} onChangeText={(value) => updateHome({ dealsTitle: value })} />
          <EditorField label="Deals Action" value={draft.home.dealsActionLabel} onChangeText={(value) => updateHome({ dealsActionLabel: value })} />
          <EditorField label="Featured Heading" value={draft.home.featuredTitle} onChangeText={(value) => updateHome({ featuredTitle: value })} />
          <EditorField label="Featured Action" value={draft.home.featuredActionLabel} onChangeText={(value) => updateHome({ featuredActionLabel: value })} />
        </>
      ) : null}
    </>
  );

  return (
    <Panel style={{ overflow: "hidden", borderRadius: 8 }}>
      <View
        style={{
          minHeight: 48,
          borderBottomWidth: 1,
          borderBottomColor: adminColors.line,
          paddingHorizontal: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.sm,
          backgroundColor: colors.white,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, flex: 1 }}>
          <IconButton icon="arrow-back-outline" backgroundColor={colors.white} onPress={onClose} />
          <View style={{ width: 1, height: 30, backgroundColor: adminColors.line }} />
          {[
            { icon: "albums-outline" as IconName, active: true, run: () => onActiveSectionChange("hero") },
            { icon: "settings-outline" as IconName, active: inspectorOpen, run: () => setInspectorOpen((value) => !value) },
            { icon: "grid-outline" as IconName, active: false, run: addActiveSectionItem },
          ].map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.icon}
              onPress={item.run}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: item.active ? "#EAF2FF" : colors.white,
              }}
            >
              <Ionicons name={item.icon} size={17} color={item.active ? "#0B5ED7" : adminColors.ink} />
            </Pressable>
          ))}
        </View>

        {isDesktop ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg, justifyContent: "center", flex: 1.4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Ionicons name="color-palette-outline" size={15} color={adminColors.muted} />
              <Text style={{ color: adminColors.ink, fontSize: 12, fontWeight: "900" }}>SachinIndia</Text>
              <View
                style={{
                  borderRadius: 999,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 3,
                  backgroundColor: isDirty ? "#FFF4E5" : "#DFF7E8",
                }}
              >
                <Text style={{ color: isDirty ? "#B45309" : "#15803D", fontSize: 11, fontWeight: "900" }}>
                  {isDirty ? "Draft" : "Active"}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Ionicons name="home-outline" size={15} color={adminColors.ink} />
              <Text style={{ color: adminColors.ink, fontSize: 12, fontWeight: "800" }}>Home page</Text>
            </View>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: spacing.xs, alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
          <View
            style={{
              height: 32,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: adminColors.lineStrong,
              backgroundColor: "#F6F7F9",
              flexDirection: "row",
              overflow: "hidden",
            }}
          >
            {[
              { label: "Desktop", value: "desktop" as const, icon: "desktop-outline" as IconName },
              { label: "Mobile", value: "mobile" as const, icon: "phone-portrait-outline" as IconName },
            ].map((item) => {
              const active = previewMode === item.value;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={item.value}
                  onPress={() => setPreviewMode(item.value)}
                  style={{
                    width: 36,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? "#0B70D7" : "transparent",
                  }}
                >
                  <Ionicons name={item.icon} size={14} color={active ? colors.white : adminColors.muted} />
                </Pressable>
              );
            })}
          </View>
          <IconButton icon="arrow-undo-outline" backgroundColor="#F6F7F9" onPress={onReset} />
          <IconButton icon="arrow-redo-outline" backgroundColor="#F6F7F9" onPress={onPublish} disabled={!isDirty || isPublishing} />
          <IconButton
            icon="ellipsis-horizontal"
            backgroundColor={colors.white}
            onPress={() => showToast("info", "Workspace", `${editorSectionLabel} is selected.`)}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!isDirty || isPublishing}
            onPress={isDirty ? onPublish : undefined}
            style={{
              minHeight: 32,
              borderRadius: 8,
              paddingHorizontal: spacing.md,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDirty ? "#111827" : "#D1D5DB",
              opacity: isPublishing ? 0.6 : 1,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: "900", fontSize: 12 }}>
              {isPublishing ? "Saving" : "Save"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View
        onLayout={(event) => setEditorShellWidth(event.nativeEvent.layout.width)}
        style={{ flexDirection: isDesktop ? "row" : "column", height: isDesktop ? 760 : undefined, minHeight: 640 }}
      >
        <View
          style={{
            width: isDesktop ? leftPaneWidth : "100%",
            borderRightWidth: isDesktop ? 1 : 0,
            borderBottomWidth: isDesktop ? 0 : 1,
            borderColor: adminColors.line,
            backgroundColor: colors.white,
            flexDirection: "row",
          }}
        >
          {isDesktop ? (
            <View
              style={{
                width: 52,
                alignItems: "center",
                paddingVertical: spacing.md,
                gap: spacing.md,
                borderRightWidth: 1,
                borderRightColor: adminColors.line,
              }}
            >
              {[
                "menu-outline",
                "browsers-outline",
                "brush-outline",
                "code-slash-outline",
                "settings-outline",
              ].map((icon, index) => (
                <View
                  key={icon}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: index === 1 ? "#12081F" : "transparent",
                  }}
                >
                  <Ionicons name={icon as IconName} size={16} color={index === 1 ? colors.white : adminColors.muted} />
                </View>
              ))}
              <View style={{ flex: 1 }} />
              <Ionicons name="help-circle-outline" size={18} color={adminColors.muted} />
              <Ionicons name="apps-outline" size={18} color={adminColors.muted} />
            </View>
          ) : null}

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.sm }}>
            <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}>
              <Text style={{ color: adminColors.ink, fontSize: 14, fontWeight: "900" }}>Home page</Text>
            </View>

            <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: adminColors.line, padding: spacing.md, gap: spacing.sm }}>
              <Text style={{ color: adminColors.ink, fontSize: 13, fontWeight: "900" }}>Header</Text>
              {[
                { label: "Announcement bar", icon: "megaphone-outline" as IconName },
                { label: "Header", icon: "menu-outline" as IconName },
              ].map((item) => (
                <View key={item.label} style={{ minHeight: 28, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Ionicons name="chevron-forward" size={13} color={adminColors.softMuted} />
                  <Ionicons name={item.icon} size={14} color={adminColors.muted} />
                  <Text style={{ color: adminColors.ink, fontSize: 12, fontWeight: "700" }}>{item.label}</Text>
                </View>
              ))}
              <Pressable
                accessibilityRole="button"
                onPress={addActiveSectionItem}
                style={{ minHeight: 28, flexDirection: "row", alignItems: "center", gap: spacing.sm }}
              >
                <Ionicons name="add-circle-outline" size={15} color="#0B5ED7" />
                <Text style={{ color: "#0B5ED7", fontSize: 12, fontWeight: "800" }}>Add section</Text>
              </Pressable>
            </View>

            <View style={{ borderBottomWidth: 1, borderColor: adminColors.line, padding: spacing.md, gap: spacing.sm }}>
              <Text style={{ color: adminColors.ink, fontSize: 13, fontWeight: "900" }}>Template</Text>
              <View style={{ gap: 3 }}>
                {sections.filter((item) => item.key !== "pageLabels").map((item) => (
                  <LayerRow key={item.key} item={item} />
                ))}
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={addActiveSectionItem}
                style={{ minHeight: 30, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingLeft: spacing.xl }}
              >
                <Ionicons name="add-circle-outline" size={15} color="#0B5ED7" />
                <Text style={{ color: "#0B5ED7", fontSize: 12, fontWeight: "800" }}>Add section</Text>
              </Pressable>
            </View>

            <View style={{ padding: spacing.md, gap: spacing.sm }}>
              <Text style={{ color: adminColors.ink, fontSize: 13, fontWeight: "900" }}>Footer</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => onActiveSectionChange("sections")}
                style={{
                  minHeight: 30,
                  borderRadius: 8,
                  paddingHorizontal: spacing.sm,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  backgroundColor: activeSection === "sections" ? "#0B5ED7" : "#F3F4F6",
                }}
              >
                <Ionicons name="chevron-forward" size={13} color={activeSection === "sections" ? colors.white : adminColors.softMuted} />
                <Ionicons name="albums-outline" size={14} color={activeSection === "sections" ? colors.white : adminColors.muted} />
                <Text style={{ color: activeSection === "sections" ? colors.white : adminColors.ink, fontSize: 12, fontWeight: "800" }}>
                  Footer
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>

        <Splitter side="left" />

        <View style={{ flex: 1, backgroundColor: "#EFF3F7", minWidth: 0 }}>
          <ScrollView contentContainerStyle={{ padding: isDesktop ? spacing.lg : spacing.md, alignItems: "center" }}>
            <View
              style={{
                width: "100%",
                maxWidth: canvasMaxWidth,
                backgroundColor: livePreviewColors.background,
                overflow: "hidden",
                borderRadius: isPreviewDesktop ? 0 : 24,
                borderWidth: 1,
                borderColor: "#E5E9EF",
              }}
            >
              <View
                style={{
                  minHeight: 58,
                  paddingHorizontal: canvasPadding,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottomWidth: 1,
                  borderBottomColor: livePreviewColors.border,
                  backgroundColor: livePreviewColors.surface,
                }}
              >
                <Text style={{ color: livePreviewColors.primary, fontSize: 18, fontWeight: "900" }}>
                  SachinIndia
                </Text>
                {isPreviewDesktop ? (
                  <View style={{ flexDirection: "row", gap: spacing.xl, alignItems: "center" }}>
                    <Text style={{ color: livePreviewColors.text, fontSize: 13, fontWeight: "800" }}>Home</Text>
                    <Text style={{ color: livePreviewColors.muted, fontSize: 13, fontWeight: "800" }}>Categories</Text>
                    <Text style={{ color: livePreviewColors.muted, fontSize: 13, fontWeight: "800" }}>Deals</Text>
                    <Ionicons name="cart-outline" size={18} color={livePreviewColors.text} />
                  </View>
                ) : (
                  <Ionicons name="menu-outline" size={22} color={livePreviewColors.text} />
                )}
              </View>

              <View style={{ padding: canvasPadding }}>
                {hero && showHeroPreview ? (
                  <View style={{ order: getHomeSectionOrder("hero") } as ViewStyle}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onActiveSectionChange("hero")}
                      style={{
                        height: isPreviewDesktop ? 400 : 340,
                        borderRadius: isPreviewDesktop ? radius.xl : radius.lg,
                        overflow: "hidden",
                        backgroundColor: livePreviewColors.surface,
                        ...selectFrame("hero"),
                      }}
                    >
                      <Image source={{ uri: hero.image }} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
                      <LinearGradient
                        colors={[livePreviewColors.heroStart, livePreviewColors.heroEnd]}
                        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
                      />
                      <View
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          bottom: 0,
                          left: 0,
                          padding: isPreviewDesktop ? spacing.xxxl : spacing.xl,
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            alignSelf: "flex-start",
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
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: hero.accent }} />
                          <Text style={{ color: colors.white, fontSize: 12, fontWeight: "900" }}>
                            {hero.eyebrow.toUpperCase()}
                          </Text>
                        </View>

                        <View style={{ maxWidth: isPreviewDesktop ? 680 : 320 }}>
                          <Text
                            style={{
                              color: colors.white,
                              fontSize: isPreviewDesktop ? 54 : 34,
                              lineHeight: isPreviewDesktop ? 58 : 38,
                              fontWeight: "900",
                            }}
                          >
                            {hero.title}
                          </Text>
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.82)",
                              fontSize: isPreviewDesktop ? 18 : 15,
                              lineHeight: isPreviewDesktop ? 28 : 22,
                              marginTop: spacing.md,
                              maxWidth: isPreviewDesktop ? 560 : 300,
                              fontWeight: "600",
                            }}
                          >
                            {hero.subtitle}
                          </Text>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flexShrink: 1 }}>
                            <View
                              style={{
                                backgroundColor: hero.accent,
                                borderRadius: radius.md,
                                paddingHorizontal: spacing.lg,
                                paddingVertical: spacing.sm,
                              }}
                            >
                              <Text style={{ color: "#111827", fontSize: 14, fontWeight: "900" }}>{hero.offer}</Text>
                            </View>
                            {isPreviewDesktop ? (
                              <Text style={{ color: "rgba(255,255,255,0.72)", fontWeight: "700" }}>Tap to explore</Text>
                            ) : null}
                          </View>
                          <View
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 24,
                              backgroundColor: colors.white,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons name="arrow-forward" size={22} color={colors.primaryDark} />
                          </View>
                        </View>
                      </View>
                    </Pressable>

                    <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.md, marginBottom: spacing.xl, gap: spacing.sm }}>
                      {draft.home.heroes.map((item) => (
                        <View
                          key={item.id}
                          style={{
                            width: item.id === hero.id ? 28 : 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: item.id === hero.id ? livePreviewColors.primary : livePreviewColors.dot,
                          }}
                        />
                      ))}
                    </View>
                  </View>
                ) : null}

                {promoItems.length > 0 && showPromoPreview ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onActiveSectionChange("promo")}
                  style={{ marginTop: spacing.xl, order: getHomeSectionOrder("promo"), ...selectFrame("promo") } as ViewStyle}
                >
                  <View style={{ flexDirection: isPreviewDesktop ? "row" : "column", gap: spacing.md }}>
                    {promoItems[0] ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setSelectedPromoIndex(0);
                          onActiveSectionChange("promo");
                        }}
                        style={{
                          flex: isPreviewDesktop ? 1.25 : undefined,
                          minHeight: isPreviewDesktop ? 336 : 240,
                          borderRadius: radius.lg,
                          overflow: "hidden",
                          borderWidth: activeSection === "promo" && selectedPromoIndex === 0 ? 2 : 1,
                          borderColor: activeSection === "promo" && selectedPromoIndex === 0 ? "#1688F0" : livePreviewColors.border,
                        }}
                      >
                        <Image source={{ uri: promoItems[0].image }} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
                        <LinearGradient
                          colors={["rgba(0,0,0,0.02)", "rgba(0,0,0,0.7)"]}
                          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, justifyContent: "flex-end", padding: spacing.xl }}
                        >
                          <Text style={{ color: colors.white, fontSize: 28, lineHeight: 32, fontWeight: "900" }}>{promoItems[0].title}</Text>
                          <Text style={{ color: "rgba(255,255,255,0.88)", marginTop: spacing.xs, fontSize: 14, fontWeight: "700" }}>
                            {promoItems[0].subtitle}
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    ) : null}

                    <View style={{ flex: 1, gap: spacing.md }}>
                      {promoItems.slice(1, 4).map((item, offset) => {
                        const index = offset + 1;
                        return (
                          <Pressable
                            accessibilityRole="button"
                            key={item.id}
                            onPress={() => {
                              setSelectedPromoIndex(index);
                              onActiveSectionChange("promo");
                            }}
                            style={{
                              minHeight: isPreviewDesktop ? (index === 1 ? 160 : 160) : 180,
                              flex: isPreviewDesktop ? 1 : undefined,
                              borderRadius: radius.lg,
                              overflow: "hidden",
                              borderWidth: activeSection === "promo" && selectedPromoIndex === index ? 2 : 1,
                              borderColor: activeSection === "promo" && selectedPromoIndex === index ? "#1688F0" : livePreviewColors.border,
                            }}
                          >
                            <Image source={{ uri: item.image }} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
                            <LinearGradient
                              colors={["rgba(0,0,0,0.02)", "rgba(0,0,0,0.7)"]}
                              style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, justifyContent: "flex-end", padding: spacing.lg }}
                            >
                              <Text style={{ color: colors.white, fontSize: 18, lineHeight: 22, fontWeight: "900" }}>{item.title}</Text>
                              <Text style={{ color: "rgba(255,255,255,0.88)", marginTop: spacing.xs, fontSize: 12, fontWeight: "700" }} numberOfLines={1}>
                                {item.subtitle}
                              </Text>
                            </LinearGradient>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </Pressable>
                ) : null}

                {mediaItems.length > 0 && showMediaPreview ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onActiveSectionChange("mediaShowcase")}
                  style={{ marginTop: spacing.xl, order: getHomeSectionOrder("mediaShowcase"), ...selectFrame("mediaShowcase") } as ViewStyle}
                >
                  <Text
                    style={{
                      marginBottom: spacing.md,
                      color: livePreviewColors.text,
                      fontSize: 24,
                      fontWeight: "900",
                    }}
                  >
                    {draft.home.mediaShowcase.title}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {mediaItems.map((item, index) => (
                      <Pressable
                        accessibilityRole="button"
                        key={item.id}
                        onPress={() => {
                          setSelectedMediaIndex(index);
                          onActiveSectionChange("mediaShowcase");
                        }}
                        style={{
                          width: isPreviewDesktop ? 220 : 150,
                          marginRight: spacing.md,
                          alignItems: "center",
                          borderWidth: activeSection === "mediaShowcase" && selectedMediaIndex === index ? 2 : 0,
                          borderColor: "#1688F0",
                          borderRadius: radius.md,
                          padding: activeSection === "mediaShowcase" && selectedMediaIndex === index ? 4 : 0,
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
                          <Image source={{ uri: item.image }} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
                          {item.videoUrl ? (
                            <View
                              style={{
                                position: "absolute",
                                top: spacing.sm,
                                right: spacing.sm,
                                width: 30,
                                height: 30,
                                borderRadius: 15,
                                backgroundColor: "rgba(0,0,0,0.55)",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Ionicons name="play" size={14} color={colors.white} />
                            </View>
                          ) : null}
                        </View>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: livePreviewColors.text,
                            fontSize: 12,
                            fontWeight: "900",
                            marginTop: spacing.xs,
                            textAlign: "center",
                            width: "100%",
                          }}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </Pressable>
                ) : null}

                {categoryItems.length > 0 && showCategoryPreview ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onActiveSectionChange("category")}
                  style={{ marginTop: spacing.xl, order: getHomeSectionOrder("category"), ...selectFrame("category") } as ViewStyle}
                >
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                      {[categoryItems.slice(0, 10), categoryItems.slice(10)].map((row, rowIndex) => (
                        <View key={`category-row-${rowIndex}`} style={{ flexDirection: "row" }}>
                          {row.map((item, index) => {
                            const actualIndex = rowIndex === 0 ? index : index + 10;
                            return (
                              <Pressable
                                accessibilityRole="button"
                                key={item.id}
                                onPress={() => {
                                  setSelectedCategoryIndex(actualIndex);
                                  onActiveSectionChange("category");
                                }}
                                style={{
                                  width: 96,
                                  alignItems: "center",
                                  marginRight: spacing.xl,
                                  marginBottom: spacing.md,
                                  borderWidth: activeSection === "category" && selectedCategoryIndex === actualIndex ? 2 : 0,
                                  borderColor: "#1688F0",
                                  borderRadius: radius.md,
                                  padding: activeSection === "category" && selectedCategoryIndex === actualIndex ? 4 : 0,
                                }}
                              >
                                <View style={{ width: 92, height: 82, alignItems: "center", justifyContent: "flex-end" }}>
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
                                  <Image source={{ uri: item.image }} resizeMode="cover" style={{ width: 78, height: 72, borderRadius: 12 }} />
                                </View>
                                <Text
                                  numberOfLines={1}
                                  style={{
                                    color: livePreviewColors.text,
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
                          })}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </Pressable>
                ) : null}

                {lovedItems.length > 0 && showLovedPreview ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onActiveSectionChange("lovedOnes")}
                  style={{ marginTop: spacing.lg, order: getHomeSectionOrder("lovedOnes"), ...selectFrame("lovedOnes") } as ViewStyle}
                >
                  <Text style={{ marginBottom: spacing.md, color: livePreviewColors.text, fontSize: 24, fontWeight: "900" }}>
                    {draft.home.lovedOnesTitle}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {lovedItems.map((item, index) => (
                      <Pressable
                        accessibilityRole="button"
                        key={item.id}
                        onPress={() => {
                          setSelectedLovedIndex(index);
                          onActiveSectionChange("lovedOnes");
                        }}
                        style={{
                          width: isPreviewDesktop ? 300 : 320,
                          height: 170,
                          borderRadius: radius.md,
                          overflow: "hidden",
                          backgroundColor: livePreviewColors.primary,
                          marginRight: spacing.xl,
                          borderWidth: activeSection === "lovedOnes" && selectedLovedIndex === index ? 2 : 0,
                          borderColor: "#1688F0",
                        }}
                      >
                        <Image source={{ uri: item.image }} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
                        <LinearGradient
                          colors={["rgba(0,30,80,0.08)", "rgba(0,34,90,0.82)"]}
                          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, justifyContent: "flex-end", padding: spacing.lg }}
                        >
                          <Text style={{ color: colors.white, fontSize: 21, fontWeight: "900" }}>{item.title}</Text>
                          <Text style={{ color: "rgba(255,255,255,0.84)", marginTop: 4, fontWeight: "700" }}>{item.subtitle}</Text>
                        </LinearGradient>
                      </Pressable>
                    ))}
                  </ScrollView>
                </Pressable>
                ) : null}

                {[
                  { title: draft.home.dealsTitle, action: draft.home.dealsActionLabel, icon: "flash" as IconName, color: colors.accent },
                  { title: draft.home.featuredTitle, action: draft.home.featuredActionLabel, icon: "star" as IconName, color: colors.star },
                ].map((section) => (
                  <View key={section.title} style={{ marginTop: spacing.xl, order: 20 } as ViewStyle}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                        <Ionicons name={section.icon} size={20} color={section.color} />
                        <Text style={{ color: livePreviewColors.text, fontSize: 22, fontWeight: "900" }}>{section.title}</Text>
                      </View>
                      <Text style={{ color: livePreviewColors.primary, fontSize: 13, fontWeight: "900" }}>{section.action}</Text>
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: isPreviewDesktop ? "wrap" : "nowrap", gap: spacing.md }}>
                      {productCards.map((item) => (
                        <View
                          key={`${section.title}-${item.title}`}
                          style={{
                            width: isPreviewDesktop ? 220 : 160,
                            borderRadius: radius.lg,
                            borderWidth: 1,
                            borderColor: livePreviewColors.border,
                            backgroundColor: livePreviewColors.surface,
                            overflow: "hidden",
                          }}
                        >
                          <Image source={{ uri: item.image }} resizeMode="cover" style={{ width: "100%", height: 132 }} />
                          <View style={{ padding: spacing.md, gap: spacing.xs }}>
                            <Text style={{ color: livePreviewColors.text, fontSize: 13, fontWeight: "900" }} numberOfLines={2}>
                              {item.title}
                            </Text>
                            <Text style={{ color: livePreviewColors.muted, fontSize: 12, fontWeight: "700" }}>4.8 | $180-$220</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {isDesktop ? (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 18,
                alignItems: "center",
              }}
              pointerEvents="box-none"
            >
              <View
                style={{
                  minHeight: 44,
                  borderRadius: 10,
                  backgroundColor: "#140820",
                  paddingHorizontal: spacing.sm,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  ...shadows.card,
                }}
              >
                {[
                  { icon: "add-outline" as IconName, onPress: addActiveSectionItem, disabled: !canAddActiveSection },
                  { icon: "trash-outline" as IconName, onPress: removeActiveSectionItem, disabled: !canRemoveActiveSection },
                  { icon: "refresh-outline" as IconName, onPress: onReset },
                  { icon: "settings-outline" as IconName, onPress: () => setInspectorOpen((value) => !value) },
                  { icon: "code-slash-outline" as IconName, onPress: () => onActiveSectionChange("sections") },
                  { icon: "desktop-outline" as IconName, mode: "desktop" as const },
                  { icon: "tablet-portrait-outline" as IconName, mode: "mobile" as const },
                  { icon: "phone-portrait-outline" as IconName, mode: "mobile" as const },
                ].map((item, index) => {
                  const activeMode = item.mode && previewMode === item.mode;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={`${item.icon}-${index}`}
                      onPress={() => {
                        if (item.disabled) {
                          return;
                        }
                        if (item.mode) {
                          setPreviewMode(item.mode);
                        }
                        item.onPress?.();
                      }}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: activeMode ? "#4B4059" : index === 0 ? "#1688F0" : "transparent",
                        opacity: item.disabled ? 0.45 : 1,
                      }}
                    >
                      <Ionicons name={item.icon} size={16} color={colors.white} />
                    </Pressable>
                  );
                })}
                <Text style={{ color: colors.white, fontSize: 12, fontWeight: "900", marginHorizontal: spacing.sm }}>100%</Text>
              </View>
            </View>
          ) : null}
        </View>

        {inspectorOpen ? (
        <>
        <Splitter side="right" />
        <ScrollView
          style={{
            width: isDesktop ? inspectorWidth : "100%",
            borderLeftWidth: isDesktop ? 1 : 0,
            borderTopWidth: isDesktop ? 0 : 1,
            borderColor: adminColors.line,
            backgroundColor: colors.white,
          }}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
              <Ionicons
                name={activeSection === "hero" ? "image-outline" : activeSection === "mediaShowcase" ? "play-circle-outline" : "albums-outline"}
                size={16}
                color={adminColors.ink}
              />
              <Text style={{ color: adminColors.ink, fontSize: 15, fontWeight: "900" }} numberOfLines={1}>
                {editorSectionLabel}
              </Text>
            </View>
            <IconButton
              icon="ellipsis-horizontal"
              backgroundColor="#F6F7F9"
              onPress={() => showToast("info", "Section", `${editorSectionLabel} settings are open.`)}
            />
            <IconButton icon="close-outline" backgroundColor="#F6F7F9" onPress={() => setInspectorOpen(false)} />
          </View>

          <View style={{ gap: spacing.sm }}>
            <Text style={{ color: adminColors.muted, fontSize: 12, fontWeight: "900" }}>Quick Edit</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {sections.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  key={item.key}
                  onPress={() => onActiveSectionChange(item.key)}
                  style={{
                    minHeight: 30,
                    borderRadius: 7,
                    paddingHorizontal: spacing.sm,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: activeSection === item.key ? "#0B887B" : "#F6F7F9",
                  }}
                >
                  <Text
                    style={{
                      color: activeSection === item.key ? colors.white : adminColors.muted,
                      fontSize: 11,
                      fontWeight: "900",
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {activeSection === "promo" ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {promoItems.map((item, index) => (
                  <Pressable
                    accessibilityRole="button"
                    key={item.id}
                    onPress={() => setSelectedPromoIndex(index)}
                    style={{
                      width: 86,
                      borderRadius: 8,
                      borderWidth: selectedPromoIndex === index ? 2 : 1,
                      borderColor: selectedPromoIndex === index ? "#1688F0" : adminColors.line,
                      overflow: "hidden",
                      backgroundColor: colors.white,
                    }}
                  >
                    <Image source={{ uri: item.image }} resizeMode="cover" style={{ width: "100%", height: 50 }} />
                    <Text style={{ color: adminColors.ink, fontSize: 10, fontWeight: "900", padding: 6 }} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {activeSection === "category" ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {categoryItems.map((item, index) => (
                  <Pressable
                    accessibilityRole="button"
                    key={item.id}
                    onPress={() => setSelectedCategoryIndex(index)}
                    style={{
                      width: 74,
                      borderRadius: 8,
                      borderWidth: selectedCategoryIndex === index ? 2 : 1,
                      borderColor: selectedCategoryIndex === index ? "#1688F0" : adminColors.line,
                      overflow: "hidden",
                      backgroundColor: colors.white,
                    }}
                  >
                    <Image source={{ uri: item.image }} resizeMode="cover" style={{ width: "100%", height: 48 }} />
                    <Text style={{ color: adminColors.ink, fontSize: 10, fontWeight: "900", padding: 6 }} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {activeSection === "mediaShowcase" ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {mediaItems.map((item, index) => (
                  <Pressable
                    accessibilityRole="button"
                    key={item.id}
                    onPress={() => setSelectedMediaIndex(index)}
                    style={{
                      width: 86,
                      borderRadius: 8,
                      borderWidth: selectedMediaIndex === index ? 2 : 1,
                      borderColor: selectedMediaIndex === index ? "#1688F0" : adminColors.line,
                      overflow: "hidden",
                      backgroundColor: colors.white,
                    }}
                  >
                    <Image source={{ uri: item.image }} resizeMode="cover" style={{ width: "100%", height: 50 }} />
                    <Text style={{ color: adminColors.ink, fontSize: 10, fontWeight: "900", padding: 6 }} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {activeSection === "hero" && draft.home.heroes.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {draft.home.heroes.map((item, index) => (
                  <Pressable
                    accessibilityRole="button"
                    key={item.id}
                    onPress={() => setSelectedHeroIndex(index)}
                    style={{
                      width: 100,
                      borderRadius: 8,
                      borderWidth: selectedHeroIndex === index ? 2 : 1,
                      borderColor: selectedHeroIndex === index ? "#1688F0" : adminColors.line,
                      overflow: "hidden",
                      backgroundColor: colors.white,
                    }}
                  >
                    <Image source={{ uri: item.image }} resizeMode="cover" style={{ width: "100%", height: 56 }} />
                    <Text style={{ color: adminColors.ink, fontSize: 10, fontWeight: "900", padding: 6 }} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {activeSection === "lovedOnes" ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {draft.home.lovedOnes.map((item, index) => (
                  <Pressable
                    accessibilityRole="button"
                    key={item.id}
                    onPress={() => setSelectedLovedIndex(index)}
                    style={{
                      width: 86,
                      borderRadius: 8,
                      borderWidth: selectedLovedIndex === index ? 2 : 1,
                      borderColor: selectedLovedIndex === index ? "#1688F0" : adminColors.line,
                      overflow: "hidden",
                      backgroundColor: colors.white,
                    }}
                  >
                    <Image source={{ uri: item.image }} resizeMode="cover" style={{ width: "100%", height: 50 }} />
                    <Text style={{ color: adminColors.ink, fontSize: 10, fontWeight: "900", padding: 6 }} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>

          {canAddActiveSection ? (
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <ActionButton label="Add" icon="add-outline" ghost onPress={addActiveSectionItem} />
              <ActionButton
                label="Delete"
                icon="trash-outline"
                tone={colors.danger}
                ghost
                onPress={removeActiveSectionItem}
                disabled={!canRemoveActiveSection}
              />
            </View>
          ) : null}

          {isHideableSection(activeSection) ? (
            <ActionButton
              label={isSectionHidden(activeSection) ? "Unhide Section" : "Hide Section"}
              icon={isSectionHidden(activeSection) ? "eye-outline" : "eye-off-outline"}
              ghost
              tone={isSectionHidden(activeSection) ? colors.success : colors.danger}
              onPress={() => toggleSectionHidden(activeSection)}
            />
          ) : null}

          <InspectorGroup title="Content">
            <View style={{ borderLeftWidth: 3, borderLeftColor: selectedAccent, paddingLeft: spacing.md, gap: spacing.md }}>
              <RenderActiveFields />
            </View>
          </InspectorGroup>

          <InspectorGroup title="Selector">
            <View
              style={{
                height: 36,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: adminColors.line,
                backgroundColor: "#FAFBFC",
                paddingHorizontal: spacing.md,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              <Ionicons name="code-slash-outline" size={14} color={adminColors.muted} />
              <Text style={{ color: adminColors.muted, fontSize: 12 }} numberOfLines={1}>
                Select a class or tag
              </Text>
            </View>
          </InspectorGroup>

          <InspectorGroup title="Layout">
            <View style={{ flexDirection: "row", gap: 4 }}>
              <InspectorPill label="Block" active />
              <InspectorPill label="Flex" />
              <InspectorPill label="Grid" active={activeSection === "promo"} />
              <InspectorPill label="None" />
            </View>
          </InspectorGroup>

          <InspectorGroup title="Spacing">
            <View
              style={{
                height: 124,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: "#D9DEE6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 150,
                  height: 70,
                  borderWidth: 2,
                  borderColor: "#1688F0",
                  borderRadius: 4,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View style={{ width: 38, height: 28, borderRadius: 4, backgroundColor: "#1688F0", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="link-outline" size={16} color={colors.white} />
                </View>
                <Text style={{ position: "absolute", top: -20, color: adminColors.ink, fontSize: 10, fontWeight: "900" }}>24</Text>
                <Text style={{ position: "absolute", left: -24, color: adminColors.ink, fontSize: 10, fontWeight: "900" }}>32</Text>
                <Text style={{ position: "absolute", right: -24, color: adminColors.ink, fontSize: 10, fontWeight: "900" }}>32</Text>
                <Text style={{ position: "absolute", bottom: -20, color: adminColors.ink, fontSize: 10, fontWeight: "900" }}>32</Text>
              </View>
            </View>
          </InspectorGroup>

          <InspectorGroup title="Size">
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <NumberBox value="Auto" label="Width" />
              <NumberBox value="Auto" label="Height" />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <NumberBox value="0" label="Min W" />
              <NumberBox value="0" label="Min H" />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <NumberBox value="None" label="Max W" />
              <NumberBox value="None" label="Max H" />
            </View>
          </InspectorGroup>

          <InspectorGroup title="Typography">
            <View style={{ flexDirection: "row", gap: 4 }}>
              {["align-left", "align-center", "align-right", "reorder-four"].map((name, index) => (
                <View key={name} style={{ flex: 1, height: 28, borderRadius: 6, alignItems: "center", justifyContent: "center", backgroundColor: index === 0 ? colors.white : "#F6F7F9", borderWidth: 1, borderColor: adminColors.line }}>
                  <Ionicons name={`${name}-outline` as IconName} size={15} color={adminColors.muted} />
                </View>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <NumberBox value="Roboto" label="" />
              <NumberBox value="20" label="px" />
            </View>
          </InspectorGroup>

        </ScrollView>
        </>
        ) : null}
      </View>
    </Panel>
  );
};

const FilterChip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={{
      borderRadius: 999,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      backgroundColor: active ? adminColors.teal : "#F8FAFC",
    }}
  >
    <Text
      style={{
        color: active ? colors.white : adminColors.muted,
        fontSize: 11,
        fontWeight: "900",
      }}
    >
      {label}
    </Text>
  </Pressable>
);

const Avatar = ({ name, index }: { name?: string; index: number }) => (
  <View
    style={{
      width: 30,
      height: 30,
      borderRadius: 7,
      backgroundColor: `${avatarColors[index % avatarColors.length]}18`,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Text
      style={{
        color: avatarColors[index % avatarColors.length],
        fontSize: 10,
        fontWeight: "900",
      }}
    >
      {getInitials(name)}
    </Text>
  </View>
);

const StatusBadge = ({
  label,
  tone,
}: {
  label: string;
  tone: string;
}) => (
  <View
    style={{
      alignSelf: "flex-start",
      borderRadius: 6,
      backgroundColor: `${tone}14`,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    }}
  >
    <Text
      style={{
        color: tone,
        fontWeight: "900",
        fontSize: 11,
        textTransform: "capitalize",
      }}
    >
      {label}
    </Text>
  </View>
);

const EmptyState = ({ label }: { label: string }) => (
  <View style={{ minHeight: 120, alignItems: "center", justifyContent: "center" }}>
    <Text style={{ color: adminColors.muted, fontWeight: "800", textAlign: "center" }}>{label}</Text>
  </View>
);

const SummaryCard = ({
  label,
  value,
  icon,
  tone,
  backgroundColor,
}: {
  label: string;
  value: string;
  icon: IconName;
  tone: string;
  backgroundColor: string;
}) => (
  <Panel
    style={{
      flex: 1,
      minWidth: 178,
      padding: spacing.md,
      backgroundColor,
    }}
  >
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: adminColors.muted, fontSize: 12, fontWeight: "800" }} numberOfLines={1}>
          {label}
        </Text>
        <Text
          style={{ color: adminColors.ink, fontSize: 22, fontWeight: "900", marginTop: 6 }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${tone}18`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={tone} />
      </View>
    </View>
  </Panel>
);

const Sidebar = ({
  activeView,
  onSelectView,
  onSignOut,
  childrenByView,
  counts,
}: {
  activeView: AdminView;
  onSelectView: (view: AdminView) => void;
  onSignOut: () => void;
  childrenByView: Partial<
    Record<
      AdminView,
      {
        label: string;
        active: boolean;
        color: string;
        onPress: () => void;
        hidden?: boolean;
        canMoveUp?: boolean;
        canMoveDown?: boolean;
        onToggleHidden?: () => void;
        onMoveUp?: () => void;
        onMoveDown?: () => void;
      }[]
    >
  >;
  counts: Partial<Record<AdminView, number>>;
}) => (
  <View
    style={{
      width: 220,
      backgroundColor: colors.white,
      borderRightWidth: 1,
      borderRightColor: adminColors.line,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      justifyContent: "space-between",
    }}
  >
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingHorizontal: spacing.sm,
          marginBottom: spacing.xl,
        }}
      >
        <Image
          source={startupLogo}
          resizeMode="contain"
          style={{ width: 30, height: 30, borderRadius: 6 }}
        />
        <Text style={{ color: colors.primaryDark, fontSize: 18, fontWeight: "900" }} numberOfLines={1}>
          SachinIndia
        </Text>
      </View>

      <View style={{ gap: 5 }}>
        {adminViews.map((item) => {
          const isActive = item.key === activeView;
          const itemCount = counts[item.key] || 0;
          const children = childrenByView[item.key] || [];

          return (
            <View key={item.key}>
              <Pressable
                accessibilityRole="button"
                onPress={() => onSelectView(item.key)}
                style={{
                  minHeight: 38,
                  borderRadius: 8,
                  paddingHorizontal: spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  backgroundColor: isActive ? adminColors.teal : "transparent",
                }}
              >
                <Ionicons name={item.icon} size={16} color={isActive ? colors.white : adminColors.muted} />
                <Text
                  style={{
                    flex: 1,
                    color: isActive ? colors.white : "#4B5563",
                    fontSize: 13,
                    fontWeight: isActive ? "900" : "700",
                  }}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
                {itemCount > 0 ? (
                  <View
                    style={{
                      minWidth: 20,
                      height: 20,
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 5,
                      backgroundColor: isActive ? "rgba(255,255,255,0.2)" : adminColors.orangeSoft,
                    }}
                  >
                    <Text
                      style={{
                        color: isActive ? colors.white : colors.accent,
                        fontSize: 10,
                        fontWeight: "900",
                      }}
                    >
                      {itemCount}
                    </Text>
                  </View>
                ) : null}
              </Pressable>

              {isActive && children.length > 0 ? (
                <View style={{ gap: 3, paddingTop: 6, paddingBottom: 6, paddingLeft: spacing.lg }}>
                  {children.map((child) => (
                    <Pressable
                      accessibilityRole="button"
                      key={child.label}
                      onPress={child.onPress}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                        minHeight: 28,
                        borderRadius: 6,
                        paddingHorizontal: spacing.sm,
                        backgroundColor: child.active ? adminColors.tealSoft : "transparent",
                        opacity: child.hidden ? 0.58 : 1,
                      }}
                    >
                      <View
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: 4,
                          backgroundColor: child.color,
                        }}
                      />
                      <Text
                        style={{
                          flex: 1,
                          color: child.active ? colors.primary : "#4B5563",
                          fontSize: 12,
                          fontWeight: child.active ? "900" : "700",
                        }}
                        numberOfLines={1}
                      >
                        {child.label}
                      </Text>
                      {child.onToggleHidden ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={(event) => {
                            event.stopPropagation();
                            child.onToggleHidden?.();
                          }}
                          style={{ width: 20, height: 22, alignItems: "center", justifyContent: "center" }}
                        >
                          <Ionicons
                            name={child.hidden ? "eye-off-outline" : "eye-outline"}
                            size={13}
                            color={child.hidden ? colors.danger : adminColors.softMuted}
                          />
                        </Pressable>
                      ) : null}
                      {child.onMoveUp ? (
                        <Pressable
                          accessibilityRole="button"
                          disabled={!child.canMoveUp}
                          onPress={(event) => {
                            event.stopPropagation();
                            child.onMoveUp?.();
                          }}
                          style={{ width: 18, height: 22, alignItems: "center", justifyContent: "center", opacity: child.canMoveUp ? 1 : 0.3 }}
                        >
                          <Ionicons name="chevron-up-outline" size={12} color={adminColors.softMuted} />
                        </Pressable>
                      ) : null}
                      {child.onMoveDown ? (
                        <Pressable
                          accessibilityRole="button"
                          disabled={!child.canMoveDown}
                          onPress={(event) => {
                            event.stopPropagation();
                            child.onMoveDown?.();
                          }}
                          style={{ width: 18, height: 22, alignItems: "center", justifyContent: "center", opacity: child.canMoveDown ? 1 : 0.3 }}
                        >
                          <Ionicons name="chevron-down-outline" size={12} color={adminColors.softMuted} />
                        </Pressable>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>

    <Pressable
      accessibilityRole="button"
      onPress={onSignOut}
      style={{
        borderRadius: 8,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: "#F8FAFC",
      }}
    >
      <Ionicons name="log-out-outline" size={17} color={colors.danger} />
      <Text style={{ color: colors.danger, fontWeight: "900", fontSize: 13 }}>Sign Out</Text>
    </Pressable>
  </View>
);

const MobileNav = ({
  activeView,
  onSelectView,
}: {
  activeView: AdminView;
  onSelectView: (view: AdminView) => void;
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={{ backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: adminColors.line }}
    contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm }}
  >
    {adminViews.map((item) => (
      <Pressable
        accessibilityRole="button"
        key={item.key}
        onPress={() => onSelectView(item.key)}
        style={{
          minHeight: 36,
          borderRadius: 999,
          paddingHorizontal: spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          backgroundColor: activeView === item.key ? adminColors.teal : "#F8FAFC",
        }}
      >
        <Ionicons
          name={item.icon}
          size={15}
          color={activeView === item.key ? colors.white : adminColors.muted}
        />
        <Text
          style={{
            color: activeView === item.key ? colors.white : adminColors.muted,
            fontWeight: "900",
            fontSize: 12,
          }}
        >
          {item.label}
        </Text>
      </Pressable>
    ))}
  </ScrollView>
);

const TopBar = ({
  title,
  searchTerm,
  onSearchChange,
  adminName,
  adminEmail,
  compact,
  onSignOut,
  primaryLabel,
  primaryIcon,
  onPrimaryAction,
}: {
  title: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  adminName: string;
  adminEmail: string;
  compact: boolean;
  onSignOut: () => void;
  primaryLabel: string;
  primaryIcon: IconName;
  onPrimaryAction: () => void;
}) => (
  <View
    style={{
      minHeight: 66,
      paddingHorizontal: compact ? spacing.md : spacing.lg,
      paddingVertical: spacing.md,
      flexDirection: compact ? "column" : "row",
      alignItems: compact ? "stretch" : "center",
      gap: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: adminColors.line,
      backgroundColor: colors.white,
    }}
  >
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        flex: compact ? 0 : 1,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        {compact ? (
          <Image
            source={startupLogo}
            resizeMode="contain"
            style={{ width: 28, height: 28, borderRadius: 6 }}
          />
        ) : null}
        <Text style={{ color: adminColors.ink, fontSize: 22, fontWeight: "900" }} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {compact ? (
        <Pressable
          accessibilityRole="button"
          onPress={onSignOut}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F8FAFC",
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        </Pressable>
      ) : null}
    </View>

    <SearchField
      value={searchTerm}
      onChangeText={onSearchChange}
      compact={compact}
      placeholder={`Search ${title.toLowerCase()}`}
    />

    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: compact ? "space-between" : "flex-end",
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: "row", gap: spacing.xs }}>
        <IconButton
          icon="notifications-outline"
          badge
          backgroundColor="#F8FAFC"
          onPress={() => showToast("info", "Notifications", "Use Wallet Queue and Seller Reviews for pending alerts.")}
        />
        <IconButton
          icon="sunny-outline"
          backgroundColor="#F8FAFC"
          onPress={() => showToast("info", "Appearance", "Admin dashboard is using the light workspace theme.")}
        />
        <IconButton
          icon="shield-checkmark-outline"
          backgroundColor="#F8FAFC"
          onPress={() => showToast("info", "Admin access", "You are signed in with dashboard controls enabled.")}
        />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: adminColors.blueSoft,
          }}
        >
          <Text style={{ color: colors.primaryDark, fontWeight: "900", fontSize: 12 }}>
            {getInitials(adminName)}
          </Text>
        </View>
        {!compact ? (
          <View style={{ maxWidth: 150 }}>
            <Text style={{ color: adminColors.ink, fontWeight: "900", fontSize: 12 }} numberOfLines={1}>
              {adminName}
            </Text>
            <Text style={{ color: adminColors.muted, fontSize: 10 }} numberOfLines={1}>
              {adminEmail}
            </Text>
          </View>
        ) : null}
      </View>

      <ActionButton label={primaryLabel} icon={primaryIcon} onPress={onPrimaryAction} />
    </View>
  </View>
);

const TableCell = ({
  children,
  width,
  flex,
  align = "flex-start",
}: {
  children: ReactNode;
  width?: number;
  flex?: number;
  align?: "flex-start" | "center" | "flex-end";
}) => (
  <View
    style={{
      width,
      flex,
      minHeight: 48,
      justifyContent: "center",
      alignItems: align,
      paddingHorizontal: spacing.sm,
    }}
  >
    {children}
  </View>
);

const OrderTableHeader = () => (
  <View
    style={{
      minWidth: 980,
      flexDirection: "row",
      alignItems: "center",
      minHeight: 44,
      backgroundColor: "#FAFAFB",
      borderRadius: 7,
    }}
  >
    <TableCell width={52}>
      <View style={{ width: 16, height: 16, borderRadius: 3, borderWidth: 1, borderColor: adminColors.lineStrong }} />
    </TableCell>
    <TableCell width={120}>
      <Text style={{ color: adminColors.ink, fontSize: 12, fontWeight: "900" }}>Invoice</Text>
    </TableCell>
    <TableCell flex={1}>
      <Text style={{ color: adminColors.ink, fontSize: 12, fontWeight: "900" }}>Customer</Text>
    </TableCell>
    <TableCell width={150}>
      <Text style={{ color: adminColors.ink, fontSize: 12, fontWeight: "900" }}>Issued Date</Text>
    </TableCell>
    <TableCell width={130}>
      <Text style={{ color: adminColors.ink, fontSize: 12, fontWeight: "900" }}>Amount</Text>
    </TableCell>
    <TableCell width={120}>
      <Text style={{ color: adminColors.ink, fontSize: 12, fontWeight: "900" }}>Status</Text>
    </TableCell>
    <TableCell width={130} align="center">
      <Text style={{ color: adminColors.ink, fontSize: 12, fontWeight: "900" }}>Action</Text>
    </TableCell>
  </View>
);

const OrderRow = ({
  order,
  index,
  busyKey,
  onAdvance,
  onInspect,
}: {
  order: Order;
  index: number;
  busyKey: string | null;
  onAdvance: (order: Order) => void;
  onInspect: (order: Order) => void;
}) => {
  const nextStatus = nextStatusMap[order.status];
  const isBusy = busyKey === `order-${order.orderId}`;

  return (
    <View
      style={{
        minWidth: 980,
        flexDirection: "row",
        alignItems: "center",
        minHeight: 54,
        borderBottomWidth: 1,
        borderBottomColor: adminColors.line,
      }}
    >
      <TableCell width={52}>
        <View style={{ width: 16, height: 16, borderRadius: 3, borderWidth: 1, borderColor: adminColors.lineStrong }} />
      </TableCell>
      <TableCell width={120}>
        <Text style={{ color: adminColors.teal, fontSize: 12, fontWeight: "900" }}>
          #{truncateId(order.orderId, 6)}
        </Text>
      </TableCell>
      <TableCell flex={1}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, maxWidth: 260 }}>
          <Avatar name={order.buyerName} index={index} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: adminColors.ink, fontSize: 12, fontWeight: "900" }} numberOfLines={1}>
              {order.buyerName || "ShopApp User"}
            </Text>
            <Text style={{ color: adminColors.muted, fontSize: 10, marginTop: 2 }} numberOfLines={1}>
              {order.paymentMethod || order.buyerEmail || "payment"}
            </Text>
          </View>
        </View>
      </TableCell>
      <TableCell width={150}>
        <Text style={{ color: adminColors.muted, fontSize: 12 }}>{formatDate(order.createdAt)}</Text>
      </TableCell>
      <TableCell width={130}>
        <Text style={{ color: adminColors.ink, fontSize: 12, fontWeight: "900" }}>
          {formatCurrency(order.totalAmount)}
        </Text>
      </TableCell>
      <TableCell width={120}>
        <StatusBadge label={order.status} tone={orderStatusColors[order.status] || colors.primary} />
      </TableCell>
      <TableCell width={130} align="center">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <IconButton icon="eye-outline" color={colors.primary} backgroundColor={adminColors.blueSoft} onPress={() => onInspect(order)} />
          <IconButton
            icon={isBusy ? "hourglass-outline" : "arrow-forward-outline"}
            color={nextStatus ? adminColors.teal : adminColors.softMuted}
            backgroundColor={adminColors.tealSoft}
            disabled={!nextStatus || isBusy}
            onPress={() => onAdvance(order)}
          />
          <IconButton
            icon="receipt-outline"
            color={colors.accent}
            backgroundColor={adminColors.orangeSoft}
            onPress={() => onInspect(order)}
          />
        </View>
      </TableCell>
    </View>
  );
};

const MobileOrderCard = ({
  order,
  index,
  busyKey,
  onAdvance,
  onInspect,
}: {
  order: Order;
  index: number;
  busyKey: string | null;
  onAdvance: (order: Order) => void;
  onInspect: (order: Order) => void;
}) => {
  const nextStatus = nextStatusMap[order.status];
  const isBusy = busyKey === `order-${order.orderId}`;

  return (
    <Panel style={{ padding: spacing.md, gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
        <Avatar name={order.buyerName} index={index} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: adminColors.teal, fontWeight: "900" }}>#{truncateId(order.orderId, 6)}</Text>
          <Text style={{ color: adminColors.ink, fontSize: 16, fontWeight: "900", marginTop: 3 }} numberOfLines={1}>
            {order.buyerName || "ShopApp User"}
          </Text>
          <Text style={{ color: adminColors.muted, marginTop: 3 }}>{formatDate(order.createdAt)}</Text>
        </View>
        <StatusBadge label={order.status} tone={orderStatusColors[order.status] || colors.primary} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
        <Text style={{ color: adminColors.muted, fontWeight: "800" }}>Amount</Text>
        <Text style={{ color: adminColors.ink, fontWeight: "900" }}>{formatCurrency(order.totalAmount)}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <ActionButton label="View" icon="eye-outline" tone={colors.primary} ghost onPress={() => onInspect(order)} />
        <ActionButton
          label={isBusy ? "Updating" : nextStatus ? `Move to ${nextStatus}` : "Complete"}
          icon={isBusy ? "hourglass-outline" : "arrow-forward-outline"}
          disabled={!nextStatus || isBusy}
          onPress={() => onAdvance(order)}
        />
      </View>
    </Panel>
  );
};

const OrdersPanel = ({
  title,
  orders,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortMode,
  onSortModeChange,
  isDesktop,
  busyKey,
  maxRows,
  onAdvance,
  onInspect,
}: {
  title: string;
  orders: Order[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  sortMode: OrderSortMode;
  onSortModeChange: (value: OrderSortMode) => void;
  isDesktop: boolean;
  busyKey: string | null;
  maxRows?: number;
  onAdvance: (order: Order) => void;
  onInspect: (order: Order) => void;
}) => {
  const visibleOrders = maxRows ? orders.slice(0, maxRows) : orders;
  const nextSortMode: OrderSortMode =
    sortMode === "latest" ? "amount" : sortMode === "amount" ? "oldest" : "latest";

  return (
    <Panel style={{ padding: isDesktop ? spacing.lg : spacing.md }}>
      <View
        style={{
          flexDirection: isDesktop ? "row" : "column",
          alignItems: isDesktop ? "center" : "stretch",
          justifyContent: "space-between",
          gap: spacing.md,
          marginBottom: spacing.lg,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: adminColors.ink, fontSize: 18, fontWeight: "900" }}>{title}</Text>
          <Text style={{ color: adminColors.muted, fontSize: 12, marginTop: 4 }}>
            Showing {visibleOrders.length} of {orders.length} invoices
          </Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          <SearchField value={searchTerm} onChangeText={onSearchChange} compact placeholder="Search orders" />
          <ActionButton
            label={`Sort: ${sortMode === "latest" ? "Latest" : sortMode === "oldest" ? "Oldest" : "Amount"}`}
            icon="filter-outline"
            tone={adminColors.ink}
            ghost
            onPress={() => onSortModeChange(nextSortMode)}
          />
        </View>
      </View>

      <ScrollView horizontal={!isDesktop} showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: isDesktop ? "100%" : 980 }}>
          {isDesktop ? (
            <>
              <OrderTableHeader />
              {visibleOrders.length === 0 ? (
                <EmptyState label="No invoices match this view." />
              ) : (
                visibleOrders.map((order, index) => (
                  <OrderRow
                    key={order.orderId}
                    order={order}
                    index={index}
                    busyKey={busyKey}
                    onAdvance={onAdvance}
                    onInspect={onInspect}
                  />
                ))
              )}
            </>
          ) : (
            <View style={{ gap: spacing.md }}>
              {visibleOrders.length === 0 ? (
                <EmptyState label="No invoices match this view." />
              ) : (
                visibleOrders.map((order, index) => (
                  <MobileOrderCard
                    key={order.orderId}
                    order={order}
                    index={index}
                    busyKey={busyKey}
                    onAdvance={onAdvance}
                    onInspect={onInspect}
                  />
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={{
          marginTop: spacing.md,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.xs,
          alignItems: "center",
        }}
      >
        {orderStatusFilters.map((filter) => (
          <FilterChip
            key={filter.value}
            label={filter.label}
            active={statusFilter === filter.value}
            onPress={() => onStatusFilterChange(filter.value)}
          />
        ))}
      </View>
    </Panel>
  );
};

const OrderDetailsPanel = ({
  order,
  onClose,
  onAdvance,
  busyKey,
}: {
  order: Order;
  onClose: () => void;
  onAdvance: (order: Order) => void;
  busyKey: string | null;
}) => {
  const nextStatus = nextStatusMap[order.status];
  const isBusy = busyKey === `order-${order.orderId}`;
  const address = order.deliveryAddress;

  return (
    <Panel style={{ padding: spacing.lg, gap: spacing.md }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: adminColors.ink, fontSize: 18, fontWeight: "900" }}>
            Invoice #{truncateId(order.orderId)}
          </Text>
          <Text style={{ color: adminColors.muted, marginTop: 4 }}>
            {order.buyerName} - {order.buyerEmail}
          </Text>
        </View>
        <IconButton icon="close-outline" backgroundColor="#F8FAFC" onPress={onClose} />
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
        {[
          { label: "Amount", value: formatCurrency(order.totalAmount) },
          { label: "Payment", value: order.paymentMethod || "N/A" },
          { label: "Payment Status", value: order.paymentStatus || "N/A" },
          { label: "Issued", value: formatDate(order.createdAt, true) },
        ].map((item) => (
          <View key={item.label} style={{ minWidth: 150, flex: 1, backgroundColor: "#F8FAFC", borderRadius: 8, padding: spacing.md }}>
            <Text style={{ color: adminColors.muted, fontSize: 12, fontWeight: "800" }}>{item.label}</Text>
            <Text style={{ color: adminColors.ink, fontWeight: "900", marginTop: 4 }} numberOfLines={1}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.lg }}>
        <View style={{ flex: 1, minWidth: 260 }}>
          <Text style={{ color: adminColors.ink, fontWeight: "900", marginBottom: spacing.sm }}>Items</Text>
          <View style={{ gap: spacing.sm }}>
            {order.items.map((item) => (
              <View key={`${order.orderId}-${item.productId}`} style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.md }}>
                <Text style={{ flex: 1, color: adminColors.muted }} numberOfLines={1}>
                  {item.quantity} x {item.name}
                </Text>
                <Text style={{ color: adminColors.ink, fontWeight: "900" }}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ flex: 1, minWidth: 260 }}>
          <Text style={{ color: adminColors.ink, fontWeight: "900", marginBottom: spacing.sm }}>Delivery</Text>
          <Text style={{ color: adminColors.muted, lineHeight: 20 }}>
            {address?.name || order.buyerName}
            {"\n"}
            {address?.phone || "Phone not added"}
            {"\n"}
            {[address?.street, address?.city, address?.state, address?.pincode].filter(Boolean).join(", ") || "Address not added"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        <StatusBadge label={order.status} tone={orderStatusColors[order.status] || colors.primary} />
        <ActionButton
          label={isBusy ? "Updating" : nextStatus ? `Move to ${nextStatus}` : "No Next Step"}
          icon={isBusy ? "hourglass-outline" : "arrow-forward-outline"}
          disabled={!nextStatus || isBusy}
          onPress={() => onAdvance(order)}
        />
      </View>
    </Panel>
  );
};

const QueueHeader = ({
  title,
  count,
  icon,
}: {
  title: string;
  count: number;
  icon: IconName;
}) => (
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: adminColors.tealSoft,
        }}
      >
        <Ionicons name={icon} size={17} color={adminColors.teal} />
      </View>
      <Text style={{ color: adminColors.ink, fontSize: 16, fontWeight: "900" }} numberOfLines={1}>
        {title}
      </Text>
    </View>
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        backgroundColor: count > 0 ? adminColors.orangeSoft : adminColors.greenSoft,
      }}
    >
      <Text style={{ color: count > 0 ? colors.accent : colors.success, fontSize: 11, fontWeight: "900" }}>
        {count}
      </Text>
    </View>
  </View>
);

const WalletRequestsPanel = ({
  requests,
  statusFilter,
  onStatusFilterChange,
  isPreview,
  busyKey,
  onApprove,
  onReject,
}: {
  requests: WalletTopUpRequest[];
  statusFilter: WalletStatusFilter;
  onStatusFilterChange: (value: WalletStatusFilter) => void;
  isPreview?: boolean;
  busyKey: string | null;
  onApprove: (request: WalletTopUpRequest) => void;
  onReject: (request: WalletTopUpRequest) => void;
}) => {
  const visibleRequests = isPreview ? requests.slice(0, 4) : requests;

  return (
    <Panel style={{ flex: 1, padding: spacing.lg, gap: spacing.md }}>
      <QueueHeader title="Wallet Approval Queue" count={requests.filter((item) => item.status === "pending").length} icon="wallet-outline" />

      {!isPreview ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
          {walletStatusFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              active={statusFilter === filter.value}
              onPress={() => onStatusFilterChange(filter.value)}
            />
          ))}
        </View>
      ) : null}

      {visibleRequests.length === 0 ? (
        <Text style={{ color: adminColors.muted, fontWeight: "700" }}>No wallet requests in this view.</Text>
      ) : (
        visibleRequests.map((item, index) => (
          <View
            key={item.id}
            style={{
              borderWidth: 1,
              borderColor: adminColors.line,
              borderRadius: 8,
              padding: spacing.md,
              gap: spacing.md,
              backgroundColor: "#FCFDFE",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <Avatar name={item.userName} index={index} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: adminColors.ink, fontWeight: "900" }} numberOfLines={1}>
                  {item.userName}
                </Text>
                <Text style={{ color: adminColors.muted, fontSize: 12 }} numberOfLines={1}>
                  UTR {item.utr} - {formatDate(item.submittedAt, true)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 5 }}>
                <Text style={{ color: adminColors.teal, fontSize: 18, fontWeight: "900" }}>
                  {formatCurrency(item.amount)}
                </Text>
                <StatusBadge
                  label={item.status}
                  tone={item.status === "approved" ? colors.success : item.status === "rejected" ? colors.danger : colors.accent}
                />
              </View>
            </View>

            {item.status === "pending" ? (
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <ActionButton
                  label={busyKey === `approve-${item.id}` ? "Approving" : "Approve"}
                  icon="checkmark-circle-outline"
                  disabled={busyKey === `approve-${item.id}`}
                  onPress={() => onApprove(item)}
                />
                <ActionButton
                  label={busyKey === `reject-${item.id}` ? "Rejecting" : "Reject"}
                  icon="close-circle-outline"
                  tone={colors.danger}
                  ghost
                  disabled={busyKey === `reject-${item.id}`}
                  onPress={() => onReject(item)}
                />
              </View>
            ) : null}
          </View>
        ))
      )}
    </Panel>
  );
};

const SellersPanel = ({
  sellers,
  statusFilter,
  onStatusFilterChange,
  productsBySeller,
  busyKey,
  onApprove,
  onPause,
  isPreview,
}: {
  sellers: UserProfile[];
  statusFilter: SellerStatusFilter;
  onStatusFilterChange: (value: SellerStatusFilter) => void;
  productsBySeller: Record<string, number>;
  busyKey: string | null;
  onApprove: (seller: UserProfile) => void;
  onPause: (seller: UserProfile) => void;
  isPreview?: boolean;
}) => {
  const visibleSellers = isPreview ? sellers.filter((seller) => !seller.storeApproved).slice(0, 5) : sellers;

  return (
    <Panel style={{ flex: 1, padding: spacing.lg, gap: spacing.md }}>
      <QueueHeader
        title="Seller Reviews"
        count={sellers.filter((seller) => !seller.storeApproved).length}
        icon="storefront-outline"
      />

      {!isPreview ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
          {sellerStatusFilters.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              active={statusFilter === filter.value}
              onPress={() => onStatusFilterChange(filter.value)}
            />
          ))}
        </View>
      ) : null}

      {visibleSellers.length === 0 ? (
        <Text style={{ color: adminColors.muted, fontWeight: "700" }}>No sellers in this view.</Text>
      ) : (
        visibleSellers.map((seller, index) => (
          <View
            key={seller.uid}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: adminColors.line,
              paddingBottom: spacing.md,
            }}
          >
            <Avatar name={seller.name} index={index + 2} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: adminColors.ink, fontWeight: "900" }} numberOfLines={1}>
                {seller.storeName || seller.name}
              </Text>
              <Text style={{ color: adminColors.muted, fontSize: 12 }} numberOfLines={1}>
                {seller.email} - {productsBySeller[seller.uid] || 0} products
              </Text>
            </View>
            {seller.storeApproved ? (
              <ActionButton
                label={busyKey === `pause-seller-${seller.uid}` ? "Pausing" : "Pause"}
                icon="pause-circle-outline"
                tone={colors.danger}
                ghost
                disabled={busyKey === `pause-seller-${seller.uid}`}
                onPress={() => onPause(seller)}
              />
            ) : (
              <ActionButton
                label={busyKey === `seller-${seller.uid}` ? "Approving" : "Approve"}
                icon="checkmark-circle-outline"
                tone={colors.success}
                disabled={busyKey === `seller-${seller.uid}`}
                onPress={() => onApprove(seller)}
              />
            )}
          </View>
        ))
      )}
    </Panel>
  );
};

const CatalogSnapshotPanel = ({
  activeProducts,
  outOfStockProducts,
  approvedSellers,
  totalWalletBalance,
  products,
}: {
  activeProducts: Product[];
  outOfStockProducts: Product[];
  approvedSellers: UserProfile[];
  totalWalletBalance: number;
  products: Product[];
}) => (
  <Panel style={{ flex: 1, padding: spacing.lg, gap: spacing.md }}>
    <QueueHeader title="Catalog Snapshot" count={products.length} icon="cube-outline" />
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
      {[
        { label: "Active", value: activeProducts.length, tone: colors.primary },
        { label: "Out Stock", value: outOfStockProducts.length, tone: colors.danger },
        { label: "Sellers", value: approvedSellers.length, tone: colors.success },
        { label: "Wallets", value: formatCurrency(totalWalletBalance), tone: colors.accent },
      ].map((item) => (
        <View
          key={item.label}
          style={{
            flex: 1,
            minWidth: 118,
            borderRadius: 8,
            padding: spacing.md,
            backgroundColor: `${item.tone}10`,
          }}
        >
          <Text style={{ color: item.tone, fontSize: 18, fontWeight: "900" }} numberOfLines={1}>
            {item.value}
          </Text>
          <Text style={{ color: adminColors.muted, marginTop: 4, fontSize: 12, fontWeight: "800" }}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  </Panel>
);

const ProductManagementPanel = ({
  products,
  statusFilter,
  onStatusFilterChange,
  busyKey,
  onToggleActive,
  onToggleDeal,
  onToggleFeatured,
}: {
  products: Product[];
  statusFilter: ProductStatusFilter;
  onStatusFilterChange: (value: ProductStatusFilter) => void;
  busyKey: string | null;
  onToggleActive: (product: Product) => void;
  onToggleDeal: (product: Product) => void;
  onToggleFeatured: (product: Product) => void;
}) => (
  <Panel style={{ padding: spacing.lg, gap: spacing.md }}>
    <QueueHeader title="Product Control" count={products.length} icon="cube-outline" />
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
      {productStatusFilters.map((filter) => (
        <FilterChip
          key={filter.value}
          label={filter.label}
          active={statusFilter === filter.value}
          onPress={() => onStatusFilterChange(filter.value)}
        />
      ))}
    </View>

    {products.length === 0 ? (
      <EmptyState label="No products match this view." />
    ) : (
      <View style={{ gap: spacing.sm }}>
        {products.map((product, index) => (
          <View
            key={product.id}
            style={{
              borderWidth: 1,
              borderColor: adminColors.line,
              borderRadius: 8,
              padding: spacing.md,
              gap: spacing.md,
              backgroundColor: "#FCFDFE",
            }}
          >
            <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
              <Avatar name={product.name} index={index} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: adminColors.ink, fontWeight: "900" }} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={{ color: adminColors.muted, fontSize: 12 }} numberOfLines={1}>
                  {product.sellerName} - {product.category} - stock {product.stock}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 5 }}>
                <Text style={{ color: adminColors.ink, fontWeight: "900" }}>{formatCurrency(product.price)}</Text>
                <StatusBadge
                  label={product.isActive ? "Active" : "Paused"}
                  tone={product.isActive ? colors.success : colors.danger}
                />
              </View>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              <ActionButton
                label={busyKey === `active-${product.id}` ? "Saving" : product.isActive ? "Pause" : "Activate"}
                icon={product.isActive ? "pause-circle-outline" : "play-circle-outline"}
                tone={product.isActive ? colors.danger : colors.success}
                ghost={product.isActive}
                disabled={busyKey === `active-${product.id}`}
                onPress={() => onToggleActive(product)}
              />
              <ActionButton
                label={busyKey === `deal-${product.id}` ? "Saving" : product.isDeal ? "Remove Deal" : "Deal"}
                icon="flash-outline"
                tone={colors.accent}
                ghost={product.isDeal}
                disabled={busyKey === `deal-${product.id}`}
                onPress={() => onToggleDeal(product)}
              />
              <ActionButton
                label={busyKey === `featured-${product.id}` ? "Saving" : product.isFeatured ? "Unfeature" : "Feature"}
                icon="star-outline"
                tone={colors.purple}
                ghost={product.isFeatured}
                disabled={busyKey === `featured-${product.id}`}
                onPress={() => onToggleFeatured(product)}
              />
            </View>
          </View>
        ))}
      </View>
    )}
  </Panel>
);

const UsersPanel = ({
  users,
  roleFilter,
  onRoleFilterChange,
  busyKey,
  onApproveSeller,
  onMakeSeller,
  onMakeBuyer,
}: {
  users: UserProfile[];
  roleFilter: UserRoleFilter;
  onRoleFilterChange: (value: UserRoleFilter) => void;
  busyKey: string | null;
  onApproveSeller: (user: UserProfile) => void;
  onMakeSeller: (user: UserProfile) => void;
  onMakeBuyer: (user: UserProfile) => void;
}) => (
  <Panel style={{ padding: spacing.lg, gap: spacing.md }}>
    <QueueHeader title="Accounts" count={users.length} icon="people-outline" />
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
      {roleFilters.map((filter) => (
        <FilterChip
          key={filter.value}
          label={filter.label}
          active={roleFilter === filter.value}
          onPress={() => onRoleFilterChange(filter.value)}
        />
      ))}
    </View>

    {users.length === 0 ? (
      <EmptyState label="No users match this view." />
    ) : (
      <View style={{ gap: spacing.sm }}>
        {users.map((item, index) => (
          <View
            key={item.uid}
            style={{
              borderWidth: 1,
              borderColor: adminColors.line,
              borderRadius: 8,
              padding: spacing.md,
              gap: spacing.md,
              backgroundColor: "#FCFDFE",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <Avatar name={item.name} index={index + 3} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: adminColors.ink, fontWeight: "900" }} numberOfLines={1}>
                  {item.name || "ShopApp User"}
                </Text>
                <Text style={{ color: adminColors.muted, fontSize: 12 }} numberOfLines={1}>
                  {item.email}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 5 }}>
                <Text style={{ color: adminColors.teal, fontWeight: "900" }}>
                  {formatCurrency(item.walletBalance || 0)}
                </Text>
                <StatusBadge
                  label={item.role}
                  tone={item.role === "admin" ? colors.purple : item.role === "seller" ? colors.success : colors.primary}
                />
              </View>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {item.role === "seller" && !item.storeApproved ? (
                <ActionButton
                  label={busyKey === `seller-${item.uid}` ? "Approving" : "Approve Seller"}
                  icon="checkmark-circle-outline"
                  tone={colors.success}
                  disabled={busyKey === `seller-${item.uid}`}
                  onPress={() => onApproveSeller(item)}
                />
              ) : null}
              {item.role === "buyer" ? (
                <ActionButton
                  label={busyKey === `make-seller-${item.uid}` ? "Saving" : "Make Seller"}
                  icon="storefront-outline"
                  tone={adminColors.teal}
                  ghost
                  disabled={busyKey === `make-seller-${item.uid}`}
                  onPress={() => onMakeSeller(item)}
                />
              ) : null}
              {item.role === "seller" ? (
                <ActionButton
                  label={busyKey === `make-buyer-${item.uid}` ? "Saving" : "Set Buyer"}
                  icon="person-outline"
                  tone={colors.danger}
                  ghost
                  disabled={busyKey === `make-buyer-${item.uid}`}
                  onPress={() => onMakeBuyer(item)}
                />
              ) : null}
            </View>
          </View>
        ))}
      </View>
    )}
  </Panel>
);

export default function AdminDashboardScreen() {
  const { profile, user, loading } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 980;
  const isWide = width >= 1240;

  const [activeView, setActiveView] = useState<AdminView>("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [walletTopUps, setWalletTopUps] = useState<WalletTopUpRequest[]>([]);
  const [buyerPageContent, setBuyerPageContent] =
    useState<BuyerPageContent>(defaultBuyerPageContent);
  const [editorDraft, setEditorDraft] =
    useState<BuyerPageContent>(defaultBuyerPageContent);
  const [editorDirty, setEditorDirty] = useState(false);
  const [activeEditorSection, setActiveEditorSection] =
    useState<EditorSection>("hero");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<StatusFilter>("all");
  const [orderSortMode, setOrderSortMode] = useState<OrderSortMode>("latest");
  const [walletStatusFilter, setWalletStatusFilter] = useState<WalletStatusFilter>("pending");
  const [sellerStatusFilter, setSellerStatusFilter] = useState<SellerStatusFilter>("all");
  const [productStatusFilter, setProductStatusFilter] = useState<ProductStatusFilter>("all");
  const [userRoleFilter, setUserRoleFilter] = useState<UserRoleFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingState, setLoadingState] = useState({
    orders: true,
    products: true,
    users: true,
    walletTopUps: true,
  });

  useEffect(() => {
    const unsubscribeOrders = subscribeToAllOrders((value) => {
      setOrders(value);
      setLoadingState((current) => ({ ...current, orders: false }));
    });
    const unsubscribeProducts = subscribeToProducts((value) => {
      setProducts(value);
      setLoadingState((current) => ({ ...current, products: false }));
    });
    const unsubscribeUsers = subscribeToUsers((value) => {
      setUsers(value);
      setLoadingState((current) => ({ ...current, users: false }));
    });
    const unsubscribeWalletTopUps = subscribeToWalletTopUpRequests((value) => {
      setWalletTopUps(value);
      setLoadingState((current) => ({ ...current, walletTopUps: false }));
    });
    const unsubscribeBuyerPageContent = subscribeToBuyerPageContent((value) => {
      setBuyerPageContent(value);
      setEditorDraft(value);
      setEditorDirty(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeUsers();
      unsubscribeWalletTopUps();
      unsubscribeBuyerPageContent();
    };
  }, []);

  const pendingWalletTopUps = useMemo(
    () => walletTopUps.filter((item) => item.status === "pending"),
    [walletTopUps]
  );
  const sellers = useMemo(() => users.filter((item) => item.role === "seller"), [users]);
  const pendingSellers = useMemo(
    () => sellers.filter((item) => !item.storeApproved),
    [sellers]
  );
  const approvedSellers = useMemo(
    () => sellers.filter((item) => item.storeApproved),
    [sellers]
  );
  const activeProducts = useMemo(() => products.filter((item) => item.isActive), [products]);
  const outOfStockProducts = useMemo(() => products.filter((item) => item.stock <= 0), [products]);
  const liveOrders = useMemo(
    () => orders.filter((item) => item.status !== "delivered" && item.status !== "cancelled"),
    [orders]
  );
  const totalRevenue = useMemo(
    () => orders.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
    [orders]
  );
  const totalWalletBalance = useMemo(
    () => users.reduce((sum, item) => sum + (item.walletBalance || 0), 0),
    [users]
  );
  const productsBySeller = useMemo(
    () =>
      products.reduce<Record<string, number>>((result, product) => {
        result[product.sellerId] = (result[product.sellerId] || 0) + 1;
        return result;
      }, {}),
    [products]
  );

  const filteredOrders = useMemo(() => {
    return [...orders]
      .filter((order) => (orderStatusFilter === "all" ? true : order.status === orderStatusFilter))
      .filter((order) =>
        queryMatches(searchTerm, [
          order.orderId,
          order.buyerName,
          order.buyerEmail,
          order.paymentMethod,
          order.paymentStatus,
          order.status,
        ])
      )
      .sort((first, second) => {
        if (orderSortMode === "amount") {
          return (second.totalAmount || 0) - (first.totalAmount || 0);
        }
        if (orderSortMode === "oldest") {
          return getOrderTime(first) - getOrderTime(second);
        }
        return getOrderTime(second) - getOrderTime(first);
      });
  }, [orders, orderSortMode, orderStatusFilter, searchTerm]);

  const filteredWalletTopUps = useMemo(
    () =>
      walletTopUps
        .filter((item) => (walletStatusFilter === "all" ? true : item.status === walletStatusFilter))
        .filter((item) =>
          queryMatches(searchTerm, [item.userName, item.userEmail, item.utr, item.upiId, item.amount, item.status])
        ),
    [searchTerm, walletStatusFilter, walletTopUps]
  );

  const filteredSellers = useMemo(
    () =>
      sellers
        .filter((seller) => {
          if (sellerStatusFilter === "pending") {
            return !seller.storeApproved;
          }
          if (sellerStatusFilter === "approved") {
            return Boolean(seller.storeApproved);
          }
          return true;
        })
        .filter((seller) =>
          queryMatches(searchTerm, [seller.name, seller.email, seller.storeName, seller.phone, seller.upiId])
        ),
    [searchTerm, sellerStatusFilter, sellers]
  );

  const filteredProducts = useMemo(
    () =>
      products
        .filter((product) => {
          if (productStatusFilter === "active") {
            return product.isActive;
          }
          if (productStatusFilter === "paused") {
            return !product.isActive;
          }
          if (productStatusFilter === "deal") {
            return product.isDeal;
          }
          if (productStatusFilter === "out") {
            return product.stock <= 0;
          }
          return true;
        })
        .filter((product) =>
          queryMatches(searchTerm, [
            product.name,
            product.sellerName,
            product.category,
            product.brand,
            product.stock,
            product.price,
          ])
        ),
    [productStatusFilter, products, searchTerm]
  );

  const filteredUsers = useMemo(
    () =>
      users
        .filter((item) => (userRoleFilter === "all" ? true : item.role === userRoleFilter))
        .filter((item) =>
          queryMatches(searchTerm, [item.name, item.email, item.role, item.storeName, item.phone, item.walletBalance])
        ),
    [searchTerm, userRoleFilter, users]
  );

  const isLoading =
    loading ||
    loadingState.orders ||
    loadingState.products ||
    loadingState.users ||
    loadingState.walletTopUps;

  const runAction = async (key: string, action: () => Promise<void>) => {
    setBusyKey(key);
    try {
      await action();
    } catch (error) {
      console.error("[admin] action failed", key, error);
      const errorCode =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code)
          : "";
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message)
          : "";

      showToast(
        "error",
        "Admin action failed",
        errorCode.includes("permission-denied")
          ? "This account is not allowed to publish store content."
          : errorMessage || "Please try again in a moment."
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleAdvanceOrder = async (order: Order) => {
    const nextStatus = nextStatusMap[order.status];
    if (!nextStatus) {
      return;
    }

    await updateOrderStatus(order.orderId, nextStatus);
    showToast("success", "Order updated", `Order #${truncateId(order.orderId)} moved to ${nextStatus}.`);
  };

  const handleApproveSeller = async (target: UserProfile) => {
    await saveUserProfile(target.uid, {
      role: "seller",
      storeApproved: true,
      storeName: target.storeName || target.name,
    });
    showToast("success", "Seller approved", `${target.name} can now start selling.`);
  };

  const handlePauseSeller = async (target: UserProfile) => {
    await saveUserProfile(target.uid, {
      role: "seller",
      storeApproved: false,
    });
    showToast("success", "Seller paused", `${target.storeName || target.name} is no longer approved.`);
  };

  const handleMakeSeller = async (target: UserProfile) => {
    await saveUserProfile(target.uid, {
      role: "seller",
      storeApproved: false,
      storeName: target.storeName || target.name,
    });
    showToast("success", "Seller role added", `${target.name} is now waiting for seller approval.`);
  };

  const handleMakeBuyer = async (target: UserProfile) => {
    await saveUserProfile(target.uid, {
      role: "buyer",
      storeApproved: false,
    });
    showToast("success", "Buyer role set", `${target.name} is now a buyer account.`);
  };

  const handleApproveWalletTopUp = async (request: WalletTopUpRequest) => {
    if (!user) {
      return;
    }

    const result = await approveWalletTopUpRequest(request.id, {
      uid: user.uid,
      email: user.email,
    });

    showToast(
      "success",
      "Wallet credited",
      `${request.userName} now has ${formatCurrency(result.balanceAfter)} in wallet.`
    );
  };

  const handleRejectWalletTopUp = async (request: WalletTopUpRequest) => {
    if (!user) {
      return;
    }

    await rejectWalletTopUpRequest(
      request.id,
      {
        uid: user.uid,
        email: user.email,
      },
      "Rejected from admin dashboard"
    );
    showToast("success", "Wallet request rejected", `${request.userName} was notified.`);
  };

  const handleToggleProductActive = async (product: Product) => {
    await updateProduct(product.id, { isActive: !product.isActive });
    showToast("success", "Product updated", `${product.name} is now ${product.isActive ? "paused" : "active"}.`);
  };

  const handleToggleProductDeal = async (product: Product) => {
    await updateProduct(product.id, { isDeal: !product.isDeal });
    showToast("success", "Deal updated", `${product.name} deal status changed.`);
  };

  const handleToggleProductFeatured = async (product: Product) => {
    await updateProduct(product.id, { isFeatured: !product.isFeatured });
    showToast("success", "Featured updated", `${product.name} featured status changed.`);
  };

  const handleEditorDraftChange = (content: BuyerPageContent) => {
    setEditorDraft(content);
    setEditorDirty(true);
  };

  const handlePublishBuyerPages = async () => {
    await saveBuyerPageContent(editorDraft);
    setBuyerPageContent(editorDraft);
    setEditorDirty(false);
    showToast("success", "Store published", "Buyer pages now use the updated content.");
  };

  const handleResetEditor = () => {
    setEditorDraft(buyerPageContent);
    setEditorDirty(false);
    showToast("info", "Editor reset", "Draft changes were restored from the live content.");
  };

  const handleSignOut = async () => {
    await signOut(auth);
    showToast("success", "Signed out", "Admin session closed.");
  };

  const handleSelectView = (view: AdminView) => {
    setActiveView(view);
    setSelectedOrder(null);
  };

  const activeViewMeta = adminViews.find((item) => item.key === activeView) || adminViews[0];
  const editorSectionOrder = normalizeBuyerHomeSectionOrder(editorDraft.home.sectionOrder);
  const hiddenEditorSections = editorDraft.home.hiddenSections || [];
  const editorSectionNavMeta: Record<
    BuyerHomeSectionKey,
    { label: string; color: string; section: EditorSection }
  > = {
    hero: { label: "Hero", color: colors.primary, section: "hero" },
    promo: { label: "Promos", color: colors.accent, section: "promo" },
    mediaShowcase: { label: "Bestsellers", color: colors.teal, section: "mediaShowcase" },
    category: { label: "Categories", color: colors.success, section: "category" },
    lovedOnes: { label: "Loved Ones", color: colors.danger, section: "lovedOnes" },
  };
  const updateEditorHome = (value: Partial<BuyerPageContent["home"]>) => {
    handleEditorDraftChange({
      ...editorDraft,
      home: {
        ...editorDraft.home,
        ...value,
      },
    });
  };
  const toggleEditorSectionHidden = (section: BuyerHomeSectionKey) => {
    updateEditorHome({
      hiddenSections: hiddenEditorSections.includes(section)
        ? hiddenEditorSections.filter((item) => item !== section)
        : [...hiddenEditorSections, section],
    });
  };
  const moveEditorSection = (section: BuyerHomeSectionKey, direction: -1 | 1) => {
    const fromIndex = editorSectionOrder.indexOf(section);
    const toIndex = fromIndex + direction;

    if (fromIndex < 0 || toIndex < 0 || toIndex >= editorSectionOrder.length) {
      return;
    }

    const nextOrder = [...editorSectionOrder];
    const [movedSection] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, movedSection);
    updateEditorHome({ sectionOrder: nextOrder });
  };

  const childrenByView = {
    editor: [
      ...editorSectionOrder.map((section, index) => {
        const meta = editorSectionNavMeta[section];

        return {
          label: meta.label,
          active: activeEditorSection === meta.section,
          color: meta.color,
          hidden: hiddenEditorSections.includes(section),
          canMoveUp: index > 0,
          canMoveDown: index < editorSectionOrder.length - 1,
          onPress: () => setActiveEditorSection(meta.section),
          onToggleHidden: () => toggleEditorSectionHidden(section),
          onMoveUp: () => moveEditorSection(section, -1),
          onMoveDown: () => moveEditorSection(section, 1),
        };
      }),
      { label: "Headings", active: activeEditorSection === "sections", color: colors.purple, onPress: () => setActiveEditorSection("sections") },
      { label: "Pages", active: activeEditorSection === "pageLabels", color: colors.purple, onPress: () => setActiveEditorSection("pageLabels") },
    ],
    orders: [
      { label: "All", active: orderStatusFilter === "all", color: colors.primary, onPress: () => setOrderStatusFilter("all") },
      { label: "Pending", active: orderStatusFilter === "pending", color: colors.accent, onPress: () => setOrderStatusFilter("pending") },
      { label: "Delivered", active: orderStatusFilter === "delivered", color: colors.success, onPress: () => setOrderStatusFilter("delivered") },
    ],
    wallet: [
      { label: "Pending", active: walletStatusFilter === "pending", color: colors.accent, onPress: () => setWalletStatusFilter("pending") },
      { label: "Approved", active: walletStatusFilter === "approved", color: colors.success, onPress: () => setWalletStatusFilter("approved") },
      { label: "Rejected", active: walletStatusFilter === "rejected", color: colors.danger, onPress: () => setWalletStatusFilter("rejected") },
    ],
    sellers: [
      { label: "All", active: sellerStatusFilter === "all", color: colors.primary, onPress: () => setSellerStatusFilter("all") },
      { label: "Pending", active: sellerStatusFilter === "pending", color: colors.accent, onPress: () => setSellerStatusFilter("pending") },
      { label: "Approved", active: sellerStatusFilter === "approved", color: colors.success, onPress: () => setSellerStatusFilter("approved") },
    ],
    catalog: [
      { label: "Active", active: productStatusFilter === "active", color: colors.primary, onPress: () => setProductStatusFilter("active") },
      { label: "Paused", active: productStatusFilter === "paused", color: colors.danger, onPress: () => setProductStatusFilter("paused") },
      { label: "Out Stock", active: productStatusFilter === "out", color: colors.accent, onPress: () => setProductStatusFilter("out") },
    ],
    users: [
      { label: "Buyers", active: userRoleFilter === "buyer", color: colors.primary, onPress: () => setUserRoleFilter("buyer") },
      { label: "Sellers", active: userRoleFilter === "seller", color: colors.success, onPress: () => setUserRoleFilter("seller") },
      { label: "Admins", active: userRoleFilter === "admin", color: colors.purple, onPress: () => setUserRoleFilter("admin") },
    ],
  };

  const counts = {
    orders: liveOrders.length,
    wallet: pendingWalletTopUps.length,
    sellers: pendingSellers.length,
    catalog: outOfStockProducts.length,
  };

  const primaryAction = {
    dashboard: {
      label: "Wallet Queue",
      icon: "wallet-outline" as IconName,
      run: () => {
        setWalletStatusFilter("pending");
        handleSelectView("wallet");
      },
    },
    editor: {
      label: editorDirty ? "Publish" : "Published",
      icon: "cloud-upload-outline" as IconName,
      run: () => {
        if (!editorDirty) {
          showToast("info", "Store editor", "There are no unpublished changes.");
          return;
        }
        runAction("publish-buyer-pages", handlePublishBuyerPages);
      },
    },
    orders: {
      label: "Pending Orders",
      icon: "time-outline" as IconName,
      run: () => setOrderStatusFilter("pending"),
    },
    wallet: {
      label: "Pending",
      icon: "filter-outline" as IconName,
      run: () => setWalletStatusFilter("pending"),
    },
    sellers: {
      label: "Needs Review",
      icon: "storefront-outline" as IconName,
      run: () => {
        setSellerStatusFilter("pending");
        setSearchTerm("");
      },
    },
    catalog: {
      label: "Out Stock",
      icon: "alert-circle-outline" as IconName,
      run: () => setProductStatusFilter("out"),
    },
    users: {
      label: "Sellers",
      icon: "people-outline" as IconName,
      run: () => setUserRoleFilter("seller"),
    },
  }[activeView];

  if (isLoading) {
    return <FullScreenLoader label="Loading admin panel..." />;
  }

  const adminName = profile?.name || "Admin";
  const adminEmail = profile?.email || user?.email || "admin@sachinindia.app";
  const dashboardOrders = filteredOrders.slice(0, 8);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDesktop ? adminColors.shell : adminColors.canvas }}>
      <View style={{ flex: 1, padding: isDesktop ? spacing.md : 0 }}>
        <View
          style={{
            flex: 1,
            overflow: "hidden",
            borderRadius: isDesktop ? 20 : 0,
            backgroundColor: adminColors.canvas,
            flexDirection: "row",
            borderWidth: isDesktop ? 1 : 0,
            borderColor: "#C9CDD3",
            ...shadows.card,
          }}
        >
          {isDesktop ? (
            <Sidebar
              activeView={activeView}
              onSelectView={handleSelectView}
              onSignOut={handleSignOut}
              childrenByView={childrenByView}
              counts={counts}
            />
          ) : null}

          <View style={{ flex: 1, minWidth: 0 }}>
            <TopBar
              title={activeViewMeta.title}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              adminName={adminName}
              adminEmail={adminEmail}
              onSignOut={handleSignOut}
              compact={!isDesktop}
              primaryLabel={primaryAction.label}
              primaryIcon={primaryAction.icon}
              onPrimaryAction={primaryAction.run}
            />

            {!isDesktop ? <MobileNav activeView={activeView} onSelectView={handleSelectView} /> : null}

            <ScrollView
              contentContainerStyle={{
                padding: isDesktop ? spacing.lg : spacing.md,
                paddingBottom: 120,
                gap: spacing.lg,
              }}
            >
              {activeView !== "editor" ? (
                <View
                  style={{
                    flexDirection: isWide ? "row" : "column",
                    alignItems: isWide ? "center" : "stretch",
                    justifyContent: "space-between",
                    gap: spacing.md,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: adminColors.ink, fontSize: 20, fontWeight: "900" }}>
                      {activeViewMeta.title}
                    </Text>
                    <Text style={{ color: adminColors.muted, marginTop: 6, fontSize: 12 }}>
                      {activeViewMeta.subtitle}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                    {[
                      {
                        label: "Revenue",
                        value: formatCurrency(totalRevenue),
                        icon: "cash-outline" as IconName,
                        tone: colors.success,
                        backgroundColor: adminColors.greenSoft,
                      },
                      {
                        label: "Live Orders",
                        value: `${liveOrders.length}`,
                        icon: "receipt-outline" as IconName,
                        tone: colors.primary,
                        backgroundColor: adminColors.blueSoft,
                      },
                      {
                        label: "Wallet Queue",
                        value: `${pendingWalletTopUps.length}`,
                        icon: "wallet-outline" as IconName,
                        tone: colors.accent,
                        backgroundColor: adminColors.orangeSoft,
                      },
                      {
                        label: "Seller Review",
                        value: `${pendingSellers.length}`,
                        icon: "storefront-outline" as IconName,
                        tone: colors.purple,
                        backgroundColor: adminColors.purpleSoft,
                      },
                    ].map((item) => (
                      <SummaryCard key={item.label} {...item} />
                    ))}
                  </View>
                </View>
              ) : null}

              {activeView === "editor" ? (
                <StoreEditorPanel
                  draft={editorDraft}
                  onChange={handleEditorDraftChange}
                  activeSection={activeEditorSection}
                  onActiveSectionChange={setActiveEditorSection}
                  isDesktop={isDesktop}
                  isDirty={editorDirty}
                  busyKey={busyKey}
                  onPublish={() => runAction("publish-buyer-pages", handlePublishBuyerPages)}
                  onReset={handleResetEditor}
                  onClose={() => handleSelectView("dashboard")}
                />
              ) : null}

              {activeView === "dashboard" ? (
                <>
                  <OrdersPanel
                    title="Invoice / Order List"
                    orders={dashboardOrders}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    statusFilter={orderStatusFilter}
                    onStatusFilterChange={setOrderStatusFilter}
                    sortMode={orderSortMode}
                    onSortModeChange={setOrderSortMode}
                    isDesktop={isDesktop}
                    busyKey={busyKey}
                    onInspect={setSelectedOrder}
                    onAdvance={(target) => runAction(`order-${target.orderId}`, () => handleAdvanceOrder(target))}
                  />

                  {selectedOrder ? (
                    <OrderDetailsPanel
                      order={selectedOrder}
                      onClose={() => setSelectedOrder(null)}
                      busyKey={busyKey}
                      onAdvance={(target) => runAction(`order-${target.orderId}`, () => handleAdvanceOrder(target))}
                    />
                  ) : null}

                  <View
                    style={{
                      flexDirection: isWide ? "row" : "column",
                      gap: spacing.lg,
                      alignItems: "stretch",
                    }}
                  >
                    <WalletRequestsPanel
                      requests={pendingWalletTopUps}
                      statusFilter="pending"
                      onStatusFilterChange={setWalletStatusFilter}
                      isPreview
                      busyKey={busyKey}
                      onApprove={(request) => runAction(`approve-${request.id}`, () => handleApproveWalletTopUp(request))}
                      onReject={(request) => runAction(`reject-${request.id}`, () => handleRejectWalletTopUp(request))}
                    />
                    <SellersPanel
                      sellers={sellers}
                      statusFilter="all"
                      onStatusFilterChange={setSellerStatusFilter}
                      productsBySeller={productsBySeller}
                      busyKey={busyKey}
                      isPreview
                      onApprove={(seller) => runAction(`seller-${seller.uid}`, () => handleApproveSeller(seller))}
                      onPause={(seller) => runAction(`pause-seller-${seller.uid}`, () => handlePauseSeller(seller))}
                    />
                    <CatalogSnapshotPanel
                      activeProducts={activeProducts}
                      outOfStockProducts={outOfStockProducts}
                      approvedSellers={approvedSellers}
                      totalWalletBalance={totalWalletBalance}
                      products={products}
                    />
                  </View>
                </>
              ) : null}

              {activeView === "orders" ? (
                <>
                  <OrdersPanel
                    title="All Invoices"
                    orders={filteredOrders}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    statusFilter={orderStatusFilter}
                    onStatusFilterChange={setOrderStatusFilter}
                    sortMode={orderSortMode}
                    onSortModeChange={setOrderSortMode}
                    isDesktop={isDesktop}
                    busyKey={busyKey}
                    onInspect={setSelectedOrder}
                    onAdvance={(target) => runAction(`order-${target.orderId}`, () => handleAdvanceOrder(target))}
                  />
                  {selectedOrder ? (
                    <OrderDetailsPanel
                      order={selectedOrder}
                      onClose={() => setSelectedOrder(null)}
                      busyKey={busyKey}
                      onAdvance={(target) => runAction(`order-${target.orderId}`, () => handleAdvanceOrder(target))}
                    />
                  ) : null}
                </>
              ) : null}

              {activeView === "wallet" ? (
                <WalletRequestsPanel
                  requests={filteredWalletTopUps}
                  statusFilter={walletStatusFilter}
                  onStatusFilterChange={setWalletStatusFilter}
                  busyKey={busyKey}
                  onApprove={(request) => runAction(`approve-${request.id}`, () => handleApproveWalletTopUp(request))}
                  onReject={(request) => runAction(`reject-${request.id}`, () => handleRejectWalletTopUp(request))}
                />
              ) : null}

              {activeView === "sellers" ? (
                <SellersPanel
                  sellers={filteredSellers}
                  statusFilter={sellerStatusFilter}
                  onStatusFilterChange={setSellerStatusFilter}
                  productsBySeller={productsBySeller}
                  busyKey={busyKey}
                  onApprove={(seller) => runAction(`seller-${seller.uid}`, () => handleApproveSeller(seller))}
                  onPause={(seller) => runAction(`pause-seller-${seller.uid}`, () => handlePauseSeller(seller))}
                />
              ) : null}

              {activeView === "catalog" ? (
                <ProductManagementPanel
                  products={filteredProducts}
                  statusFilter={productStatusFilter}
                  onStatusFilterChange={setProductStatusFilter}
                  busyKey={busyKey}
                  onToggleActive={(product) => runAction(`active-${product.id}`, () => handleToggleProductActive(product))}
                  onToggleDeal={(product) => runAction(`deal-${product.id}`, () => handleToggleProductDeal(product))}
                  onToggleFeatured={(product) =>
                    runAction(`featured-${product.id}`, () => handleToggleProductFeatured(product))
                  }
                />
              ) : null}

              {activeView === "users" ? (
                <UsersPanel
                  users={filteredUsers}
                  roleFilter={userRoleFilter}
                  onRoleFilterChange={setUserRoleFilter}
                  busyKey={busyKey}
                  onApproveSeller={(target) => runAction(`seller-${target.uid}`, () => handleApproveSeller(target))}
                  onMakeSeller={(target) => runAction(`make-seller-${target.uid}`, () => handleMakeSeller(target))}
                  onMakeBuyer={(target) => runAction(`make-buyer-${target.uid}`, () => handleMakeBuyer(target))}
                />
              ) : null}
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
