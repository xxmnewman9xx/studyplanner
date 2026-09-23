# Back-to-School 2026 Implementation Evidence

Date: 2026-07-07
Cycle: Personal white setup and automatic class-color onboarding, semester-ready payoff, calendar widget hero, widget recommendation flow

## Implemented In This Cycle

- Removed the visible semester color customization step and kept onboarding on a white Apple-style system with black controls and automatic class colors.
- Replaced the color picker with a two-step name/build setup before import/manual setup.
- Added localized white system and automatic class-color labels and dynamic label fitting for compact setup proof.
- Defaulted onboarding and post-apply proof to the internal graphite system without exposing color choices.
- Kept the internal theme contract intact so app accents and native widget snapshots can continue to resolve safely through the existing theme path.
- Promoted the existing Week widget into the calendar-widget hero without adding a fifth native WidgetKit kind.
- Added calendar snapshot props for exam markers, today highlight, peak day, and calendar headline.
- Added semester-ready payoff content after import apply:
  - import result metrics,
  - applied white system and class-color proof,
  - semester health,
  - next move,
  - first focus block,
  - recommended semester calendar widget.
- Updated widget gallery copy to position the Week widget as `Semester Calendar`.
- Installed SDK 56 compatible `expo-glass-effect` and `expo-blur` direct dependencies.
- Added a reusable `LiquidGlassSurface` wrapper that uses Expo SDK 56 `GlassView` only when `isGlassEffectAPIAvailable()` and `isLiquidGlassAvailable()` both pass, with `BlurView`/`View` fallbacks.
- Applied Liquid Glass treatment to the immersive onboarding preview board, onboarding control rail, semester-ready widget recommendation, and widget gallery header/cards.
- Updated the in-app `NativeHomeWidgetPreview` week surface to match the calendar-style native widget data model: today highlight, exam markers, capped day counts, peak-day label, and calendar headline.
- Updated widget integrity QA to guard the new calendar-cell preview contract instead of the old dot rail.
- Updated native widget snapshot theming so normal, non-danger widget states inherit the student's onboarding theme color while overdue and overloaded states keep red/orange urgency.
- Corrected the Week/Semester Calendar severity source to use the existing pressure forecast state instead of treating pressure-load units as raw item counts.
- Added medium-widget action controls backed by Expo widget interaction targets: Import syllabus, Start focus, Review today, Review next, Open calendar, and Check class.
- Added iOS 26 widget environment handling for simplified detail and reduced luminance so the action control can defer to a quieter, text-first layout when the system requests it.
- Added a Back-to-School widget QA gate that validates empty, calm, exam-heavy, and long-copy/tinted-ready widget scenarios.
- Added a native screenshot QA runbook for final release/TestFlight captures: `docs/launch/back-to-school-2026/native-screenshot-qa-runbook.md`.
- Added a final App Store asset manifest for screenshot frames, promotional artwork, social cuts, supplemental material slots, and native capture requirements: `docs/launch/back-to-school-2026/app-store-asset-manifest.json`.
- Added nomination-ready App Store featuring packet: `docs/launch/back-to-school-2026/app-store-nomination-packet.md`.
- Added aligned release notes, screenshot headlines, blog draft, and social copy: `docs/launch/back-to-school-2026/release-notes-and-launch-copy.md`.
- Added an editorial readiness board and gate that maps App Store Connect fields, student story, native proof, screenshots, widgets, supplemental URLs, and claim boundaries to evidence and blockers.
- Added a deterministic native capture runner and run artifact for the ten app-side screenshot states required by the native QA runbook.
- Added a native app capture registration bridge that scans reviewed release/TestFlight app screenshots by capture ID, validates image files, merges real app captures into the native manifest, and updates the app-side native capture status only when real app captures exist.
- Added a native disk readiness audit and scoped safe-clean command so the Xcode disk blocker is measurable before every capture attempt.
- Added a remote EAS simulator capture fallback: guarded release-capture deep links, a simulator build profile, token-safe `.env.eas-simulator` ignore rule, and a remote capture readiness/runbook artifact.
- Added a WidgetKit capture registration bridge that scans reviewed Home Screen/Lock Screen screenshots by capture ID, validates image files, copies real captures into the native evidence folder, merges them into the native manifest, and updates `nativeWidgetPlacement` only when real widget captures exist.
- Added an asset finalizer that maps native capture manifest entries back into App Store screenshot slots and refuses web smoke or missing WidgetKit proof.
- Added a supplemental materials packet and gate that maps all five App Store Connect URL slots to local candidates, native-capture blockers, upload requirements, and App Store submission readiness.
- Added a supplemental URL registration bridge so final hosted App Store Connect URLs can be validated, audited, merged into the supplemental packet, and carried into the upload package without hardcoding them into the asset manifest.
- Added local supplemental proof packets for accessibility/localization QA and App Review claim/purchase-flow evidence.
- Added a deterministic product-video review gate that probes local MP4 candidates, approves the scanner demo as supplemental featuring material, and separately flags that it is not App Store App Preview-ready unless re-exported as native 30fps footage.
- Added a post-capture upload package generator that produces the screenshot contact sheet, native WidgetKit sheet, App Store Connect draft payload, supplemental upload manifest, and checksum-backed local draft upload package.
- Added a marketing asset package generator that gathers local promotional/social draft candidates, hashes them, and keeps them separate from final native-capture App Store creative.
- Added an aggregate release-cycle gate that runs the command set named by the nomination packet and writes one local pass/submission-blocked artifact.
- Added a submission gate that blocks App Store Connect submission until copy, claim boundaries, native capture, WidgetKit proof, asset finalization, supplemental material readiness, editorial readiness, and launch readiness all pass.
- Added an App Store Connect submission runbook generator that converts the draft payload, supplemental URL registry, upload package, and submission gate into a manual draft workflow.
- Added an execution board that collapses native capture, WidgetKit, asset, supplemental URL, marketing, editorial, and submission blockers into ordered owner/subagent lanes.

