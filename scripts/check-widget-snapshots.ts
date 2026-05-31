import { buildStudyPlannerWidgetSnapshots } from "../src/services/widgetSnapshot";
import {
  Assignment,
  Course,
  ParsedImport,
  Semester,
  UserSettings,
  WidgetPreset
} from "../src/models";
import { resolveWidgetTheme, widgetStyleColors, widgetThemeOrder } from "../src/widgets/widgetThemes";

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

const styledTodayPreset: WidgetPreset = {
  id: "styled-today",
  name: "Today Forest",
  widgetKind: "today",
  type: "today",
  size: "medium",
  theme: "forest",
  background: "dark",
  palette: "forest",
  dataMode: "single_class",
  font: "Rounded",
  classFocusCourseId: "history",
  layout: "list",
  iconKey: "check",
  createdAt: now.toISOString(),
  updatedAt: "2026-05-22T10:00:00",
  lastSyncedAt: "2026-05-22T10:00:00"
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
assert(snapshots.today.metricLabel === "0 of 1 complete", "Today metric should surface real due-today completion only.");
assert(snapshots.upcoming.metricLabel === "1 of 4 complete", "Upcoming metric should surface real week completion.");
assert(snapshots.today.progress === 0, "Today progress should be completed due-today work divided by total due-today work.");
assert(snapshots.upcoming.progress === 0.25, "Upcoming progress should be completed work divided by total work in the visible week range.");

const localizedSnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments,
  parsedImports,
  settings,
  widgetPresets: [stalePreset],
  demoMode: false,
  now,
  locale: "es",
  translate: (key, fallback) =>
    ({
      "widget_snapshot.today": "Hoy",
      "widget_snapshot.catch_up": "Ponerse al día",
      "widget_snapshot.overdue_count": "{count} vencidas",
      "widget_snapshot.next_assignment": "Siguiente: {title}",
      "widget_snapshot.overdue": "Vencido",
      "widget_snapshot.high_priority": "Alta prioridad",
      "widget_snapshot.minutes_open": "{minutes} min abiertas",
      "widget_snapshot.high": "Alta",
      "widget_snapshot.class": "Clase"
    })[key] || fallback || key
});
assert(localizedSnapshots.today.headline === "Hoy", "Native Today snapshot should accept runtime translations.");
assert(localizedSnapshots.today.detail.includes("vencidas"), "Native Today detail should use translated count templates.");
assert(localizedSnapshots.today.items[0]?.dueLabel === "Vencido", "Native widget rows should localize due labels.");

const itemIds = [...snapshots.today.items, ...snapshots.upcoming.items].map((item) => item.id);
for (const blockedId of ["unreviewed", "duplicate", "done", "invalid"]) {
  assert(!itemIds.includes(blockedId), `${blockedId} should stay out of widget rows.`);
}

assert(snapshots.upcoming.items.length > 0, "Stale class-focus preset must not blank native widget rows.");

const styledSnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments,
  parsedImports,
  settings,
  widgetPresets: [styledTodayPreset],
  demoMode: false,
  now
});

assert(styledSnapshots.today.accentColor === "#35F2D0", "Saved native Today preset palette should affect native accent color.");
assert(styledSnapshots.today.backgroundColor === "#05070B", "Saved native Today preset background should affect native background color.");
assert(styledSnapshots.today.layoutLabel === "List", "Saved native Today layout should persist as native layout metadata.");
assert(styledSnapshots.today.nativeName === "StudyPlanner Today", "Native Today snapshot should carry the exact iOS gallery name.");
assert(styledSnapshots.today.presetKind === "today", "Native Today snapshot should carry canonical preset kind.");
assert(styledSnapshots.today.presetTheme === "forest", "Native Today snapshot should carry canonical preset theme.");
assert(styledSnapshots.today.presetLayout === "list", "Native Today snapshot should carry canonical preset layout.");
assert(styledSnapshots.today.presetDataMode === "single_class", "Native Today snapshot should carry canonical preset data mode.");
assert(styledSnapshots.today.presetClassId === "history", "Native Today snapshot should carry native-readable class id.");
assert(styledSnapshots.today.lastSyncedAt === "2026-05-22T10:00:00", "Native Today snapshot should carry last synced timestamp.");
assert(
  styledSnapshots.today.items.every((item) => item.courseCode === "HIST"),
  "Saved native Today class filter should restrict native rows to the selected class."
);

