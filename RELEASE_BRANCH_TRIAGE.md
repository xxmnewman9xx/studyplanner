# Release Branch Triage

Date: 2026-06-01

Current frontend commit under review: `104859c684f246740fc1b2be47012c1103397894`

## Executive Recommendation

Recommended path: **A, then B/D**

1. **A. Commit one release-critical missing file immediately:** `src/logic/studentLifeCopy.ts`.
2. **B. Leave the rest of the dirty product-code changes uncommitted for this release branch unless the localized App Store creative capture work is explicitly in scope.**
3. **D. Revert/delete generated timestamp churn and superseded scratch artifacts before cutting a clean release branch.**

Reason: clean `HEAD` imports `../logic/studentLifeCopy` from committed screens, but `src/logic/studentLifeCopy.ts` is still untracked. Current dirty-tree QA passes only because the untracked file exists locally. A clean checkout of `104859c` would fail typecheck/module resolution without this file.

## QA From HEAD Plus Current Dirty Tree

All requested gates passed with the current dirty tree:

- `npm run typecheck`: passed
- `npm run check:localization`: passed
- `npm run check:scenarios`: passed
- `npm run test:customization`: passed
- `npm run test:student-life-depth`: passed
- `npm run test:widgets`: passed
- `npm run test:widget-integrity`: passed
- `npm run check:iap`: passed

## Release-Critical

| File | Classification | Why |
| --- | --- | --- |
| `src/logic/studentLifeCopy.ts` | release-critical | Untracked file required by committed imports in `TodayScreen`, `PlanScreen`, `FocusScreen`, and `MoreScreen`. Losing it breaks clean-checkout typecheck. |

Proposed immediate commit file list:

- `src/logic/studentLifeCopy.ts`

## Should Be Committed Later, If Approved

These are coherent product-code changes, but they are not required for current QA to pass unless the release scope includes localized marketing/app-preview capture.

| File | Classification | Why |
| --- | --- | --- |
| `src/services/marketingCapture.ts` | should be committed later | Adds locale-specific marketing capture data and refreshes demo due dates. Useful for localized App Store creative capture; not required for core runtime QA. |
| `src/screens/ImportScreen.tsx` | should be committed later | Wires marketing capture parse output to locale. Useful with `marketingCapture.ts`; not independently release-critical. |
| `src/screens/OnboardingScreen.tsx` | should be committed later | Expands onboarding preview coverage and uses localized capture data. Larger UX/creative change; should be reviewed separately from the frontend stabilization commit. |
| `src/screens/NotesScreen.tsx` | should be committed later | Uses localized student-life copy for Notes. Low risk, but belongs with the student-life copy/localization follow-up. |
| `src/customization.ts` | should be committed later | Copy rename from "Heavy Week Warning" to "Future Risk". Useful polish; not a release blocker. |
| `src/logic/studentLifeDepth.ts` | should be committed later | Copy changes for watch/quick-check language and widget names. Useful polish; not a release blocker. |

Proposed optional follow-up commit file list:

- `src/customization.ts`
- `src/logic/studentLifeDepth.ts`
- `src/services/marketingCapture.ts`
- `src/screens/ImportScreen.tsx`
- `src/screens/NotesScreen.tsx`
- `src/screens/OnboardingScreen.tsx`

## Useful Artifact Only

These may be useful as review evidence, release notes, App Store planning, or design QA records, but they should not be mixed into a shippable product-code release commit.

| Path | Classification |
| --- | --- |
| `APP_PREVIEW_SOURCE_PLAN.md` | useful artifact only |
| `APP_STORE_BLOCKER_FIX_REPORT.md` | useful artifact only |
| `APP_STORE_READINESS_REPORT.md` | useful artifact only |
| `DEPTH_IMPLEMENTATION_REPORT.md` | useful artifact only |
| `DEPTH_PROOF_REPORT.md` | useful artifact only |
| `FINAL_PRODUCT_EXCELLENCE_CONTACT_SHEET.png` | useful artifact only |
| `FINAL_REVIEW_SCORECARD.md` | useful artifact only |
| `LOCALIZATION_AUDIT.md` | useful artifact only |
| `PAYWALL_SCORECARD.md` | useful artifact only |
| `PRODUCT_EXCELLENCE_SCORECARD.md` | useful artifact only |
| `RELEASE_READINESS_REPORT.md` | useful artifact only |
| `SCREENSHOT_CAPTURE_PLAN.md` | useful artifact only |
| `STUDENT_LIFE_DEPTH_PLAN.md` | useful artifact only |
| `WATCH_SCORECARD.md` | useful artifact only |
| `WIDGET_SCORECARD.md` | useful artifact only |
| `docs/STUDENT_LIFE_OS_FEATURE_CONTRACT.md` | useful artifact only; commit only if docs are part of release scope |
| `docs/STUDENT_LIFE_OS_INFORMATION_ARCHITECTURE.md` | useful artifact only; commit only if docs are part of release scope |
| `artifacts/figma-approval-review/` | useful artifact only |
| `artifacts/figma-polish-refinement/` | useful artifact only |
| `artifacts/studyplanner-syllabus-ai-screens/` | useful artifact only |
| `artifacts/syllabus-ai-figma-pack/` | useful artifact only |
| `artifacts/watch-app/` | useful artifact only |
| `artifacts/watch-release-hardening/` | useful artifact only |
| `marketing_exports/` | useful artifact only; large local export output, do not commit wholesale |
| `outputs-allpreviews-contact.png` | useful artifact only |
| `outputs-ipad-raw-contact.png` | useful artifact only |
| `receipts/` | useful artifact only |

