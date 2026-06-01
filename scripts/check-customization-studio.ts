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
  todaySource.includes("accentColor={assignmentCourse?.color") &&
    todaySource.includes("accentColor={examCourse?.color"),
  "Home cards should render assignment/exam cards from real class colors."
);
assert(
  forecastSource.includes("accentColor={assignmentCourse?.color") &&
    forecastSource.includes("accentColor={physics?.color"),
  "Forecast cards should render class-backed cards from real class colors."
);
const focusSource = fs.readFileSync("src/screens/FocusScreen.tsx", "utf8");
assert(
  focusSource.includes("courseEmoji(selectedCourse)") &&
    focusSource.includes("backgroundColor: selectedCourse.color"),
  "Focus should show the selected class icon and color in the real timer flow."
);
assert(
  studioSource.includes("Customize StudyPlanner") &&
    studioSource.includes("Make every class, widget, and reminder feel like yours.") &&
    studioSource.includes("Recommended widgets") &&
    studioSource.includes("Why: {proof.why}") &&
    studioSource.includes("Where: {proof.where}") &&
    studioSource.includes("Data: {proof.data}") &&
    studioSource.includes("Changes with: {proof.changes}") &&
    studioSource.includes("selectedColor={customization.secondaryAccent}") &&
    studioSource.includes("Lock Screen") &&
    studioSource.includes("Watch"),
  "Studio should stay preview-first and explain recommendations, secondary accent states, lock, and watch customization surfaces."
);
const appSource = fs.readFileSync("App.tsx", "utf8");
assert(
  appSource.includes("customization: normalizeStudioCustomization(stored.settings?.customization || defaultSettings.customization)") &&
    appSource.includes("customization: patch.customization") &&
    appSource.includes("normalizeStudioCustomization(patch.customization)"),
  "App storage hydrate and settings updates should normalize Studio customization."
);
assert(
  todaySource.includes('label={t("today.scan_syllabus", "Scan syllabus")}') &&
    todaySource.includes("onPress={onOpenScan}") &&
    todaySource.includes('label={t("today.set_reminders", "Set reminders")}') &&
    todaySource.includes("onPress={onScheduleReminders}") &&
    todaySource.includes('label={t("today.sync_calendar", "Sync calendar")}') &&
    todaySource.includes("onPress={onCalendarSync}"),
  "Scenario-backed Today actions should remain wired to real Scan, reminders, and calendar handlers."
);

console.log("customization studio gates passed");
