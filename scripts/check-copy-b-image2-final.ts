import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

type ExpectedSlide = {
  index: number;
  file: string;
  uiReference: string;
};

type ProvenanceEntry = {
  locale?: string;
  file?: string;
  generatedInChatGPTMacApp?: boolean;
  gptImage2?: boolean;
  attachedRealLogo?: boolean;
  attachedRealUiReference?: boolean;
  generatedIndividually?: boolean;
  humanAccepted?: boolean;
  notes?: string;
};

type ProvenanceRegistry = {
  entries?: ProvenanceEntry[];
};

const FINAL_ROOT = "store/apple/screenshot-copy-b-image-2";
const SCRATCH_ROOT = "store/apple/screenshot-copy-b-outcomes";
const DISQUALIFIED_ROOTS = [
  "store/apple/screenshot-copy-b-outcomes",
  "store/apple/screenshot-copy-b-latest-build",
  "store/apple/screenshot-copy-b",
  "store/apple/screenshot-copy-b-creative",
  "store/apple/screenshot-copy-b-reference-inspired",
  "qa/back-to-school-2026/chatgpt-copy-b-candidates",
  "qa/back-to-school-2026/creative-copy-b-candidates",
  "qa/back-to-school-2026/reference-inspired-copy-b-candidates",
] as const;
const PROMPT_PACK_PATH =
  "docs/launch/back-to-school-2026/app-store-connect-final-upload/outcome-copy-b-image-2-mac-prompts.md";
const PROVENANCE_PATH =
  "docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-provenance.json";
const AUDIT_PATH = "qa/back-to-school-2026/copy-b-image2-final-audit.json";

const REQUIRED_WIDTH = 1242;
const REQUIRED_HEIGHT = 2688;
const DEVICE_DIR = "APP_IPHONE_65";

const expectedLocales = [
  "en-US",
  "en-CA",
  "en-GB",
  "en-AU",
  "de-DE",
  "es-ES",
  "es-MX",
  "fr-FR",
  "fr-CA",
  "pt-BR",
  "pt-PT",
  "ar-SA",
  "hi",
  "ja",
  "ko",
  "zh-Hans",
  "zh-Hant",
] as const;

const expectedSlides: ExpectedSlide[] = [
  {
    index: 1,
    file: "01-scan-syllabus-notes.png",
    uiReference:
      "docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/04-latest-scan-ui-reference.jpg",
  },
  {
    index: 2,
    file: "02-approve-deadlines.png",
    uiReference: "qa-screenshots/back-to-school-2026-native-color-system-v3/app-06-review.png",
  },
  {
    index: 3,
    file: "03-semester-built.png",
    uiReference: "qa-screenshots/back-to-school-2026-native-color-system-v3/app-07-semester-ready.png",
  },
  {
    index: 4,
    file: "04-today-next-move.png",
    uiReference: "qa-screenshots/back-to-school-2026-native/app-08-today.png",
  },
  {
    index: 5,
    file: "05-study-blocks.png",
    uiReference: "qa-screenshots/back-to-school-2026-native/app-09-focus.png",
  },
  {
    index: 6,
    file: "06-widgets-sync.png",
    uiReference: "qa-screenshots/back-to-school-2026-native/app-10-widgets.png",
  },
  {
    index: 7,
    file: "07-home-screen-widgets.png",
    uiReference: "qa-screenshots/back-to-school-2026-native/widget-02-normal-medium.png",
  },
];

const failures: string[] = [];
const warnings: string[] = [];

