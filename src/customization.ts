import type {
  Assignment,
  Course,
  StudioAccentRole,
  StudioCustomization,
  WidgetBackground,
  WidgetDataMode,
  WidgetKind,
  WidgetLayout,
  WidgetPalette,
  WidgetStudioContentType,
  WidgetStudioSetting,
  WidgetStudioSize,
  WidgetStudioStyle,
  WidgetStudioSurface,
  WidgetTheme
} from "./models";

export const studioClassColors = [
  "#1476FF",
  "#FF5A1F",
  "#21B8A7",
  "#22C55E",
  "#8B3DFF",
  "#EC4899",
  "#F59E0B",
  "#111827"
];

export const studioAccentColors = [
  "#1476FF",
  "#21B8A7",
  "#FF5A1F",
  "#22C55E",
  "#8B3DFF",
  "#EC4899"
];

export const studioClassIconOptions = [
  { key: "book", label: "Book" },
  { key: "calculator", label: "Math" },
  { key: "flask", label: "Lab" },
  { key: "globe", label: "History" },
  { key: "palette", label: "Art" },
  { key: "leaf", label: "Bio" },
  { key: "computer", label: "Code" },
  { key: "language", label: "Language" }
];

export type StudioWidgetDefinition = {
  id: WidgetStudioContentType;
  title: string;
  job: string;
  nativeKind: WidgetKind;
  dataMode: WidgetDataMode;
  layout: WidgetLayout;
  iconKey: string;
};

export const studioWidgetDefinitions: StudioWidgetDefinition[] = [
  {
    id: "exam_countdown",
    title: "Exam Countdown",
    job: "Days until the next exam.",
    nativeKind: "upcoming",
    dataMode: "urgent_only",
    layout: "compact",
    iconKey: "warning"
  },
  {
    id: "next_assignment",
    title: "Next Assignment",
    job: "The next piece of work to handle.",
    nativeKind: "upcoming",
    dataMode: "next3",
    layout: "timeline",
    iconKey: "calendar"
  },
  {
    id: "next_class",
    title: "Next Class",
    job: "The next class card in the day.",
    nativeKind: "today",
    dataMode: "today",
    layout: "compact",
    iconKey: "book"
  },
  {
    id: "focus_window",
    title: "Focus Window",
    job: "A study block ready to start.",
    nativeKind: "today",
    dataMode: "next_up",
    layout: "progress",
    iconKey: "focus"
  },
  {
    id: "semester_progress",
    title: "Semester Progress",
    job: "How far the semester has moved.",
    nativeKind: "week",
    dataMode: "this_week",
    layout: "summary",
    iconKey: "streak"
  },
  {
    id: "heavy_week_warning",
    title: "Future Risk",
    job: "The week that needs attention before it gets loud.",
    nativeKind: "week",
    dataMode: "urgent_only",
    layout: "strip",
    iconKey: "warning"
  },
  {
    id: "free_time_forecast",
    title: "Free Time Forecast",
    job: "A quick read on open space this week.",
    nativeKind: "week",
    dataMode: "this_week",
    layout: "calendar",
    iconKey: "calendar"
  },
  {
    id: "review_inbox_status",
    title: "Review Inbox Status",
    job: "How many imported items need approval.",
    nativeKind: "today",
    dataMode: "urgent_only",
    layout: "list",
    iconKey: "scan"
  },
  {
    id: "class_progress",
    title: "Class Progress",
    job: "Progress and next work for one class.",
    nativeKind: "classProgress",
    dataMode: "single_class",
    layout: "progress",
    iconKey: "book"
  }
];

const definitionByContent = studioWidgetDefinitions.reduce(
  (map, definition) => ({ ...map, [definition.id]: definition }),
  {} as Record<WidgetStudioContentType, StudioWidgetDefinition>
);

