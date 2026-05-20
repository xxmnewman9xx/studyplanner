import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FlaskConical,
  Layers3,
  Moon,
  Palette,
  PenLine,
  Sparkles,
  Timer
} from "lucide-react-native";
import {
  AppLogo,
  GlassCard,
  SegmentedControl,
  WidgetPreviewCard
} from "../components/AppleComponents";
import { AppButton } from "../components/AppButton";
import { SectionHeader } from "../components/SectionHeader";
import {
  Assignment,
  Course,
  ParsedImport,
  Semester,
  UserSettings,
  WidgetBackground,
  WidgetPalette,
  WidgetPreset,
  WidgetSize,
  WidgetType
} from "../models";
import { getWidgetData } from "../logic/planner";
import { buildStudyPlannerWidgetSnapshots } from "../services/widgetSnapshot";
import type { WidgetSyncStatus } from "../services/widgetSnapshot";
import { AppTheme, ThemeAccent, appThemePalettes, themePalettes } from "../theme";
import { useAppTheme } from "../themeContext";

type MoreScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  semester: Semester;
  parsedImports: ParsedImport[];
  demoMode?: boolean;
  settings: UserSettings;
  widgetPresets: WidgetPreset[];
  nativeWidgetStatus: WidgetSyncStatus;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onSaveWidgetPreset: (preset: WidgetPreset) => void;
  onResetWidgetPresets: () => void;
  onOpenFocus: () => void;
  onOpenGrades: () => void;
  onOpenPaywall: () => void;
  premiumWidgetsLocked?: boolean;
};

const widgetSizes: WidgetSize[] = ["small", "medium", "large"];
const palettes: WidgetPalette[] = ["ocean", "sunset", "forest", "lavender", "midnight", "minimal"];
const backgrounds: WidgetBackground[] = ["glass", "solid", "gradient", "dark"];
const layouts: WidgetPreset["layout"][] = ["compact", "list", "ring", "calendar", "grid"];
const appThemeOptions: ThemeAccent[] = ["campus", "classic", "mint", "aura", "rose", "graphite", "solar", "slate"];

