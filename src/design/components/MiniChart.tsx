import React from "react";
import { StyleSheet, View } from "react-native";

import { schoolColors } from "../tokens";

type MiniChartProps = {
  values?: number[];
  accentColor?: string;
  height?: number;
};

export function MiniChart({ values = [32, 48, 40, 68, 56, 74], accentColor = schoolColors.info, height = 48 }: MiniChartProps) {
  const max = Math.max(1, ...values);
  return (
    <View style={[styles.chart, { height }]}>
      {values.map((value, index) => (
        <View
          key={`${value}-${index}`}
          style={[
            styles.bar,
            {
              height: Math.max(8, (value / max) * height),
              backgroundColor: accentColor,
              opacity: 0.42 + (index / Math.max(1, values.length - 1)) * 0.5
            }
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    width: 96,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6
  },
  bar: {
    flex: 1,
    borderRadius: 999
  }
});
