import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Bell, CalendarCheck2, CheckCircle2, FileScan, Sparkles } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import { ModeToggle } from "../components/ModeToggle";
import { SyllabusParseResult } from "../models";
import { parseSyllabusStub } from "../services/syllabusParser";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type OnboardingScreenProps = {
  onFinish: () => void;
  onApplyParsedPlan: (parse: SyllabusParseResult) => void;
};

export function OnboardingScreen({ onFinish, onApplyParsedPlan }: OnboardingScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(false);
  const [parse, setParse] = useState<SyllabusParseResult | null>(null);

  const handleSampleScan = async () => {
    setLoading(true);
    const result = await parseSyllabusStub({
      kind: "sample",
      name: "ENG 102 syllabus sample"
    });
    setParse(result);
    setLoading(false);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <View style={styles.logoMark}>
            <Sparkles color={colors.ink} size={20} />
          </View>
          <Text style={styles.brand}>Study Planner: Syllabus AI</Text>
        </View>
        <ModeToggle />
      </View>

      <View style={styles.hero}>
        <Badge label="Planner first" tone="gold" />
        <Text style={styles.title}>Turn a messy semester into a daily plan.</Text>
        <Text style={styles.copy}>
          Scan a syllabus, review the detected courses and deadlines, then start with
          the next useful task.
        </Text>
      </View>

      {parse ? (
        <View style={styles.preview}>
          <View style={styles.previewHeader}>
            <CheckCircle2 color={colors.green} size={22} />
            <Text style={styles.previewTitle}>First plan ready</Text>
          </View>
          <Text style={styles.previewCopy}>
            Found {parse.courses.length} course, {parse.assignments.length} deadlines,
            a class schedule, and weighted grade categories.
          </Text>
          <View style={styles.previewList}>
            {parse.assignments.slice(0, 3).map((assignment) => (
              <Text key={assignment.id} style={styles.previewItem}>
                {assignment.title}
              </Text>
            ))}
          </View>
          <AppButton
            label="Use this plan"
            icon={CalendarCheck2}
            onPress={() => onApplyParsedPlan(parse)}
          />
        </View>
      ) : (
        <View style={styles.actions}>
          <AppButton
            label={loading ? "Reading syllabus" : "Scan sample syllabus"}
            icon={FileScan}
            disabled={loading}
            onPress={handleSampleScan}
          />
          {loading ? <ActivityIndicator color={colors.ink} /> : null}
          <AppButton label="Start with planner" variant="secondary" icon={Bell} onPress={onFinish} />
        </View>
      )}

      <View style={styles.promiseRow}>
        <Text style={styles.promise}>No ads</Text>
        <Text style={styles.promise}>Editable AI</Text>
        <Text style={styles.promise}>Calm reminders</Text>
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
    title: {
      ...typography.title,
      fontSize: 34,
      lineHeight: 40
    },
    copy: {
      ...typography.body,
      color: colors.muted
    },
    actions: {
      gap: spacing.sm
    },
    preview: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.md
    },
    previewHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    previewTitle: {
      color: colors.ink,
      fontSize: 19,
      fontWeight: "900"
    },
    previewCopy: {
      ...typography.body
    },
    previewList: {
      gap: spacing.xs
    },
    previewItem: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: "700"
    },
    promiseRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    promise: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "800"
    }
  });
}
