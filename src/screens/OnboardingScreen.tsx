import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import {
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  FileScan,
  Flame,
  Sparkles,
  Target
} from "lucide-react-native";

import {
  GlassCard,
  MetricPill,
  StatusBadge,
  StudyPlannerBrand,
  WidgetPreviewHeavyWeek,
  WidgetPreviewMedium,
  WidgetPreviewMonthly,
  WidgetPreviewSmall
} from "../components/PremiumUI";
import { WidgetSnapshotService } from "../services/widgetSnapshotService";
import { Assignment, Course, Semester } from "../models";
import {
  AppTheme,
  createWidgetStyleSnapshot,
  ThemePaletteId,
  WidgetStylePresetId,
  widgetStylePresets
} from "../theme";
import { useAppTheme } from "../themeContext";

type OnboardingScreenProps = {
  initialStep?: number;
  onFinish: () => void;
};

type OnboardingStepId =
  | "syllabus"
  | "review"
  | "calendar"
  | "today"
  | "widgets"
  | "palette";

type WidgetFocusId = "nextDue" | "thisWeek" | "calendar" | "heavyWeek";

const previewNow = new Date("2025-04-22T09:41:00-04:00");

const previewSemester: Semester = {
  id: "onboarding-preview-semester",
  name: "Spring Preview",
  startDate: "2025-01-13",
  endDate: "2025-05-09"
};

const previewCourses: Course[] = [
  {
    id: "preview-bio",
    code: "Chemistry 101",
    name: "Lab Chemistry",
    color: "#34D399",
    meetings: [],
    gradeCategories: []
  },
  {
    id: "preview-calc",
    code: "Calculus II",
    name: "Differential Calculus",
    color: "#7C3AED",
    meetings: [],
    gradeCategories: []
  },
  {
    id: "preview-writing",
    code: "English 101",
    name: "Academic Writing",
    color: "#F97316",
    meetings: [],
    gradeCategories: []
  }
];

const previewAssignments: Assignment[] = [
  previewAssignment("preview-problem-set", "preview-calc", "Calculus II", "Problem Set 4", "2025-04-23T23:59:00-04:00", "assignment", "high"),
  previewAssignment("preview-lab-report", "preview-bio", "Chemistry 101", "Lab Report", "2025-04-22T23:59:00-04:00", "assignment", "medium"),
  previewAssignment("preview-reading", "preview-writing", "English 101", "Reading Reflection", "2025-04-23T11:00:00-04:00", "reading", "medium"),
  previewAssignment("preview-midterm", "preview-calc", "Calculus II", "Midterm Review", "2025-04-25T09:00:00-04:00", "exam", "high"),
  {
    ...previewAssignment("preview-done", "preview-bio", "Chemistry 101", "Syllabus Quiz", "2025-04-18T09:00:00-04:00", "quiz", "low"),
    completionStatus: "completed",
    status: "done",
    reviewStatus: "accepted"
  }
];

const onboardingSteps: Array<{
  id: OnboardingStepId;
  eyebrow: string;
  title: string;
  copy: string;
  icon: React.ComponentType<{ color: string; size: number }>;
}> = [
  {
    id: "syllabus",
    eyebrow: "Syllabus AI",
    title: "Turn syllabi into a semester plan.",
    copy: "Manual planning is free. Plus can read text-based syllabi now, with photo OCR when a school-safe parser is configured.",
    icon: FileScan
  },
  {
    id: "review",
    eyebrow: "Check New Work",
    title: "Approve the plan before it touches your calendar.",
    copy: "High-confidence dates can be accepted quickly, while anything uncertain stays editable.",
    icon: CheckCircle2
  },
  {
    id: "calendar",
    eyebrow: "Calendar",
    title: "See the month and week together.",
    copy: "Course colors, exams, busy days, completed work, and the week view all use the same plan.",
    icon: CalendarRange
  },
  {
    id: "today",
    eyebrow: "Today",
    title: "Know what to do today.",
    copy: "Today shows the next deadline, this week's workload, and quick actions.",
    icon: Target
  },
  {
    id: "widgets",
    eyebrow: "Widget Setup",
    title: "Make deadlines visible before opening the app.",
    copy: "Choose what a widget shows, how big it is, and which colors it uses.",
    icon: Crown
  },
  {
    id: "palette",
    eyebrow: "Study Style",
    title: "Choose the color system that feels like yours.",
    copy: "Your colors carry through the app, calendar dots, workload bars, and widget previews.",
    icon: Sparkles
  }
];

