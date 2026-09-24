// Crunch Forecast (F1): a term-wide weekly load heatmap with back-scheduled
// "start by" dates. Deterministic and inference-free; pure TypeScript.
//
// All calendar math runs on local "YYYY-MM-DD" keys through the DST-safe
// helpers in appleIntelligence/dateKeys.ts (no millisecond day arithmetic).

import {
  CrunchForecast,
  ForecastColor,
  ForecastItemRef,
  ForecastStartBy,
  ForecastWeek,
} from "./appleIntelligence/types";
import { addDaysKey, diffDaysKey, isValidDateInput, weekStartKey } from "./appleIntelligence/dateKeys";
import { dailyCapFor, dateKey } from "./intelligence";
import { activeSemesterData } from "./ownership/semesterOwnership";
import { AppData, ExamItem, ImportBatch } from "./types";

export type ExamPrepKind = NonNullable<ExamItem["kind"]>;

/** Default prep minutes when an exam has no effortMinutes. */
export const DEFAULT_EXAM_PREP: Record<ExamPrepKind, number> = {
  Final: 360,
  Midterm: 300,
  Exam: 240,
  Quiz: 90,
  Project: 240,
  Presentation: 150,
};
export const DEFAULT_TASK_MINUTES = 60;
/** weight% → load multiplier 1 + weight/40, capped at 2.5 (weights ≥ 60%). */
export const MAX_WEIGHT_MULTIPLIER = 2.5;
/** Share of the daily cap one class may claim per day when back-scheduling prep. */
export const START_BY_DAILY_SHARE = 0.6;
/** Items outside today − 200 d … today + 400 d are ignored (stale or typo dates). */
const TERM_PAST_DAYS = 200;
const TERM_FUTURE_DAYS = 400;

export type ForecastStartByMarked = ForecastStartBy & {
  /** True when the ideal start date was before today and was clamped to today. */
  clampedToToday: boolean;
  /** Prep minutes that could not be placed before the deadline (0 when fully placed). */
  shortfallMinutes: number;
};

export type CrunchForecastResult = Omit<CrunchForecast, "startBy"> & { startBy: ForecastStartByMarked[]; weeklyCapacity: number };

export type CrunchForecastOptions = { pending?: ImportBatch | null; weekStartsOn?: 0 | 1 };

type ForecastItem = ForecastItemRef & { load: number; major: boolean };

export function examKindFor(exam: Pick<ExamItem, "kind" | "title">): ExamPrepKind {
  if (exam.kind && exam.kind in DEFAULT_EXAM_PREP) return exam.kind;
  const title = String(exam.title || "").toLowerCase();
  if (/\bfinal\b/.test(title)) return "Final";
  if (/\bmid-?term\b/.test(title)) return "Midterm";
  if (/\bquiz/.test(title)) return "Quiz";
  if (/\bpresentation\b/.test(title)) return "Presentation";
  if (/\bproject\b/.test(title)) return "Project";
  return "Exam";
}

export function weightMultiplier(weight: unknown) {
  if (typeof weight !== "number" || !Number.isFinite(weight) || weight <= 0) return 1;
  return Math.min(MAX_WEIGHT_MULTIPLIER, 1 + Math.min(100, weight) / 40);
}

function positiveMinutes(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.min(2400, Math.round(value)) : fallback;
}

function validWeight(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 ? value : undefined;
}

