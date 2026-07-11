import { readFileSync } from "node:fs";
import { buildDashboardSnapshot, buildSemesterSnapshot } from "../src/intelligence";
import { applyImportUpdateToData, applyTaskRecurrencePatch, canMarkStudyBlockMissed, deleteTaskRecurrence, findImportMatch } from "../src/ownership/semesterOwnership";
import { isoFromOffset } from "../src/seed";
import { AppData, ClassItem, ExamItem, ImportBatch, StudyBlock, TaskItem } from "../src/types";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function makeData(): AppData {
  return {
    prefs: {
      name: "Student",
      firstName: "Student",
      level: "College",
      semesterType: "Semesters",
      workloadStyle: "Balanced",
      studyPersonality: "Need a nudge",
      reminderStyle: "Standard",
      theme: "light",
      presetId: "academic",
      onboardingComplete: true,
      osLive: true,
      premium: true,
    },
    classes: [],
    tasks: [],
    exams: [],
    notes: [],
    reminders: [],
    studyBlocks: [],
    imports: [],
  };
}

function classItem(id: string, code: string): ClassItem {
  return {
    id,
    code,
    name: `${code} Course`,
    professor: "Professor TBD",
    room: "Room TBD",
    days: "Mon Wed",
    time: "10:00 AM",
    next: "Next meeting",
    health: 0.7,
    grade: "Not set",
    color: "#0A84FF",
    color2: "#30D158",
    icon: "book-open",
  };
}

function taskItem(id: string, classId: string, title: string, dueDate: string, missing = false): TaskItem {
  return {
    id,
    title,
    classId,
    type: "Assignment",
    dueOffset: 0,
    dueDate,
    time: "11:59 PM",
    estimateMinutes: 45,
    done: false,
    urgent: false,
    source: "Manual",
    missing,
    subtasks: [],
  };
}

let data = makeData();

const bio = classItem("bio", "BIO 101");
data = { ...data, classes: [...data.classes, bio] };
assert(data.classes.some((item) => item.id === "bio"), "manual class creation should persist");

const manualAssignment = taskItem("manual-a", "bio", "Lab report", isoFromOffset(2));
const undatedAssignment = taskItem("manual-undated", "bio", "Paper prompt", isoFromOffset(0), true);
const recurring = Array.from({ length: 12 }, (_item, index): TaskItem => ({
  ...taskItem(`discussion-${index}`, "bio", "Weekly discussion", isoFromOffset(index * 7)),
  recurringId: "discussion-series",
  recurrenceIndex: index,
  recurrenceEndDate: isoFromOffset(77),
}));
data = { ...data, tasks: [manualAssignment, undatedAssignment, ...recurring] };
assert(data.tasks.some((task) => task.missing), "undated work should remain visible as Awaiting Date");
assert(data.tasks.filter((task) => task.title === "Weekly discussion").length === 12, "recurring weekly work should create visible instances");

const chem = classItem("chem", "CHEM 201");
data = { ...data, classes: [...data.classes, chem] };
data = { ...data, tasks: data.tasks.map((task) => task.id === "manual-a" ? { ...task, classId: "chem", dueDate: isoFromOffset(4), title: "Lab report revised" } : task) };
assert(data.tasks.find((task) => task.id === "manual-a")?.classId === "chem", "move assignment should change class ownership");
assert(data.tasks.find((task) => task.id === "manual-a")?.title === "Lab report revised", "edit assignment should update title");

const duplicated = { ...manualAssignment, id: "manual-a-copy", title: "Lab report copy", done: false };
data = { ...data, tasks: [duplicated, ...data.tasks] };
assert(data.tasks.some((task) => task.id === "manual-a-copy"), "duplicate assignment should create a new editable task");

data = { ...data, exams: [{ id: "quiz", classId: "chem", title: "Surprise quiz", dueOffset: 0, dueDate: isoFromOffset(1), time: "9:00 AM", room: "Room TBD", kind: "Quiz", topics: ["Professor update"] }] };
assert(data.exams[0]?.kind === "Quiz", "assessment management should support quiz taxonomy");

