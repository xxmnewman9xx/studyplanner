# StudyPlanner Build 90: Apple Intelligence Reconnaissance and Master Plan

This pass was read-only for the working tree. The only git actions were adding the `release/build-90` branch and `v2.1.0-build90` tag, built from a temporary index, plus the docs branch. All evidence was gathered on 2026-09-23. **Superseded for planning by `MASTER_PLAN.md`.**

---

## 1. Build 90 status

| Evidence | Finding |
|---|---|
| App Store Connect (checked in Chrome) | **iOS 2.1.0 is "Ready for Distribution" with Build 90 attached.** The ASC app name is "Study Planner AI" (ID 6766181202). |
| `app.json` | `version 2.1.0`, `ios.buildNumber "90"`. Android `versionCode 80` is a separate track. |
| `ios/StudyplannerSyllabusAI.xcodeproj` | `CURRENT_PROJECT_VERSION = 90`, `MARKETING_VERSION = 2.1.0`, `IPHONEOS_DEPLOYMENT_TARGET = 16.4`, `SWIFT_VERSION = 5.0`. |
| `build/release/StudyPlanner-2.1.0-90.xcarchive` | Created 2026-09-01 04:27. Bundle `com.mattnewman.studyplanner`, CFBundleVersion 90, MinimumOSVersion 16.4, built with Xcode 26.6 (17F113) against the iPhoneOS 26.5 SDK. One appex: `com.mattnewman.studyplanner.widgets`. No watch app. The IPA is at `build/release/export/2.1.0-90/`. |
| Git | **Build 90 source was not committed; it is now preserved** as branch `release/build-90` and tag `v2.1.0-build90` (`5baae8aa`, parent `9bad2034`; binaries and the embedded `website/` repo excluded). The checkout is branch `nomination-readiness-packet-build78` (HEAD `63992b2f`, Jul 9) with a large dirty tree: 283 modified, 465 deleted, 118 untracked. The nearest commit, `9bad2034` "Prepare iOS 2.1.0 build 89" (Aug 28), is on no branch. Only a prunable detached worktree at `/private/tmp/studyplanner-asc-2.1.0-cDtHCQ` still references it. `main` is at Build 87 (`d85896d3`). |

**Conclusion:** the working tree at `/Users/mattnewman/work/StudyPlanner` is the Build 90 implementation. It matches the Sep 1 archive and the live ASC build. It is now preserved; see the Git row above.

**Stack.** Expo SDK 56 (`expo ~56.0.21`), React Native 0.85.3 (New Architecture, Hermes), React 19.2.3, TypeScript ~6.0.3. This is **not a native Swift/SwiftUI app.** Swift exists only in one Expo local module, in generated widget code, and in an unshipped watch plugin. `ios/` is gitignored because Expo regenerates it on prebuild (Continuous Native Generation), so native changes must go through Expo modules or config plugins. `node_modules/` and `ios/Pods/` are absent. Building, running tests, or using the simulator therefore requires `npm ci` and a prebuild or pod install. Those steps are dependency installs, which this pass was not allowed to do.

---

## 2. Repo map (live code only)

A reachability walk from `App.tsx` shows **31 of 110 `src/` .ts/.tsx files are live** (117 files total including non-TS). The other 79 are dead: `src/screens/*`, `src/core/*` (an unused actions/repository/store layer built on the legacy `models.ts` types), `src/design/*`, most of `src/components/*`, the `src/services/*` parser and subscription files, and `src/logic/*` except `planner.ts`. Beyond `src/`, these are also unshipped or unused: `server/syllabus-parser` and `server/purchase-validation` (their clients are dead), `plugins/studyplanner-watch` (absent from the `app.json` plugins), and `tesseract.js` together with the 23 MB `eng.traineddata`.

