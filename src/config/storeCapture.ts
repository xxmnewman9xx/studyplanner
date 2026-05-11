declare const process:
  | {
      env: Record<string, string | undefined>;
    }
  | undefined;

export function isStoreCaptureEnabled() {
  return readEnv("EXPO_PUBLIC_STORE_CAPTURE") === "1";
}

function readEnv(name: "EXPO_PUBLIC_STORE_CAPTURE") {
  if (typeof process === "undefined") return undefined;
  if (name === "EXPO_PUBLIC_STORE_CAPTURE") {
    return process.env.EXPO_PUBLIC_STORE_CAPTURE;
  }
  return undefined;
}
