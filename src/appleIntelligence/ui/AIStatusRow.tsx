import React from "react";
import { ActivityIndicator, Pressable, Switch, Text, View } from "react-native";
import { Cpu, Download, Globe2, Settings, Smartphone, Sparkles, Trash2 } from "lucide-react-native";
import type { AIAvailability } from "../types";
import { directionFor } from "./format";
import { AICard, IconTile } from "./primitives";
import type { AIBaseProps, AIText } from "./theme";
import { aiAccent, COLORS, semanticText, SPACE, TOUCH, TYPE } from "./tokens";

export type AIStatusRowProps = AIBaseProps & {
  availability: AIAvailability;
  /** The user's on-device AI preference (Profile switch). */
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  /** "Clear on-device AI data" (caches, study sets, practice history). The parent confirms. */
  onClear: () => void;
  clearing?: boolean;
};

export type AIStatusCopy = { tone: "on" | "off" | "pending" | "unavailable"; title: string; body: string; showSwitch: boolean };

/** Honest status copy for every availability state (also usable outside the row, e.g. paywall footnotes). */
export function aiStatusCopy(t: AIText, availability: AIAvailability, enabled: boolean): AIStatusCopy {
  const { state, reason } = availability;
  if (state === "available" && enabled) {
    return { tone: "on", title: t("ai.status.on", "On-device AI: On"), body: t("ai.status.on_body", "Smarter extraction, daily briefs and quizzes run privately on this iPhone."), showSwitch: true };
  }
  if (reason === "userDisabled" || (state === "available" && !enabled)) {
    return { tone: "off", title: t("ai.status.off", "On-device AI: Off"), body: t("ai.status.off_body", "The classic engine is on. Turn this back on anytime."), showSwitch: true };
  }
  if (reason === "modelNotReady") {
    return { tone: "pending", title: t("ai.status.downloading", "Downloading on-device model…"), body: t("ai.status.downloading_body", "The classic engine works until it's ready."), showSwitch: true };
  }
  if (reason === "appleIntelligenceNotEnabled") {
    return {
      tone: "unavailable",
      title: t("ai.status.not_enabled", "On-device AI is off in Settings"),
      body: t("ai.status.not_enabled_body", "Turn on Apple Intelligence in Settings for smarter extraction and quizzes."),
      showSwitch: false,
    };
  }
  if (reason === "localeUnsupported") {
    return { tone: "unavailable", title: t("ai.status.classic", "Classic engine"), body: t("ai.status.locale", "On-device AI isn't available in this language yet. The classic engine is on."), showSwitch: false };
  }
  // deviceNotEligible, unsupportedOS, missingModule.
  return { tone: "unavailable", title: t("ai.status.classic", "Classic engine"), body: t("ai.status.device", "Your iPhone uses the classic engine. Everything still works."), showSwitch: false };
}

/** Profile row: honest on-device AI state, the opt-out switch, and the clear-data action. */
export function AIStatusRow({ availability, enabled, onToggle, onClear, clearing = false, theme, t, locale }: AIStatusRowProps) {
  const copy = aiStatusCopy(t, availability, enabled);
  const icon =
    copy.tone === "on"
      ? Sparkles
      : copy.tone === "pending"
        ? Download
        : availability.reason === "localeUnsupported"
          ? Globe2
          : availability.reason === "appleIntelligenceNotEnabled"
            ? Settings
            : copy.tone === "off"
              ? Cpu
              : Smartphone;
  const color = copy.tone === "on" ? aiAccent(theme) : copy.tone === "pending" ? semanticText(COLORS.blue, theme) : theme.label2;
  return (
    <AICard theme={theme} style={{ padding: 0, overflow: "hidden", direction: directionFor(locale) }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.md, padding: SPACE.lg - 1 }}>
        <IconTile icon={icon} color={copy.tone === "on" ? COLORS.purple : copy.tone === "pending" ? COLORS.blue : theme.label3} />
        <View style={{ flex: 1 }}>
          <Text selectable accessibilityRole="header" style={{ color: copy.tone === "on" ? color : theme.label, fontSize: TYPE.callout, fontWeight: "900" }}>{copy.title}</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 19, marginTop: 3 }}>{copy.body}</Text>
        </View>
        {copy.showSwitch ? (
          <Switch
            accessibilityLabel={t("ai.status.switch", "Use on-device AI")}
            value={enabled}
            onValueChange={onToggle}
            trackColor={{ true: COLORS.green, false: theme.surface3 }}
          />
        ) : null}
      </View>
      <View style={{ paddingHorizontal: SPACE.lg - 1, paddingBottom: SPACE.md, marginTop: -SPACE.xs }}>
        <Text selectable style={{ color: theme.label3, fontSize: TYPE.caption, lineHeight: 16 }}>{t("ai.status.explainer", "Uses Apple Intelligence on supported iPhones")}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("ai.status.clear", "Clear on-device AI data")}
        accessibilityHint={t("ai.status.clear_hint", "Deletes cached study sets, briefs and practice history on this iPhone. Your planner is not affected.")}
        accessibilityState={{ disabled: clearing, busy: clearing }}
        disabled={clearing}
        onPress={onClear}
        style={({ pressed }) => ({ minHeight: TOUCH + 6, flexDirection: "row", alignItems: "center", gap: SPACE.md, paddingHorizontal: SPACE.lg - 1, borderTopWidth: 1, borderTopColor: theme.hairline, opacity: pressed ? 0.7 : 1 })}
      >
        {clearing ? <ActivityIndicator color={COLORS.red} /> : <Trash2 color={semanticText(COLORS.red, theme)} size={18} />}
        <Text style={{ color: semanticText(COLORS.red, theme), fontSize: TYPE.callout, fontWeight: "800" }}>{t("ai.status.clear", "Clear on-device AI data")}</Text>
      </Pressable>
    </AICard>
  );
}
