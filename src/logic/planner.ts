import { Assignment, Course, Semester } from "../models";

const dayMs = 24 * 60 * 60 * 1000;

export type TodayPlan = {
  nextAction?: Assignment;
  dueToday: Assignment[];
  upcoming: Assignment[];
  exams: Assignment[];
  doneCount: number;
  openCount: number;
  semesterProgress: number;
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
    doneCount: assignments.filter((item) => item.status === "done").length,
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
  }).format(new Date(iso));
}

export function getCourseForAssignment(courses: Course[], assignment: Assignment) {
  return courses.find((course) => course.id === assignment.courseId);
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
