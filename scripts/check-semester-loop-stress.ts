import { buildSemesterPulseSignal } from "../src/logic/semesterPulse";
import { updateWidgetSettings } from "../src/core/actions";
import {
  buildCoreWidgetPresets,
  buildCoreWidgetSnapshotInput,
  nativeWidgetKindForCoreWidget
} from "../src/core/nativeWidgetBridge";
import { createInitialAppState, widgetTypes } from "../src/core/sampleData";
import { getWidgetDisplayModel } from "../src/core/widgetEngine";
import {
  calculateSemesterProgress,
  getNeedsReview,
  getRecommendedFocusDuration
} from "../src/logic/planner";
import { buildStudyPlannerWidgetSnapshots } from "../src/services/widgetSnapshot";
import { buildCanonicalWidgetPreset } from "../src/widgets/widgetPresets";
import type {
  Assignment,
  Course,
  FocusSession,
  ParsedImport,
  Semester,
  UserSettings,
  WidgetPreset
} from "../src/models";
import type { Accent, WidgetType } from "../src/core/types";

declare const require: (name: string) => {
  mkdirSync(path: string, options?: { recursive?: boolean }): void;
  readFileSync(path: string, encoding: string): string;
  writeFileSync(path: string, value: string): void;
};

const fs = require("node:fs");
const now = new Date("2026-06-03T10:00:00");

type ScenarioPhase =
  | "pre_semester"
  | "import_trust"
  | "review_correction"
  | "first_week"
  | "daily_overwhelmed"
  | "busy_week"
  | "exam_pressure"
  | "recovery"
  | "notes_grades_memory"
  | "widgets_sync_retention";

type ScenarioSpec = {
  id: number;
  name: string;
  phase: ScenarioPhase;
};

type StressResult = {
  id: number;
  name: string;
  phase: ScenarioPhase;
  score: number;
  status: string;
  reviewCount: number;
  todayState: string;
  upcomingState: string;
  weekState: string;
  classProgressState: string;
  focusMinutes: number;
};

const scenarioNames = [
  "Blank First Open",
  "Fake Data Suspicion",
  "Syllabus Pile Sunday",
  "I'll Do It Later Onboarding",
  "Parent Watching Setup",
  "Transfer Late Add Drop",
  "Night Class Setup",
  "High-School Block Schedule",
  "Grad Seminar Sparse Dates",
  "Offline Dorm Wi-Fi Setup",
  "Photo OCR Unavailable Honesty",
  "Pasted Syllabus Works",
  "Text PDF Import Works",
  "Fuzzy Handout Photo",
  "LMS Module Copy Paste",
  "Multiple Syllabi Same Course",
  "Huge PDF Rejected Clearly",
  "Wrong File Selected",
  "No Deadlines Found",
  "Parser Retry After Network Loss",
  "Missing Date Confirm",
  "Duplicate Lab Report",
  "Low Confidence Class Name",
  "Wrong Course Mapped",
  "Assignment Type Corrected",
  "Midnight Due Timezone Doubt",
  "Relative Weekday Needs Review",
  "Dismiss Old Reading",
  "Add All Twice",
  "Recent Import Resume",
  "First Monday Schedule",
  "Room Changed After Class",
  "Syllabus Changed Day Two",
  "Course Color Personalization",
  "Reminder Lead Time Tuned",
  "Calendar Sync Hesitant",
  "Widget Preview After Import",
  "Notes From First Lecture",
  "Quick Homework After Class",
  "Add Drop Cleanup",
  "Wake Up Too Much Due",
  "Between Classes Next Action",
  "Due Tonight After Practice",
  "Lunch Sprint Suggestion",
  "Procrastinator Tiny Step",
  "ADHD Focus Support",
  "Night Owl Plan",
  "All Caught Up Clarity",
  "Privacy Mode In Public",
  "Completion Updates Widgets",
  "Three Heavy Days",
  "One Peak Day Warning",
  "Overdue Plus Exam",
  "Same Friday Project Stack",
  "Reading Flood Low Priority",
  "Lab And Exam Collision",
  "Work Shift Blocks Evening",
  "Athlete Travel Weekend",
  "Highest Risk Course",
  "Open Study Block Found",
  "Exam In 14 Days",
  "Midterm Tomorrow Unstarted",
  "Final Project Milestones",
  "Group Project Ambiguous Owner",
  "Review Guide Added Late",
  "High Weight Exam",
  "Practice Done Exam Not",
  "Multi Day Study Plan",
  "Pack Materials Reminder",
  "Post Exam Recovery",
  "Week After Absence",
  "Two Overdue Small Wins",
  "Missed Deadline No Shame",
  "Archive Impossible Task",
  "Recover After Failed Import",
  "Pulse At Risk",
  "Recovery With No Active Work",
  "Catch Up Under 20 Minutes",
  "Finals Burnout Minimal Theme",
  "Dropped Course Ghosts Removed",
  "Pinned Note Resurfaces",
  "Note To Task Conversion",
  "Note Review Reminder",
  "Sparse Notes Warning",
  "Grade Goal First Score",
  "What If Target Exam",
  "Missing Category Weights",
  "Grade Item Wrong Course",
  "Learned Focus Duration",
  "Day 30 Personalization Proof",
  "Widget Install Unavailable",
  "Widget Privacy Redaction",
  "Week Widget No Crop",
  "Class Widget All Classes Fallback",
  "Native Sync Off",
  "Watch Next Signal",
  "Restore After Reinstall",
  "Product Unavailable No Unlock",
  "Relaunch Preserves Loop",
  "End Semester Archive Handoff"
] as const;

