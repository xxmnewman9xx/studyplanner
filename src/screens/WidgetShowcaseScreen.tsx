import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Crown, Sparkles } from "lucide-react-native";

import { AppButton } from "../components/AppButton";
import {
  GlassCard,
  LockWidgetPreview,
  PremiumHeader,
  PremiumScreen,
  StatusBadge,
  WidgetPreviewCourseFocus,
  WidgetPreviewHeavyWeek,
  WidgetPreviewMedium,
  WidgetPreviewMonthly,
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
  preferences: WidgetPreferences;
  onPreferencesChange: (preferences: WidgetPreferences) => void;
};

const widgetSizes: WidgetSizePreference[] = ["small", "medium", "lock"];
const widgetFocusOptions: Array<{
  id: WidgetFocusPreference;
  label: string;
  description: string;
}> = [
  { id: "nextDue", label: "Next Due", description: "Shows the next assignment or exam." },
  { id: "thisWeek", label: "This Week", description: "Shows the next several deadlines." },
  { id: "monthly", label: "Calendar", description: "Shows this month, busy days, and exams." },
  { id: "heavyWeek", label: "Busy Week", description: "Shows how many deadlines land each day." },
  { id: "courseFocus", label: "Work by Class", description: "Shows which classes have the most open work." },
  { id: "lockScreen", label: "Lock Screen", description: "Shows a quick deadline countdown." }
];

