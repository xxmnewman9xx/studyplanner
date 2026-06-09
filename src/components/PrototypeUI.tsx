import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileScan,
  Grid2X2,
  Home,
  ListChecks,
  Target,
  Timer,
  Upload
} from "lucide-react-native";

export const SP = {
  ink: "#0A0A0A",
  sub: "#8A8A8E",
  line: "#EDEDED",
  bg: "#F4F4F5",
  white: "#FFFFFF",
  blue: "#0A84FF",
  green: "#30D158",
  orange: "#FF9F0A",
  red: "#FF453A",
  purple: "#BF5AF2",
  pink: "#FF375F",
  teal: "#40C8E0"
};

export function AppSurface({
  children,
  dark = false,
  padded = true,
  scroll = false,
  style
}: {
  children: React.ReactNode;
  dark?: boolean;
  padded?: boolean;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  const contentStyle = [styles.surfaceContent, padded ? styles.padded : null, style];
  if (scroll) {
    return (
      <ScrollView
        style={[styles.surface, dark ? styles.surfaceDark : null]}
        contentContainerStyle={[...contentStyle, styles.scrollPad]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.surface, dark ? styles.surfaceDark : null, ...contentStyle]}>{children}</View>;
}

export function AppHeader({
  eyebrow,
  title,
  subtitle,
  dark = false,
  right
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={[styles.eyebrow, dark ? styles.textOnDarkSub : null]}>{eyebrow}</Text> : null}
        <Text style={[styles.title, dark ? styles.textOnDark : null]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, dark ? styles.textOnDarkSub : null]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function AppCard({
  children,
  style,
  onPress
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const content = <View style={[styles.card, style]}>{children}</View>;
  if (!onPress) return content;
  return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
}

export function LiquidGlassCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

export function ColorHeroCard({
  color = SP.ink,
  children,
  onPress,
  style
}: {
  color?: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.82 : 1} onPress={onPress}>
      <View style={[styles.colorHero, { backgroundColor: color }, style]}>
        <View style={[styles.heroGlow, { backgroundColor: color === SP.ink ? SP.red : "#FFFFFF" }]} />
        {children}
      </View>
    </TouchableOpacity>
  );
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  style
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "blue" | "light" | "darkOnLight";
  style?: ViewStyle;
}) {
  const buttonStyle =
    variant === "blue" ? styles.buttonBlue : variant === "light" ? styles.buttonLight : variant === "darkOnLight" ? styles.buttonDarkOnLight : styles.button;
  const textStyle = variant === "light" || variant === "darkOnLight" ? styles.buttonTextDark : styles.buttonText;
  return (
    <TouchableOpacity style={[buttonStyle, style]} onPress={onPress} activeOpacity={0.82}>
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SemesterPulse({
  score = 78,
  color = SP.green,
  size = 96,
  label = "Semester Pulse",
  detail = "On track"
}: {
  score?: number;
  color?: string;
  size?: number;
  label?: string;
  detail?: string;
}) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <View style={styles.pulseRow}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: [{ rotate: "-90deg" }] }}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeOpacity={0.15} strokeWidth={10} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - pct)}
            fill="none"
          />
        </Svg>
        <View style={styles.pulseCenter}>
          <Text style={styles.pulseScore}>{score}</Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>{label}</Text>
        <Text style={styles.pulseTitle}>{detail}</Text>
      </View>
    </View>
  );
}

export function WidgetPreview({
  classColor = SP.blue,
  title = "Midterm 1",
  days = 2,
  assignment = "Essay · Jun 6",
  pulse = 78
}: {
  classColor?: string;
  title?: string;
  days?: number;
  assignment?: string;
  pulse?: number;
}) {
  return (
    <View style={styles.homePreview}>
      <View style={styles.widgetGrid}>
        <LiquidGlassCard style={styles.bigWidget}>
          <Text style={[styles.widgetKicker, { color: classColor }]}>EXAM COUNTDOWN</Text>
          <Text style={styles.widgetDays}>{days}<Text style={styles.widgetDaysUnit}> days</Text></Text>
          <Text style={styles.widgetText}>{title}</Text>
        </LiquidGlassCard>
        <LiquidGlassCard style={styles.smallWidget}>
          <Text style={[styles.widgetKicker, { color: SP.purple }]}>NEXT ASSIGNMENT</Text>
          <Text style={styles.widgetText}>{assignment}</Text>
        </LiquidGlassCard>
        <LiquidGlassCard style={styles.smallWidgetHorizontal}>
          <SemesterPulse score={pulse} color={SP.green} size={42} label="PULSE" detail="" />
        </LiquidGlassCard>
      </View>
      <View style={styles.previewDots}>
        <View style={styles.previewDotActive} />
        <View style={styles.previewDot} />
        <View style={styles.previewDot} />
      </View>
    </View>
  );
}

