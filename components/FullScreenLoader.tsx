import { ActivityIndicator, Image, SafeAreaView, Text, View } from "react-native";

import { colors, spacing } from "../constants/theme";

const startupLogo = require("../assets/branding/sachindia-startup-logo.png");

const FullScreenLoader = ({ label = "Preparing SACHINDIA..." }: { label?: string }) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xxl,
        }}
      >
        <View style={{ width: "100%", maxWidth: 360, alignItems: "center" }}>
          <Image
            source={startupLogo}
            resizeMode="contain"
            style={{
              width: "100%",
              height: 360,
            }}
          />

          <View style={{ marginTop: spacing.lg, alignItems: "center", gap: spacing.sm }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text
              style={{
                color: colors.primaryDark,
                fontSize: 16,
                fontWeight: "800",
                textAlign: "center",
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                color: colors.muted,
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Secure shopping, quick checkout, and daily deals are loading.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FullScreenLoader;