export function WidgetShowcaseScreen({
  semester,
  courses,
  assignments,
  preferences,
  onPreferencesChange
}: WidgetShowcaseScreenProps) {
  const { theme, paletteId, palettes, setPalette } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const captureMode = isStoreCaptureEnabled();
  const [showPlans, setShowPlans] = useState(false);
  const widgetStyleId = preferences.styleId;
  const widgetSize = preferences.size;
  const widgetFocus = preferences.focus;
  const widgetStyle = createWidgetStyleSnapshot(paletteId, widgetStyleId);
  const snapshot = WidgetSnapshotService.build(
    {
      semester,
      courses,
      assignments,
      paletteId,
      widgetStyleId,
      demoState: captureMode ? { enabled: true, label: "Preview" } : undefined
    },
    captureMode ? storeCaptureNow : new Date()
  );
  const selectedFocus = useMemo(
    () => widgetFocusOptions.find((option) => option.id === widgetFocus) ?? widgetFocusOptions[0]!,
    [widgetFocus]
  );
  const selectedStats = getSelectedWidgetStats(snapshot, widgetFocus);
  const updatePreferences = (patch: Partial<WidgetPreferences>) => {
    onPreferencesChange(normalizeWidgetPreferences({ ...preferences, ...patch }));
  };

  if (showPlans && !captureMode) {
    return <UpgradeScreen onContinueFree={() => setShowPlans(false)} />;
  }

  return (
    <PremiumScreen>
      <PremiumHeader
        eyebrow="Widget Studio"
        title="Widget Studio"
        subtitle="Preview widget ideas. iOS Home Screen widgets currently install as Small Next Due and Medium This Week."
      />

      <GlassCard tint="hero" style={styles.heroCard}>
        <View pointerEvents="none" style={styles.heroBand} />
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Sparkles color={colors.heroText} size={20} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Your widget preview</Text>
            <Text style={styles.heroMeta}>
              {snapshot.surfaces.monthly.monthLabel} - {snapshot.surfaces.monthly.dueThisMonth} due - {snapshot.surfaces.heavyWeek.warning?.label || "steady week"}
            </Text>
          </View>
          <StatusBadge label={widgetStyle.styleName} tone="purple" />
        </View>
      </GlassCard>

      <GlassCard style={styles.customizerCard}>
        <View style={styles.customizerTop}>
          <View>
            <Text style={styles.panelTitle}>Customize</Text>
            <Text style={styles.panelMeta}>
              {sizeLabel(widgetSize)} - {selectedFocus.label}
            </Text>
            <Text style={styles.panelFinePrint}>
              Size and Shows change the in-app preview. Native iOS widgets use Small Next Due and Medium This Week.
            </Text>
          </View>
          <View style={[styles.swatchLarge, { backgroundColor: widgetStyle.accent }]} />
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Size</Text>
          <View style={styles.segmented}>
            {widgetSizes.map((size) => (
              <TouchableOpacity
                key={size}
                accessibilityRole="button"
                accessibilityState={{ selected: widgetSize === size }}
                style={[styles.segment, widgetSize === size ? styles.segmentActive : null]}
                onPress={() => updatePreferences({ size })}
              >
                <Text style={[styles.segmentText, widgetSize === size ? styles.segmentTextActive : null]}>
                  {sizeLabel(size)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Shows</Text>
          <View style={styles.chipRow}>
            {widgetFocusOptions.map((focus) => (
              <TouchableOpacity
                key={focus.id}
                accessibilityRole="button"
                accessibilityState={{ selected: widgetFocus === focus.id }}
                activeOpacity={0.82}
                style={[styles.textChip, widgetFocus === focus.id ? styles.textChipActive : null]}
                onPress={() => updatePreferences({ focus: focus.id })}
              >
                <Text style={[styles.chipText, widgetFocus === focus.id ? styles.chipTextActive : null]}>
                  {focus.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Style</Text>
          <View style={styles.chipRow}>
            {widgetStylePresets.map((style) => (
              <TouchableOpacity
                key={style.id}
                accessibilityRole="button"
                accessibilityState={{ selected: widgetStyleId === style.id }}
                activeOpacity={0.82}
                style={[styles.textChip, widgetStyleId === style.id ? styles.textChipActive : null]}
                onPress={() => updatePreferences({ styleId: style.id })}
              >
                <Text style={[styles.chipText, widgetStyleId === style.id ? styles.chipTextActive : null]}>
                  {style.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Color</Text>
          <View style={styles.paletteDotRow}>
            {palettes.map((palette) => (
              <TouchableOpacity
                key={palette.id}
                accessibilityRole="button"
                accessibilityLabel={palette.name}
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

      <View style={styles.livePreviewStage}>
        <View pointerEvents="none" style={styles.stageBandTop} />
        <View pointerEvents="none" style={styles.stageBandBottom} />
        <View style={styles.livePreviewHeader}>
          <View style={styles.livePreviewCopy}>
            <Text style={styles.liveKicker}>Live preview</Text>
            <Text style={styles.liveTitle}>
              {selectedFocus.label} - {sizeLabel(widgetSize)}
            </Text>
            <Text style={styles.liveMeta}>{selectedFocus.description}</Text>
          </View>
          <View style={styles.statStack}>
            <Text style={styles.statValue}>{selectedStats.value}</Text>
            <Text style={styles.statLabel}>{selectedStats.label}</Text>
          </View>
        </View>
        <View style={styles.previewMetaRow}>
          <StatusBadge label={widgetStyle.styleName} tone="purple" />
          <StatusBadge label={theme.palette.name} tone="blue" />
        </View>
        <SelectedWidgetPreview
          focus={widgetFocus}
          size={widgetSize}
          snapshot={snapshot}
          widgetStyle={widgetStyle}
        />
      </View>

      <View style={styles.widgetStage}>
        <View pointerEvents="none" style={styles.stageBandTop} />
        <View pointerEvents="none" style={styles.stageBandBottom} />
        <View style={styles.galleryHeader}>
          <Text style={styles.galleryKicker}>Widget previews</Text>
          <Text style={styles.galleryTitle}>Small, medium, and lock widgets use your latest deadlines.</Text>
        </View>
        <View style={styles.widgetPair}>
          <WidgetPreviewSmall snapshot={snapshot} widgetStyle={widgetStyle} />
          <WidgetPreviewMedium snapshot={snapshot} widgetStyle={widgetStyle} />
        </View>
        <WidgetPreviewMonthly snapshot={snapshot} widgetStyle={widgetStyle} />
        <View style={styles.widgetPair}>
          <WidgetPreviewHeavyWeek snapshot={snapshot} widgetStyle={widgetStyle} />
          <WidgetPreviewCourseFocus snapshot={snapshot} widgetStyle={widgetStyle} />
        </View>
        <LockWidgetPreview snapshot={snapshot} widgetStyle={widgetStyle} />
      </View>

      {!captureMode ? (
        <GlassCard>
          <Text style={styles.plusTitle}>Study Planner Plus</Text>
          <Text style={styles.plusCopy}>
            Plus unlocks syllabus scan, calendar sync, reminders, and grade forecasting. Product IDs
            and purchase handling remain managed by the existing subscription service.
          </Text>
          <AppButton label="View Plus Plans" icon={Crown} onPress={() => setShowPlans(true)} />
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

  if (size === "lock" || focus === "lockScreen") {
    return (
      <View style={styles.selectedLockFrame}>
        <LockWidgetPreview snapshot={snapshot} widgetStyle={widgetStyle} />
      </View>
    );
  }

  if (focus === "nextDue") {
    return (
      <View style={size === "small" ? styles.selectedSmallFrame : styles.selectedMediumFrame}>
        <WidgetPreviewSmall snapshot={snapshot} widgetStyle={widgetStyle} />
      </View>
    );
  }

  if (focus === "thisWeek") {
    return (
      <View style={size === "small" ? styles.selectedSmallFrame : styles.selectedMediumFrame}>
        <WidgetPreviewMedium snapshot={snapshot} widgetStyle={widgetStyle} />
      </View>
    );
  }

  if (focus === "heavyWeek") {
    return (
      <View style={size === "small" ? styles.selectedSmallFrame : styles.selectedMediumFrame}>
        <WidgetPreviewHeavyWeek snapshot={snapshot} widgetStyle={widgetStyle} />
      </View>
    );
  }

  if (focus === "courseFocus") {
    return (
      <View style={size === "small" ? styles.selectedSmallFrame : styles.selectedMediumFrame}>
        <WidgetPreviewCourseFocus snapshot={snapshot} widgetStyle={widgetStyle} />
      </View>
    );
  }

  return (
    <View style={size === "small" ? styles.selectedSmallFrame : styles.selectedMediumFrame}>
      <WidgetPreviewMonthly snapshot={snapshot} widgetStyle={widgetStyle} />
    </View>
  );
}

function getSelectedWidgetStats(snapshot: WidgetSnapshot, focus: WidgetFocusPreference) {
  if (focus === "monthly") {
    return {
      value: String(snapshot.surfaces.monthly.dueThisMonth),
      label: "Due this month"
    };
  }

  if (focus === "heavyWeek") {
    return {
      value: String(snapshot.heavyWeekWarning?.itemCount || snapshot.surfaces.heavyWeek.warning?.itemCount || 0),
      label: "Deadlines this week"
    };
  }

  if (focus === "courseFocus") {
    return {
      value: String(snapshot.insights?.courseBalance[0]?.openCount || 0),
      label: snapshot.insights?.courseBalance[0]?.courseName || "Busiest class"
    };
  }

  if (focus === "lockScreen" || focus === "nextDue") {
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
  if (value === "lock") return "Lock Screen";
  return value === "small" ? "Small" : "Medium";
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
    paletteChip: {
      minHeight: 34,
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
      minHeight: 34,
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
      fontSize: 12,
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
      width: 34,
      height: 34,
      borderRadius: 17,
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
