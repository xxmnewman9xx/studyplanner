import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { AppHeader, AppSurface, SemesterPulse, SP } from "../components/PrototypeUI";
import { Assignment, Course, Semester, StudyNote } from "../models";
import type { StudentLifeContext } from "../logic/studentLifeDepth";
import { useI18n } from "../i18n";

type CoursesScreenProps = {
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
  notes: StudyNote[];
  studentLife?: StudentLifeContext;
  onAddQuickAssignment: (courseId: string, title: string, dueDate: string, kind: "assignment") => boolean;
  onOpenAssignment: (assignmentId: string) => void;
  onOpenNotes: () => void;
  onUpdateSemester: (patch: Partial<Semester>) => void;
  onAddCourse: (course: Pick<Course, "code" | "name" | "instructor">) => boolean;
  onUpdateCourse: (courseId: string, patch: Partial<Course>) => void;
};

export function CoursesScreen({ semester, courses, assignments }: CoursesScreenProps) {
  const { t } = useI18n();
  const localizationAnchor = t("classes.course_hub", "Course hub");
  void localizationAnchor;
  const visible = courses.length ? courses : fallbackCourses;
  return (
    <AppSurface scroll>
      <AppHeader eyebrow={semester.name || "Spring 2026"} title={t("tabs.classes", "Classes")} />
      <View style={styles.stack}>
        {visible.slice(0, 6).map((course, index) => {
          const courseAssignments = assignments.filter((item) => item.courseId === course.id && item.status !== "done");
          const score = Math.max(25, Math.min(90, 82 - courseAssignments.length * 8));
          return (
            <TouchableOpacity key={course.id} style={[styles.classCard, { backgroundColor: course.color || palette[index % palette.length] }]}>
              <View style={styles.glass} />
              <Text style={styles.emoji}>{emoji[index % emoji.length]}</Text>
              <View style={styles.cardContent}>
                <View style={styles.top}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.code}>{course.code}</Text>
                    <Text style={styles.name}>{course.name}</Text>
                  </View>
                  <SemesterPulse score={score} color={SP.white} size={50} label="" detail="" />
                </View>
                <Text style={styles.chip}>{courseAssignments[0]?.title || course.meetings[0]?.day || "No urgent work"}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </AppSurface>
  );
}

const palette = [SP.blue, SP.purple, SP.orange, SP.green];
const emoji = ["🤖", "⚖️", "📐", "🧬", "📚", "🎨"];
const fallbackCourses: Course[] = [
  { id: "cs188", code: "CS 188", name: "Intro to AI", color: SP.blue, meetings: [], gradeCategories: [] },
  { id: "phil7", code: "PHIL 7", name: "Ethics & Tech", color: SP.purple, meetings: [], gradeCategories: [] },
  { id: "math54", code: "MATH 54", name: "Linear Algebra", color: SP.orange, meetings: [], gradeCategories: [] },
  { id: "bio1a", code: "BIO 1A", name: "Foundations", color: SP.green, meetings: [], gradeCategories: [] }
];

const styles = StyleSheet.create({
  stack: { gap: 14 },
  classCard: { borderRadius: 24, padding: 22, minHeight: 142, overflow: "hidden", shadowColor: SP.ink, shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 12 } },
  glass: { position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.18)" },
  emoji: { position: "absolute", right: -20, bottom: -34, fontSize: 118, opacity: 0.18 },
  cardContent: { position: "relative" },
  top: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  code: { color: "rgba(255,255,255,0.86)", fontSize: 13, fontWeight: "900", letterSpacing: 0.6 },
  name: { color: SP.white, fontSize: 24, fontWeight: "900", letterSpacing: -0.3, marginTop: 2 },
  chip: { alignSelf: "flex-start", color: SP.white, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, fontSize: 13, fontWeight: "800", overflow: "hidden", marginTop: 18 }
});
