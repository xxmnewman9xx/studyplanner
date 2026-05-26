import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Archive, CheckCircle2, Save, Timer, X } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import {
  EmojiBadge,
  GlassCard,
  SegmentedControl
} from "../components/AppleComponents";
import { Assignment, AssignmentKind, AssignmentStatus, ChecklistItem, Course, Priority } from "../models";
import {
  getCourseForAssignment,
  isValidDeadline,
  isValidDateInput,
  isValidTimeInput,
  normalizeEstimatedMinutes
} from "../logic/planner";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { useI18n } from "../i18n";

type AssignmentDetailScreenProps = {
  assignment: Assignment;
  courses: Course[];
  onClose: () => void;
  onSave: (patch: Partial<Assignment>) => void;
  onArchive: () => void;
  onStartFocus: () => void;
};

const priorities: Priority[] = ["low", "medium", "high"];
const statuses: Array<Exclude<AssignmentStatus, "archived">> = [
  "not_started",
  "in_progress",
  "done"
];
const kinds: AssignmentKind[] = ["assignment", "worksheet", "reading", "project", "exam"];
type TranslateFn = (key: string, fallback?: string) => string;

export function AssignmentDetailScreen({
  assignment,
  courses,
  onClose,
  onSave,
  onArchive,
  onStartFocus
}: AssignmentDetailScreenProps) {
  const { theme } = useAppTheme();
  const { locale, t } = useI18n();
  const { colors } = theme;
  const styles = createStyles(theme);
  const course = getCourseForAssignment(courses, assignment);
  const [title, setTitle] = useState(assignment.title);
  const [dueDate, setDueDate] = useState(assignment.dueAt.slice(0, 10));
  const [dueTime, setDueTime] = useState(assignment.dueAt.slice(11, 16));
  const [estimatedMinutes, setEstimatedMinutes] = useState(String(assignment.estimatedMinutes));
  const [tags, setTags] = useState(assignment.tags.join(", "));
  const [priority, setPriority] = useState<Priority>(assignment.priority);
  const [status, setStatus] = useState<Exclude<AssignmentStatus, "archived">>(
    assignment.status === "archived" ? "not_started" : assignment.status
  );
  const [kind, setKind] = useState<AssignmentKind>(assignment.kind);
  const [courseId, setCourseId] = useState(assignment.courseId);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(assignment.checklist || []);

  const progress = checklist.length > 0
    ? checklist.filter((item) => item.done).length / checklist.length
    : assignment.progress || (status === "done" ? 1 : 0);
  const progressPercent = Math.round(progress * 100);
  const trustState = buildAssignmentTrustState(assignment, t);

  const dirty = useMemo(
    () =>
      title !== assignment.title ||
      dueDate !== assignment.dueAt.slice(0, 10) ||
      dueTime !== assignment.dueAt.slice(11, 16) ||
      Number.parseInt(estimatedMinutes, 10) !== assignment.estimatedMinutes ||
      tags !== assignment.tags.join(", ") ||
      priority !== assignment.priority ||
      status !== assignment.status ||
      kind !== assignment.kind ||
      courseId !== assignment.courseId ||
      JSON.stringify(checklist) !== JSON.stringify(assignment.checklist || []),
    [assignment, checklist, courseId, dueDate, dueTime, estimatedMinutes, kind, priority, status, tags, title]
  );

  const save = (override?: Partial<Assignment>) => {
    const cleanDueDate = dueDate || assignment.dueAt.slice(0, 10);

    const cleanDueTime = dueTime || "23:59";

    if (!isValidDateInput(cleanDueDate)) {
      Alert.alert(
        t("assignment_detail.check_date_title", "Check the date"),
        t("assignment_detail.check_date_message", "Use a real date in YYYY-MM-DD format before saving this assignment.")
      );
      return;
    }

    if (!isValidTimeInput(cleanDueTime)) {
      Alert.alert(
        t("assignment_detail.check_time_title", "Check the time"),
        t("assignment_detail.check_time_message", "Use a real time in HH:MM format before saving this assignment.")
      );
      return;
    }

    const nextChecklist = override?.checklist || checklist;
    const nextStatus = override?.status || status;
    const nextProgress = override?.progress ?? (
      nextStatus === "done"
        ? 1
        : nextChecklist.length > 0
          ? nextChecklist.filter((item) => item.done).length / nextChecklist.length
          : progress
    );
    const reviewCleared =
      assignment.needsReview ||
      assignment.duplicateOf ||
      (assignment.confidence || 1) < 0.75
        ? {
            needsReview: false,
            duplicateOf: undefined,
            confidence: Math.max(assignment.confidence || 0, 0.86)
          }
        : {};
    onSave({
      title: title.trim() || assignment.title,
      dueAt: `${cleanDueDate}T${cleanDueTime}:00`,
      estimatedMinutes: normalizeEstimatedMinutes(estimatedMinutes, assignment.estimatedMinutes),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      priority,
      status: nextStatus,
      kind,
      type: kind,
      courseId,
      checklist: nextChecklist,
      progress: nextProgress,
      ...reviewCleared,
      ...override
    });
  };

  const toggleChecklist = (itemId: string) => {
    setChecklist((current) =>
      current.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item))
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>{t("assignment_detail.kicker", "Assignment")}</Text>
          <Text style={styles.title} numberOfLines={2}>{assignment.title}</Text>
          <Text style={styles.subtitle}>
            {course?.code || t("assignment_detail.course_fallback", "Course")} · {formatAssignmentDetailDate(assignment.dueAt, locale, t)}
          </Text>
        </View>
        <TouchableOpacity accessibilityRole="button" style={styles.closeButton} onPress={onClose}>
          <X color={colors.ink} size={20} />
        </TouchableOpacity>
      </View>

      <GlassCard style={styles.trustCard}>
        <View style={styles.trustHeader}>
          <View style={styles.trustCopy}>
            <Text style={styles.trustKicker}>{t("assignment_detail.task_state", "Task state")}</Text>
            <Text style={styles.trustTitle}>{trustState.title}</Text>
          </View>
          <Text style={styles.trustBadge}>{trustState.badge}</Text>
        </View>
        <Text style={styles.trustDetail}>{trustState.detail}</Text>
      </GlassCard>

      <GlassCard tone="hero" style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.courseChip}>
            <View style={[styles.courseDot, { backgroundColor: course?.color || colors.brandPink }]} />
            <Text style={styles.courseChipText}>{course?.code || t("assignment_detail.class_fallback", "Class")}</Text>
          </View>
          {assignment.needsReview ? <EmojiBadge name="warning" label={t("assignment_detail.needs_check", "Needs check")} tone="gold" /> : null}
        </View>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroMeta}>
          {formatDetailTemplate(t("assignment_detail.hero_meta", "{kind} · {minutes} · {source} source"), {
            kind: labelizeOption(kind, t),
            minutes: formatMinutes(estimatedMinutes, t),
            source: labelizeSource(assignment.source, t)
          })}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` as `${number}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {formatDetailTemplate(t("assignment_detail.progress_complete", "{percent}% complete"), { percent: progressPercent })}
        </Text>
        <View style={styles.heroActions}>
          <AppButton label={t("assignment_detail.study_this_now", "Study this now")} icon={Timer} onPress={onStartFocus} style={styles.heroButton} />
          <AppButton
            label={t("assignment_detail.mark_task_done", "Mark task done")}
            icon={CheckCircle2}
            variant="secondary"
            onPress={() => {
              const completedChecklist = checklist.map((item) => ({ ...item, done: true }));
              setStatus("done");
              setChecklist(completedChecklist);
              save({ status: "done", progress: 1, checklist: completedChecklist });
            }}
            style={styles.heroButton}
          />
        </View>
      </GlassCard>

      <GlassCard style={styles.formCard}>
        <Field label={t("assignment_detail.title_field", "Title")}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("assignment_detail.assignment_title_placeholder", "Assignment title")}
            placeholderTextColor={colors.faint}
            style={styles.input}
          />
        </Field>

        <View style={styles.twoColumn}>
          <View style={styles.fieldHalf}>
            <Field label={t("assignment_detail.due_date", "Due date")}>
              <TextInput
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.faint}
                style={styles.input}
              />
            </Field>
          </View>
          <View style={styles.fieldHalf}>
            <Field label={t("assignment_detail.time", "Time")}>
              <TextInput
                value={dueTime}
                onChangeText={setDueTime}
                placeholder="HH:MM"
                placeholderTextColor={colors.faint}
                style={styles.input}
              />
            </Field>
          </View>
        </View>

        <Field label={t("assignment_detail.course", "Course")}>
          <View style={styles.chipRow}>
            {courses.map((option) => (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: courseId === option.id }}
                key={option.id}
                style={[styles.choice, courseId === option.id ? styles.choiceActive : null]}
                onPress={() => setCourseId(option.id)}
              >
                <Text style={[styles.choiceText, courseId === option.id ? styles.choiceTextActive : null]}>
                  {option.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label={t("assignment_detail.type", "Type")}>
          <SegmentedControl options={kinds} value={kind} onChange={setKind} labelForOption={(value) => labelizeOption(value, t)} />
        </Field>
        <Field label={t("assignment_detail.priority", "Priority")}>
          <SegmentedControl options={priorities} value={priority} onChange={setPriority} labelForOption={(value) => labelizeOption(value, t)} />
        </Field>
        <Field label={t("assignment_detail.status", "Status")}>
          <SegmentedControl options={statuses} value={status} onChange={setStatus} labelForOption={(value) => labelizeOption(value, t)} />
        </Field>

        <View style={styles.twoColumn}>
          <View style={styles.fieldHalf}>
            <Field label={t("assignment_detail.estimate", "Estimate")}>
              <TextInput
                keyboardType="numeric"
                value={estimatedMinutes}
                onChangeText={setEstimatedMinutes}
                placeholder={t("assignment_detail.minutes_placeholder", "Minutes")}
                placeholderTextColor={colors.faint}
                style={styles.input}
              />
            </Field>
          </View>
          <View style={styles.fieldHalf}>
            <Field label={t("assignment_detail.source", "Source")}>
              <View style={styles.sourceBox}>
                <Badge label={assignment.sourceId || labelizeSource(assignment.source, t)} tone="neutral" />
              </View>
            </Field>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <Meta
            label={t("assignment_detail.reminder", "Reminder")}
            value={assignment.reminder?.enabled
              ? formatDetailTemplate(t("assignment_detail.hours_before", "{hours}h before"), { hours: assignment.reminder.leadTimeHours })
              : t("assignment_detail.off", "Off")}
          />
          <Meta
            label={t("assignment_detail.confidence", "Confidence")}
            value={assignment.confidence ? `${Math.round(assignment.confidence * 100)}%` : t("assignment_detail.manual", "Manual")}
          />
        </View>

        {assignment.needsReview || assignment.duplicateOf || (assignment.confidence || 1) < 0.75 ? (
          <View style={styles.reviewCallout}>
            <Text style={styles.reviewTitle}>{t("assignment_detail.needs_human_check", "Needs a human check")}</Text>
            <Text style={styles.reviewCopy}>{t("assignment_detail.review_copy", "Saving valid edits marks this task reviewed so it can appear in widgets and trusted Today views.")}</Text>
            <AppButton label={t("assignment_detail.mark_reviewed", "Mark reviewed")} variant="secondary" onPress={() => save()} />
          </View>
        ) : null}

        <Field label={t("assignment_detail.tags", "Tags")}>
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder={t("assignment_detail.tags_placeholder", "essay, lab, exam")}
            placeholderTextColor={colors.faint}
            style={styles.input}
          />
        </Field>
      </GlassCard>

      <Section title={t("assignment_detail.checklist", "Checklist")}>
        {checklist.length === 0 ? (
          <Text style={styles.emptyChecklist}>{t("assignment_detail.empty_checklist", "No checklist yet. Parsed subtasks will appear here.")}</Text>
        ) : (
          checklist.map((item) => (
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.done }}
              key={item.id}
              style={styles.checklistRow}
              onPress={() => toggleChecklist(item.id)}
            >
              <CheckCircle2 color={item.done ? colors.green : colors.faint} size={20} />
              <Text style={[styles.checklistText, item.done ? styles.checklistTextDone : null]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </Section>

      <View style={styles.actionRow}>
        <AppButton label={t("assignment_detail.save_changes", "Save changes")} icon={Save} disabled={!dirty} onPress={() => save()} style={styles.actionButton} />
        <AppButton label={t("assignment_detail.hide_task", "Hide task")} icon={Archive} variant="secondary" onPress={onArchive} style={styles.actionButton} />
      </View>
    </View>
  );

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {children}
      </View>
    );
  }

  function Meta({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.metaCard}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
      </View>
    );
  }

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <GlassCard style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
      </GlassCard>
    );
  }
}

