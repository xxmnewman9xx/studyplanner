import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  CalendarDays,
  CheckCircle2,
  Crown,
  FileScan,
  GraduationCap,
  ListChecks,
  NotebookPen,
  Sparkles,
  Timer
} from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { AppLogo, GlassCard, WidgetPreviewCard } from "../components/AppleComponents";
import { ModeToggle } from "../components/ModeToggle";
import { AppTheme, appThemePalettes, ThemeAccent, themePalettes } from "../theme";
import { useAppTheme } from "../themeContext";
import {
  Assignment,
  UserSettings,
  WidgetBackground,
  WidgetPalette,
  WidgetPreset
} from "../models";
import { defaultSettings, defaultWidgetPresets } from "../data/defaultPlanner";
import {
  marketingCaptureAssignments,
  marketingCaptureCourses,
  marketingCaptureParseResult,
  marketingCaptureSemester
} from "../services/marketingCapture";
import { supportsSyllabusImageParsing } from "../services/syllabusParser";
import { buildStudyPlannerWidgetSnapshots } from "../services/widgetSnapshot";
import { MotionFadeUpView } from "../motion";

export type OnboardingDestination = "paywall";

type OnboardingScreenProps = {
  onFinish: (
    destination: OnboardingDestination,
    settingsPatch?: Partial<UserSettings>
  ) => void;
  initialIndex?: number;
};

type SlideId = "scan" | "review" | "calendar" | "today" | "classes" | "focus" | "widgets";

const slides: Array<{
  id: SlideId;
  eyebrow: string;
  title: string;
  copy: string;
  cta: string;
}> = [
  {
    id: "scan",
    eyebrow: "Scan",
    title: "Turn a syllabus into a draft.",
    copy: "PDFs or pasted syllabus text become organized coursework ready for review.",
    cta: "Next"
  },
  {
    id: "review",
    eyebrow: "Review",
    title: "Approve work before it touches your plan.",
    copy: "Every deadline stays visible, editable, and confirmable first.",
    cta: "Next"
  },
  {
    id: "calendar",
    eyebrow: "Calendar",
    title: "See the semester shape.",
    copy: "Workload, due days, and progress stay visible without another spreadsheet.",
    cta: "Next"
  },
  {
    id: "today",
    eyebrow: "Today",
    title: "Know what to do first.",
    copy: "One next task, a quick capture box, and progress live in the daily command center.",
    cta: "Next"
  },
  {
    id: "classes",
    eyebrow: "Classes",
    title: "Keep each course useful.",
    copy: "Open work, notes, meetings, and class progress stay grouped by course.",
    cta: "Next"
  },
  {
    id: "focus",
    eyebrow: "Focus",
    title: "Start the next task.",
    copy: "Today points to the work, then Focus logs the session and moves progress.",
    cta: "Next"
  },
  {
    id: "widgets",
    eyebrow: "Widgets",
    title: "Make the plan feel like yours.",
    copy: "Choose a theme and put real reviewed work on your Home Screen.",
    cta: "Continue to Plus"
  }
];

const themeChoices: Array<{
  label: string;
  appTheme: ThemeAccent;
  widgetPalette: WidgetPalette;
  widgetStyle: WidgetBackground;
}> = [
  { label: "Midnight Blue", appTheme: "campus", widgetPalette: "midnight", widgetStyle: "dark" },
  { label: "Ocean", appTheme: "classic", widgetPalette: "ocean", widgetStyle: "glass" },
  { label: "Graphite", appTheme: "graphite", widgetPalette: "graphite", widgetStyle: "dark" },
  { label: "Aurora", appTheme: "aura", widgetPalette: "aurora", widgetStyle: "glass" },
  { label: "Forest", appTheme: "mint", widgetPalette: "forest", widgetStyle: "glass" },
  { label: "Minimal Light", appTheme: "slate", widgetPalette: "paper", widgetStyle: "solid" }
];

const previewNow = new Date("2026-05-25T09:41:00");

