import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  LogBox,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { File, Paths } from "expo-file-system";
import {
  CalendarDays,
  Crown,
  FileScan,
  GraduationCap,
  NotebookPen,
  Sparkles,
  Timer,
  TrendingUp
} from "lucide-react-native";

import {
  Assignment,
  AssignmentKind,
  AssignmentStatus,
  Course,
  FocusSession,
  GradeItem,
  NavTab,
  ParsedImport,
  ParsedItem,
  PlannerData,
  Semester,
  StudentLifeFeature,
  StudentLifeMemory,
  StudyNote,
  SyllabusParseResult,
  UserSettings,
  WidgetBackground,
  WidgetColorSource,
  WidgetDataMode,
  WidgetPalette,
  WidgetPreset,
  WidgetStudioContentType,
  WidgetStudioStyle,
  WatchPreviewStyle
} from "./src/models";
import { AppTheme, ThemeAccent, ThemeMode } from "./src/theme";
import { AppThemeProvider, useAppTheme } from "./src/themeContext";
import { AppLogo } from "./src/components/AppleComponents";
import { ModeToggle } from "./src/components/ModeToggle";
import { SPBottomTabBar } from "./src/components/StudyPlannerAppleBoard";
import {
  defaultAssignments,
  defaultCourses,
  defaultFocusSessions,
  defaultGradeItems,
  defaultSemester,
  defaultSettings,
  defaultWidgetPresets
} from "./src/data/defaultPlanner";
import { normalizeStudioCustomization } from "./src/customization";
import { OnboardingDestination, OnboardingScreen } from "./src/screens/OnboardingScreen";
import { TodayScreen, ImportHandoffSummary } from "./src/screens/TodayScreen";
import { ImportScreen } from "./src/screens/ImportScreen";
import { CoursesScreen } from "./src/screens/CoursesScreen";
import { GradesScreen } from "./src/screens/GradesScreen";
import { FocusScreen } from "./src/screens/FocusScreen";
import { UpgradeScreen } from "./src/screens/UpgradeScreen";
import { AssignmentDetailScreen } from "./src/screens/AssignmentDetailScreen";
import { PlanScreen } from "./src/screens/PlanScreen";
import { MoreScreen } from "./src/screens/MoreScreen";
import { NotesScreen } from "./src/screens/NotesScreen";
import {
  completeAssignment,
  convertNoteToTask,
  getRecommendedFocusDuration,
  isValidDateInput,
  isValidDeadline,
  applyLocale,
  saveWidgetPreset as saveWidgetPresetState
} from "./src/logic/planner";
import {
  buildStudentLifeContext,
  ensureStudentLifeMemory,
  recordStudentLifeAssignmentCompleted,
  recordStudentLifeFeatureVisit,
  recordStudentLifeFocusSession,
  recordStudentLifeForecastSnapshot,
  recordStudentLifeNoteConverted,
  recordStudentLifeNoteCreated,
  recordStudentLifeNotePinned,
  recordStudentLifeTopAction,
  recordStudentLifeWatchSignal,
  recordStudentLifeWidgetRecommended,
  recordStudentLifeWidgetSaved,
  seedStudentLifeMemoryForAge
} from "./src/logic/studentLifeDepth";
import { scheduleSmartReminders } from "./src/services/reminders";
import { syncAssignmentsToDeviceCalendar } from "./src/services/calendarSync";
import { loadJson, saveJson } from "./src/services/storage";
import { SubscriptionProvider, useSubscription } from "./src/services/subscriptions";
import { recordReviewEvent } from "./src/services/reviewPrompt";
import { syncStudyPlannerWidgets } from "./src/services/widgetSnapshot";
import type { WidgetSyncStatus } from "./src/services/widgetSnapshot";
import { normalizeParsedItems } from "./src/services/parserContract";
import {
  buildCanonicalWidgetPreset,
  defaultDataModeForWidgetKind,
  ensureCanonicalWidgetPresets,
  isNativeWidgetPreset,
  widgetKindForType
} from "./src/widgets/widgetPresets";
import { I18nProvider, supportedLocales, useI18n, type SupportedLocale } from "./src/i18n";
import {
  getMarketingCaptureInitialTab,
  getMarketingCaptureScrollY,
  marketingCaptureAssignments,
  marketingCaptureCourses,
  marketingCaptureEnabled,
  marketingCaptureGradeItems,
  marketingCaptureSemester,
  type MarketingCaptureScreen
} from "./src/services/marketingCapture";

LogBox.ignoreLogs(["SafeAreaView has been deprecated"]);

const plannerStorageKey = "study-planner-data-v3";
const marketingCaptureTabFileName = "studyplanner-capture-tab.json";
const simulatorCaptureFileRoutingEnabled = process.env.EXPO_PUBLIC_SIM_QA_CAPTURE === "1";
const simulatorLoadingDelayMs = simulatorCaptureFileRoutingEnabled
  ? Math.max(0, Number(process.env.EXPO_PUBLIC_SIM_QA_LOADING_DELAY_MS || 0))
  : 0;

const proTabs: Array<{
  id: NavTab;
  labelKey: string;
  icon: React.ComponentType<{ color: string; size: number }>;
}> = [
  { id: "today", labelKey: "tabs.today", icon: CalendarDays },
  { id: "import", labelKey: "tabs.scan", icon: FileScan },
  { id: "plan", labelKey: "tabs.calendar", icon: CalendarDays },
  { id: "courses", labelKey: "tabs.classes", icon: GraduationCap },
  { id: "notes", labelKey: "tabs.notes", icon: NotebookPen },
  { id: "more", labelKey: "tabs.widgets", icon: Sparkles }
];

const mobilePrimaryTabIds = new Set<NavTab>(["today", "import", "plan", "courses", "notes", "more"]);
const moreGroupTabIds = new Set<NavTab>(["more", "grades", "subscribe"]);

function mobileTabLabel(tab: NavTab, fallback: string, t: (key: string, fallback?: string) => string) {
  if (tab === "plan") return "Forecast";
  if (tab === "courses") return "Semester";
  return tab === "more" ? t("tabs.widgets", "Widgets") : fallback;
}

type CaptureRoute = {
  tab: NavTab | null;
  screen?: MarketingCaptureScreen;
  importSourceMode?: "camera" | "file" | "paste";
  onboardingIndex?: number;
  appTheme?: ThemeAccent;
  widgetBackground?: WidgetBackground;
  widgetPalette?: WidgetPalette;
  widgetDataMode?: WidgetDataMode;
  widgetType?: WidgetPreset["type"];
  widgetSize?: WidgetPreset["size"];
  widgetLayout?: WidgetPreset["layout"];
  workloadState?: "standard" | "clean" | "urgent";
  depthAgeDays?: number;
  emptyPlanner?: boolean;
  classColor?: string;
  secondaryAccent?: string;
  riskColor?: string;
  focusColor?: string;
  activityColor?: string;
  widgetStudioStyle?: WidgetStudioStyle;
  widgetColorSource?: WidgetColorSource;
  widgetCustomColor?: string;
  watchPreviewStyle?: WatchPreviewStyle;
  hardPaywall?: boolean;
  themeMode?: ThemeMode;
  locale?: SupportedLocale;
};

function parseCaptureRoute(raw: string): CaptureRoute {
  try {
    const value = JSON.parse(raw) as {
      tab?: unknown;
      screen?: unknown;
      importSourceMode?: unknown;
      onboardingIndex?: unknown;
      appTheme?: unknown;
      widgetBackground?: unknown;
      widgetPalette?: unknown;
      widgetDataMode?: unknown;
      widgetType?: unknown;
      widgetSize?: unknown;
      widgetLayout?: unknown;
      workloadState?: unknown;
      depthAgeDays?: unknown;
      emptyPlanner?: unknown;
      classColor?: unknown;
      secondaryAccent?: unknown;
      riskColor?: unknown;
      focusColor?: unknown;
      activityColor?: unknown;
      widgetStudioStyle?: unknown;
      widgetColorSource?: unknown;
      widgetCustomColor?: unknown;
      watchPreviewStyle?: unknown;
      hardPaywall?: unknown;
      themeMode?: unknown;
      locale?: unknown;
    };
    return {
      tab: isCaptureNavTab(value.tab) ? value.tab : null,
      screen: isCaptureScreen(value.screen) ? value.screen : undefined,
      importSourceMode: isCaptureImportSourceMode(value.importSourceMode) ? value.importSourceMode : undefined,
      onboardingIndex: isCaptureOnboardingIndex(value.onboardingIndex) ? value.onboardingIndex : undefined,
      appTheme: isCaptureThemeAccent(value.appTheme) ? value.appTheme : undefined,
      widgetBackground: isCaptureWidgetBackground(value.widgetBackground) ? value.widgetBackground : undefined,
      widgetPalette: isCaptureWidgetPalette(value.widgetPalette) ? value.widgetPalette : undefined,
      widgetDataMode: isCaptureWidgetDataMode(value.widgetDataMode) ? value.widgetDataMode : undefined,
      widgetType: isCaptureWidgetType(value.widgetType) ? value.widgetType : undefined,
      widgetSize: isCaptureWidgetSize(value.widgetSize) ? value.widgetSize : undefined,
      widgetLayout: isCaptureWidgetLayout(value.widgetLayout) ? value.widgetLayout : undefined,
      workloadState: isCaptureWorkloadState(value.workloadState) ? value.workloadState : undefined,
      depthAgeDays: isCaptureDepthAge(value.depthAgeDays) ? value.depthAgeDays : undefined,
      emptyPlanner: value.emptyPlanner === true,
      classColor: isCaptureHexColor(value.classColor) ? value.classColor : undefined,
      secondaryAccent: isCaptureHexColor(value.secondaryAccent) ? value.secondaryAccent : undefined,
      riskColor: isCaptureHexColor(value.riskColor) ? value.riskColor : undefined,
      focusColor: isCaptureHexColor(value.focusColor) ? value.focusColor : undefined,
      activityColor: isCaptureHexColor(value.activityColor) ? value.activityColor : undefined,
      widgetStudioStyle: isCaptureWidgetStudioStyle(value.widgetStudioStyle) ? value.widgetStudioStyle : undefined,
      widgetColorSource: isCaptureWidgetColorSource(value.widgetColorSource) ? value.widgetColorSource : undefined,
      widgetCustomColor: isCaptureHexColor(value.widgetCustomColor) ? value.widgetCustomColor : undefined,
      watchPreviewStyle: isCaptureWatchPreviewStyle(value.watchPreviewStyle) ? value.watchPreviewStyle : undefined,
      hardPaywall: value.hardPaywall === true,
      themeMode: isCaptureThemeMode(value.themeMode) ? value.themeMode : undefined,
      locale: isCaptureLocale(value.locale) ? value.locale : undefined
    };
  } catch {
    const trimmed = raw.trim();
    return {
      tab: isCaptureNavTab(trimmed) ? trimmed : null
    };
  }
}

