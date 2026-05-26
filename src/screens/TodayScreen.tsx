import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Bell, CalendarPlus, CalendarSync, CheckCircle2, FileScan, Plus, Sparkles, Timer } from "lucide-react-native";
import {
  AssignmentRow,
  EmptyState,
  GlassCard,
} from "../components/AppleComponents";
import { AppButton } from "../components/AppButton";
import { SectionHeader } from "../components/SectionHeader";
import { Assignment, Course, Semester, StudyNote } from "../models";
import {
  buildTodayPlan,
  daysUntil,
  getCourseForAssignment
} from "../logic/planner";
import { parseQuickHomeworkInput, todayDateInput } from "../services/quickHomeworkParser";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { courseEmoji } from "../utils/courseVisuals";
import { useI18n } from "../i18n";

export type ImportHandoffSummary = {
  sourceName: string;
  addedCount: number;
  reviewCount: number;
  nextTitle?: string;
  nextAssignmentId?: string;
};

type TranslateFn = (key: string, fallback?: string) => string;

type TodayScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  semester: Semester;
  studentName: string;
  notes: StudyNote[];
  importHandoff?: ImportHandoffSummary | null;
  demoMode?: boolean;
  onUpdateStatus: (assignmentId: string, status: "not_started" | "in_progress" | "done") => void;
  onOpenAssignment: (assignmentId: string) => void;
  onScheduleReminders: () => void;
  onCalendarSync: () => void;
  premiumAutomationLocked: boolean;
  onOpenPaywall: () => void;
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
  notes,
  importHandoff,
  demoMode = false,
  onUpdateStatus,
  onOpenAssignment,
  onScheduleReminders,
  onCalendarSync,
  premiumAutomationLocked,
  onOpenPaywall,
  onOpenFocus,
  onOpenScan,
  onOpenPlan,
  onOpenClasses,
  onOpenNotes,
  onOpenGrades,
  onOpenWidgets,
  onTryDemo,
  onReplaceDemo,
  onAddQuickAssignment
}: TodayScreenProps) {
  const { theme } = useAppTheme();
  const { t, locale } = useI18n();
  const { colors } = theme;
  const styles = createStyles(theme);
  const plan = buildTodayPlan(assignments, semester);
  const nextCourse = plan.nextAction
    ? getCourseForAssignment(courses, plan.nextAction)
    : undefined;
  const completionPercent = assignments.length > 0 ? Math.round((plan.doneCount / assignments.length) * 100) : 0;
  const nextDueDays = plan.nextAction ? daysUntil(plan.nextAction.dueAt) : 0;
  const nextActionDuration = plan.nextAction
    ? formatLocalized(t("today.minutes_short", "{minutes} min"), {
        minutes: String(plan.nextAction.estimatedMinutes || 25)
      })
    : "";
  const secondaryUpcoming = plan.upcoming.filter((assignment) => assignment.id !== plan.nextAction?.id);
  const [quickCourseId, setQuickCourseId] = useState(courses[0]?.id || "");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDueDate, setQuickDueDate] = useState(todayDateInput());
  const quickDuePresets = buildQuickDuePresets(t);
  const quickCourse = courses.find((course) => course.id === quickCourseId) || courses[0];
  const parsedQuickHomework = parseQuickHomeworkInput(quickTitle, courses, quickCourse, quickDueDate);
  const liveBrief = buildLiveBrief(plan, courses.length, t);
  const plannerHasData = assignments.length > 0 || courses.length > 0;
  const todayItems = plan.dueToday.filter((assignment) => assignment.id !== plan.nextAction?.id);
  const weekItems = plan.upcoming
    .filter((assignment) => assignment.id !== plan.nextAction?.id && assignment.dueAt.slice(0, 10) !== todayDateInput())
    .slice(0, 4);
  const commandTiles = [
    {
      label: t("today.command_scan", "Scan"),
      value: imageActionLabel(plannerHasData, t),
      detail: t("today.command_scan_detail", "Add paper, PDF, or text"),
      icon: FileScan,
      action: onOpenScan
    },
    {
      label: t("today.command_review", "Review"),
      value: String(plan.needsReview.length),
      detail: plan.needsReview.length ? t("today.command_review_needed", "items need trust check") : t("today.command_review_clean", "planner is clean"),
      icon: CheckCircle2,
      action: onOpenScan
    },
    {
      label: t("today.command_calendar", "Calendar"),
      value: `${plan.dueToday.length}/${plan.upcoming.length}`,
      detail: t("today.command_calendar_detail", "today / upcoming"),
      icon: CalendarPlus,
      action: onOpenPlan
    },
    {
      label: t("today.command_widgets", "Widgets"),
      value: assignments.length ? `${Math.min(99, assignments.length)}` : t("today.set_up", "Set up"),
      detail: assignments.length ? t("today.reviewed_source_rows", "reviewed source rows") : t("today.needs_planner_data", "needs planner data"),
      icon: Sparkles,
      action: onOpenWidgets
    }
  ];

  useEffect(() => {
    if (!courses.length) {
      setQuickCourseId("");
      return;
    }

    if (!courses.some((course) => course.id === quickCourseId)) {
      setQuickCourseId(courses[0]?.id || "");
    }
  }, [courses, quickCourseId]);

  const addHomework = () => {
    if (!parsedQuickHomework.course || !parsedQuickHomework.title.trim() || !parsedQuickHomework.dueDate.trim()) return;
    const added = onAddQuickAssignment(
      parsedQuickHomework.course.id,
      parsedQuickHomework.title,
      parsedQuickHomework.dueDate,
      "assignment"
    );
    if (!added) return;

    setQuickCourseId(parsedQuickHomework.course.id);
    setQuickTitle("");
    setQuickDueDate(todayDateInput());
  };

  return (
    <View style={styles.screen}>
      {demoMode ? (
        <GlassCard style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <View style={styles.demoIcon}>
              <Sparkles color={colors.accent} size={18} />
            </View>
            <View style={styles.demoCopy}>
              <Text style={styles.demoTitle}>{t("today.sample_planner", "Sample planner")}</Text>
              <Text style={styles.demoText}>{t("today.sample_replace_copy", "Replace this with your own syllabus when you are ready.")}</Text>
            </View>
          </View>
          <AppButton label={t("today.replace_with_syllabus", "Replace with my syllabus")} icon={FileScan} onPress={onReplaceDemo} />
        </GlassCard>
      ) : null}

      <GlassCard tone="hero" style={styles.heroCard}>
        <Text style={styles.heroKicker}>{t("tabs.today", "Today")}</Text>
        <Text style={styles.heroTitle}>{liveBrief.title}</Text>
        <Text style={styles.heroSubtitle}>{liveBrief.detail}</Text>
        {plannerHasData ? (
          <View style={styles.heroMetrics}>
            <MetricPill label={t("today.metric_done", "Done")} value={`${completionPercent}%`} />
            <MetricPill label={t("today.metric_open", "Open")} value={String(plan.openCount)} />
            <MetricPill label={t("today.metric_review", "Review")} value={String(plan.needsReview.length)} />
          </View>
        ) : null}
        {plan.nextAction ? (
          <View style={styles.nextHero}>
            <View style={styles.nextHeroCopy}>
              <View style={styles.nextKickerRow}>
                <Text style={styles.nextKicker}>{formatDueUrgency(nextDueDays, t)}</Text>
                <Text style={styles.timeChip}>{nextActionDuration}</Text>
              </View>
              <Text style={styles.nextTitle}>{formatAssignmentTitle(nextCourse, plan.nextAction)}</Text>
              <Text style={styles.nextMeta}>
                {formatLocalized(
                  t("today.next_meta", "Due {date} · {duration} · {period}"),
                  {
                    date: formatTodayDate(plan.nextAction.dueAt.slice(0, 10), locale, t),
                    duration: nextActionDuration,
                    period: nextCourse?.period || t("today.class_fallback", "class")
                  }
                )}
              </Text>
            </View>
            <View style={styles.nextActions}>
              <AppButton
                label={t("today.start_focus", "Start focus")}
                icon={Timer}
                onPress={() => onOpenFocus(plan.nextAction!.id)}
                style={styles.startButton}
              />
              <AppButton
                label={t("today.open_task", "Open task")}
                variant="quiet"
                onPress={() => onOpenAssignment(plan.nextAction!.id)}
                style={styles.focusButton}
              />
            </View>
          </View>
        ) : (
          <EmptyState
            title={plannerHasData ? t("today.all_caught_up", "All caught up") : t("today.no_schoolwork_added", "No schoolwork added yet")}
            copy={plannerHasData ? t("today.no_urgent_work", "No urgent work in the planner right now.") : t("today.scan_or_add_class", "Scan a syllabus or add one class so Today can show your next task.")}
            emoji={plannerHasData ? "complete" : "calendar"}
          />
        )}
        {!plannerHasData ? <AppButton label={t("today.scan_syllabus", "Scan syllabus")} icon={FileScan} onPress={onOpenScan} /> : null}
      </GlassCard>

      <View style={styles.commandRail}>
        {commandTiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <TouchableOpacity
              accessibilityRole="button"
              key={tile.label}
              style={styles.commandTile}
              onPress={tile.action}
            >
              <View style={styles.commandTileTop}>
                <View style={styles.commandTileIcon}>
                  <Icon color={colors.accent} size={16} />
                </View>
                <Text style={styles.commandTileLabel}>{tile.label}</Text>
              </View>
              <Text style={styles.commandTileValue} numberOfLines={1}>{tile.value}</Text>
              <Text style={styles.commandTileDetail} numberOfLines={2}>{tile.detail}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <GlassCard style={styles.quickAddCard}>
        <View style={styles.commandCenterHeader}>
          <View style={styles.commandCenterCopy}>
            <Text style={styles.commandCenterKicker}>{t("today.quick_capture", "Quick capture")}</Text>
            <Text style={styles.commandCenterTitle}>{t("today.quick_capture_title", "Add homework before it slips.")}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" style={styles.commandCenterButton} onPress={onOpenScan}>
            <Text style={styles.commandCenterButtonText}>{t("today.command_scan", "Scan")}</Text>
          </TouchableOpacity>
        </View>

        {courses.length ? (
          <>
            <View style={styles.courseRail}>
              {courses.slice(0, 5).map((course) => {
                const active = course.id === quickCourseId;
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={course.id}
                    style={[styles.coursePill, active ? styles.coursePillActive : null]}
                    onPress={() => setQuickCourseId(course.id)}
                  >
                    <Text style={[styles.coursePillText, active ? styles.coursePillTextActive : null]}>
                      {courseEmoji(course)} {course.code || course.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.quickInputRow}>
              <TextInput
                value={quickTitle}
                onChangeText={setQuickTitle}
                placeholder={t("today.quick_title_placeholder", "Chapter 4 notes tomorrow")}
                placeholderTextColor={colors.faint}
                style={[styles.quickInput, styles.quickTitleInput]}
              />
              <TextInput
                value={quickDueDate}
                onChangeText={setQuickDueDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.faint}
                style={[styles.quickInput, styles.quickDateInput]}
              />
            </View>
            <AppButton
              label={t("today.add_to_today", "Add to Today")}
              icon={Plus}
              disabled={!parsedQuickHomework.course || !parsedQuickHomework.title.trim() || !parsedQuickHomework.dueDate.trim()}
              onPress={addHomework}
            />
            <View style={styles.quickDueRail}>
              {quickDuePresets.slice(0, 3).map((preset) => {
                const active = quickDueDate === preset.value;
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={preset.label}
                    style={[styles.quickDuePill, active ? styles.quickDuePillActive : null]}
                    onPress={() => setQuickDueDate(preset.value)}
                  >
                    <Text style={[styles.quickDuePillText, active ? styles.quickDuePillTextActive : null]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {quickTitle.trim() ? (
              <Text style={styles.quickParsePreview}>
                {formatLocalized(t("today.quick_parse_preview", "Will add {course} · {title} · due {date}"), {
                  course: parsedQuickHomework.course?.code || quickCourse?.code || t("today.class_fallback", "class"),
                  title: parsedQuickHomework.title || t("today.homework_fallback", "homework"),
                  date: formatTodayDate(parsedQuickHomework.dueDate, locale, t)
                })}
              </Text>
            ) : null}
          </>
        ) : (
          <View style={styles.noClassBlock}>
            <Text style={styles.noClassTitle}>{t("today.add_class_first", "Add a class first.")}</Text>
            <Text style={styles.noClassCopy}>{t("today.homework_needs_class", "Homework needs a class so Today, Calendar, and widgets know where it belongs.")}</Text>
            <View style={styles.actionRow}>
              <AppButton label={t("tabs.classes", "Classes")} variant="secondary" onPress={onOpenClasses} style={styles.actionButton} />
              <AppButton label={t("today.scan_syllabus", "Scan syllabus")} icon={FileScan} onPress={onOpenScan} style={styles.actionButton} />
            </View>
          </View>
        )}
      </GlassCard>

      {plan.overdue.length > 0 ? (
        <CatchUpSprintCard
          overdue={plan.overdue}
          courses={courses}
          onOpenAssignment={onOpenAssignment}
          onOpenFocus={onOpenFocus}
          onOpenPlan={onOpenPlan}
          onUpdateStatus={onUpdateStatus}
        />
      ) : null}

      {plannerHasData ? (
        <GlassCard style={styles.automationCard}>
          <View style={styles.automationHeader}>
            <View style={styles.automationIcon}>
              <Bell color={colors.accent} size={18} />
            </View>
            <View style={styles.automationCopy}>
              <Text style={styles.automationTitle}>{t("today.automation_title", "Keep deadlines from slipping.")}</Text>
              <Text style={styles.automationText}>{t("today.automation_copy", "Set reminders or sync reviewed due dates to your calendar.")}</Text>
            </View>
          </View>
          <View style={styles.automationActions}>
            <AppButton
              label={t("today.set_reminders", "Set reminders")}
              icon={Bell}
              variant="secondary"
              onPress={premiumAutomationLocked ? onOpenPaywall : onScheduleReminders}
              style={styles.automationButton}
            />
            <AppButton
              label={t("today.sync_calendar", "Sync calendar")}
              icon={CalendarSync}
              variant="secondary"
              onPress={premiumAutomationLocked ? onOpenPaywall : onCalendarSync}
              style={styles.automationButton}
            />
          </View>
        </GlassCard>
      ) : null}

      {!assignments.length ? (
        <GlassCard style={styles.starterCard}>
          <Text style={styles.starterKicker}>{t("today.start_here", "Start here")}</Text>
          <Text style={styles.starterTitle}>{t("today.start_with_syllabus", "Start with your syllabus.")}</Text>
          <Text style={styles.starterCopy}>{t("today.start_with_syllabus_copy", "Scan a syllabus, review the draft, then Today shows what to do first.")}</Text>
          <View style={styles.starterActions}>
            <AppButton label={t("today.scan_syllabus", "Scan syllabus")} icon={FileScan} onPress={onOpenScan} style={styles.starterButton} />
            {onTryDemo ? (
              <AppButton label={t("today.preview_sample_plan", "Preview sample plan")} icon={Sparkles} variant="secondary" onPress={onTryDemo} style={styles.starterButton} />
            ) : null}
          </View>
        </GlassCard>
      ) : null}

      {importHandoff ? (
        <GlassCard style={styles.importHandoffCard}>
          <View style={styles.importHandoffHeader}>
            <View style={styles.importHandoffIcon}>
              <CheckCircle2 color={colors.accent} size={18} />
            </View>
            <View style={styles.importHandoffCopy}>
              <Text style={styles.importHandoffKicker}>{t("today.added_from_scan", "Added from Scan")}</Text>
              <Text style={styles.importHandoffTitle}>
                {formatLocalized(t("today.added_from_source", "{count} added from {source}"), {
                  count: String(importHandoff.addedCount),
                  source: importHandoff.sourceName
                })}
              </Text>
              <Text style={styles.importHandoffDetail}>
                {importHandoff.reviewCount > 0
                  ? formatLocalized(t("today.still_need_review", "{count} still need review in Scan."), { count: String(importHandoff.reviewCount) })
                  : t("today.updated_with_reviewed_work", "Today is updated with reviewed work.")}
              </Text>
            </View>
          </View>
          <View style={styles.importHandoffActions}>
            <AppButton
              label={importHandoff.reviewCount > 0 ? t("today.review_in_scan", "Review in Scan") : t("today.open_first_task", "Open first task")}
              variant="secondary"
              onPress={() => {
                if (importHandoff.reviewCount > 0) {
                  onOpenScan();
                  return;
                }
                if (importHandoff.nextAssignmentId) {
                  onOpenAssignment(importHandoff.nextAssignmentId);
                } else {
                  onOpenPlan();
                }
              }}
              style={styles.importHandoffButton}
            />
          </View>
        </GlassCard>
      ) : null}

      {todayItems.length > 0 || !plan.nextAction ? (
        <>
          <SectionHeader
            title={t("today.due_today", "Due today")}
            note={todayItems.length ? formatLocalized(t("today.more_today", "{count} more today"), { count: String(todayItems.length) }) : t("today.only_attention_now", "Only what needs attention now")}
          />
          <View style={styles.list}>
            {todayItems.length === 0 ? (
              <EmptyState
                title={t("today.nothing_else_today", "Nothing else today")}
                copy={plannerHasData ? t("today.scan_new_work", "Scan new work when you get it.") : t("today.scan_to_build_today", "Scan a syllabus to build Today.")}
                emoji="calendar"
              />
            ) : (
              todayItems.map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  course={getCourseForAssignment(courses, assignment)}
                  onPress={() => onOpenAssignment(assignment.id)}
                  trailing={<Text style={styles.doneButtonText}>{t("today.open", "Open")}</Text>}
                />
              ))
            )}
          </View>
        </>
      ) : null}

      {weekItems.length > 0 || !plannerHasData ? (
        <>
          <SectionHeader title={t("today.this_week", "This week")} note={t("today.week_preview_note", "A small preview, not another dashboard")} />
          <View style={styles.list}>
            {weekItems.length === 0 ? (
              <EmptyState title={t("today.no_upcoming_work", "No upcoming work loaded")} copy={t("today.scan_to_fill_week", "Scan a syllabus to fill this week.")} emoji="calendar" />
            ) : (
              weekItems.map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  course={getCourseForAssignment(courses, assignment)}
                  onPress={() => onOpenAssignment(assignment.id)}
                  trailing={<Text style={styles.doneButtonText}>{t("today.open", "Open")}</Text>}
                />
              ))
            )}
          </View>
        </>
      ) : null}

      {assignments.length ? (
        <GlassCard style={styles.starterCard}>
          <Text style={styles.starterKicker}>{t("today.add_more_work", "Add more work")}</Text>
          <Text style={styles.starterTitle}>{t("today.scan_another_syllabus", "Scan another syllabus.")}</Text>
          <Text style={styles.starterCopy}>{t("today.scan_another_copy", "New work goes to Scan for review before it changes Today.")}</Text>
          <AppButton label={t("today.scan_syllabus", "Scan syllabus")} icon={FileScan} variant="secondary" onPress={onOpenScan} />
        </GlassCard>
      ) : null}

    </View>
  );

}

function buildLiveBrief(plan: ReturnType<typeof buildTodayPlan>, courseCount: number, t: TranslateFn) {
  if (plan.overdue.length > 0) {
    return {
      title: t("today.live_overdue_title", "Overdue work first"),
      detail: formatLocalized(t("today.live_overdue_detail", "{count} overdue item(s). Open the first task and clear it."), {
        count: String(plan.overdue.length)
      })
    };
  }

  if (plan.needsReview.length > 0) {
    return {
      title: t("today.live_review_title", "Review imported work"),
      detail: formatLocalized(t("today.live_review_detail", "{count} item(s) need a date, duplicate check, or confidence pass before the plan is trusted."), {
        count: String(plan.needsReview.length)
      })
    };
  }

  if (plan.nextAction) {
    const days = daysUntil(plan.nextAction.dueAt);
    return {
      title:
        days < 0
          ? formatLocalized(t("today.live_overdue_by_days", "Overdue by {count} day(s)"), { count: String(Math.abs(days)) })
          : days === 0
            ? t("today.live_due_today", "Due today. Start here.")
            : formatLocalized(t("today.live_next_deadline_days", "Next deadline in {count} day(s)"), { count: String(days) }),
      detail: t("today.live_next_detail", "This is the one thing to look at first.")
    };
  }

  if (courseCount === 0) {
    return {
      title: t("today.live_first_syllabus", "Scan your first syllabus"),
      detail: t("today.live_empty_until_reviewed", "Today stays empty until real schoolwork is reviewed.")
    };
  }

  return {
    title: t("today.live_clear_title", "Clear right now"),
    detail: t("today.live_clear_detail", "No urgent work is loaded. Scan new work when you get it.")
  };
}

function imageActionLabel(plannerHasData: boolean, t: TranslateFn) {
  return plannerHasData ? t("today.command_scan_add", "Add") : t("today.command_scan_start", "Start");
}

type MetricPillProps = {
  label: string;
  value: string;
};

type CatchUpSprintCardProps = {
  overdue: Assignment[];
  courses: Course[];
  onOpenAssignment: (assignmentId: string) => void;
  onOpenFocus: (assignmentId?: string) => void;
  onOpenPlan: () => void;
  onUpdateStatus: (assignmentId: string, status: "not_started" | "in_progress" | "done") => void;
};

function CatchUpSprintCard({ overdue, courses, onOpenAssignment, onOpenFocus, onOpenPlan, onUpdateStatus }: CatchUpSprintCardProps) {
  const { theme } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(theme);
  const sprintItems = overdue.slice(0, 3);
  const first = sprintItems[0];
  const firstCourse = first ? getCourseForAssignment(courses, first) : undefined;
  const sprintMinutes = sprintItems.reduce((sum, item) => sum + Math.min(item.estimatedMinutes || 25, 45), 0);
  const rescueMinutes = Math.min(first?.estimatedMinutes || 25, 15);
  const hiddenCount = Math.max(overdue.length - sprintItems.length, 0);

  if (!first) return null;

  return (
    <GlassCard style={styles.catchUpCard}>
      <View style={styles.catchUpGlow} />
      <View style={styles.catchUpHeaderRow}>
        <View style={styles.catchUpBadge}>
          <Text style={styles.catchUpBadgeText}>{t("today.start_here", "Start here")}</Text>
        </View>
        <Text style={styles.catchUpMeta}>{formatLocalized(t("today.total_minutes", "{minutes}m total"), { minutes: String(sprintMinutes) })}</Text>
      </View>
      <Text style={styles.catchUpTitle}>
        {formatLocalized(t("today.catch_up_title", "Start with {course}{title}"), {
          course: firstCourse?.code ? `${firstCourse.code}: ` : "",
          title: first.title
        })}
      </Text>
      <Text style={styles.catchUpCopy}>
        {formatLocalized(t("today.catch_up_copy", "Work for {minutes} minutes, then decide whether to finish it or move it in Plan. {tail}"), {
          minutes: String(rescueMinutes),
          tail:
            hiddenCount > 0
              ? formatLocalized(t("today.catch_up_hidden_tail", "{count} more item(s) stay below."), { count: String(hiddenCount) })
              : t("today.catch_up_clear_tail", "This clears the visible list.")
        })}
      </Text>
      <View style={styles.catchUpSteps}>
        {sprintItems.map((item, index) => {
          const course = getCourseForAssignment(courses, item);
          return (
            <View key={item.id} style={styles.catchUpStep}>
              <Text style={styles.catchUpStepNumber}>{index + 1}</Text>
              <Text style={styles.catchUpStepText}>{course?.code ? `${course.code} · ` : ""}{item.title}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.catchUpActions}>
        <AppButton
          label={formatLocalized(t("today.focus_minutes", "{minutes}m focus"), { minutes: String(rescueMinutes) })}
          icon={Timer}
          onPress={() => {
            onUpdateStatus(first.id, "in_progress");
            onOpenFocus(first.id);
          }}
          style={styles.catchUpPrimaryAction}
        />
        <AppButton label={t("today.open_details", "Open details")} variant="secondary" onPress={() => onOpenAssignment(first.id)} style={styles.catchUpSecondaryAction} />
      </View>
      <AppButton label={t("today.replan_week", "Replan week")} icon={CalendarPlus} variant="quiet" onPress={onOpenPlan} />
    </GlassCard>
  );
}

function MetricPill({ label, value }: MetricPillProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function buildQuickDuePresets(t: TranslateFn) {
  return [
    { label: t("today.quick_due_today", "Today"), value: todayDateInput(0) },
    { label: t("today.quick_due_tomorrow", "Tomorrow"), value: todayDateInput(1) },
    { label: t("today.quick_due_plus_3", "+3 days"), value: todayDateInput(3) },
    { label: t("today.quick_due_next_week", "Next week"), value: todayDateInput(7) }
  ];
}

function formatDueUrgency(days: number, t: TranslateFn) {
  if (days < 0) return formatLocalized(t("today.overdue_by_days", "Overdue by {count} day(s)"), { count: String(Math.abs(days)) });
  if (days === 0) return t("today.due_today_short", "Due today");
  return formatLocalized(t("today.due_in_days", "Due in {count} day(s)"), { count: String(days) });
}

function formatLocalized(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((text, [key, value]) => text.split(`{${key}}`).join(value), template);
}

function formatAssignmentTitle(course: Course | undefined, assignment: Assignment) {
  return course?.code ? `${course.code} · ${assignment.title}` : assignment.title;
}

function formatTodayDate(iso: string, locale: string, t: TranslateFn) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return t("today.check_date", "Check date");
  const [year, month, day] = iso.slice(0, 10).split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return t("today.check_date", "Check date");

  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(year, month - 1, day));
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(year, month - 1, day));
  }
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    screen: {
      gap: 0
    },
    demoCard: {
      gap: spacing.sm,
      marginBottom: spacing.sm
    },
    demoHeader: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "flex-start"
    },
    demoIcon: {
      width: 34,
      height: 34,
      borderRadius: radii.round,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft
    },
    demoCopy: {
      flex: 1,
      gap: 2
    },
    demoTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900"
    },
    demoText: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    },
    heroCard: {
      gap: spacing.xs,
      padding: spacing.md,
      overflow: "hidden",
      marginBottom: spacing.xs
    },
    heroGridWash: {
      position: "absolute",
      right: 18,
      bottom: 18,
      width: 96,
      height: 96,
      borderRadius: 28,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.10)",
      backgroundColor: "rgba(255,255,255,0.025)",
      opacity: 0.36,
      transform: [{ rotate: "8deg" }]
    },
    heroKicker: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.8,
      textTransform: "uppercase"
    },
    heroTitle: {
      color: colors.heroText,
      fontSize: 21,
      lineHeight: 26,
      fontWeight: "900",
      letterSpacing: 0
    },
    heroSubtitle: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700",
      marginTop: -2
    },
    heroMetrics: {
      flexDirection: "row",
      borderRadius: radii.lg,
      backgroundColor: "rgba(255,255,255,0.11)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.16)",
      overflow: "hidden"
    },
    metricPill: {
      flex: 1,
      minHeight: 40,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: "rgba(255,255,255,0.13)"
    },
    metricValue: {
      color: colors.heroText,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: "900",
      letterSpacing: 0
    },
    metricLabel: {
      color: colors.heroMuted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.6
    },
    commandRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginBottom: spacing.sm
    },
    commandTileTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs
    },
    commandTileIcon: {
      width: 28,
      height: 28,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft
    },
    commandTileLabel: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    commandTileValue: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    commandTileDetail: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    nextHero: {
      borderRadius: radii.xl,
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.24)",
      padding: spacing.sm,
      gap: spacing.xs
    },
    nextHeroCopy: {
      gap: 3
    },
    nextKickerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    nextKicker: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.5
    },
    timeChip: {
      minHeight: 22,
      borderRadius: 11,
      paddingHorizontal: 8,
      paddingTop: 3,
      overflow: "hidden",
      color: colors.heroText,
      backgroundColor: "rgba(255,255,255,0.10)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)",
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "800",
      letterSpacing: 0.2
    },
    nextTitle: {
      color: colors.heroText,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    nextMeta: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    automationCard: {
      gap: spacing.sm,
      marginTop: spacing.sm,
      marginBottom: spacing.sm
    },
    automationHeader: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "flex-start"
    },
    automationIcon: {
      width: 34,
      height: 34,
      borderRadius: radii.round,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft
    },
    automationCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    automationTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900"
    },
    automationText: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    },
    automationActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    automationButton: {
      flexGrow: 1,
      flexBasis: "47%"
    },
    startButton: {
      flex: 1.3,
      minWidth: 148,
      minHeight: 46,
      backgroundColor: colors.accent
    },
    focusButton: {
      flex: 0.9,
      minWidth: 132,
      minHeight: 46,
      backgroundColor: "rgba(255,255,255,0.18)",
      borderColor: "rgba(255,255,255,0.26)"
    },
    nextActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    starterCard: {
      gap: spacing.sm,
      marginTop: spacing.sm,
      marginBottom: spacing.xs
    },
    starterKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    starterTitle: {
      color: colors.ink,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "900"
    },
    starterCopy: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700"
    },
    starterActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    starterButton: {
      flex: 1,
      minWidth: 136
    },
    commandCenterCard: {
      gap: spacing.sm,
      marginBottom: spacing.xs,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(49,91,255,0.14)"
    },
    commandCenterHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    commandCenterCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    commandCenterKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.7,
      textTransform: "uppercase"
    },
    commandCenterTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    commandCenterButton: {
      borderRadius: radii.round,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8
    },
    commandCenterButtonText: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    commandSignalGrid: {
      flexDirection: "row",
      gap: spacing.xs
    },
    handoffRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    handoffStep: {
      flex: 1,
      minWidth: 96,
      minHeight: 54,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.035)" : colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      justifyContent: "center",
      gap: 2
    },
    handoffStepActive: {
      borderColor: `${colors.accent}55`,
      backgroundColor: colors.accentSoft
    },
    handoffLabel: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.5
    },
    handoffLabelActive: {
      color: colors.accent
    },
    handoffDetail: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    signalTile: {
      flex: 1,
      minWidth: 0,
      minHeight: 82,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.045)" : colors.surfaceAlt,
      padding: spacing.sm,
      gap: 3,
      overflow: "hidden"
    },
    signalRail: {
      width: 26,
      height: 4,
      borderRadius: 2
    },
    signalLabel: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.4
    },
    signalValue: {
      color: colors.ink,
      fontSize: 20,
      lineHeight: 24,
      fontWeight: "900"
    },
    signalDetail: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    sourceContractCard: {
      gap: spacing.sm,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(21,35,58,0.10)",
      backgroundColor: theme.isDark ? "rgba(10,15,26,0.88)" : "rgba(255,255,255,0.70)"
    },
    sourceContractHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    sourceContractCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    sourceContractKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      letterSpacing: 0.5,
      textTransform: "uppercase"
    },
    sourceContractTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    sourceContractDetail: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    },
    sourceContractBadge: {
      minWidth: 58,
      borderRadius: radii.round,
      backgroundColor: colors.heroSurface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      alignItems: "center"
    },
    sourceContractBadgeText: {
      color: colors.heroText,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    sourceStepRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    sourceStep: {
      flex: 1,
      minWidth: 96,
      minHeight: 94,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.05)" : colors.surfaceAlt,
      padding: spacing.sm,
      gap: 3
    },
    sourceStepIcon: {
      width: 28,
      height: 28,
      borderRadius: 10,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center"
    },
    sourceStepLabel: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    sourceStepValue: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 21,
      fontWeight: "900"
    },
    sourceStepDetail: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "800"
    },
    importHandoffCard: {
      gap: spacing.sm,
      borderColor: `${colors.accent}44`
    },
    importHandoffHeader: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "flex-start"
    },
    importHandoffIcon: {
      width: 34,
      height: 34,
      borderRadius: radii.round,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft
    },
    importHandoffCopy: {
      flex: 1,
      gap: 2
    },
    importHandoffKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.6
    },
    importHandoffTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900"
    },
    importHandoffDetail: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    },
    importHandoffActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    importHandoffButton: {
      flex: 1,
      minWidth: 132,
      paddingHorizontal: spacing.xs
    },
    scheduleCard: {
      gap: spacing.md,
      marginBottom: spacing.sm,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(49,91,255,0.14)"
    },
    scheduleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: spacing.sm
    },
    scheduleKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.7
    },
    scheduleTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    scheduleOpenButton: {
      borderRadius: radii.round,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8
    },
    scheduleOpenText: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    weekBars: {
      minHeight: 128,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: spacing.xs,
      borderRadius: radii.xl,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.045)" : colors.surfaceAlt,
      padding: spacing.sm
    },
    weekBarColumn: {
      flex: 1,
      alignItems: "center",
      gap: 4
    },
    weekBarTrack: {
      width: "100%",
      maxWidth: 30,
      height: 92,
      borderRadius: 15,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.065)" : colors.surface,
      alignItems: "center",
      justifyContent: "flex-end",
      overflow: "hidden"
    },
    weekBarFill: {
      width: "100%",
      minHeight: 12,
      borderRadius: 15
    },
    weekBarEmptyMark: {
      width: "52%",
      height: 4,
      borderRadius: 2,
      marginBottom: 6,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.18)" : colors.line
    },
    weekBarCount: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 15,
      fontWeight: "900"
    },
    weekBarLabel: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    scheduleHint: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    scheduleSummaryRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    scheduleSummaryText: {
      borderRadius: radii.round,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.06)" : colors.surfaceAlt,
      color: colors.muted,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      overflow: "hidden",
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    loopCard: {
      gap: spacing.md,
      marginBottom: spacing.sm,
      overflow: "hidden"
    },
    loopHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    loopKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.7
    },
    loopTitle: {
      color: colors.ink,
      fontSize: 19,
      lineHeight: 24,
      fontWeight: "900"
    },
    loopLiveBadge: {
      borderRadius: radii.round,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
      flexDirection: "row",
      alignItems: "center",
      gap: 5
    },
    loopLiveText: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    loopGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    loopTile: {
      flexBasis: "31%",
      flexGrow: 1,
      minWidth: 96,
      minHeight: 134,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.045)" : colors.surfaceAlt,
      padding: spacing.sm,
      gap: 5
    },
    loopIcon: {
      width: 42,
      height: 42,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center"
    },
    loopEmoji: {
      fontSize: 15,
      lineHeight: 18
    },
    loopPhase: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.4
    },
    loopItemTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    loopDetail: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    widgetTease: {
      borderRadius: radii.xl,
      backgroundColor: colors.heroSurface,
      padding: spacing.sm,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: spacing.sm,
      overflow: "hidden"
    },
    widgetTeasePhone: {
      width: 104,
      minHeight: 92,
      borderRadius: 24,
      backgroundColor: "rgba(255,255,255,0.13)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.20)",
      padding: spacing.sm,
      justifyContent: "center",
      gap: 5
    },
    widgetTeaseBar: {
      width: 40,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent
    },
    widgetTeaseTitle: {
      color: colors.heroText,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    widgetTeaseMeta: {
      color: colors.heroMuted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "800"
    },
    widgetTeaseCopy: {
      flex: 1,
      minWidth: 150,
      gap: 3
    },
    widgetTeaseKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    widgetTeaseText: {
      color: colors.heroText,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "800"
    },
    osCard: {
      gap: spacing.md,
      marginBottom: spacing.sm,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(49,91,255,0.16)"
    },
    osHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    osHeaderCopy: {
      flex: 1,
      minWidth: 0,
      gap: 3
    },
    osKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.7
    },
    osTitle: {
      color: colors.ink,
      fontSize: 20,
      lineHeight: 25,
      fontWeight: "900",
      letterSpacing: 0
    },
    osBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: radii.round,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7
    },
    osBadgeText: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    osGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    osTileLarge: {
      flexBasis: "100%",
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : colors.surfaceAlt,
      padding: spacing.md,
      gap: spacing.xs
    },
    osTile: {
      flexBasis: "47%",
      flexGrow: 1,
      minHeight: 132,
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.elevated,
      padding: spacing.md,
      gap: spacing.xs
    },
    osTileIcon: {
      width: 34,
      height: 34,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft
    },
    osTileLabel: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.5
    },
    osTileValue: {
      color: colors.ink,
      fontSize: 22,
      lineHeight: 27,
      fontWeight: "900"
    },
    osTileDetail: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    osTimeline: {
      position: "relative",
      borderRadius: radii.xl,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.05)" : "rgba(49,91,255,0.055)",
      padding: spacing.md,
      gap: spacing.sm,
      overflow: "hidden"
    },
    osTimelineRail: {
      position: "absolute",
      left: 71,
      top: spacing.md,
      bottom: spacing.md,
      width: 2,
      backgroundColor: colors.line
    },
    osTimelineItem: {
      flexDirection: "row",
      gap: spacing.md,
      alignItems: "flex-start"
    },
    osTimelineTime: {
      width: 42,
      color: colors.accent,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "900"
    },
    osTimelineText: {
      flex: 1,
      color: colors.ink,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "800"
    },
    commandGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    commandTile: {
      flexBasis: "47%",
      flexGrow: 1,
      minWidth: 136,
      minHeight: 92,
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.13)" : "rgba(16,24,40,0.08)",
      backgroundColor: theme.isDark ? "rgba(17,24,39,0.96)" : "rgba(255,255,255,0.96)",
      padding: spacing.sm,
      gap: spacing.xs,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.14 : 0.04,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 1
    },
    commandAccent: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      opacity: 0.92
    },
    commandGlow: {
      position: "absolute",
      right: -28,
      top: -36,
      width: 88,
      height: 88,
      borderRadius: 44,
      opacity: theme.isDark ? 0.18 : 0.10
    },
    commandIcon: {
      width: 32,
      height: 32,
      borderRadius: radii.round,
      alignItems: "center",
      justifyContent: "center"
    },
    commandTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900"
    },
    commandDetail: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    quickAddCard: {
      gap: spacing.sm
    },
    noClassBlock: {
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md,
      gap: spacing.xs
    },
    noClassTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    noClassCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    },
    courseRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    coursePill: {
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7
    },
    coursePillActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    coursePillText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900"
    },
    coursePillTextActive: {
      color: colors.accent
    },
    quickInputRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    quickInput: {
      minHeight: 46,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      color: colors.ink,
      backgroundColor: colors.canvas,
      paddingHorizontal: spacing.sm,
      fontSize: 15,
      fontWeight: "800"
    },
    quickTitleInput: {
      flex: 1
    },
    quickDateInput: {
      width: 124,
      flexGrow: 0
    },
    quickParsePreview: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "800",
      lineHeight: 17
    },
    quickDueRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginTop: -2
    },
    quickDuePill: {
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7
    },
    quickDuePillActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    quickDuePillText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900"
    },
    quickDuePillTextActive: {
      color: colors.accent
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.sm
    },
    actionButton: {
      flex: 1,
      minWidth: 112,
      paddingHorizontal: spacing.xs
    },
    catchUpCard: {
      gap: spacing.sm,
      overflow: "hidden"
    },
    catchUpGlow: {
      position: "absolute",
      right: -52,
      top: -58,
      width: 142,
      height: 142,
      borderRadius: 71,
      backgroundColor: colors.brandPink,
      opacity: theme.isDark ? 0.18 : 0.09
    },
    catchUpHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    catchUpBadge: {
      borderRadius: radii.round,
      backgroundColor: `${colors.brandPink}1F`,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.brandPink}55`,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6
    },
    catchUpBadgeText: {
      color: colors.brandPink,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.6
    },
    catchUpMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    catchUpTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900",
      letterSpacing: 0
    },
    catchUpCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700"
    },
    catchUpSteps: {
      gap: spacing.xs
    },
    catchUpStep: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      borderRadius: radii.md,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
      paddingHorizontal: spacing.sm,
      paddingVertical: 8
    },
    catchUpStepNumber: {
      width: 22,
      height: 22,
      borderRadius: 11,
      overflow: "hidden",
      backgroundColor: colors.accentSoft,
      color: colors.accent,
      textAlign: "center",
      paddingTop: 3,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    catchUpStepText: {
      flex: 1,
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    catchUpActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    catchUpPrimaryAction: {
      flex: 1,
      minWidth: 136
    },
    catchUpSecondaryAction: {
      flex: 1,
      minWidth: 116,
      paddingHorizontal: spacing.xs
    },
    list: {
      gap: spacing.sm
    },
    doneButton: {
      minWidth: 36,
      height: 36,
      borderRadius: radii.round,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center"
    },
    doneButtonText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "900"
    },
    reviewFlag: {
      color: colors.brandPink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    overdueFlag: {
      color: colors.brandPink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    }
  });
}
