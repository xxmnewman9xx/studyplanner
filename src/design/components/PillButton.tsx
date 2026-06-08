import React from "react";
import { StyleSheet, Text, TouchableOpacity, type StyleProp, type ViewStyle } from "react-native";

import { schoolColors, schoolRadius, schoolSpacing } from "../tokens";

type PillButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "tint";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PillButton({ label, onPress, variant = "primary", disabled = false, style }: PillButtonProps) {
  return (
    <TouchableOpacity
      accessibilityLabel={label}
      activeOpacity={0.82}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, styles[variant], disabled ? styles.disabled : null, style]}
    >
      <Text style={[styles.text, variant === "primary" ? styles.primaryText : styles.secondaryText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: schoolRadius.pill,
    paddingHorizontal: schoolSpacing.lg,
    alignItems: "center",
    justifyContent: "center"
  },
  primary: {
    backgroundColor: schoolColors.text
  },
  secondary: {
    backgroundColor: schoolColors.surface,
    borderWidth: 1,
    borderColor: schoolColors.line
  },
  tint: {
    backgroundColor: schoolColors.blueTint,
    borderWidth: 1,
    borderColor: "#D9E6FF"
  },
  disabled: {
    opacity: 0.58
  },
  text: {
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center"
  },
  primaryText: {
    color: schoolColors.white
  },
  secondaryText: {
    color: schoolColors.text
  }
});
