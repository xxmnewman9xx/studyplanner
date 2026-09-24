/// <reference types="node" />
// Crunch Forecast checks: bucketing, colors, startBy back-scheduling, pending
// previews, week-start conventions, DST transitions, and performance.
// Runs in America/New_York so the Nov 1 and Mar 8, 2026 DST switches are real.
process.env.TZ = "America/New_York";

import assert from "node:assert/strict";
import { addDaysKey, dateKey, weekdayOfKey } from "../src/appleIntelligence/dateKeys";
import { buildCrunchForecast, DEFAULT_EXAM_PREP, forecastHeadline, weightMultiplier } from "../src/crunchForecast";
import { dailyCapFor } from "../src/intelligence";
import { AppData, ClassItem, ExamItem, ImportBatch, StudyBlock, TaskItem } from "../src/types";
import { defaultData } from "./fixture-data";

let checks = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    checks += 1;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

function klass(id: string, code: string, extra: Partial<ClassItem> = {}): ClassItem {
  return { id, code, name: code, professor: "", room: "", days: "Mon Wed", time: "10:00 AM", next: "", health: 0.8, grade: "", color: "#000", color2: "#111", icon: "book-open", ...extra };
}
function task(id: string, classId: string, dueDate: string, extra: Partial<TaskItem> = {}): TaskItem {
  return { id, title: `Task ${id}`, classId, type: "Assignment", dueOffset: 0, dueDate, time: "11:59 PM", estimateMinutes: 60, done: false, urgent: false, source: "test", subtasks: [], ...extra };
}
function exam(id: string, classId: string, dueDate: string, kind: ExamItem["kind"], extra: Partial<ExamItem> = {}): ExamItem {
  return { id, classId, title: `${kind} ${id}`, dueOffset: 0, dueDate, time: "9:00 AM", room: "", kind, topics: [], ...extra };
}
function data(parts: Partial<AppData>): AppData {
  return {
    ...JSON.parse(JSON.stringify(defaultData)),
    prefs: { ...defaultData.prefs, studyPersonality: "Planner", workloadStyle: "Balanced" },
    classes: [],
    tasks: [],
    exams: [],
    notes: [],
    reminders: [],
    studyBlocks: [],
    imports: [],
    ...parts,
  };
}
function noon(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

const NOW = noon("2026-09-01"); // Tuesday
const CAP = dailyCapFor({ studyPersonality: "Planner", workloadStyle: "Balanced" });
assert.equal(CAP, 150);

check("empty data and a single item", () => {
  const empty = buildCrunchForecast(data({}), NOW);
  assert.deepEqual(empty.weeks, []);
  assert.deepEqual(empty.startBy, []);
  assert.deepEqual(empty.totals, { items: 0, exams: 0, tasks: 0, classes: 0 });
  assert.equal(empty.generatedFor, "2026-09-01");
  assert.equal(forecastHeadline(empty).worstWeekStart, null);
  const one = buildCrunchForecast(data({ classes: [klass("bio", "BIO 101")], tasks: [task("t1", "bio", "2026-09-10")] }), NOW);
  assert.equal(one.weeks.length, 1);
  assert.equal(one.termStart, "2026-09-10");
  assert.equal(one.termEnd, "2026-09-10");
  assert.equal(one.weeks[0].weekStart, "2026-09-07");
  assert.equal(one.weeks[0].items[0].classCode, "BIO 101");
  assert.equal(one.weeks[0].loadScore, 60);
  assert.equal(one.totals.items, 1);
  assert.equal(one.fromPreview, false);
});

check("ISO-week bucketing is continuous and respects weekStartsOn", () => {
  const d = data({
    classes: [klass("bio", "BIO 101")],
    tasks: [task("sun", "bio", "2026-09-06"), task("mon", "bio", "2026-09-07"), task("late", "bio", "2026-10-05")],
  });
  const monday = buildCrunchForecast(d, NOW);
  assert.deepEqual(monday.weeks.map((week) => week.weekStart), ["2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05"]);
  assert.deepEqual(monday.weeks.map((week) => week.weekIndex), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(monday.weeks[0].items.map((item) => item.id), ["sun"], "Sunday closes a Monday-start week");
  assert.equal(monday.weeks[2].color, "calm");
  assert.equal(monday.weeks[0].isCurrent, true);
  const sunday = buildCrunchForecast(d, NOW, { weekStartsOn: 0 });
  assert.deepEqual(sunday.weeks.map((week) => week.weekStart), ["2026-09-06", "2026-09-13", "2026-09-20", "2026-09-27", "2026-10-04"]);
  assert.deepEqual(sunday.weeks[0].items.map((item) => item.id).sort(), ["mon", "sun"], "Sunday opens a Sunday-start week");
  sunday.weeks.forEach((week) => assert.equal(weekdayOfKey(week.weekStart), 0));
  monday.weeks.forEach((week) => assert.equal(weekdayOfKey(week.weekStart), 1));
});

check("prep minutes, weights, and colors (absolute and relative)", () => {
  assert.equal(weightMultiplier(undefined), 1);
  assert.equal(weightMultiplier(20), 1.5);
  assert.equal(weightMultiplier(100), 2.5);
  const d = data({
    classes: [klass("bio", "BIO 101"), klass("chem", "CHEM 311")],
    exams: [
      exam("mid", "bio", "2026-10-14", "Midterm"),
      exam("chemx", "chem", "2026-10-15", "Exam", { weight: 20 }),
      exam("quiz", "bio", "2026-09-16", "Quiz"),
      exam("eff", "chem", "2026-11-04", "Final", { effortMinutes: 120 }),
      exam("untyped", "chem", "2026-11-25", undefined, { title: "Final exam (cumulative)" }),
    ],
    tasks: [
      task("light", "bio", "2026-09-22", { estimateMinutes: 20 }),
      ...Array.from({ length: 6 }, (_, i) => task(`heavy${i}`, "chem", "2026-10-28", { estimateMinutes: 150 })),
    ],
  });
  const forecast = buildCrunchForecast(d, NOW);
  const week = (key: string) => forecast.weeks.find((item) => item.weekStart === key)!;
  const midtermWeek = week("2026-10-12");
  assert.equal(midtermWeek.items.find((item) => item.id === "mid")!.prepMinutes, DEFAULT_EXAM_PREP.Midterm);
  assert.equal(midtermWeek.loadScore, Math.round(300 + 240 * 1.5));
  assert.equal(midtermWeek.color, "crunch", "two major exams in one week");
  assert.equal(week("2026-09-14").color, "steady", "a single quiz is not a crunch");
  assert.equal(week("2026-09-21").color, "calm", "20 minutes of work is calm");
  assert.equal(week("2026-10-26").color, "crunch", "900 minutes > 750 weekly capacity");
  assert.equal(week("2026-11-02").items[0].prepMinutes, 120, "effortMinutes wins over the default");
  assert.equal(week("2026-11-23").items[0].prepMinutes, DEFAULT_EXAM_PREP.Final, "kind inferred from the title");
  assert.deepEqual(forecast.crunchWeeks, ["2026-10-12", "2026-10-26"]);
  forecast.weeks.forEach((item) => {
    assert.ok(item.intensity >= 0 && item.intensity <= 1);
    if (item.color === "crunch") assert.ok(item.intensity >= 0.8);
    if (item.color === "calm" && item.loadScore === 0) assert.equal(item.intensity, 0);
  });
  assert.equal(forecast.weeklyCapacity, CAP * 5);
  assert.deepEqual(forecast.totals, { items: 12, exams: 5, tasks: 7, classes: 2 });
  const headline = forecastHeadline(forecast);
  assert.equal(headline.crunchCount, 2);
  assert.equal(headline.worstWeekStart, "2026-10-26");
  assert.equal(headline.worstWeekItems, 6);
  assert.equal(headline.nextStartBy, forecast.startBy[0]);
});

check("done tasks, graded exams, archived classes, and far-off dates are ignored", () => {
  const d = data({
    classes: [klass("bio", "BIO 101"), klass("old", "OLD 100", { archivedAt: "2026-01-01" })],
    tasks: [task("done", "bio", "2026-09-10", { done: true }), task("archived", "old", "2026-09-10"), task("far", "bio", "2031-01-01"), task("missing", "bio", "2026-09-11", { missing: true }), task("bad", "bio", "2026-02-30"), task("ok", "bio", "2026-09-12")],
    exams: [exam("graded", "bio", "2026-09-15", "Midterm", { score: 88 })],
  });
  const forecast = buildCrunchForecast(d, NOW);
  assert.deepEqual(forecast.weeks.flatMap((week) => week.items.map((item) => item.id)), ["ok"]);
});

check("startBy back-schedules at ≤ 60% of the daily cap, skips full days, and never starts before today", () => {
  const perDay = Math.floor(CAP * 0.6); // 90
  const d = data({
    classes: [klass("bio", "BIO 101"), klass("chem", "CHEM 311")],
    exams: [exam("mid", "bio", "2026-10-14", "Midterm"), exam("chemx", "chem", "2026-10-15", "Exam")],
  });
  const forecast = buildCrunchForecast(d, NOW);
  assert.deepEqual(forecast.crunchWeeks, ["2026-10-12"]);
  const bio = forecast.startBy.find((entry) => entry.classId === "bio")!;
  const chem = forecast.startBy.find((entry) => entry.classId === "chem")!;
  assert.equal(bio.prepMinutes, 300);
  assert.equal(bio.startDate, addDaysKey("2026-10-14", -Math.ceil(300 / perDay)), "300 min at 90/day → 4 days before");
  assert.deepEqual(bio.reasonItemIds, ["mid"]);
  assert.equal(bio.classCode, "BIO 101");
  assert.equal(bio.clampedToToday, false);
  assert.equal(bio.shortfallMinutes, 0);
  // Chem is scheduled after bio; days bio already filled to 90 leave 60 free for chem.
  assert.ok(chem.startDate < addDaysKey("2026-10-15", -Math.ceil(240 / perDay)), "shared days push chem earlier");
  assert.ok(forecast.startBy.every((entry, i, list) => i === 0 || list[i - 1].startDate <= entry.startDate), "sorted by startDate");

  const blocks: StudyBlock[] = Array.from({ length: 4 }, (_, i) => ({ id: `b${i}`, day: "", time: "", classId: "chem", title: "busy", minutes: CAP, reason: "", completed: false, date: addDaysKey("2026-10-13", -i) }));
  const busy = buildCrunchForecast({ ...d, studyBlocks: blocks }, NOW);
  const busyBio = busy.startBy.find((entry) => entry.classId === "bio")!;
  assert.equal(busyBio.startDate, addDaysKey("2026-10-14", -1 - 4 - 3), "four full days are skipped");

  const soon = buildCrunchForecast(data({ classes: [klass("bio", "BIO 101")], exams: [exam("f1", "bio", "2026-09-03", "Final"), exam("f2", "bio", "2026-09-04", "Final")] }), NOW);
  assert.equal(soon.startBy.length, 1);
  assert.equal(soon.startBy[0].startDate, "2026-09-01", "clamped to today");
  assert.equal(soon.startBy[0].clampedToToday, true);
  assert.ok(soon.startBy[0].shortfallMinutes > 0);

  const past = buildCrunchForecast(data({ classes: [klass("bio", "BIO 101")], exams: [exam("p1", "bio", "2026-08-18", "Final"), exam("p2", "bio", "2026-08-19", "Final")] }), NOW);
  assert.deepEqual(past.crunchWeeks, ["2026-08-17"]);
  assert.deepEqual(past.startBy, [], "no start-by for weeks already over");
});

check("pending import preview", () => {
  const base = data({ classes: [klass("bio", "BIO 101")], tasks: [task("t1", "bio", "2026-09-10")] });
  const pending: ImportBatch = {
    id: "imp",
    sourceName: "Pasted syllabus",
    sourceText: "",
    createdAt: NOW.toISOString(),
    status: "review",
    candidates: [
      { id: "c1", kind: "class", title: "HIST 180", meta: "", classId: "hist180", confidence: 0.9, approved: true, payload: { id: "hist180", code: "HIST 180" } },
      { id: "c2", kind: "exam", title: "Midterm", meta: "", classId: "hist180", confidence: 0.9, approved: true, payload: { id: "e_p", classId: "hist180", title: "Midterm", dueDate: "2026-10-07", kind: "Midterm" } },
      { id: "c3", kind: "task", title: "Essay", meta: "", classId: "hist180", confidence: 0.9, approved: false, payload: { id: "t_p", classId: "hist180", title: "Essay", dueDate: "2026-10-08", estimateMinutes: 180 } },
      { id: "c4", kind: "task", title: "Task t1", meta: "", classId: "bio", confidence: 0.9, approved: true, payload: { id: "dup", classId: "bio", title: "Task t1", dueDate: "2026-09-10" } },
      { id: "c5", kind: "task", title: "No date", meta: "", classId: "bio", confidence: 0.9, approved: true, payload: { id: "nd", classId: "bio", title: "No date", dueDate: "" } },
    ],
  };
  const forecast = buildCrunchForecast(base, NOW, { pending });
  assert.equal(forecast.fromPreview, true);
  const ids = forecast.weeks.flatMap((week) => week.items.map((item) => item.id));
  assert.deepEqual(ids.sort(), ["e_p", "t1"], "unapproved, undated, and duplicate candidates are skipped");
  const midterm = forecast.weeks.flatMap((week) => week.items).find((item) => item.id === "e_p")!;
  assert.equal(midterm.classCode, "HIST 180");
  assert.equal(midterm.prepMinutes, 300);
  assert.equal(buildCrunchForecast(base, NOW, { pending: null }).fromPreview, false);
});

check("DST: Nov 1, 2026 fall-back and Mar 8, 2026 spring-forward keep calendar days intact", () => {
  assert.equal(new Date(2026, 10, 1, 12).getTimezoneOffset() !== new Date(2026, 9, 31, 12).getTimezoneOffset(), true, "TZ fixture has a DST switch");
  const fallNow = new Date(2026, 9, 31, 23, 30); // Sat 23:30, the night before fall-back
  const fall = buildCrunchForecast(data({
    classes: [klass("bio", "BIO 101")],
    exams: [exam("a", "bio", "2026-11-01", "Midterm"), exam("b", "bio", "2026-11-02", "Midterm"), exam("c", "bio", "2026-11-08", "Final")],
  }), fallNow);
  assert.equal(fall.generatedFor, "2026-10-31");
  assert.deepEqual(fall.weeks.map((week) => week.weekStart), ["2026-10-26", "2026-11-02"]);
  assert.deepEqual(fall.weeks[0].items.map((item) => item.id), ["a"], "Sunday Nov 1 stays in the Oct 26 week");
  assert.deepEqual(fall.weeks[1].items.map((item) => item.id), ["b", "c"]);
  const springNow = new Date(2026, 1, 20, 0, 15); // shortly after midnight
  const spring = buildCrunchForecast(data({
    classes: [klass("bio", "BIO 101")],
    exams: [exam("s1", "bio", "2026-03-09", "Midterm"), exam("s2", "bio", "2026-03-10", "Exam")],
  }), springNow);
  assert.equal(spring.generatedFor, "2026-02-20");
  assert.deepEqual(spring.crunchWeeks, ["2026-03-09"]);
  const entry = spring.startBy[0];
  // 540 prep minutes at 90/day = 6 days back from Mar 8, crossing the 2 AM Mar 8 switch.
  assert.equal(entry.startDate, "2026-03-03");
  const midnightAfterSwitch = new Date(2026, 2, 8, 0, 30);
  assert.equal(dateKey(midnightAfterSwitch), "2026-03-08");
  assert.equal(buildCrunchForecast(data({ classes: [klass("bio", "BIO 101")], tasks: [task("x", "bio", "2026-03-08")] }), midnightAfterSwitch).weeks[0].weekStart, "2026-03-02");
  let key = "2026-10-25";
  const seen: string[] = [];
  for (let i = 0; i < 20; i += 1) {
    seen.push(key);
    key = addDaysKey(key, 1);
  }
  assert.equal(new Set(seen).size, 20, "no duplicated day across fall-back");
  assert.equal(seen[7], "2026-11-01");
  assert.equal(addDaysKey("2026-03-09", -1), "2026-03-08");
  assert.equal(addDaysKey("2026-03-08", -1), "2026-03-07");
});

check("6 classes × 120 items builds in < 50 ms", () => {
  const classes = Array.from({ length: 6 }, (_, i) => klass(`c${i}`, `CLS ${100 + i}`));
  const tasks: TaskItem[] = [];
  const exams: ExamItem[] = [];
  for (let i = 0; i < 120; i += 1) {
    const due = addDaysKey("2026-09-01", (i * 7) % 110);
    if (i % 6 === 0) exams.push(exam(`e${i}`, `c${i % 6}`, due, i % 12 === 0 ? "Midterm" : "Quiz", { weight: 15 }));
    else tasks.push(task(`t${i}`, `c${i % 6}`, due, { estimateMinutes: 45 + (i % 5) * 30, weight: i % 3 ? 5 : undefined }));
  }
  const blocks: StudyBlock[] = Array.from({ length: 40 }, (_, i) => ({ id: `sb${i}`, day: "", time: "", classId: `c${i % 6}`, title: "b", minutes: 45, reason: "", completed: false, date: addDaysKey("2026-09-01", i) }));
  const d = data({ classes, tasks, exams, studyBlocks: blocks });
  buildCrunchForecast(d, NOW);
  const runs = 20;
  const start = process.hrtime.bigint();
  let forecast = buildCrunchForecast(d, NOW);
  for (let i = 1; i < runs; i += 1) forecast = buildCrunchForecast(d, NOW);
  const perRun = Number(process.hrtime.bigint() - start) / 1e6 / runs;
  assert.equal(forecast.totals.items, 120);
  assert.equal(forecast.totals.classes, 6);
  assert.ok(forecast.crunchWeeks.length > 0);
  assert.ok(perRun < 50, `forecast took ${perRun.toFixed(2)} ms`);
  console.log(`  perf: ${perRun.toFixed(2)} ms per forecast (6 classes × 120 items)`);
});

console.log(`Crunch Forecast checks passed (${checks})`);
