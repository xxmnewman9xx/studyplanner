import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
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
    variant === "primary"
      ? theme.isDark ? "#050505" : "#FFFFFF"
      : colors.ink;
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
      borderRadius: 16,
      paddingHorizontal: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: spacing.xs,
      overflow: "hidden"
    },
    primary: {
      backgroundColor: theme.isDark ? "#F8FAFC" : "#050505",
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.72)" : "rgba(5,5,5,0.92)",
      shadowColor: "#000000",
      shadowOpacity: theme.isDark ? 0.18 : 0.10,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2
    },
    secondary: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(5,5,5,0.09)",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.07)" : "#FFFFFF",
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
