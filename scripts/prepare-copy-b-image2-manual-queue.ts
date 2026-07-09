import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

type ExpectedSlide = {
  index: number;
  file: string;
  uiReference: string;
  localeUiReferencePattern?: string;
  extraUiReferences?: string[];
  extraLocaleUiReferencePatterns?: string[];
  directionReferences?: string[];
};

type LocaleCopy = {
  locale: string;
  slides: Record<string, { headline: string; subhead: string }>;
};

const PROMPT_PACK_PATH =
  "docs/launch/back-to-school-2026/app-store-connect-final-upload/outcome-copy-b-image-2-mac-prompts.md";
const FINAL_ROOT = "store/apple/screenshot-copy-b-image-2";
const LOGO_PATH = "assets/app/study-planner-icon.png";
const DEVICE_DIR = "APP_IPHONE_65";
const PROVENANCE_PATH =
  "docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-provenance.json";
const QUEUE_JSON_PATH =
  "docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-manual-queue.json";
const QUEUE_JSONL_PATH =
  "docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-manual-queue.jsonl";
const PROVENANCE_TEMPLATE_PATH =
  "docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-provenance.template.json";
const AUDIT_PATH = "qa/back-to-school-2026/copy-b-image2-manual-queue-audit.json";

const REQUIRED_WIDTH = 1242;
const REQUIRED_HEIGHT = 2688;
const EXACT_REQUIRED_PROMPT_PREFIX =
  "GPT Image 2.0, create exactly one final PNG App Store screenshot for StudyPlanner at exactly 1242 pixels wide by 2688 pixels tall. The retrievable saved PNG file must measure exactly 1242x2688 when checked with sips. Do not output 853x1844, 852x1846, 1024x1792, 1170x2532, any preview-sized image, or any scaled image.";

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
    uiReference: "qa-screenshots/back-to-school-2026-native-localized-current/en-US/app-00-scan-current.png",
    localeUiReferencePattern:
      "qa-screenshots/back-to-school-2026-native-localized-current/{locale}/app-00-scan-current.png",
    extraLocaleUiReferencePatterns: [
      "qa-screenshots/back-to-school-2026-native-localized-current/{locale}/app-06-review.png",
    ],
    directionReferences: [
      "docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/04-latest-scan-ui-reference.jpg",
      "docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/02-scan-anything-direction.jpg",
      "docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/03-scan-syllabus-direction.jpg",
    ],
  },
  {
    index: 2,
    file: "02-approve-deadlines.png",
    uiReference: "qa-screenshots/back-to-school-2026-native-localized-current/en-US/app-06-review.png",
    localeUiReferencePattern:
      "qa-screenshots/back-to-school-2026-native-localized-current/{locale}/app-06-review.png",
    extraLocaleUiReferencePatterns: [
      "qa-screenshots/back-to-school-2026-native-localized-current/{locale}/app-00-scan-current.png",
    ],
    directionReferences: [
      "docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/02-scan-anything-direction.jpg",
      "docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/04-latest-scan-ui-reference.jpg",
    ],
  },
  {
    index: 3,
    file: "03-semester-built.png",
    uiReference: "qa-screenshots/back-to-school-2026-native-localized-current/en-US/app-07-semester-ready.png",
    localeUiReferencePattern:
      "qa-screenshots/back-to-school-2026-native-localized-current/{locale}/app-07-semester-ready.png",
    extraLocaleUiReferencePatterns: [
      "qa-screenshots/back-to-school-2026-native-localized-current/{locale}/app-08-today.png",
    ],
    directionReferences: [
      "docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/01-today-next-move-direction.jpg",
      "docs/launch/back-to-school-2026/app-store-connect-final-upload/reference/copy-b-first-three-direction/04-latest-scan-ui-reference.jpg",
    ],
  },
  {
    index: 4,
    file: "04-today-next-move.png",
    uiReference: "qa-screenshots/back-to-school-2026-native-localized-current/en-US/app-08-today.png",
    localeUiReferencePattern:
      "qa-screenshots/back-to-school-2026-native-localized-current/{locale}/app-08-today.png",
  },
  {
    index: 5,
    file: "05-study-blocks.png",
    uiReference: "qa-screenshots/back-to-school-2026-native-localized-current/en-US/app-09-focus.png",
    localeUiReferencePattern:
      "qa-screenshots/back-to-school-2026-native-localized-current/{locale}/app-09-focus.png",
  },
  {
    index: 6,
    file: "06-widgets-sync.png",
    uiReference: "store/apple/screenshot-pop/en-US/APP_IPHONE_65/07-real-home-screen-widgets.png",
    localeUiReferencePattern:
      "store/apple/screenshot-pop/{locale}/APP_IPHONE_65/07-real-home-screen-widgets.png",
  },
  {
    index: 7,
    file: "07-home-screen-widgets.png",
    uiReference: "store/apple/screenshot-pop/en-US/APP_IPHONE_65/07-real-home-screen-widgets.png",
    localeUiReferencePattern:
      "store/apple/screenshot-pop/{locale}/APP_IPHONE_65/07-real-home-screen-widgets.png",
  },
];

