import React from "react";
import { Text, View } from "react-native";
import { CheckCircle2, Sparkles } from "lucide-react-native";
import type { ImportOrigin } from "../types";
import { directionFor } from "./format";
import type { AIBaseProps } from "./theme";
import { aiAccent, COLORS, HERO, RADII, semanticText, tint, TYPE } from "./tokens";

export type AIBadgeProps = AIBaseProps & {
  /** "onHero" for dark hero cards (lavender on translucent white). */
  tone?: "default" | "onHero";
  size?: "sm" | "md";
};

/**
 * Disclosure for anything generated on this iPhone. Generic sparkles symbol,
 * never Apple's logo, never the words "Apple Intelligence".
 */
export function AIBadge({ theme, t, locale, tone = "default", size = "sm" }: AIBadgeProps) {
  const onHero = tone === "onHero";
  const color = onHero ? HERO.lavenderSoft : aiAccent(theme);
  const label = t("ai.badge.label", "On-device");
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={t("ai.badge.a11y", "Generated on this iPhone")}
      style={{
        direction: directionFor(locale),
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 4,
        paddingHorizontal: size === "md" ? 10 : 8,
        paddingVertical: size === "md" ? 5 : 3,
        borderRadius: RADII.pill,
        backgroundColor: onHero ? HERO.chip : tint(COLORS.purple, theme.dark ? "2E" : "17"),
      }}
    >
      <Sparkles color={color} size={size === "md" ? 13 : 11} strokeWidth={2.4} />
      <Text style={{ color, fontSize: size === "md" ? TYPE.caption : TYPE.micro, fontWeight: "900" }}>{label}</Text>
    </View>
  );
}

export type OriginChipProps = AIBaseProps & {
  origin: ImportOrigin | undefined;
  /** Show a quiet "Classic reader" label for heuristic rows (default: render nothing). */
  showHeuristic?: boolean;
};

/** ReviewImport row provenance: reassurance when both readers agree, a nudge to verify on-device-only finds. */
export function OriginChip({ origin, theme, t, locale, showHeuristic = false }: OriginChipProps) {
  if (!origin || (origin === "heuristic" && !showHeuristic)) return null;
  const spec =
    origin === "both"
      ? {
          icon: CheckCircle2,
          color: semanticText(COLORS.green, theme),
          bg: tint(COLORS.green, theme.dark ? "26" : "1C"),
          label: t("ai.origin.both", "Found twice"),
          a11y: t("ai.origin.both_a11y", "Found by both readers. Higher confidence."),
        }
      : origin === "onDevice"
        ? {
            icon: Sparkles,
            color: aiAccent(theme),
            bg: tint(COLORS.purple, theme.dark ? "2E" : "17"),
            label: t("ai.origin.on_device", "Found on-device · verify"),
            a11y: t("ai.origin.on_device_a11y", "Found only by on-device AI. Check it against your syllabus before approving."),
          }
        : {
            icon: null,
            color: theme.label3,
            bg: theme.surface2,
            label: t("ai.origin.heuristic", "Classic reader"),
            a11y: t("ai.origin.heuristic_a11y", "Found by the classic reader."),
          };
  const Icon = spec.icon;
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={spec.a11y}
      style={{
        direction: directionFor(locale),
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADII.pill,
        backgroundColor: spec.bg,
      }}
    >
      {Icon ? <Icon color={spec.color} size={12} strokeWidth={2.6} /> : null}
      <Text style={{ color: spec.color, fontSize: TYPE.micro, fontWeight: "900" }}>{spec.label}</Text>
    </View>
  );
}
