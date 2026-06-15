import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import { normalizeExtractedOcrText } from "../ocrText";

type StudyPlannerVisionOcrModule = {
  recognizeText(uri: string): Promise<string>;
};

const visionOcr = requireOptionalNativeModule<StudyPlannerVisionOcrModule>("StudyPlannerVisionOcr");

export function hasNativeImageTextRecognition() {
  return Platform.OS === "ios" && Boolean(visionOcr?.recognizeText);
}

export async function extractTextFromImage(uri: string): Promise<string> {
  if (!hasNativeImageTextRecognition()) {
    throw new Error(
      "Image OCR requires the iOS native Vision OCR build or a configured parser endpoint with image parsing enabled."
    );
  }

  const text = await visionOcr!.recognizeText(uri);
  const normalized = normalizeExtractedOcrText(text);

  if (!normalized) {
    throw new Error("No readable school material text was found in that photo.");
  }
  return normalized;
}
