import { ReactNode } from "react";
import { Platform, useWindowDimensions, View } from "react-native";

import { APP_MAX_WIDTH } from "../constants/layout";
import { spacing } from "../constants/theme";

interface ResponsiveGridProps<T> {
  items: T[];
  renderItem: (item: T, itemWidth: number, index: number) => ReactNode;
  minItemWidth?: number;
  maxItemWidth?: number;
  gap?: number;
  horizontalPadding?: number;
  maxContainerWidth?: number;
}

export default function ResponsiveGrid<T>({
  items,
  renderItem,
  minItemWidth = 180,
  maxItemWidth = 240,
  gap = spacing.md,
  horizontalPadding = spacing.lg,
  maxContainerWidth = APP_MAX_WIDTH,
}: ResponsiveGridProps<T>) {
  const { width: windowWidth } = useWindowDimensions();
  const availableWidth =
    Platform.OS === "web"
      ? Math.min(windowWidth, maxContainerWidth) - horizontalPadding * 2
      : windowWidth - horizontalPadding * 2;
  const columns = Math.max(
    1,
    Math.floor((availableWidth + gap) / (minItemWidth + gap))
  );
  const itemWidth = Math.min(
    maxItemWidth,
    Math.floor((availableWidth - gap * (columns - 1)) / columns)
  );

  return (
    <View
      style={{
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap,
      }}
    >
      {items.map((item, index) => renderItem(item, itemWidth, index))}
    </View>
  );
}
