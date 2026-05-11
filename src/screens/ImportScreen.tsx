import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  CheckCheck,
  CheckCircle2,
  FileText,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload
} from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import { SectionHeader } from "../components/SectionHeader";
import { AssignmentKind, Priority, SyllabusImportSource, SyllabusParseResult } from "../models";
import { isStoreCaptureEnabled } from "../config/storeCapture";
import { createDemoSyllabusParseResult, messySyllabusExample } from "../data/demoSemester";
import { parseSyllabus, supportsSyllabusImageParsing, updateParsedAssignment } from "../services/syllabusParser";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type ImportScreenProps = {
  onApplyParsedPlan: (parse: SyllabusParseResult) => void;
};

const priorities: Priority[] = ["low", "medium", "high"];
const kinds: AssignmentKind[] = ["assignment", "exam"];

export function ImportScreen({ onApplyParsedPlan }: ImportScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const captureMode = isStoreCaptureEnabled();
  const [draft, setDraft] = useState<SyllabusParseResult | null>(() =>
    captureMode ? createDemoSyllabusParseResult() : null
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const imageParsingReady = supportsSyllabusImageParsing();
  const reviewStats = useMemo(() => {
    const assignments = draft?.assignments || [];
    return {
      total: assignments.length,
      needsReview: assignments.filter((assignment) => assignment.reviewStatus === "needsReview")
        .length,
      accepted: assignments.filter((assignment) => assignment.reviewStatus === "accepted").length,
      ignored: assignments.filter((assignment) => assignment.reviewStatus === "ignored").length,
      highConfidence: assignments.filter(
        (assignment) => assignment.confidence >= 0.85 && assignment.reviewStatus !== "ignored"
      ).length
    };
  }, [draft]);
  const visibleAssignments = useMemo(
    () => (draft?.assignments || []).filter((assignment) => assignment.reviewStatus !== "ignored"),
    [draft]
  );
  const acceptedAssignments = useMemo(
    () => (draft?.assignments || []).filter((assignment) => assignment.reviewStatus === "accepted"),
    [draft]
  );

  const runParse = async (source: SyllabusImportSource) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const result = await parseSyllabus(source);
      setDraft(result);
    } catch (error) {
      const message = errorMessageFromUnknown(error);
      setErrorMessage(message);
      Alert.alert("Could not parse syllabus", message);
    } finally {
      setLoading(false);
    }
  };

  const updateDraftAssignment = (assignmentId: string, patch: Parameters<typeof updateParsedAssignment>[2]) => {
    setDraft((current) => (current ? updateParsedAssignment(current, assignmentId, patch) : current));
  };

  const acceptAllHighConfidence = () => {
    setDraft((current) => {
      if (!current) return current;
      return current.assignments.reduce(
        (next, assignment) =>
          assignment.confidence >= 0.85 && assignment.reviewStatus !== "ignored"
            ? updateParsedAssignment(next, assignment.id, { reviewStatus: "accepted" })
            : next,
        current
      );
    });
  };

  const applyAcceptedPlan = () => {
    if (!draft) return;
    onApplyParsedPlan({
      ...draft,
      assignments: acceptedAssignments
    });
  };

  const restoreIgnored = () => {
    setDraft((current) => {
      if (!current) return current;
      return current.assignments.reduce(
        (next, assignment) =>
          assignment.reviewStatus === "ignored"
            ? updateParsedAssignment(next, assignment.id, { reviewStatus: "needsReview" })
            : next,
        current
      );
    });
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "text/plain"],
      copyToCacheDirectory: true
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (!asset) return;
      await runParse({
        kind: "pdf",
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType
      });
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.85,
      allowsMultipleSelection: false
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (!asset) return;
      await runParse({
        kind: "photo",
        uri: asset.uri,
        name: asset.fileName || "syllabus photo",
        mimeType: asset.mimeType
      });
    }
  };

  const capturePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission needed", "Camera access lets you photograph syllabus pages.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (!asset) return;
      await runParse({
        kind: "photo",
        uri: asset.uri,
        name: asset.fileName || "camera scan",
        mimeType: asset.mimeType
      });
    }
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.kicker}>Syllabus import</Text>
        <Text style={styles.title}>Import without losing control.</Text>
        <Text style={styles.subtitle}>
          The scanner never silently edits the planner. Every detected course, date, and
          grade category stays editable before it touches your semester.
        </Text>
      </View>

      <View style={styles.guideCard}>
        <View style={styles.guideHeader}>
          <View style={styles.guideIcon}>
            <Sparkles color={colors.heroText} size={19} />
          </View>
          <View style={styles.guideCopy}>
            <Text style={styles.guideTitle}>Guided syllabus review</Text>
            <Text style={styles.guideMeta}>Upload a PDF or text syllabus, review, then apply.</Text>
          </View>
        </View>
        <View style={styles.stepRail}>
          {["Upload", "Review", "Apply"].map((step, index) => (
            <View key={step} style={styles.stepCard}>
              <Text style={styles.stepNumber}>0{index + 1}</Text>
              <Text style={styles.stepLabel}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      {captureMode ? (
        <View style={styles.captureCard}>
          <Text style={styles.captureLabel}>Preview syllabus</Text>
          <Text style={styles.captureText}>{messySyllabusExample}</Text>
        </View>
      ) : null}

      <View style={styles.importGrid}>
        <AppButton
          label="File"
          icon={FileText}
          variant="secondary"
          style={styles.importButton}
          disabled={loading}
          onPress={pickPdf}
        />
        {imageParsingReady ? (
          <>
            <AppButton
              label="Photo"
              icon={Upload}
              variant="secondary"
              style={styles.importButton}
              disabled={loading}
              onPress={pickPhoto}
            />
            <AppButton
              label="Camera"
              icon={Camera}
              variant="secondary"
              style={styles.importButton}
              disabled={loading}
              onPress={capturePhoto}
            />
          </>
        ) : null}
      </View>

      {loading ? <ActivityIndicator style={styles.loader} color={colors.ink} /> : null}

      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Scan paused</Text>
          <Text style={styles.errorCopy}>{errorMessage}</Text>
        </View>
      ) : null}

      {draft ? (
        <>
          <SectionHeader title="Review Results" note={draft.sourceName} />
          <View style={styles.resultCard}>
            <View style={styles.resultStats}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>{draft.courses.length}</Text>
                <Text style={styles.resultStatLabel}>course</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>{draft.assignments.length}</Text>
                <Text style={styles.resultStatLabel}>found</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>{reviewStats.needsReview}</Text>
                <Text style={styles.resultStatLabel}>review</Text>
              </View>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>{reviewStats.accepted}</Text>
                <Text style={styles.resultStatLabel}>accepted</Text>
              </View>
            </View>
            <View style={styles.findings}>
              {draft.findings.map((finding) => (
                <Badge
                  key={finding.id}
                  label={finding.message}
                  tone={finding.severity === "needs_review" ? "red" : "green"}
                />
              ))}
            </View>

            {draft.courses.map((course) => (
              <View key={course.id} style={styles.coursePreview}>
                <View style={styles.coursePreviewTop}>
                  <CheckCircle2 color={colors.green} size={18} />
                  <Text style={styles.courseCode}>{course.code}</Text>
                </View>
                <Text style={styles.courseName}>{course.name}</Text>
                <Text style={styles.courseMeta}>
                  {course.meetings.length} class meetings · {course.gradeCategories.length} grade
                  categories
                </Text>
              </View>
            ))}
          </View>

          <SectionHeader
            title="Review Inbox"
            note={`${reviewStats.accepted} accepted Â· ${reviewStats.ignored} ignored`}
          />
          <View style={styles.reviewToolbar}>
            <AppButton
              label="Accept high"
              icon={CheckCheck}
              variant="secondary"
              disabled={reviewStats.highConfidence === 0}
              onPress={acceptAllHighConfidence}
            />
          </View>
          <View style={styles.editList}>
            {visibleAssignments.length === 0 ? (
              <Text style={styles.emptyReview}>
                No active items remain in review. Restore the scan or upload another syllabus.
              </Text>
            ) : null}
            {visibleAssignments.map((assignment) => (
              <View key={assignment.id} style={styles.editCard}>
                <View style={styles.reviewCardTop}>
                  <View style={styles.reviewBadges}>
                    <Badge
                      label={reviewStatusLabel(assignment.reviewStatus)}
                      tone={assignment.reviewStatus === "accepted" ? "green" : "gold"}
                    />
                    <Badge label={confidenceLabel(assignment.confidence)} tone={confidenceTone(assignment.confidence)} />
                  </View>
                  <View style={styles.reviewActions}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      style={[styles.iconAction, assignment.reviewStatus === "accepted" ? styles.iconActionActive : null]}
                      onPress={() => updateDraftAssignment(assignment.id, { reviewStatus: "accepted" })}
                    >
                      <CheckCircle2 color={assignment.reviewStatus === "accepted" ? colors.green : colors.ink} size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      style={styles.iconAction}
                      onPress={() => updateDraftAssignment(assignment.id, { reviewStatus: "ignored" })}
                    >
                      <Trash2 color={colors.red} size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
                {assignment.sourceText ? (
                  <Text style={styles.sourceText}>{assignment.sourceText}</Text>
                ) : null}
                <Text style={styles.editLabel}>Title</Text>
                <TextInput
                  value={assignment.title}
                  style={styles.input}
                  placeholderTextColor={colors.faint}
                  onChangeText={(title) => updateDraftAssignment(assignment.id, { title })}
                />
                <Text style={styles.editLabel}>Due date</Text>
                <TextInput
                  value={assignment.dueAt.slice(0, 10)}
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.faint}
                  onChangeText={(date) =>
                    updateDraftAssignment(assignment.id, {
                      dueAt: `${date}T23:59:00`
                    })
                  }
                />
                <View style={styles.twoColumn}>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.editLabel}>Estimate</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={String(assignment.estimatedMinutes)}
                      style={styles.input}
                      placeholder="Minutes"
                      placeholderTextColor={colors.faint}
                      onChangeText={(estimatedMinutes) =>
                        updateDraftAssignment(assignment.id, {
                          estimatedMinutes: Number.parseInt(estimatedMinutes, 10) || 0
                        })
                      }
                    />
                  </View>
                  <View style={styles.fieldHalf}>
                    <Text style={styles.editLabel}>Course</Text>
                    <View style={styles.lockedField}>
                      <Text style={styles.lockedText}>
                        {draft.courses.find((course) => course.id === assignment.courseId)?.code}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.editLabel}>Kind</Text>
                <View style={styles.choiceRow}>
                  {kinds.map((kind) => (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={kind}
                      style={[styles.choice, assignment.kind === kind ? styles.choiceActive : null]}
                      onPress={() =>
                        updateDraftAssignment(assignment.id, { kind, type: kind })
                      }
                    >
                      <Text
                        style={[
                          styles.choiceText,
                          assignment.kind === kind ? styles.choiceTextActive : null
                        ]}
                      >
                        {kind}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.editLabel}>Priority</Text>
                <View style={styles.choiceRow}>
                  {priorities.map((priority) => (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={priority}
                      style={[
                        styles.choice,
                        assignment.priority === priority ? styles.choiceActive : null
                      ]}
                      onPress={() =>
                        updateDraftAssignment(assignment.id, { priority })
                      }
                    >
                      <Text
                        style={[
                          styles.choiceText,
                          assignment.priority === priority ? styles.choiceTextActive : null
                        ]}
                      >
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.applyBar}>
            {reviewStats.ignored > 0 ? (
              <AppButton
                label="Restore ignored"
                icon={RotateCcw}
                variant="quiet"
                onPress={restoreIgnored}
              />
            ) : null}
            <AppButton
              label="Apply accepted plan"
              disabled={acceptedAssignments.length === 0 && draft.assignments.length > 0}
              onPress={applyAcceptedPlan}
            />
          </View>
        </>
      ) : null}
    </View>
  );
}

function errorMessageFromUnknown(error: unknown) {
  return error instanceof Error ? error.message : "The import could not be read.";
}

function confidenceLabel(confidence: number) {
  return `${Math.round(confidence * 100)}% confidence`;
}

function confidenceTone(confidence: number): "green" | "gold" | "red" {
  if (confidence >= 0.85) return "green";
  if (confidence >= 0.7) return "gold";
  return "red";
}

function reviewStatusLabel(status: string) {
  if (status === "accepted") return "Accepted";
  if (status === "ignored") return "Ignored";
  return "Needs review";
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
    guideCard: {
      marginTop: spacing.lg,
      borderRadius: radii.xl,
      backgroundColor: colors.heroSurface,
      padding: spacing.lg,
      gap: spacing.md,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.26 : 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 5
    },
    guideHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md
    },
    guideIcon: {
      width: 42,
      height: 42,
      borderRadius: radii.round,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center"
    },
    guideCopy: {
      flex: 1,
      gap: 2
    },
    guideTitle: {
      color: colors.heroText,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    guideMeta: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    stepRail: {
      flexDirection: "row",
      gap: spacing.sm
    },
    stepCard: {
      flex: 1,
      minHeight: 64,
      borderRadius: radii.lg,
      backgroundColor: theme.isDark ? "rgba(7,17,29,0.12)" : "rgba(255,255,255,0.1)",
      borderWidth: 1,
      borderColor: theme.isDark ? "rgba(7,17,29,0.18)" : "rgba(255,255,255,0.16)",
      padding: spacing.sm,
      justifyContent: "center"
    },
    stepNumber: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    stepLabel: {
      color: colors.heroText,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    captureCard: {
      marginTop: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.xs
    },
    captureLabel: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "900"
    },
    captureText: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700"
    },
    importGrid: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg,
      marginBottom: spacing.sm
    },
    importButton: {
      flex: 1
    },
    loader: {
      marginTop: spacing.md
    },
    errorCard: {
      marginTop: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.red,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.xs
    },
    errorTitle: {
      color: colors.red,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900"
    },
    errorCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700"
    },
    resultCard: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.md,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.16 : 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3
    },
    resultStats: {
      flexDirection: "row",
      gap: spacing.sm
    },
    resultStat: {
      flex: 1,
      minHeight: 70,
      borderRadius: radii.lg,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.sm,
      justifyContent: "center"
    },
    resultStatValue: {
      color: colors.ink,
      fontSize: 23,
      lineHeight: 29,
      fontWeight: "900"
    },
    resultStatLabel: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    findings: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    coursePreview: {
      borderTopWidth: 1,
      borderTopColor: colors.line,
      paddingTop: spacing.md,
      gap: 2
    },
    coursePreviewTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    courseCode: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900"
    },
    courseName: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "900"
    },
    courseMeta: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18
    },
    editList: {
      gap: spacing.sm
    },
    reviewToolbar: {
      alignItems: "flex-start",
      marginBottom: spacing.sm
    },
    emptyReview: {
      overflow: "hidden",
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
    editCard: {
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.xs
    },
    reviewCardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    reviewBadges: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    reviewActions: {
      flexDirection: "row",
      gap: spacing.xs
    },
    iconAction: {
      width: 38,
      height: 38,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.canvas,
      alignItems: "center",
      justifyContent: "center"
    },
    iconActionActive: {
      borderColor: colors.green,
      backgroundColor: colors.mint
    },
    sourceText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    editLabel: {
      color: colors.faint,
      fontSize: 12,
      fontWeight: "900"
    },
    input: {
      minWidth: 0,
      minHeight: 44,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      color: colors.ink,
      fontSize: 15,
      fontWeight: "700",
      backgroundColor: colors.canvas
    },
    row: {
      flexDirection: "row",
      gap: spacing.xs,
      flexWrap: "wrap",
      marginTop: spacing.xs
    },
    twoColumn: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "stretch"
    },
    fieldHalf: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs
    },
    lockedField: {
      minHeight: 44,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      justifyContent: "center",
      backgroundColor: colors.canvas
    },
    lockedText: {
      color: colors.ink,
      fontSize: 15,
      fontWeight: "900"
    },
    choiceRow: {
      flexDirection: "row",
      gap: spacing.xs,
      flexWrap: "wrap"
    },
    choice: {
      minHeight: 36,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center"
    },
    choiceActive: {
      backgroundColor: colors.softGold,
      borderColor: colors.gold
    },
    choiceText: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "capitalize"
    },
    choiceTextActive: {
      color: colors.ink
    },
    applyBar: {
      marginTop: spacing.lg
    }
  });
}
