import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Plus } from "lucide-react-native";

import { AppButton } from "../components/AppButton";
import { AssignmentCard } from "../components/AssignmentCard";
import { Badge } from "../components/Badge";
import { CourseSummaryCard, PremiumCard, ScreenHeader } from "../components/PremiumUI";
import { SectionHeader } from "../components/SectionHeader";
import { isStoreCaptureEnabled } from "../config/storeCapture";
import { storeCaptureNow } from "../data/demoSemester";
import { formatDateOnly, groupMeetingsByDay, urgencyLabel } from "../logic/planner";
import { Assignment, AssignmentKind, Course, Semester, SyllabusSource } from "../models";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type CoursesScreenProps = {
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
  syllabusSources: SyllabusSource[];
  onAddQuickAssignment: (
    courseId: string,
    title: string,
    dueDate: string,
    kind: AssignmentKind
  ) => void;
  onOpenAssignment: (assignmentId: string) => void;
  onUpdateSemester: (patch: Partial<Semester>) => void;
  onAddCourse: (course: Pick<Course, "code" | "name" | "instructor">) => void;
  onUpdateCourse: (courseId: string, patch: Partial<Course>) => void;
};

export function CoursesScreen({
  semester,
  courses,
  assignments,
  syllabusSources,
  onAddQuickAssignment,
  onOpenAssignment,
  onUpdateSemester,
  onAddCourse,
  onUpdateCourse
}: CoursesScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [kind, setKind] = useState<AssignmentKind>("assignment");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseInstructor, setNewCourseInstructor] = useState("");
  const now = isStoreCaptureEnabled() ? storeCaptureNow : new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const weekly = groupMeetingsByDay(courses);
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0];
  const selectedAssignments = selectedCourse
    ? assignments
        .filter((assignment) => assignment.courseId === selectedCourse.id)
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    : [];
  const selectedExams = selectedAssignments.filter(
    (assignment) => assignment.type === "exam" || assignment.kind === "exam"
  );
  const selectedOpenAssignments = selectedAssignments.filter(
    (assignment) => assignment.completionStatus !== "completed"
  );
  const selectedDoneCount = selectedAssignments.filter(
    (assignment) => assignment.completionStatus === "completed"
  ).length;
  const selectedProgress =
    selectedAssignments.length > 0
      ? Math.round((selectedDoneCount / selectedAssignments.length) * 100)
      : 0;
  const selectedSyllabusSources = selectedCourse
    ? syllabusSources.filter((source) => source.courseIds.includes(selectedCourse.id))
    : [];

  useEffect(() => {
    if (courses.length === 0) {
      setSelectedCourseId("");
      return;
    }

    if (!courses.some((course) => course.id === selectedCourseId)) {
      setSelectedCourseId(courses[0]?.id || "");
    }
  }, [courses, selectedCourseId]);

  const addItem = () => {
    if (!selectedCourse) return;
    onAddQuickAssignment(selectedCourse.id, title, dueDate, kind);
    setTitle("");
    setDueDate("");
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        eyebrow="Class Hub"
        title="My Classes"
        subtitle={`${formatDateOnly(semester.startDate)} to ${formatDateOnly(semester.endDate)} - ${courses.length} classes`}
      />

      <PremiumCard>
        <Text style={styles.cardTitle}>Semester setup</Text>
        <TextInput
          value={semester.name}
          onChangeText={(name) => onUpdateSemester({ name })}
          placeholder="Semester name"
          placeholderTextColor={colors.faint}
          style={styles.titleInput}
        />
        <View style={styles.twoColumn}>
          <View style={styles.fieldHalf}>
            <Text style={styles.inputLabel}>Start</Text>
            <TextInput
              value={semester.startDate}
              onChangeText={(startDate) => onUpdateSemester({ startDate })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.inputLabel}>End</Text>
            <TextInput
              value={semester.endDate}
              onChangeText={(endDate) => onUpdateSemester({ endDate })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
          </View>
        </View>
      </PremiumCard>

      <SectionHeader title="Courses" note={`${courses.length} active courses`} />
      <View style={styles.courseList}>
        {courses.length === 0 ? (
          <Text style={styles.emptyCard}>Add your first course to start building the semester.</Text>
        ) : null}
        {courses.map((course) => {
          const stats = courseStats(course, assignments, now, weekEnd);
          return (
            <CourseSummaryCard
              key={course.id}
              course={course}
              dueThisWeek={stats.dueThisWeek}
              progress={stats.progress}
              onPress={() => setSelectedCourseId(course.id)}
            />
          );
        })}
      </View>

      {selectedCourse ? (
        <>
          <SectionHeader title="Class Detail" note={selectedCourse.code} />
          <PremiumCard>
            <View style={styles.hubTop}>
              <View>
                <Text style={styles.hubCode}>{selectedCourse.code}</Text>
                <Text style={styles.hubName}>{selectedCourse.name}</Text>
                <Text style={styles.hubMeta}>{selectedCourse.instructor || "Instructor"}</Text>
              </View>
              <Badge label={`${selectedProgress}% done`} tone={selectedProgress >= 80 ? "green" : "blue"} />
            </View>
            <View style={styles.hubMetrics}>
              <MetricTile label="open" value={String(selectedOpenAssignments.length)} />
              <MetricTile label="exams" value={String(selectedExams.length)} />
              <MetricTile label="meetings" value={String(selectedCourse.meetings.length)} />
            </View>
            <View style={styles.reminderDefaults}>
              <Badge label="Assignments: day before" tone="gold" />
              <Badge label="Exams: week before" tone="red" />
            </View>
            <Text style={styles.hubMeta}>
              Syllabus: {selectedSyllabusSources[0]?.sourceName || "Not linked yet"}
            </Text>
          </PremiumCard>

          <SectionHeader title="Edit Course" note={selectedCourse.code} />
          <PremiumCard>
            <Text style={styles.inputLabel}>Code</Text>
            <TextInput
              value={selectedCourse.code}
              onChangeText={(code) => onUpdateCourse(selectedCourse.id, { code })}
              placeholder="BIO 101"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              value={selectedCourse.name}
              onChangeText={(name) => onUpdateCourse(selectedCourse.id, { name })}
              placeholder="Course name"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
            <Text style={styles.inputLabel}>Instructor</Text>
            <TextInput
              value={selectedCourse.instructor || ""}
              onChangeText={(instructor) => onUpdateCourse(selectedCourse.id, { instructor })}
              placeholder="Instructor"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
          </PremiumCard>

          <SectionHeader title="Exams" note={`${selectedExams.length} scheduled`} />
          <View style={styles.workList}>
            {selectedExams.length === 0 ? (
              <Text style={styles.emptyDay}>No exams for this class yet.</Text>
            ) : (
              selectedExams.map((assignment) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={assignment.id}
                  style={styles.examHubItem}
                  onPress={() => onOpenAssignment(assignment.id)}
                >
                  <Badge label={urgencyLabel(assignment, now)} tone="red" />
                  <View style={styles.examHubCopy}>
                    <Text style={styles.examHubTitle}>{assignment.title}</Text>
                    <Text style={styles.examHubMeta}>{assignment.dueAt.slice(0, 10)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <SectionHeader title="Course Work" note={selectedCourse.code} />
          <View style={styles.workList}>
            {selectedAssignments.length === 0 ? (
              <Text style={styles.emptyDay}>No assignments yet.</Text>
            ) : (
              selectedAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  course={selectedCourse}
                  onOpen={() => onOpenAssignment(assignment.id)}
                />
              ))
            )}
          </View>
        </>
      ) : null}

      <SectionHeader title="Quick Add" note="Minimal typing for manual entry" />
      <PremiumCard>
        <View style={styles.segmented}>
          {(["assignment", "exam"] as AssignmentKind[]).map((option) => (
            <TouchableOpacity
              accessibilityRole="button"
              key={option}
              style={[styles.segment, kind === option ? styles.segmentActive : null]}
              onPress={() => setKind(option)}
            >
              <Text style={[styles.segmentText, kind === option ? styles.segmentTextActive : null]}>
                {option === "exam" ? "Exam" : "Assignment"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={colors.faint}
          style={styles.input}
        />
        <TextInput
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.faint}
          style={styles.input}
        />
        <AppButton
          label="Add"
          icon={Plus}
          disabled={!selectedCourse || !title.trim() || !dueDate.trim()}
          onPress={addItem}
        />
      </PremiumCard>

      <SectionHeader title="Add Course" note="Defaults include editable grade weights" />
      <PremiumCard>
        <View style={styles.twoColumn}>
          <TextInput
            value={newCourseCode}
            onChangeText={setNewCourseCode}
            placeholder="Code"
            placeholderTextColor={colors.faint}
            style={[styles.input, styles.fieldHalf]}
          />
          <TextInput
            value={newCourseInstructor}
            onChangeText={setNewCourseInstructor}
            placeholder="Instructor"
            placeholderTextColor={colors.faint}
            style={[styles.input, styles.fieldHalf]}
          />
        </View>
        <TextInput
          value={newCourseName}
          onChangeText={setNewCourseName}
          placeholder="Course name"
          placeholderTextColor={colors.faint}
          style={styles.input}
        />
        <AppButton
          label="Add course"
          icon={Plus}
          onPress={() => {
            onAddCourse({
              code: newCourseCode,
              name: newCourseName,
              instructor: newCourseInstructor
            });
            setNewCourseCode("");
            setNewCourseName("");
            setNewCourseInstructor("");
          }}
        />
      </PremiumCard>

      <SectionHeader title="Weekly Schedule" note="Class blocks by day" />
      <PremiumCard>
        {weekly.map(({ day, meetings }) => (
          <View key={day} style={styles.dayRow}>
            <Text style={styles.day}>{day}</Text>
            <View style={styles.meetingColumn}>
              {meetings.length === 0 ? (
                <Text style={styles.emptyDay}>No classes</Text>
              ) : (
                meetings.map((meeting) => (
                  <View key={meeting.id} style={styles.meeting}>
                    <Badge label={meeting.course.code} tone="green" />
                    <View style={styles.meetingCopy}>
                      <Text style={styles.meetingTime}>
                        {meeting.startTime} to {meeting.endTime}
                      </Text>
                      <Text style={styles.meetingPlace}>{meeting.location}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        ))}
      </PremiumCard>
    </View>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.hubMetric}>
      <Text style={styles.hubMetricValue}>{value}</Text>
      <Text style={styles.hubMetricLabel}>{label}</Text>
    </View>
  );
}

function courseStats(course: Course, assignments: Assignment[], now: Date, weekEnd: Date) {
  const courseAssignments = assignments.filter((assignment) => assignment.courseId === course.id);
  const completedCount = courseAssignments.filter(
    (assignment) => assignment.completionStatus === "completed"
  ).length;
  const dueThisWeek = courseAssignments.filter((assignment) => {
    const due = new Date(assignment.dueAt);
    return due >= now && due < weekEnd && assignment.completionStatus !== "completed";
  }).length;

  return {
    dueThisWeek,
    progress:
      courseAssignments.length > 0
        ? Math.round((completedCount / courseAssignments.length) * 100)
        : 0
  };
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    screen: {
      gap: spacing.md
    },
    cardTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    titleInput: {
      color: colors.ink,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "900",
      padding: 0
    },
    courseList: {
      gap: spacing.sm
    },
    emptyCard: {
      overflow: "hidden",
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700"
    },
    hubTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    hubCode: {
      color: colors.brandPurple,
      fontSize: 13,
      fontWeight: "900"
    },
    hubName: {
      color: colors.ink,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "900"
    },
    hubMetrics: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md,
      marginBottom: spacing.md
    },
    hubMetric: {
      flex: 1,
      minHeight: 70,
      borderRadius: radii.lg,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.sm,
      justifyContent: "center"
    },
    hubMetricValue: {
      color: colors.ink,
      fontSize: 22,
      lineHeight: 27,
      fontWeight: "900"
    },
    hubMetricLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "900"
    },
    reminderDefaults: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginBottom: spacing.sm
    },
    hubMeta: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    },
    examHubItem: {
      minHeight: 72,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    examHubCopy: {
      flex: 1,
      minWidth: 0
    },
    examHubTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    examHubMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    workList: {
      gap: spacing.sm
    },
    segmented: {
      minHeight: 44,
      flexDirection: "row",
      borderRadius: radii.round,
      backgroundColor: colors.canvas,
      padding: 4,
      gap: 4
    },
    segment: {
      flex: 1,
      borderRadius: radii.round,
      alignItems: "center",
      justifyContent: "center"
    },
    segmentActive: {
      backgroundColor: colors.surface
    },
    segmentText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "900"
    },
    segmentTextActive: {
      color: colors.ink
    },
    input: {
      minWidth: 0,
      minHeight: 46,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      color: colors.ink,
      backgroundColor: colors.canvas,
      paddingHorizontal: spacing.sm,
      fontSize: 15,
      fontWeight: "700"
    },
    inputLabel: {
      color: colors.faint,
      fontSize: 12,
      fontWeight: "900",
      marginTop: spacing.xs
    },
    twoColumn: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "stretch"
    },
    fieldHalf: {
      flex: 1,
      minWidth: 0
    },
    dayRow: {
      minHeight: 64,
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      paddingVertical: spacing.sm,
      gap: spacing.sm
    },
    day: {
      width: 38,
      color: colors.ink,
      fontSize: 13,
      fontWeight: "900"
    },
    meetingColumn: {
      flex: 1,
      gap: spacing.xs
    },
    meeting: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    meetingCopy: {
      flex: 1
    },
    meetingTime: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: "800"
    },
    meetingPlace: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17
    },
    emptyDay: {
      color: colors.faint,
      fontSize: 13,
      lineHeight: 19
    }
  });
}
