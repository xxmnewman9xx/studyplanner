import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FlaskConical,
  Palette,
  PenLine,
  RotateCcw,
  Save,
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
  UserSettings,
  WidgetBackground,
  WidgetPalette,
  WidgetPreset,
  WidgetSize,
  WidgetType
} from "../models";
import { getWidgetData } from "../logic/planner";
import { defaultWidgetPresets } from "../data/defaultPlanner";
import { AppTheme, themePalettes } from "../theme";
import { useAppTheme } from "../themeContext";

type MoreScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  settings: UserSettings;
  widgetPresets: WidgetPreset[];
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onSaveWidgetPreset: (preset: WidgetPreset) => void;
  onResetWidgetPresets: () => void;
  onOpenFocus: () => void;
  onOpenGrades: () => void;
  onOpenPaywall: () => void;
};

const widgetTypes: WidgetType[] = ["due_next", "today", "class_focus", "focus"];
const widgetSizes: WidgetSize[] = ["small", "medium", "large"];
const backgrounds: WidgetBackground[] = ["glass", "gradient", "dark"];
const widgetPaletteOptions: WidgetPalette[] = [
  "sunset",
  "ocean",
  "forest",
  "lavender",
  "midnight",
  "candy",
  "minimal"
];
const palettes: Array<WidgetPalette | "custom"> = ["ocean", "sunset", "lavender", "midnight", "custom"];
const fonts: WidgetPreset["font"][] = ["SF Pro", "Rounded"];
const layouts: WidgetPreset["layout"][] = ["compact", "list", "ring"];
const iconKeys = ["book", "calendar", "spark", "check", "timer"];