const requiredProvenanceFlags = [
  "generatedInChatGPTMacApp",
  "gptImage2",
  "attachedRealLogo",
  "attachedRealUiReference",
  "generatedIndividually",
  "humanAccepted",
] as const;

const failures: string[] = [];

function expect(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

function readRequiredText(path: string) {
  expect(existsSync(path), `Missing required file: ${path}`);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function splitMarkdownRow(line: string) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return [];
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function parseLocaleCopyTable(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.startsWith("| Locale |"));
  expect(headerIndex >= 0, "Prompt pack is missing the locale copy table header");
  if (headerIndex < 0) return new Map<string, LocaleCopy>();

  const headers = splitMarkdownRow(lines[headerIndex]);
  const entries = new Map<string, LocaleCopy>();

  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith("|")) break;
    const cells = splitMarkdownRow(line);
    if (cells.length !== headers.length) continue;

    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
    const locale = row.Locale;
    if (!locale) continue;

    const slides: LocaleCopy["slides"] = {};
    for (const slide of expectedSlides) {
      slides[String(slide.index)] = {
        headline: row[`${slide.index} Headline`] || "",
        subhead: row[`${slide.index} Subhead`] || "",
      };
    }
    entries.set(locale, { locale, slides });
  }

  return entries;
}

function extractPromptSection(markdown: string, slide: ExpectedSlide) {
  const heading = `### ${slide.index}. \`${slide.file}\``;
  const start = markdown.indexOf(heading);
  expect(start >= 0, `Prompt pack is missing slide section: ${heading}`);
  if (start < 0) return "";

  const nextSlide = markdown.indexOf(`### ${slide.index + 1}.`, start + heading.length);
  const localeTable = markdown.indexOf("## Locale Copy Table", start + heading.length);
  const endCandidates = [nextSlide, localeTable].filter((index) => index >= 0);
  const end = endCandidates.length ? Math.min(...endCandidates) : markdown.length;
  return markdown.slice(start, end).trim();
}

function extractPromptText(section: string) {
  const match = section.match(/```text\n([\s\S]*?)\n```/);
  expect(Boolean(match), "Prompt section is missing a text code fence");
  return match?.[1]?.trim() || section;
}

function localizedUiReference(slide: ExpectedSlide, locale: string) {
  return slide.localeUiReferencePattern?.replace("{locale}", locale) || slide.uiReference;
}

function uiReferencesForSlide(slide: ExpectedSlide, locale = "en-US") {
  const localizedExtras = (slide.extraLocaleUiReferencePatterns || []).map((pattern) =>
    pattern.replace("{locale}", locale),
  );
  return [localizedUiReference(slide, locale), ...(slide.extraUiReferences || []), ...localizedExtras];
}

