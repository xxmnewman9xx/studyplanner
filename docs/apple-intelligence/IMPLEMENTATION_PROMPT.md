# StudyPlanner 2.2 "Apple Intelligence" implementation prompt

**How to use:** paste everything below into a fresh Claude Code session opened in `/Users/mattnewman/work/StudyPlanner`.

---

You are the orchestrator implementing **StudyPlanner 2.2**. It adds on-device Apple Intelligence (Foundation Models) to a live Expo/React Native iOS app and redesigns the product around **"See your crunch weeks months early, then beat them."**

**Goals:**
- Every category scores **≥ 9/10**: virality, utility, monetization, localization, reliability, and tests.
- **Maximum impact with minimum inference.** Deterministic code decides. The on-device model reads, phrases, and quizzes, and only when language understanding is required.

## 0. Read first (source of truth; do not re-derive)
- `docs/apple-intelligence/MASTER_PLAN.md`: the concept (A), features F1–F8 with acceptance criteria (B), the engineering spec (C1–C9), gates G0–G9 (D), and decision defaults (E).
- `docs/apple-intelligence/RECON_BUILD90.md`: the repo map, data flow, and SDK-verified APIs.
- `docs/apple-intelligence/SCORECARD.md`: the rubric and round-1 findings. Round 2 still needs an **independent re-score**.
- `AGENTS.md` / `CLAUDE.md`:
  - Read the Expo **v56** docs before writing Expo module or config-plugin code.
  - If the GitNexus MCP is available, run `impact` before editing a symbol and `detect_changes` before every commit.

## 1. Facts you must respect
- **Git:** work on branch `feature/apple-intelligence-2.2`. Its baseline is `release/build-90`, tag `v2.1.0-build90`: iOS 2.1.0 build 90, which is live.
- **Stack:**
  - Expo SDK 56, RN 0.85.3 (New Architecture), TS 6.
  - Xcode 26.6, iOS SDK 26.5. Minimum iOS **16.4**.
  - `ios/` is **generated and gitignored**. Native code goes only in `modules/` (Expo modules) and `plugins/` (config plugins), followed by `npx expo prebuild -p ios --clean`.
- **Where the logic lives:**
  - **App shell:** `App.tsx` (11k lines) holds all screens.
  - **Deterministic engine:** `src/intelligence.ts`.
  - **Heuristic parser:** `src/ai.ts`.
  - **Persistence:** `src/storage.ts` stores one JSON blob `app-data` in expo-sqlite `studyplanner-ai.db`, table `kv`.
  - **Mutation:** only through `mutate()` (`App.tsx:6121`) or `applyImport`.
  - **Human import gate:** `ReviewImport` (`App.tsx:9649`).
  - **Widgets:** `src/widgetEngine.ts` → expo-widgets.
- **The live module graph is 31 files.** `src/screens/*`, `src/core/*`, and `src/design/*` are dead. Do not revive or edit them.
- **Foundation Models, as verified:**
  - Requires iOS 26 and an eligible device with Apple Intelligence on.
  - `contextSize` is 4096 on iOS 26 (reportedly 8192 on iOS 27), so always read it at runtime.
  - One request per session at a time.
  - Background use is rate-limited, so run it in the foreground only.
  - `supportsLocale` is false for `hi` and `ar`.
  - Do not use inference inside widgets or extensions.
- **Locales:** 10 in-app (`App.tsx:228`: `ar de en-US es fr hi ja ko pt-BR zh-Hans`) and 17 in the store (`store.config.json`).
- **Tooling:** `node_modules` and Pods are absent until G0.
- **Trademark:** "Apple Intelligence" may appear only referentially, in English, and never in the app name or subtitle. Never use Apple's glyph.

## 2. Hard rules (a violation means the gate fails)
1. The model **never writes AppData**. The only path is model output → validators (MASTER_PLAN C5) → `ImportCandidate`/proposal → user confirmation → `mutate()`/`applyImport`.
2. The model never supplies trusted dates, IDs, grades, completion state, schedule, reminders, or billing state.
3. Build 90 behavior is the fallback on every unavailable path: iOS < 26, an ineligible device, Apple Intelligence off, an unsupported locale, Android, and web.
4. 2.2 makes exactly **four** model calls: `syllabusExtract`, `noteStudySet`, `dailyBrief`, `taskProposal`. Each is cache-first, follows the skip rules in C6, and runs only while `AppState === "active"`.
5. **Only one agent edits `App.tsx` at a time.** Keep `App.tsx` edits additive. New UI lives in `src/appleIntelligence/ui/*`.
6. Do not modify existing functions except for the export-only edits listed in C2 and the G4 access edits.
7. Commit per gate with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Push the feature branch. **Never push to `main`.**

## 3. Swarm plan (lean: at most 3 parallel agents; worktree isolation for parallel writers)
**Wave 0 (you, sequential): G0.**
- Run `npm ci`, `npx expo prebuild -p ios --clean`, and pod install.
- Run `npm run typecheck` and every `npm run test:*`.
- Boot the iOS 26.5 simulator and take screenshots of Today, Scan, Review, Notes, and Paywall.
- Record anything that was already failing before you change code.

