import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
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
  Sparkles,
  Timer
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
  SyllabusParseResult,
  UserSettings,
  WidgetPreset
} from "./src/models";
import { AppTheme } from "./src/theme";
import { AppThemeProvider, useAppTheme } from "./src/themeContext";
import { AppLogo } from "./src/components/AppleComponents";
import {
  defaultAssignments,
  defaultCourses,
  defaultFocusSessions,
  defaultGradeItems,
  defaultSemester,
  defaultSettings,
  defaultWidgetPresets
} from "./src/data/defaultPlanner";
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
import {
  completeAssignment,
  isValidDateInput,
  saveWidgetPreset as saveWidgetPresetState
} from "./src/logic/planner";
import { scheduleSmartReminders } from "./src/services/reminders";
import { syncAssignmentsToDeviceCalendar } from "./src/services/calendarSync";
import { loadJson, saveJson } from "./src/services/storage";
import { SubscriptionProvider, useSubscription } from "./src/services/subscriptions";
import { recordReviewEvent } from "./src/services/reviewPrompt";
import { syncStudyPlannerWidgets } from "./src/services/widgetSnapshot";
import type { WidgetSyncStatus } from "./src/services/widgetSnapshot";
import {
  getMarketingCaptureInitialTab,
  getMarketingCaptureScrollY,
  marketingCaptureAssignments,
  marketingCaptureCourses,
  marketingCaptureEnabled,
  marketingCaptureGradeItems,
  marketingCaptureSemester
} from "./src/services/marketingCapture";

const plannerStorageKey = "study-planner-data-v3";
const freeCourseLimit = 2;
const freeAssignmentLimit = 12;
const freeImportLimit = 1;
const marketingCaptureTabFileName = "studyplanner-capture-tab.json";
const premiumTabs = new Set<NavTab>(["focus", "grades"]);

const proTabs: Array<{
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ color: string; size: number }>;
}> = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "import", label: "Scan", icon: FileScan },
  { id: "plan", label: "Plan", icon: CalendarDays },
  { id: "courses", label: "Classes", icon: GraduationCap },
  { id: "more", label: "Widgets", icon: Sparkles }
];

const freeTabs: typeof proTabs = proTabs;

function parseCaptureTab(raw: string): NavTab | null {
  try {
    const value = JSON.parse(raw) as { tab?: unknown };
    return isCaptureNavTab(value.tab) ? value.tab : null;
  } catch {
    const trimmed = raw.trim();
    return isCaptureNavTab(trimmed) ? trimmed : null;
  }
}

function isCaptureNavTab(value: unknown): value is NavTab {
  return (
    value === "today" ||
    value === "import" ||
    value === "plan" ||
    value === "courses" ||
    value === "more" ||
    value === "focus" ||
    value === "grades" ||
    value === "upgrade"
  );
}

