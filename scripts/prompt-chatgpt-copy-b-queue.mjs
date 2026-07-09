#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";

const DEFAULT_QUEUE_PATH = "qa/back-to-school-2026/asc-live-copy-b-gpt-image-2-prompts.json";
const DEFAULT_STATE_PATH = "qa/back-to-school-2026/chatgpt-copy-b-prompt-run-state.json";
const DEFAULT_CANDIDATE_ROOT = "qa/back-to-school-2026/chatgpt-copy-b-candidates";
const CHATGPT_IMAGE_CACHE = `${process.env.HOME}/Library/Caches/com.openai.chat/com.onevcat.Kingfisher.ImageCache/com.onevcat.Kingfisher.ImageCache.com.openai.chat`;
const PYTHON = "/Users/mattnewman/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";

function usage() {
  console.log(`Usage:
  node scripts/prompt-chatgpt-copy-b-queue.mjs --id en-US-01 --stage
  node scripts/prompt-chatgpt-copy-b-queue.mjs --locale en-US --limit 3 --send
  node scripts/prompt-chatgpt-copy-b-queue.mjs --all --send --wait-ms 90000
  node scripts/prompt-chatgpt-copy-b-queue.mjs --queue qa/back-to-school-2026/creative-copy-b-gpt-image-2-prompts.json --id creative-en-US-01 --send --collect
  node scripts/prompt-chatgpt-copy-b-queue.mjs --queue qa/back-to-school-2026/reference-inspired-copy-b-gpt-image-2-prompts.json --id refpop-en-US-01 --send --collect

Options:
  --stage            Attach image and paste prompt, but do not send.
  --send             Attach image, paste prompt, and press Return.
  --id <id>          Prompt one queue item.
  --locale <locale>  Prompt items for one locale.
  --start <id>       Start at queue ID.
  --limit <n>        Limit number of items.
  --all              Prompt every item not already marked submitted.
  --wait-ms <n>      Wait after each sent prompt. Default 90000 when --send, 1000 when --stage.
  --collect-timeout-ms <n>
                     Timeout for generation/cache collection. Defaults to --wait-ms.
  --between-ms <n>   Delay between queue items. Defaults to --wait-ms.
  --queue <path>     Prompt queue JSON. Default ${DEFAULT_QUEUE_PATH}.
  --state <path>     Run state JSON. Default ${DEFAULT_STATE_PATH}.
  --candidate-root <path>
                     Directory for collected candidates. Default ${DEFAULT_CANDIDATE_ROOT}.
  --collect          After send, collect newest ChatGPT cached PNG candidate and record dimensions.
  --stop-on-fail     Stop if collected candidate dimensions are not 1242x2688.
  --continue-on-error
                     Record per-item errors and keep processing the queue.
  --reuse-chat       Do not create a new chat per item. Not recommended for final generation.
  --force            Include IDs already marked submitted in the state file.
  --no-click         Skip composer click; use current focus.
`);
}