function directionReferencesForSlide(slide: ExpectedSlide) {
  return slide.directionReferences || [];
}

function allReferencesForSlide(slide: ExpectedSlide, locale = "en-US") {
  return [...uiReferencesForSlide(slide, locale), ...directionReferencesForSlide(slide)];
}

function localizedPromptSection(section: string, locale: string, copy?: { headline: string; subhead: string }) {
  if (!copy?.headline || !copy.subhead) return section;

  const textDirection =
    locale === "ar-SA"
      ? "Render the external headline and subhead in Arabic, right-to-left text direction, right-aligned. Do not left-align Arabic text."
      : "Render the exact localized headline and subhead below. Do not use the English fallback headline or subhead.";

  return section
    .replaceAll("{locale}", locale)
    .replace(
      "External marketing text:",
      `External marketing text (render exactly for ${locale}; no English fallback):\n${textDirection}`,
    )
    .replace(/Headline: .*\nSubhead: .*/m, `Headline: ${copy.headline}\nSubhead: ${copy.subhead}`)
    .replace(
      "Keep all text readable and professionally spaced.",
      "Keep the external headline and subhead inside the top 20-25% text area, fit the longest word without clipping, and keep all text readable and professionally spaced.",
    )
    .replace(
      "The UI must remain recognizably the attached real StudyPlanner UI, not a fake app screen.",
      "The UI must remain recognizably the attached real StudyPlanner UI, not a fake app screen. Pixel-lock the real product UI content as much as possible; only improve the surrounding App Store frame, lighting, depth, and external marketing text.",
    )
    .replace(
      "Keep the UI grounded in the attached real StudyPlanner screenshot.",
      "Keep the UI grounded in the attached real StudyPlanner screenshot. Pixel-lock the real product UI content as much as possible; only improve the surrounding App Store frame, lighting, depth, and external marketing text.",
    )
    .replace(
      "Preserve the real widgets screen content enough that it is clearly the attached localized StudyPlanner widgets proof.",
      "Pixel-lock the real localized widgets screen content as much as possible so it is clearly the attached StudyPlanner widgets proof; only improve the surrounding App Store frame, lighting, depth, and external marketing text.",
    );
}

const promptPack = readRequiredText(PROMPT_PACK_PATH);
const localeCopy = parseLocaleCopyTable(promptPack);

expect(promptPack.includes("ChatGPT Mac app"), "Prompt pack must require ChatGPT Mac app generation");
expect(promptPack.includes("GPT Image 2.0"), "Prompt pack must require GPT Image 2.0");
expect(
  promptPack.includes("Generate exactly one screenshot per prompt"),
  "Prompt pack must require one screenshot per prompt",
);
expect(
  promptPack.includes("Do not use the local deterministic renderer"),
  "Prompt pack must reject local deterministic rendering",
);
expect(existsSync(LOGO_PATH), `Missing real logo reference: ${LOGO_PATH}`);

for (const locale of expectedLocales) {
  const copy = localeCopy.get(locale);
  expect(Boolean(copy), `Locale table missing ${locale}`);
  for (const slide of expectedSlides) {
    expect(Boolean(copy?.slides[String(slide.index)]?.headline), `Locale ${locale} missing slide ${slide.index} headline`);
    expect(Boolean(copy?.slides[String(slide.index)]?.subhead), `Locale ${locale} missing slide ${slide.index} subhead`);
  }
}

