import React from "react";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { Moon, Sun } from "lucide-react-native";
import { useAppTheme } from "../themeContext";
import { ThemeMode } from "../theme";

type ModeToggleProps = {
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

const options: Array<{
  value: ThemeMode;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon }
];

export function ModeToggle({ compact = false, style }: ModeToggleProps) {
  const { mode, theme, setMode } = useAppTheme();
  const { colors, radii, spacing } = theme;

  return (
    <View
      accessibilityLabel="Appearance mode"
      style={[
        styles.container,
        compact ? styles.containerCompact : null,
        {
          backgroundColor: colors.elevated,
          borderColor: colors.line,
          borderRadius: radii.md,
          padding: compact ? 3 : spacing.xs
        },
        style
      ]}
    >
      {compact ? null : <Text style={[styles.heading, { color: colors.muted }]}>Appearance</Text>}
      <View style={styles.segmentRow}>
        {options.map((option) => {
          const active = mode === option.value;
          const Icon = option.icon;
          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Use ${option.label} mode`}
              key={option.value}
              style={[
                styles.segment,
                compact ? styles.segmentCompact : null,
                {
                  borderRadius: radii.sm,
                  backgroundColor: active ? colors.heroSurface : "transparent"
                }
              ]}
              onPress={() => setMode(option.value)}
            >
              <Icon color={active ? colors.heroText : colors.accent} size={compact ? 14 : 16} />
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  compact ? styles.labelCompact : null,
                  { color: active ? colors.heroText : colors.ink }
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    gap: 8
  },
  containerCompact: {
    minWidth: 146
  },
  heading: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  segmentRow: {
    flexDirection: "row",
    gap: 4
  },
  segment: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  segmentCompact: {
    minHeight: 34,
    paddingHorizontal: 8
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900"
  },
  labelCompact: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900"
  }
});
