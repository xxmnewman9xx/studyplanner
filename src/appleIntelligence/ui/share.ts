// Share helpers for the growth surfaces. Every path degrades gracefully:
// image share sheet -> text share sheet -> no-op, and nothing throws.
import type { RefObject } from "react";
import { Platform, Share, type View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { SHARE_CARD } from "./tokens";

export type ShareMethod = "image" | "text" | "none";

export type ShareOutcome = {
  method: ShareMethod;
  /** False when the sheet was dismissed or nothing could be shared. */
  completed: boolean;
  error?: string;
};

export type ShareForecastOptions = {
  /** Text used by the fallback text share (and as the share sheet title on Android). */
  message: string;
  /** App Store link with the `ct=forecast` campaign token; appended to the text fallback. */
  url?: string;
  dialogTitle?: string;
  /** Output scale relative to the 360x640 canvas. Default 3 => 1080x1920. */
  pixelRatio?: number;
};

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/** Renders the mounted ForecastShareCard to a PNG file. Returns null when capture is unavailable. */
export async function captureShareCard(ref: RefObject<View | null>, pixelRatio: number = SHARE_CARD.pixelRatio): Promise<string | null> {
  if (Platform.OS === "web" || !ref.current) return null;
  try {
    return await captureRef(ref, {
      format: "png",
      quality: 1,
      result: "tmpfile",
      width: SHARE_CARD.width * pixelRatio,
      height: SHARE_CARD.height * pixelRatio,
    });
  } catch {
    return null;
  }
}

/**
 * Captures the ForecastShareCard behind `ref` and opens the share sheet with the
 * PNG. Falls back to a text + link share when capture or expo-sharing is not
 * available (web, some Android builds).
 */
export async function shareForecastCard(ref: RefObject<View | null>, options: ShareForecastOptions): Promise<ShareOutcome> {
  const uri = await captureShareCard(ref, options.pixelRatio);
  if (uri) {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: options.dialogTitle });
        return { method: "image", completed: true };
      }
    } catch (error) {
      const fallback = await shareLink(options.message, options.url);
      return { ...fallback, error: errorText(error) };
    }
  }
  return shareLink(options.message, options.url);
}

/** Text/link share through the system sheet. iOS gets `url` as a rich link; other platforms get it appended. */
export async function shareLink(message: string, url?: string): Promise<ShareOutcome> {
  try {
    const content = Platform.OS === "ios" && url ? { message, url } : { message: url ? `${message}\n${url}` : message };
    const result = await Share.share(content);
    return { method: "text", completed: result.action === Share.sharedAction };
  } catch (error) {
    return { method: "none", completed: false, error: errorText(error) };
  }
}

/** Copies text with expo-clipboard. Resolves false instead of throwing. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    return await Clipboard.setStringAsync(text);
  } catch {
    return false;
  }
}
