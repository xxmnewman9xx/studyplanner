import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AlertTriangle, Bell, CalendarPlus, ChevronRight, Crown, FileScan, Target } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { AssignmentCard } from "../components/AssignmentCard";
import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { Assignment, Course, Semester } from "../models";
import {
  buildWeekPlan,
  buildTodayPlan,
  daysUntil,
  getCourseForAssignment,
  urgencyLabel
} from "../logic/planner";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type TodayScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  semester: Semester;
  onUpdateStatus: (assignmentId: string, status: "not_started" | "in_progress" | "done") => void;
  onOpenAssignment: (assignmentId: string) => void;
  onScheduleReminders: () => void;
  onCalendarSync: () => void;
  onOpenImport: () => void;
  premiumAutomationLocked: boolean;
  onOpenPaywall: () => void;
};

export function TodayScreen({
  assignments,
  courses,
  semester,
  onUpdateStatus,
  onOpenAssignment,
  onScheduleReminders,
  onCalendarSync,
  onOpenImport,
  premiumAutomationLocked,
  onOpenPaywall
}: TodayScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const plan = buildTodayPlan(assignments, semester);
  const weekPlan = buildWeekPlan(assignments);
  const nextCourse = plan.nextAction
    ? getCourseForAssignment(courses, plan.nextAction)
    : undefined;
  const totalTracked = plan.openCount + plan.doneCount;
  const completionPercent = totalTracked > 0 ? plan.doneCount / totalTracked : 0;
  const semesterPercent = Math.round(plan.semesterProgress * 100);
  const semesterProgressWidth = `${Math.max(0, Math.min(100, semesterPercent))}%` as `${number}%`;
  const reviewQueueCount = assignments.filter(
    (assignment) => assignment.reviewStatus === "needsReview"
  ).length;

  return (
    <View>
      <View style={styles.heroCard}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{semester.name}</Text>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.subtitle}>
            A calm priority stack sorted by urgency, grade pressure, and time needed.
          </Text>
        </View>
        <View style={styles.heroProgressRow}>
          <View style={styles.heroProgressCopy}>
            <Text style={styles.heroProgressValue}>{semesterPercent}%</Text>
            <Text style={styles.heroProgressLabel}>semester complete</Text>
          </View>
          <View style={styles.heroProgressTrack}>
            <View style={[styles.heroProgressFill, { width: semesterProgressWidth }]} />
          </View>
        </View>
      </View>

      <View style={styles.metricRow}>
        <MetricCard
          label="Open"
          value={String(plan.openCount)}
          detail={`${plan.doneCount} finished`}
          tone="green"
        />
        <MetricCard
          label="Review"
          value={String(reviewQueueCount)}
          detail="items waiting"
          tone={reviewQueueCount > 0 ? "gold" : "green"}
        />
        <MetricCard
          label="Overdue"
          value={String(plan.overdue.length)}
          detail={`${Math.round(completionPercent * 100)}% done`}
          tone={plan.overdue.length > 0 ? "red" : "blue"}
        />
      </View>

      <View style={styles.nextCard}>
        <View style={styles.nextHeader}>
          <Target color={colors.accent} size={22} />
          <Text style={styles.nextLabel}>What should I do next?</Text>
        </View>
        {plan.nextAction ? (
          <>
            <Text style={styles.nextTitle}>{plan.nextAction.title}</Text>
            <Text style={styles.nextMeta}>
              {nextCourse?.code} · {plan.nextAction.estimatedMinutes} minutes · due in{" "}
              {daysUntil(plan.nextAction.dueAt)} days
            </Text>
            <View style={styles.nextActions}>
              <AppButton
                label="Start"
                icon={ChevronRight}
                variant="secondary"
                onPress={() => onUpdateStatus(plan.nextAction!.id, "in_progress")}
              />
              <AppButton
                label="Done"
                variant="quiet"
                onPress={() => onUpdateStatus(plan.nextAction!.id, "done")}
              />
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No next deadline yet.</Text>
            <Text style={styles.nextMeta}>Scan a syllabus or add coursework to build the daily plan.</Text>
            <AppButton label="Scan syllabus" icon={FileScan} variant="secondary" onPress={onOpenImport} />
          </View>
        )}
      </View>

      {plan.overdue.length > 0 ? (
        <View style={styles.warningCard}>
          <AlertTriangle color={colors.red} size={20} />
          <Text style={styles.warningText}>
            {plan.overdue.length} overdue item{plan.overdue.length === 1 ? "" : "s"} need a quick decision.
          </Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <AppButton
          label="Remind"
          icon={premiumAutomationLocked ? Crown : Bell}
          variant="secondary"
          style={styles.halfButton}
          onPress={premiumAutomationLocked ? onOpenPaywall : onScheduleReminders}
        />
        <AppButton
          label="Sync"
          icon={premiumAutomationLocked ? Crown : CalendarPlus}
          variant="secondary"
          style={styles.halfButton}
          onPress={premiumAutomationLocked ? onOpenPaywall : onCalendarSync}
        />
      </View>

      <View style={styles.scanAction}>
        <AppButton label="Scan or upload syllabus" icon={FileScan} variant="quiet" onPress={onOpenImport} />
      </View>

      <SectionHeader title="Due Today" note={`${plan.dueToday.length} item${plan.dueToday.length === 1 ? "" : "s"}`} />
      <View style={styles.list}>
        {plan.dueToday.length === 0 ? (
          <Text style={styles.emptyCard}>No deadlines today.</Text>
        ) : (
          plan.dueToday.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              course={getCourseForAssignment(courses, assignment)}
              onOpen={() => onOpenAssignment(assignment.id)}
              onPressStatus={() => onUpdateStatus(assignment.id, "done")}
            />
          ))
        )}
      </View>

      <SectionHeader title="This Week Planner" note={`${weekPlan.itemCount} deadlines`} />
      {weekPlan.heavyWorkloadWarning ? (
        <View style={styles.weekWarning}>
          <AlertTriangle color={colors.red} size={18} />
          <Text style={styles.weekWarningText}>{weekPlan.heavyWorkloadWarning}</Text>
        </View>
      ) : null}
      {weekPlan.exams.length > 0 ? (
        <View style={styles.examStrip}>
          {weekPlan.exams.map((assignment) => (
            <TouchableOpacity
              accessibilityRole="button"
              key={assignment.id}
              style={styles.examPill}
              onPress={() => onOpenAssignment(assignment.id)}
            >
              <Badge label={urgencyLabel(assignment)} tone="red" />
              <Text style={styles.examPillTitle}>{assignment.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      <View style={styles.weekPlanner}>
        {weekPlan.itemCount === 0 ? (
          <Text style={styles.emptyCard}>The next seven days are clear.</Text>
        ) : (
          weekPlan.days.map((day) => (
            <View key={day.date} style={styles.weekDay}>
              <View style={styles.weekDayHeader}>
                <Text style={styles.weekDayLabel}>{day.label}</Text>
                <Text style={styles.weekDayCount}>{day.items.length}</Text>
              </View>
              <View style={styles.weekDayItems}>
                {day.items.length === 0 ? (
                  <Text style={styles.weekEmpty}>No work due</Text>
                ) : (
                  day.items.map((assignment) => (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={assignment.id}
                      style={styles.weekItem}
                      onPress={() => onOpenAssignment(assignment.id)}
                    >
                      <View style={styles.weekItemCopy}>
                        <Text style={styles.weekItemCourse}>
                          {getCourseForAssignment(courses, assignment)?.code || assignment.courseName}
                        </Text>
                        <Text style={styles.weekItemTitle}>{assignment.title}</Text>
                      </View>
                      <Badge
                        label={urgencyLabel(assignment)}
                        tone={assignment.type === "exam" ? "red" : "blue"}
                      />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          ))
        )}
      </View>

      <SectionHeader title="Upcoming" note="One place for assignments and exams" />
      <View style={styles.list}>
        {plan.upcoming.length === 0 ? (
          <Text style={styles.emptyCard}>Add coursework from Courses to build your day.</Text>
        ) : (
          plan.upcoming.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              course={getCourseForAssignment(courses, assignment)}
              onOpen={() => onOpenAssignment(assignment.id)}
              onPressStatus={() =>
                onUpdateStatus(
                  assignment.id,
                  assignment.status === "done" ? "not_started" : "done"
                )
              }
            />
          ))
        )}
      </View>

      <SectionHeader title="Exam Countdown" note="Study pressure without panic" />
      <View style={styles.examRail}>
        {plan.exams.length === 0 ? (
          <Text style={styles.emptyCard}>No exams added yet.</Text>
        ) : (
          plan.exams.map((assignment) => (
            <TouchableOpacity
              accessibilityRole="button"
              key={assignment.id}
              style={styles.examCard}
              onPress={() => onOpenAssignment(assignment.id)}
            >
              <Badge label={`${daysUntil(assignment.dueAt)} days`} tone="red" />
              <Text style={styles.examTitle}>{assignment.title}</Text>
              <Text style={styles.examCourse}>
                {getCourseForAssignment(courses, assignment)?.code}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    header: {
      gap: spacing.xs
    },
    heroCard: {
      borderRadius: radii.xl,
      backgroundColor: colors.heroSurface,
      padding: spacing.lg,
      gap: spacing.lg,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.32 : 0.14,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6
    },
    kicker: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900"
    },
    title: {
      ...typography.hero,
      color: colors.heroText
    },
    subtitle: {
      ...typography.body,
      color: colors.heroMuted
    },
    heroProgressRow: {
      gap: spacing.sm
    },
    heroProgressCopy: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    heroProgressValue: {
      color: colors.heroText,
      fontSize: 26,
      lineHeight: 31,
      fontWeight: "900"
    },
    heroProgressLabel: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "900"
    },
    heroProgressTrack: {
      height: 10,
      borderRadius: radii.round,
      backgroundColor: theme.isDark ? "rgba(7,17,29,0.2)" : "rgba(255,255,255,0.16)",
      overflow: "hidden"
    },
    heroProgressFill: {
      height: "100%",
      borderRadius: radii.round,
      backgroundColor: colors.accent
    },
    metricRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg
    },
    nextCard: {
      marginTop: spacing.lg,
      borderRadius: radii.xl,
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.lg,
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.18 : 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4
    },
    nextHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    nextLabel: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900"
    },
    nextTitle: {
      color: colors.ink,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "900"
    },
    nextMeta: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20
    },
    nextActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs
    },
    actionRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md
    },
    scanAction: {
      alignItems: "flex-start",
      marginTop: spacing.xs
    },
    halfButton: {
      flex: 1
    },
    warningCard: {
      marginTop: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.red,
      backgroundColor: theme.isDark ? "#3A201D" : "#FFE0D8",
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    warningText: {
      flex: 1,
      color: colors.ink,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "800"
    },
    weekWarning: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.red,
      backgroundColor: theme.isDark ? "#3A201D" : "#FFE0D8",
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm
    },
    weekWarningText: {
      flex: 1,
      color: colors.ink,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "800"
    },
    examStrip: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.sm
    },
    examPill: {
      flexGrow: 1,
      flexBasis: "48%",
      minHeight: 76,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.xs
    },
    examPillTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    weekPlanner: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      overflow: "hidden"
    },
    weekDay: {
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      padding: spacing.sm,
      gap: spacing.sm
    },
    weekDayHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    weekDayLabel: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    weekDayCount: {
      color: colors.faint,
      fontSize: 12,
      fontWeight: "900"
    },
    weekDayItems: {
      gap: spacing.xs
    },
    weekEmpty: {
      color: colors.faint,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    weekItem: {
      minHeight: 58,
      borderRadius: radii.sm,
      backgroundColor: colors.canvas,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    weekItemCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    weekItemCourse: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "900"
    },
    weekItemTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "800"
    },
    emptyState: {
      gap: spacing.sm,
      alignItems: "flex-start"
    },
    emptyTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "900"
    },
    list: {
      gap: spacing.sm
    },
    emptyCard: {
      overflow: "hidden",
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700"
    },
    examRail: {
      flexDirection: "row",
      gap: spacing.sm,
      flexWrap: "wrap"
    },
    examCard: {
      flexBasis: "48%",
      minHeight: 122,
      borderRadius: radii.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      gap: spacing.sm
    },
    examTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    examCourse: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "800"
    }
  });
}
