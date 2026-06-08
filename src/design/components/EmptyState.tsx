import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { schoolColors, schoolRadius, schoolSpacing, schoolTypography } from "../tokens";

type EmptyStateProps = {
  title: string;
  copy?: string;
};

export function EmptyState({ title, copy }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      <Text style={styles.title}>{title}</Text>
      {copy ? <Text style={styles.copy}>{copy}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    borderRadius: schoolRadius.lg,
    backgroundColor: schoolColors.surfaceRaised,
    borderWidth: 1,
    borderColor: schoolColors.line,
    padding: schoolSpacing.md
  },
  title: {
    ...schoolTypography.sectionTitle,
    color: schoolColors.text
  },
  copy: {
    ...schoolTypography.body,
    color: schoolColors.textMuted,
    marginTop: schoolSpacing.xs
  }
});
