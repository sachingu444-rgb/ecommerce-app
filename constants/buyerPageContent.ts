import {
  BuyerCategoryPage,
  BuyerEditablePage,
  BuyerHomeContent,
  BuyerHomeSectionKey,
  BuyerPageContent,
  BuyerPageLabels,
} from "../types";

export const defaultBuyerHomeSectionOrder: BuyerHomeSectionKey[] = [
  "hero",
  "promo",
  "brandSpotlight",
  "mediaShowcase",
  "category",
  "lovedOnes",
];

const defaultHomeContent: BuyerHomeContent = {
  heroes: [
    {
      id: "premium-fashion",
      eyebrow: "Premium edit",
      title: "Elevated everyday style",
      subtitle: "Curated fashion, shoes and watches with quick checkout and fresh drops.",
      offer: "Up to 75% off",
      image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1400",
      category: "Fashion",
      accent: "#FBBF24",
      durationHours: 24,
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
      durationHours: 48,
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
      durationHours: 72,
    },
  ],
  promoGrid: [
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
  ],
  visualCategories: [
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
      id: "top-50",
      label: "Top-50",
      image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400",
      category: "All",
    },
    {
      id: "dresses",
      label: "Dresses",
      image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400",
      category: "Fashion",
    },
  ],
  sectionOrder: defaultBuyerHomeSectionOrder,
  lovedOnes: [
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
  ],
  brandSpotlight: [
    {
      id: "brand-boat-neckband",
      brand: "boAt",
      title: "Up to 80% Off",
      subtitle: "Month end spl. deal",
      image: "https://images.unsplash.com/photo-1578319439584-104c94d37305?w=700",
      category: "Electronics",
      badge: "AD",
    },
    {
      id: "brand-mivi-soundbar",
      brand: "MIVI",
      title: "Up to 83% Off",
      subtitle: "Lowest price ever",
      image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=700",
      category: "Electronics",
      badge: "AD",
    },
    {
      id: "brand-mivi-earbuds",
      brand: "MIVI",
      title: "From Rs 699",
      subtitle: "Biggest price drop",
      image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=700",
      category: "Electronics",
      badge: "AD",
    },
  ],
  mediaShowcase: {
    title: "Explore Bestsellers",
    autoplay: true,
    items: [
      {
        id: "media-smartwatches",
        label: "Smartwatches",
        image: "https://images.unsplash.com/photo-1544117519-31a4b719223d?w=700",
        videoUrl: "",
        category: "Electronics",
      },
      {
        id: "media-earbuds",
        label: "Wireless Earbuds",
        image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=700",
        videoUrl: "",
        category: "Electronics",
      },
      {
        id: "media-neckbands",
        label: "Neckbands",
        image: "https://images.unsplash.com/photo-1612444530582-fc66183b16f0?w=700",
        videoUrl: "",
        category: "Electronics",
      },
      {
        id: "media-headphones",
        label: "Headphones",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700",
        videoUrl: "",
        category: "Electronics",
      },
      {
        id: "media-speakers",
        label: "Wireless Speakers",
        image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=700",
        videoUrl: "",
        category: "Electronics",
      },
    ],
  },
  lovedOnesTitle: "Shop for loved ones",
  dealsTitle: "Deal of the Day",
  dealsActionLabel: "See All",
  featuredTitle: "Featured Products",
  featuredActionLabel: "See All",
};

const defaultPageLabels: BuyerPageLabels = {
  homeTitle: "Home",
  categoriesTitle: "Categories",
  categoriesSubtitle: "Explore every aisle across the marketplace.",
  productsTitle: "All Products",
  productsSubtitle: "Browse every active product in the store.",
  dealsTitle: "Deal Zone",
  dealsSubtitle: "Hand-picked offers you can grab today.",
};

