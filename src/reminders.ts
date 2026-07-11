import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { buildSemesterSnapshot } from "./intelligence";
import {
  cancelNativeNotificationIds,
  ReminderCancellationError,
  type CancelNotification,
  type ReminderCancellationResult,
} from "./reminderCancellation";
import { AppData, ReminderItem } from "./types";

export type ReminderScheduleResult = {
  state: "scheduled" | "denied" | "unavailable" | "error";
  message: string;
  reminders?: ReminderItem[];
  permissionStatus?: string;
  pendingNotifications?: ScheduledNotificationEvidence[];
  scheduledCount?: number;
  failure?: "cancellation_failed" | "scheduling_failed";
};

export type ScheduledNotificationEvidence = {
  identifier: string;
  title?: string | null;
  body?: string | null;
  trigger?: string;
};

export type ReminderScheduleOptions = {
  includeValidationNotification?: boolean;
  validationDelaySeconds?: number;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function permissionState() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return current;
  return Notifications.requestPermissionsAsync();
}

function notificationEvidence(notification: Notifications.NotificationRequest): ScheduledNotificationEvidence {
  return {
    identifier: notification.identifier,
    title: notification.content.title,
    body: notification.content.body,
    trigger: JSON.stringify(notification.trigger),
  };
}

function withoutConfirmedCanceledEvidence(reminders: ReminderItem[], canceledIds: Iterable<string>) {
  const canceled = new Set(canceledIds);
  return reminders.map((reminder) => {
    const notificationIds = reminder.notificationIds || [];
    const scheduledFor = reminder.scheduledFor || [];
    const keptIndexes = notificationIds.map((_identifier, index) => index).filter((index) => !canceled.has(notificationIds[index]));
    return {
      ...reminder,
      notificationIds: keptIndexes.map((index) => notificationIds[index]),
      scheduledFor: keptIndexes.map((index) => scheduledFor[index]).filter((value): value is string => Boolean(value)),
    };
  });
}

function mergeRemainingScheduledEvidence(clearedConfiguredReminders: ReminderItem[], scheduled: ReminderItem[], canceledIds: Iterable<string>) {
  const remainingScheduled = withoutConfirmedCanceledEvidence(scheduled, canceledIds)
    .filter((reminder) => (reminder.notificationIds || []).length > 0);
  const remainingIds = new Set(remainingScheduled.map((reminder) => reminder.id));
  return [...remainingScheduled, ...clearedConfiguredReminders.filter((reminder) => !remainingIds.has(reminder.id))];
}

const cancelScheduledNotification: CancelNotification = (identifier) => Notifications.cancelScheduledNotificationAsync(identifier);

export async function listPendingReminderNotifications(): Promise<ScheduledNotificationEvidence[]> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  return pending.map(notificationEvidence);
}

