import React from "react";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

const buttonTextScale = 1.25;

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "quiet";
  disabled?: boolean;
  icon?: React.ComponentType<{ color: string; size: number }>;
  style?: ViewStyle;
  accessibilityHint?: string;
};

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  icon: Icon,
  style,
  accessibilityHint
}: AppButtonProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const { colors } = theme;
  const foreground = disabled
    ? colors.muted
    : variant === "primary"
      ? colors.heroText
      : variant === "secondary"
        ? colors.ink
        : colors.muted;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      activeOpacity={0.78}
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
      {Icon ? <Icon color={foreground} size={18} /> : null}
      <Text maxFontSizeMultiplier={buttonTextScale} numberOfLines={2} style={[styles.label, { color: foreground }]}>
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
      borderRadius: radii.round,
      paddingHorizontal: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: spacing.xs
    },
    primary: {
      backgroundColor: colors.brandPurple,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.35 : 0.2,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5
    },
    secondary: {
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface
    },
    quiet: {
      backgroundColor: "transparent"
    },
    disabled: {
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      shadowOpacity: 0,
      elevation: 0
    },
    label: {
      fontSize: 14,
      fontWeight: "900"
    }
  });
}