export function MoreScreen({
  assignments,
  courses,
  semester,
  parsedImports,
  demoMode = false,
  settings,
  widgetPresets,
  nativeWidgetStatus,
  onUpdateSettings,
  onSaveWidgetPreset,
  onResetWidgetPresets,
  onOpenFocus,
  onOpenGrades,
  onOpenPaywall,
  premiumWidgetsLocked = false
}: MoreScreenProps) {
  const { theme, setAccent } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const firstPreset = widgetPresets[0];
  const [type, setType] = useState<WidgetType>(firstPreset?.type || "due_next");
  const [size, setSize] = useState<WidgetSize>(firstPreset?.size || "medium");
  const [background, setBackground] = useState<WidgetBackground>(
    firstPreset?.background || settings.defaultWidgetStyle
  );
  const [palette, setPalette] = useState<WidgetPalette>(firstPreset?.palette || "sunset");
  const [font, setFont] = useState<WidgetPreset["font"]>(firstPreset?.font || "SF Pro");
  const [classFocusCourseId, setClassFocusCourseId] = useState<string | undefined>(
    firstPreset?.classFocusCourseId || courses[0]?.id
  );
  const [layout, setLayout] = useState<WidgetPreset["layout"]>(firstPreset?.layout || "compact");
  const [iconKey, setIconKey] = useState(firstPreset?.iconKey || "book");
  const [editingPresetId, setEditingPresetId] = useState(firstPreset?.id || "preset-due-next");
  const [selectedThemePackId, setSelectedThemePackId] = useState<string | undefined>(firstPreset?.themePackId);


  const previewPreset = useMemo<WidgetPreset>(
    () => ({
      id: editingPresetId || "preview",
      name: labelize(type),
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
    [background, classFocusCourseId, editingPresetId, font, iconKey, layout, palette, selectedThemePackId, size, type]
  );
  const widgetData = getWidgetData(previewPreset, assignments, courses);
  const nativeSnapshots = useMemo(
    () =>
      buildStudyPlannerWidgetSnapshots({
        semester,
        courses,
        assignments,
        parsedImports,
        demoMode
      }),
    [assignments, courses, demoMode, parsedImports, semester]
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
    ? { ...widgetData, headline: "One Class", value: "+", detail: "Add a class first", items: [] }
    : !hasAssignments && type !== "class_focus"
      ? { ...widgetData, headline: labelForWidgetType(type), value: "+", detail: "Add homework to preview", items: [] }
      : widgetData;
  const studioHint = nativePreview
    ? nativePreview.footnote
    : needsClassFirst
    ? "This widget needs a class. Add one in Classes, then come back."
    : !hasAssignments && type !== "class_focus"
      ? "Your real homework will appear here after you add or scan it."
      : "This is the preview content students can tune before saving a Plus preset.";
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
      label: "Morning Brief",
      time: "7–10 AM",
      promise: "What is due today before school starts.",
      preset: { type: "today", size: "medium", background: "glass", palette: "sunset", layout: "list", iconKey: "check", font: "SF Pro" }
    },
    {
      id: "between_classes",
      label: "Between Classes",
      time: "10 AM–3 PM",
      promise: "Next class-specific thing to remember.",
      preset: { type: "class_focus", size: "small", background: "glass", palette: "forest", layout: "compact", iconKey: "book", font: "Rounded" }
    },
    {
      id: "study_time",
      label: "Study Block",
      time: "3–9 PM",
      promise: "The next focus task, tuned for action.",
      preset: { type: "focus", size: "small", background: "dark", palette: "midnight", layout: "ring", iconKey: "timer", font: "Mono" }
    },
    {
      id: "night_review",
      label: "Night Review",
      time: "9 PM+",
      promise: "Tomorrow and week load before bed.",
      preset: { type: "week", size: "medium", background: "glass", palette: "lavender", layout: "calendar", iconKey: "calendar", font: "SF Pro" }
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
    { id: "aura-glass", label: "Aura Glass", detail: "Widgetsmith-style purple/pink identity system.", appTheme: "aura", widgetPalette: "lavender", widgetBackground: "glass" },
    { id: "exam-graphite", label: "Exam Graphite", detail: "High-contrast study mode for deadline weeks.", appTheme: "graphite", widgetPalette: "midnight", widgetBackground: "dark" },
    { id: "solar-campus", label: "Solar Campus", detail: "Warm morning widgets for daily planning.", appTheme: "solar", widgetPalette: "sunset", widgetBackground: "glass" }
  ];

  const starterTemplates: Array<{
    label: string;
    detail: string;
    moment: string;
    data: string;
    entitlement: "free" | "plus";
    preset: Pick<WidgetPreset, "type" | "size" | "background" | "palette" | "layout" | "iconKey">;
  }> = [
    {
      label: "Upcoming",
      detail: "Next reviewed deadline",
      moment: "Home Screen",
      data: "Reviewed deadlines",
      entitlement: "free",
      preset: { type: "due_next", size: "medium", background: "glass", palette: "ocean", layout: "list", iconKey: "calendar" }
    },
    {
      label: "Today",
      detail: "Due today",
      moment: "Morning stack",
      data: "Reviewed work",
      entitlement: "free",
      preset: { type: "today", size: "medium", background: "glass", palette: "sunset", layout: "list", iconKey: "check" }
    },
    {
      label: "Deadline Map",
      detail: "Week workload",
      moment: "Weekly review",
      data: "Due soon",
      entitlement: "plus",
      preset: { type: "week", size: "large", background: "glass", palette: "lavender", layout: "calendar", iconKey: "calendar" }
    },
    {
      label: "Class Risk",
      detail: "One class status",
      moment: "Before class",
      data: "Class-specific",
      entitlement: "plus",
      preset: { type: "class_focus", size: "medium", background: "glass", palette: "forest", layout: "compact", iconKey: "book" }
    },
    {
      label: "Focus Block",
      detail: "Start studying fast",
      moment: "Study time",
      data: "Next focus task",
      entitlement: "plus",
      preset: { type: "focus", size: "small", background: "dark", palette: "midnight", layout: "ring", iconKey: "timer" }
    },
    {
      label: "Needs Check",
      detail: "Flagged import items",
      moment: "After import",
      data: "Review queue",
      entitlement: "plus",
      preset: { type: "needs_check", size: "medium", background: "solid", palette: "minimal", layout: "list", iconKey: "check" }
    }
  ];
  const selectedTemplate =
    starterTemplates.find((template) => template.preset.type === type) || starterTemplates[0]!;
  const basicNativeTemplate = selectedTemplate.entitlement === "free" && (type === "today" || type === "due_next");
  const advancedCustomizationSelected =
    size === "large" ||
    background !== selectedTemplate.preset.background ||
    palette !== selectedTemplate.preset.palette ||
    layout !== selectedTemplate.preset.layout ||
    iconKey !== selectedTemplate.preset.iconKey ||
    font !== "SF Pro";
  const selectedTemplateLocked =
    premiumWidgetsLocked &&
    (selectedTemplate.entitlement === "plus" || (basicNativeTemplate && advancedCustomizationSelected));
  const nativeStatusLabel =
    nativeWidgetStatus.state === "synced"
      ? "Native ready"
      : nativeWidgetStatus.state === "unavailable"
        ? "Build needed"
        : "WidgetKit";
  const smartPresetCount = widgetPresets.filter((preset) => preset.smartStackSlot).length;
  const studioScore = [hasAssignments, hasCourses, nativeWidgetStatus.state === "synced", smartPresetCount >= 4, Boolean(settings.appTheme)].filter(Boolean).length;
  const dataSourceLabel = nativePreview ? "Native WidgetKit snapshot" : type === "class_focus" ? "Class-specific planner data" : "Live planner data";
  const selectedSmartSlot = smartStackSlots.find((slot) => `smart-${slot.id}` === editingPresetId || smartSlotFromPresetId(editingPresetId) === slot.id);

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

  return (
    <View>
      <GlassCard tone="hero" style={styles.studioHero}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <AppLogo showWordmark size={36} />
            <Text style={styles.kicker}>Widget Studio</Text>
            <Text style={styles.heroTitle}>Real widgets, real planner data.</Text>
            <Text style={styles.heroText} numberOfLines={2}>Small and medium Today and Upcoming widgets sync reviewed homework. Plus owns advanced templates and customization.</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{nativeStatusLabel}</Text>
          </View>
        </View>
        <View style={styles.previewStage}>
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
            nativeMode={Boolean(nativePreview)}
            nativeAccentColor={nativePreview?.accentColor}
            nativeBackgroundColor={nativePreview?.backgroundColor}
            footnote={nativePreview?.footnote}
            semesterName={nativePreview?.semesterName}
          />
          <Text style={styles.previewHint}>{studioHint}</Text>
        </View>
      </GlassCard>

      <GlassCard style={styles.commandCard}>
        <View style={styles.commandHeader}>
          <View>
            <Text style={styles.commandKicker}>Customization path</Text>
            <Text style={styles.commandTitle}>Pick a template. Tune the preview. Save the system.</Text>
          </View>
          <View style={styles.commandScorePill}>
            <Text style={styles.commandScoreValue}>{studioScore}/5</Text>
            <Text style={styles.commandScoreLabel}>ready</Text>
          </View>
        </View>
        <View style={styles.commandGrid}>
          <View style={styles.commandStep}>
            <Text style={styles.commandStepNumber}>1</Text>
            <Text style={styles.commandStepText}>Free native Today + Upcoming stay useful.</Text>
          </View>
          <View style={styles.commandStep}>
            <Text style={styles.commandStepNumber}>2</Text>
            <Text style={styles.commandStepText}>{dataSourceLabel} powers the current preview.</Text>
          </View>
          <View style={styles.commandStep}>
            <Text style={styles.commandStepNumber}>3</Text>
            <Text style={styles.commandStepText}>Plus unlocks saved Smart Stack and advanced styles.</Text>
          </View>
        </View>
      </GlassCard>

      <SectionHeader title="Smart Stack schedule" note="The highest-leverage Widgetsmith pattern: one widget system for each school-day moment." />
      <GlassCard style={styles.smartStackCard}>
        <View style={styles.smartStackHeader}>
          <View style={styles.smartStackIcon}>
            <Layers3 color={colors.heroText} size={18} />
          </View>
          <View style={styles.smartStackCopy}>
            <Text style={styles.smartStackTitle}>Build the day’s widget rotation.</Text>
            <Text style={styles.smartStackText}>Save four presets for Morning, Between Classes, Study Time, and Night Review — each powered by real planner data.</Text>
          </View>
          <Text style={styles.smartStackPlus}>Plus</Text>
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
          label={premiumWidgetsLocked ? "Unlock Smart Stack" : "Save Smart Stack presets"}
          icon={premiumWidgetsLocked ? Sparkles : Layers3}
          onPress={saveSmartStack}
        />
      </GlassCard>

      <SectionHeader title="One-tap theme packs" note="Widgetsmith wins because the phone feels cohesive. These pair app theme + widget material." />
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
                <Text style={styles.themePlus}>Plus</Text>
              </View>
              <Text style={styles.themePackDetail}>{pack.detail}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionHeader title="App appearance" note="Premium themes now restyle the whole app shell, not just one accent." />
      <GlassCard style={styles.appearanceCard}>
        <View style={styles.appearanceTopRow}>
          <View style={styles.appearanceCopy}>
            <Text style={styles.appearanceTitle}>Premium app themes</Text>
            <Text style={styles.appearanceText}>Change the app atmosphere: canvas, glass cards, hero surfaces, accents, widget defaults, and class energy.</Text>
          </View>
          <View style={styles.appearanceBadge}>
            <Palette color={colors.accent} size={15} />
            <Text style={styles.appearanceBadgeText}>{appThemePalettes[settings.appTheme || "campus"].label}</Text>
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
                  <Text style={styles.appThemeName}>{optionMeta.label}</Text>
                  {premiumTheme ? <Text style={styles.themePlus}>Plus</Text> : <Text style={styles.themeFree}>Free</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      <SectionHeader title="Template gallery" note="Today and Upcoming are native on iOS. Advanced templates are Plus." />
      <View style={styles.templateGrid}>
        {starterTemplates.map((template) => (
          <TouchableOpacity
            accessibilityRole="button"
            key={template.label}
            style={[
              styles.templateCard,
              template.preset.type === type && template.preset.size === size ? styles.templateCardActive : null
            ]}
            onPress={() => applyTemplate(template.preset)}
          >
            <View style={styles.templateTopRow}>
              <Text style={styles.templateTitle} numberOfLines={1}>{template.label}</Text>
              <Text style={[styles.templateEntitlement, template.entitlement === "plus" ? styles.templateEntitlementPlus : null]}>
                {template.entitlement === "plus" ? "Plus" : "Free"}
              </Text>
            </View>
            <Text style={styles.templateDetail} numberOfLines={1}>{template.detail}</Text>
            <Text style={styles.templateMeta} numberOfLines={1}>{template.moment} | {template.data} | {template.preset.size === "large" ? "Large" : template.preset.size === "small" ? "Small" : "Medium"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionHeader title="Preview controls" note="Small and medium match the native widgets. Large stays a Plus preview." />
      <GlassCard style={styles.controlsCard}>
        <View style={styles.liveWorkbench}>
          <View style={styles.liveWorkbenchPreview}>
            <WidgetPreviewCard
              title={displayWidgetData.headline}
              value={displayWidgetData.value}
              detail={displayWidgetData.detail}
              background={background}
              palette={palette}
              size="small"
              type={type}
              course={displayWidgetData.course || focusedCourse}
              font={font}
              layout={layout}
              iconKey={iconKey}
              items={displayWidgetData.items}
              nativeMode={Boolean(nativePreview && size !== "large")}
              nativeAccentColor={nativePreview?.accentColor}
              nativeBackgroundColor={nativePreview?.backgroundColor}
              footnote={nativePreview?.footnote}
              semesterName={nativePreview?.semesterName}
              style={styles.liveMiniWidget}
            />
          </View>
          <View style={styles.liveWorkbenchCopy}>
            <Text style={styles.liveWorkbenchKicker}>Live editing</Text>
            <Text style={styles.liveWorkbenchTitle}>Every tap updates this widget.</Text>
            <Text style={styles.liveWorkbenchText}>Tune the look here, then save it as the preset students actually add to Home Screen.</Text>
          </View>
        </View>

        <ControlLabel title="Size intent" />
        <View style={styles.sizeGrid}>
          {widgetSizes.map((option) => {
            const active = option === size;
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={option}
                style={[styles.sizeCard, active ? styles.sizeCardActive : null]}
                onPress={() => setSize(option)}
              >
                <Text style={styles.sizeTitle}>{labelize(option)}</Text>
                <Text style={styles.sizeDetail}>{sizeMentalModel(option)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ControlLabel title="Palette" />
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
                <Text style={styles.paletteName}>{labelize(option)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ControlLabel title="Liquid Glass background" />
        <SegmentedControl options={backgrounds} value={background} onChange={setBackground} labelForOption={(value) => value === "glass" ? "Liquid Glass" : labelize(value)} />

        <ControlLabel title="Layout" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.layoutRail}>
          {layouts.map((option) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: option === layout }}
              key={option}
              style={[styles.layoutOption, option === layout ? styles.layoutOptionActive : null]}
              onPress={() => setLayout(option)}
            >
              <Text style={styles.layoutLabel}>{labelize(option)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {type === "class_focus" ? (
          <>
            <ControlLabel title="Class" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRail}>
              {courses.map((course) => (
                <ChoiceChip
                  key={course.id}
                  label={course.code}
                  active={classFocusCourseId === course.id}
                  color={course.color}
                  onPress={() => setClassFocusCourseId(course.id)}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        <ControlLabel title="Icon" />
        <View style={styles.iconGrid}>
          {["book", "calendar", "check", "timer", "flask", "pen", "spark", "palette"].map((option) => (
            <IconChoice key={option} option={option} />
          ))}
        </View>

        {selectedTemplateLocked ? (
          <View style={styles.lockNotice}>
            <Text style={styles.lockNoticeTitle}>This edit is Plus-only.</Text>
            <Text style={styles.lockNoticeText}>Free keeps real Today and Upcoming widgets. Plus unlocks advanced templates, Smart Stack presets, and saved visual systems.</Text>
          </View>
        ) : null}

        <View style={styles.controlActions}>
          <AppButton
            label={selectedTemplateLocked ? "Unlock advanced widget" : "Save widget preset — live preview"}
            icon={selectedTemplateLocked ? Sparkles : CheckCircle2}
            onPress={saveCurrentPreset}
            style={styles.actionButton}
          />
          <AppButton label="Reset" variant="secondary" onPress={onResetWidgetPresets} style={styles.actionButton} />
        </View>
      </GlassCard>

      <SectionHeader title="Saved presets" note="Basic native widgets stay free. Plus saves advanced template looks." />
      <GlassCard style={styles.savedCard}>
        {widgetPresets.slice(0, 5).map((preset) => (
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
              <Text style={styles.savedMeta}>{preset.scheduleLabel ? `${preset.scheduleLabel} | ` : ""}{labelForWidgetType(preset.type)} | {labelize(preset.size)} | {labelize(preset.palette)}</Text>
            </View>
            <Text style={styles.savedAction}>Edit</Text>
          </TouchableOpacity>
        ))}
      </GlassCard>

      <SectionHeader title="Widget stack" note="Personal, useful, and tied to the school day." />
      <GlassCard style={styles.packCard}>
        <Text style={styles.packTitle}>Daily widget stack</Text>
        <Text style={styles.packCopy}>Morning: Today. Between classes: Upcoming. Study time: Focus Block. Before grades slip: Class Risk.</Text>
      </GlassCard>
      <GlassCard style={styles.packCard}>
        <Text style={styles.packTitle}>Fair Plus boundary</Text>
        <Text style={styles.packCopy}>Free includes basic Today and Upcoming widgets. Plus owns premium app themes, saved advanced widget presets, class templates, focus templates, and Liquid Glass customization.</Text>
        {selectedTemplateLocked ? (
          <View style={styles.lockNotice}>
            <Text style={styles.lockNoticeTitle}>This edit is Plus-only.</Text>
            <Text style={styles.lockNoticeText}>Free keeps real Today and Upcoming widgets. Plus unlocks advanced templates, Smart Stack presets, and saved visual systems.</Text>
          </View>
        ) : null}

        <View style={styles.controlActions}>
          <AppButton label="Open focus" variant="secondary" onPress={onOpenFocus} style={styles.actionButton} />
          <AppButton label="Open grades" variant="secondary" onPress={onOpenGrades} style={styles.actionButton} />
        </View>
      </GlassCard>

      <SectionHeader title="Install status" note={nativeWidgetStatus.message} />
      <GlassCard style={styles.helpCard}>
        <View style={styles.helpStep}>
          <Text style={styles.helpNumber}>1</Text>
          <Text style={styles.helpText}>Add StudyPlanner Today or StudyPlanner Upcoming from the iOS widget gallery.</Text>
        </View>
        <View style={styles.helpStep}>
          <Text style={styles.helpNumber}>2</Text>
          <Text style={styles.helpText}>Widgets show reviewed planner data only. Demo and unreviewed scan text stay inside the app.</Text>
        </View>
        <View style={styles.helpStep}>
          <Text style={styles.helpNumber}>3</Text>
          <Text style={styles.helpText}>Notification permission is only needed for reminders; basic widgets work from the shared WidgetKit snapshot.</Text>
        </View>
      </GlassCard>
    </View>
  );

function AuditPill({ label, active }: { label: string; active: boolean }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={[styles.auditPill, active ? styles.auditPillActive : null]}>
      <Text style={[styles.auditPillText, active ? styles.auditPillTextActive : null]}>{active ? "✓" : "•"} {label}</Text>
    </View>
  );
}

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

  function ChoiceChip({
    label,
    active,
    color,
    onPress
  }: {
    label: string;
    active: boolean;
    color?: string;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={[styles.choiceChip, active ? styles.choiceChipActive : null]}
        onPress={onPress}
      >
        {color ? <View style={[styles.choiceDot, { backgroundColor: color }]} /> : null}
        <Text style={[styles.choiceChipText, active ? styles.choiceChipTextActive : null]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  function IconChoice({ option }: { option: string }) {
    const Icon = studioIconForKey(option);
    const active = option === iconKey;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${labelize(option)} widget icon`}
        accessibilityState={{ selected: active }}
        style={[styles.iconButton, active ? styles.iconButtonActive : null]}
        onPress={() => setIconKey(option)}
      >
        <Icon color={active ? colors.accent : colors.muted} size={18} />
      </TouchableOpacity>
    );
  }
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

function sizeMentalModel(value: WidgetSize) {
  if (value === "small") return "One answer";
  if (value === "medium") return "Context + next";
  if (value === "large") return "Day or week";
  return "Lock Screen";
}

function studioIconForKey(value: string) {
  const map: Record<string, React.ComponentType<{ color: string; size: number }>> = {
    book: BookOpen,
    calendar: CalendarDays,
    flask: FlaskConical,
    pen: PenLine,
    spark: Sparkles,
    check: CheckCircle2,
    timer: Timer,
    palette: Palette
  };
  return map[value] || CalendarDays;
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    studioHero: {
      gap: spacing.sm,
      padding: spacing.sm
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
      fontSize: 22,
      lineHeight: 26,
      fontWeight: "900"
    },
    heroText: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
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
      gap: spacing.xs
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
    themeFree: {
      color: colors.muted,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "900"
    },
    templateGrid: {
      gap: spacing.xs
    },
    templateCard: {
      minHeight: 68,
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
      lineHeight: 16,
      fontWeight: "700"
    },
    templateMeta: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 13,
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
    devicePreviewRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md
    },
    homeScreen: {
      flex: 1,
      minWidth: 260,
      minHeight: 360,
      borderRadius: 34,
      backgroundColor: "#DCEBFF",
      padding: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.lg,
      borderWidth: 6,
      borderColor: colors.ink
    },
    appIconGrid: {
      width: 200,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      justifyContent: "center"
    },
    fakeAppIcon: {
      width: 42,
      height: 42,
      borderRadius: 13
    },
    lockScreen: {
      flex: 1,
      minWidth: 220,
      minHeight: 360,
      borderRadius: 34,
      backgroundColor: "#101024",
      padding: spacing.lg,
      alignItems: "center",
      borderWidth: 6,
      borderColor: colors.ink
    },
    lockDate: {
      color: "#D9D6FF",
      fontSize: 12,
      fontWeight: "800"
    },
    lockTime: {
      marginTop: spacing.xs,
      color: "#FFFFFF",
      fontSize: 58,
      lineHeight: 66,
      fontWeight: "300"
    },
    lockWidgets: {
      marginTop: "auto",
      width: "100%",
      gap: spacing.sm
    },
    lockPill: {
      overflow: "hidden",
      borderRadius: radii.lg,
      backgroundColor: "rgba(255,255,255,0.16)",
      color: "#FFFFFF",
      padding: spacing.sm,
      fontSize: 12,
      fontWeight: "900"
    },
    lockCircle: {
      alignSelf: "center",
      overflow: "hidden",
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "rgba(255,255,255,0.16)",
      color: "#FFFFFF",
      textAlign: "center",
      lineHeight: 48,
      fontSize: 17,
      fontWeight: "900"
    },
    lockShapeStrip: {
      marginTop: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: "#25205F",
      padding: spacing.md,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    lockShape: {
      flex: 1,
      minWidth: 86,
      minHeight: 72,
      borderRadius: radii.lg,
      backgroundColor: "rgba(255,255,255,0.1)",
      alignItems: "center",
      justifyContent: "center",
      gap: 3
    },
    lockShapeValue: {
      color: "#FFFFFF",
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900",
      textAlign: "center"
    },
    lockShapeLabel: {
      color: "#C9C4FF",
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
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