export function MoreScreen({
  assignments,
  courses,
  settings,
  widgetPresets,
  onUpdateSettings,
  onSaveWidgetPreset,
  onResetWidgetPresets,
  onOpenFocus,
  onOpenGrades,
  onOpenPaywall
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
  const hasAssignments = assignments.length > 0;
  const hasCourses = courses.length > 0;
  const needsClassFirst = type === "class_focus" && !hasCourses;
  const displayWidgetData = needsClassFirst
    ? { ...widgetData, headline: "One Class", value: "+", detail: "Add a class first", items: [] }
    : !hasAssignments && type !== "class_focus"
      ? { ...widgetData, headline: labelForWidgetType(type), value: "+", detail: "Add homework to preview", items: [] }
      : widgetData;
  const studioHint = needsClassFirst
    ? "This widget needs a class. Add one in Classes, then come back."
    : !hasAssignments && type !== "class_focus"
      ? "Your real homework will appear here after you add or scan it."
      : "This is the widget content students will see at a glance.";
  const focusedCourse = classFocusCourseId
    ? courses.find((course) => course.id === classFocusCourseId)
    : undefined;
  const starterTemplates: Array<{
    label: string;
    detail: string;
    preset: Pick<WidgetPreset, "type" | "size" | "background" | "palette" | "layout" | "iconKey">;
  }> = [
    {
      label: "Next task",
      detail: "Shows the next assignment and how soon it is due.",
      preset: { type: "due_next", size: "medium", background: "glass", palette: "ocean", layout: "list", iconKey: "calendar" }
    },
    {
      label: "Today stack",
      detail: "Shows how many assignments are due today.",
      preset: { type: "today", size: "large", background: "gradient", palette: "sunset", layout: "list", iconKey: "check" }
    },
    {
      label: "Class glance",
      detail: "Shows open work for one class.",
      preset: { type: "class_focus", size: "medium", background: "glass", palette: "forest", layout: "compact", iconKey: "book" }
    },
    {
      label: "Focus lock",
      detail: "Shows a simple 25-minute focus timer.",
      preset: { type: "focus", size: "small", background: "dark", palette: "midnight", layout: "ring", iconKey: "timer" }
    }
  ];

  const savePreset = () => {
    const timestamp = new Date().toISOString();
    const existingPreset = widgetPresets.find((preset) => preset.id === editingPresetId);
    const savedPreset: WidgetPreset = {
      ...previewPreset,
      id: editingPresetId || `preset-${Date.now()}`,
      name: labelize(type),
      createdAt: existingPreset?.createdAt || timestamp,
      updatedAt: timestamp
    };
    setEditingPresetId(savedPreset.id);
    onSaveWidgetPreset(savedPreset);
  };

  const loadPreset = (preset: WidgetPreset) => {
    setType(preset.type);
    setSize(preset.size);
    setBackground(preset.background);
    setPalette(preset.palette);
    setFont(preset.font);
    setClassFocusCourseId(preset.classFocusCourseId || courses[0]?.id);
    setLayout(preset.layout);
    setIconKey(preset.iconKey);
    setEditingPresetId(preset.id);
  };

  const applyTemplate = (template: Pick<WidgetPreset, "type" | "size" | "background" | "palette" | "layout" | "iconKey">) => {
    setType(template.type);
    setSize(template.size);
    setBackground(template.background);
    setPalette(template.palette);
    setLayout(template.layout);
    setIconKey(template.iconKey);
    setEditingPresetId(`preset-${template.type}-${template.size}`);
  };

  const resetStudio = () => {
    onResetWidgetPresets();
    const defaultPreset = defaultWidgetPresets[0];
    if (defaultPreset) loadPreset(defaultPreset);
  };

  return (
    <View>
      <GlassCard tone="hero" style={styles.studioHero}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <AppLogo showWordmark size={36} />
            <Text style={styles.kicker}>Widget Studio</Text>
            <Text style={styles.heroTitle}>Choose what shows on your Home Screen.</Text>
            <Text style={styles.heroText}>{studioHint}</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
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
          />
        </View>
      </GlassCard>

      <SectionHeader title="Pick one widget" note="Each option has one clear job. The preview above changes immediately." />
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
            <Text style={styles.templateTitle}>{template.label}</Text>
            <Text style={styles.templateDetail}>{template.detail}</Text>
            <Text style={styles.templateMeta}>{template.preset.size === "large" ? "Big" : template.preset.size === "small" ? "Small" : "Medium"} widget</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionHeader title="Customize" note="Only the choices that matter are here." />
      <GlassCard style={styles.controlsCard}>
        <ControlLabel title="Size" />
        <SegmentedControl
          options={widgetSizes}
          value={size}
          onChange={setSize}
          labelForOption={(value) => (value === "large" ? "Big" : value === "small" ? "Small" : "Medium")}
        />

        {type === "class_focus" ? (
          <>
            <ControlLabel title="Class" />
            {hasCourses ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRail}>
                {courses.map((course) => (
                  <ChoiceChip
                    key={course.id}
                    label={course.code}
                    active={course.id === classFocusCourseId}
                    color={course.color}
                    onPress={() => setClassFocusCourseId(course.id)}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyHelper}>Add a class in the Classes tab before saving this widget.</Text>
            )}
          </>
        ) : null}

        <ControlLabel title="Color" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteRail}>
          {palettes.filter((option) => option !== "custom").map((option) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: option === palette }}
              key={option}
              style={[styles.paletteButton, option === palette ? styles.paletteButtonActive : null]}
              onPress={() => {
                setPalette(option);
                onUpdateSettings({ selectedTheme: option });
              }}
            >
              <View style={styles.paletteDots}>
                {themePalettes[option].slice(0, 4).map((color) => (
                  <View key={color} style={[styles.paletteDot, { backgroundColor: color }]} />
                ))}
              </View>
              <Text style={styles.paletteName}>{labelize(option)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.controlActions}>
          <AppButton label="Save widget" icon={Save} onPress={savePreset} style={styles.actionButton} />
          <AppButton
            label="Reset"
            icon={RotateCcw}
            variant="secondary"
            onPress={resetStudio}
            style={styles.actionButton}
          />
        </View>
      </GlassCard>

      <SectionHeader title="Saved widgets" note="Tap one to edit it again." />
      <GlassCard style={styles.savedCard}>
        {widgetPresets.slice(0, 5).map((preset) => {
          const data = getWidgetData(preset, assignments, courses);
          const active = preset.id === editingPresetId;
          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={preset.id}
              style={[styles.savedRow, active ? styles.savedRowActive : null]}
              onPress={() => loadPreset(preset)}
            >
              <View style={[styles.savedIcon, { backgroundColor: themePalettes[preset.palette][1] }]}>
                <Text style={styles.savedIconText}>{preset.type === "class_focus" ? "📚" : preset.type === "focus" ? "⏱" : "✓"}</Text>
              </View>
              <View style={styles.savedCopy}>
                <Text style={styles.savedTitle}>{data.headline}</Text>
                <Text style={styles.savedMeta}>{labelize(preset.type)} · {labelize(preset.size)} · {labelize(preset.background)}</Text>
              </View>
              <Text style={styles.savedAction}>{active ? "Editing" : "Load"}</Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity accessibilityRole="button" style={styles.saveCurrentRow} onPress={savePreset}>
          <Text style={styles.saveCurrentText}>Save current design</Text>
          <Text style={styles.saveCurrentPlus}>+</Text>
        </TouchableOpacity>
      </GlassCard>

      <SectionHeader title="How to use it" note="Saving here creates the design. iOS controls placing the widget." />
      <GlassCard style={styles.helpCard}>
        <View style={styles.helpStep}>
          <Text style={styles.helpNumber}>1</Text>
          <Text style={styles.helpText}>Save the widget you want.</Text>
        </View>
        <View style={styles.helpStep}>
          <Text style={styles.helpNumber}>2</Text>
          <Text style={styles.helpText}>Long-press your iPhone Home Screen.</Text>
        </View>
        <View style={styles.helpStep}>
          <Text style={styles.helpNumber}>3</Text>
          <Text style={styles.helpText}>Tap + and choose StudyPlanner.</Text>
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
    due_next: "Next Task",
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
      fontSize: 23,
      lineHeight: 28,
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
      alignItems: "center"
    },
    templateGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    templateCard: {
      width: "48%",
      minHeight: 118,
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.045)" : colors.surface,
      padding: spacing.md,
      gap: spacing.xs,
      justifyContent: "space-between"
    },
    templateCardActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    templateTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900"
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
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    controlsCard: {
      gap: spacing.xs
    },
    controlLabel: {
      marginTop: spacing.xs,
      color: colors.faint,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      textTransform: "uppercase"
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
