import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Circle,
  FileScan,
  Flame,
  Lock,
  Sparkles
} from "lucide-react-native";

import { Assignment, Course, WidgetSnapshot } from "../models";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { daysUntil, formatShortDate } from "../logic/planner";

type Tone = "purple" | "blue" | "green" | "gold" | "red" | "neutral";

type PremiumCardProps = {
  children: React.ReactNode;
  tone?: "plain" | "hero" | "soft";
  style?: object;
};

export function PremiumCard({ children, tone = "plain", style }: PremiumCardProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return <View style={[styles.card, tone === "hero" ? styles.heroCard : null, tone === "soft" ? styles.softCard : null, style]}>{children}</View>;
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.screenHeader}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.screenTitle}>{title}</Text>
      {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function StatChip({
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
    <View style={[styles.statChip, styles[`${tone}Tint`]]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {detail ? <Text style={styles.statDetail}>{detail}</Text> : null}
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
      style={[styles.pill, active ? styles.pillActive : null]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>
        {label}{typeof count === "number" ? ` ${count}` : ""}
      </Text>
    </TouchableOpacity>
  );
}

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={[styles.statusBadge, styles[`${tone}Tint`]]}>
      <View style={[styles.statusDot, styles[`${tone}Dot`]]} />
      <Text style={styles.statusText}>{label}</Text>
    </View>
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
  const styles = createStyles(theme);
  const { colors } = theme;

  return (
    <View style={styles.warningCard}>
      <View style={styles.warningIcon}>
        <Flame color={colors.coral} size={19} />
      </View>
      <View style={styles.warningBody}>
        <Text style={styles.warningTitle}>{title}</Text>
        <Text style={styles.warningMessage}>{message}</Text>
      </View>
      {actionLabel && onPress ? (
        <TouchableOpacity accessibilityRole="button" style={styles.warningButton} onPress={onPress}>
          <Text style={styles.warningButtonText}>{actionLabel}</Text>
          <ChevronRight color={colors.heroText} size={15} />
        </TouchableOpacity>
      ) : null}
    </View>
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
  const dueIn = daysUntil(assignment.dueAt);
  const tone = assignment.type === "exam" ? "red" : dueIn <= 1 ? "gold" : "blue";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.82}
      style={[styles.taskRow, done ? styles.taskRowDone : null, compact ? styles.taskRowCompact : null]}
      onPress={onOpen}
    >
      <TouchableOpacity accessibilityRole="button" style={styles.taskCheck} onPress={onComplete}>
        {done ? <CheckCircle2 color={colors.green} size={20} /> : <Circle color={colors.brandPurple} size={20} />}
      </TouchableOpacity>
      <View style={[styles.taskIcon, { backgroundColor: course?.color || colors.brandPurple }]}>
        <Text style={styles.taskIconText}>{(course?.code || assignment.courseName || "SP").slice(0, 1)}</Text>
      </View>
      <View style={styles.taskBody}>
        <Text style={[styles.taskTitle, done ? styles.doneText : null]} numberOfLines={1}>
          {assignment.title}
        </Text>
        <Text style={styles.taskMeta} numberOfLines={1}>
          {course?.code || assignment.courseName} - Due {formatShortDate(assignment.dueAt)}
        </Text>
      </View>
      {right || <StatusBadge label={badgeLabel(assignment)} tone={tone} />}
    </TouchableOpacity>
  );
}

export function DateStrip({
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
    <View style={styles.dateStrip}>
      {days.map((day) => {
        const [, , dateNumber] = day.date.split("-");
        const active = day.date === activeDate;
        return (
          <TouchableOpacity
            accessibilityRole="button"
            key={day.date}
            style={[styles.datePill, active ? styles.datePillActive : null]}
            onPress={() => onSelect?.(day.date)}
          >
            <Text style={[styles.dateLabel, active ? styles.dateLabelActive : null]}>
              {day.label.slice(0, 1)}
            </Text>
            <Text style={[styles.dateNumber, active ? styles.dateNumberActive : null]}>
              {Number(dateNumber)}
            </Text>
            {day.count > 0 ? <View style={[styles.dateDot, active ? styles.dateDotActive : null]} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function WorkloadBars({ values }: { values: number[] }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const max = Math.max(1, ...values);

  return (
    <View style={styles.workloadBars}>
      {values.map((value, index) => (
        <View key={`${value}-${index}`} style={styles.workloadTrack}>
          <View style={[styles.workloadFill, { height: `${Math.max(8, (value / max) * 54)}%` as `${number}%` }]} />
        </View>
      ))}
    </View>
  );
}

export function CourseSummaryCard({
  course,
  dueThisWeek,
  progress,
  onPress
}: {
  course: Course;
  dueThisWeek: number;
  progress: number;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.82} style={styles.courseSummary} onPress={onPress}>
      <View style={[styles.courseIcon, { backgroundColor: course.color }]}>
        <Text style={styles.courseIconText}>{course.code.slice(0, 1)}</Text>
      </View>
      <View style={styles.courseSummaryBody}>
        <Text style={styles.courseSummaryTitle}>{course.code}</Text>
        <Text style={styles.courseSummarySub} numberOfLines={1}>{course.name}</Text>
        <Text style={styles.courseSummaryMeta}>{dueThisWeek} Due This Week</Text>
      </View>
      <View style={styles.progressBadge}>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
    </TouchableOpacity>
  );
}

export function WidgetPreviewSection({ snapshot }: { snapshot: WidgetSnapshot }) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const mediumItems = snapshot.surfaces.medium.items;

  return (
    <View style={styles.widgetSection}>
      <View style={styles.widgetHeader}>
        <View>
          <Text style={styles.widgetKicker}>Widgets</Text>
          <Text style={styles.widgetTitle}>Keep deadlines visible.</Text>
        </View>
        <Sparkles color={colors.brandPurple} size={20} />
      </View>

      <View style={styles.widgetGrid}>
        <View style={styles.smallWidget}>
          <Text style={styles.widgetLabel}>Next Due</Text>
          <Text style={styles.smallWidgetTitle} numberOfLines={2}>
            {snapshot.nextDue?.title || snapshot.emptyState.title}
          </Text>
          <Text style={styles.widgetMeta}>{snapshot.nextDue?.courseName || snapshot.emptyState.message}</Text>
          {snapshot.nextDue ? <Text style={styles.widgetCountdown}>{snapshot.nextDue.dueLabel}</Text> : null}
        </View>

        <View style={styles.mediumWidget}>
          <Text style={styles.widgetLabel}>This Week</Text>
          {mediumItems.length === 0 ? (
            <Text style={styles.widgetMeta}>{snapshot.emptyState.message}</Text>
          ) : (
            mediumItems.map((item) => (
              <View key={item.assignmentId} style={styles.widgetRow}>
                <CalendarClock color={colors.brandBlue} size={14} />
                <View style={styles.widgetRowText}>
                  <Text style={styles.widgetRowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.widgetRowMeta}>{item.courseName} - {item.dueLabel}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.lockWidget}>
        <Lock color={colors.heroText} size={16} />
        <View style={styles.lockWidgetText}>
          <Text style={styles.lockWidgetDate}>Monday, March 10</Text>
          <Text style={styles.lockWidgetTime}>9:41</Text>
          <View style={styles.lockNotification}>
            <Bell color={colors.heroText} size={15} />
            <Text style={styles.lockNotificationText} numberOfLines={1}>
              {snapshot.nextDue ? `${snapshot.nextDue.title} - ${snapshot.nextDue.dueLabel}` : "No open deadlines"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function ScanCallout({ onPress }: { onPress: () => void }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.82} style={styles.scanCallout} onPress={onPress}>
      <View style={styles.scanIcon}>
        <FileScan color="#FFFFFF" size={18} />
      </View>
      <View style={styles.scanCopy}>
        <Text style={styles.scanTitle}>Scan or upload syllabus</Text>
        <Text style={styles.scanMeta}>Turn deadlines into your semester plan.</Text>
      </View>
      <ChevronRight color="#FFFFFF" size={18} />
    </TouchableOpacity>
  );
}

function badgeLabel(assignment: Assignment) {
  if (assignment.type === "exam") return "High";
  const days = daysUntil(assignment.dueAt);
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days <= 2) return "Soon";
  return assignment.priority === "high" ? "High" : "Open";
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    card: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.18 : 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4
    },
    heroCard: {
      borderColor: "rgba(108,92,231,0.18)",
      backgroundColor: colors.surface
    },
    softCard: {
      backgroundColor: colors.surfaceAlt
    },
    screenHeader: {
      gap: 5,
      marginBottom: spacing.md
    },
    eyebrow: {
      color: colors.brandPurple,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    screenTitle: {
      color: colors.ink,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "900"
    },
    screenSubtitle: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "600"
    },
    statChip: {
      flex: 1,
      minHeight: 72,
      borderRadius: radii.lg,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.line,
      justifyContent: "center"
    },
    statValue: {
      color: colors.ink,
      fontSize: 23,
      lineHeight: 27,
      fontWeight: "900"
    },
    statLabel: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    statDetail: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "700"
    },
    purpleTint: {
      backgroundColor: colors.purpleSoft,
      borderColor: "rgba(108,92,231,0.16)"
    },
    blueTint: {
      backgroundColor: colors.blueSoft,
      borderColor: "rgba(59,130,246,0.16)"
    },
    greenTint: {
      backgroundColor: colors.mint,
      borderColor: "rgba(31,154,107,0.18)"
    },
    goldTint: {
      backgroundColor: colors.softGold,
      borderColor: "rgba(245,158,11,0.22)"
    },
    redTint: {
      backgroundColor: colors.redSoft,
      borderColor: "rgba(239,68,68,0.2)"
    },
    neutralTint: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.line
    },
    purpleDot: { backgroundColor: colors.brandPurple },
    blueDot: { backgroundColor: colors.brandBlue },
    greenDot: { backgroundColor: colors.green },
    goldDot: { backgroundColor: colors.gold },
    redDot: { backgroundColor: colors.red },
    neutralDot: { backgroundColor: colors.faint },
    pill: {
      minHeight: 34,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center"
    },
    pillActive: {
      borderColor: colors.brandPurple,
      backgroundColor: colors.brandPurple
    },
    pillText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900"
    },
    pillTextActive: {
      color: colors.heroText
    },
    statusBadge: {
      minHeight: 28,
      borderRadius: radii.round,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 6
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3
    },
    statusText: {
      color: colors.ink,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    warningCard: {
      borderRadius: radii.xl,
      backgroundColor: colors.warningSurface,
      borderWidth: 1,
      borderColor: "rgba(245,158,11,0.28)",
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    warningIcon: {
      width: 40,
      height: 40,
      borderRadius: radii.lg,
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
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    warningButton: {
      minHeight: 38,
      borderRadius: radii.round,
      backgroundColor: colors.brandCoral,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 2
    },
    warningButtonText: {
      color: colors.heroText,
      fontSize: 12,
      fontWeight: "900"
    },
    taskRow: {
      minHeight: 76,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.14 : 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2
    },
    taskRowCompact: {
      minHeight: 66
    },
    taskRowDone: {
      opacity: 0.62
    },
    taskCheck: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center"
    },
    taskIcon: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center"
    },
    taskIconText: {
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
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    doneText: {
      textDecorationLine: "line-through",
      color: colors.faint
    },
    taskMeta: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    dateStrip: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 6
    },
    datePill: {
      flex: 1,
      minHeight: 54,
      borderRadius: radii.round,
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line
    },
    datePillActive: {
      backgroundColor: colors.brandPurple,
      borderColor: colors.brandPurple
    },
    dateLabel: {
      color: colors.faint,
      fontSize: 10,
      fontWeight: "900"
    },
    dateLabelActive: {
      color: colors.heroText
    },
    dateNumber: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: "900"
    },
    dateNumberActive: {
      color: colors.heroText
    },
    dateDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.brandPurple
    },
    dateDotActive: {
      backgroundColor: colors.heroText
    },
    workloadBars: {
      height: 72,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs
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
    courseSummary: {
      minHeight: 96,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.14 : 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3
    },
    courseIcon: {
      width: 46,
      height: 46,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center"
    },
    courseIconText: {
      color: colors.heroText,
      fontSize: 15,
      fontWeight: "900"
    },
    courseSummaryBody: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    courseSummaryTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    courseSummarySub: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    courseSummaryMeta: {
      color: colors.ink,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    progressBadge: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 3,
      borderColor: colors.brandPurple,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface
    },
    progressText: {
      color: colors.brandPurple,
      fontSize: 12,
      fontWeight: "900"
    },
    widgetSection: {
      gap: spacing.md
    },
    widgetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    widgetKicker: {
      color: colors.brandPurple,
      fontSize: 12,
      fontWeight: "900"
    },
    widgetTitle: {
      color: colors.ink,
      fontSize: 19,
      lineHeight: 25,
      fontWeight: "900"
    },
    widgetGrid: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "stretch"
    },
    smallWidget: {
      flex: 0.9,
      minHeight: 156,
      borderRadius: radii.xl,
      padding: spacing.md,
      backgroundColor: colors.widgetDark,
      gap: spacing.xs
    },
    mediumWidget: {
      flex: 1.25,
      minHeight: 156,
      borderRadius: radii.xl,
      padding: spacing.md,
      backgroundColor: colors.widgetDark,
      gap: spacing.xs
    },
    widgetLabel: {
      color: colors.heroText,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
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
      fontSize: 19,
      lineHeight: 24,
      fontWeight: "900"
    },
    widgetRow: {
      minHeight: 36,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.08)",
      paddingTop: spacing.xs
    },
    widgetRowText: {
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
      lineHeight: 14,
      fontWeight: "700"
    },
    lockWidget: {
      minHeight: 154,
      borderRadius: radii.xl,
      backgroundColor: colors.lockWidget,
      padding: spacing.md,
      alignItems: "center",
      gap: spacing.sm
    },
    lockWidgetText: {
      alignItems: "center",
      gap: spacing.xs,
      width: "100%"
    },
    lockWidgetDate: {
      color: colors.heroText,
      fontSize: 13,
      fontWeight: "800"
    },
    lockWidgetTime: {
      color: colors.heroText,
      fontSize: 52,
      lineHeight: 58,
      fontWeight: "800"
    },
    lockNotification: {
      width: "100%",
      minHeight: 52,
      borderRadius: radii.lg,
      backgroundColor: "rgba(255,255,255,0.16)",
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    lockNotificationText: {
      flex: 1,
      color: colors.heroText,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    scanCallout: {
      minHeight: 68,
      borderRadius: radii.xl,
      padding: spacing.md,
      backgroundColor: colors.brandPurple,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      shadowColor: colors.brandPurple,
      shadowOpacity: 0.22,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 5
    },
    scanIcon: {
      width: 38,
      height: 38,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.18)"
    },
    scanCopy: {
      flex: 1,
      gap: 2
    },
    scanTitle: {
      color: colors.heroText,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    scanMeta: {
      color: "rgba(255,255,255,0.78)",
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "700"
    }
  });
}
