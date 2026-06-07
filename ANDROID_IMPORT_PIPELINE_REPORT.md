# Android Import Pipeline Report - Sprint 001

## Existing Import Surface

- PDF import: `src/pdfImport.ts`
  - `expo-document-picker`
  - `expo-file-system`
  - local PDF text extraction from base64 through `src/pdfText.ts`
- Image import: `App.tsx` scan screen
  - `expo-image-picker`
  - camera and media-library launch paths
- OCR: `src/imageTextRecognition.ts`
  - local Expo module `studyplanner-vision-ocr`
  - Apple-only module config
  - iOS Vision framework dependency
- Syllabus parsing: `src/ai.ts`
  - deterministic local parser.
- Notes parsing: `src/ai.ts`
  - deterministic local parser.
- Review flow: `ReviewImport` screen in `App.tsx`.

## Android Compatibility Findings

- PDF imports are Android-compatible at the Expo API level:
  - `DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true })`
  - `FileSystem.readAsStringAsync(...Base64)`
- Syllabus parsing is platform-neutral TypeScript.
- Notes parsing is platform-neutral TypeScript.
- Camera/photo selection is Android-compatible through `expo-image-picker`.
- On-device image OCR is not Android-compatible yet:
  - `modules/studyplanner-vision-ocr/expo-module.config.json` declares only `"platforms": ["apple"]`.
  - `hasNativeImageTextRecognition()` is true only on iOS.

## Implemented

- Android camera/photo selection remains available.
- If Android user selects or captures an image, the flow now routes to the existing paste/review fallback instead of throwing the iPhone OCR error.
- Scan status now explicitly states:
  - Android supports camera, photos, PDF, and paste.
  - Android image OCR falls back to paste review in this build.
- PDF import flow remains unchanged and available.
- Existing review-before-save behavior is preserved.
- No parser behavior was changed.
- No import UX redesign was introduced.

## Permissions

- `android.permission.CAMERA` for camera scan.
- `android.permission.READ_MEDIA_IMAGES` for image selection.
- Document picker uses Android system file picker and generated manifest includes read permissions for pre-Android-13 storage compatibility.

## Remaining Blockers

- True Android image OCR requires a native Android OCR implementation, likely ML Kit Text Recognition or Android-native OCR module work.
- Real Android device validation is still required for:
  - PDF picker URI handling.
  - Base64 read performance on large PDFs.
  - Camera capture URI handling.
  - Photo picker limited-access behavior.
- Android OCR should not be treated as complete until text extraction from camera/photo works without paste fallback.

## Commands

- `npm run typecheck`: PASS.
- `npm run check:build52`: PASS.
- `npx expo-doctor`: PASS.
- Android runtime test: blocked by missing Android SDK/emulator on this machine.
