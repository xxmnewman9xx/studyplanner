# AI Parse Contract

The app can post text-based PDFs to `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT` when that HTTPS endpoint is configured. Pasted text parses locally in the app before endpoint routing. Text-based PDFs/plain-text files parse locally when no endpoint is configured, and use the endpoint first when one is configured.

Photo/camera support is a separate capability. The app only exposes image import when both `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT` and `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1` are present. This repo does not contain a local image OCR implementation.

## Client Request

The current mobile client sends `multipart/form-data` for endpoint-backed file parsing. Photo/image sources require the image flag and real OCR support:

```text
kind=pdf|photo
file=<uploaded PDF/image>
```

The deploy-ready server handler in `server/syllabus-parser/handler.ts` also accepts JSON/plain-text for direct server tests and non-mobile integrations:

```json
{
  "sourceName": "BIO 101 syllabus",
  "text": "BIO 101 Fall 2026\nLab Report due September 12, 2026"
}
```

The endpoint must infer timezone/date context from the document or server defaults until the client is extended to send `studentContext`.

## Response

```json
{
  "sourceName": "BIO 101 syllabus.pdf",
  "semesterName": "Fall 2026",
  "semesterStartDate": "2026-08-24",
  "semesterEndDate": "2026-12-11",
  "courses": [
    {
      "id": "bio-101",
      "code": "BIO 101",
      "name": "Intro Biology",
      "instructor": "Dr. Nguyen",
      "color": "#7FA184",
      "meetings": [
        {
          "id": "bio-mon",
          "day": "Mon",
          "startTime": "09:00",
          "endTime": "10:15",
          "location": "Science 204"
        }
      ],
      "gradeCategories": [
        {
          "id": "bio-exams",
          "name": "Exams",
          "weight": 45
        }
      ]
    }
  ],
  "assignments": [
    {
      "id": "bio-exam-1",
      "courseId": "bio-101",
      "title": "Exam 1: cells and genetics",
      "kind": "exam",
      "dueAt": "2026-09-18T09:00:00-04:00",
      "tags": ["exam", "study"],
      "priority": "high",
      "estimatedMinutes": 240,
      "status": "not_started",
      "source": "syllabus",
      "gradeWeight": 15
    }
  ],
  "gradeItems": [],
  "findings": [
    {
      "id": "ambiguous-date-1",
      "severity": "needs_review",
      "message": "Date appears as 'week 4'; review before applying."
    }
  ]
}
```

## Parser Rules

- Never apply parse output silently.
- Preserve original dates with timezone-aware ISO strings.
- Mark ambiguous, relative, missing-year, or conflicting dates as `needs_review`.
- Prefer assignments and exams over decorative syllabus details.
- Extract grade categories only when weights are explicit.
- Do not infer protected student data.
- Keep a source reference internally so the review UI can later show snippets or page numbers.

## Production Endpoint Shape

Recommended route:

```text
POST /api/syllabus/parse
```

Recommended backend stages:

1. Upload and virus scan.
2. PDF/plain-text extraction. Image OCR must be explicitly configured before enabling photo claims.
3. Document chunking by headings, tables, and calendar sections.
4. Structured LLM extraction with schema validation.
5. Date normalization in the student's timezone.
6. Deterministic cleanup and confidence flags.
7. Return JSON for editable review.
