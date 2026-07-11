import { Platform } from "react-native";
import type * as SQLite from "expo-sqlite";
import { AppData, AppearanceMode, ClassItem, ExamItem, ImportBatch, NoteItem, ReminderItem, StudyBlock, TaskItem } from "./types";
import { buildStudyPlan } from "./ai";
import { defaultData } from "./seed";
import { appendFeedbackEvent, dateKey } from "./intelligence";
import { isValidDateInput } from "./logic/planner";

const DB_NAME = "studyplanner-ai.db";
const KEY = "app-data";
const CORRUPT_BACKUP_PREFIX = "app-data-corrupt";
const WEB_KEY = "studyplanner-ai:app-data";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function database() {
  if (!dbPromise) {
    const SQLite = await import("expo-sqlite");
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

export async function initStorage() {
  if (Platform.OS === "web") return;
  const db = await database();
  await db.execAsync("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);");
}

export async function loadData(): Promise<AppData> {
  if (Platform.OS === "web") {
    const storage = webLocalStorage();
    const raw = storage?.getItem(WEB_KEY);
    if (raw == null) {
      storage?.setItem(WEB_KEY, JSON.stringify(defaultData));
      return defaultData;
    }
    try {
      return parseStoredData(raw);
    } catch {
      storage?.setItem(`${WEB_KEY}:corrupt:${Date.now()}`, raw);
      storage?.setItem(WEB_KEY, JSON.stringify(defaultData));
      return defaultData;
    }
  }

  let db: SQLite.SQLiteDatabase;
  let row: { value: string } | null;

  try {
    await initStorage();
    db = await database();
    row = await db.getFirstAsync<{ value: string }>("SELECT value FROM kv WHERE key = ?", KEY);
  } catch (error) {
    // Opening/initializing/querying SQLite can fail transiently (for example,
    // while the database is locked). Do not turn that operational failure into
    // a destructive "first launch" and never replace the active payload here.
    dbPromise = null;
    throw error;
  }

  if (!row) {
    try {
      await db.runAsync("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)", KEY, JSON.stringify(defaultData));
    } catch (error) {
      dbPromise = null;
      throw error;
    }
    return defaultData;
  }

  try {
    return parseStoredData(row.value);
  } catch {
    try {
      // Back up a known-corrupt payload before replacing it. If either write
      // fails, surface the I/O error and leave the active key untouched when
      // the backup could not be secured.
      await db.runAsync("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)", `${CORRUPT_BACKUP_PREFIX}-${Date.now()}`, row.value);
      await db.runAsync("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)", KEY, JSON.stringify(defaultData));
    } catch (error) {
      dbPromise = null;
      throw error;
    }
    return defaultData;
  }
}

export async function saveData(data: AppData) {
  if (Platform.OS === "web") {
    webLocalStorage()?.setItem(WEB_KEY, JSON.stringify(data));
    return;
  }
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

function parseStoredData(raw: string): AppData {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Stored planner data must be a JSON object.");
  }
  return normalizeData(parsed as Partial<AppData>);
}

function webLocalStorage(): Storage | null {
  const maybeStorage = (globalThis as unknown as { localStorage?: Storage }).localStorage;
  return maybeStorage && typeof maybeStorage.getItem === "function" ? maybeStorage : null;
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
    dueDate: cleanText(task.dueDate, dateKey(new Date())),
    time: cleanText(task.time, "11:59 PM"),
    estimateMinutes: Number.isFinite(task.estimateMinutes) ? Number(task.estimateMinutes) : 45,
    done: Boolean(task.done),
    urgent: Boolean(task.urgent),
    source: cleanText(task.source, "Imported"),
    priority: task.priority,
    description: task.description,
    recurringId: task.recurringId,
    recurrenceIndex: Number.isFinite(task.recurrenceIndex) ? Number(task.recurrenceIndex) : undefined,
    recurrenceEndDate: task.recurrenceEndDate,
    userEditedAt: task.userEditedAt,
    subtasks: Array.isArray(task.subtasks) ? task.subtasks.map((subtask) => ({ title: cleanText(subtask.title, "Step"), done: Boolean(subtask.done) })) : [],
    weight: task.weight,
    score: task.score,
    missing: task.missing,
  };
}

function normalizeExam(exam: Partial<ExamItem>, index: number): ExamItem {
  return {
    id: cleanText(exam.id, `exam_${index}`),
    classId: cleanText(exam.classId, ""),
    title: cleanText(exam.title, "Untitled assessment"),
    dueOffset: Number.isFinite(exam.dueOffset) ? Number(exam.dueOffset) : 0,
    dueDate: cleanText(exam.dueDate, dateKey(new Date())),
    time: cleanText(exam.time, "9:00 AM"),
    room: cleanText(exam.room, "Room TBD"),
    kind: exam.kind,
    description: exam.description,
    effortMinutes: Number.isFinite(exam.effortMinutes) ? Number(exam.effortMinutes) : undefined,
    priority: exam.priority,
    notes: exam.notes,
    userEditedAt: exam.userEditedAt,
    topics: Array.isArray(exam.topics) ? exam.topics.filter((topic): topic is string => typeof topic === "string") : [],
    weight: exam.weight,
    score: exam.score,
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
  const storedAppearanceMode = (incomingPrefs as any).appearanceMode;
  const hasStoredAppearanceMode = Object.prototype.hasOwnProperty.call(incomingPrefs, "appearanceMode");
  const legacyTheme = (incomingPrefs as any).theme;
  const appearanceMode: AppearanceMode = storedAppearanceMode === "system" || storedAppearanceMode === "light" || storedAppearanceMode === "dark"
    ? storedAppearanceMode
    : !hasStoredAppearanceMode && ["dark", "neon", "athlete"].includes(legacyTheme)
      ? "dark"
      : "system";
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
      scanIntent: cleanText((incomingPrefs as any).scanIntent, defaultData.prefs.scanIntent || "Scan with camera"),
      appearanceMode,
      onboardingComplete,
      osLive: cleanBoolean((incomingPrefs as any).osLive),
      premium: false,
      premiumProductId: undefined,
      premiumCheckedAt: undefined,
    },
    classes: Array.isArray(data?.classes) ? data.classes.filter(Boolean) as ClassItem[] : [],
    tasks: Array.isArray(data?.tasks) ? data.tasks.filter(Boolean).map((task, index) => normalizeTask(task, index)) : [],
    exams: Array.isArray(data?.exams) ? data.exams.filter(Boolean).map((exam, index) => normalizeExam(exam, index)) : [],
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

function hasImportTitle(candidate: ImportBatch["candidates"][number]) {
  if (!candidate.title.trim()) return false;
  const payload = candidate.payload as Record<string, unknown>;
  if (candidate.kind === "class") {
    return typeof payload.code === "string" && Boolean(payload.code.trim()) && typeof payload.name === "string" && Boolean(payload.name.trim());
  }
  return typeof payload.title === "string" && Boolean(payload.title.trim());
}

function hasValidImportTime(candidate: ImportBatch["candidates"][number]) {
  if (candidate.kind === "note") return true;
  const time = (candidate.payload as Record<string, unknown>).time;
  if (time == null || time === "") return true;
  if (typeof time !== "string") return false;
  const clean = time.trim();
  if (!clean) return true;
  if (/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(clean)) return true;
  const twelveHour = /^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i.exec(clean);
  return Boolean(twelveHour && Number(twelveHour[1]) >= 1 && Number(twelveHour[1]) <= 12);
}

function importClassId(candidate: ImportBatch["candidates"][number]) {
  const payloadClassId = (candidate.payload as Record<string, unknown>).classId;
  if (typeof payloadClassId === "string" && payloadClassId.trim()) return payloadClassId.trim();
  return typeof candidate.classId === "string" ? candidate.classId.trim() : "";
}

export function applyImport(data: AppData, batch: ImportBatch): AppData {
  // The review layer prevents these rows from being approved, but storage is
  // deliberately defensive because recovery files can outlive an app build.
  const approved = batch.candidates.filter((candidate) => candidate.approved && hasImportTitle(candidate) && hasValidImportTime(candidate));
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
  const classIds = new Set(classes.map((klass) => klass.id));
  const appliedCandidateIds = new Set<string>();

  // Resolve real classes before dependent rows so candidate ordering cannot
  // decide whether an assignment becomes orphaned.
  approved.forEach((candidate) => {
    if (candidate.kind !== "class") return;
    const payload = candidate.payload as Partial<ClassItem>;
    const id = typeof payload.id === "string" ? payload.id.trim() : importClassId(candidate);
    const code = typeof payload.code === "string" ? payload.code.trim() : "";
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    if (!id || !code || !name || classIds.has(id) || classCodes.has(code.toLowerCase())) return;
    classes.push({ ...payload, id, code, name } as ClassItem);
    classIds.add(id);
    classCodes.add(code.toLowerCase());
    appliedCandidateIds.add(candidate.id);
  });

  approved.forEach((candidate) => {
    if (candidate.kind === "class") return;
    const ownerId = importClassId(candidate);
    // Never silently attach an orphan to the first class and never invent a
    // fallback class/schedule. The row remains recoverable in import history.
    if (!ownerId || !classIds.has(ownerId)) return;
    const dueDate = typeof candidate.payload.dueDate === "string" ? candidate.payload.dueDate : "";
    if (candidate.kind === "task" && candidate.payload.title && isValidDateInput(dueDate)) {
      const title = candidate.payload.title.trim();
      const key = `${title.toLowerCase()}-${candidate.payload.dueDate}`;
      if (!taskTitles.has(key)) {
        tasks.push({ ...candidate.payload, title, classId: ownerId } as TaskItem);
        taskTitles.add(key);
        appliedCandidateIds.add(candidate.id);
      }
    }
    if (candidate.kind === "exam" && candidate.payload.title && isValidDateInput(dueDate)) {
      const title = candidate.payload.title.trim();
      const key = `${title.toLowerCase()}-${candidate.payload.dueDate}`;
      if (!examTitles.has(key)) {
        exams.push({ ...candidate.payload, title, classId: ownerId } as ExamItem);
        examTitles.add(key);
        appliedCandidateIds.add(candidate.id);
      }
    }
    if (candidate.kind === "note" && candidate.payload.title) {
      const note = candidate.payload as any;
      const title = note.title.trim();
      const key = `${title.toLowerCase()}-${(note.sourceText || "").slice(0, 80).toLowerCase()}`;
      if (!noteKeys.has(key)) {
        notes.unshift({ ...note, title, classId: ownerId, sourceText: note.sourceText || "", terms: note.terms || [], suggestedTasks: note.suggestedTasks || [] });
        noteKeys.add(key);
        appliedCandidateIds.add(candidate.id);
      }
    }
  });

  const appliedCandidates = batch.candidates.map((candidate) => appliedCandidateIds.has(candidate.id) ? candidate : { ...candidate, approved: false });

  const updated: AppData = {
    ...data,
    prefs: { ...data.prefs, osLive: true },
    classes,
    tasks,
    exams,
    notes,
    imports: [{ ...batch, status: "applied" as const, candidates: appliedCandidates }, ...data.imports.filter((item) => item.id !== batch.id)].slice(0, 12),
  };
  const planned = { ...updated, studyBlocks: buildStudyPlan(updated) };
  const action = approved.some((candidate) => candidate.kind === "note" && appliedCandidateIds.has(candidate.id)) ? "importNotes" : "importSyllabus";
  return appendFeedbackEvent(data, planned, action, {
    message: `${appliedCandidateIds.size} items imported.`,
    dimension: action === "importNotes" ? "preparedness" : undefined,
  });
}
