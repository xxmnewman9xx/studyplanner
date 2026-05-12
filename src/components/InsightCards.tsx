import React from "react";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { CalendarRange, CheckCircle2, ChevronRight, Flame, PieChart } from "lucide-react-native";

import { MonthCalendarPlan, SemesterInsightPlan } from "../logic/semesterInsights";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { GlassCard, StatusBadge } from "./PremiumUI";

export function CalendarSignalCard({
  monthPlan,
  onPress,
  style
}: {
  monthPlan: MonthCalendarPlan;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const monthDays = monthPlan.days.filter((day) => day.isCurrentMonth).slice(0, 14);
  const content = (
    <GlassCard style={[styles.calendarSignal, style]}>
      <View pointerEvents="none" style={styles.signalBand} />
      <View style={styles.cardTop}>
        <View style={styles.iconTile}>
          <CalendarRange color={colors.heroText} size={18} />
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.kicker}>Monthly Calendar</Text>
          <Text style={styles.title}>{monthPlan.monthLabel}</Text>
          <Text style={styles.meta}>
            {monthPlan.summary.dueThisMonth} due - {monthPlan.summary.heavyDayCount} busy days
          </Text>
        </View>
        {onPress ? <ChevronRight color={colors.faint} size={18} /> : null}
      </View>

      <View style={styles.monthMiniGrid}>
        {monthDays.map((day) => (
          <View
            key={day.date}
            style={[
              styles.monthMiniDay,
              day.isToday ? styles.monthMiniToday : null,
              day.isHeavy ? styles.monthMiniHeavy : null
            ]}
          >
            <Text style={[styles.monthMiniNumber, day.isToday ? styles.monthMiniNumberActive : null]}>
              {day.dayNumber}
            </Text>
            <View style={styles.monthMiniDots}>
              {day.courseColors.slice(0, 3).map((color, index) => (
                <View key={`${day.date}-${color}-${index}`} style={[styles.monthMiniDot, { backgroundColor: color }]} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </GlassCard>
  );

  return onPress ? (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.84} onPress={onPress}>
      {content}
    </TouchableOpacity>
  ) : (
    content
  );
}

export function WorkloadInsightCard({
  insights,
  title = "Workload Forecast",
  subtitle = "Open deadlines across the next seven days",
  style
}: {
  insights: SemesterInsightPlan;
  title?: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const max = Math.max(1, ...insights.workloadByDay.map((day) => day.count));

  return (
    <GlassCard style={[styles.insightCard, style]}>
      <View style={styles.cardTop}>
        <View style={styles.iconTile}>
          <Flame color={colors.heroText} size={18} />
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.kicker}>Due by day</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>{subtitle}</Text>
        </View>
        {insights.heavyWeekLabel ? <StatusBadge label="Busy week" tone="gold" /> : null}
      </View>

      <View style={styles.workloadGraph}>
        {insights.workloadByDay.map((day) => (
          <View key={day.date} style={styles.workloadColumn}>
            <View style={styles.workloadTrack}>
              <View
                style={[
                  styles.workloadFill,
                  {
                    height: `${Math.max(12, (day.count / max) * 100)}%` as `${number}%`,
                    backgroundColor: day.examCount > 0 ? colors.brandCoral : colors.brandPurple
                  }
                ]}
              />
            </View>
            <Text style={styles.workloadLabel}>{day.label.slice(0, 1)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.insightFooter}>
        <Text style={styles.footerText}>
          {insights.busiestDay
            ? `${insights.busiestDay.label}: ${insights.busiestDay.count} item${
                insights.busiestDay.count === 1 ? "" : "s"
              }`
            : "No deadline pressure yet"}
        </Text>
        <Text style={styles.footerAccent}>{insights.weekExamCount} exams</Text>
      </View>
    </GlassCard>
  );
}

export function CourseBalanceCard({
  insights,
  title = "Work by class",
  maxCourses = 4,
  style
}: {
  insights: SemesterInsightPlan;
  title?: string;
  maxCourses?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const rows = insights.courseBalance.slice(0, maxCourses);
  const max = Math.max(1, ...rows.map((course) => course.openCount));

  return (
    <GlassCard style={[styles.insightCard, style]}>
      <View style={styles.cardTop}>
        <View style={styles.iconTile}>
          <PieChart color={colors.heroText} size={18} />
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.kicker}>Classes</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>{insights.openCount} open assignments and exams</Text>
        </View>
      </View>

      <View style={styles.balanceRows}>
        {rows.map((course) => (
          <View key={course.courseId} style={styles.balanceRow}>
            <Text style={styles.balanceLabel} numberOfLines={1}>
              {course.courseName}
            </Text>
            <View style={styles.balanceTrack}>
              <View
                style={[
                  styles.balanceFill,
                  {
                    width: `${Math.max(8, (course.openCount / max) * 100)}%` as `${number}%`,
                    backgroundColor: course.color
                  }
                ]}
              />
            </View>
            <Text style={styles.balanceValue}>{course.openCount}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

export function CompletionInsightCard({
  insights,
  style
}: {
  insights: SemesterInsightPlan;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <GlassCard style={[styles.completionCard, style]}>
      <View style={styles.cardTop}>
        <View style={styles.iconTile}>
          <CheckCircle2 color={colors.heroText} size={18} />
        </View>
        <View style={styles.cardCopy}>
          <Text style={styles.kicker}>Progress</Text>
          <Text style={styles.title}>{insights.completionPercent}% complete</Text>
          <Text style={styles.meta}>
            {insights.completedCount} done - {insights.openCount} open
          </Text>
        </View>
      </View>
      <View style={styles.completionTrack}>
        <View
          style={[
            styles.completionFill,
            { width: `${Math.max(4, insights.completionPercent)}%` as `${number}%` }
          ]}
        />
      </View>
    </GlassCard>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    calendarSignal: {
      overflow: "hidden",
      borderColor: "rgba(108,92,231,0.20)"
    },
    signalBand: {
      position: "absolute",
      top: -42,
      right: -52,
      width: 210,
      height: 100,
      borderRadius: 34,
      backgroundColor: `${colors.brandBlue}33`,
      transform: [{ rotate: "22deg" }]
    },
    insightCard: {
      overflow: "hidden"
    },
    completionCard: {
      overflow: "hidden",
      borderColor: `${colors.green}33`
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    iconTile: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandPurple
    },
    cardCopy: {
      flex: 1,
      minWidth: 0,
      gap: 1
    },
    kicker: {
      color: colors.brandPurple,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    title: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    meta: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    monthMiniGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5
    },
    monthMiniDay: {
      width: "10.8%",
      minHeight: 42,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      gap: 3
    },
    monthMiniToday: {
      backgroundColor: colors.brandPurple,
      borderColor: colors.brandPurple
    },
    monthMiniHeavy: {
      borderColor: `${colors.brandCoral}66`
    },
    monthMiniNumber: {
      color: colors.ink,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    monthMiniNumberActive: {
      color: colors.heroText
    },
    monthMiniDots: {
      minHeight: 5,
      flexDirection: "row",
      gap: 2
    },
    monthMiniDot: {
      width: 4,
      height: 4,
      borderRadius: 2
    },
    workloadGraph: {
      height: 112,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      paddingHorizontal: spacing.xs
    },
    workloadColumn: {
      flex: 1,
      height: "100%",
      alignItems: "center",
      gap: 5
    },
    workloadTrack: {
      flex: 1,
      width: "100%",
      borderRadius: radii.round,
      backgroundColor: colors.graphTrack,
      justifyContent: "flex-end",
      overflow: "hidden"
    },
    workloadFill: {
      width: "100%",
      borderRadius: radii.round
    },
    workloadLabel: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    insightFooter: {
      minHeight: 34,
      borderRadius: radii.round,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    footerText: {
      flex: 1,
      color: colors.ink,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    footerAccent: {
      color: colors.brandPurple,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    balanceRows: {
      gap: spacing.xs
    },
    balanceRow: {
      minHeight: 28,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    balanceLabel: {
      width: 78,
      color: colors.ink,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    balanceTrack: {
      flex: 1,
      height: 10,
      borderRadius: radii.round,
      backgroundColor: colors.graphTrack,
      overflow: "hidden"
    },
    balanceFill: {
      height: "100%",
      borderRadius: radii.round
    },
    balanceValue: {
      width: 18,
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textAlign: "right"
    },
    completionTrack: {
      height: 12,
      borderRadius: radii.round,
      backgroundColor: colors.graphTrack,
      overflow: "hidden"
    },
    completionFill: {
      height: "100%",
      borderRadius: radii.round,
      backgroundColor: colors.green
    }
  });
}
