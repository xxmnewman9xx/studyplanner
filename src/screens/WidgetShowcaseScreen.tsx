import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Crown, Sparkles } from "lucide-react-native";

import { AppButton } from "../components/AppButton";
import {
  GlassCard,
  LoopStepper,
  PalettePicker,
  PremiumHeader,
  PremiumScreen,
  StatusBadge,
  WidgetPreviewMedium,
  WidgetPreviewSmall,
} from "../components/PremiumUI";
import { isStoreCaptureEnabled } from "../config/storeCapture";
import { storeCaptureNow } from "../data/demoSemester";
import { Assignment, Course, Semester, WidgetSnapshot, WidgetSnapshotStyle } from "../models";
import { WidgetSnapshotService } from "../services/widgetSnapshotService";
import {
  normalizeWidgetPreferences,
  WidgetFocusPreference,
  WidgetPreferences,
  WidgetSizePreference
} from "../services/widgetPreferences";
import {
  AppTheme,
  createWidgetStyleSnapshot,
  readableAccentOnBackground,
  readableColorOnBackground,
  resolveThemePalette,
  ThemePaletteId,
  widgetStylePresets
} from "../theme";
import { useAppTheme } from "../themeContext";
import { UpgradeScreen } from "./UpgradeScreen";

type WidgetShowcaseScreenProps = {
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
  reviewQueueCount?: number;
  captureWidgetPreview?: WidgetSizePreference | null;
  preferences: WidgetPreferences;
  onPreferencesChange: (preferences: WidgetPreferences) => void;
  captureState?: string | null;
};

const widgetSizes: WidgetSizePreference[] = ["small", "medium"];
const widgetFocusOptions: Array<{
  id: WidgetFocusPreference;
  label: string;
  description: string;
}> = [
  { id: "nextDue", label: "Due Next", description: "Answers what is due next without opening the app." },
  { id: "today", label: "Today", description: "Shows what needs attention today." },
  { id: "needsReview", label: "Needs Review", description: "Shows found work that still needs a check." },
  { id: "thisWeek", label: "Week", description: "Shows the next several deadlines and overflow count." },
  { id: "classFocus", label: "Class Focus", description: "Narrows the widget preview to one class." },
  { id: "empty", label: "Empty State", description: "Previews the calm state when nothing is due." }
];
const studioThemePresetIds: ThemePaletteId[] = [
  "aurora",
  "ocean",
  "sunset",
  "forest",
  "lavender",
  "midnight",
  "minimal",
  "candy"
];
const studioBackgroundStyleIds = ["glass", "softGradient", "cleanCard", "darkGlass"] as const;
const layoutOptions = [
  { id: "standard" as const, label: "Standard" },
  { id: "compact" as const, label: "Compact" }
];
const bodyTextScale = 1.35;

