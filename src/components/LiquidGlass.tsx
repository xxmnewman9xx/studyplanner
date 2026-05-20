import React from "react";
import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type Tone = "default" | "hero" | "accent" | "success" | "warning" | "danger";

export function LiquidGlassSurface({ children, tone = "default", style }: { children: React.ReactNode; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={[styles.surface, tone === "hero" ? styles.hero : tone === "accent" ? styles.accent : null, style]}>
      <View pointerEvents="none" style={styles.orbPrimary} />
      <View pointerEvents="none" style={styles.orbSecondary} />
      {children}
    </View>
  );
}

export function LiquidGlassBadge({ label, tone = "default", style, textStyle }: { label: string; tone?: Tone; style?: StyleProp<ViewStyle>; textStyle?: StyleProp<TextStyle> }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return <View style={[styles.badge, badgeTone(styles, tone), style]}><Text style={[styles.badgeText, textStyle]}>{label}</Text></View>;
}

export function LiquidGlassRail({ value, tone = "accent" }: { value: number; tone?: Tone }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return <View style={styles.rail}><View style={[styles.railFill, railTone(styles, tone), { width: `${Math.max(4, Math.min(100, Math.round(value * 100)))}%` }]} /></View>;
}

export function LiquidGlassCTA({ label, icon: Icon, onPress, tone = "accent", style }: { label: string; icon?: LucideIcon; onPress: () => void; tone?: Tone; style?: StyleProp<ViewStyle> }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[styles.cta, railTone(styles, tone), style]}>
      {Icon ? <Icon color={colors.heroText} size={16} /> : null}
      <Text style={styles.ctaText}>{label}</Text>
    </TouchableOpacity>
  );
}

function badgeTone(styles: ReturnType<typeof createStyles>, tone: Tone) {
  if (tone === "success") return styles.success;
  if (tone === "warning") return styles.warning;
  if (tone === "danger") return styles.danger;
  if (tone === "accent" || tone === "hero") return styles.accentBadge;
  return styles.defaultBadge;
}

function railTone(styles: ReturnType<typeof createStyles>, tone: Tone) {
  if (tone === "success") return styles.success;
  if (tone === "warning") return styles.warning;
  if (tone === "danger") return styles.danger;
  return styles.accentFill;
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;
  return StyleSheet.create({
    surface: { borderRadius: radii.xl, borderWidth: 1, borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.82)", backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.72)", padding: spacing.md, overflow: "hidden", shadowColor: colors.shadow, shadowOpacity: theme.isDark ? 0.20 : 0.08, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 2 },
    hero: { backgroundColor: colors.heroSurface, borderColor: theme.isDark ? "rgba(255,255,255,0.18)" : "rgba(49,91,255,0.18)" },
    accent: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
    orbPrimary: { position: "absolute", right: -46, top: -58, width: 132, height: 132, borderRadius: 66, backgroundColor: colors.brandViolet, opacity: theme.isDark ? 0.18 : 0.10 },
    orbSecondary: { position: "absolute", left: -34, bottom: -50, width: 112, height: 112, borderRadius: 56, backgroundColor: colors.accent, opacity: theme.isDark ? 0.12 : 0.07 },
    badge: { alignSelf: "flex-start", borderRadius: radii.round, paddingHorizontal: spacing.sm, paddingVertical: 6 },
    badgeText: { color: colors.heroText, fontSize: 11, lineHeight: 14, fontWeight: "900" },
    defaultBadge: { backgroundColor: colors.surfaceAlt },
    accentBadge: { backgroundColor: colors.accent },
    success: { backgroundColor: colors.green },
    warning: { backgroundColor: colors.gold },
    danger: { backgroundColor: colors.red },
    rail: { height: 8, borderRadius: radii.round, backgroundColor: colors.surfaceAlt, overflow: "hidden" },
    railFill: { height: "100%", borderRadius: radii.round },
    accentFill: { backgroundColor: colors.accent },
    cta: { minHeight: 42, borderRadius: radii.round, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs },
    ctaText: { color: colors.heroText, fontSize: 13, lineHeight: 17, fontWeight: "900" }
  });
}
