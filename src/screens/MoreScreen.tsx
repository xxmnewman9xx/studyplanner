import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Bell,
  Crown,
  Palette,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Timer,
  WandSparkles
} from "lucide-react-native";
import {
  AppLogo,
  EmojiBadge,
  GlassCard,
  SegmentedControl,
  SettingsRow,
  ThemeCard,
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

const widgetTypes: WidgetType[] = [
  "due_next",
  "today",
  "needs_check",
  "week",
  "class_focus",
  "empty",
  "focus",
  "streak"
];
const widgetSizes: WidgetSize[] = ["small", "medium", "large"];
const backgrounds: WidgetBackground[] = ["solid", "gradient", "glass", "dark"];
const palettes: Array<WidgetPalette | "custom"> = [
  "sunset",
  "ocean",
  "forest",
  "lavender",
  "midnight",
  "candy",
  "minimal",
  "custom"
];
const fonts: WidgetPreset["font"][] = ["SF Pro", "Rounded", "New York", "Mono"];
const layouts: WidgetPreset["layout"][] = ["compact", "list", "ring", "calendar", "grid"];
const iconKeys = ["book", "calendar", "flask", "pen", "spark", "check", "timer", "palette"];

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

  const previewPreset = useMemo<WidgetPreset>(
    () => ({
      id: "preview",
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
    [background, classFocusCourseId, font, iconKey, layout, palette, size, type]
  );
  const widgetData = getWidgetData(previewPreset, assignments, courses);
  const focusedCourse = classFocusCourseId
    ? courses.find((course) => course.id === classFocusCourseId)
    : undefined;

  const savePreset = () => {
    onSaveWidgetPreset({
      ...previewPreset,
      id: `preset-${Date.now()}`,
      name: labelize(type),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
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
  };

  return (
    <View>
      <GlassCard tone="hero" style={styles.studioHero}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <AppLogo showWordmark size={44} />
            <Text style={styles.kicker}>Widget Studio</Text>
            <Text style={styles.heroTitle}>Design widgets that match your vibe.</Text>
            <Text style={styles.heroText}>
              Pick size, type, background, palette, class focus, icon, and layout. The preview updates immediately.
            </Text>
          </View>
          <EmojiBadge name="widget" label="Live" tone="violet" />
        </View>
        <View style={styles.previewStage}>
          <WidgetPreviewCard
            title={widgetData.headline}
            value={widgetData.value}
            detail={widgetData.detail}
            background={background}
            palette={palette}
            size={size}
            type={type}
            course={widgetData.course || focusedCourse}
          />
        </View>
      </GlassCard>

      <SectionHeader title="Live Controls" note="Native-feeling choices, no mock-only state" />
      <GlassCard style={styles.controlsCard}>
        <ControlLabel title="Size" />
        <SegmentedControl
          options={widgetSizes}
          value={size}
          onChange={setSize}
          labelForOption={labelize}
        />

        <ControlLabel title="Type" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRail}>
          {widgetTypes.map((option) => (
            <ChoiceChip
              key={option}
              label={labelize(option)}
              active={option === type}
              onPress={() => setType(option)}
            />
          ))}
        </ScrollView>

        <ControlLabel title="Background" />
        <SegmentedControl
          options={backgrounds}
          value={background}
          onChange={(value) => {
            setBackground(value);
            onUpdateSettings({ defaultWidgetStyle: value });
          }}
          labelForOption={labelize}
        />

        <ControlLabel title="Palette" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteRail}>
          {palettes.map((option) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: option === palette || option === settings.selectedTheme }}
              key={option}
              style={[
                styles.paletteButton,
                (option === palette || option === settings.selectedTheme) ? styles.paletteButtonActive : null
              ]}
              onPress={() => {
                if (option !== "custom") setPalette(option);
                onUpdateSettings({ selectedTheme: option });
              }}
            >
              <View style={styles.paletteDots}>
                {(option === "custom" ? settings.customPalette : themePalettes[option]).slice(0, 4).map((color) => (
                  <View key={color} style={[styles.paletteDot, { backgroundColor: color }]} />
                ))}
              </View>
              <Text style={styles.paletteName}>{labelize(option)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ControlLabel title="Font" />
        <SegmentedControl options={fonts} value={font} onChange={setFont} />

        <ControlLabel title="Class Focus" />
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
              <View style={styles.layoutLines}>
                <View style={styles.layoutLineStrong} />
                <View style={styles.layoutLine} />
                <View style={option === "grid" ? styles.layoutGrid : styles.layoutLine} />
              </View>
              <Text style={styles.layoutLabel}>{labelize(option)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ControlLabel title="Icon" />
        <View style={styles.iconGrid}>
          {iconKeys.map((option) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: option === iconKey }}
              key={option}
              style={[styles.iconButton, option === iconKey ? styles.iconButtonActive : null]}
              onPress={() => setIconKey(option)}
            >
              <Text style={styles.iconButtonText}>{iconGlyph(option)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.controlActions}>
          <AppButton label="Save preset" icon={Save} onPress={savePreset} style={styles.actionButton} />
          <AppButton
            label="Reset"
            icon={RotateCcw}
            variant="secondary"
            onPress={onResetWidgetPresets}
            style={styles.actionButton}
          />
        </View>
      </GlassCard>

      <SectionHeader title="Saved Presets" note="Tap to load a setup" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedRail}>
        {widgetPresets.map((preset) => {
          const data = getWidgetData(preset, assignments, courses);
          return (
            <TouchableOpacity accessibilityRole="button" key={preset.id} onPress={() => loadPreset(preset)}>
              <WidgetPreviewCard
                title={data.headline}
                value={data.value}
                detail={data.detail}
                background={preset.background}
                palette={preset.palette}
                size="small"
                type={preset.type}
                course={data.course}
              />
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity accessibilityRole="button" style={styles.newPresetCard} onPress={savePreset}>
          <Text style={styles.newPresetPlus}>+</Text>
          <Text style={styles.newPresetText}>New preset</Text>
        </TouchableOpacity>
      </ScrollView>

      <SectionHeader title="Widget Library" note="Small, medium, glass, gradient, solid, dark" />
      <View style={styles.libraryGrid}>
        {widgetTypes.slice(0, 6).map((option, index) => {
          const libraryPreset: WidgetPreset = {
            ...previewPreset,
            type: option,
            size: index % 2 === 0 ? "small" : "medium",
            background: backgrounds[index % backgrounds.length] || "solid",
            palette: palettes[index % 6] as WidgetPalette,
            classFocusCourseId: courses[index % Math.max(courses.length, 1)]?.id
          };
          const data = getWidgetData(libraryPreset, assignments, courses);
          return (
            <WidgetPreviewCard
              key={option}
              title={data.headline}
              value={data.value}
              detail={data.detail}
              background={libraryPreset.background}
              palette={libraryPreset.palette}
              size={libraryPreset.size}
              type={option}
              course={data.course}
              style={libraryPreset.size === "medium" ? styles.libraryWide : undefined}
            />
          );
        })}
      </View>

      <SectionHeader title="Home & Lock Screen" note="Realistic in-app previews for Apple contexts" />
      <View style={styles.devicePreviewRow}>
        <View style={styles.homeScreen}>
          <WidgetPreviewCard
            title="Due Next"
            value="2h"
            detail="Algebra II - Worksheet"
            background="glass"
            palette="ocean"
            size="medium"
            type="due_next"
            course={courses[0]}
          />
          <View style={styles.appIconGrid}>
            {["#EC4899", "#10B981", "#FFFFFF", "#FDBA2D", "#2F80ED", "#8B5CF6"].map((color, index) => (
              <View key={`${color}-${index}`} style={[styles.fakeAppIcon, { backgroundColor: color }]} />
            ))}
          </View>
        </View>
        <View style={styles.lockScreen}>
          <Text style={styles.lockDate}>Wednesday, May 13</Text>
          <Text style={styles.lockTime}>9:41</Text>
          <View style={styles.lockWidgets}>
            <Text style={styles.lockPill}>Due next · 2h</Text>
            <Text style={styles.lockCircle}>3</Text>
            <Text style={styles.lockCircle}>7</Text>
          </View>
        </View>
      </View>

      <SectionHeader title="Themes" note="Eight curated vibes plus your own" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeRail}>
        {palettes.map((option) => (
          <ThemeCard
            key={option}
            name={labelize(option)}
            palette={option}
            selected={settings.selectedTheme === option}
            onPress={() => {
              onUpdateSettings({ selectedTheme: option });
              if (option !== "custom") setPalette(option);
            }}
          />
        ))}
      </ScrollView>

      <SectionHeader title="Settings" note="Short, clean, and student-focused" />
      <View style={styles.settingsList}>
        <SettingsRow icon={Palette} title="Theme" value={labelize(settings.selectedTheme)} />
        <SettingsRow icon={WandSparkles} title="Default widget style" value={labelize(settings.defaultWidgetStyle)} />
        <SettingsRow icon={Bell} title="Notifications" value={settings.notificationDefault} />
        <SettingsRow icon={Timer} title="Focus mode default" value={`${settings.focusDefaultMinutes} min`} onPress={onOpenFocus} />
        <SettingsRow icon={Crown} title="Grade forecast" value="Weighted targets" onPress={onOpenGrades} />
        <SettingsRow
          icon={ShieldCheck}
          title="Privacy mode"
          value={settings.privacyMode ? "On" : "Off"}
          onPress={() => onUpdateSettings({ privacyMode: !settings.privacyMode })}
        />
        <SettingsRow icon={Settings} title="Sync" value={settings.syncEnabled ? "iCloud ready" : "Off"} />
      </View>

      <SectionHeader title="StudyPlanner Pro" note="Unlimited scans, widgets, themes, sync, insights" />
      <GlassCard tone="dark" style={styles.paywallCard}>
        <Text style={styles.paywallKicker}>Two tiers · 7-day trial</Text>
        <Text style={styles.paywallTitle}>Unlimited Study Power</Text>
        <Text style={styles.paywallCopy}>
          Save every preset, unlock all themes, sync across devices, and scan without limits.
        </Text>
        <View style={styles.planRow}>
          <View style={styles.planCard}>
            <Text style={styles.planTitle}>Monthly</Text>
            <Text style={styles.planPrice}>$4.99</Text>
          </View>
          <View style={[styles.planCard, styles.planCardBest]}>
            <Text style={styles.bestBadge}>BEST VALUE</Text>
            <Text style={styles.planTitle}>Yearly</Text>
            <Text style={styles.planPrice}>$29.99</Text>
          </View>
        </View>
        <AppButton label="Open Pro options" icon={Crown} onPress={onOpenPaywall} />
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
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function iconGlyph(value: string) {
  const map: Record<string, string> = {
    book: "▣",
    calendar: "□",
    flask: "△",
    pen: "✎",
    spark: "✦",
    check: "✓",
    timer: "◴",
    palette: "◐"
  };
  return map[value] || "□";
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    studioHero: {
      gap: spacing.lg
    },
    heroHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md
    },
    heroCopy: {
      flex: 1,
      gap: spacing.sm
    },
    kicker: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    heroTitle: {
      ...typography.title,
      color: colors.heroText
    },
    heroText: {
      ...typography.body,
      color: colors.heroMuted
    },
    previewStage: {
      alignItems: "center"
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
    chipRail: {
      gap: spacing.xs,
      paddingRight: spacing.md
    },
    choiceChip: {
      minHeight: 36,
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
    iconButtonText: {
      color: colors.ink,
      fontSize: 19,
      fontWeight: "900"
    },
    controlActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm
    },
    actionButton: {
      flex: 1
    },
    savedRail: {
      gap: spacing.md,
      paddingRight: spacing.lg
    },
    newPresetCard: {
      width: 126,
      minHeight: 126,
      borderRadius: 22,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.lineStrong,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs
    },
    newPresetPlus: {
      color: colors.accent,
      fontSize: 26,
      lineHeight: 31,
      fontWeight: "900"
    },
    newPresetText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900"
    },
    libraryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md
    },
    libraryWide: {
      width: "100%"
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
    themeRail: {
      gap: spacing.sm,
      paddingRight: spacing.lg
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