function parseArgs(argv) {
  const options = {
    stage: false,
    send: false,
    all: false,
    reuseChat: false,
    force: false,
    click: true,
    collect: false,
    stopOnFail: false,
    continueOnError: false,
    waitMs: null,
    collectTimeoutMs: null,
    betweenMs: null,
    queuePath: DEFAULT_QUEUE_PATH,
    statePath: DEFAULT_STATE_PATH,
    candidateRoot: DEFAULT_CANDIDATE_ROOT,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--stage") options.stage = true;
    else if (arg === "--send") options.send = true;
    else if (arg === "--all") options.all = true;
    else if (arg === "--reuse-chat") options.reuseChat = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--collect") options.collect = true;
    else if (arg === "--stop-on-fail") options.stopOnFail = true;
    else if (arg === "--continue-on-error") options.continueOnError = true;
    else if (arg === "--no-click") options.click = false;
    else if (arg === "--id") options.id = argv[++i];
    else if (arg === "--locale") options.locale = argv[++i];
    else if (arg === "--start") options.start = argv[++i];
    else if (arg === "--limit") options.limit = Number(argv[++i]);
    else if (arg === "--wait-ms") options.waitMs = Number(argv[++i]);
    else if (arg === "--collect-timeout-ms") options.collectTimeoutMs = Number(argv[++i]);
    else if (arg === "--between-ms") options.betweenMs = Number(argv[++i]);
    else if (arg === "--queue") options.queuePath = argv[++i];
    else if (arg === "--state") options.statePath = argv[++i];
    else if (arg === "--candidate-root") options.candidateRoot = argv[++i];
    else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (options.stage === options.send) {
    throw new Error("Choose exactly one of --stage or --send.");
  }
  if (!options.all && !options.id && !options.locale && !options.start) {
    throw new Error("Choose --id, --locale, --start, or --all.");
  }
  if (options.limit !== undefined && (!Number.isInteger(options.limit) || options.limit < 1)) {
    throw new Error("--limit must be a positive integer.");
  }
  if (options.waitMs !== null && (!Number.isFinite(options.waitMs) || options.waitMs < 0)) {
    throw new Error("--wait-ms must be a non-negative number.");
  }
  if (
    options.collectTimeoutMs !== null &&
    (!Number.isFinite(options.collectTimeoutMs) || options.collectTimeoutMs < 0)
  ) {
    throw new Error("--collect-timeout-ms must be a non-negative number.");
  }
  if (options.betweenMs !== null && (!Number.isFinite(options.betweenMs) || options.betweenMs < 0)) {
    throw new Error("--between-ms must be a non-negative number.");
  }
  return options;
}

function run(cmd, args, input) {
  const result = spawnSync(cmd, args, {
    input,
    encoding: input === undefined ? undefined : "utf8",
    stdio: input === undefined ? ["ignore", "pipe", "pipe"] : ["pipe", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed:\n${result.stderr?.toString() ?? ""}`);
  }
  return result.stdout?.toString() ?? "";
}

function osascript(script) {
  return run("osascript", [], script);
}

function sleep(ms) {
  if (ms <= 0) return;
  execFileSync("sleep", [String(ms / 1000)]);
}

function loadState(statePath) {
  if (!existsSync(statePath)) {
    return { generatedAt: new Date().toISOString(), submitted: {}, staged: {}, failures: [] };
  }
  return JSON.parse(readFileSync(statePath, "utf8"));
}

function saveState(statePath, state) {
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function walkFiles(root) {
  const files = [];
  if (!existsSync(root)) return files;
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      let stat;
      try {
        stat = statSync(path);
      } catch {
        continue;
      }
      if (stat.isDirectory()) stack.push(path);
      else files.push({ path, stat });
    }
  }
  return files;
}

function cacheCreatedMs(stat) {
  return Math.max(stat.birthtimeMs || 0, stat.ctimeMs || 0);
}

function dimensionKey(size) {
  return `${size.width}x${size.height}`;
}

function latestCachedImage(afterMs, ignoredDimensionKeys = new Set()) {
  return walkFiles(CHATGPT_IMAGE_CACHE)
    .filter(({ path, stat }) => cacheCreatedMs(stat) >= afterMs && stat.size > 100_000 && !extname(path))
    .sort((a, b) => cacheCreatedMs(b.stat) - cacheCreatedMs(a.stat))
    .find(({ path }) => {
      try {
        const size = dimensions(path);
        if (ignoredDimensionKeys.has(dimensionKey(size))) return false;
        return true;
      } catch {
        return false;
      }
    }) ?? null;
}

function dimensions(path) {
  const script = `from PIL import Image
import json, sys
img=Image.open(sys.argv[1])
print(json.dumps({"width": img.size[0], "height": img.size[1]}))`;
  return JSON.parse(run(PYTHON, ["-c", script, path]).trim());
}

function sourceDimensionKeys(item) {
  const requiredKey = dimensionKey(item.requiredOutputSize);
  const keys = new Set();
  const sourcePaths = item.sourcePaths ?? (item.sourcePath ? [item.sourcePath] : []);
  for (const sourcePath of sourcePaths) {
    try {
      const key = dimensionKey(dimensions(sourcePath));
      if (key !== requiredKey) keys.add(key);
    } catch {
      // Missing sources are caught during selection; unsupported dimensions are non-fatal here.
    }
  }
  return keys;
}

function collectCandidate(item, afterMs, timeoutMs, candidateRoot) {
  const started = Date.now();
  let latest = null;
  const ignoredDimensionKeys = sourceDimensionKeys(item);
  while (Date.now() - started < timeoutMs) {
    latest = latestCachedImage(afterMs, ignoredDimensionKeys);
    if (latest) break;
    sleep(3000);
  }
  if (!latest) {
    throw new Error(`No ChatGPT cached PNG candidate found for ${item.id} within ${timeoutMs}ms.`);
  }

  mkdirSync(candidateRoot, { recursive: true });
  const size = dimensions(latest.path);
  const dimensionsPass =
    size.width === item.requiredOutputSize.width && size.height === item.requiredOutputSize.height;
  const outputPath = join(
    candidateRoot,
    dimensionsPass ? `${item.id}.png` : `${item.id}-rejected-${size.width}x${size.height}.png`,
  );
  copyFileSync(latest.path, outputPath);
  return {
    at: new Date().toISOString(),
    cachePath: latest.path,
    candidatePath: outputPath,
    dimensions: size,
    ignoredSourceDimensions: [...ignoredDimensionKeys].sort(),
    dimensionsPass,
    rejectionReason: dimensionsPass
      ? null
      : `Expected ${item.requiredOutputSize.width}x${item.requiredOutputSize.height}; got ${size.width}x${size.height}.`,
  };
}

function isGenerating() {
  const { x, y, width, height } = windowFrame();
  const shot = "tmp/chatgpt-automation/button-state.png";
  mkdirSync(dirname(shot), { recursive: true });
  execFileSync("screencapture", ["-x", `-R${x},${y},${width},${height}`, shot], { stdio: "ignore" });
  const script = `from PIL import Image
import json, sys
img=Image.open(sys.argv[1]).convert("RGBA")
w,h=img.size
center=(w-32,h-35)
left=(w-42,h-35)
right=(w-22,h-35)
def px(p):
    r,g,b,a=img.getpixel(p)
    return (r,g,b,a)
samples={"center": px(center), "left": px(left), "right": px(right)}
dark_side=any(sum(samples[k][:3])/3 < 60 for k in ("left","right"))
light_center=sum(samples["center"][:3])/3 > 180
print(json.dumps({"generating": bool(dark_side and light_center), "samples": samples}))`;
  return JSON.parse(run(PYTHON, ["-c", script, shot]).trim()).generating;
}

function waitForIdle(timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      if (!isGenerating()) return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("-1712") && !message.includes("AppleEvent timed out")) {
        throw error;
      }
    }
    sleep(3000);
  }
  return false;
}

function selectItems(queueItems, options, state) {
  let items = queueItems;
  if (options.id) items = items.filter((item) => item.id === options.id);
  if (options.locale) items = items.filter((item) => item.locale === options.locale);
  if (options.start) {
    const index = items.findIndex((item) => item.id === options.start);
    if (index < 0) throw new Error(`Start ID not found in selected queue: ${options.start}`);
    items = items.slice(index);
  }
  if (!options.force) {
    items = items.filter((item) => !state.submitted[item.id]);
  }
  if (options.limit !== undefined) items = items.slice(0, options.limit);
  if (!items.length) throw new Error("No queue items selected.");
  for (const item of items) {
    if (item.sourcePath && !existsSync(item.sourcePath)) {
      throw new Error(`Missing image for ${item.id}: ${item.sourcePath}`);
    }
    for (const sourcePath of item.sourcePaths ?? []) {
      if (!existsSync(sourcePath)) {
        throw new Error(`Missing source image for ${item.id}: ${sourcePath}`);
      }
    }
  }
  return items;
}

function activateChatGPT() {
  osascript(`tell application "ChatGPT" to activate
delay 0.4
tell application "System Events"
  tell process "ChatGPT"
    set frontmost to true
  end tell
end tell`);
}

function newChat() {
  osascript(`tell application "System Events"
  tell process "ChatGPT"
    click menu item "New Chat" of menu 1 of menu bar item "File" of menu bar 1
  end tell
end tell
delay 0.8`);
}

function requestChatGPTWindow() {
  try {
    activateChatGPT();
    osascript(`tell application "System Events"
  tell process "ChatGPT"
    keystroke "n" using command down
  end tell
end tell
delay 1`);
  } catch {
    sleep(1000);
  }
}

function windowFrame() {
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const raw = osascript(`tell application "System Events"
  tell process "ChatGPT"
    tell window 1
      set p to position
      set s to size
      return ((item 1 of p) as text) & "," & ((item 2 of p) as text) & "," & ((item 1 of s) as text) & "," & ((item 2 of s) as text)
    end tell
  end tell
end tell`).trim();
      const [x, y, width, height] = raw.split(",").map(Number);
      return { x, y, width, height };
    } catch (error) {
      lastError = error;
      requestChatGPTWindow();
      sleep(500 * (attempt + 1));
    }
  }
  throw lastError;
}

function clickComposer() {
  const { x, y, width, height } = windowFrame();
  const clickX = Math.round(x + width * 0.66);
  const clickY = Math.round(y + height - 74);
  execFileSync("cliclick", [`c:${clickX},${clickY}`], { stdio: "ignore" });
  sleep(250);
}

function clearComposer() {
  osascript(`tell application "System Events"
  tell process "ChatGPT"
    keystroke "a" using command down
    key code 51
  end tell
end tell`);
  sleep(250);
}

function copyPngToClipboard(path) {
  const absolute = resolve(path).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  osascript(`set imagePath to POSIX file "${absolute}"
set the clipboard to (read imagePath as «class PNGf»)`);
}

function copyTextToClipboard(text) {
  run("pbcopy", [], text);
}

function pasteClipboard() {
  osascript(`tell application "System Events"
  tell process "ChatGPT"
    keystroke "v" using command down
  end tell
end tell`);
}

function pressReturn() {
  osascript(`tell application "System Events"
  tell process "ChatGPT"
    key code 36
  end tell
end tell`);
}

function promptItem(item, options) {
  const sendStartedAtMs = Date.now();
  activateChatGPT();
  if (!options.reuseChat) newChat();
  if (options.click) clickComposer();
  clearComposer();

  const sourcePaths = item.sourcePaths ?? (item.sourcePath ? [item.sourcePath] : []);
  for (const sourcePath of sourcePaths) {
    copyPngToClipboard(sourcePath);
    pasteClipboard();
    sleep(1500);
  }

  copyTextToClipboard(item.prompt);
  pasteClipboard();
  sleep(500);

  if (options.send) {
    const beforeSendMs = Date.now();
    pressReturn();
    return { beforeSendMs };
  }
  return { beforeSendMs: sendStartedAtMs };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const payload = JSON.parse(readFileSync(options.queuePath, "utf8"));
  const state = loadState(options.statePath);
  const selected = selectItems(payload.items, options, state);
  const waitMs = options.waitMs ?? (options.send ? 90000 : 1000);
  const collectWaitMs = options.collectTimeoutMs ?? waitMs;
  const betweenMs = options.betweenMs ?? waitMs;

  console.log(`Selected ${selected.length} item(s). Mode: ${options.send ? "send" : "stage"}.`);
  for (const [index, item] of selected.entries()) {
    console.log(`[${index + 1}/${selected.length}] ${item.id}: ${item.sourcePath}`);
    try {
      const promptResult = promptItem(item, options);
      const record = {
        at: new Date().toISOString(),
        sourcePath: item.sourcePath,
        sourcePaths: item.sourcePaths,
        outputPathRecommended: item.outputPathRecommended,
        mode: options.send ? "sent" : "staged",
      };
      if (options.send && options.collect) {
        const collectTimeoutMs = Math.max(collectWaitMs, 30_000);
        if (!waitForIdle(collectTimeoutMs)) {
          throw new Error(`${item.id} generation did not reach idle within ${collectTimeoutMs}ms.`);
        }
        record.candidate = collectCandidate(item, promptResult.beforeSendMs, collectTimeoutMs, options.candidateRoot);
        if (options.stopOnFail && !record.candidate.dimensionsPass) {
          state.submitted[item.id] = record;
          saveState(options.statePath, state);
          throw new Error(
            `${item.id} candidate failed dimensions: ${record.candidate.dimensions.width}x${record.candidate.dimensions.height}`,
          );
        }
      }
      if (options.send) state.submitted[item.id] = record;
      else state.staged[item.id] = record;
      saveState(options.statePath, state);
      if (index < selected.length - 1) sleep(betweenMs);
    } catch (error) {
      const failure = {
        at: new Date().toISOString(),
        id: item.id,
        message: error instanceof Error ? error.message : String(error),
      };
      state.failures.push(failure);
      saveState(options.statePath, state);
      if (!options.continueOnError) {
        throw error;
      }
      console.error(`${item.id} failed: ${failure.message}`);
    }
  }
  console.log(`Done. State written to ${options.statePath}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
