# Build 21 Risk Fix + TestFlight Notes

## Risk addressed
The previous highest-risk blocker was native iOS simulator rebuild failure on Apple Silicon caused by `@react-native-ml-kit/text-recognition` pulling MLKit/MLImage pods whose arm64 slice linked as device iOS instead of arm64 simulator.

## Change
Removed the MLKit native dependency from the app bundle. Photo syllabus scanning now requires the online parser path; local/offline import remains available for typed text, plain text files, and text-based PDFs.

Why this is the highest-leverage fix:
- Restores deterministic arm64 simulator builds on Apple Silicon.
- Reduces native dependency/build risk before TestFlight.
- Preserves planner integrity, WidgetKit, IAP, and App Review-safe behavior.
- Avoids shipping a fragile native OCR stack that blocks QA.

## Validation
- `npm run lint` passed.
- `npm test` / `npm run qa:release` passed.
- `npx expo-doctor` passed.
- `git diff --check` passed.
- Native arm64 iOS simulator build passed via `xcodebuild`.
- Native app installed and launched on simulator.
- Real simulator screenshots captured under `qa-screenshots/2026-05-20-build21-risk-fix/`.

## Build
- Version: `1.0.2`
- iOS build number: `21`
