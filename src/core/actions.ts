import { createInitialAppState } from "./sampleData";
import type { Assignment, Course, ParsedImport, ParsedItem, SyllabusParseResult } from "../models";
import type { AppSettings, AppState, ClassCourse, Note, NoteScanDraft, ReminderSettings, Student, Task, TaskType, WidgetSettings, WidgetType } from "./types";
import { getDefaultWidgetSettings, normalizeWidgetSettings } from "./widgetEngine";

export type AddTaskInput = Omit<Task, "id" | "completed" | "createdAt" | "updatedAt"> & {
  id?: string;
  completed?: boolean;
};

export type AddNoteInput = Omit<Note, "id" | "createdAt" | "updatedAt" | "status"> & {
  id?: string;
  status?: Note["status"];
};

export function addTask(state: AppState, input: AddTaskInput): AppState {
  const now = new Date().toISOString();
  const task: Task = {
    id: input.id ?? `task-${Date.now()}`,
    title: input.title,
    classId: input.classId,
    type: input.type,
    dueDate: input.dueDate,
    dueTime: input.dueTime,
    priority: input.priority,
    reminder: input.reminder,
    completed: input.completed ?? false,
    createdAt: now,
    updatedAt: now
  };
  return { ...state, tasks: [task, ...state.tasks] };
}

export function updateTask(state: AppState, id: string, patch: Partial<Task>): AppState {
  const updatedAt = new Date().toISOString();
  return {
    ...state,
    tasks: state.tasks.map((task) => task.id === id ? { ...task, ...patch, updatedAt } : task)
  };
}

export function toggleTaskComplete(state: AppState, id: string): AppState {
  return {
    ...state,
    tasks: state.tasks.map((task) => task.id === id ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() } : task)
  };
}

export function deleteTask(state: AppState, id: string): AppState {
  return { ...state, tasks: state.tasks.filter((task) => task.id !== id) };
}

export function addNote(state: AppState, input: AddNoteInput): AppState {
  const now = new Date().toISOString();
  const note: Note = {
    id: input.id ?? `note-${Date.now()}`,
    title: input.title,
    classId: input.classId,
    body: input.body,
    summary: input.summary,
    keyIdeas: input.keyIdeas,
    reviewReminderId: input.reviewReminderId,
    tags: input.tags,
    status: input.status ?? "draft",
    createdAt: now,
    updatedAt: now
  };
  return { ...state, notes: [note, ...state.notes] };
}

export function updateNote(state: AppState, id: string, patch: Partial<Note>): AppState {
  const updatedAt = new Date().toISOString();
  return {
    ...state,
    notes: state.notes.map((note) => note.id === id ? { ...note, ...patch, updatedAt } : note)
  };
}

export function deleteNote(state: AppState, id: string): AppState {
  return { ...state, notes: state.notes.filter((note) => note.id !== id) };
}

export function updateWidgetSettings(state: AppState, widgetType: WidgetType, settings: Partial<WidgetSettings>): AppState {
  const current = state.widgetSettings[widgetType] ?? getDefaultWidgetSettings(widgetType);
  return {
    ...state,
    widgetSettings: {
      ...state.widgetSettings,
      [widgetType]: normalizeWidgetSettings({ ...current, ...settings, widgetType, updatedAt: new Date().toISOString() })
    }
  };
}

export function resetWidgetSettings(state: AppState, widgetType: WidgetType): AppState {
  return {
    ...state,
    widgetSettings: {
      ...state.widgetSettings,
      [widgetType]: { ...getDefaultWidgetSettings(widgetType), updatedAt: new Date().toISOString() }
    }
  };
}

export function updateAppSettings(state: AppState, patch: Partial<AppSettings>): AppState {
  return { ...state, appSettings: { ...state.appSettings, ...patch } };
}

export function updateStudent(state: AppState, patch: Partial<Student>): AppState {
  return { ...state, student: { ...state.student, ...patch } };
}

export function updateClassReminder(state: AppState, classId: string, reminderSettings: ReminderSettings): AppState {
  return {
    ...state,
    classes: state.classes.map((course) => course.id === classId ? { ...course, reminderSettings } : course)
  };
}

export function completeOnboarding(state: AppState): AppState {
  return { ...state, onboardingComplete: true };
}

export function resetOnboarding(state: AppState): AppState {
  return { ...state, onboardingComplete: false, scannerState: createInitialAppState().scannerState };
}

export function runScannerDemo(state: AppState): AppState {
  const nextStep = Math.min(state.scannerState.stepIndex + 1, 5);
  return {
    ...state,
    scannerState: {
      status: nextStep >= 5 ? "complete" : "running",
      stepIndex: nextStep,
      completedAt: nextStep >= 5 ? new Date().toISOString() : null
    }
  };
}

