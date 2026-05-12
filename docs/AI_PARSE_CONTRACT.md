# AI Parse Contract

Status: Current app contract as of 2026-05-12.  
Branch: `v1-3-post-goal-aso-submission-master`

StudyPlanner can parse text locally from text-based syllabus files. Photo/OCR parsing is available only when `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT` is configured and tested. The endpoint must return reviewable work; nothing should become trusted planner data until the student accepts it.

## Current Request Shape

The app sends a multipart upload, not JSON.

```http
POST <EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT>
Content-Type: multipart/form-data

kind=<pdf|photo|text>
file=<uploaded file>
```

Current code evidence:

- `src/services/syllabusParser.ts` builds `FormData`.
- `src/services/syllabusParser.ts` sends `kind` and `file`.
- Text/PDF local parsing remains available without an endpoint.
- Image/photo parsing returns a clear unavailable error when no endpoint is configured.

## Response Shape

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
      "meetings": [],
      "gradeCategories": []
    }
  ],
  "assignments": [
    {
      "id": "bio-exam-1",
      "courseId": "bio-101",
      "courseName": "Intro Biology",
      "title": "Exam 1",
      "kind": "exam",
      "type": "exam",
      "dueAt": "2026-09-18T09:00:00",
      "sourceText": "Exam 1 - Sep 18",
      "confidence": 0.9,
      "reviewStatus": "needsReview",
      "completionStatus": "open",
      "reminderPreset": "week_before",
      "createdAt": "2026-08-24T12:00:00.000Z",
      "updatedAt": "2026-08-24T12:00:00.000Z",
      "tags": ["exam"],
      "priority": "high",
      "estimatedMinutes": 120,
      "status": "not_started",
      "source": "syllabus"
    }
  ],
  "gradeItems": [],
  "findings": [
    {
      "id": "ambiguous-date-1",
      "severity": "needs_review",
      "message": "Date appears as 'week 4'; review before adding."
    }
  ]
}
```

`gradeItems` should be present as an array. If a backend cannot produce grades, return `[]`.

## Trust Rules

- Endpoint assignments must start as `reviewStatus: "needsReview"` unless the app deliberately accepts them after user review.
- Current app trust code only imports accepted assignments and related courses/grade items.
- Parser-provided semester name/start/end dates are **not** trusted into the planner in this branch.
- Ambiguous, missing, conflicting, or relative dates should be reported in `findings`.
- The current model cannot import no-date work as first-class assignment rows because `Assignment.dueAt` is required. Future work should add a `FoundWorkDraft` layer for `ready`, `no_date`, `ambiguous_date`, `duplicate`, `invalid`, `ignored`, and `accepted`.

## Parser Rules

- Never apply parse output silently.
- Prefer exact source snippets in `sourceText`.
- Do not infer protected student data.
- Do not claim perfect extraction.
- Keep photo/OCR copy conditional on endpoint availability.
- Preserve due times when present. Use `23:59` only when the syllabus gives a date but no time.
- Avoid accepting non-US numeric dates unless the date is unambiguous or the locale is known.

## Submission Notes

Before App Review, provide:

- Whether `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT` is enabled.
- What file types are supported in the submitted build.
- A safe sample text-based PDF or text file.
- Confirmation that photo/OCR claims are hidden or enabled and tested.
- A timeout/failure state screenshot.
- A no-date/ambiguous-date behavior explanation.
