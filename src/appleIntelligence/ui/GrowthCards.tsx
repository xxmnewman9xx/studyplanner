// Small growth-loop surfaces: Class Pack paste, Quiz Duel intro, and the
// forecast summary that sits atop the Paywall.
import React, { useMemo } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { ClipboardPaste, Crown, Play, Swords, X } from "lucide-react-native";
import type { CrunchForecast } from "../types";
import { classesPhrase, deadlinesPhrase } from "./ForecastSection";
import { firstStartDate } from "./forecastModel";
import { directionFor, formatMonthDay, formatNumber, isRTLLocale } from "./format";
import { useEntrance } from "./motion";
import { AIButton, AICard, ForwardChevron, HeroCard, IconTile, Kicker } from "./primitives";
import type { AIBaseProps } from "./theme";
import { COLORS, forecastCellStyle, HERO, RADII, SPACE, TOUCH, TYPE } from "./tokens";

// ---------------------------------------------------------------------------
// PastePackBanner
// ---------------------------------------------------------------------------

export type PastePackBannerProps = AIBaseProps & {
  onPaste: () => void;
  onDismiss?: () => void;
};

/** First-launch / onboarding: restore a Class Pack a classmate sent. */
export function PastePackBanner({ onPaste, onDismiss, theme, t, locale }: PastePackBannerProps) {
  const entrance = useEntrance();
  return (
    <Animated.View style={[{ direction: directionFor(locale) }, entrance]}>
      <AICard theme={theme} style={{ gap: SPACE.md }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: SPACE.md }}>
          <IconTile icon={ClipboardPaste} color={COLORS.blue} />
          <View style={{ flex: 1 }}>
            <Text selectable style={{ color: theme.label, fontSize: TYPE.callout + 1, lineHeight: 22, fontWeight: "900" }}>{t("ai.paste.title", "Got a Class Pack from a classmate?")}</Text>
            <Text selectable style={{ color: theme.label2, lineHeight: 19, marginTop: 3 }}>{t("ai.paste.body", "Paste it to get their dates in seconds. You review everything before it saves.")}</Text>
          </View>
          {onDismiss ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t("ai.common.dismiss", "Dismiss")} hitSlop={8} onPress={onDismiss} style={{ width: TOUCH, height: TOUCH, marginTop: -SPACE.sm, marginEnd: -SPACE.sm, alignItems: "center", justifyContent: "center" }}>
              <X color={theme.label3} size={18} />
            </Pressable>
          ) : null}
        </View>
        <AIButton label={t("ai.paste.cta", "Paste Class Pack")} icon={ClipboardPaste} theme={theme} onPress={onPaste} accessibilityHint={t("ai.paste.hint", "Reads a Class Pack link from the clipboard")} />
      </AICard>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// DuelIntroCard
// ---------------------------------------------------------------------------

export type DuelIntroCardProps = AIBaseProps & {
  /** Sender's display name, when the payload carries one. */
  senderName?: string;
  /** QuizDuel.title */
  title: string;
  questionCount: number;
  /** QuizDuel.score, the target to beat. */
  targetScore?: number;
  onStart: () => void;
};

/** Header for a received Quiz Duel. Playing is always free. */
export function DuelIntroCard({ senderName, title, questionCount, targetScore, onStart, theme, t, locale }: DuelIntroCardProps) {
  const entrance = useEntrance();
  const heading = senderName ? t("ai.duel.heading", "{name}'s challenge", { name: senderName }) : t("ai.duel.heading_anon", "A classmate's challenge");
  const count = questionCount === 1 ? t("ai.duel.questions_one", "1 question") : t("ai.duel.questions_other", "{count} questions", { count: formatNumber(locale, questionCount) });
  const beat =
    typeof targetScore === "number"
      ? t("ai.duel.beat", "Beat {score}/{total}", { score: formatNumber(locale, targetScore), total: formatNumber(locale, questionCount) })
      : "";
  return (
    <Animated.View style={[{ direction: directionFor(locale) }, entrance]}>
      <HeroCard theme={theme} style={{ gap: SPACE.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.sm }}>
          <Swords color={HERO.lavenderSoft} size={16} strokeWidth={2.4} />
          <Kicker text={t("ai.duel.kicker", "QUIZ DUEL")} theme={theme} onHero color={HERO.lavenderSoft} />
        </View>
        <Text selectable accessibilityRole="header" style={{ color: HERO.onHero, fontSize: TYPE.title2 + 2, lineHeight: 32, fontWeight: "900" }}>{heading}</Text>
        <Text selectable style={{ color: HERO.onHero2, fontSize: TYPE.callout, fontWeight: "800" }}>{title}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm }}>
          <HeroStat text={count} />
          {beat ? <HeroStat text={beat} strong /> : null}
        </View>
        <AIButton label={t("ai.duel.start", "Start the duel")} icon={Play} variant="onHero" theme={theme} onPress={onStart} />
        <Text selectable style={{ color: HERO.onHero3, fontSize: TYPE.footnote, lineHeight: 18 }}>{t("ai.duel.free", "Free to play. No account needed.")}</Text>
      </HeroCard>
    </Animated.View>
  );
}

