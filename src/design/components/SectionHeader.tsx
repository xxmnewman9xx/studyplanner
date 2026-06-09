import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { schoolColors, schoolSpacing, schoolTypography } from "../tokens";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title.toUpperCase()}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity accessibilityLabel={actionLabel} onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: schoolSpacing.sm,
    marginTop: schoolSpacing.lg,
    marginBottom: schoolSpacing.xs
  },
  title: {
    ...schoolTypography.eyebrow,
    color: schoolColors.textFaint
  },
  action: {
    minHeight: 34,
    justifyContent: "center"
  },
  actionText: {
    color: schoolColors.text,
    fontSize: 13,
    fontWeight: "900"
  }
});
