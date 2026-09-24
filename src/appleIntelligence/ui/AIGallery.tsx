// QA gallery: every 2.2 component in every state, for web-rendered screenshot
// review across 10 locales, light/dark and RTL. Section labels are developer
// labels (English, not localized) and never ship in a user-facing route.
import React, { useRef } from "react";
import { ScrollView, Text, View } from "react-native";
import { AIBadge, OriginChip } from "./AIBadge";
import { AIStatusRow } from "./AIStatusRow";
import { ClassPackSheet } from "./ClassPackSheet";
import { ExamModeScreen } from "./ExamModeScreen";
import { ForecastHeatmap } from "./ForecastHeatmap";
import { ForecastSection } from "./ForecastSection";
import { ForecastShareCard } from "./ForecastShareCard";
import { directionFor } from "./format";
import {
  FIXTURE_AVAILABILITY,
  FIXTURE_BRIEF,
  FIXTURE_BRIEF_TEMPLATE,
  FIXTURE_CLASSES,
  FIXTURE_EXAM,
  FIXTURE_EXAM_EARLY,
  FIXTURE_EXAM_NO_NOTES,
  FIXTURE_FORECAST,
  FIXTURE_FORECAST_CALM,
  FIXTURE_FORECAST_EMPTY,
  FIXTURE_FORECAST_PREVIEW,
  FIXTURE_PACK_LINK,
  FIXTURE_PROPOSAL_NEEDS,
  FIXTURE_PROPOSAL_READY,
  FIXTURE_QR_MATRIX,
  FIXTURE_STUDY_SET,
  FIXTURE_TODAY,
} from "./fixtures";
import { DuelIntroCard, PastePackBanner, UnlockForecastCTA } from "./GrowthCards";
import { PracticeSession } from "./PracticeSession";
import { QuickAddConfirmSheet } from "./QuickAddConfirmSheet";
import { ScanProgress } from "./ScanProgress";
import { StudyNowCard } from "./StudyNowCard";
import type { AIBaseProps } from "./theme";
import { HERO, RADII, SPACE } from "./tokens";

const noop = () => {};

export type AIGalleryProps = AIBaseProps & {
  /** Render only sections whose label includes this text (screenshot slicing). */
  only?: string;
};

