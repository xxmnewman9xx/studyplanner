import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { CalendarCheck2, CheckCircle2, FileScan, Sparkles, WandSparkles } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { AppLogo, GlassCard } from "../components/AppleComponents";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type OnboardingScreenProps = {
  onFinish: () => void;
};

const slides = [
  {
    title: "1. Scan or type school work",
    copy: "Take a picture, paste notes, or type one task. Nothing saves until you approve it.",
    previewTitle: "1. Add school work",
    previewRows: ["Scan syllabus", "Paste homework", "Type a task"],
    icon: FileScan,
    accent: "scan" as const
  },
  {
    title: "2. Review before it saves",
    copy: "StudyPlanner highlights anything confusing, like missing dates or duplicate homework.",
    previewTitle: "2. Check the list",
    previewRows: ["Essay — Friday", "Quiz — needs date", "Project — maybe duplicate"],
    icon: WandSparkles,
    accent: "ai" as const
  },
  {
    title: "3. Today tells you what matters",
    copy: "Today shows the next best move first, so you do not have to hunt through a calendar.",
    previewTitle: "3. Do this next",
    previewRows: ["Finish lab report", "Review quiz notes", "Pack tomorrow"],
    icon: CalendarCheck2,
    accent: "calendar" as const
  },
  {
    title: "4. Focus, finish, repeat",
    copy: "Open the next task, start a focus session, mark it done, then let Today pick the next move.",
    previewTitle: "4. Finish work",
    previewRows: ["Start focus", "Mark done", "Next task appears"],
    icon: Sparkles,
    accent: "widget" as const
  },
  {
    title: "The loop is simple",
    copy: "Scan → review → Today → focus → done. Free is just a tiny preview; Pro unlocks the real planner.",
    previewTitle: "Ready",
    previewRows: ["Tiny free preview", "Pro unlocks scans", "Pro unlocks automation"],
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
  const motion = useRef(new Animated.Value(1)).current;
  const isFinal = index === slides.length - 1;

  useEffect(() => {
    motion.setValue(0);
    Animated.spring(motion, {
      toValue: 1,
      damping: 18,
      stiffness: 130,
      mass: 0.7,
      useNativeDriver: true
    }).start();
  }, [index, motion]);

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

      <Animated.View style={{ opacity: motion, transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
      <GlassCard style={styles.illustrationCard}>
        <View style={styles.illustration}>
          <View style={styles.scanFrame}>
            <View style={styles.scanCornerTop} />
            <View style={styles.scanCornerBottom} />
            <View style={styles.paper}>
              <View style={styles.paperHeader} />
              <View style={styles.paperLineWide} />
              <View style={styles.paperLine} />
              <View style={styles.paperLineShort} />
              <View style={styles.paperDateRow} />
            </View>
          </View>
          <View style={styles.checkBubble}>
            <Icon color={colors.heroText} size={22} />
          </View>
        </View>
        <View style={styles.previewList}>
          <Text style={styles.previewTitle}>{slide.previewTitle}</Text>
          {slide.previewRows.map((row) => (
            <View key={row} style={styles.previewRow}>
              <View style={styles.previewCheck} />
              <Text style={styles.previewText}>{row}</Text>
            </View>
          ))}
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>Review-first import</Text>
          <Text style={styles.statusDot}>•</Text>
          <Text style={styles.statusText}>Private on device</Text>
        </View>
      </GlassCard>
      </Animated.View>

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
      gap: spacing.md,
      backgroundColor: theme.isDark ? "#121827" : "#FFFFFF"
    },
    illustration: {
      width: 176,
      height: 176,
      borderRadius: 36,
      backgroundColor: theme.isDark ? "#182033" : "#F2F2F7",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line
    },
    scanFrame: {
      width: 108,
      height: 130,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.accent,
      alignItems: "center",
      justifyContent: "center"
    },
    scanCornerTop: {
      position: "absolute",
      top: -1,
      left: 18,
      right: 18,
      height: 2,
      backgroundColor: theme.isDark ? "#182033" : "#F2F2F7"
    },
    scanCornerBottom: {
      position: "absolute",
      bottom: -1,
      left: 18,
      right: 18,
      height: 2,
      backgroundColor: theme.isDark ? "#182033" : "#F2F2F7"
    },
    paper: {
      width: 78,
      height: 102,
      borderRadius: 12,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      gap: 7,
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOpacity: 0.16,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 }
    },
    paperHeader: {
      width: 34,
      height: 6,
      borderRadius: 4,
      backgroundColor: colors.accent
    },
    paperLineWide: {
      width: "92%",
      height: 4,
      borderRadius: 3,
      backgroundColor: colors.ink
    },
    paperLine: {
      width: "76%",
      height: 4,
      borderRadius: 3,
      backgroundColor: colors.lineStrong
    },
    paperLineShort: {
      width: "54%",
      height: 4,
      borderRadius: 3,
      backgroundColor: colors.lineStrong
    },
    paperDateRow: {
      width: "64%",
      height: 12,
      borderRadius: 7,
      backgroundColor: colors.accentSoft
    },
    checkBubble: {
      position: "absolute",
      right: 30,
      bottom: 30,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOpacity: 0.22,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 }
    },
    previewList: {
      width: "100%",
      borderRadius: 18,
      padding: spacing.md,
      gap: spacing.xs,
      backgroundColor: colors.surfaceAlt
    },
    previewTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900"
    },
    previewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    previewCheck: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent
    },
    previewText: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    statusRow: {
      minHeight: 32,
      borderRadius: 16,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.surfaceAlt
    },
    statusText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    statusDot: {
      color: colors.faint,
      fontSize: 12,
      fontWeight: "900"
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
