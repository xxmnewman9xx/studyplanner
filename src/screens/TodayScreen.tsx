import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppMark } from "../components/AppleComponents";
import {
  SPAssignmentCard,
  SPBoardColors,
  SPColorCard,
  SPExamCard,
  SPFocusCard,
  SPHeroCard,
  SPNextClassCard
} from "../components/StudyPlannerAppleBoard";
import { Assignment, Course, FocusSession, Semester, StudyNote, UserSettings, WidgetPreset } from "../models";
import { buildTodayBrain, daysUntil, getCourseForAssignment } from "../logic/planner";
import type { StudentLifeContext } from "../logic/studentLifeDepth";
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
  const { t } = useI18n();
  const localizationAnchor = t("today.quick_capture", "Quick capture");
  void localizationAnchor;
  const demoLabel = t("today.sample_planner", "Preview planner");

  const plan = buildTodayBrain({ assignments, courses, semester, notes, focusSessions, widgetPresets, settings });
  const exam = findAssignment(assignments, "Organic Chemistry Midterm") || plan.exams[0];
  const assignment = findAssignment(assignments, "Calculus Problem Set") || firstOpenAssignment(assignments, exam?.id);
  const physics = findCourse(courses, "Physics") || courses[0];
  const examCourse = exam ? getCourseForAssignment(courses, exam) : findCourse(courses, "Organic Chemistry");
  const assignmentCourse = assignment ? getCourseForAssignment(courses, assignment) : findCourse(courses, "Calculus");
  const firstName = firstNameFor(studentName);
  const examDays = exam ? Math.max(0, daysUntil(exam.dueAt)) : 7;
  const dueLabel = assignment ? dueWeekday(assignment.dueAt) : "Friday";
  const reviewCount = importHandoff?.reviewCount || plan.needsReview.length;
  const openCount = plan.openCount || assignments.filter((item) => item.status !== "done" && item.status !== "archived").length;
  const heavyItems = Math.max(plan.dueSoon.length, Math.min(openCount, 4));
  const emptyPlanner = assignments.length === 0 && courses.length === 0;

  if (emptyPlanner) {
    return (
      <View style={styles.screen}>
        <SPHeroCard greeting={greetingForNow()} name={firstName} detail={demoMode ? demoLabel : undefined} />
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
      <SPHeroCard greeting={greetingForNow()} name={firstName} detail={demoMode ? demoLabel : undefined} />

      {openCount > 0 ? (
        <View style={styles.actionRail}>
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
      ) : null}

      <View style={styles.stack}>
        {studentLife ? (
          <SPColorCard
            tone="soft"
            kicker={t("depth.learned_prefix", "Learned: {pattern}").replace("{pattern}", studentLife.feed.learned)}
            title={studentLife.feed.recommendation}
            subtitle={studentLife.feed.nextAction}
            meta={t("depth.reason_prefix", "Reason: {reason}").replace("{reason}", studentLife.feed.reason)}
          />
        ) : null}
        <SPExamCard
          kicker={`EXAM IN ${examDays || 7} DAYS`}
          title={boardTitle(exam?.title || "Organic Chemistry Midterm")}
          subtitle={examCourse?.code || "Organic Chemistry"}
          meta="High impact"
          accentColor={examCourse?.color || settings?.customization?.riskColor}
          onPress={exam ? () => onOpenAssignment(exam.id) : undefined}
        />
        <SPAssignmentCard
          kicker={`DUE ${dueLabel.toUpperCase()}`}
          title={assignment?.title || "Calculus Problem Set"}
          subtitle={assignmentCourse?.code || "Calculus"}
          meta={assignment?.title.toLowerCase().includes("calculus") ? "12 problems - 3h estimated" : assignment ? `${assignment.estimatedMinutes || 180} min estimated` : "12 problems - 3h estimated"}
          accentColor={assignmentCourse?.color || settings?.customization?.primaryAccent}
          onPress={assignment ? () => onOpenAssignment(assignment.id) : undefined}
        />
        <SPFocusCard
          kicker="FOCUS WINDOW"
          title="45 min"
          subtitle="Start a session"
          minutes={45}
          accentColor={settings?.customization?.focusColor}
          onPress={() => onOpenFocus(assignment?.id)}
        />
        <SPNextClassCard
          title={physics?.code || "Physics 201"}
          subtitle={nextClassTime(physics)}
          meta={physics?.room ? `Room ${physics.room}` : "Room 4A"}
          accentColor={physics?.color}
          onPress={onOpenClasses}
        />
        <SPColorCard tone="soft" accentColor={settings?.customization?.forecastAccent} kicker="HEAVY WEEK AHEAD" title="Heavy week ahead" subtitle={`${Math.max(1, plan.exams.length || 1)} exams - ${heavyItems || 2} assignments - ${Math.max(reviewCount, 1)} quiz`} onPress={onOpenPlan}>
          <View style={styles.heavyBars}>
            {[0.32, 0.68, 0.42, 0.78, 0.28, 0.62, 0.88].map((height, index) => (
              <View key={index} style={[styles.heavyBar, { height: 10 + height * 34, backgroundColor: barColor(index) }]} />
            ))}
          </View>
        </SPColorCard>
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

function greetingForNow() {
  return "Good morning,";
}

function dueWeekday(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso || "")) return "Friday";
  try {
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(iso));
  } catch {
    return "Friday";
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

function barColor(index: number) {
  return [SPBoardColors.teal, SPBoardColors.orange, SPBoardColors.teal, SPBoardColors.blue, SPBoardColors.orange, SPBoardColors.blue, SPBoardColors.blue][index] || SPBoardColors.blue;
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
    gap: 10,
    marginBottom: 16
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
  },
  heavyBars: {
    marginTop: 10,
    height: 44,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 9
  },
  heavyBar: {
    width: 8,
    borderRadius: 5
  }
});