export function createDefaultStudioCustomization(now = new Date()): StudioCustomization {
  const timestamp = now.toISOString();
  return {
    version: 1,
    primaryAccent: "#1476FF",
    secondaryAccent: "#21B8A7",
    riskColor: "#FF5A1F",
    focusColor: "#22C55E",
    activityColor: "#8B3DFF",
    forecastAccent: "#FF5A1F",
    focusTimerAccent: "#22C55E",
    cardAccentStyle: "glass",
    widgetColor: "#1476FF",
    watchPreviewStyle: "rings",
    homeWidgetPack: [
      createWidgetSetting("home-today", "next_assignment", "home", "medium", "glass", timestamp),
      createWidgetSetting("home-week", "heavy_week_warning", "home", "medium", "clean", timestamp)
    ],
    lockWidgetPack: [
      createWidgetSetting("lock-next", "next_assignment", "lock", "lock_rect", "clean", timestamp),
      createWidgetSetting("lock-exam", "exam_countdown", "lock", "lock_round", "color_card", timestamp)
    ],
    watchWidgetPack: [
      createWidgetSetting("watch-focus", "focus_window", "watch", "watch", "glass", timestamp),
      createWidgetSetting("watch-class", "class_progress", "watch", "watch", "color_card", timestamp)
    ],
    savedSetupName: "Semester board",
    updatedAt: timestamp
  };
}

export function normalizeStudioCustomization(
  input?: Partial<StudioCustomization> | null,
  now = new Date()
): StudioCustomization {
  const defaults = createDefaultStudioCustomization(now);
  const source = input || {};
  return {
    ...defaults,
    ...source,
    version: 1,
    primaryAccent: validHex(source.primaryAccent, defaults.primaryAccent),
    secondaryAccent: validHex(source.secondaryAccent, defaults.secondaryAccent),
    riskColor: validHex(source.riskColor, defaults.riskColor),
    focusColor: validHex(source.focusColor, defaults.focusColor),
    activityColor: validHex(source.activityColor, defaults.activityColor),
    forecastAccent: validHex(source.forecastAccent, defaults.forecastAccent),
    focusTimerAccent: validHex(source.focusTimerAccent, defaults.focusTimerAccent),
    widgetColor: validHex(source.widgetColor, defaults.widgetColor),
    homeWidgetPack: normalizeWidgetPack(source.homeWidgetPack, defaults.homeWidgetPack, "home"),
    lockWidgetPack: normalizeWidgetPack(source.lockWidgetPack, defaults.lockWidgetPack, "lock"),
    watchWidgetPack: normalizeWidgetPack(source.watchWidgetPack, defaults.watchWidgetPack, "watch"),
    updatedAt: source.updatedAt || defaults.updatedAt
  };
}

export function setStudioAccent(
  customization: StudioCustomization,
  role: StudioAccentRole,
  color: string,
  now = new Date()
) {
  const safeColor = validHex(color, customization.primaryAccent);
  const patch: Partial<StudioCustomization> =
    role === "primary"
      ? { primaryAccent: safeColor, widgetColor: safeColor }
      : role === "secondary"
        ? { secondaryAccent: safeColor }
        : role === "risk"
          ? { riskColor: safeColor, forecastAccent: safeColor }
          : role === "focus"
            ? { focusColor: safeColor, focusTimerAccent: safeColor }
            : { activityColor: safeColor };
  return normalizeStudioCustomization({ ...customization, ...patch, updatedAt: now.toISOString() }, now);
}

export function updateStudioWidget(
  customization: StudioCustomization,
  surface: WidgetStudioSurface,
  widgetId: string,
  patch: Partial<WidgetStudioSetting>,
  now = new Date()
) {
  const key = packKey(surface);
  const pack = customization[key];
  const nextPack = pack.map((widget) =>
    widget.id === widgetId
      ? normalizeWidgetSetting({ ...widget, ...patch, surface, updatedAt: now.toISOString() }, widget, surface)
      : widget
  );
  return normalizeStudioCustomization({ ...customization, [key]: nextPack, updatedAt: now.toISOString() }, now);
}

export function widgetDefinitionForContent(contentType: WidgetStudioContentType) {
  return definitionByContent[contentType] || definitionByContent.next_assignment;
}

export function widgetDefinitionForSetting(setting: WidgetStudioSetting) {
  return widgetDefinitionForContent(setting.contentType);
}

export function nativeWidgetKindForContent(contentType: WidgetStudioContentType): WidgetKind {
  return widgetDefinitionForContent(contentType).nativeKind;
}

