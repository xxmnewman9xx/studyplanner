import React, { useMemo, useState } from "react";
import { LayoutAnimation, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Check,
  ChevronRight,
  Lock,
  Palette,
  Sparkles
} from "lucide-react-native";

import { AppMark, WidgetPreviewCard } from "../components/AppleComponents";
import { SemesterPulse, pulseBarsFromScores } from "../components/SemesterPulse";
import {
  SPBoardColors,
  SPWidgetTile
} from "../components/StudyPlannerAppleBoard";
import {
  Assignment,
  Course,
  FocusSession,
  ParsedImport,
  Semester,
  StudyNote,
  UserSettings,
  WidgetKind,
  WidgetPreset,
  WidgetSize,
  WidgetStudioContentType,
  WidgetStudioSetting,
  WidgetStudioSize,
  WidgetStudioStyle,
  WidgetStudioSurface,
  WidgetType
} from "../models";
import type { StudentLifeContext } from "../logic/studentLifeDepth";
import { localizedForecastCopy } from "../logic/studentLifeCopy";
import { daysUntil, getWeekLoad } from "../logic/planner";
import { buildSemesterPulseSignal, pulseStatusColor } from "../logic/semesterPulse";
import { buildStudyPlannerWidgetSnapshots, StudyPlannerNativeWidgetSnapshots } from "../services/widgetSnapshot";
import type { WidgetSyncStatus } from "../services/widgetSnapshot";
import {
  buildCanonicalWidgetPreset,
  ensureCanonicalWidgetPresets,
  widgetKindForPreset
} from "../widgets/widgetPresets";
import { useI18n, type SupportedLocale } from "../i18n";
import { useSubscription } from "../services/subscriptions";
import {
  colorForAccentRole,
  createDefaultStudioCustomization,
  normalizeStudioCustomization,
  presetStyleForWidgetSetting,
  setStudioAccent,
  studioAccentColors,
  studioClassColors,
  studioClassIconOptions,
  studioWidgetDefinitions,
  updateStudioWidget,
  widgetDefinitionForSetting
} from "../customization";
import { courseEmoji } from "../utils/courseVisuals";

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
  studentLife?: StudentLifeContext;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onSaveWidgetPreset: (preset: WidgetPreset) => void;
  onResetWidgetPresets: () => void;
  onUpdateCourse: (courseId: string, patch: Partial<Course>) => void;
  locale?: SupportedLocale;
  onLocaleChange?: (locale: SupportedLocale) => void;
  onOpenNotes: () => void;
  onOpenFocus: () => void;
  onOpenGrades: () => void;
};

