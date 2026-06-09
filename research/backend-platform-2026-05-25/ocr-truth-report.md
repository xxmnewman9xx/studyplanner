# OCR Truth Report

Current truth:

- Pasted text parses locally.
- Plain-text files parse locally.
- Text-based PDFs can parse locally through embedded text extraction.
- Remote parser endpoint can parse file uploads when configured.
- Photo/camera import is hidden unless endpoint plus `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1` are configured.
- There is no local native OCR fallback in this repo.

Code enforcing truth:

- `src/services/syllabusParser.ts` gates image parsing on endpoint + image flag.
- `src/screens/ImportScreen.tsx` explains that missing image parsing means no local OCR and suggests text PDF/paste fallback.
- `server/syllabus-parser/handler.ts` fails image uploads with `OCR_NOT_CONFIGURED`.

Docs updated:

- `docs/AI_PARSE_CONTRACT.md`
- `docs/APP_REVIEW_NOTES.md`
- `docs/APP_STORE_METADATA.md`
- `docs/PRD.md`
- `docs/PRIVACY_POLICY.md`