export async function scheduleLocalReminders(data: AppData, options: ReminderScheduleOptions = {}): Promise<ReminderScheduleResult> {
  if (Platform.OS !== "ios") {
    return { state: "unavailable", message: "Local reminders are available in the iPhone build." };
  }

  const clearedConfiguredReminders = data.reminders.map((reminder) => ({ ...reminder, notificationIds: [], scheduledFor: [] }));
  const newlyScheduledNotificationIds: string[] = [];
  const scheduled: ReminderItem[] = [];
  let existingCancellationStarted = false;
  let existingCancellationCompleted = false;
  try {
    const permission = await permissionState();
    if (!permission.granted) {
      return { state: "denied", permissionStatus: permission.status, message: "Notifications are off. Turn them on in iPhone Settings to receive reminders." };
    }

    const existingIds = data.reminders.flatMap((reminder) => reminder.notificationIds || []);
    existingCancellationStarted = true;
    await cancelReminderNotificationIds(existingIds);
    existingCancellationCompleted = true;

    const now = new Date();
    const plan = buildSemesterSnapshot(data, now).notificationPlan;
    const reminderKey = (reminder: Pick<ReminderItem, "kind" | "classId" | "title">) => `${reminder.kind}|${reminder.classId}|${reminder.title.trim().toLowerCase()}`;
    const configuredById = new Map(data.reminders.map((reminder) => [reminder.id, reminder]));
    const configuredByKey = new Map(data.reminders.map((reminder) => [reminderKey(reminder), reminder]));
    const hasConfiguredReminders = data.reminders.length > 0;
    for (const item of plan.items) {
      const stableReminderId = `r_${item.stableId}`;
      const configured = configuredById.get(stableReminderId) || configuredByKey.get(reminderKey(item));
      if (hasConfiguredReminders && (!configured || !configured.enabled)) continue;
      const triggerDate = new Date(item.triggerAt);
      if (triggerDate.getTime() <= Date.now() + 5000) continue;
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: item.stableId,
        content: {
          title: item.title,
          body: item.body,
          data: { classId: item.classId, sourceId: item.sourceId, kind: item.kind },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
      newlyScheduledNotificationIds.push(notificationId);
      scheduled.push({
        id: configured?.id || stableReminderId,
        kind: item.kind,
        title: item.title,
        classId: item.classId,
        lead: item.explanation,
        enabled: true,
        notificationIds: [notificationId],
        scheduledFor: [triggerDate.toISOString()],
        explanation: item.body,
      });
    }

    if (options.includeValidationNotification) {
      const triggerDate = new Date(Date.now() + Math.max(15, options.validationDelaySeconds || 60) * 1000);
      const validationId = `validation:build42:${triggerDate.getTime()}`;
      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: validationId,
        content: {
          title: "Stay ahead.",
          body: "One block keeps you on track.",
          data: { kind: "Study", validation: true, build: "42" },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
      newlyScheduledNotificationIds.push(notificationId);
      scheduled.unshift({
        id: `r_${validationId}`,
        kind: "Study",
        title: "Stay ahead.",
        classId: data.classes[0]?.id || "validation",
        lead: "One block keeps you on track.",
        enabled: true,
        notificationIds: [notificationId],
        scheduledFor: [triggerDate.toISOString()],
        explanation: "Build 42 notification validation.",
      });
    }

    const pendingNotifications = await listPendingReminderNotifications();
    const scheduledReminderIds = new Set(scheduled.map((reminder) => reminder.id));
    const preservedConfiguredReminders = clearedConfiguredReminders.filter((reminder) => !scheduledReminderIds.has(reminder.id));
    const quietTime = (hour: number) => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" })
      .format(new Date(2000, 0, 1, hour, 0, 0));

    return {
      state: "scheduled",
      permissionStatus: permission.status,
      scheduledCount: scheduled.length,
      pendingNotifications,
      message: `${scheduled.length} reminders scheduled. Quiet hours are ${quietTime(plan.quietHours.startHour)}–${quietTime(plan.quietHours.endHour)}.`,
      reminders: [...scheduled, ...preservedConfiguredReminders],
    };
  } catch (error) {
    if (existingCancellationStarted && !existingCancellationCompleted && error instanceof ReminderCancellationError) {
      const reminders = withoutConfirmedCanceledEvidence(data.reminders, error.canceledIds);
      return {
        state: "error",
        failure: "cancellation_failed",
        message: "Could not remove every existing reminder. Your remaining reminder evidence was kept.",
        reminders,
        scheduledCount: reminders.reduce((count, reminder) => count + (reminder.notificationIds || []).length, 0),
      };
    }

    if (!existingCancellationCompleted) {
      return {
        state: "error",
        failure: "scheduling_failed",
        message: "Could not start reminder scheduling. Try again.",
      };
    }

    try {
      await cancelReminderNotificationIds(newlyScheduledNotificationIds);
    } catch (rollbackError) {
      if (rollbackError instanceof ReminderCancellationError) {
        const reminders = mergeRemainingScheduledEvidence(clearedConfiguredReminders, scheduled, rollbackError.canceledIds);
        return {
          state: "error",
          failure: "cancellation_failed",
          message: "Could not remove every partially scheduled reminder. Remaining reminder evidence was kept.",
          reminders,
          scheduledCount: reminders.reduce((count, reminder) => count + (reminder.notificationIds || []).length, 0),
        };
      }
      return {
        state: "error",
        failure: "cancellation_failed",
        message: "Could not verify reminder cleanup. Existing reminder evidence was kept.",
      };
    }

    return {
      state: "error",
      failure: "scheduling_failed",
      message: "Could not finish scheduling reminders. Try again.",
      reminders: clearedConfiguredReminders,
      scheduledCount: 0,
    };
  }
}

export async function cancelStoredReminders(data: AppData): Promise<ReminderCancellationResult> {
  const ids = data.reminders.flatMap((reminder) => reminder.notificationIds || []);
  return cancelReminderNotificationIds(ids);
}

export async function cancelReminderNotificationIds(
  ids: string[] = [],
  cancelNotification: CancelNotification = cancelScheduledNotification,
): Promise<ReminderCancellationResult> {
  return cancelNativeNotificationIds(ids, cancelNotification);
}
