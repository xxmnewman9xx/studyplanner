# Optional Syllabus Parser Service

This directory contains an optional, standalone Node service for:

```text
POST /api/syllabus/parse
```

It is not part of the current shipping app runtime. The active native entry point is
`index.ts`, which registers the monolithic `App.tsx`. That file does not import or call
`src/services/syllabusParser.ts`, `src/screens/ImportScreen.tsx`, this handler, or this
server. Its syllabus flow currently uses the on-device image, PDF, and deterministic
parsing modules directly.

Consequently, deploying this service or setting the parser environment variables does
not activate remote parsing in the current app monolith. Treat
`src/services/syllabusParser.ts` as an unwired modular client for possible future use.

## Handler Contract

`handleSyllabusParseRequest(request)` in `handler.ts` uses the standard Web
`Request`/`Response` API, but its complete image path requires a Node runtime with
`Buffer`, `tesseract.js`, and the bundled `@tesseract.js-data/eng` data. Do not deploy
the complete handler as an Edge function.

The handler:

- accepts `application/json` with `text` and optional `sourceName`/`name` fields;
- accepts `text/plain` bodies;
- accepts `multipart/form-data` containing pasted `text` or a `file`;
- parses pasted text and plain-text uploads with the deterministic local parser;
- extracts embedded text from text-based PDFs (it does not OCR PDF pages);
- runs English Tesseract.js OCR for multipart files labeled `image/*`, after checking
  for a JPEG, PNG, GIF, BMP, or WebP file signature;
- reuses one OCR worker and serializes OCR jobs through one in-process queue;
- times each queued OCR operation out after 30 seconds; and
- returns the same `SyllabusParseResult` shape used by the parser review code.

Limits enforced by the handler are 8 MB per uploaded file and 500,000 characters of
extracted or supplied text. Blank text, PDFs without readable embedded text, invalid
image bytes, images without readable text, unsupported content types, and parser
failures return structured JSON errors rather than a fabricated parse result.

The exported `OCR_NOT_CONFIGURED` error-code type is retained for compatibility, but
the current Tesseract-backed handler does not emit it.

## Standalone HTTP Server

`server.ts` adapts Node HTTP requests to the handler and adds:

- `GET /health` for the configured Railway health check;
- a 404 response for routes other than `/api/syllabus/parse`;
- an 8.25 MiB request-body ceiling, leaving multipart overhead above the handler's
  8 MB file limit;
- a default limit of 12 parser requests per client IP per minute;
- a default maximum of two concurrent parser requests;
- a 35-second request timeout and 10-second header timeout; and
- generic public 500 responses for unexpected server failures.

Override the traffic defaults with `PARSER_RATE_LIMIT_PER_MINUTE` and
`PARSER_MAX_CONCURRENCY`. The server trusts the first `X-Forwarded-For` address, so a
production reverse proxy must replace untrusted forwarded headers. The service does
not implement authentication or CORS; add deployment-level access controls appropriate
to the intended client before exposing it publicly.

## Build, Verify, and Run

From the repository root:

```sh
npm run build:syllabus-parser
npm run test:parser-hardening
npx tsx scripts/check-backend-platform-contracts.ts
npm run start:syllabus-parser
```

`railway.json` uses the same build and start commands. Its presence documents a
deployment configuration; it is not evidence that a production service is currently
deployed.

The end-to-end photo OCR fixture is available separately:

```sh
npx tsx scripts/check-photo-ocr-import.ts
```

That fixture generates an image with macOS `qlmanage`, so it is macOS-only even though
the parser service itself is intended for a Node host.

## Future Client Wiring

If a future app entry point intentionally imports `src/services/syllabusParser.ts`, only
then configure its endpoint after deploying, securing, and verifying this service:

```text
EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT=https://your-domain.example/api/syllabus/parse
EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1
```

The second setting explicitly permits photo uploads to the remote endpoint. It is not
needed for the current `App.tsx` flow, which performs supported recognition on device.
