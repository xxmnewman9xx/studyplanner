# StudyPlanner 2.2: Apple Intelligence Master Implementation Plan

- **Baseline:** iOS 2.1.0 build 90 (live). Source is on branch `release/build-90` and tag `v2.1.0-build90` (commit `5baae8aa`, parent build 89 `9bad2034`).
- **Companion:** `RECON_BUILD90.md` covers the repo map, data flow, and verified Apple APIs.
- **Principle:** maximum impact with minimum inference. Deterministic code decides. The on-device model only reads, phrases, and quizzes, and only where language understanding is required.
- **Scope of 2.2:** four model calls (`syllabusExtract`, `noteStudySet`, `dailyBrief`, `taskProposal`). Everything else is deterministic.

---

## A. Top-down concept

### A1. Competitive landscape (Sept 2026; prices are secondary-source, so verify before any public comparison)
| App | Core loop | AI | Price | How it spreads |
|---|---|---|---|---|
| **Semora** (closest) | Syllabus → calendar, Canvas | Plan, tutor, lecture → quiz | Free tier reportedly 1 lifetime AI action; $4.99/mo, $29.99/yr | Course Spaces (classmates join free) |
| Sylly | Scan syllabus → Calendar | Server-side LLM (reported) | Free | unverified |
| DormWay / Wick / Shovel | LMS or syllabus → calendar | Date extraction | Free to $9.79/mo | LMS sync, SMS |
| MyStudyLife | Timetable planner | Photo scan, coach | $6.99/mo, $39.99/yr | Family plans |
| Structured | Day timeline | Day drafting, Siri | $2.99/mo, $99.99 lifetime | unverified |
| Quizlet / Knowt / Gizmo / StudyFetch | Material → cards and quizzes | Cloud AI, metered or premium-priced | $3.92/wk to $24.99/mo | Shared sets, leaderboards, creator networks |
| Notability / RemNote / Todoist Ramble | Notes and tasks | Metered AI (400/mo, credits, 10/mo) | $15.99–$79.99/yr | — |

**Whitespace hypotheses** (to verify before launch):
1. **Practice that knows your deadlines.** Flashcard apps don't know exam dates, and planners don't read notes.
2. **No per-use cost, so no caps.** Every rival meters cloud AI. On-device inference costs us nothing, so the aha moment can come before the paywall.
3. **No account, and syllabi never leave the phone.**
4. **Semester synthesis on system surfaces:** Lock Screen, Siri, Spotlight.
5. **No student planner among Apple's Foundation Models showcase apps.**

**Our edge in one line:** one heatmap across every class → back-scheduled start dates → unlimited offline practice per exam.

### A2. Concept selection (judgment scores; the chosen row is a *target* that the fixes below are designed to hit)
| Concept | Viral | Utility | Monet. | Diff. | Feasible | Featuring |
|---|---|---|---|---|---|---|
| Snap Semester ("syllabus → semester") | 7 | 9 | 7 | 5 | 9 | 6 |
| Exam Mode ("notes → tomorrow's test") | 7 | 8 | 9 | 7 | 7 | 8 |
| **Crunch Forecast + Exam Mode (chosen, target)** | 9 | 9 | 9 | 9 | 9 | 9 |

**Concept: "See your crunch weeks months early, then beat them."** It has three layers:
- **Forecast (see):** a heatmap across all your classes.
- **Plan (act):** red weeks back-schedule start dates into tonight's "Study now".
- **Exam Mode (practice):** unlimited quizzes from your own notes, tied to exam dates.

Syllabi and notes are processed on your iPhone. There is no account and no usage cap.

### A3. Positioning and store copy (en-US source; localized per A6)
- **Name:** keep "Studyplanner: Syllabus AI". Never put "Apple Intelligence" or "Siri" in the name or subtitle; mention them only referentially, in English.
- **Subtitle (30):** `Study plan, exams & flashcards`
- **Promo (≤170):** `Snap all your syllabi. See your crunch weeks months early. Get tonight's plan on your Lock Screen and quizzes from your own notes. Runs on your iPhone, no account.`
- **Eligibility line (description, and paywall footnote on ineligible devices):**
  - AI features: "Smart extraction, daily briefs and quizzes use on-device Apple Intelligence on iPhone 15 Pro/Pro Max, iPhone 16 and 17 models and iPhone Air, with Apple Intelligence turned on, in supported languages and regions."
  - Base requirement: "Everything else works on iOS 16.4+."
  - Plus-only features: "Plans, Exam Mode, widgets and reminders require StudyPlanner Plus."
