import React, { useEffect, useMemo, useState } from "react";
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
  ListChecks,
  NotebookPen,
  Palette,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Timer,
  TrendingUp
} from "lucide-react-native";
import {
  GlassCard,
  WidgetPreviewCard
} from "../components/AppleComponents";
import { AppButton } from "../components/AppButton";
import { LiquidGlassWidgetPreview } from "../components/LiquidGlass";
import { ModeToggle } from "../components/ModeToggle";
import { SectionHeader } from "../components/SectionHeader";
import {
  Assignment,
  Course,
  FocusSession,
  ParsedImport,
  Semester,
  StudyNote,
  UserSettings,
  WidgetBackground,
  WidgetDataMode,
  WidgetLayout,
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
import { supportedLocales, useI18n, type SupportedLocale } from "../i18n";
import {
  resolveWidgetTheme,
  widgetThemeChoiceFromPreset,
  widgetThemeDefinitions,
  widgetThemeOrder,
  WidgetThemeChoice
} from "../widgets/widgetThemes";
import {
  buildCanonicalWidgetPreset,
  defaultDataModeForWidgetKind,
  defaultLayoutForWidgetKind,
  ensureCanonicalWidgetPresets,
  isNativeWidgetPreset,
  isValidDataModeForWidgetKind,
  isValidLayoutForWidgetKind,
  nativeNameForWidgetKind,
  shippedWidgetDefinitions,
  widgetKindForPreset,
  widgetKindForType
} from "../widgets/widgetPresets";

type MoreScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  notes?: StudyNote[];
  focusSessions?: FocusSession[];
  semester: Semester;
  parsedImports: ParsedImport[];
  demoMode?: boolean;
  settings: UserSettings;
  widgetPresets: WidgetPreset[];
  nativeWidgetStatus: WidgetSyncStatus;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onSaveWidgetPreset: (preset: WidgetPreset) => void;
  onResetWidgetPresets: () => void;
  locale?: SupportedLocale;
  onLocaleChange?: (locale: SupportedLocale) => void;
  onOpenNotes: () => void;
  onOpenFocus: () => void;
  onOpenGrades: () => void;
};

const widgetSizes: WidgetSize[] = ["small", "medium"];
const appThemeOptions: ThemeAccent[] = ["campus", "graphite", "mint", "slate", "solar"];

function isNativeEligiblePreset(preset: Pick<WidgetPreset, "type" | "size">) {
  return isNativeWidgetPreset({ ...preset, widgetKind: widgetKindForType(preset.type) });
}

