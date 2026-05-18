import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FlaskConical,
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
import { AppTheme, themePalettes } from "../theme";
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
  const { theme } = useAppTheme();
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }),
    [background, classFocusCourseId, editingPresetId, font, iconKey, layout, palette, size, type]
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

  const applyTemplate = (template: Pick<WidgetPreset, "type" | "size" | "background" | "palette" | "layout" | "iconKey">) => {
    setType(template.type);
    setSize(template.size);
    setBackground(template.background);
    setPalette(template.palette);
    setLayout(template.layout);
    setIconKey(template.iconKey);
    setEditingPresetId(`preset-${template.type}-${template.size}`);
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

        <ControlLabel title="Background" />
        <SegmentedControl options={backgrounds} value={background} onChange={setBackground} labelForOption={labelize} />

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

        <View style={styles.controlActions}>
          <AppButton
            label={selectedTemplateLocked ? "Unlock advanced widget" : "Save widget preset"}
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
              setEditingPresetId(preset.id);
            }}
          >
            <View style={[styles.savedIcon, { backgroundColor: themePalettes[preset.palette][1] || colors.accent }]}>
              <Text style={styles.savedIconText}>{preset.size === "large" ? "L" : preset.size === "medium" ? "M" : "S"}</Text>
            </View>
            <View style={styles.savedCopy}>
              <Text style={styles.savedTitle}>{preset.name}</Text>
              <Text style={styles.savedMeta}>{labelForWidgetType(preset.type)} | {labelize(preset.size)} | {labelize(preset.palette)}</Text>
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
        <Text style={styles.packCopy}>Free includes basic Today and Upcoming widgets. Plus owns saved advanced presets, themes, class templates, and focus templates.</Text>
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
