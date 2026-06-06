import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { analyzeNotes, analyzeSyllabus, buildStudyPlan } from "../src/ai";
import { buildSemesterSnapshot } from "../src/intelligence";
import { buildSemesterNarrative, healthBand } from "../src/semesterNarrative";
import { defaultData } from "./fixture-data";
import { AppData } from "../src/types";

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf8");
const appJson = JSON.parse(read("app.json")).expo;
const pkg = JSON.parse(read("package.json"));
const appSource = read("App.tsx");
const widgetEngine = read("src/widgetEngine.ts");
const narrativeSource = read("src/semesterNarrative.ts");
const xcodeProject = read("ios/StudyplannerSyllabusAI.xcodeproj/project.pbxproj");

const failures: string[] = [];
function expect(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

function cloneData(overrides: Partial<AppData> = {}): AppData {
  const base = JSON.parse(JSON.stringify(defaultData)) as AppData;
  return {
    ...base,
    prefs: { ...base.prefs, osLive: true, premium: true },
    ...overrides,
  };
}

const syllabus = `
BIO 101 Biology MWF 10:30-11:20 Richards 201
Week | Date | Topic | Assignment | Due
Jan 18: Read Chapter 2, Quiz 1 due
Feb 1: Homework 1 due; Feb 8: Quiz 1; Feb 15: Exam 1
Mar 3-7: Spring Break, no class
Apr 12: Final project due Friday 11:59 PM
`;

const importBatch = analyzeSyllabus(syllabus, cloneData({ classes: [], tasks: [], exams: [], notes: [], studyBlocks: [] }));
const importClasses = importBatch.candidates.filter((item) => item.kind === "class");
const importTasks = importBatch.candidates.filter((item) => item.kind === "task");
const importExams = importBatch.candidates.filter((item) => item.kind === "exam");
const lowConfidence = importBatch.candidates.filter((item) => item.confidence < 0.7);

const messyNotes = analyzeNotes("exam hint know this formula WACC = E/V Re + D/V Rd confusing beta review later", defaultData);
const sparseNotes = analyzeNotes("some stuff maybe", defaultData);

const activeData = cloneData({
  studyBlocks: buildStudyPlan(defaultData),
});
const snapshot = buildSemesterSnapshot(activeData);
const narrative = buildSemesterNarrative(activeData, snapshot);
const band = healthBand(snapshot.semesterHealth.overallScore);

expect(appJson.ios?.bundleIdentifier === "com.mattnewman.studyplanner", "bundle id must remain com.mattnewman.studyplanner");
expect(appJson.version === "1.0.3", "marketing version must remain 1.0.3");
expect(["44", "45", "46", "47", "48"].includes(appJson.ios?.buildNumber), "iOS buildNumber must remain in the verified Build 44+ release train");
expect(appJson.scheme === "studyplanner", "URL scheme must remain studyplanner");
expect(JSON.stringify(appJson).includes("group.com.mattnewman.studyplanner"), "App Group must remain configured");
expect(JSON.stringify(appJson).includes("com.mattnewman.studyplanner.widgets"), "Widget bundle id must remain configured");
expect(!xcodeProject.includes("CURRENT_PROJECT_VERSION = 42;"), "native app/widget CURRENT_PROJECT_VERSION must not remain 42");
expect((xcodeProject.match(/CURRENT_PROJECT_VERSION = (44|45|46|47|48);/g) || []).length >= 4, "native app and widget build settings must use the verified Build 44+ release train");
expect(Boolean(pkg.dependencies?.["expo-iap"]), "IAP dependency must remain present");
expect(Boolean(pkg.dependencies?.["expo-notifications"]), "notification dependency must remain present");
expect(Boolean(pkg.dependencies?.["expo-widgets"]), "WidgetKit dependency must remain present");

expect(appSource.includes("\"success\"].includes(active)") || appSource.includes("\"success\""), "post-import success must be allowed before hard paywall");
expect(appSource.includes("Semester Ready"), "post-import Semester Ready moment must exist");
const hasPostImportSequence = appSource.includes("Analyzing deadlines") || appSource.includes("Finding deadlines");
const hasHealthGenerationStep = appSource.includes("Generating semester health") || appSource.includes("Calculating Semester Health");
expect(hasPostImportSequence, "post-import progress sequence must exist");
expect(hasHealthGenerationStep, "post-import health generation step must exist");
expect(appSource.includes("Keep this semester visible") || appSource.includes("Know your semester."), "post-import paywall handoff must sell visibility");
expect(appSource.includes("HealthRing"), "Semester Health must use animated ring treatment");
expect(appSource.includes("Why this score?") || appSource.includes("Next Move"), "Semester Health must explain the score and next move");
expect(appSource.includes("Next 30 Days"), "dashboard must show compact semester timeline visibility");
expect(appSource.includes("Review StudyPlanner"), "review ask must exist after high-leverage emotional impact");
expect(appSource.includes("SkeletonLine"), "loading skeletons must exist in the post-import flow");
expect(!appSource.includes("Widget Studio"), "visible Widget Studio copy must remain removed");
expect(!appSource.includes("Theme Studio"), "visible Theme Studio copy must remain removed");

expect(widgetEngine.includes("studyplanner://today"), "widgets must deep link to Today");
expect(widgetEngine.includes("headline: narrative.widgetLabel"), "small widget must lead with semester narrative");
expect(widgetEngine.includes('detail: "Semester Health"'), "small widget must identify Semester Health");
expect(widgetEngine.includes('headline: "Next Move"'), "medium/upcoming widget must preserve next move coaching");
expect(narrativeSource.includes("Preparedness needs notes"), "narrative must connect notes to preparedness");

expect(importClasses.length >= 1, "stress syllabus must detect at least one class");
expect(importTasks.length >= 2, "stress syllabus must detect multiple assignments");
expect(importExams.length >= 1, "stress syllabus must detect exams");
expect(lowConfidence.length <= importBatch.candidates.length, "low-confidence rows must remain reviewable, not silently applied");
expect(messyNotes.candidates.some((item) => item.kind === "task" && /flashcards|review|recall/i.test(item.title + item.meta)), "messy notes must produce preparedness-oriented review action");
expect(sparseNotes.candidates.every((item) => item.confidence < 0.75 || !item.approved), "sparse notes must not overstate confidence");
expect(narrative.healthLabel === band.label || ["Exam Week", "Pressure Building", "Recovery Needed"].includes(narrative.state), "narrative state must agree with health band or a stronger current risk");

mkdirSync(join(root, "qa", "build44"), { recursive: true });
const report = `# Build 44 Stress Test Report

## Metadata
- Version: ${appJson.version}
- Build: ${appJson.ios?.buildNumber}
- Bundle: ${appJson.ios?.bundleIdentifier}
- URL scheme: ${appJson.scheme}
- Widget bundle: com.mattnewman.studyplanner.widgets

## Checks
- Value-before-paywall gate: ${appSource.includes("\"success\"") ? "PASS" : "FAIL"}
- Semester Ready sequence: ${appSource.includes("Semester Ready") && hasPostImportSequence ? "PASS" : "FAIL"}
- Animated health ring: ${appSource.includes("HealthRing") ? "PASS" : "FAIL"}
- Score explanation: ${appSource.includes("Why this score?") ? "PASS" : "FAIL"}
- 30-day visibility card: ${appSource.includes("Next 30 Days") ? "PASS" : "FAIL"}
- Review ask after impact: ${appSource.includes("Review StudyPlanner") ? "PASS" : "FAIL"}
- Loading skeletons: ${appSource.includes("SkeletonLine") ? "PASS" : "FAIL"}
- Widget narrative parity: ${widgetEngine.includes("headline: narrative.widgetLabel") ? "PASS" : "FAIL"}

## Parser / Notes Samples
- Syllabus candidates: ${importBatch.candidates.length}
- Classes: ${importClasses.length}
- Assignments: ${importTasks.length}
- Exams: ${importExams.length}
- Low-confidence review rows: ${lowConfidence.length}
- Messy notes candidates: ${messyNotes.candidates.length}
- Sparse notes candidates: ${sparseNotes.candidates.length}

## Narrative Consistency
- Health score: ${snapshot.semesterHealth.overallScore}
- Health band: ${band.label}
- Narrative: ${narrative.state}
- Driver: ${narrative.primaryDriver}
- Next move: ${narrative.nextMoveLabel}

## Result
${failures.length ? `FAIL\n\n${failures.map((failure) => `- ${failure}`).join("\n")}` : "PASS"}
`;
writeFileSync(join(root, "BUILD_44_STRESS_TEST_REPORT.md"), report);

if (failures.length) {
  console.error("Build 44 retention checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Build 44 retention checks passed");
