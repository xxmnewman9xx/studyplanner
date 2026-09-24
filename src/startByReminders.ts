// Crunch Forecast start-by reminders (F1, Plus). Deterministic: each red week's
// back-scheduled start date becomes one local notification at 5 PM that day,
// at most one per day and at most four upcoming. No inference, no server.

import { buildCrunchForecast } from "./crunchForecast";
import type { AppData, NotificationPlan } from "./types";

export const MAX_START_BY_REMINDERS = 4;
const START_BY_HOUR = 17;

type PlanItem = NotificationPlan["items"][number];

function noonFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function hoursLabel(minutes: number) {
  if (minutes < 60) return `${Math.max(15, Math.round(minutes / 5) * 5)} min`;
  const hours = Math.round((minutes / 60) * 2) / 2;
  return `${hours} h`;
}

export function startByNotificationItems(data: AppData, now = new Date()): PlanItem[] {
  const forecast = buildCrunchForecast(data, now);
  const usedDays = new Set<string>();
  const items: PlanItem[] = [];
  for (const entry of forecast.startBy) {
    if (items.length >= MAX_START_BY_REMINDERS) break;
    if (!entry.classId || usedDays.has(entry.startDate)) continue;
    const day = noonFromKey(entry.startDate);
    if (!day) continue;
    day.setHours(START_BY_HOUR, 0, 0, 0);
    if (day.getTime() <= now.getTime()) continue;
    usedDays.add(entry.startDate);
    const code = entry.classCode || data.classes.find((klass) => klass.id === entry.classId)?.code || "";
    const week = noonFromKey(entry.weekStart);
    const weekLabel = week ? week.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : entry.weekStart;
    items.push({
      stableId: `startby:${entry.classId}:${entry.weekStart}:${entry.startDate}`,
      kind: "Study",
      title: `Start ${code} today`.trim(),
      body: `${hoursLabel(entry.prepMinutes)} of prep beats the red week of ${weekLabel}.`,
      classId: entry.classId,
      triggerAt: day.toISOString(),
      explanation: "Crunch Forecast start-by date: prep spread out before a red week.",
      sourceId: entry.reasonItemIds[0] || entry.classId,
    });
  }
  return items;
}
