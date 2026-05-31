import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CirclePlus,
  Dumbbell,
  Flame,
  Gauge,
  GraduationCap,
  HeartPulse,
  LayoutGrid,
  Music,
  Palette,
  Rocket,
  Sparkles,
  Timer,
  Trophy,
  Watch
} from "lucide-react-native";
import {
  Assignment,
  Course,
  FocusSession,
  FrictionPoint,
  OSBehavior,
  ParsedImport,
  Semester,
  StudentDNAIdentity,
  StudentDNALayout,
  StudyNote,
  UserSettings,
  WidgetDNA,
  WidgetPalette,
  WidgetPreset
} from "../models";
import { AppButton } from "../components/AppButton";
import {
  SPButton,
  SPCard,
  SPInsightCard,
  SPMetricTile,
  SPPreviewPhone,
  SPProgressRing,
  SPSectionHeader,
  SPWatchPreviewCard,
  SPWidgetPreviewCard
} from "../components/SPDesignSystem";
import { AppTheme, themePalettes } from "../theme";
import { useAppTheme } from "../themeContext";
import { useI18n, type SupportedLocale } from "../i18n";
import { buildStudentLifeOS, defaultWatchDNA, defaultWidgetDNA, resolveStudentDNA } from "../logic/studentLifeOS";
import type { WidgetSyncStatus } from "../services/widgetSnapshot";
import { buildCanonicalWidgetPreset, widgetKindForType } from "../widgets/widgetPresets";

type LifeStudioScreenProps = {
  assignments: Assignment[];
  courses: Course[];
  notes?: StudyNote[];
  focusSessions?: FocusSession[];
  semester: Semester;
  parsedImports: ParsedImport[];
  demoMode?: boolean;
  settings: UserSettings;
  widgetPresets: WidgetPreset[];
  nativeWidgetStatus: WidgetSyncStatus;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onSaveWidgetPreset: (preset: WidgetPreset) => void;
  onResetWidgetPresets: () => void;
  locale?: SupportedLocale;
  onLocaleChange?: (locale: SupportedLocale) => void;
  onOpenNotes: () => void;
  onOpenFocus: () => void;
  onOpenGrades: () => void;
};

const identityOptions: Array<{
  id: StudentDNAIdentity;
  labelKey: string;
  fallback: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  color: string;
}> = [
  { id: "focused_scholar", labelKey: "life_studio.identity_focused_scholar", fallback: "Focused Scholar", icon: Brain, color: "#7C3AED" },
  { id: "active_athlete", labelKey: "life_studio.identity_active_athlete", fallback: "Active Athlete", icon: Dumbbell, color: "#2563EB" },
  { id: "creative_artist", labelKey: "life_studio.identity_creative_artist", fallback: "Creative Artist", icon: Music, color: "#DB2777" },
  { id: "competitive_leader", labelKey: "life_studio.identity_competitive_leader", fallback: "Competitive Leader", icon: Trophy, color: "#EA580C" },
  { id: "balanced_wellness", labelKey: "life_studio.identity_balanced_wellness", fallback: "Balanced Wellness", icon: HeartPulse, color: "#16A34A" },
  { id: "working_professional", labelKey: "life_studio.identity_working_professional", fallback: "Working Professional", icon: BriefcaseBusiness, color: "#C2410C" },
  { id: "curious_explorer", labelKey: "life_studio.identity_curious_explorer", fallback: "Curious Explorer", icon: Sparkles, color: "#9333EA" },
  { id: "research_driven", labelKey: "life_studio.identity_research_driven", fallback: "Research Driven", icon: Gauge, color: "#0891B2" }
];

