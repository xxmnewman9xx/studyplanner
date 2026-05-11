declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

export function isStoreCaptureEnabled() {
  return readEnv("EXPO_PUBLIC_STORE_CAPTURE") === "1";
}

function readEnv(name: string) {
  return typeof process !== "undefined" ? process.env?.[name] : undefined;
}