export const defaultBuyerCategoryPages: BuyerCategoryPage[] = [
  {
    id: "for-you",
    label: "For You",
    category: "All",
    title: "For You",
    subtitle: "Fresh picks, deals, and featured products from every category.",
    heroImage: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400",
    badge: "Personal picks",
    accent: "#0066CC",
    icon: "bag-handle-outline",
    featuredTitle: "Recommended for you",
    dealTitle: "Live deals",
    emptyTitle: "New products coming soon",
    emptySubtitle: "Fresh arrivals will appear here as sellers publish them.",
  },
  {
    id: "fashion",
    label: "Fashion",
    category: "Fashion",
    title: "Fashion",
    subtitle: "Style edits across dresses, shoes, watches, denim, and everyday fits.",
    heroImage: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1400",
    badge: "Premium edit",
    accent: "#EC4899",
    icon: "shirt-outline",
    featuredTitle: "Trending fashion",
    dealTitle: "Fashion deals",
    emptyTitle: "Fashion drops coming soon",
    emptySubtitle: "Add fashion products from seller catalog to fill this page.",
  },
  {
    id: "mobiles",
    label: "Mobiles",
    category: "Electronics",
    title: "Mobiles",
    subtitle: "Smartphones, phone accessories, audio, and daily tech upgrades.",
    heroImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1400",
    badge: "Smart upgrades",
    accent: "#2563EB",
    icon: "phone-portrait-outline",
    featuredTitle: "Mobile picks",
    dealTitle: "Mobile deals",
    emptyTitle: "Mobile products coming soon",
    emptySubtitle: "Electronics products will appear here when sellers publish them.",
  },
  {
    id: "beauty",
    label: "Beauty",
    category: "Beauty",
    title: "Beauty",
    subtitle: "Skin, makeup, grooming, and self-care essentials in one place.",
    heroImage: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1400",
    badge: "Beauty shelf",
    accent: "#DB2777",
    icon: "sparkles-outline",
    featuredTitle: "Beauty bestsellers",
    dealTitle: "Beauty offers",
    emptyTitle: "Beauty products coming soon",
    emptySubtitle: "Add beauty products to start showing this category.",
  },
  {
    id: "electronics",
    label: "Electronics",
    category: "Electronics",
    title: "Electronics",
    subtitle: "Audio, gadgets, appliances, and accessories for smarter everyday use.",
    heroImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400",
    badge: "Tech zone",
    accent: "#2563EB",
    icon: "laptop-outline",
    featuredTitle: "Featured electronics",
    dealTitle: "Electronics deals",
    emptyTitle: "Electronics coming soon",
    emptySubtitle: "Seller electronics will appear here after publishing.",
  },
  {
    id: "home",
    label: "Home",
    category: "Home",
    title: "Home",
    subtitle: "Decor, storage, comfort, and practical upgrades for every room.",
    heroImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400",
    badge: "Home refresh",
    accent: "#10B981",
    icon: "home-outline",
    featuredTitle: "Home essentials",
    dealTitle: "Home deals",
    emptyTitle: "Home products coming soon",
    emptySubtitle: "Add home products to populate this page.",
  },
  {
    id: "appliances",
    label: "Appliances",
    category: "Home",
    title: "Appliances",
    subtitle: "Helpful appliances and daily-use home machines for easier routines.",
    heroImage: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1400",
    badge: "Daily helpers",
    accent: "#0891B2",
    icon: "tv-outline",
    featuredTitle: "Appliance picks",
    dealTitle: "Appliance deals",
    emptyTitle: "Appliances coming soon",
    emptySubtitle: "Home appliance products will appear here after publishing.",
  },
  {
    id: "toys",
    label: "Toys, baby",
    category: "Toys",
    title: "Toys, baby",
    subtitle: "Playtime, baby care, gifts, and joyful finds for little ones.",
    heroImage: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1400",
    badge: "Play picks",
    accent: "#EAB308",
    icon: "game-controller-outline",
    featuredTitle: "Toys and baby picks",
    dealTitle: "Toys deals",
    emptyTitle: "Toys coming soon",
    emptySubtitle: "Add toys and baby products to fill this page.",
  },
  {
    id: "food",
    label: "Food & Health",
    category: "Food",
    title: "Food & Health",
    subtitle: "Pantry, wellness, nutrition, and daily health essentials.",
    heroImage: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1400",
    badge: "Wellness shelf",
    accent: "#F97316",
    icon: "restaurant-outline",
    featuredTitle: "Food and health picks",
    dealTitle: "Wellness deals",
    emptyTitle: "Food and health coming soon",
    emptySubtitle: "Food and health products will appear here when available.",
  },
  {
    id: "auto-accessories",
    label: "Auto Acc...",
    category: "Automotive",
    title: "Auto Accessories",
    subtitle: "Useful accessories, cleaning kits, and upgrades for your vehicle.",
    heroImage: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1400",
    badge: "Auto care",
    accent: "#374151",
    icon: "car-sport-outline",
    featuredTitle: "Auto accessories",
    dealTitle: "Auto deals",
    emptyTitle: "Auto accessories coming soon",
    emptySubtitle: "Automotive accessories will appear here after publishing.",
  },
  {
    id: "two-wheelers",
    label: "2 Wheelers",
    category: "Automotive",
    title: "2 Wheelers",
    subtitle: "Two-wheeler accessories, riding essentials, and care products.",
    heroImage: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1400",
    badge: "Ride ready",
    accent: "#EA580C",
    icon: "bicycle-outline",
    featuredTitle: "Two-wheeler picks",
    dealTitle: "Rider deals",
    emptyTitle: "2 wheeler products coming soon",
    emptySubtitle: "Add automotive products to start filling this page.",
  },
  {
    id: "sports",
    label: "Sports & Fitness",
    category: "Sports",
    title: "Sports & Fitness",
    subtitle: "Shoes, gear, training essentials, and active lifestyle picks.",
    heroImage: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1400",
    badge: "Active hours",
    accent: "#F97316",
    icon: "barbell-outline",
    featuredTitle: "Sports picks",
    dealTitle: "Fitness deals",
    emptyTitle: "Sports products coming soon",
    emptySubtitle: "Sports and fitness products will show here after publishing.",
  },
  {
    id: "books",
    label: "Books & More",
    category: "Books",
    title: "Books & More",
    subtitle: "Books, stationery, learning supplies, and useful extras.",
    heroImage: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1400",
    badge: "Read more",
    accent: "#7C3AED",
    icon: "book-outline",
    featuredTitle: "Books and more",
    dealTitle: "Book deals",
    emptyTitle: "Books coming soon",
    emptySubtitle: "Books and more products will appear here when added.",
  },
  {
    id: "furniture",
    label: "Furniture",
    category: "Home",
    title: "Furniture",
    subtitle: "Comfortable furniture, storage, and room-defining pieces.",
    heroImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400",
    badge: "Room upgrade",
    accent: "#14B8A6",
    icon: "home-outline",
    featuredTitle: "Furniture picks",
    dealTitle: "Furniture deals",
    emptyTitle: "Furniture coming soon",
    emptySubtitle: "Furniture products will show here as sellers publish them.",
  },
];