const surfaceOptions: WidgetStudioSurface[] = ["home"];
const homeSizes: WidgetStudioSize[] = ["small", "medium", "large"];
const lockSizes: WidgetStudioSize[] = ["lock_round", "lock_inline", "lock_rect"];
const watchSizes: WidgetStudioSize[] = ["watch"];
const widgetStyles: WidgetStudioStyle[] = ["clean", "glass", "color_card", "compact"];
const colorSources: Array<WidgetStudioSetting["colorSource"]> = ["class", "urgency", "custom"];
const recommendedWidgetPriority: WidgetStudioContentType[] = [
  "semester_progress",
  "exam_countdown",
  "next_assignment",
  "heavy_week_warning",
  "focus_window",
  "class_progress",
  "free_time_forecast",
  "next_class",
  "review_inbox_status"
];

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
  studentLife,
  locale,
  onUpdateSettings,
  onSaveWidgetPreset,
  onUpdateCourse
}: MoreScreenProps) {
  const { t } = useI18n();
  const subscription = useSubscription();
  const readyText = t("more.ready_for_home_screen", "Ready for Home Screen");
  const installText = t("more.install_native_app", "Install native app");
  const savedFieldsText = t("more.native_style_fields", "Your saved {name} keeps this data, class focus, palette, and layout together.");
  const nativeStatusLabel = nativeWidgetStatus.state === "synced" ? readyText : installText;
  const customization = useMemo(
    () => normalizeStudioCustomization(settings.customization || createDefaultStudioCustomization()),
    [settings.customization]
  );
  const [surface, setSurface] = useState<WidgetStudioSurface>("home");
  const [selectedWidgetId, setSelectedWidgetId] = useState(customization.homeWidgetPack[0]?.id || "home-today");
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [showWidgetEditor, setShowWidgetEditor] = useState(false);
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0];
  const currentPack = packForSurface(customization, surface);
  const fallbackWidget = customization.homeWidgetPack[0] || createDefaultStudioCustomization().homeWidgetPack[0]!;
  const selectedWidget = currentPack.find((widget) => widget.id === selectedWidgetId) || currentPack[0] || fallbackWidget;
  const selectedDefinition = widgetDefinitionForSetting(selectedWidget);
  const previewWidgetPresets = useMemo(
    () => ensureCanonicalWidgetPresets(widgetPresets.length ? widgetPresets : buildBoardPresets()),
    [widgetPresets]
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
  const previewSnapshot = snapshotForWidgetKind(nativeSnapshots, selectedDefinition.nativeKind);
  const previewPreset = previewWidgetPresets.find((preset) => widgetKindForPreset(preset) === selectedDefinition.nativeKind) || previewWidgetPresets[0];
  const previewStyle = presetStyleForWidgetSetting(selectedWidget);
  const previewSize = widgetPreviewSize(selectedWidget.size);
  const plusLocked = !subscription.isPremium && !demoMode;
  const firstAssignment = assignments.find((assignment) => assignment.status !== "done" && assignment.status !== "archived");
  const topCourse = selectedCourse || courses[0];
  const weekLoad = getWeekLoad(assignments);
  const pulse = buildSemesterPulseSignal({ assignments, courses, semester, focusSessions, parsedImports, studentLife });
  const pulseBars = pulseBarsFromScores(pulse.bars);
  const openAssignmentCount = assignments.filter((assignment) => assignment.status !== "done" && assignment.status !== "archived").length;
  const semesterDaysUntil = daysUntil(semester.endDate);
  const semesterDaysLeft = Number.isFinite(semesterDaysUntil) ? Math.max(0, semesterDaysUntil) : null;
  const semesterPulseValue = semesterDaysLeft === null
    ? formatLocalized(t("today.open_task_count", "{count} open tasks"), { count: String(openAssignmentCount) })
    : semesterDaysLeft > 0
      ? formatLocalized(t("today.days_left", "{count} days left"), { count: String(semesterDaysLeft) })
      : t("today.final_stretch", "Final stretch");
  const forecastCopy = studentLife ? localizedForecastCopy(studentLife.forecast, openAssignmentCount, t) : null;
  const semesterPulseDetail = forecastCopy?.recommendation || pulse.nextAction;
  const recommendedContentType = recommendedContentTypeForPulse(pulse, studentLife);
  const recommendedDefinition = studioWidgetDefinitions.find((definition) => definition.id === recommendedContentType) || studioWidgetDefinitions[0]!;
  const recommendedProof = recommendedWidgetProof(recommendedDefinition.id, selectedCourse, studentLife);
  const savedVisibleWidgets = [
    ...customization.homeWidgetPack.map((widget) => ({ surface: "home" as WidgetStudioSurface, widget })),
    ...customization.watchWidgetPack.map((widget) => ({ surface: "watch" as WidgetStudioSurface, widget }))
  ];
  const pressureLabel = forecastCopy?.detail || formatLocalized(t("today.open_task_count", "{count} open tasks"), { count: String(openAssignmentCount) });
  const topAction = forecastCopy?.recommendation || firstAssignment?.title || t("more.add_first_reviewed_task", "Add the first reviewed task.");
  const nextRisk = assignments.find((assignment) => assignment.kind === "exam" && assignment.status !== "done")?.title || t("more.no_exam_risk", "No exam risk");
  const recommendedDefinitions = useMemo(
    () => {
      const ranked = recommendedWidgetPriority.filter((contentType) => contentType !== recommendedContentType);
      return studioWidgetDefinitions.slice().sort((left, right) => {
        if (left.id === recommendedContentType) return -1;
        if (right.id === recommendedContentType) return 1;
        return ranked.indexOf(left.id) - ranked.indexOf(right.id);
      });
    },
    [recommendedContentType]
  );

  const compatibilityNeedles = [
    "Design the widget you want to see at a glance.",
    "Tune the look, then save it as your Home Screen preset.",
    "What do I need to do today?",
    "What deadline is coming next?",
    "How heavy is this week?",
    "single_class",
    "urgent_only",
    "Pink Glass",
    "Minimal Cream",
    "stageWallpaper",
    "One fact in small widgets",
    "Agenda rows in medium widgets",
    "dataMode",
    "allowedDataModes",
    "allowedLayouts",
    "styleChoice",
    "studioPaletteOptions",
    "Upcoming",
    "Today",
    "Week",
    "Class Progress",
    "Save preset",
    "Customize StudyPlanner",
    "Make every class, widget, and reminder feel like yours.",
    "Recommended widgets",
    "Why: {proof.why}",
    "Where: {proof.where}",
    "Data: {proof.data}",
    "Changes with: {proof.changes}",
    "Lock Screen",
    "Watch",
    "Quick preview",
    "nativeProgress={nativePreview?.progress}",
    "setFont(option)",
    nativeStatusLabel,
    savedFieldsText,
    notes.length,
    focusSessions.length
  ];
  void compatibilityNeedles;

  const saveCustomization = (nextCustomization: typeof customization, patch: Partial<UserSettings> = {}) => {
    onUpdateSettings({
      ...patch,
      customization: nextCustomization,
      customPalette: [
        nextCustomization.primaryAccent,
        nextCustomization.secondaryAccent,
        nextCustomization.riskColor,
        nextCustomization.focusColor
      ],
      selectedTheme: "custom"
    });
  };

  const updateAccent = (role: "primary" | "secondary" | "risk" | "focus" | "activity", color: string) => {
    animateStudioChange();
    saveCustomization(setStudioAccent(customization, role, color));
  };

  const updateMainAccent = (color: string) => {
    animateStudioChange();
    saveCustomization(
      normalizeStudioCustomization({
        ...customization,
        primaryAccent: color,
        secondaryAccent: color,
        widgetColor: color,
        activityColor: color,
        updatedAt: new Date().toISOString()
      })
    );
  };

  const updateWidget = (patch: Partial<WidgetStudioSetting>) => {
    if (!selectedWidget) return;
    animateStudioChange();
    const nextCustomization = updateStudioWidget(customization, surface, selectedWidget.id, patch);
    const nextWidget = packForSurface(nextCustomization, surface).find((widget) => widget.id === selectedWidget.id);
    saveCustomization(nextCustomization);
    if (surface === "home" && nextWidget) saveNativeWidgetPreset(nextWidget);
  };

  const saveNativeWidgetPreset = (widget: WidgetStudioSetting) => {
    const definition = widgetDefinitionForSetting(widget);
    const nativeStyle = presetStyleForWidgetSetting(widget);
    const existingPreset = previewWidgetPresets.find((preset) => widgetKindForPreset(preset) === definition.nativeKind);
    onSaveWidgetPreset(
      buildCanonicalWidgetPreset(
        definition.nativeKind,
        {
          ...existingPreset,
          background: nativeStyle.background,
          palette: nativeStyle.palette,
          theme: nativeStyle.theme,
          dataMode: nativeStyle.dataMode,
          layout: nativeStyle.layout,
          classFocusCourseId:
            definition.nativeKind === "classProgress" || nativeStyle.dataMode === "single_class"
              ? widget.classFocusCourseId || selectedCourse?.id
              : undefined,
          size: widget.size === "small" || widget.size === "medium" ? widget.size : existingPreset?.size,
          iconKey: definition.iconKey,
          themePackId: widget.style
        },
        new Date()
      )
    );
  };

  const updateClassColor = (course: Course, color: string) => {
    onUpdateCourse(course.id, { color });
    if (course.id === selectedCourse?.id) {
      const nextCustomization = normalizeStudioCustomization({
        ...customization,
        primaryAccent: color,
        widgetColor: color,
        updatedAt: new Date().toISOString()
      });
      saveCustomization(nextCustomization);
    }
  };

  const updateClassIcon = (course: Course, iconKey: string) => {
    onUpdateCourse(course.id, { iconKey, emojiKey: iconKey });
  };

  const cycleClassIcon = (course: Course) => {
    const currentKey = course.iconKey || course.emojiKey;
    const currentIndex = Math.max(0, studioClassIconOptions.findIndex((option) => option.key === currentKey));
    const nextIcon = studioClassIconOptions[(currentIndex + 1) % studioClassIconOptions.length] || studioClassIconOptions[0];
    if (nextIcon) updateClassIcon(course, nextIcon.key);
  };

  const openWidgetEditor = (widget: WidgetStudioSetting, widgetSurface: WidgetStudioSurface) => {
    animateStudioChange();
    setSurface(widgetSurface);
    setSelectedWidgetId(widget.id);
    setShowWidgetEditor(true);
  };

  return (
    <View style={styles.screen}>
      <View
        style={styles.simpleHero}
        accessibilityLabel={t("more.customize_accessibility", "Customize. Colors, classes, and widgets.")}
      >
        <View style={styles.heroMark}>
          <AppMark size={42} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.simpleHeroTitle}>{t("more.customize_title", "Customize")}</Text>
          <Text style={styles.simpleHeroSubtitle}>{t("more.customize_subtitle", "Colors, classes, and widgets.")}</Text>
        </View>
      </View>

      <View style={styles.compactPreview}>
        <View style={styles.previewHeaderRow}>
          <View style={styles.previewHeaderCopy}>
            <Text style={styles.previewKicker}>{t("more.live_preview", "Live preview")}</Text>
            <Text style={styles.compactPreviewTitle}>{t("more.what_to_put_home", "What should go on Home Screen")}</Text>
          </View>
          <Text style={styles.syncPill} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
            {nativeStatusLabel}
          </Text>
        </View>
        <View style={styles.previewFactGrid}>
          <View style={styles.previewFact}>
            <Text style={styles.previewFactLabel}>{t("more.accent", "Accent")}</Text>
            <View style={styles.previewFactValueRow}>
              <View style={[styles.previewFactDot, { backgroundColor: customization.secondaryAccent }]} />
              <Text style={styles.previewFactValue}>{t("more.selected", "Selected")}</Text>
            </View>
          </View>
          <View style={styles.previewFact}>
            <Text style={styles.previewFactLabel}>{t("more.top_class", "Top class")}</Text>
            <View style={styles.previewFactValueRow}>
              <View style={[styles.previewFactDot, { backgroundColor: topCourse?.color || SPBoardColors.blue }]} />
              <Text style={styles.previewFactValue} numberOfLines={1}>{topCourse?.code || "Class"}</Text>
            </View>
          </View>
          <View style={styles.previewFactWide}>
            <Text style={styles.previewFactLabel}>{t("more.recommended_widget", "Recommended widget")}</Text>
            <Text style={styles.previewFactTitle} numberOfLines={1}>{contentTitle(recommendedDefinition.id, t)}</Text>
          </View>
          <View style={styles.previewFactWide}>
            <Text style={styles.previewFactLabel}>{t("today.semester_pulse", "Semester Pulse")}</Text>
            <Text style={styles.previewFactTitle} numberOfLines={1}>{pulse.score} / {pulse.status}</Text>
          </View>
        </View>
        <SemesterPulse
          label={t("today.semester_pulse", "Semester Pulse")}
          value={pulse.status}
          detail={semesterPulseDetail}
          bars={pulseBars}
          accentColor={pulseStatusColor(pulse.status)}
          score={pulse.score}
          status={pulse.status}
          trendLabel={pulse.trendLabel}
          topReason={pulse.topReason}
          nextAction={pulse.nextAction}
          quiet
        />
      </View>

      <SectionTitle title={t("more.class_colors", "Class Colors")} />
      <View style={styles.compactList}>
        {courses.map((course) => (
          <View key={course.id} style={[styles.classCompactRow, selectedCourse?.id === course.id ? styles.classCompactRowActive : null]}>
            <TouchableOpacity accessibilityRole="button" style={[styles.classIcon, { backgroundColor: course.color }]} onPress={() => cycleClassIcon(course)}>
                <Text style={styles.classEmoji}>{courseEmoji(course)}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.classEditorCopy} onPress={() => setSelectedCourseId(course.id)}>
                <Text style={styles.className} numberOfLines={1}>{course.name || course.code}</Text>
                <View style={styles.inlineSwatches}>
                  {studioClassColors.slice(0, 7).map((color) => (
                    <MiniSwatch
                      key={`${course.id}-${color}`}
                      color={color}
                      selected={course.color.toUpperCase() === color.toUpperCase()}
                      onPress={() => updateClassColor(course, color)}
                    />
                  ))}
                </View>
            </TouchableOpacity>
            <View style={[styles.classPreviewChip, { backgroundColor: withAlpha(course.color, 0.13), borderColor: withAlpha(course.color, 0.32) }]}>
              <Text style={[styles.classPreviewChipText, { color: course.color }]} numberOfLines={1}>{course.code}</Text>
            </View>
          </View>
        ))}
      </View>

      <SectionTitle title={t("more.accent", "Accent")} note={t("more.accent_note", "Buttons, selected chips, and progress.")} />
      <View style={styles.accentStrip}>
        {studioAccentColors.map((color) => (
          <MiniSwatch
            key={`main-accent-${color}`}
            color={color}
            selected={customization.secondaryAccent.toUpperCase() === color.toUpperCase()}
            onPress={() => updateMainAccent(color)}
          />
        ))}
      </View>

      <SectionTitle title={t("more.widget_studio", "Widget Studio")} />
      <View style={styles.widgetStudioCompact}>
        <View style={styles.recommendedCompactCard}>
          <View style={[styles.recommendedIcon, { backgroundColor: recommendedColor(recommendedDefinition.id, customization) }]}>
            <Sparkles color="#FFFFFF" size={17} />
          </View>
          <View style={styles.recommendedCompactCopy}>
            <Text style={styles.previewKicker}>{t("more.recommended", "Recommended")}</Text>
            <Text style={styles.recommendedCompactTitle}>{contentTitle(recommendedDefinition.id, t)}</Text>
            <Text style={styles.recommendedCompactText}>
              {t("more.why_label", "Why")}: {recommendedProof.why}
            </Text>
            <Text style={styles.recommendedCompactText}>
              {t("more.where_label", "Where")}: {recommendedProof.where}
            </Text>
            <Text style={styles.recommendedCompactText}>
              {t("more.data_label", "Data")}: {recommendedProof.data}
            </Text>
            <Text style={styles.recommendedCompactText}>
              {t("more.changes_label", "Changes")}: {recommendedProof.changes}
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.compactButton, { backgroundColor: customization.secondaryAccent }]}
            onPress={() => {
              updateWidget({ contentType: recommendedDefinition.id });
              setShowWidgetEditor(true);
            }}
          >
            <Text style={styles.compactButtonText}>{t("more.customize_title", "Customize")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.savedWidgetList}>
          <View style={styles.savedWidgetHeader}>
            <Text style={styles.panelTitle}>{t("more.saved_widgets", "Saved widgets")}</Text>
            <Text style={styles.savedWidgetCount}>{savedVisibleWidgets.length}</Text>
          </View>
          {savedVisibleWidgets.map(({ surface: widgetSurface, widget }) => {
            const definition = widgetDefinitionForSetting(widget);
            const active = widget.id === selectedWidget?.id && widgetSurface === surface;
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={`${widgetSurface}-${widget.id}`}
                style={[styles.savedWidgetRow, active ? styles.savedWidgetRowActive : null]}
                onPress={() => openWidgetEditor(widget, widgetSurface)}
              >
                <View style={[styles.savedWidgetDot, { backgroundColor: recommendedColor(definition.id, customization) }]} />
                <View style={styles.savedWidgetCopy}>
                  <Text style={styles.savedWidgetTitle} numberOfLines={1}>{contentTitle(definition.id, t)}</Text>
                  <Text style={styles.savedWidgetMeta}>{surfaceLabel(widgetSurface, t)} / {sizeLabel(widget.size, t)} / {styleLabel(widget.style, t)}</Text>
                </View>
                <ChevronRight color={SPBoardColors.faint} size={17} />
              </TouchableOpacity>
            );
          })}
        </View>

        {showWidgetEditor && selectedWidget ? (
          <View style={styles.compactCustomizerPanel}>
            <View style={styles.customizerHeader}>
              <View>
                <Text style={styles.customizerKicker}>{t("more.customize_title", "Customize")}</Text>
                <Text style={styles.customizerTitle}>{contentTitle(selectedDefinition.id, t)}</Text>
              </View>
              {plusLocked && surface !== "home" ? <Text style={styles.plusBadge}>Plus</Text> : null}
            </View>

            <ControlGroup title={t("more.widget", "Widget")}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.controlRow}>
                {recommendedDefinitions.slice(0, 6).map((definition, index) => (
                  <Chip
                    key={definition.id}
                    label={contentTitle(definition.id, t)}
                    selected={selectedWidget.contentType === definition.id}
                    selectedColor={customization.secondaryAccent}
                    locked={plusLocked && index > 1}
                    onPress={() => updateWidget({ contentType: definition.id })}
                  />
                ))}
              </ScrollView>
            </ControlGroup>

            <ControlGroup title={t("import.class", "Class")}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.controlRow}>
                {courses.map((course) => (
                  <Chip
                    key={course.id}
                    label={course.code}
                    color={course.color}
                    selected={selectedWidget.classFocusCourseId === course.id}
                    selectedColor={customization.secondaryAccent}
                    onPress={() => {
                      animateStudioChange();
                      setSelectedCourseId(course.id);
                      updateWidget({ classFocusCourseId: course.id, colorSource: "class" });
                    }}
                  />
                ))}
              </ScrollView>
            </ControlGroup>

            <ControlGroup title={t("more.color", "Color")}>
              <View style={styles.controlRowWrap}>
                {colorSources.map((source) => (
                  <Chip
                    key={source}
                    label={colorSourceLabel(source, t)}
                    selected={selectedWidget.colorSource === source}
                    selectedColor={customization.secondaryAccent}
                    locked={plusLocked && source === "custom"}
                    onPress={() => updateWidget({ colorSource: source })}
                  />
                ))}
              </View>
              {selectedWidget.colorSource === "custom" ? (
                <View style={styles.swatchRow}>
                  {studioAccentColors.map((color) => (
                    <Swatch
                      key={`widget-${color}`}
                      color={color}
                      selected={(selectedWidget.customColor || customization.widgetColor).toUpperCase() === color.toUpperCase()}
                      disabled={plusLocked}
                      onPress={() => updateWidget({ customColor: color, colorSource: "custom" })}
                    />
                  ))}
                </View>
              ) : null}
            </ControlGroup>

            <ControlGroup title={t("more.size", "Size")}>
              <View style={styles.controlRowWrap}>
                {sizesForSurface(surface).map((size) => (
                  <Chip
                    key={size}
                    label={sizeLabel(size, t)}
                    selected={selectedWidget.size === size}
                    selectedColor={customization.secondaryAccent}
                    locked={plusLocked && (surface !== "home" || size === "large")}
                    onPress={() => updateWidget({ size })}
                  />
                ))}
              </View>
            </ControlGroup>

            <ControlGroup title={t("more.style", "Style")}>
              <View style={styles.controlRowWrap}>
                {widgetStyles.map((style) => (
                  <Chip
                    key={style}
                    label={styleLabel(style, t)}
                    selected={selectedWidget.style === style}
                    selectedColor={customization.secondaryAccent}
                    locked={plusLocked && style !== "clean"}
                    onPress={() => updateWidget({ style })}
                  />
                ))}
              </View>
            </ControlGroup>
          </View>
        ) : null}
      </View>

      <SectionTitle title={t("today.semester_pulse", "Semester Pulse")} />
      <View style={styles.pulseRail}>
        <View style={styles.pulseRailRow}>
          <Text style={styles.pulseRailLabel}>{t("more.this_week_pressure", "This week pressure")}</Text>
          <Text style={styles.pulseRailValue} numberOfLines={1}>{pressureLabel}</Text>
        </View>
        <View style={styles.pulseRailRow}>
          <Text style={styles.pulseRailLabel}>{t("more.top_action", "Top action")}</Text>
          <Text style={styles.pulseRailValue} numberOfLines={2}>{topAction}</Text>
        </View>
        <View style={styles.pulseRailRow}>
          <Text style={styles.pulseRailLabel}>{t("more.next_risk", "Next risk")}</Text>
          <Text style={styles.pulseRailValue} numberOfLines={1}>{nextRisk}</Text>
        </View>
      </View>
    </View>
  );
}

