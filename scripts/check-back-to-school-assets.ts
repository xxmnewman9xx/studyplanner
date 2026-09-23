import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type AssetStatus = "planned" | "copy_ready" | "optional_planned" | "ready";

type ScreenshotAsset = {
  id: string;
  headline: string;
  captureId: string;
  alternateCaptureIds?: string[];
  status: AssetStatus;
  sourceType: string;
  file: string | null;
  purpose: string;
};

type SimpleAsset = {
  id: string;
  title?: string;
  copy?: string;
  status: AssetStatus;
  sourceType?: string;
  file?: string | null;
  url?: string | null;
};

type AssetManifest = {
  release: string;
  targetWindow: string;
  rules: string[];
  appStoreScreenshots: ScreenshotAsset[];
  promotionalArtwork: SimpleAsset[];
  socialAssets: SimpleAsset[];
  supplementalMaterials: SimpleAsset[];
  pressKit: {
    status: AssetStatus;
    file: string | null;
    requiredForNomination: boolean;
  };
};

const MANIFEST_PATH = "docs/launch/back-to-school-2026/app-store-asset-manifest.json";
const RELEASE_COPY_PATH = "docs/launch/back-to-school-2026/release-notes-and-launch-copy.md";
const RUNBOOK_PATH = "docs/launch/back-to-school-2026/native-screenshot-qa-runbook.md";
const OUTPUT_PATH = "qa/back-to-school-2026/asset-production-audit.json";
const FINALIZATION_PATH = "qa/back-to-school-2026/asset-finalization-plan.json";
const forbiddenFinalAssetPath = "qa-screenshots/back-to-school-2026-implementation/";
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

function section(markdown: string, heading: string) {
  const start = markdown.indexOf(heading);
  if (start < 0) {
    failures.push(`Missing section: ${heading}`);
    return "";
  }
  const rest = markdown.slice(start + heading.length);
  const nextHeading = rest.search(/\n## /);
  return (nextHeading >= 0 ? rest.slice(0, nextHeading) : rest).trim();
}

function numberedItems(sectionText: string) {
  return sectionText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, ""));
}

function socialCopy(sectionText: string) {
  return sectionText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => {
      const match = line.match(/^-\s+(.+?):\s+"(.+)"$/);
      return match ? { label: match[1], copy: match[2] } : null;
    })
    .filter((item): item is { label: string; copy: string } => Boolean(item));
}

function runbookCaptureIds(runbook: string) {
  return runbook
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("| "))
    .map((line) => line.split("|").map((cell) => cell.trim())[1])
    .filter((cell) => /^(app|widget|ax)-/.test(cell));
}

function allAssets(manifest: AssetManifest) {
  return [
    ...manifest.appStoreScreenshots,
    ...manifest.promotionalArtwork,
    ...manifest.socialAssets,
    ...manifest.supplementalMaterials,
    manifest.pressKit,
  ];
}

function validateFinalFile(asset: { id?: string; file?: string | null; status?: string }) {
  if (!asset.file) return;
  expect(!asset.file.includes(forbiddenFinalAssetPath), `${asset.id || asset.file} must not use web smoke screenshots as final creative`);
  if (asset.status === "ready") {
    expect(existsSync(asset.file), `${asset.id || asset.file} is marked ready but file is missing: ${asset.file}`);
  }
}

const manifest = JSON.parse(read(MANIFEST_PATH)) as AssetManifest;
const releaseCopy = read(RELEASE_COPY_PATH);
const runbook = read(RUNBOOK_PATH);
const finalizationPlan = JSON.parse(read(FINALIZATION_PATH)) as {
  status?: string;
  blockers?: string[];
  nativeManifest?: {
    exists?: boolean;
    capturedEntries?: number;
  };
  appStoreScreenshots?: {
    total?: number;
    fulfilled?: number;
    missing?: number;
  };
  rules?: string[];
};
const releaseHeadlines = numberedItems(section(releaseCopy, "## Screenshot Headlines"));
const socialCutdowns = socialCopy(section(releaseCopy, "## Social Cutdowns"));
const validCaptureIds = new Set(runbookCaptureIds(runbook));

expect(manifest.release === "Back to School with AI", "asset manifest release must match Back to School with AI");
expect(manifest.rules.some((rule) => rule.includes("real native release UI")), "asset manifest must require real native release UI");
expect(manifest.rules.some((rule) => rule.includes("Web smoke screenshots")), "asset manifest must ban web smoke screenshots for App Store creative");
expect(manifest.rules.some((rule) => rule.includes("Do not composite Home Screen widget placements")), "asset manifest must ban fake Home Screen widget composites");
expect(manifest.appStoreScreenshots.length === releaseHeadlines.length, "asset manifest screenshot count must match release screenshot headlines");
expect(manifest.appStoreScreenshots.length === 9, "asset manifest must define nine App Store screenshot frames");

for (let index = 0; index < releaseHeadlines.length; index += 1) {
  const asset = manifest.appStoreScreenshots[index];
  expect(asset.headline === releaseHeadlines[index], `screenshot ${index + 1} headline must match launch copy`);
  expect(validCaptureIds.has(asset.captureId), `${asset.id} captureId must exist in native screenshot runbook`);
  for (const alternate of asset.alternateCaptureIds || []) {
    expect(validCaptureIds.has(alternate), `${asset.id} alternate captureId must exist in native screenshot runbook: ${alternate}`);
  }
  expect(["native_capture_required", "native_widget_capture_required"].includes(asset.sourceType), `${asset.id} must require native or native widget capture`);
  validateFinalFile(asset);
}

