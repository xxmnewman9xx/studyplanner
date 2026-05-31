import React, { useEffect, useState } from "react";
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
import { AlertTriangle, Camera, CheckCircle2, FileText, Keyboard, RefreshCw, Upload } from "lucide-react-native";
import { AppButton } from "../components/AppButton";
import { Badge } from "../components/Badge";
import { GlassCard } from "../components/AppleComponents";
import { SectionHeader } from "../components/SectionHeader";
import { StudentLifeShell } from "../components/StudentLifeSystem";
import {
  Assignment,
  AssignmentKind,
  ParsedImport,
  ParsedItem,
  SyllabusImportSource,
  SyllabusParseResult,
  UserSettings
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
  isValidTimeInput
} from "../logic/planner";
import {
  buildDraftFromParsedImport,
  createParsedImportFromCameraAsset,
  createParsedImportFromDocumentAsset,
  createParsedImportFromTypedText,
  normalizeParserError,
  parseCapturedSource,
  retryParsedImport,
  sourceForParsedImport,
  validateDocumentAsset
} from "../services/parserContract";

type ImportScreenProps = {
  settings?: UserSettings;
  assignments: Assignment[];
  parsedImports: ParsedImport[];
  parsedItems: ParsedItem[];
  onApplyParsedPlan: (parse: SyllabusParseResult) => void;
  onUpsertParsedImport: (parsedImport: ParsedImport) => void;
  onUpsertParsedItemsForImport: (parsedImportId: string, items: ParsedItem[]) => void;
  onTryDemo?: () => void;
  captureScreenOverride?: MarketingCaptureScreen;
  captureSourceModeOverride?: Extract<ImportSourceMode, "camera" | "file" | "paste">;
};

type ImportSourceMode = "camera" | "photo" | "file" | "paste";
type TranslateFn = (key: string, fallback?: string) => string;
type CaptureUiStatus = ParsedImport["status"] | "requesting_permission" | "permission_denied" | "cancelled" | "unavailable";

