import { readFileSync } from "node:fs";

const catalog = JSON.parse(readFileSync("localized-app-strings/core-launch-strings.json", "utf8"));
const sourceFiles = {
  app: readFileSync("App.tsx", "utf8"),
  i18n: readFileSync("src/i18n.tsx", "utf8"),
  today: readFileSync("src/screens/TodayScreen.tsx", "utf8"),
  plan: readFileSync("src/screens/PlanScreen.tsx", "utf8"),
  courses: readFileSync("src/screens/CoursesScreen.tsx", "utf8"),
  focus: readFileSync("src/screens/FocusScreen.tsx", "utf8"),
  grades: readFileSync("src/screens/GradesScreen.tsx", "utf8"),
  onboarding: readFileSync("src/screens/OnboardingScreen.tsx", "utf8"),
  importScreen: readFileSync("src/screens/ImportScreen.tsx", "utf8"),
  paywall: readFileSync("src/screens/UpgradeScreen.tsx", "utf8"),
  modeToggle: readFileSync("src/components/ModeToggle.tsx", "utf8"),
  widgets: readFileSync("src/screens/MoreScreen.tsx", "utf8"),
  widgetSnapshot: readFileSync("src/services/widgetSnapshot.ts", "utf8"),
  appleComponents: readFileSync("src/components/AppleComponents.tsx", "utf8")
};

