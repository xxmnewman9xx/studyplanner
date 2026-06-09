import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { schoolColors, schoolRadius } from "../tokens";

type ClassBadgeProps = {
  title: string;
  accentColor?: string;
  room?: string;
};

export function ClassBadge({ title, accentColor = schoolColors.info, room }: ClassBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: `${accentColor}12`, borderColor: `${accentColor}30` }]}>
      <View style={[styles.dot, { backgroundColor: accentColor }]} />
      <Text numberOfLines={1} style={styles.title}>{title}</Text>
      {room ? <Text numberOfLines={1} style={[styles.room, { color: accentColor }]}>{room}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 34,
    borderRadius: schoolRadius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  title: {
    flexShrink: 1,
    color: schoolColors.text,
    fontSize: 12,
    fontWeight: "900"
  },
  room: {
    fontSize: 11,
    fontWeight: "900"
  }
});
