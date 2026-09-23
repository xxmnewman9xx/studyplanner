#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";

const SOURCE_QUEUE_PATH = "qa/back-to-school-2026/asc-live-copy-b-gpt-image-2-prompts.json";
const REFERENCE_JPG_PATH =
  "qa/back-to-school-2026/reference-inspired-copy-b/references/calendly-style-reference-sheet.jpg";
const REFERENCE_PNG_PATH =
  "qa/back-to-school-2026/reference-inspired-copy-b/references/calendly-style-reference-sheet.png";
const OUTPUT_JSON_PATH = "qa/back-to-school-2026/reference-inspired-copy-b-gpt-image-2-prompts.json";
const OUTPUT_JSONL_PATH = "qa/back-to-school-2026/reference-inspired-copy-b-gpt-image-2-prompts.jsonl";
const OUTPUT_RUNBOOK_PATH = "docs/launch/back-to-school-2026/reference-inspired-copy-b-gpt-image-2-runbook.md";
const OUTPUT_REPORT_PATH = "docs/launch/back-to-school-2026/reference-inspired-copy-b-generation-report.md";

const generatedAt = "2026-07-07";
const release = "Back-to-School Semester Kickoff";

const slideDirections = [
  {
    slideIndex: 1,
    direction: "Turn any syllabus into a reviewed plan.",
    treatment:
      "White rounded preview plate, bold top headline, source phone proof dominant, subtle syllabus paper cues behind the locked device only.",
  },
  {
    slideIndex: 2,
    direction: "Know if your semester is on track.",
    treatment:
      "Calm progress energy, green confidence accent shapes behind the locked device, dashboard proof remains literal.",
  },
  {
    slideIndex: 3,
    direction: "Let deadlines become study blocks.",
    treatment:
      "Light blue and violet schedule arcs behind the locked device, enough motion to feel planned but not loud.",
  },
  {
    slideIndex: 4,
    direction: "Keep classes, tasks, and notes together.",
    treatment:
      "Organized stacked-card feeling around the locked screenshot, no extra UI panels and no invented task cards.",
  },
  {
    slideIndex: 5,
    direction: "Know what every class needs.",
    treatment:
      "Strong StudyPlanner blue accent, class-detail proof centered and untouched, clean white space.",
  },
  {
    slideIndex: 6,
    direction: "Turn notes into next actions.",
    treatment:
      "Quiet study-session material cues, non-readable paper texture only, notes UI remains from the live screenshot.",
  },
  {
    slideIndex: 7,
    direction: "Keep today on your Home Screen.",
    treatment:
      "Real WidgetKit and Home Screen proof only, polished background and depth, never invent or redraw widgets.",
  },
];