## Verified Gates

- `npm run typecheck`
- `npm run test:widgets`
- `npm run test:widget-integrity`
- `npm run test:back-to-school-widgets`
- `npm run check:back-to-school-launch`
- `npm run check:back-to-school-assets`
- `npm run check:back-to-school-supplementals`
- `npm run check:back-to-school-upload-package`
- `npm run check:back-to-school-marketing-assets`
- `npm run check:back-to-school-editorial`
- `npm run check:back-to-school-release-cycle`
- `npm run check:back-to-school-submission-runbook`
- `npm run check:back-to-school-execution-board`
- `npm run check:back-to-school-native-preflight`
- `npm run check:back-to-school-native-disk`
- `npm run check:back-to-school-remote-capture`
- `npm run plan:back-to-school-native-capture`
- `npm run capture:back-to-school-native` stops safely before Xcode while disk is below the native capture threshold.
- `npm run finalize:back-to-school-assets`
- `npm run check:back-to-school-submission`
- `npm run check:localization`
- `npm run qa:release`
- `npm run test:hard-paywall`
- `npm run check:iap`
- `npx tsx scripts/check-widget-snapshots.ts`
- Web smoke: local Expo web target loaded at `http://localhost:8081/`; onboarding name step, build action, paywall-first import path, and locked preview were captured.

## Widget QA Artifact

- `qa/widgets/back-to-school-2026-widget-qa.json`

This fixture/preflight artifact validates:

- selected Graphite theme on empty onboarding widgets,
- selected Green theme on calm Today, Semester Calendar, and Class Progress widgets,
- Purple theme with red overdue and orange exam-heavy urgency overrides,
- long-copy Pink detailed widgets with renderer safeguards for accented/tinted modes, WidgetKit container background, glass effect, text tightening, and line limits,
- medium-widget action labels and stable interaction targets,
- iOS 26 detail-level and reduced-luminance environment guards.

This is not a substitute for native iOS Home Screen placement proof.

## Launch Readiness Artifact

- `qa/back-to-school-2026/launch-readiness-audit.json`

This audit validates the local App Store nomination packet, release copy, screenshot manifest, widget QA artifact, native screenshot QA runbook, final asset manifest, character limits, Apple source links, and claim boundaries. It remains `submissionReady: false` until native/TestFlight captures, final App Store screenshots, supplemental URLs, upload package evidence, and the actual App Store Connect featuring nomination are complete.

