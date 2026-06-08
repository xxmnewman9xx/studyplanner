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
import { StudyPlannerBrain } from "../src/logic/studyPlannerBrain";
import type {
  Assignment,
  Course,
  FocusSession,
  ParsedItem,
  Semester,
  StudyNote,
  UserSettings,
  WidgetPreset
} from "../src/models";

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

const brainSettings: UserSettings = {
  studentName: "Taylor",
  profile: {
    name: "Taylor",
    persona: "overwhelmed",
    stressLevel: "high",
    preferredLocale: "en-US"
  },
  persona: "overwhelmed",
  stressLevel: "high",
  locale: "en-US",
  selectedTheme: "custom",
  customPalette: ["#ffffff", "#f7f4ff"],
  appTheme: "campus",
  defaultWidgetStyle: "glass",
  onboardingComplete: true,
  notificationDefault: "2 hours before due",
  focusDefaultMinutes: 25,
  syncEnabled: true,
  privacyMode: false,
  emojiAccentEnabled: true
};

const parsedItems: ParsedItem[] = [
  {
    id: "lab-report",
    parsedImportId: "import-bio-midterm",
    title: "Cell respiration lab report",
    courseName: "BIO 101",
    type: "assignment",
    dueAt: "2026-05-16T15:00:00",
    confidence: 0.93,
    needsReview: false,
    rawText: "BIO 101 lab report due May 16",
    reviewStatus: "accepted"
  },
  {
    id: "date-check",
    parsedImportId: "import-bio-midterm",
    title: "Photosynthesis worksheet",
    courseName: "BIO 101",
    type: "worksheet",
    confidence: 0.41,
    needsReview: true,
    duplicateCandidateId: "parsed-lab-report",
    rawText: "Photosynthesis worksheet due maybe this week",
    reviewStatus: "accepted"
  },
  {
    id: "dismissed",
    parsedImportId: "import-bio-midterm",
    title: "Dismissed duplicate",
    courseName: "BIO 101",
    type: "reading",
    confidence: 0.2,
    needsReview: true,
    rawText: "duplicate",
    reviewStatus: "dismissed"
  }
];

const convertedAssignments = StudyPlannerBrain.convertParsedItemsToAssignments(parsedItems, courses, now);
const parsedLab = convertedAssignments.find((item) => item.id === "parsed-lab-report");
const parsedReview = convertedAssignments.find((item) => item.id === "parsed-date-check");
assert(convertedAssignments.length === 2, "Expected dismissed parsed items to stay out of assignments");
assert(parsedLab?.sourceId === "import-bio-midterm", "Expected parsed assignment to keep source import linkage");
assert(parsedLab?.checklist?.length === 3, "Expected parsed assignments to get actionable checklist steps");
assert(parsedReview?.needsReview && parsedReview.duplicateOf === "parsed-lab-report", "Expected review/duplicate flags to survive conversion");
assert(parsedReview?.reminder?.enabled === false, "Expected missing-date parsed items to keep reminders disabled");

const brainNotes: StudyNote[] = [
  {
    id: "pinned-plan",
    courseId: courses[0].id,
    kind: "class",
    title: "Lab rubric",
    body: "Pin this before submitting the lab.",
    tags: ["rubric"],
    pinned: true,
    createdAt: "2026-05-14T09:00:00",
    updatedAt: "2026-05-14T09:00:00"
  },
  {
    id: "assignment-source-note",
    courseId: courses[0].id,
    assignmentId: parsedLab?.id,
    sourceId: "import-bio-midterm",
    kind: "assignment",
    title: "Source note",
    body: "Use the scanned syllabus source for page numbers.",
    tags: ["source"],
    createdAt: "2026-05-15T08:00:00",
    updatedAt: "2026-05-15T08:00:00"
  },
  {
    id: "today-note",
    kind: "today",
    title: "Today",
    body: "Task: summarize lab conclusion tomorrow",
    tags: ["today"],
    createdAt: "2026-05-15T10:00:00",
    updatedAt: "2026-05-15T10:00:00"
  }
];

