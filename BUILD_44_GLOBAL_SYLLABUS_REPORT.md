# Build 44 Global Syllabus Report

## Scope
Global syllabus stress test covering multilingual dates, international academic keywords, mixed OCR, tables, repeated headers, and date-order ambiguity.

## Result
PASS

| Locale | Scenario | Classes | Assignments | Exams | Review Rows | Narrative | Status |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| English | STEM | 1 | 1 | 2 | 2 | Attention Needed | PASS |
| Spanish | Humanities | 1 | 1 | 1 | 1 | Attention Needed | PASS |
| Portuguese | Business | 1 | 1 | 1 | 1 | Attention Needed | PASS |
| French | Medicine | 1 | 1 | 1 | 1 | Attention Needed | PASS |
| German | Engineering | 1 | 1 | 1 | 1 | Attention Needed | PASS |
| Japanese | Online learning | 1 | 1 | 1 | 1 | Attention Needed | PASS |
| Korean | Graduate course | 1 | 1 | 1 | 2 | Attention Needed | PASS |
| Chinese Simplified | High school | 1 | 1 | 1 | 1 | Attention Needed | PASS |
| Hindi | Community college | 1 | 1 | 1 | 1 | Attention Needed | PASS |
| Arabic | International university | 1 | 1 | 1 | 1 | Attention Needed | PASS |
| Mixed OCR | Messy scan | 1 | 2 | 2 | 3 | Attention Needed | PASS |
| Mixed language | Columns | 1 | 1 | 1 | 3 | Attention Needed | PASS |

## Guardrails
- Global terms are normalized into the existing deterministic parser.
- Ambiguous rows keep confidence metadata for review.
- Sparse or messy inputs must degrade to review instead of silently creating high-certainty coursework.


