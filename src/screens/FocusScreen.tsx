import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
  const [selectedPlannedDuration, setSelectedPlannedDuration] = useState<number | null>(null);
  const activeDurationMinutes = selectedPlannedDuration || defaultMinutes;
  const [secondsLeft, setSecondsLeft] = useState(activeDurationMinutes * 60);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [pauseRecorded, setPauseRecorded] = useState(false);
  const [classNote, setClassNote] = useState("");
  const recentNotes = sessions
    .filter((session) => session.notes && !session.notes.startsWith("Focus block"))
    .slice(-3)
    .reverse();
  const selected = focusableAssignments.find((assignment) => assignment.id === selectedId);
  const selectedCourse = selected ? getCourseForAssignment(courses, selected) : undefined;
  const plannedSessions = sessions
    .filter((session) => session.status === "planned")
    .slice()
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  const sessionNumber = sessions.length + 1;
  const startedRef = useRef(startedAt);
  startedRef.current = startedAt;

  useEffect(() => {
    if (preferredAssignmentId) setSelectedId(preferredAssignmentId);
  }, [preferredAssignmentId]);

  useEffect(() => {
    setSecondsLeft(activeDurationMinutes * 60);
  }, [activeDurationMinutes, selectedId]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setRunning(false);
          record("completed", activeDurationMinutes);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, activeDurationMinutes]);

  const startPause = () => {
    if (!selected) return;
    if (!startedAt) {
      setStartedAt(new Date().toISOString());
      setPauseRecorded(false);
      setRunning(true);
      return;
    }
    if (running) {
      record("paused");
      setPauseRecorded(true);
      setRunning(false);
      return;
    }
    setPauseRecorded(false);
    setRunning(true);
  };

  const stop = () => {
    const hadStarted = Boolean(startedRef.current);
    setRunning(false);
    if (hadStarted) record("stopped");
    setSecondsLeft(activeDurationMinutes * 60);
    setStartedAt(null);
    setPauseRecorded(false);
  };

  const complete = () => {
    if (!selected) return;
    setRunning(false);
    record("completed", startedRef.current ? undefined : activeDurationMinutes);
    onMarkComplete?.(selected.id);
    setSecondsLeft(activeDurationMinutes * 60);
    setStartedAt(null);
    setPauseRecorded(false);
    setClassNote("");
  };

  const elapsedMinutes = Math.max(0, activeDurationMinutes - Math.ceil(secondsLeft / 60));

  return (
    <View>
      <View style={styles.focusStage}>
        <View style={styles.focusGlow} />
        <View style={styles.focusGlowSecondary} />
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
            <Text style={styles.primaryControlText}>{running ? "Pause timer" : "Start timer for this task"}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={styles.roundControl} onPress={stop}>
            <Square color="#FFFFFF" size={16} />
          </TouchableOpacity>
        </View>
        <Text style={styles.silencedCopy}>Pick a task → start the timer → tap Done to save time and complete it.</Text>
      </View>

      <View style={styles.notesCard}>
        <View style={styles.notesHeader}>
          <Text style={styles.notesKicker}>Retention loop</Text>
          <Text style={styles.notesBadge}>Class notes</Text>
        </View>
        <Text style={styles.notesTitle}>Capture the thing you’ll forget later.</Text>
        <Text style={styles.notesCopy}>Optional notes attach to this focus block, so studying creates useful history instead of just a timer log.</Text>
        <TextInput
          multiline
          value={classNote}
          onChangeText={setClassNote}
          placeholder="Example: Prof said quiz pulls from slides 18–24. Review enzyme chart."
          placeholderTextColor={colors.faint}
          style={styles.notesInput}
          textAlignVertical="top"
        />
        {recentNotes.length > 0 ? (
          <View style={styles.recentNotes}>
            <Text style={styles.recentNotesTitle}>Recent saved notes</Text>
            {recentNotes.map((session) => (
              <Text key={session.id} style={styles.recentNote} numberOfLines={2}>• {session.notes}</Text>
            ))}
          </View>
        ) : null}
      </View>

      {plannedSessions.length > 0 ? (
        <>
          <SectionHeader title="Saved study blocks" note="These were saved from your busy week helper." />
          <View style={styles.plannedList}>
            {plannedSessions.slice(0, 5).map((session) => {
              const assignment = assignments.find((item) => item.id === session.assignmentId);
              const course = assignment ? getCourseForAssignment(courses, assignment) : undefined;
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={session.id}
                  style={styles.plannedRow}
                  onPress={() => {
                    if (!assignment) return;
                    setSelectedId(assignment.id);
                    setSelectedPlannedDuration(session.durationMinutes);
                    setRunning(false);
                    setStartedAt(null);
                    setPauseRecorded(false);
                  }}
                >
                  <View style={[styles.classDot, { backgroundColor: course?.color || colors.accent }]} />
                  <View style={styles.plannedCopy}>
                    <Text style={styles.plannedTitle}>{assignment?.title || "Planned focus"}</Text>
                    <Text style={styles.plannedMeta}>{course?.code || "Class"} · {formatFocusDate(session.startedAt)} · {session.durationMinutes}m</Text>
                  </View>
                  <Badge label="Planned" tone="blue" />
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : null}

      <SectionHeader title="Choose what to study" note="The timer will be attached to this task." />
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
                setSelectedPlannedDuration(null);
                setRunning(false);
                setStartedAt(null);
                setPauseRecorded(false);
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
          label="Done — save time and complete task"
          icon={Power}
          disabled={!selected}
          onPress={complete}
          style={styles.bottomButton}
        />
        <AppButton
          label={`Save ${elapsedMinutes} min only`}
          variant="secondary"
          onPress={() => {
            if (selected && startedRef.current && !pauseRecorded) {
              record("paused");
              setPauseRecorded(true);
              setRunning(false);
            }
          }}
          style={styles.bottomButton}
        />
      </View>
    </View>
  );

  function record(status: FocusSession["status"], durationOverride?: number) {
    if (!selected) return;
    if (!startedRef.current && status !== "completed") return;
    const durationMinutes =
      durationOverride ??
      (status === "completed" && secondsLeft === 0 ? activeDurationMinutes : elapsedMinutes);
    onRecordSession({
      id: `focus-${Date.now()}`,
      assignmentId: selected.id,
      durationMinutes: Math.max(1, durationMinutes),
      startedAt: startedRef.current || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      status,
      sessionNumber,
      notes: classNote.trim() || (status === "completed" ? "Focus block completed." : "Focus block ended.")
    });
  }
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function formatFocusDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "numeric"
  }).format(new Date(value));
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    focusStage: {
      minHeight: 520,
      borderRadius: 34,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
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
      opacity: 0.38
    },
    focusGlowSecondary: {
      position: "absolute",
      left: -80,
      bottom: -95,
      width: 230,
      height: 230,
      borderRadius: 115,
      backgroundColor: "#38BDF8",
      opacity: 0.16
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
      borderColor: "#8B5CF6",
      backgroundColor: "rgba(255,255,255,0.035)",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#FF4FA3",
      shadowOpacity: 0.56,
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
    notesCard: {
      marginTop: spacing.lg,
      borderRadius: radii.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.78)",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.80)",
      padding: spacing.lg,
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.22 : 0.09,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 14 },
      elevation: 4
    },
    notesHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    notesKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    notesBadge: {
      color: colors.heroText,
      backgroundColor: colors.heroSurface,
      borderRadius: radii.round,
      overflow: "hidden",
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    notesTitle: {
      color: colors.ink,
      fontSize: 20,
      lineHeight: 25,
      fontWeight: "900"
    },
    notesCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700"
    },
    notesInput: {
      minHeight: 112,
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.72)",
      color: colors.ink,
      padding: spacing.md,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700"
    },
    recentNotes: {
      gap: 5
    },
    recentNotesTitle: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    recentNote: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    plannedList: {
      gap: spacing.sm
    },
    plannedRow: {
      minHeight: 68,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    plannedCopy: {
      flex: 1,
      gap: 2
    },
    plannedTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    plannedMeta: {
      color: colors.muted,
      fontSize: 12,
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
