import { handleSyllabusParseRequest } from "./handler";

declare const require: any;
declare const Buffer: any;
declare const process: {
  env?: Record<string, string | undefined>;
  exitCode?: number;
};

const http = require("http");

const port = Number(process.env?.PORT || 3000);

const server = http.createServer(async (incoming: any, outgoing: any) => {
  try {
    if (incoming.url === "/health") {
      sendJson(outgoing, 200, {
        ok: true,
        service: "studyplanner-syllabus-parser"
      });
      return;
    }

    const request = toWebRequest(incoming);
    const response = await handleSyllabusParseRequest(request);
    await sendWebResponse(outgoing, response);
  } catch (error) {
    sendJson(outgoing, 500, {
      error: {
        code: "SERVER_ERROR",
        message: error instanceof Error ? error.message : "The parser service failed.",
        retryable: true
      }
    });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`StudyPlanner syllabus parser listening on ${port}`);
});

function toWebRequest(incoming: any) {
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

  const init =
    method === "GET" || method === "HEAD"
      ? { method, headers }
      : { method, headers, body: incoming, duplex: "half" };

  return new Request(url, init as RequestInit);
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
