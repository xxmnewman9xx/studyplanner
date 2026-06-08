import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { CheckCircle2, FileText, Upload } from "lucide-react-native";

import { AppButton, AppCard, AppHeader, AppSurface, Dot, IconTile, PrototypeIcons, SemesterPulse, SP } from "../components/PrototypeUI";
import { Assignment, ParsedImport, ParsedItem, SyllabusImportSource, SyllabusParseResult } from "../models";
import { parseSyllabus, supportsSyllabusImageParsing } from "../services/syllabusParser";
import { hasNativeImageTextRecognition } from "../services/imageTextRecognition";
import { getMarketingCaptureParseResult, marketingCaptureScreen, type MarketingCaptureScreen } from "../services/marketingCapture";
import { useI18n } from "../i18n";
import {
  createParsedImportFromCameraAsset,
  createParsedImportFromDocumentAsset,
  normalizeParserError,
  parseCapturedSource,
  validateDocumentAsset
} from "../services/parserContract";

type ImportScreenProps = {
  assignments: Assignment[];
  parsedImports: ParsedImport[];
  parsedItems: ParsedItem[];
  onApplyParsedPlan: (parse: SyllabusParseResult) => void;
  onUpsertParsedImport: (parsedImport: ParsedImport) => void;
  onUpsertParsedItemsForImport: (parsedImportId: string, items: ParsedItem[]) => void;
  onTryDemo?: () => void;
  captureScreenOverride?: MarketingCaptureScreen;
  captureSourceModeOverride?: "camera" | "file" | "paste";
};

export function ImportScreen({
  assignments,
  parsedItems,
  onApplyParsedPlan,
  onUpsertParsedImport,
  onUpsertParsedItemsForImport,
  captureScreenOverride
}: ImportScreenProps) {
  const { t, locale } = useI18n();
  const captureScreen = captureScreenOverride || marketingCaptureScreen;
  const captureParseResult = useMemo(() => getMarketingCaptureParseResult(locale), [locale]);
  const [draft, setDraft] = useState<SyllabusParseResult | null>(
    captureScreen === "extracted" || captureScreen === "review_edit" ? captureParseResult : null
  );
  const [loading, setLoading] = useState(captureScreen === "processing");
  const organizedMode = captureScreen === "extracted";
  const reviewMode = captureScreen === "review_edit";
  const canParseImages = hasNativeImageTextRecognition() || supportsSyllabusImageParsing();

  useEffect(() => {
    if (captureScreen === "processing") {
      setLoading(true);
      setDraft(null);
      return;
    }
    if (captureScreen === "extracted" || captureScreen === "review_edit") {
      setLoading(false);
      setDraft(captureParseResult);
      return;
    }
    setLoading(false);
  }, [captureParseResult, captureScreen]);

  const runParse = async (parsedImport: ParsedImport, source: SyllabusImportSource) => {
    setLoading(true);
    setDraft(null);
    try {
      const result = await parseCapturedSource(parsedImport, source, {
        parseSyllabusSource: parseSyllabus,
        existingWork: assignments,
        existingParsedItems: parsedItems
      });
      onUpsertParsedImport(result.parsedImport);
      onUpsertParsedItemsForImport(result.parsedImport.id, result.parsedItems);
      setDraft(result.parseResult);
    } catch (error) {
      Alert.alert(t("errors.parse_failed", "Could not parse school material"), normalizeParserError(error));
    } finally {
      setLoading(false);
    }
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "text/plain"],
      copyToCacheDirectory: true
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    validateDocumentAsset({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: (asset as { size?: number }).size });
    await runParse(
      createParsedImportFromDocumentAsset({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: (asset as { size?: number }).size }),
      { kind: "pdf", uri: asset.uri, name: asset.name, mimeType: asset.mimeType }
    );
  };

  const parsePhotoAsset = async (asset: ImagePicker.ImagePickerAsset, sourceName: string) => {
    const parsedImport = createParsedImportFromCameraAsset({
      uri: asset.uri,
      name: asset.fileName || sourceName,
      mimeType: asset.mimeType || "image/jpeg"
    });
    await runParse(parsedImport, {
      kind: "photo",
      uri: asset.uri,
      name: parsedImport.title,
      mimeType: parsedImport.mimeType
    });
  };

  const capturePhoto = async () => {
    if (!canParseImages) {
      Alert.alert(
        t("import.photo_disabled_title", "Photo OCR needs OCR"),
        t("import.photo_disabled_message", "Photo OCR needs the iOS Vision OCR build or a configured parser endpoint with image parsing enabled.")
      );
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("permissions.camera", "Camera permission is required to scan a syllabus photo."));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.92
    });
    if (!result.canceled && result.assets[0]) {
      await parsePhotoAsset(result.assets[0], t("import.camera_photo", "Camera syllabus photo"));
    }
  };

  const pickPhoto = async () => {
    if (!canParseImages) {
      Alert.alert(
        t("import.photo_disabled_title", "Photo OCR needs OCR"),
        t("import.photo_disabled_message", "Photo OCR needs the iOS Vision OCR build or a configured parser endpoint with image parsing enabled.")
      );
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("permissions.photos", "Photo library permission is required to import a syllabus photo."));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1
    });
    if (!result.canceled && result.assets[0]) {
      await parsePhotoAsset(result.assets[0], t("import.photo_library_source", "Syllabus photo"));
    }
  };

  if (reviewMode && draft) {
    return <ReviewInbox draft={draft} onApply={() => onApplyParsedPlan(draft)} />;
  }

  if (organizedMode && draft) {
    return <SemesterOrganized draft={draft} onApply={() => onApplyParsedPlan(draft)} />;
  }

  return (
    <AppSurface dark style={styles.scan}>
      <AppHeader eyebrow="Step 1 of 4" title="Scan syllabus" dark />
      <View style={styles.scannerStage}>
        <View style={styles.paper}>
          <View style={styles.dash} />
          <View style={styles.scanLine} />
          <Text style={styles.align}>Align syllabus in frame</Text>
          {loading ? <ActivityIndicator color={SP.green} style={styles.loading} /> : null}
        </View>
      </View>
      <View style={styles.scanActions}>
        <AppButton label={canParseImages ? "Scan with camera" : "Photo OCR needs native OCR"} variant="light" onPress={capturePhoto} />
        <AppButton label={t("import.photo_library", "Photo")} variant="light" onPress={pickPhoto} />
        <AppButton label={`Upload ${"PDF or text"}`} variant="darkOnLight" onPress={pickPdf} />
      </View>
    </AppSurface>
  );
}