export function markScannerComplete(state: AppState): AppState {
  return {
    ...state,
    scannerState: { status: "complete", stepIndex: 5, completedAt: new Date().toISOString() }
  };
}

export function upsertParsedImport(state: AppState, parsedImport: ParsedImport): AppState {
  const exists = state.parsedImports.some((item) => item.id === parsedImport.id);
  return {
    ...state,
    parsedImports: exists
      ? state.parsedImports.map((item) => item.id === parsedImport.id ? parsedImport : item)
      : [parsedImport, ...state.parsedImports],
    scannerState: {
      ...state.scannerState,
      status: parsedImport.status === "failed" || parsedImport.status === "error" ? "idle" : "review",
      activeImportId: parsedImport.id,
      lastError: parsedImport.errorMessage
    }
  };
}

export function upsertParsedItemsForImport(state: AppState, parsedImportId: string, parsedItems: ParsedItem[]): AppState {
  return {
    ...state,
    parsedItems: [
      ...parsedItems,
      ...state.parsedItems.filter((item) => item.parsedImportId !== parsedImportId)
    ]
  };
}

export function setActiveParseResult(state: AppState, parseResult: SyllabusParseResult | null): AppState {
  return {
    ...state,
    activeParseResult: parseResult,
    scannerState: {
      ...state.scannerState,
      status: parseResult ? "review" : state.scannerState.status,
      activeImportId: parseResult?.sourceImportId ?? state.scannerState.activeImportId
    }
  };
}

export function applyParsedSyllabus(state: AppState, parseResult: SyllabusParseResult): AppState {
  const now = new Date().toISOString();
  const classMap = buildClassMap(state.classes, parseResult.courses);
  const importedClasses = parseResult.courses
    .filter((course) => !state.classes.some((existing) => sameClass(existing, course)))
    .map((course, index) => courseToClassCourse(course, index, now));
  const existingTaskIds = new Set(state.tasks.map((task) => task.id));
  const importedTasks = parseResult.assignments
    .filter((assignment) => assignment.kind !== "exam")
    .map((assignment, index) => assignmentToTask(assignment, classMap, index, now))
    .filter((task) => !existingTaskIds.has(task.id));
  const existingExamIds = new Set(state.exams.map((exam) => exam.id));
  const importedExams = parseResult.assignments
    .filter((assignment) => assignment.kind === "exam")
    .map((assignment, index) => assignmentToExam(assignment, classMap, index))
    .filter((exam) => !existingExamIds.has(exam.id));
  const sourceNote = buildImportNote(parseResult, classMap, now);
  const sourceImportId = parseResult.sourceImportId;

  return {
    ...state,
    classes: [...state.classes, ...importedClasses],
    tasks: [...importedTasks, ...state.tasks],
    exams: [...importedExams, ...state.exams],
    notes: sourceNote ? [sourceNote, ...state.notes] : state.notes,
    parsedImports: state.parsedImports.map((item) =>
      item.id === sourceImportId ? { ...item, status: "applied", updatedAt: now } : item
    ),
    parsedItems: state.parsedItems.map((item) =>
      item.parsedImportId === sourceImportId ? { ...item, reviewStatus: "accepted", acceptedAt: now } : item
    ),
    activeParseResult: null,
    scannerState: {
      status: "complete",
      stepIndex: 5,
      completedAt: now,
      activeImportId: sourceImportId,
      lastAppliedImportId: sourceImportId
    }
  };
}

export function addNoteScanDraft(state: AppState, draft: NoteScanDraft): AppState {
  return {
    ...state,
    noteScanDrafts: [draft, ...state.noteScanDrafts.filter((item) => item.id !== draft.id)]
  };
}

export function applyNoteScanDraft(state: AppState, draftId: string): AppState {
  const draft = state.noteScanDrafts.find((item) => item.id === draftId);
  if (!draft) return state;
  const noteState = addNote(state, {
    title: draft.title,
    classId: draft.classId,
    body: draft.body,
    summary: draft.summary,
    keyIdeas: draft.keyIdeas,
    tags: draft.tags,
    status: "draft"
  });
  const taskState = draft.taskTitle
    ? addTask(noteState, {
        title: draft.taskTitle,
        classId: draft.classId,
        type: "Homework",
        dueDate: draft.taskDueDate || new Date().toISOString().slice(0, 10),
        dueTime: draft.taskDueTime || "23:59",
        priority: "Medium",
        reminder: "From scanned note"
      })
    : noteState;

  return {
    ...taskState,
    noteScanDrafts: taskState.noteScanDrafts.filter((item) => item.id !== draftId)
  };
}

