import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { extractPdfTextFromBase64, PdfTextExtraction } from "./pdfText";

export type PdfImportResult = PdfTextExtraction & {
  fileName: string;
};

export async function pickAndExtractPdf(): Promise<PdfImportResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
  return {
    ...extractPdfTextFromBase64(base64),
    fileName: asset.name || "Syllabus PDF",
  };
}