const slideSections = new Map(expectedSlides.map((slide) => [slide.file, extractPromptSection(promptPack, slide)]));
for (const slide of expectedSlides) {
  const promptReferences = [
    slide.localeUiReferencePattern || slide.uiReference,
    ...(slide.extraUiReferences || []),
    ...(slide.extraLocaleUiReferencePatterns || []),
    ...directionReferencesForSlide(slide),
  ];

  for (const reference of allReferencesForSlide(slide)) {
    expect(existsSync(reference), `Missing required reference: ${reference}`);
  }
  for (const promptReference of promptReferences) {
    expect(promptPack.includes(promptReference), `Prompt pack does not name reference: ${promptReference}`);
  }
  if (slide.localeUiReferencePattern) {
    for (const locale of expectedLocales) {
      const localizedReference = localizedUiReference(slide, locale);
      expect(existsSync(localizedReference), `Missing locale-specific reference for ${locale}: ${localizedReference}`);
    }
  }
  for (const pattern of slide.extraLocaleUiReferencePatterns || []) {
    for (const locale of expectedLocales) {
      const localizedReference = pattern.replace("{locale}", locale);
      expect(existsSync(localizedReference), `Missing locale-specific extra reference for ${locale}: ${localizedReference}`);
    }
  }
}

const queue = expectedLocales.flatMap((locale) =>
  expectedSlides.map((slide) => {
    const localizedMarketingText = localeCopy.get(locale)?.slides[String(slide.index)];
    const promptSection = localizedPromptSection(slideSections.get(slide.file) || "", locale, localizedMarketingText);
    const promptText = extractPromptText(promptSection);
    const uiReferences = uiReferencesForSlide(slide, locale);
    const directionReferences = directionReferencesForSlide(slide);

    return {
      jobId: `${locale}-${String(slide.index).padStart(2, "0")}`,
      locale,
      slideIndex: slide.index,
      file: slide.file,
      outputPath: join(FINAL_ROOT, locale, DEVICE_DIR, slide.file),
      requiredDimensions: { width: REQUIRED_WIDTH, height: REQUIRED_HEIGHT },
      generationSurface: "ChatGPT Mac app",
      model: "GPT Image 2.0",
      finalizationMode: "generate individually in ChatGPT Mac app with GPT Image 2.0",
      generatedIndividuallyRequired: true,
      promptPack: PROMPT_PACK_PATH,
      promptHeading: `### ${slide.index}. \`${slide.file}\``,
      promptSection,
      prompt: promptText,
      localizedMarketingText,
      sourceScreenshot: uiReferences[0],
      sourceScreenshots: uiReferences,
      directionReferences,
      textDirection: locale === "ar-SA" ? "rtl" : "ltr",
      attachments: [
        { role: "realLogo", path: LOGO_PATH, required: true },
        ...uiReferences.map((path, index) => ({
          role: index === 0 ? "realUiReference" : `realUiReference${index + 1}`,
          path,
          required: true,
        })),
        ...directionReferences.map((path, index) => ({
          role: `directionReference${index + 1}`,
          path,
          required: true,
        })),
      ],
      rejectionRules: [
        "Reject if it was not generated in the ChatGPT Mac app.",
        "Reject if it was not generated with GPT Image 2.0.",
        ...(slide.file === "07-home-screen-widgets.png"
          ? ["Reject if it shows the in-app Widgets or Recommended widgets screen instead of real Home Screen widgets."]
          : []),
        "Reject if it was batch-generated with any other locale or slide.",
        "Reject if the real app logo was not attached or was redrawn, recolored, replaced, or altered.",
        "Reject if the real UI reference was not attached or product UI facts drifted.",
        "Reject if the PNG is not exactly 1242x2688.",
        "Reject if the external headline/subhead are not the localized text for this job.",
        "Reject ar-SA output if Arabic text is not right-to-left and right-aligned.",
        "Reject if text clips, overlaps, or becomes unreadable.",
      ],
      provenanceRequired: Object.fromEntries(requiredProvenanceFlags.map((flag) => [flag, true])),
    };
  }),
);

