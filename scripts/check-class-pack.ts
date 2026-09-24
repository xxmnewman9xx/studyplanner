/// <reference types="node" />
// Class Pack / Quiz Duel codec checks: round trip, privacy, import batch,
// hostile-input fuzzing, and QR eligibility.

import assert from "node:assert/strict";
import { deflateRaw } from "pako";
import { SharedPayload, StudySet } from "../src/appleIntelligence/types";
import { addDaysKey } from "../src/appleIntelligence/dateKeys";
import {
  appStoreLink,
  base64UrlDecode,
  base64UrlEncode,
  classPackFromData,
  decodeShared,
  duelFromStudySet,
  duelLink,
  duelToStudyQuestions,
  encodeShared,
  MAX_ENCODED_CHARS,
  packLink,
  packToImportBatch,
  qrEligible,
  sharedFromUrl,
} from "../src/classPack";
import { qrMatrix } from "../src/qrMatrix";
import { AppData, ExamItem, TaskItem } from "../src/types";
import { defaultData } from "./fixture-data";

let checks = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    checks += 1;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    throw error;
  }
}

const NOW = new Date(2026, 8, 1, 10, 0, 0);

function packData(itemCount: number): AppData {
  const tasks: TaskItem[] = [];
  const exams: ExamItem[] = [];
  for (let i = 0; i < itemCount; i += 1) {
    const dueDate = addDaysKey("2026-09-02", i * 2);
    if (i % 5 === 0) {
      exams.push({ id: `e${i}`, classId: "bio", title: `Quiz ${i / 5 + 1} — células`, dueOffset: 0, dueDate, time: "9:00 AM", room: "SECRET-ROOM 12", kind: "Quiz", topics: ["SECRET topic"], weight: 5, notes: "SECRET exam notes", description: "SECRET exam description" });
    } else {
      tasks.push({ id: `t${i}`, title: `Problem Set ${i}`, classId: "bio", type: "Assignment", dueOffset: 0, dueDate, time: "11:59 PM", estimateMinutes: 60, done: false, urgent: false, source: "SECRET syllabus source", description: "SECRET task description", subtasks: [{ title: "SECRET subtask", done: false }], weight: i % 3 ? undefined : 2.5, score: 97 });
    }
  }
  return {
    ...JSON.parse(JSON.stringify(defaultData)),
    classes: [{ id: "bio", code: "BIO 101", name: "Biología Introductoria", professor: "SECRET Dr. Alvarez", room: "SECRET Hall", days: "Mon Wed Fri", time: "9:00 AM", next: "", health: 0.8, grade: "SECRET A-", color: "#000", color2: "#111", icon: "book", notes: "SECRET class notes", gradeEntries: [{ id: "g", label: "SECRET", score: 1, maxScore: 1 }] }],
    tasks,
    exams,
    notes: [{ id: "n", classId: "bio", title: "SECRET note", createdAt: "", summary: "SECRET", terms: [], suggestedTasks: [], pages: 1, sourceText: "SECRET note body" }],
    studyBlocks: [],
    imports: [],
  };
}

function isValidShape(payload: SharedPayload): boolean {
  // Re-encoding a decoded payload must decode to the identical value.
  const again = decodeShared(encodeShared(payload));
  return JSON.stringify(again) === JSON.stringify(payload);
}

check("base64url codec round-trips every length", () => {
  for (let length = 0; length < 70; length += 1) {
    const bytes = Uint8Array.from({ length }, (_, i) => (i * 37 + length) & 0xff);
    const encoded = base64UrlEncode(bytes);
    assert.match(encoded, /^[A-Za-z0-9_-]*$/);
    assert.deepEqual(Array.from(base64UrlDecode(encoded)!), Array.from(bytes));
    assert.equal(encoded, Buffer.from(bytes).toString("base64url"));
  }
  assert.equal(base64UrlDecode("abc="), null);
  assert.equal(base64UrlDecode("a"), null);
});