function run(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed:\n${result.stderr}`);
  }
  return result.stdout;
}

function ensureReferencePng() {
  if (!existsSync(REFERENCE_JPG_PATH)) {
    throw new Error(`Missing reference sheet: ${REFERENCE_JPG_PATH}`);
  }
  mkdirSync(dirname(REFERENCE_PNG_PATH), { recursive: true });
  run("sips", ["-s", "format", "png", REFERENCE_JPG_PATH, "--out", REFERENCE_PNG_PATH]);
}

function escapeMd(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function exactText(copy) {
  const lines = [copy.headline, copy.subheadline].filter(Boolean);
  if (copy.support) lines.push(copy.support);
  return lines.join("\n");
}

function makePrompt(item, direction) {
  const copy = item.externalCopyB;
  const supportLine = copy.support
    ? `Supporting copy, only if it fits as readable external marketing text without becoming tiny: "${copy.support}"`
    : "No supporting copy is required for this slide.";

  return `Use case: style-transfer + precise-object-edit
Asset type: App Store Connect Product Page Optimization Copy B candidate, iPhone 6.5 preview, GPT Image 2.0 in the ChatGPT Mac app
Locale: ${item.locale}
Slide ${item.slideIndex}: ${item.slideFile}

Input images:
- Image 1 is the current live App Store Connect preview and the source of truth for StudyPlanner product UI.
- Image 2 is a style reference only. Use its composition language: bright white rounded cards, bold benefit copy, floating real product UI, soft shadows, and a few saturated abstract edge shapes.

Primary request:
Edit Image 1 into a new Copy B preview in the "Real UI Pop Card" direction. Make it more engaging and creative than the current live preview by applying the style language from Image 2 around the existing product proof, while preserving the real StudyPlanner UI from Image 1 without fake UI or drift.

Copy B conversion direction:
${direction.direction}

Required external marketing text:
Primary headline: "${copy.headline}"
Secondary headline: "${copy.subheadline}"
${supportLine}

Visual treatment:
${direction.treatment}

Canvas and layout:
- Output exactly 1242x2688 pixels as one PNG.
- Keep the portrait App Store screenshot format.
- Use a white or very light off-white background, a rounded preview plate, premium Apple-native spacing, bold dark headline typography, and StudyPlanner blue/green/orange/violet accent shapes.
- Decorative color shapes must sit behind the real product proof, never over product UI.
- Keep the product proof clear and large enough to inspect.

Hard no-drift invariants:
- Preserve every visible app UI, WidgetKit UI, Home Screen pixel, status bar, app icon, course name, date, button, chart, phone geometry, and screenshot boundary from Image 1.
- Do not redraw, rewrite, translate, blur, crop, recolor, resize, or invent any StudyPlanner app screen or widget content.
- Do not add fake notifications, fake lock screens, fake app screens, fake widgets, fake LMS/school integrations, Apple logos, App Store UI, prices, awards, ratings, CTAs, or unsupported claims.
- Do not use Image 2's product, brand, UI text, calendar data, or notification content. Image 2 is visual inspiration only.
- No generated filler UI text anywhere inside the device or Home Screen area.
- If exact product UI preservation is not possible, return Image 1 unchanged rather than producing a fake product screenshot.
- If the two images conflict, prioritize Image 1's product UI and ignore Image 2's content.

Acceptance gate:
Reject the output if any StudyPlanner product UI or widget/Home Screen content differs from Image 1, or if the output is not exactly 1242x2688.`;
}

function makeRunbook(items) {
  const rows = items
    .map((item) => {
      return `| ${item.id} | ${item.locale} | ${item.slideIndex} | ${escapeMd(item.referenceInspiredDirection.direction)} | ${escapeMd(item.externalCopyB.headline)} |`;
    })
    .join("\n");

  return `# Reference-Inspired Copy B GPT Image 2.0 Runbook

Generated: ${generatedAt}
Release: ${release}

## Rule

This is the redirected Copy B cycle. Use the current live App Store Connect previews as Copy A/control and as the product UI source of truth. Use the attached Calendly-style references only for composition inspiration.

No fake UI or product drift is acceptable. A visually exciting output that redraws StudyPlanner UI is rejected.

## Source Images Per Prompt

Each queue item attaches two images:

1. The item-specific live ASC preview from \`store/apple/screenshot-pop/<locale>/APP_IPHONE_65/\`.
2. \`${REFERENCE_PNG_PATH}\` — style reference only.

## Minimum-Usage Canary

1. Generate \`refpop-en-US-01\` first with automated collect.
2. Accept it only if the collected PNG is exactly \`1242x2688\` and product UI has not drifted.
3. If it passes, parallel-send the first three en-US items without automated collect:

\`\`\`bash
node scripts/prompt-chatgpt-copy-b-queue.mjs \\
  --queue ${OUTPUT_JSON_PATH} \\
  --state qa/back-to-school-2026/reference-inspired-copy-b-fireforget-en-US-state.json \\
  --candidate-root qa/back-to-school-2026/reference-inspired-copy-b-candidates \\
  --locale en-US \\
  --limit 3 \\
  --send \\
  --force \\
  --wait-ms 3000
\`\`\`

Do not parallel-collect. Save or collect candidates one chat at a time and run the dimension/UI drift gate before moving any asset into \`store/apple/screenshot-copy-b-reference-inspired/\`.

## Nomination Rule

Do not block the Back-to-School In-App Event nomination on this Copy B cycle. Submit nomination from \`docs/launch/back-to-school-2026/app-store-connect-final-upload/\`. Use Copy B only as PPO/new preview exploration after a candidate passes QA.

## Queue

| ID | Locale | Slide | Direction | Primary Copy |
| --- | --- | ---: | --- | --- |
${rows}
`;
}