for (const themeChoice of widgetThemeOrder) {
  const themePreset = resolveWidgetTheme(themeChoice);
  const expectedStyle = widgetStyleColors(themePreset);
  const themedSnapshots = buildStudyPlannerWidgetSnapshots({
    semester,
    courses,
    assignments,
    parsedImports,
    settings,
    widgetPresets: [
      {
        id: `theme-${themeChoice}`,
        name: `Theme ${themeChoice}`,
        type: "due_next",
        size: "small",
        ...themePreset,
        dataMode: "all_classes",
        font: "SF Pro",
        layout: "compact",
        iconKey: "calendar",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ],
    demoMode: false,
    now
  });

  assert(
    themedSnapshots.upcoming.backgroundColor === expectedStyle.backgroundColor,
    `${themeChoice} theme should drive native widget background color.`
  );
  assert(
    themedSnapshots.upcoming.accentColor === expectedStyle.accentColor,
    `${themeChoice} theme should drive native widget accent color.`
  );
}

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

const mixedRealAndDemoSnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments: [
    {
      ...baseAssignment,
      id: "demo-leftover",
      courseId: "chemistry",
      title: "Demo essay that should not leak",
      dueAt: "2026-05-22T10:00:00",
      priority: "high",
      estimatedMinutes: 120
    } as Assignment,
    {
      ...baseAssignment,
      id: "real-homework",
      courseId: "history",
      title: "Real homework",
      dueAt: "2026-05-22T12:00:00",
      priority: "medium",
      estimatedMinutes: 45
    } as Assignment
  ],
  parsedImports,
  settings,
  widgetPresets: [],
  demoMode: false,
  now
});

assert(
  !JSON.stringify(mixedRealAndDemoSnapshots).includes("demo-leftover"),
  "Non-demo native snapshots must filter leftover demo assignments after real setup."
);
assert(
  mixedRealAndDemoSnapshots.today.items[0]?.id === "real-homework",
  "Real work should remain after stale demo rows are filtered."
);

const noClassesSnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses: [],
  assignments: [],
  parsedImports: [],
  settings,
  widgetPresets: [],
  demoMode: false,
  now
});
assert(noClassesSnapshots.today.state === "no_classes", "Empty setup should ask for a class first.");

const classOnlySnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments: [],
  parsedImports: [],
  settings,
  widgetPresets: [],
  demoMode: false,
  now
});
assert(classOnlySnapshots.today.state === "no_reviewed_syllabus", "Class-only setup should wait for reviewed planner data.");
assert(classOnlySnapshots.today.items.length === 0, "Class-only setup should not emit stale rows.");

const appliedNoHomeworkSnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments: [],
  parsedImports,
  settings,
  widgetPresets: [],
  demoMode: false,
  now
});
assert(appliedNoHomeworkSnapshots.today.state === "no_assignments", "Applied import with no homework should show no-assignments state.");

const cleanSnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments: [
    {
      ...baseAssignment,
      id: "future-only",
      courseId: "history",
      title: "Future-only homework",
      dueAt: "2026-05-28T12:00:00"
    } as Assignment
  ],
  parsedImports,
  settings,
  widgetPresets: [],
  demoMode: false,
  now
});
assert(cleanSnapshots.today.state === "no_due_today", "Clean day should show no-due-today state.");
assert(cleanSnapshots.upcoming.state === "ready", "Clean day with future work should still keep Upcoming ready.");

const classProgressRequiredSnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments,
  parsedImports,
  settings,
  widgetPresets: [
    {
      id: "class-progress-no-class",
      name: "Class Progress",
      widgetKind: "classProgress",
      type: "class_focus",
      size: "small",
      theme: "forest",
      background: "glass",
      palette: "forest",
      dataMode: "single_class",
      font: "SF Pro",
      layout: "progress",
      iconKey: "book",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
  ],
  demoMode: false,
  now
});
assert(
  classProgressRequiredSnapshots.classProgress.state === "ready" &&
    classProgressRequiredSnapshots.classProgress.timelineLabel === "All classes" &&
    classProgressRequiredSnapshots.classProgress.items.length > 0,
  "Class Progress without a selected class should fall back to useful All Classes data."
);

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
  nativeWidgetLayoutSource.includes("var rowLimit") && nativeWidgetLayoutSource.includes("isNextTaskLayout"),
  "Native Home Screen widgets should keep systemSmall to one planner item and systemMedium to two verified rows."
);
assert(
  nativeWidgetLayoutSource.includes("circularValue") && nativeWidgetLayoutSource.includes("circularLabel = firstItem ? signalLabel : timelineLabel"),
  "Native circular widgets should avoid decorative count-only 'Today' output and point to the next action."
);
assert(
  !nativeWidgetLayoutSource.includes("Math.max(1, Math.round(progress * 7))"),
  "Native week progress dots must allow true zero progress instead of forcing a decorative active dot."
);
assert(
  nativeWidgetLayoutSource.includes("if (!isMedium)") && nativeWidgetLayoutSource.includes("frame({ maxWidth: 158, maxHeight: 158"),
  "Native systemSmall layout should use a dedicated compact branch instead of the medium agenda stack."
);
assert(
  nativeWidgetLayoutSource.includes("weekdayCounts") && nativeWidgetLayoutSource.includes("maxWeekdayCount"),
  "Native Week widget should render real workload-by-day counts."
);
for (const family of ["accessoryCircular", "accessoryRectangular", "accessoryInline"]) {
  assert(nativeWidgetLayoutSource.includes(`environment.widgetFamily === "${family}"`), `Native widget layout should keep ${family} coverage.`);
}
assert(
    widgetPreviewSource.includes("nativeProgress") &&
    widgetPreviewSource.includes("nativeWidgetProgressDots") &&
    widgetPreviewSource.includes("[0, 1, 2, 3, 4]") &&
    widgetPreviewSource.includes("lockRoundValue"),
  "Widget Studio native preview should render the same five-dot progress signal used by the native layout."
);
assert(
  widgetStudioSource.includes("Ready for Home Screen") &&
    widgetStudioSource.includes("Install native app") &&
    widgetStudioSource.includes("nativeProgress={nativePreview?.progress}") &&
    widgetStudioSource.includes("previewWidgetPresets") &&
    widgetStudioSource.includes("Your saved {name} keeps this data, class focus, palette, and layout together."),
  "Widget Studio should preview draft native presets with product-facing saved-preset copy."
);

assert(
  widgetStudioSource.includes("dataMode") &&
    widgetStudioSource.includes("allowedDataModes") &&
    widgetStudioSource.includes("allowedLayouts") &&
    widgetStudioSource.includes("styleChoice") &&
    widgetStudioSource.includes("studioPaletteOptions") &&
    widgetStudioSource.includes("stageWallpaper") &&
    widgetStudioSource.includes("setFont(option)") &&
    widgetStudioSource.includes("single_class"),
  "Widget Studio should expose real data, size, palette, wallpaper, font, class, and layout controls."
);

assert(
  nativeWidgetLayoutSource.includes("weekdayLabels") &&
    nativeWidgetLayoutSource.includes("StudyPlannerWeekWidget") &&
    nativeWidgetLayoutSource.includes("StudyPlannerClassProgressWidget"),
  "Native widgets should localize weekday labels and export Week/Class Progress widgets."
);

if (failures.length) {
  console.error("Widget snapshot gate failures:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("StudyPlanner widget snapshot gates passed");
