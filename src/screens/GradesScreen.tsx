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
  const hasGradeEntries = selectedCourseGradeItems.some((item) => item.possible > 0);
  const hasGradeCategories = Boolean(selectedCourse?.gradeCategories.length);

  useEffect(() => {
    if (!selectedCourse) return;
    setSelectedCategoryId((current) =>
      selectedCourse.gradeCategories.some((category) => category.id === current)
        ? current
        : selectedCourse.gradeCategories[0]?.id || ""
    );
  }, [selectedCourse]);

  useEffect(() => {
    setTarget(String(targetGradePercent));
  }, [targetGradePercent]);

  const summary = useMemo(
    () => (selectedCourse ? summarizeCourseGrade(selectedCourse, gradeItems) : null),
    [selectedCourse, gradeItems]
  );
  const targetPercent = Number.parseFloat(target) || targetGradePercent || 0;

  const needed = summary
    ? calculateNeededOnRemaining(
        summary.currentPercent,
        summary.completedWeight,
        targetPercent
      )
    : 0;
  const nextScoreNeeded = summary
    ? calculateNeededOnSingleFutureScore(
        summary.currentPercent,
        targetPercent,
        Number.parseFloat(whatIfWeight) || 0
      )
    : 0;
  const remainingWeight = summary ? Math.max(100 - summary.completedWeight, 0) : 0;
  const categoryCount = summary?.categorySummaries.length || 0;
  const scoredCategoryCount =
    summary?.categorySummaries.filter((category) => category.average !== null).length || 0;
  const weakestCategory = summary?.categorySummaries
    .filter((category) => category.average !== null)
    .sort((left, right) => (left.average || 0) - (right.average || 0))[0];
  const targetDelta = summary ? targetPercent - summary.currentPercent : 0;
  const gradeMomentum = !hasGradeEntries
    ? "Waiting for scores"
    : !Number.isFinite(needed)
      ? summary && summary.currentPercent >= targetPercent
        ? "Target held"
        : "Target out of reach"
    : needed > 100
      ? "Stretch"
      : needed > 92
        ? "Focus"
        : "On track";
  const openCourseAssignments = selectedCourse
    ? assignments.filter(
        (assignment) =>
          assignment.courseId === selectedCourse.id &&
          assignment.status !== "done" &&
          assignment.status !== "archived"
      )
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
        <Text style={styles.kicker}>Performance dashboard</Text>
        <Text style={styles.title}>Keep every class on target.</Text>
        <Text style={styles.subtitle}>
          Weighted categories, grade momentum, and clean what-if math before finals week.
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

      {!selectedCourse ? (
        <View style={styles.setupCard}>
          <Text style={styles.setupTitle}>Grades need a course first.</Text>
          <Text style={styles.setupCopy}>
            Import a syllabus or add a course, then this screen will show real category weights,
            score history, and target math.
          </Text>
        </View>
      ) : null}

      {selectedCourse && summary ? (
        <>
          <View style={styles.metricRow}>
            <MetricCard
              label="Current"
              value={hasGradeEntries ? formatPercent(summary.currentPercent) : "--"}
              detail={hasGradeEntries ? letterFromPercent(summary.currentPercent) : "No scores yet"}
              tone="green"
            />
            <MetricCard
              label="Target pace"
              value={hasGradeEntries ? formatPercent(needed) : "--"}
              detail={hasGradeEntries ? `${gradeMomentum} momentum` : "Waiting on first grade"}
              tone={hasGradeEntries && needed > 100 ? "gold" : "blue"}
            />
          </View>

          <View style={styles.targetCard}>
            <View style={styles.targetHeader}>
              <TrendingUp color={colors.heroText} size={20} />
              <Text style={styles.targetTitle}>Target-grade calculator</Text>
            </View>
            {hasGradeEntries ? (
              <Text style={styles.targetCopy}>
                Aim for
                <Text style={styles.targetNumber}> {formatPercent(targetPercent)} </Text>
                overall. Remaining work needs about
                <Text style={styles.targetNumber}> {formatPercent(needed)} </Text>
                on average.
              </Text>
            ) : (
              <Text style={styles.targetCopy}>
                Set the goal now. After the first real score is added, StudyPlanner will calculate
                the remaining average needed without guessing.
              </Text>
            )}
            <TextInput
              keyboardType="numeric"
              value={target}
              onChangeText={(value) => {
                setTarget(value);
                onTargetGradeChange(Number.parseFloat(value) || 0);
              }}
              placeholder="Target percent"
              placeholderTextColor={colors.heroMuted}
              style={[styles.targetInput, styles.targetHeroInput]}
            />
            {hasGradeEntries ? (
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
                  placeholderTextColor={colors.heroMuted}
                  style={[styles.targetInput, styles.targetHeroInput]}
                />
              </View>
            ) : (
              <View style={styles.whatIfCard}>
                <Text style={styles.whatIfLabel}>Next test what-if</Text>
                <Text style={styles.targetCopy}>
                  Add one scored item first, then this will show the score needed on a future test.
                </Text>
              </View>
            )}
            <View style={styles.targetFacts}>
              <View style={styles.targetFact}>
                <Text style={styles.factValue}>{formatPercent(summary.completedWeight)}</Text>
                <Text style={styles.factLabel}>graded weight</Text>
              </View>
              <View style={styles.targetFact}>
                <Text style={styles.factValue}>{formatPercent(remainingWeight)}</Text>
                <Text style={styles.factLabel}>still open</Text>
              </View>
              <View style={styles.targetFact}>
                <Text style={styles.factValue}>
                  {hasGradeEntries ? formatSignedPercent(targetDelta) : "--"}
                </Text>
                <Text style={styles.factLabel}>target gap</Text>
              </View>
            </View>
          </View>

          <SectionHeader title="Grade weights" note={`${selectedCourse.name}: how much each category counts.`} />
          <View style={styles.categoryList}>
            {summary.categorySummaries.length === 0 ? (
              <View style={styles.inlineEmpty}>
                <Text style={styles.inlineEmptyTitle}>No grade weights yet</Text>
                <Text style={styles.inlineEmptyCopy}>
                  Add grade categories to this course before the calculator can weight scores.
                </Text>
              </View>
            ) : (
              summary.categorySummaries.map((category) => (
                <View key={category.id} style={styles.categoryRow}>
                  <View style={styles.categoryCopy}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryMeta}>
                      {category.weight}% of grade - {category.average === null ? "no scores yet" : `${formatPercent(category.contribution)} toward course`}
                    </Text>
                  </View>
                  <Badge
                    label={formatPercent(category.average)}
                    tone={category.average === null ? "neutral" : "green"}
                  />
                </View>
              ))
            )}
          </View>

          <SectionHeader title="Add a grade" note="Enter a score from a test, quiz, paper, or homework." />
          <View style={styles.addGradeCard}>
            {!hasGradeCategories ? (
              <View style={styles.inlineEmpty}>
                <Text style={styles.inlineEmptyTitle}>No grade categories yet</Text>
                <Text style={styles.inlineEmptyCopy}>
                  Add categories to this course before entering scores.
                </Text>
              </View>
            ) : null}
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Score title"
              placeholderTextColor={colors.heroMuted}
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
                placeholderTextColor={colors.heroMuted}
                style={[styles.targetInput, styles.scoreInput]}
              />
              <TextInput
                keyboardType="numeric"
                value={newPossible}
                onChangeText={setNewPossible}
                placeholder="Possible"
                placeholderTextColor={colors.heroMuted}
                style={[styles.targetInput, styles.scoreInput]}
              />
            </View>
            <AppButton
              label="Add this grade"
              icon={Plus}
              disabled={!newTitle.trim() || !selectedCategoryId}
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

          <SectionHeader title="Recent grades" note="Tap a grade if you need to fix it." />
          <View style={styles.scoreList}>
            {selectedCourseGradeItems.length === 0 ? (
              <View style={styles.inlineEmpty}>
                <Text style={styles.inlineEmptyTitle}>No grade entries yet</Text>
                <Text style={styles.inlineEmptyCopy}>
                  Add the first real score to turn on current grade and target pace.
                </Text>
              </View>
            ) : (
              selectedCourseGradeItems.map((item) => (
                <View key={item.id} style={styles.scoreRow}>
                  <View style={styles.scoreCopy}>
                    <TextInput
                      value={item.title}
                      onChangeText={(title) => onUpdateGradeItem(item.id, { title })}
                      placeholder="Score title"
                      placeholderTextColor={colors.heroMuted}
                      style={styles.scoreTitleInput}
                      numberOfLines={1}
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

          <SectionHeader title="What this means" />
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>{gradeMomentum}</Text>
            <Text style={styles.alertCopy}>
              {!hasGradeEntries
                ? "Add one real score before StudyPlanner summarizes momentum for this class."
                : Number.isFinite(needed)
                  ? `${openCourseAssignments.length} open course ${openCourseAssignments.length === 1 ? "item" : "items"} remain. ${scoredCategoryCount}/${categoryCount || 0} weighted categories have scores${weakestCategory ? `; lowest current area is ${weakestCategory.name} at ${formatPercent(weakestCategory.average)}.` : "."}`
                  : "This class has no remaining category weight in the calculator, so compare the current grade directly with the target."}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

function formatSignedPercent(value: number) {
  if (!Number.isFinite(value)) return "--";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    header: {
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : colors.line,
      backgroundColor: colors.heroSurface,
      padding: spacing.md,
      gap: spacing.xs,
      overflow: "hidden"
    },
    kicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.8,
      textTransform: "uppercase"
    },
    title: {
      ...typography.title,
      color: colors.heroText,
      letterSpacing: 0
    },
    subtitle: {
      ...typography.body,
      color: colors.heroMuted,
      fontWeight: "600"
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
    setupCard: {
      marginTop: spacing.lg,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.lg,
      gap: spacing.xs
    },
    setupTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    setupCopy: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "700"
    },
    courseTab: {
      minHeight: 38,
      borderRadius: radii.round,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface
    },
    courseTabActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent
    },
    courseTabText: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "900"
    },
    courseTabTextActive: {
      color: colors.accent
    },
    metricRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg,
      minWidth: 0
    },
    targetCard: {
      marginTop: spacing.lg,
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)",
      backgroundColor: colors.heroSurface,
      padding: spacing.md,
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.32 : 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 14 },
      elevation: 6
    },
    targetHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    targetTitle: {
      color: colors.heroText,
      fontSize: 16,
      fontWeight: "900",
      letterSpacing: 0
    },
    targetCopy: {
      color: colors.heroMuted,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "600"
    },
    targetNumber: {
      color: colors.heroText,
      fontWeight: "900"
    },
    targetInput: {
      minWidth: 0,
      minHeight: 46,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      color: colors.heroText,
      backgroundColor: "rgba(255,255,255,0.1)",
      paddingHorizontal: spacing.sm,
      fontSize: 15,
      fontWeight: "800"
    },
    targetHeroInput: {
      borderColor: "rgba(255,255,255,0.22)",
      backgroundColor: "rgba(255,255,255,0.12)",
      color: colors.heroText
    },
    whatIfCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "rgba(255,255,255,0.08)",
      padding: spacing.sm,
      gap: spacing.xs
    },
    whatIfLabel: {
      color: colors.heroText,
      fontSize: 13,
      fontWeight: "900"
    },
    targetFacts: {
      flexDirection: "row",
      gap: spacing.xs
    },
    targetFact: {
      flex: 1,
      minHeight: 66,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.16)",
      backgroundColor: "rgba(255,255,255,0.08)",
      padding: spacing.xs,
      justifyContent: "center",
      gap: 2
    },
    factValue: {
      color: colors.heroText,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900",
      textAlign: "center"
    },
    factLabel: {
      color: colors.heroMuted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textAlign: "center",
      textTransform: "uppercase"
    },
    categoryList: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)",
      backgroundColor: colors.heroSurface,
      overflow: "hidden"
    },
    categoryRow: {
      minHeight: 72,
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.12)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    categoryCopy: {
      flex: 1
    },
    categoryName: {
      color: colors.heroText,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    categoryMeta: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17
    },
    addGradeCard: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)",
      backgroundColor: colors.heroSurface,
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
      borderColor: "rgba(255,255,255,0.18)",
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center"
    },
    categoryChipActive: {
      backgroundColor: "rgba(53,242,208,0.14)",
      borderColor: colors.accent
    },
    categoryChipText: {
      color: colors.heroMuted,
      fontSize: 12,
      fontWeight: "900"
    },
    categoryChipTextActive: {
      color: colors.heroText
    },
    scoreInputs: {
      flexDirection: "row",
      gap: spacing.sm,
      minWidth: 0
    },
    scoreInput: {
      flex: 1,
      minWidth: 0
    },
    scoreList: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)",
      backgroundColor: colors.heroSurface,
      overflow: "hidden"
    },
    scoreRow: {
      minHeight: 74,
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.12)",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    scoreCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0
    },
    scoreTitleInput: {
      color: colors.heroText,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900",
      padding: 0
    },
    inlineScores: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flexShrink: 0
    },
    inlineScoreInput: {
      width: 46,
      minHeight: 38,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      color: colors.heroText,
      backgroundColor: "rgba(255,255,255,0.1)",
      textAlign: "center",
      fontSize: 13,
      fontWeight: "900"
    },
    scoreSlash: {
      color: colors.heroMuted,
      fontWeight: "900"
    },
    emptyCopy: {
      color: colors.heroMuted,
      fontSize: 14,
      lineHeight: 21,
      padding: spacing.md
    },
    inlineEmpty: {
      padding: spacing.md,
      gap: spacing.xs
    },
    inlineEmptyTitle: {
      color: colors.heroText,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    inlineEmptyCopy: {
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700"
    },
    alertCard: {
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.isDark ? "rgba(53,242,208,0.24)" : colors.line,
      backgroundColor: theme.isDark ? "rgba(53,242,208,0.10)" : colors.accentSoft,
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
