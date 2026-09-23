import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";

type MarketingAsset = {
  id: string;
  copy?: string;
  title?: string;
  sourceType?: string;
};

type AssetManifest = {
  release: string;
  promotionalArtwork: MarketingAsset[];
  socialAssets: MarketingAsset[];
};

type Candidate = {
  assetId: string;
  sourcePath: string;
  packagePath: string;
  relativePath: string;
  bytes: number;
  sha256: string;
  width: number | null;
  height: number | null;
  purpose: string;
};

const ASSET_MANIFEST_PATH = "docs/launch/back-to-school-2026/app-store-asset-manifest.json";
const RELEASE_COPY_PATH = "docs/launch/back-to-school-2026/release-notes-and-launch-copy.md";
const OUTPUT_DIR = "docs/launch/back-to-school-2026/marketing-asset-package";
const OUTPUT_README_PATH = `${OUTPUT_DIR}/README.md`;
const OUTPUT_MANIFEST_PATH = "qa/back-to-school-2026/marketing-asset-package-manifest.json";

const candidateSources: Record<string, { purpose: string; paths: string[]; finalNativeRequired: boolean }> = {
  "promo-hero": {
    purpose: "Draft hero/poster reference for Back-to-School positioning.",
    paths: [
      "marketing/social-launch-video/final/studyplanner-scanner-demo-poster-1080x1920.png",
      "marketing/social-launch-video/final/social-frame-00-title.png",
    ],
    finalNativeRequired: true,
  },
  "promo-widget-sheet": {
    purpose: "Draft WidgetKit sheet reference; final art requires real WidgetKit Home Screen and Lock Screen captures.",
    paths: ["docs/launch/back-to-school-2026/native-widgetkit-screenshot-sheet.md"],
    finalNativeRequired: true,
  },
  "social-import": {
    purpose: "Draft import cutdown reference for syllabus-to-plan story.",
    paths: [
      "marketing/social-launch-video/final/social-frame-05-scanner.png",
      "marketing/social-launch-video/final/studyplanner-scanner-demo-social-1080x1920.mp4",
    ],
    finalNativeRequired: true,
  },
  "social-trust": {
    purpose: "Draft review-before-save cutdown reference.",
    paths: ["marketing/social-launch-video/final/social-frame-11-review.png"],
    finalNativeRequired: true,
  },
  "social-widget": {
    purpose: "Draft widget story reference; final social art requires real WidgetKit capture.",
    paths: ["docs/launch/back-to-school-2026/native-widgetkit-screenshot-sheet.md"],
    finalNativeRequired: true,
  },
  "social-focus": {
    purpose: "Draft focus/plan cutdown reference.",
    paths: ["marketing/social-launch-video/build66-final/qa-frame-18-plan.png"],
    finalNativeRequired: true,
  },
};

const failures: string[] = [];

