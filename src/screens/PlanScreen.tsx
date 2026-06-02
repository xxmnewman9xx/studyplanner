import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Activity, CalendarDays, GraduationCap } from "lucide-react-native";

import {
  SPAssignmentCard,
  SPBoardColors,
  SPColorCard,
  SPDateStrip,
  SPExamCard
} from "../components/StudyPlannerAppleBoard";
import { SemesterPulse, pulseBarsFromScores } from "../components/SemesterPulse";
import { Assignment, Course, FocusSession, Semester, UserSettings } from "../models";
import { daysUntil, getCourseForAssignment } from "../logic/planner";
import type { StudentLifeContext } from "../logic/studentLifeDepth";
import { localizedForecastCopy } from "../logic/studentLifeCopy";
import { buildSemesterPulseSignal, forecastStateColor, pulseStatusColor } from "../logic/semesterPulse";
import { useI18n } from "../i18n";

type PlanScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  semester: Semester;
  sessions: FocusSession[];
  settings?: UserSettings;
  studentLife?: StudentLifeContext;
  onOpenAssignment: (assignmentId: string) => void;
  onOpenFocus: (assignmentId?: string) => void;
  onUpdateStatus: (assignmentId: string, status: "not_started" | "in_progress" | "done") => void;
  onRecordSession: (session: FocusSession) => void;
  onAddQuickAssignment: (courseId: string, title: string, dueDate: string, kind: "assignment") => boolean;
  onOpenScan: () => void;
};

export function PlanScreen({ assignments, courses, semester, sessions, settings, studentLife, onOpenAssignment, onOpenFocus, onOpenScan }: PlanScreenProps) {
  const { t, locale } = useI18n();
  const localizationAnchor = t("plan.capture_title", "Put new work on the selected day.");
  void localizationAnchor;

  const exam = findAssignment(assignments, "Organic Chemistry Midterm") || assignments.find((item) => item.kind === "exam");
  const assignment = findAssignment(assignments, "Calculus Problem Set") || firstOpenAssignment(assignments, exam?.id);
  const physics = findCourse(courses, "Physics") || courses[0];
  const examCourse = exam ? getCourseForAssignment(courses, exam) : findCourse(courses, "Organic Chemistry");
  const assignmentCourse = assignment ? getCourseForAssignment(courses, assignment) : findCourse(courses, "Calculus");
  const lookingAheadExamCount = Math.max(1, assignments.filter((item) => item.kind === "exam" && item.status !== "done" && item.status !== "archived").length);
  const pulse = buildSemesterPulseSignal({ assignments, courses, semester, focusSessions: sessions, studentLife });
  const pulseBars = pulseBarsFromScores(pulse.bars);
  const openCount = assignments.filter((item) => item.status !== "done" && item.status !== "archived").length;
  const forecastAccent = settings?.customization?.forecastAccent || forecastStateColor(pulse.forecastState);
  const forecastCopy = studentLife ? localizedForecastCopy(studentLife.forecast, openCount, t) : null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("paywall.forecast", "Forecast")}</Text>
        <Text style={styles.subtitle}>{t("plan.forecast_subtitle", "Weather for your semester.")}</Text>
      </View>

      <SPDateStrip activeIndex={1} />

      <View style={styles.feed}>
        <SPColorCard
          tone={pulse.forecastState === "Calm" || pulse.forecastState === "Recovery" ? "soft" : "orange"}
          accentColor={forecastAccent}
          kicker={t("today.semester_pulse", "Semester Pulse")}
          title={`${pulse.forecastState} forecast`}
          subtitle={pulse.topRisk}
          meta={forecastCopy?.recommendation || pulse.nextAction}
          icon={Activity}
        >
          <SemesterPulse
            label={t("today.semester_pulse", "Semester pulse")}
            value={pulse.status}
            detail={forecastCopy?.learned || studentLife?.forecast.learned || pulse.supportReason}
            bars={pulseBars}
            accentColor={pulseStatusColor(pulse.status)}
            score={pulse.score}
            status={pulse.status}
            trendLabel={pulse.trendLabel}
            topReason={pulse.topReason}
            nextAction={pulse.nextAction}
            quiet={pulse.forecastState === "Calm" || pulse.forecastState === "Recovery"}
          />
          <View style={styles.forecastGrid}>
            <ForecastFact label={t("plan.peak", "Peak")} value={pulse.peakLabel} />
            <ForecastFact label={t("plan.top_risk", "Top risk")} value={pulse.topRisk} />
            <ForecastFact label={t("plan.free_time", "Free time")} value={pulse.freeTime} />
            <ForecastFact label={t("plan.exam_pressure", "Exam pressure")} value={pulse.examPressure} />
          </View>
        </SPColorCard>
        <SPExamCard
          kicker={formatDateKicker(exam?.dueAt, locale)}
          title={boardTitle(exam?.title || "Organic Chemistry Midterm")}
          subtitle={formatTimeRange(exam?.dueAt, "9:00 - 11:00 AM", locale)}
          meta={examCourse?.code || "Organic Chemistry"}
          accentColor={examCourse?.color || settings?.customization?.riskColor}
          onPress={exam ? () => onOpenAssignment(exam.id) : undefined}
        />
        <SPAssignmentCard
          title={assignment?.title || "Calculus Problem Set"}
          subtitle={assignmentCourse?.code || "Calculus"}
          meta={assignment
            ? formatLocalized(t("plan.due_with_priority", "Due {date} · {priority}"), {
                date: formatDueDate(assignment.dueAt, locale, t),
                priority: t("assignment_detail.priority_medium", "Medium")
              })
            : formatLocalized(t("plan.due_with_priority", "Due {date} · {priority}"), {
                date: t("plan.relative_later", "Later"),
                priority: t("assignment_detail.priority_medium", "Medium")
              })}
          accentColor={assignmentCourse?.color || settings?.customization?.primaryAccent}
          onPress={assignment ? () => onOpenAssignment(assignment.id) : undefined}
        />
        <SPColorCard
          tone="teal"
          accentColor={physics?.color}
          title={physics?.code || t("classes.class_fallback", "Class")}
          subtitle={nextClassTime(physics)}
          meta={t("assignment_detail.priority_low", "Low")}
          icon={GraduationCap}
        />
        <View style={styles.actionRail}>
          <SPColorCard
            tone="white"
            title={t("plan.looking_ahead", "Looking ahead")}
            subtitle={formatLocalized(t("plan.exams_next_week", "{count} exams next week"), { count: String(lookingAheadExamCount + 1) })}
            icon={CalendarDays}
            onPress={onOpenScan}
          />
        </View>
      </View>
    </View>
  );
}