| Subsystem | Live file(s) |
|---|---|
| Entry, UI, navigation, state | `index.ts` → **`App.tsx`** (11,114 lines, 972 KB). It holds every screen, the `Route` union (`App.tsx:156`), stack navigation (`nav`, about `App.tsx:5925`), `TabBar` (6213), deep links `routeFromUrl` (5060, scheme `studyplanner://`), and i18n tables `APP_COPY` (505) for **10 in-app locales** (`SupportedLocale`, `App.tsx:228`: ar de en-US es fr hi ja ko pt-BR zh-Hans). Store metadata covers 17 locales in `store.config.json`. |
| Data model | `src/types.ts`. `AppData = { prefs, classes, tasks, exams, notes, reminders, studyBlocks, imports, feedbackEvents? }` |
| Persistence | `src/storage.ts` stores one JSON blob under key `app-data` in expo-sqlite `studyplanner-ai.db`, table `kv`. It also provides `normalizeData` and `applyImport`, and it backs up corrupt payloads. `src/pendingImport.ts` keeps the import draft in `pending-import.json` (750 KB, 80 candidates, 14-day caps). `src/services/storage.ts` wraps AsyncStorage for the review prompt. |
| Deterministic engine ("Core") | **`src/intelligence.ts`** (1,307 lines). It covers dates, `buildSchedulePlan` (274), risks (372), `buildDashboardSnapshot` (453), `parseNoteInsights` (510), `buildNotificationPlan` (558), grade forecasts (746), pressure (808), `buildClassPulsesV2` (839), **`buildSemesterSnapshot`** (1014), `appendFeedbackEvent` (1050), `generateStudyAssets` (1098), `createNaturalLanguageTask` (1244), and `replanAfterMissedBlock` (1290). |
| Heuristic "AI" | `src/ai.ts` provides the regex parser `analyzeSyllabus` (307), `analyzeNotes` (734), `normalizeGlobalAcademicText` (132), `buildStudyPlan` (844, which returns `buildSchedulePlan().blocks`), and `deadlineInsight`. Also `src/services/noteScanner.ts`. |
| Ownership and reconciliation | `src/ownership/semesterOwnership.ts` provides `activeSemesterData`, recurrence patch/delete, `findImportMatch`, `applyImportUpdateToData`, and `canMarkStudyBlockMissed`. |
| Validators | `src/logic/planner.ts`. Only `isValidDateInput` is used live. |
| Narrative | `src/semesterNarrative.ts`: templated coach copy and health band. |
| PDF ingestion | `src/pdfImport.ts` (expo-document-picker, 18 MB cap) → `src/pdfText.ts` (pure-JS text extraction via pako). |
| OCR / Vision | `modules/studyplanner-vision-ocr/ios/StudyPlannerVisionOcrModule.swift` runs `VNRecognizeTextRequest` (.accurate, 17 languages) and is called by `src/imageTextRecognition.ts` and `src/ocrText.ts`. Camera input comes from `expo-camera` (`CameraScanner`, `App.tsx:9083`) and photos from `expo-image-picker`. |
| Scan and import UI | `App.tsx`: `Scan` 8603, `CameraScanner` 9083, `PasteImport` 9436, `ReviewImport` 9649 (the human approval gate), `ApplySuccess` 10040. |
| Dashboard / Class Pulse / forecasting | `App.tsx`: `Today` 7499, `SemesterHealthHero` 7793, `FeedbackLoopCard` 7859, `Classes` 7901, `ClassDetail` 8027. The math lives in `intelligence.ts`. |
| Plan and study | `App.tsx`: `Plan` 10217, `StudySession` 10364. Tasks: `Tasks` 8269, `TaskDetail` 8302, `AssessmentDetail` 8473. |
| Notes | `App.tsx`: `Notes` 10423, `NoteDetail` 10539 (computes `generateStudyAssets` on render; nothing is persisted). |
| Notifications | `src/reminders.ts` schedules local expo-notifications from `buildNotificationPlan`. Supporting files: `src/reminderCancellation.ts`, `src/reminderCleanup.ts`. The response listener is at `App.tsx:5994`. |
| Widgets | Configured in the `app.json` `expo-widgets` block: 4 widgets (`studyplanner.today/upcoming/week/classProgress`) across small, medium, and accessory families. Layouts live in `src/widgets/StudyPlannerWidgets.tsx` (JS "widget" worklets), and `src/widgetEngine.ts` builds snapshots and runs `syncNativeWidgets` (592) after every save. The Swift under `ios/ExpoWidgetsTarget/*.swift` is generated: one `WidgetConfigurationIntent` per widget plus a `WidgetLiveActivity` stub the app never uses. Build plugins: `plugins/with-widgetkit-kinds.js` and `plugins/with-widget-privacy-manifest.js`. |
| StoreKit / IAP | `src/iap.ts` (expo-iap) handles 3 auto-renewing subscriptions (`…plus.weekly/monthly/yearly`) with an intro offer on the weekly plan. Entitlements are checked client-side. In `App.tsx`: `Paywall` 7135, `LockedDashboard` 6993, the hard gate `PRE_PURCHASE_ROUTES` (4854), and `mutate()` (6121), which re-locks unvalidated premium state. |
| App Group | `group.com.mattnewman.studyplanner` in both the app and widget entitlements. It carries only widget timelines through expo-widgets. **AppData is not in the App Group.** |
| Onboarding | `App.tsx`: `Welcome` 6530, `Onboarding` 6686, `ImportOptions` 6947, `SemesterKickoff` 6279. Also `src/activation.ts` and `src/semesterKickoff.ts`. |
| Settings / profile | `App.tsx`: `Profile` 10863, `Reminders` 10893, `WidgetsScreen` 10755, `LegalScreen` 7096. `src/services/reviewPrompt.ts` handles the review prompt. |
| Theme | `src/semesterTheme.ts`, `src/components/LiquidGlassSurface.tsx` (expo-glass-effect), `palette()` in `App.tsx`. |
| Tests | No Jest or XCTest. About 65 `tsx`/`node` scripts in `scripts/` are wired through `package.json` (`test:intelligence`, `test:syllabus-stress` with about 20 syllabus fixtures, `test:global-syllabus`, `test:notes-stress`, `test:runtime-safety`, `test:widgets`, `test:hard-paywall`, …). They cannot run until `npm ci`. |
| Config | `app.json`, `eas.json`, `tsconfig.json`, `babel.config.js`, `ios/Podfile.properties.json` (includes `expo.inlineModules.*` keys). The generated Info.plist includes camera, photo, and notification usage strings, `NSSupportsLiveActivities`, and a URL scheme. |