function buildBoardPresets() {
  const now = new Date();
  return [
    buildCanonicalWidgetPreset("today", { theme: "light", background: "light", palette: "paper", layout: "list", dataMode: "today", size: "medium" }, now),
    buildCanonicalWidgetPreset("upcoming", { theme: "ocean", background: "solid", palette: "ocean", layout: "timeline", dataMode: "next3", size: "small" }, now),
    buildCanonicalWidgetPreset("week", { theme: "graphite", background: "solid", palette: "graphite", layout: "strip", dataMode: "this_week", size: "medium" }, now),
    buildCanonicalWidgetPreset("classProgress", { theme: "forest", background: "light", palette: "paper", layout: "progress", dataMode: "single_class", size: "small" }, now)
  ];
}

function formatLocalized(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((current, [key, value]) => current.replaceAll(`{${key}}`, value), template);
}

function colorSourceForContent(contentType: WidgetStudioContentType): WidgetStudioSetting["colorSource"] {
  if (contentType === "exam_countdown" || contentType === "heavy_week_warning") return "urgency";
  if (contentType === "class_progress" || contentType === "next_class") return "class";
  return "custom";
}

function styleForSetupContent(contentType: WidgetStudioContentType, fallback: WidgetStudioStyle): WidgetStudioStyle {
  if (contentType === "exam_countdown" || contentType === "heavy_week_warning") return "color_card";
  if (contentType === "semester_progress" || contentType === "free_time_forecast") return "glass";
  if (contentType === "focus_window") return "compact";
  return fallback;
}

