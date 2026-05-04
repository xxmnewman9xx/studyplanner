import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type SectionHeaderProps = {
  title: string;
  note?: string;
};

export function SectionHeader({ title, note }: SectionHeaderProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, spacing, typography } = theme;

  return StyleSheet.create({
    header: {
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
      gap: 3
    },
    title: {
      ...typography.h2
    },
    note: {
      ...typography.small,
      color: colors.faint
    }
  });
}