function labelizeOption(value: string, t: TranslateFn) {
  if (value === "assignment") return t("assignment_detail.kind_assignment", "Assignment");
  if (value === "worksheet") return t("assignment_detail.kind_worksheet", "Worksheet");
  if (value === "reading") return t("assignment_detail.kind_reading", "Reading");
  if (value === "project") return t("assignment_detail.kind_project", "Project");
  if (value === "exam") return t("assignment_detail.kind_exam", "Exam");
  if (value === "low") return t("assignment_detail.priority_low", "Low");
  if (value === "medium") return t("assignment_detail.priority_medium", "Medium");
  if (value === "high") return t("assignment_detail.priority_high", "High");
  if (value === "not_started") return t("assignment_detail.status_not_started", "Not started");
  if (value === "in_progress") return t("assignment_detail.status_in_progress", "In progress");
  if (value === "done") return t("assignment_detail.status_done", "Done");
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function labelizeSource(value: Assignment["source"], t: TranslateFn) {
  if (value === "manual") return t("assignment_detail.source_manual", "Manual");
  if (value === "syllabus") return t("assignment_detail.source_syllabus", "Syllabus");
  if (value === "calendar") return t("tabs.calendar", "Calendar");
  if (value === "canvas") return t("assignment_detail.source_canvas", "Canvas");
  if (value === "scan") return t("tabs.scan", "Scan");
  if (value === "typed") return t("assignment_detail.source_typed", "Typed");
  return t("assignment_detail.source_manual", "Manual");
}

function formatAssignmentDetailDate(iso: string, locale: string, t: TranslateFn) {
  if (!isValidDeadline(iso)) return t("assignment_detail.check_deadline", "Check deadline");

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));
}

