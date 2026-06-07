# Android Port Intake Audit - StudyPlanner AI

## Baseline Verification

- GitHub URL: https://github.com/xxmnewman9xx/studyplanner
- Source branch: `studyplanner-build-52-source`
- Checked-out tag: `studyplanner-android-source-build-52`
- Expected commit: `93b15994c78b31efff3a032b51a482e895e579a5`
- Actual commit: `93b15994c78b31efff3a032b51a482e895e579a5`
- Match status: PASS
- Local path: `C:\FounderWorker\repos\StudyPlanner`
- Existing target folder handling: prior empty non-git folder moved to `C:\FounderWorker\repos\StudyPlanner-preclone-backup-20260606-180407`.

## Repo Summary

- Framework: Expo / React Native.
- Expo SDK: `56.0.0` from `npx expo config`; package dependency is `expo ~56.0.9`.
- React Native: `0.85.3`.
- React: `19.2.3`.
- Package manager: npm, because `package-lock.json` is present.
- Dependency install: `npm ci` completed without upgrading dependencies.
- Main entry points: `index.ts`, `App.tsx`.
- Build system: Expo/EAS with `eas.json`; no committed `ios/` or `android/` native project folders.
- Important scripts: `typecheck`, `check:build52`, `check:iap`, multiple focused scenario/stress scripts.
- App config: `app.json`.
- iOS bundle ID: `com.mattnewman.studyplanner`.
- iOS version/build: `1.0.3` / build `52`.
- URL scheme: `studyplanner`.
- Android package/application ID: not set in `app.json`.

## Android Readiness

- Existing Android support:
  - Expo config includes Android platform support and adaptive icon assets.
  - Android adaptive icon assets exist: `assets/android-icon-foreground.png`, `assets/android-icon-background.png`, `assets/android-icon-monochrome.png`.
  - `src/iap.ts` already passes Google SKU shape to `expo-iap` requestPurchase.
- Missing Android support:
  - No explicit `expo.android.package`.
  - No committed Android native project.
  - OCR module is Apple-only: `modules/studyplanner-vision-ocr/expo-module.config.json` has `"platforms": ["apple"]`.
  - OCR runtime is iOS-gated: `hasNativeImageTextRecognition()` returns true only on iOS.
  - Notifications return unavailable on non-iOS in `src/reminders.ts`.
  - Native widget sync returns skipped on non-iOS in `src/widgetEngine.ts`; Android has no widget equivalent.
- Package ID recommendation: `com.mattnewman.studyplanner`, matching the existing iOS identity unless Play Console naming strategy requires a distinct Android namespace.
- App icon/splash status: base icon and adaptive Android icon assets are present; Android splash behavior should be verified/generated through Expo config before release.
- Permissions needed:
  - Camera/photo/media access for image syllabus OCR or picker flow.
  - Document/file access for PDF import.
  - Notifications if Android reminders are implemented.
  - Billing permission if native Google Play Billing is shipped.
  - Review Expo config because `npx expo config` currently emits `android.permissions: ["android.permission.RECORD_AUDIO"]`, which is not obviously used by the app and should be removed or justified before Play submission.

## Feature Parity Risks

- Subscriptions: current subscription IDs are Apple-style: `com.mattnewman.studyplanner.plus.monthly` and `com.mattnewman.studyplanner.plus.yearly`. Android needs Play products, entitlement validation rules, restore semantics, and policy review.
- StoreKit dependencies: `expo-iap` is wired and validated for App Store subscriptions; Android path is only structurally present through Google SKU request shape and is not proven.
- Widgets: iOS WidgetKit via `expo-widgets` with app group `group.com.mattnewman.studyplanner`; Android widgets require a separate design/implementation decision.
- Notifications: implemented with `expo-notifications`, but scheduling is explicitly iOS-only. Android reminder parity is missing.
- OCR/imports: PDF import uses `expo-document-picker` and `expo-file-system`; image OCR depends on Apple Vision through a local Expo module and is unavailable on Android.
- File handling: PDF reads are base64 from picked documents; Android document URI handling needs device validation.
- Storage: local SQLite key/value store in `src/storage.ts`, no backend account sync.
- Auth/login: no account/login backend found; access is local entitlement gated.
- Localization: no dedicated localization file surface found in this baseline; user-facing strings appear mostly inline.
- Deep links: scheme `studyplanner`; route gating exists in `App.tsx` and Build 52 checks verify locked funnel behavior.
- Backend/API dependencies: no external app backend found; deterministic local intelligence and imports are local.
- Assets/icons/splash: icon and splash assets exist; Android adaptive icons are present.
- Release docs: extensive build reports through Build 52 are present.
- Known blockers:
  - Android package ID is absent.
  - Apple-only OCR module.
  - iOS-only reminders.
  - iOS-only widgets.
  - Android billing/products/entitlement path unproven.

## Build/QA Findings

- `npm ci`: PASS. Added 530 packages. Warned about React peer resolution inside `expo-widgets` and 10 moderate npm audit vulnerabilities. No fix/upgrade command was run.
- `npm run typecheck`: PASS.
- `npm run check:build52`: PASS. "Build 52 access, onboarding, and locked funnel checks passed."
- `npm run check:iap`: PASS. "IAP config checks passed."
- `npx expo config --type public`: PASS. Confirms SDK `56.0.0`, iOS bundle/build, Android adaptive icon config, and missing Android package.
- `npx expo doctor`: FAIL. Local Expo CLI says `expo doctor` is not supported and to use `npx expo-doctor`.
- `npx expo-doctor`: PASS. 21/21 checks passed. This command temporarily fetched `expo-doctor@1.19.9` through npm.
- `npm run lint`: FAIL, missing script.
- `npm test`: FAIL, missing script.
- `npm run qa`: FAIL, missing script.
- `npm run qa:release`: FAIL, missing script.

## Recommended Implementation Plan

1. Android config/package identity
   - Add `expo.android.package`, confirm Play app naming, remove/justify stray Android permissions, and generate a clean Android prebuild only when implementation begins.
2. Dependency/platform guards
   - Audit all `Platform.OS === "ios"` branches and add Android fallbacks for OCR, reminders, widgets, IAP errors, links, and file import UX.
3. Billing conversion
   - Define Play product IDs, implement Google Play Billing purchase/restore validation through `expo-iap`, and keep entitlement unlock rules as strict as Build 52.
4. Permissions/imports/notifications
   - Implement Android notification scheduling and test PDF/image import on real Android document/photo providers.
5. Widgets/parity decisions
   - Decide whether launch parity requires Android home-screen widgets or whether widgets are a post-launch phase.
6. Android debug build
   - Run Expo Android debug/dev build after config is committed and test paywall, import, storage, deep links, and reminders.
7. Release AAB/signing
   - Configure EAS/Play signing, build AAB, and verify package/version/signing metadata.
8. Play Store metadata
   - Prepare privacy/data-safety answers for local storage, files/photos, notifications, and subscriptions.
