import type {
  WidgetDataMode,
  WidgetKind,
  WidgetLayout,
  WidgetPreset,
  WidgetSize,
  WidgetTheme,
  WidgetType
} from "../models";
import { resolveWidgetTheme, widgetThemeChoiceFromPreset } from "./widgetThemes";

export type NativeWidgetSnapshotKind = "today" | "upcoming" | "week" | "class_progress";

export type ShippedWidgetDefinition = {
  kind: WidgetKind;
  nativeKind: NativeWidgetSnapshotKind;
  nativeModuleName: string;
  nativeName: string;
  job: string;
  type: WidgetType;
  defaultSize: WidgetSize;
  defaultTheme: WidgetTheme;
  defaultLayout: WidgetLayout;
  defaultDataMode: WidgetDataMode;
  layouts: WidgetLayout[];
  dataModes: WidgetDataMode[];
  iconKey: string;
};

export const shippedWidgetKinds: WidgetKind[] = ["today", "upcoming", "week", "classProgress"];

export const shippedWidgetDefinitions: Record<WidgetKind, ShippedWidgetDefinition> = {
  today: {
    kind: "today",
    nativeKind: "today",
    nativeModuleName: "StudyPlannerTodayWidget",
    nativeName: "StudyPlanner Today",
    job: "What do I need to do today?",
    type: "today",
    defaultSize: "medium",
    defaultTheme: "light",
    defaultLayout: "list",
    defaultDataMode: "today",
    layouts: ["compact", "list", "progress"],
    dataModes: ["today", "urgent_only", "next_up", "single_class"],
    iconKey: "check"
  },
  upcoming: {
    kind: "upcoming",
    nativeKind: "upcoming",
    nativeModuleName: "StudyPlannerUpcomingWidget",
    nativeName: "StudyPlanner Upcoming",
    job: "What deadline is coming next?",
    type: "due_next",
    defaultSize: "small",
    defaultTheme: "ocean",
    defaultLayout: "timeline",
    defaultDataMode: "next3",
    layouts: ["list", "timeline", "compact"],
    dataModes: ["next3", "this_week", "urgent_only", "single_class"],
    iconKey: "calendar"
  },
  week: {
    kind: "week",
    nativeKind: "week",
    nativeModuleName: "StudyPlannerWeekWidget",
    nativeName: "StudyPlanner Week",
    job: "How heavy is this week?",
    type: "week",
    defaultSize: "medium",
    defaultTheme: "graphite",
    defaultLayout: "strip",
    defaultDataMode: "this_week",
    layouts: ["strip", "calendar", "summary"],
    dataModes: ["this_week", "urgent_only", "all_classes", "single_class"],
    iconKey: "calendar"
  },
  classProgress: {
    kind: "classProgress",
    nativeKind: "class_progress",
    nativeModuleName: "StudyPlannerClassProgressWidget",
    nativeName: "StudyPlanner Class Progress",
    job: "How am I doing in this class?",
    type: "class_focus",
    defaultSize: "small",
    defaultTheme: "forest",
    defaultLayout: "progress",
    defaultDataMode: "single_class",
    layouts: ["progress", "next_task", "summary"],
    dataModes: ["single_class"],
    iconKey: "book"
  }
};

export function widgetKindForType(type: WidgetType): WidgetKind {
  if (type === "today") return "today";
  if (type === "week") return "week";
  if (type === "class_focus") return "classProgress";
  return "upcoming";
}

export function widgetKindForPreset(preset?: Pick<WidgetPreset, "widgetKind" | "type">): WidgetKind {
  if (!preset) return "today";
  return preset.widgetKind || widgetKindForType(preset.type);
}

export function widgetTypeForKind(kind: WidgetKind): WidgetType {
  return shippedWidgetDefinitions[kind].type;
}

export function nativeSnapshotKindForWidgetKind(kind: WidgetKind): NativeWidgetSnapshotKind {
  return shippedWidgetDefinitions[kind].nativeKind;
}

export function nativeNameForWidgetKind(kind: WidgetKind): string {
  return shippedWidgetDefinitions[kind].nativeName;
}

