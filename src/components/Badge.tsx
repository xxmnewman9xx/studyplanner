import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type BadgeProps = {
  label: string;
  tone?: "neutral" | "gold" | "green" | "red" | "blue";
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    badge: {
      minHeight: 28,
      borderRadius: radii.sm,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center"
    },
    neutral: {
      backgroundColor: colors.surfaceAlt
    },
    gold: {
      backgroundColor: colors.softGold
    },
    green: {
      backgroundColor: colors.mint
    },
    red: {
      backgroundColor: theme.isDark ? "#3A201D" : "#F3D7CF"
    },
    blue: {
      backgroundColor: theme.isDark ? "#1B2844" : "#DBE5FB"
    },
    label: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: "800"
    }
  });
}