const buildDefaultCategoryBanners = (page: BuyerCategoryPage) => [
  {
    id: `${page.id}-banner-main`,
    image: page.heroImage,
    title: page.title,
    subtitle: page.subtitle,
    linkCategory: page.category,
  },
  {
    id: `${page.id}-banner-deal`,
    image: page.heroImage,
    title: page.dealTitle,
    subtitle: page.badge,
    linkCategory: page.category,
  },
  {
    id: `${page.id}-banner-featured`,
    image: page.heroImage,
    title: page.featuredTitle,
    subtitle: "Explore now",
    linkCategory: page.category,
  },
];

const buildDefaultCategoryTiles = (page: BuyerCategoryPage) =>
  [
    page.label,
    page.featuredTitle,
    page.dealTitle,
    "New arrivals",
    "Top picks",
    "Best offers",
    "Trending",
    "View store",
    "Premium",
    "Essentials",
  ].map((label, index) => ({
    id: `${page.id}-tile-${index + 1}`,
    label,
    image: page.heroImage,
    linkCategory: page.category,
  }));

const withCategoryPageDefaults = (page: BuyerCategoryPage): BuyerCategoryPage => ({
  ...page,
  banners: page.banners?.length ? page.banners : buildDefaultCategoryBanners(page),
  tiles: page.tiles?.length ? page.tiles : buildDefaultCategoryTiles(page),
  highlightTitle: page.highlightTitle || `${page.label}, still looking for these?`,
  highlightBackground: page.highlightBackground || "#F2FF00",
  productCardCta: page.productCardCta || "View Store",
  productCount: page.productCount || 8,
  columns: page.columns || 4,
  mobileColumns: page.mobileColumns || 2,
  horizontalGap: page.horizontalGap || 8,
  verticalGap: page.verticalGap || 24,
  sectionWidth: page.sectionWidth || "page",
  alignment: page.alignment || "left",
  paddingTop: page.paddingTop ?? 24,
  paddingBottom: page.paddingBottom ?? 48,
  tileSize: page.tileSize || 106,
  bannerHeight: page.bannerHeight || 247,
  carouselOnMobile: page.carouselOnMobile ?? true,
  colorScheme: page.colorScheme || "Scheme 1",
  typographyPreset: page.typographyPreset || "Heading 6",
});

