// Realistic sample props for the gallery and web screenshot QA. Pure data:
// no react-native imports. Nothing here ships to users as content.
import type {
  AIAvailability,
  CrunchForecast,
  DailyBrief,
  ForecastColor,
  ForecastItemRef,
  ForecastStartBy,
  ForecastWeek,
  StudySet,
  TaskProposal,
  WeakTopic,
} from "../types";
import type { ExamModeSummary } from "./ExamModeScreen";
import { addDaysISO, daysBetweenISO } from "./format";
import type { QuickAddClassOption } from "./QuickAddConfirmSheet";
import { CLASS_SWATCHES } from "./tokens";

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

export const FIXTURE_CLASSES: QuickAddClassOption[] = [
  { id: "cls-bio", code: "BIO 110", name: "Cell Biology", color: CLASS_SWATCHES[0] },
  { id: "cls-chem", code: "CHEM 201", name: "Organic Chemistry", color: CLASS_SWATCHES[1] },
  { id: "cls-psyc", code: "PSYC 100", name: "Intro to Psychology", color: CLASS_SWATCHES[2] },
  { id: "cls-hist", code: "HIST 215", name: "Modern Europe", color: CLASS_SWATCHES[3] },
  { id: "cls-math", code: "MATH 221", name: "Calculus II", color: CLASS_SWATCHES[4] },
];

const CODE_BY_ID = new Map(FIXTURE_CLASSES.map((c) => [c.id, c.code]));

// ---------------------------------------------------------------------------
// Crunch Forecast: 16-week fall term, 5 classes, 43 deadlines.
// ---------------------------------------------------------------------------

type Row = [classId: string, kind: "task" | "exam", title: string, dueDate: string, weight: number, prepMinutes: number];

const TERM_ITEMS: Row[] = [
  // BIO 110
  ["cls-bio", "task", "Lab 1 report", "2026-09-04", 5, 90],
  ["cls-bio", "task", "Quiz 1: Cell structure", "2026-09-18", 5, 60],
  ["cls-bio", "task", "Lab 2 report", "2026-10-02", 5, 90],
  ["cls-bio", "exam", "Midterm 1", "2026-10-15", 20, 300],
  ["cls-bio", "task", "Lab 3 report", "2026-10-30", 5, 90],
  ["cls-bio", "task", "Quiz 2: Genetics", "2026-11-06", 5, 60],
  ["cls-bio", "exam", "Midterm 2", "2026-11-12", 20, 300],
  ["cls-bio", "task", "Lab 4 report", "2026-11-24", 5, 90],
  ["cls-bio", "exam", "Final exam", "2026-12-10", 30, 420],
  // CHEM 201
  ["cls-chem", "task", "Problem set 1", "2026-09-02", 4, 90],
  ["cls-chem", "task", "Problem set 2", "2026-09-16", 4, 90],
  ["cls-chem", "task", "Problem set 3", "2026-10-07", 4, 90],
  ["cls-chem", "exam", "Exam 1", "2026-10-14", 20, 300],
  ["cls-chem", "task", "Problem set 4", "2026-10-28", 4, 90],
  ["cls-chem", "exam", "Lab practical", "2026-11-10", 10, 120],
  ["cls-chem", "exam", "Exam 2", "2026-11-13", 20, 300],
  ["cls-chem", "task", "Problem set 5", "2026-12-02", 4, 90],
  ["cls-chem", "exam", "Final exam", "2026-12-09", 30, 420],
  // PSYC 100
  ["cls-psyc", "task", "Reading response 1", "2026-09-03", 3, 45],
  ["cls-psyc", "task", "Reading response 2", "2026-09-24", 3, 45],
  ["cls-psyc", "exam", "Midterm", "2026-10-16", 25, 240],
  ["cls-psyc", "task", "Research summary", "2026-10-23", 10, 150],
  ["cls-psyc", "task", "Reading response 3", "2026-11-05", 3, 45],
  ["cls-psyc", "task", "Group presentation", "2026-11-11", 15, 150],
  ["cls-psyc", "task", "Reading response 4", "2026-12-03", 3, 45],
  ["cls-psyc", "exam", "Final exam", "2026-12-11", 25, 300],
  // HIST 215
  ["cls-hist", "task", "Reading quiz", "2026-09-04", 5, 45],
  ["cls-hist", "task", "Primary source analysis", "2026-09-11", 10, 150],
  ["cls-hist", "task", "Map quiz", "2026-09-25", 5, 60],
  ["cls-hist", "task", "Essay 1", "2026-10-13", 20, 240],
  ["cls-hist", "exam", "Midterm", "2026-10-29", 20, 240],
  ["cls-hist", "task", "Book review", "2026-11-13", 15, 180],
  ["cls-hist", "task", "Research proposal", "2026-11-20", 10, 120],
  ["cls-hist", "task", "Final paper", "2026-12-08", 25, 360],
  // MATH 221
  ["cls-math", "task", "Homework 1", "2026-08-28", 3, 60],
  ["cls-math", "task", "Homework 2", "2026-09-11", 3, 60],
  ["cls-math", "task", "Quiz 1", "2026-09-18", 5, 60],
  ["cls-math", "exam", "Exam 1", "2026-10-12", 20, 300],
  ["cls-math", "task", "Homework 4", "2026-10-23", 3, 60],
  ["cls-math", "task", "Homework 5", "2026-11-06", 3, 60],
  ["cls-math", "exam", "Exam 2", "2026-11-12", 20, 300],
  ["cls-math", "task", "Homework 6", "2026-11-25", 3, 60],
  ["cls-math", "exam", "Final exam", "2026-12-08", 30, 420],
];

