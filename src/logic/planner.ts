import {
  Assignment,
  Course,
  ParsedItem,
  Semester,
  WidgetPreset,
  WidgetType
} from "../models";

const dayMs = 24 * 60 * 60 * 1000;

export type TodayPlan = {
  nextAction?: Assignment;
  dueToday: Assignment[];
  upcoming: Assignment[];
  exams: Assignment[];
  dueSoon: Assignment[];
  needsReview: Assignment[];
  doneCount: number;
  openCount: number;
  semesterProgress: number;
};

export type CalendarEvent = {
  id: string;
  dateKey: string;
  assignment: Assignment;
  course?: Course;
};

export type DailyLoad = {
  dateKey: string;
  label: string;
  score: number;
  items: Assignment[];
  heavy: boolean;
};

export type BusyWeekInsight = {
  title: string;
  copy: string;
  heavyDays: DailyLoad[];
  suggestions: PlanSuggestion[];
};

export type PlanSuggestion = {
  id: string;
  title: string;
  copy: string;
  assignmentId?: string;
};

export type WidgetData = {
  headline: string;
  value: string;
  detail: string;
  items: Assignment[];
  course?: Course;
};

export function buildTodayPlan(
  assignments: Assignment[],
  semester: Semester,
  now = new Date()
): TodayPlan {
  const open = assignments
    .filter((item) => item.status !== "done" && item.status !== "archived")
    .sort((a, b) => scoreWork(b, now) - scoreWork(a, now));
  const dueToday = open.filter((item) => isSameDay(new Date(item.dueAt), now));
  const upcoming = open
    .filter((item) => !isPast(new Date(item.dueAt), now))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 6);
  const exams = open
    .filter((item) => item.kind === "exam")
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 3);

  return {
    nextAction: open[0],
    dueToday,
    upcoming,
    exams,
    dueSoon: getDueSoon(assignments, now),
    needsReview: getNeedsReview(assignments),
    doneCount: assignments.filter((item) => item.status === "done").length,
    openCount: open.length,
    semesterProgress: calculateSemesterProgress(semester, now)
  };
}

export function getDueToday(assignments: Assignment[], now = new Date()) {
  return assignments
    .filter((item) => item.status !== "done" && item.status !== "archived")
    .filter((item) => isSameDay(new Date(item.dueAt), now))
    .sort(sortByDueDate);
}

export function getDueSoon(assignments: Assignment[], now = new Date(), days = 5) {
  return assignments
    .filter((item) => item.status !== "done" && item.status !== "archived")
    .filter((item) => {
      const until = daysUntil(item.dueAt, now);
      return until > 0 && until <= days;
    })
    .sort(sortByDueDate);
}

export function getNeedsReview(assignments: Assignment[]) {
  return assignments
    .filter((item) => item.status !== "archived" && (item.needsReview || item.duplicateOf))
    .sort(sortByDueDate);
}

export function getNextUp(assignments: Assignment[], now = new Date()) {
  return assignments
    .filter((item) => item.status !== "done" && item.status !== "archived")
    .sort((a, b) => scoreWork(b, now) - scoreWork(a, now))[0];
}

export function scoreWork(assignment: Assignment, now = new Date()) {
  const dueInDays = Math.max(daysUntil(assignment.dueAt, now), -2);
  const urgency = dueInDays <= 0 ? 100 : 70 / (dueInDays + 1);
  const kindBoost = assignment.kind === "exam" ? 25 : 0;
  const priorityBoost = assignment.priority === "high" ? 22 : assignment.priority === "medium" ? 10 : 0;
  const timeBoost = Math.min(assignment.estimatedMinutes / 20, 12);
  const startedBoost = assignment.status === "in_progress" ? 7 : 0;
  return urgency + kindBoost + priorityBoost + timeBoost + startedBoost;
}

export function daysUntil(iso: string, now = new Date()) {
  const due = new Date(iso);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  return Math.ceil((dueDay - start) / dayMs);
}

