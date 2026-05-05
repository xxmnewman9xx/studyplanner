import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Bell,
  CalendarCheck2,
  ChevronRight,
  Crown,
  FileScan,
  Sparkles
} from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import { ModeToggle } from "../components/ModeToggle";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type OnboardingScreenProps = {
  onFinish: () => void;
};

const slides = [
  {
    badge: "Welcome",
    title: "Make the semester feel manageable",
    copy: "Study Planner turns courses, deadlines, exams, and grades into one calm daily plan.",
    icon: Sparkles
  },
  {
    badge: "Plan",
    title: "Know what matters next",
    copy: "See urgent work first, track progress, and keep assignments moving without a messy checklist.",
    icon: CalendarCheck2
  },
  {
    badge: "Personalize",
    title: "Shape it around your classes",
    copy: "Add courses, deadlines, grade weights, and focus sessions that match your actual semester.",
    icon: Bell
  },
  {
    badge: "Plus",
    title: "Unlock the time-saving tools",
    copy: "Plus adds syllabus scan, calendar sync, smart reminders, and grade forecasting when you are ready.",
    icon: Crown
  }
];

const flowSteps = [
  ["Set up", "Add courses and the dates that define your term."],
  ["Plan", "Use Today to decide the next useful move."],
  ["Unlock", "Add Plus automation when setup work starts to pile up."]
];

export function OnboardingScreen({ onFinish }: OnboardingScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const [index, setIndex] = useState(0);
  const slide = slides[index] ?? slides[0]!;
  const Icon = slide.icon;
  const isFinal = index === slides.length - 1;

  const continueOnboarding = () => {
    if (isFinal) {
      onFinish();
      return;
    }

    setIndex((current) => current + 1);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <View style={styles.logoMark}>
            <FileScan color={colors.heroText} size={20} />
          </View>
          <Text style={styles.brand}>Study Planner: Syllabus AI</Text>
        </View>
        <ModeToggle />
      </View>

      <View style={styles.hero}>
        <View style={styles.iconMark}>
          <Icon color={colors.heroText} size={30} />
        </View>
        <Badge label={slide.badge} tone={slide.badge === "Plus" ? "gold" : "blue"} />
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.copy}>{slide.copy}</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>1</Text>
            <Text style={styles.heroStatLabel}>daily plan</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>4</Text>
            <Text style={styles.heroStatLabel}>core tools</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>+</Text>
            <Text style={styles.heroStatLabel}>Plus</Text>
          </View>
        </View>
      </View>

      <View style={styles.flowPanel}>
        {flowSteps.map(([title, text], stepIndex) => (
          <View key={title} style={styles.flowRow}>
            <View style={styles.flowNumber}>
              <Text style={styles.flowNumberText}>{stepIndex + 1}</Text>
            </View>
            <View style={styles.flowCopy}>
              <Text style={styles.flowTitle}>{title}</Text>
              <Text style={styles.flowText}>{text}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footerPanel}>
        <View style={styles.dots} accessibilityRole="progressbar">
          {slides.map((item, dotIndex) => (
            <View
              key={item.title}
              style={[styles.dot, dotIndex === index ? styles.dotActive : null]}
            />
          ))}
        </View>
        <AppButton
          label={isFinal ? "Continue" : "Next"}
          icon={ChevronRight}
          onPress={continueOnboarding}
        />
      </View>

      <View style={styles.promiseRow}>
        <Text style={styles.promise}>No ads</Text>
        <Text style={styles.promise}>Editable planner</Text>
        <Text style={styles.promise}>Private by default</Text>
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
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.lg
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    brandLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    logoMark: {
      width: 40,
      height: 40,
      borderRadius: radii.lg,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.32 : 0.14,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 7 },
      elevation: 4
    },
    brand: {
      flex: 1,
      color: colors.ink,
      fontSize: 15,
      fontWeight: "900"
    },
    hero: {
      gap: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: colors.heroSurface,
      padding: spacing.lg,
      borderWidth: theme.isDark ? 0 : 1,
      borderColor: colors.line
    },
    iconMark: {
      width: 62,
      height: 62,
      borderRadius: radii.lg,
      backgroundColor: theme.isDark ? "rgba(7,17,29,0.12)" : "rgba(255,255,255,0.1)",
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(7,17,29,0.18)" : "rgba(255,255,255,0.16)",
      alignItems: "center",
      justifyContent: "center"
    },
    title: {
      ...typography.hero,
      color: colors.heroText
    },
    copy: {
      ...typography.body,
      color: colors.heroMuted
    },
    heroStats: {
      flexDirection: "row",
      gap: spacing.sm
    },
    heroStat: {
      flex: 1,
      minHeight: 74,
      borderRadius: radii.lg,
      backgroundColor: theme.isDark ? "rgba(7,17,29,0.12)" : "rgba(255,255,255,0.1)",
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(7,17,29,0.18)" : "rgba(255,255,255,0.16)",
      padding: spacing.sm,
      justifyContent: "center"
    },
    heroStatValue: {
      color: colors.heroText,
      fontSize: 22,
      lineHeight: 27,
      fontWeight: "900"
    },
    heroStatLabel: {
      color: colors.heroMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    flowPanel: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.md
    },
    flowRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md
    },
    flowNumber: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center"
    },
    flowNumberText: {
      color: colors.heroText,
      fontSize: 14,
      fontWeight: "900"
    },
    flowCopy: {
      flex: 1
    },
    flowTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: "900"
    },
    flowText: {
      ...typography.small,
      color: colors.muted
    },
    footerPanel: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.md
    },
    dots: {
      flexDirection: "row",
      gap: spacing.xs,
      alignItems: "center",
      justifyContent: "center"
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.line
    },
    dotActive: {
      width: 24,
      backgroundColor: colors.accent
    },
    promiseRow: {
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    promise: {
      color: colors.faint,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "900"
    }
  });
}
