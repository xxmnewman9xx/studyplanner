import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ChevronLeft, ChevronRight, Plus, Sparkles, Timer } from "lucide-react-native";
import {
  AssignmentRow,
  EmptyState,
  GlassCard
} from "../components/AppleComponents";
import { AppButton } from "../components/AppButton";
import { SectionHeader } from "../components/SectionHeader";
import { Assignment, Course, FocusSession } from "../models";
import {
  getBusyWeekInsight,
  getCalendarEventsByDay,
  getCourseForAssignment,
  getWeekLoad
} from "../logic/planner";
import { parseQuickHomeworkInput } from "../services/quickHomeworkParser";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type PlanScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  sessions: FocusSession[];
  onOpenAssignment: (assignmentId: string) => void;
  onOpenFocus: (assignmentId?: string) => void;
  onUpdateStatus: (assignmentId: string, status: "not_started" | "in_progress" | "done") => void;
  onRecordSession: (session: FocusSession) => void;
  onAddQuickAssignment: (courseId: string, title: string, dueDate: string, kind: "assignment") => boolean;
};

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

export function PlanScreen({ assignments, courses, sessions, onOpenAssignment, onOpenFocus, onUpdateStatus, onRecordSession, onAddQuickAssignment }: PlanScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const today = useMemo(() => new Date(), []);
  const [monthCursor, setMonthCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [quickPlanText, setQuickPlanText] = useState("");
  const [savedSurvivalCount, setSavedSurvivalCount] = useState(0);
  const eventsByDay = getCalendarEventsByDay(assignments, courses);
  const selectedEvents = eventsByDay[selectedDate] || [];
  const weekLoad = getWeekLoad(assignments, today);
  const insight = getBusyWeekInsight(assignments, today);
  const overdue = buildPlanCatchUpQueue(assignments, today);
  const survivalPlan = buildDeadlineSurvivalPlan(assignments, today);
  const savedSurvivalKeys = new Set(
    sessions
      .filter((session) => session.status === "planned")
      .map((session) => survivalBlockKey(session.assignmentId, session.startedAt.slice(0, 10)))
  );
  const unsavedSurvivalBlocks = survivalPlan.blocks.filter(
    (block) => !savedSurvivalKeys.has(survivalBlockKey(block.assignment.id, block.dateKey))
  );
  const survivalFirst = survivalPlan.items[0];
  const survivalCourse = survivalFirst ? getCourseForAssignment(courses, survivalFirst) : undefined;
  const catchUpFirst = overdue[0];
  const catchUpCourse = catchUpFirst ? getCourseForAssignment(courses, catchUpFirst) : undefined;
  const catchUpMinutes = Math.min(catchUpFirst?.estimatedMinutes || 25, 15);
  const monthDays = buildMonthDays(monthCursor);
  const maxLoad = Math.max(...weekLoad.map((day) => day.score), 1);
  const primarySuggestion = insight.suggestions.find((suggestion) => suggestion.assignmentId);
  const parsedPlanCapture = parseQuickHomeworkInput(quickPlanText, courses, courses[0], selectedDate);
  const primaryAssignmentId = selectedEvents[0]?.assignment.id || primarySuggestion?.assignmentId;
  const primaryActionLabel = selectedEvents[0] ? "Open selected work" : primarySuggestion ? "Open priority work" : "Review classes";
  const primaryActionDetail = selectedEvents[0]
    ? `${selectedEvents.length} item${selectedEvents.length === 1 ? "" : "s"} due on the selected day.`
    : primarySuggestion?.copy || "No urgent work selected. Check classes and notes to keep the plan current.";

  const moveMonth = (offset: number) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const addPlanCapture = () => {
    if (!parsedPlanCapture.course || !parsedPlanCapture.title.trim() || !parsedPlanCapture.dueDate.trim()) return;
    const added = onAddQuickAssignment(parsedPlanCapture.course.id, parsedPlanCapture.title, parsedPlanCapture.dueDate, "assignment");
    if (!added) return;

    setSelectedDate(parsedPlanCapture.dueDate);
    setMonthCursor(new Date(`${parsedPlanCapture.dueDate}T12:00:00`));
    setQuickPlanText("");
  };

  const saveSurvivalBlocks = () => {
    const timestamp = Date.now();
    unsavedSurvivalBlocks.forEach((block, index) => {
      onRecordSession({
        id: `survival-${timestamp}-${index}`,
        assignmentId: block.assignment.id,
        durationMinutes: block.minutes,
        startedAt: `${block.dateKey}T16:00:00`,
        status: "planned",
        sessionNumber: timestamp + index,
        notes: "Planned from Survival Plan."
      });
    });
    setSavedSurvivalCount(unsavedSurvivalBlocks.length);
  };

  return (
    <View style={styles.screen}>
      <GlassCard tone="hero" style={styles.hero}>
        <View style={styles.heroOrbPrimary} />
        <View style={styles.heroOrbSecondary} />
        <View style={styles.heroTop}>
          <View style={styles.heroTitleBlock}>
            <Text style={styles.kicker}>Plan</Text>
            <Text style={styles.title}>Week strategy board.</Text>
          </View>
          <View style={styles.heroIcon}>
            <Sparkles color={colors.heroText} size={19} />
          </View>
        </View>
        <Text style={styles.heroCopy}>
          A clean mission map for deadlines, focus lifts, and the next move that protects your grade.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.primaryPlanAction}
          onPress={() => {
            if (primaryAssignmentId) {
              onOpenAssignment(primaryAssignmentId);
            }
          }}
        >
          <View style={styles.primaryPlanCopy}>
            <Text style={styles.primaryPlanKicker}>Next planning move</Text>
            <Text style={styles.primaryPlanTitle}>{primaryActionLabel}</Text>
            <Text style={styles.primaryPlanDetail}>{primaryActionDetail}</Text>
          </View>
          <ChevronRight color={colors.heroText} size={18} />
        </TouchableOpacity>
        <View style={styles.heroStats}>
          <MiniStat label="Today" value={String(weekLoad.find((day) => day.dateKey === dateKey(today))?.items.length || 0)} />
          <MiniStat label="Power" value={String(insight.heavyDays.length)} />
          <MiniStat label="Week" value={String(weekLoad.reduce((sum, day) => sum + day.items.length, 0))} />
        </View>
      </GlassCard>

      {catchUpFirst ? (
        <>
          <SectionHeader title="Catch up" note={`${overdue.length} late · start with the smallest task`} />
          <GlassCard style={styles.catchUpCard}>
            <View style={styles.catchUpTopRow}>
              <View style={styles.catchUpBadge}>
                <Text style={styles.catchUpBadgeText}>No shame reset</Text>
              </View>
              <Text style={styles.catchUpMeta}>{catchUpMinutes}m save</Text>
            </View>
            <Text style={styles.catchUpTitle}>
              Start with {catchUpCourse?.code ? `${catchUpCourse.code}: ` : ""}{catchUpFirst.title}
            </Text>
            <Text style={styles.catchUpCopy}>
              Plan shows the whole backlog, but recovery starts with one small focus block. Finish this, then re-check the week.
            </Text>
            <View style={styles.catchUpActions}>
              <AppButton
                label="Study this now"
                icon={Timer}
                onPress={() => {
                  onUpdateStatus(catchUpFirst.id, "in_progress");
                  onOpenFocus(catchUpFirst.id);
                }}
                style={styles.catchUpButton}
              />
              <AppButton
                label="See task details"
                variant="secondary"
                onPress={() => onOpenAssignment(catchUpFirst.id)}
                style={styles.catchUpButton}
              />
            </View>
          </GlassCard>
        </>
      ) : null}

      <SectionHeader title="Add one homework" note="Type the task. It lands on this calendar." />
      <GlassCard style={styles.captureCard}>
        <TextInput
          value={quickPlanText}
          onChangeText={setQuickPlanText}
          placeholder="BIO lab report due Friday"
          placeholderTextColor={colors.heroMuted}
          style={styles.captureInput}
        />
        {quickPlanText.trim() ? (
          <Text style={styles.capturePreview}>
            Will add {parsedPlanCapture.course?.code || "class"} · {parsedPlanCapture.title || "work"} · due {formatSelectedDate(parsedPlanCapture.dueDate)}
          </Text>
        ) : (
          <Text style={styles.captureHint}>Defaults to the selected calendar day unless you type a due date.</Text>
        )}
        <AppButton
          label="Add to calendar"
          icon={Plus}
          disabled={!parsedPlanCapture.course || !parsedPlanCapture.title.trim() || !parsedPlanCapture.dueDate.trim()}
          onPress={addPlanCapture}
        />
      </GlassCard>

      <SectionHeader title={`${monthCursor.toLocaleString("en-US", { month: "long" })} calendar`} note="Dots mean homework is due that day." />
      <GlassCard style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <TouchableOpacity accessibilityRole="button" style={styles.monthButton} onPress={() => moveMonth(-1)}>
            <ChevronLeft color={colors.heroText} size={18} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {monthCursor.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </Text>
          <TouchableOpacity accessibilityRole="button" style={styles.monthButton} onPress={() => moveMonth(1)}>
            <ChevronRight color={colors.heroText} size={18} />
          </TouchableOpacity>
        </View>
        <View style={styles.weekdayRow}>
          {weekdays.map((day, index) => (
            <Text key={`${day}-${index}`} style={styles.weekday}>
              {day}
            </Text>
          ))}
        </View>
        <View style={styles.monthGrid}>
          {monthDays.map((day) => {
            const key = dateKey(day.date);
            const events = eventsByDay[key] || [];
            const active = key === selectedDate;
            const inMonth = day.date.getMonth() === monthCursor.getMonth();
            const isToday = key === dateKey(today);
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={key}
                style={[
                  styles.dayCell,
                  active ? styles.dayCellActive : null,
                  isToday ? styles.dayCellToday : null,
                  !inMonth ? styles.dayCellMuted : null
                ]}
                onPress={() => setSelectedDate(key)}
              >
                <Text style={[styles.dayNumber, active ? styles.dayNumberActive : null]}>
                  {day.date.getDate()}
                </Text>
                <View style={styles.eventDots}>
                  {events.slice(0, 3).map((event) => (
                    <View
                      key={event.id}
                      style={[styles.eventDot, { backgroundColor: event.course?.color || colors.accent }]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassCard>

      <SectionHeader title="Day you picked" note={formatSelectedDate(selectedDate)} />
      <View style={styles.list}>
        {selectedEvents.length === 0 ? (
          <EmptyState title="Nothing due here" copy="Pick another date or enjoy the breathing room." emoji="calendar" />
        ) : (
          selectedEvents.map((event) => (
            <AssignmentRow
              key={event.id}
              assignment={event.assignment}
              course={event.course}
              onPress={() => onOpenAssignment(event.assignment.id)}
            />
          ))
        )}
      </View>

      {survivalPlan.active && survivalFirst ? (
        <>
          <SectionHeader title="Busy week helper" note={`${survivalPlan.items.length} deadlines in the next ${survivalPlan.windowDays} days`} />
          <GlassCard style={styles.survivalCard}>
            <View style={styles.survivalHeaderRow}>
              <View>
                <Text style={styles.survivalKicker}>Cram protection</Text>
                <Text style={styles.survivalTitle}>Spread the pressure before it stacks.</Text>
              </View>
              <Text style={styles.survivalCount}>{survivalPlan.totalMinutes}m</Text>
            </View>
            <Text style={styles.survivalCopy}>
              Start with {survivalCourse?.code ? `${survivalCourse.code}: ` : ""}{survivalFirst.title}, then split the rest into small blocks across the week.
            </Text>
            <View style={styles.survivalBlockList}>
              {survivalPlan.blocks.map((block) => {
                const course = getCourseForAssignment(courses, block.assignment);
                return (
                  <View key={`${block.dateKey}-${block.assignment.id}`} style={styles.survivalBlockRow}>
                    <View style={styles.survivalDayPill}>
                      <Text style={styles.survivalDayText}>{block.label}</Text>
                    </View>
                    <View style={styles.survivalBlockCopy}>
                      <Text style={styles.survivalBlockTitle}>{course?.code ? `${course.code} · ` : ""}{block.assignment.title}</Text>
                      <Text style={styles.survivalBlockMeta}>{block.minutes}m focus block · due {formatSelectedDate(block.assignment.dueAt.slice(0, 10))}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.survivalActions}>
              <AppButton
                label="Study first block"
                icon={Timer}
                onPress={() => {
                  onUpdateStatus(survivalFirst.id, "in_progress");
                  onOpenFocus(survivalFirst.id);
                }}
                style={styles.survivalButton}
              />
              <AppButton
                label={unsavedSurvivalBlocks.length === 0 ? "Study blocks saved" : `Save ${unsavedSurvivalBlocks.length} study blocks`}
                variant="secondary"
                disabled={unsavedSurvivalBlocks.length === 0}
                onPress={saveSurvivalBlocks}
                style={styles.survivalButton}
              />
            </View>
            {savedSurvivalCount > 0 || unsavedSurvivalBlocks.length === 0 ? (
              <Text style={styles.survivalSavedNote}>
                {savedSurvivalCount > 0
                  ? `${savedSurvivalCount} focus block${savedSurvivalCount === 1 ? "" : "s"} saved to Focus.`
                  : "All survival blocks are already saved in Focus."}
              </Text>
            ) : null}
          </GlassCard>
        </>
      ) : null}

      <SectionHeader title="This week" note="See which days are crowded." />
      <GlassCard style={styles.weekCard}>
        <View style={styles.loadRow}>
          {weekLoad.map((day) => {
            const height = Math.max(12, Math.round((day.score / maxLoad) * 74));
            return (
              <View key={day.dateKey} style={styles.loadColumn}>
                <View style={styles.loadTrack}>
                  <View
                    style={[
                      styles.loadBar,
                      {
                        height,
                        backgroundColor: day.heavy ? colors.brandPink : colors.accent
                      }
                    ]}
                  />
                </View>
                <Text style={styles.loadLabel}>{day.label.slice(0, 1)}</Text>
                <Text style={styles.loadCount}>{day.items.length}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightKicker}>Busy week insight</Text>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightCopy}>{insight.copy}</Text>
        </View>

        <View style={styles.suggestionList}>
          {insight.suggestions.slice(0, 2).map((suggestion) => (
            <TouchableOpacity
              accessibilityRole="button"
              key={suggestion.id}
              style={styles.suggestionRow}
              onPress={() => {
                if (suggestion.assignmentId) onOpenAssignment(suggestion.assignmentId);
              }}
            >
              <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
              <Text style={styles.suggestionCopy}>{suggestion.copy}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>
    </View>
  );

  function MiniStat({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.miniStat}>
        <Text style={styles.miniStatValue}>{value}</Text>
        <Text style={styles.miniStatLabel}>{label}</Text>
      </View>
    );
  }
}

function buildMonthDays(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date };
  });
}

function buildDeadlineSurvivalPlan(assignments: Assignment[], now: Date) {
  const today = dateKey(now);
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + 7);
  const items = assignments
    .filter((assignment) => assignment.status !== "done" && assignment.status !== "archived")
    .filter((assignment) => assignment.dueAt.slice(0, 10) >= today && assignment.dueAt.slice(0, 10) <= dateKey(windowEnd))
    .slice()
    .sort((a, b) => {
      const priorityWeight = { high: 0, medium: 1, low: 2 } as const;
      const priorityDelta = priorityWeight[a.priority] - priorityWeight[b.priority];
      if (priorityDelta !== 0) return priorityDelta;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });

  const totalMinutes = items.reduce((sum, item) => sum + (item.estimatedMinutes || 25), 0);
  const blocks = buildSurvivalBlocks(items, now);
  return {
    active: items.length >= 3 || totalMinutes >= 180,
    items,
    blocks,
    totalMinutes,
    windowDays: 7
  };
}

function survivalBlockKey(assignmentId: string, dateKeyValue: string) {
  return `${assignmentId}:${dateKeyValue}`;
}

function buildSurvivalBlocks(items: Assignment[], now: Date) {
  const dayLabels = ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];
  const blocks = items.slice(0, 6).map((assignment, index) => {
    const blockDate = new Date(now);
    blockDate.setDate(blockDate.getDate() + Math.min(index, 6));
    const minutes = Math.min(Math.max(Math.round((assignment.estimatedMinutes || 30) / 2), 20), 45);
    return {
      assignment,
      dateKey: dateKey(blockDate),
      label: dayLabels[index] || `Day ${index + 1}`,
      minutes
    };
  });

  return blocks;
}

function buildPlanCatchUpQueue(assignments: Assignment[], now: Date) {
  const today = dateKey(now);
  return assignments
    .filter((assignment) => assignment.status !== "done" && assignment.status !== "archived")
    .filter((assignment) => assignment.dueAt.slice(0, 10) < today)
    .slice()
    .sort((a, b) => {
      const minutesDelta = (a.estimatedMinutes || 25) - (b.estimatedMinutes || 25);
      if (minutesDelta !== 0) return minutesDelta;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSelectedDate(key: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short"
  }).format(new Date(`${key}T12:00:00`));
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    screen: {
      gap: 0
    },
    hero: {
      gap: spacing.sm,
      padding: spacing.md,
      overflow: "hidden"
    },
    heroOrbPrimary: {
      position: "absolute",
      right: -60,
      top: -78,
      width: 176,
      height: 176,
      borderRadius: 88,
      backgroundColor: colors.brandViolet,
      opacity: theme.isDark ? 0.17 : 0.08
    },
    heroOrbSecondary: {
      position: "absolute",
      left: -52,
      bottom: -70,
      width: 146,
      height: 146,
      borderRadius: 73,
      backgroundColor: colors.accent,
      opacity: theme.isDark ? 0.15 : 0.08
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
    heroIcon: {
      width: 42,
      height: 42,
      borderRadius: 15,
      backgroundColor: "rgba(255,255,255,0.12)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center"
    },
    kicker: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.8,
      textTransform: "uppercase"
    },
    title: {
      color: colors.heroText,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "900",
      letterSpacing: -0.5
    },
    heroCopy: {
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600"
    },
    primaryPlanAction: {
      minHeight: 88,
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.20)",
      backgroundColor: "rgba(255,255,255,0.12)",
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      overflow: "hidden"
    },
    primaryPlanCopy: {
      flex: 1,
      minWidth: 0
    },
    primaryPlanKicker: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    primaryPlanTitle: {
      color: colors.heroText,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    primaryPlanDetail: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    heroStats: {
      flexDirection: "row",
      borderRadius: radii.lg,
      backgroundColor: "rgba(255,255,255,0.10)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.16)",
      overflow: "hidden"
    },
    miniStat: {
      flex: 1,
      minHeight: 56,
      alignItems: "center",
      justifyContent: "center",
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: "rgba(255,255,255,0.12)"
    },
    miniStatValue: {
      color: colors.heroText,
      fontSize: 22,
      lineHeight: 27,
      fontWeight: "900"
    },
    miniStatLabel: {
      color: colors.heroMuted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      letterSpacing: 0.6,
      textTransform: "uppercase"
    },
    catchUpCard: {
      gap: spacing.sm,
      padding: spacing.md,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)",
      backgroundColor: colors.heroSurface
    },
    catchUpTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm
    },
    catchUpBadge: {
      borderRadius: radii.round,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6
    },
    catchUpBadgeText: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    catchUpMeta: {
      color: colors.heroMuted,
      fontSize: 12,
      fontWeight: "900"
    },
    catchUpTitle: {
      color: colors.heroText,
      fontSize: 19,
      lineHeight: 25,
      fontWeight: "900"
    },
    catchUpCopy: {
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700"
    },
    catchUpActions: {
      flexDirection: "row",
      gap: spacing.sm
    },
    catchUpButton: {
      flex: 1
    },
    captureCard: {
      gap: spacing.sm,
      padding: spacing.md,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)",
      backgroundColor: colors.heroSurface
    },
    captureInput: {
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
    capturePreview: {
      color: colors.heroMuted,
      fontSize: 12,
      fontWeight: "800",
      lineHeight: 17
    },
    captureHint: {
      color: colors.heroMuted,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 17
    },
    calendarCard: {
      padding: spacing.md,
      overflow: "hidden",
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)",
      backgroundColor: colors.heroSurface
    },
    monthHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm
    },
    monthButton: {
      width: 38,
      height: 38,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "rgba(255,255,255,0.1)",
      alignItems: "center",
      justifyContent: "center"
    },
    monthTitle: {
      color: colors.heroText,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "900"
    },
    weekdayRow: {
      flexDirection: "row",
      marginBottom: spacing.xs
    },
    weekday: {
      flex: 1,
      textAlign: "center",
      color: colors.heroMuted,
      fontSize: 11,
      fontWeight: "900"
    },
    monthGrid: {
      flexDirection: "row",
      flexWrap: "wrap"
    },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radii.md,
      gap: 4
    },
    dayCellActive: {
      backgroundColor: colors.accent
    },
    dayCellToday: {
      borderWidth: 1,
      borderColor: colors.brandPink,
      backgroundColor: "rgba(255,122,144,0.1)"
    },
    dayCellMuted: {
      opacity: 0.35
    },
    dayNumber: {
      color: colors.heroText,
      fontSize: 13,
      fontWeight: "900"
    },
    dayNumberActive: {
      color: colors.heroText
    },
    eventDots: {
      minHeight: 6,
      flexDirection: "row",
      gap: 3
    },
    eventDot: {
      width: 5,
      height: 5,
      borderRadius: 3
    },
    list: {
      gap: spacing.sm
    },
    survivalCard: {
      gap: spacing.sm,
      padding: spacing.md,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)",
      backgroundColor: colors.heroSurface
    },
    survivalHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.md
    },
    survivalKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.6,
      textTransform: "uppercase"
    },
    survivalTitle: {
      color: colors.heroText,
      fontSize: 19,
      lineHeight: 25,
      fontWeight: "900"
    },
    survivalCount: {
      color: colors.heroText,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    survivalCopy: {
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700"
    },
    survivalBlockList: {
      gap: spacing.xs
    },
    survivalBlockRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
      backgroundColor: "rgba(255,255,255,0.08)",
      padding: spacing.sm
    },
    survivalDayPill: {
      width: 72,
      borderRadius: radii.round,
      backgroundColor: colors.accentSoft,
      paddingVertical: 6,
      alignItems: "center"
    },
    survivalDayText: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "900"
    },
    survivalBlockCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    survivalBlockTitle: {
      color: colors.heroText,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    survivalBlockMeta: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    survivalActions: {
      flexDirection: "row",
      gap: spacing.sm
    },
    survivalButton: {
      flex: 1
    },
    survivalSavedNote: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "900"
    },
    weekCard: {
      gap: spacing.md
    },
    loadRow: {
      minHeight: 110,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm
    },
    loadColumn: {
      flex: 1,
      alignItems: "center",
      gap: 5
    },
    loadTrack: {
      width: "100%",
      height: 82,
      borderRadius: radii.round,
      backgroundColor: colors.surfaceAlt,
      justifyContent: "flex-end",
      overflow: "hidden"
    },
    loadBar: {
      width: "100%",
      borderRadius: radii.round
    },
    loadLabel: {
      color: colors.faint,
      fontSize: 11,
      fontWeight: "900"
    },
    loadCount: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: "900"
    },
    insightCard: {
      borderRadius: radii.lg,
      backgroundColor: theme.isDark ? "rgba(53,242,208,0.10)" : colors.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(53,242,208,0.22)" : colors.line,
      padding: spacing.md,
      gap: 3
    },
    insightKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.6,
      textTransform: "uppercase"
    },
    insightTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "900"
    },
    insightCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    },
    suggestionList: {
      gap: spacing.xs
    },
    suggestionRow: {
      borderRadius: radii.md,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md,
      gap: 2
    },
    suggestionTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    suggestionCopy: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "700"
    }
  });
}
