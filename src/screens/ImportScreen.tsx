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
  Sparkles,
  Upload,
  XCircle
} from "lucide-react-native";

import { AppButton } from "../components/AppButton";
import {
  GlassCard,
  MetricPill,
  PillFilter,
  PremiumHeader,
  PremiumScreen,
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
  { id: "high", label: "Sure" },
  { id: "medium", label: "Check" },
  { id: "low", label: "Needs help" }
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
  const scanCopy = imageParsingReady
    ? "Upload a text-based PDF, text file, or photo syllabus."
    : "Upload a text-based PDF or text file. Photo OCR needs a configured parser endpoint.";

  const reviewStats = useMemo(() => {
    const assignments = draft?.assignments || [];
    return {
      total: assignments.length,
      needsReview: assignments.filter((assignment) => assignment.reviewStatus === "needsReview").length,
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
    <PremiumScreen>
      <PremiumHeader
        eyebrow="All extracted. You review."
        title="Review Inbox"
        subtitle="Review extracted coursework before it touches your semester."
      />

      {captureMode ? null : (
        <GlassCard tint="hero">
          <View style={styles.scanHeroTop}>
            <View style={styles.scanHeroIcon}>
              <Sparkles color={colors.heroText} size={20} />
            </View>
            <View style={styles.scanHeroCopy}>
              <Text style={styles.scanHeroTitle}>Scan Syllabus</Text>
              <Text style={styles.scanHeroMeta}>{scanCopy}</Text>
            </View>
          </View>
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
        </GlassCard>
      )}

      {loading ? <ActivityIndicator style={styles.loader} color={colors.ink} /> : null}
      {errorMessage ? (
        <GlassCard>
          <Text style={styles.errorTitle}>Scan paused</Text>
          <Text style={styles.errorCopy}>{errorMessage}</Text>
        </GlassCard>
      ) : null}

      {draft ? (
        <>
          <GlassCard tint="hero" style={styles.aiReviewHero}>
            <View pointerEvents="none" style={styles.aiHeroBand} />
            <View style={styles.aiHeroTop}>
              <View style={styles.aiHeroIcon}>
                <Sparkles color={colors.heroText} size={20} />
              </View>
              <View style={styles.aiHeroCopy}>
                <Text style={styles.aiHeroKicker}>Needs Review</Text>
                <Text style={styles.aiHeroTitle}>{reviewStats.needsReview} waiting for approval</Text>
                <Text style={styles.aiHeroMeta}>
                  {reviewStats.high} sure items can flow into Today, Calendar, Classes, and widgets.
                </Text>
              </View>
              <StatusBadge label={reviewStats.low > 0 ? "Needs eyes" : "Clean"} tone={reviewStats.low > 0 ? "gold" : "green"} />
            </View>
          </GlassCard>

          <GlassCard style={styles.summaryCard}>
            <View pointerEvents="none" style={styles.summaryBand} />
            <View style={styles.summaryTop}>
              <View style={styles.summaryLead}>
                <View style={styles.summaryIcon}>
                  <Sparkles color={colors.heroText} size={18} />
                </View>
                <View style={styles.summaryCopy}>
                  <Text style={styles.summaryKicker}>Found from syllabus</Text>
                  <Text style={styles.summaryTitle}>Extracted {reviewStats.total} items</Text>
                  <Text style={styles.summaryMeta}>Sorted by AI confidence. You choose what gets added.</Text>
                </View>
              </View>
              <StatusBadge label={`${reviewStats.needsReview} waiting`} tone="purple" />
            </View>
            <View style={styles.statRow}>
              <MetricPill label="Sure" value={String(reviewStats.high)} tone="green" />
              <MetricPill label="Check" value={String(reviewStats.medium)} tone="gold" />
              <MetricPill label="Needs help" value={String(reviewStats.low)} tone="red" />
            </View>
          </GlassCard>

          <Text style={styles.filterCaption}>AI confidence</Text>
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

          <AppButton
            label={`Accept ${reviewStats.high} sure items`}
            icon={CheckCheck}
            disabled={reviewStats.high === 0}
            onPress={acceptAllHighConfidence}
          />

          <View style={styles.secondaryActions}>
            <TouchableOpacity accessibilityRole="button" onPress={acceptVisible}>
              <Text style={styles.secondaryActionText}>Accept shown</Text>
            </TouchableOpacity>
            {reviewStats.ignored > 0 ? (
              <TouchableOpacity accessibilityRole="button" onPress={restoreIgnored}>
                <Text style={styles.secondaryActionText}>Undo removed</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setExpandedAssignmentId(visibleAssignments[0]?.id || null)}
            >
              <Text style={styles.secondaryActionText}>Edit first</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reviewList}>
            {visibleAssignments.length === 0 ? (
              <GlassCard>
                <Text style={styles.emptyTitle}>Nothing in this filter.</Text>
                <Text style={styles.emptyCopy}>Switch filters or upload another syllabus.</Text>
              </GlassCard>
            ) : (
              visibleAssignments.map((assignment) => (
                <ReviewRow
                  key={assignment.id}
                  assignment={assignment}
                  courseName={draft.courses.find((course) => course.id === assignment.courseId)?.code || assignment.courseName}
                  expanded={expandedAssignmentId === assignment.id}
                  onAccept={() => updateDraftAssignment(assignment.id, { reviewStatus: "accepted" })}
                  onIgnore={() => updateDraftAssignment(assignment.id, { reviewStatus: "ignored" })}
                  onEdit={() =>
                    setExpandedAssignmentId(expandedAssignmentId === assignment.id ? null : assignment.id)
                  }
                  onPatch={(patch) => updateDraftAssignment(assignment.id, patch)}
                />
              ))
            )}
          </View>

          <AppButton
            label="Add accepted items to planner"
            disabled={acceptedAssignments.length === 0 && draft.assignments.length > 0}
            onPress={applyAcceptedPlan}
          />
        </>
      ) : (
        <GlassCard>
          <Text style={styles.emptyTitle}>No syllabus scanned yet.</Text>
          <Text style={styles.emptyCopy}>{messySyllabusExample.slice(0, 138)}...</Text>
        </GlassCard>
      )}
    </PremiumScreen>
  );
}

function ReviewRow({
  assignment,
  courseName,
  expanded,
  onAccept,
  onIgnore,
  onEdit,
  onPatch
}: {
  assignment: Assignment;
  courseName: string;
  expanded: boolean;
  onAccept: () => void;
  onIgnore: () => void;
  onEdit: () => void;
  onPatch: (patch: Partial<Assignment>) => void;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const accepted = assignment.reviewStatus === "accepted";

  return (
    <GlassCard style={styles.reviewCard}>
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
        <MicroAction label="Accept" onPress={onAccept}>
          <CheckCircle2 color={colors.green} size={16} />
        </MicroAction>
        <MicroAction label="Remove" onPress={onIgnore}>
          <XCircle color={colors.red} size={16} />
        </MicroAction>
        <MicroAction label="Edit" onPress={onEdit}>
          <Pencil color={colors.brandPurple} size={16} />
        </MicroAction>
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
              <Choice
                key={kind}
                label={labelize(kind)}
                active={assignment.kind === kind}
                onPress={() => onPatch({ kind, type: kind })}
              />
            ))}
          </View>
          <View style={styles.choiceRow}>
            {priorities.map((priority) => (
              <Choice
                key={priority}
                label={priority}
                active={assignment.priority === priority}
                onPress={() => onPatch({ priority })}
              />
            ))}
          </View>
        </View>
      ) : null}
    </GlassCard>
  );
}

