# Build 42 Release Blocker Map

Date: 2026-06-05  
Build: 1.0.3 (42)

## Blocker 1: Real PDF Import Not Exposed

- Root cause: Scan UI had an “Upload PDF” card, but it routed to paste text. No document picker was exposed.
- Affected files: `App.tsx`, `package.json`, `package-lock.json`, `src/pdfImport.ts`, `src/pdfText.ts`, `ios/Podfile.lock`, generated iOS Pods/project files.
- Safest fix: Add `expo-document-picker`, expose a clear PDF button in the syllabus scan hero, run local best-effort text extraction, and route extracted text through existing `analyzeSyllabus -> Review Import -> applyImport` flow.
- Validation plan: Verify visible PDF CTA in simulator, verify native picker boundary, verify pure PDF extraction fixture, verify syllabus stress suite.
- Release risk: Low/medium. Text PDFs work when extractable. Image-only/compressed PDFs fall back to paste/photo/OCR with explicit copy.
- Status: Fixed.

## Blocker 2: IAP Purchase Completion Not Validated

- Root cause: No sandbox Apple credentials were available in the simulator.
- Affected files: `src/iap.ts`, `App.tsx`, `app.json`, `eas.json`.
- Safest fix: Do not fake purchase completion. Verify product IDs, paywall rendering, restore path, StoreKit boundary, EAS account, and bundle/App Store metadata.
- Validation plan: Product IDs and app IDs inspected; prior simulator validation loaded real prices and reached Apple Account sign-in.
- Release risk: Medium. Completion still requires sandbox/TestFlight credentials.
- Status: Documented, not fully completed.

## Blocker 3: Physical Widget Placement Not Completed

- Root cause: Simulator widget placement could not be driven reliably through available automation.
- Affected files: `src/widgetEngine.ts`, `src/widgets/StudyPlannerWidgets.tsx`, `app.json`, `ios/ExpoWidgetsTarget/*`.
- Safest fix: Preserve architecture. Verify extension target, App Group, widget timelines, widget deep links, and metadata.
- Validation plan: Inspect App Group timeline snapshots and confirm `studyplanner://today` URLs.
- Release risk: Low/medium. WidgetKit build/sync evidence is strong, but physical placement screenshots remain missing.
- Status: Best available evidence captured; physical placement not claimed.

## Blocker 4: Notification Delivery/Pending Evidence Missing

- Root cause: Permission prompt was validated previously, but final scheduling click did not produce saved notification IDs in simulator SQLite during this pass.
- Affected files: `src/reminders.ts`, `App.tsx`, `src/intelligence.ts`.
- Safest fix: Do not fake delivery. Preserve real `expo-notifications` scheduling path and document validation limit.
- Validation plan: Verify permission prompt/grant screenshot, Reminders screen, notification-plan tests, and scheduling code. Re-test with physical device or a simulator run where button press can be confirmed.
- Release risk: Medium/high. Scheduling logic exists, but final pending/delivery evidence is incomplete.
- Status: Not fully closed.

