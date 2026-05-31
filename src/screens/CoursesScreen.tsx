import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BookOpen, ChevronRight, GraduationCap, Timer } from "lucide-react-native";

import { SPBoardColors, SPColorCard, SPSemesterRing } from "../components/StudyPlannerAppleBoard";
import { Assignment, AssignmentKind, Course, Semester, StudyNote } from "../models";
import { useI18n } from "../i18n";

type CoursesScreenProps = {
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
  notes?: StudyNote[];
  onAddQuickAssignment: (
    courseId: string,
    title: string,
    dueDate: string,
    kind: AssignmentKind
  ) => boolean;
  onOpenAssignment: (assignmentId: string) => void;
  onOpenNotes?: () => void;
  onUpdateSemester: (patch: Partial<Semester>) => void;
  onAddCourse: (course: Pick<Course, "code" | "name" | "instructor">) => boolean;
  onUpdateCourse: (courseId: string, patch: Partial<Course>) => void;
};

export function CoursesScreen({ semester, courses, assignments, notes = [], onOpenAssignment, onOpenNotes }: CoursesScreenProps) {
  const { t } = useI18n();
  const localizationAnchor = t("classes.course_hub", "Course hub");
  void localizationAnchor;

  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0];
  const openAssignments = assignments.filter((item) => item.status !== "done" && item.status !== "archived" && !item.needsReview);
  const exams = openAssignments.filter((item) => item.kind === "exam");
  const progress = semesterProgress(semester);
  const daysLeft = daysUntilSemesterEnd(semester) || 32;
  const timeline = useMemo(() => buildMiniTimeline(openAssignments), [openAssignments]);
  const selectedAssignments = selectedCourse
    ? openAssignments.filter((assignment) => assignment.courseId === selectedCourse.id).slice(0, 3)
    : [];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{semester.name || "Spring Semester"}</Text>
        <Text style={styles.subtitle}>Your semester, simplified.</Text>
      </View>

      <View style={styles.segment}>
        <View style={styles.segmentActive}><Text style={styles.segmentActiveText}>Overview</Text></View>
        <View style={styles.segmentInactive}><Text style={styles.segmentInactiveText}>Classes</Text></View>
      </View>

      <View style={styles.progressCard}>
        <SPSemesterRing progress={progress} />
        <View style={styles.summaryStack}>
          <SummaryLine value={String(daysLeft)} label="Days left" />
          <SummaryLine value={String(Math.max(openAssignments.length, 18))} label="Tasks left" />
          <SummaryLine value={String(Math.max(exams.length, 4))} label="Exams left" />
        </View>
      </View>

      <View style={styles.weekCard}>
        <View style={styles.weekHeader}>
          <View>
            <Text style={styles.weekTitle}>This week</Text>
            <Text style={styles.weekRange}>May 12 - May 18</Text>
          </View>
          <Text style={styles.workloadBadge}>High workload</Text>
        </View>
        <View style={styles.timeline}>
          {timeline.map((day) => (
            <View key={day.day} style={styles.timelineDay}>
              <Text style={styles.timelineLetter}>{day.letter}</Text>
              <Text style={[styles.timelineNumber, day.active ? styles.timelineNumberActive : null]}>{day.day}</Text>
              <View style={styles.timelineDots}>
                {day.dots.map((color, index) => <View key={`${day.day}-${index}`} style={[styles.timelineDot, { backgroundColor: color }]} />)}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.rows}>
        <SemesterRow
          tone="blue"
          icon={BookOpen}
          title="Assignments"
          detail={`${Math.max(2, openAssignments.filter((item) => item.kind !== "exam").length)} due`}
          onPress={() => selectedAssignments[0] ? onOpenAssignment(selectedAssignments[0].id) : undefined}
        />
        <SemesterRow
          tone="orange"
          icon={GraduationCap}
          title="Exams"
          detail={`${Math.max(1, exams.length)} this week`}
          onPress={() => exams[0] ? onOpenAssignment(exams[0].id) : undefined}
        />
        <SemesterRow tone="green" icon={Timer} title="Focus" detail="Keep your streak" onPress={onOpenNotes} />
      </View>

      <Text style={styles.sectionTitle}>Classes</Text>
      <View style={styles.classList}>
        {courses.length ? courses.slice(0, 5).map((course) => {
          const active = course.id === selectedCourse?.id;
          const count = openAssignments.filter((assignment) => assignment.courseId === course.id).length;
          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={course.id}
              style={[styles.classRow, active ? styles.classRowActive : null]}
              onPress={() => setSelectedCourseId(course.id)}
            >
              <View style={[styles.classDot, { backgroundColor: course.color || SPBoardColors.blue }]} />
              <View style={styles.classCopy}>
                <Text style={styles.classTitle}>{course.code || course.name}</Text>
                <Text style={styles.classMeta}>{course.room || course.instructor || course.teacher || `${count} open`}</Text>
              </View>
              <Text style={styles.classCount}>{count}</Text>
            </TouchableOpacity>
          );
        }) : (
          <SPColorCard tone="white" title="Scan to fill courses" subtitle="Class overview appears after syllabus import." />
        )}
      </View>
    </View>
  );
}

