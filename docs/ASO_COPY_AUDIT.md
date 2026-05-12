# ASO Copy Audit

Generated: 2026-05-12T22:04:47.433Z

Source: `docs/APP_STORE_METADATA.md`

This audit checks the English App Store metadata draft against current Apple field limits already researched in `docs/APPLE_ASO_AND_SUBMISSION_RESEARCH.md`. It is not native-speaker localization review and does not prove App Store Connect acceptance.

## Result

PASS: English metadata is length-safe and claim-safe.

| Check | Status | Detail |
| --- | --- | --- |
| App name | PASS | 26/30 characters |
| Safer fallback name | PASS | 23/30 characters |
| Subtitle | PASS | 30/30 characters |
| Promotional text | PASS | 131/170 characters |
| Description | PASS | 1220/4000 characters |
| Keywords | PASS | 100/100 bytes |
| Unsafe claims absent from recommended metadata | PASS | No avoided claims found |

## Recommended English Metadata

| Field | Value |
| --- | --- |
| App name | Study Planner: Syllabus AI |
| Safer fallback name | Study Planner: Syllabus |
| Subtitle | Scan syllabi. Track deadlines. |
| Keywords | homework,assignments,exams,calendar,classes,grades,school,college,student,widget,reminders,timetable |
| Promotional text | Add a syllabus, review found work, and keep confirmed deadlines visible in Today, Week, Calendar, Classes, and Home Screen widgets. |
| What's New | New in this release: reviewed syllabus import, Today and Week planning, class hubs, grade tracking, reminders, calendar sync, and small/medium Home Screen widgets. |

## Remaining ASO Gaps

- Localized metadata packs still require native-speaker review.
- Localized screenshots still require text-fit checks.
- App Store Connect keyword acceptance and search performance are unproven until upload/testing.
- Support URL remains a submission blocker outside this metadata copy audit.
