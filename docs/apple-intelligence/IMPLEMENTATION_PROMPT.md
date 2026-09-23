# StudyPlanner 2.2: Build prompt

**Start by creating a worktree:** `git -C /Users/mattnewman/work/StudyPlanner worktree add ../StudyPlanner-ai feature/apple-intelligence-2.2`. Open Claude Code in `../StudyPlanner-ai` and paste everything below.

---

## Mission
Turn StudyPlanner from a syllabus-to-planner app into **the study app that sees your semester coming**. It forecasts crunch weeks months ahead, tells you what to do tonight, and quizzes you from your own notes.

- **All of it runs privately on the iPhone** through Apple's on-device Foundation Models. There is no account, no server, and no usage cap.
- Ship it as **StudyPlanner 2.2**: a major update built to go viral, earn subscriptions, and score **≥ 9/10** on concept, utility, virality, monetization, localization, and quality.
- Decide the implementation details yourself. Use a small swarm of subagents where parallel work genuinely helps. Have independent reviewers score the result, and keep improving it until every category reaches 9 or higher.

## Context (verified, so trust it)
**Live app**
- iOS 2.1.0 build 90 on the App Store ("Studyplanner: Syllabus AI", ASC app 6766181202).
- Source is tag `v2.1.0-build90`. Work on branch `feature/apple-intelligence-2.2`, which also holds the planning docs.
- Never push to `main`.

**Stack**
- Expo SDK 56, React Native 0.85 (New Architecture), TypeScript. Xcode 26.6, iOS SDK 26.5, minimum iOS 16.4.
- `ios/` is generated and gitignored. Native Swift belongs in Expo modules (`modules/`) or config plugins (`plugins/`). Follow `AGENTS.md`: read the Expo v56 docs first, and use GitNexus impact checks if they are available.

**Where things live**
- **UI:** all screens and navigation are in `App.tsx` (about 11k lines).
- **Deterministic engine:** `src/intelligence.ts`. It builds the schedule, Semester Health, Class Pulse, forecasts, risks, the notification plan, and quick-capture parsing.
- **Heuristic "AI":** `src/ai.ts`, a regex syllabus and notes parser. Flashcards and quizzes are template strings today. **The app has zero real model inference.**
- **Data:** one JSON blob (`app-data` in expo-sqlite), changed only through `mutate()` or `applyImport`.
- **Import review:** imports pass through a human review screen (`ReviewImport`) before they are applied.
- **OCR:** Vision OCR runs in `modules/studyplanner-vision-ocr`.
- **Widgets:** four widgets (Today, Upcoming, Week, Class Progress) via expo-widgets.
- **Other plumbing:** local reminders; StoreKit subscriptions (weekly, monthly, yearly) behind a hard paywall.
- **Dead code:** only 31 source files are live. `src/screens`, `src/core`, and `src/design` are dead; leave them alone.

**Apple platform facts**
- Foundation Models needs iOS 26 and an Apple Intelligence device (iPhone 15 Pro or later) with the feature turned on.
- Context is about 4K tokens on iOS 26 and larger on iOS 27, so read `contextSize` at runtime.
- One request runs per session at a time. Run models in the foreground only; never inside widgets or extensions.
- On-device models don't support Hindi or Arabic.
- Other APIs: iOS 26 `RecognizeDocumentsRequest` reads syllabus tables; App Intents / App Shortcuts / `IndexedEntity` bring the app into Siri and Spotlight.

**Locales:** 10 in the app (`ar de en-US es fr hi ja ko pt-BR zh-Hans`) and 17 in the App Store.

**Planning docs** (in `docs/apple-intelligence/`)
- **`MASTER_PLAN.md`:** the detailed spec: competitors, schemas, validators, gates, and owner decisions.
- **`RECON_BUILD90.md`:** the repo map and API verification.
- **`SCORECARD.md`:** the rubric and prior review findings.

Use these docs as references, not as a script.

## The finished product
A student opens StudyPlanner in syllabus week:

1. **Scan everything, see the whole semester.**
   - They photograph or import every syllabus. Tables, week grids, and multi-page PDFs are read correctly.
   - Seconds later there's a reviewed list of every assignment, quiz, and exam.
   - Next to it is the **Crunch Forecast**: a heatmap of the whole term with the brutal weeks glowing red, plus "start Bio on Oct 12" dates that beat each crunch.
   - They get all of this **before paying**, and it's shareable.
2. **Share it.**
   - A clean Forecast card goes to the group chat ("the week I'm going to cry").
   - One tap turns a class into a **Class Pack** link or QR code, so classmates import the same deadlines in seconds without scanning anything.
