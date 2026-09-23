import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type DraftPayload = {
  release?: string;
  nominationName?: string;
  nominationType?: string;
  platforms?: string;
  targetWindow?: string;
  submissionTarget?: string;
  relevantCountriesOrRegions?: string;
  description?: string;
  helpfulDetails?: string;
  characterCounts?: {
    description?: number;
    helpfulDetails?: number;
  };
  supplementalMaterials?: {
    id?: string;
    title?: string;
    url?: string | null;
  }[];
  csvAllowed?: boolean;
  csvReason?: string;
  sourceDocs?: string[];
};

type SubmissionGate = {
  submissionReady?: boolean;
  recommendedSubmissionMode?: string;
  csvAllowed?: boolean;
  csvReason?: string;
  blockers?: string[];
  gates?: {
    id?: string;
    status?: string;
    blockers?: string[];
  }[];
};

type UploadPackage = {
  packageReady?: boolean;
  coverage?: {
    appStoreScreenshots?: {
      fulfilled?: number;
      total?: number;
    };
    widgetStates?: {
      captured?: number;
      total?: number;
    };
    supplementalUrls?: {
      ready?: number;
      total?: number;
    };
  };
  uploadItems?: {
    id?: string;
    uploadReady?: boolean;
    requiredUrl?: string | null;
    localEvidence?: {
      supplementalStatus?: string;
      blockers?: string[];
    };
    productVideoReview?: {
      status?: string;
      appPreviewReady?: boolean;
    };
  }[];
  blockers?: string[];
};

type SupplementalUrlRegistry = {
  status?: string;
  registeredCount?: number;
  requiredCount?: number;
  missingCount?: number;
  invalidCount?: number;
  slots?: {
    id?: string;
    title?: string;
    url?: string | null;
    status?: string;
    reason?: string;
  }[];
};

type LaunchReadiness = {
  submissionReady?: boolean;
  blockers?: string[];
};

type EditorialBoard = {
  submissionReady?: boolean;
  items?: {
    id?: string;
    status?: string;
    blockers?: string[];
  }[];
};

type ReleaseCycleGate = {
  generatedAt?: string;
  localCyclePassed?: boolean;
  submissionReady?: boolean;
  recommendedSubmissionMode?: string;
  blockers?: string[];
  blockedGates?: string[];
};

type ArtifactStatus = {
  path: string;
  exists: boolean;
  ready: boolean | null;
  summary: string;
};

const NOMINATION_PATH = "docs/launch/back-to-school-2026/app-store-nomination-packet.md";
const DRAFT_PAYLOAD_PATH = "docs/launch/back-to-school-2026/app-store-connect-draft-payload.json";
const SUBMISSION_GATE_PATH = "qa/back-to-school-2026/submission-gate.json";
const UPLOAD_PACKAGE_PATH = "qa/back-to-school-2026/supplemental-upload-manifest.json";
const URL_REGISTRY_PATH = "qa/back-to-school-2026/supplemental-url-registry.json";
const LAUNCH_AUDIT_PATH = "qa/back-to-school-2026/launch-readiness-audit.json";
const EDITORIAL_BOARD_PATH = "qa/back-to-school-2026/editorial-readiness-board.json";
const RELEASE_CYCLE_GATE_PATH = "qa/back-to-school-2026/release-cycle-gate.json";
const OUTPUT_JSON_PATH = "qa/back-to-school-2026/app-store-connect-submission-runbook.json";
const OUTPUT_MARKDOWN_PATH = "docs/launch/back-to-school-2026/app-store-connect-submission-runbook.md";

const APPLE_NOMINATION_DOC =
  "https://developer.apple.com/help/app-store-connect/manage-featuring-nominations/nominate-your-app-for-featuring/";
const APPLE_TEMPLATE_DOC = "https://developer.apple.com/help/app-store-connect/reference/nominations/nominations-template/";

const failures: string[] = [];

