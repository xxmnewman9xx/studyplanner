import { WidgetStylePresetId, widgetStylePresets } from "../theme";
import { loadJson, saveJson } from "./storage";

export type WidgetSizePreference = "small" | "medium" | "lock";
export type WidgetFocusPreference =
  | "nextDue"
  | "thisWeek"
  | "monthly"
  | "heavyWeek"
  | "courseFocus"
  | "lockScreen";

export type WidgetPreferences = {
  size: WidgetSizePreference;
  focus: WidgetFocusPreference;
  styleId: WidgetStylePresetId;
};

export const widgetPreferencesStorageKey = "study-planner-widget-preferences-v1";

export const defaultWidgetPreferences: WidgetPreferences = {
  size: "medium",
  focus: "thisWeek",
  styleId: "cleanWhite"
};

const widgetSizes: WidgetSizePreference[] = ["small", "medium", "lock"];
const widgetFocuses: WidgetFocusPreference[] = [
  "nextDue",
  "thisWeek",
  "monthly",
  "heavyWeek",
  "courseFocus",
  "lockScreen"
];

export function normalizeWidgetPreferences(
  value: Partial<WidgetPreferences> | null | undefined
): WidgetPreferences {
  return {
    size: isWidgetSize(value?.size) ? value.size : defaultWidgetPreferences.size,
    focus: isWidgetFocus(value?.focus) ? value.focus : defaultWidgetPreferences.focus,
    styleId: isWidgetStylePresetId(value?.styleId)
      ? value.styleId
      : defaultWidgetPreferences.styleId
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

function isWidgetStylePresetId(value: unknown): value is WidgetStylePresetId {
  return (
    typeof value === "string" &&
    widgetStylePresets.some((preset) => preset.id === value)
  );
}
