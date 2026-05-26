export async function extractTextFromImage(_uri: string): Promise<string> {
  throw new Error(
    "Image OCR is not configured in this build. Paste syllabus text or upload a text-based PDF."
  );
}
