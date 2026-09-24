// Pure view-model helpers for the Crunch Forecast UI. Every number shown on a
// forecast surface is derived here from the CrunchForecast object; nothing is
// invented or estimated in the view layer.
import type { CrunchForecast, ForecastColor, ForecastItemRef, ForecastStartBy, ForecastWeek } from "../types";
import { formatMonthShort, formatNumber, monthKey } from "./format";
import type { AIText } from "./theme";
import { CLASS_SWATCHES } from "./tokens";

export type ClassLegendEntry = { key: string; code: string; alias: string; color: string };

export type ClassLegend = {
  byKey: Map<string, ClassLegendEntry>;
  entries: ClassLegendEntry[];
};

export function classKeyOf(ref: { classId?: string; classCode?: string }) {
  return ref.classId || ref.classCode || "";
}

/** Stable class colors + "Class 1/2/3" aliases in order of first appearance in the term. */
export function buildClassLegend(forecast: CrunchForecast, locale: string, t: AIText): ClassLegend {
  const byKey = new Map<string, ClassLegendEntry>();
  const entries: ClassLegendEntry[] = [];
  const add = (ref: { classId?: string; classCode?: string }) => {
    const key = classKeyOf(ref);
    if (!key || byKey.has(key)) return;
    const index = entries.length;
    const entry: ClassLegendEntry = {
      key,
      code: ref.classCode || t("ai.class.unknown", "Class"),
      alias: t("ai.class.alias", "Class {number}", { number: formatNumber(locale, index + 1) }),
      color: CLASS_SWATCHES[index % CLASS_SWATCHES.length],
    };
    byKey.set(key, entry);
    entries.push(entry);
  };
  forecast.weeks.forEach((week) => week.items.forEach(add));
  forecast.startBy.forEach(add);
  return { byKey, entries };
}

export function classLabel(legend: ClassLegend, ref: { classId?: string; classCode?: string }, hideNames: boolean, t: AIText) {
  const entry = legend.byKey.get(classKeyOf(ref));
  if (!entry) return ref.classCode && !hideNames ? ref.classCode : t("ai.class.unknown", "Class");
  return hideNames ? entry.alias : entry.code;
}

export function classColor(legend: ClassLegend, ref: { classId?: string; classCode?: string }, fallback: string) {
  return legend.byKey.get(classKeyOf(ref))?.color || fallback;
}

export function weekCounts(week: ForecastWeek) {
  let exams = 0;
  let tasks = 0;
  for (const item of week.items) {
    if (item.kind === "exam") exams += 1;
    else tasks += 1;
  }
  return { exams, tasks, total: exams + tasks };
}

export function levelLabel(t: AIText, level: ForecastColor) {
  switch (level) {
    case "crunch":
      return t("ai.level.crunch", "crunch");
    case "busy":
      return t("ai.level.busy", "busy");
    case "steady":
      return t("ai.level.steady", "steady");
    default:
      return t("ai.level.calm", "calm");
  }
}

/** "3 exams, 2 assignments" / "1 exam" / "nothing due". */
export function countsPhrase(t: AIText, locale: string, counts: { exams: number; tasks: number }) {
  const parts: string[] = [];
  if (counts.exams === 1) parts.push(t("ai.count.exams_one", "1 exam"));
  else if (counts.exams > 1) parts.push(t("ai.count.exams_other", "{count} exams", { count: formatNumber(locale, counts.exams) }));
  if (counts.tasks === 1) parts.push(t("ai.count.tasks_one", "1 assignment"));
  else if (counts.tasks > 1) parts.push(t("ai.count.tasks_other", "{count} assignments", { count: formatNumber(locale, counts.tasks) }));
  if (!parts.length) return t("ai.count.nothing", "nothing due");
  return parts.join(t("ai.count.separator", ", "));
}

export type MonthRow = { key: string; label: string; weeks: ForecastWeek[] };

/** Weeks grouped into one row per calendar month of their weekStart. */
export function monthRows(forecast: CrunchForecast, locale: string): MonthRow[] {
  const rows: MonthRow[] = [];
  for (const week of forecast.weeks) {
    const key = monthKey(week.weekStart);
    const last = rows[rows.length - 1];
    if (last && last.key === key) last.weeks.push(week);
    else rows.push({ key, label: formatMonthShort(locale, week.weekStart), weeks: [week] });
  }
  return rows;
}

export function currentWeekIndex(forecast: CrunchForecast) {
  const index = forecast.weeks.findIndex((week) => week.isCurrent);
  if (index >= 0) return index;
  // Before the term starts every week is ahead; after it ends none is.
  if (forecast.generatedFor < forecast.termStart) return 0;
  if (forecast.generatedFor > forecast.termEnd) return forecast.weeks.length;
  return forecast.weeks.findIndex((week) => week.weekStart >= forecast.generatedFor);
}

/** Crunch weeks at or after the current week. */
export function crunchWeeksAhead(forecast: CrunchForecast): ForecastWeek[] {
  const from = Math.max(0, currentWeekIndex(forecast));
  return forecast.weeks.slice(from).filter((week) => week.color === "crunch");
}

/** The heaviest crunch weeks (by loadScore), in calendar order. */
export function topCrunchWeeks(forecast: CrunchForecast, limit: number): ForecastWeek[] {
  return forecast.weeks
    .filter((week) => week.color === "crunch")
    .sort((a, b) => b.loadScore - a.loadScore)
    .slice(0, limit)
    .sort((a, b) => a.weekIndex - b.weekIndex);
}

/** Default selection: next crunch week, else current week, else the first week. */
export function defaultSelectedWeek(forecast: CrunchForecast): string | null {
  const ahead = crunchWeeksAhead(forecast)[0];
  if (ahead) return ahead.weekStart;
  const current = forecast.weeks.find((week) => week.isCurrent);
  return current?.weekStart || forecast.weeks[0]?.weekStart || null;
}

/** Earliest start-by date, or the term start when there are none. */
export function firstStartDate(forecast: CrunchForecast): string {
  const dates = forecast.startBy.map((entry) => entry.startDate).sort();
  return dates[0] || forecast.termStart;
}

export function sortedStartBy(forecast: CrunchForecast): ForecastStartBy[] {
  return forecast.startBy.slice().sort((a, b) => (a.startDate === b.startDate ? b.prepMinutes - a.prepMinutes : a.startDate < b.startDate ? -1 : 1));
}

export function sortItems(items: ForecastItemRef[]): ForecastItemRef[] {
  return items.slice().sort((a, b) => (a.dueDate === b.dueDate ? (b.weight || 0) - (a.weight || 0) : a.dueDate < b.dueDate ? -1 : 1));
}

export function isEmptyForecast(forecast: CrunchForecast | null | undefined): boolean {
  return !forecast || forecast.weeks.length === 0 || forecast.totals.items === 0;
}
