import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { schoolColors, schoolRadius, schoolShadows, schoolSpacing, schoolTypography } from "../tokens";

type HeroCardProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  metric?: string;
  accentColor?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function HeroCard({
  eyebrow,
  title,
  subtitle,
  metric,
  accentColor = schoolColors.blue,
  children,
  style
}: HeroCardProps) {
  return (
    <View style={[styles.card, { borderColor: accentColor }, style]}>
      <View style={styles.header}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: accentColor }]}>{eyebrow}</Text> : null}
        {metric ? <Text style={styles.metric}>{metric}</Text> : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: schoolColors.surface,
    borderWidth: 1.5,
    borderRadius: schoolRadius.hero,
    padding: schoolSpacing.lg,
    ...schoolShadows.raised
  },
  header: {
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: schoolSpacing.sm
  },
  eyebrow: {
    ...schoolTypography.eyebrow
  },
  metric: {
    color: schoolColors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  title: {
    ...schoolTypography.title,
    color: schoolColors.text,
    marginTop: schoolSpacing.sm
  },
  subtitle: {
    ...schoolTypography.body,
    color: schoolColors.textMuted,
    marginTop: schoolSpacing.xs
  },
  body: {
    marginTop: schoolSpacing.md
  }
});
