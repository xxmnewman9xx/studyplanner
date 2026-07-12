import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

function componentSource(name, nextName) {
  const start = appSource.indexOf(`function ${name}(`);
  const end = appSource.indexOf(`function ${nextName}(`, start + 1);
  assert(start >= 0 && end > start, `${name} component must be present`);
  return appSource.slice(start, end);
}

const classes = componentSource("Classes", "ClassDetail");
const classDetail = componentSource("ClassDetail", "Tasks");
const today = componentSource("Today", "Stat");
const taskDetail = componentSource("TaskDetail", "AssessmentDetail");
const assessmentDetail = componentSource("AssessmentDetail", "Scan");
const scan = componentSource("Scan", "ScannerModeBadge");
const cameraScanner = componentSource("CameraScanner", "GuidedScannerDemoSurface");
const reviewImport = componentSource("ReviewImport", "ApplySuccess");
const applySuccess = componentSource("ApplySuccess", "SkeletonLine");
const plan = componentSource("Plan", "StudySession");
const studySession = componentSource("StudySession", "Notes");
const noteDetail = componentSource("NoteDetail", "NativeHomeWidgetPreview");
const widgets = componentSource("WidgetsScreen", "Profile");

assert.match(today, /const firstBlock = liveData\.studyBlocks\.find\(\(block\) => !block\.completed\)/, "Today must select the first persisted incomplete focus block");
assert.doesNotMatch(today, /data\.studyBlocks\[0\]/, "Today must not reopen a completed first focus block");
assert.match(today, /const rebuilt = buildStudyPlan\(liveData\)/, "Start Focus must rebuild from the active planner when no block is stored");
assert.match(today, /studyBlocks: rebuilt[\s\S]*nav\.push\("studySession", \{ id: rebuilt\[0\]\.id \}\)/, "Start Focus must persist and open the exact rebuilt block");
assert.match(today, /if \(!rebuilt\.length\)[\s\S]*nav\.tab\("scan"\)/, "Start Focus must use Scan as the truthful empty-plan fallback");

