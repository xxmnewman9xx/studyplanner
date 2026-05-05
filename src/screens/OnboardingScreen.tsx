import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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
    title: "Make the semester feel manageable.",
    copy: "Study Planner turns courses, deadlines, exams, and grades into one calm daily plan.",
    icon: Sparkles
  },
  {
    badge: "Plan",
    title: "Know what matters next.",
    copy: "See urgent work first, track progress, and keep assignments moving without a messy checklist.",
    icon: CalendarCheck2
  },
  {
    badge: "Personalize",
    title: "Shape it around your classes.",
    copy: "Add courses, deadlines, grade weights, and focus sessions that match your actual semester.",
    icon: Bell
  },
  {
    badge: "Plus",
    title: "Unlock the time-saving tools.",
    copy: "Plus adds syllabus scan, calendar sync, smart reminders, and grade forecasting when you are ready.",
    icon: Crown
  }
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
    <View style={styles.screen}>
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <View style={styles.logoMark}>
            <FileScan color={colors.ink} size={20} />
          </View>
          <Text style={styles.brand}>Study Planner: Syllabus AI</Text>
        </View>
        <ModeToggle />
      </View>

      <View style={styles.hero}>
        <View style={styles.iconMark}>
          <Icon color={colors.ink} size={32} />
        </View>
        <Badge label={slide.badge} tone={slide.badge === "Plus" ? "gold" : "green"} />
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.copy}>{slide.copy}</Text>
      </View>

      <View style={styles.footer}>
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
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    screen: {
      flex: 1,
      padding: spacing.lg,
      backgroundColor: colors.canvas,
      justifyContent: "space-between"
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
      borderRadius: radii.md,
      backgroundColor: colors.softGold,
      alignItems: "center",
      justifyContent: "center"
    },
    brand: {
      flex: 1,
      color: colors.ink,
      fontSize: 15,
      fontWeight: "900"
    },
    hero: {
      gap: spacing.md,
      paddingVertical: spacing.xl
    },
    iconMark: {
      width: 72,
      height: 72,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center"
    },
    title: {
      ...typography.title,
      fontSize: 34,
      lineHeight: 40
    },
    copy: {
      ...typography.body,
      color: colors.muted
    },
    footer: {
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
    }
  });
}
