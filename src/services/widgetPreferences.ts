import { WidgetStylePresetId, widgetStylePresets } from "../theme";
import { loadJson, saveJson } from "./storage";

export type WidgetSizePreference = "small" | "medium";
export type WidgetFocusPreference =
  | "nextDue"
  | "today"
  | "needsReview"
  | "thisWeek"
  | "classFocus"
  | "empty";
export type WidgetLayoutPreference = "standard" | "compact";

export type WidgetPreferences = {
  size: WidgetSizePreference;
  focus: WidgetFocusPreference;
  styleId: WidgetStylePresetId;
  courseFocusId: "all" | string;
  layoutId: WidgetLayoutPreference;
};

export const widgetPreferencesStorageKey = "study-planner-widget-preferences-v1";

export const defaultWidgetPreferences: WidgetPreferences = {
  size: "medium",
  focus: "thisWeek",
  styleId: "glass",
  courseFocusId: "all",
  layoutId: "standard"
};

const widgetSizes: WidgetSizePreference[] = ["small", "medium"];
const widgetFocuses: WidgetFocusPreference[] = [
  "nextDue",
  "today",
  "needsReview",
  "thisWeek",
  "classFocus",
  "empty"
];
const widgetLayouts: WidgetLayoutPreference[] = ["standard", "compact"];

export function normalizeWidgetPreferences(
  value: Partial<WidgetPreferences> | null | undefined
): WidgetPreferences {
  return {
    size: isWidgetSize(value?.size) ? value.size : defaultWidgetPreferences.size,
    focus: isWidgetFocus(value?.focus) ? value.focus : defaultWidgetPreferences.focus,
    styleId: isWidgetStylePresetId(value?.styleId)
      ? value.styleId
      : defaultWidgetPreferences.styleId,
    courseFocusId: isCourseFocusId(value?.courseFocusId)
      ? value.courseFocusId
      : defaultWidgetPreferences.courseFocusId,
    layoutId: isWidgetLayout(value?.layoutId)
      ? value.layoutId
      : defaultWidgetPreferences.layoutId
  };
}

export async function loadWidgetPreferences(): Promise<WidgetPreferences> {
  const stored = await loadJson<Partial<WidgetPreferences>>(widgetPreferencesStorageKey);
  return normalizeWidgetPreferences(stored);
}

export async function saveWidgetPreferences(preferences: WidgetPreferences): Promise<void> {
  await saveJson(widgetPreferencesStorageKey, normalizeWidgetPreferences(preferences));
}

function isWidgetSize(value: unknown): value is WidgetSizePreference {
  return typeof value === "string" && widgetSizes.includes(value as WidgetSizePreference);
}

function isWidgetFocus(value: unknown): value is WidgetFocusPreference {
  return typeof value === "string" && widgetFocuses.includes(value as WidgetFocusPreference);
}

function isCourseFocusId(value: unknown): value is WidgetPreferences["courseFocusId"] {
  return typeof value === "string" && value.trim().length > 0;
}

function isWidgetLayout(value: unknown): value is WidgetLayoutPreference {
  return typeof value === "string" && widgetLayouts.includes(value as WidgetLayoutPreference);
}

function isWidgetStylePresetId(value: unknown): value is WidgetStylePresetId {
  return (
    typeof value === "string" &&
    widgetStylePresets.some((preset) => preset.id === value)
  );
}
