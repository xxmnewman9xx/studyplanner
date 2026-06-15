#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const rawDir = process.argv[2] || "test-results/build57-final-sweep/raw-screenshots";
const outDir = process.argv[3] || "test-results/build57-final-sweep/app-preview-draft";
const font = "/System/Library/Fonts/SFNS.ttf";
const width = 1290;
const height = 2796;
const slideBg = "#F6F7FA";
const ink = "#0A0A0D";
const sub = "#5F6368";
const accent = "#0A84FF";

const slides = [
  {
    name: "01-hero-semester-plan",
    title: "Turn any syllabus into a semester plan.",
    subtitle: "Scan, review, then own your week.",
    screenshots: ["08-dashboard-today.png"],
  },
  {
    name: "02-scan-upload-paste",
    title: "Scan, upload, or paste.",
    subtitle: "Start from the syllabus you actually have.",
    screenshots: ["03-add-syllabus-scanner-entry.png"],
  },
  {
    name: "03-review-before-save",
    title: "Review before it saves.",
    subtitle: "Edit rows, confirm matches, and choose what changes.",
    screenshots: ["06-import-review-editable-rows.png"],
  },
  {
    name: "04-today-dashboard",
    title: "Know what matters today.",
    subtitle: "Classes, deadlines, exams, and next moves in one place.",
    screenshots: ["08-dashboard-today.png"],
  },
  {
    name: "05-classes-organized",
    title: "Keep every class organized.",
    subtitle: "Edit schedules, archive dropped classes, and keep moving.",
    screenshots: ["09-manage-semester.png"],
  },
  {
    name: "06-assignments-exams",
    title: "Assignments, exams, and recurring work.",
    subtitle: "Move, duplicate, edit, or delete without restarting.",
    screenshots: ["11-assignment-detail.png", "12-assessment-detail.png"],
  },
  {
    name: "07-widgets-glance",
    title: "Your semester at a glance.",
    subtitle: "Widget-ready views for today, upcoming work, and classes.",
    screenshots: ["14-widget-studio-preview.png"],
  },
];

function run(cmd, args) {
  return execFileSync(cmd, args, { stdio: "inherit", encoding: "utf8" });
}

function makeTextPng(text, pointSize, color, maxWidth, maxHeight, outputPath) {
  run("magick", [
    "-background", "none",
    "-fill", color,
    "-font", font,
    "-pointsize", String(pointSize),
    "-size", `${maxWidth}x${maxHeight}`,
    `caption:${text}`,
    outputPath,
  ]);
}

function makePhone(input, output, phoneWidth) {
  run("magick", [input, "-resize", `${phoneWidth}x`, "-bordercolor", "#D8DAE0", "-border", "2x2", output]);
}

function composeSlide(slide, index) {
  const base = join(outDir, `${slide.name}.base.png`);
  const title = join(outDir, `${slide.name}.title.png`);
  const subtitle = join(outDir, `${slide.name}.subtitle.png`);
  const output = join(outDir, `${slide.name}.png`);
  run("magick", ["-size", `${width}x${height}`, `xc:${slideBg}`, base]);
  makeTextPng(slide.title, 82, ink, 1098, 260, title);
  makeTextPng(slide.subtitle, 38, sub, 1098, 150, subtitle);
  run("magick", [base, title, "-geometry", "+96+156", "-composite", subtitle, "-geometry", "+96+390", "-composite", base]);

  if (slide.screenshots.length === 1) {
    const phone = join(outDir, `${slide.name}.phone.png`);
    makePhone(join(rawDir, slide.screenshots[0]), phone, 900);
    run("magick", [base, phone, "-geometry", "+195+610", "-composite", output]);
  } else {
    const left = join(outDir, `${slide.name}.left.png`);
    const right = join(outDir, `${slide.name}.right.png`);
    makePhone(join(rawDir, slide.screenshots[0]), left, 600);
    makePhone(join(rawDir, slide.screenshots[1]), right, 600);
    run("magick", [base, left, "-geometry", "+35+680", "-composite", right, "-geometry", "+655+680", "-composite", output]);
  }

  const eyebrow = join(outDir, `${slide.name}.eyebrow.png`);
  makeTextPng(`STUDYPLANNER ${index + 1}/7`, 24, accent, 420, 60, eyebrow);
  run("magick", [output, eyebrow, "-geometry", "+96+88", "-composite", output]);
}

mkdirSync(outDir, { recursive: true });
slides.forEach(composeSlide);

writeFileSync(join(outDir, "preview-draft.md"), `# StudyPlanner Build 57 App Store Preview Draft\n\n${slides.map((slide, index) => `## Slide ${index + 1}: ${slide.title}\n\nSubtitle: ${slide.subtitle}\n\nRaw screenshot source: ${slide.screenshots.join(", ")}\n\nDraft composition: ${slide.name}.png`).join("\n\n")}\n`);
writeFileSync(join(outDir, "manifest.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: rawDir,
  output: outDir,
  slideCount: slides.length,
  slides,
}, null, 2) + "\n");

console.log(`Created ${slides.length} English App Store preview draft slides in ${outDir}`);
