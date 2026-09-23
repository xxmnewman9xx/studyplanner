// Static + unit checks for the StudyPlanner 2.2 on-device intelligence bridge.
// Runs on Linux (no Swift toolchain): it reads the Swift sources as text and
// drives the pure runner core with fakes.
//
//   npm run test:ai-native

import assert from "node:assert/strict";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import {
  cacheKeyFor,
  createRunnerCore,
  foregroundGate,
  stableHash,
  stableStringify,
  type RunnerDeps,
  type RunnerNativeResult,
} from "../src/appleIntelligence/runnerCore";
import type { AIAvailability, AIFeature } from "../src/appleIntelligence/types";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const MODULE_DIR = "modules/studyplanner-apple-intelligence";
const IOS = `${MODULE_DIR}/ios`;
const typesTs = read("src/appleIntelligence/types.ts");
const nativeTs = read("src/appleIntelligence/native.ts");
const clientTs = read("src/appleIntelligence/client.ts");
const schemasSwift = read(`${IOS}/Schemas.swift`);
const featuresSwift = read(`${IOS}/Features.swift`);
const moduleSwift = read(`${IOS}/StudyPlannerAppleIntelligenceModule.swift`);
const documentSwift = read(`${IOS}/DocumentReader.swift`);
const surfacesSwift = read(`${IOS}/Surfaces.swift`);
const podspec = read(`${IOS}/StudyPlannerAppleIntelligence.podspec`);
const allSwift = [schemasSwift, featuresSwift, moduleSwift, documentSwift, surfacesSwift].join("\n");

const results: string[] = [];
function check(name: string, fn: () => void) {
  fn();
  results.push(name);
}
async function checkAsync(name: string, fn: () => Promise<void>) {
  await fn();
  results.push(name);
}

// ---------------------------------------------------------------------------
// Helpers: parse TS object types and Swift structs.
// ---------------------------------------------------------------------------

type Field = { name: string; optional: boolean };

