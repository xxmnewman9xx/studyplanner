import React from "react";
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
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
  Plus,
  Sparkles,
  Timer,
  TriangleAlert
} from "lucide-react-native";
import { Assignment, Course, WidgetBackground, WidgetPalette, WidgetSize, WidgetType } from "../models";
import type { DailyLoad } from "../logic/planner";
import { AppTheme, themePalettes } from "../theme";
import { useAppTheme } from "../themeContext";
import { courseEmoji } from "../utils/courseVisuals";
import { useI18n } from "../i18n";

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
      <Image
        accessibilityLabel="StudyPlanner mark"
        source={require("../../assets/app/study-planner-icon.png")}
        style={[styles.logoImage as ImageStyle, { width: size, height: size, borderRadius: size * 0.24 } as ImageStyle]}
      />
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
  return (
    <View style={[styles.glassCard, toneStyle, style]}>
      <View pointerEvents="none" style={styles.liquidGlassHighlight} />
      <View pointerEvents="none" style={styles.liquidGlassInnerGlow} />
      <View pointerEvents="none" style={styles.liquidGlassLowerEdge} />
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
  layout?: "compact" | "list" | "ring" | "calendar" | "grid";
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
  const previewItems = items.slice(0, isMedium ? 3 : 2);
  const fontStyle = font === "Mono" ? styles.widgetMono : font === "Rounded" ? styles.widgetRounded : null;
  const WidgetIcon = iconForKey(iconKey);
  const statusText = widgetStatusText(type, value, detail, previewItems, t);
  const nativeAccent = nativeAccentColor || course?.color || paletteColors[1] || theme.colors.accent;
  const nativeBackground = nativeBackgroundColor || "#101723";
  const nativeDark = ["#171A20", "#101723", "#0D1422", "#061827", "#070A12", "#05070B"].includes(nativeBackground.toUpperCase());
  const nativeInk = nativeDark ? "#F8FAFC" : "#171A20";
  const nativeMuted = nativeDark ? "#D7DEE9" : "#69707D";
  const nativeQuiet = nativeDark ? "#A8B3C5" : "#8A93A3";
  const nativeSignal = nativeSignalLabel || (previewItems.length > 0 ? t("widget_preview.live_plan", "Live plan") : t("widget_preview.setup", "Setup"));
  const nativeMetric = nativeMetricLabel || statusText;
  const nativeNext = nativeNextLabel || footnote || t("widget_snapshot.open_studyplanner", "Open StudyPlanner");
  const nativeTimeline = nativeTimelineLabel || (type === "today" ? t("widget_snapshot.today", "Today") : t("common.next", "Next"));
  const nativeProgressValue = Math.max(0, Math.min(1, nativeProgress ?? progress ?? 0));
  const previewProgressValue = Math.max(0, Math.min(1, progress ?? nativeProgress ?? 0));
  const nativeWeekDots = localizedWeekdayNarrowLabels(locale);
  const realWeekLoad = weekLoad || [];
  const maxWeekLoadScore = Math.max(...realWeekLoad.map((day) => day.score), 1);
  const firstNativeItem = previewItems[0];
  const nativePrimaryValue = !isMedium && firstNativeItem && "courseCode" in firstNativeItem && firstNativeItem.courseCode
    ? firstNativeItem.courseCode
    : value;
  const nativePrimaryDetail = !isMedium && firstNativeItem ? widgetItemTitle(firstNativeItem) : detail;
  const lockRoundValue = firstNativeItem && "courseCode" in firstNativeItem && firstNativeItem.courseCode ? firstNativeItem.courseCode : value;
  const lockRoundLabel = firstNativeItem
    ? (type === "today" ? t("widget_snapshot.do_first", "Do first") : t("common.next", "Next"))
    : type === "today" ? t("widget_snapshot.today", "Today") : t("common.next", "Next");

  if (nativeMode) {
    if (isLockInline) {
      return (
        <View style={[styles.lockInlineWidget, style]}>
          <Text style={[styles.lockInlineText, { color: nativeInk }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
            {nativeSignal}: {value} - {detail}
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
          <Text style={[styles.lockRectKicker, { color: nativeAccent }]} numberOfLines={1}>{title} / {nativeSignal}</Text>
          <Text style={[styles.lockRectTitle, { color: nativeInk }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
            {value} {detail}
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
          { backgroundColor: nativeBackground },
          style
        ]}
      >
        <View pointerEvents="none" style={[styles.nativeWidgetGlassWash, { backgroundColor: nativeDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.58)" }]} />
        <View pointerEvents="none" style={[styles.nativeWidgetBottomLens, { borderColor: nativeDark ? "rgba(255,255,255,0.10)" : "rgba(17,24,39,0.06)" }]} />
        <View pointerEvents="none" style={[styles.nativeWidgetAccent, { backgroundColor: nativeAccent }]} />
        <View style={styles.nativeWidgetTop}>
          <View style={styles.nativeWidgetHeading}>
            <Text style={styles.nativeWidgetBrand} numberOfLines={1}>StudyPlanner</Text>
            <Text style={[styles.nativeWidgetKicker, { color: nativeAccent }]} numberOfLines={1}>{nativeSignal}</Text>
          </View>
          <View style={[styles.nativeWidgetSignalPill, { backgroundColor: nativeDark ? "#202633" : "#FFFFFF" }]}>
            <Text style={[styles.nativeWidgetSignalText, { color: nativeAccent }]} numberOfLines={1}>{nativeTimeline}</Text>
          </View>
        </View>
        <View style={styles.nativeWidgetMainRow}>
          <View style={styles.nativeWidgetPrimaryCopy}>
            <Text style={[styles.nativeWidgetValue, { color: nativeInk }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{nativePrimaryValue}</Text>
            <Text style={[styles.nativeWidgetDetail, { color: nativeInk }]} numberOfLines={isMedium ? 2 : 1}>{nativePrimaryDetail}</Text>
          </View>
          {isMedium ? (
            <View style={[styles.nativeWidgetNextBox, { backgroundColor: nativeDark ? "#202633" : "#FFFFFF" }]}>
              <Text style={[styles.nativeWidgetNextKicker, { color: nativeQuiet }]} numberOfLines={1}>{t("widget_preview.next_caps", "NEXT")}</Text>
              <Text style={[styles.nativeWidgetNextText, { color: nativeInk }]} numberOfLines={2}>{nativeNext}</Text>
            </View>
          ) : null}
        </View>
        {isMedium ? (
          <View style={[styles.nativeWidgetWeekRail, { backgroundColor: nativeDark ? "#172132" : "#FFFFFF" }]}>
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
        {previewItems.length > 0 ? (
          <View style={styles.nativeWidgetList}>
            {previewItems.map((item) => (
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
            {footnote || t("widget_preview.open_studyplanner_add_homework", "Open StudyPlanner to add homework.")}
          </Text>
        )}
        <Text style={[styles.nativeWidgetFooter, { color: nativeQuiet }]} numberOfLines={1}>
          {previewItems.length > 0
            ? footnote || t("widget_preview.planner_data", "Planner data")
            : semesterName || t("widget_preview.current_semester", "Current semester")}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
          styles.widget,
        isLock ? styles.widgetSmall : isLarge ? styles.widgetLarge : isMedium ? styles.widgetMedium : styles.widgetSmall,
        background === "solid" ? styles.widgetSolid : null,
        background === "glass" ? styles.widgetGlass : null,
        background === "dark" ? styles.widgetDark : null,
        background === "gradient" ? { backgroundColor: paletteColors[0] } : null,
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
        <Text style={[styles.widgetLabel, labelTone, fontStyle]} numberOfLines={1}>{title}</Text>
        <View style={[styles.widgetStatusCapsule, isTinted ? styles.widgetStatusCapsuleTinted : null]}>
          <Text style={[styles.widgetTiny, labelTone]} numberOfLines={1}>{statusText}</Text>
        </View>
      </View>
      <View style={styles.widgetMainRow}>
        <View style={styles.widgetCopy}>
          <Text style={[styles.widgetValue, labelTone, fontStyle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>{value}</Text>
          <Text style={[styles.widgetDetail, labelTone]} numberOfLines={isMedium ? 2 : 1}>
            {detail}
          </Text>
        </View>
        <View style={[styles.widgetIconOrb, { backgroundColor: paletteColors[2] || paletteColors[1] }]}>
          <WidgetIcon color="#FFFFFF" size={17} />
        </View>
      </View>
      {layout === "list" || type === "today" || type === "needs_check" || type === "class_focus" || type === "focus" ? (
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
      {layout === "ring" || type === "focus" || type === "streak" ? (
        <View style={[styles.widgetRing, { borderColor: paletteColors[1] || theme.colors.brandPink }]}>
          <Text style={[styles.widgetRingText, labelTone]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.66}>
            {type === "focus" ? value : progressLabel || value}
          </Text>
        </View>
      ) : null}
      {layout === "calendar" || type === "week" ? (
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
      {layout === "grid" && type !== "class_focus" ? (
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
          <Plus color={theme.colors.accent} size={18} />
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
        <EmojiAccent name={emoji} label={title} decorative={false} size={22} />
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
    logoImage: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.92)",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.42 : 0.24,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 }
    },
    logoMark: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.heroSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.92)",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.42 : 0.20,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 }
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
    liquidGlassLowerEdge: {
      position: "absolute",
      left: 14,
      right: 14,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.18)" : "rgba(17,24,39,0.08)"
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
      borderRadius: 27,
      padding: spacing.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.82)",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.46 : 0.16,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 16 },
      elevation: 5
    },
    widgetSmall: {
      width: 126,
      minHeight: 126
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
    widgetGlass: {
      backgroundColor: theme.isDark ? "rgba(13,19,33,0.84)" : "rgba(255,255,255,0.76)",
      borderColor: theme.isDark ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.94)"
    },
    widgetDark: {
      backgroundColor: "#070A12",
      borderColor: "rgba(53,242,208,0.22)"
    },
    nativeWidget: {
      borderRadius: 27,
      padding: spacing.md,
      borderColor: theme.isDark ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.90)",
      shadowOpacity: theme.isDark ? 0.38 : 0.13,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 15 },
      gap: 4
    },
    nativeWidgetGlassWash: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "48%"
    },
    nativeWidgetBottomLens: {
      position: "absolute",
      right: -24,
      bottom: -24,
      width: 118,
      height: 74,
      borderRadius: 28,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: "rgba(255,255,255,0.035)",
      transform: [{ rotate: "-8deg" }]
    },
    nativeWidgetAccent: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: 5,
      opacity: 0.95
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
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.70)"
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
      marginTop: spacing.xs,
      gap: 5
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
    widgetBackplate: {
      position: "absolute",
      left: 9,
      right: 9,
      bottom: -7,
      height: 22,
      borderRadius: 18,
      borderWidth: 1,
      opacity: 0.22
    },
    widgetAura: {
      position: "absolute",
      right: -34,
      top: 18,
      width: 132,
      height: 62,
      borderRadius: 28,
      opacity: theme.isDark ? 0.30 : 0.18,
      transform: [{ rotate: "-12deg" }]
    },
    widgetSheen: {
      position: "absolute",
      left: -30,
      bottom: 14,
      width: 138,
      height: 42,
      borderRadius: 24,
      opacity: theme.isDark ? 0.20 : 0.16,
      transform: [{ rotate: "-18deg" }]
    },
    widgetLiquidFace: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "46%",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.48)"
    },
    widgetGridTexture: {
      position: "absolute",
      right: 14,
      top: 38,
      width: 74,
      height: 74,
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "rgba(255,255,255,0.035)",
      transform: [{ rotate: "8deg" }]
    },
    widgetAccentRail: {
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      width: 5,
      opacity: 0.92
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
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.09)" : "rgba(16,24,40,0.06)"
    },
    widgetStatusCapsuleTinted: {
      backgroundColor: "rgba(255,255,255,0.18)"
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
