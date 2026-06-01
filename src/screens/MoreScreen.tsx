import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Check,
  ChevronRight,
  Crown,
  Lock,
  Palette,
  Smartphone,
  Sparkles,
  Watch
} from "lucide-react-native";

import { WidgetPreviewCard } from "../components/AppleComponents";
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
  WidgetStudioSurface
} from "../models";
import type { StudentLifeContext } from "../logic/studentLifeDepth";
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
  displaySizeLabel,
  labelForWidgetStyle,
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

const surfaceOptions: WidgetStudioSurface[] = ["home", "lock", "watch"];
const homeSizes: WidgetStudioSize[] = ["small", "medium", "large"];
const lockSizes: WidgetStudioSize[] = ["lock_round", "lock_inline", "lock_rect"];
const watchSizes: WidgetStudioSize[] = ["watch"];
const widgetStyles: WidgetStudioStyle[] = ["clean", "glass", "color_card", "compact"];
const colorSources: Array<WidgetStudioSetting["colorSource"]> = ["class", "urgency", "custom"];

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
  const secondAssignment = assignments.find((assignment) => assignment.id !== firstAssignment?.id && assignment.status !== "done" && assignment.status !== "archived");

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
    saveCustomization(setStudioAccent(customization, role, color));
  };

  const updateWidget = (patch: Partial<WidgetStudioSetting>) => {
    if (!selectedWidget) return;
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

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Customize StudyPlanner</Text>
          <Text style={styles.heroSubtitle}>Make every class, widget, and reminder feel like yours.</Text>
        </View>
        <View style={styles.heroBadge}>
          <Palette color={customization.secondaryAccent} size={19} />
          <Text style={styles.heroBadgeText}>Studio</Text>
        </View>
      </View>

      <View style={styles.livePreview}>
        <View style={styles.previewHeader}>
          <View>
            <Text style={styles.previewKicker}>LIVE PREVIEW</Text>
            <Text style={styles.previewTitle}>The preview is the product.</Text>
          </View>
          <Text style={styles.syncPill} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
            {nativeStatusLabel}
          </Text>
        </View>
        <View style={styles.previewGrid}>
          <StudioTodayPreview
            assignment={firstAssignment}
            course={firstAssignment ? courses.find((course) => course.id === firstAssignment.courseId) : selectedCourse}
            customization={customization}
          />
          <StudioClassPreview
            course={selectedCourse}
            openCount={assignments.filter((assignment) => assignment.courseId === selectedCourse?.id && assignment.status !== "done").length}
          />
          <View style={styles.widgetPreviewSlot}>
            <WidgetPreviewCard
              title={selectedDefinition.title}
              value={previewSnapshot.value}
              detail={previewSnapshot.detail}
              background={previewStyle.background}
              palette={previewStyle.palette}
              size={previewSize}
              type={previewPreset?.type || "due_next"}
              course={selectedCourse}
              font={previewPreset?.font || "SF Pro"}
              layout={previewStyle.layout}
              iconKey={selectedDefinition.iconKey}
              items={previewSnapshot.items}
              nativeMode
              nativeAccentColor={previewSnapshot.accentColor}
              nativeBackgroundColor={previewSnapshot.backgroundColor}
              nativeSignalLabel={previewSnapshot.signalLabel}
              nativeMetricLabel={previewSnapshot.metricLabel}
              nativeNextLabel={previewSnapshot.nextLabel}
              nativeTimelineLabel={previewSnapshot.timelineLabel}
              nativeProgress={previewSnapshot.progress}
              progressLabel={previewSnapshot.progressLabel}
              footnote={previewSnapshot.footnote}
              semesterName={semester.name}
              style={styles.nativeWidgetPreview}
            />
          </View>
          <StudioWatchPreview
            styleName={customization.watchPreviewStyle}
            primary={customization.primaryAccent}
            secondary={customization.secondaryAccent}
            focus={customization.focusColor}
            examTitle={firstAssignment?.title || "Next assignment"}
            assignmentTitle={secondAssignment?.title || selectedDefinition.title}
          />
        </View>
      </View>

      <SectionTitle title="Customize Classes" note="Class colors and icons drive cards, forecast dots, and widget rows." />
      <View style={styles.classList}>
        {courses.map((course) => (
          <View key={course.id} style={[styles.classEditor, selectedCourse?.id === course.id ? styles.classEditorActive : null]}>
            <TouchableOpacity accessibilityRole="button" style={styles.classEditorHeader} onPress={() => setSelectedCourseId(course.id)}>
              <View style={[styles.classIcon, { backgroundColor: course.color }]}>
                <Text style={styles.classEmoji}>{courseEmoji(course)}</Text>
              </View>
              <View style={styles.classEditorCopy}>
                <Text style={styles.className} numberOfLines={1}>{course.name || course.code}</Text>
                <Text style={styles.classMeta} numberOfLines={1}>{course.code}</Text>
              </View>
              <ChevronRight color={SPBoardColors.faint} size={18} />
            </TouchableOpacity>
            <View style={styles.swatchRow}>
              {studioClassColors.map((color) => (
                <Swatch
                  key={`${course.id}-${color}`}
                  color={color}
                  selected={course.color.toUpperCase() === color.toUpperCase()}
                  onPress={() => updateClassColor(course, color)}
                />
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconPicker}>
              {studioClassIconOptions.map((option) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: course.iconKey === option.key || course.emojiKey === option.key }}
                  key={`${course.id}-${option.key}`}
                  style={[styles.iconChip, course.iconKey === option.key || course.emojiKey === option.key ? styles.iconChipActive : null]}
                  onPress={() => updateClassIcon(course, option.key)}
                >
                  <Text style={styles.iconChipEmoji}>{courseEmoji({ ...course, iconKey: option.key, emojiKey: option.key })}</Text>
                  <Text style={styles.iconChipText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}
      </View>

      <SectionTitle title="Accent System" note="Secondary accents update buttons, chips, progress details, focus, and forecast signals." />
      <View style={styles.accentPanel}>
        {(["primary", "secondary", "risk", "focus", "activity"] as const).map((role) => (
          <View key={role} style={styles.accentRole}>
            <View style={styles.accentRoleHeader}>
              <Text style={styles.accentRoleTitle}>{roleLabel(role)}</Text>
              <View style={[styles.accentSample, { backgroundColor: colorForAccentRole(customization, role) }]} />
            </View>
            <View style={styles.swatchRow}>
              {studioAccentColors.map((color) => (
                <Swatch
                  key={`${role}-${color}`}
                  color={color}
                  selected={colorForAccentRole(customization, role).toUpperCase() === color.toUpperCase()}
                  onPress={() => updateAccent(role, color)}
                />
              ))}
            </View>
          </View>
        ))}
      </View>

      <SectionTitle title={`Widget ${"Studio"}`} note="Preview first. Then tune content, source, size, color, and style." />
      <View style={styles.widgetStudio}>
        <Text style={styles.panelTitle}>Recommended widgets</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendedRow}>
          {studioWidgetDefinitions.map((definition, index) => {
            const locked = plusLocked && index > 1;
            const proof = recommendedWidgetProof(definition.id, selectedCourse);
            return (
              <TouchableOpacity
                accessibilityRole="button"
                key={definition.id}
                disabled={locked}
                style={[styles.recommendedCard, locked ? styles.lockedCard : null]}
                onPress={() => updateWidget({ contentType: definition.id })}
              >
                <View style={[styles.recommendedIcon, { backgroundColor: recommendedColor(definition.id, customization) }]}>
                  {locked ? <Lock color="#FFFFFF" size={17} /> : <Sparkles color="#FFFFFF" size={17} />}
                </View>
                <Text style={styles.recommendedTitle} numberOfLines={2}>{definition.title}</Text>
                <Text style={styles.recommendedJob} numberOfLines={3}>{definition.job}</Text>
                <Text style={styles.recommendedProof} numberOfLines={2}>Why: {proof.why}</Text>
                <Text style={styles.recommendedProof} numberOfLines={2}>Where: {proof.where}</Text>
                <Text style={styles.recommendedProof} numberOfLines={2}>Data: {proof.data}</Text>
                <Text style={styles.recommendedProof} numberOfLines={2}>Changes with: {proof.changes}</Text>
                {locked ? <Text style={styles.plusBadge}>Plus</Text> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.surfaceTabs}>
          {surfaceOptions.map((option) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: surface === option }}
              key={option}
              style={[
                styles.surfaceTab,
                surface === option ? styles.surfaceTabActive : null,
                surface === option
                  ? { backgroundColor: withAlpha(customization.secondaryAccent, 0.13), borderColor: withAlpha(customization.secondaryAccent, 0.34) }
                  : null
              ]}
              onPress={() => {
                setSurface(option);
                setSelectedWidgetId(packForSurface(customization, option)[0]?.id || selectedWidgetId);
              }}
            >
              {surfaceIcon(option)}
              <Text style={[styles.surfaceText, surface === option ? styles.surfaceTextActive : null]}>{surfaceLabel(option)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.packGrid}>
          {currentPack.map((widget) => {
            const definition = widgetDefinitionForSetting(widget);
            const active = widget.id === selectedWidget?.id;
            const snapshot = snapshotForWidgetKind(nativeSnapshots, definition.nativeKind);
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={widget.id}
                style={[styles.packCard, active ? styles.packCardActive : null, active ? { borderColor: withAlpha(customization.secondaryAccent, 0.42) } : null]}
                onPress={() => setSelectedWidgetId(widget.id)}
              >
                <Text style={styles.packSurface}>{surfaceLabel(surface)}</Text>
                <Text style={styles.packTitle}>{definition.title}</Text>
                <Text style={styles.packMeta}>{displaySizeLabel(widget.size)} / {labelForWidgetStyle(widget.style)}</Text>
                <SPWidgetTile
                  tone="white"
                  label="StudyPlanner"
                  value={snapshot.value}
                  title={definition.title}
                  detail={snapshot.detail}
                  progress={snapshot.progress}
                  mini
                  showLabel={false}
                  style={styles.packMiniWidget}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedWidget ? (
          <View style={styles.customizerPanel}>
            <View style={styles.customizerHeader}>
              <View>
                <Text style={styles.customizerKicker}>CUSTOMIZE</Text>
                <Text style={styles.customizerTitle}>{selectedDefinition.title}</Text>
              </View>
              {plusLocked && surface !== "home" ? <Text style={styles.plusBadge}>Plus</Text> : null}
            </View>

            <ControlGroup title="Content type">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.controlRow}>
                {studioWidgetDefinitions.map((definition, index) => (
                  <Chip
                    key={definition.id}
                    label={definition.title}
                    selected={selectedWidget.contentType === definition.id}
                    selectedColor={customization.secondaryAccent}
                    locked={plusLocked && index > 1}
                    onPress={() => updateWidget({ contentType: definition.id })}
                  />
                ))}
              </ScrollView>
            </ControlGroup>

            <ControlGroup title="Class or activity focus">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.controlRow}>
                {courses.map((course) => (
                  <Chip
                    key={course.id}
                    label={course.code}
                    color={course.color}
                    selected={selectedWidget.classFocusCourseId === course.id}
                    selectedColor={customization.secondaryAccent}
                    onPress={() => {
                      setSelectedCourseId(course.id);
                      updateWidget({ classFocusCourseId: course.id, colorSource: "class" });
                    }}
                  />
                ))}
              </ScrollView>
            </ControlGroup>

            <ControlGroup title="Color source">
              <View style={styles.controlRowWrap}>
                {colorSources.map((source) => (
                  <Chip
                    key={source}
                    label={colorSourceLabel(source)}
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

            <ControlGroup title="Size">
              <View style={styles.controlRowWrap}>
                {sizesForSurface(surface).map((size) => (
                  <Chip
                    key={size}
                    label={displaySizeLabel(size)}
                    selected={selectedWidget.size === size}
                    selectedColor={customization.secondaryAccent}
                    locked={plusLocked && (surface !== "home" || size === "large")}
                    onPress={() => updateWidget({ size })}
                  />
                ))}
              </View>
            </ControlGroup>

            <ControlGroup title="Style">
              <View style={styles.controlRowWrap}>
                {widgetStyles.map((style) => (
                  <Chip
                    key={style}
                    label={labelForWidgetStyle(style)}
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

      <View style={styles.savedSetup}>
        <View style={styles.savedSetupIcon}>
          <Crown color={customization.secondaryAccent} size={18} />
        </View>
        <View style={styles.savedSetupCopy}>
          <Text style={styles.savedSetupTitle}>Saved setup</Text>
          <Text style={styles.savedSetupMeta}>
            {customization.savedSetupName || "Semester board"} / {customization.homeWidgetPack.length} Home / {customization.lockWidgetPack.length} Lock / {customization.watchWidgetPack.length} Watch
          </Text>
        </View>
        <Text style={styles.savedSetupBadge}>{plusLocked ? "Plus" : "Saved"}</Text>
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

function roleLabel(role: "primary" | "secondary" | "risk" | "focus" | "activity") {
  if (role === "primary") return "Primary accent";
  if (role === "secondary") return "Secondary accent";
  if (role === "risk") return "Risk color";
  if (role === "focus") return "Focus color";
  return "Activity color";
}

function colorSourceLabel(source: WidgetStudioSetting["colorSource"]) {
  if (source === "class") return "Auto from class";
  if (source === "urgency") return "Auto from urgency";
  return "Custom";
}

function surfaceLabel(surface: WidgetStudioSurface) {
  if (surface === "lock") return "Lock Screen";
  if (surface === "watch") return "Watch";
  return "Home Screen";
}

function surfaceIcon(surface: WidgetStudioSurface) {
  const Icon = surface === "lock" ? Lock : surface === "watch" ? Watch : Smartphone;
  return <Icon color={SPBoardColors.text} size={15} />;
}

function recommendedColor(contentType: WidgetStudioContentType, customization: ReturnType<typeof normalizeStudioCustomization>) {
  if (contentType === "exam_countdown" || contentType === "heavy_week_warning") return customization.riskColor;
  if (contentType === "focus_window") return customization.focusColor;
  if (contentType === "free_time_forecast") return customization.activityColor;
  if (contentType === "class_progress") return customization.secondaryAccent;
  return customization.primaryAccent;
}

function recommendedWidgetProof(contentType: WidgetStudioContentType, course?: Course) {
  const className = course?.code || course?.name || "the selected class";
  if (contentType === "exam_countdown") {
    return {
      why: "keeps the next exam from sneaking up",
      where: "Home Screen and Lock Screen",
      data: "reviewed exams sorted by due date",
      changes: "risk color, exam class color, urgency"
    };
  }
  if (contentType === "next_assignment") {
    return {
      why: "puts the next real task first",
      where: "Home Screen and Lock Screen",
      data: "reviewed open assignments",
      changes: "class color, class icon, due urgency"
    };
  }
  if (contentType === "next_class") {
    return {
      why: "shows what room and class comes next",
      where: "Home Screen",
      data: "class meetings and room details",
      changes: "class color and class icon"
    };
  }
  if (contentType === "focus_window") {
    return {
      why: "turns the next task into a study block",
      where: "Home Screen and Watch",
      data: "focus queue and default timer",
      changes: "focus accent and selected task"
    };
  }
  if (contentType === "semester_progress") {
    return {
      why: "shows how much term runway is left",
      where: "Home Screen",
      data: "semester dates and open work",
      changes: "secondary accent and progress"
    };
  }
  if (contentType === "heavy_week_warning") {
    return {
      why: "warns before the week stacks up",
      where: "Home Screen and Lock Screen",
      data: "exams, open work, review inbox",
      changes: "risk color and workload"
    };
  }
  if (contentType === "free_time_forecast") {
    return {
      why: "shows if the week has breathing room",
      where: "Home Screen",
      data: "forecast load and focus sessions",
      changes: "activity accent and workload"
    };
  }
  if (contentType === "review_inbox_status") {
    return {
      why: "keeps unapproved imports visible",
      where: "Home Screen and Lock Screen",
      data: "parser review inbox",
      changes: "urgency and inbox count"
    };
  }
  return {
    why: `keeps ${className} progress visible`,
    where: "Home Screen and Watch",
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

function StudioWatchPreview({
  styleName,
  primary,
  secondary,
  focus,
  examTitle,
  assignmentTitle
}: {
  styleName: string;
  primary: string;
  secondary: string;
  focus: string;
  examTitle: string;
  assignmentTitle: string;
}) {
  const compact = styleName === "compact";
  return (
    <View style={[styles.watchPreview, compact ? styles.watchPreviewCompact : null]}>
      <View style={styles.watchTopRow}>
        <View style={[styles.watchRing, { borderColor: secondary }]} />
        <View>
          <Text style={styles.watchTime}>10:09</Text>
          <Text style={styles.watchDate}>TUE 13</Text>
        </View>
      </View>
      <View style={[styles.watchMiniCard, { backgroundColor: primary }]}>
        <Text style={styles.watchMiniKicker}>NEXT</Text>
        <Text style={styles.watchMiniTitle} numberOfLines={2}>{assignmentTitle}</Text>
      </View>
      <View style={[styles.watchMiniCard, { backgroundColor: focus }]}>
        <Text style={styles.watchMiniKicker}>FOCUS</Text>
        <Text style={styles.watchMiniTitle} numberOfLines={1}>45 min</Text>
      </View>
      <Text style={styles.watchFootnote} numberOfLines={1}>{examTitle}</Text>
    </View>
  );
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
  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 14
  },
  heroCopy: {
    flex: 1,
    minWidth: 0
  },
  heroTitle: {
    color: SPBoardColors.text,
    fontSize: 32,
    lineHeight: 36,
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
  livePreview: {
    borderRadius: 24,
    backgroundColor: "rgba(248,250,252,0.88)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(210,212,218,0.82)",
    padding: 14,
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
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "900"
  },
  syncPill: {
    maxWidth: "100%",
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
    gap: 10
  },
  previewCard: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: StyleSheet.hairlineWidth,
    padding: 13
  },
  classPreviewCard: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "flex-start"
  },
  nativeWidgetPreview: {
    transform: [{ scale: 0.92 }],
    transformOrigin: "top left"
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
  watchPreview: {
    borderRadius: 28,
    backgroundColor: "#050505",
    padding: 12,
    gap: 7,
    minHeight: 184
  },
  watchPreviewCompact: {
    minHeight: 150
  },
  watchTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  watchRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 4
  },
  watchTime: {
    color: "#FFFFFF",
    fontSize: 21,
    lineHeight: 24,
    fontWeight: "900"
  },
  watchDate: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "900"
  },
  watchMiniCard: {
    borderRadius: 14,
    padding: 9
  },
  watchMiniKicker: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "900"
  },
  watchMiniTitle: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900"
  },
  watchFootnote: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800"
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
