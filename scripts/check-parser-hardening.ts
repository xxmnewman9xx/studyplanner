import { readFileSync } from "node:fs";
import { handleSyllabusParseRequest } from "../server/syllabus-parser/handler";

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function run() {
  const oversizedText = "a".repeat(500_001);
  const oversizedResponse = await handleSyllabusParseRequest(new Request("https://example.test/api/syllabus/parse", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: oversizedText,
  }));
  expect(oversizedResponse.status === 413, "parser must reject oversized text with HTTP 413");
  const oversizedBody = await oversizedResponse.json() as { error?: { code?: string } };
  expect(oversizedBody.error?.code === "PAYLOAD_TOO_LARGE", "oversized parser response must use PAYLOAD_TOO_LARGE");

  const wrongMethod = await handleSyllabusParseRequest(new Request("https://example.test/api/syllabus/parse"));
  expect(wrongMethod.status === 405, "parser must reject non-POST requests");

  const serverSource = readFileSync("server/syllabus-parser/server.ts", "utf8");
  const packageSource = readFileSync("package.json", "utf8");
  const railwaySource = readFileSync("railway.json", "utf8");
  [
    "MAX_REQUEST_BYTES",
    "MAX_CONCURRENT_REQUESTS",
    "RATE_LIMIT_REQUESTS",
    "readBoundedBody",
    "RequestTooLargeError",
    "server.requestTimeout",
  ].forEach((proof) => expect(serverSource.includes(proof), `parser server is missing ${proof} hardening`));
  expect(packageSource.includes('"build:syllabus-parser": "tsc --project tsconfig.syllabus-parser.json"'), "parser build script must exist");
  expect(railwaySource.includes('"buildCommand": "npm run build:syllabus-parser"'), "Railway must call the verified parser build script");
  console.log("parser hardening checks passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
