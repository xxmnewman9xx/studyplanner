# Max Impact OCR and App Experience Audit

Date: 2026-06-15

## Scores

- OCR/import robustness before this pass: 5/10 from subagent audit.
- App experience before this pass: 7.3/10 from subagent audit.
- Automated locale stress gates after this pass: 10/10 for global syllabus and global notes fixtures.
- OCR/import subagent score after the first hardening pass: 6.5/10 before the final service-parser alignment; remaining real-world risk is concentrated in backend OCR language packs, PDF text extraction, and real image fixtures.
- App experience subagent score after this pass: 8/10, with remaining risk concentrated in review-row validation, accessibility labels, and pending-import resume UX.

## Implemented In This Pass

1. Native iOS Vision OCR no longer forces `en-US`; it filters StudyPlanner's supported locale languages against Vision's runtime-supported languages.
2. OCR cleanup now handles Unicode spaces, hyphenated line breaks, wrapped OCR lines, and Unicode token counting.
3. The active scanner uses Unicode OCR token counting, reducing false weak-scan warnings for CJK, Arabic, Hindi, and mixed-script pages.
4. Global syllabus stress coverage now includes all 17 localized App Store locales plus messy OCR cases.
5. Global notes stress coverage now includes all 17 localized App Store locales.
6. Parser normalization now handles OCR-spaced numeric dates and localized date connector phrases like `5 de octubre`.
7. Review empty state now offers Camera, Paste, and Scan recovery actions.
8. Camera permission denial now includes Open Settings plus Paste fallback.
9. The alternate service parser path now shares global academic normalization and is covered by the global syllabus stress gate.

## Top 20 Highest-Leverage Improvements

| Rank | Improvement | Status |
|---:|---|---|
| 1 | Replace dead-end empty review state with recovery CTAs. | Done |
| 2 | Add accessible labels/roles to review row approve/delete/title edit controls. | Next |
| 3 | Stop converting invalid review dates to today; show inline validation. | Next |
| 4 | Add Open Settings to denied camera permission state. | Done |
| 5 | Make scanner readiness copy truthful when native OCR is unavailable. | Partial |
| 6 | Add pending-import resume banner after app restart. | Next |
| 7 | Clarify paywall-before-scan expectation in onboarding. | Next |
| 8 | Improve onboarding choice accessibility and selected states. | Next |
| 9 | Add accessibility labels and input hints to shared field inputs. | Next |
| 10 | Standardize empty states to always include action, tone, and recovery route. | Partial |
| 11 | Add grade empty-state CTAs for Add course / Import syllabus. | Next |
| 12 | Add completeness checks for all non-English app copy keys. | Next |
| 13 | Add RTL smoke coverage for Arabic screens. | Next |
| 14 | Consolidate OCR wrapper behavior and thresholds. | Done |
| 15 | Handle limited photo-library access distinctly. | Next |
| 16 | Add paste import “too short to parse” feedback. | Next |
| 17 | Explain review confidence reasons inline. | Next |
| 18 | Decide whether legacy `ImportScreen` is dead or align it. | Next |
| 19 | Normalize raw purchase/import errors into localized recovery messages. | Next |
| 20 | Add regression scripts for review empty, invalid dates, scanner denied permission, limited photos, and non-English scan/review copy. | Partial |

## Remaining Highest-Risk Gaps

- Backend image OCR still needs language packs or locale-aware routing for Arabic, Hindi, Japanese, Korean, Simplified Chinese, and Traditional Chinese.
- PDF extraction is still not a full Unicode/ToUnicode-map extractor for non-Latin embedded fonts.
- Real scanned-image fixtures should be added for each locale; current 10/10 coverage is deterministic text/OCR-output simulation, not a camera-quality corpus.
