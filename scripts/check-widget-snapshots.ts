import { buildStudyPlannerWidgetSnapshots } from "../src/services/widgetSnapshot";
import {
  Assignment,
  Course,
  ParsedImport,
  Semester,
  UserSettings,
  WidgetPreset
} from "../src/models";

declare const require: (name: string) => {
  readFileSync(path: string, encoding: string): string;
};

const fs = require("node:fs");
const now = new Date("2026-05-22T09:00:00");

const semester: Semester = {
  id: "spring-2026",
  name: "Spring 2026",
  startDate: "2026-01-12",
  endDate: "2026-05-30"
};

const courses: Course[] = [
  {
    id: "chemistry",
    code: "CHEM",
    name: "Chemistry",
    teacher: "Private Teacher",
    room: "Secret Room",
    color: "#10B981",
    meetings: [],
    gradeCategories: []
  },
  {
    id: "history",
    code: "HIST",
    name: "World History",
    color: "#F59E0B",
    meetings: [],
    gradeCategories: []
  }
];

const settings: UserSettings = {
  studentName: "",
  selectedTheme: "ocean",
  customPalette: [],
  appTheme: "campus",
  defaultWidgetStyle: "glass",
  onboardingComplete: true,
  notificationDefault: "2 hours before due",
  focusDefaultMinutes: 25,
  syncEnabled: true,
  privacyMode: false,
  emojiAccentEnabled: true
};

const parsedImports: ParsedImport[] = [
  {
    id: "scan-1",
    title: "Chemistry syllabus",
    sourceType: "typed",
    status: "applied",
    itemCount: 2,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }
];

const baseAssignment = {
  kind: "assignment",
  tags: [],
  source: "syllabus",
  estimatedMinutes: 30,
  status: "not_started",
  priority: "medium",
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
} satisfies Partial<Assignment>;

const assignments: Assignment[] = [
  {
    ...baseAssignment,
    id: "future-earliest-low",
    courseId: "history",
    title: "Low-stakes map worksheet",
    dueAt: "2026-05-23T09:00:00",
    priority: "low",
    estimatedMinutes: 15
  } as Assignment,
  {
    ...baseAssignment,
    id: "overdue-high-started",
    courseId: "chemistry",
    title: "Lab Report: Enzyme",
    dueAt: "2026-05-20T17:00:00",
    priority: "high",
    estimatedMinutes: 90,
    status: "in_progress",
    checklist: [{ id: "secret-step", title: "Private checklist detail", done: false }],
    reminderIds: ["private-reminder-id"],
    externalCalendarEventId: "private-calendar-id"
  } as Assignment,
  {
    ...baseAssignment,
    id: "today-medium",
    courseId: "history",
    title: "Discussion prep",
    dueAt: "2026-05-22T14:00:00"
  } as Assignment,
  {
    ...baseAssignment,
    id: "unreviewed",
    courseId: "chemistry",
    title: "Unreviewed scan item",
    dueAt: "2026-05-22T11:00:00",
    needsReview: true
  } as Assignment,
  {
    ...baseAssignment,
    id: "duplicate",
    courseId: "chemistry",
    title: "Duplicate scan item",
    dueAt: "2026-05-22T11:00:00",
    duplicateOf: "today-medium"
  } as Assignment,
  {
    ...baseAssignment,
    id: "done",
    courseId: "chemistry",
    title: "Finished quiz",
    dueAt: "2026-05-21T11:00:00",
    status: "done"
  } as Assignment,
  {
    ...baseAssignment,
    id: "invalid",
    courseId: "chemistry",
    title: "Invalid date",
    dueAt: "not-a-date"
  } as Assignment
];

const stalePreset: WidgetPreset = {
  id: "stale-class",
  name: "Stale class",
  type: "due_next",
  size: "medium",
  background: "glass",
  palette: "ocean",
  font: "SF Pro",
  classFocusCourseId: "deleted-course",
  layout: "list",
  iconKey: "calendar",
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
};

const failures: string[] = [];
const assert = (condition: boolean, message: string) => {
  if (!condition) failures.push(message);
};

const nativeWidgetLayoutSource = fs.readFileSync("src/widgets/StudyPlannerWidgets.tsx", "utf8");
const widgetPreviewSource = fs.readFileSync("src/components/AppleComponents.tsx", "utf8");
const widgetStudioSource = fs.readFileSync("src/screens/MoreScreen.tsx", "utf8");

const snapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments,
  parsedImports,
  settings,
  widgetPresets: [stalePreset],
  demoMode: false,
  now
});

assert(snapshots.today.items[0]?.id === "overdue-high-started", "Overdue high-priority started work should lead Today.");
assert(snapshots.upcoming.items[0]?.id === "overdue-high-started", "Overdue high-priority started work should lead Upcoming.");
assert(snapshots.today.signalLabel === "Catch up", "Overdue Today snapshot should use a catch-up signal.");
assert(snapshots.upcoming.metricLabel.includes("90m"), "Upcoming metric should surface effort for the top action.");

const itemIds = [...snapshots.today.items, ...snapshots.upcoming.items].map((item) => item.id);
for (const blockedId of ["unreviewed", "duplicate", "done", "invalid"]) {
  assert(!itemIds.includes(blockedId), `${blockedId} should stay out of widget rows.`);
}

assert(snapshots.upcoming.items.length > 0, "Stale class-focus preset must not blank native widget rows.");

const serialized = JSON.stringify(snapshots);
for (const privateFragment of [
  "Private Teacher",
  "Secret Room",
  "Private checklist detail",
  "private-reminder-id",
  "private-calendar-id"
]) {
  assert(!serialized.includes(privateFragment), `Snapshot leaked private fragment: ${privateFragment}`);
}

const demoSnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments,
  parsedImports,
  settings,
  widgetPresets: [],
  demoMode: true,
  now
});

assert(demoSnapshots.today.state === "demo", "Demo mode should produce a demo Today state.");
assert(demoSnapshots.today.items.length === 0 && demoSnapshots.upcoming.items.length === 0, "Demo mode must not include coursework rows.");

const needsReviewSnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments: assignments.filter((assignment) => assignment.id === "unreviewed"),
  parsedImports,
  settings,
  widgetPresets: [],
  demoMode: false,
  now
});

assert(needsReviewSnapshots.today.state === "needs_review", "Only unreviewed work should produce needs-review state.");
assert(needsReviewSnapshots.today.value === "1", "Needs-review count should remain stable.");

const privacySnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments,
  parsedImports,
  settings: { ...settings, privacyMode: true },
  widgetPresets: [],
  demoMode: false,
  now
});

assert(privacySnapshots.today.items[0]?.title === "Hidden assignment", "Privacy mode should redact Today row titles.");
assert(privacySnapshots.today.items[0]?.courseCode === "Class", "Privacy mode should redact Today course codes.");
assert(privacySnapshots.upcoming.detail === "Hidden assignment", "Privacy mode should redact Upcoming headline detail.");

const privacySerialized = JSON.stringify(privacySnapshots);
for (const privateFragment of [
  "Lab Report",
  "Discussion prep",
  "Low-stakes map",
  "CHEM",
  "HIST"
]) {
  assert(!privacySerialized.includes(privateFragment), `Privacy-mode snapshot leaked planner detail: ${privateFragment}`);
}

assert(
  nativeWidgetLayoutSource.includes("slice(0, isMedium ? 3 : 1)"),
  "Native Home Screen widgets should keep systemSmall to one planner item and systemMedium to three rows."
);
assert(
  nativeWidgetLayoutSource.includes("if (!isMedium)") && nativeWidgetLayoutSource.includes("frame({ maxWidth: 220, maxHeight: 220"),
  "Native systemSmall layout should use a dedicated compact branch instead of the medium agenda stack."
);
for (const family of ["accessoryCircular", "accessoryRectangular", "accessoryInline"]) {
  assert(nativeWidgetLayoutSource.includes(`environment.widgetFamily === "${family}"`), `Native widget layout should keep ${family} coverage.`);
}
assert(
  widgetPreviewSource.includes("nativeProgress") &&
    widgetPreviewSource.includes("nativeWidgetProgressDots") &&
    widgetPreviewSource.includes("[0, 1, 2, 3, 4]"),
  "Widget Studio native preview should render the same five-dot progress signal used by the native layout."
);
assert(
  widgetStudioSource.includes("Widget setup") &&
    widgetStudioSource.includes("Install native app") &&
    widgetStudioSource.includes("nativeProgress={nativePreview?.progress}"),
  "Widget Studio should show a truthful proof score and pass native progress into preview cards."
);

if (failures.length) {
  console.error("Widget snapshot gate failures:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("StudyPlanner widget snapshot gates passed");
