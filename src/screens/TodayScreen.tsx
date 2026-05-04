import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Bell, CalendarPlus, ChevronRight, Target } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { AssignmentCard } from "../components/AssignmentCard";
import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
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
  onUpdateStatus: (assignmentId: string, status: "not_started" | "in_progress" | "done") => void;
  onOpenAssignment: (assignmentId: string) => void;
  onScheduleReminders: () => void;
  onCalendarSync: () => void;
};

export function TodayScreen({
  assignments,
  courses,
  semester,
  onUpdateStatus,
  onOpenAssignment,
  onScheduleReminders,
  onCalendarSync
}: TodayScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const plan = buildTodayPlan(assignments, semester);
  const nextCourse = plan.nextAction
    ? getCourseForAssignment(courses, plan.nextAction)
    : undefined;

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.kicker}>{semester.name}</Text>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.subtitle}>
          A short list, sorted by urgency, grade pressure, and time needed.
        </Text>
      </View>

      <View style={styles.metricRow}>
        <MetricCard
          label="Open work"
          value={String(plan.openCount)}
          detail={`${plan.doneCount} finished`}
          tone="green"
        />
        <MetricCard
          label="Semester"
          value={`${Math.round(plan.semesterProgress * 100)}%`}
          detail={`${formatDateOnly(semester.endDate)} end`}
          tone="gold"
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
          <Text style={styles.nextMeta}>Nothing urgent. Your plan is clear for now.</Text>
        )}
      </View>

      <View style={styles.actionRow}>
        <AppButton
          label="Remind"
          icon={Bell}
          variant="secondary"
          style={styles.halfButton}
          onPress={onScheduleReminders}
        />
        <AppButton
          label="Sync"
          icon={CalendarPlus}
          variant="secondary"
          style={styles.halfButton}
          onPress={onCalendarSync}
        />
      </View>

      <SectionHeader title="Upcoming" note="One place for assignments and exams" />
      <View style={styles.list}>
        {plan.upcoming.map((assignment) => (
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
        ))}
      </View>

      <SectionHeader title="Exam Countdown" note="Study pressure without panic" />
      <View style={styles.examRail}>
        {plan.exams.map((assignment) => (
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
        ))}
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
    kicker: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900"
    },
    title: {
      ...typography.title
    },
    subtitle: {
      ...typography.body
    },
    metricRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg
    },
    nextCard: {
      marginTop: spacing.lg,
      borderRadius: radii.lg,
      backgroundColor: colors.heroSurface,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: colors.line,
      padding: spacing.lg,
      gap: spacing.sm
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
      color: colors.heroText,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "900"
    },
    nextMeta: {
      color: colors.heroMuted,
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
    halfButton: {
      flex: 1
    },
    list: {
      gap: spacing.sm
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
