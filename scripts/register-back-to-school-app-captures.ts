import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, extname, join, resolve } from "node:path";

type AppCaptureRow = {
  id: string;
  state: string;
  theme: string;
  requiredProof: string;
};

type NativeCaptureEntry = {
  captureId: string;
  filename?: string;
  path?: string;
  status?: string;
  device?: string;
  buildNumber?: string;
  appearance?: string;
  locale?: string;
  accessibilitySettings?: string;
  sourceStateFixture?: string;
  reviewerNotes?: string;
  requiredProof?: string;
  bytes?: number;
  sha256?: string;
  generatedAt?: string;
};

type NativeCaptureManifest = {
  generatedAt?: string;
  release?: string;
  outputRoot?: string;
  entries?: NativeCaptureEntry[];
  nativeWidgetPlacement?: {
    status?: string;
    captured?: number;
    total?: number;
    auditPath?: string;
    note?: string;
  };
};

type NativeCaptureRun = {
  status?: string;
  targetCount?: number;
  targets?: { captureId?: string; filename?: string; requiredProof?: string }[];
  nativeWidgetPlacement?: NativeCaptureManifest["nativeWidgetPlacement"];
  [key: string]: unknown;
};

type Candidate = {
  captureId: string;
  sourcePath: string | null;
  outputPath: string | null;
  status: "found" | "missing" | "invalid";
  reason?: string;
  bytes?: number;
  width?: number;
  height?: number;
  sha256?: string;
};

const RUNBOOK_PATH = "docs/launch/back-to-school-2026/native-screenshot-qa-runbook.md";
const NATIVE_MANIFEST_PATH = "qa-screenshots/back-to-school-2026-native/manifest.json";
const NATIVE_CAPTURE_RUN_PATH = "qa/back-to-school-2026/native-capture-run.json";
const OUTPUT_PATH = "qa/back-to-school-2026/app-capture-ingest.json";
const OUTPUT_ROOT = "qa-screenshots/back-to-school-2026-native";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const strict = args.includes("--strict");
const sourceRoot = valueArg("--source") || process.env.STUDYPLANNER_APP_CAPTURE_SOURCE || OUTPUT_ROOT;

function valueArg(name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] || "" : "";
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, payload: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}

function sha256File(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function parseRunbookTable(markdown: string, heading: string): AppCaptureRow[] {
  const start = markdown.indexOf(heading);
  if (start < 0) return [];
  const rest = markdown.slice(start + heading.length);
  const end = rest.search(/\n## /);
  const section = end >= 0 ? rest.slice(0, end) : rest;
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("| ") && !line.includes("---") && !line.startsWith("| ID "))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 4 && cells[0].startsWith("app-"))
    .map((cells) => ({
      id: cells[0],
      state: cells[1],
      theme: cells[2],
      requiredProof: cells[3],
    }));
}

function walkFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const child = join(root, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(child));
    else files.push(child);
  }
  return files;
}

function imageDimensions(path: string) {
  const buffer = readFileSync(path);
  const isPng = buffer.length > 24 && buffer.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (isPng) {
    return {
      encoding: "png",
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }
  const isJpeg = buffer.length > 10 && buffer[0] === 0xff && buffer[1] === 0xd8;
  if (isJpeg) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isStartOfFrame) {
        return {
          encoding: "jpg",
          width: buffer.readUInt16BE(offset + 7),
          height: buffer.readUInt16BE(offset + 5),
        };
      }
      offset += 2 + length;
    }
  }
  return {
    encoding: "unknown",
    width: 0,
    height: 0,
  };
}

function findCandidate(row: AppCaptureRow, files: string[]) {
  const allowedExtensions = new Set([".png", ".jpg", ".jpeg"]);
  return files.find((file) => {
    const extension = extname(file).toLowerCase();
    if (!allowedExtensions.has(extension)) return false;
    return file.toLowerCase().includes(row.id.toLowerCase());
  }) || null;
}

