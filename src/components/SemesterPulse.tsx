import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { SPBoardColors } from "./StudyPlannerAppleBoard";

type SemesterPulseProps = {
  label: string;
  value: string;
  detail?: string;
  bars: number[];
  accentColor?: string;
  quiet?: boolean;
};

export function SemesterPulse({
  label,
  value,
  detail,
  bars,
  accentColor = SPBoardColors.blue,
  quiet
}: SemesterPulseProps) {
  const safeBars = normalizeBars(bars);
  return (
    <View style={[styles.shell, quiet ? styles.shellQuiet : null]}>
      <View style={styles.copyRow}>
        <View style={styles.copyBlock}>
          <Text style={[styles.label, quiet ? styles.labelQuiet : null]} numberOfLines={1}>{label}</Text>
          <Text style={[styles.value, quiet ? styles.valueQuiet : null]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.74}>{value}</Text>
        </View>
        {detail ? <Text style={[styles.detail, quiet ? styles.detailQuiet : null]} numberOfLines={2}>{detail}</Text> : null}
      </View>
      <View style={styles.rail}>
        {safeBars.map((height, index) => {
          const active = height >= 0.72 || index === peakIndex(safeBars);
          return (
            <View key={`${index}-${height}`} style={styles.barSlot}>
              <View
                style={[
                  styles.bar,
                  {
                    height: 10 + height * 28,
                    backgroundColor: active ? accentColor : withAlpha(accentColor, 0.32)
                  }
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function pulseBarsFromScores(scores: number[]) {
  if (scores.length === 0) return [0.18, 0.24, 0.2, 0.26, 0.22, 0.18, 0.16];
  const max = Math.max(1, ...scores);
  return scores.slice(0, 7).map((score) => Math.max(0.12, Math.min(1, score / max)));
}

function normalizeBars(bars: number[]) {
  const filled = bars.length >= 7 ? bars.slice(0, 7) : [...bars, ...Array.from({ length: 7 - bars.length }, () => 0.16)];
  return filled.map((bar) => Math.max(0.1, Math.min(1, Number.isFinite(bar) ? bar : 0.16)));
}

function peakIndex(values: number[]) {
  return values.reduce((peak, value, index) => value > (values[peak] ?? 0) ? index : peak, 0);
}

function withAlpha(color: string, alpha: number) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return `rgba(20,118,255,${alpha})`;
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

const styles = StyleSheet.create({
  shell: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.24)",
    padding: 11,
    gap: 10
  },
  shellQuiet: {
    backgroundColor: "rgba(5,5,5,0.04)",
    borderColor: "rgba(5,5,5,0.06)"
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  copyBlock: {
    flex: 1,
    minWidth: 0
  },
  label: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  labelQuiet: {
    color: SPBoardColors.faint
  },
  value: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "900"
  },
  valueQuiet: {
    color: SPBoardColors.text
  },
  detail: {
    flex: 1,
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800",
    textAlign: "right"
  },
  detailQuiet: {
    color: SPBoardColors.muted
  },
  rail: {
    height: 42,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5
  },
  barSlot: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end"
  },
  bar: {
    width: "100%",
    maxWidth: 14,
    borderRadius: 7
  }
});