export function OnboardingScreen({ onFinish, initialIndex = 0 }: OnboardingScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const [index, setIndex] = useState(() => normalizedIndex(initialIndex));
  const [appTheme, setAppTheme] = useState<ThemeAccent>("campus");
  const [widgetPalette, setWidgetPalette] = useState<WidgetPalette>("ocean");
  const [widgetStyle, setWidgetStyle] = useState<WidgetBackground>("glass");
  const slide = slides[index] ?? slides[0]!;
  const isFinal = index === slides.length - 1;

  useEffect(() => {
    setIndex(normalizedIndex(initialIndex));
  }, [initialIndex]);

  const widgetPresets = useMemo<WidgetPreset[]>(
    () =>
      defaultWidgetPresets.map((preset, presetIndex) =>
        presetIndex <= 1
          ? {
              ...preset,
              background: widgetStyle,
              palette: widgetPalette,
              themePackId: appTheme
            }
          : preset
      ),
    [appTheme, widgetPalette, widgetStyle]
  );
  const widgetSnapshots = useMemo(
    () =>
      buildStudyPlannerWidgetSnapshots({
        semester: marketingCaptureSemester,
        courses: marketingCaptureCourses,
        assignments: marketingCaptureAssignments,
        parsedImports: [],
        settings: {
          ...defaultSettings,
          appTheme,
          selectedTheme: widgetPalette,
          defaultWidgetStyle: widgetStyle
        },
        widgetPresets,
        demoMode: false,
        now: previewNow
      }),
    [appTheme, widgetPalette, widgetPresets, widgetStyle]
  );

  const finish = () => {
    onFinish("paywall", {
      appTheme,
      selectedTheme: widgetPalette,
      defaultWidgetStyle: widgetStyle
    });
  };

  const continueFlow = () => {
    if (!isFinal) {
      setIndex((current) => Math.min(slides.length - 1, current + 1));
      return;
    }

    finish();
  };
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.screenContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <AppLogo size={38} showWordmark />
          <ModeToggle compact />
        </View>

        <MotionFadeUpView trigger={index}>
        <GlassCard tone="hero" style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              {slide.id === "scan" ? <FileScan color={colors.heroText} size={22} /> : null}
              {slide.id === "review" ? <ListChecks color={colors.heroText} size={22} /> : null}
              {slide.id === "calendar" ? <CalendarDays color={colors.heroText} size={22} /> : null}
              {slide.id === "today" ? <NotebookPen color={colors.heroText} size={22} /> : null}
              {slide.id === "classes" ? <GraduationCap color={colors.heroText} size={22} /> : null}
              {slide.id === "focus" ? <Timer color={colors.heroText} size={22} /> : null}
              {slide.id === "widgets" ? <Sparkles color={colors.heroText} size={22} /> : null}
            </View>
            <Text style={styles.stepText}>{index + 1} / {slides.length}</Text>
          </View>
          <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.copy}>{slide.copy}</Text>
        </GlassCard>
        </MotionFadeUpView>

        <MotionFadeUpView key={slide.id} trigger={index} style={styles.previewStage}>
          {slide.id === "scan" ? <ScanPreview styles={styles} /> : null}
          {slide.id === "review" ? <ReviewPreview styles={styles} /> : null}
          {slide.id === "calendar" ? <CalendarPreview styles={styles} /> : null}
          {slide.id === "today" ? <TodayPreview styles={styles} /> : null}
          {slide.id === "classes" ? <ClassesPreview styles={styles} /> : null}
          {slide.id === "focus" ? <FocusPreview styles={styles} /> : null}
          {slide.id === "widgets" ? (
            <WidgetsPreview
              styles={styles}
              appTheme={appTheme}
              widgetPalette={widgetPalette}
              widgetStyle={widgetStyle}
              widgetSnapshot={widgetSnapshots.upcoming}
              onSelectTheme={(choice) => {
                setAppTheme(choice.appTheme);
                setWidgetPalette(choice.widgetPalette);
                setWidgetStyle(choice.widgetStyle);
              }}
            />
          ) : null}
        </MotionFadeUpView>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.stepRail}>
          {slides.map((item, itemIndex) => (
            <View
              key={item.id}
              style={[styles.stepDot, itemIndex === index ? styles.stepDotActive : null]}
            />
          ))}
        </View>
        <AppButton
          label={slide.cta}
          icon={isFinal ? Crown : undefined}
          onPress={continueFlow}
        />
      </View>
    </View>
  );
}

