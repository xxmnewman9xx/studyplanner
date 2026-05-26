import React, { useMemo, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  LifeBuoy,
  Layers3,
  ListChecks,
  NotebookPen,
  Palette,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Timer,
  TrendingUp
} from "lucide-react-native";
import {
  GlassCard,
  WidgetPreviewCard
} from "../components/AppleComponents";
import { AppButton } from "../components/AppButton";
import { ModeToggle } from "../components/ModeToggle";
import { SectionHeader } from "../components/SectionHeader";
import {
  Assignment,
  Course,
  ParsedImport,
  Semester,
  StudyNote,
  UserSettings,
  WidgetBackground,
  WidgetPalette,
  WidgetPreset,
  WidgetSize,
  WidgetType
} from "../models";
import { getWidgetData } from "../logic/planner";
import { purchaseConfig } from "../services/purchaseConfig";
import { buildStudyPlannerWidgetSnapshots } from "../services/widgetSnapshot";
import type { WidgetSyncStatus } from "../services/widgetSnapshot";
import { AppTheme, ThemeAccent, appThemePalettes, themePalettes } from "../theme";
import { useAppTheme } from "../themeContext";
import { useI18n } from "../i18n";

type MoreScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  notes?: StudyNote[];
  semester: Semester;
  parsedImports: ParsedImport[];
  demoMode?: boolean;
  settings: UserSettings;
  widgetPresets: WidgetPreset[];
  nativeWidgetStatus: WidgetSyncStatus;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onSaveWidgetPreset: (preset: WidgetPreset) => void;
  onResetWidgetPresets: () => void;
  onOpenNotes: () => void;
  onOpenFocus: () => void;
  onOpenGrades: () => void;
  onOpenPaywall: () => void;
  premiumWidgetsLocked?: boolean;
};

const widgetSizes: WidgetSize[] = ["small", "medium", "lock_rect", "lock_round", "lock_inline", "large"];
const palettes: WidgetPalette[] = ["ocean", "midnight", "aurora", "forest", "graphite", "paper"];
const appThemeOptions: ThemeAccent[] = ["campus", "graphite", "mint", "slate", "solar"];

function isNativeEligiblePreset(preset: Pick<WidgetPreset, "type" | "size">) {
  return (
    (preset.type === "today" || preset.type === "due_next") &&
    (preset.size === "small" ||
      preset.size === "medium" ||
      preset.size === "lock_rect" ||
      preset.size === "lock_round" ||
      preset.size === "lock_inline")
  );
}

