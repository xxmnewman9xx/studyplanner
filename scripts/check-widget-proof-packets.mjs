#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_ARTIFACT_ROOT = "/Users/mattnewman/work/FounderVault/00_SYSTEM/artifacts/studyplanner";
const PROOF_RELATIVE_PATH = path.join("evidence", "widget-fixture-contact-sheet", "widget-fixture-proof.json");
const SUMMARY_NAME = "widget-fixture-summary.txt";
const EXPECTED_PROOF_BOUNDARY = "Fixture/contact-sheet proof only. Not real iOS Lock Screen placement proof.";
const EXPECTED_SUMMARY_BOUNDARY = "Claim boundary: fixture/contact-sheet proof only. This is not real iOS Lock Screen placement proof.";

const args = process.argv.slice(2);
let artifactRoot = DEFAULT_ARTIFACT_ROOT;
let jsonOutput = "";
let latestOnly = false;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--artifact-root") {
    artifactRoot = path.resolve(args[index + 1] || "");
    index += 1;
  } else if (arg === "--json") {
    jsonOutput = path.resolve(args[index + 1] || "");
    index += 1;
  } else if (arg === "--latest-only") {
    latestOnly = true;
  } else if (arg === "--help" || arg === "-h") {
    printUsage();
    process.exit(0);
  } else {
    console.error(`Unknown argument: ${arg}`);
    printUsage();
    process.exit(2);
  }
}

function printUsage() {
  console.log(`Usage: node scripts/check-widget-proof-packets.mjs [--artifact-root PATH] [--json PATH] [--latest-only]

Checks generated Widget Studio contact-sheet proof packets for:
- stale SHA-256 hashes embedded in widget-fixture-summary.txt
- claim-boundary drift away from fixture/contact-sheet-only proof
- missing referenced packet artifacts

This verifier does not prove native iOS Home Screen or Lock Screen widget placement.`);
}

function listProofPackets(root) {
  const found = [];
  const stack = [root];

  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") return found;
      throw error;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        const candidateProofPath = path.join(fullPath, PROOF_RELATIVE_PATH);
        if (fs.existsSync(candidateProofPath)) {
          found.push(candidateProofPath);
        } else {
          stack.push(fullPath);
        }
      }
    }
  }

  return found.sort();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function parseSummary(summaryPath) {
  if (!fs.existsSync(summaryPath)) {
    return {
      exists: false,
      claimBoundary: null,
      embeddedHashes: {}
    };
  }

  const text = fs.readFileSync(summaryPath, "utf8");
  const embeddedHashes = {};
  for (const line of text.split(/\r?\n/)) {
    const hashMatch = line.match(/^-\s+([A-Za-z0-9_-]+):\s+([a-f0-9]{64})$/);
    if (hashMatch) embeddedHashes[hashMatch[1]] = hashMatch[2];
  }

  const claimBoundary = text
    .split(/\r?\n/)
    .find((line) => line.startsWith("Claim boundary:")) || null;

  return {
    exists: true,
    claimBoundary,
    embeddedHashes
  };
}

function expectedArtifactPaths(proof, proofPath, summaryPath) {
  const packetDir = path.dirname(proofPath);
  const pathsFromProof = proof.assertions?.expectedArtifactPaths || {};
  const fallback = {
    html: path.join(packetDir, "widget-fixture-contact-sheet.html"),
    svg: path.join(packetDir, "widget-fixture-contact-sheet.svg"),
    png: path.join(packetDir, "widget-fixture-contact-sheet.png"),
    proofJson: proofPath,
    summary: summaryPath
  };

  return Object.fromEntries(
    Object.entries(fallback).map(([key, fallbackPath]) => [
      key,
      pathsFromProof[key]?.path || fallbackPath
    ])
  );
}

