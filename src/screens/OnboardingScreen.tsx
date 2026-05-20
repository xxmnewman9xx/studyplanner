import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  FileScan,
  Palette,
  Sparkles,
  WandSparkles
} from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { AppLogo, GlassCard } from "../components/AppleComponents";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import { UserSettings } from "../models";

export type OnboardingDestination = "import" | "demo" | "manual";

type OnboardingScreenProps = {
  onFinish: (
    destination: OnboardingDestination,
    settingsPatch?: Partial<UserSettings>
  ) => void;
};

const slides = [
  {
    eyebrow: "Scan → review → plan",
    title: "Turn any syllabus into a semester plan.",
    copy: "Upload class material, review what StudyPlanner finds, then send approved work into Today, Plan, and Widget Studio.",
    icon: FileScan,
    previewTitle: "Syllabus scan",
    previewMetric: "18 found",
    previewDetail: "3 classes · 15 assignments",
    rows: ["Scan or paste class material", "Review every found deadline", "Build Today + widgets from approved work"]
  },
  {
    eyebrow: "Trust check",
    title: "Review before it touches your planner.",
    copy: "Missing dates, low-confidence rows, and duplicates are flagged before they touch your planner.",
    icon: WandSparkles,
    previewTitle: "Review queue",
    previewMetric: "3 checks",
    previewDetail: "Approve before saving",
    rows: ["Lab report · needs date", "Midterm · Oct 12", "Reading notes · duplicate check"]
  },
  {
    eyebrow: "Your school, your phone",
    title: "Classes, colors, reminders, widgets.",
    copy: "Start free with a useful planner. Plus only appears when you want more volume or advanced automation.",
    icon: Palette,
    previewTitle: "Widget Studio",
    previewMetric: "Today",
    previewDetail: "Real deadlines, not fake placeholders",
    rows: ["2 free classes", "12 free homework items", "Basic Today + Upcoming widgets"]
  }
];

