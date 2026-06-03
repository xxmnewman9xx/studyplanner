import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Activity, Bell, Check, Grid2X2, MapPin, Plus, Search, User } from "lucide-react-native";

import { SemesterPulse, SP } from "../components/PrototypeUI";
import { Assignment, Course, FocusSession, Semester, StudyNote, UserSettings, WidgetPreset } from "../models";
import { getCourseForAssignment } from "../logic/planner";
import type { StudentLifeContext } from "../logic/studentLifeDepth";

export type ImportHandoffSummary = {
  sourceName: string;
  addedCount: number;
  reviewCount: number;
  nextTitle?: string;
  nextAssignmentId?: string;
};

type TodayScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  semester: Semester;
  studentName: string;
  notes: StudyNote[];
  focusSessions?: FocusSession[];
  settings?: UserSettings;
  widgetPresets?: WidgetPreset[];
  studentLife?: StudentLifeContext;
  importHandoff?: ImportHandoffSummary | null;
  demoMode?: boolean;
  onUpdateStatus: (assignmentId: string, status: "not_started" | "in_progress" | "done") => void;
  onOpenAssignment: (assignmentId: string) => void;
  onScheduleReminders: () => void;
  onCalendarSync: () => void;
  onOpenFocus: (assignmentId?: string) => void;
  onOpenScan: () => void;
  onOpenPlan: () => void;
  onOpenClasses: () => void;
  onOpenNotes: () => void;
  onOpenGrades: () => void;
  onOpenWidgets: () => void;
  onTryDemo?: () => void;
  onReplaceDemo: () => void;
  onAddQuickAssignment: (courseId: string, title: string, dueDate: string, kind: "assignment") => boolean;
};

