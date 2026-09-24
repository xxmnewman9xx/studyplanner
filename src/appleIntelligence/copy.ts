// Copy for the StudyPlanner 2.2 on-device intelligence UI (`ai.*` keys).
//
// AI_COPY_EN is the English source of truth; every key is used by a component in
// ./ui with the same English string as its inline fallback. Translators fill the
// other nine locales in AI_COPY. Placeholders use `{name}` like App.tsx textFor.
// Keys ending in _one/_other are count variants chosen in code (count === 1).
//
// "Apple Intelligence" appears only in two Profile settings strings
// (ai.status.explainer, ai.status.not_enabled_body), referentially, and stays in
// English in every locale per the trademark rules in MASTER_PLAN.md §A3.
import type { AIText } from "./ui/theme";
import ar22 from "./locales/ar";
import de22 from "./locales/de";
import es22 from "./locales/es";
import fr22 from "./locales/fr";
import hi22 from "./locales/hi";
import ja22 from "./locales/ja";
import ko22 from "./locales/ko";
import ptBR22 from "./locales/pt-BR";
import zhHans22 from "./locales/zh-Hans";

export type SupportedLocaleString = "ar" | "de" | "en-US" | "es" | "fr" | "hi" | "ja" | "ko" | "pt-BR" | "zh-Hans";

export const AI_SUPPORTED_LOCALES: SupportedLocaleString[] = ["ar", "de", "en-US", "es", "fr", "hi", "ja", "ko", "pt-BR", "zh-Hans"];