const TERM_START = "2026-08-24";
const TERM_WEEKS = 16;

function colorFor(hours: number): ForecastColor {
  if (hours >= 16) return "crunch";
  if (hours >= 3.5) return "busy";
  if (hours >= 2) return "steady";
  return "calm";
}

function buildFixtureForecast(rows: Row[], generatedFor: string, fromPreview: boolean): CrunchForecast {
  const refs: ForecastItemRef[] = rows.map(([classId, kind, title, dueDate, weight, prepMinutes], index) => ({
    id: `fx-${index}`,
    kind,
    classId,
    classCode: CODE_BY_ID.get(classId),
    title,
    dueDate,
    weight,
    prepMinutes,
  }));
  const loads: number[] = [];
  const buckets: ForecastItemRef[][] = Array.from({ length: TERM_WEEKS }, () => []);
  for (const ref of refs) {
    const index = Math.floor(daysBetweenISO(TERM_START, ref.dueDate) / 7);
    if (index >= 0 && index < TERM_WEEKS) buckets[index].push(ref);
  }
  buckets.forEach((items) => loads.push(items.reduce((sum, item) => sum + item.prepMinutes, 0) / 60));
  const max = Math.max(...loads, 1);
  const weeks: ForecastWeek[] = buckets.map((items, weekIndex) => {
    const weekStart = addDaysISO(TERM_START, weekIndex * 7);
    const offset = daysBetweenISO(weekStart, generatedFor);
    return {
      weekStart,
      weekIndex,
      loadScore: Math.round(loads[weekIndex] * 10) / 10,
      intensity: Math.round((loads[weekIndex] / max) * 100) / 100,
      color: colorFor(loads[weekIndex]),
      items,
      isCurrent: offset >= 0 && offset < 7,
    };
  });
  const crunchWeeks = weeks.filter((week) => week.color === "crunch").map((week) => week.weekStart);
  const startBy: ForecastStartBy[] = [];
  for (const week of weeks) {
    if (week.color !== "crunch") continue;
    const exams = week.items.filter((item) => item.kind === "exam").sort((a, b) => b.prepMinutes - a.prepMinutes).slice(0, 2);
    for (const exam of exams) {
      const leadDays = Math.ceil(exam.prepMinutes / 60) * 2 + 3;
      startBy.push({
        classId: exam.classId,
        classCode: exam.classCode,
        weekStart: week.weekStart,
        startDate: addDaysISO(exam.dueDate, -leadDays),
        prepMinutes: exam.prepMinutes,
        reasonItemIds: [exam.id],
      });
    }
  }
  const classes = new Set(refs.map((ref) => ref.classId));
  return {
    generatedFor,
    termStart: TERM_START,
    termEnd: addDaysISO(TERM_START, TERM_WEEKS * 7 - 1),
    weeks,
    crunchWeeks,
    startBy,
    totals: {
      items: refs.length,
      exams: refs.filter((ref) => ref.kind === "exam").length,
      tasks: refs.filter((ref) => ref.kind === "task").length,
      classes: classes.size,
    },
    fromPreview,
  };
}

