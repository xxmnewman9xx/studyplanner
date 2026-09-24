// Locale-aware formatting for the 2.2 components. Every month/weekday name
// comes from Intl.DateTimeFormat; nothing is hand-built.
import type { AIText } from "./theme";

const DAY_MS = 86_400_000;
const RTL_LANGUAGES = new Set(["ar", "fa", "he", "iw", "ur", "ps", "yi"]);

export function isRTLLocale(locale: string) {
  return RTL_LANGUAGES.has(locale.split(/[-_]/)[0].toLowerCase());
}

/** Yoga/CSS `direction` for a component root. */
export function directionFor(locale: string): "ltr" | "rtl" {
  return isRTLLocale(locale) ? "rtl" : "ltr";
}

/** Parse "YYYY-MM-DD" (or a full ISO string) at local noon so DST/timezones never shift the day. */
export function parseISODate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return new Date(Number.NaN);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysISO(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function daysBetweenISO(fromIso: string, toIso: string): number {
  return Math.round((parseISODate(toIso).getTime() - parseISODate(fromIso).getTime()) / DAY_MS);
}

const dateFormatCache = new Map<string, Intl.DateTimeFormat>();
const numberFormatCache = new Map<string, Intl.NumberFormat>();

function dateFormatter(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = dateFormatCache.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat(locale, options);
    } catch {
      formatter = new Intl.DateTimeFormat("en-US", options);
    }
    dateFormatCache.set(key, formatter);
  }
  return formatter;
}

function numberFormatter(locale: string, options: Intl.NumberFormatOptions = {}) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = numberFormatCache.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(locale, options);
    } catch {
      formatter = new Intl.NumberFormat("en-US", options);
    }
    numberFormatCache.set(key, formatter);
  }
  return formatter;
}

function formatISO(locale: string, iso: string, options: Intl.DateTimeFormatOptions) {
  const date = parseISODate(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateFormatter(locale, options).format(date);
}

/** "Oct 12" */
export function formatMonthDay(locale: string, iso: string) {
  return formatISO(locale, iso, { month: "short", day: "numeric" });
}

/** "Thu, Oct 15" */
export function formatWeekdayMonthDay(locale: string, iso: string) {
  return formatISO(locale, iso, { weekday: "short", month: "short", day: "numeric" });
}

/** "Thursday, October 15" (VoiceOver labels). */
export function formatLongDate(locale: string, iso: string) {
  return formatISO(locale, iso, { weekday: "long", month: "long", day: "numeric" });
}

/** "Oct" */
export function formatMonthShort(locale: string, iso: string) {
  return formatISO(locale, iso, { month: "short" });
}

/** "October" */
export function formatMonthLong(locale: string, iso: string) {
  return formatISO(locale, iso, { month: "long" });
}

/** "12" */
export function formatDayNumber(locale: string, iso: string) {
  return formatISO(locale, iso, { day: "numeric" });
}

/** "Wed" */
export function formatWeekdayShort(locale: string, iso: string) {
  return formatISO(locale, iso, { weekday: "short" });
}

/** Month key for grouping ("2026-10"). */
export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function formatNumber(locale: string, value: number) {
  return numberFormatter(locale).format(value);
}

/** Weight percent (0..100) -> "20%" in the locale's format. */
export function formatPercent(locale: string, percent: number) {
  return numberFormatter(locale, { style: "percent", maximumFractionDigits: 1 }).format(percent / 100);
}

/** 25 -> "25 min", 240 -> "4 h", 90 -> "1 h 30 min" (units localized through `t`). */
export function formatDuration(t: AIText, locale: string, minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) return t("ai.format.minutes", "{count} min", { count: formatNumber(locale, rest) });
  if (rest === 0) return t("ai.format.hours", "{count} h", { count: formatNumber(locale, hours) });
  return t("ai.format.hours_minutes", "{hours} h {minutes} min", { hours: formatNumber(locale, hours), minutes: formatNumber(locale, rest) });
}
