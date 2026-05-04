import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CheckCircle2, Circle, Clock3 } from "lucide-react-native";
import { Assignment, Course } from "../models";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { Badge } from "./Badge";
import { daysUntil, formatShortDate } from "../logic/planner";

type AssignmentCardProps = {
  assignment: Assignment;
  course?: Course;
  onPressStatus?: () => void;
  onOpen?: () => void;
};

export function AssignmentCard({
  assignment,
  course,
  onPressStatus,
  onOpen
}: AssignmentCardProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const { colors } = theme;
  const dueIn = daysUntil(assignment.dueAt);
  const urgent = dueIn <= 2 || assignment.priority === "high";
  const done = assignment.status === "done";

  return (
    <View style={styles.card}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={done ? "Mark not done" : "Mark done"}
        style={styles.checkButton}
        onPress={onPressStatus}
      >
        {done ? (
          <CheckCircle2 color={colors.green} size={24} />
        ) : (
          <Circle color={colors.faint} size={24} />
        )}
      </TouchableOpacity>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.course}>{course?.code || "Course"}</Text>
          <View style={styles.topActions}>
            {onOpen ? (
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.editButton}
                onPress={onOpen}
              >
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            ) : null}
            <Badge
              label={assignment.kind === "exam" ? "Exam" : assignment.priority}
              tone={urgent ? "red" : assignment.kind === "exam" ? "gold" : "neutral"}
            />
          </View>
        </View>
        <Text style={[styles.title, done ? styles.doneTitle : null]}>{assignment.title}</Text>
        <View style={styles.metaRow}>
          <Clock3 color={colors.faint} size={14} />
          <Text style={styles.meta}>
            {formatShortDate(assignment.dueAt)} - {assignment.estimatedMinutes} min
          </Text>
        </View>
        <View style={styles.tagRow}>
          {assignment.tags.slice(0, 3).map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      padding: spacing.md,
      flexDirection: "row",
      gap: spacing.sm
    },
    checkButton: {
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center"
    },
    body: {
      flex: 1,
      gap: spacing.xs
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    topActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    editButton: {
      minHeight: 28,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center"
    },
    editText: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: "900"
    },
    course: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900"
    },
    title: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "800"
    },
    doneTitle: {
      color: colors.faint,
      textDecorationLine: "line-through"
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5
    },
    meta: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18
    },
    tagRow: {
      flexDirection: "row",
      gap: spacing.xs,
      flexWrap: "wrap"
    },
    tag: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700"
    }
  });
}