function collectItems(data: AppData, pending: ImportBatch | null | undefined, today: string) {
  const active = activeSemesterData(data);
  const classCodes = new Map<string, string>(active.classes.map((klass) => [klass.id, klass.code]));
  const lower = addDaysKey(today, -TERM_PAST_DAYS);
  const upper = addDaysKey(today, TERM_FUTURE_DAYS);
  const inTerm = (key: unknown): key is string => typeof key === "string" && isValidDateInput(key) && key >= lower && key <= upper;
  const items: ForecastItem[] = [];
  const keys = new Set<string>();

  const addTask = (task: { id: string; title: string; classId?: string; dueDate: string; estimateMinutes?: number; weight?: number }) => {
    const prepMinutes = positiveMinutes(task.estimateMinutes, DEFAULT_TASK_MINUTES);
    const weight = validWeight(task.weight);
    const ref: ForecastItem = { id: task.id, kind: "task", title: String(task.title || ""), dueDate: task.dueDate, prepMinutes, load: prepMinutes * weightMultiplier(weight), major: false };
    if (task.classId) ref.classId = task.classId;
    if (task.classId && classCodes.has(task.classId)) ref.classCode = classCodes.get(task.classId);
    if (weight !== undefined) ref.weight = weight;
    const key = `task|${task.classId || ""}|${ref.title.toLowerCase()}|${task.dueDate}`;
    if (keys.has(key)) return;
    keys.add(key);
    items.push(ref);
  };
  const addExam = (exam: { id: string; title: string; classId?: string; dueDate: string; effortMinutes?: number; weight?: number; kind?: ExamItem["kind"] }) => {
    const kind = examKindFor(exam);
    const prepMinutes = positiveMinutes(exam.effortMinutes, DEFAULT_EXAM_PREP[kind]);
    const weight = validWeight(exam.weight);
    const ref: ForecastItem = {
      id: exam.id,
      kind: "exam",
      title: String(exam.title || ""),
      dueDate: exam.dueDate,
      prepMinutes,
      load: prepMinutes * weightMultiplier(weight),
      major: kind === "Exam" || kind === "Midterm" || kind === "Final",
    };
    if (exam.classId) ref.classId = exam.classId;
    if (exam.classId && classCodes.has(exam.classId)) ref.classCode = classCodes.get(exam.classId);
    if (weight !== undefined) ref.weight = weight;
    const key = `exam|${exam.classId || ""}|${ref.title.toLowerCase()}|${exam.dueDate}`;
    if (keys.has(key)) return;
    keys.add(key);
    items.push(ref);
  };

  active.tasks.forEach((task) => {
    if (task.done || task.missing || !inTerm(task.dueDate)) return;
    addTask(task);
  });
  active.exams.forEach((exam) => {
    if (typeof exam.score === "number" || !inTerm(exam.dueDate)) return;
    addExam(exam);
  });

  if (pending && Array.isArray(pending.candidates)) {
    pending.candidates.forEach((candidate) => {
      if (candidate.kind !== "class" || candidate.approved === false) return;
      const payload = candidate.payload as { id?: unknown; code?: unknown };
      const id = typeof payload.id === "string" ? payload.id : candidate.classId;
      if (id && typeof payload.code === "string" && !classCodes.has(id)) classCodes.set(id, payload.code);
    });
    pending.candidates.forEach((candidate) => {
      if (candidate.approved === false || (candidate.kind !== "task" && candidate.kind !== "exam")) return;
      const payload = candidate.payload as Record<string, unknown>;
      const dueDate = payload.dueDate;
      if (!inTerm(dueDate) || payload.done === true) return;
      const base = {
        id: String(payload.id || candidate.id),
        title: String(payload.title || candidate.title || ""),
        classId: typeof payload.classId === "string" ? payload.classId : candidate.classId,
        dueDate,
        weight: typeof payload.weight === "number" ? payload.weight : undefined,
      };
      if (candidate.kind === "task") {
        addTask({ ...base, estimateMinutes: typeof payload.estimateMinutes === "number" ? payload.estimateMinutes : undefined });
      } else {
        addExam({ ...base, effortMinutes: typeof payload.effortMinutes === "number" ? payload.effortMinutes : undefined, kind: payload.kind as ExamItem["kind"] });
      }
    });
    // Pending candidates may reference classes that only exist in the batch.
    items.forEach((item) => {
      if (!item.classCode && item.classId && classCodes.has(item.classId)) item.classCode = classCodes.get(item.classId);
    });
  }

  items.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
  return items;
}

