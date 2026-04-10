import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { colors, spacing } from "../constants/theme";

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
}

const StarRating = ({
  rating,
  size = 14,
  color = colors.star,
}: StarRatingProps) => {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
      {Array.from({ length: 5 }).map((_, index) => {
        const position = index + 1;
        let iconName: keyof typeof Ionicons.glyphMap = "star-outline";

        if (rating >= position) {
          iconName = "star";
        } else if (rating >= position - 0.5) {
          iconName = "star-half";
        }

        return <Ionicons key={`${index}-${iconName}`} name={iconName} size={size} color={color} />;
      })}
    </View>
  );
};

export default StarRating;

