import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "quiet";
  disabled?: boolean;
  icon?: React.ComponentType<{ color: string; size: number }>;
  style?: ViewStyle;
};

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  icon: Icon,
  style
}: AppButtonProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const { colors } = theme;
  const foreground =
    variant === "primary" ? colors.heroSurface : variant === "secondary" ? colors.ink : colors.ink;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.72}
      disabled={disabled}
      style={[
        styles.button,
        variant === "primary" ? styles.primary : null,
        variant === "secondary" ? styles.secondary : null,
        variant === "quiet" ? styles.quiet : null,
        disabled ? styles.disabled : null,
        style
      ]}
      onPress={onPress}
    >
      {variant === "primary" ? <View pointerEvents="none" style={styles.primarySheen} /> : null}
      {Icon ? <Icon color={foreground} size={18} /> : null}
      <Text style={[styles.label, { color: foreground }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    button: {
      minHeight: 52,
      borderRadius: radii.xl,
      paddingHorizontal: spacing.lg,
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
      shadowOpacity: theme.isDark ? 0.32 : 0.22,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6
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
      shadowOpacity: theme.isDark ? 0.12 : 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2
    },
    quiet: {
      minHeight: 44,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.075)" : colors.surfaceAlt,
      paddingHorizontal: spacing.sm
    },
    disabled: {
      opacity: 0.56
    },
    label: {
      fontSize: 14,
      letterSpacing: -0.1,
      fontWeight: "900"
    }
  });
}
