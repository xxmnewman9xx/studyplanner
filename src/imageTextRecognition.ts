import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import { countOcrWords, normalizeExtractedOcrText } from "./ocrText";

type StudyPlannerVisionOcrModule = {
  recognizeText(uri: string): Promise<string>;
};

const visionOcr = requireOptionalNativeModule<StudyPlannerVisionOcrModule>("StudyPlannerVisionOcr");

export function hasNativeImageTextRecognition() {
  return Platform.OS === "ios" && Boolean(visionOcr?.recognizeText);
}

export async function extractTextFromImage(uri: string): Promise<string> {
  if (!hasNativeImageTextRecognition()) {
    throw new Error("Install the iOS build with on-device text recognition, or paste the syllabus text.");
  }

  const text = await visionOcr!.recognizeText(uri);
  const normalized = normalizeExtractedOcrText(text);

  if (!normalized) {
    throw new Error("No readable school material text was found in that photo.");
  }
  const wordCount = countOcrWords(normalized);
  if (wordCount < 8) {
    throw new Error("That photo did not contain enough readable school text. Retake it closer, scan another page, or paste the text.");
  }
  return normalized;
}
