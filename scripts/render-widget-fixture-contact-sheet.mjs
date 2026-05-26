import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outputRootArg = process.argv[2];
const outputRoot = outputRootArg
  ? path.resolve(outputRootArg)
  : path.join(repoRoot, "qa-screenshots", "widget-fixture-contact-sheet");
const buildDir = path.join(os.tmpdir(), "studyplanner-widget-fixture-contact-sheet-build");
const now = new Date("2026-05-22T09:00:00");
const sheetWidth = 1800;
const sheetHeight = 2120;
const expectedFiles = {
  html: path.join(outputRoot, "widget-fixture-contact-sheet.html"),
  svg: path.join(outputRoot, "widget-fixture-contact-sheet.svg"),
  png: path.join(outputRoot, "widget-fixture-contact-sheet.png"),
  proofJson: path.join(outputRoot, "widget-fixture-proof.json"),
  summary: path.join(outputRoot, "widget-fixture-summary.txt")
};

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: repoRoot,
    stdio: options.stdio || "pipe",
    encoding: "utf8",
    ...options
  });
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function quoteSvg(value) {
  return escapeHtml(value).replaceAll("'", "&apos;");
}

function hexToRgb(hex) {
  const normalized = String(hex || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channel = (value) => {
    const srgb = value / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

function contrastRatio(foreground, background) {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function wrapText(value, maxChars, maxLines = 2) {
  const words = String(value ?? "").split(/\s+/).filter(Boolean);
  const lines = [];

  for (const word of words) {
    const current = lines[lines.length - 1] || "";
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars || !current) {
      lines[lines.length - 1] = next;
    } else if (lines.length < maxLines) {
      lines.push(word);
    } else {
      break;
    }
  }

  const visible = lines.slice(0, maxLines);
  if (words.join(" ").length > visible.join(" ").length && visible.length > 0) {
    visible[visible.length - 1] = `${visible[visible.length - 1].replace(/\.+$/, "")}...`;
  }

  return visible.length ? visible : [""];
}

function textBoundary(slot, value, maxChars, maxLines = 1) {
  const text = String(value ?? "");
  const words = text.split(/\s+/).filter(Boolean);
  const lines = wrapText(text, maxChars, maxLines);
  const longestWord = words.reduce((max, word) => Math.max(max, word.length), 0);
  const renderedMaxChars = Math.max(...lines.map((line) => line.length), 0);
  return {
    slot,
    text,
    maxChars,
    maxLines,
    longestWord,
    renderedMaxChars,
    wrappedLines: lines.length,
    pass: longestWord <= maxChars && renderedMaxChars <= maxChars + 3 && lines.length <= maxLines
  };
}

function renderText(value, x, y, options = {}) {
  const {
    size = 18,
    weight = 700,
    fill = "#172033",
    maxChars = 40,
    maxLines = 1,
    lineHeight = Math.round(size * 1.24),
    anchor = "start"
  } = options;
  return wrapText(value, maxChars, maxLines)
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escapeHtml(line)}</text>`
    )
    .join("\n");
}

function assignment(overrides) {
  return {
    kind: "assignment",
    tags: [],
    source: "syllabus",
    estimatedMinutes: 30,
    status: "not_started",
    priority: "medium",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides
  };
}

function normalizeStudioItem(item, courses, fallbackAccent) {
  const course = courses.find((candidate) => candidate.id === item.courseId);
  return {
    id: item.id,
    title: item.title,
    courseCode: course?.code || "Class",
    courseColor: course?.color || fallbackAccent,
    dueLabel: item.dueAt && item.dueAt < now.toISOString() ? "Overdue" : "Soon"
  };
}

function renderStateCard(state, x, y) {
  const snapshot = state.snapshot;
  const rows = (snapshot.items || []).slice(0, 3);
  const accent = snapshot.accentColor || "#2F80ED";
  const background = snapshot.backgroundColor || "#101723";
  const ink = background === "#F5F7FB" || background === "#FFF3E7" ? "#172033" : "#F8F6EF";
  const muted = background === "#F5F7FB" || background === "#FFF3E7" ? "#677084" : "#D4D8E2";
  const cardWidth = 414;
  const cardHeight = 660;
  const widgetX = x + 24;
  const widgetY = y + 116;
  const widgetWidth = 366;
  const widgetHeight = 286;
  const progress = Math.max(0, Math.min(1, snapshot.progress || 0.6));

  const rowNodes = rows.length
    ? rows
        .map((item, index) => {
          const rowY = widgetY + 198 + index * 30;
          return `
            <circle cx="${widgetX + 20}" cy="${rowY - 4}" r="5" fill="${quoteSvg(item.courseColor || accent)}" />
            ${renderText(item.courseCode || "Class", widgetX + 34, rowY, { size: 13, weight: 900, fill: item.courseColor || accent, maxChars: 7 })}
            ${renderText(item.title || "Homework", widgetX + 88, rowY, { size: 13, weight: 750, fill: ink, maxChars: 22 })}
            ${renderText(item.dueLabel || "Soon", widgetX + widgetWidth - 20, rowY, { size: 12, weight: 800, fill: muted, maxChars: 10, anchor: "end" })}
          `;
        })
        .join("\n")
    : renderText(snapshot.footnote || "No rows", widgetX + 18, widgetY + 216, {
        size: 17,
        weight: 750,
        fill: muted,
        maxChars: 32,
        maxLines: 2
      });

  const dots = Array.from({ length: 5 })
    .map((_, index) => {
      const filled = progress >= (index + 1) / 5;
      return `<circle cx="${widgetX + widgetWidth - 88 + index * 17}" cy="${widgetY + 178}" r="5" fill="${filled ? quoteSvg(accent) : "#465062"}" />`;
    })
    .join("\n");

  return `
    <g transform="translate(${x} ${y})">
      <rect x="0" y="0" width="${cardWidth}" height="${cardHeight}" rx="16" fill="#FFFFFF" stroke="#DCE3EE" />
      ${renderText(state.title, 24, 42, { size: 27, weight: 900, maxChars: 20 })}
      ${renderText(state.kind, 24, 70, { size: 14, weight: 850, fill: "#677084", maxChars: 34 })}
      <rect x="284" y="26" width="106" height="34" rx="17" fill="#EEF3FA" />
      ${renderText(snapshot.state || state.id, 337, 49, { size: 12, weight: 900, fill: "#526075", maxChars: 14, anchor: "middle" })}

      <rect x="24" y="116" width="${widgetWidth}" height="${widgetHeight}" rx="22" fill="${quoteSvg(background)}" />
      <rect x="24" y="116" width="${widgetWidth}" height="86" rx="22" fill="${background === "#F5F7FB" || background === "#FFF3E7" ? "#FFFFFF" : "#202633"}" opacity="0.9" />
      ${renderText("StudyPlanner", widgetX + 18, widgetY + 33, { size: 15, weight: 900, fill: muted, maxChars: 18 })}
      ${renderText(snapshot.signalLabel || "Live plan", widgetX + 18, widgetY + 56, { size: 15, weight: 850, fill: accent, maxChars: 18 })}
      ${renderText(snapshot.timelineLabel || snapshot.windowLabel || "Today", widgetX + widgetWidth - 18, widgetY + 33, { size: 13, weight: 900, fill: ink, maxChars: 16, anchor: "end" })}
      ${renderText(snapshot.metricLabel || snapshot.progressLabel || "Planner", widgetX + widgetWidth - 18, widgetY + 55, { size: 12, weight: 800, fill: muted, maxChars: 18, anchor: "end" })}
      ${renderText(snapshot.value, widgetX + 18, widgetY + 126, { size: 42, weight: 950, fill: ink, maxChars: 10 })}
      ${renderText(snapshot.detail, widgetX + 18, widgetY + 154, { size: 19, weight: 850, fill: ink, maxChars: 20, maxLines: 2 })}
      <rect x="${widgetX + 198}" y="${widgetY + 94}" width="144" height="72" rx="14" fill="${background === "#F5F7FB" || background === "#FFF3E7" ? "#FFFFFF" : "#263044"}" />
      ${renderText("NEXT", widgetX + 214, widgetY + 119, { size: 11, weight: 950, fill: muted, maxChars: 8 })}
      ${renderText(snapshot.nextLabel || snapshot.footnote || "Open StudyPlanner", widgetX + 214, widgetY + 143, { size: 14, weight: 800, fill: ink, maxChars: 17, maxLines: 2 })}
      ${renderText(snapshot.metricLabel || "Planner", widgetX + 18, widgetY + 182, { size: 13, weight: 800, fill: muted, maxChars: 20 })}
      ${dots}
      ${rowNodes}

      ${renderText(state.summary, 24, 448, { size: 18, weight: 700, fill: "#172033", maxChars: 42, maxLines: 3, lineHeight: 23 })}
      <line x1="24" y1="532" x2="390" y2="532" stroke="#DCE3EE" />
      ${renderText(state.evidence, 24, 564, { size: 14, weight: 750, fill: "#677084", maxChars: 48, maxLines: 2, lineHeight: 18 })}
    </g>
  `;
}

