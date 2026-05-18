import {
  Assignment,
  Course,
  FocusSession,
  ParsedItem,
  Semester,
  UserSettings,
  WidgetBackground,
  WidgetPalette,
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
  overdue: Assignment[];
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
  accent?: string;
  weekLoad?: DailyLoad[];
};

export function buildTodayPlan(
  assignments: Assignment[],
  semester: Semester,
  now = new Date()
): TodayPlan {
  const active = assignments.filter(isActiveAssignment);
  const open = getSchedulableAssignments(active)
    .sort((a, b) => scoreWork(b, now) - scoreWork(a, now));
  const dueToday = open.filter((item) => isSameDay(new Date(item.dueAt), now));
  const overdue = getOverdue(assignments, now);
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
    overdue,
    doneCount: assignments.filter((item) => item.status === "done").length,
    openCount: active.length,
    semesterProgress: calculateSemesterProgress(semester, now)
  };
}

export function getDueToday(assignments: Assignment[], now = new Date()) {
  return getSchedulableAssignments(assignments)
    .filter((item) => isSameDay(new Date(item.dueAt), now))
    .sort(sortByDueDate);
}

export function getDueSoon(assignments: Assignment[], now = new Date(), days = 5) {
  return assignments
    .filter(isActiveAssignment)
    .filter((item) => {
      const until = daysUntil(item.dueAt, now);
      return until > 0 && until <= days;
    })
    .sort(sortByDueDate);
}

export function getOverdue(assignments: Assignment[], now = new Date()) {
  return assignments
    .filter(isActiveAssignment)
    .filter((item) => daysUntil(item.dueAt, now) < 0)
    .sort(sortBySmallestCatchUp);
}

export function getNeedsReview(assignments: Assignment[]) {
  return assignments
    .filter(
      (item) =>
        item.status !== "archived" &&
        (item.needsReview || item.duplicateOf || !isValidDeadline(item.dueAt))
    )
    .sort(sortByDueDate);
}

export function getSchedulableAssignments(assignments: Assignment[]) {
  return assignments.filter((item) => isActiveAssignment(item) && isValidDeadline(item.dueAt));
}

export function getNextUp(assignments: Assignment[], now = new Date()) {
  return getSchedulableAssignments(assignments)
    .sort((a, b) => scoreWork(b, now) - scoreWork(a, now))[0];
}

export function scoreWork(assignment: Assignment, now = new Date()) {
  const validDeadline = isValidDeadline(assignment.dueAt);
  const dueInDays = validDeadline ? Math.max(daysUntil(assignment.dueAt, now), -2) : 14;
  const urgency = validDeadline ? (dueInDays <= 0 ? 100 : 70 / (dueInDays + 1)) : 0;
  const kindBoost = assignment.kind === "exam" ? 25 : 0;
  const priorityBoost = assignment.priority === "high" ? 22 : assignment.priority === "medium" ? 10 : 0;
  const timeBoost = Math.min(normalizeEstimatedMinutes(assignment.estimatedMinutes) / 20, 12);
  const startedBoost = assignment.status === "in_progress" ? 7 : 0;
  const reviewBoost = assignment.needsReview || !validDeadline ? 34 : 0;
  const duplicateBoost = assignment.duplicateOf ? 12 : 0;
  const confidenceBoost = typeof assignment.confidence === "number" && assignment.confidence < 0.65 ? 10 : 0;
  return urgency + kindBoost + priorityBoost + timeBoost + startedBoost + reviewBoost + duplicateBoost + confidenceBoost;
}

export function daysUntil(iso: string, now = new Date()) {
  if (!isValidDeadline(iso)) return Number.POSITIVE_INFINITY;

  const due = new Date(iso);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  return Math.ceil((dueDay - start) / dayMs);
}

export function formatShortDate(iso: string) {
  if (!isValidDeadline(iso)) return "Check deadline";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));
}