function isCaptureNavTab(value: unknown): value is NavTab {
  return (
    value === "today" ||
    value === "import" ||
    value === "plan" ||
    value === "courses" ||
    value === "notes" ||
    value === "more" ||
    value === "focus" ||
    value === "grades" ||
    value === "subscribe"
  );
}

function isCaptureScreen(value: unknown): value is MarketingCaptureScreen {
  return (
    value === "processing" ||
    value === "extracted" ||
    value === "review_edit" ||
    value === "failed" ||
    value === "agenda"
  );
}

function isCaptureImportSourceMode(value: unknown): value is NonNullable<CaptureRoute["importSourceMode"]> {
  return value === "camera" || value === "file" || value === "paste";
}

function isCaptureOnboardingIndex(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6;
}

function isCaptureThemeAccent(value: unknown): value is ThemeAccent {
  return (
    value === "campus" ||
    value === "classic" ||
    value === "slate" ||
    value === "mint" ||
    value === "aura" ||
    value === "rose" ||
    value === "graphite" ||
    value === "solar"
  );
}

function isCaptureWidgetBackground(value: unknown): value is WidgetBackground {
  return value === "solid" || value === "gradient" || value === "glass" || value === "dark" || value === "light";
}

function isCaptureWidgetPalette(value: unknown): value is WidgetPalette {
  return (
    value === "sunset" ||
    value === "ocean" ||
    value === "forest" ||
    value === "lavender" ||
    value === "midnight" ||
    value === "candy" ||
    value === "minimal" ||
    value === "graphite" ||
    value === "aurora" ||
    value === "paper" ||
    value === "contrast"
  );
}

function isCaptureWidgetDataMode(value: unknown): value is WidgetDataMode {
  return (
    value === "all_classes" ||
    value === "single_class" ||
    value === "today" ||
    value === "this_week" ||
    value === "urgent_only" ||
    value === "next_up" ||
    value === "next3"
  );
}

function captureDataModeForWidget(type: WidgetPreset["type"]): WidgetDataMode {
  return defaultDataModeForWidgetKind(widgetKindForType(type));
}

function captureContentTypeForWidget(type: WidgetPreset["type"]): WidgetStudioContentType {
  if (type === "today") return "next_class";
  if (type === "week") return "heavy_week_warning";
  if (type === "class_focus") return "class_progress";
  if (type === "focus") return "focus_window";
  if (type === "needs_check") return "review_inbox_status";
  return "next_assignment";
}

function captureStudioStyleForWidget(route: CaptureRoute): WidgetStudioStyle {
  if (route.widgetStudioStyle) return route.widgetStudioStyle;
  if (route.widgetLayout === "compact") return "compact";
  if (route.widgetBackground === "glass") return "glass";
  if (route.widgetBackground === "solid" || route.widgetBackground === "dark") return "color_card";
  return "clean";
}

function shouldApplyOnboardingWidgetTheme(preset: WidgetPreset) {
  return isNativeWidgetPreset(preset);
}

function applyOnboardingWidgetTheme(presets: WidgetPreset[], settingsPatch?: Partial<UserSettings>) {
  const background = settingsPatch?.defaultWidgetStyle;
  const palette = settingsPatch?.selectedTheme;
  if (!isCaptureWidgetBackground(background) || !isCaptureWidgetPalette(palette)) return presets;

  const timestamp = new Date().toISOString();
  return ensureCanonicalWidgetPresets(presets).map((preset) =>
    shouldApplyOnboardingWidgetTheme(preset)
      ? {
          ...preset,
          background,
          palette,
          themePackId: settingsPatch?.appTheme || preset.themePackId,
          lastSyncedAt: timestamp,
          updatedAt: timestamp
        }
      : preset
  );
}

function isCaptureWidgetType(value: unknown): value is WidgetPreset["type"] {
  return (
    value === "due_next" ||
    value === "today" ||
    value === "needs_check" ||
    value === "week" ||
    value === "class_focus" ||
    value === "empty" ||
    value === "focus" ||
    value === "streak"
  );
}

function isCaptureWidgetSize(value: unknown): value is WidgetPreset["size"] {
  return (
    value === "small" ||
    value === "medium" ||
    value === "large" ||
    value === "lock_round" ||
    value === "lock_inline" ||
    value === "lock_rect"
  );
}

function isCaptureWidgetLayout(value: unknown): value is WidgetPreset["layout"] {
  return (
    value === "compact" ||
    value === "list" ||
    value === "ring" ||
    value === "calendar" ||
    value === "grid" ||
    value === "progress" ||
    value === "timeline" ||
    value === "strip" ||
    value === "summary" ||
    value === "next_task"
  );
}

function isCaptureWorkloadState(value: unknown): value is NonNullable<CaptureRoute["workloadState"]> {
  return value === "standard" || value === "clean" || value === "urgent";
}

function isCaptureDepthAge(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 120;
}

function isCaptureHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function isCaptureWidgetStudioStyle(value: unknown): value is WidgetStudioStyle {
  return value === "clean" || value === "glass" || value === "color_card" || value === "compact";
}

function isCaptureWidgetColorSource(value: unknown): value is WidgetColorSource {
  return value === "class" || value === "urgency" || value === "custom";
}

function isCaptureWatchPreviewStyle(value: unknown): value is WatchPreviewStyle {
  return value === "rings" || value === "cards" || value === "compact";
}

function isCaptureThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark";
}

function isCaptureLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && supportedLocales.includes(value as SupportedLocale);
}

function routeTabFromUrl(url: string): NavTab | null {
  if (url.includes("expo-development-client")) return null;

  if (url.includes("widgets") || url.includes("widget-studio")) return "more";
  if (url.includes("scan") || url.includes("import")) return "import";
  if (url.includes("calendar") || url.includes("plan")) return "plan";
  if (url.includes("classes") || url.includes("courses")) return "courses";
  if (url.includes("notes")) return "notes";
  if (url.includes("focus")) return "focus";
  if (url.includes("grades")) return "grades";
  if (url.includes("subscribe") || url.includes("paywall")) return "subscribe";
  if (url.includes("today")) return "today";
  return null;
}

function scrollYForCaptureScreen(screen: MarketingCaptureScreen | undefined) {
  if (screen === "processing" || screen === "failed") return 620;
  if (screen === "extracted") return 520;
  if (screen === "review_edit") return 820;
  if (screen === "agenda") return 560;
  return null;
}

function assignmentsForCaptureWorkload(state: CaptureRoute["workloadState"]) {
  if (state === "clean") {
    const cleanDates = ["2026-06-03T23:59:00", "2026-06-05T17:00:00"];
    return marketingCaptureAssignments.slice(0, 2).map((assignment, index) => ({
      ...assignment,
      dueAt: cleanDates[index] || assignment.dueAt,
      priority: "medium" as Assignment["priority"],
      status: "not_started" as Assignment["status"],
      needsReview: false,
      duplicateOf: undefined,
      confidence: 0.96
    }));
  }

  if (state === "urgent") {
    const urgentDates = [
      "2026-05-25T11:30:00",
      "2026-05-25T17:00:00",
      "2026-05-25T23:59:00",
      "2026-05-26T09:00:00",
      "2026-05-26T20:00:00"
    ];
    return marketingCaptureAssignments.map((assignment, index) => ({
      ...assignment,
      dueAt: urgentDates[index] || assignment.dueAt,
      priority: "high" as Assignment["priority"],
      status: index === 0 ? "in_progress" as Assignment["status"] : "not_started" as Assignment["status"],
      needsReview: false,
      duplicateOf: undefined,
      confidence: 0.94
    }));
  }

  return marketingCaptureAssignments;
}

export default function App() {
  return (
    <AppThemeProvider>
      <I18nProvider>
        <SubscriptionProvider>
          <AppContent />
        </SubscriptionProvider>
      </I18nProvider>
    </AppThemeProvider>
  );
}