function read(path: string) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function expect(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function sha256(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function markdownCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function tableRow(cells: string[]) {
  return `| ${cells.map(markdownCell).join(" | ")} |`;
}

function pngDimensions(path: string) {
  const buffer = readFileSync(path);
  const isPng = buffer.length > 24 && buffer.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!isPng) return { width: null, height: null };
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function copyCandidate(assetId: string, sourcePath: string, purpose: string): Candidate | null {
  if (!existsSync(sourcePath)) return null;
  const packagePath = `${OUTPUT_DIR}/${assetId}/${basename(sourcePath)}`;
  mkdirSync(dirname(packagePath), { recursive: true });
  cpSync(sourcePath, packagePath);
  const dimensions = sourcePath.endsWith(".png") ? pngDimensions(packagePath) : { width: null, height: null };
  return {
    assetId,
    sourcePath,
    packagePath,
    relativePath: packagePath.slice(`${OUTPUT_DIR}/`.length),
    bytes: statSync(packagePath).size,
    sha256: sha256(packagePath),
    width: dimensions.width,
    height: dimensions.height,
    purpose,
  };
}

function extractSocialCopy(markdown: string) {
  const start = markdown.indexOf("## Social Cutdowns");
  if (start < 0) return [];
  const rest = markdown.slice(start);
  const next = rest.slice("## Social Cutdowns".length).search(/\n## /);
  const section = next >= 0 ? rest.slice(0, next + "## Social Cutdowns".length) : rest;
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^-\s+/, ""));
}

const assetManifest = JSON.parse(read(ASSET_MANIFEST_PATH)) as AssetManifest;
const releaseCopy = read(RELEASE_COPY_PATH);
const socialCopy = extractSocialCopy(releaseCopy);
const requiredItems = [...assetManifest.promotionalArtwork, ...assetManifest.socialAssets];

expect(assetManifest.release === "Back to School with AI", "marketing package must target Back to School with AI");
expect(assetManifest.promotionalArtwork.length === 2, "marketing package must cover two promotional artwork slots");
expect(assetManifest.socialAssets.length === 4, "marketing package must cover four social assets");
expect(socialCopy.length === assetManifest.socialAssets.length, "social package must stay aligned to release-copy cutdowns");

rmSync(OUTPUT_DIR, { recursive: true, force: true });
mkdirSync(OUTPUT_DIR, { recursive: true });
mkdirSync(dirname(OUTPUT_MANIFEST_PATH), { recursive: true });

const items = requiredItems.map((asset) => {
  const source = candidateSources[asset.id];
  const candidates = (source?.paths || [])
    .map((path) => copyCandidate(asset.id, path, source?.purpose || "Draft marketing candidate."))
    .filter((candidate): candidate is Candidate => Boolean(candidate));
  const hasCandidate = candidates.length > 0;
  const finalReady = hasCandidate && source?.finalNativeRequired === false;
  return {
    id: asset.id,
    title: asset.title || null,
    copy: asset.copy || null,
    sourceType: asset.sourceType || "unknown",
    status: finalReady ? "ready" : hasCandidate ? "draft_local_candidate" : "blocked_missing_candidate",
    finalNativeRequired: source?.finalNativeRequired !== false,
    candidates,
    blockers: finalReady
      ? []
      : [
          ...(hasCandidate ? [] : [`No local draft candidate found for ${asset.id}.`]),
          "Replace draft marketing candidates with final native release screenshots, real WidgetKit captures, or approved hosted artwork before launch.",
        ],
  };
});

const copied = items.flatMap((item) => item.candidates);
const draftReady = items.every((item) => item.status !== "blocked_missing_candidate");
const finalReady = items.every((item) => item.status === "ready");
const blockers = items.flatMap((item) => item.blockers.map((blocker) => `${item.id}: ${blocker}`));

const rows = [
  "| Asset | Status | Local candidates | Blockers |",
  "| --- | --- | --- | --- |",
  ...items.map((item) =>
    tableRow([
      item.id,
      item.status,
      item.candidates.length ? item.candidates.map((candidate) => candidate.relativePath).join("<br>") : "None",
      item.blockers.length ? item.blockers.join("<br>") : "None",
    ]),
  ),
];

const readme = `# Back-to-School 2026 Marketing Asset Package

Generated: ${new Date().toISOString()}
Release: Back to School with AI
Draft ready: ${draftReady ? "yes" : "no"}
Final marketing ready: ${finalReady ? "yes" : "no"}
Files: ${copied.length}

This package gathers local draft promotional and social candidates for launch review. It is not final App Store creative and must be refreshed after native release screenshots and real WidgetKit captures are complete.

## Assets

${rows.join("\n")}

## Rules

- Keep the story anchored to Back to School with AI.
- Do not imply Canvas/LMS sync, automatic homework submission, fake widget placement, or unsupported Watch/Live Activity surfaces.
- Replace draft candidates with final native release screenshots or hosted artwork before launch.
- Final WidgetKit social or promotional art must use real WidgetKit Home Screen or Lock Screen captures.
`;

const payload = {
  generatedAt: new Date().toISOString(),
  release: "Back to School with AI",
  status: finalReady ? "ready" : draftReady ? "draft_ready" : "blocked_missing_candidates",
  draftReady,
  finalReady,
  packageDir: OUTPUT_DIR,
  readmePath: OUTPUT_README_PATH,
  fileCount: copied.length,
  totalBytes: copied.reduce((total, item) => total + item.bytes, 0),
  coverage: {
    promotionalArtwork: {
      total: assetManifest.promotionalArtwork.length,
      draftCandidates: items.filter((item) => item.id.startsWith("promo-") && item.candidates.length > 0).length,
    },
    socialAssets: {
      total: assetManifest.socialAssets.length,
      draftCandidates: items.filter((item) => item.id.startsWith("social-") && item.candidates.length > 0).length,
    },
  },
  socialCopy,
  items,
  blockers,
};

writeFileSync(OUTPUT_README_PATH, readme);
writeFileSync(OUTPUT_MANIFEST_PATH, `${JSON.stringify(payload, null, 2)}\n`);

if (failures.length) {
  console.error("Back-to-School marketing asset package failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Back-to-School marketing assets ${payload.status}. ${copied.length} local files. Wrote ${OUTPUT_MANIFEST_PATH} and ${OUTPUT_README_PATH}.`,
);
