import {
  Assignment,
  Course,
  WidgetSnapshotInsight,
  WidgetSnapshotMonthly
} from "../models";
import {
  isAssignmentArchived,
  isAssignmentCompleted,
  isAssignmentConfirmed,
  isAssignmentOpen
} from "./assignmentModel";
import { buildWeekPlan, getCourseForAssignment } from "./planner";
import {
  addDaysLocal,
  dateKeyFromValue,
  getPreferredLocale,
  getWeekStartsOn,
  parseValidDate,
  startOfLocalDay,
  toDateKey,
  weekOffsetFromStart
} from "./dateUtils";

export type MonthCalendarDay = {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  items: Assignment[];
  openItems: Assignment[];
  completedItems: Assignment[];
  exams: Assignment[];
  courseColors: string[];
  isHeavy: boolean;
};

export type MonthCalendarPlan = {
  monthLabel: string;
  monthKey: string;
  previousMonthDate: Date;
  nextMonthDate: Date;
  weeks: MonthCalendarDay[][];
  days: MonthCalendarDay[];
  summary: {
    dueThisMonth: number;
    examCount: number;
    completedCount: number;
    heavyDayCount: number;
    overdueCount: number;
    currentWeekCount: number;
    heavyWeekLabel?: string;
  };
};

export type SemesterInsightPlan = WidgetSnapshotInsight & {
  weekItemCount: number;
  weekExamCount: number;
  heavyWeekLabel?: string;
  busiestDay?: WidgetSnapshotInsight["workloadByDay"][number];
};

export function buildMonthCalendarPlan({
  assignments,
  courses,
  now = new Date(),
  monthDate = now,
  courseFilterId,
  locale = getPreferredLocale(),
  weekStartsOn = getWeekStartsOn(locale)
}: {
  assignments: Assignment[];
  courses: Course[];
  now?: Date;
  monthDate?: Date;
  courseFilterId?: string;
  locale?: string;
  weekStartsOn?: number;
}): MonthCalendarPlan {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const gridStart = addDaysLocal(monthStart, -weekOffsetFromStart(monthStart, weekStartsOn));
  const allItems = filterAssignments(assignments, courseFilterId);
  const todayKey = toDateKey(now);
  const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = addDaysLocal(gridStart, index);
    const dateKey = toDateKey(date);
    const items = allItems
      .filter((assignment) => dateKeyFromValue(assignment.dueAt) === dateKey)
      .sort(sortAssignmentsByDue);
    const openItems = items.filter((assignment) => isAssignmentOpen(assignment));
    const completedItems = items.filter((assignment) => isAssignmentCompleted(assignment));
    const exams = items.filter(isExam);
    const courseColors = uniqueCourseColors(items, courses);

    return {
      date: dateKey,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isToday: dateKey === todayKey,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      items,
      openItems,
      completedItems,
      exams,
      courseColors,
      isHeavy: openItems.length >= 3 || (exams.length > 0 && openItems.length >= 2)
    };
  });

  const weeks = chunk(days, 7);
  const currentMonthDays = days.filter((day) => day.isCurrentMonth);
  const currentMonthItems = allItems.filter((assignment) => {
    const due = parseValidDate(assignment.dueAt);
    if (!due) return false;
    return due >= monthStart && due <= new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59);
  });
  const currentWeek = currentWeekDays(days, now);
  const weekLoads = weeks
    .map((week, index) => ({
      index,
      count: week.reduce((sum, day) => sum + day.openItems.length, 0),
      examCount: week.reduce((sum, day) => sum + day.exams.length, 0),
      start: week[0]?.date,
      end: week[6]?.date
    }))
    .sort((a, b) => b.count - a.count || b.examCount - a.examCount);
  const heaviestWeek = weekLoads[0];
  const heavyWeekLabel =
    heaviestWeek && (heaviestWeek.count >= 5 || heaviestWeek.examCount >= 2)
      ? `${heaviestWeek.count} due ${formatCompactRange(heaviestWeek.start, heaviestWeek.end)}`
      : undefined;

  return {
    monthLabel: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(monthStart),
    monthKey,
    previousMonthDate: new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1),
    nextMonthDate: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1),
    weeks,
    days,
    summary: {
      dueThisMonth: currentMonthItems.filter((assignment) => isAssignmentOpen(assignment)).length,
      examCount: currentMonthItems.filter(isExam).length,
      completedCount: currentMonthItems.filter((assignment) => isAssignmentCompleted(assignment)).length,
      heavyDayCount: currentMonthDays.filter((day) => day.isHeavy).length,
      overdueCount: currentMonthItems.filter(
        (assignment) => isAssignmentOpen(assignment) && Boolean(parseValidDate(assignment.dueAt)) && parseValidDate(assignment.dueAt)! < startOfLocalDay(now)
      ).length,
      currentWeekCount: currentWeek.reduce((sum, day) => sum + day.openItems.length, 0),
      heavyWeekLabel
    }
  };
}

