import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Crown, Sparkles } from "lucide-react-native";

import { AppButton } from "../components/AppButton";
import {
  GlassCard,
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
  { id: "nextDue", label: "Next Due", description: "Answers what is due next without opening the app." },
  { id: "thisWeek", label: "This Week", description: "Shows the next several deadlines and overflow count." }
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
  const { theme, paletteId, palettes, setPalette } = useAppTheme();
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
  const updatePreferences = (patch: Partial<WidgetPreferences>) => {
    const nativePair =
      patch.focus === "nextDue" || patch.size === "small"
        ? ({ focus: "nextDue", size: "small" } as const)
        : patch.focus === "thisWeek" || patch.size === "medium"
          ? ({ focus: "thisWeek", size: "medium" } as const)
          : {};
    onPreferencesChange(normalizeWidgetPreferences({ ...preferences, ...patch, ...nativePair }));
  };

  if (showPlans && !captureMode) {
    return <UpgradeScreen onContinueFree={() => setShowPlans(false)} />;
  }

  return (
    <PremiumScreen>
      <PremiumHeader
        eyebrow="Widget Setup"
        title={captureState === "widget-empty" ? "Empty Widget" : captureState === "widget-needs-check" ? "Needs Check Widget" : "Widget Setup"}
        subtitle="Preview the supported Home Screen widgets: Small Next Due and Medium This Week."
      />

      <GlassCard tint="hero" style={styles.heroCard}>
        <View pointerEvents="none" style={styles.heroBand} />
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Sparkles color={colors.heroText} size={20} />
          </View>
          <View style={styles.heroCopy}>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.heroTitle}>Your widget preview</Text>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.heroMeta}>
              {snapshot.surfaces.monthly.monthLabel} - {snapshot.surfaces.monthly.dueThisMonth} due - {snapshot.surfaces.heavyWeek.warning?.label || "steady week"}
            </Text>
          </View>
          <StatusBadge label={widgetStyle.styleName} tone="purple" />
        </View>
      </GlassCard>

      <GlassCard style={styles.customizerCard}>
        <View style={styles.customizerTop}>
          <View>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.panelTitle}>Customize</Text>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.panelMeta}>
              {sizeLabel(widgetSize)} - {selectedFocus.label}
            </Text>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.panelFinePrint}>
              These previews use checked assignments only. iOS refreshes installed widgets on its own timing.
            </Text>
          </View>
          <View style={[styles.swatchLarge, { backgroundColor: widgetStyle.accent }]} />
        </View>

        <View style={styles.controlGroup}>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.controlLabel}>Preview</Text>
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
                  {nativeFamilyLabel(size)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.controlLabel}>Shows</Text>
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
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.controlLabel}>Style</Text>
          <View style={styles.styleCardGrid}>
            {widgetStylePresets.map((style) => (
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
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.controlLabel}>Color</Text>
          <View style={styles.paletteDotRow}>
            {palettes.map((palette) => (
              <TouchableOpacity
                key={palette.id}
                accessibilityRole="button"
                accessibilityLabel={`Set app color theme to ${palette.name}`}
                accessibilityState={{ selected: paletteId === palette.id }}
                activeOpacity={0.82}
                style={[
                  styles.paletteDotButton,
                  paletteId === palette.id ? styles.paletteDotButtonActive : null
                ]}
                onPress={() => setPalette(palette.id as ThemePaletteId)}
              >
                <View style={[styles.paletteDot, { backgroundColor: palette.accent }]} />
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
        <SelectedWidgetPreview
          focus={safeWidgetFocus}
          size={widgetSize}
          snapshot={snapshot}
          widgetStyle={widgetStyle}
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

function SelectedWidgetPreview({
  focus,
  size,
  snapshot,
  widgetStyle
}: {
  focus: WidgetFocusPreference;
  size: WidgetSizePreference;
  snapshot: WidgetSnapshot;
  widgetStyle: WidgetSnapshotStyle;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  if (focus === "nextDue") {
    return (
      <View style={size === "small" ? styles.selectedSmallFrame : styles.selectedMediumFrame}>
        <WidgetPreviewSmall snapshot={snapshot} widgetStyle={widgetStyle} />
      </View>
    );
  }

  return (
    <View style={size === "small" ? styles.selectedSmallFrame : styles.selectedMediumFrame}>
      <WidgetPreviewMedium snapshot={snapshot} widgetStyle={widgetStyle} />
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

  return {
    value: String(snapshot.thisWeek.length),
    label: "This week"
  };
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
      alignItems: "center",
      justifyContent: "center",
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
