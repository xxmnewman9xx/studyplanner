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
      <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{label}</Text>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{value}</Text>
      {detail ? <Text style={styles.detail} numberOfLines={2}>{detail}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    card: {
      flex: 1,
      minWidth: 0,
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