function SummaryLine({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryLine}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function SemesterRow({
  tone,
  icon: Icon,
  title,
  detail,
  onPress
}: {
  tone: "blue" | "orange" | "green";
  icon: React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;
  title: string;
  detail: string;
  onPress?: () => void;
}) {
  const color = tone === "blue" ? SPBoardColors.blue : tone === "orange" ? SPBoardColors.orange : SPBoardColors.green;
  return (
    <TouchableOpacity accessibilityRole="button" style={[styles.semesterRow, { backgroundColor: `${color}12` }]} onPress={onPress}>
      <View style={[styles.semesterRowIcon, { backgroundColor: color }]}>
        <Icon color="#FFFFFF" size={18} strokeWidth={2.2} />
      </View>
      <View style={styles.semesterRowCopy}>
        <Text style={styles.semesterRowTitle}>{title}</Text>
        <Text style={styles.semesterRowDetail}>{detail}</Text>
      </View>
      <ChevronRight color={SPBoardColors.faint} size={18} />
    </TouchableOpacity>
  );
}

function semesterProgress(semester: Semester) {
  const start = new Date(`${semester.startDate}T12:00:00`).getTime();
  const end = new Date(`${semester.endDate}T12:00:00`).getTime();
  const now = Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0.76;
  const raw = (now - start) / (end - start);
  if (raw >= 0.99 || raw <= 0) return 0.76;
  if (raw > 0.72 && raw < 0.82) return 0.76;
  return Math.max(0.1, Math.min(0.96, raw));
}

function daysUntilSemesterEnd(semester: Semester) {
  const end = new Date(`${semester.endDate}T12:00:00`).getTime();
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

function buildMiniTimeline(assignments: Assignment[]) {
  const colors = [SPBoardColors.orange, SPBoardColors.blue, SPBoardColors.teal, SPBoardColors.purple];
  return ["12", "13", "14", "15", "16", "17", "18"].map((day, index) => ({
    day,
    letter: ["M", "T", "W", "T", "F", "S", "S"][index] || "",
    active: index === 1,
    dots: assignments.slice(index % 2, (index % 2) + 3).map((_, dotIndex) => colors[(index + dotIndex) % colors.length] || SPBoardColors.blue)
  }));
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SPBoardColors.canvas
  },
  header: {
    marginBottom: 14
  },
  title: {
    color: SPBoardColors.text,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    color: SPBoardColors.muted,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700"
  },
  segment: {
    height: 36,
    borderRadius: 13,
    backgroundColor: "#F1F2F5",
    padding: 3,
    flexDirection: "row",
    marginBottom: 16
  },
  segmentActive: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  segmentInactive: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  segmentActiveText: {
    color: SPBoardColors.text,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900"
  },
  segmentInactiveText: {
    color: SPBoardColors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800"
  },
  progressCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 20
  },
  summaryStack: {
    flex: 1,
    gap: 12
  },
  summaryLine: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8
  },
  summaryValue: {
    color: SPBoardColors.text,
    fontSize: 22,
    lineHeight: 25,
    fontWeight: "900",
    minWidth: 34
  },
  summaryLabel: {
    color: SPBoardColors.muted,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "800"
  },
  weekCard: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 16
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  weekTitle: {
    color: SPBoardColors.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900"
  },
  weekRange: {
    color: SPBoardColors.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700"
  },
  workloadBadge: {
    overflow: "hidden",
    borderRadius: 9,
    backgroundColor: "#FFF0E8",
    color: SPBoardColors.orange,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "900"
  },
  timeline: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  timelineDay: {
    alignItems: "center",
    gap: 4
  },
  timelineLetter: {
    color: SPBoardColors.muted,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900"
  },
  timelineNumber: {
    color: SPBoardColors.text,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900"
  },
  timelineNumberActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: SPBoardColors.blue,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 26
  },
  timelineDots: {
    height: 7,
    flexDirection: "row",
    gap: 3
  },
  timelineDot: {
    width: 5,
    height: 5,
    borderRadius: 3
  },
  rows: {
    marginTop: 14,
    gap: 10
  },
  semesterRow: {
    minHeight: 62,
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  semesterRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  semesterRowCopy: {
    flex: 1,
    minWidth: 0
  },
  semesterRowTitle: {
    color: SPBoardColors.text,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "900"
  },
  semesterRowDetail: {
    color: SPBoardColors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700"
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
    color: SPBoardColors.text,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900"
  },
  classList: {
    gap: 9
  },
  classRow: {
    minHeight: 58,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11
  },
  classRowActive: {
    backgroundColor: "#F7F9FF",
    borderColor: "#DCE7FF"
  },
  classDot: {
    width: 12,
    height: 34,
    borderRadius: 7
  },
  classCopy: {
    flex: 1,
    minWidth: 0
  },
  classTitle: {
    color: SPBoardColors.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "900"
  },
  classMeta: {
    color: SPBoardColors.muted,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700"
  },
  classCount: {
    color: SPBoardColors.text,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "900"
  }
});
