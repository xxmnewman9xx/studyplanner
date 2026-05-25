# TestFlight Upload Receipt

Date: 2026-05-25

## Build

- IPA: `builds/StudyPlanner-1.0.2-b24.ipa`
- SHA-256: `a2b0643b113742248499cd3e3a276fe6841c5b13d1ff1638575821b8b1909a2d`
- Version: `1.0.2`
- Build: `24`
- Bundle: `com.mattnewman.studyplanner`
- Widget extension: `com.mattnewman.studyplanner.widgets`
- Local build log: `qa-screenshots/2026-05-25-final-release-cycle/testflight/eas-local-build-b24.log`

## Upload

- Command:
  `eas submit --platform ios --profile production --path builds/StudyPlanner-1.0.2-b24.ipa --non-interactive`
- ASC App ID: `6766181202`
- App Store Connect API key ID used by EAS Submit: `HDR783736G`
- EAS submission URL: `https://expo.dev/accounts/xxmnewman9xx/projects/study-planner-syllabus-ai/submissions/d514a9e2-0ea1-461c-9372-afed86b8944c`
- App Store Connect TestFlight URL: `https://appstoreconnect.apple.com/apps/6766181202/testflight/ios`
- Upload log: `qa-screenshots/2026-05-25-final-release-cycle/testflight/eas-submit-b24.log`

## Result

The upload log reports:

- `Submitted your app to Apple App Store Connect`
- `Your binary has been successfully uploaded to App Store Connect`

Apple processing continues server-side after upload. Build 23 was uploaded before the final launch-state commit; build 24 is the uploaded binary for the stabilized release state.
