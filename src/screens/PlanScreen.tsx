import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react-native";
import {
  AssignmentRow,
  EmptyState,
  GlassCard
} from "../components/AppleComponents";
import { SectionHeader } from "../components/SectionHeader";
import { Assignment, Course } from "../models";
import {
  getBusyWeekInsight,
  getCalendarEventsByDay,
  getCourseForAssignment,
  getWeekLoad
} from "../logic/planner";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type PlanScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  onOpenAssignment: (assignmentId: string) => void;
};

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

export function PlanScreen({ assignments, courses, onOpenAssignment }: PlanScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const today = useMemo(() => new Date(), []);
  const [monthCursor, setMonthCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const eventsByDay = getCalendarEventsByDay(assignments, courses);
  const selectedEvents = eventsByDay[selectedDate] || [];
  const weekLoad = getWeekLoad(assignments, today);
  const insight = getBusyWeekInsight(assignments, today);
  const monthDays = buildMonthDays(monthCursor);
  const maxLoad = Math.max(...weekLoad.map((day) => day.score), 1);
  const primarySuggestion = insight.suggestions.find((suggestion) => suggestion.assignmentId);
  const primaryAssignmentId = selectedEvents[0]?.assignment.id || primarySuggestion?.assignmentId;
  const primaryActionLabel = selectedEvents[0] ? "Open selected work" : primarySuggestion ? "Open priority work" : "Review classes";
  const primaryActionDetail = selectedEvents[0]
    ? `${selectedEvents.length} item${selectedEvents.length === 1 ? "" : "s"} due on the selected day.`
    : primarySuggestion?.copy || "No urgent work selected. Check classes and notes to keep the plan current.";

  const moveMonth = (offset: number) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <View style={styles.screen}>
      <GlassCard tone="hero" style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.kicker}>Plan</Text>
            <Text style={styles.title}>Your week made calm.</Text>
          </View>
          <View style={styles.heroIcon}>
            <Sparkles color={colors.heroText} size={19} />
          </View>
        </View>
        <Text style={styles.heroCopy}>
          See the week, spot risk early, and jump straight into the work that protects your grade.
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
          <View>
            <Text style={styles.primaryPlanKicker}>Next planning move</Text>
            <Text style={styles.primaryPlanTitle}>{primaryActionLabel}</Text>
            <Text style={styles.primaryPlanDetail}>{primaryActionDetail}</Text>
          </View>
          <ChevronRight color={colors.heroText} size={18} />
        </TouchableOpacity>
        <View style={styles.heroStats}>
          <MiniStat label="Due Today" value={String(weekLoad.find((day) => day.dateKey === dateKey(today))?.items.length || 0)} tone="pink" />
          <MiniStat label="Heavy Days" value={String(insight.heavyDays.length)} tone="gold" />
          <MiniStat label="This Week" value={String(weekLoad.reduce((sum, day) => sum + day.items.length, 0))} tone="violet" />
        </View>
      </GlassCard>

      <SectionHeader title={`${monthCursor.toLocaleString("en-US", { month: "long" })} Plan`} note="Class-color dots by due date" />
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

      <SectionHeader title="Selected Day" note={formatSelectedDate(selectedDate)} />
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

      <SectionHeader title="This Week" note="Load rings and proactive suggestions" />
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

  function MiniStat({
    label,
    value,
    tone
  }: {
    label: string;
    value: string;
    tone: "pink" | "gold" | "violet";
  }) {
    const toneStyle = {
      pink: styles.miniStatPink,
      gold: styles.miniStatGold,
      violet: styles.miniStatViolet
    }[tone];
    return (
      <View style={[styles.miniStat, toneStyle]}>
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
      padding: spacing.md
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md
    },
    heroIcon: {
      width: 42,
      height: 42,
      borderRadius: 15,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center"
    },
    kicker: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    title: {
      color: colors.heroText,
      fontSize: 29,
      lineHeight: 35,
      fontWeight: "900"
    },
    heroCopy: {
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "800"
    },
    primaryPlanAction: {
      minHeight: 88,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
      backgroundColor: "rgba(255,255,255,0.14)",
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md
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
      gap: spacing.sm
    },
    miniStat: {
      flex: 1,
      minHeight: 62,
      borderRadius: radii.lg,
      padding: spacing.sm,
      justifyContent: "center",
      borderWidth: 1
    },
    miniStatPink: {
      backgroundColor: "rgba(255,122,144,0.16)",
      borderColor: "rgba(255,122,144,0.34)"
    },
    miniStatGold: {
      backgroundColor: "rgba(246,184,75,0.16)",
      borderColor: "rgba(246,184,75,0.34)"
    },
    miniStatViolet: {
      backgroundColor: "rgba(167,139,250,0.16)",
      borderColor: "rgba(167,139,250,0.34)"
    },
    miniStatValue: {
      color: colors.heroText,
      fontSize: 22,
      lineHeight: 27,
      fontWeight: "900"
    },
    miniStatLabel: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 14,
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
    list: {
      gap: spacing.sm
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
      backgroundColor: theme.isDark ? "#332029" : "#FFE2E5",
      padding: spacing.md,
      gap: 3
    },
    insightKicker: {
      color: colors.brandPink,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
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