/** Mid-term view (Sep 23): current week outlined, 3 red weeks ahead. */
export const FIXTURE_FORECAST: CrunchForecast = buildFixtureForecast(TERM_ITEMS, "2026-09-23", false);

/** Syllabus-week preview from a pending import (before the term starts). */
export const FIXTURE_FORECAST_PREVIEW: CrunchForecast = buildFixtureForecast(TERM_ITEMS, "2026-08-20", true);

/** A light term with no crunch weeks (headline "No crunch weeks yet"). */
export const FIXTURE_FORECAST_CALM: CrunchForecast = buildFixtureForecast(
  TERM_ITEMS.filter(([classId, kind]) => (classId === "cls-psyc" || classId === "cls-hist") && kind === "task"),
  "2026-09-23",
  false,
);

export const FIXTURE_FORECAST_EMPTY: CrunchForecast = buildFixtureForecast([], "2026-09-23", false);

// ---------------------------------------------------------------------------
// Study set with citations (BIO 110, cellular respiration notes).
// ---------------------------------------------------------------------------

export const FIXTURE_STUDY_SET: StudySet = {
  noteId: "note-bio-ch7",
  sourceHash: "fx-7a1c",
  origin: "onDevice",
  summary: "Cellular respiration turns glucose into ATP through glycolysis, the Krebs cycle and the electron transport chain. Oxygen is the final electron acceptor.",
  concepts: ["Glycolysis", "Krebs cycle", "Electron transport chain", "ATP yield", "Fermentation"],
  cards: [
    { id: "c1", front: "Where does glycolysis happen?", back: "In the cytoplasm. It splits one glucose into two pyruvate.", source: { quote: "Glycolysis happens in the cytoplasm and splits glucose into 2 pyruvate", line: 4 } },
    { id: "c2", front: "What is the final electron acceptor in the electron transport chain?", back: "Oxygen. It combines with electrons and H+ to form water.", source: { quote: "O2 is the final electron acceptor -> forms H2O", line: 18 } },
    { id: "c3", front: "Net ATP from glycolysis", back: "2 ATP per glucose (4 made, 2 spent).", source: { quote: "net +2 ATP (4 produced, 2 invested)", line: 6 } },
    { id: "c4", front: "Where does the Krebs cycle run?", back: "In the mitochondrial matrix.", source: { quote: "Krebs cycle = mitochondrial matrix", line: 11 } },
    { id: "c5", front: "What happens to pyruvate without oxygen?", back: "Fermentation: it becomes lactate (animals) or ethanol (yeast), regenerating NAD+.", source: { quote: "no O2 -> fermentation, regenerates NAD+ (lactate in muscle, ethanol in yeast)", line: 23 } },
    { id: "c6", front: "Approximate ATP yield per glucose", back: "About 30–32 ATP in total.", source: { quote: "total ~30-32 ATP per glucose", line: 20 } },
  ],
  questions: [
    {
      id: "q1",
      stem: "Which stage of cellular respiration produces the most ATP?",
      options: ["Glycolysis", "Krebs cycle", "Electron transport chain", "Fermentation"],
      answerIndex: 2,
      why: "Oxidative phosphorylation in the electron transport chain makes roughly 26–28 of the ~30–32 ATP.",
      source: { quote: "ETC + chemiosmosis makes most of the ATP (~26-28)", line: 19 },
    },
    {
      id: "q2",
      stem: "Where does the Krebs cycle take place?",
      options: ["Cytoplasm", "Mitochondrial matrix", "Inner membrane space", "Nucleus"],
      answerIndex: 1,
      why: "The Krebs cycle enzymes sit in the mitochondrial matrix.",
      source: { quote: "Krebs cycle = mitochondrial matrix", line: 11 },
    },
    {
      id: "q3",
      stem: "What is regenerated by fermentation so glycolysis can continue?",
      options: ["ATP", "FADH2", "NAD+", "Pyruvate"],
      answerIndex: 2,
      why: "Fermentation recycles NADH back to NAD+, which glycolysis needs.",
      source: { quote: "no O2 -> fermentation, regenerates NAD+ (lactate in muscle, ethanol in yeast)", line: 23 },
    },
    {
      id: "q4",
      stem: "What is the net ATP gain from glycolysis per glucose?",
      options: ["1", "2", "4", "36"],
      answerIndex: 1,
      why: "Glycolysis makes 4 ATP but invests 2, for a net of 2.",
      source: { quote: "net +2 ATP (4 produced, 2 invested)", line: 6 },
      sharedByClassmate: true,
    },
  ],
  createdAt: "2026-09-22T19:04:00.000Z",
  schemaVersion: 1,
};

