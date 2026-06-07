# StudyPlanner Google Play Internal Testing Upload Packet

Date: 2026-06-07

## Upload Candidate

| Item | Value |
| --- | --- |
| App name | `Studyplanner: Syllabus AI` |
| Package name | `com.mattnewman.studyplanner` |
| Version name | `1.0.3` |
| Version code | `52` |
| Build profile | `production` |
| Build ID | `e342624f-9f34-44b1-a98f-960f141a4fd2` |
| Build page | `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/builds/e342624f-9f34-44b1-a98f-960f141a4fd2` |
| EAS artifact URL | `https://expo.dev/artifacts/eas/u4DL4BfXL7se8A2859hkbA.aab` |
| Local AAB path | `C:\FounderWorker\outputs\StudyPlanner\StudyPlanner-android-internal-v52-eas-signed.aab` |
| Local AAB SHA-256 | `E791908274B0692555D9784BD1AA531C4AE7EDF82278CA95BC493191A1560C03` |
| Upload readiness | Ready for Google Play internal testing upload, pending Play Console app setup |

Use the local AAB path above for manual upload. Do not use the local Gradle AAB under `android\app\build\outputs\bundle\release`.

## Release

Recommended release name:

```text
StudyPlanner Android internal 52
```

Release notes:

```text
Internal Android testing build for StudyPlanner AI versionCode 52.

Focus areas:
- Onboarding and locked funnel
- Paywall and Google Play subscription restore/manage paths
- PDF, image, camera, and manual paste import paths
- OCR/syllabus parsing review flow
- Notification permission and reminder scheduling paths
- Today/dashboard load and close/reopen stability
```

## Tester Group Setup

1. In Play Console, open `Testing > Internal testing > Testers`.
2. Create an email list or select an existing Google Group.
3. Add only approved tester Google accounts.
4. Save the tester list.
5. Copy the internal testing opt-in link after the release is available.
6. Send testers:
   - Opt-in link
   - Google account they must use
   - Install instructions
   - Smoke-test checklist
   - Feedback channel

Tester install instructions:

1. Open the opt-in link on an Android device.
2. Sign in with the tester-listed Google account.
3. Accept the internal test.
4. Install from Google Play.
5. Launch `Studyplanner: Syllabus AI`.

## Subscriptions/Product Setup Checklist

Create these subscription product IDs before purchase-flow testing:

- `com.mattnewman.studyplanner.plus.monthly`
- `com.mattnewman.studyplanner.plus.yearly`

Play Console steps:

1. Open `Monetize > Products > Subscriptions`.
2. Create each product ID exactly.
3. Add active base plans.
4. Add pricing.
5. Activate products.
6. Add license testers if using test purchases.
7. Install the app from Play internal testing before testing purchases.

## Data Safety Checklist

Confirm declarations for:

- Account/login or account state if enabled during testing
- Course/class planner data
- Assignments, exams, notes, and study progress
- Imported files/images used for OCR
- Camera/photos permission for syllabus scanning
- Notifications/reminders
- Purchase/subscription status
- Diagnostics/crash logs if collected by platform tooling
- Data deletion/support contact process

## Privacy Policy

No committed public privacy-policy URL was found in `app.json`.

Use this placeholder until the final URL is confirmed:

```text
<PRIVACY_POLICY_URL>
```

Do not submit for review until the Play Console privacy policy field points to the real StudyPlanner privacy policy.

## Manual Play Console Upload Steps

1. Open Google Play Console.
2. Create or open the app for package `com.mattnewman.studyplanner`.
3. Enable Play App Signing if prompted.
4. Complete app setup tasks required before testing:
   - App access
   - Ads declaration
   - Content rating
   - Target audience
   - Data safety
   - Privacy policy
   - Main store listing
5. Open `Testing > Internal testing`.
6. Select or create the internal tester list.
7. Create a new release.
8. Upload:

```text
C:\FounderWorker\outputs\StudyPlanner\StudyPlanner-android-internal-v52-eas-signed.aab
```

9. Confirm Play Console reads:
   - Package: `com.mattnewman.studyplanner`
   - Version code: `52`
10. Enter release name:

```text
StudyPlanner Android internal 52
```

11. Paste release notes from this packet.
12. Save and review the release.
13. Roll out only to internal testing.
14. Copy the tester opt-in link.
15. Do not submit to production, promote tracks, or merge Android branch during this sprint.

## Post-Upload Smoke Test

After the release is available to testers:

1. Install from the Play internal testing opt-in link.
2. Launch from the app icon.
3. Confirm onboarding loads.
4. Confirm paywall loads.
5. Confirm Android restore/manage path is visible.
6. Confirm import screen opens.
7. Confirm photo/camera import path opens or fails gracefully.
8. Confirm manual paste fallback works.
9. Confirm notification permission path does not crash.
10. Confirm Today/dashboard loads.
11. Close and reopen the app.
12. Capture `adb logcat` if any crash or purchase issue occurs.
