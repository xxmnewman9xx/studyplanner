import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { schoolColors, schoolRadius } from "../tokens";

type ReminderPillProps = {
  label: string;
  enabled?: boolean;
};

export function ReminderPill({ label, enabled = true }: ReminderPillProps) {
  const color = enabled ? schoolColors.warning : schoolColors.textFaint;
  return (
    <View style={[styles.pill, { backgroundColor: enabled ? schoolColors.warningTint : schoolColors.surfaceRaised }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    minHeight: 32,
    borderRadius: schoolRadius.pill,
    paddingHorizontal: 10,
    justifyContent: "center"
  },
  text: {
    fontSize: 12,
    fontWeight: "900"
  }
});
