import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { schoolColors, schoolRadius, schoolSpacing } from "../tokens";

type ImportStatusCardProps = {
  step: "import" | "extract" | "review" | "apply" | "live";
  title: string;
  detail: string;
  counts?: Array<{ label: string; value: string | number }>;
};

const steps: ImportStatusCardProps["step"][] = ["import", "extract", "review", "apply", "live"];

export function ImportStatusCard({ step, title, detail, counts = [] }: ImportStatusCardProps) {
  const activeIndex = steps.indexOf(step);
  return (
    <View style={styles.card}>
      <View style={styles.rail}>
        {steps.map((item, index) => {
          const active = index <= activeIndex;
          return <View key={item} style={[styles.dot, active ? styles.dotActive : null]} />;
        })}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.detail}>{detail}</Text>
      {counts.length ? (
        <View style={styles.countRow}>
          {counts.map((item) => (
            <View key={item.label} style={styles.count}>
              <Text style={styles.countValue}>{item.value}</Text>
              <Text style={styles.countLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: schoolRadius.xl,
    backgroundColor: schoolColors.infoTint,
    borderWidth: 1,
    borderColor: "#D9E6FF",
    padding: schoolSpacing.md,
    marginBottom: schoolSpacing.sm
  },
  rail: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12
  },
  dot: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(47,107,255,0.18)"
  },
  dotActive: {
    backgroundColor: schoolColors.info
  },
  title: {
    color: schoolColors.text,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900"
  },
  detail: {
    color: schoolColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 5
  },
  countRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12
  },
  count: {
    flex: 1,
    borderRadius: schoolRadius.md,
    backgroundColor: schoolColors.surface,
    padding: 10
  },
  countValue: {
    color: schoolColors.text,
    fontSize: 20,
    fontWeight: "900"
  },
  countLabel: {
    color: schoolColors.textMuted,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2
  }
});
