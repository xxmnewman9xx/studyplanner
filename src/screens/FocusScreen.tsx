import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { AppButton, AppHeader, AppSurface, SP } from "../components/PrototypeUI";
import { Assignment, Course, FocusSession, StudyNote } from "../models";
import type { StudentLifeContext } from "../logic/studentLifeDepth";
import { useI18n } from "../i18n";

type FocusScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  defaultMinutes: number;
  sessions: FocusSession[];
  studentLife?: StudentLifeContext;
  focusAccent?: string;
  preferredAssignmentId?: string | null;
  onRecordSession: (session: FocusSession) => void;
  onMarkComplete: (assignmentId: string) => void;
  onAddNote: (note: Omit<StudyNote, "id" | "createdAt" | "updatedAt">) => void;
};

export function FocusScreen({ assignments, courses, defaultMinutes, preferredAssignmentId, focusAccent = SP.blue }: FocusScreenProps) {
  const { t } = useI18n();
  const assignment = assignments.find((item) => item.id === preferredAssignmentId) || assignments.find((item) => item.status !== "done");
  const course = courses.find((item) => item.id === assignment?.courseId);
  const minutes = Math.max(defaultMinutes || 45, 45);
  return (
    <AppSurface style={styles.screen}>
      <AppHeader eyebrow={t("focus.stage_kicker", "Focus session")} title="" />
      <View style={styles.center}>
        <View style={styles.ringWrap}>
          <Svg width={260} height={260} viewBox="0 0 260 260" style={styles.ring}>
            <Circle cx={130} cy={130} r={116} stroke={focusAccent} strokeOpacity={0.12} strokeWidth={18} fill="none" />
            <Circle
              cx={130}
              cy={130}
              r={116}
              stroke={focusAccent}
              strokeWidth={18}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 116} ${2 * Math.PI * 116}`}
              strokeDashoffset={255}
              fill="none"
            />
          </Svg>
          <View style={styles.timeCenter}>
            <Text style={styles.time}>{Math.max(9, minutes - 21)}:18</Text>
            <Text style={styles.timeSub}>of {minutes}:00</Text>
          </View>
        </View>
        <View style={styles.now}>
          <Text style={styles.kicker}>Now working on</Text>
          <Text style={styles.title}>{assignment?.title || "Midterm 1 — review topics"}</Text>
          <Text style={styles.sub}>{course?.code || "CS 188"} · 3 left</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <AppButton label="Pause" variant="blue" style={{ height: 64 }} />
        <Text style={styles.end}>End session</Text>
      </View>
    </AppSurface>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 32, alignItems: "center", justifyContent: "space-between", paddingBottom: 44 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  ringWrap: { width: 260, height: 260 },
  ring: { transform: [{ rotate: "-90deg" }] },
  timeCenter: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" },
  time: { color: SP.ink, fontSize: 64, fontWeight: "900", letterSpacing: -1.5 },
  timeSub: { color: SP.sub, fontSize: 15, fontWeight: "700" },
  now: { marginTop: 24, alignItems: "center" },
  kicker: { color: SP.sub, fontSize: 13, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase" },
  title: { color: SP.ink, fontSize: 22, fontWeight: "900", marginTop: 6, textAlign: "center" },
  sub: { color: SP.sub, fontSize: 15, fontWeight: "700", marginTop: 2 },
  actions: { width: "100%", gap: 12 },
  end: { color: SP.sub, fontSize: 15, fontWeight: "800", textAlign: "center", paddingVertical: 6 }
});