function makeReport(items) {
  return `# Reference-Inspired Copy B Generation Report

Generated: ${generatedAt}
Queue: \`${OUTPUT_JSON_PATH}\`

## Status

The Copy B cycle has been redirected to a **Real UI Pop Card** visual direction inspired by the supplied reference screenshots.

This queue uses two attachments per prompt: the current live ASC preview first for literal StudyPlanner UI, then the reference sheet for style only. It explicitly rejects any fake UI, invented widget, generated notification, or product-pixel drift.

## Current Proof Gate

Run \`refpop-en-US-01\` first. Continue to parallel prompt only after one candidate passes both gates:

- dimensions: exactly \`1242x2688\`
- product UI: no visible drift from the live ASC source

Prior GPT Image 2.0 proof attempts were rejected at \`853x1844\` / \`852x1846\`, so the full ${items.length}-item queue remains gated until this reference-inspired canary passes.

## Nomination Impact

This Copy B work is not a nomination blocker. The 10/10 nomination route is still the final-upload packet plus the current live App Store previews as Copy A/control.
`;
}

ensureReferencePng();

const source = JSON.parse(readFileSync(SOURCE_QUEUE_PATH, "utf8"));
const items = source.items.map((item) => {
  const direction = slideDirections[item.slideIndex - 1];
  if (!direction) throw new Error(`Missing reference direction for slide ${item.slideIndex}`);
  const id = `refpop-${item.id}`;
  const outputPathRecommended = `store/apple/screenshot-copy-b-reference-inspired/${item.locale}/APP_IPHONE_65/${item.slideFile}`;
  mkdirSync(dirname(outputPathRecommended), { recursive: true });
  return {
    ...item,
    id,
    copyTreatment: "B-reference-inspired",
    sourcePaths: [item.sourcePath, REFERENCE_PNG_PATH],
    requiredOutputSize: { width: 1242, height: 2688 },
    outputPathRecommended,
    mode: "two-image style reference + live ASC precise edit prompt",
    visualTerritory: "Real UI Pop Card",
    referenceInspiredDirection: direction,
    prompt: makePrompt(item, direction),
  };
});

mkdirSync(dirname(OUTPUT_JSON_PATH), { recursive: true });
mkdirSync(dirname(OUTPUT_RUNBOOK_PATH), { recursive: true });

writeFileSync(
  OUTPUT_JSON_PATH,
  `${JSON.stringify(
    {
      generatedAt,
      release,
      sourceQueuePath: SOURCE_QUEUE_PATH,
      referenceSheet: REFERENCE_PNG_PATH,
      treatment: "Reference-Inspired Copy B",
      totalItems: items.length,
      locales: [...new Set(items.map((item) => item.locale))],
      slidesPerLocale: slideDirections.length,
      items,
    },
    null,
    2,
  )}\n`,
);
writeFileSync(OUTPUT_JSONL_PATH, `${items.map((item) => JSON.stringify(item)).join("\n")}\n`);
writeFileSync(OUTPUT_RUNBOOK_PATH, makeRunbook(items));
writeFileSync(OUTPUT_REPORT_PATH, makeReport(items));

console.log(`Created ${items.length} reference-inspired Copy B GPT Image 2.0 prompts.`);
console.log(`Wrote ${OUTPUT_JSON_PATH}`);
console.log(`Wrote ${OUTPUT_JSONL_PATH}`);
console.log(`Wrote ${OUTPUT_RUNBOOK_PATH}`);
console.log(`Wrote ${OUTPUT_REPORT_PATH}`);
