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
  const badgeStyles = {
    neutral: styles.neutralBadge,
    gold: styles.goldBadge,
    green: styles.greenBadge,
    red: styles.redBadge,
    blue: styles.blueBadge
  };
  const labelStyles = {
    neutral: styles.neutralLabel,
    gold: styles.goldLabel,
    green: styles.greenLabel,
    red: styles.redLabel,
    blue: styles.blueLabel
  };

  return (
    <View style={[styles.badge, badgeStyles[tone]]}>
      <Text style={[styles.label, labelStyles[tone]]}>{label}</Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    badge: {
      minHeight: 28,
      borderRadius: radii.round,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1
    },
    neutralBadge: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.line
    },
    goldBadge: {
      backgroundColor: colors.softGold,
      borderColor: theme.isDark ? "#5B4618" : "#F0D891"
    },
    greenBadge: {
      backgroundColor: colors.mint,
      borderColor: theme.isDark ? "#1D5A3D" : "#BFEBD4"
    },
    redBadge: {
      backgroundColor: theme.isDark ? "#3A201D" : "#FFE0D8",
      borderColor: theme.isDark ? "#6B322A" : "#F3B7A9"
    },
    blueBadge: {
      backgroundColor: theme.isDark ? "#1B2844" : "#E3ECFF",
      borderColor: theme.isDark ? "#35517F" : "#C8D7FF"
    },
    neutralLabel: {
      color: colors.muted
    },
    goldLabel: {
      color: theme.isDark ? colors.gold : "#6F4A00"
    },
    greenLabel: {
      color: theme.isDark ? colors.green : "#176646"
    },
    redLabel: {
      color: theme.isDark ? colors.red : "#9F2D24"
    },
    blueLabel: {
      color: theme.isDark ? colors.blue : "#2146B2"
    },
    label: {
      fontSize: 12,
      fontWeight: "900"
    }
  });
}
