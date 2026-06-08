# Excluded Files

Date: 2026-05-25

The release commit intentionally excludes local/generated artifacts:

- `AppStore/`
- `marketing/`
- `memory/`
- `.claude/`
- `.openclaw/`
- `CLAUDE.md`
- `studyplanner-new-ui-iphone.png`
- `scripts/capture-final-preview-pack.mjs`
- `scripts/generate-first-app-preview.mjs`

Rationale: these are local proof packets, generated screenshots/videos, agent state, or one-off capture tools. The operational release commit keeps source, release docs, QA guardrails, and concise launch receipts.

`AGENTS.md` contains a local GitNexus instruction block that is not part of the app release state. It was intentionally not staged into the release commit.
