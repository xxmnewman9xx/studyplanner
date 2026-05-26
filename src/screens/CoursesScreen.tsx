import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CirclePlus, Edit3, NotebookPen } from "lucide-react-native";
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
  getClassAssignmentCounts,
  groupMeetingsByDay
} from "../logic/planner";
import { parseQuickHomeworkInput } from "../services/quickHomeworkParser";
import { AppTheme, classColors } from "../theme";
import { useAppTheme } from "../themeContext";
import { courseEmoji } from "../utils/courseVisuals";
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

type TranslateFn = (key: string, fallback?: string) => string;

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
  const { t, locale } = useI18n();
  const { colors } = theme;
  const styles = createStyles(theme);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [kind, setKind] = useState<AssignmentKind>("assignment");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseInstructor, setNewCourseInstructor] = useState("");
  const [editingSemesterDates, setEditingSemesterDates] = useState(false);
  const weekly = groupMeetingsByDay(courses);
  const counts = getClassAssignmentCounts(courses, assignments);
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0];
  const selectedCourseTitle = selectedCourse?.code || selectedCourse?.name || t("classes.class_fallback", "Class");
  const selectedCourseMeta = selectedCourse
    ? [selectedCourse.teacher || selectedCourse.instructor, selectedCourse.period, selectedCourse.room]
        .filter(Boolean)
        .join(" · ") || t("classes.add_teacher_period_room", "Add teacher, period, and room.")
    : "";
  const openAssignmentCount = assignments.filter((assignment) => assignment.status !== "done" && assignment.status !== "archived").length;
  const parsedQuickWork = parseQuickHomeworkInput(title, courses, selectedCourse, dueDate);
  const selectedAssignments = selectedCourse
    ? assignments
        .filter((assignment) => assignment.courseId === selectedCourse.id)
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    : [];
  const selectedOpenAssignments = selectedAssignments.filter(
    (assignment) => assignment.status !== "done" && assignment.status !== "archived"
  );
  const selectedNextAssignment = selectedOpenAssignments[0];
  const selectedNotes = selectedCourse
    ? notes
        .filter((note) => note.courseId === selectedCourse.id)
        .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    : [];
  const needsReviewCount = Object.values(counts).reduce((sum, item) => sum + item.needsReview, 0);
  const classHealth = buildClassHealth(courses.length, openAssignmentCount, needsReviewCount, t);

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
        <View style={styles.heroTop}>
          <View style={styles.heroTitleBlock}>
            <Text style={styles.kicker}>{t("classes.library", "Class library")}</Text>
            <Text style={styles.heroTitle}>{semester.name}</Text>
            <Text style={styles.heroCopy}>
              {t("classes.hero_copy", "Classes, rooms, notes, and open work in one place.")}
            </Text>
          </View>
          <View style={styles.classCountBadge}>
            <Text style={styles.classCountValue}>{courses.length}</Text>
            <Text style={styles.classCountLabel}>{t("tabs.classes", "Classes")}</Text>
          </View>
        </View>
        <View style={styles.semesterMetaRow}>
          <Text style={styles.semesterMetaText}>{formatClassDate(semester.startDate, locale, t)} → {formatClassDate(semester.endDate, locale, t)}</Text>
          <Text style={styles.semesterMetaText}>
            {formatLocalized(t("classes.open_count", "{count} open"), { count: String(openAssignmentCount) })}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.semesterDateSummary}
          onPress={() => setEditingSemesterDates((current) => !current)}
        >
          <View style={styles.dateSummaryItem}>
            <Text style={styles.dateSummaryLabel}>{t("classes.starts", "Starts")}</Text>
            <Text style={styles.dateSummaryValue}>{formatClassDate(semester.startDate, locale, t)}</Text>
          </View>
          <View style={styles.dateSummaryItem}>
            <Text style={styles.dateSummaryLabel}>{t("classes.ends", "Ends")}</Text>
            <Text style={styles.dateSummaryValue}>{formatClassDate(semester.endDate, locale, t)}</Text>
          </View>
          <Text style={styles.editDatesText}>{editingSemesterDates ? t("classes.done", "Done") : t("classes.edit", "Edit")}</Text>
        </TouchableOpacity>
        {editingSemesterDates ? (
          <View style={styles.semesterDates}>
            <TextInput
              value={semester.startDate}
              onChangeText={(startDate) => onUpdateSemester({ startDate })}
              placeholder={t("classes.date_placeholder", "YYYY-MM-DD")}
              placeholderTextColor={colors.heroMuted}
              style={styles.dateInput}
            />
            <TextInput
              value={semester.endDate}
              onChangeText={(endDate) => onUpdateSemester({ endDate })}
              placeholder={t("classes.date_placeholder", "YYYY-MM-DD")}
              placeholderTextColor={colors.heroMuted}
              style={styles.dateInput}
            />
          </View>
        ) : null}
      </GlassCard>

      {selectedCourse ? (
        <GlassCard style={styles.courseHubCard}>
          <View style={styles.courseHubTop}>
            <View style={[styles.courseHubIcon, { backgroundColor: selectedCourse.color }]}>
              <Text style={styles.courseHubEmoji}>{courseEmoji(selectedCourse)}</Text>
            </View>
            <View style={styles.courseHubCopy}>
              <Text style={styles.courseHubKicker}>{t("classes.course_hub", "Course hub")}</Text>
              <Text style={styles.courseHubTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
                {selectedCourse.code} · {selectedCourse.name || t("classes.class_fallback", "Class")}
              </Text>
              <Text style={styles.courseHubMeta} numberOfLines={1}>
                {selectedCourseMeta}
              </Text>
            </View>
          </View>
          <View style={styles.courseHubStats}>
            <ClassStateTile label={t("classes.open", "Open")} value={String(selectedOpenAssignments.length)} detail={selectedNextAssignment?.title || t("classes.no_homework", "no homework")} />
            <ClassStateTile label={t("tabs.notes", "Notes")} value={String(selectedNotes.length)} detail={selectedNotes[0]?.title || t("classes.ready", "ready")} />
            <ClassStateTile label={t("classes.meets", "Meets")} value={String(selectedCourse.meetings?.length || 0)} detail={selectedCourse.meetings?.[0]?.location || t("classes.add_schedule", "add schedule")} />
          </View>
        </GlassCard>
      ) : null}

      {courses.length === 0 || needsReviewCount > 0 ? (
        <GlassCard style={styles.opsCard}>
          <View style={styles.opsHeader}>
            <View style={styles.opsHeaderCopy}>
              <Text style={styles.opsKicker}>{t("classes.state", "Classes state")}</Text>
              <Text style={styles.opsTitle}>{classHealth.title}</Text>
            </View>
            <Text style={styles.opsBadge}>{classHealth.badge}</Text>
          </View>
          <Text style={styles.opsCopy}>{classHealth.copy}</Text>
          <View style={styles.opsGrid}>
            <ClassStateTile label={t("classes.open", "Open")} value={String(openAssignmentCount)} detail={t("classes.across_classes", "across classes")} />
            <ClassStateTile label={t("today.metric_review", "Review")} value={String(needsReviewCount)} detail={needsReviewCount ? t("classes.check_imports", "check imports") : t("classes.clean", "clean")} />
            <ClassStateTile label={t("tabs.notes", "Notes")} value={String(notes.length)} detail={notes.length ? t("classes.linked_context", "linked context") : t("classes.ready", "ready")} />
          </View>
        </GlassCard>
      ) : null}

      <SectionHeader title={t("classes.your_classes", "Your classes")} note={t("classes.your_classes_note", "Tap a class to see homework, teacher, room, and notes.")} />
      <View style={styles.courseList}>
        {courses.length === 0 ? (
          <GlassCard style={styles.emptyClassCard}>
            <Text style={styles.emptyClassTitle}>{t("classes.add_first_class", "Add your first class")}</Text>
            <Text style={styles.emptyClassCopy}>{t("classes.homework_needs_class", "Homework needs a class so Today, reminders, and widgets know where it belongs.")}</Text>
          </GlassCard>
        ) : courses.map((course) => (
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
          <SectionHeader title={selectedCourseTitle} note={t("classes.detail_note", "Edit details and see what is due.")} />
          <GlassCard style={styles.detailCard}>
            <View style={[styles.classHero, { backgroundColor: selectedCourse.color }]}> 
              <View style={styles.classHeroTexture} />
              <View style={styles.classHeroInitialWrap}>
                <Text style={styles.classHeroInitial}>{courseEmoji(selectedCourse)}</Text>
              </View>
              <Text style={styles.classHeroTitle} numberOfLines={2}>{selectedCourse.name || selectedCourseTitle}</Text>
              <Text style={styles.classHeroMeta}>{selectedCourseMeta}</Text>
            </View>
            <View style={styles.detailStats}>
              <View style={styles.detailStat}>
                <Text style={styles.detailStatValue}>{counts[selectedCourse.id]?.open || 0}</Text>
                <Text style={styles.detailStatLabel}>{t("classes.open", "Open")}</Text>
              </View>
              <View style={styles.detailStat}>
                <Text style={styles.detailStatValue}>{selectedNotes.length}</Text>
                <Text style={styles.detailStatLabel}>{t("tabs.notes", "Notes")}</Text>
              </View>
              <View style={styles.detailStat}>
                <Text style={styles.detailStatValue}>{selectedCourse.meetings?.length || "0"}</Text>
                <Text style={styles.detailStatLabel}>{t("classes.meets", "Meets")}</Text>
              </View>
            </View>
            <View style={styles.editGrid}>
              <Field label={t("classes.field_class", "Class")}>
                <TextInput
                  value={selectedCourse.code}
                  onChangeText={(code) => onUpdateCourse(selectedCourse.id, { code })}
                  placeholder={t("classes.class_placeholder", "Algebra II")}
                  placeholderTextColor={colors.heroMuted}
                  style={styles.input}
                />
              </Field>
              <Field label={t("classes.field_teacher", "Teacher")}>
                <TextInput
                  value={selectedCourse.teacher || selectedCourse.instructor || ""}
                  onChangeText={(teacher) =>
                    onUpdateCourse(selectedCourse.id, { teacher, instructor: teacher })
                  }
                  placeholder={t("classes.teacher_placeholder", "Teacher")}
                  placeholderTextColor={colors.heroMuted}
                  style={styles.input}
                />
              </Field>
            </View>
            <View style={styles.editGrid}>
              <Field label={t("classes.field_period", "Period")}>
                <TextInput
                  value={selectedCourse.period || ""}
                  onChangeText={(period) => onUpdateCourse(selectedCourse.id, { period })}
                  placeholder={t("classes.period_placeholder", "Period 4")}
                  placeholderTextColor={colors.heroMuted}
                  style={styles.input}
                />
              </Field>
              <Field label={t("classes.field_room", "Room")}>
                <TextInput
                  value={selectedCourse.room || ""}
                  onChangeText={(room) => onUpdateCourse(selectedCourse.id, { room })}
                  placeholder={t("classes.room_placeholder", "Room")}
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
            <Field label={t("classes.field_class_notes", "Class notes")}>
              <TextInput
                value={selectedCourse.notes || ""}
                onChangeText={(notes) => onUpdateCourse(selectedCourse.id, { notes })}
                placeholder={t("classes.notes_placeholder", "Things to remember, teacher preferences, links, or quick class notes")}
                placeholderTextColor={colors.heroMuted}
                style={[styles.input, styles.notesInput]}
                multiline
                textAlignVertical="top"
              />
            </Field>
          </GlassCard>

          <SectionHeader title={t("classes.linked_notes", "Linked notes")} note={t("classes.linked_notes_note", "Notes attached to this class.")} />
          <GlassCard style={styles.linkedNotesCard}>
            {selectedNotes.length ? selectedNotes.slice(0, 3).map((note) => (
              <TouchableOpacity key={note.id} accessibilityRole="button" style={styles.linkedNoteRow} onPress={onOpenNotes}>
                <View style={styles.linkedNoteIcon}><NotebookPen color={colors.accent} size={16} /></View>
                <View style={styles.linkedNoteCopy}>
                  <Text style={styles.linkedNoteTitle} numberOfLines={1}>{note.pinned ? `${t("classes.pinned", "Pinned")} · ` : ""}{note.title}</Text>
                  <Text style={styles.linkedNoteBody} numberOfLines={2}>{note.body}</Text>
                </View>
              </TouchableOpacity>
            )) : (
              <TouchableOpacity accessibilityRole="button" style={styles.linkedNoteEmpty} onPress={onOpenNotes}>
                <Text style={styles.linkedNoteTitle}>{t("classes.no_linked_notes", "No linked notes yet")}</Text>
                <Text style={styles.linkedNoteBody}>
                  {formatLocalized(t("classes.open_notes_for_context", "Open Notes to save agenda context for {course}."), {
                    course: selectedCourseTitle
                  })}
                </Text>
              </TouchableOpacity>
            )}
          </GlassCard>

          <SectionHeader
            title={t("classes.homework_for_class", "Homework for this class")}
            note={formatLocalized(t("classes.still_open_count", "{count} still open"), {
              count: String(counts[selectedCourse.id]?.open || 0)
            })}
          />
          <View style={styles.workList}>
            {selectedAssignments.length === 0 ? (
              <Text style={styles.emptyDay}>{t("classes.no_homework_for_class", "No homework for this class yet. Add one below or scan a syllabus from the Scan tab.")}</Text>
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

        </>
      ) : null}

      <SectionHeader title={t("classes.add_class", "Add a class")} note={t("classes.add_class_note", "Type the class name, teacher, and room.")} />
      <GlassCard style={styles.addCard}>
        <View style={styles.editGrid}>
          <TextInput
            value={newCourseCode}
            onChangeText={setNewCourseCode}
            placeholder={t("classes.new_code_placeholder", "BIO 101 or Algebra II")}
            placeholderTextColor={colors.heroMuted}
            style={[styles.input, styles.fieldHalf]}
          />
          <TextInput
            value={newCourseInstructor}
            onChangeText={setNewCourseInstructor}
            placeholder={t("classes.teacher_placeholder", "Teacher")}
            placeholderTextColor={colors.heroMuted}
            style={[styles.input, styles.fieldHalf]}
          />
        </View>
        <TextInput
          value={newCourseName}
          onChangeText={setNewCourseName}
          placeholder={t("classes.course_name_placeholder", "Course name")}
          placeholderTextColor={colors.heroMuted}
          style={styles.input}
        />
        <AppButton
          label={t("classes.add_this_class", "Add this class")}
          icon={CirclePlus}
          onPress={() => {
            const added = onAddCourse({
              code: newCourseCode,
              name: newCourseName,
              instructor: newCourseInstructor
            });
            if (!added) return;
            setNewCourseCode("");
            setNewCourseName("");
            setNewCourseInstructor("");
          }}
        />
      </GlassCard>

      <SectionHeader title={t("classes.add_homework_to_class", "Add homework to a class")} note={t("classes.homework_example", "Example: HIST chapter 4 notes tomorrow")} />
      <GlassCard style={styles.addCard}>
        <SegmentedControl
          options={["assignment", "worksheet", "reading", "project", "exam"] as AssignmentKind[]}
          value={kind}
          onChange={setKind}
          labelForOption={(option) => assignmentKindLabel(option, t)}
        />
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t("classes.homework_placeholder", "HIST chapter 4 notes tomorrow")}
          placeholderTextColor={colors.heroMuted}
          style={styles.input}
        />
        <TextInput
          value={dueDate}
          onChangeText={setDueDate}
          placeholder={t("classes.date_placeholder", "YYYY-MM-DD")}
          placeholderTextColor={colors.heroMuted}
          style={styles.input}
        />
        {title.trim() ? (
          <Text style={styles.quickParsePreview}>
            {formatLocalized(t("classes.quick_parse_preview", "Will add {course} · {title} · due {date}"), {
              course: parsedQuickWork.course?.code || selectedCourse?.code || t("classes.class_fallback", "class"),
              title: parsedQuickWork.title || t("classes.work_fallback", "work"),
              date: formatClassDate(parsedQuickWork.dueDate, locale, t)
            })}
          </Text>
        ) : null}
        <AppButton
          label={t("classes.add_homework", "Add homework")}
          icon={Edit3}
          disabled={!parsedQuickWork.course || !parsedQuickWork.title.trim() || !parsedQuickWork.dueDate.trim()}
          onPress={addItem}
        />
      </GlassCard>

      <SectionHeader title={t("classes.weekly_schedule", "Weekly schedule")} note={t("classes.weekly_schedule_note", "When and where each class meets.")} />
      <View style={styles.week}>
        {weekly.map(({ day, meetings }) => (
          <View key={day} style={styles.dayRow}>
            <Text style={styles.day}>{weekdayLabel(day, t)}</Text>
            <View style={styles.meetingColumn}>
              {meetings.length === 0 ? (
                <Text style={styles.emptyDay}>{t("classes.no_classes", "No classes")}</Text>
              ) : (
                meetings.map((meeting) => (
                  <View key={meeting.id} style={styles.meeting}>
                    <View style={[styles.meetingDot, { backgroundColor: meeting.course.color }]}>
                      <Text style={styles.meetingDotEmoji}>{courseEmoji(meeting.course)}</Text>
                    </View>
                    <View style={styles.meetingCopy}>
                      <Text style={styles.meetingTime}>
                        {formatLocalized(t("classes.meeting_time", "{course} · {start} to {end}"), {
                          course: meeting.course.code,
                          start: meeting.startTime,
                          end: meeting.endTime
                        })}
                      </Text>
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

function buildClassHealth(courseCount: number, openCount: number, reviewCount: number, t: TranslateFn) {
  if (courseCount === 0) {
    return {
      title: t("classes.health_no_library_title", "No class library yet."),
      copy: t("classes.health_no_library_copy", "Add a class manually or scan a syllabus. Homework, notes, grades, and widgets need class context."),
      badge: t("classes.health_setup", "Setup")
    };
  }

  if (reviewCount > 0) {
    return {
      title: t("classes.health_review_title", "Imported classwork needs review."),
      copy: t("classes.health_review_copy", "Open flagged assignments from Today or the class list before trusting reminders and widgets."),
      badge: t("today.metric_review", "Review")
    };
  }

  if (openCount > 0) {
    return {
      title: t("classes.health_live_title", "Classes are carrying live work."),
      copy: t("classes.health_live_copy", "Use each class detail to adjust teacher, period, room, notes, and the next homework items."),
      badge: t("classes.health_live", "Live")
    };
  }

  return {
    title: t("classes.health_clean_title", "Classes are clean right now."),
    copy: t("classes.health_clean_copy", "Your class shells are ready. Capture homework after class or import the next syllabus."),
    badge: t("classes.health_clear", "Clear")
  };
}

function assignmentKindLabel(kind: AssignmentKind, t: TranslateFn) {
  const labels: Record<AssignmentKind, string> = {
    assignment: t("classes.kind_assignment", "Assignment"),
    worksheet: t("classes.kind_worksheet", "Worksheet"),
    reading: t("classes.kind_reading", "Reading"),
    project: t("classes.kind_project", "Project"),
    exam: t("classes.kind_exam", "Exam")
  };
  return labels[kind];
}

function weekdayLabel(day: string, t: TranslateFn) {
  const labels: Record<string, string> = {
    Mon: t("classes.weekday_mon", "Mon"),
    Tue: t("classes.weekday_tue", "Tue"),
    Wed: t("classes.weekday_wed", "Wed"),
    Thu: t("classes.weekday_thu", "Thu"),
    Fri: t("classes.weekday_fri", "Fri"),
    Sat: t("classes.weekday_sat", "Sat"),
    Sun: t("classes.weekday_sun", "Sun")
  };
  return labels[day] || day;
}

function formatClassDate(value: string, locale: string, t: TranslateFn) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value || "")) return t("classes.check_date", "Check date");
  try {
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
  } catch {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
  }
}

function formatLocalized(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((copy, [key, value]) => copy.split(`{${key}}`).join(value), template);
}

function ClassStateTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.classStateTile}>
      <Text style={styles.classStateLabel}>{label}</Text>
      <Text style={styles.classStateValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{value}</Text>
      <Text style={styles.classStateDetail} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.74}>{detail}</Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    hero: {
      gap: spacing.sm,
      padding: spacing.md,
      overflow: "hidden"
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md
    },
    heroTitleBlock: {
      flex: 1,
      minWidth: 0
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
      color: colors.heroText,
      fontSize: 29,
      lineHeight: 34,
      fontWeight: "900",
      letterSpacing: 0
    },
    heroCopy: {
      color: colors.heroMuted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600"
    },
    classCountBadge: {
      width: 64,
      minHeight: 52,
      flexShrink: 0,
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
    semesterDateSummary: {
      minHeight: 50,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.16)",
      backgroundColor: "rgba(255,255,255,0.08)",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    dateSummaryItem: {
      flex: 1,
      minWidth: 0
    },
    dateSummaryLabel: {
      color: colors.heroMuted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      letterSpacing: 0.5,
      textTransform: "uppercase"
    },
    dateSummaryValue: {
      color: colors.heroText,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    editDatesText: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    dateInput: {
      flex: 1,
      minHeight: 38,
      borderRadius: radii.md,
      backgroundColor: "rgba(255,255,255,0.10)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)",
      color: colors.heroText,
      paddingHorizontal: spacing.sm,
      fontSize: 13,
      fontWeight: "900"
    },
    courseHubCard: {
      gap: spacing.md,
      marginTop: spacing.sm,
      padding: spacing.md,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(49,91,255,0.16)",
      backgroundColor: colors.heroSurface
    },
    courseHubTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm
    },
    courseHubIcon: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.24)"
    },
    courseHubEmoji: {
      fontSize: 24,
      lineHeight: 30
    },
    courseHubCopy: {
      flex: 1,
      minWidth: 0,
      gap: 1
    },
    courseHubKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.6,
      textTransform: "uppercase"
    },
    courseHubTitle: {
      color: colors.heroText,
      fontSize: 19,
      lineHeight: 24,
      fontWeight: "900"
    },
    courseHubMeta: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    courseHubStats: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginTop: 2
    },
    opsCard: {
      gap: spacing.sm,
      marginTop: spacing.sm,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(49,91,255,0.16)",
      backgroundColor: colors.heroSurface
    },
    opsHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    opsHeaderCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    opsKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.6,
      textTransform: "uppercase"
    },
    opsTitle: {
      color: colors.heroText,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    opsBadge: {
      borderRadius: radii.round,
      overflow: "hidden",
      backgroundColor: colors.accentSoft,
      color: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    opsCopy: {
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700"
    },
    opsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    classStateTile: {
      flex: 1,
      minWidth: 92,
      minHeight: 72,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.16)",
      backgroundColor: "rgba(255,255,255,0.08)",
      padding: spacing.sm,
      gap: 3
    },
    classStateLabel: {
      color: colors.heroMuted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.4
    },
    classStateValue: {
      color: colors.heroText,
      fontSize: 19,
      lineHeight: 23,
      fontWeight: "900"
    },
    classStateDetail: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    courseList: {
      gap: spacing.sm
    },
    emptyClassCard: {
      gap: spacing.xs,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)",
      backgroundColor: colors.heroSurface
    },
    emptyClassTitle: {
      color: colors.heroText,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "900"
    },
    emptyClassCopy: {
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
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
    detailStats: {
      flexDirection: "row",
      gap: spacing.sm
    },
    detailStat: {
      flex: 1,
      minWidth: 0,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.16)",
      backgroundColor: "rgba(255,255,255,0.08)",
      padding: spacing.sm
    },
    detailStatValue: {
      color: colors.heroText,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    detailStatLabel: {
      color: colors.heroMuted,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900",
      letterSpacing: 0.5,
      textTransform: "uppercase"
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
