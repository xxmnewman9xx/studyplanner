import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CalendarRange, CheckCircle2, ChevronLeft, ChevronRight, Filter } from "lucide-react-native";

import {
  CalendarSignalCard,
  CourseBalanceCard,
  CompletionInsightCard,
  WorkloadInsightCard
} from "../components/InsightCards";
import {
  GlassCard,
  MetricPill,
  PillFilter,
  PremiumHeader,
  PremiumScreen,
  StatusBadge,
  TaskRow,
  WarningCard,
  WeekStrip,
  WorkloadBars
} from "../components/PremiumUI";
import { isStoreCaptureEnabled } from "../config/storeCapture";
import { storeCaptureNow } from "../data/demoSemester";
import { buildMonthCalendarPlan, buildSemesterInsights, MonthCalendarDay } from "../logic/semesterInsights";
import { buildWeekPlan, getCourseForAssignment } from "../logic/planner";
import { Assignment, Course, Semester } from "../models";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type MonthlyCalendarScreenProps = {
  semester: Semester;
  assignments: Assignment[];
  courses: Course[];
  onUpdateStatus: (assignmentId: string, status: "not_started" | "in_progress" | "done") => void;
  onOpenAssignment: (assignmentId: string) => void;
  captureState?: string | null;
};

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthlyCalendarScreen({
  semester,
  assignments,
  courses,
  onUpdateStatus,
  onOpenAssignment,
  captureState
}: MonthlyCalendarScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const captureMode = isStoreCaptureEnabled();
  const now = captureMode ? storeCaptureNow : new Date();
  const [cursorMonth, setCursorMonth] = useState(now);
  const [selectedDate, setSelectedDate] = useState(toDateKey(now));
  const [courseFilterId, setCourseFilterId] = useState("all");
  const weekPlan = useMemo(() => buildWeekPlan(assignments, now), [assignments, now]);
  const monthPlan = useMemo(
    () =>
      buildMonthCalendarPlan({
        assignments,
        courses,
        now,
        monthDate: cursorMonth,
        courseFilterId
      }),
    [assignments, courses, courseFilterId, cursorMonth, now]
  );
  const insights = useMemo(() => buildSemesterInsights(assignments, courses, now), [assignments, courses, now]);
  const activeWeekDate = weekPlan.days.some((day) => day.date === selectedDate)
    ? selectedDate
    : weekPlan.days.find((day) => day.items.length > 0)?.date || weekPlan.days[0]?.date;
  const selectedDay =
    monthPlan.days.find((day) => day.date === selectedDate) ||
    monthPlan.days.find((day) => day.isToday) ||
    monthPlan.days.find((day) => day.isCurrentMonth && day.items.length > 0) ||
    monthPlan.days.find((day) => day.isCurrentMonth);

  useEffect(() => {
    if (!monthPlan.days.some((day) => day.date === selectedDate)) {
      const fallback =
        monthPlan.days.find((day) => day.isToday) ||
        monthPlan.days.find((day) => day.isCurrentMonth && day.items.length > 0) ||
        monthPlan.days.find((day) => day.isCurrentMonth);
      if (fallback) setSelectedDate(fallback.date);
    }
  }, [monthPlan.days, selectedDate]);

  useEffect(() => {
    if (!captureMode || captureState !== "calendar-filtered") return;
    const courseId = courses.some((course) => course.id === "chem-101")
      ? "chem-101"
      : courses[0]?.id;
    if (!courseId) return;

    const firstCourseAssignment = assignments.find((assignment) => assignment.courseId === courseId);
    setCourseFilterId(courseId);
    if (firstCourseAssignment) {
      const dueDateKey = toDateKey(new Date(firstCourseAssignment.dueAt));
      setSelectedDate(dueDateKey);
      setCursorMonth(new Date(firstCourseAssignment.dueAt));
    }
  }, [assignments, captureMode, captureState, courses]);

  return (
    <PremiumScreen>
      <PremiumHeader
        eyebrow={semester.name}
        title="Calendar"
        subtitle="Tap any day to see its assignments and exams."
        right={
          <View style={styles.navButtons}>
            <IconButton label="Previous month" onPress={() => setCursorMonth(monthPlan.previousMonthDate)}>
              <ChevronLeft color={colors.brandPurple} size={18} />
            </IconButton>
            <IconButton label="Next month" onPress={() => setCursorMonth(monthPlan.nextMonthDate)}>
              <ChevronRight color={colors.brandPurple} size={18} />
            </IconButton>
          </View>
        }
      />

      <GlassCard tint="hero" style={styles.monthHero}>
        <View pointerEvents="none" style={styles.heroBand} />
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <CalendarRange color={colors.heroText} size={20} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>Month view</Text>
            <Text style={styles.heroTitle}>{monthPlan.monthLabel}</Text>
            <Text style={styles.heroMeta}>
              This week: {monthPlan.summary.currentWeekCount} open - {monthPlan.summary.heavyWeekLabel || "steady workload"}
            </Text>
          </View>
          {monthPlan.summary.overdueCount > 0 ? (
            <StatusBadge label={`${monthPlan.summary.overdueCount} overdue`} tone="red" />
          ) : (
            <StatusBadge label="On track" tone="green" />
          )}
        </View>
      </GlassCard>

      <View style={styles.metricRow}>
        <MetricPill label="Due This Month" value={String(monthPlan.summary.dueThisMonth)} tone="purple" />
        <MetricPill label="Exams" value={String(monthPlan.summary.examCount)} tone="red" />
        <MetricPill label="Busy Days" value={String(monthPlan.summary.heavyDayCount)} tone="gold" />
        <MetricPill label="Done" value={String(monthPlan.summary.completedCount)} tone="green" />
      </View>

      {weekPlan.heavyWorkloadWarning ? (
        <WarningCard
          title="Busy week"
          message={`${weekPlan.heavyWorkloadWarning}. Use the calendar to choose when to work.`}
        />
      ) : null}

      <GlassCard style={styles.weekCalendarCard}>
        <View style={styles.sectionTop}>
          <View>
            <Text style={styles.sectionTitle}>This Week</Text>
            <Text style={styles.sectionMeta}>
              {weekPlan.itemCount} deadlines - {weekPlan.examCount} exams
            </Text>
          </View>
          <StatusBadge label="Tap a day" tone="purple" />
        </View>
        <WeekStrip
          activeDate={activeWeekDate}
          onSelect={setSelectedDate}
          days={weekPlan.days.map((day) => ({
            date: day.date,
            label: day.label,
            count: day.items.length
          }))}
        />
        <WorkloadBars values={weekPlan.days.map((day) => day.items.length)} />
      </GlassCard>

      <GlassCard style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <Filter color={colors.brandPurple} size={16} />
          <Text style={styles.filterTitle}>Course filters</Text>
        </View>
        <View style={styles.filterRow}>
          <PillFilter
            label="All"
            active={courseFilterId === "all"}
            count={assignments.length}
            onPress={() => setCourseFilterId("all")}
          />
          {courses.map((course) => (
            <PillFilter
              key={course.id}
              label={course.code}
              active={courseFilterId === course.id}
              count={assignments.filter((assignment) => assignment.courseId === course.id).length}
              onPress={() => setCourseFilterId(course.id)}
            />
          ))}
        </View>
      </GlassCard>

      <GlassCard style={styles.calendarCard}>
        <View style={styles.weekdayRow}>
          {weekdays.map((weekday, index) => (
            <Text key={`${weekday}-${index}`} style={styles.weekdayLabel}>
              {weekday}
            </Text>
          ))}
        </View>
        <View style={styles.monthGrid}>
          {monthPlan.weeks.map((week, weekIndex) => (
            <View key={`${monthPlan.monthKey}-${weekIndex}`} style={styles.weekRow}>
              {week.map((day) => (
                <CalendarDayCell
                  key={day.date}
                  day={day}
                  selected={day.date === selectedDay?.date}
                  onPress={() => setSelectedDate(day.date)}
                />
              ))}
            </View>
          ))}
        </View>
      </GlassCard>

      {selectedDay ? (
        <GlassCard style={styles.agendaCard}>
          <View style={styles.sectionTop}>
            <View>
              <Text style={styles.sectionTitle}>{formatSelectedDate(selectedDay.date)}</Text>
              <Text style={styles.sectionMeta}>
                {selectedDay.openItems.length} open - {selectedDay.completedItems.length} completed
              </Text>
            </View>
            {selectedDay.exams.length > 0 ? <StatusBadge label="Exam day" tone="red" /> : selectedDay.isHeavy ? <StatusBadge label="Busy day" tone="gold" /> : null}
          </View>

          <View style={styles.agendaList}>
            {selectedDay.items.length === 0 ? (
              <View style={styles.emptyAgenda}>
                <CheckCircle2 color={colors.green} size={20} />
                <View style={styles.emptyAgendaCopy}>
                  <Text style={styles.emptyTitle}>No coursework on this day.</Text>
                  <Text style={styles.emptyCopy}>The month grid will light up as deadlines land here.</Text>
                </View>
              </View>
            ) : (
              selectedDay.items.map((assignment) => (
                <TaskRow
                  key={assignment.id}
                  assignment={assignment}
                  course={getCourseForAssignment(courses, assignment)}
                  now={now}
                  compact
                  onOpen={() => onOpenAssignment(assignment.id)}
                  onComplete={() => onUpdateStatus(assignment.id, "done")}
                  right={
                    <StatusBadge
                      label={assignment.kind === "exam" ? "Exam" : assignment.completionStatus === "completed" ? "Done" : assignment.priority}
                      tone={
                        assignment.kind === "exam"
                          ? "red"
                          : assignment.completionStatus === "completed"
                            ? "green"
                            : assignment.priority === "high"
                              ? "gold"
                              : "blue"
                      }
                    />
                  }
                />
              ))
            )}
          </View>
        </GlassCard>
      ) : null}

      <View style={styles.weekTimeline}>
        <View style={styles.sectionTop}>
          <View>
            <Text style={styles.sectionTitle}>Week details</Text>
            <Text style={styles.sectionMeta}>Each row shows what is due that day</Text>
          </View>
        </View>
        {weekPlan.days
          .filter((day) => day.items.length > 0 || day.date === activeWeekDate || !captureMode)
          .map((day) => (
            <View key={day.date} style={styles.weekTimelineGroup}>
              <View style={styles.weekTimelineHeader}>
                <View>
                  <Text style={styles.weekTimelineTitle}>{day.label}</Text>
                  <Text style={styles.sectionMeta}>
                    {day.items.length} item{day.items.length === 1 ? "" : "s"}
                  </Text>
                </View>
                {day.exams.length > 0 ? <StatusBadge label="Exam day" tone="red" /> : null}
              </View>
              <View style={styles.agendaList}>
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
                      onComplete={() => onUpdateStatus(assignment.id, "done")}
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
          ))}
      </View>

      <CalendarSignalCard monthPlan={monthPlan} />
      <WorkloadInsightCard insights={insights} title="Due this week" />
      <CourseBalanceCard insights={insights} title="Work by class" />
      <CompletionInsightCard insights={insights} />
    </PremiumScreen>
  );
}

