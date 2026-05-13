# Experience Spine Rescue QA

## Reference

- Reference image used: `/Users/mattnewman/Documents/studyplanner_ui_reference.png`
- Expected reference paths checked first:
  - `/Users/mattnewman/Downloads/studyplanner_ui_reference.png`
  - `/Users/mattnewman/work/StudyPlanner-widget-command-center/studyplanner_ui_reference.png`
  - `/Users/mattnewman/work/StudyPlanner-widget-command-center/artifacts/**/studyplanner_ui_reference*.png`
- Actual reference note: the expected paths were missing, so the rescue pass used the matching file found in Documents.

## Screenshots

- Folder: `artifacts/experience-spine-rescue`
- Raw PNG count: 21
- Captured states:
  - `01-onboarding-animated-step-1.png`
  - `02-onboarding-animated-step-2.png`
  - `03-onboarding-animated-step-3.png`
  - `04-today-glass-home.png`
  - `05-scan-core-entry.png`
  - `06-parser-progress.png`
  - `07-found-work-review.png`
  - `08-calendar-plan.png`
  - `09-week-plan.png`
  - `10-classes.png`
  - `11-assignment-detail.png`
  - `12-widget-studio-glass.png`
  - `13-widget-studio-palettes.png`
  - `14-small-widget-glass.png`
  - `15-medium-widget-glass.png`
  - `16-theme-aurora.png`
  - `17-theme-ocean.png`
  - `18-theme-sunset.png`
  - `19-dark-today.png`
  - `20-dark-widget-studio.png`
  - `21-ipad-today-or-widget-studio.png`

## Automated Verification

| Check | Result | Notes |
| --- | --- | --- |
| `npm run typecheck` | Passed | TypeScript completed cleanly. |
| `npm run test` | Passed | 64 tests passed after updating changed labels, widget preferences, and course-scoped snapshots. |
| `npm run check:iap` | Passed | Product identifiers remain aligned. |
| `npm run verify:production` | Passed | Production no-demo verification completed. |
| `npm run audit:storekit` | Passed with expected caveat | Audit completed; external App Store Connect proof is still intentionally out of repo scope. |
| `CI=1 EXPO_PUBLIC_STORE_CAPTURE=1 ./scripts/verify-ios-widgetkit.sh` | Passed | Built, installed, launched on `StudyPlanner-Codex-iPhone`, wrote App Group snapshot with `demoState.enabled=true` for capture mode. |
| `CI=1 EXPO_PUBLIC_STORE_CAPTURE=0 ./scripts/verify-ios-widgetkit.sh` | Passed | Built, installed, launched on `StudyPlanner-Codex-iPhone`, wrote App Group snapshot without `demoState`, confirming production mode does not seed demo data. |

## WidgetKit Notes

- The verifier script calls `expo run:ios`, which attaches to Metro logs after launch.
- For both WidgetKit checks, the app bundled and launched successfully; then Metro was interrupted so the script could continue to its App Group payload inspection.
- Capture mode snapshot used the preview dataset and included `demoState.enabled=true`.
- Production mode snapshot used persisted planner data and did not include `demoState`.
- Widget snapshot schema stayed backward-compatible and now includes optional `scope.courseFocusId` and `scope.layoutId`.

## Manual Visual QA

- Onboarding now sells the loop with a large glass card and clear `Scan -> Parse -> Plan -> Focus -> Review` stepper.
- Today, Scan, Calendar, Week, Classes, and Widget Studio share the same premium shell language, gradient wash, glass cards, and plain school copy.
- Widget Studio now presents a large live Home Screen preview, size selector, focus view selector, class focus chips, background styles, theme palettes, and layout choice.
- Theme captures confirm Aurora, Ocean, Sunset, and dark Widget Studio states remain readable.
- The iPad screenshot was recaptured after launching with a live bundle; the final PNG shows the real Widget Studio screen, not the earlier development loader error.

## Remaining Risk

- Native widget installation on the simulator still requires the manual Home Screen add-widget step described by the verifier script.
- This pass intentionally did not rewrite parser, StoreKit, persistence, or native widget family support.
