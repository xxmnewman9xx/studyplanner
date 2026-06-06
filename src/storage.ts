import * as SQLite from "expo-sqlite";
import { AppData, ClassItem, ExamItem, ImportBatch, NoteItem, ReminderItem, StudyBlock, TaskItem } from "./types";
import { buildStudyPlan } from "./ai";
import { defaultData } from "./seed";
import { appendFeedbackEvent } from "./intelligence";

const DB_NAME = "studyplanner-ai.db";
const KEY = "app-data";
const CORRUPT_BACKUP_PREFIX = "app-data-corrupt";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function database() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  return dbPromise;
}

export async function initStorage() {
  const db = await database();
  await db.execAsync("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);");
}

export async function loadData(): Promise<AppData> {
  try {
    await initStorage();
    const db = await database();
    const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM kv WHERE key = ?", KEY);
    if (!row?.value) {
      await saveData(defaultData);
      return defaultData;
    }
    const parsed = JSON.parse(row.value) as AppData;
    return normalizeData(parsed);
  } catch {
    try {
      const db = await database();
      const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM kv WHERE key = ?", KEY).catch(() => null);
      if (row?.value) {
        await db.runAsync("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)", `${CORRUPT_BACKUP_PREFIX}-${Date.now()}`, row.value);
      }
      await saveData(defaultData);
    } catch {
      dbPromise = null;
    }
    return defaultData;
  }
}

export async function saveData(data: AppData) {
  await initStorage();
  const db = await database();
  await db.runAsync("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)", KEY, JSON.stringify(data));
}

export async function resetData() {
  await saveData(defaultData);
  return defaultData;
}

function cleanText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function cleanBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeTask(task: Partial<TaskItem>, index: number): TaskItem {
  return {
    id: cleanText(task.id, `task_${index}`),
    title: cleanText(task.title, "Untitled task"),
    classId: cleanText(task.classId, ""),
    type: cleanText(task.type, "Assignment"),
    dueOffset: Number.isFinite(task.dueOffset) ? Number(task.dueOffset) : 0,
    dueDate: cleanText(task.dueDate, new Date().toISOString().slice(0, 10)),
    time: cleanText(task.time, "11:59 PM"),
    estimateMinutes: Number.isFinite(task.estimateMinutes) ? Number(task.estimateMinutes) : 45,
    done: Boolean(task.done),
    urgent: Boolean(task.urgent),
    source: cleanText(task.source, "Imported"),
    subtasks: Array.isArray(task.subtasks) ? task.subtasks.map((subtask) => ({ title: cleanText(subtask.title, "Step"), done: Boolean(subtask.done) })) : [],
    weight: task.weight,
    score: task.score,
    missing: task.missing,
  };
}

function normalizeNote(note: Partial<NoteItem>, index: number): NoteItem {
  return {
    id: cleanText(note.id, `note_${index}`),
    classId: cleanText(note.classId, ""),
    title: cleanText(note.title, "Untitled note"),
    createdAt: cleanText(note.createdAt, new Date().toISOString()),
    summary: cleanText(note.summary, "Review this note."),
    terms: Array.isArray(note.terms) ? note.terms.filter((term): term is string => typeof term === "string") : [],
    suggestedTasks: Array.isArray(note.suggestedTasks) ? note.suggestedTasks.filter((task): task is string => typeof task === "string") : [],
    examId: note.examId,
    pages: Number.isFinite(note.pages) ? Number(note.pages) : 1,
    sourceText: typeof note.sourceText === "string" ? note.sourceText : "",
    reviewedConcepts: Array.isArray(note.reviewedConcepts) ? note.reviewedConcepts.filter((item): item is string => typeof item === "string") : undefined,
    generatedAssetsAt: note.generatedAssetsAt,
  };
}

export function normalizeData(data: Partial<AppData> | null | undefined): AppData {
  const incomingPrefs = data?.prefs || {};
  const name = cleanText((incomingPrefs as any).name, defaultData.prefs.name);
  const firstName = cleanText((incomingPrefs as any).firstName || name.split(/\s+/)[0], "Student");
  const studentType = cleanText((incomingPrefs as any).studentType || (incomingPrefs as any).studentPersona, defaultData.prefs.studentType || "College");
  const mainGoal = cleanText((incomingPrefs as any).mainGoal || (incomingPrefs as any).semesterGoal, defaultData.prefs.mainGoal || "Stay ahead");
  const onboardingComplete = typeof (incomingPrefs as any).onboardingComplete === "boolean"
    ? Boolean((incomingPrefs as any).onboardingComplete)
    : (incomingPrefs as any).osLive === true;
  return {
    ...defaultData,
    ...data,
    prefs: {
      ...defaultData.prefs,
      ...incomingPrefs,
      name,
      firstName,
      studentType,
      studentPersona: studentType,
      mainGoal,
      semesterGoal: mainGoal,
      workloadStyle: cleanText((incomingPrefs as any).workloadStyle, defaultData.prefs.workloadStyle),
      scanIntent: cleanText((incomingPrefs as any).scanIntent, defaultData.prefs.scanIntent || "Syllabus PDF"),
      onboardingComplete,
      osLive: cleanBoolean((incomingPrefs as any).osLive),
      premium: false,
      premiumProductId: undefined,
      premiumCheckedAt: undefined,
    },
    classes: Array.isArray(data?.classes) ? data.classes.filter(Boolean) as ClassItem[] : [],
    tasks: Array.isArray(data?.tasks) ? data.tasks.filter(Boolean).map((task, index) => normalizeTask(task, index)) : [],
    exams: Array.isArray(data?.exams) ? data.exams.filter(Boolean) as ExamItem[] : [],
    notes: Array.isArray(data?.notes) ? data.notes.filter(Boolean).map((note, index) => normalizeNote(note, index)) : [],
    reminders: Array.isArray(data?.reminders) ? data.reminders.filter(Boolean) as ReminderItem[] : [],
    studyBlocks: Array.isArray(data?.studyBlocks) ? data.studyBlocks.filter(Boolean) as StudyBlock[] : [],
    imports: Array.isArray(data?.imports) ? data.imports : [],
    feedbackEvents: Array.isArray(data?.feedbackEvents) ? data.feedbackEvents : [],
  };
}