function MicroAction({
  label,
  children,
  onPress
}: {
  label: string;
  children: React.ReactNode;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.82}
      style={styles.iconAction}
      onPress={onPress}
    >
      {children}
      <Text style={styles.iconActionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      activeOpacity={0.82}
      style={[styles.choice, active ? styles.choiceActive : null]}
      onPress={onPress}
    >
      <Text style={[styles.choiceText, active ? styles.choiceTextActive : null]}>{label}</Text>
    </TouchableOpacity>
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
  if (confidence >= 0.85) return "Sure";
  if (confidence >= 0.7) return "Check";
  return "Needs help";
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
    scanHeroTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    scanHeroIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
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
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "900"
    },
    scanHeroMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    importGrid: {
      flexDirection: "row",
      gap: spacing.sm
    },
    importButton: {
      flex: 1
    },
    loader: {
      marginTop: spacing.xs
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
    aiReviewHero: {
      overflow: "hidden",
      backgroundColor: colors.surface,
      borderColor: `${colors.brandBlue}26`
    },
    aiHeroBand: {
      position: "absolute",
      top: -36,
      right: -44,
      width: 210,
      height: 92,
      borderRadius: 34,
      backgroundColor: `${colors.brandBlue}16`,
      transform: [{ rotate: "22deg" }]
    },
    aiHeroTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    aiHeroIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandPurple
    },
    aiHeroCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2
    },
    aiHeroKicker: {
      color: colors.brandPurple,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    aiHeroTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "900"
    },
    aiHeroMeta: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: "700"
    },
    summaryCard: {
      gap: spacing.md,
      overflow: "hidden",
      borderColor: "rgba(108,92,231,0.22)"
    },
    summaryBand: {
      position: "absolute",
      top: -34,
      right: -40,
      width: 190,
      height: 84,
      borderRadius: 30,
      backgroundColor: "rgba(108,92,231,0.10)",
      transform: [{ rotate: "24deg" }]
    },
    summaryTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm
    },
    summaryLead: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    summaryIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.brandPurple
    },
    summaryCopy: {
      flex: 1,
      minWidth: 0,
      gap: 1
    },
    summaryKicker: {
      color: colors.brandPurple,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    summaryTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "900"
    },
    summaryMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
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
    filterCaption: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textTransform: "uppercase"
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
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderColor: "rgba(108,92,231,0.14)"
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
      flexWrap: "wrap",
      justifyContent: "flex-end",
      gap: spacing.xs
    },
    iconAction: {
      minWidth: 66,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.line,
      flexDirection: "row",
      gap: 4,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt
    },
    iconActionText: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900"
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
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt
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
    }
  });
}
