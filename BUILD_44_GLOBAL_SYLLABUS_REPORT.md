# Global Syllabus OCR Locale Stress Report

## Scope
Global syllabus stress test covering every localized App Store app-title locale, multilingual dates, international academic keywords, mixed OCR, tables, repeated headers, and date-order ambiguity.

## Result
PASS

Score: 10/10

| Locale | Scenario | Classes | Assignments app/service | Exams app/service | Review Rows | Narrative | Status |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| en-US | STEM syllabus | 1 | 1/1 | 2/2 | 2 | Attention Needed | PASS |
| en-GB | Module handbook | 1 | 2/2 | 1/1 | 1 | Attention Needed | PASS |
| en-AU | Tutorial outline | 1 | 1/1 | 2/2 | 2 | Attention Needed | PASS |
| en-CA | Course schedule | 1 | 1/1 | 1/1 | 1 | Attention Needed | PASS |
| es-ES | Guía docente | 1 | 1/1 | 1/1 | 2 | Attention Needed | PASS |
| es-MX | Plan de materias | 1 | 1/1 | 1/1 | 3 | Attention Needed | PASS |
| pt-BR | Ementa universitária | 1 | 1/1 | 1/1 | 1 | Attention Needed | PASS |
| pt-PT | Programa da unidade | 1 | 2/2 | 1/1 | 1 | Attention Needed | PASS |
| fr-CA | Plan de cours | 1 | 1/2 | 1/1 | 1 | Attention Needed | PASS |
| fr-FR | Syllabus de TD | 1 | 1/1 | 1/1 | 2 | Attention Needed | PASS |
| de-DE | Seminarplan | 1 | 1/1 | 1/1 | 1 | Attention Needed | PASS |
| ja | シラバス | 1 | 1/1 | 1/1 | 1 | Attention Needed | PASS |
| ko | 강의계획서 | 1 | 1/1 | 1/1 | 2 | Attention Needed | PASS |
| zh-Hans | 课程大纲 | 1 | 1/1 | 1/1 | 1 | Attention Needed | PASS |
| zh-Hant | 課程大綱 | 1 | 1/1 | 1/1 | 1 | Attention Needed | PASS |
| hi | सिलेबस | 1 | 1/1 | 1/1 | 1 | Attention Needed | PASS |
| ar-SA | خطة مقرر | 1 | 1/1 | 1/1 | 1 | Attention Needed | PASS |
| Mixed OCR | Messy scan | 1 | 2/1 | 2/2 | 3 | Attention Needed | PASS |
| Mixed language | Columns | 1 | 1/1 | 1/1 | 3 | Attention Needed | PASS |
| OCR cleanup | Line breaks and spaced dates | 1 | 1/1 | 1/1 | 2 | Attention Needed | PASS |

## Guardrails
- Global terms are normalized into the existing deterministic parser.
- Ambiguous rows keep confidence metadata for review.
- Sparse or messy inputs must degrade to review instead of silently creating high-certainty coursework.