---

## 3. Architecture and data flow

```
Camera/Photo ─► Vision OCR module ─┐
PDF ─► pdfText.ts (pure JS) ───────┼─► analyzeSyllabus / analyzeNotes (regex) ─► ImportBatch{candidates[], confidence, approved}
Paste / Quick capture ─────────────┘        (createNaturalLanguageTask → TaskItem | issues[])
        │
        ▼ savePendingImport (survives paywall/crash)
ReviewImport (user approves/edits; findImportMatch → keep/update/duplicate)
        ▼ applyImport + applyImportUpdateToData → persistPlannerSnapshot (queued transactional write)
AppData (React state `data` in App()) ◄── mutate(fn) ◄── every screen action
        ▼ buildStudyPlan(data) regenerates studyBlocks on most mutations (persona cap 110/150/210 min/day)
        ▼ derived on render: buildSemesterSnapshot / buildDashboardSnapshot / buildSemesterNarrative
        ▼ effect after every change: saveData(SQLite) → syncNativeWidgets(App Group snapshots)
        ▼ Reminders screen: scheduleLocalReminders(notificationPlan)
```

- **Source of truth:** the `app-data` blob in SQLite, mirrored by `data` state in `App()`. There are three writers: `mutate()` at `App.tsx:6121` (most edits), `setData` in the entitlement flows, and `persistPlannerSnapshot` for import apply. Every change rewrites the whole blob.
- **User-generated:** class records, tasks (title, due, time, estimate, done, subtasks, score), exams (including `topics`), note `sourceText`, grade entries and target grades, onboarding prefs (persona, goals), reminder toggles, and study-block complete/missed.
- **Derived and recomputable:** `studyBlocks` (persisted but regenerated), health, pulses, forecasts, pressure, risks, recommendations, coach copy, notification plan, widget snapshots, note insights, and study assets.
- **External dependencies:** StoreKit (expo-iap), Vision, UserNotifications, WidgetKit (expo-widgets), camera, photos, and document picker. **The live app makes no network calls** other than App Store purchases.
- **Existing boundaries:** pure TS functions of `(AppData, now) → value`. All mutation goes through `mutate()`, and imports go through a review gate. This is a good base for AI: every AI output can be forced through the same review/validate path.
- **Where AI can safely plug in:** parsing (it produces `ImportCandidate`s that still require review), note insights and study assets (display only), coach, narrative, and briefing copy (display only), NL capture (it produces a proposal checked by the existing validators), and explanations.
- **Where AI must not control state:** see section 7.

---

## 4. Current intelligence capabilities

- **There is zero ML or LLM inference today.** A search for FoundationModels, LanguageModelSession, Generable, NaturalLanguage/NLEmbedding, CoreSpotlight, App Intents (other than generated widget configuration intents), BackgroundTasks, OpenAI, Anthropic, Gemini, embeddings, and vectors found nothing in live code. The only ML is Vision OCR.
- Everything branded "AI" (the product name "Syllabus AI", the `src/ai.ts` file, flashcards, quizzes, the coach) is heuristics and templates. For example, flashcards are always `"Explain {term}"`, and quiz items are `"Apply {term} to a likely exam question."` (`intelligence.ts:1098`).
- **Reusable assets.** (a) **Output contracts** `ImportBatch`/`ImportCandidate` (with confidence and approved flags), `StudyAsset`, `ParsedNoteInsight`, `NaturalLanguageTaskResult`, and `SemesterSnapshot`. A model layer can emit the same shapes. (b) **Validators** `isValidDateInput`, `parseCaptureDate`/`findCaptureClassMatches` (inside `createNaturalLanguageTask`), `findImportMatch`, and `normalizeData`. (c) **The `ReviewImport` human gate.** (d) **The Vision OCR Expo module**, a working template for a Foundation Models module. (e) **About 20 syllabus fixtures and 11 note fixtures**, a ready golden set for evaluation. (f) **The heuristic parsers**, a ready fallback for devices without Apple Intelligence.
- **Marketing-honesty exposure:** the app is sold as "AI" without model inference. Real on-device intelligence closes that gap.

---

## 5. Apple Intelligence capability map (verified)

**How each fact was checked:**
- **[SDK]**: grepped from the local `iPhoneOS26.5.sdk` swiftinterfaces and headers.
- **[Device]**: printed by a probe script run on this Mac (macOS 26.4.1, Apple silicon).
- **[Docs]**: taken from developer.apple.com pages. URLs are in the appendix.

**Platform reality (Sept 2026):**
- **iOS 27 and Xcode 27 shipped on 2026-09-14 [Docs].**
- This project builds with Xcode 26.6 and the iOS 26.5 SDK on Expo SDK 56. Expo 57 is the current stable release, and 58 is a beta aimed at iOS 27 [Docs].
- So everything marked iOS 26 below can be built today, and everything marked iOS 27 needs a toolchain upgrade.

