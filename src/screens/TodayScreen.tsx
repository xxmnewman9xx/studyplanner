import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Bell, CalendarPlus, ChevronRight, Crown, Target } from "lucide-react-native";

import { AppButton } from "../components/AppButton";
import { AssignmentCard } from "../components/AssignmentCard";
import {
  DateStrip,
  PremiumCard,
  ScanCallout,
  ScreenHeader,
  StatChip,
  StatusBadge,
  TaskRow,
  WarningCard,
  WidgetPreviewSection,
  WorkloadBars
} from "../components/PremiumUI";
import { SectionHeader } from "../components/SectionHeader";
import { isStoreCaptureEnabled } from "../config/storeCapture";
import { storeCaptureNow } from "../data/demoSemester";
import {
  buildTodayPlan,
  buildWeekPlan,
  daysUntil,
  getCourseForAssignment,
  urgencyLabel
} from "../logic/planner";
import { Assignment, Course, Semester } from "../models";
import { WidgetSnapshotService } from "../services/widgetSnapshotService";
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
  const now = isStoreCaptureEnabled() ? storeCaptureNow : new Date();
  const plan = buildTodayPlan(assignments, semester, now);
  const weekPlan = buildWeekPlan(assignments, now);
  const widgetSnapshot = WidgetSnapshotService.build(
    {
      semester,
      courses,
      assignments,
      demoState: isStoreCaptureEnabled() ? { enabled: true, label: "Preview" } : undefined
    },
    now
  );
  const nextCourse = plan.nextAction ? getCourseForAssignment(courses, plan.nextAction) : undefined;
  const reviewQueueCount = assignments.filter(
    (assignment) => assignment.reviewStatus === "needsReview"
  ).length;
  const activeDate = weekPlan.days.find((day) => day.items.length > 0)?.date || weekPlan.days[0]?.date;
  const workloadValues = weekPlan.days.map((day) => day.items.length);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        eyebrow={semester.name}
        title="Good morning, Alex"
        subtitle="You've got a great day to stay ahead."
      />

      <PremiumCard tone="hero">
        <View style={styles.nextHeader}>
          <View style={styles.nextIcon}>
            <Target color={colors.heroText} size={20} />
          </View>
          <View style={styles.nextHeaderCopy}>
            <Text style={styles.nextLabel}>Next Due</Text>
            <Text style={styles.nextSubLabel}>{widgetSnapshot.nextDue?.dueLabel || "Your plan is clear"}</Text>
          </View>
          {plan.nextAction ? (
            <StatusBadge label={urgencyLabel(plan.nextAction, now)} tone="purple" />
          ) : null}
        </View>

        {plan.nextAction ? (
          <>
            <Text style={styles.nextTitle}>{plan.nextAction.title}</Text>
            <Text style={styles.nextMeta}>
              {nextCourse?.code} - {plan.nextAction.estimatedMinutes} min - due in{" "}
              {daysUntil(plan.nextAction.dueAt, now)} days
            </Text>
            <View style={styles.nextActions}>
              <AppButton
                label="Start"
                icon={ChevronRight}
                variant="secondary"
                onPress={() => onUpdateStatus(plan.nextAction!.id, "in_progress")}
              />
              <AppButton
                label="Complete"
                onPress={() => onUpdateStatus(plan.nextAction!.id, "done")}
              />
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No next deadline yet.</Text>
            <Text style={styles.nextMeta}>Scan a syllabus or add coursework to build the daily plan.</Text>
          </View>
        )}
      </PremiumCard>

      <View style={styles.metricRow}>
        <StatChip label="Due Today" value={String(plan.dueToday.length)} tone="purple" />
        <StatChip label="Due This Week" value={String(weekPlan.itemCount)} tone="blue" />
        <StatChip
          label="Review Inbox"
          value={String(reviewQueueCount)}
          tone={reviewQueueCount > 0 ? "gold" : "green"}
        />
      </View>

      {weekPlan.heavyWorkloadWarning ? (
        <WarningCard
          title="Heavy Week Ahead"
          message={`You have ${weekPlan.heavyWorkloadWarning} this week. Plan ahead to stay on track.`}
          actionLabel="View Week"
          onPress={() => undefined}
        />
      ) : null}

      <ScanCallout onPress={onOpenImport} />

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

      <SectionHeader title="Today" note={`${plan.dueToday.length} focus item${plan.dueToday.length === 1 ? "" : "s"}`} />
      <View style={styles.list}>
        {plan.dueToday.length === 0 ? (
          <Text style={styles.emptyCard}>No deadlines today.</Text>
        ) : (
          plan.dueToday.map((assignment) => (
            <TaskRow
              key={assignment.id}
              assignment={assignment}
              course={getCourseForAssignment(courses, assignment)}
              onOpen={() => onOpenAssignment(assignment.id)}
              onComplete={() => onUpdateStatus(assignment.id, "done")}
            />
          ))
        )}
      </View>

      <SectionHeader title="This Week" note={`${weekPlan.itemCount} deadlines`} />
      <PremiumCard>
        <DateStrip
          activeDate={activeDate}
          days={weekPlan.days.map((day) => ({
            date: day.date,
            label: day.label,
            count: day.items.length
          }))}
        />
        <WorkloadBars values={workloadValues} />
      </PremiumCard>

      <View style={styles.weekDayStack}>
        {weekPlan.itemCount === 0 ? (
          <Text style={styles.emptyCard}>The next seven days are clear.</Text>
        ) : (
          weekPlan.days
            .filter((day) => day.items.length > 0)
            .map((day) => (
              <View key={day.date} style={styles.weekGroup}>
                <View style={styles.weekGroupHeader}>
                  <Text style={styles.weekDayLabel}>{day.label}</Text>
                  <Text style={styles.weekDayCount}>
                    {day.items.length} item{day.items.length === 1 ? "" : "s"}
                  </Text>
                </View>
                <View style={styles.list}>
                  {day.items.map((assignment) => (
                    <TaskRow
                      key={assignment.id}
                      assignment={assignment}
                      course={getCourseForAssignment(courses, assignment)}
                      onOpen={() => onOpenAssignment(assignment.id)}
                      onComplete={() => onUpdateStatus(assignment.id, "done")}
                      compact
                    />
                  ))}
                </View>
              </View>
            ))
        )}
      </View>

      <PremiumCard>
        <WidgetPreviewSection snapshot={widgetSnapshot} />
      </PremiumCard>

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
              <Text style={styles.examBadge}>{daysUntil(assignment.dueAt, now)} days</Text>
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
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    screen: {
      gap: spacing.md
    },
    metricRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    nextHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    nextIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.lg,
      backgroundColor: colors.brandPurple,
      alignItems: "center",
      justifyContent: "center"
    },
    nextHeaderCopy: {
      flex: 1,
      gap: 2
    },
    nextLabel: {
      color: colors.brandPurple,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    nextSubLabel: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    nextTitle: {
      color: colors.ink,
      fontSize: 21,
      lineHeight: 27,
      fontWeight: "900"
    },
    nextMeta: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700"
    },
    nextActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs
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
    actionRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    halfButton: {
      flex: 1
    },
    list: {
      gap: spacing.sm
    },
    emptyCard: {
      overflow: "hidden",
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700"
    },
    weekDayStack: {
      gap: spacing.sm
    },
    weekGroup: {
      gap: spacing.sm
    },
    weekGroupHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    weekDayLabel: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    weekDayCount: {
      color: colors.faint,
      fontSize: 12,
      fontWeight: "900"
    },
    examRail: {
      flexDirection: "row",
      gap: spacing.sm,
      flexWrap: "wrap"
    },
    examCard: {
      flexBasis: "48%",
      minHeight: 118,
      borderRadius: radii.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.12 : 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2
    },
    examBadge: {
      alignSelf: "flex-start",
      overflow: "hidden",
      borderRadius: radii.round,
      backgroundColor: colors.redSoft,
      color: colors.red,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      fontSize: 11,
      fontWeight: "900"
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
