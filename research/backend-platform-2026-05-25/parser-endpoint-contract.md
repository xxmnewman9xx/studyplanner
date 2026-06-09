# Parser Endpoint Contract

Implemented artifact: `server/syllabus-parser/handler.ts`

Route:

```text
POST /api/syllabus/parse
```

Supported request bodies:

- `application/json` with `text` and optional `sourceName`
- `text/plain`
- `multipart/form-data` with `kind=pdf|photo` and `file`

Implemented behavior:

- Pasted/plain text uses `parseSyllabusText`.
- Text-based PDFs use `extractTextFromPdfBase64` and then `parseSyllabusText`.
- Image uploads return `422 OCR_NOT_CONFIGURED` until a real OCR provider is added.
- Malformed or too-short text fails closed with a typed error.

App env:

```text
EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT=https://your-domain.example/api/syllabus/parse
EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED=1
```

Do not set the image flag for the current handler unless image OCR is added server-side.