export function WidgetShowcaseScreen({
  semester,
  courses,
  assignments,
  reviewQueueCount,
  captureWidgetPreview,
  preferences,
  onPreferencesChange,
  captureState
}: WidgetShowcaseScreenProps) {
  const { theme, paletteId, setPalette } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const captureMode = isStoreCaptureEnabled();
  const [showPlans, setShowPlans] = useState(false);
  const widgetStyleId = preferences.styleId;
  const widgetSize = captureWidgetPreview || preferences.size;
  const widgetFocus = captureWidgetPreview === "small" ? "nextDue" : captureWidgetPreview === "medium" ? "thisWeek" : preferences.focus;
  const safeWidgetFocus = widgetFocusOptions.some((option) => option.id === widgetFocus)
    ? widgetFocus
    : "thisWeek";
  const widgetStyle = createWidgetStyleSnapshot(paletteId, widgetStyleId);
  const snapshot = WidgetSnapshotService.build(
    {
      semester,
      courses,
      assignments,
      paletteId,
      widgetStyleId,
      courseFocusId: preferences.courseFocusId,
      layoutId: preferences.layoutId,
      reviewQueueCount,
      demoState: captureMode ? { enabled: true, label: "Preview" } : undefined
    },
    captureMode ? storeCaptureNow : new Date()
  );
  const selectedFocus = useMemo(
    () => widgetFocusOptions.find((option) => option.id === safeWidgetFocus) ?? widgetFocusOptions[0]!,
    [safeWidgetFocus]
  );
  const selectedStats = getSelectedWidgetStats(snapshot, safeWidgetFocus);
  const studioPalettes = studioThemePresetIds.map((id) => resolveThemePalette(id));
  const activeStudioPalette = resolveThemePalette(paletteId);
  const selectedCourse =
    preferences.courseFocusId === "all"
      ? undefined
      : courses.find((course) => course.id === preferences.courseFocusId);
  const updatePreferences = (patch: Partial<WidgetPreferences>) => {
    onPreferencesChange(normalizeWidgetPreferences({ ...preferences, ...patch }));
  };

  if (showPlans && !captureMode) {
    return <UpgradeScreen onContinueFree={() => setShowPlans(false)} />;
  }

  return (
    <PremiumScreen>
      <PremiumHeader
        eyebrow="4 Focus Widgets"
        title={captureState === "widget-empty" ? "Empty Widget" : captureState === "widget-needs-check" ? "Needs Review Widget" : "Widget Studio"}
        subtitle="Pick your view, your style, and the class focus for small and medium Home Screen widgets."
      />

      <LoopStepper activeIndex={3} compact />

      <GlassCard tint="hero" style={styles.heroCard}>
        <View pointerEvents="none" style={styles.heroBand} />
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Sparkles color={colors.heroText} size={20} />
          </View>
          <View style={styles.heroCopy}>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.heroTitle}>Live Home Screen preview</Text>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.heroMeta}>
              {selectedCourse?.code || "All classes"} - {selectedFocus.label} - saved automatically
            </Text>
          </View>
          <StatusBadge label={widgetStyle.styleName} tone="purple" />
        </View>
        <StudioWidgetPreview
          focus={safeWidgetFocus}
          size={widgetSize}
          snapshot={snapshot}
          widgetStyle={widgetStyle}
          courseName={selectedCourse?.code}
          layoutId={preferences.layoutId}
        />
      </GlassCard>

      <GlassCard style={styles.customizerCard}>
        <View style={styles.customizerTop}>
          <View>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.panelTitle}>Choose widget</Text>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.panelMeta}>
              {sizeLabel(widgetSize)} - {selectedFocus.label} - {activeStudioPalette.name}
            </Text>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.panelFinePrint}>
              Auto-saved. Installed widgets use checked assignments only, and iOS refreshes on its own timing.
            </Text>
          </View>
          <View style={[styles.swatchLarge, { backgroundColor: widgetStyle.accent }]} />
        </View>

        <View style={styles.controlGroup}>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.controlLabel}>Size</Text>
          <View style={styles.segmented}>
            {widgetSizes.map((size) => (
              <TouchableOpacity
                key={size}
                accessibilityRole="button"
                accessibilityLabel={`Use ${sizeLabel(size)} widget size`}
                accessibilityState={{ selected: widgetSize === size }}
                style={[styles.segment, widgetSize === size ? styles.segmentActive : null]}
                onPress={() => updatePreferences({ size })}
              >
                <Text maxFontSizeMultiplier={bodyTextScale} style={[styles.segmentText, widgetSize === size ? styles.segmentTextActive : null]}>
                  {sizeLabel(size)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.controlLabel}>Focus view</Text>
          <View style={styles.chipRow}>
            {widgetFocusOptions.map((focus) => (
              <TouchableOpacity
                key={focus.id}
                accessibilityRole="button"
                accessibilityLabel={`Show ${focus.label} on widget`}
                accessibilityHint={focus.description}
                accessibilityState={{ selected: safeWidgetFocus === focus.id }}
                activeOpacity={0.82}
                style={[styles.textChip, safeWidgetFocus === focus.id ? styles.textChipActive : null]}
                onPress={() => updatePreferences({ focus: focus.id })}
              >
                <Text maxFontSizeMultiplier={bodyTextScale} style={[styles.chipText, safeWidgetFocus === focus.id ? styles.chipTextActive : null]}>
                  {focus.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.controlLabel}>Class focus</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Show all classes in widget preview"
              accessibilityState={{ selected: preferences.courseFocusId === "all" }}
              activeOpacity={0.82}
              style={[styles.textChip, preferences.courseFocusId === "all" ? styles.textChipActive : null]}
              onPress={() => updatePreferences({ courseFocusId: "all" })}
            >
              <Text maxFontSizeMultiplier={bodyTextScale} style={[styles.chipText, preferences.courseFocusId === "all" ? styles.chipTextActive : null]}>
                All Classes
              </Text>
            </TouchableOpacity>
            {courses.slice(0, 6).map((course) => (
              <TouchableOpacity
                key={course.id}
                accessibilityRole="button"
                accessibilityLabel={`Focus widget preview on ${course.code}`}
                accessibilityState={{ selected: preferences.courseFocusId === course.id }}
                activeOpacity={0.82}
                style={[styles.textChip, preferences.courseFocusId === course.id ? styles.textChipActive : null]}
                onPress={() => updatePreferences({ courseFocusId: course.id, focus: "classFocus" })}
              >
                <View style={[styles.courseChipDot, { backgroundColor: course.color }]} />
                <Text maxFontSizeMultiplier={bodyTextScale} style={[styles.chipText, preferences.courseFocusId === course.id ? styles.chipTextActive : null]}>
                  {course.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.controlLabel}>Background</Text>
          <View style={styles.styleCardGrid}>
            {widgetStylePresets.filter((style) => (studioBackgroundStyleIds as readonly string[]).includes(style.id)).map((style) => (
              <WidgetStyleCard
                key={style.id}
                preset={style}
                active={widgetStyleId === style.id}
                onPress={() => updatePreferences({ styleId: style.id })}
              />
            ))}
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.controlLabel}>Theme preset</Text>
          <PalettePicker
            palettes={studioPalettes}
            activeId={activeStudioPalette.id}
            onSelect={(id) => setPalette(id as ThemePaletteId)}
          />
        </View>

        <View style={styles.controlGroup}>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.controlLabel}>Layout</Text>
          <View style={styles.chipRow}>
            {layoutOptions.map((layout) => (
              <TouchableOpacity
                key={layout.id}
                accessibilityRole="button"
                accessibilityLabel={`Use ${layout.label} widget layout`}
                accessibilityState={{ selected: preferences.layoutId === layout.id }}
                activeOpacity={0.82}
                style={[styles.textChip, preferences.layoutId === layout.id ? styles.textChipActive : null]}
                onPress={() => updatePreferences({ layoutId: layout.id })}
              >
                <Text maxFontSizeMultiplier={bodyTextScale} style={[styles.chipText, preferences.layoutId === layout.id ? styles.chipTextActive : null]}>
                  {layout.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </GlassCard>

      <View
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`Live widget preview. ${selectedFocus.label}, ${sizeLabel(widgetSize)}. ${selectedStats.value} ${selectedStats.label}.`}
        style={styles.livePreviewStage}
      >
        <View pointerEvents="none" style={styles.stageBandTop} />
        <View pointerEvents="none" style={styles.stageBandBottom} />
        <View style={styles.livePreviewHeader}>
          <View style={styles.livePreviewCopy}>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.liveKicker}>Live preview</Text>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.liveTitle}>
              {selectedFocus.label} - {sizeLabel(widgetSize)}
            </Text>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.liveMeta}>{selectedFocus.description}</Text>
          </View>
          <View style={styles.statStack}>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.statValue}>{selectedStats.value}</Text>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.statLabel}>{selectedStats.label}</Text>
          </View>
        </View>
        <View style={styles.previewMetaRow}>
          <StatusBadge label={widgetStyle.styleName} tone="purple" />
          <StatusBadge label={theme.palette.name} tone="blue" />
        </View>
        <StudioWidgetPreview
          focus={safeWidgetFocus}
          size={widgetSize}
          snapshot={snapshot}
          widgetStyle={widgetStyle}
          courseName={selectedCourse?.code}
          layoutId={preferences.layoutId}
        />
      </View>

      <View style={styles.widgetStage}>
        <View pointerEvents="none" style={styles.stageBandTop} />
        <View pointerEvents="none" style={styles.stageBandBottom} />
        <View style={styles.galleryHeader}>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.galleryKicker}>Widget setup</Text>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.galleryTitle}>Small and medium widgets use your latest deadlines.</Text>
        </View>
        <View style={styles.widgetPair}>
          <WidgetPreviewSmall snapshot={snapshot} widgetStyle={widgetStyle} />
          <WidgetPreviewMedium snapshot={snapshot} widgetStyle={widgetStyle} />
        </View>
      </View>

      {!captureMode ? (
        <GlassCard>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.plusTitle}>Study Planner Plus</Text>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.plusCopy}>
            Plus unlocks syllabus scan, calendar sync, reminders, and grade forecasting. Purchases are handled
            securely through the App Store, and Restore Purchases is available anytime.
          </Text>
          <AppButton
            label="View Plus Plans"
            icon={Crown}
            accessibilityHint="Opens Study Planner Plus plan options for widgets and premium tools."
            onPress={() => setShowPlans(true)}
          />
        </GlassCard>
      ) : null}
    </PremiumScreen>
  );
}

