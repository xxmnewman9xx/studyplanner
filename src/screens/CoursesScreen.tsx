import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Edit3, NotebookPen, Plus } from "lucide-react-native";
import {
  AssignmentRow,
  ClassIdentityCard,
  GlassCard,
  SegmentedControl
} from "../components/AppleComponents";
import { AppButton } from "../components/AppButton";
import { SectionHeader } from "../components/SectionHeader";
import { Assignment, AssignmentKind, Course, Semester, StudyNote } from "../models";
import {
  formatDateOnly,
  getClassAssignmentCounts,
  groupMeetingsByDay
} from "../logic/planner";
import { parseQuickHomeworkInput } from "../services/quickHomeworkParser";
import { AppTheme, classColors } from "../theme";
import { useAppTheme } from "../themeContext";
import { courseEmoji } from "../utils/courseVisuals";

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
  onAddCourse: (course: Pick<Course, "code" | "name" | "instructor">) => void;
  onUpdateCourse: (courseId: string, patch: Partial<Course>) => void;
};

export function CoursesScreen({
  semester,
  courses,
  assignments,
  notes = [],
  onAddQuickAssignment,
  onOpenAssignment,
  onOpenNotes,
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
  const parsedQuickWork = parseQuickHomeworkInput(title, courses, selectedCourse, dueDate);
  const selectedAssignments = selectedCourse
    ? assignments
        .filter((assignment) => assignment.courseId === selectedCourse.id)
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    : [];
  const selectedNotes = selectedCourse
    ? notes
        .filter((note) => note.courseId === selectedCourse.id)
        .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
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
    if (!parsedQuickWork.course || !parsedQuickWork.title.trim() || !parsedQuickWork.dueDate.trim()) return;
    const added = onAddQuickAssignment(parsedQuickWork.course.id, parsedQuickWork.title, parsedQuickWork.dueDate, kind);
    if (!added) return;

    setSelectedCourseId(parsedQuickWork.course.id);
    setTitle("");
    setDueDate("");
  };

  return (
    <View>
      <GlassCard tone="hero" style={styles.hero}>
        <View style={styles.heroOrbPrimary} />
        <View style={styles.heroOrbSecondary} />
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.kicker}>Class library</Text>
            <Text style={styles.heroTitle}>{semester.name}</Text>
            <Text style={styles.heroCopy}>
              Personal journals, teacher context, notes, and open work for every class.
            </Text>
          </View>
          <View style={styles.classCountBadge}>
            <Text style={styles.classCountValue}>{courses.length}</Text>
            <Text style={styles.classCountLabel}>Classes</Text>
          </View>
        </View>
        <View style={styles.semesterMetaRow}>
          <Text style={styles.semesterMetaText}>{formatDateOnly(semester.startDate)} → {formatDateOnly(semester.endDate)}</Text>
          <Text style={styles.semesterMetaText}>{assignments.filter((assignment) => assignment.status !== "done" && assignment.status !== "archived").length} open items</Text>
        </View>
        <View style={styles.semesterDates}>
          <TextInput
            value={semester.startDate}
            onChangeText={(startDate) => onUpdateSemester({ startDate })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.heroMuted}
            style={styles.dateInput}
          />
          <TextInput
            value={semester.endDate}
            onChangeText={(endDate) => onUpdateSemester({ endDate })}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.heroMuted}
            style={styles.dateInput}
          />
        </View>
      </GlassCard>

      <SectionHeader title="Your classes" note="Tap a class to see homework, teacher, room, and notes." />
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
          <SectionHeader title={selectedCourse.code} note="Edit this class and see what is due." />
          <GlassCard style={styles.detailCard}>
            <View style={[styles.classHero, { backgroundColor: selectedCourse.color }]}> 
              <View style={styles.classHeroTexture} />
              <View style={styles.classHeroInitialWrap}>
                <Text style={styles.classHeroInitial}>{courseEmoji(selectedCourse)}</Text>
              </View>
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
                  placeholderTextColor={colors.heroMuted}
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
                  placeholderTextColor={colors.heroMuted}
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
                  placeholderTextColor={colors.heroMuted}
                  style={styles.input}
                />
              </Field>
              <Field label="Room">
                <TextInput
                  value={selectedCourse.room || ""}
                  onChangeText={(room) => onUpdateCourse(selectedCourse.id, { room })}
                  placeholder="Room"
                  placeholderTextColor={colors.heroMuted}
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
                placeholderTextColor={colors.heroMuted}
                style={[styles.input, styles.notesInput]}
                multiline
                textAlignVertical="top"
              />
            </Field>
          </GlassCard>

          <SectionHeader title="Linked notes" note="Real Notes records attached to this class." />
          <GlassCard style={styles.linkedNotesCard}>
            {selectedNotes.length ? selectedNotes.slice(0, 3).map((note) => (
              <TouchableOpacity key={note.id} accessibilityRole="button" style={styles.linkedNoteRow} onPress={onOpenNotes}>
                <View style={styles.linkedNoteIcon}><NotebookPen color={colors.accent} size={16} /></View>
                <View style={styles.linkedNoteCopy}>
                  <Text style={styles.linkedNoteTitle}>{note.pinned ? "Pinned · " : ""}{note.title}</Text>
                  <Text style={styles.linkedNoteBody}>{note.body}</Text>
                </View>
              </TouchableOpacity>
            )) : (
              <TouchableOpacity accessibilityRole="button" style={styles.linkedNoteEmpty} onPress={onOpenNotes}>
                <Text style={styles.linkedNoteTitle}>No linked notes yet</Text>
                <Text style={styles.linkedNoteBody}>Open Notes to add teacher preferences, rubric clues, links, or lecture context for {selectedCourse.code}.</Text>
              </TouchableOpacity>
            )}
          </GlassCard>

          <SectionHeader title="Homework for this class" note={`${counts[selectedCourse.id]?.open || 0} still open`} />
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

          <SectionHeader title="Class widget preview" note="This is how the class can appear in Widget Studio." />
          <View style={styles.widgetShortcut}>
            <Text style={styles.widgetShortcutTitle}>{selectedCourse.code}</Text>
            <Text style={styles.widgetShortcutCopy}>
              {counts[selectedCourse.id]?.open || 0} open · color and metadata ready for Plus class templates.
            </Text>
          </View>
        </>
      ) : null}

      <SectionHeader title="Add a class" note="Type the class name, teacher, and room." />
      <GlassCard style={styles.addCard}>
        <View style={styles.editGrid}>
          <TextInput
            value={newCourseCode}
            onChangeText={setNewCourseCode}
            placeholder="Class"
            placeholderTextColor={colors.heroMuted}
            style={[styles.input, styles.fieldHalf]}
          />
          <TextInput
            value={newCourseInstructor}
            onChangeText={setNewCourseInstructor}
            placeholder="Teacher"
            placeholderTextColor={colors.heroMuted}
            style={[styles.input, styles.fieldHalf]}
          />
        </View>
        <TextInput
          value={newCourseName}
          onChangeText={setNewCourseName}
          placeholder="Course name"
          placeholderTextColor={colors.heroMuted}
          style={styles.input}
        />
        <AppButton
          label="Add this class"
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

      <SectionHeader title="Add homework to a class" note="Example: HIST chapter 4 notes tomorrow" />
      <GlassCard style={styles.addCard}>
        <SegmentedControl
          options={["assignment", "worksheet", "reading", "project", "exam"] as AssignmentKind[]}
          value={kind}
          onChange={setKind}
        />
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="HIST chapter 4 notes tomorrow"
          placeholderTextColor={colors.heroMuted}
          style={styles.input}
        />
        <TextInput
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.heroMuted}
          style={styles.input}
        />
        {title.trim() ? (
          <Text style={styles.quickParsePreview}>
            Will add {parsedQuickWork.course?.code || selectedCourse?.code || "class"} · {parsedQuickWork.title || "work"} · due {formatDateOnly(parsedQuickWork.dueDate)}
          </Text>
        ) : null}
        <AppButton
          label="Add homework"
          icon={Edit3}
          disabled={!parsedQuickWork.course || !parsedQuickWork.title.trim() || !parsedQuickWork.dueDate.trim()}
          onPress={addItem}
        />
      </GlassCard>

      <SectionHeader title="Weekly schedule" note="When and where each class meets." />
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
                    <View style={[styles.meetingDot, { backgroundColor: meeting.course.color }]}>
                      <Text style={styles.meetingDotEmoji}>{courseEmoji(meeting.course)}</Text>
                    </View>
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
      gap: spacing.md,
      overflow: "hidden"
    },
    heroOrbPrimary: {
      position: "absolute",
      right: -62,
      top: -80,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: colors.accent,
      opacity: theme.isDark ? 0.18 : 0.08
    },
    heroOrbSecondary: {
      position: "absolute",
      left: -54,
      bottom: -72,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: colors.brandViolet,
      opacity: theme.isDark ? 0.14 : 0.07
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md
    },
    kicker: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.8,
      textTransform: "uppercase"
    },
    heroTitle: {
      ...typography.title,
      color: colors.heroText,
      letterSpacing: -0.7
    },
    heroCopy: {
      ...typography.body,
      color: colors.heroMuted,
      fontWeight: "600"
    },
    classCountBadge: {
      width: 70,
      minHeight: 58,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "rgba(255,255,255,0.10)",
      alignItems: "center",
      justifyContent: "center"
    },
    classCountValue: {
      color: colors.heroText,
      fontSize: 21,
      lineHeight: 25,
      fontWeight: "900"
    },
    classCountLabel: {
      color: colors.heroMuted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      letterSpacing: 0.6,
      textTransform: "uppercase"
    },
    semesterMetaRow: {
      minHeight: 42,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.16)",
      backgroundColor: "rgba(255,255,255,0.08)",
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    semesterMetaText: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    semesterDates: {
      flexDirection: "row",
      gap: spacing.sm
    },
    dateInput: {
      flex: 1,
      minHeight: 42,
      borderRadius: radii.md,
      backgroundColor: "rgba(255,255,255,0.10)",
      borderWidth: StyleSheet.hairlineWidth,
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
      gap: spacing.md,
      overflow: "hidden",
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)",
      backgroundColor: colors.heroSurface
    },
    classHero: {
      minHeight: 132,
      borderRadius: radii.xl,
      padding: spacing.lg,
      justifyContent: "space-between",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.24)",
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.32 : 0.18,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
      elevation: 5
    },
    classHeroTexture: {
      position: "absolute",
      right: -34,
      top: -42,
      width: 118,
      height: 118,
      borderRadius: 59,
      backgroundColor: "rgba(255,255,255,0.18)"
    },
    classHeroInitialWrap: {
      width: 46,
      height: 46,
      borderRadius: 17,
      backgroundColor: "rgba(255,255,255,0.18)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.28)",
      alignItems: "center",
      justifyContent: "center"
    },
    classHeroInitial: {
      color: "#FFFFFF",
      fontSize: 23,
      lineHeight: 28,
      fontWeight: "900"
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
      color: colors.heroMuted,
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.5,
      textTransform: "uppercase"
    },
    input: {
      minWidth: 0,
      minHeight: 46,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      color: colors.heroText,
      backgroundColor: "rgba(255,255,255,0.1)",
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
    quickParsePreview: {
      color: colors.heroMuted,
      fontSize: 12,
      fontWeight: "800",
      lineHeight: 17
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
      borderColor: "transparent",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.28 : 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 5 }
    },
    colorSwatchActive: {
      borderColor: colors.heroText
    },
    linkedNotesCard: {
      gap: spacing.xs
    },
    linkedNoteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.sm
    },
    linkedNoteEmpty: {
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md,
      gap: 3
    },
    linkedNoteIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft
    },
    linkedNoteCopy: {
      flex: 1,
      minWidth: 0
    },
    linkedNoteTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    linkedNoteBody: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    workList: {
      gap: spacing.sm
    },
    emptyDay: {
      overflow: "hidden",
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
      backgroundColor: colors.heroSurface,
      padding: spacing.md,
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "800"
    },
    widgetShortcut: {
      borderRadius: radii.xl,
      backgroundColor: colors.heroSurface,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)",
      padding: spacing.lg,
      gap: 4,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.28 : 0.14,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4
    },
    widgetShortcutTitle: {
      color: colors.heroText,
      fontSize: 19,
      lineHeight: 25,
      fontWeight: "900"
    },
    widgetShortcutCopy: {
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    },
    addCard: {
      gap: spacing.sm,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)",
      backgroundColor: colors.heroSurface
    },
    week: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)",
      backgroundColor: colors.heroSurface,
      overflow: "hidden"
    },
    dayRow: {
      minHeight: 64,
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.12)",
      padding: spacing.sm,
      gap: spacing.sm
    },
    day: {
      width: 38,
      color: colors.heroText,
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
      width: 24,
      height: 24,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center"
    },
    meetingDotEmoji: {
      fontSize: 12,
      lineHeight: 16
    },
    meetingCopy: {
      flex: 1
    },
    meetingTime: {
      color: colors.heroText,
      fontSize: 13,
      fontWeight: "900"
    },
    meetingPlace: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17
    }
  });
}
