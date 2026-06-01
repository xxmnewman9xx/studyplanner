import React, { useEffect, useMemo, useRef, useState } from "react";
import { LayoutAnimation, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { CheckCircle2, Clock3, Pause, Play, Power, Square, TimerReset } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import { SectionHeader } from "../components/SectionHeader";
import { Assignment, Course, FocusSession, StudyNote } from "../models";
import { getCourseForAssignment } from "../logic/planner";
import type { StudentLifeContext } from "../logic/studentLifeDepth";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { useI18n } from "../i18n";
import { courseEmoji } from "../utils/courseVisuals";

type TranslateFn = (key: string, fallback?: string) => string;

type FocusScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  defaultMinutes: number;
  sessions: FocusSession[];
  studentLife?: StudentLifeContext;
  focusAccent?: string;
  preferredAssignmentId?: string | null;
  onRecordSession: (session: FocusSession) => void;
  onMarkComplete?: (assignmentId: string) => void;
  onAddNote?: (note: Omit<StudyNote, "id" | "createdAt" | "updatedAt">) => void;
};

export function FocusScreen({
  assignments,
  courses,
  defaultMinutes,
  sessions,
  studentLife,
  focusAccent,
  preferredAssignmentId,
  onRecordSession,
  onMarkComplete,
  onAddNote
}: FocusScreenProps) {
  const { theme } = useAppTheme();
  const { t, locale } = useI18n();
  const { colors } = theme;
  const styles = createStyles(theme, focusAccent);
  const roundControlIconColor = theme.isDark ? "#050505" : "#FFFFFF";
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
  const completedSessions = sessions.filter((session) => session.status === "completed");
  const recentStudyHistory = sessions
    .filter((session) => session.status !== "planned")
    .slice(-3)
    .reverse();
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
    if (focusableAssignments.length === 0) {
      setSelectedId("");
      setSelectedPlannedDuration(null);
      setRunning(false);
      setStartedAt(null);
      setPauseRecorded(false);
      return;
    }

    if (!focusableAssignments.some((assignment) => assignment.id === selectedId)) {
      const firstAssignment = focusableAssignments[0];
      if (!firstAssignment) return;
      setSelectedId(firstAssignment.id);
      setSelectedPlannedDuration(null);
      setRunning(false);
      setStartedAt(null);
      setPauseRecorded(false);
    }
  }, [focusableAssignments, selectedId]);

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
          if (selected?.id) onMarkComplete?.(selected.id);
          setStartedAt(null);
          setPauseRecorded(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, activeDurationMinutes, onMarkComplete, selected?.id]);

  const startPause = () => {
    if (!selected) return;
    if (!startedAt) {
      const startedAtValue = new Date().toISOString();
      setStartedAt(startedAtValue);
      setPauseRecorded(false);
      if (secondsLeft === 0) setSecondsLeft(activeDurationMinutes * 60);
      onRecordSession({
        id: `focus-${Date.now()}`,
        assignmentId: selected.id,
        durationMinutes: activeDurationMinutes,
        startedAt: startedAtValue,
        status: "running",
        sessionNumber,
        notes: classNote.trim() || undefined
      });
      setRunning(true);
      return;
    }
    if (running) {
      setRunning(false);
      record("paused");
      setPauseRecorded(true);
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
    const hadStarted = Boolean(startedRef.current);
    setRunning(false);
    if (hadStarted) record("completed");
    onMarkComplete?.(selected.id);
    setSecondsLeft(activeDurationMinutes * 60);
    setStartedAt(null);
    setPauseRecorded(false);
    setClassNote("");
  };

  const elapsedMinutes = Math.max(0, activeDurationMinutes - Math.ceil(secondsLeft / 60));
  const progressPercent = activeDurationMinutes > 0
    ? Math.min(100, Math.max(0, Math.round(((activeDurationMinutes * 60 - secondsLeft) / (activeDurationMinutes * 60)) * 100)))
    : 0;
  const dueLabel = selected ? formatDueLabel(selected.dueAt, locale, t) : t("focus.no_task", "No task");

  return (
    <View>
      <View style={styles.focusStage}>
        <View style={styles.focusGlow} />
        <View style={styles.focusGlowSecondary} />
        <View style={styles.stageHeader}>
          <View style={styles.stageTitleBlock}>
            <Text style={styles.stageKicker}>{t("focus.stage_kicker", "Focus session")}</Text>
            <Text style={styles.stageSubcopy} numberOfLines={1}>
              {selected
                ? `${formatLocalized(t("focus.block_minutes", "{minutes} min block"), { minutes: String(activeDurationMinutes) })} · ${dueLabel}`
                : t("focus.open_work_appears", "Open work appears here")}
            </Text>
          </View>
          <Badge label={formatLocalized(t("focus.session_count", "Session {count}"), { count: String(sessionNumber) })} tone="blue" />
        </View>
        {studentLife ? (
          <View style={styles.depthStrip}>
            <Text style={styles.depthKicker}>{t("depth.what_i_learned", "What I learned")}</Text>
            <Text style={styles.depthText} numberOfLines={3}>{studentLife.focus.learned}</Text>
            <Text style={styles.depthMeta} numberOfLines={2}>{studentLife.focus.recommendation}</Text>
          </View>
        ) : null}
        <View style={styles.timerRing}>
          <View style={styles.timerRingInner}>
            <Text style={styles.timer}>{formatTimer(secondsLeft)}</Text>
            <Text style={styles.timerMeta}>
              {running
                ? t("focus.status_focused", "Focused")
                : selected
                  ? (startedAt ? t("focus.status_paused", "Paused") : t("focus.status_ready", "Ready"))
                  : t("focus.no_task", "No task")}
            </Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.focusingOn}>{selected ? t("focus.focusing_on", "Focusing on") : t("focus.ready_when_task", "Ready when there is a task")}</Text>
        <Text style={styles.timerTask} numberOfLines={2}>
          {selected?.title || t("focus.no_open_assignments", "No open assignments")}
        </Text>
        <Text style={styles.timerCourse} numberOfLines={1}>
          {selectedCourse?.code || (focusableAssignments.length > 0 ? t("focus.choose_assignment", "Choose an assignment") : t("focus.add_or_reopen_assignment", "Add or reopen an assignment"))}
        </Text>
        {selectedCourse ? (
          <View style={styles.focusClassPill}>
            <View style={[styles.focusClassIcon, { backgroundColor: selectedCourse.color || colors.accent }]}>
              <Text style={styles.focusClassEmoji}>{courseEmoji(selectedCourse)}</Text>
            </View>
            <Text style={styles.focusClassText} numberOfLines={1}>
              {selectedCourse.name || selectedCourse.code}
            </Text>
          </View>
        ) : null}
        <View style={styles.cockpitStats}>
          <CockpitStat icon={Clock3} value={formatLocalized(t("focus.minutes_short", "{minutes}m"), { minutes: String(elapsedMinutes) })} label={t("focus.logged", "logged")} />
          <CockpitStat icon={TimerReset} value={formatLocalized(t("focus.minutes_short", "{minutes}m"), { minutes: String(activeDurationMinutes) })} label={t("focus.target", "target")} />
          <CockpitStat icon={CheckCircle2} value={String(completedSessions.length)} label={t("focus.done", "done")} />
        </View>
        {selected ? (
          <View style={styles.durationRow}>
            {[15, defaultMinutes, 45].filter((value, index, values) => values.indexOf(value) === index).map((minutes) => {
              const active = activeDurationMinutes === minutes;
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={minutes}
                  style={[styles.durationChip, active ? styles.durationChipActive : null]}
                  onPress={() => {
                    animateFocusChange();
                    setSelectedPlannedDuration(minutes);
                    setRunning(false);
                    setStartedAt(null);
                    setPauseRecorded(false);
                  }}
                >
                  <Text style={[styles.durationText, active ? styles.durationTextActive : null]}>{formatLocalized(t("focus.minutes_short", "{minutes}m"), { minutes: String(minutes) })}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
        <View style={styles.controlRow}>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.roundControl, !selected ? styles.controlDisabled : null]}
            onPress={startPause}
            disabled={!selected}
          >
            {running ? <Pause color={roundControlIconColor} size={18} /> : <Play color={roundControlIconColor} size={18} />}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.primaryControl, !selected ? styles.controlDisabled : null]}
            onPress={startPause}
            disabled={!selected}
          >
            <Text style={styles.primaryControlText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
              {running
                ? t("focus.pause_timer", "Pause timer")
                : selected
                  ? (startedAt ? t("focus.resume_timer", "Resume timer") : t("focus.start_timer", "Start timer"))
                  : t("focus.choose_task", "Choose task")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.roundControl, !startedAt ? styles.controlDisabled : null]}
            onPress={stop}
            disabled={!startedAt}
          >
            <Square color={roundControlIconColor} size={16} />
          </TouchableOpacity>
        </View>
        <Text style={styles.silencedCopy}>
          {selected
            ? t("focus.timer_instructions", "Start the timer, add optional notes, then save the real time spent.")
            : t("focus.add_assignment_to_start", "Add an assignment to start a focus session.")}
        </Text>
      </View>

      <View style={styles.notesCard}>
        <View style={styles.notesHeader}>
          <View style={styles.notesTitleBlock}>
            <Text style={styles.notesKicker}>{t("focus.retention_loop", "Retention loop")}</Text>
            <Text style={styles.notesTitle}>{t("focus.notes_title", "Capture the thing you'll forget later.")}</Text>
          </View>
          <Text style={styles.notesBadge}>{t("focus.notes_badge", "Notes")}</Text>
        </View>
        <Text style={styles.notesCopy}>{t("focus.notes_copy", "Optional notes attach to this focus block, so studying creates useful history instead of just a timer log.")}</Text>
        <TextInput
          multiline
          value={classNote}
          onChangeText={setClassNote}
          editable={Boolean(selected)}
          placeholder={
            selected
              ? t("focus.notes_placeholder", "Example: Prof said quiz pulls from slides 18-24. Review enzyme chart.")
              : t("focus.notes_disabled_placeholder", "Choose an assignment before adding notes.")
          }
          placeholderTextColor={colors.faint}
          style={[styles.notesInput, !selected ? styles.notesInputDisabled : null]}
          textAlignVertical="top"
        />
        {recentNotes.length > 0 ? (
          <View style={styles.recentNotes}>
            <Text style={styles.recentNotesTitle}>{t("focus.recent_saved_notes", "Recent saved notes")}</Text>
            {recentNotes.map((session) => {
              const assignment = assignments.find((item) => item.id === session.assignmentId);
              return (
                <View key={session.id} style={styles.recentNoteRow}>
                  <Text style={styles.recentNoteMeta} numberOfLines={1}>
                    {assignment?.title || t("focus.focus_note", "Focus note")} · {formatFocusDate(session.startedAt, locale)}
                  </Text>
                  <Text style={styles.recentNote} numberOfLines={3}>
                    {session.notes}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.recentEmpty}>
            <Text style={styles.recentEmptyTitle}>{t("focus.no_saved_notes", "No saved focus notes yet")}</Text>
            <Text style={styles.recentEmptyCopy}>{t("focus.no_saved_notes_copy", "Start a task, write a note, then save the session. Recent notes will appear here.")}</Text>
          </View>
        )}
      </View>

      {plannedSessions.length > 0 ? (
        <>
          <SectionHeader title={t("focus.saved_study_blocks", "Saved study blocks")} note={t("focus.saved_study_blocks_note", "These were saved from your busy week helper.")} />
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
                    <Text style={styles.plannedTitle} numberOfLines={2}>
                      {assignment?.title || t("focus.planned_focus", "Planned focus")}
                    </Text>
                    <Text style={styles.plannedMeta} numberOfLines={1}>
                      {course?.code || t("today.class_fallback", "class")} · {formatFocusDate(session.startedAt, locale)} · {formatLocalized(t("focus.minutes_short", "{minutes}m"), { minutes: String(session.durationMinutes) })}
                    </Text>
                  </View>
                  <Badge label={t("focus.status_planned", "Planned")} tone="blue" />
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : null}

      <SectionHeader title={t("focus.choose_what_to_study", "Choose what to study")} note={t("focus.choose_note", "The timer will be attached to this task.")} />
      <View style={styles.assignmentList}>
        {focusableAssignments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t("focus.no_open_assignments", "No open assignments")}</Text>
            <Text style={styles.emptyCopy}>{t("focus.empty_queue_copy", "Add homework from Today, Scan, or Classes. When work is active, it becomes the focus queue here.")}</Text>
          </View>
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
                animateFocusChange();
                setSelectedId(assignment.id);
                setSelectedPlannedDuration(null);
                setRunning(false);
                setStartedAt(null);
                setPauseRecorded(false);
              }}
            >
              <View style={[styles.classDot, { backgroundColor: getCourseForAssignment(courses, assignment)?.color || colors.accent }]} />
              <View style={styles.assignmentCopy}>
                <Text style={styles.assignmentCourse} numberOfLines={1}>
                  {getCourseForAssignment(courses, assignment)?.code || t("today.class_fallback", "class")}
                </Text>
                <Text style={styles.assignmentTitle} numberOfLines={2}>
                  {assignment.title}
                </Text>
              </View>
              <Badge
                label={formatLocalized(t("today.minutes_short", "{minutes} min"), { minutes: String(assignment.estimatedMinutes) })}
                tone={assignment.priority === "high" ? "red" : "neutral"}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {recentStudyHistory.length > 0 ? (
        <>
          <SectionHeader
            title={t("focus.recent_focus", "Recent focus")}
            note={formatLocalized(t("focus.latest_sessions", "{count} latest sessions"), { count: String(recentStudyHistory.length) })}
          />
          <View style={styles.historyList}>
            {recentStudyHistory.map((session) => {
              const assignment = assignments.find((item) => item.id === session.assignmentId);
              const course = assignment ? getCourseForAssignment(courses, assignment) : undefined;
              return (
                <View key={session.id} style={styles.historyRow}>
                  <View style={[styles.historyDot, { backgroundColor: course?.color || colors.accent }]} />
                  <View style={styles.historyCopy}>
                    <Text style={styles.historyTitle} numberOfLines={1}>{assignment?.title || t("focus.stage_kicker", "Focus session")}</Text>
                    <Text style={styles.historyMeta} numberOfLines={1}>
                      {formatLocalized(t("focus.minutes_short", "{minutes}m"), { minutes: String(session.durationMinutes) })} · {labelizeStatus(session.status, t)} · {formatFocusDate(session.startedAt, locale)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      <View style={styles.bottomActions}>
        <AppButton
          label={startedAt ? t("focus.done_save_complete", "Done - save time and complete task") : t("focus.complete_task", "Complete task")}
          icon={Power}
          disabled={!selected}
          onPress={complete}
          style={styles.bottomButton}
        />
        <AppButton
          label={formatLocalized(t("focus.save_minutes_only", "Save {minutes} min only"), { minutes: String(elapsedMinutes) })}
          variant="secondary"
          disabled={!selected || !startedAt || pauseRecorded || elapsedMinutes <= 0}
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
    const session: FocusSession = {
      id: `focus-${Date.now()}`,
      assignmentId: selected.id,
      durationMinutes: Math.max(1, durationMinutes),
      startedAt: startedRef.current || new Date().toISOString(),
      endedAt: new Date().toISOString(),
      status,
      sessionNumber,
      notes: classNote.trim() || undefined
    };
    onRecordSession(session);
    if (classNote.trim() && status !== "running") {
      onAddNote?.({
        assignmentId: selected.id,
        courseId: selected.courseId,
        focusSessionId: session.id,
        kind: "focus",
        title: formatLocalized(t("focus.note_title", "{task} focus note"), { task: selected.title }),
        body: classNote.trim(),
        tags: ["focus"],
        pinned: false
      });
    }
  }
}

function CockpitStat({
  icon: Icon,
  value,
  label
}: {
  icon: React.ComponentType<{ color: string; size: number }>;
  value: string;
  label: string;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.cockpitStat}>
      <Icon color="#BDB7FF" size={15} />
      <Text style={styles.cockpitValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.74}>{value}</Text>
      <Text style={styles.cockpitLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function formatFocusDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "numeric"
  }).format(new Date(value));
}

function formatDueLabel(value: string, locale: string, t: TranslateFn) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("focus.date_not_set", "date not set");
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
}

function labelizeStatus(status: FocusSession["status"], t: TranslateFn) {
  if (status === "completed") return t("focus.status_completed", "Completed");
  if (status === "paused") return t("focus.status_paused", "Paused");
  if (status === "planned") return t("focus.status_planned", "Planned");
  if (status === "stopped") return t("focus.status_stopped", "Stopped");
  return status;
}

function animateFocusChange() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

function formatLocalized(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((current, [key, value]) => current.replaceAll(`{${key}}`, value), template);
}

function validAccent(value: string | undefined, fallback: string) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function withAlpha(color: string, alpha: number) {
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

function createStyles(theme: AppTheme, focusAccent?: string) {
  const { colors, radii, spacing } = theme;
  const accent = validAccent(focusAccent, "#22C55E");

  return StyleSheet.create({
    focusStage: {
      minHeight: 0,
      borderRadius: 34,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(5,5,5,0.08)",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.07)" : "#FFFFFF",
      padding: spacing.lg,
      alignItems: "center",
      overflow: "hidden",
      shadowColor: "#000000",
      shadowOpacity: theme.isDark ? 0.18 : 0.09,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 2
    },
    focusGlow: {
      display: "none",
      position: "absolute",
      top: -90,
      right: -80,
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: "transparent",
      opacity: 0
    },
    focusGlowSecondary: {
      display: "none",
      position: "absolute",
      left: -80,
      bottom: -95,
      width: 230,
      height: 230,
      borderRadius: 115,
      backgroundColor: "transparent",
      opacity: 0
    },
    stageHeader: {
      alignSelf: "stretch",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm
    },
    stageTitleBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    stageKicker: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    stageSubcopy: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    depthStrip: {
      alignSelf: "stretch",
      marginTop: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.07)" : colors.surfaceAlt,
      padding: spacing.sm,
      gap: 3
    },
    depthKicker: {
      color: colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    depthText: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    depthMeta: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    timerRing: {
      marginTop: spacing.lg,
      width: 194,
      height: 194,
      borderRadius: 97,
      borderWidth: 11,
      borderColor: accent,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: accent,
      shadowOpacity: 0.24,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 0 }
    },
    timerRingInner: {
      width: 148,
      height: 148,
      borderRadius: 74,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.05)" : colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center"
    },
    timer: {
      color: colors.ink,
      fontSize: 44,
      lineHeight: 52,
      fontWeight: "300"
    },
    timerMeta: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    progressTrack: {
      width: "100%",
      maxWidth: 210,
      height: 8,
      borderRadius: 4,
      marginTop: spacing.sm,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.10)" : colors.line,
      overflow: "hidden"
    },
    progressFill: {
      height: "100%",
      borderRadius: 4,
      backgroundColor: accent
    },
    focusingOn: {
      marginTop: spacing.md,
      color: colors.accent,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    timerTask: {
      marginTop: 3,
      color: colors.ink,
      fontSize: 17,
      lineHeight: 22,
      textAlign: "center",
      fontWeight: "900"
    },
    timerCourse: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    focusClassPill: {
      alignSelf: "center",
      maxWidth: "100%",
      borderRadius: radii.round,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.07)" : colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : colors.line,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    focusClassIcon: {
      width: 23,
      height: 23,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center"
    },
    focusClassEmoji: {
      fontSize: 13,
      lineHeight: 15
    },
    focusClassText: {
      minWidth: 0,
      flexShrink: 1,
      color: colors.ink,
      fontSize: 12,
      lineHeight: 15,
      fontWeight: "900"
    },
    cockpitStats: {
      alignSelf: "stretch",
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md
    },
    cockpitStat: {
      flex: 1,
      minWidth: 0,
      borderRadius: 20,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.07)" : colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.12)" : colors.line,
      padding: spacing.sm,
      gap: 3
    },
    cockpitValue: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 20,
      fontWeight: "900"
    },
    cockpitLabel: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    durationRow: {
      alignSelf: "stretch",
      flexDirection: "row",
      gap: spacing.xs,
      marginTop: spacing.xs
    },
    durationChip: {
      flex: 1,
      minHeight: 36,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.07)" : colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.13)" : colors.line
    },
    durationChipActive: {
      backgroundColor: withAlpha(accent, 0.18),
      borderColor: withAlpha(accent, 0.44)
    },
    durationText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    durationTextActive: {
      color: colors.ink
    },
    controlRow: {
      marginTop: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "stretch",
      gap: spacing.sm
    },
    roundControl: {
      width: 56,
      height: 56,
      borderRadius: 20,
      backgroundColor: theme.isDark ? "#F8FAFC" : "#050505",
      alignItems: "center",
      justifyContent: "center"
    },
    primaryControl: {
      minWidth: 118,
      flex: 1,
      height: 56,
      borderRadius: 20,
      backgroundColor: accent,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.sm
    },
    primaryControlText: {
      color: "#FFFFFF",
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900",
      textAlign: "center"
    },
    controlDisabled: {
      opacity: 0.45
    },
    silencedCopy: {
      marginTop: spacing.sm,
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "800",
      textAlign: "center"
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
      justifyContent: "space-between",
      gap: spacing.sm
    },
    notesTitleBlock: {
      flex: 1,
      minWidth: 0,
      gap: 4
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
    notesInputDisabled: {
      opacity: 0.72
    },
    recentNotes: {
      gap: spacing.xs
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
    recentNoteRow: {
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.58)",
      padding: spacing.sm,
      gap: 3
    },
    recentNoteMeta: {
      color: colors.faint,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    recentEmpty: {
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md,
      gap: 4
    },
    recentEmptyTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    recentEmptyCopy: {
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
      gap: 2,
      minWidth: 0
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
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: 4
    },
    emptyTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    emptyCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
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
      gap: 2,
      minWidth: 0
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
    historyList: {
      gap: spacing.sm
    },
    historyRow: {
      minHeight: 64,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    historyDot: {
      width: 10,
      height: 36,
      borderRadius: 6
    },
    historyCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    historyTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    historyMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    bottomActions: {
      gap: spacing.sm,
      marginTop: spacing.lg
    },
    bottomButton: {
      flex: 1
    }
  });
}
