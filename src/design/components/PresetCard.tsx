import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { MiniChart } from "./MiniChart";
import { schoolColors, schoolRadius, schoolSpacing } from "../tokens";

type PresetCardProps = {
  label: string;
  copy: string;
  accentColor?: string;
  active?: boolean;
  onPress: () => void;
};

export function PresetCard({ label, copy, accentColor = schoolColors.info, active = false, onPress }: PresetCardProps) {
  return (
    <TouchableOpacity
      accessibilityLabel={`${label} widget preset`}
      style={[styles.card, active ? { borderColor: accentColor, backgroundColor: `${accentColor}12` } : null]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.copy}>{copy}</Text>
      <MiniChart accentColor={accentColor} height={26} values={label === "Minimalist" ? [12, 16, 18] : undefined} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    minHeight: 138,
    borderRadius: schoolRadius.lg,
    backgroundColor: schoolColors.surface,
    borderWidth: 1,
    borderColor: schoolColors.line,
    padding: schoolSpacing.sm,
    gap: 7
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6
  },
  label: {
    color: schoolColors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  copy: {
    color: schoolColors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700"
  }
});
