import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Brain, CalendarPlus, Layers, NotebookPen, ShieldCheck, Swords } from "lucide-react-native";
import type { StudySetOrigin, WeakTopic } from "../types";
import { AIBadge } from "./AIBadge";
import { directionFor, formatDuration, formatLongDate, formatMonthDay, formatNumber, isRTLLocale } from "./format";
import { useEntrance, useReduceMotion } from "./motion";
import { ActionRow, AIButton, AICard, ClassChip, HeroCard, IconTile, Kicker, ProgressBar } from "./primitives";
import type { AIBaseProps, AITheme, AIText } from "./theme";
import { COLORS, HERO, MOTION, RADII, semanticText, SPACE, tint, TYPE, WEAK_TOPICS_MIN_ANSWERS } from "./tokens";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const DEFAULT_WINDOW_DAYS = 21;
const RING_STROKE = 12;

export type ExamModeSummary = {
  examTitle: string;
  /** Already-localized kind ("Midterm"). */
  examKindLabel?: string;
  classCode?: string;
  className?: string;
  classColor?: string;
  /** ISO date of the exam. */
  examDate: string;
  /** Display time, as stored on the exam ("9:00 AM"). */
  examTime?: string;
  daysUntil: number;
  /** Days the countdown ring spans (default 21). */
  windowDays?: number;
  notesLinked: number;
  cardsMastered: number;
  cardsTotal: number;
  /** Practice answers recorded for this exam; weak topics unlock at 20. */
  answersRecorded: number;
  weakTopics: WeakTopic[];
  /** Extra exam_prep blocks proposed from weak topics. Applied only after the confirm sheet. */
  reviewProposal?: { blocks: number; minutesEach: number } | null;
  /** Origin of the study set behind practice; shows the on-device badge when generated. */
  studySetOrigin?: StudySetOrigin | null;
};

export type ExamModeScreenProps = AIBaseProps & {
  summary: ExamModeSummary;
  onPracticeCards: () => void;
  onPracticeQuiz: () => void;
  /** Quiz Duel. Omit to hide. */
  onDuel?: () => void;
  /** Opens the proposal confirm sheet for extra review blocks. */
  onProposeBlocks?: () => void;
  /** Empty state CTA: add or scan notes for this class. */
  onAddNotes: () => void;
  onTopic?: (topic: WeakTopic) => void;
  /** Wrap content in a ScrollView (default true). The gallery passes false. */
  scrollable?: boolean;
};