const widgetFocusOptions: Array<{ id: WidgetFocusId; label: string }> = [
  { id: "nextDue", label: "Next Due" },
  { id: "thisWeek", label: "This Week" },
  { id: "calendar", label: "Calendar" },
  { id: "heavyWeek", label: "Busy Week" }
];

const onboardingWidgetStyles: WidgetStylePresetId[] = [
  "ocean",
  "violet",
  "emerald",
  "sunset",
  "graphite",
  "cleanWhite",
  "darkGlass"
];

export function OnboardingScreen({ initialStep = 0, onFinish }: OnboardingScreenProps) {
  const { theme, paletteId, palettes, setPalette } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const [index, setIndex] = useState(clampStep(initialStep));
  const [widgetStyleId, setWidgetStyleId] = useState<WidgetStylePresetId>("ocean");
  const [widgetFocus, setWidgetFocus] = useState<WidgetFocusId>("calendar");
  const motion = useRef(new Animated.Value(0)).current;
  const step = onboardingSteps[index] ?? onboardingSteps[0]!;
  const Icon = step.icon;
  const isFinal = index === onboardingSteps.length - 1;
  const widgetSnapshot = useMemo(
    () =>
      WidgetSnapshotService.build(
        {
          semester: previewSemester,
          courses: previewCourses,
          assignments: previewAssignments,
          paletteId,
          widgetStyleId
        },
        previewNow
      ),
    [paletteId, widgetStyleId]
  );
  const widgetStyle = useMemo(
    () => createWidgetStyleSnapshot(paletteId, widgetStyleId),
    [paletteId, widgetStyleId]
  );

  useEffect(() => {
    setIndex(clampStep(initialStep));
  }, [initialStep]);

  useEffect(() => {
    motion.setValue(0);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1,
          duration: 1700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(motion, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true
        })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [index, motion]);

  const goNext = () => {
    if (isFinal) {
      onFinish();
      return;
    }
    setIndex((current) => Math.min(onboardingSteps.length - 1, current + 1));
  };

  const goBack = () => {
    setIndex((current) => Math.max(0, current - 1));
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <StudyPlannerBrand compact />
        <TouchableOpacity accessibilityRole="button" style={styles.skipButton} onPress={onFinish}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <View pointerEvents="none" style={styles.heroBandOne} />
        <View pointerEvents="none" style={styles.heroBandTwo} />
        <View style={styles.stepBadge}>
          <View style={styles.stepIcon}>
            <Icon color={colors.heroText} size={19} />
          </View>
          <Text style={styles.stepKicker}>{step.eyebrow}</Text>
          <Text style={styles.stepCount}>{index + 1}/{onboardingSteps.length}</Text>
        </View>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.copy}>{step.copy}</Text>
        <StepProgress activeIndex={index} />
      </View>

      <FeaturePreview
        id={step.id}
        motion={motion}
        widgetFocus={widgetFocus}
        widgetSnapshot={widgetSnapshot}
        widgetStyle={widgetStyle}
        widgetStyleId={widgetStyleId}
        onWidgetFocusChange={setWidgetFocus}
        onWidgetStyleChange={setWidgetStyleId}
        paletteId={paletteId}
        palettes={palettes}
        onPaletteChange={setPalette}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          accessibilityRole="button"
          disabled={index === 0}
          style={[styles.backButton, index === 0 ? styles.backButtonDisabled : null]}
          onPress={goBack}
        >
          <ChevronLeft color={index === 0 ? colors.faint : colors.ink} size={18} />
          <Text style={[styles.backText, index === 0 ? styles.backTextDisabled : null]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.nextButton} onPress={goNext}>
          <Text style={styles.nextText}>{isFinal ? "Enter StudyPlanner" : "Next"}</Text>
          <ChevronRight color={colors.heroText} size={18} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function FeaturePreview({
  id,
  motion,
  widgetFocus,
  widgetSnapshot,
  widgetStyle,
  widgetStyleId,
  onWidgetFocusChange,
  onWidgetStyleChange,
  paletteId,
  palettes,
  onPaletteChange
}: {
  id: OnboardingStepId;
  motion: Animated.Value;
  widgetFocus: WidgetFocusId;
  widgetSnapshot: ReturnType<typeof WidgetSnapshotService.build>;
  widgetStyle: ReturnType<typeof createWidgetStyleSnapshot>;
  widgetStyleId: WidgetStylePresetId;
  onWidgetFocusChange: (focus: WidgetFocusId) => void;
  onWidgetStyleChange: (styleId: WidgetStylePresetId) => void;
  paletteId: ThemePaletteId;
  palettes: ReturnType<typeof useAppTheme>["palettes"];
  onPaletteChange: (paletteId: ThemePaletteId) => void;
}) {
  if (id === "review") return <ReviewInboxPreview motion={motion} />;
  if (id === "calendar") return <CalendarFillPreview motion={motion} />;
  if (id === "today") return <TodayCommandPreview motion={motion} />;
  if (id === "widgets") {
    return (
      <WidgetCustomizationPreview
        motion={motion}
        snapshot={widgetSnapshot}
        widgetFocus={widgetFocus}
        widgetStyle={widgetStyle}
        widgetStyleId={widgetStyleId}
        onWidgetFocusChange={onWidgetFocusChange}
        onWidgetStyleChange={onWidgetStyleChange}
      />
    );
  }
  if (id === "palette") {
    return (
      <PaletteSelectorPreview
        paletteId={paletteId}
        palettes={palettes}
        onPaletteChange={onPaletteChange}
      />
    );
  }
  return <SyllabusToPlanPreview motion={motion} />;
}

function SyllabusToPlanPreview({ motion }: { motion: Animated.Value }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const extractedOpacity = motion.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0.18, 1, 1] });
  const extractedShift = motion.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  return (
    <GlassCard style={styles.previewCard}>
      <View pointerEvents="none" style={styles.previewBand} />
      <View style={styles.previewHeader}>
        <View style={styles.previewIcon}>
          <FileScan color={colors.heroText} size={18} />
        </View>
        <View style={styles.previewCopy}>
          <Text style={styles.previewKicker}>Upload flow</Text>
          <Text style={styles.previewTitle}>Messy syllabus to clean plan</Text>
        </View>
        <StatusBadge label="Private" tone="green" />
      </View>
      <View style={styles.scanStage}>
        <View style={styles.syllabusPage}>
          <Text style={styles.syllabusTitle}>Spring syllabus packet</Text>
          {[0, 1, 2, 3, 4].map((line) => (
            <View key={line} style={[styles.syllabusLine, { width: `${86 - line * 9}%` as `${number}%` }]} />
          ))}
          <Animated.View
            style={[
              styles.scanBeam,
              {
                transform: [
                  {
                    translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [-2, 92] })
                  }
                ]
              }
            ]}
          />
        </View>
        <Animated.View
          style={[
            styles.extractedPanel,
            { opacity: extractedOpacity, transform: [{ translateX: extractedShift }] }
          ]}
        >
          <ExtractedRow color={previewCourses[0]!.color} title="Lab Report" meta="Apr 22 - assignment" />
          <ExtractedRow color={previewCourses[1]!.color} title="Problem Set 4" meta="Apr 23 - assignment" />
          <ExtractedRow color={previewCourses[2]!.color} title="Reading Reflection" meta="Apr 23 - reading" />
        </Animated.View>
      </View>
    </GlassCard>
  );
}