function isEmptyCoursework(data: AppData) {
  if (data.imports?.length) return false;
  return !(data.classes?.length || data.tasks?.length || data.exams?.length || data.notes?.length);
}

export function applyImport(data: AppData, batch: ImportBatch): AppData {
  const approved = batch.candidates.filter((c) => c.approved);
  const startsFromEmptyCoursework = isEmptyCoursework(data) && approved.some((candidate) => ["class", "task", "exam"].includes(candidate.kind));
  const baseClasses = startsFromEmptyCoursework ? [] : data.classes;
  const baseTasks = startsFromEmptyCoursework ? [] : data.tasks;
  const baseExams = startsFromEmptyCoursework ? [] : data.exams;
  const baseNotes = startsFromEmptyCoursework ? [] : data.notes;
  const classCodes = new Set(baseClasses.map((c) => c.code.toLowerCase()));
  const taskTitles = new Set(baseTasks.map((t) => `${t.title.toLowerCase()}-${t.dueDate}`));
  const examTitles = new Set(baseExams.map((e) => `${e.title.toLowerCase()}-${e.dueDate}`));

  const classes = [...baseClasses];
  const tasks = [...baseTasks];
  const exams = [...baseExams];
  const notes = [...baseNotes];
  const noteKeys = new Set(baseNotes.map((n) => `${n.title.toLowerCase()}-${(n.sourceText || "").slice(0, 80).toLowerCase()}`));
  const ensureClassId = (incoming?: string) => {
    if (incoming && classes.some((klass) => klass.id === incoming)) return incoming;
    if (classes[0]?.id) return classes[0].id;
    const fallbackClass: ClassItem = {
      id: `class_imported_${Date.now()}`,
      code: "Class",
      name: "Imported class",
      professor: "Professor TBD",
      room: "Room TBD",
      days: "Tue Thu",
      time: "10:00 AM",
      next: "Next class",
      health: 0.72,
      grade: "Not set",
      color: "#0A84FF",
      color2: "#30D158",
      icon: "book-open",
    };
    classes.push(fallbackClass);
    classCodes.add(fallbackClass.code.toLowerCase());
    return fallbackClass.id;
  };

  approved.forEach((candidate) => {
    if (candidate.kind === "class" && candidate.payload.code && !classCodes.has(candidate.payload.code.toLowerCase())) {
      classes.push(candidate.payload as any);
      classCodes.add(candidate.payload.code.toLowerCase());
    }
    if (candidate.kind === "task" && candidate.payload.title && candidate.payload.dueDate) {
      const key = `${candidate.payload.title.toLowerCase()}-${candidate.payload.dueDate}`;
      if (!taskTitles.has(key)) {
        tasks.push({ ...candidate.payload, classId: ensureClassId(candidate.payload.classId) } as any);
        taskTitles.add(key);
      }
    }
    if (candidate.kind === "exam" && candidate.payload.title && candidate.payload.dueDate) {
      const key = `${candidate.payload.title.toLowerCase()}-${candidate.payload.dueDate}`;
      if (!examTitles.has(key)) {
        exams.push({ ...candidate.payload, classId: ensureClassId(candidate.payload.classId) } as any);
        examTitles.add(key);
      }
    }
    if (candidate.kind === "note" && candidate.payload.title) {
      const note = candidate.payload as any;
      const key = `${note.title.toLowerCase()}-${(note.sourceText || "").slice(0, 80).toLowerCase()}`;
      if (!noteKeys.has(key)) {
        notes.unshift({ ...note, classId: ensureClassId(note.classId), sourceText: note.sourceText || "", terms: note.terms || [], suggestedTasks: note.suggestedTasks || [] });
        noteKeys.add(key);
      }
    }
  });

  const updated: AppData = {
    ...data,
    prefs: { ...data.prefs, osLive: true },
    classes,
    tasks,
    exams,
    notes,
    imports: [{ ...batch, status: "applied" as const }, ...data.imports.filter((item) => item.id !== batch.id)].slice(0, 12),
  };
  const planned = { ...updated, studyBlocks: buildStudyPlan(updated) };
  const action = approved.some((candidate) => candidate.kind === "note") ? "importNotes" : "importSyllabus";
  return appendFeedbackEvent(data, planned, action, {
    message: `${approved.length} items imported.`,
    dimension: action === "importNotes" ? "preparedness" : undefined,
  });
}
