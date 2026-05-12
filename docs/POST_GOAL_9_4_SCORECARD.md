# Post-Goal 9.4 Scorecard

Date started: 2026-05-12  
Branch: `v1-3-post-goal-aso-submission-master`  
Starting commit: `e766ddaf17c9954ab1aaf53e09be8dbe4b6b0b8e`  
Target score: 9.4/10 minimum, 9.7/10 stretch  
Baseline posture: Treat the app as **not submission-ready** until screenshots, StoreKit, ASO/localization, App Review handoff, and widget proof are complete.

## Initial Weighted Score

Initial weighted score before implementation in this branch: **7.82/10**.

Current evidence-adjusted score after screenshot capture, contact-sheet proof, and a targeted large-text fix: **8.58/10**.

This is intentionally lower than the prior v1-2 audited 8.76 because this score includes new ASO, localization, screenshot, App Store submission, and handoff requirements that were not completed by v1-2.

| Category | Weight | Initial | Weighted | Evidence | Root cause | Proposed fix | Status | Retest |
| --- | ---: | ---: | ---: | --- | --- | --- | --- | --- |
| Core product promise clarity | 8 | 8.6 | 0.688 | Onboarding and Today now center reviewed schoolwork and next action: `src/screens/OnboardingScreen.tsx`, `src/screens/TodayScreen.tsx` | Product thesis is strong in app, weaker in ASO copy/handoff | Align App Store copy, screenshots, and onboarding around checked work -> trusted plan -> visible next action | In progress | Pending screenshots |
| End-to-end functionality | 10 | 8.3 | 0.830 | `npm run test` 26/26; prior audit fixed invalid dates/import trust | Simulator e2e and widget install proof still missing | Run simulator flows and widget scripts; document failures honestly | In progress | Pending |
| Data integrity and trust | 10 | 8.7 | 0.870 | `src/logic/importTrust.ts`, `tests/importTrust.test.ts`, production verify passed | Endpoint/parser and duplicate import proof remain limited | Add submission docs and targeted tests only if subagents find high-risk gaps | In progress | Pending |
| Feature usefulness | 8 | 8.1 | 0.648 | Today/Calendar/Week/Classes/Widgets are functional; docs still flag graphs/preview ambiguity | Some surfaces still feel dashboard-like or screenshot-driven | Simplify/hide low-value surfaces if screenshots or agents show confusion | In progress | Pending |
| UX clarity for a 9-year-old | 7 | 8.4 | 0.588 | Plain labels exist: Today, Calendar, Week, Classes, Check Work, Widgets | Some adult terms remain: Sync, automation, forecasting, product copy | Apply clarity pass to labels/captions/docs/paywall | In progress | Pending |
| Middle-school stress reduction | 6 | 8.2 | 0.492 | Today hero is next-action oriented; onboarding uses calm language | Today still includes many analytics below the hero | Use screenshot audit to decide whether to move/hide dense cards | In progress | Pending |
| Apple-native visual design | 10 | 8.4 | 0.840 | v1-2 visual audit, premium components, and fresh contact sheet at `artifacts/post-goal-aso-submission/45-final-contact-sheet.png` | Visual proof now covers core app screens, but not native widgets, iPad, accessibility text, or product-loaded paywall | Capture remaining proof states and patch only obvious polish issues | In progress | Partial: 22 raw PNGs captured |
| Graphic design identity and screenshot quality | 8 | 7.2 | 0.576 | Fresh raw screenshots now exist for onboarding, Today, Add School Stuff, Check New Work, Calendar, Week, Classes, Widget Setup, themes, and paywall failure | Screenshot story is materially stronger but still incomplete for App Store upload and native widgets | Finish required raw PNG set; export App Store-sized assets after StoreKit/widget/iPad proof | In progress | Partial contact sheet captured |
| Customization richness and simplicity | 5 | 8.1 | 0.405 | Theme context, widget styles, class colors exist; `34-theme-customization.png` and `35-class-color-customization.png` captured | Personalization is useful but native widget persistence proof is still missing | Verify class color/theme/widget persistence and screenshot appeal | In progress | Partial screenshot proof |
| Widget usefulness and refresh behavior | 8 | 7.5 | 0.600 | Widget tests pass; native scope small/medium; bridge exists | Home Screen install/refresh screenshots missing | Run WidgetKit script and capture small/medium widgets | Pending | Pending |
| Onboarding conversion quality | 9 | 8.5 | 0.765 | Onboarding has emotional promise, review proof, widgets, first action path; all five onboarding screenshots captured | Paywall/value timing and first-run analytics are still unproven | Use captured story for ASO and test skipped-onboarding/first-action flows | In progress | Partial screenshot proof |
| Paywall conversion and monetization trust | 5 | 7.4 | 0.370 | `check:iap` passes; StoreKit-backed code; IAP IDs preserved | Product load and purchase/restore not sandbox-proven | Document StoreKit blockers; improve copy only if safe | Pending | Pending |
| ASO metadata and localization readiness | 10 | 4.7 | 0.470 | Official research doc exists; prior marketing files are untracked | Full metadata packs, localized captions, keywords, CPP/PPO missing | Create ASO master system and localized packs | Pending | Pending |
| Submission handoff completeness | 6 | 4.8 | 0.288 | Starting state and research docs created | App Review notes, screenshot inventory, exact metadata, blockers not complete | Build complete handoff doc | Pending | Pending |
| Code health, performance, accessibility, localization implementation | 6 | 7.8 | 0.468 | Typecheck/test pass; GitNexus indexed; `44-accessibility-large-text.png` captured after capping the most failure-prone shared display labels | Hardcoded English, limited UI localization, full VoiceOver proof, and complete Dynamic Type screen coverage remain incomplete | Fix quick wins only; document deferred implementation | In progress | Partial large-text proof |