export function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));
}

export function formatDateOnly(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(parseDateOnlyAsLocal(iso));
}

export function getCourseForAssignment(courses: Course[], assignment: Assignment) {
  return courses.find((course) => course.id === assignment.courseId);
}

export function getCalendarEventsByDay(assignments: Assignment[], courses: Course[]) {
  return assignments
    .filter((assignment) => assignment.status !== "archived")
    .reduce<Record<string, CalendarEvent[]>>((events, assignment) => {
      const dateKey = dateKeyFromIso(assignment.dueAt);
      const event: CalendarEvent = {
        id: assignment.id,
        dateKey,
        assignment,
        course: getCourseForAssignment(courses, assignment)
      };
      events[dateKey] = [...(events[dateKey] || []), event].sort((a, b) =>
        sortByDueDate(a.assignment, b.assignment)
      );
      return events;
    }, {});
}

export function getWeekLoad(assignments: Assignment[], now = new Date()) {
  const monday = startOfWeek(now);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dateKey = dateKeyFromDate(date);
    const items = assignments.filter(
      (assignment) =>
        assignment.status !== "archived" && dateKeyFromIso(assignment.dueAt) === dateKey
    );
    const score = items.reduce((sum, item) => {
      const priority = item.priority === "high" ? 2 : item.priority === "medium" ? 1.2 : 0.8;
      const kind = item.kind === "exam" || item.kind === "project" ? 1.5 : 1;
      return sum + Math.max(1, item.estimatedMinutes / 30) * priority * kind;
    }, 0);

    return {
      dateKey,
      label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
      score,
      items: items.sort(sortByDueDate),
      heavy: score >= 5
    };
  });
}

export function getBusyWeekInsight(assignments: Assignment[], now = new Date()): BusyWeekInsight {
  const week = getWeekLoad(assignments, now);
  const heavyDays = week.filter((day) => day.heavy);
  const heaviest = [...week].sort((a, b) => b.score - a.score)[0];
  const movable = assignments
    .filter((item) => item.status !== "done" && item.status !== "archived")
    .sort(sortByDueDate)
    .slice(0, 2);

  const suggestions: PlanSuggestion[] = movable.map((assignment, index) => ({
    id: `suggestion-${assignment.id}`,
    assignmentId: assignment.id,
    title: index === 0 ? "Start before tonight" : "Front-load one small task",
    copy: `${assignment.title} · ${assignment.estimatedMinutes}m suggested.`
  }));

  if (heaviest) {
    suggestions.push({
      id: "free-time-hint",
      title: "Protect a lighter day",
      copy: `${heaviest.label} carries the most load. Move review work earlier if you can.`
    });
  }

  return {
    title: heavyDays.length > 0 ? "Wed & Fri are heavy" : "This week is balanced",
    copy:
      heavyDays.length > 0
        ? `${heavyDays.length} dense day${heavyDays.length === 1 ? "" : "s"} ahead. Start one item early so the week stays calm.`
        : "No overloaded days detected. Keep the next small step moving.",
    heavyDays,
    suggestions
  };
}

export function getClassAssignmentCounts(courses: Course[], assignments: Assignment[]) {
  return courses.reduce<Record<string, { open: number; done: number; needsReview: number }>>(
    (counts, course) => {
      const courseAssignments = assignments.filter((assignment) => assignment.courseId === course.id);
      counts[course.id] = {
        open: courseAssignments.filter(
          (assignment) => assignment.status !== "done" && assignment.status !== "archived"
        ).length,
        done: courseAssignments.filter((assignment) => assignment.status === "done").length,
        needsReview: courseAssignments.filter((assignment) => assignment.needsReview).length
      };
      return counts;
    },
    {}
  );
}