export function ExamModeScreen({ summary, onPracticeCards, onPracticeQuiz, onDuel, onProposeBlocks, onAddNotes, onTopic, scrollable = true, theme, t, locale }: ExamModeScreenProps) {
  const entrance = useEntrance();
  const rtl = isRTLLocale(locale);
  const hasNotes = summary.notesLinked > 0;
  const ringColor = summary.daysUntil <= 3 ? COLORS.red : summary.daysUntil <= 7 ? COLORS.orange : HERO.onHero;
  const whenLine = [formatLongDate(locale, summary.examDate), summary.examTime].filter(Boolean).join(" · ");
  const titleLine = [summary.examKindLabel, summary.examTitle].filter(Boolean).join(" · ");

  const content = (
    <Animated.View style={[{ direction: directionFor(locale), gap: SPACE.lg }, entrance]}>
      <HeroCard theme={theme} style={{ gap: SPACE.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm }}>
          <Kicker text={t("ai.exam.kicker", "EXAM MODE")} theme={theme} onHero capsule />
          {summary.studySetOrigin === "onDevice" ? <AIBadge theme={theme} t={t} locale={locale} tone="onHero" size="md" /> : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.lg + 2 }}>
          <CountdownRing days={summary.daysUntil} windowDays={summary.windowDays || DEFAULT_WINDOW_DAYS} color={ringColor} t={t} locale={locale} />
          <View style={{ flex: 1, gap: SPACE.sm }}>
            {summary.classCode ? <ClassChip label={summary.classCode} color={summary.classColor || HERO.lavender} theme={theme} onHero /> : null}
            <Text selectable accessibilityRole="header" style={{ color: HERO.onHero, fontSize: TYPE.title3 + 2, lineHeight: 28, fontWeight: "900" }}>{titleLine}</Text>
            <Text selectable style={{ color: HERO.lavenderSoft, fontWeight: "900", lineHeight: 19 }}>{whenLine}</Text>
          </View>
        </View>
      </HeroCard>

      {!hasNotes ? (
        <AICard theme={theme} style={{ gap: SPACE.md }}>
          <IconTile icon={NotebookPen} color={COLORS.purple} />
          <Text selectable style={{ color: theme.label, fontSize: TYPE.headline + 1, lineHeight: 24, fontWeight: "900" }}>
            {t("ai.exam.no_notes_title", "Add or scan notes for this class to unlock practice")}
          </Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 20 }}>{t("ai.exam.no_notes_body", "Flashcards and quizzes are built only from your own notes, each one citing the line it came from.")}</Text>
          <AIButton label={t("ai.exam.add_notes", "Add notes")} icon={NotebookPen} theme={theme} onPress={onAddNotes} />
        </AICard>
      ) : (
        <>
          <CoverageCard summary={summary} theme={theme} t={t} locale={locale} />
          <View style={{ gap: SPACE.sm + 2 }}>
            <ActionRow
              featured
              icon={Layers}
              color={theme.accent}
              label={t("ai.exam.practice_cards", "Practice flashcards")}
              detail={t("ai.exam.practice_cards_detail", "{count} cards from your notes", { count: formatNumber(locale, summary.cardsTotal) })}
              onPress={onPracticeCards}
              theme={theme}
              rtl={rtl}
            />
            <ActionRow
              icon={Brain}
              color={COLORS.purple}
              label={t("ai.exam.practice_quiz", "Practice quiz")}
              detail={t("ai.exam.practice_quiz_detail", "Multiple choice, with the source line for every answer")}
              onPress={onPracticeQuiz}
              theme={theme}
              rtl={rtl}
            />
            {onDuel ? (
              <ActionRow
                icon={Swords}
                color={COLORS.ink}
                label={t("ai.exam.duel", "Challenge a friend")}
                detail={t("ai.exam.duel_detail", "Send a Quiz Duel. Playing it is free.")}
                onPress={onDuel}
                theme={theme}
                rtl={rtl}
              />
            ) : null}
          </View>
          <WeakTopicsCard summary={summary} onTopic={onTopic} theme={theme} t={t} locale={locale} />
          {summary.reviewProposal && onProposeBlocks ? (
            <AICard theme={theme} style={{ gap: SPACE.sm }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.md }}>
                <IconTile icon={CalendarPlus} color={COLORS.ink} />
                <View style={{ flex: 1 }}>
                  <Text selectable style={{ color: theme.label, fontSize: TYPE.callout, fontWeight: "900" }}>{t("ai.exam.blocks_title", "Add extra review blocks")}</Text>
                  <Text selectable style={{ color: theme.label2, lineHeight: 19, marginTop: 2 }}>
                    {t("ai.exam.blocks_detail", "{count} × {duration} before {date}. You confirm first.", {
                      count: formatNumber(locale, summary.reviewProposal.blocks),
                      duration: formatDuration(t, locale, summary.reviewProposal.minutesEach),
                      date: formatMonthDay(locale, summary.examDate),
                    })}
                  </Text>
                </View>
              </View>
              <AIButton label={t("ai.exam.blocks_cta", "Review proposal")} variant="secondary" theme={theme} onPress={onProposeBlocks} />
            </AICard>
          ) : null}
        </>
      )}

      <View style={{ flexDirection: "row", gap: SPACE.sm, alignItems: "flex-start", paddingHorizontal: SPACE.xs }}>
        <ShieldCheck color={theme.label3} size={16} style={{ marginTop: 1 }} />
        <Text selectable style={{ flex: 1, color: theme.label2, fontSize: TYPE.footnote, lineHeight: 18 }}>{t("ai.exam.integrity", "Practice from your own notes. Not for graded work.")}</Text>
      </View>
    </Animated.View>
  );

  if (!scrollable) return content;
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ padding: SPACE.lg, paddingBottom: 48 }}>
      {content}
    </ScrollView>
  );
}

