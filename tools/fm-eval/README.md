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
