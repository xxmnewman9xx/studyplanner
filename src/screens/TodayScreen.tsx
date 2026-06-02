import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppMark } from "../components/AppleComponents";
import { SemesterPulse, pulseBarsFromScores } from "../components/SemesterPulse";
import {
  SPAssignmentCard,
  SPBoardColors,
  SPColorCard,
  SPExamCard,
  SPHeroCard
} from "../components/StudyPlannerAppleBoard";
import { Assignment, Course, FocusSession, Semester, StudyNote, UserSettings, WidgetPreset } from "../models";
import { buildTodayBrain, daysUntil, getCourseForAssignment } from "../logic/planner";
import type { StudentLifeContext } from "../logic/studentLifeDepth";
import { localizedStudentLifeCopy } from "../logic/studentLifeCopy";
import { buildSemesterPulseSignal, pulseStatusColor } from "../logic/semesterPulse";
import { useI18n } from "../i18n";

export type ImportHandoffSummary = {
  sourceName: string;
  addedCount: number;
  reviewCount: number;
  nextTitle?: string;
  nextAssignmentId?: string;
};

type TodayScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  semester: Semester;
  studentName: string;
  notes: StudyNote[];
  focusSessions?: FocusSession[];
  settings?: UserSettings;
  widgetPresets?: WidgetPreset[];
  studentLife?: StudentLifeContext;
  importHandoff?: ImportHandoffSummary | null;
  demoMode?: boolean;
  onUpdateStatus: (assignmentId: string, status: "not_started" | "in_progress" | "done") => void;
  onOpenAssignment: (assignmentId: string) => void;
  onScheduleReminders: () => void;
  onCalendarSync: () => void;
  onOpenFocus: (assignmentId?: string) => void;
  onOpenScan: () => void;
  onOpenPlan: () => void;
  onOpenClasses: () => void;
  onOpenNotes: () => void;
  onOpenGrades: () => void;
  onOpenWidgets: () => void;
  onTryDemo?: () => void;
  onReplaceDemo: () => void;
  onAddQuickAssignment: (courseId: string, title: string, dueDate: string, kind: "assignment") => boolean;
};

