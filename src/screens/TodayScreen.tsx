import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Bell, CalendarPlus, ChevronRight, Crown, FileScan, GraduationCap, Plus, Timer } from "lucide-react-native";
import {
  AppLogo,
  AssignmentRow,
  EmptyState,
  GlassCard,
} from "../components/AppleComponents";
import { AppButton } from "../components/AppButton";
import { SectionHeader } from "../components/SectionHeader";
import { Assignment, Course, Semester } from "../models";
import {
  buildTodayPlan,
  daysUntil,
  formatDateOnly,
  getCourseForAssignment
} from "../logic/planner";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type TodayScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  semester: Semester;
  studentName: string;
  onUpdateStatus: (assignmentId: string, status: "not_started" | "in_progress" | "done") => void;
  onOpenAssignment: (assignmentId: string) => void;
  onScheduleReminders: () => void;
  onCalendarSync: () => void;
  premiumAutomationLocked: boolean;
  onOpenPaywall: () => void;
  onOpenFocus: (assignmentId?: string) => void;
  onOpenScan: () => void;
  onOpenPlan: () => void;
  onOpenClasses: () => void;
  onOpenWidgets: () => void;
  onAddQuickAssignment: (courseId: string, title: string, dueDate: string, kind: "assignment") => void;
};

