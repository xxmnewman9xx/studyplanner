import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";

import { SP } from "../components/PrototypeUI";
import { Assignment, Course, FocusSession, Semester, UserSettings } from "../models";
import { useI18n } from "../i18n";
import type { StudentLifeContext } from "../logic/studentLifeDepth";

type PlanScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  semester: Semester;
  sessions: FocusSession[];
  settings?: UserSettings;
  studentLife?: StudentLifeContext;
  onOpenAssignment: (assignmentId: string) => void;
  onOpenFocus: (assignmentId?: string) => void;
  onUpdateStatus: (assignmentId: string, status: "not_started" | "in_progress" | "done") => void;
  onRecordSession: (session: FocusSession) => void;
  onAddQuickAssignment: (courseId: string, title: string, dueDate: string, kind: "assignment") => boolean;
  onOpenScan: () => void;
};

export function PlanScreen({ assignments, courses }: PlanScreenProps) {
  const { t } = useI18n();
  const scheduleCourses = [
    courses[0] || fallbackCourses[0],
    courses[1] || fallbackCourses[1],
    courses[2] || fallbackCourses[2],
    courses[3] || fallbackCourses[3]
  ];
  const load = assignments.filter((item) => item.status !== "done" && item.status !== "archived").length;
  const riskLevel = heat(load);

  return (
    <View style={styles.surface}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.appBar}>
          <Text style={styles.title}>{t("plan.capture_title", "Calendar")}</Text>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.78}>
            <Plus size={22} color={SP.ink} />
          </TouchableOpacity>
        </View>

        <View style={styles.riskCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.riskLabel}>Risk week</Text>
            <Text style={styles.riskValue}>{riskLevel}</Text>
          </View>
          <View style={styles.heatRow}>
            {[0, 1, 2, 3, 4].map((index) => (
              <View key={index} style={[styles.heatCell, { backgroundColor: heat(load + index) }]} />
            ))}
          </View>
        </View>

        <View style={styles.focusCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.greenLabel}>NEXT OPEN BLOCK</Text>
            <View style={styles.greenPill}><Text style={styles.greenPillText}>25 min</Text></View>
          </View>
          <Text style={styles.focusTitle}>12:30 PM study sprint</Text>
          <Text style={styles.focusCopy}>Review Calculus problem set before English Literature.</Text>
        </View>

        <View style={styles.segment}>
          {["Day", "Week", "Month"].map((item, index) => (
            <TouchableOpacity key={item} style={[styles.segmentItem, index === 0 ? styles.segmentActive : null]} activeOpacity={0.82}>
              <Text style={[styles.segmentText, index === 0 ? styles.segmentTextActive : null]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateTitle}>Mon, Jun 2</Text>
          <View style={styles.chevrons}>
            <TouchableOpacity style={styles.smallIcon}><ChevronLeft size={18} color={SP.ink} /></TouchableOpacity>
            <TouchableOpacity style={styles.smallIcon}><ChevronRight size={18} color={SP.ink} /></TouchableOpacity>
          </View>
        </View>

        <View style={styles.timeline}>
          {hours.map((hour, index) => {
            const block = blocks.find((item) => item.index === index);
            const course = block ? scheduleCourses[block.courseIndex] : null;
            return (
              <View key={hour} style={styles.hourRow}>
                <Text style={styles.hourLabel}>{hour}</Text>
                <View style={styles.hourLine}>
                  {block && course ? (
                    <TouchableOpacity style={[styles.classBlock, { backgroundColor: tintFor(course.color), borderLeftColor: course.color || SP.blue }]} activeOpacity={0.84}>
                      <Text style={styles.blockTitle}>{course.name}</Text>
                      <Text style={styles.blockRoom}>Room {course.room || block.room}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const hours = ["8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p"];
const blocks = [
  { index: 1, courseIndex: 0, room: "B204" },
  { index: 3, courseIndex: 1, room: "M112" },
  { index: 6, courseIndex: 2, room: "H310" },
  { index: 7, courseIndex: 3, room: "CS50" }
];

const fallbackCourses: Course[] = [
  { id: "bio", name: "Biology 101", code: "BIO", instructor: "Dr. Chen", room: "B204", color: SP.green, meetings: [], gradeCategories: [] },
  { id: "calc", name: "Calculus II", code: "CAL", instructor: "Prof. Harris", room: "M112", color: SP.blue, meetings: [], gradeCategories: [] },
  { id: "eng", name: "English Literature", code: "ENG", instructor: "Dr. Patel", room: "H310", color: SP.purple, meetings: [], gradeCategories: [] },
  { id: "cs", name: "Computer Science", code: "CS", instructor: "Prof. Kim", room: "CS50", color: SP.teal, meetings: [], gradeCategories: [] }
];

function tintFor(color?: string) {
  if (color === SP.green) return "#E9FAF1";
  if (color === SP.purple) return "#F5EEFF";
  if (color === SP.teal) return "#E9FAFD";
  return "#EEF4FF";
}

function heat(load: number) {
  if (load >= 7) return "#FF5A1F";
  if (load >= 4) return "#F59E0B";
  if (load >= 2) return "#22C55E";
  return "#E5E7EB";
}

const styles = StyleSheet.create({
  surface: { flex: 1, backgroundColor: SP.white },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 138 },
  appBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { color: SP.ink, fontSize: 34, fontWeight: "900", letterSpacing: -0.9 },
  iconButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#FAFAFB", borderWidth: 1, borderColor: "#ECECF1", alignItems: "center", justifyContent: "center" },
  riskCard: { borderRadius: 22, backgroundColor: "#FAFAFB", borderWidth: 1, borderColor: "#ECECF1", padding: 14, marginBottom: 14 },
  riskLabel: { color: "#6F727A", fontSize: 13, fontWeight: "900", letterSpacing: 0.4 },
  riskValue: { color: SP.ink, fontSize: 13, fontWeight: "900" },
  heatRow: { flexDirection: "row", gap: 7, marginTop: 12 },
  heatCell: { flex: 1, height: 18, borderRadius: 9 },
  focusCard: { borderRadius: 26, backgroundColor: "#F0FFF8", borderWidth: 1, borderColor: "#B8F0D4", padding: 18, marginBottom: 16 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greenLabel: { color: SP.green, fontSize: 13, fontWeight: "900", letterSpacing: 0.6 },
  greenPill: { height: 32, borderRadius: 16, backgroundColor: "#E8FFF3", borderWidth: 1, borderColor: "#B8F0D4", paddingHorizontal: 12, alignItems: "center", justifyContent: "center" },
  greenPillText: { color: SP.green, fontSize: 13, fontWeight: "900" },
  focusTitle: { color: SP.ink, fontSize: 24, fontWeight: "900", letterSpacing: -0.5, marginTop: 12 },
  focusCopy: { color: "#656972", fontSize: 15, fontWeight: "600", lineHeight: 21, marginTop: 5 },
  segment: { height: 44, borderRadius: 22, padding: 4, backgroundColor: "#F6F6F8", borderWidth: 1, borderColor: "#ECECF1", flexDirection: "row", gap: 4, marginBottom: 16 },
  segmentItem: { flex: 1, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  segmentActive: { backgroundColor: SP.white, shadowColor: "#001", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  segmentText: { color: "#8A8F99", fontSize: 14, fontWeight: "900" },
  segmentTextActive: { color: SP.ink },
  dateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  dateTitle: { color: SP.ink, fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  chevrons: { flexDirection: "row", gap: 8 },
  smallIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FAFAFB", borderWidth: 1, borderColor: "#ECECF1", alignItems: "center", justifyContent: "center" },
  timeline: { borderRadius: 24, overflow: "hidden" },
  hourRow: { minHeight: 66, flexDirection: "row", gap: 12 },
  hourLabel: { width: 34, color: "#9AA0A8", fontSize: 12, fontWeight: "900", textAlign: "right", paddingTop: 2 },
  hourLine: { flex: 1, borderTopWidth: 1, borderTopColor: "#F0F1F4", position: "relative" },
  classBlock: { position: "absolute", left: 0, right: 4, top: 5, height: 58, borderRadius: 14, borderLeftWidth: 4, paddingHorizontal: 12, paddingVertical: 8, justifyContent: "center" },
  blockTitle: { color: SP.ink, fontSize: 14, fontWeight: "900" },
  blockRoom: { color: "#6F727A", fontSize: 12, fontWeight: "800", marginTop: 2 }
});