function ScanPreview({ styles }: { styles: ReturnType<typeof createStyles> }) {
  const imageParsingAvailable = supportsSyllabusImageParsing();
  const methods = imageParsingAvailable
    ? ["Scan paper", "Upload PDF", "Paste text"]
    : ["Upload PDF", "Paste text", "Review draft"];
  return (
    <GlassCard style={styles.appPreviewCard}>
      <View style={styles.appPreviewHeader}>
        <View>
          <Text style={styles.appPreviewKicker}>Scan</Text>
          <Text style={styles.appPreviewTitle}>Add syllabus</Text>
        </View>
        <View style={styles.appPreviewBadge}>
          <Text style={styles.appPreviewBadgeText}>Sample</Text>
        </View>
      </View>
      <View style={styles.methodGrid}>
        {methods.map((method) => (
          <View key={method} style={styles.methodChip}>
            <Text style={styles.methodText}>{method}</Text>
          </View>
        ))}
      </View>
      <View style={styles.previewPanel}>
        <View style={styles.previewRow}>
          <View style={styles.previewDot}><FileScan color="#FFFFFF" size={13} /></View>
          <Text style={styles.previewText}>{marketingCaptureParseResult.sourceName}</Text>
        </View>
        <View style={styles.previewRow}>
          <View style={[styles.previewDot, styles.previewDotReview]}><CheckCircle2 color="#FFFFFF" size={13} /></View>
          <Text style={styles.previewText}>{marketingCaptureParseResult.assignments.length} deadlines found for review</Text>
        </View>
      </View>
    </GlassCard>
  );
}

function ReviewPreview({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <GlassCard style={styles.appPreviewCard}>
      <View style={styles.appPreviewHeader}>
        <View>
          <Text style={styles.appPreviewKicker}>Review</Text>
          <Text style={styles.appPreviewTitle}>Confirm before adding</Text>
        </View>
        <View style={styles.appPreviewBadge}>
          <Text style={styles.appPreviewBadgeText}>Sample</Text>
        </View>
      </View>
      <View style={styles.reviewList}>
        {marketingCaptureParseResult.assignments.slice(0, 4).map((assignment) => (
          <ReviewRow key={assignment.id} assignment={assignment} styles={styles} />
        ))}
      </View>
    </GlassCard>
  );
}