export const AI_COPY_EN: Record<string, string> = {
  // badge
  "ai.badge.a11y": "Generated on this iPhone",
  "ai.badge.label": "On-device",

  // brief
  "ai.brief.due_in": "due in {count} days",
  "ai.brief.due_today": "due today",
  "ai.brief.due_tomorrow": "due tomorrow",
  "ai.brief.exam_in": "exam in {count} days",
  "ai.brief.exam_today": "exam today",
  "ai.brief.exam_tomorrow": "exam tomorrow",
  "ai.brief.kicker": "STUDY NOW",
  "ai.brief.later": "Later",
  "ai.brief.later_hint": "Moves this to a later block. Your plan adjusts.",
  "ai.brief.start": "Start",
  "ai.brief.start_hint": "Starts a focus session for this",

  // class
  "ai.class.alias": "Class {number}",
  "ai.class.unknown": "Class",

  // common
  "ai.common.cancel": "Cancel",
  "ai.common.dismiss": "Dismiss",
  "ai.common.done": "Done",

  // count
  "ai.count.classes_one": "1 class",
  "ai.count.classes_other": "{count} classes",
  "ai.count.deadlines_one": "1 deadline",
  "ai.count.deadlines_other": "{count} deadlines",
  "ai.count.exams_one": "1 exam",
  "ai.count.exams_other": "{count} exams",
  "ai.count.nothing": "nothing due",
  "ai.count.separator": ", ",
  "ai.count.tasks_one": "1 assignment",
  "ai.count.tasks_other": "{count} assignments",

  // duel
  "ai.duel.beat": "Beat {score}/{total}",
  "ai.duel.free": "Free to play. No account needed.",
  "ai.duel.heading": "{name}'s challenge",
  "ai.duel.heading_anon": "A classmate's challenge",
  "ai.duel.kicker": "QUIZ DUEL",
  "ai.duel.questions_one": "1 question",
  "ai.duel.questions_other": "{count} questions",
  "ai.duel.start": "Start the duel",

  // exam
  "ai.exam.add_notes": "Add notes",
  "ai.exam.blocks_cta": "Review proposal",
  "ai.exam.blocks_detail": "{count} × {duration} before {date}. You confirm first.",
  "ai.exam.blocks_title": "Add extra review blocks",
  "ai.exam.cards_mastered": "cards mastered",
  "ai.exam.countdown_one": "1 day until the exam",
  "ai.exam.countdown_other": "{count} days until the exam",
  "ai.exam.countdown_past": "This exam has passed",
  "ai.exam.countdown_today": "Exam is today",
  "ai.exam.coverage": "Coverage",
  "ai.exam.duel": "Challenge a friend",
  "ai.exam.duel_detail": "Send a Quiz Duel. Playing it is free.",
  "ai.exam.integrity": "Practice from your own notes. Not for graded work.",
  "ai.exam.kicker": "EXAM MODE",
  "ai.exam.mastered_value": "{done}/{total}",
  "ai.exam.no_notes_body": "Flashcards and quizzes are built only from your own notes, each one citing the line it came from.",
  "ai.exam.no_notes_title": "Add or scan notes for this class to unlock practice",
  "ai.exam.notes_linked_one": "note linked",
  "ai.exam.notes_linked_other": "notes linked",
  "ai.exam.practice_cards": "Practice flashcards",
  "ai.exam.practice_cards_detail": "{count} cards from your notes",
  "ai.exam.practice_quiz": "Practice quiz",
  "ai.exam.practice_quiz_detail": "Multiple choice, with the source line for every answer",
  "ai.exam.ring_day_one": "day left",
  "ai.exam.ring_days_other": "days left",
  "ai.exam.ring_past": "done",
  "ai.exam.ring_today": "today",
  "ai.exam.weak_hint": "Practice this topic",
  "ai.exam.weak_locked": "Weak topics appear after {count} answers",
  "ai.exam.weak_none": "No weak spots right now. Keep practicing to stay sharp.",
  "ai.exam.weak_progress": "{done} of {total}",
  "ai.exam.weak_ratio": "{misses}/{attempts} missed",
  "ai.exam.weak_title": "Weak topics",

  // forecast
  "ai.forecast.class_pack": "Class Pack",
  "ai.forecast.class_pack_hint": "Share a class's dates with classmates",
  "ai.forecast.empty_body": "Import a syllabus to see every crunch week this term, months early.",
  "ai.forecast.empty_cta": "Scan a syllabus",
  "ai.forecast.empty_title": "Your forecast is waiting",
  "ai.forecast.headline_none": "No crunch weeks yet",
  "ai.forecast.headline_one": "1 red week ahead",
  "ai.forecast.headline_other": "{count} red weeks ahead",
  "ai.forecast.kicker": "CRUNCH FORECAST",
  "ai.forecast.open": "See forecast",
  "ai.forecast.preview_pill": "Preview",
  "ai.forecast.range": "{start} – {end}",
  "ai.forecast.share": "Share card",
  "ai.forecast.share_hint": "Creates an image of your forecast. Class names are hidden by default.",
  "ai.forecast.toughest": "Toughest: week of {date}",
  "ai.forecast.unlock_body": "Start dates, Study Now and reminders that beat every red week.",
  "ai.forecast.unlock_cta": "Unlock my plan",
  "ai.forecast.unlock_title": "Unlock to turn this into a daily plan",

  // format
  "ai.format.hours": "{count} h",
  "ai.format.hours_minutes": "{hours} h {minutes} min",
  "ai.format.minutes": "{count} min",

  // heatmap
  "ai.heatmap.cell_a11y": "Week of {date}, {level}, {items}",
  "ai.heatmap.cell_hint": "Shows this week's deadlines",
  "ai.heatmap.empty_week": "Nothing due this week. A good week to get ahead.",
  "ai.heatmap.legend_a11y": "Color scale from calm to crunch. The dashed square is this week.",
  "ai.heatmap.more": "+{count} more",
  "ai.heatmap.this_week": "this week",
  "ai.heatmap.week_of": "Week of {date}",
  "ai.heatmap.weight_a11y": "{weight} of grade",

  // kind
  "ai.kind.exam": "Exam",
  "ai.kind.task": "Assignment",

  // level
  "ai.level.busy": "busy",
  "ai.level.calm": "calm",
  "ai.level.crunch": "crunch",
  "ai.level.steady": "steady",

  // origin
  "ai.origin.both": "Found twice",
  "ai.origin.both_a11y": "Found by both readers. Higher confidence.",
  "ai.origin.heuristic": "Classic reader",
  "ai.origin.heuristic_a11y": "Found by the classic reader.",
  "ai.origin.on_device": "Found on-device · verify",
  "ai.origin.on_device_a11y": "Found only by on-device AI. Check it against your syllabus before approving.",

  // pack
  "ai.pack.copied": "Copied",
  "ai.pack.copy": "Copy link",
  "ai.pack.copy_hint": "Copies the Class Pack link",
  "ai.pack.items_one": "1 date",
  "ai.pack.items_other": "{count} dates",
  "ai.pack.kicker": "CLASS PACK",
  "ai.pack.link_label": "Link",
  "ai.pack.privacy": "Only dates, titles and weights are shared — never your notes.",
  "ai.pack.qr_a11y": "QR code for the {class} Class Pack",
  "ai.pack.qr_hint": "Classmates scan this with the iPhone Camera.",
  "ai.pack.share": "Share link",
  "ai.pack.share_message": "Here are the {class} dates for StudyPlanner. Tap to import:",
  "ai.pack.too_big": "Too many items for a QR — share the link",

  // paste
  "ai.paste.body": "Paste it to get their dates in seconds. You review everything before it saves.",
  "ai.paste.cta": "Paste Class Pack",
  "ai.paste.hint": "Reads a Class Pack link from the clipboard",
  "ai.paste.title": "Got a Class Pack from a classmate?",

  // practice
  "ai.practice.again": "Again",
  "ai.practice.again_hint": "Marks this card to review again",
  "ai.practice.again_round": "Practice again",
  "ai.practice.answer": "Answer",
  "ai.practice.answer_kicker": "ANSWER",
  "ai.practice.correct": "Correct",
  "ai.practice.correct_answer": "Correct answer",
  "ai.practice.counter": "{index} of {total}",
  "ai.practice.done_cards": "DECK COMPLETE",
  "ai.practice.done_quiz": "QUIZ COMPLETE",
  "ai.practice.empty_body": "Longer notes give StudyPlanner enough to build cards and questions.",
  "ai.practice.empty_title": "Nothing to practice yet",
  "ai.practice.flip_back_hint": "Shows the question again",
  "ai.practice.flip_hint": "Reveals the answer",
  "ai.practice.got_it": "Got it",
  "ai.practice.incorrect": "Not quite",
  "ai.practice.kicker_cards": "FLASHCARDS",
  "ai.practice.kicker_quiz": "PRACTICE QUIZ",
  "ai.practice.next": "Next question",
  "ai.practice.question": "Question",
  "ai.practice.question_kicker": "QUESTION",
  "ai.practice.quote": "“{quote}”",
  "ai.practice.report": "Report wrong answer",
  "ai.practice.report_hint": "Flags this item so it is not shown again",
  "ai.practice.reported": "Thanks. This item won't be shown again.",
  "ai.practice.result_low": "Good practice. The missed ones are the ones to review.",
  "ai.practice.result_mid": "Getting there. One more round locks it in.",
  "ai.practice.result_strong": "Strong. You know this material.",
  "ai.practice.score": "{correct}/{total}",
  "ai.practice.score_a11y": "{correct} of {total} correct",
  "ai.practice.see_results": "See results",
  "ai.practice.share_score": "Share score",
  "ai.practice.share_score_hint": "Challenges a friend to beat your score with the same questions",
  "ai.practice.shared_by_classmate": "Shared by a classmate",
  "ai.practice.show_answer": "Show answer",
  "ai.practice.source": "From your note:",
  "ai.practice.source_line": "From your note, line {line}:",
  "ai.practice.tap_to_flip": "Tap to flip",
  "ai.practice.your_answer": "Your answer",

  // quick
  "ai.quick.change": "Change",
  "ai.quick.check": "Check before saving.",
  "ai.quick.check_body": "Nothing is added until you confirm.",
  "ai.quick.class_label": "Class",
  "ai.quick.class_needed": "Pick the class this belongs to.",
  "ai.quick.confirm": "Add to planner",
  "ai.quick.confirm_disabled_hint": "Fill in the highlighted fields first",
  "ai.quick.date_label": "Due",
  "ai.quick.date_needed": "Pick a due date.",
  "ai.quick.estimate_label": "Estimate",
  "ai.quick.kicker": "QUICK ADD",
  "ai.quick.title_label": "Title",
  "ai.quick.title_needed": "Add a short title (3 characters or more).",
  "ai.quick.title_placeholder": "What is due?",
  "ai.quick.today": "Today",
  "ai.quick.tomorrow": "Tomorrow",
  "ai.quick.weight_label": "Weight",

  // scan
  "ai.scan.cancel_hint": "Stops reading. Items found so far are kept for review.",
  "ai.scan.document_reader": "Reading tables on this iPhone",
  "ai.scan.done": "Done · {found}",
  "ai.scan.found_one": "1 found",
  "ai.scan.found_other": "{count} found",
  "ai.scan.progress": "Page {page} of {count} · {found}",

  // share
  "ai.share.cry_headline": "the week I'm going to cry",
  "ai.share.cry_kicker": "my phone found",
  "ai.share.footer": "Made with StudyPlanner",
  "ai.share.headline_none": "No red weeks this term",
  "ai.share.headline_one": "1 red week this term",
  "ai.share.headline_other": "{count} red weeks this term",

  // startby
  "ai.startby.before_week": "before the week of {date}",
  "ai.startby.more_locked_one": "1 more start date in your plan",
  "ai.startby.more_locked_other": "{count} more start dates in your plan",
  "ai.startby.prep": "{duration} prep",
  "ai.startby.row": "Start {class} on {date}",
  "ai.startby.row_noclass": "Start prep on {date}",
  "ai.startby.row_today": "Start {class} today",
  "ai.startby.row_today_noclass": "Start prep today",
  "ai.startby.title": "Start by",

  // status
  "ai.status.classic": "Classic engine",
  "ai.status.clear": "Clear on-device AI data",
  "ai.status.clear_hint": "Deletes cached study sets, briefs and practice history on this iPhone. Your planner is not affected.",
  "ai.status.device": "Your iPhone uses the classic engine. Everything still works.",
  "ai.status.downloading": "Downloading on-device model…",
  "ai.status.downloading_body": "The classic engine works until it's ready.",
  "ai.status.explainer": "Uses Apple Intelligence on supported iPhones",
  "ai.status.locale": "On-device AI isn't available in this language yet. The classic engine is on.",
  "ai.status.not_enabled": "On-device AI is off in Settings",
  "ai.status.not_enabled_body": "Turn on Apple Intelligence in Settings for smarter extraction and quizzes.",
  "ai.status.off": "On-device AI: Off",
  "ai.status.off_body": "The classic engine is on. Turn this back on anytime.",
  "ai.status.on": "On-device AI: On",
  "ai.status.on_body": "Smarter extraction, daily briefs and quizzes run privately on this iPhone.",
  "ai.status.switch": "Use on-device AI",

  // type
  "ai.type.assignment": "Assignment",
  "ai.type.exam": "Exam",
  "ai.type.final": "Final",
  "ai.type.lab": "Lab",
  "ai.type.midterm": "Midterm",
  "ai.type.presentation": "Presentation",
  "ai.type.project": "Project",
  "ai.type.quiz": "Quiz",
  "ai.type.reading": "Reading",

  // unlock
  "ai.unlock.body": "Unlock to turn it into a daily plan",
  "ai.unlock.kicker": "YOUR CRUNCH FORECAST",
  "ai.unlock.red_one": "1 red week",
  "ai.unlock.red_other": "{count} red weeks",
  "ai.unlock.starts": "starts {date}",
};


