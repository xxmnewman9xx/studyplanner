import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Moon, Sun } from "lucide-react-native";
import { useAppTheme } from "../themeContext";

export function ModeToggle() {
  const { mode, theme, toggleMode } = useAppTheme();
  const { colors, radii, spacing } = theme;
  const Icon = mode === "dark" ? Sun : Moon;

  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityState={{ checked: mode === "dark" }}
      accessibilityLabel="Toggle dark mode"
      style={[
        styles.toggle,
        {
          backgroundColor: colors.elevated,
          borderColor: colors.line,
          borderRadius: radii.md,
          paddingHorizontal: spacing.sm
        }
      ]}
      onPress={toggleMode}
    >
      <Icon color={colors.accent} size={16} />
      <Text style={[styles.label, { color: colors.ink }]}>
        {mode === "dark" ? "Light" : "Dark"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    minHeight: 44,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  label: {
    fontSize: 12,
    fontWeight: "900"
  }
});
