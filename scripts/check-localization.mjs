import { readFileSync } from "node:fs";

const appSource = readFileSync("App.tsx", "utf8");
const failures = [];

function expect(pass, message) {
  if (!pass) failures.push(message);
}

[
  "StudyPlanner unlocked",
  "Your subscription is active.",
  "Add Syllabus",
  "No semester loaded.",
  "Start here",
  "Scan syllabus",
  "Build your semester first.",
  "Paste text",
  "Upload PDF",
  "Restore Purchases",
  "Terms of Use",
  "Privacy Policy",
].forEach((copy) => expect(appSource.includes(copy), `Missing required copy: ${copy}`));

expect(!appSource.includes("score 81"), "localized surfaces must not mention fake score 81");
expect(!appSource.includes("No dashboard data"), "empty dashboard must not use broken placeholder copy");
expect(!appSource.includes("0 / locked"), "locked or empty dashboard must not expose prototype numeric shorthand");
expect(!appSource.includes("Studyplanner: Syllabus AI"), "loading copy must use product casing");

if (failures.length) {
  console.error("Localization checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Localization checks passed.");
