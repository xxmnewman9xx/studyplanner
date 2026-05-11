import { Assignment, Course, Semester } from "../models";
import { isAssignmentCompleted, isAssignmentOpen } from "./assignmentModel";

const dayMs = 24 * 60 * 60 * 1000;

export type TodayPlan = {
  nextAction?: Assignment;
  dueToday: Assignment[];
  dueThisWeek: Assignment[];
  overdue: Assignment[];
  upcoming: Assignment[];
  exams: Assignment[];
  doneCount: number;
  openCount: number;
  semesterProgress: number;
};

export type WeekPlanDay = {
  date: string;
  label: string;
  items: Assignment[];
  exams: Assignment[];
};

export type WeekPlan = {
  startsAt: string;
  endsAt: string;
  days: WeekPlanDay[];
  exams: Assignment[];
  itemCount: number;
  examCount: number;
  heavyWorkloadWarning?: string;
};

export function buildTodayPlan(
  assignments: Assignment[],
  semester: Semester,
  now = new Date()
): TodayPlan {
  const open = assignments
    .filter((item) => isAssignmentOpen(item))
    .sort((a, b) => scoreWork(b, now) - scoreWork(a, now));
  const dueToday = open.filter((item) => isSameDay(new Date(item.dueAt), now));
  const overdue = open
    .filter((item) => isBeforeToday(new Date(item.dueAt), now))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const dueThisWeek = open
    .filter((item) => isInNextDays(new Date(item.dueAt), now, 7))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
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
    dueThisWeek,
    overdue,
    upcoming,
    exams,
    doneCount: assignments.filter((item) => isAssignmentCompleted(item)).length,
    openCount: open.length,
    semesterProgress: calculateSemesterProgress(semester, now)
  };
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

export function buildWeekPlan(assignments: Assignment[], now = new Date()): WeekPlan {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * dayMs);
    const dateKey = toDateKey(date);
    const items = assignments
      .filter((assignment) => isAssignmentOpen(assignment))
      .filter((assignment) => toDateKey(new Date(assignment.dueAt)) === dateKey)
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

    return {
      date: dateKey,
      label: weekDayLabel(date, now),
      items,
      exams: items.filter((assignment) => assignment.type === "exam" || assignment.kind === "exam")
    };
  });
  const exams = days.flatMap((day) => day.exams);
  const itemCount = days.reduce((sum, day) => sum + day.items.length, 0);
  const examCount = exams.length;

  return {
    startsAt: toDateKey(start),
    endsAt: toDateKey(new Date(start.getTime() + 6 * dayMs)),
    days,
    exams,
    itemCount,
    examCount,
    heavyWorkloadWarning:
      itemCount >= 5 || examCount >= 2
        ? `${itemCount} deadlines${examCount > 0 ? `, including ${examCount} exam${examCount === 1 ? "" : "s"}` : ""}`
        : undefined
  };
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

export function urgencyLabel(assignment: Assignment, now = new Date()) {
  const days = daysUntil(assignment.dueAt, now);
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 3) return "Soon";
  return assignment.type === "exam" || assignment.kind === "exam" ? "Exam" : "Upcoming";
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

function isBeforeToday(due: Date, now: Date) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return due.getTime() < today;
}

function isInNextDays(due: Date, now: Date, days: number) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = start + days * dayMs;
  const dueTime = due.getTime();
  return dueTime >= start && dueTime < end;
}

function parseDateOnlyAsLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function weekDayLabel(date: Date, now: Date) {
  if (isSameDay(date, now)) return "Today";
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (isSameDay(date, tomorrow)) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
}