export const defaultBuyerEditablePages: BuyerEditablePage[] = [
  {
    id: "categories",
    label: "Categories",
    route: "/categories",
    title: defaultPageLabels.categoriesTitle,
    subtitle: defaultPageLabels.categoriesSubtitle,
    heroImage: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1400",
    badge: "All aisles",
    accent: "#0066CC",
    sectionTitle: "Shop by category",
    bodyTitle: "",
    bodyText: "",
    searchPlaceholder: "",
    emptyTitle: "Categories coming soon",
    emptySubtitle: "Category tiles will appear as products are added.",
    emptyButtonLabel: "Back Home",
    cards: [],
  },
  {
    id: "products",
    label: "Products",
    route: "/products",
    title: defaultPageLabels.productsTitle,
    subtitle: defaultPageLabels.productsSubtitle,
    heroImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400",
    badge: "Full catalog",
    accent: "#0B887B",
    sectionTitle: "All products",
    bodyTitle: "",
    bodyText: "",
    searchPlaceholder: "Search products...",
    emptyTitle: "Products Coming Soon",
    emptySubtitle: "New arrivals will appear here as sellers publish them.",
    emptyButtonLabel: "Back to Home",
    cards: [],
  },
  {
    id: "deals",
    label: "Deals",
    route: "/deals",
    title: defaultPageLabels.dealsTitle,
    subtitle: defaultPageLabels.dealsSubtitle,
    heroImage: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1400",
    badge: "Limited offers",
    accent: "#F97316",
    sectionTitle: "Today deals",
    bodyTitle: "",
    bodyText: "",
    searchPlaceholder: "",
    emptyTitle: "No deals live right now",
    emptySubtitle: "Fresh promotions will show up here as sellers publish them.",
    emptyButtonLabel: "Explore Home",
    cards: [],
  },
  {
    id: "about",
    label: "About",
    route: "/about",
    title: "About ShopApp",
    subtitle: "Marketplace shopping and selling in one app.",
    heroImage: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1400",
    badge: "SachinIndia",
    accent: "#0066CC",
    sectionTitle: "Our marketplace",
    bodyTitle: "SachinIndia",
    bodyText:
      "SachinIndia brings together a buyer portal and seller portal in a single shopping experience. Buyers can discover products, track orders and pay securely, while sellers manage inventory, fulfill orders and grow revenue through Firebase-powered tools.",
    searchPlaceholder: "",
    emptyTitle: "",
    emptySubtitle: "",
    emptyButtonLabel: "",
    cards: [
      {
        id: "version",
        title: "Version 1.0.0",
        description: "Built with Expo Router, Firebase, Stripe and Zustand.",
        icon: "information-circle-outline",
      },
    ],
  },
  {
    id: "support",
    label: "Support",
    route: "/support",
    title: "Help & Support",
    subtitle: "We're here when something needs attention.",
    heroImage: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=1400",
    badge: "Support desk",
    accent: "#7C3AED",
    sectionTitle: "How can we help?",
    bodyTitle: "",
    bodyText: "",
    searchPlaceholder: "",
    emptyTitle: "",
    emptySubtitle: "",
    emptyButtonLabel: "",
    cards: [
      {
        id: "orders",
        title: "Order help",
        description: "Track a package, request delivery help, or understand order status updates.",
        icon: "cube-outline",
      },
      {
        id: "payments",
        title: "Payments and refunds",
        description: "Need help with card payments, cancellations or refunds? Start here.",
        icon: "card-outline",
      },
      {
        id: "seller",
        title: "Seller support",
        description: "Get help with product uploads, payouts, and managing your storefront.",
        icon: "storefront-outline",
      },
    ],
  },
];