const reminderChoices = [
  {
    label: "Balanced",
    value: "Balanced reminders",
    detail: "Deadlines plus one calm prep nudge."
  },
  {
    label: "Minimal",
    value: "Major deadlines only",
    detail: "Only exams, projects, and final due dates."
  },
  {
    label: "Intensive",
    value: "Study plan reminders",
    detail: "Prep blocks, deadline nudges, and focus prompts."
  }
];

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const [index, setIndex] = useState(0);
  const [reminderStyle, setReminderStyle] = useState(reminderChoices[0]!.value);
  const slide = slides[index] ?? slides[0]!;
  const Icon = slide.icon;
  const isFinal = index === slides.length - 1;

  const finish = (destination: OnboardingDestination) => {
    onFinish(destination, { notificationDefault: reminderStyle });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandRow}>
        <AppLogo showWordmark size={40} />
      </View>

      <GlassCard tone="hero" style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <Icon color={colors.heroText} size={24} />
          </View>
          <Text style={styles.stepText}>Step {index + 1} of {slides.length}</Text>
        </View>
        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.copy}>{slide.copy}</Text>

        <View style={styles.previewPanel}>
          {slide.rows.map((row, rowIndex) => (
            <View key={row} style={styles.previewRow}>
              <View style={[styles.previewDot, rowIndex === 2 && index === 1 ? styles.previewDotReview : null]}>
                {rowIndex < 2 || index !== 1 ? <CheckCircle2 color={colors.heroText} size={13} /> : null}
              </View>
              <Text style={styles.previewText}>{row}</Text>
            </View>
          ))}
        </View>

        <View style={styles.appPreviewCard}>
          <View style={styles.appPreviewHeader}>
            <View>
              <Text style={styles.appPreviewKicker}>Live product preview</Text>
              <Text style={styles.appPreviewTitle}>{slide.previewTitle}</Text>
            </View>
            <View style={styles.appPreviewBadge}>
              <Text style={styles.appPreviewBadgeText}>{index === 0 ? "Scan" : index === 1 ? "Review" : "Widgets"}</Text>
            </View>
          </View>
          <View style={styles.appPreviewBody}>
            <View style={styles.appPreviewMetric}>
              <Text style={styles.appPreviewMetricValue}>{slide.previewMetric}</Text>
              <Text style={styles.appPreviewMetricLabel}>{slide.previewDetail}</Text>
            </View>
            <View style={styles.miniWidgetPreview}>
              <View style={styles.miniWidgetDot} />
              <Text style={styles.miniWidgetTitle}>{index === 0 ? "Imported work" : index === 1 ? "Needs review" : "Due today"}</Text>
              <Text style={styles.miniWidgetText}>{index === 0 ? "Everything lands in one plan." : index === 1 ? "You approve what matters." : "Widgets stay planner-backed."}</Text>
            </View>
          </View>
        </View>
      </GlassCard>

      <GlassCard style={styles.flowCard}>
        <View style={styles.flowStep}>
          <View style={styles.flowIcon}><FileScan color={colors.accent} size={17} /></View>
          <Text style={styles.flowText}>Scan</Text>
        </View>
        <View style={styles.flowLine} />
        <View style={styles.flowStep}>
          <View style={styles.flowIcon}><CheckCircle2 color={colors.sage} size={17} /></View>
          <Text style={styles.flowText}>Review</Text>
        </View>
        <View style={styles.flowLine} />
        <View style={styles.flowStep}>
          <View style={styles.flowIcon}><CalendarDays color={colors.brandPink} size={17} /></View>
          <Text style={styles.flowText}>Plan</Text>
        </View>
      </GlassCard>

      {isFinal ? (
        <GlassCard style={styles.choiceCard}>
          <Text style={styles.choiceTitle}>Reminder preset for later</Text>
          <View style={styles.choiceStack}>
            {reminderChoices.map((choice) => {
              const active = reminderStyle === choice.value;
              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={choice.value}
                  style={[styles.reminderChoice, active ? styles.reminderChoiceActive : null]}
                  onPress={() => setReminderStyle(choice.value)}
                >
                  <View style={[styles.choiceRadio, active ? styles.choiceRadioActive : null]} />
                  <View style={styles.choiceCopy}>
                    <Text style={styles.choiceLabel}>{choice.label}</Text>
                    <Text style={styles.choiceDetail}>{choice.detail}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>
      ) : (
        <View style={styles.trustLine}>
          <CheckCircle2 color={colors.accent} size={15} />
          <Text style={styles.trustLineText}>You review every deadline before anything saves.</Text>
        </View>
      )}

      <View style={styles.bottomBar}>
        <AppButton
          label={isFinal ? "Scan or upload syllabus" : "Continue"}
          icon={isFinal ? FileScan : undefined}
          onPress={() => {
            if (isFinal) {
              finish("import");
              return;
            }
            setIndex((current) => current + 1);
          }}
        />
        {index === 0 ? (
          <View style={styles.firstActions}>
            <TouchableOpacity accessibilityRole="button" style={styles.demoButton} onPress={() => finish("demo")}>
              <Sparkles color={colors.accent} size={16} />
              <Text style={styles.demoButtonText}>Try demo planner</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.demoButton} onPress={() => finish("manual")}>
              <Palette color={colors.brandPink} size={16} />
              <Text style={styles.demoButtonText}>Add manually</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.secondaryActions}>
            <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={() => setIndex(Math.max(0, index - 1))}>
              <Text style={styles.secondaryText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={() => finish("demo")}>
              <Sparkles color={colors.accent} size={16} />
              <Text style={styles.secondaryText}>Try demo</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.stepRail} accessibilityRole="progressbar">
          {slides.map((item, dotIndex) => (
            <View key={item.title} style={[styles.stepDot, dotIndex === index ? styles.stepDotActive : null]} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.canvas
    },
    screenContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xl,
      gap: spacing.sm
    },
    brandRow: {
      flexDirection: "row",
      justifyContent: "center"
    },
    heroCard: {
      gap: spacing.sm,
      padding: spacing.md
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    heroIcon: {
      width: 42,
      height: 42,
      borderRadius: radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.12)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)"
    },
    stepText: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    eyebrow: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    title: {
      color: colors.heroText,
      fontSize: 27,
      lineHeight: 32,
      fontWeight: "900"
    },
    copy: {
      color: colors.heroMuted,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "700"
    },
    previewPanel: {
      marginTop: 2,
      borderRadius: radii.lg,
      backgroundColor: "rgba(255,255,255,0.10)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.16)",
      padding: spacing.sm,
      gap: spacing.xs
    },
    previewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    previewDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent
    },
    previewDotReview: {
      backgroundColor: colors.brandOrange
    },
    previewText: {
      flex: 1,
      color: colors.heroText,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    appPreviewCard: {
      padding: spacing.sm,
      borderRadius: radii.xl,
      backgroundColor: "rgba(255,255,255,0.12)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)",
      gap: spacing.sm
    },
    appPreviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm
    },
    appPreviewKicker: {
      color: colors.heroMuted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    appPreviewTitle: {
      color: colors.heroText,
      fontSize: 16,
      lineHeight: 20,
      fontWeight: "900"
    },
    appPreviewBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radii.round,
      backgroundColor: "rgba(255,255,255,0.16)"
    },
    appPreviewBadgeText: {
      color: colors.heroText,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    appPreviewBody: {
      flexDirection: "row",
      gap: spacing.sm
    },
    appPreviewMetric: {
      flex: 0.9,
      padding: spacing.sm,
      borderRadius: radii.lg,
      backgroundColor: "rgba(255,255,255,0.15)"
    },
    appPreviewMetricValue: {
      color: colors.heroText,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "900"
    },
    appPreviewMetricLabel: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800"
    },
    miniWidgetPreview: {
      flex: 1.1,
      padding: spacing.sm,
      borderRadius: radii.lg,
      backgroundColor: colors.heroText,
      gap: 3
    },
    miniWidgetDot: {
      width: 18,
      height: 5,
      borderRadius: radii.round,
      backgroundColor: colors.accent
    },
    miniWidgetTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 16,
      fontWeight: "900"
    },
    miniWidgetText: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "700"
    },
    trustLine: {
      minHeight: 40,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm
    },
    trustLineText: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800",
      textAlign: "center"
    },
    flowCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs,
      padding: spacing.sm
    },
    flowStep: {
      flex: 1,
      alignItems: "center",
      gap: 6
    },
    flowIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surfaceTint,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line
    },
    flowText: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      textAlign: "center"
    },
    flowLine: {
      width: 24,
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.lineStrong
    },
    choiceCard: {
      gap: spacing.sm,
      padding: spacing.md
    },
    choiceTitle: {
      ...typography.h2
    },
    choiceStack: {
      gap: spacing.xs
    },
    reminderChoice: {
      minHeight: 62,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    reminderChoiceActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft
    },
    choiceRadio: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.lineStrong
    },
    choiceRadioActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent
    },
    choiceCopy: {
      flex: 1,
      gap: 2
    },
    choiceLabel: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    choiceDetail: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    dots: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.xs
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.lineStrong
    },
    dotActive: {
      width: 26,
      backgroundColor: colors.accent
    },
    bottomBar: {
      marginTop: "auto",
      gap: spacing.xs,
      paddingTop: spacing.sm
    },
    freeNote: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800",
      textAlign: "center"
    },
    firstActions: {
      flexDirection: "row",
      gap: spacing.sm
    },
    secondaryActions: {
      flexDirection: "row",
      gap: spacing.sm
    },
    demoButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs
    },
    demoButtonText: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    stepRail: {
      height: 18,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.xs
    },
    stepDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.lineStrong
    },
    stepDotActive: {
      width: 22,
      backgroundColor: colors.accent
    },
    secondaryButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.xs
    },
    secondaryText: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    }
  });
}