check("40-item Class Pack round-trips through links and never carries private text", () => {
  const data = packData(40);
  const pack = classPackFromData(data, "bio", NOW)!;
  assert.equal(pack.i.length, 40);
  assert.deepEqual(pack.c, { code: "BIO 101", name: "Biología Introductoria", days: "Mon Wed Fri", time: "9:00 AM" });
  assert.ok(pack.i.every((item, i, list) => i === 0 || list[i - 1].d <= item.d));
  const quiz = pack.i.find((item) => item.k === "e")!;
  assert.deepEqual(Object.keys(quiz).sort(), ["d", "k", "t", "tm", "w", "x"]);
  assert.equal(quiz.x, "Quiz");
  const json = JSON.stringify(pack);
  assert.ok(!json.includes("SECRET"), "no notes, rooms, grades, professor, descriptions, sources, or subtasks");
  const encoded = encodeShared({ kind: "pack", pack });
  assert.ok(encoded.startsWith("v1."));
  assert.ok(encoded.length <= 2048, `link payload ${encoded.length} ≤ 2 KB`);
  assert.deepEqual(decodeShared(encoded), { kind: "pack", pack });
  assert.deepEqual(decodeShared(`#${encoded}`), { kind: "pack", pack });
  const link = packLink(pack);
  assert.ok(link.startsWith("https://studyplanner-ai.xxmnewman9xx.workers.dev/p?ct=pack#v1."));
  assert.deepEqual(sharedFromUrl(link), { kind: "pack", pack });
  assert.deepEqual(sharedFromUrl(`studyplanner://pack#${encoded}`), { kind: "pack", pack });
  assert.deepEqual(sharedFromUrl(`studyplanner://pack?ct=pack#${encoded}`), { kind: "pack", pack });
  // The landing page "Open" button uses the short hosts.
  assert.deepEqual(sharedFromUrl(`studyplanner://p#${encoded}`), { kind: "pack", pack });
  assert.equal(sharedFromUrl(`studyplanner://d#${encoded}`), null);
  assert.equal(sharedFromUrl(link.replace("/p?", "/d?")), null, "path must match payload kind");
  assert.equal(sharedFromUrl(`studyplanner://duel#${encoded}`), null);
  assert.equal(sharedFromUrl(link.toLowerCase()), null, "lowercased payloads are rejected (use the raw URL)");
  assert.equal(sharedFromUrl(link.replace("workers.dev", "workers.dev.evil.com")), null);
  assert.equal(sharedFromUrl(`https://evil.example/p#${encoded}`), null);
  assert.equal(sharedFromUrl(`https://studyplanner-ai.xxmnewman9xx.workers.dev/p?ct=pack`), null);
  assert.equal(appStoreLink("forecast"), "https://apps.apple.com/app/id6766181202?ct=forecast");
});

check("oversized classes are trimmed to fit a 2 KB link", () => {
  const pack = classPackFromData(packData(200), "bio", NOW)!;
  assert.ok(pack.i.length > 0 && pack.i.length <= 60);
  assert.ok(encodeShared({ kind: "pack", pack }).length <= 2048);
  assert.equal(classPackFromData(packData(3), "nope", NOW), null);
});

check("packToImportBatch builds a normal review batch and skips exact duplicates", () => {
  const pack = classPackFromData(packData(10), "bio", NOW)!;
  const fresh = { ...JSON.parse(JSON.stringify(defaultData)), classes: [], tasks: [], exams: [] } as AppData;
  const batch = packToImportBatch(pack, fresh, NOW);
  assert.equal(batch.sourceName, "Class Pack");
  assert.equal(batch.status, "review");
  assert.equal(batch.candidates[0].kind, "class");
  assert.equal((batch.candidates[0].payload as any).code, "BIO 101");
  assert.equal((batch.candidates[0].payload as any).days, "Mon Wed Fri");
  assert.equal(batch.candidates.length, 11);
  batch.candidates.forEach((candidate) => {
    assert.equal(candidate.confidence, 0.9);
    assert.equal(candidate.approved, true);
    assert.equal(candidate.classId, "bio101");
  });
  const task = batch.candidates.find((candidate) => candidate.kind === "task")!;
  assert.equal((task.payload as any).source, "Class Pack");
  assert.equal((task.payload as any).done, false);
  const examCandidate = batch.candidates.find((candidate) => candidate.kind === "exam")!;
  assert.equal((examCandidate.payload as any).kind, "Quiz");
  assert.equal((examCandidate.payload as any).weight, 5);
  const existing = packData(10);
  const againstExisting = packToImportBatch(pack, existing, NOW);
  assert.equal(againstExisting.candidates.length, 0, "same class, same items → nothing new");
  const moved = { ...pack, i: pack.i.map((item, i) => (i === 0 ? { ...item, d: addDaysKey(item.d, 1) } : item)) };
  const reconciled = packToImportBatch(moved, existing, NOW);
  assert.equal(reconciled.candidates.length, 1, "a moved date stays for ReviewImport reconciliation");
  assert.equal(reconciled.candidates[0].classId, "bio");
});

