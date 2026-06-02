# Frontend Redesign Commit Manifest

Baseline recorded in scorecard: `ea8cd1f`
Commit target: `Polish StudyPlanner frontend presentation`

## Intended Frontend Redesign Files

These are the source files intended for this commit:

- `src/components/StudyPlannerAppleBoard.tsx`
- `src/screens/TodayScreen.tsx`
- `src/screens/PlanScreen.tsx`
- `src/screens/CoursesScreen.tsx`
- `src/screens/FocusScreen.tsx`
- `src/screens/MoreScreen.tsx`
- `src/screens/UpgradeScreen.tsx`

## Intended Report And Screenshot Artifacts

Intended to stage:

- `FRONTEND_REDESIGN_SCORECARD.md`
- `FRONTEND_REDESIGN_COMMIT_MANIFEST.md`
- `artifacts/frontend-redesign/stabilization-final-screenshots-v2/`

Generated during review but not intended to stage:

- `artifacts/frontend-redesign/screenshots/`
- `artifacts/frontend-redesign/fresh-screenshots/`
- `artifacts/frontend-redesign/final-current-screenshots/`
- `artifacts/frontend-redesign/focus-recapture/`
- `artifacts/frontend-redesign/stabilization-final-screenshots/`

## Unrelated Pre-Existing Dirty Files

Modified:

- `AGENTS.md`
- `qa/scorecards/final-widget-review.json`
- `qa/scorecards/final-widget-scorecards.json`
- `qa/scorecards/widget-repair-scorecards.json`
- `qa/screenshots/final-widget-screenshot-manifest.json`
- `qa/screenshots/screenshot-manifest.json`
- `qa/screenshots/widget-repair-screenshot-manifest.json`
- `qa/widgets/widget-data-truth.json`
- `qa/widgets/widget-layout-matrix.json`
- `qa/widgets/widget-no-crop-validation.json`
- `qa/widgets/widget-truth-map.json`
- `src/customization.ts`
- `src/logic/studentLifeDepth.ts`
- `src/screens/ImportScreen.tsx`
- `src/screens/NotesScreen.tsx`
- `src/screens/OnboardingScreen.tsx`
- `src/services/marketingCapture.ts`

Untracked:

- `APP_PREVIEW_SOURCE_PLAN.md`
- `APP_STORE_BLOCKER_FIX_REPORT.md`
- `APP_STORE_READINESS_REPORT.md`
- `DEPTH_IMPLEMENTATION_REPORT.md`
- `DEPTH_PROOF_REPORT.md`
- `FINAL_PRODUCT_EXCELLENCE_CONTACT_SHEET.png`
- `FINAL_REVIEW_SCORECARD.md`
- `LOCALIZATION_AUDIT.md`
- `PAYWALL_SCORECARD.md`
- `PRODUCT_EXCELLENCE_SCORECARD.md`
- `RELEASE_READINESS_REPORT.md`
- `SCREENSHOT_CAPTURE_PLAN.md`
- `STUDENT_LIFE_DEPTH_PLAN.md`
- `WATCH_SCORECARD.md`
- `WIDGET_SCORECARD.md`
- `artifacts/brand-refresh/screenshots/`
- `artifacts/figma-approval-review/`
- `artifacts/figma-polish-refinement/`
- `artifacts/semester-pulse/probe/`
- `artifacts/semester-pulse/screenshots/`
- `artifacts/semester-pulse/widgets/`
- `artifacts/studyplanner-syllabus-ai-screens/`
- `artifacts/syllabus-ai-figma-pack/`
- `artifacts/watch-app/`
- `artifacts/watch-release-hardening/`
- `docs/STUDENT_LIFE_OS_FEATURE_CONTRACT.md`
- `docs/STUDENT_LIFE_OS_INFORMATION_ARCHITECTURE.md`
- `marketing_exports/`
- `outputs-allpreviews-contact.png`
- `outputs-ipad-raw-contact.png`
- `receipts/`
- `src/logic/studentLifeCopy.ts`

## True Blockers Found

- Today real reminder/calendar actions were removed from the redesigned Home flow. Fixed by restoring `Set reminders` and `Sync calendar` as secondary actions.
- Forecast no longer included a class-backed card using real class color. Fixed by restoring the existing Physics next-class card.
- Focus capture had unreadable low-contrast text. Fixed by making the timer stage black/high-contrast.

No true blocker found for:

- Brand drift
- Broken architecture
- Localization leak
- Widget/IAP/storage/parser/watch behavior changes

## QA Results

- `npm run typecheck` passed.
- `npm run check:localization` passed.
- `npm run check:scenarios` passed.
- `npm run test:customization` passed.
- `npm run test:student-life-depth` passed.
- `npm run test:widgets` passed.
- `npm run test:widget-integrity` passed.
- `npm run check:widget-no-crop` passed: 130 cases, 16 local raw PNGs indexed.
- `npm run check:iap` passed.
- iOS simulator build passed with 0 errors and 0 warnings.
- iOS simulator capture passed: `artifacts/frontend-redesign/stabilization-final-screenshots-v2/manifest.json`.
- `npx gitnexus detect-changes --repo studyplanner --scope staged` reported CRITICAL: 23 staged files, 15 indexed symbols, 22 affected processes. This is expected for the shared frontend screens and `SPWatchPreview` presentation surface in a small app shell; no parser, storage, IAP, or native widget implementation files are staged.

## Staging Policy

Stage only:

- Intended frontend redesign files
- `FRONTEND_REDESIGN_SCORECARD.md`
- `FRONTEND_REDESIGN_COMMIT_MANIFEST.md`
- `artifacts/frontend-redesign/stabilization-final-screenshots-v2/`

Do not stage:

- Pre-existing unrelated dirty files
- Earlier stale/scratch frontend-redesign capture folders
