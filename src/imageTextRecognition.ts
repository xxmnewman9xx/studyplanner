import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

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
  const normalized = text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) {
    throw new Error("No readable school material text was found in that photo.");
  }
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  if (wordCount < 8) {
    throw new Error("That photo did not contain enough readable school text. Retake it closer, scan another page, or paste the text.");
  }
  return normalized;
}
