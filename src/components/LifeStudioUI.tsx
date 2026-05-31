import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Activity,
  Atom,
  BatteryCharging,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  Compass,
  Dumbbell,
  Flame,
  Gauge,
  GraduationCap,
  HeartPulse,
  LayoutGrid,
  Leaf,
  Music,
  ShieldAlert,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Zap
} from "lucide-react-native";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { OSBehavior, StudentDNA, UserSettings, WatchDNA, WidgetDNA } from "../models";
import {
  frictionPointOptions,
  osBehaviorOptions,
  studentDNAOptions,
  watchDNAOptions,
  widgetDNAOptions
} from "../logic/lifeStudio";

type Props = {
  settings: UserSettings;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  compact?: boolean;
};

type IconType = React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>;

type BehaviorVisual = {
  id: OSBehavior;
  surface: string;
  surface2: string;
  accent: string;
  secondary: string;
  chip: string;
  title: string;
  detail: string;
  layout: string;
  previewTitle: string;
  previewMeta: string;
  cards: Array<{ title: string; meta: string; reason: string; color: string; icon: IconType }>;
  widgets: Array<{ title: string; value: string; detail: string; color: string; icon: IconType }>;
};

const identityIcons: Record<StudentDNA, IconType> = {
  focused_scholar: Brain,
  active_athlete: Dumbbell,
  creative_artist: Music,
  competitive_leader: Trophy,
  balanced_wellness: Leaf,
  working_professional: BriefcaseBusiness,
  curious_explorer: Compass,
  research_driven: Atom
};

const behaviorIcons: Record<OSBehavior, IconType> = {
  highest_gpa: GraduationCap,
  less_stress: HeartPulse,
  athletic_performance: Dumbbell,
  life_balance: Gauge,
  high_achievement: Zap
};

const widgetIcons: Record<WidgetDNA, IconType> = {
  exam_countdown: Timer,
  grade_impact: Target,
  future_risk: ShieldAlert,
  free_time_forecast: Clock,
  recovery_window: BatteryCharging,
  life_balance: Gauge
};

const watchIcons: Record<WatchDNA, IconType> = {
  next_class: CalendarDays,
  focus_window: Timer,
  exam_risk: ShieldAlert,
  semester_progress: Gauge,
  free_time: Clock
};