function renderLockStrip(snapshot) {
  const x = 56;
  const y = 1548;
  const accent = snapshot.accentColor || "#2F80ED";
  return `
    <g transform="translate(${x} ${y})">
      <rect x="0" y="0" width="1688" height="344" rx="20" fill="#FFFFFF" stroke="#DCE3EE" />
      ${renderText("In-app Lock Screen widgets", 28, 48, { size: 17, weight: 900, fill: "#677084", maxChars: 32 })}
      ${renderText("Same snapshot, three compact families.", 28, 88, { size: 31, weight: 950, fill: "#172033", maxChars: 36 })}
      ${renderText("Rendered here as preview parity only. This does not prove real placement on an iOS Lock Screen.", 28, 130, { size: 20, weight: 700, fill: "#677084", maxChars: 64, maxLines: 2, lineHeight: 26 })}

      ${renderText("Rectangular", 560, 62, { size: 16, weight: 950, fill: "#677084", maxChars: 16 })}
      <rect x="560" y="86" width="420" height="132" rx="20" fill="#101723" />
      ${renderText(`${snapshot.headline} - ${snapshot.signalLabel || "Next deadline"}`, 584, 126, { size: 19, weight: 900, fill: accent, maxChars: 32 })}
      ${renderText(`${snapshot.value} ${snapshot.detail}`, 584, 158, { size: 25, weight: 950, fill: "#F8F6EF", maxChars: 24 })}
      ${renderText(`${snapshot.items?.[0]?.courseCode || "Class"} - ${snapshot.items?.[0]?.title || snapshot.nextLabel || "Open StudyPlanner"}`, 584, 190, { size: 18, weight: 800, fill: "#D4D8E2", maxChars: 34 })}

      ${renderText("Circular", 1060, 62, { size: 16, weight: 950, fill: "#677084", maxChars: 16 })}
      <circle cx="1126" cy="152" r="66" fill="#101723" />
      <circle cx="1126" cy="152" r="47" fill="${quoteSvg(accent)}" />
      ${renderText(snapshot.value, 1126, 148, { size: 30, weight: 950, fill: "#FFFFFF", maxChars: 6, anchor: "middle" })}
      ${renderText(snapshot.kind === "today" ? "Today" : "Next", 1126, 174, { size: 14, weight: 900, fill: "#FFFFFF", maxChars: 8, anchor: "middle" })}

      ${renderText("Inline", 1250, 62, { size: 16, weight: 950, fill: "#677084", maxChars: 16 })}
      <rect x="1250" y="112" width="354" height="58" rx="29" fill="#EEF3FA" stroke="#DCE3EE" />
      ${renderText(`${snapshot.signalLabel || "Next deadline"}: ${snapshot.value} - ${snapshot.detail}`, 1274, 150, { size: 19, weight: 850, fill: "#172033", maxChars: 32 })}

      ${renderText("Claim boundary: this contact sheet proves fixture data and preview rendering only, not native Lock Screen placement.", 28, 294, { size: 19, weight: 800, fill: "#172033", maxChars: 114 })}
    </g>
  `;
}

function widgetCardHtml(state) {
  const snap = state.snapshot;
  const rows = (snap.items || []).slice(0, 3);
  return `
    <section class="state-card state-${state.id}">
      <div class="state-header">
        <div>
          <p class="state-kicker">${escapeHtml(state.kind)}</p>
          <h2>${escapeHtml(state.title)}</h2>
        </div>
        <span>${escapeHtml(snap.state || state.id)}</span>
      </div>
      <div class="widget" style="--accent:${escapeHtml(snap.accentColor || "#2F80ED")}; --widget-bg:${escapeHtml(snap.backgroundColor || "#101723")}">
        <div class="widget-top">
          <div>
            <p>StudyPlanner</p>
            <strong>${escapeHtml(snap.signalLabel || "Live plan")}</strong>
          </div>
          <div class="widget-meta">
            <p>${escapeHtml(snap.timelineLabel || snap.windowLabel || "Today")}</p>
            <strong>${escapeHtml(snap.metricLabel || snap.progressLabel || "Planner")}</strong>
          </div>
        </div>
        <div class="widget-main">
          <div>
            <div class="widget-value">${escapeHtml(snap.value)}</div>
            <div class="widget-detail">${escapeHtml(snap.detail)}</div>
          </div>
          <div class="widget-next">
            <p>NEXT</p>
            <strong>${escapeHtml(snap.nextLabel || snap.footnote || "Open StudyPlanner")}</strong>
          </div>
        </div>
        <div class="widget-dots">
          <span>${escapeHtml(snap.metricLabel || "Planner")}</span>
          <i></i><i></i><i></i><i></i><i></i>
        </div>
        <div class="widget-rows">
          ${
            rows.length
              ? rows
                  .map(
                    (item) => `
              <div class="widget-row">
                <b style="background:${escapeHtml(item.courseColor || snap.accentColor || "#2F80ED")}"></b>
                <strong>${escapeHtml(item.courseCode || "Class")}</strong>
                <span>${escapeHtml(item.title || "Homework")}</span>
                <em>${escapeHtml(item.dueLabel || "Soon")}</em>
              </div>`
                  )
                  .join("")
              : `<p class="empty-copy">${escapeHtml(snap.footnote || "No rows")}</p>`
          }
        </div>
      </div>
      <p class="summary">${escapeHtml(state.summary)}</p>
      <p class="evidence">${escapeHtml(state.evidence)}</p>
    </section>
  `;
}

