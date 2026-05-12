import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const premiumUiPath = path.join(process.cwd(), "src/components/PremiumUI.tsx");
const insightCardsPath = path.join(process.cwd(), "src/components/InsightCards.tsx");

test("planner visual surfaces expose VoiceOver labels", () => {
  const premiumUi = fs.readFileSync(premiumUiPath, "utf8");
  const insightCards = fs.readFileSync(insightCardsPath, "utf8");

  assert.ok(premiumUi.includes("accessibilityLabel={`${assignment.title}"));
  assert.ok(premiumUi.includes("accessibilityLabel={done ? `Mark ${assignment.title} not done`"));
  assert.ok(premiumUi.includes("accessibilityLabel={`${day.label}, ${Number(dateNumber)}"));
  assert.ok(premiumUi.includes("accessibilityLabel={`Workload by day:"));

  assert.ok(insightCards.includes("accessibilityLabel={cardLabel}"));
  assert.ok(insightCards.includes("accessibilityLabel={`${day.date}, ${day.openItems.length} open deadline"));
  assert.ok(insightCards.includes("accessibilityLabel={`Workload forecast."));
  assert.ok(insightCards.includes("accessibilityLabel={`${day.label}, ${day.count} deadline"));
  assert.ok(insightCards.includes("accessibilityLabel={`Work by class."));
  assert.ok(insightCards.includes("accessibilityLabel={`${course.courseName}, ${course.openCount} open assignment"));
  assert.ok(insightCards.includes("accessibilityLabel={`Progress."));
});
