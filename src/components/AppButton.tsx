import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "quiet";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentType<{ color: string; size: number }>;
  style?: ViewStyle;
};

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon: Icon,
  style
}: AppButtonProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const { colors } = theme;
  const foreground =
    variant === "primary" ? colors.heroText : variant === "secondary" ? colors.ink : colors.ink;
  const inactive = disabled || loading;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      activeOpacity={inactive ? 1 : 0.7}
      disabled={inactive}
      style={[
        styles.button,
        variant === "primary" ? styles.primary : null,
        variant === "secondary" ? styles.secondary : null,
        variant === "quiet" ? styles.quiet : null,
        inactive ? styles.disabled : null,
        style
      ]}
      onPress={onPress}
    >
      {variant === "primary" ? <View pointerEvents="none" style={styles.primarySheen} /> : null}
      {loading ? <ActivityIndicator color={foreground} size="small" /> : Icon ? <Icon color={foreground} size={18} /> : null}
      <Text style={[styles.label, { color: foreground }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    button: {
      minHeight: 48,
      borderRadius: radii.lg,
      paddingHorizontal: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: spacing.xs,
      overflow: "hidden"
    },
    primary: {
      backgroundColor: colors.accent,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.64)",
      shadowColor: colors.accent,
      shadowOpacity: theme.isDark ? 0.24 : 0.16,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 7 },
      elevation: 4
    },
    primarySheen: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "48%",
      backgroundColor: "rgba(255,255,255,0.18)"
    },
    secondary: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : colors.elevated,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.10 : 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2
    },
    quiet: {
      minHeight: 42,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.075)" : colors.surfaceAlt,
      paddingHorizontal: spacing.sm
    },
    disabled: {
      opacity: 0.56
    },
    label: {
      flexShrink: 1,
      maxWidth: "100%",
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: 0,
      fontWeight: "800",
      textAlign: "center"
    }
  });
}
