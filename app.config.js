const googleServicesFile = process.env.GOOGLE_SERVICES_FILE;

module.exports = {
  expo: {
    name: "ShopApp Marketplace",
    slug: "shopapp-marketplace",
    scheme: "shopapp",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/branding/sachindia-startup-logo.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
    },

    experiments: {
      typedRoutes: true,
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.shopapp.marketplace",
    },

    android: {
      package: "com.shopapp.marketplace",
      adaptiveIcon: {
        backgroundColor: "#0066CC",
      },
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },

    web: {
      bundler: "metro",
    },

    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "expo-notifications",
    ],

    // 🔥 IMPORTANT (EAS LINK)
    extra: {
      eas: {
        projectId: "6fff9651-a6d7-4ad4-83cc-f56a341dd5fb"
      }
    }
  }
};
