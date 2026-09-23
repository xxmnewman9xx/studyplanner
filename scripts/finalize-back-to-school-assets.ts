import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type AssetStatus = "planned" | "copy_ready" | "optional_planned" | "ready";

type ScreenshotAsset = {
  id: string;
  headline: string;
  captureId: string;
  alternateCaptureIds?: string[];
  status: AssetStatus;
  sourceType: "native_capture_required" | "native_widget_capture_required" | string;
  file: string | null;
  purpose: string;
};

type AssetManifest = {
  release: string;
  appStoreScreenshots: ScreenshotAsset[];
};

type NativeCaptureEntry = {
  captureId: string;
  filename?: string;
  path?: string;
  status?: string;
  source?: string;
  device?: string;
  reviewerNotes?: string;
  bytes?: number;
  sha256?: string;
};

type NativeCaptureManifest = {
  release?: string;
  entries?: NativeCaptureEntry[];
};

type NativeCaptureRun = {
  targetCount?: number;
  targets?: { captureId?: string; filename?: string }[];
  status?: string;
};

const ASSET_MANIFEST_PATH = "docs/launch/back-to-school-2026/app-store-asset-manifest.json";
const NATIVE_MANIFEST_PATH = "qa-screenshots/back-to-school-2026-native/manifest.json";
const NATIVE_CAPTURE_RUN_PATH = "qa/back-to-school-2026/native-capture-run.json";
const OUTPUT_PATH = "qa/back-to-school-2026/asset-finalization-plan.json";
const NATIVE_CAPTURE_ROOT = "qa-screenshots/back-to-school-2026-native/";
const FORBIDDEN_WEB_SMOKE_ROOT = "qa-screenshots/back-to-school-2026-implementation/";

