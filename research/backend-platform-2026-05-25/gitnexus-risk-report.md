# GitNexus Risk Report

Index:

- `npx gitnexus analyze` completed after moving the untracked reference repo cache outside the project.
- Indexed commit: `2784dc8`.
- Result: 2,508 nodes, 4,641 edges, 217 flows.

Pre-edit impact checks:

- `supportsSyllabusImageParsing`: LOW.
- `ImportScreen`: LOW.
- `OnboardingScreen`: LOW.
- `syncStudyPlannerWidgets`: LOW.
- `buildStudyPlannerWidgetSnapshots`: HIGH.
- `refreshEntitlement`: HIGH.
- `refreshEntitlementAfterPurchase`: LOW.
- `handlePurchaseSuccess`: LOW.
- `extractTextFromImage`: CRITICAL, so the function body was not changed.
- `parseSyllabusWithEndpoint`: CRITICAL, so endpoint internals were not changed.
- `buildUploadBody`: CRITICAL, so upload body shape was not changed.

Risk handling:

- HIGH/CRITICAL areas were limited to truth gates, snapshot filtering, optional server validation, docs, and tests.
- Parser upload internals and local OCR implementation were avoided.
- Receipt validation changes are optional and fail-closed when configured.

Final staged `detect-changes`:

- Command: `npx gitnexus detect-changes --repo studyplanner --scope staged`
- Changes: 35 files, 72 symbols.
- Affected processes: 48.
- Risk: CRITICAL.

The staged aggregate remains CRITICAL because the pass intentionally touches widget snapshot flows, subscription entitlement refresh, parser capability gates, release docs, and validation scripts. The highest-risk parser upload internals and local OCR implementation were still avoided.
