import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
  tone?: "plain" | "green" | "gold" | "blue";
};

export function MetricCard({ label, value, detail, tone = "plain" }: MetricCardProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.card, styles[tone]]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    card: {
      flex: 1,
      minHeight: 104,
      borderRadius: radii.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface
    },
    plain: {},
    green: {
      backgroundColor: colors.surfaceAlt
    },
    gold: {
      backgroundColor: colors.softGold
    },
    blue: {
      backgroundColor: theme.isDark ? "#162033" : "#EAF0FF"
    },
    label: {
      ...typography.small,
      fontWeight: "800",
      color: colors.faint
    },
    value: {
      marginTop: spacing.xs,
      color: colors.ink,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "900"
    },
    detail: {
      marginTop: spacing.xs,
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17
    }
  });
}
