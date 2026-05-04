import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Archive, Save, X } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import { Assignment, AssignmentKind, AssignmentStatus, Course, Priority } from "../models";
import { formatShortDate, getCourseForAssignment } from "../logic/planner";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type AssignmentDetailScreenProps = {
  assignment: Assignment;
  courses: Course[];
  onClose: () => void;
  onSave: (patch: Partial<Assignment>) => void;
  onArchive: () => void;
};

const priorities: Priority[] = ["low", "medium", "high"];
const statuses: Array<Exclude<AssignmentStatus, "archived">> = [
  "not_started",
  "in_progress",
  "done"
];
const kinds: AssignmentKind[] = ["assignment", "exam"];

export function AssignmentDetailScreen({
  assignment,
  courses,
  onClose,
  onSave,
  onArchive
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
      courseId !== assignment.courseId,
    [assignment, courseId, dueDate, dueTime, estimatedMinutes, kind, priority, status, tags, title]
  );

  const save = () => {
    onSave({
      title: title.trim() || assignment.title,
      dueAt: `${dueDate || assignment.dueAt.slice(0, 10)}T${dueTime || "23:59"}:00-05:00`,
      estimatedMinutes: Number.parseInt(estimatedMinutes, 10) || assignment.estimatedMinutes,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      priority,
      status,
      kind,
      courseId
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Assignment detail</Text>
          <Text style={styles.title}>{assignment.title}</Text>
          <Text style={styles.subtitle}>
            {course?.code || "Course"} · {formatShortDate(assignment.dueAt)}
          </Text>
        </View>
        <TouchableOpacity accessibilityRole="button" style={styles.closeButton} onPress={onClose}>
          <X color={colors.ink} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
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
          <Field label="Due date">
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
          </Field>
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

        <Field label="Course">
          <View style={styles.chipRow}>
            {courses.map((option) => (
              <TouchableOpacity
                accessibilityRole="button"
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

        <Field label="Kind">
          <Segmented options={kinds} value={kind} onChange={setKind} />
        </Field>

        <Field label="Priority">
          <Segmented options={priorities} value={priority} onChange={setPriority} />
        </Field>

        <Field label="Status">
          <Segmented options={statuses} value={status} onChange={setStatus} />
        </Field>

        <View style={styles.twoColumn}>
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
          <Field label="Source">
            <View style={styles.sourceBox}>
              <Badge label={assignment.source} tone="neutral" />
            </View>
          </Field>
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
      </View>

      <View style={styles.actionRow}>
        <AppButton label="Save" icon={Save} disabled={!dirty} onPress={save} style={styles.actionButton} />
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

  function Segmented<T extends string>({
    options,
    value,
    onChange
  }: {
    options: T[];
    value: T;
    onChange: (value: T) => void;
  }) {
    return (
      <View style={styles.segmented}>
        {options.map((option) => (
          <TouchableOpacity
            accessibilityRole="button"
            key={option}
            style={[styles.segment, value === option ? styles.segmentActive : null]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.segmentText, value === option ? styles.segmentTextActive : null]}>
              {labelize(option)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
}

function labelize(value: string) {
  return value.replace("_", " ");
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
      fontWeight: "900"
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
    formCard: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.md
    },
    field: {
      gap: spacing.xs
    },
    fieldLabel: {
      color: colors.faint,
      fontSize: 12,
      fontWeight: "900"
    },
    input: {
      minHeight: 46,
      borderRadius: radii.sm,
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
      gap: spacing.sm
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    choice: {
      minHeight: 38,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center"
    },
    choiceActive: {
      backgroundColor: colors.softGold,
      borderColor: colors.gold
    },
    choiceText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900"
    },
    choiceTextActive: {
      color: colors.ink
    },
    segmented: {
      minHeight: 44,
      flexDirection: "row",
      borderRadius: radii.md,
      backgroundColor: colors.canvas,
      padding: 4,
      gap: 4
    },
    segment: {
      flex: 1,
      borderRadius: radii.sm,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xs
    },
    segmentActive: {
      backgroundColor: colors.surface
    },
    segmentText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "capitalize"
    },
    segmentTextActive: {
      color: colors.ink
    },
    sourceBox: {
      minHeight: 46,
      justifyContent: "center"
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
