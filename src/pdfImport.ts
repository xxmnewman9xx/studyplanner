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
  if (!asset?.uri) {
    throw new Error("That PDF could not be opened. Try picking it again, paste the text, or scan the pages.");
  }
  const fileName = asset.name || "Syllabus PDF";
  const mimeType = asset.mimeType?.toLowerCase() || "";
  const looksLikePdf = mimeType.includes("pdf") || /\.pdf$/i.test(fileName);
  if (!looksLikePdf) {
    throw new Error("Choose a PDF syllabus file, paste text, or scan the pages with the camera.");
  }
  const file = new File(asset.uri);
  const fileInfo = file.info();
  if (!fileInfo.exists) {
    throw new Error("That PDF was not copied to this device. Try again, paste the text, or scan the pages.");
  }
  const fileSize = asset.size ?? file.size ?? fileInfo.size ?? 0;
  if (fileSize <= 0) {
    throw new Error("That PDF looks empty. Paste syllabus text or scan the key pages instead.");
  }
  if (fileSize > MAX_PDF_IMPORT_BYTES) {
    throw new Error("That PDF is too large to import on device. Try a smaller syllabus PDF, paste the text, or scan the key pages.");
  }
  let base64 = "";
  try {
    base64 = await file.base64();
  } catch {
    throw new Error("This device could not read that PDF file. Paste text or scan the PDF pages with the camera.");
  }
  return {
    ...extractPdfTextFromBase64(base64),
    fileName,
  };
}
