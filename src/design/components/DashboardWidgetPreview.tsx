import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { MiniChart } from "./MiniChart";
import { schoolColors, schoolRadius, schoolSpacing } from "../tokens";

type DashboardWidgetPreviewProps = {
  label: string;
  value: string;
  detail: string;
  accentColor?: string;
};

export function DashboardWidgetPreview({ label, value, detail, accentColor = schoolColors.info }: DashboardWidgetPreviewProps) {
  return (
    <View style={[styles.card, { borderColor: `${accentColor}35` }]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
      </View>
      <View style={styles.main}>
        <View style={styles.text}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.detail}>{detail}</Text>
        </View>
        <MiniChart accentColor={accentColor} height={34} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: schoolRadius.xl,
    borderWidth: 1,
    backgroundColor: schoolColors.surface,
    padding: schoolSpacing.md,
    marginBottom: schoolSpacing.sm
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  label: {
    color: schoolColors.textMuted,
    fontSize: 12,
    fontWeight: "900"
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5
  },
  main: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12
  },
  text: {
    flex: 1
  },
  value: {
    color: schoolColors.text,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900"
  },
  detail: {
    color: schoolColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 3
  }
});