function AppContent() {
  const { theme, setAccent, setMode } = useAppTheme();
  const { t, isRTL, locale, setLocaleOverride } = useI18n();
  const { colors } = theme;
  const { width } = useWindowDimensions();
  const tablet = width >= 760;
  const styles = useMemo(() => createStyles(theme, tablet), [theme, tablet]);
  const subscription = useSubscription();
  const scrollRef = useRef<ScrollView>(null);
  const [onboarded, setOnboarded] = useState(marketingCaptureEnabled);
  const [paywallSeen, setPaywallSeen] = useState(marketingCaptureEnabled);
  const [postPaywallTab, setPostPaywallTab] = useState<NavTab>("import");
  const [activeTab, setActiveTab] = useState<NavTab>(getMarketingCaptureInitialTab());
  const [semester, setSemester] = useState(
    marketingCaptureEnabled ? marketingCaptureSemester : defaultSemester
  );
  const [courses, setCourses] = useState<Course[]>(
    marketingCaptureEnabled ? marketingCaptureCourses : []
  );
  const [assignments, setAssignments] = useState<Assignment[]>(
    marketingCaptureEnabled ? marketingCaptureAssignments : []
  );
  const [gradeItems, setGradeItems] = useState<GradeItem[]>(
    marketingCaptureEnabled ? marketingCaptureGradeItems : []
  );
  const [targetGradePercent, setTargetGradePercent] = useState(90);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [parsedImports, setParsedImports] = useState<ParsedImport[]>([]);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [widgetPresets, setWidgetPresets] = useState<WidgetPreset[]>(defaultWidgetPresets);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [studentLifeMemory, setStudentLifeMemory] = useState<StudentLifeMemory>(() => ensureStudentLifeMemory());
  const [demoMode, setDemoMode] = useState(false);
  const [importHandoff, setImportHandoff] = useState<ImportHandoffSummary | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [focusAssignmentId, setFocusAssignmentId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [nativeWidgetStatus, setNativeWidgetStatus] = useState<WidgetSyncStatus>({
    state: "idle",
    message: t("widgets.sync_after_load", "Native widgets sync after your planner loads.")
  });
  const [captureScreenOverride, setCaptureScreenOverride] = useState<MarketingCaptureScreen | undefined>();
  const [captureImportSourceMode, setCaptureImportSourceMode] = useState<CaptureRoute["importSourceMode"]>();
  const [captureScrollY, setCaptureScrollY] = useState<number | null>(null);
  const [captureOnboardingIndex, setCaptureOnboardingIndex] = useState(0);
  const [captureHardPaywall, setCaptureHardPaywall] = useState(false);

  const activeAssignments = useMemo(
    () => assignments.filter((item) => item.status !== "archived"),
    [assignments]
  );
  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId),
    [assignments, selectedAssignmentId]
  );
  const captureBypassEnabled = marketingCaptureEnabled || simulatorCaptureFileRoutingEnabled;
  const visibleTabs = proTabs;
  const bottomTabs = tablet
    ? visibleTabs
    : visibleTabs.filter((tab) => mobilePrimaryTabIds.has(tab.id));
  const systemState = useMemo(
    () => buildAppSystemState(activeAssignments, courses, parsedImports, nativeWidgetStatus, demoMode, t),
    [activeAssignments, courses, demoMode, nativeWidgetStatus, parsedImports, t]
  );
  const studentLifeContext = useMemo(
    () =>
      buildStudentLifeContext({
        memory: studentLifeMemory,
        assignments: activeAssignments,
        courses,
        notes,
        focusSessions,
        widgetPresets,
        settings
      }),
    [activeAssignments, courses, focusSessions, notes, settings, studentLifeMemory, widgetPresets]
  );

  useEffect(() => {
    if (!hydrated) return;
    setAccent(settings.appTheme || "campus");
  }, [hydrated, setAccent, settings.appTheme]);

  useEffect(() => {
    if (!hydrated) return;
    if (Platform.OS === "web") return;
    if ((typeof __DEV__ === "undefined" || !__DEV__) && !simulatorCaptureFileRoutingEnabled) return;
    if (!Paths.document) return;

    let mounted = true;
    const captureTabFile = new File(Paths.document, marketingCaptureTabFileName);

    captureTabFile.text()
      .then((raw) => {
        if (!mounted) return;
        const requestedRoute = parseCaptureRoute(raw);
        const requestedTab = requestedRoute.tab;
        setLocaleOverride(requestedRoute.locale);
        if (requestedRoute.onboardingIndex !== undefined) {
          setCaptureOnboardingIndex(requestedRoute.onboardingIndex);
          setCaptureHardPaywall(false);
          if (requestedRoute.themeMode) setMode(requestedRoute.themeMode);
          setOnboarded(false);
          setPaywallSeen(false);
          return;
        }
        if (!requestedTab) return;

        setOnboarded(true);
        setPaywallSeen(true);
        setCaptureHardPaywall(Boolean(requestedRoute.hardPaywall));
        setCaptureScreenOverride(requestedRoute.screen);
        setCaptureImportSourceMode(requestedRoute.importSourceMode);
        setCaptureScrollY(scrollYForCaptureScreen(requestedRoute.screen));
        setCaptureOnboardingIndex(0);
        if (requestedRoute.themeMode) setMode(requestedRoute.themeMode);
        const captureAssignments = requestedRoute.emptyPlanner ? [] : assignmentsForCaptureWorkload(requestedRoute.workloadState);
        const captureCourses = requestedRoute.emptyPlanner
          ? []
          : marketingCaptureCourses.map((course, index) =>
              requestedRoute.classColor && index === 0
                ? { ...course, color: requestedRoute.classColor, updatedAt: new Date().toISOString() }
                : course
            );
        setCourses(captureCourses);
        setAssignments(captureAssignments);
        setGradeItems(requestedRoute.emptyPlanner ? [] : marketingCaptureGradeItems);
        setNotes(buildDemoNotes(captureCourses));
        setSemester(marketingCaptureSemester);
        const captureAppTheme = requestedRoute.appTheme || "campus";
        const captureWidgetPalette = requestedRoute.widgetPalette || "ocean";
        const captureWidgetBackground = requestedRoute.widgetBackground || "glass";
        const requestedWidgetType = requestedRoute.widgetType || "today";
        const requestedWidgetKind = widgetKindForType(requestedWidgetType);
        const captureCustomizationBase = normalizeStudioCustomization(defaultSettings.customization);
        const captureWidgetStyle = captureStudioStyleForWidget(requestedRoute);
        const captureCustomization = normalizeStudioCustomization({
          ...captureCustomizationBase,
          primaryAccent: requestedRoute.classColor || captureCustomizationBase.primaryAccent,
          secondaryAccent: requestedRoute.secondaryAccent || captureCustomizationBase.secondaryAccent,
          riskColor: requestedRoute.riskColor || captureCustomizationBase.riskColor,
          forecastAccent: requestedRoute.riskColor || captureCustomizationBase.forecastAccent,
          focusColor: requestedRoute.focusColor || captureCustomizationBase.focusColor,
          focusTimerAccent: requestedRoute.focusColor || captureCustomizationBase.focusTimerAccent,
          activityColor: requestedRoute.activityColor || captureCustomizationBase.activityColor,
          widgetColor: requestedRoute.widgetCustomColor || requestedRoute.classColor || captureCustomizationBase.widgetColor,
          watchPreviewStyle: requestedRoute.watchPreviewStyle || captureCustomizationBase.watchPreviewStyle,
          homeWidgetPack: captureCustomizationBase.homeWidgetPack.map((widget, index) =>
            index === 0
              ? {
                  ...widget,
                  contentType: captureContentTypeForWidget(requestedWidgetType),
                  classFocusCourseId:
                    requestedWidgetType === "class_focus" || requestedRoute.widgetDataMode === "single_class"
                      ? captureCourses[0]?.id
                      : widget.classFocusCourseId,
                  colorSource: requestedRoute.widgetColorSource || widget.colorSource,
                  customColor: requestedRoute.widgetCustomColor || widget.customColor,
                  size: requestedRoute.widgetSize || widget.size,
                  style: captureWidgetStyle,
                  updatedAt: new Date().toISOString()
                }
              : widget
          ),
          lockWidgetPack: captureCustomizationBase.lockWidgetPack.map((widget, index) =>
            index === 0
              ? {
                  ...widget,
                  contentType: captureContentTypeForWidget(requestedWidgetType),
                  classFocusCourseId: captureCourses[0]?.id,
                  colorSource: requestedRoute.widgetColorSource || "custom",
                  customColor: requestedRoute.widgetCustomColor || requestedRoute.classColor || widget.customColor,
                  style: requestedRoute.widgetStudioStyle || widget.style,
                  updatedAt: new Date().toISOString()
                }
              : widget
          ),
          watchWidgetPack: captureCustomizationBase.watchWidgetPack.map((widget, index) =>
            index === 0
              ? {
                  ...widget,
                  contentType: captureContentTypeForWidget(requestedWidgetType),
                  classFocusCourseId: captureCourses[0]?.id,
                  colorSource: requestedRoute.widgetColorSource || "custom",
                  customColor: requestedRoute.widgetCustomColor || requestedRoute.classColor || widget.customColor,
                  style: requestedRoute.widgetStudioStyle || widget.style,
                  updatedAt: new Date().toISOString()
                }
              : widget
          ),
          updatedAt: new Date().toISOString()
        });
        setSettings({
          ...defaultSettings,
          onboardingComplete: true,
          privacyMode: false,
          syncEnabled: true,
          selectedTheme: captureWidgetPalette,
          defaultWidgetStyle: captureWidgetBackground,
          appTheme: captureAppTheme,
          customPalette: [
            captureCustomization.primaryAccent,
            captureCustomization.secondaryAccent,
            captureCustomization.riskColor,
            captureCustomization.focusColor
          ],
          customization: captureCustomization
        });
        const requestedPreset = buildCanonicalWidgetPreset(requestedWidgetKind, {
          type: requestedWidgetType,
          size: requestedRoute.widgetSize,
          background: captureWidgetBackground,
          palette: captureWidgetPalette,
          dataMode: requestedRoute.widgetDataMode || captureDataModeForWidget(requestedWidgetType),
          layout: requestedRoute.widgetLayout,
          classFocusCourseId:
            requestedWidgetType === "class_focus" || requestedRoute.widgetDataMode === "single_class"
              ? captureCourses[0]?.id
              : undefined,
          themePackId: captureAppTheme
        });
        setWidgetPresets([
          requestedPreset,
          ...ensureCanonicalWidgetPresets(defaultWidgetPresets).filter(
            (preset) => widgetKindForType(preset.type) !== requestedWidgetKind
          )
        ]);
        setStudentLifeMemory(
          seedStudentLifeMemoryForAge({
            ageDays: requestedRoute.depthAgeDays || 0,
            assignments: captureAssignments,
            courses: captureCourses
          })
        );
        setSelectedAssignmentId(null);
        setFocusAssignmentId(null);
        setActiveTab(requestedTab);
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [assignments.length, courses.length, gradeItems.length, hydrated, notes.length, setLocaleOverride]);

  useEffect(() => {
    if (!hydrated || captureScrollY === null) return;

    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: captureScrollY, animated: false });
    }, 650);

    return () => clearTimeout(timeout);
  }, [activeTab, captureScrollY, hydrated]);

  const openTab = (tab: NavTab) => {
    setSelectedAssignmentId(null);
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const openPaywall = (returnTab: NavTab = activeTab === "subscribe" ? postPaywallTab : activeTab) => {
    setSelectedAssignmentId(null);
    setPostPaywallTab(returnTab);
    setActiveTab("subscribe");
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const openFocusForAssignment = (assignmentId?: string) => {
    setSelectedAssignmentId(null);
    setFocusAssignmentId(assignmentId || selectedAssignmentId);
    setActiveTab("focus");
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  useEffect(() => {
    if (!hydrated) return;
    const feature = studentLifeFeatureForTab(activeTab);
    if (!feature) return;
    setStudentLifeMemory((current) => recordStudentLifeFeatureVisit(current, feature));
  }, [activeTab, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setStudentLifeMemory((current) =>
      recordStudentLifeForecastSnapshot(current, activeAssignments, focusSessions)
    );
  }, [activeAssignments, focusSessions, hydrated]);

  useEffect(() => {
    if (!hydrated || activeTab !== "today") return;
    setStudentLifeMemory((current) =>
      recordStudentLifeTopAction(current, studentLifeContext.feed.assignment?.id)
    );
  }, [activeTab, hydrated, studentLifeContext.feed.assignment?.id]);

  useEffect(() => {
    if (!hydrated || activeTab !== "more") return;
    setStudentLifeMemory((current) =>
      recordStudentLifeWidgetRecommended(
        recordStudentLifeWatchSignal(current, studentLifeContext.watch.signal),
        studentLifeContext.widgets.type
      )
    );
  }, [activeTab, hydrated, studentLifeContext.watch.signal, studentLifeContext.widgets.type]);

  useEffect(() => {
    if (!hydrated) return;

    const openRoute = (url: string | null) => {
      if (!url) return;
      const normalized = url.toLowerCase();
      const requestedTab = routeTabFromUrl(normalized);
      if (requestedTab) {
        setOnboarded(true);
        openTab(requestedTab);
      }
    };

    void Linking.getInitialURL().then(openRoute);
    const subscription = Linking.addEventListener("url", ({ url }) => openRoute(url));
    return () => subscription.remove();
  }, [hydrated, subscription.isPremium]);

  useEffect(() => {
    if (marketingCaptureEnabled) {
      setHydrated(true);
      return;
    }

    let mounted = true;

    loadJson<PlannerData>(plannerStorageKey).then((stored) => {
      if (!mounted) return;

      if (stored) {
        const storedSettings = {
          ...defaultSettings,
          ...(stored.settings || {}),
          customization: normalizeStudioCustomization(stored.settings?.customization || defaultSettings.customization),
          onboardingComplete: Boolean(stored.onboarded)
        };
        setOnboarded(Boolean(stored.onboarded));
        setPaywallSeen(Boolean(stored.paywallSeen));
        setSemester(stored.semester || defaultSemester);
        setCourses(stored.courses || []);
        setAssignments(stored.assignments || []);
        setGradeItems(stored.gradeItems || []);
        setTargetGradePercent(stored.targetGradePercent || 90);
        setSettings(storedSettings);
        if (storedSettings.locale && supportedLocales.includes(storedSettings.locale as SupportedLocale)) {
          setLocaleOverride(storedSettings.locale as SupportedLocale);
        }
        setParsedImports(stored.parsedImports || []);
        setParsedItems(stored.parsedItems || []);
        setWidgetPresets(stored.widgetPresets?.length ? ensureCanonicalWidgetPresets(stored.widgetPresets) : defaultWidgetPresets);
        setFocusSessions(stored.focusSessions || []);
        setNotes(stored.notes || []);
        setStudentLifeMemory(ensureStudentLifeMemory(stored.studentLifeMemory));
        setDemoMode(Boolean(stored.demoMode));
      }

      if (simulatorLoadingDelayMs > 0) {
        setTimeout(() => {
          if (mounted) setHydrated(true);
        }, simulatorLoadingDelayMs);
      } else {
        setHydrated(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (marketingCaptureEnabled) return;
    if (!hydrated) return;

    const nextPlannerData: PlannerData = {
      onboarded,
      paywallSeen,
      semester,
      courses,
      assignments,
      gradeItems,
      targetGradePercent,
      settings: { ...settings, onboardingComplete: onboarded },
      parsedImports,
      parsedItems,
      widgetPresets,
      focusSessions,
      notes,
      studentLifeMemory,
      demoMode
    };

    void saveJson<PlannerData>(plannerStorageKey, nextPlannerData);
    void syncStudyPlannerWidgets({
      semester,
      courses,
      assignments,
      parsedImports,
      settings,
      widgetPresets,
      demoMode,
      locale,
      translate: t
    }).then(setNativeWidgetStatus);
  }, [
    assignments,
    courses,
    focusSessions,
    gradeItems,
    hydrated,
    locale,
    notes,
    demoMode,
    onboarded,
    parsedImports,
    parsedItems,
    paywallSeen,
    semester,
    settings,
    studentLifeMemory,
    targetGradePercent,
    t,
    widgetPresets
  ]);

  useEffect(() => {
    if (!marketingCaptureEnabled) return;
    if (!hydrated) return;

    void syncStudyPlannerWidgets({
      semester,
      courses: [],
      assignments: [],
      parsedImports: [],
      settings,
      widgetPresets,
      demoMode: true,
      locale,
      translate: t
    }).then(setNativeWidgetStatus);
  }, [hydrated, locale, semester, settings, t, widgetPresets]);

  useEffect(() => {
    if (marketingCaptureEnabled) return;
    if (subscription.isPremium && onboarded && !paywallSeen) {
      setPaywallSeen(true);
      setActiveTab(postPaywallTab);
    }
  }, [onboarded, paywallSeen, postPaywallTab, subscription.isPremium]);

  useEffect(() => {
    if (!marketingCaptureEnabled || !hydrated) return;

    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: getMarketingCaptureScrollY(), animated: false });
    }, 450);

    return () => clearTimeout(timeout);
  }, [activeTab, hydrated]);

  const applyParsedPlan = (parse: SyllabusParseResult) => {
    const blockedAssignments = parse.assignments.filter(
      (assignment) =>
        assignment.needsReview ||
        assignment.duplicateOf ||
        !isValidDeadline(assignment.dueAt) ||
        (assignment.confidence || 1) < 0.75
    );
    if (blockedAssignments.length > 0) {
      Alert.alert(
        t("import.review_flagged_items_first", "Review flagged items first"),
        t("app.review_flagged_items_message", "Fix or mark every low-confidence, duplicate, or missing-date item before it touches your real planner.")
      );
      return;
    }

    const timestamp = new Date().toISOString();
    const parsedImportId = parse.sourceImportId || `import-${Date.now()}`;
    const sourceType =
      parse.sourceType ||
      (parse.assignments.some((assignment) => assignment.source === "typed") ? "typed" : "scan");
    const parsedAssignmentIds = new Set(
      [parsedImportId, ...parse.assignments.map((assignment) => assignment.sourceId).filter(Boolean)]
    );
    setCourses((current) => mergeById(current, parse.courses));
    setAssignments((current) =>
      mergeById(
        current,
        parse.assignments.map((assignment) => ({
          ...assignment,
          type: assignment.type || assignment.kind,
          source: sourceType === "typed" ? "typed" : assignment.source,
          sourceId: assignment.sourceId || parsedImportId,
          progress: assignment.progress || 0,
          confidence: assignment.confidence || 0.88,
          createdAt: assignment.createdAt || timestamp,
          updatedAt: timestamp
        }))
      )
    );
    setGradeItems((current) => mergeById(current, parse.gradeItems));
    const handoffAssignments = parse.assignments
      .slice()
      .sort((a, b) => {
        const reviewDelta = Number(Boolean(b.needsReview || !isValidDeadline(b.dueAt))) - Number(Boolean(a.needsReview || !isValidDeadline(a.dueAt)));
        if (reviewDelta !== 0) return reviewDelta;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      });
    const handoffAssignment = handoffAssignments[0];
    setImportHandoff({
      sourceName: parse.sourceName,
      addedCount: parse.assignments.length,
      reviewCount: parse.assignments.filter((assignment) => assignment.needsReview || !isValidDeadline(assignment.dueAt)).length,
      nextTitle: handoffAssignment?.title,
      nextAssignmentId: handoffAssignment?.id
    });
    setParsedImports((current) => {
      const existing = current.find((item) => item.id === parsedImportId || item.title === parse.sourceName);
      const itemCount = parse.assignments.length + parse.courses.length + parse.gradeItems.length;
      if (existing) {
        return current.map((item) =>
          item.id === existing.id
            ? { ...item, status: "applied", itemCount, updatedAt: timestamp }
            : item
        );
      }

      return [
        {
          id: parsedImportId,
          title: parse.sourceName,
          sourceType,
          status: "applied",
          itemCount,
          createdAt: timestamp,
          updatedAt: timestamp
        },
        ...current
      ];
    });
    setParsedItems((current) => {
      const currentHasSource = current.some((item) => item.parsedImportId === parsedImportId);
      const sourceImport = {
        id: parsedImportId,
        title: parse.sourceName,
        sourceType,
        status: "parsed" as const,
        itemCount: parse.assignments.length,
        createdAt: timestamp,
        updatedAt: timestamp
      } satisfies ParsedImport;
      const newItems = currentHasSource
        ? []
        : normalizeParsedItems(parse, sourceImport, {
            existingAssignments: assignments,
            existingParsedItems: current
          });
      return [
        ...newItems.map((item) => ({
          ...item,
          acceptedAt: timestamp,
          reviewStatus: "accepted" as const
        })),
        ...current.map((item) =>
          parsedAssignmentIds.has(item.parsedImportId)
            ? { ...item, acceptedAt: timestamp, reviewStatus: "accepted" as const }
            : item
        )
      ].slice(0, 200);
    });
    setNotes((current) => [
      {
        id: `note-${Date.now()}`,
        sourceId: parsedImportId,
        courseId: parse.courses[0]?.id,
        kind: "source" as const,
        title: t("import.source_note_title", "Import review note"),
        body: formatAppText(
          t("import.source_note_body", "{count} reviewed item(s) added from {source}."),
          { count: parse.assignments.length, source: parse.sourceName }
        ),
        tags: ["source", "import"],
        pinned: blockedAssignments.length > 0,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      ...current
    ].slice(0, 200));
    setSemester((current) => ({
      ...current,
      name: parse.semesterName || current.name,
      startDate: parse.semesterStartDate || current.startDate,
      endDate: parse.semesterEndDate || current.endDate
    }));
    setDemoMode(false);
    void recordReviewEvent("import_applied");
    openTab("today");
  };

  const upsertParsedImport = (parsedImport: ParsedImport) => {
    setParsedImports((current) => [
      parsedImport,
      ...current.filter((item) => item.id !== parsedImport.id)
    ].slice(0, 100));
  };

  const upsertParsedItemsForImport = (parsedImportId: string, items: ParsedItem[]) => {
    setParsedItems((current) => [
      ...items,
      ...current.filter((item) => item.parsedImportId !== parsedImportId)
    ].slice(0, 200));
  };

  const updateAssignmentStatus = (
    assignmentId: string,
    status: Exclude<AssignmentStatus, "archived">
  ) => {
    const targetAssignment = assignments.find((assignment) => assignment.id === assignmentId);
    setAssignments((current) =>
      status === "done"
        ? completeAssignment(current, assignmentId)
        : current.map((assignment) =>
            assignment.id === assignmentId
              ? { ...assignment, status, updatedAt: new Date().toISOString() }
              : assignment
          )
    );
    if (status === "done") {
      setStudentLifeMemory((current) => recordStudentLifeAssignmentCompleted(current, targetAssignment));
      void recordReviewEvent("assignment_completed");
    }
  };

  const addQuickAssignment = (
    courseId: string,
    title: string,
    dueDate: string,
    kind: AssignmentKind
  ) => {
    if (!title.trim() || !dueDate.trim()) {
      Alert.alert(t("app.add_more_title", "Add a little more"), t("app.add_more_message", "Title and due date are both needed."));
      return false;
    }

    const cleanDueDate = dueDate.trim();

    if (!isValidDateInput(cleanDueDate)) {
      Alert.alert(t("assignment_detail.check_date_title", "Check the date"), t("app.check_date_add_work_message", "Use a real date in YYYY-MM-DD format before adding this work."));
      return false;
    }

    setAssignments((current) => [
      ...current,
      {
        id: `manual-${Date.now()}`,
        courseId,
        title: title.trim(),
        kind,
        type: kind,
        dueAt: `${cleanDueDate}T23:59:00`,
        tags: kind === "exam" ? ["exam"] : ["homework"],
        priority: kind === "exam" ? "high" : "medium",
        estimatedMinutes: kind === "exam" ? 150 : 60,
        status: "not_started",
        source: "manual",
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);
    return true;
  };

  const updateSemester = (patch: Partial<Semester>) => {
    setSemester((current) => ({ ...current, ...patch }));
  };

  const addCourse = (course: Pick<Course, "code" | "name" | "instructor">) => {
    if (!course.code.trim() || !course.name.trim()) {
      Alert.alert(t("app.add_course_details_title", "Add course details"), t("app.add_course_details_message", "Course code and course name are both needed."));
      return false;
    }

    const id = `course-${Date.now()}`;
    setCourses((current) => [
      ...current,
      {
        id,
        code: course.code.trim(),
        name: course.name.trim(),
        instructor: course.instructor?.trim(),
        teacher: course.instructor?.trim(),
        color: ["#2F80ED", "#10B981", "#8B5CF6", "#F59E0B", "#14B8A6", "#EC4899"][
          current.length % 6
        ] || colors.accent,
        iconKey: "book",
        emojiKey: "study",
        semester: semester.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        meetings: [],
        gradeCategories: [
          { id: `${id}-assignments`, name: "Assignments", weight: 40 },
          { id: `${id}-exams`, name: "Exams", weight: 40 },
          { id: `${id}-participation`, name: "Participation", weight: 20 }
        ]
      }
    ]);
    return true;
  };

  const updateCourse = (courseId: string, patch: Partial<Course>) => {
    setCourses((current) =>
      current.map((course) =>
        course.id === courseId
          ? { ...course, ...patch, updatedAt: new Date().toISOString() }
          : course
      )
    );
  };

  const addNote = (note: Omit<StudyNote, "id" | "createdAt" | "updatedAt">) => {
    const timestamp = new Date().toISOString();
    setStudentLifeMemory((current) => recordStudentLifeNoteCreated(current, note));
    setNotes((current) => [
      {
        ...note,
        id: `note-${Date.now()}`,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      ...current
    ]);
  };

  const updateNote = (noteId: string, patch: Partial<StudyNote>) => {
    if (patch.pinned === true && !notes.find((note) => note.id === noteId)?.pinned) {
      setStudentLifeMemory((current) => recordStudentLifeNotePinned(current));
    }
    setNotes((current) =>
      current.map((note) =>
        note.id === noteId ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note
      )
    );
  };

  const deleteNote = (noteId: string) => {
    setNotes((current) => current.filter((note) => note.id !== noteId));
  };

  const convertNoteToAssignment = (noteId: string) => {
    const note = notes.find((item) => item.id === noteId);
    if (!note) return;
    const assignment = convertNoteToTask(note, courses);
    if (!assignment) {
      Alert.alert(t("notes.add_class_first", "Add a class first"), t("app.note_task_needs_class", "A note needs class context before it can become a task."));
      return;
    }
    setAssignments((current) => [assignment, ...current]);
    setStudentLifeMemory((current) => recordStudentLifeNoteConverted(current, note, assignment));
    updateNote(noteId, {
      assignmentId: assignment.id,
      courseId: assignment.courseId,
      kind: "assignment",
      tags: Array.from(new Set([...(note.tags || []), "task"]))
    });
    setSelectedAssignmentId(assignment.id);
  };

  const updateAssignment = (assignmentId: string, patch: Partial<Assignment>) => {
    setAssignments((current) =>
      current.map((assignment) =>
        assignment.id === assignmentId
          ? { ...assignment, ...patch, updatedAt: new Date().toISOString() }
          : assignment
      )
    );
  };

  const archiveAssignment = (assignmentId: string) => {
    updateAssignment(assignmentId, { status: "archived" });
    setSelectedAssignmentId(null);
  };

  const addGradeItem = (item: Omit<GradeItem, "id">) => {
    setGradeItems((current) => [
      ...current,
      {
        ...item,
        id: `grade-${Date.now()}`
      }
    ]);
  };

  const updateGradeItem = (gradeItemId: string, patch: Partial<GradeItem>) => {
    setGradeItems((current) =>
      current.map((item) => (item.id === gradeItemId ? { ...item, ...patch } : item))
    );
  };

  const updateSettings = (patch: Partial<UserSettings>) => {
    setSettings((current) => ({
      ...current,
      ...patch,
      customization: patch.customization
        ? normalizeStudioCustomization(patch.customization)
        : normalizeStudioCustomization(current.customization)
    }));
  };

  const updateLocale = (nextLocale: SupportedLocale) => {
    setLocaleOverride(nextLocale);
    setSettings((current) => applyLocale(current, nextLocale));
  };

  const saveWidgetPreset = (preset: WidgetPreset) => {
    setWidgetPresets((current) => saveWidgetPresetState(current, preset));
    setStudentLifeMemory((current) => recordStudentLifeWidgetSaved(current, preset.type));
    void recordReviewEvent("widget_saved");
  };

  const resetWidgetPresets = () => {
    setWidgetPresets(ensureCanonicalWidgetPresets(defaultWidgetPresets));
  };

  const startWithDemoPlanner = (
    settingsPatch?: Partial<UserSettings>,
    requirePostOnboardingPaywall = false
  ) => {
    const demo = buildDemoPlannerData();
    setSemester(demo.semester);
    setCourses(demo.courses);
    setAssignments(demo.assignments);
    setGradeItems(demo.gradeItems);
    setParsedImports([]);
    setParsedItems([]);
    setWidgetPresets(ensureCanonicalWidgetPresets(defaultWidgetPresets));
    setFocusSessions(demo.focusSessions);
    setNotes(buildDemoNotes(demo.courses));
    setStudentLifeMemory(seedStudentLifeMemoryForAge({
      ageDays: 7,
      assignments: demo.assignments,
      courses: demo.courses
    }));
    setDemoMode(true);
    setSettings((current) => ({ ...current, ...settingsPatch }));
    setImportHandoff({
      sourceName: "Demo syllabus",
      addedCount: demo.assignments.length,
      reviewCount: demo.assignments.filter((assignment) => assignment.needsReview).length,
      nextTitle: demo.assignments[0]?.title,
      nextAssignmentId: demo.assignments[0]?.id
    });
    setOnboarded(true);
    setPostPaywallTab("today");
    setPaywallSeen(!requirePostOnboardingPaywall);
    setActiveTab("today");
  };

  const finishOnboarding = (
    destination: OnboardingDestination,
    settingsPatch?: Partial<UserSettings>
  ) => {
    setSettings((current) => ({ ...current, ...settingsPatch }));
    setWidgetPresets((current) => applyOnboardingWidgetTheme(current.length ? current : defaultWidgetPresets, settingsPatch));
    setOnboarded(true);
    setPaywallSeen(false);
    setPostPaywallTab("import");
    setDemoMode(false);
    setStudentLifeMemory(ensureStudentLifeMemory(null));
    setActiveTab("subscribe");
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const recordFocusSession = (session: FocusSession) => {
    const assignment = assignments.find((item) => item.id === session.assignmentId);
    setStudentLifeMemory((current) => recordStudentLifeFocusSession(current, session, assignment));
    setFocusSessions((current) => {
      const sameAssignmentDay = (item: FocusSession) =>
        item.assignmentId === session.assignmentId &&
        focusSessionDateKey(item.startedAt) === focusSessionDateKey(session.startedAt);
      const replacesTransientSession =
        session.status === "completed" ||
        session.status === "stopped" ||
        session.status === "running" ||
        session.status === "paused";
      const withoutTransientSession = replacesTransientSession
        ? current.filter(
            (item) =>
              !(
                sameAssignmentDay(item) &&
                (item.status === "running" || item.status === "paused" || item.status === "planned")
              )
          )
        : current;
      const withoutCompletedPlan = session.status === "completed"
        ? withoutTransientSession.filter(
            (item) => !(item.status === "planned" && item.assignmentId === session.assignmentId)
          )
        : withoutTransientSession;
      const withoutDuplicatePlan = session.status === "planned"
        ? withoutCompletedPlan.filter(
            (item) => !(item.status === "planned" && item.assignmentId === session.assignmentId && focusSessionDateKey(item.startedAt) === focusSessionDateKey(session.startedAt))
          )
        : withoutCompletedPlan;

      return [session, ...withoutDuplicatePlan].slice(0, 24);
    });
    if (session.status === "completed") {
      void recordReviewEvent("focus_completed");
    }
  };

  const handleScheduleReminders = async () => {
    try {
      const { count, reminderIdsByAssignment } = await scheduleSmartReminders(
        activeAssignments,
        courses
      );
      setAssignments((current) =>
        current.map((assignment) => {
          const newReminderIds = reminderIdsByAssignment[assignment.id];
          return newReminderIds
            ? {
                ...assignment,
                reminderIds: [...(assignment.reminderIds || []), ...newReminderIds]
              }
            : assignment;
        })
      );
      Alert.alert(
        t("app.reminders_queued_title", "Reminders queued"),
        formatAppText(t("app.reminders_queued_message", "{count} smart reminders were scheduled."), { count })
      );
    } catch (error) {
      Alert.alert(t("app.reminder_setup_paused", "Reminder setup paused"), messageFromError(error, t));
    }
  };

  const handleCalendarSync = async () => {
    try {
      const { count, calendarEventIdsByAssignment } = await syncAssignmentsToDeviceCalendar(
        activeAssignments,
        courses
      );
      setAssignments((current) =>
        current.map((assignment) =>
          calendarEventIdsByAssignment[assignment.id]
            ? {
                ...assignment,
                externalCalendarEventId: calendarEventIdsByAssignment[assignment.id]
              }
            : assignment
        )
      );
      Alert.alert(
        t("app.calendar_synced_title", "Calendar synced"),
        formatAppText(t("app.calendar_synced_message", "{count} deadlines were sent to your device calendar."), { count })
      );
    } catch (error) {
      Alert.alert(t("app.calendar_sync_paused", "Calendar sync paused"), messageFromError(error, t));
    }
  };

  const appAccessLocked =
    (!captureBypassEnabled || captureHardPaywall) && onboarded && !subscription.isPremium;

  if (!hydrated) {
    return <LoadingScreen label={t("app.loading", "Loading StudyPlanner")} />;
  }

  if (!onboarded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={theme.isDark ? "light" : "dark"} />
        <OnboardingScreen onFinish={finishOnboarding} initialIndex={captureOnboardingIndex} />
      </SafeAreaView>
    );
  }

  if (appAccessLocked) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={theme.isDark ? "light" : "dark"} />
        <View style={[styles.appShell, isRTL ? styles.rtlContainer : null]}>
          <ScrollView
            ref={scrollRef}
            style={styles.scrollArea}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.mobileTopBar}>
              <AppLogo showWordmark={width >= 360} size={28} />
              <ModeToggle compact style={styles.mobileModeToggle} />
            </View>
            <UpgradeScreen hardMode />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <View style={[styles.appShell, isRTL ? styles.rtlContainer : null]}>
        {tablet ? (
          <View style={styles.sidebar}>
            <AppLogo showWordmark size={34} />
            <ModeToggle />
            <View style={styles.sidebarNav}>
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.sidebarButton, active ? styles.sidebarButtonActive : null]}
                    onPress={() => openTab(tab.id)}
                  >
                    <Icon color={active ? colors.heroText : colors.muted} size={18} />
                    <Text style={[styles.sidebarLabel, active ? styles.sidebarLabelActive : null]}>
                      {t(tab.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.sidebarPro}>
              <Sparkles color={colors.brandPink} size={16} />
              <Text style={styles.sidebarProText}>{t("app.sidebar_pro_text", "Plan less. Stress less.")}</Text>
            </View>
          </View>
        ) : null}
        <ScrollView
          ref={scrollRef}
          style={styles.scrollArea}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {tablet ? (
            <StudySystemHeader
              activeTab={activeTab}
              state={systemState}
              styles={styles}
              label={labelForTab(activeTab, t)}
              onPrimaryAction={() => {
                if (systemState.action === "scan") openTab("import");
                if (systemState.action === "review") openTab("import");
                if (systemState.action === "today") openTab("today");
                if (systemState.action === "widgets") openTab("more");
              }}
            />
          ) : null}
          {selectedAssignment ? (
            <AssignmentDetailScreen
              assignment={selectedAssignment}
              courses={courses}
              notes={notes}
              onClose={() => setSelectedAssignmentId(null)}
              onSave={(patch) => updateAssignment(selectedAssignment.id, patch)}
              onArchive={() => archiveAssignment(selectedAssignment.id)}
              onStartFocus={() => openFocusForAssignment(selectedAssignment.id)}
              onAddNote={addNote}
            />
          ) : (
            <>
              {activeTab === "today" ? (
                <TodayScreen
                  assignments={activeAssignments}
                  courses={courses}
                  semester={semester}
                  studentName={settings.studentName}
                  notes={notes}
                  focusSessions={focusSessions}
                  settings={settings}
                  widgetPresets={widgetPresets}
                  studentLife={studentLifeContext}
                  importHandoff={importHandoff}
                  demoMode={demoMode}
                  onUpdateStatus={updateAssignmentStatus}
                  onOpenAssignment={setSelectedAssignmentId}
                  onScheduleReminders={handleScheduleReminders}
                  onCalendarSync={handleCalendarSync}
                  onOpenFocus={(assignmentId) => openFocusForAssignment(assignmentId)}
                  onOpenScan={() => openTab("import")}
                  onOpenPlan={() => openTab("plan")}
                  onOpenClasses={() => openTab("courses")}
                  onOpenNotes={() => openTab("notes")}
                  onOpenGrades={() => openTab("grades")}
                  onOpenWidgets={() => openTab("more")}
                  onTryDemo={captureBypassEnabled ? () => startWithDemoPlanner() : undefined}
                  onReplaceDemo={() => {
                    setSemester(defaultSemester);
                    setCourses([]);
                    setAssignments([]);
                    setGradeItems([]);
                    setParsedImports([]);
                    setParsedItems([]);
                    setFocusSessions([]);
                    setNotes([]);
                    setStudentLifeMemory(ensureStudentLifeMemory(null));
                    setImportHandoff(null);
                    setDemoMode(false);
                    openTab("import");
                  }}
                  onAddQuickAssignment={addQuickAssignment}
                />
              ) : null}
              {activeTab === "import" ? (
                <ImportScreen
                  assignments={activeAssignments}
                  parsedImports={parsedImports}
                  parsedItems={parsedItems}
                  onApplyParsedPlan={applyParsedPlan}
                  onUpsertParsedImport={upsertParsedImport}
                  onUpsertParsedItemsForImport={upsertParsedItemsForImport}
                  captureScreenOverride={captureScreenOverride}
                  captureSourceModeOverride={captureImportSourceMode}
                />
              ) : null}
              {activeTab === "plan" ? (
                <PlanScreen
                  assignments={activeAssignments}
                  courses={courses}
                  sessions={focusSessions}
                  settings={settings}
                  studentLife={studentLifeContext}
                  onOpenAssignment={setSelectedAssignmentId}
                  onOpenFocus={openFocusForAssignment}
                  onUpdateStatus={updateAssignmentStatus}
                  onRecordSession={recordFocusSession}
                  onAddQuickAssignment={addQuickAssignment}
                  onOpenScan={() => openTab("import")}
                />
              ) : null}
              {activeTab === "courses" ? (
                <CoursesScreen
                  semester={semester}
                  courses={courses}
                  assignments={activeAssignments}
                  notes={notes}
                  studentLife={studentLifeContext}
                  onAddQuickAssignment={addQuickAssignment}
                  onOpenAssignment={setSelectedAssignmentId}
                  onOpenNotes={() => openTab("notes")}
                  onUpdateSemester={updateSemester}
                  onAddCourse={addCourse}
                  onUpdateCourse={updateCourse}
                />
              ) : null}
              {activeTab === "notes" ? (
                <NotesScreen
                  courses={courses}
                  assignments={activeAssignments}
                  focusSessions={focusSessions}
                  notes={notes}
                  studentLife={studentLifeContext}
                  onAddNote={addNote}
                  onUpdateNote={updateNote}
                  onDeleteNote={deleteNote}
                  onConvertNoteToTask={convertNoteToAssignment}
                  onOpenClasses={() => openTab("courses")}
                />
              ) : null}
              {activeTab === "grades" ? (
                <GradesScreen
                  courses={courses}
                  assignments={activeAssignments}
                  gradeItems={gradeItems}
                  targetGradePercent={targetGradePercent}
                  onTargetGradeChange={setTargetGradePercent}
                  onAddGradeItem={addGradeItem}
                  onUpdateGradeItem={updateGradeItem}
                />
              ) : null}
              {activeTab === "focus" ? (
                <FocusScreen
                  assignments={activeAssignments}
                  courses={courses}
                  defaultMinutes={getRecommendedFocusDuration(activeAssignments, focusSessions, settings)}
                  sessions={focusSessions}
                  studentLife={studentLifeContext}
                  focusAccent={settings.customization?.focusTimerAccent}
                  preferredAssignmentId={focusAssignmentId}
                  onRecordSession={recordFocusSession}
                  onMarkComplete={(assignmentId) => updateAssignmentStatus(assignmentId, "done")}
                  onAddNote={addNote}
                />
              ) : null}
              {activeTab === "more" ? (
                <MoreScreen
                  assignments={activeAssignments}
                  courses={courses}
                  notes={notes}
                  focusSessions={focusSessions}
                  semester={semester}
                  parsedImports={parsedImports}
                  demoMode={demoMode}
                  settings={settings}
                  widgetPresets={widgetPresets}
                  nativeWidgetStatus={nativeWidgetStatus}
                  studentLife={studentLifeContext}
                  onUpdateSettings={updateSettings}
                  onSaveWidgetPreset={saveWidgetPreset}
                  onResetWidgetPresets={resetWidgetPresets}
                  onUpdateCourse={updateCourse}
                  locale={locale}
                  onLocaleChange={updateLocale}
                  onOpenNotes={() => openTab("notes")}
                  onOpenFocus={() => openFocusForAssignment()}
                  onOpenGrades={() => openTab("grades")}
                />
              ) : null}
              {activeTab === "subscribe" ? (
                <UpgradeScreen
                  hardMode={!subscription.isPremium}
                  onContinueAfterPurchase={subscription.isPremium ? () => openTab(postPaywallTab) : undefined}
                />
              ) : null}
            </>
          )}
        </ScrollView>

        {!tablet ? (
          <SPBottomTabBar
            items={bottomTabs.map((tab) => ({
              id: tab.id,
              label: mobileTabLabel(tab.id, t(tab.labelKey), t),
              icon: tab.icon
            }))}
            isActive={(id) =>
              activeTab === id ||
              (id === "today" && activeTab === "focus") ||
              (id === "more" && moreGroupTabIds.has(activeTab))
            }
            onPress={(id) => openTab(id as NavTab)}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function LoadingScreen({ label }: { label: string }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <View style={styles.loadingScreen}>
        <AppLogo showWordmark size={74} />
        <Text style={styles.loadingText}>{label}</Text>
        <View style={styles.skeletonStack} accessibilityLabel="Loading planner preview">
          <View style={styles.skeletonHero}>
            <View style={styles.skeletonTopRow}>
              <SkeletonBar width="34%" />
              <SkeletonBar width={54} />
            </View>
            <SkeletonBar width="76%" height={30} />
            <SkeletonBar width="58%" />
            <View style={styles.skeletonMetricRow}>
              <SkeletonBlock />
              <SkeletonBlock />
              <SkeletonBlock />
            </View>
          </View>
          <View style={styles.skeletonList}>
            <SkeletonBar width="42%" height={18} />
            <SkeletonRow />
            <SkeletonRow />
          </View>
        </View>
        <ActivityIndicator color={colors.ink} />
      </View>
    </SafeAreaView>
  );
}

function SkeletonBar({ width, height = 14 }: { width: number | `${number}%`; height?: number }) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={[styles.skeletonBar, { width, height }]} />;
}

function SkeletonBlock() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return <View style={styles.skeletonBlock} />;
}

function SkeletonRow() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.skeletonRow}>
      <View style={styles.skeletonDot} />
      <View style={styles.skeletonRowCopy}>
        <SkeletonBar width="74%" />
        <SkeletonBar width="48%" height={11} />
      </View>
    </View>
  );
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const existing = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => existing.set(item.id, item));
  return Array.from(existing.values());
}

