import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import Module from "node:module";
import { fixtureData, isoFromOffset } from "./fixture-data";
import { resolveSemesterThemeColor } from "../src/semesterTheme";
import type { AppData, SemesterThemeColorId, WidgetDensity } from "../src/types";
import type { NativeWidgetKind, NativeWidgetSnapshot, NativeWidgetSnapshots } from "../src/widgetEngine";

type BuildNativeWidgetSnapshots = typeof import("../src/widgetEngine").buildNativeWidgetSnapshots;

type ScenarioResult = {
  name: string;
  purpose: string;
  themeColor: SemesterThemeColorId;
  density: WidgetDensity;
  assertions: string[];
  snapshots: Record<NativeWidgetKind, ReturnType<typeof summarizeSnapshot>>;
};

const OUTPUT_PATH = "qa/widgets/back-to-school-2026-widget-qa.json";
const failures: string[] = [];
const requiredKinds: NativeWidgetKind[] = ["today", "upcoming", "week", "classProgress"];

function expect(condition: boolean, message: string, assertions?: string[]) {
  if (!condition) failures.push(message);
  else assertions?.push(message);
}

function cloneData(): AppData {
  return JSON.parse(JSON.stringify(fixtureData)) as AppData;
}

function applySemesterTheme(data: AppData, themeColor: SemesterThemeColorId, density: WidgetDensity = "balanced") {
  const theme = resolveSemesterThemeColor(themeColor);
  data.prefs.premium = true;
  data.prefs.widgetTheme = "liquidLight";
  data.prefs.widgetDensity = density;
  data.prefs.semesterThemeColorId = themeColor;
  data.prefs.semesterAccentColor = theme.accent;
  return theme;
}

function makeCalmThemeData() {
  const data = cloneData();
  applySemesterTheme(data, "green");
  data.classes = [{ ...data.classes[0], days: "", next: "", health: 0.95, grade: "A" }];
  data.prefs.widgetClassId = data.classes[0].id;
  data.tasks = [];
  data.exams = [];
  data.notes = [];
  data.reminders = [];
  data.studyBlocks = [];
  return data;
}

function makeEmptyThemeData() {
  const data = cloneData();
  applySemesterTheme(data, "graphite", "quiet");
  data.classes = [];
  data.tasks = [];
  data.exams = [];
  data.notes = [];
  data.reminders = [];
  data.studyBlocks = [];
  return data;
}

function makeExamHeavyData() {
  const data = cloneData();
  applySemesterTheme(data, "purple");
  return data;
}

function makeLongCopyData() {
  const data = cloneData();
  applySemesterTheme(data, "pink", "detailed");
  data.classes = [{ ...data.classes[0], days: "", next: "", health: 0.92, grade: "A-" }];
  data.prefs.widgetClassId = data.classes[0].id;
  data.exams = [];
  data.notes = [];
  data.reminders = [];
  data.studyBlocks = [];
  data.tasks = [
    {
      ...data.tasks[0],
      id: "long-copy-literature-review",
      classId: data.classes[0].id,
      title: "Comprehensive literature review and annotated bibliography checkpoint",
      dueOffset: 1,
      dueDate: isoFromOffset(1),
      time: "11:59 PM",
      done: false,
      urgent: false,
      subtasks: [],
    },
  ];
  return data;
}

function installReactNativeShim() {
  type ModuleLoader = (request: string, parent: unknown, isMain: boolean) => unknown;
  const moduleWithLoad = Module as unknown as { _load: ModuleLoader };
  const originalLoad = moduleWithLoad._load;
  moduleWithLoad._load = (request, parent, isMain) => {
    if (request === "react-native") return { Platform: { OS: "ios" } };
    return originalLoad(request, parent, isMain);
  };
  return () => {
    moduleWithLoad._load = originalLoad;
  };
}

function summarizeSnapshot(snapshot: NativeWidgetSnapshot) {
  return {
    headline: snapshot.headline,
    value: snapshot.value,
    detail: snapshot.detail,
    footnote: snapshot.footnote,
    signalLabel: snapshot.signalLabel,
    timelineLabel: snapshot.timelineLabel,
    updatedLabel: snapshot.updatedLabel,
    accentColor: snapshot.accentColor,
    backgroundColor: snapshot.backgroundColor,
    styleLabel: snapshot.styleLabel,
    densityLabel: snapshot.densityLabel,
    progress: snapshot.progress,
    actionLabel: snapshot.actionLabel,
    openURL: snapshot.openURL,
    items: snapshot.items.map((item) => ({
      id: item.id,
      title: item.title,
      courseCode: item.courseCode,
      dueLabel: item.dueLabel,
    })),
    weekLabels: snapshot.weekLabels,
    weekCounts: snapshot.weekCounts,
    examDays: snapshot.examDays,
    todayIndex: snapshot.todayIndex,
    peakDayLabel: snapshot.peakDayLabel,
    calendarHeadline: snapshot.calendarHeadline,
  };
}