## Native Build Attempt

- `qa/back-to-school-2026/native-build-attempt-2026-07-06.json`
- `qa/back-to-school-2026/native-disk-readiness.json`
- `qa/back-to-school-2026/native-capture-preflight.json`
- `qa/back-to-school-2026/native-capture-run.json`
- `qa/back-to-school-2026/remote-capture-readiness.json`
- `qa/back-to-school-2026/app-capture-ingest.json`
- `qa/back-to-school-2026/widget-capture-ingest.json`
- `docs/launch/back-to-school-2026/remote-native-capture-runbook.md`

A native iOS simulator build was attempted against `ios/StudyPlannerSyllabusAI.xcworkspace`, scheme `StudyPlannerSyllabusAI`, on the booted iOS 26.5 `Reflex QA iPhone 17` simulator. Xcode reached native compilation but failed with exit code 65 because the host volume ran out of disk while writing Swift module cache files. The failed build generated 2.7 GB of derived data under `ios/build/BackToSchoolDerivedData`, which was removed after the attempt. No app compile error was observed before the disk-full failure, but native Liquid Glass and WidgetKit screenshots were not captured.

The native capture preflight checks free disk, Xcode availability, the workspace, scheme, widget target, and booted iOS 26 simulator before any expensive native build rerun. Its current blocker is disk only: Xcode, the workspace, the app scheme, the widget target, and a booted iOS 26.5 simulator are present.

The native disk readiness audit records the exact free-space gap, emits normalized top-level blockers, and separates scoped generated project caches from manual-review and external-review locations. It intentionally does not delete broad user data. `npm run clean:back-to-school-native-disk` is limited to generated project caches such as `ios/build/BackToSchoolDerivedData`, `.expo/web/cache`, and `node_modules/.cache`.

The native capture runner records the exact app-side capture IDs and simulator capture configs for onboarding Blue, Orange, Graphite, import choice, review, semester-ready payoff, Today, Focus, and widget recommendation screenshots. In the current environment it stops before Xcode because disk is below the capture threshold. It intentionally keeps real WidgetKit Home Screen and Lock Screen placement proof as a separate native capture requirement.

The native app capture registration bridge is the post-capture handoff for manually captured, TestFlight, local simulator, or EAS app screenshots. It intentionally does not generate or composite images. It accepts only real PNG/JPEG files named with the runbook app capture IDs, records dimensions and hashes, and merges them into the same native manifest used by the asset finalizer.

The remote capture fallback prepares a simulator-targeted EAS build path for the same ten app-side screenshot states. It uses the `back-to-school-sim` profile with `EXPO_PUBLIC_STUDYPLANNER_CAPTURE_QA=1`, then opens short `studyplanner://capture?config=...` deep links through EAS Simulator/agent-device. The readiness gate verifies EAS CLI/auth/project identity, the guarded simulator profile, `.env.eas-simulator` ignore coverage, and all ten deep links without starting a paid simulator session.

The WidgetKit capture registration bridge is the post-capture handoff for Home Screen and Lock Screen widget screenshots. It intentionally does not generate or composite widget images. It accepts only real PNG/JPEG files named with the runbook capture IDs, records dimensions and hashes, and merges them into the same native manifest used by the asset finalizer.

## Asset Production Artifact

- `docs/launch/back-to-school-2026/app-store-asset-manifest.json`
- `qa/back-to-school-2026/asset-production-audit.json`
- `qa/back-to-school-2026/asset-finalization-plan.json`

This manifest maps all nine App Store screenshot headlines to required native capture IDs, keeps widget/Home Screen frames tied to real WidgetKit captures, reserves five App Store Connect supplemental material slots, and prevents web smoke screenshots from being used as final creative.

The asset finalization plan is the handoff from raw native captures to final App Store creative. It accepts only files under `qa-screenshots/back-to-school-2026-native/`, rejects web smoke screenshots, allows guarded remote EAS simulator captures only for app-side `app-*` screenshot slots, and keeps WidgetKit screenshot slots missing until real `widget-*` Home Screen or Lock Screen placement captures are present. Blocked asset artifacts now include the exact missing app and WidgetKit capture IDs so the editorial board and submission gate can show actionable blockers instead of generic asset-readiness failures.

