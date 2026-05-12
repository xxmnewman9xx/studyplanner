import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Pause, Play, RotateCcw } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import { SectionHeader } from "../components/SectionHeader";
import { Assignment, Course } from "../models";
import { getCourseForAssignment } from "../logic/planner";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type FocusScreenProps = {
  assignments: Assignment[];
  courses: Course[];
};

const defaultMinutes = 25;

export function FocusScreen({ assignments, courses }: FocusScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const focusableAssignments = useMemo(
    () =>
      assignments
        .filter((assignment) => assignment.status !== "done")
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
    [assignments]
  );
  const [selectedId, setSelectedId] = useState(focusableAssignments[0]?.id || "");
  const [secondsLeft, setSecondsLeft] = useState(defaultMinutes * 60);
  const [running, setRunning] = useState(false);
  const selected = focusableAssignments.find((assignment) => assignment.id === selectedId);
  const selectedCourse = selected ? getCourseForAssignment(courses, selected) : undefined;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running]);

  const reset = () => {
    setRunning(false);
    setSecondsLeft(defaultMinutes * 60);
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.kicker}>Focus session</Text>
        <Text style={styles.title}>One assignment. One timer.</Text>
        <Text style={styles.subtitle}>
          A quiet work block tied to the task that actually matters next.
        </Text>
      </View>

      <View style={styles.timerCard}>
        <Badge label={selectedCourse?.code || "Choose work"} tone="gold" />
        <Text style={styles.timer}>{formatTimer(secondsLeft)}</Text>
        <Text style={styles.timerTask}>{selected?.title || "No open assignments"}</Text>
        <View style={styles.timerActions}>
          <AppButton
            label={running ? "Pause" : "Start"}
            icon={running ? Pause : Play}
            onPress={() => setRunning((current) => !current)}
            disabled={!selected}
          />
          <AppButton label="Reset" icon={RotateCcw} variant="secondary" onPress={reset} />
        </View>
      </View>

      <SectionHeader title="Tie Timer To" />
      <View style={styles.assignmentList}>
        {focusableAssignments.length === 0 ? (
          <Text style={styles.emptyCard}>Add an assignment to start a focus session.</Text>
        ) : null}
        {focusableAssignments.map((assignment) => {
          const active = assignment.id === selectedId;
          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Focus on ${assignment.title}`}
              accessibilityState={{ selected: active }}
              key={assignment.id}
              style={[styles.assignmentRow, active ? styles.assignmentRowActive : null]}
              onPress={() => {
                setSelectedId(assignment.id);
                reset();
              }}
            >
              <View style={styles.assignmentCopy}>
                <Text style={styles.assignmentCourse}>
                  {getCourseForAssignment(courses, assignment)?.code}
                </Text>
                <Text style={styles.assignmentTitle}>{assignment.title}</Text>
              </View>
              <Badge
                label={`${assignment.estimatedMinutes} min`}
                tone={assignment.priority === "high" ? "red" : "neutral"}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    header: {
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
    timerCard: {
      marginTop: spacing.lg,
      borderRadius: radii.xl,
      backgroundColor: colors.heroSurface,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: colors.line,
      padding: spacing.lg,
      alignItems: "center",
      gap: spacing.md,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.3 : 0.14,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6
    },
    timer: {
      color: colors.heroText,
      fontSize: 60,
      lineHeight: 68,
      fontWeight: "900"
    },
    timerTask: {
      color: colors.heroMuted,
      fontSize: 15,
      lineHeight: 21,
      textAlign: "center",
      fontWeight: "700"
    },
    timerActions: {
      flexDirection: "row",
      gap: spacing.sm
    },
    assignmentList: {
      gap: spacing.sm
    },
    emptyCard: {
      overflow: "hidden",
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700"
    },
    assignmentRow: {
      minHeight: 76,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    assignmentRowActive: {
      borderColor: colors.accent,
      backgroundColor: colors.surfaceAlt
    },
    assignmentCopy: {
      flex: 1,
      gap: 2
    },
    assignmentCourse: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900"
    },
    assignmentTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    }
  });
}
