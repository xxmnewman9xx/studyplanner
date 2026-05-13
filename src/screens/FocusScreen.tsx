import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Pause, Play, Power, Square } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import { SectionHeader } from "../components/SectionHeader";
import { Assignment, Course, FocusSession } from "../models";
import { getCourseForAssignment } from "../logic/planner";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type FocusScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  defaultMinutes: number;
  sessions: FocusSession[];
  preferredAssignmentId?: string | null;
  onRecordSession: (session: FocusSession) => void;
  onMarkComplete?: (assignmentId: string) => void;
};

export function FocusScreen({
  assignments,
  courses,
  defaultMinutes,
  sessions,
  preferredAssignmentId,
  onRecordSession,
  onMarkComplete
}: FocusScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const focusableAssignments = useMemo(
    () =>
      assignments
        .filter((assignment) => assignment.status !== "done" && assignment.status !== "archived")
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()),
    [assignments]
  );
  const [selectedId, setSelectedId] = useState(preferredAssignmentId || focusableAssignments[0]?.id || "");
  const [secondsLeft, setSecondsLeft] = useState(defaultMinutes * 60);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const selected = focusableAssignments.find((assignment) => assignment.id === selectedId);
  const selectedCourse = selected ? getCourseForAssignment(courses, selected) : undefined;
  const sessionNumber = sessions.length + 1;
  const startedRef = useRef(startedAt);
  startedRef.current = startedAt;

  useEffect(() => {
    if (preferredAssignmentId) setSelectedId(preferredAssignmentId);
  }, [preferredAssignmentId]);

  useEffect(() => {
    setSecondsLeft(defaultMinutes * 60);
  }, [defaultMinutes, selectedId]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setRunning(false);
          record("completed");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running]);

  const startPause = () => {
    if (!selected) return;
    if (!startedAt) setStartedAt(new Date().toISOString());
    setRunning((current) => !current);
  };

  const stop = () => {
    setRunning(false);
    record("stopped");
    setSecondsLeft(defaultMinutes * 60);
    setStartedAt(null);
  };

  const complete = () => {
    if (!selected) return;
    setRunning(false);
    record("completed");
    onMarkComplete?.(selected.id);
    setSecondsLeft(defaultMinutes * 60);
    setStartedAt(null);
  };

  const elapsedMinutes = Math.max(0, defaultMinutes - Math.ceil(secondsLeft / 60));

  return (
    <View>
      <View style={styles.focusStage}>
        <View style={styles.focusGlow} />
        <View style={styles.stageHeader}>
          <Text style={styles.stageKicker}>Focus Mode</Text>
          <Badge label={`Session ${sessionNumber}`} tone="blue" />
        </View>
        <View style={styles.timerRing}>
          <View style={styles.timerRingInner}>
            <Text style={styles.timer}>{formatTimer(secondsLeft)}</Text>
            <Text style={styles.timerMeta}>{running ? "Focused" : "Ready"}</Text>
          </View>
        </View>
        <Text style={styles.focusingOn}>Focusing on</Text>
        <Text style={styles.timerTask}>{selected?.title || "Choose an assignment"}</Text>
        <Text style={styles.timerCourse}>{selectedCourse?.code || "No class selected"}</Text>
        <View style={styles.controlRow}>
          <TouchableOpacity accessibilityRole="button" style={styles.roundControl} onPress={startPause} disabled={!selected}>
            {running ? <Pause color="#FFFFFF" size={18} /> : <Play color="#FFFFFF" size={18} />}
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.primaryControl} onPress={startPause} disabled={!selected}>
            <Text style={styles.primaryControlText}>{running ? "Pause" : "Start"}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.roundControl} onPress={stop}>
            <Square color="#FFFFFF" size={16} />
          </TouchableOpacity>
        </View>
        <Text style={styles.silencedCopy}>Notifications silenced · Lock Screen dimmed</Text>
      </View>

      <SectionHeader title="Tie Timer To" note="Pick the task that matters next" />
      <View style={styles.assignmentList}>
        {focusableAssignments.length === 0 ? (
          <Text style={styles.emptyCard}>Add an assignment to start a focus session.</Text>
        ) : null}
        {focusableAssignments.map((assignment) => {
          const active = assignment.id === selectedId;
          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={assignment.id}
              style={[styles.assignmentRow, active ? styles.assignmentRowActive : null]}
              onPress={() => {
                setSelectedId(assignment.id);
                setRunning(false);
                setStartedAt(null);
              }}
            >
              <View style={[styles.classDot, { backgroundColor: getCourseForAssignment(courses, assignment)?.color || colors.accent }]} />
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

      <View style={styles.bottomActions}>
        <AppButton
          label="Mark Complete"
          icon={Power}
          disabled={!selected}
          onPress={complete}
          style={styles.bottomButton}
        />
        <AppButton
          label={`${elapsedMinutes} min logged`}
          variant="secondary"
          onPress={() => {
            if (selected) record("paused");
          }}
          style={styles.bottomButton}
        />
      </View>
    </View>
  );

  function record(status: FocusSession["status"]) {
    if (!selected) return;
    onRecordSession({
      id: `focus-${Date.now()}`,
      assignmentId: selected.id,
      durationMinutes: Math.max(1, elapsedMinutes || defaultMinutes),
      startedAt: startedRef.current || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      status,
      sessionNumber,
      notes: status === "completed" ? "Focus block completed." : "Focus block ended."
    });
  }
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    focusStage: {
      minHeight: 520,
      borderRadius: 34,
      backgroundColor: "#101024",
      padding: spacing.lg,
      alignItems: "center",
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.38 : 0.22,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 18 },
      elevation: 8
    },
    focusGlow: {
      position: "absolute",
      top: -90,
      right: -80,
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: "#7C3AED",
      opacity: 0.45
    },
    stageHeader: {
      alignSelf: "stretch",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    stageKicker: {
      color: "#FFFFFF",
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    timerRing: {
      marginTop: spacing.xl,
      width: 220,
      height: 220,
      borderRadius: 110,
      borderWidth: 12,
      borderColor: "#7C3AED",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#FF4FA3",
      shadowOpacity: 0.7,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 0 }
    },
    timerRingInner: {
      width: 168,
      height: 168,
      borderRadius: 84,
      backgroundColor: "rgba(255,255,255,0.04)",
      alignItems: "center",
      justifyContent: "center"
    },
    timer: {
      color: "#FFFFFF",
      fontSize: 48,
      lineHeight: 56,
      fontWeight: "300"
    },
    timerMeta: {
      color: "#BDB7FF",
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    focusingOn: {
      marginTop: spacing.lg,
      color: "#BDB7FF",
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    timerTask: {
      marginTop: 3,
      color: "#FFFFFF",
      fontSize: 18,
      lineHeight: 24,
      textAlign: "center",
      fontWeight: "900"
    },
    timerCourse: {
      color: "#BDB7FF",
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    controlRow: {
      marginTop: spacing.xl,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    roundControl: {
      width: 56,
      height: 56,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.12)",
      alignItems: "center",
      justifyContent: "center"
    },
    primaryControl: {
      minWidth: 118,
      height: 56,
      borderRadius: 20,
      backgroundColor: "#7C3AED",
      alignItems: "center",
      justifyContent: "center"
    },
    primaryControlText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "900"
    },
    silencedCopy: {
      marginTop: "auto",
      color: "#8F8AB8",
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "800"
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
      minHeight: 72,
      borderRadius: radii.lg,
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
      backgroundColor: colors.accentSoft
    },
    classDot: {
      width: 12,
      height: 42,
      borderRadius: 8
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
    },
    bottomActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg
    },
    bottomButton: {
      flex: 1
    }
  });
}
