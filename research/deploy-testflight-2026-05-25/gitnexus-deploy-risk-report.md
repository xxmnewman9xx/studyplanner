# GitNexus Deploy Risk Report

Date: 2026-05-25

## Index

`npx gitnexus analyze` refreshed the index for commit `8e567d8dd75eb002cf01d25b3492cd1f68286539`.

Indexed result:

- 2,674 nodes
- 4,937 edges
- 90 clusters
- 231 flows

## Flow Map Checked

GitNexus query:

```sh
npx gitnexus query -r studyplanner "syllabus parser endpoint purchase validation EAS env scan import" --limit 8
```

Relevant flows/symbols:

- `checkParserEndpoint -> handleSyllabusParseRequest`
- `handleSyllabusParseRequest -> readPayload/jsonResponse/errorResponse/parseSyllabusText`
- `checkPurchaseValidationContract -> normalizePurchaseValidationRequest`
- `validateEntitlementWithServer` is called by subscription purchase, restore, and refresh flows.

## Edit Risk

No app runtime symbols were edited in this pass. Changes are deployment proof/report files only.

## Commit Gate

`npx gitnexus detect-changes -r studyplanner --scope staged` reported:

```text
No changes detected.
```

That is expected because the staged scope contains deployment proof artifacts only and no indexed runtime symbols.
