import {
  createDefaultStudioCustomization,
  normalizeStudioCustomization,
  updateStudioWidget
} from "../src/customization";
import { buildStudyPlannerWidgetSnapshots } from "../src/services/widgetSnapshot";
import {
  Assignment,
  Course,
  ParsedImport,
  PlannerData,
  Semester,
  UserSettings
} from "../src/models";

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
    iconKey: "globe",
    emojiKey: "globe",
    meetings: [],
    gradeCategories: []
  }
];

const assignments: Assignment[] = [
  {
    id: "history-essay",
    courseId: "history",
    title: "Thesis paragraph",
    kind: "assignment",
    type: "assignment",
    dueAt: "2026-05-23T13:00:00",
    tags: [],
    priority: "medium",
    estimatedMinutes: 45,
    status: "not_started",
    source: "manual",
    progress: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }
];

const parsedImports: ParsedImport[] = [
  {
    id: "scan-1",
    title: "Reviewed syllabus",
    sourceType: "typed",
    status: "applied",
    itemCount: 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }
];

const customization = createDefaultStudioCustomization(now);
const settings: UserSettings = {
  studentName: "Alex",
  selectedTheme: "custom",
  customPalette: [
    customization.primaryAccent,
    customization.secondaryAccent,
    customization.riskColor,
    customization.focusColor
  ],
  appTheme: "campus",
  defaultWidgetStyle: "glass",
  onboardingComplete: true,
  notificationDefault: "2 hours before due",
  focusDefaultMinutes: 25,
  syncEnabled: true,
  privacyMode: false,
  emojiAccentEnabled: true,
  customization
};

const updatedCourses = courses.map((course) =>
  course.id === "history"
    ? { ...course, color: "#22C55E", iconKey: "calculator", emojiKey: "calculator" }
    : course
);
const persistedPlanner: PlannerData = JSON.parse(JSON.stringify({
  onboarded: true,
  paywallSeen: true,
  demoMode: false,
  semester,
  courses: updatedCourses,
  assignments,
  gradeItems: [],
  targetGradePercent: 90,
  settings,
  parsedImports,
  parsedItems: [],
  widgetPresets: [],
  focusSessions: [],
  notes: []
}));

assert(persistedPlanner.courses[0]?.color === "#22C55E", "Class color should persist in planner data.");
assert(persistedPlanner.courses[0]?.iconKey === "calculator", "Class icon should persist in planner data.");

const classColorSnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses: persistedPlanner.courses,
  assignments,
  parsedImports,
  settings: persistedPlanner.settings,
  widgetPresets: [],
  demoMode: false,
  now
});

assert(
  classColorSnapshots.upcoming.items[0]?.courseColor === "#22C55E",
  "Changed class color should propagate into assignment-backed widget rows."
);

const homeWidget = customization.homeWidgetPack[0];
assert(homeWidget, "Default customization should include a Home Screen widget.");
const styledCustomization = updateStudioWidget(
  customization,
  "home",
  homeWidget.id,
  {
    style: "color_card",
    colorSource: "custom",
    customColor: "#EC4899"
  },
  now
);
const reloadedCustomization = normalizeStudioCustomization(JSON.parse(JSON.stringify(styledCustomization)), now);
assert(
  reloadedCustomization.homeWidgetPack[0]?.style === "color_card" &&
    reloadedCustomization.homeWidgetPack[0]?.customColor === "#EC4899",
  "Widget style and custom color should persist through storage."
);

const savedSetupCustomization = normalizeStudioCustomization({
  ...reloadedCustomization,
  savedSetupName: "Loaded semester setup",
  secondaryAccent: "#8B3DFF",
  focusTimerAccent: "#22C55E"
}, now);
const hydratedPlanner: PlannerData = JSON.parse(JSON.stringify({
  ...persistedPlanner,
  settings: {
    ...persistedPlanner.settings,
    customization: savedSetupCustomization
  }
}));
const hydratedCustomization = normalizeStudioCustomization(hydratedPlanner.settings.customization, now);
assert(
  hydratedCustomization.savedSetupName === "Loaded semester setup" &&
    hydratedCustomization.secondaryAccent === "#8B3DFF" &&
    hydratedCustomization.homeWidgetPack[0]?.customColor === "#EC4899",
  "Studio saved setup should reload after storage hydrate."
);

const defaultSnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments,
  parsedImports,
  settings,
  widgetPresets: [],
  demoMode: false,
  now
});
const customizedSnapshots = buildStudyPlannerWidgetSnapshots({
  semester,
  courses,
  assignments,
  parsedImports,
  settings: { ...settings, customization: reloadedCustomization },
  widgetPresets: [],
  demoMode: false,
  now
});

assert(
  customizedSnapshots.upcoming.accentColor === "#EC4899",
  "Native widget snapshot accent should change when widget customization changes."
);
assert(
  customizedSnapshots.upcoming.styleLabel !== defaultSnapshots.upcoming.styleLabel,
  "Native widget snapshot style metadata should change when widget style changes."
);
assert(
  customizedSnapshots.upcoming.backgroundColor !== defaultSnapshots.upcoming.backgroundColor,
  "Native widget snapshot background should change when widget style changes."
);

const todaySource = fs.readFileSync("src/screens/TodayScreen.tsx", "utf8");
const forecastSource = fs.readFileSync("src/screens/PlanScreen.tsx", "utf8");
const studioSource = fs.readFileSync("src/screens/MoreScreen.tsx", "utf8");

assert(
  todaySource.includes("nextCourse?.code") &&
    todaySource.includes("course?.color || SP.blue"),
  "Home cards should render assignment/exam cards from real class colors."
);
assert(
  forecastSource.includes("heat(load)") &&
    forecastSource.includes("Risk week"),
  "Forecast should render the prototype semester heat map and risk card."
);
const focusSource = fs.readFileSync("src/screens/FocusScreen.tsx", "utf8");
assert(
  focusSource.includes("focusAccent") &&
    focusSource.includes("assignment?.title"),
  "Focus should show the selected task and prototype ring accent in the real timer flow."
);
assert(
  studioSource.includes("WidgetPreview") &&
    studioSource.includes("Exam Countdown") &&
    studioSource.includes("Next Assignment") &&
    studioSource.includes("Semester Pulse") &&
    studioSource.includes("styleOptions") &&
    studioSource.includes("colorSources") &&
    studioSource.includes("classColor") &&
    studioSource.includes("Save preview") &&
    studioSource.includes("Preview-only until the native widget bridge reports synced.") &&
    !studioSource.includes("Build your school Home Screen.") &&
    !studioSource.includes("Lock Screen") &&
    !studioSource.includes("Apple" + " Watch") &&
    !studioSource.includes("theme" + " store"),
  "Widget Studio should be a Home Screen builder with live payload preview, controls, class colors, and honest bridge status."
);
const appSource = fs.readFileSync("App.tsx", "utf8");
const coreActionsSource = fs.readFileSync("src/core/actions.ts", "utf8");
const coreStorageSource = fs.readFileSync("src/core/storage.ts", "utf8");
const coreRepositorySource = fs.readFileSync("src/core/repository.ts", "utf8");
assert(
  appSource.includes("actions.updateWidgetSettings") &&
    coreActionsSource.includes("normalizeWidgetSettings({ ...current, ...settings, widgetType") &&
    coreStorageSource.includes("mergeWidgetSettings(fallback.widgetSettings[type], state.widgetSettings?.[type])") &&
    coreRepositorySource.includes("persistWidgetSettings(state.widgetSettings)"),
  "Core Widget Studio settings should normalize on update, hydrate through storage, and persist through the repository."
);
assert(
  appSource.includes('go(nextTask ? "tasks" : focusClass ? "noteEditor" : "scanner")') &&
    appSource.includes('accessibilityLabel="Open calendar"') &&
    appSource.includes("actions.updateClassReminder"),
  "Scenario-backed dashboard actions should preserve Scan navigation, calendar access, and reminder settings plumbing."
);

console.log("customization studio gates passed");