## Stale Or Obsolete

These are generated QA timestamps/hash updates or superseded screenshots. Keep out of release commits unless intentionally regenerating the whole artifact set.

| Path | Classification |
| --- | --- |
| `qa/scorecards/final-widget-review.json` | stale/obsolete generated timestamp churn |
| `qa/scorecards/final-widget-scorecards.json` | stale/obsolete generated timestamp churn |
| `qa/scorecards/widget-repair-scorecards.json` | stale/obsolete generated timestamp churn |
| `qa/screenshots/final-widget-screenshot-manifest.json` | stale/obsolete generated timestamp/hash churn |
| `qa/screenshots/screenshot-manifest.json` | stale/obsolete generated timestamp churn |
| `qa/screenshots/widget-repair-screenshot-manifest.json` | stale/obsolete generated timestamp/hash churn |
| `qa/widgets/widget-data-truth.json` | stale/obsolete generated timestamp churn |
| `qa/widgets/widget-layout-matrix.json` | stale/obsolete generated timestamp churn |
| `qa/widgets/widget-no-crop-validation.json` | stale/obsolete generated timestamp churn |
| `qa/widgets/widget-truth-map.json` | stale/obsolete generated timestamp churn |
| `artifacts/frontend-redesign/final-current-screenshots/` | stale/obsolete; superseded by committed `stabilization-final-screenshots-v2` |
| `artifacts/frontend-redesign/focus-recapture/` | stale/obsolete; superseded by committed `stabilization-final-screenshots-v2` |
| `artifacts/frontend-redesign/fresh-screenshots/` | stale/obsolete; superseded by committed `stabilization-final-screenshots-v2` |
| `artifacts/frontend-redesign/screenshots/` | stale/obsolete; superseded by committed `stabilization-final-screenshots-v2` |
| `artifacts/frontend-redesign/stabilization-final-screenshots/` | stale/obsolete; superseded by committed `stabilization-final-screenshots-v2` |

## Unrelated Or Local Scratch

| Path | Classification | Why |
| --- | --- | --- |
| `AGENTS.md` | unrelated/local scratch | GitNexus index count update only. Not product or release behavior. |
| `artifacts/brand-refresh/screenshots/` | unrelated/local scratch | Prior capture set, not part of current release commit. |
| `artifacts/semester-pulse/probe/` | unrelated/local scratch | Local probe output. |
| `artifacts/semester-pulse/screenshots/` | unrelated/local scratch | Prior capture set, not part of current release commit. |
| `artifacts/semester-pulse/widgets/` | unrelated/local scratch | Local widget artifact output. |

## Should Be Ignored Or Deleted

These are good candidates for cleanup, not commit:

- `.DS_Store` files under `marketing_exports/`
- Duplicate/superseded screenshot directories under `artifacts/frontend-redesign/`
- Large generated contact sheets unless explicitly needed in a release-evidence commit
- Generated QA JSON timestamp churn if no source behavior changed

## Required Answers

Are the uncommitted changes required for current QA to pass?

- As a full dirty tree: QA passes.
- For clean `104859c`: `src/logic/studentLifeCopy.ts` is required because committed screens import it.
- The other dirty product-code changes are not proven required by the requested QA suite.

Are these changes already represented in committed code?

- `src/logic/studentLifeCopy.ts`: no, but committed screens already depend on it.
- `src/services/marketingCapture.ts`, `ImportScreen`, `OnboardingScreen`, `NotesScreen`, `customization.ts`, `studentLifeDepth.ts`: no, these changes remain dirty/uncommitted.
- Artifact/report files: not represented in the frontend commit except the committed `artifacts/frontend-redesign/stabilization-final-screenshots-v2/` set.

Would losing them break customization/depth/creative capture?

- Losing `src/logic/studentLifeCopy.ts` breaks clean-checkout compilation.
- Losing `src/customization.ts` and `src/logic/studentLifeDepth.ts` reverts copy polish but does not break the tested customization/depth gates.
- Losing `marketingCapture.ts`, `ImportScreen`, and `OnboardingScreen` removes localized marketing capture/onboarding preview work and would reduce creative capture quality, especially for localized App Store assets.
- Losing artifact directories removes evidence/source captures, not runtime behavior.

Should any be staged into a focused follow-up commit?

- Yes: stage and commit `src/logic/studentLifeCopy.ts` immediately.
- Then decide whether localized creative capture is approved for this release. If yes, create a second focused follow-up commit with the six product-code files listed above.
- Do not commit generated QA timestamp churn or broad screenshot/export folders into the release branch.
