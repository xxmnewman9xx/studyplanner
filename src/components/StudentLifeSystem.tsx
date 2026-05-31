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
    highest_gpa: ["#6D3DF2", "#FF7A1A", "#FF375F"],
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
  const behaviorTitle: Record<OSBehavior, string> = {
    highest_gpa: tr("life_os.behavior_title_highest_gpa", "Do the work that affects your grade first."),
    less_stress: tr("life_os.behavior_title_less_stress", "Make the week feel lighter."),
    athletic_performance: tr("life_os.behavior_title_athletic_performance", "Plan around practice and recovery."),
    life_balance: tr("life_os.behavior_title_life_balance", "Balance school with real life."),
    high_achievement: tr("life_os.behavior_title_high_achievement", "See risk before it becomes urgent.")
  };
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
      title: behaviorTitle[tokens.behavior],
      detail: `${copy.identity} - ${copy.friction}`,
      action: tr("life_os.open_next", "Open next")
    },
    scan: {
      eyebrow: tr("life_os.scan_eyebrow", "Syllabus AI"),
      title: tr("life_os.scan_title", "Import your syllabus safely."),
      detail: tr("life_os.scan_detail", "Scan, upload, or paste. Review every row before it powers the feed."),
      action: tr("life_os.review_import", "Review import")
    },
    review: {
      eyebrow: tr("life_os.review_eyebrow", "Review Inbox"),
      title: tr("life_os.review_title", "Fix imported work before it appears."),
      detail: tr("life_os.review_detail", "Dates, duplicates, and confidence checks stay between import and your real planner."),
      action: tr("life_os.confirm_rows", "Confirm rows")
    },
    forecast: {
      eyebrow: tr("life_os.forecast_eyebrow", "Smart Forecast"),
      title: tokens.behavior === "less_stress" ? tr("life_os.forecast_less_stress_title", "Find the lighter path.") : tr("life_os.forecast_title", "Plan the week before it hits."),
      detail: `${copy.behavior}: ${tokens.behaviorDetail}`,
      action: tr("life_os.plan_focus", "Plan focus")
    },
    classes: {
      eyebrow: tr("life_os.classes_eyebrow", "Class OS"),
      title: tr("life_os.classes_title", "See what every class needs."),
      detail: tr("life_os.classes_detail", "Rooms, notes, open work, and grade context stay connected."),
      action: tr("life_os.add_class", "Add class")
    },
    focus: {
      eyebrow: tr("tabs.focus", "Focus"),
      title: tokens.behavior === "less_stress" ? tr("life_os.focus_less_stress_title", "Short block. Clean finish.") : tr("life_os.focus_title", "Start the right block now."),
      detail: copy.friction,
      action: tr("life_os.start_focus", "Start focus")
    },
    notes: {
      eyebrow: tr("tabs.notes", "Notes"),
      title: tr("life_os.notes_title", "Capture what changes the plan."),
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

  return (
    <LifeCard style={[styles.shell, style]} accent={tokens.accent}>
      <LifeGradient tokens={tokens} />
      <View style={styles.heroTop}>
        <LifeOSBadge settings={settings} compact />
        <View style={styles.liveDot}>
          <View style={[styles.liveDotInner, { backgroundColor: tokens.accent2 }]} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>
      <Text style={[styles.eyebrow, { color: tokens.accent }]}>{shellCopy.eyebrow}</Text>
      <Text style={styles.heroTitle}>{shellCopy.title}</Text>
      <Text style={styles.heroDetail}>{shellCopy.detail}</Text>
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

export function LifeGradient({ tokens }: { tokens: LifeTokenSet }) {
  return (
    <>
      <View style={[styles.gradientOrb, styles.gradientOrbOne, { backgroundColor: tokens.accent }]} />
      <View style={[styles.gradientOrb, styles.gradientOrbTwo, { backgroundColor: tokens.accent2 }]} />
      <View style={[styles.gradientOrb, styles.gradientOrbThree, { backgroundColor: tokens.accent3 }]} />
    </>
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
        <Text style={styles.badgeLabel}>{tokens.behaviorLabel}</Text>
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

const styles = StyleSheet.create({
  card: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.08)",
    backgroundColor: "#FFFFFF",
    padding: 18,
    shadowColor: "#111827",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 3
  },
  shell: {
    gap: 10,
    overflow: "hidden",
    marginBottom: 16
  },
  gradientOrb: {
    position: "absolute",
    opacity: 0.11
  },
  gradientOrbOne: {
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -72,
    top: -88
  },
  gradientOrbTwo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    left: -52,
    bottom: -58
  },
  gradientOrbThree: {
    width: 92,
    height: 92,
    borderRadius: 46,
    right: 38,
    bottom: -48
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
    backgroundColor: "rgba(17,24,39,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 7
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
    color: "#111827",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: 0
  },
  heroDetail: {
    color: "#5B6472",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700"
  },
  metricRow: {
    flexDirection: "row",
    gap: 8
  },
  metricTile: {
    flex: 1,
    minHeight: 78,
    borderRadius: 22,
    backgroundColor: "rgba(245,247,251,0.86)",
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
    padding: 11,
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
    fontSize: 21,
    lineHeight: 25,
    fontWeight: "900"
  },
  metricDetail: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "800"
  },
  feedCard: {
    borderRadius: 26,
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
    top: -48,
    right: -36,
    width: 120,
    height: 120,
    borderRadius: 60,
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
