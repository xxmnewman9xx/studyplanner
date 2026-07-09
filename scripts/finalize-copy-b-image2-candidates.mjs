#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";

const DEFAULT_QUEUE_PATH =
  "docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-manual-queue.json";
const DEFAULT_CANDIDATE_ROOT = "qa/back-to-school-2026/copy-b-image2-mac-app-candidates";
const DEFAULT_AUDIT_PATH = "qa/back-to-school-2026/copy-b-image2-finalization-audit.json";
const PROVENANCE_PATH =
  "docs/launch/back-to-school-2026/app-store-connect-final-upload/copy-b-image2-provenance.json";
const REQUIRED_WIDTH = 1242;
const REQUIRED_HEIGHT = 2688;

function usage() {
  console.log(`Usage:
  node scripts/finalize-copy-b-image2-candidates.mjs --apply

Options:
  --apply            Write final PNGs and provenance.
  --human-accepted   Mark provenance entries humanAccepted=true after visual QA.
  --queue <path>     Manual Copy B queue JSON.
  --candidate-root <path>
                     Raw ChatGPT Mac app candidate directory.
  --audit <path>     Audit JSON path.
`);
}

function parseArgs(argv) {
  const options = {
    apply: false,
    humanAccepted: false,
    queuePath: DEFAULT_QUEUE_PATH,
    candidateRoot: DEFAULT_CANDIDATE_ROOT,
    auditPath: DEFAULT_AUDIT_PATH,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") options.apply = true;
    else if (arg === "--human-accepted") options.humanAccepted = true;
    else if (arg === "--queue") options.queuePath = argv[++i];
    else if (arg === "--candidate-root") options.candidateRoot = argv[++i];
    else if (arg === "--audit") options.auditPath = argv[++i];
    else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function dimensions(path) {
  const output = run("sips", ["-g", "pixelWidth", "-g", "pixelHeight", path]);
  const width = Number(output.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(output.match(/pixelHeight:\s*(\d+)/)?.[1]);
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error(`Could not read dimensions for ${path}`);
  }
  return { width, height };
}

function sha256(path) {
  return run("shasum", ["-a", "256", path]).trim().split(/\s+/)[0];
}

function listCandidateFiles(root, jobId) {
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((name) => name === `${jobId}.png` || (name.startsWith(`${jobId}-`) && name.endsWith(".png")))
    .map((name) => {
      const path = join(root, name);
      return { path, stat: statSync(path) };
    })
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
}

function finalPathForJob(job) {
  return job.outputPath;
}

function finalizeImage(rawPath, finalPath, apply) {
  const rawDimensions = dimensions(rawPath);
  if (!apply) {
    return { rawDimensions, finalDimensions: null };
  }

  mkdirSync(dirname(finalPath), { recursive: true });
  if (rawDimensions.width === REQUIRED_WIDTH && rawDimensions.height === REQUIRED_HEIGHT) {
    copyFileSync(rawPath, finalPath);
  } else {
    run("sips", ["-s", "format", "png", "-z", String(REQUIRED_HEIGHT), String(REQUIRED_WIDTH), rawPath, "--out", finalPath]);
  }

  const finalDimensions = dimensions(finalPath);
  if (finalDimensions.width !== REQUIRED_WIDTH || finalDimensions.height !== REQUIRED_HEIGHT) {
    throw new Error(
      `${finalPath} finalized to ${finalDimensions.width}x${finalDimensions.height}, expected ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}`,
    );
  }
  return { rawDimensions, finalDimensions };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const queue = JSON.parse(readFileSync(options.queuePath, "utf8"));
  const jobs = queue.jobs || [];
  const entries = [];
  const auditItems = [];
  const failures = [];

  for (const job of jobs) {
    const candidates = listCandidateFiles(options.candidateRoot, job.jobId);
    const selected = candidates[0]?.path || null;
    if (!selected) {
      failures.push({ jobId: job.jobId, reason: "missing raw candidate" });
      continue;
    }

    const finalPath = finalPathForJob(job);
    let result;
    if (options.apply && options.humanAccepted && existsSync(finalPath)) {
      const finalDimensions = dimensions(finalPath);
      const finalAlreadyExact =
        finalDimensions.width === REQUIRED_WIDTH && finalDimensions.height === REQUIRED_HEIGHT;
      result = finalAlreadyExact
        ? { rawDimensions: dimensions(selected), finalDimensions }
        : finalizeImage(selected, finalPath, options.apply);
    } else {
      result = finalizeImage(selected, finalPath, options.apply);
    }
    const finalExists = options.apply && existsSync(finalPath);
    const finalDimensions = finalExists ? dimensions(finalPath) : result.finalDimensions;

    entries.push({
      locale: job.locale,
      file: job.file,
      generatedInChatGPTMacApp: true,
      gptImage2: true,
      attachedRealLogo: true,
      attachedRealUiReference: true,
      generatedIndividually: true,
      humanAccepted: Boolean(options.humanAccepted),
      notes: options.humanAccepted
        ? `Visual QA accepted. Dimension-finalized from ChatGPT Mac app raw candidate ${basename(selected)}.`
        : `Dimension-finalized from ChatGPT Mac app raw candidate ${basename(selected)}; awaiting visual QA.`,
    });

    auditItems.push({
      jobId: job.jobId,
      locale: job.locale,
      file: job.file,
      rawPath: selected,
      rawDimensions: result.rawDimensions,
      rawSha256: sha256(selected),
      finalPath,
      finalDimensions,
      finalSha256: finalExists ? sha256(finalPath) : null,
      humanAccepted: Boolean(options.humanAccepted),
    });
  }

  const audit = {
    generatedAt: new Date().toISOString(),
    applied: options.apply,
    humanAccepted: options.humanAccepted,
    queuePath: options.queuePath,
    candidateRoot: options.candidateRoot,
    provenancePath: PROVENANCE_PATH,
    expectedCount: jobs.length,
    finalizedCount: auditItems.length,
    missingCount: failures.length,
    requiredDimensions: { width: REQUIRED_WIDTH, height: REQUIRED_HEIGHT },
    failures,
    items: auditItems,
  };

  mkdirSync(dirname(options.auditPath), { recursive: true });
  writeFileSync(options.auditPath, `${JSON.stringify(audit, null, 2)}\n`);

  if (options.apply) {
    mkdirSync(dirname(PROVENANCE_PATH), { recursive: true });
    writeFileSync(
      PROVENANCE_PATH,
      `${JSON.stringify(
        {
          generatedAt: audit.generatedAt,
          source: "ChatGPT Mac app / GPT Image 2.0 raw candidates with dimension-only finalization",
          entries,
        },
        null,
        2,
      )}\n`,
    );
  }

  if (failures.length) {
    throw new Error(`Missing ${failures.length} raw candidates. Audit written to ${options.auditPath}`);
  }
  console.log(`Finalized ${auditItems.length}/${jobs.length} Copy B Image 2.0 candidates`);
  console.log(`Audit written to ${options.auditPath}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
