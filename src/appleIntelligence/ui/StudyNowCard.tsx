import React from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Clock, Play, Timer } from "lucide-react-native";
import type { DailyBrief, StudyNowCandidate } from "../types";
import { AIBadge } from "./AIBadge";
import { directionFor, formatNumber, isRTLLocale } from "./format";
import { useEntrance } from "./motion";
import { AIButton, ForwardChevron, HeroCard, Kicker } from "./primitives";
import type { AIBaseProps, AIText } from "./theme";
import { HERO, RADII, SPACE, TOUCH, TYPE } from "./tokens";

export type StudyNowCardProps = AIBaseProps & {
  brief: DailyBrief;
  /** "compact" mirrors the Lock Screen/widget line (no buttons; whole card taps to start). */
  variant?: "full" | "compact";
  onStart: () => void;
  /** Skip / Later. Omit to hide the secondary button. */
  onReschedule?: () => void;
};

/** "exam in 12 days" / "due tomorrow" from deterministic candidate facts. */
export function studyNowCountdown(t: AIText, locale: string, candidate: StudyNowCandidate): string {
  const days = candidate.daysUntil;
  if (typeof days !== "number" || days < 0) return "";
  const exam = candidate.kind === "exam_prep";
  if (days === 0) return exam ? t("ai.brief.exam_today", "exam today") : t("ai.brief.due_today", "due today");
  if (days === 1) return exam ? t("ai.brief.exam_tomorrow", "exam tomorrow") : t("ai.brief.due_tomorrow", "due tomorrow");
  const count = formatNumber(locale, days);
  return exam ? t("ai.brief.exam_in", "exam in {count} days", { count }) : t("ai.brief.due_in", "due in {count} days", { count });
}

/** Today's one clear move. The line and reason come from DailyBrief (template or fidelity-checked on-device copy). */
export function StudyNowCard({ brief, variant = "full", onStart, onReschedule, theme, t, locale }: StudyNowCardProps) {
  const entrance = useEntrance();
  const rtl = isRTLLocale(locale);
  const candidate = brief.candidate;
  const countdown = studyNowCountdown(t, locale, candidate);
  const onDevice = brief.origin === "onDevice";
  const urgent = typeof candidate.daysUntil === "number" && candidate.daysUntil <= 2;
  // brief.line already carries the minutes; meta adds class + countdown only.
  const meta = [candidate.classCode, countdown].filter(Boolean).join(" · ");

  if (variant === "compact") {
    return (
      <Animated.View style={[{ direction: directionFor(locale) }, entrance]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t("ai.brief.kicker", "STUDY NOW")}. ${brief.line}. ${countdown}`}
          accessibilityHint={t("ai.brief.start_hint", "Starts a focus session for this")}
          onPress={onStart}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <HeroCard theme={theme} tone="ink" style={{ padding: SPACE.lg, borderRadius: RADII.panel, flexDirection: "row", alignItems: "center", gap: SPACE.md }}>
            <View style={{ width: TOUCH, height: TOUCH, borderRadius: 14, backgroundColor: HERO.chip, alignItems: "center", justifyContent: "center" }}>
              <Timer color={HERO.lavenderSoft} size={21} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.sm }}>
                <Text style={{ color: HERO.lavender, fontSize: TYPE.micro, fontWeight: "900", letterSpacing: 0.7 }}>{t("ai.brief.kicker", "STUDY NOW")}</Text>
                {onDevice ? <AIBadge theme={theme} t={t} locale={locale} tone="onHero" /> : null}
              </View>
              <Text selectable numberOfLines={2} style={{ color: HERO.onHero, fontSize: TYPE.callout, fontWeight: "900" }}>{brief.line}</Text>
              {countdown ? <Text selectable style={{ color: HERO.onHero2, fontSize: TYPE.footnote, fontWeight: "800" }}>{countdown}</Text> : null}
            </View>
            <ForwardChevron rtl={rtl} color={HERO.onHero3} />
          </HeroCard>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ direction: directionFor(locale) }, entrance]}>
      <HeroCard theme={theme} tone="ink" style={{ gap: SPACE.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm }}>
          <Kicker text={t("ai.brief.kicker", "STUDY NOW")} theme={theme} onHero capsule />
          {onDevice ? <AIBadge theme={theme} t={t} locale={locale} tone="onHero" size="md" /> : null}
        </View>
        <Text selectable accessibilityRole="header" style={{ color: HERO.onHero, fontSize: TYPE.title2 + 2, lineHeight: 32, fontWeight: "900" }}>{brief.line}</Text>
        {meta ? <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.sm, flexWrap: "wrap" }}>
          <Clock color={urgent ? HERO.lavenderSoft : HERO.onHero3} size={15} strokeWidth={2.4} />
          <Text selectable style={{ color: urgent ? HERO.lavenderSoft : HERO.onHero2, fontSize: TYPE.body, fontWeight: "900" }}>{meta}</Text>
        </View> : null}
        {brief.reason ? <Text selectable style={{ color: HERO.onHero2, fontSize: TYPE.body, lineHeight: 21 }}>{brief.reason}</Text> : null}
        <View style={{ flexDirection: "row", gap: SPACE.sm, marginTop: SPACE.xs }}>
          <View style={{ flex: 1.4 }}>
            <AIButton label={t("ai.brief.start", "Start")} icon={Play} variant="onHero" theme={theme} onPress={onStart} accessibilityHint={t("ai.brief.start_hint", "Starts a focus session for this")} />
          </View>
          {onReschedule ? (
            <View style={{ flex: 1 }}>
              <AIButton label={t("ai.brief.later", "Later")} variant="onHeroSecondary" theme={theme} onPress={onReschedule} accessibilityHint={t("ai.brief.later_hint", "Moves this to a later block. Your plan adjusts.")} />
            </View>
          ) : null}
        </View>
      </HeroCard>
    </Animated.View>
  );
}
