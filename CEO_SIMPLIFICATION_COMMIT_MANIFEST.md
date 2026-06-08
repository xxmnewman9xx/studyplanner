# CEO Simplification Commit Manifest

Date: 2026-06-01
Base HEAD: `09ae3557b4252bc75615f815d7abd4f9da9c7a88`

## Intended CEO Simplification / Release-Readiness Files To Stage

- `localized-app-strings/core-launch-strings.json`
  - CEO pass copy cleanup for visible Studio, Onboarding, and Scan language.
- `src/screens/ImportScreen.tsx`
  - Removes visible OCR/build implementation copy from Scan.
- `src/screens/MoreScreen.tsx`
  - Simplifies Studio to compact live preview, class colors, accent, widget recommendation, saved widgets, and Semester Pulse.
  - Removes visible Setups/fake packs/decorative Watch preview/duplicate previews.
- `src/screens/OnboardingScreen.tsx`
  - Removes visible setup-pack copy.
- `src/widgets/widgetThemes.ts`
  - Reverts visible fake setup labels back to plain theme labels.
- `src/components/SemesterPulse.tsx`
  - Required dependency for the staged `MoreScreen.tsx` Semester Pulse UI. Without this file the committed checkout would not typecheck.
- `CEO_REVIEW_SCORECARD.md`
  - CEO review, deleted UI list, changed files, QA results, remaining weaknesses.
- `CEO_REVIEW_CONTACT_SHEET.png`
  - Final CEO screenshot contact sheet.
- `CEO_SIMPLIFICATION_COMMIT_MANIFEST.md`
  - This staging manifest.

Not staged intentionally:
- `qa-screenshots/ceo-simplification-final/`
  - Ignored generated per-screen captures used as local evidence. The committed screenshot artifact is `CEO_REVIEW_CONTACT_SHEET.png`.

## Prior QA / Report Artifacts Worth Keeping But Not Staging In This Commit

- `DEPTH_IMPLEMENTATION_REPORT.md`
- `DEPTH_PROOF_REPORT.md`
- `FINAL_PRODUCT_EXCELLENCE_CONTACT_SHEET.png`
- `PRODUCT_EXCELLENCE_SCORECARD.md`
- `RELEASE_READINESS_REPORT.md`
- `STUDENT_LIFE_DEPTH_PLAN.md`
- `artifacts/brand-refresh/screenshots/00-onboarding-scan.json`
- `artifacts/brand-refresh/screenshots/10-today-light.json`
- `artifacts/brand-refresh/screenshots/11-today-dark.json`
- `artifacts/brand-refresh/screenshots/11-today-dark.png`
- `artifacts/brand-refresh/screenshots/12-scan.json`
- `artifacts/brand-refresh/screenshots/13-review.json`
- `artifacts/brand-refresh/screenshots/14-calendar.json`
- `artifacts/brand-refresh/screenshots/17-classes.json`
- `artifacts/brand-refresh/screenshots/18-focus.json`
- `artifacts/brand-refresh/screenshots/19-widgets-ocean.json`
- `artifacts/brand-refresh/screenshots/24-paywall.json`
- `artifacts/brand-refresh/screenshots/40-depth-day1-home.json`
- `artifacts/brand-refresh/screenshots/40-depth-day1-home.png`
- `artifacts/brand-refresh/screenshots/41-depth-day30-home.json`
- `artifacts/brand-refresh/screenshots/41-depth-day30-home.png`
- `artifacts/brand-refresh/screenshots/53-home-after-customization.json`
- `artifacts/brand-refresh/screenshots/53-home-after-customization.png`
- `artifacts/brand-refresh/screenshots/56-scan-starter-cta.json`
- `artifacts/brand-refresh/screenshots/57-empty-today.json`
- `artifacts/brand-refresh/screenshots/58-today-reminder-calendar-actions.json`
- `artifacts/brand-refresh/screenshots/58-today-reminder-calendar-actions.png`
- `artifacts/brand-refresh/screenshots/manifest.json`
- `docs/STUDENT_LIFE_OS_FEATURE_CONTRACT.md`
- `docs/STUDENT_LIFE_OS_INFORMATION_ARCHITECTURE.md`
- `outputs-allpreviews-contact.png`
- `outputs-ipad-raw-contact.png`

## Unrelated Or Pre-Existing Dirty Files To Leave Untouched

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
- `src/screens/FocusScreen.tsx`
- `src/screens/PlanScreen.tsx`
- `src/screens/TodayScreen.tsx`
- `artifacts/figma-approval-review/`
- `artifacts/figma-polish-refinement/`
- `artifacts/studyplanner-syllabus-ai-screens/`
- `artifacts/syllabus-ai-figma-pack/`
- `marketing_exports/`
- `receipts/`

## Package / Native Files

- No package files are intended for staging.
- No generated native iOS files are intended for staging.
