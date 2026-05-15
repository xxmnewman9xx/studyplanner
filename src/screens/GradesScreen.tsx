import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Plus, TrendingUp } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { Assignment, Course, GradeItem } from "../models";
import {
  calculateNeededOnRemaining,
  calculateNeededOnSingleFutureScore,
  formatPercent,
  letterFromPercent,
  summarizeCourseGrade
} from "../logic/grades";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type GradesScreenProps = {
  courses: Course[];
  assignments: Assignment[];
  gradeItems: GradeItem[];
  targetGradePercent: number;
  onTargetGradeChange: (value: number) => void;
  onAddGradeItem: (item: Omit<GradeItem, "id">) => void;
  onUpdateGradeItem: (gradeItemId: string, patch: Partial<GradeItem>) => void;
};

export function GradesScreen({
  courses,
  assignments,
  gradeItems,
  targetGradePercent,
  onTargetGradeChange,
  onAddGradeItem,
  onUpdateGradeItem
}: GradesScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [target, setTarget] = useState(String(targetGradePercent));
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newEarned, setNewEarned] = useState("");
  const [newPossible, setNewPossible] = useState("100");
  const [whatIfWeight, setWhatIfWeight] = useState("20");
  const selectedCourse = courses.find((course) => course.id === selectedCourseId) || courses[0];
  const selectedCourseGradeItems = selectedCourse
    ? gradeItems.filter((item) => item.courseId === selectedCourse.id)
    : [];

  useEffect(() => {
    if (!selectedCourse) return;
    setSelectedCategoryId((current) => current || selectedCourse.gradeCategories[0]?.id || "");
  }, [selectedCourse]);

  useEffect(() => {
    setTarget(String(targetGradePercent));
  }, [targetGradePercent]);

  const summary = useMemo(
    () => (selectedCourse ? summarizeCourseGrade(selectedCourse, gradeItems) : null),
    [selectedCourse, gradeItems]
  );

  const needed = summary
    ? calculateNeededOnRemaining(
        summary.currentPercent,
        summary.completedWeight,
        targetGradePercent
      )
    : 0;
  const nextScoreNeeded = summary
    ? calculateNeededOnSingleFutureScore(
        summary.currentPercent,
        targetGradePercent,
        Number.parseFloat(whatIfWeight) || 0
      )
    : 0;
  const gradePressure = needed > 100 ? "High" : needed > 92 ? "Watch" : "Manageable";
  const courseDeadlines = selectedCourse
    ? assignments.filter((assignment) => assignment.courseId === selectedCourse.id)
    : [];

  useEffect(() => {
    if (courses.length === 0) {
      setSelectedCourseId("");
      return;
    }

    if (!courses.some((course) => course.id === selectedCourseId)) {
      setSelectedCourseId(courses[0]?.id || "");
    }
  }, [courses, selectedCourseId]);

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.kicker}>Grade tracker</Text>
        <Text style={styles.title}>Know the target before finals week.</Text>
        <Text style={styles.subtitle}>
          Weighted categories, current pace, and the score needed on remaining work.
        </Text>
      </View>

      <View style={styles.courseTabs}>
        {courses.length === 0 ? (
          <Text style={styles.emptyCard}>Add a course before tracking grades.</Text>
        ) : null}
        {courses.map((course) => (
          <TouchableOpacity
            accessibilityRole="button"
            key={course.id}
            style={[
              styles.courseTab,
              selectedCourse?.id === course.id ? styles.courseTabActive : null
            ]}
            onPress={() => setSelectedCourseId(course.id)}
          >
            <Text
              style={[
                styles.courseTabText,
                selectedCourse?.id === course.id ? styles.courseTabTextActive : null
              ]}
            >
              {course.code}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedCourse && summary ? (
        <>
          <View style={styles.metricRow}>
            <MetricCard
              label="Current"
              value={formatPercent(summary.currentPercent)}
              detail={letterFromPercent(summary.currentPercent)}
              tone="green"
            />
            <MetricCard
              label="Needed"
              value={formatPercent(needed)}
              detail={`${gradePressure} pressure`}
              tone={needed > 100 ? "gold" : "blue"}
            />
          </View>

          <View style={styles.targetCard}>
            <View style={styles.targetHeader}>
              <TrendingUp color={colors.ink} size={20} />
              <Text style={styles.targetTitle}>Target-grade calculator</Text>
            </View>
            <Text style={styles.targetCopy}>
              Aim for
              <Text style={styles.targetNumber}> {target || "0"}% </Text>
              overall. Remaining work needs about
              <Text style={styles.targetNumber}> {formatPercent(needed)} </Text>
              on average.
            </Text>
            <TextInput
              keyboardType="numeric"
              value={target}
              onChangeText={(value) => {
                setTarget(value);
                onTargetGradeChange(Number.parseFloat(value) || 0);
              }}
              placeholder="Target percent"
              placeholderTextColor={colors.faint}
              style={styles.targetInput}
            />
            <View style={styles.whatIfCard}>
              <Text style={styles.whatIfLabel}>Next test what-if</Text>
              <Text style={styles.targetCopy}>
                If the next score is worth
                <Text style={styles.targetNumber}> {whatIfWeight || "0"}% </Text>
                of the course, you need about
                <Text style={styles.targetNumber}> {formatPercent(nextScoreNeeded)} </Text>
                on it to stay on target.
              </Text>
              <TextInput
                keyboardType="numeric"
                value={whatIfWeight}
                onChangeText={setWhatIfWeight}
                placeholder="Next score weight"
                placeholderTextColor={colors.faint}
                style={styles.targetInput}
              />
            </View>
          </View>

          <SectionHeader title="Weighted Categories" note={selectedCourse.name} />
          <View style={styles.categoryList}>
            {summary.categorySummaries.map((category) => (
              <View key={category.id} style={styles.categoryRow}>
                <View style={styles.categoryCopy}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryMeta}>{category.weight}% of grade</Text>
                </View>
                <Badge
                  label={formatPercent(category.average)}
                  tone={category.average === null ? "neutral" : "green"}
                />
              </View>
            ))}
          </View>

          <SectionHeader title="Add Score" note="Keep grade pressure current" />
          <View style={styles.addGradeCard}>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Score title"
              placeholderTextColor={colors.faint}
              style={styles.targetInput}
            />
            <View style={styles.chipRow}>
              {selectedCourse.gradeCategories.map((category) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategoryId === category.id ? styles.categoryChipActive : null
                  ]}
                  onPress={() => setSelectedCategoryId(category.id)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategoryId === category.id
                        ? styles.categoryChipTextActive
                        : null
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.scoreInputs}>
              <TextInput
                keyboardType="numeric"
                value={newEarned}
                onChangeText={setNewEarned}
                placeholder="Earned"
                placeholderTextColor={colors.faint}
                style={[styles.targetInput, styles.scoreInput]}
              />
              <TextInput
                keyboardType="numeric"
                value={newPossible}
                onChangeText={setNewPossible}
                placeholder="Possible"
                placeholderTextColor={colors.faint}
                style={[styles.targetInput, styles.scoreInput]}
              />
            </View>
            <AppButton
              label="Add score"
              icon={Plus}
              onPress={() => {
                if (!newTitle.trim() || !selectedCategoryId) return;
                onAddGradeItem({
                  courseId: selectedCourse.id,
                  categoryId: selectedCategoryId,
                  title: newTitle.trim(),
                  earned: Number.parseFloat(newEarned) || 0,
                  possible: Number.parseFloat(newPossible) || 100
                });
                setNewTitle("");
                setNewEarned("");
                setNewPossible("100");
              }}
            />
          </View>

          <SectionHeader title="Recent Scores" note="Tap values to correct them" />
          <View style={styles.scoreList}>
            {selectedCourseGradeItems.length === 0 ? (
              <Text style={styles.emptyCopy}>No grade entries yet.</Text>
            ) : (
              selectedCourseGradeItems.map((item) => (
                <View key={item.id} style={styles.scoreRow}>
                  <View style={styles.scoreCopy}>
                    <TextInput
                      value={item.title}
                      onChangeText={(title) => onUpdateGradeItem(item.id, { title })}
                      placeholder="Score title"
                      placeholderTextColor={colors.faint}
                      style={styles.scoreTitleInput}
                    />
                    <Text style={styles.categoryMeta}>
                      {
                        selectedCourse.gradeCategories.find(
                          (category) => category.id === item.categoryId
                        )?.name
                      }
                    </Text>
                  </View>
                  <View style={styles.inlineScores}>
                    <TextInput
                      keyboardType="numeric"
                      value={String(item.earned)}
                      onChangeText={(earned) =>
                        onUpdateGradeItem(item.id, {
                          earned: Number.parseFloat(earned) || 0
                        })
                      }
                      style={styles.inlineScoreInput}
                    />
                    <Text style={styles.scoreSlash}>/</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={String(item.possible)}
                      onChangeText={(possible) =>
                        onUpdateGradeItem(item.id, {
                          possible: Number.parseFloat(possible) || 0
                        })
                      }
                      style={styles.inlineScoreInput}
                    />
                  </View>
                </View>
              ))
            )}
          </View>

          <SectionHeader title="Grade Pressure Alerts" />
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{gradePressure}</Text>
            <Text style={styles.alertCopy}>
              {courseDeadlines.length} upcoming grade-related items are connected to this
              course. Reminder intensity should rise when the target grade is at risk.
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    header: {
      gap: spacing.xs
    },
    kicker: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900"
    },
    title: {
      ...typography.title
    },
    subtitle: {
      ...typography.body
    },
    courseTabs: {
      flexDirection: "row",
      gap: spacing.xs,
      flexWrap: "wrap",
      marginTop: spacing.lg
    },
    emptyCard: {
      overflow: "hidden",
      width: "100%",
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "700"
    },
    courseTab: {
      minHeight: 38,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface
    },
    courseTabActive: {
      backgroundColor: colors.softGold,
      borderColor: colors.gold
    },
    courseTabText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "900"
    },
    courseTabTextActive: {
      color: colors.ink
    },
    metricRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg
    },
    targetCard: {
      marginTop: spacing.lg,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm
    },
    targetHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    targetTitle: {
      color: colors.ink,
      fontSize: 16,
      fontWeight: "900"
    },
    targetCopy: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21
    },
    targetNumber: {
      color: colors.ink,
      fontWeight: "900"
    },
    targetInput: {
      minWidth: 0,
      minHeight: 46,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.line,
      color: colors.ink,
      backgroundColor: colors.canvas,
      paddingHorizontal: spacing.sm,
      fontSize: 15,
      fontWeight: "800"
    },
    whatIfCard: {
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.canvas,
      padding: spacing.sm,
      gap: spacing.xs
    },
    whatIfLabel: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: "900"
    },
    categoryList: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      overflow: "hidden"
    },
    categoryRow: {
      minHeight: 72,
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    categoryCopy: {
      flex: 1
    },
    categoryName: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    categoryMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17
    },
    addGradeCard: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    categoryChip: {
      minHeight: 36,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center"
    },
    categoryChipActive: {
      backgroundColor: colors.softGold,
      borderColor: colors.gold
    },
    categoryChipText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900"
    },
    categoryChipTextActive: {
      color: colors.ink
    },
    scoreInputs: {
      flexDirection: "row",
      gap: spacing.sm
    },
    scoreInput: {
      flex: 1,
      minWidth: 0
    },
    scoreList: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      overflow: "hidden"
    },
    scoreRow: {
      minHeight: 74,
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    scoreCopy: {
      flex: 1,
      gap: 2
    },
    scoreTitleInput: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900",
      padding: 0
    },
    inlineScores: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4
    },
    inlineScoreInput: {
      width: 46,
      minHeight: 38,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.line,
      color: colors.ink,
      backgroundColor: colors.canvas,
      textAlign: "center",
      fontSize: 13,
      fontWeight: "900"
    },
    scoreSlash: {
      color: colors.faint,
      fontWeight: "900"
    },
    emptyCopy: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      padding: spacing.md
    },
    alertCard: {
      borderRadius: radii.md,
      backgroundColor: theme.isDark ? "#2A2616" : "#FBF2D5",
      padding: spacing.md,
      gap: spacing.xs
    },
    alertTitle: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "900"
    },
    alertCopy: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21
    }
  });
}
