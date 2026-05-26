# Parser Smoke Proof

Date: 2026-05-25
Current commit: `8e567d8dd75eb002cf01d25b3492cd1f68286539`

## Hosted Endpoint

Not proven. No HTTPS parser endpoint was deployed.

## What Was Checked

- Source handler exists at `server/syllabus-parser/handler.ts`.
- Contract supports `POST` JSON, plain text, multipart text uploads, and text-based PDFs.
- Image uploads fail closed with `OCR_NOT_CONFIGURED`; this is correct because no OCR provider is implemented.
- Production EAS env does not contain `EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT`.
- Production EAS env does not contain `EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED`.

## Deployment Blocker

There is no authenticated hosting target available from this repo state:

- `eas whoami` is authenticated as `xxmnewman9xx`, but EAS does not host this server route.
- `railway whoami` fails because the Railway token is invalid.
- No other deploy CLI/config/token was present.

## Smoke Result

No external `curl`/HTTPS smoke test was run because there is no deployed URL. Local contract tests can still verify handler behavior, but they are not production endpoint proof.

## Required Next Command After Deployment

```sh
curl -sS -X POST 'https://<deployed-host>/api/syllabus/parse' \
  -H 'content-type: application/json' \
  --data '{"sourceName":"BIO 101 syllabus","text":"BIO 101 Fall 2026\nLab Report due September 12, 2026\nFinal Exam December 10, 2026"}'
```

Expected proof criteria:

- HTTP `200`
- response includes parsed assignment/exam items
- no image parsing claim unless OCR is implemented and independently tested
