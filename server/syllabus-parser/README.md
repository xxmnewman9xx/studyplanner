# Syllabus Parser Endpoint

This directory contains a deploy-ready request handler for:

```text
POST /api/syllabus/parse
```

Use `handleSyllabusParseRequest(request)` from `handler.ts` in a serverless route that supports the standard Web `Request`/`Response` API.

## Runtime Contract

- Accepts `application/json`, `text/plain`, and `multipart/form-data`.
- Parses pasted text and plain-text uploads with the deterministic local parser.
- Extracts embedded text from text-based PDFs.
- Fails closed with `OCR_NOT_CONFIGURED` for image uploads until a real OCR provider is added.
- Returns the same `SyllabusParseResult` shape consumed by the app review flow.

## Example Vercel Edge Route

```ts
import { handleSyllabusParseRequest } from "../../../server/syllabus-parser/handler";

export const runtime = "edge";

export function POST(request: Request) {
  return handleSyllabusParseRequest(request);
}
```

## Required App Env

Only set these in a native build after the endpoint is deployed and verified:

```text
EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT=https://your-domain.example/api/syllabus/parse
EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1  # only when image OCR is actually implemented
```

Do not set the image flag for this handler as-is. It has no OCR provider.
