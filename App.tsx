import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  LogBox,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  CalendarDays,
  CalendarRange,
  Crown,
  FileScan,
  GraduationCap,
  Home,
  Settings
} from "lucide-react-native";

import {
  Assignment,
  AssignmentKind,
  AssignmentStatus,
  Course,
  GradeItem,
  NavTab,
  PlannerData,
  Semester,
  SyllabusSource,
  SyllabusParseResult
} from "./src/models";
import { AppTheme, courseColorAt } from "./src/theme";
import { AppThemeProvider, useAppTheme } from "./src/themeContext";
import { ModeToggle } from "./src/components/ModeToggle";
import { PremiumGate } from "./src/components/PremiumGate";
import { BottomDock } from "./src/components/PremiumUI";
import { isStoreCaptureEnabled } from "./src/config/storeCapture";
import { defaultCourses, defaultGradeItems, defaultSemester } from "./src/data/defaultPlanner";
import { createDemoSemesterSeed, storeCaptureNow } from "./src/data/demoSemester";
import { OnboardingScreen, OnboardingStartPath } from "./src/screens/OnboardingScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { ImportScreen } from "./src/screens/ImportScreen";
import { CoursesScreen } from "./src/screens/CoursesScreen";
import { GradesScreen } from "./src/screens/GradesScreen";
import { MonthlyCalendarScreen } from "./src/screens/MonthlyCalendarScreen";
import { WeekPlannerScreen } from "./src/screens/WeekPlannerScreen";
import { UpgradeScreen } from "./src/screens/UpgradeScreen";
import { WidgetShowcaseScreen } from "./src/screens/WidgetShowcaseScreen";
import { AssignmentDetailScreen } from "./src/screens/AssignmentDetailScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { cancelScheduledAssignmentReminders, scheduleSmartReminders } from "./src/services/reminders";
import { deleteSyncedAssignmentEvent, syncAssignmentsToDeviceCalendar } from "./src/services/calendarSync";
import { loadJson, saveJson } from "./src/services/storage";
import { SubscriptionProvider, useSubscription } from "./src/services/subscriptions";
import { WidgetSnapshotService } from "./src/services/widgetSnapshotService";
import {
  defaultWidgetPreferences,
  loadWidgetPreferences,
  saveWidgetPreferences,
  WidgetPreferences
} from "./src/services/widgetPreferences";
import {
  assignmentPatchInvalidatesSideEffects,
  sideEffectClearingPatch
} from "./src/logic/assignmentSideEffects";
import {
  isAssignmentArchived,
  isAssignmentConfirmed,
  isAssignmentNeedsReview,
  isAssignmentOpen,
  normalizeAssignment,
  normalizeAssignments,
  withAssignmentPatch
} from "./src/logic/assignmentModel";
import { dateKeyFromValue, makeDueAt } from "./src/logic/dateUtils";
import { foundWorkNeedsReviewCount, removePromotedFoundWork } from "./src/logic/foundWorkInbox";
import { buildTrustedParsedPlan } from "./src/logic/importTrust";
import { isThemePaletteId } from "./src/theme";

const plannerStorageKey = "study-planner-data-v2";

if (isStoreCaptureEnabled()) {
  LogBox.ignoreAllLogs(true);
} else {
  LogBox.ignoreLogs([
    "SafeAreaView has been deprecated",
    "SafeAreaView has been deprecated and will be removed"
  ]);
}

const tabs: Array<{
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ color: string; size: number }>;
}> = [
  { id: "today", label: "Today", icon: Home },
  { id: "calendar", label: "Calendar", icon: CalendarRange },
  { id: "week", label: "Week", icon: CalendarDays },
  { id: "courses", label: "Classes", icon: GraduationCap },
  { id: "import", label: "Scan", icon: FileScan },
  { id: "upgrade", label: "Widgets", icon: Crown }
];
const knownTabs: NavTab[] = [...tabs.map((tab) => tab.id), "grades", "settings"];

type CaptureState =
  | "calendar-filtered"
  | "duplicate-found-work"
  | "edit-found-work"
  | "imported-found-work"
  | "manual-add"
  | "parser-processing"
  | "reminders"
  | "scan-paper"
  | "upload-file"
  | "widget-empty"
  | "widget-needs-check"
  | null;