function colorFor(load: number, majorExams: number, anyExams: number, capacity: number, isTopWeek: boolean): ForecastColor {
  if (load <= 0) return "calm";
  const absolute = load / capacity;
  if (majorExams >= 2 || absolute > 1) return "crunch";
  if (absolute > 0.6 || (majorExams === 1 && absolute > 0.3) || (isTopWeek && absolute >= 0.5)) return "busy";
  if (absolute >= 0.15 || anyExams > 0) return "steady";
  return "calm";
}

function toRef(item: ForecastItem): ForecastItemRef {
  const ref: ForecastItemRef = { id: item.id, kind: item.kind, title: item.title, dueDate: item.dueDate, prepMinutes: item.prepMinutes };
  if (item.classId) ref.classId = item.classId;
  if (item.classCode) ref.classCode = item.classCode;
  if (item.weight !== undefined) ref.weight = item.weight;
  return ref;
}

export function buildCrunchForecast(data: AppData, now: Date, options: CrunchForecastOptions = {}): CrunchForecastResult {
  const weekStartsOn: 0 | 1 = options.weekStartsOn === 0 ? 0 : 1;
  const today = dateKey(now);
  const dailyCap = dailyCapFor(data.prefs || ({} as AppData["prefs"]));
  const weeklyCapacity = dailyCap * 5;
  const items = collectItems(data, options.pending, today);
  const fromPreview = Boolean(options.pending);

  if (!items.length) {
    return { generatedFor: today, termStart: today, termEnd: today, weeks: [], crunchWeeks: [], startBy: [], totals: { items: 0, exams: 0, tasks: 0, classes: 0 }, fromPreview, weeklyCapacity };
  }

  const termStart = items[0].dueDate;
  const termEnd = items[items.length - 1].dueDate;
  const currentWeek = weekStartKey(today, weekStartsOn);
  const firstWeek = weekStartKey(termStart, weekStartsOn);
  const lastWeek = weekStartKey(termEnd, weekStartsOn);

  const buckets = new Map<string, ForecastItem[]>();
  for (let week = firstWeek; week <= lastWeek; week = addDaysKey(week, 7)) buckets.set(week, []);
  items.forEach((item) => buckets.get(weekStartKey(item.dueDate, weekStartsOn))?.push(item));

  const loads = Array.from(buckets.values()).map((bucket) => bucket.reduce((sum, item) => sum + item.load, 0));
  const maxLoad = Math.max(0, ...loads);
  const topLoads = loads.filter((load) => load > 0).sort((a, b) => b - a).slice(0, 2);
  const weeks: ForecastWeek[] = [];
  let weekIndex = 0;
  buckets.forEach((bucket, weekStart) => {
    const loadScore = Math.round(bucket.reduce((sum, item) => sum + item.load, 0));
    const majorExams = bucket.filter((item) => item.major).length;
    const anyExams = bucket.filter((item) => item.kind === "exam").length;
    const color = colorFor(loadScore, majorExams, anyExams, weeklyCapacity, loadScore > 0 && topLoads.includes(loadScore));
    const absolute = Math.min(loadScore / weeklyCapacity, 1.4) / 1.4;
    const relative = maxLoad > 0 ? loadScore / maxLoad : 0;
    let intensity = Math.min(1, 0.7 * absolute + 0.3 * relative);
    if (color === "crunch") intensity = Math.max(intensity, 0.8);
    weeks.push({
      weekStart,
      weekIndex,
      loadScore,
      intensity: Math.round(intensity * 1000) / 1000,
      color,
      items: bucket.map(toRef),
      isCurrent: weekStart === currentWeek,
    });
    weekIndex += 1;
  });

  const crunchWeeks = weeks.filter((week) => week.color === "crunch").map((week) => week.weekStart);
  const startBy = buildStartBy(weeks, buckets, data, today, dailyCap);
  const classIds = new Set(items.map((item) => item.classId || ""));
  return {
    generatedFor: today,
    termStart,
    termEnd,
    weeks,
    crunchWeeks,
    startBy,
    totals: {
      items: items.length,
      exams: items.filter((item) => item.kind === "exam").length,
      tasks: items.filter((item) => item.kind === "task").length,
      classes: classIds.size,
    },
    fromPreview,
    weeklyCapacity,
  };
}

