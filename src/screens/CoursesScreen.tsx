import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BookOpen, CalendarClock, Check, Plus } from "lucide-react-native";

import { AppButton } from "../components/AppButton";
import { CourseBalanceCard, CompletionInsightCard } from "../components/InsightCards";
import {
  CourseCard,
  GlassCard,
  MetricPill,
  PremiumHeader,
  PremiumScreen,
  StatusBadge,
  TaskRow
} from "../components/PremiumUI";
import { isStoreCaptureEnabled } from "../config/storeCapture";
import { storeCaptureNow } from "../data/demoSemester";
import {
  isAssignmentCompleted,
  isAssignmentConfirmed,
  isAssignmentOpen
} from "../logic/assignmentModel";
import {
  daysUntil,
  formatDateOnly,
  getCourseForAssignment,
  groupMeetingsByDay,
  urgencyLabel
} from "../logic/planner";
import { buildSemesterInsights } from "../logic/semesterInsights";
import { addDaysLocal, isValidDateKey, parseValidDate, startOfLocalDay, toDateKey } from "../logic/dateUtils";
import { Assignment, AssignmentKind, Course, Semester, SyllabusSource } from "../models";
import { AppTheme, classColorPalette, courseColorAt } from "../theme";
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
  onAddCourse: (course: Pick<Course, "code" | "name" | "instructor"> & { color?: string }) => void;
  onUpdateCourse: (courseId: string, patch: Partial<Course>) => void;
  onOpenGrades: () => void;
  captureState?: string | null;
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
  onUpdateCourse,
  onOpenGrades,
  captureState
}: CoursesScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const captureMode = isStoreCaptureEnabled();
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [kind, setKind] = useState<AssignmentKind>("assignment");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseInstructor, setNewCourseInstructor] = useState("");
  const [newCourseColor, setNewCourseColor] = useState(courseColorAt(courses.length));
  const [showAddCourseForm, setShowAddCourseForm] = useState(courses.length === 0);
  const now = captureMode ? storeCaptureNow : new Date();
  const showCaptureManualAdd = captureMode && captureState === "manual-add";
  const weekly = useMemo(() => groupMeetingsByDay(courses), [courses]);
  const insights = useMemo(() => buildSemesterInsights(assignments, courses, now), [assignments, courses, now]);
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0];
  const selectedAssignments = selectedCourse
    ? assignments
        .filter(
          (assignment) =>
            assignment.courseId === selectedCourse.id && isAssignmentConfirmed(assignment)
        )
        .sort((a, b) => (parseValidDate(a.dueAt)?.getTime() || 0) - (parseValidDate(b.dueAt)?.getTime() || 0))
    : [];
  const selectedOpenAssignments = selectedAssignments.filter((assignment) =>
    isAssignmentOpen(assignment)
  );
  const selectedExams = selectedAssignments.filter(
    (assignment) => assignment.type === "exam" || assignment.kind === "exam"
  );
  const selectedDoneCount = selectedAssignments.filter(
    (assignment) => isAssignmentCompleted(assignment)
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
      setShowAddCourseForm(true);
      return;
    }

    if (!courses.some((course) => course.id === selectedCourseId)) {
      setSelectedCourseId(courses[0]?.id || "");
    }
  }, [courses, selectedCourseId]);

  useEffect(() => {
    if (!showCaptureManualAdd) return;
    setSelectedCourseId(courses[0]?.id || "");
    setKind("assignment");
    setTitle("Field Notes");
    setDueDate(toDateKey(addDaysLocal(startOfLocalDay(now), 1)));
  }, [courses, now, showCaptureManualAdd]);

  const addItem = () => {
    if (!selectedCourse) return;
    if (!title.trim() || !isValidDateKey(dueDate.trim())) return;
    onAddQuickAssignment(selectedCourse.id, title, dueDate, kind);
    setTitle("");
    setDueDate("");
  };

  const addCourseFromDraft = () => {
    if (!newCourseCode.trim() || !newCourseName.trim()) return;
    onAddCourse({
      code: newCourseCode,
      name: newCourseName,
      instructor: newCourseInstructor,
      color: newCourseColor
    });
    setNewCourseCode("");
    setNewCourseName("");
    setNewCourseInstructor("");
    setNewCourseColor(courseColorAt(courses.length + 1));
    setShowAddCourseForm(false);
  };

  const quickAddWorkCard = selectedCourse ? (
    <GlassCard>
      <Text style={styles.panelTitle}>Add Work</Text>
      <View style={styles.segmented}>
        {(["assignment", "exam"] as AssignmentKind[]).map((option) => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: kind === option }}
            accessibilityLabel={`Set new work type to ${option === "exam" ? "Exam" : "Assignment"}`}
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
        accessibilityLabel="Assignment title"
        accessibilityHint="Enter the name of the work to add to this class."
        placeholderTextColor={colors.faint}
        style={styles.input}
      />
      <TextInput
        value={dueDate}
        onChangeText={setDueDate}
        placeholder="YYYY-MM-DD"
        accessibilityLabel="Due date"
        accessibilityHint="Use a real date like 2026-09-18."
        placeholderTextColor={colors.faint}
        style={styles.input}
      />
      <AppButton
        label="Add to Planner"
        icon={Plus}
        disabled={!selectedCourse || !title.trim() || !isValidDateKey(dueDate.trim())}
        onPress={addItem}
      />
    </GlassCard>
  ) : null;

  return (
    <PremiumScreen>
      <PremiumHeader
        eyebrow={`${formatDateOnly(semester.startDate)} - ${formatDateOnly(semester.endDate)}`}
        title="My Classes"
        subtitle="Everything for each class. All in one place."
        right={
          captureMode ? null : (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Add class"
              style={styles.addButton}
              onPress={() => setShowAddCourseForm((current) => !current)}
            >
              <Plus color={colors.brandPurple} size={19} />
            </TouchableOpacity>
          )
        }
      />

      <View style={styles.courseList}>
        {courses.length === 0 ? (
          <GlassCard>
            <Text style={styles.emptyTitle}>Add your first course.</Text>
            <Text style={styles.emptyCopy}>Courses group assignments, exams, reminders, and widgets.</Text>
          </GlassCard>
        ) : null}
        {courses.map((course) => {
          const stats = courseStats(course, assignments, now);
          return (
            <CourseCard
              key={course.id}
              course={course}
              dueThisWeek={stats.dueThisWeek}
              progress={stats.progress}
              nextDue={stats.nextDue}
              active={course.id === selectedCourse?.id}
              onPress={() => setSelectedCourseId(course.id)}
            />
          );
        })}
      </View>

      {!captureMode && showAddCourseForm ? (
        <GlassCard>
          <Text style={styles.panelTitle}>Add Class</Text>
          <View style={styles.twoColumn}>
            <TextInput
              value={newCourseCode}
              onChangeText={setNewCourseCode}
              placeholder="Code"
              accessibilityLabel="Class code"
              accessibilityHint="Enter a short class code, like BIO 101."
              placeholderTextColor={colors.faint}
              style={[styles.input, styles.fieldHalf]}
            />
            <TextInput
              value={newCourseInstructor}
              onChangeText={setNewCourseInstructor}
              placeholder="Teacher"
              accessibilityLabel="Teacher"
              accessibilityHint="Enter the teacher or instructor name."
              placeholderTextColor={colors.faint}
              style={[styles.input, styles.fieldHalf]}
            />
          </View>
          <TextInput
            value={newCourseName}
            onChangeText={setNewCourseName}
            placeholder="Class name"
            accessibilityLabel="Class name"
            accessibilityHint="Enter the full name of the class."
            placeholderTextColor={colors.faint}
            style={styles.input}
          />
          <Text style={styles.label}>Class color</Text>
          <View style={styles.swatchRow}>
            {classColorPalette.map((color) => (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Choose class color ${color}`}
                key={color}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  newCourseColor === color ? styles.swatchSelected : null
                ]}
                onPress={() => setNewCourseColor(color)}
              >
                {newCourseColor === color ? <Check color="#FFFFFF" size={15} /> : null}
              </TouchableOpacity>
            ))}
          </View>
          <AppButton
            label="Add class"
            icon={Plus}
            disabled={!newCourseCode.trim() || !newCourseName.trim()}
            onPress={addCourseFromDraft}
          />
        </GlassCard>
      ) : null}

      {showCaptureManualAdd ? quickAddWorkCard : null}

      <CourseBalanceCard insights={insights} title="Work by class" />

      {selectedCourse ? (
        <>
          <GlassCard tint="hero" style={styles.detailCard}>
            <View pointerEvents="none" style={styles.detailBand} />
            <View style={styles.detailTop}>
              <View style={[styles.detailIcon, { backgroundColor: selectedCourse.color }]}>
                <BookOpen color={colors.heroText} size={20} />
              </View>
              <View style={styles.detailCopy}>
                <Text style={styles.detailCode}>{selectedCourse.code}</Text>
                <Text style={styles.detailName}>{selectedCourse.name}</Text>
                <Text style={styles.detailMeta}>
                  {selectedCourse.instructor || "Instructor"} - {selectedCourse.meetings.length} meetings
                </Text>
              </View>
              <StatusBadge label={`${selectedProgress}%`} tone={selectedProgress >= 75 ? "green" : "purple"} />
            </View>
            <View style={styles.metricRow}>
              <MetricPill label="Open" value={String(selectedOpenAssignments.length)} tone="purple" />
              <MetricPill label="Exams" value={String(selectedExams.length)} tone="red" />
              <MetricPill label="This Week" value={String(courseStats(selectedCourse, assignments, now).dueThisWeek)} tone="blue" />
            </View>
            <View style={styles.detailFooter}>
              <CalendarClock color={colors.brandPurple} size={16} />
              <Text style={styles.detailFooterText}>
                Syllabus: {selectedSyllabusSources[0]?.sourceName || "Not linked yet"}
              </Text>
            </View>
          </GlassCard>

          <CompletionInsightCard insights={insights} />

          {!captureMode ? (
            <GlassCard>
              <Text style={styles.panelTitle}>Grade Forecast</Text>
              <Text style={styles.emptyCopy}>
                Track weighted scores and target grades from the same classes.
              </Text>
              <AppButton label="Open grade forecast" variant="secondary" onPress={onOpenGrades} />
            </GlassCard>
          ) : null}

          <View style={styles.sectionTop}>
            <View>
              <Text style={styles.sectionTitle}>Next Due</Text>
              <Text style={styles.sectionMeta}>{selectedCourse.code} coursework</Text>
            </View>
          </View>
          <View style={styles.workList}>
            {selectedOpenAssignments.length === 0 ? (
              <GlassCard>
                <Text style={styles.emptyTitle}>No open assignments.</Text>
                <Text style={styles.emptyCopy}>This class is clear for now.</Text>
              </GlassCard>
            ) : (
              selectedOpenAssignments.slice(0, captureMode ? 3 : 6).map((assignment) => (
                <TaskRow
                  key={assignment.id}
                  assignment={assignment}
                  course={getCourseForAssignment(courses, assignment)}
                  now={now}
                  onOpen={() => onOpenAssignment(assignment.id)}
                  compact
                  right={<StatusBadge label={urgencyLabel(assignment, now)} tone={assignment.kind === "exam" ? "red" : "blue"} />}
                />
              ))
            )}
          </View>

          {!captureMode ? (
            <>
              <GlassCard>
                <Text style={styles.panelTitle}>Edit Class</Text>
                <TextInput
                  value={selectedCourse.code}
                  onChangeText={(code) => onUpdateCourse(selectedCourse.id, { code })}
                  placeholder="BIO 101"
                  accessibilityLabel="Class code"
                  accessibilityHint="Edit the short code shown for this class."
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
                <TextInput
                  value={selectedCourse.name}
                  onChangeText={(name) => onUpdateCourse(selectedCourse.id, { name })}
                  placeholder="Course name"
                  accessibilityLabel="Class name"
                  accessibilityHint="Edit the full name of this class."
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
                <TextInput
                  value={selectedCourse.instructor || ""}
                  onChangeText={(instructor) => onUpdateCourse(selectedCourse.id, { instructor })}
                  placeholder="Instructor"
                  accessibilityLabel="Teacher"
                  accessibilityHint="Edit the teacher or instructor for this class."
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
                <Text style={styles.label}>Class color</Text>
                <View style={styles.swatchRow}>
                  {classColorPalette.map((color) => (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Set ${selectedCourse.code} color to ${color}`}
                      key={color}
                      style={[
                        styles.swatch,
                        { backgroundColor: color },
                        selectedCourse.color === color ? styles.swatchSelected : null
                      ]}
                      onPress={() => onUpdateCourse(selectedCourse.id, { color })}
                    >
                      {selectedCourse.color === color ? <Check color="#FFFFFF" size={15} /> : null}
                    </TouchableOpacity>
                  ))}
                </View>
              </GlassCard>

              {quickAddWorkCard}

              <GlassCard>
                <Text style={styles.panelTitle}>Semester Setup</Text>
                <TextInput
                  value={semester.name}
                  onChangeText={(name) => onUpdateSemester({ name })}
                  placeholder="Semester name"
                  accessibilityLabel="Semester name"
                  accessibilityHint="Edit the name used for this school term."
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
                <View style={styles.twoColumn}>
                  <TextInput
                    value={semester.startDate}
                    onChangeText={(startDate) => onUpdateSemester({ startDate })}
                    placeholder="YYYY-MM-DD"
                    accessibilityLabel="Semester start date"
                    accessibilityHint="Use a real start date like 2026-08-24."
                    placeholderTextColor={colors.faint}
                    style={[styles.input, styles.fieldHalf]}
                  />
                  <TextInput
                    value={semester.endDate}
                    onChangeText={(endDate) => onUpdateSemester({ endDate })}
                    placeholder="YYYY-MM-DD"
                    accessibilityLabel="Semester end date"
                    accessibilityHint="Use a real end date like 2026-12-18."
                    placeholderTextColor={colors.faint}
                    style={[styles.input, styles.fieldHalf]}
                  />
                </View>
              </GlassCard>
            </>
          ) : null}
        </>
      ) : null}

      {!captureMode ? (
        <GlassCard>
          <Text style={styles.panelTitle}>Weekly Schedule</Text>
          {weekly.map(({ day, meetings }) => (
            <View key={day} style={styles.dayRow}>
              <Text style={styles.day}>{day}</Text>
              <View style={styles.meetingColumn}>
                {meetings.length === 0 ? (
                  <Text style={styles.emptyDay}>No classes</Text>
                ) : (
                  meetings.map((meeting) => (
                    <View key={meeting.id} style={styles.meeting}>
                      <StatusBadge label={meeting.course.code} tone="green" />
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
        </GlassCard>
      ) : null}
    </PremiumScreen>
  );
}

function courseStats(course: Course, assignments: Assignment[], now: Date) {
  const courseAssignments = assignments.filter(
    (assignment) => assignment.courseId === course.id && isAssignmentConfirmed(assignment)
  );
  const completedCount = courseAssignments.filter((assignment) =>
    isAssignmentCompleted(assignment)
  ).length;
  const openAssignments = courseAssignments
    .filter((assignment) => isAssignmentOpen(assignment))
    .sort((a, b) => (parseValidDate(a.dueAt)?.getTime() || 0) - (parseValidDate(b.dueAt)?.getTime() || 0));
  const dueThisWeek = openAssignments.filter((assignment) => {
    const dueInDays = daysUntil(assignment.dueAt, now);
    return dueInDays >= 0 && dueInDays < 7;
  }).length;

  return {
    dueThisWeek,
    nextDue: openAssignments[0],
    progress:
      courseAssignments.length > 0
        ? Math.round((completedCount / courseAssignments.length) * 100)
        : 0
  };
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.purpleSoft,
      borderWidth: 1,
      borderColor: "rgba(108,92,231,0.18)"
    },
    courseList: {
      gap: spacing.sm
    },
    detailCard: {
      overflow: "hidden",
      backgroundColor: colors.surface,
      borderColor: `${colors.brandBlue}26`
    },
    detailBand: {
      position: "absolute",
      top: -36,
      right: -44,
      width: 210,
      height: 94,
      borderRadius: 34,
      backgroundColor: `${colors.brandBlue}14`,
      transform: [{ rotate: "23deg" }]
    },
    detailTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    detailIcon: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center"
    },
    detailCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    detailCode: {
      color: colors.brandPurple,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    detailName: {
      color: colors.ink,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "900"
    },
    detailMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    metricRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    detailFooter: {
      minHeight: 40,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.surfaceAlt
    },
    detailFooterText: {
      flex: 1,
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    sectionTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "900"
    },
    sectionMeta: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "700"
    },
    workList: {
      gap: spacing.sm
    },
    panelTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "900"
    },
    label: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    swatchRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    swatch: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.9)"
    },
    swatchSelected: {
      borderColor: colors.ink
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
    },
    emptyTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "900"
    },
    emptyCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    }
  });
}