function CalendarDayCell({
  day,
  selected,
  onPress
}: {
  day: MonthCalendarDay;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      activeOpacity={0.82}
      style={[
        styles.dayCell,
        !day.isCurrentMonth ? styles.dayCellMuted : null,
        day.isToday ? styles.dayCellToday : null,
        day.isHeavy ? styles.dayCellHeavy : null,
        selected ? styles.dayCellSelected : null
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.dayNumber,
          !day.isCurrentMonth ? styles.dayNumberMuted : null,
          day.isToday || selected ? styles.dayNumberActive : null
        ]}
      >
        {day.dayNumber}
      </Text>
      <View style={styles.dayDots}>
        {day.courseColors.slice(0, 4).map((color, index) => (
          <View key={`${day.date}-${color}-${index}`} style={[styles.dayDot, { backgroundColor: color }]} />
        ))}
        {day.exams.length > 0 ? <View style={[styles.dayDot, { backgroundColor: colors.brandCoral }]} /> : null}
        {day.completedItems.length > 0 ? <View style={[styles.dayDot, { backgroundColor: colors.green }]} /> : null}
      </View>
    </TouchableOpacity>
  );
}

function IconButton({
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
      style={styles.iconButton}
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  );
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function formatSelectedDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    navButtons: {
      flexDirection: "row",
      gap: 7
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface
    },
    monthHero: {
      overflow: "hidden",
      backgroundColor: colors.surface,
      borderColor: `${colors.brandBlue}26`
    },
    heroBand: {
      position: "absolute",
      top: -38,
      right: -44,
      width: 220,
      height: 102,
      borderRadius: 34,
      backgroundColor: `${colors.brandBlue}16`,
      transform: [{ rotate: "23deg" }]
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    heroIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandPurple
    },
    heroCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    heroKicker: {
      color: colors.brandPurple,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    heroTitle: {
      color: colors.ink,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "900"
    },
    heroMeta: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "700"
    },
    metricRow: {
      flexDirection: "row",
      gap: spacing.xs
    },
    weekCalendarCard: {
      gap: spacing.sm,
      borderColor: "rgba(59,130,246,0.18)"
    },
    filterCard: {
      paddingVertical: spacing.sm
    },
    filterHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    filterTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    filterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    calendarCard: {
      gap: spacing.xs,
      padding: spacing.sm,
      borderColor: "rgba(108,92,231,0.18)"
    },
    weekdayRow: {
      flexDirection: "row",
      gap: 5
    },
    weekdayLabel: {
      flex: 1,
      color: colors.faint,
      textAlign: "center",
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900"
    },
    monthGrid: {
      gap: 5
    },
    weekRow: {
      minHeight: 58,
      flexDirection: "row",
      gap: 5
    },
    dayCell: {
      flex: 1,
      minWidth: 0,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.glass,
      paddingVertical: 6,
      alignItems: "center",
      justifyContent: "center",
      gap: 5
    },
    dayCellMuted: {
      opacity: 0.34
    },
    dayCellToday: {
      backgroundColor: colors.brandBlue,
      borderColor: colors.brandBlue
    },
    dayCellHeavy: {
      borderColor: `${colors.brandCoral}66`
    },
    dayCellSelected: {
      backgroundColor: colors.brandPurple,
      borderColor: colors.brandPurple,
      shadowColor: colors.brandPurple,
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 7 },
      elevation: 4
    },
    dayNumber: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    dayNumberMuted: {
      color: colors.faint
    },
    dayNumberActive: {
      color: colors.heroText
    },
    dayDots: {
      minHeight: 10,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 2
    },
    dayDot: {
      width: 5,
      height: 5,
      borderRadius: 3
    },
    agendaCard: {
      gap: spacing.sm
    },
    sectionTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "900"
    },
    sectionMeta: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "700"
    },
    agendaList: {
      gap: spacing.sm
    },
    weekTimeline: {
      gap: spacing.md
    },
    weekTimelineGroup: {
      gap: spacing.sm
    },
    weekTimelineHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    weekTimelineTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    emptyAgenda: {
      minHeight: 66,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    emptyAgendaCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    emptyTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    emptyCopy: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "700"
    }
  });
}
