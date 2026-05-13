import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Archive, CheckCircle2, Save, Timer, X } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import {
  EmojiBadge,
  GlassCard,
  SegmentedControl
} from "../components/AppleComponents";
import { Assignment, AssignmentKind, AssignmentStatus, ChecklistItem, Course, Priority } from "../models";
import { formatShortDate, getCourseForAssignment } from "../logic/planner";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

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

export function AssignmentDetailScreen({
  assignment,
  courses,
  onClose,
  onSave,
  onArchive,
  onStartFocus
}: AssignmentDetailScreenProps) {
  const { theme } = useAppTheme();
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
    onSave({
      title: title.trim() || assignment.title,
      dueAt: `${dueDate || assignment.dueAt.slice(0, 10)}T${dueTime || "23:59"}:00`,
      estimatedMinutes: Number.parseInt(estimatedMinutes, 10) || assignment.estimatedMinutes,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      priority,
      status,
      kind,
      type: kind,
      courseId,
      checklist,
      progress,
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
          <Text style={styles.kicker}>Assignment</Text>
          <Text style={styles.title}>{assignment.title}</Text>
          <Text style={styles.subtitle}>
            {course?.code || "Course"} · {formatShortDate(assignment.dueAt)}
          </Text>
        </View>
        <TouchableOpacity accessibilityRole="button" style={styles.closeButton} onPress={onClose}>
          <X color={colors.ink} size={20} />
        </TouchableOpacity>
      </View>

      <GlassCard tone="hero" style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.courseChip}>
            <View style={[styles.courseDot, { backgroundColor: course?.color || colors.brandPink }]} />
            <Text style={styles.courseChipText}>{course?.code || "Class"}</Text>
          </View>
          {assignment.needsReview ? <EmojiBadge name="warning" label="Needs check" tone="gold" /> : null}
        </View>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroMeta}>
          {labelize(kind)} · {estimatedMinutes} minutes · {assignment.source} source
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` as `${number}%` }]} />
        </View>
        <Text style={styles.progressText}>{progressPercent}% complete</Text>
        <View style={styles.heroActions}>
          <AppButton label="Start Focus" icon={Timer} onPress={onStartFocus} style={styles.heroButton} />
          <AppButton
            label="Mark Complete"
            icon={CheckCircle2}
            variant="secondary"
            onPress={() => {
              setStatus("done");
              save({ status: "done", progress: 1 });
            }}
            style={styles.heroButton}
          />
        </View>
      </GlassCard>

      <GlassCard style={styles.formCard}>
        <Field label="Title">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Assignment title"
            placeholderTextColor={colors.faint}
            style={styles.input}
          />
        </Field>

        <View style={styles.twoColumn}>
          <View style={styles.fieldHalf}>
            <Field label="Due date">
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
            <Field label="Time">
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

        <Field label="Course">
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

        <Field label="Type">
          <SegmentedControl options={kinds} value={kind} onChange={setKind} labelForOption={labelize} />
        </Field>
        <Field label="Priority">
          <SegmentedControl options={priorities} value={priority} onChange={setPriority} labelForOption={labelize} />
        </Field>
        <Field label="Status">
          <SegmentedControl options={statuses} value={status} onChange={setStatus} labelForOption={labelize} />
        </Field>

        <View style={styles.twoColumn}>
          <View style={styles.fieldHalf}>
            <Field label="Estimate">
              <TextInput
                keyboardType="numeric"
                value={estimatedMinutes}
                onChangeText={setEstimatedMinutes}
                placeholder="Minutes"
                placeholderTextColor={colors.faint}
                style={styles.input}
              />
            </Field>
          </View>
          <View style={styles.fieldHalf}>
            <Field label="Source">
              <View style={styles.sourceBox}>
                <Badge label={assignment.sourceId || assignment.source} tone="neutral" />
              </View>
            </Field>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <Meta label="Reminder" value={assignment.reminder?.enabled ? `${assignment.reminder.leadTimeHours}h before` : "Off"} />
          <Meta label="Confidence" value={assignment.confidence ? `${Math.round(assignment.confidence * 100)}%` : "Manual"} />
        </View>

        <Field label="Tags">
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder="essay, lab, exam"
            placeholderTextColor={colors.faint}
            style={styles.input}
          />
        </Field>
      </GlassCard>

      <Section title="Checklist">
        {checklist.length === 0 ? (
          <Text style={styles.emptyChecklist}>No checklist yet. Parsed subtasks will appear here.</Text>
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
        <AppButton label="Save" icon={Save} disabled={!dirty} onPress={() => save()} style={styles.actionButton} />
        <AppButton label="Archive" icon={Archive} variant="secondary" onPress={onArchive} style={styles.actionButton} />
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

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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
      gap: spacing.sm
    },
    heroButton: {
      flex: 1,
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
      gap: spacing.sm
    },
    actionButton: {
      flex: 1
    }
  });
}
