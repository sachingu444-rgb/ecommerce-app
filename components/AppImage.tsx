import { Image, ImageStyle, StyleProp, View, ViewStyle } from "react-native";
import { useState } from "react";

import { fallbackImage } from "../constants/mockData";
import { colors, radius } from "../constants/theme";

interface AppImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
}

export const AppImage = ({
  uri,
  style,
  containerStyle,
  resizeMode = "cover",
}: AppImageProps) => {
  const [failed, setFailed] = useState(false);

  return (
    <View
      style={[
        {
          overflow: "hidden",
          backgroundColor: colors.primaryLight,
          borderRadius: radius.md,
        },
        containerStyle,
      ]}
    >
      <Image
        source={{ uri: failed ? fallbackImage : uri || fallbackImage }}
        style={[{ width: "100%", height: "100%" }, style]}
        resizeMode={resizeMode}
        onError={() => setFailed(true)}
      />
    </View>
  );
};

export default AppImage;

