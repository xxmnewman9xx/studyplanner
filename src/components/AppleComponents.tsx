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
  FlaskConical,
  Palette,
  PenLine,
  Plus,
  Sparkles,
  Timer
} from "lucide-react-native";
import { Assignment, Course, WidgetBackground, WidgetPalette, WidgetSize, WidgetType } from "../models";
import { AppTheme, themePalettes } from "../theme";
import { useAppTheme } from "../themeContext";

export const emojiMap = {
  study: "📚",
  science: "🧪",
  writing: "✏️",
  calendar: "🗓️",
  ai: "🧠",
  complete: "✅",
  warning: "⚠️",
  focus: "🌙",
  streak: "🔥",
  art: "🎨",
  history: "🌎",
  scan: "📄",
  theme: "🎨",
  privacy: "🔒",
  pro: "✨",
  widget: "🧩"
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
  const styles = createStyles(theme);

  return (
    <View style={[styles.logoWrap, style]}>
      <Image
        accessibilityLabel="StudyPlanner app icon"
        resizeMode="cover"
        source={require("../../assets/app/study-planner-icon.png")}
        style={[styles.logoImage, { width: size, height: size, borderRadius: size * 0.22 } as ImageStyle]}
      />
      {showWordmark ? (
        <View style={styles.logoCopy}>
          <Text style={styles.logoTitle}>StudyPlanner</Text>
          <Text style={styles.logoSubtitle}>Syllabus AI</Text>
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
  return (
    <Text
      accessibilityLabel={decorative ? undefined : label || name}
      accessible={!decorative}
      importantForAccessibility={decorative ? "no" : "auto"}
      style={{ fontSize: size, lineHeight: Math.ceil(size * 1.25) }}
    >
      {emojiMap[name]}
    </Text>
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
      <Text style={styles.emojiBadgeText}>{label}</Text>
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
  return <View style={[styles.glassCard, toneStyle, style]}>{children}</View>;
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
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {detail ? <Text style={styles.statDetail}>{detail}</Text> : null}
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
            <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>
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
  const progress = Math.round((assignment.progress || 0) * 100);
  const content = (
    <>
      <View style={[styles.classTile, { backgroundColor: course?.color || theme.colors.accent }]}>
        <Text style={styles.classTileText}>{course?.code.slice(0, 1) || "S"}</Text>
      </View>
      <View style={styles.assignmentRowCopy}>
        <Text style={styles.assignmentRowTitle}>{assignment.title}</Text>
        <Text style={styles.assignmentRowMeta}>
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
  const styles = createStyles(theme);
  const content = (
    <>
      <View style={[styles.classLargeIcon, { backgroundColor: course.color }]}>
        <EmojiAccent name={(course.emojiKey as EmojiKey) || "study"} label={course.name} decorative={false} />
      </View>
      <View style={styles.classCardCopy}>
        <Text style={styles.classCardTitle}>{course.code}</Text>
        <Text style={styles.classCardMeta}>
          {course.teacher || course.instructor || "Teacher"} · {course.period || "Period"}
        </Text>
        <Text style={styles.classCardSubtle}>{openCount} open · {doneCount} completed</Text>
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
  items?: Assignment[];
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const paletteColors = themePalettes[palette] || themePalettes.sunset;
  const isTinted = background === "dark" || background === "gradient";
  const isLarge = size === "large";
  const isMedium = size === "medium" || size === "large";
  const labelTone = isTinted ? styles.widgetTextDark : null;
  const previewItems = items.slice(0, isMedium ? 3 : 2);
  const fontStyle = font === "Mono" ? styles.widgetMono : font === "Rounded" ? styles.widgetRounded : null;
  const WidgetIcon = iconForKey(iconKey);

  return (
    <View
      style={[
        styles.widget,
        isLarge ? styles.widgetLarge : isMedium ? styles.widgetMedium : styles.widgetSmall,
        background === "solid" ? styles.widgetSolid : null,
        background === "glass" ? styles.widgetGlass : null,
        background === "dark" ? styles.widgetDark : null,
        background === "gradient" ? { backgroundColor: paletteColors[0] } : null,
        style
      ]}
    >
      {background === "gradient" ? (
        <View style={[styles.widgetGlow, { backgroundColor: paletteColors[1] }]} />
      ) : null}
      <View style={styles.widgetTop}>
        <Text style={[styles.widgetLabel, labelTone, fontStyle]}>{title}</Text>
        <Text style={[styles.widgetTiny, labelTone]}>
          {type === "due_next" ? "2h" : "May 13"}
        </Text>
      </View>
      <View style={styles.widgetMainRow}>
        <View style={styles.widgetCopy}>
          <Text style={[styles.widgetValue, labelTone, fontStyle]}>{value}</Text>
          <Text style={[styles.widgetDetail, labelTone]} numberOfLines={2}>
            {detail}
          </Text>
        </View>
        <View style={[styles.widgetIconOrb, { backgroundColor: paletteColors[2] || paletteColors[1] }]}>
          <WidgetIcon color="#FFFFFF" size={17} />
        </View>
      </View>
      {layout === "list" || type === "today" || type === "needs_check" ? (
        <View style={styles.widgetMiniList}>
          {previewItems.map((item) => (
            <View key={item.id} style={styles.widgetMiniRow}>
              <View style={[styles.widgetMiniDot, { backgroundColor: course?.color || paletteColors[1] }]} />
              <Text style={[styles.widgetMiniText, labelTone]} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {layout === "ring" || type === "focus" || type === "streak" ? (
        <View style={[styles.widgetRing, { borderColor: paletteColors[1] || theme.colors.brandPink }]}>
          <Text style={[styles.widgetRingText, labelTone]}>{type === "streak" ? "7" : "25"}</Text>
        </View>
      ) : null}
      {layout === "calendar" || type === "week" ? (
        <View style={styles.widgetBars}>
          {[0.28, 0.6, 0.92, 0.44, 0.72].map((height, index) => (
            <View key={index} style={styles.widgetBarWrap}>
              <View
                style={[
                  styles.widgetBar,
                  { height: 12 + height * 34, backgroundColor: paletteColors[index % paletteColors.length] }
                ]}
              />
            </View>
          ))}
        </View>
      ) : null}
      {layout === "grid" || type === "class_focus" ? (
        <View style={styles.widgetGridDots}>
          {paletteColors.slice(0, 4).map((color) => (
            <View key={color} style={[styles.widgetGridDot, { backgroundColor: color }]} />
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
  const colors = palette === "custom" ? ["#FFFFFF", "#FCE7F3", "#E0E7FF", "#FFEDD5"] : themePalettes[palette];

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
        <Text style={styles.themeName}>{name}</Text>
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
      <Text style={styles.settingsTitle}>{title}</Text>
      {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
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
  emoji = "complete"
}: {
  title: string;
  copy: string;
  emoji?: EmojiKey;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <EmojiAccent name={emoji} label={title} decorative={false} size={22} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
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
      borderColor: theme.isDark ? "rgba(255,255,255,0.12)" : "rgba(119,107,255,0.12)",
      padding: spacing.lg,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.34 : 0.14,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 16 },
      elevation: 7
    },
    plainGlassCard: {
      backgroundColor: theme.isDark ? "rgba(18,18,31,0.92)" : "rgba(255,255,255,0.92)"
    },
    heroGlassCard: {
      backgroundColor: colors.heroSurface,
      borderColor: theme.isDark ? "#3B3270" : "#8075FF"
    },
    softGlassCard: {
      backgroundColor: colors.surfaceTint
    },
    darkGlassCard: {
      backgroundColor: "#101024",
      borderColor: "#2A2851"
    },
    statPill: {
      flex: 1,
      minHeight: 88,
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.18 : 0.07,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 7 },
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
      minHeight: 42,
      flexDirection: "row",
      borderRadius: radii.lg,
      backgroundColor: colors.surfaceAlt,
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
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.18 : 0.08,
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
      minHeight: 78,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    classTile: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center"
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
      fontWeight: "900"
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
      backgroundColor: colors.brandPink
    },
    classCard: {
      minHeight: 78,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    classLargeIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center"
    },
    classCardCopy: {
      flex: 1,
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
      borderRadius: 22,
      padding: spacing.md,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.45)",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.28 : 0.16,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4
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
      backgroundColor: colors.surface
    },
    widgetGlass: {
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.78)"
    },
    widgetDark: {
      backgroundColor: "#111024",
      borderColor: "#2C2855"
    },
    widgetGlow: {
      position: "absolute",
      right: -40,
      bottom: -54,
      width: 132,
      height: 132,
      borderRadius: 66,
      opacity: 0.65
    },
    widgetTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm
    },
    widgetLabel: {
      color: colors.ink,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
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
      lineHeight: 38,
      fontWeight: "900"
    },
    widgetDetail: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
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
      opacity: 0.95
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
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      alignItems: "center",
      gap: spacing.xs
    },
    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius: 18,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xs
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
