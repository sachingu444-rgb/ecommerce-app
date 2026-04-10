import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors, radius, spacing } from "../constants/theme";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  buttonLabel?: string;
  onPress?: () => void;
}

const EmptyState = ({
  icon,
  title,
  subtitle,
  buttonLabel,
  onPress,
}: EmptyStateProps) => {
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.xxxl,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.md,
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.primaryLight,
        }}
      >
        <Ionicons name={icon} size={42} color={colors.muted} />
      </View>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "800",
          color: colors.text,
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.muted,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        {subtitle}
      </Text>
      {buttonLabel && onPress ? (
        <Pressable
          onPress={onPress}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: spacing.xxl,
            paddingVertical: spacing.md,
            borderRadius: radius.pill,
            marginTop: spacing.sm,
          }}
        >
          <Text style={{ color: colors.white, fontWeight: "800" }}>{buttonLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

export default EmptyState;

