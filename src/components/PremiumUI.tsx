import React from "react";
import {
  StyleSheet,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewProps,
  ViewStyle
} from "react-native";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Circle,
  Flame,
  Sparkles,
  Target
} from "lucide-react-native";
import Svg, {
  Circle as SvgCircle,
  Defs,
  LinearGradient,
  Path,
  Stop
} from "react-native-svg";

import { Assignment, Course, WidgetSnapshot, WidgetSnapshotStyle } from "../models";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { daysUntil, formatShortDate } from "../logic/planner";

type Tone = "purple" | "blue" | "green" | "gold" | "red" | "neutral";

type DockTab<T extends string> = {
  id: T;
  label: string;
  icon: React.ComponentType<{ color: string; size: number }>;
};

const displayTextScale = 1.18;
const bodyTextScale = 1.35;
const dockTextScale = 1.1;

export function PremiumScreen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.premiumScreen, style]}>
      <View style={styles.screenWashTop} />
      <View style={styles.screenWashBottom} />
      <View style={styles.screenWashMiddle} />
      <View style={styles.screenRail} />
      {children}
    </View>
  );
}

export function PremiumHeader({
  eyebrow,
  title,
  subtitle,
  right
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.premiumHeader}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text maxFontSizeMultiplier={bodyTextScale} style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text maxFontSizeMultiplier={displayTextScale} style={styles.headerTitle}>
          {title}
        </Text>
        {subtitle ? <Text maxFontSizeMultiplier={bodyTextScale} style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

export function StudyPlannerBrand({ compact = false }: { compact?: boolean }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.brandLockup}>
      <BrandMark size={compact ? 38 : 48} />
      <View style={styles.brandCopy}>
        <Text style={[styles.brandWordmark, compact ? styles.brandWordmarkCompact : null]}>
          StudyPlanner
        </Text>
        <Text style={styles.brandSubtitle}>SYLLABUS AI</Text>
      </View>
    </View>
  );
}

export function BrandMark({ size = 42 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="brandA" x1="8" y1="4" x2="42" y2="44">
            <Stop offset="0" stopColor="#1D7CFF" />
            <Stop offset="0.45" stopColor="#7C3AED" />
            <Stop offset="1" stopColor="#FF7AA8" />
          </LinearGradient>
          <LinearGradient id="brandB" x1="12" y1="40" x2="42" y2="8">
            <Stop offset="0" stopColor="#8B5CF6" />
            <Stop offset="0.42" stopColor="#22C7D8" />
            <Stop offset="1" stopColor="#FDE68A" />
          </LinearGradient>
        </Defs>
        <Path
          d="M35.4 5.2c-7.8-2.2-17.1.3-22.2 6.4-5.1 6.1-4.4 14.2 1.5 18.4 3.9 2.8 9 3 12.6 1.5 2.5-1 4.9-.6 6.5 1.2 2.4 2.7.8 7.6-3.4 9.5-7.4 3.4-17.8 1-24.7-5.6C10.9 45 26.8 48 38 39.3c8.7-6.8 9.2-18.2.8-23.1-3.8-2.2-8.8-2.4-12.5-.9-2.1.9-4.2.4-5.2-1.3-1.4-2.4.5-5.2 4.2-6.3 2.9-.9 6.4-.7 10.1.5Z"
          fill="url(#brandA)"
        />
        <Path
          d="M10.7 31.4c6.2 3.4 14.2 2.8 19.4-1.3 3.2-2.5 4.8-5.8 4.5-9.3 7.1 3.9 8.2 12.3 2.2 17.7-8.6 7.7-24.7 4.9-31.1-1.9 1.1-2.4 2.7-4.1 5-5.2Z"
          fill="url(#brandB)"
          opacity={0.88}
        />
      </Svg>
    </View>
  );
}

type GlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tint?: "plain" | "warm" | "dark" | "hero";
} & Pick<ViewProps, "accessible" | "accessibilityHint" | "accessibilityLabel" | "accessibilityRole">;

export function GlassCard({
  children,
  style,
  tint = "plain",
  accessible,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole
}: GlassCardProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      style={[
        styles.glassCard,
        tint === "warm" ? styles.glassCardWarm : null,
        tint === "dark" ? styles.glassCardDark : null,
        tint === "hero" ? styles.glassCardHero : null,
        style
      ]}
    >
      {children}
    </View>
  );
}