function verifyPacket(proofPath) {
  const proof = readJson(proofPath);
  const packetDir = path.dirname(proofPath);
  const summaryPath = path.join(packetDir, SUMMARY_NAME);
  const summary = parseSummary(summaryPath);
  const artifactPaths = expectedArtifactPaths(proof, proofPath, summaryPath);
  const findings = [];

  if (proof.claimBoundary !== EXPECTED_PROOF_BOUNDARY) {
    findings.push({
      type: "claim-boundary-drift",
      severity: "error",
      message: `Proof JSON claim boundary drifted: ${proof.claimBoundary || "missing"}`
    });
  }

  if (!summary.exists) {
    findings.push({
      type: "missing-summary",
      severity: "error",
      message: `Missing summary file: ${summaryPath}`
    });
  } else if (summary.claimBoundary !== EXPECTED_SUMMARY_BOUNDARY) {
    findings.push({
      type: "claim-boundary-drift",
      severity: "error",
      message: `Summary claim boundary drifted: ${summary.claimBoundary || "missing"}`
    });
  }

  const pathChecks = Object.entries(artifactPaths).map(([key, filePath]) => {
    const exists = fs.existsSync(filePath);
    if (!exists) {
      findings.push({
        type: "missing-artifact",
        severity: "error",
        message: `Referenced ${key} artifact is missing: ${filePath}`
      });
    }
    return { key, path: filePath, exists };
  });

  const hashChecks = Object.entries(summary.embeddedHashes).map(([key, embeddedHash]) => {
    const filePath = artifactPaths[key];
    if (key === "summary") {
      findings.push({
        type: "self-referential-summary-hash",
        severity: "error",
        message: "Summary embeds a summary hash; this is unstable because the summary contains its own hash list."
      });
      return { key, embeddedHash, currentHash: null, match: false, path: filePath || summaryPath };
    }

    if (!filePath) {
      findings.push({
        type: "unknown-embedded-hash",
        severity: "error",
        message: `Summary embeds a hash for unknown artifact key: ${key}`
      });
      return { key, embeddedHash, currentHash: null, match: false, path: null };
    }

    if (!fs.existsSync(filePath)) {
      findings.push({
        type: "missing-hashed-artifact",
        severity: "error",
        message: `Summary embeds ${key} hash, but the artifact is missing: ${filePath}`
      });
      return { key, embeddedHash, currentHash: null, match: false, path: filePath };
    }

    const currentHash = sha256(filePath);
    const match = embeddedHash === currentHash;
    if (!match) {
      findings.push({
        type: "stale-embedded-hash",
        severity: "error",
        message: `Stale embedded ${key} hash: summary has ${embeddedHash}, current file is ${currentHash}`
      });
    }
    return { key, embeddedHash, currentHash, match, path: filePath };
  });

  if (summary.exists && !Object.keys(summary.embeddedHashes).length) {
    findings.push({
      type: "missing-embedded-hashes",
      severity: "error",
      message: "Summary does not embed any SHA-256 artifact hashes."
    });
  }

  return {
    artifactId: path.basename(path.dirname(path.dirname(packetDir))),
    packetDir,
    proofJson: proofPath,
    summary: summaryPath,
    proofClaimBoundary: proof.claimBoundary || null,
    summaryClaimBoundary: summary.claimBoundary,
    embeddedHashCount: Object.keys(summary.embeddedHashes).length,
    pathChecks,
    hashChecks,
    status: findings.length ? "failed" : "passed",
    findings
  };
}

let proofPackets = listProofPackets(artifactRoot);
if (latestOnly && proofPackets.length) {
  proofPackets = [proofPackets[proofPackets.length - 1]];
}

const packetResults = proofPackets.map(verifyPacket);
const findings = packetResults.flatMap((packet) =>
  packet.findings.map((finding) => ({
    artifactId: packet.artifactId,
    proofJson: packet.proofJson,
    ...finding
  }))
);

const report = {
  checkedAt: new Date().toISOString(),
  artifactRoot,
  mode: latestOnly ? "latest-only" : "all-packets",
  claimBoundary: EXPECTED_PROOF_BOUNDARY,
  summaryClaimBoundary: EXPECTED_SUMMARY_BOUNDARY,
  checkedPackets: packetResults.length,
  passedPackets: packetResults.filter((packet) => packet.status === "passed").length,
  failedPackets: packetResults.filter((packet) => packet.status === "failed").length,
  status: findings.length ? "failed" : "passed",
  findings,
  packets: packetResults
};

if (jsonOutput) {
  fs.mkdirSync(path.dirname(jsonOutput), { recursive: true });
  fs.writeFileSync(jsonOutput, `${JSON.stringify(report, null, 2)}\n`);
}

if (!packetResults.length) {
  console.error(`No widget proof packets found under ${artifactRoot}`);
  process.exit(1);
}

console.log(`Widget proof packet drift verifier: ${report.status}`);
console.log(`Checked packets: ${report.checkedPackets} (${report.passedPackets} passed, ${report.failedPackets} failed)`);
for (const packet of packetResults) {
  console.log(`- ${packet.status}: ${packet.artifactId}`);
  for (const finding of packet.findings) {
    console.log(`  - ${finding.type}: ${finding.message}`);
  }
}

if (jsonOutput) console.log(`JSON report: ${jsonOutput}`);

process.exit(findings.length ? 1 : 0);