const STUDY_SET: StudySet = {
  noteId: "n1",
  sourceHash: "x",
  origin: "heuristic",
  summary: "SECRET summary",
  concepts: [],
  cards: [{ id: "c", front: "SECRET front", back: "SECRET back", source: { quote: "SECRET quote", line: 1 } }],
  questions: Array.from({ length: 12 }, (_, i) => ({
    id: `q${i}`,
    stem: i === 0 ? `A very long definition stem ${"word ".repeat(40)}end` : `Which term matches definition ${i}?`,
    options: [`Term ${i}a`, `Term ${i}b`, `Term ${i}c`, `Term ${i}d`] as [string, string, string, string],
    answerIndex: (i % 4) as 0 | 1 | 2 | 3,
    why: "SECRET why",
    source: { quote: "SECRET note line", line: i + 1 },
  })),
  createdAt: NOW.toISOString(),
  schemaVersion: 1,
};

check("Quiz Duel carries only stems, options, keys, and a clamped score", () => {
  const duel = duelFromStudySet(STUDY_SET, "Cell biology", 99)!;
  assert.equal(duel.q.length, 10);
  assert.equal(duel.score, 10);
  assert.ok(duel.q[0].s.length <= 120 && duel.q[0].s.endsWith("…"));
  assert.ok(!JSON.stringify(duel).includes("SECRET"));
  const link = duelLink(duel);
  assert.ok(link.startsWith("https://studyplanner-ai.xxmnewman9xx.workers.dev/d?ct=duel#v1."));
  assert.deepEqual(sharedFromUrl(link), { kind: "duel", duel });
  const questions = duelToStudyQuestions(duel);
  assert.equal(questions.length, 10);
  questions.forEach((question, i) => {
    assert.equal(question.sharedByClassmate, true);
    assert.equal(question.answerIndex, duel.q[i].a);
    assert.equal(question.why, "");
  });
  assert.equal(duelFromStudySet({ ...STUDY_SET, questions: [] }, "x"), null);
  assert.equal(duelFromStudySet(STUDY_SET, "x", -3)!.score, 0);
});

check("QR eligibility is limited to ≤ 1 KB payloads", () => {
  const small = packLink(classPackFromData(packData(6), "bio", NOW)!);
  assert.equal(qrEligible(small), true);
  assert.ok(qrMatrix(small).length >= 21);
  const big = packLink({ v: 1, c: { code: "BIO 101" }, i: Array.from({ length: 60 }, (_, i) => ({ k: "t" as const, t: `Unique title ${i} ${Math.sin(i).toString(36).slice(2, 12)}`, d: addDaysKey("2026-09-01", i) })) });
  assert.equal(qrEligible(big), false);
  assert.equal(qrEligible(""), false);
});

// ---------------------------------------------------------------------------
// Fuzz: 1,000 hostile payloads. decodeShared/sharedFromUrl must never throw,
// and anything they accept must be a well-formed payload.
// ---------------------------------------------------------------------------

let seed = 0x2f6b1d;
function random() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function pick<T>(list: T[]): T {
  return list[Math.floor(random() * list.length)];
}
function encodeJson(value: unknown) {
  return `v1.${base64UrlEncode(deflateRaw(JSON.stringify(value)))}`;
}

