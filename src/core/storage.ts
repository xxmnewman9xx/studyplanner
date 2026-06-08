import { loadJson, removeJson, saveJson } from "../services/storage";
import { createInitialAppState } from "./sampleData";
import type { ParsedImport, ParsedItem } from "../models";
import type { AppSettings, AppState, Note, NoteScanDraft, Task, WidgetSettings, WidgetType } from "./types";
import { mergeWidgetSettings } from "./widgetEngine";

export const storageVersion = 1;

export const storageKeys = {
  appState: "studyplanner:v1:appState",
  widgetSettings: "studyplanner:v1:widgetSettings",
  tasks: "studyplanner:v1:tasks",
  notes: "studyplanner:v1:notes",
  settings: "studyplanner:v1:settings",
  onboarding: "studyplanner:v1:onboarding",
  parsedImports: "studyplanner:v1:parsedImports",
  parsedItems: "studyplanner:v1:parsedItems",
  noteScanDrafts: "studyplanner:v1:noteScanDrafts"
} as const;

type StoredState = {
  version: number;
  state: AppState;
};

export async function hydrateAppState(): Promise<AppState> {
  const fallback = createInitialAppState();
  try {
    const stored = await loadJson<StoredState>(storageKeys.appState);
    const granular = await loadGranularState(fallback);
    if (!stored?.state) return migrateState({ ...fallback, ...granular });
    return migrateState({ ...fallback, ...stored.state, ...granular });
  } catch {
    return fallback;
  }
}

export async function persistAppState(state: AppState): Promise<void> {
  try {
    await saveJson(storageKeys.appState, { version: storageVersion, state });
  } catch {
    // Storage is best-effort for the prototype.
  }
}

export async function resetAppState(): Promise<AppState> {
  const next = createInitialAppState();
  try {
    await Promise.all(Object.values(storageKeys).map((key) => removeJson(key)));
    await persistAppState(next);
  } catch {
    // Ignore reset persistence failures.
  }
  return next;
}

export async function persistWidgetSettings(widgetSettings: Record<WidgetType, WidgetSettings>): Promise<void> {
  try {
    await saveJson(storageKeys.widgetSettings, { version: storageVersion, widgetSettings });
  } catch {
    // Ignore storage failures.
  }
}

export async function persistTasks(tasks: Task[]): Promise<void> {
  try {
    await saveJson(storageKeys.tasks, { version: storageVersion, tasks });
  } catch {
    // Ignore storage failures.
  }
}

export async function persistNotes(notes: Note[]): Promise<void> {
  try {
    await saveJson(storageKeys.notes, { version: storageVersion, notes });
  } catch {
    // Ignore storage failures.
  }
}

export async function persistSettings(settings: AppSettings): Promise<void> {
  try {
    await saveJson(storageKeys.settings, { version: storageVersion, settings });
  } catch {
    // Ignore storage failures.
  }
}

export async function persistParsedImports(parsedImports: ParsedImport[]): Promise<void> {
  try {
    await saveJson(storageKeys.parsedImports, { version: storageVersion, parsedImports });
  } catch {
    // Ignore storage failures.
  }
}

export async function persistParsedItems(parsedItems: ParsedItem[]): Promise<void> {
  try {
    await saveJson(storageKeys.parsedItems, { version: storageVersion, parsedItems });
  } catch {
    // Ignore storage failures.
  }
}

export async function persistNoteScanDrafts(noteScanDrafts: NoteScanDraft[]): Promise<void> {
  try {
    await saveJson(storageKeys.noteScanDrafts, { version: storageVersion, noteScanDrafts });
  } catch {
    // Ignore storage failures.
  }
}

async function loadGranularState(fallback: AppState): Promise<Partial<AppState>> {
  const [widgetRecord, taskRecord, noteRecord, settingsRecord, onboardingRecord, parsedImportRecord, parsedItemRecord, noteScanRecord] = await Promise.all([
    loadJson<{ version: number; widgetSettings: Record<WidgetType, WidgetSettings> }>(storageKeys.widgetSettings),
    loadJson<{ version: number; tasks: Task[] }>(storageKeys.tasks),
    loadJson<{ version: number; notes: Note[] }>(storageKeys.notes),
    loadJson<{ version: number; settings: AppSettings }>(storageKeys.settings),
    loadJson<{ version: number; onboardingComplete: boolean; scannerState?: AppState["scannerState"] }>(storageKeys.onboarding),
    loadJson<{ version: number; parsedImports: ParsedImport[] }>(storageKeys.parsedImports),
    loadJson<{ version: number; parsedItems: ParsedItem[] }>(storageKeys.parsedItems),
    loadJson<{ version: number; noteScanDrafts: NoteScanDraft[] }>(storageKeys.noteScanDrafts)
  ]);

  return {
    widgetSettings: widgetRecord?.widgetSettings ?? fallback.widgetSettings,
    tasks: Array.isArray(taskRecord?.tasks) ? taskRecord.tasks : fallback.tasks,
    notes: Array.isArray(noteRecord?.notes) ? noteRecord.notes : fallback.notes,
    appSettings: settingsRecord?.settings ?? fallback.appSettings,
    onboardingComplete: onboardingRecord?.onboardingComplete ?? fallback.onboardingComplete,
    scannerState: onboardingRecord?.scannerState ?? fallback.scannerState,
    parsedImports: Array.isArray(parsedImportRecord?.parsedImports) ? parsedImportRecord.parsedImports : fallback.parsedImports,
    parsedItems: Array.isArray(parsedItemRecord?.parsedItems) ? parsedItemRecord.parsedItems : fallback.parsedItems,
    noteScanDrafts: Array.isArray(noteScanRecord?.noteScanDrafts) ? noteScanRecord.noteScanDrafts : fallback.noteScanDrafts
  };
}

function migrateState(state: AppState): AppState {
  const fallback = createInitialAppState();
  const widgetSettings = Object.keys(fallback.widgetSettings).reduce((all, key) => {
    const type = key as WidgetType;
    all[type] = mergeWidgetSettings(fallback.widgetSettings[type], state.widgetSettings?.[type]);
    return all;
  }, {} as Record<WidgetType, WidgetSettings>);

  return {
    ...fallback,
    ...state,
    student: { ...fallback.student, ...state.student },
    classes: Array.isArray(state.classes) ? state.classes : fallback.classes,
    tasks: Array.isArray(state.tasks) ? state.tasks : fallback.tasks,
    notes: Array.isArray(state.notes) ? state.notes : fallback.notes,
    exams: Array.isArray(state.exams) ? state.exams : fallback.exams,
    parsedImports: Array.isArray(state.parsedImports) ? state.parsedImports : fallback.parsedImports,
    parsedItems: Array.isArray(state.parsedItems) ? state.parsedItems : fallback.parsedItems,
    activeParseResult: state.activeParseResult ?? null,
    noteScanDrafts: Array.isArray(state.noteScanDrafts) ? state.noteScanDrafts : fallback.noteScanDrafts,
    widgetSettings,
    appSettings: { ...fallback.appSettings, ...state.appSettings },
    scannerState: { ...fallback.scannerState, ...state.scannerState }
  };
}
