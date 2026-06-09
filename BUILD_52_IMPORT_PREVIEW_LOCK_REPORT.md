# Build 52 Import Preview Lock Report

## Result

Non-premium users can preview import value but cannot apply it.

Allowed before entitlement:

- Upload PDF
- Camera syllabus scan
- Photo syllabus scan
- Paste syllabus text
- Review parsed candidates
- See classes, assignments, exams, pressure preview, and first recommended action

Blocked before entitlement:

- Applying import to active data
- Dashboard population
- Widget population
- Reminder scheduling
- Premium flag persistence

## Verified UX

Screenshot: `qa/build52-locked-experience/13-import-preview.png`

The review screen says:

- "Preview only."
- "Unlock to apply this semester to the real app."
- CTA: "Unlock my semester"
- Footer: approved items remain "locked until premium"

## Routing

`ReviewImport.apply()` routes non-premium users to `paywall` before calling `applyImport`.

Pending import drafts persist as `pending-import.json` and relaunch into review. They are not applied unless entitlement becomes active.