function assertKinds(name: string, snapshots: NativeWidgetSnapshots, assertions: string[]) {
  for (const kind of requiredKinds) {
    expect(Boolean(snapshots[kind]), `${name}: ${kind} snapshot is present`, assertions);
    expect(snapshots[kind]?.version === 1, `${name}: ${kind} snapshot uses version 1`, assertions);
    expect(/^studyplanner:\/\/(today|plan|classes|scan|paywall)$/.test(snapshots[kind]?.openURL || ""), `${name}: ${kind} exposes a supported app destination`, assertions);
    expect(Boolean(snapshots[kind]?.actionLabel), `${name}: ${kind} exposes a widget action label`, assertions);
  }
}

function assertWeekContract(name: string, week: NativeWidgetSnapshot, assertions: string[]) {
  expect(week.kind === "week", `${name}: week snapshot is canonical kind`, assertions);
  expect(week.weekLabels?.length === 7, `${name}: week snapshot has seven labels`, assertions);
  expect(week.weekCounts?.length === 7, `${name}: week snapshot has seven load cells`, assertions);
  expect(typeof week.todayIndex === "number" && week.todayIndex >= 0 && week.todayIndex <= 6, `${name}: today index is a valid week cell`, assertions);
  expect((week.examDays || []).every((day) => Number.isInteger(day) && day >= 0 && day <= 6), `${name}: exam markers are valid week cells`, assertions);
  expect(Boolean(week.calendarHeadline), `${name}: calendar headline is present`, assertions);
  expect(Boolean(week.peakDayLabel), `${name}: peak-day label is present`, assertions);
}

function validateRendererSafeguards(assertions: string[]) {
  const source = readFileSync("src/widgets/StudyPlannerWidgets.tsx", "utf8");
  expect(source.includes("widgetRenderingMode") && source.includes("accented") && source.includes("vibrant"), "renderer handles accented/tinted widget modes", assertions);
  expect(source.includes("containerBackground(bg, \"widget\")"), "renderer uses WidgetKit container background", assertions);
  expect(source.includes("glassEffect({ glass: { variant: \"regular\""), "renderer applies WidgetKit glass effect", assertions);
  expect(source.includes("allowsTightening(true)") && source.includes("minimumScaleFactor(0.72)"), "renderer tightens/scales long widget text", assertions);
  expect(source.includes("lineLimit(1)") && source.includes("lineLimit(isMedium ? 2 : 1)"), "renderer caps single-line and medium footnote text", assertions);
  expect(source.includes("Link({") && source.includes('destination: props.openURL || "studyplanner://today"'), "renderer includes a real deep-link medium-widget action", assertions);
  expect(source.includes("buttonStyle(\"glass\")") && source.includes("controlSize(\"mini\")") && !source.includes("interactionProps(actionLabel)"), "renderer styles the widget link without a placeholder mutation", assertions);
  expect(source.includes("environment.levelOfDetail") && source.includes("environment.isLuminanceReduced") && source.includes("isSimplified"), "renderer adapts to iOS 26 detail and reduced-luminance environments", assertions);
}