function ReviewInboxPreview({ motion }: { motion: Animated.Value }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const rows = [
    ["Lab Report", "Chemistry 101 - high confidence", previewCourses[0]!.color],
    ["Problem Set 4", "Calculus II - needs date check", previewCourses[1]!.color],
    ["Reading Reflection", "English 101 - accepted", previewCourses[2]!.color]
  ] as const;

  return (
    <GlassCard style={styles.previewCard}>
      <View style={styles.reviewHero}>
        <View style={styles.reviewIcon}>
          <CheckCircle2 color={colors.heroText} size={18} />
        </View>
        <View style={styles.previewCopy}>
          <Text style={styles.previewKicker}>Check New Work</Text>
          <Text style={styles.previewTitle}>Approve with confidence</Text>
          <Text style={styles.previewMeta}>Nothing reaches Today, Calendar, or widgets until you say yes.</Text>
        </View>
      </View>
      <View style={styles.reviewRows}>
        {rows.map(([title, meta, color], index) => (
          <Animated.View
            key={title}
            style={[
              styles.reviewRow,
              {
                opacity: motion.interpolate({
                  inputRange: [0, 0.2 + index * 0.14, 1],
                  outputRange: [0.35, 1, 1]
                }),
                transform: [
                  {
                    translateX: motion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [26 - index * 5, 0]
                    })
                  }
                ]
              }
            ]}
          >
            <View style={[styles.courseDot, { backgroundColor: color }]} />
            <View style={styles.reviewCopy}>
              <Text style={styles.rowTitle}>{title}</Text>
              <Text style={styles.rowMeta}>{meta}</Text>
            </View>
            <View style={styles.reviewChips}>
              <Text style={styles.acceptChip}>Accept</Text>
              <Text style={styles.editChip}>Edit</Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </GlassCard>
  );
}

function CalendarFillPreview({ motion }: { motion: Animated.Value }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const activeScale = motion.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
  const dotDays = new Map([
    [3, [previewCourses[0]!.color]],
    [5, [previewCourses[1]!.color]],
    [10, [previewCourses[0]!.color, previewCourses[1]!.color]],
    [11, [previewCourses[0]!.color]],
    [12, [previewCourses[2]!.color]],
    [14, [previewCourses[0]!.color]],
    [20, [previewCourses[1]!.color]]
  ]);

  return (
    <GlassCard style={styles.previewCard}>
      <View style={styles.previewHeader}>
        <View style={styles.previewIcon}>
          <CalendarRange color={colors.heroText} size={18} />
        </View>
        <View style={styles.previewCopy}>
          <Text style={styles.previewKicker}>April 2025</Text>
          <Text style={styles.previewTitle}>Month grid plus week pressure</Text>
        </View>
        <StatusBadge label="2 busy days" tone="gold" />
      </View>
      <View style={styles.calendarPreviewGrid}>
        {Array.from({ length: 21 }, (_, dayIndex) => {
          const dayNumber = dayIndex + 1;
          const isToday = dayNumber === 10;
          const isExam = dayNumber === 20;
          return (
            <Animated.View
              key={dayNumber}
              style={[
                styles.calendarDay,
                isToday ? styles.calendarDayToday : null,
                isExam ? styles.calendarDayExam : null,
                isToday ? { transform: [{ scale: activeScale }] } : null
              ]}
            >
              <Text style={[styles.calendarDayText, isToday ? styles.calendarDayTextActive : null]}>
                {dayNumber}
              </Text>
              <View style={styles.calendarDots}>
                {(dotDays.get(dayNumber) || []).map((color, index) => (
                  <Animated.View
                    key={`${dayNumber}-${color}-${index}`}
                    style={[
                      styles.calendarDot,
                      {
                        backgroundColor: color,
                        opacity: motion.interpolate({
                          inputRange: [0, 0.2 + index * 0.2, 1],
                          outputRange: [0, 1, 1]
                        })
                      }
                    ]}
                  />
                ))}
              </View>
            </Animated.View>
          );
        })}
      </View>
      <View style={styles.weekPreview}>
        {[3, 1, 1, 0, 1, 0, 0].map((value, index) => (
          <View key={`${value}-${index}`} style={styles.weekTrack}>
            <Animated.View
              style={[
                styles.weekFill,
                {
                  height: `${Math.max(10, value * 30)}%` as `${number}%`,
                  opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.52, 1] })
                }
              ]}
            />
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

function TodayCommandPreview({ motion }: { motion: Animated.Value }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <GlassCard style={styles.previewCard}>
      <View style={styles.todayHero}>
        <View pointerEvents="none" style={styles.todayBand} />
        <View style={styles.previewHeader}>
          <View style={styles.previewIcon}>
            <Target color={colors.heroText} size={18} />
          </View>
          <View style={styles.previewCopy}>
            <Text style={styles.previewKicker}>Next Due</Text>
            <Text style={styles.todayTitle}>Problem Set 4</Text>
            <Text style={styles.todayMeta}>Calculus II - Tomorrow at 11:59 PM</Text>
          </View>
          <StatusBadge label="Today" tone="gold" />
        </View>
        <View style={styles.todayActions}>
          <View style={styles.secondaryAction}><Text style={styles.actionText}>Start</Text></View>
          <Animated.View
            style={[
              styles.primaryAction,
              {
                transform: [
                  {
                    scale: motion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] })
                  }
                ]
              }
            ]}
          >
            <Text style={styles.primaryActionText}>Complete</Text>
          </Animated.View>
        </View>
      </View>
      <View style={styles.metricRow}>
        <MetricPill label="Due Today" value="3" tone="purple" />
        <MetricPill label="Due Week" value="6" tone="blue" />
        <MetricPill label="Needs Check" value="7" tone="gold" />
      </View>
      <View style={styles.insightMini}>
        <Flame color={colors.coral} size={18} />
        <View style={styles.previewCopy}>
          <Text style={styles.rowTitle}>Busy week ahead</Text>
          <Text style={styles.rowMeta}>Calendar pressure and widgets update together.</Text>
        </View>
      </View>
    </GlassCard>
  );
}

