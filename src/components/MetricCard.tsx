import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
  tone?: "plain" | "green" | "gold" | "blue" | "red";
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
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.18 : 0.07,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3
    },
    plain: {},
    green: {
      backgroundColor: colors.mint,
      borderColor: theme.isDark ? "#1D5A3D" : "#C9ECD9"
    },
    gold: {
      backgroundColor: colors.softGold,
      borderColor: theme.isDark ? "#584518" : "#F0DA99"
    },
    blue: {
      backgroundColor: theme.isDark ? "#162033" : "#EAF0FF",
      borderColor: theme.isDark ? "#2C4A7C" : "#C8D7FF"
    },
    red: {
      backgroundColor: theme.isDark ? "#3A201D" : "#FFE0D8",
      borderColor: theme.isDark ? "#6B322A" : "#F3B7A9"
    },
    label: {
      ...typography.small,
      fontWeight: "800",
      color: colors.faint
    },
    value: {
      marginTop: spacing.xs,
      color: colors.ink,
      fontSize: 26,
      lineHeight: 31,
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