export function AppTabBar({
  active,
  onPress
}: {
  active: "home" | "calendar" | "classes" | "focus" | "widgets";
  onPress?: (tab: "home" | "calendar" | "classes" | "focus" | "widgets") => void;
}) {
  const items = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "calendar" as const, label: "Calendar", icon: CalendarDays },
    { id: "classes" as const, label: "Classes", icon: ListChecks },
    { id: "focus" as const, label: "Focus", icon: Target },
    { id: "widgets" as const, label: "Widgets", icon: Grid2X2 }
  ];
  return (
    <View style={styles.tabBar}>
      {items.map((item) => {
        const Icon = item.icon;
        const selected = active === item.id;
        return (
          <TouchableOpacity key={item.id} style={styles.tabItem} onPress={() => onPress?.(item.id)}>
            <Icon size={24} color={selected ? SP.ink : SP.sub} />
            <Text style={[styles.tabLabel, selected ? styles.tabLabelActive : null]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function AppEmptyState({ title, copy, action, onAction }: { title: string; copy: string; action: string; onAction?: () => void }) {
  return (
    <AppCard style={styles.empty}>
      <View style={styles.emptyIcon}><FileScan size={28} color={SP.white} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.subtitle}>{copy}</Text>
      <AppButton label={action} onPress={onAction} style={{ marginTop: 18 }} />
    </AppCard>
  );
}

export function Dot({ color = SP.blue, size = 10 }: { color?: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

export function IconTile({ color = SP.blue, children }: { color?: string; children: React.ReactNode }) {
  return <View style={[styles.iconTile, { backgroundColor: `${color}1A` }]}>{children}</View>;
}

export const PrototypeIcons = { BookOpen, CalendarDays, CheckCircle2, FileScan, Timer, Upload };

const styles = StyleSheet.create({
  surface: { flex: 1, backgroundColor: SP.bg },
  surfaceDark: { backgroundColor: SP.ink },
  surfaceContent: { flexGrow: 1 },
  padded: { paddingHorizontal: 24, paddingTop: 8 },
  scrollPad: { paddingBottom: 112 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 },
  eyebrow: { color: SP.sub, fontSize: 13, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  title: { color: SP.ink, fontSize: 34, fontWeight: "800", letterSpacing: -0.7, lineHeight: 38, marginTop: 6 },
  subtitle: { color: SP.sub, fontSize: 16, fontWeight: "600", lineHeight: 23, marginTop: 8 },
  textOnDark: { color: SP.white },
  textOnDarkSub: { color: "rgba(255,255,255,0.55)" },
  card: { backgroundColor: SP.white, borderColor: SP.line, borderWidth: 1, borderRadius: 24, padding: 18 },
  glassCard: { backgroundColor: "rgba(255,255,255,0.58)", borderRadius: 20, padding: 14 },
  colorHero: { borderRadius: 28, padding: 26, minHeight: 150, overflow: "hidden" },
  heroGlow: { position: "absolute", width: 140, height: 140, borderRadius: 70, right: -42, top: -42, opacity: 0.35 },
  button: { height: 56, borderRadius: 18, backgroundColor: SP.ink, alignItems: "center", justifyContent: "center" },
  buttonBlue: { height: 56, borderRadius: 18, backgroundColor: SP.blue, alignItems: "center", justifyContent: "center" },
  buttonLight: { height: 56, borderRadius: 18, backgroundColor: SP.white, alignItems: "center", justifyContent: "center" },
  buttonDarkOnLight: { height: 56, borderRadius: 18, backgroundColor: "#F0F0F2", alignItems: "center", justifyContent: "center" },
  buttonText: { color: SP.white, fontSize: 17, fontWeight: "800" },
  buttonTextDark: { color: SP.ink, fontSize: 17, fontWeight: "800" },
  pulseRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  pulseCenter: { position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" },
  pulseScore: { color: SP.ink, fontSize: 24, fontWeight: "800" },
  pulseTitle: { color: SP.ink, fontSize: 22, fontWeight: "800", letterSpacing: -0.3, marginTop: 4 },
  homePreview: { marginTop: 16, marginHorizontal: 0, borderRadius: 30, padding: 22, backgroundColor: "#8EC5FC", overflow: "hidden" },
  widgetGrid: { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 14 },
  bigWidget: { width: "46%", height: 148, justifyContent: "space-between" },
  smallWidget: { width: "46%", height: 67 },
  smallWidgetHorizontal: { width: "46%", height: 67, justifyContent: "center" },
  widgetKicker: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  widgetDays: { color: SP.ink, fontSize: 40, fontWeight: "900", letterSpacing: -1 },
  widgetDaysUnit: { color: SP.sub, fontSize: 18, fontWeight: "700" },
  widgetText: { color: SP.ink, fontSize: 14, fontWeight: "800", marginTop: 4 },
  previewDots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 18 },
  previewDotActive: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.95)" },
  previewDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.45)" },
  tabBar: { position: "absolute", left: 0, right: 0, bottom: 0, height: 84, borderTopWidth: 1, borderTopColor: SP.line, backgroundColor: "rgba(255,255,255,0.92)", flexDirection: "row", justifyContent: "space-around", paddingTop: 11 },
  tabItem: { alignItems: "center", gap: 4, minWidth: 56 },
  tabLabel: { color: SP.sub, fontSize: 10, fontWeight: "700" },
  tabLabelActive: { color: SP.ink },
  empty: { alignItems: "center", marginTop: 40, padding: 24 },
  emptyIcon: { width: 58, height: 58, borderRadius: 17, backgroundColor: SP.ink, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { color: SP.ink, fontSize: 24, fontWeight: "800", textAlign: "center", letterSpacing: -0.3 },
  iconTile: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" }
});