for (const item of queue) {
  expect(Boolean(item.localizedMarketingText), `Queue job ${item.jobId} is missing localized marketing text`);
  if (item.localizedMarketingText) {
    expect(
      item.promptSection.includes(`Headline: ${item.localizedMarketingText.headline}`),
      `Queue job ${item.jobId} prompt missing localized headline`,
    );
    expect(
      item.promptSection.includes(`Subhead: ${item.localizedMarketingText.subhead}`),
      `Queue job ${item.jobId} prompt missing localized subhead`,
    );
  }
  expect(
    item.prompt.startsWith(EXACT_REQUIRED_PROMPT_PREFIX),
    `Queue job ${item.jobId} prompt does not start with the exact required dimension-lock prefix`,
  );
  if (item.locale === "ar-SA") {
    expect(item.promptSection.includes("right-to-left") && item.promptSection.includes("right-aligned"), `Queue job ${item.jobId} missing RTL instruction`);
  }
}

const provenanceTemplate = {
  instructions:
    "This is a template only. Do not rename or copy it to copy-b-image2-provenance.json until every final PNG is saved and every boolean below is true after human review.",
  finalProvenancePath: PROVENANCE_PATH,
  entries: queue.map((item) => ({
    locale: item.locale,
    file: item.file,
    generatedInChatGPTMacApp: false,
    gptImage2: false,
    attachedRealLogo: false,
    attachedRealUiReference: false,
    generatedIndividually: false,
    humanAccepted: false,
    notes: "",
  })),
};

const audit = {
  generatedAt: new Date().toISOString(),
  status: failures.length ? "blocked" : "ready-for-manual-chatgpt-mac-app-generation",
  promptPack: PROMPT_PACK_PATH,
  queueJson: QUEUE_JSON_PATH,
  queueJsonl: QUEUE_JSONL_PATH,
  provenanceTemplate: PROVENANCE_TEMPLATE_PATH,
  finalProvenancePath: PROVENANCE_PATH,
  finalOutputRoot: FINAL_ROOT,
  expected: {
    locales: expectedLocales.length,
    slides: expectedSlides.length,
    jobs: expectedLocales.length * expectedSlides.length,
    image2Jobs: expectedLocales.length * expectedSlides.length,
    realWidgetSourceJobs: 0,
    dimensions: `${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}`,
  },
  constraints: {
    generationSurface: "ChatGPT Mac app for all slides, with real localized Home Screen WidgetKit source attached for slide 7",
    model: "GPT Image 2.0",
    generatedIndividually: true,
    finalImagesGeneratedByThisScript: false,
  },
  failures,
};

mkdirSync(dirname(QUEUE_JSON_PATH), { recursive: true });
mkdirSync(dirname(AUDIT_PATH), { recursive: true });
writeFileSync(
  QUEUE_JSON_PATH,
  `${JSON.stringify(
    {
      generatedAt: audit.generatedAt,
      status: audit.status,
      instructions:
        "Run every slide individually in the ChatGPT Mac app with GPT Image 2.0. For slide 7, attach the exact locale-specific real Home Screen WidgetKit source as the UI reference and reject in-app widget screens. Attach the real logo and every slide-specific real UI reference before generation.",
      finalValidationCommand: "npm run check:copy-b-image2",
      jobs: queue,
    },
    null,
    2,
  )}\n`,
);
writeFileSync(QUEUE_JSONL_PATH, `${queue.map((item) => JSON.stringify(item)).join("\n")}\n`);
writeFileSync(PROVENANCE_TEMPLATE_PATH, `${JSON.stringify(provenanceTemplate, null, 2)}\n`);
writeFileSync(AUDIT_PATH, `${JSON.stringify(audit, null, 2)}\n`);

if (failures.length) {
  console.error("Copy B GPT Image 2.0 manual queue checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`Audit written to ${AUDIT_PATH}`);
  process.exit(1);
}

console.log(
  `Prepared ${queue.length} Copy B jobs: ${expectedLocales.length * expectedSlides.length} ChatGPT Mac app / GPT Image 2.0 jobs`,
);
console.log(`Queue written to ${QUEUE_JSON_PATH}`);
console.log(`JSONL written to ${QUEUE_JSONL_PATH}`);
console.log(`Provenance template written to ${PROVENANCE_TEMPLATE_PATH}`);
console.log(`Audit written to ${AUDIT_PATH}`);
