import { readFileSync } from "node:fs";
import { cleanupRemindersForDeletedEntities, pruneOrphanedStudyBlocks } from "../src/reminderCleanup";
import { deleteTaskRecurrence } from "../src/ownership/semesterOwnership";
import type { ExamItem, ReminderItem, StudyBlock, TaskItem } from "../src/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function task(id: string, recurrenceIndex?: number): TaskItem {
  return {
    id,
    title: `Recurring task ${id}`,
    classId: "class-1",
    type: "Assignment",
    dueOffset: recurrenceIndex || 0,
    dueDate: `2026-08-${String(10 + (recurrenceIndex || 0)).padStart(2, "0")}`,
    time: "11:59 PM",
    estimateMinutes: 45,
    done: false,
    urgent: false,
    source: "test",
    subtasks: [],
    recurringId: recurrenceIndex === undefined ? undefined : "weekly-1",
    recurrenceIndex,
  };
}

function exam(id: string): ExamItem {
  return {
    id,
    classId: "class-1",
    title: `Exam ${id}`,
    dueOffset: 4,
    dueDate: "2026-08-20",
    time: "9:00 AM",
    room: "Room 1",
    topics: [],
  };
}

const recurringTasks = [task("task-0", 0), task("task-1", 1), task("task-2", 2)];
const unrelatedTask = task("task-other");
const exams = [exam("exam-1"), exam("exam-other")];
const reminders: ReminderItem[] = [
  { id: "r_task:task-0:2026-08-10", kind: "Assignment", title: "First", classId: "class-1", lead: "2 hours", enabled: true, notificationIds: ["task:task-0:2026-08-10"] },
  { id: "r_task:task-1:2026-08-11", kind: "Assignment", title: "Second", classId: "class-1", lead: "2 hours", enabled: true, notificationIds: ["task:task-1:2026-08-11", "shared-native-id"] },
  { id: "r_task:task-2:2026-08-12", kind: "Assignment", title: "Third", classId: "class-1", lead: "2 hours", enabled: true, notificationIds: ["task:task-2:2026-08-12", "shared-native-id"] },
  { id: "legacy-exam-row", kind: "Exam", title: "Exam", classId: "class-1", lead: "1 day", enabled: true, notificationIds: ["exam:exam-1:2026-08-20"] },
  { id: "r_exam:exam-other:2026-08-20", kind: "Exam", title: "Other exam", classId: "class-1", lead: "1 day", enabled: true, notificationIds: ["exam:exam-other:2026-08-20"] },
  { id: "r_class:class-1:2026-08-10", kind: "Class", title: "Class", classId: "class-1", lead: "15 min", enabled: true, notificationIds: ["class:class-1:2026-08-10"] },
];
const blocks: StudyBlock[] = [
  { id: "task-0-block", day: "Monday", time: "9:00 AM", taskId: "task-0", classId: "class-1", title: "First", minutes: 30, reason: "Test", completed: false },
  { id: "task-1-block", day: "Tuesday", time: "9:00 AM", taskId: "task-1", classId: "class-1", title: "Second", minutes: 30, reason: "Test", completed: false },
  { id: "task-2-block", day: "Wednesday", time: "9:00 AM", taskId: "task-2", classId: "class-1", title: "Third", minutes: 30, reason: "Test", completed: false },
  { id: "exam-block", day: "Thursday", time: "9:00 AM", examId: "exam-1", classId: "class-1", title: "Exam", minutes: 30, reason: "Test", completed: false },
  { id: "unlinked-block", day: "Friday", time: "9:00 AM", classId: "class-1", title: "General study", minutes: 30, reason: "Test", completed: false },
];

const singleTasks = deleteTaskRecurrence([...recurringTasks, unrelatedTask], recurringTasks[0], "single");
const singleCleanup = cleanupRemindersForDeletedEntities(reminders, { taskIds: ["task-0"] });
assert(singleTasks.some((item) => item.id === "task-1") && singleTasks.some((item) => item.id === "task-2"), "single scope must preserve later recurrence instances");
assert(!singleCleanup.reminders.some((item) => item.id.includes("task-0")), "single scope must remove only the deleted task reminder");
assert(singleCleanup.notificationIdsToCancel.join(",") === "task:task-0:2026-08-10", "single scope must expose its exact native notification ID for cancellation");

