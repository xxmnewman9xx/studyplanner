import {
  buildTodayPlan,
  daysUntil,
  formatDateOnly,
  formatShortDate,
  getCalendarEventsByDay,
  getClassAssignmentCounts,
  getDueSoon,
  getNeedsReview,
  getSchedulableAssignments,
  getWeekLoad,
  getWidgetData,
  isValidDateInput,
  isValidDeadline,
  isValidTimeInput,
  normalizeEstimatedMinutes,
  scoreWork
} from "../src/logic/planner";
import { Assignment, Course, Semester } from "../src/models";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const now = new Date("2026-05-15T12:00:00");
const semester: Semester = {
  id: "spring-2026",
  name: "Spring 2026",
  startDate: "2026-01-12",
  endDate: "2026-05-30"
};
const courses: Course[] = [
  {
    id: "bio-101",
    code: "BIO 101",
    name: "Biology",
    period: "Period 1",
    color: "#2F80ED",
    iconKey: "book",
    emojiKey: "study",
    semester: semester.name,
    meetings: [],
    gradeCategories: []
  }
];

const baseAssignment: Assignment = {
  id: "base",
  courseId: courses[0].id,
  title: "Base work",
  kind: "assignment",
  type: "assignment",
  dueAt: "2026-05-16T23:59:00",
  tags: ["homework"],
  priority: "medium",
  estimatedMinutes: 60,
  status: "not_started",
  source: "manual",
  progress: 0
};

const validTomorrow: Assignment = {
  ...baseAssignment,
  id: "valid-tomorrow",
  title: "Valid tomorrow"
};
const invalidDate: Assignment = {
  ...baseAssignment,
  id: "invalid-date",
  title: "Impossible date",
  dueAt: "2026-02-31T23:59:00"
};
const invalidTime: Assignment = {
  ...baseAssignment,
  id: "invalid-time",
  title: "Impossible time",
  dueAt: "2026-05-16T25:90:00"
};
const archived: Assignment = {
  ...baseAssignment,
  id: "archived",
  title: "Archived work",
  status: "archived",
  dueAt: "2026-05-15T10:00:00"
};
const done: Assignment = {
  ...baseAssignment,
  id: "done",
  title: "Finished work",
  status: "done",
  dueAt: "2026-05-15T09:00:00"
};

const assignments = [validTomorrow, invalidDate, invalidTime, archived, done];
const plan = buildTodayPlan(assignments, semester, now);

assert(isValidDateInput("2026-02-28"), "Expected real date to validate");
assert(!isValidDateInput("2026-02-31"), "Expected impossible date to fail");
assert(isValidTimeInput("23:59"), "Expected real time to validate");
assert(!isValidTimeInput("25:90"), "Expected impossible time to fail");
assert(isValidDeadline(validTomorrow.dueAt), "Expected valid deadline to validate");
assert(!isValidDeadline(invalidDate.dueAt), "Expected impossible date deadline to fail");
assert(!isValidDeadline(invalidTime.dueAt), "Expected impossible time deadline to fail");

assert(plan.openCount === 3, "Expected active open count to include review-needed invalid rows");
assert(plan.nextAction?.id === "valid-tomorrow", "Expected valid scheduled work to lead Today");
assert(getWidgetData({ id: "preset-next", name: "Upcoming", type: "due_next", size: "small", palette: "ocean", background: "solid", font: "SF Pro", layout: "compact", iconKey: "calendar", createdAt: "2026-05-15T00:00:00", updatedAt: "2026-05-15T00:00:00" }, [invalidDate, invalidTime], courses, now).value === "Clear", "Expected Upcoming widget to ignore invalid-only deadlines");
assert(!plan.upcoming.some((item) => item.id === invalidDate.id), "Expected invalid date out of upcoming");
assert(!plan.upcoming.some((item) => item.id === invalidTime.id), "Expected invalid time out of upcoming");
assert(plan.needsReview.some((item) => item.id === invalidDate.id), "Expected invalid date in Needs Review");
assert(plan.needsReview.some((item) => item.id === invalidTime.id), "Expected invalid time in Needs Review");

assert(getDueSoon(assignments, now).length === 1, "Expected only valid near-term work in due soon");
assert(getSchedulableAssignments(assignments).map((item) => item.id).join(",") === validTomorrow.id, "Expected central schedulable filter to keep only valid open work");
assert(getNeedsReview(assignments).length === 2, "Expected invalid deadlines to be review-visible");
assert(getClassAssignmentCounts(courses, assignments)[courses[0].id].needsReview === 2, "Expected class counts to include invalid deadlines as review work");
assert(!Number.isFinite(daysUntil(invalidDate.dueAt, now)), "Expected invalid deadline day math to fail safely");
assert(formatShortDate(invalidTime.dueAt) === "Check deadline", "Expected safe short-date fallback");
assert(formatDateOnly("2026-02-31") === "Check date", "Expected safe date-only fallback");
assert(Number.isFinite(scoreWork(invalidTime, now)), "Expected invalid deadline scoring to stay finite");

const calendarEvents = getCalendarEventsByDay(assignments, courses);
assert(Object.keys(calendarEvents).length === 1, "Expected calendar grouping to skip invalid/closed work");
assert(calendarEvents["2026-05-16"]?.[0]?.assignment.id === validTomorrow.id, "Expected valid work calendar event");

const weekLoad = getWeekLoad(assignments, now);
assert(weekLoad.flatMap((day) => day.items).length === 1, "Expected week load to skip invalid/closed work");

assert(normalizeEstimatedMinutes("0", 45) === 45, "Expected zero minutes to fall back");
assert(normalizeEstimatedMinutes("9999", 45) === 480, "Expected huge estimates to cap");
assert(normalizeEstimatedMinutes("90", 45) === 90, "Expected normal estimate to pass through");

console.log("planner trust fixtures passed");
