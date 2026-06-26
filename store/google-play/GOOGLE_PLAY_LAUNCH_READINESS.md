# Google Play Launch Readiness

Date: 2026-06-26
App: Study Planner AI
Package: `com.mattnewman.studyplanner`
Current Android release: `versionCode` 73, app version `2.0.4`

## Latest readiness pass

Completed on 2026-06-26.

Green checks:

- Play Console upload package revalidated for all 18 locale folders.
- Phone screenshots revalidated as 8 per locale, `1080x1920`, 24-bit PNG.
- Feature graphics revalidated as `1024x500`, 24-bit PNG.
- Metadata revalidated against Play limits.
- `npx expo config --json` resolves Android `versionCode` 73 and app version `2.0.4`.
- Native Android `android/app/build.gradle` also has `versionCode 73` and `versionName "2.0.4"`.
- Native Android manifest removes `android.permission.RECORD_AUDIO` with `tools:node="remove"` while keeping camera and billing permissions.
- `npx expo install --check` passes.
- `npx expo-doctor` passes 21/21 checks.
- `npm run typecheck` passes.
- `npm run check:iap` passes.
- `npm run check:localization` passes.
- `npm run test:hard-paywall` passes.
- Active Android subscription purchases now include Google Play Billing subscription offer tokens from `fetchProducts`.

Local improvements applied:

- Aligned Expo SDK 56 patch dependencies with Expo's expected versions.
- Removed the duplicate `react-dom` tree reported by Expo Doctor.
- Applied safe `npm audit fix`, removing the `esbuild` advisory.
- Hardened the active IAP helper so Android subscription purchases cache/refetch the Play offer token and fail closed if Play does not return an active subscription offer.

Known remaining local gaps:

- `npm run qa:release` passes activation spine and semester ownership checks, then fails because `ios/StudyPlannerSyllabusAI.xcodeproj/project.pbxproj` is not present in this workspace.
- `npm run check:build52` fails for the same missing local iOS project file.
- `npm audit --audit-level=moderate` still reports a moderate `uuid` advisory through Expo CLI's `xcode` dependency. The automated fix requires `npm audit fix --force`, which would install an old breaking Expo version, so it was not applied.
- This workstation cannot build Android locally yet: Java is installed, but Android SDK tooling and `android/local.properties` are missing.
- EAS read-only build list did not show a successful Android build 72 before the build 73 bump. The newest Android EAS entry returned was an errored build 65 from 2026-06-15. If build 72 is the Play Console latest release, verify it directly in Play Console before rollout.
- Build 73 EAS attempt was blocked by Expo account build credits: the account has used 100% of included monthly build credits and EAS reported reset on 2026-07-01. No build 73 AAB was produced from that attempt.

## Ready locally

- Current reduced Play assets were backed up to `store/google-play/backups/pre-full-localized-restore-20260625-231832/`.
- Restored localized phone screenshots in `store/google-play/listings/<locale>/graphics/phone-screenshots/`.
- Prepared a Play Console upload package at `store/google-play/play-console-upload-20260626-032331/`.
- Added metadata files for every locale: `title.txt`, `short-description.txt`, `full-description.txt`.
- Added a compliant fallback feature graphic for every upload locale: `graphics/feature-graphic.png`.
- English visual QA contact sheet: `store/google-play/contact-sheet-restored-en-US.png`.
- Validation reports:
  - `store/google-play/localized-phone-screenshot-validation.json`
  - `store/google-play/google-play-metadata-validation.json`
  - `store/google-play/play-console-locale-map.json`

## Play Console upload package

Upload from `store/google-play/play-console-upload-20260626-032331/<play-locale>/`.

Each locale folder contains:

