import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const premiumUiPath = path.join(process.cwd(), "src/components/PremiumUI.tsx");
const insightCardsPath = path.join(process.cwd(), "src/components/InsightCards.tsx");
const appButtonPath = path.join(process.cwd(), "src/components/AppButton.tsx");
const importScreenPath = path.join(process.cwd(), "src/screens/ImportScreen.tsx");
const assignmentDetailPath = path.join(process.cwd(), "src/screens/AssignmentDetailScreen.tsx");
const widgetShowcasePath = path.join(process.cwd(), "src/screens/WidgetShowcaseScreen.tsx");
const upgradeScreenPath = path.join(process.cwd(), "src/screens/UpgradeScreen.tsx");

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

test("core action screens expose labels and bounded text scaling", () => {
  const appButton = fs.readFileSync(appButtonPath, "utf8");
  const importScreen = fs.readFileSync(importScreenPath, "utf8");
  const assignmentDetail = fs.readFileSync(assignmentDetailPath, "utf8");
  const widgetShowcase = fs.readFileSync(widgetShowcasePath, "utf8");
  const upgradeScreen = fs.readFileSync(upgradeScreenPath, "utf8");

  assert.ok(appButton.includes("maxFontSizeMultiplier={buttonTextScale}"));
  assert.ok(appButton.includes("numberOfLines={2}"));

  assert.ok(importScreen.includes("Mark ${visibleAssignments.length} shown item"));
  assert.ok(importScreen.includes("Edit first shown found item"));
  assert.ok(importScreen.includes("Mark ${assignment.title} looks good"));
  assert.ok(importScreen.includes("Set found work option to ${label}"));
  assert.ok(importScreen.includes("maxFontSizeMultiplier={bodyTextScale}"));

  assert.ok(assignmentDetail.includes("Close assignment detail"));
  assert.ok(assignmentDetail.includes("Set assignment course to ${option.code}, ${option.name}"));
  assert.ok(assignmentDetail.includes("Set assignment option to ${labelize(option)}"));
  assert.ok(assignmentDetail.includes("accessibilityHint=\"Use 24-hour time like 15:30.\""));
  assert.ok(assignmentDetail.includes("maxFontSizeMultiplier={bodyTextScale}"));

  assert.ok(widgetShowcase.includes("Use ${sizeLabel(size)} widget size"));
  assert.ok(widgetShowcase.includes("Show ${focus.label} on widget"));
  assert.ok(widgetShowcase.includes("Use ${style.name} widget style"));
  assert.ok(widgetShowcase.includes("Live widget preview. ${selectedFocus.label}"));
  assert.ok(widgetShowcase.includes("maxFontSizeMultiplier={bodyTextScale}"));

  assert.ok(upgradeScreen.includes("Selects this Plus plan."));
  assert.ok(upgradeScreen.includes("${product.title}, ${product.periodLabel}, ${product.displayPrice}"));
  assert.ok(upgradeScreen.includes("maxFontSizeMultiplier={bodyTextScale}"));
});
