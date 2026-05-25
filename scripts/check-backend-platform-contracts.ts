import { handleSyllabusParseRequest } from "../server/syllabus-parser/handler";
import {
  normalizePurchaseValidationRequest,
  PurchaseValidationContractError,
  serverValidationConfigIsPresent
} from "../server/purchase-validation/contract";
import { isPurchaseServerValidationConfigured } from "../src/services/purchaseValidation";

declare const process: {
  exit(code?: number): never;
};

const failures: string[] = [];

function assert(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

async function json(response: Response) {
  return response.json() as Promise<any>;
}

async function checkParserEndpoint() {
  const jsonResponse = await handleSyllabusParseRequest(
    new Request("https://parser.example.test/v1/syllabus/parse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceName: "BIO 101 syllabus",
        text: "BIO 101 Biology Fall 2026\nLab Report due September 12, 2026 at 5pm\nFinal Exam December 10, 2026"
      })
    })
  );
  const parsed = await json(jsonResponse);
  assert(jsonResponse.status === 200, "JSON parser endpoint request should pass.");
  assert(parsed.assignments?.length >= 2, "JSON parser endpoint should return parsed assignments.");

  const form = new FormData();
  form.append("kind", "pdf");
  form.append(
    "file",
    new Blob([
      "PSYC 214 Social Psychology Fall 2026\nReflection Paper due Oct 3, 2026\nQuiz due Nov 2, 2026"
    ], { type: "text/plain" }),
    "psych-syllabus.txt"
  );
  const formResponse = await handleSyllabusParseRequest(
    new Request("https://parser.example.test/v1/syllabus/parse", {
      method: "POST",
      body: form
    })
  );
  const formParsed = await json(formResponse);
  assert(formResponse.status === 200, "Multipart text parser endpoint request should pass.");
  assert(formParsed.sourceName === "psych-syllabus.txt", "Multipart parser should preserve uploaded source name.");

  const imageForm = new FormData();
  imageForm.append("kind", "photo");
  imageForm.append("file", new Blob(["fake image bytes"], { type: "image/jpeg" }), "scan.jpg");
  const imageResponse = await handleSyllabusParseRequest(
    new Request("https://parser.example.test/v1/syllabus/parse", {
      method: "POST",
      body: imageForm
    })
  );
  const imageError = await json(imageResponse);
  assert(imageResponse.status === 422, "Image parser request should fail closed without OCR provider.");
  assert(imageError.error?.code === "OCR_NOT_CONFIGURED", "Image parser should return explicit OCR_NOT_CONFIGURED code.");

  const shortResponse = await handleSyllabusParseRequest(
    new Request("https://parser.example.test/v1/syllabus/parse", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "too short" })
    })
  );
  assert(shortResponse.status === 422, "Unreadable parser input should fail with 422.");
}

function checkPurchaseValidationContract() {
  const request = normalizePurchaseValidationRequest(
    {
      platform: "ios",
      productId: "plus.yearly",
      transactionId: "2000000123456789",
      source: "purchase",
      environment: "Sandbox"
    },
    ["plus.yearly"]
  );
  assert(request.transactionId === "2000000123456789", "IAP contract should preserve transaction IDs.");

  try {
    normalizePurchaseValidationRequest(
      { platform: "ios", productId: "unknown", transactionId: "1", source: "restore" },
      ["plus.yearly"]
    );
    assert(false, "Unknown products must fail validation contract.");
  } catch (error) {
    assert(
      error instanceof PurchaseValidationContractError && error.code === "UNKNOWN_PRODUCT",
      "Unknown products should throw UNKNOWN_PRODUCT."
    );
  }

  try {
    normalizePurchaseValidationRequest(
      { platform: "ios", productId: "plus.yearly", source: "refresh" },
      ["plus.yearly"]
    );
    assert(false, "Missing transaction token must fail validation contract.");
  } catch (error) {
    assert(
      error instanceof PurchaseValidationContractError && error.code === "TOKEN_REQUIRED",
      "Missing transaction token should throw TOKEN_REQUIRED."
    );
  }

  assert(
    !serverValidationConfigIsPresent({}),
    "Server validation config must fail closed when Apple server credentials are absent."
  );
  assert(
    !isPurchaseServerValidationConfigured(),
    "Client purchase validation endpoint should be disabled unless EXPO_PUBLIC_IAP_VALIDATION_ENDPOINT is configured."
  );
  assert(
    serverValidationConfigIsPresent({
      STUDYPLANNER_APPLE_BUNDLE_ID: "com.mattnewman.studyplanner",
      STUDYPLANNER_APPLE_ISSUER_ID: "issuer",
      STUDYPLANNER_APPLE_KEY_ID: "key",
      STUDYPLANNER_APPLE_PRIVATE_KEY: "private"
    }),
    "Server validation config should be considered present only with Apple server credentials."
  );
}

void checkParserEndpoint().then(() => {
  checkPurchaseValidationContract();

  if (failures.length) {
    console.error("Backend platform contract failures:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log("backend platform contract fixtures passed");
});
