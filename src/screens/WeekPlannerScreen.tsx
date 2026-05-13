import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  GlassCard,
  LoopStepper,
  MetricPill,
  PremiumHeader,
  PremiumScreen,
  StatusBadge,
  TaskRow,
  WeekStrip,
  WarningCard,
  WorkloadBars
} from "../components/PremiumUI";
import { isStoreCaptureEnabled } from "../config/storeCapture";
import { storeCaptureNow } from "../data/demoSemester";
import { getPreferredLocale } from "../logic/dateUtils";
import { buildWeekPlan, getCourseForAssignment } from "../logic/planner";
import { Assignment, Course, Semester } from "../models";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type WeekPlannerScreenProps = {
  semester: Semester;
  assignments: Assignment[];
  courses: Course[];
  onUpdateStatus: (assignmentId: string, status: "not_started" | "in_progress" | "done") => void;
  onToggleDone: (assignmentId: string) => void;
  onOpenAssignment: (assignmentId: string) => void;
};

export function WeekPlannerScreen({
  semester,
  assignments,
  courses,
  onUpdateStatus,
  onToggleDone,
  onOpenAssignment
}: WeekPlannerScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const captureMode = isStoreCaptureEnabled();
  const now = captureMode ? storeCaptureNow : new Date();
  const weekPlan = buildWeekPlan(assignments, now);
  const defaultActiveDate =
    (captureMode ? weekPlan.days[2]?.date : undefined) ||
    weekPlan.days.find((day) => day.items.length > 0)?.date ||
    weekPlan.days[0]?.date ||
    "";
  const [activeDate, setActiveDate] = useState(defaultActiveDate);
  const visibleDays = useMemo(
    () =>
      weekPlan.days.filter(
        (day) => day.items.length > 0 || day.date === activeDate || !captureMode
      ),
    [activeDate, captureMode, weekPlan.days]
  );

  useEffect(() => {
    if (!weekPlan.days.some((day) => day.date === activeDate)) {
      setActiveDate(defaultActiveDate);
    }
  }, [activeDate, defaultActiveDate, weekPlan.days]);

  return (
    <PremiumScreen>
      <PremiumHeader
        eyebrow={semester.name}
        title="Plan Week"
        subtitle="See every deadline for the next seven days."
      />

      <LoopStepper activeIndex={2} compact />

      <GlassCard style={styles.rangeCard}>
        <View pointerEvents="none" style={styles.rangeBand} />
        <View style={styles.weekRangeTop}>
          <View>
            <Text style={styles.rangeKicker}>This week</Text>
            <Text style={styles.rangeTitle}>{formatRange(weekPlan.startsAt, weekPlan.endsAt)}</Text>
            <Text style={styles.rangeMeta}>{weekPlan.itemCount} deadlines across seven days</Text>
          </View>
          <StatusBadge label={`${weekPlan.examCount} exams`} tone={weekPlan.examCount > 0 ? "red" : "green"} />
        </View>
        <WeekStrip
          activeDate={activeDate}
          onSelect={setActiveDate}
          days={weekPlan.days.map((day) => ({
            date: day.date,
            label: day.label,
            count: day.items.length
          }))}
        />
      </GlassCard>

      <View style={styles.metricRow}>
        <MetricPill label="Deadlines" value={String(weekPlan.itemCount)} tone="purple" />
        <MetricPill label="Assignments" value={String(weekPlan.itemCount - weekPlan.examCount)} tone="blue" />
        <MetricPill label="Exams" value={String(weekPlan.examCount)} tone="red" />
      </View>

      {weekPlan.heavyWorkloadWarning ? (
        <WarningCard
          title="Busy week"
          message={`${weekPlan.heavyWorkloadWarning}. Pick the busiest days first and block time.`}
        />
      ) : null}

      <GlassCard style={styles.loadCard}>
        <View style={styles.sectionTop}>
          <View>
            <Text style={styles.sectionTitle}>Workload</Text>
            <Text style={styles.sectionMeta}>Bars show how many deadlines are due each day</Text>
          </View>
        </View>
        <WorkloadBars values={weekPlan.days.map((day) => day.items.length)} />
        <View style={styles.barLabels}>
          {weekPlan.days.map((day) => (
            <Text key={day.date} style={[styles.barLabel, day.date === activeDate ? styles.barLabelActive : null]}>
              {day.label.slice(0, 1)}
            </Text>
          ))}
        </View>
      </GlassCard>

      <View style={styles.dayStack}>
        {visibleDays.length === 0 ? (
          <GlassCard>
            <Text style={styles.emptyTitle}>No deadlines this week.</Text>
            <Text style={styles.emptyCopy}>No assignments or exams are due in the next seven days.</Text>
          </GlassCard>
        ) : (
          visibleDays.map((day) => (
            <View key={day.date} style={styles.dayGroup}>
              <View style={styles.dayHeader}>
                <View>
                  <Text style={styles.dayTitle}>{day.label}</Text>
                  <Text style={styles.dayMeta}>
                    {day.items.length} item{day.items.length === 1 ? "" : "s"}
                  </Text>
                </View>
                {day.exams.length > 0 ? <StatusBadge label="Exam day" tone="red" /> : null}
              </View>
              <View style={styles.taskStack}>
                {day.items.length === 0 ? (
                  <GlassCard>
                    <Text style={styles.emptyCopy}>No open work scheduled.</Text>
                  </GlassCard>
                ) : (
                  day.items.map((assignment) => (
                    <TaskRow
                      key={assignment.id}
                      assignment={assignment}
                      course={getCourseForAssignment(courses, assignment)}
                      now={now}
                      compact
                      onOpen={() => onOpenAssignment(assignment.id)}
                      onComplete={() => onToggleDone(assignment.id)}
                      right={
                        <StatusBadge
                          label={assignment.kind === "exam" ? "Exam" : assignment.kind}
                          tone={assignment.kind === "exam" ? "red" : assignment.priority === "high" ? "gold" : "blue"}
                        />
                      }
                    />
                  ))
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </PremiumScreen>
  );
}

function formatRange(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const locale = getPreferredLocale();
  const startLabel = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(startDate);
  const endLabel = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(endDate);
  return `${startLabel} - ${endLabel}`;
}

function createStyles(theme: AppTheme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
    rangeCard: {
      overflow: "hidden",
      backgroundColor: colors.surface,
      borderColor: `${colors.brandBlue}26`
    },
    rangeBand: {
      position: "absolute",
      top: -32,
      right: -48,
      width: 210,
      height: 96,
      borderRadius: 34,
      backgroundColor: `${colors.brandBlue}16`,
      transform: [{ rotate: "22deg" }]
    },
    weekRangeTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.sm
    },
    rangeKicker: {
      color: colors.brandPurple,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    rangeTitle: {
      color: colors.ink,
      fontSize: 19,
      lineHeight: 25,
      fontWeight: "900"
    },
    rangeMeta: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "700"
    },
    metricRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    sectionTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between"
    },
    loadCard: {
      borderColor: "rgba(59,130,246,0.18)"
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
    barLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xs
    },
    barLabel: {
      flex: 1,
      color: colors.faint,
      textAlign: "center",
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900"
    },
    barLabelActive: {
      color: colors.brandPurple
    },
    dayStack: {
      gap: spacing.md
    },
    dayGroup: {
      gap: spacing.sm
    },
    dayHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    dayTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    dayMeta: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    taskStack: {
      gap: spacing.sm
    },
    emptyTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
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
