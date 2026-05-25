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
import { AlertTriangle, Camera, CheckCircle2, Crown, FileText, Keyboard, Plus, Search, Sparkles, Upload } from "lucide-react-native";
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
  marketingCaptureScreen,
  type MarketingCaptureScreen
} from "../services/marketingCapture";
import { AppTheme } from "../theme";
import { useAppTheme } from "../themeContext";
import {
  isValidDateInput,
  isValidDeadline,
  isValidTimeInput,
  normalizeEstimatedMinutes
} from "../logic/planner";

type ImportScreenProps = {
  parsedImports: ParsedImport[];
  parsedItems: ParsedItem[];
  onApplyParsedPlan: (parse: SyllabusParseResult) => void;
  premiumImportLocked?: boolean;
  onOpenPaywall?: () => void;
  onTryDemo?: () => void;
  captureScreenOverride?: MarketingCaptureScreen;
};

const priorities: Priority[] = ["low", "medium", "high"];
const kinds: AssignmentKind[] = ["assignment", "worksheet", "reading", "project", "exam"];
type ImportSourceMode = "camera" | "photo" | "file" | "paste";

export function ImportScreen({ parsedImports, parsedItems, onApplyParsedPlan, premiumImportLocked = false, onOpenPaywall, onTryDemo, captureScreenOverride }: ImportScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const styles = createStyles(theme);
  const activeCaptureScreen = captureScreenOverride || marketingCaptureScreen;
  const captureDraft =
    activeCaptureScreen === "extracted" || activeCaptureScreen === "review_edit";
  const imageParsingAvailable = supportsSyllabusImageParsing();
  const [draft, setDraft] = useState<SyllabusParseResult | null>(
    captureDraft ? marketingCaptureParseResult : null
  );
  const [loading, setLoading] = useState(activeCaptureScreen === "processing");
  const [typedText, setTypedText] = useState("");
  const [sourceMode, setSourceMode] = useState<ImportSourceMode>(() =>
    imageParsingAvailable ? "camera" : "file"
  );

  const handleLockedImport = () => {
    Alert.alert(
      "Plus required",
      "Unlock Plus to scan photos, files, pasted text, and re-imports for the rest of the semester.",
      [
        { text: "Not now", style: "cancel" },
        { text: "See Plus", onPress: onOpenPaywall }
      ]
    );
  };
  const handleImageParserUnavailable = () => {
    Alert.alert(
      "Photo scanning is not configured",
      "This build has no local image OCR. Use a text-based PDF or paste syllabus text, or configure the hosted parser with image parsing enabled."
    );
  };

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
    if (premiumImportLocked) {
      handleLockedImport();
      return;
    }

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
    if (premiumImportLocked) {
      handleLockedImport();
      return;
    }
    if (!imageParsingAvailable) {
      handleImageParserUnavailable();
      return;
    }

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
    if (premiumImportLocked) {
      handleLockedImport();
      return;
    }
    if (!imageParsingAvailable) {
      handleImageParserUnavailable();
      return;
    }

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
        name: asset.fileName || "camera photo",
        mimeType: asset.mimeType
      });
    }
  };

  const typeItIn = async () => {
    if (premiumImportLocked) {
      handleLockedImport();
      return;
    }

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
  const invalidDeadlineCount = draft ? draft.assignments.filter((assignment) => !isValidDeadline(assignment.dueAt)).length : 0;
  const needsReviewCount = draft
    ? draft.assignments.filter(isDraftAssignmentFlagged).length
    : parsedItems.filter((item) => item.needsReview).length;
  const canApplyDraft = Boolean(draft && draft.assignments.length > 0 && invalidDeadlineCount === 0 && needsReviewCount === 0 && !premiumImportLocked);
  const confirmableDraftCount = draft
    ? draft.assignments.filter((assignment) => isValidDeadline(assignment.dueAt)).length
    : 0;

  const confirmAllValid = () => {
    if (!draft) return;
    const updatedAt = new Date().toISOString();
    setDraft({
      ...draft,
      assignments: draft.assignments.map((assignment) =>
        isValidDeadline(assignment.dueAt)
          ? {
              ...assignment,
              needsReview: false,
              duplicateOf: undefined,
              confidence: Math.max(assignment.confidence || 0, 0.86),
              updatedAt
            }
          : assignment
      )
    });
  };

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
        <Text style={styles.kicker}>Scan</Text>
        <Text style={styles.title}>Scan your syllabus.</Text>
        <Text style={styles.subtitle}>
          {imageParsingAvailable
            ? "Turn paper, saved photos, PDFs, or pasted text into reviewed assignments."
            : "Turn text-based PDFs or pasted syllabus text into reviewed assignments."}
        </Text>
      </View>

      {premiumImportLocked ? (
        <GlassCard style={styles.limitCard}>
          <View style={styles.limitIcon}>
            <Crown color={colors.accent} size={18} />
          </View>
          <View style={styles.limitCopy}>
            <Text style={styles.limitTitle}>Plus unlocks syllabus imports</Text>
            <Text style={styles.limitText}>{imageParsingAvailable ? "Scan photos, files, pasted text, and re-imports when your semester gets busy." : "Upload text-based PDFs, paste text, and re-import when your semester gets busy."}</Text>
          </View>
          <AppButton label="Unlock Plus" icon={Crown} onPress={onOpenPaywall || (() => undefined)} />
        </GlassCard>
      ) : null}

      <GlassCard style={styles.scanHero}>
        <View style={styles.scanHeroGlow} />
        <View style={styles.scanHeroGlowTwo} />
        <View style={styles.scanFrame}>
          <View style={styles.scanLine} />
        </View>
        <Text style={styles.dropKicker}>Step 1 · choose a source</Text>
        <Text style={styles.dropTitle}>Turn a syllabus into assignments.</Text>
        <Text style={styles.dropCopy}>Pick one path. You review every assignment before it reaches Today.</Text>
        <View style={styles.magicPreview}>
          <MagicPreviewStep icon={FileText} title="Scan" detail="Source" />
          <View style={styles.magicArrow} />
          <MagicPreviewStep icon={Search} title="Review" detail="Draft" />
          <View style={styles.magicArrow} />
          <MagicPreviewStep icon={CheckCircle2} title="Add" detail="Today" />
        </View>
        <View style={styles.sourcePicker}>
          <SourceOption mode="camera" label="Camera" icon={Camera} disabled={!imageParsingAvailable} />
          <SourceOption mode="photo" label="Photo" icon={FileText} disabled={!imageParsingAvailable} />
          <SourceOption mode="file" label="PDF" icon={Upload} />
          <SourceOption mode="paste" label="Paste" icon={Keyboard} />
        </View>
        {sourceMode === "camera" ? (
          <View style={styles.sourcePanel}>
            <Text style={styles.sourcePanelTitle}>Use a syllabus photo.</Text>
            <Text style={styles.sourcePanelCopy}>Take a new photo or choose a saved page from your library.</Text>
            <View style={styles.scanActions}>
              <AppButton label="Take photo" icon={Camera} onPress={capturePhoto} style={styles.scanActionPrimary} />
              <AppButton label="Choose photo" icon={FileText} variant="secondary" onPress={pickPhoto} style={styles.scanActionSecondary} />
            </View>
          </View>
        ) : null}
        {sourceMode === "photo" ? (
          <View style={styles.sourcePanel}>
            <Text style={styles.sourcePanelTitle}>Use a saved photo.</Text>
            <Text style={styles.sourcePanelCopy}>Pick a clear syllabus page, worksheet, board photo, or handout image from your library.</Text>
            <AppButton label="Choose photo" icon={FileText} onPress={pickPhoto} style={styles.scanActionPrimary} />
          </View>
        ) : null}
        {sourceMode === "file" ? (
          <View style={styles.sourcePanel}>
            <Text style={styles.sourcePanelTitle}>Upload a syllabus PDF.</Text>
            <Text style={styles.sourcePanelCopy}>Text-based PDFs and text files work best.</Text>
            <AppButton label="Upload PDF" icon={Upload} onPress={pickPdf} style={styles.scanActionPrimary} />
          </View>
        ) : null}
        {sourceMode === "paste" ? (
          <View style={styles.sourcePanel}>
            <TextInput
              value={typedText}
              onChangeText={setTypedText}
              multiline
              placeholder="Paste syllabus lines or assignment dates..."
              placeholderTextColor={colors.heroMuted}
              style={styles.typeBox}
            />
            <AppButton
              label="Review pasted text"
              icon={Keyboard}
              variant="secondary"
              onPress={typeItIn}
              style={styles.pasteAction}
            />
          </View>
        ) : null}
        <Text style={styles.privacyNote}>
          Nothing is added until you confirm the review list.
        </Text>
      </GlassCard>

      {loading ? (
        <View style={styles.processingCard}>
          <View style={styles.processingIcon}>
            <ActivityIndicator color={colors.heroText} />
          </View>
          <View style={styles.processingCopy}>
            <Text style={styles.processingTitle}>Reading your import</Text>
            <Text style={styles.processingMeta}>Finding assignments, dates, classes, and grade weights.</Text>
          </View>
        </View>
      ) : null}

      {parsedImports.length > 0 ? (
        <>
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
                  <Text style={styles.recentSubtle}>{imageParsingAvailable ? "Photos, files, and pasted text create editable drafts for review." : "PDFs and pasted text create editable drafts for review."}</Text>
                </View>
                <Badge label={labelize(item.sourceType)} tone={item.status === "ready" ? "blue" : "green"} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

      {draft ? (
        <>
          <SectionHeader title="Review work" note={`${draft.assignments.length} found. Edit, confirm, then add to Today.`} />
          <GlassCard style={styles.resultCard}>
            <View style={[
              styles.reviewGateCard,
              canApplyDraft ? styles.reviewGateReady : styles.reviewGateBlocked
            ]}>
              <View style={styles.reviewGateHeader}>
                <View style={styles.reviewGateIcon}>
                  {canApplyDraft ? (
                    <CheckCircle2 color={colors.green} size={18} />
                  ) : (
                    <AlertTriangle color={colors.red} size={18} />
                  )}
                </View>
                <View style={styles.reviewGateCopy}>
                  <Text style={styles.reviewGateTitle}>
                    {canApplyDraft ? "Ready to add to Today" : "Review before adding"}
                  </Text>
                  <Text style={styles.reviewGateText}>
                    {canApplyDraft
                      ? "Every row has a valid date and has been confirmed."
                      : reviewGateMessage(invalidDeadlineCount, needsReviewCount)}
                  </Text>
                </View>
              </View>
            </View>
            {counts ? (
              <View style={styles.resultStats}>
                <ResultStat value={String(counts.assignments)} label="Assignments" tone="blue" />
                <ResultStat value={String(counts.exams)} label="Exams" tone="gold" />
                <ResultStat value={String(counts.projects)} label="Projects" tone="pink" />
                <ResultStat value={String(confirmableDraftCount)} label="Valid dates" tone="plain" />
              </View>
            ) : null}
            <View style={styles.confidencePanel}>
              <Text style={styles.confidenceKicker}>Trust check</Text>
              <Text style={styles.confidenceCopy}>
                Confirmed rows can reach Today, Calendar, reminders, and widgets. Invalid dates stay blocked until edited.
              </Text>
              <View style={styles.confidenceLegend}>
                <View style={[styles.confidenceLegendPill, styles.confidenceHigh]}>
                  <Text style={styles.confidenceLegendText}>High confidence</Text>
                </View>
                <View style={[styles.confidenceLegendPill, styles.confidenceMedium]}>
                  <Text style={styles.confidenceLegendText}>Check</Text>
                </View>
                <View style={[styles.confidenceLegendPill, styles.confidenceLow]}>
                  <Text style={styles.confidenceLegendText}>Fix required</Text>
                </View>
              </View>
            </View>
            <View style={styles.trustRow}>
              <TrustChip label="Editable before save" />
              <TrustChip label="Widgets use reviewed work" />
              <TrustChip label="No silent import" />
            </View>
            <AppButton
              label={invalidDeadlineCount > 0 ? "Confirm valid rows only" : "Confirm all valid rows"}
              icon={CheckCircle2}
              variant="secondary"
              disabled={confirmableDraftCount === 0}
              onPress={confirmAllValid}
            />
          </GlassCard>
          <View style={styles.editList}>
            {draft.assignments.map((assignment) => {
              const courseCode =
                draft.courses.find((course) => course.id === assignment.courseId)?.code || "Class";
              const dueDate = assignment.dueAt.slice(0, 10);
              const dueTime = normalizedDueTime(assignment.dueAt, assignment.kind);
              const hasInvalidDate = !isValidDateInput(dueDate);
              const hasInvalidDeadline = !isValidDeadline(assignment.dueAt);
              const reviewed = !isDraftAssignmentFlagged(assignment);
              return (
                <View key={assignment.id} style={[styles.editCard, hasInvalidDeadline ? styles.editCardBlocked : null]}>
                  <View style={styles.editCardTop}>
                    <View style={[styles.statusDot, reviewed ? null : styles.statusDotReview]}>
                      <CheckCircle2 color={reviewed ? colors.heroText : colors.ink} size={16} />
                    </View>
                    <View style={styles.editHeaderCopy}>
                      <TextInput
                        value={assignment.title}
                        style={styles.titleInput}
                        placeholderTextColor={colors.faint}
                        onChangeText={(title) =>
                          setDraft(updateParsedAssignment(draft, assignment.id, { title, updatedAt: new Date().toISOString() }))
                        }
                      />
                      <Text style={styles.editMeta}>
                        {courseCode} · due {formatReviewDate(dueDate)}
                      </Text>
                      <ConfidenceBadge confidence={assignment.confidence || 0.9} needsReview={!reviewed} />
                    </View>
                  </View>

                  <View style={styles.twoColumn}>
                    <View style={[styles.input, styles.fieldHalf]}>
                      <Text style={styles.fieldLabel}>Class</Text>
                      <Text style={styles.fieldValue}>{courseCode}</Text>
                    </View>
                    <TextInput
                      value={dueDate}
                      style={[styles.input, styles.fieldHalf, hasInvalidDate ? styles.inputInvalid : null]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.faint}
                      onChangeText={(date) =>
                        setDraft(
                          updateParsedAssignment(draft, assignment.id, {
                            dueAt: `${date}T${dueTime}:00`,
                            needsReview: !isValidDateInput(date) || !isValidTimeInput(dueTime),
                            updatedAt: new Date().toISOString()
                          })
                        )
                      }
                    />
                  </View>
                  {hasInvalidDeadline ? (
                    <Text style={styles.dateBlockerText}>
                      Enter a real due date before this row can be confirmed.
                    </Text>
                  ) : null}
                  <View style={styles.trustRail}>
                    <View
                      style={[
                        styles.trustRailFill,
                        { width: `${Math.min(100, Math.max(12, Math.round((assignment.confidence || 0.9) * 100)))}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.trustExplanation}>
                    {trustExplanation(assignment.confidence || 0.9, !reviewed)}
                  </Text>

                  {!reviewed ? (
                    <AppButton
                      label="Confirm"
                      variant="secondary"
                      disabled={!isValidDeadline(assignment.dueAt)}
                      onPress={() =>
                        setDraft(
                          updateParsedAssignment(draft, assignment.id, {
                            needsReview: false,
                            duplicateOf: undefined,
                            confidence: Math.max(assignment.confidence || 0, 0.86),
                            updatedAt: new Date().toISOString()
                          })
                        )
                      }
                    />
                  ) : (
                    <Text style={styles.confirmedText}>Confirmed</Text>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.applyBar}>
            <AppButton
              label={premiumImportLocked ? "Upgrade for unlimited imports" : invalidDeadlineCount > 0 ? "Fix dates before adding" : needsReviewCount > 0 ? "Review flagged items first" : `Add ${draft.assignments.length} reviewed item${draft.assignments.length === 1 ? "" : "s"} to Today`}
              disabled={!canApplyDraft && !premiumImportLocked}
              onPress={() => {
                if (premiumImportLocked) {
                  onOpenPaywall?.();
                  return;
                }
                if (!canApplyDraft) return;
                onApplyParsedPlan(draft);
              }}
            />
            <AppButton label="Start over" variant="secondary" onPress={() => setDraft(null)} />
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

  function SourceOption({
    mode,
    label,
    icon: Icon,
    disabled = false
  }: {
    mode: ImportSourceMode;
    label: string;
    icon: React.ComponentType<{ color: string; size: number }>;
    disabled?: boolean;
  }) {
    const selected = sourceMode === mode;
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ selected, disabled }}
        style={[styles.sourceOption, selected ? styles.sourceOptionSelected : null, disabled ? styles.sourceOptionDisabled : null]}
        onPress={() => {
          if (disabled) {
            handleImageParserUnavailable();
            return;
          }
          setSourceMode(mode);
        }}
      >
        <Icon color={selected ? colors.heroText : disabled ? colors.faint : colors.heroMuted} size={16} />
        <Text style={[styles.sourceOptionText, selected ? styles.sourceOptionTextSelected : null, disabled ? styles.sourceOptionTextDisabled : null]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  function ConfidenceBadge({ confidence, needsReview }: { confidence: number; needsReview: boolean }) {
    const label = needsReview || confidence < 0.62 ? "Fix" : confidence < 0.82 ? "Check" : "High";
    const tone = label === "High" ? "green" : label === "Check" ? "gold" : "red";
    return <Badge label={`${label} ${Math.round(confidence * 100)}%`} tone={tone} />;
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

  function MagicPreviewStep({ icon: Icon, title, detail }: { icon: React.ComponentType<{ color: string; size: number }>; title: string; detail: string }) {
    return (
      <View style={styles.magicStep}>
        <Icon color={colors.heroText} size={24} />
        <Text style={styles.magicTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>{title}</Text>
        <Text style={styles.magicDetail} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>{detail}</Text>
      </View>
    );
  }
}


function trustExplanation(confidence: number, needsReview: boolean) {
  if (needsReview) return "Needs a human check: edit title, date, or time before adding to Today.";
  if (confidence < 0.62) return "Low confidence: verify this row carefully.";
  if (confidence < 0.82) return "Medium confidence: looks plausible, but worth a quick read.";
  return "High confidence: still editable before it touches your planner.";
}

function reviewGateMessage(invalidDeadlineCount: number, needsReviewCount: number) {
  if (invalidDeadlineCount > 0) {
    return `${invalidDeadlineCount} invalid deadline${invalidDeadlineCount === 1 ? "" : "s"} must be fixed.`;
  }
  if (needsReviewCount > 0) {
    return `${needsReviewCount} flagged row${needsReviewCount === 1 ? "" : "s"} need a quick trust check.`;
  }
  return "Add at least one reviewed item before sending work to Today.";
}

function isDraftAssignmentFlagged(assignment: SyllabusParseResult["assignments"][number]) {
  return Boolean(
    assignment.needsReview ||
      assignment.duplicateOf ||
      !isValidDeadline(assignment.dueAt) ||
      (assignment.confidence || 1) < 0.75
  );
}

function normalizedDueTime(value: string, kind: AssignmentKind) {
  const time = value.slice(11, 16);
  if (isValidTimeInput(time)) return time;
  return kind === "exam" ? "09:00" : "23:59";
}

function formatReviewDate(value: string) {
  if (!isValidDateInput(value)) return "needs date";
  return value;
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
    limitCard: {
      marginTop: spacing.md,
      gap: spacing.sm
    },
    limitIcon: {
      width: 38,
      height: 38,
      borderRadius: radii.round,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft
    },
    limitCopy: {
      gap: 3
    },
    limitTitle: {
      color: colors.ink,
      fontSize: 17,
      lineHeight: 23,
      fontWeight: "900"
    },
    limitText: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700"
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
      top: -58,
      right: -48,
      width: 168,
      height: 168,
      borderRadius: 999,
      backgroundColor: colors.accent,
      opacity: theme.isDark ? 0.20 : 0.10
    },
    scanHeroGlowTwo: {
      position: "absolute",
      bottom: -62,
      left: -44,
      width: 144,
      height: 144,
      borderRadius: 999,
      backgroundColor: colors.brandViolet,
      opacity: theme.isDark ? 0.14 : 0.08
    },
    scanFrame: {
      width: 82,
      height: 82,
      borderRadius: 26,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.22)",
      backgroundColor: "rgba(255,255,255,0.08)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xs
    },
    scanLine: {
      width: 52,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOpacity: 0.52,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 0 }
    },
    dropKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.8
    },
    dropTitle: {
      color: colors.heroText,
      fontSize: 25,
      lineHeight: 30,
      fontWeight: "900",
      letterSpacing: 0,
      textAlign: "center"
    },
    dropCopy: {
      color: colors.heroMuted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600",
      textAlign: "center"
    },
    magicPreview: {
      alignSelf: "stretch",
      borderRadius: radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "rgba(255,255,255,0.09)",
      padding: spacing.sm,
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs,
      marginTop: spacing.xs
    },
    magicStep: {
      flex: 1,
      minWidth: 72,
      minHeight: 70,
      borderRadius: radii.lg,
      backgroundColor: "rgba(255,255,255,0.10)",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xs,
      gap: 2
    },
    magicTitle: {
      color: colors.heroText,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900",
      textAlign: "center"
    },
    magicDetail: {
      color: colors.heroMuted,
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "800",
      textAlign: "center"
    },
    magicArrow: {
      width: 10,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.accent
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
      borderWidth: StyleSheet.hairlineWidth,
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
    sourcePicker: {
      alignSelf: "stretch",
      minHeight: 44,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "rgba(255,255,255,0.08)",
      padding: 4,
      flexDirection: "row",
      gap: 4
    },
    sourceOption: {
      flex: 1,
      minHeight: 36,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 6
    },
    sourceOptionSelected: {
      backgroundColor: colors.accent
    },
    sourceOptionDisabled: {
      opacity: 0.48
    },
    sourceOptionText: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 15,
      fontWeight: "900"
    },
    sourceOptionTextSelected: {
      color: colors.heroText
    },
    sourceOptionTextDisabled: {
      color: colors.faint
    },
    sourcePanel: {
      alignSelf: "stretch",
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.18)",
      backgroundColor: "rgba(255,255,255,0.08)",
      padding: spacing.sm,
      gap: spacing.sm
    },
    sourcePanelTitle: {
      color: colors.heroText,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900",
      textAlign: "center"
    },
    sourcePanelCopy: {
      color: colors.heroMuted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800",
      textAlign: "center"
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
    pasteAction: {
      alignSelf: "stretch"
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
    reviewGateCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      padding: spacing.md
    },
    reviewGateReady: {
      borderColor: theme.isDark ? "#1D5A3D" : "#BFEBD4",
      backgroundColor: colors.mint
    },
    reviewGateBlocked: {
      borderColor: theme.isDark ? "#6B322A" : "#F3B7A9",
      backgroundColor: theme.isDark ? "#3A201D" : "#FFE0D8"
    },
    reviewGateHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    reviewGateIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center"
    },
    reviewGateCopy: {
      flex: 1,
      gap: 2
    },
    reviewGateTitle: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900"
    },
    reviewGateText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    resultStats: {
      flexDirection: "row",
      flexWrap: "wrap",
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      overflow: "hidden"
    },
    resultStat: {
      flex: 1,
      minWidth: "45%",
      minHeight: 70,
      padding: spacing.sm,
      justifyContent: "center",
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.line,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.line
    },
    blueStat: {},
    pinkStat: {},
    goldStat: {},
    plainStat: {},
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
    confidencePanel: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.72)",
      padding: spacing.md,
      gap: spacing.xs
    },
    confidenceKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.7
    },
    confidenceCopy: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "800"
    },
    confidenceLegend: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs
    },
    confidenceLegendPill: {
      borderRadius: radii.round,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7
    },
    confidenceLegendText: {
      color: colors.heroText,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: "900"
    },
    confidenceHigh: { backgroundColor: colors.green },
    confidenceMedium: { backgroundColor: colors.gold },
    confidenceLow: { backgroundColor: colors.red },
    firstMovesCard: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm
    },
    firstMovesKicker: {
      color: colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.6,
      textTransform: "uppercase"
    },
    firstMovesTitle: {
      color: colors.ink,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "900"
    },
    firstMovesList: {
      gap: spacing.sm
    },
    firstMoveRow: {
      flexDirection: "row",
      gap: spacing.sm,
      alignItems: "flex-start"
    },
    firstMoveNumber: {
      width: 25,
      height: 25,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft
    },
    firstMoveNumberText: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "900"
    },
    firstMoveCopy: {
      flex: 1,
      gap: 2
    },
    firstMoveTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    firstMoveDetail: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm,
      shadowColor: colors.shadow,
      shadowOpacity: theme.isDark ? 0.18 : 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2
    },
    editCardBlocked: {
      borderColor: colors.red,
      backgroundColor: theme.isDark ? "#21151A" : "#FFF8F6"
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
    statusDotReview: {
      backgroundColor: colors.softGold
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
    fieldLabel: {
      color: colors.faint,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "900",
      textTransform: "uppercase"
    },
    fieldValue: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "900"
    },
    inputInvalid: {
      borderColor: colors.red,
      backgroundColor: theme.isDark ? "#21151A" : "#FFF8F6"
    },
    dateBlockerText: {
      color: colors.red,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "900"
    },
    trustRail: {
      height: 8,
      borderRadius: radii.round,
      backgroundColor: colors.surfaceAlt,
      overflow: "hidden"
    },
    trustRailFill: {
      height: "100%",
      borderRadius: radii.round,
      backgroundColor: colors.accent
    },
    trustExplanation: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800"
    },
    confirmedText: {
      color: colors.green,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    applyBar: {
      marginTop: spacing.lg,
      gap: spacing.sm
    }
  });
}