function buildStartBy(weeks: ForecastWeek[], buckets: Map<string, ForecastItem[]>, data: AppData, today: string, dailyCap: number): ForecastStartByMarked[] {
  const perClassDaily = Math.max(15, Math.floor(dailyCap * START_BY_DAILY_SHARE));
  // Day load already committed: planned, unfinished study blocks from today on.
  const dayLoad = new Map<string, number>();
  activeSemesterData(data).studyBlocks.forEach((block) => {
    if (block.completed || block.missed || !block.date || !isValidDateInput(block.date) || block.date < today) return;
    dayLoad.set(block.date, (dayLoad.get(block.date) || 0) + Math.max(0, Number(block.minutes) || 0));
  });

  const result: ForecastStartByMarked[] = [];
  for (const week of weeks) {
    if (week.color !== "crunch") continue;
    if (addDaysKey(week.weekStart, 6) < today) continue;
    const groups = new Map<string, ForecastItem[]>();
    (buckets.get(week.weekStart) || []).forEach((item) => {
      if (item.dueDate < today) return;
      const key = item.classId || "";
      groups.set(key, [...(groups.get(key) || []), item]);
    });
    const ordered = Array.from(groups.entries()).sort((a, b) => a[1][0].dueDate.localeCompare(b[1][0].dueDate) || a[0].localeCompare(b[0]));
    for (const [classId, group] of ordered) {
      const prepMinutes = group.reduce((sum, item) => sum + item.prepMinutes, 0);
      const earliest = group.reduce((min, item) => (item.dueDate < min ? item.dueDate : min), group[0].dueDate);
      let remaining = prepMinutes;
      let day = addDaysKey(earliest, -1);
      let startDate = earliest > today ? addDaysKey(earliest, -1) : today;
      let clampedToToday = earliest <= today;
      let guard = 0;
      while (remaining > 0 && guard < 180) {
        guard += 1;
        if (day < today) {
          clampedToToday = true;
          startDate = today;
          break;
        }
        const used = dayLoad.get(day) || 0;
        const free = dailyCap - used;
        if (free > 0) {
          const alloc = Math.min(perClassDaily, free, remaining);
          dayLoad.set(day, used + alloc);
          remaining -= alloc;
          startDate = day;
        }
        day = addDaysKey(day, -1);
      }
      const entry: ForecastStartByMarked = {
        weekStart: week.weekStart,
        startDate,
        prepMinutes,
        reasonItemIds: group.map((item) => item.id),
        clampedToToday,
        shortfallMinutes: Math.max(0, Math.round(remaining)),
      };
      if (classId) entry.classId = classId;
      const code = group.find((item) => item.classCode)?.classCode;
      if (code) entry.classCode = code;
      result.push(entry);
    }
  }
  return result.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.weekStart.localeCompare(b.weekStart) || String(a.classCode || a.classId || "").localeCompare(String(b.classCode || b.classId || "")));
}

export type ForecastHeadline = {
  crunchCount: number;
  worstWeekStart: string | null;
  worstWeekItems: number;
  nextStartBy: ForecastStartBy | null;
};

/** Structured facts for templated captions (never copy). */
export function forecastHeadline(forecast: CrunchForecast): ForecastHeadline {
  const worst = forecast.weeks.reduce<ForecastWeek | null>((best, week) => (week.loadScore > 0 && (!best || week.loadScore > best.loadScore) ? week : best), null);
  const nextStartBy = forecast.startBy.find((entry) => entry.startDate >= forecast.generatedFor) || null;
  return {
    crunchCount: forecast.crunchWeeks.length,
    worstWeekStart: worst ? worst.weekStart : null,
    worstWeekItems: worst ? worst.items.length : 0,
    nextStartBy,
  };
}

/** Days from the forecast date to a start-by date (for "start in N days" templates). */
export function daysUntilStart(forecast: CrunchForecast, entry: ForecastStartBy) {
  return diffDaysKey(forecast.generatedFor, entry.startDate);
}