export function AIGallery({ theme, t, locale, only }: AIGalleryProps) {
  const base = { theme, t, locale };
  const shareRef = useRef<View>(null);
  const show = (label: string) => !only || label.toLowerCase().includes(only.toLowerCase());
  const section = (label: string, children: React.ReactNode) =>
    show(label) ? (
      <View key={label} style={{ gap: SPACE.md }}>
        <Text style={{ color: theme.label3, fontSize: 12, fontWeight: "900", letterSpacing: 0.6 }}>{label.toUpperCase()}</Text>
        {children}
      </View>
    ) : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ padding: SPACE.lg, paddingTop: 58, paddingBottom: 80, gap: 36, direction: directionFor(locale) }}>
      {section(
        "01 AIBadge + OriginChip",
        <View style={{ gap: SPACE.md }}>
          <View style={{ flexDirection: "row", gap: SPACE.sm, flexWrap: "wrap", alignItems: "center" }}>
            <AIBadge {...base} />
            <AIBadge {...base} size="md" />
            <View style={{ padding: SPACE.sm, borderRadius: RADII.inner, backgroundColor: HERO.plum }}>
              <AIBadge {...base} tone="onHero" size="md" />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: SPACE.sm, flexWrap: "wrap" }}>
            <OriginChip {...base} origin="both" />
            <OriginChip {...base} origin="onDevice" />
            <OriginChip {...base} origin="heuristic" showHeuristic />
          </View>
        </View>,
      )}
      {section(
        "02 ForecastHeatmap",
        <View style={{ padding: SPACE.lg, borderRadius: RADII.card, backgroundColor: theme.surface }}>
          <ForecastHeatmap {...base} forecast={FIXTURE_FORECAST} />
        </View>,
      )}
      {section("03 ForecastSection full", <ForecastSection {...base} mode="full" forecast={FIXTURE_FORECAST} onShare={noop} onClassPack={noop} onStartBy={noop} />)}
      {section("04 ForecastSection compact", <ForecastSection {...base} mode="compact" forecast={FIXTURE_FORECAST} onShare={noop} onOpen={noop} />)}
      {section("05 ForecastSection preview", <ForecastSection {...base} mode="preview" forecast={FIXTURE_FORECAST_PREVIEW} onShare={noop} onUnlock={noop} />)}
      {section("06 ForecastSection no crunch", <ForecastSection {...base} mode="full" forecast={FIXTURE_FORECAST_CALM} onShare={noop} />)}
      {section("07 ForecastSection empty", <ForecastSection {...base} mode="full" forecast={FIXTURE_FORECAST_EMPTY} onImport={noop} />)}
      {section(
        "08 ForecastShareCard",
        <ScrollView horizontal contentContainerStyle={{ gap: SPACE.lg }} showsHorizontalScrollIndicator={false}>
          <ForecastShareCard ref={shareRef} {...base} forecast={FIXTURE_FORECAST} />
          <ForecastShareCard {...base} forecast={FIXTURE_FORECAST} caption="cry" />
          <ForecastShareCard {...base} forecast={FIXTURE_FORECAST} hideNames={false} />
        </ScrollView>,
      )}
      {section("09 ClassPackSheet QR", <ClassPackSheet {...base} className="Cell Biology" classCode="BIO 110" itemCount={9} link={FIXTURE_PACK_LINK} matrix={FIXTURE_QR_MATRIX} onDone={noop} />)}
      {section("10 ClassPackSheet link only", <ClassPackSheet {...base} className="Organic Chemistry" classCode="CHEM 201" itemCount={42} link={FIXTURE_PACK_LINK} matrix={null} onDone={noop} />)}
      {section(
        "11 StudyNowCard",
        <View style={{ gap: SPACE.md }}>
          <StudyNowCard {...base} brief={FIXTURE_BRIEF} onStart={noop} onReschedule={noop} />
          <StudyNowCard {...base} brief={FIXTURE_BRIEF_TEMPLATE} onStart={noop} onReschedule={noop} />
          <StudyNowCard {...base} brief={FIXTURE_BRIEF} variant="compact" onStart={noop} />
        </View>,
      )}
      {section(
        "12 ExamModeScreen",
        <ExamModeScreen {...base} scrollable={false} summary={FIXTURE_EXAM} onPracticeCards={noop} onPracticeQuiz={noop} onDuel={noop} onProposeBlocks={noop} onAddNotes={noop} onTopic={noop} />,
      )}
      {section("13 ExamModeScreen few answers", <ExamModeScreen {...base} scrollable={false} summary={FIXTURE_EXAM_EARLY} onPracticeCards={noop} onPracticeQuiz={noop} onDuel={noop} onAddNotes={noop} />)}
      {section("14 ExamModeScreen no notes", <ExamModeScreen {...base} scrollable={false} summary={FIXTURE_EXAM_NO_NOTES} onPracticeCards={noop} onPracticeQuiz={noop} onAddNotes={noop} />)}
      {section(
        "15 PracticeSession cards",
        <View style={{ gap: SPACE.xl }}>
          <PracticeSession {...base} mode="cards" title="BIO 110 · Chapter 7 notes" origin="onDevice" cards={FIXTURE_STUDY_SET.cards} onAnswer={noop} onReportWrong={noop} />
          <PracticeSession {...base} mode="cards" title="BIO 110 · Chapter 7 notes" origin="onDevice" cards={FIXTURE_STUDY_SET.cards} onAnswer={noop} onReportWrong={noop} initialState={{ index: 1, flipped: true }} />
        </View>,
      )}
      {section(
        "16 PracticeSession quiz",
        <View style={{ gap: SPACE.xl }}>
          <PracticeSession {...base} mode="quiz" origin="onDevice" questions={FIXTURE_STUDY_SET.questions} onAnswer={noop} onReportWrong={noop} />
          <PracticeSession {...base} mode="quiz" origin="onDevice" questions={FIXTURE_STUDY_SET.questions} onAnswer={noop} onReportWrong={noop} initialState={{ index: 1, selected: 1, correct: 1 }} />
          <PracticeSession {...base} mode="quiz" origin="duel" questions={FIXTURE_STUDY_SET.questions} onAnswer={noop} onReportWrong={noop} initialState={{ index: 3, selected: 3, correct: 2 }} />
        </View>,
      )}
      {section(
        "17 PracticeSession summary + empty",
        <View style={{ gap: SPACE.xl }}>
          <PracticeSession {...base} mode="quiz" questions={FIXTURE_STUDY_SET.questions} onAnswer={noop} onShareScore={noop} onClose={noop} initialState={{ finished: true, correct: 3 }} />
          <PracticeSession {...base} mode="cards" cards={[]} onAnswer={noop} onClose={noop} />
        </View>,
      )}
      {section(
        "18 QuickAddConfirmSheet",
        <View style={{ gap: SPACE.xl }}>
          <QuickAddConfirmSheet {...base} proposal={FIXTURE_PROPOSAL_NEEDS} classes={FIXTURE_CLASSES} today={FIXTURE_TODAY} onConfirm={noop} onCancel={noop} />
          <QuickAddConfirmSheet {...base} proposal={FIXTURE_PROPOSAL_READY} classes={FIXTURE_CLASSES} today={FIXTURE_TODAY} onConfirm={noop} onCancel={noop} />
        </View>,
      )}
      {section(
        "19 ScanProgress",
        <View style={{ gap: SPACE.md }}>
          <ScanProgress {...base} page={2} pageCount={5} found={17} documentReader onDevice onCancel={noop} />
          <ScanProgress {...base} page={1} pageCount={1} found={1} onCancel={noop} />
          <ScanProgress {...base} page={5} pageCount={5} found={43} done onDevice />
        </View>,
      )}
      {section(
        "20 AIStatusRow",
        <View style={{ gap: SPACE.md }}>
          <AIStatusRow {...base} availability={FIXTURE_AVAILABILITY.available} enabled onToggle={noop} onClear={noop} />
          <AIStatusRow {...base} availability={FIXTURE_AVAILABILITY.userDisabled} enabled={false} onToggle={noop} onClear={noop} />
          <AIStatusRow {...base} availability={FIXTURE_AVAILABILITY.modelNotReady} enabled onToggle={noop} onClear={noop} />
          <AIStatusRow {...base} availability={FIXTURE_AVAILABILITY.appleIntelligenceNotEnabled} enabled onToggle={noop} onClear={noop} />
          <AIStatusRow {...base} availability={FIXTURE_AVAILABILITY.localeUnsupported} enabled onToggle={noop} onClear={noop} />
          <AIStatusRow {...base} availability={FIXTURE_AVAILABILITY.deviceNotEligible} enabled onToggle={noop} onClear={noop} clearing />
          <AIStatusRow {...base} availability={FIXTURE_AVAILABILITY.unsupportedOS} enabled onToggle={noop} onClear={noop} />
        </View>,
      )}
      {section("21 PastePackBanner", <PastePackBanner {...base} onPaste={noop} onDismiss={noop} />)}
      {section(
        "22 DuelIntroCard",
        <View style={{ gap: SPACE.md }}>
          <DuelIntroCard {...base} senderName="Maya" title="BIO 110 · Cellular respiration" questionCount={10} targetScore={8} onStart={noop} />
          <DuelIntroCard {...base} title="CHEM 201 · Exam 1 review" questionCount={6} onStart={noop} />
        </View>,
      )}
      {section(
        "23 UnlockForecastCTA",
        <View style={{ gap: SPACE.md }}>
          <UnlockForecastCTA {...base} forecast={FIXTURE_FORECAST_PREVIEW} />
          <UnlockForecastCTA {...base} forecast={FIXTURE_FORECAST_PREVIEW} onPress={noop} />
        </View>,
      )}
    </ScrollView>
  );
}
