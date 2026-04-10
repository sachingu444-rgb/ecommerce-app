export interface ListingFieldTemplate {
  label: string;
  placeholder: string;
  helper: string;
}

export interface CategoryListingTemplate {
  optionFields: ListingFieldTemplate[];
  specFields: ListingFieldTemplate[];
  highlightSuggestions: string[];
  deliverySuggestions: string[];
  returnPolicyHint: string;
  warrantyHint: string;
}

const defaultTemplate: CategoryListingTemplate = {
  optionFields: [
    {
      label: "Style",
      placeholder: "Standard, Premium",
      helper: "Add buyer-selectable options separated by commas.",
    },
    {
      label: "Color",
      placeholder: "Black, Blue, White",
      helper: "Keep variant names short and easy to scan.",
    },
  ],
  specFields: [
    {
      label: "Material",
      placeholder: "ABS, Cotton, Steel",
      helper: "Mention the main build material or finish.",
    },
    {
      label: "Size",
      placeholder: "Medium, 42 mm, 1 kg",
      helper: "Use the size or pack information shoppers compare first.",
    },
    {
      label: "Packaging",
      placeholder: "Box contents or included accessories",
      helper: "Tell buyers what is included in the package.",
    },
    {
      label: "Usage",
      placeholder: "Daily use, Indoor, Travel friendly",
      helper: "Describe the ideal use case in a few words.",
    },
  ],
  highlightSuggestions: [
    "Add the strongest value point first.",
    "Mention comfort, quality, or performance benefits.",
    "Call out what makes this listing stand out.",
    "Include one trust signal such as durability or easy care.",
  ],
  deliverySuggestions: [
    "Free delivery available on eligible orders",
    "Seller dispatches quickly after order confirmation",
    "Secure packaging for safe doorstep delivery",
  ],
  returnPolicyHint: "7 day easy return",
  warrantyHint: "Seller support available after purchase",
};