- **Hook copy:** "43 deadlines, one scan." (There is no speed claim. The latency gates in C8 are internal.)

### A4. Demo and App Preview
- **Social cut (20 s):**
  - 0–2 s: five syllabi, captioned "my phone found the week I'm going to cry".
  - 2–6 s: camera scan, "43 deadlines found".
  - 6–10 s: a PDF import; the heatmap fills and one week turns red.
  - 10–13 s: the Forecast card is shared.
  - 13–16 s: the Lock Screen widget.
  - 16–20 s: airplane-mode quiz.
- **App Preview:** uses **beats 2–5 only**, as in-app screen capture, per App Review Guideline 2.3.4.

### A5. Growth and monetization
**Paywall.** The aha moment moves *before* the hard paywall.
- **Free:** import every class (scan, paste, or Class Pack), review it, and see the full **cross-class** Crunch Forecast plus the share card.
  - The forecast is computed from the pending import, so nothing has to be applied first.
  - Before purchase, only **class 1** can be applied to the planner.
- **Plus:** all classes applied, `startBy` plans and notifications, Study Now, Exam Mode, widgets, reminders, and Siri.
- **Why this works:** on-device inference is free, so the free taste costs nothing. `pendingImport` and `activateEntitlement` already apply a draft after purchase.

**Tiers:**
- **Annual:** listed first, preselected, with a 7-day trial.
- **Monthly:** unchanged.
- **Weekly $9.99 "Finals cram":** **no trial**. A trial on weekly hands out a free cram week and raises refund risk.
- **6-month:** deferred.
- **Price display:** the billed amount is the most prominent price. Show "7 days free, then $X/year, auto-renews until cancelled", plus Terms and Privacy links, as the paywall already does.

**Attribution and experiment (no SDK):**
- App Store links from share cards carry the `ct=forecast|pack|duel` campaign tokens (the same token set as D6), which ASC App Analytics reads.
- Price test: annual $39.99 vs $59.99, sold as separate product IDs in one subscription group.
  - A cohort is randomized at first launch and stored in the Keychain through the module.
  - The test runs a fixed 4 weeks.
  - Readout: trials and paid subscriptions per product ID ÷ installs per cohort.

**Share mechanics (opt-in, no server beyond static files):**
1. **Forecast card.** A PNG rendered on the device, shared through the share sheet with a `ct` link. "Hide class names" is on by default.
2. **Class Pack.**
   - Link: `https://studyplanner-ai.xxmnewman9xx.workers.dev/p#v1.<data>`. The `#fragment` never reaches the server.
   - The static page offers "Get the app" and "Copy pack". After install, a first-launch **"Paste Class Pack"** button restores the pack.
   - The payload holds dates, kinds, and weights only, **never syllabus or note text**. Importing is free.
   - A QR code is shown only when the payload is ≤ 1 KB; otherwise the app shares the link. The iOS Camera app opens the universal link, so no in-app scanner is needed.
3. **Quiz Duel.**
   - Up to 10 MCQs, with no note bodies. The sender confirms "Share these questions".
   - **Playing a received Duel is free.** The score card is returned the same way.

**In-App Events, by region:**
- "Syllabus Week": US/CA in Aug–Sep and Jan; AU/BR in Feb–Mar; JP/KR in Mar–Apr.
- "Finals Crunch": US in Nov–Dec and Apr–May.
- **Target: ship 2.2 by Nov 9** to catch US finals. This reuses the repo's existing In-App Event nomination workflow.

