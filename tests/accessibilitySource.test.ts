import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const premiumUiPath = path.join(process.cwd(), "src/components/PremiumUI.tsx");
const insightCardsPath = path.join(process.cwd(), "src/components/InsightCards.tsx");
const appPath = path.join(process.cwd(), "App.tsx");
const appButtonPath = path.join(process.cwd(), "src/components/AppButton.tsx");
const importScreenPath = path.join(process.cwd(), "src/screens/ImportScreen.tsx");
const todayScreenPath = path.join(process.cwd(), "src/screens/TodayScreen.tsx");
const coursesScreenPath = path.join(process.cwd(), "src/screens/CoursesScreen.tsx");
const monthlyCalendarPath = path.join(process.cwd(), "src/screens/MonthlyCalendarScreen.tsx");
const assignmentDetailPath = path.join(process.cwd(), "src/screens/AssignmentDetailScreen.tsx");
const widgetShowcasePath = path.join(process.cwd(), "src/screens/WidgetShowcaseScreen.tsx");
const settingsScreenPath = path.join(process.cwd(), "src/screens/SettingsScreen.tsx");
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
  const settingsScreen = fs.readFileSync(settingsScreenPath, "utf8");
  const upgradeScreen = fs.readFileSync(upgradeScreenPath, "utf8");

  assert.ok(appButton.includes("maxFontSizeMultiplier={buttonTextScale}"));
  assert.ok(appButton.includes("numberOfLines={2}"));

  assert.ok(importScreen.includes("Add ${visibleAssignments.length} shown item"));
  assert.ok(importScreen.includes("Edit first shown found item"));
  assert.ok(importScreen.includes("Mark ${assignment.title} ready"));
  assert.ok(importScreen.includes("Set found work option to ${label}"));
  assert.ok(importScreen.includes("maxFontSizeMultiplier={bodyTextScale}"));

  assert.ok(assignmentDetail.includes("Close assignment detail"));
  assert.ok(assignmentDetail.includes("Set assignment course to ${option.code}, ${option.name}"));
  assert.ok(assignmentDetail.includes("Set assignment option to ${labelize(option)}"));
  assert.ok(assignmentDetail.includes("accessibilityHint=\"Use 24-hour time like 15:30.\""));
  assert.ok(assignmentDetail.includes("maxFontSizeMultiplier={bodyTextScale}"));

  assert.ok(widgetShowcase.includes("Use ${sizeLabel(size)} widget size"));
  assert.ok(widgetShowcase.includes("Show ${focus.label} on widget"));
  assert.ok(widgetShowcase.includes("Use ${preset.name} widget style"));
  assert.ok(widgetShowcase.includes("Live widget preview. ${selectedFocus.label}"));
  assert.ok(widgetShowcase.includes("maxFontSizeMultiplier={bodyTextScale}"));

  assert.ok(settingsScreen.includes("Widgets and reminders"));
  assert.ok(settingsScreen.includes("Restore"));
  assert.ok(settingsScreen.includes("Support URL is required before final submission."));
  assert.ok(settingsScreen.includes("maxFontSizeMultiplier={bodyTextScale}"));

  assert.ok(upgradeScreen.includes("Selects this Plus plan."));
  assert.ok(upgradeScreen.includes("${product.title}, ${product.periodLabel}, ${product.displayPrice}"));
  assert.ok(upgradeScreen.includes("maxFontSizeMultiplier={bodyTextScale}"));
});

test("capture routes expose honest screenshot proof states", () => {
  const app = fs.readFileSync(appPath, "utf8");
  const importScreen = fs.readFileSync(importScreenPath, "utf8");
  const todayScreen = fs.readFileSync(todayScreenPath, "utf8");
  const coursesScreen = fs.readFileSync(coursesScreenPath, "utf8");
  const monthlyCalendar = fs.readFileSync(monthlyCalendarPath, "utf8");
  const widgetShowcase = fs.readFileSync(widgetShowcasePath, "utf8");

  assert.ok(app.includes("captureStateFromQuery"));
  assert.ok(app.includes("\"calendar-filtered\""));
  assert.ok(app.includes("\"duplicate-found-work\""));
  assert.ok(app.includes("\"edit-found-work\""));
  assert.ok(app.includes("\"imported-found-work\""));
  assert.ok(app.includes("\"manual-add\""));
  assert.ok(app.includes("\"parser-processing\""));
  assert.ok(app.includes("\"reminders\""));
  assert.ok(app.includes("\"scan-paper\""));
  assert.ok(app.includes("\"upload-file\""));
  assert.ok(app.includes("\"widget-empty\""));
  assert.ok(app.includes("\"widget-needs-check\""));
  assert.ok(app.includes("\"settings\""));
  assert.ok(app.includes("knownTabs.includes(requestedTab)"));
  assert.ok(app.includes("widgetAssignmentsForCapture"));
  assert.ok(app.includes("assignments: widgetSnapshotAssignments"));

  assert.ok(importScreen.includes("captureState === \"edit-found-work\""));
  assert.ok(importScreen.includes("captureState === \"parser-processing\""));
  assert.ok(importScreen.includes("createCaptureImportDraft(captureState)"));
  assert.ok(importScreen.includes("showPhotoActions"));
  assert.ok(importScreen.includes("Paper scan needs setup"));
  assert.ok(importScreen.includes("Checked work is ready"));
  assert.ok(importScreen.includes("setExpandedAssignmentId(\"problem-set-4\")"));

  assert.ok(todayScreen.includes("captureState === \"reminders\""));
  assert.ok(todayScreen.includes("Remind Me"));
  assert.ok(todayScreen.includes("Add to Calendar"));

  assert.ok(coursesScreen.includes("showCaptureManualAdd"));
  assert.ok(coursesScreen.includes("setTitle(\"Field Notes\")"));
  assert.ok(coursesScreen.includes("Set new work type to ${option === \"exam\" ? \"Exam\" : \"Assignment\"}"));

  assert.ok(monthlyCalendar.includes("captureState !== \"calendar-filtered\""));
  assert.ok(monthlyCalendar.includes("setCourseFilterId(courseId)"));

  assert.ok(widgetShowcase.includes("captureState === \"widget-empty\""));
  assert.ok(widgetShowcase.includes("captureState === \"widget-needs-check\""));
});
