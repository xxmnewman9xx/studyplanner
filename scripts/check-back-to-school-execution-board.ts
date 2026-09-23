import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type NativeDisk = {
  status?: string;
  before?: { freeGib?: number };
  gapGib?: number;
  readyForNativeCapture?: boolean;
  recommendedActions?: string[];
  blockers?: string[];
  cleanupPlan?: {
    runbookPath?: string;
    topExternalCandidate?: { id?: string; path?: string; gib?: number };
    orderedExternalCandidates?: { id?: string; path?: string; gib?: number; cumulativeGib?: number; closesGap?: boolean }[];
  };
};

type NativePreflight = {
  captureReady?: boolean;
  blockers?: string[];
  checks?: { id?: string; status?: string; evidence?: string; blocker?: string | null }[];
};

type RemoteCapture = {
  remotePlanReady?: boolean;
  startsPaidSession?: boolean;
  profile?: string;
  blockers?: string[];
  runner?: { planScript?: string; captureScript?: string };
  plan?: { targets?: unknown[] };
};

type NativeCaptureRun = {
  status?: string;
  targetCount?: number;
  targets?: { captureId?: string; status?: string }[];
  nativeWidgetPlacement?: { status?: string; note?: string };
};

type CaptureIngest = {
  status?: string;
  capturedCount?: number;
  waitingCount?: number;
  captures?: { captureId?: string; status?: string; path?: string }[];
  actions?: Record<string, string>;
};

type AssetFinalization = {
  status?: string;
  appStoreScreenshots?: {
    total?: number;
    fulfilled?: number;
    missing?: number;
    items?: {
      id?: string;
      captureId?: string;
      alternateCaptureIds?: string[];
      sourceType?: string;
      fulfilled?: boolean;
      missingReason?: string | null;
    }[];
  };
  blockers?: string[];
};

type SupplementalPlan = {
  materialsReady?: boolean;
  total?: number;
  urlReadyCount?: number;
  localCandidateReadyCount?: number;
  blockedCount?: number;
  blockers?: string[];
  items?: { id?: string; status?: string; nextAction?: string; blockers?: string[] }[];
};

type UrlRegistry = {
  status?: string;
  registeredCount?: number;
  requiredCount?: number;
  slots?: { id?: string; status?: string; url?: string | null; reason?: string }[];
};

type UploadPackage = {
  packageReady?: boolean;
  coverage?: {
    appStoreScreenshots?: { fulfilled?: number; total?: number };
    widgetStates?: { captured?: number; total?: number };
    supplementalUrls?: { ready?: number; total?: number };
  };
  blockers?: string[];
};

type MarketingPackage = {
  status?: string;
  draftReady?: boolean;
  finalReady?: boolean;
  blockers?: string[];
  items?: { id?: string; status?: string }[];
};

type EditorialBoard = {
  submissionReady?: boolean;
  items?: { id?: string; area?: string; status?: string; nextAction?: string; blockers?: string[] }[];
};

type SubmissionGate = {
  submissionReady?: boolean;
  recommendedSubmissionMode?: string;
  gates?: { id?: string; status?: string; blockers?: string[] }[];
  blockers?: string[];
};

type SubmissionRunbook = {
  status?: string;
  manualSubmissionReady?: boolean;
  readiness?: Record<string, boolean>;
  blockedGates?: string[];
  blockers?: string[];
};

type ExecutionLane = {
  id: string;
  owner: string;
  status: "ready" | "blocked" | "waiting" | "draft_ready";
  objective: string;
  dependsOn: string[];
  evidence: string[];
  blockers: string[];
  commands: string[];
  exitCriteria: string[];
  nextAction: string;
};

type SubagentLane = {
  id: string;
  scope: string;
  owns: string[];
  handoff: string;
};

const OUTPUT_JSON_PATH = "qa/back-to-school-2026/execution-board.json";
const OUTPUT_MARKDOWN_PATH = "docs/launch/back-to-school-2026/execution-board.md";