function WidgetCustomizationPreview({
  motion,
  snapshot,
  widgetFocus,
  widgetStyle,
  widgetStyleId,
  onWidgetFocusChange,
  onWidgetStyleChange
}: {
  motion: Animated.Value;
  snapshot: ReturnType<typeof WidgetSnapshotService.build>;
  widgetFocus: WidgetFocusId;
  widgetStyle: ReturnType<typeof createWidgetStyleSnapshot>;
  widgetStyleId: WidgetStylePresetId;
  onWidgetFocusChange: (focus: WidgetFocusId) => void;
  onWidgetStyleChange: (styleId: WidgetStylePresetId) => void;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <GlassCard style={styles.widgetPreviewShell}>
      <View pointerEvents="none" style={styles.widgetShellBand} />
      <View style={styles.previewHeader}>
        <View style={styles.previewIcon}>
          <Crown color={colors.heroText} size={18} />
        </View>
        <View style={styles.previewCopy}>
          <Text style={styles.widgetPreviewKicker}>Widget Setup</Text>
          <Text style={styles.widgetPreviewTitle}>Deadlines stay visible on your Home Screen.</Text>
        </View>
      </View>

      <View style={styles.chipWrap}>
        {onboardingWidgetStyles.map((styleId) => {
          const preset = widgetStylePresets.find((item) => item.id === styleId)!;
          const active = widgetStyleId === styleId;
          return (
            <TouchableOpacity
              key={styleId}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.widgetStyleChip, active ? styles.widgetStyleChipActive : null]}
              onPress={() => onWidgetStyleChange(styleId)}
            >
              <View style={[styles.styleSwatch, { backgroundColor: preset.accent }]} />
              <Text style={[styles.widgetChipText, active ? styles.widgetChipTextActive : null]}>
                {preset.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.chipWrap}>
        {widgetFocusOptions.map((focus) => {
          const active = widgetFocus === focus.id;
          return (
            <TouchableOpacity
              key={focus.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.focusChip, active ? styles.focusChipActive : null]}
              onPress={() => onWidgetFocusChange(focus.id)}
            >
              <Text style={[styles.focusChipText, active ? styles.focusChipTextActive : null]}>
                {focus.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Animated.View
        style={[
          styles.widgetHeroPreview,
          {
            transform: [
              {
                translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [10, 0] })
              }
            ]
          }
        ]}
      >
        {widgetFocus === "nextDue" ? (
          <WidgetPreviewSmall snapshot={snapshot} widgetStyle={widgetStyle} />
        ) : widgetFocus === "thisWeek" ? (
          <WidgetPreviewMedium snapshot={snapshot} widgetStyle={widgetStyle} />
        ) : widgetFocus === "heavyWeek" ? (
          <WidgetPreviewHeavyWeek snapshot={snapshot} widgetStyle={widgetStyle} />
        ) : (
          <WidgetPreviewMonthly snapshot={snapshot} widgetStyle={widgetStyle} />
        )}
      </Animated.View>

      <View style={styles.widgetConceptRow}>
        <View style={styles.widgetConcept}>
          <Text style={styles.conceptLabel}>Small</Text>
          <Text style={styles.conceptValue}>Next Due</Text>
        </View>
        <View style={styles.widgetConcept}>
          <Text style={styles.conceptLabel}>Medium</Text>
          <Text style={styles.conceptValue}>This Week</Text>
        </View>
      </View>
    </GlassCard>
  );
}

function PaletteSelectorPreview({
  paletteId,
  palettes,
  onPaletteChange
}: {
  paletteId: ThemePaletteId;
  palettes: ReturnType<typeof useAppTheme>["palettes"];
  onPaletteChange: (paletteId: ThemePaletteId) => void;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const activePalette = palettes.find((palette) => palette.id === paletteId) || palettes[0]!;

  return (
    <GlassCard style={styles.previewCard}>
      <View style={styles.paletteHero}>
        <View style={[styles.paletteOrb, { backgroundColor: activePalette.accent }]} />
        <View style={[styles.paletteOrbTwo, { backgroundColor: activePalette.secondary }]} />
        <Text style={styles.paletteTitle}>{activePalette.name}</Text>
        <Text style={styles.paletteMeta}>Your selection is saved as the app palette.</Text>
      </View>
      <View style={styles.paletteGrid}>
        {palettes.map((palette) => {
          const active = palette.id === paletteId;
          return (
            <TouchableOpacity
              key={palette.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              activeOpacity={0.86}
              style={[styles.paletteChoice, active ? styles.paletteChoiceActive : null]}
              onPress={() => onPaletteChange(palette.id)}
            >
              <View style={styles.paletteSwatches}>
                <View style={[styles.paletteSwatch, { backgroundColor: palette.accent }]} />
                <View style={[styles.paletteSwatch, { backgroundColor: palette.secondary }]} />
                <View style={[styles.paletteSwatch, { backgroundColor: palette.tertiary }]} />
              </View>
              <Text style={[styles.paletteName, active ? styles.paletteNameActive : null]}>
                {palette.shortName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.readyPanel}>
        <Sparkles color={colors.brandPurple} size={18} />
        <View style={styles.previewCopy}>
          <Text style={styles.rowTitle}>Ready when you are</Text>
          <Text style={styles.rowMeta}>Start with an empty planner, then scan a syllabus or add courses manually.</Text>
        </View>
      </View>
    </GlassCard>
  );
}

function StepProgress({ activeIndex }: { activeIndex: number }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.progressRow}>
      {onboardingSteps.map((step, index) => (
        <View
          key={step.id}
          style={[
            styles.progressDot,
            index <= activeIndex ? styles.progressDotActive : null,
            index === activeIndex ? styles.progressDotCurrent : null
          ]}
        />
      ))}
    </View>
  );
}

function ExtractedRow({ color, title, meta }: { color: string; title: string; meta: string }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.extractedRow}>
      <View style={[styles.courseDot, { backgroundColor: color }]} />
      <View style={styles.previewCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowMeta}>{meta}</Text>
      </View>
    </View>
  );
}

function previewAssignment(
  id: string,
  courseId: string,
  courseName: string,
  title: string,
  dueAt: string,
  type: Assignment["type"],
  priority: Assignment["priority"]
): Assignment {
  return {
    id,
    courseId,
    courseName,
    title,
    type,
    kind: type,
    dueAt,
    sourceText: `${title} due ${dueAt}`,
    confidence: priority === "high" ? 0.96 : 0.87,
    reviewStatus: "needsReview",
    completionStatus: "open",
    reminderPreset: "day_before",
    createdAt: "2025-03-01T12:00:00-04:00",
    updatedAt: "2025-03-01T12:00:00-04:00",
    tags: ["onboarding-preview"],
    priority,
    estimatedMinutes: type === "exam" ? 180 : 75,
    status: "not_started",
    source: "demo"
  };
}

function clampStep(step: number) {
  if (!Number.isFinite(step)) return 0;
  return Math.max(0, Math.min(onboardingSteps.length - 1, Math.floor(step)));
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.canvas
    },
    content: {
      padding: spacing.lg,
      paddingBottom: 40,
      gap: spacing.md
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    brandRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    logoMark: {
      width: 42,
      height: 42,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandPurple,
      shadowColor: colors.brandPurple,
      shadowOpacity: 0.24,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4
    },
    brandKicker: {
      color: colors.brandPurple,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    brandTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    skipButton: {
      borderRadius: radii.round,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.line
    },
    skipText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    hero: {
      position: "relative",
      overflow: "hidden",
      minHeight: 238,
      borderRadius: 31,
      padding: spacing.lg,
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: `${colors.brandBlue}24`,
      shadowColor: colors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 5
    },
    heroBandOne: {
      position: "absolute",
      top: -42,
      right: -54,
      width: 230,
      height: 116,
      borderRadius: 42,
      backgroundColor: `${colors.brandBlue}14`,
      transform: [{ rotate: "24deg" }]
    },
    heroBandTwo: {
      position: "absolute",
      bottom: -46,
      left: -52,
      width: 220,
      height: 98,
      borderRadius: 38,
      backgroundColor: `${colors.brandCoral}10`,
      transform: [{ rotate: "-18deg" }]
    },
    stepBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    stepIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandPurple
    },
    stepKicker: {
      flex: 1,
      color: colors.brandPurple,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    stepCount: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    title: {
      color: colors.ink,
      fontSize: 33,
      lineHeight: 38,
      fontWeight: "900"
    },
    copy: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "700"
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginTop: "auto"
    },
    progressDot: {
      flex: 1,
      height: 6,
      borderRadius: radii.round,
      backgroundColor: colors.line
    },
    progressDotActive: {
      backgroundColor: colors.blueSoft
    },
    progressDotCurrent: {
      backgroundColor: colors.brandBlue
    },
    previewCard: {
      position: "relative",
      overflow: "hidden",
      gap: spacing.md,
      borderRadius: 28
    },
    previewBand: {
      position: "absolute",
      top: -36,
      right: -42,
      width: 190,
      height: 86,
      borderRadius: 30,
      backgroundColor: `${colors.brandBlue}26`,
      transform: [{ rotate: "22deg" }]
    },
    previewHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    previewIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandPurple
    },
    previewCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    previewKicker: {
      color: colors.brandPurple,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    previewTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    previewMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    scanStage: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "stretch"
    },
    syllabusPage: {
      flex: 1,
      minHeight: 190,
      borderRadius: 24,
      padding: spacing.md,
      gap: spacing.sm,
      overflow: "hidden",
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.line
    },
    syllabusTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    syllabusLine: {
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.lineStrong
    },
    scanBeam: {
      position: "absolute",
      left: spacing.sm,
      right: spacing.sm,
      top: 54,
      height: 28,
      borderRadius: 14,
      backgroundColor: `${colors.brandPurple}38`
    },
    extractedPanel: {
      flex: 1,
      minHeight: 190,
      borderRadius: 24,
      padding: spacing.sm,
      gap: spacing.xs,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.line
    },
    extractedRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      borderRadius: 15,
      padding: spacing.xs,
      backgroundColor: colors.surface
    },
    courseDot: {
      width: 10,
      height: 10,
      borderRadius: 5
    },
    rowTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    rowMeta: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    reviewHero: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: 24,
      padding: spacing.md,
      backgroundColor: colors.surfaceAlt,
      overflow: "hidden"
    },
    reviewIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandPurple
    },
    reviewRows: {
      gap: spacing.xs
    },
    reviewRow: {
      minHeight: 72,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: 20,
      padding: spacing.sm,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.line
    },
    reviewCopy: {
      flex: 1,
      minWidth: 0
    },
    reviewChips: {
      gap: 5,
      alignItems: "flex-end"
    },
    acceptChip: {
      overflow: "hidden",
      borderRadius: radii.round,
      paddingHorizontal: spacing.xs,
      paddingVertical: 4,
      color: colors.green,
      backgroundColor: colors.mint,
      fontSize: 10,
      fontWeight: "900"
    },
    editChip: {
      overflow: "hidden",
      borderRadius: radii.round,
      paddingHorizontal: spacing.xs,
      paddingVertical: 4,
      color: colors.brandPurple,
      backgroundColor: colors.purpleSoft,
      fontSize: 10,
      fontWeight: "900"
    },
    calendarPreviewGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7
    },
    calendarDay: {
      width: "12.9%",
      minHeight: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      gap: 3
    },
    calendarDayToday: {
      backgroundColor: colors.brandPurple,
      borderColor: colors.brandPurple
    },
    calendarDayExam: {
      borderColor: `${colors.brandCoral}77`
    },
    calendarDayText: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    calendarDayTextActive: {
      color: colors.heroText
    },
    calendarDots: {
      minHeight: 5,
      flexDirection: "row",
      gap: 2
    },
    calendarDot: {
      width: 5,
      height: 5,
      borderRadius: 3
    },
    weekPreview: {
      height: 72,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.xs
    },
    weekTrack: {
      flex: 1,
      height: "100%",
      borderRadius: radii.round,
      backgroundColor: colors.graphTrack,
      justifyContent: "flex-end",
      overflow: "hidden"
    },
    weekFill: {
      width: "100%",
      borderRadius: radii.round,
      backgroundColor: colors.brandPurple
    },
    todayHero: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 24,
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.line
    },
    todayBand: {
      position: "absolute",
      top: -24,
      right: -40,
      width: 180,
      height: 82,
      borderRadius: 28,
      backgroundColor: `${colors.brandBlue}18`,
      transform: [{ rotate: "22deg" }]
    },
    todayTitle: {
      color: colors.ink,
      fontSize: 20,
      lineHeight: 25,
      fontWeight: "900"
    },
    todayMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    todayActions: {
      flexDirection: "row",
      gap: spacing.sm
    },
    secondaryAction: {
      flex: 1,
      minHeight: 44,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface
    },
    primaryAction: {
      flex: 1,
      minHeight: 44,
      borderRadius: radii.round,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandCoral
    },
    actionText: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: "900"
    },
    primaryActionText: {
      color: colors.heroText,
      fontSize: 12,
      fontWeight: "900"
    },
    metricRow: {
      flexDirection: "row",
      gap: spacing.xs
    },
    insightMini: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(245,158,11,0.28)",
      backgroundColor: colors.warningSurface,
      padding: spacing.sm
    },
    widgetPreviewShell: {
      position: "relative",
      overflow: "hidden",
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderColor: `${colors.brandBlue}24`
    },
    widgetShellBand: {
      position: "absolute",
      top: -48,
      right: -60,
      width: 240,
      height: 115,
      borderRadius: 42,
      backgroundColor: `${colors.brandBlue}14`,
      transform: [{ rotate: "24deg" }]
    },
    widgetPreviewKicker: {
      color: colors.brandPurple,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    widgetPreviewTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    chipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    widgetStyleChip: {
      minHeight: 34,
      borderRadius: radii.round,
      paddingHorizontal: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.line
    },
    widgetStyleChipActive: {
      backgroundColor: colors.blueSoft,
      borderColor: colors.brandBlue
    },
    styleSwatch: {
      width: 12,
      height: 12,
      borderRadius: 6
    },
    widgetChipText: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    widgetChipTextActive: {
      color: colors.ink
    },
    focusChip: {
      minHeight: 34,
      borderRadius: radii.round,
      paddingHorizontal: spacing.sm,
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.line
    },
    focusChipActive: {
      backgroundColor: colors.brandPurple,
      borderColor: colors.brandPurple
    },
    focusChipText: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "900"
    },
    focusChipTextActive: {
      color: colors.heroText
    },
    widgetHeroPreview: {
      zIndex: 1
    },
    widgetConceptRow: {
      flexDirection: "row",
      gap: spacing.xs
    },
    widgetConcept: {
      flex: 1,
      minHeight: 58,
      borderRadius: 18,
      padding: spacing.xs,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.line
    },
    conceptLabel: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    conceptValue: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    paletteHero: {
      position: "relative",
      minHeight: 154,
      borderRadius: 26,
      overflow: "hidden",
      justifyContent: "flex-end",
      padding: spacing.md,
      backgroundColor: colors.surfaceAlt
    },
    paletteOrb: {
      position: "absolute",
      top: -36,
      right: -28,
      width: 160,
      height: 160,
      borderRadius: 80,
      opacity: 0.72
    },
    paletteOrbTwo: {
      position: "absolute",
      bottom: -54,
      left: -38,
      width: 180,
      height: 180,
      borderRadius: 90,
      opacity: 0.46
    },
    paletteTitle: {
      color: colors.ink,
      fontSize: 26,
      lineHeight: 31,
      fontWeight: "900"
    },
    paletteMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    paletteGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    paletteChoice: {
      width: "48%",
      minHeight: 74,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.sm,
      justifyContent: "space-between",
      backgroundColor: colors.surfaceAlt
    },
    paletteChoiceActive: {
      borderColor: colors.brandPurple,
      backgroundColor: colors.purpleSoft
    },
    paletteSwatches: {
      flexDirection: "row"
    },
    paletteSwatch: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: -6,
      borderWidth: 2,
      borderColor: colors.surface
    },
    paletteName: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    paletteNameActive: {
      color: colors.brandPurple
    },
    readyPanel: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.sm,
      backgroundColor: colors.surfaceAlt
    },
    footer: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "center"
    },
    backButton: {
      minHeight: 54,
      borderRadius: radii.round,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line
    },
    backButtonDisabled: {
      opacity: 0.48
    },
    backText: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: "900"
    },
    backTextDisabled: {
      color: colors.faint
    },
    nextButton: {
      flex: 1,
      minHeight: 54,
      borderRadius: radii.round,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      backgroundColor: colors.brandPurple,
      shadowColor: colors.brandPurple,
      shadowOpacity: 0.26,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 9 },
      elevation: 5
    },
    nextText: {
      color: colors.heroText,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900"
    }
  });
}
