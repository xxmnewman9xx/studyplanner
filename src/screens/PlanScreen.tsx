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
  onOpenScan: () => void;
};

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

export function PlanScreen({ assignments, courses, sessions, onOpenAssignment, onOpenFocus, onUpdateStatus, onRecordSession, onAddQuickAssignment, onOpenScan }: PlanScreenProps) {
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
  const weekSummary = buildWeekLoadSummary(weekLoad, sessions);
  const overdue = buildPlanCatchUpQueue(assignments, today);
  const openAssignments = assignments.filter(
    (assignment) => assignment.status !== "done" && assignment.status !== "archived"
  );
  const totalOpenMinutes = openAssignments.reduce(
    (sum, assignment) => sum + (assignment.estimatedMinutes || 25),
    0
  );
  const dueTodayCount = openAssignments.filter((assignment) => assignment.dueAt.slice(0, 10) === dateKey(today)).length;
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
  const primaryActionLabel = selectedEvents[0]
    ? "Open selected work"
    : primarySuggestion
      ? "Open priority work"
      : courses.length
        ? "Scan syllabus or paste work"
        : "Add a class, then plan";
  const primaryActionDetail = selectedEvents[0]
    ? `${selectedEvents.length} item${selectedEvents.length === 1 ? "" : "s"} due on the selected day.`
    : primarySuggestion?.copy || "The week stays empty until real assignments have due dates.";
  const planState = buildPlanState(assignments, courses, overdue.length, weekSummary.totalItems);
  const weekGroups = buildSimpleWeekGroups(openAssignments, today);
  const monthTitle = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthCursor);

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
        <View style={styles.heroTop}>
          <View style={styles.heroTitleBlock}>
            <Text style={styles.kicker}>Calendar</Text>
            <Text style={styles.title}>See your semester workload.</Text>
          </View>
          <View style={styles.heroIcon}>
            <Sparkles color={colors.heroText} size={19} />
          </View>
        </View>
        <Text style={styles.heroCopy}>
          Weeks are grouped by urgency so you can see where school gets heavy.
        </Text>
        <View style={styles.heroStats}>
          <MiniStat label="Open" value={String(openAssignments.length)} />
          <MiniStat label="Load" value={formatHoursValue(totalOpenMinutes || weekSummary.totalMinutes)} />
          <MiniStat label="Late" value={String(overdue.length)} />
        </View>
      </GlassCard>

      <GlassCard style={styles.captureCard}>
        <Text style={styles.catchUpBadgeText}>Capture</Text>
        <Text style={styles.catchUpTitle}>Put new work on the selected day.</Text>
        <Text style={styles.catchUpCopy}>Type a quick note after class. It becomes real planner data, not a decorative calendar event.</Text>
        <TextInput
          value={quickPlanText}
          onChangeText={setQuickPlanText}
          placeholder="BIO lab worksheet Friday"
          placeholderTextColor={colors.heroMuted}
          style={styles.captureInput}
        />
        {quickPlanText.trim() ? (
          <Text style={styles.capturePreview}>
            Will add {parsedPlanCapture.course?.code || courses[0]?.code || "class"} · {parsedPlanCapture.title || "work"} · due {formatSelectedDate(parsedPlanCapture.dueDate || selectedDate)}
          </Text>
        ) : (
          <Text style={styles.captureHint}>Selected day: {formatSelectedDate(selectedDate)}</Text>
        )}
        <View style={styles.catchUpActions}>
          <AppButton
            label={courses.length ? "Add to calendar" : "Scan syllabus"}
            icon={Plus}
            disabled={courses.length > 0 && (!parsedPlanCapture.course || !parsedPlanCapture.title.trim() || !parsedPlanCapture.dueDate.trim())}
            onPress={courses.length ? addPlanCapture : onOpenScan}
            style={styles.catchUpButton}
          />
          <AppButton label="Scan instead" variant="secondary" onPress={onOpenScan} style={styles.catchUpButton} />
        </View>
      </GlassCard>

      {survivalPlan.active ? (
        <GlassCard style={styles.catchUpCard}>
          <View style={styles.catchUpTopRow}>
            <View style={styles.catchUpBadge}>
              <Text style={styles.catchUpBadgeText}>Survival plan</Text>
            </View>
            <Text style={styles.catchUpMeta}>{formatHoursValue(survivalPlan.totalMinutes)} due soon</Text>
          </View>
          <Text style={styles.catchUpTitle}>
            {survivalCourse?.code ? `${survivalCourse.code}: ` : ""}{survivalFirst?.title || "This week is getting heavy."}
          </Text>
          <Text style={styles.catchUpCopy}>
            Split the next {survivalPlan.windowDays} days into focus blocks before the busy days stack up.
          </Text>
          <View style={styles.survivalList}>
            {survivalPlan.blocks.slice(0, 4).map((block) => {
              const course = getCourseForAssignment(courses, block.assignment);
              const saved = savedSurvivalKeys.has(survivalBlockKey(block.assignment.id, block.dateKey));
              return (
                <View key={`${block.assignment.id}-${block.dateKey}`} style={styles.survivalRow}>
                  <Text style={styles.survivalDay}>{block.label}</Text>
                  <View style={styles.survivalItemCopy}>
                    <Text style={styles.survivalItemTitle} numberOfLines={1}>{course?.code ? `${course.code} · ` : ""}{block.assignment.title}</Text>
                    <Text style={styles.survivalMeta}>{block.minutes}m block · {saved ? "saved" : formatSelectedDate(block.dateKey)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          {savedSurvivalCount > 0 ? (
            <Text style={styles.savedPlanText}>{savedSurvivalCount} focus block{savedSurvivalCount === 1 ? "" : "s"} saved.</Text>
          ) : null}
          <AppButton
            label={unsavedSurvivalBlocks.length ? "Save focus blocks" : "Focus blocks saved"}
            icon={Timer}
            disabled={unsavedSurvivalBlocks.length === 0}
            onPress={saveSurvivalBlocks}
          />
        </GlassCard>
      ) : null}

      <SectionHeader title="Month" note="Tap a day to inspect due work" />
      <GlassCard style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <TouchableOpacity accessibilityRole="button" style={styles.monthButton} onPress={() => moveMonth(-1)}>
            <ChevronLeft color={colors.heroText} size={18} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.monthButton} onPress={() => moveMonth(1)}>
            <ChevronRight color={colors.heroText} size={18} />
          </TouchableOpacity>
        </View>
        <View style={styles.weekdayRow}>
          {weekdays.map((day, index) => (
            <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>
          ))}
        </View>
        <View style={styles.monthGrid}>
          {monthDays.map(({ date }) => {
            const key = dateKey(date);
            const events = eventsByDay[key] || [];
            const active = key === selectedDate;
            const isToday = key === dateKey(today);
            const muted = date.getMonth() !== monthCursor.getMonth();
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={key}
                style={[
                  styles.dayCell,
                  active ? styles.dayCellActive : null,
                  isToday && !active ? styles.dayCellToday : null,
                  muted ? styles.dayCellMuted : null
                ]}
                onPress={() => setSelectedDate(key)}
              >
                <Text style={[styles.dayNumber, active ? styles.dayNumberActive : null]}>{date.getDate()}</Text>
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
        <View style={styles.selectedDayPanel}>
          <Text style={styles.selectedDayTitle}>{formatSelectedDate(selectedDate)}</Text>
          <Text style={styles.selectedDayMeta}>
            {selectedEvents.length
              ? `${selectedEvents.length} due item${selectedEvents.length === 1 ? "" : "s"}`
              : "No due work on this day"}
          </Text>
          {selectedEvents.slice(0, 2).map((event) => (
            <TouchableOpacity
              accessibilityRole="button"
              key={event.id}
              style={styles.selectedDayRow}
              onPress={() => onOpenAssignment(event.assignment.id)}
            >
              <View style={[styles.selectedDayDot, { backgroundColor: event.course?.color || colors.accent }]} />
              <Text style={styles.selectedDayText} numberOfLines={1}>{event.assignment.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>

      {openAssignments.length > 0 ? (
        <GlassCard style={styles.catchUpCard}>
          <View style={styles.catchUpTopRow}>
            <View style={styles.catchUpBadge}>
              <Text style={styles.catchUpBadgeText}>{planState.badge}</Text>
            </View>
            <Text style={styles.catchUpMeta}>
              {selectedEvents.length ? formatSelectedDate(selectedDate) : `${weekSummary.totalItems} this week`}
            </Text>
          </View>
          <Text style={styles.catchUpTitle}>{planState.title}</Text>
          <Text style={styles.catchUpCopy}>{primaryActionDetail}</Text>
          <View style={styles.catchUpActions}>
            <AppButton
              label={primaryActionLabel}
              icon={Timer}
              onPress={() => {
                if (primaryAssignmentId) {
                  onOpenAssignment(primaryAssignmentId);
                } else {
                  onOpenScan();
                }
              }}
              style={styles.catchUpButton}
            />
            {catchUpFirst ? (
              <AppButton
                label="Start focus"
                icon={Timer}
                variant="secondary"
                onPress={() => onOpenFocus(catchUpFirst.id)}
                style={styles.catchUpButton}
              />
            ) : null}
          </View>
        </GlassCard>
      ) : null}

      {openAssignments.length === 0 ? (
        <GlassCard style={styles.stateCard}>
          <Text style={styles.stateKicker}>Empty plan</Text>
          <Text style={styles.stateTitle}>Scan a syllabus to build your plan.</Text>
          <Text style={styles.stateCopy}>Plan fills in after you review assignments in Scan.</Text>
          <AppButton label="Scan syllabus" onPress={onOpenScan} />
        </GlassCard>
      ) : null}

      <SectionHeader title="This week" note="Workload by day" />
      <GlassCard style={styles.weekCard}>
        {weekSummary.totalItems === 0 ? (
          <View style={styles.emptyWeekPanel}>
            <Text style={styles.emptyWeekTitle}>{openAssignments.length ? "No deadlines this week" : "No weekly load yet"}</Text>
            <Text style={styles.emptyWeekCopy}>{openAssignments.length ? "Late or future work is grouped below." : "Scan a syllabus to build your plan."}</Text>
          </View>
        ) : null}
        {weekSummary.totalItems > 0 ? (
          <View style={styles.loadRow}>
            {weekLoad.map((day) => {
              const height = day.score > 0 ? Math.max(14, Math.round((day.score / maxLoad) * 74)) : 0;
              const minutes = day.items.reduce((sum, assignment) => sum + (assignment.estimatedMinutes || 25), 0);
              return (
                <View key={day.dateKey} style={styles.loadColumn}>
                  <View style={styles.loadTrack}>
                    {height > 0 ? (
                      <View
                        style={[
                          styles.loadBar,
                          {
                            height,
                            backgroundColor: day.heavy ? colors.brandPink : colors.accent
                          }
                        ]}
                      />
                    ) : (
                      <View style={styles.loadEmptyMark} />
                    )}
                  </View>
                  <Text style={styles.loadLabel}>{day.label.slice(0, 1)}</Text>
                  <Text style={styles.loadCount}>{day.items.length}</Text>
                  <Text style={styles.loadMinutes} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{minutes ? `${minutes}m` : "open"}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </GlassCard>

      <SectionHeader title="Upcoming weeks" note="Grouped by urgency" />
      <View style={styles.list}>
        {weekGroups.map((group) => (
          <GlassCard key={group.key} style={styles.weekGroupCard}>
            <View style={styles.weekGroupHeader}>
              <View>
                <Text style={styles.weekGroupKicker}>{group.urgency}</Text>
                <Text style={styles.weekGroupTitle}>{group.label}</Text>
              </View>
              <Text style={styles.weekGroupCount}>{group.items.length}</Text>
            </View>
            {group.items.slice(0, 4).map((assignment) => (
              <AssignmentRow
                key={assignment.id}
                assignment={assignment}
                course={getCourseForAssignment(courses, assignment)}
                onPress={() => onOpenAssignment(assignment.id)}
              />
            ))}
          </GlassCard>
        ))}
      </View>
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

type WeekSummaryTileProps = {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "green" | "pink";
};

function buildPlanState(assignments: Assignment[], courses: Course[], overdueCount: number, weekItems: number) {
  if (courses.length === 0) {
    return {
      title: "Add a class before the calendar can work.",
      copy: "Plan does not invent subjects. Create a class or scan a syllabus, then deadlines can land on the week.",
      badge: "Setup"
    };
  }

  if (assignments.length === 0) {
    return {
      title: "Calendar is ready, but no homework is loaded.",
      copy: "Capture one assignment above or import a syllabus. Empty weeks stay empty until real due dates exist.",
      badge: "Empty"
    };
  }

  if (overdueCount > 0) {
    return {
      title: "Catch-up is blocking the week.",
      copy: "Start with the smallest overdue task, then spread the rest across open days.",
      badge: "Busy"
    };
  }

  if (weekItems >= 5) {
    return {
      title: "Busy week detected.",
      copy: "Use saved focus blocks for the heavy days before everything compresses into one night.",
      badge: "Loaded"
    };
  }

  return {
    title: "Week is under control.",
    copy: "The calendar has real work and no overdue pile. Keep capturing homework as it appears.",
    badge: "Clean"
  };
}

function WeekSummaryTile({ label, value, detail, tone }: WeekSummaryTileProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const toneColor = {
    blue: theme.colors.accent,
    green: theme.colors.green,
    pink: theme.colors.brandPink
  }[tone];

  return (
    <View style={styles.weekSummaryTile}>
      <View style={[styles.weekSummaryRail, { backgroundColor: toneColor }]} />
      <Text style={styles.weekSummaryLabel}>{label}</Text>
      <Text style={styles.weekSummaryValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{value}</Text>
      <Text style={styles.weekSummaryDetail} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>{detail}</Text>
    </View>
  );
}

function PlanStateTile({ label, value, detail, tone }: WeekSummaryTileProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const toneColor = {
    blue: theme.colors.accent,
    green: theme.colors.green,
    pink: theme.colors.brandPink
  }[tone];

  return (
    <View style={styles.planStateTile}>
      <View style={[styles.planStateDot, { backgroundColor: toneColor }]} />
      <Text style={styles.planStateLabel}>{label}</Text>
      <Text style={styles.planStateValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{value}</Text>
      <Text style={styles.planStateDetail} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.74}>{detail}</Text>
    </View>
  );
}

function buildSimpleWeekGroups(assignments: Assignment[], now: Date) {
  const today = dateKey(now);
  const groups = new Map<string, { key: string; label: string; urgency: string; items: Assignment[] }>();

  assignments
    .slice()
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .forEach((assignment) => {
      const dueKey = assignment.dueAt.slice(0, 10);
      const dueDate = new Date(`${dueKey}T12:00:00`);
      const weekStart = new Date(dueDate);
      weekStart.setDate(dueDate.getDate() - dueDate.getDay());
      const key = dateKey(weekStart);
      const diffDays = Math.ceil((dueDate.getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000);
      const urgency =
        diffDays < 0
          ? "Late"
          : diffDays <= 7
            ? "This week"
            : diffDays <= 14
              ? "Next week"
              : "Later";
      const existing = groups.get(key) || {
        key,
        label: `Week of ${formatSelectedDate(key)}`,
        urgency,
        items: []
      };
      existing.items.push(assignment);
      if (urgency === "Late") existing.urgency = "Late";
      groups.set(key, existing);
    });

  return Array.from(groups.values()).slice(0, 6);
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

function buildWeekLoadSummary(weekLoad: ReturnType<typeof getWeekLoad>, sessions: FocusSession[]) {
  const totalItems = weekLoad.reduce((sum, day) => sum + day.items.length, 0);
  const totalMinutes = weekLoad.reduce(
    (sum, day) => sum + day.items.reduce((daySum, assignment) => daySum + (assignment.estimatedMinutes || 25), 0),
    0
  );
  const loadedDays = weekLoad.filter((day) => day.items.length > 0);
  const peakDay = loadedDays.slice().sort((a, b) => b.score - a.score)[0];
  const weekStart = weekLoad[0]?.dateKey || "";
  const weekEnd = weekLoad[weekLoad.length - 1]?.dateKey || "";
  const plannedBlocks = sessions.filter((session) => {
    const sessionDate = session.startedAt.slice(0, 10);
    return session.status === "planned" && sessionDate >= weekStart && sessionDate <= weekEnd;
  }).length;

  return {
    totalItems,
    totalMinutes,
    peakDay,
    quietDays: Math.max(weekLoad.length - loadedDays.length, 0),
    plannedBlocks
  };
}

function formatHoursValue(minutes: number) {
  if (minutes <= 0) return "0h";
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
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
      gap: spacing.xs,
      padding: spacing.md,
      overflow: "hidden"
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
      fontSize: 25,
      lineHeight: 30,
      fontWeight: "900",
      letterSpacing: 0
    },
    heroCopy: {
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600"
    },
    primaryPlanAction: {
      minHeight: 68,
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.20)",
      backgroundColor: "rgba(255,255,255,0.12)",
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      overflow: "hidden"
    },
    primaryPlanActionIdle: {
      opacity: 0.86
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
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900"
    },
    primaryPlanDetail: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 16,
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
    stateCard: {
      gap: spacing.sm,
      padding: spacing.md,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(49,91,255,0.16)",
      backgroundColor: colors.heroSurface
    },
    stateHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    stateHeaderCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    stateKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.6,
      textTransform: "uppercase"
    },
    stateTitle: {
      color: colors.heroText,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    stateBadge: {
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
    stateCopy: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "700"
    },
    stateGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    planStateTile: {
      flex: 1,
      minWidth: 96,
      minHeight: 68,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.16)",
      backgroundColor: "rgba(255,255,255,0.08)",
      padding: spacing.sm,
      gap: 3
    },
    planStateDot: {
      width: 24,
      height: 4,
      borderRadius: 2
    },
    planStateLabel: {
      color: colors.heroMuted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.4
    },
    planStateValue: {
      color: colors.heroText,
      fontSize: 18,
      lineHeight: 22,
      fontWeight: "900"
    },
    planStateDetail: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    miniStat: {
      flex: 1,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: "rgba(255,255,255,0.12)"
    },
    miniStatValue: {
      color: colors.heroText,
      fontSize: 21,
      lineHeight: 25,
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
      flexWrap: "wrap",
      gap: spacing.sm
    },
    catchUpButton: {
      flex: 1,
      minWidth: 136
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
    survivalList: {
      gap: spacing.xs
    },
    survivalRow: {
      minHeight: 48,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.16)",
      backgroundColor: "rgba(255,255,255,0.08)",
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    survivalDay: {
      width: 76,
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    survivalItemCopy: {
      flex: 1,
      minWidth: 0
    },
    survivalItemTitle: {
      color: colors.heroText,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    survivalMeta: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    savedPlanText: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "900"
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
    selectedDayPanel: {
      marginTop: spacing.sm,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.16)",
      backgroundColor: "rgba(255,255,255,0.08)",
      padding: spacing.sm,
      gap: 5
    },
    selectedDayTitle: {
      color: colors.heroText,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900"
    },
    selectedDayMeta: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    selectedDayRow: {
      minHeight: 30,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    selectedDayDot: {
      width: 8,
      height: 8,
      borderRadius: 4
    },
    selectedDayText: {
      flex: 1,
      minWidth: 0,
      color: colors.heroText,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    list: {
      gap: spacing.sm
    },
    weekGroupCard: {
      gap: spacing.sm,
      padding: spacing.md
    },
    weekGroupHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    weekGroupKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    weekGroupTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    weekGroupCount: {
      minWidth: 34,
      textAlign: "center",
      overflow: "hidden",
      borderRadius: radii.round,
      paddingVertical: 7,
      paddingHorizontal: 10,
      color: colors.heroText,
      backgroundColor: colors.accent,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
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
      flexWrap: "wrap",
      gap: spacing.sm
    },
    survivalButton: {
      flex: 1,
      minWidth: 136
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
    weekSummaryGrid: {
      flexDirection: "row",
      gap: spacing.xs
    },
    weekSummaryTile: {
      flex: 1,
      minWidth: 0,
      minHeight: 84,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.045)" : colors.surfaceAlt,
      padding: spacing.sm,
      gap: 3,
      overflow: "hidden"
    },
    weekSummaryRail: {
      width: 28,
      height: 4,
      borderRadius: 2
    },
    weekSummaryLabel: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.4
    },
    weekSummaryValue: {
      color: colors.ink,
      fontSize: 20,
      lineHeight: 24,
      fontWeight: "900"
    },
    weekSummaryDetail: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    emptyWeekPanel: {
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.05)" : "rgba(49,91,255,0.055)",
      padding: spacing.md,
      gap: 4
    },
    emptyWeekTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    emptyWeekCopy: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    loadRow: {
      minHeight: 110,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.xs
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
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : colors.surfaceAlt,
      justifyContent: "flex-end",
      alignItems: "center",
      overflow: "hidden"
    },
    loadBar: {
      width: "100%",
      borderRadius: radii.round
    },
    loadEmptyMark: {
      width: "48%",
      height: 4,
      borderRadius: 2,
      marginBottom: 6,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.18)" : colors.line
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
    loadMinutes: {
      color: colors.faint,
      fontSize: 9,
      lineHeight: 12,
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
