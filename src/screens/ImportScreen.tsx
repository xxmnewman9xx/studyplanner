import React, { useState } from "react";
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
import { Camera, CheckCircle2, FileText, Keyboard, Plus, Upload } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import {
  GlassCard,
  SegmentedControl
} from "../components/AppleComponents";
import { SectionHeader } from "../components/SectionHeader";
import {
  AssignmentKind,
  Course,
  ParsedImport,
  ParsedItem,
  Priority,
  SyllabusImportSource,
  SyllabusParseResult
} from "../models";
import {
  parseSyllabus,
  supportsSyllabusImageParsing,
  updateParsedAssignment
} from "../services/syllabusParser";
import {
  marketingCaptureParseResult,
  marketingCaptureScreen
} from "../services/marketingCapture";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";

type ImportScreenProps = {
  parsedImports: ParsedImport[];
  parsedItems: ParsedItem[];
  onApplyParsedPlan: (parse: SyllabusParseResult) => void;
};

const priorities: Priority[] = ["low", "medium", "high"];
const kinds: AssignmentKind[] = ["assignment", "worksheet", "reading", "project", "exam"];

export function ImportScreen({ parsedImports, parsedItems, onApplyParsedPlan }: ImportScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const captureDraft =
    marketingCaptureScreen === "extracted" || marketingCaptureScreen === "review_edit";
  const [draft, setDraft] = useState<SyllabusParseResult | null>(
    captureDraft ? marketingCaptureParseResult : null
  );
  const [loading, setLoading] = useState(marketingCaptureScreen === "processing");
  const [typedText, setTypedText] = useState("");
  const imageParsingReady = supportsSyllabusImageParsing();

  const runParse = async (source: SyllabusImportSource) => {
    try {
      setLoading(true);
      const result = await parseSyllabus(source);
      setDraft(result);
    } catch (error) {
      Alert.alert("Could not parse school material", errorMessage(error));
    } finally {
      setLoading(false);
    }
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
        name: asset.fileName || "school material photo",
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

    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
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

  const typeItIn = async () => {
    if (!typedText.trim()) {
      Alert.alert("Type a little material", "Paste syllabus lines, handout text, or homework notes first.");
      return;
    }

    await runParse({
      kind: "typed",
      name: "Typed school material",
      text: typedText
    });
  };

  const counts = draft ? summarizeDraft(draft) : null;
  const needsReviewCount = draft?.assignments.filter((assignment) => assignment.needsReview || (assignment.confidence || 1) < 0.75).length || parsedItems.filter((item) => item.needsReview).length;

  const addUndatedExampleDraft = (example: string) => {
    if (!draft) return;
    const course = draft.courses[0];
    if (!course) return;
    const title = cleanupExampleTitle(example);
    if (!title) return;
    const dueDate = new Date().toISOString().slice(0, 10);
    setDraft({
      ...draft,
      assignments: [
        ...draft.assignments,
        {
          id: `undated-${Date.now()}-${slugify(title)}`,
          courseId: course.id,
          title,
          kind: "assignment",
          type: "assignment",
          dueAt: `${dueDate}T23:59:00`,
          tags: ["needs-date", "syllabus"],
          priority: "high",
          estimatedMinutes: 60,
          status: "not_started",
          source: "syllabus",
          sourceId: draft.sourceName,
          progress: 0,
          needsReview: true,
          confidence: 0.45,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    });
  };

  const hasDraftForExample = (example: string) => {
    const title = cleanupExampleTitle(example).toLowerCase();
    return draft?.assignments.some((assignment) => assignment.title.toLowerCase() === title) || false;
  };

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.kicker}>Import</Text>
        <Text style={styles.title}>Add school material.</Text>
        <Text style={styles.subtitle}>
          Scan, upload, or paste syllabus text. StudyPlanner finds the work, then you approve what gets saved.
        </Text>
      </View>

      <GlassCard style={styles.scanHero}>
        <View style={styles.scanHeroGlow} />
        <Text style={styles.dropKicker}>Syllabus AI</Text>
        <Text style={styles.dropTitle}>Scan school chaos into a plan.</Text>
        <Text style={styles.dropCopy}>Find assignments, exams, readings, and suspicious missing dates before anything touches Today.</Text>
        <View style={styles.trustRow}>
          <TrustChip label="Review first" />
          <TrustChip label="Missing-date checks" />
        </View>
        <View style={styles.scanActions}>
          <AppButton label="Scan" icon={Camera} onPress={capturePhoto} style={styles.scanActionPrimary} />
          <AppButton label="Upload" icon={Upload} variant="secondary" onPress={pickPdf} style={styles.scanActionSecondary} />
          <AppButton label="Paste" icon={Keyboard} variant="secondary" onPress={typeItIn} style={styles.scanActionSecondary} />
        </View>
        <TextInput
          value={typedText}
          onChangeText={setTypedText}
          multiline
          placeholder="Paste: Chapter 4 worksheet due May 13, lab report due Friday..."
          placeholderTextColor={colors.heroMuted}
          style={styles.typeBox}
        />
        <Text style={styles.privacyNote}>Private until you approve the plan.</Text>
      </GlassCard>

      {loading ? (
        <View style={styles.processingCard}>
          <View style={styles.processingIcon}>
            <ActivityIndicator color={colors.heroText} />
          </View>
          <View style={styles.processingCopy}>
            <Text style={styles.processingTitle}>AI is parsing it</Text>
            <Text style={styles.processingMeta}>Finding assignments, dates, classes, and grade weights.</Text>
          </View>
        </View>
      ) : null}

      <SectionHeader title="Recent imports" note="Open one to review found work" />
      <View style={styles.recentList}>
        {parsedImports.map((item) => (
          <TouchableOpacity
            accessibilityRole="button"
            key={item.id}
            style={styles.recentRow}
            onPress={() => {
              setDraft(buildDraftFromRecentImport(item, parsedItems));
            }}
          >
            <View style={styles.recentIcon}>
              <FileText color={colors.accent} size={18} />
            </View>
            <View style={styles.recentCopy}>
              <Text style={styles.recentTitle}>{item.title}</Text>
              <Text style={styles.recentMeta}>{item.itemCount} found · {labelize(item.status)}</Text>
              {imageParsingReady ? null : (
                <Text style={styles.recentSubtle}>Photo parsing needs AI setup; files and pasted text work on device.</Text>
              )}
            </View>
            <Badge label={labelize(item.sourceType)} tone={item.status === "ready" ? "blue" : "green"} />
          </TouchableOpacity>
        ))}
      </View>

      {draft ? (
        <>
          <SectionHeader title={`Found ${draft.assignments.length + draft.courses.length + draft.gradeItems.length} things`} note="Review and confirm" />
          <GlassCard style={styles.resultCard}>
            <View style={styles.resultStats}>
              <ResultStat value={String(counts?.assignments || 0)} label="Assignments" tone="blue" />
              <ResultStat value={String(counts?.exams || 0)} label="Exams" tone="pink" />
              <ResultStat value={String(counts?.projects || 0)} label="Projects" tone="gold" />
              <ResultStat value={String(needsReviewCount)} label="Needs review" tone="plain" />
            </View>
            <View style={styles.findings}>
              {draft.findings.map((finding) => (
                <View key={finding.id} style={styles.findingBlock}>
                  <Badge
                    label={finding.message}
                    tone={finding.severity === "needs_review" ? "red" : "green"}
                  />
                  {finding.examples?.length ? (
                    <View style={styles.findingExamples}>
                      {finding.examples.map((example) => {
                        const added = hasDraftForExample(example);
                        return (
                          <View key={example} style={styles.findingExampleRow}>
                            <Text style={styles.findingExampleText}>Missing date: {example}</Text>
                            <TouchableOpacity
                              accessibilityRole="button"
                              disabled={added}
                              style={[styles.exampleAddButton, added ? styles.exampleAddButtonDisabled : null]}
                              onPress={() => addUndatedExampleDraft(example)}
                            >
                              <Plus color={added ? colors.faint : colors.accent} size={14} />
                              <Text style={[styles.exampleAddText, added ? styles.exampleAddTextDisabled : null]}>
                                {added ? "Added" : "Draft"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              ))}
              {needsReviewCount > 0 ? <Badge label="Missing date or duplicate possible" tone="red" /> : null}
            </View>
          </GlassCard>

          <SectionHeader title="Needs Review" note="Editable rows before adding to your planner" />
          <View style={styles.editList}>
            {draft.assignments.map((assignment) => {
              const courseCode =
                draft.courses.find((course) => course.id === assignment.courseId)?.code || "Class";
              return (
                <View key={assignment.id} style={styles.editCard}>
                  <View style={styles.editCardTop}>
                    <View style={styles.statusDot}>
                      <CheckCircle2 color={colors.heroText} size={16} />
                    </View>
                    <View style={styles.editHeaderCopy}>
                      <TextInput
                        value={assignment.title}
                        style={styles.titleInput}
                        placeholderTextColor={colors.faint}
                        onChangeText={(title) =>
                          setDraft(updateParsedAssignment(draft, assignment.id, { title }))
                        }
                      />
                      <Text style={styles.editMeta}>
                        {courseCode} · confidence {Math.round((assignment.confidence || 0.88) * 100)}%
                      </Text>
                    </View>
                    {assignment.needsReview || assignment.duplicateOf ? (
                      <Badge label={assignment.duplicateOf ? "Duplicate?" : "Check"} tone="red" />
                    ) : null}
                  </View>

                  <View style={styles.twoColumn}>
                    <TextInput
                      value={assignment.dueAt.slice(0, 10)}
                      style={[styles.input, styles.fieldHalf]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.faint}
                      onChangeText={(date) =>
                        setDraft(
                          updateParsedAssignment(draft, assignment.id, {
                            dueAt: `${date}T23:59:00`,
                            needsReview: !date
                          })
                        )
                      }
                    />
                    <TextInput
                      keyboardType="numeric"
                      value={String(assignment.estimatedMinutes)}
                      style={[styles.input, styles.fieldHalf]}
                      placeholder="Minutes"
                      placeholderTextColor={colors.faint}
                      onChangeText={(estimatedMinutes) =>
                        setDraft(
                          updateParsedAssignment(draft, assignment.id, {
                            estimatedMinutes: Number.parseInt(estimatedMinutes, 10) || 0
                          })
                        )
                      }
                    />
                  </View>

                  <SegmentedControl
                    options={kinds}
                    value={assignment.kind}
                    onChange={(kind) => setDraft(updateParsedAssignment(draft, assignment.id, { kind, type: kind }))}
                    labelForOption={labelize}
                  />
                  <SegmentedControl
                    options={priorities}
                    value={assignment.priority}
                    onChange={(priority) => setDraft(updateParsedAssignment(draft, assignment.id, { priority }))}
                    labelForOption={labelize}
                  />
                </View>
              );
            })}
          </View>

          <View style={styles.applyBar}>
            <AppButton label={`Add all ${draft.assignments.length}`} onPress={() => onApplyParsedPlan(draft)} />
            <AppButton label="Revise" variant="secondary" onPress={() => setDraft(null)} />
          </View>
        </>
      ) : null}
    </View>
  );

  function TrustChip({ label }: { label: string }) {
    return (
      <View style={styles.trustChip}>
        <CheckCircle2 color={colors.accent} size={13} />
        <Text style={styles.trustChipText}>{label}</Text>
      </View>
    );
  }

  function ResultStat({
    value,
    label,
    tone
  }: {
    value: string;
    label: string;
    tone: "blue" | "pink" | "gold" | "plain";
  }) {
    const toneStyle = {
      blue: styles.blueStat,
      pink: styles.pinkStat,
      gold: styles.goldStat,
      plain: styles.plainStat
    }[tone];
    return (
      <View style={[styles.resultStat, toneStyle]}>
        <Text style={styles.resultValue}>{value}</Text>
        <Text style={styles.resultLabel}>{label}</Text>
      </View>
    );
  }
}

function summarizeDraft(draft: SyllabusParseResult) {
  return {
    assignments: draft.assignments.filter((item) => item.kind === "assignment" || item.kind === "worksheet" || item.kind === "reading").length,
    exams: draft.assignments.filter((item) => item.kind === "exam").length,
    projects: draft.assignments.filter((item) => item.kind === "project").length
  };
}

function buildDraftFromRecentImport(
  parsedImport: ParsedImport,
  parsedItems: ParsedItem[]
): SyllabusParseResult {
  const items = parsedItems.filter(
    (item) =>
      item.parsedImportId === parsedImport.id &&
      item.reviewStatus !== "dismissed" &&
      item.reviewStatus !== "accepted" &&
      !item.acceptedAt
  );
  const courseNames = Array.from(new Set(items.map((item) => item.courseName || "Study Hall")));
  const courses: Course[] = courseNames.map((name, index) => {
    const id = courseIdForName(name);
    return {
      id,
      code: initialsForCourse(name),
      name,
      instructor: "Teacher",
      teacher: "Teacher",
      period: `Period ${index + 1}`,
      room: "Room TBD",
      color: courseColors[index % courseColors.length] || "#6D5CFF",
      iconKey: "book",
      emojiKey: index % 2 === 0 ? "study" : "science",
      semester: "Spring 2026",
      createdAt: parsedImport.createdAt,
      updatedAt: parsedImport.updatedAt,
      meetings: [],
      gradeCategories: [
        { id: `${id}-work`, name: "Coursework", weight: 50 },
        { id: `${id}-tests`, name: "Tests", weight: 30 },
        { id: `${id}-participation`, name: "Participation", weight: 20 }
      ]
    };
  });
  const fallbackDate = new Date(parsedImport.createdAt || Date.now());
  fallbackDate.setDate(fallbackDate.getDate() + 2);
  const fallbackDueAt = `${fallbackDate.toISOString().slice(0, 10)}T23:59:00`;
  if (items.length === 0) {
    return {
      sourceName: parsedImport.title,
      courses,
      gradeItems: [],
      assignments: [],
      findings: [
        {
          id: `${parsedImport.id}-empty`,
          severity: "info",
          message: "Everything from this import has already been handled."
        }
      ]
    };
  }

  return {
    sourceName: parsedImport.title,
    courses,
    gradeItems: [],
    assignments: items.map((item) => ({
      id: `review-${item.id}`,
      courseId: courseIdForName(item.courseName || "Study Hall"),
      title: item.title,
      kind: item.type,
      type: item.type,
      dueAt: item.dueAt || fallbackDueAt,
      tags: ["imported", item.type],
      priority: item.needsReview ? "high" : "medium",
      estimatedMinutes: item.type === "exam" ? 120 : item.type === "reading" ? 35 : 55,
      status: "not_started",
      source: parsedImport.sourceType === "typed" ? "typed" : "scan",
      sourceId: parsedImport.id,
      progress: 0,
      checklist: [
        { id: `review-${item.id}-1`, title: "Review instructions", done: false },
        { id: `review-${item.id}-2`, title: "Block study time", done: false }
      ],
      reminder: { enabled: true, leadTimeHours: item.type === "exam" ? 72 : 24 },
      needsReview: item.needsReview || !item.dueAt,
      duplicateOf: item.duplicateCandidateId,
      confidence: item.confidence,
      createdAt: parsedImport.createdAt,
      updatedAt: parsedImport.updatedAt || new Date().toISOString()
    })),
    findings: [
      {
        id: `${parsedImport.id}-source`,
        severity: "info",
        message: `${items.length} parsed items from ${parsedImport.title}`
      },
      ...items
        .filter((item) => item.needsReview || item.duplicateCandidateId || !item.dueAt)
        .slice(0, 3)
        .map((item, index) => ({
          id: `${item.id}-finding-${index}`,
          severity: "needs_review" as const,
          message: item.duplicateCandidateId
            ? `${item.title} may already be in your planner`
            : !item.dueAt
              ? `${item.title} needs a due date`
              : `${item.title} needs review`
        }))
    ]
  };
}

const courseColors = ["#6D5CFF", "#FF4FA8", "#2F80ED", "#20A66B", "#F97316", "#8B5CF6"];

function courseIdForName(name: string) {
  return `parsed-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "course"}`;
}

function initialsForCourse(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join("") : name.slice(0, 3);
  return letters.toUpperCase();
}

function labelize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cleanupExampleTitle(value: string) {
  return value
    .replace(/\b(due date|deadline|due)\b\s*:*/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[-:–| ]+|[-:–| ]+$/g, "")
    .trim();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 36);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The import could not be read.";
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
      fontWeight: "900",
      textTransform: "uppercase"
    },
    title: {
      ...typography.title
    },
    subtitle: {
      ...typography.body
    },
    scanHero: {
      marginTop: spacing.md,
      alignItems: "center",
      gap: spacing.xs,
      padding: spacing.md,
      overflow: "hidden",
      borderColor: theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.42)",
      backgroundColor: colors.heroSurface
    },
    scanHeroGlow: {
      position: "absolute",
      top: -52,
      right: -44,
      width: 150,
      height: 150,
      borderRadius: 999,
      backgroundColor: `${colors.brandViolet}55`
    },
    dropKicker: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.5
    },
    dropTitle: {
      color: colors.heroText,
      fontSize: 22,
      lineHeight: 27,
      fontWeight: "900",
      textAlign: "center"
    },
    dropCopy: {
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800",
      textAlign: "center"
    },
    trustRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.xs,
      marginTop: spacing.xs
    },
    trustChip: {
      minHeight: 28,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "rgba(255,255,255,0.08)",
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 5
    },
    trustChipText: {
      color: colors.heroText,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    scanActions: {
      alignSelf: "stretch",
      flexDirection: "row",
      gap: spacing.xs,
      marginTop: spacing.xs
    },
    scanActionPrimary: {
      backgroundColor: colors.accent,
      flex: 1
    },
    scanActionSecondary: {
      flex: 1
    },
    typeBox: {
      alignSelf: "stretch",
      minHeight: 56,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "rgba(255,255,255,0.1)",
      color: colors.heroText,
      padding: spacing.md,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
      textAlignVertical: "top"
    },
    privacyNote: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700",
      textAlign: "center"
    },
    processingCard: {
      marginTop: spacing.md,
      borderRadius: radii.xl,
      backgroundColor: colors.heroSurface,
      padding: spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.26 : 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 5
    },
    processingIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.round,
      backgroundColor: colors.brandPink,
      alignItems: "center",
      justifyContent: "center"
    },
    processingCopy: {
      flex: 1,
      gap: 3
    },
    processingTitle: {
      color: colors.heroText,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900"
    },
    processingMeta: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    recentList: {
      gap: spacing.sm
    },
    recentRow: {
      minHeight: 70,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    recentIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center"
    },
    recentCopy: {
      flex: 1,
      gap: 2
    },
    recentTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    recentMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    recentSubtle: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "800"
    },
    resultCard: {
      gap: spacing.md
    },
    resultStats: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm
    },
    resultStat: {
      flex: 1,
      minWidth: "45%",
      minHeight: 70,
      borderRadius: radii.lg,
      padding: spacing.sm,
      justifyContent: "center",
      borderWidth: 1
    },
    blueStat: {
      backgroundColor: theme.isDark ? "#17243F" : "#E8F0FF",
      borderColor: theme.isDark ? "#324A77" : "#C9D9FF"
    },
    pinkStat: {
      backgroundColor: theme.isDark ? "#35162B" : "#FFE8F3",
      borderColor: theme.isDark ? "#71325B" : "#FFC9E3"
    },
    goldStat: {
      backgroundColor: colors.softGold,
      borderColor: theme.isDark ? "#5B4618" : "#F1D991"
    },
    plainStat: {
      backgroundColor: colors.surfaceAlt,
      borderColor: colors.line
    },
    resultValue: {
      color: colors.ink,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "900"
    },
    resultLabel: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900"
    },
    findings: {
      gap: spacing.xs
    },
    findingBlock: {
      alignItems: "flex-start",
      gap: spacing.xs
    },
    findingExamples: {
      alignSelf: "stretch",
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.sm,
      gap: 4
    },
    findingExampleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs
    },
    findingExampleText: {
      flex: 1,
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    exampleAddButton: {
      minHeight: 30,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.xs,
      flexDirection: "row",
      alignItems: "center",
      gap: 4
    },
    exampleAddButtonDisabled: {
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt
    },
    exampleAddText: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    exampleAddTextDisabled: {
      color: colors.faint
    },
    editList: {
      gap: spacing.sm
    },
    editCard: {
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm
    },
    editCardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    statusDot: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center"
    },
    editHeaderCopy: {
      flex: 1,
      minWidth: 0
    },
    titleInput: {
      color: colors.ink,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900",
      padding: 0
    },
    editMeta: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "800"
    },
    twoColumn: {
      flexDirection: "row",
      gap: spacing.sm
    },
    fieldHalf: {
      flex: 1
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
    applyBar: {
      marginTop: spacing.lg,
      gap: spacing.sm
    }
  });
}
