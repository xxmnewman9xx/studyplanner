# Build 48 Signing Audit

## Status
Signing root cause identified. Config-driven signing fix planned.

## Confirmed Metadata
- app bundle: `com.mattnewman.studyplanner`
- widget bundle: `com.mattnewman.studyplanner.widgets`
- App Group: `group.com.mattnewman.studyplanner`
- URL scheme: `studyplanner`
- version: `1.0.3`
- build number: `48`
- EAS project: `@xxmnewman9xx/study-planner-syllabus-ai`
- ASC app ID: `6766181202`

## Root Cause
The generated iOS Xcode project had no `DEVELOPMENT_TEAM` setting on the app target or widget extension target.

Release archive failed with:

- `Signing for "ExpoWidgetsTarget" requires a development team.`
- `Signing for "StudyplannerSyllabusAI" requires a development team.`

## Affected Config Files
- `app.json`
- `ios/StudyplannerSyllabusAI.xcodeproj/project.pbxproj` after prebuild
- `ios/StudyplannerSyllabusAI/StudyplannerSyllabusAI.entitlements`
- `ios/ExpoWidgetsTarget/ExpoWidgetsTarget.entitlements`
- `eas.json`

## Apple Team ID
Required Apple Developer Team ID: `5JN35MJ3QD`

Evidence:

- existing local App Store provisioning profile for `com.mattnewman.studyplanner` uses Team Identifier `5JN35MJ3QD`.
- prior EAS production iOS builds for this app succeeded under the same Expo project.

Local keychain also contains an Apple Development identity for `9NT94FQ9JN`, but that does not match the existing App Store provisioning profile and is not the correct release-team source for this app.

## Fix Plan
1. Add `expo.ios.appleTeamId = "5JN35MJ3QD"` to `app.json`.
2. Run Expo prebuild so the generated iOS project receives `DEVELOPMENT_TEAM` on all native targets.
3. Verify both `StudyplannerSyllabusAI` and `ExpoWidgetsTarget` target build settings include the team.
4. Re-run Build 48 validation commands.
5. Build a production iOS archive through EAS cloud if quota allows.
6. Submit the resulting IPA to TestFlight only after the production build succeeds.

## Risks
- Local Xcode archive may still fail if matching distribution certificates/profiles for both app and widget are not installed locally.
- Widget extension requires a separate bundle ID/provisioning profile and App Group entitlement.
- Running `expo prebuild` regenerates iOS project files; product code must remain untouched.
- If EAS credentials do not include the widget extension profile, cloud build may require credential repair before submission.
