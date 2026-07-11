import { readFileSync } from "node:fs";

const appSource = readFileSync("App.tsx", "utf8");
const failures = [];
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

expect(appSource.includes("function localDateKey(date: Date)"), "App must define a local calendar date-key formatter");
expect(appSource.includes("return localDateKey(date);"), "recurrence date arithmetic must return a local calendar key");
expect(appSource.includes("const dateText = localDateKey(date);"), "recurring task creation must preserve the local due date");
expect(appSource.includes("const isoForDay = (day: number) => localDateKey("), "Plan calendar cells must use local date keys");
expect(!appSource.includes("new Date(today.getFullYear(), today.getMonth(), day).toISOString().slice(0, 10)"), "Plan must not convert local midnight through UTC");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("local date-key safety checks passed");
