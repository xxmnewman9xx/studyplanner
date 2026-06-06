import { defaultData, isoFromOffset } from "./fixture-data";
import {
  buildClassPulseBreakdowns,
  buildDashboardSnapshot,
  buildNotificationPlan,
  buildRiskRecommendations,
  buildSchedulePlan,
  daysUntilTask,
  parseNoteInsights,
} from "../src/intelligence";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

const data = {
  ...defaultData,
  tasks: [
    { ...defaultData.tasks[0], id: "overdue", dueDate: isoFromOffset(-2), dueOffset: 99, done: false, estimateMinutes: 180 },
    { ...defaultData.tasks[1], id: "today", dueDate: isoFromOffset(0), dueOffset: 99, done: false, estimateMinutes: 90 },
    { ...defaultData.tasks[3], id: "future", dueDate: isoFromOffset(8), dueOffset: -99, done: false, estimateMinutes: 240 },
  ],
  exams: [
    { ...defaultData.exams[0], id: "exam-close", dueDate: isoFromOffset(4), dueOffset: 99 },
  ],
};

const schedule = buildSchedulePlan(data);
assert(schedule.blocks.length >= 5, "scheduler should create deadline, split, exam, and note blocks");
assert(schedule.blocks.every((block) => block.date && block.startsAt && block.endsAt), "all generated blocks must be date-backed");
assert(schedule.blocks.some((block) => block.source === "large_task_split"), "large tasks should be split");
assert(schedule.blocks.some((block) => block.source === "exam_prep"), "exam prep should be scheduled");
assert(Object.values(schedule.dailyLoad).every((minutes) => minutes <= 240), "daily load should stay capped");

const risks = buildRiskRecommendations(data, schedule);
assertEqual(risks[0].id, "overdue", "overdue work should be the highest-risk recommendation");
assertEqual(risks[0].action, "startFocus", "overdue work should recommend focus");

const snapshot = buildDashboardSnapshot(data);
assert(snapshot.nearestDeadline?.taskId === "overdue", "dashboard should use real due dates over stale offsets");
assert(snapshot.todayPressure.overdueCount === 1, "today pressure should count overdue work from dueDate");
assert(snapshot.recommendedFocus, "dashboard should recommend a focus block");

const pulses = buildClassPulseBreakdowns(data);
assert(pulses.length === data.classes.length, "every class needs a pulse");
assert(pulses[0].causes.length > 0, "pulse needs explainable causes");

const noteInsight = parseNoteInsights(defaultData.notes[1], data);
assert(noteInsight.concepts.length > 0, "notes should produce concepts");
assert(noteInsight.formulas.length > 0, "formula notes should surface formulas");
assert(noteInsight.likelyExamTopics.length > 0, "notes should produce likely exam topics");

const plan = buildNotificationPlan(data);
assert(plan.items.some((item) => item.kind === "Class"), "notification plan should include classes");
assert(plan.items.some((item) => item.kind === "Assignment"), "notification plan should include assignments");
assert(plan.items.some((item) => item.kind === "Exam"), "notification plan should include exams");
assert(plan.items.some((item) => item.kind === "Study"), "notification plan should include study blocks");

assert(daysUntilTask(data.tasks[0]) < 0, "date selector must ignore stale positive dueOffset");
assert(daysUntilTask(data.tasks[2]) > 0, "date selector must ignore stale negative dueOffset");

console.log("Intelligence core checks passed", {
  blocks: schedule.blocks.length,
  risks: risks.length,
  pulses: pulses.length,
  notifications: plan.items.length,
});