| Capability | Exact API (verified) | Min OS | Constraints that shape the design |
|---|---|---|---|
| **Foundation Models: model** | `SystemLanguageModel.default`, `SystemLanguageModel(useCase: .general / .contentTagging, guardrails: .default / .permissiveContentTransformations)`. `availability` returns `.available` or `.unavailable(.deviceNotEligible / .appleIntelligenceNotEnabled / .modelNotReady)`. Also `supportedLanguages`, `supportsLocale(_:)`, `contextSize` (back-deployed to 26.0), and `tokenCount(for:)` (26.4) **[SDK]** | iOS 26.0 | **`contextSize` = 4096 on OS 26.x [Device]; WWDC26 material reports 8,192 on iOS 27 [Docs], so read it at runtime.** The window covers instructions, prompt, schema, tools, and output, and it can vary by hardware, so read it at runtime [Docs]. Supported devices: iPhone 15 Pro/Pro Max, the iPhone 16 family and later, iPad mini (A17 Pro), and M1+ iPad. Apple Intelligence must be switched on, and it needs about 7 GB of storage. Devices bought in mainland China are excluded [Docs]. |
| **Foundation Models: session** | `LanguageModelSession(model:tools:instructions:)`, `respond(to:generating:includeSchemaInPrompt:options:)`, `streamResponse`, `prewarm(promptPrefix:)`, `isResponding`, `transcript` **[SDK]** | 26.0 | A session handles **one request at a time** (`concurrentRequests` error), so use a serial queue. `prewarm` needs at least 1 s of lead time [Docs]. |
| **Structured output** | `@Generable`, `@Guide(.anyOf, .constant, .count, .minimumCount/.maximumCount, .minimum/.maximum, .range, .element, .pattern(Regex))`, `GenerationOptions(sampling: .greedy/.random(…), temperature, maximumResponseTokens)`, `DynamicGenerationSchema` **[SDK]** | 26.0 | Schemas count against the 4k window when `includeSchemaInPrompt` is on, so keep them small. Use `.greedy` for extraction. |
| **Tool calling** | `protocol Tool { name, description, Arguments: Generable, call(arguments:) }` **[SDK]** | 26.0 | Apple advises 3–5 tools. Tool output also uses the window [Docs]. |
| **Errors** | `GenerationError`: `exceededContextWindowSize`, `assetsUnavailable`, `guardrailViolation`, `unsupportedGuide`, `unsupportedLanguageOrLocale`, `decodingFailure`, `rateLimited`, `concurrentRequests`, `refusal` **[SDK]** | 26.0 | iOS 27 adds `LanguageModelError.contextSizeExceeded` [Docs]. Map both to one TS error enum. |
| **Languages** | 23 locales on this OS **[Device]** | — | **Of the 17 store locales, 15 are supported. Of the 10 in-app locales, `hi` and `ar` are not [Device]**, so gate at runtime with `supportsLocale`. |
| **Execution context** | — | — | On-device, offline, no per-call cost, and data stays on the device [Docs]. Inference is rate-limited in the background, and the limit is undocumented [Docs], so **run it only in the foreground**. Running it inside a widget or intent extension is **undocumented**, so run it only in the app. The model changes with the OS (26.0–26.3, 26.4, 27.0), so **version prompts and re-run evals for each OS** [Docs]. Custom adapters are not viable: the toolkit stops at 26.0.0, is not supported on 27, needs an entitlement, and adds about 160 MB [Docs]. |
| **iOS 27 FM additions** (need Xcode 27) | New model variants, image `Attachment` input, `OCRTool`, `ContextOptions(reasoningLevel:)`, `SpotlightSearchTool` (retrieval over our own Spotlight index), and **`PrivateCloudComputeLanguageModel`** [Docs] | 27.0 | PCC gives a 32K context, needs the network, has a daily per-user quota, and requires a managed entitlement limited to Small Business Program members with fewer than 2M first-time downloads [Docs]. None of this can be built on the current toolchain. |
| **App Intents** | `AppIntent`, `AppEntity`, `EntityQuery`, `AppShortcutsProvider` (16), `IndexedEntity` (18), `SnippetIntent` (26), `IntentValueQuery` **[SDK]**. Assistant schemas are present in the SDK, but **there is no education domain** [Docs]. | 16 / 18 / 26 | Intent metadata must live in the **app target or an `AppIntentsPackage`** [Docs]. `expo-app-intents` is only an **alpha** in the Expo 58 beta [Docs], so use our own config plugin; `plugins/with-studyplanner-watch.js` already shows how to inject native targets. Siri's new personal-context and app-actions features shipped 2026-09-14 as a **beta, English-only, not yet in the EU or China** [Docs]. Shortcuts' "Use Model" action (iOS 26) lets users chain our intents with the on-device model [Docs]. |
| **Visual Intelligence** | `IntentValueQuery.values(for: SemanticContentDescriptor)` plus `OpenIntent` [SDK/Docs] | 26 | One query per app. `labels` works only for en_US [Docs]. A later-phase fit: "look at a handout, then open it in StudyPlanner". |
| **Core Spotlight** | `CSSearchableIndex` (9), `CSUserQuery` (16; semantic search on 18+) **[SDK]** | 16/18 | Pairs with `IndexedEntity` for classes, tasks, and exams. |
| **Vision documents** | `RecognizeDocumentsRequest` → `DocumentObservation` (paragraphs, lists, **tables**) **[SDK]** | 26.0 | The current module uses `VNRecognizeTextRequest`, which returns flat lines [Docs]. Keep it as the fallback below iOS 26. |
| **PDFKit** | `PDFDocument.string` [Docs] | 11 | Native alternative to the pure-JS `src/pdfText.ts`. Image-only PDFs still need page render plus Vision. |
| **NaturalLanguage** | `NLEmbedding.sentenceEmbedding(for:)` (14), `NLContextualEmbedding` (17; asset download) [Docs] | 14/17 | On-device note retrieval. It **also works on devices without Apple Intelligence**. |
| **BackgroundTasks** | `BGAppRefreshTask` (~30 s), `BGProcessingTask` (idle only), `BGContinuedProcessingTask` (26; must start from a user action in the foreground, shows Live Activity progress) **[SDK]**/[Docs] | — | Running FM inside these is **undocumented**. Do not plan any background inference. |
| **WidgetKit / notifications** | Widgets use a timeline budget of about 40–70 reloads per day [Docs]. `ControlWidget` (18). Local notifications carry fixed content once scheduled. | — | Widgets and notifications **only display text the app already generated.** |
| **Branding / review** | "Apple Intelligence" is a trademark. It may be used only referentially ("works with…") and **never in the app name** [Docs]. The HIG asks apps to disclose generated content and to degrade gracefully [Docs]. Guideline 5.1.2(i) (third-party AI disclosure) does not apply to on-device Apple models. | — | Store copy: "Uses on-device Apple Intelligence". Keep the app name as it is. |
| **Expo ecosystem** | No official FM module. Community packages include `@react-native-ai/apple` 0.12 (Callstack), `expo-ai-kit`, and `react-native-foundation-models` [Docs/npm]. | — | **Write our own thin module.** Compile-time `@Generable` schemas and guides are the safety contract, and the vision-ocr module is a proven template. |

