#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const SOURCE_QUEUE_PATH = "qa/back-to-school-2026/asc-live-copy-b-gpt-image-2-prompts.json";
const OUTPUT_JSON_PATH = "qa/back-to-school-2026/creative-copy-b-gpt-image-2-prompts.json";
const OUTPUT_JSONL_PATH = "qa/back-to-school-2026/creative-copy-b-gpt-image-2-prompts.jsonl";
const OUTPUT_RUNBOOK_PATH = "docs/launch/back-to-school-2026/creative-copy-b-gpt-image-2-runbook.md";
const OUTPUT_REPORT_PATH = "docs/launch/back-to-school-2026/creative-copy-b-generation-report.md";

const generatedAt = "2026-07-07";
const release = "Back-to-School Semester Kickoff";

const concepts = [
  {
    slideIndex: 1,
    title: "Plan Your Semester",
    englishHeadline: "Start Strong This Semester",
    scene:
      "bright morning desk with a syllabus stack, laptop corner, highlighters, pencils, sticky notes, and a modern iPhone showing a calm semester overview",
    screen:
      "semester setup dashboard with courses, reviewed deadlines, and a clear first-week checklist",
  },
  {
    slideIndex: 2,
    title: "Never Miss What's Due",
    englishHeadline: "Track Every Assignment",
    scene:
      "backpack beside a clean study desk, wall calendar hints, index cards, and an iPhone angled naturally near school supplies",
    screen:
      "assignments grouped by due date and class, with calm priority markers and no urgent red panic styling",
  },
  {
    slideIndex: 3,
    title: "Break Big Work Down",
    englishHeadline: "Turn Projects Into Steps",
    scene:
      "library table with research paper notes, sticky-note milestones, a notebook outline, and a focused iPhone mockup",
    screen:
      "project breakdown with checkpoints, study blocks, and visible progress toward a larger assignment",
  },
  {
    slideIndex: 4,
    title: "Study Smarter Daily",
    englishHeadline: "Build Better Study Habits",
    scene:
      "warm evening study setup with desk lamp, flashcards, headphones, tea, and a phone sitting beside tidy notes",
    screen:
      "planned study sessions, today's focus block, and review tasks arranged in a clean routine view",
  },
  {
    slideIndex: 5,
    title: "See Your Week Clearly",
    englishHeadline: "Know What's Coming Next",
    scene:
      "planner notebook open to a school week, coffee, pencil, soft natural window light, and a vertical iPhone preview",
    screen:
      "weekly schedule with classes, assignments, exams, and a concise next-up card",
  },
  {
    slideIndex: 6,
    title: "Stay Calm Before Exams",
    englishHeadline: "Prep Without the Panic",
    scene:
      "exam prep scene with neat notes, timer, quiet library atmosphere, color-coded tabs, and an iPhone showing priorities",
    screen:
      "exam countdowns, revision tasks, and a short priority list with calm visual hierarchy",
  },
  {
    slideIndex: 7,
    title: "Feel Ready for Class",
    englishHeadline: "Own Your School Year",
    scene:
      "student walking across a campus path with backpack and phone in hand, warm daylight, confident back-to-school energy",
    screen:
      "today dashboard with next class, upcoming work, and progress overview; no fake notifications or school branding",
  },
];

