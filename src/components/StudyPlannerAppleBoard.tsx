import React from "react";
import { ScrollView, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import Svg, { Circle } from "react-native-svg";
import { Activity, Beaker, CalendarDays, CheckCircle2, CirclePlay, GraduationCap, Timer } from "lucide-react-native";
import { useI18n } from "../i18n";

type IconComponent = React.ComponentType<any>;

export const SPBoardColors = {
  canvas: "#FFFFFF",
  text: "#050505",
  muted: "#6B7280",
  faint: "#A1A1AA",
  line: "#E9EAEE",
  soft: "#F4F5F7",
  orange: "#FF5A1F",
  orangeDark: "#D83C08",
  blue: "#1476FF",
  blueDark: "#0654D6",
  green: "#22C55E",
  greenDark: "#0E8F3C",
  teal: "#21B8A7",
  tealDark: "#0D8277",
  purple: "#8B3DFF",
  purpleDark: "#5D22C8",
  red: "#FF3B30",
  black: "#050505"
};

export type SPCardTone = "orange" | "blue" | "green" | "teal" | "purple" | "white" | "soft" | "black";

type SPColorCardProps = {
  tone: SPCardTone;
  kicker?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: IconComponent;
  accentColor?: string;
  children?: React.ReactNode;
  onPress?: () => void;
};

export function SPHeroCard({ greeting, name, detail }: { greeting: string; name: string; detail?: string }) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroCopy}>
        <Text style={styles.heroGreeting}>{greeting}</Text>
        <Text style={styles.heroName}>{name}</Text>
        {detail ? <Text style={styles.heroDetail}>{detail}</Text> : null}
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initialsForName(name)}</Text>
      </View>
    </View>
  );
}

export function SPColorCard({ tone, kicker, title, subtitle, meta, icon: Icon, accentColor, children, onPress }: SPColorCardProps) {
  const palette = accentColor ? paletteForAccent(accentColor) : tonePalette[tone];
  const light = !accentColor && (tone === "white" || tone === "soft");
  const content = (
    <>
      <View style={styles.colorCardCopy}>
        {kicker ? <Text style={[styles.cardKicker, { color: palette.kicker }]}>{kicker}</Text> : null}
        <Text style={[styles.cardTitle, { color: palette.text }]} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={[styles.cardSubtitle, { color: palette.subtle }]} numberOfLines={2}>{subtitle}</Text> : null}
        {meta ? <Text style={[styles.cardMeta, { color: palette.subtle }]} numberOfLines={1}>{meta}</Text> : null}
        {children}
      </View>
      {Icon ? (
        <View style={[styles.cardIconShell, { borderColor: palette.iconBorder }]}>
          <Icon color={palette.icon} size={30} strokeWidth={1.8} />
        </View>
      ) : null}
    </>
  );

  if (light) {
    const card = (
      <SPGlassSurface
        intensity={82}
        interactive={!!onPress}
        tintColor={tone === "soft" ? "rgba(245,245,247,0.72)" : "rgba(255,255,255,0.72)"}
        style={[styles.colorCard, { backgroundColor: palette.background }, styles.lightCardBorder]}
      >
        {content}
      </SPGlassSurface>
    );
    return onPress ? (
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.9} onPress={onPress}>
        {card}
      </TouchableOpacity>
    ) : card;
  }

  return (
    <TouchableOpacity
      accessibilityRole={onPress ? "button" : "none"}
      activeOpacity={0.88}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.colorCard, { backgroundColor: palette.background }]}
    >
      {content}
    </TouchableOpacity>
  );
}

export function SPExamCard(props: Omit<SPColorCardProps, "tone" | "icon">) {
  return <SPColorCard {...props} tone="orange" icon={Beaker} />;
}

export function SPAssignmentCard(props: Omit<SPColorCardProps, "tone" | "icon">) {
  return <SPColorCard {...props} tone="blue" icon={CheckCircle2} />;
}

export function SPFocusCard(props: Omit<SPColorCardProps, "tone" | "icon"> & { minutes?: number }) {
  return <SPColorCard {...props} tone="green" icon={Timer} />;
}