**Not verified here:** inference in the iOS Simulator. It depends on the host Mac, and this Mac reports `appleIntelligenceNotEnabled`.

---

## 6. Integration opportunities

Each entry lists: **Data / files**, **API**, **Nature**, **Offline**, **Risks**, **Complexity**, and **Leverage**. The model never writes state; the notation "→ proposal" means the output passes through a validator and the user before `mutate()`.

1. **Intelligent syllabus ingestion.**
   - Data / files: raw pages; `modules/studyplanner-vision-ocr`, `src/pdfText.ts`, `App.tsx` `Scan`/`CameraScanner`.
   - API: Vision `RecognizeDocumentsRequest` (iOS 26), which returns document structure, including tables. PDFKit `PDFDocument.string` could replace the pure-JS PDF path.
   - Nature: deterministic. Offline: yes.
   - Risks: iOS 26+ only, so keep `VNRecognizeTextRequest` as the fallback.
   - Complexity: M. Leverage: high. Better text makes every later step better, and table-heavy syllabi are the parser's weakest case.
2. **Structured deadline extraction.**
   - Data / files: OCR/PDF text and existing classes; `src/ai.ts` `analyzeSyllabus`, `ReviewImport`, `storage.applyImport`.
   - API: `LanguageModelSession.respond(generating: SyllabusExtraction.self)` with `@Guide` (`anyOf` kinds, date `pattern`, `count` caps).
   - Nature: generative → proposal. Offline: yes.
   - Risks: invented dates, which must be blocked by a verbatim source-span check; the 4,096-token window, so chunk per page or section and dedupe via `findImportMatch`; latency.
   - Complexity: M–H. Leverage: **highest**. It is the product's core promise and the step right before the hard paywall.
3. **"What should I study right now?"**
   - Data / files: `SemesterSnapshot.recommendedActions`/`studyRecommendations` and `DashboardSnapshot.recommendedFocus` (the choice is already deterministic); `Today`.
   - API: FM phrasing only. Optionally the model can pick among candidate IDs using `anyOf`.
   - Nature: deterministic choice with generative explanation. Offline: yes.
   - Risks: low. Complexity: L. Leverage: med-high as a daily habit.
4. **Adaptive study planning.**
   - Data / files: `buildSchedulePlan`, `replanAfterMissedBlock`, `TaskItem.estimateMinutes`, `subtasks`.
   - API: FM proposes estimates (`@Guide(.range(15...240))`) and subtasks. The deterministic scheduler still places the blocks.
   - Nature: generative inputs, deterministic schedule. Offline: yes.
   - Risks: bad estimates. They are user-editable and bounded.
   - Complexity: M. Leverage: medium.
5. **Course memory / context** (a dependency for 6, 7, and 9–12).
   - Data / files: notes, exams.topics, tasks, grades, feedbackEvents. New context builder plus retrieval index.
   - API: `NLContextualEmbedding` (iOS 17+) or `NLEmbedding` for on-device note retrieval.
   - Nature: deterministic. Offline: yes.
   - Risks: index staleness, so make it a rebuildable derived store.
   - Complexity: M. Leverage: foundational.
6. **Ask My Semester.**
   - Data / files: all AppData via read-only FM `Tool`s (`upcoming`, `classSummary`, `searchNotes`, `grades`).
   - API: `LanguageModelSession(tools:)`.
   - Nature: generative, display only. Actions come out as proposals. Offline: yes.
   - Risks: hallucination, which answer-must-cite-entity rules reduce; the 4k window, which tools reduce; unsupported locales (hi, ar).
   - Complexity: H. Leverage: high and easy to demo.