const paths = {
  nativeDisk: "qa/back-to-school-2026/native-disk-readiness.json",
  nativePreflight: "qa/back-to-school-2026/native-capture-preflight.json",
  remoteCapture: "qa/back-to-school-2026/remote-capture-readiness.json",
  nativeCaptureRun: "qa/back-to-school-2026/native-capture-run.json",
  appCaptureIngest: "qa/back-to-school-2026/app-capture-ingest.json",
  widgetCaptureIngest: "qa/back-to-school-2026/widget-capture-ingest.json",
  assetFinalization: "qa/back-to-school-2026/asset-finalization-plan.json",
  supplementalPlan: "qa/back-to-school-2026/supplemental-materials-plan.json",
  urlRegistry: "qa/back-to-school-2026/supplemental-url-registry.json",
  uploadPackage: "qa/back-to-school-2026/supplemental-upload-manifest.json",
  marketingPackage: "qa/back-to-school-2026/marketing-asset-package-manifest.json",
  editorialBoard: "qa/back-to-school-2026/editorial-readiness-board.json",
  submissionGate: "qa/back-to-school-2026/submission-gate.json",
  submissionRunbook: "qa/back-to-school-2026/app-store-connect-submission-runbook.json",
};

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

function formatNumber(value: number | undefined, digits = 1) {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "unknown";
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

function missingScreenshotIds(finalization: AssetFinalization, sourceType: string) {
  return (finalization.appStoreScreenshots?.items || [])
    .filter((item) => item.sourceType === sourceType && item.fulfilled !== true)
    .map((item) => [item.captureId, ...(item.alternateCaptureIds || [])].filter(Boolean).join("/"));
}

function statusFromReady(ready: boolean, blockedByDependency = false): ExecutionLane["status"] {
  if (ready) return "ready";
  return blockedByDependency ? "waiting" : "blocked";
}

const nativeDisk = readJson<NativeDisk>(paths.nativeDisk, {});
const nativePreflight = readJson<NativePreflight>(paths.nativePreflight, {});
const remoteCapture = readJson<RemoteCapture>(paths.remoteCapture, {});
const nativeCaptureRun = readJson<NativeCaptureRun>(paths.nativeCaptureRun, {});
const appCaptureIngest = readJson<CaptureIngest>(paths.appCaptureIngest, {});
const widgetCaptureIngest = readJson<CaptureIngest>(paths.widgetCaptureIngest, {});
const assetFinalization = readJson<AssetFinalization>(paths.assetFinalization, {});
const supplementalPlan = readJson<SupplementalPlan>(paths.supplementalPlan, {});
const urlRegistry = readJson<UrlRegistry>(paths.urlRegistry, {});
const uploadPackage = readJson<UploadPackage>(paths.uploadPackage, {});
const marketingPackage = readJson<MarketingPackage>(paths.marketingPackage, {});
const editorialBoard = readJson<EditorialBoard>(paths.editorialBoard, {});
const submissionGate = readJson<SubmissionGate>(paths.submissionGate, {});
const submissionRunbook = readJson<SubmissionRunbook>(paths.submissionRunbook, {});

const missingAppCaptures = missingScreenshotIds(assetFinalization, "native_capture_required");
const missingWidgetCaptures = missingScreenshotIds(assetFinalization, "native_widget_capture_required");
const diskReady = nativeDisk.readyForNativeCapture === true && nativePreflight.captureReady === true;
const remoteReady = remoteCapture.remotePlanReady === true && remoteCapture.startsPaidSession === false;
const nativeAppCaptured = nativeCaptureRun.status === "captured" || missingAppCaptures.length === 0;
const widgetCaptured = nativeCaptureRun.nativeWidgetPlacement?.status === "captured" || missingWidgetCaptures.length === 0;
const assetsApplied = assetFinalization.status === "applied" && assetFinalization.appStoreScreenshots?.fulfilled === assetFinalization.appStoreScreenshots?.total;
const supplementalReady =
  supplementalPlan.materialsReady === true &&
  urlRegistry.registeredCount === 5 &&
  urlRegistry.requiredCount === 5 &&
  uploadPackage.packageReady === true;
const marketingFinal = marketingPackage.finalReady === true;
const editorialReady = editorialBoard.submissionReady === true;
const finalSubmitReady = submissionGate.submissionReady === true && submissionRunbook.manualSubmissionReady === true;

const lanes: ExecutionLane[] = [
  {
    id: "native-capture-unlock",
    owner: "Native Capture Agent",
    status: statusFromReady(diskReady),
    objective: "Make a release-build capture path available for Liquid Glass onboarding and app-side screenshots.",
    dependsOn: [],
    evidence: [
      `${formatNumber(nativeDisk.before?.freeGib)} GiB free before cleanup`,
      `${formatNumber(nativeDisk.gapGib)} GiB disk gap`,
      `${(nativePreflight.checks || []).filter((check) => check.status === "ready").length}/${nativePreflight.checks?.length || 0} native preflight checks ready`,
      `Remote fallback ready: ${remoteReady ? "yes" : "no"} (${remoteCapture.profile || "unknown"})`,
    ],
    blockers: unique([
      ...(nativeDisk.blockers || []),
      ...(nativePreflight.blockers || []),
      ...(remoteReady ? [] : remoteCapture.blockers || ["Remote simulator fallback is not ready."]),
    ]),
    commands: [
      "npm run check:back-to-school-native-disk",
      "npm run clean:back-to-school-native-disk",
      "npm run check:back-to-school-native-preflight",
      "npm run capture:back-to-school-native",
      ...(remoteReady ? ["npm run capture:back-to-school-remote -- --artifact-url \"$ARTIFACT_URL\""] : []),
    ],
    exitCriteria: [
      "Native preflight reports captureReady: true, or the guarded remote capture path produces reviewed app-side screenshots.",
      "No app screenshot is accepted unless it comes from release/TestFlight/native simulator evidence.",
    ],
    nextAction: diskReady
      ? "Run the native capture command and preserve the generated capture manifest."
      : `Free about ${formatNumber(nativeDisk.gapGib)} GiB or run the guarded remote capture fallback for app-side screenshots.`,
  },
  {
    id: "app-capture-ingest",
    owner: "App Screenshot Agent",
    status: statusFromReady(nativeAppCaptured, !diskReady),
    objective: "Register the app-side screenshots required by the App Store screenshot story.",
    dependsOn: ["native-capture-unlock"],
    evidence: [
      `Native capture run status: ${nativeCaptureRun.status || "unknown"}`,
      `${nativeCaptureRun.targetCount || 0} planned app capture targets`,
      `${appCaptureIngest.status || "unknown"} app capture ingest status`,
      `${missingAppCaptures.length} app capture slot(s) missing`,
    ],
    blockers: missingAppCaptures.map((id) => `Missing app capture: ${id}`),
    commands: [
      "npm run plan:back-to-school-native-capture",
      "npm run capture:back-to-school-native",
      "npm run register:back-to-school-app-captures",
      "npm run finalize:back-to-school-assets",
    ],
    exitCriteria: [
      "Every app-side capture ID in the native screenshot runbook has a reviewed PNG/JPEG evidence file.",
      "Asset finalization can resolve app screenshot slots from qa-screenshots/back-to-school-2026-native/manifest.json.",
    ],
    nextAction: missingAppCaptures.length
      ? `Capture or register ${missingAppCaptures.length} app screenshot slot(s): ${missingAppCaptures.join(", ")}.`
      : "Refresh asset finalization so app screenshot slots are fulfilled.",
  },
  {
    id: "widgetkit-proof",
    owner: "WidgetKit QA Agent",
    status: statusFromReady(widgetCaptured, !diskReady),
    objective: "Capture real Home Screen and Lock Screen WidgetKit proof for the calendar widget story.",
    dependsOn: ["native-capture-unlock"],
    evidence: [
      `Widget placement status: ${nativeCaptureRun.nativeWidgetPlacement?.status || "unknown"}`,
      `${widgetCaptureIngest.status || "unknown"} widget capture ingest status`,
      `${missingWidgetCaptures.length} WidgetKit capture slot(s) missing`,
    ],
    blockers: missingWidgetCaptures.map((id) => `Missing real WidgetKit capture: ${id}`),
    commands: [
      "npm run plan:back-to-school-widget-captures",
      "npm run register:back-to-school-widget-captures",
      "npm run finalize:back-to-school-assets",
    ],
    exitCriteria: [
      "Home Screen/Lock Screen widget screenshots are real native WidgetKit captures, not web composites.",
      "Dark and tinted/accented widget states are represented where the runbook requires them.",
    ],
    nextAction: missingWidgetCaptures.length
      ? `Place widgets in iOS and register ${missingWidgetCaptures.length} real WidgetKit capture slot(s): ${missingWidgetCaptures.join(", ")}.`
      : "Refresh final assets so WidgetKit proof fills the App Store screenshot slots.",
  },
  {
    id: "app-store-assets",
    owner: "Creative Asset Agent",
    status: statusFromReady(assetsApplied, !(nativeAppCaptured && widgetCaptured)),
    objective: "Turn native app and WidgetKit captures into final App Store screenshots and contact sheets.",
    dependsOn: ["app-capture-ingest", "widgetkit-proof"],
    evidence: [
      `Asset finalization status: ${assetFinalization.status || "unknown"}`,
      `${assetFinalization.appStoreScreenshots?.fulfilled || 0}/${assetFinalization.appStoreScreenshots?.total || 9} screenshot slots fulfilled`,
      `${uploadPackage.coverage?.appStoreScreenshots?.fulfilled || 0}/${uploadPackage.coverage?.appStoreScreenshots?.total || 9} upload-package screenshot slots covered`,
    ],
    blockers: assetFinalization.blockers || [],
    commands: [
      "npm run finalize:back-to-school-assets",
      "npm run apply:back-to-school-assets",
      "npm run check:back-to-school-assets",
      "npm run check:back-to-school-upload-package",
    ],
    exitCriteria: [
      "Asset finalization status is applied.",
      "All nine App Store screenshot slots are fulfilled from native release evidence.",
      "The screenshot contact sheet is regenerated from final evidence.",
    ],
    nextAction: assetsApplied
      ? "Refresh the upload package and marketing package from final assets."
      : "Apply final assets only after app-side and WidgetKit capture proof are present.",
  },
  {
    id: "supplemental-urls",
    owner: "Supplemental Materials Agent",
    status: statusFromReady(supplementalReady, !assetsApplied),
    objective: "Publish all five App Store Connect supplemental materials as stable HTTPS URLs.",
    dependsOn: ["app-store-assets"],
    evidence: [
      `${supplementalPlan.urlReadyCount || 0}/${supplementalPlan.total || 5} supplemental material URLs ready`,
      `${supplementalPlan.localCandidateReadyCount || 0}/${supplementalPlan.total || 5} local supplemental candidates ready`,
      `${urlRegistry.registeredCount || 0}/${urlRegistry.requiredCount || 5} URLs registered`,
      `${uploadPackage.coverage?.supplementalUrls?.ready || 0}/${uploadPackage.coverage?.supplementalUrls?.total || 5} upload-package URLs covered`,
    ],
    blockers: supplementalPlan.blockers || [],
    commands: [
      "npm run check:back-to-school-supplementals",
      "npm run check:back-to-school-upload-package",
      "npm run register:back-to-school-supplemental-urls -- --set slot-id=https://...",
      "npm run check:back-to-school-submission-runbook",
    ],
    exitCriteria: [
      "All five supplemental slots have stable HTTPS URLs.",
      "No local file, localhost URL, placeholder, or temporary signed URL is registered.",
      "Upload package reports packageReady: true.",
    ],
    nextAction: supplementalReady
      ? "Refresh the submission runbook and submission gate."
      : "Upload the five supplemental materials and register stable HTTPS URLs.",
  },
  {
    id: "marketing-finalization",
    owner: "Marketing Asset Agent",
    status: marketingFinal ? "ready" : marketingPackage.draftReady ? "draft_ready" : "blocked",
    objective: "Replace draft promotional/social assets with final native release screenshots or approved hosted artwork.",
    dependsOn: ["app-store-assets"],
    evidence: [
      `Marketing package status: ${marketingPackage.status || "unknown"}`,
      `Draft ready: ${marketingPackage.draftReady === true ? "yes" : "no"}`,
      `Final ready: ${marketingPackage.finalReady === true ? "yes" : "no"}`,
      `${marketingPackage.items?.length || 0} marketing asset slots tracked`,
    ],
    blockers: marketingPackage.blockers || [],
    commands: ["npm run check:back-to-school-marketing-assets", "npm run check:back-to-school-launch"],
    exitCriteria: [
      "Promotional and social assets use final native screenshots, real WidgetKit captures, or approved hosted artwork.",
      "Marketing package reports finalReady: true.",
    ],
    nextAction: marketingFinal
      ? "Keep marketing assets frozen unless final screenshots change."
      : "Replace draft marketing candidates after final native capture and asset finalization.",
  },
  {
    id: "editorial-submission",
    owner: "Release Manager",
    status: statusFromReady(finalSubmitReady, !(supplementalReady && assetsApplied && marketingFinal)),
    objective: "Submit the App Enhancements featuring nomination manually when all proof is ready.",
    dependsOn: ["app-store-assets", "supplemental-urls", "marketing-finalization"],
    evidence: [
      `Editorial ready: ${editorialReady ? "yes" : "no"}`,
      `Submission gate ready: ${submissionGate.submissionReady === true ? "yes" : "no"}`,
      `Submission runbook status: ${submissionRunbook.status || "unknown"}`,
      `Recommended mode: ${submissionGate.recommendedSubmissionMode || "unknown"}`,
    ],
    blockers: unique([...(submissionGate.blockers || []), ...(submissionRunbook.blockers || [])]),
    commands: [
      "npm run check:back-to-school-editorial",
      "npm run check:back-to-school-submission",
      "npm run check:back-to-school-submission-runbook",
      "npm run check:back-to-school-release-cycle",
    ],
    exitCriteria: [
      "Editorial board reports submissionReady: true.",
      "Submission gate reports submissionReady: true.",
      "Submission runbook reports ready_for_manual_submit.",
      "App Store Connect nomination is submitted manually, not via CSV import.",
    ],
    nextAction: finalSubmitReady
      ? "Submit the App Store Connect nomination manually."
      : "Keep the App Store Connect nomination in Save as Draft until all upstream lanes are ready.",
  },
];

const criticalLane = lanes.find((lane) => lane.status === "blocked") || lanes.find((lane) => lane.status === "waiting") || null;
const readyCount = lanes.filter((lane) => lane.status === "ready").length;
const blockedCount = lanes.filter((lane) => lane.status === "blocked").length;
const waitingCount = lanes.filter((lane) => lane.status === "waiting").length;
const draftReadyCount = lanes.filter((lane) => lane.status === "draft_ready").length;

const subagents: SubagentLane[] = [
  {
    id: "native-capture-agent",
    scope: "Disk, native build, simulator/TestFlight app capture, and guarded EAS fallback.",
    owns: ["native-capture-unlock", "app-capture-ingest"],
    handoff: "Native capture manifest and reviewed app-side screenshot files.",
  },
  {
    id: "widgetkit-qa-agent",
    scope: "Real Home Screen/Lock Screen WidgetKit proof, including dark and tinted states.",
    owns: ["widgetkit-proof"],
    handoff: "Widget capture ingest artifact and native WidgetKit screenshot sheet.",
  },
  {
    id: "creative-asset-agent",
    scope: "Final screenshot manifest, contact sheet, and App Store visual asset consistency.",
    owns: ["app-store-assets", "marketing-finalization"],
    handoff: "Applied asset manifest, upload package, and final marketing asset package.",
  },
  {
    id: "supplemental-materials-agent",
    scope: "Product video, contact sheets, accessibility/localization summary, review proof, and stable hosting.",
    owns: ["supplemental-urls"],
    handoff: "Five registered HTTPS URLs and refreshed upload package.",
  },
  {
    id: "release-manager",
    scope: "Editorial board, submission gate, manual App Store Connect draft, and final nomination submit.",
    owns: ["editorial-submission"],
    handoff: "Manual submission after release-cycle and submission gates are ready.",
  },
];

const payload = {
  generatedAt: new Date().toISOString(),
  release: "Back to School with AI",
  status: finalSubmitReady ? "ready_for_manual_submit" : "blocked_execution_board",
  localExecutionReady: blockedCount === 0 && waitingCount === 0 && finalSubmitReady,
  summary: {
    laneCount: lanes.length,
    readyCount,
    blockedCount,
    waitingCount,
    draftReadyCount,
    criticalLane: criticalLane?.id || null,
  },
  lanes,
  subagents,
  sourceArtifacts: paths,
  failures,
};

const laneTable = [
  "| Lane | Owner | Status | Next action |",
  "| --- | --- | --- | --- |",
  ...lanes.map((lane) => tableRow([lane.id, lane.owner, lane.status, lane.nextAction])),
].join("\n");

const subagentTable = [
  "| Subagent | Owns | Handoff |",
  "| --- | --- | --- |",
  ...subagents.map((subagent) => tableRow([subagent.id, subagent.owns.join(", "), subagent.handoff])),
].join("\n");

const details = lanes
  .map(
    (lane) => `### ${lane.id}

Owner: ${lane.owner}
Status: ${lane.status}
Objective: ${lane.objective}
Depends on: ${lane.dependsOn.length ? lane.dependsOn.join(", ") : "None"}
Next action: ${lane.nextAction}

Evidence:
${lane.evidence.map((item) => `- ${item}`).join("\n")}

Commands:
${lane.commands.map((command) => `- \`${command}\``).join("\n")}