export function getWidgetData(
  preset: WidgetPreset,
  assignments: Assignment[],
  courses: Course[],
  now = new Date()
): WidgetData {
  const next = getNextUp(assignments, now);
  const dueToday = getDueToday(assignments, now);
  const dueSoon = getDueSoon(assignments, now);
  const needsReview = getNeedsReview(assignments);
  const course = preset.classFocusCourseId
    ? courses.find((item) => item.id === preset.classFocusCourseId)
    : undefined;
  const classItems = course
    ? assignments.filter((assignment) => assignment.courseId === course.id && assignment.status !== "archived")
    : [];

  const byType: Record<WidgetType, WidgetData> = {
    due_next: {
      headline: "Due Next",
      value: next ? timeUntilLabel(next.dueAt, now) : "Clear",
      detail: next?.title || "All caught up",
      items: next ? [next] : []
    },
    today: {
      headline: "Today",
      value: String(dueToday.length),
      detail: `${dueSoon.length} due soon`,
      items: dueToday
    },
    needs_check: {
      headline: "Needs Check",
      value: String(needsReview.length),
      detail: needsReview[0]?.title || "No flagged work",
      items: needsReview
    },
    week: {
      headline: "Week",
      value: String(getWeekLoad(assignments, now).reduce((sum, day) => sum + day.items.length, 0)),
      detail: "items to do",
      items: dueSoon
    },
    class_focus: {
      headline: "Class Focus",
      value: course?.code || "Class",
      detail: `${classItems.filter((item) => item.status !== "done").length} open`,
      items: classItems,
      course
    },
    empty: {
      headline: "All Done",
      value: "✓",
      detail: "Enjoy your day",
      items: []
    },
    focus: {
      headline: "Focus",
      value: "25m",
      detail: next?.title || "Choose a task",
      items: next ? [next] : []
    },
    streak: {
      headline: "Streak",
      value: "7",
      detail: "days",
      items: []
    }
  };

  return byType[preset.type];
}

export function convertParsedItemsToAssignments(
  parsedItems: ParsedItem[],
  courses: Course[],
  now = new Date()
): Assignment[] {
  return parsedItems
    .filter((item) => !item.dismissedAt && item.reviewStatus !== "dismissed")
    .map((item) => {
      const course =
        courses.find((candidate) => candidate.name === item.courseName || candidate.code === item.courseName) ||
        courses[0];
      const dueAt = item.dueAt || `${dateKeyFromDate(now)}T23:59:00`;
      return {
        id: `parsed-${item.id}`,
        courseId: course?.id || "unassigned",
        title: item.title,
        kind: item.type,
        type: item.type,
        dueAt,
        tags: ["parsed"],
        priority: item.needsReview ? "high" : "medium",
        estimatedMinutes: item.type === "exam" ? 120 : 45,
        status: "not_started",
        source: "scan",
        sourceId: item.parsedImportId,
        needsReview: item.needsReview,
        duplicateOf: item.duplicateCandidateId,
        confidence: item.confidence,
        progress: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      } satisfies Assignment;
    });
}

export function calculateSemesterProgress(semester: Semester, now = new Date()) {
  const start = new Date(`${semester.startDate}T00:00:00`).getTime();
  const end = new Date(`${semester.endDate}T23:59:00`).getTime();
  const value = (now.getTime() - start) / Math.max(end - start, 1);
  return Math.max(0, Math.min(1, value));
}

export function groupMeetingsByDay(courses: Course[]) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
  return days.map((day) => ({
    day,
    meetings: courses
      .flatMap((course) =>
        course.meetings
          .filter((meeting) => meeting.day === day)
          .map((meeting) => ({ ...meeting, course }))
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }));
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isPast(due: Date, now: Date) {
  return due.getTime() < now.getTime();
}

function sortByDueDate(a: Assignment, b: Assignment) {
  return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
}

function dateKeyFromIso(iso: string) {
  return dateKeyFromDate(new Date(iso));
}

function dateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(now: Date) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

function timeUntilLabel(iso: string, now: Date) {
  const days = daysUntil(iso, now);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

function parseDateOnlyAsLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}
