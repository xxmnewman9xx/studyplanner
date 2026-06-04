import { buildStudyPlannerWidgetSnapshots } from "../src/services/widgetSnapshot";
import { completeAssignment, saveWidgetPreset } from "../src/logic/planner";
import {
  Assignment,
  Course,
  ParsedImport,
  PlannerData,
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

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const semester: Semester = {
  id: "spring-2026",
  name: "Spring 2026",
  startDate: "2026-01-12",
  endDate: "2026-05-30"
};

const courses: Course[] = [
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
    title: "Reviewed syllabus",
    sourceType: "typed",
    status: "applied",
    itemCount: 2,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }
];

const baseAssignment = {
  courseId: "history",
  kind: "assignment",
  type: "assignment",
  tags: [],
  priority: "medium",
  estimatedMinutes: 30,
  status: "not_started",
  source: "manual",
  progress: 0,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
} satisfies Partial<Assignment>;

const dueTodayAssignments: Assignment[] = [
  {
    ...baseAssignment,
    id: "today-essay",
    title: "Finish thesis paragraph",
    dueAt: "2026-05-22T13:00:00"
  } as Assignment,
  {
    ...baseAssignment,
    id: "today-map",
    title: "Map worksheet",
    dueAt: "2026-05-22T16:00:00"
  } as Assignment
];

const savedTodayPreset: WidgetPreset = saveWidgetPreset(
  [],
  {
    id: "preset-today-integrity",
    name: "Today Forest",
    type: "today",
    size: "medium",
    background: "dark",
    palette: "forest",
    font: "Rounded",
    classFocusCourseId: "history",
    layout: "list",
    iconKey: "check",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  },
  now
)[0];

const before = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments: dueTodayAssignments,
  parsedImports,
  settings,
  widgetPresets: [savedTodayPreset],
  demoMode: false,
  now
});

assert(before.today.items.length === 2, "Before completion, both due-today rows should be visible.");
assert(before.today.progress === 0, "Before completion, Today progress should be 0 of 2.");
assert(before.today.accentColor === "#35F2D0", "Persisted preset palette should control native Today accent.");
assert(before.today.backgroundColor === "#05070B", "Persisted preset background should control native Today background.");

const afterOneAssignments = completeAssignment(dueTodayAssignments, "today-essay", now);
const afterOne = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments: afterOneAssignments,
  parsedImports,
  settings,
  widgetPresets: [savedTodayPreset],
  demoMode: false,
  now
});

assert(!afterOne.today.items.some((item) => item.id === "today-essay"), "Completed assignment should leave Today widget rows.");
assert(afterOne.today.items.length === 1, "After one completion, one due-today row should remain.");
assert(afterOne.today.progress === 0.5, "After one completion, Today progress should be 1 of 2.");
assert(afterOne.today.metricLabel === "1 of 2 complete", "After one completion, Today metric should be a real completion ratio.");

const afterAllAssignments = completeAssignment(
  completeAssignment(dueTodayAssignments, "today-essay", now),
  "today-map",
  now
);
const afterAll = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments: afterAllAssignments,
  parsedImports,
  settings,
  widgetPresets: [savedTodayPreset],
  demoMode: false,
  now
});

assert(afterAll.today.state === "no_due_today", "Completing all due-today work should clear the Today widget state.");
assert(afterAll.today.progress === 1, "Completing all due-today work should produce full Today progress.");
assert(afterAll.today.metricLabel === "2 of 2 complete", "Clear Today should still show the real saved completion ratio.");

const persistedPlanner: PlannerData = JSON.parse(JSON.stringify({
  onboarded: true,
  paywallSeen: true,
  demoMode: false,
  semester,
  courses,
  assignments: [
    {
      ...baseAssignment,
      id: "demo-leftover",
      title: "Demo row that must not sync",
      dueAt: "2026-05-22T10:00:00",
      sourceId: "demo-seed"
    },
    ...afterOneAssignments
  ],
  gradeItems: [],
  targetGradePercent: 90,
  settings,
  parsedImports,
  parsedItems: [],
  widgetPresets: [savedTodayPreset],
  focusSessions: [],
  notes: []
}));

const reloadedSnapshots = buildStudyPlannerWidgetSnapshots({
  semester: persistedPlanner.semester,
  courses: persistedPlanner.courses,
  assignments: persistedPlanner.assignments,
  parsedImports: persistedPlanner.parsedImports || [],
  settings: persistedPlanner.settings,
  widgetPresets: persistedPlanner.widgetPresets,
  demoMode: Boolean(persistedPlanner.demoMode),
  now
});