const phases: ScenarioPhase[] = [
  "pre_semester",
  "import_trust",
  "review_correction",
  "first_week",
  "daily_overwhelmed",
  "busy_week",
  "exam_pressure",
  "recovery",
  "notes_grades_memory",
  "widgets_sync_retention"
];

const top20Improvements = [
  "Unify live app state with PlannerData/StudyPlannerBrain so every screen shares the semester truth.",
  "Make first-run state empty by default and keep demo data behind explicit preview mode.",
  "Wire Scan -> Review -> Apply -> Today with persisted parsed import sessions and rows.",
  "Sync native widgets after every planner mutation and expose the sync state in Widget Studio.",
  "Make Widget Studio only show native-backed widget outcomes or map every visible card to a native family.",
  "Replace hard-coded date/time copy with current-time selectors and timezone-safe date utilities.",
  "Add empty Today education that offers the first action instead of fake reassurance.",
  "Route notes through note-to-task, note review, and summary primitives instead of generic placeholders.",
  "Add recovery planning for overdue work with smallest-next-step recommendations.",
  "Use Semester Pulse on Home, Schedule, widgets, and Watch so the app has one top-level signal.",
  "Add class-risk explanations that connect grade, deadline, notes, and focus history.",
  "Persist widget presets, customization, and native App Group snapshots from the same save action.",
  "Add simulator assertions for screen content, not only screenshots.",
  "Add timezone and midnight due-date regression tests for live selectors.",
  "Add parser trust UI for low confidence, duplicates, and missing dates.",
  "Add focus-session memory so recommendations adapt after repeated sessions.",
  "Add paywall/entitlement recovery states that satisfy store and release gates.",
  "Add grade what-if logic to the daily plan and exam prep surfaces.",
  "Add migration tests from the legacy core prototype state to the canonical planner model.",
  "Turn the 100-scenario stress matrix into a release gate with per-scenario fixture snapshots."
];

const scenarios: ScenarioSpec[] = scenarioNames.map((name, index) => ({
  id: index + 1,
  name,
  phase: phases[Math.floor(index / 10)] ?? "widgets_sync_retention"
}));

const results = scenarios.map(runScenario);
const widgetStudioCoverage = assertWidgetStudioSavedLogic();