function buildClassMap(existingClasses: ClassCourse[], courses: Course[]) {
  const map = new Map<string, string>();
  for (const course of courses) {
    const existing = existingClasses.find((item) => sameClass(item, course));
    const nextId = existing?.id || coreClassId(course);
    map.set(course.id, nextId);
  }
  return map;
}

function sameClass(existing: ClassCourse, course: Course) {
  const code = course.code?.trim().toLowerCase();
  const name = course.name?.trim().toLowerCase();
  return (
    existing.id === coreClassId(course) ||
    existing.title.trim().toLowerCase() === name ||
    existing.title.trim().toLowerCase() === code
  );
}

function courseToClassCourse(course: Course, index: number, now: string): ClassCourse {
  const firstMeeting = course.meetings[0];
  const colors: ClassCourse["accent"][] = ["blue", "mint", "violet", "orange", "cyan", "rose"];
  return {
    id: coreClassId(course),
    title: course.name || course.code || "Imported class",
    professor: course.instructor || course.teacher || "Instructor",
    room: firstMeeting?.location || course.room || "Room TBD",
    days: course.meetings.length ? course.meetings.map((meeting) => meeting.day) : ["Mon", "Wed"],
    startTime: firstMeeting?.startTime || "09:00",
    endTime: firstMeeting?.endTime || "09:50",
    accent: colors[index % colors.length] ?? "blue",
    pulse: 82,
    reminderSettings: {
      enabled: true,
      minutesBefore: 15,
      showRoom: true,
      bringItems: ["Notebook"],
      customText: `Imported ${now.slice(0, 10)}`
    }
  };
}

function assignmentToTask(assignment: Assignment, classMap: Map<string, string>, index: number, now: string): Task {
  return {
    id: `scan-task-${assignment.id || index}`,
    title: assignment.title,
    classId: classMap.get(assignment.courseId) || assignment.courseId,
    type: taskTypeForAssignment(assignment.kind),
    dueDate: dayFromDueAt(assignment.dueAt),
    dueTime: timeFromDueAt(assignment.dueAt),
    priority: assignment.priority === "high" ? "High" : assignment.priority === "low" ? "Low" : "Medium",
    reminder: assignment.reminder?.enabled ? `${assignment.reminder.leadTimeHours}h before` : "From scan",
    completed: assignment.status === "done",
    createdAt: assignment.createdAt || now,
    updatedAt: assignment.updatedAt || now
  };
}

function assignmentToExam(assignment: Assignment, classMap: Map<string, string>, index: number) {
  return {
    id: `scan-exam-${assignment.id || index}`,
    title: assignment.title,
    classId: classMap.get(assignment.courseId) || assignment.courseId,
    date: dayFromDueAt(assignment.dueAt),
    time: timeFromDueAt(assignment.dueAt)
  };
}

function buildImportNote(parseResult: SyllabusParseResult, classMap: Map<string, string>, now: string): Note | null {
  if (!parseResult.assignments.length && !parseResult.findings.length) return null;
  const firstCourse = parseResult.courses[0];
  return {
    id: `scan-note-${parseResult.sourceImportId || Date.now()}`,
    title: `${parseResult.sourceName} import`,
    classId: firstCourse ? classMap.get(firstCourse.id) || coreClassId(firstCourse) : "",
    body: [
      `${parseResult.assignments.length} reviewed item(s) imported from ${parseResult.sourceName}.`,
      ...parseResult.findings.map((finding) => finding.message)
    ].join("\n"),
    summary: `${parseResult.assignments.length} item(s), ${parseResult.courses.length} class(es), ${parseResult.gradeItems.length} grade row(s).`,
    keyIdeas: parseResult.findings.slice(0, 4).map((finding) => finding.message),
    tags: ["import", parseResult.sourceType || "typed"],
    status: "draft",
    createdAt: now,
    updatedAt: now
  };
}

function coreClassId(course: Course) {
  return `scan-class-${slugify(course.id || course.code || course.name || "class")}`;
}

function taskTypeForAssignment(kind: Assignment["kind"]): TaskType {
  if (kind === "reading") return "Reading";
  if (kind === "project") return "Project";
  if (kind === "worksheet") return "Homework";
  return "Homework";
}

function dayFromDueAt(dueAt: string) {
  return validDate(dueAt).slice(0, 10);
}

function timeFromDueAt(dueAt: string) {
  const date = new Date(validDate(dueAt));
  if (Number.isNaN(date.getTime())) return "23:59";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function validDate(value: string) {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "item";
}
