# Validation Report

Date: 2026-05-25

## Commands

| Command | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run check:iap` | Pass |
| `npm run test:widgets` | Pass |
| `npm run check:scenarios` | Pass |
| `npm run test:parser` | Pass |
| `npm run test:parser-endpoint` | Pass |
| `npm run check:release-docs` | Pass |
| `npm run test:backend-platform` | Pass |
| `npx expo run:ios --configuration Release --device "StudyPlanner-QA-iPhone"` | Pass: Release simulator build succeeded with 0 errors and 2 simulator signing/strip warnings |

## Smoke Note

Port 8081 was already occupied by another local Expo project, so Expo printed a non-interactive port prompt and skipped starting a new dev server. The Release build still bundled, installed, and launched on `StudyPlanner-QA-iPhone`.