async function main() {
  const restore = installReactNativeShim();
  let buildNativeWidgetSnapshots: BuildNativeWidgetSnapshots;
  try {
    buildNativeWidgetSnapshots = (await import("../src/widgetEngine")).buildNativeWidgetSnapshots;
  } finally {
    restore();
  }

  const scenarios = [
    {
      name: "empty-graphite-onboarding",
      purpose: "Empty semester previews keep the quiet default system and expose a zero-load calendar scaffold.",
      themeColor: "graphite" as const,
      density: "quiet" as const,
      data: makeEmptyThemeData(),
      validate: (snapshots: NativeWidgetSnapshots, assertions: string[]) => {
        const theme = resolveSemesterThemeColor("graphite");
        expect(snapshots.today.accentColor === theme.accent, "empty onboarding uses quiet graphite accent", assertions);
        expect(snapshots.today.backgroundColor === theme.widgetBackground, "empty onboarding uses quiet graphite widget background", assertions);
        expect((snapshots.week.weekCounts || []).every((count) => count === 0), "empty calendar starts with zero load", assertions);
        expect(snapshots.week.openURL === "studyplanner://scan", "empty calendar action opens syllabus capture", assertions);
      },
    },
    {
      name: "calm-green-semester",
      purpose: "Normal non-danger widgets keep the existing internal theme path instead of generic semantic blue/green.",
      themeColor: "green" as const,
      density: "balanced" as const,
      data: makeCalmThemeData(),
      validate: (snapshots: NativeWidgetSnapshots, assertions: string[]) => {
        const theme = resolveSemesterThemeColor("green");
        expect(snapshots.today.accentColor === theme.accent, "calm today uses internal green accent fixture", assertions);
        expect(snapshots.week.accentColor === theme.accent, "calm calendar uses internal green accent fixture", assertions);
        expect(snapshots.classProgress.accentColor === theme.accent, "calm class progress uses internal green accent fixture", assertions);
        expect(snapshots.week.backgroundColor === theme.widgetBackground, "calm calendar uses internal green widget background fixture", assertions);
        expect(snapshots.today.openURL === "studyplanner://today", "calm Today action opens Today", assertions);
        expect(snapshots.week.openURL === "studyplanner://plan", "calm calendar action opens Plan", assertions);
        expect(snapshots.classProgress.openURL === "studyplanner://classes", "calm class action opens Classes", assertions);
      },
    },
    {
      name: "exam-heavy-purple-semester",
      purpose: "Urgent widgets preserve red/orange warning semantics while stable widgets keep the internal theme path.",
      themeColor: "purple" as const,
      density: "balanced" as const,
      data: makeExamHeavyData(),
      validate: (snapshots: NativeWidgetSnapshots, assertions: string[]) => {
        const theme = resolveSemesterThemeColor("purple");
        expect(snapshots.today.accentColor === "#FF453A", "overdue today overrides theme with red urgency", assertions);
        expect(snapshots.upcoming.accentColor === "#FF453A", "overdue upcoming overrides theme with red urgency", assertions);
        expect(snapshots.week.accentColor === "#FF9F0A", "exam-heavy calendar overrides theme with orange pressure", assertions);
        expect((snapshots.week.examDays || []).length >= 2, "exam-heavy calendar exposes multiple exam markers", assertions);
        expect(snapshots.classProgress.accentColor === theme.accent, "stable class progress keeps internal purple accent fixture", assertions);
        expect(snapshots.today.openURL === "studyplanner://today", "urgent Today review opens Today", assertions);
      },
    },
    {
      name: "long-copy-pink-detailed",
      purpose: "Detailed widgets tolerate long student copy while relying on native line limits and text scaling.",
      themeColor: "pink" as const,
      density: "detailed" as const,
      data: makeLongCopyData(),
      validate: (snapshots: NativeWidgetSnapshots, assertions: string[]) => {
        const theme = resolveSemesterThemeColor("pink");
        const titles = snapshots.upcoming.items.map((item) => item.title).join(" ");
        expect(titles.includes("Comprehensive literature review"), "long-copy item reaches the upcoming widget snapshot", assertions);
        expect(snapshots.upcoming.accentColor === theme.accent, "long-copy upcoming uses selected pink accent when not urgent", assertions);
        expect(snapshots.upcoming.openURL === "studyplanner://today", "long-copy upcoming action opens Today", assertions);
      },
    },
  ];

  const results: ScenarioResult[] = [];
  const rendererAssertions: string[] = [];
  validateRendererSafeguards(rendererAssertions);

  for (const scenario of scenarios) {
    const assertions: string[] = [];
    const snapshots = buildNativeWidgetSnapshots(scenario.data);
    assertKinds(scenario.name, snapshots, assertions);
    assertWeekContract(scenario.name, snapshots.week, assertions);
    scenario.validate(snapshots, assertions);
    results.push({
      name: scenario.name,
      purpose: scenario.purpose,
      themeColor: scenario.themeColor,
      density: scenario.density,
      assertions,
      snapshots: {
        today: summarizeSnapshot(snapshots.today),
        upcoming: summarizeSnapshot(snapshots.upcoming),
        week: summarizeSnapshot(snapshots.week),
        classProgress: summarizeSnapshot(snapshots.classProgress),
      },
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    scope: "Fixture/preflight proof for Back-to-School 2026 widget snapshots. Native iOS Home Screen placement still requires a development or TestFlight build.",
    rendererAssertions,
    scenarios: results,
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(`${OUTPUT_PATH}`, `${JSON.stringify(payload, null, 2)}\n`);

  if (failures.length) {
    console.error("Back-to-School widget QA failed:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log(`Back-to-School widget QA passed. Wrote ${OUTPUT_PATH}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