type CaptureWidgetPreview = "small" | "medium" | null;

export default function App() {
  return (
    <AppThemeProvider>
      <SubscriptionProvider>
        <AppContent />
      </SubscriptionProvider>
    </AppThemeProvider>
  );
}

function AppContent() {
  const { theme, setMode, setPalette } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const subscription = useSubscription();
  const scrollRef = useRef<ScrollView>(null);
  const storeCaptureEnabled = isStoreCaptureEnabled();
  const demoSeed = useMemo(
    () => (storeCaptureEnabled ? createDemoSemesterSeed() : null),
    [storeCaptureEnabled]
  );
  const [onboarded, setOnboarded] = useState(Boolean(demoSeed?.onboarded));
  const [paywallSeen, setPaywallSeen] = useState(Boolean(demoSeed?.paywallSeen));
  const [activeTab, setActiveTab] = useState<NavTab>("today");
  const [semester, setSemester] = useState(demoSeed?.semester || defaultSemester);
  const [courses, setCourses] = useState<Course[]>(demoSeed?.courses || defaultCourses);
  const [assignments, setAssignments] = useState<Assignment[]>(demoSeed?.assignments || []);
  const [foundWorkDraft, setFoundWorkDraft] = useState<SyllabusParseResult | null>(null);
  const [syllabusSources, setSyllabusSources] = useState<SyllabusSource[]>(
    demoSeed?.syllabusSources || []
  );
  const [gradeItems, setGradeItems] = useState(demoSeed?.gradeItems || defaultGradeItems);
  const [targetGradePercent, setTargetGradePercent] = useState(demoSeed?.targetGradePercent || 90);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [capturePaywallVisible, setCapturePaywallVisible] = useState(false);
  const [captureState, setCaptureState] = useState<CaptureState>(null);
  const [captureThemeMode, setCaptureThemeMode] = useState<"light" | "dark">("light");
  const [captureWidgetPreview, setCaptureWidgetPreview] = useState<CaptureWidgetPreview>(null);
  const [widgetPreferences, setWidgetPreferences] = useState<WidgetPreferences>(defaultWidgetPreferences);
  const [widgetPreferencesHydrated, setWidgetPreferencesHydrated] = useState(storeCaptureEnabled);
  const [hydrated, setHydrated] = useState(false);
  const [automationBusy, setAutomationBusy] = useState<"reminders" | "calendar" | null>(null);

  useEffect(() => {
    if (storeCaptureEnabled && theme.mode !== captureThemeMode) {
      setMode(captureThemeMode);
    }
  }, [captureThemeMode, setMode, storeCaptureEnabled, theme.mode]);

  useEffect(() => {
    if (storeCaptureEnabled) {
      setWidgetPreferences(defaultWidgetPreferences);
      setWidgetPreferencesHydrated(true);
      return;
    }

    let mounted = true;
    setWidgetPreferencesHydrated(false);

    loadWidgetPreferences().then((preferences) => {
      if (!mounted) return;
      setWidgetPreferences(preferences);
      setWidgetPreferencesHydrated(true);
    });

    return () => {
      mounted = false;
    };
  }, [storeCaptureEnabled]);

  const activeAssignments = useMemo(
    () => assignments.filter((item) => !isAssignmentArchived(item)),
    [assignments]
  );
  const widgetSnapshotAssignments = useMemo(
    () => widgetAssignmentsForCapture(activeAssignments, captureState),
    [activeAssignments, captureState]
  );
  const confirmedAssignments = useMemo(
    () => activeAssignments.filter((item) => isAssignmentConfirmed(item)),
    [activeAssignments]
  );
  const foundWorkReviewQueueCount = foundWorkDraft
    ? foundWorkNeedsReviewCount(foundWorkDraft)
    : undefined;
  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId),
    [assignments, selectedAssignmentId]
  );

  const openTab = (tab: NavTab) => {
    setSelectedAssignmentId(null);
    setCapturePaywallVisible(false);
    setCaptureState(null);
    setCaptureWidgetPreview(null);
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  useEffect(() => {
    if (!storeCaptureEnabled) return;

    const openCaptureUrl = (url: string | null) => {
      if (!url || !url.includes("capture")) return;
      const match = /[?&]tab=([^&]+)/.exec(url);
      const requestedTabRaw = match?.[1] ? decodeURIComponent(match[1]) : null;
      const stepMatch = /[?&]step=([0-9]+)/.exec(url);
      const requestedStep = stepMatch?.[1] ? Number(stepMatch[1]) : 0;
      const stateMatch = /[?&]state=([^&]+)/.exec(url);
      const requestedCaptureState = captureStateFromQuery(
        stateMatch?.[1] ? decodeURIComponent(stateMatch[1]) : null
      );
      const modeMatch = /[?&](?:mode|theme)=([^&]+)/.exec(url);
      const requestedThemeMode =
        modeMatch?.[1] && decodeURIComponent(modeMatch[1]) === "dark" ? "dark" : "light";
      const paletteMatch = /[?&]palette=([^&]+)/.exec(url);
      const requestedPaletteId = paletteMatch?.[1] ? decodeURIComponent(paletteMatch[1]) : null;
      if (requestedPaletteId && isThemePaletteId(requestedPaletteId)) {
        setPalette(requestedPaletteId);
      }
      const widgetMatch = /[?&]widget=([^&]+)/.exec(url);
      const requestedWidgetPreview =
        widgetMatch?.[1] && decodeURIComponent(widgetMatch[1]) === "small"
          ? "small"
          : widgetMatch?.[1] && decodeURIComponent(widgetMatch[1]) === "medium"
            ? "medium"
            : null;

      if (requestedTabRaw === "onboarding") {
        setCaptureThemeMode(requestedThemeMode);
        setSelectedAssignmentId(null);
        setCapturePaywallVisible(false);
        setCaptureState(requestedCaptureState);
        setCaptureWidgetPreview(requestedWidgetPreview);
        setOnboardingStep(requestedStep);
        setOnboarded(false);
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
        return;
      }

      if (requestedTabRaw === "paywall") {
        setCaptureThemeMode(requestedThemeMode);
        setSelectedAssignmentId(null);
        setCaptureState(requestedCaptureState);
        setCaptureWidgetPreview(requestedWidgetPreview);
        setOnboarded(true);
        setCapturePaywallVisible(true);
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
        return;
      }

      const requestedTab = (requestedTabRaw === "focus" ? "calendar" : requestedTabRaw) as NavTab | null;
      if (!requestedTab || !knownTabs.includes(requestedTab)) return;
      const scrollMatch = /[?&](?:scroll|y)=([0-9]+)/.exec(url);
      const scrollY = scrollMatch?.[1] ? Number(scrollMatch[1]) : 0;
      const assignmentMatch = /[?&]assignment=([^&]+)/.exec(url);
      const requestedAssignmentId = assignmentMatch?.[1] ? decodeURIComponent(assignmentMatch[1]) : null;
      setCaptureThemeMode(requestedThemeMode);
      setSelectedAssignmentId(requestedAssignmentId);
      setCaptureState(requestedCaptureState);
      setCaptureWidgetPreview(requestedWidgetPreview);
      setCapturePaywallVisible(false);
      setOnboarded(true);
      setActiveTab(requestedTab);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: scrollY, animated: false }));
    };

    Linking.getInitialURL().then(openCaptureUrl).catch(() => undefined);
    const subscription = Linking.addEventListener("url", ({ url }) => openCaptureUrl(url));
    return () => subscription.remove();
  }, [setPalette, storeCaptureEnabled]);

  useEffect(() => {
    let mounted = true;

    if (demoSeed) {
      setOnboarded(demoSeed.onboarded);
      setPaywallSeen(demoSeed.paywallSeen);
      setSemester(demoSeed.semester);
      setCourses(demoSeed.courses);
      setAssignments(demoSeed.assignments);
      setFoundWorkDraft(null);
      setSyllabusSources(demoSeed.syllabusSources);
      setGradeItems(demoSeed.gradeItems);
      setTargetGradePercent(demoSeed.targetGradePercent);
      setHydrated(true);
      return () => {
        mounted = false;
      };
    }

    loadJson<PlannerData>(plannerStorageKey).then((stored) => {
      if (!mounted) return;

      if (stored) {
        setOnboarded(Boolean(stored.onboarded));
        setPaywallSeen(Boolean(stored.paywallSeen));
        setSemester(stored.semester || defaultSemester);
        setCourses(stored.courses || []);
        setAssignments(normalizeAssignments(stored.assignments || [], stored.courses || []));
        setFoundWorkDraft(stored.foundWorkDraft || null);
        setSyllabusSources(stored.syllabusSources || []);
        setGradeItems(stored.gradeItems || []);
        setTargetGradePercent(stored.targetGradePercent || 90);
      }

      setHydrated(true);
    });

    return () => {
      mounted = false;
    };
  }, [demoSeed]);

  useEffect(() => {
    if (!hydrated || storeCaptureEnabled) return;

    saveJson<PlannerData>(plannerStorageKey, {
      onboarded,
      paywallSeen,
      semester,
      courses,
      assignments,
      foundWorkDraft,
      gradeItems,
      syllabusSources,
      targetGradePercent
    });
  }, [
    assignments,
    courses,
    foundWorkDraft,
    gradeItems,
    hydrated,
    onboarded,
    paywallSeen,
    semester,
    syllabusSources,
    storeCaptureEnabled,
    targetGradePercent
  ]);

  useEffect(() => {
    if (!hydrated || !widgetPreferencesHydrated || storeCaptureEnabled) return;
    void saveWidgetPreferences(widgetPreferences).catch(() => undefined);
  }, [hydrated, storeCaptureEnabled, widgetPreferences, widgetPreferencesHydrated]);

  useEffect(() => {
    if (!hydrated) return;
    void WidgetSnapshotService.write(
      {
        semester,
        courses,
        assignments: widgetSnapshotAssignments,
        paletteId: theme.palette.id,
        widgetStyleId: widgetPreferences.styleId,
        courseFocusId: widgetPreferences.courseFocusId,
        layoutId: widgetPreferences.layoutId,
        reviewQueueCount: foundWorkReviewQueueCount,
        demoState: storeCaptureEnabled
          ? {
              enabled: true,
              label: "Preview"
            }
          : undefined
      },
      storeCaptureEnabled ? storeCaptureNow : new Date()
    ).catch(() => undefined);
  }, [
    courses,
    hydrated,
    foundWorkDraft,
    foundWorkReviewQueueCount,
    semester,
    storeCaptureEnabled,
    theme.palette.id,
    widgetSnapshotAssignments,
    widgetPreferences.courseFocusId,
    widgetPreferences.layoutId,
    widgetPreferences.styleId
  ]);

  useEffect(() => {
    if (subscription.isPremium && !paywallSeen) {
      setPaywallSeen(true);
    }
  }, [paywallSeen, subscription.isPremium]);

  const applyParsedPlan = (parse: SyllabusParseResult) => {
    const trustedPlan = buildTrustedParsedPlan(parse);
    if (!trustedPlan) {
      Alert.alert(
        "Check work first",
        "Mark at least one found assignment as Looks Good before adding it to your planner."
      );
      return;
    }

    setCourses((current) => mergeById(current, trustedPlan.courses));
    setAssignments((current) => mergeAssignments(current, trustedPlan.assignments));
    setFoundWorkDraft((current) => removePromotedFoundWork(current || parse, trustedPlan.assignments));
    setGradeItems((current) => mergeById(current, trustedPlan.gradeItems));
    setSyllabusSources((current) =>
      mergeById(current, [trustedPlan.syllabusSource])
    );
    openTab("today");
  };

  const updateAssignmentStatus = (
    assignmentId: string,
    status: Exclude<AssignmentStatus, "archived">
  ) => {
    const currentAssignment = assignments.find((assignment) => assignment.id === assignmentId);
    if (currentAssignment && assignmentPatchInvalidatesSideEffects({ status })) {
      cleanupAssignmentSideEffects(currentAssignment);
    }

    setAssignments((current) =>
      current.map((assignment) =>
        assignment.id === assignmentId
          ? withAssignmentPatch(assignment, sideEffectClearingPatch({ status }), courses)
          : assignment
      )
    );
  };

  const toggleAssignmentDone = (assignmentId: string) => {
    const assignment = assignments.find((item) => item.id === assignmentId);
    const nextStatus =
      assignment && (assignment.status === "done" || assignment.completionStatus === "completed")
        ? "not_started"
        : "done";
    updateAssignmentStatus(assignmentId, nextStatus);
  };

  const addQuickAssignment = (
    courseId: string,
    title: string,
    dueDate: string,
    kind: AssignmentKind
  ) => {
    if (!title.trim() || !dueDate.trim()) {
      Alert.alert("Add a little more", "Title and due date are both needed.");
      return;
    }

    const dueAt = makeDueAt(dueDate.trim());
    if (!dueAt) {
      Alert.alert("Check the date", "Use a real date like 2026-09-18.");
      return;
    }

    setAssignments((current) => [
      ...current,
      normalizeAssignment({
        id: `manual-${Date.now()}`,
        courseId,
        courseName: courses.find((course) => course.id === courseId)?.name || "Course",
        title: title.trim(),
        type: kind,
        kind,
        dueAt,
        sourceText: title.trim(),
        confidence: 1,
        reviewStatus: "accepted",
        completionStatus: "open",
        reminderPreset: kind === "exam" ? "week_before" : "day_before",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: kind === "exam" ? ["exam"] : ["homework"],
        priority: kind === "exam" ? "high" : "medium",
        estimatedMinutes: kind === "exam" ? 150 : 60,
        status: "not_started",
        source: "manual"
      }, courses)
    ]);
  };

  const updateSemester = (patch: Partial<Semester>) => {
    setSemester((current) => ({ ...current, ...patch }));
  };

  const addCourse = (course: Pick<Course, "code" | "name" | "instructor"> & { color?: string }) => {
    if (!course.code.trim() || !course.name.trim()) {
      Alert.alert("Add course details", "Course code and course name are both needed.");
      return;
    }

    const id = `course-${Date.now()}`;
    setCourses((current) => [
      ...current,
      {
        id,
        code: course.code.trim(),
        name: course.name.trim(),
        instructor: course.instructor?.trim(),
        color: course.color || courseColorAt(current.length),
        meetings: [],
        gradeCategories: [
          { id: `${id}-assignments`, name: "Assignments", weight: 40 },
          { id: `${id}-exams`, name: "Exams", weight: 40 },
          { id: `${id}-participation`, name: "Participation", weight: 20 }
        ]
      }
    ]);
  };

  const updateCourse = (courseId: string, patch: Partial<Course>) => {
    setCourses((current) =>
      current.map((course) => (course.id === courseId ? { ...course, ...patch } : course))
    );
  };

  const updateAssignment = (assignmentId: string, patch: Partial<Assignment>) => {
    const currentAssignment = assignments.find((assignment) => assignment.id === assignmentId);
    const safePatch = sideEffectClearingPatch(patch);
    if (currentAssignment && assignmentPatchInvalidatesSideEffects(patch)) {
      cleanupAssignmentSideEffects(currentAssignment);
    }

    setAssignments((current) =>
      current.map((assignment) =>
        assignment.id === assignmentId ? withAssignmentPatch(assignment, safePatch, courses) : assignment
      )
    );
  };

  const archiveAssignment = (assignmentId: string) => {
    updateAssignment(assignmentId, { status: "archived", reviewStatus: "ignored" });
    setSelectedAssignmentId(null);
  };

  const cleanupAssignmentSideEffects = (assignment: Assignment) => {
    void cancelScheduledAssignmentReminders(assignment.reminderIds).catch(() => undefined);
    void deleteSyncedAssignmentEvent(assignment.externalCalendarEventId).catch(() => undefined);
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

  const handleScheduleReminders = async () => {
    if (!subscription.isPremium) {
      openTab("upgrade");
      return;
    }

    if (automationBusy) return;
    setAutomationBusy("reminders");
    try {
      const { count, reminderIdsByAssignment } = await scheduleSmartReminders(
        confirmedAssignments,
        courses
      );
      setAssignments((current) =>
        current.map((assignment) => {
          const newReminderIds = reminderIdsByAssignment[assignment.id];
          return newReminderIds
            ? withAssignmentPatch(assignment, {
                reminderIds: [...(assignment.reminderIds || []), ...newReminderIds]
              }, courses)
            : assignment;
        })
      );
      Alert.alert("Reminders queued", `${count} smart reminders were scheduled.`);
    } catch (error) {
      Alert.alert("Reminder setup paused", messageFromError(error));
    } finally {
      setAutomationBusy(null);
    }
  };

  const handleCalendarSync = async () => {
    if (!subscription.isPremium) {
      openTab("upgrade");
      return;
    }

    if (automationBusy) return;
    setAutomationBusy("calendar");
    try {
      const { count, calendarEventIdsByAssignment } = await syncAssignmentsToDeviceCalendar(
        confirmedAssignments,
        courses
      );
      setAssignments((current) =>
        current.map((assignment) =>
          calendarEventIdsByAssignment[assignment.id]
            ? withAssignmentPatch(assignment, {
                externalCalendarEventId: calendarEventIdsByAssignment[assignment.id]
              }, courses)
            : assignment
        )
      );
      Alert.alert("Calendar synced", `${count} deadlines were sent to your device calendar.`);
    } catch (error) {
      Alert.alert("Calendar sync paused", messageFromError(error));
    } finally {
      setAutomationBusy(null);
    }
  };

  const finishOnboarding = (path?: OnboardingStartPath) => {
    setOnboardingStep(0);
    setOnboarded(true);
    setPaywallSeen(true);

    if (path === "sample") {
      const sample = createDemoSemesterSeed();
      setSemester(sample.semester);
      setCourses(sample.courses);
      setAssignments(sample.assignments);
      setFoundWorkDraft(null);
      setSyllabusSources(sample.syllabusSources);
      setGradeItems(sample.gradeItems);
      setTargetGradePercent(sample.targetGradePercent);
      setActiveTab("today");
      return;
    }

    if (path === "scan" || path === "upload" || path === "type") {
      setActiveTab("import");
      return;
    }

    if (path === "manual") {
      setActiveTab("courses");
      return;
    }

    setActiveTab("today");
  };

  const premiumLocked =
    !storeCaptureEnabled && (subscription.status !== "ready" || !subscription.isPremium);
  const showInitialPaywall =
    hydrated &&
    onboarded &&
    !paywallSeen &&
    !subscription.isPremium &&
    !storeCaptureEnabled &&
    subscription.status !== "checking";

  if (!hydrated) {
    return <LoadingScreen label="Loading Study Planner" />;
  }

  if (!onboarded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={theme.isDark ? "light" : "dark"} />
        <OnboardingScreen
          initialStep={storeCaptureEnabled ? onboardingStep : undefined}
          onFinish={finishOnboarding}
        />
      </SafeAreaView>
    );
  }

  if (!paywallSeen && !subscription.isPremium && subscription.status === "checking") {
    return <LoadingScreen label="Checking Plus access" />;
  }

  if (showInitialPaywall) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={theme.isDark ? "light" : "dark"} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <UpgradeScreen onContinueFree={() => setPaywallSeen(true)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <View style={styles.appShell}>
        {!storeCaptureEnabled ? (
          <View style={styles.topActions}>
            <ModeToggle />
            <TopIconButton label="Settings" onPress={() => openTab("settings")}>
              <Settings color={theme.colors.accent} size={16} />
            </TopIconButton>
          </View>
        ) : null}
        <ScrollView
          ref={scrollRef}
          style={styles.scrollArea}
          contentContainerStyle={[styles.content, storeCaptureEnabled ? styles.captureContent : null]}
          showsVerticalScrollIndicator={false}
        >
          {selectedAssignment ? (
            <AssignmentDetailScreen
              assignment={selectedAssignment}
              courses={courses}
              onClose={() => setSelectedAssignmentId(null)}
              onSave={(patch) => updateAssignment(selectedAssignment.id, patch)}
              onArchive={() => archiveAssignment(selectedAssignment.id)}
            />
          ) : capturePaywallVisible ? (
            <UpgradeScreen onContinueFree={() => setCapturePaywallVisible(false)} />
          ) : (
            <>
              {activeTab === "today" ? (
                <TodayScreen
                  assignments={activeAssignments}
                  courses={courses}
                  semester={semester}
                  needsReviewCount={foundWorkReviewQueueCount}
                  onUpdateStatus={updateAssignmentStatus}
                  onToggleDone={toggleAssignmentDone}
                  onOpenAssignment={setSelectedAssignmentId}
                  onScheduleReminders={handleScheduleReminders}
                  onCalendarSync={handleCalendarSync}
                  onOpenImport={() => openTab("import")}
                  onOpenWeek={() => openTab("week")}
                  onOpenCalendar={() => openTab("calendar")}
                  widgetStyleId={widgetPreferences.styleId}
                  premiumAutomationLocked={premiumLocked}
                  automationBusy={automationBusy}
                  onOpenPaywall={() => openTab("upgrade")}
                  captureState={captureState}
                />
              ) : null}
              {activeTab === "import" ? (
                premiumLocked ? (
                  <PremiumGate
                    title="Scan a syllabus into your planner."
                    copy="Plus is required before syllabus scan opens."
                    onUpgrade={() => openTab("upgrade")}
                  />
                ) : (
                  <ImportScreen
                    captureState={captureState}
                    foundWorkDraft={foundWorkDraft}
                    onFoundWorkDraftChange={setFoundWorkDraft}
                    onApplyParsedPlan={applyParsedPlan}
                  />
                )
              ) : null}
              {activeTab === "courses" ? (
                <CoursesScreen
                  semester={semester}
                  courses={courses}
                  assignments={activeAssignments}
                  syllabusSources={syllabusSources}
                  onAddQuickAssignment={addQuickAssignment}
                  onOpenAssignment={setSelectedAssignmentId}
                  onUpdateStatus={updateAssignmentStatus}
                  onUpdateSemester={updateSemester}
                  onAddCourse={addCourse}
                  onUpdateCourse={updateCourse}
                  onOpenGrades={() => openTab("grades")}
                  captureState={captureState}
                />
              ) : null}
              {activeTab === "grades" ? (
                premiumLocked ? (
                  <PremiumGate
                    title="Forecast grades before finals week."
                    copy="Plus unlocks weighted grade tracking and target-score planning."
                    onUpgrade={() => openTab("upgrade")}
                  />
                ) : (
                  <GradesScreen
                    courses={courses}
                    assignments={activeAssignments}
                    gradeItems={gradeItems}
                    targetGradePercent={targetGradePercent}
                    onTargetGradeChange={setTargetGradePercent}
                    onAddGradeItem={addGradeItem}
                    onUpdateGradeItem={updateGradeItem}
                  />
                )
              ) : null}
              {activeTab === "calendar" ? (
                <MonthlyCalendarScreen
                  semester={semester}
                  assignments={activeAssignments}
                  courses={courses}
                  onUpdateStatus={updateAssignmentStatus}
                  onToggleDone={toggleAssignmentDone}
                  onOpenAssignment={setSelectedAssignmentId}
                  captureState={captureState}
                />
              ) : null}
              {activeTab === "week" ? (
                <WeekPlannerScreen
                  semester={semester}
                  assignments={activeAssignments}
                  courses={courses}
                  onUpdateStatus={updateAssignmentStatus}
                  onToggleDone={toggleAssignmentDone}
                  onOpenAssignment={setSelectedAssignmentId}
                />
              ) : null}
              {activeTab === "upgrade" ? (
                <WidgetShowcaseScreen
                  semester={semester}
                  courses={courses}
                  assignments={widgetSnapshotAssignments}
                  reviewQueueCount={foundWorkReviewQueueCount}
                  captureWidgetPreview={captureWidgetPreview}
                  preferences={widgetPreferences}
                  captureState={captureState}
                  onPreferencesChange={setWidgetPreferences}
                />
              ) : null}
              {activeTab === "settings" ? (
                <SettingsScreen
                  semester={semester}
                  courses={courses}
                  assignments={activeAssignments}
                  needsReviewCount={foundWorkReviewQueueCount}
                  onOpenImport={() => openTab("import")}
                  onOpenPaywall={() => openTab("upgrade")}
                  onOpenWidgetSetup={() => openTab("upgrade")}
                />
              ) : null}
            </>
          )}
        </ScrollView>

        <View style={styles.dockWrap}>
          <BottomDock tabs={tabs} activeTab={activeTab} onSelect={openTab} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function captureStateFromQuery(value: string | null): CaptureState {
  if (value === "calendar-filtered" || value === "filtered-class") return "calendar-filtered";
  if (value === "duplicate-found-work" || value === "duplicate") return "duplicate-found-work";
  if (value === "edit-found-work" || value === "edit") return "edit-found-work";
  if (value === "imported-found-work" || value === "imported") return "imported-found-work";
  if (value === "manual-add" || value === "manual") return "manual-add";
  if (value === "parser-processing" || value === "processing") return "parser-processing";
  if (value === "reminders" || value === "reminder") return "reminders";
  if (value === "scan-paper" || value === "scan") return "scan-paper";
  if (value === "upload-file" || value === "upload") return "upload-file";
  if (value === "widget-empty" || value === "empty-widget") return "widget-empty";
  if (value === "widget-needs-check" || value === "needs-check-widget") return "widget-needs-check";
  return null;
}

function widgetAssignmentsForCapture(assignments: Assignment[], captureState: CaptureState) {
  if (captureState === "widget-empty") return [];

  if (captureState === "widget-needs-check") {
    const confirmed =
      assignments.find((assignment) => assignment.id === "lab-report" && isAssignmentOpen(assignment)) ||
      assignments.find(isAssignmentOpen);
    const needsReview = assignments.filter(isAssignmentNeedsReview).slice(0, 3);
    return confirmed ? [confirmed, ...needsReview] : needsReview;
  }

  return assignments;
}

function LoadingScreen({ label }: { label: string }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.loadingText}>{label}</Text>
      </View>
    </SafeAreaView>
  );
}

