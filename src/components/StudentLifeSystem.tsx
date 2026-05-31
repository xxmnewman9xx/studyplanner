import React from "react";
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { ArrowRight, Sparkles } from "lucide-react-native";

import { FrictionPoint, OSBehavior, StudentDNA, UserSettings, WatchDNA, WidgetDNA } from "../models";
import { useAppTheme } from "../themeContext";
import { useI18n } from "../i18n";

export type LifeSurface =
  | "onboarding"
  | "paywall"
  | "feed"
  | "scan"
  | "review"
  | "forecast"
  | "classes"
  | "focus"
  | "notes"
  | "life"
  | "grades"
  | "empty"
  | "error"
  | "success";

export type LifeMetric = {
  label: string;
  value: string;
  detail?: string;
  color?: string;
};

export type LifeAction = {
  label: string;
  onPress?: () => void;
};

type LifeSurfaceCopy = {
  eyebrow: string;
  title: string;
  detail: string;
  action: string;
};

type TranslateFn = (key: string, fallback?: string) => string;

export type LifeTokenSet = {
  identity: StudentDNA;
  behavior: OSBehavior;
  frictionPoints: FrictionPoint[];
  widgetDNA: WidgetDNA[];
  watchDNA: WatchDNA[];
  identityLabel: string;
  behaviorLabel: string;
  behaviorDetail: string;
  accent: string;
  accent2: string;
  accent3: string;
  soft: string;
  ink: string;
  danger: string;
  success: string;
};

export const LifeStudioTokens = {
  identityLabels: {
    focused_scholar: "Focused Scholar",
    active_athlete: "Active Athlete",
    creative_artist: "Creative Artist",
    competitive_leader: "Competitive Leader",
    balanced_wellness: "Balanced Wellness",
    working_professional: "Working Professional",
    curious_explorer: "Curious Explorer",
    research_driven: "Research Driven"
  } satisfies Record<StudentDNA, string>,
  behaviorLabels: {
    highest_gpa: "Highest GPA",
    less_stress: "Less Stress",
    athletic_performance: "Athletic Performance",
    life_balance: "Life Balance",
    high_achievement: "High Achievement"
  } satisfies Record<OSBehavior, string>,
  behaviorDetails: {
    highest_gpa: "Grade-impact work rises first.",
    less_stress: "Recovery and free time stay visible.",
    athletic_performance: "Practice, recovery, and conflicts stay protected.",
    life_balance: "School, work, activity, and wellness stay mixed.",
    high_achievement: "Future risk and long-range planning rise."
  } satisfies Record<OSBehavior, string>,
  behaviorColors: {
    highest_gpa: ["#0A84FF", "#FF9F0A", "#FF375F"],
    less_stress: ["#0A84FF", "#30D158", "#64D2FF"],
    athletic_performance: ["#34C759", "#0A84FF", "#00C7BE"],
    life_balance: ["#FF9F0A", "#0A84FF", "#30D158"],
    high_achievement: ["#7C3AED", "#FF375F", "#0A84FF"]
  } satisfies Record<OSBehavior, [string, string, string]>
};

export const lifeTabBarTokens = {
  height: 68,
  radius: 26,
  background: "rgba(255,255,255,0.94)",
  activeBackground: "#F1F4FA",
  inactive: "#8A94A6",
  shadow: "rgba(17,24,39,0.08)"
};

export function getLifeStudioTokens(settings?: UserSettings): LifeTokenSet {
  const behavior = settings?.osBehavior || "highest_gpa";
  const identity = settings?.studentDNA || "focused_scholar";
  const colors = LifeStudioTokens.behaviorColors[behavior];

  return {
    identity,
    behavior,
    frictionPoints: settings?.frictionPoints?.length ? settings.frictionPoints : ["procrastination"],
    widgetDNA: settings?.widgetDNA?.length ? settings.widgetDNA : ["exam_countdown", "grade_impact", "free_time_forecast"],
    watchDNA: settings?.watchDNA?.length ? settings.watchDNA : ["next_class", "focus_window", "exam_risk"],
    identityLabel: LifeStudioTokens.identityLabels[identity],
    behaviorLabel: LifeStudioTokens.behaviorLabels[behavior],
    behaviorDetail: LifeStudioTokens.behaviorDetails[behavior],
    accent: colors[0],
    accent2: colors[1],
    accent3: colors[2],
    soft: `${colors[0]}14`,
    ink: "#111827",
    danger: "#FF375F",
    success: "#30D158"
  };
}

export function behaviorCopy(settings?: UserSettings) {
  const tokens = getLifeStudioTokens(settings);
  const friction = tokens.frictionPoints[0] || "procrastination";
  const frictionCopy: Record<FrictionPoint, string> = {
    procrastination: "Start with the smallest useful step.",
    exam_anxiety: "Break study into calmer blocks.",
    overcommitment: "Watch conflicts before they stack.",
    focus_issues: "Use shorter focus windows.",
    forgetfulness: "Keep reminders and watch signals visible."
  };

  return {
    identity: tokens.identityLabel,
    behavior: tokens.behaviorLabel,
    detail: tokens.behaviorDetail,
    friction: frictionCopy[friction]
  };
}