Exit criteria:
${lane.exitCriteria.map((item) => `- ${item}`).join("\n")}

Blockers:
${lane.blockers.length ? lane.blockers.map((item) => `- ${item}`).join("\n") : "- None"}
`,
  )
  .join("\n");

const markdown = `# Back-to-School 2026 Execution Board

Generated: ${payload.generatedAt}
Release: ${payload.release}
Status: ${payload.status}
Critical lane: ${payload.summary.criticalLane || "None"}

This board collapses the current launch, asset, editorial, upload, and submission blockers into ordered owner lanes. It does not mark external proof as done; it makes the remaining execution sequence explicit.

## Lane Summary

${laneTable}

## Subagent Lanes

${subagentTable}

## Lane Details

${details}
`;

mkdirSync(dirname(OUTPUT_JSON_PATH), { recursive: true });
mkdirSync(dirname(OUTPUT_MARKDOWN_PATH), { recursive: true });
writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(OUTPUT_MARKDOWN_PATH, markdown);

if (failures.length) {
  console.error("Back-to-School execution board failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Back-to-School execution board ${payload.status}. Critical lane: ${
    payload.summary.criticalLane || "none"
  }. Wrote ${OUTPUT_JSON_PATH} and ${OUTPUT_MARKDOWN_PATH}.`,
);