export function CommandCenterHero({
  assignment,
  course,
  dueLabel,
  now,
  onOpen,
  onStart,
  onComplete
}: {
  assignment?: Assignment;
  course?: Course;
  dueLabel?: string;
  now?: Date;
  onOpen?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <GlassCard tint="hero" style={styles.commandHero}>
      <View pointerEvents="none" style={styles.heroBackdropBand} />
      <View style={styles.heroTopRow}>
        <View style={styles.heroIcon}>
          <Target color={colors.heroText} size={20} />
        </View>
        <View style={styles.heroTopCopy}>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.heroKicker}>NEXT DUE</Text>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.heroDueLabel}>
            {dueLabel || "Your plan is clear"}
          </Text>
        </View>
        <ProgressRing
          value={assignment ? Math.max(28, Math.min(100, 100 - Math.max(0, daysUntil(assignment.dueAt, now)) * 18)) : 100}
          color={course?.color || colors.brandBlue}
        />
      </View>

      {assignment ? (
        <>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Open ${assignment.title}, due ${formatShortDate(assignment.dueAt)}`}
            accessibilityHint="Opens assignment details."
            activeOpacity={0.82}
            onPress={onOpen}
          >
            <Text maxFontSizeMultiplier={displayTextScale} style={styles.heroTitle} numberOfLines={2}>
              {assignment.title}
            </Text>
            <Text maxFontSizeMultiplier={bodyTextScale} style={styles.heroMeta} numberOfLines={1}>
              {(course?.code || assignment.courseName || "Course")} - Due {formatShortDate(assignment.dueAt)}
            </Text>
          </TouchableOpacity>
          <View style={styles.heroBadgeRow}>
            <StatusBadge label={badgeLabel(assignment, now)} tone={badgeTone(assignment, now)} />
            <StatusBadge label={course?.code || "Class"} tone="blue" />
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Start ${assignment.title}`}
              accessibilityHint="Opens the assignment so you can begin working."
              style={styles.heroSecondaryButton}
              onPress={onStart}
            >
              <Text maxFontSizeMultiplier={bodyTextScale} style={styles.heroSecondaryText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Mark ${assignment.title} complete`}
              accessibilityHint="Marks this assignment done and refreshes planner surfaces."
              style={styles.heroPrimaryButton}
              onPress={onComplete}
            >
              <Text maxFontSizeMultiplier={bodyTextScale} style={styles.heroPrimaryText}>Complete</Text>
              <ChevronRight color={colors.heroText} size={15} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyStack}>
          <Text maxFontSizeMultiplier={displayTextScale} style={styles.heroTitle}>No next deadline.</Text>
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.heroMeta}>
            Scan a syllabus or add coursework to build your plan.
          </Text>
        </View>
      )}
    </GlassCard>
  );
}

export function MetricPill({
  label,
  value,
  tone = "purple",
  detail
}: {
  label: string;
  value: string;
  tone?: Tone;
  detail?: string;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.metricPill, styles[`${tone}Metric`]]}>
      <Text maxFontSizeMultiplier={displayTextScale} style={styles.metricValue}>{value}</Text>
      <Text maxFontSizeMultiplier={bodyTextScale} style={styles.metricLabel}>{label}</Text>
      {detail ? <Text maxFontSizeMultiplier={bodyTextScale} style={styles.metricDetail}>{detail}</Text> : null}
    </View>
  );
}

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.statusBadge, styles[`${tone}Badge`]]}>
      <View style={[styles.statusDot, styles[`${tone}Dot`]]} />
      <Text maxFontSizeMultiplier={bodyTextScale} style={styles.statusText}>{label}</Text>
    </View>
  );
}

export function PillFilter({
  label,
  active,
  onPress,
  count
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${label}${typeof count === "number" ? `, ${count}` : ""}`}
      accessibilityState={{ selected: active }}
      activeOpacity={0.82}
      style={[styles.filterPill, active ? styles.filterPillActive : null]}
      onPress={onPress}
    >
      <Text style={[styles.filterText, active ? styles.filterTextActive : null]}>
        {label}
        {typeof count === "number" ? ` ${count}` : ""}
      </Text>
    </TouchableOpacity>
  );
}