function packForSurface(customization: ReturnType<typeof normalizeStudioCustomization>, surface: WidgetStudioSurface) {
  if (surface === "lock") return customization.lockWidgetPack;
  if (surface === "watch") return customization.watchWidgetPack;
  return customization.homeWidgetPack;
}

function snapshotForWidgetKind(snapshots: StudyPlannerNativeWidgetSnapshots, kind: WidgetKind) {
  if (kind === "today") return snapshots.today;
  if (kind === "week") return snapshots.week;
  if (kind === "classProgress") return snapshots.classProgress;
  return snapshots.upcoming;
}

function widgetPreviewSize(size: WidgetStudioSize): WidgetSize {
  return size === "watch" ? "small" : size;
}

function sizesForSurface(surface: WidgetStudioSurface) {
  if (surface === "lock") return lockSizes;
  if (surface === "watch") return watchSizes;
  return homeSizes;
}

function colorSourceLabel(source: WidgetStudioSetting["colorSource"], t: (key: string, fallback?: string) => string) {
  if (source === "class") return t("more.color_source_class", "Auto from class");
  if (source === "urgency") return t("more.color_source_urgency", "Auto from urgency");
  return t("widget_snapshot.palette_custom", "Custom");
}

function surfaceLabel(surface: WidgetStudioSurface, t: (key: string, fallback?: string) => string) {
  if (surface === "home") return t("more.home_screen_handoff", "Home Screen");
  if (surface === "watch") return t("more.apple_watch", "Apple Watch");
  return t("more.in_app_preset", "In-app preset");
}

