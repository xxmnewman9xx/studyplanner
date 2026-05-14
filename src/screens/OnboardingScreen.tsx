import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CalendarCheck2, CheckCircle2, FileScan, Sparkles, WandSparkles } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { AppLogo, EmojiAccent, GlassCard } from "../components/AppleComponents";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type OnboardingScreenProps = {
  onFinish: () => void;
};

const slides = [
  {
    title: "Scan your syllabus with Syllabus AI",
    copy: "StudyPlanner finds assignments, readings, dates, and grade weights so you can review them before they save.",
    icon: FileScan,
    accent: "scan" as const
  },
  {
    title: "Catch missing dates before they hurt",
    copy: "Found work appears in one editable list, including low-confidence rows and possible assignments with no clear due date.",
    icon: WandSparkles,
    accent: "ai" as const
  },
  {
    title: "Know what to do today",
    copy: "Spot busy days, upcoming exams, and overlapping deadlines while there is still time to adjust.",
    icon: CalendarCheck2,
    accent: "calendar" as const
  },
  {
    title: "Keep the right work visible",
    copy: "Use calm widgets and focus views to keep today’s assignments close without opening the whole planner.",
    icon: Sparkles,
    accent: "widget" as const
  },
  {
    title: "Ready when you are",
    copy: "Add your first syllabus, paste homework notes, or start manually. You stay in control of what gets saved.",
    icon: CheckCircle2,
    accent: "complete" as const
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
        <AppLogo showWordmark size={46} />
      </View>

      <GlassCard style={styles.illustrationCard}>
        <View style={styles.illustration}>
          <View style={styles.paper}>
            <View style={styles.paperLineWide} />
            <View style={styles.paperLine} />
            <View style={styles.paperLineShort} />
          </View>
          <View style={styles.checkBubble}>
            <Icon color={colors.heroText} size={22} />
          </View>
        </View>
        <View style={styles.emojiRow}>
          <EmojiAccent name={slide.accent} label={slide.title} decorative={false} size={20} />
        </View>
      </GlassCard>

      <View style={styles.copyBlock}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.copy}>{slide.copy}</Text>
      </View>

      <View style={styles.dots} accessibilityRole="progressbar">
        {slides.map((item, dotIndex) => (
          <View key={item.title} style={[styles.dot, dotIndex === index ? styles.dotActive : null]} />
        ))}
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.promise}>Private by default. Saved only after review.</Text>
        <AppButton label={isFinal ? "Get started" : "Continue"} onPress={continueOnboarding} style={styles.cta} />
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, spacing, typography } = theme;

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.canvas,
      padding: spacing.lg,
      gap: spacing.lg
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm
    },
    illustrationCard: {
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: theme.isDark ? "#17142A" : "#F1ECFF"
    },
    illustration: {
      width: 156,
      height: 156,
      borderRadius: 30,
      backgroundColor: theme.isDark ? "#241D3E" : "#EFE9FF",
      alignItems: "center",
      justifyContent: "center"
    },
    paper: {
      width: 74,
      height: 94,
      borderRadius: 10,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      gap: 7,
      justifyContent: "center"
    },
    paperLineWide: {
      width: "90%",
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.ink
    },
    paperLine: {
      width: "72%",
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.lineStrong
    },
    paperLineShort: {
      width: "52%",
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.lineStrong
    },
    checkBubble: {
      position: "absolute",
      right: 42,
      bottom: 42,
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center"
    },
    emojiRow: {
      height: 24,
      alignItems: "center",
      justifyContent: "center"
    },
    copyBlock: {
      alignItems: "center",
      gap: spacing.xs
    },
    title: {
      ...typography.title,
      textAlign: "center"
    },
    copy: {
      ...typography.body,
      textAlign: "center",
      maxWidth: 330
    },
    dots: {
      flexDirection: "row",
      gap: spacing.xs,
      alignItems: "center",
      justifyContent: "center"
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.lineStrong
    },
    dotActive: {
      width: 24,
      backgroundColor: colors.accent
    },
    bottomBar: {
      marginTop: "auto",
      gap: spacing.sm
    },
    cta: {
      backgroundColor: colors.accent
    },
    promise: {
      color: colors.faint,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "900",
      textAlign: "center"
    }
  });
}
