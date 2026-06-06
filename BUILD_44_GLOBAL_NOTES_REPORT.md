# Build 44 Global Notes Report

## Scope
Global notes stress test covering lecture outlines, OCR-like notes, formulas, definitions, exam review hints, weak-area language, flashcard-friendly material, and sparse input.

## Result
PASS

| Locale | Scenario | Concepts | Review Task | Confidence | Preparedness | Notes Narrative | Status |
| --- | --- | ---: | --- | ---: | ---: | --- | --- |
| English | lecture outline | 7 | yes | 0.91 | 97 | Notes are supporting readiness. | PASS |
| Spanish | exam review | 7 | yes | 0.66 | 97 | Notes are supporting readiness. | PASS |
| Portuguese | formula notes | 2 | yes | 0.66 | 90 | Notes are supporting readiness. | PASS |
| French | definitions | 3 | yes | 0.66 | 92 | Notes are supporting readiness. | PASS |
| German | weak areas | 2 | yes | 0.66 | 90 | Notes are supporting readiness. | PASS |
| Japanese | messy OCR | 2 | yes | 0.66 | 90 | Notes are supporting readiness. | PASS |
| Korean | flashcard style | 5 | yes | 0.66 | 95 | Notes are supporting readiness. | PASS |
| Chinese | mixed topic | 4 | yes | 0.66 | 93 | Notes are supporting readiness. | PASS |
| Hindi | OCR notes | 2 | yes | 0.66 | 90 | Notes are supporting readiness. | PASS |
| Arabic | sparse notes | 1 | yes | 0.66 | 89 | Notes are supporting readiness. | PASS |
| Sparse | too short | 2 | no | 0.42 | 90 | Notes are supporting readiness. | PASS |

## Guardrails
- Notes improve preparedness only when there is enough signal.
- Sparse notes stay low confidence.
- Weak-area language should produce review-oriented suggestions without hallucinating certainty.