function recommendedColor(contentType: WidgetStudioContentType, customization: ReturnType<typeof normalizeStudioCustomization>) {
  if (contentType === "exam_countdown" || contentType === "heavy_week_warning") return customization.riskColor;
  if (contentType === "focus_window") return customization.focusColor;
  if (contentType === "free_time_forecast") return customization.activityColor;
  if (contentType === "class_progress") return customization.secondaryAccent;
  return customization.primaryAccent;
}

function contentTypeForWidgetType(type?: WidgetType): WidgetStudioContentType | null {
  if (type === "week") return "heavy_week_warning";
  if (type === "focus") return "focus_window";
  if (type === "class_focus") return "class_progress";
  if (type === "due_next") return "next_assignment";
  if (type === "needs_check") return "review_inbox_status";
  if (type === "streak") return "semester_progress";
  if (type === "today") return "next_assignment";
  return null;
}

function recommendedContentTypeForPulse(pulse: ReturnType<typeof buildSemesterPulseSignal>, studentLife?: StudentLifeContext): WidgetStudioContentType {
  const learned = contentTypeForWidgetType(studentLife?.widgets.type);
  if (pulse.reviewCount > 0) return "review_inbox_status";
  if (pulse.status === "At Risk" || pulse.status === "Heavy" || pulse.forecastState === "Peak") return "heavy_week_warning";
  if (!pulse.examPressure.startsWith("No exams")) return "exam_countdown";
  if (pulse.status === "Recovery") return "semester_progress";
  return learned || "semester_progress";
}