function read(path: string) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function readJson<T>(path: string, fallback: T): T {
  const raw = read(path);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    failures.push(`${path} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}

function readOptionalJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch (error) {
    failures.push(`${path} must be valid JSON if present: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}

function normalizedLength(text: string | undefined) {
  return (text || "").replace(/\s+/g, " ").trim().length;
}

function isHttpsUrl(url: string | null | undefined) {
  return typeof url === "string" && /^https:\/\/\S+\.\S+/.test(url);
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function markdownCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function tableRow(cells: string[]) {
  return `| ${cells.map(markdownCell).join(" | ")} |`;
}

function statusText(ready: boolean | null) {
  if (ready === null) return "informational";
  return ready ? "ready" : "blocked";
}

function artifactStatus(path: string, ready: boolean | null, summary: string): ArtifactStatus {
  return {
    path,
    exists: existsSync(path),
    ready,
    summary,
  };
}

const nomination = read(NOMINATION_PATH);
const draftPayload = readJson<DraftPayload>(DRAFT_PAYLOAD_PATH, {});
const submissionGate = readJson<SubmissionGate>(SUBMISSION_GATE_PATH, {});
const uploadPackage = readJson<UploadPackage>(UPLOAD_PACKAGE_PATH, {});
const urlRegistry = readJson<SupplementalUrlRegistry>(URL_REGISTRY_PATH, {});
const launchAudit = readJson<LaunchReadiness>(LAUNCH_AUDIT_PATH, {});
const editorialBoard = readJson<EditorialBoard>(EDITORIAL_BOARD_PATH, {});
const releaseCycleGate = readOptionalJson<ReleaseCycleGate>(RELEASE_CYCLE_GATE_PATH, {});

const sourceDocs = draftPayload.sourceDocs || [];
const hasAppleDocs =
  nomination.includes(APPLE_NOMINATION_DOC) &&
  nomination.includes(APPLE_TEMPLATE_DOC) &&
  sourceDocs.includes(APPLE_NOMINATION_DOC) &&
  sourceDocs.includes(APPLE_TEMPLATE_DOC);
if (!hasAppleDocs) failures.push("Nomination packet and draft payload must cite Apple nomination source docs.");

if (draftPayload.csvAllowed !== false) failures.push("Draft payload must keep csvAllowed false.");
if (submissionGate.csvAllowed !== false) failures.push("Submission gate must keep csvAllowed false.");
if (!nomination.includes("CSV imports submit nominations automatically")) {
  failures.push("Nomination packet must state that CSV imports submit nominations automatically.");
}

const draftFieldsReady =
  draftPayload.release === "Back to School with AI" &&
  draftPayload.nominationName === "Back to School with AI" &&
  draftPayload.nominationType === "App Enhancements" &&
  Boolean(draftPayload.platforms?.includes("iOS (iPhone)") && draftPayload.platforms?.includes("iOS (iPad)")) &&
  normalizedLength(draftPayload.description) > 0 &&
  normalizedLength(draftPayload.description) <= 1000 &&
  normalizedLength(draftPayload.helpfulDetails) > 0 &&
  normalizedLength(draftPayload.helpfulDetails) <= 500;

if (!draftFieldsReady) failures.push("App Store Connect draft payload fields are incomplete or outside Apple character limits.");

const supplementalIds = new Set((draftPayload.supplementalMaterials || []).map((item) => item.id).filter(Boolean));
const registryIds = new Set((urlRegistry.slots || []).map((slot) => slot.id).filter(Boolean));
const uploadIds = new Set((uploadPackage.uploadItems || []).map((item) => item.id).filter(Boolean));
for (const id of ["product-video", "screenshot-contact-sheet", "native-widget-sheet", "accessibility-localization-summary", "app-review-proof"]) {
  if (!supplementalIds.has(id)) failures.push(`Draft payload missing supplemental material: ${id}`);
  if (!registryIds.has(id)) failures.push(`Supplemental URL registry missing slot: ${id}`);
  if (!uploadIds.has(id)) failures.push(`Upload manifest missing item: ${id}`);
}

const supplementalRows = (draftPayload.supplementalMaterials || []).map((item) => {
  const slot = (urlRegistry.slots || []).find((candidate) => candidate.id === item.id);
  const uploadItem = (uploadPackage.uploadItems || []).find((candidate) => candidate.id === item.id);
  const url = slot?.url || item.url || uploadItem?.requiredUrl || null;
  return {
    id: item.id || "unknown",
    title: item.title || slot?.title || "Untitled",
    url,
    registryStatus: slot?.status || "missing",
    uploadReady: uploadItem?.uploadReady === true,
    localStatus: uploadItem?.localEvidence?.supplementalStatus || "unknown",
    blocker: slot?.reason || uploadItem?.localEvidence?.blockers?.join(" ") || null,
  };
});

const supplementalUrlReady =
  urlRegistry.registeredCount === 5 &&
  urlRegistry.requiredCount === 5 &&
  supplementalRows.every((row) => isHttpsUrl(row.url) && row.registryStatus === "registered");
const submissionReady = submissionGate.submissionReady === true;
const finalSubmitReady =
  draftFieldsReady &&
  supplementalUrlReady &&
  uploadPackage.packageReady === true &&
  launchAudit.submissionReady === true &&
  editorialBoard.submissionReady === true &&
  submissionReady;

const recommendedMode = finalSubmitReady ? "Submit Nomination" : submissionGate.recommendedSubmissionMode || "Save as Draft only";
const status = finalSubmitReady ? "ready_for_manual_submit" : "draft_only";

const blockedGates = (submissionGate.gates || []).filter((gate) => gate.status !== "ready").map((gate) => gate.id || "unknown");
const editorialBlocked = (editorialBoard.items || []).filter((item) => item.status !== "ready").map((item) => item.id || "unknown");
const blockers = unique([
  ...supplementalRows
    .filter((row) => !isHttpsUrl(row.url) || row.registryStatus !== "registered")
    .map((row) => `${row.id}: stable HTTPS supplemental URL is not registered.`),
  ...(submissionGate.blockers || []).map((blocker) => `submission: ${blocker}`),
  ...(uploadPackage.blockers || []).map((blocker) => `upload-package: ${blocker}`),
  ...(launchAudit.blockers || []).map((blocker) => `launch: ${blocker}`),
  ...editorialBlocked.map((id) => `editorial: ${id} is not ready.`),
]);

const artifactStatuses: ArtifactStatus[] = [
  artifactStatus(
    DRAFT_PAYLOAD_PATH,
    draftFieldsReady,
    `${draftPayload.nominationType || "unknown"} nomination, ${normalizedLength(draftPayload.description)}/1000 description characters, ${normalizedLength(draftPayload.helpfulDetails)}/500 helpful-details characters.`,
  ),
  artifactStatus(
    URL_REGISTRY_PATH,
    supplementalUrlReady,
    `${urlRegistry.registeredCount || 0}/${urlRegistry.requiredCount || 5} stable supplemental URLs registered.`,
  ),
  artifactStatus(
    UPLOAD_PACKAGE_PATH,
    uploadPackage.packageReady === true,
    `${uploadPackage.coverage?.appStoreScreenshots?.fulfilled || 0}/${uploadPackage.coverage?.appStoreScreenshots?.total || 9} screenshots, ${uploadPackage.coverage?.widgetStates?.captured || 0}/${uploadPackage.coverage?.widgetStates?.total || 8} WidgetKit states, ${uploadPackage.coverage?.supplementalUrls?.ready || 0}/${uploadPackage.coverage?.supplementalUrls?.total || 5} supplemental URLs.`,
  ),
  artifactStatus(SUBMISSION_GATE_PATH, submissionReady, `${blockedGates.length} submission gate(s) blocked.`),
  artifactStatus(LAUNCH_AUDIT_PATH, launchAudit.submissionReady === true, `${launchAudit.blockers?.length || 0} launch blocker(s).`),
  artifactStatus(EDITORIAL_BOARD_PATH, editorialBoard.submissionReady === true, `${editorialBlocked.length} editorial item(s) blocked.`),
  artifactStatus(
    RELEASE_CYCLE_GATE_PATH,
    releaseCycleGate.localCyclePassed === undefined ? null : releaseCycleGate.localCyclePassed === true,
    releaseCycleGate.generatedAt
      ? `Previous aggregate cycle generated at ${releaseCycleGate.generatedAt}; submission ready: ${releaseCycleGate.submissionReady === true ? "yes" : "no"}.`
      : "Previous aggregate release-cycle artifact not present yet.",
  ),
];

const manualSteps = [
  "Open App Store Connect, select the app, then open Featuring > Nominations.",
  "Create an individual nomination, not a CSV import.",
  "Choose App Enhancements as the nomination type.",
  "Paste the nomination name, publish window, platforms, countries, description, and Helpful Details from the draft payload.",
  "Attach only the five stable HTTPS supplemental material URLs after the URL registry reports 5/5 registered.",
  "Save as Draft while any local gate remains blocked.",
  "Click Submit Nomination only after this runbook, the aggregate release-cycle gate, and the submission gate all report ready.",
];

const preSubmitCommands = [
  "npm run check:back-to-school-submission-runbook",
  "npm run check:back-to-school-release-cycle",
  "npm run check:back-to-school-submission",
];

const payload = {
  generatedAt: new Date().toISOString(),
  release: draftPayload.release || "Back to School with AI",
  status,
  manualSubmissionReady: finalSubmitReady,
  recommendedMode,
  csvAllowed: false,
  csvReason:
    draftPayload.csvReason ||
    submissionGate.csvReason ||
    "Do not use CSV import for this nomination until every gate is final, because CSV import submits automatically.",
  sourceDocs: [APPLE_NOMINATION_DOC, APPLE_TEMPLATE_DOC],
  appleRules: {
    manualDraftAllowed: true,
    supplementalMaterialUrlLimit: 5,
    csvImportSubmitsAutomatically: true,
  },
  fieldSummary: {
    nominationName: draftPayload.nominationName || "",
    nominationType: draftPayload.nominationType || "",
    platforms: draftPayload.platforms || "",
    targetWindow: draftPayload.targetWindow || "",
    submissionTarget: draftPayload.submissionTarget || "",
    relevantCountriesOrRegions: draftPayload.relevantCountriesOrRegions || "",
    descriptionCharacters: normalizedLength(draftPayload.description),
    helpfulDetailsCharacters: normalizedLength(draftPayload.helpfulDetails),
  },
  readiness: {
    draftFieldsReady,
    supplementalUrlReady,
    uploadPackageReady: uploadPackage.packageReady === true,
    launchReady: launchAudit.submissionReady === true,
    editorialReady: editorialBoard.submissionReady === true,
    submissionGateReady: submissionReady,
    previousReleaseCyclePassed: releaseCycleGate.localCyclePassed === true,
  },
  supplementalMaterials: supplementalRows,
  artifactStatuses,
  manualSteps,
  preSubmitCommands,
  blockedGates,
  blockers,
  failures,
};

const artifactTable = [
  "| Artifact | Status | Summary |",
  "| --- | --- | --- |",
  ...artifactStatuses.map((item) => tableRow([item.path, item.exists ? statusText(item.ready) : "missing", item.summary])),
].join("\n");

const supplementalTable = [
  "| Slot | URL Status | Upload | Local Status | URL |",
  "| --- | --- | --- | --- | --- |",
  ...supplementalRows.map((row) =>
    tableRow([row.id, row.registryStatus, row.uploadReady ? "ready" : "blocked", row.localStatus, row.url || "Missing"]),
  ),
].join("\n");

const markdown = `# App Store Connect Submission Runbook

Generated: ${payload.generatedAt}
Release: ${payload.release}
Status: ${status}
Recommended mode: ${recommendedMode}
Manual submission ready: ${finalSubmitReady ? "yes" : "no"}
CSV allowed: no

This runbook keeps the Back-to-School featuring nomination in the individual App Store Connect draft workflow until every screenshot, WidgetKit, supplemental URL, editorial, launch, and submission gate is ready. Do not use CSV import for this nomination while the status is \`draft_only\`.

## App Store Connect Fields

- Nomination name: ${payload.fieldSummary.nominationName}
- Nomination type: ${payload.fieldSummary.nominationType}
- Platforms: ${payload.fieldSummary.platforms}
- Target window: ${payload.fieldSummary.targetWindow}
- Submission target: ${payload.fieldSummary.submissionTarget}
- Countries or regions: ${payload.fieldSummary.relevantCountriesOrRegions}
- Description: ${payload.fieldSummary.descriptionCharacters}/1000 characters
- Helpful Details: ${payload.fieldSummary.helpfulDetailsCharacters}/500 characters

## Manual Steps

${manualSteps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

## Supplemental Materials

${supplementalTable}

## Artifact Status

${artifactTable}

## Pre-Submit Commands

${preSubmitCommands.map((command) => `- \`${command}\``).join("\n")}

## Blocked Gates

${blockedGates.length ? blockedGates.map((gate) => `- ${gate}`).join("\n") : "- None"}

## Current Blockers

${blockers.length ? blockers.map((blocker) => `- ${blocker}`).join("\n") : "- None"}

## Source Rules

- Apple individual nominations can be saved as drafts until ready to submit.
- Apple supplemental materials support up to five URLs.
- Apple CSV nomination imports submit automatically, so this release must stay in the individual draft workflow until every local gate is ready.

Sources:

- ${APPLE_NOMINATION_DOC}
- ${APPLE_TEMPLATE_DOC}
`;

mkdirSync(dirname(OUTPUT_JSON_PATH), { recursive: true });
mkdirSync(dirname(OUTPUT_MARKDOWN_PATH), { recursive: true });
writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(OUTPUT_MARKDOWN_PATH, markdown);

if (failures.length) {
  console.error("Back-to-School App Store Connect submission runbook failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Back-to-School App Store Connect submission runbook ${status}. Manual submission ready: ${
    finalSubmitReady ? "yes" : "no"
  }. Wrote ${OUTPUT_JSON_PATH} and ${OUTPUT_MARKDOWN_PATH}.`,
);
