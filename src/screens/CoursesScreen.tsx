import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Edit3, Plus } from "lucide-react-native";
import {
  AssignmentRow,
  ClassIdentityCard,
  EmojiBadge,
  GlassCard,
  SegmentedControl
} from "../components/AppleComponents";
import { AppButton } from "../components/AppButton";
import { SectionHeader } from "../components/SectionHeader";
import { Assignment, AssignmentKind, Course, Semester } from "../models";
import {
  formatDateOnly,
  getClassAssignmentCounts,
  groupMeetingsByDay
} from "../logic/planner";
import { AppTheme, classColors } from "../theme";
import { useAppTheme } from "../themeContext";

type CoursesScreenProps = {
  semester: Semester;
  courses: Course[];
  assignments: Assignment[];
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
  const weekly = groupMeetingsByDay(courses);
  const counts = getClassAssignmentCounts(courses, assignments);
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0];
  const selectedAssignments = selectedCourse
    ? assignments
        .filter((assignment) => assignment.courseId === selectedCourse.id)
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
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
    <View>
      <GlassCard tone="hero" style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.kicker}>Classes</Text>
            <Text style={styles.heroTitle}>{semester.name}</Text>
            <Text style={styles.heroCopy}>
              {formatDateOnly(semester.startDate)} to {formatDateOnly(semester.endDate)}
            </Text>
          </View>
          <EmojiBadge name="study" label={`${courses.length} classes`} tone="violet" />
        </View>
        <View style={styles.semesterDates}>
          <TextInput
            value={semester.startDate}
            onChangeText={(startDate) => onUpdateSemester({ startDate })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.faint}
            style={styles.dateInput}
          />
          <TextInput
            value={semester.endDate}
            onChangeText={(endDate) => onUpdateSemester({ endDate })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.faint}
            style={styles.dateInput}
          />
        </View>
      </GlassCard>

      <SectionHeader title="Class Customization" note="Color, teacher, period, and room" />
      <View style={styles.courseList}>
        {courses.map((course) => (
          <ClassIdentityCard
            key={course.id}
            course={course}
            openCount={counts[course.id]?.open || 0}
            doneCount={counts[course.id]?.done || 0}
            onPress={() => setSelectedCourseId(course.id)}
          />
        ))}
      </View>

      {selectedCourse ? (
        <>
          <SectionHeader title={selectedCourse.code} note="Class home and settings" />
          <GlassCard style={styles.detailCard}>
            <View style={[styles.classHero, { backgroundColor: selectedCourse.color }]}>
              <Text style={styles.classHeroTitle}>{selectedCourse.name}</Text>
              <Text style={styles.classHeroMeta}>
                {selectedCourse.teacher || selectedCourse.instructor} · {selectedCourse.period} · {selectedCourse.room}
              </Text>
            </View>
            <View style={styles.editGrid}>
              <Field label="Class">
                <TextInput
                  value={selectedCourse.code}
                  onChangeText={(code) => onUpdateCourse(selectedCourse.id, { code })}
                  placeholder="Algebra II"
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
              </Field>
              <Field label="Teacher">
                <TextInput
                  value={selectedCourse.teacher || selectedCourse.instructor || ""}
                  onChangeText={(teacher) =>
                    onUpdateCourse(selectedCourse.id, { teacher, instructor: teacher })
                  }
                  placeholder="Teacher"
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
              </Field>
            </View>
            <View style={styles.editGrid}>
              <Field label="Period">
                <TextInput
                  value={selectedCourse.period || ""}
                  onChangeText={(period) => onUpdateCourse(selectedCourse.id, { period })}
                  placeholder="Period 4"
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
              </Field>
              <Field label="Room">
                <TextInput
                  value={selectedCourse.room || ""}
                  onChangeText={(room) => onUpdateCourse(selectedCourse.id, { room })}
                  placeholder="Room"
                  placeholderTextColor={colors.faint}
                  style={styles.input}
                />
              </Field>
            </View>
            <View style={styles.colorRail}>
              {classColors.map((color) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedCourse.color === color }}
                  key={color}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    selectedCourse.color === color ? styles.colorSwatchActive : null
                  ]}
                  onPress={() => onUpdateCourse(selectedCourse.id, { color })}
                />
              ))}
            </View>
            <Field label="Class notes">
              <TextInput
                value={selectedCourse.notes || ""}
                onChangeText={(notes) => onUpdateCourse(selectedCourse.id, { notes })}
                placeholder="Things to remember, teacher preferences, links, or quick class notes"
                placeholderTextColor={colors.faint}
                style={[styles.input, styles.notesInput]}
                multiline
                textAlignVertical="top"
              />
            </Field>
          </GlassCard>

          <SectionHeader title="Upcoming Work" note={`${counts[selectedCourse.id]?.open || 0} open items`} />
          <View style={styles.workList}>
            {selectedAssignments.length === 0 ? (
              <Text style={styles.emptyDay}>No assignments yet.</Text>
            ) : (
              selectedAssignments.slice(0, 5).map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  course={selectedCourse}
                  onPress={() => onOpenAssignment(assignment.id)}
                />
              ))
            )}
          </View>

          <SectionHeader title="Class Widget Shortcut" note="Open Widget Studio from More to use this class focus." />
          <View style={styles.widgetShortcut}>
            <Text style={styles.widgetShortcutTitle}>{selectedCourse.code}</Text>
            <Text style={styles.widgetShortcutCopy}>
              {counts[selectedCourse.id]?.open || 0} open · color and metadata ready for class widgets.
            </Text>
          </View>
        </>
      ) : null}

      <SectionHeader title="Add Class" note="Defaults include editable identity and grade weights" />
      <GlassCard style={styles.addCard}>
        <View style={styles.editGrid}>
          <TextInput
            value={newCourseCode}
            onChangeText={setNewCourseCode}
            placeholder="Class"
            placeholderTextColor={colors.faint}
            style={[styles.input, styles.fieldHalf]}
          />
          <TextInput
            value={newCourseInstructor}
            onChangeText={setNewCourseInstructor}
            placeholder="Teacher"
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
          label="Add Class"
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
      </GlassCard>

      <SectionHeader title="Quick Add" note="Manual work when you do not need a scan" />
      <GlassCard style={styles.addCard}>
        <SegmentedControl
          options={["assignment", "worksheet", "reading", "project", "exam"] as AssignmentKind[]}
          value={kind}
          onChange={setKind}
        />
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
          label="Add Work"
          icon={Edit3}
          disabled={!selectedCourse || !title.trim() || !dueDate.trim()}
          onPress={addItem}
        />
      </GlassCard>

      <SectionHeader title="Weekly Schedule" note="Class blocks by day" />
      <View style={styles.week}>
        {weekly.map(({ day, meetings }) => (
          <View key={day} style={styles.dayRow}>
            <Text style={styles.day}>{day}</Text>
            <View style={styles.meetingColumn}>
              {meetings.length === 0 ? (
                <Text style={styles.emptyDay}>No classes</Text>
              ) : (
                meetings.map((meeting) => (
                  <View key={meeting.id} style={styles.meeting}>
                    <View style={[styles.meetingDot, { backgroundColor: meeting.course.color }]} />
                    <View style={styles.meetingCopy}>
                      <Text style={styles.meetingTime}>{meeting.course.code} · {meeting.startTime} to {meeting.endTime}</Text>
                      <Text style={styles.meetingPlace}>{meeting.location}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <View style={styles.fieldHalf}>
        <Text style={styles.inputLabel}>{label}</Text>
        {children}
      </View>
    );
  }
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    hero: {
      gap: spacing.md
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md
    },
    kicker: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    heroTitle: {
      ...typography.title,
      color: colors.heroText
    },
    heroCopy: {
      ...typography.body,
      color: colors.heroMuted
    },
    semesterDates: {
      flexDirection: "row",
      gap: spacing.sm
    },
    dateInput: {
      flex: 1,
      minHeight: 42,
      borderRadius: radii.md,
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      color: colors.heroText,
      paddingHorizontal: spacing.sm,
      fontSize: 13,
      fontWeight: "900"
    },
    courseList: {
      gap: spacing.sm
    },
    detailCard: {
      gap: spacing.md
    },
    classHero: {
      minHeight: 112,
      borderRadius: radii.xl,
      padding: spacing.lg,
      justifyContent: "flex-end"
    },
    classHeroTitle: {
      color: "#FFFFFF",
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "900"
    },
    classHeroMeta: {
      color: "rgba(255,255,255,0.82)",
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    editGrid: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "stretch"
    },
    fieldHalf: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs
    },
    inputLabel: {
      color: colors.faint,
      fontSize: 12,
      fontWeight: "900"
    },
    input: {
      minWidth: 0,
      minHeight: 46,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      color: colors.ink,
      backgroundColor: colors.canvas,
      paddingHorizontal: spacing.sm,
      fontSize: 15,
      fontWeight: "800"
    },
    notesInput: {
      minHeight: 92,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      lineHeight: 20
    },
    colorRail: {
      flexDirection: "row",
      gap: spacing.sm
    },
    colorSwatch: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 3,
      borderColor: "transparent"
    },
    colorSwatchActive: {
      borderColor: colors.ink
    },
    workList: {
      gap: spacing.sm
    },
    emptyDay: {
      overflow: "hidden",
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      color: colors.faint,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "800"
    },
    widgetShortcut: {
      borderRadius: radii.xl,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.line,
      padding: spacing.lg,
      gap: 4
    },
    widgetShortcutTitle: {
      color: colors.ink,
      fontSize: 19,
      lineHeight: 25,
      fontWeight: "900"
    },
    widgetShortcutCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    },
    addCard: {
      gap: spacing.sm
    },
    week: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      overflow: "hidden"
    },
    dayRow: {
      minHeight: 64,
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      padding: spacing.sm,
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
    meetingDot: {
      width: 10,
      height: 10,
      borderRadius: 5
    },
    meetingCopy: {
      flex: 1
    },
    meetingTime: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: "900"
    },
    meetingPlace: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17
    }
  });
}