const layoutOptions: Array<{ id: StudentDNALayout; labelKey: string; fallback: string; icon: React.ComponentType<{ color: string; size: number }> }> = [
  { id: "feed_first", labelKey: "life_studio.layout_feed_first", fallback: "Feed first", icon: LayoutGrid },
  { id: "timeline", labelKey: "life_studio.layout_timeline", fallback: "Timeline", icon: CalendarDays },
  { id: "focus_first", labelKey: "life_studio.layout_focus_first", fallback: "Focus first", icon: Timer },
  { id: "split_view", labelKey: "life_studio.layout_split_view", fallback: "Split view", icon: BarChart3 },
  { id: "minimal", labelKey: "life_studio.layout_minimal", fallback: "Minimal", icon: Sparkles }
];

const behaviorOptions: Array<{ id: OSBehavior; labelKey: string; fallback: string; icon: React.ComponentType<{ color: string; size: number }> }> = [
  { id: "highest_gpa", labelKey: "life_studio.behavior_highest_gpa", fallback: "Highest GPA", icon: GraduationCap },
  { id: "less_stress", labelKey: "life_studio.behavior_less_stress", fallback: "Less Stress", icon: HeartPulse },
  { id: "athletic_performance", labelKey: "life_studio.behavior_athletic_performance", fallback: "Athletic Performance", icon: Dumbbell },
  { id: "life_balance", labelKey: "life_studio.behavior_life_balance", fallback: "Life Balance", icon: Activity },
  { id: "high_achievement", labelKey: "life_studio.behavior_high_achievement", fallback: "High Achievement", icon: Rocket }
];

const frictionOptions: Array<{ id: FrictionPoint; labelKey: string; fallback: string }> = [
  { id: "procrastination", labelKey: "life_studio.friction_procrastination", fallback: "Procrastination" },
  { id: "exam_anxiety", labelKey: "life_studio.friction_exam_anxiety", fallback: "Exam Anxiety" },
  { id: "overcommitment", labelKey: "life_studio.friction_overcommitment", fallback: "Overcommitment" },
  { id: "focus_issues", labelKey: "life_studio.friction_focus_issues", fallback: "Focus Issues" },
  { id: "forgetfulness", labelKey: "life_studio.friction_forgetfulness", fallback: "Forgetfulness" }
];

const vibeOptions: Array<{ id: WidgetPalette; labelKey: string; fallback: string }> = [
  { id: "lavender", labelKey: "more.palette_lavender", fallback: "Calm AI" },
  { id: "midnight", labelKey: "more.palette_midnight", fallback: "Midnight" },
  { id: "ocean", labelKey: "more.palette_ocean", fallback: "Ocean" },
  { id: "forest", labelKey: "more.palette_forest", fallback: "Forest" },
  { id: "sunset", labelKey: "more.palette_sunset", fallback: "Sunset" },
  { id: "candy", labelKey: "more.palette_candy", fallback: "Custom" }
];