// 2.2 copy used directly by App.tsx screens (onboarding, scan, locked preview,
// paywall, and the integration surfaces). Same translation workflow as ai.*.
export const APP22_COPY_EN: Record<string, string> = {
  "locked.free_card_title": "Scan every class. See the semester coming.",
  "locked.free_kicker": "FREE SEMESTER SCAN",
  "locked.free_step1": "Scan, upload, paste, or add each class",
  "locked.free_step2": "Review every deadline StudyPlanner finds",
  "locked.free_step3": "See your crunch weeks, then unlock the daily plan",
  "locked.free_sub": "Scan every syllabus for free. Review each deadline and see your crunch weeks before you decide.",
  "locked.scan_another": "Scan another syllabus",
  "locked.scan_free": "Scan a syllabus free",
  "onboarding.free_first": "Start with one syllabus. See every deadline and your crunch weeks for free — nothing saves until you review it.",
  "onboarding.free_scan_body": "Scan or add every class. StudyPlanner reads them on this iPhone, lists every deadline for review, and forecasts your red weeks. Unlock when you want the daily plan.",
  "onboarding.free_scan_title": "Free: see your whole semester.",
  "onboarding.start_manual": "Add my first class",
  "onboarding.start_paste": "Paste my syllabus",
  "onboarding.start_pdf": "Upload my syllabus",
  "onboarding.start_scan": "Scan my syllabus",
  "paywall.benefit_cram": "Finals cram: a focused week of plans and practice.",
  "paywall.free_scan_body": "Scan every syllabus and see your Crunch Forecast for free. Plus applies the reviewed plan to Today, widgets, reminders, Exam Mode, and Siri.",
  "paywall.free_scan_methods": "Scan · Review · Forecast · Daily plan",
  "paywall.free_scan_title": "Scan free. Plan with Plus.",
  "paywall.free_trial_badge": "{days} days free",
  "paywall.free_trial_cta": "Start {days}-day free trial",
  "paywall.free_trial_summary": "{days} days free, then {price}/{plan}. Auto-renews until canceled.",
  "paywall.plus_exam_mode": "Exam Mode: flashcards and quizzes from your own notes",
  "paywall.plus_kicker": "PLUS TURNS YOUR SEMESTER INTO A DAILY PLAN",
  "paywall.plus_reminders": "Start-by reminders before every crunch week",
  "paywall.plus_siri": "Siri, Spotlight, and quick add",
  "paywall.plus_study_now": "Study Now: one clear move every day, self-repairing",
  "paywall.plus_widgets": "Lock Screen and Home Screen widgets",
  "paywall.step_forecast": "Forecast",
  "paywall.step_free": "free",
  "paywall.step_plan": "Daily plan",
  "paywall.step_plus": "Plus",
  "paywall.step_scan": "Scan",
  "paywall.sub_free_first": "Scanning and your Crunch Forecast stay free. Plus applies the plan and keeps it running every day.",
  "scan.badge_free": "Free",
  "scan.sub_free": "Free to scan and review",
  "scan.title_free": "Scan every class. See the semester.",
  "paywall.no_caps": "No credits. No caps. No account. It runs on your iPhone.",
  // 2.2 integration copy, plus Build 90 keys that previously had no table entry
  // (non-English locales fell back to a generic string for these).
  "ai.source.on_device": "Found on-device, reviewed by you",
  "ai.source.class_pack": "Class Pack",
  "ai.source.exam_mode": "Exam Mode review",
  "ai.share.message": "My semester, forecast by StudyPlanner. Which week is yours?",
  "storage.safe_body": "StudyPlanner could not open your saved planner. Nothing was replaced—try again when storage is available.",
  "storage.widget_retry": "Planner changes are saved, but widgets have not refreshed yet.",
  "storage.save_retry": "Changes are safe in this session but could not be saved to this device yet.",
  "scan.quick_error_heading": "Fast capture needs more detail",
  "ai.quick.invalid": "Pick a class and a real due date, then try again.",
  "ai.pack.source": "Class Pack · {code}",
  "ai.paste.none_title": "No Class Pack found",
  "ai.paste.none_body": "Copy the Class Pack link your classmate sent, then tap Paste again.",
  "storage.safe_title": "Your planner is still safe",
  "common.try_again": "Try again",
  "note.accessibility_open_hint": "Open note details",
  "onboarding.build_title_personal": "Build {name}'s semester.",
  "legal.open_full_privacy": "Open full privacy policy",
  "accessibility.back_hint": "Return to the previous screen",
  "paywall.accessibility_plan_hint": "Select the weekly subscription plan",
  "paywall.accessibility_restore_hint": "Check this store account for an active subscription",
  "paywall.accessibility_terms_hint": "Open the subscription terms",
  "paywall.accessibility_privacy_hint": "Open the privacy policy",
  "paywall.accessibility_support_hint": "Open StudyPlanner support",
  "profile.accessibility_open_hint": "Open profile and app settings",
  "today.accessibility_next_class_hint": "Open the next class",
  "today.accessibility_add_work_hint": "Open import and quick add",
  "today.accessibility_plan_hint": "Open your semester plan",
  "notes.accessibility_open_hint": "Open notes and study assets",
  "tasks.accessibility_open_hint": "Open assignments to add due dates",
  "today.accessibility_risk_hint": "Open the related planner detail",
  "assessment.accessibility_open_hint": "Open assessment details",
  "class.accessibility_open_hint": "Open class details",
  "classes.accessibility_close_form_hint": "Close the add class form",
  "classes.accessibility_add_form_hint": "Open the add class form",
  "classes.accessibility_restore_hint": "Return this class to the active semester",
  "class.accessibility_close_edit_hint": "Close class editing",
  "class.accessibility_edit_hint": "Edit class details",
  "ai.pack.class_title": "Share Class Pack",
  "ai.pack.class_hint": "Share this class's deadlines as a link or QR code",
  "ai.pack.class_body": "Classmates get every {code} deadline in seconds.",
  "class.accessibility_repeat_hint": "Toggle weekly recurrence for this assignment",
  "task.accessibility_move_class_hint": "Move this assignment to the selected class",
  "task.accessibility_reopen_subtask_hint": "Mark this subtask incomplete",
  "task.accessibility_complete_subtask_hint": "Mark this subtask complete",
  "assessment.accessibility_move_class_hint": "Move this assessment to the selected class",
  "scan.quick_error_input": "Type the task, its class, and an explicit due date.",
  "ai.quick.saved": "Saved and added to your plan.",
  "import.source_paste": "Pasted syllabus",
  "review.add_another_hint": "Scan, upload, or paste another syllabus into this review",
  "review.add_another": "Add another class",
  "success.metric_30d": "30d",
  "success.first_focus_kicker": "FIRST FOCUS BLOCK",
  "success.start_focus": "Start first focus block",
  "success.widgets_kicker": "RECOMMENDED WIDGET",
  "success.calendar_widget_title": "Semester calendar widget",
  "success.calendar_widget_body": "See this week, exam markers, and pressure days before opening the app.",
  "success.set_up_widgets": "Set up widgets",
  "plan.accessibility_select_day_hint": "Show planner items for this day",
  "plan.accessibility_missed_hint": "Move this missed focus block to tomorrow",
  "notes.accessibility_filter_hint": "Filter notes by this class",
  "note.delete_title": "Delete note?",
  "note.delete_body": "{title} and its generated study assets will be removed. Tasks you already added will stay in your planner.",
  "note.delete": "Delete note",
  "ai.note.practice_kicker": "PRACTICE FROM THIS NOTE",
  "ai.note.practice_body": "Cards and questions come only from this note, each with the line it came from.",
  "ai.note.practice_cards": "Flashcards",
  "ai.note.practice_cards_hint": "Practice flashcards made from this note",
  "ai.note.practice_quiz": "Quiz me",
  "ai.note.practice_quiz_hint": "Answer practice questions made from this note",
  "note.accessibility_added_hint": "This task is already in your planner",
  "note.accessibility_add_hint": "Add this task to your planner",
  "ai.exam.entry_kicker": "EXAM MODE",
  "ai.exam.entry_today": "{title} is today",
  "ai.exam.entry_title": "{title} in {days} days",
  "ai.exam.entry_body": "Flashcards and practice questions from your own notes. Every one cites its source line.",
  "ai.exam.entry_cta": "Open Exam Mode",
  "ai.exam.entry_hint": "Practice for this exam from your own notes",
  "assessment.missing_title": "Assessment not found",
  "assessment.missing_body": "This exam may have been removed.",
  "ai.exam.review_confirm_title": "Add {count} review sessions?",
  "ai.exam.review_confirm_body": "StudyPlanner adds short review tasks for your weakest topics before the exam. You can edit or delete them anytime.",
  "ai.exam.review_confirm_action": "Add to plan",
  "ai.exam.review_task_title": "Review: {topic}",
  "ai.exam.review_task_body": "Extra review before {exam}: practice from your own notes.",
  "ai.exam.nav_title": "Exam Mode",
  "ai.practice.title": "Practice",
  "ai.duel.share_message": "I scored {score}/{total} on {title}. Beat me:",
  "ai.practice.preparing": "Building practice from your notes on this iPhone…",
  "ai.practice.start_now": "Start with quick cards",
  "ai.practice.start_now_hint": "Skips on-device generation and starts right away",
  "ai.practice.reported_title": "Thanks for flagging it",
  "ai.practice.reported_body": "That item is hidden from this session. Check it against your notes.",
  "ai.duel.invalid_title": "This challenge can't be opened",
  "ai.duel.invalid_body": "The link may be incomplete. Ask your classmate to share it again.",
  "ai.duel.nav_title": "Quiz Duel",
  "ai.forecast.nav_title": "Crunch Forecast",
  "ai.pack.section_kicker": "SHARE A CLASS PACK",
  "ai.pack.section_body": "Classmates get the same deadlines in seconds. Only dates, titles and weights are shared.",
  "ai.pack.share_class": "Share {code} Class Pack",
  "widgets.row_week_calendar_body": "Week load, exam markers, and pressure days",
  "widgets.row_today_short": "Today",
  "widgets.sync_error": "Widget sync needs attention.",
  "widgets.syncing": "Syncing...",
  "widgets.source_classes": "{count} classes",
  "widgets.source_deadlines": "{count} deadlines",
  "widgets.no_focus": "No class yet",
  "widgets.live_preview": "Recommended widgets",
  "widget_snapshot.all_classes": "All classes",
  "ai.status.clear_confirm_title": "Clear on-device AI data?",
  "ai.status.clear_confirm_body": "Removes generated study sets, practice history, and cached results from this iPhone. Your classes, tasks, and notes stay.",
  "ai.status.clear_action": "Clear",
  "profile.google_play": "Google Play",
  "profile.accessibility_manage_hint": "Open subscription management for this store account",
  "profile.accessibility_unlock_hint": "Open StudyPlanner subscription options",
  "profile.accessibility_row_hint": "Open this setting",
};