function formatMinutes(value: string, t: TranslateFn) {
  const minutes = Number.parseInt(value, 10);
  return formatDetailTemplate(t("assignment_detail.minutes_count", "{minutes} minutes"), {
    minutes: Number.isFinite(minutes) ? minutes : value
  });
}

function formatDetailTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template
  );
}

function buildAssignmentTrustState(assignment: Assignment, t: TranslateFn) {
  if (assignment.duplicateOf) {
    return {
      title: t("assignment_detail.trust_duplicate_title", "Possible duplicate"),
      detail: t("assignment_detail.trust_duplicate_detail", "Confirm this is a real separate task before saving it into the active plan."),
      badge: t("today.metric_review", "Review")
    };
  }

  if (assignment.needsReview) {
    return {
      title: t("assignment_detail.trust_needs_review_title", "Needs review before it is trusted"),
      detail: t("assignment_detail.trust_needs_review_detail", "Check the class, due date, and title. Saving valid edits clears the review flag."),
      badge: t("assignment_detail.needs_check", "Needs check")
    };
  }

  if (typeof assignment.confidence === "number" && assignment.confidence < 0.75) {
    return {
      title: t("assignment_detail.trust_low_confidence_title", "Low-confidence import"),
      detail: t("assignment_detail.trust_low_confidence_detail", "The parser was unsure about this item. Confirm the details before relying on reminders."),
      badge: `${Math.round(assignment.confidence * 100)}%`
    };
  }

  if (assignment.status === "done") {
    return {
      title: t("assignment_detail.trust_done_title", "Complete and still editable"),
      detail: t("assignment_detail.trust_done_detail", "This task is done. Reopen details only if the plan or grade context changed."),
      badge: t("assignment_detail.status_done", "Done")
    };
  }

  return {
    title: t("assignment_detail.trust_ready_title", "Ready for Today and Plan"),
    detail: t("assignment_detail.trust_ready_detail", "This assignment has enough trusted detail to show up in the active school operating system."),
    badge: t("assignment_detail.trusted", "Trusted")
  };
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    screen: {
      gap: spacing.md
    },
    headerRow: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "flex-start"
    },
    headerCopy: {
      flex: 1,
      gap: spacing.xs
    },
    kicker: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    title: {
      ...typography.title
    },
    subtitle: {
      ...typography.body
    },
    closeButton: {
      width: 42,
      height: 42,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center"
    },
    trustCard: {
      gap: spacing.sm,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(49,91,255,0.16)",
      backgroundColor: colors.heroSurface
    },
    trustHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    trustCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    trustKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.6,
      textTransform: "uppercase"
    },
    trustTitle: {
      color: colors.heroText,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    trustBadge: {
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
    trustDetail: {
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700"
    },
    hero: {
      gap: spacing.md
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    courseChip: {
      minHeight: 32,
      borderRadius: radii.round,
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 7
    },
    courseDot: {
      width: 9,
      height: 9,
      borderRadius: 5
    },
    courseChipText: {
      color: colors.heroText,
      fontSize: 12,
      fontWeight: "900"
    },
    heroTitle: {
      color: colors.heroText,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "900"
    },
    heroMeta: {
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    progressTrack: {
      height: 10,
      borderRadius: radii.round,
      backgroundColor: "rgba(255,255,255,0.18)",
      overflow: "hidden"
    },
    progressFill: {
      height: "100%",
      borderRadius: radii.round,
      backgroundColor: colors.brandPink
    },
    progressText: {
      color: colors.heroMuted,
      fontSize: 12,
      fontWeight: "900"
    },
    heroActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    heroButton: {
      flex: 1,
      minWidth: 136,
      paddingHorizontal: spacing.xs
    },
    formCard: {
      gap: spacing.md
    },
    field: {
      minWidth: 0,
      gap: spacing.xs
    },
    fieldLabel: {
      color: colors.faint,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase"
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
    twoColumn: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "stretch"
    },
    fieldHalf: {
      flex: 1,
      minWidth: 0
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    choice: {
      minHeight: 38,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center"
    },
    choiceActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    choiceText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900"
    },
    choiceTextActive: {
      color: colors.heroText
    },
    sourceBox: {
      minHeight: 46,
      justifyContent: "center"
    },
    metaGrid: {
      flexDirection: "row",
      gap: spacing.sm
    },
    metaCard: {
      flex: 1,
      borderRadius: radii.lg,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md,
      gap: 2
    },
    metaLabel: {
      color: colors.faint,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    metaValue: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    reviewCallout: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.gold,
      backgroundColor: theme.isDark ? "rgba(245,158,11,0.14)" : "rgba(245,158,11,0.10)",
      padding: spacing.md,
      gap: spacing.sm
    },
    reviewTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    reviewCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    sectionCard: {
      gap: spacing.sm
    },
    sectionTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "900"
    },
    emptyChecklist: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    },
    checklistRow: {
      minHeight: 46,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    checklistText: {
      flex: 1,
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "800"
    },
    checklistTextDone: {
      color: colors.faint,
      textDecorationLine: "line-through"
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    actionButton: {
      flex: 1,
      minWidth: 136
    }
  });
}
