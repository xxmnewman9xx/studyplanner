import { defaultData, isoFromOffset, TODAY } from "./fixture-data";
import { appendFeedbackEvent, buildSemesterSnapshot, dateKey } from "../src/intelligence";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

const clusterDate = dateKey(TODAY);
const data = {
  ...defaultData,
  classes: [
    {
      ...defaultData.classes[0],
      id: "known",
      code: "BIO 101",
      grade: "A-",
      gradeEntries: [
        { id: "g1", label: "Lab", score: 92, maxScore: 100, weight: 40, source: "manual" as const },
        { id: "g2", label: "Quiz", score: 86, maxScore: 100, weight: 20, source: "manual" as const },
      ],
    },
    { ...defaultData.classes[1], id: "estimated", code: "FIN 250", grade: "Not set" },
    { ...defaultData.classes[2], id: "unknown", code: "CHEM 311", grade: "Not set" },
  ],
  tasks: [
    { ...defaultData.tasks[0], id: "late", classId: "estimated", dueDate: isoFromOffset(-1), dueOffset: 99, done: false, missing: true },
    { ...defaultData.tasks[1], id: "today-a", classId: "known", dueDate: clusterDate, dueOffset: 99, done: false },
    { ...defaultData.tasks[2], id: "today-b", classId: "known", dueDate: clusterDate, dueOffset: 99, done: false },
    { ...defaultData.tasks[3], id: "today-c", classId: "estimated", dueDate: clusterDate, dueOffset: 99, done: false },
  ],
  exams: [
    { ...defaultData.exams[0], id: "exam-soon", classId: "estimated", dueDate: isoFromOffset(4), dueOffset: 99 },
  ],
  notes: [
    { ...defaultData.notes[0], classId: "estimated", reviewedConcepts: ["Prophase", "Metaphase"] },
  ],
  studyBlocks: [
    { ...defaultData.studyBlocks[0], id: "done-block", classId: "known", completed: true, date: clusterDate },
    { ...defaultData.studyBlocks[1], id: "missed-block", classId: "estimated", completed: false, missed: true, date: isoFromOffset(-1) },
  ],
  feedbackEvents: [],
};

const snapshot = buildSemesterSnapshot(data);

assert(snapshot.semesterHealth.overallScore >= 0 && snapshot.semesterHealth.overallScore <= 100, "semester health must be bounded");
assertEqual(Object.keys(snapshot.semesterHealth.dimensions).length, 4, "semester health must include four dimensions");
assert(snapshot.semesterHealth.biggestRisk.length > 8, "semester health needs a plain-English biggest risk");
assert(snapshot.semesterHealth.biggestWin.length > 8, "semester health needs a plain-English biggest win");
assert(snapshot.semesterHealth.nextBestAction.length > 3, "semester health needs a next best action");

assert(snapshot.gradeForecasts.some((forecast) => forecast.mode === "known" && forecast.classId === "known"), "known grade forecast mode should use grade entries");
assert(snapshot.gradeForecasts.some((forecast) => forecast.mode === "estimated" && forecast.classId === "estimated"), "estimated grade forecast mode should use local behavior");
assert(snapshot.gradeForecasts.some((forecast) => forecast.mode === "unknown" && forecast.classId === "unknown"), "unknown grade forecast mode should request missing data");

assert(snapshot.classPulses.length === data.classes.length, "every class must produce a V2 pulse");
assert(snapshot.classPulses.every((pulse) => pulse.forecastLabel && pulse.reason && pulse.nudge), "class pulses must be explainable and action-oriented");
assert(snapshot.pressureForecast.clusters.some((cluster) => cluster.date === clusterDate), "pressure forecast should detect deadline clusters");
assert(snapshot.recommendedActions.length > 0, "semester snapshot needs recommended actions");
assert(snapshot.notificationPlan.items.some((item) => item.kind === "Study"), "notification plan should include study reminders");

const completedData = {
  ...data,
  tasks: data.tasks.map((task) => (task.id === "late" ? { ...task, done: true, missing: false } : task)),
};
const withFeedback = appendFeedbackEvent(data, completedData, "completeTask", { classId: "estimated", actionId: "late", dimension: "workload" });
assert(withFeedback.feedbackEvents?.length === 1, "feedback event should be appended");
assert(typeof withFeedback.feedbackEvents?.[0].delta === "number", "feedback event should store health delta");
assert(withFeedback.feedbackEvents?.[0].before.workload !== undefined, "feedback event should store dimension snapshots");

console.log("SemesterSnapshot checks passed", {
  health: snapshot.semesterHealth.overallScore,
  actions: snapshot.recommendedActions.length,
  feedbackEvents: withFeedback.feedbackEvents?.length || 0,
});
