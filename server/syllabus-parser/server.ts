import { handleSyllabusParseRequest } from "./handler";

declare const require: any;
declare const Buffer: any;
declare const process: {
  env?: Record<string, string | undefined>;
  exitCode?: number;
};

const http = require("http");

const port = Number(process.env?.PORT || 3000);
const MAX_REQUEST_BYTES = 8 * 1024 * 1024 + 256 * 1024;
const MAX_CONCURRENT_REQUESTS = Math.max(1, Number(process.env?.PARSER_MAX_CONCURRENCY || 2));
const RATE_LIMIT_REQUESTS = Math.max(1, Number(process.env?.PARSER_RATE_LIMIT_PER_MINUTE || 12));
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateWindows = new Map<string, { startedAt: number; count: number }>();
let activeRequests = 0;

class RequestTooLargeError extends Error {}

const server = http.createServer(async (incoming: any, outgoing: any) => {
  try {
    if (incoming.url === "/health") {
      sendJson(outgoing, 200, {
        ok: true,
        service: "studyplanner-syllabus-parser"
      });
      return;
    }

    if ((incoming.url || "").split("?")[0] !== "/api/syllabus/parse") {
      sendJson(outgoing, 404, { error: { code: "NOT_FOUND", message: "Not found.", retryable: false } });
      return;
    }

    const retryAfterSeconds = consumeRateLimit(clientAddress(incoming));
    if (retryAfterSeconds !== null) {
      outgoing.setHeader("retry-after", String(retryAfterSeconds));
      sendJson(outgoing, 429, { error: { code: "RATE_LIMITED", message: "Too many parser requests. Try again shortly.", retryable: true } });
      return;
    }

    if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
      outgoing.setHeader("retry-after", "5");
      sendJson(outgoing, 503, { error: { code: "SERVICE_BUSY", message: "The parser is busy. Try again shortly.", retryable: true } });
      return;
    }

    activeRequests += 1;
    try {
      const request = await toWebRequest(incoming);
      const response = await handleSyllabusParseRequest(request);
      await sendWebResponse(outgoing, response);
    } finally {
      activeRequests -= 1;
    }
  } catch (error) {
    const tooLarge = error instanceof RequestTooLargeError;
    sendJson(outgoing, tooLarge ? 413 : 500, {
      error: {
        code: tooLarge ? "PAYLOAD_TOO_LARGE" : "SERVER_ERROR",
        message: tooLarge ? "Choose a syllabus file smaller than 8 MB." : "The parser service failed.",
        retryable: !tooLarge
      }
    });
  }
});

server.requestTimeout = 35_000;
server.headersTimeout = 10_000;

server.listen(port, "0.0.0.0", () => {
  console.log(`StudyPlanner syllabus parser listening on ${port}`);
});

async function toWebRequest(incoming: any) {
  const protocol = incoming.headers["x-forwarded-proto"] || "http";
  const host = incoming.headers.host || `localhost:${port}`;
  const url = `${protocol}://${host}${incoming.url || "/"}`;
  const method = incoming.method || "GET";
  const headers = new Headers();

  for (const [name, value] of Object.entries(incoming.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(name, String(item));
    } else if (value !== undefined) {
      headers.set(name, String(value));
    }
  }

  const declaredLength = Number(incoming.headers["content-length"] || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) throw new RequestTooLargeError();

  const init = method === "GET" || method === "HEAD"
    ? { method, headers }
    : { method, headers, body: await readBoundedBody(incoming) };

  return new Request(url, init as RequestInit);
}

async function readBoundedBody(incoming: any) {
  const chunks: any[] = [];
  let total = 0;
  for await (const chunk of incoming) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += bytes.length;
    if (total > MAX_REQUEST_BYTES) throw new RequestTooLargeError();
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}

function clientAddress(incoming: any) {
  const forwarded = String(incoming.headers["x-forwarded-for"] || "").split(",")[0]?.trim();
  return forwarded || incoming.socket?.remoteAddress || "unknown";
}

function consumeRateLimit(clientId: string): number | null {
  const now = Date.now();
  const current = rateWindows.get(clientId);
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateWindows.set(clientId, { startedAt: now, count: 1 });
    if (rateWindows.size > 10_000) {
      for (const [key, value] of rateWindows) {
        if (now - value.startedAt >= RATE_LIMIT_WINDOW_MS) rateWindows.delete(key);
      }
    }
    return null;
  }
  current.count += 1;
  if (current.count <= RATE_LIMIT_REQUESTS) return null;
  return Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (now - current.startedAt)) / 1000));
}

async function sendWebResponse(outgoing: any, response: Response) {
  outgoing.statusCode = response.status;
  response.headers.forEach((value, name) => {
    outgoing.setHeader(name, value);
  });

  if (!response.body) {
    outgoing.end();
    return;
  }

  const body = Buffer.from(await response.arrayBuffer());
  outgoing.end(body);
}

function sendJson(outgoing: any, status: number, body: unknown) {
  outgoing.statusCode = status;
  outgoing.setHeader("content-type", "application/json; charset=utf-8");
  outgoing.end(JSON.stringify(body));
}