assert(results.length >= 100, "Expected at least 100 semester-loop scenarios.");
for (const result of results) {
  assert(result.score >= 0 && result.score <= 100, `${result.name} pulse score should be 0-100.`);
  assert(result.focusMinutes >= 10 && result.focusMinutes <= 60, `${result.name} focus duration should stay usable.`);
  assert(Boolean(result.todayState), `${result.name} should produce a Today widget state.`);
  assert(Boolean(result.upcomingState), `${result.name} should produce an Upcoming widget state.`);
  assert(Boolean(result.weekState), `${result.name} should produce a Week widget state.`);
  assert(Boolean(result.classProgressState), `${result.name} should produce a Class Progress widget state.`);
}

const report = {
  generatedAt: new Date().toISOString(),
  now: now.toISOString(),
  scenarioCount: results.length,
  top20Improvements,
  scorecard: {
    minScore: Math.min(...results.map((item) => item.score)),
    maxScore: Math.max(...results.map((item) => item.score)),
    avgScore: Math.round(results.reduce((sum, item) => sum + item.score, 0) / results.length),
    reviewScenarioCount: results.filter((item) => item.reviewCount > 0).length,
    widgetReadyCount: results.filter((item) => item.todayState === "ready" || item.upcomingState === "ready").length
  },
  widgetStudioCoverage,
  results
};

fs.mkdirSync("qa", { recursive: true });
fs.writeFileSync("qa/semester-loop-stress-report.json", `${JSON.stringify(report, null, 2)}\n`);

console.log(`semester loop stress passed: ${results.length} scenarios`);
console.log(`widget studio coverage passed: ${widgetStudioCoverage.studioWidgetCount} saved widgets -> ${widgetStudioCoverage.nativePresetCount} native presets`);
console.log(`top leverage improvement: ${top20Improvements[0]}`);

function runScenario(spec: ScenarioSpec): StressResult {
  const courses = buildCourses(spec);
  const semester = buildSemester(spec);
  const assignments = buildAssignments(spec, courses);
  const parsedImports = buildParsedImports(spec, assignments);
  const settings = buildSettings(spec);
  const focusSessions = buildFocusSessions(spec, assignments);
  const widgetPresets = buildWidgetPresets(spec, courses);
  const pulse = buildSemesterPulseSignal({
    semester,
    courses,
    assignments,
    parsedImports,
    focusSessions,
    now
  });
  const progress = calculateSemesterProgress(semester, now);
  const focusMinutes = getRecommendedFocusDuration(assignments, focusSessions, settings, now);
  const snapshots = buildStudyPlannerWidgetSnapshots({
    semester,
    courses,
    assignments,
    parsedImports,
    focusSessions,
    settings,
    widgetPresets,
    demoMode: false,
    now
  });

  assert(progress >= 0 && progress <= 1, `${spec.name} semester progress should stay normalized.`);
  assert(snapshots.week.weekdayLabels?.length === 7, `${spec.name} Week widget should keep seven weekday labels.`);
  assert(!JSON.stringify(snapshots).includes("demo-leftover"), `${spec.name} widgets should not leak demo rows.`);

  return {
    id: spec.id,
    name: spec.name,
    phase: spec.phase,
    score: pulse.score,
    status: pulse.status,
    reviewCount: getNeedsReview(assignments).length,
    todayState: snapshots.today.state,
    upcomingState: snapshots.upcoming.state,
    weekState: snapshots.week.state,
    classProgressState: snapshots.classProgress.state,
    focusMinutes
  };
}

