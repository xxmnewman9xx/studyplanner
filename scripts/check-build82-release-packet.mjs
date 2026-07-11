#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const copy = json("docs/launch/back-to-school-2026/build82-five-slide-copy.json");
const metadata = json("docs/launch/back-to-school-2026/build82-event-nomination-metadata.json");
const app = json("app.json").expo;
const capture = readFileSync("scripts/capture-build82-store-media.mjs", "utf8");
const queue = readFileSync("scripts/create-build82-chatgpt-preview-queue.mjs", "utf8");
const expectedIds = ["01-class-material", "02-approve-deadlines", "03-today-next-move", "04-plan-the-week", "05-any-light"];

assert.equal(app.version, "2.0.8");
assert.equal(app.ios.buildNumber, "82");
assert.equal(copy.productUiPolicy, "exact_build_pixels_only");
assert.match(copy.sourceCommit, /^[a-f0-9]{40}$/);
assert.equal(Object.keys(copy.localizations).length, 17);
for (const [locale, slides] of Object.entries(copy.localizations)) {
  assert.deepEqual(slides.map(({ id }) => id), expectedIds, `${locale}: slide order drifted`);
  for (const slide of slides) {
    assert.ok([...slide.headline].length <= 36, `${locale}/${slide.id}: headline too long`);
    assert.ok([...slide.subhead].length <= 58, `${locale}/${slide.id}: subhead too long`);
  }
}

assert.equal(metadata.status, "proposed_do_not_apply_until_release_authorized");
assert.equal(metadata.release.buildNumber, "82");
assert.equal(metadata.release.sourceCommit, copy.sourceCommit);
assert.equal(metadata.liveStateReadback.inAppEvent.state, "APPROVED");
assert.equal(metadata.liveStateReadback.featuringNomination.state, "SUBMITTED");
assert.ok([...metadata.inAppEventProposal.name].length <= 30);
assert.ok([...metadata.inAppEventProposal.shortDescription].length <= 50);
assert.ok([...metadata.inAppEventProposal.longDescription].length <= 120);
assert.ok([...metadata.featuringNominationProposal.description].length <= 1000);
assert.ok([...metadata.featuringNominationProposal.helpfulDetails].length <= 500);
const score = metadata.copyQualityScore.dimensions.reduce((sum, item) => sum + item.weight * item.score, 0);
assert.ok(score >= 9.5, `metadata copy score ${score.toFixed(2)} is below 9.5`);
assert.equal(metadata.applyGate.ready, false);

for (const fragment of ["2.0.8 (82)", "nonce-bound-app-acknowledgement-v5", "installedBundleVerified: true", "uploadAuthorized: false"]) {
  assert.ok(capture.includes(fragment), `capture invariant missing: ${fragment}`);
}
for (const fragment of ["ChatGPT Mac app", "GPT Image 2.0", "items.length !== 170", "immutable real StudyPlanner Build 82", "Do not redraw", "uploadAuthorized: false"]) {
  assert.ok(queue.includes(fragment), `prompt queue invariant missing: ${fragment}`);
}
assert.equal(existsSync("scripts/compose-build81-store-media.mjs"), false, "deterministic Build 81 compositor must remain removed");
assert.equal(existsSync("scripts/compose-build82-store-media.mjs"), false, "Build 82 must use ChatGPT Mac prompts, not a local compositor");

console.log(`Build 82 packet passed: 17 locales, 85 localized messages, 170 ChatGPT Mac jobs, metadata score ${score.toFixed(2)}/10.`);

function json(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