const requiredLocales = ["ar", "de", "en-US", "es", "fr", "hi", "ja", "ko", "pt-BR", "zh-Hans"];
const requiredKeys = [
  "brand_name",
  "brand_subtitle",
  "app.loading",
  "common.next",
  "theme.appearance",
  "theme.appearance_mode",
  "theme.light",
  "theme.dark",
  "theme.use_light_mode",
  "theme.use_dark_mode",
  "tabs.today",
  "tabs.scan",
  "tabs.calendar",
  "tabs.classes",
  "tabs.notes",
  "tabs.focus",
  "tabs.grades",
  "tabs.widgets",
  "tabs.plus",
  "onboarding.scan_title",
  "onboarding.scan_copy",
  "onboarding.review_title",
  "onboarding.review_copy",
  "onboarding.calendar_title",
  "onboarding.calendar_copy",
  "onboarding.today_title",
  "onboarding.today_copy",
  "onboarding.classes_title",
  "onboarding.classes_copy",
  "onboarding.focus_title",
  "onboarding.focus_copy",
  "onboarding.widgets_title",
  "onboarding.widgets_copy",
  "onboarding.final_cta",
  "import.title",
  "import.subtitle",
  "import.subtitle_images",
  "import.photo_disabled_title",
  "import.photo_disabled_message",
  "import.review_work",
  "import.ready_to_add",
  "import.no_silent_import",
  "paywall.title",
  "paywall.subtitle",
  "paywall.hard_subtitle",
  "paywall.feature_scans",
  "paywall.feature_scans_detail",
  "paywall.feature_widgets",
  "paywall.feature_widgets_detail",
  "paywall.feature_focus",
  "paywall.feature_focus_detail",
  "paywall.feature_calendar",
  "paywall.feature_calendar_detail",
  "paywall.restore",
  "paywall.terms",
  "paywall.privacy",
  "errors.text_required",
  "errors.pdf_text_required",
  "errors.ocr_not_configured",
  "errors.parse_failed",
  "errors.try_again",
  "permissions.camera",
  "permissions.photo_library",
  "permissions.calendar",
  "permissions.notifications",
  "widgets.sync_after_load"
];
const sourceForKeyScan = Object.values(sourceFiles).join("\n");
const staticRuntimeKeys = Array.from(sourceForKeyScan.matchAll(/\bt\(\s*["']([a-z0-9_.-]+)["']/gi))
  .map((match) => match[1])
  .filter((key) => key.includes("."));
for (const key of staticRuntimeKeys) {
  if (!requiredKeys.includes(key)) requiredKeys.push(key);
}

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

assert(JSON.stringify(Object.keys(catalog).sort()) === JSON.stringify(requiredLocales.slice().sort()), "Catalog locale set must match the 10 launch locales.");

for (const locale of requiredLocales) {
  const strings = catalog[locale];
  assert(strings && typeof strings === "object", `${locale} catalog missing.`);
  assert(strings.direction === "ltr" || strings.direction === "rtl", `${locale} direction missing.`);
  if (locale === "ar") assert(strings.direction === "rtl", "Arabic must be marked RTL.");

  for (const key of requiredKeys) {
    const value = valueAtPath(strings, key);
    assert(typeof value === "string" && value.trim().length > 0, `${locale}.${key} missing or empty.`);
  }
}

assert(sourceFiles.app.includes("<I18nProvider>"), "App must wrap runtime UI in I18nProvider.");
assert(sourceFiles.app.includes("t(tab.labelKey)"), "Navigation labels must use runtime localization keys.");
assert(sourceFiles.today.includes("useI18n") && sourceFiles.today.includes("today.quick_capture"), "Today screen must consume runtime localization keys.");
assert(sourceFiles.plan.includes("useI18n") && sourceFiles.plan.includes("plan.capture_title"), "Calendar screen must consume runtime localization keys.");
assert(sourceFiles.courses.includes("useI18n") && sourceFiles.courses.includes("classes.course_hub"), "Classes screen must consume runtime localization keys.");
assert(sourceFiles.focus.includes("useI18n") && sourceFiles.focus.includes("focus.stage_kicker"), "Focus screen must consume runtime localization keys.");
assert(sourceFiles.grades.includes("useI18n") && sourceFiles.grades.includes("grades.target_calculator"), "Grades screen must consume runtime localization keys.");
assert(sourceFiles.onboarding.includes("useI18n") && sourceFiles.onboarding.includes("slide.titleKey"), "Onboarding must consume runtime localization keys.");
assert(sourceFiles.importScreen.includes("useI18n") && sourceFiles.importScreen.includes("import.photo_disabled_message"), "Import screen must consume runtime localization keys.");
assert(sourceFiles.paywall.includes("useI18n") && sourceFiles.paywall.includes("paywall.hard_subtitle"), "Paywall must consume runtime localization keys.");
assert(sourceFiles.modeToggle.includes("useI18n") && sourceFiles.modeToggle.includes("theme.use_light_mode"), "Theme mode toggle must consume runtime localization keys.");
assert(sourceFiles.widgets.includes("useI18n") && sourceFiles.widgets.includes("more.native_style_fields"), "Widget Studio must consume runtime localization keys while preserving native/widget truth copy.");
assert(sourceFiles.widgetSnapshot.includes("translate?: WidgetSnapshotTranslate") && sourceFiles.widgetSnapshot.includes("widget_snapshot.today"), "Native widget snapshot payloads must accept runtime translations.");
assert(sourceFiles.appleComponents.includes("useI18n") && sourceFiles.appleComponents.includes("widget_preview.next_caps"), "Widget previews must localize native-style fallback labels.");
assert(sourceFiles.i18n.includes("EXPO_PUBLIC_STUDYPLANNER_LOCALE"), "Localization override must exist for screenshot QA.");

const hardcodedLaunchStrings = [
  {
    file: "src/screens/TodayScreen.tsx",
    source: sourceFiles.today,
    phrases: [
      "Sample planner",
      "Replace with my syllabus",
      "Add homework before it slips.",
      "Chapter 4 notes tomorrow",
      "Add a class first.",
      "Set reminders",
      "Sync calendar",
      "Start with your syllabus.",
      "Added from Scan",
      "Due today",
      "This week",
      "No upcoming work loaded",
      "Scan another syllabus.",
      "Overdue work first",
      "Review imported work",
      "Next deadline in",
      "Open details",
      "Replan week"
    ]
  },
  {
    file: "src/screens/PlanScreen.tsx",
    source: sourceFiles.plan,
    phrases: [
      "Open selected work",
      "Open priority work",
      "Scan syllabus or paste work",
      "Add a class, then plan",
      "See your semester workload.",
      "Put new work on the selected day.",
      "BIO lab worksheet Friday",
      "Add to calendar",
      "Scan instead",
      "Survival plan",
      "Tap a day to inspect due work",
      "No due work on this day",
      "Empty plan",
      "Scan a syllabus to build your plan.",
      "Workload by day",
      "No deadlines this week",
      "Upcoming weeks",
      "Grouped by urgency",
      "Busy week detected.",
      "Week is under control."
    ]
  },
  {
    file: "src/screens/CoursesScreen.tsx",
    source: sourceFiles.courses,
    phrases: [
      "Class library",
      "Classes, rooms, notes, and open work in one place.",
      "Classes state",
      "Tap a class to see homework, teacher, room, and notes.",
      "Add your first class",
      "Homework needs a class so Today, reminders, and widgets know where it belongs.",
      "Edit details and see what is due.",
      "No linked notes yet",
      "Homework for this class",
      "No homework for this class yet.",
      "Add this class",
      "Add homework to a class",
      "HIST chapter 4 notes tomorrow",
      "Weekly schedule",
      "No classes",
      "No class library yet.",
      "Classes are carrying live work.",
      "Classes are clean right now."
    ]
  },
  {
    file: "src/screens/FocusScreen.tsx",
    source: sourceFiles.focus,
    phrases: [
      "Focus session",
      "Open work appears here",
      "No task",
      "Ready when there is a task",
      "No open assignments",
      "Choose an assignment",
      "Add or reopen an assignment",
      "Pause timer",
      "Resume timer",
      "Start timer",
      "Choose task",
      "Start the timer, add optional notes, then save the real time spent.",
      "Add an assignment to start a focus session.",
      "Retention loop",
      "Capture the thing you'll forget later.",
      "Optional notes attach to this focus block, so studying creates useful history instead of just a timer log.",
      "Recent saved notes",
      "No saved focus notes yet",
      "Saved study blocks",
      "These were saved from your busy week helper.",
      "Choose what to study",
      "The timer will be attached to this task.",
      "Add homework from Today, Scan, or Classes. When work is active, it becomes the focus queue here.",
      "Recent focus",
      "Done - save time and complete task",
      "Complete task",
      "date not set"
    ]
  },
  {
    file: "src/screens/GradesScreen.tsx",
    source: sourceFiles.grades,
    phrases: [
      "Performance dashboard",
      "Keep every class on target.",
      "Weighted categories, grade momentum, and clean what-if math before finals week.",
      "Add a course before tracking grades.",
      "Grades need a course first.",
      "Import a syllabus or add a course, then this screen will show real category weights",
      "Waiting for scores",
      "Target held",
      "Target out of reach",
      "Target pace",
      "Waiting on first grade",
      "Target-grade calculator",
      "Set the goal now.",
      "Target percent",
      "Next test what-if",
      "Next score weight",
      "graded weight",
      "still open",
      "target gap",
      "Grade weights",
      "No grade weights yet",
      "Add grade categories to this course before the calculator can weight scores.",
      "Add a grade",
      "Enter a score from a test, quiz, paper, or homework.",
      "No grade categories yet",
      "Score title",
      "Add this grade",
      "Recent grades",
      "Tap a grade if you need to fix it.",
      "No grade entries yet",
      "What this means",
      "Add one real score before StudyPlanner summarizes momentum for this class.",
      "This class has no remaining category weight in the calculator"
    ]
  },
  {
    file: "src/screens/MoreScreen.tsx",
    source: sourceFiles.widgets,
    phrases: [
      "Notes, study, grades, and settings.",
      "Open the secondary tools before you tune widgets.",
      "Widget Studio",
      "Choose widget, data, and style.",
      "Ready for Home Screen",
      "Home Screen handoff",
      "Native style fields",
      "Advanced looks stay as saved StudyPlanner presets",
      "What style?",
      "Size, privacy, class, look.",
      "What shows",
      "What data",
      "Lock Screen widgets",
      "Settings and trust",
      "Privacy mode",
      "Reminder default",
      "Widget sync",
      "Trust rules",
      "Smart Stack presets",
      "Build the daily preset set.",
      "One-tap theme packs",
      "Premium app themes",
      "Template gallery",
      "Saved presets",
      "Install status"
    ]
  },
  {
    file: "src/services/widgetSnapshot.ts",
    source: sourceFiles.widgetSnapshot,
    phrases: [
      "Demo work stays inside the app",
      "Widgets wait for real planner data",
      "Add a class first",
      "No homework in your plan yet",
      "Review a syllabus first",
      "Check imported dates",
      "Unreviewed work stays out of widgets",
      "Next deadline set",
      "No upcoming deadlines",
      "Widget sync is off",
      "No planner data shared",
      "Open Widgets settings",
      "Hidden assignment",
      "Open StudyPlanner",
      "High priority",
      "Next deadline",
      "Open Today",
      "Open Upcoming"
    ]
  },
  {
    file: "src/components/AppleComponents.tsx",
    source: sourceFiles.appleComponents,
    phrases: [
      "Open StudyPlanner to add homework.",
      "Planner data",
      "Current semester",
      "Live plan",
      "Setup",
      "1 task",
      "{count} tasks",
      "NEXT"
    ]
  },
  {
    file: "src/screens/ImportScreen.tsx",
    source: sourceFiles.importScreen,
    phrases: [
      "Plus unlocks syllabus imports",
      "Unlock Plus",
      "Step 1 · choose a source",
      "Turn a syllabus into an editable plan.",
      "Pick one path. You review every assignment before it reaches Today.",
      "Use a syllabus photo.",
      "Take a new photo or choose a saved page from your library.",
      "Take photo",
      "Choose photo",
      "Use a saved photo.",
      "Pick a clear syllabus page, worksheet, board photo, or handout image from your library.",
      "Upload a syllabus PDF.",
      "Text-based PDFs and text files work best for AI-assisted organization.",
      "Upload PDF",
      "Paste syllabus lines or assignment dates...",
      "Review pasted text",
      "Nothing is added until you confirm the review list.",
      "Reading your import",
      "Finding assignments, dates, classes, and grade weights.",
      "Recent imports",
      "Open one to review found work",
      "Review before adding",
      "Assignments",
      "Exams",
      "Projects",
      "Valid dates",
      "Trust check",
      "Fix required",
      "Editable before save",
      "Widgets use reviewed work",
      "Confirm all valid rows",
      "Fix dates before adding",
      "Review flagged items first",
      "Start over",
      "Plus required",
      "Could not parse school material",
      "Camera permission needed",
      "Type a little material",
      "Every row has a valid date and has been confirmed.",
      "invalid deadline",
      "flagged row",
      "Add at least one reviewed item before sending work to Today.",
      "Enter a real due date before this row can be confirmed.",
      "Everything from this import has already been handled.",
      "Review instructions",
      "Block study time",
      "The import could not be read.",
      "Spring 2026"
    ]
  },
  {
    file: "src/screens/UpgradeScreen.tsx",
    source: sourceFiles.paywall,
    phrases: [
      "Plus is active",
      "Opening the store",
      "Checking purchases",
      "Loading current plans",
      "Plus plans are unavailable",
      "Waiting for store plans",
      "Premium widgets, themes, imports, focus, and grade tools are unlocked on this device.",
      "Prices, trials, and renewal periods come from the store before checkout.",
      "Choose a plan below. Restore stays available.",
      "Imports",
      "Widgets",
      "App Store",
      "Manage Subscription",
      "Loading current store pricing",
      "Purchases are unavailable",
      "Apple checkout",
      "Restore purchases",
      "No account needed",
      "App Store prices, Restore Purchases, Terms, and Privacy stay visible before checkout.",
      "Privacy",
      "Terms of Use",
      "Privacy Policy",
      "Back to Plus",
      "Opening Store",
      "Choose a Plan",
      "Buy Lifetime",
      "Start Free Trial",
      "Subscribe",
      "Free trial",
      "Best value"
    ]
  },
  {
    file: "App.tsx",
    source: sourceFiles.app,
    phrases: [
      "Next deadline",
      "This is the one thing to look at first.",
      "Quick capture",
      "Add homework before it slips.",
      "planner is clean",
      "reviewed source rows",
      "Use Light mode",
      "Use Dark mode"
    ]
  },
  {
    file: "src/components/ModeToggle.tsx",
    source: sourceFiles.modeToggle,
    phrases: [
      "Appearance",
      "Appearance mode",
      "Light",
      "Dark",
      "Use Light mode",
      "Use Dark mode"
    ]
  }
];

for (const { file, source, phrases } of hardcodedLaunchStrings) {
  const searchableSource = stripLocalizedFallbacks(source);
  for (const phrase of phrases) {
    assert(
      !searchableSource.includes(phrase),
      `${file} has unlocalized launch-critical runtime string: "${phrase}".`
    );
  }
}

const englishCatalog = flattenStrings(catalog["en-US"]);
const allowedSameAsEnglishKeys = new Set([
  "direction",
  "brand_name",
  "brand_subtitle",
  "tabs.plan",
  "tabs.focus",
  "tabs.plus",
  "tabs.widgets",
  "paywall.app_store",
  "paywall.monthly",
  "paywall.product_name",
  "paywall.yearly"
]);
for (const locale of requiredLocales.filter((locale) => locale !== "en-US")) {
  const localizedValues = flattenStrings(catalog[locale]);
  for (const [key, value] of Object.entries(localizedValues)) {
    assert(!value.includes("ZZZSP"), `${locale}.${key} still contains an internal translation token.`);
    assert(
      placeholdersFor(value) === placeholdersFor(englishCatalog[key] || ""),
      `${locale}.${key} placeholder set does not match en-US.`
    );
    if (allowedSameAsEnglishKeys.has(key)) continue;
    assert(
      value !== englishCatalog[key],
      `${locale}.${key} is still identical to en-US; this is not accepted as runtime localization.`
    );
  }
}

if (failures.length) {
  console.error("Localization completeness failures:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("runtime localization completeness gate passed");

function valueAtPath(source, key) {
  return key.split(".").reduce((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return current[part];
  }, source);
}

function stripLocalizedFallbacks(source) {
  return source.replace(/\bt\(\s*["'][a-z0-9_.-]+["']\s*,\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\s*\)/gi, "t()");
}

function flattenStrings(source, prefix = "", target = {}) {
  for (const [key, value] of Object.entries(source || {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      target[path] = value;
    } else if (value && typeof value === "object") {
      flattenStrings(value, path, target);
    }
  }
  return target;
}

function placeholdersFor(value) {
  return Array.from(String(value).matchAll(/\{[^}]+\}/g))
    .map((match) => match[0])
    .sort()
    .join(",");
}