function StudioWidgetPreview({
  focus,
  size,
  snapshot,
  widgetStyle,
  courseName,
  layoutId
}: {
  focus: WidgetFocusPreference;
  size: WidgetSizePreference;
  snapshot: WidgetSnapshot;
  widgetStyle: WidgetSnapshotStyle;
  courseName?: string;
  layoutId: WidgetPreferences["layoutId"];
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const items = previewItemsForFocus(snapshot, focus);
  const title = previewTitleForFocus(focus, courseName);
  const stat = getSelectedWidgetStats(snapshot, focus);
  const text = widgetStyle.text;
  const muted = widgetStyle.muted;
  const accentText = readableAccentOnBackground([widgetStyle.accent, widgetStyle.secondary], widgetStyle.background, text, 4.5);
  const compact = layoutId === "compact";
  const frameStyle = size === "small" ? styles.studioSmallWidget : styles.studioMediumWidget;

  return (
    <View style={[frameStyle, compact ? styles.studioWidgetCompact : null, { backgroundColor: widgetStyle.background }]}>
      <View pointerEvents="none" style={[styles.studioWidgetBandTop, { backgroundColor: `${widgetStyle.secondary}48` }]} />
      <View pointerEvents="none" style={[styles.studioWidgetBandBottom, { backgroundColor: `${widgetStyle.accent}38` }]} />
      <View style={styles.studioWidgetTop}>
        <Text style={[styles.studioWidgetKicker, { color: text }]}>{title}</Text>
        <Text style={[styles.studioWidgetBadge, { color: accentText }]}>{stat.value}</Text>
      </View>
      {focus === "empty" || items.length === 0 ? (
        <View style={styles.studioWidgetEmpty}>
          <Sparkles color={widgetStyle.accent} size={24} />
          <Text style={[styles.studioWidgetTitle, { color: text }]} numberOfLines={2}>
            {focus === "empty" ? "All caught up" : snapshot.emptyState.title}
          </Text>
          <Text style={[styles.studioWidgetMeta, { color: muted }]} numberOfLines={size === "small" ? 2 : 3}>
            {focus === "empty" ? "Enjoy your day." : snapshot.emptyState.message}
          </Text>
        </View>
      ) : size === "small" ? (
        <View style={styles.studioWidgetSingle}>
          <View style={[styles.studioWidgetIcon, { backgroundColor: items[0]?.courseColor || widgetStyle.accent }]}>
            <Crown color={readableColorOnBackground(items[0]?.courseColor || widgetStyle.accent)} size={15} />
          </View>
          <Text style={[styles.studioWidgetTitle, { color: text }]} numberOfLines={2}>
            {items[0]?.title || "Next task"}
          </Text>
          <Text style={[styles.studioWidgetMeta, { color: muted }]} numberOfLines={1}>
            {items[0]?.courseName || courseName || "StudyPlanner"}
          </Text>
          <Text style={[styles.studioWidgetDue, { color: accentText }]} numberOfLines={1}>
            {items[0]?.dueLabel || stat.label}
          </Text>
        </View>
      ) : (
        <View style={styles.studioWidgetList}>
          {items.slice(0, compact ? 5 : 4).map((item) => (
            <View key={item.assignmentId} style={styles.studioWidgetRow}>
              <View style={[styles.studioWidgetDot, { backgroundColor: item.courseColor || widgetStyle.accent }]} />
              <View style={styles.studioWidgetRowCopy}>
                <Text style={[styles.studioWidgetRowTitle, { color: text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.studioWidgetRowMeta, { color: muted }]} numberOfLines={1}>
                  {item.courseName} - {item.dueLabel}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function getSelectedWidgetStats(snapshot: WidgetSnapshot, focus: WidgetFocusPreference) {
  if (focus === "nextDue") {
    return {
      value: snapshot.nextDue?.dueLabel || "Clear",
      label: "Next due"
    };
  }

  if (focus === "today") {
    const today = snapshot.thisWeek.filter((item) => item.dueLabel === "Today").length;
    return {
      value: String(today),
      label: "Today"
    };
  }

  if (focus === "needsReview") {
    return {
      value: String(snapshot.reviewQueueCount),
      label: "Needs review"
    };
  }

  if (focus === "classFocus") {
    return {
      value: snapshot.scope?.courseName || "Class",
      label: "Class focus"
    };
  }

  if (focus === "empty") {
    return {
      value: "Clear",
      label: "Empty state"
    };
  }

  return {
    value: String(snapshot.thisWeek.length),
    label: "This week"
  };
}

function previewItemsForFocus(snapshot: WidgetSnapshot, focus: WidgetFocusPreference) {
  if (focus === "nextDue") return snapshot.nextDue ? [snapshot.nextDue] : [];
  if (focus === "today") return snapshot.thisWeek.filter((item) => item.dueLabel === "Today");
  if (focus === "needsReview") return snapshot.thisWeek.filter((item) => item.reviewStatus === "needsReview");
  if (focus === "empty") return [];
  return snapshot.thisWeek;
}

function previewTitleForFocus(focus: WidgetFocusPreference, courseName?: string) {
  switch (focus) {
    case "nextDue":
      return "Due Next";
    case "today":
      return "Today";
    case "needsReview":
      return "Needs Review";
    case "classFocus":
      return courseName ? `${courseName} Focus` : "Class Focus";
    case "empty":
      return "Empty State";
    case "thisWeek":
    default:
      return "Week";
  }
}

function sizeLabel(value: WidgetSizePreference) {
  return value === "small" ? "Small" : "Medium";
}

function nativeFamilyLabel(value: WidgetSizePreference) {
  return value === "small" ? "Small Next Due" : "Medium This Week";
}

function WidgetStyleCard({
  preset,
  active,
  onPress
}: {
  preset: (typeof widgetStylePresets)[number];
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Use ${preset.name} widget style`}
      accessibilityState={{ selected: active }}
      activeOpacity={0.84}
      style={[styles.styleCard, active ? styles.styleCardActive : null]}
      onPress={onPress}
    >
      <View style={[styles.stylePreview, { backgroundColor: preset.background }]}>
        <View style={[styles.stylePreviewBand, { backgroundColor: `${preset.secondary}55` }]} />
        <View style={[styles.stylePreviewLine, { backgroundColor: preset.accent }]} />
        <View style={styles.stylePreviewDots}>
          <View style={[styles.stylePreviewDot, { backgroundColor: preset.accent }]} />
          <View style={[styles.stylePreviewDot, { backgroundColor: preset.secondary }]} />
          <View style={[styles.stylePreviewDot, { backgroundColor: preset.muted }]} />
        </View>
      </View>
      <Text maxFontSizeMultiplier={bodyTextScale} style={[styles.styleCardText, active ? styles.styleCardTextActive : null]}>
        {preset.name}
      </Text>
    </TouchableOpacity>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    heroCard: {
      overflow: "hidden",
      backgroundColor: colors.surface,
      borderColor: `${colors.brandBlue}26`
    },
    heroBand: {
      position: "absolute",
      top: -36,
      right: -42,
      width: 210,
      height: 92,
      borderRadius: 34,
      backgroundColor: `${colors.brandBlue}14`,
      transform: [{ rotate: "22deg" }]
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    heroIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandPurple
    },
    heroCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    heroTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "900"
    },
    heroMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    customizerCard: {
      gap: spacing.md,
      borderColor: "rgba(108,92,231,0.22)"
    },
    customizerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    panelTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "900"
    },
    panelMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700",
      textTransform: "capitalize"
    },
    panelFinePrint: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "700",
      maxWidth: 250
    },
    controlGroup: {
      gap: spacing.xs
    },
    controlLabel: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    styleCardGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    paletteChip: {
      minHeight: 44,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: colors.surfaceAlt
    },
    paletteChipActive: {
      borderColor: colors.brandPurple,
      backgroundColor: colors.purpleSoft
    },
    textChip: {
      minHeight: 44,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      backgroundColor: colors.surfaceAlt
    },
    textChipActive: {
      borderColor: colors.brandPurple,
      backgroundColor: colors.brandPurple
    },
    chipText: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    chipTextActive: {
      color: colors.heroText
    },
    paletteChipTextActive: {
      color: colors.ink
    },
    swatch: {
      width: 14,
      height: 14,
      borderRadius: 7
    },
    swatchLarge: {
      width: 42,
      height: 42,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.line
    },
    styleCard: {
      width: "31.8%",
      minHeight: 116,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: 7,
      gap: 6
    },
    styleCardActive: {
      borderColor: colors.brandPurple,
      backgroundColor: colors.purpleSoft
    },
    stylePreview: {
      height: 70,
      borderRadius: 14,
      overflow: "hidden",
      padding: 8,
      justifyContent: "space-between"
    },
    stylePreviewBand: {
      position: "absolute",
      top: -16,
      right: -18,
      width: 76,
      height: 38,
      borderRadius: 16,
      transform: [{ rotate: "22deg" }]
    },
    stylePreviewLine: {
      width: "68%",
      height: 8,
      borderRadius: 999
    },
    stylePreviewDots: {
      flexDirection: "row",
      gap: 4
    },
    stylePreviewDot: {
      width: 13,
      height: 13,
      borderRadius: 7
    },
    styleCardText: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    styleCardTextActive: {
      color: colors.ink
    },
    segmented: {
      minHeight: 42,
      borderRadius: radii.round,
      backgroundColor: colors.surfaceAlt,
      flexDirection: "row",
      padding: 4,
      gap: 4
    },
    segment: {
      flex: 1,
      borderRadius: radii.round,
      alignItems: "center",
      justifyContent: "center"
    },
    segmentActive: {
      backgroundColor: colors.surface
    },
    segmentText: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "capitalize"
    },
    segmentTextActive: {
      color: colors.ink
    },
    widgetStage: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 30,
      padding: spacing.sm,
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line
    },
    livePreviewStage: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 30,
      padding: spacing.md,
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: `${colors.brandBlue}26`,
      shadowColor: colors.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 5
    },
    livePreviewHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm
    },
    livePreviewCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    liveKicker: {
      color: colors.brandPurple,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    liveTitle: {
      color: colors.ink,
      fontSize: 19,
      lineHeight: 24,
      fontWeight: "900"
    },
    liveMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    statStack: {
      minWidth: 82,
      borderRadius: 18,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.line
    },
    statValue: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    statLabel: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "800"
    },
    previewMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    selectedSmallFrame: {
      width: "58%",
      minWidth: 178,
      alignSelf: "center"
    },
    selectedMediumFrame: {
      width: "100%"
    },
    selectedLockFrame: {
      width: "100%"
    },
    studioSmallWidget: {
      width: 190,
      minHeight: 190,
      alignSelf: "center",
      borderRadius: 28,
      padding: spacing.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
      gap: spacing.xs,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.28 : 0.16,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4
    },
    studioMediumWidget: {
      width: "100%",
      minHeight: 176,
      borderRadius: 28,
      padding: spacing.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
      gap: spacing.xs,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.28 : 0.16,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4
    },
    studioWidgetCompact: {
      minHeight: 154,
      padding: spacing.sm
    },
    studioWidgetBandTop: {
      position: "absolute",
      top: -42,
      right: -52,
      width: 180,
      height: 86,
      borderRadius: 32,
      transform: [{ rotate: "24deg" }]
    },
    studioWidgetBandBottom: {
      position: "absolute",
      bottom: -44,
      left: -54,
      width: 180,
      height: 76,
      borderRadius: 32,
      transform: [{ rotate: "-18deg" }]
    },
    studioWidgetTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs
    },
    studioWidgetKicker: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    studioWidgetBadge: {
      overflow: "hidden",
      borderRadius: radii.round,
      backgroundColor: "rgba(255,255,255,0.13)",
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900",
      paddingHorizontal: 7,
      paddingVertical: 3
    },
    studioWidgetEmpty: {
      flex: 1,
      justifyContent: "center",
      gap: 5
    },
    studioWidgetSingle: {
      flex: 1,
      justifyContent: "space-between",
      gap: 5
    },
    studioWidgetIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center"
    },
    studioWidgetTitle: {
      fontSize: 19,
      lineHeight: 24,
      fontWeight: "900"
    },
    studioWidgetMeta: {
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    studioWidgetDue: {
      marginTop: "auto",
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    studioWidgetList: {
      gap: 6
    },
    studioWidgetRow: {
      minHeight: 28,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.10)",
      paddingTop: 6
    },
    studioWidgetDot: {
      width: 8,
      height: 8,
      borderRadius: 4
    },
    studioWidgetRowCopy: {
      flex: 1,
      minWidth: 0
    },
    studioWidgetRowTitle: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    studioWidgetRowMeta: {
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "700"
    },
    galleryHeader: {
      zIndex: 1
    },
    galleryKicker: {
      color: colors.brandPurple,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    galleryTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    stageBandTop: {
      position: "absolute",
      top: -48,
      right: -64,
      width: 250,
      height: 116,
      borderRadius: 42,
      backgroundColor: `${colors.brandBlue}14`,
      transform: [{ rotate: "24deg" }]
    },
    stageBandBottom: {
      position: "absolute",
      bottom: -52,
      left: -48,
      width: 230,
      height: 104,
      borderRadius: 38,
      backgroundColor: `${colors.brandCoral}10`,
      transform: [{ rotate: "-18deg" }]
    },
    widgetPair: {
      flexDirection: "row",
      gap: spacing.sm
    },
    paletteDotRow: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    paletteDotButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface
    },
    paletteDotButtonActive: {
      borderColor: colors.brandBlue,
      backgroundColor: colors.blueSoft
    },
    courseChipDot: {
      width: 8,
      height: 8,
      borderRadius: 4
    },
    paletteDot: {
      width: 22,
      height: 22,
      borderRadius: 11
    },
    plusTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "900"
    },
    plusCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700"
    }
  });
}
