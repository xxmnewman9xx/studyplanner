# App Store Submission Handoff

Status: NO-SUBMIT as of 2026-05-12.

## Build identity

- Branch: v1-3-post-goal-aso-submission-master
- Starting commit: e766ddaf17c9954ab1aaf53e09be8dbe4b6b0b8e
- Bundle ID: com.mattnewman.studyplanner
- Version: 1.0.0
- Build number: 10
- iPad support: enabled in app.json and native project (`TARGETED_DEVICE_FAMILY = "1,2"`); 13-inch iPad raw proof screenshots are captured in `artifacts/post-goal-aso-submission/ipad`, and a local 2064x2752 App Store-sized candidate set is exported in `artifacts/post-goal-aso-submission/app-store-export/ipad-13`. Manual App Store Connect upload acceptance is still external and unproven.

## IAP IDs

- Monthly: com.mattnewman.studyplanner.plus.monthly
- Yearly: com.mattnewman.studyplanner.plus.yearly
- Lifetime: com.mattnewman.studyplanner.plus.lifetime

## Submit blockers

1. App Store Connect IAP product status and sandbox monthly/yearly/Lifetime/restore proof missing.
2. Support URL missing; submission verification fails without EXPO_PUBLIC_SUPPORT_URL in submission mode.
3. Fresh screenshot folder is incomplete for direct upload: 47 primary iPhone/simulator PNGs, 11 iPad PNGs, contact sheets, and local accepted-size candidate exports are captured, but products-loaded StoreKit proof, full localized UI proof, and manual App Store Connect upload acceptance are missing.
4. Native widget refresh after completion, edit, and add is proven; day-boundary label/urgency behavior is code/build proven, but overnight Home Screen screenshot proof is not captured.
5. iPad strategy is no longer unresolved: raw 13-inch proof and local 2064x2752 export validation exist, but App Store Connect upload acceptance still needs manual confirmation.
6. Privacy URL/support page must be publicly verified and updated for parser endpoint/upload retention if endpoint is enabled.
7. Signed App Store archive entitlement for notifications must be checked.
8. Localized metadata packs require native-speaker and text-fit review.
9. Products-loaded paywall screenshot is missing; the captured paywall proof currently shows purchases unavailable.

`npm run verify:submission` now centralizes these gates. As of 2026-05-12 it correctly returns **NO-SUBMIT** with 8 blockers and 1 warning: missing IAP env IDs, support URL, products-loaded paywall screenshot, StoreKit sandbox proof, App Store Connect screenshot upload acceptance, signed archive entitlement proof, and VoiceOver traversal proof. It passes the local iPhone/iPad accepted-size screenshot export checks, English ASO copy audit, localized ASO structural audit, and source-level VoiceOver audit.

External proof templates are staged in `artifacts/post-goal-aso-submission/external-proof`. The verifier rejects template/TODO/placeholder language, so those templates are only a checklist for the future App Store Connect/StoreKit run, not proof.

## Reviewer flow draft

See docs/APP_REVIEW_NOTES_FINAL.md.

## Metadata

Use docs/APP_STORE_METADATA.md, docs/ASO_METADATA_PACK_EN.md, and localized ASO docs after native review.

## Screenshot folder

`artifacts/post-goal-aso-submission`

Current capture inventory:

