# Study Planner iOS 2.1.0 (82) Release Lock

Date: 2026-09-01

Machine-readable manifest: `docs/STUDYPLANNER_IOS_2.1.0_BUILD_82_RELEASE_MANIFEST_2026-09-01.json`

## Locked identity

- App Store Connect app: `6766181202`
- Bundle ID: `com.mattnewman.studyplanner`
- Marketing version: `2.1.0`
- Required next build: `82`
- Apple Team: `5JN35MJ3QD`
- Version source: local
- EAS auto-increment: disabled
- Android versionCode: remains `80`; this lock does not authorize an Android upload

Build 82 is the minimum valid retry after rejected build 81. The app, WidgetKit extension, Watch app, and Watch widgets must all embed `2.1.0 (82)`.

## Exact commands

No-cost local native release build:

```bash
xcodebuild -workspace ios/StudyplannerSyllabusAI.xcworkspace -scheme StudyplannerSyllabusAI -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

Paid production build—run only after human approval and an immutable release commit exists:

```bash
npx eas-cli@latest build --platform ios --profile production --non-interactive
```

Submit the exact inspected build; never use `--latest`:

```bash
npx eas-cli@latest submit --platform ios --profile production --id <EAS_BUILD_ID> --non-interactive
```

Push the checked metadata only after App Store Connect readback and human approval:

```bash
npx eas-cli@latest metadata:push
```

## Locale and metadata lock

All 17 app locales have matching App Store metadata entries: Arabic, German, five English/Spanish/French regional entries, Hindi, Japanese, Korean, Brazilian and European Portuguese, and Simplified/Traditional Chinese. Every entry has the same required field set, valid title/subtitle/promo/description/keyword lengths, direct privacy/support URLs, and resolvable iPhone/iPad screenshot paths.

The U.S. subscription contract is:

- Weekly `com.mattnewman.studyplanner.plus.weekly`: eligible customers pay $0.99 for the first `P1W`, then $6.99/week.
- Monthly `com.mattnewman.studyplanner.plus.monthly`: $14.99/month, no introductory offer.
- Yearly `com.mattnewman.studyplanner.plus.yearly`: $39.99/year, no introductory offer.

Production UI remains StoreKit-localized and does not hardcode those U.S. prices. Only Weekly may surface the paid introductory offer, and only after StoreKit reports both the offer and customer eligibility.

## Required artifact inspection

After EAS finishes, record its immutable build ID and artifact URL in the JSON manifest, download the IPA, calculate SHA-256, and inspect the parent app plus every embedded extension. All must report version `2.1.0`, build `82`, expected bundle identifiers, App Group entitlements, and privacy manifests. Then confirm App Store Connect processed that exact build under version 2.1.0 before selecting it.

## Verification results

Passed locally:

- Expo SDK dependency compatibility after updating eight packages to Expo’s recommended SDK 56 patch versions.
- TypeScript typecheck.
- Full `qa:release` aggregate suite, including activation, semester ownership, runtime safety, release documentation, iOS privacy, and Build 82 access/onboarding/paywall gates.
- IAP contract, localization, metadata parity/limits, JSON/plist parsing, and diff-whitespace checks.
- Hermes iOS production export: one 6 MB bundle plus declared app asset.

The unsigned native Release command is correct but did not complete on this host. Its first attempt found missing CocoaPods support files; CocoaPods then stopped during dependency reconciliation because the host volume was at 100% capacity with about 149 MiB free. No user assets were deleted to work around that environmental constraint.

`npm audit --omit=dev` retains four high-severity `image-size` denial-of-service advisories inherited through Metro build tooling and moderate `uuid` findings in Expo’s Xcode configuration tooling. A non-forced audit pass removed the fixable `shell-quote` issue. The remaining automated recommendation would force a breaking Expo downgrade, so it is explicitly rejected for this release lock.

## Score

- Source/configuration/metadata lock: **9.3/10**.
- Verified local release readiness: **8.9/10** because the native Release build could not complete on the disk-full host.
- Submission readiness: **8.6/10** until immutable source, paid build, artifact inspection, sandbox billing, and live App Store Connect verification exist.

## External blockers

- The current workspace is heavily dirty and not an immutable release snapshot. A human must approve and capture the exact release source in a commit before the paid build.
- The build host needs sufficient free disk for `pod install`/native Release verification; about 149 MiB was available during this audit.
- Live App Store Connect pricing, subscription-group membership, cleared-for-sale status, localizations, and the Weekly-only paid introductory offer require readback.
- Eligible/ineligible Weekly, Monthly, Yearly, restore, pending, renewal, expiry, refund, and revocation flows require sandbox/device verification on the uploaded build.
- The exact EAS build ID, IPA SHA-256, embedded-bundle inspection, processing status, and build selection do not exist until the paid build is authorized.
- Historical Build 80 media-provenance gates remain separate nomination evidence and must not be presented as Build 82 binary provenance.
