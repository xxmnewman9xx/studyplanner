import React, { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle
} from "react-native";
import { LucideIcon } from "lucide-react-native";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type Tone = "default" | "hero" | "accent" | "success" | "warning" | "danger";

type GlassProps = {
  children: React.ReactNode;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

type GlassPrefs = {
  reduceTransparency: boolean;
  increaseContrast: boolean;
  reduceMotion: boolean;
};

export function LiquidGlassSurface({
  children,
  tone = "default",
  style,
  accessibilityLabel
}: GlassProps) {
  const { theme } = useAppTheme();
  const prefs = useGlassPreferences();
  const styles = useMemo(() => createStyles(theme, prefs), [prefs, theme]);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.surface, surfaceTone(styles, tone), style]}
    >
      <GlassLayers styles={styles} reduced={prefs.reduceTransparency} />
      {children}
    </View>
  );
}

export function LiquidGlassCard(props: GlassProps) {
  return <LiquidGlassSurface {...props} />;
}

export function LiquidGlassHero(props: GlassProps) {
  return <LiquidGlassSurface {...props} tone="hero" />;
}

export function LiquidGlassSidebar(props: GlassProps) {
  const { theme } = useAppTheme();
  const prefs = useGlassPreferences();
  const styles = useMemo(() => createStyles(theme, prefs), [prefs, theme]);
  return <LiquidGlassSurface {...props} style={[styles.sidebar, props.style]} />;
}

