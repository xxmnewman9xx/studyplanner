import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Bell, CalendarPlus, CheckCircle2, ChevronRight, Crown, FileScan, Plus, Sparkles, Timer } from "lucide-react-native";
import {
  AppLogo,
  AssignmentRow,
  EmptyState,
  GlassCard,
} from "../components/AppleComponents";
import { AppButton } from "../components/AppButton";
import { SectionHeader } from "../components/SectionHeader";
import { Assignment, Course, Semester } from "../models";
import {
  buildTodayPlan,
  daysUntil,
  formatDateOnly,
  getCourseForAssignment
} from "../logic/planner";
import { parseQuickHomeworkInput, todayDateInput } from "../services/quickHomeworkParser";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { courseEmoji } from "../utils/courseVisuals";

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
  onTryDemo: () => void;
  onReplaceDemo: () => void;
  onAddQuickAssignment: (courseId: string, title: string, dueDate: string, kind: "assignment") => boolean;
};

export function TodayScreen({
  assignments,
  courses,
  semester,
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
  onTryDemo,
  onReplaceDemo,
  onAddQuickAssignment
}: TodayScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const plan = buildTodayPlan(assignments, semester);
  const nextCourse = plan.nextAction
    ? getCourseForAssignment(courses, plan.nextAction)
    : undefined;
  const semesterPercent = Math.round(plan.semesterProgress * 100);
  const completionPercent = assignments.length > 0 ? Math.round((plan.doneCount / assignments.length) * 100) : 0;
  const nextDueDays = plan.nextAction ? daysUntil(plan.nextAction.dueAt) : 0;
  const secondaryUpcoming = plan.upcoming.filter((assignment) => assignment.id !== plan.nextAction?.id);
  const [quickCourseId, setQuickCourseId] = useState(courses[0]?.id || "");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDueDate, setQuickDueDate] = useState(todayDateInput());
  const quickDuePresets = buildQuickDuePresets();
  const quickCourse = courses.find((course) => course.id === quickCourseId) || courses[0];
  const parsedQuickHomework = parseQuickHomeworkInput(quickTitle, courses, quickCourse, quickDueDate);
  const liveBrief = buildLiveBrief(plan, courses.length);
  const focusUpsellHandler = premiumAutomationLocked ? onOpenPaywall : () => onOpenFocus(plan.nextAction?.id);

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
      <View style={styles.identityRow}>
        <AppLogo showWordmark size={42} />
      </View>

      {demoMode ? (
        <GlassCard style={styles.demoCard}>
          <View style={styles.demoHeader}>
            <View style={styles.demoIcon}>
              <Sparkles color={colors.accent} size={18} />
            </View>
            <View style={styles.demoCopy}>
              <Text style={styles.demoTitle}>Demo planner</Text>
              <Text style={styles.demoText}>This is sample schoolwork so you can inspect Today, Plan, and Widget Studio before importing your own syllabus.</Text>
            </View>
          </View>
          <AppButton label="Replace with my syllabus" icon={FileScan} onPress={onReplaceDemo} />
        </GlassCard>
      ) : null}

      <GlassCard tone="hero" style={styles.heroCard}>
        <Text style={styles.heroKicker}>Next move</Text>
        <Text style={styles.heroTitle}>{liveBrief.title}</Text>
        <Text style={styles.heroSubtitle}>{liveBrief.detail}</Text>
        {plan.nextAction ? (
          <View style={styles.nextHero}>
            <View style={styles.nextHeroCopy}>
              <View style={styles.nextKickerRow}>
                <Text style={styles.nextKicker}>{formatDueUrgency(nextDueDays)}</Text>
                <Text style={styles.timeChip}>{plan.nextAction.estimatedMinutes || 25} min</Text>
              </View>
              <Text style={styles.nextTitle} numberOfLines={2}>{nextCourse?.code} · {plan.nextAction.title}</Text>
              <Text style={styles.nextMeta} numberOfLines={1}>
                Due {formatDateOnly(plan.nextAction.dueAt.slice(0, 10))} · {plan.nextAction.estimatedMinutes}m · {nextCourse?.period || "class"}
              </Text>
            </View>
            <View style={styles.nextActions}>
              <AppButton
                label="Study this now"
                icon={Timer}
                onPress={() => {
                  onUpdateStatus(plan.nextAction!.id, "in_progress");
                  onOpenFocus(plan.nextAction!.id);
                }}
                style={styles.startButton}
              />
              <AppButton
                label="See task details"
                variant="quiet"
                onPress={() => onOpenAssignment(plan.nextAction!.id)}
                style={styles.focusButton}
              />
            </View>
          </View>
        ) : (
          <EmptyState title="All caught up" copy="No urgent work in the planner right now." emoji="complete" />
        )}
        <View style={styles.heroMetrics}>
          <MetricPill label="Open" value={`${plan.openCount}`} />
          <MetricPill label="Urgent" value={`${plan.overdue.length + plan.dueSoon.length}`} />
          <MetricPill label="Done" value={`${completionPercent}%`} />
        </View>
      </GlassCard>

      {!assignments.length ? (
        <GlassCard style={styles.starterCard}>
          <Text style={styles.starterKicker}>Start here</Text>
          <Text style={styles.starterTitle}>Build your first plan.</Text>
          <Text style={styles.starterCopy}>Scan a syllabus, try a realistic demo, or add a class manually. Today becomes useful as soon as one assignment exists.</Text>
          <View style={styles.starterActions}>
            <AppButton label="Scan syllabus" icon={FileScan} onPress={onOpenScan} style={styles.starterButton} />
            <AppButton label="Try demo" icon={Sparkles} variant="secondary" onPress={onTryDemo} style={styles.starterButton} />
          </View>
          <AppButton label="Add class manually" variant="quiet" onPress={onOpenClasses} />
        </GlassCard>
      ) : null}

      {importHandoff ? (
        <GlassCard style={styles.importHandoffCard}>
          <View style={styles.importHandoffHeader}>
            <View style={styles.importHandoffIcon}>
              <CheckCircle2 color={colors.accent} size={18} />
            </View>
            <View style={styles.importHandoffCopy}>
              <Text style={styles.importHandoffKicker}>Import added</Text>
              <Text style={styles.importHandoffTitle}>
                {importHandoff.addedCount} added from {importHandoff.sourceName}
              </Text>
              <Text style={styles.importHandoffDetail}>
                {importHandoff.reviewCount > 0
                  ? `${importHandoff.reviewCount} still need review. Open ${importHandoff.nextTitle || "the first item"}, then approve the plan.`
                  : `Today is updated. Open ${importHandoff.nextTitle || "the first task"} or jump straight into focus.`}
              </Text>
            </View>
          </View>
          <View style={styles.importHandoffActions}>
            <AppButton
              label={importHandoff.reviewCount > 0 ? "Review first item" : "Open first task"}
              variant="secondary"
              onPress={() => {
                if (importHandoff.nextAssignmentId) {
                  onOpenAssignment(importHandoff.nextAssignmentId);
                } else {
                  onOpenPlan();
                }
              }}
              style={styles.importHandoffButton}
            />
            <AppButton
              label="Start focus"
              icon={Timer}
              disabled={!importHandoff.nextAssignmentId && !plan.nextAction?.id}
              onPress={() => onOpenFocus(importHandoff.nextAssignmentId || plan.nextAction?.id)}
              style={styles.importHandoffButton}
            />
          </View>
        </GlassCard>
      ) : null}

      <SectionHeader title="Next actions" note="Only the shortcuts that help this plan move." />
      <View style={styles.commandGrid}>
        <CommandTile
          title="Add from syllabus"
          detail="Upload or paste. Review before saving."
          icon={FileScan}
          onPress={onOpenScan}
          tone="pink"
        />
        <CommandTile
          title="Open weekly plan"
          detail={`${plan.dueSoon.length} due soon · balance workload`}
          icon={CalendarPlus}
          onPress={onOpenPlan}
          tone="blue"
        />
      </View>
      {plan.nextAction ? <View style={styles.viewportBreak} /> : null}

      {plan.overdue.length > 1 ? (
        <>
          <SectionHeader title="Catch up" note={`${plan.overdue.length} overdue · smallest saves first`} />
          <CatchUpSprintCard
            overdue={plan.overdue.slice(1)}
            courses={courses}
            onOpenAssignment={onOpenAssignment}
            onOpenFocus={onOpenFocus}
            onOpenPlan={onOpenPlan}
            onUpdateStatus={onUpdateStatus}
          />
          <View style={styles.list}>
            {plan.overdue.slice(0, 3).map((assignment) => (
              <AssignmentRow
                key={assignment.id}
                assignment={assignment}
                course={getCourseForAssignment(courses, assignment)}
                onPress={() => onOpenAssignment(assignment.id)}
                trailing={<Text style={styles.overdueFlag}>Study now</Text>}
              />
            ))}
          </View>
        </>
      ) : null}

      {secondaryUpcoming.length > 0 || !plan.nextAction ? (
        <>
          <SectionHeader title="Today" note={`${plan.dueToday.length} due today · ${plan.dueSoon.length} due soon · ${plan.needsReview.length} to review`} />
          <View style={styles.list}>
            {secondaryUpcoming.length === 0 ? (
              <EmptyState title="A clear day" copy="Scan a syllabus or add a class to start planning." emoji="calendar" />
            ) : (
              secondaryUpcoming.slice(0, 5).map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  course={getCourseForAssignment(courses, assignment)}
                  onPress={() => onOpenAssignment(assignment.id)}
                  trailing={<Text style={styles.doneButtonText}>{assignment.status === "done" ? "Done" : "Open task"}</Text>}
                />
              ))
            )}
          </View>
        </>
      ) : null}

      {plan.needsReview.length > 0 ? (
        <>
          <SectionHeader title="Needs Review" note="Missing dates, low confidence, possible duplicates" />
          <View style={styles.list}>
            {plan.needsReview.slice(0, 3).map((assignment) => (
              <AssignmentRow
                key={assignment.id}
                assignment={assignment}
                course={getCourseForAssignment(courses, assignment)}
                onPress={() => onOpenAssignment(assignment.id)}
                trailing={<Text style={styles.reviewFlag}>{assignment.duplicateOf ? "Duplicate?" : "Check"}</Text>}
              />
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title="Capture homework" note="Type it like a student would: Bio worksheet due Friday." />
      <GlassCard style={styles.quickAddCard}>
        {courses.length ? (
          <View style={styles.courseRail}>
            {courses.slice(0, 4).map((course) => (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: quickCourse?.id === course.id }}
                key={course.id}
                style={[
                  styles.coursePill,
                  quickCourse?.id === course.id ? styles.coursePillActive : null
                ]}
                onPress={() => setQuickCourseId(course.id)}
              >
                <Text
                  style={[
                    styles.coursePillText,
                    quickCourse?.id === course.id ? styles.coursePillTextActive : null
                  ]}
                >
                  {courseEmoji(course)} {course.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.noClassBlock}>
            <Text style={styles.noClassTitle}>Add a class first</Text>
            <Text style={styles.noClassCopy}>Homework needs a class so reminders, widgets, and the weekly plan have context.</Text>
            <AppButton label="Add class" variant="secondary" onPress={onOpenClasses} />
          </View>
        )}
        <View style={styles.quickInputRow}>
          <TextInput
            value={quickTitle}
            onChangeText={setQuickTitle}
            placeholder="Bio worksheet due Friday or 5/20"
            placeholderTextColor={colors.faint}
            style={[styles.quickInput, styles.quickTitleInput]}
            returnKeyType="done"
            onSubmitEditing={addHomework}
          />
          <TextInput
            value={quickDueDate}
            onChangeText={setQuickDueDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.faint}
            style={[styles.quickInput, styles.quickDateInput]}
            returnKeyType="done"
            onSubmitEditing={addHomework}
          />
        </View>
        {quickTitle.trim() ? (
          <Text style={styles.quickParsePreview}>
            Will add {parsedQuickHomework.course?.code || "class"} · {parsedQuickHomework.title || "homework"} · due {formatDateOnly(parsedQuickHomework.dueDate)}
          </Text>
        ) : null}
        <View style={styles.quickDueRail}>
          {quickDuePresets.map((preset) => {
            const active = quickDueDate === preset.value;
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={preset.label}
                style={[styles.quickDuePill, active ? styles.quickDuePillActive : null]}
                onPress={() => setQuickDueDate(preset.value)}
              >
                <Text style={[styles.quickDuePillText, active ? styles.quickDuePillTextActive : null]}>{preset.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <AppButton
          label="Add homework"
          icon={Plus}
          disabled={!parsedQuickHomework.course || !parsedQuickHomework.title.trim() || !parsedQuickHomework.dueDate.trim()}
          onPress={addHomework}
        />
      </GlassCard>


      <SectionHeader title="Automation" note="Plus reminder and calendar workflows" />
      <View style={styles.actionRow}>
        <AppButton
          label="Set reminders"
          icon={premiumAutomationLocked ? Crown : Bell}
          variant="secondary"
          style={styles.actionButton}
          onPress={premiumAutomationLocked ? onOpenPaywall : onScheduleReminders}
        />
        <AppButton
          label="Focus timer"
          icon={premiumAutomationLocked ? Crown : Timer}
          variant="secondary"
          style={styles.actionButton}
          onPress={focusUpsellHandler}
        />
        <AppButton
          label="Add to calendar"
          icon={premiumAutomationLocked ? Crown : CalendarPlus}
          variant="secondary"
          style={styles.actionButton}
          onPress={premiumAutomationLocked ? onOpenPaywall : onCalendarSync}
        />
      </View>
    </View>
  );

}

function buildLiveBrief(plan: ReturnType<typeof buildTodayPlan>, courseCount: number) {
  if (plan.overdue.length > 0) {
    return {
      title: "Catch-up mode",
      detail: `${plan.overdue.length} overdue item${plan.overdue.length === 1 ? "" : "s"}. No shame spiral — open one, reset the next step, then keep moving.`
    };
  }

  if (plan.needsReview.length > 0) {
    return {
      title: "Review imported work",
      detail: `${plan.needsReview.length} item${plan.needsReview.length === 1 ? "" : "s"} need a date, duplicate check, or confidence pass before the plan is trusted.`
    };
  }

  if (plan.nextAction) {
    const days = daysUntil(plan.nextAction.dueAt);
    return {
      title: days < 0 ? `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}` : days === 0 ? "Due today — start here" : `Next deadline in ${days} day${days === 1 ? "" : "s"}`,
      detail: "Open the assignment, start focus, or capture new homework before it becomes invisible."
    };
  }

  if (courseCount === 0) {
    return {
      title: "Build your school command center",
      detail: "Add classes or scan a syllabus so Today can tell you what matters next."
    };
  }

  return {
    title: "Clear right now",
    detail: "Your current plan has no urgent work. Add homework when class ends or scan the next syllabus."
  };
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
          <Text style={styles.catchUpBadgeText}>Reset sprint</Text>
        </View>
        <Text style={styles.catchUpMeta}>{sprintMinutes}m rescue queue</Text>
      </View>
      <Text style={styles.catchUpTitle}>Start with {firstCourse?.code ? `${firstCourse.code}: ` : ""}{first.title}</Text>
      <Text style={styles.catchUpCopy}>
        No shame spiral. Do the first {rescueMinutes}-minute save, mark momentum, then decide whether to finish or replan. {hiddenCount > 0 ? `${hiddenCount} more item${hiddenCount === 1 ? "" : "s"} stay queued after this sprint.` : "This clears the visible backlog."}
      </Text>
      <View style={styles.catchUpSteps}>
        {sprintItems.map((item, index) => {
          const course = getCourseForAssignment(courses, item);
          return (
            <View key={item.id} style={styles.catchUpStep}>
              <Text style={styles.catchUpStepNumber}>{index + 1}</Text>
              <Text style={styles.catchUpStepText} numberOfLines={1}>{course?.code ? `${course.code} · ` : ""}{item.title}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.catchUpActions}>
        <AppButton
          label={`${rescueMinutes}m focus save`}
          icon={Timer}
          onPress={() => {
            onUpdateStatus(first.id, "in_progress");
            onOpenFocus(first.id);
          }}
          style={styles.catchUpPrimaryAction}
        />
        <AppButton label="Open details" variant="secondary" onPress={() => onOpenAssignment(first.id)} style={styles.catchUpSecondaryAction} />
      </View>
      <AppButton label="Replan week" icon={CalendarPlus} variant="quiet" onPress={onOpenPlan} />
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

type CommandTileProps = {
  title: string;
  detail: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  onPress: () => void;
  tone: "pink" | "blue" | "green" | "purple";
};

function CommandTile({ title, detail, icon: Icon, onPress, tone }: CommandTileProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const toneColor = {
    pink: theme.colors.brandPink,
    blue: theme.colors.accent,
    green: theme.colors.green,
    purple: theme.colors.brandViolet
  }[tone];

  return (
    <TouchableOpacity accessibilityRole="button" style={styles.commandTile} onPress={onPress}>
      <View style={[styles.commandAccent, { backgroundColor: toneColor }]} />
      <View style={[styles.commandGlow, { backgroundColor: toneColor }]} />
      <View style={[styles.commandIcon, { backgroundColor: `${toneColor}22` }]}>
        <Icon color={toneColor} size={20} />
      </View>
      <Text style={styles.commandTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.commandDetail} numberOfLines={2}>{detail}</Text>
    </TouchableOpacity>
  );
}

function buildQuickDuePresets() {
  return [
    { label: "Today", value: todayDateInput(0) },
    { label: "Tomorrow", value: todayDateInput(1) },
    { label: "+3 days", value: todayDateInput(3) },
    { label: "Next week", value: todayDateInput(7) }
  ];
}

function formatDueUrgency(days: number) {
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  return `Due in ${days} day${days === 1 ? "" : "s"}`;
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    screen: {
      gap: 0
    },
    identityRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
      gap: spacing.md
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
    heroOrbPrimary: {
      position: "absolute",
      right: -56,
      top: -70,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: colors.accent,
      opacity: theme.isDark ? 0.20 : 0.10
    },
    heroOrbSecondary: {
      position: "absolute",
      left: -46,
      bottom: -68,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: colors.brandViolet,
      opacity: theme.isDark ? 0.16 : 0.08
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
      letterSpacing: -0.35
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
      letterSpacing: -0.3
    },
    metricLabel: {
      color: colors.heroMuted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.6
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
    startButton: {
      flex: 1.3,
      minHeight: 46,
      backgroundColor: colors.accent
    },
    focusButton: {
      flex: 0.9,
      minHeight: 46,
      backgroundColor: "rgba(255,255,255,0.18)",
      borderColor: "rgba(255,255,255,0.26)"
    },
    nextActions: {
      flexDirection: "row",
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
      gap: spacing.sm
    },
    starterButton: {
      flex: 1
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
      gap: spacing.sm
    },
    importHandoffButton: {
      flex: 1,
      paddingHorizontal: spacing.xs
    },
    commandGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    viewportBreak: {
      height: 92
    },
    commandTile: {
      width: "48%",
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
      width: 124
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
      gap: spacing.sm,
      marginTop: spacing.sm
    },
    actionButton: {
      flex: 1,
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
      letterSpacing: -0.2
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
      gap: spacing.sm
    },
    catchUpPrimaryAction: {
      flex: 1
    },
    catchUpSecondaryAction: {
      flex: 1,
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
