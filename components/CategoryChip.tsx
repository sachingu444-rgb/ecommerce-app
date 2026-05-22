import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { colors, radius, spacing } from "../constants/theme";

interface CategoryChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  active?: boolean;
  onPress?: () => void;
  palette?: {
    surface: string;
    text: string;
    border: string;
  };
}

const CategoryChip = ({
  icon,
  label,
  color,
  active = false,
  onPress,
  palette,
}: CategoryChipProps) => {
  const chipPalette = palette || {
    surface: colors.white,
    text: colors.text,
    border: colors.border,
  };

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 2,
        backgroundColor: active ? color : chipPalette.surface,
        borderColor: active ? color : chipPalette.border,
        borderWidth: 1,
        borderRadius: radius.pill,
        marginRight: spacing.sm,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: active ? "rgba(255,255,255,0.2)" : `${color}14`,
        }}
      >
        <Ionicons
          name={icon}
          size={16}
          color={active ? colors.white : color}
        />
      </View>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: active ? colors.white : chipPalette.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export default CategoryChip;