export const defaultBuyerPageContent: BuyerPageContent = {
  home: defaultHomeContent,
  pages: defaultPageLabels,
  categoryPages: defaultBuyerCategoryPages.map(withCategoryPageDefaults),
  editablePages: defaultBuyerEditablePages,
};

const mergeArray = <T>(value: unknown, fallback: T[], minLength = 1) =>
  Array.isArray(value) && value.length >= minLength ? (value as T[]) : fallback;

const normalizeBuyerCategoryPages = (value?: unknown): BuyerCategoryPage[] => {
  const savedPages = Array.isArray(value) ? (value as Partial<BuyerCategoryPage>[]) : [];
  const savedById = new Map(
    savedPages
      .filter((page) => typeof page.id === "string")
      .map((page) => [page.id as string, page])
  );

  return defaultBuyerCategoryPages.map((fallback) =>
    withCategoryPageDefaults({
      ...fallback,
      ...(savedById.get(fallback.id) || {}),
    })
  );
};

const normalizeBuyerEditablePages = (value?: unknown): BuyerEditablePage[] => {
  const savedPages = Array.isArray(value) ? (value as Partial<BuyerEditablePage>[]) : [];
  const savedById = new Map(
    savedPages
      .filter((page) => typeof page.id === "string")
      .map((page) => [page.id as string, page])
  );

  return defaultBuyerEditablePages.map((fallback) => {
    const saved = savedById.get(fallback.id);

    return {
      ...fallback,
      ...(saved || {}),
      cards: Array.isArray(saved?.cards) ? saved.cards : fallback.cards,
    };
  });
};

export const normalizeBuyerHomeSectionOrder = (value?: unknown): BuyerHomeSectionKey[] => {
  if (!Array.isArray(value)) {
    return defaultBuyerHomeSectionOrder;
  }

  const validSections = new Set(defaultBuyerHomeSectionOrder);
  const orderedSections = value.filter(
    (section): section is BuyerHomeSectionKey =>
      typeof section === "string" && validSections.has(section as BuyerHomeSectionKey)
  );
  const missingSections = defaultBuyerHomeSectionOrder.filter((section) => !orderedSections.includes(section));

  return [...orderedSections, ...missingSections];
};

export const normalizeBuyerPageContent = (
  value?: Partial<BuyerPageContent> | null
): BuyerPageContent => ({
  home: {
    ...defaultBuyerPageContent.home,
    ...(value?.home || {}),
    heroes: mergeArray(value?.home?.heroes, defaultBuyerPageContent.home.heroes, 0),
    promoGrid: mergeArray(value?.home?.promoGrid, defaultBuyerPageContent.home.promoGrid, 0),
    visualCategories: mergeArray(
      value?.home?.visualCategories,
      defaultBuyerPageContent.home.visualCategories,
      0
    ),
    lovedOnes: mergeArray(value?.home?.lovedOnes, defaultBuyerPageContent.home.lovedOnes, 0),
    brandSpotlight: mergeArray(value?.home?.brandSpotlight, defaultBuyerPageContent.home.brandSpotlight, 0),
    mediaShowcase: {
      ...defaultBuyerPageContent.home.mediaShowcase,
      ...(value?.home?.mediaShowcase || {}),
      items: mergeArray(
        value?.home?.mediaShowcase?.items,
        defaultBuyerPageContent.home.mediaShowcase.items,
        0
      ),
    },
    hiddenSections: Array.isArray(value?.home?.hiddenSections)
      ? value.home.hiddenSections
      : defaultBuyerPageContent.home.hiddenSections || [],
    sectionOrder: normalizeBuyerHomeSectionOrder(value?.home?.sectionOrder),
  },
  pages: {
    ...defaultBuyerPageContent.pages,
    ...(value?.pages || {}),
  },
  categoryPages: normalizeBuyerCategoryPages(value?.categoryPages),
  editablePages: normalizeBuyerEditablePages(value?.editablePages),
  updatedAt: value?.updatedAt,
});