export function presetStyleForWidgetSetting(setting: WidgetStudioSetting): {
  background: WidgetBackground;
  palette: WidgetPalette;
  theme: WidgetTheme;
  layout: WidgetLayout;
  dataMode: WidgetDataMode;
} {
  const definition = widgetDefinitionForSetting(setting);
  const background = backgroundForStudioStyle(setting.style);
  const palette = paletteForStudioStyle(setting.style, setting.customColor);
  return {
    background,
    palette,
    theme: themeForStudioStyle(setting.style, palette),
    layout: setting.style === "compact" ? "compact" : definition.layout,
    dataMode: definition.dataMode
  };
}

export function nativeSnapshotStyleOverride({
  kind,
  settings,
  courses,
  assignments,
  classFocusCourseId,
  now = new Date()
}: {
  kind: "today" | "upcoming" | "week" | "class_progress";
  settings?: { customization?: Partial<StudioCustomization> | null };
  courses: Course[];
  assignments: Assignment[];
  classFocusCourseId?: string;
  now?: Date;
}) {
  if (!settings?.customization) return undefined;
  const customization = normalizeStudioCustomization(settings?.customization);
  const setting = customization.homeWidgetPack.find(
    (widget) => nativeKindToSnapshotKind(nativeWidgetKindForContent(widget.contentType)) === kind
  );
  if (!setting) return undefined;

  const accentColor = resolveWidgetAccent(setting, customization, courses, assignments, classFocusCourseId, now);
  return {
    accentColor,
    backgroundColor: backgroundColorForStudioStyle(setting.style),
    styleLabel: `${labelForWidgetStyle(setting.style)} / ${widgetDefinitionForSetting(setting).title}`,
    densityLabel: setting.style === "compact" ? "Compact" : setting.size === "small" ? "Calm" : "Visual"
  };
}

export function colorForAccentRole(customization: StudioCustomization, role: StudioAccentRole) {
  if (role === "primary") return customization.primaryAccent;
  if (role === "secondary") return customization.secondaryAccent;
  if (role === "risk") return customization.riskColor;
  if (role === "focus") return customization.focusColor;
  return customization.activityColor;
}

export function labelForWidgetStyle(style: WidgetStudioStyle) {
  if (style === "color_card") return "Color Card";
  return style.charAt(0).toUpperCase() + style.slice(1);
}

export function displaySizeLabel(size: WidgetStudioSize) {
  if (size === "lock_round") return "Lock Round";
  if (size === "lock_inline") return "Lock Inline";
  if (size === "lock_rect") return "Lock Rect";
  return size.charAt(0).toUpperCase() + size.slice(1);
}

function createWidgetSetting(
  id: string,
  contentType: WidgetStudioContentType,
  surface: WidgetStudioSurface,
  size: WidgetStudioSize,
  style: WidgetStudioStyle,
  timestamp: string
): WidgetStudioSetting {
  return {
    id,
    contentType,
    colorSource: contentType === "class_progress" ? "class" : "urgency",
    size,
    style,
    surface,
    updatedAt: timestamp
  };
}

function normalizeWidgetPack(
  input: WidgetStudioSetting[] | undefined,
  fallback: WidgetStudioSetting[],
  surface: WidgetStudioSurface
) {
  const source = input?.length ? input : fallback;
  const generatedFallback = createWidgetSetting(
    `${surface}-next`,
    "next_assignment",
    surface,
    surface === "lock" ? "lock_rect" : surface === "watch" ? "watch" : "medium",
    "glass",
    new Date().toISOString()
  );
  return source.slice(0, 4).map((widget, index) =>
    normalizeWidgetSetting(widget, fallback[index] || fallback[0] || generatedFallback, surface)
  );
}

