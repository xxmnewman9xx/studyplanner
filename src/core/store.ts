import { useCallback, useEffect, useMemo, useState } from "react";
import * as coreActions from "./actions";
import { createInitialAppState } from "./sampleData";
import type { AppSettings, AppState, Note, ReminderSettings, Task, WidgetSettings, WidgetType } from "./types";
import { LocalStudyPlannerRepository, type StudyPlannerRepository } from "./repository";

const repository = new LocalStudyPlannerRepository();

export function useStudyPlannerStore(repo: StudyPlannerRepository = repository) {
  const [state, setState] = useState<AppState>(() => createInitialAppState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    repo.loadState().then((loaded) => {
      if (!active) return;
      setState(loaded);
      setHydrated(true);
    }).catch(() => {
      if (!active) return;
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [repo]);

  const commit = useCallback((reducer: (current: AppState) => AppState) => {
    setState((current) => {
      const next = reducer(current);
      void repo.saveState(next);
      return next;
    });
  }, [repo]);

  const actions = useMemo(() => ({
    addTask: (input: coreActions.AddTaskInput) => commit((current) => coreActions.addTask(current, input)),
    updateTask: (id: string, patch: Partial<Task>) => commit((current) => coreActions.updateTask(current, id, patch)),
    toggleTaskComplete: (id: string) => commit((current) => coreActions.toggleTaskComplete(current, id)),
    deleteTask: (id: string) => commit((current) => coreActions.deleteTask(current, id)),
    addNote: (input: coreActions.AddNoteInput) => commit((current) => coreActions.addNote(current, input)),
    updateNote: (id: string, patch: Partial<Note>) => commit((current) => coreActions.updateNote(current, id, patch)),
    deleteNote: (id: string) => commit((current) => coreActions.deleteNote(current, id)),
    updateWidgetSettings: (widgetType: WidgetType, settings: Partial<WidgetSettings>) => commit((current) => coreActions.updateWidgetSettings(current, widgetType, settings)),
    resetWidgetSettings: (widgetType: WidgetType) => commit((current) => coreActions.resetWidgetSettings(current, widgetType)),
    updateAppSettings: (patch: Partial<AppSettings>) => commit((current) => coreActions.updateAppSettings(current, patch)),
    updateClassReminder: (classId: string, reminderSettings: ReminderSettings) => commit((current) => coreActions.updateClassReminder(current, classId, reminderSettings)),
    completeOnboarding: () => commit(coreActions.completeOnboarding),
    resetOnboarding: () => commit(coreActions.resetOnboarding),
    runScannerDemo: () => commit(coreActions.runScannerDemo),
    markScannerComplete: () => commit(coreActions.markScannerComplete),
    resetAppState: () => {
      void repo.resetState().then((next) => setState(next));
    }
  }), [commit, repo]);

  return { state, hydrated, actions };
}

export type StudyPlannerActions = ReturnType<typeof useStudyPlannerStore>["actions"];
