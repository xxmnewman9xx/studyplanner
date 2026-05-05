# AI Parse Contract

The app posts PDF/photo uploads to `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT`. The endpoint should perform OCR, extract structured dates, and return the contract below.

## Request

```json
{
  "source": {
    "kind": "pdf",
    "uri": "file-or-upload-url",
    "name": "BIO 101 syllabus.pdf"
  },
  "studentContext": {
    "timezone": "America/New_York",
    "schoolLevel": "college",
    "semesterHint": "Fall 2026"
  }
}
```

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
2. OCR or PDF text extraction.
3. Document chunking by headings, tables, and calendar sections.
4. Structured LLM extraction with schema validation.
5. Date normalization in the student's timezone.
6. Deterministic cleanup and confidence flags.
7. Return JSON for editable review.