7. **Explain This.**
   - Data / files: a note selection or scanned photo text; `NoteDetail`.
   - API: FM `respond`.
   - Nature: generative, display only. Offline: yes.
   - Risks: factual errors on academic content, so disclose them.
   - Complexity: L–M. Leverage: medium.
8. **Automatic summaries.**
   - Data / files: `NoteItem.summary` (heuristic today); `analyzeNotes`.
   - API: FM `respond`.
   - Nature: generative, a derived field. Offline: yes.
   - Risks: low. Complexity: L. Leverage: medium.
9. **Flashcards.**
   - Data / files: note `sourceText`; replaces `generateStudyAssets` output.
   - API: `@Generable Flashcard[]` with `@Guide(.count(5...12))`.
   - Nature: generative, derived and cached. Offline: yes.
   - Risks: needs a persisted derived store, because assets are recomputed on render today.
   - Complexity: M. Leverage: **very high**. The feature is visible, shareable, and used every day.
10. **Practice questions.**
    - Data / files: notes and exam topics.
    - API: `@Generable MCQ { stem, options[4], answerIndex }`. Validation checks that `answerIndex` is in range and that the options are distinct.
    - Nature: generative. Offline: yes.
    - Risks: wrong answer keys, so show sources and allow reporting.
    - Complexity: M. Leverage: very high.
11. **Exam Mode.**
    - Data / files: `ExamItem` (date, topics, weight), notes, grade forecast, and the `exam_prep` block source.
    - API: combines 5, 9, 10, and 12. Countdown and blocks are deterministic; content is generated.
    - Nature: mixed. Offline: yes.
    - Risks: scope.
    - Complexity: H. Leverage: **very high**. Midterm season is a natural monetization moment.
12. **Weak-topic detection.**
    - Data / files: `feedbackEvents` (`missStudyBlock`, `reviewWeakConcept`), grades, and practice results (a new derived signal).
    - API: deterministic scoring plus FM `.contentTagging` to group concepts.
    - Nature: mixed. Offline: yes.
    - Risks: few signals early in the term.
    - Complexity: M. Leverage: high once practice data exists.
13. **Daily intelligence briefing.**
    - Data / files: `buildSemesterSnapshot`, `buildSemesterNarrative`; `Today`, widgets, notifications.
    - API: FM, 1 call per day, cached.
    - Nature: facts are deterministic, wording is generative. Offline: yes.
    - Risks: numbers drifting from facts, so inject facts and reject any output containing digits or dates not present in them.
    - Complexity: L–M. Leverage: high because it feeds the widget and the lock screen.
14. **Smart notes.**
    - Data / files: `analyzeNotes`, `parseNoteInsights`, `NoteItem.terms`/`suggestedTasks`/`examId`.
    - API: FM extraction plus `.contentTagging`; class and exam linking stays deterministic.
    - Nature: generative → proposal. Offline: yes.
    - Risks: wrong links. Complexity: M. Leverage: medium-high.
15. **Natural-language actions.**
    - Data / files: `createNaturalLanguageTask` (regex, which fails on `class-ambiguous`/`date-ambiguous`); `Scan` quick capture.
    - API: `@Generable TaskProposal { title, classHint, dateText, timeText? }`, then the existing date and class resolvers, then a confirm sheet.
    - Nature: generative → proposal. Offline: yes.
    - Risks: low, because the validators already exist.
    - Complexity: M. Leverage: high.
16. **Siri / App Shortcuts / Spotlight.**
    - Data / files: `routeFromUrl` deep links; a new App Group "intent snapshot" and "intent inbox".
    - API: `AppIntent`, `AppShortcutsProvider`, `AppEntity`/`IndexedEntity` with Core Spotlight.
    - Nature: deterministic. Offline: yes.
    - Risks: the JS runtime is not available inside an intent, so read-only intents must read snapshots written by the app, and mutating intents must queue for in-app validation. App Intents metadata extraction for Swift in Expo modules is unverified (see Q4).
    - Complexity: M–H. Leverage: high for discoverability.
17. **Intelligent widgets.**
    - Data / files: `widgetEngine.buildNativeWidgetSnapshots`.
    - API: WidgetKit shows the precomputed briefing and next-move line. Widgets do not run inference.
    - Nature: deterministic display of cached text. Offline: yes.
    - Risks: stale text, so key the cache by date.
    - Complexity: L. Leverage: med-high, since widgets are the brand.
18. **Intelligent notifications.**
    - Data / files: `buildNotificationPlan`, `scheduleLocalReminders`.
    - API: FM rewrites the body for the next 1–3 notifications while the app is in the foreground. Trigger times stay deterministic.
    - Nature: mixed. Offline: yes.
    - Risks: stale or off-tone copy, so templates remain the fallback.
    - Complexity: L–M. Leverage: medium.

**Dependency spine.** Items 5 (context) and 2 (extraction) depend on the native bridge. Items 9 and 10 depend on the derived-content store. Items 11 and 12 depend on 9, 10, and 5. Items 13, 17, and 18 share a single cached briefing. Items 6 and 16 depend on 5 and the App Group snapshot.