const apply = process.argv.includes("--apply");
const strict = process.argv.includes("--strict");
const failures: string[] = [];

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function expect(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function entryPath(entry: NativeCaptureEntry) {
  return entry.path || (entry.filename ? `${NATIVE_CAPTURE_ROOT}${entry.filename}` : "");
}

function hasUsableImageFile(entry: NativeCaptureEntry | undefined) {
  if (!entry) return false;
  const path = entryPath(entry);
  if (!path) return false;
  if (!path.startsWith(NATIVE_CAPTURE_ROOT)) return false;
  if (path.includes(FORBIDDEN_WEB_SMOKE_ROOT)) return false;
  if (!existsSync(path)) return false;
  return statSync(path).size > 5000;
}

function isUsableAppEntry(entry: NativeCaptureEntry | undefined) {
  if (!hasUsableImageFile(entry)) return false;
  if (!entry?.captureId?.startsWith("app-")) return false;
  if (entry.status !== "captured") return false;
  return (
    entry.device === "native-release-or-testflight-app" ||
    entry.source === "remote-eas-simulator" ||
    entry.device === "eas-simulator"
  );
}

function isUsableWidgetEntry(entry: NativeCaptureEntry | undefined) {
  if (!hasUsableImageFile(entry)) return false;
  if (!entry?.captureId?.startsWith("widget-")) return false;
  if (entry.status !== "captured") return false;
  return entry.device === "native-widgetkit-placement" && String(entry.reviewerNotes || "").includes("WidgetKit");
}

function isUsableEntryForAsset(asset: ScreenshotAsset, entry: NativeCaptureEntry | undefined) {
  if (asset.sourceType === "native_widget_capture_required") return isUsableWidgetEntry(entry);
  if (asset.sourceType === "native_capture_required") return isUsableAppEntry(entry);
  return false;
}

function candidateCaptureIds(asset: ScreenshotAsset) {
  return [asset.captureId, ...(asset.alternateCaptureIds || [])];
}

const assetManifest = readJson<AssetManifest>(ASSET_MANIFEST_PATH, {
  release: "",
  appStoreScreenshots: [],
});
const nativeManifestExists = existsSync(NATIVE_MANIFEST_PATH);
const nativeManifest = readJson<NativeCaptureManifest>(NATIVE_MANIFEST_PATH, {
  entries: [],
});
const nativeCaptureRun = readJson<NativeCaptureRun>(NATIVE_CAPTURE_RUN_PATH, {
  targets: [],
});

expect(assetManifest.release === "Back to School with AI", "asset manifest release must be Back to School with AI");
expect(assetManifest.appStoreScreenshots.length === 9, "asset manifest must contain nine App Store screenshot frames");

const nativeEntries = new Map<string, NativeCaptureEntry>();
for (const entry of nativeManifest.entries || []) {
  if (entry.captureId) nativeEntries.set(entry.captureId, entry);
}

const plannedCaptureIds = new Set((nativeCaptureRun.targets || []).map((target) => target.captureId).filter(Boolean));
const screenshotReadiness = assetManifest.appStoreScreenshots.map((asset) => {
  const candidates = candidateCaptureIds(asset);
  const matchingEntry = candidates.map((captureId) => nativeEntries.get(captureId)).find((entry) => isUsableEntryForAsset(asset, entry));
  const planned = candidates.some((captureId) => plannedCaptureIds.has(captureId));
  const path = matchingEntry ? entryPath(matchingEntry) : null;
  const missingReason = path
    ? null
    : asset.sourceType === "native_widget_capture_required"
      ? "real_widgetkit_capture_missing"
      : nativeManifestExists
        ? "native_capture_missing"
        : "native_manifest_missing";
  return {
    id: asset.id,
    captureId: asset.captureId,
    alternateCaptureIds: asset.alternateCaptureIds || [],
    sourceType: asset.sourceType,
    planned,
    fulfilled: Boolean(path),
    file: path,
    missingReason,
  };
});

const fulfilledScreenshots = screenshotReadiness.filter((asset) => asset.fulfilled).length;
const missingScreenshots = screenshotReadiness.filter((asset) => !asset.fulfilled);
const canApply = nativeManifestExists && missingScreenshots.length === 0;
const status = canApply
  ? apply ? "applied" : "ready_to_apply"
  : nativeManifestExists ? "blocked_missing_native_captures" : "blocked_missing_native_manifest";
const missingAppScreenshots = missingScreenshots.filter((asset) => asset.sourceType === "native_capture_required");
const missingWidgetScreenshots = missingScreenshots.filter((asset) => asset.sourceType === "native_widget_capture_required");
const blockers = canApply
  ? []
  : [
      ...(nativeManifestExists ? [] : [`Native capture manifest missing: ${NATIVE_MANIFEST_PATH}.`]),
      ...(missingAppScreenshots.length
        ? [`Missing ${missingAppScreenshots.length} app screenshot capture(s): ${missingAppScreenshots.map((asset) => asset.captureId).join(", ")}.`]
        : []),
      ...(missingWidgetScreenshots.length
        ? [
            `Missing ${missingWidgetScreenshots.length} real WidgetKit screenshot capture(s): ${missingWidgetScreenshots
              .map((asset) => [asset.captureId, ...asset.alternateCaptureIds].join("/"))
              .join(", ")}.`,
          ]
        : []),
      "Run npm run capture:back-to-school-native or register approved native/TestFlight/EAS app captures, then register real WidgetKit captures before applying final assets.",
    ];

if (apply && !canApply) {
  failures.push("Cannot apply asset manifest updates until every App Store screenshot has a usable native capture.");
}

if (apply && canApply) {
  const updated: AssetManifest = {
    ...assetManifest,
    appStoreScreenshots: assetManifest.appStoreScreenshots.map((asset) => {
      const readiness = screenshotReadiness.find((item) => item.id === asset.id);
      return readiness?.file
        ? {
            ...asset,
            status: "ready" as const,
            file: readiness.file,
          }
        : asset;
    }),
  };
  writeFileSync(ASSET_MANIFEST_PATH, `${JSON.stringify(updated, null, 2)}\n`);
}

const payload = {
  generatedAt: new Date().toISOString(),
  release: "Back to School with AI",
  status,
  blockers,
  applyRequested: apply,
  nativeManifest: {
    path: NATIVE_MANIFEST_PATH,
    exists: nativeManifestExists,
    capturedEntries: nativeEntries.size,
  },
  nativeCaptureRun: {
    path: NATIVE_CAPTURE_RUN_PATH,
    status: nativeCaptureRun.status || "unknown",
    plannedTargets: nativeCaptureRun.targetCount || (nativeCaptureRun.targets || []).length,
  },
  appStoreScreenshots: {
    total: assetManifest.appStoreScreenshots.length,
    fulfilled: fulfilledScreenshots,
    missing: missingScreenshots.length,
    items: screenshotReadiness,
  },
  rules: [
    "Only files under qa-screenshots/back-to-school-2026-native/ can finalize App Store screenshots.",
    "Web smoke screenshots are never accepted as final App Store creative.",
    "Native app screenshot slots require captured app-* entries from a native release/TestFlight app or guarded remote EAS simulator capture.",
    "Native WidgetKit screenshot slots require captured widget-* entries from real WidgetKit Home Screen or Lock Screen placement.",
    "In-app widget previews, remote app-route captures, Expo Go screenshots, and composites cannot satisfy WidgetKit slots.",
    "Use --apply only after all nine App Store screenshots have native capture proof.",
  ],
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

if (strict && !canApply) {
  failures.push("Strict asset finalization requested, but not all native captures are available.");
}

if (failures.length) {
  console.error("Back-to-School asset finalization failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Back-to-School asset finalization ${status}. Wrote ${OUTPUT_PATH}.`);