// ---------------------------------------------------------------------------
// Study Now
// ---------------------------------------------------------------------------

export const FIXTURE_BRIEF: DailyBrief = {
  dateKey: "2026-09-23",
  candidate: { id: "sn-1", kind: "exam_prep", classId: "cls-bio", classCode: "BIO 110", title: "Bio ch. 7", minutes: 25, daysUntil: 12, examId: "exam-bio-mid1", noteId: "note-bio-ch7" },
  line: "Now: 25 min Bio ch. 7",
  reason: "Midterm 1 is in 12 days and chapter 7 is your least-practiced note.",
  origin: "onDevice",
};

export const FIXTURE_BRIEF_TEMPLATE: DailyBrief = {
  dateKey: "2026-09-23",
  candidate: { id: "sn-2", kind: "task", classId: "cls-hist", classCode: "HIST 215", title: "Map quiz", minutes: 30, daysUntil: 1, taskId: "task-hist-map" },
  line: "Now: 30 min HIST 215 map quiz",
  reason: "It's due tomorrow and worth 5%.",
  origin: "template",
};

// ---------------------------------------------------------------------------
// Quick add
// ---------------------------------------------------------------------------

export const FIXTURE_PROPOSAL_NEEDS: TaskProposal = {
  title: "Lab report",
  type: "lab",
  estimateMinutes: 90,
  weight: 10,
  needs: ["class", "date"],
  origin: "onDevice",
};

export const FIXTURE_PROPOSAL_READY: TaskProposal = {
  title: "Problem set 3",
  classId: "cls-chem",
  dueDate: "2026-09-25",
  time: "11:59 PM",
  type: "assignment",
  estimateMinutes: 120,
  weight: 4,
  needs: [],
  origin: "heuristic",
};

export const FIXTURE_TODAY = "2026-09-23";

// ---------------------------------------------------------------------------
// Exam Mode
// ---------------------------------------------------------------------------

export const FIXTURE_WEAK_TOPICS: WeakTopic[] = [
  { concept: "Electron transport chain", classId: "cls-bio", examId: "exam-bio-mid1", misses: 5, attempts: 7, weakness: 0.71 },
  { concept: "Fermentation", classId: "cls-bio", examId: "exam-bio-mid1", misses: 3, attempts: 8, weakness: 0.38 },
  { concept: "ATP yield", classId: "cls-bio", examId: "exam-bio-mid1", misses: 1, attempts: 6, weakness: 0.17 },
];

