import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname } from "node:path";

type Candidate = {
  id: string;
  label: string;
  path: string;
  copies?: string[];
};

type ProbeStream = {
  codec_name?: string;
  codec_type?: string;
  profile?: string;
  level?: number;
  field_order?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string;
  r_frame_rate?: string;
  duration?: string;
  bit_rate?: string;
  channels?: number;
  channel_layout?: string;
  sample_rate?: string;
  disposition?: { default?: number };
};

type Probe = {
  streams?: ProbeStream[];
  format?: {
    duration?: string;
    size?: string;
    bit_rate?: string;
    format_name?: string;
  };
};

type CandidateReview = {
  id: string;
  label: string;
  path: string;
  exists: boolean;
  bytes?: number;
  sha256?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  fps?: number;
  codec?: string;
  profile?: string;
  level?: number;
  fieldOrder?: string;
  videoBitrateMbps?: number;
  audio?: {
    present: boolean;
    codec?: string;
    channels?: number;
    sampleRateHz?: number;
    bitrateKbps?: number;
  };
  extension?: string;
  portrait?: boolean;
  supplementalReady: boolean;
  appPreviewReady: boolean;
  evidence: string[];
  warnings: string[];
  blockers: string[];
};

const OUTPUT_JSON_PATH = "qa/back-to-school-2026/product-video-review.json";
const OUTPUT_MARKDOWN_PATH = "docs/launch/back-to-school-2026/product-video-review.md";
const RELEASE_COPY_PATH = "docs/launch/back-to-school-2026/release-notes-and-launch-copy.md";
const NOMINATION_PATH = "docs/launch/back-to-school-2026/app-store-nomination-packet.md";
const APP_PREVIEW_SPEC_URL = "https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications/";

const candidates: Candidate[] = [
  {
    id: "scanner-demo-final",
    label: "Final scanner demo",
    path: "marketing/social-launch-video/final/studyplanner-scanner-demo-app-preview-1080x1920.mp4",
    copies: [
      "docs/launch/back-to-school-2026/draft-upload-package/supplemental/product-video/studyplanner-scanner-demo-app-preview-1080x1920.mp4",
    ],
  },
  {
    id: "build66-final",
    label: "Build 66 final app preview",
    path: "marketing/social-launch-video/build66-final/build66-studyplanner-app-preview-1080x1920.mp4",
    copies: [
      "docs/launch/back-to-school-2026/draft-upload-package/supplemental/product-video/build66-studyplanner-app-preview-1080x1920.mp4",
    ],
  },
  {
    id: "build66-produced",
    label: "Build 66 produced app preview",
    path: "marketing/social-launch-video/build66-produced/studyplanner-build66-produced-app-store-1080x1920.mp4",
    copies: [
      "docs/launch/back-to-school-2026/draft-upload-package/supplemental/product-video/studyplanner-build66-produced-app-store-1080x1920.mp4",
    ],
  },
];

// The release targets the App Store Connect APP_IPHONE_65 portrait slot. Apple's
// current accepted portrait export for that slot is 886x1920; 1080x1920 is a
// useful social/supplemental master, but it is not an upload-ready App Preview
// for this slot.
const appPreviewPortraitResolutions = new Set(["886x1920"]);
const maxAppPreviewBytes = 500 * 1024 * 1024;
const h264TargetBitrate = { minimum: 10_000_000, maximum: 12_000_000 };
const aacTargetBitrate = { minimum: 240_000, maximum: 272_000 };