check("1,000-case fuzz of mutated and oversized payloads", () => {
  const goodPack = classPackFromData(packData(20), "bio", NOW)!;
  const goodDuel = duelFromStudySet(STUDY_SET, "Duel", 3)!;
  const valid = [encodeShared({ kind: "pack", pack: goodPack }), encodeShared({ kind: "duel", duel: goodDuel })];
  const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const invalidShapes: unknown[] = [
    { ...goodPack, v: 2 },
    { ...goodPack, i: Array.from({ length: 61 }, () => goodPack.i[0]) },
    { ...goodPack, c: { code: "x".repeat(121) } },
    { ...goodPack, c: { code: "" } },
    { ...goodPack, c: { code: "BIO\u0000101" } },
    { ...goodPack, i: [{ ...goodPack.i[0], d: "2026-02-30" }] },
    { ...goodPack, i: [{ ...goodPack.i[0], d: "tomorrow" }] },
    { ...goodPack, i: [{ ...goodPack.i[0], k: "x" }] },
    { ...goodPack, i: [{ ...goodPack.i[0], w: 101 }] },
    { ...goodPack, i: [{ ...goodPack.i[0], w: "5" }] },
    { ...goodPack, i: [{ ...goodPack.i[0], t: 5 }] },
    { ...goodPack, i: [null] },
    { ...goodPack, i: "items" },
    { ...goodDuel, q: [] },
    { ...goodDuel, q: Array.from({ length: 11 }, () => goodDuel.q[0]) },
    { ...goodDuel, q: [{ ...goodDuel.q[0], a: 4 }] },
    { ...goodDuel, q: [{ ...goodDuel.q[0], a: 1.5 }] },
    { ...goodDuel, q: [{ ...goodDuel.q[0], o: ["a", "b", "c"] }] },
    { ...goodDuel, q: [{ ...goodDuel.q[0], o: ["Same", "same", "c", "d"] }] },
    { ...goodDuel, q: [{ ...goodDuel.q[0], s: "y".repeat(121) }] },
    { ...goodDuel, score: 11 },
    { ...goodDuel, title: "" },
    [],
    "string",
    42,
    null,
    { v: 1 },
    { c: {}, q: [] },
  ];
  let accepted = 0;
  for (let n = 0; n < 1000; n += 1) {
    const mode = n % 8;
    let input: string;
    let mustReject = false;
    if (mode === 0) {
      const base = pick(valid).split("");
      const flips = 1 + Math.floor(random() * 4);
      for (let f = 0; f < flips; f += 1) base[3 + Math.floor(random() * (base.length - 3))] = pick(B64.split(""));
      input = base.join("");
    } else if (mode === 1) {
      const base = pick(valid);
      input = base.slice(0, 3 + Math.floor(random() * (base.length - 3)));
    } else if (mode === 2) {
      const base = pick(valid);
      const at = 3 + Math.floor(random() * (base.length - 3));
      input = `${base.slice(0, at)}${pick(["!", "=", "%", " ", "é", "\u0000", "/"])}${base.slice(at)}`;
      mustReject = true;
    } else if (mode === 3) {
      input = `v1.${Array.from({ length: 1 + Math.floor(random() * 400) }, () => pick(B64.split(""))).join("")}`;
    } else if (mode === 4) {
      input = encodeJson(pick(invalidShapes));
      mustReject = true;
    } else if (mode === 5) {
      input = `v1.${"A".repeat(MAX_ENCODED_CHARS)}`;
      mustReject = true;
    } else if (mode === 6) {
      // Zip bomb: tiny compressed payload that inflates far past 16 KB.
      const bomb = `{"v":1,"c":{"code":"BIO 101"},"i":[],"pad":"${"0".repeat(20000 + Math.floor(random() * 500000))}"}`;
      input = `v1.${base64UrlEncode(deflateRaw(bomb, { level: 9 }))}`;
      assert.ok(input.length <= MAX_ENCODED_CHARS, "bomb fits the encoded cap");
      mustReject = true;
    } else {
      const bytes = Uint8Array.from({ length: 1 + Math.floor(random() * 300) }, () => Math.floor(random() * 256));
      input = pick([`v1.${base64UrlEncode(bytes)}`, `v2.${base64UrlEncode(bytes)}`, base64UrlEncode(bytes), `v1.${base64UrlEncode(deflateRaw(bytes))}`]);
      if (!input.startsWith("v1.")) mustReject = true;
    }
    let decoded: SharedPayload | null = null;
    assert.doesNotThrow(() => {
      decoded = decodeShared(input);
    }, `decodeShared threw on case ${n}`);
    assert.doesNotThrow(() => sharedFromUrl(`https://studyplanner-ai.xxmnewman9xx.workers.dev/p#${input}`), `sharedFromUrl threw on case ${n}`);
    if (mustReject) assert.equal(decoded, null, `case ${n} (mode ${mode}) must be rejected`);
    if (decoded) {
      accepted += 1;
      assert.ok(isValidShape(decoded), `accepted payload in case ${n} is well-formed`);
    }
  }
  for (const weird of [undefined, null, 42, {}, [], "", "v1.", "#", "v1.====", `v1.${"_".repeat(5000)}`]) {
    assert.equal(decodeShared(weird as unknown), null);
    assert.equal(sharedFromUrl(weird as unknown), null);
  }
  console.log(`  fuzz: 1000 cases, ${accepted} benign mutations still decoded to valid payloads`);
});

console.log(`Class Pack checks passed (${checks})`);
