import type { ExamItem, ReminderItem, StudyBlock, TaskItem } from "./types";

type DeletedEntityIds = {
  taskIds?: Iterable<string>;
  examIds?: Iterable<string>;
};

export type ReminderDeletionCleanup = {
  reminders: ReminderItem[];
  removedReminderIds: string[];
  notificationIdsToCancel: string[];
};

function normalizedReminderIdentifier(identifier: string) {
  return identifier.startsWith("r_") ? identifier.slice(2) : identifier;
}

function identifierReferencesEntity(identifier: string, kind: "task" | "exam", entityId: string) {
  const normalized = normalizedReminderIdentifier(identifier);
  const stablePrefix = `${kind}:${entityId}`;
  return normalized === stablePrefix || normalized.startsWith(`${stablePrefix}:`);
}

function reminderReferencesDeletedEntity(reminder: ReminderItem, deleted: Required<DeletedEntityIds>) {
  const identifiers = [reminder.id, ...(reminder.notificationIds || [])];
  return identifiers.some((identifier) =>
    [...deleted.taskIds].some((taskId) => identifierReferencesEntity(identifier, "task", taskId))
    || [...deleted.examIds].some((examId) => identifierReferencesEntity(identifier, "exam", examId))
  );
}

export function cleanupRemindersForDeletedEntities(reminders: ReminderItem[], deleted: DeletedEntityIds): ReminderDeletionCleanup {
  const deletedIds = {
    taskIds: new Set(deleted.taskIds || []),
    examIds: new Set(deleted.examIds || []),
  };
  const removed = reminders.filter((reminder) => reminderReferencesDeletedEntity(reminder, deletedIds));
  const removedIds = new Set(removed.map((reminder) => reminder.id));

  return {
    reminders: reminders.filter((reminder) => !removedIds.has(reminder.id)),
    removedReminderIds: [...removedIds],
    notificationIdsToCancel: [...new Set(removed.flatMap((reminder) => reminder.notificationIds || []).filter(Boolean))],
  };
}

export function reconcileReminderNotificationEvidence(reminders: ReminderItem[], pendingNotificationIds: Iterable<string>) {
  const pending = new Set(pendingNotificationIds);
  return reminders.map((reminder) => {
    const notificationIds = reminder.notificationIds || [];
    const scheduledFor = reminder.scheduledFor || [];
    const keptIndexes = notificationIds.map((_identifier, index) => index).filter((index) => pending.has(notificationIds[index]));
    return {
      ...reminder,
      notificationIds: keptIndexes.map((index) => notificationIds[index]),
      scheduledFor: keptIndexes.map((index) => scheduledFor[index]).filter((value): value is string => Boolean(value)),
    };
  });
}

export function pruneOrphanedStudyBlocks(studyBlocks: StudyBlock[], tasks: TaskItem[], exams: ExamItem[]) {
  const taskIds = new Set(tasks.map((task) => task.id));
  const examIds = new Set(exams.map((exam) => exam.id));
  return studyBlocks.filter((block) =>
    (!block.taskId || taskIds.has(block.taskId))
    && (!block.examId || examIds.has(block.examId))
  );
}