export function surfacePersonalityCopy(surface: LifeSurface, settings?: UserSettings, t?: TranslateFn): LifeSurfaceCopy {
  const tr: TranslateFn = t || ((_key, fallback = "") => fallback);
  const tokens = getLifeStudioTokens(settings);
  const copy = behaviorCopy(settings);
  const map: Record<LifeSurface, LifeSurfaceCopy> = {
    onboarding: {
      eyebrow: tr("life_os.onboarding_eyebrow", "Life Studio"),
      title: tr("life_os.onboarding_title", "Design your life OS."),
      detail: tr("life_os.onboarding_detail", "{identity} mode shapes your feed, widgets, watch, and forecast.").replace("{identity}", copy.identity),
      action: tr("common.continue", "Continue")
    },
    paywall: {
      eyebrow: tr("life_os.paywall_eyebrow", "StudyPlanner Plus"),
      title: tr("paywall.title", "Unlock your Student Life OS."),
      detail: tr("life_os.paywall_detail", "{behavior} unlocks full Life Studio, adaptive widgets, forecasting, and reminders.").replace("{behavior}", copy.behavior),
      action: tr("paywall.choose_plan", "Choose a Plan")
    },
    feed: {
      eyebrow: tr("life_os.feed_eyebrow", "Student Life Feed"),
      title: tokens.behavior === "less_stress" ? tr("life_os.feed_less_stress_title", "Keep today light.") : tr("life_os.feed_title", "Start with the right thing."),
      detail: `${copy.identity}: ${copy.friction}`,
      action: tr("life_os.open_next", "Open next")
    },
    scan: {
      eyebrow: tr("life_os.scan_eyebrow", "Syllabus AI"),
      title: tr("life_os.scan_title", "Add a syllabus."),
      detail: tr("life_os.scan_detail", "Scan, upload, or paste. Nothing is added until you confirm."),
      action: tr("life_os.review_import", "Review")
    },
    review: {
      eyebrow: tr("life_os.review_eyebrow", "Review Inbox"),
      title: tr("life_os.review_title", "Approve what AI found."),
      detail: tr("life_os.review_detail", "Fix dates, duplicates, and confidence before anything reaches Today."),
      action: tr("life_os.confirm_rows", "Confirm")
    },
    forecast: {
      eyebrow: tr("life_os.forecast_eyebrow", "Smart Forecast"),
      title: tokens.behavior === "less_stress" ? tr("life_os.forecast_less_stress_title", "Find the lighter path.") : tr("life_os.forecast_title", "Protect Thursday."),
      detail: `${copy.behavior}: ${tokens.behaviorDetail}`,
      action: tr("life_os.plan_focus", "Plan focus")
    },
    classes: {
      eyebrow: tr("life_os.classes_eyebrow", "Class OS"),
      title: tr("life_os.classes_title", "Open the class hub."),
      detail: tr("life_os.classes_detail", "Rooms, notes, open work, and grade context stay connected."),
      action: tr("life_os.add_class", "Add class")
    },
    focus: {
      eyebrow: tr("tabs.focus", "Focus"),
      title: tokens.behavior === "less_stress" ? tr("life_os.focus_less_stress_title", "Ten calm minutes.") : tr("life_os.focus_title", "Start a focus block."),
      detail: copy.friction,
      action: tr("life_os.start_focus", "Start focus")
    },
    notes: {
      eyebrow: tr("tabs.notes", "Notes"),
      title: tr("life_os.notes_title", "Capture the detail."),
      detail: tr("life_os.notes_detail", "Class context, asks, and reminders become useful planning signals."),
      action: tr("life_os.save_note", "Save note")
    },
    life: {
      eyebrow: tr("life_os.life_eyebrow", "Life Studio"),
      title: tr("life_os.life_title", "Personalize your feed, widgets, and watch."),
      detail: tr("life_os.life_detail", "{identity} + {behavior} changes previews, widgets, watch, and tone.")
        .replace("{identity}", copy.identity)
        .replace("{behavior}", copy.behavior),
      action: tr("life_os.tune_life_os", "Tune Life OS")
    },
    grades: {
      eyebrow: tr("life_os.grades_eyebrow", "Grade Impact"),
      title: tr("life_os.grades_title", "Know what protects your GPA."),
      detail: tr("life_os.grades_detail", "Scores, target gaps, and next-test math stay tied to the plan."),
      action: tr("life_os.add_score", "Add score")
    },
    empty: {
      eyebrow: tr("life_os.empty_eyebrow", "Empty State"),
      title: tr("life_os.empty_title", "Start with real school material."),
      detail: tr("life_os.empty_detail", "The OS stays quiet until a syllabus, class, note, or task gives it truth."),
      action: tr("today.scan_syllabus", "Scan syllabus")
    },
    error: {
      eyebrow: tr("life_os.error_eyebrow", "Needs attention"),
      title: tr("life_os.error_title", "Nothing moved without review."),
      detail: tr("life_os.error_detail", "The app should explain what failed and preserve local data."),
      action: tr("errors.try_again", "Try Again")
    },
    success: {
      eyebrow: tr("life_os.success_eyebrow", "Saved"),
      title: tr("life_os.success_title", "The OS is updated."),
      detail: tr("life_os.success_detail", "Reviewed work now powers feed, forecast, widgets, and watch previews."),
      action: tr("common.continue", "Continue")
    }
  };

  return map[surface];
}