---

## 7. Recommended architecture

### 7a. Integration boundary

**Verdict on the proposed `Core/Context/Intelligence/Actions/UI` split:** the layering is right, but it should not become Swift modules. The business logic is TypeScript. Building a Swift `StudyPlannerCore` would create a second source of truth. The better fit is a **"TS brain, thin Swift senses"** design:

| Proposed layer | Where it lives in this codebase |
|---|---|
| **Core** (deterministic) | **Keep the existing code in place:** `src/intelligence.ts`, `src/ownership/semesterOwnership.ts`, `src/storage.ts` (`normalizeData`, `applyImport`), and `src/logic/planner.ts` validators. Do not move, rename, or revive the dead `src/core/*`. |
| **Context** | New `src/appleIntelligence/context.ts`. It holds per-feature "recipes" that turn AppData plus `buildSemesterSnapshot` into a compact JSON fact pack under a token budget. (The folder name avoids clashing with `src/intelligence.ts` and `src/ai.ts`.) |
| **Intelligence** | New Expo local module `modules/studyplanner-apple-intelligence/`, built on the vision-ocr pattern. It is Swift, **weak-links FoundationModels** because the minimum target is 16.4. Schema, feature, and actor types are marked `@available(iOS 26.0, *)`, with `#available` checks at call sites. It contains compile-time `@Generable` schemas, a serial request queue, `prewarm`, and typed errors. The TS client `src/appleIntelligence/client.ts` handles availability, timeouts, caching by input hash, and **falls back to the existing heuristics**. |
| **Actions** | New `src/appleIntelligence/validators.ts` and `proposals.ts` turn model output into `ImportCandidate` or `Proposal`, then run the existing validators, then the user confirms, then **the existing `mutate()` or `applyImport`** writes. There is **no new write path**. |
| **Derived AI store** | A new SQLite table (for example `ai_cache(key, kind, inputHash, modelInfo, createdAt, json)`) in the same DB, **outside the `app-data` blob**, which is rewritten on every keystroke. It is fully regenerable and deleted with user data. |
| **OS surfaces** | App Intents and Spotlight go in Swift in the main target (config plugin or Expo inline modules; see Q4). They read an App Group `intelligence-snapshot.json` written next to the widget sync, and write requests to an App Group `intent-inbox.json` that the app drains through validators when it returns to the foreground. |
| **UI** | New components live in separate files that `App.tsx` imports. Keep the diff inside the 11k-line monolith minimal. |

### 7b. Source-of-truth protection: what AI must never mutate

**The model never writes these directly:**
- `TaskItem`/`ExamItem` `dueDate`, `time`, `dueOffset`
- `done`, `completed`, `missed`
- `score`, `weight`, `gradeEntries`, `targetGrade`
- `ClassItem` records
- `studyBlocks`, which only `buildSchedulePlan` and `replanAfterMissedBlock` may produce
- `reminders` and notification IDs
- `prefs.premium`, `premiumProductId`, and anything entitlement-related
- `imports[].status`
- `feedbackEvents`
- note `sourceText`, which is user-authored
- reconciliation choices
- any deletion

**Validation gates before persistence:**
1. **Schema:** `@Generable` plus TS type guards.
2. **Grounding:** every extracted date or title must include a verbatim `sourceSpan` that exists in the input text.
3. **Dates:** `isValidDateInput`, the capture-date parser, the term window, and a "not in the past unless the user confirms" rule.
4. **Entities:** class or exam IDs must resolve through the existing matchers. The model never mints IDs; `makeOwnershipId` does.
5. **Bounds:** estimates 15–240 min, `count` caps, and string length caps.
6. **Human confirmation:** through `ReviewImport` for any batch, or a confirm sheet for any single action.
7. **Provenance:** tag items `source: "Apple Intelligence"` so they can be undone and audited.

Generated study content (summaries, cards, questions, briefing) is derived. It lives in `ai_cache`, is labeled as generated, and can be regenerated.

---

## 8. Recommended implementation sequence

> **Superseded in detail by `MASTER_PLAN.md` §D** (concept-driven gate order: Forecast and Class Pack come before AI extraction). The outline below is kept as the recon-time view.

**Product concept for v2.2:** "Your syllabus becomes a semester that thinks with you, privately, on your iPhone." Hero loop: **scan → your semester appears in seconds → today's one move → Exam Mode quizzes you from your own notes → it's on your Lock Screen and in Siri.**

**Design rule, "maximum impact, minimum inference":** deterministic code first, and the model only where language understanding is required. Every model call is cached by input hash and budgeted:
- extraction: once per import
- cards and questions: once per note version, or on demand
- briefing: 1 per day, reused by Today, widgets, and notifications
- Ask: only when the user starts it
- nothing in the background

