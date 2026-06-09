import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { extractPdfTextFromBase64, PdfTextExtraction } from "./pdfText";

export type PdfImportResult = PdfTextExtraction & {
  fileName: string;
};

export const MAX_PDF_IMPORT_BYTES = 18 * 1024 * 1024;

export async function pickAndExtractPdf(): Promise<PdfImportResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const file = new File(asset.uri);
  const fileSize = asset.size ?? file.size ?? file.info().size ?? 0;
  if (fileSize > MAX_PDF_IMPORT_BYTES) {
    throw new Error("That PDF is too large to import on device. Try a smaller syllabus PDF, paste the text, or scan the key pages.");
  }
  const base64 = await file.base64();
  return {
    ...extractPdfTextFromBase64(base64),
    fileName: asset.name || "Syllabus PDF",
  };
}
