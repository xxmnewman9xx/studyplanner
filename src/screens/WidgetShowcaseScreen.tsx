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
  AppTheme,
  createWidgetStyleSnapshot,
  ThemePaletteId,
  WidgetStylePresetId,
  widgetStylePresets
} from "../theme";
import { useAppTheme } from "../themeContext";
import { UpgradeScreen } from "./UpgradeScreen";

type WidgetShowcaseScreenProps = {
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
};

type WidgetSizeId = "small" | "medium" | "lock";
type WidgetFocusId = "nextDue" | "thisWeek" | "monthly" | "heavyWeek" | "courseFocus" | "lockScreen";

const widgetSizes: WidgetSizeId[] = ["small", "medium", "lock"];
const widgetFocusOptions: Array<{
  id: WidgetFocusId;
  label: string;
  description: string;
}> = [
  { id: "nextDue", label: "Next Due", description: "One urgent assignment with countdown context." },
  { id: "thisWeek", label: "This Week", description: "A medium widget for the next several deadlines." },
  { id: "monthly", label: "Monthly", description: "A compact month grid with heavy days and exam signals." },
  { id: "heavyWeek", label: "Heavy Week", description: "Daily load bars and the current workload warning." },
  { id: "courseFocus", label: "Course Focus", description: "Course balance from the same graph insight data." },
  { id: "lockScreen", label: "Lock Screen", description: "A glanceable countdown for the lock screen." }
];