function read(path: string) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function hashFile(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function parseRate(rate?: string) {
  if (!rate || !rate.includes("/")) return Number(rate || 0) || 0;
  const [rawNumerator, rawDenominator] = rate.split("/");
  const numerator = Number(rawNumerator);
  const denominator = Number(rawDenominator);
  if (!numerator || !denominator) return 0;
  return numerator / denominator;
}

function ffprobe(path: string): Probe | null {
  try {
    const output = execFileSync("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", path], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return JSON.parse(output) as Probe;
  } catch {
    return null;
  }
}

function reviewCandidate(candidate: Candidate): CandidateReview {
  if (!existsSync(candidate.path)) {
    return {
      ...candidate,
      exists: false,
      supplementalReady: false,
      appPreviewReady: false,
      evidence: [],
      warnings: [],
      blockers: ["Video file is missing."],
    };
  }

  const stat = statSync(candidate.path);
  const probe = ffprobe(candidate.path);
  const video = probe?.streams?.find((stream) => stream.codec_type === "video");
  const audio = probe?.streams?.find((stream) => stream.codec_type === "audio");
  const extension = extname(candidate.path).replace(".", "").toLowerCase();
  const durationSeconds = Number(probe?.format?.duration || video?.duration || 0);
  const fps = parseRate(video?.avg_frame_rate || video?.r_frame_rate);
  const width = video?.width || 0;
  const height = video?.height || 0;
  const codec = video?.codec_name || "unknown";
  const profile = video?.profile || "unknown";
  const level = Number(video?.level || 0);
  const fieldOrder = video?.field_order || "unknown";
  const videoBitrate = Number(video?.bit_rate || 0);
  const audioBitrate = Number(audio?.bit_rate || 0);
  const audioSampleRate = Number(audio?.sample_rate || 0);
  const portrait = height > width;
  const sizeReady = stat.size > 0 && stat.size <= maxAppPreviewBytes;
  const durationReady = durationSeconds >= 15 && durationSeconds <= 30;
  const extensionReady = ["mp4", "mov", "m4v"].includes(extension);
  const codecReady = ["h264", "prores"].includes(codec);
  const portraitReady = portrait && width >= 886 && height >= 1600;
  const appPreviewResolutionReady = appPreviewPortraitResolutions.has(`${width}x${height}`);
  const appPreviewFrameRateReady = fps > 0 && fps <= 30;
  const h264ProfileReady = codec !== "h264" || ["Baseline", "Constrained Baseline", "Main", "High"].includes(profile);
  const h264LevelReady = codec !== "h264" || (level > 0 && level <= 40);
  const appPreviewBitrateReady = codec !== "h264" || (videoBitrate >= h264TargetBitrate.minimum && videoBitrate <= h264TargetBitrate.maximum);
  const appPreviewProgressiveReady = fieldOrder === "progressive";
  const appPreviewAudioReady = !audio || (
    audio.codec_name === "aac" &&
    audio.channels === 2 &&
    [44_100, 48_000].includes(audioSampleRate) &&
    audioBitrate >= aacTargetBitrate.minimum &&
    audioBitrate <= aacTargetBitrate.maximum
  );
  const allTracksEnabled = (probe?.streams || []).every((stream) => stream.disposition?.default !== 0);
  const supplementalReady = sizeReady && durationReady && extensionReady && codecReady && portraitReady;
  const appPreviewReady = supplementalReady && appPreviewResolutionReady && appPreviewFrameRateReady &&
    h264ProfileReady && h264LevelReady && appPreviewBitrateReady && appPreviewProgressiveReady &&
    appPreviewAudioReady && allTracksEnabled;

  const evidence = [
    `${width}x${height} ${portrait ? "portrait" : "landscape"}`,
    `${durationSeconds.toFixed(2)} seconds`,
    `${fps.toFixed(2)} fps`,
    `${codec} ${profile} level ${level || "unknown"} · ${fieldOrder}`,
    `${(videoBitrate / 1_000_000).toFixed(3)} Mbps video`,
    audio ? `${audio.codec_name || "unknown"} ${audio.channels || 0}ch ${audioSampleRate || 0}Hz ${(audioBitrate / 1000).toFixed(1)} kbps` : "no audio track",
    extension.toUpperCase(),
    `${Math.round(stat.size / 1024)} KB`,
  ];
  const warnings = [];
  const blockers = [];

  if (!probe || !video) blockers.push("ffprobe could not read a video stream.");
  if (!sizeReady) blockers.push("Video must be non-empty and under 500 MB.");
  if (!durationReady) blockers.push("Video must be between 15 and 30 seconds for App Store preview parity.");
  if (!extensionReady) blockers.push("Video extension must be MP4, MOV, or M4V.");
  if (!codecReady) blockers.push("Video codec must be H.264 or ProRes for App Store preview parity.");
  if (!portraitReady) blockers.push("Video must be a portrait iPhone-format product demo.");
  if (!appPreviewFrameRateReady) warnings.push("Not App Preview-ready: Apple app previews max out at 30fps; this export should stay supplemental unless re-exported.");
  if (!appPreviewResolutionReady) {
    warnings.push(
      `Not App Preview-ready for APP_IPHONE_65: ${width}x${height} must be re-exported at 886x1920.`,
    );
  }
  if (!h264ProfileReady || !h264LevelReady) warnings.push(`Not App Preview-ready: H.264 must be Baseline/Main/High at level 4.0 or lower; found ${profile} level ${level || "unknown"}.`);
  if (!appPreviewBitrateReady) warnings.push(`Not App Preview-ready: H.264 target video bitrate is 10-12 Mbps; found ${(videoBitrate / 1_000_000).toFixed(3)} Mbps.`);
  if (!appPreviewProgressiveReady) warnings.push(`Not App Preview-ready: video must be progressive; found ${fieldOrder}.`);
  if (!appPreviewAudioReady) warnings.push("Not App Preview-ready: when audio is present it must be stereo AAC near 256 kbps at 44.1 or 48 kHz.");
  if (!allTracksEnabled) warnings.push("Not App Preview-ready: every video and audio track must be enabled.");

  return {
    ...candidate,
    exists: true,
    bytes: stat.size,
    sha256: hashFile(candidate.path),
    width,
    height,
    durationSeconds,
    fps,
    codec,
    profile,
    level,
    fieldOrder,
    videoBitrateMbps: videoBitrate / 1_000_000,
    audio: {
      present: Boolean(audio),
      codec: audio?.codec_name,
      channels: audio?.channels,
      sampleRateHz: audioSampleRate || undefined,
      bitrateKbps: audioBitrate ? audioBitrate / 1000 : undefined,
    },
    extension,
    portrait,
    supplementalReady,
    appPreviewReady,
    evidence,
    warnings,
    blockers,
  };
}

function markdownTable(reviews: CandidateReview[]) {
  const rows = [
    "| Candidate | Status | App Preview Ready | Evidence | Warnings |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const review of reviews) {
    rows.push(
      `| ${review.label} | ${review.supplementalReady ? "supplemental_ready" : "blocked"} | ${
        review.appPreviewReady ? "yes" : "no"
      } | ${review.evidence.join("<br>") || "Missing"} | ${review.warnings.concat(review.blockers).join("<br>") || "None"} |`,
    );
  }
  return rows.join("\n");
}

const reviews = candidates.map(reviewCandidate);
const blockedExistingAppPreviewPaths = candidates.flatMap((candidate) => [candidate.path, ...(candidate.copies || [])]);
const primaryCandidate = reviews.find((review) => review.id === "scanner-demo-final") || reviews.find((review) => review.supplementalReady) || reviews[0];
const releaseCopy = read(RELEASE_COPY_PATH);
const nominationCopy = read(NOMINATION_PATH);
const narrativeReady =
  releaseCopy.includes("Back to School with AI") &&
  releaseCopy.includes("white setup with automatic class colors") &&
  releaseCopy.includes("recommended widgets") &&
  nominationCopy.includes("Back-to-School Semester Kickoff") &&
  nominationCopy.includes("syllabus") &&
  nominationCopy.includes("review");
const status = primaryCandidate?.supplementalReady && narrativeReady ? "legacy_supporting_approved" : "blocked";
const blockers = [];
if (!primaryCandidate?.supplementalReady) blockers.push("No technically valid local product-video candidate is available.");
if (!narrativeReady) blockers.push("Release and nomination copy must still carry the Back-to-School story before approving the video.");
const warnings = [
  ...(primaryCandidate?.warnings || []),
  "All existing 1080x1920 candidates are supplemental-only and must not be uploaded to the APP_IPHONE_65 App Preview slot.",
  "Replace them with current-binary 886x1920 progressive footage at 30fps or lower, H.264 High Profile level 4.0 or lower at a 10-12 Mbps target, and compliant stereo AAC if audio is present.",
];

const payload = {
  generatedAt: new Date().toISOString(),
  release: "Back to School with AI",
  status,
  role: "Supplemental featuring nomination product-video candidate",
  appPreviewReady: primaryCandidate?.appPreviewReady === true,
  appStoreConnectSlot: {
    device: "APP_IPHONE_65",
    requiredPortraitResolution: "886x1920",
    maximumFps: 30,
    progressive: true,
    h264TargetBitrateMbps: "10-12",
    h264MaximumProfileAndLevel: "High Profile 4.0",
    optionalAudio: "stereo AAC near 256 kbps at 44.1 or 48 kHz",
    uploadApproved: false,
    blockedExistingPaths: blockedExistingAppPreviewPaths,
  },
  sourceDocs: [APP_PREVIEW_SPEC_URL],
  primaryCandidate,
  narrativeReady,
  candidates: reviews,
  blockers,
  warnings,
};

const markdown = `# Back-to-School 2026 Product Video Review

Generated: ${payload.generatedAt}
Status: ${payload.status}
Role: ${payload.role}
App Preview ready: ${payload.appPreviewReady ? "yes" : "no"}

This review approves the existing scanner video only as a supplemental featuring URL candidate. None of the three 1080x1920 binaries—or their three draft-package copies—is approved for an App Store Connect App Preview upload: the current APP_IPHONE_65 portrait slot requires 886x1920, two canonical binaries exceed 30fps, and all H.264 bitrates are far below Apple's 10-12 Mbps target. It does not replace final native screenshots, WidgetKit proof, or a separate current-binary App Preview export.

Required App Store Connect export: \`886x1920\`, 15-30 seconds, 30fps or lower, progressive H.264 up to High Profile 4.0 at a 10-12 Mbps target, with compliant stereo AAC if audio is present. Upload approved: **no**.

## Primary Candidate

- Path: \`${payload.primaryCandidate?.path || "missing"}\`
- SHA-256: \`${payload.primaryCandidate?.sha256 || "missing"}\`
- Evidence: ${payload.primaryCandidate?.evidence.join("; ") || "missing"}

## Candidate Matrix

${markdownTable(reviews)}

## Blockers

${blockers.length ? blockers.map((blocker) => `- ${blocker}`).join("\n") : "- None for supplemental product-video candidacy."}

## Warnings

${warnings.map((warning) => `- ${warning}`).join("\n")}

## Source

- ${APP_PREVIEW_SPEC_URL}
`;

mkdirSync(dirname(OUTPUT_JSON_PATH), { recursive: true });
mkdirSync(dirname(OUTPUT_MARKDOWN_PATH), { recursive: true });
writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`);
writeFileSync(OUTPUT_MARKDOWN_PATH, markdown);

console.log(`Back-to-School product video review ${status}. Wrote ${OUTPUT_JSON_PATH} and ${OUTPUT_MARKDOWN_PATH}.`);
