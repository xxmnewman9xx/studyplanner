# StudyPlanner 2.2.0 (build 91) — release checklist

Branch `claude/serene-franklin-l59tqr` → PR into `feature/apple-intelligence-2.2` (never `main`).
Everything below the line "Verified here" was checked in a Linux container; everything under
"Owner" needs a Mac, a device, or App Store Connect.

## Verified here
- `npm run typecheck`; suites: `test:runtime-safety`, `test:hard-paywall`, `test:intelligence`,
  `test:syllabus-stress`, `test:global-syllabus`, `test:notes-stress`, `test:semester`,
  `test:narrative`, `test:widgets`, `test:widget-integrity`, `test:back-to-school-widgets`,
  `test:ai`, `test:ai-native`, `test:app-intents`, `test:widget-study-now`, `test:copy-22`.
- `npx expo prebuild --platform ios --no-install` (temp copy): App Intents Swift in the main
  target, string catalogs in Resources, App Group + `applinks:` entitlements, 2.2.0 / 91.
- Extraction eval (`tsx scripts/eval-extraction.ts --baseline`): heuristic baseline on 32
  hand-labelled syllabi = precision 69.9%, recall 69.1%, **0 invented dates**. Gold-derived
  oracle model: recall 89.1%, one-tap trusted set precision 100%.
- Web-rendered screenshot QA of the new screens (light theme, en-US + ar RTL + ja + de).

## Owner — before TestFlight
1. `npm install` on the Mac, then `npx expo prebuild -p ios --clean` and build with Xcode 26.6.
   First compile of Swift written without a compiler here; known spots to check are listed in
   the native agent notes (FoundationModels `contextSize`, `GenerationOptions`, `@Guide`
   overloads, `RecognizeDocumentsRequest` table API, `AppShortcut` iOS 16 initializer,
   `openAppWhenRun` deprecation warning).
2. `otool -l` on the app binary: `FoundationModels` must be `LC_LOAD_WEAK_DYLIB`.
   `Metadata.appintents` must exist in the .app.
3. Enable Apple Intelligence on the Mac; run `tools/fm-eval` (README) and then
   `tsx scripts/eval-extraction.ts --model tools/fm-eval/outputs`. Gates: 0 invented dates,
   trusted-set precision ≥ 95%, recall ≥ 79.1%.
4. Device matrix: iPhone 15 Pro+ (AI on), same device with AI off, an ineligible iPhone,
   iOS 16.4 simulator, Arabic + Hindi locales (classic engine, RTL).
5. Siri: "What should I study now", "What's due", "Add assignment" (app killed), "Open scanner".
6. Spotlight: search a class / exam, tap → correct screen.

## Owner — App Store Connect / ops
- Subscriptions: annual first with a 7-day free trial; weekly "finals cram" with no trial
  (replace the current paid first-week offer); optional $29.99 vs $39.99 annual test.
- Enable Associated Domains on the App ID; deploy `deploy/universal-links/` to the workers.dev
  site (AASA served as `application/json`, no redirect).
- Store copy for 17 locales is in `store.config.json` (version 2.2.0). zh-Hans / hi / ar carry
  no AI claims. Review notes: `docs/apple-intelligence/APP_REVIEW_NOTES_2.2.md`.
- App Preview (beats 2–5, in-app capture on an eligible iPhone):
  `docs/apple-intelligence/APP_PREVIEW_2.2.md`. QA capture screens: `examMode`,
  `practiceCards`, `practiceQuiz`, `forecast` (build with `EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA=1`).
- In-App Events: `docs/apple-intelligence/IN_APP_EVENTS_2.2.md` (Finals Crunch, Syllabus Week).
- Privacy label stays "Data Not Collected"; policy has the on-device AI section.