export function StudentLifeShell({
  settings,
  surface,
  metrics = [],
  action,
  copy,
  children,
  style
}: {
  settings?: UserSettings;
  surface: LifeSurface;
  metrics?: LifeMetric[];
  action?: LifeAction;
  copy?: Partial<LifeSurfaceCopy>;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useI18n();
  const tokens = getLifeStudioTokens(settings);
  const defaultCopy = surfacePersonalityCopy(surface, settings, t);
  const shellCopy = { ...defaultCopy, ...copy };
  const displayedMetrics = metrics.slice(0, 3);
  const useFullPreview = surface === "onboarding" || surface === "life" || surface === "paywall";

  return (
    <LifeCard style={[styles.shell, useFullPreview ? styles.shellFullPreview : styles.shellDaily, style]} accent={tokens.accent}>
      <LifeGradient tokens={tokens} />
      <View style={styles.heroTop}>
        <LifeOSBadge settings={settings} compact />
        <View style={[styles.liveDot, useFullPreview ? null : styles.liveDotDaily]}>
          <View style={[styles.liveDotInner, { backgroundColor: tokens.accent2 }]} />
          <Text style={styles.liveText}>{useFullPreview ? "Live" : shellCopy.action}</Text>
        </View>
      </View>
      <Text style={[styles.eyebrow, { color: tokens.accent }]}>{shellCopy.eyebrow}</Text>
      <Text style={[styles.heroTitle, useFullPreview ? null : styles.heroTitleDaily]}>{shellCopy.title}</Text>
      <Text style={[styles.heroDetail, useFullPreview ? null : styles.heroDetailDaily]}>{shellCopy.detail}</Text>
      {useFullPreview ? (
        <LifeOSPreview settings={settings} surface={surface} metrics={displayedMetrics} />
      ) : (
        <LifeSurfaceSnapshot settings={settings} surface={surface} />
      )}
      {displayedMetrics.length ? (
        <View style={styles.metricRow}>
          {displayedMetrics.map((metric) => (
            <LifeMetricTile key={`${metric.label}-${metric.value}`} metric={metric} />
          ))}
        </View>
      ) : null}
      {children}
      {action?.onPress ? <LifeActionButton label={action.label || shellCopy.action} onPress={action.onPress} accent={tokens.accent} /> : null}
    </LifeCard>
  );
}

function LifeSurfaceSnapshot({ settings, surface }: { settings?: UserSettings; surface: LifeSurface }) {
  const tokens = getLifeStudioTokens(settings);
  const items = previewItemsForSurface(surface, tokens);
  const [primary, ...secondary] = items;

  if (!primary) return null;

  return (
    <View style={styles.surfaceSnapshot}>
      <View style={[styles.surfacePrimary, { backgroundColor: primary.color }]}>
        <View style={styles.surfacePrimaryTop}>
          <Text style={styles.surfaceKicker}>{primary.impact} · {primary.kind}</Text>
          <Text style={styles.surfaceMeta}>{primary.meta}</Text>
        </View>
        <Text style={styles.surfaceTitle} numberOfLines={1}>{primary.title}</Text>
        <Text style={styles.surfaceReason} numberOfLines={2}>{primary.reason}</Text>
      </View>
      <View style={styles.surfaceMiniRow}>
        {secondary.slice(0, 2).map((item) => (
          <View key={`${surface}-${item.title}`} style={styles.surfaceMini}>
            <View style={[styles.surfaceMiniDot, { backgroundColor: item.color }]} />
            <Text style={styles.surfaceMiniTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.surfaceMiniMeta} numberOfLines={1}>{item.meta}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function LifeGradient({ tokens }: { tokens: LifeTokenSet }) {
  return (
    <>
      <View style={[styles.colorBand, styles.colorBandTop, { backgroundColor: tokens.accent }]} />
      <View style={[styles.colorBand, styles.colorBandBottom, { backgroundColor: tokens.accent2 }]} />
    </>
  );
}

export function LifeOSPreview({
  settings,
  surface,
  metrics = []
}: {
  settings?: UserSettings;
  surface?: LifeSurface;
  metrics?: LifeMetric[];
}) {
  const tokens = getLifeStudioTokens(settings);
  const items = previewItemsForSurface(surface || "feed", tokens);
  const selectedDay = tokens.behavior === "less_stress" ? 2 : tokens.behavior === "athletic_performance" ? 4 : 3;

  return (
    <View style={[styles.osPreview, { backgroundColor: previewSurfaceForBehavior(tokens.behavior) }]}>
      <View style={styles.osPreviewHeader}>
        <View style={styles.osPreviewCopy}>
          <Text style={styles.osPreviewEyebrow}>Your Life OS Preview</Text>
          <Text style={styles.osPreviewTitle} numberOfLines={1}>{tokens.behaviorLabel}</Text>
        </View>
        <View style={[styles.osPreviewLive, { backgroundColor: tokens.accent3 }]}>
          <Text style={styles.osPreviewLiveText}>Live</Text>
        </View>
      </View>
      <Text style={styles.osPreviewMeta} numberOfLines={1}>{tokens.identityLabel} · {tokens.behaviorDetail}</Text>
      <View style={styles.osWeek}>
        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => {
          const active = index === selectedDay;
          return (
            <View key={day} style={[styles.osDay, active ? { backgroundColor: tokens.accent } : null]}>
              <Text style={[styles.osDayText, active ? styles.osDayTextActive : null]}>{day}</Text>
              <Text style={[styles.osDayNumber, active ? styles.osDayTextActive : null]}>{8 + index}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.osMetricStrip}>
        {(metrics.length ? metrics : previewMetricsForTokens(tokens)).slice(0, 3).map((metric) => (
          <View key={`${metric.label}-${metric.value}`} style={styles.osMetric}>
            <Text style={styles.osMetricLabel} numberOfLines={1}>{metric.label}</Text>
            <Text style={[styles.osMetricValue, { color: metric.color || tokens.accent2 }]} numberOfLines={1} adjustsFontSizeToFit>
              {metric.value}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.osFeedStack}>
        {items.slice(0, 3).map((item, index) => (
          <View key={`${item.title}-${item.meta}`} style={[styles.osFeedItem, { backgroundColor: item.color }]}>
            <View style={styles.osFeedTop}>
              <Text style={styles.osFeedTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.osImpact}>{index === 0 ? item.impact : item.kind}</Text>
            </View>
            <Text style={styles.osFeedMeta} numberOfLines={1}>{item.meta}</Text>
            <Text style={styles.osFeedReason} numberOfLines={1}>{item.reason}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function LifeWidgetPreview({ settings }: { settings?: UserSettings }) {
  const tokens = getLifeStudioTokens(settings);
  const widgets = previewMetricsForTokens(tokens);
  return (
    <View style={styles.widgetPreview}>
      <Text style={styles.widgetPreviewTitle}>Widget DNA</Text>
      <View style={styles.widgetPreviewGrid}>
        {widgets.map((widget) => (
          <View key={widget.label} style={styles.widgetPreviewTile}>
            <Text style={styles.widgetPreviewLabel}>{widget.label}</Text>
            <Text style={[styles.widgetPreviewValue, { color: widget.color || tokens.accent }]}>{widget.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function LifeWatchPreview({ settings }: { settings?: UserSettings }) {
  const tokens = getLifeStudioTokens(settings);
  return (
    <View style={styles.watchPreview}>
      <View style={styles.watchFace}>
        <Text style={styles.watchDate}>THU 11</Text>
        <Text style={styles.watchTime}>10:09</Text>
        <Text style={styles.watchNext}>Next Class</Text>
        <Text style={styles.watchClass}>Calculus II</Text>
        <View style={[styles.watchRing, { borderColor: tokens.accent }]}>
          <Text style={[styles.watchRingText, { color: tokens.accent }]}>72</Text>
        </View>
      </View>
      <View style={styles.lockStack}>
        {previewItemsForSurface("life", tokens).slice(0, 2).map((item) => (
          <View key={item.title} style={[styles.lockWidget, { backgroundColor: item.color }]}>
            <Text style={styles.lockWidgetTitle}>{item.title}</Text>
            <Text style={styles.lockWidgetMeta}>{item.meta}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function LifeCard({
  children,
  style,
  accent
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string;
}) {
  return (
    <View style={[styles.card, accent ? { borderColor: `${accent}22` } : null, style]}>
      {children}
    </View>
  );
}

export function LifeFeedCard({
  title,
  meta,
  reason,
  action,
  color,
  children,
  onPress
}: {
  title: string;
  meta: string;
  reason: string;
  action?: string;
  color: string;
  children?: React.ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <View style={[styles.feedCard, { backgroundColor: color }]}>
      <View style={styles.feedSheen} />
      <Text style={styles.feedMeta}>{meta}</Text>
      <Text style={styles.feedTitle}>{title}</Text>
      <Text style={styles.feedReason}>{reason}</Text>
      {children}
      {action ? <Text style={styles.feedAction}>{action}</Text> : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.88} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

export function LifeSectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {note ? <Text style={styles.sectionNote}>{note}</Text> : null}
    </View>
  );
}

export function LifeMetricTile({ metric }: { metric: LifeMetric }) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricLabel}>{metric.label}</Text>
      <Text style={[styles.metricValue, metric.color ? { color: metric.color } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {metric.value}
      </Text>
      {metric.detail ? <Text style={styles.metricDetail} numberOfLines={1}>{metric.detail}</Text> : null}
    </View>
  );
}

export function LifeInsightCard({
  title,
  detail,
  tone = "blue"
}: {
  title: string;
  detail: string;
  tone?: "blue" | "green" | "orange" | "red" | "purple";
}) {
  const colors = {
    blue: "#0A84FF",
    green: "#30D158",
    orange: "#FF9F0A",
    red: "#FF375F",
    purple: "#6D3DF2"
  };
  return (
    <LifeCard style={styles.insightCard} accent={colors[tone]}>
      <View style={[styles.insightIcon, { backgroundColor: colors[tone] }]} />
      <View style={styles.insightCopy}>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightDetail}>{detail}</Text>
      </View>
    </LifeCard>
  );
}

export function LifePreviewPhone({
  settings,
  items
}: {
  settings?: UserSettings;
  items?: Array<{ title: string; meta: string; color?: string }>;
}) {
  const tokens = getLifeStudioTokens(settings);
  const previewItems = items?.length
    ? items.slice(0, 3)
    : [
        { title: tokens.behavior === "less_stress" ? "Free Time Forecast" : "Chemistry Midterm", meta: tokens.behaviorDetail, color: tokens.accent3 },
        { title: tokens.behavior === "athletic_performance" ? "Recovery Window" : "Calculus Homework", meta: "Recommended next", color: tokens.accent },
        { title: tokens.identity === "active_athlete" ? "Practice Countdown" : "Focus Window", meta: "Protected block", color: tokens.accent2 }
      ];

  return (
    <View style={styles.phone}>
      <View style={styles.phoneSensor} />
      <Text style={styles.phoneTime}>9:41</Text>
      <Text style={styles.phoneTitle}>Your Life OS Preview</Text>
      <Text style={styles.phoneMode}>{tokens.behaviorLabel}</Text>
      <View style={styles.phoneItems}>
        {previewItems.map((item) => (
          <View key={`${item.title}-${item.meta}`} style={[styles.phoneItem, { backgroundColor: item.color || tokens.accent }]}>
            <Text style={styles.phoneItemTitle}>{item.title}</Text>
            <Text style={styles.phoneItemMeta}>{item.meta}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function LifeOSBadge({ settings, compact = false }: { settings?: UserSettings; compact?: boolean }) {
  const tokens = getLifeStudioTokens(settings);
  return (
    <View style={styles.badge}>
      <View style={styles.badgeMark}>
        <View style={[styles.badgeLine, { backgroundColor: tokens.accent }]} />
        <View style={[styles.badgeLine, { backgroundColor: tokens.accent2 }]} />
        <View style={[styles.badgeLine, { backgroundColor: tokens.accent3 }]} />
      </View>
      {!compact ? (
        <View>
          <Text style={styles.badgeLabel}>Life Studio</Text>
          <Text style={styles.badgeDetail}>{tokens.identityLabel}</Text>
        </View>
      ) : (
        <View>
          <Text style={styles.badgeLabel}>Adaptive</Text>
          <Text style={styles.badgeDetail}>{tokens.identityLabel}</Text>
        </View>
      )}
    </View>
  );
}

export function LifeEmptyState({
  settings,
  title,
  detail,
  action
}: {
  settings?: UserSettings;
  title?: string;
  detail?: string;
  action?: LifeAction;
}) {
  const { t } = useI18n();
  const copy = surfacePersonalityCopy("empty", settings, t);
  const tokens = getLifeStudioTokens(settings);
  return (
    <LifeCard style={styles.emptyCard} accent={tokens.accent}>
      <LifeOSBadge settings={settings} />
      <Text style={styles.emptyTitle}>{title || copy.title}</Text>
      <Text style={styles.emptyDetail}>{detail || copy.detail}</Text>
      {action ? <LifeActionButton label={action.label} onPress={action.onPress} accent={tokens.accent} /> : null}
    </LifeCard>
  );
}

export function LifeActionButton({
  label,
  onPress,
  accent
}: {
  label: string;
  onPress?: () => void;
  accent?: string;
}) {
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.86} style={[styles.actionButton, { backgroundColor: accent || "#111827" }]} onPress={onPress}>
      <Sparkles color="#FFFFFF" size={16} />
      <Text style={styles.actionLabel}>{label}</Text>
      <ArrowRight color="#FFFFFF" size={16} />
    </TouchableOpacity>
  );
}

function previewSurfaceForBehavior(behavior: OSBehavior) {
  switch (behavior) {
    case "less_stress":
      return "#082B3A";
    case "athletic_performance":
      return "#062D1F";
    case "life_balance":
      return "#0D2035";
    case "high_achievement":
      return "#1B103F";
    case "highest_gpa":
    default:
      return "#07113A";
  }
}

function previewMetricsForTokens(tokens: LifeTokenSet): LifeMetric[] {
  if (tokens.behavior === "less_stress") {
    return [
      { label: "Free", value: "2.4h", color: "#30D158" },
      { label: "Load", value: "72", color: "#5AC8FA" },
      { label: "Reset", value: "35m", color: "#64D2FF" }
    ];
  }
  if (tokens.behavior === "athletic_performance") {
    return [
      { label: "Practice", value: "4 PM", color: "#30D158" },
      { label: "Recovery", value: "35m", color: "#5AC8FA" },
      { label: "Risk", value: "Med", color: "#FF9F0A" }
    ];
  }
  if (tokens.behavior === "life_balance") {
    return [
      { label: "School", value: "45%", color: "#0A84FF" },
      { label: "Life", value: "30%", color: "#30D158" },
      { label: "Work", value: "25%", color: "#FF9F0A" }
    ];
  }
  if (tokens.behavior === "high_achievement") {
    return [
      { label: "Risk", value: "2", color: "#BF5AF2" },
      { label: "Sprint", value: "75m", color: "#FF375F" },
      { label: "Ahead", value: "6d", color: "#0A84FF" }
    ];
  }
  return [
    { label: "Grade", value: "High", color: "#FF375F" },
    { label: "Exam", value: "3d", color: "#FF9F0A" },
    { label: "Focus", value: "2", color: "#6D3DF2" }
  ];
}

function previewItemsForSurface(surface: LifeSurface, tokens: LifeTokenSet) {
  const byBehavior: Record<OSBehavior, Array<{ title: string; meta: string; reason: string; color: string; impact: string; kind: string }>> = {
    highest_gpa: [
      { title: "Chemistry Midterm", meta: "Thu · 8:00 AM", reason: "Start tonight because grade impact is high.", color: "#C81E5B", impact: "High", kind: "Exam" },
      { title: "Calculus II Homework", meta: "Due Thu · 10:59 PM", reason: "Recommended: two study sessions.", color: "#6337E8", impact: "Smart", kind: "Work" },
      { title: "Focus Window", meta: "Tonight · 50 min", reason: "Best grade-protection slot.", color: "#1557D8", impact: "Focus", kind: "Block" }
    ],
    less_stress: [
      { title: "Free Time Forecast", meta: "2.4 hrs this week", reason: "Use one calm window before work stacks.", color: "#0F8A6A", impact: "Calm", kind: "Free" },
      { title: "Recovery Window", meta: "Tonight · 35 min", reason: "Protect reset time before exam prep.", color: "#0E7490", impact: "Reset", kind: "Rest" },
      { title: "Calculus II Homework", meta: "25 min start", reason: "Small start is enough tonight.", color: "#2563EB", impact: "Small", kind: "Work" }
    ],
    athletic_performance: [
      { title: "Soccer Practice", meta: "Today · 4:00 PM", reason: "Plan work around practice and recovery.", color: "#087A3F", impact: "Life", kind: "Sport" },
      { title: "Recovery Window", meta: "After practice · 35 min", reason: "Reset before Chemistry review.", color: "#0E7490", impact: "Reset", kind: "Rest" },
      { title: "Chemistry Midterm", meta: "Thu · 8:00 AM", reason: "Review after recovery, not midnight.", color: "#B42318", impact: "Risk", kind: "Exam" }
    ],
    life_balance: [
      { title: "Physics Lab Report", meta: "Due Tue · 11:59 PM", reason: "Finish rough pass before your shift.", color: "#1557D8", impact: "School", kind: "Work" },
      { title: "Work Shift", meta: "Wed · 5:30 PM", reason: "Study before the shift.", color: "#B45309", impact: "Life", kind: "Work" },
      { title: "Soccer Practice", meta: "Today · 4:00 PM", reason: "A reset between study blocks.", color: "#087A3F", impact: "Life", kind: "Sport" }
    ],
    high_achievement: [
      { title: "Future Risk", meta: "2 overloaded days", reason: "Move one task now to avoid Thursday.", color: "#7C3AED", impact: "Risk", kind: "Forecast" },
      { title: "Calculus II Homework", meta: "Finish tonight", reason: "Reserve tomorrow for review.", color: "#6337E8", impact: "Ahead", kind: "Work" },
      { title: "Focus Sprint", meta: "Tonight · 75 min", reason: "Front-load the week.", color: "#0F766E", impact: "Sprint", kind: "Block" }
    ]
  };
  const surfaceItems: Partial<Record<LifeSurface, Array<{ title: string; meta: string; reason: string; color: string; impact: string; kind: string }>>> = {
    scan: [
      { title: "Choose a source", meta: "Scan · Upload · Type", reason: "Nothing enters the planner without review.", color: "#243B8F", impact: "Step 1", kind: "Import" },
      { title: "Parser truth", meta: "Local text/PDF fallback", reason: "Photo OCR stays honest when unavailable.", color: "#0E7490", impact: "Trust", kind: "AI" },
      { title: "Review before save", meta: "Dates · Duplicates · Confidence", reason: "Only valid work powers the OS.", color: "#0F8A6A", impact: "Safe", kind: "Review" }
    ],
    review: [
      { title: "Needs date", meta: "1 invalid deadline", reason: "Fix before this reaches reminders.", color: "#B42318", impact: "Fix", kind: "Date" },
      { title: "High confidence", meta: "4 rows ready", reason: "Add reviewed rows to Today and widgets.", color: "#0F8A6A", impact: "Ready", kind: "Rows" },
      { title: "Duplicate check", meta: "2 possible matches", reason: "Avoid clutter before it happens.", color: "#B45309", impact: "Check", kind: "Trust" }
    ],
    forecast: [
      { title: "Thursday overload", meta: "4.8h open", reason: "Move one block before the week hits.", color: "#B45309", impact: "Risk", kind: "Load" },
      { title: "Free time", meta: "Sat afternoon", reason: "Best recovery window this week.", color: "#0F8A6A", impact: "Free", kind: "Life" },
      { title: "Focus blocks", meta: "2 saved", reason: "Your plan now has protected time.", color: "#1557D8", impact: "Saved", kind: "Focus" }
    ],
    classes: [
      { title: "Next class", meta: "Calculus II · 10:30 AM", reason: "Room, notes, and open work are connected.", color: "#1557D8", impact: "Next", kind: "Class" },
      { title: "Chemistry", meta: "2 open · 1 exam", reason: "Grade-impact work is promoted.", color: "#C81E5B", impact: "Risk", kind: "Class" },
      { title: "Studio Art", meta: "Project due Friday", reason: "Creative work stays in the OS.", color: "#DB2777", impact: "Life", kind: "Class" }
    ],
    focus: [
      { title: "10 minute start", meta: "Small useful step", reason: "Built for procrastination and focus issues.", color: "#1557D8", impact: "Now", kind: "Focus" },
      { title: "Chemistry review", meta: "Session 1", reason: "Split exam prep into calmer blocks.", color: "#C81E5B", impact: "Exam", kind: "Study" },
      { title: "Done today", meta: "0 sessions", reason: "Completion updates the feed.", color: "#0F8A6A", impact: "Done", kind: "Progress" }
    ],
    notes: [
      { title: "Agenda note", meta: "Pinned", reason: "Notes become planning signals.", color: "#334155", impact: "Note", kind: "Class" },
      { title: "BIO lab ask", meta: "Linked to Biology", reason: "Turn it into a task when needed.", color: "#0F8A6A", impact: "Linked", kind: "Note" },
      { title: "Reminder clue", meta: "Due date mentioned", reason: "Capture what changes the plan.", color: "#B45309", impact: "Signal", kind: "Task" }
    ],
    life: [
      { title: "Exam Countdown", meta: "Widget DNA", reason: "Your Home Screen watches risk.", color: "#6337E8", impact: "Widget", kind: "DNA" },
      { title: "Focus Window", meta: "Watch DNA", reason: "Complications show what matters next.", color: "#1557D8", impact: "Watch", kind: "DNA" },
      { title: tokens.behaviorLabel, meta: "OS Behavior", reason: tokens.behaviorDetail, color: tokens.accent3, impact: "OS", kind: "Mode" }
    ],
    paywall: [
      { title: "Your OS unlocked", meta: "Widgets · Watch · Forecast", reason: "The Life Studio you built stays live outside the app.", color: "#243B8F", impact: "Plus", kind: "OS" },
      { title: "Adaptive widgets", meta: "Home Screen + Lock Screen", reason: "The next useful signal appears before you open StudyPlanner.", color: "#0F8A6A", impact: "Live", kind: "Widget" },
      { title: "Unlimited imports", meta: "Syllabus AI", reason: "Every class can become reviewed planner data.", color: "#B45309", impact: "Scan", kind: "Import" }
    ],
    grades: [
      { title: "Target GPA", meta: "90%", reason: "Grade-impact work rises first.", color: "#6337E8", impact: "Goal", kind: "Grade" },
      { title: "Chemistry exam", meta: "High impact", reason: "One score can move the semester.", color: "#C81E5B", impact: "Risk", kind: "Exam" },
      { title: "Target pace", meta: "89.5%", reason: "Stay ahead of the gap.", color: "#0F8A6A", impact: "Pace", kind: "Grade" }
    ]
  };

  return surfaceItems[surface] || byBehavior[tokens.behavior];
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(5,7,11,0.08)",
    backgroundColor: "#FFFFFF",
    padding: 16,
    shadowColor: "#05070B",
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3
  },
  shell: {
    gap: 9,
    overflow: "hidden",
    marginBottom: 16
  },
  shellDaily: {
    padding: 14,
    borderRadius: 24,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    borderColor: "rgba(17,24,39,0.06)"
  },
  shellFullPreview: {
    padding: 16,
    borderRadius: 26
  },
  colorBand: {
    position: "absolute",
    height: 7,
    opacity: 0.9
  },
  colorBandTop: {
    left: 16,
    right: "54%",
    top: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999
  },
  colorBandBottom: {
    right: 18,
    bottom: 0,
    width: 96,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  liveDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "#F6F7FA",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(5,7,11,0.06)"
  },
  liveDotDaily: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    maxWidth: 126
  },
  liveDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  liveText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "900"
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  heroTitle: {
    color: "#05070B",
    fontSize: 31,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: 0
  },
  heroTitleDaily: {
    fontSize: 24,
    lineHeight: 28
  },
  heroDetail: {
    color: "#5B6472",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700"
  },
  heroDetailDaily: {
    fontSize: 13,
    lineHeight: 18
  },
  surfaceSnapshot: {
    gap: 8
  },
  surfacePrimary: {
    minHeight: 104,
    borderRadius: 21,
    padding: 13,
    justifyContent: "space-between",
    overflow: "hidden"
  },
  surfacePrimaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  surfaceKicker: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  surfaceMeta: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900"
  },
  surfaceTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "900"
  },
  surfaceReason: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800"
  },
  surfaceMiniRow: {
    flexDirection: "row",
    gap: 8
  },
  surfaceMini: {
    flex: 1,
    minHeight: 58,
    borderRadius: 17,
    backgroundColor: "#F7F8FB",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
    padding: 9,
    gap: 2
  },
  surfaceMiniDot: {
    width: 18,
    height: 4,
    borderRadius: 99
  },
  surfaceMiniTitle: {
    color: "#111827",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900"
  },
  surfaceMiniMeta: {
    color: "#6B7280",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800"
  },
  metricRow: {
    flexDirection: "row",
    gap: 8
  },
  metricTile: {
    flex: 1,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#F8FAFD",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.05)",
    padding: 9,
    justifyContent: "space-between"
  },
  metricLabel: {
    color: "#7B8493",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  metricValue: {
    color: "#111827",
    fontSize: 19,
    lineHeight: 22,
    fontWeight: "900"
  },
  metricDetail: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "800"
  },
  feedCard: {
    borderRadius: 20,
    padding: 16,
    gap: 5,
    minHeight: 132,
    overflow: "hidden",
    shadowColor: "#111827",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 2
  },
  feedSheen: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 84,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.18)"
  },
  feedMeta: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  feedTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "900"
  },
  feedReason: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700"
  },
  feedAction: {
    marginTop: 6,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900"
  },
  sectionHeader: {
    gap: 3,
    marginTop: 6,
    marginBottom: 4
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900"
  },
  sectionNote: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700"
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14
  },
  insightIcon: {
    width: 12,
    height: 48,
    borderRadius: 99
  },
  insightCopy: {
    flex: 1,
    gap: 3
  },
  insightTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "900"
  },
  insightDetail: {
    color: "#5B6472",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700"
  },
  osPreview: {
    borderRadius: 24,
    padding: 12,
    gap: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)"
  },
  osStatusRow: {
    height: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  osTime: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900"
  },
  osIsland: {
    width: 78,
    height: 21,
    borderRadius: 999,
    backgroundColor: "#000000"
  },
  osSignal: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 10,
    fontWeight: "900"
  },
  osPreviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10
  },
  osPreviewCopy: {
    flex: 1,
    minWidth: 0
  },
  osPreviewEyebrow: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900"
  },
  osPreviewTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "900"
  },
  osPreviewLive: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  osPreviewLiveText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900"
  },
  osPreviewMeta: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800"
  },
  osWeek: {
    flexDirection: "row",
    gap: 6
  },
  osDay: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center"
  },
  osDayText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 8,
    fontWeight: "900"
  },
  osDayNumber: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "900"
  },
  osDayTextActive: {
    color: "#FFFFFF"
  },
  osMetricStrip: {
    flexDirection: "row",
    gap: 7
  },
  osMetric: {
    flex: 1,
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 8,
    justifyContent: "space-between"
  },
  osMetricLabel: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  osMetricValue: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "900"
  },
  osFeedStack: {
    gap: 8
  },
  osFeedItem: {
    minHeight: 66,
    borderRadius: 16,
    padding: 10,
    gap: 2
  },
  osFeedTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  osFeedTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "900"
  },
  osImpact: {
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.18)",
    color: "#FFFFFF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "900"
  },
  osFeedMeta: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800"
  },
  osFeedReason: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900"
  },
  widgetPreview: {
    borderRadius: 18,
    backgroundColor: "#F7F8FB",
    borderWidth: 1,
    borderColor: "rgba(5,7,11,0.06)",
    padding: 12,
    gap: 10
  },
  widgetPreviewTitle: {
    color: "#05070B",
    fontSize: 13,
    fontWeight: "900"
  },
  widgetPreviewGrid: {
    flexDirection: "row",
    gap: 8
  },
  widgetPreviewTile: {
    flex: 1,
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(5,7,11,0.06)",
    padding: 9,
    justifyContent: "space-between"
  },
  widgetPreviewLabel: {
    color: "#667085",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  widgetPreviewValue: {
    fontSize: 17,
    fontWeight: "900"
  },
  watchPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  watchFace: {
    width: 116,
    height: 136,
    borderRadius: 34,
    backgroundColor: "#05070B",
    borderWidth: 4,
    borderColor: "#1F2937",
    padding: 12,
    alignItems: "center",
    gap: 4
  },
  watchDate: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 9,
    fontWeight: "900"
  },
  watchTime: {
    color: "#FFFFFF",
    fontSize: 23,
    lineHeight: 26,
    fontWeight: "900"
  },
  watchNext: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 9,
    fontWeight: "900"
  },
  watchClass: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900"
  },
  watchRing: {
    marginTop: 3,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center"
  },
  watchRingText: {
    fontSize: 13,
    fontWeight: "900"
  },
  lockStack: {
    flex: 1,
    gap: 8
  },
  lockWidget: {
    minHeight: 55,
    borderRadius: 18,
    padding: 11,
    justifyContent: "center"
  },
  lockWidgetTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900"
  },
  lockWidgetMeta: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 11,
    fontWeight: "800"
  },
  phone: {
    borderRadius: 36,
    backgroundColor: "#07111F",
    borderWidth: 5,
    borderColor: "#111827",
    padding: 14,
    minHeight: 330,
    gap: 9,
    shadowColor: "#111827",
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 22 },
    elevation: 5
  },
  phoneSensor: {
    alignSelf: "center",
    width: 82,
    height: 22,
    borderRadius: 99,
    backgroundColor: "#020617",
    marginBottom: 2
  },
  phoneTime: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900"
  },
  phoneTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900"
  },
  phoneMode: {
    color: "#A9B7D0",
    fontSize: 12,
    fontWeight: "800"
  },
  phoneItems: {
    gap: 9,
    marginTop: 6
  },
  phoneItem: {
    minHeight: 68,
    borderRadius: 18,
    padding: 12,
    gap: 3
  },
  phoneItemTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "900"
  },
  phoneItemMeta: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700"
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  badgeMark: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#111827",
    padding: 7,
    gap: 3
  },
  badgeLine: {
    height: 4,
    borderRadius: 99
  },
  badgeLabel: {
    color: "#111827",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900"
  },
  badgeDetail: {
    color: "#6B7280",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800"
  },
  emptyCard: {
    gap: 10,
    alignItems: "flex-start"
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "900"
  },
  emptyDetail: {
    color: "#5B6472",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  },
  actionButton: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4
  },
  actionLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900"
  }
});
