import React, { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Pressable, Text, View } from "react-native";
import { Check, CheckCircle2, Flag, Quote, RotateCcw, Swords, Trophy, Users, XCircle } from "lucide-react-native";
import type { SourceCitation, StudyCard, StudyQuestion, StudySetOrigin } from "../types";
import { AIBadge } from "./AIBadge";
import { directionFor, formatNumber } from "./format";
import { NATIVE_DRIVER, useEntrance, useReduceMotion } from "./motion";
import { AIButton, AICard, HeroCard, Kicker, LinkButton, Pill, ProgressBar } from "./primitives";
import type { AIBaseProps, AITheme, AIText } from "./theme";
import { COLORS, HERO, MOTION, RADII, semanticText, SPACE, tint, TOUCH, TYPE } from "./tokens";

export type PracticeMode = "cards" | "quiz";

export type PracticeAnswer = {
  itemId: string;
  kind: "card" | "question";
  correct: boolean;
};

export type PracticeScore = { correct: number; total: number };

/** Starting state, for resuming a session and for gallery/screenshot QA. */
export type PracticeInitialState = {
  index?: number;
  flipped?: boolean;
  selected?: 0 | 1 | 2 | 3;
  finished?: boolean;
  correct?: number;
};

export type PracticeSessionProps = AIBaseProps & {
  mode: PracticeMode;
  cards?: StudyCard[];
  questions?: StudyQuestion[];
  /** Note or exam title shown above the progress bar. */
  title?: string;
  origin?: StudySetOrigin;
  /** Every answer; the parent records a PracticeResult. */
  onAnswer: (answer: PracticeAnswer) => void;
  onFinish?: (score: PracticeScore) => void;
  /** Quiz mode summary: "Share score" -> Quiz Duel. */
  onShareScore?: (score: PracticeScore) => void;
  onReportWrong?: (itemId: string) => void;
  onClose?: () => void;
  initialState?: PracticeInitialState;
};

