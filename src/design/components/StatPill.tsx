import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { schoolColors, schoolRadius, schoolSpacing } from "../tokens";

type StatPillProps = {
  label: string;
  value: string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function StatPill({ label, value, accentColor = schoolColors.info, style }: StatPillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: `${accentColor}12`, borderColor: `${accentColor}35` }, style]}>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 38,
    borderRadius: schoolRadius.pill,
    borderWidth: 1,
    paddingHorizontal: schoolSpacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  value: {
    fontSize: 13,
    fontWeight: "900"
  },
  label: {
    color: schoolColors.textMuted,
    fontSize: 12,
    fontWeight: "800"
  }
});