function messageFromError(error: unknown, t: (key: string, fallback?: string) => string) {
  return error instanceof Error ? error.message : t("app.permission_flow_incomplete", "The device permission flow did not complete.");
}

function formatAppText(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template
  );
}

function focusSessionDateKey(value: string) {
  return value.slice(0, 10);
}

type AppSystemState = {
  title: string;
  detail: string;
  badge: string;
  actionLabel: string;
  action: "scan" | "review" | "today" | "widgets";
  facts: Array<{ label: string; value: string; detail: string }>;
};

function buildAppSystemState(
  assignments: Assignment[],
  courses: Course[],
  parsedImports: ParsedImport[],
  nativeWidgetStatus: WidgetSyncStatus,
  demoMode: boolean,
  t: (key: string, fallback?: string) => string
): AppSystemState {
  const openAssignments = assignments.filter((assignment) => assignment.status !== "done" && assignment.status !== "archived");
  const flaggedAssignments = openAssignments.filter(
    (assignment) => assignment.needsReview || assignment.duplicateOf || !isValidDeadline(assignment.dueAt)
  );
  const reviewedRows = openAssignments.filter((assignment) => !assignment.needsReview && !assignment.duplicateOf).length;
  const importCount = parsedImports.filter((item) => !item.id.startsWith("demo-")).length;
  const widgetStatus =
    nativeWidgetStatus.state === "synced"
      ? t("app.system_widget_synced", "Synced")
      : nativeWidgetStatus.state === "unavailable"
        ? t("app.system_widget_build", "Build")
        : t("app.system_widget_ready", "Ready");
  const facts = [
    {
      label: t("tabs.classes", "Classes"),
      value: String(courses.length),
      detail: courses.length ? t("app.system_connected", "connected") : t("app.system_needed", "needed")
    },
    {
      label: t("app.system_reviewed", "Reviewed"),
      value: String(reviewedRows),
      detail: reviewedRows ? t("app.system_planner_rows", "planner rows") : t("app.system_none_yet", "none yet")
    },
    {
      label: t("tabs.widgets", "Widgets"),
      value: widgetStatus,
      detail: nativeWidgetStatus.state === "synced" ? t("app.system_snapshot", "snapshot") : t("app.system_preview", "preview")
    }
  ];

  if (courses.length === 0 && assignments.length === 0) {
    return {
      title: t("app.system_empty_title", "Start with real school material."),
      detail: t("app.system_empty_detail", "Scan a syllabus, paste class notes, or add the first class. The app stays empty until the student gives it real work."),
      badge: demoMode ? t("app.system_demo", "Demo") : t("app.system_setup", "Setup"),
      actionLabel: t("app.system_scan_or_add", "Scan or add"),
      action: "scan",
      facts
    };
  }

  if (flaggedAssignments.length > 0) {
    return {
      title: t("app.system_review_title", "A few items need a quick look."),
      detail: formatAppText(
        flaggedAssignments.length === 1
          ? t("app.system_review_detail_one", "{count} item needs a date or duplicate check before it appears in Today and widgets.")
          : t("app.system_review_detail_count", "{count} items need a date or duplicate check before they appear in Today and widgets."),
        { count: flaggedAssignments.length }
      ),
      badge: t("today.metric_review", "Review"),
      actionLabel: t("app.system_review_work", "Review work"),
      action: "review",
      facts
    };
  }

  if (openAssignments.length > 0) {
    return {
      title: t("app.system_live_title", "Planner is live."),
      detail: formatAppText(
        openAssignments.length === 1
          ? t("app.system_live_detail_one", "{count} open item is powering Today, Plan, and Widget Studio from the same reviewed data.")
          : t("app.system_live_detail_count", "{count} open items are powering Today, Plan, and Widget Studio from the same reviewed data."),
        { count: openAssignments.length }
      ),
      badge: importCount ? t("app.system_imported", "Imported") : t("assignment_detail.source_manual", "Manual"),
      actionLabel: t("app.system_open_today", "Open Today"),
      action: "today",
      facts
    };
  }

  return {
    title: t("app.system_clear_title", "Clean slate, widget proof ready."),
    detail: t("app.system_clear_detail", "No open work is due right now. Widget Studio can still show the real empty state and guide the next import."),
    badge: t("app.system_clear", "Clear"),
    actionLabel: t("app.system_open_widgets", "Open Widgets"),
    action: "widgets",
    facts
  };
}