export function MoreScreen({
  assignments,
  courses,
  notes = [],
  focusSessions = [],
  semester,
  parsedImports,
  demoMode = false,
  settings,
  widgetPresets,
  nativeWidgetStatus,
  onUpdateSettings,
  onSaveWidgetPreset,
  onResetWidgetPresets,
  locale: activeLocale,
  onLocaleChange,
  onOpenNotes,
  onOpenFocus,
  onOpenGrades
}: MoreScreenProps) {
  const { theme, setAccent } = useAppTheme();
  const { t, locale } = useI18n();
  const { colors } = theme;
  const styles = createStyles(theme);
  const canonicalWidgetPresets = useMemo(
    () => ensureCanonicalWidgetPresets(widgetPresets),
    [widgetPresets]
  );
  const firstPreset = widgetPresets.find(isNativeEligiblePreset) || canonicalWidgetPresets[0];
  const [type, setType] = useState<WidgetType>(firstPreset?.type || "today");
  const [size, setSize] = useState<WidgetSize>(firstPreset?.size || "medium");
  const [background, setBackground] = useState<WidgetBackground>(
    firstPreset?.background || settings.defaultWidgetStyle
  );
  const [palette, setPalette] = useState<WidgetPalette>(firstPreset?.palette || "ocean");
  const [dataMode, setDataMode] = useState<WidgetDataMode>(
    firstPreset?.dataMode || dataModeForWidget(firstPreset?.type || "today")
  );
  const [styleChoice, setStyleChoice] = useState<WidgetThemeChoice>(
    widgetThemeChoiceFromPreset(firstPreset)
  );
  const [font, setFont] = useState<WidgetPreset["font"]>(firstPreset?.font || "SF Pro");
  const [classFocusCourseId, setClassFocusCourseId] = useState<string | undefined>(
    firstPreset?.classFocusCourseId
  );
  const [layout, setLayout] = useState<WidgetLayout>(firstPreset?.layout || defaultLayoutForWidgetKind(widgetKindForType(firstPreset?.type || "today")));
  const [iconKey, setIconKey] = useState(firstPreset?.iconKey || "book");
  const [editingPresetId, setEditingPresetId] = useState(firstPreset?.id || "preset-due-next");
  const [selectedThemePackId, setSelectedThemePackId] = useState<string | undefined>(firstPreset?.themePackId);

  useEffect(() => {
    if (!firstPreset) return;
    setType(firstPreset.type);
    setSize(firstPreset.size);
    setBackground(firstPreset.background);
    setPalette(firstPreset.palette);
    setDataMode(firstPreset.dataMode || dataModeForWidget(firstPreset.type));
    setStyleChoice(widgetThemeChoiceFromPreset(firstPreset));
    setFont(firstPreset.font);
    setClassFocusCourseId(firstPreset.classFocusCourseId);
    setLayout(firstPreset.layout);
    setIconKey(firstPreset.iconKey);
    setSelectedThemePackId(firstPreset.themePackId);
    setEditingPresetId(firstPreset.id);
  }, [firstPreset?.id, firstPreset?.updatedAt]);

  const selectedWidgetKind = widgetKindForType(type);
  const selectedWidgetDefinition = shippedWidgetDefinitions[selectedWidgetKind];
  const selectedNativeName = nativeNameForWidgetKind(selectedWidgetKind);
  const allowedDataModes = selectedWidgetDefinition.dataModes;
  const allowedLayouts = selectedWidgetDefinition.layouts;
  const requiresClassSelection = dataMode === "single_class" || selectedWidgetKind === "classProgress";
  const classSelectionMissing = requiresClassSelection && !classFocusCourseId;

  useEffect(() => {
    if (!isValidDataModeForWidgetKind(selectedWidgetKind, dataMode)) {
      setDataMode(defaultDataModeForWidgetKind(selectedWidgetKind));
    }
    if (!isValidLayoutForWidgetKind(selectedWidgetKind, layout)) {
      setLayout(defaultLayoutForWidgetKind(selectedWidgetKind));
    }
    if (selectedWidgetKind === "classProgress") {
      setDataMode("single_class");
    } else if (dataMode !== "single_class") {
      setClassFocusCourseId(undefined);
    }
  }, [dataMode, layout, selectedWidgetKind]);

  const nativeLabel = t("more.native", "Native");
  const includedLabel = t("more.included", "Included with StudyPlanner");
  const readyLabel = t("more.ready", "Ready");
  const fixLabel = t("more.fix", "Fix");
  const widgetTypeLabels: Record<WidgetType, string> = {
    due_next: t("more.widget_type_due_next", "Upcoming"),
    today: t("more.widget_type_today", "Today"),
    needs_check: t("more.widget_type_needs_check", "Needs Check"),
    week: t("more.widget_type_week", "Week"),
    class_focus: t("more.widget_type_class_focus", "Class Progress"),
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
    contrast: t("more.style_high_contrast", "High contrast"),
    minimal: t("more.palette_minimal", "Minimal")
  };
  const dataModeLabels: Record<WidgetDataMode, string> = {
    all_classes: t("widget_snapshot.all_classes", "All classes"),
    single_class: t("more.data_one_class", "One class"),
    today: t("widget_snapshot.today", "Today"),
    this_week: t("today.this_week", "This week"),
    urgent_only: t("more.data_urgent_only", "Urgent only"),
    next_up: t("more.data_next_up", "Next up"),
    next3: t("more.data_next3", "Next 3")
  };
  const layoutLabels: Record<WidgetLayout, string> = {
    compact: t("widget_snapshot.layout_compact", "Compact"),
    list: t("widget_snapshot.layout_list", "List"),
    ring: t("widget_snapshot.layout_ring", "Ring"),
    calendar: t("widget_snapshot.layout_calendar", "Calendar"),
    grid: t("widget_snapshot.layout_grid", "Grid"),
    progress: t("widget_snapshot.layout_progress", "Progress"),
    timeline: t("widget_snapshot.layout_timeline", "Timeline"),
    strip: t("widget_snapshot.layout_strip", "Strip"),
    summary: t("widget_snapshot.layout_summary", "Summary"),
    next_task: t("widget_snapshot.layout_next_task", "Next task")
  };
  const styleChoiceLabels: Record<WidgetThemeChoice, string> = Object.fromEntries(
    widgetThemeOrder.map((choice) => {
      const definition = widgetThemeDefinitions[choice];
      return [choice, t(definition.labelKey, definition.fallbackLabel)];
    })
  ) as Record<WidgetThemeChoice, string>;
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
  const localeValue = activeLocale || locale;
  const cycleLocale = () => {
    if (!onLocaleChange) return;
    const currentIndex = supportedLocales.indexOf(localeValue);
    const next = supportedLocales[(currentIndex + 1) % supportedLocales.length] || "en-US";
    onLocaleChange(next);
  };
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
    () =>
      buildCanonicalWidgetPreset(selectedWidgetKind, {
        id: editingPresetId || "preview",
        name: widgetTypeLabel(type),
        type,
        size,
        theme: styleChoice,
        background,
        palette,
        dataMode,
        font,
        classFocusCourseId: requiresClassSelection ? classFocusCourseId : undefined,
        layout,
        iconKey,
        themePackId: selectedThemePackId
      }),
    [background, classFocusCourseId, dataMode, editingPresetId, font, iconKey, layout, palette, requiresClassSelection, selectedThemePackId, selectedWidgetKind, size, styleChoice, type, widgetTypeLabels]
  );
  const widgetData = getWidgetData(previewPreset, assignments, courses, undefined, focusSessions, notes, locale);
  const previewWidgetPresets = useMemo(
    () =>
      isNativeEligiblePreset(previewPreset)
        ? [previewPreset, ...canonicalWidgetPresets.filter((preset) => widgetKindForPreset(preset) !== selectedWidgetKind)]
        : canonicalWidgetPresets,
    [canonicalWidgetPresets, previewPreset, selectedWidgetKind]
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
        demoMode,
        locale,
        translate: t
      }),
    [assignments, courses, demoMode, locale, parsedImports, previewWidgetPresets, semester, settings, t]
  );
  const nativePreview =
    selectedWidgetKind === "today"
      ? nativeSnapshots.today
      : selectedWidgetKind === "upcoming"
        ? nativeSnapshots.upcoming
        : selectedWidgetKind === "week"
          ? nativeSnapshots.week
          : nativeSnapshots.classProgress;
  const hasAssignments = assignments.length > 0;
  const hasCourses = courses.length > 0;
  const needsClassFirst = requiresClassSelection && (!hasCourses || !classFocusCourseId);
  const displayWidgetData = nativePreview
      ? {
        headline: nativePreview.headline,
        value: nativePreview.value,
        detail: nativePreview.detail,
        items: nativePreview.items,
        course: undefined,
        weekLoad: selectedWidgetKind === "week" ? widgetData.weekLoad : undefined,
        progress: nativePreview.progress,
        progressLabel: nativePreview.progressLabel
      }
    : needsClassFirst
    ? { ...widgetData, headline: selectedNativeName, value: "+", detail: t("more.choose_class_first", "Choose a class first"), items: [] }
    : !hasAssignments && type !== "class_focus"
      ? { ...widgetData, headline: widgetTypeLabel(type), value: "+", detail: t("more.add_homework_to_preview", "Add homework to preview"), items: [] }
      : widgetData;
  const studioHint = needsClassFirst
    ? t("more.class_needed_hint", "This widget needs one selected class before it can be saved.")
    : nativePreview
    ? formatMore(t("more.native_studio_hint", "{footnote} Preview updates as you edit; saving writes the preset to native widget state."), {
        footnote: nativePreview.footnote
      })
    : !hasAssignments && type !== "class_focus"
      ? t("more.homework_hint", "Your real homework will appear here after you add or scan it.")
      : t("more.planner_preview_hint", "This preview uses planner data. iOS placement and Smart Stack ordering still happen in the system widget gallery.");
  const focusedCourse = classFocusCourseId
    ? courses.find((course) => course.id === classFocusCourseId)
    : undefined;
  const starterTemplates: Array<{
    label: string;
    detail: string;
    moment: string;
    data: string;
    preset: Pick<WidgetPreset, "type" | "size" | "background" | "palette" | "layout" | "iconKey" | "dataMode">;
  }> = [
    {
      label: t("more.widget_type_today", "Today"),
      detail: t("more.today_widget_job", "What do I need to do today?"),
      moment: t("more.template_today_moment", "Morning stack"),
      data: t("widget_snapshot.today", "Today"),
      preset: { type: "today", size: "medium", background: "light", palette: "paper", dataMode: "today", layout: "list", iconKey: "check" }
    },
    {
      label: t("more.widget_type_due_next", "Upcoming"),
      detail: t("more.upcoming_widget_job", "What deadline is coming next?"),
      moment: t("more.template_upcoming_moment", "Home Screen"),
      data: t("more.template_upcoming_data", "Reviewed deadlines"),
      preset: { type: "due_next", size: "small", background: "glass", palette: "ocean", dataMode: "next3", layout: "timeline", iconKey: "calendar" }
    },
    {
      label: t("more.template_deadline_label", "Week"),
      detail: t("more.week_widget_job", "How heavy is this week?"),
      moment: t("more.template_deadline_moment", "Weekly review"),
      data: t("more.template_deadline_data", "Due soon"),
      preset: { type: "week", size: "medium", background: "dark", palette: "graphite", dataMode: "this_week", layout: "strip", iconKey: "calendar" }
    },
    {
      label: t("more.template_class_label", "Class Progress"),
      detail: t("more.class_progress_widget_job", "How am I doing in this class?"),
      moment: t("more.template_class_moment", "Before class"),
      data: t("more.template_class_data", "Class-specific"),
      preset: { type: "class_focus", size: "small", background: "glass", palette: "forest", dataMode: "single_class", layout: "progress", iconKey: "book" }
    }
  ];
  const nativeStatusLabel =
    nativeWidgetStatus.state === "synced"
      ? t("more.status_synced", "Synced")
      : nativeWidgetStatus.state === "unavailable"
        ? t("more.status_build_needed", "Build needed")
        : t("more.status_needs_install", "Needs install");
  const nativeStatusMessage =
    nativeWidgetStatus.state === "synced"
      ? t("more.install_status_synced_message", "StudyPlanner widgets are using reviewed planner data.")
      : nativeWidgetStatus.state === "unavailable"
        ? t("more.install_status_unavailable_message", "Install a native iOS build with the widget extension to add widgets.")
        : t("more.install_status_needs_install_message", "Native widgets sync after your planner loads.");
  const savedPresets = canonicalWidgetPresets;
  const hasSavedPresets = savedPresets.length > 0;
  const smartPresetCount = canonicalWidgetPresets.length;
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
  const dataSourceLabel = dataModeLabels[dataMode];
  const topPreviewItems = displayWidgetData.items.slice(0, 4);
  const selectedTemplateLabel = widgetTypeLabel(type);
  const primaryActionLabel = classSelectionMissing
      ? t("more.choose_class_first", "Choose a class first")
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
    { label: t("more.step_widget", "Pick widget"), detail: selectedTemplateLabel, active: true },
    { label: t("more.step_data", "Pick data"), detail: dataSourceLabel, active: hasAssignments || type === "class_focus" },
    { label: t("more.step_style", "Pick style"), detail: `${styleChoiceLabels[styleChoice]} / ${layoutLabels[layout]}`, active: true },
    {
      label: t("more.step_place", "Save preset"),
      detail: selectedNativeName,
      active: !classSelectionMissing
    }
  ];
  const moreDestinations = [
    { label: t("tabs.notes", "Notes"), detail: t("more.destination_notes_detail", "Class context"), icon: NotebookPen, action: onOpenNotes },
    { label: t("more.destination_study", "Study"), detail: t("more.destination_study_detail", "Focus sessions"), icon: Timer, action: onOpenFocus },
    { label: t("tabs.grades", "Grades"), detail: t("more.destination_grades_detail", "Grade targets"), icon: TrendingUp, action: onOpenGrades }
  ];
  const privacyFacts = [
    t("more.privacy_fact_imports", "Imports stay in review until accepted."),
    t("more.privacy_fact_widgets", "Widgets use reviewed planner snapshots."),
    t("more.privacy_fact_permissions", "Reminder and calendar permissions are optional.")
  ];

  const applyTemplate = (template: Pick<WidgetPreset, "type" | "size" | "background" | "palette" | "layout" | "iconKey" | "dataMode">) => {
    const nextKind = widgetKindForType(template.type);
    setType(template.type);
    setSize(template.size);
    setBackground(template.background);
    setPalette(template.palette);
    setDataMode(template.dataMode || defaultDataModeForWidgetKind(nextKind));
    setStyleChoice(widgetThemeChoiceFromPreset(template));
    setLayout(template.layout);
    setIconKey(template.iconKey);
    if (template.dataMode !== "single_class" && nextKind !== "classProgress") {
      setClassFocusCourseId(undefined);
    }
    setEditingPresetId(`preset-${nextKind}`);
  };

  const applyStyleChoice = (choice: WidgetThemeChoice) => {
    const stylePreset = resolveWidgetTheme(choice);
    setStyleChoice(choice);
    setBackground(stylePreset.background);
    setPalette(stylePreset.palette);
  };

  const saveCurrentPreset = () => {
    if (classSelectionMissing) return;
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
              onPress={item.action}
            >
              <View style={styles.destinationIcon}>
                <Icon color={colors.accent} size={18} />
              </View>
              <View style={styles.destinationCopy}>
                <View style={styles.destinationTitleRow}>
                  <Text style={styles.destinationTitle}>{item.label}</Text>
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
              <Text style={styles.studioEyebrow}>{t("more.widget_studio", "Customize your iPhone widgets")}</Text>
              <Text style={styles.studioTitle}>{t("more.studio_title", "Pick a shipped widget, then save its preset.")}</Text>
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
                <Text style={styles.studioStepDetail} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{step.detail}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.studioCanvas}>
            <LiquidGlassWidgetPreview
              label={`${selectedTemplateLabel}. ${displayWidgetData.value}. ${displayWidgetData.detail}`}
              style={styles.phoneStage}
            >
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
                  weekLoad={displayWidgetData.weekLoad}
                  progress={displayWidgetData.progress}
                  progressLabel={displayWidgetData.progressLabel}
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
            </LiquidGlassWidgetPreview>

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
                    <Text style={styles.quickFactValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>{fact.value}</Text>
                    <Text style={styles.quickFactDetail} numberOfLines={2}>{fact.detail}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.placementGuide}>
                <Text style={styles.placementGuideKicker}>{t("more.home_screen_handoff", "Home Screen handoff")}</Text>
                <View style={styles.nativeReadyRow}>
                  <Text style={styles.nativeReadyText}>{t("more.ready_for_home_screen", "Ready for Home Screen")}</Text>
                  <Text style={styles.nativeInstallText}>
                    {nativeWidgetStatus.state === "synced" ? t("more.phone_widget_data", "Phone widget data") : t("more.install_native_app", "Install native app")}
                  </Text>
                </View>
                <Text style={styles.placementGuideTitle}>
                  {formatMore(t("more.place_ios_title", "Save preset. Add {name} from iOS."), { name: selectedNativeName })}
                </Text>
                <Text style={styles.placementGuideCopy}>
                  {formatMore(t("more.native_style_fields", "Saved fields: widget, data mode, class filter, theme, layout, and last sync. Add exactly {name} from the iOS widget gallery."), { name: selectedNativeName })}
                </Text>
                <Text style={styles.placementGuideCopy}>
                  {formatMore(t("more.last_synced", "Last synced: {time}"), {
                    time: nativeWidgetStatus.updatedAt ? formatSyncTime(nativeWidgetStatus.updatedAt, locale) : t("more.not_synced_yet", "not synced yet")
                  })}
                </Text>
              </View>
              <View style={styles.primaryActionRow}>
                <AppButton
                  label={primaryActionLabel}
                  icon={CheckCircle2}
                  onPress={saveCurrentPreset}
                  disabled={classSelectionMissing}
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
            const active = template.preset.type === type;
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={template.label}
                style={[styles.studioTemplateTile, active ? styles.studioTemplateTileActive : null]}
                onPress={() => applyTemplate(template.preset)}
              >
                <View style={styles.studioTemplateTop}>
                  <View style={[styles.studioTemplateIcon, active ? styles.studioTemplateIconActive : null]}>
                    <Icon color={active ? colors.accentText : colors.accent} size={16} />
                  </View>
                  <Text style={styles.studioTemplateBadge}>{sizeLabel(template.preset.size)}</Text>
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
              <Text style={styles.instantControlsKicker}>{t("more.step_data", "Data")}</Text>
              <Text style={styles.instantControlsTitle}>{t("more.data_style_title", "Choose real rows, layout, and saved widget style.")}</Text>
            </View>
            <ArrowRight color={colors.accent} size={18} />
          </View>

          <ControlLabel title={t("more.what_data", "What data")} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.instantSizeRail}>
            {allowedDataModes.map((option) => {
              const active = option === dataMode;
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={option}
                  style={[styles.instantSizeCard, active ? styles.sizeCardActive : null]}
                  onPress={() => setDataMode(option)}
                >
                  <Text style={styles.sizeTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>{dataModeLabels[option]}</Text>
                  <Text style={styles.sizeDetail}>{dataModeDetail(option, t)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {dataMode === "single_class" && courses.length > 0 ? (
            <>
              <ControlLabel title={t("more.data_one_class", "One class")} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.instantSizeRail}>
                {courses.map((course) => {
                  const active = course.id === classFocusCourseId;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      key={course.id}
                      style={[styles.instantSizeCard, active ? styles.sizeCardActive : null]}
                      onPress={() => setClassFocusCourseId(course.id)}
                    >
                      <Text style={styles.sizeTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>{course.code}</Text>
                      <Text style={styles.sizeDetail} numberOfLines={1}>{course.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          ) : null}

          {dataMode === "single_class" && courses.length === 0 ? (
            <Text style={styles.agendaEmptyText}>{t("more.class_needed_hint", "This widget needs one selected class before it can be saved.")}</Text>
          ) : null}

          <ControlLabel title={t("more.widget_layout", "Layout")} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.instantSizeRail}>
            {allowedLayouts.map((option) => {
              const active = option === layout;
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={option}
                  style={[styles.instantSizeCard, active ? styles.sizeCardActive : null]}
                  onPress={() => setLayout(option)}
                >
                  <Text style={styles.sizeTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>{layoutLabels[option]}</Text>
                  <Text style={styles.sizeDetail}>{layoutDetail(option, t)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ControlLabel title={t("more.step_style", "Style")} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteRail}>
            {widgetThemeOrder.map((option) => {
              const stylePreset = resolveWidgetTheme(option);
              const swatches = themePalettes[stylePreset.palette];
              const active = option === styleChoice;
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={option}
                  style={[styles.paletteButton, active ? styles.paletteButtonActive : null]}
                  onPress={() => applyStyleChoice(option)}
                >
                  <View style={styles.paletteDots}>
                    {swatches.map((swatch) => (
                      <View key={swatch} style={[styles.paletteDot, { backgroundColor: swatch }]} />
                    ))}
                  </View>
                  <Text style={styles.paletteName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{styleChoiceLabels[option]}</Text>
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
            <Text style={styles.agendaColumnTitle}>{t("more.native_data_title", "Widgets use live planner data")}</Text>
            <Text style={styles.agendaEmptyText}>{t("more.native_data_copy", "StudyPlanner sends reviewed planner rows to WidgetKit. Students still place widgets from iOS.")}</Text>
            <View style={styles.nativeTruthGrid}>
              {widgetReadiness.slice(0, 4).map((item) => (
                <View key={item.label} style={styles.nativeTruthPill}>
                  <Text style={[styles.nativeTruthText, item.active ? styles.nativeTruthTextActive : null]}>{item.active ? readyLabel : fixLabel} · {item.label}</Text>
                </View>
              ))}
            </View>
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
          {onLocaleChange ? (
            <SettingToggle
              icon={FileText}
              title={t("more.language", "Language")}
              detail={formatMore(t("more.language_detail", "Current locale: {locale}"), { locale: localeLabel(localeValue) })}
              active
              onPress={cycleLocale}
            />
          ) : null}
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
      <SectionHeader title={t("more.app_appearance", "App appearance")} note={t("more.app_appearance_note", "Themes restyle the whole app shell, not just one accent.")} />
      <GlassCard style={styles.appearanceCard}>
        <ModeToggle />
        <View style={styles.appearanceTopRow}>
          <View style={styles.appearanceCopy}>
            <Text style={styles.appearanceTitle}>{t("more.app_themes", "App themes")}</Text>
            <Text style={styles.appearanceText}>{t("more.app_themes_text", "Change the app atmosphere: canvas, glass cards, hero surfaces, accents, widget defaults, and class energy.")}</Text>
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
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={option}
                style={[styles.appThemeButton, active ? styles.appThemeButtonActive : null]}
                onPress={() => {
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
                  <Text style={styles.themeIncluded}>{includedLabel}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>
      <SectionHeader title={t("more.saved_presets", "Saved presets")} note={t("more.saved_presets_note", "Saved presets write real native widget state for the Home Screen.")} />
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
              setDataMode(preset.dataMode || dataModeForWidget(preset.type));
              setStyleChoice(widgetThemeChoiceFromPreset(preset));
              setFont(preset.font);
              setClassFocusCourseId(preset.classFocusCourseId);
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
              <Text style={styles.savedMeta}>{preset.scheduleLabel ? `${preset.scheduleLabel} | ` : ""}{widgetTypeLabel(preset.type)} | {dataModeLabels[preset.dataMode || dataModeForWidget(preset.type)]} | {paletteLabel(preset.palette)}</Text>
            </View>
            <Text style={styles.savedAction}>{t("more.edit", "Edit")}</Text>
          </TouchableOpacity>
        ))}
      </GlassCard>

      <SectionHeader title={t("more.install_status", "Install status")} note={nativeStatusMessage} />
      <GlassCard style={styles.helpCard}>
        <View style={styles.helpStep}>
          <Text style={styles.helpNumber}>1</Text>
          <Text style={styles.helpText}>{t("more.help_add_widgets", "Add StudyPlanner Today, Upcoming, Week, or Class Progress from the iOS widget gallery.")}</Text>
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
            <Icon color={active ? colors.accentText : colors.accent} size={17} />
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

function formatSyncTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function labelForWidgetType(value: WidgetType) {
  const labels: Record<WidgetType, string> = {
    due_next: "Upcoming",
    today: "Today",
    needs_check: "Needs Check",
    week: "Week",
    class_focus: "Class Progress",
    empty: "All Done",
    focus: "Focus Timer",
    streak: "Streak"
  };
  return labels[value];
}

function dataModeForWidget(type: WidgetType): WidgetDataMode {
  return defaultDataModeForWidgetKind(widgetKindForType(type));
}

function dataModeDetail(value: WidgetDataMode, t: (key: string, fallback?: string) => string) {
  switch (value) {
    case "single_class":
      return t("more.data_one_class_detail", "Pinned course rows");
    case "today":
      return t("more.data_today_detail", "Due now");
    case "this_week":
      return t("more.data_this_week_detail", "Next 7 days");
    case "urgent_only":
      return t("more.data_urgent_detail", "High priority");
    case "next_up":
      return t("more.data_next_up_detail", "Single next action");
    case "next3":
      return t("more.data_next3_detail", "Three next deadlines");
    case "all_classes":
    default:
      return t("more.data_all_detail", "Every class");
  }
}

function layoutDetail(value: WidgetLayout, t: (key: string, fallback?: string) => string) {
  switch (value) {
    case "progress":
      return t("more.layout_progress_detail", "Completion first");
    case "timeline":
      return t("more.layout_timeline_detail", "Deadline flow");
    case "strip":
      return t("more.layout_strip_detail", "Workload by day");
    case "summary":
      return t("more.layout_summary_detail", "Big picture");
    case "next_task":
      return t("more.layout_next_task_detail", "One next task");
    case "calendar":
      return t("more.layout_calendar_detail", "Week bars");
    case "list":
      return t("more.layout_list_detail", "Rows first");
    case "compact":
      return t("more.layout_compact_detail", "Small answer");
    case "ring":
      return t("more.layout_ring_detail", "Progress ring");
    case "grid":
    default:
      return t("more.layout_grid_detail", "Status dots");
  }
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function localeLabel(value: string) {
  const labels: Record<string, string> = {
    ar: "Arabic",
    de: "Deutsch",
    "en-US": "English (US)",
    es: "Español",
    fr: "Français",
    hi: "हिन्दी",
    ja: "日本語",
    ko: "한국어",
    "pt-BR": "Português (BR)",
    "zh-Hans": "简体中文"
  };
  return labels[value] || value;
}

function widgetItemTitleForStudio(item: { title: string }) {
  return item.title;
}

function widgetItemMetaForStudio(item: { courseCode?: string; dueLabel?: string; priority?: Assignment["priority"] }) {
  return [item.courseCode, item.dueLabel, item.priority === "high" ? "High priority" : undefined]
    .filter(Boolean)
    .join(" / ");
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    studioShell: {
      gap: spacing.md,
      marginBottom: spacing.md
    },
    studioWorkbench: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.86)",
      backgroundColor: theme.isDark ? "rgba(8,12,22,0.92)" : "rgba(255,255,255,0.76)",
      padding: spacing.sm,
      gap: spacing.sm,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.24 : 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
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
      minHeight: 52,
      borderRadius: radii.md,
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
      width: 22,
      height: 22,
      borderRadius: 11,
      overflow: "hidden",
      textAlign: "center",
      color: colors.accentText,
      backgroundColor: colors.accent,
      fontSize: 12,
      lineHeight: 22,
      fontWeight: "900"
    },
    studioStepCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    studioStepLabel: {
      color: theme.isDark ? "#FFFFFF" : colors.ink,
      fontSize: 11,
      lineHeight: 14,
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
      fontSize: 19,
      lineHeight: 24,
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
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.78)",
      backgroundColor: theme.isDark ? "#070A12" : "#E7EEF8",
      padding: spacing.sm,
      gap: spacing.xs,
      alignItems: "center",
      shadowColor: "#000000",
      shadowOpacity: theme.isDark ? 0.3 : 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
      elevation: 7
    },
    phoneStage: {
      padding: spacing.xs
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
      minHeight: 148,
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
      shadowOpacity: theme.isDark ? 0.24 : 0.1,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
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
      minHeight: 76,
      borderRadius: radii.md,
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
      borderRadius: radii.md,
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
    nativeReadyRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6
    },
    nativeReadyText: {
      borderRadius: radii.round,
      backgroundColor: colors.accentSoft,
      color: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 4,
      overflow: "hidden",
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    nativeInstallText: {
      borderRadius: radii.round,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.08)" : colors.surface,
      color: colors.muted,
      paddingHorizontal: 8,
      paddingVertical: 4,
      overflow: "hidden",
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
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
      minHeight: 106,
      borderRadius: radii.md,
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
    smartStackIncluded: {
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
    themePackIncluded: {
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
    templateEntitlementSubscriber: {
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
      color: colors.accentText
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
      color: colors.accentText,
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