function outputPathFor(row: AppCaptureRow, sourcePath: string) {
  const extension = extname(sourcePath).toLowerCase() === ".jpeg" ? ".jpg" : extname(sourcePath).toLowerCase();
  return join(OUTPUT_ROOT, `${row.id}${extension || ".png"}`);
}

function validateCandidate(row: AppCaptureRow, sourcePath: string | null): Candidate {
  if (!sourcePath) {
    return {
      captureId: row.id,
      sourcePath: null,
      outputPath: null,
      status: "missing",
      reason: "No source image found. Name the screenshot with the capture ID, for example app-07-semester-ready.png.",
    };
  }
  const stat = statSync(sourcePath);
  const dimensions = imageDimensions(sourcePath);
  const outputPath = outputPathFor(row, sourcePath);
  if (stat.size <= 5000) {
    return {
      captureId: row.id,
      sourcePath,
      outputPath,
      status: "invalid",
      reason: "Image is too small to be a usable native app screenshot.",
      bytes: stat.size,
      width: dimensions.width,
      height: dimensions.height,
    };
  }
  if (dimensions.width <= 0 || dimensions.height <= 0) {
    return {
      captureId: row.id,
      sourcePath,
      outputPath,
      status: "invalid",
      reason: "Image must be a PNG or JPEG with readable dimensions.",
      bytes: stat.size,
      width: dimensions.width,
      height: dimensions.height,
    };
  }
  if (dimensions.width < 300 || dimensions.height < 600) {
    return {
      captureId: row.id,
      sourcePath,
      outputPath,
      status: "invalid",
      reason: "Native app screenshots should be portrait iPhone captures, not thumbnails.",
      bytes: stat.size,
      width: dimensions.width,
      height: dimensions.height,
    };
  }
  return {
    captureId: row.id,
    sourcePath,
    outputPath,
    status: "found",
    bytes: stat.size,
    width: dimensions.width,
    height: dimensions.height,
    sha256: sha256File(sourcePath),
  };
}

function mergeManifest(rows: AppCaptureRow[], candidates: Candidate[]) {
  const now = new Date().toISOString();
  const existing = readJson<NativeCaptureManifest>(NATIVE_MANIFEST_PATH, {
    release: "Back to School with AI",
    outputRoot: OUTPUT_ROOT,
    entries: [],
  });
  const nonAppEntries = (existing.entries || []).filter((entry) => !entry.captureId?.startsWith("app-"));
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const appEntries: NativeCaptureEntry[] = candidates
    .filter((candidate) => candidate.status === "found" && candidate.outputPath)
    .map((candidate) => {
      const row = rowById.get(candidate.captureId);
      return {
        captureId: candidate.captureId,
        filename: candidate.outputPath ? candidate.outputPath.replace(`${OUTPUT_ROOT}/`, "") : undefined,
        path: candidate.outputPath || undefined,
        status: "captured",
        device: "native-release-or-testflight-app",
        buildNumber: "release-or-testflight",
        appearance: "light",
        locale: "en-US",
        accessibilitySettings: "default",
        sourceStateFixture: row?.state,
        reviewerNotes: `Registered from real native app screenshot. Theme proof: ${row?.theme || "unspecified"}.`,
        requiredProof: row?.requiredProof,
        bytes: candidate.outputPath ? statSync(candidate.outputPath).size : candidate.bytes,
        sha256: candidate.outputPath ? sha256File(candidate.outputPath) : candidate.sha256,
        generatedAt: now,
      };
    });
  const captured = appEntries.length;
  const status = captured === rows.length ? "captured" : captured > 0 ? "partial" : "manual_native_capture_required";
  const manifest: NativeCaptureManifest = {
    ...existing,
    generatedAt: now,
    release: "Back to School with AI",
    outputRoot: OUTPUT_ROOT,
    entries: [...nonAppEntries, ...appEntries],
    nativeWidgetPlacement: existing.nativeWidgetPlacement || {
      status: "manual_native_capture_required",
      note: "Home Screen and Lock Screen WidgetKit placements are captured separately from app screenshots.",
    },
  };
  writeJson(NATIVE_MANIFEST_PATH, manifest);

  const nativeCaptureRun = readJson<NativeCaptureRun>(NATIVE_CAPTURE_RUN_PATH, {});
  writeJson(NATIVE_CAPTURE_RUN_PATH, {
    ...nativeCaptureRun,
    generatedAt: now,
    release: "Back to School with AI",
    status,
    targetCount: rows.length,
    outputRoot: OUTPUT_ROOT,
    manifest: NATIVE_MANIFEST_PATH,
    screenshotCount: captured,
    targets: rows.map((row) => ({
      captureId: row.id,
      filename: `${row.id}.png`,
      requiredProof: row.requiredProof,
    })),
    nativeWidgetPlacement: manifest.nativeWidgetPlacement,
  });
}