export function widgetPresetIdForKind(kind: WidgetKind): string {
  return `preset-${kind.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

export function defaultDataModeForWidgetKind(kind: WidgetKind): WidgetDataMode {
  return shippedWidgetDefinitions[kind].defaultDataMode;
}

export function defaultLayoutForWidgetKind(kind: WidgetKind): WidgetLayout {
  return shippedWidgetDefinitions[kind].defaultLayout;
}

export function isValidDataModeForWidgetKind(kind: WidgetKind, dataMode?: WidgetDataMode) {
  return Boolean(dataMode && shippedWidgetDefinitions[kind].dataModes.includes(dataMode));
}

export function isValidLayoutForWidgetKind(kind: WidgetKind, layout?: WidgetLayout) {
  return Boolean(layout && shippedWidgetDefinitions[kind].layouts.includes(layout));
}

export function isNativeWidgetPreset(preset: Pick<WidgetPreset, "type" | "size" | "widgetKind">) {
  const kind = widgetKindForPreset(preset);
  return shippedWidgetDefinitions[kind].type === preset.type && (preset.size === "small" || preset.size === "medium");
}

export function buildCanonicalWidgetPreset(
  kind: WidgetKind,
  patch: Partial<WidgetPreset> = {},
  now = new Date()
): WidgetPreset {
  const definition = shippedWidgetDefinitions[kind];
  const theme = (
    patch.theme ||
    (patch.background && patch.palette
      ? widgetThemeChoiceFromPreset({ background: patch.background, palette: patch.palette })
      : undefined) ||
    definition.defaultTheme
  ) as WidgetTheme;
  const style = resolveWidgetTheme(theme);
  const timestamp = now.toISOString();
  const patchDataMode = patch.dataMode;
  const patchLayout = patch.layout;
  const dataMode: WidgetDataMode = isValidDataModeForWidgetKind(kind, patchDataMode)
    ? patchDataMode as WidgetDataMode
    : definition.defaultDataMode;
  const layout: WidgetLayout = isValidLayoutForWidgetKind(kind, patchLayout)
    ? patchLayout as WidgetLayout
    : definition.defaultLayout;
  const classFocusCourseId =
    dataMode === "single_class" || kind === "classProgress"
      ? patch.classFocusCourseId
      : undefined;

  return {
    id: patch.id || widgetPresetIdForKind(kind),
    name: patch.name || definition.nativeName.replace("StudyPlanner ", ""),
    widgetKind: kind,
    type: definition.type,
    size: patch.size === "small" || patch.size === "medium" ? patch.size : definition.defaultSize,
    theme,
    background: patch.background || style.background,
    palette: patch.palette || style.palette,
    dataMode,
    font: patch.font || "SF Pro",
    classFocusCourseId,
    layout,
    iconKey: patch.iconKey || definition.iconKey,
    smartStackSlot: undefined,
    scheduleLabel: undefined,
    themePackId: patch.themePackId || theme,
    createdAt: patch.createdAt || timestamp,
    updatedAt: patch.updatedAt || timestamp,
    lastSyncedAt: patch.lastSyncedAt
  };
}

export function canonicalizeWidgetPreset(preset: WidgetPreset, now = new Date()): WidgetPreset {
  return buildCanonicalWidgetPreset(widgetKindForPreset(preset), preset, now);
}

export function ensureCanonicalWidgetPresets(presets: WidgetPreset[] = [], now = new Date()): WidgetPreset[] {
  return shippedWidgetKinds.map((kind) => {
    const definition = shippedWidgetDefinitions[kind];
    const matching = presets
      .filter((preset) => widgetKindForPreset(preset) === kind || preset.type === definition.type)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

    return matching
      ? canonicalizeWidgetPreset(matching, now)
      : buildCanonicalWidgetPreset(kind, undefined, now);
  });
}

export function replaceCanonicalWidgetPreset(
  presets: WidgetPreset[],
  preset: WidgetPreset,
  now = new Date()
) {
  const nextPreset = buildCanonicalWidgetPreset(widgetKindForPreset(preset), preset, now);
  const remaining = ensureCanonicalWidgetPresets(presets, now).filter(
    (item) => widgetKindForPreset(item) !== nextPreset.widgetKind
  );

  return [nextPreset, ...remaining];
}