export function SPNextClassCard({
  title,
  subtitle,
  meta,
  accentColor,
  onPress
}: {
  title: string;
  subtitle: string;
  meta?: string;
  accentColor?: string;
  onPress?: () => void;
}) {
  return <SPColorCard tone="white" accentColor={accentColor} kicker="NEXT CLASS" title={title} subtitle={subtitle} meta={meta} icon={GraduationCap} onPress={onPress} />;
}

export function SPSemesterRing({
  progress,
  label = "Complete",
  size = 128,
  color = SPBoardColors.green
}: {
  progress: number;
  label?: string;
  size?: number;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  const stroke = 13;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  return (
    <View style={[styles.semesterRing, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#ECEEF2" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringValue}>{Math.round(clamped * 100)}%</Text>
        <Text style={styles.ringLabel}>{label}</Text>
      </View>
    </View>
  );
}

export function SPWidgetTile({
  tone,
  label,
  value,
  title,
  detail,
  progress,
  compact,
  mini,
  showLabel = true,
  style
}: {
  tone: SPCardTone;
  label: string;
  value: string;
  title: string;
  detail?: string;
  progress?: number;
  compact?: boolean;
  mini?: boolean;
  showLabel?: boolean;
  style?: ViewStyle;
}) {
  const palette = tonePalette[tone];
  const dark = tone !== "white" && tone !== "soft";
  const content = (
    <>
      <Text style={[styles.widgetValue, { color: palette.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{value}</Text>
      <Text style={[styles.widgetTitle, { color: palette.text }]} numberOfLines={2}>{title}</Text>
      {detail ? <Text style={[styles.widgetDetail, { color: palette.subtle }]} numberOfLines={2}>{detail}</Text> : null}
      {typeof progress === "number" ? <View style={mini ? styles.widgetRingSlotMini : styles.widgetRingSlot}><SPMiniRing progress={progress} color={dark ? "#FFFFFF" : palette.icon} trackColor={dark ? undefined : "#E9EAEE"} size={mini ? 34 : 46} stroke={mini ? 5 : 6} /></View> : null}
      {showLabel ? <Text style={[styles.widgetLabel, { color: dark ? "rgba(255,255,255,0.70)" : SPBoardColors.muted }]}>{label}</Text> : null}
    </>
  );
  const tileStyle = [styles.widgetTile, compact ? styles.widgetTileCompact : null, mini ? styles.widgetTileMini : null, { backgroundColor: palette.background }, !dark ? styles.lightCardBorder : null, style];
  return dark ? (
    <View style={tileStyle}>{content}</View>
  ) : (
    <SPGlassSurface intensity={76} style={tileStyle}>{content}</SPGlassSurface>
  );
}

export function SPWatchPreview({
  examTitle,
  assignmentTitle,
  focusTitle
}: {
  examTitle: string;
  assignmentTitle: string;
  focusTitle: string;
}) {
  const { t, locale } = useI18n();
  const previewDate = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric" }).format(new Date("2026-05-13T12:00:00"));
  const friday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(new Date("2026-05-15T12:00:00"));

  return (
    <View style={styles.watchFrame}>
      <View style={styles.watchTop}>
        <SPMiniRing progress={0.82} color={SPBoardColors.green} size={28} stroke={4} />
        <View style={styles.watchTimeBlock}>
          <Text style={styles.watchTime}>10:09</Text>
          <Text style={styles.watchDate}>{previewDate}</Text>
        </View>
      </View>
      <View style={[styles.watchCard, { backgroundColor: SPBoardColors.orange }]}>
        <Text style={styles.watchKicker}>{formatLocalized(t("today.exam_in_days", "Exam in {count} days"), { count: "7" })}</Text>
        <Text style={styles.watchTitle}>{examTitle}</Text>
      </View>
      <View style={[styles.watchCard, { backgroundColor: SPBoardColors.blue }]}>
        <Text style={styles.watchKicker}>{formatLocalized(t("today.due_weekday", "Due {weekday}"), { weekday: friday })}</Text>
        <Text style={styles.watchTitle}>{assignmentTitle}</Text>
      </View>
      <View style={[styles.watchCard, { backgroundColor: SPBoardColors.teal }]}>
        <View style={styles.watchFocusRow}>
          <View>
            <Text style={styles.watchTitle}>{focusTitle}</Text>
            <Text style={styles.watchKicker}>{formatLocalized(t("today.minutes_short", "{minutes} min"), { minutes: "45" })}</Text>
          </View>
          <CirclePlay color="#FFFFFF" size={24} fill="rgba(255,255,255,0.25)" />
        </View>
      </View>
      <Text style={styles.watchMore}>{formatLocalized(t("today.more_today", "{count} more today"), { count: "2" })}</Text>
    </View>
  );
}

export type SPBottomTabItem = {
  id: string;
  label: string;
  icon: IconComponent;
};

export function SPBottomTabBar({
  items,
  isActive,
  onPress
}: {
  items: SPBottomTabItem[];
  isActive: (id: string) => boolean;
  onPress: (id: string) => void;
}) {
  return (
    <SPGlassSurface intensity={88} style={styles.bottomTabBar}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.id);
        return (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={item.id}
            style={[styles.bottomTab, active ? styles.bottomTabActive : null]}
            onPress={() => onPress(item.id)}
          >
            <Icon color={active ? SPBoardColors.text : SPBoardColors.faint} size={19} strokeWidth={2.2} />
            <Text style={[styles.bottomTabLabel, active ? styles.bottomTabLabelActive : null]} numberOfLines={1}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </SPGlassSurface>
  );
}

export function SPDateStrip({ activeIndex = 1 }: { activeIndex?: number }) {
  const days = [
    ["M", "12"],
    ["T", "13"],
    ["W", "14"],
    ["T", "15"],
    ["F", "16"],
    ["S", "17"],
    ["S", "18"]
  ];
  return (
    <View style={styles.dateStrip}>
      {days.map(([letter, day], index) => {
        const active = index === activeIndex;
        return (
          <View key={`${letter}-${day}-${index}`} style={[styles.dateItem, active ? styles.dateItemActive : null]}>
            <Text style={[styles.dateLetter, active ? styles.dateTextActive : null]}>{letter}</Text>
            <Text style={[styles.dateNumber, active ? styles.dateTextActive : null]}>{day}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function SPActivityRings() {
  return (
    <View style={styles.activityRings}>
      <SPMiniRing progress={0.74} color={SPBoardColors.green} size={34} stroke={5} />
      <SPMiniRing progress={0.54} color={SPBoardColors.teal} size={34} stroke={5} />
      <SPMiniRing progress={0.32} color={SPBoardColors.blue} size={34} stroke={5} />
    </View>
  );
}

export function SPHorizontalWidgetRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalWidgets}>
      {children}
    </ScrollView>
  );
}

function SPInlineRing({ progress, color, label }: { progress: number; color: string; label: string }) {
  return (
    <View style={styles.inlineRingRow}>
      <Text style={styles.inlineRingLabel}>{label}</Text>
      <SPMiniRing progress={progress} color={color} size={34} stroke={4} />
    </View>
  );
}

let liquidGlassAvailable: boolean | undefined;

function SPGlassSurface({
  children,
  style,
  interactive,
  tintColor = "rgba(255,255,255,0.68)",
  intensity = 80
}: {
  children: React.ReactNode;
  style: StyleProp<ViewStyle>;
  interactive?: boolean;
  tintColor?: string;
  intensity?: number;
}) {
  if (canUseLiquidGlass()) {
    return (
      <GlassView colorScheme="light" glassEffectStyle="regular" isInteractive={interactive} tintColor={tintColor} style={style}>
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView intensity={intensity} tint="systemChromeMaterialLight" style={style}>
      {children}
    </BlurView>
  );
}

function canUseLiquidGlass() {
  if (liquidGlassAvailable !== undefined) return liquidGlassAvailable;
  try {
    liquidGlassAvailable = isLiquidGlassAvailable();
  } catch {
    liquidGlassAvailable = false;
  }
  return liquidGlassAvailable;
}

function SPMiniRing({ progress, color, size = 46, stroke = 6, trackColor = "rgba(255,255,255,0.28)" }: { progress: number; color: string; size?: number; stroke?: number; trackColor?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={circumference * (1 - Math.max(0, Math.min(1, progress)))}
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "A";
  const second = parts[1]?.[0] || "";
  return `${first}${second}`.toUpperCase();
}

const tonePalette: Record<SPCardTone, { background: string; text: string; subtle: string; kicker: string; icon: string; iconBorder: string }> = {
  orange: {
    background: SPBoardColors.orange,
    text: "#FFFFFF",
    subtle: "rgba(255,255,255,0.86)",
    kicker: "rgba(255,255,255,0.72)",
    icon: "rgba(255,255,255,0.45)",
    iconBorder: "rgba(255,255,255,0.18)"
  },
  blue: {
    background: SPBoardColors.blue,
    text: "#FFFFFF",
    subtle: "rgba(255,255,255,0.86)",
    kicker: "rgba(255,255,255,0.72)",
    icon: "rgba(255,255,255,0.45)",
    iconBorder: "rgba(255,255,255,0.18)"
  },
  green: {
    background: SPBoardColors.green,
    text: "#FFFFFF",
    subtle: "rgba(255,255,255,0.88)",
    kicker: "rgba(255,255,255,0.74)",
    icon: "rgba(255,255,255,0.45)",
    iconBorder: "rgba(255,255,255,0.18)"
  },
  teal: {
    background: SPBoardColors.teal,
    text: "#FFFFFF",
    subtle: "rgba(255,255,255,0.88)",
    kicker: "rgba(255,255,255,0.74)",
    icon: "rgba(255,255,255,0.45)",
    iconBorder: "rgba(255,255,255,0.18)"
  },
  purple: {
    background: SPBoardColors.purple,
    text: "#FFFFFF",
    subtle: "rgba(255,255,255,0.88)",
    kicker: "rgba(255,255,255,0.74)",
    icon: "rgba(255,255,255,0.45)",
    iconBorder: "rgba(255,255,255,0.18)"
  },
  white: {
    background: "#FFFFFF",
    text: SPBoardColors.text,
    subtle: SPBoardColors.muted,
    kicker: SPBoardColors.faint,
    icon: SPBoardColors.teal,
    iconBorder: "#F0F1F4"
  },
  soft: {
    background: "#F5F5F7",
    text: SPBoardColors.text,
    subtle: SPBoardColors.muted,
    kicker: SPBoardColors.orange,
    icon: SPBoardColors.orange,
    iconBorder: "#E8EAEE"
  },
  black: {
    background: SPBoardColors.black,
    text: "#FFFFFF",
    subtle: "rgba(255,255,255,0.70)",
    kicker: "rgba(255,255,255,0.58)",
    icon: "#FFFFFF",
    iconBorder: "rgba(255,255,255,0.18)"
  }
};

function paletteForAccent(color: string) {
  const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : SPBoardColors.blue;
  const text = readableTextForBackground(safeColor);
  const darkText = text === SPBoardColors.text;
  return {
    background: safeColor,
    text,
    subtle: darkText ? "rgba(5,5,5,0.68)" : "rgba(255,255,255,0.86)",
    kicker: darkText ? "rgba(5,5,5,0.58)" : "rgba(255,255,255,0.72)",
    icon: darkText ? "rgba(5,5,5,0.42)" : "rgba(255,255,255,0.45)",
    iconBorder: darkText ? "rgba(5,5,5,0.14)" : "rgba(255,255,255,0.18)"
  };
}

function readableTextForBackground(color: string) {
  const red = parseInt(color.slice(1, 3), 16) / 255;
  const green = parseInt(color.slice(3, 5), 16) / 255;
  const blue = parseInt(color.slice(5, 7), 16) / 255;
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return luminance > 0.68 ? SPBoardColors.text : "#FFFFFF";
}

function formatLocalized(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((current, [key, value]) => current.replaceAll(`{${key}}`, value), template);
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    marginBottom: 22
  },
  heroCopy: {
    flex: 1,
    minWidth: 0
  },
  heroGreeting: {
    color: SPBoardColors.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700"
  },
  heroName: {
    color: SPBoardColors.text,
    fontSize: 46,
    lineHeight: 48,
    fontWeight: "900",
    letterSpacing: 0
  },
  heroDetail: {
    marginTop: 4,
    color: SPBoardColors.muted,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600"
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E7EAEE",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: SPBoardColors.text,
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "900"
  },
  colorCard: {
    minHeight: 124,
    borderRadius: 28,
    borderCurve: "continuous",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 2
  },
  lightCardBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(210,212,218,0.72)",
    shadowOpacity: 0.07
  },
  colorCardCopy: {
    flex: 1,
    minWidth: 0
  },
  cardKicker: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  cardTitle: {
    marginTop: 6,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: 0
  },
  cardSubtitle: {
    marginTop: 5,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700"
  },
  cardMeta: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800"
  },
  cardIconShell: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderCurve: "continuous",
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center"
  },
  inlineRingRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  inlineRingLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900"
  },
  semesterRing: {
    alignItems: "center",
    justifyContent: "center"
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  ringValue: {
    color: SPBoardColors.text,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900"
  },
  ringLabel: {
    color: SPBoardColors.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800"
  },
  widgetTile: {
    width: 94,
    height: 118,
    borderRadius: 20,
    borderCurve: "continuous",
    padding: 12,
    justifyContent: "space-between",
    shadowColor: "#000000",
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2
  },
  widgetTileCompact: {
    width: 88
  },
  widgetTileMini: {
    width: 86,
    height: 106,
    padding: 10
  },
  widgetValue: {
    fontSize: 29,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: 0
  },
  widgetTitle: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "900"
  },
  widgetDetail: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700"
  },
  widgetLabel: {
    marginTop: 8,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "800",
    textAlign: "center"
  },
  widgetRingSlot: {
    position: "absolute",
    right: 10,
    bottom: 24
  },
  widgetRingSlotMini: {
    position: "absolute",
    right: 8,
    bottom: 11
  },
  watchFrame: {
    width: "100%",
    maxWidth: 232,
    alignSelf: "center",
    borderRadius: 36,
    borderCurve: "continuous",
    backgroundColor: "#050505",
    padding: 13,
    gap: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 4
  },
  watchTop: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  watchTimeBlock: {
    alignItems: "flex-end"
  },
  watchTime: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "800"
  },
  watchDate: {
    color: SPBoardColors.red,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900"
  },
  watchCard: {
    borderRadius: 14,
    borderCurve: "continuous",
    padding: 10
  },
  watchKicker: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "900"
  },
  watchTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "900"
  },
  watchFocusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  watchMore: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    textAlign: "center"
  },
  bottomTabBar: {
    minHeight: 58,
    marginHorizontal: 18,
    marginBottom: 12,
    borderRadius: 24,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E3E7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 5,
    shadowColor: "#000000",
    shadowOpacity: 0.09,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  bottomTab: {
    flex: 1,
    minHeight: 46,
    borderRadius: 19,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    gap: 2
  },
  bottomTabActive: {
    backgroundColor: "rgba(239,240,244,0.82)"
  },
  bottomTabLabel: {
    color: SPBoardColors.faint,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "900"
  },
  bottomTabLabelActive: {
    color: SPBoardColors.text
  },
  dateStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingHorizontal: 2
  },
  dateItem: {
    width: 38,
    height: 52,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center"
  },
  dateItemActive: {
    backgroundColor: SPBoardColors.blue,
    shadowColor: SPBoardColors.blue,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 }
  },
  dateLetter: {
    color: SPBoardColors.text,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900"
  },
  dateNumber: {
    color: SPBoardColors.muted,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900"
  },
  dateTextActive: {
    color: "#FFFFFF"
  },
  activityRings: {
    flexDirection: "row",
    alignItems: "center",
    gap: -7
  },
  horizontalWidgets: {
    gap: 14,
    paddingHorizontal: 2,
    paddingVertical: 8
  }
});