assert(reloadedSnapshots.today.accentColor === "#35F2D0", "Reloaded widget snapshot should preserve the saved preset accent.");
assert(!JSON.stringify(reloadedSnapshots).includes("demo-leftover"), "Reloaded native snapshots must filter stale demo rows.");

for (const themeChoice of widgetThemeOrder) {
  const themePreset = resolveWidgetTheme(themeChoice);
  const expectedStyle = widgetStyleColors(themePreset);
  const savedThemePreset = saveWidgetPreset(
    [],
    {
      id: `persist-${themeChoice}`,
      name: `Persist ${themeChoice}`,
      type: "due_next",
      size: "small",
      ...themePreset,
      dataMode: "all_classes",
      font: "SF Pro",
      layout: "compact",
      iconKey: "calendar",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    now
  )[0];
  const reloadedThemePreset = JSON.parse(JSON.stringify(savedThemePreset)) as WidgetPreset;
  const themedReloadedSnapshots = buildStudyPlannerWidgetSnapshots({
    semester: persistedPlanner.semester,
    courses: persistedPlanner.courses,
    assignments: persistedPlanner.assignments,
    parsedImports: persistedPlanner.parsedImports || [],
    settings: persistedPlanner.settings,
    widgetPresets: [reloadedThemePreset],
    demoMode: Boolean(persistedPlanner.demoMode),
    now
  });

  assert(
    themedReloadedSnapshots.upcoming.backgroundColor === expectedStyle.backgroundColor,
    `${themeChoice} saved theme should survive reload and drive native background.`
  );
  assert(
    themedReloadedSnapshots.upcoming.accentColor === expectedStyle.accentColor,
    `${themeChoice} saved theme should survive reload and drive native accent.`
  );
}

let fourWidgetPresets: WidgetPreset[] = [];
fourWidgetPresets = saveWidgetPreset(
  fourWidgetPresets,
  {
    id: "matrix-today",
    name: "Today",
    widgetKind: "today",
    type: "today",
    size: "medium",
    theme: "light",
    background: "light",
    palette: "paper",
    dataMode: "today",
    font: "SF Pro",
    layout: "list",
    iconKey: "check",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  },
  now
);
fourWidgetPresets = saveWidgetPreset(
  fourWidgetPresets,
  {
    id: "matrix-upcoming",
    name: "Upcoming",
    widgetKind: "upcoming",
    type: "due_next",
    size: "small",
    theme: "ocean",
    background: "glass",
    palette: "ocean",
    dataMode: "this_week",
    font: "SF Pro",
    layout: "timeline",
    iconKey: "calendar",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  },
  now
);
fourWidgetPresets = saveWidgetPreset(
  fourWidgetPresets,
  {
    id: "matrix-week",
    name: "Week",
    widgetKind: "week",
    type: "week",
    size: "medium",
    theme: "graphite",
    background: "dark",
    palette: "graphite",
    dataMode: "this_week",
    font: "SF Pro",
    layout: "strip",
    iconKey: "calendar",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  },
  now
);
fourWidgetPresets = saveWidgetPreset(
  fourWidgetPresets,
  {
    id: "matrix-class-progress",
    name: "Class Progress",
    widgetKind: "classProgress",
    type: "class_focus",
    size: "small",
    theme: "forest",
    background: "glass",
    palette: "forest",
    dataMode: "single_class",
    font: "SF Pro",
    classFocusCourseId: "history",
    layout: "progress",
    iconKey: "book",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  },
  now
);

const fourWidgetReloaded = JSON.parse(JSON.stringify(fourWidgetPresets)) as WidgetPreset[];
const fourWidgetSnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments: dueTodayAssignments,
  parsedImports,
  settings,
  widgetPresets: fourWidgetReloaded,
  demoMode: false,
  now
});