export function TodayScreen({
  assignments,
  courses,
  semester,
  onUpdateStatus,
  onOpenAssignment,
  onScheduleReminders,
  onCalendarSync,
  premiumAutomationLocked,
  onOpenPaywall,
  onOpenFocus,
  onOpenScan,
  onOpenPlan,
  onOpenClasses,
  onAddQuickAssignment
}: TodayScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const plan = buildTodayPlan(assignments, semester);
  const nextCourse = plan.nextAction
    ? getCourseForAssignment(courses, plan.nextAction)
    : undefined;
  const semesterPercent = Math.round(plan.semesterProgress * 100);
  const nextDueDays = plan.nextAction ? daysUntil(plan.nextAction.dueAt) : 0;
  const [quickCourseId, setQuickCourseId] = useState(courses[0]?.id || "");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDueDate, setQuickDueDate] = useState(todayDateInput());
  const quickCourse = courses.find((course) => course.id === quickCourseId) || courses[0];
  const liveBrief = buildLiveBrief(plan, courses.length);

  useEffect(() => {
    if (!courses.length) {
      setQuickCourseId("");
      return;
    }

    if (!courses.some((course) => course.id === quickCourseId)) {
      setQuickCourseId(courses[0]?.id || "");
    }
  }, [courses, quickCourseId]);

  const addHomework = () => {
    if (!quickCourse || !quickTitle.trim() || !quickDueDate.trim()) return;
    onAddQuickAssignment(quickCourse.id, quickTitle, quickDueDate, "assignment");
    setQuickTitle("");
    setQuickDueDate(todayDateInput());
  };

  return (
    <View style={styles.screen}>
      <View style={styles.identityRow}>
        <AppLogo showWordmark size={42} />
      </View>

      <GlassCard tone="hero" style={styles.heroCard}>
        <Text style={styles.heroKicker}>Live plan</Text>
        <Text style={styles.heroTitle}>{liveBrief.title}</Text>
        <Text style={styles.heroSubtitle}>{liveBrief.detail}</Text>
        {plan.nextAction ? (
          <View style={styles.nextHero}>
            <View style={styles.nextHeroCopy}>
              <Text style={styles.nextKicker}>
                Due {nextDueDays <= 0 ? "today" : `in ${nextDueDays} days`}
              </Text>
              <Text style={styles.nextTitle}>{nextCourse?.code} - {plan.nextAction.title}</Text>
              <Text style={styles.nextMeta}>
                Due {formatDateOnly(plan.nextAction.dueAt.slice(0, 10))} · {plan.nextAction.estimatedMinutes}m · {nextCourse?.period || "class"}
              </Text>
            </View>
            <View style={styles.nextActions}>
              <AppButton
                label="Start"
                icon={ChevronRight}
                onPress={() => {
                  onUpdateStatus(plan.nextAction!.id, "in_progress");
                  onOpenAssignment(plan.nextAction!.id);
                }}
                style={styles.startButton}
              />
              <AppButton
                label="Focus timer"
                icon={Timer}
                variant="secondary"
                onPress={() => onOpenFocus(plan.nextAction!.id)}
                style={styles.focusButton}
              />
            </View>
          </View>
        ) : (
          <EmptyState title="All caught up" copy="No urgent work in the planner right now." emoji="complete" />
        )}
      </GlassCard>

      <SectionHeader title="Every school day" note="Scan, plan, study, and review without hunting." />
      <View style={styles.commandGrid}>
        <CommandTile
          title="Scan syllabus"
          detail="Turn class handouts into reviewable homework."
          icon={FileScan}
          onPress={onOpenScan}
          tone="pink"
        />
        <CommandTile
          title="Plan week"
          detail={`${plan.dueSoon.length} due soon · ${semesterPercent}% term`}
          icon={CalendarPlus}
          onPress={onOpenPlan}
          tone="blue"
        />
        <CommandTile
          title="Classes + notes"
          detail={`${courses.length} classes with assignments and notes`}
          icon={GraduationCap}
          onPress={onOpenClasses}
          tone="green"
        />
        <CommandTile
          title="Focus session"
          detail="Start a timed study block from the current plan."
          icon={Timer}
          onPress={() => onOpenFocus(plan.nextAction?.id)}
          tone="purple"
        />
      </View>

      <SectionHeader title="Quick Homework" note="Capture what a teacher just assigned" />
      <GlassCard style={styles.quickAddCard}>
        <View style={styles.courseRail}>
          {courses.slice(0, 4).map((course) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: quickCourse?.id === course.id }}
              key={course.id}
              style={[
                styles.coursePill,
                quickCourse?.id === course.id ? styles.coursePillActive : null
              ]}
              onPress={() => setQuickCourseId(course.id)}
            >
              <Text
                style={[
                  styles.coursePillText,
                  quickCourse?.id === course.id ? styles.coursePillTextActive : null
                ]}
              >
                {course.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.quickInputRow}>
          <TextInput
            value={quickTitle}
            onChangeText={setQuickTitle}
            placeholder="Add homework"
            placeholderTextColor={colors.faint}
            style={[styles.quickInput, styles.quickTitleInput]}
            returnKeyType="done"
            onSubmitEditing={addHomework}
          />
          <TextInput
            value={quickDueDate}
            onChangeText={setQuickDueDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.faint}
            style={[styles.quickInput, styles.quickDateInput]}
            returnKeyType="done"
            onSubmitEditing={addHomework}
          />
        </View>
        <AppButton
          label="Add homework"
          icon={Plus}
          disabled={!quickCourse || !quickTitle.trim() || !quickDueDate.trim()}
          onPress={addHomework}
        />
      </GlassCard>

      <SectionHeader title="Today" note={`${plan.dueToday.length} due today · ${plan.dueSoon.length} due soon · ${plan.needsReview.length} to review`} />
      <View style={styles.list}>
        {plan.upcoming.length === 0 ? (
          <EmptyState title="A clear day" copy="Scan a syllabus or add a class to start planning." emoji="calendar" />
        ) : (
          plan.upcoming.slice(0, 5).map((assignment) => (
            <AssignmentRow
              key={assignment.id}
              assignment={assignment}
              course={getCourseForAssignment(courses, assignment)}
              onPress={() => onOpenAssignment(assignment.id)}
              trailing={<Text style={styles.doneButtonText}>{assignment.status === "done" ? "Done" : "Details"}</Text>}
            />
          ))
        )}
      </View>

      <SectionHeader title="Needs Review" note="Missing dates, low confidence, possible duplicates" />
      <View style={styles.list}>
        {plan.needsReview.length === 0 ? (
          <EmptyState title="Nothing to review" copy="Parsed work looks clean." emoji="complete" />
        ) : (
          plan.needsReview.slice(0, 3).map((assignment) => (
            <AssignmentRow
              key={assignment.id}
              assignment={assignment}
              course={getCourseForAssignment(courses, assignment)}
              onPress={() => onOpenAssignment(assignment.id)}
              trailing={<Text style={styles.reviewFlag}>{assignment.duplicateOf ? "Duplicate?" : "Check"}</Text>}
            />
          ))
        )}
      </View>

      <SectionHeader title="Automation" note="Premium reminder and calendar workflows" />
      <View style={styles.actionRow}>
        <AppButton
          label="Remind"
          icon={premiumAutomationLocked ? Crown : Bell}
          variant="secondary"
          style={styles.actionButton}
          onPress={premiumAutomationLocked ? onOpenPaywall : onScheduleReminders}
        />
        <AppButton
          label="Sync"
          icon={premiumAutomationLocked ? Crown : CalendarPlus}
          variant="secondary"
          style={styles.actionButton}
          onPress={premiumAutomationLocked ? onOpenPaywall : onCalendarSync}
        />
      </View>
    </View>
  );

}