export function PracticeSession({
  mode,
  cards = [],
  questions = [],
  title,
  origin,
  onAnswer,
  onFinish,
  onShareScore,
  onReportWrong,
  onClose,
  initialState,
  theme,
  t,
  locale,
}: PracticeSessionProps) {
  const entrance = useEntrance();
  const total = mode === "cards" ? cards.length : questions.length;
  const [index, setIndex] = useState(Math.min(initialState?.index ?? 0, Math.max(0, total - 1)));
  const [flipped, setFlipped] = useState(Boolean(initialState?.flipped));
  const [selected, setSelected] = useState<number | null>(initialState?.selected ?? null);
  const [correct, setCorrect] = useState(initialState?.correct ?? 0);
  const [finished, setFinished] = useState(Boolean(initialState?.finished));
  const [reported, setReported] = useState<Record<string, boolean>>({});
  const finishReported = useRef(Boolean(initialState?.finished));

  useEffect(() => {
    if (finished && !finishReported.current) {
      finishReported.current = true;
      onFinish?.({ correct, total });
    }
  }, [correct, finished, onFinish, total]);

  const advance = useCallback(() => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setFlipped(false);
    setSelected(null);
  }, [index, total]);

  const restart = useCallback(() => {
    finishReported.current = false;
    setIndex(0);
    setFlipped(false);
    setSelected(null);
    setCorrect(0);
    setFinished(false);
  }, []);

  const report = (itemId: string) => {
    setReported((current) => ({ ...current, [itemId]: true }));
    onReportWrong?.(itemId);
  };

  const root = { direction: directionFor(locale), gap: SPACE.lg };

  if (total === 0) {
    return (
      <Animated.View style={[root, entrance]}>
        <AICard theme={theme} style={{ gap: SPACE.sm }}>
          <Text selectable style={{ color: theme.label, fontSize: TYPE.headline, fontWeight: "900" }}>{t("ai.practice.empty_title", "Nothing to practice yet")}</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 20 }}>{t("ai.practice.empty_body", "Longer notes give StudyPlanner enough to build cards and questions.")}</Text>
          {onClose ? <AIButton label={t("ai.common.done", "Done")} variant="secondary" theme={theme} onPress={onClose} /> : null}
        </AICard>
      </Animated.View>
    );
  }

  if (finished) {
    return (
      <Animated.View style={[root, entrance]}>
        <FinishSummary mode={mode} score={{ correct, total }} theme={theme} t={t} locale={locale} onShareScore={onShareScore} onRestart={restart} onClose={onClose} />
      </Animated.View>
    );
  }

  const answered = mode === "cards" ? flipped : selected !== null;
  const progress = (index + (answered ? 1 : 0)) / total;
  const counter = t("ai.practice.counter", "{index} of {total}", { index: formatNumber(locale, index + 1), total: formatNumber(locale, total) });

  return (
    <Animated.View style={[root, entrance]}>
      <View style={{ gap: SPACE.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE.sm }}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.sm, flexWrap: "wrap" }}>
            <Kicker text={mode === "cards" ? t("ai.practice.kicker_cards", "FLASHCARDS") : t("ai.practice.kicker_quiz", "PRACTICE QUIZ")} theme={theme} />
            {origin === "onDevice" ? <AIBadge theme={theme} t={t} locale={locale} /> : null}
          </View>
          <Text selectable accessibilityLabel={counter} style={{ color: theme.label2, fontSize: TYPE.footnote, fontWeight: "900" }}>{counter}</Text>
        </View>
        {title ? <Text selectable numberOfLines={2} style={{ color: theme.label, fontSize: TYPE.headline, fontWeight: "900" }}>{title}</Text> : null}
        <View accessible accessibilityRole="progressbar" accessibilityLabel={counter} accessibilityValue={{ min: 0, max: total, now: index + (answered ? 1 : 0) }}>
          <ProgressBar value={progress} color={theme.accent} track={theme.surface3} height={6} />
        </View>
      </View>

      {mode === "cards" ? (
        <CardStep
          key={cards[index].id}
          card={cards[index]}
          flipped={flipped}
          onFlip={() => setFlipped((value) => !value)}
          onGrade={(gotIt) => {
            onAnswer({ itemId: cards[index].id, kind: "card", correct: gotIt });
            if (gotIt) setCorrect((value) => value + 1);
            advance();
          }}
          theme={theme}
          t={t}
          locale={locale}
          reported={Boolean(reported[cards[index].id])}
          onReportWrong={onReportWrong ? () => report(cards[index].id) : undefined}
        />
      ) : (
        <QuestionStep
          key={questions[index].id}
          question={questions[index]}
          selected={selected}
          onSelect={(option) => {
            if (selected !== null) return;
            const question = questions[index];
            const isCorrect = option === question.answerIndex;
            setSelected(option);
            if (isCorrect) setCorrect((value) => value + 1);
            onAnswer({ itemId: question.id, kind: "question", correct: isCorrect });
            AccessibilityInfo.announceForAccessibility(isCorrect ? t("ai.practice.correct", "Correct") : t("ai.practice.incorrect", "Not quite"));
          }}
          onNext={advance}
          last={index + 1 >= total}
          theme={theme}
          t={t}
          locale={locale}
          reported={Boolean(reported[questions[index].id])}
          onReportWrong={onReportWrong ? () => report(questions[index].id) : undefined}
        />
      )}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Flashcards
// ---------------------------------------------------------------------------

