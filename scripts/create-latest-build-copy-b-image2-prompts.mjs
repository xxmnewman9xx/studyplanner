#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const OUTPUT_JSON_PATH = "qa/back-to-school-2026/latest-build-copy-b-image2-prompts.json";
const OUTPUT_JSONL_PATH = "qa/back-to-school-2026/latest-build-copy-b-image2-prompts.jsonl";
const OUTPUT_RUNBOOK_PATH = "docs/launch/back-to-school-2026/latest-build-copy-b-image2-runbook.md";
const OUTPUT_REPORT_PATH = "docs/launch/back-to-school-2026/latest-build-copy-b-image2-report.md";

const generatedAt = "2026-07-07";
const release = "Back-to-School Semester Kickoff";
const sourceRoot = "qa-screenshots/back-to-school-2026-native";

const slides = [
  {
    id: "latest-en-US-01",
    slideIndex: 1,
    slideFile: "01-build-semester.png",
    sourceFile: "app-05-import-choice.png",
    headline: "Build your semester.",
    subheadline: "Scan, paste, or start manually.",
    proof: "latest Build 77 import choice UI",
    treatment:
      "source UI large and centered, white card, one quiet orange accent shape, scanner choice remains the hero.",
  },
  {
    id: "latest-en-US-02",
    slideIndex: 2,
    slideFile: "02-review-before-save.png",
    sourceFile: "app-06-review.png",
    headline: "Review before anything saves.",
    subheadline: "You approve the plan.",
    proof: "latest Build 77 review-before-save UI",
    treatment:
      "source review UI large, calm white space, small green trust accent, keep the review list readable.",
  },
  {
    id: "latest-en-US-03",
    slideIndex: 3,
    slideFile: "03-semester-ready.png",
    sourceFile: "app-07-semester-ready.png",
    headline: "Semester ready in minutes.",
    subheadline: "Classes, tasks, and exams together.",
    proof: "latest Build 77 semester ready UI",
    treatment:
      "source success UI centered, minimal celebratory orange check energy, no confetti or busy decoration.",
  },
  {
    id: "latest-en-US-04",
    slideIndex: 4,
    slideFile: "04-today-next-move.png",
    sourceFile: "app-08-today.png",
    headline: "Know today's next move.",
    subheadline: "See health, deadlines, and focus.",
    proof: "latest Build 77 Today dashboard UI",
    treatment:
      "source Today UI dominant, soft green progress accent, dashboard text remains inspectable.",
  },
  {
    id: "latest-en-US-05",
    slideIndex: 5,
    slideFile: "05-plan-week.png",
    sourceFile: "app-09-focus.png",
    headline: "Plan the week calmly.",
    subheadline: "Study blocks from real deadlines.",
    proof: "latest Build 77 plan/focus UI",
    treatment:
      "source calendar/plan UI dominant, small blue schedule arc, no invented calendar entries.",
  },
  {
    id: "latest-en-US-06",
    slideIndex: 6,
    slideFile: "06-widgets-sync.png",
    sourceFile: "app-10-widgets.png",
    headline: "Widgets stay in sync.",
    subheadline: "Your school day, visible.",
    proof: "latest Build 77 in-app widget sync UI",
    treatment:
      "source widget recommendation UI dominant, soft yellow/orange card accent, keep widget cards literal.",
  },
  {
    id: "latest-en-US-07",
    slideIndex: 7,
    slideFile: "07-real-home-widgets.png",
    sourceFile: "widget-02-normal-medium.png",
    headline: "Real widgets on Home Screen.",
    subheadline: "Today and week ahead at a glance.",
    proof: "latest Build 77 real WidgetKit Home Screen proof",
    treatment:
      "source Home Screen widget proof full and literal, minimal white plate framing, no invented widgets.",
  },
];

