import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Bell, CalendarPlus, ChevronRight, Crown, Timer } from "lucide-react-native";
import {
  AppLogo,
  AssignmentRow,
  EmptyState,
  GlassCard,
  StatPill
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
  studentName,
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
  onOpenWidgets
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
        <TouchableOpacity accessibilityRole="button" style={styles.scanButton} onPress={onOpenScan}>
          <Text style={styles.scanButtonText}>Scan</Text>
        </TouchableOpacity>
      </View>

      <GlassCard tone="hero" style={styles.heroCard}>
        <Text style={styles.heroKicker}>Good morning, {studentName.split(" ")[0] || "Alex"}</Text>
        <Text style={styles.heroTitle}>You’ve got this.</Text>
        {plan.nextAction ? (
          <View style={styles.nextHero}>
            <View style={styles.nextHeroCopy}>
              <Text style={styles.nextKicker}>
                Next up {nextDueDays <= 0 ? "today" : `in ${nextDueDays} days`}
              </Text>
              <Text style={styles.nextTitle}>{nextCourse?.code} - {plan.nextAction.title}</Text>
              <Text style={styles.nextMeta}>
                Due {formatDateOnly(plan.nextAction.dueAt.slice(0, 10))} · {plan.nextAction.estimatedMinutes}m · {nextCourse?.period || "class"}
              </Text>
            </View>
            <AppButton
              label="Start now"
              icon={ChevronRight}
              onPress={() => onUpdateStatus(plan.nextAction!.id, "in_progress")}
              style={styles.startButton}
            />
          </View>
        ) : (
          <EmptyState title="All caught up" copy="No urgent work in the planner right now." emoji="complete" />
        )}
      </GlassCard>

      <View style={styles.statsRow}>
        <StatPill label="Due Today" value={String(plan.dueToday.length)} tone="pink" />
        <StatPill label="Due Soon" value={String(plan.dueSoon.length)} tone="gold" />
        <StatPill label="Needs Check" value={String(plan.needsReview.length)} tone="plain" />
      </View>

      <View style={styles.quickGrid}>
        <QuickAction title="Plan" copy="Calendar + week load" onPress={onOpenPlan} />
        <QuickAction title="Classes" copy={`${courses.length} active`} onPress={onOpenClasses} />
        <QuickAction title="Widgets" copy="Studio + themes" onPress={onOpenWidgets} />
      </View>

      <View style={styles.actionRow}>
        <AppButton label="Start Focus" icon={Timer} onPress={onOpenFocus} style={styles.actionButton} />
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

      <SectionHeader title="Today" note="Agenda sorted by urgency and class color" />
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
              trailing={<Text style={styles.doneButtonText}>{assignment.status === "done" ? "Done" : "Open"}</Text>}
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
    </View>
  );

  function QuickAction({ title, copy, onPress }: { title: string; copy: string; onPress: () => void }) {
    return (
      <TouchableOpacity accessibilityRole="button" style={styles.quickAction} onPress={onPress}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickCopy}>{copy}</Text>
      </TouchableOpacity>
    );
  }
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    screen: {
      gap: 0
    },
    identityRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.lg,
      gap: spacing.md
    },
    scanButton: {
      minHeight: 38,
      borderRadius: radii.round,
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.md,
      alignItems: "center",
      justifyContent: "center"
    },
    scanButtonText: {
      color: colors.heroText,
      fontSize: 13,
      fontWeight: "900"
    },
    heroCard: {
      gap: spacing.md
    },
    heroKicker: {
      color: colors.heroMuted,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "800"
    },
    heroTitle: {
      ...typography.title,
      color: colors.heroText
    },
    nextHero: {
      borderRadius: radii.xl,
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      padding: spacing.md,
      gap: spacing.md
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
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "900"
    },
    nextMeta: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    startButton: {
      alignSelf: "flex-start",
      backgroundColor: colors.brandPink
    },
    statsRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg
    },
    quickGrid: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md
    },
    quickAction: {
      flex: 1,
      minHeight: 68,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      justifyContent: "center"
    },
    quickTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    quickCopy: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    actionRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md
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