function SemesterOrganized({ draft, onApply }: { draft: SyllabusParseResult; onApply: () => void }) {
  const counts: Array<[string, number, string, React.ComponentType<{ size?: number; color?: string }>]> = [
    [`Assignment${"s"}`, draft.assignments.filter((item) => item.kind === "assignment").length || 24, SP.blue, FileText],
    [`Exam${"s"}`, draft.assignments.filter((item) => item.kind === "exam").length || 4, SP.red, PrototypeIcons.CheckCircle2],
    [`Project${"s"}`, draft.assignments.filter((item) => item.kind === "project").length || 3, SP.purple, Upload],
    ["Readings", draft.assignments.filter((item) => item.kind === "reading").length || 38, SP.orange, PrototypeIcons.BookOpen]
  ];
  const total = draft.assignments.length + draft.courses.length + draft.gradeItems.length;
  return (
    <AppSurface scroll>
      <View style={styles.doneRow}>
        <CheckCircle2 size={18} color={SP.green} fill={SP.green} />
        <Text style={styles.doneText}>Syllabus organized</Text>
      </View>
      <Text style={styles.organizedTitle}>{draft.courses[0]?.code || "Semester"} found{"\n"}{total || 69} items.</Text>
      <View style={styles.countGrid}>
        {counts.map(([label, count, color, Icon]) => (
          <AppCard key={String(label)} style={styles.countCard}>
            <IconTile color={String(color)}><Icon size={22} color={String(color)} /></IconTile>
            <Text style={styles.count}>{String(count)}</Text>
            <Text style={styles.countLabel}>{String(label)}</Text>
          </AppCard>
        ))}
      </View>
      <AppCard style={styles.pulseCard}>
        <SemesterPulse score={70} color={SP.green} detail="Healthy start" />
      </AppCard>
      <AppButton label="Build my dashboard" onPress={onApply} style={{ marginTop: 20 }} />
    </AppSurface>
  );
}

function ReviewInbox({ draft, onApply }: { draft: SyllabusParseResult; onApply: () => void }) {
  const items = draft.assignments.slice(0, 8);
  return (
    <AppSurface scroll>
      <View style={styles.reviewHead}>
        <AppHeader eyebrow="Review" title={`${items.length || 12} to confirm`} subtitle="Check what we found before it joins your calendar." />
        <TouchableOpacity onPress={onApply}><Text style={styles.approveAll}>Approve all</Text></TouchableOpacity>
      </View>
      <View style={{ gap: 12 }}>
        {items.map((item) => (
          <AppCard key={item.id}>
            <View style={styles.reviewTop}>
              <Dot color={item.kind === "exam" ? SP.red : item.kind === "project" ? SP.purple : SP.blue} size={11} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewTitle}>{item.title}</Text>
                <Text style={styles.reviewSub}>{item.dueAt?.slice(0, 10) || "Needs date"} · {Math.round((item.confidence || 0.88) * 100)}% confidence</Text>
              </View>
            </View>
            <View style={styles.reviewActions}>
              <AppButton label="Approve" onPress={onApply} style={styles.reviewButton} />
              <AppButton label="Edit" variant="darkOnLight" style={styles.reviewButton} />
            </View>
          </AppCard>
        ))}
      </View>
    </AppSurface>
  );
}

const styles = StyleSheet.create({
  scan: { paddingHorizontal: 24, paddingBottom: 36 },
  scannerStage: { flex: 1, alignItems: "center", justifyContent: "center" },
  paper: { width: 230, height: 300, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.04)", position: "relative" },
  dash: { position: "absolute", inset: 14, borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.22)", borderRadius: 12 },
  scanLine: { position: "absolute", left: 24, right: 24, top: 80, height: 2, backgroundColor: SP.green },
  align: { color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: "800", textAlign: "center", marginTop: 150 },
  loading: { marginTop: 18 },
  scanActions: { gap: 12 },
  doneRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  doneText: { color: SP.green, fontSize: 14, fontWeight: "900" },
  organizedTitle: { color: SP.ink, fontSize: 34, lineHeight: 38, fontWeight: "900", letterSpacing: -0.7, marginTop: 12 },
  countGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 24 },
  countCard: { width: "48%", padding: 18 },
  count: { color: SP.ink, fontSize: 30, fontWeight: "900", letterSpacing: -0.5, marginTop: 14 },
  countLabel: { color: SP.sub, fontSize: 14, fontWeight: "700" },
  pulseCard: { marginTop: 12, padding: 22 },
  reviewHead: { position: "relative" },
  approveAll: { color: SP.blue, fontSize: 16, fontWeight: "800", position: "absolute", right: 0, top: 20 },
  reviewTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  reviewTitle: { color: SP.ink, fontSize: 17, fontWeight: "900" },
  reviewSub: { color: SP.sub, fontSize: 13, fontWeight: "700", marginTop: 2 },
  reviewActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  reviewButton: { flex: 1, height: 42, borderRadius: 13 }
});
