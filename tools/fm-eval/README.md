# fm-eval: on-device syllabus extraction harness (Mac)

`FMEval/` is a SwiftPM executable that runs the **shipping** `syllabusExtract`
feature (same `@Generable` schemas, instructions and `GenerationOptions`) on a
Mac with Apple Intelligence. `Sources/FMEval/Schemas.swift` and `Features.swift`
are symlinks to `modules/studyplanner-apple-intelligence/ios/`, so any prompt or
schema change in the app is what gets evaluated.

## Layout

| Path | Owner | Contents |
|---|---|---|
| `fixtures/*.json` | `scripts/export-fm-fixtures.ts` | `{ "id": string, "text": string, "language"?: string, ... }` |
| `outputs/<id>.json` | FMEval | `{ "id", "chunks": [ { "chunkText", "raw": RawSyllabusChunk, "error"?, "elapsedMs" } ], "meta" }` |
| `scripts/eval-extraction.ts` | scorer | reads `outputs/`, validates and scores against gold labels |

Chunking: split on blank-line groups, greedily pack paragraphs into chunks of at
most 2,500 characters, split over-long paragraphs on line boundaries. Keep it
identical to the TS chunker.

## Run it

Requirements: Apple silicon Mac on macOS 26+, Xcode 26.x command-line tools,
Apple Intelligence **on** in System Settings, and the model downloaded.

```sh
cd tools/fm-eval/FMEval
swift run -c release FMEval --fixtures ../fixtures --out ../outputs
# optional: --language es-MX (default en-US; a fixture's own "language" wins)
# optional: --only <fixture-id>
cd ../../..
npx tsx scripts/eval-extraction.ts --model tools/fm-eval/outputs
```

Exit code 2 means the model is unavailable (Apple Intelligence off or the model
still downloading). A chunk that fails is written with an empty `raw` and
`error` set to the app's `AIErrorCode` (for example `guardrail` or
`contextOverflow`), so the scorer counts it as a miss instead of crashing.

## Re-run per OS version

The system model changes with the OS (26.0-26.3, 26.4, 27.0), so results are
only valid for the OS they were produced on (`meta.osVersion` in every output).

1. After every macOS/iOS update, and after any change to `Schemas.swift`,
   `Features.swift` or `AIVersions`, re-run the harness into a per-OS folder,
   for example `--out ../outputs-26.4` and `--out ../outputs-27.0`.
2. Score each folder and compare against the heuristic baseline gates
   (0 invented dates after validation, precision >= 0.95, recall >= baseline + 10).
3. If a new OS regresses, bump `AIVersions.instructions` with the prompt fix so
   on-device caches (keyed by schema/instructions version + OS version) refresh.

# fm-eval: syllabus extraction gold set and scoring

This folder holds hand-labeled syllabi and the scoring harness for StudyPlanner 2.2's
syllabus extraction (MASTER_PLAN §C8). It measures the Build 90 heuristic parser
(`analyzeSyllabus`) and the **validated** on-device pipeline
(`validateSyllabusChunk` → `mergeSyllabusCandidates`). Raw model output is never scored
directly.

## Commands

```sh
# Score the heuristic and rewrite BASELINE.md (also runs in `npm run test:ai`)
npx tsx scripts/eval-extraction.ts --baseline

# Write the exact chunks the app would send, one <id>.chunks.json per fixture
npx tsx scripts/eval-extraction.ts --dump-chunks /tmp/fm-chunks [--context 4096]

# Score model output produced on a Mac; writes MODEL_RESULTS.md
npx tsx scripts/eval-extraction.ts --model /tmp/fm-out [--context 4096]
```

The script exits non-zero only on code errors (a malformed fixture, unreadable JSON).
Low scores never fail it. The gates print as PASS/FAIL in `MODEL_RESULTS.md`.

## Fixture format: `fixtures/<id>.json`