### A6. Localization
- **In-app UI:** 10 locales (`SupportedLocale`, `App.tsx:228`): `ar de en-US es fr hi ja ko pt-BR zh-Hans`.
- **Store metadata:** 17 locales (`store.config.json`).
- **On-device model:** gated **at runtime** with `supportsLocale`. Today that returns true for 15 of 17 store locales; `hi` and `ar` return false [verified on device].

| Group | Store claims | Lead feature |
|---|---|---|
| en ×4, es ×2, fr ×2, de, pt ×2, ja, ko, zh-Hant | AI claims + eligibility line | Forecast → Exam Mode |
| zh-Hans | **No AI claims** until verified on a China-region device (regional rollout unclear) | Forecast, widgets |
| hi, ar | **No AI claims.** The heuristic path is used, and share cards are RTL-safe (ar). | Forecast, Class Pack, widgets |

Outside the US and Canada, lead with Exam Mode. The Forecast also accepts exams added by hand, since academic calendars differ.

---

## B. Bottom-up features

Each feature lists: **Hook → Surfaces → Build → AI budget → Acceptance → Score after fixes.**

**F1. Crunch Forecast** (hero; free taste; 0 inference)
- **Hook:** "the week I'm going to cry".
- **Surfaces:** a Forecast section at the top of `Today` and in `ClassDetail`, the share card, the pre-paywall preview, and a red-week dot on the Week widget.
- **Build:**
  - New pure `src/crunchForecast.ts` with `buildCrunchForecast(data, now, pending?: ImportBatch)`. It returns term-wide ISO-week buckets `{weekStart, loadScore, items[], colorState, startBy}`.
  - `startBy` back-schedules prep minutes from exam `effortMinutes` or task `estimateMinutes`, weighted by `weight`, under the daily cap from the new exported `dailyCapFor(prefs)` (extracted from `buildSchedulePlan`'s private `dailyCap`, with no behavior change).
  - `buildPressureForecast` (7-day, used by widgets) is **unchanged**.
  - The caption uses **templates only**.
  - Plus: one deterministic local notification on each red week's `startBy` date (at most 1 per day, through `buildNotificationPlan`). After the term ends, show an "Import next term" card.
- **Acceptance:**
  - < 1 s for 6 classes and 120 items.
  - Every number on the card comes from the forecast object.
  - "Hide names" is on by default.
  - The `ar` layout is RTL-safe.
  - Tests cover bucketing, `startBy`, locale week-start, and DST.
- **Score after fixes: 9.** It reuses the existing engine, is shareable, works on every device, and uses zero inference.

**F2. Syllabus → Semester** (the foundation)
- **Hook:** "43 deadlines, one scan".
- **Surfaces:** `Scan`, `CameraScanner`, `PasteImport` → `ReviewImport`.
- **Build:**
  - `analyzeSyllabusSmart(text, data, locale)` is async and cancellable. It runs `analyzeSyllabus` **and**, when available, FM `SyllabusChunk` extraction per page or chunk, then applies the §C5 validators and the merge.
  - The merge caps at **80 candidates** (heuristic and agreed items first), because `savePendingImport` truncates at 80.
  - On iOS 26, `RecognizeDocumentsRequest` preserves tables.
  - Progress reads "Page 2 of 5 · 17 found", and disagreements are flagged.
- **AI budget:** 1 call per chunk, once per import.
- **Acceptance:**
  - Eval against **gold labels** (§C8): 0 invented dates after validation, precision ≥ 0.95, and recall ≥ the heuristic baseline recorded in G1 + 10 pts.
  - Ineligible devices produce output identical to Build 90.
  - Review stays mandatory.
- **Score after fixes: 9.**

**F3. Class Pack** (acquisition; 0 inference)
- **Build:**
  - `src/classPack.ts` (pure) builds a versioned payload, compresses it with `pako` (an existing dependency), and base64url-encodes it. Payload cap: ≤ 2 KB for links, ≤ 1 KB for QR.
  - Import: in `routeUrl` (`App.tsx:6017`), call `packFromUrl(rawUrl)` on the **raw, case-preserved URL before** `routeFromUrl`. That function lowercases and tokenizes, so it can't carry the payload.
  - The decoded pack goes through validators → `ImportBatch` → `ReviewImport`.
  - Universal link: associated-domains entitlement via `app.json`, plus a static AASA file and pack page on the workers.dev site.
  - First-launch "Paste Class Pack" reads the pasteboard through the module (system paste consent).
- **Acceptance:**
  - Round-trip at 40 items.
  - A 1,000-case fuzz test of mutated or oversized payloads is rejected safely.
  - Import-to-review in < 3 s.
  - Pack import is allowed pre-purchase (G4).
- **Score after fixes: 9.**

**F4. Study Now** (retention; 1 call/day)
- **Surfaces:** `Today` `BriefCard`, the Today widget line, the next notification body, and Siri "What should I study now?".
- **Build:**
  - The choice is deterministic: `studyRecommendations` (already capped at 5) plus `recommendedFocus`.
  - `DailyBrief.focusIndex` picks among them. The model call is **skipped when there is ≤ 1 candidate**. If `focusIndex` is out of range or the copy check fails, the template is used.
  - Results are cached per date and written into the widget snapshots and into `intelligence-snapshot.json` for intents.
  - Optional study-session Live Activity through the existing `WidgetLiveActivity` (deterministic).
- **Acceptance:**
  - No stale-day text anywhere.
  - Siri answers with the app killed.
  - Extensions never run inference.
- **Score: 9.**

**F5. Exam Mode + Quiz Duel** (core paid)
- **Surfaces:** `AssessmentDetail` and `ClassDetail` → new `ExamModeScreen` and `PracticeSession`.
- **Build:**
  - The countdown and coverage are deterministic.
  - `NoteStudySet` generation:
    - Cards up to 12 and MCQs up to 6, using `.maximumCount` (no forced minimums).
    - Each item cites a source span.
    - Generation is **skipped** for notes < 400 chars or when < 3 grounded items come back.
  - Results go to a derived `practiceResults` table (not AppData). Weak topics lead to extra `exam_prep` blocks, proposed through the confirm sheet.
- **AI budget:** 1 call per note version, plus regenerations capped at 10 per day.
- **Quiz Duel:**
  - Payload is ≤ 10 MCQs with no note bodies. The sender confirms, and playing a received Duel is free.
  - Imported questions show a "shared by a classmate" label.
- **Acceptance:**
  - `answerIndex` is always in range, and options are distinct.
  - Every item shows its source.
  - Works offline.
  - Integrity copy: "practice from your own notes". No homework solving.
- **Score after fixes: 9.**

**F6. Natural-language quick-add + Siri** (capture)
- **Build:**
  - The regex `createNaturalLanguageTask` runs first. `TaskProposal` runs **only on issues**, followed by the exported date and class resolvers and then a confirm sheet.
  - The Siri "Add assignment" intent writes to `intent-inbox.json` and replies "Saved. Open StudyPlanner to confirm." The app drains the inbox on foreground → validators → confirm sheet.
  - App Shortcut phrases ship for **all 10 in-app locales**, because the intents themselves are deterministic.
- **Acceptance:**
  - Ambiguous class or date always asks.
  - Inbox replay is idempotent.
- **Score after fixes: 9.**

**F7. Weak topics** (0 extra inference)
- **Build:** cluster `ExamItem.topics` + `NoteStudySet.concepts` in code (normalization + `NLEmbedding` similarity), then score by practice misses, grades, and `feedbackEvents`. The card is hidden until there are ≥ 20 answers.
- **Score after fixes: 9.** It is deterministic, and nothing ships prematurely.

**F8. Ask My Semester: removed from 2.2.** No route, schema, or tool ships. It is planned for 2.3 on iOS 27, where the 8K context and `SpotlightSearchTool` make it viable.

---

## C. Engineering blueprint (executable spec)

### C1. Non-negotiable rules
1. **Build 90 behavior is the fallback.** It applies on iOS < 26, ineligible devices, Apple Intelligence off, model not ready, an unsupported locale, Android, and web. The screens are the same; only the badge disappears.
2. **The model never writes AppData.** Output → validators → `ImportCandidate` or proposal → user → existing `mutate()` / `applyImport`.
3. **Foreground only.** Every AI trigger requires `AppState === "active"`, because intents in the app target can cold-launch React Native in the background. No extension ever runs inference.
4. **Minimum inference.** Every call is cache-first (§C6). Code chooses; the model phrases.
5. **Never send the AppData blob.** Only minimal fact packs, sized to `contextSize` at runtime.

### C2. Files
**Existing files (export-only edits, no behavior change):**
- `src/ai.ts`: export `DATE_PATTERN` and `dateFromPhrase`.
- `src/intelligence.ts`: export `parseCaptureDate` and `findCaptureClassMatches`, and add `dailyCapFor(prefs)` (extracted from `buildSchedulePlan`).
- `src/storage.ts`: export `database()`.
- `src/types.ts`: add an optional `ImportCandidate.origin?: "heuristic" | "onDevice" | "both"`.
- Applied tasks get `source: "On-device AI import"`, mapped in `localizedTaskSource` (`App.tsx:4292`).

**New files:**
| Path | Purpose |
|---|---|
| `modules/studyplanner-apple-intelligence/` (`package.json`, `expo-module.config.json`, `ios/*.podspec`) | Same layout as `studyplanner-vision-ocr`. **Weak-links `FoundationModels`**, `swift_version ≥ 5.9`. The app target stays at 16.4. |
| `…/ios/StudyPlannerAppleIntelligenceModule.swift` | Expo `Module`. **Every schema, feature, and actor type is marked `@available(iOS 26.0, *)`.** The module stores the actor as `Any?` and checks `#available` at call sites. It creates a fresh `LanguageModelSession` per request inside a serial actor. Locale check: `supportsLocale(Locale(identifier:))`. |
| `…/ios/Schemas.swift`, `Features.swift` | `@Generable` schemas (§C4), with instructions, options (extraction `.greedy`), and `maximumResponseTokens` per feature. `schemaVersion` constants. |
| `…/ios/DocumentReader.swift` | `RecognizeDocumentsRequest` on iOS 26, falling back to `VNRecognizeTextRequest`. |
| `…/ios/Surfaces.swift` | `renderShareCard` (SwiftUI `ImageRenderer`, iOS 16+), `makeQR` (CoreImage), App Group JSON read/write, pasteboard pack read, and the Keychain experiment cohort. |
| `src/appleIntelligence/{client,context,validators,merge,cache,budget,types}.ts` | Client (locale passed in as a parameter from `appLocale()`), fact packs and chunking, gates, merge (80 cap), the `ai_cache`/`practiceResults` tables via the exported `database()`, and budgets. **`validators`, `merge`, `context` must not import `react-native`**, so they can be tested with `tsx`. |
| `src/crunchForecast.ts`, `src/classPack.ts` | Pure, deterministic modules (F1, F3). |
| `src/appleIntelligence/ui/*.tsx` | `AIBadge` (generic "sparkles" symbol, **never** Apple's logo), `AIStatusCard`, `ForecastSection`, `ForecastShare`, `ExamModeScreen`, `PracticeSession`, `BriefCard`, `QuickAddSheet`, `PastePackButton`. |
| `plugins/with-studyplanner-app-intents.js` + `plugins/studyplanner-app-intents/ios/*.swift` | App Intents in the **main target**, modeled on `with-studyplanner-watch.js`. `IndexedEntity` types are marked `@available(iOS 18, *)`. Includes `AppShortcuts.xcstrings` for 10 locales. |
| `scripts/check-apple-intelligence-*.ts`, `scripts/export-fm-fixtures.ts`, `tools/fm-eval/` | Tests, the fixture export, and the Mac Swift eval harness. |

**`App.tsx` touch points (additive):**
- (a) Make `analyzeText` (~8620), `analyzeCapturedText` (~9148), and the paste auto-parse (~9557) async, cancelling on unmount, and call `analyzeSyllabusSmart`.
- (b) `routeUrl` (6017): run `packFromUrl` before `routeFromUrl`.
- (c) `ReviewImport` (9649): origin chips reading "Found on-device, verify".
- (d) `NoteDetail` (10539): read the cached study set, falling back to `generateStudyAssets`.
- (e) `Today` (7499): `ForecastSection` + `BriefCard`.
- (f) `AssessmentDetail` (8473): Exam Mode entry.
- (g) Quick capture (8701): fall back to `TaskProposal`.
- (h) `Route` (156): add `examMode` and `practice`.
- (i) The save effect (~5883–5906): also write `intelligence-snapshot.json`.
- (j) **There is no in-app erase-all path** (`resetData()` has no callers, and `App.tsx` has no erase UI). So: purge a note's `ai_cache` and `practiceResults` rows in the note-delete handler (guarded by `scripts/check-note-deletion-safety.mjs`), purge a class's rows on class delete, and add a "Clear on-device AI data" row in `Profile` (10863).

### C3. Native bridge contract
```ts
type AIFeature = "syllabusExtract" | "noteStudySet" | "dailyBrief" | "taskProposal";
type AIAvailability = { state: "available" | "unavailable" | "unsupportedOS" | "missingModule";
  reason?: "deviceNotEligible" | "appleIntelligenceNotEnabled" | "modelNotReady" | "localeUnsupported";
  contextSize: number; osVersion: string };
availability(localeId: string): Promise<AIAvailability>;
prewarm(feature: AIFeature): void;
run(feature: AIFeature, input: string, requestId: string): Promise<string>;   // JSON per schema
cancel(requestId: string): void;
writeAppGroupJSON(name: "intelligence-snapshot" | "intent-inbox", json: string): Promise<void>;
readAppGroupJSON(name: "intent-inbox"): Promise<string | null>;
renderShareCard(kind: "forecast" | "duelScore" | "classPack", json: string): Promise<string>; // file:// PNG
makeQR(text: string): Promise<string>;                                        // file:// PNG
readPasteboardPack(): Promise<string | null>;
experimentCohort(experiment: string, arms: string[]): Promise<string>;       // Keychain-persisted
```
Errors map to `AIErrorCode = contextOverflow | guardrail | refusal | unsupportedLocale | rateLimited | busy | decoding | assetsUnavailable | timeout | unavailable`. **Every code renders the heuristic result.** `contextOverflow` triggers one split-and-retry.

### C4. Schemas (`@Generable`, small because schemas count against the window)
- **`SyllabusChunk`**
  - `courses`: `.maximumCount(6)`. Each has `code`, `title?`, `meetingText?`, and `sourceSpan`.
  - `items`: `.maximumCount(30)`. Each item has:
    - `kind`: `.anyOf([assignment, exam, quiz, midterm, final, project, reading, lab, presentation])`
    - `title`, `courseCode?`, `dateText` (verbatim), `timeText?`
    - `weightPercent?`: `.range(0...100)`, compile-checked on the optional in `fm-eval`
    - `sourceSpan`
- **`NoteStudySet`**
  - `summary` (≤ 3 sentences) and `concepts` (`.maximumCount(8)`).
  - `cards`: `.maximumCount(12)`, each with `front`, `back`, and `sourceSpan`.
  - `questions`: `.maximumCount(6)`, each with `stem`, `options` (`.count(4)`), `answerIndex` (`.range(0...3)`), `why`, and `sourceSpan`.
- **`DailyBrief`**: `headline` (≤ 60), `body` (≤ 140), and `focusIndex` (`.range(0...4)`).
- **`TaskProposal`**:
  - `title`, `courseHint`, `dateText`, `timeText?`
  - `kind` (`.anyOf`)
  - `estimateMinutes`: `.range(15...240)`

### C5. Validation gates (pure, unit-tested)
1. **Type guards.** An item that fails is dropped, and the heuristic result stands.
2. **Grounding.** The normalized `sourceSpan` must be a substring of the normalized chunk, with ≥ 0.9 token overlap allowed for OCR noise.
3. **Dates.**
   - `dateText` is parsed only by the exported deterministic parsers (`DATE_PATTERN`/`dateFromPhrase`, `parseCaptureDate`), then passes `isValidDateInput` and the term-window check (earliest grounded date − 14 d … latest + 30 d).
   - **The model never supplies a trusted ISO date.**
4. **Entities.** Classes resolve through the existing matchers. IDs come only from `makeOwnershipId`.
5. **Bounds.** Title 3–120 chars, estimate 15–240 min, weight 0–100, `focusIndex` < candidate count.
6. **Copy fidelity.** Any digit or date in generated copy must appear in the fact pack; otherwise the template is used.
7. **Merge.**
   - Items the heuristic and the model agree on are marked `origin: "both"` with confidence +0.1.
   - Items only the model found are marked `onDevice` with `approved: false`.
   - The batch is capped at 80.
8. **Human gate.** `ReviewImport` for batches, and the confirm sheet for single actions.

### C6. Inference budget
| Feature | Trigger | Calls | Skip rules | Cache key |
|---|---|---|---|---|
| `syllabusExtract` | The user imports | 1 per chunk (typically 2–6) | Unavailable or unsupported locale | hash(text, schemaV, osV, locale) |
| `noteStudySet` | First Practice on a note, or Regenerate | 1 per note version; ≤ 10 regenerations/day | Note < 400 chars; < 3 grounded items | hash(sourceText, …) |
| `dailyBrief` | First foreground of the day | **≤ 1 per day** | ≤ 1 candidate | date + hash(facts) |
| `taskProposal` | Regex capture returned issues | ≤ 1 per capture | Regex succeeded | none |

There is no background inference. `prewarm` is called only when an AI screen appears.

### C7. Localization engineering
- **New `ai.*` keys** go into `APP_COPY` and the gap tables for all **10** in-app locales. `scripts/check-apple-intelligence-copy.ts` checks en-US only until G8, then all 10.
- **Store copy:** 17 locales in `store.config.json`, following the A6 claim rules.
- **Model gating:** at runtime via `supportsLocale`. There is no hard-coded hi/ar list. Model output language: "Respond in {language}" from `appLocale()`.
- **App Shortcut phrases:** all 10 locales. `ar` layouts are RTL-checked.

### C8. Tests and evaluation (definition of done)
- **Keep green:** typecheck, `test:runtime-safety`, `test:syllabus-stress`, `test:global-syllabus`, `test:notes-stress`, `test:widgets`, `test:widget-integrity`, and `test:hard-paywall` (updated in G4).
- **New `test:ai`** (pure, via `tsx`):
  - Validators, with adversarial cases: invented date, missing span, out-of-window date, foreign digits, bad `answerIndex`, `focusIndex` ≥ candidates.
  - Merge, including the 80 cap.
  - Crunch Forecast (bucketing, `startBy`, DST, week start).
  - Class Pack round-trip plus 1,000-case fuzz.
  - Budget and cache keys.
  - Every availability state leads to a fallback.
  - Inbox idempotency.
  - Copy coverage.
- **Gold data (G1):**
  - `scripts/export-fm-fixtures.ts` writes the 21 inline syllabus cases plus the note fixtures to `tools/fm-eval/fixtures/*.json`.
  - Hand-label gold items (title, kind, ISO date, span) for all 21, plus ≥ 10 real multi-page public syllabi.
  - Record the **heuristic baseline** precision and recall.
- **Model eval gates (Mac with Apple Intelligence on, then re-run on the iOS 27 device):**
  - 0 invented dates after validation.
  - Precision ≥ 0.95.
  - Recall ≥ baseline + 10 pts.
  - MCQ key consistency on 30 hand-checked items.
- **Device matrix:**
  - iPhone 15 Pro on iOS 26.x: p95 ≤ 6 s per chunk, ≤ 3 s for the brief.
  - iPhone 16/17 on iOS 27.
  - An ineligible iPhone.
  - Simulators on iOS 16.4 and 17: launch and fallback.
  - AI off, and the `hi` and `ar` locales.
  - Android regression.

### C9. Build and release
- `ios/` is generated, so native work goes only through `modules/` and `plugins/`, then `npx expo prebuild -p ios --clean`.
- Re-read the Expo v56 Modules and config-plugin docs (AGENTS.md).
- Xcode 26.6 / SDK 26.5; no iOS 27 APIs in 2.2.
- Version 2.2.0, build ≥ 91.

---

## D. Execution sequence (single release 2.2.0; every gate ends with its tests green)
| Gate | Scope | Exit criteria |
|---|---|---|
| **G0 Baseline** | Branch from `release/build-90`. `npm ci` → `prebuild --clean` → pods. Typecheck and all `test:*`. Simulator smoke on iOS 26.5. | Green, with screenshots of Today, Scan, Review, Notes, and Paywall. |
| **G1 Bridge + eval** | The C2 export edits, the module, the TS client, `ai_cache`, budget, `AIStatusCard`, and a feature flag. Gold labeling, heuristic baseline, and `fm-eval`. | iOS 16.4 and 17 simulators launch. `otool -l` shows FoundationModels as `LC_LOAD_WEAK_DYLIB`. Every availability state falls back. Android unaffected. |
| **G2 Forecast + Class Pack** | F1 and F3 (deterministic), the share card, AASA and the static page, and paste restore. | F1 and F3 acceptance met. Share card QA in 10 locales (RTL). |
| **G3 Syllabus → Semester** | F2, including `DocumentReader`. | Eval gates met. Existing parser suites green. |
| **G4 Free-first paywall** | `PRE_PURCHASE_ROUTES` (4854), `dataForAccessState` (4972), `lockedWidgetData`, `hardGateActive` (6131), `previewOnly` (~8604, ~9439), the `ReviewImport` apply path, and pack import before purchase. The free-class counter lives in AppData prefs, mirrored to the Keychain. Annual-first paywall with disclosures. | `test:hard-paywall` updated and green. Cases: restore, lapse, a pending import across purchase, a 2nd class blocked, reinstall. |
| **G5 Study Now** | F4, the widget line, the notification body, the Live Activity (optional), and `startBy` notifications. | Widget tests green. No inference from any extension. |
| **G6 Exam Mode + Duel + Weak topics** | F5 and F7. | F5 and F7 acceptance met. Integrity copy reviewed. |
| **G7 Quick-add + Siri + Spotlight** | F6, the App Intents plugin, `AppShortcutsProvider`, and `IndexedEntity`. | `Metadata.appintents` is present after `prebuild --clean`. Intents work with the app killed. Inbox tests pass. |
| **G8 Localize + launch** | All 10 locales × `ai.*`. Store copy × 17 per A6. App Preview beats 2–5 per locale. Review notes citing on-device generation, the Foundation Models acceptable-use requirements, and the eligible-device fallback. In-App Events. `/code-review` high. | **Measured gates:** all C8 gates pass, the full test suite is green, and TestFlight passes the device matrix. Then submit. |
| **G9 (2.3)** | Xcode 27 plus a stable Expo SDK, the 8K context, image `Attachment`, `SpotlightSearchTool` → Ask My Semester, and PCC only if eligible. | Separate plan. |

## E. Owner decisions (the plan runs on these defaults unless you change them)
- **D1 Free tier.** Import all classes and see the full forecast; apply class 1 before purchase. **Default: yes.** This reverses the Build 52 doctrine for one class.
- **D2 Tiers.** Annual first with the trial, monthly kept, weekly with no trial, 6-month deferred. **Default: yes.** Needs ASC offer changes by the owner.
- **D3 Toolchain.** Xcode 26.6 / Expo 56 for 2.2. **Default: yes.**
- **D4 Universal link + static page on the workers.dev site.** **Default: yes** (static files only).
- **D5 PCC (2.3).** Requires the Small Business Program, < 2M downloads, and the entitlement. It would also end "nothing leaves your iPhone". **Default: evaluate later.**
- **D6 Measurement.** ASC Analytics with `ct` tokens, plus the Keychain cohort for the price test. No third-party SDK. **Default: yes.**
- **D7 Hardware.** Enable Apple Intelligence on the dev Mac, and keep an iPhone 15 Pro or newer for G1–G8. **Owner action.**

---

## F. Scorecard (scoring swarm)
See `SCORECARD.md` for round-by-round scores, reviewer findings, and how each was resolved.
