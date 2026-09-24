/// <reference types="node" />
// StudyPlanner 2.2 copy gate.
// 1. Every textFor("key", "fallback") in App.tsx resolves to a legacy APP_COPY
//    key (present as an object key in App.tsx) or a 2.2 key in COPY_22_EN.
// 2. Every COPY_22_EN key is translated in all 9 non-English locales with the
//    same {placeholders}.
// Run with --list-missing to print missing keys as a JSON object (key: fallback).
import { readFileSync } from "node:fs";
import { AI_COPY, COPY_22_EN } from "../src/appleIntelligence/copy";

const app = readFileSync("App.tsx", "utf8");
const pairs = new Map<string, string>();
for (const match of app.matchAll(/textFor\(\s*"([a-z0-9_]+\.[a-z0-9_.]+)",\s*"((?:[^"\\]|\\.)*)"/g)) {
  if (!pairs.has(match[1])) pairs.set(match[1], match[2]);
}
const legacyKeys = new Set(Array.from(app.matchAll(/"([a-z0-9_]+\.[a-z0-9_.]+)":\s/g)).map((m) => m[1]));
// Keys assigned through APP_COPY[locale]["key"] = ...
for (const m of app.matchAll(/APP_COPY\[locale\]\["([a-z0-9_.]+)"\]/g)) legacyKeys.add(m[1]);

const missing: Record<string, string> = {};
for (const [key, fallback] of pairs) {
  if (legacyKeys.has(key) || key in COPY_22_EN) continue;
  missing[key] = fallback;
}

if (process.argv.includes("--list-missing")) {
  console.log(JSON.stringify(missing, null, 2));
  process.exit(0);
}

const failures: string[] = [];
const unresolved = Object.keys(missing);
if (unresolved.length) failures.push(`App.tsx uses ${unresolved.length} keys with no copy table entry: ${unresolved.slice(0, 12).join(", ")}${unresolved.length > 12 ? "…" : ""}`);

const placeholders = (text: string) => Array.from(text.matchAll(/\{(\w+)\}/g)).map((m) => m[1]).sort().join(",");
for (const [locale, table] of Object.entries(AI_COPY)) {
  if (locale === "en-US") continue;
  const missingKeys = Object.keys(COPY_22_EN).filter((key) => !table[key]);
  if (missingKeys.length) failures.push(`${locale}: ${missingKeys.length} untranslated 2.2 keys (${missingKeys.slice(0, 6).join(", ")}${missingKeys.length > 6 ? "…" : ""})`);
  for (const [key, value] of Object.entries(table)) {
    if (!(key in COPY_22_EN)) failures.push(`${locale}: stale key ${key}`);
    else if (value && placeholders(value) !== placeholders(COPY_22_EN[key])) failures.push(`${locale}: placeholder mismatch in ${key}`);
  }
}

if (failures.length) {
  console.error("2.2 copy gate failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`2.2 copy gate passed (${Object.keys(COPY_22_EN).length} keys × 10 locales; ${pairs.size} App.tsx keys resolved).`);
