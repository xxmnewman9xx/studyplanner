// Private building blocks that reproduce App.tsx's Card / Button / Pill /
// ProgressBar language for the 2.2 components. Not exported from index.ts;
// App.tsx keeps its own primitives.
import React from "react";
import { Animated, Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { useEasedValue } from "./motion";
import type { AITheme } from "./theme";
import { BUTTON_HEIGHT, cardShadow, COLORS, HERO, heroBackground, RADII, SPACE, tint, TOUCH, TYPE } from "./tokens";

export function AICard({ theme, style, children }: { theme: AITheme; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return (
    <View
      style={[
        {
          backgroundColor: theme.surface,
          borderRadius: RADII.card,
          borderWidth: 1,
          borderColor: theme.hairline,
          boxShadow: cardShadow(theme),
          padding: SPACE.lg + 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function HeroCard({ theme, tone = "plum", style, children }: { theme: AITheme; tone?: "plum" | "ink"; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return (
    <View style={[{ borderRadius: RADII.hero, padding: SPACE.xl + 2, backgroundColor: tone === "ink" ? HERO.ink : heroBackground(theme), overflow: "hidden" }, style]}>
      {children}
    </View>
  );
}

/** Uppercase-style kicker. On heroes it sits in a translucent capsule like SemesterKickoff. */
export function Kicker({ text, theme, onHero = false, color, capsule = false }: { text: string; theme: AITheme; onHero?: boolean; color?: string; capsule?: boolean }) {
  const label = (
    <Text selectable style={{ color: color || (onHero ? HERO.onHero3 : theme.label2), fontSize: onHero && capsule ? TYPE.kicker : TYPE.caption, fontWeight: "900", letterSpacing: 0.7 }}>
      {text}
    </Text>
  );
  if (!capsule) return label;
  return (
    <View style={{ alignSelf: "flex-start", borderRadius: RADII.pill, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: onHero ? HERO.chip : theme.surface2 }}>
      {label}
    </View>
  );
}

export type AIButtonVariant = "primary" | "secondary" | "onHero" | "onHeroSecondary" | "destructive";

export function AIButton({
  label,
  theme,
  onPress,
  variant = "primary",
  icon: Icon,
  accessibilityHint,
  disabled,
  compact = false,
  style,
}: {
  label: string;
  theme: AITheme;
  onPress?: () => void;
  variant?: AIButtonVariant;
  icon?: LucideIcon;
  accessibilityHint?: string;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inactive = disabled || !onPress;
  const colors = {
    primary: { bg: theme.accent, fg: "#FFFFFF", border: "transparent" },
    secondary: { bg: theme.surface3, fg: theme.label, border: "transparent" },
    onHero: { bg: "#FFFFFF", fg: HERO.ink, border: "transparent" },
    onHeroSecondary: { bg: "transparent", fg: "#FFFFFF", border: HERO.outline },
    destructive: { bg: tint(COLORS.red, "1C"), fg: COLORS.red, border: "transparent" },
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: compact ? TOUCH : BUTTON_HEIGHT,
          borderRadius: RADII.pill,
          backgroundColor: inactive && variant === "primary" ? theme.surface3 : colors.bg,
          borderWidth: variant === "onHeroSecondary" ? 1 : 0,
          borderColor: colors.border,
          opacity: inactive ? 0.54 : pressed ? 0.82 : 1,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: SPACE.sm,
          paddingHorizontal: compact ? 14 : 18,
          paddingVertical: SPACE.sm,
        },
        style,
      ]}
    >
      {Icon ? <Icon color={inactive && variant === "primary" ? theme.label : colors.fg} size={compact ? 16 : 18} strokeWidth={2.4} /> : null}
      <Text style={{ color: inactive && variant === "primary" ? theme.label : colors.fg, fontSize: compact ? TYPE.body : TYPE.callout, fontWeight: "900", flexShrink: 1, textAlign: "center" }}>{label}</Text>
    </Pressable>
  );
}

/** Text link with a 44pt target. */
export function LinkButton({ label, color, icon: Icon, onPress, accessibilityHint }: { label: string; color: string; icon?: LucideIcon; onPress?: () => void; accessibilityHint?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => ({ minHeight: TOUCH, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", opacity: pressed ? 0.6 : 1 })}
    >
      {Icon ? <Icon color={color} size={15} strokeWidth={2.4} /> : null}
      <Text style={{ color, fontSize: TYPE.footnote + 1, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

/** App.tsx Pill, with an optional lucide icon. */
export function Pill({ text, color, theme, icon: Icon, onHero = false }: { text: string; color?: string; theme: AITheme; icon?: LucideIcon; onHero?: boolean }) {
  const c = color || (onHero ? HERO.onHero2 : theme.label2);
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 5,
        alignItems: "center",
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: RADII.pill,
        backgroundColor: onHero ? HERO.chip : /^#[0-9a-f]{6}$/i.test(c) ? tint(c, "1C") : theme.surface2,
      }}
    >
      {Icon ? <Icon size={13} color={c} strokeWidth={2.4} /> : null}
      <Text selectable style={{ color: c, fontSize: TYPE.caption, fontWeight: "800" }}>{text}</Text>
    </View>
  );
}

/** Class code capsule with the class color dot. */
export function ClassChip({ label, color, theme, onHero = false }: { label: string; color: string; theme: AITheme; onHero?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: RADII.pill,
        backgroundColor: onHero ? HERO.chip : theme.surface2,
        borderWidth: onHero ? 0 : 1,
        borderColor: theme.hairline,
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: RADII.pill, backgroundColor: color }} />
      <Text selectable numberOfLines={1} style={{ color: onHero ? HERO.onHero : theme.label, fontSize: TYPE.caption, fontWeight: "900" }}>{label}</Text>
    </View>
  );
}

/** Determinate bar that eases to its value. `value` is 0..1. */
export function ProgressBar({ value, color, track, height = 8 }: { value: number; color: string; track: string; height?: number }) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const eased = useEasedValue(safe);
  const width = eased.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <View style={{ height, borderRadius: RADII.pill, backgroundColor: track, overflow: "hidden" }}>
      <Animated.View style={{ height: "100%", width, borderRadius: RADII.pill, backgroundColor: color }} />
    </View>
  );
}

/** Forward chevron that mirrors in RTL. */
export function ForwardChevron({ rtl, color, size = 18 }: { rtl: boolean; color: string; size?: number }) {
  return (
    <View style={{ transform: [{ scaleX: rtl ? -1 : 1 }] }}>
      <ChevronRight color={color} size={size} strokeWidth={2.4} />
    </View>
  );
}

/** Rounded icon tile used at the leading edge of rows (App.tsx 44pt tiles). */
export function IconTile({ icon: Icon, color, size = TOUCH, onHero = false }: { icon: LucideIcon; color: string; size?: number; onHero?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: Math.round(size * 0.32), backgroundColor: onHero ? HERO.chip : tint(color, "1C"), alignItems: "center", justifyContent: "center" }}>
      <Icon color={onHero ? "#FFFFFF" : color} size={Math.round(size * 0.5)} strokeWidth={2.2} />
    </View>
  );
}

/** App.tsx ScannerActionButton language: icon tile, title, detail, chevron. */
export function ActionRow({
  icon: Icon,
  color,
  label,
  detail,
  onPress,
  theme,
  rtl,
  featured = false,
  accessibilityHint,
}: {
  icon: LucideIcon;
  color: string;
  label: string;
  detail?: string;
  onPress?: () => void;
  theme: AITheme;
  rtl: boolean;
  featured?: boolean;
  accessibilityHint?: string;
}) {
  const inactive = !onPress;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: featured ? 78 : 70,
        borderRadius: featured ? RADII.panel : 18,
        padding: 14,
        backgroundColor: featured ? color : theme.surface,
        borderWidth: 1,
        borderColor: featured ? color : theme.hairline,
        opacity: inactive ? 0.58 : pressed ? 0.82 : 1,
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE.md,
      })}
    >
      <View style={{ width: featured ? 48 : 42, height: featured ? 48 : 42, borderRadius: featured ? 16 : RADII.inner, backgroundColor: featured ? HERO.chipStrong : tint(color, "18"), alignItems: "center", justifyContent: "center" }}>
        <Icon color={featured ? "#FFFFFF" : color} size={featured ? 24 : 21} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: featured ? "#FFFFFF" : theme.label, fontSize: featured ? TYPE.headline : TYPE.callout, fontWeight: "900" }}>{label}</Text>
        {detail ? <Text style={{ color: featured ? "rgba(255,255,255,0.84)" : theme.label2, lineHeight: 18, marginTop: 3 }}>{detail}</Text> : null}
      </View>
      <ForwardChevron rtl={rtl} color={featured ? "rgba(255,255,255,0.76)" : theme.label3} size={20} />
    </Pressable>
  );
}