## Supplemental Materials Artifact

- `docs/launch/back-to-school-2026/supplemental-materials-packet.md`
- `docs/launch/back-to-school-2026/app-store-screenshot-contact-sheet.md`
- `docs/launch/back-to-school-2026/native-widgetkit-screenshot-sheet.md`
- `docs/launch/back-to-school-2026/app-store-connect-draft-payload.json`
- `docs/launch/back-to-school-2026/app-store-connect-submission-runbook.md`
- `docs/launch/back-to-school-2026/execution-board.md`
- `docs/launch/back-to-school-2026/draft-upload-package/README.md`
- `docs/launch/back-to-school-2026/accessibility-localization-summary.md`
- `docs/launch/back-to-school-2026/app-review-proof.md`
- `qa/back-to-school-2026/supplemental-materials-plan.json`
- `qa/back-to-school-2026/supplemental-upload-manifest.json`
- `qa/back-to-school-2026/draft-upload-package-manifest.json`
- `qa/back-to-school-2026/app-store-connect-submission-runbook.json`
- `qa/back-to-school-2026/execution-board.json`
- `qa/back-to-school-2026/supplemental-url-registry.json`

This packet maps the five App Store Connect supplemental material URL slots to concrete production requirements:

- product video or App Preview,
- release-build screenshot contact sheet,
- native WidgetKit screenshot sheet,
- accessibility/localization QA summary,
- App Review notes and purchase/review flow proof.

It intentionally separates local candidates from App Store-ready URLs. Existing scanner/product video files are treated as supporting candidates only; final submission still requires stable HTTPS URLs and final Back-to-School native capture approval.

The upload package generator is the post-capture bridge into App Store Connect. It produces draft/paste-ready nomination fields, contact sheets, and a checksum-backed local draft upload package, but keeps `packageReady: false` until all nine App Store screenshots, all eight WidgetKit states, and all five supplemental URLs are final.

The supplemental URL registry is the final handoff for uploaded material links. It accepts only stable HTTPS URLs for the five App Store Connect supplemental slots and does not override native screenshot, WidgetKit, or App Review proof blockers.

The App Store Connect submission runbook is the final manual-entry checklist for the featuring nomination. It keeps the release in the individual `Save as Draft` workflow while supplemental URLs, native screenshots, WidgetKit proof, upload package evidence, or launch/editorial gates remain blocked, and it explicitly prevents CSV import while the status is `draft_only`.

The execution board is the operating layer for the remaining release work. It groups blockers into native capture, app screenshot ingest, WidgetKit proof, App Store assets, supplemental URLs, marketing finalization, and editorial submission lanes, with a named owner/subagent lane and exit criteria for each one.

## Marketing Asset Package

- `docs/launch/back-to-school-2026/marketing-asset-package/README.md`
- `qa/back-to-school-2026/marketing-asset-package-manifest.json`

This package gathers draft promotional and social candidates from existing local video/poster assets, records dimensions and checksums, and keeps `finalReady: false` until the draft candidates are replaced by final native release screenshots, real WidgetKit captures, or approved hosted artwork.

## Editorial Readiness Artifact

- `docs/launch/back-to-school-2026/editorial-readiness-board.md`
- `qa/back-to-school-2026/editorial-readiness-board.json`
- `docs/launch/back-to-school-2026/release-cycle-gate.md`
- `qa/back-to-school-2026/release-cycle-gate.json`
- `docs/launch/back-to-school-2026/app-store-connect-submission-runbook.md`
- `qa/back-to-school-2026/app-store-connect-submission-runbook.json`
- `docs/launch/back-to-school-2026/execution-board.md`
- `qa/back-to-school-2026/execution-board.json`
- `qa/back-to-school-2026/submission-gate.json`

This board turns the featuring packet into a state-aware execution checklist. It records which App Store fields are copy-ready, which story claims are ready, why CSV upload is unsafe before final proof, and which native/widget/supplemental evidence still blocks submission. Once native captures, WidgetKit proof, screenshots, supplemental URLs, upload package evidence, and the launch audit are ready, the board can become `submissionReady: true` instead of staying hard-coded to blocked.