assert(fourWidgetReloaded.length === 4, "Saving four native presets should persist exactly one preset per shipped widget.");
assert(fourWidgetSnapshots.today.presetTheme === "light", "Today should preserve light theme after reload.");
assert(fourWidgetSnapshots.today.presetLayout === "list", "Today should preserve list layout after reload.");
assert(fourWidgetSnapshots.today.presetDataMode === "today", "Today should preserve today data mode after reload.");
assert(fourWidgetSnapshots.upcoming.presetTheme === "ocean", "Upcoming should preserve ocean theme after reload.");
assert(fourWidgetSnapshots.upcoming.presetLayout === "timeline", "Upcoming should preserve timeline layout after reload.");
assert(fourWidgetSnapshots.upcoming.presetDataMode === "this_week", "Upcoming should preserve this-week data mode after reload.");
assert(fourWidgetSnapshots.week.presetTheme === "graphite", "Week should preserve graphite theme after reload.");
assert(fourWidgetSnapshots.week.presetLayout === "strip", "Week should preserve strip layout after reload.");
assert(fourWidgetSnapshots.week.weekdayCounts?.length === 7, "Week should write native-readable workload counts.");
assert(fourWidgetSnapshots.classProgress.presetTheme === "forest", "Class Progress should preserve forest theme after reload.");
assert(fourWidgetSnapshots.classProgress.presetLayout === "progress", "Class Progress should preserve progress layout after reload.");
assert(fourWidgetSnapshots.classProgress.presetClassId === "history", "Class Progress should preserve selected class id after reload.");

const allowedSnapshotKeys = new Set([
  "version",
  "kind",
  "nativeName",
  "presetKind",
  "presetTheme",
  "presetLayout",
  "presetDataMode",
  "presetClassId",
  "lastSyncedAt",
  "state",
  "generatedAt",
  "semesterName",
  "headline",
  "value",
  "detail",
  "footnote",
  "accentColor",
  "backgroundColor",
  "styleLabel",
  "layoutLabel",
  "densityLabel",
  "windowLabel",
  "courseScopeLabel",
  "progressLabel",
  "progress",
  "iconKey",
  "actionLabel",
  "openURL",
  "signalLabel",
  "metricLabel",
  "nextLabel",
  "timelineLabel",
  "weekdayLabels",
  "weekdayCounts",
  "biggestDeadlineLabel",
  "layoutLocale",
  "smallMaxRows",
  "mediumMaxRows",
  "largeMaxRows",
  "smallTitleLines",
  "mediumTitleLines",
  "largeTitleLines",
  "smallFontScale",
  "mediumFontScale",
  "largeFontScale",
  "smallCompressionMode",
  "mediumCompressionMode",
  "largeCompressionMode",
  "smallShowMetadata",
  "mediumShowMetadata",
  "largeShowMetadata",
  "smallShowFooter",
  "mediumShowFooter",
  "largeShowFooter",
  "smallShowWeekRail",
  "mediumShowWeekRail",
  "largeShowWeekRail",
  "smallSafePadding",
  "mediumSafePadding",
  "largeSafePadding",
  "noCropGuarantee",
  "items"
]);
const allowedItemKeys = new Set(["id", "title", "courseCode", "courseColor", "dueLabel", "priority", "kind"]);

for (const snapshot of [before.today, before.upcoming, afterOne.today, afterAll.today, reloadedSnapshots.today]) {
  for (const key of Object.keys(snapshot)) {
    assert(allowedSnapshotKeys.has(key), `Unexpected native snapshot key: ${key}`);
  }
  assert(isPropertyListSafe(snapshot), "Native widget snapshot should contain only plist-safe primitive data.");
  for (const item of snapshot.items) {
    for (const key of Object.keys(item)) {
      assert(allowedItemKeys.has(key), `Unexpected native widget item key: ${key}`);
    }
  }
}

const appJson = fs.readFileSync("app.json", "utf8");
const appConfig = JSON.parse(appJson).expo;
const expoWidgetsPluginIndex = appConfig.plugins.findIndex((plugin: unknown) => Array.isArray(plugin) && plugin[0] === "expo-widgets");
const widgetKindPluginIndex = appConfig.plugins.findIndex((plugin: unknown) => plugin === "./plugins/with-widgetkit-kinds");
const widgetPlugin = appConfig.plugins[expoWidgetsPluginIndex]?.[1];
const widgetConfigs = widgetPlugin?.widgets || [];
const expoWidgetsJs = fs.readFileSync("node_modules/expo-widgets/build/Widgets.js", "utf8");
const widgetObjectSwift = fs.readFileSync("node_modules/expo-widgets/ios/WidgetObject.swift", "utf8");
const widgetKindPluginSource = fs.readFileSync("plugins/with-widgetkit-kinds.js", "utf8");
const nativeWidgetJs = fs.readFileSync("src/widgets/StudyPlannerWidgets.tsx", "utf8");
const nativeWidgetFiles = [
  fs.readFileSync("ios/ExpoWidgetsTarget/StudyPlannerTodayWidget.swift", "utf8"),
  fs.readFileSync("ios/ExpoWidgetsTarget/StudyPlannerUpcomingWidget.swift", "utf8"),
  fs.readFileSync("ios/ExpoWidgetsTarget/StudyPlannerWeekWidget.swift", "utf8"),
  fs.readFileSync("ios/ExpoWidgetsTarget/StudyPlannerClassProgressWidget.swift", "utf8")
];

