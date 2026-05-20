# Test Results

Commands run:

```bash
npm run typecheck
npm test
npm run lint
npx expo-doctor
git diff --check
xcodebuild -workspace ios/StudyPlannerSyllabusAI.xcworkspace -scheme StudyPlannerSyllabusAI -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/studyplanner-apple-school-dd ARCHS=arm64 ONLY_ACTIVE_ARCH=NO EXCLUDED_ARCHS='' COMPILER_INDEX_STORE_ENABLE=NO build
```

Results:
- TypeScript: passed
- Release QA suite: passed
- Golden scenarios: passed
- IAP config guard: passed
- Release docs guard: passed
- Web export: passed
- Expo Doctor: 18/18 passed
- Native arm64 simulator build: passed
- Real simulator screenshots: captured
