import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import React from "react";
import { Platform, StyleProp, View, ViewStyle } from "react-native";

type LiquidGlassSurfaceProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fallbackStyle?: StyleProp<ViewStyle>;
  tintColor?: string;
  intensity?: number;
  interactive?: boolean;
  glassEffectStyle?: "regular" | "clear";
  colorScheme?: "light" | "dark" | "auto";
};

let liquidGlassAvailable: boolean | undefined;

export function canUseLiquidGlassSurface() {
  if (Platform.OS !== "ios") return false;
  if (liquidGlassAvailable !== undefined) return liquidGlassAvailable;
  try {
    liquidGlassAvailable = Boolean(isGlassEffectAPIAvailable() && isLiquidGlassAvailable());
  } catch {
    liquidGlassAvailable = false;
  }
  return liquidGlassAvailable;
}

export function LiquidGlassSurface({
  children,
  style,
  fallbackStyle,
  tintColor = "rgba(255,255,255,0.72)",
  intensity = 82,
  interactive = false,
  glassEffectStyle = "regular",
  colorScheme = "auto",
}: LiquidGlassSurfaceProps) {
  if (canUseLiquidGlassSurface()) {
    return (
      <GlassView
        colorScheme={colorScheme}
        glassEffectStyle={glassEffectStyle}
        isInteractive={interactive}
        tintColor={tintColor}
        style={style}
      >
        {children}
      </GlassView>
    );
  }

  return <View style={[style, fallbackStyle]}>{children}</View>;
}