export function LifeStudioScreen({
  assignments,
  courses,
  notes = [],
  focusSessions = [],
  semester,
  parsedImports,
  demoMode = false,
  settings,
  widgetPresets,
  nativeWidgetStatus,
  onUpdateSettings,
  onSaveWidgetPreset,
  onResetWidgetPresets,
  locale: activeLocale,
  onLocaleChange,
  onOpenNotes,
  onOpenFocus,
  onOpenGrades
}: LifeStudioScreenProps) {
  const { theme } = useAppTheme();
  const { t, locale } = useI18n();
  const { width } = useWindowDimensions();
  const styles = createStyles(theme, width >= 980);
  const savedDNA = resolveStudentDNA(settings);
  const [identity, setIdentity] = useState<StudentDNAIdentity>(savedDNA.identity);
  const [layout, setLayout] = useState<StudentDNALayout>(savedDNA.layout);
  const [vibe, setVibe] = useState<WidgetPalette>(
    savedDNA.colorVibe === "custom" ? "ocean" : savedDNA.colorVibe
  );
  const [behavior, setBehavior] = useState<OSBehavior>(settings.osBehavior || "highest_gpa");
  const [frictionPoints, setFrictionPoints] = useState<FrictionPoint[]>(settings.frictionPoints || ["procrastination"]);
  const [widgetPriorities, setWidgetPriorities] = useState(settings.widgetDNA?.priorities || defaultWidgetDNA(behavior).priorities);
  const [watchComplications, setWatchComplications] = useState(settings.watchDNA?.complications || defaultWatchDNA(behavior).complications);
  const studioSettings = useMemo<UserSettings>(
    () => ({
      ...settings,
      studentDNA: { identity, layout, colorVibe: vibe },
      osBehavior: behavior,
      frictionPoints,
      widgetDNA: { priorities: widgetPriorities, adaptiveOrdering: true },
      watchDNA: { complications: watchComplications, glanceDensity: "standard" }
    }),
    [behavior, frictionPoints, identity, layout, settings, vibe, watchComplications, widgetPriorities]
  );
  const lifeOS = buildStudentLifeOS({ assignments, courses, notes, focusSessions, settings: studioSettings });
  const identityOption = identityOptions.find((option) => option.id === identity) || identityOptions[0];
  const behaviorOption = behaviorOptions.find((option) => option.id === behavior) || behaviorOptions[0];
  const nativeStatusLabel =
    nativeWidgetStatus.state === "synced"
      ? t("more.status_synced", "Synced")
      : nativeWidgetStatus.state === "unavailable"
        ? t("more.status_build_needed", "Build needed")
        : t("more.status_needs_install", "Needs install");
  const localeValue = activeLocale || locale;
  const importedCount = parsedImports.reduce((sum, item) => sum + item.itemCount, 0);
  const previewPalette = vibe in themePalettes ? vibe : "ocean";

  const toggleFriction = (value: FrictionPoint) => {
    setFrictionPoints((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value].slice(0, 4)
    );
  };

  const toggleWidgetPriority = (value: (typeof widgetPriorities)[number]) => {
    setWidgetPriorities((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value].slice(0, 5)
    );
  };

  const toggleWatchComplication = (value: (typeof watchComplications)[number]) => {
    setWatchComplications((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value].slice(0, 5)
    );
  };

  const saveLifeOS = () => {
    onUpdateSettings({
      selectedTheme: vibe,
      defaultWidgetStyle: "glass",
      studentDNA: { identity, layout, colorVibe: vibe },
      osBehavior: behavior,
      frictionPoints,
      widgetDNA: { priorities: widgetPriorities, adaptiveOrdering: true },
      watchDNA: { complications: watchComplications, glanceDensity: "standard" }
    });
    const widgetType: WidgetPreset["type"] = widgetPriorities.includes("grade_impact")
      ? "class_focus"
      : widgetPriorities.includes("free_time_forecast")
        ? "week"
        : "today";
    const widgetKind = widgetKindForType(widgetType);
    onSaveWidgetPreset(
      buildCanonicalWidgetPreset(widgetKind, {
        type: widgetType,
        name: t("life_studio.saved_widget_name", "Student Life OS"),
        background: "glass",
        palette: vibe,
        dataMode: widgetType === "class_focus" ? "single_class" : widgetType === "week" ? "this_week" : "today",
        layout: widgetType === "class_focus" ? "progress" : widgetType === "week" ? "strip" : "list",
        iconKey: "spark",
        classFocusCourseId: widgetType === "class_focus" ? courses[0]?.id : undefined,
        themePackId: vibe
      })
    );
  };

  const cycleLocale = () => {
    if (!onLocaleChange) return;
    const locales: SupportedLocale[] = ["en-US", "es", "fr", "de", "ja", "ko", "ar", "hi", "pt-BR", "zh-Hans"];
    const currentIndex = locales.indexOf(localeValue);
    onLocaleChange(locales[(currentIndex + 1) % locales.length] || "en-US");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Sparkles color="#FFFFFF" size={22} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>{t("life_studio.eyebrow", "Life Studio")}</Text>
          <Text style={styles.heroTitle}>{t("life_studio.title", "Design your life OS.")}</Text>
          <Text style={styles.heroText}>
            {t("life_studio.subtitle", "Every choice changes the feed, widgets, watch, colors, and forecast behavior.")}
          </Text>
        </View>
        <View style={styles.heroActions}>
          <AppButton label={t("life_studio.save_os", "Save OS")} icon={BadgeCheck} onPress={saveLifeOS} style={styles.heroButton} />
          <AppButton label={nativeStatusLabel} icon={Watch} variant="secondary" onPress={onResetWidgetPresets} style={styles.heroButton} />
        </View>
      </View>

      <View style={styles.workbench}>
        <View style={styles.leftRail}>
          <RailItem number="1" title={t("life_studio.identity", "Identity")} detail={identityOption ? t(identityOption.labelKey, identityOption.fallback) : ""} active />
          <RailItem number="2" title={t("life_studio.layout", "Layout")} detail={layoutLabel(layout, t)} />
          <RailItem number="3" title={t("life_studio.widget_dna", "Widget DNA")} detail={`${widgetPriorities.length} ${t("life_studio.selected", "selected")}`} />
          <RailItem number="4" title={t("life_studio.watch_dna", "Watch DNA")} detail={`${watchComplications.length} ${t("life_studio.complications", "complications")}`} />
          <RailItem number="5" title={t("life_studio.os_behavior", "OS Behavior")} detail={behaviorOption ? t(behaviorOption.labelKey, behaviorOption.fallback) : ""} />
          <RailItem number="6" title={t("life_studio.friction_points", "Friction Points")} detail={`${frictionPoints.length} ${t("life_studio.signals", "signals")}`} />
        </View>

        <View style={styles.configRail}>
          <SPSectionHeader title={t("life_studio.choose_identity", "Choose your identity")} note={t("life_studio.identity_note", "This influences your default OS.")} />
          <View style={styles.identityGrid}>
            {identityOptions.map((option) => {
              const active = option.id === identity;
              const Icon = option.icon;
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={option.id}
                  style={[styles.identityCard, active ? [styles.identityCardActive, { borderColor: option.color }] : null]}
                  onPress={() => setIdentity(option.id)}
                >
                  <View style={[styles.identityIcon, { backgroundColor: `${option.color}16` }]}>
                    <Icon color={option.color} size={22} />
                  </View>
                  <Text style={styles.identityLabel}>{t(option.labelKey, option.fallback)}</Text>
                  {active ? <View style={[styles.checkBadge, { backgroundColor: option.color }]}><Check color="#FFFFFF" size={12} /></View> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <SPSectionHeader title={t("life_studio.pick_layout", "Pick your layout")} note={t("life_studio.layout_note", "How your feed is structured.")} />
          <View style={styles.layoutRail}>
            {layoutOptions.map((option) => (
              <SPButton
                key={option.id}
                label={t(option.labelKey, option.fallback)}
                icon={option.icon}
                selected={layout === option.id}
                onPress={() => setLayout(option.id)}
                style={styles.layoutButton}
              />
            ))}
          </View>

          <SPSectionHeader title={t("life_studio.choose_vibe", "Choose your vibe")} note={t("life_studio.vibe_note", "Make it feel like you.")} />
          <View style={styles.vibeRail}>
            {vibeOptions.map((option) => {
              const palette = themePalettes[option.id];
              const active = vibe === option.id;
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={option.id}
                  style={[styles.vibeSwatch, active ? styles.vibeSwatchActive : null]}
                  onPress={() => setVibe(option.id)}
                >
                  <View style={[styles.vibeOrb, { backgroundColor: palette[1] || "#315BFF" }]} />
                  <Text style={styles.vibeLabel}>{t(option.labelKey, option.fallback)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <SPSectionHeader title={t("life_studio.widget_dna", "Widget DNA")} note={t("life_studio.widget_note", "Choose what your widgets optimize for.")} />
          <View style={styles.dnaGrid}>
            {defaultWidgetDNA(behavior).priorities.map((priority) => (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: widgetPriorities.includes(priority) }}
                key={priority}
                style={[styles.dnaCard, widgetPriorities.includes(priority) ? styles.dnaCardActive : null]}
                onPress={() => toggleWidgetPriority(priority)}
              >
                <Text style={styles.dnaTitle}>{widgetPriorityLabel(priority, t)}</Text>
                <Text style={styles.dnaDetail}>{widgetPriorityDetail(priority, t)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <SPSectionHeader title={t("life_studio.watch_dna", "Watch DNA")} note={t("life_studio.watch_note", "Pick complications that matter most.")} />
          <View style={styles.watchRail}>
            {defaultWatchDNA(behavior).complications.map((complication) => (
              <SPButton
                key={complication}
                label={watchComplicationLabel(complication, t)}
                icon={Watch}
                selected={watchComplications.includes(complication)}
                onPress={() => toggleWatchComplication(complication)}
                style={styles.watchButton}
              />
            ))}
          </View>
        </View>

        <View style={styles.previewColumn}>
          <SPPreviewPhone
            title={t("life_studio.preview_title", "Your Life OS Preview")}
            subtitle={`${t("life_studio.behavior_label", "Behavior")}: ${behaviorOption ? t(behaviorOption.labelKey, behaviorOption.fallback) : ""}`}
            behavior={identityOption ? t(identityOption.labelKey, identityOption.fallback) : ""}
            palette={previewPalette}
            items={lifeOS.feedItems}
          />
          <View style={styles.previewMetrics}>
            <SPMetricTile label={t("life_studio.workload", "Workload")} value={`${lifeOS.workloadScore}`} detail={lifeOS.busiestDayLabel} accent="#2563EB" />
            <SPMetricTile label={t("life_studio.free_time", "Free Time")} value={`${lifeOS.freeTimeHours.toFixed(1)}h`} detail={lifeOS.focusWindowLabel} accent="#16A34A" />
            <SPMetricTile label={t("life_studio.risk", "Risk")} value={`${lifeOS.stressScore}`} detail={t("life_studio.forecast", "forecast")} accent="#EA580C" />
          </View>
        </View>

        <View style={styles.rightRail}>
          <SPSectionHeader title={t("life_studio.os_behavior", "OS Behavior")} note={t("life_studio.behavior_note", "How your OS adapts.")} />
          <View style={styles.behaviorGrid}>
            {behaviorOptions.map((option) => (
              <SPButton
                key={option.id}
                label={t(option.labelKey, option.fallback)}
                icon={option.icon}
                selected={behavior === option.id}
                onPress={() => {
                  setBehavior(option.id);
                  setWidgetPriorities(defaultWidgetDNA(option.id).priorities);
                  setWatchComplications(defaultWatchDNA(option.id).complications);
                }}
                style={styles.behaviorButton}
              />
            ))}
          </View>

          <SPSectionHeader title={t("life_studio.friction_points", "Friction Points")} note={t("life_studio.friction_note", "What causes problems?")} />
          <View style={styles.frictionRail}>
            {frictionOptions.map((option) => (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: frictionPoints.includes(option.id) }}
                key={option.id}
                style={[styles.frictionChip, frictionPoints.includes(option.id) ? styles.frictionChipActive : null]}
                onPress={() => toggleFriction(option.id)}
              >
                <Text style={[styles.frictionText, frictionPoints.includes(option.id) ? styles.frictionTextActive : null]}>
                  {t(option.labelKey, option.fallback)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <SPSectionHeader title={t("life_studio.watch_preview", "Watch & Island Preview")} note={t("life_studio.everything_adapts", "Everything adapts.")} />
          <View style={styles.watchPreviewRow}>
            <SPWatchPreviewCard title={t("life_studio.next_class", "Next Class")} value={lifeOS.feedItems.find((item) => item.type === "class")?.title || "--"} detail={lifeOS.focusWindowLabel} accent="#7C3AED" />
            <View style={styles.islandStack}>
              <SPWidgetPreviewCard title={t("life_studio.exam_countdown", "Exam Countdown")} value={lifeOS.examClusterCount ? `${lifeOS.examClusterCount}` : "Clear"} detail={t("life_studio.high_impact", "High impact")} accent="#D92D4B" />
              <SPWidgetPreviewCard title={t("life_studio.free_time", "Free Time")} value={`${lifeOS.freeTimeHours.toFixed(1)}h`} detail={t("life_studio.this_week", "this week")} accent="#16A34A" />
            </View>
          </View>

          <SPSectionHeader title={t("life_studio.live_preview", "Live Preview: Your Life OS")} note={demoMode ? t("life_studio.demo_data", "Demo data") : t("life_studio.real_data", "Real planner data")} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.miniPhones}>
            {behaviorOptions.map((option) => (
              <View key={option.id} style={styles.miniPhoneWrap}>
                <View style={[styles.miniPhone, behavior === option.id ? styles.miniPhoneActive : null]}>
                  <View style={[styles.miniPhoneScreen, { backgroundColor: behaviorColor(option.id) }]}>
                    <View style={styles.miniPhoneBar} />
                    <View style={styles.miniPhoneLine} />
                    <View style={styles.miniPhoneLineShort} />
                    <View style={styles.miniPhoneCard} />
                    <View style={styles.miniPhoneCard} />
                  </View>
                </View>
                <Text style={styles.miniPhoneLabel} numberOfLines={1}>{t(option.labelKey, option.fallback)}</Text>
              </View>
            ))}
          </ScrollView>

          <SPCard style={styles.operatingCard}>
            <View style={styles.operatingTop}>
              <SPProgressRing value={lifeOS.workloadScore / 100} size={58} accent="#315BFF" />
              <View style={styles.operatingCopy}>
                <Text style={styles.operatingTitle}>{t("life_studio.os_in_action", "Your OS in action")}</Text>
                <Text style={styles.operatingDetail}>
                  {t("life_studio.os_in_action_detail", "Feed, widgets, watch, and recommendations are connected.")}
                </Text>
              </View>
            </View>
            {lifeOS.insights.slice(0, 2).map((insight) => (
              <SPInsightCard key={insight.id} insight={insight} />
            ))}
            <View style={styles.utilityRow}>
              <SPButton label={t("tabs.notes", "Notes")} icon={Palette} quiet onPress={onOpenNotes} style={styles.utilityButton} />
              <SPButton label={t("tabs.focus", "Focus")} icon={Timer} quiet onPress={onOpenFocus} style={styles.utilityButton} />
              <SPButton label={t("tabs.grades", "Grades")} icon={Flame} quiet onPress={onOpenGrades} style={styles.utilityButton} />
              <SPButton label={localeValue} icon={CirclePlus} quiet onPress={cycleLocale} style={styles.utilityButton} />
            </View>
            <Text style={styles.dataNote}>
              {t("life_studio.data_note", "Local-first: no API keys, no external AI, no LLM dependency.")}
              {" "}
              {t("life_studio.source_note", "{count} imported source rows.").replace("{count}", String(importedCount))}
              {" "}
              {semester.name}
            </Text>
          </SPCard>
        </View>
      </View>
    </View>
  );
}

function RailItem({ number, title, detail, active = false }: { number: string; title: string; detail: string; active?: boolean }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme, false);
  return (
    <View style={[styles.railItem, active ? styles.railItemActive : null]}>
      <Text style={[styles.railNumber, active ? styles.railNumberActive : null]}>{number}</Text>
      <View style={styles.railCopy}>
        <Text style={styles.railTitle}>{title}</Text>
        <Text style={styles.railDetail} numberOfLines={1}>{detail}</Text>
      </View>
    </View>
  );
}

function layoutLabel(layout: StudentDNALayout, t: (key: string, fallback?: string) => string) {
  const option = layoutOptions.find((item) => item.id === layout);
  return option ? t(option.labelKey, option.fallback) : layout;
}

function widgetPriorityLabel(value: WidgetDNA["priorities"][number], t: (key: string, fallback?: string) => string) {
  return t(`life_studio.widget_${value}`, String(value).replace(/_/g, " "));
}

function widgetPriorityDetail(value: string, t: (key: string, fallback?: string) => string) {
  const details: Record<string, string> = {
    exam_countdown: t("life_studio.widget_exam_countdown_detail", "Track important exams"),
    free_time_forecast: t("life_studio.widget_free_time_detail", "Protect your time"),
    next_class: t("life_studio.widget_next_class_detail", "Always know what's next"),
    practice_countdown: t("life_studio.widget_practice_detail", "Balance sport and school"),
    life_balance_ring: t("life_studio.widget_balance_detail", "Balance all of it"),
    grade_impact: t("life_studio.widget_grade_detail", "See what moves grades"),
    future_risk: t("life_studio.widget_risk_detail", "Surface problems early"),
    focus_window: t("life_studio.widget_focus_detail", "Find when to focus")
  };
  return details[value] || t("life_studio.widget_default_detail", "Adapts your OS");
}

function watchComplicationLabel(value: string, t: (key: string, fallback?: string) => string) {
  return t(`life_studio.watch_${value}`, value.replace(/_/g, " "));
}

function behaviorColor(behavior: OSBehavior) {
  if (behavior === "less_stress") return "#0F766E";
  if (behavior === "athletic_performance") return "#0B4E95";
  if (behavior === "life_balance") return "#B45309";
  if (behavior === "high_achievement") return "#581C87";
  return "#9F1239";
}

function createStyles(theme: AppTheme, wide: boolean) {
  const { colors, radii, spacing } = theme;
  return StyleSheet.create({
    screen: {
      gap: spacing.md
    },
    hero: {
      borderRadius: 30,
      backgroundColor: theme.isDark ? colors.surface : "#FFFFFF",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.13)" : "#E4E8F0",
      padding: spacing.md,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: spacing.md,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.14 : 0.08,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 3
    },
    logoMark: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: "#111827",
      alignItems: "center",
      justifyContent: "center"
    },
    heroCopy: {
      flex: 1,
      minWidth: 220,
      gap: 2
    },
    heroEyebrow: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 19,
      fontWeight: "900"
    },
    heroTitle: {
      color: colors.ink,
      fontSize: 31,
      lineHeight: 36,
      fontWeight: "900",
      letterSpacing: 0
    },
    heroText: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    heroActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    heroButton: {
      minWidth: 128
    },
    workbench: {
      flexDirection: wide ? "row" : "column",
      alignItems: wide ? "flex-start" : "stretch",
      gap: spacing.md
    },
    leftRail: {
      width: wide ? 190 : "100%",
      gap: spacing.xs
    },
    configRail: {
      flex: wide ? 1.2 : undefined,
      minWidth: wide ? 330 : undefined,
      gap: spacing.sm
    },
    previewColumn: {
      width: wide ? 286 : "100%",
      alignItems: "center",
      gap: spacing.sm
    },
    rightRail: {
      flex: wide ? 1 : undefined,
      minWidth: wide ? 310 : undefined,
      gap: spacing.sm
    },
    railItem: {
      minHeight: 60,
      borderRadius: 18,
      backgroundColor: theme.isDark ? colors.surface : "#FFFFFF",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.11)" : "#E5EAF2",
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    railItemActive: {
      borderColor: `${colors.accent}66`,
      backgroundColor: theme.isDark ? colors.surfaceAlt : "#F5F7FF"
    },
    railNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      overflow: "hidden",
      textAlign: "center",
      paddingTop: 3,
      backgroundColor: colors.surfaceAlt,
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    railNumberActive: {
      backgroundColor: colors.accent,
      color: colors.accentText
    },
    railCopy: {
      flex: 1,
      minWidth: 0
    },
    railTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: "900"
    },
    railDetail: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    identityGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    identityCard: {
      flexGrow: 1,
      flexBasis: "23%",
      minWidth: 112,
      minHeight: 116,
      borderRadius: 20,
      backgroundColor: theme.isDark ? colors.surface : "#FFFFFF",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.12)" : "#E4E8F0",
      padding: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    },
    identityCardActive: {
      borderWidth: 1.5,
      backgroundColor: theme.isDark ? colors.surfaceAlt : "#FFFFFF"
    },
    identityIcon: {
      width: 40,
      height: 40,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center"
    },
    identityLabel: {
      color: colors.ink,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textAlign: "center"
    },
    checkBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center"
    },
    layoutRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    layoutButton: {
      flexGrow: 1,
      minWidth: 104
    },
    vibeRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    vibeSwatch: {
      minWidth: 78,
      borderRadius: 18,
      backgroundColor: theme.isDark ? colors.surface : "#FFFFFF",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.12)" : "#E4E8F0",
      padding: spacing.sm,
      alignItems: "center",
      gap: 6
    },
    vibeSwatchActive: {
      borderColor: colors.accent,
      backgroundColor: theme.isDark ? colors.surfaceAlt : "#F5F7FF"
    },
    vibeOrb: {
      width: 30,
      height: 30,
      borderRadius: 15
    },
    vibeLabel: {
      color: colors.ink,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    dnaGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    dnaCard: {
      flexGrow: 1,
      flexBasis: "47%",
      minHeight: 96,
      borderRadius: 20,
      backgroundColor: theme.isDark ? colors.surface : "#FFFFFF",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.12)" : "#E4E8F0",
      padding: spacing.sm,
      gap: 5
    },
    dnaCardActive: {
      borderColor: colors.accent,
      backgroundColor: theme.isDark ? colors.surfaceAlt : "#F5F7FF"
    },
    dnaTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900",
      textTransform: "capitalize"
    },
    dnaDetail: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "700"
    },
    watchRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    watchButton: {
      flexGrow: 1,
      minWidth: 106
    },
    previewMetrics: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    behaviorGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    behaviorButton: {
      flexGrow: 1,
      minWidth: 128
    },
    frictionRail: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    frictionChip: {
      borderRadius: radii.round,
      backgroundColor: theme.isDark ? colors.surface : "#FFFFFF",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.12)" : "#E4E8F0",
      paddingHorizontal: spacing.sm,
      paddingVertical: 8
    },
    frictionChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    frictionText: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    frictionTextActive: {
      color: colors.accentText
    },
    watchPreviewRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      alignItems: "center"
    },
    islandStack: {
      flex: 1,
      minWidth: 150,
      gap: spacing.xs
    },
    miniPhones: {
      gap: spacing.sm,
      paddingBottom: 4
    },
    miniPhoneWrap: {
      width: 72,
      gap: 6,
      alignItems: "center"
    },
    miniPhone: {
      width: 60,
      height: 116,
      borderRadius: 18,
      padding: 4,
      backgroundColor: "#0A0F1A"
    },
    miniPhoneActive: {
      borderWidth: 2,
      borderColor: colors.accent
    },
    miniPhoneScreen: {
      flex: 1,
      borderRadius: 14,
      padding: 7,
      gap: 5
    },
    miniPhoneBar: {
      width: 24,
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(255,255,255,0.6)",
      alignSelf: "center"
    },
    miniPhoneLine: {
      height: 5,
      borderRadius: 3,
      backgroundColor: "rgba(255,255,255,0.75)"
    },
    miniPhoneLineShort: {
      width: "70%",
      height: 5,
      borderRadius: 3,
      backgroundColor: "rgba(255,255,255,0.5)"
    },
    miniPhoneCard: {
      height: 20,
      borderRadius: 7,
      backgroundColor: "rgba(255,255,255,0.24)"
    },
    miniPhoneLabel: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textAlign: "center"
    },
    operatingCard: {
      gap: spacing.sm
    },
    operatingTop: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "center"
    },
    operatingCopy: {
      flex: 1,
      minWidth: 0
    },
    operatingTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    operatingDetail: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    utilityRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    utilityButton: {
      flexGrow: 1,
      minWidth: 92
    },
    dataNote: {
      color: colors.faint,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "700"
    }
  });
}