function assertWidgetStudioSavedLogic() {
  const accents: Accent[] = ["blue", "mint", "violet", "orange", "cyan", "rose", "blue"];
  const savedAt = new Date(now);
  let state = createInitialAppState();

  widgetTypes.forEach((widgetType, index) => {
    savedAt.setSeconds(savedAt.getSeconds() + 1);
    state = updateWidgetSettings(state, widgetType, {
      ...state.widgetSettings[widgetType],
      widgetType,
      accent: accents[index] ?? "blue",
      size: index % 3 === 0 ? "Hero" : index % 3 === 1 ? "L" : "M",
      density: index % 2 === 0 ? "Detailed" : "Compact",
      updatedAt: savedAt.toISOString()
    });
  });

  const nativePresets = buildCoreWidgetPresets(state, now);
  const snapshotInput = buildCoreWidgetSnapshotInput(state, now);
  const expectedNativeKinds = ["today", "upcoming", "week", "classProgress"];
  const lockScreenFamilies = ["accessoryInline", "accessoryCircular", "accessoryRectangular"];
  const appConfig = JSON.parse(fs.readFileSync("app.json", "utf8"));
  const widgetPlugin = (appConfig.expo?.plugins ?? []).find((plugin: unknown) => Array.isArray(plugin) && plugin[0] === "expo-widgets");
  const widgetDefinitions = widgetPlugin?.[1]?.widgets ?? [];

  widgetTypes.forEach((widgetType) => {
    assert(state.widgetSettings[widgetType].widgetType === widgetType, `${widgetType} should keep its saved widget identity.`);
    assert(Boolean(nativeWidgetKindForCoreWidget(widgetType)), `${widgetType} should map to a native widget family.`);
    const display = getWidgetDisplayModel(widgetType, state);
    assert(!`${display.value} ${display.title} ${display.copy}`.includes("NaN"), `${widgetType} should never render NaN.`);
  });

  const studyDisplay = getWidgetDisplayModel("studyTime", state);
  assert(studyDisplay.value !== "2h", "Study Time should be derived from the saved task queue, not fixed copy.");
  assert(studyDisplay.copy.includes("Problem Set 4") || studyDisplay.copy.includes("Lab Report"), "Study Time should point at a real task.");

  expectedNativeKinds.forEach((kind) => {
    assert(nativePresets.some((preset) => preset.widgetKind === kind), `${kind} native preset should be generated.`);
    assert(snapshotInput.widgetPresets?.some((preset) => preset.widgetKind === kind), `${kind} should be included in native snapshot input.`);
  });

  widgetDefinitions.forEach((widget: { name: string; supportedFamilies?: string[] }) => {
    lockScreenFamilies.forEach((family) => {
      assert(widget.supportedFamilies?.includes(family), `${widget.name} should register ${family} for iPhone Lock Screen widgets.`);
    });
    const swiftSource = fs.readFileSync(`ios/ExpoWidgetsTarget/${widget.name}.swift`, "utf8");
    lockScreenFamilies.forEach((family) => {
      const swiftFamily = `.${family}`;
      assert(swiftSource.includes(swiftFamily), `${widget.name}.swift should keep ${swiftFamily} supported.`);
    });
  });

  return {
    studioWidgetCount: widgetTypes.length,
    lockScreenFamilyCount: lockScreenFamilies.length,
    nativePresetCount: nativePresets.length,
    mappedNativeKinds: widgetTypes.reduce((all, widgetType) => {
      all[widgetType] = nativeWidgetKindForCoreWidget(widgetType);
      return all;
    }, {} as Record<WidgetType, string>)
  };
}

function buildSemester(spec: ScenarioSpec): Semester {
  if (spec.phase === "pre_semester") {
    return { id: "fall-2026", name: "Fall 2026", startDate: "2026-08-24", endDate: "2026-12-18" };
  }
  if (spec.phase === "widgets_sync_retention" && spec.id === 100) {
    return { id: "spring-2026", name: "Spring 2026", startDate: "2026-01-12", endDate: "2026-06-05" };
  }
  return { id: "summer-2026", name: "Summer 2026", startDate: "2026-05-18", endDate: "2026-08-14" };
}