**Wave 1 (3 agents in parallel, `isolation: "worktree"`): G1–G2 foundations.**
- **W1 Native:** build `modules/studyplanner-apple-intelligence` as specified in C2, C3, and C4:
  - Schemas, features, the serial actor, `DocumentReader`, and `Surfaces`: share card, QR, App Group JSON, pasteboard, and Keychain cohort.
  - Weak-link FoundationModels, and mark types `@available(iOS 26.0, *)`.
  - **Exit:** `otool -l` shows `LC_LOAD_WEAK_DYLIB`, and the iOS 16.4 and 17 simulators launch.
- **W2 TS core:**
  - The export-only edits (C2).
  - `src/appleIntelligence/{client,context,validators,merge,cache,budget,types}.ts`, plus `src/crunchForecast.ts` and `src/classPack.ts`. These must be pure, with no `react-native` imports in validators, merge, context, forecast, or classPack.
  - `npm run test:ai`, covering every case listed in C8.
- **W3 Eval:**
  - `scripts/export-fm-fixtures.ts`.
  - Hand-labeled gold items for the 21 syllabus fixtures plus ≥ 10 real public multi-page syllabi.
  - The heuristic baseline.
  - `tools/fm-eval` (a Swift package reusing W1's `Schemas.swift`/`Features.swift`). It runs on the Mac once the owner enables Apple Intelligence.
- **You:** merge W1–W3 and run all tests, then clear gate G1.

**Wave 2 (sequential App.tsx owner + 2 parallel non-App.tsx agents): G2, G3, G5, G6, G7.**
- **W4 App.tsx integrator (sole owner of `App.tsx`),** following touch points (a)–(j) in C2:
  - `analyzeSyllabusSmart` async and cancellable.
  - `packFromUrl` placed before `routeFromUrl` at `routeUrl`, line 6017.
  - `ReviewImport` origin chips.
  - `ForecastSection`, `BriefCard`, Exam Mode routes, the quick-add fallback, the snapshot write, and the purge hooks.
- **W5 Surfaces:**
  - `plugins/with-studyplanner-app-intents.js` with intents (Open Scan, Today's brief, What's due, Add assignment → inbox) and `IndexedEntity` marked `@available(iOS 18, *)`.
  - `AppShortcuts.xcstrings` for 10 locales.
  - Associated domains, plus a static AASA file and `/p` page for the workers.dev site; hand these to the owner for deploy.
  - The widget brief line and red-week dot.
  - `startBy` notifications through `buildNotificationPlan`.
  - **Exit:** `Metadata.appintents` is present after a clean prebuild, and intents work with the app killed.
- **W6 UI + localization:**
  - Build the `src/appleIntelligence/ui/*` components.
  - Add `ai.*` keys for all 10 locales (RTL for `ar`).
  - Add store copy for 17 locales following the A3/A6 claim rules (no AI claims for zh-Hans, hi, or ar).
  - Add `scripts/check-apple-intelligence-copy.ts`.

**Wave 3 (you, sequential, high risk): G4 free-first paywall.**
- Edit `PRE_PURCHASE_ROUTES` (4854), `dataForAccessState` (4972), `lockedWidgetData`, `hardGateActive` (6131), `previewOnly` (~8604, ~9439), and the `ReviewImport` apply path.
- The free-class counter lives in AppData prefs and is mirrored to the Keychain.
- Build the annual-first paywall with its disclosure text.
- Update `test:hard-paywall` for these cases: restore, lapse, a pending import across purchase, a second class blocked, and reinstall.

**Wave 4 (scoring swarm, 3 read-only reviewers in parallel; at most 2 rounds):**
- **R1 Engineering.** Run `/code-review` at high effort on the branch diff, then score against the rubric in SCORECARD.md.
- **R2 Product/Growth.** Score concept, virality, monetization, compliance, and F1–F7, using the simulator screenshots.
- **R3 Localization/QA.** Run the locale sweep (10 in-app × key screens, the `ar` RTL layout, `hi`/`ar` fallback copy) and the device-matrix checklist from C8.

Fix every item scored below 9, then re-score only the changed rows. Stop when every row is ≥ 9 or after round 2; if you stop at round 2, report the rows that remain honestly.

## 4. Definition of done (G8)
- **Tests green:** all existing `test:*`, `test:ai`, typecheck, and the copy-coverage check for 10 locales.
- **Evaluation gates met** (Mac with Apple Intelligence on, then re-run on iOS 27):
  - 0 invented dates after validation.
  - Precision ≥ 0.95.
  - Recall ≥ baseline + 10 points.
- **Latency on iPhone 15 Pro:** p95 ≤ 6 s per chunk and ≤ 3 s for the daily brief.
- **Fallback screens identical to Build 90** on iOS 16.4 and 17 simulators and on ineligible, AI-off, `hi`, and `ar` configurations.
- **Release metadata:** version `2.2.0`, build ≥ 91. Store copy for 17 locales. App Preview built from beats 2–5. Review notes cite on-device generation and the eligibility fallback.
- **Final report:** the scorecard with every row ≥ 9, or an honest list of the gaps; a TestFlight-ready build; and the owner actions listed below.

## 5. Owner actions to surface (never perform them yourself)
- Turn on Apple Intelligence on the dev Mac and provide an iPhone 15 Pro or later (D7).
- ASC product and offer changes: annual-first, weekly without a trial, and the price-test product IDs (D2, D6).
- Deploy the AASA file and `/p` page to the workers.dev site (D4).
- Approve the free-first-class reversal of the Build 52 doctrine (D1). The default is yes.
- Upload to TestFlight and submit for review.