function TodayPreview({ styles }: { styles: ReturnType<typeof createStyles> }) {
  const next = marketingCaptureAssignments[0]!;
  const nextCourse = marketingCaptureCourses.find((course) => course.id === next.courseId);
  const weekItems = marketingCaptureAssignments.slice(1, 4);

  return (
    <GlassCard style={styles.appPreviewCard}>
      <View style={styles.appPreviewHeader}>
        <View>
          <Text style={styles.appPreviewKicker}>Today</Text>
          <Text style={styles.appPreviewTitle}>Next due item</Text>
        </View>
        <View style={styles.appPreviewBadge}>
          <Text style={styles.appPreviewBadgeText}>Clear</Text>
        </View>
      </View>
      <View style={styles.todayHero}>
        <Text style={styles.todayClass}>{nextCourse?.code || "Class"}</Text>
        <Text style={styles.todayTitle}>{next.title}</Text>
        <Text style={styles.todayMeta}>{dueShort(next.dueAt)} · {next.estimatedMinutes || 45} min</Text>
      </View>
      <View style={styles.weekList}>
        {weekItems.map((assignment) => {
          const course = marketingCaptureCourses.find((item) => item.id === assignment.courseId);
          return (
            <View key={assignment.id} style={styles.weekRow}>
              <View style={[styles.courseDot, { backgroundColor: course?.color || "#2F80ED" }]} />
              <Text style={styles.weekText} numberOfLines={1}>{assignment.title}</Text>
              <Text style={styles.weekDue}>{dueShort(assignment.dueAt)}</Text>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

function CalendarPreview({ styles }: { styles: ReturnType<typeof createStyles> }) {
  const weekItems = marketingCaptureAssignments.slice(0, 5);
  const totalMinutes = weekItems.reduce((sum, item) => sum + (item.estimatedMinutes || 30), 0);
  const doneCount = marketingCaptureAssignments.filter((item) => item.status === "done").length;

  return (
    <GlassCard style={styles.appPreviewCard}>
      <View style={styles.appPreviewHeader}>
        <View>
          <Text style={styles.appPreviewKicker}>Calendar</Text>
          <Text style={styles.appPreviewTitle}>Week at a glance</Text>
        </View>
        <View style={styles.appPreviewBadge}>
          <Text style={styles.appPreviewBadgeText}>Sample</Text>
        </View>
      </View>
      <View style={styles.calendarPreviewGrid}>
        {weekItems.map((assignment, index) => {
          const course = marketingCaptureCourses.find((item) => item.id === assignment.courseId);
          const height = Math.max(18, Math.min(74, Math.round(((assignment.estimatedMinutes || 30) / 180) * 74)));
          return (
            <View key={assignment.id} style={styles.calendarDay}>
              <View style={styles.calendarTrack}>
                <View style={[styles.calendarBar, { height, backgroundColor: course?.color || "#2F80ED" }]} />
              </View>
              <Text style={styles.calendarDayLabel}>{["M", "T", "W", "T", "F"][index]}</Text>
              <Text style={styles.calendarDayCount}>1</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.progressPreviewRow}>
        <PreviewStat label="Progress" value={`${Math.round((doneCount / Math.max(marketingCaptureAssignments.length, 1)) * 100)}%`} styles={styles} />
        <PreviewStat label="Load" value={formatHours(totalMinutes)} styles={styles} />
        <PreviewStat label="Open" value={String(marketingCaptureAssignments.length - doneCount)} styles={styles} />
      </View>
    </GlassCard>
  );
}

function ClassesPreview({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <GlassCard style={styles.appPreviewCard}>
      <View style={styles.appPreviewHeader}>
        <View>
          <Text style={styles.appPreviewKicker}>Classes</Text>
          <Text style={styles.appPreviewTitle}>Course hubs</Text>
        </View>
        <View style={styles.appPreviewBadge}>
          <Text style={styles.appPreviewBadgeText}>Sample</Text>
        </View>
      </View>
      <View style={styles.classPreviewList}>
        {marketingCaptureCourses.slice(0, 3).map((course) => {
          const courseAssignments = marketingCaptureAssignments.filter((item) => item.courseId === course.id);
          const done = courseAssignments.filter((item) => item.status === "done").length;
          return (
            <View key={course.id} style={styles.classPreviewRow}>
              <View style={[styles.classPreviewIcon, { backgroundColor: course.color || "#2F80ED" }]} />
              <View style={styles.classPreviewCopy}>
                <Text style={styles.classPreviewTitle}>{course.code}</Text>
                <Text style={styles.classPreviewMeta} numberOfLines={1}>{course.name}</Text>
              </View>
              <Text style={styles.classPreviewCount}>{courseAssignments.length - done} open</Text>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}

function FocusPreview({ styles }: { styles: ReturnType<typeof createStyles> }) {
  const assignment = marketingCaptureAssignments[0]!;
  const course = marketingCaptureCourses.find((item) => item.id === assignment.courseId);

  return (
    <GlassCard style={styles.appPreviewCard}>
      <View style={styles.appPreviewHeader}>
        <View>
          <Text style={styles.appPreviewKicker}>Focus</Text>
          <Text style={styles.appPreviewTitle}>25-minute block</Text>
        </View>
        <View style={styles.appPreviewBadge}>
          <Text style={styles.appPreviewBadgeText}>Sample</Text>
        </View>
      </View>
      <View style={styles.focusPreviewStage}>
        <View style={styles.focusPreviewRing}>
          <Text style={styles.focusPreviewTime}>25:00</Text>
          <Text style={styles.focusPreviewState}>Ready</Text>
        </View>
        <Text style={styles.focusPreviewKicker}>Focusing on</Text>
        <Text style={styles.focusPreviewTitleText} numberOfLines={2}>{assignment.title}</Text>
        <Text style={styles.focusPreviewMeta}>{course?.code || "Class"} · logs progress when complete</Text>
      </View>
    </GlassCard>
  );
}

function WidgetsPreview({
  styles,
  appTheme,
  widgetPalette,
  widgetStyle,
  widgetSnapshot,
  onSelectTheme
}: {
  styles: ReturnType<typeof createStyles>;
  appTheme: ThemeAccent;
  widgetPalette: WidgetPalette;
  widgetStyle: WidgetBackground;
  widgetSnapshot: ReturnType<typeof buildStudyPlannerWidgetSnapshots>["upcoming"];
  onSelectTheme: (choice: (typeof themeChoices)[number]) => void;
}) {
  return (
    <GlassCard style={styles.appPreviewCard}>
      <View style={styles.appPreviewHeader}>
        <View>
          <Text style={styles.appPreviewKicker}>Home Screen</Text>
          <Text style={styles.appPreviewTitle}>Upcoming widget</Text>
        </View>
        <View style={styles.appPreviewBadge}>
          <Text style={styles.appPreviewBadgeText}>Sample</Text>
        </View>
      </View>
      <WidgetPreviewCard
        title={widgetSnapshot.headline}
        value={widgetSnapshot.value}
        detail={widgetSnapshot.detail}
        background={widgetStyle}
        palette={widgetPalette}
        size="medium"
        type="due_next"
        items={widgetSnapshot.items}
        nativeMode
        nativeAccentColor={widgetSnapshot.accentColor}
        nativeBackgroundColor={widgetSnapshot.backgroundColor}
        nativeSignalLabel={widgetSnapshot.signalLabel}
        nativeMetricLabel={widgetSnapshot.metricLabel}
        nativeNextLabel={widgetSnapshot.nextLabel}
        nativeTimelineLabel={widgetSnapshot.timelineLabel}
        nativeProgress={widgetSnapshot.progress}
        footnote={widgetSnapshot.footnote}
        semesterName={widgetSnapshot.semesterName}
        style={styles.widgetPreview}
      />
      <View style={styles.themeChoiceGrid}>
        {themeChoices.map((choice) => {
          const active =
            choice.appTheme === appTheme &&
            choice.widgetPalette === widgetPalette &&
            choice.widgetStyle === widgetStyle;
          const appSwatches = appThemePalettes[choice.appTheme].swatches;
          const widgetSwatches = themePalettes[choice.widgetPalette];
          return (
            <TouchableOpacity
              key={choice.label}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.themeChoice, active ? styles.themeChoiceActive : null]}
              onPress={() => onSelectTheme(choice)}
            >
              <View style={styles.themeSwatches}>
                {[appSwatches[0], widgetSwatches[1], widgetSwatches[2]].map((color) => (
                  <View key={`${choice.label}-${color}`} style={[styles.themeSwatch, { backgroundColor: color }]} />
                ))}
              </View>
              <Text style={styles.themeChoiceLabel}>{choice.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </GlassCard>
  );
}

function PreviewStat({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.previewStat}>
      <Text style={styles.previewStatValue}>{value}</Text>
      <Text style={styles.previewStatLabel}>{label}</Text>
    </View>
  );
}

function ReviewRow({
  assignment,
  styles
}: {
  assignment: Assignment;
  styles: ReturnType<typeof createStyles>;
}) {
  const course = marketingCaptureCourses.find((item) => item.id === assignment.courseId);
  return (
    <View style={styles.reviewRow}>
      <View style={[styles.courseDot, { backgroundColor: course?.color || "#2F80ED" }]} />
      <View style={styles.reviewCopy}>
        <Text style={styles.reviewTitle} numberOfLines={1}>{assignment.title}</Text>
        <Text style={styles.reviewMeta}>{course?.code || "Class"} · {dueShort(assignment.dueAt)}</Text>
      </View>
      <View style={styles.reviewAction}><Text style={styles.reviewActionText}>Confirm</Text></View>
    </View>
  );
}

function normalizedIndex(value: number) {
  return Math.max(0, Math.min(slides.length - 1, value));
}

function dueShort(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Due soon";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatHours(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.canvas
    },
    scroll: {
      flex: 1
    },
    screenContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.lg,
      gap: spacing.md
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    heroCard: {
      gap: spacing.sm,
      padding: spacing.md,
      overflow: "hidden"
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    heroIcon: {
      width: 42,
      height: 42,
      borderRadius: radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.12)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)"
    },
    stepText: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    eyebrow: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    title: {
      color: colors.heroText,
      fontSize: 28,
      lineHeight: 33,
      fontWeight: "900",
      letterSpacing: 0
    },
    copy: {
      color: colors.heroMuted,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "700"
    },
    previewStage: {
      gap: spacing.md
    },
    appPreviewCard: {
      padding: spacing.md,
      gap: spacing.sm
    },
    appPreviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm
    },
    appPreviewKicker: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    appPreviewTitle: {
      color: colors.ink,
      fontSize: 20,
      lineHeight: 25,
      fontWeight: "900"
    },
    appPreviewBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
      borderRadius: radii.round,
      backgroundColor: colors.accentSoft
    },
    appPreviewBadgeText: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 15,
      fontWeight: "900"
    },
    methodGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    methodChip: {
      flexGrow: 1,
      flexBasis: "30%",
      minHeight: 44,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xs
    },
    methodText: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      textAlign: "center"
    },
    previewPanel: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      padding: spacing.sm,
      gap: spacing.xs
    },
    previewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    previewDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent
    },
    previewDotReview: {
      backgroundColor: colors.green
    },
    previewText: {
      flex: 1,
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    reviewList: {
      gap: spacing.xs
    },
    reviewRow: {
      minHeight: 62,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 9,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    courseDot: {
      width: 10,
      height: 10,
      borderRadius: 5
    },
    reviewCopy: {
      flex: 1,
      minWidth: 0
    },
    reviewTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900"
    },
    reviewMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    reviewAction: {
      minHeight: 30,
      borderRadius: radii.round,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent
    },
    reviewActionText: {
      color: colors.heroText,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    todayHero: {
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceTint,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      padding: spacing.md,
      gap: 5
    },
    todayClass: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    todayTitle: {
      ...typography.h2
    },
    todayMeta: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    weekList: {
      gap: spacing.xs
    },
    weekRow: {
      minHeight: 38,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    weekText: {
      flex: 1,
      minWidth: 0,
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    weekDue: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    calendarPreviewGrid: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.xs,
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.sm
    },
    calendarDay: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      gap: 5
    },
    calendarTrack: {
      width: "100%",
      height: 78,
      borderRadius: radii.lg,
      backgroundColor: colors.surfaceAlt,
      justifyContent: "flex-end",
      overflow: "hidden"
    },
    calendarBar: {
      width: "100%",
      borderRadius: radii.lg
    },
    calendarDayLabel: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    calendarDayCount: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 15,
      fontWeight: "900"
    },
    progressPreviewRow: {
      flexDirection: "row",
      gap: spacing.xs
    },
    previewStat: {
      flex: 1,
      minHeight: 54,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center"
    },
    previewStatValue: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 21,
      fontWeight: "900"
    },
    previewStatLabel: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    classPreviewList: {
      gap: spacing.xs
    },
    classPreviewRow: {
      minHeight: 58,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    classPreviewIcon: {
      width: 36,
      height: 36,
      borderRadius: radii.lg
    },
    classPreviewCopy: {
      flex: 1,
      minWidth: 0
    },
    classPreviewTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900"
    },
    classPreviewMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    classPreviewCount: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    focusPreviewStage: {
      borderRadius: radii.xl,
      backgroundColor: theme.isDark ? "#071827" : "#0F2940",
      padding: spacing.md,
      alignItems: "center",
      gap: 6,
      overflow: "hidden"
    },
    focusPreviewRing: {
      width: 132,
      height: 132,
      borderRadius: 66,
      borderWidth: 9,
      borderColor: "#38BDF8",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.06)"
    },
    focusPreviewTime: {
      color: "#FFFFFF",
      fontSize: 31,
      lineHeight: 37,
      fontWeight: "400"
    },
    focusPreviewState: {
      color: "#B9E7F6",
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    focusPreviewKicker: {
      marginTop: spacing.xs,
      color: "#B9E7F6",
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    focusPreviewTitleText: {
      color: "#FFFFFF",
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900",
      textAlign: "center"
    },
    focusPreviewMeta: {
      color: "#B9E7F6",
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800",
      textAlign: "center"
    },
    widgetPreview: {
      alignSelf: "center",
      width: "100%"
    },
    themeChoiceGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    themeChoice: {
      flexBasis: "31%",
      flexGrow: 1,
      minHeight: 74,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.xs,
      gap: 6
    },
    themeChoiceActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    themeSwatches: {
      flexDirection: "row",
      gap: 4
    },
    themeSwatch: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.7)"
    },
    themeChoiceLabel: {
      color: colors.ink,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    bottomBar: {
      gap: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.line,
      backgroundColor: colors.canvas,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md
    },
    stepRail: {
      height: 18,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.xs
    },
    stepDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.lineStrong
    },
    stepDotActive: {
      width: 28,
      backgroundColor: colors.accent
    }
  });
}
