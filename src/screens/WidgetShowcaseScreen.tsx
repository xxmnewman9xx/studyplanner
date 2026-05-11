import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Crown, Sparkles } from "lucide-react-native";

import { AppButton } from "../components/AppButton";
import {
  GlassCard,
  PremiumHeader,
  PremiumScreen,
  WidgetPreviewMedium,
  WidgetPreviewSmall,
  LockWidgetPreview
} from "../components/PremiumUI";
import { isStoreCaptureEnabled } from "../config/storeCapture";
import { storeCaptureNow } from "../data/demoSemester";
import { Assignment, Course, Semester } from "../models";
import { WidgetSnapshotService } from "../services/widgetSnapshotService";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { UpgradeScreen } from "./UpgradeScreen";

type WidgetShowcaseScreenProps = {
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
};

export function WidgetShowcaseScreen({ semester, courses, assignments }: WidgetShowcaseScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const captureMode = isStoreCaptureEnabled();
  const [showPlans, setShowPlans] = useState(false);
  const snapshot = WidgetSnapshotService.build(
    {
      semester,
      courses,
      assignments,
      demoState: captureMode ? { enabled: true, label: "Preview" } : undefined
    },
    captureMode ? storeCaptureNow : new Date()
  );

  if (showPlans && !captureMode) {
    return <UpgradeScreen onContinueFree={() => setShowPlans(false)} />;
  }

  return (
    <PremiumScreen>
      <PremiumHeader
        eyebrow="Widget Showcase"
        title="Stay in the loop"
        subtitle="Next Due, This Week, and Lock Screen previews powered by real snapshot data."
      />

      <GlassCard tint="hero">
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Sparkles color={colors.heroText} size={20} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>App Store-ready widgets</Text>
            <Text style={styles.heroMeta}>
              Generated from WidgetSnapshotService so the app and WidgetKit stay aligned.
            </Text>
          </View>
        </View>
      </GlassCard>

      <View style={styles.widgetPair}>
        <WidgetPreviewSmall snapshot={snapshot} />
        <WidgetPreviewMedium snapshot={snapshot} />
      </View>
      <LockWidgetPreview snapshot={snapshot} />

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

function createStyles(theme: AppTheme) {
  const { colors, spacing } = theme;

  return StyleSheet.create({
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
