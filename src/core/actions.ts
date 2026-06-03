import { createInitialAppState } from "./sampleData";
import type { AppSettings, AppState, Note, ReminderSettings, Task, WidgetSettings, WidgetType } from "./types";
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