function CardStep({
  card,
  flipped,
  onFlip,
  onGrade,
  theme,
  t,
  locale,
  reported,
  onReportWrong,
}: {
  card: StudyCard;
  flipped: boolean;
  onFlip: () => void;
  onGrade: (gotIt: boolean) => void;
  theme: AITheme;
  t: AIText;
  locale: string;
  reported: boolean;
  onReportWrong?: () => void;
}) {
  const reduce = useReduceMotion();
  const turn = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);

  // Rotate to edge-on, swap faces, rotate back. Content-height friendly (no absolute faces).
  const flip = () => {
    if (busy.current) return;
    busy.current = true;
    const half = (toValue: number, easing: (value: number) => number) =>
      Animated.timing(turn, { toValue, duration: MOTION.flipHalf, easing, useNativeDriver: NATIVE_DRIVER });
    half(1, Easing.in(Easing.quad)).start(() => {
      onFlip();
      half(0, Easing.out(Easing.quad)).start(() => {
        busy.current = false;
      });
    });
  };

  const animatedStyle = reduce
    ? { opacity: turn.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }
    : { transform: [{ perspective: 900 }, { rotateY: turn.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "90deg"] }) }] };

  return (
    <View style={{ gap: SPACE.md }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={flipped ? `${t("ai.practice.answer", "Answer")}: ${card.back}` : `${t("ai.practice.question", "Question")}: ${card.front}`}
        accessibilityHint={flipped ? t("ai.practice.flip_back_hint", "Shows the question again") : t("ai.practice.flip_hint", "Reveals the answer")}
        accessibilityLiveRegion="polite"
        onPress={flip}
      >
        <Animated.View style={animatedStyle}>
          {flipped ? (
            <HeroCard theme={theme} style={{ minHeight: 230, gap: SPACE.md }}>
              <Kicker text={t("ai.practice.answer_kicker", "ANSWER")} theme={theme} onHero color={HERO.lavender} />
              <Text selectable style={{ color: HERO.onHero, fontSize: TYPE.title3 - 1, lineHeight: 27, fontWeight: "800" }}>{card.back}</Text>
              <SourceQuote source={card.source} theme={theme} t={t} locale={locale} onHero />
            </HeroCard>
          ) : (
            <AICard theme={theme} style={{ minHeight: 230, borderRadius: RADII.hero, justifyContent: "space-between", gap: SPACE.lg, padding: SPACE.xl + 2 }}>
              <Kicker text={t("ai.practice.question_kicker", "QUESTION")} theme={theme} />
              <Text selectable style={{ color: theme.label, fontSize: TYPE.title2 - 2, lineHeight: 30, fontWeight: "900", textAlign: "center" }}>{card.front}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <RotateCcw color={theme.label3} size={14} />
                <Text style={{ color: theme.label3, fontSize: TYPE.footnote, fontWeight: "800" }}>{t("ai.practice.tap_to_flip", "Tap to flip")}</Text>
              </View>
            </AICard>
          )}
        </Animated.View>
      </Pressable>

      {flipped ? (
        <View style={{ flexDirection: "row", gap: SPACE.sm }}>
          <View style={{ flex: 1 }}>
            <AIButton label={t("ai.practice.again", "Again")} icon={RotateCcw} variant="secondary" theme={theme} onPress={() => onGrade(false)} accessibilityHint={t("ai.practice.again_hint", "Marks this card to review again")} />
          </View>
          <View style={{ flex: 1 }}>
            <AIButton label={t("ai.practice.got_it", "Got it")} icon={Check} theme={theme} onPress={() => onGrade(true)} />
          </View>
        </View>
      ) : (
        <AIButton label={t("ai.practice.show_answer", "Show answer")} variant="secondary" theme={theme} onPress={flip} />
      )}
      {onReportWrong ? <ReportLink reported={reported} onPress={onReportWrong} theme={theme} t={t} /> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Multiple choice
// ---------------------------------------------------------------------------

function QuestionStep({
  question,
  selected,
  onSelect,
  onNext,
  last,
  theme,
  t,
  locale,
  reported,
  onReportWrong,
}: {
  question: StudyQuestion;
  selected: number | null;
  onSelect: (option: number) => void;
  onNext: () => void;
  last: boolean;
  theme: AITheme;
  t: AIText;
  locale: string;
  reported: boolean;
  onReportWrong?: () => void;
}) {
  const answered = selected !== null;
  const isCorrect = selected === question.answerIndex;
  const green = semanticText(COLORS.green, theme);
  const red = semanticText(COLORS.red, theme);
  return (
    <View style={{ gap: SPACE.md }}>
      {question.sharedByClassmate ? <Pill text={t("ai.practice.shared_by_classmate", "Shared by a classmate")} icon={Users} color={semanticText(COLORS.orange, theme)} theme={theme} /> : null}
      <Text selectable accessibilityRole="header" style={{ color: theme.label, fontSize: TYPE.title3, lineHeight: 28, fontWeight: "900" }}>{question.stem}</Text>
      <View accessibilityRole="radiogroup" style={{ gap: SPACE.sm }}>
        {question.options.map((option, optionIndex) => {
          const isAnswer = optionIndex === question.answerIndex;
          const isPicked = optionIndex === selected;
          const state = !answered ? "idle" : isAnswer ? "correct" : isPicked ? "wrong" : "dim";
          const bg = state === "correct" ? tint(COLORS.green, theme.dark ? "2A" : "1C") : state === "wrong" ? tint(COLORS.red, theme.dark ? "2A" : "18") : theme.surface;
          const border = state === "correct" ? COLORS.green : state === "wrong" ? COLORS.red : theme.hairline;
          const status = state === "correct" ? t("ai.practice.correct_answer", "Correct answer") : state === "wrong" ? t("ai.practice.your_answer", "Your answer") : "";
          return (
            <Pressable
              key={`${question.id}-${optionIndex}`}
              accessibilityRole="radio"
              accessibilityLabel={[option, status].filter(Boolean).join(". ")}
              accessibilityState={{ selected: isPicked, disabled: answered }}
              disabled={answered}
              onPress={() => onSelect(optionIndex)}
              style={({ pressed }) => ({
                minHeight: TOUCH + 8,
                borderRadius: 18,
                borderWidth: state === "correct" || state === "wrong" ? 2 : 1,
                borderColor: border,
                backgroundColor: bg,
                opacity: state === "dim" ? 0.55 : pressed ? 0.8 : 1,
                flexDirection: "row",
                alignItems: "center",
                gap: SPACE.md,
                paddingHorizontal: 14,
                paddingVertical: 12,
              })}
            >
              <View style={{ width: 28, height: 28, borderRadius: RADII.pill, alignItems: "center", justifyContent: "center", backgroundColor: state === "correct" ? COLORS.green : state === "wrong" ? COLORS.red : theme.surface2 }}>
                {state === "correct" ? (
                  <Check color="#FFFFFF" size={16} strokeWidth={3} />
                ) : state === "wrong" ? (
                  <XCircle color="#FFFFFF" size={16} strokeWidth={2.6} />
                ) : (
                  <Text style={{ color: theme.label2, fontSize: TYPE.footnote, fontWeight: "900" }}>{formatNumber(locale, optionIndex + 1)}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text selectable style={{ color: theme.label, fontSize: TYPE.callout, fontWeight: "800", lineHeight: 21 }}>{option}</Text>
                {status ? <Text style={{ color: state === "correct" ? green : red, fontSize: TYPE.caption, fontWeight: "900", marginTop: 2 }}>{status}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {answered ? (
        <View accessibilityLiveRegion="polite" style={{ gap: SPACE.md, padding: SPACE.lg, borderRadius: RADII.panel, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.sm }}>
            {isCorrect ? <CheckCircle2 color={green} size={22} /> : <XCircle color={red} size={22} />}
            <Text selectable style={{ color: isCorrect ? green : red, fontSize: TYPE.headline, fontWeight: "900" }}>
              {isCorrect ? t("ai.practice.correct", "Correct") : t("ai.practice.incorrect", "Not quite")}
            </Text>
          </View>
          {question.why ? <Text selectable style={{ color: theme.label, lineHeight: 21 }}>{question.why}</Text> : null}
          <SourceQuote source={question.source} theme={theme} t={t} locale={locale} />
          <AIButton label={last ? t("ai.practice.see_results", "See results") : t("ai.practice.next", "Next question")} theme={theme} onPress={onNext} />
        </View>
      ) : null}
      {onReportWrong ? <ReportLink reported={reported} onPress={onReportWrong} theme={theme} t={t} /> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

/** "From your note, line 12: “…”" in a quiet quoted block. */
export function SourceQuote({ source, theme, t, locale, onHero = false }: { source: SourceCitation; theme: AITheme; t: AIText; locale: string; onHero?: boolean }) {
  const label =
    typeof source.line === "number"
      ? t("ai.practice.source_line", "From your note, line {line}:", { line: formatNumber(locale, source.line) })
      : t("ai.practice.source", "From your note:");
  const quote = t("ai.practice.quote", "“{quote}”", { quote: source.quote });
  return (
    <View
      accessible
      accessibilityLabel={`${label} ${source.quote}`}
      style={{
        flexDirection: "row",
        gap: SPACE.sm,
        padding: SPACE.md,
        borderRadius: RADII.inner,
        backgroundColor: onHero ? "rgba(255,255,255,0.08)" : theme.surface2,
        borderStartWidth: 3,
        borderStartColor: onHero ? HERO.lavender : theme.label3,
      }}
    >
      <Quote color={onHero ? HERO.lavender : theme.label3} size={14} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text selectable style={{ color: onHero ? HERO.onHero3 : theme.label2, fontSize: TYPE.caption, fontWeight: "900" }}>{label}</Text>
        <Text selectable style={{ color: onHero ? HERO.onHero2 : theme.label, fontSize: TYPE.footnote + 1, lineHeight: 19, fontStyle: "italic" }}>{quote}</Text>
      </View>
    </View>
  );
}

function ReportLink({ reported, onPress, theme, t }: { reported: boolean; onPress: () => void; theme: AITheme; t: AIText }) {
  if (reported) {
    return (
      <View style={{ minHeight: TOUCH, justifyContent: "center" }}>
        <Text selectable style={{ color: theme.label3, fontSize: TYPE.footnote, fontWeight: "800" }}>{t("ai.practice.reported", "Thanks. This item won't be shown again.")}</Text>
      </View>
    );
  }
  return <LinkButton label={t("ai.practice.report", "Report wrong answer")} icon={Flag} color={theme.label2} onPress={onPress} accessibilityHint={t("ai.practice.report_hint", "Flags this item so it is not shown again")} />;
}

function FinishSummary({
  mode,
  score,
  theme,
  t,
  locale,
  onShareScore,
  onRestart,
  onClose,
}: {
  mode: PracticeMode;
  score: PracticeScore;
  theme: AITheme;
  t: AIText;
  locale: string;
  onShareScore?: (score: PracticeScore) => void;
  onRestart: () => void;
  onClose?: () => void;
}) {
  const ratio = score.total ? score.correct / score.total : 0;
  const message =
    ratio >= 0.8
      ? t("ai.practice.result_strong", "Strong. You know this material.")
      : ratio >= 0.5
        ? t("ai.practice.result_mid", "Getting there. One more round locks it in.")
        : t("ai.practice.result_low", "Good practice. The missed ones are the ones to review.");
  const scoreText = t("ai.practice.score", "{correct}/{total}", { correct: formatNumber(locale, score.correct), total: formatNumber(locale, score.total) });
  return (
    <HeroCard theme={theme} style={{ gap: SPACE.md, alignItems: "stretch" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE.sm }}>
        <Trophy color={HERO.lavenderSoft} size={18} />
        <Kicker text={mode === "cards" ? t("ai.practice.done_cards", "DECK COMPLETE") : t("ai.practice.done_quiz", "QUIZ COMPLETE")} theme={theme} onHero color={HERO.lavenderSoft} />
      </View>
      <Text selectable accessibilityLabel={t("ai.practice.score_a11y", "{correct} of {total} correct", { correct: formatNumber(locale, score.correct), total: formatNumber(locale, score.total) })} style={{ color: HERO.onHero, fontSize: 56, lineHeight: 62, fontWeight: "900" }}>
        {scoreText}
      </Text>
      <Text selectable style={{ color: HERO.onHero2, fontSize: TYPE.callout, lineHeight: 22 }}>{message}</Text>
      <View style={{ gap: SPACE.sm, marginTop: SPACE.xs }}>
        {mode === "quiz" && onShareScore ? (
          <AIButton label={t("ai.practice.share_score", "Share score")} icon={Swords} variant="onHero" theme={theme} onPress={() => onShareScore(score)} accessibilityHint={t("ai.practice.share_score_hint", "Challenges a friend to beat your score with the same questions")} />
        ) : null}
        <AIButton label={t("ai.practice.again_round", "Practice again")} icon={RotateCcw} variant={mode === "quiz" && onShareScore ? "onHeroSecondary" : "onHero"} theme={theme} onPress={onRestart} />
        {onClose ? <AIButton label={t("ai.common.done", "Done")} variant="onHeroSecondary" theme={theme} onPress={onClose} /> : null}
      </View>
    </HeroCard>
  );
}