data = {
  ...data,
  exams: data.exams.map((exam): ExamItem => exam.id === "quiz" ? { ...exam, classId: "bio", title: "Surprise quiz revised", kind: "Midterm", effortMinutes: 150, priority: "High", notes: "Chapters 1-4", userEditedAt: new Date().toISOString() } : exam),
};
assert(data.exams.find((exam) => exam.id === "quiz")?.classId === "bio", "assessment move should change class ownership");
assert(data.exams.find((exam) => exam.id === "quiz")?.kind === "Midterm", "assessment edit should update type");
data = { ...data, exams: [{ ...data.exams[0], id: "quiz-copy", title: "Surprise quiz revised copy" }, ...data.exams] };
assert(data.exams.some((exam) => exam.id === "quiz-copy"), "assessment duplicate should create a new exam");
data = { ...data, exams: data.exams.filter((exam) => exam.id !== "quiz-copy") };
assert(!data.exams.some((exam) => exam.id === "quiz-copy"), "assessment delete should remove only that assessment");
data = { ...data, exams: [{ id: "chem-final", classId: "chem", title: "Chem final", dueOffset: 0, dueDate: isoFromOffset(14), time: "10:00 AM", room: "Room TBD", kind: "Final", effortMinutes: 180, priority: "High", topics: ["Final review"] }, ...data.exams] };

const recurrenceAnchor = data.tasks.find((task) => task.id === "discussion-3")!;
data = { ...data, tasks: applyTaskRecurrencePatch(data.tasks, recurrenceAnchor, { title: "Discussion special case" }, "single") };
assert(data.tasks.find((task) => task.id === "discussion-3")?.title === "Discussion special case", "recurring edit single should update one occurrence");
assert(data.tasks.find((task) => task.id === "discussion-4")?.title === "Weekly discussion", "recurring edit single should not update future occurrences");
const discussion4Date = data.tasks.find((task) => task.id === "discussion-4")?.dueDate;
const discussion5Date = data.tasks.find((task) => task.id === "discussion-5")?.dueDate;
data = { ...data, tasks: applyTaskRecurrencePatch(data.tasks, data.tasks.find((task) => task.id === "discussion-4")!, { title: "Discussion future series" }, "future") };
assert(data.tasks.find((task) => task.id === "discussion-4")?.title === "Discussion future series", "recurring edit future should update anchor occurrence");
assert(data.tasks.find((task) => task.id === "discussion-5")?.title === "Discussion future series", "recurring edit future should update later occurrences");
assert(data.tasks.find((task) => task.id === "discussion-4")?.dueDate === discussion4Date, "recurring title-only future edit should preserve the anchor date");
assert(data.tasks.find((task) => task.id === "discussion-5")?.dueDate === discussion5Date, "recurring title-only future edit should preserve each later occurrence date");

const undatedRecurring = Array.from({ length: 3 }, (_item, index): TaskItem => ({
  ...taskItem(`undated-weekly-${index}`, "chem", "Undated weekly", isoFromOffset(index * 7), true),
  recurringId: "undated-weekly-series",
  recurrenceIndex: index,
}));
const resolvedUndatedRecurring = applyTaskRecurrencePatch(
  undatedRecurring,
  undatedRecurring[0],
  { dueDate: isoFromOffset(2), missing: false },
  "future"
);
assert(resolvedUndatedRecurring[0]?.dueDate === isoFromOffset(2), "resolving an undated recurring anchor should use the chosen date");
assert(resolvedUndatedRecurring[1]?.dueDate === isoFromOffset(9), "resolving an undated recurring series should preserve weekly spacing");
assert(resolvedUndatedRecurring[2]?.dueDate === isoFromOffset(16), "resolving an undated recurring series should preserve every later weekly date");

const blockFixture: StudyBlock = {
  id: "block-fixture",
  day: "Friday",
  time: "8:00 AM - 8:30 AM",
  classId: "chem",
  title: "Review",
  minutes: 30,
  reason: "Regression",
  completed: false,
  date: "2026-07-10",
  startsAt: "2026-07-10T08:00:00.000Z",
  endsAt: "2026-07-10T08:30:00.000Z",
};
const blockNow = new Date("2026-07-10T09:00:00.000Z");
assert(canMarkStudyBlockMissed(blockFixture, blockNow), "past incomplete study block should allow missed repair");
assert(!canMarkStudyBlockMissed({ ...blockFixture, endsAt: "2026-07-10T10:00:00.000Z" }, blockNow), "future study block should not allow missed repair");
assert(!canMarkStudyBlockMissed({ ...blockFixture, completed: true }, blockNow), "completed study block should not allow missed repair");
assert(!canMarkStudyBlockMissed({ ...blockFixture, missed: true }, blockNow), "already-missed study block should not allow another repair");
data = { ...data, tasks: deleteTaskRecurrence(data.tasks, data.tasks.find((task) => task.id === "discussion-4")!, "single") };
assert(!data.tasks.some((task) => task.id === "discussion-4"), "recurring delete single should remove one occurrence");
assert(data.tasks.some((task) => task.id === "discussion-5"), "recurring delete single should preserve future occurrences");
data = { ...data, tasks: deleteTaskRecurrence(data.tasks, data.tasks.find((task) => task.id === "discussion-5")!, "future") };
assert(!data.tasks.some((task) => task.id === "discussion-6"), "recurring delete future should remove later occurrences");