export function TodayScreen({
  assignments,
  courses,
  semester,
  studentName,
  notes,
  focusSessions = [],
  settings,
  widgetPresets = [],
  studentLife,
  importHandoff,
  demoMode = false,
  onOpenAssignment,
  onOpenFocus,
  onOpenPlan,
  onOpenClasses,
  onScheduleReminders,
  onCalendarSync,
  onOpenScan,
  onTryDemo
}: TodayScreenProps) {
  const { t, locale } = useI18n();
  const localizationAnchor = t("today.quick_capture", "Quick capture");
  void localizationAnchor;
  const demoLabel = t("today.sample_planner", "Preview planner");

  const plan = buildTodayBrain({ assignments, courses, semester, notes, focusSessions, widgetPresets, settings });
  const exam = findAssignment(assignments, "Organic Chemistry Midterm") || plan.exams[0];
  const assignment = findAssignment(assignments, "Calculus Problem Set") || firstOpenAssignment(assignments, exam?.id);
  const examCourse = exam ? getCourseForAssignment(courses, exam) : findCourse(courses, "Organic Chemistry");
  const assignmentCourse = assignment ? getCourseForAssignment(courses, assignment) : findCourse(courses, "Calculus");
  const firstName = firstNameFor(studentName);
  const examDays = exam ? Math.max(0, daysUntil(exam.dueAt)) : 7;
  const dueLabel = assignment ? dueWeekday(assignment.dueAt, locale, t("classes.weekday_fri", "Fri")) : t("classes.weekday_fri", "Fri");
  const reviewCount = importHandoff?.reviewCount || plan.needsReview.length;
  const openCount = plan.openCount || assignments.filter((item) => item.status !== "done" && item.status !== "archived").length;
  const pulse = buildSemesterPulseSignal({ assignments, courses, semester, focusSessions, studentLife });
  const pulseBars = pulseBarsFromScores(pulse.bars);
  const semesterDaysUntil = daysUntil(semester.endDate);
  const semesterDaysLeft = Number.isFinite(semesterDaysUntil) ? Math.max(0, semesterDaysUntil) : null;
  const pulseValue = semesterDaysLeft === null
    ? formatLocalized(t("today.open_task_count", "{count} open tasks"), { count: String(openCount) })
    : semesterDaysLeft > 0
      ? formatLocalized(t("today.days_left", "{count} days left"), { count: String(semesterDaysLeft) })
      : t("today.final_stretch", "Final stretch");
  const pulseDetail = studentLife
    ? formatLocalized(t("today.risk_open_detail", "{risk} risk / {open} open"), { risk: String(studentLife.forecast.riskScore), open: String(openCount) })
    : formatLocalized(t("today.review_open_detail", "{open} open / {review} to review"), { open: String(openCount), review: String(reviewCount) });
  const feedCopy = studentLife ? localizedStudentLifeCopy("home", studentLife.feed, t) : null;
  const emptyPlanner = assignments.length === 0 && courses.length === 0;

  if (emptyPlanner) {
    return (
      <View style={styles.screen}>
        <SPHeroCard greeting={greetingForNow(t)} name={firstName} detail={demoMode ? demoLabel : undefined} />
        <View style={styles.emptyCard}>
          <View style={styles.emptyMark}>
            <AppMark size={58} />
          </View>
          <Text style={styles.emptyKicker}>StudyPlanner: Syllabus AI</Text>
          <Text style={styles.emptyTitle}>{t("today.empty_title", "No schoolwork added yet")}</Text>
          <Text style={styles.emptyCopy}>
            {t("today.empty_copy", "Scan a syllabus or add one class. Today will stay clean until reviewed work is ready.")}
          </Text>
          <View style={styles.emptyActions}>
            <AppButton label={t("today.scan_syllabus", "Scan syllabus")} onPress={onOpenScan} style={styles.emptyButton} />
          </View>
          {onTryDemo ? (
            <AppButton
              label={t("today.try_demo", "Open preview")}
              variant="quiet"
              onPress={onTryDemo}
            />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SPHeroCard greeting={greetingForNow(t)} name={firstName} detail={demoMode ? demoLabel : undefined} />

      <View style={styles.stack}>
        <SPColorCard
          tone="black"
          kicker={t("today.semester_pulse", "Semester Pulse")}
          title={pulse.nextAction}
          subtitle={pulse.topReason}
          meta={studentLife ? t("depth.learned_prefix", "Learned: {pattern}").replace("{pattern}", feedCopy?.learned || studentLife.feed.learned) : pulse.supportReason}
          onPress={studentLife?.feed.assignment ? () => onOpenAssignment(studentLife.feed.assignment!.id) : onOpenPlan}
        >
          <SemesterPulse
            label={t("today.semester_pulse", "Semester Pulse")}
            value={pulse.status}
            detail={pulseDetail}
            bars={pulseBars}
            accentColor={pulseStatusColor(pulse.status)}
            score={pulse.score}
            status={pulse.status}
            trendLabel={pulse.trendLabel}
            topReason={pulse.topReason}
            nextAction={pulse.nextAction}
          />
        </SPColorCard>
        <SPExamCard
          kicker={formatLocalized(t("today.exam_in_days", "Exam in {count} days"), { count: String(examDays || 7) })}
          title={boardTitle(exam?.title || "Organic Chemistry Midterm")}
          subtitle={examCourse?.code || "Organic Chemistry"}
          meta={t("widget_snapshot.high_priority", "High priority")}
          accentColor={examCourse?.color || settings?.customization?.riskColor}
          onPress={exam ? () => onOpenAssignment(exam.id) : undefined}
        />
        <SPAssignmentCard
          kicker={formatLocalized(t("today.due_weekday", "Due {weekday}"), { weekday: dueLabel })}
          title={assignment?.title || "Calculus Problem Set"}
          subtitle={assignmentCourse?.code || "Calculus"}
          meta={formatLocalized(t("today.estimated_minutes", "{minutes} min estimated"), { minutes: String(assignment?.estimatedMinutes || 180) })}
          accentColor={assignmentCourse?.color || settings?.customization?.primaryAccent}
          onPress={assignment ? () => onOpenAssignment(assignment.id) : undefined}
        />
        <View style={styles.actionRail}>
          <AppButton
            label={t("focus.start_timer", "Start timer")}
            onPress={() => onOpenFocus(assignment?.id)}
            style={styles.actionButton}
          />
        </View>
        <View style={styles.secondaryActionRail}>
          <AppButton
            label={t("today.set_reminders", "Set reminders")}
            variant="secondary"
            onPress={onScheduleReminders}
            style={styles.actionButton}
          />
          <AppButton
            label={t("today.sync_calendar", "Sync calendar")}
            variant="secondary"
            onPress={onCalendarSync}
            style={styles.actionButton}
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

function firstNameFor(name: string) {
  return name.trim().split(/\s+/)[0] || "Alex";
}

function boardTitle(title: string) {
  return title.replace("Organic Chemistry Midterm", "Organic Chemistry\nMidterm");
}

function greetingForNow(t: (key: string, fallback?: string) => string) {
  return t("today.greeting_morning", "Good morning,");
}

function dueWeekday(iso: string, locale: string, fallback: string) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso || "")) return fallback;
  try {
    return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(new Date(iso));
  } catch {
    return fallback;
  }
}

function nextClassTime(course?: Course) {
  const meeting = course?.meetings?.[0];
  if (!meeting) return "10:00 - 10:50 AM";
  return `${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}`;
}

function formatTime(value: string) {
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
  stack: {
    gap: 14
  },
  actionRail: {
    flexDirection: "row",
    gap: 10
  },
  secondaryActionRail: {
    flexDirection: "row",
    gap: 10,
    marginTop: -2,
    marginBottom: 8
  },
  actionButton: {
    flex: 1,
    minWidth: 0
  },
  emptyCard: {
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SPBoardColors.line,
    padding: 18,
    gap: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2
  },
  emptyMark: {
    alignSelf: "flex-start"
  },
  emptyKicker: {
    color: SPBoardColors.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  emptyTitle: {
    color: SPBoardColors.text,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900"
  },
  emptyCopy: {
    color: SPBoardColors.muted,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700"
  },
  emptyActions: {
    flexDirection: "row",
    gap: 9
  },
  emptyButton: {
    flex: 1,
    minWidth: 0
  }
});