function routeTabFromUrl(url: string): NavTab | null {
  if (url.includes("widgets") || url.includes("widget-studio")) return "more";
  if (url.includes("scan") || url.includes("import")) return "import";
  if (url.includes("plan")) return "plan";
  if (url.includes("classes") || url.includes("courses")) return "courses";
  if (url.includes("focus")) return "focus";
  if (url.includes("grades")) return "grades";
  if (url.includes("plus") || url.includes("upgrade")) return "upgrade";
  if (url.includes("today")) return "today";
  return null;
}

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
  const { theme, setAccent } = useAppTheme();
  const { colors } = theme;
  const { width } = useWindowDimensions();
  const tablet = width >= 760;
  const styles = useMemo(() => createStyles(theme, tablet), [theme, tablet]);
  const subscription = useSubscription();
  const scrollRef = useRef<ScrollView>(null);
  const [onboarded, setOnboarded] = useState(marketingCaptureEnabled);
  const [paywallSeen, setPaywallSeen] = useState(marketingCaptureEnabled);
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
  const [demoMode, setDemoMode] = useState(false);
  const [importHandoff, setImportHandoff] = useState<ImportHandoffSummary | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [focusAssignmentId, setFocusAssignmentId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [nativeWidgetStatus, setNativeWidgetStatus] = useState<WidgetSyncStatus>({
    state: "idle",
    message: "Native widgets sync after your planner loads."
  });

  const activeAssignments = useMemo(
    () => assignments.filter((item) => item.status !== "archived"),
    [assignments]
  );
  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId),
    [assignments, selectedAssignmentId]
  );
  const visibleTabs = marketingCaptureEnabled || subscription.isPremium ? proTabs : freeTabs;

  useEffect(() => {
    if (!hydrated) return;
    setAccent(settings.appTheme || "campus");
  }, [hydrated, setAccent, settings.appTheme]);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof __DEV__ === "undefined" || !__DEV__) return;
    if (!Paths.document) return;

    let mounted = true;
    const captureTabFile = new File(Paths.document, marketingCaptureTabFileName);

    captureTabFile.text()
      .then((raw) => {
        if (!mounted) return;
        const requestedTab = parseCaptureTab(raw);
        if (!requestedTab) return;

        setOnboarded(true);
        setPaywallSeen(true);
        if (!courses.length) setCourses(marketingCaptureCourses);
        if (!assignments.length) setAssignments(marketingCaptureAssignments);
        if (!gradeItems.length) setGradeItems(marketingCaptureGradeItems);
        setSemester(marketingCaptureSemester);
        setSelectedAssignmentId(null);
        setFocusAssignmentId(null);
        setActiveTab(requestedTab);
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [assignments.length, courses.length, gradeItems.length, hydrated]);

  const openTab = (tab: NavTab) => {
    if (!marketingCaptureEnabled && premiumTabs.has(tab) && !subscription.isPremium) {
      setSelectedAssignmentId(null);
      setActiveTab("upgrade");
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      return;
    }

    setSelectedAssignmentId(null);
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const openFocusForAssignment = (assignmentId?: string) => {
    if (!marketingCaptureEnabled && !subscription.isPremium) {
      openTab("upgrade");
      return;
    }

    setSelectedAssignmentId(null);
    setFocusAssignmentId(assignmentId || selectedAssignmentId);
    setActiveTab("focus");
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

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
        setOnboarded(Boolean(stored.onboarded));
        setPaywallSeen(Boolean(stored.paywallSeen));
        setSemester(stored.semester || defaultSemester);
        setCourses(stored.courses || []);
        setAssignments(stored.assignments || []);
        setGradeItems(stored.gradeItems || []);
        setTargetGradePercent(stored.targetGradePercent || 90);
        setSettings({ ...defaultSettings, ...(stored.settings || {}), onboardingComplete: Boolean(stored.onboarded) });
        setParsedImports(stored.parsedImports || []);
        setParsedItems(stored.parsedItems || []);
        setWidgetPresets(stored.widgetPresets?.length ? stored.widgetPresets : defaultWidgetPresets);
        setFocusSessions(stored.focusSessions || []);
        setDemoMode(Boolean(stored.demoMode));
      }

      setHydrated(true);
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
      demoMode
    };

    void saveJson<PlannerData>(plannerStorageKey, nextPlannerData);
    void syncStudyPlannerWidgets({
      semester,
      courses,
      assignments,
      parsedImports,
      demoMode
    }).then(setNativeWidgetStatus);
  }, [
    assignments,
    courses,
    focusSessions,
    gradeItems,
    hydrated,
    demoMode,
    onboarded,
    parsedImports,
    parsedItems,
    paywallSeen,
    semester,
    settings,
    targetGradePercent,
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
      demoMode: true
    }).then(setNativeWidgetStatus);
  }, [hydrated, semester]);

  useEffect(() => {
    if (marketingCaptureEnabled) return;
    if (subscription.isPremium && !paywallSeen) {
      setPaywallSeen(true);
    }
  }, [paywallSeen, subscription.isPremium]);

  useEffect(() => {
    if (!marketingCaptureEnabled || !hydrated) return;

    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: getMarketingCaptureScrollY(), animated: false });
    }, 450);

    return () => clearTimeout(timeout);
  }, [activeTab, hydrated]);

  const applyParsedPlan = (parse: SyllabusParseResult) => {
    const timestamp = new Date().toISOString();
    const parsedAssignmentIds = new Set(
      parse.assignments.map((assignment) => assignment.sourceId).filter(Boolean)
    );
    setCourses((current) => mergeById(current, parse.courses));
    setAssignments((current) =>
      mergeById(
        current,
        parse.assignments.map((assignment) => ({
          ...assignment,
          type: assignment.type || assignment.kind,
          sourceId: assignment.sourceId || `import-${timestamp}`,
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
        const reviewDelta = Number(Boolean(b.needsReview || !isValidDateInput(b.dueAt.slice(0, 10)))) - Number(Boolean(a.needsReview || !isValidDateInput(a.dueAt.slice(0, 10))));
        if (reviewDelta !== 0) return reviewDelta;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      });
    const handoffAssignment = handoffAssignments[0];
    setImportHandoff({
      sourceName: parse.sourceName,
      addedCount: parse.assignments.length,
      reviewCount: parse.assignments.filter((assignment) => assignment.needsReview || !isValidDateInput(assignment.dueAt.slice(0, 10))).length,
      nextTitle: handoffAssignment?.title,
      nextAssignmentId: handoffAssignment?.id
    });
    setParsedImports((current) => {
      const existing = current.find((item) => item.title === parse.sourceName);
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
          id: `import-${timestamp}`,
          title: parse.sourceName,
          sourceType: "scan",
          status: "applied",
          itemCount,
          createdAt: timestamp,
          updatedAt: timestamp
        },
        ...current
      ];
    });
    setParsedItems((current) =>
      current.map((item) =>
        parsedAssignmentIds.has(item.parsedImportId)
          ? { ...item, acceptedAt: timestamp, reviewStatus: "accepted" }
          : item
      )
    );
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

  const updateAssignmentStatus = (
    assignmentId: string,
    status: Exclude<AssignmentStatus, "archived">
  ) => {
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
      void recordReviewEvent("assignment_completed");
    }
  };

  const addQuickAssignment = (
    courseId: string,
    title: string,
    dueDate: string,
    kind: AssignmentKind
  ) => {
    if (!marketingCaptureEnabled && !subscription.isPremium && activeAssignments.length >= freeAssignmentLimit) {
      Alert.alert("Free planner limit reached", `Free includes ${freeAssignmentLimit} homework items. Plus expands planning volume, reminders, focus, widgets, and grade tools.`, [
        { text: "Not now", style: "cancel" },
        { text: "See Plus", onPress: () => openTab("upgrade") }
      ]);
      return false;
    }

    if (!title.trim() || !dueDate.trim()) {
      Alert.alert("Add a little more", "Title and due date are both needed.");
      return false;
    }

    const cleanDueDate = dueDate.trim();

    if (!isValidDateInput(cleanDueDate)) {
      Alert.alert("Check the date", "Use a real date in YYYY-MM-DD format before adding this work.");
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
    if (!marketingCaptureEnabled && !subscription.isPremium && courses.length >= freeCourseLimit) {
      Alert.alert("Free planner limit reached", `Free includes ${freeCourseLimit} classes. Plus unlocks more classes, semesters, scans, and automation.`, [
        { text: "Not now", style: "cancel" },
        { text: "See Plus", onPress: () => openTab("upgrade") }
      ]);
      return;
    }

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
        teacher: course.instructor?.trim(),
        period: `Period ${current.length + 1}`,
        room: "Room TBD",
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
    setSettings((current) => ({ ...current, ...patch }));
  };

  const saveWidgetPreset = (preset: WidgetPreset) => {
    setWidgetPresets((current) => saveWidgetPresetState(current, preset));
    void recordReviewEvent("widget_saved");
  };

  const resetWidgetPresets = () => {
    setWidgetPresets(defaultWidgetPresets);
  };

  const startWithDemoPlanner = (settingsPatch?: Partial<UserSettings>) => {
    const demo = buildDemoPlannerData();
    setSemester(demo.semester);
    setCourses(demo.courses);
    setAssignments(demo.assignments);
    setGradeItems(demo.gradeItems);
    setParsedImports([]);
    setParsedItems([]);
    setWidgetPresets(defaultWidgetPresets);
    setFocusSessions(demo.focusSessions);
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
    setPaywallSeen(true);
    setActiveTab("today");
  };

  const finishOnboarding = (
    destination: OnboardingDestination,
    settingsPatch?: Partial<UserSettings>
  ) => {
    if (destination === "demo") {
      startWithDemoPlanner(settingsPatch);
      return;
    }

    setSettings((current) => ({ ...current, ...settingsPatch }));
    setOnboarded(true);
    setPaywallSeen(true);
    setDemoMode(false);
    setActiveTab(destination === "manual" ? "courses" : "import");
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const recordFocusSession = (session: FocusSession) => {
    setFocusSessions((current) => {
      const withoutCompletedPlan = session.status === "completed"
        ? current.filter(
            (item) => !(item.status === "planned" && item.assignmentId === session.assignmentId)
          )
        : current;
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
    if (!subscription.isPremium) {
      openTab("upgrade");
      return;
    }

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
      Alert.alert("Reminders queued", `${count} smart reminders were scheduled.`);
    } catch (error) {
      Alert.alert("Reminder setup paused", messageFromError(error));
    }
  };

  const handleCalendarSync = async () => {
    if (!subscription.isPremium) {
      openTab("upgrade");
      return;
    }

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
      Alert.alert("Calendar synced", `${count} deadlines were sent to your device calendar.`);
    } catch (error) {
      Alert.alert("Calendar sync paused", messageFromError(error));
    }
  };

  const premiumLocked =
    !marketingCaptureEnabled && (subscription.status !== "ready" || !subscription.isPremium);
  const freeImportCount = parsedImports.filter((item) => !item.id.startsWith("demo-")).length;
  const importLimitLocked =
    !marketingCaptureEnabled && !subscription.isPremium && freeImportCount >= freeImportLimit;

  if (!hydrated) {
    return <LoadingScreen label="Loading StudyPlanner" />;
  }

  if (!onboarded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={theme.isDark ? "light" : "dark"} />
        <OnboardingScreen onFinish={finishOnboarding} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <View style={styles.appShell}>
        {tablet ? (
          <View style={styles.sidebar}>
            <AppLogo showWordmark size={34} />
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
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.sidebarButton}
                onPress={() => openFocusForAssignment()}
              >
                <Timer color={colors.muted} size={18} />
                <Text style={styles.sidebarLabel}>Focus</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.sidebarButton}
                onPress={() => openTab("upgrade")}
              >
                <Crown color={colors.muted} size={18} />
                <Text style={styles.sidebarLabel}>Plus</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sidebarPro}>
              <Sparkles color={colors.brandPink} size={16} />
              <Text style={styles.sidebarProText}>Plan less. Stress less.</Text>
            </View>
          </View>
        ) : null}
        <ScrollView
          ref={scrollRef}
          style={styles.scrollArea}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {selectedAssignment ? (
            <AssignmentDetailScreen
              assignment={selectedAssignment}
              courses={courses}
              onClose={() => setSelectedAssignmentId(null)}
              onSave={(patch) => updateAssignment(selectedAssignment.id, patch)}
              onArchive={() => archiveAssignment(selectedAssignment.id)}
              onStartFocus={() => openFocusForAssignment(selectedAssignment.id)}
            />
          ) : (
            <>
              {activeTab === "today" ? (
                <TodayScreen
                  assignments={activeAssignments}
                  courses={courses}
                  semester={semester}
                  studentName={settings.studentName}
                  importHandoff={importHandoff}
                  demoMode={demoMode}
                  onUpdateStatus={updateAssignmentStatus}
                  onOpenAssignment={setSelectedAssignmentId}
                  onScheduleReminders={handleScheduleReminders}
                  onCalendarSync={handleCalendarSync}
                  premiumAutomationLocked={premiumLocked}
                  onOpenPaywall={() => openTab("upgrade")}
                  onOpenFocus={(assignmentId) => openFocusForAssignment(assignmentId)}
                  onOpenScan={() => openTab("import")}
                  onOpenPlan={() => openTab("plan")}
                  onOpenClasses={() => openTab("courses")}
                  onTryDemo={() => startWithDemoPlanner()}
                  onReplaceDemo={() => {
                    setSemester(defaultSemester);
                    setCourses([]);
                    setAssignments([]);
                    setGradeItems([]);
                    setParsedImports([]);
                    setParsedItems([]);
                    setFocusSessions([]);
                    setImportHandoff(null);
                    setDemoMode(false);
                    openTab("import");
                  }}
                  onAddQuickAssignment={addQuickAssignment}
                />
              ) : null}
              {activeTab === "import" ? (
                <ImportScreen
                  parsedImports={parsedImports}
                  parsedItems={parsedItems}
                  onApplyParsedPlan={applyParsedPlan}
                  premiumImportLocked={importLimitLocked}
                  onOpenPaywall={() => openTab("upgrade")}
                  onTryDemo={() => startWithDemoPlanner()}
                />
              ) : null}
              {activeTab === "plan" ? (
                <PlanScreen
                  assignments={activeAssignments}
                  courses={courses}
                  sessions={focusSessions}
                  onOpenAssignment={setSelectedAssignmentId}
                  onOpenFocus={openFocusForAssignment}
                  onUpdateStatus={updateAssignmentStatus}
                  onRecordSession={recordFocusSession}
                  onAddQuickAssignment={addQuickAssignment}
                />
              ) : null}
              {activeTab === "courses" ? (
                <CoursesScreen
                  semester={semester}
                  courses={courses}
                  assignments={activeAssignments}
                  onAddQuickAssignment={addQuickAssignment}
                  onOpenAssignment={setSelectedAssignmentId}
                  onUpdateSemester={updateSemester}
                  onAddCourse={addCourse}
                  onUpdateCourse={updateCourse}
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
                  defaultMinutes={settings.focusDefaultMinutes}
                  sessions={focusSessions}
                  preferredAssignmentId={focusAssignmentId}
                  onRecordSession={recordFocusSession}
                  onMarkComplete={(assignmentId) => updateAssignmentStatus(assignmentId, "done")}
                />
              ) : null}
              {activeTab === "more" ? (
                <MoreScreen
                  assignments={activeAssignments}
                  courses={courses}
                  semester={semester}
                  parsedImports={parsedImports}
                  demoMode={demoMode}
                  settings={settings}
                  widgetPresets={widgetPresets}
                  nativeWidgetStatus={nativeWidgetStatus}
                  onUpdateSettings={updateSettings}
                  onSaveWidgetPreset={saveWidgetPreset}
                  onResetWidgetPresets={resetWidgetPresets}
                  onOpenFocus={() => openFocusForAssignment()}
                  onOpenGrades={() => openTab("grades")}
                  onOpenPaywall={() => openTab("upgrade")}
                  premiumWidgetsLocked={!marketingCaptureEnabled && !subscription.isPremium}
                />
              ) : null}
              {activeTab === "upgrade" ? <UpgradeScreen /> : null}
            </>
          )}
        </ScrollView>

        {!tablet ? <View style={styles.tabBar}>
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.tabButton, active ? styles.tabButtonActive : null]}
                onPress={() => {
                  openTab(tab.id);
                }}
              >
                <Icon color={active ? colors.heroText : colors.faint} size={20} />
                <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View> : null}
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
        <ActivityIndicator color={colors.ink} />
        <Text style={styles.loadingText}>{label}</Text>
      </View>
    </SafeAreaView>
  );
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const existing = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => existing.set(item.id, item));
  return Array.from(existing.values());
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : "The device permission flow did not complete.";
}

function focusSessionDateKey(value: string) {
  return value.slice(0, 10);
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
      backgroundColor: colors.canvasTint,
      overflow: "hidden"
    },
    appShell: {
      flex: 1,
      backgroundColor: colors.canvas,
      overflow: "hidden",
      flexDirection: tablet ? "row" : "column"
    },
    content: {
      width: "100%",
      maxWidth: tablet ? 980 : undefined,
      alignSelf: tablet ? "center" : undefined,
      paddingHorizontal: tablet ? spacing.xl : spacing.md,
      paddingTop: tablet ? spacing.xl : spacing.md,
      paddingBottom: tablet ? spacing.xxl : 96
    },
    scrollArea: {
      flex: 1
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
    tabBar: {
      minHeight: 54,
      marginHorizontal: spacing.md,
      marginBottom: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 22,
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
      width: "19.4%",
      minHeight: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
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
      fontSize: 9,
      fontWeight: "900"
    },
    tabLabelActive: {
      color: colors.heroText
    }
  });
}