function expect(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function warn(condition: boolean, message: string) {
  if (!condition) warnings.push(message);
}

function readText(path: string) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch (error) {
    failures.push(`${path} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function isPng(buffer: Buffer) {
  return buffer.length > 24 && buffer.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
}

function pngDimensions(path: string) {
  const buffer = readFileSync(path);
  if (!isPng(buffer)) return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function listPngs(root: string) {
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
      } else if (entry.isFile() && entry.name.endsWith(".png")) {
        out.push(path);
      }
    }
  };
  walk(root);
  return out.sort();
}

function provenanceKey(locale: string, file: string) {
  return `${locale}/${file}`;
}

function acceptedProvenance(entry: ProvenanceEntry | undefined) {
  return Boolean(
    entry?.generatedInChatGPTMacApp &&
      entry.gptImage2 &&
      entry.attachedRealLogo &&
      entry.attachedRealUiReference &&
      entry.generatedIndividually &&
      entry.humanAccepted,
  );
}

const promptPack = readText(PROMPT_PACK_PATH);
const provenance = readJson<ProvenanceRegistry>(PROVENANCE_PATH);
const provenanceEntries = new Map(
  (provenance?.entries || [])
    .filter((entry) => entry.locale && entry.file)
    .map((entry) => [provenanceKey(String(entry.locale), String(entry.file)), entry]),
);

expect(promptPack.includes("ChatGPT Mac app"), "prompt pack must explicitly require ChatGPT Mac app generation");
expect(promptPack.includes("GPT Image 2.0"), "prompt pack must explicitly require GPT Image 2.0");
expect(promptPack.includes("Do not use the local deterministic renderer"), "prompt pack must reject local deterministic rendering");
expect(promptPack.includes("Do not save final Image 2.0 outputs into `store/apple/screenshot-copy-b-outcomes`"), "prompt pack must reject scratch output folder");
expect(promptPack.includes(FINAL_ROOT), "prompt pack must name the final Image 2.0 output root");

for (const locale of expectedLocales) {
  expect(promptPack.includes(`| ${locale} |`), `prompt pack locale table missing ${locale}`);
}

for (const slide of expectedSlides) {
  expect(promptPack.includes(`### ${slide.index}. \`${slide.file}\``), `prompt pack missing slide prompt for ${slide.file}`);
  expect(promptPack.includes(slide.uiReference), `prompt pack missing UI reference for ${slide.file}: ${slide.uiReference}`);
  expect(existsSync(slide.uiReference), `missing real UI reference: ${slide.uiReference}`);
}

expect(existsSync("assets/app/study-planner-icon.png"), "missing real app icon reference: assets/app/study-planner-icon.png");
expect(existsSync(FINAL_ROOT), `final Copy B root is missing: ${FINAL_ROOT}`);

const finalPngs = listPngs(FINAL_ROOT);
const scratchPngs = listPngs(SCRATCH_ROOT);
const disqualifiedRoots = DISQUALIFIED_ROOTS.map((root) => ({ root, pngs: listPngs(root) }));
const expectedCount = expectedLocales.length * expectedSlides.length;
const expectedPaths = new Set<string>();
const missing: string[] = [];
const invalid: { path: string; reason: string }[] = [];
const ready: string[] = [];
const provenanceMissing: string[] = [];
const provenanceRejected: string[] = [];

for (const locale of expectedLocales) {
  for (const slide of expectedSlides) {
    const path = join(FINAL_ROOT, locale, DEVICE_DIR, slide.file);
    expectedPaths.add(path);
    if (!existsSync(path)) {
      missing.push(path);
      continue;
    }
    const dimensions = pngDimensions(path);
    if (!dimensions) {
      invalid.push({ path, reason: "not a PNG" });
      continue;
    }
    if (dimensions.width !== REQUIRED_WIDTH || dimensions.height !== REQUIRED_HEIGHT) {
      invalid.push({ path, reason: `${dimensions.width}x${dimensions.height}, expected ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}` });
      continue;
    }
    const entry = provenanceEntries.get(provenanceKey(locale, slide.file));
    if (!entry) {
      provenanceMissing.push(path);
      continue;
    }
    if (!acceptedProvenance(entry)) {
      provenanceRejected.push(path);
      continue;
    }
    ready.push(path);
  }
}

const unexpected = finalPngs.filter((path) => !expectedPaths.has(path));
for (const path of unexpected) {
  invalid.push({ path, reason: "unexpected PNG outside the required locale/slide matrix" });
}

expect(finalPngs.length === expectedCount, `final Copy B root must contain ${expectedCount} PNGs, found ${finalPngs.length}`);
expect(missing.length === 0, `missing ${missing.length} required final Copy B PNGs`);
expect(invalid.length === 0, `invalid final Copy B PNGs: ${invalid.length}`);
expect(Boolean(provenance), `missing required human provenance registry: ${PROVENANCE_PATH}`);
expect(provenanceMissing.length === 0, `missing provenance entries for ${provenanceMissing.length} final PNGs`);
expect(provenanceRejected.length === 0, `unaccepted provenance entries for ${provenanceRejected.length} final PNGs`);
warn(scratchPngs.length === 0, `${SCRATCH_ROOT} contains ${scratchPngs.length} scratch PNGs; these are not accepted final B assets`);
for (const item of disqualifiedRoots) {
  warn(item.pngs.length === 0, `${item.root} contains ${item.pngs.length} disqualified Copy B PNGs; only ${FINAL_ROOT} can pass final B QA`);
}

const payload = {
  generatedAt: new Date().toISOString(),
  status: failures.length ? "blocked" : "ready",
  roots: {
    final: FINAL_ROOT,
    scratch: SCRATCH_ROOT,
  },
  expected: {
    locales: expectedLocales,
    slides: expectedSlides.map((slide) => slide.file),
    pngs: expectedCount,
    dimensions: `${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}`,
  },
  actual: {
    finalPngs: finalPngs.length,
    scratchPngs: scratchPngs.length,
    disqualifiedRoots: disqualifiedRoots.map((item) => ({
      root: item.root,
      pngs: item.pngs.length,
    })),
    readyPngs: ready.length,
    missingPngs: missing.length,
    invalidPngs: invalid.length,
    unexpectedPngs: unexpected.length,
    provenanceEntries: provenanceEntries.size,
    provenanceMissing: provenanceMissing.length,
    provenanceRejected: provenanceRejected.length,
  },
  machineVerifiableGates: {
    promptPackRequiresMacAppAndImage2: promptPack.includes("ChatGPT Mac app") && promptPack.includes("GPT Image 2.0"),
    promptPackRejectsLocalRenderer: promptPack.includes("Do not use the local deterministic renderer"),
    exactFileMatrixPresent: missing.length === 0 && unexpected.length === 0,
    allPngsExactSize: invalid.length === 0,
  },
  humanProvenanceGates: {
    registry: PROVENANCE_PATH,
    requiredPerImage: [
      "generatedInChatGPTMacApp",
      "gptImage2",
      "attachedRealLogo",
      "attachedRealUiReference",
      "generatedIndividually",
      "humanAccepted",
    ],
    allAccepted: provenanceMissing.length === 0 && provenanceRejected.length === 0 && ready.length === expectedCount,
  },
  failures,
  warnings,
  missing: missing.map((path) => relative(".", path)),
  invalid: invalid.map((item) => ({ ...item, path: relative(".", item.path) })),
  provenanceMissing: provenanceMissing.map((path) => relative(".", path)),
  provenanceRejected: provenanceRejected.map((path) => relative(".", path)),
  scratchExamples: scratchPngs.slice(0, 12).map((path) => relative(".", path)),
  disqualifiedExamples: disqualifiedRoots
    .flatMap((item) => item.pngs.slice(0, 4))
    .slice(0, 24)
    .map((path) => relative(".", path)),
};

mkdirSync(dirname(AUDIT_PATH), { recursive: true });
writeFileSync(AUDIT_PATH, `${JSON.stringify(payload, null, 2)}\n`);

if (failures.length) {
  console.error("Copy B GPT Image 2.0 final checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`Audit written to ${AUDIT_PATH}`);
  process.exit(1);
}

if (warnings.length) {
  console.warn("Copy B GPT Image 2.0 final warnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}

const bytes = finalPngs.reduce((total, path) => total + statSync(path).size, 0);
console.log(`Copy B GPT Image 2.0 final checks passed: ${ready.length}/${expectedCount} PNGs, ${bytes} bytes`);
console.log(`Audit written to ${AUDIT_PATH}`);