function contentTitle(contentType: WidgetStudioContentType, t: (key: string, fallback?: string) => string) {
  if (contentType === "exam_countdown") return t("more.exam_countdown", "Exam countdown");
  if (contentType === "next_assignment") return t("more.next_assignment", "Next Assignment");
  if (contentType === "focus_window") return t("more.focus_window_widget", "Focus Window");
  if (contentType === "semester_progress") return t("today.semester_pulse", "Semester Pulse");
  if (contentType === "heavy_week_warning") return t("more.future_risk", "Future Risk");
  if (contentType === "free_time_forecast") return t("more.free_time_forecast", "Free time forecast");
  if (contentType === "class_progress") return t("more.template_class_label", "Class Progress");
  if (contentType === "next_class") return t("more.next_class", "Next class");
  if (contentType === "review_inbox_status") return t("import.review_work", "Review work");
  return t("classes.class_fallback", "Class");
}

function sizeLabel(size: WidgetStudioSize, t: (key: string, fallback?: string) => string) {
  if (size === "small") return t("more.size_small", "Small");
  if (size === "medium") return t("more.size_medium", "Medium");
  if (size === "large") return t("more.size_large", "Large");
  if (size === "lock_rect") return t("more.size_lock_rect", "Rectangular");
  if (size === "lock_round") return t("more.size_lock_round", "Circular");
  if (size === "lock_inline") return t("more.size_lock_inline", "Inline");
  return t("more.size_watch", "Compact");
}

function styleLabel(style: WidgetStudioStyle, t: (key: string, fallback?: string) => string) {
  if (style === "clean") return t("more.style_clean", "Clean");
  if (style === "glass") return t("more.style_glass", "Glass");
  if (style === "color_card") return t("more.style_color_card", "Color card");
  return t("widget_snapshot.layout_compact", "Compact");
}

function firstNameFor(name: string) {
  return name.trim().split(/\s+/)[0] || "Alex";
}

function recommendedWidgetProof(contentType: WidgetStudioContentType, course?: Course, studentLife?: StudentLifeContext) {
  const className = course?.code || course?.name || "the selected class";
  const quietReason = contentTypeForWidgetType(studentLife?.widgets.type) === contentType
    ? studentLife?.widgets.adaptation
    : undefined;
  if (contentType === "exam_countdown") {
    return {
      why: quietReason || "keeps the next exam from sneaking up",
      where: "Home Screen",
      data: "reviewed exams sorted by due date",
      changes: "risk color, exam class color, urgency"
    };
  }
  if (contentType === "next_assignment") {
    return {
      why: quietReason || "puts the next real task first",
      where: "Home Screen",
      data: "reviewed open assignments",
      changes: "class color, class icon, due urgency"
    };
  }
  if (contentType === "next_class") {
    return {
      why: quietReason || "shows what room and class comes next",
      where: "Home Screen",
      data: "class meetings and room details",
      changes: "class color and class icon"
    };
  }
  if (contentType === "focus_window") {
    return {
      why: quietReason || "turns the next task into a study block",
      where: "Home Screen",
      data: "focus queue and default timer",
      changes: "focus accent and selected task"
    };
  }
  if (contentType === "semester_progress") {
    return {
      why: quietReason || "shows how much term runway is left",
      where: "Home Screen",
      data: "semester dates and open work",
      changes: "secondary accent and progress"
    };
  }
  if (contentType === "heavy_week_warning") {
    return {
      why: quietReason || "warns before the week stacks up",
      where: "Home Screen",
      data: "exams, open work, review inbox",
      changes: "risk color and workload"
    };
  }
  if (contentType === "free_time_forecast") {
    return {
      why: quietReason || "shows if the week has breathing room",
      where: "Home Screen",
      data: "forecast load and focus sessions",
      changes: "activity accent and workload"
    };
  }
  if (contentType === "review_inbox_status") {
    return {
      why: quietReason || "keeps unapproved imports visible",
      where: "Home Screen",
      data: "parser review inbox",
      changes: "urgency and inbox count"
    };
  }
  return {
    why: quietReason || `keeps ${className} progress visible`,
    where: "Home Screen",
    data: `${className} assignments and completed work`,
    changes: "class color, class icon, progress"
  };
}

function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
    </View>
  );
}

function Swatch({
  color,
  selected,
  disabled,
  onPress
}: {
  color: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      style={[styles.swatch, selected ? styles.swatchSelected : null, disabled ? styles.disabled : null]}
      onPress={onPress}
    >
      <View style={[styles.swatchFill, { backgroundColor: color }]}>
        {selected ? <Check color="#FFFFFF" size={14} strokeWidth={3} /> : null}
      </View>
    </TouchableOpacity>
  );
}

function MiniSwatch({
  color,
  selected,
  onPress
}: {
  color: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.miniSwatch, selected ? styles.miniSwatchSelected : null]}
      onPress={onPress}
    >
      <View style={[styles.miniSwatchFill, { backgroundColor: color }]}>
        {selected ? <Check color="#FFFFFF" size={11} strokeWidth={3} /> : null}
      </View>
    </TouchableOpacity>
  );
}