function buildLiveBrief(plan: ReturnType<typeof buildTodayPlan>, courseCount: number) {
  if (plan.needsReview.length > 0) {
    return {
      title: "Review imported work",
      detail: `${plan.needsReview.length} item${plan.needsReview.length === 1 ? "" : "s"} need a date, duplicate check, or confidence pass before the plan is trusted.`
    };
  }

  if (plan.nextAction) {
    const days = daysUntil(plan.nextAction.dueAt);
    return {
      title: days <= 0 ? "Due today — start here" : `Next deadline in ${days} day${days === 1 ? "" : "s"}`,
      detail: "Open the assignment, start focus, or capture new homework before it becomes invisible."
    };
  }

  if (courseCount === 0) {
    return {
      title: "Build your school command center",
      detail: "Add classes or scan a syllabus so Today can tell you what matters next."
    };
  }

  return {
    title: "Clear right now",
    detail: "Your current plan has no urgent work. Add homework when class ends or scan the next syllabus."
  };
}

type CommandTileProps = {
  title: string;
  detail: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  onPress: () => void;
  tone: "pink" | "blue" | "green" | "purple";
};

function CommandTile({ title, detail, icon: Icon, onPress, tone }: CommandTileProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const toneColor = {
    pink: theme.colors.brandPink,
    blue: theme.colors.accent,
    green: theme.colors.green,
    purple: theme.colors.brandViolet
  }[tone];

  return (
    <TouchableOpacity accessibilityRole="button" style={styles.commandTile} onPress={onPress}>
      <View style={[styles.commandIcon, { backgroundColor: `${toneColor}22` }]}>
        <Icon color={toneColor} size={20} />
      </View>
      <Text style={styles.commandTitle}>{title}</Text>
      <Text style={styles.commandDetail}>{detail}</Text>
    </TouchableOpacity>
  );
}

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    screen: {
      gap: 0
    },
    identityRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
      gap: spacing.md
    },
    heroCard: {
      gap: spacing.xs,
      padding: spacing.md
    },
    heroKicker: {
      color: colors.heroMuted,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "800"
    },
    heroTitle: {
      color: colors.heroText,
      fontSize: 23,
      lineHeight: 29,
      fontWeight: "900"
    },
    heroSubtitle: {
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800",
      marginTop: -2
    },
    nextHero: {
      borderRadius: radii.xl,
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      padding: spacing.sm,
      gap: spacing.sm
    },
    nextHeroCopy: {
      gap: 3
    },
    nextKicker: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    nextTitle: {
      color: colors.heroText,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    nextMeta: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    startButton: {
      flex: 1,
      backgroundColor: colors.brandPink
    },
    focusButton: {
      flex: 1,
      backgroundColor: "rgba(255,255,255,0.96)"
    },
    nextActions: {
      flexDirection: "row",
      gap: spacing.sm
    },
    commandGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    commandTile: {
      width: "48%",
      minHeight: 136,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      gap: spacing.xs
    },
    commandIcon: {
      width: 36,
      height: 36,
      borderRadius: radii.round,
      alignItems: "center",
      justifyContent: "center"
    },
    commandTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    commandDetail: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    quickAddCard: {
      gap: spacing.sm
    },
    courseRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    coursePill: {
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7
    },
    coursePillActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    coursePillText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900"
    },
    coursePillTextActive: {
      color: colors.accent
    },
    quickInputRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    quickInput: {
      minHeight: 46,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      color: colors.ink,
      backgroundColor: colors.canvas,
      paddingHorizontal: spacing.sm,
      fontSize: 15,
      fontWeight: "800"
    },
    quickTitleInput: {
      flex: 1
    },
    quickDateInput: {
      width: 124
    },
    actionRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm
    },
    actionButton: {
      flex: 1,
      paddingHorizontal: spacing.xs
    },
    list: {
      gap: spacing.sm
    },
    doneButton: {
      minWidth: 36,
      height: 36,
      borderRadius: radii.round,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center"
    },
    doneButtonText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "900"
    },
    reviewFlag: {
      color: colors.brandPink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    }
  });
}
