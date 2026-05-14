import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Bell, CalendarPlus, ChevronRight, Crown, Timer } from "lucide-react-native";
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
  onOpenFocus: () => void;
  onOpenScan: () => void;
  onOpenPlan: () => void;
  onOpenClasses: () => void;
  onOpenWidgets: () => void;
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
  onOpenFocus
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

  return (
    <View style={styles.screen}>
      <View style={styles.identityRow}>
        <AppLogo showWordmark size={42} />
      </View>

      <GlassCard tone="hero" style={styles.heroCard}>
        <Text style={styles.heroKicker}>Up next</Text>
        <Text style={styles.heroTitle}>Focus on this first</Text>
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
                onPress={() => onUpdateStatus(plan.nextAction!.id, "in_progress")}
                style={styles.startButton}
              />
              <AppButton
                label="Focus timer"
                icon={Timer}
                variant="secondary"
                onPress={onOpenFocus}
                style={styles.focusButton}
              />
            </View>
          </View>
        ) : (
          <EmptyState title="All caught up" copy="No urgent work in the planner right now." emoji="complete" />
        )}
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