export function formatDateOnly(iso: string) {
  if (!isValidDateInput(iso.slice(0, 10))) return "Check date";

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
    .filter((assignment) => isActiveAssignment(assignment) && isValidDeadline(assignment.dueAt))
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
        isActiveAssignment(assignment) &&
        isValidDeadline(assignment.dueAt) &&
        dateKeyFromIso(assignment.dueAt) === dateKey
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
  const peakDay = [...week].sort((a, b) => b.score - a.score)[0];
  const movable = getSchedulableAssignments(assignments)
    .sort(sortByDueDate)
    .slice(0, 2);

  const suggestions: PlanSuggestion[] = movable.map((assignment, index) => ({
    id: `suggestion-${assignment.id}`,
    assignmentId: assignment.id,
    title: index === 0 ? "Start before tonight" : "Front-load one small task",
    copy: `${assignment.title} · ${assignment.estimatedMinutes}m suggested.`
  }));

  if (peakDay && peakDay.score > 0) {
    suggestions.push({
      id: "free-time-hint",
      title: "Create a power pocket",
      copy: `${peakDay.label} is your biggest focus opportunity. Move one review block earlier and keep energy high.`
    });
  }

  return {
    title: heavyDays.length > 0 ? `${formatDayList(heavyDays.map((day) => day.label))} ${heavyDays.length === 1 ? "is" : "are"} a focus lift` : "This week is balanced",
    copy:
      heavyDays.length > 0
        ? `${heavyDays.length} power day${heavyDays.length === 1 ? "" : "s"} ahead. Start one item early and keep the week feeling light.`
        : "Clean energy across the week. Keep the next small step moving.",
    heavyDays,
    suggestions
  };
}

function formatDayList(labels: string[]) {
  if (labels.length <= 1) return labels[0] || "This week";
  if (labels.length === 2) return `${labels[0]} & ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")} & ${labels[labels.length - 1]}`;
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
        needsReview: courseAssignments.filter(
          (assignment) => assignment.needsReview || !isValidDeadline(assignment.dueAt)
        ).length
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
  const completionStreak = calculateCompletionStreak(assignments, now);
  const course = preset.classFocusCourseId
    ? courses.find((item) => item.id === preset.classFocusCourseId)
    : undefined;
  const classItems = course
    ? assignments.filter((assignment) => assignment.courseId === course.id && assignment.status !== "archived")
    : [];

  const byType: Record<WidgetType, WidgetData> = {
    due_next: {
      headline: "Next Homework",
      value: next ? timeUntilLabel(next.dueAt, now) : "Clear",
      detail: next?.title || "All caught up",
      items: next ? [next] : []
    },
    today: {
      headline: "Today Plan",
      value: String(dueToday.length),
      detail: dueToday.length === 1 ? "task due today" : `${dueToday.length} tasks due today`,
      items: dueToday
    },
    needs_check: {
      headline: "Needs Check",
      value: String(needsReview.length),
      detail: needsReview[0]?.title || "No flagged work",
      items: needsReview
    },
    week: {
      headline: "Deadline Map",
      value: String(getWeekLoad(assignments, now).reduce((sum, day) => sum + day.items.length, 0)),
      detail: getBusyWeekInsight(assignments, now).heavyDays.length > 0 ? "busy week" : "balanced",
      items: dueSoon,
      weekLoad: getWeekLoad(assignments, now)
    },
    class_focus: {
      headline: "Class Risk",
      value: course?.code || "Class",
      detail: `${classItems.filter((item) => item.status !== "done").length} open`,
      items: classItems,
      course,
      accent: course?.color
    },
    empty: {
      headline: "All Done",
      value: "✓",
      detail: "Enjoy your day",
      items: []
    },
    focus: {
      headline: "Focus Block",
      value: "25m",
      detail: next?.title || "Choose a task",
      items: next ? [next] : []
    },
    streak: {
      headline: "Streak",
      value: String(completionStreak),
      detail: completionStreak === 1 ? "day" : "days",
      items: []
    }
  };

  return byType[preset.type];
}

export function calculateCompletionStreak(assignments: Assignment[], now = new Date()) {
  const completedDates = new Set(
    assignments
      .filter((assignment) => assignment.status === "done")
      .map((assignment) => dateKeyFromIso(assignment.updatedAt || assignment.dueAt))
  );

  let streak = 0;
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  while (completedDates.has(dateKeyFromDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
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
        checklist: buildParsedChecklist(item.type, item.needsReview),
        reminder: { enabled: Boolean(item.dueAt), leadTimeHours: item.type === "exam" ? 24 : 2 },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      } satisfies Assignment;
    });
}

export function saveWidgetPreset(
  presets: WidgetPreset[],
  preset: WidgetPreset,
  now = new Date()
) {
  const timestamp = now.toISOString();
  const nextPreset: WidgetPreset = {
    ...preset,
    createdAt: preset.createdAt || timestamp,
    updatedAt: timestamp
  };

  return [nextPreset, ...presets.filter((item) => item.id !== nextPreset.id)];
}

