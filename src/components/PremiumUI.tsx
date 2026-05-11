import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Circle,
  Flame,
  Lock,
  Sparkles,
  Target
} from "lucide-react-native";
import Svg, { Circle as SvgCircle } from "react-native-svg";

import { Assignment, Course, WidgetSnapshot } from "../models";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { daysUntil, formatShortDate } from "../logic/planner";

type Tone = "purple" | "blue" | "green" | "gold" | "red" | "neutral";

type DockTab<T extends string> = {
  id: T;
  label: string;
  icon: React.ComponentType<{ color: string; size: number }>;
};

export function PremiumScreen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.premiumScreen, style]}>
      <View style={styles.screenWashTop} />
      <View style={styles.screenWashBottom} />
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
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

export function GlassCard({
  children,
  style,
  tint = "plain"
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  tint?: "plain" | "warm" | "dark" | "hero";
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View
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
  onOpen,
  onStart,
  onComplete
}: {
  assignment?: Assignment;
  course?: Course;
  dueLabel?: string;
  onOpen?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);

  return (
    <GlassCard tint="hero" style={styles.commandHero}>
      <View style={styles.heroTopRow}>
        <View style={styles.heroIcon}>
          <Target color={colors.heroText} size={20} />
        </View>
        <View style={styles.heroTopCopy}>
          <Text style={styles.heroKicker}>Next Due</Text>
          <Text style={styles.heroDueLabel}>{dueLabel || "Your plan is clear"}</Text>
        </View>
        {assignment ? <StatusBadge label={badgeLabel(assignment)} tone={badgeTone(assignment)} /> : null}
      </View>

      {assignment ? (
        <>
          <TouchableOpacity accessibilityRole="button" activeOpacity={0.82} onPress={onOpen}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {assignment.title}
            </Text>
            <Text style={styles.heroMeta} numberOfLines={1}>
              {(course?.code || assignment.courseName || "Course")} - Due {formatShortDate(assignment.dueAt)}
            </Text>
          </TouchableOpacity>
          <View style={styles.heroActions}>
            <TouchableOpacity accessibilityRole="button" style={styles.heroSecondaryButton} onPress={onStart}>
              <Text style={styles.heroSecondaryText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.heroPrimaryButton} onPress={onComplete}>
              <Text style={styles.heroPrimaryText}>Complete</Text>
              <ChevronRight color={colors.heroText} size={15} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.emptyStack}>
          <Text style={styles.heroTitle}>No next deadline.</Text>
          <Text style={styles.heroMeta}>Scan a syllabus or add coursework to build your command center.</Text>
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
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {detail ? <Text style={styles.metricDetail}>{detail}</Text> : null}
    </View>
  );
}

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.statusBadge, styles[`${tone}Badge`]]}>
      <View style={[styles.statusDot, styles[`${tone}Dot`]]} />
      <Text style={styles.statusText}>{label}</Text>
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
  onOpen,
  onComplete,
  right,
  compact = false
}: {
  assignment: Assignment;
  course?: Course;
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
      activeOpacity={0.84}
      style={[styles.taskRow, compact ? styles.taskRowCompact : null, done ? styles.taskRowDone : null]}
      onPress={onOpen}
    >
      <TouchableOpacity accessibilityRole="button" style={styles.taskCheck} onPress={onComplete}>
        {done ? <CheckCircle2 color={colors.green} size={20} /> : <Circle color={colors.brandPurple} size={20} />}
      </TouchableOpacity>
      <View style={[styles.taskMark, { backgroundColor: course?.color || colors.brandPurple }]}>
        <Text style={styles.taskMarkText}>{(course?.code || assignment.courseName || "SP").slice(0, 1)}</Text>
      </View>
      <View style={styles.taskBody}>
        <Text style={[styles.taskTitle, done ? styles.doneText : null]} numberOfLines={1}>
          {assignment.title}
        </Text>
        <Text style={styles.taskMeta} numberOfLines={1}>
          {course?.code || assignment.courseName || "Course"} - Due {formatShortDate(assignment.dueAt)}
        </Text>
      </View>
      {right || <StatusBadge label={badgeLabel(assignment)} tone={badgeTone(assignment)} />}
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
      accessibilityState={{ selected: active }}
      activeOpacity={0.84}
      style={[styles.courseCard, active ? styles.courseCardActive : null]}
      onPress={onPress}
    >
      <View style={[styles.courseGlyph, { backgroundColor: course.color }]}>
        <Text style={styles.courseGlyphText}>{course.code.slice(0, 1)}</Text>
      </View>
      <View style={styles.courseBody}>
        <Text style={styles.courseTitle}>{course.code}</Text>
        <Text style={styles.courseName} numberOfLines={1}>
          {course.name}
        </Text>
        <Text style={styles.courseMeta}>{dueThisWeek} Due This Week</Text>
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
        <Text style={styles.warningTitle}>{title}</Text>
        <Text style={styles.warningMessage}>{message}</Text>
      </View>
      {actionLabel && onPress ? (
        <TouchableOpacity accessibilityRole="button" style={styles.warningButton} onPress={onPress}>
          <Text style={styles.warningButtonText}>{actionLabel}</Text>
          <ChevronRight color={colors.heroText} size={14} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function WidgetPreviewSmall({ snapshot }: { snapshot: WidgetSnapshot }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const item = snapshot.surfaces.small.item;

  return (
    <View style={styles.smallWidget}>
      <View style={styles.widgetTop}>
        <Text style={styles.widgetLabel}>Next Due</Text>
        <Text style={styles.widgetBadge}>{item?.urgencyLabel || "Clear"}</Text>
      </View>
      <View style={styles.widgetIcon}>
        <CalendarClock color={colors.heroText} size={16} />
      </View>
      <Text style={styles.smallWidgetTitle} numberOfLines={2}>
        {item?.title || snapshot.emptyState.title}
      </Text>
      <Text style={styles.widgetMeta} numberOfLines={1}>
        {item?.courseName || snapshot.emptyState.message}
      </Text>
      <Text style={styles.widgetCountdown}>{item?.dueLabel || "All set"}</Text>
    </View>
  );
}

export function WidgetPreviewMedium({ snapshot }: { snapshot: WidgetSnapshot }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const items = snapshot.surfaces.medium.items;

  return (
    <View style={styles.mediumWidget}>
      <View style={styles.widgetTop}>
        <Text style={styles.widgetLabel}>This Week</Text>
        <Sparkles color={colors.widgetAccent} size={15} />
      </View>
      {items.length === 0 ? (
        <Text style={styles.widgetMeta}>{snapshot.emptyState.message}</Text>
      ) : (
        items.map((item) => (
          <View key={item.assignmentId} style={styles.mediumWidgetRow}>
            <View style={[styles.widgetRowIcon, styles[`${widgetTone(item.urgency)}WidgetIcon`]]}>
              <CalendarClock color={colors.heroText} size={12} />
            </View>
            <View style={styles.widgetRowCopy}>
              <Text style={styles.widgetRowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.widgetRowMeta} numberOfLines={1}>
                {item.courseName}
              </Text>
            </View>
            <Text style={[styles.widgetDue, item.urgency === "today" || item.urgency === "soon" ? styles.widgetDueHot : null]}>
              {item.dueLabel}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

export function LockWidgetPreview({ snapshot }: { snapshot: WidgetSnapshot }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const item = snapshot.surfaces.lockScreen.item;

  return (
    <View style={styles.lockWidget}>
      <View style={styles.lockAuroraOne} />
      <View style={styles.lockAuroraTwo} />
      <Lock color={colors.heroText} size={18} />
      <Text style={styles.lockDate}>Monday, March 10</Text>
      <Text style={styles.lockTime}>9:41</Text>
      <View style={styles.lockNotification}>
        <View style={styles.lockNotificationIcon}>
          <Bell color={colors.heroText} size={14} />
        </View>
        <View style={styles.lockNotificationCopy}>
          <Text style={styles.lockNotificationTitle} numberOfLines={1}>
            {item?.title || "No open deadlines"}
          </Text>
          <Text style={styles.lockNotificationMeta} numberOfLines={1}>
            {item ? `${item.courseName} - ${item.dueLabel}` : snapshot.emptyState.message}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function WidgetShowcase({ snapshot }: { snapshot: WidgetSnapshot }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.widgetShowcase}>
      <View style={styles.widgetHeader}>
        <View>
          <Text style={styles.widgetKicker}>Widgets</Text>
          <Text style={styles.widgetTitle}>Keep deadlines visible.</Text>
        </View>
        <Sparkles color={theme.colors.brandPurple} size={20} />
      </View>
      <View style={styles.widgetGrid}>
        <WidgetPreviewSmall snapshot={snapshot} />
        <WidgetPreviewMedium snapshot={snapshot} />
      </View>
      <LockWidgetPreview snapshot={snapshot} />
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
            <Text style={[styles.dockLabel, active ? styles.dockLabelActive : null]}>
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
  style?: ViewStyle;
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
    <View style={styles.workloadBars}>
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
      <Text style={[styles.progressValue, { color }]}>{value}%</Text>
    </View>
  );
}

function badgeLabel(assignment: Assignment) {
  if (assignment.kind === "exam" || assignment.type === "exam") return "High";
  const days = daysUntil(assignment.dueAt);
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 3) return "Soon";
  return assignment.priority === "high" ? "High" : "Open";
}

function badgeTone(assignment: Assignment): Tone {
  if (assignment.kind === "exam" || assignment.type === "exam" || assignment.priority === "high") return "red";
  const days = daysUntil(assignment.dueAt);
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
      top: -90,
      right: -94,
      width: 190,
      height: 190,
      borderRadius: 95,
      backgroundColor: "rgba(108,92,231,0.10)"
    },
    screenWashBottom: {
      position: "absolute",
      bottom: 160,
      left: -110,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: "rgba(59,130,246,0.08)"
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
      fontSize: 27,
      lineHeight: 33,
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
      shadowOpacity: theme.isDark ? 0.2 : 0.08,
      shadowRadius: 18,
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
      minHeight: 160
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
      color: colors.brandPurple,
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
      fontSize: 19,
      lineHeight: 25,
      fontWeight: "900"
    },
    heroMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700",
      marginTop: 2
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
      backgroundColor: colors.brandPurple,
      shadowColor: colors.brandPurple,
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
      borderRadius: 13,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      justifyContent: "center"
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
      minHeight: 34,
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
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.16 : 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2
    },
    taskRowCompact: {
      minHeight: 66
    },
    taskRowDone: {
      opacity: 0.58
    },
    taskCheck: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center"
    },
    taskMark: {
      width: 35,
      height: 35,
      borderRadius: 11,
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
      gap: 2
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
      borderRadius: radii.round,
      alignItems: "center",
      justifyContent: "center",
      gap: 1,
      backgroundColor: "transparent"
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
      backgroundColor: colors.surface,
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.16 : 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3
    },
    courseCardActive: {
      borderColor: "rgba(108,92,231,0.32)",
      backgroundColor: colors.surface
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
      borderRadius: 20,
      backgroundColor: colors.warningSurface,
      borderWidth: 1,
      borderColor: "rgba(245,158,11,0.28)",
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
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
      gap: spacing.md
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
      backgroundColor: colors.widgetDark,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.10)",
      gap: spacing.xs
    },
    mediumWidget: {
      flex: 1.35,
      minHeight: 172,
      borderRadius: 22,
      padding: spacing.md,
      overflow: "hidden",
      backgroundColor: colors.widgetDark,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.10)",
      gap: 6
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
      backgroundColor: "rgba(255,255,255,0.10)",
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
      minHeight: 34,
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
    lockWidget: {
      minHeight: 258,
      borderRadius: 28,
      overflow: "hidden",
      backgroundColor: colors.lockWidget,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
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
      minHeight: 74,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderRadius: 26,
      borderWidth: 1,
      borderColor: "rgba(148,163,184,0.22)",
      backgroundColor: "rgba(255,255,255,0.94)",
      padding: 6,
      shadowColor: colors.shadow,
      shadowOpacity: 0.16,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 10
    },
    dockButton: {
      flex: 1,
      minHeight: 58,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      gap: 3
    },
    dockButtonActive: {
      backgroundColor: colors.purpleSoft
    },
    dockLabel: {
      color: colors.faint,
      fontSize: 9,
      lineHeight: 12,
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
