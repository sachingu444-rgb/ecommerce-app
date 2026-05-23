import {
  BuyerHomeContent,
  BuyerPageContent,
  BuyerPageLabels,
} from "../types";

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

export const defaultBuyerPageContent: BuyerPageContent = {
  home: defaultHomeContent,
  pages: defaultPageLabels,
};

const mergeArray = <T>(value: unknown, fallback: T[], minLength = 1) =>
  Array.isArray(value) && value.length >= minLength ? (value as T[]) : fallback;

export const normalizeBuyerPageContent = (
  value?: Partial<BuyerPageContent> | null
): BuyerPageContent => ({
  home: {
    ...defaultBuyerPageContent.home,
    ...(value?.home || {}),
    heroes: mergeArray(value?.home?.heroes, defaultBuyerPageContent.home.heroes),
    promoGrid: mergeArray(value?.home?.promoGrid, defaultBuyerPageContent.home.promoGrid, 4),
    visualCategories: mergeArray(
      value?.home?.visualCategories,
      defaultBuyerPageContent.home.visualCategories
    ),
    lovedOnes: mergeArray(value?.home?.lovedOnes, defaultBuyerPageContent.home.lovedOnes),
    mediaShowcase: {
      ...defaultBuyerPageContent.home.mediaShowcase,
      ...(value?.home?.mediaShowcase || {}),
      items: mergeArray(
        value?.home?.mediaShowcase?.items,
        defaultBuyerPageContent.home.mediaShowcase.items
      ),
    },
  },
  pages: {
    ...defaultBuyerPageContent.pages,
    ...(value?.pages || {}),
  },
  updatedAt: value?.updatedAt,
});
