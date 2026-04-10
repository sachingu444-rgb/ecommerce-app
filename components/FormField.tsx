import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

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
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? (
        <Text
          style={{
            color: colors.text,
            fontSize: 13,
            fontWeight: "700",
            marginBottom: spacing.sm,
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
          style={[
            {
              flex: 1,
              minHeight: 50,
              color: colors.text,
              fontSize: 15,
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