function tsObjectType(name: string): Field[] {
  const match = typesTs.match(new RegExp(`export type ${name} = \\{([^}]*)\\};`));
  assert.ok(match, `types.ts: ${name} object type not found`);
  const body = match[1].replace(/\/\*\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const fields: Field[] = [];
  for (const piece of body.split(/[;\n]/)) {
    const field = piece.trim().match(/^(\w+)(\?)?\s*:/);
    if (field) fields.push({ name: field[1], optional: Boolean(field[2]) });
  }
  assert.ok(fields.length > 0, `types.ts: ${name} has no fields`);
  return fields;
}

function swiftStructBody(source: string, name: string): string {
  const start = source.search(new RegExp(`struct ${name}\\b[^{]*\\{`));
  assert.ok(start >= 0, `Swift struct ${name} not found`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  throw new Error(`Unbalanced struct ${name}`);
}

function swiftFields(body: string): Map<string, { type: string; line: string }> {
  const fields = new Map<string, { type: string; line: string }>();
  const lines = body.split("\n");
  lines.forEach((line, index) => {
    const match = line.match(/^\s*var (\w+):\s*([^\s=]+)/);
    if (match) fields.set(match[1], { type: match[2], line: `${lines[index - 1] ?? ""}\n${line}` });
  });
  return fields;
}

function tsUnionLiterals(name: string): string[] {
  const match = typesTs.match(new RegExp(`export type ${name} =([^;]*);`));
  assert.ok(match, `types.ts: ${name} union not found`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

// Raw TS type -> [@Generable struct, DTO struct]
const RAW_TYPES: Record<string, string> = {
  RawSyllabusCourse: "SyllabusCourse",
  RawSyllabusItem: "SyllabusItem",
  RawSyllabusChunk: "SyllabusChunk",
  RawStudyCard: "StudyCard",
  RawStudyQuestion: "StudyQuestion",
  RawNoteStudySet: "NoteStudySet",
  RawDailyBrief: "DailyBrief",
  RawTaskProposal: "TaskProposal",
};

// ---------------------------------------------------------------------------
// 1. Schema contract: every Raw* field is in Schemas.swift (Generable + DTO).
// ---------------------------------------------------------------------------

check("every Raw* type in types.ts is mirrored by a @Generable struct and a DTO", () => {
  const declared = [...typesTs.matchAll(/export type (Raw\w+) = \{/g)].map((match) => match[1]);
  assert.deepEqual([...declared].sort(), Object.keys(RAW_TYPES).sort(), "Raw* object types changed; update RAW_TYPES and Schemas.swift");

  for (const [rawName, generableName] of Object.entries(RAW_TYPES)) {
    const tsFields = tsObjectType(rawName);
    const generableIndex = schemasSwift.search(new RegExp(`@Generable\\([^)]*\\)\\s*\\nstruct ${generableName}\\b`));
    assert.ok(generableIndex >= 0, `${generableName} must be @Generable`);
    const generable = swiftFields(swiftStructBody(schemasSwift, generableName));
    const dto = swiftFields(swiftStructBody(schemasSwift, `${rawName}DTO`));
    assert.deepEqual([...generable.keys()].sort(), tsFields.map((field) => field.name).sort(), `${generableName} fields != ${rawName}`);
    assert.deepEqual([...dto.keys()].sort(), tsFields.map((field) => field.name).sort(), `${rawName}DTO fields != ${rawName}`);
    for (const field of tsFields) {
      for (const [label, fields] of [[generableName, generable], [`${rawName}DTO`, dto]] as const) {
        const swiftType = fields.get(field.name)!.type;
        assert.equal(swiftType.endsWith("?"), field.optional, `${label}.${field.name} optionality must match ${rawName}`);
      }
    }
  }
});

check("RawSyllabusKind literals are the .anyOf guide on both kind fields", () => {
  const kinds = tsUnionLiterals("RawSyllabusKind");
  const anyOfLists = [...schemasSwift.matchAll(/\.anyOf\(\[([^\]]*)\]\)/g)].map((match) =>
    [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]),
  );
  assert.equal(anyOfLists.length, 2, "expected .anyOf on SyllabusItem.kind and TaskProposal.kind");
  for (const list of anyOfLists) assert.deepEqual([...list].sort(), [...kinds].sort());
});

check("guides match the plan (C4) bounds", () => {
  const guide = (struct: string, field: string) => swiftFields(swiftStructBody(schemasSwift, struct)).get(field)!.line;
  assert.match(guide("SyllabusChunk", "courses"), /\.maximumCount\(6\)/);
  assert.match(guide("SyllabusChunk", "items"), /\.maximumCount\(30\)/);
  assert.match(guide("NoteStudySet", "cards"), /\.maximumCount\(12\)/);
  assert.match(guide("NoteStudySet", "questions"), /\.maximumCount\(6\)/);
  assert.match(guide("NoteStudySet", "concepts"), /\.maximumCount\(8\)/);
  assert.match(guide("StudyQuestion", "options"), /\.count\(4\)/);
  assert.match(guide("StudyQuestion", "answerIndex"), /\.range\(0\.\.\.3\)/);
  assert.match(guide("DailyBrief", "focusIndex"), /\.range\(0\.\.\.4\)/);
  assert.match(guide("TaskProposal", "estimateMinutes"), /\.range\(15\.\.\.240\)/);
});

check("schema/instructions versions match between Swift and native.ts", () => {
  const swiftSchema = schemasSwift.match(/static let schema = (\d+)/)?.[1];
  const swiftInstructions = schemasSwift.match(/static let instructions = (\d+)/)?.[1];
  assert.equal(nativeTs.match(/AI_SCHEMA_VERSION = (\d+)/)?.[1], swiftSchema);
  assert.equal(nativeTs.match(/AI_INSTRUCTIONS_VERSION = (\d+)/)?.[1], swiftInstructions);
});

// ---------------------------------------------------------------------------
// 2. Error codes: every AIErrorCode is produced by the Swift side.
// ---------------------------------------------------------------------------

check("every AIErrorCode string is produced by the Swift mapping", () => {
  const codes = tsUnionLiterals("AIErrorCode");
  assert.equal(codes.length, 12);
  for (const code of codes) {
    assert.ok(featuresSwift.includes(`"${code}"`), `Features.swift never produces "${code}"`);
  }
  // Each GenerationError case is mapped.
  const mapping = featuresSwift.slice(featuresSwift.indexOf("static func errorCode"));
  for (const swiftCase of [
    "exceededContextWindowSize",
    "guardrailViolation",
    "refusal",
    "unsupportedLanguageOrLocale",
    "rateLimited",
    "concurrentRequests",
    "decodingFailure",
    "unsupportedGuide",
    "assetsUnavailable",
  ]) {
    assert.match(mapping, new RegExp(`case \\.${swiftCase}:`), `GenerationError.${swiftCase} not mapped`);
  }
  assert.match(mapping, /@unknown default/);
  // The module rejects with Expo Exceptions carrying the code.
  assert.match(moduleSwift, /Exception\(name: "StudyPlannerAppleIntelligenceError", description: message, code: code\)/);
  assert.match(moduleSwift, /AIBridgeError\.background/);
  assert.match(moduleSwift, /AIBridgeError\.timeout/);
  assert.match(moduleSwift, /AIBridgeError\.cancelled/);
  assert.match(moduleSwift, /AIBridgeError\.busy/);
});

check("availability reasons in Swift match AIUnavailableReason (minus userDisabled, which is TS-only)", () => {
  const reasons = tsUnionLiterals("AIUnavailableReason").filter((reason) => reason !== "userDisabled");
  for (const reason of reasons) assert.ok(moduleSwift.includes(`"${reason}"`), `Swift never reports reason ${reason}`);
  for (const state of tsUnionLiterals("AIAvailabilityState").filter((state) => state !== "missingModule")) {
    assert.ok(moduleSwift.includes(`"${state}"`), `Swift never reports state ${state}`);
  }
  assert.match(moduleSwift, /supportsLocale\(Locale\(identifier:/);
  assert.match(moduleSwift, /\.contextSize/);
});

// ---------------------------------------------------------------------------
// 3. Linking + availability hygiene.
// ---------------------------------------------------------------------------

check("podspec weak-links FoundationModels, iOS 16.4, Swift >= 5.9", () => {
  assert.match(podspec, /s\.weak_frameworks\s*=\s*\[?\s*'FoundationModels'/);
  assert.doesNotMatch(podspec, /s\.frameworks\s*=[^\n]*FoundationModels/, "FoundationModels must not be strongly linked");
  assert.match(podspec, /:ios => '16\.4'/);
  const swiftVersion = Number(podspec.match(/s\.swift_version\s*=\s*'([\d.]+)'/)?.[1] ?? 0);
  assert.ok(swiftVersion >= 5.9);
  assert.match(podspec, /s\.name\s*=\s*'StudyPlannerAppleIntelligence'/);
});

check("every FoundationModels-dependent Swift type carries @available(iOS 26.0, ...)", () => {
  const files: Array<[string, string]> = [
    ["Schemas.swift", schemasSwift],
    ["Features.swift", featuresSwift],
  ];
  for (const [file, source] of files) {
    // FoundationModels is only ever imported behind canImport.
    for (const match of source.matchAll(/^import FoundationModels$/gm)) {
      const before = source.slice(0, match.index);
      const lastIf = before.lastIndexOf("#if canImport(FoundationModels)");
      const lastEndif = before.lastIndexOf("#endif");
      assert.ok(lastIf > lastEndif, `${file}: import FoundationModels must be inside #if canImport(FoundationModels)`);
    }
    const fmStart = source.indexOf("#if canImport(FoundationModels)\nimport FoundationModels");
    const fmSection = fmStart >= 0 ? source.slice(fmStart) : "";
    const lines = fmSection.split("\n");
    lines.forEach((line, index) => {
      const decl = line.match(/^(?:final |public |private |fileprivate |internal )*(struct|enum|actor|class|extension)\s+(\w+)/);
      if (!decl) return;
      const attributes = lines.slice(Math.max(0, index - 3), index).join("\n");
      assert.match(attributes, /@available\(iOS 26\.0/, `${file}: ${decl[1]} ${decl[2]} needs @available(iOS 26.0, *)`);
    });
  }
  // The module file imports FoundationModels only behind canImport, and its one
  // FM-dependent type (the actor) is availability-gated.
  const moduleImport = moduleSwift.indexOf("import FoundationModels");
  assert.ok(moduleSwift.lastIndexOf("#if canImport(FoundationModels)", moduleImport) >= 0);
  assert.equal((moduleSwift.match(/^(?:final |public )*(?:actor|struct|enum|class)\s+\w+/gm) ?? []).length, 3);
  // Explicit spot checks.
  assert.match(moduleSwift, /@available\(iOS 26\.0, \*\)\nactor AIEngine/);
  assert.match(featuresSwift, /@available\(iOS 26\.0, macOS 26\.0, \*\)\nenum AIFeatures/);
  // Module keeps the actor type-erased.
  assert.match(moduleSwift, /private var storage: Any\?/);
  // iOS 26 Vision reader is availability-gated too.
  assert.match(documentSwift, /@available\(iOS 26\.0, \*\)\nenum StructuredDocumentReader/);
  assert.match(documentSwift, /if #available\(iOS 26\.0, \*\)/);
  assert.match(documentSwift, /VNRecognizeTextRequest/);
  assert.match(documentSwift, /maxPages = 20/);
});

check("inference is foreground-only and serial on the native side too", () => {
  assert.match(moduleSwift, /UIApplication\.shared\.applicationState/);
  assert.match(moduleSwift, /if let previous \{ await previous\.value \}/);
  assert.match(featuresSwift, /sampling: \.greedy/);
  assert.match(featuresSwift, /temperature: 0\.3/);
});

check("App Group id matches app.json and only the two allowed files are addressable", () => {
  const appJson = read("app.json");
  const groupId = surfacesSwift.match(/groupIdentifier = "([^"]+)"/)?.[1];
  assert.equal(groupId, "group.com.mattnewman.studyplanner");
  assert.ok(appJson.includes(`"${groupId}"`), "App Group id missing from app.json");
  assert.match(surfacesSwift, /\["intelligence-snapshot", "intent-inbox", "pending-route"\]/);
  assert.match(surfacesSwift, /options: \[\.atomic\]/);
  assert.match(surfacesSwift, /"class:\\\(id\)"/);
  assert.match(surfacesSwift, /"\\\(linkKind\):\\\(id\)"/);
});

// ---------------------------------------------------------------------------
// 4. Module wiring: names line up across Swift, config, native.ts, package.json.
// ---------------------------------------------------------------------------

check("module name and function surface match native.ts", () => {
  const swiftName = moduleSwift.match(/Name\("([^"]+)"\)/)?.[1];
  const tsName = nativeTs.match(/NATIVE_MODULE_NAME = "([^"]+)"/)?.[1];
  assert.equal(swiftName, "StudyPlannerAppleIntelligence");
  assert.equal(tsName, swiftName);
  assert.match(nativeTs, /requireOptionalNativeModule<\w+>\(NATIVE_MODULE_NAME\)/);
  assert.match(nativeTs, /Platform\.OS !== "ios"/);

  const config = JSON.parse(read(`${MODULE_DIR}/expo-module.config.json`));
  const className = config.apple.modules[0];
  assert.match(moduleSwift, new RegExp(`public class ${className}: Module`));

  const swiftFunctions = new Set([...moduleSwift.matchAll(/AsyncFunction\("(\w+)"\)/g)].map((match) => match[1]));
  const typeBody = nativeTs.match(/type StudyPlannerAppleIntelligenceModule = \{([\s\S]*?)\n\};/)?.[1] ?? "";
  const tsFunctions = [...typeBody.matchAll(/^\s*(\w+)\(/gm)].map((match) => match[1]);
  assert.ok(tsFunctions.length >= 10);
  assert.deepEqual([...swiftFunctions].sort(), [...tsFunctions].sort());

  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies["studyplanner-apple-intelligence"], "file:modules/studyplanner-apple-intelligence");
  assert.equal(pkg.scripts["test:ai-native"], "tsx scripts/check-apple-intelligence-native-contract.ts");
});

check("fm-eval harness reuses the shipping Schemas.swift and Features.swift", () => {
  for (const file of ["Schemas.swift", "Features.swift"]) {
    const link = resolve(root, "tools/fm-eval/FMEval/Sources/FMEval", file);
    assert.ok(lstatSync(link).isSymbolicLink(), `${file} must be a symlink`);
    assert.equal(realpathSync(link), realpathSync(resolve(root, IOS, file)));
  }
  const pkg = read("tools/fm-eval/FMEval/Package.swift");
  assert.match(pkg, /\.macOS\("26\.0"\)/);
  assert.ok(existsSync(resolve(root, "tools/fm-eval/FMEval/Sources/FMEval/main.swift")));
  // Shared files must stay free of iOS-only frameworks.
  for (const source of [schemasSwift, featuresSwift]) {
    assert.doesNotMatch(source, /^import (UIKit|ExpoModulesCore|Vision|PDFKit)/m);
  }
});

check("client.ts wires the gated runner and never imports the runner's deps loosely", () => {
  assert.match(clientTs, /appState: \(\) => AppState\.currentState/);
  assert.match(clientTs, /createRunnerCore\(/);
  assert.match(clientTs, /extractTextFromImage/);
  assert.match(clientTs, /reason: "userDisabled"/);
});

// ---------------------------------------------------------------------------
// 5. Runner core behavior (pure; injected AppState, native, cache, timers).
// ---------------------------------------------------------------------------

const AVAILABLE: AIAvailability = { state: "available", contextSize: 4096, osVersion: "26.4.1", documentReader: true };

type Harness = {
  deps: RunnerDeps;
  calls: { run: string[]; cancel: string[]; put: string[] };
  cache: Map<string, string>;
  setState: (state: string) => void;
};

function harness(overrides: Partial<RunnerDeps> = {}, nativeImpl?: (feature: AIFeature, json: string, id: string) => Promise<RunnerNativeResult>): Harness {
  let state = "active";
  const cache = new Map<string, string>();
  const calls = { run: [] as string[], cancel: [] as string[], put: [] as string[] };
  let counter = 0;
  const deps: RunnerDeps = {
    locale: "en-US",
    schemaVersion: 1,
    instructionsVersion: 1,
    appState: () => state,
    availability: async () => AVAILABLE,
    run: async (feature, json, id) => {
      calls.run.push(json);
      if (nativeImpl) return nativeImpl(feature, json, id);
      return { ok: true, json: JSON.stringify({ headline: "Now", body: "Go", focusIndex: 0 }) };
    },
    cancel: (id) => {
      calls.cancel.push(id);
    },
    cacheGet: async (key) => cache.get(key) ?? null,
    cachePut: async (key, _feature, ref, json) => {
      calls.put.push(ref);
      cache.set(key, json);
    },
    makeRequestId: () => `req-${++counter}`,
    ...overrides,
  };
  return { deps, calls, cache, setState: (next) => (state = next) };
}

async function main() {
  await checkAsync("foregroundGate: only 'active' may run inference", async () => {
    assert.equal(foregroundGate("active"), null);
    for (const state of ["background", "inactive", "unknown", "extension", "", null, undefined]) {
      assert.equal(foregroundGate(state as string), "background");
    }
  });

  await checkAsync("runner refuses when AppState != active and never touches native", async () => {
    for (const state of ["background", "inactive"]) {
      const h = harness();
      h.setState(state);
      const runner = createRunnerCore(h.deps);
      const result = await runner("dailyBrief", { facts: "x" });
      assert.deepEqual(result, { ok: false, code: "background" });
      assert.equal(h.calls.run.length, 0);
    }
  });

  await checkAsync("runner re-checks the foreground gate after async availability", async () => {
    const h = harness();
    h.deps.availability = async () => {
      h.setState("background");
      return AVAILABLE;
    };
    const result = await createRunnerCore(h.deps)("syllabusExtract", { text: "Quiz 1 Oct 3" });
    assert.deepEqual(result, { ok: false, code: "background" });
    assert.equal(h.calls.run.length, 0);
  });

  await checkAsync("runner refuses when the model is unavailable / user disabled", async () => {
    const h = harness({ availability: async () => ({ ...AVAILABLE, state: "unavailable", reason: "userDisabled" }) });
    const result = await createRunnerCore(h.deps)("noteStudySet", { text: "notes" });
    assert.deepEqual(result, { ok: false, code: "unavailable" });
    assert.equal(h.calls.run.length, 0);
  });

  await checkAsync("runner runs, strips ref, defaults language, caches, then serves from cache", async () => {
    const h = harness();
    const runner = createRunnerCore(h.deps);
    const first = await runner("dailyBrief", { facts: "Bio quiz", ref: "note-1" });
    assert.equal(first.ok, true);
    assert.equal(first.ok && first.cached, false);
    const sent = JSON.parse(h.calls.run[0]);
    assert.equal(sent.ref, undefined, "ref must not reach the model");
    assert.equal(sent.language, "en-US");
    assert.deepEqual(h.calls.put, ["note-1"]);
    const second = await runner("dailyBrief", { ref: "note-1", facts: "Bio quiz" });
    assert.equal(second.ok && second.cached, true);
    assert.equal(h.calls.run.length, 1, "cache hit must not call native");
  });

  await checkAsync("taskProposal is never cached (C6)", async () => {
    const h = harness();
    const runner = createRunnerCore(h.deps);
    await runner("taskProposal", { text: "bio lab friday" });
    await runner("taskProposal", { text: "bio lab friday" });
    assert.equal(h.calls.run.length, 2);
    assert.equal(h.calls.put.length, 0);
  });

  await checkAsync("cache key covers feature, input, versions, OS and locale", async () => {
    const parts = { schemaVersion: 1, instructionsVersion: 1, osVersion: "26.4", locale: "en-US" };
    const base = cacheKeyFor("syllabusExtract", { text: "a", n: 1 }, parts);
    assert.equal(base, cacheKeyFor("syllabusExtract", { n: 1, text: "a" }, parts), "key order must not matter");
    assert.notEqual(base, cacheKeyFor("noteStudySet", { text: "a", n: 1 }, parts));
    assert.notEqual(base, cacheKeyFor("syllabusExtract", { text: "b", n: 1 }, parts));
    assert.notEqual(base, cacheKeyFor("syllabusExtract", { text: "a", n: 1 }, { ...parts, schemaVersion: 2 }));
    assert.notEqual(base, cacheKeyFor("syllabusExtract", { text: "a", n: 1 }, { ...parts, instructionsVersion: 2 }));
    assert.notEqual(base, cacheKeyFor("syllabusExtract", { text: "a", n: 1 }, { ...parts, osVersion: "27.0" }));
    assert.notEqual(base, cacheKeyFor("syllabusExtract", { text: "a", n: 1 }, { ...parts, locale: "es-MX" }));
    assert.equal(stableStringify({ b: [1, { d: 1, c: 2 }], a: undefined }), '{"b":[1,{"c":2,"d":1}]}');
    assert.match(stableHash("x"), /^[0-9a-f]{16}$/);
    assert.notEqual(stableHash("ab"), stableHash("ba"));
  });

  await checkAsync("timeout resolves {timeout} and cancels native", async () => {
    const h = harness({}, () => new Promise<RunnerNativeResult>(() => undefined));
    const result = await createRunnerCore(h.deps)("dailyBrief", { facts: "x" }, { timeoutMs: 20 });
    assert.deepEqual(result, { ok: false, code: "timeout" });
    assert.deepEqual(h.calls.cancel, ["req-1"]);
  });

  await checkAsync("default timeouts: 20 s extraction, 8 s brief", async () => {
    const seen: number[] = [];
    const h = harness({
      setTimer: (_fn, ms) => {
        seen.push(ms);
        return 0;
      },
      clearTimer: () => undefined,
    });
    const runner = createRunnerCore(h.deps);
    await runner("syllabusExtract", { text: "a" });
    await runner("dailyBrief", { facts: "b" });
    assert.deepEqual(seen, [20_000, 8_000]);
  });

  await checkAsync("AbortSignal: pre-aborted and mid-flight abort both cancel", async () => {
    const pre = harness();
    const aborted = new AbortController();
    aborted.abort();
    assert.deepEqual(await createRunnerCore(pre.deps)("noteStudySet", { text: "a" }, { signal: aborted.signal }), {
      ok: false,
      code: "cancelled",
    });
    assert.equal(pre.calls.run.length, 0);

    const mid = harness({}, () => new Promise<RunnerNativeResult>(() => undefined));
    const controller = new AbortController();
    const pending = createRunnerCore(mid.deps)("noteStudySet", { text: "a" }, { signal: controller.signal, timeoutMs: 5_000 });
    setTimeout(() => controller.abort(), 5);
    assert.deepEqual(await pending, { ok: false, code: "cancelled" });
    assert.deepEqual(mid.calls.cancel, ["req-1"]);
  });

  await checkAsync("malformed model JSON -> decoding (and nothing cached)", async () => {
    const h = harness({}, async () => ({ ok: true, json: "{not json" }));
    assert.deepEqual(await createRunnerCore(h.deps)("syllabusExtract", { text: "a" }), { ok: false, code: "decoding" });
    assert.equal(h.cache.size, 0);
  });

  await checkAsync("native error codes pass through; throws become unavailable", async () => {
    const guard = harness({}, async () => ({ ok: false, code: "guardrail" }));
    assert.deepEqual(await createRunnerCore(guard.deps)("noteStudySet", { text: "a" }), { ok: false, code: "guardrail" });
    const boom = harness({}, async () => {
      throw new Error("boom");
    });
    assert.deepEqual(await createRunnerCore(boom.deps)("noteStudySet", { text: "a" }), { ok: false, code: "unavailable" });
    const badState = harness({
      appState: () => {
        throw new Error("no AppState");
      },
    });
    assert.deepEqual(await createRunnerCore(badState.deps)("noteStudySet", { text: "a" }), { ok: false, code: "background" });
  });

  for (const name of results) console.log(`ok - ${name}`);
  console.log(`\n${results.length} apple-intelligence native contract checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