function makePrompt(item) {
  return `Use case: precise-object-edit + App Store preview polish
Asset type: Product Page Optimization Copy B candidate for StudyPlanner AI
Model target: GPT Image 2.0 in the ChatGPT Mac app
Locale: en-US
Slide ${item.slideIndex}: ${item.slideFile}

Input image:
- The attached image is the latest Build 77 live UI source. It is the only product UI source of truth.

Primary request:
Create one minimal Apple-like App Store preview image for this slide, inspired by the supplied Calendly-style references from the project brief: bright white rounded card, confident bold headline, soft depth, and one or two saturated abstract edge shapes. Use the attached latest UI as literal product proof.

Exact visible external marketing text:
Headline: "${item.headline}"
Subheadline: "${item.subheadline}"

Required composition:
- Final PNG exactly 1242x2688.
- White or near-white background.
- Large rounded preview plate with soft shadow and very subtle border.
- Place the attached latest UI as the real product screenshot layer. Keep it large enough to inspect.
- Add the headline above or beside the product layer using clean SF-style heavy typography.
- Use at most two abstract accent shapes, cropped at the card edge, behind the product layer.
- Minimal, Apple-like, editorial, quiet, not a loud ad.

Latest UI lock:
- Preserve the attached product UI literally. Do not redraw, rewrite, translate, blur, crop into illegibility, recolor, or invent any UI.
- Do not add fake app screens, fake widgets, fake notifications, fake lock screens, fake LMS/school integrations, fake App Store UI, prices, ratings, awards, or claims.
- Do not create a new StudyPlanner interface. The attached screenshot is the product proof.
- If exact UI preservation is not possible, return the attached image unchanged instead of generating fake UI.

Slide-specific treatment:
${item.treatment}

Acceptance gate:
Reject the output if the latest UI content differs from the attached source or if the result is not exactly 1242x2688.`;
}

function makeRunbook(items) {
  const rows = items
    .map((item) => `| ${item.id} | ${item.sourcePath} | ${item.headline} | ${item.proof} |`)
    .join("\n");

  return `# Latest Build Copy B Image 2.0 Runbook

Generated: ${generatedAt}
Release: ${release}

## Source Rule

This queue replaces stale UI sources with the freshest latest-build captures under \`${sourceRoot}\`.

The current live App Store Connect previews remain Copy A/control. This B set uses latest Build 77 UI as product proof and asks GPT Image 2.0 for minimal Apple-like preview polish.

## Prompting Rule

Attach only the latest build UI source image for each item. Do not attach the Calendly reference sheet, because prior canaries showed reference UI contamination. The reference is distilled into text style rules only.

## Queue

| ID | Source | Copy | Proof |
| --- | --- | --- | --- |
${rows}
`;
}

function makeReport(items) {
  return `# Latest Build Copy B Image 2.0 Report

Generated: ${generatedAt}
Queue: \`${OUTPUT_JSON_PATH}\`

## Status

Built a new seven-image B queue from the latest Build 77 UI captures, not the older live ASC preview UI.

This is the highest-leverage B set for PPO: import, review, ready state, Today, plan/focus, widget sync, and real Home Screen widgets.

## Gate

Each Image 2.0 result must pass:

- exact size: \`1242x2688\`
- source UI preservation: no fake/redrawn StudyPlanner UI
- minimal Apple-like style

Do not use this B set for nomination unless a generated candidate passes both size and UI preservation. The nomination-safe path remains the final-upload packet with current live ASC previews as Copy A/control.

## Items

${items.map((item) => `- ${item.id}: ${item.sourcePath}`).join("\n")}
`;
}

const items = slides.map((slide) => {
  const sourcePath = `${sourceRoot}/${slide.sourceFile}`;
  if (!existsSync(sourcePath)) {
    throw new Error(`Missing latest-build source image: ${sourcePath}`);
  }
  const outputPathRecommended = `store/apple/screenshot-copy-b-latest-build/en-US/APP_IPHONE_65/${slide.slideFile}`;
  mkdirSync(dirname(outputPathRecommended), { recursive: true });
  return {
    ...slide,
    locale: "en-US",
    copyTreatment: "B-latest-build-minimal",
    sourcePath,
    sourcePaths: [sourcePath],
    requiredOutputSize: { width: 1242, height: 2688 },
    outputPathRecommended,
    modelTarget: "GPT Image 2.0 in ChatGPT Mac app",
    mode: "individual latest-build UI source prompt",
    prompt: makePrompt(slide),
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
      sourceRoot,
      treatment: "Latest Build Minimal Copy B",
      totalItems: items.length,
      locales: ["en-US"],
      slidesPerLocale: items.length,
      items,
    },
    null,
    2,
  )}\n`,
);
writeFileSync(OUTPUT_JSONL_PATH, `${items.map((item) => JSON.stringify(item)).join("\n")}\n`);
writeFileSync(OUTPUT_RUNBOOK_PATH, makeRunbook(items));
writeFileSync(OUTPUT_REPORT_PATH, makeReport(items));

console.log(`Created ${items.length} latest-build Copy B Image 2.0 prompts.`);
console.log(`Wrote ${OUTPUT_JSON_PATH}`);
console.log(`Wrote ${OUTPUT_JSONL_PATH}`);
console.log(`Wrote ${OUTPUT_RUNBOOK_PATH}`);
console.log(`Wrote ${OUTPUT_REPORT_PATH}`);