export function ImportScreen({
  settings,
  assignments,
  parsedImports,
  parsedItems,
  onApplyParsedPlan,
  onUpsertParsedImport,
  onUpsertParsedItemsForImport,
  onTryDemo,
  captureScreenOverride,
  captureSourceModeOverride
}: ImportScreenProps) {
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
  const [captureStatus, setCaptureStatus] = useState<CaptureUiStatus>(
    activeCaptureScreen === "processing" ? "parsing" : "idle"
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [activeImport, setActiveImport] = useState<ParsedImport | null>(null);
  const [typedText, setTypedText] = useState("");
  const [sourceMode, setSourceMode] = useState<ImportSourceMode>(() =>
    captureSourceModeOverride || "camera"
  );

  useEffect(() => {
    if (captureSourceModeOverride) setSourceMode(captureSourceModeOverride);
  }, [captureSourceModeOverride]);

  useEffect(() => {
    if (activeCaptureScreen === "processing") {
      setLoading(true);
      setCaptureStatus("parsing");
      setStatusMessage(t("import.finding_work", "Finding assignments, dates, classes, and grade weights."));
    } else if (activeCaptureScreen === "failed") {
      setLoading(false);
      setDraft(null);
      setCaptureStatus("failed");
      setStatusMessage(t("import.capture_failed_truth", "The parser could not read this source. Retry or use Type It In; no work was added."));
    } else if (activeCaptureScreen === "extracted" || activeCaptureScreen === "review_edit") {
      setLoading(false);
      setDraft(marketingCaptureParseResult);
      setCaptureStatus("parsed");
      setStatusMessage(t("import.ready_to_review_truth", "Ready to review. Every row below came from parser output or an explicit needs-date finding."));
    }
  }, [activeCaptureScreen, t]);

  const handleImageParserUnavailable = () => {
    setCaptureStatus("unavailable");
    setStatusMessage(t("import.photo_disabled_message", "Use a text-based PDF or paste syllabus text. Photo and image parsing stay off until real OCR is available."));
    Alert.alert(
      t("import.photo_disabled_title", "Photo scanning is not configured"),
      t("import.photo_disabled_message", "Use a text-based PDF or paste syllabus text. Photo and image parsing stay off until real OCR is available.")
    );
  };

  const updateImport = (nextImport: ParsedImport) => {
    setActiveImport(nextImport);
    onUpsertParsedImport(nextImport);
  };

  const runParse = async (parsedImport: ParsedImport, source: SyllabusImportSource) => {
    const queuedImport = {
      ...parsedImport,
      status: "queued" as const,
      updatedAt: new Date().toISOString()
    };
    updateImport(queuedImport);
    setDraft(null);
    setCaptureStatus("queued");
    setStatusMessage(t("import.status_queued_detail", "Queued for parser review."));

    try {
      setLoading(true);
      const parsingImport = {
        ...queuedImport,
        status: "parsing" as const,
        updatedAt: new Date().toISOString()
      };
      updateImport(parsingImport);
      setCaptureStatus("parsing");
      setStatusMessage(t("import.finding_work", "Finding assignments, dates, classes, and grade weights."));
      const result = await parseCapturedSource(parsingImport, source, {
        parseSyllabusSource: parseSyllabus,
        existingWork: assignments,
        existingParsedItems: parsedItems
      });
      onUpsertParsedImport(result.parsedImport);
      onUpsertParsedItemsForImport(result.parsedImport.id, result.parsedItems);
      setActiveImport(result.parsedImport);
      setCaptureStatus("parsed");
      setStatusMessage(t("import.ready_to_review_truth", "Ready to review. Every row below came from parser output or an explicit needs-date finding."));
      setDraft(result.parseResult);
    } catch (error) {
      const errorText = normalizeParserError(error);
      const failedImport = {
        ...parsedImport,
        status: "failed" as const,
        itemCount: 0,
        errorMessage: errorText,
        updatedAt: new Date().toISOString()
      };
      updateImport(failedImport);
      setDraft(null);
      setCaptureStatus("failed");
      setStatusMessage(errorText);
      Alert.alert(t("import.parse_failed_school_material", "Could not parse school material"), errorText);
    } finally {
      setLoading(false);
    }
  };

  const pickPdf = async () => {
    setCaptureStatus("picking");
    setStatusMessage(t("import.pick_file_status", "Choose a PDF, text file, or image."));
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "text/plain", "image/*"],
      copyToCacheDirectory: true
    });

    if (result.canceled) {
      setCaptureStatus("cancelled");
      setStatusMessage(t("import.picker_cancelled", "Import cancelled. No planner data changed."));
      return;
    }

    try {
      const asset = result.assets[0];
      if (!asset) return;
      validateDocumentAsset({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: (asset as { size?: number }).size
      });
      const parsedImport = createParsedImportFromDocumentAsset({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: (asset as { size?: number }).size
      });
      await runParse(parsedImport, {
        kind: parsedImport.sourceType === "photo" ? "photo" : "pdf",
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType
      });
    } catch (error) {
      const errorText = normalizeParserError(error);
      setCaptureStatus("failed");
      setStatusMessage(errorText);
      Alert.alert(t("import.file_not_supported", "Could not use that file"), errorText);
    }
  };

  const pickPhoto = async () => {
    setCaptureStatus("requesting_permission");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setCaptureStatus("permission_denied");
      setStatusMessage(t("import.photo_permission_message", "Photo access is needed to choose syllabus images. You can still paste text or upload a text-based PDF."));
      Alert.alert(
        t("import.photo_permission_needed", "Photo access needed"),
        t("import.photo_permission_message", "Photo access is needed to choose syllabus images. You can still paste text or upload a text-based PDF.")
      );
      return;
    }

    setCaptureStatus("picking");
    setStatusMessage(t("import.pick_photo_status", "Choose a clear syllabus or handout image."));
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.85,
      allowsMultipleSelection: false
    });

    if (result.canceled) {
      setCaptureStatus("cancelled");
      setStatusMessage(t("import.picker_cancelled", "Import cancelled. No planner data changed."));
      return;
    }

    try {
      const asset = result.assets[0];
      if (!asset) return;
      const parsedImport = createParsedImportFromCameraAsset({
        uri: asset.uri,
        name: asset.fileName || t("import.school_material_photo", "school material photo"),
        mimeType: asset.mimeType,
        size: (asset as { fileSize?: number }).fileSize
      });
      await runParse(parsedImport, {
        kind: "photo",
        uri: asset.uri,
        name: asset.fileName || t("import.school_material_photo", "school material photo"),
        mimeType: asset.mimeType
      });
    } catch (error) {
      const errorText = normalizeParserError(error);
      setCaptureStatus("failed");
      setStatusMessage(errorText);
      Alert.alert(t("import.parse_failed_school_material", "Could not parse school material"), errorText);
    }
  };

  const capturePhoto = async () => {
    setCaptureStatus("requesting_permission");
    setStatusMessage(t("import.requesting_camera", "Requesting camera access."));
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setCaptureStatus("permission_denied");
      setStatusMessage(t("import.camera_permission_message", "Camera access lets you photograph syllabus pages."));
      Alert.alert(
        t("import.camera_permission_needed", "Camera permission needed"),
        t("import.camera_permission_message", "Camera access lets you photograph syllabus pages.")
      );
      return;
    }

    try {
      setCaptureStatus("picking");
      setStatusMessage(t("import.camera_opening", "Opening camera."));
      const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
      if (result.canceled) {
        setCaptureStatus("cancelled");
        setStatusMessage(t("import.camera_cancelled", "Camera closed. No planner data changed."));
        return;
      }
      const asset = result.assets[0];
      if (!asset) return;
      const parsedImport = createParsedImportFromCameraAsset({
        uri: asset.uri,
        name: asset.fileName || t("import.camera_photo", "camera photo"),
        mimeType: asset.mimeType,
        size: (asset as { fileSize?: number }).fileSize
      });
      await runParse(parsedImport, {
        kind: "photo",
        uri: asset.uri,
        name: asset.fileName || t("import.camera_photo", "camera photo"),
        mimeType: asset.mimeType
      });
    } catch (error) {
      const errorText = normalizeParserError(error);
      setCaptureStatus("unavailable");
      setStatusMessage(errorText);
      Alert.alert(t("import.camera_unavailable", "Camera unavailable"), errorText);
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

    const parsedImport = createParsedImportFromTypedText(
      typedText,
      t("import.typed_school_material", "Typed school material")
    );
    await runParse(parsedImport, {
      kind: "typed",
      name: t("import.typed_school_material", "Typed school material"),
      text: typedText
    });
  };

  const retryImport = async (parsedImport: ParsedImport) => {
    const source = sourceForParsedImport(parsedImport);
    if (!source) {
      Alert.alert(
        t("import.retry_unavailable", "Retry unavailable"),
        t("import.retry_unavailable_message", "This import no longer has a local source. Upload or paste it again.")
      );
      return;
    }
    const retryingImport = retryParsedImport(parsedImport);
    updateImport(retryingImport);
    await runParse(retryingImport, source);
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
        isValidDeadline(assignment.dueAt) && !assignment.duplicateOf && (assignment.confidence || 1) >= 0.75
          ? {
              ...assignment,
              needsReview: false,
              confidence: Math.max(assignment.confidence || 0, 0.78),
              updatedAt
            }
          : assignment
      )
    });
  };

  return (
    <View>
      <StudentLifeShell
        settings={settings}
        surface={needsReviewCount > 0 ? "review" : "scan"}
        copy={
          needsReviewCount > 0
            ? {
                title: t("import.review_work", "Fix imported work before it appears."),
                detail: t("import.no_silent_import", "Nothing is added until you confirm the review list.")
              }
            : {
                title: t("import.title", "Import your syllabus safely."),
                detail: imageParsingAvailable
                  ? t("import.subtitle_images", "Take a photo, upload a file, or paste syllabus text. You review every row before it reaches Today.")
                  : t("import.photo_disabled_message", "Photo capture is available, but OCR review is not enabled in this build. Upload a text PDF or paste syllabus text instead.")
              }
        }
        metrics={[
          { label: t("import.assignments", "Assignments"), value: String(counts?.assignments || parsedItems.length || 0), color: "#0A84FF" },
          { label: t("today.metric_review", "Review"), value: String(needsReviewCount), color: needsReviewCount ? "#FF375F" : "#30D158" },
          { label: t("import.valid_dates", "Valid dates"), value: String(confirmableDraftCount), color: "#FF9F0A" }
        ]}
      />

      <View style={styles.scanHero}>
        <View style={styles.scanHeroBaseTint} />
        <View style={styles.scanHeroGlow} />
        <View style={styles.scanHeroGlowTwo} />
        <View style={styles.scanHeroTopSheen} />
        <View style={styles.scanHeroRim} />
        <View style={styles.scanFrame}>
          <View style={styles.scanLine} />
        </View>
        <Text style={styles.dropKicker}>{t("import.step_choose_source", "Step 1 · choose a source")}</Text>
        <Text style={styles.dropTitle}>{t("import.editable_plan_title", "Turn a syllabus into an editable plan.")}</Text>
        <Text style={styles.dropCopy}>{t("import.source_picker_copy", "Pick one path. You review every assignment before it reaches Today.")}</Text>
        <View style={styles.sourcePicker}>
          <SourceOption mode="camera" label={t("import.scan", "Scan")} icon={Camera} />
          <SourceOption mode="file" label={t("import.upload", "Upload")} icon={Upload} />
          <SourceOption mode="paste" label={t("import.type_it_in", "Type It In")} icon={Keyboard} />
        </View>
        {sourceMode === "camera" ? (
          <View style={styles.sourcePanel}>
            <Text style={styles.sourcePanelTitle}>{t("import.camera_title", "Use a syllabus photo.")}</Text>
            <Text style={styles.sourcePanelCopy}>{t("import.camera_copy", "Take a photo or choose a page. Nothing is added unless OCR returns parsed rows; Upload or Type It In for full parsing today.")}</Text>
            <View style={styles.scanActions}>
              <CaptureActionButton label={t("import.take_photo", "Take photo")} icon={Camera} onPress={capturePhoto} variant="primary" />
              <CaptureActionButton label={t("import.choose_photo", "Choose photo")} icon={FileText} onPress={pickPhoto} variant="secondary" />
            </View>
          </View>
        ) : null}
        {sourceMode === "photo" ? (
          <View style={styles.sourcePanel}>
            <Text style={styles.sourcePanelTitle}>{t("import.photo_title", "Use a saved photo.")}</Text>
            <Text style={styles.sourcePanelCopy}>{t("import.photo_copy", "Pick a clear syllabus page, worksheet, board photo, or handout image from your library.")}</Text>
            <CaptureActionButton label={t("import.choose_photo", "Choose photo")} icon={FileText} onPress={pickPhoto} variant="primary" />
          </View>
        ) : null}
        {sourceMode === "file" ? (
          <View style={styles.sourcePanel}>
            <Text style={styles.sourcePanelTitle}>{t("import.pdf_title", "Upload school material.")}</Text>
            <Text style={styles.sourcePanelCopy}>{t("import.pdf_copy", "Text-based PDFs and text files parse locally. Image files require the configured OCR endpoint.")}</Text>
            <CaptureActionButton label={t("import.upload_file", "Upload file")} icon={Upload} onPress={pickPdf} variant="primary" />
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
              variant="primary"
              onPress={typeItIn}
              style={styles.pasteAction}
            />
          </View>
        ) : null}
        <Text style={styles.privacyNote}>
          {t("import.privacy_note", "Nothing is added until you confirm the review list.")}
        </Text>
      </View>

      <View style={[
        styles.parserStatusCard,
        captureStatus === "failed" || captureStatus === "permission_denied" || captureStatus === "unavailable"
          ? styles.parserStatusError
          : captureStatus === "parsed"
            ? styles.parserStatusReady
            : null
      ]}>
        <View style={styles.parserStatusIcon}>
          {loading ? (
            <ActivityIndicator color={colors.heroText} />
          ) : captureStatus === "failed" || captureStatus === "permission_denied" || captureStatus === "unavailable" ? (
            <AlertTriangle color={colors.red} size={17} />
          ) : (
            <CheckCircle2 color={captureStatus === "parsed" ? colors.green : colors.accent} size={17} />
          )}
        </View>
        <View style={styles.parserStatusCopy}>
          <Text style={styles.parserStatusTitle}>{captureStatusLabel(captureStatus, t)}</Text>
          <Text style={styles.parserStatusText}>{statusMessage || captureStatusDetail(captureStatus, imageParsingAvailable, t)}</Text>
        </View>
        {activeImport?.status === "failed" ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("import.retry_parse", "Retry parse")}
            style={styles.retryMiniButton}
            onPress={() => retryImport(activeImport)}
          >
            <RefreshCw color={colors.accent} size={15} />
            <Text style={styles.retryMiniText}>{t("import.retry", "Retry")}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

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
                  setActiveImport(item);
                  if (item.status === "failed") {
                    setCaptureStatus("failed");
                    setStatusMessage(item.errorMessage || t("import.parse_failed_school_material", "Could not parse school material"));
                    return;
                  }
                  setDraft(buildDraftFromParsedImport(item, parsedItems, parsedDraftLabels(t)));
                  setCaptureStatus(item.status === "applied" ? "applied" : "parsed");
                  setStatusMessage(t("import.opened_recent_review", "Opened the saved parsed rows for review."));
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
                <View style={styles.recentActions}>
                  <Badge label={labelizeImportStatus(item.status, t)} tone={item.status === "failed" || item.status === "error" ? "red" : item.status === "parsed" || item.status === "ready" ? "blue" : "green"} />
                  <Badge label={labelizeImportSourceType(item.sourceType, t)} tone="green" />
                  {item.status === "failed" ? (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={t("import.retry_parse", "Retry parse")}
                      style={styles.retryMiniButton}
                      onPress={(event) => {
                        event.stopPropagation();
                        void retryImport(item);
                      }}
                    >
                      <RefreshCw color={colors.accent} size={15} />
                      <Text style={styles.retryMiniText}>{t("import.retry", "Retry")}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
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
            {draft.findings.length > 0 ? (
              <View style={styles.findings}>
                {draft.findings.map((finding) => (
                  <View key={finding.id} style={styles.findingBlock}>
                    <Badge
                      label={finding.severity === "needs_review" ? t("import.needs_review", "Needs review") : t("import.info", "Info")}
                      tone={finding.severity === "needs_review" ? "warning" : "blue"}
                    />
                    <Text style={styles.findingExampleText}>{finding.message}</Text>
                    {finding.examples?.length ? (
                      <View style={styles.findingExamples}>
                        {finding.examples.slice(0, 3).map((example) => (
                          <View key={example} style={styles.findingExampleRow}>
                            <AlertTriangle color={colors.gold} size={13} />
                            <Text style={styles.findingExampleText}>{example}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
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

  function CaptureActionButton({
    label,
    icon: Icon,
    onPress,
    variant
  }: {
    label: string;
    icon: React.ComponentType<{ color: string; size: number }>;
    onPress: () => void;
    variant: "primary" | "secondary";
  }) {
    const primary = variant === "primary";
    const foreground = primary ? "#FFFFFF" : "#EAF2FF";
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        activeOpacity={0.78}
        onPress={onPress}
        style={[styles.captureActionButton, primary ? styles.captureActionButtonPrimary : styles.captureActionButtonSecondary]}
      >
        <View pointerEvents="none" style={primary ? styles.captureActionPrimarySheen : styles.captureActionSecondarySheen} />
        <Icon color={foreground} size={18} />
        <Text style={[styles.captureActionText, { color: foreground }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>
          {label}
        </Text>
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

function labelizeImportStatus(value: ParsedImport["status"], t: TranslateFn) {
  if (value === "idle") return t("import.status_idle", "Idle");
  if (value === "picking") return t("import.status_picking", "Picking");
  if (value === "captured") return t("import.status_captured", "Captured");
  if (value === "queued") return t("import.status_queued", "Queued");
  if (value === "parsing") return t("import.status_parsing", "Parsing");
  if (value === "parsed") return t("import.status_parsed", "Parsed");
  if (value === "failed") return t("import.status_failed", "Failed");
  if (value === "retrying") return t("import.status_retrying", "Retrying");
  if (value === "reviewed") return t("import.status_reviewed", "Reviewed");
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

function parsedDraftLabels(t: TranslateFn) {
  return {
    studyHall: t("import.study_hall", "Study Hall"),
    spring2026: t("import.spring_2026", "Spring 2026"),
    coursework: t("import.coursework", "Coursework"),
    tests: t("import.tests", "Tests"),
    participation: t("import.participation", "Participation"),
    reviewInstructions: t("import.review_instructions", "Review instructions"),
    blockStudyTime: t("import.block_study_time", "Block study time"),
    recentImportHandled: t("import.recent_import_handled", "Everything from this import has already been handled."),
    parsedItemsFromSource: t("import.parsed_items_from_source", "{count} parsed items from {source}"),
    mayAlreadyBeInPlanner: t("import.may_already_be_in_planner", "{title} may already be in your planner"),
    itemNeedsDueDate: t("import.item_needs_due_date", "{title} needs a due date"),
    itemNeedsReview: t("import.item_needs_review", "{title} needs review")
  };
}

function captureStatusLabel(value: CaptureUiStatus, t: TranslateFn) {
  if (value === "requesting_permission") return t("import.status_requesting_permission", "Requesting permission");
  if (value === "permission_denied") return t("import.status_permission_denied", "Permission denied");
  if (value === "cancelled") return t("import.status_cancelled", "Cancelled");
  if (value === "unavailable") return t("import.status_unavailable", "Unavailable");
  return labelizeImportStatus(value, t);
}

function captureStatusDetail(value: CaptureUiStatus, imageParsingAvailable: boolean, t: TranslateFn) {
  if (value === "idle") {
    return imageParsingAvailable
      ? t("import.status_idle_images_detail", "Scan, upload, or type school material. Nothing is added until review.")
      : t("import.status_idle_detail", "Upload a text-based PDF or type/paste material. Photo OCR is off in this build.");
  }
  if (value === "parsed") return t("import.status_parsed_detail", "Review parser rows before adding them to Today.");
  if (value === "failed") return t("import.status_failed_detail", "Retry with the same source or choose a clearer text-based file.");
  if (value === "permission_denied") return t("import.status_permission_denied_detail", "Use Upload or Type It In, or enable permission in Settings.");
  if (value === "cancelled") return t("import.status_cancelled_detail", "No planner data changed.");
  if (value === "unavailable") return t("import.status_unavailable_detail", "This path is unavailable on the current platform or build.");
  return t("import.status_working_detail", "The parser status appears here and updates Recent imports.");
}

function formatImportTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template
  );
}

function createStyles(theme: AppTheme) {
  const { colors, radii, spacing, typography } = theme;
  const captureGlass = {
    base: theme.isDark ? "#050B17" : "#081632",
    topTint: "rgba(113,132,255,0.15)",
    lowerTint: "rgba(7,17,35,0.76)",
    border: "rgba(204,222,255,0.34)",
    rim: "rgba(255,255,255,0.16)",
    highlight: "rgba(255,255,255,0.085)",
    glowPink: "rgba(216,75,123,0.28)",
    glowIndigo: "rgba(93,95,239,0.34)",
    glowBlue: "rgba(49,91,255,0.28)",
    textPrimary: "#F8FBFF",
    textSecondary: "#D7E2F3",
    textTertiary: "#B9C7DA",
    control: "rgba(10,23,47,0.82)",
    controlBorder: "rgba(197,216,255,0.22)",
    panel: "rgba(13,28,55,0.82)",
    panelBorder: "rgba(210,226,255,0.24)",
    activeControl: "#315BFF",
    inactiveControl: "rgba(255,255,255,0.08)"
  };

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
      gap: 6,
      padding: spacing.sm,
      overflow: "hidden",
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: captureGlass.border,
      backgroundColor: captureGlass.base,
      shadowColor: "#061225",
      shadowOpacity: theme.isDark ? 0.46 : 0.26,
      shadowRadius: 26,
      shadowOffset: { width: 0, height: 18 },
      elevation: 5
    },
    scanHeroBaseTint: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "43%",
      backgroundColor: captureGlass.lowerTint
    },
    scanHeroGlow: {
      position: "absolute",
      top: -74,
      right: -50,
      width: 184,
      height: 184,
      borderRadius: 999,
      backgroundColor: captureGlass.glowIndigo
    },
    scanHeroGlowTwo: {
      position: "absolute",
      bottom: -74,
      left: -42,
      width: 156,
      height: 156,
      borderRadius: 999,
      backgroundColor: captureGlass.glowPink
    },
    scanHeroTopSheen: {
      position: "absolute",
      top: 1,
      left: 1,
      right: 1,
      height: 86,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      backgroundColor: captureGlass.highlight
    },
    scanHeroRim: {
      position: "absolute",
      top: 1,
      left: 1,
      right: 1,
      bottom: 1,
      borderRadius: radii.xl - 1,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: captureGlass.rim
    },
    scanFrame: {
      width: 52,
      height: 52,
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(235,242,255,0.28)",
      backgroundColor: "rgba(255,255,255,0.075)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2
    },
    scanLine: {
      width: 36,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOpacity: 0.52,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 0 }
    },
    dropKicker: {
      color: "#8EA8FF",
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.8
    },
    dropTitle: {
      color: captureGlass.textPrimary,
      fontSize: 21,
      lineHeight: 26,
      fontWeight: "900",
      letterSpacing: 0,
      textAlign: "center"
    },
    dropCopy: {
      color: captureGlass.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
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
      borderWidth: 1,
      borderColor: captureGlass.controlBorder,
      backgroundColor: captureGlass.control,
      padding: 4,
      flexDirection: "row",
      gap: 4,
      shadowColor: "#000000",
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 }
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
      backgroundColor: captureGlass.activeControl,
      shadowColor: captureGlass.glowBlue,
      shadowOpacity: 0.55,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 }
    },
    sourceOptionDisabled: {
      opacity: 0.48
    },
    sourceOptionText: {
      color: captureGlass.textSecondary,
      fontSize: 12,
      lineHeight: 15,
      fontWeight: "900"
    },
    sourceOptionTextSelected: {
      color: captureGlass.textPrimary
    },
    sourceOptionTextDisabled: {
      color: colors.faint
    },
    sourcePanel: {
      alignSelf: "stretch",
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: captureGlass.panelBorder,
      backgroundColor: captureGlass.panel,
      padding: spacing.sm,
      gap: spacing.xs
    },
    sourcePanelTitle: {
      color: captureGlass.textPrimary,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: "900",
      textAlign: "center"
    },
    sourcePanelCopy: {
      color: captureGlass.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800",
      textAlign: "center"
    },
    scanActions: {
      alignSelf: "stretch",
      flexDirection: "row",
      gap: spacing.xs,
      marginTop: 0
    },
    pasteAction: {
      alignSelf: "stretch",
      backgroundColor: captureGlass.activeControl
    },
    captureActionButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: radii.lg,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: spacing.xs,
      overflow: "hidden"
    },
    captureActionButtonPrimary: {
      backgroundColor: captureGlass.activeControl,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.26)",
      shadowColor: "#315BFF",
      shadowOpacity: 0.34,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4
    },
    captureActionButtonSecondary: {
      backgroundColor: "rgba(255,255,255,0.12)",
      borderWidth: 1,
      borderColor: "rgba(222,235,255,0.32)"
    },
    captureActionPrimarySheen: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "48%",
      backgroundColor: "rgba(255,255,255,0.16)"
    },
    captureActionSecondarySheen: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "42%",
      backgroundColor: "rgba(255,255,255,0.08)"
    },
    captureActionText: {
      flexShrink: 1,
      maxWidth: "100%",
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: 0,
      fontWeight: "900",
      textAlign: "center"
    },
    typeBox: {
      alignSelf: "stretch",
      minHeight: 56,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: "rgba(222,235,255,0.24)",
      backgroundColor: "rgba(255,255,255,0.10)",
      color: captureGlass.textPrimary,
      padding: spacing.md,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "700",
      textAlignVertical: "top"
    },
    privacyNote: {
      color: captureGlass.textTertiary,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700",
      textAlign: "center"
    },
    parserStatusCard: {
      marginTop: spacing.md,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      padding: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm
    },
    parserStatusReady: {
      borderColor: theme.isDark ? "#1D5A3D" : "#BFEBD4",
      backgroundColor: colors.mint
    },
    parserStatusError: {
      borderColor: theme.isDark ? "#6B322A" : "#F3B7A9",
      backgroundColor: theme.isDark ? "#3A201D" : "#FFF1EC"
    },
    parserStatusIcon: {
      width: 36,
      height: 36,
      borderRadius: radii.round,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center"
    },
    parserStatusCopy: {
      flex: 1,
      gap: 2
    },
    parserStatusTitle: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "900"
    },
    parserStatusText: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700"
    },
    retryMiniButton: {
      minHeight: 34,
      borderRadius: radii.round,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5
    },
    retryMiniText: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "900"
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
    recentActions: {
      alignItems: "flex-end",
      gap: 5,
      maxWidth: 120
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
