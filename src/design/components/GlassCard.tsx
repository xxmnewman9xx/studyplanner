import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { schoolColors, schoolRadius, schoolShadows, schoolSpacing } from "../tokens";

type GlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
};

export function GlassCard({ children, style, glowColor = schoolColors.blueTint }: GlassCardProps) {
  return (
    <View style={[styles.card, { borderColor: glowColor }, style]}>
      <View pointerEvents="none" style={[styles.glow, { backgroundColor: glowColor }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderRadius: schoolRadius.xl,
    padding: schoolSpacing.lg,
    ...schoolShadows.hero
  },
  glow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -92,
    left: -62,
    opacity: 0.48
  }
});
