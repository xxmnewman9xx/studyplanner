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
  Pencil,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload
} from "lucide-react-native";

import { AppButton } from "../components/AppButton";
import {
  PillFilter,
  PremiumCard,
  ScreenHeader,
  StatChip,
  StatusBadge
} from "../components/PremiumUI";
import { isStoreCaptureEnabled } from "../config/storeCapture";
import { createDemoSyllabusParseResult, messySyllabusExample } from "../data/demoSemester";
import {
  Assignment,
  AssignmentKind,
  Priority,
  SyllabusImportSource,
  SyllabusParseResult
} from "../models";
import { parseSyllabus, supportsSyllabusImageParsing, updateParsedAssignment } from "../services/syllabusParser";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type ImportScreenProps = {
  onApplyParsedPlan: (parse: SyllabusParseResult) => void;
};

type ConfidenceFilter = "all" | "high" | "medium" | "low";

const priorities: Priority[] = ["low", "medium", "high"];
const kinds: AssignmentKind[] = ["assignment", "exam", "quiz", "project", "reading", "other"];
const filters: Array<{ id: ConfidenceFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" }
];

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
  const [filter, setFilter] = useState<ConfidenceFilter>("all");
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
  const imageParsingReady = supportsSyllabusImageParsing();

  const reviewStats = useMemo(() => {
    const assignments = draft?.assignments || [];
    return {
      total: assignments.length,
      needsReview: assignments.filter((assignment) => assignment.reviewStatus === "needsReview")
        .length,
      accepted: assignments.filter((assignment) => assignment.reviewStatus === "accepted").length,
      ignored: assignments.filter((assignment) => assignment.reviewStatus === "ignored").length,
      high: assignments.filter((assignment) => confidenceBucket(assignment.confidence) === "high").length,
      medium: assignments.filter((assignment) => confidenceBucket(assignment.confidence) === "medium").length,
      low: assignments.filter((assignment) => confidenceBucket(assignment.confidence) === "low").length
    };
  }, [draft]);

  const activeAssignments = useMemo(
    () => (draft?.assignments || []).filter((assignment) => assignment.reviewStatus !== "ignored"),
    [draft]
  );
  const visibleAssignments = useMemo(
    () =>
      activeAssignments.filter((assignment) =>
        filter === "all" ? true : confidenceBucket(assignment.confidence) === filter
      ),
    [activeAssignments, filter]
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

  const updateDraftAssignment = (
    assignmentId: string,
    patch: Parameters<typeof updateParsedAssignment>[2]
  ) => {
    setDraft((current) => (current ? updateParsedAssignment(current, assignmentId, patch) : current));
  };

  const applyAcceptedPlan = () => {
    if (!draft) return;
    onApplyParsedPlan({
      ...draft,
      assignments: acceptedAssignments
    });
  };

  const acceptAllHighConfidence = () => {
    updateDraft((current) =>
      current.assignments.reduce(
        (next, assignment) =>
          assignment.confidence >= 0.85 && assignment.reviewStatus !== "ignored"
            ? updateParsedAssignment(next, assignment.id, { reviewStatus: "accepted" })
            : next,
        current
      )
    );
  };

  const acceptVisible = () => {
    updateDraft((current) =>
      visibleAssignments.reduce(
        (next, assignment) =>
          updateParsedAssignment(next, assignment.id, { reviewStatus: "accepted" }),
        current
      )
    );
  };

  const restoreIgnored = () => {
    updateDraft((current) =>
      current.assignments.reduce(
        (next, assignment) =>
          assignment.reviewStatus === "ignored"
            ? updateParsedAssignment(next, assignment.id, { reviewStatus: "needsReview" })
            : next,
        current
      )
    );
  };

  const updateDraft = (mapper: (current: SyllabusParseResult) => SyllabusParseResult) => {
    setDraft((current) => (current ? mapper(current) : current));
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
    <View style={styles.screen}>
      <ScreenHeader
        eyebrow="Review Inbox"
        title="AI found these."
        subtitle="Review extracted coursework before it touches your semester."
      />

      <PremiumCard tone="hero">
        <View style={styles.scanHeroTop}>
          <View style={styles.scanHeroIcon}>
            <Sparkles color={colors.heroText} size={20} />
          </View>
          <View style={styles.scanHeroCopy}>
            <Text style={styles.scanHeroTitle}>Scan Syllabus</Text>
            <Text style={styles.scanHeroMeta}>Upload or snap any syllabus.</Text>
          </View>
        </View>
        {captureMode ? (
          <View style={styles.messySource}>
            <Text style={styles.messyLabel}>Before: messy syllabus</Text>
            <Text style={styles.messyText} numberOfLines={7}>{messySyllabusExample}</Text>
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
      </PremiumCard>

      {loading ? <ActivityIndicator style={styles.loader} color={colors.ink} /> : null}
      {errorMessage ? (
        <PremiumCard>
          <Text style={styles.errorTitle}>Scan paused</Text>
          <Text style={styles.errorCopy}>{errorMessage}</Text>
        </PremiumCard>
      ) : null}

      {draft ? (
        <>
          <View style={styles.statRow}>
            <StatChip label="Extracted" value={String(reviewStats.total)} tone="purple" />
            <StatChip label="High" value={String(reviewStats.high)} tone="green" />
            <StatChip label="Needs Review" value={String(reviewStats.needsReview)} tone="gold" />
          </View>

          <View style={styles.filterRow}>
            {filters.map((option) => (
              <PillFilter
                key={option.id}
                label={option.label}
                count={countForFilter(option.id, reviewStats)}
                active={filter === option.id}
                onPress={() => setFilter(option.id)}
              />
            ))}
          </View>

          <View style={styles.ctaRow}>
            <AppButton
              label={`Accept ${reviewStats.high} High Confidence`}
              icon={CheckCheck}
              disabled={reviewStats.high === 0}
              onPress={acceptAllHighConfidence}
              style={styles.ctaButton}
            />
          </View>

          <View style={styles.secondaryActions}>
            <TouchableOpacity accessibilityRole="button" onPress={acceptVisible}>
              <Text style={styles.secondaryActionText}>Select All</Text>
            </TouchableOpacity>
            {reviewStats.ignored > 0 ? (
              <TouchableOpacity accessibilityRole="button" onPress={restoreIgnored}>
                <Text style={styles.secondaryActionText}>Restore Ignored</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity accessibilityRole="button" onPress={() => setExpandedAssignmentId(visibleAssignments[0]?.id || null)}>
              <Text style={styles.secondaryActionText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reviewList}>
            {visibleAssignments.length === 0 ? (
              <PremiumCard>
                <Text style={styles.emptyTitle}>Nothing in this filter.</Text>
                <Text style={styles.emptyCopy}>Switch filters or upload another syllabus.</Text>
              </PremiumCard>
            ) : (
              visibleAssignments.map((assignment) => (
                <ReviewRow
                  key={assignment.id}
                  assignment={assignment}
                  courseName={draft.courses.find((course) => course.id === assignment.courseId)?.code || assignment.courseName}
                  expanded={expandedAssignmentId === assignment.id}
                  onAccept={() => updateDraftAssignment(assignment.id, { reviewStatus: "accepted" })}
                  onEdit={() =>
                    setExpandedAssignmentId(expandedAssignmentId === assignment.id ? null : assignment.id)
                  }
                  onIgnore={() => updateDraftAssignment(assignment.id, { reviewStatus: "ignored" })}
                  onPatch={(patch) => updateDraftAssignment(assignment.id, patch)}
                />
              ))
            )}
          </View>

          <View style={styles.applyBar}>
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

function ReviewRow({
  assignment,
  courseName,
  expanded,
  onAccept,
  onEdit,
  onIgnore,
  onPatch
}: {
  assignment: Assignment;
  courseName: string;
  expanded: boolean;
  onAccept: () => void;
  onEdit: () => void;
  onIgnore: () => void;
  onPatch: (patch: Partial<Assignment>) => void;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const accepted = assignment.reviewStatus === "accepted";

  return (
    <PremiumCard style={styles.reviewCard}>
      <View style={styles.reviewRow}>
        <TouchableOpacity accessibilityRole="button" style={styles.checkButton} onPress={onAccept}>
          <CheckCircle2 color={accepted ? colors.green : colors.brandPurple} size={21} />
        </TouchableOpacity>
        <View style={styles.reviewBody}>
          <Text style={styles.reviewTitle}>{assignment.title}</Text>
          <Text style={styles.reviewMeta}>
            {courseName} - {assignment.dueAt.slice(0, 10)} - {labelize(assignment.type)}
          </Text>
        </View>
        <StatusBadge label={confidenceLabel(assignment.confidence)} tone={confidenceTone(assignment.confidence)} />
      </View>
      <View style={styles.reviewActionRow}>
        <TouchableOpacity accessibilityRole="button" style={styles.iconAction} onPress={onAccept}>
          <CheckCircle2 color={colors.green} size={17} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.iconAction} onPress={onEdit}>
          <Pencil color={colors.brandPurple} size={17} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.iconAction} onPress={onIgnore}>
          <Trash2 color={colors.red} size={17} />
        </TouchableOpacity>
      </View>
      {expanded ? (
        <View style={styles.editPanel}>
          <Text style={styles.editLabel}>Title</Text>
          <TextInput
            value={assignment.title}
            style={styles.input}
            placeholderTextColor={colors.faint}
            onChangeText={(title) => onPatch({ title })}
          />
          <Text style={styles.editLabel}>Due date</Text>
          <TextInput
            value={assignment.dueAt.slice(0, 10)}
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.faint}
            onChangeText={(date) => onPatch({ dueAt: `${date}T23:59:00` })}
          />
          <View style={styles.choiceRow}>
            {kinds.map((kind) => (
              <TouchableOpacity
                accessibilityRole="button"
                key={kind}
                style={[styles.choice, assignment.kind === kind ? styles.choiceActive : null]}
                onPress={() => onPatch({ kind, type: kind })}
              >
                <Text style={[styles.choiceText, assignment.kind === kind ? styles.choiceTextActive : null]}>
                  {labelize(kind)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.choiceRow}>
            {priorities.map((priority) => (
              <TouchableOpacity
                accessibilityRole="button"
                key={priority}
                style={[styles.choice, assignment.priority === priority ? styles.choiceActive : null]}
                onPress={() => onPatch({ priority })}
              >
                <Text style={[styles.choiceText, assignment.priority === priority ? styles.choiceTextActive : null]}>
                  {priority}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
    </PremiumCard>
  );
}

function countForFilter(filter: ConfidenceFilter, stats: { total: number; high: number; medium: number; low: number }) {
  if (filter === "all") return stats.total;
  return stats[filter];
}

function confidenceBucket(confidence: number): Exclude<ConfidenceFilter, "all"> {
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.7) return "medium";
  return "low";
}

function confidenceLabel(confidence: number) {
  if (confidence >= 0.85) return "High";
  if (confidence >= 0.7) return "Medium";
  return "Low";
}

function confidenceTone(confidence: number): "green" | "gold" | "red" {
  if (confidence >= 0.85) return "green";
  if (confidence >= 0.7) return "gold";
  return "red";
}

function errorMessageFromUnknown(error: unknown) {
  return error instanceof Error ? error.message : "The import could not be read.";
}

function labelize(value: string) {
  return value.replace("_", " ");
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    screen: {
      gap: spacing.md
    },
    scanHeroTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    scanHeroIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandPurple
    },
    scanHeroCopy: {
      flex: 1,
      gap: 2
    },
    scanHeroTitle: {
      color: colors.ink,
      fontSize: 19,
      lineHeight: 25,
      fontWeight: "900"
    },
    scanHeroMeta: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    },
    messySource: {
      marginTop: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md,
      gap: spacing.xs
    },
    messyLabel: {
      color: colors.brandPurple,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
    },
    messyText: {
      color: colors.ink,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    importGrid: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md
    },
    importButton: {
      flex: 1
    },
    loader: {
      marginTop: spacing.sm
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
    statRow: {
      flexDirection: "row",
      gap: spacing.sm
    },
    filterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    ctaRow: {
      flexDirection: "row"
    },
    ctaButton: {
      flex: 1
    },
    secondaryActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.sm,
      paddingHorizontal: spacing.xs
    },
    secondaryActionText: {
      color: colors.brandPurple,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    reviewList: {
      gap: spacing.sm
    },
    reviewCard: {
      gap: spacing.sm
    },
    reviewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    checkButton: {
      width: 30,
      height: 30,
      alignItems: "center",
      justifyContent: "center"
    },
    reviewBody: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    reviewTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    reviewMeta: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "700"
    },
    reviewActionRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.xs
    },
    iconAction: {
      width: 34,
      height: 34,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface
    },
    editPanel: {
      gap: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      paddingTop: spacing.sm
    },
    editLabel: {
      color: colors.faint,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    input: {
      minWidth: 0,
      minHeight: 44,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      color: colors.ink,
      fontSize: 14,
      fontWeight: "800",
      backgroundColor: colors.canvas
    },
    choiceRow: {
      flexDirection: "row",
      gap: spacing.xs,
      flexWrap: "wrap"
    },
    choice: {
      minHeight: 34,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center"
    },
    choiceActive: {
      backgroundColor: colors.brandPurple,
      borderColor: colors.brandPurple
    },
    choiceText: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "capitalize"
    },
    choiceTextActive: {
      color: colors.heroText
    },
    emptyTitle: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "900"
    },
    emptyCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700"
    },
    applyBar: {
      marginTop: spacing.xs
    }
  });
}