- `metadata/title.txt`
- `metadata/short-description.txt`
- `metadata/full-description.txt`
- `graphics/feature-graphic.png`
- `graphics/phone-screenshots/01-scan-anything.png`
- `graphics/phone-screenshots/02-scan-syllabus.png`
- `graphics/phone-screenshots/03-semester-health.png`
- `graphics/phone-screenshots/04-plan-autopilot.png`
- `graphics/phone-screenshots/05-manage-semester.png`
- `graphics/phone-screenshots/06-class-detail.png`
- `graphics/phone-screenshots/07-notes.png`
- `graphics/phone-screenshots/08-focus.png`

Prepared Play Console locale folders:

`ar`, `de-DE`, `en-AU`, `en-CA`, `en-GB`, `en-US`, `es-ES`, `es-MX`, `fr-CA`, `fr-FR`, `hi-IN`, `ja-JP`, `ko-KR`, `pt-BR`, `pt-PT`, `zh-CN`, `zh-HK`, `zh-TW`.

## Validation

- Phone screenshots: exactly 8 per locale, `1080x1920`, 24-bit PNG, compliant Play aspect ratio.
- Feature graphics: exactly `1024x500`, 24-bit PNG.
- App titles: all <= 30 characters.
- Short descriptions: all <= 80 characters.
- Full descriptions: all <= 4000 characters.
- Copy avoids ranking claims, price/promo claims, unsupported LMS integrations, and install/download calls to action.

## Console steps still required

1. In Play Console, update the main store listing/default locale first, then each localized listing.
2. For every locale, paste title, short description, and full description from the package.
3. Replace phone screenshots with the ordered 01-08 PNGs.
4. Upload the locale feature graphic only if the current console feature graphic is missing or weaker than the new fallback.
5. Preserve any existing tablet screenshots unless there is a clear quality issue; this package restores phone assets only.
6. Save listing changes and verify every locale preview shows the expected ordered screenshots.

## IAP launch proof still required

Local code is wired for native `expo-iap`, exact StudyPlanner subscription product IDs, purchase listeners, transaction finishing, active-subscription entitlement refresh, restore purchases, and hard paywall gating. Static checks pass after the Android offer-token fix.

Before rollout, verify in Play Console and on a real Android device:

1. `com.mattnewman.studyplanner.plus.weekly`, `com.mattnewman.studyplanner.plus.monthly`, and `com.mattnewman.studyplanner.plus.yearly` exist under package `com.mattnewman.studyplanner`.
2. Each subscription has an active auto-renewing base plan, active regional pricing, and at least one active offer/base-plan purchase option that returns an offer token.
3. License testers are configured, build 73 is available through the intended internal/closed test track, and the tester installed the app from Google Play.
4. Test purchase opens the Google Play sheet, completes with a test payment method, unlocks StudyPlanner, persists after force close/reopen, and restore purchases works after reinstall.
5. Cancellation/expired-account behavior removes access after the store no longer reports an active subscription.

## A/B testing

Yes, Store listing experiments are available, but do not let an experiment block the ASAP submission.

Recommended launch sequence:

1. Restore and save the complete base listing first.
2. Submit the app/release for review.
3. Start one experiment after the base listing is stable.
4. First experiment: first screenshot or feature graphic only.
5. Run at least one week before applying a winner.

## Launch blockers to clear

- Use the latest Android release/build 73. Older build 69 notes in this folder are historical and should not drive the submission.
- Do not submit stale successful Android builds from earlier release work.
- Confirm in Play Console that build 73 is uploaded to the intended track and is the artifact being submitted or rolled out.
- Prior EAS build access was documented as blocked by monthly credit exhaustion; current EAS build history visible from this workspace did not show a successful build 72 before preparing build 73.
- Current EAS build access is still blocked by monthly credit exhaustion. Upgrade the Expo plan or wait for the 2026-07-01 reset, then run the build 73 command again.
- Current local Android build is blocked by missing Android SDK configuration.
- Before production rollout, complete a fresh internal test install and verify import review, subscriptions, restore purchases, reminders/calendar, privacy/support links, and data safety answers.
