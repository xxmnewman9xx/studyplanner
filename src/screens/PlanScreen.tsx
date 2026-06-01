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
import { Assignment, Course, FocusSession, UserSettings } from "../models";
import { daysUntil, getCourseForAssignment } from "../logic/planner";
import type { StudentLifeContext } from "../logic/studentLifeDepth";
import { useI18n } from "../i18n";

type PlanScreenProps = {
  assignments: Assignment[];
  courses: Course[];
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

export function PlanScreen({ assignments, courses, sessions, settings, studentLife, onOpenAssignment, onOpenFocus, onOpenScan }: PlanScreenProps) {
  const { t } = useI18n();
  const localizationAnchor = t("plan.capture_title", "Put new work on the selected day.");
  void localizationAnchor;

  const exam = findAssignment(assignments, "Organic Chemistry Midterm") || assignments.find((item) => item.kind === "exam");
  const assignment = findAssignment(assignments, "Calculus Problem Set") || firstOpenAssignment(assignments, exam?.id);
  const physics = findCourse(courses, "Physics") || courses[0];
  const examCourse = exam ? getCourseForAssignment(courses, exam) : findCourse(courses, "Organic Chemistry");
  const assignmentCourse = assignment ? getCourseForAssignment(courses, assignment) : findCourse(courses, "Calculus");
  const lookingAheadExamCount = Math.max(1, assignments.filter((item) => item.kind === "exam" && item.status !== "done" && item.status !== "archived").length);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Forecast</Text>
        <Text style={styles.subtitle}>See the road ahead.</Text>
      </View>

      <SPDateStrip activeIndex={1} />

      <View style={styles.feed}>
        {studentLife ? (
          <SPColorCard
            tone={studentLife.forecast.state === "storm" || studentLife.forecast.state === "warning" ? "orange" : "soft"}
            accentColor={settings?.customization?.forecastAccent}
            title={studentLife.forecast.title}
            subtitle={studentLife.forecast.detail}
            meta={studentLife.forecast.recommendation}
            icon={Activity}
          />
        ) : null}
        <SPExamCard
          kicker="TUE 13"
          title={boardTitle(exam?.title || "Organic Chemistry Midterm")}
          subtitle={formatTimeRange(exam?.dueAt, "9:00 - 11:00 AM")}
          meta={examCourse?.code || "Organic Chemistry"}
          accentColor={examCourse?.color || settings?.customization?.riskColor}
          onPress={exam ? () => onOpenAssignment(exam.id) : undefined}
        />
        <SPAssignmentCard
          title={assignment?.title || "Calculus Problem Set"}
          subtitle={assignmentCourse?.code || "Calculus"}
          meta={assignment ? `Due ${formatDueDate(assignment.dueAt)} - Medium` : "Due Fri, May 16 - Medium"}
          accentColor={assignmentCourse?.color || settings?.customization?.primaryAccent}
          onPress={assignment ? () => onOpenAssignment(assignment.id) : undefined}
        />
        <SPColorCard
          tone="teal"
          accentColor={physics?.color}
          title={`${physics?.code || "Physics 201"} Lecture`}
          subtitle={nextClassTime(physics)}
          meta="Low"
          icon={GraduationCap}
        />
        <SPColorCard
          tone="purple"
          accentColor={settings?.customization?.activityColor}
          title="Intramural Soccer Practice"
          subtitle={sessions.length ? "Saved focus activity" : "7:00 - 8:00 PM"}
          meta="Good for you"
          icon={Activity}
          onPress={() => onOpenFocus(assignment?.id)}
        />
        <SPColorCard tone="white" title="Looking ahead" subtitle={`${lookingAheadExamCount + 1} exams next week`} icon={CalendarDays} onPress={onOpenScan} />
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

function formatTimeRange(iso: string | undefined, fallback: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return fallback;
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return fallback;
  const end = new Date(start);
  end.setHours(start.getHours() + 2);
  return `${formatClock(start)} - ${formatClock(end)}`;
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatDueDate(iso: string) {
  const days = daysUntil(iso);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso || "")) return "soon";
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(iso));
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SPBoardColors.canvas
  },
  header: {
    marginBottom: 16
  },
  title: {
    color: SPBoardColors.text,
    fontSize: 32,
    lineHeight: 36,
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
    gap: 11
  }
});