for (const [name, source] of [["Scan", scan], ["CameraScanner", cameraScanner]]) {
  assert.match(source, /textFor\("scan\.photo_library", "photo library"\)/, `${name} must localize the photo-library target`);
  assert.match(source, /Alert\.alert\(textFor\("scan\.photo_permission_title", "Photo access is needed"\)/, `${name} must use a complete localized permission title`);
  assert.doesNotMatch(source, /textFor\("scan\.permission", "Permission needed", \{ mode: "", target: "" \}\)/, `${name} must not render a permission title with blank interpolation`);
}
assert.doesNotMatch(appSource, /permissions\.photo_library/, "Photo permission copy must not use an undefined runtime key");
assert.match(appSource, /const PHOTO_PERMISSION_COPY: Record<SupportedLocale/, "Photo permission title and target must have explicit runtime localization coverage");

assert.match(reviewImport, /flexWrap: "wrap"[\s\S]*minWidth: 88[\s\S]*\{metric\.label\}/, "Review summary metrics must wrap into a readable adaptive grid");
assert.doesNotMatch(reviewImport, /adjustsFontSizeToFit|minimumFontScale|numberOfLines=\{2\}[\s\S]*\{metric\.label\}/, "Review summary labels must wrap instead of shrinking or truncating");
assert.match(reviewImport, /label=\{textFor\("review\.approve", "Approve trusted"\)\}[^\n]+highConfidenceCount/, "Review trusted-item CTA must keep a readable label and disable at zero trusted items");
assert.match(reviewImport, /textFor\("review\.existing_found", "Existing item found"\)/, "Reconciliation rows must distinguish an existing match from low-confidence extraction");
assert.match(reviewImport, /return trusted \? \{ \.\.\.candidate, approved: true \} : candidate;/, "Approve trusted must preserve manual approval choices on non-trusted rows");
assert.match(reviewImport, /textFor\("review\.apply", "Apply approved items \(\{count\}\)", \{ count: approvedCount \}\)/, "Review apply CTA must disclose the exact approved row count without claiming a content type");

assert.match(widgets, /const widgetsUpToDate = manualSyncStatus\?\.state === "synced";/, "Only a current confirmed native sync may claim widgets are up to date");
assert.doesNotMatch(widgets, /Boolean\(data\.prefs\.widgetLastSyncedAt\)/, "A historical widget timestamp must not claim current sync truth");
assert.doesNotMatch(widgets, /updateWidgetPrefs\(\{ osLive: true \}\)/, "Widget sync must not claim OS-live before native confirmation");
assert.match(widgets, /if \(status\.state === "synced"\) \{[\s\S]*updateWidgetPrefs\(\{ osLive: true, widgetLastSyncedAt: status\.updatedAt \|\| new Date\(\)\.toISOString\(\) \}\)/, "Widget sync must persist live state only after native confirmation");
assert.match(widgets, /else \{\s*updateWidgetPrefs\(\{ osLive: false, widgetLastSyncedAt: undefined \}\)/, "Resolved widget sync failures must invalidate historical evidence");
assert.match(appSource, /const status = await syncNativeWidgets\(widgetSyncData, widgetCopyFor, storefrontLocale\(\)\);\s*if \(status\.state !== "synced"\)/, "automatic localized widget sync must inspect resolved failure states");
assert.doesNotMatch(widgets, /data\.prefs\.premium \? textFor\("widgets\.ready", "ready"\)/, "Unlocked widget previews must not be labeled synced before native confirmation");
assert.match(applySuccess, /nav\.push\("widgets"\)/, "Apply Success must push Widgets so Back has a real route");
assert.doesNotMatch(applySuccess, /nav\.tab\("widgets"\)/, "Widgets must not be installed as a hidden tab root");
assert.match(appSource, /setTab\("today"\);\s*setStack\(\[unlockDestination\]\)/, "widget-directed unlock must keep Today beneath the Widgets route");

assert.match(plan, /const dateForDay = \(day: number\) => new Date\(today\.getFullYear\(\), today\.getMonth\(\), day, 12, 0, 0\)/, "Plan must create selected dates in the local calendar");
assert.doesNotMatch(plan, /new Date\(isoForDay\(day\)\)|new Date\(selectedIso\)/, "Plan must not parse date-only keys as UTC");
assert.match(plan, /pruneOrphanedStudyBlocks\(buildStudyPlan\(next\), tasks, d\.exams\)/, "Plan task completion must rebuild and prune study blocks");
assert.match(plan, /const canMarkMissed = canMarkStudyBlockMissed\(b\)/, "Plan must gate missed repair on elapsed incomplete blocks");
assert.match(plan, /if \(!currentBlock \|\| !canMarkStudyBlockMissed\(currentBlock\)\) return d;/, "missed repair must recheck current block eligibility inside the mutation");
assert.match(plan, /\{canMarkMissed \? <Pressable[^\n]+plan\.missed/, "Plan must hide missed repair when the block is ineligible");
assert.doesNotMatch(plan, /<Play color=/, "Plan completion checkbox must not use a Play icon");

assert.match(classDetail, /addingWork === "exam" && missingDate/, "assessment creation must require a real date");
assert.match(classDetail, /addingWork === "exam" \|\| workDraft\.dueDate\.trim\(\)/, "assessment create copy must never claim an awaiting date");
assert.match(classDetail, /const classTasks = data\.tasks\.filter/, "class deletion must count open and completed work");
assert.match(classDetail, /tasks: classTasks\.length/, "class deletion copy must disclose every assignment it removes");
assert.match(classDetail, /including completed work/, "class deletion copy must explicitly disclose completed history");
assert.match(classes, /\{adding \? <X[^\n]+: <Plus/, "Manage Semester header must switch from Plus to Close glyph with its expanded state");

for (const [name, source] of [["TaskDetail", taskDetail], ["AssessmentDetail", assessmentDetail], ["StudySession", studySession], ["NoteDetail", noteDetail]]) {
  assert.doesNotMatch(source, /safeClassFor\(/, `${name} must not fall back to an unrelated class`);
  assert.match(source, /data\.classes\.find\(/, `${name} must resolve its owner class explicitly`);
  assert.match(source, /<RecoveryScreen[^>]+class\.not_found/s, `${name} must recover when its owner class is missing`);
}
assert.doesNotMatch(taskDetail, /classId: task\?\.classId \|\| data\.classes\[0\]/, "task editing must not seed an unrelated class");
assert.doesNotMatch(assessmentDetail, /classId: exam\?\.classId \|\| data\.classes\[0\]/, "assessment editing must not seed an unrelated class");

assert.match(taskDetail, /const canAddStudyBlock = !task\.done && hasTaskDate\(task\)/, "study-block controls must be disabled for completed or undated tasks");
assert.match(taskDetail, /if \(!currentTask \|\| currentTask\.done \|\| !hasTaskDate\(currentTask\)\) return d;/, "study-block mutation must recheck task eligibility");
assert.match(taskDetail, /buildStudyPlan\(\{ \.\.\.d, tasks: \[currentTask\] \}\)/, "study-block mutation must generate against the selected task instead of the global top-twelve window");
assert.match(taskDetail, /if \(!regeneratedBlocks\.length\) return d;/, "study-block mutation must not record feedback when nothing was scheduled");
assert.match(taskDetail, /textFor\("task\.update_recurring_title", "Update recurring work\?"\)/, "recurring Save must use update copy");
assert.match(appSource, /showSimulatorCapturePrompt[\s\S]*textFor\("task\.update_recurring_title", "Update recurring work\?"\)/, "recurrence prompt capture must use update copy");
assert.match(taskDetail, /deleteTaskWithScope[\s\S]*textFor\("task\.delete_recurring_body"/, "recurring Delete must retain deletion copy");

assert.doesNotMatch(studySession, /Recall score|study\.recall_score|setScore\(/, "focus sessions must not infer a recall score from response length");
assert.match(studySession, /const responseWordCount =/, "focus sessions must expose a truthful response metric");
assert.doesNotMatch(studySession, /subtasks:.*i === 0/s, "focus completion must not silently complete the first subtask");
assert.match(studySession, /if \(!currentBlock \|\| currentBlock\.completed\) return d;/, "focus completion feedback must be idempotent");
assert.match(studySession, /onPress=\{block\.completed \? undefined :/, "completed focus sessions must disable their completion control");
assert.match(studySession, /if \(!finish\(\)\) return; recordReviewTrigger\("focus_completed"\); nav\.back\(\)/, "focus sessions must navigate back only after a successful finish");

assert.match(scan, /On-device text scan is unavailable here\. Paste text to continue\./, "unavailable OCR copy must not claim disabled camera/photo controls are ready");
assert.match(cameraScanner, /const readyScore = \(permission\?\.granted \? 30 : 0\) \+ \(cameraReady \? 35 : 0\) \+ \(captureState === "aiming" \|\| captureState === "ready" \? 35 : 0\);/, "camera readiness must reach full score without requiring torch");
assert.doesNotMatch(cameraScanner, /const readyScore = [^;]*torch/, "torch must remain optional evidence");
assert.match(cameraScanner, /accessibilityRole="switch"[^\n]+accessibilityState=\{\{ checked: torch/, "torch must expose its independent switch state");
assert.match(cameraScanner, /scanner\.torch_optional[^\n]+active=\{torch\}/, "scanner checklist must label torch as optional and reflect only torch state");

assert.match(noteDetail, /Tomorrow|localizedDueLabel\(1\)/, "note task controls must disclose tomorrow before creation");
assert.match(noteDetail, /7:00 PM/, "note task controls must disclose the scheduled time before creation");
assert.match(noteDetail, /urgentLabel/, "note task controls must disclose urgency before creation");
assert.match(noteDetail, /alreadyAdded.*disabled=\{alreadyAdded\}/s, "suggested note tasks must visibly disable after being added");
assert.match(noteDetail, /reviewTaskAdded \? undefined/, "the generated review-task button must disable after being added");
assert.match(noteDetail, /, \.\.\.d\.tasks\]/, "adding a note task must preserve existing tasks");

if (!process.argv.includes("--new-york-probe")) {
  const probe = spawnSync(process.execPath, [new URL(import.meta.url).pathname, "--new-york-probe"], {
    encoding: "utf8",
    env: { ...process.env, TZ: "America/New_York" },
  });
  if (probe.stdout) process.stdout.write(probe.stdout);
  if (probe.stderr) process.stderr.write(probe.stderr);
  assert.equal(probe.status, 0, "America/New_York selected-date probe must pass");
  console.log("Planner interaction truth checks passed");
} else {
  const selected = new Date(2026, 6, 10, 12, 0, 0);
  assert.equal(selected.getFullYear(), 2026);
  assert.equal(selected.getMonth(), 6);
  assert.equal(selected.getDate(), 10, "local calendar construction must keep July 10 selected in New York");
  assert.equal(new Date("2026-07-10").getDate(), 9, "probe must reproduce the UTC date-only shift that Plan avoids");
  console.log("America/New_York selected-date probe passed");
}