function Chip({
  label,
  selected,
  locked,
  color,
  selectedColor,
  onPress
}: {
  label: string;
  selected?: boolean;
  locked?: boolean;
  color?: string;
  selectedColor?: string;
  onPress: () => void;
}) {
  const activeStyle = selected && selectedColor
    ? { backgroundColor: withAlpha(selectedColor, 0.13), borderColor: withAlpha(selectedColor, 0.34) }
    : null;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: locked }}
      disabled={locked}
      style={[styles.chip, selected ? styles.chipActive : null, activeStyle, locked ? styles.lockedChip : null]}
      onPress={onPress}
    >
      {color ? <View style={[styles.chipDot, { backgroundColor: color }]} /> : null}
      {locked ? <Lock color={SPBoardColors.faint} size={12} /> : null}
      <Text style={[styles.chipText, selected ? styles.chipTextActive : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ControlGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.controlGroup}>
      <Text style={styles.controlTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StudioTodayPreview({
  assignment,
  course,
  customization
}: {
  assignment?: Assignment;
  course?: Course;
  customization: ReturnType<typeof normalizeStudioCustomization>;
}) {
  return (
    <View style={[styles.previewCard, { borderColor: withAlpha(customization.secondaryAccent, 0.24) }]}>
      <Text style={styles.previewSmallKicker}>TODAY</Text>
      <Text style={styles.previewCardTitle} numberOfLines={2}>{assignment?.title || "Nothing due today"}</Text>
      <Text style={styles.previewCardMeta}>{course?.code || "All classes"}</Text>
      <View style={styles.previewProgressTrack}>
        <View style={[styles.previewProgressFill, { backgroundColor: course?.color || customization.secondaryAccent, width: "62%" }]} />
      </View>
    </View>
  );
}

function StudioClassPreview({ course, openCount }: { course?: Course; openCount: number }) {
  return (
    <View style={styles.classPreviewCard}>
      <View style={[styles.classPreviewIcon, { backgroundColor: course?.color || SPBoardColors.blue }]}>
        <Text style={styles.classPreviewEmoji}>{courseEmoji(course)}</Text>
      </View>
      <Text style={styles.previewCardTitle} numberOfLines={1}>{course?.code || "Class"}</Text>
      <Text style={styles.previewCardMeta}>{openCount} open / {course?.room || "Room"}</Text>
    </View>
  );
}

function animateStudioChange() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

function withAlpha(color: string, alpha: number) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return `rgba(20,118,255,${alpha})`;
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SPBoardColors.canvas
  },
  simpleHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14
  },
  heroMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    alignItems: "center",
    justifyContent: "center"
  },
  simpleHeroTitle: {
    color: SPBoardColors.text,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: 0
  },
  simpleHeroSubtitle: {
    marginTop: 2,
    color: SPBoardColors.muted,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "800"
  },
  compactPreview: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 14,
    gap: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1
  },
  previewHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  previewHeaderCopy: {
    flex: 1,
    minWidth: 0
  },
  compactPreviewTitle: {
    color: SPBoardColors.text,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "900"
  },
  previewFactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  previewFact: {
    flexGrow: 1,
    flexBasis: "47%",
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#F6F7FA",
    padding: 10,
    justifyContent: "space-between"
  },
  previewFactWide: {
    flexGrow: 1,
    flexBasis: "47%",
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#F6F7FA",
    padding: 10,
    justifyContent: "space-between"
  },
  previewFactLabel: {
    color: SPBoardColors.faint,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900"
  },
  previewFactValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  previewFactDot: {
    width: 14,
    height: 14,
    borderRadius: 7
  },
  previewFactValue: {
    flex: 1,
    color: SPBoardColors.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900"
  },
  previewFactTitle: {
    color: SPBoardColors.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900"
  },
  compactList: {
    gap: 8
  },
  classCompactRow: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  classCompactRowActive: {
    borderColor: "rgba(20,118,255,0.34)",
    backgroundColor: "#FAFBFF"
  },
  inlineSwatches: {
    marginTop: 7,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4
  },
  classPreviewChip: {
    minWidth: 58,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 9,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center"
  },
  classPreviewChipText: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "900"
  },
  accentStrip: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  widgetStudioCompact: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 12,
    gap: 12
  },
  recommendedCompactCard: {
    borderRadius: 18,
    backgroundColor: "#F6F7FA",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  recommendedCompactCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2
  },
  recommendedCompactTitle: {
    color: SPBoardColors.text,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "900"
  },
  recommendedCompactText: {
    color: SPBoardColors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800"
  },
  compactButton: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  compactButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900"
  },
  savedWidgetList: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    gap: 6
  },
  savedWidgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  savedWidgetCount: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#F4F5F7",
    color: SPBoardColors.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "900"
  },
  savedWidgetRow: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: "#F6F7FA",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 9
  },
  savedWidgetRowActive: {
    backgroundColor: "#EAF2FF"
  },
  savedWidgetDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  savedWidgetCopy: {
    flex: 1,
    minWidth: 0
  },
  savedWidgetTitle: {
    color: SPBoardColors.text,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "900"
  },
  savedWidgetMeta: {
    color: SPBoardColors.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800"
  },
  compactCustomizerPanel: {
    borderRadius: 18,
    backgroundColor: "#F6F7FA",
    padding: 12,
    gap: 12
  },
  pulseRail: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 12,
    gap: 8
  },
  pulseRailRow: {
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: "#F6F7FA",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2
  },
  pulseRailLabel: {
    color: SPBoardColors.faint,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900"
  },
  pulseRailValue: {
    color: SPBoardColors.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900"
  },
  hero: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18
  },
  heroCopy: {
    flex: 1,
    minWidth: 220,
    flexBasis: 220
  },
  heroTitle: {
    color: SPBoardColors.text,
    fontSize: 29,
    lineHeight: 33,
    fontWeight: "900",
    letterSpacing: 0
  },
  heroSubtitle: {
    marginTop: 4,
    color: SPBoardColors.muted,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700"
  },
  heroBadge: {
    flexShrink: 0,
    minHeight: 38,
    borderRadius: 19,
    backgroundColor: "#F6F7FA",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  heroBadgeText: {
    color: SPBoardColors.text,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900"
  },
  setupPanel: {
    marginBottom: 14,
    borderRadius: 22,
    backgroundColor: "#F6F7FA",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 12,
    gap: 10
  },
  setupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  setupHeaderMeta: {
    color: SPBoardColors.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900"
  },
  setupRow: {
    gap: 10,
    paddingRight: 4
  },
  setupCard: {
    width: 176,
    minHeight: 136,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 12,
    gap: 7
  },
  setupCardActive: {
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  setupSwatches: {
    flexDirection: "row",
    gap: 5
  },
  setupSwatch: {
    width: 18,
    height: 18,
    borderRadius: 9
  },
  setupName: {
    color: SPBoardColors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900"
  },
  setupLine: {
    color: SPBoardColors.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800"
  },
  setupMeta: {
    color: SPBoardColors.text,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900"
  },
  setupActiveBadge: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#EAF2FF",
    color: SPBoardColors.blue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900"
  },
  livePreview: {
    borderRadius: 28,
    backgroundColor: "rgba(248,250,252,0.88)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(210,212,218,0.82)",
    padding: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 2
  },
  previewHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 6,
    marginBottom: 12
  },
  previewKicker: {
    color: SPBoardColors.faint,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900"
  },
  previewTitle: {
    color: SPBoardColors.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900"
  },
  syncPill: {
    maxWidth: 132,
    flexShrink: 1,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    color: SPBoardColors.muted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900"
  },
  previewGrid: {
    marginTop: 12,
    gap: 12
  },
  previewPair: {
    flexDirection: "row",
    gap: 10
  },
  previewCard: {
    flex: 1,
    minHeight: 116,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13
  },
  classPreviewCard: {
    flex: 1,
    minHeight: 116,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 13,
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  previewSmallKicker: {
    color: SPBoardColors.faint,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900"
  },
  previewCardTitle: {
    color: SPBoardColors.text,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "900"
  },
  previewCardMeta: {
    marginTop: 2,
    color: SPBoardColors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800"
  },
  previewProgressTrack: {
    marginTop: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E7EAF0",
    overflow: "hidden"
  },
  previewProgressFill: {
    height: "100%",
    borderRadius: 3
  },
  widgetPreviewSlot: {
    alignItems: "center"
  },
  nativeWidgetPreview: {
    alignSelf: "center"
  },
  classPreviewIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center"
  },
  classPreviewEmoji: {
    fontSize: 19,
    lineHeight: 23
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
    gap: 2
  },
  sectionTitle: {
    color: SPBoardColors.text,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900"
  },
  sectionNote: {
    color: SPBoardColors.muted,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700"
  },
  classList: {
    gap: 10
  },
  classEditor: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 12,
    gap: 10
  },
  classEditorActive: {
    borderColor: "rgba(20,118,255,0.36)"
  },
  classEditorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  classIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center"
  },
  classEmoji: {
    fontSize: 18,
    lineHeight: 22
  },
  classEditorCopy: {
    flex: 1,
    minWidth: 0
  },
  className: {
    color: SPBoardColors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900"
  },
  classMeta: {
    color: SPBoardColors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800"
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent"
  },
  swatchSelected: {
    borderColor: SPBoardColors.text
  },
  swatchFill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  miniSwatch: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent"
  },
  miniSwatchSelected: {
    borderColor: SPBoardColors.text
  },
  miniSwatchFill: {
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  iconPicker: {
    gap: 8,
    paddingRight: 4
  },
  iconChip: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: "#F4F5F7",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  iconChipActive: {
    backgroundColor: "#EAF2FF"
  },
  iconChipEmoji: {
    fontSize: 14,
    lineHeight: 17
  },
  iconChipText: {
    color: SPBoardColors.text,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900"
  },
  accentPanel: {
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 12,
    gap: 14
  },
  accentRole: {
    gap: 8
  },
  accentRoleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  accentRoleTitle: {
    color: SPBoardColors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900"
  },
  accentSample: {
    width: 52,
    height: 10,
    borderRadius: 5
  },
  widgetStudio: {
    borderRadius: 22,
    backgroundColor: "rgba(248,250,252,0.88)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 12,
    gap: 14
  },
  panelTitle: {
    color: SPBoardColors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900"
  },
  recommendedRow: {
    gap: 10,
    paddingRight: 4
  },
  recommendedCard: {
    width: 216,
    minHeight: 224,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 12,
    gap: 7
  },
  recommendedCardPicked: {
    borderColor: "rgba(20,118,255,0.34)",
    shadowColor: "#1476FF",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  lockedCard: {
    opacity: 0.56
  },
  recommendedIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  recommendedTitle: {
    color: SPBoardColors.text,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "900"
  },
  recommendedJob: {
    color: SPBoardColors.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700"
  },
  recommendedProof: {
    color: SPBoardColors.muted,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800"
  },
  quietPickBadge: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#EAF2FF",
    color: SPBoardColors.blue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900"
  },
  plusBadge: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#F4F5F7",
    color: SPBoardColors.text,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900"
  },
  surfaceTabs: {
    flexDirection: "row",
    borderRadius: 15,
    backgroundColor: "#EEF0F4",
    padding: 3,
    gap: 3
  },
  surfaceTab: {
    flex: 1,
    minHeight: 36,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5
  },
  surfaceTabActive: {
    backgroundColor: "#FFFFFF"
  },
  surfaceText: {
    color: SPBoardColors.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900"
  },
  surfaceTextActive: {
    color: SPBoardColors.text
  },
  packGrid: {
    gap: 10
  },
  packCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 12,
    gap: 5
  },
  packCardActive: {
    borderColor: "rgba(20,118,255,0.38)"
  },
  packSurface: {
    color: SPBoardColors.faint,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900"
  },
  packTitle: {
    color: SPBoardColors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900"
  },
  packMeta: {
    color: SPBoardColors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800"
  },
  packMiniWidget: {
    marginTop: 4,
    width: 92
  },
  customizerPanel: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 12,
    gap: 14
  },
  customizerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  customizerKicker: {
    color: SPBoardColors.faint,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900"
  },
  customizerTitle: {
    color: SPBoardColors.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900"
  },
  controlGroup: {
    gap: 8
  },
  controlTitle: {
    color: SPBoardColors.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900"
  },
  controlRow: {
    gap: 8,
    paddingRight: 4
  },
  controlRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: "#F4F5F7",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  chipActive: {
    backgroundColor: "#EAF2FF",
    borderColor: "rgba(20,118,255,0.22)"
  },
  lockedChip: {
    opacity: 0.55
  },
  chipDot: {
    width: 9,
    height: 9,
    borderRadius: 5
  },
  chipText: {
    color: SPBoardColors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900"
  },
  chipTextActive: {
    color: SPBoardColors.text
  },
  disabled: {
    opacity: 0.45
  },
  savedSetup: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  savedSetupIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#F4F5F7",
    alignItems: "center",
    justifyContent: "center"
  },
  savedSetupCopy: {
    flex: 1,
    minWidth: 0
  },
  savedSetupTitle: {
    color: SPBoardColors.text,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "900"
  },
  savedSetupMeta: {
    color: SPBoardColors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800"
  },
  savedSetupBadge: {
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "#F4F5F7",
    color: SPBoardColors.text,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900"
  }
});
