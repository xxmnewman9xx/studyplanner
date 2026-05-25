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
  const weekSummary = buildWeekLoadSummary(weekLoad, sessions);
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
  const primaryActionLabel = selectedEvents[0]
    ? "Open selected work"
    : primarySuggestion
      ? "Open priority work"
      : courses.length
        ? "Add a deadline below"
        : "Add a class, then plan";
  const primaryActionDetail = selectedEvents[0]
    ? `${selectedEvents.length} item${selectedEvents.length === 1 ? "" : "s"} due on the selected day.`
    : primarySuggestion?.copy || "The week stays empty until real assignments have due dates.";
  const planState = buildPlanState(assignments, courses, overdue.length, weekSummary.totalItems);

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
          accessibilityState={{ disabled: !primaryAssignmentId }}
          disabled={!primaryAssignmentId}
          style={[styles.primaryPlanAction, !primaryAssignmentId ? styles.primaryPlanActionIdle : null]}
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
          {primaryAssignmentId ? <ChevronRight color={colors.heroText} size={18} /> : null}
        </TouchableOpacity>
        <View style={styles.heroStats}>
          <MiniStat label="Today" value={String(weekLoad.find((day) => day.dateKey === dateKey(today))?.items.length || 0)} />
          <MiniStat label="Hours" value={formatHoursValue(weekSummary.totalMinutes)} />
          <MiniStat label="Week" value={String(weekLoad.reduce((sum, day) => sum + day.items.length, 0))} />
        </View>
      </GlassCard>

      <GlassCard style={styles.stateCard}>
        <View style={styles.stateHeader}>
          <View style={styles.stateHeaderCopy}>
            <Text style={styles.stateKicker}>Planner state</Text>
            <Text style={styles.stateTitle}>{planState.title}</Text>
          </View>
          <Text style={styles.stateBadge}>{planState.badge}</Text>
        </View>
        <Text style={styles.stateCopy}>{planState.copy}</Text>
        <View style={styles.stateGrid}>
          <PlanStateTile label="Calendar" value={weekSummary.totalItems ? `${weekSummary.totalItems} due` : "Empty"} detail={weekSummary.peakDay ? `${weekSummary.peakDay.label} is peak` : "No loaded days"} tone="blue" />
          <PlanStateTile label="Catch up" value={overdue.length ? `${overdue.length} late` : "Clear"} detail={catchUpFirst?.title || "No overdue"} tone="pink" />
          <PlanStateTile label="Focus" value={weekSummary.plannedBlocks ? `${weekSummary.plannedBlocks} saved` : "0 saved"} detail={weekSummary.totalMinutes ? `${formatHoursValue(weekSummary.totalMinutes)} open load` : "No blocks needed"} tone="green" />
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
          placeholder={courses.length ? "BIO lab report due Friday" : "Add a class first, then capture homework"}
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
        <View style={styles.weekSummaryGrid}>
          <WeekSummaryTile label="Deadlines" value={String(weekSummary.totalItems)} detail={`${weekSummary.quietDays} quiet day${weekSummary.quietDays === 1 ? "" : "s"}`} tone="blue" />
          <WeekSummaryTile label="Workload" value={formatHoursValue(weekSummary.totalMinutes)} detail={`${weekSummary.plannedBlocks} focus block${weekSummary.plannedBlocks === 1 ? "" : "s"} saved`} tone="green" />
          <WeekSummaryTile label="Peak" value={weekSummary.peakDay?.label || "None"} detail={weekSummary.peakDay ? `${weekSummary.peakDay.items.length} due` : "no loaded day"} tone="pink" />
        </View>
        {weekSummary.totalItems === 0 ? (
          <View style={styles.emptyWeekPanel}>
            <Text style={styles.emptyWeekTitle}>No weekly load yet</Text>
            <Text style={styles.emptyWeekCopy}>Add real homework above or import assignments elsewhere. Empty days stay visually empty until due dates exist.</Text>
          </View>
        ) : null}
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
      title: "Catch-up work is blocking the week.",
      copy: "Start with the smallest overdue task, then use the week load to spread the rest.",
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
      gap: spacing.sm,
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
      fontSize: 28,
      lineHeight: 34,
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
      fontSize: 18,
      lineHeight: 23,
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
      fontSize: 13,
      lineHeight: 19,
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
      minHeight: 78,
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