```jsonc
{
  "id": "hand-03-cs-week-headers-weekday-rows", // file name without .json
  "name": "CS 161 'Week N (Mon–Fri)' headers with weekday-only rows",
  "source": "handwritten",          // or the stress script the text came from
  "locale": "en-US",
  "now": "2026-08-20",              // the reference date used to resolve year-less dates
  "text": "…full syllabus text…",
  "gold": [
    {
      "title": "PA1",
      "kind": "task",               // "task" | "exam": the kind class that must match
      "date": "2026-09-09",         // ISO date resolved against `now`
      "courseCode": "CS 161",       // optional, informational
      "aliases": ["Programming assignment 1"] // optional extra titles that count as a match
    }
  ],
  "notes": "Why ambiguous rows were left out of gold."
}
```

Labeling rules:
- Gold lists graded deliverables that have one resolvable date: assignments, papers,
  problem sets, labs, quizzes, exams, and presentations with a stated date.
- Excluded: lecture topics, holidays, office hours, recurring deadlines without a single
  date ("every Tuesday"), dates marked TBC, and presentation days whose slot is ambiguous.
- Kind: quizzes, exams, midterms, finals, class tests, lab practicals, and in-class
  competency tests are `exam`. Everything submitted is `task`, including presentations,
  matching `analyzeSyllabus` conventions.
- Year-less dates resolve to the next occurrence on or after `now` (2026-08-20), the same
  rule `dateFromPhrase` applies. Explicit years are kept even when they are in the past.
- A weekday-only row under a week header ("Week 5 (Sep 21–25) · Wed: PA2 due") resolves
  inside that week.
- `aliases` hold the English forms the app's own normalizer produces for non-English
  keywords (for example 課題 → "assignment"), never paraphrases that would hide a parsing
  bug.

Fixtures:
- `stress-01` … `stress-21`: the 20 inline cases plus the fake PDF in
  `scripts/check-syllabus-stress.ts` (the PDF case stores the text the real PDF extractor
  produces). `scripts/check-smart-syllabus.ts` reads the same cases straight from the
  stress script, so the two cannot drift.
- `hand-01` … `hand-11`: realistic multi-page syllabi (30–80 lines): a pipe week grid,
  OCR tab/space columns, "Week N (Mon–Fri)" headers with weekday-only rows, European
  dd.mm dates, ISO dates across page markers, three courses in one packet, Spanish,
  Japanese, noisy OCR, a nursing weight table with "Mon 9/14" rows, and prose-only
  deadlines.

## Scoring

- **Match:** same ISO date, same kind class (exam vs task), and title token overlap ≥ 0.5
  (shared tokens divided by the shorter title's token count, against the gold title or
  any alias). Each gold item matches at most one prediction.
- **Precision** = matched / predicted. **Recall** = matched / gold. Totals are micro-averaged.
- **Invented date:** a predicted date that is neither a gold date nor derivable from any
  date token in the text (absolute date tokens, plus weekday names and today/tomorrow
  resolved from `now`).
- The heuristic's placeholder "Review imported syllabus" safety task is not scored.

Model gates (after validation and merge): **0 invented dates**, **precision ≥ 0.95**, and
**recall ≥ baseline + 10 points**.

## Model output format: `<dir>/<id>.json`

One file per fixture, containing a JSON array with one raw `SyllabusChunk` per chunk, in
the same order as `<id>.chunks.json` from `--dump-chunks` (use the same `--context`):

```json
[
  {
    "courses": [{ "code": "CS 161", "title": "Data Structures and Algorithms", "sourceSpan": "CS 161 — Data Structures and Algorithms" }],
    "items": [
      { "kind": "quiz", "title": "Quiz 1", "dateText": "Sep 4", "sourceSpan": "Fri: Hashing II — Quiz 1", "courseCode": "CS 161" }
    ]
  }
]
```

The shape mirrors `RawSyllabusChunk` in `src/appleIntelligence/types.ts` (the Swift
`@Generable` schema). A single object instead of an array is treated as the output for a
one-chunk document. A fixture with no output file is reported as missing and skipped.

Mac harness steps:
1. Run `--dump-chunks` and copy the folder to the Mac.
2. For each chunk, call the `SyllabusChunk` session exactly as the app does (same
   instructions, `.greedy` sampling, `today` set to the fixture's `now`).
3. Write each fixture's array of raw outputs to `<dir>/<id>.json`, then run `--model <dir>`
   here and commit `MODEL_RESULTS.md` next to `BASELINE.md`.