assert(appJson.includes('"bundleIdentifier": "com.mattnewman.studyplanner.widgets"'), "Widget extension bundle identifier should be configured.");
assert(appJson.includes('"groupIdentifier": "group.com.mattnewman.studyplanner"'), "Widget App Group identifier should be configured.");
assert(appJson.includes('"name": "StudyPlannerWeekWidget"'), "Week widget should be registered for native Home Screen output.");
assert(appJson.includes('"name": "StudyPlannerClassProgressWidget"'), "Class Progress widget should be registered for native Home Screen output.");
assert(expoWidgetsPluginIndex >= 0, "expo-widgets config plugin should be present.");
assert(widgetKindPluginIndex >= 0 && widgetKindPluginIndex < expoWidgetsPluginIndex, "WidgetKit kind patch plugin should precede expo-widgets in app.json so Expo runs it after generated Swift exists.");
assert(widgetKindPluginSource.includes("widget.kind") && widgetKindPluginSource.includes("let name: String"), "WidgetKit kind patch plugin should rewrite generated Swift kinds from app.json.");
assertWidgetMetadata("studyplanner.today", "StudyPlanner Today", "See what needs your attention today.", ["systemSmall", "systemMedium", "accessoryInline", "accessoryCircular", "accessoryRectangular"]);
assertWidgetMetadata("studyplanner.upcoming", "StudyPlanner Upcoming", "Preview upcoming assignments and deadlines.", ["systemSmall", "systemMedium", "accessoryInline", "accessoryCircular", "accessoryRectangular"]);
assertWidgetMetadata("studyplanner.week", "StudyPlanner Week", "Check your weekly workload at a glance.", ["systemMedium", "accessoryInline", "accessoryCircular", "accessoryRectangular"]);
assertWidgetMetadata("studyplanner.classProgress", "StudyPlanner Class Progress", "Track progress for a selected class.", ["systemSmall", "systemMedium", "accessoryInline", "accessoryCircular", "accessoryRectangular"]);
for (const widgetKind of ["studyplanner.today", "studyplanner.upcoming", "studyplanner.week", "studyplanner.classProgress"]) {
  assert(nativeWidgetJs.includes(`"${widgetKind}"`), `${widgetKind} should be the JS createWidget storage/reload name.`);
  assert(nativeWidgetFiles.some((file) => file.includes(`let name: String = "${widgetKind}"`)), `${widgetKind} should be the native StaticConfiguration kind.`);
}
for (const family of [".accessoryInline", ".accessoryCircular", ".accessoryRectangular"]) {
  assert(nativeWidgetFiles.every((file) => file.includes(family)), `Every native widget should register ${family}.`);
}
assert(expoWidgetsJs.includes("updateSnapshot(props)") && expoWidgetsJs.includes("updateTimeline"), "updateSnapshot should write a timeline entry.");
assert(widgetObjectSwift.includes("WidgetCenter.shared.reloadTimelines") && widgetObjectSwift.includes("WidgetsStorage.set(entries.map"), "Native timeline updates should write App Group storage and reload WidgetKit.");

console.log("widget persistence and integrity gates passed");

function isPropertyListSafe(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isPropertyListSafe);
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).every(isPropertyListSafe);
  return false;
}

function assertWidgetMetadata(kind: string, displayName: string, description: string, families: string[]) {
  const config = widgetConfigs.find((widget: { kind?: string }) => widget.kind === kind);
  assert(config, `${kind} should be present in app.json widget metadata.`);
  if (!config) return;
  assert(config.displayName === displayName, `${kind} display name should be ${displayName}.`);
  assert(config.description === description, `${kind} description should be student-readable.`);
  assert(
    JSON.stringify(config.supportedFamilies) === JSON.stringify(families),
    `${kind} supported families should be ${families.join(", ")}.`
  );
}
