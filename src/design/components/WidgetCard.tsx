import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { schoolColors, schoolRadius, schoolSpacing, schoolTypography } from "../tokens";

type WidgetCardProps = {
  label: string;
  value: string;
  detail?: string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function WidgetCard({ label, value, detail, accentColor = schoolColors.blue, style }: WidgetCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.dot, { backgroundColor: accentColor }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 108,
    flex: 1,
    minWidth: "47%",
    backgroundColor: schoolColors.surface,
    borderWidth: 1,
    borderColor: schoolColors.line,
    borderRadius: schoolRadius.lg,
    padding: schoolSpacing.sm
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginBottom: "auto"
  },
  label: {
    ...schoolTypography.caption,
    color: schoolColors.textMuted,
    marginTop: schoolSpacing.md
  },
  value: {
    ...schoolTypography.metric,
    color: schoolColors.text,
    marginTop: schoolSpacing.xxs
  },
  detail: {
    ...schoolTypography.caption,
    color: schoolColors.textMuted,
    marginTop: schoolSpacing.xxs
  }
});
