import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type SlotDefinition = {
  id: string;
  title: string;
};

type RegisteredSlot = SlotDefinition & {
  url: string | null;
  status: "registered" | "missing" | "invalid";
  reason?: string;
  checkedAt?: string;
  httpStatus?: number;
};

type RegistryFile = {
  slots?: { id?: string; title?: string; url?: string | null }[];
  urls?: Record<string, string | null>;
};

const OUTPUT_PATH = "qa/back-to-school-2026/supplemental-url-registry.json";
const RELEASE = "Back to School with AI";

const requiredSlots: SlotDefinition[] = [
  { id: "product-video", title: "Import, Review, Semester Ready, Home, Focus, Widgets" },
  { id: "screenshot-contact-sheet", title: "Release Build Screenshot Contact Sheet" },
  { id: "native-widget-sheet", title: "Native WidgetKit Screenshot Sheet" },
  { id: "accessibility-localization-summary", title: "Accessibility and Localization QA Summary" },
  { id: "app-review-proof", title: "App Review Notes and Purchase Flow Proof" },
];

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const strict = args.includes("--strict");
const checkNetwork = args.includes("--check-network");
const inputPath = valueArg("--input");
const setArgs = collectArgs("--set");

function valueArg(name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] || "" : "";
}

function collectArgs(name: string) {
  const values: string[] = [];
  args.forEach((arg, index) => {
    if (arg === name && args[index + 1]) values.push(args[index + 1]);
  });
  return values;
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, payload: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}

function parseRegistryUrls(input: RegistryFile) {
  const urls = new Map<string, string | null>();
  for (const [id, url] of Object.entries(input.urls || {})) {
    urls.set(id, url || null);
  }
  for (const slot of input.slots || []) {
    if (slot.id) urls.set(slot.id, slot.url || null);
  }
  return urls;
}

function parseInputUpdates() {
  const updates = new Map<string, string | null>();
  if (inputPath) {
    const input = readJson<RegistryFile>(inputPath, {});
    for (const [id, url] of parseRegistryUrls(input)) updates.set(id, url);
  }
  for (const raw of setArgs) {
    const split = raw.indexOf("=");
    if (split < 0) updates.set(raw, null);
    else updates.set(raw.slice(0, split), raw.slice(split + 1));
  }
  return updates;
}

function validateHttpsUrl(url: string | null | undefined) {
  if (!url) return { ok: false, reason: "URL is missing." };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return { ok: false, reason: "URL must use https." };
    if (parsed.hostname === "localhost" || parsed.hostname.endsWith(".local")) {
      return { ok: false, reason: "URL must be a stable hosted address, not a local host." };
    }
    if (!parsed.hostname.includes(".")) return { ok: false, reason: "URL host must look publicly resolvable." };
    if (/example\.com|placeholder|todo|TBD/i.test(url)) {
      return { ok: false, reason: "URL still looks like a placeholder." };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "URL is not parseable." };
  }
}

async function networkStatus(url: string) {
  if (!checkNetwork) return {};
  try {
    const response = await fetch(url, { method: "HEAD" });
    return {
      httpStatus: response.status,
      reason: response.status >= 200 && response.status < 400 ? undefined : `HEAD returned HTTP ${response.status}.`,
    };
  } catch (error) {
    return {
      reason: `HEAD request failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function buildSlots(urls: Map<string, string | null>) {
  const slots: RegisteredSlot[] = [];
  for (const slot of requiredSlots) {
    const url = urls.get(slot.id) || null;
    const validation = validateHttpsUrl(url);
    const network = validation.ok && url ? await networkStatus(url) : {};
    const hasNetworkFailure = Boolean(network.reason);
    slots.push({
      ...slot,
      url,
      status: validation.ok && !hasNetworkFailure ? "registered" : url ? "invalid" : "missing",
      reason: validation.reason || network.reason,
      checkedAt: new Date().toISOString(),
      httpStatus: network.httpStatus,
    });
  }
  return slots;
}

async function main() {
  const existing = readJson<RegistryFile>(OUTPUT_PATH, {});
  const existingUrls = parseRegistryUrls(existing);
  const updates = parseInputUpdates();
  if (updates.size > 0 && !apply) {
    console.error("Use --apply when providing --set or --input so URL changes are intentional.");
    process.exit(1);
  }
  const nextUrls = new Map(existingUrls);
  if (apply) {
    for (const slot of requiredSlots) {
      if (updates.has(slot.id)) nextUrls.set(slot.id, updates.get(slot.id) || null);
    }
  }
  const unknownIds = [...updates.keys()].filter((id) => !requiredSlots.some((slot) => slot.id === id));
  const slots = await buildSlots(nextUrls);
  const registered = slots.filter((slot) => slot.status === "registered");
  const invalid = slots.filter((slot) => slot.status === "invalid");
  const missing = slots.filter((slot) => slot.status === "missing");
  const status =
    unknownIds.length > 0 || invalid.length > 0
      ? "invalid"
      : registered.length === requiredSlots.length
        ? "all_urls_registered"
        : registered.length > 0
          ? "partial"
          : "waiting_for_urls";

  const payload = {
    generatedAt: new Date().toISOString(),
    release: RELEASE,
    status,
    applyRequested: apply,
    strictRequested: strict,
    networkCheckRequested: checkNetwork,
    requiredCount: requiredSlots.length,
    registeredCount: registered.length,
    invalidCount: invalid.length,
    missingCount: missing.length,
    unknownIds,
    slots,
    rules: [
      "Only stable HTTPS URLs should be registered for App Store Connect supplemental material fields.",
      "Do not register local files, localhost URLs, placeholders, or temporary signed links that may expire before editorial review.",
      "Registering a URL does not bypass native screenshot, WidgetKit, or App Review proof blockers.",
      "Run the upload package and submission gates after registering final URLs.",
    ],
    commands: {
      plan: "npm run plan:back-to-school-supplemental-urls",
      applyOne:
        "npm run register:back-to-school-supplemental-urls -- --set app-review-proof=https://hosted.example/final-proof.pdf",
      applyJson: "npm run register:back-to-school-supplemental-urls -- --input /path/to/supplemental-urls.json",
      strictNetwork: "npm run register:back-to-school-supplemental-urls -- --strict --check-network",
      refreshPackage:
        "npm run check:back-to-school-supplementals && npm run check:back-to-school-upload-package && npm run check:back-to-school-submission",
    },
  };

  writeJson(OUTPUT_PATH, payload);

  if (strict && (status !== "all_urls_registered" || unknownIds.length > 0)) {
    console.error("Back-to-School supplemental URL registration incomplete:");
    for (const slot of [...invalid, ...missing]) {
      console.error(`- ${slot.id}: ${slot.reason || "Missing URL."}`);
    }
    for (const id of unknownIds) console.error(`- ${id}: Unknown supplemental slot.`);
    process.exit(1);
  }

  console.log(
    `Back-to-School supplemental URL registration ${status}. ` +
      `${registered.length}/${requiredSlots.length} URLs registered. Wrote ${OUTPUT_PATH}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
