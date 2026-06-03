import type { AppSettings, AppState, Note, Task, WidgetSettings, WidgetType } from "./types";
import {
  hydrateAppState,
  persistAppState,
  persistNotes,
  persistSettings,
  persistTasks,
  persistWidgetSettings,
  resetAppState
} from "./storage";

export interface StudyPlannerRepository {
  loadState(): Promise<AppState>;
  saveState(state: AppState): Promise<void>;
  addTask(task: Task): Promise<void>;
  updateTask(id: string, patch: Partial<Task>): Promise<void>;
  addNote(note: Note): Promise<void>;
  updateNote(id: string, patch: Partial<Note>): Promise<void>;
  updateWidgetSettings(widgetType: WidgetType, settings: WidgetSettings): Promise<void>;
  updateSettings(patch: Partial<AppSettings>): Promise<void>;
  resetState(): Promise<AppState>;
}

export class LocalStudyPlannerRepository implements StudyPlannerRepository {
  private state: AppState | null = null;

  async loadState() {
    this.state = await hydrateAppState();
    return this.state;
  }

  async saveState(state: AppState) {
    this.state = state;
    await Promise.all([
      persistAppState(state),
      persistWidgetSettings(state.widgetSettings),
      persistTasks(state.tasks),
      persistNotes(state.notes),
      persistSettings(state.appSettings)
    ]);
  }

  async addTask(task: Task) {
    if (!this.state) return;
    await persistTasks([task, ...this.state.tasks]);
  }

  async updateTask(id: string, patch: Partial<Task>) {
    if (!this.state) return;
    await persistTasks(this.state.tasks.map((task) => task.id === id ? { ...task, ...patch } : task));
  }

  async addNote(note: Note) {
    if (!this.state) return;
    await persistNotes([note, ...this.state.notes]);
  }

  async updateNote(id: string, patch: Partial<Note>) {
    if (!this.state) return;
    await persistNotes(this.state.notes.map((note) => note.id === id ? { ...note, ...patch } : note));
  }

  async updateWidgetSettings(_widgetType: WidgetType, settings: WidgetSettings) {
    if (!this.state) return;
    await persistWidgetSettings({ ...this.state.widgetSettings, [settings.widgetType]: settings });
  }

  async updateSettings(patch: Partial<AppSettings>) {
    if (!this.state) return;
    await persistSettings({ ...this.state.appSettings, ...patch });
  }

  async resetState() {
    this.state = await resetAppState();
    return this.state;
  }
}
