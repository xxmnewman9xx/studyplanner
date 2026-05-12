# Post-Goal 9.4 Scorecard

Date started: 2026-05-12  
Branch: `v1-3-post-goal-aso-submission-master`  
Starting commit: `e766ddaf17c9954ab1aaf53e09be8dbe4b6b0b8e`  
Target score: 9.4/10 minimum, 9.7/10 stretch  
Baseline posture: Treat the app as **not submission-ready** until screenshots, StoreKit, ASO/localization, App Review handoff, and widget proof are complete.

## Initial Weighted Score

Initial weighted score before implementation in this branch: **7.82/10**.

Current evidence-adjusted score after the first post-goal fix/doc pass: **8.35/10**.

This is intentionally lower than the prior v1-2 audited 8.76 because this score includes new ASO, localization, screenshot, App Store submission, and handoff requirements that were not completed by v1-2.

| Category | Weight | Initial | Weighted | Evidence | Root cause | Proposed fix | Status | Retest |
| --- | ---: | ---: | ---: | --- | --- | --- | --- | --- |
| Core product promise clarity | 8 | 8.6 | 0.688 | Onboarding and Today now center reviewed schoolwork and next action: `src/screens/OnboardingScreen.tsx`, `src/screens/TodayScreen.tsx` | Product thesis is strong in app, weaker in ASO copy/handoff | Align App Store copy, screenshots, and onboarding around checked work -> trusted plan -> visible next action | In progress | Pending screenshots |
| End-to-end functionality | 10 | 8.3 | 0.830 | `npm run test` 26/26; prior audit fixed invalid dates/import trust | Simulator e2e and widget install proof still missing | Run simulator flows and widget scripts; document failures honestly | In progress | Pending |
| Data integrity and trust | 10 | 8.7 | 0.870 | `src/logic/importTrust.ts`, `tests/importTrust.test.ts`, production verify passed | Endpoint/parser and duplicate import proof remain limited | Add submission docs and targeted tests only if subagents find high-risk gaps | In progress | Pending |
| Feature usefulness | 8 | 8.1 | 0.648 | Today/Calendar/Week/Classes/Widgets are functional; docs still flag graphs/preview ambiguity | Some surfaces still feel dashboard-like or screenshot-driven | Simplify/hide low-value surfaces if screenshots or agents show confusion | In progress | Pending |
| UX clarity for a 9-year-old | 7 | 8.4 | 0.588 | Plain labels exist: Today, Calendar, Week, Classes, Check Work, Widgets | Some adult terms remain: Sync, automation, forecasting, product copy | Apply clarity pass to labels/captions/docs/paywall | In progress | Pending |
| Middle-school stress reduction | 6 | 8.2 | 0.492 | Today hero is next-action oriented; onboarding uses calm language | Today still includes many analytics below the hero | Use screenshot audit to decide whether to move/hide dense cards | In progress | Pending |
| Apple-native visual design | 10 | 8.4 | 0.840 | v1-2 visual audit and premium components; no fresh v1-3 contact sheet yet | Visual score lacks new screenshot proof | Capture and score raw PNGs; patch only obvious polish issues | Pending | Pending |
| Graphic design identity and screenshot quality | 8 | 7.2 | 0.576 | Prior screenshots exist in older artifact folders; new folder empty | ASO-ready screenshot story not captured | Create raw feature PNG inventory and final contact sheet | Pending | Pending |
| Customization richness and simplicity | 5 | 8.1 | 0.405 | Theme context, widget styles, class colors exist | Personalization is useful but not deeply ASO-proven | Verify class color/theme/widget persistence and screenshot appeal | Pending | Pending |
| Widget usefulness and refresh behavior | 8 | 7.5 | 0.600 | Widget tests pass; native scope small/medium; bridge exists | Home Screen install/refresh screenshots missing | Run WidgetKit script and capture small/medium widgets | Pending | Pending |
| Onboarding conversion quality | 9 | 8.5 | 0.765 | Onboarding has emotional promise, review proof, widgets, first action path | Paywall/value timing and screenshot story still unproven | Capture all onboarding steps and refine weak copy | In progress | Pending |
| Paywall conversion and monetization trust | 5 | 7.4 | 0.370 | `check:iap` passes; StoreKit-backed code; IAP IDs preserved | Product load and purchase/restore not sandbox-proven | Document StoreKit blockers; improve copy only if safe | Pending | Pending |
| ASO metadata and localization readiness | 10 | 4.7 | 0.470 | Official research doc exists; prior marketing files are untracked | Full metadata packs, localized captions, keywords, CPP/PPO missing | Create ASO master system and localized packs | Pending | Pending |
| Submission handoff completeness | 6 | 4.8 | 0.288 | Starting state and research docs created | App Review notes, screenshot inventory, exact metadata, blockers not complete | Build complete handoff doc | Pending | Pending |
| Code health, performance, accessibility, localization implementation | 6 | 7.8 | 0.468 | Typecheck/test pass; GitNexus indexed; prior accessibility quick wins | Hardcoded English, limited UI localization, no simulator accessibility proof | Fix quick wins only; document deferred implementation | Pending | Pending |

Total weighted score: **7.82/10**.

## Current Submit Recommendation

**No-submit.** The app code baseline is healthy, but the post-goal ASO/submission package is not complete. The largest blockers are StoreKit sandbox proof, screenshot capture, support URL confirmation, App Review handoff, localized ASO/native-speaker review, and widget Home Screen proof.

## Score Movement Log

| Cycle | Objective | Score before | Score after | Evidence | Continue/stop |
| --- | --- | ---: | ---: | --- | --- |
| 1 | Branch safety, official Apple research, baseline commands | 7.0 assumed | 7.82 | `POST_GOAL_STARTING_STATE.md`, `APPLE_ASO_AND_SUBMISSION_RESEARCH.md`, command results | Continue |
| 2 | Data trust, date safety, ASO/submission package, no-submit guards | 7.82 | 8.28 | 31/31 tests, stricter submission verification, safer metadata, 950 use cases, 50 root problems, one real screenshot | Continue |
| 3 | Residual trust edge cleanup | 8.28 | 8.35 | 32/32 tests; parser grade items blocked until reviewed; reminder/calendar side effects skip invalid legacy due dates | Continue |

## Minimum To Claim 9.4

1. StoreKit/IAP status must be either sandbox-proven or explicitly marked as a remaining submit blocker.
2. Required screenshot folder must contain real PNGs or missing items must be intentionally excluded with reasons.
3. ASO metadata, localization packs, PPO, custom pages, and Apple Search Ads seeds must be complete and claim-safe.
4. App Review notes and submission handoff must let another person submit without guessing.
5. All high-risk subagent findings must be fixed, deferred, or blocked with evidence.