/** Every 2.2 English string (ai.* + App.tsx 2.2 keys); translators mirror these keys. */
export const COPY_22_EN: Record<string, string> = { ...AI_COPY_EN, ...APP22_COPY_EN };

export const AI_COPY: Record<SupportedLocaleString, Partial<Record<string, string>>> = {
  "en-US": COPY_22_EN,
  ar: ar22,
  de: de22,
  es: es22,
  fr: fr22,
  hi: hi22,
  ja: ja22,
  ko: ko22,
  "pt-BR": ptBR22,
  "zh-Hans": zhHans22,
};

function resolveLocale(locale: string): SupportedLocaleString {
  if ((AI_SUPPORTED_LOCALES as string[]).includes(locale)) return locale as SupportedLocaleString;
  const lower = locale.toLowerCase();
  if (lower.startsWith("zh")) return "zh-Hans";
  if (lower.startsWith("pt")) return "pt-BR";
  if (lower.startsWith("en")) return "en-US";
  const base = lower.split(/[-_]/)[0];
  return AI_SUPPORTED_LOCALES.find((candidate) => candidate.toLowerCase() === base) || "en-US";
}

/**
 * Reference `t` for the gallery, tests and web QA: locale table -> English
 * source -> inline fallback, then `{var}` interpolation. The app can pass its
 * own textFor-backed function instead, as long as it has the same signature.
 */
export function createAIText(locale: string): AIText {
  const table = AI_COPY[resolveLocale(locale)];
  return (key, fallback, vars = {}) => {
    const template = table[key] ?? COPY_22_EN[key] ?? fallback;
    return template.replace(/\{(\w+)\}/g, (_match, name: string) => String(vars[name] ?? ""));
  };
}
