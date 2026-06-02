import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  TextInput,
  TextInputProps,
  useWindowDimensions,
  View,
} from "react-native";

import { MOBILE_BREAKPOINT } from "../constants/layout";
import { colors, radius, spacing } from "../constants/theme";

interface FormFieldProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  secureToggle?: boolean;
  secureVisible?: boolean;
  onToggleSecure?: () => void;
  inputStyle?: StyleProp<TextStyle>;
}

const FormField = ({
  label,
  icon,
  error,
  secureToggle = false,
  secureVisible = false,
  onToggleSecure,
  inputStyle,
  ...props
}: FormFieldProps) => {
  const { width } = useWindowDimensions();
  const compact = width < MOBILE_BREAKPOINT;

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? (
        <Text
          style={{
            color: colors.text,
            fontSize: compact ? 14 : 13,
            fontWeight: "700",
            marginBottom: spacing.sm,
            lineHeight: compact ? 20 : 18,
          }}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          backgroundColor: colors.white,
          paddingHorizontal: spacing.md,
          minHeight: compact ? 54 : 50,
        }}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={error ? colors.danger : colors.muted}
            style={{ marginRight: spacing.sm }}
          />
        ) : null}
        <TextInput
          placeholderTextColor={colors.muted}
          keyboardAppearance="light"
          cursorColor={colors.primary}
          selectionColor={colors.primaryLight}
          style={[
            {
              flex: 1,
              minHeight: compact ? 54 : 50,
              color: colors.text,
              fontSize: compact ? 16 : 15,
              lineHeight: compact ? 22 : 20,
              paddingVertical: spacing.md,
            },
            inputStyle,
            props.style,
          ]}
          {...props}
        />
        {secureToggle ? (
          <Pressable onPress={onToggleSecure}>
            <Ionicons
              name={secureVisible ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.muted}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={{ color: colors.danger, marginTop: 6, fontSize: 12 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

export default FormField;