function main() {
  const runbook = existsSync(RUNBOOK_PATH) ? readFileSync(RUNBOOK_PATH, "utf8") : "";
  const rows = parseRunbookTable(runbook, "## App Capture Matrix");
  const files = walkFiles(sourceRoot);
  const candidates = rows.map((row) => validateCandidate(row, findCandidate(row, files)));
  const found = candidates.filter((candidate) => candidate.status === "found");
  const invalid = candidates.filter((candidate) => candidate.status === "invalid");
  const missing = candidates.filter((candidate) => candidate.status === "missing");
  const status =
    rows.length === 0
      ? "runbook_missing"
      : found.length === rows.length && invalid.length === 0
        ? apply ? "captured" : "ready_to_apply"
        : found.length > 0
          ? apply ? "partial" : "partial_ready"
          : "waiting_for_captures";

  if (apply && found.length > 0) {
    mkdirSync(OUTPUT_ROOT, { recursive: true });
    for (const candidate of found) {
      if (!candidate.sourcePath || !candidate.outputPath) continue;
      if (resolve(candidate.sourcePath) !== resolve(candidate.outputPath)) {
        copyFileSync(candidate.sourcePath, candidate.outputPath);
      }
    }
    mergeManifest(rows, candidates);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    release: "Back to School with AI",
    status,
    applyRequested: apply,
    strictRequested: strict,
    sourceRoot,
    outputRoot: OUTPUT_ROOT,
    nativeManifest: NATIVE_MANIFEST_PATH,
    nativeCaptureRun: NATIVE_CAPTURE_RUN_PATH,
    requiredCount: rows.length,
    foundCount: found.length,
    invalidCount: invalid.length,
    missingCount: missing.length,
    candidates,
    rules: [
      "Only real native release, development-build, or TestFlight app screenshots should be registered.",
      "Do not register Expo web smoke screenshots, marketing composites, or WidgetKit Home Screen placements here.",
      "Name source files with the capture ID from the native runbook, such as app-07-semester-ready.png.",
      "Use --apply only after reviewing the source images.",
    ],
    commands: {
      plan: "npm run plan:back-to-school-app-captures",
      applyFromDefaultFolder: "npm run register:back-to-school-app-captures",
      applyFromCustomFolder: "npm run register:back-to-school-app-captures -- --source /path/to/native/app/screenshots",
      refreshAssets: "npm run finalize:back-to-school-assets",
      refreshUploadPackage: "npm run check:back-to-school-upload-package",
      refreshSubmissionGate: "npm run check:back-to-school-submission",
    },
  };
  writeJson(OUTPUT_PATH, payload);

  if (strict && (rows.length === 0 || found.length !== rows.length || invalid.length > 0)) {
    console.error("Back-to-School native app capture registration incomplete:");
    for (const candidate of [...invalid, ...missing]) {
      console.error(`- ${candidate.captureId}: ${candidate.reason}`);
    }
    process.exit(1);
  }

  console.log(
    `Back-to-School native app capture registration ${status}. ` +
      `${found.length}/${rows.length} captures found. Wrote ${OUTPUT_PATH}.`,
  );
}

main();