function normalizeWidgetSetting(
  input: Partial<WidgetStudioSetting>,
  fallback: WidgetStudioSetting,
  surface: WidgetStudioSurface
): WidgetStudioSetting {
  const contentType = isWidgetContentType(input.contentType) ? input.contentType : fallback.contentType;
  const safeStyle = isWidgetStyle(input.style) ? input.style : fallback.style;
  const safeSize = isWidgetSize(input.size) ? input.size : fallback.size;
  return {
    id: input.id || fallback.id,
    contentType,
    classFocusCourseId: input.classFocusCourseId,
    colorSource:
      input.colorSource === "class" || input.colorSource === "urgency" || input.colorSource === "custom"
        ? input.colorSource
        : fallback.colorSource,
    customColor: validHex(input.customColor, "") || undefined,
    size: safeSize,
    style: safeStyle,
    surface,
    updatedAt: input.updatedAt || fallback.updatedAt
  };
}

function resolveWidgetAccent(
  setting: WidgetStudioSetting,
  customization: StudioCustomization,
  courses: Course[],
  assignments: Assignment[],
  classFocusCourseId?: string,
  now = new Date()
) {
  if (setting.colorSource === "custom") {
    return validHex(setting.customColor, customization.widgetColor);
  }

  if (setting.colorSource === "class") {
    const courseId = setting.classFocusCourseId || classFocusCourseId || assignments[0]?.courseId;
    const course = courses.find((item) => item.id === courseId);
    return validHex(course?.color, customization.widgetColor);
  }

  const urgent = assignments.some((assignment) => {
    if (assignment.status === "done" || assignment.status === "archived") return false;
    if (assignment.priority === "high") return true;
    const due = new Date(assignment.dueAt).getTime();
    return Number.isFinite(due) && due < now.getTime();
  });
  return urgent ? customization.riskColor : customization.secondaryAccent;
}

function backgroundForStudioStyle(style: WidgetStudioStyle): WidgetBackground {
  if (style === "clean" || style === "compact") return "light";
  if (style === "color_card") return "solid";
  return "glass";
}

function backgroundColorForStudioStyle(style: WidgetStudioStyle) {
  if (style === "color_card") return "#F8FAFC";
  if (style === "glass") return "#F2F7FF";
  if (style === "compact") return "#FFFFFF";
  return "#F8FAFC";
}

function paletteForStudioStyle(style: WidgetStudioStyle, customColor?: string): WidgetPalette {
  if (style === "color_card") return nearestPaletteForColor(customColor) || "ocean";
  if (style === "glass") return "paper";
  if (style === "compact") return "minimal";
  return "paper";
}

function themeForStudioStyle(style: WidgetStudioStyle, palette: WidgetPalette): WidgetTheme {
  if (style === "color_card" && palette === "forest") return "forest";
  if (style === "color_card" && palette === "graphite") return "graphite";
  if (style === "glass") return "light";
  if (style === "compact") return "light";
  return "light";
}

function nativeKindToSnapshotKind(kind: WidgetKind) {
  if (kind === "classProgress") return "class_progress";
  return kind;
}

function packKey(surface: WidgetStudioSurface): "homeWidgetPack" | "lockWidgetPack" | "watchWidgetPack" {
  if (surface === "lock") return "lockWidgetPack";
  if (surface === "watch") return "watchWidgetPack";
  return "homeWidgetPack";
}

function nearestPaletteForColor(color?: string): WidgetPalette | undefined {
  if (!color) return undefined;
  const normalized = color.toUpperCase();
  if (normalized === "#22C55E" || normalized === "#21B8A7") return "forest";
  if (normalized === "#FF5A1F" || normalized === "#F59E0B") return "sunset";
  if (normalized === "#8B3DFF" || normalized === "#EC4899") return "lavender";
  if (normalized === "#111827") return "graphite";
  return "ocean";
}

function isWidgetContentType(value: unknown): value is WidgetStudioContentType {
  return typeof value === "string" && value in definitionByContent;
}

function isWidgetStyle(value: unknown): value is WidgetStudioStyle {
  return value === "clean" || value === "glass" || value === "color_card" || value === "compact";
}

function isWidgetSize(value: unknown): value is WidgetStudioSize {
  return (
    value === "small" ||
    value === "medium" ||
    value === "large" ||
    value === "lock_round" ||
    value === "lock_inline" ||
    value === "lock_rect" ||
    value === "watch"
  );
}

function validHex(value: string | undefined, fallback: string) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}
