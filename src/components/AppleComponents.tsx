import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  FileScan,
  FlaskConical,
  Globe2,
  Lock,
  Palette,
  PenLine,
  CirclePlus,
  Sparkles,
  Timer,
  TriangleAlert
} from "lucide-react-native";
import { Assignment, Course, WidgetBackground, WidgetLayout, WidgetPalette, WidgetSize, WidgetType } from "../models";
import type { DailyLoad } from "../logic/planner";
import { AppTheme, themePalettes } from "../theme";
import { useAppTheme } from "../themeContext";
import { courseEmoji } from "../utils/courseVisuals";
import { useI18n } from "../i18n";
import { widgetStyleColors } from "../widgets/widgetThemes";
import { ellipsizeWidgetText, resolveWidgetLayoutPlan } from "../widgets/widgetLayoutEngine";
import type { WidgetDisplayState } from "../widgetEngine";

export const emojiMap = {
  study: BookOpen,
  science: FlaskConical,
  writing: PenLine,
  calendar: CalendarDays,
  ai: Sparkles,
  complete: CheckCircle2,
  warning: TriangleAlert,
  focus: Timer,
  streak: Sparkles,
  art: Palette,
  history: Globe2,
  scan: FileScan,
  theme: Palette,
  privacy: Lock,
  pro: Sparkles,
  widget: CalendarDays
} as const;

export type EmojiKey = keyof typeof emojiMap;

type IconProps = {
  color: string;
  size: number;
};

