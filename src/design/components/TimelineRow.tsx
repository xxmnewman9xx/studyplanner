import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { schoolColors, schoolRadius, schoolSpacing, schoolTypography } from "../tokens";

type TimelineRowProps = {
  time?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function TimelineRow({
  time,
  title,
  subtitle,
  meta,
  accentColor = schoolColors.blue,
  style
}: TimelineRowProps) {
  return (
    <View style={[styles.row, style]}>
      {time ? <Text style={styles.time}>{time}</Text> : null}
      <View style={[styles.rail, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    borderRadius: schoolRadius.lg,
    backgroundColor: schoolColors.surface,
    borderWidth: 1,
    borderColor: schoolColors.line,
    padding: schoolSpacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: schoolSpacing.sm,
    marginBottom: schoolSpacing.xs
  },
  time: {
    width: 64,
    color: schoolColors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  rail: {
    width: 4,
    height: 38,
    borderRadius: 2
  },
  content: {
    flex: 1,
    minWidth: 0
  },
  title: {
    ...schoolTypography.body,
    color: schoolColors.text,
    fontWeight: "900"
  },
  subtitle: {
    ...schoolTypography.caption,
    color: schoolColors.textMuted,
    marginTop: 2
  },
  meta: {
    overflow: "hidden",
    borderRadius: schoolRadius.pill,
    backgroundColor: schoolColors.surfaceRaised,
    color: schoolColors.textMuted,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: "900"
  }
});