const firstBrain = StudyPlannerBrain.buildTodayBrain({
  assignments: convertedAssignments,
  courses,
  semester,
  notes: brainNotes,
  focusSessions: [],
  widgetPresets: [],
  settings: brainSettings,
  now
});
assert(firstBrain.needsReview.some((item) => item.id === parsedReview?.id), "Expected Brain to surface parsed review work");
assert(firstBrain.relevantNotes.some((note) => note.id === "pinned-plan"), "Expected Brain to surface pinned notes on Today");
assert(firstBrain.relevantNotes.some((note) => note.id === "assignment-source-note"), "Expected Brain to surface assignment/source notes");
assert(firstBrain.recommendedFocusDuration === 20, "Expected high-stress settings to shorten focus recommendations");
assert(firstBrain.recommendedTheme === "minimal", "Expected high-stress settings to recommend minimal theme");
assert(firstBrain.recommendedWidgetPreset.name === "Needs Check" && firstBrain.recommendedWidgetPreset.iconKey === "warning", "Expected review-heavy state to recommend a Needs Check widget prompt");

const assignmentNotes = StudyPlannerBrain.getAssignmentNotes(brainNotes, parsedLab?.id);
const courseNotes = StudyPlannerBrain.getCourseNotes(brainNotes, courses[0].id);
assert(assignmentNotes[0]?.id === "assignment-source-note", "Expected assignment notes to be directly retrievable");
assert(courseNotes[0]?.id === "pinned-plan", "Expected class notes to exclude assignment-attached notes");
assert(StudyPlannerBrain.getPinnedNotes(brainNotes)[0]?.id === "pinned-plan", "Expected pinned note ordering to be stable");

const noteTask = StudyPlannerBrain.convertNoteToTask(brainNotes[2], courses, undefined, now);
assert(noteTask?.title === "summarize lab conclusion tomorrow", "Expected note-to-task to infer explicit task line");
assert(noteTask?.dueAt.startsWith("2026-05-16"), "Expected note-to-task to honor tomorrow copy");

const focusStart = new Date("2026-05-15T12:30:00");
const focusPausedAt = new Date("2026-05-15T12:45:00");
const focusEndedAt = new Date("2026-05-15T13:00:00");
const runningSession: FocusSession = StudyPlannerBrain.startFocusSession(parsedLab!.id, firstBrain.recommendedFocusDuration, [], focusStart);
const pausedSession = StudyPlannerBrain.pauseFocusSession(runningSession, focusPausedAt);
const completedSession = StudyPlannerBrain.endFocusSession(pausedSession, "completed", focusEndedAt);
assert(runningSession.status === "running" && runningSession.sessionNumber === 1, "Expected focus start to create first running session");
assert(pausedSession.status === "paused" && pausedSession.endedAt === focusPausedAt.toISOString(), "Expected pause to retain pause timestamp");
assert(completedSession.status === "completed" && completedSession.endedAt === focusEndedAt.toISOString(), "Expected focus end to complete the session");

const completedAssignments = StudyPlannerBrain.completeAssignment(convertedAssignments, parsedLab!.id, focusEndedAt);
const completedLab = completedAssignments.find((item) => item.id === parsedLab!.id);
assert(completedLab?.status === "done" && completedLab.progress === 1, "Expected completion to update status and progress");
assert(completedLab?.checklist?.every((item) => item.done), "Expected completion to finish checklist items");

const widgetPreset: WidgetPreset = firstBrain.recommendedWidgetPreset;
const needsCheckPreset: WidgetPreset = { ...widgetPreset, id: "preview-needs-check", type: "needs_check" };
const widgetData = StudyPlannerBrain.getWidgetData(needsCheckPreset, completedAssignments, courses, now, [completedSession], brainNotes);
assert(widgetData.headline === "Needs Check" && widgetData.items?.length === 1, "Expected widget data to read shared review state");
const savedPresets = StudyPlannerBrain.saveWidgetPreset([], widgetPreset, focusEndedAt);
const loadedPreset = StudyPlannerBrain.loadWidgetPreset(savedPresets, widgetPreset.id);
assert(loadedPreset?.id === widgetPreset.id && loadedPreset.lastSyncedAt === focusEndedAt.toISOString(), "Expected widget preset save/load to preserve sync metadata");
assert(StudyPlannerBrain.resetWidgetPreset([], now).length >= 4, "Expected widget reset to restore canonical presets");

const rethemed = StudyPlannerBrain.applyTheme(brainSettings, "ocean", "gradient");
const localized = StudyPlannerBrain.applyLocale(brainSettings, "ar-SA");
assert(rethemed.selectedTheme === "ocean" && rethemed.defaultWidgetStyle === "gradient", "Expected theme application to update app/widget defaults");
assert(localized.locale === "ar-SA" && localized.profile?.preferredLocale === "ar-SA", "Expected locale application to update profile preference");

console.log("planner trust fixtures passed");
