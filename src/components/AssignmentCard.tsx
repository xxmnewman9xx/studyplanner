import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CheckCircle2, ChevronRight, Circle, Clock3 } from "lucide-react-native";
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
    <View style={[styles.card, urgent ? styles.urgentCard : null]}>
      <View style={[styles.courseStripe, { backgroundColor: course?.color || colors.accent }]} />
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
                accessibilityLabel={`Open ${assignment.title}`}
                style={styles.editButton}
                onPress={onOpen}
              >
                <ChevronRight color={colors.ink} size={16} />
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
            Due {formatShortDate(assignment.dueAt)} · {assignment.estimatedMinutes} min
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
      borderRadius: radii.lg,
      padding: spacing.md,
      flexDirection: "row",
      gap: spacing.sm,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.14 : 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2
    },
    urgentCard: {
      borderColor: theme.isDark ? "#5B3933" : "#F1C2B8"
    },
    courseStripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 5
    },
    checkButton: {
      width: 44,
      height: 44,
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
      width: 44,
      height: 44,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center"
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