function findAssignment(assignments: Assignment[], needle: string) {
  return assignments.find((assignment) => assignment.title.toLowerCase().includes(needle.toLowerCase()));
}

function firstOpenAssignment(assignments: Assignment[], excludeId?: string) {
  return assignments
    .filter((assignment) => assignment.id !== excludeId && assignment.status !== "done" && assignment.status !== "archived" && !assignment.needsReview)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0];
}

function findCourse(courses: Course[], needle: string) {
  return courses.find((course) => `${course.code} ${course.name}`.toLowerCase().includes(needle.toLowerCase()));
}

function boardTitle(title: string) {
  return title.replace("Organic Chemistry Midterm", "Organic Chemistry\nMidterm");
}

function formatDateKicker(iso: string | undefined, locale: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return "";
  try {
    return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric" }).format(new Date(iso));
  } catch {
    return "";
  }
}

function formatTimeRange(iso: string | undefined, fallback: string, locale: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return fallback;
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return fallback;
  const end = new Date(start);
  end.setHours(start.getHours() + 2);
  return `${formatClock(start, locale)} - ${formatClock(end, locale)}`;
}

function formatClock(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatDueDate(iso: string, locale: string, t: (key: string, fallback?: string) => string) {
  const days = daysUntil(iso);
  if (days === 0) return t("plan.relative_today", "Today");
  if (days === 1) return t("plan.relative_tomorrow", "Tomorrow");
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso || "")) return t("widget_snapshot.soon", "Soon");
  return new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric" }).format(new Date(iso));
}

function nextClassTime(course?: Course) {
  const meeting = course?.meetings?.[0];
  if (!meeting) return "10:00 - 10:50 AM";
  return `${formatMeetingTime(meeting.startTime)} - ${formatMeetingTime(meeting.endTime)}`;
}

function formatMeetingTime(value: string) {
  const [hourRaw, minute = "00"] = value.split(":");
  const hour = Number(hourRaw || 0);
  if (!Number.isFinite(hour)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:${minute.padStart(2, "0")} ${suffix}`;
}

function formatLocalized(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((current, [key, value]) => current.replaceAll(`{${key}}`, value), template);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SPBoardColors.canvas
  },
  header: {
    marginBottom: 18
  },
  title: {
    color: SPBoardColors.text,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    marginTop: 2,
    color: SPBoardColors.muted,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700"
  },
  feed: {
    gap: 16
  },
  actionRail: {
    marginTop: 2
  },
  forecastGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  forecastFact: {
    flexGrow: 1,
    flexBasis: "47%",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 3
  },
  forecastFactLabel: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900"
  },
  forecastFactValue: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900"
  }
});

function ForecastFact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.forecastFact}>
      <Text style={styles.forecastFactLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.forecastFactValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}