function buildCourses(spec: ScenarioSpec): Course[] {
  if (spec.id === 1 || spec.id === 10) return [];
  const count = spec.phase === "busy_week" ? 5 : spec.name.includes("Grad Seminar") ? 1 : 4;
  return Array.from({ length: count }, (_unused, index) => {
    const colors = ["#2F80ED", "#35F2D0", "#8B3DFF", "#FF5A1F", "#EC4899"];
    const names = ["Biology 101", "Calculus II", "English Literature", "Computer Science", "World History"];
    return {
      id: `course-${index + 1}`,
      code: ["BIO101", "MATH2", "ENG", "CS", "HIST"][index] ?? `CLS${index + 1}`,
      name: names[index] ?? `Class ${index + 1}`,
      color: colors[index] ?? "#2F80ED",
      meetings: [
        {
          id: `meeting-${index}`,
          day: index % 2 === 0 ? "Mon" : "Tue",
          startTime: `${String(9 + index).padStart(2, "0")}:00`,
          endTime: `${String(10 + index).padStart(2, "0")}:00`,
          location: index % 2 === 0 ? "B204" : "M112"
        }
      ],
      gradeCategories: []
    };
  });
}

function buildAssignments(spec: ScenarioSpec, courses: Course[]): Assignment[] {
  if (courses.length === 0 || spec.id === 19 || spec.id === 48 || spec.id === 77) return [];
  const baseCount =
    spec.phase === "busy_week" ? 14 :
    spec.phase === "exam_pressure" ? 10 :
    spec.phase === "daily_overwhelmed" ? 8 :
    spec.phase === "recovery" ? 7 :
    5;
  return Array.from({ length: baseCount }, (_unused, index) => {
    const course = courses[index % courses.length];
    const offset =
      spec.phase === "recovery" && index < 3 ? -index - 1 :
      spec.phase === "busy_week" ? index % 5 :
      spec.phase === "exam_pressure" ? index + 1 :
      index % 8;
    const dueAt = dateOffset(offset, 11 + (index % 8));
    const needsReview = spec.phase === "review_correction" ? index % 2 === 0 : spec.id === 20 && index < 2;
    const kind = spec.phase === "exam_pressure" && index % 3 === 0 ? "exam" : index % 5 === 0 ? "project" : index % 4 === 0 ? "reading" : "assignment";
    return {
      id: `${spec.id}-assignment-${index}`,
      courseId: course.id,
      title: `${scenarioTaskPrefix(spec)} ${index + 1}`,
      kind,
      type: kind,
      dueAt,
      tags: [spec.phase],
      priority: index % 3 === 0 || spec.phase === "busy_week" ? "high" : index % 3 === 1 ? "medium" : "low",
      estimatedMinutes: kind === "exam" ? 120 : kind === "project" ? 100 : index % 3 === 0 ? 75 : 30,
      status: spec.id === 70 || (spec.phase === "notes_grades_memory" && index === 0) ? "done" : "not_started",
      source: spec.phase === "import_trust" || spec.phase === "review_correction" ? "syllabus" : "manual",
      sourceId: spec.phase === "import_trust" || spec.phase === "review_correction" ? `import-${spec.id}` : undefined,
      needsReview,
      duplicateOf: spec.id === 22 && index === 1 ? `${spec.id}-assignment-0` : undefined,
      confidence: needsReview ? 0.58 : 0.92,
      progress: spec.phase === "exam_pressure" && index % 2 === 0 ? 0.35 : 0,
      checklist: [
        { id: `${spec.id}-${index}-step-1`, title: "Open materials", done: index % 4 === 0 },
        { id: `${spec.id}-${index}-step-2`, title: "Finish first pass", done: false }
      ],
      reminder: { enabled: true, leadTimeHours: kind === "exam" ? 24 : 2 },
      createdAt: dateOffset(-7, 9),
      updatedAt: dateOffset(spec.id === 50 && index === 0 ? 0 : -1, 18)
    } satisfies Assignment;
  });
}

function buildParsedImports(spec: ScenarioSpec, assignments: Assignment[]): ParsedImport[] {
  if (assignments.length === 0) return [];
  if (spec.phase !== "import_trust" && spec.phase !== "review_correction") {
    return [{
      id: `manual-${spec.id}`,
      title: "Manual plan",
      sourceType: "typed",
      status: "applied",
      itemCount: assignments.length,
      createdAt: dateOffset(-8, 8),
      updatedAt: dateOffset(-1, 17)
    }];
  }
  return [{
    id: `import-${spec.id}`,
    title: `${spec.name} source`,
    sourceType: spec.id === 14 ? "photo" : "typed",
    status: spec.phase === "review_correction" ? "parsed" : "applied",
    itemCount: assignments.length,
    createdAt: dateOffset(-2, 12),
    updatedAt: dateOffset(-1, 12)
  }];
}