export function LiquidGlassWidgetPreview({
  children,
  label,
  style
}: {
  children: React.ReactNode;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const prefs = useGlassPreferences();
  const styles = useMemo(() => createStyles(theme, prefs), [prefs, theme]);

  return (
    <LiquidGlassSurface
      tone="hero"
      accessibilityLabel={label}
      style={[styles.widgetPreviewStage, style]}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={styles.previewAmbient}
      />
      {children}
    </LiquidGlassSurface>
  );
}

export function LiquidGlassButton({
  label,
  icon: Icon,
  onPress,
  tone = "accent",
  disabled = false,
  style
}: {
  label: string;
  icon?: LucideIcon;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const prefs = useGlassPreferences();
  const styles = useMemo(() => createStyles(theme, prefs), [prefs, theme]);
  const foreground = tone === "accent" ? theme.colors.accentText : buttonTextColor(theme, tone);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        surfaceTone(styles, tone),
        pressed && !prefs.reduceMotion ? styles.buttonPressed : null,
        disabled ? styles.disabled : null,
        style
      ]}
    >
      <GlassLayers styles={styles} reduced={prefs.reduceTransparency} compact />
      {Icon ? <Icon color={foreground} size={16} /> : null}
      <Text style={[styles.buttonText, { color: foreground }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
        {label}
      </Text>
    </Pressable>
  );
}

export function LiquidGlassTabBar({
  children,
  style
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const prefs = useGlassPreferences();
  const styles = useMemo(() => createStyles(theme, prefs), [prefs, theme]);

  return (
    <View style={[styles.tabBar, style]}>
      <GlassLayers styles={styles} reduced={prefs.reduceTransparency} compact />
      {children}
    </View>
  );
}

export function LiquidGlassControlPill({
  label,
  active,
  onPress,
  style
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const prefs = useGlassPreferences();
  const styles = useMemo(() => createStyles(theme, prefs), [prefs, theme]);
  const content = (
    <>
      <GlassLayers styles={styles} reduced={prefs.reduceTransparency} compact />
      <Text style={[styles.pillText, active ? styles.pillTextActive : null]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
        {label}
      </Text>
    </>
  );

  if (!onPress) {
    return <View style={[styles.pill, active ? styles.pillActive : null, style]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active ? styles.pillActive : null,
        pressed && !prefs.reduceMotion ? styles.pillPressed : null,
        style
      ]}
    >
      {content}
    </Pressable>
  );
}

export function LiquidGlassScoreBadge({
  label,
  score,
  tone = "accent",
  style
}: {
  label: string;
  score: string | number;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <LiquidGlassBadge
      label={`${label} ${score}`}
      tone={tone}
      style={style}
    />
  );
}

export function LiquidGlassBadge({
  label,
  tone = "default",
  style,
  textStyle
}: {
  label: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { theme } = useAppTheme();
  const prefs = useGlassPreferences();
  const styles = useMemo(() => createStyles(theme, prefs), [prefs, theme]);

  return (
    <View style={[styles.badge, badgeTone(styles, tone), style]}>
      <Text style={[styles.badgeText, badgeTextTone(styles, tone), textStyle]}>{label}</Text>
    </View>
  );
}

export function LiquidGlassRail({ value, tone = "accent" }: { value: number; tone?: Tone }) {
  const { theme } = useAppTheme();
  const prefs = useGlassPreferences();
  const styles = useMemo(() => createStyles(theme, prefs), [prefs, theme]);
  return <View style={styles.rail}><View style={[styles.railFill, railTone(styles, tone), { width: `${Math.max(4, Math.min(100, Math.round(value * 100)))}%` }]} /></View>;
}

export function LiquidGlassCTA({
  label,
  icon,
  onPress,
  tone = "accent",
  style
}: {
  label: string;
  icon?: LucideIcon;
  onPress: () => void;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}) {
  return <LiquidGlassButton label={label} icon={icon} onPress={onPress} tone={tone} style={style} />;
}

function GlassLayers({
  styles,
  reduced,
  compact = false
}: {
  styles: ReturnType<typeof createStyles>;
  reduced: boolean;
  compact?: boolean;
}) {
  if (reduced) {
    return <View pointerEvents="none" style={styles.reducedFallbackEdge} />;
  }

  return (
    <>
      <View pointerEvents="none" style={[styles.topHighlight, compact ? styles.topHighlightCompact : null]} />
      <View pointerEvents="none" style={styles.innerLens} />
      <View pointerEvents="none" style={styles.ambientSpill} />
      <View pointerEvents="none" style={styles.bottomHairline} />
    </>
  );
}

function useGlassPreferences(): GlassPrefs {
  const [prefs, setPrefs] = useState<GlassPrefs>({
    reduceTransparency: false,
    increaseContrast: false,
    reduceMotion: false
  });

  useEffect(() => {
    let mounted = true;
    const api = AccessibilityInfo as any;
    const update = (patch: Partial<GlassPrefs>) => {
      if (mounted) setPrefs((current) => ({ ...current, ...patch }));
    };

    api.isReduceTransparencyEnabled?.().then((value: boolean) => update({ reduceTransparency: value }));
    api.isReduceMotionEnabled?.().then((value: boolean) => update({ reduceMotion: value }));
    api.isBoldTextEnabled?.().then((value: boolean) => update({ increaseContrast: value }));

    const subscriptions = [
      api.addEventListener?.("reduceTransparencyChanged", (value: boolean) => update({ reduceTransparency: value })),
      api.addEventListener?.("reduceMotionChanged", (value: boolean) => update({ reduceMotion: value })),
      api.addEventListener?.("boldTextChanged", (value: boolean) => update({ increaseContrast: value }))
    ];

    return () => {
      mounted = false;
      subscriptions.forEach((subscription) => subscription?.remove?.());
    };
  }, []);

  return prefs;
}

function surfaceTone(styles: ReturnType<typeof createStyles>, tone: Tone) {
  if (tone === "hero") return styles.hero;
  if (tone === "accent") return styles.accent;
  if (tone === "success") return styles.successSurface;
  if (tone === "warning") return styles.warningSurface;
  if (tone === "danger") return styles.dangerSurface;
  return null;
}

function badgeTone(styles: ReturnType<typeof createStyles>, tone: Tone) {
  if (tone === "success") return styles.success;
  if (tone === "warning") return styles.warning;
  if (tone === "danger") return styles.danger;
  if (tone === "accent" || tone === "hero") return styles.accentBadge;
  return styles.defaultBadge;
}

function badgeTextTone(styles: ReturnType<typeof createStyles>, tone: Tone) {
  if (tone === "accent" || tone === "success" || tone === "warning") return styles.badgeTextOnAccent;
  if (tone === "danger" || tone === "hero") return styles.badgeTextOnDark;
  return styles.badgeTextDefault;
}

function railTone(styles: ReturnType<typeof createStyles>, tone: Tone) {
  if (tone === "success") return styles.success;
  if (tone === "warning") return styles.warning;
  if (tone === "danger") return styles.danger;
  return styles.accentFill;
}

function buttonTextColor(theme: AppTheme, tone: Tone) {
  if (tone === "warning" || tone === "success") return theme.colors.accentText;
  if (tone === "danger" || tone === "hero") return theme.colors.heroText;
  return theme.colors.ink;
}

function createStyles(theme: AppTheme, prefs: GlassPrefs) {
  const { colors, radii, spacing } = theme;
  const glass = theme.glass;
  const borderColor = prefs.increaseContrast
    ? theme.isDark ? "rgba(255,255,255,0.44)" : "rgba(15,23,42,0.22)"
    : theme.isDark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.86)";
  const baseSurface = prefs.reduceTransparency ? glass.tint.reducedTransparency : glass.tint.surface;

  return StyleSheet.create({
    surface: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor,
      backgroundColor: baseSurface,
      padding: spacing.md,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOpacity: glass.depth.surfaceShadowOpacity,
      shadowRadius: glass.depth.shadowRadius,
      shadowOffset: { width: 0, height: glass.depth.shadowY },
      elevation: 4
    },
    hero: {
      backgroundColor: prefs.reduceTransparency ? colors.heroSurface : glass.tint.hero,
      borderColor: prefs.increaseContrast ? "rgba(255,255,255,0.44)" : theme.isDark ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.92)",
      shadowOpacity: glass.depth.heroShadowOpacity
    },
    accent: {
      backgroundColor: colors.accent,
      borderColor: prefs.increaseContrast ? colors.ink : theme.isDark ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.76)"
    },
    successSurface: {
      backgroundColor: colors.green,
      borderColor: theme.isDark ? "rgba(255,255,255,0.26)" : "rgba(255,255,255,0.64)"
    },
    warningSurface: {
      backgroundColor: colors.gold,
      borderColor: theme.isDark ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.64)"
    },
    dangerSurface: {
      backgroundColor: colors.red,
      borderColor: theme.isDark ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.64)"
    },
    sidebar: {
      borderRadius: radii.lg,
      padding: spacing.sm
    },
    widgetPreviewStage: {
      padding: spacing.sm,
      minHeight: 164
    },
    previewAmbient: {
      position: "absolute",
      left: -12,
      right: -12,
      bottom: -20,
      height: 80,
      borderRadius: 34,
      backgroundColor: glass.ambientSpill,
      opacity: prefs.reduceMotion ? 0.4 : 0.72
    },
    topHighlight: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "46%",
      backgroundColor: glass.gradientStops.top
    },
    topHighlightCompact: {
      height: "38%"
    },
    innerLens: {
      position: "absolute",
      right: 12,
      top: 10,
      width: "58%",
      height: 28,
      borderRadius: radii.round,
      backgroundColor: glass.innerGlow,
      opacity: prefs.increaseContrast ? 0.44 : 0.72
    },
    ambientSpill: {
      position: "absolute",
      right: -28,
      bottom: -34,
      width: 118,
      height: 98,
      borderRadius: 44,
      backgroundColor: glass.ambientSpill,
      opacity: 0.42
    },
    bottomHairline: {
      position: "absolute",
      left: 14,
      right: 14,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: prefs.increaseContrast ? colors.lineStrong : glass.rimHighlight
    },
    reducedFallbackEdge: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.lineStrong
    },
    button: {
      minHeight: 44,
      borderRadius: radii.round,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOpacity: glass.depth.controlShadowOpacity,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 7 },
      elevation: 3
    },
    buttonPressed: {
      transform: [{ translateY: 1 }],
      opacity: 0.92
    },
    buttonText: {
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    disabled: {
      opacity: 0.52
    },
    tabBar: {
      minHeight: 54,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor,
      backgroundColor: prefs.reduceTransparency ? colors.surface : glass.tint.control,
      padding: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      overflow: "hidden"
    },
    pill: {
      minHeight: 36,
      borderRadius: radii.round,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor,
      backgroundColor: prefs.reduceTransparency ? colors.surface : glass.tint.control,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    },
    pillActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent
    },
    pillPressed: {
      transform: [{ translateY: 1 }]
    },
    pillText: {
      color: colors.ink,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    pillTextActive: {
      color: colors.accentText
    },
    badge: {
      alignSelf: "flex-start",
      borderRadius: radii.round,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6
    },
    badgeText: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    badgeTextDefault: {
      color: colors.ink
    },
    badgeTextOnAccent: {
      color: colors.accentText
    },
    badgeTextOnDark: {
      color: colors.heroText
    },
    defaultBadge: {
      backgroundColor: colors.surfaceAlt
    },
    accentBadge: {
      backgroundColor: colors.accent
    },
    success: {
      backgroundColor: colors.green
    },
    warning: {
      backgroundColor: colors.gold
    },
    danger: {
      backgroundColor: colors.red
    },
    rail: {
      height: 8,
      borderRadius: radii.round,
      backgroundColor: colors.surfaceAlt,
      overflow: "hidden"
    },
    railFill: {
      height: "100%",
      borderRadius: radii.round
    },
    accentFill: {
      backgroundColor: colors.accent
    }
  });
}