const futureTasks = deleteTaskRecurrence([...recurringTasks, unrelatedTask], recurringTasks[1], "future");
const futureIds = recurringTasks.filter((item) => !futureTasks.some((remaining) => remaining.id === item.id)).map((item) => item.id);
const futureCleanup = cleanupRemindersForDeletedEntities(reminders, { taskIds: futureIds });
const futureBlocks = pruneOrphanedStudyBlocks(blocks, futureTasks, exams);
assert(futureIds.join(",") === "task-1,task-2", "future scope must identify the anchor and all later recurrences");
assert(futureCleanup.removedReminderIds.length === 2, "future scope must remove every deleted recurrence reminder");
assert(futureCleanup.notificationIdsToCancel.filter((id) => id === "shared-native-id").length === 1, "notification cancellation evidence must be deduplicated");
assert(!futureBlocks.some((block) => block.taskId === "task-1" || block.taskId === "task-2"), "future scope must remove orphaned recurring-task study blocks");
assert(futureBlocks.some((block) => block.taskId === "task-0") && futureBlocks.some((block) => block.examId === "exam-1"), "future scope must preserve valid task and exam blocks");

const examCleanup = cleanupRemindersForDeletedEntities(reminders, { examIds: ["exam-1"] });
const examBlocks = pruneOrphanedStudyBlocks(blocks, [...recurringTasks, unrelatedTask], exams.filter((item) => item.id !== "exam-1"));
assert(examCleanup.removedReminderIds.join(",") === "legacy-exam-row", "exam cleanup must also find associations stored only in native notification IDs");
assert(examCleanup.notificationIdsToCancel.join(",") === "exam:exam-1:2026-08-20", "exam cleanup must expose the exact native notification ID");
assert(!examBlocks.some((block) => block.examId === "exam-1"), "exam cleanup must remove orphaned exam study blocks");
assert(examBlocks.some((block) => block.id === "unlinked-block"), "cleanup must preserve study blocks without task or exam references");

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const classHandler = appSource.slice(appSource.indexOf("const deleteClass"), appSource.indexOf("const createWork", appSource.indexOf("const deleteClass")));
const taskHandler = appSource.slice(appSource.indexOf("const deleteTaskWithScope"), appSource.indexOf("const deleteTask =", appSource.indexOf("const deleteTaskWithScope")));
const assessmentHandler = appSource.slice(appSource.indexOf("const deleteAssessment"), appSource.indexOf("return (", appSource.indexOf("const deleteAssessment")));
assert(classHandler.includes("await cancelReminderNotificationIds(data.reminders.filter((reminder) => reminder.classId === c.id)"), "class deletion must preserve native reminder cancellation");
assert(taskHandler.includes("await cancelReminderNotificationIds(cancellationEvidence.notificationIdsToCancel)"), "task deletion must await native cancellation evidence");
assert(taskHandler.indexOf("await cancelReminderNotificationIds") < taskHandler.indexOf("mutate((d)"), "task deletion must cancel notifications before removing persisted records");
assert(taskHandler.includes("reminders: reminderCleanup.reminders") && taskHandler.includes("pruneOrphanedStudyBlocks"), "task deletion must persist reminder and study-block cleanup");
assert(assessmentHandler.includes("await cancelReminderNotificationIds(cancellationEvidence.notificationIdsToCancel)"), "assessment deletion must await native cancellation evidence");
assert(assessmentHandler.indexOf("await cancelReminderNotificationIds") < assessmentHandler.indexOf("mutate((d)"), "assessment deletion must cancel notifications before removing persisted records");
assert(assessmentHandler.includes("reminders: reminderCleanup.reminders") && assessmentHandler.includes("pruneOrphanedStudyBlocks"), "assessment deletion must persist reminder and study-block cleanup");

console.log("Notification deletion cleanup checks passed", {
  singleCanceled: singleCleanup.notificationIdsToCancel.length,
  futureCanceled: futureCleanup.notificationIdsToCancel.length,
  examCanceled: examCleanup.notificationIdsToCancel.length,
});