function StudySystemHeader({
  activeTab,
  state,
  styles,
  label,
  onPrimaryAction
}: {
  activeTab: NavTab;
  state: AppSystemState;
  styles: ReturnType<typeof createStyles>;
  label: string;
  onPrimaryAction: () => void;
}) {
  const { t } = useI18n();
  return (
    <View style={styles.systemHeader}>
      <View style={styles.systemHeaderTop}>
        <View style={styles.systemHeaderCopy}>
          <Text style={styles.systemEyebrow}>{formatAppText(t("app.system_eyebrow", "StudyPlanner · {label}"), { label })}</Text>
          <Text style={styles.systemTitle} numberOfLines={2}>{state.title}</Text>
          <Text style={styles.systemDetail} numberOfLines={2}>{state.detail}</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" style={styles.systemAction} onPress={onPrimaryAction}>
          <Text style={styles.systemActionBadge}>{state.badge}</Text>
          <Text style={styles.systemActionLabel}>{state.actionLabel}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.systemFactRow}>
        {state.facts.map((fact) => (
          <View key={fact.label} style={styles.systemFact}>
            <Text style={styles.systemFactLabel}>{fact.label}</Text>
            <Text style={styles.systemFactValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{fact.value}</Text>
            <Text style={styles.systemFactDetail} numberOfLines={1}>{fact.detail}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function labelForTab(tab: NavTab, t: (key: string, fallback?: string) => string) {
  const labels: Record<NavTab, string> = {
    today: t("tabs.today", "Today"),
    import: t("tabs.scan", "Scan"),
    plan: t("tabs.calendar", "Calendar"),
    courses: t("tabs.classes", "Classes"),
    notes: t("tabs.notes", "Notes"),
    more: t("tabs.widgets", "Widgets"),
    focus: t("tabs.focus", "Focus"),
    grades: t("tabs.grades", "Grades"),
    subscribe: t("tabs.subscribe", "Subscribe")
  };
  return labels[tab];
}

function studentLifeFeatureForTab(tab: NavTab): StudentLifeFeature | null {
  if (tab === "today") return "home";
  if (tab === "plan") return "forecast";
  if (tab === "courses") return "classes";
  if (tab === "focus") return "focus";
  if (tab === "notes") return "notes";
  if (tab === "more") return "widgets";
  return null;
}

function buildDemoPlannerData(now = new Date()) {
  const demoCourses = defaultCourses.slice(0, 2);
  const demoSemester = {
    ...defaultSemester,
    id: "demo-semester",
    name: "Demo Semester",
    startDate: dateOffset(now, -28),
    endDate: dateOffset(now, 84)
  };
  const demoAssignments = defaultAssignments.slice(0, 6).map((assignment, index) => {
    const course = demoCourses[index % demoCourses.length] || demoCourses[0];
    const offsets = [0, 1, 2, 4, 7, 10];
    const dueDate = dateOffset(now, offsets[index] ?? index + 1);
    const dueTime = assignment.kind === "exam" ? "09:00:00" : index % 2 === 0 ? "20:00:00" : "23:59:00";
    return {
      ...assignment,
      id: `demo-${assignment.id}`,
      courseId: course?.id || assignment.courseId,
      dueAt: `${dueDate}T${dueTime}`,
      status: index === 0 ? "in_progress" as const : index === 5 ? "done" as const : "not_started" as const,
      source: "syllabus" as const,
      sourceId: "demo-syllabus",
      needsReview: index === 2,
      duplicateOf: index === 2 ? undefined : assignment.duplicateOf,
      progress: index === 0 ? 0.35 : index === 5 ? 1 : 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  });

  return {
    semester: demoSemester,
    courses: demoCourses,
    assignments: demoAssignments,
    gradeItems: defaultGradeItems.filter((item) => demoCourses.some((course) => course.id === item.courseId)),
    focusSessions: defaultFocusSessions.map((session) => ({
      ...session,
      id: `demo-${session.id}`,
      assignmentId: `demo-${session.assignmentId}`,
      startedAt: `${dateOffset(now, -1)}T16:00:00`,
      endedAt: `${dateOffset(now, -1)}T16:25:00`
    }))
  };
}

function buildDemoNotes(courses: Course[]): StudyNote[] {
  const now = new Date().toISOString();
  return courses.slice(0, 3).map((course, index) => ({
    id: `demo-note-${course.id}`,
    courseId: course.id,
    title: index === 0 ? "Teacher preferences" : index === 1 ? "Exam study plan" : "Project rubric clues",
    body: index === 0
      ? "Prefers concise answers, show work, and submit lab reflections before class starts."
      : index === 1
        ? "Make a one-page formula sheet, redo missed quiz questions, then run a 25-minute focus block."
        : "Rubric rewards source quality, clean outline, and a short reflection paragraph.",
    tags: ["demo", "class-context"],
    pinned: index === 0,
    createdAt: now,
    updatedAt: now
  }));
}

function dateOffset(now: Date, offsetDays: number) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createStyles(theme: AppTheme, tablet = false) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      overflow: "hidden"
    },
    appShell: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      overflow: "hidden",
      flexDirection: tablet ? "row" : "column"
    },
    rtlContainer: {
      direction: "rtl"
    },
    content: {
      width: "100%",
      maxWidth: tablet ? 980 : undefined,
      alignSelf: tablet ? "center" : undefined,
      paddingHorizontal: tablet ? spacing.xl : spacing.md,
      paddingTop: tablet ? spacing.xl : 18,
      paddingBottom: tablet ? spacing.xxl : 156
    },
    hardPaywallContent: {
      width: "100%",
      maxWidth: tablet ? 760 : undefined,
      alignSelf: tablet ? "center" : undefined,
      paddingHorizontal: tablet ? spacing.xl : spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl
    },
    scrollArea: {
      flex: 1
    },
    mobileTopBar: {
      minHeight: 44,
      marginBottom: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    mobileModeToggle: {
      flexShrink: 0
    },
    systemHeader: {
      marginBottom: spacing.sm,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(21,35,58,0.10)",
      backgroundColor: theme.isDark ? "rgba(10,15,26,0.94)" : "rgba(255,255,255,0.76)",
      padding: tablet ? spacing.md : spacing.sm,
      gap: spacing.xs,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.18 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2
    },
    systemHeaderTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    systemHeaderCopy: {
      flex: 1,
      minWidth: 0,
      gap: 3
    },
    systemEyebrow: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      letterSpacing: 0.6,
      textTransform: "uppercase"
    },
    systemTitle: {
      color: colors.ink,
      fontSize: tablet ? 24 : 17,
      lineHeight: tablet ? 29 : 21,
      fontWeight: "900"
    },
    systemDetail: {
      color: colors.muted,
      fontSize: tablet ? 13 : 12,
      lineHeight: tablet ? 18 : 16,
      fontWeight: "700"
    },
    systemAction: {
      width: tablet ? 146 : 88,
      minHeight: tablet ? 70 : 56,
      borderRadius: radii.md,
      backgroundColor: colors.heroSurface,
      padding: spacing.sm,
      justifyContent: "center",
      gap: 3
    },
    systemActionBadge: {
      color: colors.heroMuted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    systemActionLabel: {
      color: colors.heroText,
      fontSize: tablet ? 13 : 12,
      lineHeight: tablet ? 17 : 15,
      fontWeight: "900"
    },
    systemFactRow: {
      display: tablet ? "flex" : "none",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    systemFact: {
      flex: 1,
      minWidth: 88,
      minHeight: tablet ? 64 : 50,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.12)" : "rgba(21,35,58,0.08)",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(21,35,58,0.04)",
      padding: tablet ? spacing.sm : spacing.xs,
      gap: 1
    },
    systemFactLabel: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    systemFactValue: {
      color: colors.ink,
      fontSize: tablet ? 18 : 15,
      lineHeight: tablet ? 22 : 18,
      fontWeight: "900"
    },
    systemFactDetail: {
      color: colors.muted,
      fontSize: tablet ? 11 : 10,
      lineHeight: tablet ? 14 : 12,
      fontWeight: "800"
    },
    sidebar: {
      width: 218,
      borderRightWidth: 1,
      borderRightColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(18,18,31,0.94)" : "rgba(255,255,255,0.78)",
      padding: spacing.lg,
      gap: spacing.lg
    },
    sidebarNav: {
      gap: spacing.xs
    },
    sidebarButton: {
      minHeight: 42,
      borderRadius: radii.md,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    sidebarButtonActive: {
      backgroundColor: colors.accent
    },
    sidebarLabel: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "900"
    },
    sidebarLabelActive: {
      color: colors.heroText
    },
    sidebarPro: {
      marginTop: "auto",
      borderRadius: radii.lg,
      backgroundColor: colors.accentSoft,
      padding: spacing.md,
      gap: spacing.xs
    },
    sidebarProText: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "900"
    },
    loadingScreen: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      padding: spacing.xl
    },
    loadingText: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "800"
    },
    skeletonStack: {
      width: "100%",
      maxWidth: 360,
      gap: spacing.sm
    },
    skeletonHero: {
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.elevated,
      padding: spacing.md,
      gap: spacing.sm
    },
    skeletonTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm
    },
    skeletonMetricRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    skeletonList: {
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm
    },
    skeletonBar: {
      borderRadius: radii.round,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.12)" : "#DDE6F2"
    },
    skeletonBlock: {
      flex: 1,
      height: 62,
      borderRadius: radii.lg,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.10)" : "#EEF3FA"
    },
    skeletonRow: {
      minHeight: 54,
      borderRadius: radii.lg,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.08)" : "#F3F6FB",
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    skeletonDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.accentSoft
    },
    skeletonRowCopy: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs
    },
    tabBar: {
      minHeight: 62,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(18,20,23,0.08)",
      backgroundColor: theme.isDark ? "rgba(10, 15, 26, 0.98)" : "rgba(255, 253, 244, 0.96)",
      padding: spacing.xs,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.24 : 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3
    },
    tabButton: {
      flex: 1,
      minWidth: 0,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 17,
      gap: 2
    },
    tabButtonActive: {
      backgroundColor: colors.heroSurface,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.12 : 0.04,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1
    },
    tabLabel: {
      color: colors.muted,
      fontSize: 8,
      lineHeight: 10,
      fontWeight: "900"
    },
    tabLabelActive: {
      color: colors.heroText
    },
    lockDot: {
      position: "absolute",
      top: 5,
      right: 7,
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.gold
    }
  });
}