function TopIconButton({
  label,
  children,
  onPress
}: {
  label: string;
  children: React.ReactNode;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.82}
      style={styles.topIconButton}
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  );
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const existing = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => existing.set(item.id, item));
  return Array.from(existing.values());
}

function mergeAssignments(current: Assignment[], incoming: Assignment[]) {
  const merged = [...current];
  incoming.forEach((assignment) => {
    const existingIndex = merged.findIndex(
      (item) => item.id === assignment.id || assignmentFingerprint(item) === assignmentFingerprint(assignment)
    );
    if (existingIndex >= 0) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        ...assignment,
        id: merged[existingIndex]?.id || assignment.id
      };
    } else {
      merged.push(assignment);
    }
  });
  return merged;
}

function assignmentFingerprint(assignment: Assignment) {
  return [
    assignment.courseId,
    assignment.title.trim().toLowerCase(),
    dateKeyFromValue(assignment.dueAt) || assignment.dueAt
  ].join("|");
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : "The device permission flow did not complete.";
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvasTint,
      overflow: "hidden"
    },
    appShell: {
      flex: 1,
      backgroundColor: colors.canvas,
      overflow: "hidden"
    },
    topActions: {
      position: "absolute",
      top: spacing.sm,
      right: spacing.lg,
      zIndex: 2,
      flexDirection: "row",
      gap: spacing.xs,
      alignItems: "center"
    },
    topIconButton: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.elevated,
      alignItems: "center",
      justifyContent: "center"
    },
    content: {
      width: "100%",
      paddingHorizontal: 16,
      paddingTop: 22,
      paddingBottom: 176
    },
    captureContent: {
      paddingTop: 22,
      paddingBottom: 190
    },
    scrollArea: {
      flex: 1
    },
    loadingScreen: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm
    },
    loadingText: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "800"
    },
    dockWrap: {
      position: "absolute",
      left: 14,
      right: 14,
      bottom: 14
    }
  });
}
