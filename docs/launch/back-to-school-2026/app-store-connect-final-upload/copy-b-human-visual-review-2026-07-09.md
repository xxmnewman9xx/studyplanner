# Copy B Human Visual Review

Reviewed: 2026-07-09
Scope: 17 locales x 7 iPhone screenshots (`119/119`)
Decision: **BLOCKED - DO NOT SUBMIT PPO**

The automated Copy B gate passes file count and dimensions, but three independent visual reviewers found product-truth, localization, and provenance failures. The canceled App Store Connect PPO review submission `3efa66e1-dddc-4cf8-9794-db750eeab226` is `Removed`; the test was never started. Keep the uploaded draft only as a repair workspace.

Submission score: **0/119 assets at 9+/10**. Existing finals average approximately 6/10 and are not approved for PPO.

## Blockers

- Widget proof is not source-locked across the set. Several slide 7 images are generated or composited derivatives rather than untouched localized Home Screen captures.
- English variants contain contradictory task counters; `en-GB/01` has an incorrect `StudyPlanner Ai` wordmark.
- German and French screenshots contain mistranslations, English UI, and a clipped/wrapped French label.
- Spanish widgets contain Portuguese text; Canadian French widgets contain the invalid label `plat`.
- European Portuguese screenshots use Brazilian Portuguese UI throughout.
- Arabic slide 3 invents and duplicates UI while omitting required import/semester proof.
- Hindi contains mixed English commands, corrupted widget labels/calendar text, source drift, and device-edge distortion.
- Traditional Chinese slides 1-5 are derived from Simplified Chinese sources; Simplified Chinese slide 6 changes source calendar/dock content.
- Japanese, Korean, and Traditional Chinese images retain faint rounded-canvas seams; Korean branding is inconsistent.
- Provenance overstates approval: all 119 entries are marked accepted, but only 34 include a final SHA-256, and visual review disproves several source-lock claims.
- The final ChatGPT Classic / GPT Image 2.0 canary for `en-GB/07` was rejected twice. The first output introduced black rounded outer corners, `StudyPlanner AI` brand drift, altered widget UI, and measured `852x1846`. The tightened second prompt fixed the outer corners and removed the invented wordmark, but still measured `852x1846` and re-rendered source product pixels instead of preserving them.

## High-Leverage Fixes

- Rebuild failed slides with deterministic layouts over untouched, locale-correct native captures.
- Capture genuine Traditional Chinese and European Portuguese UI; fully localize the Hindi review screen.
- Use real localized Home Screen captures directly for slide 7, changing only the external marketing header.
- Standardize the exact app icon and `StudyPlanner AI` wordmark, fix task counters, and remove remaining canvas seams.
- Add expected localized copy and final SHA-256 to every provenance entry, then repeat full-size and ASC-thumbnail review for all 119 images.

## Tests/Checks

- Three independent reviewers inspected all 119 PNGs at full resolution.
- All 119 files are present, ordered `01-07`, opaque sRGB PNGs at `1242x2688`.
- External headline/subhead copy and the first-three outcome sequence are generally coherent and unclipped.
- Strict outer-corner scanning found no near-black export artifacts; lighter visible seams remain on affected files.
- `npm run check:copy-b-image2` passes as a mechanical gate only and must not be treated as human approval.
- The larger `See the week at a glance.` treatment is retained for `en-GB/07`; it does not clear the other blockers.
- Canary evidence is recorded in `qa/back-to-school-2026/copy-b-image2-regeneration-canary-state.json`; the rejected PNG remains under `qa/back-to-school-2026/copy-b-image2-regeneration-candidates/` and no final Copy B asset was replaced.

## Defer/Non-Blocking

- Copy B remains independent of the submitted In-App Event and featuring nomination.
- Copy A remains the live App Store control and must not be changed.
- Do not resubmit the PPO review item or start the test until every locale passes the repeated human review.