data = { ...data, classes: data.classes.map((klass) => klass.id === "bio" ? { ...klass, archivedAt: new Date().toISOString() } : klass) };
const activeClassIds = new Set(data.classes.filter((klass) => !klass.archivedAt).map((klass) => klass.id));
assert(!activeClassIds.has("bio"), "archive class should remove it from active class set");

const activeTasks = data.tasks.filter((task) => activeClassIds.has(task.classId));
assert(activeTasks.every((task) => task.classId !== "bio"), "archive class should remove its work from active planning scope");

data = { ...data, tasks: data.tasks.filter((task) => task.id !== "manual-a-copy") };
assert(!data.tasks.some((task) => task.id === "manual-a-copy"), "delete assignment should remove that task only");

const repairedImport: ImportBatch = {
  id: "import-repair",
  sourceName: "Terrible PDF",
  sourceText: "OCR missed dates",
  createdAt: new Date().toISOString(),
  status: "review",
  candidates: [
    { id: "row-1", kind: "task", title: "Imported paper", meta: "Awaiting Date", classId: "chem", confidence: 0.58, approved: true, payload: taskItem("imported-paper", "chem", "Imported paper", isoFromOffset(0), true) },
  ],
};
assert(repairedImport.candidates[0].confidence < 0.75, "weak import recovery should preserve low confidence");
assert((repairedImport.candidates[0].payload as TaskItem).missing === true, "import review edits should support Awaiting Date");
assert(repairedImport.status === "review", "pending import persistence should keep review drafts unapplied");

const dateChangedCandidate = { id: "row-date", kind: "task" as const, title: "Lab report revised", meta: "Changed date", classId: "chem", confidence: 0.9, approved: true, reconciliationChoice: "update" as const, payload: { ...manualAssignment, id: "import-lab", title: "Lab report revised", classId: "chem", dueDate: isoFromOffset(8) } };
const match = findImportMatch(data, dateChangedCandidate);
assert(match?.kind === "task", "duplicate detection should find likely existing assignment");
assert(match?.oldDate !== match?.newDate, "date change reconciliation should expose old and new dates");
data = applyImportUpdateToData(data, dateChangedCandidate, match!);
assert(data.tasks.find((task) => task.id === "manual-a")?.dueDate === isoFromOffset(8), "date change reconciliation should update selected existing assignment");

const activeClasses = data.classes.filter((klass) => !klass.archivedAt);
const activeData = { ...data, classes: activeClasses, tasks: activeTasks, exams: data.exams.filter((exam) => activeClassIds.has(exam.classId)) };

const dashboard = buildDashboardSnapshot(activeData);
assert(dashboard.generatedAt.length > 0, "dashboard should rebuild after ownership edits");

const semester = buildSemesterSnapshot(activeData);
assert(semester.classPulses.every((pulse) => pulse.classId !== "bio"), "archived classes should not drive active class pulses");

const widgetCompatibleItems = activeTasks.map((task) => ({ id: task.id, title: task.title, classId: task.classId, dueDate: task.dueDate }));
assert(widgetCompatibleItems.every((item) => item.id && item.title && activeClassIds.has(item.classId)), "widget compatibility should survive manual ownership data");

const storageSource = readFileSync("src/storage.ts", "utf8");
assert(["recurringId", "recurrenceIndex", "recurrenceEndDate", "userEditedAt"].every((field) => storageSource.includes(field)), "storage normalization should preserve recurrence/edit metadata");
assert(["normalizeExam", "effortMinutes", "priority", "notes"].every((field) => storageSource.includes(field)), "storage normalization should preserve assessment ownership metadata");

const appSource = readFileSync("App.tsx", "utf8");
assert(appSource.includes(": activeSemesterData(persistedSnapshot);"), "automatic native widget sync should filter archived semester data");
assert(appSource.includes("dueDate: dateText,"), "blank-date recurring creation should retain generated weekly dates behind the missing-date flag");
assert(appSource.includes("buildStudyPlan({ ...d, tasks: [currentTask] })"), "Task Detail should schedule its selected task even outside the planner's global top-twelve window");

const widgetAssessmentItems = activeData.exams.map((exam) => ({ id: exam.id, title: exam.title, classId: exam.classId, dueDate: exam.dueDate }));
assert(widgetAssessmentItems.some((item) => item.id === "chem-final" && activeClassIds.has(item.classId)), "native widgets should be able to show assessments as due items");

console.log("Semester ownership cycle checks passed", {
  activeClasses: activeClassIds.size,
  activeTasks: activeTasks.length,
  weakImportRows: repairedImport.candidates.length,
});