const behaviorVisuals: Record<OSBehavior, BehaviorVisual> = {
  highest_gpa: {
    id: "highest_gpa",
    surface: "#07113A",
    surface2: "#141A53",
    accent: "#FF375F",
    secondary: "#FF9F0A",
    chip: "#FFE8ED",
    title: "Highest GPA",
    detail: "Risk first. Grade impact always visible.",
    layout: "Risk first",
    previewTitle: "Protect the grade",
    previewMeta: "Exam risk is leading your feed",
    cards: [
      { title: "Chemistry Midterm", meta: "Thu · 8:00 AM", reason: "Start tonight because Thursday is overloaded.", color: "#C81E5B", icon: ShieldAlert },
      { title: "Calculus II Homework", meta: "Due Thu · 10:59 PM", reason: "Recommended: 2 study sessions before 8 PM.", color: "#6337E8", icon: BookOpen },
      { title: "Physics Lab Report", meta: "Due Tue · 11:59 PM", reason: "Break into 2 focused blocks.", color: "#1557D8", icon: Atom },
      { title: "Focus Window", meta: "Tonight · 50 min", reason: "Best grade-impact slot before practice.", color: "#0F766E", icon: Timer }
    ],
    widgets: [
      { title: "Grade Impact", value: "High", detail: "Midterm drives priority", color: "#FF375F", icon: Target },
      { title: "Exam Countdown", value: "3d", detail: "Chemistry", color: "#FF9F0A", icon: Timer },
      { title: "Future Risk", value: "2", detail: "Overloaded days", color: "#AF52DE", icon: ShieldAlert }
    ]
  },
  less_stress: {
    id: "less_stress",
    surface: "#082B3A",
    surface2: "#0A3A43",
    accent: "#34C759",
    secondary: "#5AC8FA",
    chip: "#E6FAF1",
    title: "Less Stress",
    detail: "Softer pacing. Free time and recovery stay visible.",
    layout: "Calm stack",
    previewTitle: "Keep the week calm",
    previewMeta: "Recovery and free time are promoted",
    cards: [
      { title: "Free Time Forecast", meta: "2.4 hrs this week", reason: "Use one open block before work gets dense.", color: "#0F8A6A", icon: Clock },
      { title: "Calculus II Homework", meta: "Due Thu · 10:59 PM", reason: "A 25 min start is enough tonight.", color: "#2563EB", icon: BookOpen },
      { title: "Recovery Window", meta: "Tomorrow · 30 min", reason: "Protect this before exam prep ramps up.", color: "#14B8A6", icon: BatteryCharging },
      { title: "Chemistry Midterm", meta: "Thu · 8:00 AM", reason: "Light review today. Bigger block tomorrow.", color: "#7C3AED", icon: ShieldAlert }
    ],
    widgets: [
      { title: "Free Time", value: "2.4h", detail: "This week", color: "#34C759", icon: Clock },
      { title: "Recovery", value: "30m", detail: "Protected", color: "#5AC8FA", icon: BatteryCharging },
      { title: "Load", value: "72", detail: "Manageable", color: "#14B8A6", icon: Gauge }
    ]
  },
  athletic_performance: {
    id: "athletic_performance",
    surface: "#062D1F",
    surface2: "#0B3A25",
    accent: "#30D158",
    secondary: "#FF9F0A",
    chip: "#E8FBEF",
    title: "Athletic Performance",
    detail: "Practice, recovery, and exam risk are balanced.",
    layout: "Recovery first",
    previewTitle: "Perform without slipping",
    previewMeta: "Practice and recovery moved up",
    cards: [
      { title: "Soccer Practice", meta: "Today · 4:00 PM", reason: "Recovery block follows practice.", color: "#087A3F", icon: Dumbbell },
      { title: "Recovery Window", meta: "Tonight · 35 min", reason: "Best reset before Chemistry review.", color: "#0E7490", icon: BatteryCharging },
      { title: "Chemistry Midterm", meta: "Thu · 8:00 AM", reason: "Review after recovery, not after midnight.", color: "#B42318", icon: ShieldAlert },
      { title: "Calculus II Homework", meta: "Due Thu · 10:59 PM", reason: "Fit into tomorrow's open block.", color: "#6337E8", icon: BookOpen }
    ],
    widgets: [
      { title: "Practice", value: "4 PM", detail: "Today", color: "#30D158", icon: Dumbbell },
      { title: "Recovery", value: "35m", detail: "After practice", color: "#5AC8FA", icon: BatteryCharging },
      { title: "Exam Risk", value: "Med", detail: "Chemistry", color: "#FF9F0A", icon: ShieldAlert }
    ]
  },
  life_balance: {
    id: "life_balance",
    surface: "#0D2035",
    surface2: "#0F2C49",
    accent: "#32D7C8",
    secondary: "#AF52DE",
    chip: "#E8FBFF",
    title: "Life Balance",
    detail: "Classes, activities, work, and recovery stay mixed.",
    layout: "Balanced blend",
    previewTitle: "Balance the whole week",
    previewMeta: "Academic and life signals share the feed",
    cards: [
      { title: "Physics Lab Report", meta: "Due Tue · 11:59 PM", reason: "Finish the rough pass before your shift.", color: "#1557D8", icon: Atom },
      { title: "Work Shift", meta: "Wed · 5:30 PM", reason: "Plan study before the shift, not after.", color: "#B45309", icon: BriefcaseBusiness },
      { title: "Soccer Practice", meta: "Today · 4:00 PM", reason: "Good reset between study blocks.", color: "#087A3F", icon: Dumbbell },
      { title: "Chemistry Midterm", meta: "Thu · 8:00 AM", reason: "Short review keeps stress from stacking.", color: "#C81E5B", icon: ShieldAlert }
    ],
    widgets: [
      { title: "Balance Ring", value: "72", detail: "Life score", color: "#32D7C8", icon: Gauge },
      { title: "Work", value: "Wed", detail: "Shift ahead", color: "#FF9F0A", icon: BriefcaseBusiness },
      { title: "Focus", value: "50m", detail: "Open block", color: "#AF52DE", icon: Timer }
    ]
  },
  high_achievement: {
    id: "high_achievement",
    surface: "#1B103F",
    surface2: "#28165E",
    accent: "#BF5AF2",
    secondary: "#FF375F",
    chip: "#F4E8FF",
    title: "High Achievement",
    detail: "Aggressive forecasting and future risk planning.",
    layout: "Forecast first",
    previewTitle: "Stay ahead of risk",
    previewMeta: "Future conflicts are pulled forward",
    cards: [
      { title: "Future Risk", meta: "2 overloaded days", reason: "Move one task now to avoid Thursday.", color: "#7C3AED", icon: ShieldAlert },
      { title: "Calculus II Homework", meta: "Due Thu · 10:59 PM", reason: "Finish tonight. Reserve tomorrow for review.", color: "#6337E8", icon: BookOpen },
      { title: "Chemistry Midterm", meta: "Thu · 8:00 AM", reason: "High-impact prep starts before dinner.", color: "#C81E5B", icon: Target },
      { title: "Focus Sprint", meta: "Tonight · 75 min", reason: "Aggressive plan: front-load the week.", color: "#0F766E", icon: Flame }
    ],
    widgets: [
      { title: "Future Risk", value: "2", detail: "Move now", color: "#BF5AF2", icon: ShieldAlert },
      { title: "Sprint", value: "75m", detail: "Tonight", color: "#FF375F", icon: Flame },
      { title: "GPA Path", value: "On", detail: "High impact", color: "#5E5CE6", icon: Target }
    ]
  }
};

