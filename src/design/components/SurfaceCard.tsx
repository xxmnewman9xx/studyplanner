import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { schoolColors, schoolRadius, schoolShadows, schoolSpacing } from "../tokens";

type SurfaceCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export function SurfaceCard({ children, style, compact = false }: SurfaceCardProps) {
  return <View style={[styles.card, compact ? styles.compact : null, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: schoolColors.surface,
    borderWidth: 1,
    borderColor: schoolColors.line,
    borderRadius: schoolRadius.lg,
    padding: schoolSpacing.md,
    ...schoolShadows.surface
  },
  compact: {
    padding: schoolSpacing.sm,
    borderRadius: schoolRadius.md
  }
});
