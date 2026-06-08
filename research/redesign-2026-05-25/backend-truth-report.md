# Backend Truth Report

## What Is Real

- Syllabus typed text parsing is local and deterministic through `parseSyllabusText`.
- Text-based PDF/plain-text import can parse on device.
- Photo import is available only when `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT` is configured.
- Import review blocks invalid or flagged work before it can reach Today, Calendar, reminders, or widgets.
- Planner persistence is local device/web storage.
- IAP is native `expo-iap` when configured; web/unconfigured builds fail closed.
- Widget snapshots are real and restrict native widget data to reviewed planner fields.
- Calendar sync and reminder scheduling now locally filter out unreviewed or duplicate assignments before writing native automation.

## What Is Not In Repo

- No hosted parser endpoint implementation.
- No cloud account sync.
- No server-side receipt validation.
- No storage backup/export.
- No calendar event reconciliation for edits/deletes.
- No native image OCR fallback.

## Fixes Made

- `docs/AI_PARSE_CONTRACT.md` now documents the actual FormData request shape.
- `isSyllabusParsingConfigured()` now reflects whether the parse endpoint env var exists.
- Import review now exposes a visible trust gate and bulk confirmation for rows with valid dates.
- Tablet review action now opens Scan so unresolved imports go to the right place.
- Widget Studio now says native Home Screen placement still happens in iOS.
- Widget Studio separates native Today/Upcoming snapshots from advanced in-app preset previews.
- Widget snapshot copy now says `Upcoming` instead of implying a fixed seven-day range.
- Calendar sync and reminders now require reviewed, non-duplicate planner rows before native writes.
- Today command tiles route to real Scan, Review, Calendar, and Widget surfaces instead of fake shortcuts.

## Critical-Risk Area Avoided

GitNexus marked `buildUploadBody` as CRITICAL because it feeds `parseSyllabusWithEndpoint`, `parseSyllabus`, `runParse`, and every import source flow. This pass did not change parser upload code.

## Current Backend Truth Score

9/10. The UI no longer claims missing backend systems, parser endpoint availability is environment-gated, IAP fails closed when products are unavailable, native automation avoids unreviewed rows, and widget placement is described truthfully. Remaining gap: no server receipt validation or hosted parser endpoint exists in this repo.