export function LifeStudioSetup({ settings, onUpdateSettings, compact = false }: Props) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const selectedIdentity = settings.studentDNA || "focused_scholar";
  const selectedBehavior = settings.osBehavior || "highest_gpa";
  const selectedWidgets = settings.widgetDNA || ["exam_countdown", "grade_impact"];
  const selectedWatch = settings.watchDNA || ["next_class", "focus_window"];
  const selectedFriction = settings.frictionPoints || ["procrastination"];
  const visual = behaviorVisuals[selectedBehavior];

  const toggleWidget = (id: WidgetDNA) =>
    onUpdateSettings({
      widgetDNA: selectedWidgets.includes(id)
        ? selectedWidgets.filter((item) => item !== id)
        : [...selectedWidgets, id]
    });
  const toggleWatch = (id: WatchDNA) =>
    onUpdateSettings({
      watchDNA: selectedWatch.includes(id)
        ? selectedWatch.filter((item) => item !== id)
        : [...selectedWatch, id]
    });

  return (
    <View style={styles.shell}>
      <View style={styles.headerRow}>
        <View style={styles.logoMark}>
          <View style={[styles.logoLine, { backgroundColor: "#0A84FF" }]} />
          <View style={[styles.logoLine, { backgroundColor: "#30D158" }]} />
          <View style={[styles.logoLine, { backgroundColor: "#FF2D55" }]} />
          <View style={[styles.logoLine, { backgroundColor: "#FF9F0A" }]} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>StudyPlanner: Syllabus AI</Text>
          <Text style={[styles.title, compact ? styles.titleCompact : null]}>Design your life OS.</Text>
          <Text style={styles.subtitle}>Identity, behavior, widgets, and watch signals adapt the student feed.</Text>
        </View>
        <View style={[styles.livePill, { backgroundColor: visual.chip }]}>
          <Text style={[styles.livePillText, { color: visual.accent }]}>Live</Text>
        </View>
      </View>

      <SPPreviewPhone settings={settings} compact={compact} />

      <View style={compact ? styles.compactGrid : styles.grid}>
        <View style={styles.panel}>
          <SectionLabel number="1" title="Choose Your Identity" />
          <View style={styles.identityGrid}>
            {studentDNAOptions.map((item) => {
              const Icon = identityIcons[item.id];
              return (
                <ChoiceTile
                  key={item.id}
                  label={item.label}
                  color={item.color}
                  Icon={Icon}
                  active={selectedIdentity === item.id}
                  compact={compact}
                  onPress={() => onUpdateSettings({ studentDNA: item.id })}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.panel}>
          <SectionLabel number="2" title="Pick Your Layout" />
          <SPLayoutSelector value={selectedBehavior} onChange={(osBehavior) => onUpdateSettings({ osBehavior })} />
        </View>

        <View style={styles.panel}>
          <SectionLabel number="3" title="OS Behavior" />
          <SPOSBehaviorSelector value={selectedBehavior} onChange={(osBehavior) => onUpdateSettings({ osBehavior })} />
        </View>

        <View style={styles.panel}>
          <SectionLabel number="4" title="Widget DNA" />
          <SPWidgetDNASelector values={selectedWidgets} onToggle={toggleWidget} />
          <SectionLabel number="5" title="Watch DNA" />
          <SPWatchDNASelector values={selectedWatch} onToggle={toggleWatch} />
        </View>

        <View style={styles.panel}>
          <SectionLabel number="6" title="Friction Points" />
          <View style={styles.pillWrap}>
            {frictionPointOptions.map((item) => {
              const active = selectedFriction.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.pill, active ? [styles.pillActive, { borderColor: visual.accent, backgroundColor: visual.chip }] : null]}
                  onPress={() =>
                    onUpdateSettings({
                      frictionPoints: active
                        ? selectedFriction.filter((value) => value !== item.id)
                        : [...selectedFriction, item.id]
                    })
                  }
                >
                  <Text style={[styles.pillText, active ? { color: visual.accent } : null]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

export function SPOSBehaviorSelector({ value, onChange }: { value: OSBehavior; onChange: (value: OSBehavior) => void }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.behaviorRow}>
      {osBehaviorOptions.map((item) => {
        const active = value === item.id;
        const visual = behaviorVisuals[item.id];
        const Icon = behaviorIcons[item.id];
        return (
          <TouchableOpacity
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.behaviorTile,
              active ? [styles.behaviorTileActive, { borderColor: visual.accent, backgroundColor: visual.chip }] : null
            ]}
            onPress={() => onChange(item.id)}
          >
            <View style={[styles.behaviorIcon, { backgroundColor: active ? visual.accent : `${visual.accent}18` }]}>
              <Icon color={active ? "#FFFFFF" : visual.accent} size={17} strokeWidth={2.7} />
            </View>
            <Text style={styles.behaviorTitle} numberOfLines={1}>{item.label}</Text>
            <Text style={styles.behaviorDetail} numberOfLines={2}>{visual.detail}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SPLayoutSelector({ value, onChange }: { value: OSBehavior; onChange: (value: OSBehavior) => void }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const layouts = osBehaviorOptions.map((item) => {
    const visual = behaviorVisuals[item.id];
    return { id: item.id, label: visual.layout, color: visual.accent, Icon: LayoutGrid };
  });
  return (
    <View style={styles.layoutRow}>
      {layouts.map((item) => {
        const active = item.id === value;
        return (
          <TouchableOpacity
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.layoutTile, active ? [styles.layoutTileActive, { borderColor: item.color }] : null]}
            onPress={() => onChange(item.id)}
          >
            <item.Icon color={item.color} size={17} strokeWidth={2.7} />
            <Text style={styles.layoutText} numberOfLines={1}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function SPWidgetDNASelector({ values, onToggle }: { values: WidgetDNA[]; onToggle: (value: WidgetDNA) => void }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.dnaGrid}>
      {widgetDNAOptions.map((item) => {
        const active = values.includes(item.id);
        const Icon = widgetIcons[item.id];
        return (
          <TouchableOpacity key={item.id} style={[styles.dnaTile, active ? [styles.dnaTileActive, { borderColor: item.color }] : null]} onPress={() => onToggle(item.id)}>
            <View style={[styles.dnaIcon, { backgroundColor: active ? item.color : `${item.color}18` }]}>
              <Icon color={active ? "#FFFFFF" : item.color} size={15} strokeWidth={2.7} />
            </View>
            <Text style={styles.dnaTitle} numberOfLines={1}>{item.label}</Text>
            <Text style={styles.dnaDetail} numberOfLines={1}>{item.detail}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function SPWatchDNASelector({ values, onToggle }: { values: WatchDNA[]; onToggle: (value: WatchDNA) => void }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.watchRow}>
      {watchDNAOptions.map((item) => {
        const active = values.includes(item.id);
        const Icon = watchIcons[item.id];
        return (
          <TouchableOpacity key={item.id} style={[styles.watchPill, active ? [styles.watchPillActive, { borderColor: item.color }] : null]} onPress={() => onToggle(item.id)}>
            <View style={[styles.watchIcon, { backgroundColor: active ? item.color : `${item.color}18` }]}>
              <Icon color={active ? "#FFFFFF" : item.color} size={13} strokeWidth={2.8} />
            </View>
            <Text style={styles.watchText} numberOfLines={1}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function SPPreviewPhone({ settings, compact = false }: { settings: UserSettings; compact?: boolean }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const behavior = settings.osBehavior || "highest_gpa";
  const identity = settings.studentDNA || "focused_scholar";
  const identityOption = studentDNAOptions.find((item) => item.id === identity) || studentDNAOptions[0]!;
  const visual = behaviorVisuals[behavior];
  return (
    <View style={[styles.phoneOuter, compact ? styles.phoneOuterCompact : null]}>
      <View style={[styles.phone, compact ? styles.phoneCompact : null, { backgroundColor: visual.surface }]}>
        <View style={[styles.phoneWash, { backgroundColor: visual.surface2 }]} />
        <View style={[styles.phoneGlow, { backgroundColor: visual.accent }]} />
        <View style={styles.island} />
        <View style={styles.phoneHeader}>
          <View>
            <Text style={styles.phoneEyebrow}>Your Life OS Preview</Text>
            <Text style={styles.phoneTitle}>{visual.previewTitle}</Text>
          </View>
          <View style={[styles.phoneLive, { backgroundColor: visual.accent }]}>
            <Text style={styles.phoneLiveText}>Live</Text>
          </View>
        </View>
        <Text style={styles.phoneMeta}>{identityOption.label} · {visual.previewMeta}</Text>
        <View style={styles.weekStrip}>
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => (
            <View key={day} style={[styles.dayPill, index === 3 ? { backgroundColor: visual.accent } : null]}>
              <Text style={[styles.dayText, index === 3 ? styles.dayTextActive : null]}>{day}</Text>
              <Text style={[styles.dayNumber, index === 3 ? styles.dayTextActive : null]}>{8 + index}</Text>
            </View>
          ))}
        </View>
        <View style={styles.previewWidgetRow}>
          {visual.widgets.map((widget) => {
            const Icon = widget.icon;
            return (
              <View key={widget.title} style={styles.previewWidget}>
                <View style={[styles.previewWidgetIcon, { backgroundColor: `${widget.color}24` }]}>
                  <Icon color={widget.color} size={13} strokeWidth={2.8} />
                </View>
                <Text style={styles.previewWidgetValue}>{widget.value}</Text>
                <Text style={styles.previewWidgetLabel} numberOfLines={1}>{widget.title}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.previewCardStack}>
          {visual.cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <View key={card.title} style={[styles.feedCard, { backgroundColor: card.color, transform: [{ scale: index === 0 ? 1 : 0.985 }] }]}>
                <View style={styles.feedIcon}>
                  <Icon color="#FFFFFF" size={15} strokeWidth={2.8} />
                </View>
                <View style={styles.feedCopy}>
                  <View style={styles.feedTopLine}>
                    <Text style={styles.feedTitle} numberOfLines={1}>{card.title}</Text>
                    <Text style={styles.impactBadge}>{index === 0 ? "High impact" : "Smart"}</Text>
                  </View>
                  <Text style={styles.feedMeta}>{card.meta}</Text>
                  <Text style={styles.feedReason} numberOfLines={2}>{card.reason}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={styles.phoneTabBar}>
          {([
            { label: "Feed", Icon: Sparkles },
            { label: "Classes", Icon: CalendarDays },
            { label: "Focus", Icon: Timer },
            { label: "Life", Icon: Activity }
          ] as Array<{ label: string; Icon: IconType }>).map(({ label, Icon }, index) => (
            <View key={label} style={styles.phoneTab}>
              <Icon color={index === 0 ? visual.accent : "rgba(255,255,255,0.58)"} size={14} strokeWidth={2.8} />
              <Text style={[styles.phoneTabText, index === 0 ? { color: "#FFFFFF" } : null]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function SectionLabel({ number, title }: { number: string; title: string }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionNumber}>{number}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function ChoiceTile({
  label,
  color,
  Icon,
  active,
  compact = false,
  onPress
}: {
  label: string;
  color: string;
  Icon: IconType;
  active: boolean;
  compact?: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: active }} style={[styles.choiceTile, compact ? styles.choiceTileCompact : null, active ? [styles.choiceTileActive, { borderColor: color }] : null]} onPress={onPress}>
      <View style={[styles.choiceIcon, { backgroundColor: active ? color : `${color}18` }]}>
        <Icon color={active ? "#FFFFFF" : color} size={18} strokeWidth={2.8} />
      </View>
      <Text style={styles.choiceText} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>{label}</Text>
    </TouchableOpacity>
  );
}

function createStyles(theme: AppTheme) {
  const { spacing } = theme;
  const ink = "#05070B";
  const muted = "#586174";
  const shadow = "#15233A";
  return StyleSheet.create({
    shell: {
      borderRadius: 30,
      backgroundColor: "#F7F9FD",
      padding: spacing.md,
      borderWidth: 1,
      borderColor: "rgba(17,24,39,0.07)",
      shadowColor: shadow,
      shadowOpacity: 0.08,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      gap: spacing.md,
      overflow: "hidden"
    },
    headerRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
    logoMark: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#05070B", justifyContent: "center", alignItems: "center", gap: 4 },
    logoLine: { width: 25, height: 4, borderRadius: 4 },
    headerCopy: { flex: 1, minWidth: 0 },
    kicker: { color: ink, fontSize: 12, fontWeight: "900" },
    title: { color: ink, fontSize: 31, lineHeight: 34, fontWeight: "900" },
    titleCompact: { fontSize: 27, lineHeight: 30 },
    subtitle: { color: muted, fontSize: 13, lineHeight: 18, fontWeight: "800" },
    livePill: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
    livePillText: { fontSize: 11, fontWeight: "900" },
    grid: { gap: spacing.md },
    compactGrid: { gap: spacing.sm },
    panel: {
      borderRadius: 24,
      backgroundColor: "rgba(255,255,255,0.92)",
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: "rgba(17,24,39,0.08)",
      gap: spacing.sm
    },
    sectionLabel: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    sectionNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#05070B", color: "#FFFFFF", textAlign: "center", lineHeight: 24, fontWeight: "900", fontSize: 11 },
    sectionTitle: { color: ink, fontSize: 16, fontWeight: "900" },
    identityGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    choiceTile: {
      width: "23.5%",
      minHeight: 96,
      borderRadius: 18,
      backgroundColor: "#F9FBFF",
      borderWidth: 1.5,
      borderColor: "rgba(17,24,39,0.07)",
      padding: spacing.xs,
      alignItems: "center",
      justifyContent: "center",
      gap: 7
    },
    choiceTileCompact: { width: "31.2%", minHeight: 94 },
    choiceTileActive: { backgroundColor: "#FFFFFF", shadowColor: shadow, shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 7 } },
    choiceIcon: { width: 38, height: 38, borderRadius: 15, alignItems: "center", justifyContent: "center" },
    choiceText: { color: ink, fontSize: 10, lineHeight: 12, fontWeight: "900", textAlign: "center" },
    layoutRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    layoutTile: {
      flexGrow: 1,
      flexBasis: "30%",
      minHeight: 54,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: "rgba(17,24,39,0.08)",
      backgroundColor: "#F9FBFF",
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      gap: 5
    },
    layoutTileActive: { backgroundColor: "#FFFFFF", borderWidth: 1.5 },
    layoutText: { color: ink, fontSize: 10, lineHeight: 13, fontWeight: "900", textAlign: "center" },
    behaviorRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    behaviorTile: {
      width: "48.5%",
      minHeight: 112,
      borderRadius: 19,
      backgroundColor: "#F9FBFF",
      borderWidth: 1,
      borderColor: "rgba(17,24,39,0.07)",
      padding: spacing.sm,
      gap: 5
    },
    behaviorTileActive: { borderWidth: 1.6, shadowColor: shadow, shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 7 } },
    behaviorIcon: { width: 32, height: 32, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    behaviorTitle: { color: ink, fontSize: 13, lineHeight: 16, fontWeight: "900" },
    behaviorDetail: { color: muted, fontSize: 10, lineHeight: 13, fontWeight: "800" },
    dnaGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    dnaTile: { width: "31.8%", minHeight: 86, borderRadius: 17, backgroundColor: "#F9FBFF", borderWidth: 1, borderColor: "rgba(17,24,39,0.07)", padding: spacing.xs, gap: 4 },
    dnaTileActive: { borderWidth: 1.5, backgroundColor: "#FFFFFF" },
    dnaIcon: { width: 28, height: 28, borderRadius: 11, alignItems: "center", justifyContent: "center" },
    dnaTitle: { color: ink, fontSize: 10, lineHeight: 12, fontWeight: "900" },
    dnaDetail: { color: muted, fontSize: 9, fontWeight: "800" },
    watchRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    watchPill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, backgroundColor: "#F9FBFF", borderWidth: 1, borderColor: "rgba(17,24,39,0.07)", paddingHorizontal: 10, paddingVertical: 7 },
    watchPillActive: { backgroundColor: "#FFFFFF", borderWidth: 1.5 },
    watchIcon: { width: 24, height: 24, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    watchText: { color: ink, fontSize: 10, fontWeight: "900" },
    pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    pill: { borderRadius: 999, backgroundColor: "#F9FBFF", borderWidth: 1, borderColor: "rgba(17,24,39,0.07)", paddingHorizontal: 11, paddingVertical: 8 },
    pillActive: { borderWidth: 1.5 },
    pillText: { color: muted, fontSize: 10, fontWeight: "900" },
    phoneOuter: {
      borderRadius: 44,
      backgroundColor: "#05070B",
      padding: 7,
      shadowColor: "#05070B",
      shadowOpacity: 0.26,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 }
    },
    phoneOuterCompact: { borderRadius: 40, padding: 6 },
    phone: {
      minHeight: 565,
      borderRadius: 36,
      padding: spacing.md,
      gap: spacing.sm,
      overflow: "hidden"
    },
    phoneCompact: { minHeight: 510 },
    phoneWash: { position: "absolute", left: -30, right: -30, top: -18, height: 178, opacity: 0.72, borderBottomLeftRadius: 70, borderBottomRightRadius: 70 },
    phoneGlow: { position: "absolute", right: -52, top: 84, width: 154, height: 154, borderRadius: 77, opacity: 0.2 },
    island: { alignSelf: "center", width: 118, height: 30, borderRadius: 999, backgroundColor: "#000000", marginBottom: 2 },
    phoneHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
    phoneEyebrow: { color: "rgba(255,255,255,0.62)", fontSize: 11, lineHeight: 15, fontWeight: "900" },
    phoneTitle: { color: "#FFFFFF", fontSize: 25, lineHeight: 30, fontWeight: "900" },
    phoneLive: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    phoneLiveText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
    phoneMeta: { color: "rgba(255,255,255,0.70)", fontSize: 12, lineHeight: 16, fontWeight: "800" },
    weekStrip: { flexDirection: "row", justifyContent: "space-between", gap: 5 },
    dayPill: { flex: 1, borderRadius: 14, paddingVertical: 6, alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)" },
    dayText: { color: "rgba(255,255,255,0.58)", fontSize: 9, fontWeight: "900" },
    dayNumber: { color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: "900" },
    dayTextActive: { color: "#FFFFFF" },
    previewWidgetRow: { flexDirection: "row", gap: spacing.xs },
    previewWidget: { flex: 1, minHeight: 78, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", padding: spacing.xs, gap: 2 },
    previewWidgetIcon: { width: 26, height: 26, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    previewWidgetValue: { color: "#FFFFFF", fontSize: 17, lineHeight: 20, fontWeight: "900" },
    previewWidgetLabel: { color: "rgba(255,255,255,0.68)", fontSize: 9, lineHeight: 12, fontWeight: "900" },
    previewCardStack: { gap: spacing.xs },
    feedCard: {
      minHeight: 82,
      borderRadius: 22,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      shadowColor: "#000000",
      shadowOpacity: 0.16,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 }
    },
    feedIcon: { width: 32, height: 32, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" },
    feedCopy: { flex: 1, minWidth: 0, gap: 2 },
    feedTopLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
    feedTitle: { flex: 1, color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
    impactBadge: { color: "#FFFFFF", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 999, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 3, fontSize: 9, fontWeight: "900" },
    feedMeta: { color: "rgba(255,255,255,0.78)", fontSize: 11, fontWeight: "800" },
    feedReason: { color: "#FFFFFF", fontSize: 12, lineHeight: 16, fontWeight: "900" },
    phoneTabBar: { marginTop: "auto", minHeight: 52, borderRadius: 22, backgroundColor: "rgba(0,0,0,0.28)", flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
    phoneTab: { alignItems: "center", gap: 3 },
    phoneTabText: { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "900" }
  });
}