export const categoryListingTemplates: Record<string, CategoryListingTemplate> = {
  Electronics: {
    optionFields: [
      {
        label: "Color",
        placeholder: "Black, Blue, Silver",
        helper: "Use the finish or body color buyers choose most often.",
      },
      {
        label: "Size / Model",
        placeholder: "42 mm, 46 mm, Standard",
        helper: "Add the display size, model, or storage variant.",
      },
    ],
    specFields: [
      {
        label: "Display",
        placeholder: "1.96 inch AMOLED",
        helper: "Mention the screen size and panel type.",
      },
      {
        label: "Battery",
        placeholder: "Up to 7 days",
        helper: "Share the main battery or charging claim.",
      },
      {
        label: "Connectivity",
        placeholder: "Bluetooth 5.3",
        helper: "Add wireless or pairing information.",
      },
      {
        label: "Compatible With",
        placeholder: "Android and iOS",
        helper: "List supported devices or operating systems.",
      },
    ],
    highlightSuggestions: [
      "High-visibility display for everyday use",
      "Smooth connectivity and stable syncing",
      "Long battery life for daily performance",
      "Comfortable build for work, travel, or workouts",
    ],
    deliverySuggestions: [
      "Fast dispatch from seller inventory",
      "Warranty support available on eligible units",
      "Secure packed delivery with order tracking",
    ],
    returnPolicyHint: "7 day replacement on eligible electronics",
    warrantyHint: "6 month seller warranty",
  },
  Fashion: {
    optionFields: [
      {
        label: "Size",
        placeholder: "S, M, L, XL",
        helper: "Add the sizes buyers can choose on the product page.",
      },
      {
        label: "Color",
        placeholder: "Black, Olive, Beige",
        helper: "Use the main shades or print variants.",
      },
    ],
    specFields: [
      {
        label: "Fabric",
        placeholder: "100% Cotton",
        helper: "Mention the material composition clearly.",
      },
      {
        label: "Fit",
        placeholder: "Regular fit",
        helper: "Describe the silhouette or cut.",
      },
      {
        label: "Sleeve / Pattern",
        placeholder: "Half sleeve / Solid",
        helper: "Use the main style details shoppers search for.",
      },
      {
        label: "Care",
        placeholder: "Machine wash",
        helper: "Add a simple care instruction.",
      },
    ],
    highlightSuggestions: [
      "Soft fabric designed for all-day comfort",
      "Easy to style for casual and weekend looks",
      "Clean stitching and durable finish",
      "Breathable construction for everyday wear",
    ],
    deliverySuggestions: [
      "Easy exchange available for size issues",
      "Packed carefully to retain shape and finish",
      "Fast delivery on eligible pin codes",
    ],
    returnPolicyHint: "7 day size exchange and return",
    warrantyHint: "No warranty, exchange support available",
  },
  Home: {
    optionFields: [
      {
        label: "Color",
        placeholder: "Walnut, White, Grey",
        helper: "List the main finish or decor options.",
      },
      {
        label: "Size",
        placeholder: "Small, Medium, Large",
        helper: "Add dimensions or bundle size choices.",
      },
    ],
    specFields: [
      {
        label: "Material",
        placeholder: "Engineered wood",
        helper: "Mention the primary construction material.",
      },
      {
        label: "Dimensions",
        placeholder: "60 x 40 x 30 cm",
        helper: "Add size in a shopper-friendly format.",
      },
      {
        label: "Pack Of",
        placeholder: "1",
        helper: "Tell buyers the unit or set count.",
      },
      {
        label: "Assembly",
        placeholder: "No assembly required",
        helper: "Call out setup expectations clearly.",
      },
    ],
    highlightSuggestions: [
      "Built for practical everyday use at home",
      "Simple design that works across room styles",
      "Easy maintenance and dependable finish",
      "Space-conscious format for modern homes",
    ],
    deliverySuggestions: [
      "Handled with secure packaging for home items",
      "Delivery slots available in many locations",
      "Seller support available for damaged deliveries",
    ],
    returnPolicyHint: "7 day return on eligible home products",
    warrantyHint: "Seller support available after delivery",
  },
  Sports: {
    optionFields: [
      {
        label: "Size",
        placeholder: "6, 7, Medium, Large",
        helper: "Add the size or fit buyers compare first.",
      },
      {
        label: "Color",
        placeholder: "Black, Neon, Blue",
        helper: "Mention the visible color options.",
      },
    ],
    specFields: [
      {
        label: "Material",
        placeholder: "Rubber, EVA, Polyester",
        helper: "Add the core performance material.",
      },
      {
        label: "Ideal For",
        placeholder: "Running, Gym, Yoga",
        helper: "List the main sport or activity use case.",
      },
      {
        label: "Weight",
        placeholder: "450 g",
        helper: "Use approximate weight if relevant.",
      },
      {
        label: "Grip / Support",
        placeholder: "Non-slip sole",
        helper: "Mention the comfort, grip, or support feature.",
      },
    ],
    highlightSuggestions: [
      "Built for regular training and active use",
      "Comfort-focused design with reliable support",
      "Durable construction for repeated performance",
      "Easy to carry, wear, or store after workouts",
    ],
    deliverySuggestions: [
      "Fast dispatch for sports essentials",
      "Carefully packed to protect performance materials",
      "Exchange support available where applicable",
    ],
    returnPolicyHint: "7 day return on unused sports items",
    warrantyHint: "Seller support for manufacturing defects",
  },
  Books: {
    optionFields: [
      {
        label: "Language",
        placeholder: "English, Hindi",
        helper: "List the language options if available.",
      },
      {
        label: "Format",
        placeholder: "Paperback, Hardcover",
        helper: "Mention the print format buyers can choose.",
      },
    ],
    specFields: [
      {
        label: "Author",
        placeholder: "Author name",
        helper: "Add the main author or editor.",
      },
      {
        label: "Publisher",
        placeholder: "Publisher name",
        helper: "Use the imprint or publisher.",
      },
      {
        label: "Pages",
        placeholder: "320",
        helper: "Mention the approximate page count.",
      },
      {
        label: "Genre",
        placeholder: "Self-help, Fiction",
        helper: "Use the main reading category.",
      },
    ],
    highlightSuggestions: [
      "Clear, reader-friendly edition",
      "Good pick for gifting or personal reading",
      "Neatly bound and easy to carry",
      "Useful for repeat reading, study, or collection",
    ],
    deliverySuggestions: [
      "Shipped in protective packaging",
      "Damaged-in-transit support available",
      "Fast delivery on eligible locations",
    ],
    returnPolicyHint: "Replacement available for damaged books",
    warrantyHint: "No warranty on printed books",
  },
  Beauty: {
    optionFields: [
      {
        label: "Shade / Variant",
        placeholder: "Rose, Nude, Brightening",
        helper: "Use shade or formula variants separated by commas.",
      },
      {
        label: "Pack Size",
        placeholder: "30 ml, 100 ml, Pack of 2",
        helper: "Mention size or quantity choices buyers select.",
      },
    ],
    specFields: [
      {
        label: "Skin Type",
        placeholder: "All skin types",
        helper: "Mention the ideal user or skin type.",
      },
      {
        label: "Finish / Texture",
        placeholder: "Matte, Gel, Cream",
        helper: "Describe the feel or finish.",
      },
      {
        label: "Ingredients",
        placeholder: "Vitamin C, Hyaluronic Acid",
        helper: "Highlight hero ingredients only.",
      },
      {
        label: "Expiry / Shelf Life",
        placeholder: "24 months",
        helper: "Add usable shelf life if relevant.",
      },
    ],
    highlightSuggestions: [
      "Designed for an easy daily beauty routine",
      "Smooth application and comfortable finish",
      "Travel-friendly size for regular use",
      "Key ingredients highlighted for buyer clarity",
    ],
    deliverySuggestions: [
      "Sealed packaging for hygiene and safety",
      "Quick dispatch on beauty essentials",
      "Support available for damaged or leaked units",
    ],
    returnPolicyHint: "Return subject to sealed and unused condition",
    warrantyHint: "No warranty, seller support available",
  },
  Toys: {
    optionFields: [
      {
        label: "Age Group",
        placeholder: "3-5 years, 6-8 years",
        helper: "List the age ranges this toy is suitable for.",
      },
      {
        label: "Theme / Color",
        placeholder: "Space, Racing, Pink",
        helper: "Mention the buyer-visible theme or color options.",
      },
    ],
    specFields: [
      {
        label: "Material",
        placeholder: "Plastic, Wood",
        helper: "Add the toy's main build material.",
      },
      {
        label: "Learning Focus",
        placeholder: "Creativity, Motor skills",
        helper: "Describe the play or learning benefit.",
      },
      {
        label: "Battery",
        placeholder: "No / Yes",
        helper: "Mention if batteries are required.",
      },
      {
        label: "Box Contents",
        placeholder: "24 pieces",
        helper: "Tell parents what comes inside the pack.",
      },
    ],
    highlightSuggestions: [
      "Kid-friendly design for engaging playtime",
      "Made for repeat use and easy handling",
      "Supports learning, creativity, or coordination",
      "Compact enough for home storage or gifting",
    ],
    deliverySuggestions: [
      "Protective packaging for toy boxes and parts",
      "Fast dispatch on kids essentials",
      "Support available for damaged packaging on delivery",
    ],
    returnPolicyHint: "7 day return on unused toys",
    warrantyHint: "No warranty unless stated by seller",
  },
  Food: {
    optionFields: [
      {
        label: "Flavor",
        placeholder: "Chocolate, Masala, Mixed Fruit",
        helper: "List the pack flavors buyers can choose.",
      },
      {
        label: "Pack Size",
        placeholder: "500 g, 1 kg, Pack of 4",
        helper: "Use quantity or bundle sizes separated by commas.",
      },
    ],
    specFields: [
      {
        label: "Type",
        placeholder: "Snack, Beverage, Supplement",
        helper: "Mention the product food type.",
      },
      {
        label: "Weight",
        placeholder: "500 g",
        helper: "Add the net quantity clearly.",
      },
      {
        label: "Diet Preference",
        placeholder: "Vegetarian, Vegan",
        helper: "Use the food preference or dietary note.",
      },
      {
        label: "Shelf Life",
        placeholder: "9 months",
        helper: "Mention the approximate shelf life.",
      },
    ],
    highlightSuggestions: [
      "Freshly packed for reliable quality",
      "Convenient format for daily use or storage",
      "Simple ingredient and quantity information for buyers",
      "Good fit for repeat orders and pantry stocking",
    ],
    deliverySuggestions: [
      "Packed securely to protect freshness",
      "Quick dispatch for grocery and food orders",
      "Seller support available for damaged packaging",
    ],
    returnPolicyHint: "Returns depend on perishability and seal condition",
    warrantyHint: "Best-before support available through seller",
  },
  Automotive: {
    optionFields: [
      {
        label: "Vehicle Type",
        placeholder: "Bike, Car, Universal",
        helper: "List the supported vehicle types or fitment group.",
      },
      {
        label: "Pack Size",
        placeholder: "Single, Pack of 2",
        helper: "Mention bundle size or kit options.",
      },
    ],
    specFields: [
      {
        label: "Compatibility",
        placeholder: "Universal fit",
        helper: "Add model or vehicle compatibility details.",
      },
      {
        label: "Material",
        placeholder: "Alloy, ABS, Rubber",
        helper: "Mention the main automotive-grade material.",
      },
      {
        label: "Installation",
        placeholder: "Tool-free installation",
        helper: "Describe how it is fitted or used.",
      },
      {
        label: "Usage",
        placeholder: "Interior, Exterior, Maintenance",
        helper: "Tell buyers where or how the item is used.",
      },
    ],
    highlightSuggestions: [
      "Built for practical everyday automotive use",
      "Easy fitment or installation support",
      "Durable construction for regular wear and tear",
      "Helpful upgrade or replacement for vehicle care",
    ],
    deliverySuggestions: [
      "Packed securely for transit protection",
      "Quick dispatch on eligible automotive supplies",
      "Seller assistance available for compatibility questions",
    ],
    returnPolicyHint: "Return subject to unused condition and compatibility check",
    warrantyHint: "Warranty depends on seller and brand policy",
  },
};

export const getCategoryListingTemplate = (category?: string) =>
  categoryListingTemplates[category || ""] || defaultTemplate;