Total weighted score at branch start: **7.82/10**. Current evidence-adjusted score: **8.58/10**.

## Current Submit Recommendation

**No-submit.** The app code baseline is healthy and the core raw screenshot story is now partially captured, but the post-goal ASO/submission package is not complete. The largest blockers are StoreKit sandbox proof, products-loaded paywall proof, support URL confirmation, native widget Home Screen proof, iPad screenshot strategy, localized ASO/native-speaker review, and final App Review/simulator QA.

## Score Movement Log

| Cycle | Objective | Score before | Score after | Evidence | Continue/stop |
| --- | --- | ---: | ---: | --- | --- |
| 1 | Branch safety, official Apple research, baseline commands | 7.0 assumed | 7.82 | `POST_GOAL_STARTING_STATE.md`, `APPLE_ASO_AND_SUBMISSION_RESEARCH.md`, command results | Continue |
| 2 | Data trust, date safety, ASO/submission package, no-submit guards | 7.82 | 8.28 | 31/31 tests, stricter submission verification, safer metadata, 950 use cases, 50 root problems, one real screenshot | Continue |
| 3 | Residual trust edge cleanup | 8.28 | 8.35 | 32/32 tests; parser grade items blocked until reviewed; reminder/calendar side effects skip invalid legacy due dates | Continue |
| 4 | Screenshot evidence recovery | 8.35 | 8.52 | Capture-mode build launched; 22 raw simulator PNGs plus `45-final-contact-sheet.png` captured; products-loaded paywall and native widgets still missing | Continue |
| 5 | Targeted Dynamic Type proof | 8.52 | 8.58 | `44-accessibility-large-text.png`; `npm run typecheck`; shared premium header/hero/metric/warning/dock labels capped to prevent catastrophic layout at accessibility content size | Continue |

## Minimum To Claim 9.4

1. StoreKit/IAP status must be either sandbox-proven or explicitly marked as a remaining submit blocker.
2. Required screenshot folder must contain real PNGs or missing items must be intentionally excluded with reasons.
3. ASO metadata, localization packs, PPO, custom pages, and Apple Search Ads seeds must be complete and claim-safe.
4. App Review notes and submission handoff must let another person submit without guessing.
5. All high-risk subagent findings must be fixed, deferred, or blocked with evidence.