| Gate | Workstream | Ships |
|---|---|---|
| **G0 Baseline** | Branch or tag Build 90. Run `npm ci`, prebuild, and pod install. Run the existing `test:*` scripts green. Capture a baseline simulator run. | No user change |
| **G1 Bridge** | `modules/studyplanner-apple-intelligence` (availability, `contextSize`, locale support, serial queue, errors) plus the TS client, `ai_cache`, a feature flag, and availability-aware UI states. Build a Mac eval harness that runs the Swift schemas on the existing syllabus and notes fixtures. | Internal |
| **G2 Semester extraction** | AI syllabus extraction. It runs **alongside** `analyzeSyllabus`, merges into one `ImportBatch`, applies grounding and date validators, and routes low-confidence items to `approved:false`. Add the `RecognizeDocumentsRequest` path on iOS 26. | Hero 1 |
| **G3 Study engine** | Summaries, flashcards, and MCQ practice from notes (cached), plus Explain This. | Hero 2 |
| **G4 Exam Mode + weak topics** | Exam hub: countdown, topic coverage, practice sessions, and weak-topic scoring, feeding extra `exam_prep` blocks through the deterministic scheduler. | Hero 3 (monetization moment) |
| **G5 Daily Brief everywhere** | 1 cached briefing per day, shown in `Today`, a widget line, the next notification body, and "What should I study now". | Habit |
| **G6 NL + Siri + Spotlight** | FM-backed quick capture with validators and a confirm sheet. App Intents and Shortcuts: Open Scan, Today's brief, What's due, and Add assignment (queued). `IndexedEntity` for classes, tasks, and exams. | Discoverability |
| **G7 Ask My Semester** | Tool-calling session over read-only tools, answers with citations, and actions as proposals. | Wow demo |
| **G8 Launch** | Paywall and onboarding copy that adapts to device availability. ASC metadata, screenshots, and preview video. What's New. App Review notes explaining on-device generation. | Release 2.2.0 |
| **G9 iOS 27 track** (after a toolchain decision) | Upgrade to Xcode 27 and a stable Expo SDK. Adds: image `Attachment` so a photo goes straight to extraction; `SpotlightSearchTool` for grounded Ask; `PrivateCloudComputeLanguageModel` (32K context) for long syllabi and Ask, if the entitlement is granted; handling for the `LanguageModelError` taxonomy. | 2.3 |

**Monetization and virality levers (facts, not guarantees):**
- On-device inference has no per-call server cost, so AI can sit entirely inside the existing Plus tiers with no usage caps.
- The hard paywall already gates everything. Show the AI extraction preview before the paywall, because that "magic moment" is when conversion happens.
- Shareable output: an Exam Mode score card or semester snapshot image through the share sheet. No backend needed.
- A 20-second demo loop ("I scanned my syllabus and my phone built my semester") works as the preview video and short-form hook.
- Hindi, Arabic, and non-eligible devices keep the heuristic path. Marketing must not promise AI on every device.

---

## 9. Open questions / unknowns

- **Q1.** ~~Preserve Build 90~~ Done: `release/build-90` / `v2.1.0-build90`.
- **Q2.** Keep the 16.4 minimum with runtime gating (recommended), or raise it to iOS 26?
- **Q3.** How many active users have Apple Intelligence-eligible devices? The app has **no analytics**, so decide how to measure AI adoption (ASC Analytics only, or a privacy-preserving counter).
- **Q4.** How should App Intents Swift get into the **app target** (or an `AppIntentsPackage`) under Expo 56? Options: our own config plugin (modeled on `with-studyplanner-watch.js`) or Expo inline modules (`Podfile.properties.json` already has `expo.inlineModules.*` keys). `expo-app-intents` exists only as an alpha in the SDK 58 beta. Verify against docs.expo.dev/versions/v56.0.0 (AGENTS.md requires this).
- **Q10.** Toolchain: stay on Xcode 26.6 / Expo 56 for 2.2 (recommended: lowest risk, and every G1–G7 API is iOS 26) or move to Xcode 27 plus Expo 57/58 now to get the iOS 27 FM features?
- **Q11.** PCC eligibility: is the account in the Small Business Program with fewer than 2M first-time downloads? Is a network-dependent 32K model acceptable given the "private, on-device" positioning?
- **Q12.** On iOS 27 devices running a binary built with the 26 SDK, which error type is thrown when the context overflows? Undocumented, so test on device.
- **Q5.** Should the Pod podspec `swift_version` be ≥ 5.9 for macros while the app target is Swift 5.0? The weak-link setup needs a verification build.
- **Q6.** The Android build shares `App.tsx`. AI stays iOS-only behind `Platform.OS` with heuristic fallback. Confirm this is acceptable for Android marketing.
- **Q7.** "Apple Intelligence" wording in the App Store name, subtitle, and screenshots must follow Apple's trademark guidance (see §5).
- **Q8.** Enable Apple Intelligence on the dev Mac. The probe returned `appleIntelligenceNotEnabled`, which blocks the eval harness and simulator inference.
- **Q9.** Should dead code (79 files, the server folders, tesseract) be pruned before or after AI work? Recommendation: after, as a separate change.

---

## 10. Exact next step

Execute **`MASTER_PLAN.md` §D, gates G0 → G1**:
- Baseline from `release/build-90`.
- The export-only helper edits.
- The `studyplanner-apple-intelligence` module (availability + `syllabusExtract`).
- Gold-labelled fixtures and the heuristic baseline.
- The `fm-eval` harness.

No UI changes until the G1 exit criteria pass.
