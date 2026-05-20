import TextRecognition from "@react-native-ml-kit/text-recognition";

export async function extractTextFromImage(uri: string) {
  try {
    const result = await TextRecognition.recognize(uri);
    const text = normalizeRecognizedText(result.text);

    if (text.length >= 12) {
      return text;
    }

    throw new Error("No readable text found in the photo.");
  } catch (error) {
    throw new Error(imageTextErrorMessage(error));
  }
}

function normalizeRecognizedText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function imageTextErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (/linked|rebuilt|pod install|native module/i.test(message)) {
    return "Photo text recognition is not available in this build. Install the latest TestFlight build and try again.";
  }

  if (/No readable text/i.test(message)) {
    return "No readable text was found in the photo. Use bright light, fill the frame with the syllabus page, and try again.";
  }

  return "The photo could not be read clearly. Use bright light, keep the page flat, and try again.";
}
