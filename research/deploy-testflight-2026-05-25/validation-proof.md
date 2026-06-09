# Validation Proof

Date: 2026-05-25

## Passed

- `npm run typecheck`
- `npm run check:iap`
- `npm run test:widgets`
- `npm run check:scenarios`
- `npm run test:parser`
- `npm run test:parser-endpoint`
- `npm run test:backend-platform`
- `npm run check:release-docs`

## Native Release Simulator Smoke

Command:

```sh
npx expo run:ios --configuration Release --device "StudyPlanner-QA-iPhone"
```

Result:

- Release bundle built successfully.
- App installed on `StudyPlanner-QA-iPhone`.
- App launched as `com.mattnewman.studyplanner`.
- Build output reported `0 error(s), and 2 warning(s)`.
- Warnings were simulator signing/strip warnings for the widget extension binaries, not app launch failures.

## Not Run Because Deployment Was Blocked

- External HTTPS parser endpoint smoke test.
- External purchase validation endpoint smoke test.
- New signed production IPA build for TestFlight.
- New TestFlight upload.
- Sandbox purchase proof.
- Restore proof.
