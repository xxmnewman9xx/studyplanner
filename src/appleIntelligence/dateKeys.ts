// DST-safe calendar helpers over local "YYYY-MM-DD" date keys.
// Day arithmetic is done on UTC calendar fields (Date.UTC with day overflow),
// never by adding milliseconds to a local timestamp.

import { dateKey } from "../intelligence";
import { isValidDateInput } from "../logic/planner";

export { dateKey, isValidDateInput };

export function parseKey(key: string): { y: number; m: number; d: number } | null {
  if (typeof key !== "string" || !isValidDateInput(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

function keyFromUtc(date: Date) {
  const y = String(date.getUTCFullYear()).padStart(4, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysKey(key: string, days: number) {
  const parts = parseKey(key);
  if (!parts) return key;
  return keyFromUtc(new Date(Date.UTC(parts.y, parts.m - 1, parts.d + Math.trunc(days))));
}

/** 0 = Sunday … 6 = Saturday, independent of the device time zone. */
export function weekdayOfKey(key: string) {
  const parts = parseKey(key);
  if (!parts) return 0;
  return new Date(Date.UTC(parts.y, parts.m - 1, parts.d)).getUTCDay();
}

/** Whole calendar days from `from` to `to` (positive when `to` is later). */
export function diffDaysKey(from: string, to: string) {
  const a = parseKey(from);
  const b = parseKey(to);
  if (!a || !b) return 0;
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
}

export function weekStartKey(key: string, weekStartsOn: 0 | 1) {
  const offset = (weekdayOfKey(key) - weekStartsOn + 7) % 7;
  return addDaysKey(key, -offset);
}

/** Local noon Date for a key (safe for display and for the existing Date-based helpers). */
export function noonFromKey(key: string) {
  const parts = parseKey(key);
  if (!parts) return null;
  return new Date(parts.y, parts.m - 1, parts.d, 12, 0, 0, 0);
}
