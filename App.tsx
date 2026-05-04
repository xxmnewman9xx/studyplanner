import React, { useEffect, useMemo, useState } from "react";
import {
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
  BookOpen,
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
  SyllabusParseResult
} from "./src/models";
import { AppTheme } from "./src/theme";
import { AppThemeProvider, useAppTheme } from "./src/themeContext";
import { ModeToggle } from "./src/components/ModeToggle";
import {
  seedAssignments,
  seedCourses,
  seedGradeItems,
  seedSemester
} from "./src/data/seed";
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

const plannerStorageKey = "study-planner-data-v1";

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
      <AppContent />
    </AppThemeProvider>
  );
}

function AppContent() {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [onboarded, setOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>("today");
  const [semester, setSemester] = useState(seedSemester);
  const [courses, setCourses] = useState(seedCourses);
  const [assignments, setAssignments] = useState(seedAssignments);
  const [gradeItems, setGradeItems] = useState(seedGradeItems);
  const [targetGradePercent, setTargetGradePercent] = useState(90);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const activeAssignments = useMemo(
    () => assignments.filter((item) => item.status !== "archived"),
    [assignments]
  );
  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => assignment.id === selectedAssignmentId),
    [assignments, selectedAssignmentId]
  );

  useEffect(() => {
    let mounted = true;

    loadJson<PlannerData>(plannerStorageKey).then((stored) => {
      if (!mounted) return;

      if (stored) {
        setOnboarded(stored.onboarded);
        setSemester(stored.semester);
        setCourses(stored.courses);
        setAssignments(stored.assignments);
        setGradeItems(stored.gradeItems);
        setTargetGradePercent(stored.targetGradePercent);
      }

      setHydrated(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    saveJson<PlannerData>(plannerStorageKey, {
      onboarded,
      semester,
      courses,
      assignments,
      gradeItems,
      targetGradePercent
    });
  }, [assignments, courses, gradeItems, hydrated, onboarded, semester, targetGradePercent]);

  const applyParsedPlan = (parse: SyllabusParseResult) => {
    setCourses((current) => mergeById(current, parse.courses));
    setAssignments((current) => mergeById(current, parse.assignments));
    setGradeItems((current) => mergeById(current, parse.gradeItems));
    setSemester((current) => ({
      ...current,
      name: parse.semesterName || current.name,
      startDate: parse.semesterStartDate || current.startDate,
      endDate: parse.semesterEndDate || current.endDate
    }));
    setActiveTab("today");
  };

  const updateAssignmentStatus = (
    assignmentId: string,
    status: Exclude<AssignmentStatus, "archived">
  ) => {
    setAssignments((current) =>
      current.map((assignment) =>
        assignment.id === assignmentId ? { ...assignment, status } : assignment
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
        dueAt: `${dueDate.trim()}T23:59:00-05:00`,
        tags: kind === "exam" ? ["exam"] : ["homework"],
        priority: kind === "exam" ? "high" : "medium",
        estimatedMinutes: kind === "exam" ? 150 : 60,
        status: "not_started",
        source: "manual"
      }
    ]);
  };

  const updateSemester = (patch: Partial<Semester>) => {
    setSemester((current) => ({ ...current, ...patch }));
  };

  const addCourse = (course: Pick<Course, "code" | "name" | "instructor">) => {
    const id = `course-${Date.now()}`;
    setCourses((current) => [
      ...current,
      {
        id,
        code: course.code.trim() || "CLASS",
        name: course.name.trim() || "New Course",
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
        assignment.id === assignmentId ? { ...assignment, ...patch } : assignment
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
      Alert.alert("Reminders queued", `${count} smart reminders were scheduled.`);
    } catch (error) {
      Alert.alert("Reminder setup paused", messageFromError(error));
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
      Alert.alert("Calendar synced", `${count} deadlines were sent to your device calendar.`);
    } catch (error) {
      Alert.alert("Calendar sync paused", messageFromError(error));
    }
  };

  if (!onboarded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={theme.isDark ? "light" : "dark"} />
        <OnboardingScreen
          onFinish={() => setOnboarded(true)}
          onApplyParsedPlan={(parse) => {
            applyParsedPlan(parse);
            setOnboarded(true);
          }}
        />
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
                />
              ) : null}
              {activeTab === "import" ? (
                <ImportScreen onApplyParsedPlan={applyParsedPlan} />
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
                  setSelectedAssignmentId(null);
                  setActiveTab(tab.id);
                }}
              >
                <Icon color={active ? colors.ink : colors.muted} size={20} />
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
      backgroundColor: colors.canvas
    },
    appShell: {
      flex: 1,
      backgroundColor: colors.canvas
    },
    modeToggle: {
      position: "absolute",
      top: spacing.sm,
      right: spacing.lg,
      zIndex: 2
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: 110
    },
    tabBar: {
      position: "absolute",
      left: spacing.md,
      right: spacing.md,
      bottom: spacing.md,
      minHeight: 76,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.xs,
      shadowColor: theme.isDark ? "#000000" : "#0E1726",
      shadowOpacity: theme.isDark ? 0.35 : 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6
    },
    tabButton: {
      width: "16.3%",
      minHeight: 60,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.lg,
      gap: 4
    },
    tabButtonActive: {
      backgroundColor: colors.softGold
    },
    tabLabel: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: "700"
    },
    tabLabelActive: {
      color: colors.ink
    }
  });
}