- 47 primary raw simulator PNGs captured.
- 11 raw 13-inch iPad simulator PNGs captured in `artifacts/post-goal-aso-submission/ipad`.
- Contact sheet captured: `artifacts/post-goal-aso-submission/45-final-contact-sheet.png`.
- iPad contact sheet captured: `artifacts/post-goal-aso-submission/ipad/ipad-contact-sheet.png`.
- Local App Store-sized candidate export captured: `artifacts/post-goal-aso-submission/app-store-export/iphone-6-9` contains 10 PNGs at 1290x2796; `artifacts/post-goal-aso-submission/app-store-export/ipad-13` contains 10 PNGs at 2064x2752; `app-store-export/manifest.json` maps source-to-output files and retains the manual upload caveat.
- Production empty Today proof captured: `06-today-empty.png`.
- Capture-mode proof captured for onboarding, populated Today, Reminders, Settings, Add School Stuff, Check New Work, assignment detail, Calendar, Week Plan, Classes, Widget Setup, themes, and paywall product-load failure.
- Manual Add proof captured: `13-manual-add.png`.
- Check Work edit-item proof captured: `17-check-new-work-edit-item.png`.
- Calendar filtered-class proof captured: `23-calendar-filtered-class.png` shows the Chemistry 101 filter applied to real planner data.
- Import-path proof captured: `11-scan-paper.png`, `12-upload-file.png`, `14-parser-processing.png`, `18-check-new-work-duplicate.png`, and `19-check-new-work-imported.png`; the scan-paper proof keeps Camera/Photo disabled until photo parsing is configured.
- Reminders proof captured: `28-reminders.png` shows the Today Reminders card with real Queue Reminders and Sync Calendar actions.
- Settings proof captured: `36-settings.png` shows planner status, appearance, Plus/store status, restore access, widget scope, privacy link, and the still-missing support URL configuration.
- Restore access proof captured: `39-restore-purchases.png` shows the real Restore entry point, but does not prove sandbox restore success.
- Localized/date proof captured: `43-localized-ui-example.png` shows a real `fr-FR` / `fr_FR` simulator Week Plan screenshot with locale-sensitive date ordering and 24-hour status-bar style; it does not prove translated app strings.
- Localization string audit captured: `docs/LOCALIZATION_STRING_AUDIT.md` reports 737 likely localizable strings across 46 tracked source files, confirming localized UI submission is not ready without deliberate i18n work and native review.
- VoiceOver source audit captured: `docs/VOICEOVER_READINESS_AUDIT.md` reports 104 scanned interactive elements with 104 explicit labels, 104 roles, and 0 missing recommended hints; the full manual traversal remains open.
- ASO copy audit captured: `docs/ASO_COPY_AUDIT.md` reports English metadata is length-safe and claim-safe; localized metadata structure is separately checked, but native review remains open.
- Localized ASO structural audit captured: `docs/ASO_LOCALIZATION_AUDIT.md` reports 20 localized metadata draft rows and 20 screenshot-caption QA rows are placeholder-free, length-safe, claim-safe, and explicitly caveated for native-speaker/text-fit review.
- iPad proof captured: onboarding, Today, Add School Stuff/Check New Work, Calendar, Week, Classes, Widget Setup, paywall unavailable state, Settings/Restore, and Assignment Detail are captured as upright 2064x2752 PNGs on `StudyPlanner-Codex-iPad`.
- Native widget proof captured: `30-small-widget-home-screen.png` and `31-medium-widget-home-screen.png` show installed WidgetKit small/medium widgets using the current May 2026 capture snapshot.
- Native widget edge-state proof captured: `32-widget-empty-state.png`, `33-widget-needs-check-state.png`, `widget-empty-state-snapshot.json`, and `widget-needs-check-state-snapshot.json`.
- App icon/Home Screen proof captured: `40-app-icon-home-screen.png`.
- Widget refresh proof captured: `46-widget-refresh-after-completion.png` and `widget-refresh-after-completion-snapshot.json` show completing Lab Report updated the App Group snapshot and installed widgets.
- Widget edit refresh proof captured: `47-widget-refresh-after-edit.png` and `widget-refresh-after-edit-snapshot.json` show editing Reading Reflection to Reflection Draft updated the App Group snapshot and installed widgets.
- Widget add refresh proof captured: `48-widget-refresh-after-add.png` and `widget-refresh-after-add-snapshot.json` show adding Field Notes updated the App Group snapshot and installed widgets.
- Widget day-boundary behavior is code/build proven: WidgetKit recomputes label/urgency at render time and schedules refresh for the earlier of 30 minutes or 00:01 local time.
- Core action large-text proof captured: `49-accessibility-check-work-large-text.png` through `52-accessibility-paywall-large-text.png`.
- Contrast-safe visual spot check refreshed `01-onboarding-welcome.png`, `07-today-populated.png`, `21-calendar-month.png`, `24-week-plan.png`, `26-classes-list.png`, and `29-widget-setup.png`; `45-final-contact-sheet.png` was regenerated from 47 primary PNGs at 1040x6856.
- Submission verifier proof: `npm run verify:submission` passes local screenshot export checks, English ASO copy audit, localized ASO structural audit, and the source-level VoiceOver audit, then fails honestly until external StoreKit/support/App Store Connect/VoiceOver/archive proof is supplied.
- External proof packet templates captured: `external-proof/*.template.md` for StoreKit, App Store Connect screenshot upload, signed archive entitlements, VoiceOver traversal, and localized UI/native review.
- Missing: products-loaded paywall, restore purchase success/sandbox proof, full UI localization/string extraction/native review, full VoiceOver traversal, manual App Store Connect upload acceptance for the exported screenshots, and optional overnight widget rollover screenshot.

Date/localization implementation note:

- Month calendar logic now respects locale week-start rules and has Sunday/Monday/Saturday-start unit coverage.
- Due-date and Week Plan date labels now use preferred locale formatting, including 24-hour locale coverage for `fr-FR` and `en-GB`.
- A real French-locale simulator screenshot now proves partial locale/date behavior in Week Plan, `npm run audit:localization` provides hardcoded-string extraction evidence, and `npm run verify:localized-aso` keeps localized ASO drafts structurally complete. Full localized submission still requires translated UI implementation, native-speaker review, and localized screenshot text-fit checks.

Accessibility implementation note:

- Task rows, completion controls, WeekStrip days, workload bars, calendar mini-days, workload forecasts, class balance rows, and completion cards now expose source-tested VoiceOver labels.
- Check Work, Assignment Detail, Widget Setup, Paywall, and shared buttons now expose stronger labels/hints and bounded text scaling, with large-text screenshots captured.
- `npm run audit:voiceover` provides source-level VoiceOver readiness evidence, but it is not a substitute for the required simulator/device VoiceOver traversal proof packet.
- Theme/class/widget contrast is guarded by `tests/themeContrast.test.ts`; full submission polish still requires real VoiceOver traversal and localized UI states.

## Recommendation

Do not submit this branch yet. Continue with StoreKit sandbox proof, support/privacy finalization, manual App Store Connect screenshot upload acceptance, full localized UI proof/native review, optional overnight widget rollover screenshot, and final QA.