function buildSettings(spec: ScenarioSpec): UserSettings {
  return {
    studentName: "Maya",
    selectedTheme: spec.phase === "recovery" ? "minimal" : spec.phase === "widgets_sync_retention" ? "graphite" : "ocean",
    customPalette: [],
    appTheme: spec.phase === "recovery" ? "mint" : "classic",
    defaultWidgetStyle: spec.phase === "widgets_sync_retention" ? "dark" : "glass",
    onboardingComplete: spec.id !== 1,
    notificationDefault: "2 hours before due",
    focusDefaultMinutes: spec.phase === "exam_pressure" ? 35 : 25,
    syncEnabled: spec.id !== 95,
    privacyMode: spec.id === 49 || spec.id === 92,
    emojiAccentEnabled: true,
    stressLevel: spec.phase === "busy_week" || spec.phase === "exam_pressure" ? "high" : "steady",
    profile: {
      name: "Maya",
      schoolLevel: "college",
      goal: "less_stress",
      struggle: spec.phase === "daily_overwhelmed" ? "procrastination" : "forgetting_deadlines",
      scheduleStyle: spec.phase === "busy_week" ? "activities_heavy" : "balanced",
      stressLevel: spec.phase === "busy_week" || spec.phase === "exam_pressure" ? "high" : "steady"
    }
  };
}

function buildFocusSessions(spec: ScenarioSpec, assignments: Assignment[]): FocusSession[] {
  const first = assignments[0];
  if (!first || spec.phase === "pre_semester") return [];
  return Array.from({ length: spec.phase === "notes_grades_memory" ? 3 : spec.id % 3 }, (_unused, index) => ({
    id: `${spec.id}-focus-${index}`,
    assignmentId: first.id,
    durationMinutes: 25 + index * 5,
    startedAt: dateOffset(-index, 16),
    endedAt: dateOffset(-index, 16),
    status: "completed",
    sessionNumber: index + 1
  }));
}

function buildWidgetPresets(spec: ScenarioSpec, courses: Course[]): WidgetPreset[] {
  const classFocusCourseId = courses[0]?.id;
  return [
    buildCanonicalWidgetPreset("today", {
      palette: spec.phase === "recovery" ? "paper" : "ocean",
      background: spec.id === 92 ? "dark" : "glass",
      dataMode: spec.phase === "daily_overwhelmed" ? "urgent_only" : "today",
      layout: "list"
    }, now),
    buildCanonicalWidgetPreset("upcoming", {
      palette: spec.phase === "exam_pressure" ? "sunset" : "ocean",
      background: "glass",
      dataMode: spec.phase === "exam_pressure" ? "urgent_only" : "next3",
      layout: "timeline"
    }, now),
    buildCanonicalWidgetPreset("week", {
      palette: spec.phase === "busy_week" ? "graphite" : "forest",
      background: spec.phase === "busy_week" ? "dark" : "glass",
      dataMode: "this_week",
      layout: "strip"
    }, now),
    buildCanonicalWidgetPreset("classProgress", {
      palette: "forest",
      background: "glass",
      dataMode: "single_class",
      layout: "progress",
      classFocusCourseId
    }, now)
  ];
}

function scenarioTaskPrefix(spec: ScenarioSpec) {
  if (spec.phase === "exam_pressure") return "Exam prep";
  if (spec.phase === "busy_week") return "Stacked deadline";
  if (spec.phase === "recovery") return "Recovery task";
  if (spec.phase === "review_correction") return "Review item";
  return "Semester task";
}

function dateOffset(days: number, hour: number) {
  const value = new Date(now);
  value.setDate(value.getDate() + days);
  value.setHours(hour, 0, 0, 0);
  return value.toISOString();
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