3. **Every day after, one clear move.**
   - Today, the Lock Screen widget, and Siri all say the same thing: *"Now: 25 min Bio ch. 7, exam in 12 days,"* along with one sentence explaining why.
   - Missed a session? The plan quietly repairs itself.
4. **Before every exam, Exam Mode.**
   - Their own notes become flashcards and practice questions. Every one cites the note line it came from.
   - It works offline and has no caps.
   - Weak topics surface on their own and earn extra review blocks.
   - A **Quiz Duel** lets them challenge a friend with the same deck.
5. **Capture without friction.**
   - "Lab report Friday, 10%" typed or said to Siri becomes a correctly dated task after one confirmation.
   - Classes and deadlines show up in Spotlight.
6. **Honest everywhere.**
   - On older iPhones, with Apple Intelligence off, or in Hindi or Arabic, everything still works, just as well as Build 90 does today.
   - The AI features simply appear where the device supports them.

## How AI makes each piece dramatically better
| Buildout | Today (Build 90) | 2.2 with Apple Intelligence |
|---|---|---|
| **Syllabus → Semester** | Regex misses tables and odd date formats | Document-structure OCR plus on-device structured extraction (`@Generable` schemas). Every item is grounded to a verbatim source line, merged with the regex results, and still human-reviewed. Far higher recall, and zero invented dates. |
| **Crunch Forecast** (deterministic) | 7-day pressure strip | A term-wide weekly heatmap with back-scheduled start dates. It's only as good as extraction, which is why AI extraction comes first. |
| **Study Now** | Templated coach copy | The deterministic engine picks the task. The model writes a short, personal "why", once per day, cached, and reused by Today, the widget, notifications, and Siri. |
| **Exam Mode** | "Explain {term}" template flashcards | Real cards and multiple-choice questions generated from the student's notes, each citing its source. Practice results drive weak-topic detection and extra `exam_prep` blocks. |
| **Quick-add** | Regex capture that fails on ambiguity | The model proposes a task only when regex fails. Existing date and class resolvers validate it, and the user confirms. |
| **Siri / Shortcuts / Spotlight** | None | App Intents covering "What should I study now?", "What's due?", Add assignment, and Open scan. Classes and tasks are indexed. |
| **Growth loops** | None | Forecast share card, Class Pack (universal link with the payload in the `#fragment`, so no server), and Quiz Duel. |
| **Monetization** | Hard paywall before any scan | The aha moment comes free: import every class and see the full forecast. Plus unlocks planning, Exam Mode, widgets, reminders, and Siri. Paywall is annual-first, with a no-trial weekly "finals cram" plan. On-device inference costs nothing per use, unlike metered competitors. |

## Non-negotiables
- **The model proposes; deterministic code and the user decide.**
  - The model never writes app data directly, and never supplies trusted dates, IDs, grades, completion state, schedules, reminders, or billing.
  - Everything goes through validation and confirmation, then the existing `mutate()`/`applyImport`.
- **Minimum inference, maximum impact.** Deterministic code chooses wherever it can. Every model call is cached and justified. There is no background inference.
- **Keep Build 90 behavior as the fallback** everywhere the model can't run. Android and web stay unaffected.
- **Trademark and honesty rules**
  - "Apple Intelligence" may appear only as a reference, in English. It never goes in the app name or subtitle, and Apple's logo is never used.
  - State the device requirements. Make no AI claims for the zh-Hans, hi, or ar store listings.
  - Exam Mode is practice from the student's own notes, never homework solving.

## Definition of done
- **Every buildout above works on device,** including the free-first paywall, sharing loops, widgets, Siri, and Spotlight.
- **Localized** in all 10 in-app locales, with Arabic right-to-left. Store copy and the App Preview are updated for all 17 store locales.
- **Tested**
  - All existing test suites plus new tests stay green.
  - Extraction is evaluated against hand-labelled syllabi: zero invented dates, precision at least 0.95, and recall clearly above the regex baseline.
  - Verified on an eligible iPhone, an ineligible device, and iOS 16.4.
- **Reviewed.** Run `/code-review` at high effort, then independent reviewer scores. Every category must be ≥ 9/10, or remaining gaps are reported honestly.
- **Packaged** as version 2.2.0 (build 91 or later), TestFlight-ready, with App Review notes explaining on-device generation.

## Leave to the owner
Surface these clearly and never perform them:
- Enable Apple Intelligence on the dev Mac, and supply an iPhone 15 Pro or later.
- App Store Connect subscription and offer changes.
- Deploy the universal-link files to the support site.
- Upload to TestFlight and submit for review.