export function WidgetShowcaseScreen({ semester, courses, assignments }: WidgetShowcaseScreenProps) {
  const { theme, paletteId, palettes, setPalette } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const captureMode = isStoreCaptureEnabled();
  const [showPlans, setShowPlans] = useState(false);
  const [widgetStyleId, setWidgetStyleId] = useState<WidgetStylePresetId>("darkGlass");
  const [widgetSize, setWidgetSize] = useState<WidgetSizeId>("medium");
  const [widgetFocus, setWidgetFocus] = useState<WidgetFocusId>("monthly");
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

  if (showPlans && !captureMode) {
    return <UpgradeScreen onContinueFree={() => setShowPlans(false)} />;
  }

  return (
    <PremiumScreen>
      <PremiumHeader
        eyebrow="Widget Studio"
        title="Stay in the loop"
        subtitle="Customize calendar, workload, course, and countdown widgets from real snapshot data."
      />

      <GlassCard tint="hero" style={styles.heroCard}>
        <View pointerEvents="none" style={styles.heroBand} />
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Sparkles color={colors.heroText} size={20} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Widget command center</Text>
            <Text style={styles.heroMeta}>
              {snapshot.surfaces.monthly.monthLabel} - {snapshot.surfaces.monthly.dueThisMonth} due - {snapshot.surfaces.heavyWeek.warning?.label || "balanced week"}
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
              {widgetSize} - {labelize(widgetFocus)}
            </Text>
          </View>
          <View style={[styles.swatchLarge, { backgroundColor: widgetStyle.accent }]} />
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Palette</Text>
          <View style={styles.chipRow}>
            {palettes.map((palette) => (
              <TouchableOpacity
                key={palette.id}
                accessibilityRole="button"
                accessibilityState={{ selected: paletteId === palette.id }}
                activeOpacity={0.82}
                style={[
                  styles.paletteChip,
                  paletteId === palette.id ? styles.paletteChipActive : null
                ]}
                onPress={() => setPalette(palette.id as ThemePaletteId)}
              >
                <View style={[styles.swatch, { backgroundColor: palette.accent }]} />
                <Text style={[styles.chipText, paletteId === palette.id ? styles.paletteChipTextActive : null]}>
                  {palette.shortName}
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
                onPress={() => setWidgetStyleId(style.id)}
              >
                <Text style={[styles.chipText, widgetStyleId === style.id ? styles.chipTextActive : null]}>
                  {style.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Focus</Text>
          <View style={styles.chipRow}>
            {widgetFocusOptions.map((focus) => (
              <TouchableOpacity
                key={focus.id}
                accessibilityRole="button"
                accessibilityState={{ selected: widgetFocus === focus.id }}
                activeOpacity={0.82}
                style={[styles.textChip, widgetFocus === focus.id ? styles.textChipActive : null]}
                onPress={() => setWidgetFocus(focus.id)}
              >
                <Text style={[styles.chipText, widgetFocus === focus.id ? styles.chipTextActive : null]}>
                  {focus.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.segmented}>
          {widgetSizes.map((size) => (
            <TouchableOpacity
              key={size}
              accessibilityRole="button"
              accessibilityState={{ selected: widgetSize === size }}
              style={[styles.segment, widgetSize === size ? styles.segmentActive : null]}
              onPress={() => setWidgetSize(size)}
            >
              <Text style={[styles.segmentText, widgetSize === size ? styles.segmentTextActive : null]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>

      <View style={styles.livePreviewStage}>
        <View pointerEvents="none" style={styles.stageBandTop} />
        <View pointerEvents="none" style={styles.stageBandBottom} />
        <View style={styles.livePreviewHeader}>
          <View style={styles.livePreviewCopy}>
            <Text style={styles.liveKicker}>Live configuration</Text>
            <Text style={styles.liveTitle}>
              {selectedFocus.label} - {labelize(widgetSize)}
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
          <Text style={styles.galleryKicker}>Widget Library</Text>
          <Text style={styles.galleryTitle}>Every surface uses the same semester snapshot.</Text>
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
  focus: WidgetFocusId;
  size: WidgetSizeId;
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

function getSelectedWidgetStats(snapshot: WidgetSnapshot, focus: WidgetFocusId) {
  if (focus === "monthly") {
    return {
      value: String(snapshot.surfaces.monthly.dueThisMonth),
      label: "Due this month"
    };
  }

  if (focus === "heavyWeek") {
    return {
      value: String(snapshot.heavyWeekWarning?.itemCount || snapshot.surfaces.heavyWeek.warning?.itemCount || 0),
      label: "Week load"
    };
  }

  if (focus === "courseFocus") {
    return {
      value: String(snapshot.insights?.courseBalance[0]?.openCount || 0),
      label: snapshot.insights?.courseBalance[0]?.courseName || "Top course"
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

function labelize(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    heroCard: {
      overflow: "hidden",
      backgroundColor: colors.heroSurface,
      borderColor: "rgba(255,255,255,0.16)"
    },
    heroBand: {
      position: "absolute",
      top: -36,
      right: -42,
      width: 210,
      height: 92,
      borderRadius: 34,
      backgroundColor: "rgba(59,130,246,0.30)",
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
      color: colors.heroText,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "900"
    },
    heroMeta: {
      color: colors.heroMuted,
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
      borderColor: "rgba(255,255,255,0.48)"
    },
    segmented: {
      minHeight: 42,
      borderRadius: radii.round,
      backgroundColor: colors.canvas,
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
      backgroundColor: colors.heroSurface,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)"
    },
    livePreviewStage: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 30,
      padding: spacing.md,
      gap: spacing.sm,
      backgroundColor: colors.heroSurface,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      shadowColor: colors.brandPurple,
      shadowOpacity: 0.24,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 16 },
      elevation: 7
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
      color: colors.widgetAccent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    liveTitle: {
      color: colors.heroText,
      fontSize: 19,
      lineHeight: 24,
      fontWeight: "900"
    },
    liveMeta: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    statStack: {
      minWidth: 82,
      borderRadius: 18,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: "rgba(255,255,255,0.13)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)"
    },
    statValue: {
      color: colors.heroText,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    statLabel: {
      color: colors.heroMuted,
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
      color: colors.widgetAccent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    galleryTitle: {
      color: colors.heroText,
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
      backgroundColor: "rgba(59,130,246,0.30)",
      transform: [{ rotate: "24deg" }]
    },
    stageBandBottom: {
      position: "absolute",
      bottom: -52,
      left: -48,
      width: 230,
      height: 104,
      borderRadius: 38,
      backgroundColor: "rgba(242,95,107,0.24)",
      transform: [{ rotate: "-18deg" }]
    },
    widgetPair: {
      flexDirection: "row",
      gap: spacing.sm
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
