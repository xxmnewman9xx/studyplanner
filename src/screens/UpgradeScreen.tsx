import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CalendarSync, Check, Crown, ScanLine } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

const freeFeatures = [
  "1 semester",
  "Limited courses",
  "Manual entry",
  "Basic reminders"
];

const paidFeatures = [
  "Unlimited semesters and courses",
  "Syllabus scan",
  "Advanced reminders",
  "Calendar sync",
  "Grade prediction",
  "Study-plan suggestions"
];

export function UpgradeScreen() {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.kicker}>No ads</Text>
        <Text style={styles.title}>Paid value lives where time is saved.</Text>
        <Text style={styles.subtitle}>
          The free planner stays useful. Automation, syncing, and predictions are the
          upgrade path.
        </Text>
      </View>

      <View style={styles.planCard}>
        <Badge label="Free" tone="green" />
        <Text style={styles.planTitle}>Start organized</Text>
        {freeFeatures.map((feature) => (
          <FeatureRow key={feature} text={feature} />
        ))}
      </View>

      <View style={[styles.planCard, styles.plusCard]}>
        <Badge label="Plus" tone="gold" />
        <Text style={styles.planTitle}>Remove busywork</Text>
        {paidFeatures.map((feature) => (
          <FeatureRow key={feature} text={feature} />
        ))}
        <View style={styles.paidMoments}>
          <View style={styles.moment}>
            <ScanLine color={colors.ink} size={20} />
            <Text style={styles.momentText}>Syllabus scan</Text>
          </View>
          <View style={styles.moment}>
            <CalendarSync color={colors.ink} size={20} />
            <Text style={styles.momentText}>Calendar sync</Text>
          </View>
        </View>
        <AppButton label="Preview Plus" icon={Crown} onPress={() => undefined} />
      </View>
    </View>
  );
}

function FeatureRow({ text }: { text: string }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <View style={styles.featureRow}>
      <Check color={colors.green} size={17} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    header: {
      gap: spacing.xs
    },
    kicker: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900"
    },
    title: {
      ...typography.title
    },
    subtitle: {
      ...typography.body
    },
    planCard: {
      marginTop: spacing.lg,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.sm
    },
    plusCard: {
      backgroundColor: colors.softGold,
      borderColor: colors.gold
    },
    planTitle: {
      color: colors.ink,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "900"
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    featureText: {
      flex: 1,
      color: colors.ink,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: "700"
    },
    paidMoments: {
      flexDirection: "row",
      gap: spacing.sm,
      marginVertical: spacing.xs
    },
    moment: {
      flex: 1,
      minHeight: 74,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      justifyContent: "center",
      gap: spacing.xs
    },
    momentText: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    }
  });
}