function escapeMd(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function makePrompt(item, concept) {
  const copy = item.externalCopyB;
  const exactText = `${copy.headline}\n${copy.subheadline}`;

  return `Use case: new creative App Store preview generation
Asset type: Product Page Optimization Copy B candidate for StudyPlanner AI
Model target: GPT Image 2.0 in the ChatGPT Mac app
Input mode: text-only generation. Do not depend on an attached screenshot. The current live App Store Connect previews are Copy A/control only.
Locale: ${item.locale}
Slide ${item.slideIndex}: ${concept.title}

Primary request: Generate a completely new, more engaging vertical iPhone App Store preview image for StudyPlanner AI. Make it feel like a student's back-to-school reset: real environment, modern phone mockup, warm academic energy, and a polished app-like screen that makes school feel manageable.

Required canvas:
- Portrait iPhone App Store screenshot composition.
- Exact requested final size: 1242x2688 pixels.
- Safe margins for App Store preview cropping.
- No borders, no watermarks, no App Store badges.

Exact visible marketing text:
${exactText}

Visual scene:
${concept.scene}.

Phone screen direction:
Show a believable StudyPlanner AI interface, not the old submitted screenshot. ${concept.screen}. The UI may be representative, but it must only show features the app actually supports: syllabus import/review, classes, assignments, exams, study blocks, notes, widgets/today overview, and planning. Keep UI text minimal and legible; avoid dense tiny generated text.

Art direction:
Photorealistic lifestyle App Store preview, bright Apple-like composition, clean typography, premium student productivity feel, fresh academic greens, deep navy, white, pencil-yellow accents, and soft campus neutrals. More engaging and creative than a plain screenshot gallery, but still credible and calm.

Guardrails:
- Do not show Apple logos, App Store UI, school trademarks, real institution names, celebrities, ratings, prices, awards, or fake integrations.
- Do not claim guaranteed grades, AI tutoring, LMS sync, automatic homework submission, or anything unsupported.
- Do not include fake notifications, lock screens, or unrelated app screens.
- Do not make it look like a loud ad, social post, or poster detached from the app.
- Keep the headline/subheadline exactly in the requested locale; do not translate, rewrite, add punctuation, or invent extra copy.

Return one polished PNG candidate.`;
}

function makeRunbook(items) {
  const rows = items
    .map((item) => {
      const concept = concepts[item.slideIndex - 1];
      const copy = item.externalCopyB;
      return `| ${item.id} | ${item.locale} | ${item.slideIndex} | ${escapeMd(concept.title)} | ${escapeMd(copy.headline)} / ${escapeMd(copy.subheadline)} |`;
    })
    .join("\n");

  return `# Creative Copy B GPT Image 2.0 Runbook

Generated: ${generatedAt}
Release: ${release}

## Restart Rule

This is the restarted Copy B image-generation cycle. The old Copy B queue tried to edit older UI screenshot previews. This queue creates a completely new, more engaging visual direction for B previews.

Copy A/control remains the current live App Store Connect preview set. Creative Copy B must be generated in GPT Image 2.0 in the ChatGPT Mac app.

## Direction

Creative territory: **Your Semester, Under Control**.

The preview set should feel like a student's back-to-school reset: real desks, backpacks, notebooks, campus corners, and modern iPhone mockups with believable StudyPlanner screens. Less screenshot gallery, more "this app makes school feel manageable."

## Minimum-Usage Order

1. Generate \`creative-en-US-01\` first.
2. Continue only if the output is usable: correct direction, no unsupported claims, legible text, and dimensions/export path acceptable for App Store preview work.
3. Generate the remaining six en-US slides as one coherent set.
4. Localize only after the English direction is accepted.

Current proof status: \`creative-en-US-01\` was generated in the ChatGPT Mac app and visually matched the restarted lifestyle/editorial direction, but the collected GPT Image 2.0 PNG was \`853x1844\`, not \`1242x2688\`. Keep full-queue generation paused until the export/dimension blocker is solved.

## Nomination Rule

Do not block the Back-to-School In-App Event nomination on Creative Copy B. Use the final-upload packet and current live ASC previews for nomination. Creative Copy B is a later PPO treatment unless a generated set passes QA.

## Queue

| ID | Locale | Slide | Concept | Copy |
| --- | --- | ---: | --- | --- |
${rows}
`;
}

function makeReport(items) {
  return `# Creative Copy B Generation Report

Generated: ${generatedAt}
Queue: \`${OUTPUT_JSON_PATH}\`

## Status

Creative Copy B generation has been restarted with a new visual direction: lifestyle/editorial App Store previews for **Your Semester, Under Control**.

This replaces the old locked UI screenshot-edit approach for B exploration. The current live ASC previews remain Copy A/control and remain the nomination-safe upload set.

## Proof Gate

The first proof item was \`creative-en-US-01\`. It generated in the ChatGPT Mac app and produced a visually stronger lifestyle/editorial direction, but the collected output was \`853x1844\`, not the required \`1242x2688\`.

Rejected candidate:

- \`qa/back-to-school-2026/creative-copy-b-candidates/creative-en-US-01-rejected-853x1844.png\`

Do not mass-generate the full ${items.length}-item queue until GPT Image 2.0 output/export can produce App Store-size assets.

## Nomination Impact

Creative Copy B is not required for the In-App Event nomination. Submit the nomination using \`docs/launch/back-to-school-2026/app-store-connect-final-upload/\` and treat Creative Copy B as PPO exploration.
`;
}

const source = JSON.parse(readFileSync(SOURCE_QUEUE_PATH, "utf8"));
const items = source.items.map((item) => {
  const concept = concepts[item.slideIndex - 1];
  if (!concept) throw new Error(`Missing concept for slide ${item.slideIndex}`);
  const creativeId = `creative-${item.id}`;
  const outputPathRecommended = `store/apple/screenshot-copy-b-creative/${item.locale}/APP_IPHONE_65/${item.slideFile}`;
  mkdirSync(dirname(outputPathRecommended), { recursive: true });
  return {
    id: creativeId,
    locale: item.locale,
    slideIndex: item.slideIndex,
    slideFile: item.slideFile,
    slideTitle: concept.title,
    copyTreatment: "B-creative",
    copyAReference: "current live App Store Connect preview",
    sourcePath: null,
    requiredOutputSize: { width: 1242, height: 2688 },
    outputPathRecommended,
    modelTarget: "GPT Image 2.0 in ChatGPT Mac app",
    mode: "text-only creative generation",
    creativeTerritory: "Your Semester, Under Control",
    concept,
    externalCopyB: item.externalCopyB,
    prompt: makePrompt(item, concept),
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
      treatment: "Creative Copy B",
      totalItems: items.length,
      locales: [...new Set(items.map((item) => item.locale))],
      slidesPerLocale: concepts.length,
      items,
    },
    null,
    2,
  )}\n`,
);
writeFileSync(OUTPUT_JSONL_PATH, `${items.map((item) => JSON.stringify(item)).join("\n")}\n`);
writeFileSync(OUTPUT_RUNBOOK_PATH, makeRunbook(items));
writeFileSync(OUTPUT_REPORT_PATH, makeReport(items));

console.log(`Created ${items.length} Creative Copy B GPT Image 2.0 prompts.`);
console.log(`Wrote ${OUTPUT_JSON_PATH}`);
console.log(`Wrote ${OUTPUT_JSONL_PATH}`);
console.log(`Wrote ${OUTPUT_RUNBOOK_PATH}`);
console.log(`Wrote ${OUTPUT_REPORT_PATH}`);