export function AppMark({
  size = 40,
  style
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const ink = theme.isDark ? "#F8FAFC" : "#050505";
  const mutedInk = theme.isDark ? "rgba(248,250,252,0.34)" : "rgba(5,5,5,0.24)";
  const markSize = Math.max(18, Math.round(size * 0.66));

  return (
    <View
      accessibilityLabel="StudyPlanner: Syllabus AI mark"
      accessible
      style={[styles.appMark, { width: size, height: size, borderRadius: size * 0.265 }, style]}
    >
      <Svg width={markSize} height={markSize} viewBox="0 0 64 64">
        <Rect x="15" y="8" width="34" height="48" rx="8" fill="none" stroke={ink} strokeWidth="4.5" />
        <Path d="M38 8v13c0 2.2 1.8 4 4 4h7" fill="none" stroke={ink} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M23 25h11" fill="none" stroke={mutedInk} strokeWidth="4.5" strokeLinecap="round" />
        <Path d="M23.5 37.5l6.8 6.7L42.5 30" fill="none" stroke={ink} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

export function AppLogo({
  size = 40,
  showWordmark = false,
  style
}: {
  size?: number;
  showWordmark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(theme);

  return (
    <View style={[styles.logoWrap, style]}>
      <AppMark size={size} />
      {showWordmark ? (
        <View style={styles.logoCopy}>
          <Text style={styles.logoTitle}>{t("brand_name", "StudyPlanner")}</Text>
          <Text style={styles.logoSubtitle}>{t("brand_subtitle", "Syllabus AI")}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function EmojiAccent({
  name,
  label,
  size = 16,
  decorative = true
}: {
  name: EmojiKey;
  label?: string;
  size?: number;
  decorative?: boolean;
}) {
  const { theme } = useAppTheme();
  const Icon = emojiMap[name] || Sparkles;

  return (
    <View
      accessibilityLabel={decorative ? undefined : label || name}
      accessible={!decorative}
      importantForAccessibility={decorative ? "no" : "auto"}
      style={{ width: Math.ceil(size * 1.25), height: Math.ceil(size * 1.25), alignItems: "center", justifyContent: "center" }}
    >
      <Icon color={theme.colors.accent} size={size} />
    </View>
  );
}

export function EmojiBadge({
  name,
  label,
  tone = "plain"
}: {
  name: EmojiKey;
  label: string;
  tone?: "plain" | "pink" | "violet" | "gold" | "green";
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const toneStyle = {
    plain: styles.plainEmojiBadge,
    pink: styles.pinkEmojiBadge,
    violet: styles.violetEmojiBadge,
    gold: styles.goldEmojiBadge,
    green: styles.greenEmojiBadge
  }[tone];
  return (
    <View style={[styles.emojiBadge, toneStyle]}>
      <EmojiAccent name={name} label={label} decorative={false} />
      <Text style={styles.emojiBadgeText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
        {label}
      </Text>
    </View>
  );
}

export function GlassCard({
  children,
  style,
  tone = "plain"
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: "plain" | "hero" | "soft" | "dark";
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const toneStyle = {
    plain: styles.plainGlassCard,
    hero: styles.heroGlassCard,
    soft: styles.softGlassCard,
    dark: styles.darkGlassCard
  }[tone];
  const darkSurface = tone === "hero" || tone === "dark";
  return (
    <View style={[styles.glassCard, toneStyle, style]}>
      <View pointerEvents="none" style={[styles.liquidGlassHighlight, darkSurface ? styles.liquidGlassHighlightDark : null]} />
      <View pointerEvents="none" style={[styles.liquidGlassInnerGlow, darkSurface ? styles.liquidGlassInnerGlowDark : null]} />
      <View pointerEvents="none" style={[styles.liquidGlassLowerEdge, darkSurface ? styles.liquidGlassLowerEdgeDark : null]} />
      {children}
    </View>
  );
}

export function StatPill({
  label,
  value,
  detail,
  tone = "blue"
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "pink" | "violet" | "blue" | "gold" | "green" | "plain";
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const toneStyle = {
    pink: styles.pinkStatPill,
    violet: styles.violetStatPill,
    blue: styles.blueStatPill,
    gold: styles.goldStatPill,
    green: styles.greenStatPill,
    plain: styles.plainStatPill
  }[tone];
  return (
    <View style={[styles.statPill, toneStyle]}>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.74}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
        {label}
      </Text>
      {detail ? <Text style={styles.statDetail} numberOfLines={1}>{detail}</Text> : null}
    </View>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labelForOption
}: {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  labelForOption?: (value: T) => string;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option === value;
        return (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={option}
            style={[styles.segment, active ? styles.segmentActive : null]}
            onPress={() => onChange(option)}
          >
            <Text
              style={[styles.segmentText, active ? styles.segmentTextActive : null]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              {labelForOption ? labelForOption(option) : labelize(option)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function AssignmentRow({
  assignment,
  course,
  onPress,
  trailing
}: {
  assignment: Assignment;
  course?: Course;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const progress = Math.min(100, Math.max(0, Math.round((assignment.progress || 0) * 100)));
  const content = (
    <>
      <View style={[styles.classTile, { backgroundColor: course?.color || theme.colors.accent }]}>
        <Text style={styles.classTileText}>{courseEmoji(course)}</Text>
      </View>
      <View style={styles.assignmentRowCopy}>
        <Text style={styles.assignmentRowTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
          {assignment.title}
        </Text>
        <Text style={styles.assignmentRowMeta} numberOfLines={1}>
          {course?.code || "Course"} · {labelize(assignment.kind)} · {assignment.estimatedMinutes}m
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` as `${number}%` }]} />
        </View>
      </View>
      {trailing || <ChevronRight color={theme.colors.faint} size={18} />}
    </>
  );

  if (!onPress) {
    return <View style={styles.assignmentRow}>{content}</View>;
  }

  return (
    <TouchableOpacity accessibilityRole="button" style={styles.assignmentRow} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

export function ClassIdentityCard({
  course,
  openCount,
  doneCount,
  onPress
}: {
  course: Course;
  openCount: number;
  doneCount: number;
  onPress?: () => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useI18n();
  const styles = createStyles(theme);
  const content = (
    <>
      <View style={[styles.classLargeIcon, { backgroundColor: course.color }]}>
        <Text style={styles.classLargeInitial}>{courseEmoji(course)}</Text>
      </View>
      <View style={styles.classCardCopy}>
        <Text style={styles.classCardTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>
          {course.code}
        </Text>
        <Text style={styles.classCardMeta} numberOfLines={1}>
          {course.teacher || course.instructor || t("classes.teacher_placeholder", "Teacher")} · {course.period || t("classes.field_period", "Period")}
        </Text>
        <Text style={styles.classCardSubtle} numberOfLines={1}>
          {openCount} {t("classes.open", "open")} · {doneCount} {t("classes.completed", "completed")}
        </Text>
      </View>
      <ChevronRight color={theme.colors.faint} size={18} />
    </>
  );

  if (!onPress) return <View style={styles.classCard}>{content}</View>;

  return (
    <TouchableOpacity accessibilityRole="button" style={styles.classCard} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

type WidgetPreviewItem = Assignment | {
  id: string;
  title: string;
  courseCode?: string;
  courseColor?: string;
  dueLabel?: string;
};

type ComponentTranslate = (key: string, fallback?: string) => string;

export function WidgetPreviewCard({
  title,
  value,
  detail,
  background,
  palette,
  size,
  type,
  course,
  font = "SF Pro",
  layout = "compact",
  iconKey = "calendar",
  items = [],
  nativeMode = false,
  nativeAccentColor,
  nativeBackgroundColor,
  nativeSignalLabel,
  nativeMetricLabel,
  nativeNextLabel,
  nativeTimelineLabel,
  nativeProgress,
  displayState,
  progress,
  progressLabel,
  weekLoad,
  footnote,
  semesterName,
  style
}: {
  title: string;
  value: string;
  detail: string;
  background: WidgetBackground;
  palette: WidgetPalette;
  size: WidgetSize;
  type: WidgetType;
  course?: Course;
  font?: "SF Pro" | "New York" | "Rounded" | "Mono";
  layout?: WidgetLayout;
  iconKey?: string;
  items?: WidgetPreviewItem[];
  nativeMode?: boolean;
  nativeAccentColor?: string;
  nativeBackgroundColor?: string;
  nativeSignalLabel?: string;
  nativeMetricLabel?: string;
  nativeNextLabel?: string;
  nativeTimelineLabel?: string;
  nativeProgress?: number;
  displayState?: WidgetDisplayState;
  progress?: number;
  progressLabel?: string;
  weekLoad?: DailyLoad[];
  footnote?: string;
  semesterName?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const { t, locale } = useI18n();
  const styles = createStyles(theme);
  const paletteColors = themePalettes[palette] || themePalettes.sunset;
  const isTinted = background === "dark" || background === "gradient";
  const isLockRound = size === "lock_round";
  const isLockInline = size === "lock_inline";
  const isLockRect = size === "lock_rect";
  const isLock = isLockRound || isLockInline || isLockRect;
  const isLarge = size === "large";
  const isMedium = size === "medium" || size === "large";
  const labelTone = isTinted ? styles.widgetTextDark : null;
  const layoutPlan = resolveWidgetLayoutPlan({
    widgetType: type,
    size,
    context: nativeMode ? "native" : "studio_preview",
    appearance: background === "light" ? "light" : "dark",
    locale,
    layout,
    background,
    palette,
    itemCount: items.length
  });
  const previewItems = items.slice(0, layoutPlan.maxRows).map((item) => ({
    ...item,
    title: ellipsizeWidgetText(widgetItemTitle(item), layoutPlan.titleMaxChars)
  }));
  const displayTitle = ellipsizeWidgetText(displayState?.headline || title, layoutPlan.subtitleMaxChars);
  const displayValue = ellipsizeWidgetText(displayState?.primaryMetric || value, size === "small" || isLock ? 12 : 18);
  const displayDetail = ellipsizeWidgetText(displayState?.detail || detail, layoutPlan.titleMaxChars);
  const fontStyle = font === "Mono" ? styles.widgetMono : font === "Rounded" ? styles.widgetRounded : null;
  const WidgetIcon = iconForKey(iconKey);
  const statusText = widgetStatusText(type, value, detail, previewItems, t);
  const resolvedWidgetStyle = widgetStyleColors({ background, palette });
  const nativeAccent = displayState?.accent || nativeAccentColor || course?.color || resolvedWidgetStyle.accentColor || theme.colors.accent;
  const nativeBackground = nativeBackgroundColor || resolvedWidgetStyle.backgroundColor;
  const nativeDark = ["#171A20", "#101723", "#0D1422", "#061827", "#070A12", "#05070B"].includes(nativeBackground.toUpperCase());
  const nativeInk = nativeDark ? "#F8FAFC" : "#171A20";
  const nativeMuted = nativeDark ? "#D7DEE9" : "#69707D";
  const nativeQuiet = nativeDark ? "#A8B3C5" : "#8A93A3";
  const nativeSignal = nativeSignalLabel || (previewItems.length > 0 ? t("widget_preview.live_plan", "Live plan") : t("widget_preview.setup", "Setup"));
  const nativeMetric = nativeMetricLabel || statusText;
  const nativeNext = displayState?.actionLabel || nativeNextLabel || footnote || t("widget_snapshot.open_studyplanner", "Open StudyPlanner");
  const nativeTimeline = nativeTimelineLabel || (type === "today" ? t("widget_snapshot.today", "Today") : t("common.next", "Next"));
  const nativeProgressValue = Math.max(0, Math.min(1, nativeProgress ?? progress ?? 0));
  const previewProgressValue = Math.max(0, Math.min(1, progress ?? nativeProgress ?? 0));
  const nativeWeekDots = localizedWeekdayNarrowLabels(locale);
  const realWeekLoad = weekLoad || [];
  const maxWeekLoadScore = Math.max(...realWeekLoad.map((day) => day.score), 1);
  const nativePreviewItems = previewItems;
  const firstNativeItem = nativePreviewItems[0];
  const nativeStripLike = layout === "strip" || layout === "calendar" || type === "week";
  const nativeProgressLike = layout === "progress" || type === "class_focus";
  const nativeWeekTotal = realWeekLoad.reduce((sum, day) => sum + day.items.length, 0);
  const nativePrimaryValue = !isMedium && firstNativeItem && "courseCode" in firstNativeItem && firstNativeItem.courseCode
    ? type === "week" && realWeekLoad.length > 0 ? String(nativeWeekTotal) : firstNativeItem.courseCode
    : displayValue;
  const nativePrimaryDetail = type === "week" && realWeekLoad.length > 0
    ? nativeWeekTotal === 1
      ? t("widget_snapshot.task_this_week", "task this week")
      : t("widget_snapshot.tasks_this_week", "tasks this week")
    : !isMedium && firstNativeItem ? widgetItemTitle(firstNativeItem) : displayDetail;
  const lockRoundValue = firstNativeItem && "courseCode" in firstNativeItem && firstNativeItem.courseCode ? firstNativeItem.courseCode : displayValue;
  const lockRoundLabel = firstNativeItem
    ? (type === "today" ? t("widget_snapshot.do_first", "Do first") : t("common.next", "Next"))
    : type === "today" ? t("widget_snapshot.today", "Today") : t("common.next", "Next");

  if (nativeMode) {
    if (isLockInline) {
      return (
        <View style={[styles.lockInlineWidget, style]}>
          <Text style={[styles.lockInlineText, { color: nativeInk }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
            {nativeSignal}: {displayValue} - {displayDetail}
          </Text>
        </View>
      );
    }

    if (isLockRound) {
      return (
        <View style={[styles.lockRoundWidget, { backgroundColor: nativeAccent }, style]}>
          <Text style={styles.lockRoundValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{lockRoundValue}</Text>
          <Text style={styles.lockRoundLabel} numberOfLines={1}>{lockRoundLabel}</Text>
        </View>
      );
    }

    if (isLockRect) {
      return (
        <View style={[styles.lockRectWidget, { backgroundColor: nativeBackground }, style]}>
          <Text style={[styles.lockRectKicker, { color: nativeAccent }]} numberOfLines={1}>{displayTitle} / {nativeSignal}</Text>
          <Text style={[styles.lockRectTitle, { color: nativeInk }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
            {displayValue} {displayDetail}
          </Text>
          <Text style={[styles.lockRectDetail, { color: nativeMuted }]} numberOfLines={1}>
            {previewItems[0] ? widgetItemLabel(previewItems[0]) : nativeNext}
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.widget,
          isLarge ? styles.widgetLarge : isMedium ? styles.widgetMedium : styles.widgetSmall,
          styles.nativeWidget,
          {
            backgroundColor: nativeDark ? "#07162D" : nativeBackground,
            width: layoutPlan.availableWidth,
            height: layoutPlan.availableHeight,
            padding: layoutPlan.safePadding
          },
          style
        ]}
      >
        <View pointerEvents="none" style={[styles.nativeWidgetGlassWash, { backgroundColor: nativeDark ? "rgba(116,196,255,0.18)" : "rgba(255,255,255,0.62)" }]} />
        <View pointerEvents="none" style={[styles.nativeWidgetBottomLens, { borderColor: nativeDark ? "rgba(255,255,255,0.22)" : "rgba(17,24,39,0.08)" }]} />
        <View pointerEvents="none" style={[styles.nativeWidgetAccent, { backgroundColor: nativeAccent }]} />
        <View style={styles.nativeWidgetTop}>
          <View style={styles.nativeWidgetHeading}>
            <Text style={styles.nativeWidgetBrand} numberOfLines={1}>StudyPlanner</Text>
            <Text style={[styles.nativeWidgetKicker, { color: nativeAccent }]} numberOfLines={1}>{nativeSignal}</Text>
          </View>
          <View style={[styles.nativeWidgetSignalPill, { backgroundColor: nativeDark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.74)" }]}>
            <Text style={[styles.nativeWidgetSignalText, { color: nativeAccent }]} numberOfLines={1}>{nativeTimeline}</Text>
          </View>
        </View>
        <View style={styles.nativeWidgetMainRow}>
          <View style={styles.nativeWidgetPrimaryCopy}>
            <Text style={[styles.nativeWidgetValue, { color: nativeInk }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{nativePrimaryValue}</Text>
            <Text
              style={[styles.nativeWidgetDetail, { color: nativeInk }]}
              numberOfLines={layoutPlan.maxTitleLines}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {nativePrimaryDetail}
            </Text>
          </View>
          {isMedium && layoutPlan.ctaVisible ? (
            <View style={[styles.nativeWidgetNextBox, { backgroundColor: nativeDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.72)" }]}>
              <Text style={[styles.nativeWidgetNextKicker, { color: nativeQuiet }]} numberOfLines={1}>{t("widget_preview.next_caps", "NEXT")}</Text>
              <Text style={[styles.nativeWidgetNextText, { color: nativeInk }]} numberOfLines={2}>{nativeNext}</Text>
            </View>
          ) : null}
        </View>
        {layoutPlan.weekRailVisible && !nativeProgressLike ? (
          <View style={[styles.nativeWidgetWeekRail, { backgroundColor: nativeDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.72)" }]}>
            {nativeWeekDots.map((label, index) => {
              const active = nativeProgressValue >= (index + 1) / nativeWeekDots.length;
              return (
                <View key={`${label}-${index}`} style={styles.nativeWidgetWeekDotWrap}>
                  <View style={[styles.nativeWidgetWeekDot, { backgroundColor: active ? nativeAccent : nativeDark ? "#263245" : "#E7EAF0" }]} />
                  <Text style={[styles.nativeWidgetWeekLabel, { color: nativeQuiet }]}>{label}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
        {layoutPlan.progressVisible ? (
          <View style={styles.nativeWidgetProgressRow}>
            <Text style={[styles.nativeWidgetMetric, { color: nativeQuiet }]} numberOfLines={1}>{nativeMetric}</Text>
            <View style={styles.nativeWidgetProgressDots}>
              {[0, 1, 2, 3, 4].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.nativeWidgetProgressDot,
                    { backgroundColor: nativeProgressValue >= (index + 1) / 5 ? nativeAccent : nativeDark ? "#2A303B" : "#E7EAF0" }
                  ]}
                />
              ))}
            </View>
          </View>
        ) : null}
        {nativeProgressLike ? (
          <View style={styles.nativeWidgetProgressSummary}>
            <Text style={[styles.nativeWidgetProgressTitle, { color: nativeInk }]} numberOfLines={1}>
              {progressLabel || nativeMetric}
            </Text>
            <Text style={[styles.nativeWidgetProgressCopy, { color: nativeMuted }]} numberOfLines={1}>
              {nativeNext}
            </Text>
          </View>
        ) : nativePreviewItems.length > 0 && !nativeStripLike ? (
          <View style={styles.nativeWidgetList}>
            {nativePreviewItems.map((item) => (
              <View key={item.id} style={styles.nativeWidgetRow}>
                <View style={[styles.nativeWidgetMiniDot, { backgroundColor: widgetItemColor(item, course, nativeAccent) }]} />
                <Text style={[styles.nativeWidgetRowCourse, { color: widgetItemColor(item, course, nativeAccent) }]} numberOfLines={1}>
                  {widgetItemCourse(item, t)}
                </Text>
                <Text style={[styles.nativeWidgetRowText, { color: nativeInk }]} numberOfLines={1}>
                  {widgetItemTitle(item)}
                </Text>
                <Text style={[styles.nativeWidgetRowDue, { color: nativeMuted }]} numberOfLines={1}>
                  {widgetItemDue(item, nativeTimeline)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.nativeWidgetFootnote, { color: nativeMuted }]} numberOfLines={2}>
            {footnote || nativeNext || t("widget_preview.open_studyplanner_add_homework", "Open StudyPlanner to add homework.")}
          </Text>
        )}
        {layoutPlan.footerVisible ? (
          <Text style={[styles.nativeWidgetFooter, { color: nativeQuiet }]} numberOfLines={1}>
            {previewItems.length > 0
              ? footnote || t("widget_preview.planner_data", "Planner data")
              : semesterName || t("widget_preview.current_semester", "Current semester")}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
          styles.widget,
        isLock ? styles.widgetSmall : isLarge ? styles.widgetLarge : isMedium ? styles.widgetMedium : styles.widgetSmall,
        background === "solid" ? styles.widgetSolid : null,
        background === "light" ? styles.widgetLight : null,
        background === "glass" ? styles.widgetGlass : null,
        background === "dark" ? styles.widgetDark : null,
        background === "gradient" ? { backgroundColor: paletteColors[0] } : null,
        {
          width: layoutPlan.availableWidth,
          height: layoutPlan.availableHeight,
          padding: layoutPlan.safePadding
        },
        style
      ]}
    >
      <View style={[styles.widgetBackplate, { borderColor: paletteColors[1] }]} />
      <View style={[styles.widgetAura, { backgroundColor: paletteColors[1] }]} />
      <View style={[styles.widgetSheen, { backgroundColor: paletteColors[2] || paletteColors[1] }]} />
      <View style={styles.widgetLiquidFace} />
      <View style={styles.widgetGridTexture} />
      <View style={[styles.widgetAccentRail, { backgroundColor: paletteColors[1] }]} />
      {background === "gradient" ? (
        <View style={[styles.widgetGlow, { backgroundColor: paletteColors[1] }]} />
      ) : null}
      <View style={styles.widgetTop}>
        <Text style={[styles.widgetLabel, labelTone, fontStyle]} numberOfLines={1}>{displayTitle}</Text>
        <View style={[styles.widgetStatusCapsule, isTinted ? styles.widgetStatusCapsuleTinted : null]}>
          <Text style={[styles.widgetTiny, labelTone]} numberOfLines={1}>{statusText}</Text>
        </View>
      </View>
      <View style={styles.widgetMainRow}>
        <View style={styles.widgetCopy}>
          <Text style={[styles.widgetValue, labelTone, fontStyle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{displayValue}</Text>
          <Text style={[styles.widgetDetail, labelTone]} numberOfLines={layoutPlan.maxTitleLines}>
            {displayDetail}
          </Text>
        </View>
        {layoutPlan.iconVisible ? (
          <View style={[styles.widgetIconOrb, { backgroundColor: paletteColors[2] || paletteColors[1] }]}>
          <WidgetIcon color="#FFFFFF" size={17} />
          </View>
        ) : null}
      </View>
      {layout === "list" || layout === "timeline" || layout === "next_task" || type === "today" || type === "needs_check" || type === "class_focus" || type === "focus" ? (
        <View style={styles.widgetMiniList}>
          {previewItems.map((item) => (
            <View key={item.id} style={styles.widgetMiniRow}>
              <View style={[styles.widgetMiniDot, { backgroundColor: widgetItemColor(item, course, paletteColors[1] || theme.colors.accent) }]} />
              <Text style={[styles.widgetMiniText, labelTone]} numberOfLines={1}>
                {widgetItemLabel(item)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {layout === "ring" || layout === "progress" || type === "focus" || type === "streak" ? (
        <View style={[styles.widgetRing, { borderColor: paletteColors[1] || theme.colors.accent }]}>
          <Text style={[styles.widgetRingText, labelTone]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.66}>
            {type === "focus" ? displayValue : progressLabel || displayValue}
          </Text>
        </View>
      ) : null}
      {layout === "calendar" || layout === "strip" || type === "week" ? (
        <View style={styles.widgetBars}>
          {realWeekLoad.map((day, index) => {
            const height = day.score / maxWeekLoadScore;
            return (
            <View key={day.dateKey} style={styles.widgetBarWrap}>
              <View
                style={[
                  styles.widgetBar,
                  { height: 12 + height * 34, backgroundColor: paletteColors[index % paletteColors.length] }
                ]}
              />
              <Text style={[styles.widgetBarLabel, labelTone]}>{day.items.length}</Text>
            </View>
          );
          })}
        </View>
      ) : null}
      {(layout === "grid" || layout === "summary") && type !== "class_focus" ? (
        <View style={styles.widgetGridDots}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.widgetGridDot,
                { backgroundColor: previewProgressValue >= (index + 1) / 4 ? paletteColors[1] : theme.isDark ? "#2A303B" : "#E7EAF0" }
              ]}
            />
          ))}
        </View>
      ) : null}
      {course ? (
        <View style={styles.widgetCourseRow}>
          <View style={[styles.widgetDot, { backgroundColor: course.color }]} />
          <Text style={[styles.widgetTiny, labelTone]}>
            {course.code}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function widgetStatusText(
  type: WidgetType,
  value: string,
  detail: string,
  items: WidgetPreviewItem[],
  t: ComponentTranslate
) {
  if (items.length === 0) return t("widget_preview.preview", "Preview");
  if (type === "due_next") return value || t("common.next", "Next");
  if (type === "today") {
    return items.length === 1
      ? t("widget_preview.one_task", "1 task")
      : formatComponentTemplate(t("widget_preview.task_count", "{count} tasks"), { count: items.length });
  }
  if (type === "focus") return value || t("widget_preview.focus_next", "Focus next");
  if (type === "class_focus") return t("widget_snapshot.class", "Class");
  if (type === "needs_check") return t("widget_snapshot.review", "Review");
  if (type === "week") return t("widget_preview.week_label", "Week");
  return detail || t("widget_preview.planner_label", "Planner");
}

function widgetItemColor(item: WidgetPreviewItem, course: Course | undefined, fallback: string) {
  return "courseColor" in item && item.courseColor ? item.courseColor : course?.color || fallback;
}

function widgetItemLabel(item: WidgetPreviewItem) {
  if ("courseCode" in item && item.courseCode) {
    return item.dueLabel ? `${item.courseCode} - ${item.title} - ${item.dueLabel}` : `${item.courseCode} - ${item.title}`;
  }

  return item.title;
}

function widgetItemCourse(item: WidgetPreviewItem, t: ComponentTranslate) {
  return "courseCode" in item && item.courseCode ? item.courseCode : t("widget_snapshot.class", "Class");
}

function widgetItemTitle(item: WidgetPreviewItem) {
  return item.title;
}

function widgetItemDue(item: WidgetPreviewItem, fallback: string) {
  return "dueLabel" in item && item.dueLabel ? item.dueLabel : fallback;
}

function localizedWeekdayNarrowLabels(locale: string) {
  const mondayUtc = Date.UTC(2026, 0, 5);
  try {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" });
    return Array.from({ length: 7 }, (_value, index) =>
      formatter.format(new Date(mondayUtc + index * 24 * 60 * 60 * 1000))
    );
  } catch {
    return ["M", "T", "W", "T", "F", "S", "S"];
  }
}

function formatComponentTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template
  );
}

export function ThemeCard({
  name,
  palette,
  selected,
  onPress
}: {
  name: string;
  palette: WidgetPalette | "custom";
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const colors = palette === "custom" ? ["#F8FAFC", "#2F80ED", "#35F2D0", "#A3E635"] : themePalettes[palette];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.themeCard, selected ? styles.themeCardSelected : null]}
      onPress={onPress}
    >
      <View style={[styles.themeHero, { backgroundColor: colors[0] }]}>
        {palette === "custom" ? (
          <CirclePlus color={theme.colors.accent} size={18} />
        ) : (
          <View style={[styles.themeHeroGlow, { backgroundColor: colors[1] }]} />
        )}
      </View>
      <View style={styles.themeDots}>
        {colors.map((color) => (
          <View key={color} style={[styles.themeDot, { backgroundColor: color }]} />
        ))}
      </View>
      <View style={styles.themeFooter}>
        <Text style={styles.themeName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{name}</Text>
        {selected ? <Check color={theme.colors.accent} size={15} /> : null}
      </View>
    </TouchableOpacity>
  );
}

export function SettingsRow({
  icon: Icon,
  title,
  value,
  onPress
}: {
  icon: React.ComponentType<IconProps>;
  title: string;
  value?: string;
  onPress?: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const content = (
    <>
      <View style={styles.settingsIcon}>
        <Icon color={theme.colors.accent} size={18} />
      </View>
      <Text style={styles.settingsTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>{title}</Text>
      {value ? <Text style={styles.settingsValue} numberOfLines={1}>{value}</Text> : null}
      <ChevronRight color={theme.colors.faint} size={17} />
    </>
  );

  if (!onPress) return <View style={styles.settingsRow}>{content}</View>;
  return (
    <TouchableOpacity accessibilityRole="button" style={styles.settingsRow} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

export function EmptyState({
  title,
  copy,
  emoji = "complete",
  tone = "plain"
}: {
  title: string;
  copy: string;
  emoji?: EmojiKey;
  tone?: "plain" | "loading" | "error" | "permission" | "review";
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const toneStyle = {
    plain: styles.emptyStatePlain,
    loading: styles.emptyStateLoading,
    error: styles.emptyStateError,
    permission: styles.emptyStatePermission,
    review: styles.emptyStateReview
  }[tone];
  const iconToneStyle = {
    plain: styles.emptyIconPlain,
    loading: styles.emptyIconLoading,
    error: styles.emptyIconError,
    permission: styles.emptyIconPermission,
    review: styles.emptyIconReview
  }[tone];
  return (
    <View style={[styles.emptyState, toneStyle]}>
      <View style={[styles.emptyIcon, iconToneStyle]}>
        <AppMark size={34} />
      </View>
      <Text style={styles.emptyTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.84}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
  );
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function iconForKey(value: string) {
  const map: Record<string, React.ComponentType<IconProps>> = {
    book: BookOpen,
    calendar: CalendarDays,
    flask: FlaskConical,
    pen: PenLine,
    spark: Sparkles,
    check: CheckCircle2,
    timer: Timer,
    palette: Palette
  };
  return map[value] || CalendarDays;
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    logoWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    appMark: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.07)" : "#FFFFFF",
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(5,5,5,0.08)",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.16 : 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 }
    },
    logoCopy: {
      gap: 1
    },
    logoTitle: {
      color: colors.ink,
      fontSize: 20,
      lineHeight: 24,
      fontWeight: "900"
    },
    logoSubtitle: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      letterSpacing: 0
    },
    emojiBadge: {
      minHeight: 34,
      borderRadius: radii.round,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1
    },
    plainEmojiBadge: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.line
    },
    pinkEmojiBadge: {
      backgroundColor: theme.isDark ? "#35162B" : "#FFE6F3",
      borderColor: theme.isDark ? "#703159" : "#FFC4E1"
    },
    violetEmojiBadge: {
      backgroundColor: colors.accentSoft,
      borderColor: theme.isDark ? "#51447A" : "#D9D0FF"
    },
    goldEmojiBadge: {
      backgroundColor: colors.softGold,
      borderColor: theme.isDark ? "#5B4618" : "#F2D58A"
    },
    greenEmojiBadge: {
      backgroundColor: colors.mint,
      borderColor: theme.isDark ? "#1D5A3D" : "#BEEBD6"
    },
    emojiBadgeText: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    glassCard: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.82)",
      padding: spacing.md,
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.36 : 0.13,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 16 },
      elevation: 4
    },
    liquidGlassHighlight: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "46%",
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.085)" : "rgba(255,255,255,0.56)",
      opacity: 0.92
    },
    liquidGlassHighlightDark: {
      backgroundColor: "rgba(255,255,255,0.10)"
    },
    liquidGlassInnerGlow: {
      position: "absolute",
      right: 12,
      top: 10,
      width: "58%",
      height: 28,
      borderRadius: radii.round,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.085)" : "rgba(255,255,255,0.50)",
      opacity: 0
    },
    liquidGlassInnerGlowDark: {
      backgroundColor: "rgba(255,255,255,0.08)"
    },
    liquidGlassLowerEdge: {
      position: "absolute",
      left: 14,
      right: 14,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.18)" : "rgba(17,24,39,0.08)"
    },
    liquidGlassLowerEdgeDark: {
      backgroundColor: "rgba(255,255,255,0.16)"
    },
    plainGlassCard: {
      backgroundColor: theme.isDark ? "rgba(18,25,42,0.76)" : "rgba(255,255,255,0.80)"
    },
    heroGlassCard: {
      backgroundColor: theme.isDark ? "rgba(8,12,22,0.92)" : "rgba(17,24,26,0.93)",
      borderColor: theme.isDark ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.28)"
    },
    softGlassCard: {
      backgroundColor: theme.isDark ? "rgba(16,54,55,0.58)" : "rgba(232,244,240,0.82)"
    },
    darkGlassCard: {
      backgroundColor: "rgba(9,13,23,0.90)",
      borderColor: "rgba(255,255,255,0.20)"
    },
    statPill: {
      flex: 1,
      minHeight: 78,
      borderRadius: radii.md,
      padding: spacing.sm,
      borderWidth: 1,
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.14 : 0.05,
      shadowRadius: 9,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2
    },
    plainStatPill: {
      backgroundColor: colors.surface,
      borderColor: colors.line
    },
    pinkStatPill: {
      backgroundColor: theme.isDark ? "#35162B" : "#FFE8F3",
      borderColor: theme.isDark ? "#71325B" : "#FFC9E3"
    },
    violetStatPill: {
      backgroundColor: colors.accentSoft,
      borderColor: theme.isDark ? "#51447A" : "#DCD4FF"
    },
    blueStatPill: {
      backgroundColor: theme.isDark ? "#17243F" : "#E8F0FF",
      borderColor: theme.isDark ? "#324A77" : "#C9D9FF"
    },
    goldStatPill: {
      backgroundColor: colors.softGold,
      borderColor: theme.isDark ? "#5B4618" : "#F1D991"
    },
    greenStatPill: {
      backgroundColor: colors.mint,
      borderColor: theme.isDark ? "#1D5A3D" : "#BFEBD4"
    },
    statValue: {
      color: colors.ink,
      fontSize: 26,
      lineHeight: 31,
      fontWeight: "900"
    },
    statLabel: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "900"
    },
    statDetail: {
      color: colors.faint,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    segmented: {
      minHeight: 40,
      flexDirection: "row",
      borderRadius: radii.lg,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.055)" : colors.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.72)",
      padding: 4,
      gap: 4
    },
    segment: {
      flex: 1,
      minWidth: 0,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xs
    },
    segmentActive: {
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.12)" : colors.surface,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.16 : 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 }
    },
    segmentText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    segmentTextActive: {
      color: colors.ink
    },
    assignmentRow: {
      minHeight: 74,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.12)" : colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.045)" : colors.surface,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.14 : 0.04,
      shadowRadius: 9,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2
    },
    classTile: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOpacity: 0.14,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 5 }
    },
    classTileText: {
      color: "#FFFFFF",
      fontSize: 16,
      lineHeight: 20,
      fontWeight: "900"
    },
    assignmentRowCopy: {
      flex: 1,
      minWidth: 0,
      gap: 3
    },
    assignmentRowTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900",
      letterSpacing: 0
    },
    assignmentRowMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    progressTrack: {
      height: 5,
      borderRadius: radii.round,
      backgroundColor: colors.surfaceAlt,
      overflow: "hidden"
    },
    progressFill: {
      height: "100%",
      borderRadius: radii.round,
      backgroundColor: colors.accent
    },
    classCard: {
      minHeight: 72,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.12 : 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 1
    },
    classLargeIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOpacity: 0.14,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 5 }
    },
    classLargeInitial: {
      color: "#FFFFFF",
      fontSize: 17,
      lineHeight: 21,
      fontWeight: "900"
    },
    classCardCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    classCardTitle: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    classCardMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    classCardSubtle: {
      color: colors.faint,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    widget: {
      borderRadius: 26,
      padding: spacing.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.90)",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.54 : 0.18,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 18 },
      elevation: 5
    },
    widgetSmall: {
      width: 158,
      minHeight: 158
    },
    widgetMedium: {
      width: 252,
      minHeight: 126
    },
    widgetLarge: {
      width: 292,
      minHeight: 164
    },
    widgetSolid: {
      backgroundColor: theme.isDark ? "#111827" : "#FFFDF4"
    },
    widgetLight: {
      backgroundColor: "#F8FAFC",
      borderColor: "rgba(15,23,42,0.08)"
    },
    widgetGlass: {
      backgroundColor: theme.isDark ? "rgba(7,22,45,0.90)" : "rgba(255,255,255,0.78)",
      borderColor: theme.isDark ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.94)"
    },
    widgetDark: {
      backgroundColor: "#07162D",
      borderColor: "rgba(143,205,255,0.30)"
    },
    nativeWidget: {
      borderRadius: 26,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.34)" : "rgba(255,255,255,0.92)",
      shadowColor: "#020714",
      shadowOpacity: theme.isDark ? 0.58 : 0.16,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: 18 },
      gap: 4
    },
    nativeWidgetGlassWash: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "50%",
      opacity: 0.96
    },
    nativeWidgetBottomLens: {
      position: "absolute",
      right: -30,
      bottom: -30,
      width: 142,
      height: 92,
      borderRadius: 34,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: "rgba(255,255,255,0.055)",
      transform: [{ rotate: "-8deg" }]
    },
    nativeWidgetAccent: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: 4,
      opacity: 0.88
    },
    lockInlineWidget: {
      width: 220,
      minHeight: 28,
      justifyContent: "center",
      paddingHorizontal: spacing.xs
    },
    lockInlineText: {
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    lockRoundWidget: {
      width: 68,
      height: 68,
      borderRadius: 34,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.42)"
    },
    lockRoundValue: {
      color: "#FFFFFF",
      fontSize: 18,
      lineHeight: 22,
      fontWeight: "900",
      fontVariant: ["tabular-nums"]
    },
    lockRoundLabel: {
      color: "#FFFFFF",
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "900"
    },
    lockRectWidget: {
      width: 176,
      minHeight: 72,
      borderRadius: 18,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.18)" : "rgba(18,20,23,0.08)",
      gap: 1
    },
    lockRectKicker: {
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    lockRectTitle: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900"
    },
    lockRectDetail: {
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "800"
    },
    nativeWidgetTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    nativeWidgetHeading: {
      flex: 1,
      minWidth: 0
    },
    nativeWidgetBrand: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    nativeWidgetKicker: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    nativeWidgetDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      opacity: 0.95
    },
    nativeWidgetSignalPill: {
      minHeight: 24,
      borderRadius: 13,
      paddingHorizontal: 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.76)"
    },
    nativeWidgetSignalText: {
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    nativeWidgetMainRow: {
      marginTop: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    nativeWidgetPrimaryCopy: {
      flex: 1,
      minWidth: 0
    },
    nativeWidgetValue: {
      color: "#171A20",
      fontSize: 34,
      lineHeight: 38,
      fontWeight: "900",
      fontVariant: ["tabular-nums"]
    },
    nativeWidgetDetail: {
      color: "#171A20",
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    nativeWidgetNextBox: {
      width: 88,
      borderRadius: 18,
      paddingHorizontal: 8,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.68)",
      gap: 2
    },
    nativeWidgetNextKicker: {
      fontSize: 8,
      lineHeight: 11,
      fontWeight: "900"
    },
    nativeWidgetNextText: {
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    nativeWidgetWeekRail: {
      marginTop: spacing.xs,
      borderRadius: 16,
      paddingHorizontal: 9,
      paddingVertical: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.12)" : "rgba(17,24,39,0.06)"
    },
    nativeWidgetWeekDotWrap: {
      alignItems: "center",
      gap: 2
    },
    nativeWidgetWeekDot: {
      width: 6,
      height: 6,
      borderRadius: 3
    },
    nativeWidgetWeekLabel: {
      fontSize: 7,
      lineHeight: 9,
      fontWeight: "900"
    },
    nativeWidgetMetric: {
      flex: 1,
      minWidth: 0,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    nativeWidgetProgressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6
    },
    nativeWidgetProgressDots: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3
    },
    nativeWidgetProgressDot: {
      width: 5,
      height: 5,
      borderRadius: 3
    },
    nativeWidgetList: {
      marginTop: 2,
      gap: 3
    },
    nativeWidgetRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6
    },
    nativeWidgetMiniDot: {
      width: 6,
      height: 6,
      borderRadius: 3
    },
    nativeWidgetRowCourse: {
      width: 48,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "900"
    },
    nativeWidgetRowText: {
      flex: 1,
      color: "#69707D",
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "800"
    },
    nativeWidgetRowDue: {
      maxWidth: 50,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "800"
    },
    nativeWidgetFootnote: {
      marginTop: spacing.xs,
      color: "#69707D",
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    nativeWidgetFooter: {
      marginTop: "auto",
      color: "#8A93A3",
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "800"
    },
    nativeWidgetProgressSummary: {
      marginTop: 2,
      gap: 2
    },
    nativeWidgetProgressTitle: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    nativeWidgetProgressCopy: {
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "800"
    },
    widgetBackplate: {
      position: "absolute",
      left: 9,
      right: 9,
      bottom: -7,
      height: 22,
      borderRadius: 18,
      borderWidth: 1,
      opacity: 0.30
    },
    widgetAura: {
      position: "absolute",
      right: -40,
      top: 10,
      width: 154,
      height: 82,
      borderRadius: 36,
      opacity: theme.isDark ? 0.38 : 0.20,
      transform: [{ rotate: "-12deg" }]
    },
    widgetSheen: {
      position: "absolute",
      left: -30,
      bottom: 14,
      width: 138,
      height: 42,
      borderRadius: 24,
      opacity: theme.isDark ? 0.24 : 0.18,
      transform: [{ rotate: "-18deg" }]
    },
    widgetLiquidFace: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "50%",
      backgroundColor: theme.isDark ? "rgba(116,196,255,0.16)" : "rgba(255,255,255,0.54)"
    },
    widgetGridTexture: {
      position: "absolute",
      right: 14,
      top: 38,
      width: 74,
      height: 74,
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.24)",
      backgroundColor: "rgba(255,255,255,0.055)",
      transform: [{ rotate: "8deg" }]
    },
    widgetAccentRail: {
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      width: 5,
      opacity: 0.86
    },
    widgetGlow: {
      position: "absolute",
      right: -40,
      bottom: -54,
      width: 132,
      height: 132,
      borderRadius: 66,
      opacity: 0.48
    },
    widgetTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm
    },
    widgetLabel: {
      flex: 1,
      color: colors.ink,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      letterSpacing: 0.6,
      textTransform: "uppercase"
    },
    widgetStatusCapsule: {
      minHeight: 22,
      borderRadius: 11,
      paddingHorizontal: 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.72)",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.64)"
    },
    widgetStatusCapsuleTinted: {
      backgroundColor: "rgba(255,255,255,0.20)"
    },
    widgetTiny: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
    },
    widgetValue: {
      marginTop: spacing.xs,
      color: colors.ink,
      fontSize: 32,
      lineHeight: 37,
      fontWeight: "900",
      letterSpacing: 0
    },
    widgetDetail: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800",
      opacity: 0.86
    },
    widgetMainRow: {
      marginTop: spacing.xs,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm
    },
    widgetCopy: {
      flex: 1,
      minWidth: 0
    },
    widgetIconOrb: {
      width: 34,
      height: 34,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      opacity: 0.96,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.55)",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.30 : 0.14,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 }
    },
    widgetMono: {
      fontVariant: ["tabular-nums"]
    },
    widgetRounded: {
      letterSpacing: 0
    },
    widgetTextDark: {
      color: "#FFFFFF"
    },
    widgetMiniList: {
      marginTop: spacing.xs,
      gap: 4
    },
    widgetMiniRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5
    },
    widgetMiniDot: {
      width: 5,
      height: 5,
      borderRadius: 3
    },
    widgetMiniText: {
      flex: 1,
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "800"
    },
    widgetRing: {
      marginTop: spacing.xs,
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 5,
      alignItems: "center",
      justifyContent: "center"
    },
    widgetRingText: {
      color: colors.ink,
      fontSize: 16,
      fontWeight: "900"
    },
    widgetBars: {
      marginTop: spacing.xs,
      height: 54,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 5
    },
    widgetBarWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-end"
    },
    widgetBar: {
      width: "78%",
      borderRadius: 5,
      opacity: 0.92
    },
    widgetBarLabel: {
      marginTop: 3,
      color: colors.faint,
      fontSize: 8,
      lineHeight: 10,
      fontWeight: "900",
      textAlign: "center"
    },
    widgetGridDots: {
      marginTop: spacing.xs,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5
    },
    widgetGridDot: {
      width: 20,
      height: 20,
      borderRadius: 7
    },
    widgetCourseRow: {
      marginTop: "auto",
      flexDirection: "row",
      alignItems: "center",
      gap: 5
    },
    widgetDot: {
      width: 7,
      height: 7,
      borderRadius: 4
    },
    themeCard: {
      width: 116,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.xs,
      gap: spacing.xs
    },
    themeCardSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    themeHero: {
      height: 72,
      borderRadius: radii.md,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center"
    },
    themeHeroGlow: {
      width: 86,
      height: 86,
      borderRadius: 43,
      opacity: 0.72,
      transform: [{ translateX: 24 }, { translateY: 24 }]
    },
    themeDots: {
      flexDirection: "row",
      gap: 4
    },
    themeDot: {
      flex: 1,
      height: 10,
      borderRadius: 5
    },
    themeFooter: {
      minHeight: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs
    },
    themeName: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    settingsRow: {
      minHeight: 62,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    settingsIcon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center"
    },
    settingsTitle: {
      flex: 1,
      minWidth: 0,
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    settingsValue: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    emptyState: {
      borderRadius: radii.xl,
      borderWidth: 1,
      padding: spacing.lg,
      alignItems: "center",
      gap: spacing.xs
    },
    emptyStatePlain: {
      borderColor: colors.line,
      backgroundColor: colors.surface
    },
    emptyStateLoading: {
      borderColor: theme.isDark ? "#334155" : "#CBD5E1",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.045)" : "#F8FAFC"
    },
    emptyStateError: {
      borderColor: theme.isDark ? "#6B322A" : "#F3B7A9",
      backgroundColor: theme.isDark ? "#231415" : "#FFF7F5"
    },
    emptyStatePermission: {
      borderColor: theme.isDark ? "#35517F" : "#C8D7FF",
      backgroundColor: theme.isDark ? "#111B2F" : "#F4F7FF"
    },
    emptyStateReview: {
      borderColor: theme.isDark ? "#6A541C" : "#EBCB72",
      backgroundColor: theme.isDark ? "#241D0C" : "#FFFBEB"
    },
    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xs
    },
    emptyIconPlain: {
      backgroundColor: colors.accentSoft
    },
    emptyIconLoading: {
      backgroundColor: theme.isDark ? "#1E293B" : "#E2E8F0"
    },
    emptyIconError: {
      backgroundColor: theme.isDark ? "#3A201D" : "#FFE0D8"
    },
    emptyIconPermission: {
      backgroundColor: theme.isDark ? "#1B2844" : "#E3ECFF"
    },
    emptyIconReview: {
      backgroundColor: colors.softGold
    },
    emptyTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "900",
      textAlign: "center"
    },
    emptyCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      textAlign: "center",
      fontWeight: "700"
    }
  });
}
