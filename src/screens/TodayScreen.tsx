import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Bell, CalendarPlus, FileScan } from "lucide-react-native";

import {
  CalendarSignalCard,
  CourseBalanceCard,
  WorkloadInsightCard
} from "../components/InsightCards";
import {
  CommandCenterHero,
  GlassCard,
  MetricPill,
  PremiumHeader,
  PremiumScreen,
  TaskRow,
  WeekStrip,
  WidgetShowcase,
  WarningCard,
  WorkloadBars
} from "../components/PremiumUI";
import { isStoreCaptureEnabled } from "../config/storeCapture";
import { storeCaptureNow } from "../data/demoSemester";
import {
  buildTodayPlan,
  buildWeekPlan,
  getCourseForAssignment,
  urgencyLabel
} from "../logic/planner";
import { buildMonthCalendarPlan, buildSemesterInsights } from "../logic/semesterInsights";
import { Assignment, Course, Semester } from "../models";
import { WidgetSnapshotService } from "../services/widgetSnapshotService";
import { AppTheme, WidgetStylePresetId } from "../theme";
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
  onOpenWeek: () => void;
  onOpenCalendar: () => void;
  widgetStyleId?: WidgetStylePresetId;
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
  onOpenWeek,
  onOpenCalendar,
  widgetStyleId,
  premiumAutomationLocked,
  onOpenPaywall
}: TodayScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const captureMode = isStoreCaptureEnabled();
  const now = captureMode ? storeCaptureNow : new Date();
  const plan = buildTodayPlan(assignments, semester, now);
  const weekPlan = buildWeekPlan(assignments, now);
  const widgetSnapshot = WidgetSnapshotService.build(
    {
        semester,
        courses,
        assignments,
        paletteId: theme.palette.id,
        widgetStyleId,
        demoState: captureMode ? { enabled: true, label: "Preview" } : undefined
      },
      now
  );
  const heroAssignment = useMemo(
    () =>
      assignments.find((assignment) => assignment.id === widgetSnapshot.nextDue?.assignmentId) ||
      plan.nextAction,
    [assignments, plan.nextAction, widgetSnapshot.nextDue?.assignmentId]
  );
  const heroCourse = heroAssignment ? getCourseForAssignment(courses, heroAssignment) : undefined;
  const heroDueLabel = heroAssignment ? urgencyLabel(heroAssignment, now) : widgetSnapshot.emptyState.title;
  const activeDate =
    weekPlan.days.find((day) => day.items.length > 0)?.date || weekPlan.days[0]?.date;
  const monthPlan = useMemo(
    () => buildMonthCalendarPlan({ assignments, courses, now }),
    [assignments, courses, now]
  );
  const insights = useMemo(
    () => buildSemesterInsights(assignments, courses, now),
    [assignments, courses, now]
  );
  const needsCheckCount = assignments.filter(
    (assignment) => assignment.reviewStatus === "needsReview"
  ).length;
  const todayItems = plan.dueToday.slice(0, captureMode ? 2 : 4);
  const upcomingItems = plan.upcoming
    .filter((assignment) => assignment.id !== heroAssignment?.id)
    .slice(0, 4);

  const automationPress = (kind: "reminders" | "calendar") => {
    if (premiumAutomationLocked) {
      onOpenPaywall();
      return;
    }

    if (kind === "reminders") {
      onScheduleReminders();
      return;
    }

    onCalendarSync();
  };

  return (
    <PremiumScreen>
      <PremiumHeader
        eyebrow={semester.name}
        title={captureMode ? "Good morning, Alex" : "Today"}
        subtitle={captureMode ? "Let's make it a productive day." : "See what is due and what to do next."}
        right={
          captureMode ? null : (
            <View style={styles.headerActions}>
              <CircleAction label="Add" onPress={onOpenImport}>
                <FileScan color={colors.brandPurple} size={17} />
              </CircleAction>
              <CircleAction label="Remind" onPress={() => automationPress("reminders")}>
                <Bell color={colors.brandPurple} size={17} />
              </CircleAction>
              <CircleAction label="Sync" onPress={() => automationPress("calendar")}>
                <CalendarPlus color={colors.brandPurple} size={17} />
              </CircleAction>
            </View>
          )
        }
      />

      <CommandCenterHero
        assignment={heroAssignment}
        course={heroCourse}
        dueLabel={heroDueLabel}
        now={now}
        onOpen={heroAssignment ? () => onOpenAssignment(heroAssignment.id) : undefined}
        onStart={heroAssignment ? () => onUpdateStatus(heroAssignment.id, "in_progress") : undefined}
        onComplete={heroAssignment ? () => onUpdateStatus(heroAssignment.id, "done") : undefined}
      />

      <View style={styles.metricRow}>
        <MetricPill label="Due Today" value={String(plan.dueToday.length)} tone="purple" />
        <MetricPill label="Due This Week" value={String(weekPlan.itemCount)} tone="blue" />
        <MetricPill label="Past Due" value={String(plan.overdue.length)} tone={plan.overdue.length > 0 ? "red" : "green"} />
      </View>

      {weekPlan.heavyWorkloadWarning ? (
        <WarningCard
          title="Busy week ahead"
          message={`${weekPlan.heavyWorkloadWarning}. Open Week Plan to pick calmer study blocks.`}
          actionLabel="Open Week"
          onPress={onOpenWeek}
        />
      ) : null}

      {needsCheckCount > 0 ? (
        <WarningCard
          title="Check new work"
          message={`${needsCheckCount} found item${needsCheckCount === 1 ? "" : "s"} need your check before they show as due dates.`}
          actionLabel="Check Work"
          onPress={onOpenImport}
        />
      ) : null}

      <View style={styles.sectionTop}>
        <View>
          <Text style={styles.sectionTitle}>Today</Text>
          <Text style={styles.sectionMeta}>
            {todayItems.length} focus item{todayItems.length === 1 ? "" : "s"}
          </Text>
        </View>
      </View>
      <View style={styles.layeredStack}>
        {todayItems.length === 0 ? (
          <GlassCard>
            <Text style={styles.emptyTitle}>No deadlines today.</Text>
            <Text style={styles.emptyCopy}>
              Start the next item above, or check the week plan when you have extra time.
            </Text>
          </GlassCard>
        ) : (
          todayItems.map((assignment, index) => (
            <View key={assignment.id} style={[styles.layeredItem, { marginTop: index === 0 ? 0 : -4 }]}>
              <TaskRow
                assignment={assignment}
                course={getCourseForAssignment(courses, assignment)}
                now={now}
                onOpen={() => onOpenAssignment(assignment.id)}
                onComplete={() => onUpdateStatus(assignment.id, "done")}
              />
            </View>
          ))
        )}
      </View>

      <CalendarSignalCard monthPlan={monthPlan} onPress={onOpenCalendar} />

      <GlassCard style={styles.weekCard}>
        <View style={styles.sectionTop}>
          <View>
            <Text style={styles.sectionTitle}>Due this week</Text>
            <Text style={styles.sectionMeta}>{weekPlan.itemCount} deadlines in the next seven days</Text>
          </View>
          <Text style={styles.sectionAccent}>{weekPlan.examCount} exams</Text>
        </View>
        <WeekStrip
          activeDate={activeDate}
          days={weekPlan.days.map((day) => ({
            date: day.date,
            label: day.label,
            count: day.items.length
          }))}
        />
        <WorkloadBars values={weekPlan.days.map((day) => day.items.length)} />
      </GlassCard>

      <WorkloadInsightCard
        insights={insights}
        title="Workload"
        subtitle="Bars show how many assignments or exams are due each day"
      />

      <GlassCard>
        <WidgetShowcase snapshot={widgetSnapshot} />
      </GlassCard>

      <CourseBalanceCard insights={insights} title="Work by class" />

      {upcomingItems.length > 0 ? (
        <>
          <View style={styles.sectionTop}>
            <View>
            <Text style={styles.sectionTitle}>Up Next</Text>
              <Text style={styles.sectionMeta}>Tap an item to see details or mark it done</Text>
            </View>
          </View>
          <View style={styles.layeredStack}>
            {upcomingItems.map((assignment) => (
              <TaskRow
                key={assignment.id}
                assignment={assignment}
                course={getCourseForAssignment(courses, assignment)}
                now={now}
                onOpen={() => onOpenAssignment(assignment.id)}
                onComplete={() => onUpdateStatus(assignment.id, "done")}
                compact
              />
            ))}
          </View>
        </>
      ) : null}
    </PremiumScreen>
  );
}

function CircleAction({
  label,
  children,
  onPress
}: {
  label: string;
  children: React.ReactNode;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.82}
      style={styles.circleActionWrap}
      onPress={onPress}
    >
      <View style={styles.circleAction}>{children}</View>
      <Text style={styles.circleActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    headerActions: {
      flexDirection: "row",
      gap: 8
    },
    circleActionWrap: {
      width: 42,
      alignItems: "center",
      gap: 3
    },
    circleAction: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface
    },
    circleActionLabel: {
      color: colors.muted,
      fontSize: 9,
      lineHeight: 11,
      fontWeight: "800",
      textAlign: "center"
    },
    metricRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    weekCard: {
      paddingBottom: spacing.sm
    },
    sectionTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "900"
    },
    sectionMeta: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "700"
    },
    sectionAccent: {
      overflow: "hidden",
      borderRadius: radii.round,
      backgroundColor: colors.purpleSoft,
      color: colors.brandPurple,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      fontSize: 11,
      fontWeight: "900"
    },
    layeredStack: {
      gap: spacing.sm
    },
    layeredItem: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.04,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 }
    },
    emptyTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    emptyCopy: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    }
  });
}
