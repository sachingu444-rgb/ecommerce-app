import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, Text } from "react-native";

import { colors, radius, spacing } from "../constants/theme";

interface GoogleAuthButtonProps {
  disabled?: boolean;
  loading?: boolean;
  label: string;
  onPress: () => void;
}

export default function GoogleAuthButton({
  disabled,
  loading,
  label,
  onPress,
}: GoogleAuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        marginTop: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
        paddingVertical: spacing.md + 2,
        paddingHorizontal: spacing.lg,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled || loading ? 0.65 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Ionicons
            name="logo-google"
            size={18}
            color={colors.primary}
            style={{ marginRight: spacing.sm }}
          />
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