export function buildSemesterInsights(
  assignments: Assignment[],
  courses: Course[],
  now = new Date()
): SemesterInsightPlan {
  const visibleAssignments = assignments.filter(
    (assignment) =>
      !isAssignmentArchived(assignment) &&
      isAssignmentConfirmed(assignment) &&
      Boolean(parseValidDate(assignment.dueAt))
  );
  const openAssignments = visibleAssignments.filter((assignment) => isAssignmentOpen(assignment));
  const completedAssignments = visibleAssignments.filter((assignment) => isAssignmentCompleted(assignment));
  const weekPlan = buildWeekPlan(visibleAssignments, now);
  const workloadByDay = weekPlan.days.map((day) => ({
    date: day.date,
    label: day.label,
    count: day.items.length,
    examCount: day.exams.length
  }));
  const courseBalance = courses
    .map((course) => ({
      courseId: course.id,
      courseName: course.code,
      color: course.color,
      openCount: openAssignments.filter((assignment) => assignment.courseId === course.id).length
    }))
    .sort((a, b) => b.openCount - a.openCount);
  const busiestDay = workloadByDay.reduce<SemesterInsightPlan["busiestDay"]>(
    (current, day) => (!current || day.count > current.count ? day : current),
    undefined
  );
  const totalCount = visibleAssignments.length;

  return {
    completionPercent: totalCount > 0 ? Math.round((completedAssignments.length / totalCount) * 100) : 0,
    openCount: openAssignments.length,
    completedCount: completedAssignments.length,
    workloadByDay,
    courseBalance,
    weekItemCount: weekPlan.itemCount,
    weekExamCount: weekPlan.examCount,
    heavyWeekLabel: weekPlan.heavyWorkloadWarning,
    busiestDay
  };
}

export function buildWidgetMonthlySnapshot(
  assignments: Assignment[],
  courses: Course[],
  now = new Date()
): WidgetSnapshotMonthly {
  const plan = buildMonthCalendarPlan({ assignments, courses, now });

  return {
    monthLabel: plan.monthLabel,
    dueThisMonth: plan.summary.dueThisMonth,
    examCount: plan.summary.examCount,
    heavyDayCount: plan.summary.heavyDayCount,
    completedCount: plan.summary.completedCount,
    days: plan.days
      .filter((day) => day.isCurrentMonth)
      .map((day) => ({
        date: day.date,
        dayNumber: day.dayNumber,
        itemCount: day.openItems.length,
        examCount: day.exams.length,
        completedCount: day.completedItems.length,
        isToday: day.isToday,
        isHeavy: day.isHeavy,
        courseColors: day.courseColors
      }))
  };
}

function filterAssignments(assignments: Assignment[], courseFilterId?: string) {
  return assignments.filter((assignment) => {
    if (isAssignmentArchived(assignment)) return false;
    if (!isAssignmentConfirmed(assignment)) return false;
    if (!courseFilterId || courseFilterId === "all") return true;
    return assignment.courseId === courseFilterId;
  });
}

function currentWeekDays(days: MonthCalendarDay[], now: Date) {
  const todayKey = toDateKey(now);
  const currentWeek = days.findIndex((day) => day.date === todayKey);
  const weekStart = currentWeek < 0 ? 0 : Math.floor(currentWeek / 7) * 7;
  return days.slice(weekStart, weekStart + 7);
}

function uniqueCourseColors(assignments: Assignment[], courses: Course[]) {
  const colors = assignments.map((assignment) => {
    const course = getCourseForAssignment(courses, assignment);
    return course?.color || "#6C5CE7";
  });

  return Array.from(new Set(colors)).slice(0, 4);
}

function isExam(assignment: Assignment) {
  return assignment.type === "exam" || assignment.kind === "exam";
}

function sortAssignmentsByDue(a: Assignment, b: Assignment) {
  const doneDelta = Number(isAssignmentCompleted(a)) - Number(isAssignmentCompleted(b));
  if (doneDelta !== 0) return doneDelta;
  return (parseValidDate(a.dueAt)?.getTime() || 0) - (parseValidDate(b.dueAt)?.getTime() || 0);
}

function formatCompactRange(start?: string, end?: string) {
  if (!start || !end) return "this month";
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const startLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(startDate);
  const endLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(endDate);
  return `${startLabel}-${endLabel}`;
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
