import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  Crown,
  FileScan,
  GraduationCap,
  Home,
  Timer
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
import { AppTheme } from "./src/theme";
import { AppThemeProvider, useAppTheme } from "./src/themeContext";
import { ModeToggle } from "./src/components/ModeToggle";
import { PremiumGate } from "./src/components/PremiumGate";
import { isStoreCaptureEnabled } from "./src/config/storeCapture";
import { defaultCourses, defaultGradeItems, defaultSemester } from "./src/data/defaultPlanner";
import { createDemoSemesterSeed } from "./src/data/demoSemester";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { ImportScreen } from "./src/screens/ImportScreen";
import { CoursesScreen } from "./src/screens/CoursesScreen";
import { GradesScreen } from "./src/screens/GradesScreen";
import { FocusScreen } from "./src/screens/FocusScreen";
import { UpgradeScreen } from "./src/screens/UpgradeScreen";
import { AssignmentDetailScreen } from "./src/screens/AssignmentDetailScreen";
import { scheduleSmartReminders } from "./src/services/reminders";
import { syncAssignmentsToDeviceCalendar } from "./src/services/calendarSync";
import { loadJson, saveJson } from "./src/services/storage";
import { SubscriptionProvider, useSubscription } from "./src/services/subscriptions";
import {
  createSyllabusSourceFromParse,
  isAssignmentArchived,
  normalizeAssignment,
  normalizeAssignments,
  withAssignmentPatch
} from "./src/logic/assignmentModel";

const plannerStorageKey = "study-planner-data-v2";

const tabs: Array<{
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ color: string; size: number }>;
}> = [
  { id: "today", label: "Today", icon: Home },
  { id: "import", label: "Scan", icon: FileScan },
  { id: "courses", label: "Courses", icon: CalendarDays },
  { id: "grades", label: "Grades", icon: GraduationCap },
  { id: "focus", label: "Focus", icon: Timer },
  { id: "upgrade", label: "Plus", icon: Crown }
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
  const [syllabusSources, setSyllabusSources] = useState<SyllabusSource[]>(
    demoSeed?.syllabusSources || []
  );
  const [gradeItems, setGradeItems] = useState(demoSeed?.gradeItems || defaultGradeItems);
  const [targetGradePercent, setTargetGradePercent] = useState(demoSeed?.targetGradePercent || 90);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const activeAssignments = useMemo(
    () => assignments.filter((item) => !isAssignmentArchived(item)),
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

  useEffect(() => {
    let mounted = true;

    if (demoSeed) {
      setOnboarded(demoSeed.onboarded);
      setPaywallSeen(demoSeed.paywallSeen);
      setSemester(demoSeed.semester);
      setCourses(demoSeed.courses);
      setAssignments(demoSeed.assignments);
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
      gradeItems,
      syllabusSources,
      targetGradePercent
    });
  }, [
    assignments,
    courses,
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
    if (subscription.isPremium && !paywallSeen) {
      setPaywallSeen(true);
    }
  }, [paywallSeen, subscription.isPremium]);

  const applyParsedPlan = (parse: SyllabusParseResult) => {
    const normalizedAssignments = normalizeAssignments(parse.assignments, parse.courses);
    const normalizedParse = { ...parse, assignments: normalizedAssignments };
    setCourses((current) => mergeById(current, parse.courses));
    setAssignments((current) => mergeById(current, normalizedAssignments));
    setGradeItems((current) => mergeById(current, parse.gradeItems));
    setSyllabusSources((current) =>
      mergeById(current, [
        parse.syllabusSource || createSyllabusSourceFromParse(normalizedParse, "device")
      ])
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
      current.map((assignment) =>
        assignment.id === assignmentId
          ? withAssignmentPatch(assignment, { status }, courses)
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
      normalizeAssignment({
        id: `manual-${Date.now()}`,
        courseId,
        courseName: courses.find((course) => course.id === courseId)?.name || "Course",
        title: title.trim(),
        type: kind,
        kind,
        dueAt: `${dueDate.trim()}T23:59:00`,
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
        color: colors.accent,
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
    setAssignments((current) =>
      current.map((assignment) =>
        assignment.id === assignmentId ? withAssignmentPatch(assignment, patch, courses) : assignment
      )
    );
  };

  const archiveAssignment = (assignmentId: string) => {
    updateAssignment(assignmentId, { status: "archived", reviewStatus: "ignored" });
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
            ? withAssignmentPatch(assignment, {
                reminderIds: [...(assignment.reminderIds || []), ...newReminderIds]
              }, courses)
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
            ? withAssignmentPatch(assignment, {
                externalCalendarEventId: calendarEventIdsByAssignment[assignment.id]
              }, courses)
            : assignment
        )
      );
      Alert.alert("Calendar synced", `${count} deadlines were sent to your device calendar.`);
    } catch (error) {
      Alert.alert("Calendar sync paused", messageFromError(error));
    }
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
        <OnboardingScreen onFinish={() => setOnboarded(true)} />
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
        <View style={styles.modeToggle}>
          <ModeToggle />
        </View>
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
            />
          ) : (
            <>
              {activeTab === "today" ? (
                <TodayScreen
                  assignments={activeAssignments}
                  courses={courses}
                  semester={semester}
                  onUpdateStatus={updateAssignmentStatus}
                  onOpenAssignment={setSelectedAssignmentId}
                  onScheduleReminders={handleScheduleReminders}
                  onCalendarSync={handleCalendarSync}
                  onOpenImport={() => openTab("import")}
                  premiumAutomationLocked={premiumLocked}
                  onOpenPaywall={() => openTab("upgrade")}
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
                  <ImportScreen onApplyParsedPlan={applyParsedPlan} />
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
                  onUpdateSemester={updateSemester}
                  onAddCourse={addCourse}
                  onUpdateCourse={updateCourse}
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
              {activeTab === "focus" ? (
                <FocusScreen assignments={activeAssignments} courses={courses} />
              ) : null}
              {activeTab === "upgrade" ? <UpgradeScreen /> : null}
            </>
          )}
        </ScrollView>

        <View style={styles.tabBar}>
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
        </View>
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

function createStyles(theme: AppTheme) {
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
      overflow: "hidden"
    },
    modeToggle: {
      position: "absolute",
      top: spacing.sm,
      right: spacing.lg,
      zIndex: 2
    },
    content: {
      width: "100%",
      paddingHorizontal: spacing.lg,
      paddingTop: 70,
      paddingBottom: 126
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
    tabBar: {
      position: "absolute",
      left: spacing.md,
      right: spacing.md,
      bottom: spacing.md,
      minHeight: 78,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(17, 23, 34, 0.96)" : "rgba(255, 255, 255, 0.96)",
      padding: spacing.xs,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.42 : 0.16,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 9
    },
    tabButton: {
      width: "16.3%",
      minHeight: 62,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.lg,
      gap: 4
    },
    tabButtonActive: {
      backgroundColor: colors.accent,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.28 : 0.16,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
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
