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
import { AlertTriangle, Camera, CheckCircle2, FileText, Keyboard, Search, Sparkles, Upload } from "lucide-react-native";
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
import { useI18n } from "../i18n";
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
  onTryDemo?: () => void;
  captureScreenOverride?: MarketingCaptureScreen;
};

const priorities: Priority[] = ["low", "medium", "high"];
const kinds: AssignmentKind[] = ["assignment", "worksheet", "reading", "project", "exam"];
type ImportSourceMode = "camera" | "photo" | "file" | "paste";
type TranslateFn = (key: string, fallback?: string) => string;

export function ImportScreen({ parsedImports, parsedItems, onApplyParsedPlan, onTryDemo, captureScreenOverride }: ImportScreenProps) {
  const { theme } = useAppTheme();
  const { t } = useI18n();
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

  const handleImageParserUnavailable = () => {
    Alert.alert(
      t("import.photo_disabled_title", "Photo scanning is not configured"),
      t("import.photo_disabled_message", "Use a text-based PDF or paste syllabus text. Photo and image parsing stay off until real OCR is available.")
    );
  };

  const runParse = async (source: SyllabusImportSource) => {
    try {
      setLoading(true);
      const result = await parseSyllabus(source);
      setDraft(result);
    } catch (error) {
      Alert.alert(t("import.parse_failed_school_material", "Could not parse school material"), errorMessage(error, t));
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
        name: asset.fileName || t("import.school_material_photo", "school material photo"),
        mimeType: asset.mimeType
      });
    }
  };

  const capturePhoto = async () => {
    if (!imageParsingAvailable) {
      handleImageParserUnavailable();
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t("import.camera_permission_needed", "Camera permission needed"),
        t("import.camera_permission_message", "Camera access lets you photograph syllabus pages.")
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled) {
      const asset = result.assets[0];
      if (!asset) return;
      await runParse({
        kind: "photo",
        uri: asset.uri,
        name: asset.fileName || t("import.camera_photo", "camera photo"),
        mimeType: asset.mimeType
      });
    }
  };

  const typeItIn = async () => {
    if (!typedText.trim()) {
      Alert.alert(
        t("import.type_material_title", "Type a little material"),
        t("import.type_material_message", "Paste syllabus lines, handout text, or homework notes first.")
      );
      return;
    }

    await runParse({
      kind: "typed",
      name: t("import.typed_school_material", "Typed school material"),
      text: typedText
    });
  };

  const counts = draft ? summarizeDraft(draft) : null;
  const invalidDeadlineCount = draft ? draft.assignments.filter((assignment) => !isValidDeadline(assignment.dueAt)).length : 0;
  const needsReviewCount = draft
    ? draft.assignments.filter(isDraftAssignmentFlagged).length
    : parsedItems.filter((item) => item.needsReview).length;
  const canApplyDraft = Boolean(draft && draft.assignments.length > 0 && invalidDeadlineCount === 0 && needsReviewCount === 0);
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
        <Text style={styles.kicker}>{t("tabs.scan", "Scan")}</Text>
        <Text style={styles.title}>{t("import.title", "Turn school material into reviewed assignments.")}</Text>
        <Text style={styles.subtitle}>
          {imageParsingAvailable
            ? t("import.subtitle_images", "AI-assisted imports can use camera photos, saved images, text-based PDFs, or pasted syllabus text when OCR is configured.")
            : t("import.subtitle", "AI-assisted text/PDF parsing or pasted syllabus text becomes reviewed assignments. Photo OCR is not enabled in this build.")}
        </Text>
      </View>

      <GlassCard style={styles.scanHero}>
        <View style={styles.scanHeroGlow} />
        <View style={styles.scanHeroGlowTwo} />
        <View style={styles.scanFrame}>
          <View style={styles.scanLine} />
        </View>
        <Text style={styles.dropKicker}>{t("import.step_choose_source", "Step 1 · choose a source")}</Text>
        <Text style={styles.dropTitle}>{t("import.editable_plan_title", "Turn a syllabus into an editable plan.")}</Text>
        <Text style={styles.dropCopy}>{t("import.source_picker_copy", "Pick one path. You review every assignment before it reaches Today.")}</Text>
        <View style={styles.magicPreview}>
          <MagicPreviewStep icon={FileText} title={t("tabs.scan", "Scan")} detail={t("import.source", "Source")} />
          <View style={styles.magicArrow} />
          <MagicPreviewStep icon={Search} title={t("import.review_short", "Review")} detail={t("import.draft", "Draft")} />
          <View style={styles.magicArrow} />
          <MagicPreviewStep icon={CheckCircle2} title={t("import.add", "Add")} detail={t("tabs.today", "Today")} />
        </View>
        <View style={styles.sourcePicker}>
          <SourceOption mode="camera" label={t("import.camera", "Camera")} icon={Camera} disabled={!imageParsingAvailable} />
          <SourceOption mode="photo" label={t("import.photo", "Photo")} icon={FileText} disabled={!imageParsingAvailable} />
          <SourceOption mode="file" label="PDF" icon={Upload} />
          <SourceOption mode="paste" label={t("import.paste", "Paste")} icon={Keyboard} />
        </View>
        {sourceMode === "camera" ? (
          <View style={styles.sourcePanel}>
            <Text style={styles.sourcePanelTitle}>{t("import.camera_title", "Use a syllabus photo.")}</Text>
            <Text style={styles.sourcePanelCopy}>{t("import.camera_copy", "Take a new photo or choose a saved page from your library.")}</Text>
            <View style={styles.scanActions}>
              <AppButton label={t("import.take_photo", "Take photo")} icon={Camera} onPress={capturePhoto} style={styles.scanActionPrimary} />
              <AppButton label={t("import.choose_photo", "Choose photo")} icon={FileText} variant="secondary" onPress={pickPhoto} style={styles.scanActionSecondary} />
            </View>
          </View>
        ) : null}
        {sourceMode === "photo" ? (
          <View style={styles.sourcePanel}>
            <Text style={styles.sourcePanelTitle}>{t("import.photo_title", "Use a saved photo.")}</Text>
            <Text style={styles.sourcePanelCopy}>{t("import.photo_copy", "Pick a clear syllabus page, worksheet, board photo, or handout image from your library.")}</Text>
            <AppButton label={t("import.choose_photo", "Choose photo")} icon={FileText} onPress={pickPhoto} style={styles.scanActionPrimary} />
          </View>
        ) : null}
        {sourceMode === "file" ? (
          <View style={styles.sourcePanel}>
            <Text style={styles.sourcePanelTitle}>{t("import.pdf_title", "Upload a syllabus PDF.")}</Text>
            <Text style={styles.sourcePanelCopy}>{t("import.pdf_copy", "Text-based PDFs and text files work best for AI-assisted organization.")}</Text>
            <AppButton label={t("import.upload_pdf", "Upload PDF")} icon={Upload} onPress={pickPdf} style={styles.scanActionPrimary} />
          </View>
        ) : null}
        {sourceMode === "paste" ? (
          <View style={styles.sourcePanel}>
            <TextInput
              value={typedText}
              onChangeText={setTypedText}
              multiline
              placeholder={t("import.paste_placeholder", "Paste syllabus lines or assignment dates...")}
              placeholderTextColor={colors.heroMuted}
              style={styles.typeBox}
            />
            <AppButton
              label={t("import.review_pasted_text", "Review pasted text")}
              icon={Keyboard}
              variant="secondary"
              onPress={typeItIn}
              style={styles.pasteAction}
            />
          </View>
        ) : null}
        <Text style={styles.privacyNote}>
          {t("import.privacy_note", "Nothing is added until you confirm the review list.")}
        </Text>
      </GlassCard>

      {loading ? (
        <View style={styles.processingCard}>
          <View style={styles.processingIcon}>
            <ActivityIndicator color={colors.heroText} />
          </View>
          <View style={styles.processingCopy}>
            <Text style={styles.processingTitle}>{t("import.reading_import", "Reading your import")}</Text>
            <Text style={styles.processingMeta}>{t("import.finding_work", "Finding assignments, dates, classes, and grade weights.")}</Text>
          </View>
        </View>
      ) : null}

      {parsedImports.length > 0 ? (
        <>
          <SectionHeader title={t("import.recent_imports", "Recent imports")} note={t("import.recent_imports_note", "Open one to review found work")} />
          <View style={styles.recentList}>
            {parsedImports.map((item) => (
              <TouchableOpacity
                accessibilityRole="button"
                key={item.id}
                style={styles.recentRow}
                onPress={() => {
                  setDraft(buildDraftFromRecentImport(item, parsedItems, t));
                }}
              >
                <View style={styles.recentIcon}>
                  <FileText color={colors.accent} size={18} />
                </View>
                <View style={styles.recentCopy}>
                  <Text style={styles.recentTitle}>{item.title}</Text>
                  <Text style={styles.recentMeta}>
                    {formatImportTemplate(t("import.found_count_status", "{count} found · {status}"), {
                      count: item.itemCount,
                      status: labelizeImportStatus(item.status, t)
                    })}
                  </Text>
                  <Text style={styles.recentSubtle}>{imageParsingAvailable ? t("import.recent_subtle_images", "Photos, files, and pasted text create editable drafts for review.") : t("import.recent_subtle", "PDFs and pasted text create editable drafts for review.")}</Text>
                </View>
                <Badge label={labelizeImportSourceType(item.sourceType, t)} tone={item.status === "ready" ? "blue" : "green"} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

      {draft ? (
        <>
          <SectionHeader title={t("import.review_work", "Review work")} note={t("import.review_work_note", "{count} found. Edit, confirm, then add to Today.").replace("{count}", String(draft.assignments.length))} />
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
                    {canApplyDraft ? t("import.ready_to_add", "Ready to add to Today") : t("import.review_before_adding", "Review before adding")}
                  </Text>
                  <Text style={styles.reviewGateText}>
                    {canApplyDraft
                      ? t("import.every_row_confirmed", "Every row has a valid date and has been confirmed.")
                      : reviewGateMessage(invalidDeadlineCount, needsReviewCount, t)}
                  </Text>
                </View>
              </View>
            </View>
            {counts ? (
              <View style={styles.resultStats}>
                <ResultStat value={String(counts.assignments)} label={t("import.assignments", "Assignments")} tone="blue" />
                <ResultStat value={String(counts.exams)} label={t("import.exams", "Exams")} tone="gold" />
                <ResultStat value={String(counts.projects)} label={t("import.projects", "Projects")} tone="pink" />
                <ResultStat value={String(confirmableDraftCount)} label={t("import.valid_dates", "Valid dates")} tone="plain" />
              </View>
            ) : null}
            <View style={styles.confidencePanel}>
              <Text style={styles.confidenceKicker}>{t("import.trust_check", "Trust check")}</Text>
              <Text style={styles.confidenceCopy}>
                {t("import.trust_check_copy", "Confirmed rows can reach Today, Calendar, reminders, and widgets. Invalid dates stay blocked until edited.")}
              </Text>
              <View style={styles.confidenceLegend}>
                <View style={[styles.confidenceLegendPill, styles.confidenceHigh]}>
                  <Text style={styles.confidenceLegendText}>{t("import.high_confidence", "High confidence")}</Text>
                </View>
                <View style={[styles.confidenceLegendPill, styles.confidenceMedium]}>
                  <Text style={styles.confidenceLegendText}>{t("import.check", "Check")}</Text>
                </View>
                <View style={[styles.confidenceLegendPill, styles.confidenceLow]}>
                  <Text style={styles.confidenceLegendText}>{t("import.fix_required", "Fix required")}</Text>
                </View>
              </View>
            </View>
            <View style={styles.trustRow}>
              <TrustChip label={t("import.editable_before_save", "Editable before save")} />
              <TrustChip label={t("import.widgets_use_reviewed_work", "Widgets use reviewed work")} />
              <TrustChip label={t("import.no_silent_import", "No silent import")} />
            </View>
            <AppButton
              label={invalidDeadlineCount > 0 ? t("import.confirm_valid_rows_only", "Confirm valid rows only") : t("import.confirm_all_valid_rows", "Confirm all valid rows")}
              icon={CheckCircle2}
              variant="secondary"
              disabled={confirmableDraftCount === 0}
              onPress={confirmAllValid}
            />
          </GlassCard>
          <View style={styles.editList}>
            {draft.assignments.map((assignment) => {
              const courseCode =
                draft.courses.find((course) => course.id === assignment.courseId)?.code || t("import.class", "Class");
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
                        {courseCode} · {t("import.due", "due")} {formatReviewDate(dueDate, t)}
                      </Text>
                      <ConfidenceBadge confidence={assignment.confidence || 0.9} needsReview={!reviewed} />
                    </View>
                  </View>

                  <View style={styles.twoColumn}>
                    <View style={[styles.input, styles.fieldHalf]}>
                      <Text style={styles.fieldLabel}>{t("import.class", "Class")}</Text>
                      <Text style={styles.fieldValue}>{courseCode}</Text>
                    </View>
                    <TextInput
                      value={dueDate}
                      style={[styles.input, styles.fieldHalf, hasInvalidDate ? styles.inputInvalid : null]}
                      placeholder={t("classes.date_placeholder", "YYYY-MM-DD")}
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
                      {t("import.enter_due_date_before_confirm", "Enter a real due date before this row can be confirmed.")}
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
                    {trustExplanation(assignment.confidence || 0.9, !reviewed, t)}
                  </Text>

                  {!reviewed ? (
                    <AppButton
                      label={t("import.confirm", "Confirm")}
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
                    <Text style={styles.confirmedText}>{t("import.confirmed", "Confirmed")}</Text>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.applyBar}>
            <AppButton
              label={invalidDeadlineCount > 0 ? t("import.fix_dates_before_adding", "Fix dates before adding") : needsReviewCount > 0 ? t("import.review_flagged_items_first", "Review flagged items first") : t("import.add_reviewed_items", "Add {count} reviewed items to Today").replace("{count}", String(draft.assignments.length))}
              disabled={!canApplyDraft}
              onPress={() => {
                if (!canApplyDraft) return;
                onApplyParsedPlan(draft);
              }}
            />
            <AppButton label={t("import.start_over", "Start over")} variant="secondary" onPress={() => setDraft(null)} />
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
    const state = needsReview || confidence < 0.62 ? "fix" : confidence < 0.82 ? "check" : "high";
    const label =
      state === "high"
        ? t("import.high", "High")
        : state === "check"
          ? t("import.check", "Check")
          : t("import.fix", "Fix");
    const tone = state === "high" ? "green" : state === "check" ? "gold" : "red";
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


function trustExplanation(confidence: number, needsReview: boolean, t: (key: string, fallback?: string) => string) {
  if (needsReview) return t("import.trust_needs_review", "Needs a human check: edit title, date, or time before adding to Today.");
  if (confidence < 0.62) return t("import.trust_low", "Low confidence: verify this row carefully.");
  if (confidence < 0.82) return t("import.trust_medium", "Medium confidence: looks plausible, but worth a quick read.");
  return t("import.trust_high", "High confidence: still editable before it touches your planner.");
}

function reviewGateMessage(invalidDeadlineCount: number, needsReviewCount: number, t: TranslateFn) {
  if (invalidDeadlineCount > 0) {
    return formatImportTemplate(
      invalidDeadlineCount === 1
        ? t("import.invalid_deadline_one", "{count} invalid deadline must be fixed.")
        : t("import.invalid_deadline_count", "{count} invalid deadlines must be fixed."),
      { count: invalidDeadlineCount }
    );
  }
  if (needsReviewCount > 0) {
    return formatImportTemplate(
      needsReviewCount === 1
        ? t("import.flagged_row_one", "{count} flagged row needs a quick trust check.")
        : t("import.flagged_row_count", "{count} flagged rows need a quick trust check."),
      { count: needsReviewCount }
    );
  }
  return t("import.add_reviewed_before_today", "Add at least one reviewed item before sending work to Today.");
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

function formatReviewDate(value: string, t: TranslateFn) {
  if (!isValidDateInput(value)) return t("import.needs_date", "needs date");
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
  parsedItems: ParsedItem[],
  t: TranslateFn
): SyllabusParseResult {
  const items = parsedItems.filter(
    (item) =>
      item.parsedImportId === parsedImport.id &&
      item.reviewStatus !== "dismissed" &&
      item.reviewStatus !== "accepted" &&
      !item.acceptedAt
  );
  const courseNames = Array.from(new Set(items.map((item) => item.courseName || t("import.study_hall", "Study Hall"))));
  const courses: Course[] = courseNames.map((name, index) => {
    const id = courseIdForName(name);
    return {
      id,
      code: initialsForCourse(name),
      name,
      color: courseColors[index % courseColors.length] || "#6D5CFF",
      iconKey: "book",
      emojiKey: index % 2 === 0 ? "study" : "science",
      semester: t("import.spring_2026", "Spring 2026"),
      createdAt: parsedImport.createdAt,
      updatedAt: parsedImport.updatedAt,
      meetings: [],
      gradeCategories: [
        { id: `${id}-work`, name: t("import.coursework", "Coursework"), weight: 50 },
        { id: `${id}-tests`, name: t("import.tests", "Tests"), weight: 30 },
        { id: `${id}-participation`, name: t("import.participation", "Participation"), weight: 20 }
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
          message: t("import.recent_import_handled", "Everything from this import has already been handled.")
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
      courseId: courseIdForName(item.courseName || t("import.study_hall", "Study Hall")),
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
        { id: `review-${item.id}-1`, title: t("import.review_instructions", "Review instructions"), done: false },
        { id: `review-${item.id}-2`, title: t("import.block_study_time", "Block study time"), done: false }
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
        message: formatImportTemplate(t("import.parsed_items_from_source", "{count} parsed items from {source}"), {
          count: items.length,
          source: parsedImport.title
        })
      },
      ...items
        .filter((item) => item.needsReview || item.duplicateCandidateId || !item.dueAt)
        .slice(0, 3)
        .map((item, index) => ({
          id: `${item.id}-finding-${index}`,
          severity: "needs_review" as const,
          message: item.duplicateCandidateId
            ? formatImportTemplate(t("import.may_already_be_in_planner", "{title} may already be in your planner"), { title: item.title })
            : !item.dueAt
              ? formatImportTemplate(t("import.item_needs_due_date", "{title} needs a due date"), { title: item.title })
              : formatImportTemplate(t("import.item_needs_review", "{title} needs review"), { title: item.title })
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

function labelizeImportStatus(value: ParsedImport["status"], t: TranslateFn) {
  if (value === "processing") return t("import.status_processing", "Processing");
  if (value === "applied") return t("import.status_applied", "Applied");
  if (value === "error") return t("import.status_error", "Error");
  if (value === "ready") return t("import.status_ready", "Ready");
  return t("import.status_ready", "Ready");
}

function labelizeImportSourceType(value: ParsedImport["sourceType"], t: TranslateFn) {
  if (value === "pdf") return "PDF";
  if (value === "typed") return t("import.source_typed", "Typed");
  if (value === "photo") return t("import.source_photo", "Photo");
  return t("tabs.scan", "Scan");
}

function formatImportTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template
  );
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

function errorMessage(error: unknown, t: TranslateFn) {
  return error instanceof Error ? error.message : t("import.read_failed", "The import could not be read.");
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