expect(manifest.appStoreScreenshots.some((asset) => asset.captureId === "app-07-semester-ready"), "screenshots must include semester-ready payoff");
expect(manifest.appStoreScreenshots.some((asset) => asset.captureId === "widget-03-exam-heavy-medium"), "screenshots must include exam-heavy native widget proof");
expect(manifest.appStoreScreenshots.some((asset) => (asset.alternateCaptureIds || []).includes("widget-06-tinted-medium")), "screenshots must include tinted widget capture as an alternate proof state");
expect(["blocked_missing_native_manifest", "blocked_missing_native_captures", "ready_to_apply", "applied"].includes(finalizationPlan.status || ""), "asset finalization plan must record a valid status");
expect(finalizationPlan.appStoreScreenshots?.total === 9, "asset finalization plan must cover all nine App Store screenshots");
expect((finalizationPlan.rules || []).some((rule) => rule.includes("Web smoke screenshots")), "asset finalization plan must reject web smoke screenshots");
expect((finalizationPlan.rules || []).some((rule) => rule.includes("WidgetKit")), "asset finalization plan must preserve WidgetKit proof requirements");
expect((finalizationPlan.rules || []).some((rule) => rule.includes("guarded remote EAS simulator capture")), "asset finalization plan must explicitly allow guarded remote app-route captures for app screenshot slots");
expect((finalizationPlan.rules || []).some((rule) => rule.includes("real WidgetKit Home Screen or Lock Screen placement")), "asset finalization plan must require real WidgetKit placement for widget screenshot slots");
expect((finalizationPlan.rules || []).some((rule) => rule.includes("remote app-route captures") && rule.includes("cannot satisfy WidgetKit slots")), "asset finalization plan must prevent remote in-app captures from satisfying WidgetKit slots");

const socialCopies = new Set(socialCutdowns.map((item) => item.copy));
expect(manifest.socialAssets.length === socialCutdowns.length, "social asset count must match launch copy cutdowns");
for (const asset of manifest.socialAssets) {
  expect(Boolean(asset.copy && socialCopies.has(asset.copy)), `${asset.id} social copy must match release copy`);
  expect(asset.status === "copy_ready" || asset.status === "ready", `${asset.id} social asset must be copy_ready or ready`);
  validateFinalFile(asset);
}

expect(manifest.promotionalArtwork.length >= 2, "asset manifest must include hero and widget promotional artwork slots");
expect(manifest.promotionalArtwork.some((asset) => asset.sourceType === "native_widget_capture_required"), "promotional artwork must include native widget sheet slot");
for (const asset of manifest.promotionalArtwork) validateFinalFile(asset);

expect(manifest.supplementalMaterials.length === 5, "supplemental materials must fit App Store Connect's five URL slots");
for (const material of manifest.supplementalMaterials) {
  expect(material.status === "planned" || material.status === "ready", `${material.id} supplemental material must be planned or ready`);
  if (material.status === "ready") expect(Boolean(material.url), `${material.id} is ready but missing URL`);
}

expect(manifest.pressKit.requiredForNomination === false, "press kit must remain optional for featuring nomination");
validateFinalFile({ id: "press-kit", file: manifest.pressKit.file, status: manifest.pressKit.status });

const assets = allAssets(manifest);
const readyAssets = assets.filter((asset) => asset.status === "ready").length;
const copyReadyAssets = assets.filter((asset) => asset.status === "copy_ready").length;
const nativeRequiredAssets = assets.filter((asset) => {
  const sourceType = "sourceType" in asset ? asset.sourceType : "";
  return sourceType === "native_capture_required" || sourceType === "native_widget_capture_required";
}).length;
const assetsReady = readyAssets === assets.length;
const blockers = assetsReady
  ? []
  : [
      `${readyAssets}/${assets.length} assets are marked ready.`,
      `${nativeRequiredAssets} assets still depend on native app or WidgetKit capture proof.`,
      ...(finalizationPlan.blockers || []),
      "Upload or link all five supplemental materials before App Store Connect nomination submission.",
    ];

const payload = {
  generatedAt: new Date().toISOString(),
  assetsReady,
  manifest: MANIFEST_PATH,
  totals: {
    allAssets: assets.length,
    readyAssets,
    copyReadyAssets,
    nativeRequiredAssets,
  },
  finalization: {
    path: FINALIZATION_PATH,
    status: finalizationPlan.status || "unknown",
    blockers: finalizationPlan.blockers || [],
    nativeManifestExists: Boolean(finalizationPlan.nativeManifest?.exists),
    appStoreScreenshots: finalizationPlan.appStoreScreenshots || null,
  },
  blockers,
  requiredBeforeSubmission: [
    "Attach native release screenshots for all nine App Store frames.",
    "Run npm run finalize:back-to-school-assets, then npm run apply:back-to-school-assets once all native captures exist.",
    "Attach real WidgetKit screenshots for Home Screen and Lock Screen widget states.",
    "Upload or link five supplemental materials in App Store Connect.",
    "Create final contact sheets from native release captures only.",
  ],
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

if (failures.length) {
  console.error("Back-to-School asset checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Back-to-School asset preflight passed. Wrote ${OUTPUT_PATH}.`);
