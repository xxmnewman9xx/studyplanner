import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  CalendarDays,
  Crown,
  FileScan,
  GraduationCap,
  PanelsTopLeft,
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
  defaultParsedImports,
  defaultParsedItems,
  defaultSemester,
  defaultSettings,
  defaultWidgetPresets
} from "./src/data/defaultPlanner";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { ImportScreen } from "./src/screens/ImportScreen";
import { CoursesScreen } from "./src/screens/CoursesScreen";
import { GradesScreen } from "./src/screens/GradesScreen";
import { FocusScreen } from "./src/screens/FocusScreen";
import { UpgradeScreen } from "./src/screens/UpgradeScreen";
import { AssignmentDetailScreen } from "./src/screens/AssignmentDetailScreen";
import { PlanScreen } from "./src/screens/PlanScreen";
import { MoreScreen } from "./src/screens/MoreScreen";
import { completeAssignment, saveWidgetPreset as saveWidgetPresetState } from "./src/logic/planner";
import { scheduleSmartReminders } from "./src/services/reminders";
import { syncAssignmentsToDeviceCalendar } from "./src/services/calendarSync";
import { loadJson, saveJson } from "./src/services/storage";
import { SubscriptionProvider, useSubscription } from "./src/services/subscriptions";
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

const tabs: Array<{
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ color: string; size: number }>;
}> = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "import", label: "Scan", icon: FileScan },
  { id: "plan", label: "Plan", icon: CalendarDays },
  { id: "courses", label: "Classes", icon: GraduationCap },
  { id: "more", label: "More", icon: PanelsTopLeft }
];

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
  const { theme } = useAppTheme();
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
    marketingCaptureEnabled ? marketingCaptureCourses : defaultCourses
  );
  const [assignments, setAssignments] = useState<Assignment[]>(
    marketingCaptureEnabled ? marketingCaptureAssignments : defaultAssignments
  );
  const [gradeItems, setGradeItems] = useState(
    marketingCaptureEnabled ? marketingCaptureGradeItems : defaultGradeItems
  );
  const [targetGradePercent, setTargetGradePercent] = useState(90);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [parsedImports, setParsedImports] = useState<ParsedImport[]>(defaultParsedImports);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>(defaultParsedItems);
  const [widgetPresets, setWidgetPresets] = useState<WidgetPreset[]>(defaultWidgetPresets);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(defaultFocusSessions);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [focusAssignmentId, setFocusAssignmentId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const activeAssignments = useMemo(
    () => assignments.filter((item) => item.status !== "archived"),
    [assignments]
  );
  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId),
    [assignments, selectedAssignmentId]
  );

  const openTab = (tab: NavTab) => {
    setSelectedAssignmentId(null);
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const openFocusForAssignment = (assignmentId?: string) => {
    setSelectedAssignmentId(null);
    setFocusAssignmentId(assignmentId || selectedAssignmentId);
    setActiveTab("focus");
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

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
        setCourses(stored.courses?.length ? stored.courses : defaultCourses);
        setAssignments(stored.assignments?.length ? stored.assignments : defaultAssignments);
        setGradeItems(stored.gradeItems?.length ? stored.gradeItems : defaultGradeItems);
        setTargetGradePercent(stored.targetGradePercent || 90);
        setSettings({ ...defaultSettings, ...(stored.settings || {}), onboardingComplete: Boolean(stored.onboarded) });
        setParsedImports(stored.parsedImports?.length ? stored.parsedImports : defaultParsedImports);
        setParsedItems(stored.parsedItems?.length ? stored.parsedItems : defaultParsedItems);
        setWidgetPresets(stored.widgetPresets?.length ? stored.widgetPresets : defaultWidgetPresets);
        setFocusSessions(stored.focusSessions?.length ? stored.focusSessions : defaultFocusSessions);
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

    saveJson<PlannerData>(plannerStorageKey, {
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
      focusSessions
    });
  }, [
    assignments,
    courses,
    focusSessions,
    gradeItems,
    hydrated,
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

    setAssignments((current) => [
      ...current,
      {
        id: `manual-${Date.now()}`,
        courseId,
        title: title.trim(),
        kind,
        type: kind,
        dueAt: `${dueDate.trim()}T23:59:00`,
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
  };

  const updateSemester = (patch: Partial<Semester>) => {
    setSemester((current) => ({ ...current, ...patch }));
  };

  const addCourse = (course: Pick<Course, "code" | "name" | "instructor">) => {
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
  };

  const resetWidgetPresets = () => {
    setWidgetPresets(defaultWidgetPresets);
  };

  const recordFocusSession = (session: FocusSession) => {
    setFocusSessions((current) => [session, ...current].slice(0, 24));
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
  const showInitialPaywall = false;

  if (!hydrated) {
    return <LoadingScreen label="Loading StudyPlanner" />;
  }

  if (!onboarded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={theme.isDark ? "light" : "dark"} />
        <OnboardingScreen onFinish={() => setOnboarded(true)} />
      </SafeAreaView>
    );
  }

  if (
    !marketingCaptureEnabled &&
    !paywallSeen &&
    !subscription.isPremium &&
    subscription.status === "checking"
  ) {
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
        {tablet ? (
          <View style={styles.sidebar}>
            <AppLogo showWordmark size={34} />
            <View style={styles.sidebarNav}>
              {tabs.map((tab) => {
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
                <Text style={styles.sidebarLabel}>Pro</Text>
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
                  onUpdateStatus={updateAssignmentStatus}
                  onOpenAssignment={setSelectedAssignmentId}
                  onScheduleReminders={handleScheduleReminders}
                  onCalendarSync={handleCalendarSync}
                  premiumAutomationLocked={premiumLocked}
                  onOpenPaywall={() => openTab("upgrade")}
                  onOpenFocus={() => openFocusForAssignment()}
                  onOpenScan={() => openTab("import")}
                  onOpenPlan={() => openTab("plan")}
                  onOpenClasses={() => openTab("courses")}
                  onOpenWidgets={() => openTab("more")}
                />
              ) : null}
              {activeTab === "import" ? (
                <ImportScreen
                  parsedImports={parsedImports}
                  parsedItems={parsedItems}
                  onApplyParsedPlan={applyParsedPlan}
                />
              ) : null}
              {activeTab === "plan" ? (
                <PlanScreen
                  assignments={activeAssignments}
                  courses={courses}
                  onOpenAssignment={setSelectedAssignmentId}
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
                  settings={settings}
                  widgetPresets={widgetPresets}
                  onUpdateSettings={updateSettings}
                  onSaveWidgetPreset={saveWidgetPreset}
                  onResetWidgetPresets={resetWidgetPresets}
                  onOpenFocus={() => openFocusForAssignment()}
                  onOpenGrades={() => openTab("grades")}
                  onOpenPaywall={() => openTab("upgrade")}
                />
              ) : null}
              {activeTab === "upgrade" ? <UpgradeScreen /> : null}
            </>
          )}
        </ScrollView>

        {!tablet ? <View style={styles.tabBar}>
          {tabs.map((tab) => {
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

function createStyles(theme: AppTheme, tablet = false) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.canvas,
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
      paddingHorizontal: spacing.lg,
      paddingTop: tablet ? spacing.xl : spacing.lg,
      paddingBottom: tablet ? spacing.xxl : spacing.lg
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
      minHeight: 66,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(17, 23, 34, 0.98)" : "rgba(255, 255, 255, 0.985)",
      padding: spacing.xs,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.42 : 0.16,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 9
    },
    tabButton: {
      width: "19.4%",
      minHeight: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      gap: 4
    },
    tabButtonActive: {
      backgroundColor: colors.accent,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.2 : 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4
    },
    tabLabel: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: "900"
    },
    tabLabelActive: {
      color: colors.heroText
    }
  });
}
