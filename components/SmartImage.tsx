import { useState } from "react";
import {
  ActivityIndicator,
  DimensionValue,
  Image,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";

interface SmartImageProps {
  uri?: string | null;
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  resizeMode?: "cover" | "contain" | "stretch";
  fallbackEmoji?: string;
  fallbackColor?: string;
  style?: StyleProp<ViewStyle>;
}

export default function SmartImage({
  uri,
  width,
  height,
  borderRadius = 0,
  resizeMode = "cover",
  fallbackEmoji = "🛍",
  fallbackColor = "#F0F2F5",
  style,
}: SmartImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const containerStyle: StyleProp<ViewStyle> = [
    {
      width,
      height,
      borderRadius,
      backgroundColor: fallbackColor,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    style,
  ];

  if (error || !uri) {
    return (
      <View style={containerStyle}>
        <Text style={{ fontSize: 28 }}>{fallbackEmoji}</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {loading ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: fallbackColor,
          }}
        >
          <ActivityIndicator size="small" color="#0066CC" />
        </View>
      ) : null}
      <Image
        source={{ uri }}
        style={{
          width: "100%",
          height: "100%",
        }}
        resizeMode={resizeMode}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    </View>
  );
}
