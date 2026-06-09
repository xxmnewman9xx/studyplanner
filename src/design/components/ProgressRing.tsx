import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { schoolColors } from "../tokens";

type ProgressRingProps = {
  value: number;
  size?: number;
  accentColor?: string;
  label?: string;
};

export function ProgressRing({ value, size = 74, accentColor = schoolColors.info, label }: ProgressRingProps) {
  const stroke = Math.max(6, Math.round(size * 0.095));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeValue = Math.max(0, Math.min(100, value));
  const dashOffset = circumference - (circumference * safeValue) / 100;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={schoolColors.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={accentColor}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color: accentColor }]}>{Math.round(safeValue)}%</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center"
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  value: {
    fontSize: 15,
    fontWeight: "900"
  },
  label: {
    color: schoolColors.textMuted,
    fontSize: 9,
    fontWeight: "900",
    marginTop: -1
  }
});