The release-cycle gate runs the full nomination packet command set and records one local pass/submission-blocked artifact. The submission gate is the final local stop before App Store Connect. The submission runbook turns that state into a manual App Store Connect checklist, and the execution board names the current critical lane so the next implementation/capture step is not ambiguous. It currently recommends `Save as Draft only` and blocks CSV generation because Apple CSV imports submit nominations automatically.

## Web Smoke Screenshots

Captured from the local Expo web target at `http://localhost:8081/` with a 390x844 viewport:

- `qa-screenshots/back-to-school-2026-implementation/01-onboarding-name.jpg`
- `qa-screenshots/back-to-school-2026-implementation/02-theme-blue.jpg`
- `qa-screenshots/back-to-school-2026-implementation/03-theme-orange.jpg`
- `qa-screenshots/back-to-school-2026-implementation/04-after-theme-artifacts.jpg`
- `qa-screenshots/back-to-school-2026-implementation/05-build-skip-selected.jpg`
- `qa-screenshots/back-to-school-2026-implementation/06-locked-preview.jpg`

These are smoke-check artifacts for layout and onboarding interaction only. Final App Store screenshots must still come from the release build/native capture path.

## Platform Evidence

- Expo SDK 56 widget docs confirm widgets are iOS-only and unavailable in Expo Go; final widget rendering still requires a native development or TestFlight build.
- Expo SDK 56 widget docs require widget layout code to be pure and prop-driven in the isolated `'widget'` runtime. The calendar widget work keeps the existing four widget kinds and passes data through `NativeWidgetSnapshot`.
- Expo SDK 56 widget docs expose interactive widget support through Button/toggle interactions and WidgetKit environment fields such as `widgetRenderingMode`, `isLuminanceReduced`, and iOS 26 `levelOfDetail`; this cycle wires medium-widget action controls and environment-aware rendering while keeping final proof tied to native WidgetKit capture.
- Expo SDK 56 GlassEffect docs define `expo-glass-effect` as the Liquid Glass path; this cycle installs the SDK-matched package and keeps fallbacks available through the existing app code.
- Expo SDK 56 GlassEffect runtime checks are now centralized so iOS 26 beta/runtime edge cases avoid `GlassView` when the API is not available.

## Still Required Before App Store Nomination

- Free enough disk for Xcode DerivedData and rerun the native iOS build/capture path documented in `qa/back-to-school-2026/native-build-attempt-2026-07-06.json`.
- Use `qa/back-to-school-2026/native-disk-readiness.json` to identify the remaining disk gap; project-local generated caches are currently not expected to be enough if the gap is outside the repo.
- If local disk cannot be freed quickly, use `docs/launch/back-to-school-2026/remote-native-capture-runbook.md` to build the `back-to-school-sim` artifact and capture app-side screenshots through EAS Simulator.
- Capture screenshot QA for:
  - two-step onboarding name/build path with no visible color customization,
  - semester-ready payoff,
  - widget recommendation screen,
  - Week/Semester Calendar widget in empty, normal, and overloaded exam weeks,
  - dark mode, tinted widgets, Reduce Transparency where available.
- Run native iOS build or TestFlight verification for actual WidgetKit rendering, including tinted/accented widget modes.
- Produce final App Store screenshot set and nomination assets from real UI only.
- Run `npm run finalize:back-to-school-assets` after native capture, then `npm run apply:back-to-school-assets` only when all nine screenshot slots have real native proof.
- Run `npm run check:back-to-school-upload-package` after native capture so the contact sheets and App Store Connect draft payload refresh from final evidence.
- Run `npm run check:back-to-school-supplementals` after native capture and upload all five supplemental materials to stable HTTPS URLs.
- Run `npm run check:back-to-school-submission` after final asset and supplemental URL updates; submit manually from App Store Connect only when it reports `submissionReady: true`.
- Submit App Store featuring nomination as `App Enhancements` once screenshot evidence and build scope are stable.

## Claim Boundaries

- No Canvas/LMS sync claim.
- No guaranteed extraction claim.
- No automatic homework submission claim.
- No unsupported Watch marketing claim.
- No fake Home Screen widget placement screenshots.