export function applyTheme(
  settings: UserSettings,
  selectedTheme: UserSettings["selectedTheme"],
  defaultWidgetStyle?: WidgetBackground
) {
  return {
    ...settings,
    selectedTheme,
    defaultWidgetStyle: defaultWidgetStyle || settings.defaultWidgetStyle
  };
}

export function startFocusSession(
  assignmentId: string,
  durationMinutes: number,
  sessions: FocusSession[],
  now = new Date()
): FocusSession {
  const previousForAssignment = sessions.filter((session) => session.assignmentId === assignmentId);

  return {
    id: `focus-${now.getTime()}`,
    assignmentId,
    durationMinutes,
    startedAt: now.toISOString(),
    status: "running",
    sessionNumber: previousForAssignment.length + 1,
    notes: "Focus session started."
  };
}

export function pauseFocusSession(session: FocusSession, now = new Date()): FocusSession {
  return {
    ...session,
    endedAt: now.toISOString(),
    status: "paused",
    notes: session.notes || "Focus session paused."
  };
}

export function completeFocusSession(
  session: FocusSession,
  status: Extract<FocusSession["status"], "completed" | "stopped"> = "completed",
  now = new Date()
): FocusSession {
  return {
    ...session,
    endedAt: now.toISOString(),
    status,
    notes: status === "completed" ? "Focus block completed." : "Focus block stopped."
  };
}

export function completeAssignment(
  assignments: Assignment[],
  assignmentId: string,
  now = new Date()
) {
  return assignments.map((assignment) =>
    assignment.id === assignmentId
      ? {
          ...assignment,
          status: "done" as const,
          progress: 1,
          checklist: assignment.checklist?.map((item) => ({ ...item, done: true })),
          updatedAt: now.toISOString()
        }
      : assignment
  );
}

export function calculateChecklistProgress(assignment: Assignment) {
  if (!assignment.checklist?.length) return assignment.progress || 0;
  const done = assignment.checklist.filter((item) => item.done).length;
  return done / assignment.checklist.length;
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

function isActiveAssignment(assignment: Assignment) {
  return assignment.status !== "done" && assignment.status !== "archived";
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
  const aTime = new Date(a.dueAt).getTime();
  const bTime = new Date(b.dueAt).getTime();
  const aValid = Number.isFinite(aTime);
  const bValid = Number.isFinite(bTime);

  if (!aValid && !bValid) return 0;
  if (!aValid) return -1;
  if (!bValid) return 1;
  return aTime - bTime;
}

function sortBySmallestCatchUp(a: Assignment, b: Assignment) {
  const timeDifference = a.estimatedMinutes - b.estimatedMinutes;
  if (timeDifference !== 0) return timeDifference;
  return sortByDueDate(a, b);
}

function dateKeyFromIso(iso: string) {
  if (!isValidDeadline(iso)) return "needs-review";
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
  if (!Number.isFinite(days)) return "Check deadline";
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

function buildParsedChecklist(kind: ParsedItem["type"], needsReview: boolean) {
  const reviewItem = needsReview ? [{ id: "review", title: "Confirm date and class", done: false }] : [];
  const byKind = {
    assignment: ["Read directions", "Finish work", "Turn in"],
    worksheet: ["Complete problems", "Check answers", "Submit"],
    reading: ["Read pages", "Take notes", "Flag questions"],
    project: ["Outline", "Build draft", "Final pass"],
    exam: ["Review guide", "Practice problems", "Pack materials"]
  } satisfies Record<ParsedItem["type"], string[]>;

  return [
    ...reviewItem,
    ...byKind[kind].map((title, index) => ({
      id: `${kind}-${index + 1}`,
      title,
      done: false
    }))
  ];
}

function parseDateOnlyAsLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year = 0, month = 0, day = 0] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isValidTimeInput(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;

  const [hour = -1, minute = -1] = value.split(":").map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function normalizeEstimatedMinutes(value: string | number, fallback = 60) {
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  const safeFallback = Number.isFinite(fallback) && fallback > 0 ? fallback : 60;

  if (!Number.isFinite(parsed) || parsed <= 0) return safeFallback;
  return Math.min(Math.round(parsed), 480);
}

export function isValidDeadline(value: string) {
  return isValidDateInput(value.slice(0, 10)) && isValidTimeInput(value.slice(11, 16));
}