export function TaskRow({
  assignment,
  course,
  now,
  onOpen,
  onComplete,
  right,
  compact = false
}: {
  assignment: Assignment;
  course?: Course;
  now?: Date;
  onOpen?: () => void;
  onComplete?: () => void;
  right?: React.ReactNode;
  compact?: boolean;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const done = assignment.completionStatus === "completed" || assignment.status === "done";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${assignment.title}, ${course?.code || assignment.courseName || "Course"}, due ${formatShortDate(assignment.dueAt)}, ${done ? "done" : "not done"}`}
      accessibilityHint={onOpen ? "Opens assignment details" : undefined}
      activeOpacity={0.84}
      style={[styles.taskRow, compact ? styles.taskRowCompact : null, done ? styles.taskRowDone : null]}
      onPress={onOpen}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={done ? `Mark ${assignment.title} not done` : `Mark ${assignment.title} done`}
        style={styles.taskCheck}
        onPress={onComplete}
      >
        {done ? <CheckCircle2 color={colors.green} size={20} /> : <Circle color={colors.brandPurple} size={20} />}
      </TouchableOpacity>
      <View style={[styles.taskMark, { backgroundColor: course?.color || colors.brandPurple }]}>
        <Text style={styles.taskMarkText}>{(course?.code || assignment.courseName || "SP").slice(0, 1)}</Text>
      </View>
      <View style={styles.taskBody}>
        <Text style={[styles.taskCourse, done ? styles.doneText : null]} numberOfLines={1}>
          {course?.code || assignment.courseName || "Course"}
        </Text>
        <Text style={[styles.taskTitle, done ? styles.doneText : null]} numberOfLines={1}>
          {assignment.title}
        </Text>
        <Text style={styles.taskMeta} numberOfLines={1}>
          Due {formatShortDate(assignment.dueAt)}
        </Text>
      </View>
      {right || <StatusBadge label={badgeLabel(assignment, now)} tone={badgeTone(assignment, now)} />}
    </TouchableOpacity>
  );
}

export function WeekStrip({
  days,
  activeDate,
  onSelect
}: {
  days: Array<{ date: string; label: string; count: number }>;
  activeDate?: string;
  onSelect?: (date: string) => void;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.weekStrip}>
      {days.map((day) => {
        const active = day.date === activeDate;
        const [, , dateNumber] = day.date.split("-");
        return (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${day.label}, ${Number(dateNumber)}, ${day.count} deadline${day.count === 1 ? "" : "s"}`}
            accessibilityState={{ selected: active }}
            activeOpacity={0.82}
            key={day.date}
            style={[styles.weekPill, active ? styles.weekPillActive : null]}
            onPress={() => onSelect?.(day.date)}
          >
            <Text style={[styles.weekLetter, active ? styles.weekTextActive : null]}>
              {day.label.slice(0, 1)}
            </Text>
            <Text style={[styles.weekNumber, active ? styles.weekTextActive : null]}>
              {Number(dateNumber)}
            </Text>
            {day.count > 0 ? <View style={[styles.weekDot, active ? styles.weekDotActive : null]} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function CourseCard({
  course,
  dueThisWeek,
  progress,
  nextDue,
  active,
  onPress
}: {
  course: Course;
  dueThisWeek: number;
  progress: number;
  nextDue?: Assignment;
  active?: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${course.code}, ${course.name}. ${dueThisWeek} assignments due this week${nextDue ? `. Next: ${nextDue.title}` : ""}`}
      accessibilityState={{ selected: active }}
      activeOpacity={0.84}
      style={[styles.courseCard, active ? styles.courseCardActive : null]}
      onPress={onPress}
    >
      <View pointerEvents="none" style={[styles.courseAccentRail, { backgroundColor: course.color }]} />
      <View style={[styles.courseGlyph, { backgroundColor: course.color }]}>
        <Text style={styles.courseGlyphText}>{course.code.slice(0, 1)}</Text>
      </View>
      <View style={styles.courseBody}>
        <Text style={styles.courseTitle}>{course.code}</Text>
        <Text style={styles.courseName} numberOfLines={1}>
          {course.name}
        </Text>
        <Text style={styles.courseMeta}>{dueThisWeek} assignments due this week</Text>
        {nextDue ? <Text style={styles.courseNext} numberOfLines={1}>Next: {nextDue.title}</Text> : null}
      </View>
      <ProgressRing value={progress} color={course.color} />
    </TouchableOpacity>
  );
}

export function WarningCard({
  title,
  message,
  actionLabel,
  onPress
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <View style={styles.warningCard}>
      <View style={styles.warningIcon}>
        <Flame color={colors.coral} size={20} />
      </View>
      <View style={styles.warningBody}>
        <Text maxFontSizeMultiplier={displayTextScale} style={styles.warningTitle}>{title}</Text>
        <Text maxFontSizeMultiplier={bodyTextScale} style={styles.warningMessage}>{message}</Text>
      </View>
      {actionLabel && onPress ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityHint={message}
          style={styles.warningButton}
          onPress={onPress}
        >
          <Text maxFontSizeMultiplier={bodyTextScale} style={styles.warningButtonText}>{actionLabel}</Text>
          <ChevronRight color={colors.heroText} size={14} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function WidgetPreviewSmall({
  snapshot,
  widgetStyle
}: {
  snapshot: WidgetSnapshot;
  widgetStyle?: WidgetSnapshotStyle;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const item = snapshot.surfaces.small.item;
  const visual = widgetPreviewVisual(snapshot, widgetStyle, colors);

  return (
    <View style={[styles.smallWidget, { backgroundColor: visual.background }]}>
      <View pointerEvents="none" style={[styles.widgetBandOne, { backgroundColor: `${visual.secondary}45` }]} />
      <View pointerEvents="none" style={[styles.widgetBandTwo, { backgroundColor: `${visual.accent}33` }]} />
      <View style={styles.widgetTop}>
        <Text style={[styles.widgetLabel, { color: visual.text }]}>Next Due</Text>
        <Text style={[styles.widgetBadge, { color: visual.text }]} numberOfLines={1}>{item?.dueLabel || "Clear"}</Text>
      </View>
      <View style={[styles.widgetIcon, { backgroundColor: visual.accent }]}>
        <CalendarClock color={colors.heroText} size={16} />
      </View>
      <Text style={[styles.smallWidgetTitle, { color: visual.text }]} numberOfLines={2}>
        {item?.title || snapshot.emptyState.title}
      </Text>
      <Text style={[styles.widgetMeta, { color: visual.muted }]} numberOfLines={1}>
        {item?.courseName || snapshot.emptyState.message}
      </Text>
      <Text style={[styles.widgetCountdown, { color: visual.accent }]}>{item?.dueLabel || "All set"}</Text>
    </View>
  );
}

export function WidgetPreviewMedium({
  snapshot,
  widgetStyle
}: {
  snapshot: WidgetSnapshot;
  widgetStyle?: WidgetSnapshotStyle;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const items = snapshot.surfaces.medium.items;
  const visual = widgetPreviewVisual(snapshot, widgetStyle, colors);

  return (
    <View style={[styles.mediumWidget, { backgroundColor: visual.background }]}>
      <View pointerEvents="none" style={[styles.widgetBandOne, { backgroundColor: `${visual.secondary}45` }]} />
      <View pointerEvents="none" style={[styles.widgetBandTwo, { backgroundColor: `${visual.accent}33` }]} />
      <View style={styles.widgetTop}>
        <Text style={[styles.widgetLabel, { color: visual.text }]}>This Week</Text>
        <Sparkles color={visual.accent} size={15} />
      </View>
      {items.length === 0 ? (
        <Text style={[styles.widgetMeta, { color: visual.muted }]}>{snapshot.emptyState.message}</Text>
      ) : (
        items.map((item) => (
          <View key={item.assignmentId} style={styles.mediumWidgetRow}>
            <View style={[styles.widgetRowIcon, styles[`${widgetTone(item.urgency)}WidgetIcon`]]}>
              <CalendarClock color={colors.heroText} size={12} />
            </View>
            <View style={styles.widgetRowCopy}>
              <Text style={[styles.widgetRowTitle, { color: visual.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.widgetRowMeta, { color: visual.muted }]} numberOfLines={1}>
                {item.courseName}
              </Text>
            </View>
            <Text
              style={[
                styles.widgetDue,
                { color: visual.accent },
                item.urgency === "today" || item.urgency === "soon" ? styles.widgetDueHot : null
              ]}
            >
              {item.dueLabel}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

export function WidgetPreviewMonthly({
  snapshot,
  widgetStyle
}: {
  snapshot: WidgetSnapshot;
  widgetStyle?: WidgetSnapshotStyle;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const visual = widgetPreviewVisual(snapshot, widgetStyle, colors);
  const month = snapshot.monthly;
  const days = month?.days.slice(0, 21) || [];

  return (
    <View style={[styles.monthlyWidget, { backgroundColor: visual.background }]}>
      <View pointerEvents="none" style={[styles.widgetBandOne, { backgroundColor: `${visual.secondary}45` }]} />
      <View style={styles.widgetTop}>
        <Text style={[styles.widgetLabel, { color: visual.text }]}>Monthly Calendar</Text>
        <Text style={[styles.widgetDue, { color: visual.accent }]}>{month?.dueThisMonth || 0} due</Text>
      </View>
      <View style={styles.monthlyWidgetGrid}>
        {days.map((day) => (
          <View
            key={day.date}
            style={[
              styles.monthlyWidgetDay,
              day.isToday ? { backgroundColor: visual.accent } : null,
              day.isHeavy ? { borderColor: visual.accent } : null
            ]}
          >
            <Text style={[styles.monthlyWidgetDayText, { color: day.isToday ? colors.heroText : visual.text }]}>
              {day.dayNumber}
            </Text>
            <View style={styles.monthlyWidgetDots}>
              {day.courseColors.slice(0, 2).map((color, index) => (
                <View key={`${day.date}-${color}-${index}`} style={[styles.monthlyWidgetDot, { backgroundColor: color }]} />
              ))}
            </View>
          </View>
        ))}
      </View>
      <Text style={[styles.widgetRowMeta, { color: visual.muted }]}>
        {month?.heavyDayCount || 0} busy days - {month?.examCount || 0} exams
      </Text>
    </View>
  );
}

export function WidgetPreviewHeavyWeek({
  snapshot,
  widgetStyle
}: {
  snapshot: WidgetSnapshot;
  widgetStyle?: WidgetSnapshotStyle;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const visual = widgetPreviewVisual(snapshot, widgetStyle, colors);
  const values = snapshot.insights?.workloadByDay || [];
  const max = Math.max(1, ...values.map((day) => day.count));

  return (
    <View style={[styles.heavyWeekWidget, { backgroundColor: visual.background }]}>
      <View style={styles.widgetTop}>
        <Text style={[styles.widgetLabel, { color: visual.text }]}>Busy Week</Text>
        <Flame color={visual.accent} size={15} />
      </View>
      <Text style={[styles.widgetMeta, { color: visual.muted }]} numberOfLines={1}>
        {snapshot.heavyWeekWarning?.label || "Workload is steady"}
      </Text>
      <View style={styles.heavyWeekBars}>
        {values.map((day) => (
          <View key={day.date} style={styles.heavyWeekTrack}>
            <View
              style={[
                styles.heavyWeekFill,
                {
                  height: `${Math.max(10, (day.count / max) * 100)}%` as `${number}%`,
                  backgroundColor: day.examCount > 0 ? colors.brandCoral : visual.accent
                }
              ]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export function WidgetPreviewCourseFocus({
  snapshot,
  widgetStyle
}: {
  snapshot: WidgetSnapshot;
  widgetStyle?: WidgetSnapshotStyle;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const visual = widgetPreviewVisual(snapshot, widgetStyle, colors);
  const courses = snapshot.insights?.courseBalance.slice(0, 3) || [];

  return (
    <View style={[styles.courseFocusWidget, { backgroundColor: visual.background }]}>
      <View style={styles.widgetTop}>
        <Text style={[styles.widgetLabel, { color: visual.text }]}>Work by Class</Text>
        <Target color={visual.accent} size={15} />
      </View>
      {courses.map((course) => (
        <View key={course.courseId} style={styles.courseFocusRow}>
          <View style={[styles.courseFocusDot, { backgroundColor: course.color }]} />
          <Text style={[styles.widgetRowTitle, { color: visual.text }]} numberOfLines={1}>
            {course.courseName}
          </Text>
          <Text style={[styles.widgetDue, { color: visual.accent }]}>{course.openCount}</Text>
        </View>
      ))}
    </View>
  );
}

export function WidgetShowcase({
  snapshot,
  widgetStyle
}: {
  snapshot: WidgetSnapshot;
  widgetStyle?: WidgetSnapshotStyle;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.widgetShowcase}>
      <View pointerEvents="none" style={styles.widgetShowcaseRail} />
      <View style={styles.widgetHeader}>
        <View>
          <Text style={styles.widgetKicker}>Home Screen Widgets</Text>
          <Text style={styles.widgetTitle}>Deadlines stay visible before the app opens.</Text>
        </View>
        <Sparkles color={theme.colors.brandPurple} size={20} />
      </View>
      <View style={styles.widgetGrid}>
        <WidgetPreviewSmall snapshot={snapshot} widgetStyle={widgetStyle} />
        <WidgetPreviewMedium snapshot={snapshot} widgetStyle={widgetStyle} />
      </View>
    </View>
  );
}

export function BottomDock<T extends string>({
  tabs,
  activeTab,
  onSelect
}: {
  tabs: DockTab<T>[];
  activeTab: T;
  onSelect: (tab: T) => void;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <View style={styles.bottomDock}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            activeOpacity={0.82}
            key={tab.id}
            style={[styles.dockButton, active ? styles.dockButtonActive : null]}
            onPress={() => onSelect(tab.id)}
          >
            <Icon color={active ? colors.brandPurple : colors.faint} size={19} />
            <Text
              maxFontSizeMultiplier={dockTextScale}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.dockLabel, active ? styles.dockLabelActive : null]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function PreviewPosterSurface({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return <View style={styles.previewPoster}>{children}</View>;
}

export function PremiumCard(props: {
  children: React.ReactNode;
  tone?: "plain" | "hero" | "soft";
  style?: StyleProp<ViewStyle>;
}) {
  return <GlassCard tint={props.tone === "hero" ? "hero" : "plain"} style={props.style}>{props.children}</GlassCard>;
}

export function ScreenHeader(props: { eyebrow?: string; title: string; subtitle?: string }) {
  return <PremiumHeader {...props} />;
}

export function StatChip(props: {
  label: string;
  value: string;
  tone?: Tone;
  detail?: string;
}) {
  return <MetricPill {...props} />;
}

export function DateStrip(props: {
  days: Array<{ date: string; label: string; count: number }>;
  activeDate?: string;
  onSelect?: (date: string) => void;
}) {
  return <WeekStrip {...props} />;
}

export function WorkloadBars({ values }: { values: number[] }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const max = Math.max(1, ...values);

  return (
    <View
      accessible
      accessibilityLabel={`Workload by day: ${values
        .map((value, index) => `day ${index + 1} has ${value} deadline${value === 1 ? "" : "s"}`)
        .join(", ")}`}
      style={styles.workloadBars}
    >
      {values.map((value, index) => (
        <View key={`${value}-${index}`} style={styles.workloadTrack}>
          <View style={[styles.workloadFill, { height: `${Math.max(8, (value / max) * 100)}%` as `${number}%` }]} />
        </View>
      ))}
    </View>
  );
}

export function CourseSummaryCard(props: {
  course: Course;
  dueThisWeek: number;
  progress: number;
  onPress: () => void;
}) {
  return <CourseCard {...props} />;
}

export function WidgetPreviewSection({ snapshot }: { snapshot: WidgetSnapshot }) {
  return <WidgetShowcase snapshot={snapshot} />;
}

function widgetPreviewVisual(
  snapshot: WidgetSnapshot,
  override: WidgetSnapshotStyle | undefined,
  colors: AppTheme["colors"]
) {
  const visual = override || snapshot.widgetStyle;

  return {
    background: visual?.background || colors.widgetDark,
    text: visual?.text || colors.heroText,
    muted: visual?.muted || colors.heroMuted,
    accent: visual?.accent || colors.widgetAccent,
    secondary: visual?.secondary || colors.brandBlue
  };
}

function ProgressRing({ value, color }: { value: number; color: string }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <View style={styles.progressRing}>
      <Svg width={48} height={48}>
        <SvgCircle cx={24} cy={24} r={radius} stroke={theme.colors.line} strokeWidth={4} fill="transparent" />
        <SvgCircle
          cx={24}
          cy={24}
          r={radius}
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          rotation="-90"
          origin="24,24"
        />
      </Svg>
      <Text maxFontSizeMultiplier={1} style={[styles.progressValue, { color }]}>{value}%</Text>
    </View>
  );
}

function badgeLabel(assignment: Assignment, now = new Date()) {
  if (assignment.kind === "exam" || assignment.type === "exam") return "High";
  const days = daysUntil(assignment.dueAt, now);
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 3) return "Soon";
  return assignment.priority === "high" ? "High" : "Open";
}

function badgeTone(assignment: Assignment, now = new Date()): Tone {
  if (assignment.kind === "exam" || assignment.type === "exam" || assignment.priority === "high") return "red";
  const days = daysUntil(assignment.dueAt, now);
  if (days <= 1) return "gold";
  if (assignment.priority === "medium") return "blue";
  return "green";
}

function widgetTone(urgency: string): "purple" | "blue" | "gold" | "red" {
  if (urgency === "overdue") return "red";
  if (urgency === "today" || urgency === "soon") return "gold";
  if (urgency === "upcoming") return "blue";
  return "purple";
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    premiumScreen: {
      position: "relative",
      gap: spacing.md,
      overflow: "hidden"
    },
    screenWashTop: {
      position: "absolute",
      top: -58,
      right: -68,
      width: 265,
      height: 146,
      borderRadius: 46,
      backgroundColor: `${colors.brandBlue}12`,
      transform: [{ rotate: "28deg" }]
    },
    screenWashBottom: {
      position: "absolute",
      top: 132,
      left: -92,
      width: 250,
      height: 82,
      borderRadius: 32,
      backgroundColor: `${colors.brandPurple}10`,
      transform: [{ rotate: "-22deg" }]
    },
    screenWashMiddle: {
      position: "absolute",
      top: 320,
      right: -112,
      width: 290,
      height: 110,
      borderRadius: 42,
      backgroundColor: `${colors.brandCoral}0D`,
      transform: [{ rotate: "-18deg" }]
    },
    screenRail: {
      position: "absolute",
      top: 0,
      right: 0,
      width: 6,
      height: 220,
      borderRadius: 999,
      backgroundColor: `${colors.brandBlue}18`
    },
    brandLockup: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    brandCopy: {
      gap: 2
    },
    brandWordmark: {
      color: colors.ink,
      fontSize: 27,
      lineHeight: 31,
      fontWeight: "900"
    },
    brandWordmarkCompact: {
      fontSize: 22,
      lineHeight: 26
    },
    brandSubtitle: {
      color: colors.faint,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "900",
      letterSpacing: 0
    },
    premiumHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    headerCopy: {
      flex: 1,
      gap: 3
    },
    headerRight: {
      alignItems: "flex-end",
      justifyContent: "center"
    },
    eyebrow: {
      color: colors.brandPurple,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    headerTitle: {
      color: colors.ink,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "900"
    },
    headerSubtitle: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    glassCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.22 : 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4
    },
    glassCardWarm: {
      backgroundColor: colors.warningSurface,
      borderColor: "rgba(245,158,11,0.28)"
    },
    glassCardDark: {
      backgroundColor: colors.widgetDark,
      borderColor: "rgba(255,255,255,0.10)"
    },
    glassCardHero: {
      borderColor: "rgba(108,92,231,0.16)",
      backgroundColor: colors.surface
    },
    commandHero: {
      minHeight: 150,
      overflow: "hidden",
      borderColor: `${colors.brandBlue}26`,
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.22 : 0.1,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 5
    },
    heroBackdropBand: {
      position: "absolute",
      top: -24,
      right: -56,
      width: 210,
      height: 116,
      borderRadius: 34,
      backgroundColor: `${colors.brandBlue}14`,
      transform: [{ rotate: "20deg" }]
    },
    heroBackdropRail: {
      position: "absolute",
      bottom: -34,
      left: -36,
      width: 220,
      height: 86,
      borderRadius: 32,
      backgroundColor: "rgba(242,95,107,0.26)",
      transform: [{ rotate: "-17deg" }]
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    heroIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandPurple
    },
    heroTopCopy: {
      flex: 1,
      gap: 2
    },
    heroKicker: {
      color: colors.faint,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    heroDueLabel: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    heroTitle: {
      color: colors.ink,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "900"
    },
    heroMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700",
      marginTop: 2
    },
    heroBadgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    heroActions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs
    },
    heroSecondaryButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: radii.round,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt
    },
    heroSecondaryText: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: "900"
    },
    heroPrimaryButton: {
      flex: 1.3,
      minHeight: 42,
      borderRadius: radii.round,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 2,
      backgroundColor: colors.brandBlue,
      shadowColor: colors.brandBlue,
      shadowOpacity: 0.22,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4
    },
    heroPrimaryText: {
      color: colors.heroText,
      fontSize: 12,
      fontWeight: "900"
    },
    emptyStack: {
      gap: spacing.xs
    },
    metricPill: {
      flex: 1,
      minHeight: 72,
      borderRadius: 16,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 7 },
      elevation: 2
    },
    metricValue: {
      color: colors.ink,
      fontSize: 24,
      lineHeight: 29,
      fontWeight: "900"
    },
    metricLabel: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900"
    },
    metricDetail: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "700"
    },
    purpleMetric: {
      backgroundColor: colors.purpleSoft,
      borderColor: "rgba(108,92,231,0.16)"
    },
    blueMetric: {
      backgroundColor: colors.blueSoft,
      borderColor: "rgba(59,130,246,0.16)"
    },
    greenMetric: {
      backgroundColor: colors.mint,
      borderColor: "rgba(31,154,107,0.18)"
    },
    goldMetric: {
      backgroundColor: colors.softGold,
      borderColor: "rgba(245,158,11,0.24)"
    },
    redMetric: {
      backgroundColor: colors.redSoft,
      borderColor: "rgba(239,68,68,0.18)"
    },
    neutralMetric: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.line
    },
    statusBadge: {
      minHeight: 25,
      borderRadius: radii.round,
      borderWidth: 1,
      paddingHorizontal: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      gap: 5
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3
    },
    statusText: {
      color: colors.ink,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "900"
    },
    purpleBadge: { backgroundColor: colors.purpleSoft, borderColor: "rgba(108,92,231,0.16)" },
    blueBadge: { backgroundColor: colors.blueSoft, borderColor: "rgba(59,130,246,0.16)" },
    greenBadge: { backgroundColor: colors.mint, borderColor: "rgba(31,154,107,0.18)" },
    goldBadge: { backgroundColor: colors.softGold, borderColor: "rgba(245,158,11,0.24)" },
    redBadge: { backgroundColor: colors.redSoft, borderColor: "rgba(239,68,68,0.18)" },
    neutralBadge: { backgroundColor: colors.surfaceAlt, borderColor: colors.line },
    purpleDot: { backgroundColor: colors.brandPurple },
    blueDot: { backgroundColor: colors.brandBlue },
    greenDot: { backgroundColor: colors.green },
    goldDot: { backgroundColor: colors.gold },
    redDot: { backgroundColor: colors.red },
    neutralDot: { backgroundColor: colors.faint },
    filterPill: {
      minHeight: 44,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center"
    },
    filterPillActive: {
      borderColor: colors.brandPurple,
      backgroundColor: colors.brandPurple
    },
    filterText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900"
    },
    filterTextActive: {
      color: colors.heroText
    },
    taskRow: {
      minHeight: 76,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: "rgba(255,255,255,0.97)",
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.18 : 0.08,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2
    },
    taskRowCompact: {
      minHeight: 66
    },
    taskRowDone: {
      opacity: 0.58
    },
    taskCheck: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center"
    },
    taskMark: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center"
    },
    taskMarkText: {
      color: colors.heroText,
      fontSize: 13,
      fontWeight: "900"
    },
    taskBody: {
      flex: 1,
      minWidth: 0,
      gap: 1
    },
    taskCourse: {
      color: colors.brandPurple,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    taskTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    doneText: {
      textDecorationLine: "line-through",
      color: colors.faint
    },
    taskMeta: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "700"
    },
    weekStrip: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 4
    },
    weekPill: {
      flex: 1,
      minHeight: 57,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      gap: 1,
      backgroundColor: "rgba(255,255,255,0.56)"
    },
    weekPillActive: {
      backgroundColor: colors.brandPurple,
      shadowColor: colors.brandPurple,
      shadowOpacity: 0.22,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 7 },
      elevation: 4
    },
    weekLetter: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    weekNumber: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    weekTextActive: {
      color: colors.heroText
    },
    weekDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.brandPurple
    },
    weekDotActive: {
      backgroundColor: colors.heroText
    },
    courseCard: {
      minHeight: 92,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: "rgba(255,255,255,0.97)",
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.18 : 0.09,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 3
    },
    courseCardActive: {
      borderColor: "rgba(108,92,231,0.38)",
      backgroundColor: "#FFFFFF"
    },
    courseAccentRail: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: 6,
      opacity: 0.9
    },
    courseGlyph: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center"
    },
    courseGlyphText: {
      color: colors.heroText,
      fontSize: 13,
      fontWeight: "900"
    },
    courseBody: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    courseTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    courseName: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    courseMeta: {
      color: colors.ink,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    courseNext: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "700"
    },
    progressRing: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center"
    },
    progressValue: {
      position: "absolute",
      fontSize: 10,
      fontWeight: "900"
    },
    warningCard: {
      minHeight: 92,
      borderRadius: 22,
      backgroundColor: "#FFF3DA",
      borderWidth: 1,
      borderColor: "rgba(245,158,11,0.36)",
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      shadowColor: colors.gold,
      shadowOpacity: 0.14,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 3
    },
    warningIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center"
    },
    warningBody: {
      flex: 1,
      gap: 2
    },
    warningTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    warningMessage: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "700"
    },
    warningButton: {
      minHeight: 36,
      borderRadius: radii.round,
      backgroundColor: colors.brandCoral,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 1
    },
    warningButtonText: {
      color: colors.heroText,
      fontSize: 11,
      fontWeight: "900"
    },
    widgetShowcase: {
      gap: spacing.md,
      overflow: "hidden"
    },
    widgetShowcaseRail: {
      position: "absolute",
      top: -38,
      right: -36,
      width: 180,
      height: 88,
      borderRadius: 30,
      backgroundColor: `${colors.brandBlue}12`,
      transform: [{ rotate: "24deg" }]
    },
    widgetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    widgetKicker: {
      color: colors.brandPurple,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    widgetTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "900"
    },
    widgetGrid: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "stretch"
    },
    smallWidget: {
      flex: 0.88,
      minHeight: 172,
      borderRadius: 22,
      padding: spacing.md,
      overflow: "hidden",
      backgroundColor: "#19132D",
      borderWidth: 1,
      borderColor: "rgba(16,24,40,0.10)",
      gap: spacing.xs,
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 9 },
      elevation: 3
    },
    mediumWidget: {
      flex: 1.35,
      minHeight: 172,
      borderRadius: 22,
      padding: spacing.md,
      overflow: "hidden",
      backgroundColor: "#19132D",
      borderWidth: 1,
      borderColor: "rgba(16,24,40,0.10)",
      gap: 6
    },
    monthlyWidget: {
      minHeight: 196,
      borderRadius: 22,
      padding: spacing.md,
      overflow: "hidden",
      backgroundColor: "#19132D",
      borderWidth: 1,
      borderColor: "rgba(16,24,40,0.10)",
      gap: spacing.xs
    },
    heavyWeekWidget: {
      flex: 1,
      minHeight: 154,
      borderRadius: 22,
      padding: spacing.md,
      overflow: "hidden",
      backgroundColor: "#19132D",
      borderWidth: 1,
      borderColor: "rgba(16,24,40,0.10)",
      gap: spacing.xs
    },
    courseFocusWidget: {
      flex: 1,
      minHeight: 154,
      borderRadius: 22,
      padding: spacing.md,
      overflow: "hidden",
      backgroundColor: "#19132D",
      borderWidth: 1,
      borderColor: "rgba(16,24,40,0.10)",
      gap: spacing.xs
    },
    widgetBandOne: {
      position: "absolute",
      top: -34,
      right: -40,
      width: 152,
      height: 74,
      borderRadius: 28,
      backgroundColor: "rgba(59,130,246,0.28)",
      transform: [{ rotate: "21deg" }]
    },
    widgetBandTwo: {
      position: "absolute",
      bottom: -32,
      left: -38,
      width: 150,
      height: 66,
      borderRadius: 28,
      backgroundColor: "rgba(242,95,107,0.20)",
      transform: [{ rotate: "-18deg" }]
    },
    widgetTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs
    },
    widgetLabel: {
      color: colors.heroText,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    widgetBadge: {
      overflow: "hidden",
      borderRadius: radii.round,
      backgroundColor: "rgba(255,255,255,0.14)",
      color: colors.heroText,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "800",
      paddingHorizontal: 7,
      paddingVertical: 3
    },
    widgetIcon: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandCoral
    },
    smallWidgetTitle: {
      color: colors.heroText,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    widgetMeta: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    widgetCountdown: {
      marginTop: "auto",
      color: colors.widgetAccent,
      fontSize: 20,
      lineHeight: 25,
      fontWeight: "900"
    },
    mediumWidgetRow: {
      minHeight: 32,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.08)",
      paddingTop: 6
    },
    widgetRowIcon: {
      width: 25,
      height: 25,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center"
    },
    purpleWidgetIcon: { backgroundColor: colors.brandPurple },
    blueWidgetIcon: { backgroundColor: colors.brandBlue },
    goldWidgetIcon: { backgroundColor: "#F59E0B" },
    redWidgetIcon: { backgroundColor: colors.brandCoral },
    widgetRowCopy: {
      flex: 1,
      minWidth: 0
    },
    widgetRowTitle: {
      color: colors.heroText,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    widgetRowMeta: {
      color: colors.heroMuted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "700"
    },
    widgetDue: {
      color: colors.widgetAccent,
      fontSize: 10,
      fontWeight: "900"
    },
    widgetDueHot: {
      color: "#FF8A7A"
    },
    monthlyWidgetGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4
    },
    monthlyWidgetDay: {
      width: "12%",
      minHeight: 24,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.10)",
      backgroundColor: "rgba(255,255,255,0.08)",
      alignItems: "center",
      justifyContent: "center",
      gap: 1
    },
    monthlyWidgetDayText: {
      color: colors.heroText,
      fontSize: 9,
      lineHeight: 11,
      fontWeight: "900"
    },
    monthlyWidgetDots: {
      minHeight: 3,
      flexDirection: "row",
      gap: 1
    },
    monthlyWidgetDot: {
      width: 3,
      height: 3,
      borderRadius: 2
    },
    heavyWeekBars: {
      flex: 1,
      minHeight: 74,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 5,
      paddingTop: spacing.xs
    },
    heavyWeekTrack: {
      flex: 1,
      height: "100%",
      borderRadius: radii.round,
      backgroundColor: "rgba(255,255,255,0.10)",
      justifyContent: "flex-end",
      overflow: "hidden"
    },
    heavyWeekFill: {
      width: "100%",
      borderRadius: radii.round
    },
    courseFocusRow: {
      minHeight: 31,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.08)",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    courseFocusDot: {
      width: 8,
      height: 8,
      borderRadius: 4
    },
    lockWidget: {
      minHeight: 258,
      borderRadius: 28,
      overflow: "hidden",
      backgroundColor: colors.lockWidget,
      borderWidth: 1,
      borderColor: "rgba(16,24,40,0.10)",
      padding: spacing.md,
      alignItems: "center",
      gap: spacing.xs
    },
    lockAuroraOne: {
      position: "absolute",
      top: -45,
      right: -30,
      width: 190,
      height: 190,
      borderRadius: 95,
      backgroundColor: "rgba(22,194,255,0.36)"
    },
    lockAuroraTwo: {
      position: "absolute",
      bottom: -40,
      left: -35,
      width: 210,
      height: 210,
      borderRadius: 105,
      backgroundColor: "rgba(255,82,143,0.32)"
    },
    lockDate: {
      color: colors.heroText,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "700",
      marginTop: spacing.xs
    },
    lockTime: {
      color: colors.heroText,
      fontSize: 58,
      lineHeight: 64,
      fontWeight: "800"
    },
    lockNotification: {
      width: "100%",
      minHeight: 66,
      borderRadius: 17,
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: "auto"
    },
    lockNotificationIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandCoral
    },
    lockNotificationCopy: {
      flex: 1,
      minWidth: 0
    },
    lockNotificationTitle: {
      color: colors.heroText,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    lockNotificationMeta: {
      color: "rgba(248,250,252,0.76)",
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    bottomDock: {
      minHeight: 72,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 25,
      borderWidth: 1,
      borderColor: "rgba(148,163,184,0.24)",
      backgroundColor: "rgba(255,255,255,0.96)",
      padding: 5,
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 10
    },
    dockButton: {
      flex: 1,
      minHeight: 56,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      gap: 3
    },
    dockButtonActive: {
      backgroundColor: colors.purpleSoft
    },
    dockLabel: {
      color: colors.faint,
      fontSize: 8,
      lineHeight: 11,
      fontWeight: "900"
    },
    dockLabelActive: {
      color: colors.brandPurple
    },
    workloadBars: {
      height: 82,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      paddingHorizontal: spacing.xs,
      paddingTop: spacing.sm
    },
    workloadTrack: {
      flex: 1,
      height: "100%",
      borderRadius: radii.round,
      backgroundColor: colors.surfaceAlt,
      justifyContent: "flex-end",
      overflow: "hidden"
    },
    workloadFill: {
      borderRadius: radii.round,
      backgroundColor: colors.brandPurple
    },
    previewPoster: {
      borderRadius: 28,
      padding: spacing.md,
      backgroundColor: colors.canvas
    }
  });
}
