# Scanner Photo Proof

Date: 2026-05-26 02:06 EDT / 2026-05-26 06:06 UTC

## Implemented

- Camera/photo scanner remains in `src/screens/ImportScreen.tsx`.
- Native camera and photo permissions are present in `app.json`.
- Photo imports are still gated by both:
  - `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT`
  - `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`
- Production EAS now has `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1`.
- Fresh native `Release` build `28` was built with image parsing enabled and the production parser endpoint configured.
- Native env inlining bug fixed in `src/services/syllabusParser.ts`: Release bundles now reference explicit `process.env.EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT` and `process.env.EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED` keys instead of dynamic `process.env[name]` access.

## OCR Proof

Railway parser deployment:

```text
96f1fe35-2f55-4487-8b91-192eea973233 | SUCCESS
```

Production endpoint:

```text
https://studyplanner-parser-production.up.railway.app/api/syllabus/parse
```

Smoke input was a generated syllabus PNG containing:

```text
BIO 101 Fall 2026
Lab Report due September 12, 2026
Final Exam December 10, 2026
```

Production response: HTTP `200`, parsed reviewable work:

- `Lab Report` due `2026-09-12T23:59:00`
- `Final Exam` due `2026-12-10T09:00:00`

## Review Cards

The app path is:

```text
ImportScreen pickPhoto/capturePhoto -> parseSyllabus -> production multipart endpoint -> normalizeParseResult -> draft review cards
```

The parser response contains real `assignments[]` objects with titles, due dates, kind, confidence, and review findings. Those are exactly the objects rendered as editable review cards by `ImportScreen`.

## Native Photo Picker Proof

Build:

```text
Release iphonesimulator build from source after the env inlining fix
Simulator: StudyPlanner-QA-iPhone, iOS 26.5
Bundle id: com.mattnewman.studyplanner
QA capture flag: EXPO_PUBLIC_SIM_QA_CAPTURE=1
Parser endpoint: https://studyplanner-parser-production.up.railway.app/api/syllabus/parse
Image parsing flag: EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1
```

Fixture added to the simulator photo library:

```text
docs/launch/2026-05-26/fresh-native-screenshots/photo-rescue/native-photo-syllabus-fixture.png
```

Native proof screenshots:

- `docs/launch/2026-05-26/fresh-native-screenshots/photo-rescue/01-scan-image-enabled.png` shows Camera and Photo enabled in the native Release simulator build.
- `docs/launch/2026-05-26/fresh-native-screenshots/photo-rescue/02-photo-to-review-created.png` shows "Review work", `2 found`, `1 Assignments`, `1 Exams`, and `2 Valid dates` after selecting the photo.
- `docs/launch/2026-05-26/fresh-native-screenshots/photo-rescue/03-lab-report-review-card.png` shows editable `Lab Report` review card with `SYL 101` and due date `2026-09-12`.
- `docs/launch/2026-05-26/fresh-native-screenshots/photo-rescue/04-final-exam-review-card.png` shows editable `Final Exam` review card with `SYL 101` and due date `2026-12-10`.
- `docs/launch/2026-05-26/fresh-native-screenshots/photo-rescue/05-reviewed-items-added-to-today.png` shows the reviewed photo-derived items applied to Today, including `SYL 101 · Final Exam`.

Camera permission and photo picker UI need a fresh native device/TestFlight pass because simulator camera capture is not equivalent to camera permission on hardware. Release upload stays blocked unless this is captured from a processed build with image parsing enabled.

Current status: saved-photo import to review cards is proven in a fresh native Release simulator build against the production parser. Physical camera capture and real-device camera permission remain unproven until a TestFlight or device pass.
