import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const output = execFileSync("npx", ["eas-cli", "env:list", "production", "--format", "long"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

const retiredParserVariables = [
  "EXPO_PUBLIC_SYLLABUS_IMAGE_PARSING_ENABLED",
  "EXPO_PUBLIC_SYLLABUS_PARSE_ENDPOINT",
];
for (const name of retiredParserVariables) {
  assert(!output.includes(name), `Production EAS environment must not contain retired remote-parser variable ${name}`);
}

for (const name of ["EXPO_PUBLIC_IAP_SUBSCRIPTION_IDS", "EXPO_PUBLIC_PRIVACY_URL", "EXPO_PUBLIC_TERMS_URL"]) {
  assert(output.includes(name), `Production EAS environment must contain ${name}`);
}

console.log("Production EAS environment matches the on-device parsing and subscription privacy boundary.");