function HeroStat({ text, strong = false }: { text: string; strong?: boolean }) {
  return (
    <View style={{ borderRadius: RADII.pill, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: strong ? HERO.lavender : HERO.chip }}>
      <Text selectable style={{ color: strong ? HERO.ink : HERO.onHero, fontSize: TYPE.footnote, fontWeight: "900" }}>{text}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// UnlockForecastCTA
// ---------------------------------------------------------------------------

export type UnlockForecastCTAProps = AIBaseProps & {
  forecast: CrunchForecast;
  /** Optional; the Paywall usually embeds this as a summary without its own action. */
  onPress?: () => void;
};

/** "43 deadlines · 3 red weeks · starts Oct 12" summary for the Paywall / LockedDashboard. */
export function UnlockForecastCTA({ forecast, onPress, theme, t, locale }: UnlockForecastCTAProps) {
  const entrance = useEntrance();
  const rtl = isRTLLocale(locale);
  const redWeeks = forecast.weeks.filter((week) => week.color === "crunch").length;
  const redLabel = redWeeks === 1 ? t("ai.unlock.red_one", "1 red week") : t("ai.unlock.red_other", "{count} red weeks", { count: formatNumber(locale, redWeeks) });
  const startsLabel = t("ai.unlock.starts", "starts {date}", { date: formatMonthDay(locale, firstStartDate(forecast)) });
  const line = [deadlinesPhrase(t, locale, forecast.totals.items), redLabel, startsLabel].join(" · ");
  const strip = useMemo(() => forecast.weeks.map((week) => ({ key: week.weekStart, color: forecastCellStyle(week.color, theme, "hero").background, crunch: week.color === "crunch" })), [forecast.weeks, theme]);

  const body = (
    <HeroCard theme={theme} tone="ink" style={{ padding: SPACE.lg + 2, gap: SPACE.md, borderRadius: RADII.card }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm }}>
        <Kicker text={t("ai.unlock.kicker", "YOUR CRUNCH FORECAST")} theme={theme} onHero />
        <Text style={{ color: HERO.onHero3, fontSize: TYPE.caption, fontWeight: "800" }}>{classesPhrase(t, locale, forecast.totals.classes)}</Text>
      </View>
      <Text selectable style={{ color: HERO.onHero, fontSize: TYPE.headline, lineHeight: 23, fontWeight: "900" }}>{line}</Text>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ flexDirection: "row", gap: 3, alignItems: "flex-end", height: 26 }}>
        {strip.map((cell) => (
          <View key={cell.key} style={{ flex: 1, height: cell.crunch ? 26 : 16, borderRadius: 4, backgroundColor: cell.color, boxShadow: cell.crunch ? "0 0 8px rgba(255,69,58,0.6)" : undefined }} />
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.sm }}>
        <Crown color={HERO.lavenderSoft} size={15} />
        <Text selectable style={{ flex: 1, color: HERO.lavenderSoft, fontWeight: "900" }}>{t("ai.unlock.body", "Unlock to turn it into a daily plan")}</Text>
        {onPress ? <ForwardChevron rtl={rtl} color={HERO.onHero3} /> : null}
      </View>
    </HeroCard>
  );

  return (
    <Animated.View style={[{ direction: directionFor(locale) }, entrance]}>
      {onPress ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`${line}. ${t("ai.unlock.body", "Unlock to turn it into a daily plan")}`} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          {body}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={`${line}. ${t("ai.unlock.body", "Unlock to turn it into a daily plan")}`}>
          {body}
        </View>
      )}
    </Animated.View>
  );
}