function lockParityStripHtml(snapshot) {
  return `
    <section class="lock-strip">
      <div class="lock-copy">
        <p class="state-kicker">In-app Lock Screen widgets</p>
        <h2>Same snapshot, three compact families.</h2>
        <p>Rendered here as preview parity only. This does not prove the widgets were placed on a real iOS Lock Screen.</p>
      </div>
      <div class="lock-previews">
        <div class="lock-family">
          <span>Rectangular</span>
          <div class="lock-rect" style="--accent:${escapeHtml(snapshot.accentColor)}">
            <strong>${escapeHtml(snapshot.headline)} - ${escapeHtml(snapshot.signalLabel || "Next deadline")}</strong>
            <b>${escapeHtml(snapshot.value)} ${escapeHtml(snapshot.detail)}</b>
            <p>${escapeHtml(snapshot.items?.[0]?.courseCode || "Class")} - ${escapeHtml(snapshot.items?.[0]?.title || snapshot.nextLabel || "Open StudyPlanner")}</p>
          </div>
        </div>
        <div class="lock-family">
          <span>Circular</span>
          <div class="lock-circle" style="--accent:${escapeHtml(snapshot.accentColor)}">
            <b>${escapeHtml(snapshot.value)}</b>
            <p>${escapeHtml(snapshot.kind === "today" ? "Today" : "Next")}</p>
          </div>
        </div>
        <div class="lock-family lock-inline-family">
          <span>Inline</span>
          <div class="lock-inline" style="--accent:${escapeHtml(snapshot.accentColor)}">
            ${escapeHtml(snapshot.signalLabel || "Next deadline")}: ${escapeHtml(snapshot.value)} - ${escapeHtml(snapshot.detail)}
          </div>
        </div>
      </div>
    </section>
  `;
}

function buildHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>StudyPlanner Widget Fixture Contact Sheet</title>
<style>
  :root {
    color-scheme: light;
    --ink:#172033;
    --muted:#677084;
    --paper:#F4F7FB;
    --line:#DCE3EE;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif;
  }
  .sheet {
    width: ${sheetWidth}px;
    min-height: ${sheetHeight}px;
    padding: 56px;
  }
  header {
    display: grid;
    grid-template-columns: 1fr 520px;
    gap: 32px;
    align-items: end;
    margin-bottom: 34px;
  }
  h1 {
    margin: 0 0 10px;
    font-size: 50px;
    letter-spacing: 0;
    line-height: 1.04;
  }
  .lead {
    margin: 0;
    max-width: 980px;
    color: var(--muted);
    font-size: 24px;
    line-height: 1.35;
  }
  .truth-box {
    border: 1px solid var(--line);
    background: white;
    border-radius: 18px;
    padding: 22px;
    font-size: 18px;
    line-height: 1.35;
  }
  .truth-box strong { display: block; margin-bottom: 8px; }
  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
  .lock-strip {
    margin-top: 28px;
    display: grid;
    grid-template-columns: 520px 1fr;
    gap: 24px;
    align-items: stretch;
    border: 1px solid var(--line);
    background: white;
    border-radius: 20px;
    padding: 24px;
  }
  .lock-copy p:last-child {
    margin: 12px 0 0;
    color: var(--muted);
    font-size: 18px;
    line-height: 1.35;
  }
  .lock-previews {
    display: grid;
    grid-template-columns: 1.1fr 0.7fr 1fr;
    gap: 22px;
    align-items: center;
  }
  .lock-family span {
    display: block;
    margin-bottom: 10px;
    color: var(--muted);
    font-size: 14px;
    font-weight: 850;
    text-transform: uppercase;
  }
  .lock-rect {
    height: 104px;
    border-radius: 18px;
    padding: 16px;
    background: #101723;
    color: #F8F6EF;
  }
  .lock-rect strong {
    display: block;
    color: var(--accent);
    font-size: 15px;
    margin-bottom: 7px;
  }
  .lock-rect b {
    display: block;
    font-size: 21px;
    margin-bottom: 6px;
  }
  .lock-rect p {
    margin: 0;
    color: #D4D8E2;
    font-size: 15px;
    font-weight: 750;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .lock-circle {
    width: 104px;
    height: 104px;
    border-radius: 50%;
    display: grid;
    place-content: center;
    text-align: center;
    color: white;
    background:
      radial-gradient(circle at center, var(--accent) 0 42%, #101723 43% 100%);
  }
  .lock-circle b {
    display: block;
    font-size: 25px;
    line-height: 1;
  }
  .lock-circle p {
    margin: 4px 0 0;
    font-size: 12px;
    font-weight: 850;
  }
  .lock-inline {
    min-height: 44px;
    border-radius: 999px;
    padding: 12px 16px;
    color: #172033;
    background: #EEF3FA;
    border: 1px solid var(--line);
    font-size: 18px;
    font-weight: 850;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .state-card {
    border: 1px solid var(--line);
    background: #fff;
    border-radius: 20px;
    padding: 22px;
    min-height: 690px;
    display: flex;
    flex-direction: column;
  }
  .state-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    min-height: 86px;
  }
  .state-kicker {
    margin: 0 0 8px;
    color: var(--muted);
    font-size: 14px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0;
  }
  h2 {
    margin: 0;
    font-size: 28px;
    line-height: 1.08;
  }
  .state-header span {
    height: 30px;
    max-width: 138px;
    border-radius: 999px;
    padding: 7px 10px;
    background: #EEF3FA;
    color: #39445B;
    font-size: 13px;
    font-weight: 800;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .widget {
    margin-top: 12px;
    min-height: 338px;
    border-radius: 28px;
    padding: 24px;
    color: #F8F6EF;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 42%),
      var(--widget-bg);
    box-shadow: 0 20px 42px rgba(25, 35, 55, 0.18);
  }
  .widget-top,
  .widget-main,
  .widget-dots,
  .widget-row {
    display: flex;
    align-items: center;
  }
  .widget-top {
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 22px;
  }
  .widget p {
    margin: 0;
    color: #B7C0D3;
    font-size: 13px;
    font-weight: 800;
  }
  .widget-top strong {
    display: block;
    margin-top: 4px;
    color: var(--accent);
    font-size: 15px;
  }
  .widget-meta { text-align: right; }
  .widget-meta strong {
    color: #D4D8E2;
    font-size: 12px;
  }
  .widget-main {
    gap: 16px;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .widget-value {
    font-size: 48px;
    font-weight: 950;
    line-height: 0.95;
  }
  .widget-detail {
    margin-top: 7px;
    font-size: 19px;
    font-weight: 850;
    line-height: 1.1;
  }
  .widget-next {
    width: 138px;
    min-height: 82px;
    padding: 12px;
    border-radius: 18px;
    background: rgba(255,255,255,0.08);
  }
  .widget-next strong {
    display: block;
    margin-top: 6px;
    font-size: 14px;
    line-height: 1.15;
  }
  .widget-dots {
    gap: 5px;
    padding: 4px 0 14px;
  }
  .widget-dots span {
    margin-right: auto;
    color: #B7C0D3;
    font-size: 13px;
    font-weight: 800;
  }
  .widget-dots i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
  }
  .widget-dots i:nth-last-child(-n+2) { opacity: 0.25; }
  .widget-rows {
    display: grid;
    gap: 9px;
  }
  .widget-row {
    min-height: 28px;
    gap: 8px;
    font-size: 13px;
  }
  .widget-row b {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex: 0 0 auto;
  }
  .widget-row strong {
    width: 42px;
    color: var(--accent);
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .widget-row span {
    flex: 1;
    color: #F8F6EF;
    font-weight: 750;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .widget-row em {
    color: #D4D8E2;
    font-style: normal;
    font-weight: 850;
    font-size: 12px;
  }
  .empty-copy {
    color: #D4D8E2 !important;
    font-size: 16px !important;
    line-height: 1.3;
  }
  .summary {
    margin: 22px 0 0;
    color: #38445C;
    font-size: 18px;
    line-height: 1.35;
  }
  .evidence {
    margin: auto 0 0;
    padding-top: 18px;
    color: #667085;
    font-size: 14px;
    font-weight: 800;
    line-height: 1.35;
  }
  footer {
    margin-top: 32px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .note {
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 20px;
    background: white;
    color: #3B465D;
    font-size: 18px;
    line-height: 1.35;
  }
  .note strong { display: block; margin-bottom: 8px; }
  code {
    background: #eef3fa;
    padding: 2px 6px;
    border-radius: 6px;
  }
</style>
</head>
<body>
<main class="sheet">
  <header>
    <div>
      <h1>StudyPlanner Widget Eight-State Proof</h1>
      <p class="lead">Fixture-driven contact sheet generated from current widget snapshot and Widget Studio data surfaces. This is artifact proof, not a release build or live Lock Screen placement claim.</p>
    </div>
    <div class="truth-box">
      <strong>Lock Screen boundary</strong>
      In-app rectangular, circular, and inline parity exists in Widget Studio. This artifact does not prove real iOS Lock Screen placement because no fresh simulator/device Lock Screen screenshot was captured.
    </div>
  </header>
  <div class="grid">
    ${states.map(widgetCardHtml).join("\n")}
  </div>
  ${lockParityStripHtml(lockParitySnapshot)}
  <footer>
    <div class="note"><strong>Generated from repo tooling</strong> The generator compiles <code>src/services/widgetSnapshot.ts</code> and <code>src/logic/planner.ts</code>, verifies the Studio readiness meter and native progress dots, then rasterizes this contact sheet when a safe local renderer is available.</div>
    <div class="note"><strong>Scope guardrail</strong> No release settings, secrets, push state, signed/native build workflows, or OpenClaw routing are touched by this fixture proof.</div>
  </footer>
</main>
</body>
</html>
`;
}

function pngDimensions(pngPath) {
  const width = spawnSync("sips", ["-g", "pixelWidth", pngPath], { encoding: "utf8" }).stdout.match(/pixelWidth:\s*(\d+)/)?.[1];
  const height = spawnSync("sips", ["-g", "pixelHeight", pngPath], { encoding: "utf8" }).stdout.match(/pixelHeight:\s*(\d+)/)?.[1];
  return { width: Number(width), height: Number(height) };
}

async function rasterizeHtml(htmlPath, pngPath) {
  try {
    const requireFromRepo = createRequire(path.join(repoRoot, "package.json"));
    const { chromium } = requireFromRepo("playwright");
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: sheetWidth, height: sheetHeight }, deviceScaleFactor: 1 });
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
      await page.screenshot({ path: pngPath, fullPage: true });
    } finally {
      await browser.close();
    }
    return { produced: true, tool: "playwright", ...pngDimensions(pngPath) };
  } catch (error) {
    return {
      produced: false,
      tool: "playwright",
      reason: error instanceof Error ? error.message : String(error)
    };
  }
}

function rasterizeSvg(svgPath, pngPath) {
  const sips = spawnSync("sips", ["-s", "format", "png", svgPath, "--out", pngPath], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  if (sips.status === 0 && fs.existsSync(pngPath)) {
    return {
      produced: true,
      tool: "sips",
      ...pngDimensions(pngPath)
    };
  }

  return {
    produced: false,
    tool: "sips",
    reason: (sips.stderr || sips.stdout || "sips conversion unavailable").trim()
  };
}

fs.mkdirSync(outputRoot, { recursive: true });
fs.rmSync(buildDir, { recursive: true, force: true });

run(path.join(repoRoot, "node_modules/.bin/tsc"), [
  "src/services/widgetSnapshot.ts",
  "src/logic/planner.ts",
  "src/models.ts",
  "--outDir",
  buildDir,
  "--module",
  "commonjs",
  "--target",
  "ES2020",
  "--esModuleInterop",
  "--skipLibCheck"
]);

const widgetModule = await import(pathToFileURL(path.join(buildDir, "services", "widgetSnapshot.js")).href);
const plannerModule = await import(pathToFileURL(path.join(buildDir, "logic", "planner.js")).href);
const { buildStudyPlannerWidgetSnapshots } = widgetModule;
const { getWidgetData } = plannerModule;

const semester = {
  id: "spring-2026",
  name: "Spring 2026",
  startDate: "2026-01-12",
  endDate: "2026-05-30"
};

const courses = [
  {
    id: "chemistry",
    code: "CHEM",
    name: "Chemistry",
    teacher: "Private Teacher",
    room: "Secret Room",
    color: "#18A999",
    meetings: [],
    gradeCategories: []
  },
  {
    id: "history",
    code: "HIST",
    name: "World History",
    color: "#E56B6F",
    meetings: [],
    gradeCategories: []
  },
  {
    id: "english",
    code: "ENG",
    name: "English Seminar",
    color: "#577590",
    meetings: [],
    gradeCategories: []
  }
];

const settings = {
  studentName: "",
  selectedTheme: "ocean",
  customPalette: [],
  appTheme: "campus",
  defaultWidgetStyle: "glass",
  onboardingComplete: true,
  notificationDefault: "2 hours before due",
  focusDefaultMinutes: 25,
  syncEnabled: true,
  privacyMode: false,
  emojiAccentEnabled: true
};

const parsedImports = [
  {
    id: "scan-1",
    title: "Reviewed syllabus",
    sourceType: "typed",
    status: "applied",
    itemCount: 6,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }
];

const richAssignments = [
  assignment({
    id: "overdue-lab",
    courseId: "chemistry",
    title: "Lab Report: Enzyme",
    dueAt: "2026-05-20T17:00:00",
    priority: "high",
    estimatedMinutes: 90,
    status: "in_progress",
    checklist: [{ id: "private-step", title: "Private checklist detail", done: false }],
    reminderIds: ["private-reminder-id"],
    externalCalendarEventId: "private-calendar-id"
  }),
  assignment({
    id: "today-discussion",
    courseId: "history",
    title: "Discussion prep",
    dueAt: "2026-05-22T14:00:00",
    priority: "medium",
    estimatedMinutes: 30
  }),
  assignment({
    id: "future-essay",
    courseId: "english",
    title: "Thesis paragraph",
    dueAt: "2026-05-23T09:00:00",
    priority: "medium",
    estimatedMinutes: 45
  }),
  assignment({
    id: "future-map",
    courseId: "history",
    title: "Map worksheet",
    dueAt: "2026-05-26T09:00:00",
    priority: "low",
    estimatedMinutes: 20
  })
];

const futureHeavyAssignments = [
  assignment({
    id: "bio-reading",
    courseId: "chemistry",
    title: "Chapter 12 problem set",
    dueAt: "2026-05-23T08:00:00",
    priority: "high",
    estimatedMinutes: 80
  }),
  assignment({
    id: "history-outline",
    courseId: "history",
    title: "Primary source outline",
    dueAt: "2026-05-24T10:00:00",
    priority: "medium",
    estimatedMinutes: 50
  }),
  assignment({
    id: "english-draft",
    courseId: "english",
    title: "Essay draft",
    dueAt: "2026-05-25T17:00:00",
    priority: "high",
    estimatedMinutes: 120
  }),
  assignment({
    id: "chem-prelab",
    courseId: "chemistry",
    title: "Pre-lab questions",
    dueAt: "2026-05-26T09:00:00",
    priority: "medium",
    estimatedMinutes: 40
  })
];

const classFocusPreset = {
  id: "class-focus-proof",
  name: "Class Risk",
  type: "class_focus",
  size: "medium",
  background: "glass",
  palette: "forest",
  font: "Rounded",
  classFocusCourseId: "chemistry",
  layout: "compact",
  iconKey: "book",
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
};

const emptyStudioPreset = {
  id: "empty-proof",
  name: "Empty",
  type: "empty",
  size: "small",
  background: "glass",
  palette: "ocean",
  font: "SF Pro",
  layout: "compact",
  iconKey: "check",
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
};

function snapshots(assignments, extra = {}) {
  return buildStudyPlannerWidgetSnapshots({
    semester,
    courses,
    assignments,
    parsedImports,
    settings: { ...settings, ...(extra.settings || {}) },
    widgetPresets: extra.widgetPresets || [],
    demoMode: false,
    now
  });
}

const classFocusData = getWidgetData(classFocusPreset, richAssignments, courses, now);
const emptyData = getWidgetData(emptyStudioPreset, [], courses, now);
const moreSource = read("src/screens/MoreScreen.tsx");
const widgetPreviewSource = read("src/components/AppleComponents.tsx");
const plusNeedles = [
  "premiumWidgetsLocked",
  "Deadline Map",
  "Class Risk",
  "Focus Block",
  "Needs Check",
  "Unlock this preset",
  "Today and Upcoming write native widget state"
];
const plusLockEvidence = plusNeedles.every((needle) => moreSource.includes(needle));
const studioProofNeedles = [
  "Widget setup",
  "Install native app",
  "nativeProgress={nativePreview?.progress}",
  "proofSignalRow",
  "nativeTruthScore"
];
const nativePreviewProgressNeedles = [
  "nativeProgress",
  "nativeWidgetProgressDots",
  "nativeWidgetProgressDot",
  "[0, 1, 2, 3, 4]"
];
const studioProofEvidence = {
  proofMeter: studioProofNeedles.every((needle) => moreSource.includes(needle)),
  nativeProgressDots: nativePreviewProgressNeedles.every((needle) => widgetPreviewSource.includes(needle))
};

const states = [
  {
    id: "empty",
    title: "Empty",
    kind: "Studio empty preset",
    summary: `${emptyData.headline}: ${emptyData.value} ${emptyData.detail}`,
    snapshot: {
      kind: "today",
      headline: emptyData.headline,
      value: emptyData.value,
      detail: emptyData.detail,
      footnote: "In-app empty widget preset; native setup covered by no-assignments snapshots.",
      signalLabel: "Clear",
      metricLabel: "No open work",
      nextLabel: "Enjoy your day",
      timelineLabel: "Today",
      progress: 1,
      accentColor: "#2F80ED",
      backgroundColor: "#101723",
      items: []
    },
    evidence: "getWidgetData(type=empty)"
  },
  {
    id: "needs-review",
    title: "Needs Review",
    kind: "Native Today snapshot",
    summary: "Only unreviewed work stays out of widgets until approved.",
    snapshot: snapshots([
      assignment({
        id: "unreviewed-scan",
        courseId: "chemistry",
        title: "Unreviewed scan item",
        dueAt: "2026-05-22T11:00:00",
        needsReview: true
      })
    ]).today,
    evidence: "buildStudyPlannerWidgetSnapshots -> today.state=needs_review"
  },
  {
    id: "overdue",
    title: "Overdue",
    kind: "Native Today snapshot",
    summary: "Overdue high-priority work leads Today and gets Catch up urgency.",
    snapshot: snapshots(richAssignments).today,
    evidence: "buildStudyPlannerWidgetSnapshots -> today.state=ready"
  },
  {
    id: "today-clear",
    title: "Today Clear",
    kind: "Native Today snapshot",
    summary: "Future reviewed work exists, but no assignment is due today.",
    snapshot: snapshots(futureHeavyAssignments).today,
    evidence: "buildStudyPlannerWidgetSnapshots -> today.state=no_due_today"
  },
  {
    id: "upcoming-heavy",
    title: "Upcoming Heavy",
    kind: "Native Upcoming snapshot",
    summary: "Upcoming exposes the next deadline and up to three agenda rows.",
    snapshot: snapshots(futureHeavyAssignments).upcoming,
    evidence: "buildStudyPlannerWidgetSnapshots -> upcoming rows"
  },
  {
    id: "privacy-mode",
    title: "Privacy Mode",
    kind: "Native Upcoming snapshot",
    summary: "Planner titles and course codes are redacted in widget snapshots.",
    snapshot: snapshots(richAssignments, { settings: { privacyMode: true } }).upcoming,
    evidence: "Widget snapshot privacy-mode source check"
  },
  {
    id: "class-focus",
    title: "Class Focus",
    kind: "Widget Studio Plus template",
    summary: `${classFocusData.headline}: ${classFocusData.value} / ${classFocusData.detail}`,
    snapshot: {
      kind: "upcoming",
      headline: classFocusData.headline,
      value: classFocusData.value,
      detail: classFocusData.detail,
      footnote: "One-class Studio preview uses class-specific planner data.",
      signalLabel: "Before class",
      metricLabel: "Class-specific",
      nextLabel: classFocusData.items[0]?.title || "Add class work",
      timelineLabel: "Class",
      progress: 0.64,
      accentColor: classFocusData.accent || "#1F8A5B",
      backgroundColor: "#101723",
      items: classFocusData.items.slice(0, 3).map((item) => normalizeStudioItem(item, courses, classFocusData.accent || "#1F8A5B"))
    },
    evidence: "getWidgetData(type=class_focus)"
  },
  {
    id: "plus-locked",
    title: "Plus Locked",
    kind: "Widget Studio lock boundary",
    summary: "Advanced templates lock when premiumWidgetsLocked is true; native Today/Upcoming remain available after entitlement.",
    snapshot: {
      kind: "upcoming",
      headline: "Plus",
      value: "Locked",
      detail: plusLockEvidence ? "Advanced widgets" : "Evidence missing",
      footnote: "Today and Upcoming stay backed by real widget snapshots.",
      signalLabel: "Upgrade path",
      metricLabel: "Deadline Map / Class Risk",
      nextLabel: "Focus Block, Needs Check",
      timelineLabel: "Studio",
      progress: plusLockEvidence ? 1 : 0,
      accentColor: "#C68A19",
      backgroundColor: "#101723",
      items: [
        { id: "deadline-map", title: "Deadline Map", courseCode: "Plus", courseColor: "#C68A19", dueLabel: "Locked" },
        { id: "class-risk", title: "Class Risk", courseCode: "Plus", courseColor: "#C68A19", dueLabel: "Locked" },
        { id: "focus-block", title: "Focus Block", courseCode: "Plus", courseColor: "#C68A19", dueLabel: "Locked" }
      ]
    },
    evidence: "MoreScreen premiumWidgetsLocked source check"
  }
];

const expectedStateIds = [
  "empty",
  "needs-review",
  "overdue",
  "today-clear",
  "upcoming-heavy",
  "privacy-mode",
  "class-focus",
  "plus-locked"
];
const privacyState = states.find((state) => state.id === "privacy-mode");
const privacySerialized = JSON.stringify(privacyState?.snapshot);

assert(states.length === 8, "Expected exactly eight fixture states.");
assert(expectedStateIds.every((id) => states.some((state) => state.id === id)), "Expected all eight fixture state ids.");
assert(states.find((state) => state.id === "needs-review")?.snapshot.state === "needs_review", "Needs-review fixture should use needs_review state.");
assert(states.find((state) => state.id === "overdue")?.snapshot.signalLabel === "Catch up", "Overdue fixture should expose Catch up urgency.");
assert(states.find((state) => state.id === "today-clear")?.snapshot.state === "no_due_today", "Today-clear fixture should use no_due_today state.");
assert((states.find((state) => state.id === "upcoming-heavy")?.snapshot.items || []).length === 3, "Upcoming-heavy fixture should include three rows.");
assert(privacyState?.snapshot.detail === "Hidden assignment", "Privacy fixture should redact the headline detail.");
for (const privateFragment of [
  "Lab Report",
  "Discussion prep",
  "Map worksheet",
  "CHEM",
  "HIST",
  "Private Teacher",
  "Secret Room",
  "Private checklist detail",
  "private-reminder-id",
  "private-calendar-id"
]) {
  assert(!privacySerialized.includes(privateFragment), `Privacy-mode fixture leaked planner/private fragment: ${privateFragment}`);
}
assert(plusLockEvidence, `Plus-lock evidence missing one of: ${plusNeedles.join(", ")}`);
assert(studioProofEvidence.proofMeter, `Studio proof meter evidence missing one of: ${studioProofNeedles.join(", ")}`);
assert(studioProofEvidence.nativeProgressDots, `Native preview progress-dot evidence missing one of: ${nativePreviewProgressNeedles.join(", ")}`);

function buildAccessibilityProof() {
  const contrastChecks = [];
  const addContrast = (stateId, label, foreground, background, minimumRatio, role) => {
    const ratio = Number(contrastRatio(foreground, background).toFixed(2));
    const item = {
      stateId,
      label,
      role,
      foreground,
      background,
      ratio,
      minimumRatio,
      pass: ratio >= minimumRatio
    };
    contrastChecks.push(item);
    assert(item.pass, `${stateId} ${label} contrast ${ratio}:1 should be at least ${minimumRatio}:1.`);
  };

  const textBoundaries = [];
  const addBoundary = (stateId, slot, value, maxChars, maxLines = 1) => {
    const item = { stateId, ...textBoundary(slot, value, maxChars, maxLines) };
    textBoundaries.push(item);
    assert(item.pass, `${stateId} ${slot} text should fit wrapped slot budget (${item.renderedMaxChars}/${maxChars}, longest word ${item.longestWord}).`);
  };

  for (const state of states) {
    const snapshot = state.snapshot;
    const background = snapshot.backgroundColor || "#101723";
    const isLightWidget = background === "#F5F7FB" || background === "#FFF3E7";
    const widgetInk = isLightWidget ? "#172033" : "#F8F6EF";
    const widgetMuted = isLightWidget ? "#677084" : "#D4D8E2";
    const headerBackground = isLightWidget ? "#FFFFFF" : "#202633";
    const panelBackground = isLightWidget ? "#FFFFFF" : "#263044";
    const accent = snapshot.accentColor || "#2F80ED";

    addContrast(state.id, "widget primary text", widgetInk, background, 4.5, "normal text");
    addContrast(state.id, "widget muted text", widgetMuted, background, 4.5, "normal text");
    addContrast(state.id, "widget header text", widgetInk, headerBackground, 4.5, "normal text");
    addContrast(state.id, "widget panel text", widgetInk, panelBackground, 4.5, "normal text");
    addContrast(state.id, "widget accent signal", accent, headerBackground, 3, "large/accent text");

    for (const item of snapshot.items || []) {
      addContrast(state.id, `row course ${item.courseCode || "Class"}`, item.courseColor || accent, background, 3, "compact row label");
    }

    addBoundary(state.id, "card title", state.title, 20);
    addBoundary(state.id, "card kind", state.kind, 34);
    addBoundary(state.id, "snapshot state badge", snapshot.state || state.id, 14);
    addBoundary(state.id, "signal label", snapshot.signalLabel || "Live plan", 18);
    addBoundary(state.id, "timeline label", snapshot.timelineLabel || snapshot.windowLabel || "Today", 16);
    addBoundary(state.id, "metric label", snapshot.metricLabel || snapshot.progressLabel || "Planner", 20);
    addBoundary(state.id, "value", snapshot.value, 10);
    addBoundary(state.id, "detail", snapshot.detail, 20, 2);
    addBoundary(state.id, "next label", snapshot.nextLabel || snapshot.footnote || "Open StudyPlanner", 17, 2);
    addBoundary(state.id, "summary", state.summary, 42, 3);
    addBoundary(state.id, "evidence", state.evidence, 48, 2);

    for (const item of (snapshot.items || []).slice(0, 3)) {
      addBoundary(state.id, "row course code", item.courseCode || "Class", 7);
      addBoundary(state.id, "row title", item.title || "Homework", 22);
      addBoundary(state.id, "row due label", item.dueLabel || "Soon", 10);
    }
  }

  const privacyItems = privacyState?.snapshot.items || [];
  const privacyFixtureTruth = {
    stateId: privacyState?.id || null,
    detailIsPlaceholder: privacyState?.snapshot.detail === "Hidden assignment",
    courseCodesArePlaceholders: privacyItems.every((item) => item.courseCode === "Class"),
    titlesArePlaceholders: privacyItems.every((item) => item.title === "Hidden assignment"),
    courseColorsUseFallback: privacyItems.every((item) => item.courseColor === privacyState?.snapshot.accentColor),
    blockedFragments: [
      "Lab Report",
      "Discussion prep",
      "Map worksheet",
      "CHEM",
      "HIST",
      "Private Teacher",
      "Secret Room",
      "Private checklist detail",
      "private-reminder-id",
      "private-calendar-id"
    ],
    pass: false
  };
  privacyFixtureTruth.pass =
    privacyFixtureTruth.detailIsPlaceholder &&
    privacyFixtureTruth.courseCodesArePlaceholders &&
    privacyFixtureTruth.titlesArePlaceholders &&
    privacyFixtureTruth.courseColorsUseFallback &&
    privacyFixtureTruth.blockedFragments.every((fragment) => !privacySerialized.includes(fragment));
  assert(privacyFixtureTruth.pass, "Privacy-mode fixture should use placeholder titles, placeholder course codes, fallback colors, and block private fragments.");

  return {
    contrastChecks,
    textBoundaries,
    privacyFixtureTruth,
    summary: {
      contrastChecks: contrastChecks.length,
      minimumContrastRatio: Math.min(...contrastChecks.map((item) => item.ratio)),
      textBoundaryChecks: textBoundaries.length,
      allContrastPassed: contrastChecks.every((item) => item.pass),
      allTextBoundariesPassed: textBoundaries.every((item) => item.pass),
      privacyFixtureTruthPassed: privacyFixtureTruth.pass
    }
  };
}

const accessibilityProof = buildAccessibilityProof();

const stateCards = states
  .map((state, index) => renderStateCard(state, 56 + (index % 4) * 430, 292 + Math.floor(index / 4) * 628))
  .join("\n");
const lockParitySnapshot = states.find((state) => state.id === "upcoming-heavy")?.snapshot;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetWidth}" height="${sheetHeight}" viewBox="0 0 ${sheetWidth} ${sheetHeight}" role="img" aria-labelledby="title desc">
  <title id="title">StudyPlanner widget fixture contact sheet</title>
  <desc id="desc">Eight repo-generated StudyPlanner widget fixture states with a Lock Screen widget strip. This is not real iOS Lock Screen placement proof.</desc>
  <rect width="${sheetWidth}" height="${sheetHeight}" fill="#F4F7FB" />
  ${renderText("StudyPlanner widget fixture contact sheet", 56, 92, { size: 52, weight: 950, maxChars: 48 })}
  ${renderText("Repo-owned fixture proof for eight visual states: empty, needs-review, overdue, today-clear, upcoming-heavy, privacy-mode, class-focus, and Plus-locked.", 56, 136, { size: 24, weight: 720, fill: "#677084", maxChars: 104 })}
  ${renderText("Boundary: contact-sheet proof only. This does not prove real iOS Lock Screen placement.", 56, 174, { size: 22, weight: 850, fill: "#172033", maxChars: 90 })}
  <rect x="1260" y="56" width="484" height="150" rx="18" fill="#FFFFFF" stroke="#DCE3EE" />
  ${renderText("Generated from current repo code", 1288, 100, { size: 20, weight: 900, fill: "#172033", maxChars: 34 })}
  ${renderText(`Timestamp fixture: ${now.toISOString()}`, 1288, 132, { size: 16, weight: 750, fill: "#677084", maxChars: 46 })}
  ${renderText("Artifacts: HTML, SVG, proof JSON, summary, PNG, Studio proof meter, and native progress-dot source checks.", 1288, 164, { size: 16, weight: 750, fill: "#677084", maxChars: 48, maxLines: 2 })}
  ${stateCards}
  ${renderLockStrip(lockParitySnapshot)}
</svg>
`;

fs.writeFileSync(expectedFiles.svg, svg);
fs.writeFileSync(expectedFiles.html, buildHtml());

let png = await rasterizeHtml(expectedFiles.html, expectedFiles.png);
if (!png.produced) {
  png = rasterizeSvg(expectedFiles.svg, expectedFiles.png);
}
if (png.produced) {
  assert(png.width >= sheetWidth, `PNG width should be at least ${sheetWidth}; got ${png.width}.`);
  assert(png.height >= 1600, `PNG height should be at least 1600; got ${png.height}.`);
}

for (const [key, filePath] of Object.entries(expectedFiles)) {
  if (!["png", "proofJson", "summary"].includes(key)) {
    assert(fs.existsSync(filePath), `Expected artifact path missing: ${filePath}`);
  }
}
assert(fs.existsSync(expectedFiles.svg), `Expected SVG artifact path missing: ${expectedFiles.svg}`);
assert(fs.existsSync(expectedFiles.html), `Expected HTML artifact path missing: ${expectedFiles.html}`);
if (png.produced) {
  assert(fs.existsSync(expectedFiles.png), `Expected PNG artifact path missing: ${expectedFiles.png}`);
}

function artifactPathEvidence(finalizedExists = {}) {
  return Object.entries(expectedFiles).reduce((acc, [key, filePath]) => {
    acc[key] = {
      path: filePath,
      required: key !== "png" || png.produced,
      exists: finalizedExists[key] ?? fs.existsSync(filePath)
    };
    return acc;
  }, {});
}

function buildProof(artifactEvidence = artifactPathEvidence()) {
  return {
  generatedAt: new Date().toISOString(),
  fixtureTimestamp: now.toISOString(),
  repoRoot,
  outputRoot,
  claimBoundary: "Fixture/contact-sheet proof only. Not real iOS Lock Screen placement proof.",
  expectedStateIds,
  states: states.map((state) => ({
    id: state.id,
    title: state.title,
    kind: state.kind,
    snapshotState: state.snapshot.state || null,
    value: state.snapshot.value,
    detail: state.snapshot.detail,
    evidence: state.evidence
  })),
  assertions: {
    eightStates: states.length === 8,
    expectedStateIds: expectedStateIds.every((id) => states.some((state) => state.id === id)),
    privacyRedaction: Boolean(privacyState?.snapshot.detail === "Hidden assignment") &&
      ![
        "Lab Report",
        "Discussion prep",
        "Map worksheet",
        "CHEM",
        "HIST",
        "Private Teacher",
        "Secret Room",
        "Private checklist detail",
        "private-reminder-id",
        "private-calendar-id"
      ].some((fragment) => privacySerialized.includes(fragment)),
    plusLockEvidence,
    studioProofEvidence,
    contrastLegibility: accessibilityProof.summary.allContrastPassed,
    textBoundaries: accessibilityProof.summary.allTextBoundariesPassed,
    privacyFixtureTruth: accessibilityProof.summary.privacyFixtureTruthPassed,
    expectedArtifactPaths: artifactEvidence,
    imageDimensions: png.produced
      ? { produced: true, width: png.width, height: png.height, minimumWidth: sheetWidth, minimumHeight: 1600, renderer: png.tool }
      : { produced: false, reason: png.reason || "PNG converter unavailable" }
  },
  accessibility: accessibilityProof
};
}

if (failures.length) {
  fs.writeFileSync(expectedFiles.proofJson, `${JSON.stringify(buildProof(), null, 2)}\n`);
  fs.writeFileSync(
    expectedFiles.summary,
    `# StudyPlanner Widget Fixture Contact Sheet\n\nStatus: failed\n\nFailures:\n${failures.map((failure) => `- ${failure}`).join("\n")}\n`
  );
  console.error("Widget fixture contact sheet failures:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const finalArtifactEvidence = artifactPathEvidence({
  proofJson: true,
  summary: true
});
fs.writeFileSync(expectedFiles.proofJson, `${JSON.stringify(buildProof(finalArtifactEvidence), null, 2)}\n`);

const hashes = Object.fromEntries(
  Object.entries(expectedFiles)
    .filter(([key]) => key !== "summary")
    .filter(([, filePath]) => fs.existsSync(filePath))
    .map(([key, filePath]) => [key, sha256(filePath)])
);
const summary = `# StudyPlanner Widget Fixture Contact Sheet

Status: passed

Generated artifacts:

- HTML: ${expectedFiles.html}
- SVG: ${expectedFiles.svg}
- PNG: ${png.produced ? expectedFiles.png : `not produced (${png.reason || "PNG converter unavailable"})`}
- Proof JSON: ${expectedFiles.proofJson}
- Summary: ${expectedFiles.summary}

Assertions:

- Eight fixture states: passed (${expectedStateIds.join(", ")})
- Privacy redaction: passed
- Plus-lock evidence: passed
- Studio proof meter source evidence: passed
- Native preview progress dots: passed
- Contrast / legibility checks: passed (${accessibilityProof.summary.contrastChecks} checks, minimum ${accessibilityProof.summary.minimumContrastRatio}:1)
- Text boundary checks: passed (${accessibilityProof.summary.textBoundaryChecks} slots)
- Privacy fixture truth: passed
- Expected artifact paths: passed
- PNG dimensions: ${png.produced ? `passed (${png.width} x ${png.height})` : "skipped; converter unavailable"}

Claim boundary: fixture/contact-sheet proof only. This is not real iOS Lock Screen placement proof.

SHA-256:

${Object.entries(hashes)
  .map(([key, hash]) => `- ${key}: ${hash}`)
  .join("\n")}

Summary hash is intentionally omitted because this file embeds the artifact hashes above.
`;

fs.writeFileSync(expectedFiles.summary, summary);

const postSummaryHashes = Object.fromEntries(
  Object.entries(expectedFiles)
    .filter(([key]) => key !== "summary")
    .filter(([, filePath]) => fs.existsSync(filePath))
    .map(([key, filePath]) => [key, sha256(filePath)])
);
const hashDrift = Object.entries(hashes).filter(([key, hash]) => postSummaryHashes[key] !== hash);
if (hashDrift.length) {
  console.error("Widget fixture contact sheet failures:");
  for (const [key, hash] of hashDrift) {
    console.error(`- Summary hash drift for ${key}: wrote ${hash}, current ${postSummaryHashes[key] || "missing"}`);
  }
  process.exit(1);
}

const missingExpectedArtifacts = Object.values(artifactPathEvidence()).filter((item) => item.required && !item.exists);
if (missingExpectedArtifacts.length) {
  console.error("Widget fixture contact sheet failures:");
  for (const item of missingExpectedArtifacts) console.error(`- Expected artifact path missing: ${item.path}`);
  process.exit(1);
}

console.log(`StudyPlanner widget fixture contact sheet generated at ${outputRoot}`);
console.log(`HTML: ${expectedFiles.html}`);
console.log(`Proof JSON: ${expectedFiles.proofJson}`);
console.log(`Summary: ${expectedFiles.summary}`);
if (png.produced) {
  console.log(`PNG: ${expectedFiles.png} (${png.width} x ${png.height})`);
} else {
  console.log(`PNG: skipped (${png.reason || "PNG converter unavailable"})`);
}