function CountdownRing({ days, windowDays, color, t, locale, size = 112 }: { days: number; windowDays: number; color: string; t: AIText; locale: string; size?: number }) {
  const reduce = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const radius = (size - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const fill = days < 0 ? 1 : Math.max(0.04, Math.min(1, 1 - days / windowDays));
  useEffect(() => {
    if (reduce) {
      progress.setValue(fill);
      return;
    }
    const animation = Animated.timing(progress, { toValue: fill, duration: MOTION.ring, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [fill, progress, reduce]);
  const dashOffset = progress.interpolate({ inputRange: [0, 1], outputRange: [circumference, 0] });
  const label =
    days < 0
      ? t("ai.exam.ring_past", "done")
      : days === 0
        ? t("ai.exam.ring_today", "today")
        : days === 1
          ? t("ai.exam.ring_day_one", "day left")
          : t("ai.exam.ring_days_other", "days left");
  const a11y =
    days < 0
      ? t("ai.exam.countdown_past", "This exam has passed")
      : days === 0
        ? t("ai.exam.countdown_today", "Exam is today")
        : days === 1
          ? t("ai.exam.countdown_one", "1 day until the exam")
          : t("ai.exam.countdown_other", "{count} days until the exam", { count: formatNumber(locale, days) });
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={a11y} style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={HERO.track} strokeWidth={RING_STROKE} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>
      {days > 0 ? <Text style={{ color: HERO.onHero, fontSize: 31, lineHeight: 35, fontWeight: "900" }}>{formatNumber(locale, days)}</Text> : null}
      <Text style={{ color: days > 0 ? HERO.onHero2 : HERO.onHero, fontSize: days > 0 ? TYPE.caption : TYPE.callout, fontWeight: "900" }}>{label}</Text>
    </View>
  );
}

function CoverageCard({ summary, theme, t, locale }: { summary: ExamModeSummary; theme: AITheme; t: AIText; locale: string }) {
  const mastery = summary.cardsTotal > 0 ? summary.cardsMastered / summary.cardsTotal : 0;
  return (
    <AICard theme={theme} style={{ gap: SPACE.md }}>
      <Text selectable accessibilityRole="header" style={{ color: theme.label, fontSize: TYPE.headline, fontWeight: "900" }}>{t("ai.exam.coverage", "Coverage")}</Text>
      <View style={{ flexDirection: "row", gap: SPACE.sm + 1 }}>
        <View style={{ flex: 1, borderRadius: RADII.tile, backgroundColor: theme.surface2, padding: SPACE.md }}>
          <Text selectable style={{ color: semanticText(COLORS.purple, theme), fontSize: 23, fontWeight: "900" }}>{formatNumber(locale, summary.notesLinked)}</Text>
          <Text selectable style={{ color: theme.label2, fontSize: TYPE.caption, fontWeight: "800", marginTop: 2 }}>
            {summary.notesLinked === 1 ? t("ai.exam.notes_linked_one", "note linked") : t("ai.exam.notes_linked_other", "notes linked")}
          </Text>
        </View>
        <View style={{ flex: 1.4, borderRadius: RADII.tile, backgroundColor: theme.surface2, padding: SPACE.md, gap: 6 }}>
          <Text selectable style={{ color: semanticText(COLORS.green, theme), fontSize: 23, fontWeight: "900" }}>
            {t("ai.exam.mastered_value", "{done}/{total}", { done: formatNumber(locale, summary.cardsMastered), total: formatNumber(locale, summary.cardsTotal) })}
          </Text>
          <Text selectable style={{ color: theme.label2, fontSize: TYPE.caption, fontWeight: "800" }}>{t("ai.exam.cards_mastered", "cards mastered")}</Text>
          <ProgressBar value={mastery} color={COLORS.green} track={theme.surface3} height={6} />
        </View>
      </View>
    </AICard>
  );
}

function WeakTopicsCard({ summary, onTopic, theme, t, locale }: { summary: ExamModeSummary; onTopic?: (topic: WeakTopic) => void; theme: AITheme; t: AIText; locale: string }) {
  const locked = summary.answersRecorded < WEAK_TOPICS_MIN_ANSWERS;
  return (
    <AICard theme={theme} style={{ gap: SPACE.md }}>
      <Text selectable accessibilityRole="header" style={{ color: theme.label, fontSize: TYPE.headline, fontWeight: "900" }}>{t("ai.exam.weak_title", "Weak topics")}</Text>
      {locked ? (
        <View style={{ gap: SPACE.sm }}>
          <Text selectable style={{ color: theme.label2, lineHeight: 20 }}>
            {t("ai.exam.weak_locked", "Weak topics appear after {count} answers", { count: formatNumber(locale, WEAK_TOPICS_MIN_ANSWERS) })}
          </Text>
          <ProgressBar value={summary.answersRecorded / WEAK_TOPICS_MIN_ANSWERS} color={theme.accent} track={theme.surface3} height={6} />
          <Text selectable style={{ color: theme.label3, fontSize: TYPE.caption, fontWeight: "800" }}>
            {t("ai.exam.weak_progress", "{done} of {total}", { done: formatNumber(locale, summary.answersRecorded), total: formatNumber(locale, WEAK_TOPICS_MIN_ANSWERS) })}
          </Text>
        </View>
      ) : summary.weakTopics.length === 0 ? (
        <Text selectable style={{ color: theme.label2, lineHeight: 20 }}>{t("ai.exam.weak_none", "No weak spots right now. Keep practicing to stay sharp.")}</Text>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm }}>
          {summary.weakTopics.map((topic) => {
            const color = topic.weakness >= 0.6 ? COLORS.red : topic.weakness >= 0.3 ? COLORS.orange : COLORS.blue;
            const fg = semanticText(color, theme);
            const ratio = t("ai.exam.weak_ratio", "{misses}/{attempts} missed", { misses: formatNumber(locale, topic.misses), attempts: formatNumber(locale, topic.attempts) });
            const chip = (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADII.pill, backgroundColor: tint(color, theme.dark ? "26" : "18") }}>
                <View style={{ width: 7, height: 7, borderRadius: RADII.pill, backgroundColor: color }} />
                <Text style={{ color: theme.label, fontWeight: "900" }}>{topic.concept}</Text>
                <Text style={{ color: fg, fontSize: TYPE.caption, fontWeight: "900" }}>{ratio}</Text>
              </View>
            );
            const label = `${topic.concept}, ${ratio}`;
            return onTopic ? (
              <Pressable key={topic.concept} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={t("ai.exam.weak_hint", "Practice this topic")} hitSlop={4} onPress={() => onTopic(topic)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, minHeight: 44, justifyContent: "center" })}>
                {chip}
              </Pressable>
            ) : (
              <View key={topic.concept} accessible accessibilityLabel={label}>
                {chip}
              </View>
            );
          })}
        </View>
      )}
    </AICard>
  );
}