export function TodayScreen({ assignments, courses, semester, studentName, onOpenAssignment, onOpenPlan }: TodayScreenProps) {
  const openItems = assignments
    .filter((item) => item.status !== "done" && item.status !== "archived")
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const tasks = openItems.slice(0, 3);
  const primaryTask = tasks[0];
  const nextClass = courses[0] || fallbackCourse;
  const secondClass = courses[1] || { ...fallbackCourse, id: "calc", name: "Calculus II", code: "CAL", room: "M112", color: SP.blue };
  const thirdClass = courses[2] || { ...fallbackCourse, id: "eng", name: "English Literature", code: "ENG", room: "H310", color: SP.purple };
  const first = firstName(studentName) || "Maya";
  const pulse = Math.max(85, Math.round(92 - openItems.length * 2));
  const todayCount = Math.max(2, tasks.length || 2);

  return (
    <View style={styles.surface}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.name}>{first}</Text>
            <Text style={styles.subtle}>3 classes and {todayCount} tasks today.</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={onOpenPlan} activeOpacity={0.78}>
              <Grid2X2 size={24} color={SP.ink} />
            </TouchableOpacity>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials(studentName || first)}</Text></View>
          </View>
        </View>

        <View style={styles.search}>
          <Search size={18} color={SP.sub} />
          <Text style={styles.searchText}>Search classes, tasks, notes</Text>
        </View>

        <TouchableOpacity style={styles.pulseHero} activeOpacity={0.86} onPress={() => primaryTask && onOpenAssignment(primaryTask.id)}>
          <View style={styles.heroTop}>
            <Text style={styles.greenLabel}>CLASS PULSE</Text>
            <View style={styles.goodPill}><Activity size={16} color={SP.green} /><Text style={styles.goodPillText}>Good</Text></View>
          </View>
          <View style={styles.heroBody}>
            <View style={styles.heroCopy}>
              <Text style={styles.pulseScore}>{pulse}%</Text>
              <Text style={styles.heroTitle}>Momentum is up</Text>
              <Text style={styles.heroSub}>Best next move: 25 min Calculus sprint before lunch.</Text>
            </View>
            <SemesterPulse score={pulse} color={SP.green} size={112} label="" detail="" />
          </View>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.82} onPress={() => primaryTask && onOpenAssignment(primaryTask.id)}>
            <Text style={styles.primaryButtonText}>Start next task</Text>
            <Text style={styles.primaryArrow}>→</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextClassCard} activeOpacity={0.84}>
          <View style={styles.rowBetween}>
            <Text style={styles.blueLabel}>NEXT CLASS</Text>
            <View style={styles.lightPill}><Bell size={16} color={SP.sub} /><Text style={styles.lightPillText}>18 min</Text></View>
          </View>
          <Text style={styles.classTitle}>{nextClass.name}</Text>
          <View style={styles.pillRow}>
            <View style={styles.lightPill}><View style={[styles.dot, { backgroundColor: nextClass.color || SP.green }]} /><Text style={styles.lightPillText}>Room {nextClass.room || "B204"}</Text></View>
            <View style={styles.lightPill}><User size={15} color={SP.sub} /><Text style={styles.lightPillText}>{nextClass.instructor || "Dr. Chen"}</Text></View>
          </View>
        </TouchableOpacity>

        <View style={styles.widgetGrid}>
          <View style={[styles.widget, styles.orangeWash]}>
            <View style={styles.rowBetween}>
              <Text style={styles.widgetKicker}>TODAY'S TASKS</Text>
              <Check size={20} color="#FF7A45" />
            </View>
            <Text style={styles.bigNumber}>{todayCount}<Text style={styles.unit}> due</Text></Text>
            {(tasks.length ? tasks : fallbackTasks).slice(0, 2).map((item) => (
              <TouchableOpacity key={item.id} style={styles.taskLine} activeOpacity={0.75} onPress={() => "dueAt" in item && onOpenAssignment(item.id)}>
                <View style={styles.emptyCircle} />
                <Text numberOfLines={1} style={styles.taskText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.widget, styles.cyanWash]} activeOpacity={0.84} onPress={onOpenPlan}>
            <View style={styles.rowBetween}>
              <Text style={styles.widgetKicker}>ROOM REMINDER</Text>
              <MapPin size={22} color={SP.teal} />
            </View>
            <Text style={styles.roomText}>{nextClass.room || "B204"}</Text>
            <Text style={styles.widgetSub}>{nextClass.name} starts in 18 min</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleHeader}>
          <Text style={styles.sectionLabel}>TODAY'S SCHEDULE</Text>
          <TouchableOpacity onPress={onOpenPlan}><Text style={styles.calendarLink}>Calendar</Text></TouchableOpacity>
        </View>
        {[nextClass, secondClass, thirdClass].map((course, index) => (
          <View key={`${course.id}-${index}`} style={styles.scheduleRow}>
            <View style={styles.timeCol}>
              <Text style={styles.time}>{["9:00", "11:30", "2:00"][index]}</Text>
              <Text style={styles.ampm}>{index === 2 ? "PM" : "AM"}</Text>
            </View>
            <View style={[styles.scheduleRail, { backgroundColor: course.color || SP.blue }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduleTitle}>{course.name}</Text>
              <Text style={styles.scheduleSub}>Room {course.room || ["B204", "M112", "H310"][index]}</Text>
            </View>
            {index === 0 ? <View style={styles.nextPill}><Text style={styles.nextPillText}>Next</Text></View> : null}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.82}>
        <Plus size={30} color={SP.white} />
      </TouchableOpacity>
    </View>
  );
}

const fallbackCourse: Course = {
  id: "bio",
  name: "Biology 101",
  code: "BIO",
  instructor: "Dr. Chen",
  room: "B204",
  color: SP.green,
  meetings: [],
  gradeCategories: []
};

const fallbackTasks = [
  { id: "fallback-1", title: "Bio lab report" },
  { id: "fallback-2", title: "Cell respiration review" }
];

function firstName(name: string) {
  return name?.trim().split(/\s+/)[0] || "";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "MR";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

const styles = StyleSheet.create({
  surface: { flex: 1, backgroundColor: SP.white },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 156 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  greeting: { color: "#6F727A", fontSize: 26, fontWeight: "600", letterSpacing: -0.2 },
  name: { color: SP.ink, fontSize: 46, fontWeight: "900", letterSpacing: -1.5, lineHeight: 52, marginTop: 2 },
  subtle: { color: "#6F727A", fontSize: 21, fontWeight: "600", letterSpacing: -0.2, marginTop: 4 },
  headerActions: { flexDirection: "row", gap: 12, alignItems: "center", paddingTop: 8 },
  iconButton: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#FAFAFB", borderWidth: 1, borderColor: "#ECECF1", alignItems: "center", justifyContent: "center" },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#5267FF", alignItems: "center", justifyContent: "center" },
  avatarText: { color: SP.white, fontSize: 19, fontWeight: "900" },
  search: { height: 48, borderRadius: 18, backgroundColor: "#F6F6F8", borderWidth: 1, borderColor: "#ECECF1", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  searchText: { color: SP.sub, fontSize: 15, fontWeight: "700" },
  pulseHero: { borderRadius: 28, padding: 20, backgroundColor: "#F0FFF8", borderWidth: 1, borderColor: "#B8F0D4", shadowColor: SP.green, shadowOpacity: 0.12, shadowRadius: 28, shadowOffset: { width: 0, height: 18 }, marginBottom: 10 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greenLabel: { color: SP.green, fontSize: 17, fontWeight: "900", letterSpacing: 0.4 },
  goodPill: { height: 44, borderRadius: 22, backgroundColor: "#E8FFF3", borderWidth: 1, borderColor: "#B8F0D4", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  goodPillText: { color: SP.green, fontSize: 20, fontWeight: "900" },
  heroBody: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  heroCopy: { flex: 1, paddingRight: 8 },
  pulseScore: { color: SP.green, fontSize: 60, fontWeight: "900", letterSpacing: -2.4, lineHeight: 66 },
  heroTitle: { color: SP.ink, fontSize: 24, fontWeight: "900", letterSpacing: -0.4, marginTop: 4 },
  heroSub: { color: "#656972", fontSize: 17, fontWeight: "600", lineHeight: 24, marginTop: 8 },
  primaryButton: { height: 64, borderRadius: 32, backgroundColor: SP.ink, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 14, marginTop: 18 },
  primaryButtonText: { color: SP.white, fontSize: 21, fontWeight: "900", letterSpacing: -0.3 },
  primaryArrow: { color: SP.white, fontSize: 27, fontWeight: "700", marginTop: -2 },
  nextClassCard: { borderRadius: 28, padding: 20, backgroundColor: SP.white, borderWidth: 1, borderColor: "#ECECF1", shadowColor: "#123", shadowOpacity: 0.08, shadowRadius: 26, shadowOffset: { width: 0, height: 12 }, marginBottom: 14 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  blueLabel: { color: "#2F6BFF", fontSize: 17, fontWeight: "900", letterSpacing: 0.4 },
  lightPill: { minHeight: 38, borderRadius: 19, paddingHorizontal: 12, backgroundColor: "#FAFAFB", borderWidth: 1, borderColor: "#ECECF1", flexDirection: "row", alignItems: "center", gap: 8 },
  lightPillText: { color: "#6B6F78", fontSize: 17, fontWeight: "800" },
  classTitle: { color: SP.ink, fontSize: 32, fontWeight: "900", letterSpacing: -0.8, marginTop: 18 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  widgetGrid: { flexDirection: "row", gap: 12 },
  widget: { flex: 1, minHeight: 188, borderRadius: 28, padding: 18, borderWidth: 1, borderColor: "#ECECF1", overflow: "hidden" },
  orangeWash: { backgroundColor: "#FFF8F4" },
  cyanWash: { backgroundColor: "#F0FCFF" },
  widgetKicker: { color: "#9AA0A8", fontSize: 15, fontWeight: "900", letterSpacing: 0.2 },
  bigNumber: { color: SP.ink, fontSize: 54, fontWeight: "900", letterSpacing: -1.6, marginTop: 18, lineHeight: 58 },
  unit: { color: "#9AA0A8", fontSize: 21, fontWeight: "800" },
  taskLine: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 9 },
  emptyCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#E4E6EB" },
  taskText: { flex: 1, color: SP.ink, fontSize: 16, fontWeight: "800" },
  roomText: { color: SP.teal, fontSize: 48, fontWeight: "900", letterSpacing: -1.5, marginTop: 20 },
  widgetSub: { color: "#656972", fontSize: 17, fontWeight: "600", lineHeight: 23, marginTop: 8 },
  scheduleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 10 },
  sectionLabel: { color: "#9AA0A8", fontSize: 13, fontWeight: "900", letterSpacing: 0.7 },
  calendarLink: { color: SP.green, fontSize: 13, fontWeight: "900", letterSpacing: 0.4 },
  scheduleRow: { minHeight: 74, borderRadius: 22, backgroundColor: SP.white, borderWidth: 1, borderColor: "#ECECF1", padding: 14, flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 10 },
  timeCol: { width: 55 },
  time: { color: SP.ink, fontSize: 15, fontWeight: "900" },
  ampm: { color: "#9AA0A8", fontSize: 11, fontWeight: "900", marginTop: 2 },
  scheduleRail: { width: 4, height: 42, borderRadius: 2 },
  scheduleTitle: { color: SP.ink, fontSize: 17, fontWeight: "900", letterSpacing: -0.2 },
  scheduleSub: { color: "#6F727A", fontSize: 13, fontWeight: "700", marginTop: 3 },
  nextPill: { height: 26, borderRadius: 13, backgroundColor: SP.ink, paddingHorizontal: 10, justifyContent: "center" },
  nextPillText: { color: SP.white, fontSize: 11, fontWeight: "900" },
  fab: { position: "absolute", right: 22, bottom: 96, width: 62, height: 62, borderRadius: 31, backgroundColor: SP.ink, alignItems: "center", justifyContent: "center", shadowColor: SP.ink, shadowOpacity: 0.24, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } }
});
