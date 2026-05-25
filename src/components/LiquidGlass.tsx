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
      <View pointerEvents="none" style={styles.topHighlight} />
      <View pointerEvents="none" style={styles.innerLens} />
      <View pointerEvents="none" style={styles.bottomHairline} />
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
    surface: { borderRadius: radii.xl, borderWidth: 1, borderColor: theme.isDark ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.88)", backgroundColor: theme.isDark ? "rgba(18,25,42,0.76)" : "rgba(255,255,255,0.80)", padding: spacing.md, overflow: "hidden", shadowColor: colors.shadow, shadowOpacity: theme.isDark ? 0.36 : 0.13, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 4 },
    hero: { backgroundColor: theme.isDark ? "rgba(8,12,22,0.92)" : colors.heroSurface, borderColor: theme.isDark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.28)" },
    accent: { backgroundColor: theme.isDark ? "rgba(53,242,208,0.14)" : colors.accentSoft, borderColor: colors.accent },
    topHighlight: { position: "absolute", top: 0, left: 0, right: 0, height: "46%", backgroundColor: theme.isDark ? "rgba(255,255,255,0.085)" : "rgba(255,255,255,0.56)" },
    innerLens: { position: "absolute", right: 12, top: 10, width: "58%", height: 28, borderRadius: radii.round, backgroundColor: theme.isDark ? "rgba(255,255,255,0.085)" : "rgba(255,255,255,0.50)", opacity: 0.72 },
    bottomHairline: { position: "absolute", left: 14, right: 14, bottom: 0, height: StyleSheet.hairlineWidth, backgroundColor: theme.isDark ? "rgba(255,255,255,0.18)" : "rgba(17,24,39,0.08)" },
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
    cta: { minHeight: 42, borderRadius: radii.round, paddingHorizontal: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, overflow: "hidden" },
    ctaText: { color: colors.heroText, fontSize: 13, lineHeight: 17, fontWeight: "900" }
  });
}
