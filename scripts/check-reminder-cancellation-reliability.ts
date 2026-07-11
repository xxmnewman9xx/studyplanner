import { readFileSync } from "node:fs";
import {
  cancelNativeNotificationIds,
  ReminderCancellationError,
} from "../src/reminderCancellation";
import { reconcileReminderNotificationEvidence } from "../src/reminderCleanup";
import type { ReminderItem } from "../src/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
const calls: string[] = [];
let injectedFailure: ReminderCancellationError | null = null;
try {
  await cancelNativeNotificationIds(["native-a", "native-b", "native-a"], async (identifier) => {
    calls.push(identifier);
    if (identifier === "native-b") throw new Error("injected cancellation rejection");
  });
} catch (error) {
  if (error instanceof ReminderCancellationError) injectedFailure = error;
  else throw error;
}

assert(injectedFailure, "injected native cancellation rejection must be observable");
assert(calls.join(",") === "native-a,native-b", "native cancellation must deduplicate identifiers without hiding failures");
assert(injectedFailure.canceledIds.join(",") === "native-a", "aggregate failure must report identifiers confirmed canceled");
assert(injectedFailure.failedIds.join(",") === "native-b", "aggregate failure must retain identifiers that could not be canceled");

const success = await cancelNativeNotificationIds(["native-c", "native-d"], async () => {});
assert(success.canceledIds.join(",") === "native-c,native-d", "successful cancellation must return exact evidence");

const evidenceFixture: ReminderItem[] = [{
  id: "reminder-evidence",
  kind: "Assignment",
  title: "Evidence",
  classId: "class-a",
  lead: "Tomorrow",
  enabled: true,
  notificationIds: ["native-live", "native-stale"],
  scheduledFor: ["2026-07-11T12:00:00.000Z", "2026-07-12T12:00:00.000Z"],
}];
const reconciledEvidence = reconcileReminderNotificationEvidence(evidenceFixture, ["native-live", "native-unrelated"]);
assert(reconciledEvidence[0].notificationIds?.join(",") === "native-live", "OS evidence reconciliation must remove stale stored notification IDs");
assert(reconciledEvidence[0].scheduledFor?.join(",") === "2026-07-11T12:00:00.000Z", "OS evidence reconciliation must preserve matching schedule alignment");
assert(reconcileReminderNotificationEvidence(evidenceFixture, [])[0].notificationIds?.length === 0, "an empty verified OS schedule must clear scheduled claims");

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const reminderSource = readFileSync(new URL("../src/reminders.ts", import.meta.url), "utf8");
const classHandler = appSource.slice(appSource.indexOf("const archiveClass"), appSource.indexOf("const createWork", appSource.indexOf("const archiveClass")));
const taskHandler = appSource.slice(appSource.indexOf("const deleteTaskWithScope"), appSource.indexOf("const deleteTask =", appSource.indexOf("const deleteTaskWithScope")));
const assessmentHandler = appSource.slice(appSource.indexOf("const deleteAssessment"), appSource.indexOf("return (", appSource.indexOf("const deleteAssessment")));
const profileScreen = appSource.slice(appSource.indexOf("function Profile"), appSource.indexOf("function Reminders"));
const remindersScreen = appSource.slice(appSource.indexOf("function Reminders"), appSource.indexOf("function HomePreview", appSource.indexOf("function Reminders")));

for (const [label, source] of [
  ["class", classHandler],
  ["task", taskHandler],
  ["assessment", assessmentHandler],
] as const) {
  assert(source.includes("await cancelReminderNotificationIds"), `${label} deletion must await native cancellation`);
  assert(source.includes("showReminderCancellationFailure();") && source.includes("return;"), `${label} deletion must stop and explain a cancellation failure`);
  assert(source.indexOf("await cancelReminderNotificationIds") < source.indexOf("mutate((d)"), `${label} deletion must not mutate before cancellation succeeds`);
}

assert(!classHandler.includes("cancelReminderNotificationIds(data.reminders.filter((reminder) => reminder.classId === c.id).flatMap((reminder) => reminder.notificationIds || [])).catch"), "class archive/delete must not swallow native cancellation failure");
assert(remindersScreen.includes("await cancelReminderNotificationIds(notificationIds)") && remindersScreen.includes("showReminderCancellationFailure();"), "reminder switch must await cancellation and surface failure");
assert(remindersScreen.indexOf("await cancelReminderNotificationIds(notificationIds)") < remindersScreen.indexOf("enabled: false"), "reminder switch must not claim Off before cancellation succeeds");
assert(remindersScreen.includes("const appearsEnabled = r.enabled || hasNativeEvidence"), "reminder UI must not label retained native evidence as Off");
assert(remindersScreen.includes("listPendingReminderNotifications()"), "reminder UI must verify native evidence against the current iPhone schedule");
assert(remindersScreen.includes("reconcileReminderNotificationEvidence"), "reminder UI must reconcile stale stored IDs after successful verification");
assert(remindersScreen.includes("const hasNativeEvidence = verifiedIdsFor(r).length > 0"), "Scheduled labels must require verified OS identifiers");
assert(!remindersScreen.includes("const hasNativeEvidence = (r.notificationIds || []).length > 0"), "stored notification IDs alone must never claim Scheduled");
assert(remindersScreen.includes('textFor("reminders.verify_failed"'), "failed native verification must surface a fail-closed status");
assert(profileScreen.includes('textFor("reminders.configured_count"'), "Profile must call reminder rows configured rather than active");
assert(remindersScreen.includes('<Section title={textFor("reminders.title", "Reminders")}'), "reminder list heading must remain neutral until native evidence is verified");
assert(remindersScreen.includes('result.failure === "cancellation_failed"'), "schedule UI must surface cancellation-specific failure");
assert(remindersScreen.includes("const archivedRows = d.reminders.filter((reminder) => !activeClassIds.has(reminder.classId));"), "schedule refresh must preserve untouched archived reminder evidence");
assert(!remindersScreen.includes("let addedCount"), "smart suggestions must not communicate through a React state-updater side effect");
assert(remindersScreen.includes('textFor("reminders.suggested_status"') && remindersScreen.includes("{ count: additions.length }"), "smart suggestion status must report the actual computed count");
assert(remindersScreen.includes("onPress={scheduling || scheduleContextCount === 0 ? undefined : () => { schedule()"), "Schedule button must disable at zero planned reminders and must not pass a press event as the validation flag");

assert(reminderSource.includes("cancelNativeNotificationIds(ids, cancelNotification)"), "production cancellation wrapper must use aggregated native results");
assert(!reminderSource.includes("cancelScheduledNotificationAsync(id).catch(() => {})"), "native cancellation failures must never be swallowed");
assert(reminderSource.includes('failure: "cancellation_failed"'), "schedule result must distinguish cancellation failure");
assert(reminderSource.includes("withoutConfirmedCanceledEvidence(data.reminders, error.canceledIds)"), "old-schedule cancellation failure must retain IDs that were not confirmed canceled");
assert(reminderSource.includes("mergeRemainingScheduledEvidence"), "partial scheduling rollback must retain evidence for alerts that could not be removed");

console.log("Reminder cancellation reliability checks passed", {
  injectedCanceled: injectedFailure.canceledIds,
  injectedFailed: injectedFailure.failedIds,
  successfulCanceled: success.canceledIds.length,
});
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
