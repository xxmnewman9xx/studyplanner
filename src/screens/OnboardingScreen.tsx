import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Bell,
  CheckCircle2,
  FileScan,
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
    eyebrow: "First minute",
    title: "Turn any syllabus into a semester plan.",
    copy: "Scan or upload a syllabus, review every deadline, then let Today pick the next move.",
    icon: FileScan,
    rows: ["Upload PDF, photo, or pasted text", "Extract classes and deadlines", "Approve before anything saves"]
  },
  {
    eyebrow: "Trust check",
    title: "Review before it touches your planner.",
    copy: "StudyPlanner flags missing dates, low confidence items, and possible duplicates so the plan feels trustworthy.",
    icon: WandSparkles,
    rows: ["Lab report - Fri", "Midterm - Oct 12", "Reading notes - needs review"]
  },
  {
    eyebrow: "Setup",
    title: "Pick the reminder style you actually want.",
    copy: "No notification prompt yet. We ask only after you have real assignments and choose to set reminders.",
    icon: Bell,
    rows: ["Minimal: major deadlines", "Balanced: deadlines and prep", "Intensive: study blocks too"]
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
      </GlassCard>

      {isFinal ? (
        <GlassCard style={styles.choiceCard}>
          <Text style={styles.choiceTitle}>Reminder preset</Text>
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
          label={index === 0 || isFinal ? "Scan or upload syllabus" : "Continue"}
          icon={index === 0 || isFinal ? FileScan : undefined}
          onPress={() => {
            if (index === 0 || isFinal) {
              finish("import");
              return;
            }
            setIndex((current) => current + 1);
          }}
        />
        {index === 0 ? (
          <TouchableOpacity accessibilityRole="button" style={styles.demoButton} onPress={() => finish("demo")}>
            <Sparkles color={colors.accent} size={16} />
            <Text style={styles.demoButtonText}>Try demo planner first</Text>
          </TouchableOpacity>
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
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xl,
      gap: spacing.sm
    },
    brandRow: {
      flexDirection: "row",
      justifyContent: "center"
    },
    heroCard: {
      gap: spacing.xs,
      padding: spacing.sm
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
      fontSize: 24,
      lineHeight: 29,
      fontWeight: "900"
    },
    copy: {
      color: colors.heroMuted,
      fontSize: 14,
      lineHeight: 20,
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
    proofCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs,
      padding: spacing.sm
    },
    proofRow: {
      flex: 1,
      alignItems: "center",
      gap: 6
    },
    proofText: {
      color: colors.ink,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textAlign: "center"
    },
    proofDivider: {
      width: StyleSheet.hairlineWidth,
      height: 44,
      backgroundColor: colors.line
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
    secondaryActions: {
      flexDirection: "row",
      gap: spacing.sm
    },
    demoButton: {
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
