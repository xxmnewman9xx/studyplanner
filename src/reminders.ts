import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { buildSemesterSnapshot } from "./intelligence";
import { AppData, ReminderItem } from "./types";

export type ReminderScheduleResult = {
  state: "scheduled" | "denied" | "unavailable" | "error";
  message: string;
  reminders?: ReminderItem[];
  permissionStatus?: string;
  pendingNotifications?: ScheduledNotificationEvidence[];
  scheduledCount?: number;
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

export async function listPendingReminderNotifications(): Promise<ScheduledNotificationEvidence[]> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  return pending.map(notificationEvidence);
}

export async function scheduleLocalReminders(data: AppData, options: ReminderScheduleOptions = {}): Promise<ReminderScheduleResult> {
  if (Platform.OS !== "ios") {
    return { state: "unavailable", message: "Local reminders are available in the iPhone build." };
  }

  try {
    const permission = await permissionState();
    if (!permission.granted) {
      return { state: "denied", permissionStatus: permission.status, message: "Notifications are off. Turn them on in iPhone Settings to receive reminders." };
    }

    const existingIds = data.reminders.flatMap((reminder) => reminder.notificationIds || []);
    await Promise.all(existingIds.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));

    const now = new Date();
    const plan = buildSemesterSnapshot(data, now).notificationPlan;
    const scheduled: ReminderItem[] = [];
    for (const item of plan.items) {
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
      scheduled.push({
        id: `r_${item.stableId}`,
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
    const pendingSuffix = pendingNotifications.length ? ` Pending: ${pendingNotifications.length}.` : "";

    return {
      state: "scheduled",
      permissionStatus: permission.status,
      scheduledCount: scheduled.length,
      pendingNotifications,
      message: `${scheduled.length} reminders scheduled.${pendingSuffix} Quiet hours are ${plan.quietHours.startHour}:00-${plan.quietHours.endHour}:00.`,
      reminders: scheduled,
    };
  } catch (error) {
    return { state: "error", message: error instanceof Error ? error.message : "Could not schedule reminders." };
  }
}

export async function cancelStoredReminders(data: AppData) {
  const ids = data.reminders.flatMap((reminder) => reminder.notificationIds || []);
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}
