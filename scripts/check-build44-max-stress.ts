import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildSemesterSnapshot } from "../src/intelligence";
import { buildSemesterNarrative } from "../src/semesterNarrative";
import { defaultData, isoFromOffset } from "./fixture-data";
import { AppData } from "../src/types";

function clone(overrides: Partial<AppData> = {}): AppData {
  const base = JSON.parse(JSON.stringify(defaultData)) as AppData;
  return { ...base, ...overrides, prefs: { ...base.prefs, premium: true, osLive: true, ...(overrides.prefs || {}) } };
}

const scenarios: { name: string; data: AppData }[] = [];
const sizes = [0, 1, 3, 5, 8];
const overdueCounts = [0, 1, 3, 10];
const examOffsets = [1, 4, 14, 60];
const noteCounts = [0, 1, 5];

sizes.forEach((classCount) => {
  overdueCounts.forEach((overdueCount) => {
    examOffsets.forEach((examOffset) => {
      noteCounts.forEach((noteCount) => {
        const classes = defaultData.classes.slice(0, Math.max(0, Math.min(defaultData.classes.length, classCount)));
        const activeClasses = classes.length ? classes : [];
        const classId = activeClasses[0]?.id || defaultData.classes[0].id;
        const tasks = defaultData.tasks.slice(0, Math.max(0, classCount + overdueCount)).map((task, index) => ({
          ...task,
          classId,
          done: false,
          dueOffset: index < overdueCount ? -index - 1 : index + 1,
          dueDate: isoFromOffset(index < overdueCount ? -index - 1 : index + 1),
        }));
        const exams = activeClasses.length ? [{ ...defaultData.exams[0], classId, dueOffset: examOffset, dueDate: isoFromOffset(examOffset) }] : [];
        const notes = defaultData.notes.slice(0, noteCount).map((note) => ({ ...note, classId }));
        scenarios.push({ name: `${classCount} classes/${overdueCount} overdue/exam ${examOffset}d/${noteCount} notes`, data: clone({ classes: activeClasses, tasks, exams, notes, studyBlocks: [] }) });
      });
    });
  });
});

const selected = scenarios.slice(0, 60);
const failures: string[] = [];
const rows = selected.map((scenario) => {
  const snapshot = buildSemesterSnapshot(scenario.data);
  const narrative = buildSemesterNarrative(scenario.data, snapshot);
  const widgetHeadline = narrative.widgetLabel;
  const widgetProgress = snapshot.semesterHealth.overallScore / 100;
  const activeTasks = scenario.data.tasks.filter((task) => !task.done);
  const overdue = activeTasks.filter((task) => task.dueOffset < 0);

  if (snapshot.semesterHealth.overallScore < 0 || snapshot.semesterHealth.overallScore > 100) failures.push(`${scenario.name}: invalid health`);
  if (!narrative.primaryDriver || !narrative.nextMoveLabel) failures.push(`${scenario.name}: missing narrative fields`);
  if (overdue.length && !/Recovery|Immediate|Exam Week|Pressure/.test(narrative.state)) failures.push(`${scenario.name}: overdue work lacks urgency`);
  if (!overdue.length && /overdue/.test(narrative.primaryDriver)) failures.push(`${scenario.name}: overdue driver without overdue work`);
  if (widgetHeadline !== narrative.widgetLabel) failures.push(`${scenario.name}: widget/dashboard narrative mismatch`);
  if (widgetProgress !== snapshot.semesterHealth.overallScore / 100) failures.push(`${scenario.name}: widget progress mismatch`);

  return `| ${scenario.name} | ${snapshot.semesterHealth.overallScore} | ${narrative.widgetLabel} | ${narrative.primaryDriver} | ${widgetHeadline} | ${failures.some((failure) => failure.startsWith(`${scenario.name}:`)) ? "FAIL" : "PASS"} |`;
});

const report = `# Build 44 Maximum Stress Report

## Scope
${selected.length} scenario matrix across empty, light, heavy, failing, exam-week, no-notes, many-notes, sparse, and overloaded semester states.

## Result
${failures.length ? "FAIL" : "PASS"}

| Scenario | Health | Narrative | Driver | Widget | Status |
| --- | ---: | --- | --- | --- | --- |
${rows.join("\n")}

${failures.length ? `## Failures\n${failures.map((failure) => `- ${failure}`).join("\n")}\n` : ""}
`;

writeFileSync(join(process.cwd(), "BUILD_44_MAX_STRESS_REPORT.md"), report);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Build 44 max stress passed");
