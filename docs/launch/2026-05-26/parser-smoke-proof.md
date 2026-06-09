# Parser Smoke Proof

Date: 2026-05-25 23:50 EDT / 2026-05-26 03:50 UTC
Updated: 2026-05-26 01:38 EDT / 2026-05-26 05:38 UTC
Commit at start of run: `6281b948110cde4187454813a062f610b49c856c`

## Railway

- Project: `StudyPlanner`
- Service: `studyplanner-parser`
- Deployment: `52bd5743-2138-4a9c-b6df-15c30aaa3fa4`
- Status: `SUCCESS`
- Public route: `https://studyplanner-parser-production.up.railway.app`
- Parser endpoint: `https://studyplanner-parser-production.up.railway.app/api/syllabus/parse`
- Build log URL: `https://railway.com/project/fb0fc46c-5828-4a1e-8596-ca9fe6fe7ee1/service/e30cf013-4b5a-4828-853d-156fc3011fbd?id=52bd5743-2138-4a9c-b6df-15c30aaa3fa4&`

## Local Preflight

```sh
npm run build:syllabus-parser
npm run start:syllabus-parser
curl -i -sS http://127.0.0.1:3000/health
curl -i -sS -X POST http://127.0.0.1:3000/api/syllabus/parse \
  -H 'content-type: application/json' \
  --data '{"sourceName":"BIO 101 syllabus","text":"BIO 101 Fall 2026\nLab Report due September 12, 2026\nFinal Exam December 10, 2026"}'
curl -i -sS -X POST http://127.0.0.1:3000/api/syllabus/parse \
  -F kind=photo \
  -F 'file=@assets/app/study-planner-icon.png;type=image/png'
```

Results:

- `/health`: HTTP `200`, `{"ok":true,"service":"studyplanner-syllabus-parser"}`
- JSON syllabus: HTTP `200`, parsed `Lab Report` due `2026-09-12` and `Final Exam` due `2026-12-10`
- Original image upload before OCR: HTTP `422`, error code `OCR_NOT_CONFIGURED`

## Production HTTPS Smoke

```sh
curl -i -sS https://studyplanner-parser-production.up.railway.app/health
curl -i -sS -X POST https://studyplanner-parser-production.up.railway.app/api/syllabus/parse \
  -H 'content-type: application/json' \
  --data '{"sourceName":"BIO 101 syllabus","text":"BIO 101 Fall 2026\nLab Report due September 12, 2026\nFinal Exam December 10, 2026"}'
curl -i -sS -X POST https://studyplanner-parser-production.up.railway.app/api/syllabus/parse \
  -H 'content-type: text/plain' \
  --data 'CHEM 120 Fall 2026
Quiz due October 4, 2026
Final Exam December 9, 2026'
curl -i -sS -X POST https://studyplanner-parser-production.up.railway.app/api/syllabus/parse \
  -F kind=photo \
  -F 'file=@assets/app/study-planner-icon.png;type=image/png'
```

Results:

- Health: HTTP `200`, served by `railway-edge`.
- JSON syllabus: HTTP `200`, parsed `Lab Report` and `Final Exam`.
- Plain text syllabus: HTTP `200`, parsed `Quiz` and `Final Exam`.
- Original image upload before OCR: HTTP `422`, error code `OCR_NOT_CONFIGURED`.
- After OCR deployment `96f1fe35-2f55-4487-8b91-192eea973233`, generated syllabus PNG upload returned HTTP `200` and parsed:
  - `Lab Report` due `2026-09-12T23:59:00`
  - `Final Exam` due `2026-12-10T09:00:00`

## Honesty Notes

- This proves production text parsing, text-based upload routing, and backend image OCR for readable PNG/JPEG-style syllabus images.
- `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED` was changed to `1` only after the successful production image OCR smoke.