export const FIXTURE_EXAM: ExamModeSummary = {
  examTitle: "Midterm 1",
  classCode: "BIO 110",
  className: "Cell Biology",
  classColor: CLASS_SWATCHES[0],
  examDate: "2026-10-15",
  examTime: "9:00 AM",
  daysUntil: 6,
  windowDays: 21,
  notesLinked: 4,
  cardsMastered: 18,
  cardsTotal: 42,
  answersRecorded: 34,
  weakTopics: FIXTURE_WEAK_TOPICS,
  reviewProposal: { blocks: 3, minutesEach: 25 },
  studySetOrigin: "onDevice",
};

export const FIXTURE_EXAM_EARLY: ExamModeSummary = {
  ...FIXTURE_EXAM,
  daysUntil: 17,
  cardsMastered: 3,
  answersRecorded: 7,
  weakTopics: [],
  reviewProposal: null,
};

export const FIXTURE_EXAM_NO_NOTES: ExamModeSummary = {
  ...FIXTURE_EXAM,
  classCode: "HIST 215",
  classColor: CLASS_SWATCHES[3],
  examTitle: "Midterm",
  examDate: "2026-10-29",
  daysUntil: 2,
  notesLinked: 0,
  cardsMastered: 0,
  cardsTotal: 0,
  answersRecorded: 0,
  weakTopics: [],
  reviewProposal: null,
  studySetOrigin: null,
};

// ---------------------------------------------------------------------------
// Class Pack
// ---------------------------------------------------------------------------

export const FIXTURE_PACK_LINK = "https://studyplanner-ai.xxmnewman9xx.workers.dev/p#v1.eJyrVkrOzytJzSvRUVAqzy_KSVGyUjI0MDDQUcrMS8tMTlWyUjI0MjbWUcrJTE4tSk1RslLKSSxJLVayUqpVAgA5lBEu";

/**
 * A 29x29 QR-shaped matrix (finder, timing and pseudo-random data modules) for
 * visual QA only. It is not a scannable encoding; the real matrix comes from
 * the pure-TS encoder.
 */
export const FIXTURE_QR_MATRIX: boolean[][] = (() => {
  const size = 29;
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
  let seed = 7;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) grid[y][x] = random() > 0.52;
  const finder = (ox: number, oy: number) => {
    for (let y = -1; y <= 7; y += 1)
      for (let x = -1; x <= 7; x += 1) {
        const gx = ox + x;
        const gy = oy + y;
        if (gx < 0 || gy < 0 || gx >= size || gy >= size) continue;
        const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
        grid[gy][gx] = x >= 0 && x <= 6 && y >= 0 && y <= 6 && ring !== 2;
      }
  };
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);
  for (let i = 8; i < size - 8; i += 1) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }
  return grid;
})();

// ---------------------------------------------------------------------------
// Availability states (Profile AIStatusRow)
// ---------------------------------------------------------------------------

const BASE_AVAILABILITY = { contextSize: 4096, osVersion: "26.5", documentReader: true };

export const FIXTURE_AVAILABILITY: Record<string, AIAvailability> = {
  available: { ...BASE_AVAILABILITY, state: "available" },
  userDisabled: { ...BASE_AVAILABILITY, state: "unavailable", reason: "userDisabled" },
  modelNotReady: { ...BASE_AVAILABILITY, state: "unavailable", reason: "modelNotReady" },
  appleIntelligenceNotEnabled: { ...BASE_AVAILABILITY, state: "unavailable", reason: "appleIntelligenceNotEnabled" },
  localeUnsupported: { ...BASE_AVAILABILITY, state: "unavailable", reason: "localeUnsupported" },
  deviceNotEligible: { ...BASE_AVAILABILITY, state: "unavailable", reason: "deviceNotEligible" },
  unsupportedOS: { contextSize: 0, osVersion: "17.6", documentReader: false, state: "unsupportedOS" },
};