export function MoreScreen({
  assignments,
  courses,
  notes = [],
  semester,
  parsedImports,
  demoMode = false,
  settings,
  widgetPresets,
  nativeWidgetStatus,
  onUpdateSettings,
  onSaveWidgetPreset,
  onResetWidgetPresets,
  onOpenNotes,
  onOpenFocus,
  onOpenGrades,
  onOpenPaywall,
  premiumWidgetsLocked = false
}: MoreScreenProps) {
  const { theme, setAccent } = useAppTheme();
  const { t } = useI18n();
  const { colors } = theme;
  const styles = createStyles(theme);
  const firstPreset =
    (premiumWidgetsLocked
      ? widgetPresets.find(isNativeEligiblePreset)
      : widgetPresets[0]) || widgetPresets.find(isNativeEligiblePreset);
  const [type, setType] = useState<WidgetType>(firstPreset?.type || "due_next");
  const [size, setSize] = useState<WidgetSize>(firstPreset?.size || "medium");
  const [background, setBackground] = useState<WidgetBackground>(
    firstPreset?.background || settings.defaultWidgetStyle
  );
  const [palette, setPalette] = useState<WidgetPalette>(firstPreset?.palette || "ocean");
  const [font, setFont] = useState<WidgetPreset["font"]>(firstPreset?.font || "SF Pro");
  const [classFocusCourseId, setClassFocusCourseId] = useState<string | undefined>(
    firstPreset?.classFocusCourseId || courses[0]?.id
  );
  const [layout, setLayout] = useState<WidgetPreset["layout"]>(firstPreset?.layout || "compact");
  const [iconKey, setIconKey] = useState(firstPreset?.iconKey || "book");
  const [editingPresetId, setEditingPresetId] = useState(firstPreset?.id || "preset-due-next");
  const [selectedThemePackId, setSelectedThemePackId] = useState<string | undefined>(firstPreset?.themePackId);

  const plusLabel = t("tabs.plus", "Plus");
  const nativeLabel = t("more.native", "Native");
  const includedLabel = t("more.included", "Included");
  const lockedLabel = t("more.locked", "Locked");
  const readyLabel = t("more.ready", "Ready");
  const fixLabel = t("more.fix", "Fix");
  const widgetTypeLabels: Record<WidgetType, string> = {
    due_next: t("more.widget_type_due_next", "Upcoming"),
    today: t("more.widget_type_today", "Today"),
    needs_check: t("more.widget_type_needs_check", "Needs Check"),
    week: t("more.widget_type_week", "This Week"),
    class_focus: t("more.widget_type_class_focus", "One Class"),
    empty: t("more.widget_type_empty", "All Done"),
    focus: t("more.widget_type_focus", "Focus Timer"),
    streak: t("more.widget_type_streak", "Streak")
  };
  const sizeLabels: Record<WidgetSize, string> = {
    small: t("more.size_small", "Small"),
    medium: t("more.size_medium", "Medium"),
    large: t("more.size_large", "Large"),
    lock_rect: t("more.size_lock_rect", "Rectangular"),
    lock_round: t("more.size_lock_round", "Circular"),
    lock_inline: t("more.size_lock_inline", "Inline")
  };
  const sizeDetails: Record<WidgetSize, string> = {
    small: t("more.size_small_detail", "One answer"),
    medium: t("more.size_medium_detail", "Context + next"),
    large: t("more.size_large_detail", "Day or week"),
    lock_rect: t("more.size_lock_detail", "Lock Screen"),
    lock_round: t("more.size_lock_detail", "Lock Screen"),
    lock_inline: t("more.size_lock_detail", "Lock Screen")
  };
  const paletteLabels: Record<WidgetPalette, string> = {
    sunset: t("more.palette_sunset", "Sunset"),
    ocean: t("more.palette_ocean", "Ocean"),
    lavender: t("more.palette_lavender", "Lavender"),
    midnight: t("more.palette_midnight", "Midnight"),
    candy: t("more.palette_candy", "Candy"),
    aurora: t("more.palette_aurora", "Aurora"),
    forest: t("more.palette_forest", "Forest"),
    graphite: t("more.palette_graphite", "Graphite"),
    paper: t("more.palette_paper", "Paper"),
    minimal: t("more.palette_minimal", "Minimal")
  };
  const appThemeLabels: Record<ThemeAccent, string> = {
    campus: t("more.app_theme_campus", appThemePalettes.campus.label),
    classic: t("more.app_theme_classic", appThemePalettes.classic.label),
    graphite: t("more.app_theme_graphite", appThemePalettes.graphite.label),
    mint: t("more.app_theme_mint", appThemePalettes.mint.label),
    aura: t("more.app_theme_aura", appThemePalettes.aura.label),
    rose: t("more.app_theme_rose", appThemePalettes.rose.label),
    slate: t("more.app_theme_slate", appThemePalettes.slate.label),
    solar: t("more.app_theme_solar", appThemePalettes.solar.label)
  };
  const widgetTypeLabel = (value: WidgetType) => widgetTypeLabels[value] || labelForWidgetType(value);
  const sizeLabel = (value: WidgetSize) => sizeLabels[value] || labelize(value);
  const paletteLabel = (value: WidgetPalette) => paletteLabels[value] || labelize(value);
  const appThemeLabel = (value: ThemeAccent) => appThemeLabels[value] || appThemePalettes[value].label;
  const widgetItemMetaForStudioLocalized = (item: { courseCode?: string; dueLabel?: string; priority?: Assignment["priority"] }) =>
    [item.courseCode, item.dueLabel, item.priority === "high" ? t("more.priority_high", "High priority") : undefined]
      .filter(Boolean)
      .join(" / ");
  const notificationDefaultLabel =
    settings.notificationDefault === "off"
      ? t("more.notification_off", "Off")
      : settings.notificationDefault
        ? t("more.notification_standard", "Standard")
        : t("more.notification_standard", "Standard");

  const previewPreset = useMemo<WidgetPreset>(
    () => ({
      id: editingPresetId || "preview",
      name: widgetTypeLabel(type),
      type,
      size,
      background,
      palette,
      font,
      classFocusCourseId,
      layout,
      iconKey,
      smartStackSlot: smartSlotFromPresetId(editingPresetId),
      scheduleLabel: scheduleLabelForSlot(smartSlotFromPresetId(editingPresetId)),
      themePackId: selectedThemePackId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }),
    [background, classFocusCourseId, editingPresetId, font, iconKey, layout, palette, selectedThemePackId, size, type, widgetTypeLabels]
  );
  const widgetData = getWidgetData(previewPreset, assignments, courses);
  const previewWidgetPresets = useMemo(
    () =>
      previewPreset.type === "today" || previewPreset.type === "due_next"
        ? [previewPreset, ...widgetPresets.filter((preset) => preset.id !== previewPreset.id)]
        : widgetPresets,
    [previewPreset, widgetPresets]
  );
  const nativeSnapshots = useMemo(
    () =>
      buildStudyPlannerWidgetSnapshots({
        semester,
        courses,
        assignments,
        parsedImports,
        settings,
        widgetPresets: previewWidgetPresets,
        demoMode
      }),
    [assignments, courses, demoMode, parsedImports, previewWidgetPresets, semester, settings]
  );
  const nativePreview =
    type === "today" ? nativeSnapshots.today : type === "due_next" ? nativeSnapshots.upcoming : undefined;
  const hasAssignments = assignments.length > 0;
  const hasCourses = courses.length > 0;
  const needsClassFirst = type === "class_focus" && !hasCourses;
  const displayWidgetData = nativePreview
    ? {
        headline: nativePreview.headline,
        value: nativePreview.value,
        detail: nativePreview.detail,
        items: nativePreview.items,
        course: undefined
      }
    : needsClassFirst
    ? { ...widgetData, headline: widgetTypeLabel("class_focus"), value: "+", detail: t("more.add_class_first", "Add a class first"), items: [] }
    : !hasAssignments && type !== "class_focus"
      ? { ...widgetData, headline: widgetTypeLabel(type), value: "+", detail: t("more.add_homework_to_preview", "Add homework to preview"), items: [] }
      : widgetData;
  const studioHint = nativePreview
    ? formatMore(t("more.native_studio_hint", "{footnote} Preview updates as you edit; saving writes the preset to native widget state."), {
        footnote: nativePreview.footnote
      })
    : needsClassFirst
    ? t("more.class_needed_hint", "This widget needs a class. Add one in Classes, then come back.")
    : !hasAssignments && type !== "class_focus"
      ? t("more.homework_hint", "Your real homework will appear here after you add or scan it.")
      : t("more.planner_preview_hint", "This preview uses planner data. iOS placement and Smart Stack ordering still happen in the system widget gallery.");
  const focusedCourse = classFocusCourseId
    ? courses.find((course) => course.id === classFocusCourseId)
    : undefined;
  const smartStackSlots: Array<{
    id: NonNullable<WidgetPreset["smartStackSlot"]>;
    label: string;
    time: string;
    promise: string;
    preset: Pick<WidgetPreset, "type" | "size" | "background" | "palette" | "layout" | "iconKey" | "font">;
  }> = [
    {
      id: "morning",
      label: t("more.smart_morning_label", "Morning Brief"),
      time: t("more.smart_morning_time", "7-10 AM"),
      promise: t("more.smart_morning_promise", "What is due today before school starts."),
      preset: { type: "today", size: "medium", background: "glass", palette: "ocean", layout: "list", iconKey: "check", font: "SF Pro" }
    },
    {
      id: "between_classes",
      label: t("more.smart_between_label", "Between Classes"),
      time: t("more.smart_between_time", "10 AM-3 PM"),
      promise: t("more.smart_between_promise", "A class-specific look students can place manually."),
      preset: { type: "class_focus", size: "small", background: "glass", palette: "forest", layout: "compact", iconKey: "book", font: "Rounded" }
    },
    {
      id: "study_time",
      label: t("more.smart_study_label", "Study Block"),
      time: t("more.smart_study_time", "3-9 PM"),
      promise: t("more.smart_study_promise", "The next focus task as a saved Plus preset."),
      preset: { type: "focus", size: "small", background: "dark", palette: "midnight", layout: "ring", iconKey: "timer", font: "Mono" }
    },
    {
      id: "night_review",
      label: t("more.smart_night_label", "Night Review"),
      time: t("more.smart_night_time", "9 PM+"),
      promise: t("more.smart_night_promise", "A saved week-load look for evening review."),
      preset: { type: "week", size: "medium", background: "glass", palette: "graphite", layout: "calendar", iconKey: "calendar", font: "SF Pro" }
    }
  ];
  const themePacks: Array<{
    id: string;
    label: string;
    detail: string;
    appTheme: ThemeAccent;
    widgetPalette: WidgetPalette;
    widgetBackground: WidgetBackground;
  }> = [
    { id: "ocean-glass", label: t("more.theme_pack_ocean_label", "Ocean Glass"), detail: t("more.theme_pack_ocean_detail", "Blue and cyan widgets for everyday school planning."), appTheme: "campus", widgetPalette: "ocean", widgetBackground: "glass" },
    { id: "exam-graphite", label: t("more.theme_pack_graphite_label", "Exam Graphite"), detail: t("more.theme_pack_graphite_detail", "High-contrast study mode for deadline weeks."), appTheme: "graphite", widgetPalette: "graphite", widgetBackground: "dark" },
    { id: "forest-night", label: t("more.theme_pack_forest_label", "Forest Night"), detail: t("more.theme_pack_forest_detail", "Calm green accents for review and catch-up blocks."), appTheme: "mint", widgetPalette: "forest", widgetBackground: "glass" }
  ];

  const starterTemplates: Array<{
    label: string;
    detail: string;
    moment: string;
    data: string;
    entitlement: "included" | "plus";
    preset: Pick<WidgetPreset, "type" | "size" | "background" | "palette" | "layout" | "iconKey">;
  }> = [
    {
      label: t("more.template_upcoming_label", "Upcoming"),
      detail: t("more.template_upcoming_detail", "Next reviewed deadline"),
      moment: t("more.template_upcoming_moment", "Home Screen"),
      data: t("more.template_upcoming_data", "Reviewed deadlines"),
      entitlement: "included",
      preset: { type: "due_next", size: "medium", background: "glass", palette: "ocean", layout: "list", iconKey: "calendar" }
    },
    {
      label: t("more.template_today_label", "Today"),
      detail: t("more.template_today_detail", "Due today"),
      moment: t("more.template_today_moment", "Morning stack"),
      data: t("more.template_today_data", "Reviewed work"),
      entitlement: "included",
      preset: { type: "today", size: "medium", background: "glass", palette: "ocean", layout: "list", iconKey: "check" }
    },
    {
      label: t("more.template_deadline_label", "Deadline Map"),
      detail: t("more.template_deadline_detail", "Week workload"),
      moment: t("more.template_deadline_moment", "Weekly review"),
      data: t("more.template_deadline_data", "Due soon"),
      entitlement: "plus",
      preset: { type: "week", size: "large", background: "glass", palette: "graphite", layout: "calendar", iconKey: "calendar" }
    },
    {
      label: t("more.template_class_label", "Class Risk"),
      detail: t("more.template_class_detail", "One class status"),
      moment: t("more.template_class_moment", "Before class"),
      data: t("more.template_class_data", "Class-specific"),
      entitlement: "plus",
      preset: { type: "class_focus", size: "medium", background: "glass", palette: "forest", layout: "compact", iconKey: "book" }
    },
    {
      label: t("more.template_focus_label", "Focus Block"),
      detail: t("more.template_focus_detail", "Start studying fast"),
      moment: t("more.template_focus_moment", "Study time"),
      data: t("more.template_focus_data", "Next focus task"),
      entitlement: "plus",
      preset: { type: "focus", size: "small", background: "dark", palette: "midnight", layout: "ring", iconKey: "timer" }
    },
    {
      label: t("more.template_review_label", "Needs Check"),
      detail: t("more.template_review_detail", "Flagged import items"),
      moment: t("more.template_review_moment", "After import"),
      data: t("more.template_review_data", "Review queue"),
      entitlement: "plus",
      preset: { type: "needs_check", size: "medium", background: "solid", palette: "minimal", layout: "list", iconKey: "check" }
    }
  ];
  const selectedTemplate = starterTemplates.find((template) => template.preset.type === type);
  const selectedTemplatePreset = selectedTemplate?.preset || {
    type,
    size,
    background,
    palette,
    layout,
    iconKey
  };
  const selectedTemplateEntitlement = selectedTemplate?.entitlement || "plus";
  const basicNativeTemplate = selectedTemplateEntitlement === "included" && (type === "today" || type === "due_next");
  const advancedCustomizationSelected =
    size === "large" ||
    background !== selectedTemplatePreset.background ||
    palette !== selectedTemplatePreset.palette ||
    layout !== selectedTemplatePreset.layout ||
    iconKey !== selectedTemplatePreset.iconKey ||
    font !== "SF Pro";
  const selectedTemplateLocked =
    premiumWidgetsLocked &&
    (selectedTemplateEntitlement === "plus" || (basicNativeTemplate && advancedCustomizationSelected));
  const nativeStatusLabel =
    nativeWidgetStatus.state === "synced"
      ? t("more.status_synced", "Synced")
      : nativeWidgetStatus.state === "unavailable"
        ? t("more.status_build_needed", "Build needed")
        : t("more.status_needs_install", "Needs install");
  const nativeStatusMessage =
    nativeWidgetStatus.state === "synced"
      ? t("more.install_status_synced_message", "Today and Upcoming widgets are using reviewed planner data.")
      : nativeWidgetStatus.state === "unavailable"
        ? t("more.install_status_unavailable_message", "Install a native iOS build with the widget extension to add widgets.")
        : t("more.install_status_needs_install_message", "Native widgets sync after your planner loads.");
  const savedPresets = premiumWidgetsLocked
    ? widgetPresets.filter(isNativeEligiblePreset)
    : widgetPresets;
  const hasSavedPresets = savedPresets.length > 0;
  const smartPresetCount = widgetPresets.filter((preset) => preset.smartStackSlot).length;
  const selectedSmartSlot = smartStackSlots.find((slot) => `smart-${slot.id}` === editingPresetId || smartSlotFromPresetId(editingPresetId) === slot.id);
  const reviewedWidgetItems = nativeSnapshots.today.items.length + nativeSnapshots.upcoming.items.length;
  const widgetReadiness = [
    {
      label: t("more.readiness_classes", "Real classes"),
      active: hasCourses,
      detail: hasCourses
        ? formatMore(t("more.connected_count", "{count} connected"), { count: String(courses.length) })
        : t("more.add_a_class", "Add a class")
    },
    {
      label: t("more.readiness_reviewed", "Reviewed work"),
      active: reviewedWidgetItems > 0 || nativeSnapshots.today.state === "no_due_today",
      detail: reviewedWidgetItems > 0
        ? formatMore(t("more.widget_rows_count", "{count} widget rows"), { count: String(reviewedWidgetItems) })
        : t("more.review_or_add_homework", "Review or add homework")
    },
    { label: t("more.readiness_sync", "Sync enabled"), active: settings.syncEnabled, detail: settings.syncEnabled ? t("more.allowed", "Allowed") : t("more.turn_on_sync", "Turn on sync") },
    { label: t("more.readiness_app", "App installed"), active: nativeWidgetStatus.state === "synced", detail: nativeStatusLabel },
    { label: t("more.readiness_presets", "Saved presets"), active: smartPresetCount >= 4, detail: formatMore(t("more.saved_count", "{count}/4 saved"), { count: String(smartPresetCount) }) },
    { label: t("more.readiness_privacy", "Privacy clear"), active: true, detail: settings.privacyMode ? t("more.sensitive_hidden", "Sensitive text hidden") : t("more.normal_detail", "Normal detail") }
  ];
  const nativeTruthScore = widgetReadiness.filter((item) => item.active).length;
  const proofSignals = [
    { label: t("more.score", "Score"), value: `${nativeTruthScore}/${widgetReadiness.length}`, detail: nativeTruthScore >= 5 ? t("more.studio_ready", "Studio ready") : t("more.needs_setup", "Needs setup") },
    { label: t("more.source_rows", "Source rows"), value: String(reviewedWidgetItems), detail: reviewedWidgetItems > 0 ? t("more.reviewed_only", "Reviewed only") : t("more.no_reviewed_rows", "No reviewed rows") },
    { label: t("more.sync", "Sync"), value: nativeWidgetStatus.state === "synced" ? readyLabel : t("more.needs_build", "Needs build"), detail: nativeWidgetStatus.state === "synced" ? t("more.phone_widget_data", "Phone widget data") : t("more.install_native_app", "Install native app") }
  ];
  const dataSourceLabel = nativePreview ? t("more.native_data", "Native data") : type === "class_focus" ? t("more.class_data", "Class data") : t("more.planner_preview", "Planner preview");
  const topPreviewItems = displayWidgetData.items.slice(0, 4);
  const selectedTemplateLabel = widgetTypeLabel(type);
  const lockPreviewSnapshot = nativePreview || nativeSnapshots.today;
  const lockPreviewType: WidgetType = lockPreviewSnapshot.kind === "today" ? "today" : "due_next";
  const primaryActionLabel = selectedTemplateLocked
    ? t("more.unlock_this_preset", "Unlock this preset")
    : nativePreview
      ? type === "today" ? t("more.save_today_preset", "Save Today preset") : t("more.save_upcoming_preset", "Save Upcoming preset")
      : t("more.save_preset", "Save preset");
  const quickFacts = [
    {
      label: t("more.now", "Now"),
      value: nativeSnapshots.today.signalLabel || nativeSnapshots.today.value,
      detail: nativeSnapshots.today.detail
    },
    {
      label: t("common.next", "Next"),
      value: nativeSnapshots.upcoming.timelineLabel || nativeSnapshots.upcoming.value,
      detail: nativeSnapshots.upcoming.detail
    },
    {
      label: t("more.source", "Source"),
      value: nativePreview ? nativeLabel : type === "class_focus" ? t("more.class_data", "Class data") : t("more.planner", "Planner"),
      detail: nativePreview ? t("more.native_snapshot", "Native snapshot") : nativeStatusLabel
    }
  ];
  const studioRules = [
    t("more.rule_one_fact", "One fact in small widgets"),
    t("more.rule_agenda_rows", "Agenda rows in medium widgets"),
    t("more.rule_privacy", "Privacy can hide titles"),
    t("more.rule_reviewed", "Reviewed work only")
  ];
  const studioSteps = [
    { label: t("more.step_widget", "Widget"), detail: selectedTemplateLabel, active: true },
    { label: t("more.step_data", "Data"), detail: dataSourceLabel, active: hasAssignments || type === "class_focus" },
    { label: t("more.step_style", "Style"), detail: `${sizeLabel(size)} / ${paletteLabel(palette)}`, active: true },
    {
      label: t("more.step_place", "Place"),
      detail: nativePreview ? nativeStatusLabel : t("more.in_app_preset", "In-app preset"),
      active: nativePreview ? nativeWidgetStatus.state === "synced" : true
    }
  ];
  const moreDestinations = [
    { label: t("tabs.notes", "Notes"), detail: t("more.destination_notes_detail", "Class context"), icon: NotebookPen, action: onOpenNotes, locked: false },
    { label: t("more.destination_study", "Study"), detail: t("more.destination_study_detail", "Focus sessions"), icon: Timer, action: onOpenFocus, locked: premiumWidgetsLocked },
    { label: t("tabs.grades", "Grades"), detail: t("more.destination_grades_detail", "Grade targets"), icon: TrendingUp, action: onOpenGrades, locked: premiumWidgetsLocked },
    { label: plusLabel, detail: t("more.destination_plus_detail", "Pricing + restore"), icon: Sparkles, action: onOpenPaywall, locked: false }
  ];
  const privacyFacts = [
    t("more.privacy_fact_imports", "Imports stay in review until accepted."),
    t("more.privacy_fact_widgets", "Widgets use reviewed planner snapshots."),
    t("more.privacy_fact_permissions", "Reminder and calendar permissions are optional.")
  ];

  const applyTemplate = (template: Pick<WidgetPreset, "type" | "size" | "background" | "palette" | "layout" | "iconKey">) => {
    setType(template.type);
    setSize(template.size);
    setBackground(template.background);
    setPalette(template.palette);
    setLayout(template.layout);
    setIconKey(template.iconKey);
    setEditingPresetId(`preset-${template.type}-${template.size}`);
  };

  const applyThemePack = (pack: typeof themePacks[number]) => {
    if (premiumWidgetsLocked) {
      onOpenPaywall();
      return;
    }
    setAccent(pack.appTheme);
    setSelectedThemePackId(pack.id);
    setPalette(pack.widgetPalette);
    setBackground(pack.widgetBackground);
    onUpdateSettings({ appTheme: pack.appTheme, selectedTheme: pack.widgetPalette, defaultWidgetStyle: pack.widgetBackground });
  };

  const saveSmartStack = () => {
    if (premiumWidgetsLocked) {
      onOpenPaywall();
      return;
    }
    const timestamp = new Date().toISOString();
    smartStackSlots.forEach((slot) => {
      onSaveWidgetPreset({
        id: `smart-${slot.id}`,
        name: slot.label,
        type: slot.preset.type,
        size: slot.preset.size,
        background: slot.preset.background,
        palette: slot.preset.palette,
        font: slot.preset.font,
        classFocusCourseId: slot.preset.type === "class_focus" ? classFocusCourseId : undefined,
        layout: slot.preset.layout,
        iconKey: slot.preset.iconKey,
        smartStackSlot: slot.id,
        scheduleLabel: slot.time,
        themePackId: selectedThemePackId || settings.appTheme || "campus",
        createdAt: timestamp,
        updatedAt: timestamp
      });
    });
  };

  const saveCurrentPreset = () => {
    if (selectedTemplateLocked) {
      onOpenPaywall();
      return;
    }

    onUpdateSettings({
      selectedTheme: palette,
      defaultWidgetStyle: background
    });
    onSaveWidgetPreset(previewPreset);
  };

  const moreHub = (
    <GlassCard style={styles.moreHubCard}>
      <View style={styles.moreHubTopRow}>
        <View style={styles.moreHubCopy}>
          <Text style={styles.moreHubKicker}>{t("more.hub_kicker", "More")}</Text>
          <Text style={styles.moreHubTitle}>{t("more.hub_title", "Notes, study, grades, and settings.")}</Text>
          <Text style={styles.moreHubText}>{t("more.hub_text", "Open the secondary tools before you tune widgets.")}</Text>
        </View>
        <View style={styles.moreHubIcon}>
          <Settings2 color={colors.heroText} size={20} />
        </View>
      </View>
      <View style={styles.destinationGrid}>
        {moreDestinations.map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              accessibilityRole="button"
              key={item.label}
              style={styles.destinationCard}
              onPress={item.locked ? onOpenPaywall : item.action}
            >
              <View style={styles.destinationIcon}>
                <Icon color={colors.accent} size={18} />
              </View>
              <View style={styles.destinationCopy}>
                <View style={styles.destinationTitleRow}>
                  <Text style={styles.destinationTitle}>{item.label}</Text>
                  {item.locked ? <Text numberOfLines={1} style={styles.destinationLock}>{plusLabel}</Text> : null}
                </View>
                <Text style={styles.destinationDetail} numberOfLines={2}>{item.detail}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </GlassCard>
  );

  return (
    <View>
      <View style={styles.studioShell}>
        <View style={styles.studioWorkbench}>
          <View style={styles.studioTopBar}>
            <View style={styles.studioTitleBlock}>
              <Text style={styles.studioEyebrow}>{t("more.widget_studio", "Widget Studio")}</Text>
              <Text style={styles.studioTitle}>{t("more.studio_title", "Choose widget, data, and style.")}</Text>
            </View>
            <View style={styles.nativeStatusChip}>
              <View style={[styles.nativeStatusDot, nativeWidgetStatus.state === "synced" ? styles.nativeStatusDotSynced : null]} />
              <Text style={styles.nativeStatusText}>{nativeStatusLabel}</Text>
            </View>
          </View>

          <View style={styles.studioStepRail}>
            {studioSteps.map((step, stepIndex) => (
              <View
                key={step.label}
                style={[styles.studioStep, step.active ? styles.studioStepActive : null]}
              >
                <Text style={styles.studioStepIndex}>{stepIndex + 1}</Text>
                <View style={styles.studioStepCopy}>
                  <Text style={styles.studioStepLabel}>{step.label}</Text>
                  <Text style={styles.studioStepDetail} numberOfLines={1}>{step.detail}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.studioCanvas}>
            <View style={styles.phoneFrame}>
              <View style={styles.phoneStatusBar}>
                <Text style={styles.phoneTime}>7:42</Text>
                <View style={styles.phoneSignalGroup}>
                  <View style={styles.phoneSignal} />
                  <View style={styles.phoneBattery} />
                </View>
              </View>
              <View style={styles.phoneWidgetSlot}>
                <WidgetPreviewCard
                  title={displayWidgetData.headline}
                  value={displayWidgetData.value}
                  detail={displayWidgetData.detail}
                  background={background}
                  palette={palette}
                  size={size}
                  type={type}
                  course={displayWidgetData.course || focusedCourse}
                  font={font}
                  layout={layout}
                  iconKey={iconKey}
                  items={displayWidgetData.items}
                  nativeMode={Boolean(nativePreview && size !== "large")}
                  nativeAccentColor={nativePreview?.accentColor}
                  nativeBackgroundColor={nativePreview?.backgroundColor}
                  nativeSignalLabel={nativePreview?.signalLabel}
                  nativeMetricLabel={nativePreview?.metricLabel}
                  nativeNextLabel={nativePreview?.nextLabel}
                  nativeTimelineLabel={nativePreview?.timelineLabel}
                  nativeProgress={nativePreview?.progress}
                  footnote={nativePreview?.footnote}
                  semesterName={nativePreview?.semesterName}
                  style={styles.heroWidgetPreview}
                />
              </View>
              <View style={styles.homeScreenDock}>
                <View style={styles.homeIcon} />
                <View style={styles.homeIcon} />
                <View style={styles.homeIcon} />
                <View style={styles.homeIconActive} />
              </View>
            </View>

            <View style={styles.studioInspector}>
              <View style={styles.inspectorHeader}>
                <Text style={styles.inspectorKicker}>{selectedTemplateLabel}</Text>
                <Text style={styles.inspectorTitle}>{displayWidgetData.value} · {displayWidgetData.detail}</Text>
                <Text style={styles.inspectorCopy}>{studioHint}</Text>
              </View>
              <View style={styles.quickFactGrid}>
                {quickFacts.map((fact) => (
                  <View key={fact.label} style={styles.quickFact}>
                    <Text style={styles.quickFactLabel}>{fact.label}</Text>
                    <Text style={styles.quickFactValue} numberOfLines={1}>{fact.value}</Text>
                    <Text style={styles.quickFactDetail} numberOfLines={2}>{fact.detail}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.proofMeter}>
                <View style={styles.proofMeterTop}>
                  <Text style={styles.proofMeterTitle}>{t("more.ready_for_home_screen", "Ready for Home Screen")}</Text>
                  <Text style={styles.proofMeterScore}>{nativeTruthScore}/{widgetReadiness.length}</Text>
                </View>
                <View style={styles.proofSignalRow}>
                  {proofSignals.map((signal) => (
                    <View key={signal.label} style={styles.proofSignal}>
                      <Text style={styles.proofSignalLabel}>{signal.label}</Text>
                      <Text style={styles.proofSignalValue} numberOfLines={1}>{signal.value}</Text>
                      <Text style={styles.proofSignalDetail} numberOfLines={1}>{signal.detail}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.placementGuide}>
                <Text style={styles.placementGuideKicker}>{t("more.home_screen_handoff", "Home Screen handoff")}</Text>
                <Text style={styles.placementGuideTitle}>
                  {nativePreview ? t("more.place_ios_title", "Save here. Place in iOS.") : t("more.native_widgets_title", "Preview here. Native widgets use Today and Upcoming.")}
                </Text>
                <Text style={styles.placementGuideCopy}>
                  {nativePreview
                    ? t("more.native_style_fields", "Native style fields: palette, background, class filter, and window label. iOS chooses the placed size from the widget gallery.")
                    : t("more.advanced_looks_copy", "Advanced looks stay as saved StudyPlanner presets; iOS only renders the native Today and Upcoming families.")}
                </Text>
              </View>
              <View style={styles.primaryActionRow}>
                <AppButton
                  label={primaryActionLabel}
                  icon={selectedTemplateLocked ? Sparkles : CheckCircle2}
                  onPress={saveCurrentPreset}
                  style={styles.primaryStudioAction}
                />
                <AppButton label={t("more.reset", "Reset")} variant="secondary" icon={SlidersHorizontal} onPress={onResetWidgetPresets} style={styles.secondaryStudioAction} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.studioPickerRail}>
          {starterTemplates.slice(0, 4).map((template) => {
            const Icon = template.preset.type === "today" ? ListChecks : template.preset.type === "due_next" ? Clock3 : template.preset.type === "class_focus" ? BookOpen : CalendarDays;
            const active = template.preset.type === type && template.preset.size === size;
            const templateLocked = premiumWidgetsLocked && template.entitlement === "plus";
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: templateLocked }}
                key={template.label}
                style={[styles.studioTemplateTile, active ? styles.studioTemplateTileActive : null, templateLocked ? styles.studioTemplateTileLocked : null]}
                onPress={() => applyTemplate(template.preset)}
              >
                <View style={styles.studioTemplateTop}>
                  <View style={[styles.studioTemplateIcon, active ? styles.studioTemplateIconActive : null]}>
                    <Icon color={active ? colors.heroText : colors.accent} size={16} />
                  </View>
                  <Text style={[styles.studioTemplateBadge, template.entitlement === "plus" ? styles.studioTemplateBadgePlus : null]}>{template.entitlement === "plus" ? plusLabel : nativeLabel}</Text>
                </View>
                <Text style={styles.studioTemplateTitle}>{template.label}</Text>
                <Text style={styles.studioTemplateDetail} numberOfLines={2}>{template.detail}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <GlassCard style={styles.instantControlsCard}>
          <View style={styles.instantControlsHeader}>
            <View>
              <Text style={styles.instantControlsKicker}>{t("more.what_style", "What style?")}</Text>
              <Text style={styles.instantControlsTitle}>{t("more.style_title", "Size, privacy, class, look.")}</Text>
            </View>
            <ArrowRight color={colors.accent} size={18} />
          </View>

          <ControlLabel title={t("more.size", "Size")} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.instantSizeRail}>
            {widgetSizes.map((option) => {
              const active = option === size;
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={option}
                  style={[styles.instantSizeCard, active ? styles.sizeCardActive : null]}
                  onPress={() => setSize(option)}
                >
                  <Text style={styles.sizeTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>{sizeLabel(option)}</Text>
                  <Text style={styles.sizeDetail}>{sizeDetails[option]}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ControlLabel title={t("more.palette", "Palette")} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteRail}>
            {palettes.map((option) => {
              const swatches = themePalettes[option];
              const active = option === palette;
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={option}
                  style={[styles.paletteButton, active ? styles.paletteButtonActive : null]}
                  onPress={() => setPalette(option)}
                >
                  <View style={styles.paletteDots}>
                    {swatches.map((swatch) => (
                      <View key={swatch} style={[styles.paletteDot, { backgroundColor: swatch }]} />
                    ))}
                  </View>
                  <Text style={styles.paletteName}>{paletteLabel(option)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.ruleRail}>
            {studioRules.map((rule) => (
              <View key={rule} style={styles.rulePill}>
                <Text style={styles.rulePillText}>{rule}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <View style={styles.agendaBoard}>
          <View style={styles.agendaColumn}>
            <Text style={styles.agendaColumnKicker}>{t("more.what_shows", "What shows")}</Text>
            <Text style={styles.agendaColumnTitle}>{topPreviewItems.length ? t("more.student_sees_first", "What a student sees first") : t("more.setup_path", "Setup path")}</Text>
            {topPreviewItems.length ? topPreviewItems.map((item) => (
              <View key={item.id} style={styles.agendaItem}>
                <View style={[styles.agendaColorRail, { backgroundColor: "courseColor" in item ? item.courseColor : colors.accent }]} />
                <View style={styles.agendaItemCopy}>
                  <Text style={styles.agendaItemTitle} numberOfLines={1}>{widgetItemTitleForStudio(item)}</Text>
                  <Text style={styles.agendaItemMeta} numberOfLines={1}>{widgetItemMetaForStudioLocalized(item)}</Text>
                </View>
              </View>
            )) : (
              <Text style={styles.agendaEmptyText}>{studioHint}</Text>
            )}
          </View>
          <View style={styles.agendaColumn}>
            <Text style={styles.agendaColumnKicker}>{t("more.what_data", "What data")}</Text>
            <Text style={styles.agendaColumnTitle}>{nativePreview ? t("more.native_data_title", "Today and Upcoming use live planner data") : t("more.advanced_data_title", "Advanced presets preview inside StudyPlanner")}</Text>
            <Text style={styles.agendaEmptyText}>{nativePreview ? t("more.native_data_copy", "StudyPlanner sends reviewed planner rows to the phone widget. Students still place widgets from iOS.") : t("more.advanced_data_copy", "Save this look for inside StudyPlanner. Today and Upcoming are the native Home Screen widgets.")}</Text>
            <View style={styles.nativeTruthGrid}>
              {widgetReadiness.slice(0, 4).map((item) => (
                <View key={item.label} style={styles.nativeTruthPill}>
                  <Text style={[styles.nativeTruthText, item.active ? styles.nativeTruthTextActive : null]}>{item.active ? readyLabel : fixLabel} · {item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.lockParityBoard}>
          <View style={styles.lockPreviewHeader}>
            <View style={styles.lockPreviewTitleBlock}>
              <Text style={styles.lockPreviewKicker}>{t("more.lock_screen_widgets", "Lock Screen widgets")}</Text>
              <Text style={styles.lockPreviewTitle}>{t("more.lock_screen_title", "Compact views for quick checks.")}</Text>
            </View>
            <Text style={styles.lockPreviewNote}>{t("more.lock_screen_note", "Preview here. Students still add and place Lock Screen widgets in iOS.")}</Text>
          </View>
          <View style={styles.lockPreviewRail}>
            {[
              { label: sizeLabel("lock_rect"), size: "lock_rect" as WidgetSize },
              { label: sizeLabel("lock_round"), size: "lock_round" as WidgetSize },
              { label: sizeLabel("lock_inline"), size: "lock_inline" as WidgetSize }
            ].map((preview) => (
              <View key={preview.size} style={styles.lockPreviewFamily}>
                <Text style={styles.lockPreviewFamilyLabel}>{preview.label}</Text>
                <View style={styles.lockPreviewWidgetSlot}>
                  <WidgetPreviewCard
                    title={lockPreviewSnapshot.headline}
                    value={lockPreviewSnapshot.value}
                    detail={lockPreviewSnapshot.detail}
                    background={background}
                    palette={palette}
                    size={preview.size}
                    type={lockPreviewType}
                    font={font}
                    layout={layout}
                    iconKey={lockPreviewSnapshot.iconKey}
                    items={lockPreviewSnapshot.items}
                    nativeMode
                    nativeAccentColor={lockPreviewSnapshot.accentColor}
                    nativeBackgroundColor={lockPreviewSnapshot.backgroundColor}
                    nativeSignalLabel={lockPreviewSnapshot.signalLabel}
                    nativeMetricLabel={lockPreviewSnapshot.metricLabel}
                    nativeNextLabel={lockPreviewSnapshot.nextLabel}
                    nativeTimelineLabel={lockPreviewSnapshot.timelineLabel}
                    footnote={lockPreviewSnapshot.footnote}
                    semesterName={lockPreviewSnapshot.semesterName}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {moreHub}

      <SectionHeader title={t("more.settings_trust", "Settings and trust")} note={t("more.settings_trust_note", "Local controls, permissions, legal links, and data boundaries in one place.")} />
      <GlassCard style={styles.settingsCard}>
        <View style={styles.settingsGrid}>
          <SettingToggle
            icon={ShieldCheck}
            title={t("more.privacy_mode", "Privacy mode")}
            detail={t("more.privacy_mode_detail", "Hide sensitive class and deadline detail in shared views.")}
            active={settings.privacyMode}
            onPress={() => onUpdateSettings({ privacyMode: !settings.privacyMode })}
          />
          <SettingToggle
            icon={Bell}
            title={t("more.reminder_default", "Reminder default")}
            detail={formatMore(t("more.reminder_default_detail", "Current preset: {preset}"), { preset: notificationDefaultLabel })}
            active={settings.notificationDefault !== "off"}
            onPress={() =>
              onUpdateSettings({
                notificationDefault: settings.notificationDefault === "off" ? "standard" : "off"
              })
            }
          />
          <SettingToggle
            icon={Palette}
            title={t("more.icon_accents", "Icon accents")}
            detail={t("more.icon_accents_detail", "Use familiar school icons and course color cues.")}
            active={settings.emojiAccentEnabled}
            onPress={() => onUpdateSettings({ emojiAccentEnabled: !settings.emojiAccentEnabled })}
          />
          <SettingToggle
            icon={GraduationCap}
            title={t("more.widget_sync", "Widget sync")}
            detail={t("more.widget_sync_detail", "Share reviewed planner snapshots with native widgets.")}
            active={settings.syncEnabled}
            onPress={() => onUpdateSettings({ syncEnabled: !settings.syncEnabled })}
          />
        </View>

        <View style={styles.trustPanel}>
          <View style={styles.trustPanelHeader}>
            <ShieldCheck color={colors.green} size={18} />
            <View style={styles.trustPanelCopy}>
              <Text style={styles.trustPanelTitle}>{t("more.trust_rules", "Trust rules")}</Text>
              <Text style={styles.trustPanelText}>{t("more.trust_rules_text", "StudyPlanner should explain what it knows and what still needs review.")}</Text>
            </View>
          </View>
          {privacyFacts.map((fact) => (
            <View key={fact} style={styles.trustFactRow}>
              <View style={styles.trustFactDot} />
              <Text style={styles.trustFactText}>{fact}</Text>
            </View>
          ))}
        </View>

        <View style={styles.legalGrid}>
          <LegalCard
            icon={FileText}
            title={t("paywall.terms_short", "Terms")}
            detail={t("more.terms_detail", "Apple standard EULA or configured terms URL.")}
            onPress={() => void Linking.openURL(purchaseConfig.termsUrl)}
          />
          <LegalCard
            icon={ShieldCheck}
            title={t("paywall.privacy_short", "Privacy")}
            detail={t("more.privacy_detail", "Open the configured StudyPlanner privacy policy.")}
            onPress={() => void Linking.openURL(purchaseConfig.privacyUrl)}
          />
          <LegalCard
            icon={LifeBuoy}
            title={t("more.support", "Support")}
            detail={t("more.support_detail", "Open the configured support contact for this build.")}
            onPress={() => void Linking.openURL(purchaseConfig.supportUrl)}
          />
        </View>
      </GlassCard>

      <SectionHeader title={t("more.smart_stack_presets", "Smart Stack presets")} note={t("more.smart_stack_note", "Save named looks for school-day moments. Students still place and order them in iOS.")} />
      <GlassCard style={styles.smartStackCard}>
        <View style={styles.smartStackHeader}>
          <View style={styles.smartStackIcon}>
            <Layers3 color={colors.heroText} size={18} />
          </View>
          <View style={styles.smartStackCopy}>
            <Text style={styles.smartStackTitle}>{t("more.smart_stack_title", "Build the daily preset set.")}</Text>
            <Text style={styles.smartStackText}>{t("more.smart_stack_text", "Save four labeled looks for Morning, Between Classes, Study Time, and Night Review. Students still add and arrange widgets in iOS.")}</Text>
          </View>
          <Text style={styles.smartStackPlus}>{plusLabel}</Text>
        </View>
        <View style={styles.scheduleGrid}>
          {smartStackSlots.map((slot) => {
            const slotData = getWidgetData(
              {
                id: `preview-${slot.id}`,
                name: slot.label,
                type: slot.preset.type,
                size: slot.preset.size,
                background: slot.preset.background,
                palette: slot.preset.palette,
                font: slot.preset.font,
                classFocusCourseId: slot.preset.type === "class_focus" ? classFocusCourseId : undefined,
                layout: slot.preset.layout,
                iconKey: slot.preset.iconKey,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              },
              assignments,
              courses
            );
            return (
              <TouchableOpacity
                accessibilityRole="button"
                key={slot.id}
                style={[styles.scheduleSlot, selectedSmartSlot?.id === slot.id ? styles.scheduleSlotActive : null]}
                onPress={() => {
                  setType(slot.preset.type);
                  setSize(slot.preset.size);
                  setBackground(slot.preset.background);
                  setPalette(slot.preset.palette);
                  setLayout(slot.preset.layout);
                  setIconKey(slot.preset.iconKey);
                  setFont(slot.preset.font);
                  setEditingPresetId(`smart-${slot.id}`);
                }}
              >
                <View style={styles.scheduleTopRow}>
                  <Text style={styles.scheduleTime}>{slot.time}</Text>
                  <Text style={styles.scheduleMiniValue}>{slotData.value}</Text>
                </View>
                <Text style={styles.scheduleLabel}>{slot.label}</Text>
                <Text style={styles.schedulePromise} numberOfLines={2}>{slot.promise}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <AppButton
          label={premiumWidgetsLocked ? t("more.unlock_smart_stack", "Unlock Smart Stack") : t("more.save_smart_stack", "Save Smart Stack presets")}
          icon={premiumWidgetsLocked ? Sparkles : Layers3}
          onPress={saveSmartStack}
        />
      </GlassCard>

      <SectionHeader title={t("more.theme_packs", "One-tap theme packs")} note={t("more.theme_packs_note", "Pair the app theme with a widget material preview without claiming system-level control.")} />
      <View style={styles.themePackGrid}>
        {themePacks.map((pack) => {
          const meta = appThemePalettes[pack.appTheme];
          return (
            <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: selectedThemePackId === pack.id, disabled: premiumWidgetsLocked }} key={pack.id} style={[styles.themePackCard, selectedThemePackId === pack.id ? styles.themePackCardActive : null, premiumWidgetsLocked ? styles.themePackCardLocked : null]} onPress={() => applyThemePack(pack)}>
              <View style={styles.themePackSwatches}>
                {meta.swatches.map((swatch) => <View key={swatch} style={[styles.themePackSwatch, { backgroundColor: swatch }]} />)}
              </View>
              <View style={styles.themePackTitleRow}>
                <Text style={styles.themePackTitle}>{pack.label}</Text>
                <Text style={styles.themePlus}>{plusLabel}</Text>
              </View>
              <Text style={styles.themePackDetail}>{pack.detail}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionHeader title={t("more.app_appearance", "App appearance")} note={t("more.app_appearance_note", "Premium themes now restyle the whole app shell, not just one accent.")} />
      <GlassCard style={styles.appearanceCard}>
        <ModeToggle />
        <View style={styles.appearanceTopRow}>
          <View style={styles.appearanceCopy}>
            <Text style={styles.appearanceTitle}>{t("more.premium_app_themes", "Premium app themes")}</Text>
            <Text style={styles.appearanceText}>{t("more.premium_app_themes_text", "Change the app atmosphere: canvas, glass cards, hero surfaces, accents, widget defaults, and class energy.")}</Text>
          </View>
          <View style={styles.appearanceBadge}>
            <Palette color={colors.accent} size={15} />
            <Text style={styles.appearanceBadgeText}>{appThemeLabel(settings.appTheme || "campus")}</Text>
          </View>
        </View>
        <View style={styles.appThemeGrid}>
          {appThemeOptions.map((option) => {
            const optionMeta = appThemePalettes[option];
            const active = (settings.appTheme || "campus") === option;
            const premiumTheme = option !== "campus";
            const locked = premiumWidgetsLocked && premiumTheme;
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: locked }}
                key={option}
                style={[styles.appThemeButton, active ? styles.appThemeButtonActive : null, locked ? styles.appThemeButtonLocked : null]}
                onPress={() => {
                  if (locked) {
                    onOpenPaywall();
                    return;
                  }
                  setAccent(option);
                  onUpdateSettings({ appTheme: option });
                }}
              >
                <View style={styles.appThemeSwatches}>
                  {optionMeta.swatches.map((swatch) => (
                    <View key={swatch} style={[styles.appThemeSwatch, { backgroundColor: swatch }]} />
                  ))}
                </View>
                <View style={styles.appThemeNameRow}>
                  <Text style={styles.appThemeName}>{appThemeLabel(option)}</Text>
                  {premiumTheme ? <Text style={styles.themePlus}>{plusLabel}</Text> : <Text style={styles.themeIncluded}>{includedLabel}</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      <SectionHeader title={t("more.template_gallery", "Template gallery")} note={t("more.template_gallery_note", "Today and Upcoming are native on iOS. Advanced templates are Plus.")} />
      <View style={styles.templateGrid}>
        {starterTemplates.map((template) => {
          const templateLocked = premiumWidgetsLocked && template.entitlement === "plus";
          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: template.preset.type === type && template.preset.size === size }}
              key={template.label}
              style={[
                styles.templateCard,
                template.preset.type === type && template.preset.size === size ? styles.templateCardActive : null,
                templateLocked ? styles.templateCardLocked : null
              ]}
              onPress={() => applyTemplate(template.preset)}
            >
              <View style={styles.templateTopRow}>
                <Text style={styles.templateTitle}>{template.label}</Text>
                <Text style={[styles.templateEntitlement, template.entitlement === "plus" ? styles.templateEntitlementPlus : null]}>
                  {templateLocked ? lockedLabel : template.entitlement === "plus" ? plusLabel : nativeLabel}
                </Text>
              </View>
              <Text style={styles.templateDetail}>{template.detail}</Text>
              <Text style={styles.templateMeta}>{template.moment} | {template.data} | {sizeLabel(template.preset.size)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionHeader title={t("more.saved_presets", "Saved presets")} note={t("more.saved_presets_note", "Today and Upcoming write real native widget state. Plus adds advanced in-app looks.")} />
      <GlassCard style={styles.savedCard}>
        {!hasSavedPresets ? (
          <View style={styles.savedEmpty}>
            <Text style={styles.savedEmptyTitle}>{t("more.no_saved_presets", "No saved presets yet")}</Text>
            <Text style={styles.savedEmptyText}>{t("more.no_saved_presets_copy", "Start with Today or Upcoming, then save a tuned preset when the preview matches the intended school-day use.")}</Text>
          </View>
        ) : null}
        {savedPresets.slice(0, 5).map((preset) => (
          <TouchableOpacity
            accessibilityRole="button"
            key={preset.id}
            style={[styles.savedRow, preset.id === editingPresetId ? styles.savedRowActive : null]}
            onPress={() => {
              setType(preset.type);
              setSize(preset.size);
              setBackground(preset.background);
              setPalette(preset.palette);
              setFont(preset.font);
              setClassFocusCourseId(preset.classFocusCourseId || courses[0]?.id);
              setLayout(preset.layout);
              setIconKey(preset.iconKey);
              setSelectedThemePackId(preset.themePackId);
              setEditingPresetId(preset.id);
            }}
          >
            <View style={[styles.savedIcon, { backgroundColor: themePalettes[preset.palette][1] || colors.accent }]}>
              <Text style={styles.savedIconText}>{preset.size === "large" ? "L" : preset.size === "medium" ? "M" : "S"}</Text>
            </View>
            <View style={styles.savedCopy}>
              <Text style={styles.savedTitle}>{preset.name}</Text>
              <Text style={styles.savedMeta}>{preset.scheduleLabel ? `${preset.scheduleLabel} | ` : ""}{widgetTypeLabel(preset.type)} | {sizeLabel(preset.size)} | {paletteLabel(preset.palette)}</Text>
            </View>
            <Text style={styles.savedAction}>{t("more.edit", "Edit")}</Text>
          </TouchableOpacity>
        ))}
      </GlassCard>

      <SectionHeader title={t("more.install_status", "Install status")} note={nativeStatusMessage} />
      <GlassCard style={styles.helpCard}>
        <View style={styles.helpStep}>
          <Text style={styles.helpNumber}>1</Text>
          <Text style={styles.helpText}>{t("more.help_add_widgets", "Add StudyPlanner Today or StudyPlanner Upcoming from the iOS widget gallery.")}</Text>
        </View>
        <View style={styles.helpStep}>
          <Text style={styles.helpNumber}>2</Text>
          <Text style={styles.helpText}>{t("more.help_reviewed_only", "Widgets show reviewed planner data only. Demo and unreviewed scan text stay inside the app.")}</Text>
        </View>
        <View style={styles.helpStep}>
          <Text style={styles.helpNumber}>3</Text>
          <Text style={styles.helpText}>{t("more.help_notifications", "Notification permission is only needed for reminders; native widgets work from the shared reviewed snapshot.")}</Text>
        </View>
      </GlassCard>
    </View>
  );

function smartSlotFromPresetId(id?: string): WidgetPreset["smartStackSlot"] | undefined {
  if (!id?.startsWith("smart-")) return undefined;
  const slot = id.replace("smart-", "");
  return ["morning", "between_classes", "study_time", "night_review"].includes(slot)
    ? (slot as NonNullable<WidgetPreset["smartStackSlot"]>)
    : undefined;
}

function scheduleLabelForSlot(slot?: WidgetPreset["smartStackSlot"]) {
  if (slot === "morning") return "7–10 AM";
  if (slot === "between_classes") return "10 AM–3 PM";
  if (slot === "study_time") return "3–9 PM";
  if (slot === "night_review") return "9 PM+";
  return undefined;
}

function ControlLabel({ title }: { title: string }) {
    return <Text style={styles.controlLabel}>{title}</Text>;
  }

  function SettingToggle({
    icon: Icon,
    title,
    detail,
    active,
    onPress
  }: {
    icon: React.ComponentType<{ color: string; size: number }>;
    title: string;
    detail: string;
    active: boolean;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity
        accessibilityRole="switch"
        accessibilityState={{ checked: active }}
        style={[styles.settingToggle, active ? styles.settingToggleActive : null]}
        onPress={onPress}
      >
        <View style={styles.settingToggleTop}>
          <View style={styles.settingIcon}>
            <Icon color={active ? colors.heroText : colors.accent} size={17} />
          </View>
          <View style={[styles.toggleTrack, active ? styles.toggleTrackActive : null]}>
            <View style={[styles.toggleThumb, active ? styles.toggleThumbActive : null]} />
          </View>
        </View>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDetail}>{detail}</Text>
      </TouchableOpacity>
    );
  }

  function LegalCard({
    icon: Icon,
    title,
    detail,
    onPress
  }: {
    icon: React.ComponentType<{ color: string; size: number }>;
    title: string;
    detail: string;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity accessibilityRole="link" style={styles.legalCard} onPress={onPress}>
        <View style={styles.legalIcon}>
          <Icon color={colors.accent} size={17} />
        </View>
        <View style={styles.legalCopy}>
          <Text style={styles.legalTitle}>{title}</Text>
          <Text style={styles.legalDetail}>{detail}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

function formatMore(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((current, [key, value]) => current.replaceAll(`{${key}}`, value), template);
}

function labelForWidgetType(value: WidgetType) {
  const labels: Record<WidgetType, string> = {
    due_next: "Upcoming",
    today: "Today",
    needs_check: "Needs Check",
    week: "This Week",
    class_focus: "One Class",
    empty: "All Done",
    focus: "Focus Timer",
    streak: "Streak"
  };
  return labels[value];
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function widgetItemTitleForStudio(item: { title: string }) {
  return item.title;
}

function widgetItemMetaForStudio(item: { courseCode?: string; dueLabel?: string; priority?: Assignment["priority"] }) {
  return [item.courseCode, item.dueLabel, item.priority === "high" ? "High priority" : undefined]
    .filter(Boolean)
    .join(" / ");
}

function sizeMentalModel(value: WidgetSize) {
  if (value === "small") return "One answer";
  if (value === "medium") return "Context + next";
  if (value === "large") return "Day or week";
  return "Lock Screen";
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    studioShell: {
      gap: spacing.md,
      marginBottom: spacing.md
    },
    studioWorkbench: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.86)",
      backgroundColor: theme.isDark ? "rgba(8,12,22,0.92)" : "rgba(255,255,255,0.76)",
      padding: spacing.sm,
      gap: spacing.sm,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.34 : 0.12,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 18 },
      elevation: 6
    },
    studioTopBar: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    studioStepRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    studioStep: {
      flexGrow: 1,
      flexBasis: 132,
      minHeight: 58,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.54)",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    studioStepActive: {
      borderColor: colors.accent,
      backgroundColor: theme.isDark ? "rgba(86,168,255,0.16)" : colors.accentSoft
    },
    studioStepIndex: {
      width: 24,
      height: 24,
      borderRadius: 12,
      overflow: "hidden",
      textAlign: "center",
      color: colors.heroText,
      backgroundColor: colors.accent,
      fontSize: 12,
      lineHeight: 24,
      fontWeight: "900"
    },
    studioStepCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    studioStepLabel: {
      color: theme.isDark ? "#FFFFFF" : colors.ink,
      fontSize: 12,
      lineHeight: 15,
      fontWeight: "900"
    },
    studioStepDetail: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "800"
    },
    studioTitleBlock: {
      flex: 1,
      minWidth: 0,
      gap: 4
    },
    studioEyebrow: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    studioTitle: {
      color: theme.isDark ? "#FFFFFF" : colors.ink,
      fontSize: 21,
      lineHeight: 26,
      fontWeight: "900"
    },
    nativeStatusChip: {
      minHeight: 30,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.80)",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.72)",
      paddingHorizontal: 9,
      flexDirection: "row",
      alignItems: "center",
      gap: 6
    },
    nativeStatusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.gold
    },
    nativeStatusDotSynced: {
      backgroundColor: colors.green
    },
    nativeStatusText: {
      color: theme.isDark ? "#FFFFFF" : colors.ink,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    studioCanvas: {
      gap: spacing.sm
    },
    phoneFrame: {
      borderRadius: radii.xxl,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.78)",
      backgroundColor: theme.isDark ? "#070A12" : "#E7EEF8",
      padding: spacing.sm,
      gap: spacing.xs,
      alignItems: "center",
      shadowColor: "#000000",
      shadowOpacity: theme.isDark ? 0.42 : 0.16,
      shadowRadius: 26,
      shadowOffset: { width: 0, height: 18 },
      elevation: 7
    },
    phoneStatusBar: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xs
    },
    phoneTime: {
      color: theme.isDark ? "#F8FAFC" : colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    phoneSignalGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5
    },
    phoneSignal: {
      width: 18,
      height: 10,
      borderRadius: 3,
      backgroundColor: theme.isDark ? "#D7DEE9" : "#111827"
    },
    phoneBattery: {
      width: 22,
      height: 10,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: theme.isDark ? "#D7DEE9" : "#111827"
    },
    phoneWidgetSlot: {
      minHeight: 168,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.sm,
      borderRadius: radii.xl,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.36)"
    },
    simpleWidgetCard: {
      width: "78%",
      minHeight: 142,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.20)" : "rgba(17,24,39,0.14)",
      backgroundColor: theme.isDark ? "rgba(19,27,43,0.96)" : "#FFFFFF",
      padding: spacing.md,
      justifyContent: "center",
      gap: 4
    },
    simpleWidgetKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    simpleWidgetValue: {
      color: colors.ink,
      fontSize: 32,
      lineHeight: 38,
      fontWeight: "900"
    },
    simpleWidgetDetail: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    simpleWidgetRow: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    heroWidgetPreview: {
      shadowColor: "#000000",
      shadowOpacity: theme.isDark ? 0.35 : 0.16,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
      elevation: 5
    },
    homeScreenDock: {
      display: "none",
      width: "100%",
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.72)",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.11)" : "rgba(255,255,255,0.66)",
      padding: 8,
      flexDirection: "row",
      justifyContent: "space-around"
    },
    homeIcon: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.22)" : "rgba(17,24,39,0.18)"
    },
    homeIconActive: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: colors.accent
    },
    studioInspector: {
      gap: spacing.sm
    },
    inspectorHeader: {
      gap: 4
    },
    inspectorKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    inspectorTitle: {
      color: theme.isDark ? "#FFFFFF" : colors.ink,
      fontSize: 20,
      lineHeight: 25,
      fontWeight: "900"
    },
    inspectorCopy: {
      color: theme.isDark ? "#C5CFDD" : colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    quickFactGrid: {
      flexDirection: "row",
      gap: spacing.xs
    },
    quickFact: {
      flex: 1,
      minHeight: 84,
      borderRadius: radii.lg,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.085)" : "rgba(255,255,255,0.76)",
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.78)",
      padding: spacing.xs,
      gap: 2
    },
    quickFactLabel: {
      color: colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    quickFactValue: {
      color: theme.isDark ? "#FFFFFF" : colors.ink,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    quickFactDetail: {
      color: theme.isDark ? "#C5CFDD" : colors.muted,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "800"
    },
    proofMeter: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.78)",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.065)" : "rgba(255,255,255,0.74)",
      padding: spacing.xs,
      gap: spacing.xs
    },
    proofMeterTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs
    },
    proofMeterTitle: {
      color: theme.isDark ? "#FFFFFF" : colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    proofMeterScore: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    proofSignalRow: {
      flexDirection: "row",
      gap: 6
    },
    proofSignal: {
      flex: 1,
      minWidth: 0,
      borderRadius: radii.md,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : colors.surfaceAlt,
      paddingHorizontal: 7,
      paddingVertical: 6,
      gap: 1
    },
    proofSignalLabel: {
      color: colors.accent,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    proofSignalValue: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 15,
      fontWeight: "900"
    },
    proofSignalDetail: {
      color: colors.muted,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "800"
    },
    placementGuide: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)",
      backgroundColor: theme.isDark ? "rgba(4,8,16,0.58)" : "rgba(248,250,252,0.82)",
      padding: spacing.sm,
      gap: 4
    },
    placementGuideKicker: {
      color: colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    placementGuideTitle: {
      color: theme.isDark ? "#FFFFFF" : colors.ink,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    placementGuideCopy: {
      color: theme.isDark ? "#C5CFDD" : colors.muted,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "800"
    },
    primaryActionRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    primaryStudioAction: {
      flex: 1.35,
      borderRadius: radii.round
    },
    secondaryStudioAction: {
      flex: 1,
      borderRadius: radii.round
    },
    studioPickerRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    studioTemplateTile: {
      width: "48.5%",
      minHeight: 118,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.76)",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.065)" : "rgba(255,255,255,0.74)",
      padding: spacing.sm,
      gap: 5
    },
    studioTemplateTileActive: {
      borderColor: colors.accent,
      backgroundColor: theme.isDark ? "rgba(53,242,208,0.16)" : colors.accentSoft
    },
    studioTemplateTileLocked: {
      opacity: 0.72
    },
    studioTemplateTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs
    },
    studioTemplateIcon: {
      width: 32,
      height: 32,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft
    },
    studioTemplateIconActive: {
      backgroundColor: colors.accent
    },
    studioTemplateBadge: {
      color: colors.sage,
      backgroundColor: colors.mint,
      borderRadius: 8,
      overflow: "hidden",
      paddingHorizontal: 7,
      paddingVertical: 2,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    studioTemplateBadgePlus: {
      color: colors.gold,
      backgroundColor: colors.softGold
    },
    studioTemplateTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: "900"
    },
    studioTemplateDetail: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    instantControlsCard: {
      gap: spacing.sm,
      padding: spacing.md
    },
    instantControlsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    instantControlsKicker: {
      color: colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    instantControlsTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    instantSizeRail: {
      gap: spacing.xs,
      paddingRight: spacing.md
    },
    instantSizeCard: {
      width: 94,
      minHeight: 70,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.13)" : colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : colors.surface,
      padding: spacing.xs,
      justifyContent: "center",
      gap: 3
    },
    ruleRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6
    },
    rulePill: {
      borderRadius: radii.round,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.06)" : colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      paddingHorizontal: 8,
      paddingVertical: 6
    },
    rulePillText: {
      color: colors.ink,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    agendaBoard: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    agendaColumn: {
      flexGrow: 1,
      flexBasis: "47%",
      minWidth: 158,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.76)",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.74)",
      padding: spacing.sm,
      gap: spacing.xs
    },
    agendaColumnKicker: {
      color: colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    agendaColumnTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: "900"
    },
    agendaItem: {
      minHeight: 48,
      borderRadius: radii.md,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.07)" : colors.surfaceAlt,
      flexDirection: "row",
      overflow: "hidden"
    },
    agendaColorRail: {
      width: 5
    },
    agendaItemCopy: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: spacing.xs,
      paddingVertical: 7,
      gap: 2
    },
    agendaItemTitle: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    agendaItemMeta: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "800"
    },
    agendaEmptyText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    nativeTruthGrid: {
      gap: 6
    },
    nativeTruthPill: {
      borderRadius: 8,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : colors.surfaceAlt,
      paddingHorizontal: 8,
      paddingVertical: 6
    },
    nativeTruthText: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    nativeTruthTextActive: {
      color: colors.ink
    },
    lockParityBoard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.76)",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.74)",
      padding: spacing.sm,
      gap: spacing.sm
    },
    lockPreviewHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    lockPreviewTitleBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    lockPreviewKicker: {
      color: colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    lockPreviewTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: "900"
    },
    lockPreviewNote: {
      flex: 1,
      minWidth: 132,
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800",
      textAlign: "right"
    },
    lockPreviewRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "flex-end",
      gap: spacing.sm
    },
    lockPreviewFamily: {
      minWidth: 92,
      flexGrow: 1,
      gap: 6
    },
    lockPreviewFamilyLabel: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    lockPreviewWidgetSlot: {
      minHeight: 76,
      alignItems: "center",
      justifyContent: "center"
    },
    moreHubCard: {
      gap: spacing.md,
      padding: spacing.md
    },
    moreHubTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md
    },
    moreHubCopy: {
      flex: 1,
      gap: spacing.xs
    },
    moreHubKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    moreHubTitle: {
      color: colors.ink,
      fontSize: 26,
      lineHeight: 31,
      fontWeight: "900"
    },
    moreHubText: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    moreHubIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.heroSurface
    },
    destinationGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    destinationCard: {
      flexGrow: 1,
      flexBasis: "47%",
      minWidth: 148,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.045)" : colors.surfaceAlt,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    destinationIcon: {
      width: 34,
      height: 34,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft
    },
    destinationCopy: {
      flex: 1,
      gap: 3
    },
    destinationTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6
    },
    destinationTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900"
    },
    destinationLock: {
      color: colors.heroText,
      backgroundColor: colors.gold,
      borderRadius: radii.round,
      overflow: "hidden",
      minWidth: 36,
      paddingHorizontal: 7,
      paddingVertical: 2,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "900",
      textAlign: "center",
      flexShrink: 0
    },
    destinationDetail: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    settingsCard: {
      gap: spacing.md,
      padding: spacing.md
    },
    settingsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    settingToggle: {
      flexGrow: 1,
      flexBasis: "47%",
      minWidth: 148,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.045)" : colors.surfaceAlt,
      padding: spacing.sm,
      gap: spacing.xs
    },
    settingToggleActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    settingToggleTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    settingIcon: {
      width: 32,
      height: 32,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.heroSurface
    },
    toggleTrack: {
      width: 42,
      height: 24,
      borderRadius: 12,
      padding: 3,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(17,24,39,0.12)"
    },
    toggleTrackActive: {
      backgroundColor: colors.accent
    },
    toggleThumb: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.surface
    },
    toggleThumbActive: {
      alignSelf: "flex-end"
    },
    settingTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900"
    },
    settingDetail: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    trustPanel: {
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(47, 178, 130, 0.1)" : "rgba(47, 178, 130, 0.08)",
      padding: spacing.md,
      gap: spacing.sm
    },
    trustPanelHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    trustPanelCopy: {
      flex: 1,
      gap: 2
    },
    trustPanelTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: "900"
    },
    trustPanelText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    trustFactRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    trustFactDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.green
    },
    trustFactText: {
      flex: 1,
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    legalGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    legalCard: {
      flexGrow: 1,
      flexBasis: "47%",
      minWidth: 148,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.045)" : colors.surfaceAlt,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    legalIcon: {
      width: 32,
      height: 32,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft
    },
    legalCopy: {
      flex: 1,
      gap: 2
    },
    legalTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900"
    },
    legalDetail: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    studioHero: {
      gap: spacing.md,
      padding: spacing.md
    },
    heroHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm
    },
    heroCopy: {
      flex: 1,
      gap: spacing.xs
    },
    kicker: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    heroTitle: {
      color: colors.heroText,
      fontSize: 27,
      lineHeight: 32,
      fontWeight: "900"
    },
    heroText: {
      color: colors.heroMuted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "800"
    },
    livePill: {
      minHeight: 28,
      borderRadius: radii.round,
      backgroundColor: "rgba(255,255,255,0.15)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 6
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#36D399"
    },
    liveText: {
      color: colors.heroText,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    tutorialCard: {
      gap: spacing.xs,
      padding: spacing.md
    },
    tutorialRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    tutorialText: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    previewStage: {
      alignItems: "center",
      gap: spacing.sm,
      paddingTop: spacing.xs
    },
    previewHint: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800",
      textAlign: "center"
    },

    auditCard: {
      gap: spacing.sm,
      padding: spacing.md
    },
    auditTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    auditKicker: {
      color: colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    auditTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    auditStatus: {
      color: colors.heroText,
      backgroundColor: colors.heroSurface,
      borderRadius: radii.round,
      overflow: "hidden",
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    auditGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6
    },
    auditPill: {
      borderRadius: radii.round,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.04)" : colors.surfaceAlt,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5
    },
    auditPillActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    auditPillText: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    auditPillTextActive: {
      color: colors.ink
    },
    auditNote: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    installCard: {
      gap: spacing.sm,
      padding: spacing.md
    },
    installHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    installIcon: {
      width: 38,
      height: 38,
      borderRadius: 14,
      backgroundColor: colors.heroSurface,
      alignItems: "center",
      justifyContent: "center"
    },
    installCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    installTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900"
    },
    installText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    installSteps: {
      flexDirection: "row",
      gap: 6
    },
    installStep: {
      flex: 1,
      color: colors.ink,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : colors.surfaceAlt,
      borderRadius: radii.lg,
      overflow: "hidden",
      paddingHorizontal: 8,
      paddingVertical: 8,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textAlign: "center"
    },
    commandCard: {
      gap: spacing.md,
      padding: spacing.md,
      borderColor: colors.accentSoft
    },
    commandHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm
    },
    commandCopy: {
      flex: 1,
      minWidth: 0
    },
    commandKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    commandTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    commandScorePill: {
      minWidth: 58,
      alignItems: "center",
      borderRadius: radii.lg,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs
    },
    commandScoreValue: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 18,
      fontWeight: "900"
    },
    commandScoreLabel: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    commandGrid: {
      gap: spacing.xs
    },
    commandStep: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radii.lg,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.05)" : colors.surfaceAlt
    },
    commandStepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      overflow: "hidden",
      color: colors.heroText,
      backgroundColor: colors.heroSurface,
      textAlign: "center",
      lineHeight: 24,
      fontSize: 12,
      fontWeight: "900"
    },
    commandStepText: {
      flex: 1,
      color: colors.ink,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    dataConnectionGrid: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.xs
    },
    dataConnectionCard: {
      flex: 1,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.sm,
      gap: 2
    },
    dataConnectionValue: {
      color: colors.ink,
      fontSize: 22,
      lineHeight: 27,
      fontWeight: "900"
    },
    dataConnectionLabel: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    dataConnectionHint: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800",
      marginBottom: spacing.md
    },
    leverageCard: {
      gap: spacing.md,
      padding: spacing.md
    },
    leverageTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    leverageIcon: {
      width: 42,
      height: 42,
      borderRadius: 15,
      backgroundColor: colors.heroSurface,
      alignItems: "center",
      justifyContent: "center"
    },
    leverageCopy: {
      flex: 1,
      minWidth: 0,
      gap: 3
    },
    leverageTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    leverageText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    leverageGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6
    },
    leveragePill: {
      maxWidth: "48.5%",
      flexGrow: 1,
      borderRadius: radii.round,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.045)" : colors.surfaceAlt,
      paddingHorizontal: 9,
      paddingVertical: 6
    },
    leveragePillActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    leveragePillText: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900"
    },
    leveragePillTextActive: {
      color: colors.ink
    },
    readinessCard: {
      gap: spacing.xs,
      padding: spacing.sm
    },
    readinessRow: {
      minHeight: 56,
      borderRadius: radii.lg,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.045)" : colors.surfaceAlt,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    readinessIcon: {
      width: 32,
      height: 32,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center"
    },
    readinessIconActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent
    },
    readinessCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    readinessTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    readinessDetail: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    readinessStatus: {
      color: colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    readinessStatusActive: {
      color: colors.green
    },
    smartStackCard: {
      gap: spacing.md
    },
    smartStackHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    smartStackIcon: {
      width: 40,
      height: 40,
      borderRadius: 15,
      backgroundColor: colors.heroSurface,
      alignItems: "center",
      justifyContent: "center"
    },
    smartStackCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    smartStackTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    smartStackText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    smartStackPlus: {
      color: colors.heroText,
      backgroundColor: colors.heroSurface,
      borderRadius: radii.round,
      overflow: "hidden",
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    scheduleGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    scheduleSlot: {
      width: "48.5%",
      minHeight: 112,
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.78)",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.72)",
      padding: spacing.sm,
      gap: 4,
      overflow: "hidden"
    },
    scheduleSlotActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    scheduleTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs
    },
    scheduleTime: {
      color: colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    scheduleMiniValue: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: "900"
    },
    scheduleLabel: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900"
    },
    schedulePromise: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    themePackGrid: {
      gap: spacing.xs
    },
    themePackCard: {
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.13)" : colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.05)" : colors.surface,
      padding: spacing.sm,
      gap: spacing.xs,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.14 : 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2
    },
    themePackCardActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    themePackCardLocked: {
      opacity: 0.74
    },
    themePackSwatches: {
      flexDirection: "row",
      gap: 4
    },
    themePackSwatch: {
      flex: 1,
      height: 30,
      borderRadius: 11
    },
    themePackTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    themePackTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    themePackDetail: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "700"
    },
    appearanceCard: {
      gap: spacing.sm,
      padding: spacing.md
    },
    appearanceTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    appearanceCopy: {
      flex: 1,
      gap: 3
    },
    appearanceTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900"
    },
    appearanceText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    appearanceBadge: {
      minHeight: 30,
      borderRadius: radii.round,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 6
    },
    appearanceBadgeText: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    appThemeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    appThemeButton: {
      width: "48.5%",
      minHeight: 72,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.xs,
      gap: spacing.xs
    },
    appThemeButtonActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    appThemeButtonLocked: {
      opacity: 0.72
    },
    appThemeSwatches: {
      flexDirection: "row",
      gap: 4
    },
    appThemeSwatch: {
      flex: 1,
      height: 26,
      borderRadius: 9
    },
    appThemeNameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs
    },
    appThemeName: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    themePlus: {
      color: colors.heroText,
      backgroundColor: colors.heroSurface,
      borderRadius: radii.round,
      overflow: "hidden",
      paddingHorizontal: 7,
      paddingVertical: 2,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "900"
    },
    themeIncluded: {
      color: colors.muted,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "900"
    },
    templateGrid: {
      gap: spacing.xs
    },
    templateCard: {
      minHeight: 92,
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.045)" : colors.surface,
      padding: spacing.sm,
      gap: 2
    },
    templateCardActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    templateCardLocked: {
      opacity: 0.72
    },
    templateTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    templateTitle: {
      flex: 1,
      color: colors.ink,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: "900"
    },
    templateEntitlement: {
      overflow: "hidden",
      borderRadius: 10,
      backgroundColor: colors.mint,
      color: colors.sage,
      paddingHorizontal: 8,
      paddingTop: 2,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    templateEntitlementPlus: {
      backgroundColor: colors.softGold,
      color: colors.gold
    },
    templateDetail: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    templateMeta: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    controlsCard: {
      gap: spacing.sm
    },
    liveWorkbench: {
      borderRadius: radii.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.82)",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.74)",
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      overflow: "hidden"
    },
    liveWorkbenchPreview: {
      width: 112,
      alignItems: "center",
      transform: [{ scale: 0.84 }]
    },
    liveMiniWidget: {
      marginLeft: -10,
      marginRight: -10
    },
    liveWorkbenchCopy: {
      flex: 1,
      minWidth: 0,
      gap: 3
    },
    liveWorkbenchKicker: {
      color: colors.accent,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    liveWorkbenchTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    liveWorkbenchText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    controlLabel: {
      marginTop: spacing.xs,
      color: colors.faint,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    sizeGrid: {
      flexDirection: "row",
      gap: spacing.xs
    },
    sizeCard: {
      flex: 1,
      minHeight: 70,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.xs,
      justifyContent: "center",
      gap: 3
    },
    sizeCardActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    sizeTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900",
      textAlign: "center"
    },
    sizeDetail: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "800",
      textAlign: "center"
    },
    chipRail: {
      gap: spacing.xs,
      paddingRight: spacing.md
    },
    choiceChip: {
      minHeight: 34,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 6
    },
    choiceChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    choiceChipText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900"
    },
    choiceChipTextActive: {
      color: colors.heroText
    },
    choiceDot: {
      width: 8,
      height: 8,
      borderRadius: 4
    },
    paletteRail: {
      gap: spacing.xs,
      paddingRight: spacing.md
    },
    paletteButton: {
      width: 96,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.xs,
      gap: spacing.xs
    },
    paletteButtonActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    paletteDots: {
      flexDirection: "row",
      gap: 4
    },
    paletteDot: {
      flex: 1,
      height: 28,
      borderRadius: 10
    },
    paletteName: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    layoutRail: {
      gap: spacing.xs,
      paddingRight: spacing.md
    },
    layoutOption: {
      width: 76,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.xs,
      gap: spacing.xs
    },
    layoutOptionActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    layoutLines: {
      height: 44,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceAlt,
      padding: 7,
      gap: 5,
      justifyContent: "center"
    },
    layoutLineStrong: {
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.accent
    },
    layoutLine: {
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.lineStrong
    },
    layoutGrid: {
      height: 15,
      borderRadius: 4,
      backgroundColor: colors.brandPink
    },
    layoutLabel: {
      color: colors.ink,
      fontSize: 11,
      textAlign: "center",
      fontWeight: "900"
    },
    iconGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center"
    },
    iconButtonActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    emptyHelper: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800",
      paddingVertical: spacing.xs
    },
    lockNotice: {
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : colors.surfaceAlt,
      padding: spacing.sm,
      gap: 3
    },
    lockNoticeTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    lockNoticeText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    controlActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm
    },
    actionButton: {
      flex: 1
    },
    packCard: {
      gap: spacing.xs,
      padding: spacing.md
    },
    packTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    packCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "800"
    },
    helpCard: {
      gap: spacing.sm,
      padding: spacing.md
    },
    helpStep: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    helpNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: colors.accent,
      color: colors.heroText,
      textAlign: "center",
      fontSize: 13,
      lineHeight: 24,
      fontWeight: "900"
    },
    helpText: {
      flex: 1,
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "800"
    },
    savedCard: {
      gap: spacing.xs,
      padding: spacing.sm
    },
    savedEmpty: {
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderStyle: "dashed",
      borderColor: colors.lineStrong,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.035)" : colors.surfaceAlt,
      padding: spacing.md,
      gap: 4
    },
    savedEmptyTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    savedEmptyText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    savedRow: {
      minHeight: 58,
      borderRadius: radii.lg,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.04)" : colors.surfaceAlt
    },
    savedRowActive: {
      backgroundColor: colors.accentSoft
    },
    savedIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center"
    },
    savedIconText: {
      fontSize: 16,
      lineHeight: 20
    },
    savedCopy: {
      flex: 1,
      minWidth: 0
    },
    savedTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    savedMeta: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    savedAction: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    saveCurrentRow: {
      minHeight: 48,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderStyle: "dashed",
      borderColor: colors.lineStrong,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    saveCurrentText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900"
    },
    saveCurrentPlus: {
      color: colors.accent,
      fontSize: 22,
      lineHeight: 26,
      fontWeight: "900"
    },
    themeRail: {
      gap: spacing.sm,
      paddingRight: spacing.lg
    },
    modeCard: {
      gap: spacing.sm,
      marginBottom: spacing.sm
    },
    modeTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "900"
    },
    modeCopy: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    settingsList: {
      gap: spacing.sm
    },
    paywallCard: {
      gap: spacing.md
    },
    paywallKicker: {
      color: "#BDB7FF",
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    paywallTitle: {
      color: "#FFFFFF",
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "900"
    },
    paywallCopy: {
      color: "#DAD7FF",
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "700"
    },
    planRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    planCard: {
      flex: 1,
      minHeight: 88,
      borderRadius: radii.lg,
      backgroundColor: "rgba(255,255,255,0.12)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      padding: spacing.md,
      justifyContent: "center"
    },
    planCardBest: {
      borderColor: colors.brandPink
    },
    bestBadge: {
      color: colors.brandPink,
      fontSize: 10,
      fontWeight: "900"
    },
    planTitle: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900"
    },
    planPrice: {
      color: "#FFFFFF",
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "900"
    }
  });
}
