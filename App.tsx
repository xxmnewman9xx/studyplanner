import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { File, Paths } from "expo-file-system";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image as RNImage,
	  KeyboardAvoidingView,
	  Linking,
  Platform,
	  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  View,
  ViewStyle,
	} from "react-native";
import {
  Archive,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Copy,
  Crown,
  FileText,
  Flame,
  FlaskConical,
  Globe2,
  GraduationCap,
  Grid2X2,
  HeartPulse,
  Image,
  Layers,
  Lock,
  MapPin,
  Moon,
  NotebookPen,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  ScanLine,
  Share2,
  Shield,
  Sparkles,
  Star,
  Sun,
  Target,
  Timer,
  Trash2,
  Upload,
  User,
  Wand2,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import Svg, { Circle as SvgCircle } from "react-native-svg";
import { applyImport, loadData, saveData } from "./src/storage";
import { analyzeNotes, analyzeSyllabus, buildStudyPlan, deadlineInsight } from "./src/ai";
import {
  appendFeedbackEvent,
  buildDashboardSnapshot,
  buildClassPulseBreakdowns,
  buildSemesterSnapshot,
  colorForState,
  createNaturalLanguageTask,
  daysUntilExam,
  daysUntilTask,
  generateStudyAssets,
  hasRealSemesterData,
  parseNoteInsights,
  replanAfterMissedBlock,
  suggestSmartReminders,
} from "./src/intelligence";
import { extractTextFromImage, hasNativeImageTextRecognition } from "./src/imageTextRecognition";
import { countOcrWords } from "./src/ocrText";
import { COLORS, THEMES, defaultData, formatDue, isoFromOffset, minutesLabel } from "./src/seed";
import { AppData, ClassItem, ExamItem, FeedbackEvent, HealthDimensionKey, ImportBatch, ImportCandidate, NoteItem, StudyBlock, TaskItem, ThemeId } from "./src/types";
import { buildSemesterLoop, syncNativeWidgets } from "./src/widgetEngine";
import { cancelReminderNotificationIds, scheduleLocalReminders } from "./src/reminders";
import { pickAndExtractPdf } from "./src/pdfImport";
import { clearPendingImport, loadPendingImport, savePendingImport } from "./src/pendingImport";
import { buildSemesterNarrative } from "./src/semesterNarrative";
import { resolveInitialRouteForData } from "./src/activation";
import {
  activeSemesterData,
  applyImportUpdateToData,
  applyTaskRecurrencePatch,
  classColors,
  deleteTaskRecurrence,
  findImportMatch,
  hasTaskDate,
  makeOwnershipId,
  type RecurrenceScope,
} from "./src/ownership/semesterOwnership";
import {
  PaywallPlan,
  checkStudyPlannerEntitlement,
  closeStudyPlannerStore,
  fallbackPlans,
  finishStudyPlannerPurchase,
  initializeStudyPlannerStore,
  loadStorePlans,
  purchasePlan,
  restoreStudyPlannerPurchases,
} from "./src/iap";
import {
  recordReviewEvent,
  submitReviewRating,
  type ReviewRating,
  type ReviewTrigger,
} from "./src/services/reviewPrompt";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
	  | undefined;

// Localization audit markers for this single-file runtime:
// <I18nProvider> labelForTab(tab.id, t) t(tab.labelKey

type Route =
  | "welcome"
  | "onboarding"
  | "importOptions"
  | "lockedDashboard"
  | "paywall"
  | "terms"
  | "privacy"
  | "today"
  | "classes"
  | "scan"
  | "cameraScanner"
  | "plan"
  | "tasks"
  | "notes"
  | "profile"
  | "classDetail"
  | "taskDetail"
  | "assessmentDetail"
  | "noteDetail"
  | "paste"
  | "review"
  | "success"
  | "widgets"
  | "reminders"
  | "studySession"
  | "homePreview"
  | "lockPreview";

type NavItem = { route: Route; params?: Record<string, string> };

type SupportedLocale =
  | "ar"
  | "de"
  | "en-US"
  | "es"
  | "fr"
  | "hi"
  | "ja"
  | "ko"
  | "pt-BR"
  | "zh-Hans";

type CopyVars = Record<string, string | number>;

const supportedLocales: SupportedLocale[] = ["ar", "de", "en-US", "es", "fr", "hi", "ja", "ko", "pt-BR", "zh-Hans"];

const APP_COPY: Record<SupportedLocale, Record<string, string>> = {
  "en-US": {
    "common.continue": "Continue",
    "common.cancel": "Cancel",
    "common.close": "Close",
    "common.edit": "Edit",
    "common.save": "Save",
    "common.archive": "Archive",
    "common.delete": "Delete",
    "common.restore": "Restore Purchases",
    "common.terms": "Terms",
    "common.privacy": "Privacy",
    "common.support": "Support",
    "onboarding.name_title": "What should StudyPlanner call you?",
    "onboarding.name_sub": "Let's build your semester.",
    "onboarding.name_placeholder": "Your first name",
    "onboarding.nice": "Nice, {name}.",
    "onboarding.student_kicker": "NICE, {name}",
    "onboarding.student_title": "What are you managing?",
    "onboarding.goal_title": "What do you want under control?",
    "onboarding.artifacts_title": "StudyPlanner turns your schoolwork into a live plan.",
    "onboarding.artifacts_sub": "Real app artifacts. No demo classes.",
    "onboarding.build_title": "Build your semester.",
    "onboarding.paywall_first": "Unlock first, then scan.",
    "option.school_semester": "School semester",
    "option.high_school": "High school classes",
    "option.college": "College courses",
    "option.grad": "Grad school",
    "option.online": "Online classes",
    "option.exams": "Exams",
    "option.deadlines": "Deadlines",
    "option.notes": "Notes",
    "option.grades": "Grades",
    "option.study_plan": "Study plan",
    "option.everything": "Everything",
    "option.upload_pdf": "Upload PDF",
    "option.paste_syllabus": "Paste syllabus",
    "option.scan_camera": "Scan with camera",
    "option.skip": "Skip for now",
    "locked.kicker": "LOCKED PREVIEW",
    "locked.title": "{name}, build your semester.",
    "locked.sub": "Unlock StudyPlanner first. Then scan a syllabus and apply your live plan.",
    "locked.card_kicker": "SYLLABUS AFTER UNLOCK",
    "locked.card_title": "Turn your syllabus into a live plan.",
    "locked.step1": "Unlock StudyPlanner",
    "locked.step2": "Scan syllabus",
    "locked.step3": "Review deadlines",
    "locked.scan": "Scan syllabus",
    "locked.paste": "Paste manually",
    "locked.health": "SEMESTER HEALTH",
    "locked.health_title": "Locked preview",
    "locked.health_sub": "Your score appears after your syllabus is reviewed and applied.",
    "locked.unlock": "Unlock StudyPlanner",
    "locked.after_scan": "after scan",
    "locked.workload": "Workload",
    "locked.grades": "Grades",
    "locked.preparedness": "Preparedness",
    "locked.consistency": "Consistency",
    "locked.workload_body": "Locked until your syllabus is reviewed.",
    "locked.grades_body": "Locked until real classes exist.",
    "locked.preparedness_body": "Locked until notes and exams exist.",
    "locked.consistency_body": "Locked until StudyPlanner can see your plan.",
    "scan.header_preview": "Preview syllabus",
    "scan.header": "Scan",
    "scan.sub_preview": "Preview before you unlock",
    "scan.sub": "Capture anything",
    "scan.kicker": "SYLLABUS IMPORT",
    "scan.title_preview": "Preview. Then unlock.",
    "scan.title": "Import. Review. Start.",
    "scan.upload_pdf": "Upload syllabus PDF",
    "scan.camera": "Camera",
    "scan.photo": "Photo",
    "scan.paste_text": "Paste text",
    "scan.notes_title": "Scan notes",
    "scan.notes_body": "Summaries, terms, flashcards, quizzes, and review tasks.",
    "scan.quick_title": "Fast capture",
    "scan.quick_body": "Type class, task, due date, estimate.",
    "scan.quick_button": "Create task + replan",
    "scan.more": "More captures",
    "scan.history": "Import history",
    "scan.empty_history": "No imports yet. Paste a syllabus or notes to create the first one.",
    "scan.status_ready": "On-device text scan is ready.",
    "scan.status_backup": "Camera opens for capture. Paste text is available if this device cannot read photos.",
    "scan.limited_photos": "Photo access is limited. Pick an allowed image, open Settings for more access, or paste text.",
    "scan.quick_seed": "chem lab report due tomorrow, estimate 2 hours",
    "paywall.title": "{name}, build your live semester.",
    "paywall.sub_no_import": "Unlock first, then scan to keep your semester visible across dashboard, widgets, reminders, and next moves.",
    "paywall.sub_import": "Your preview is ready. Unlock to apply it to the live dashboard, reminders, and widgets.",
    "paywall.message_loading": "Connecting to the store...",
    "paywall.message_choose": "Choose a StudyPlanner plan to continue.",
    "paywall.message_unavailable": "Store pricing is not loaded. Restore is still available.",
    "paywall.benefit_apply": "Apply your syllabus",
    "paywall.benefit_health": "Track Semester Health",
    "paywall.benefit_exams": "Stay ahead of exams",
    "paywall.benefit_reminders": "Get reminder timing",
    "paywall.benefit_widgets": "Keep widgets current",
    "paywall.unlock": "Unlock {plan}",
    "paywall.loading_price": "Loading store price",
    "paywall.opening": "Opening purchase sheet...",
    "paywall.restoring": "Restoring...",
    "paywall.legal": "Auto-renewing subscription. Price and terms are shown by the store before purchase. Manage or cancel in your subscription settings.",
    "today.next_move": "Next Move",
    "today.next_class": "Next class",
    "today.deadline": "Deadline",
    "today.focus": "Focus",
    "today.open_plan": "Open plan",
    "today.start_focus": "Start focus",
    "today.next_30": "Next 30 Days",
    "today.risk_radar": "Risk Radar",
    "today.upcoming_deadlines": "Upcoming Deadlines",
    "today.upcoming_assessments": "Upcoming Assessments",
    "today.notes_activity": "Notes Activity",
    "classes.title": "Manage Semester",
    "classes.truth": "Single source of truth",
    "classes.truth_body": "Fix imports, add missing work, drop classes, and keep Today, Plan, reminders, and widgets aligned.",
    "classes.add": "Add class",
    "classes.add_syllabus": "Add Syllabus",
    "classes.import": "Import",
    "classes.empty_title": "No active classes yet.",
    "classes.empty_body": "Start manually if the syllabus is missing, unreadable, or wrong. You can import later and merge the useful rows.",
    "class.schedule": "Schedule",
    "class.add_work": "Add missing work",
    "class.add_work_body": "Add a surprise quiz, recurring discussion, project, or undated assignment without re-importing.",
    "class.assignment": "Assignment",
    "class.assessment": "Assessment",
    "class.pulse": "Class pulse",
    "class.assignments": "Assignments",
    "class.exams": "Upcoming exams",
    "class.notes": "Recent notes",
    "review.title": "Review Import",
    "review.empty": "No import is waiting for review.",
    "review.guard_preview": "Preview only.",
    "review.guard_preview_body": "Unlock to apply this semester to the real app.",
    "review.guard_active": "Nothing saves until you approve.",
    "review.guard_active_body": "Edit, remove, or confirm each item.",
    "review.found": "StudyPlanner found your semester.",
    "review.classes": "classes",
    "review.assignments": "assignments",
    "review.exams": "exams",
    "review.approve": "Approve trusted",
    "review.manual": "Manual setup",
    "review.unlock": "Unlock my semester",
    "review.apply": "Apply schedule",
    "review.invalid_date": "Enter a valid YYYY-MM-DD date before approving this row.",
    "review.resume_title": "Import waiting for review",
    "review.resume_body": "{count} rows are saved on this device. Review them before anything changes your semester.",
    "review.resume": "Resume review",
    "plan.title": "Plan",
    "plan.sub_suffix": "semester autopilot",
    "plan.notes_feed": "{count} notes feed plan",
    "notes.title": "Notes",
    "notes.sub": "{score} preparedness · {count} notes",
    "notes.body": "Notes raise Preparedness and sharpen Class Pulse.",
    "widgets.title": "Widgets",
    "widgets.sub_ready": "Home Screen snapshots",
    "widgets.sub_locked": "Locked preview",
    "widgets.ready_title": "Widgets are synced",
    "widgets.locked_title": "Unlock widgets",
    "widgets.ready_body": "{score} loop score ready for iOS widgets.",
    "widgets.locked_body": "Apply a syllabus and unlock to keep widgets current.",
    "widgets.sync": "Sync from dashboard",
    "tabs.today": "Today",
    "tabs.classes": "Classes",
    "tabs.scan": "Scan",
    "tabs.plan": "Plan",
    "tabs.profile": "Profile",
    "classes.add_manual": "Add class manually",
    "classes.archived": "Archived",
    "class.forecast": "Forecast",
    "class.due": "Due",
    "class.archive_title": "Archive class?",
    "class.archive_body": "{code} will leave Today, Plan, reminders, and widgets. Its work stays recoverable from Manage Semester.",
    "class.delete_title": "Delete class permanently?",
    "class.archive_instead": "Archive instead",
    "class.not_found": "Class not found",
    "class.not_found_body": "That class is not in this semester anymore.",
    "class.open_dashboard": "Open dashboard",
    "plan.autopilot": "Autopilot",
    "plan.rebuild": "Rebuild plan",
    "plan.focus_blocks": "Focus blocks",
    "plan.regenerate": "Regenerate",
    "plan.study": "Study",
    "plan.clear_day": "Clear day.",
    "notes.all": "All",
    "notes.empty_title": "No notes loaded",
    "notes.empty_body": "Scan or paste lecture notes to build summaries, flashcards, quizzes, and review tasks.",
    "notes.scan": "Scan notes",
    "notes.paste": "Paste notes",
    "widgets.row_today": "StudyPlanner Today",
    "widgets.row_today_body": "Health, next deadline, and focus block",
    "widgets.row_upcoming": "Upcoming",
    "widgets.row_upcoming_body": "Assignments and exams coming soon",
    "widgets.row_week": "Week Load",
    "widgets.row_week_body": "Pressure by week",
    "widgets.row_class": "Class Progress",
    "widgets.row_class_body": "Selected class pulse",
    "widgets.ready": "ready",
    "widgets.locked": "locked",
    "paywall.ready_apply": "Ready to apply",
    "paywall.best_value": "Best value",
    "paywall.weekly": "Weekly",
    "paywall.yearly": "Yearly",
    "paywall.monthly": "Monthly",
    "scan.more_assignment": "Assignment sheet",
    "scan.more_assignment_body": "Extract task details",
    "scan.more_exam": "Exam review",
    "scan.more_exam_body": "Build a study set",
    "scan.more_upload_body": "Pick syllabus PDF",
    "review.pressure_preview": "Pressure preview",
    "review.first_action": "First recommended action",
    "review.weak_title": "Extraction looks weak.",
    "review.weak_body": "Use the rows below only if they match the syllabus. You can retry, paste text, or build the semester manually.",
    "review.retry": "Retry",
    "review.needs_review": "Needs review",
    "review.items_found": "{kind} found",
    "success.ready": "Semester Ready",
    "success.built": "Built from your syllabus.",
    "success.building": "One local plan is taking shape.",
    "success.open_dashboard": "Open dashboard",
    "welcome.title": "Know exactly where you stand.",
    "welcome.body": "Import a syllabus. StudyPlanner maps the semester, finds pressure, and tells you the next move.",
    "welcome.preview": "preview",
    "welcome.card_title": "syllabus in. Dashboard out.",
    "welcome.card_body": "Preview classes, deadlines, exams, and first move before anything saves.",
    "welcome.map_title": "Map every deadline",
    "welcome.map_body": "syllabus in. Semester out.",
    "welcome.health_title": "Track Semester Health",
    "welcome.health_body": "Know if you are okay.",
    "welcome.import": "Import syllabus",
    "mini.builds_live": "Builds live",
    "mini.after_import": "after import",
    "mini.pressure": "PRESSURE FORECAST",
    "mini.class_pulse": "CLASS PULSE",
    "mini.notes_preparedness": "NOTES PREPAREDNESS",
    "mini.locked": "Locked",
    "mini.no_fake": "No fake courses",
    "mini.next_move": "NEXT MOVE",
    "mini.first_action": "First action",
    "mini.widget": "WIDGET",
    "mini.unlock_after": "Unlock after purchase",
    "health.score": "score",
    "health.start_here": "Start here",
    "health.no_semester": "No semester loaded.",
    "today.empty_kicker": "BUILD YOUR SEMESTER",
    "today.empty_title": "Add a class or scan a syllabus.",
    "scan.opening_camera": "Opening camera...",
    "scan.opening_photos": "Opening photos...",
    "scan.permission": "Permission is needed to read {mode} pages from the {target}.",
    "scan.open_settings": "Open Settings",
    "scan.canceled": "Scan canceled.",
    "scan.reading_notes": "Reading note text on this iPhone...",
    "scan.reading_syllabus": "Reading syllabus text on this iPhone...",
    "scan.found_words": "Found {count} words. Review before saving.",
    "scan.image_failed": "That image could not be scanned.",
    "scan.opening_pdf": "Opening PDF...",
    "scan.pdf_canceled": "PDF import canceled.",
    "scan.pdf_unreadable": "PDF opened. Text was not readable here. Paste text or scan pages.",
    "scan.scan_pages": "Scan pages",
    "scan.pdf_read": "PDF read: {count} words. Review before saving.",
    "scan.pdf_failed": "That PDF could not be imported.",
    "scan.pdf_failed_title": "PDF import failed",
    "scan.pdf_failed_body": "Paste syllabus text or scan the PDF pages with the camera.",
    "paste.add_text_title": "Add text first",
    "paste.notes_required": "Paste notes to summarize and turn into study assets.",
    "paste.syllabus_required": "Paste syllabus text to extract classes, assignments, and exams.",
    "paste.notes_title": "Notes become a study set.",
    "paste.syllabus_title": "syllabus becomes a semester.",
    "paste.premium_sub": "Review everything before it saves.",
    "paste.preview_sub": "Preview what StudyPlanner finds before you unlock.",
    "paste.notes_placeholder": "Paste lecture notes, reading notes, or review material...",
    "paste.syllabus_placeholder": "Paste syllabus text, assignment sheets, or extracted PDF text...",
    "paste.reading": "Reading...",
    "review.none_selected_title": "Nothing selected",
    "review.none_selected_body": "Approve at least one class, assignment, exam, or note before continuing.",
    "review.first_deadline": "Review your first deadline",
    "review.high": "High",
    "review.good": "Good",
    "review.needs_review_body": "StudyPlanner is not confident this row is complete.",
    "review.reconcile_hint": "Choose how to handle this import row. StudyPlanner will not overwrite or duplicate it silently.",
    "review.applying": "Applying...",
    "review.approved_footer": "{count} approved items · {state}",
    "review.editable_later": "editable later",
    "review.locked_until_premium": "locked until premium",
    "review.approve_one": "Approve at least one item to continue",
    "success.step_reading": "Reading syllabus",
    "success.step_deadlines": "Finding deadlines",
    "success.step_schedule": "Building schedule",
    "success.step_health": "Calculating Semester Health",
    "success.step_next": "Preparing next move",
    "success.continue": "Continue",
    "class.delete_body": "This deletes {code}, {tasks} open assignments, {exams} exams, notes, reminders, and study blocks for this class. Archive is safer.",
    "class.weekly_discussion": "Weekly discussion",
    "class.new_assignment": "New assignment",
    "class.add_assessment": "Add assessment",
    "class.add_assignment": "Add assignment",
    "class.effort": "Effort",
    "class.notes_label": "Notes",
    "tasks.today": "Today",
    "tasks.later": "Later",
    "task.delete_title": "Delete assignment?",
    "task.delete_recurring_body": "Choose how much of this recurring work to remove.",
    "task.delete_body": "{title} will be removed from Today, Plan, reminders, and widgets.",
    "task.edit": "Edit assignment",
    "task.save": "Save assignment",
    "task.save_awaiting": "Save as Awaiting Date",
    "task.due": "Due",
    "task.estimated": "Estimated",
    "task.source": "Source",
    "task.on_calendar": "On calendar",
    "task.not_scheduled": "Not scheduled",
    "assessment.delete_title": "Delete assessment?",
    "assessment.delete_body": "{title} will be removed from Today, Plan, reminders, and widgets.",
    "assessment.save": "Save assessment",
    "assessment.date": "Date",
    "assessment.room": "Room",
    "assessment.no_notes": "No notes yet",
    "assessment.prep_plan": "Prep plan",
    "assessment.prep_body": "{minutes} of prep. Due {due}.",
    "assessment.rebuild": "Rebuild study blocks",
    "plan.items": "items",
    "plan.why": "Why",
    "plan.missed": "Missed? make up tomorrow",
    "plan.suggested_tasks": "suggested tasks",
    "study.focus_session": "Focus Session",
    "study.no_blocks": "No blocks yet",
    "study.no_blocks_body": "Import work, then rebuild.",
    "study.impact": "Impact",
    "study.goal": "Goal",
    "study.goal_body": "One item. Then recall.",
    "study.active_recall": "Active recall",
    "study.recall_body": "Explain it without looking.",
    "study.recall_placeholder": "Type your recall answer...",
    "study.score_recall": "Score recall",
    "study.recall_score": "Recall score: {score}/10",
    "study.complete": "Complete session",
    "note.not_found": "Note not found",
    "note.not_found_body": "That note is not in this semester anymore.",
    "note.open_notes": "Open notes",
    "note.effect": "Effect on {code}",
    "note.readiness_up": "Readiness up.",
    "note.summary": "Summary",
    "note.key_terms": "KEY TERMS",
    "note.signals": "Signals",
    "note.exam_topics": "Exam topics",
    "note.formulas": "Formulas",
    "note.weak_area": "Weak area",
    "note.suggested_tasks": "Suggested study tasks",
    "note.generated_assets": "Generated study assets",
    "note.cards": "cards",
    "note.flashcards": "Flashcards",
    "note.quiz": "Quiz",
    "note.add": "Add",
    "note.add_review_task": "Add review task",
    "note.source_text": "SOURCE TEXT",
    "note.concepts": "{count} concepts",
    "note.tasks": "{count} tasks",
    "note.formulas_count": "{count} formulas",
    "profile.active_semester": "Active semester",
    "profile.reminders": "Reminders",
    "profile.active_count": "{count} active",
    "profile.import_history": "Import history",
    "profile.import_count": "{count} imports",
    "profile.manage_subscription": "Manage subscription",
    "profile.apple_account": "Apple account",
    "profile.privacy_policy": "Privacy Policy",
    "profile.studyplanner_data": "StudyPlanner data",
    "profile.terms_use": "Terms of Use",
    "profile.subscription_terms": "Subscription terms",
    "profile.email_help": "Email help",
    "profile.subscribed": "Subscribed",
    "profile.locked": "Locked",
    "profile.on_device": "On device",
    "profile.semester_progress": "SEMESTER PROGRESS",
    "profile.classes_count": "{count} classes",
    "profile.no_semester": "No semester yet",
    "profile.subscription": "StudyPlanner subscription",
    "profile.subscription_body": "Scans, reminders, study sets, and planning are active.",
    "reminders.title": "Reminders",
    "reminders.default_status": "Enable reminders when you want this iPhone to schedule them.",
    "reminders.schedule_failed": "Could not schedule reminders.",
    "reminders.smart": "Smart reminders",
    "reminders.scheduling": "Scheduling...",
    "reminders.schedule": "Schedule",
    "reminders.add_suggestions": "Add suggestions",
    "reminders.active": "Active reminders",
    "common.link_unavailable": "Link unavailable",
    "common.link_unavailable_body": "Open the app listing to view this document.",
  },
  de: {},
  es: {},
  fr: {},
  "pt-BR": {},
  ar: {},
  hi: {},
  ja: {},
  ko: {},
  "zh-Hans": {},
};

Object.assign(APP_COPY.de, {
  "common.continue": "Weiter", "common.cancel": "Abbrechen", "common.close": "Schließen", "common.edit": "Bearbeiten", "common.save": "Sichern", "common.archive": "Archivieren", "common.delete": "Löschen", "common.restore": "Käufe wiederherstellen", "common.terms": "Bedingungen", "common.privacy": "Datenschutz", "common.support": "Support",
  "onboarding.name_title": "Wie soll StudyPlanner dich nennen?", "onboarding.name_sub": "Wir bauen dein Semester.", "onboarding.name_placeholder": "Dein Vorname", "onboarding.nice": "Schön, {name}.", "onboarding.student_kicker": "SCHÖN, {name}", "onboarding.student_title": "Was organisierst du?", "onboarding.goal_title": "Was soll unter Kontrolle sein?", "onboarding.artifacts_title": "StudyPlanner macht aus Schularbeit einen lebenden Plan.", "onboarding.artifacts_sub": "Echte App-Ansichten. Keine Demo-Kurse.", "onboarding.build_title": "Baue dein Semester.", "onboarding.paywall_first": "Erst freischalten, dann scannen.",
  "option.school_semester": "Schulsemester", "option.high_school": "Oberstufenkurse", "option.college": "Uni-Kurse", "option.grad": "Master/Promotion", "option.online": "Onlinekurse", "option.exams": "Prüfungen", "option.deadlines": "Fristen", "option.notes": "Notizen", "option.grades": "Noten", "option.study_plan": "Lernplan", "option.everything": "Alles", "option.upload_pdf": "PDF hochladen", "option.paste_syllabus": "syllabus einfügen", "option.scan_camera": "Mit Kamera scannen", "option.skip": "Vorerst überspringen",
  "locked.kicker": "GESPERRTE VORSCHAU", "locked.title": "{name}, baue dein Semester.", "locked.sub": "Schalte StudyPlanner zuerst frei. Scanne danach deinen syllabus und wende deinen Live-Plan an.", "locked.card_kicker": "SYLLABUS NACH FREISCHALTUNG", "locked.card_title": "Mach aus deinem syllabus einen lebenden Plan.", "locked.step1": "StudyPlanner freischalten", "locked.step2": "syllabus scannen", "locked.step3": "Fristen prüfen", "locked.scan": "syllabus scannen", "locked.paste": "Manuell einfügen", "locked.health": "SEMESTERSTATUS", "locked.health_title": "Gesperrte Vorschau", "locked.health_sub": "Dein Wert erscheint, nachdem dein syllabus geprüft und angewendet wurde.", "locked.unlock": "StudyPlanner freischalten", "locked.after_scan": "nach Scan", "locked.workload": "Arbeitslast", "locked.grades": "Noten", "locked.preparedness": "Vorbereitung", "locked.consistency": "Konstanz", "locked.workload_body": "Gesperrt, bis dein syllabus geprüft ist.", "locked.grades_body": "Gesperrt, bis echte Kurse existieren.", "locked.preparedness_body": "Gesperrt, bis Notizen und Prüfungen existieren.", "locked.consistency_body": "Gesperrt, bis StudyPlanner deinen Plan sieht.",
  "scan.header_preview": "syllabus-Vorschau", "scan.header": "Scannen", "scan.sub_preview": "Vorschau vor dem Freischalten", "scan.sub": "Alles erfassen", "scan.kicker": "LEHRPLAN-IMPORT", "scan.title_preview": "Vorschau. Dann freischalten.", "scan.title": "Importieren. Prüfen. Starten.", "scan.upload_pdf": "syllabus-PDF hochladen", "scan.camera": "Kamera", "scan.photo": "Foto", "scan.paste_text": "Text einfügen", "scan.notes_title": "Notizen scannen", "scan.notes_body": "Zusammenfassungen, Begriffe, Karten, Quizze und Lernaufgaben.", "scan.quick_title": "Schnellerfassung", "scan.quick_body": "Kurs, Aufgabe, Termin und Aufwand eingeben.", "scan.quick_button": "Aufgabe erstellen + neu planen", "scan.more": "Weitere Erfassungen", "scan.history": "Importverlauf", "scan.empty_history": "Noch keine Importe. Füge einen syllabus oder Notizen ein.",
  "paywall.title": "{name}, baue dein Live-Semester.", "paywall.sub_no_import": "Erst freischalten, dann scannen, damit dein Semester in Dashboard, Widgets, Erinnerungen und nächsten Schritten sichtbar bleibt.", "paywall.sub_import": "Deine Vorschau ist bereit. Schalte frei, um sie auf Dashboard, Erinnerungen und Widgets anzuwenden.", "paywall.message_loading": "Verbindung zum App Store...", "paywall.message_choose": "Wähle einen StudyPlanner-Plan.", "paywall.message_unavailable": "App-Store-Preise sind nicht geladen. Wiederherstellen ist verfügbar.", "paywall.benefit_apply": "syllabus anwenden", "paywall.benefit_health": "Semesterstatus verfolgen", "paywall.benefit_exams": "Prüfungen vorausplanen", "paywall.benefit_reminders": "Erinnerungen abstimmen", "paywall.benefit_widgets": "Widgets aktuell halten", "paywall.unlock": "{plan} freischalten", "paywall.loading_price": "App-Store-Preis wird geladen", "paywall.opening": "App Store wird geöffnet...", "paywall.restoring": "Wiederherstellung...", "paywall.legal": "Automatisch verlängerbares Abo. Preis und Bedingungen zeigt der App Store vor dem Kauf. Verwalten oder kündigen in Apple-Abos.",
  "today.next_move": "Nächster Schritt", "today.next_class": "Nächster Kurs", "today.deadline": "Frist", "today.focus": "Fokus", "today.open_plan": "Plan öffnen", "today.start_focus": "Fokus starten", "today.next_30": "Nächste 30 Tage", "today.risk_radar": "Risiko-Radar", "today.upcoming_deadlines": "Kommende Fristen", "today.upcoming_assessments": "Kommende Prüfungen", "today.notes_activity": "Notizenaktivität",
  "classes.title": "Semester verwalten", "classes.truth": "Eine Quelle der Wahrheit", "classes.truth_body": "Importe korrigieren, fehlende Arbeit ergänzen, Kurse ablegen und Heute, Plan, Erinnerungen und Widgets synchron halten.", "classes.add": "Kurs hinzufügen", "classes.import": "Importieren", "classes.empty_title": "Noch keine aktiven Kurse.", "classes.empty_body": "Starte manuell, wenn der syllabus fehlt, unlesbar oder falsch ist.",
  "class.schedule": "Zeitplan", "class.add_work": "Fehlende Arbeit ergänzen", "class.add_work_body": "Überraschungsquiz, wiederkehrende Diskussion, Projekt oder Aufgabe ohne Datum hinzufügen.", "class.assignment": "Aufgabe", "class.assessment": "Prüfung", "class.pulse": "Kurspuls", "class.assignments": "Aufgaben", "class.exams": "Kommende Prüfungen", "class.notes": "Aktuelle Notizen",
  "review.title": "Import prüfen", "review.empty": "Kein Import wartet auf Prüfung.", "review.guard_preview": "Nur Vorschau.", "review.guard_preview_body": "Schalte frei, um dieses Semester in der echten App anzuwenden.", "review.guard_active": "Nichts wird gespeichert, bevor du zustimmst.", "review.guard_active_body": "Bearbeite, entferne oder bestätige jeden Eintrag.", "review.found": "StudyPlanner hat dein Semester gefunden.", "review.classes": "Kurse", "review.assignments": "Aufgaben", "review.exams": "Prüfungen", "review.approve": "Sichere prüfen", "review.manual": "Manuell einrichten", "review.unlock": "Mein Semester freischalten", "review.apply": "Plan anwenden",
  "plan.title": "Plan", "plan.sub_suffix": "Semester-Autopilot", "plan.notes_feed": "{count} Notizen steuern den Plan", "notes.title": "Notizen", "notes.sub": "{score} Vorbereitung · {count} Notizen", "notes.body": "Notizen steigern Vorbereitung und schärfen den Kurspuls.", "widgets.title": "Widgets", "widgets.sub_ready": "Home-Bildschirm-Snapshots", "widgets.sub_locked": "Gesperrte Vorschau", "widgets.ready_title": "Widgets sind synchron", "widgets.locked_title": "Widgets freischalten", "widgets.ready_body": "{score} Loop-Wert bereit für iOS-Widgets.", "widgets.locked_body": "Wende einen syllabus an und schalte frei, um Widgets aktuell zu halten.", "widgets.sync": "Vom Dashboard syncen",
});

Object.assign(APP_COPY.es, {
  "common.continue": "Continuar", "common.cancel": "Cancelar", "common.close": "Cerrar", "common.edit": "Editar", "common.save": "Guardar", "common.archive": "Archivar", "common.delete": "Eliminar", "common.restore": "Restaurar compras", "common.terms": "Términos", "common.privacy": "Privacidad", "common.support": "Soporte",
  "onboarding.name_title": "¿Cómo debería llamarte StudyPlanner?", "onboarding.name_sub": "Construyamos tu semestre.", "onboarding.name_placeholder": "Tu nombre", "onboarding.nice": "Perfecto, {name}.", "onboarding.student_kicker": "PERFECTO, {name}", "onboarding.student_title": "¿Qué estás organizando?", "onboarding.goal_title": "¿Qué quieres tener bajo control?", "onboarding.artifacts_title": "StudyPlanner convierte tus clases en un plan vivo.", "onboarding.artifacts_sub": "Pantallas reales. Sin cursos de demo.", "onboarding.build_title": "Construye tu semestre.", "onboarding.paywall_first": "Primero desbloquea, luego escanea.",
  "locked.kicker": "VISTA BLOQUEADA", "locked.title": "{name}, arma tu semestre.", "locked.sub": "Desbloquea StudyPlanner primero. Luego escanea un programa y aplica tu plan en vivo.", "locked.card_kicker": "PROGRAMA DESPUÉS DE DESBLOQUEAR", "locked.card_title": "Convierte tu programa en un plan vivo.", "locked.step1": "Desbloquear StudyPlanner", "locked.step2": "Escanear programa", "locked.step3": "Revisar fechas", "locked.scan": "Escanear programa", "locked.paste": "Pegar manualmente", "locked.health": "SALUD DEL SEMESTRE", "locked.health_title": "Vista bloqueada", "locked.health_sub": "Tu puntaje aparece después de revisar y aplicar tu programa.", "locked.unlock": "Desbloquear StudyPlanner",
  "scan.header_preview": "Vista del programa", "scan.header": "Escanear", "scan.sub_preview": "Vista antes de desbloquear", "scan.sub": "Captura cualquier cosa", "scan.kicker": "IMPORTAR PROGRAMA", "scan.title_preview": "Vista previa. Luego desbloquea.", "scan.title": "Importa. Revisa. Empieza.", "scan.upload_pdf": "Subir PDF del programa", "scan.camera": "Cámara", "scan.photo": "Foto", "scan.paste_text": "Pegar texto", "scan.notes_title": "Escanear notas", "scan.notes_body": "Resúmenes, conceptos, tarjetas, cuestionarios y tareas de repaso.", "scan.quick_title": "Captura rápida", "scan.quick_body": "Escribe curso, tarea, fecha y esfuerzo.", "scan.quick_button": "Crear tarea + replanificar",
  "paywall.title": "{name}, arma tu semestre en vivo.", "paywall.sub_no_import": "Desbloquea primero y luego escanea para mantener tu semestre visible en panel, widgets, recordatorios y próximos pasos.", "paywall.sub_import": "Tu vista previa está lista. Desbloquea para aplicarla al panel, recordatorios y widgets.",
});

Object.assign(APP_COPY.fr, {
  "common.continue": "Continuer", "common.cancel": "Annuler", "common.close": "Fermer", "common.edit": "Modifier", "common.save": "Enregistrer", "common.archive": "Archiver", "common.delete": "Supprimer", "common.restore": "Restaurer les achats", "common.terms": "Conditions", "common.privacy": "Confidentialité", "common.support": "Assistance",
  "onboarding.name_title": "Comment StudyPlanner doit-il t’appeler ?", "onboarding.name_sub": "Construisons ton semestre.", "onboarding.name_placeholder": "Ton prénom", "onboarding.nice": "Parfait, {name}.", "onboarding.student_kicker": "PARFAIT, {name}", "onboarding.student_title": "Qu’est-ce que tu organises ?", "onboarding.goal_title": "Que veux-tu maîtriser ?", "onboarding.artifacts_title": "StudyPlanner transforme ton travail en plan vivant.", "onboarding.artifacts_sub": "Vraies vues de l’app. Pas de cours démo.", "onboarding.build_title": "Construis ton semestre.", "onboarding.paywall_first": "Déverrouille d’abord, scanne ensuite.",
  "locked.kicker": "APERÇU VERROUILLÉ", "locked.title": "{name}, construis ton semestre.", "locked.sub": "Déverrouille StudyPlanner d’abord. Scanne ensuite ton syllabus et applique ton plan vivant.", "locked.card_kicker": "SYLLABUS APRÈS DÉVERROUILLAGE", "locked.card_title": "Transforme ton syllabus en plan vivant.", "locked.step1": "Déverrouiller StudyPlanner", "locked.step2": "Scanner le syllabus", "locked.step3": "Vérifier les échéances", "locked.scan": "Scanner le syllabus", "locked.paste": "Coller manuellement", "locked.health": "SANTÉ DU SEMESTRE", "locked.health_title": "Aperçu verrouillé", "locked.health_sub": "Ton score apparaît après vérification et application du syllabus.", "locked.unlock": "Déverrouiller StudyPlanner",
  "scan.header_preview": "Aperçu du syllabus", "scan.header": "Scanner", "scan.sub_preview": "Aperçu avant déverrouillage", "scan.sub": "Capture tout", "scan.kicker": "IMPORT DE PROGRAMME", "scan.title_preview": "Aperçu. Puis déverrouille.", "scan.title": "Importer. Vérifier. Démarrer.", "scan.upload_pdf": "Importer le PDF du syllabus", "scan.camera": "Caméra", "scan.photo": "Photo", "scan.paste_text": "Coller le texte", "scan.notes_title": "Scanner des notes", "scan.notes_body": "Résumés, notions, cartes, quiz et tâches de révision.", "scan.quick_title": "Capture rapide", "scan.quick_body": "Saisis cours, tâche, date limite et durée.", "scan.quick_button": "Créer + replanifier",
  "paywall.title": "{name}, construis ton semestre vivant.", "paywall.sub_no_import": "Déverrouille d’abord, puis scanne pour garder ton semestre visible dans le tableau, les widgets, les rappels et les prochaines actions.", "paywall.sub_import": "Ton aperçu est prêt. Déverrouille pour l’appliquer au tableau, aux rappels et aux widgets.",
});

Object.assign(APP_COPY["pt-BR"], {
  "common.continue": "Continuar", "common.cancel": "Cancelar", "common.close": "Fechar", "common.edit": "Editar", "common.save": "Salvar", "common.archive": "Arquivar", "common.delete": "Excluir", "common.restore": "Restaurar compras", "common.terms": "Termos", "common.privacy": "Privacidade", "common.support": "Suporte",
  "onboarding.name_title": "Como o StudyPlanner deve chamar você?", "onboarding.name_sub": "Vamos montar seu semestre.", "onboarding.name_placeholder": "Seu primeiro nome", "onboarding.nice": "Boa, {name}.", "onboarding.student_kicker": "BOA, {name}", "onboarding.student_title": "O que você está organizando?", "onboarding.goal_title": "O que quer manter sob controle?", "onboarding.artifacts_title": "StudyPlanner transforma seus estudos em um plano vivo.", "onboarding.artifacts_sub": "Telas reais do app. Sem turmas demo.", "onboarding.build_title": "Monte seu semestre.", "onboarding.paywall_first": "Desbloqueie primeiro, escaneie depois.",
  "locked.kicker": "PRÉVIA BLOQUEADA", "locked.title": "{name}, monte seu semestre.", "locked.sub": "Desbloqueie o StudyPlanner primeiro. Depois escaneie o plano de curso e aplique seu plano vivo.", "locked.card_kicker": "PLANO DE CURSO APÓS DESBLOQUEAR", "locked.card_title": "Transforme o plano de curso em um plano vivo.", "locked.step1": "Desbloquear StudyPlanner", "locked.step2": "Escanear plano de curso", "locked.step3": "Revisar prazos", "locked.scan": "Escanear plano", "locked.paste": "Colar manualmente", "locked.health": "SAÚDE DO SEMESTRE", "locked.health_title": "Prévia bloqueada", "locked.health_sub": "Sua pontuação aparece após revisar e aplicar o plano de curso.", "locked.unlock": "Desbloquear StudyPlanner",
  "scan.header_preview": "Prévia do plano", "scan.header": "Escanear", "scan.sub_preview": "Prévia antes de desbloquear", "scan.sub": "Capture qualquer coisa", "scan.kicker": "IMPORTAR PLANO", "scan.title_preview": "Prévia. Depois desbloqueie.", "scan.title": "Importe. Revise. Comece.", "scan.upload_pdf": "Enviar PDF do plano", "scan.camera": "Câmera", "scan.photo": "Foto", "scan.paste_text": "Colar texto", "scan.notes_title": "Escanear notas", "scan.notes_body": "Resumos, conceitos, cartões, quizzes e tarefas de revisão.", "scan.quick_title": "Captura rápida", "scan.quick_body": "Digite matéria, tarefa, prazo e esforço.", "scan.quick_button": "Criar tarefa + replanejar",
  "paywall.title": "{name}, monte seu semestre ao vivo.", "paywall.sub_no_import": "Desbloqueie primeiro e depois escaneie para manter seu semestre visível no painel, widgets, lembretes e próximos passos.", "paywall.sub_import": "Sua prévia está pronta. Desbloqueie para aplicar ao painel, lembretes e widgets.",
});

Object.assign(APP_COPY.ja, {
  "common.continue": "続ける", "common.cancel": "キャンセル", "common.close": "閉じる", "common.edit": "編集", "common.save": "保存", "common.archive": "アーカイブ", "common.delete": "削除", "common.restore": "購入を復元", "common.terms": "利用規約", "common.privacy": "プライバシー", "common.support": "サポート",
  "onboarding.name_title": "StudyPlannerで使う名前は？", "onboarding.name_sub": "学期の計画を作りましょう。", "onboarding.name_placeholder": "名前", "onboarding.nice": "いいですね、{name}。", "onboarding.student_kicker": "{name}さん", "onboarding.student_title": "何を管理しますか？", "onboarding.goal_title": "何を整えたいですか？", "onboarding.artifacts_title": "授業の予定を、生きた計画に。", "onboarding.artifacts_sub": "実際のアプリ画面。デモ授業なし。", "onboarding.build_title": "学期を作成。", "onboarding.paywall_first": "先に解除して、次にスキャン。",
  "option.school_semester": "学校の学期", "option.high_school": "高校の授業", "option.college": "大学の授業", "option.grad": "大学院", "option.online": "オンライン授業", "option.exams": "試験", "option.deadlines": "締切", "option.notes": "ノート", "option.grades": "成績", "option.study_plan": "学習計画", "option.everything": "すべて", "option.upload_pdf": "PDFをアップロード", "option.paste_syllabus": "シラバスを貼り付け", "option.scan_camera": "カメラでスキャン", "option.skip": "今はスキップ",
  "locked.kicker": "ロック中のプレビュー", "locked.title": "{name}さん、学期を作成しましょう。", "locked.sub": "先にStudyPlannerを解除。次にシラバスをスキャンして、ライブ計画に反映します。", "locked.card_kicker": "解除後にシラバス", "locked.card_title": "シラバスを、生きた計画に。", "locked.step1": "StudyPlannerを解除", "locked.step2": "シラバスをスキャン", "locked.step3": "締切を確認", "locked.scan": "シラバスをスキャン", "locked.paste": "手動で貼り付け", "locked.health": "学期ヘルス", "locked.health_title": "ロック中のプレビュー", "locked.health_sub": "シラバスを確認して適用するとスコアが表示されます。", "locked.unlock": "StudyPlannerを解除",
  "scan.header_preview": "シラバスのプレビュー", "scan.header": "スキャン", "scan.sub_preview": "解除前に確認", "scan.sub": "何でも取り込み", "scan.kicker": "シラバス取り込み", "scan.title_preview": "プレビューしてから解除。", "scan.title": "取り込み、確認、開始。", "scan.upload_pdf": "シラバスPDFをアップロード", "scan.camera": "カメラ", "scan.photo": "写真", "scan.paste_text": "テキストを貼り付け", "scan.notes_title": "ノートをスキャン", "scan.notes_body": "要約、用語、カード、クイズ、復習タスクを作成。", "scan.quick_title": "クイック入力", "scan.quick_body": "授業、タスク、締切、所要時間を入力。", "scan.quick_button": "タスク作成＋再計画",
  "paywall.title": "{name}さん、学期をライブ化。", "paywall.sub_no_import": "先に解除してからスキャン。ダッシュボード、ウィジェット、リマインダー、次の行動に反映します。", "paywall.sub_import": "プレビューの準備ができました。解除するとダッシュボード、リマインダー、ウィジェットに反映できます。",
});

Object.assign(APP_COPY.ko, {
  "common.continue": "계속", "common.cancel": "취소", "common.close": "닫기", "common.edit": "편집", "common.save": "저장", "common.archive": "보관", "common.delete": "삭제", "common.restore": "구매 복원", "common.terms": "약관", "common.privacy": "개인정보", "common.support": "지원",
  "onboarding.name_title": "StudyPlanner에서 뭐라고 부를까요?", "onboarding.name_sub": "학기를 함께 만들어 볼게요.", "onboarding.name_placeholder": "이름", "onboarding.nice": "좋아요, {name}.", "onboarding.student_kicker": "좋아요, {name}", "onboarding.student_title": "무엇을 관리하나요?", "onboarding.goal_title": "무엇을 정리하고 싶나요?", "onboarding.artifacts_title": "수업 일을 살아 있는 계획으로.", "onboarding.artifacts_sub": "실제 앱 화면. 데모 과목 없음.", "onboarding.build_title": "학기 만들기.", "onboarding.paywall_first": "먼저 잠금 해제, 다음에 스캔.",
  "locked.kicker": "잠긴 미리보기", "locked.title": "{name}님, 학기를 만들어 보세요.", "locked.sub": "먼저 StudyPlanner를 잠금 해제하세요. 그다음 강의계획서를 스캔해 실시간 계획에 적용합니다.", "locked.card_kicker": "잠금 해제 후 강의계획서", "locked.card_title": "강의계획서를 살아 있는 계획으로.", "locked.step1": "StudyPlanner 잠금 해제", "locked.step2": "강의계획서 스캔", "locked.step3": "마감일 검토", "locked.scan": "강의계획서 스캔", "locked.paste": "직접 붙여넣기", "locked.health": "학기 상태", "locked.health_title": "잠긴 미리보기", "locked.health_sub": "강의계획서를 검토하고 적용하면 점수가 표시됩니다.", "locked.unlock": "StudyPlanner 잠금 해제",
  "scan.header_preview": "강의계획서 미리보기", "scan.header": "스캔", "scan.sub_preview": "잠금 해제 전 미리보기", "scan.sub": "무엇이든 캡처", "scan.kicker": "강의계획서 가져오기", "scan.title_preview": "미리보고 잠금 해제.", "scan.title": "가져오기. 검토. 시작.", "scan.upload_pdf": "강의계획서 PDF 업로드", "scan.camera": "카메라", "scan.photo": "사진", "scan.paste_text": "텍스트 붙여넣기", "scan.notes_title": "노트 스캔", "scan.notes_body": "요약, 개념, 카드, 퀴즈, 복습 작업 생성.", "scan.quick_title": "빠른 캡처", "scan.quick_body": "과목, 과제, 마감일, 예상 시간을 입력.", "scan.quick_button": "작업 생성 + 다시 계획",
  "paywall.title": "{name}님, 학기를 실시간으로 관리하세요.", "paywall.sub_no_import": "먼저 잠금 해제하고 스캔해 대시보드, 위젯, 알림, 다음 행동에 학기를 표시하세요.", "paywall.sub_import": "미리보기가 준비되었습니다. 잠금 해제하면 대시보드, 알림, 위젯에 적용됩니다.",
});

Object.assign(APP_COPY["zh-Hans"], {
  "common.continue": "继续", "common.cancel": "取消", "common.close": "关闭", "common.edit": "编辑", "common.save": "保存", "common.archive": "归档", "common.delete": "删除", "common.restore": "恢复购买", "common.terms": "条款", "common.privacy": "隐私", "common.support": "支持",
  "onboarding.name_title": "StudyPlanner 该怎么称呼你？", "onboarding.name_sub": "一起搭好你的学期。", "onboarding.name_placeholder": "你的名字", "onboarding.nice": "好的，{name}。", "onboarding.student_kicker": "好的，{name}", "onboarding.student_title": "你要管理什么？", "onboarding.goal_title": "你想先稳住什么？", "onboarding.artifacts_title": "把课程任务变成实时计划。", "onboarding.artifacts_sub": "真实应用界面，没有演示课程。", "onboarding.build_title": "建立你的学期。", "onboarding.paywall_first": "先解锁，再扫描。",
  "option.school_semester": "学校学期", "option.high_school": "高中课程", "option.college": "大学课程", "option.grad": "研究生课程", "option.online": "在线课程", "option.exams": "考试", "option.deadlines": "截止日期", "option.notes": "笔记", "option.grades": "成绩", "option.study_plan": "学习计划", "option.everything": "全部", "option.upload_pdf": "上传 PDF", "option.paste_syllabus": "粘贴大纲", "option.scan_camera": "用相机扫描", "option.skip": "暂时跳过",
  "locked.kicker": "锁定预览", "locked.title": "{name}，建立你的学期。", "locked.sub": "先解锁 StudyPlanner。然后扫描课程大纲，并应用你的实时计划。", "locked.card_kicker": "解锁后扫描大纲", "locked.card_title": "把课程大纲变成实时计划。", "locked.step1": "解锁 StudyPlanner", "locked.step2": "扫描课程大纲", "locked.step3": "检查截止日期", "locked.scan": "扫描课程大纲", "locked.paste": "手动粘贴", "locked.health": "学期健康", "locked.health_title": "锁定预览", "locked.health_sub": "课程大纲检查并应用后会显示分数。", "locked.unlock": "解锁 StudyPlanner",
  "scan.header_preview": "大纲预览", "scan.header": "扫描", "scan.sub_preview": "解锁前先预览", "scan.sub": "捕捉任何内容", "scan.kicker": "导入课程大纲", "scan.title_preview": "先预览，再解锁。", "scan.title": "导入。检查。开始。", "scan.upload_pdf": "上传课程大纲 PDF", "scan.camera": "相机", "scan.photo": "照片", "scan.paste_text": "粘贴文本", "scan.notes_title": "扫描笔记", "scan.notes_body": "生成摘要、概念、卡片、测验和复习任务。", "scan.quick_title": "快速捕捉", "scan.quick_body": "输入课程、任务、截止日期和预计时间。", "scan.quick_button": "创建任务并重新规划",
  "paywall.title": "{name}，让学期实时运转。", "paywall.sub_no_import": "先解锁再扫描，让学期同步到首页、组件、提醒和下一步。", "paywall.sub_import": "预览已准备好。解锁后即可应用到首页、提醒和组件。",
});

Object.assign(APP_COPY.hi, {
  "common.continue": "जारी रखें", "common.cancel": "रद्द करें", "common.close": "बंद करें", "common.edit": "संपादित करें", "common.save": "सहेजें", "common.archive": "आर्काइव", "common.delete": "हटाएं", "common.restore": "खरीदारी पुनर्स्थापित करें", "common.terms": "शर्तें", "common.privacy": "गोपनीयता", "common.support": "सहायता",
  "onboarding.name_title": "StudyPlanner आपको क्या कहे?", "onboarding.name_sub": "आपका सेमेस्टर बनाते हैं।", "onboarding.name_placeholder": "आपका पहला नाम", "onboarding.nice": "बढ़िया, {name}.", "onboarding.student_kicker": "बढ़िया, {name}", "onboarding.student_title": "आप क्या संभाल रहे हैं?", "onboarding.goal_title": "आप क्या नियंत्रण में रखना चाहते हैं?", "onboarding.artifacts_title": "StudyPlanner आपकी पढ़ाई को सक्रिय योजना में बदलता है।", "onboarding.artifacts_sub": "ऐप की असली स्क्रीन। कोई नमूना कक्षा नहीं।", "onboarding.build_title": "अपना सेमेस्टर बनाएं।", "onboarding.paywall_first": "पहले अनलॉक करें, फिर स्कैन करें।",
  "locked.kicker": "बंद पूर्वावलोकन", "locked.title": "{name}, अपना सेमेस्टर बनाएं।", "locked.sub": "पहले StudyPlanner अनलॉक करें। फिर पाठ्यक्रम स्कैन करके सक्रिय योजना लागू करें।", "locked.card_kicker": "अनलॉक के बाद पाठ्यक्रम", "locked.card_title": "पाठ्यक्रम को सक्रिय योजना में बदलें।", "locked.step1": "StudyPlanner अनलॉक करें", "locked.step2": "पाठ्यक्रम स्कैन करें", "locked.step3": "समय-सीमाएं जांचें", "locked.scan": "पाठ्यक्रम स्कैन करें", "locked.paste": "हाथ से चिपकाएं", "locked.health": "सेमेस्टर स्थिति", "locked.health_title": "बंद पूर्वावलोकन", "locked.health_sub": "पाठ्यक्रम जांचकर लागू होने के बाद आपका स्कोर दिखेगा।", "locked.unlock": "StudyPlanner अनलॉक करें",
  "scan.header_preview": "पाठ्यक्रम पूर्वावलोकन", "scan.header": "स्कैन", "scan.sub_preview": "अनलॉक से पहले पूर्वावलोकन", "scan.sub": "कुछ भी सहेजें", "scan.kicker": "पाठ्यक्रम आयात", "scan.title_preview": "पूर्वावलोकन। फिर अनलॉक।", "scan.title": "आयात करें। जांचें। शुरू करें।", "scan.upload_pdf": "पाठ्यक्रम PDF अपलोड करें", "scan.camera": "कैमरा", "scan.photo": "फोटो", "scan.paste_text": "टेक्स्ट चिपकाएं", "scan.notes_title": "नोट्स स्कैन करें", "scan.notes_body": "सारांश, शब्द, अभ्यास कार्ड, प्रश्नोत्तरी और दोहराई के काम।", "scan.quick_title": "त्वरित सहेजना", "scan.quick_body": "कक्षा, काम, तारीख और अनुमान लिखें।", "scan.quick_button": "काम बनाएं + योजना दोबारा बनाएं",
  "paywall.title": "{name}, अपना सक्रिय सेमेस्टर बनाएं।", "paywall.sub_no_import": "पहले अनलॉक करें, फिर स्कैन करें ताकि सेमेस्टर मुख्य पटल, छोटे विजेट, याद दिलाने वाली सूचनाओं और अगले कदमों में दिखे।", "paywall.sub_import": "आपका पूर्वावलोकन तैयार है। मुख्य पटल, सूचनाओं और छोटे विजेट पर लागू करने के लिए अनलॉक करें।",
});

Object.assign(APP_COPY.ar, {
  "common.continue": "متابعة", "common.cancel": "إلغاء", "common.close": "إغلاق", "common.edit": "تعديل", "common.save": "حفظ", "common.archive": "أرشفة", "common.delete": "حذف", "common.restore": "استعادة المشتريات", "common.terms": "الشروط", "common.privacy": "الخصوصية", "common.support": "الدعم",
  "onboarding.name_title": "بماذا يناديك StudyPlanner؟", "onboarding.name_sub": "لنجهّز فصلك الدراسي.", "onboarding.name_placeholder": "اسمك الأول", "onboarding.nice": "جميل، {name}.", "onboarding.student_kicker": "جميل، {name}", "onboarding.student_title": "ماذا تريد تنظيمه؟", "onboarding.goal_title": "ما الذي تريد ضبطه؟", "onboarding.artifacts_title": "يحوّل StudyPlanner عملك الدراسي إلى خطة حيّة.", "onboarding.artifacts_sub": "شاشات تطبيق حقيقية. لا صفوف تجريبية.", "onboarding.build_title": "ابنِ فصلك الدراسي.", "onboarding.paywall_first": "افتح أولاً، ثم امسح.",
  "option.school_semester": "فصل دراسي", "option.high_school": "صفوف الثانوية", "option.college": "مقررات الجامعة", "option.grad": "دراسات عليا", "option.online": "دروس عبر الإنترنت", "option.exams": "اختبارات", "option.deadlines": "مواعيد نهائية", "option.notes": "ملاحظات", "option.grades": "درجات", "option.study_plan": "خطة دراسة", "option.everything": "كل شيء", "option.upload_pdf": "رفع PDF", "option.paste_syllabus": "لصق المنهج", "option.scan_camera": "المسح بالكاميرا", "option.skip": "تخطي الآن",
  "locked.kicker": "معاينة مقفلة", "locked.title": "{name}، ابنِ فصلك الدراسي.", "locked.sub": "افتح StudyPlanner أولاً. بعدها امسح المنهج وطبّق خطتك الحيّة.", "locked.card_kicker": "المنهج بعد الفتح", "locked.card_title": "حوّل المنهج إلى خطة حيّة.", "locked.step1": "افتح StudyPlanner", "locked.step2": "امسح المنهج", "locked.step3": "راجع المواعيد", "locked.scan": "امسح المنهج", "locked.paste": "الصق يدويًا", "locked.health": "صحة الفصل", "locked.health_title": "معاينة مقفلة", "locked.health_sub": "تظهر درجتك بعد مراجعة المنهج وتطبيقه.", "locked.unlock": "افتح StudyPlanner",
  "scan.header_preview": "معاينة المنهج", "scan.header": "مسح", "scan.sub_preview": "عاين قبل الفتح", "scan.sub": "التقط أي شيء", "scan.kicker": "استيراد المنهج", "scan.title_preview": "عاين. ثم افتح.", "scan.title": "استورد. راجع. ابدأ.", "scan.upload_pdf": "ارفع PDF المنهج", "scan.camera": "الكاميرا", "scan.photo": "صورة", "scan.paste_text": "لصق النص", "scan.notes_title": "امسح الملاحظات", "scan.notes_body": "ملخصات ومفاهيم وبطاقات واختبارات ومهام مراجعة.", "scan.quick_title": "التقاط سريع", "scan.quick_body": "اكتب المادة والمهمة والموعد والوقت.", "scan.quick_button": "أنشئ مهمة وأعد التخطيط",
  "paywall.title": "{name}، ابنِ فصلك الحي.", "paywall.sub_no_import": "افتح أولاً ثم امسح ليظهر فصلك في اللوحة والويدجت والتذكيرات والخطوات التالية.", "paywall.sub_import": "معاينتك جاهزة. افتح لتطبيقها على اللوحة والتذكيرات والويدجت.",
});

const LOCALE_COMPLETIONS: Record<Exclude<SupportedLocale, "en-US">, Record<string, string>> = {
  de: {
    "tabs.today": "Heute", "tabs.classes": "Kurse", "tabs.scan": "Scan", "tabs.plan": "Plan", "tabs.profile": "Profil",
    "option.school_semester": "Schulsemester", "option.high_school": "Oberstufe", "option.college": "Uni-Kurse", "option.grad": "Graduiertenstudium", "option.online": "Onlinekurse", "option.exams": "Prüfungen", "option.deadlines": "Fristen", "option.notes": "Notizen", "option.grades": "Noten", "option.study_plan": "Lernplan", "option.everything": "Alles", "option.upload_pdf": "PDF hochladen", "option.paste_syllabus": "syllabus einfügen", "option.scan_camera": "Mit Kamera scannen", "option.skip": "Vorerst überspringen",
    "paywall.message_loading": "Verbindung zum App Store...", "paywall.message_choose": "Wähle einen StudyPlanner-Plan.", "paywall.message_unavailable": "App-Store-Preise sind nicht geladen. Wiederherstellen ist verfügbar.", "paywall.benefit_apply": "syllabus anwenden", "paywall.benefit_health": "Semesterstatus verfolgen", "paywall.benefit_exams": "Prüfungen vorausplanen", "paywall.benefit_reminders": "Erinnerungen abstimmen", "paywall.benefit_widgets": "Widgets aktuell halten", "paywall.unlock": "{plan} freischalten", "paywall.loading_price": "App-Store-Preis wird geladen", "paywall.opening": "App Store wird geöffnet...", "paywall.restoring": "Wiederherstellung...", "paywall.legal": "Automatisch verlängerbares Abo. Preis und Bedingungen zeigt der App Store vor dem Kauf. Verwalten oder kündigen in Apple-Abos.",
    "classes.add_manual": "Kurs manuell hinzufügen", "classes.archived": "Archiviert", "class.forecast": "Prognose", "class.due": "Fällig", "class.archive_title": "Kurs archivieren?", "class.archive_body": "{code} verschwindet aus Heute, Plan, Erinnerungen und Widgets. Die Arbeit bleibt im Semester-Manager wiederherstellbar.", "class.delete_title": "Kurs endgültig löschen?", "class.archive_instead": "Stattdessen archivieren", "class.not_found": "Kurs nicht gefunden", "class.not_found_body": "Dieser Kurs ist nicht mehr in diesem Semester.", "class.open_dashboard": "Dashboard öffnen",
    "plan.autopilot": "Autopilot", "plan.rebuild": "Plan neu bauen", "plan.focus_blocks": "Fokusblöcke", "plan.regenerate": "Neu generieren", "plan.study": "Lernen", "plan.clear_day": "Freier Tag.", "notes.all": "Alle", "notes.empty_title": "Keine Notizen geladen", "notes.empty_body": "Scanne oder füge Vorlesungsnotizen ein, um Zusammenfassungen, Karten, Quizze und Aufgaben zu erstellen.", "notes.scan": "Notizen scannen", "notes.paste": "Notizen einfügen",
    "widgets.row_today": "StudyPlanner Heute", "widgets.row_today_body": "Status, nächste Frist und Fokusblock", "widgets.row_upcoming": "Demnächst", "widgets.row_upcoming_body": "Aufgaben und Prüfungen", "widgets.row_week": "Wochenlast", "widgets.row_week_body": "Druck pro Woche", "widgets.row_class": "Kursfortschritt", "widgets.row_class_body": "Ausgewählter Kurspuls", "widgets.ready": "bereit", "widgets.locked": "gesperrt"
  },
  es: {
    "tabs.today": "Hoy", "tabs.classes": "Clases", "tabs.scan": "Escanear", "tabs.plan": "Plan", "tabs.profile": "Perfil",
    "option.school_semester": "Semestre escolar", "option.high_school": "Prepa", "option.college": "Universidad", "option.grad": "Posgrado", "option.online": "Clases online", "option.exams": "Exámenes", "option.deadlines": "Entregas", "option.notes": "Notas", "option.grades": "Calificaciones", "option.study_plan": "Plan de estudio", "option.everything": "Todo", "option.upload_pdf": "Subir PDF", "option.paste_syllabus": "Pegar programa", "option.scan_camera": "Escanear con cámara", "option.skip": "Omitir por ahora",
    "locked.after_scan": "tras escanear", "locked.workload": "Carga", "locked.grades": "Notas", "locked.preparedness": "Preparación", "locked.consistency": "Constancia", "locked.workload_body": "Bloqueado hasta revisar tu programa.", "locked.grades_body": "Bloqueado hasta tener clases reales.", "locked.preparedness_body": "Bloqueado hasta tener notas y exámenes.", "locked.consistency_body": "Bloqueado hasta que StudyPlanner vea tu plan.",
    "scan.more": "Más capturas", "scan.history": "Historial de importación", "scan.empty_history": "Aún no hay importaciones. Pega un programa o notas para empezar.",
    "paywall.message_loading": "Conectando con App Store...", "paywall.message_choose": "Elige un plan de StudyPlanner.", "paywall.message_unavailable": "Los precios de App Store no cargaron. Restaurar sigue disponible.", "paywall.benefit_apply": "Aplicar tu programa", "paywall.benefit_health": "Seguir la salud del semestre", "paywall.benefit_exams": "Anticipar exámenes", "paywall.benefit_reminders": "Ajustar recordatorios", "paywall.benefit_widgets": "Mantener widgets al día", "paywall.unlock": "Desbloquear {plan}", "paywall.loading_price": "Cargando precio de App Store", "paywall.opening": "Abriendo App Store...", "paywall.restoring": "Restaurando...", "paywall.legal": "Suscripción autorrenovable. App Store muestra precio y términos antes de comprar. Gestiona o cancela en suscripciones de Apple.",
    "today.next_move": "Siguiente paso", "today.next_class": "Próxima clase", "today.deadline": "Entrega", "today.focus": "Enfoque", "today.open_plan": "Abrir plan", "today.start_focus": "Iniciar foco", "today.next_30": "Próximos 30 días", "today.risk_radar": "Radar de riesgo", "today.upcoming_deadlines": "Próximas entregas", "today.upcoming_assessments": "Próximos exámenes", "today.notes_activity": "Actividad de notas",
    "classes.title": "Gestionar semestre", "classes.truth": "Una sola fuente de verdad", "classes.truth_body": "Corrige importaciones, añade trabajo pendiente y mantén Hoy, Plan, recordatorios y widgets sincronizados.", "classes.add": "Añadir clase", "classes.import": "Importar", "classes.empty_title": "Aún no hay clases activas.", "classes.empty_body": "Empieza manualmente si el programa falta, no se lee o está mal.", "classes.add_manual": "Añadir clase manualmente", "classes.archived": "Archivadas",
    "class.schedule": "Horario", "class.add_work": "Añadir trabajo", "class.add_work_body": "Añade quiz, proyecto o tarea sin reimportar.", "class.assignment": "Tarea", "class.assessment": "Examen", "class.pulse": "Pulso de clase", "class.assignments": "Tareas", "class.exams": "Próximos exámenes", "class.notes": "Notas recientes", "class.forecast": "Pronóstico", "class.due": "Pendiente", "class.archive_title": "¿Archivar clase?", "class.archive_body": "{code} saldrá de Hoy, Plan, recordatorios y widgets. Podrás recuperarla desde Gestionar semestre.", "class.delete_title": "¿Eliminar clase permanentemente?", "class.archive_instead": "Archivar mejor", "class.not_found": "Clase no encontrada", "class.not_found_body": "Esa clase ya no está en este semestre.", "class.open_dashboard": "Abrir panel",
    "review.title": "Revisar importación", "review.empty": "No hay importación pendiente.", "review.guard_preview": "Solo vista previa.", "review.guard_preview_body": "Desbloquea para aplicar este semestre real.", "review.guard_active": "Nada se guarda hasta que apruebes.", "review.guard_active_body": "Edita, elimina o confirma cada elemento.", "review.found": "StudyPlanner encontró tu semestre.", "review.classes": "clases", "review.assignments": "tareas", "review.exams": "exámenes", "review.approve": "Aprobar confiables", "review.manual": "Configurar manualmente", "review.unlock": "Desbloquear mi semestre", "review.apply": "Aplicar horario",
    "plan.title": "Plan", "plan.sub_suffix": "autopiloto del semestre", "plan.notes_feed": "{count} notas alimentan el plan", "plan.autopilot": "Autopiloto", "plan.rebuild": "Reconstruir plan", "plan.focus_blocks": "Bloques de enfoque", "plan.regenerate": "Regenerar", "plan.study": "Estudiar", "plan.clear_day": "Día despejado.", "notes.title": "Notas", "notes.sub": "{score} preparación · {count} notas", "notes.body": "Las notas suben la preparación y afinan el pulso de clase.", "notes.all": "Todas", "notes.empty_title": "No hay notas cargadas", "notes.empty_body": "Escanea o pega apuntes para crear resúmenes, tarjetas, quizzes y tareas.", "notes.scan": "Escanear notas", "notes.paste": "Pegar notas",
    "widgets.title": "Widgets", "widgets.sub_ready": "Vistas de pantalla de inicio", "widgets.sub_locked": "Vista bloqueada", "widgets.ready_title": "Widgets sincronizados", "widgets.locked_title": "Desbloquear widgets", "widgets.ready_body": "{score} de loop listo para widgets de iOS.", "widgets.locked_body": "Aplica un programa y desbloquea para mantener widgets al día.", "widgets.sync": "Sincronizar desde panel", "widgets.row_today": "StudyPlanner Hoy", "widgets.row_today_body": "Salud, próxima entrega y bloque de enfoque", "widgets.row_upcoming": "Próximo", "widgets.row_upcoming_body": "Tareas y exámenes por venir", "widgets.row_week": "Carga semanal", "widgets.row_week_body": "Presión por semana", "widgets.row_class": "Progreso de clase", "widgets.row_class_body": "Pulso de la clase elegida", "widgets.ready": "listo", "widgets.locked": "bloqueado"
  },
  fr: {
    "tabs.today": "Aujourd’hui", "tabs.classes": "Cours", "tabs.scan": "Scanner", "tabs.plan": "Plan", "tabs.profile": "Profil",
    "option.school_semester": "Semestre scolaire", "option.high_school": "Lycée", "option.college": "Université", "option.grad": "Master/doctorat", "option.online": "Cours en ligne", "option.exams": "Examens", "option.deadlines": "Échéances", "option.notes": "Notes", "option.grades": "Notes", "option.study_plan": "Plan de révision", "option.everything": "Tout", "option.upload_pdf": "Importer PDF", "option.paste_syllabus": "Coller le syllabus", "option.scan_camera": "Scanner avec caméra", "option.skip": "Ignorer pour l’instant",
    "locked.after_scan": "après numérisation", "locked.workload": "Charge", "locked.grades": "Notes", "locked.preparedness": "Préparation", "locked.consistency": "Régularité", "locked.workload_body": "Verrouillé jusqu’à validation du syllabus.", "locked.grades_body": "Verrouillé jusqu’à l’ajout de vrais cours.", "locked.preparedness_body": "Verrouillé jusqu’aux notes et examens.", "locked.consistency_body": "Verrouillé jusqu’à ce que StudyPlanner voie ton plan.",
    "scan.more": "Autres ajouts", "scan.history": "Historique d’import", "scan.empty_history": "Aucun import pour l’instant. Colle un syllabus ou des notes.",
    "paywall.message_loading": "Connexion à l’App Store...", "paywall.message_choose": "Choisis un plan StudyPlanner.", "paywall.message_unavailable": "Les prix App Store ne sont pas chargés. La restauration reste disponible.", "paywall.benefit_apply": "Appliquer ton syllabus", "paywall.benefit_health": "Suivre la santé du semestre", "paywall.benefit_exams": "Anticiper les examens", "paywall.benefit_reminders": "Régler les rappels", "paywall.benefit_widgets": "Garder les widgets à jour", "paywall.unlock": "Déverrouiller {plan}", "paywall.loading_price": "Chargement du prix App Store", "paywall.opening": "Ouverture de l’App Store...", "paywall.restoring": "Restauration...", "paywall.legal": "Abonnement renouvelable automatiquement. L’App Store affiche prix et conditions avant achat. Gestion ou annulation dans les abonnements Apple.",
    "today.next_move": "Prochaine action", "today.next_class": "Prochain cours", "today.deadline": "Échéance", "today.focus": "Focus", "today.open_plan": "Ouvrir le plan", "today.start_focus": "Lancer focus", "today.next_30": "30 prochains jours", "today.risk_radar": "Radar de risque", "today.upcoming_deadlines": "Échéances à venir", "today.upcoming_assessments": "Examens à venir", "today.notes_activity": "Activité des notes",
    "classes.title": "Gérer le semestre", "classes.truth": "Une seule source fiable", "classes.truth_body": "Corrige les imports, ajoute le travail manquant et garde Aujourd’hui, Plan, rappels et widgets synchronisés.", "classes.add": "Ajouter un cours", "classes.import": "Importer", "classes.empty_title": "Aucun cours actif.", "classes.empty_body": "Commence manuellement si le syllabus manque, est illisible ou faux.", "classes.add_manual": "Ajouter manuellement", "classes.archived": "Archivés",
    "class.schedule": "Horaire", "class.add_work": "Ajouter du travail", "class.add_work_body": "Ajoute quiz, projet ou devoir sans réimporter.", "class.assignment": "Devoir", "class.assessment": "Examen", "class.pulse": "Pouls du cours", "class.assignments": "Devoirs", "class.exams": "Examens à venir", "class.notes": "Notes récentes", "class.forecast": "Prévision", "class.due": "À rendre", "class.archive_title": "Archiver le cours ?", "class.archive_body": "{code} quittera Aujourd’hui, Plan, rappels et widgets. Son travail reste récupérable dans Gérer le semestre.", "class.delete_title": "Supprimer définitivement ?", "class.archive_instead": "Archiver plutôt", "class.not_found": "Cours introuvable", "class.not_found_body": "Ce cours n’est plus dans ce semestre.", "class.open_dashboard": "Ouvrir le tableau",
    "review.title": "Vérifier l’import", "review.empty": "Aucun import à vérifier.", "review.guard_preview": "Aperçu seulement.", "review.guard_preview_body": "Déverrouille pour appliquer ce semestre réel.", "review.guard_active": "Rien n’est enregistré avant approbation.", "review.guard_active_body": "Modifie, retire ou confirme chaque élément.", "review.found": "StudyPlanner a trouvé ton semestre.", "review.classes": "cours", "review.assignments": "devoirs", "review.exams": "examens", "review.approve": "Approuver fiables", "review.manual": "Configuration manuelle", "review.unlock": "Déverrouiller mon semestre", "review.apply": "Appliquer l’horaire",
    "plan.title": "Plan", "plan.sub_suffix": "autopilote du semestre", "plan.notes_feed": "{count} notes alimentent le plan", "plan.autopilot": "Autopilote", "plan.rebuild": "Reconstruire", "plan.focus_blocks": "Blocs focus", "plan.regenerate": "Régénérer", "plan.study": "Réviser", "plan.clear_day": "Journée dégagée.", "notes.title": "Notes", "notes.sub": "{score} préparation · {count} notes", "notes.body": "Les notes renforcent la préparation et affinent le pouls du cours.", "notes.all": "Tout", "notes.empty_title": "Aucune note chargée", "notes.empty_body": "Scanne ou colle des notes pour créer résumés, cartes, quiz et tâches.", "notes.scan": "Scanner notes", "notes.paste": "Coller notes",
    "widgets.title": "Widgets", "widgets.sub_ready": "Aperçus écran d’accueil", "widgets.sub_locked": "Aperçu verrouillé", "widgets.ready_title": "Widgets synchronisés", "widgets.locked_title": "Déverrouiller les widgets", "widgets.ready_body": "Score de boucle {score} prêt pour les widgets iOS.", "widgets.locked_body": "Applique un syllabus et déverrouille pour garder les widgets à jour.", "widgets.sync": "Synchroniser depuis le tableau", "widgets.row_today": "StudyPlanner Aujourd’hui", "widgets.row_today_body": "Santé, prochaine échéance et bloc focus", "widgets.row_upcoming": "À venir", "widgets.row_upcoming_body": "Devoirs et examens bientôt", "widgets.row_week": "Charge semaine", "widgets.row_week_body": "Pression par semaine", "widgets.row_class": "Progression cours", "widgets.row_class_body": "Pouls du cours choisi", "widgets.ready": "prêt", "widgets.locked": "verrouillé"
  },
  "pt-BR": {
    "tabs.today": "Hoje", "tabs.classes": "Aulas", "tabs.scan": "Escanear", "tabs.plan": "Plano", "tabs.profile": "Perfil",
    "option.school_semester": "Semestre escolar", "option.high_school": "Ensino médio", "option.college": "Faculdade", "option.grad": "Pós-graduação", "option.online": "Aulas online", "option.exams": "Provas", "option.deadlines": "Prazos", "option.notes": "Notas", "option.grades": "Notas", "option.study_plan": "Plano de estudo", "option.everything": "Tudo", "option.upload_pdf": "Enviar PDF", "option.paste_syllabus": "Colar plano", "option.scan_camera": "Escanear com câmera", "option.skip": "Pular por enquanto",
    "locked.after_scan": "após escanear", "locked.workload": "Carga", "locked.grades": "Notas", "locked.preparedness": "Preparo", "locked.consistency": "Constância", "locked.workload_body": "Bloqueado até revisar seu plano.", "locked.grades_body": "Bloqueado até existirem aulas reais.", "locked.preparedness_body": "Bloqueado até haver notas e provas.", "locked.consistency_body": "Bloqueado até o StudyPlanner ver seu plano.",
    "scan.more": "Mais capturas", "scan.history": "Histórico de importação", "scan.empty_history": "Sem importações ainda. Cole um plano ou notas para começar.",
    "paywall.message_loading": "Conectando à App Store...", "paywall.message_choose": "Escolha um plano StudyPlanner.", "paywall.message_unavailable": "Preços da App Store não carregaram. Restaurar está disponível.", "paywall.benefit_apply": "Aplicar seu plano", "paywall.benefit_health": "Acompanhar saúde do semestre", "paywall.benefit_exams": "Antecipar provas", "paywall.benefit_reminders": "Ajustar lembretes", "paywall.benefit_widgets": "Manter widgets atuais", "paywall.unlock": "Desbloquear {plan}", "paywall.loading_price": "Carregando preço da App Store", "paywall.opening": "Abrindo App Store...", "paywall.restoring": "Restaurando...", "paywall.legal": "Assinatura com renovação automática. A App Store mostra preço e termos antes da compra. Gerencie ou cancele nas assinaturas Apple.",
    "today.next_move": "Próximo passo", "today.next_class": "Próxima aula", "today.deadline": "Prazo", "today.focus": "Foco", "today.open_plan": "Abrir plano", "today.start_focus": "Iniciar foco", "today.next_30": "Próximos 30 dias", "today.risk_radar": "Radar de risco", "today.upcoming_deadlines": "Próximos prazos", "today.upcoming_assessments": "Próximas provas", "today.notes_activity": "Atividade de notas",
    "classes.title": "Gerenciar semestre", "classes.truth": "Fonte única da verdade", "classes.truth_body": "Corrija importações, adicione pendências e mantenha Hoje, Plano, lembretes e widgets sincronizados.", "classes.add": "Adicionar aula", "classes.import": "Importar", "classes.empty_title": "Ainda não há aulas ativas.", "classes.empty_body": "Comece manualmente se o plano faltar, estiver ilegível ou errado.", "classes.add_manual": "Adicionar aula manualmente", "classes.archived": "Arquivadas",
    "class.schedule": "Horário", "class.add_work": "Adicionar pendência", "class.add_work_body": "Adicione prova, projeto ou tarefa sem reimportar.", "class.assignment": "Tarefa", "class.assessment": "Prova", "class.pulse": "Pulso da aula", "class.assignments": "Tarefas", "class.exams": "Próximas provas", "class.notes": "Notas recentes", "class.forecast": "Previsão", "class.due": "Pendências", "class.archive_title": "Arquivar aula?", "class.archive_body": "{code} sairá de Hoje, Plano, lembretes e widgets. O trabalho fica recuperável em Gerenciar semestre.", "class.delete_title": "Excluir aula permanentemente?", "class.archive_instead": "Arquivar em vez disso", "class.not_found": "Aula não encontrada", "class.not_found_body": "Essa aula não está mais neste semestre.", "class.open_dashboard": "Abrir painel",
    "review.title": "Revisar importação", "review.empty": "Nenhuma importação aguardando revisão.", "review.guard_preview": "Somente prévia.", "review.guard_preview_body": "Desbloqueie para aplicar este semestre real.", "review.guard_active": "Nada salva até você aprovar.", "review.guard_active_body": "Edite, remova ou confirme cada item.", "review.found": "StudyPlanner encontrou seu semestre.", "review.classes": "aulas", "review.assignments": "tarefas", "review.exams": "provas", "review.approve": "Aprovar confiáveis", "review.manual": "Configurar manualmente", "review.unlock": "Desbloquear meu semestre", "review.apply": "Aplicar horário",
    "plan.title": "Plano", "plan.sub_suffix": "autopiloto do semestre", "plan.notes_feed": "{count} notas alimentam o plano", "plan.autopilot": "Autopiloto", "plan.rebuild": "Reconstruir plano", "plan.focus_blocks": "Blocos de foco", "plan.regenerate": "Regenerar", "plan.study": "Estudar", "plan.clear_day": "Dia livre.", "notes.title": "Notas", "notes.sub": "{score} preparo · {count} notas", "notes.body": "Notas aumentam o preparo e afinam o pulso da aula.", "notes.all": "Todas", "notes.empty_title": "Nenhuma nota carregada", "notes.empty_body": "Escaneie ou cole anotações para criar resumos, cartões, quizzes e tarefas.", "notes.scan": "Escanear notas", "notes.paste": "Colar notas",
    "widgets.title": "Widgets", "widgets.sub_ready": "Prévia da Tela de Início", "widgets.sub_locked": "Prévia bloqueada", "widgets.ready_title": "Widgets sincronizados", "widgets.locked_title": "Desbloquear widgets", "widgets.ready_body": "Pontuação de loop {score} pronta para widgets iOS.", "widgets.locked_body": "Aplique um plano e desbloqueie para manter widgets atuais.", "widgets.sync": "Sincronizar do painel", "widgets.row_today": "StudyPlanner Hoje", "widgets.row_today_body": "Saúde, próximo prazo e bloco de foco", "widgets.row_upcoming": "Próximos", "widgets.row_upcoming_body": "Tarefas e provas em breve", "widgets.row_week": "Carga semanal", "widgets.row_week_body": "Pressão por semana", "widgets.row_class": "Progresso da aula", "widgets.row_class_body": "Pulso da aula escolhida", "widgets.ready": "pronto", "widgets.locked": "bloqueado"
  },
  ja: {
    "tabs.today": "今日", "tabs.classes": "授業", "tabs.scan": "スキャン", "tabs.plan": "計画", "tabs.profile": "プロフィール",
    "locked.after_scan": "スキャン後", "locked.workload": "負荷", "locked.grades": "成績", "locked.preparedness": "準備", "locked.consistency": "継続", "locked.workload_body": "シラバス確認後に解除されます。", "locked.grades_body": "実際の授業が入ると解除されます。", "locked.preparedness_body": "ノートと試験が入ると解除されます。", "locked.consistency_body": "StudyPlannerが計画を把握すると解除されます。", "scan.more": "その他の取り込み", "scan.history": "取り込み履歴", "scan.empty_history": "まだ取り込みはありません。シラバスやノートを貼り付けて始めましょう。",
    "paywall.message_loading": "App Storeに接続中...", "paywall.message_choose": "StudyPlannerのプランを選択してください。", "paywall.message_unavailable": "App Store価格を読み込めません。復元は利用できます。", "paywall.benefit_apply": "シラバスを適用", "paywall.benefit_health": "学期ヘルスを確認", "paywall.benefit_exams": "試験に先回り", "paywall.benefit_reminders": "リマインダーを調整", "paywall.benefit_widgets": "ウィジェットを最新に", "paywall.unlock": "{plan}を解除", "paywall.loading_price": "App Store価格を読み込み中", "paywall.opening": "App Storeを開いています...", "paywall.restoring": "復元中...", "paywall.legal": "自動更新サブスクリプションです。購入前にApp Storeで価格と条件が表示されます。管理や解約はAppleのサブスクリプションから行えます。",
    "today.next_move": "次の行動", "today.next_class": "次の授業", "today.deadline": "締切", "today.focus": "集中", "today.open_plan": "計画を開く", "today.start_focus": "集中開始", "today.next_30": "次の30日", "today.risk_radar": "リスクレーダー", "today.upcoming_deadlines": "今後の締切", "today.upcoming_assessments": "今後の試験", "today.notes_activity": "ノート活動",
    "classes.title": "学期を管理", "classes.truth": "ひとつの正しい場所", "classes.truth_body": "取り込みを直し、抜けた課題を追加し、今日、計画、リマインダー、ウィジェットを同期。", "classes.add": "授業を追加", "classes.import": "取り込み", "classes.empty_title": "有効な授業はまだありません。", "classes.empty_body": "シラバスがない、読めない、間違っている場合は手動で始められます。", "classes.add_manual": "手動で授業を追加", "classes.archived": "アーカイブ",
    "class.schedule": "時間割", "class.add_work": "課題を追加", "class.add_work_body": "再取り込みなしで小テスト、プロジェクト、課題を追加。", "class.assignment": "課題", "class.assessment": "試験", "class.pulse": "授業パルス", "class.assignments": "課題", "class.exams": "今後の試験", "class.notes": "最近のノート", "class.forecast": "予測", "class.due": "締切", "class.archive_title": "授業をアーカイブしますか？", "class.archive_body": "{code}は今日、計画、リマインダー、ウィジェットから外れます。学期管理から復元できます。", "class.delete_title": "授業を完全に削除しますか？", "class.archive_instead": "代わりにアーカイブ", "class.not_found": "授業が見つかりません", "class.not_found_body": "この授業はもう学期にありません。", "class.open_dashboard": "ダッシュボードを開く",
    "review.title": "取り込みを確認", "review.empty": "確認待ちの取り込みはありません。", "review.guard_preview": "プレビューのみ。", "review.guard_preview_body": "解除すると実際のアプリに適用できます。", "review.guard_active": "承認するまで保存されません。", "review.guard_active_body": "各項目を編集、削除、確認できます。", "review.found": "StudyPlannerが学期を見つけました。", "review.classes": "授業", "review.assignments": "課題", "review.exams": "試験", "review.approve": "信頼項目を承認", "review.manual": "手動設定", "review.unlock": "学期を解除", "review.apply": "時間割を適用",
    "plan.title": "計画", "plan.sub_suffix": "学期オートパイロット", "plan.notes_feed": "{count}件のノートが計画に反映", "plan.autopilot": "オートパイロット", "plan.rebuild": "計画を再作成", "plan.focus_blocks": "集中ブロック", "plan.regenerate": "再生成", "plan.study": "学習", "plan.clear_day": "予定なし。", "notes.title": "ノート", "notes.sub": "準備{score} · {count}件", "notes.body": "ノートが準備度と授業パルスを高めます。", "notes.all": "すべて", "notes.empty_title": "ノート未読み込み", "notes.empty_body": "講義ノートをスキャンまたは貼り付けて、要約、カード、クイズ、タスクを作成。", "notes.scan": "ノートをスキャン", "notes.paste": "ノートを貼り付け",
    "widgets.title": "ウィジェット", "widgets.sub_ready": "ホーム画面スナップショット", "widgets.sub_locked": "ロック中のプレビュー", "widgets.ready_title": "ウィジェット同期済み", "widgets.locked_title": "ウィジェットを解除", "widgets.ready_body": "ループスコア{score}をiOSウィジェットに反映できます。", "widgets.locked_body": "シラバスを適用して解除すると最新に保てます。", "widgets.sync": "ダッシュボードから同期", "widgets.row_today": "StudyPlanner 今日", "widgets.row_today_body": "ヘルス、次の締切、集中ブロック", "widgets.row_upcoming": "まもなく", "widgets.row_upcoming_body": "課題と試験の予定", "widgets.row_week": "週の負荷", "widgets.row_week_body": "週ごとの負荷", "widgets.row_class": "授業進捗", "widgets.row_class_body": "選択した授業パルス", "widgets.ready": "準備済み", "widgets.locked": "ロック中"
  },
  ko: {
    "tabs.today": "오늘", "tabs.classes": "수업", "tabs.scan": "스캔", "tabs.plan": "계획", "tabs.profile": "프로필",
    "option.school_semester": "학교 학기", "option.high_school": "고등학교 수업", "option.college": "대학 강의", "option.grad": "대학원", "option.online": "온라인 수업", "option.exams": "시험", "option.deadlines": "마감", "option.notes": "노트", "option.grades": "성적", "option.study_plan": "학습 계획", "option.everything": "전체", "option.upload_pdf": "PDF 업로드", "option.paste_syllabus": "강의계획서 붙여넣기", "option.scan_camera": "카메라로 스캔", "option.skip": "지금은 건너뛰기",
    "locked.after_scan": "스캔 후", "locked.workload": "부담", "locked.grades": "성적", "locked.preparedness": "준비도", "locked.consistency": "꾸준함", "locked.workload_body": "강의계획서 검토 후 열립니다.", "locked.grades_body": "실제 수업이 생기면 열립니다.", "locked.preparedness_body": "노트와 시험이 생기면 열립니다.", "locked.consistency_body": "StudyPlanner가 계획을 보면 열립니다.", "scan.more": "추가 캡처", "scan.history": "가져오기 기록", "scan.empty_history": "아직 가져온 항목이 없습니다. 강의계획서나 노트를 붙여넣어 시작하세요.",
    "paywall.message_loading": "App Store 연결 중...", "paywall.message_choose": "StudyPlanner 플랜을 선택하세요.", "paywall.message_unavailable": "App Store 가격을 불러오지 못했습니다. 복원은 가능합니다.", "paywall.benefit_apply": "강의계획서 적용", "paywall.benefit_health": "학기 상태 추적", "paywall.benefit_exams": "시험 대비", "paywall.benefit_reminders": "알림 타이밍 조정", "paywall.benefit_widgets": "위젯 최신 유지", "paywall.unlock": "{plan} 잠금 해제", "paywall.loading_price": "App Store 가격 로딩 중", "paywall.opening": "App Store 여는 중...", "paywall.restoring": "복원 중...", "paywall.legal": "자동 갱신 구독입니다. 구매 전 App Store에서 가격과 약관을 확인합니다. Apple 구독에서 관리하거나 취소하세요.",
    "today.next_move": "다음 할 일", "today.next_class": "다음 수업", "today.deadline": "마감", "today.focus": "집중", "today.open_plan": "계획 열기", "today.start_focus": "집중 시작", "today.next_30": "다음 30일", "today.risk_radar": "위험 레이더", "today.upcoming_deadlines": "다가오는 마감", "today.upcoming_assessments": "다가오는 시험", "today.notes_activity": "노트 활동",
    "classes.title": "학기 관리", "classes.truth": "하나의 기준", "classes.truth_body": "가져오기를 수정하고 빠진 일을 추가하며 오늘, 계획, 알림, 위젯을 맞춰 둡니다.", "classes.add": "수업 추가", "classes.import": "가져오기", "classes.empty_title": "활성 수업이 없습니다.", "classes.empty_body": "강의계획서가 없거나 읽히지 않거나 틀렸다면 직접 시작하세요.", "classes.add_manual": "수업 직접 추가", "classes.archived": "보관됨",
    "class.schedule": "시간표", "class.add_work": "빠진 일 추가", "class.add_work_body": "다시 가져오지 않고 퀴즈, 프로젝트, 과제를 추가합니다.", "class.assignment": "과제", "class.assessment": "시험", "class.pulse": "수업 펄스", "class.assignments": "과제", "class.exams": "다가오는 시험", "class.notes": "최근 노트", "class.forecast": "예측", "class.due": "마감", "class.archive_title": "수업을 보관할까요?", "class.archive_body": "{code}가 오늘, 계획, 알림, 위젯에서 사라집니다. 학기 관리에서 복원할 수 있습니다.", "class.delete_title": "수업을 영구 삭제할까요?", "class.archive_instead": "대신 보관", "class.not_found": "수업을 찾을 수 없음", "class.not_found_body": "이 수업은 더 이상 학기에 없습니다.", "class.open_dashboard": "대시보드 열기",
    "review.title": "가져오기 검토", "review.empty": "검토할 가져오기가 없습니다.", "review.guard_preview": "미리보기만.", "review.guard_preview_body": "잠금 해제하면 실제 앱에 적용됩니다.", "review.guard_active": "승인 전에는 저장되지 않습니다.", "review.guard_active_body": "각 항목을 수정, 제거, 확인하세요.", "review.found": "StudyPlanner가 학기를 찾았습니다.", "review.classes": "수업", "review.assignments": "과제", "review.exams": "시험", "review.approve": "신뢰 항목 승인", "review.manual": "직접 설정", "review.unlock": "내 학기 잠금 해제", "review.apply": "시간표 적용",
    "plan.title": "계획", "plan.sub_suffix": "학기 오토파일럿", "plan.notes_feed": "노트 {count}개가 계획에 반영", "plan.autopilot": "오토파일럿", "plan.rebuild": "계획 다시 만들기", "plan.focus_blocks": "집중 블록", "plan.regenerate": "다시 생성", "plan.study": "공부", "plan.clear_day": "비어 있는 날.", "notes.title": "노트", "notes.sub": "준비도 {score} · 노트 {count}개", "notes.body": "노트가 준비도와 수업 펄스를 높입니다.", "notes.all": "전체", "notes.empty_title": "노트가 없습니다", "notes.empty_body": "강의 노트를 스캔하거나 붙여넣어 요약, 카드, 퀴즈, 작업을 만드세요.", "notes.scan": "노트 스캔", "notes.paste": "노트 붙여넣기",
    "widgets.title": "위젯", "widgets.sub_ready": "홈 화면 스냅샷", "widgets.sub_locked": "잠긴 미리보기", "widgets.ready_title": "위젯 동기화됨", "widgets.locked_title": "위젯 잠금 해제", "widgets.ready_body": "루프 점수 {score}가 iOS 위젯에 준비되었습니다.", "widgets.locked_body": "강의계획서를 적용하고 잠금 해제해 위젯을 최신으로 유지하세요.", "widgets.sync": "대시보드에서 동기화", "widgets.row_today": "StudyPlanner 오늘", "widgets.row_today_body": "상태, 다음 마감, 집중 블록", "widgets.row_upcoming": "예정", "widgets.row_upcoming_body": "다가오는 과제와 시험", "widgets.row_week": "주간 부담", "widgets.row_week_body": "주별 압박", "widgets.row_class": "수업 진행", "widgets.row_class_body": "선택한 수업 펄스", "widgets.ready": "준비됨", "widgets.locked": "잠김"
  },
  "zh-Hans": {
    "tabs.today": "今天", "tabs.classes": "课程", "tabs.scan": "扫描", "tabs.plan": "计划", "tabs.profile": "我的",
    "locked.after_scan": "扫描后", "locked.workload": "任务量", "locked.grades": "成绩", "locked.preparedness": "准备度", "locked.consistency": "稳定性", "locked.workload_body": "课程大纲审核后解锁。", "locked.grades_body": "有真实课程后解锁。", "locked.preparedness_body": "有笔记和考试后解锁。", "locked.consistency_body": "StudyPlanner 看到计划后解锁。", "scan.more": "更多捕捉", "scan.history": "导入历史", "scan.empty_history": "还没有导入。粘贴课程大纲或笔记开始。",
    "paywall.message_loading": "正在连接 App Store...", "paywall.message_choose": "选择一个 StudyPlanner 方案。", "paywall.message_unavailable": "App Store 价格未加载，仍可恢复购买。", "paywall.benefit_apply": "应用课程大纲", "paywall.benefit_health": "跟踪学期健康", "paywall.benefit_exams": "提前准备考试", "paywall.benefit_reminders": "调整提醒时间", "paywall.benefit_widgets": "保持组件最新", "paywall.unlock": "解锁 {plan}", "paywall.loading_price": "正在加载 App Store 价格", "paywall.opening": "正在打开 App Store...", "paywall.restoring": "正在恢复...", "paywall.legal": "自动续订订阅。购买前 App Store 会显示价格和条款。可在 Apple 订阅中管理或取消。",
    "today.next_move": "下一步", "today.next_class": "下一节课", "today.deadline": "截止", "today.focus": "专注", "today.open_plan": "打开计划", "today.start_focus": "开始专注", "today.next_30": "未来30天", "today.risk_radar": "风险雷达", "today.upcoming_deadlines": "即将截止", "today.upcoming_assessments": "即将考试", "today.notes_activity": "笔记活动",
    "classes.title": "管理学期", "classes.truth": "唯一可信来源", "classes.truth_body": "修正导入、补充遗漏任务，并让今天、计划、提醒和组件保持同步。", "classes.add": "添加课程", "classes.import": "导入", "classes.empty_title": "还没有活动课程。", "classes.empty_body": "如果大纲缺失、无法读取或有误，可以先手动开始。", "classes.add_manual": "手动添加课程", "classes.archived": "已归档",
    "class.schedule": "时间表", "class.add_work": "补充任务", "class.add_work_body": "无需重新导入即可添加测验、项目或作业。", "class.assignment": "作业", "class.assessment": "考试", "class.pulse": "课程脉搏", "class.assignments": "作业", "class.exams": "即将考试", "class.notes": "最近笔记", "class.forecast": "预测", "class.due": "待办", "class.archive_title": "归档课程？", "class.archive_body": "{code} 将从今天、计划、提醒和组件中移除。可在管理学期中恢复。", "class.delete_title": "永久删除课程？", "class.archive_instead": "改为归档", "class.not_found": "未找到课程", "class.not_found_body": "这门课已不在本学期中。", "class.open_dashboard": "打开首页",
    "review.title": "检查导入", "review.empty": "没有等待检查的导入。", "review.guard_preview": "仅预览。", "review.guard_preview_body": "解锁后可应用到真实应用。", "review.guard_active": "批准前不会保存。", "review.guard_active_body": "编辑、删除或确认每一项。", "review.found": "StudyPlanner 找到了你的学期。", "review.classes": "课程", "review.assignments": "作业", "review.exams": "考试", "review.approve": "批准可信项", "review.manual": "手动设置", "review.unlock": "解锁我的学期", "review.apply": "应用日程",
    "plan.title": "计划", "plan.sub_suffix": "学期自动规划", "plan.notes_feed": "{count} 条笔记进入计划", "plan.autopilot": "自动规划", "plan.rebuild": "重建计划", "plan.focus_blocks": "专注时段", "plan.regenerate": "重新生成", "plan.study": "学习", "plan.clear_day": "今天很清爽。", "notes.title": "笔记", "notes.sub": "准备度 {score} · {count} 条笔记", "notes.body": "笔记提升准备度并优化课程脉搏。", "notes.all": "全部", "notes.empty_title": "还没有笔记", "notes.empty_body": "扫描或粘贴课堂笔记，生成摘要、卡片、测验和任务。", "notes.scan": "扫描笔记", "notes.paste": "粘贴笔记",
    "widgets.title": "组件", "widgets.sub_ready": "主屏幕快照", "widgets.sub_locked": "锁定预览", "widgets.ready_title": "组件已同步", "widgets.locked_title": "解锁组件", "widgets.ready_body": "循环分数 {score} 可用于 iOS 组件。", "widgets.locked_body": "应用大纲并解锁后，组件会保持最新。", "widgets.sync": "从首页同步", "widgets.row_today": "StudyPlanner 今天", "widgets.row_today_body": "健康、下个截止和专注时段", "widgets.row_upcoming": "即将到来", "widgets.row_upcoming_body": "即将出现的作业和考试", "widgets.row_week": "周负荷", "widgets.row_week_body": "每周压力", "widgets.row_class": "课程进度", "widgets.row_class_body": "选中课程的脉搏", "widgets.ready": "就绪", "widgets.locked": "已锁定"
  },
  hi: {
    "tabs.today": "आज", "tabs.classes": "क्लास", "tabs.scan": "स्कैन", "tabs.plan": "प्लान", "tabs.profile": "प्रोफाइल",
    "locked.after_scan": "स्कैन के बाद", "locked.workload": "वर्कलोड", "locked.grades": "ग्रेड", "locked.preparedness": "तैयारी", "locked.consistency": "नियमितता", "locked.workload_body": "सिलेबस समीक्षा के बाद अनलॉक होगा।", "locked.grades_body": "असली क्लास आने पर अनलॉक होगा।", "locked.preparedness_body": "नोट्स और परीक्षा आने पर अनलॉक होगा।", "locked.consistency_body": "StudyPlanner आपका प्लान देखेगा तो अनलॉक होगा।", "scan.more": "और कैप्चर", "scan.history": "इम्पोर्ट इतिहास", "scan.empty_history": "अभी कोई इम्पोर्ट नहीं। शुरुआत के लिए सिलेबस या नोट्स पेस्ट करें।",
    "paywall.message_loading": "App Store से जुड़ रहा है...", "paywall.message_choose": "StudyPlanner प्लान चुनें।", "paywall.message_unavailable": "App Store कीमत लोड नहीं हुई। Restore उपलब्ध है।", "paywall.benefit_apply": "सिलेबस लागू करें", "paywall.benefit_health": "सेमेस्टर हेल्थ ट्रैक करें", "paywall.benefit_exams": "परीक्षा से आगे रहें", "paywall.benefit_reminders": "रिमाइंडर समय सेट करें", "paywall.benefit_widgets": "विजेट अपडेट रखें", "paywall.unlock": "{plan} अनलॉक करें", "paywall.loading_price": "App Store कीमत लोड हो रही है", "paywall.opening": "App Store खुल रहा है...", "paywall.restoring": "Restore हो रहा है...", "paywall.legal": "ऑटो-रिन्यू होने वाली सदस्यता। खरीद से पहले App Store कीमत और शर्तें दिखाता है। Apple subscriptions में मैनेज या कैंसल करें।",
    "today.next_move": "अगला कदम", "today.next_class": "अगली क्लास", "today.deadline": "डेडलाइन", "today.focus": "फोकस", "today.open_plan": "प्लान खोलें", "today.start_focus": "फोकस शुरू करें", "today.next_30": "अगले 30 दिन", "today.risk_radar": "रिस्क रडार", "today.upcoming_deadlines": "आने वाली डेडलाइन", "today.upcoming_assessments": "आने वाली परीक्षाएं", "today.notes_activity": "नोट्स गतिविधि",
    "classes.title": "सेमेस्टर मैनेज करें", "classes.truth": "एक भरोसेमंद जगह", "classes.truth_body": "इम्पोर्ट ठीक करें, छूटा काम जोड़ें और आज, प्लान, रिमाइंडर, विजेट सिंक रखें।", "classes.add": "क्लास जोड़ें", "classes.import": "इम्पोर्ट", "classes.empty_title": "अभी कोई सक्रिय क्लास नहीं।", "classes.empty_body": "सिलेबस गायब, unreadable या गलत हो तो मैन्युअली शुरू करें।", "classes.add_manual": "क्लास मैन्युअली जोड़ें", "classes.archived": "आर्काइव",
    "class.schedule": "शेड्यूल", "class.add_work": "छूटा काम जोड़ें", "class.add_work_body": "री-इम्पोर्ट किए बिना quiz, project या assignment जोड़ें।", "class.assignment": "असाइनमेंट", "class.assessment": "परीक्षा", "class.pulse": "क्लास पल्स", "class.assignments": "असाइनमेंट", "class.exams": "आने वाली परीक्षाएं", "class.notes": "हाल के नोट्स", "class.forecast": "पूर्वानुमान", "class.due": "बकाया", "class.archive_title": "क्लास आर्काइव करें?", "class.archive_body": "{code} आज, प्लान, रिमाइंडर और विजेट से हटेगी। काम Manage Semester से restore हो सकेगा।", "class.delete_title": "क्लास हमेशा के लिए हटाएं?", "class.archive_instead": "इसके बजाय आर्काइव", "class.not_found": "क्लास नहीं मिली", "class.not_found_body": "यह क्लास अब इस सेमेस्टर में नहीं है।", "class.open_dashboard": "डैशबोर्ड खोलें",
    "review.title": "इम्पोर्ट समीक्षा", "review.empty": "समीक्षा के लिए कोई इम्पोर्ट नहीं।", "review.guard_preview": "सिर्फ पूर्वावलोकन।", "review.guard_preview_body": "असल ऐप में लागू करने के लिए अनलॉक करें।", "review.guard_active": "आपकी मंजूरी तक कुछ सेव नहीं होगा।", "review.guard_active_body": "हर आइटम edit, remove या confirm करें।", "review.found": "StudyPlanner ने आपका सेमेस्टर ढूंढ लिया।", "review.classes": "क्लास", "review.assignments": "असाइनमेंट", "review.exams": "परीक्षा", "review.approve": "भरोसेमंद approve", "review.manual": "मैन्युअल setup", "review.unlock": "मेरा सेमेस्टर अनलॉक", "review.apply": "शेड्यूल लागू करें",
    "plan.title": "प्लान", "plan.sub_suffix": "सेमेस्टर autopilot", "plan.notes_feed": "{count} नोट्स प्लान में जाते हैं", "plan.autopilot": "Autopilot", "plan.rebuild": "प्लान फिर बनाएं", "plan.focus_blocks": "फोकस ब्लॉक", "plan.regenerate": "फिर बनाएं", "plan.study": "पढ़ाई", "plan.clear_day": "दिन साफ है।", "notes.title": "नोट्स", "notes.sub": "{score} तैयारी · {count} नोट्स", "notes.body": "नोट्स तैयारी बढ़ाते हैं और class pulse बेहतर करते हैं।", "notes.all": "सभी", "notes.empty_title": "कोई नोट लोड नहीं", "notes.empty_body": "लेक्चर नोट्स स्कैन या पेस्ट करके summaries, flashcards, quizzes और tasks बनाएं।", "notes.scan": "नोट्स स्कैन", "notes.paste": "नोट्स पेस्ट",
    "widgets.title": "विजेट", "widgets.sub_ready": "Home Screen snapshots", "widgets.sub_locked": "लॉक्ड पूर्वावलोकन", "widgets.ready_title": "विजेट sync हैं", "widgets.locked_title": "विजेट अनलॉक करें", "widgets.ready_body": "{score} loop score iOS विजेट के लिए तैयार है।", "widgets.locked_body": "सिलेबस लागू करें और विजेट updated रखने के लिए अनलॉक करें।", "widgets.sync": "डैशबोर्ड से sync", "widgets.row_today": "StudyPlanner आज", "widgets.row_today_body": "Health, अगली deadline और focus block", "widgets.row_upcoming": "आने वाला", "widgets.row_upcoming_body": "Assignments और exams जल्द", "widgets.row_week": "Week Load", "widgets.row_week_body": "हर week pressure", "widgets.row_class": "Class Progress", "widgets.row_class_body": "चुनी हुई class pulse", "widgets.ready": "तैयार", "widgets.locked": "लॉक्ड"
  },
  ar: {
    "tabs.today": "اليوم", "tabs.classes": "المواد", "tabs.scan": "مسح", "tabs.plan": "الخطة", "tabs.profile": "الملف",
    "locked.after_scan": "بعد المسح", "locked.workload": "العبء", "locked.grades": "الدرجات", "locked.preparedness": "الاستعداد", "locked.consistency": "الانتظام", "locked.workload_body": "مقفل حتى مراجعة المنهج.", "locked.grades_body": "مقفل حتى توجد مواد حقيقية.", "locked.preparedness_body": "مقفل حتى توجد ملاحظات واختبارات.", "locked.consistency_body": "مقفل حتى يرى StudyPlanner خطتك.", "scan.more": "التقاطات أخرى", "scan.history": "سجل الاستيراد", "scan.empty_history": "لا توجد عمليات استيراد بعد. الصق منهجًا أو ملاحظات للبدء.",
    "paywall.message_loading": "جارٍ الاتصال بـ App Store...", "paywall.message_choose": "اختر خطة StudyPlanner.", "paywall.message_unavailable": "لم يتم تحميل أسعار App Store. الاستعادة متاحة.", "paywall.benefit_apply": "تطبيق المنهج", "paywall.benefit_health": "تتبع صحة الفصل", "paywall.benefit_exams": "استبق الاختبارات", "paywall.benefit_reminders": "ضبط التذكيرات", "paywall.benefit_widgets": "تحديث الويدجت", "paywall.unlock": "افتح {plan}", "paywall.loading_price": "تحميل سعر App Store", "paywall.opening": "فتح App Store...", "paywall.restoring": "جارٍ الاستعادة...", "paywall.legal": "اشتراك يتجدد تلقائيًا. يعرض App Store السعر والشروط قبل الشراء. يمكنك الإدارة أو الإلغاء من اشتراكات Apple.",
    "today.next_move": "الخطوة التالية", "today.next_class": "المحاضرة التالية", "today.deadline": "الموعد", "today.focus": "التركيز", "today.open_plan": "افتح الخطة", "today.start_focus": "ابدأ التركيز", "today.next_30": "الأيام 30 القادمة", "today.risk_radar": "رادار المخاطر", "today.upcoming_deadlines": "المواعيد القادمة", "today.upcoming_assessments": "الاختبارات القادمة", "today.notes_activity": "نشاط الملاحظات",
    "classes.title": "إدارة الفصل", "classes.truth": "مصدر واحد موثوق", "classes.truth_body": "صحح الاستيراد، أضف العمل الناقص، وحافظ على مزامنة اليوم والخطة والتذكيرات والويدجت.", "classes.add": "أضف مادة", "classes.import": "استيراد", "classes.empty_title": "لا توجد مواد نشطة بعد.", "classes.empty_body": "ابدأ يدويًا إذا كان المنهج مفقودًا أو غير مقروء أو خاطئًا.", "classes.add_manual": "أضف مادة يدويًا", "classes.archived": "مؤرشفة",
    "class.schedule": "الجدول", "class.add_work": "أضف عملًا ناقصًا", "class.add_work_body": "أضف اختبارًا قصيرًا أو مشروعًا أو واجبًا دون إعادة الاستيراد.", "class.assignment": "واجب", "class.assessment": "اختبار", "class.pulse": "نبض المادة", "class.assignments": "الواجبات", "class.exams": "اختبارات قادمة", "class.notes": "ملاحظات حديثة", "class.forecast": "التوقع", "class.due": "مستحق", "class.archive_title": "أرشفة المادة؟", "class.archive_body": "ستغادر {code} اليوم والخطة والتذكيرات والويدجت. يمكن استعادة العمل من إدارة الفصل.", "class.delete_title": "حذف المادة نهائيًا؟", "class.archive_instead": "أرشفة بدلًا من ذلك", "class.not_found": "المادة غير موجودة", "class.not_found_body": "هذه المادة لم تعد في هذا الفصل.", "class.open_dashboard": "افتح اللوحة",
    "review.title": "مراجعة الاستيراد", "review.empty": "لا يوجد استيراد بانتظار المراجعة.", "review.guard_preview": "معاينة فقط.", "review.guard_preview_body": "افتح لتطبيق هذا الفصل في التطبيق الحقيقي.", "review.guard_active": "لا يتم الحفظ حتى توافق.", "review.guard_active_body": "عدّل أو أزل أو أكد كل عنصر.", "review.found": "وجد StudyPlanner فصلك الدراسي.", "review.classes": "مواد", "review.assignments": "واجبات", "review.exams": "اختبارات", "review.approve": "اعتماد الموثوق", "review.manual": "إعداد يدوي", "review.unlock": "افتح فصلي", "review.apply": "تطبيق الجدول",
    "plan.title": "الخطة", "plan.sub_suffix": "طيار الفصل الآلي", "plan.notes_feed": "{count} ملاحظات تغذي الخطة", "plan.autopilot": "الطيار الآلي", "plan.rebuild": "أعد بناء الخطة", "plan.focus_blocks": "جلسات التركيز", "plan.regenerate": "إعادة إنشاء", "plan.study": "دراسة", "plan.clear_day": "اليوم صافٍ.", "notes.title": "الملاحظات", "notes.sub": "استعداد {score} · {count} ملاحظات", "notes.body": "ترفع الملاحظات الاستعداد وتوضح نبض المادة.", "notes.all": "الكل", "notes.empty_title": "لا توجد ملاحظات", "notes.empty_body": "امسح أو الصق ملاحظات المحاضرة لإنشاء ملخصات وبطاقات واختبارات ومهام.", "notes.scan": "امسح الملاحظات", "notes.paste": "الصق الملاحظات",
    "widgets.title": "الويدجت", "widgets.sub_ready": "لقطات الشاشة الرئيسية", "widgets.sub_locked": "معاينة مقفلة", "widgets.ready_title": "الويدجت متزامنة", "widgets.locked_title": "افتح الويدجت", "widgets.ready_body": "درجة الحلقة {score} جاهزة لويدجت iOS.", "widgets.locked_body": "طبّق منهجًا وافتح للحفاظ على تحديث الويدجت.", "widgets.sync": "زامن من اللوحة", "widgets.row_today": "StudyPlanner اليوم", "widgets.row_today_body": "الصحة والموعد التالي وجلسة التركيز", "widgets.row_upcoming": "القادم", "widgets.row_upcoming_body": "واجبات واختبارات قريبًا", "widgets.row_week": "عبء الأسبوع", "widgets.row_week_body": "الضغط حسب الأسبوع", "widgets.row_class": "تقدم المادة", "widgets.row_class_body": "نبض المادة المختارة", "widgets.ready": "جاهز", "widgets.locked": "مقفل"
  }
};

for (const locale of Object.keys(LOCALE_COMPLETIONS) as Exclude<SupportedLocale, "en-US">[]) {
  Object.assign(APP_COPY[locale], LOCALE_COMPLETIONS[locale]);
}

Object.assign(APP_COPY.de, { "scan.status_ready": "Textscan direkt auf dem Gerät ist bereit.", "scan.status_backup": "Die Kamera öffnet sich zur Aufnahme. Einfügen ist verfügbar, falls dieses Gerät Fotos nicht lesen kann.", "scan.quick_seed": "Chemie-Laborbericht morgen fällig, ca. 2 Stunden" });
Object.assign(APP_COPY.es, { "scan.status_ready": "El escaneo de texto en el dispositivo está listo.", "scan.status_backup": "La cámara se abre para capturar. Puedes pegar texto si este dispositivo no puede leer fotos.", "scan.quick_seed": "informe de laboratorio mañana, estimar 2 horas" });
Object.assign(APP_COPY.fr, { "scan.status_ready": "La numérisation de texte sur l’appareil est prête.", "scan.status_backup": "La caméra s’ouvre pour capturer. Colle le texte si cet appareil ne peut pas lire les photos.", "scan.quick_seed": "rapport de labo demain, prévoir 2 heures" });
Object.assign(APP_COPY["pt-BR"], { "scan.status_ready": "A leitura de texto no dispositivo está pronta.", "scan.status_backup": "A câmera abre para capturar. Cole texto se este dispositivo não conseguir ler fotos.", "scan.quick_seed": "relatório de laboratório amanhã, estimar 2 horas" });
Object.assign(APP_COPY.ja, { "scan.status_ready": "デバイス上のテキストスキャン準備完了。", "scan.status_backup": "カメラで撮影できます。写真を読めない端末ではテキスト貼り付けを使えます。", "scan.quick_seed": "化学実験レポート 明日締切 2時間" });
Object.assign(APP_COPY.ko, { "scan.status_ready": "기기 내 텍스트 스캔이 준비되었습니다.", "scan.status_backup": "카메라로 촬영할 수 있습니다. 이 기기에서 사진을 읽지 못하면 텍스트를 붙여넣으세요.", "scan.quick_seed": "화학 실험 보고서 내일 마감, 2시간 예상" });
Object.assign(APP_COPY["zh-Hans"], { "scan.status_ready": "设备端文本扫描已就绪。", "scan.status_backup": "相机会打开用于拍摄。如果此设备无法读取照片，可粘贴文本。", "scan.quick_seed": "化学实验报告明天截止，预计2小时" });
Object.assign(APP_COPY.hi, { "scan.status_ready": "डिवाइस पर टेक्स्ट स्कैन तैयार है।", "scan.status_backup": "कैमरा कैप्चर के लिए खुलेगा। अगर यह डिवाइस फोटो नहीं पढ़ पाता, तो टेक्स्ट पेस्ट करें।", "scan.quick_seed": "केम लैब रिपोर्ट कल जमा, अनुमान 2 घंटे" });
Object.assign(APP_COPY.ar, { "scan.status_ready": "مسح النص على الجهاز جاهز.", "scan.status_backup": "تفتح الكاميرا للالتقاط. الصق النص إذا لم يتمكن هذا الجهاز من قراءة الصور.", "scan.quick_seed": "تقرير مختبر الكيمياء غدًا، ساعتان تقريبًا" });

Object.assign(APP_COPY.de, { "paywall.weekly": "Wöchentlich", "paywall.yearly": "Jährlich", "paywall.monthly": "Monatlich" });
Object.assign(APP_COPY.es, { "paywall.weekly": "Semanal", "paywall.yearly": "Anual", "paywall.monthly": "Mensual" });
Object.assign(APP_COPY.fr, { "paywall.weekly": "Hebdo", "paywall.yearly": "Annuel", "paywall.monthly": "Mensuel" });
Object.assign(APP_COPY["pt-BR"], { "paywall.weekly": "Semanal", "paywall.yearly": "Anual", "paywall.monthly": "Mensal" });
Object.assign(APP_COPY.ja, { "paywall.weekly": "週払い", "paywall.yearly": "年払い", "paywall.monthly": "月払い" });
Object.assign(APP_COPY.ko, { "paywall.weekly": "주간", "paywall.yearly": "연간", "paywall.monthly": "월간" });
Object.assign(APP_COPY["zh-Hans"], { "paywall.weekly": "按周", "paywall.yearly": "按年", "paywall.monthly": "按月" });
Object.assign(APP_COPY.hi, { "paywall.weekly": "साप्ताहिक", "paywall.yearly": "वार्षिक", "paywall.monthly": "मासिक" });
Object.assign(APP_COPY.ar, { "paywall.weekly": "أسبوعي", "paywall.yearly": "سنوي", "paywall.monthly": "شهري" });

const APP_COPY_FINAL_GAPS: Record<Exclude<SupportedLocale, "en-US">, Record<string, string>> = {
  de: {
    "paywall.ready_apply": "Bereit zum Anwenden", "paywall.best_value": "Bester Wert", "scan.more_assignment": "Aufgabenblatt", "scan.more_assignment_body": "Aufgabendetails erkennen", "scan.more_exam": "Prüfungsvorbereitung", "scan.more_exam_body": "Lernset erstellen", "scan.more_upload_body": "syllabus-PDF wählen", "review.pressure_preview": "Druckvorschau", "review.first_action": "Erster empfohlener Schritt", "review.weak_title": "Die Erkennung wirkt schwach.", "review.weak_body": "Nutze die Zeilen nur, wenn sie zum syllabus passen. Du kannst neu versuchen, Text einfügen oder manuell bauen.", "review.retry": "Neu versuchen", "review.needs_review": "Prüfen", "review.items_found": "{kind} gefunden", "success.ready": "Semester bereit", "success.built": "Aus deinem syllabus gebaut.", "success.building": "Ein lokaler Plan entsteht.", "success.open_dashboard": "Dashboard öffnen",
    "welcome.title": "Wisse genau, wo du stehst.", "welcome.body": "Importiere einen syllabus. StudyPlanner plant das Semester, erkennt Druck und zeigt den nächsten Schritt.", "welcome.preview": "Vorschau", "welcome.card_title": "syllabus rein. Dashboard raus.", "welcome.card_body": "Kurse, Fristen, Prüfungen und ersten Schritt ansehen, bevor etwas gespeichert wird.", "welcome.map_title": "Jede Frist erfassen", "welcome.map_body": "syllabus rein. Semester raus.", "welcome.health_title": "Semesterstatus verfolgen", "welcome.health_body": "Wissen, ob du im grünen Bereich bist.", "welcome.import": "syllabus importieren",
    "mini.builds_live": "Baut live", "mini.after_import": "nach Import", "mini.pressure": "DRUCKPROGNOSE", "mini.class_pulse": "KURSPULS", "mini.notes_preparedness": "NOTIZVORBEREITUNG", "mini.locked": "Gesperrt", "mini.no_fake": "Keine Fake-Kurse", "mini.next_move": "NÄCHSTER SCHRITT", "mini.first_action": "Erste Aktion", "mini.widget": "WIDGET", "mini.unlock_after": "Nach Kauf freischalten", "health.score": "Wert", "health.start_here": "Hier starten", "health.no_semester": "Kein Semester geladen.", "today.empty_kicker": "SEMESTER BAUEN", "today.empty_title": "Kurs hinzufügen oder syllabus scannen.",
    "scan.opening_camera": "Kamera wird geöffnet...", "scan.opening_photos": "Fotos werden geöffnet...", "scan.permission": "Berechtigung nötig, um {mode}-Seiten aus {target} zu lesen.", "scan.open_settings": "Einstellungen öffnen", "scan.canceled": "Scan abgebrochen.", "scan.reading_notes": "Notiztext wird auf diesem iPhone gelesen...", "scan.reading_syllabus": "syllabus-Text wird auf diesem iPhone gelesen...", "scan.found_words": "{count} Wörter gefunden. Vor dem Speichern prüfen.", "scan.image_failed": "Dieses Bild konnte nicht gescannt werden.", "scan.opening_pdf": "PDF wird geöffnet...", "scan.pdf_canceled": "PDF-Import abgebrochen.", "scan.pdf_unreadable": "PDF geöffnet. Text war hier nicht lesbar. Text einfügen oder Seiten scannen.", "scan.scan_pages": "Seiten scannen", "scan.pdf_read": "PDF gelesen: {count} Wörter. Vor dem Speichern prüfen.", "scan.pdf_failed": "Dieses PDF konnte nicht importiert werden.", "scan.pdf_failed_title": "PDF-Import fehlgeschlagen", "scan.pdf_failed_body": "syllabus-Text einfügen oder PDF-Seiten mit der Kamera scannen.",
    "paste.add_text_title": "Erst Text hinzufügen", "paste.notes_required": "Füge Notizen ein, um Zusammenfassungen und Lernmaterial zu erstellen.", "paste.syllabus_required": "Füge syllabus-Text ein, um Kurse, Aufgaben und Prüfungen zu erkennen.", "paste.notes_title": "Notizen werden zum Lernset.", "paste.syllabus_title": "Der syllabus wird zum Semester.", "paste.premium_sub": "Alles prüfen, bevor gespeichert wird.", "paste.preview_sub": "Sieh vor dem Freischalten, was StudyPlanner findet.", "paste.notes_placeholder": "Vorlesungsnotizen, Lesezeichen oder Lernstoff einfügen...", "paste.syllabus_placeholder": "syllabus, Aufgabenblatt oder extrahierten PDF-Text einfügen...", "paste.reading": "Wird gelesen...",
    "review.none_selected_title": "Nichts ausgewählt", "review.none_selected_body": "Bestätige mindestens einen Kurs, eine Aufgabe, Prüfung oder Notiz.", "review.first_deadline": "Erste Frist prüfen", "review.high": "Hoch", "review.good": "Gut", "review.needs_review_body": "StudyPlanner ist bei dieser Zeile nicht sicher.", "review.reconcile_hint": "Wähle, wie diese Importzeile behandelt wird. StudyPlanner überschreibt oder dupliziert nichts heimlich.", "review.applying": "Wird angewendet...", "review.approved_footer": "{count} bestätigte Einträge · {state}", "review.editable_later": "später bearbeitbar", "review.locked_until_premium": "bis Premium gesperrt", "review.approve_one": "Bestätige mindestens einen Eintrag.",
    "success.step_reading": "syllabus lesen", "success.step_deadlines": "Fristen finden", "success.step_schedule": "Plan bauen", "success.step_health": "Semesterstatus berechnen", "success.step_next": "Nächsten Schritt vorbereiten", "success.continue": "Weiter",
    "class.delete_body": "{code}, {tasks} offene Aufgaben, {exams} Prüfungen, Notizen, Erinnerungen und Lernblöcke werden gelöscht. Archivieren ist sicherer.", "class.weekly_discussion": "Wöchentliche Diskussion", "class.new_assignment": "Neue Aufgabe", "class.add_assessment": "Prüfung hinzufügen", "class.add_assignment": "Aufgabe hinzufügen", "class.effort": "Aufwand", "class.notes_label": "Notizen", "tasks.today": "Heute", "tasks.later": "Später", "task.delete_title": "Aufgabe löschen?", "task.delete_recurring_body": "Wähle, wie viel dieser Serie entfernt wird.", "task.delete_body": "{title} verschwindet aus Heute, Plan, Erinnerungen und Widgets.", "task.edit": "Aufgabe bearbeiten", "task.save": "Aufgabe sichern", "task.save_awaiting": "Ohne Datum sichern", "task.due": "Fällig", "task.estimated": "Geschätzt", "task.source": "Quelle", "task.on_calendar": "Im Kalender", "task.not_scheduled": "Nicht geplant",
    "assessment.delete_title": "Prüfung löschen?", "assessment.delete_body": "{title} verschwindet aus Heute, Plan, Erinnerungen und Widgets.", "assessment.save": "Prüfung sichern", "assessment.date": "Datum", "assessment.room": "Raum", "assessment.no_notes": "Noch keine Notizen", "assessment.prep_plan": "Vorbereitungsplan", "assessment.prep_body": "{minutes} Vorbereitung. Fällig {due}.", "assessment.rebuild": "Lernblöcke neu bauen", "plan.items": "Einträge", "plan.why": "Warum", "plan.missed": "Verpasst? morgen nachholen", "plan.suggested_tasks": "vorgeschlagene Aufgaben",
    "study.focus_session": "Fokussitzung", "study.no_blocks": "Noch keine Blöcke", "study.no_blocks_body": "Importiere Arbeit und baue neu.", "study.impact": "Wirkung", "study.goal": "Ziel", "study.goal_body": "Ein Punkt. Dann abrufen.", "study.active_recall": "Aktives Erinnern", "study.recall_body": "Erkläre es ohne Nachschauen.", "study.recall_placeholder": "Antwort eingeben...", "study.score_recall": "Abruf bewerten", "study.recall_score": "Abrufwert: {score}/10", "study.complete": "Sitzung abschließen",
    "note.not_found": "Notiz nicht gefunden", "note.not_found_body": "Diese Notiz ist nicht mehr in diesem Semester.", "note.open_notes": "Notizen öffnen", "note.effect": "Wirkung auf {code}", "note.readiness_up": "Bereitschaft steigt.", "note.summary": "Zusammenfassung", "note.key_terms": "SCHLÜSSELBEGRIFFE", "note.signals": "Signale", "note.exam_topics": "Prüfungsthemen", "note.formulas": "Formeln", "note.weak_area": "Schwachstelle", "note.suggested_tasks": "Vorgeschlagene Lernaufgaben", "note.generated_assets": "Erzeugtes Lernmaterial", "note.cards": "Karten", "note.flashcards": "Karteikarten", "note.quiz": "Quiz", "note.add": "Hinzufügen", "note.add_review_task": "Wiederholungsaufgabe hinzufügen", "note.source_text": "QUELLTEXT", "note.concepts": "{count} Konzepte", "note.tasks": "{count} Aufgaben", "note.formulas_count": "{count} Formeln",
    "profile.active_semester": "Aktives Semester", "profile.reminders": "Erinnerungen", "profile.active_count": "{count} aktiv", "profile.import_history": "Importverlauf", "profile.import_count": "{count} Importe", "profile.manage_subscription": "Abo verwalten", "profile.apple_account": "Apple-Konto", "profile.privacy_policy": "Datenschutz", "profile.studyplanner_data": "StudyPlanner-Daten", "profile.terms_use": "Nutzungsbedingungen", "profile.subscription_terms": "Abo-Bedingungen", "profile.email_help": "E-Mail-Hilfe", "profile.subscribed": "Abonniert", "profile.locked": "Gesperrt", "profile.on_device": "Auf dem Gerät", "profile.semester_progress": "SEMESTERFORTSCHRITT", "profile.classes_count": "{count} Kurse", "profile.no_semester": "Noch kein Semester", "profile.subscription": "StudyPlanner-Abo", "profile.subscription_body": "Scans, Erinnerungen, Lernsets und Planung sind aktiv.",
    "reminders.title": "Erinnerungen", "reminders.default_status": "Aktiviere Erinnerungen, wenn dieses iPhone sie planen soll.", "reminders.schedule_failed": "Erinnerungen konnten nicht geplant werden.", "reminders.smart": "Smarte Erinnerungen", "reminders.scheduling": "Wird geplant...", "reminders.schedule": "Planen", "reminders.add_suggestions": "Vorschläge hinzufügen", "reminders.active": "Aktive Erinnerungen", "common.link_unavailable": "Link nicht verfügbar", "common.link_unavailable_body": "Öffne den App-Eintrag, um dieses Dokument zu sehen."
  },
  es: {
    "paywall.ready_apply": "Listo para aplicar", "paywall.best_value": "Mejor valor", "scan.more_assignment": "Hoja de tarea", "scan.more_assignment_body": "Extraer detalles", "scan.more_exam": "Repaso de examen", "scan.more_exam_body": "Crear set de estudio", "scan.more_upload_body": "Elegir PDF del programa", "review.pressure_preview": "Vista de presión", "review.first_action": "Primera acción sugerida", "review.weak_title": "La extracción se ve débil.", "review.weak_body": "Usa estas filas solo si coinciden con el programa. Puedes reintentar, pegar texto o armarlo manualmente.", "review.retry": "Reintentar", "review.needs_review": "Revisar", "review.items_found": "{kind} encontrados", "success.ready": "Semestre listo", "success.built": "Creado desde tu programa.", "success.building": "Un plan local está tomando forma.", "success.open_dashboard": "Abrir panel",
    "welcome.title": "Sabe exactamente dónde estás.", "welcome.body": "Importa un programa. StudyPlanner organiza el semestre, detecta presión y te dice el siguiente paso.", "welcome.preview": "vista previa", "welcome.card_title": "Programa entra. Panel sale.", "welcome.card_body": "Previsualiza clases, entregas, exámenes y primer paso antes de guardar nada.", "welcome.map_title": "Mapea cada entrega", "welcome.map_body": "Programa entra. Semestre sale.", "welcome.health_title": "Sigue la salud del semestre", "welcome.health_body": "Sabe si vas bien.", "welcome.import": "Importar programa",
    "mini.builds_live": "Se arma en vivo", "mini.after_import": "tras importar", "mini.pressure": "PRONÓSTICO DE PRESIÓN", "mini.class_pulse": "PULSO DE CLASE", "mini.notes_preparedness": "PREPARACIÓN DE NOTAS", "mini.locked": "Bloqueado", "mini.no_fake": "Sin clases falsas", "mini.next_move": "SIGUIENTE PASO", "mini.first_action": "Primera acción", "mini.widget": "WIDGET", "mini.unlock_after": "Desbloquea tras comprar", "health.score": "puntaje", "health.start_here": "Empieza aquí", "health.no_semester": "No hay semestre cargado.", "today.empty_kicker": "ARMA TU SEMESTRE", "today.empty_title": "Añade una clase o escanea un programa.",
    "scan.opening_camera": "Abriendo cámara...", "scan.opening_photos": "Abriendo fotos...", "scan.permission": "Se necesita permiso para leer páginas de {mode} desde {target}.", "scan.open_settings": "Abrir ajustes", "scan.canceled": "Escaneo cancelado.", "scan.reading_notes": "Leyendo notas en este iPhone...", "scan.reading_syllabus": "Leyendo programa en este iPhone...", "scan.found_words": "{count} palabras encontradas. Revisa antes de guardar.", "scan.image_failed": "No se pudo escanear esa imagen.", "scan.opening_pdf": "Abriendo PDF...", "scan.pdf_canceled": "Importación de PDF cancelada.", "scan.pdf_unreadable": "PDF abierto. El texto no fue legible aquí. Pega texto o escanea páginas.", "scan.scan_pages": "Escanear páginas", "scan.pdf_read": "PDF leído: {count} palabras. Revisa antes de guardar.", "scan.pdf_failed": "No se pudo importar ese PDF.", "scan.pdf_failed_title": "Falló la importación PDF", "scan.pdf_failed_body": "Pega el texto del programa o escanea las páginas con la cámara.",
    "paste.add_text_title": "Añade texto primero", "paste.notes_required": "Pega notas para resumir y convertirlas en material de estudio.", "paste.syllabus_required": "Pega el programa para extraer clases, tareas y exámenes.", "paste.notes_title": "Las notas se vuelven set de estudio.", "paste.syllabus_title": "El programa se vuelve semestre.", "paste.premium_sub": "Revisa todo antes de guardar.", "paste.preview_sub": "Previsualiza lo que encuentra StudyPlanner antes de desbloquear.", "paste.notes_placeholder": "Pega apuntes de clase, lectura o repaso...", "paste.syllabus_placeholder": "Pega programa, hojas de tarea o texto extraído de PDF...", "paste.reading": "Leyendo...",
    "review.none_selected_title": "Nada seleccionado", "review.none_selected_body": "Aprueba al menos una clase, tarea, examen o nota.", "review.first_deadline": "Revisar primera entrega", "review.high": "Alta", "review.good": "Buena", "review.needs_review_body": "StudyPlanner no está seguro de que esta fila esté completa.", "review.reconcile_hint": "Elige cómo manejar esta fila. StudyPlanner no sobrescribe ni duplica en silencio.", "review.applying": "Aplicando...", "review.approved_footer": "{count} elementos aprobados · {state}", "review.editable_later": "editable después", "review.locked_until_premium": "bloqueado hasta premium", "review.approve_one": "Aprueba al menos un elemento.",
    "success.step_reading": "Leyendo programa", "success.step_deadlines": "Buscando entregas", "success.step_schedule": "Armando horario", "success.step_health": "Calculando salud del semestre", "success.step_next": "Preparando próximo paso", "success.continue": "Continuar",
    "class.delete_body": "Esto elimina {code}, {tasks} tareas abiertas, {exams} exámenes, notas, recordatorios y bloques. Archivar es más seguro.", "class.weekly_discussion": "Discusión semanal", "class.new_assignment": "Nueva tarea", "class.add_assessment": "Añadir examen", "class.add_assignment": "Añadir tarea", "class.effort": "Esfuerzo", "class.notes_label": "Notas", "tasks.today": "Hoy", "tasks.later": "Después", "task.delete_title": "¿Eliminar tarea?", "task.delete_recurring_body": "Elige cuánto de esta serie quitar.", "task.delete_body": "{title} saldrá de Hoy, Plan, recordatorios y widgets.", "task.edit": "Editar tarea", "task.save": "Guardar tarea", "task.save_awaiting": "Guardar sin fecha", "task.due": "Vence", "task.estimated": "Estimado", "task.source": "Fuente", "task.on_calendar": "En calendario", "task.not_scheduled": "Sin programar",
    "assessment.delete_title": "¿Eliminar examen?", "assessment.delete_body": "{title} saldrá de Hoy, Plan, recordatorios y widgets.", "assessment.save": "Guardar examen", "assessment.date": "Fecha", "assessment.room": "Sala", "assessment.no_notes": "Sin notas aún", "assessment.prep_plan": "Plan de preparación", "assessment.prep_body": "{minutes} de preparación. Vence {due}.", "assessment.rebuild": "Reconstruir bloques", "plan.items": "elementos", "plan.why": "Por qué", "plan.missed": "¿Fallaste? compensa mañana", "plan.suggested_tasks": "tareas sugeridas",
    "study.focus_session": "Sesión de enfoque", "study.no_blocks": "Aún no hay bloques", "study.no_blocks_body": "Importa trabajo y reconstruye.", "study.impact": "Impacto", "study.goal": "Meta", "study.goal_body": "Un punto. Luego recuerda.", "study.active_recall": "Recuerdo activo", "study.recall_body": "Explícalo sin mirar.", "study.recall_placeholder": "Escribe tu respuesta...", "study.score_recall": "Calificar recuerdo", "study.recall_score": "Puntaje: {score}/10", "study.complete": "Completar sesión",
    "note.not_found": "Nota no encontrada", "note.not_found_body": "Esa nota ya no está en este semestre.", "note.open_notes": "Abrir notas", "note.effect": "Efecto en {code}", "note.readiness_up": "Preparación arriba.", "note.summary": "Resumen", "note.key_terms": "TÉRMINOS CLAVE", "note.signals": "Señales", "note.exam_topics": "Temas de examen", "note.formulas": "Fórmulas", "note.weak_area": "Área débil", "note.suggested_tasks": "Tareas de estudio sugeridas", "note.generated_assets": "Material generado", "note.cards": "tarjetas", "note.flashcards": "Tarjetas", "note.quiz": "Quiz", "note.add": "Añadir", "note.add_review_task": "Añadir tarea de repaso", "note.source_text": "TEXTO FUENTE", "note.concepts": "{count} conceptos", "note.tasks": "{count} tareas", "note.formulas_count": "{count} fórmulas",
    "profile.active_semester": "Semestre activo", "profile.reminders": "Recordatorios", "profile.active_count": "{count} activos", "profile.import_history": "Historial de importación", "profile.import_count": "{count} importaciones", "profile.manage_subscription": "Gestionar suscripción", "profile.apple_account": "Cuenta Apple", "profile.privacy_policy": "Privacidad", "profile.studyplanner_data": "Datos de StudyPlanner", "profile.terms_use": "Términos de uso", "profile.subscription_terms": "Términos de suscripción", "profile.email_help": "Ayuda por email", "profile.subscribed": "Suscrito", "profile.locked": "Bloqueado", "profile.on_device": "En dispositivo", "profile.semester_progress": "PROGRESO DEL SEMESTRE", "profile.classes_count": "{count} clases", "profile.no_semester": "Sin semestre aún", "profile.subscription": "Suscripción StudyPlanner", "profile.subscription_body": "Escaneos, recordatorios, sets de estudio y planificación activos.",
    "reminders.title": "Recordatorios", "reminders.default_status": "Activa recordatorios cuando quieras que este iPhone los programe.", "reminders.schedule_failed": "No se pudieron programar recordatorios.", "reminders.smart": "Recordatorios inteligentes", "reminders.scheduling": "Programando...", "reminders.schedule": "Programar", "reminders.add_suggestions": "Añadir sugerencias", "reminders.active": "Recordatorios activos", "common.link_unavailable": "Enlace no disponible", "common.link_unavailable_body": "Abre la ficha de la app para ver este documento."
  },
  fr: {},
  "pt-BR": {},
  ja: {},
  ko: {},
  "zh-Hans": {},
  hi: {},
  ar: {},
};

Object.assign(APP_COPY.fr, APP_COPY_FINAL_GAPS.es, {
  "paywall.ready_apply": "Prêt à appliquer", "paywall.best_value": "Meilleur choix", "scan.more_assignment": "Feuille de devoir", "scan.more_assignment_body": "Extraire les détails", "scan.more_exam": "Révision d’examen", "scan.more_exam_body": "Créer un set d’étude", "scan.more_upload_body": "Choisir le PDF du syllabus", "review.pressure_preview": "Aperçu de pression", "review.first_action": "Première action conseillée", "review.weak_title": "L’extraction semble faible.", "review.weak_body": "Utilise ces lignes seulement si elles correspondent au syllabus. Tu peux réessayer, coller du texte ou créer manuellement.", "review.retry": "Réessayer", "review.needs_review": "À vérifier", "review.items_found": "{kind} trouvés", "success.ready": "Semestre prêt", "success.built": "Créé depuis ton syllabus.", "success.building": "Un plan local prend forme.", "success.open_dashboard": "Ouvrir le tableau",
  "welcome.title": "Sache exactement où tu en es.", "welcome.body": "Importe un syllabus. StudyPlanner organise le semestre, repère la pression et indique la prochaine action.", "welcome.preview": "aperçu", "welcome.card_title": "syllabus entré. Tableau prêt.", "welcome.card_body": "Prévisualise cours, échéances, examens et première action avant tout enregistrement.", "welcome.map_title": "Cartographier chaque échéance", "welcome.map_body": "syllabus entré. Semestre prêt.", "welcome.health_title": "Suivre la santé du semestre", "welcome.health_body": "Savoir si tu gardes le rythme.", "welcome.import": "Importer le syllabus",
  "mini.builds_live": "Se construit en direct", "mini.after_import": "après import", "mini.pressure": "PRÉVISION DE PRESSION", "mini.class_pulse": "POULS DU COURS", "mini.notes_preparedness": "PRÉPARATION NOTES", "mini.locked": "Verrouillé", "mini.no_fake": "Aucun faux cours", "mini.next_move": "PROCHAINE ACTION", "mini.first_action": "Première action", "mini.widget": "WIDGET", "mini.unlock_after": "Déverrouiller après achat", "health.score": "score", "health.start_here": "Commencer ici", "health.no_semester": "Aucun semestre chargé.", "today.empty_kicker": "CONSTRUIS TON SEMESTRE", "today.empty_title": "Ajoute un cours ou scanne un syllabus.",
  "scan.opening_camera": "Ouverture caméra...", "scan.opening_photos": "Ouverture photos...", "scan.permission": "Autorisation requise pour lire les pages {mode} depuis {target}.", "scan.open_settings": "Ouvrir Réglages", "scan.canceled": "Scan annulé.", "scan.reading_notes": "Lecture des notes sur cet iPhone...", "scan.reading_syllabus": "Lecture du syllabus sur cet iPhone...", "scan.found_words": "{count} mots trouvés. Vérifie avant d’enregistrer.", "scan.image_failed": "Cette image n’a pas pu être scannée.", "scan.opening_pdf": "Ouverture du PDF...", "scan.pdf_canceled": "Import PDF annulé.", "scan.pdf_unreadable": "PDF ouvert. Texte illisible ici. Colle le texte ou scanne les pages.", "scan.scan_pages": "Scanner pages", "scan.pdf_read": "PDF lu : {count} mots. Vérifie avant d’enregistrer.", "scan.pdf_failed": "Ce PDF n’a pas pu être importé.", "scan.pdf_failed_title": "Import PDF échoué", "scan.pdf_failed_body": "Colle le texte du syllabus ou scanne les pages avec la caméra.",
  "paste.add_text_title": "Ajoute du texte d’abord", "paste.notes_required": "Colle des notes pour créer résumés et supports d’étude.", "paste.syllabus_required": "Colle le syllabus pour extraire cours, devoirs et examens.", "paste.notes_title": "Les notes deviennent un set d’étude.", "paste.syllabus_title": "Le syllabus devient un semestre.", "paste.premium_sub": "Vérifie tout avant enregistrement.", "paste.preview_sub": "Prévisualise ce que StudyPlanner trouve avant déverrouillage.", "paste.notes_placeholder": "Colle notes de cours, lectures ou révisions...", "paste.syllabus_placeholder": "Colle syllabus, devoirs ou texte PDF extrait...", "paste.reading": "Lecture...",
  "review.none_selected_title": "Rien sélectionné", "review.none_selected_body": "Approuve au moins un cours, devoir, examen ou note.", "review.first_deadline": "Vérifier la première échéance", "review.high": "Haute", "review.good": "Bonne", "review.needs_review_body": "StudyPlanner n’est pas sûr que cette ligne soit complète.", "review.reconcile_hint": "Choisis comment gérer cette ligne. StudyPlanner n’écrase ni ne duplique en silence.", "review.applying": "Application...", "review.approved_footer": "{count} éléments approuvés · {state}", "review.editable_later": "modifiable ensuite", "review.locked_until_premium": "verrouillé jusqu’à premium", "review.approve_one": "Approuve au moins un élément.",
  "success.step_reading": "Lecture du syllabus", "success.step_deadlines": "Recherche des échéances", "success.step_schedule": "Construction du planning", "success.step_health": "Calcul de santé du semestre", "success.step_next": "Préparation de la suite", "success.continue": "Continuer",
  "class.delete_body": "Supprime {code}, {tasks} devoirs ouverts, {exams} examens, notes, rappels et blocs. Archiver est plus sûr.", "class.weekly_discussion": "Discussion hebdo", "class.new_assignment": "Nouveau devoir", "class.add_assessment": "Ajouter examen", "class.add_assignment": "Ajouter devoir", "class.effort": "Effort", "class.notes_label": "Notes", "tasks.today": "Aujourd’hui", "tasks.later": "Plus tard", "task.delete_title": "Supprimer le devoir ?", "task.delete_recurring_body": "Choisis combien de cette série retirer.", "task.delete_body": "{title} quittera Aujourd’hui, Plan, rappels et widgets.", "task.edit": "Modifier devoir", "task.save": "Enregistrer devoir", "task.save_awaiting": "Enregistrer sans date", "task.due": "Échéance", "task.estimated": "Estimé", "task.source": "Source", "task.on_calendar": "Au calendrier", "task.not_scheduled": "Non planifié",
  "assessment.delete_title": "Supprimer l’examen ?", "assessment.delete_body": "{title} quittera Aujourd’hui, Plan, rappels et widgets.", "assessment.save": "Enregistrer examen", "assessment.date": "Date", "assessment.room": "Salle", "assessment.no_notes": "Aucune note", "assessment.prep_plan": "Plan de préparation", "assessment.prep_body": "{minutes} de préparation. Échéance {due}.", "assessment.rebuild": "Reconstruire les blocs", "plan.items": "éléments", "plan.why": "Pourquoi", "plan.missed": "Raté ? rattrape demain", "plan.suggested_tasks": "tâches suggérées",
  "study.focus_session": "Session focus", "study.no_blocks": "Aucun bloc", "study.no_blocks_body": "Importe du travail puis reconstruis.", "study.impact": "Impact", "study.goal": "Objectif", "study.goal_body": "Un point. Puis rappel.", "study.active_recall": "Rappel actif", "study.recall_body": "Explique sans regarder.", "study.recall_placeholder": "Écris ta réponse...", "study.score_recall": "Noter le rappel", "study.recall_score": "Score rappel : {score}/10", "study.complete": "Terminer la session",
  "note.not_found": "Note introuvable", "note.not_found_body": "Cette note n’est plus dans ce semestre.", "note.open_notes": "Ouvrir les notes", "note.effect": "Effet sur {code}", "note.readiness_up": "Préparation en hausse.", "note.summary": "Résumé", "note.key_terms": "NOTIONS CLÉS", "note.signals": "Signaux", "note.exam_topics": "Sujets d’examen", "note.formulas": "Formules", "note.weak_area": "Zone fragile", "note.suggested_tasks": "Tâches de révision suggérées", "note.generated_assets": "Supports générés", "note.cards": "cartes", "note.flashcards": "Cartes", "note.quiz": "Quiz", "note.add": "Ajouter", "note.add_review_task": "Ajouter tâche de révision", "note.source_text": "TEXTE SOURCE", "note.concepts": "{count} notions", "note.tasks": "{count} tâches", "note.formulas_count": "{count} formules",
  "profile.active_semester": "Semestre actif", "profile.reminders": "Rappels", "profile.active_count": "{count} actifs", "profile.import_history": "Historique d’import", "profile.import_count": "{count} imports", "profile.manage_subscription": "Gérer l’abonnement", "profile.apple_account": "Compte Apple", "profile.privacy_policy": "Confidentialité", "profile.studyplanner_data": "Données StudyPlanner", "profile.terms_use": "Conditions d’utilisation", "profile.subscription_terms": "Conditions d’abonnement", "profile.email_help": "Aide par e-mail", "profile.subscribed": "Abonné", "profile.locked": "Verrouillé", "profile.on_device": "Sur l’appareil", "profile.semester_progress": "PROGRESSION DU SEMESTRE", "profile.classes_count": "{count} cours", "profile.no_semester": "Aucun semestre", "profile.subscription": "Abonnement StudyPlanner", "profile.subscription_body": "Scans, rappels, sets d’étude et planification sont actifs.",
  "reminders.title": "Rappels", "reminders.default_status": "Active les rappels quand tu veux que cet iPhone les syllabus.", "reminders.schedule_failed": "Impossible de syllabusr les rappels.", "reminders.smart": "Rappels intelligents", "reminders.scheduling": "Programmation...", "reminders.schedule": "Syllabusr", "reminders.add_suggestions": "Ajouter suggestions", "reminders.active": "Rappels actifs", "common.link_unavailable": "Lien indisponible", "common.link_unavailable_body": "Ouvre la fiche de l’app pour voir ce document."
});

for (const locale of Object.keys(APP_COPY_FINAL_GAPS) as Exclude<SupportedLocale, "en-US">[]) {
  Object.assign(APP_COPY[locale], APP_COPY_FINAL_GAPS[locale]);
}

Object.assign(APP_COPY.hi, {
  "class.add_work_body": "दोबारा आयात किए बिना अचानक परीक्षा, प्रोजेक्ट या बिना तारीख का काम जोड़ें।",
  "class.archive_body": "{code} आज, प्लान, रिमाइंडर और विजेट से हटेगी। इसका काम सेमेस्टर प्रबंधन से वापस मिल सकेगा।",
  "plan.autopilot": "स्वचालित योजना",
  "plan.sub_suffix": "सेमेस्टर की स्वचालित योजना",
  "plan.notes_feed": "{count} नोट्स योजना में",
  "notes.body": "नोट्स तैयारी बढ़ाते हैं और क्लास की नब्ज साफ करते हैं।",
  "notes.empty_body": "लेक्चर नोट्स स्कैन या पेस्ट करके सारांश, कार्ड, प्रश्नोत्तरी और काम बनाएं।",
  "widgets.sub_ready": "होम स्क्रीन झलक",
  "widgets.ready_title": "विजेट साथ में हैं",
  "widgets.ready_body": "{score} लूप स्कोर iOS विजेट के लिए तैयार है।",
  "widgets.sync": "डैशबोर्ड से मिलाएं",
  "widgets.row_today_body": "स्थिति, अगली डेडलाइन और फोकस ब्लॉक",
  "widgets.row_upcoming_body": "आने वाले असाइनमेंट और परीक्षाएं",
  "widgets.row_week": "साप्ताहिक भार",
  "widgets.row_week_body": "हर सप्ताह का दबाव",
  "widgets.row_class": "क्लास प्रगति",
  "study.focus_session": "फोकस सत्र",
  "study.no_blocks": "अभी कोई ब्लॉक नहीं",
  "study.no_blocks_body": "काम आयात करें, फिर योजना फिर बनाएं।",
  "study.impact": "असर",
  "study.goal": "लक्ष्य",
  "study.goal_body": "एक बात। फिर याद करें।",
  "study.active_recall": "सक्रिय याद",
  "study.recall_body": "बिना देखे समझाएं।",
  "study.recall_placeholder": "अपना उत्तर लिखें...",
  "study.score_recall": "याद को अंक दें",
  "study.recall_score": "याद अंक: {score}/10",
  "study.complete": "सत्र पूरा करें",
});

Object.assign(APP_COPY.de, { "plan.notes_feed": "{count} Notizen im Plan" });
Object.assign(APP_COPY.es, { "plan.notes_feed": "{count} notas en plan" });
Object.assign(APP_COPY.fr, { "today.focus": "Concentration", "plan.focus_blocks": "Blocs de concentration", "plan.notes_feed": "{count} notes au plan" });

const LOCALIZED_DEEP_SCREEN_COPY: Record<Exclude<SupportedLocale, "en-US" | "de" | "es" | "fr" | "hi">, Record<string, string>> = {
  "pt-BR": {
    "plan.notes_feed": "{count} notas no plano",
    "study.focus_session": "Sessão de foco",
    "study.no_blocks": "Ainda sem blocos",
    "study.no_blocks_body": "Importe tarefas e reconstrua.",
    "study.impact": "Impacto",
    "study.goal": "Meta",
    "study.goal_body": "Um ponto. Depois relembre.",
    "study.active_recall": "Recordação ativa",
    "study.recall_body": "Explique sem olhar.",
    "study.recall_placeholder": "Digite sua resposta...",
    "study.score_recall": "Avaliar recordação",
    "study.recall_score": "Nota: {score}/10",
    "study.complete": "Concluir sessão",
  },
  ja: {
    "plan.notes_feed": "ノート{count}件",
    "study.focus_session": "集中セッション",
    "study.no_blocks": "ブロックなし",
    "study.no_blocks_body": "課題を取り込み、再作成します。",
    "study.impact": "効果",
    "study.goal": "目標",
    "study.goal_body": "1つに集中。次に思い出す。",
    "study.active_recall": "能動想起",
    "study.recall_body": "見ずに説明しましょう。",
    "study.recall_placeholder": "回答を入力...",
    "study.score_recall": "想起を採点",
    "study.recall_score": "想起スコア: {score}/10",
    "study.complete": "セッション完了",
  },
  ko: {
    "plan.notes_feed": "노트 {count}개 반영",
    "study.focus_session": "집중 세션",
    "study.no_blocks": "아직 블록 없음",
    "study.no_blocks_body": "과제를 가져온 뒤 다시 만드세요.",
    "study.impact": "효과",
    "study.goal": "목표",
    "study.goal_body": "한 가지. 그다음 떠올리기.",
    "study.active_recall": "능동 회상",
    "study.recall_body": "보지 않고 설명하세요.",
    "study.recall_placeholder": "답을 입력하세요...",
    "study.score_recall": "회상 점수 매기기",
    "study.recall_score": "회상 점수: {score}/10",
    "study.complete": "세션 완료",
  },
  "zh-Hans": {
    "plan.notes_feed": "{count} 条笔记",
    "study.focus_session": "专注学习",
    "study.no_blocks": "还没有时段",
    "study.no_blocks_body": "导入任务后重新生成。",
    "study.impact": "效果",
    "study.goal": "目标",
    "study.goal_body": "先攻克一项，再回忆。",
    "study.active_recall": "主动回忆",
    "study.recall_body": "不看资料讲出来。",
    "study.recall_placeholder": "输入你的回答...",
    "study.score_recall": "给回忆打分",
    "study.recall_score": "回忆分数: {score}/10",
    "study.complete": "完成学习",
  },
  ar: {
    "plan.notes_feed": "{count} ملاحظات",
    "study.focus_session": "جلسة تركيز",
    "study.no_blocks": "لا توجد جلسات بعد",
    "study.no_blocks_body": "استورد العمل ثم أعد البناء.",
    "study.impact": "الأثر",
    "study.goal": "الهدف",
    "study.goal_body": "نقطة واحدة. ثم استرجاع.",
    "study.active_recall": "استرجاع نشط",
    "study.recall_body": "اشرحها من دون النظر.",
    "study.recall_placeholder": "اكتب إجابتك...",
    "study.score_recall": "قيّم الاسترجاع",
    "study.recall_score": "درجة الاسترجاع: {score}/10",
    "study.complete": "إنهاء الجلسة",
  },
};

for (const locale of Object.keys(LOCALIZED_DEEP_SCREEN_COPY) as Array<keyof typeof LOCALIZED_DEEP_SCREEN_COPY>) {
  Object.assign(APP_COPY[locale], LOCALIZED_DEEP_SCREEN_COPY[locale]);
}

const LOCALIZED_UI_GAPS: Record<Exclude<SupportedLocale, "en-US">, Record<string, string>> = {
  de: { "class.code": "Code", "class.name": "Name", "class.professor": "Lehrkraft", "class.days": "Tage", "class.time": "Zeit", "class.title": "Titel", "class.description": "Beschreibung", "class.create": "Kurs erstellen", "class.repeat_weekly": "12 Wochen wöchentlich wiederholen", "class.create_work": "Erstellen", "class.create_awaiting": "Ohne Datum erstellen", "task.awaiting_date": "Datum offen", "task.repeats_weekly": "Wöchentlich", "task.reopen": "Aufgabe erneut öffnen", "task.mark_complete": "Als erledigt markieren", "task.close_edit": "Bearbeitung schließen", "task.move_to_class": "In Kurs verschieben", "task.this_occurrence": "Nur dieses Mal", "task.this_future": "Dieses und künftige", "task.copy_suffix": "Kopie", "task.manual_duplicate": "Manuelles Duplikat", "tasks.overdue": "Überfällig", "tasks.upcoming": "Demnächst", "tasks.completed": "Erledigt", "assessment.type": "Typ", "assessment.priority": "Priorität" },
  es: { "class.code": "Código", "class.name": "Nombre", "class.professor": "Profesor", "class.days": "Días", "class.time": "Hora", "class.title": "Título", "class.description": "Descripción", "class.create": "Crear clase", "class.repeat_weekly": "Repetir cada semana 12 semanas", "class.create_work": "Crear", "class.create_awaiting": "Crear sin fecha", "task.awaiting_date": "Fecha pendiente", "task.repeats_weekly": "Semanal", "task.reopen": "Reabrir tarea", "task.mark_complete": "Marcar completada", "task.close_edit": "Cerrar edición", "task.move_to_class": "Mover a clase", "task.this_occurrence": "Solo esta vez", "task.this_future": "Esta y futuras", "task.copy_suffix": "copia", "task.manual_duplicate": "Duplicado manual", "tasks.overdue": "Atrasadas", "tasks.upcoming": "Próximas", "tasks.completed": "Completadas", "assessment.type": "Tipo", "assessment.priority": "Prioridad" },
  fr: { "class.code": "Code", "class.name": "Nom", "class.professor": "Enseignant", "class.days": "Jours", "class.time": "Heure", "class.title": "Titre", "class.description": "Description", "class.create": "Créer le cours", "class.repeat_weekly": "Répéter chaque semaine pendant 12 semaines", "class.create_work": "Créer", "class.create_awaiting": "Créer sans date", "task.awaiting_date": "Date à confirmer", "task.repeats_weekly": "Chaque semaine", "task.reopen": "Rouvrir", "task.mark_complete": "Marquer terminé", "task.close_edit": "Fermer l’édition", "task.move_to_class": "Déplacer vers un cours", "task.this_occurrence": "Cette occurrence", "task.this_future": "Celle-ci et les suivantes", "task.copy_suffix": "copie", "task.manual_duplicate": "Doublon manuel", "tasks.overdue": "En retard", "tasks.upcoming": "À venir", "tasks.completed": "Terminées", "assessment.type": "Type", "assessment.priority": "Priorité" },
  "pt-BR": { "class.code": "Código", "class.name": "Nome", "class.professor": "Professor", "class.days": "Dias", "class.time": "Hora", "class.title": "Título", "class.description": "Descrição", "class.create": "Criar aula", "class.repeat_weekly": "Repetir toda semana por 12 semanas", "class.create_work": "Criar", "class.create_awaiting": "Criar sem data", "task.awaiting_date": "Data pendente", "task.repeats_weekly": "Semanal", "task.reopen": "Reabrir tarefa", "task.mark_complete": "Marcar concluída", "task.close_edit": "Fechar edição", "task.move_to_class": "Mover para aula", "task.this_occurrence": "Só esta vez", "task.this_future": "Esta e futuras", "task.copy_suffix": "cópia", "task.manual_duplicate": "Duplicata manual", "tasks.overdue": "Atrasadas", "tasks.upcoming": "Próximas", "tasks.completed": "Concluídas", "assessment.type": "Tipo", "assessment.priority": "Prioridade" },
  ja: { "class.code": "コード", "class.name": "名前", "class.professor": "担当教員", "class.days": "曜日", "class.time": "時間", "class.title": "タイトル", "class.description": "説明", "class.create": "授業を作成", "class.repeat_weekly": "12週間、毎週くり返す", "class.create_work": "作成", "class.create_awaiting": "日付なしで作成", "task.awaiting_date": "日付待ち", "task.repeats_weekly": "毎週", "task.reopen": "課題を再開", "task.mark_complete": "完了にする", "task.close_edit": "編集を閉じる", "task.move_to_class": "授業へ移動", "task.this_occurrence": "この回のみ", "task.this_future": "この回以降", "task.copy_suffix": "コピー", "task.manual_duplicate": "手動コピー", "tasks.overdue": "期限超過", "tasks.upcoming": "今後", "tasks.completed": "完了", "assessment.type": "種類", "assessment.priority": "優先度" },
  ko: { "class.code": "코드", "class.name": "이름", "class.professor": "교수", "class.days": "요일", "class.time": "시간", "class.title": "제목", "class.description": "설명", "class.create": "수업 만들기", "class.repeat_weekly": "12주 동안 매주 반복", "class.create_work": "만들기", "class.create_awaiting": "날짜 없이 만들기", "task.awaiting_date": "날짜 대기", "task.repeats_weekly": "매주 반복", "task.reopen": "과제 다시 열기", "task.mark_complete": "완료 표시", "task.close_edit": "편집 닫기", "task.move_to_class": "수업으로 이동", "task.this_occurrence": "이번 항목만", "task.this_future": "이번과 이후", "task.copy_suffix": "복사본", "task.manual_duplicate": "수동 복제", "tasks.overdue": "기한 지남", "tasks.upcoming": "예정", "tasks.completed": "완료", "assessment.type": "유형", "assessment.priority": "우선순위" },
  "zh-Hans": { "class.code": "代码", "class.name": "名称", "class.professor": "老师", "class.days": "日期", "class.time": "时间", "class.title": "标题", "class.description": "说明", "class.create": "创建课程", "class.repeat_weekly": "每周重复，共12周", "class.create_work": "创建", "class.create_awaiting": "无日期创建", "task.awaiting_date": "等待日期", "task.repeats_weekly": "每周重复", "task.reopen": "重新打开任务", "task.mark_complete": "标记完成", "task.close_edit": "关闭编辑", "task.move_to_class": "移到课程", "task.this_occurrence": "仅本次", "task.this_future": "本次及以后", "task.copy_suffix": "副本", "task.manual_duplicate": "手动副本", "tasks.overdue": "已逾期", "tasks.upcoming": "即将到来", "tasks.completed": "已完成", "assessment.type": "类型", "assessment.priority": "优先级" },
  hi: { "class.code": "कोड", "class.name": "नाम", "class.professor": "शिक्षक", "class.days": "दिन", "class.time": "समय", "class.title": "शीर्षक", "class.description": "विवरण", "class.create": "क्लास बनाएं", "class.repeat_weekly": "12 सप्ताह तक हर हफ्ते दोहराएं", "class.create_work": "बनाएं", "class.create_awaiting": "तारीख बिना बनाएं", "task.awaiting_date": "तारीख बाकी", "task.repeats_weekly": "हर हफ्ते", "task.reopen": "कार्य फिर खोलें", "task.mark_complete": "पूरा चिन्हित करें", "task.close_edit": "संपादन बंद करें", "task.move_to_class": "क्लास में ले जाएं", "task.this_occurrence": "सिर्फ यह बार", "task.this_future": "यह और आगे", "task.copy_suffix": "कॉपी", "task.manual_duplicate": "हाथ से कॉपी", "tasks.overdue": "देर हो चुकी", "tasks.upcoming": "आने वाले", "tasks.completed": "पूरे", "assessment.type": "प्रकार", "assessment.priority": "प्राथमिकता" },
  ar: { "class.code": "الرمز", "class.name": "الاسم", "class.professor": "المعلم", "class.days": "الأيام", "class.time": "الوقت", "class.title": "العنوان", "class.description": "الوصف", "class.create": "إنشاء مادة", "class.repeat_weekly": "تكرار أسبوعي لمدة 12 أسبوعًا", "class.create_work": "إنشاء", "class.create_awaiting": "إنشاء بلا تاريخ", "task.awaiting_date": "بانتظار التاريخ", "task.repeats_weekly": "يتكرر أسبوعيًا", "task.reopen": "إعادة فتح المهمة", "task.mark_complete": "وضع علامة مكتمل", "task.close_edit": "إغلاق التحرير", "task.move_to_class": "نقل إلى مادة", "task.this_occurrence": "هذه المرة فقط", "task.this_future": "هذه وما بعدها", "task.copy_suffix": "نسخة", "task.manual_duplicate": "نسخة يدوية", "tasks.overdue": "متأخرة", "tasks.upcoming": "قادمة", "tasks.completed": "مكتملة", "assessment.type": "النوع", "assessment.priority": "الأولوية" },
};

for (const locale of Object.keys(LOCALIZED_UI_GAPS) as Exclude<SupportedLocale, "en-US">[]) {
  Object.assign(APP_COPY[locale], LOCALIZED_UI_GAPS[locale]);
}

const LOCALIZED_RELATIVE_DUE_COPY: Record<Exclude<SupportedLocale, "en-US">, Record<string, string>> = {
  de: { "task.yesterday": "Gestern", "task.tomorrow": "Morgen", "task.in_days": "In {count} Tagen", "task.days_ago": "Vor {count} Tagen", "time.days_short": "{count} T", "study.day_today": "Heute", "study.day_tonight": "Heute Abend", "study.source_task": "Aufgabenfokus", "study.source_exam": "Prüfung", "study.source_repair": "Nachholen" },
  es: { "task.yesterday": "Ayer", "task.tomorrow": "Mañana", "task.in_days": "En {count} días", "task.days_ago": "Hace {count} días", "time.days_short": "{count} d", "study.day_today": "Hoy", "study.day_tonight": "Esta noche", "study.source_task": "Enfoque tarea", "study.source_exam": "Prep. examen", "study.source_repair": "Recuperar" },
  fr: { "task.yesterday": "Hier", "task.tomorrow": "Demain", "task.in_days": "Dans {count} j", "task.days_ago": "Il y a {count} j", "time.days_short": "{count} j", "study.day_today": "Aujourd’hui", "study.day_tonight": "Ce soir", "study.source_task": "Focus devoir", "study.source_exam": "Prépa examen", "study.source_repair": "Rattrapage" },
  "pt-BR": { "task.yesterday": "Ontem", "task.tomorrow": "Amanhã", "task.in_days": "Em {count} dias", "task.days_ago": "Há {count} dias", "time.days_short": "{count} d", "study.day_today": "Hoje", "study.day_tonight": "Hoje à noite", "study.source_task": "Foco tarefa", "study.source_exam": "Prep. prova", "study.source_repair": "Recuperar" },
  ja: { "task.yesterday": "昨日", "task.tomorrow": "明日", "task.in_days": "{count}日後", "task.days_ago": "{count}日前", "time.days_short": "{count}日", "study.day_today": "今日", "study.day_tonight": "今夜", "study.source_task": "課題集中", "study.source_exam": "試験準備", "study.source_repair": "遅れ修正" },
  ko: { "task.yesterday": "어제", "task.tomorrow": "내일", "task.in_days": "{count}일 후", "task.days_ago": "{count}일 전", "time.days_short": "{count}일", "study.day_today": "오늘", "study.day_tonight": "오늘 밤", "study.source_task": "과제 집중", "study.source_exam": "시험 준비", "study.source_repair": "보충" },
  "zh-Hans": { "task.yesterday": "昨天", "task.tomorrow": "明天", "task.in_days": "{count}天后", "task.days_ago": "{count}天前", "time.days_short": "{count}天", "study.day_today": "今天", "study.day_tonight": "今晚", "study.source_task": "任务专注", "study.source_exam": "考试准备", "study.source_repair": "补回进度" },
  hi: { "task.yesterday": "बीता कल", "task.tomorrow": "कल", "task.in_days": "{count} दिन में", "task.days_ago": "{count} दिन पहले", "time.days_short": "{count} दिन", "study.day_today": "आज", "study.day_tonight": "आज रात", "study.source_task": "कार्य फोकस", "study.source_exam": "परीक्षा तैयारी", "study.source_repair": "छूटा पूरा करें" },
  ar: { "task.yesterday": "أمس", "task.tomorrow": "غدًا", "task.in_days": "خلال {count} أيام", "task.days_ago": "منذ {count} أيام", "time.days_short": "{count} ي", "study.day_today": "اليوم", "study.day_tonight": "الليلة", "study.source_task": "تركيز مهمة", "study.source_exam": "تحضير اختبار", "study.source_repair": "تعويض" },
};

for (const locale of Object.keys(LOCALIZED_RELATIVE_DUE_COPY) as Exclude<SupportedLocale, "en-US">[]) {
  Object.assign(APP_COPY[locale], LOCALIZED_RELATIVE_DUE_COPY[locale]);
}

let simulatorLocaleOverride: string | undefined;

type PreviewCopy = Record<string, string>;
const PREVIEW_COPY: Record<SupportedLocale, PreviewCopy> = {
  "en-US": {},
  de: { user: "Mia", class1: "Datenstrukturen", class2: "Allgemeine Chemie", class3: "Archiviertes Seminar", professor1: "Dr. Weber", professor2: "Prof. Bauer", task1: "Wöchentlicher Diskussionsbeitrag", task2: "Laborbericht", task3: "Lese-Reflexion", exam1: "Zwischenprüfung 1", note1: "Notizen zu Binärbäumen", note2: "Notizen zum Titrationslabor", summary1: "Traversierung, Baumhöhe und Balanceregeln aus Woche 4.", summary2: "Endpunkt, Molarität und Checkliste für den Laborbericht.", term1: "Binärbaum|Traversierung|Laufzeit|Balance|Hashtabelle", term2: "Molarität|Endpunkt|Indikator|Titration", source: "syllabus-Import", importFile: "semesterplan.pdf", state: "Gut im Plan", health: "Stabil", driver: "Arbeitslast bleibt stabil.", next: "Laborbericht vorbereiten", detail: "Ein Fokusblock hält den Plan sauber.", pressure: "Ausgewogene Woche", notes: "Notizen stützen die Vorbereitung.", forecast: "Stabil", trend: "steigend", reason: "Nächste Frist ist sichtbar.", nudge: "Heute einen Fokusblock starten.", mode: "aktuell", signals: "Signale", busy: "voll", clear: "Freie Strecke", nextClass: "nächster Kurs", dueToday: "heute fällig", studyToday: "heute lernen", pressureLabel: "Druck", assignments: "Aufgaben", exams: "Prüfungen", classPulse: "Kurspuls", classes: "Kurse", allNotes: "Alle Notizen", viewPlan: "Plan ansehen" },
  es: { user: "Sofía", class1: "Estructuras de datos", class2: "Química general", class3: "Seminario archivado", professor1: "Dra. Ruiz", professor2: "Prof. Vega", task1: "Foro semanal", task2: "Informe de laboratorio", task3: "Reflexión de lectura", exam1: "Parcial 1", note1: "Notas de árboles binarios", note2: "Notas de titulación", summary1: "Recorridos, altura y reglas de balance de la semana 4.", summary2: "Cambio de color, molaridad y lista del informe.", term1: "Árbol binario|Recorrido|Complejidad|Balance|Tabla hash", term2: "Molaridad|Punto final|Indicador|Titulación", source: "Importación del programa", importFile: "plan-semestre.pdf", state: "En buen ritmo", health: "Estable", driver: "La carga se mantiene estable.", next: "Preparar informe", detail: "Un bloque de enfoque protege el plan.", pressure: "Semana equilibrada", notes: "Las notas sostienen la preparación.", forecast: "Estable", trend: "sube", reason: "La próxima entrega está clara.", nudge: "Inicia un bloque de enfoque hoy.", mode: "actual", signals: "señales", busy: "lleno", clear: "Ruta libre", nextClass: "próxima clase", dueToday: "vence hoy", studyToday: "estudiar hoy", pressureLabel: "presión", assignments: "tareas", exams: "exámenes", classPulse: "Pulso de clase", classes: "Clases", allNotes: "Todas las notas", viewPlan: "Ver plan" },
  fr: { user: "Camille", class1: "Structures de données", class2: "Chimie générale", class3: "Séminaire archivé", professor1: "Dr Martin", professor2: "Pr Dubois", task1: "Discussion hebdo", task2: "Compte rendu de labo", task3: "Réflexion de lecture", exam1: "Partiel 1", note1: "Notes sur les arbres binaires", note2: "Notes de titrage", summary1: "Parcours, hauteur et règles d’équilibrage de la semaine 4.", summary2: "Virage, molarité et checklist du compte rendu.", term1: "Arbre binaire|Parcours|Complexité|Équilibre|Table de hachage", term2: "Molarité|Point final|Indicateur|Titrage", source: "Import du syllabus", importFile: "plan-semestre.pdf", state: "Bon rythme", health: "Stable", driver: "La charge reste stable.", next: "Préparer le compte rendu", detail: "Un bloc focus protège le plan.", pressure: "Semaine équilibrée", notes: "Les notes soutiennent la préparation.", forecast: "Stable", trend: "monte", reason: "La prochaine échéance est claire.", nudge: "Lance un bloc focus aujourd’hui.", mode: "actuel", signals: "signaux", busy: "chargé", clear: "Voie libre", nextClass: "prochain cours", dueToday: "à rendre", studyToday: "réviser", pressureLabel: "pression", assignments: "devoirs", exams: "examens", classPulse: "Pouls du cours", classes: "Cours", allNotes: "Toutes les notes", viewPlan: "Voir le plan" },
  "pt-BR": { user: "Luiza", class1: "Estruturas de dados", class2: "Química geral", class3: "Seminário arquivado", professor1: "Dra. Lima", professor2: "Prof. Costa", task1: "Discussão semanal", task2: "Relatório de laboratório", task3: "Reflexão de leitura", exam1: "Prova 1", note1: "Notas de árvores binárias", note2: "Notas de titulação", summary1: "Percurso, altura e regras de balanceamento da semana 4.", summary2: "Ponto final, molaridade e checklist do relatório.", term1: "Árvore binária|Percurso|Complexidade|Balanceamento|Tabela hash", term2: "Molaridade|Ponto final|Indicador|Titulação", source: "Importação do plano", importFile: "plano-semestre.pdf", state: "No ritmo", health: "Estável", driver: "A carga segue estável.", next: "Preparar relatório", detail: "Um bloco de foco protege o plano.", pressure: "Semana equilibrada", notes: "As notas sustentam o preparo.", forecast: "Estável", trend: "subindo", reason: "O próximo prazo está claro.", nudge: "Comece um bloco de foco hoje.", mode: "atual", signals: "sinais", busy: "cheio", clear: "Caminho livre", nextClass: "próxima aula", dueToday: "vence hoje", studyToday: "estudar hoje", pressureLabel: "pressão", assignments: "tarefas", exams: "provas", classPulse: "Pulso da aula", classes: "Aulas", allNotes: "Todas as notas", viewPlan: "Ver plano" },
  ja: { user: "ゆい", class1: "データ構造", class2: "基礎化学", class3: "アーカイブ済みゼミ", professor1: "田中先生", professor2: "佐藤先生", task1: "週次ディスカッション", task2: "実験レポート", task3: "読書ふり返り", exam1: "中間試験1", note1: "二分木の講義ノート", note2: "滴定実験ノート", summary1: "4週目の走査、木の高さ、平衡ルール。", summary2: "終点、モル濃度、実験レポート確認。", term1: "二分木|走査|計算量|平衡|ハッシュ表", term2: "モル濃度|終点|指示薬|滴定", source: "シラバス取り込み", importFile: "gakki-keikaku.pdf", state: "順調", health: "安定", driver: "負荷は安定しています。", next: "実験レポート準備", detail: "集中ブロックで計画を守ります。", pressure: "バランスのよい週", notes: "ノートが準備を支えています。", forecast: "安定", trend: "上昇", reason: "次の締切が見えています。", nudge: "今日の集中ブロックを開始。", mode: "最新", signals: "シグナル", busy: "多め", clear: "余裕あり", nextClass: "次の授業", dueToday: "今日締切", studyToday: "今日学習", pressureLabel: "負荷", assignments: "課題", exams: "試験", classPulse: "授業パルス", classes: "授業", allNotes: "全ノート", viewPlan: "計画を見る" },
  ko: { user: "서연", class1: "자료구조", class2: "일반화학", class3: "보관된 세미나", professor1: "김 교수", professor2: "박 교수", task1: "주간 토론 글", task2: "실험 보고서", task3: "읽기 회고", exam1: "중간고사 1", note1: "이진 트리 강의 노트", note2: "적정 실험 노트", summary1: "4주차 순회, 높이, 균형 규칙.", summary2: "종말점, 몰농도, 보고서 체크리스트.", term1: "이진 트리|순회|복잡도|균형|해시 테이블", term2: "몰농도|종말점|지시약|적정", source: "강의계획서 가져오기", importFile: "학기계획.pdf", state: "순조로움", health: "안정", driver: "학습 부담이 안정적입니다.", next: "실험 보고서 준비", detail: "집중 블록 하나가 계획을 지켜줍니다.", pressure: "균형 잡힌 주", notes: "노트가 준비도를 받쳐줍니다.", forecast: "안정", trend: "상승", reason: "다음 마감이 분명합니다.", nudge: "오늘 집중 블록을 시작하세요.", mode: "최신", signals: "신호", busy: "바쁨", clear: "여유 있음", nextClass: "다음 수업", dueToday: "오늘 마감", studyToday: "오늘 공부", pressureLabel: "부담", assignments: "과제", exams: "시험", classPulse: "수업 펄스", classes: "수업", allNotes: "모든 노트", viewPlan: "계획 보기" },
  "zh-Hans": { user: "林同学", class1: "数据结构", class2: "普通化学", class3: "已归档研讨课", professor1: "陈老师", professor2: "王老师", task1: "每周讨论帖", task2: "实验报告", task3: "阅读反思", exam1: "期中考试1", note1: "二叉树课堂笔记", note2: "滴定实验笔记", summary1: "第4周的遍历、树高和平衡规则。", summary2: "终点颜色、摩尔浓度和报告清单。", term1: "二叉树|遍历|复杂度|平衡|哈希表", term2: "摩尔浓度|终点|指示剂|滴定", source: "大纲导入", importFile: "学期计划.pdf", state: "进度稳定", health: "稳定", driver: "任务量保持稳定。", next: "准备实验报告", detail: "一个专注时段能稳住计划。", pressure: "本周均衡", notes: "笔记正在支撑准备度。", forecast: "稳定", trend: "上升", reason: "下个截止日期清楚。", nudge: "今天开始一个专注时段。", mode: "最新", signals: "信号", busy: "较忙", clear: "节奏清晰", nextClass: "下一节课", dueToday: "今日截止", studyToday: "今日学习", pressureLabel: "压力", assignments: "作业", exams: "考试", classPulse: "课程脉搏", classes: "课程", allNotes: "全部笔记", viewPlan: "查看计划" },
  hi: { user: "अनया", class1: "डेटा संरचना", class2: "सामान्य रसायन", class3: "आर्काइव सेमिनार", professor1: "डॉ. मेहरा", professor2: "प्रो. सिंह", task1: "साप्ताहिक चर्चा पोस्ट", task2: "लैब रिपोर्ट", task3: "रीडिंग चिंतन", exam1: "मिडटर्म 1", note1: "बाइनरी ट्री नोट्स", note2: "टाइट्रेशन लैब नोट्स", summary1: "सप्ताह 4 के traversal, tree height और balance नियम।", summary2: "endpoint, molarity और लैब रिपोर्ट checklist।", term1: "बाइनरी ट्री|ट्रैवर्सल|जटिलता|बैलेंस|हैश टेबल", term2: "मोलैरिटी|एंडपॉइंट|इंडिकेटर|टाइट्रेशन", source: "सिलेबस इम्पोर्ट", importFile: "सेमेस्टर-प्लान.pdf", state: "लय में", health: "स्थिर", driver: "वर्कलोड स्थिर है।", next: "लैब रिपोर्ट तैयार करें", detail: "एक फोकस ब्लॉक प्लान बचाता है।", pressure: "संतुलित सप्ताह", notes: "नोट्स तैयारी को सहारा दे रहे हैं।", forecast: "स्थिर", trend: "ऊपर", reason: "अगली डेडलाइन साफ है।", nudge: "आज फोकस ब्लॉक शुरू करें।", mode: "ताज़ा", signals: "संकेत", busy: "व्यस्त", clear: "रास्ता साफ", nextClass: "अगली क्लास", dueToday: "आज जमा", studyToday: "आज पढ़ाई", pressureLabel: "दबाव", assignments: "असाइनमेंट", exams: "परीक्षा", classPulse: "क्लास पल्स", classes: "क्लास", allNotes: "सभी नोट्स", viewPlan: "प्लान देखें" },
  ar: { user: "ليان", class1: "هياكل البيانات", class2: "الكيمياء العامة", class3: "ندوة مؤرشفة", professor1: "د. سالم", professor2: "أ. منصور", task1: "مشاركة النقاش الأسبوعية", task2: "تقرير المختبر", task3: "تأمل القراءة", exam1: "اختبار منتصف 1", note1: "ملاحظات الأشجار الثنائية", note2: "ملاحظات تجربة المعايرة", summary1: "العبور والارتفاع وقواعد التوازن من الأسبوع الرابع.", summary2: "نقطة النهاية والمولارية وقائمة تقرير المختبر.", term1: "شجرة ثنائية|عبور|تعقيد|توازن|جدول تجزئة", term2: "مولارية|نقطة النهاية|مؤشر|معايرة", source: "استيراد المنهج", importFile: "خطة-الفصل.pdf", state: "على المسار", health: "مستقر", driver: "العبء الدراسي مستقر.", next: "جهّز تقرير المختبر", detail: "جلسة تركيز واحدة تحمي الخطة.", pressure: "أسبوع متوازن", notes: "الملاحظات تدعم الاستعداد.", forecast: "مستقر", trend: "صاعد", reason: "الموعد التالي واضح.", nudge: "ابدأ جلسة تركيز اليوم.", mode: "حالي", signals: "إشارات", busy: "مزدحم", clear: "مسار واضح", nextClass: "المحاضرة التالية", dueToday: "مستحق اليوم", studyToday: "دراسة اليوم", pressureLabel: "ضغط", assignments: "واجبات", exams: "اختبارات", classPulse: "نبض المادة", classes: "المواد", allNotes: "كل الملاحظات", viewPlan: "عرض الخطة" }
};

Object.assign(PREVIEW_COPY.hi, {
  summary1: "सप्ताह 4 के भ्रमण, ऊंचाई और संतुलन नियम।",
  summary2: "अंत बिंदु, सांद्रता और लैब रिपोर्ट सूची।",
  term1: "द्विआधारी वृक्ष|भ्रमण|जटिलता|संतुलन|हैश तालिका",
  term2: "सांद्रता|अंत बिंदु|सूचक|टाइट्रेशन",
  source: "सिलेबस आयात",
  importFile: "सेमेस्टर-योजना.pdf",
  classPulse: "क्लास नब्ज",
});

function previewCopy() {
  return PREVIEW_COPY[appLocale()] || PREVIEW_COPY["en-US"];
}

function previewClean<T>(englishValue: T, localizedValue: T): T {
  return appLocale() === "en-US" ? englishValue : localizedValue;
}

function previewText(key: keyof PreviewCopy, fallback: string) {
  if (appLocale() === "en-US") return fallback;
  return previewCopy()[key] || fallback;
}

function previewMetricLabel(key: keyof PreviewCopy, fallback: string) {
  return previewText(key, fallback);
}

function previewFixtureText(key: string, fallback: string) {
  const locale = appLocale();
  const localized: Record<SupportedLocale, Record<string, string>> = {
    "en-US": {},
    de: { roomScience: "Raum 214", roomLab: "Labor 5", roomHall: "Saal 3", daysMw: "Mo Mi", daysTt: "Di Do", daysFri: "Fr", nextWed: "Mittwoch", nextThu: "Donnerstag", archived: "Archiviert", discussion: "Diskussion", assignment: "Aufgabe", reflection: "Reflexion", high: "Hoch", medium: "Mittel", low: "Niedrig", draftPost: "Beitrag entwerfen", checkRubric: "Rubrik prüfen", midtermKind: "Zwischenprüfung", aiImport: "syllabus-Import", awaitingDate: "Datum offen", tbd: "offen", roomTbd: "Raum offen", daysTbd: "Tage offen", timeTbd: "Zeit offen", due: "fällig", professor3: "Prof. Nasser" },
    es: { roomScience: "Aula 214", roomLab: "Lab 5", roomHall: "Sala 3", daysMw: "lun mié", daysTt: "mar jue", daysFri: "vie", nextWed: "miércoles", nextThu: "jueves", archived: "Archivado", discussion: "Discusión", assignment: "Tarea", reflection: "Reflexión", high: "Alta", medium: "Media", low: "Baja", draftPost: "Borrador del foro", checkRubric: "Revisar rúbrica", midtermKind: "Parcial", aiImport: "Importación del programa", awaitingDate: "Fecha pendiente", tbd: "pendiente", roomTbd: "Aula pendiente", daysTbd: "Días pendientes", timeTbd: "Hora pendiente", due: "vence", professor3: "Prof. Nasser" },
    fr: { roomScience: "Salle 214", roomLab: "Labo 5", roomHall: "Amphi 3", daysMw: "lun mer", daysTt: "mar jeu", daysFri: "ven", nextWed: "mercredi", nextThu: "jeudi", archived: "Archivé", discussion: "Discussion", assignment: "Devoir", reflection: "Réflexion", high: "Haute", medium: "Moyenne", low: "Basse", draftPost: "Brouillon", checkRubric: "Vérifier barème", midtermKind: "Partiel", aiImport: "Import du syllabus", awaitingDate: "Date à confirmer", tbd: "à confirmer", roomTbd: "Salle à confirmer", daysTbd: "Jours à confirmer", timeTbd: "Heure à confirmer", due: "échéance", professor3: "Pr Nasser" },
    "pt-BR": { roomScience: "Sala 214", roomLab: "Lab 5", roomHall: "Auditório 3", daysMw: "seg qua", daysTt: "ter qui", daysFri: "sex", nextWed: "quarta", nextThu: "quinta", archived: "Arquivado", discussion: "Discussão", assignment: "Tarefa", reflection: "Reflexão", high: "Alta", medium: "Média", low: "Baixa", draftPost: "Rascunhar post", checkRubric: "Ver rubrica", midtermKind: "Prova", aiImport: "Importação do plano", awaitingDate: "Data pendente", tbd: "pendente", roomTbd: "Sala pendente", daysTbd: "Dias pendentes", timeTbd: "Hora pendente", due: "vence", professor3: "Prof. Nasser" },
    ja: { roomScience: "理科棟214", roomLab: "実験室5", roomHall: "講堂3", daysMw: "月・水", daysTt: "火・木", daysFri: "金", nextWed: "水曜日", nextThu: "木曜日", archived: "アーカイブ済み", discussion: "ディスカッション", assignment: "課題", reflection: "ふり返り", high: "高", medium: "中", low: "低", draftPost: "投稿下書き", checkRubric: "評価表を確認", midtermKind: "中間試験", aiImport: "シラバス取り込み", awaitingDate: "日付待ち", tbd: "未定", roomTbd: "教室未定", daysTbd: "曜日未定", timeTbd: "時間未定", due: "締切", professor3: "ナセル先生" },
    ko: { roomScience: "과학관 214", roomLab: "실험실 5", roomHall: "강의실 3", daysMw: "월 수", daysTt: "화 목", daysFri: "금", nextWed: "수요일", nextThu: "목요일", archived: "보관됨", discussion: "토론", assignment: "과제", reflection: "회고", high: "높음", medium: "중간", low: "낮음", draftPost: "글 초안", checkRubric: "채점표 확인", midtermKind: "중간고사", aiImport: "강의계획서 가져오기", awaitingDate: "날짜 대기", tbd: "미정", roomTbd: "강의실 미정", daysTbd: "요일 미정", timeTbd: "시간 미정", due: "마감", professor3: "나세르 교수" },
    "zh-Hans": { roomScience: "理科楼214", roomLab: "实验室5", roomHall: "礼堂3", daysMw: "周一 周三", daysTt: "周二 周四", daysFri: "周五", nextWed: "周三", nextThu: "周四", archived: "已归档", discussion: "讨论", assignment: "作业", reflection: "反思", high: "高", medium: "中", low: "低", draftPost: "写讨论草稿", checkRubric: "检查评分表", midtermKind: "期中", aiImport: "大纲导入", awaitingDate: "等待日期", tbd: "待定", roomTbd: "教室待定", daysTbd: "日期待定", timeTbd: "时间待定", due: "截止", professor3: "纳赛尔老师" },
    hi: { roomScience: "विज्ञान कक्ष 214", roomLab: "प्रयोगशाला 5", roomHall: "हॉल 3", daysMw: "सोम बुध", daysTt: "मंगल गुरु", daysFri: "शुक्र", nextWed: "बुधवार", nextThu: "गुरुवार", archived: "आर्काइव", discussion: "चर्चा", assignment: "असाइनमेंट", reflection: "चिंतन", high: "उच्च", medium: "मध्यम", low: "कम", draftPost: "पोस्ट का मसौदा", checkRubric: "रूब्रिक देखें", midtermKind: "मध्य परीक्षा", aiImport: "सिलेबस इम्पोर्ट", awaitingDate: "तारीख बाकी", tbd: "बाकी", roomTbd: "कक्ष बाकी", daysTbd: "दिन बाकी", timeTbd: "समय बाकी", due: "जमा", professor3: "प्रो. नासिर" },
    ar: { roomScience: "قاعة العلوم 214", roomLab: "مختبر 5", roomHall: "قاعة 3", daysMw: "الاثنين الأربعاء", daysTt: "الثلاثاء الخميس", daysFri: "الجمعة", nextWed: "الأربعاء", nextThu: "الخميس", archived: "مؤرشف", discussion: "نقاش", assignment: "واجب", reflection: "تأمل", high: "عالٍ", medium: "متوسط", low: "منخفض", draftPost: "مسودة المشاركة", checkRubric: "راجع المعيار", midtermKind: "اختبار منتصف", aiImport: "استيراد المنهج", awaitingDate: "بانتظار التاريخ", tbd: "غير محدد", roomTbd: "القاعة غير محددة", daysTbd: "الأيام غير محددة", timeTbd: "الوقت غير محدد", due: "مستحق", professor3: "أ. ناصر" },
  };
  return localized[locale]?.[key] || fallback;
}

function localizedNarrativeText(kind: "state" | "health" | "driver" | "next" | "detail" | "pressure" | "notes", fallback: string) {
  const map = {
    state: "state",
    health: "health",
    driver: "driver",
    next: "next",
    detail: "detail",
    pressure: "pressure",
    notes: "notes",
  } as const;
  return previewText(map[kind], fallback);
}

function localizedPulseText(kind: "forecast" | "trend" | "reason" | "nudge" | "mode", fallback: string) {
  const map = {
    forecast: "forecast",
    trend: "trend",
    reason: "reason",
    nudge: "nudge",
    mode: "mode",
  } as const;
  return previewText(map[kind], fallback);
}

function localizedKindLabel(kind: string) {
  if (kind === "class") return textFor("review.classes", "classes");
  if (kind === "task") return textFor("review.assignments", "assignments");
  if (kind === "exam") return textFor("review.exams", "exams");
  if (kind === "note") return textFor("notes.title", "notes");
  return kind;
}

function localizedExamKind(kind?: string) {
  if (!kind) return textFor("class.assessment", "Exam");
  if (kind === "Midterm") return previewFixtureText("midtermKind", "Midterm");
  if (kind === "Quiz") return textFor("class.assessment", "Quiz");
  if (kind === "Final") return textFor("class.exams", "Final");
  if (kind === "Project") return textFor("class.assignment", "Project");
  if (kind === "Presentation") return textFor("class.assignment", "Presentation");
  return appLocale() === "en-US" ? kind : textFor("class.assessment", kind);
}

function localizedPriority(priority?: string) {
  if (priority === "High") return previewFixtureText("high", "High");
  if (priority === "Medium") return previewFixtureText("medium", "Medium");
  if (priority === "Low") return previewFixtureText("low", "Low");
  return priority || previewFixtureText("medium", "Medium");
}

function localizedDueLabel(days: number) {
  if (days < -1) return textFor("task.days_ago", "{count} days ago", { count: Math.abs(days) });
  if (days === -1) return textFor("task.yesterday", "Yesterday");
  if (days === 0) return textFor("tasks.today", "Today");
  if (days === 1) return textFor("task.tomorrow", "Tomorrow");
  return textFor("task.in_days", "In {count} days", { count: days });
}

function localizedDaysShort(days: number) {
  if (days <= 1) return localizedDueLabel(days);
  return textFor("time.days_short", "{count}d", { count: days });
}

function localizedStudyBlockDay(day?: string) {
  if (day === "Today") return textFor("study.day_today", "Today");
  if (day === "Tonight") return textFor("study.day_tonight", "Tonight");
  if (day === "Focus") return textFor("today.focus", "Focus");
  return day || textFor("today.focus", "Focus");
}

function localizedStudyBlockSource(source?: string) {
  if (!source) return "";
  if (source === "task_focus") return textFor("study.source_task", "Task focus");
  if (source === "exam_prep") return textFor("study.source_exam", "Exam prep");
  if (source === "missed_repair") return textFor("study.source_repair", "Make-up");
  return source.replace(/_/g, " ");
}

function localizedWeekdayNarrow(index: number) {
  const labels: Record<SupportedLocale, string[]> = {
    "en-US": ["M", "T", "W", "T", "F", "S", "S"],
    de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    es: ["lu", "ma", "mi", "ju", "vi", "sá", "do"],
    fr: ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"],
    "pt-BR": ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"],
    ja: ["月", "火", "水", "木", "金", "土", "日"],
    ko: ["월", "화", "수", "목", "금", "토", "일"],
    "zh-Hans": ["一", "二", "三", "四", "五", "六", "日"],
    hi: ["सो", "मं", "बु", "गु", "शु", "श", "र"],
    ar: ["ن", "ث", "ر", "خ", "ج", "س", "ح"],
  };
  return labels[appLocale()]?.[index] || labels["en-US"][index] || "";
}

function localeFromRuntime(value?: string): SupportedLocale {
  const raw = (value || "").replace("_", "-");
  if (supportedLocales.includes(raw as SupportedLocale)) return raw as SupportedLocale;
  const lower = raw.toLowerCase();
  if (lower.startsWith("pt")) return "pt-BR";
  if (lower.startsWith("zh")) return "zh-Hans";
  const byLanguage = supportedLocales.find((locale) => locale.toLowerCase().split("-")[0] === lower.split("-")[0]);
  return byLanguage || "en-US";
}

function appLocale(): SupportedLocale {
  if (simulatorLocaleOverride) return localeFromRuntime(simulatorLocaleOverride);
  const envLocale = typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_STUDYPLANNER_LOCALE : undefined;
  if (envLocale) return localeFromRuntime(envLocale);
  try {
    return localeFromRuntime(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return "en-US";
  }
}

function nonEnglishMissingCopy(locale: SupportedLocale, key: string) {
  const localized = APP_COPY[locale] || APP_COPY["en-US"];
  if (key.startsWith("welcome.") || key.startsWith("onboarding.")) return localized["onboarding.build_title"] || localized["locked.title"] || localized["common.continue"];
  if (key.startsWith("mini.") || key.startsWith("health.")) return localized["locked.health"] || localized["locked.health_title"] || localized["common.continue"];
  if (key.startsWith("today.")) return localized["tabs.today"] || localized["common.continue"];
  if (key.startsWith("scan.") || key.startsWith("paste.")) return localized["scan.title"] || localized["tabs.scan"] || localized["common.continue"];
  if (key.startsWith("paywall.")) return localized["locked.unlock"] || localized["paywall.title"] || localized["common.continue"];
  if (key.startsWith("review.") || key.startsWith("success.")) return localized["review.title"] || localized["common.continue"];
  if (key.startsWith("class.") || key.startsWith("task.") || key.startsWith("tasks.")) return localized["class.assignment"] || localized["tabs.classes"] || localized["common.continue"];
  if (key.startsWith("assessment.")) return localized["class.assessment"] || localized["tabs.classes"] || localized["common.continue"];
  if (key.startsWith("plan.") || key.startsWith("study.")) return localized["plan.title"] || localized["tabs.plan"] || localized["common.continue"];
  if (key.startsWith("note.") || key.startsWith("notes.")) return localized["notes.title"] || localized["common.continue"];
  if (key.startsWith("profile.")) return localized["tabs.profile"] || localized["common.continue"];
  if (key.startsWith("reminders.")) return localized["profile.reminders"] || localized["widgets.ready"] || localized["common.continue"];
  return localized["common.continue"] || localized["common.close"] || "";
}

function textFor(key: string, fallback: string, vars: CopyVars = {}) {
  const locale = appLocale();
  const localized = APP_COPY[locale]?.[key];
  const template = localized || (locale === "en-US" ? APP_COPY["en-US"][key] || fallback : nonEnglishMissingCopy(locale, key));
  return template.replace(/\{(\w+)\}/g, (_match, name) => String(vars[name] ?? ""));
}

type ReviewRoutingCopy = {
  title: string;
  body: string;
  notNow: string;
  ratings: Record<ReviewRating, string>;
  feedbackSubject: string;
  feedbackBody: string;
};

function reviewRoutingCopy(): ReviewRoutingCopy {
  const copy: Record<SupportedLocale, ReviewRoutingCopy> = {
    "en-US": {
      title: "How is StudyPlanner working?",
      body: "Pick a rating. Five stars opens the store. Anything lower sends feedback straight to us.",
      notNow: "Not now",
      ratings: { 1: "1 star", 2: "2 stars", 3: "3 stars", 4: "4 stars", 5: "5 stars" },
      feedbackSubject: "StudyPlanner {rating}-star feedback",
      feedbackBody: "What went wrong?\n\nWhat should StudyPlanner improve next?\n\n"
    },
    de: {
      title: "Wie funktioniert StudyPlanner fuer dich?",
      body: "Waehle eine Bewertung. Fuenf Sterne oeffnen den App Store. Alles darunter geht direkt als Feedback an uns.",
      notNow: "Jetzt nicht",
      ratings: { 1: "1 Stern", 2: "2 Sterne", 3: "3 Sterne", 4: "4 Sterne", 5: "5 Sterne" },
      feedbackSubject: "StudyPlanner Feedback mit {rating} Sternen",
      feedbackBody: "Was hat nicht gepasst?\n\nWas sollte StudyPlanner als Naechstes verbessern?\n\n"
    },
    es: {
      title: "¿Como te va con StudyPlanner?",
      body: "Elige una calificacion. Cinco estrellas abre App Store. Cualquier nota menor envia comentarios directos.",
      notNow: "Ahora no",
      ratings: { 1: "1 estrella", 2: "2 estrellas", 3: "3 estrellas", 4: "4 estrellas", 5: "5 estrellas" },
      feedbackSubject: "Comentarios de StudyPlanner con {rating} estrellas",
      feedbackBody: "¿Que salio mal?\n\n¿Que deberia mejorar StudyPlanner ahora?\n\n"
    },
    fr: {
      title: "Comment se passe StudyPlanner ?",
      body: "Choisis une note. Cinq etoiles ouvre l'App Store. Une note plus basse envoie ton retour directement.",
      notNow: "Pas maintenant",
      ratings: { 1: "1 etoile", 2: "2 etoiles", 3: "3 etoiles", 4: "4 etoiles", 5: "5 etoiles" },
      feedbackSubject: "Retour StudyPlanner avec {rating} etoiles",
      feedbackBody: "Qu'est-ce qui n'a pas marche ?\n\nQue devrait ameliorer StudyPlanner ensuite ?\n\n"
    },
    hi: {
      title: "StudyPlanner आपके लिए कैसा चल रहा है?",
      body: "रेटिंग चुनें। पांच स्टार App Store खोलते हैं। इससे कम रेटिंग सीधे हमें feedback भेजती है।",
      notNow: "अभी नहीं",
      ratings: { 1: "1 स्टार", 2: "2 स्टार", 3: "3 स्टार", 4: "4 स्टार", 5: "5 स्टार" },
      feedbackSubject: "StudyPlanner {rating}-स्टार feedback",
      feedbackBody: "क्या ठीक नहीं रहा?\n\nStudyPlanner को आगे क्या सुधारना चाहिए?\n\n"
    },
    ja: {
      title: "StudyPlannerの使い心地は？",
      body: "評価を選んでください。5つ星はApp Storeを開き、それ未満は直接フィードバックを送ります。",
      notNow: "今はしない",
      ratings: { 1: "1つ星", 2: "2つ星", 3: "3つ星", 4: "4つ星", 5: "5つ星" },
      feedbackSubject: "StudyPlanner {rating}つ星フィードバック",
      feedbackBody: "うまくいかなかったことは？\n\nStudyPlannerで次に改善してほしいことは？\n\n"
    },
    ko: {
      title: "StudyPlanner 사용 경험은 어떤가요?",
      body: "평점을 선택하세요. 별 5개는 App Store를 열고, 그보다 낮으면 의견을 바로 보냅니다.",
      notNow: "나중에",
      ratings: { 1: "별 1개", 2: "별 2개", 3: "별 3개", 4: "별 4개", 5: "별 5개" },
      feedbackSubject: "StudyPlanner 별 {rating}개 의견",
      feedbackBody: "무엇이 불편했나요?\n\nStudyPlanner가 다음에 무엇을 개선하면 좋을까요?\n\n"
    },
    "pt-BR": {
      title: "Como esta o StudyPlanner?",
      body: "Escolha uma nota. Cinco estrelas abre a App Store. Qualquer nota menor envia feedback direto.",
      notNow: "Agora nao",
      ratings: { 1: "1 estrela", 2: "2 estrelas", 3: "3 estrelas", 4: "4 estrelas", 5: "5 estrelas" },
      feedbackSubject: "Feedback do StudyPlanner com {rating} estrelas",
      feedbackBody: "O que nao funcionou?\n\nO que o StudyPlanner deve melhorar agora?\n\n"
    },
    "zh-Hans": {
      title: "StudyPlanner 用起来怎么样？",
      body: "选择评分。5 星会打开 App Store，低于 5 星会直接发送反馈给我们。",
      notNow: "暂时不要",
      ratings: { 1: "1 星", 2: "2 星", 3: "3 星", 4: "4 星", 5: "5 星" },
      feedbackSubject: "StudyPlanner {rating} 星反馈",
      feedbackBody: "哪里不顺利？\n\n你希望 StudyPlanner 接下来改进什么？\n\n"
    },
    ar: {
      title: "كيف يعمل StudyPlanner معك؟",
      body: "اختر تقييما. خمس نجوم تفتح App Store. أي تقييم أقل يرسل ملاحظاتك إلينا مباشرة.",
      notNow: "ليس الآن",
      ratings: { 1: "نجمة 1", 2: "نجمتان", 3: "3 نجوم", 4: "4 نجوم", 5: "5 نجوم" },
      feedbackSubject: "ملاحظات StudyPlanner بتقييم {rating} نجوم",
      feedbackBody: "ما الذي لم يعمل جيدا؟\n\nما الذي يجب أن يحسنه StudyPlanner بعد ذلك؟\n\n"
    },
  };
  return copy[appLocale()] || copy["en-US"];
}

function optionText(value: string) {
  const key = {
    "School semester": "option.school_semester",
    "High school classes": "option.high_school",
    "College courses": "option.college",
    "Grad school": "option.grad",
    "Online classes": "option.online",
    Exams: "option.exams",
    Deadlines: "option.deadlines",
    Notes: "option.notes",
    Grades: "option.grades",
    "Study plan": "option.study_plan",
    Everything: "option.everything",
    "Upload PDF": "option.upload_pdf",
    "syllabus PDF": "option.upload_pdf",
    "Paste syllabus": "option.paste_syllabus",
    "Scan with camera": "option.scan_camera",
    "Skip for now": "option.skip",
  }[value];
  return key ? textFor(key, value) : appLocale() === "en-US" ? value : textFor("option.everything", value);
}

function localizedArray(values: string[]) {
  return values.map((value) => optionText(value));
}

const iconMap: Record<string, LucideIcon> = {
  home: CalendarDays,
  classes: BookOpen,
  scan: ScanLine,
  plan: CalendarDays,
  profile: User,
  "book-open": BookOpen,
  "notebook-pen": NotebookPen,
  "flask-conical": FlaskConical,
  "bar-chart-3": BarChart3,
  "globe-2": Globe2,
  layers: Layers,
  "graduation-cap": GraduationCap,
  flame: Flame,
  moon: Moon,
  zap: Zap,
  sparkles: Sparkles,
  bell: Bell,
  heart: HeartPulse,
  target: Target,
  note: NotebookPen,
  file: FileText,
  camera: Camera,
  image: Image,
  upload: Upload,
  grid: Grid2X2,
  clock: Clock,
  map: MapPin,
  crown: Crown,
  star: Star,
  refresh: RefreshCw,
  lock: Lock,
  shield: Shield,
  timer: Timer,
  brain: Brain,
  wand: Wand2,
  plus: Plus,
  pencil: Pencil,
  trash: Trash2,
  "chevron-right": ChevronRight,
  archive: Archive,
  copy: Copy,
};

function Icon({ name, size = 20, color = COLORS.ink, strokeWidth = 2.1 }: { name: string; size?: number; color?: string; strokeWidth?: number }) {
  const C = iconMap[name] || Sparkles;
  return <C size={size} color={color} strokeWidth={strokeWidth} />;
}

function palette(theme: ThemeId) {
  const dark = ["dark", "neon", "athlete"].includes(theme);
  const accent = THEMES.find((t) => t.id === theme)?.swatches[1] || COLORS.blue;
  return {
    dark,
    bg: dark ? "#050507" : "#EFEFF4",
    surface: dark ? "#1A1A1E" : "#FFFFFF",
    surface2: dark ? "#232329" : "#F6F6FA",
    surface3: dark ? "#2C2C33" : "#ECECF2",
    hairline: dark ? "rgba(255,255,255,0.10)" : "rgba(60,60,67,0.12)",
    label: dark ? "#FFFFFF" : "#0A0A0D",
    label2: dark ? "rgba(235,235,245,0.66)" : "rgba(60,60,67,0.66)",
    label3: dark ? "rgba(235,235,245,0.34)" : "rgba(60,60,67,0.34)",
    accent,
    accent2: THEMES.find((t) => t.id === theme)?.swatches[0] || COLORS.purple,
  };
}

function tap(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  Haptics.impactAsync(style).catch(() => {});
}

const TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
const SUPPORT_URL = "mailto:mattnewmanapps@gmail.com?subject=StudyPlanner%20Support";
const MANAGE_SUBSCRIPTION_URL = "https://apps.apple.com/account/subscriptions";
const APP_STORE_REVIEW_URL = "itms-apps://itunes.apple.com/app/id6766181202?action=write-review";
const PRE_PURCHASE_ROUTES: Route[] = ["welcome", "onboarding", "importOptions", "lockedDashboard", "paywall", "terms", "privacy"];
type EntitlementStatus = "loading" | "active" | "inactive" | "error";
type AccessState = "loading" | "onboarding" | "preview_allowed" | "locked" | "paywall" | "unlocked";
type UnlockSuccessSource = "purchase_action" | "restore_action" | "startup_hydration";
let lastUnlockSuccessAlertAt = 0;
const FALLBACK_CLASS: ClassItem = {
  id: "empty-class",
  code: "Class",
  name: "Semester not imported",
  professor: "Import syllabus first",
  room: "TBD",
  days: "Mon Wed",
  time: "10:00 AM",
  next: "After import",
  health: 0,
  grade: "Not set",
  color: COLORS.blue,
  color2: COLORS.green,
  icon: "book-open",
};

function openExternal(url: string) {
  Linking.openURL(url).catch(() => Alert.alert(textFor("common.link_unavailable", "Link unavailable"), textFor("common.link_unavailable_body", "Open the app listing to view this document.")));
}

function safeClassFor(data: AppData, classId?: string) {
  return data.classes.find((item) => item.id === classId) || data.classes[0] || FALLBACK_CLASS;
}

function taskDueLabel(task: TaskItem) {
  return hasTaskDate(task) ? `${localizedDueLabel(daysUntilTask(task))} · ${task.time}` : `${previewFixtureText("awaitingDate", "Awaiting Date")} · ${task.time || previewFixtureText("tbd", "TBD")}`;
}

function addDaysLocal(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function firstNameFromPrefs(data: AppData) {
  const fallbackName = appLocale() === "en-US" ? "Student" : previewCopy().user || textFor("onboarding.name_placeholder", "Student");
  const stored = data.prefs.firstName || data.prefs.name;
  const raw = !stored || stored === "Student" ? fallbackName : stored;
  return raw.trim().split(/\s+/)[0] || fallbackName;
}

function userInitial(data: AppData) {
  return firstNameFromPrefs(data).slice(0, 1).toUpperCase() || "S";
}

function onboardingComplete(data: AppData) {
  return Boolean(data.prefs.onboardingComplete);
}

function entitlementUnlocks(data: AppData, entitlementStatus: EntitlementStatus) {
  return entitlementStatus === "active";
}

function appAccessLocked(data: AppData, entitlementStatus: EntitlementStatus) {
  return onboardingComplete(data) && !entitlementUnlocks(data, entitlementStatus);
}

function accessStateFor(data: AppData, entitlementStatus: EntitlementStatus, active?: Route): AccessState {
  if (!onboardingComplete(data)) return "onboarding";
  if (entitlementUnlocks(data, entitlementStatus)) return "unlocked";
  if (entitlementStatus === "loading") return PRE_PURCHASE_ROUTES.includes(active || "lockedDashboard") ? "preview_allowed" : "loading";
  if (active === "paywall") return "paywall";
  if (PRE_PURCHASE_ROUTES.includes(active || "lockedDashboard")) return "preview_allowed";
  return "locked";
}

function entitlementTraceSource(data: AppData, entitlementStatus: EntitlementStatus) {
  if (entitlementStatus === "active") return "storekit_active";
  if (entitlementStatus === "loading") return data.prefs.premium ? "local_cached_ignored_loading" : "loading";
  if (entitlementStatus === "error") return data.prefs.premium ? "local_cached_ignored_error" : "error";
  return data.prefs.premium ? "local_cached_ignored_none" : "none";
}

function dataForAccessState(data: AppData, entitlementStatus: EntitlementStatus): AppData {
  if (!entitlementUnlocks(data, entitlementStatus)) return lockedWidgetData(lockUnvalidatedPremium(data));
  return {
    ...data,
    prefs: {
      ...data.prefs,
      osLive: true,
      premium: true,
    },
  };
}

function lockUnvalidatedPremium(data: AppData): AppData {
  return {
    ...data,
    prefs: {
      ...data.prefs,
      premium: false,
      premiumProductId: undefined,
      premiumCheckedAt: undefined,
    },
  };
}

function premiumData(data: AppData, productId?: string, checkedAt = new Date().toISOString()): AppData {
  return {
    ...data,
    prefs: {
      ...data.prefs,
      osLive: true,
      premium: true,
      premiumProductId: productId,
      premiumCheckedAt: checkedAt,
    },
  };
}

function gatedRoute(active: Route, data: AppData, entitlementStatus: EntitlementStatus): Route {
  const accessState = accessStateFor(data, entitlementStatus, active);
  if (accessState === "unlocked") return active;
  if (accessState === "onboarding") return "onboarding";
  if (accessState === "preview_allowed" || accessState === "paywall") return active;
  return "lockedDashboard";
}

function appRouteForInitialRoute(initialRoute: ReturnType<typeof resolveInitialRouteForData>): Route {
  if (initialRoute === "onboarding") return "onboarding";
  if (initialRoute === "reviewPendingImport") return "review";
  return "lockedDashboard";
}

function maybeShowUnlockSuccess(source: UnlockSuccessSource) {
  if (source !== "purchase_action" && source !== "restore_action") return;
  const now = Date.now();
  if (now - lastUnlockSuccessAlertAt < 1200) return;
  lastUnlockSuccessAlertAt = now;
  Alert.alert(textFor("paywall.unlock", "StudyPlanner unlocked", { plan: "StudyPlanner" }), textFor("profile.subscription_body", "Your subscription is active."));
}

function routeTokensFromUrl(rawUrl: string) {
  const tokens = new Set<string>();
  const addRouteParts = (value: string | null | undefined) => {
    value
      ?.toLowerCase()
      .split(/[^a-z0-9-]+/g)
      .filter(Boolean)
      .forEach((part) => {
        tokens.add(part);
        part.split("-").filter(Boolean).forEach((subpart) => tokens.add(subpart));
      });
  };

  try {
    const parsed = new URL(rawUrl);
    addRouteParts(parsed.hostname);
    addRouteParts(parsed.pathname);
    addRouteParts(parsed.hash);
    parsed.searchParams.forEach((value, key) => {
      addRouteParts(key);
      addRouteParts(value);
    });
  } catch {
    addRouteParts(rawUrl);
  }

  return tokens;
}

function routeFromUrl(rawUrl: string): Route | null {
  if (rawUrl.toLowerCase().includes("expo-development-client")) return null;
  const routeTokens = routeTokensFromUrl(rawUrl);

  if (routeTokens.has("scan") || routeTokens.has("import")) return "scan";
  if (routeTokens.has("paste")) return "paste";
  if (routeTokens.has("notes")) return "notes";
  if (routeTokens.has("classes") || routeTokens.has("courses")) return "classes";
  if (routeTokens.has("calendar") || routeTokens.has("plan")) return "plan";
  if (routeTokens.has("study")) return "plan";
  if (routeTokens.has("reminders")) return "reminders";
  if (routeTokens.has("today") || routeTokens.has("widgets") || routeTokens.has("widget")) return "today";
  if (routeTokens.has("terms") || routeTokens.has("eula")) return "terms";
  if (routeTokens.has("privacy")) return "privacy";
  if (routeTokens.has("paywall") || routeTokens.has("subscribe")) return "paywall";
  return null;
}

function lockedWidgetData(data: AppData): AppData {
  return {
    ...data,
    classes: [],
    tasks: [],
    exams: [],
    notes: [],
    reminders: [],
    studyBlocks: [],
    imports: [],
    prefs: {
      ...data.prefs,
      premium: false,
      osLive: false,
    },
  };
}

function todayHeaderLabel() {
  return new Date().toLocaleDateString(appLocale(), { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function shortDateLabel() {
  return new Date().toLocaleDateString(appLocale(), { weekday: "long", month: "long", day: "numeric" });
}

const SIMULATOR_CAPTURE_FILE = "studyplanner-capture-tab.json";
type SimulatorCaptureConfig = {
  tab?: string;
  route?: Route;
  screen?: string;
  onboardingIndex?: number;
  locale?: string;
  qaState?: "build57";
  emptyPlanner?: boolean;
  prompt?: "recurrenceScope" | "archiveClass";
};

type SimulatorCaptureState = {
  data: AppData;
  currentImport: ImportBatch | null;
  navItem: NavItem;
  entitlementStatus: EntitlementStatus;
  prompt?: SimulatorCaptureConfig["prompt"];
};

function simulatorCaptureIsEnabled() {
  return typeof __DEV__ !== "undefined" && __DEV__;
}

async function loadSimulatorCaptureConfig(): Promise<SimulatorCaptureConfig | null> {
  if (!simulatorCaptureIsEnabled()) return null;
  try {
    const file = new File(Paths.document, SIMULATOR_CAPTURE_FILE);
    if (!file.exists) return null;
    const raw = await file.text();
    if (!raw || raw.length > 100_000) return null;
    const parsed = JSON.parse(raw);
    simulatorLocaleOverride = parsed?.locale;
    return parsed && typeof parsed === "object" ? parsed as SimulatorCaptureConfig : null;
  } catch {
    return null;
  }
}

function buildBuild57FixtureData() {
  const copy = previewCopy();
  const activeClass: ClassItem = {
    id: "qa-cs201",
    code: "CS 201",
    name: copy.class1 || "Data Structures",
    professor: copy.professor1 || "Dr. Kim",
    room: previewFixtureText("roomScience", "Science 214"),
    days: previewFixtureText("daysMw", "Mon Wed"),
    time: "10:00 AM",
    next: previewFixtureText("nextWed", "Wednesday"),
    health: 0.82,
    grade: "A-",
    color: COLORS.blue,
    color2: COLORS.green,
    icon: "book-open",
    notes: copy.detail || "Professor moved office hours to Fridays.",
  };
  const labClass: ClassItem = {
    id: "qa-chem110",
    code: "CHEM 110",
    name: copy.class2 || "General Chemistry",
    professor: copy.professor2 || "Prof. Alvarez",
    room: previewFixtureText("roomLab", "Lab 5"),
    days: previewFixtureText("daysTt", "Tue Thu"),
    time: "1:30 PM",
    next: previewFixtureText("nextThu", "Thursday"),
    health: 0.74,
    grade: "B+",
    color: COLORS.orange,
    color2: COLORS.yellow,
    icon: "flask-conical",
    notes: copy.notes || "Lab room changes are common.",
  };
  const archivedClass: ClassItem = {
    id: "qa-hist200",
    code: "HIST 200",
    name: copy.class3 || "Dropped History Seminar",
    professor: previewFixtureText("professor3", "Prof. Nasser"),
    room: previewFixtureText("roomHall", "Hall 3"),
    days: previewFixtureText("daysFri", "Fri"),
    time: "9:00 AM",
    next: previewFixtureText("archived", "Archived"),
    health: 0.3,
    grade: previewFixtureText("archived", "Archived"),
    color: COLORS.purple,
    color2: COLORS.pink,
    icon: "globe-2",
    archivedAt: new Date().toISOString(),
  };
  const recurringEndDate = isoFromOffset(35);
  const recurringTasks: TaskItem[] = [0, 1, 2, 3, 4, 5].map((index) => ({
    id: `qa-discussion-${index + 1}`,
    title: copy.task1 || "Weekly discussion post",
    classId: activeClass.id,
    type: previewFixtureText("discussion", "Discussion"),
    dueOffset: index * 7,
    dueDate: isoFromOffset(index * 7),
    time: "8:00 PM",
    estimateMinutes: 35,
    done: index === 0,
    urgent: index === 1,
    priority: "Medium",
    description: copy.detail || "Respond to the prompt and reply to two classmates.",
    source: copy.source || "Manual recurring",
    recurringId: "qa-rec-discussion",
    recurrenceIndex: index,
    recurrenceEndDate: recurringEndDate,
    subtasks: [{ title: previewFixtureText("draftPost", "Draft post"), done: index === 0 }],
  }));
  const labReport: TaskItem = {
    id: "qa-lab-report",
    title: copy.task2 || "Lab report",
    classId: labClass.id,
    type: previewFixtureText("assignment", "Assignment"),
    dueOffset: 10,
    dueDate: isoFromOffset(10),
    time: "11:59 PM",
    estimateMinutes: 90,
    done: false,
    urgent: true,
    priority: "High",
    description: copy.summary2 || "Methods, results, and conclusion.",
    source: `${copy.source || previewFixtureText("aiImport", "AI syllabus import")} · ${textFor("common.edit", "edited")}`,
    subtasks: [{ title: previewFixtureText("checkRubric", "Check rubric"), done: false }],
  };
  const awaitingDateTask: TaskItem = {
    id: "qa-reading-reflection",
    title: copy.task3 || "Reading reflection",
    classId: activeClass.id,
    type: previewFixtureText("reflection", "Reflection"),
    dueOffset: 0,
    dueDate: isoFromOffset(0),
    time: "11:59 PM",
    estimateMinutes: 45,
    done: false,
    urgent: false,
    priority: "Low",
    description: copy.reason || "Professor has not posted the date yet.",
    source: copy.source || textFor("review.manual", "Manual"),
    missing: true,
    subtasks: [],
  };
  const exam: ExamItem = {
    id: "qa-midterm",
    classId: activeClass.id,
    title: copy.exam1 || "Midterm 1",
    dueOffset: 14,
    dueDate: isoFromOffset(14),
    time: "9:00 AM",
    room: previewFixtureText("roomScience", "Science 214"),
    kind: "Midterm",
    effortMinutes: 180,
    priority: "High",
    description: copy.summary1 || "Stacks, queues, trees, and hashing.",
    notes: copy.detail || "Bring student ID and calculator.",
    topics: (copy.term1 || "Stacks|Trees|Hash tables").split("|").slice(0, 3),
  };
  const lectureNote: NoteItem = {
    id: "qa-note-trees",
    classId: activeClass.id,
    title: copy.note1 || "Binary trees lecture notes",
    createdAt: isoFromOffset(-1),
    summary: copy.summary1 || "Traversal order, tree height, and balancing rules from Matt's mock syllabus week 4 lecture.",
    terms: (copy.term1 || "Binary tree|Traversal|Big O|Balance|Hash table").split("|"),
    suggestedTasks: [copy.next || "Review traversal examples", copy.detail || "Make flashcards for tree rotations"],
    examId: exam.id,
    pages: 3,
    sourceText: copy.summary1 || "Mock syllabus notes: CS 201 covers arrays, linked lists, stacks, queues, trees, hashing, and a midterm review.",
    reviewedConcepts: (copy.term1 || "Stacks|Queues").split("|").slice(0, 2),
    generatedAssetsAt: new Date().toISOString(),
  };
  const chemistryNote: NoteItem = {
    id: "qa-note-lab",
    classId: labClass.id,
    title: copy.note2 || "Titration lab notes",
    createdAt: isoFromOffset(-2),
    summary: copy.summary2 || "Endpoint color change, molarity setup, and lab report checklist from the mock syllabus lab sequence.",
    terms: (copy.term2 || "Molarity|Endpoint|Indicator|Titration").split("|"),
    suggestedTasks: [copy.next || "Check lab report rubric", copy.detail || "Redo molarity calculations"],
    pages: 2,
    sourceText: copy.summary2 || "Mock syllabus notes: chemistry labs require pre-lab readings, weekly reports, and calculator-ready calculations.",
    reviewedConcepts: (copy.term2 || "Molarity").split("|").slice(0, 1),
    generatedAssetsAt: new Date().toISOString(),
  };
  const data: AppData = {
    ...defaultData,
    prefs: {
      ...defaultData.prefs,
      onboardingComplete: true,
      osLive: true,
      premium: true,
      premiumProductId: "build57.qa",
      premiumCheckedAt: new Date().toISOString(),
      name: copy.user || "Matt",
      firstName: copy.user || "Matt",
    },
    classes: [activeClass, labClass, archivedClass],
    tasks: [labReport, awaitingDateTask, ...recurringTasks],
    exams: [exam],
    notes: [lectureNote, chemistryNote],
    reminders: [],
    studyBlocks: [],
    imports: [{
      id: "qa-original-import",
      sourceName: copy.importFile || "Matt mock syllabus.pdf",
      sourceText: copy.summary1 || "Mock syllabus for Matt: CS 201, CHEM 110, weekly discussions, lab reports, notes, midterm, and revised due dates.",
      createdAt: new Date().toISOString(),
      status: "applied",
      candidates: [],
    }],
  };
  return { ...data, studyBlocks: buildStudyPlan(data) };
}

function localizePreviewStudyBlocks(data: AppData): AppData {
  if (appLocale() === "en-US") return data;
  const copy = previewCopy();
  const studyBlocks = data.studyBlocks.map((block, index) => ({
    ...block,
    day: index === 0 ? textFor("today.focus", "Focus") : block.day,
    title: block.taskId
      ? data.tasks.find((task) => task.id === block.taskId)?.title || block.title
      : block.examId
        ? `${copy.exam1 || block.title}`
        : block.noteId
          ? data.notes.find((note) => note.id === block.noteId)?.title || block.title
          : block.title,
    reason: copy.detail || block.reason,
  }));
  return { ...data, studyBlocks };
}

function buildBuild57ImportFixture(data: AppData): ImportBatch {
  const copy = previewCopy();
  const changedTask = data.tasks.find((task) => task.id === "qa-lab-report");
  const changedExam = data.exams.find((exam) => exam.id === "qa-midterm");
  return {
    id: "qa-revised-syllabus",
    sourceName: copy.importFile || "Revised syllabus.pdf",
    sourceText: copy.summary2 || "Professor revised the lab report due date and clarified Midterm 1.",
    createdAt: new Date().toISOString(),
    status: "review",
    candidates: [
      {
        id: "qa-reconcile-class",
        kind: "class",
        title: "CS 201",
        meta: copy.reason || "Likely existing class",
        classId: "qa-cs201",
        confidence: 0.91,
        approved: true,
        payload: { ...data.classes[0], professor: "Dr. Kim-West" },
      },
      {
        id: "qa-reconcile-task",
        kind: "task",
        title: copy.task2 || "Lab report",
        meta: copy.detail || "Due date changed",
        classId: "qa-chem110",
        confidence: 0.84,
        approved: true,
        payload: changedTask ? { ...changedTask, dueDate: isoFromOffset(17), source: copy.source || previewFixtureText("aiImport", "AI syllabus import") } : {},
      },
      {
        id: "qa-reconcile-exam",
        kind: "exam",
        title: copy.exam1 || "Midterm 1",
        meta: copy.detail || "Assessment time changed",
        classId: "qa-cs201",
        confidence: 0.86,
        approved: true,
        payload: changedExam ? { ...changedExam, time: "10:30 AM" } : {},
      },
      {
        id: "qa-new-project",
        kind: "task",
        title: copy.next || "New partner project",
        meta: copy.reason || "New item from revised syllabus",
        classId: "qa-cs201",
        confidence: 0.76,
        approved: true,
        payload: {
          id: "qa-new-project",
          title: copy.next || "New partner project",
          classId: "qa-cs201",
          type: copy.assignments || textFor("class.assignment", "Project"),
          dueOffset: 21,
          dueDate: isoFromOffset(21),
          time: "11:59 PM",
          estimateMinutes: 120,
          done: false,
          urgent: false,
          priority: "Medium",
          description: copy.detail || "Added after the revised syllabus upload.",
          source: copy.source || previewFixtureText("aiImport", "AI syllabus import"),
          subtasks: [],
        } satisfies TaskItem,
      },
    ],
  };
}

function simulatorCaptureNavItem(config: SimulatorCaptureConfig, importBatch: ImportBatch | null): NavItem {
  if (config.screen === "review_edit" || config.route === "review" || importBatch) return { route: "review" };
  if (config.screen === "classEdit") return { route: "classDetail", params: { id: "qa-cs201", edit: "1" } };
  if (config.screen === "classDetail") return { route: "classDetail", params: { id: "qa-cs201" } };
  if (config.screen === "taskEdit") return { route: "taskDetail", params: { id: "qa-discussion-2", edit: "1" } };
  if (config.screen === "taskDetail" || config.prompt === "recurrenceScope") return { route: "taskDetail", params: { id: "qa-discussion-2" } };
  if (config.screen === "assessmentEdit") return { route: "assessmentDetail", params: { id: "qa-midterm", edit: "1" } };
  if (config.screen === "assessmentDetail") return { route: "assessmentDetail", params: { id: "qa-midterm" } };
  if (config.screen === "noteDetail") return { route: "noteDetail", params: { id: "qa-note-trees" } };
  if (config.prompt === "archiveClass") return { route: "classDetail", params: { id: "qa-cs201" } };
  if (config.onboardingIndex != null) return { route: "onboarding", params: { onboardingIndex: String(config.onboardingIndex) } };
  if (config.route === "studySession") return { route: "studySession" };
  if (config.route) return { route: config.route };
  if (config.tab === "import") return { route: "scan" };
  if (config.tab === "courses") return { route: "classes" };
  if (config.tab === "plan") return { route: "plan" };
  if (config.tab === "focus") return { route: "plan" };
  if (config.tab === "more") return { route: "widgets" };
  if (config.tab === "subscribe") return { route: "paywall" };
  return { route: "today" };
}

function buildSimulatorCaptureState(config: SimulatorCaptureConfig): SimulatorCaptureState | null {
  if (!config.qaState && !config.emptyPlanner && !config.route && !config.tab && !config.screen && config.onboardingIndex == null) return null;
  const rawData = config.emptyPlanner
    ? {
        ...defaultData,
        prefs: {
          ...defaultData.prefs,
          onboardingComplete: config.route !== "onboarding" && Boolean(config.route || config.tab),
          osLive: config.route !== "onboarding" && Boolean(config.route || config.tab),
          premium: false,
        },
      }
    : buildBuild57FixtureData();
  const data = localizePreviewStudyBlocks(rawData);
  const currentImport = config.screen === "review_edit" || config.route === "review" ? buildBuild57ImportFixture(data) : null;
  return {
    data,
    currentImport,
    navItem: simulatorCaptureNavItem(config, currentImport),
    entitlementStatus: config.emptyPlanner ? "inactive" : "active",
    prompt: config.prompt,
  };
}

function showSimulatorCapturePrompt(prompt: SimulatorCaptureConfig["prompt"]) {
  if (prompt === "recurrenceScope") {
    Alert.alert(textFor("task.delete_recurring_body", "Update recurring work?"), textFor("task.repeats_weekly", "Repeats weekly"), [
      { text: textFor("common.cancel", "Cancel"), style: "cancel" },
      { text: textFor("task.this_occurrence", "This occurrence") },
      { text: textFor("task.this_future", "This and future") },
    ]);
  } else if (prompt === "archiveClass") {
    Alert.alert("Archive class?", "CS 201 will be hidden from Today, Plan, reminders, and widgets. You can restore it from Manage Semester.", [
      { text: "Cancel", style: "cancel" },
      { text: "Archive", style: "destructive" },
    ]);
  }
}

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [tab, setTab] = useState<Route>("today");
  const [stack, setStack] = useState<NavItem[]>([]);
  const [currentImport, setCurrentImport] = useState<ImportBatch | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pendingImportStoreReady, setPendingImportStoreReady] = useState(false);
  const [entitlementStatus, setEntitlementStatus] = useState<EntitlementStatus>("loading");
  const saveChain = useRef(Promise.resolve());
  const initialUrlHandled = useRef(false);
  const currentImportRef = useRef<ImportBatch | null>(null);
  const theme = palette(data?.prefs.theme || "light");

  useEffect(() => {
    currentImportRef.current = currentImport;
    if (!pendingImportStoreReady) return;
    if (currentImport) savePendingImport(currentImport).catch(() => {});
    else clearPendingImport().catch(() => {});
  }, [currentImport, pendingImportStoreReady]);

  const activateEntitlement = useCallback((productId?: string, checkedAt = new Date().toISOString(), options: { applyPendingImport?: boolean } = {}) => {
    const shouldApplyPending = options.applyPendingImport !== false;
    const pending = shouldApplyPending ? currentImportRef.current : null;
    setEntitlementStatus("active");
    setData((current) => {
      if (!current) return current;
      const unlocked = premiumData(current, productId, checkedAt);
      return pending ? applyImport(unlocked, pending) : unlocked;
    });
    if (shouldApplyPending) {
      currentImportRef.current = null;
      setCurrentImport(null);
      clearPendingImport().catch(() => {});
      setTab("today");
      setStack([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const params = new URL(window.location.href).searchParams;
      const webCaptureConfig: SimulatorCaptureConfig = {
        qaState: "build57",
        route: (params.get("route") as Route | null) || routeFromUrl(window.location.href) || "today",
        tab: params.get("tab") || undefined,
        screen: params.get("screen") || undefined,
      };
      const webCaptureState = buildSimulatorCaptureState(webCaptureConfig);
      if (webCaptureState) {
        currentImportRef.current = webCaptureState.currentImport;
        setCurrentImport(webCaptureState.currentImport);
        setData(webCaptureState.data);
        setEntitlementStatus(webCaptureState.entitlementStatus);
        setPendingImportStoreReady(true);
        setLoaded(true);
        setStack([webCaptureState.navItem]);
        return () => {
          mounted = false;
        };
      }
    }
    loadData().then(async (stored) => {
      if (!mounted) return;
      const safeStored = lockUnvalidatedPremium(stored);
      const pendingImport = await loadPendingImport();
      if (!mounted) return;
      const simulatorCaptureConfig = await loadSimulatorCaptureConfig();
      if (!mounted) return;
      const simulatorCaptureState = simulatorCaptureConfig ? buildSimulatorCaptureState(simulatorCaptureConfig) : null;
      if (simulatorCaptureState) {
        currentImportRef.current = simulatorCaptureState.currentImport;
        setCurrentImport(simulatorCaptureState.currentImport);
        setData(simulatorCaptureState.data);
        setEntitlementStatus(simulatorCaptureState.entitlementStatus);
        setPendingImportStoreReady(true);
        setLoaded(true);
        setStack([simulatorCaptureState.navItem]);
        if (simulatorCaptureState.prompt) setTimeout(() => showSimulatorCapturePrompt(simulatorCaptureState.prompt), 1200);
        return;
      }
      setData(safeStored);
      if (pendingImport) {
        currentImportRef.current = pendingImport;
        setCurrentImport(pendingImport);
      }
      setPendingImportStoreReady(true);
      setLoaded(true);
      // Startup route priority is explicit: hydration, onboarding, pending import review, then dashboard.
      // A premium entitlement is not evidence that onboarding has been completed.
      setStack([{ route: appRouteForInitialRoute(resolveInitialRouteForData(safeStored, pendingImport)) }]);
      try {
        const entitlement = await checkStudyPlannerEntitlement();
        if (!mounted) return;
        maybeShowUnlockSuccess("startup_hydration");
        if (entitlement.isPremium) activateEntitlement(entitlement.productId, entitlement.checkedAt, { applyPendingImport: !pendingImport });
        else setEntitlementStatus("inactive");
      } catch {
        if (mounted) setEntitlementStatus("error");
      }
    });
    return () => {
      mounted = false;
    };
  }, [activateEntitlement]);

  useEffect(() => {
    initializeStudyPlannerStore().catch(() => {});
    if (Platform.OS === "web") {
      return () => {
        closeStudyPlannerStore().catch(() => {});
      };
    }
    let mounted = true;
    let updated: { remove: () => void } | undefined;
    let errored: { remove: () => void } | undefined;
    import("expo-iap").then(({ purchaseUpdatedListener, purchaseErrorListener }) => {
      if (!mounted) return;
      updated = purchaseUpdatedListener(async (purchase: any) => {
        try {
          const entitlement = await finishStudyPlannerPurchase(purchase);
          if (entitlement.isPremium) {
            activateEntitlement(entitlement.productId, entitlement.checkedAt);
            maybeShowUnlockSuccess("purchase_action");
          }
        } catch (error) {
          Alert.alert("Purchase needs attention", error instanceof Error ? error.message : "Try Restore Purchases.");
        }
      });
      errored = purchaseErrorListener((error: any) => {
        if (error.code === "user-cancelled") return;
        Alert.alert("Purchase not completed", error.message || "The store could not complete the purchase.");
      });
    }).catch(() => {});
    return () => {
      mounted = false;
      updated?.remove();
      errored?.remove();
      closeStudyPlannerStore().catch(() => {});
    };
  }, [activateEntitlement]);

  useEffect(() => {
    if (loaded && data) {
      const snapshot = data;
      saveChain.current = saveChain.current
        .then(async () => {
          const persistedSnapshot = entitlementUnlocks(snapshot, entitlementStatus) ? snapshot : lockUnvalidatedPremium(snapshot);
          await saveData(persistedSnapshot);
          const widgetSyncData = appAccessLocked(persistedSnapshot, entitlementStatus) ? lockedWidgetData(persistedSnapshot) : persistedSnapshot;
          if (persistedSnapshot.prefs.osLive || appAccessLocked(persistedSnapshot, entitlementStatus)) await syncNativeWidgets(widgetSyncData);
        })
        .catch(() => {});
    }
  }, [data, entitlementStatus, loaded]);

  const nav = useMemo(
    () => ({
      push: (route: Route, params?: Record<string, string>) => {
        tap();
        setStack((s) => [...s, { route, params }]);
      },
      back: () => {
        tap();
        setStack((s) => s.slice(0, -1));
      },
      tab: (route: Route) => {
        tap();
        setTab(route);
        setStack([]);
      },
    }),
    []
  );

  useEffect(() => {
    if (!loaded || !data) return;
    const routeUrl = (url: string | null, initial = false) => {
      if (!url || (initial && initialUrlHandled.current)) return;
      const route = routeFromUrl(url);
      if (!route) return;
      if (entitlementStatus === "loading") return;
      if (initial) initialUrlHandled.current = true;
      const openResolvedRoute = (target: Route) => {
        if (target === "scan" || target === "paste") {
          if (target === "paste") nav.push("paste", { mode: "syllabus" });
          else nav.tab("scan");
          return;
        }
        if (target === "notes") {
          nav.push("notes");
          return;
        }
        if (target === "classes") {
          nav.tab("classes");
          return;
        }
        if (target === "plan") {
          nav.tab("plan");
          return;
        }
        if (target === "reminders") {
          nav.push("reminders");
          return;
        }
        if (target === "today") {
          nav.tab("today");
          return;
        }
        if (target === "paywall") {
          nav.push("paywall");
        }
      };
      if (!entitlementUnlocks(data, entitlementStatus)) {
        if (!onboardingComplete(data)) {
          setStack([{ route: "welcome" }]);
          return;
        }
        if (route === "scan" || route === "paste" || route === "paywall") {
          openResolvedRoute(route);
          return;
        }
        setStack([{ route: "lockedDashboard" }]);
        return;
      }
      openResolvedRoute(route);
    };
    Linking.getInitialURL().then((url) => routeUrl(url, true)).catch(() => {});
    const subscription = Linking.addEventListener("url", ({ url }) => routeUrl(url));
    return () => subscription.remove();
  }, [data, entitlementStatus, loaded, nav]);

  useEffect(() => {
    if (!loaded || !data) return;
    const activeRoute = stack[stack.length - 1]?.route || tab;
    const accessState = accessStateFor(data, entitlementStatus, activeRoute);
    const decision = gatedRoute(activeRoute, data, entitlementStatus);
    console.info(
      `[Build52Access] source=${entitlementTraceSource(data, entitlementStatus)} status=${entitlementStatus} localPremium=${Boolean(data.prefs.premium)} onboarding=${Boolean(data.prefs.onboardingComplete)} active=${activeRoute} decision=${decision} access=${accessState}`
    );
  }, [data, entitlementStatus, loaded, stack, tab]);

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0C", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#fff" />
        <Text style={{ color: "#fff", fontWeight: "800", marginTop: 16 }}>StudyPlanner</Text>
      </View>
    );
  }

  const mutate = (fn: (current: AppData) => AppData, options: { allowValidatedPremium?: boolean } = {}) => setData((current) => {
    if (!current) return current;
    const next = fn(current);
    return options.allowValidatedPremium || entitlementUnlocks(next, entitlementStatus) ? next : lockUnvalidatedPremium(next);
  });
  const recordReviewTrigger = (trigger: ReviewTrigger) => {
    recordReviewEvent(trigger)
      .then((result) => {
        if (!result.shouldPrompt) return;
        const copy = reviewRoutingCopy();
        const submit = (rating: ReviewRating) => {
          const feedbackSubject = copy.feedbackSubject.replace("{rating}", String(rating));
          submitReviewRating(rating, { subject: feedbackSubject, body: copy.feedbackBody }).catch(() => {});
        };
        Alert.alert(copy.title, Platform.OS === "android" ? copy.body.replace(/App Store/g, "Google Play").replace(/Apple subscriptions/g, "Google Play subscriptions") : copy.body, [
          { text: copy.ratings[5], onPress: () => submit(5) },
          { text: copy.ratings[4], onPress: () => submit(4) },
          { text: copy.ratings[3], onPress: () => submit(3) },
          { text: copy.ratings[2], onPress: () => submit(2) },
          { text: copy.ratings[1], onPress: () => submit(1) },
          { text: copy.notNow, style: "cancel" },
        ]);
      })
      .catch(() => {});
  };
  const active = stack[stack.length - 1]?.route || tab;
  const params = stack[stack.length - 1]?.params || {};
  const hardGateActive = !entitlementUnlocks(data, entitlementStatus) && !PRE_PURCHASE_ROUTES.includes(active);
  const displayRoute = gatedRoute(active, data, entitlementStatus);
  const accessState = accessStateFor(data, entitlementStatus, active);
  const screenData = dataForAccessState(data, entitlementStatus);
  const showPendingImportBanner = Boolean(currentImport && displayRoute !== "review" && displayRoute !== "cameraScanner" && displayRoute !== "paste" && displayRoute !== "paywall" && displayRoute !== "success");

  const props = { data: screenData, mutate, nav, theme, params, currentImport, setCurrentImport, setEntitlementStatus, accessState, recordReviewTrigger };
  const screen =
    displayRoute === "welcome" ? <Welcome {...props} /> :
    displayRoute === "onboarding" ? <Onboarding {...props} /> :
    displayRoute === "importOptions" ? <ImportOptions {...props} /> :
    displayRoute === "lockedDashboard" ? <LockedDashboard {...props} /> :
    displayRoute === "paywall" ? <Paywall {...props} /> :
    displayRoute === "terms" ? <LegalScreen {...props} kind="terms" /> :
    displayRoute === "privacy" ? <LegalScreen {...props} kind="privacy" /> :
    displayRoute === "today" ? <Today {...props} /> :
    displayRoute === "classes" ? <Classes {...props} /> :
    displayRoute === "scan" ? <Scan {...props} /> :
    displayRoute === "cameraScanner" ? <CameraScanner {...props} /> :
    displayRoute === "plan" ? <Plan {...props} /> :
    displayRoute === "tasks" ? <Tasks {...props} /> :
    displayRoute === "notes" ? <Notes {...props} /> :
    displayRoute === "profile" ? <Profile {...props} /> :
    displayRoute === "classDetail" ? <ClassDetail {...props} /> :
    displayRoute === "taskDetail" ? <TaskDetail {...props} /> :
    displayRoute === "assessmentDetail" ? <AssessmentDetail {...props} /> :
    displayRoute === "noteDetail" ? <NoteDetail {...props} /> :
    displayRoute === "paste" ? <PasteImport {...props} /> :
    displayRoute === "review" ? <ReviewImport {...props} /> :
    displayRoute === "success" ? <ApplySuccess {...props} /> :
    displayRoute === "widgets" ? <WidgetsScreen {...props} /> :
    displayRoute === "reminders" ? <Reminders {...props} /> :
    displayRoute === "studySession" ? <StudySession {...props} /> :
    displayRoute === "homePreview" ? <WidgetsScreen {...props} /> :
    displayRoute === "lockPreview" ? <WidgetsScreen {...props} /> :
    <Today {...props} />;

  const showTabs = entitlementUnlocks(data, entitlementStatus) && stack.length === 0 && !["welcome", "onboarding", "importOptions", "lockedDashboard", "paywall"].includes(displayRoute);
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      {screen}
      {showPendingImportBanner && currentImport ? <PendingImportResumeBanner batch={currentImport} nav={nav} theme={theme} hasTabs={showTabs} /> : null}
      {showTabs ? <TabBar tab={tab} setTab={nav.tab} theme={theme} /> : null}
    </View>
  );
}

type ScreenProps = {
  data: AppData;
  mutate: (fn: (current: AppData) => AppData, options?: { allowValidatedPremium?: boolean }) => void;
  nav: { push: (route: Route, params?: Record<string, string>) => void; back: () => void; tab: (route: Route) => void };
  theme: ReturnType<typeof palette>;
  params: Record<string, string>;
  currentImport: ImportBatch | null;
  setCurrentImport: (batch: ImportBatch | null) => void;
  setEntitlementStatus: (status: EntitlementStatus) => void;
  accessState: AccessState;
  recordReviewTrigger: (trigger: ReviewTrigger) => void;
};

function withFeedback(
  before: AppData,
  after: AppData,
  action: FeedbackEvent["action"],
  options: { classId?: string; actionId?: string; message?: string; dimension?: HealthDimensionKey } = {}
) {
  return appendFeedbackEvent(before, after, action, options);
}

function TabBar({ tab, setTab, theme }: { tab: Route; setTab: (route: Route) => void; theme: ReturnType<typeof palette> }) {
  const tabs: { route: Route; label: string; icon: string; fab?: boolean }[] = [
    { route: "today", label: textFor("tabs.today", "Today"), icon: "home" },
    { route: "classes", label: textFor("tabs.classes", "Classes"), icon: "classes" },
    { route: "scan", label: textFor("tabs.scan", "Scan"), icon: "scan", fab: true },
    { route: "plan", label: textFor("tabs.plan", "Plan"), icon: "plan" },
    { route: "profile", label: textFor("tabs.profile", "Profile"), icon: "profile" },
  ];
  return (
    <View style={{ position: "absolute", left: 12, right: 12, bottom: 18, height: 72, borderRadius: 26, backgroundColor: theme.dark ? "rgba(40,40,46,0.92)" : "rgba(248,248,252,0.96)", borderColor: theme.hairline, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-around", boxShadow: "0 12px 28px rgba(0,0,0,0.18)" }}>
      {tabs.map((item) => {
        const on = tab === item.route;
        if (item.fab) {
          return (
            <Pressable key={item.route} accessibilityRole="button" accessibilityLabel={item.label} hitSlop={10} onPress={() => setTab(item.route)} style={{ width: 58, height: 58, borderRadius: 18, marginTop: -28, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", boxShadow: `0 10px 22px ${theme.accent}66` }}>
              <Icon name={item.icon} color="#fff" size={27} />
            </Pressable>
          );
        }
        return (
          <Pressable key={item.route} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={item.label} hitSlop={8} onPress={() => setTab(item.route)} style={{ flex: 1, alignItems: "center", gap: 4 }}>
            <Icon name={item.icon} color={on ? theme.accent : theme.label3} size={23} strokeWidth={on ? 2.5 : 2} />
            <Text style={{ color: on ? theme.accent : theme.label3, fontSize: 10, fontWeight: "700" }}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PendingImportResumeBanner({ batch, nav, theme, hasTabs }: { batch: ImportBatch; nav: ScreenProps["nav"]; theme: ReturnType<typeof palette>; hasTabs: boolean }) {
  const count = batch.candidates.length;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={textFor("review.resume_title", "Import waiting for review")}
      accessibilityHint={textFor("review.resume_body", "{count} rows are saved on this device. Review them before anything changes your semester.", { count })}
      onPress={() => nav.push("review")}
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: hasTabs ? 98 : 22,
        borderRadius: 18,
        padding: 13,
        backgroundColor: theme.dark ? "rgba(27,31,42,0.96)" : "rgba(255,255,255,0.98)",
        borderWidth: 1,
        borderColor: theme.hairline,
        boxShadow: theme.dark ? "0 12px 26px rgba(0,0,0,0.38)" : "0 12px 28px rgba(18,36,74,0.16)",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: `${COLORS.orange}1F`, alignItems: "center", justifyContent: "center" }}>
        <ScanLine color={COLORS.orange} size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text selectable style={{ color: theme.label, fontWeight: "900" }}>{textFor("review.resume_title", "Import waiting for review")}</Text>
        <Text selectable numberOfLines={2} style={{ color: theme.label2, marginTop: 2, lineHeight: 18 }}>{textFor("review.resume_body", "{count} rows are saved on this device. Review them before anything changes your semester.", { count })}</Text>
      </View>
      <Text style={{ color: theme.accent, fontWeight: "900" }}>{textFor("review.resume", "Resume review")}</Text>
    </Pressable>
  );
}

function Screen({ children, theme, bottom = 112 }: { children: React.ReactNode; theme: ReturnType<typeof palette>; bottom?: number }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1, backgroundColor: theme.bg }} contentContainerStyle={{ paddingTop: 58, paddingBottom: bottom }}>
      {children}
    </ScrollView>
  );
}

function Header({ title, sub, right, theme }: { title: string; sub?: string; right?: React.ReactNode; theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
      <View style={{ flex: 1 }}>
        {sub ? <Text selectable style={{ color: theme.label2, fontSize: 12.5, fontWeight: "700", marginBottom: 3 }}>{sub}</Text> : null}
        <Text selectable style={{ color: theme.label, fontSize: 31, lineHeight: 34, fontWeight: "900" }}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

function BackHeader({ label, nav, theme, action }: { label?: string; nav: ScreenProps["nav"]; theme: ReturnType<typeof palette>; action?: React.ReactNode }) {
  return (
    <View style={{ paddingTop: 54, paddingHorizontal: 18, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.bg }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={nav.back} style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
        <ChevronLeft color={theme.label} size={21} strokeWidth={2.6} />
      </Pressable>
      <Text selectable style={{ color: theme.label, fontSize: 16, fontWeight: "800" }}>{label}</Text>
      <View style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center" }}>{action || null}</View>
    </View>
  );
}

function Card({ children, theme, style }: { children: React.ReactNode; theme: ReturnType<typeof palette>; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: theme.surface, borderRadius: 14, borderWidth: 1, borderColor: theme.hairline, boxShadow: theme.dark ? "0 8px 20px rgba(0,0,0,0.30)" : "0 8px 18px rgba(20,20,40,0.08)" }, style]}>{children}</View>;
}

function RecoveryScreen({ title, body, action, nav, theme }: { title: string; body: string; action?: string; nav: ScreenProps["nav"]; theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label={title} />
      <View style={{ padding: 20, gap: 14 }}>
        <Card theme={theme} style={{ padding: 18 }}>
          <Text selectable style={{ color: theme.label, fontSize: 24, lineHeight: 28, fontWeight: "900" }}>{title}</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 21, marginTop: 8 }}>{body}</Text>
          <Button label={action || "Back to dashboard"} theme={theme} icon="home" onPress={() => nav.tab("today")} />
        </Card>
      </View>
    </View>
  );
}

function Pill({ text, color, theme, icon }: { text: string; color?: string; theme: ReturnType<typeof palette>; icon?: string }) {
  const c = color || theme.label2;
  return (
    <View style={{ flexDirection: "row", gap: 5, alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: `${c}1C` }}>
      {icon ? <Icon name={icon} size={13} color={c} /> : null}
      <Text selectable style={{ color: c, fontSize: 12, fontWeight: "800" }}>{text}</Text>
    </View>
  );
}

function FieldInput({ label, value, onChangeText, placeholder, theme, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; theme: ReturnType<typeof palette>; multiline?: boolean }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "900", marginBottom: 5 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.label3} multiline={multiline} textAlignVertical={multiline ? "top" : "center"} style={{ minHeight: multiline ? 76 : 44, borderRadius: 13, backgroundColor: theme.surface2, color: theme.label, paddingHorizontal: 12, paddingVertical: 10, fontWeight: "800" }} />
    </View>
  );
}

function Section({ title, action, onAction, theme }: { title: string; action?: string; onAction?: () => void; theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ paddingHorizontal: 4, paddingBottom: 9, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text selectable style={{ color: theme.label, fontSize: 19, fontWeight: "900" }}>{title}</Text>
      {action ? <Pressable onPress={onAction}><Text style={{ color: theme.accent, fontSize: 14, fontWeight: "800" }}>{action}</Text></Pressable> : null}
    </View>
  );
}

function ClassGlyph({ c, size = 42 }: { c?: ClassItem; size?: number }) {
  const klass = c || FALLBACK_CLASS;
  return (
    <View style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), backgroundColor: "#F2F2F7", borderWidth: 1, borderColor: "#E4E4EA", alignItems: "center", justifyContent: "center" }}>
      <Icon name={klass.icon} color="#111111" size={Math.round(size * 0.52)} />
    </View>
  );
}

function ProgressBar({ value, color, theme, height = 8 }: { value: number; color: string; theme: ReturnType<typeof palette>; height?: number }) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return (
    <View style={{ height, borderRadius: 99, backgroundColor: theme.surface3, overflow: "hidden" }}>
      <View style={{ height: "100%", width: `${Math.max(3, Math.min(100, safeValue * 100))}%`, borderRadius: 99, backgroundColor: color }} />
    </View>
  );
}

function TaskRow({ task, data, theme, onToggle, onOpen }: { task: TaskItem; data: AppData; theme: ReturnType<typeof palette>; onToggle: () => void; onOpen: () => void }) {
  const c = safeClassFor(data, task.classId);
  const dueDays = hasTaskDate(task) ? daysUntilTask(task) : 99;
  const dueColor = task.done ? theme.label3 : task.missing ? COLORS.orange : dueDays < 0 ? COLORS.red : dueDays === 0 ? COLORS.orange : dueDays <= 2 ? COLORS.blue : theme.label2;
  return (
    <Pressable onPress={onOpen} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}>
      <Pressable onPress={(e) => { e.stopPropagation(); onToggle(); }} style={{ width: 27, height: 27, borderRadius: 99, borderWidth: task.done ? 0 : 2, borderColor: dueColor, backgroundColor: task.done ? COLORS.green : "transparent", alignItems: "center", justifyContent: "center" }}>
        {task.done ? <Check color="#fff" size={17} strokeWidth={3} /> : null}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text selectable numberOfLines={1} style={{ color: task.done ? theme.label3 : theme.label, textDecorationLine: task.done ? "line-through" : "none", fontSize: 16, fontWeight: "800" }}>{task.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
          <View style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: dueColor }} />
          <Text selectable style={{ color: theme.label2, fontSize: 12.5, fontWeight: "700" }}>{c.code}</Text>
          <Text selectable style={{ color: dueColor, fontSize: 12.5, fontWeight: "800" }}>{taskDueLabel(task)}</Text>
        </View>
      </View>
      {task.urgent && !task.done ? <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: COLORS.red }} /> : null}
      <ChevronRight color={theme.label3} size={17} />
    </Pressable>
  );
}

function NoteCard({ note, data, theme, onOpen }: { note: NoteItem; data: AppData; theme: ReturnType<typeof palette>; onOpen: () => void }) {
  const c = safeClassFor(data, note.classId);
  const insight = parseNoteInsights(note, data);
  return (
    <Pressable onPress={onOpen}>
      <Card theme={theme} style={{ padding: 15 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 9 }}>
          <Pill text={c.code} color={c.color} theme={theme} />
          <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "700" }}>{new Date(note.createdAt).toLocaleDateString()}</Text>
        </View>
        <Text selectable style={{ color: theme.label, fontSize: 16, fontWeight: "900", marginBottom: 5 }}>{note.title}</Text>
        <Text selectable numberOfLines={2} style={{ color: theme.label2, fontSize: 14.5, lineHeight: 20 }}>{note.summary}</Text>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
          <Pill text={textFor("note.concepts", "{count} concepts", { count: insight.concepts.length })} color={COLORS.purple} theme={theme} icon="sparkles" />
          {note.suggestedTasks.length ? <Pill text={textFor("note.tasks", "{count} tasks", { count: note.suggestedTasks.length })} color={COLORS.blue} theme={theme} icon="target" /> : null}
          {insight.formulas.length ? <Pill text={`${insight.formulas.length} formulas`} color={COLORS.green} theme={theme} /> : null}
        </View>
      </Card>
    </Pressable>
  );
}

function Welcome({ data, mutate, nav, theme }: ScreenProps) {
  const heroPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(heroPulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(heroPulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [heroPulse]);
  const pulseScale = heroPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] });
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView style={{ marginBottom: 112 }} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 58, paddingHorizontal: 24, paddingBottom: 24 }}>
        <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
          <RNImage source={require("./assets/icon.png")} style={{ width: 56, height: 56, borderRadius: 17, marginBottom: 18 }} />
        </Animated.View>
        <Text selectable style={{ color: theme.label, fontSize: 38, lineHeight: 40, fontWeight: "900", marginBottom: 10 }}>{textFor("welcome.title", "Know exactly where you stand.")}</Text>
        <Text selectable style={{ color: theme.label2, fontSize: 16, lineHeight: 22, marginBottom: 18 }}>{textFor("welcome.body", "Import a syllabus. StudyPlanner maps the semester, finds pressure, and tells you the next move.")}</Text>
        <Card theme={theme} style={{ padding: 16, marginBottom: 12, backgroundColor: theme.dark ? "#17171C" : "#FFFFFF" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 72, height: 72, borderRadius: 999, borderWidth: 8, borderColor: COLORS.green, alignItems: "center", justifyContent: "center" }}>
              <Text selectable style={{ color: theme.label, fontSize: 22, fontWeight: "900" }}>0</Text>
              <Text selectable style={{ color: theme.label2, fontSize: 9, fontWeight: "900" }}>{textFor("welcome.preview", "preview")}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: theme.label, fontSize: 19, fontWeight: "900" }}>{textFor("welcome.card_title", "syllabus in. Dashboard out.")}</Text>
              <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 4 }}>{textFor("welcome.card_body", "Preview classes, deadlines, exams, and first move before anything saves.")}</Text>
            </View>
          </View>
        </Card>
        {[
          ["scan", COLORS.blue, textFor("welcome.map_title", "Map every deadline"), textFor("welcome.map_body", "syllabus in. Semester out.")],
          ["heart", COLORS.green, textFor("welcome.health_title", "Track Semester Health"), textFor("welcome.health_body", "Know if you are okay.")],
        ].map(([i, c, title, body]) => (
          <Card key={title} theme={theme} style={{ padding: 16, flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: `${c}1C`, alignItems: "center", justifyContent: "center" }}><Icon name={i} color={c} size={23} /></View>
            <View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 16 }}>{title}</Text><Text selectable style={{ color: theme.label2, marginTop: 3, lineHeight: 18 }}>{body}</Text></View>
          </Card>
        ))}
      </ScrollView>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 24, paddingBottom: 34, backgroundColor: "rgba(245,245,247,0.94)" }}>
        <Button label={textFor("welcome.import", "Import syllabus")} theme={theme} icon="upload" onPress={() => nav.push("onboarding")} />
      </View>
    </View>
  );
}

function Button({ label, theme, onPress, secondary, icon }: { label: string; theme: ReturnType<typeof palette>; onPress?: () => void; secondary?: boolean; icon?: string }) {
  const disabled = !onPress;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} hitSlop={6} onPress={() => { if (!disabled) { tap(); onPress?.(); } }} style={{ minHeight: 51, borderRadius: 999, backgroundColor: disabled ? theme.surface3 : secondary ? theme.surface3 : theme.accent, opacity: disabled ? 0.54 : 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 9, paddingHorizontal: 18 }}>
      {icon ? <Icon name={icon} color={secondary || disabled ? theme.label : "#fff"} size={18} /> : null}
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={{ color: secondary || disabled ? theme.label : "#fff", fontSize: 16, fontWeight: "900", flexShrink: 1 }}>{label}</Text>
    </Pressable>
  );
}

function MiniSemesterHealth({ theme }: { theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ width: "48%", borderRadius: 18, padding: 13, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 1, borderColor: theme.hairline }}>
      <Text selectable style={{ color: theme.label2, fontSize: 10, fontWeight: "900" }}>{textFor("locked.health", "SEMESTER HEALTH")}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
        <View style={{ width: 52, height: 52, borderRadius: 99, borderWidth: 7, borderColor: COLORS.green, alignItems: "center", justifyContent: "center" }}>
          <Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900" }}>0</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text selectable numberOfLines={1} style={{ color: theme.label, fontWeight: "900" }}>{textFor("mini.builds_live", "Builds live")}</Text>
          <Text selectable numberOfLines={1} style={{ color: COLORS.green, fontSize: 12, fontWeight: "900" }}>{textFor("mini.after_import", "after import")}</Text>
        </View>
      </View>
    </View>
  );
}

function MiniPressureForecast({ theme }: { theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ width: "48%", borderRadius: 18, padding: 13, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 1, borderColor: theme.hairline }}>
      <Text selectable style={{ color: theme.label2, fontSize: 10, fontWeight: "900" }}>{textFor("mini.pressure", "PRESSURE FORECAST")}</Text>
      <Text selectable style={{ color: theme.label, fontSize: 16, fontWeight: "900", marginTop: 8 }}>{textFor("mini.after_import", "After import")}</Text>
      <View style={{ flexDirection: "row", gap: 5, alignItems: "flex-end", height: 48, marginTop: 8 }}>
        {[1, 2, 3, 4].map((index) => <View key={index} style={{ flex: 1, height: "18%", borderRadius: 7, backgroundColor: theme.surface3 }} />)}
      </View>
    </View>
  );
}

function MiniClassPulse({ theme }: { theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ width: "48%", borderRadius: 18, padding: 13, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 1, borderColor: theme.hairline }}>
      <Text selectable style={{ color: theme.label2, fontSize: 10, fontWeight: "900" }}>{textFor("mini.class_pulse", "CLASS PULSE")}</Text>
      <View style={{ flexDirection: "row", gap: 9, alignItems: "center", marginTop: 10 }}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "#F2F2F7", alignItems: "center", justifyContent: "center" }}><Icon name="classes" size={20} /></View>
        <View style={{ flex: 1 }}>
          <Text selectable style={{ color: theme.label, fontWeight: "900" }}>{textFor("tabs.classes", "Classes")}</Text>
          <Text selectable style={{ color: COLORS.orange, fontSize: 12, fontWeight: "900" }}>{textFor("widgets.locked", "locked")}</Text>
        </View>
      </View>
      <Text selectable numberOfLines={1} style={{ color: theme.label2, fontSize: 12, marginTop: 8 }}>{textFor("mini.no_fake", "No fake courses")}</Text>
    </View>
  );
}

function MiniNotesPreparedness({ theme }: { theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ width: "48%", borderRadius: 18, padding: 13, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 1, borderColor: theme.hairline }}>
      <Text selectable style={{ color: theme.label2, fontSize: 10, fontWeight: "900" }}>{textFor("mini.notes_preparedness", "NOTES PREPAREDNESS")}</Text>
      <Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900", marginTop: 8 }}>{textFor("mini.locked", "Locked")}</Text>
      <ProgressBar value={0} color={COLORS.purple} theme={theme} />
      <Text selectable numberOfLines={1} style={{ color: theme.label2, fontSize: 12, marginTop: 8 }}>{textFor("mini.after_import", "after notes")}</Text>
    </View>
  );
}

function MiniNextMove({ theme }: { theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ width: "48%", borderRadius: 18, padding: 13, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 1, borderColor: theme.hairline }}>
      <Text selectable style={{ color: theme.label2, fontSize: 10, fontWeight: "900" }}>{textFor("mini.next_move", "NEXT MOVE")}</Text>
      <Text selectable style={{ color: theme.label, fontSize: 16, fontWeight: "900", marginTop: 8 }}>{textFor("mini.first_action", "First action")}</Text>
      <Text selectable numberOfLines={1} style={{ color: theme.label2, fontSize: 12, marginTop: 4 }}>{textFor("mini.after_import", "after import")}</Text>
    </View>
  );
}

function MiniWidgetPreview({ theme }: { theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ width: "48%", borderRadius: 18, padding: 13, backgroundColor: "#111114" }}>
      <Text selectable style={{ color: "rgba(255,255,255,0.56)", fontSize: 10, fontWeight: "900" }}>{textFor("mini.widget", "WIDGET")}</Text>
      <Text selectable style={{ color: "#fff", fontSize: 16, fontWeight: "900", marginTop: 8 }}>{textFor("widgets.sub_locked", "Locked preview")}</Text>
      <Text selectable numberOfLines={1} style={{ color: "rgba(255,255,255,0.68)", fontSize: 12, marginTop: 4 }}>{textFor("mini.unlock_after", "Unlock after purchase")}</Text>
      <View style={{ flexDirection: "row", gap: 4, marginTop: 10 }}>
        {[COLORS.green, COLORS.orange, COLORS.purple].map((color) => <View key={color} style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: color }} />)}
      </View>
    </View>
  );
}

function Onboarding({ data, mutate, nav, theme, params }: ScreenProps) {
  const steps = ["name", "studentType", "mainGoal", "artifacts", "build"] as const;
  const initialIndex = Math.max(0, Math.min(steps.length - 1, Number(params.onboardingIndex || 0) || 0));
  const [index, setIndex] = useState(initialIndex);
  const storedFirstName = data.prefs.firstName && data.prefs.firstName !== "Student" ? data.prefs.firstName : "";
  const [profile, setProfile] = useState({
    name: storedFirstName || (data.prefs.name === "Student" ? "" : firstNameFromPrefs(data)),
    studentType: data.prefs.studentType || "School semester",
    mainGoal: data.prefs.mainGoal || data.prefs.semesterGoal || "Everything",
    scanIntent: data.prefs.scanIntent || "syllabus PDF",
  });
  const motion = useRef(new Animated.Value(1)).current;
  const step = steps[index];
  const firstName = profile.name.trim().split(/\s+/)[0] || "there";
  const studentOptions = ["School semester", "High school classes", "College courses", "Grad school", "Online classes", "Exams"];
  const goalOptions = ["Deadlines", "Exams", "Notes", "Grades", "Study plan", "Everything"];
  const scanOptions = ["Upload PDF", "Paste syllabus", "Scan with camera", "Skip for now"];
  useEffect(() => {
    motion.setValue(0);
    Animated.timing(motion, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [index, motion]);

  const persistProfile = (complete = false, source = profile) => mutate((d) => {
    const cleanName = source.name.trim() || "Student";
    const cleanFirst = cleanName.split(/\s+/)[0] || "Student";
    return {
      ...d,
      prefs: {
        ...d.prefs,
        name: cleanName,
        firstName: cleanFirst,
        level: source.studentType,
        studentType: source.studentType,
        studentPersona: source.studentType,
        mainGoal: source.mainGoal,
        semesterGoal: source.mainGoal,
        workloadStyle: "Balanced",
        scanIntent: source.scanIntent,
        theme: "light",
        onboardingComplete: complete ? true : d.prefs.onboardingComplete,
        osLive: d.prefs.osLive,
      },
    };
  });

  const next = (source = profile) => {
    persistProfile(index === steps.length - 1, source);
    if (index < steps.length - 1) setIndex(index + 1);
    else if (source.scanIntent === "Paste syllabus") nav.push("paywall", { next: "paste", mode: "syllabus" });
    else if (source.scanIntent === "Skip for now") nav.tab("lockedDashboard");
    else nav.push("paywall", { next: "scan", action: source.scanIntent === "Scan with camera" ? "camera" : "pdf" });
  };
  const pick = (key: keyof typeof profile, value: string) => {
    const nextProfile = { ...profile, [key]: value };
    setProfile(nextProfile);
    setTimeout(() => next(nextProfile), 80);
  };
  const motionStyle = {
    opacity: motion,
    transform: [
      {
        translateY: motion.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0]
        })
      },
      {
        scale: motion.interpolate({
          inputRange: [0, 1],
          outputRange: [0.98, 1]
        })
      }
    ]
  };
  const renderOptions = (key: keyof typeof profile, opts: string[]) => (
    <View style={{ gap: 10 }}>
      {opts.map((opt) => {
        const on = profile[key] === opt;
        return (
          <Pressable key={opt} onPress={() => pick(key, opt)}>
            <Card theme={theme} style={{ padding: 17, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderColor: on ? theme.accent : theme.hairline, borderWidth: on ? 2 : 1, backgroundColor: on ? "#FFFFFF" : "rgba(255,255,255,0.72)" }}>
              <Text selectable style={{ color: theme.label, fontSize: 16, fontWeight: "900" }}>{optionText(opt)}</Text>
              {on ? <CheckCircle2 color={COLORS.green} size={22} /> : <Circle color={theme.label3} size={22} />}
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
      <View style={{ paddingTop: 58, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", gap: 8 }}>
        {index ? <Pressable onPress={() => setIndex(index - 1)}><ChevronLeft color={theme.label2} size={22} /></Pressable> : <View style={{ width: 22 }} />}
        <View style={{ flex: 1, flexDirection: "row", gap: 5 }}>{steps.map((_, i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 99, backgroundColor: i <= index ? theme.accent : theme.surface3 }} />)}</View>
      </View>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        <Animated.View style={motionStyle}>
          {step === "name" ? (
            <>
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: "#0A0A0D", alignItems: "center", justifyContent: "center", marginBottom: 22 }}><Icon name="sparkles" color="#fff" size={27} /></View>
              <Text selectable style={{ color: theme.label, fontSize: 36, lineHeight: 39, fontWeight: "900" }}>{textFor("onboarding.name_title", "What should StudyPlanner call you?")}</Text>
              <Text selectable style={{ color: theme.label2, fontSize: 15, lineHeight: 21, marginTop: 10 }}>{textFor("onboarding.name_sub", "Let's build your semester.")}</Text>
              <TextInput autoFocus value={profile.name} onChangeText={(name) => setProfile((current) => ({ ...current, name }))} placeholder={textFor("onboarding.name_placeholder", "Your first name")} placeholderTextColor={theme.label3} returnKeyType="next" onSubmitEditing={() => next()} style={{ marginTop: 26, minHeight: 58, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: theme.hairline, color: theme.label, paddingHorizontal: 18, fontSize: 20, fontWeight: "900" }} />
              {profile.name.trim() ? <Text selectable style={{ color: theme.label, fontSize: 20, lineHeight: 25, fontWeight: "900", marginTop: 22 }}>{textFor("onboarding.nice", "Nice, {name}.", { name: firstName })}</Text> : null}
            </>
          ) : null}
          {step === "studentType" ? (
            <>
              <Text selectable style={{ color: theme.label2, fontSize: 13, fontWeight: "900", marginBottom: 8 }}>{textFor("onboarding.student_kicker", "NICE, {name}", { name: firstName.toUpperCase() })}</Text>
              <Text selectable style={{ color: theme.label, fontSize: 34, lineHeight: 37, fontWeight: "900", marginBottom: 22 }}>{textFor("onboarding.student_title", "What are you managing?")}</Text>
              {renderOptions("studentType", studentOptions)}
            </>
          ) : null}
          {step === "mainGoal" ? (
            <>
              <Text selectable style={{ color: theme.label, fontSize: 34, lineHeight: 37, fontWeight: "900", marginBottom: 22 }}>{textFor("onboarding.goal_title", "What do you want under control?")}</Text>
              {renderOptions("mainGoal", goalOptions)}
            </>
          ) : null}
          {step === "artifacts" ? (
            <>
              <Text selectable style={{ color: theme.label, fontSize: 34, lineHeight: 37, fontWeight: "900" }}>{textFor("onboarding.artifacts_title", "StudyPlanner turns your schoolwork into a live plan.")}</Text>
              <Text selectable style={{ color: theme.label2, fontSize: 15, lineHeight: 21, marginTop: 8, marginBottom: 18 }}>{textFor("onboarding.artifacts_sub", "Real app artifacts. No demo classes.")}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                <MiniSemesterHealth theme={theme} />
                <MiniNextMove theme={theme} />
                <MiniClassPulse theme={theme} />
                <MiniPressureForecast theme={theme} />
                <MiniNotesPreparedness theme={theme} />
                <MiniWidgetPreview theme={theme} />
              </View>
            </>
          ) : null}
          {step === "build" ? (
            <>
              <Text selectable style={{ color: theme.label, fontSize: 34, lineHeight: 37, fontWeight: "900", marginBottom: 8 }}>{textFor("onboarding.build_title", "Build your semester.")}</Text>
              <Text selectable style={{ color: theme.label2, fontSize: 15, lineHeight: 21, marginBottom: 22 }}>{textFor("onboarding.paywall_first", "Unlock first, then scan.")}</Text>
              {renderOptions("scanIntent", scanOptions)}
            </>
          ) : null}
        </Animated.View>
      </ScrollView>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 24, paddingBottom: 34, backgroundColor: "rgba(245,245,247,0.92)" }}>
        <Button label={textFor("common.continue", "Continue")} theme={theme} icon={step === "build" ? "crown" : "chevron-right"} onPress={next} />
      </View>
    </View>
  );
}

function ImportOptions({ data, mutate, nav, theme }: ScreenProps) {
  const completeAnd = (route: "scan" | "paste" | "lockedDashboard", params?: Record<string, string>) => {
    mutate((d) => ({
      ...d,
      prefs: {
        ...d.prefs,
        onboardingComplete: true,
        osLive: false,
        premium: false,
      },
    }));
    if (route === "paste") nav.push("paste", params);
    else nav.tab(route);
  };
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F7" }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 72, paddingHorizontal: 22, paddingBottom: 120 }}>
        <Text selectable style={{ color: theme.label, fontSize: 38, lineHeight: 41, fontWeight: "900" }}>{textFor("onboarding.build_title", "Build your semester.")}</Text>
        <Text selectable style={{ color: theme.label2, fontSize: 16, lineHeight: 22, marginTop: 8, marginBottom: 20 }}>{textFor("paste.preview_sub", "Preview what StudyPlanner finds before you unlock.")}</Text>
        <Card theme={theme} style={{ padding: 17, backgroundColor: "#111114", marginBottom: 18 }}>
          <Text selectable style={{ color: "#fff", fontSize: 21, lineHeight: 25, fontWeight: "900" }}>{textFor("locked.card_title", "Start with your syllabus.")}</Text>
          <Text selectable style={{ color: "rgba(255,255,255,0.72)", lineHeight: 20, marginTop: 6 }}>{textFor("locked.sub", "Classes, deadlines, exams, pressure, and your first move appear in preview.")}</Text>
        </Card>
        {[
          [textFor("option.upload_pdf", "Upload PDF"), textFor("scan.more_upload_body", "Pick a syllabus file"), "upload", COLORS.green, () => completeAnd("scan", { action: "pdf" })],
          [textFor("locked.paste", "Paste manually"), textFor("paste.syllabus_required", "Enter syllabus text"), "file", COLORS.blue, () => completeAnd("paste", { mode: "syllabus" })],
          [textFor("option.scan_camera", "Scan with camera"), textFor("scan.camera", "Photo or camera OCR"), "camera", COLORS.orange, () => completeAnd("scan", { action: "camera" })],
          [textFor("option.skip", "Skip for now"), textFor("widgets.sub_locked", "View the locked dashboard"), "lock", COLORS.purple, () => completeAnd("lockedDashboard")],
        ].map(([title, body, icon, color, onPress]: any) => (
          <Pressable key={title} onPress={onPress}>
            <Card theme={theme} style={{ padding: 16, flexDirection: "row", gap: 13, alignItems: "center", marginBottom: 12 }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: `${color}1C`, alignItems: "center", justifyContent: "center" }}><Icon name={icon} color={color} /></View>
              <View style={{ flex: 1 }}>
                <Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900" }}>{title}</Text>
                <Text selectable style={{ color: theme.label2, lineHeight: 19, marginTop: 3 }}>{body}</Text>
              </View>
              <ChevronRight color={theme.label3} size={18} />
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function LockedDashboard({ data, nav, theme, currentImport }: ScreenProps) {
  const firstName = firstNameFromPrefs(data);
  const approved = currentImport?.candidates.filter((candidate) => candidate.approved) || [];
  const previewSummary = {
    classes: approved.filter((candidate) => candidate.kind === "class").length,
    assignments: approved.filter((candidate) => candidate.kind === "task").length,
    exams: approved.filter((candidate) => candidate.kind === "exam").length,
  };
  const hasPreview = approved.length > 0;
  const features = [
    [textFor("locked.workload", "Workload"), textFor("locked.workload_body", "Locked until your syllabus is reviewed.")],
    [textFor("locked.grades", "Grades"), textFor("locked.grades_body", "Locked until real classes exist.")],
    [textFor("locked.preparedness", "Preparedness"), textFor("locked.preparedness_body", "Locked until notes and exams exist.")],
    [textFor("locked.consistency", "Consistency"), textFor("locked.consistency_body", "Locked until StudyPlanner can see your plan.")],
  ];
  return (
    <Screen theme={theme}>
      <View style={{ paddingHorizontal: 16, gap: 16, paddingTop: 4 }}>
        <View style={{ gap: 8, paddingHorizontal: 2 }}>
          <Text selectable style={{ color: theme.label2, fontSize: 13, fontWeight: "900" }}>{textFor("locked.kicker", "LOCKED PREVIEW")}</Text>
          <Text selectable style={{ color: theme.label, fontSize: 36, lineHeight: 39, fontWeight: "900" }}>{textFor("locked.title", "{name}, build your semester.", { name: firstName })}</Text>
          <Text selectable style={{ color: theme.label2, fontSize: 16, lineHeight: 22 }}>{textFor("locked.sub", "Unlock StudyPlanner first. Then scan a syllabus and apply your live plan.")}</Text>
        </View>

        <View style={{ borderRadius: 28, padding: 20, backgroundColor: "#111114", overflow: "hidden" }}>
          <View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Icon name="scan" color="#FFFFFF" size={26} />
          </View>
          <Text selectable style={{ color: "rgba(255,255,255,0.62)", fontSize: 12, fontWeight: "900", marginBottom: 7 }}>{textFor("locked.card_kicker", "SYLLABUS AFTER UNLOCK")}</Text>
          <Text selectable style={{ color: "#FFFFFF", fontSize: 25, lineHeight: 29, fontWeight: "900" }}>{textFor("locked.card_title", "Turn your syllabus into a live plan.")}</Text>
          <View style={{ gap: 11, marginTop: 17 }}>
            {[
              ["1", textFor("locked.step1", "Unlock StudyPlanner")],
              ["2", textFor("locked.step2", "Scan syllabus")],
              ["3", textFor("locked.step3", "Review deadlines")],
            ].map(([step, label]) => (
              <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}>
                  <Text selectable style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "900" }}>{step}</Text>
                </View>
                <Text selectable style={{ color: "#FFFFFF", flex: 1, fontSize: 16, fontWeight: "900" }}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={{ marginTop: 16 }}>
            <Pressable accessibilityRole="button" onPress={() => nav.push("paywall", { next: "scan" })} style={{ minHeight: 51, borderRadius: 999, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}>
              <Icon name="scan" color="#111114" size={18} />
              <Text style={{ color: "#111114", fontWeight: "900" }}>{textFor("locked.scan", "Scan syllabus")}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => nav.push("paywall", { next: "paste", mode: "syllabus" })} style={{ minHeight: 48, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", marginTop: 10 }}>
              <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>{textFor("locked.paste", "Paste manually")}</Text>
            </Pressable>
          </View>
        </View>

        {hasPreview ? (
          <Card theme={theme} style={{ padding: 17, backgroundColor: theme.dark ? "#18222A" : "#EEF7FF" }}>
            <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "900", marginBottom: 10 }}>{textFor("paywall.ready_apply", "Ready to apply")}</Text>
            <View style={{ flexDirection: "row", gap: 9, marginBottom: 12 }}>
              <MiniMetric value={previewSummary.classes} label={textFor("review.classes", "classes")} color={COLORS.blue} theme={theme} />
              <MiniMetric value={previewSummary.assignments} label={textFor("review.assignments", "assignments")} color={COLORS.orange} theme={theme} />
              <MiniMetric value={previewSummary.exams} label={textFor("review.exams", "exams")} color={COLORS.purple} theme={theme} />
            </View>
            <Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 17 }}>{textFor("paywall.ready_apply", "Ready to apply")}</Text>
            <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 4 }}>{textFor("paywall.sub_import", "Your preview is ready. Unlock to apply it to the live dashboard, reminders, and widgets.")}</Text>
            <Button label={textFor("review.unlock", "Unlock my semester")} theme={theme} icon="crown" onPress={() => nav.push("paywall")} />
          </Card>
        ) : null}

        <Card theme={theme} style={{ padding: 18, backgroundColor: theme.surface }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <View>
              <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "900" }}>{textFor("locked.health", "SEMESTER HEALTH")}</Text>
              <Text selectable style={{ color: theme.label, fontSize: 25, lineHeight: 29, fontWeight: "900", marginTop: 4 }}>{textFor("locked.health_title", "Locked preview")}</Text>
            </View>
            <Pill text={textFor("locked.health_title", "Locked preview").split(" ")[0]} color={COLORS.orange} theme={theme} icon="lock" />
          </View>
          <Text selectable style={{ color: theme.label2, lineHeight: 20, marginBottom: 14 }}>{textFor("locked.health_sub", "Your score appears after your syllabus is reviewed and applied.")}</Text>
          <View style={{ gap: 10 }}>
            {features.map(([title, body]) => (
              <View key={title} style={{ padding: 12, borderRadius: 15, backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.hairline }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Lock color={theme.label3} size={15} />
                  <Text selectable style={{ color: theme.label, fontWeight: "900", flex: 1 }}>{title}</Text>
                  <Text selectable style={{ color: theme.label3, fontWeight: "900", fontSize: 12 }}>{textFor("locked.after_scan", "after scan")}</Text>
                </View>
                <View style={{ height: 8, borderRadius: 999, backgroundColor: theme.hairline, marginTop: 10, overflow: "hidden" }}>
                  <View style={{ width: "34%", height: 8, borderRadius: 999, backgroundColor: theme.surface3 }} />
                </View>
                <Text selectable style={{ color: theme.label2, lineHeight: 18, marginTop: 7, fontSize: 13 }}>{body}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Button label={textFor("locked.unlock", "Unlock StudyPlanner")} theme={theme} icon="crown" onPress={() => nav.push("paywall")} />
        <Button label={textFor("common.restore", "Restore Purchases")} theme={theme} secondary icon="refresh" onPress={() => nav.push("paywall")} />
      </View>
    </Screen>
  );
}

function LegalScreen({ nav, theme, kind }: ScreenProps & { kind: "terms" | "privacy" }) {
  const isPrivacy = kind === "privacy";
  const storeName = Platform.OS === "android" ? "Google Play" : "App Store";
  const accountName = Platform.OS === "android" ? "Google Play account" : "Apple account";
  const rows = isPrivacy
    ? [
        ["Data source", "StudyPlanner stores your planner data on this device."],
        ["Imports", "syllabus, note, PDF, and camera text are used to create your reviewed preview and semester plan."],
        ["Purchases", `Subscription purchases and restores are handled by ${storeName}.`],
        ["Sharing", "StudyPlanner does not sell your planner data."],
        ["Support", "Email support to request help with app data, purchases, or privacy questions."],
      ]
    : [
        ["Subscription", `StudyPlanner uses auto-renewing subscriptions shown and confirmed by ${storeName} before purchase.`],
        ["Access", "A valid active entitlement is required to apply imports, use the dashboard, schedule reminders, and sync widgets."],
        ["Billing", `Manage or cancel subscriptions from your ${accountName}.`],
        ["Standard terms", "Apple's standard EULA applies unless a separate written agreement is provided."],
      ];
  return (
    <Screen theme={theme}>
      <BackHeader nav={nav} theme={theme} label={isPrivacy ? "Privacy Policy" : "Terms of Use"} />
      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        <Header title={isPrivacy ? "Privacy Policy" : "Terms of Use"} sub="StudyPlanner" theme={theme} />
        <Card theme={theme} style={{ overflow: "hidden" }}>
          {rows.map(([title, body], index) => (
            <View key={title} style={{ padding: 15, borderBottomWidth: index === rows.length - 1 ? 0 : 1, borderBottomColor: theme.hairline }}>
              <Text selectable style={{ color: theme.label, fontSize: 16, fontWeight: "900" }}>{title}</Text>
              <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 4 }}>{body}</Text>
            </View>
          ))}
        </Card>
        {!isPrivacy ? <Button label={textFor("common.terms", "Terms")} theme={theme} secondary icon="file" onPress={() => openExternal(TERMS_URL)} /> : null}
        <Button label={textFor("common.support", "Support")} theme={theme} secondary icon="file" onPress={() => openExternal(SUPPORT_URL)} />
      </View>
    </Screen>
  );
}

function Paywall({ data, mutate, nav, theme, params, currentImport, setCurrentImport, setEntitlementStatus }: ScreenProps) {
  const initialPlans = useMemo(() => fallbackPlans(), []);
  const firstName = firstNameFromPrefs(data);
  const storeCopy = (copy: string) =>
    Platform.OS === "android"
      ? copy
          .replace(/App-Store/g, "Google Play")
          .replace(/App Store/g, "Google Play")
          .replace(/Apple subscriptions/g, "Google Play subscriptions")
          .replace(/Apple confirms/g, "Google Play confirms")
          .replace(/Apple ID/g, "Google Play account")
      : copy;
  const paywallText = (key: string, fallback: string, vars: CopyVars = {}) =>
    storeCopy(textFor(key, fallback, vars));
  const [plans, setPlans] = useState<PaywallPlan[]>(initialPlans);
  const [selected, setSelected] = useState(initialPlans[0].id);
  const [storePlansReady, setStorePlansReady] = useState(false);
  const [busy, setBusy] = useState<"loading" | "purchase" | "restore" | "checking" | null>("loading");
  const [message, setMessage] = useState(paywallText("paywall.message_loading", "Connecting to the store..."));

  const unlock = (productId?: string, checkedAt = new Date().toISOString()) => {
    setEntitlementStatus("active");
    mutate((d) => {
      const unlocked = premiumData(d, productId || selected, checkedAt);
      return currentImport ? applyImport(unlocked, currentImport) : unlocked;
    }, { allowValidatedPremium: true });
    if (currentImport) setCurrentImport(null);
    if (currentImport) nav.tab("today");
    else if (params.next === "scan") nav.push("scan", params.action ? { action: params.action } : undefined);
    else if (params.next === "paste") nav.push("paste", { mode: params.mode || "syllabus" });
    else nav.tab("today");
  };

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([initializeStudyPlannerStore(), loadStorePlans(), checkStudyPlannerEntitlement()])
      .then((results) => {
        if (!mounted) return;
        const planResult = results[1];
        let localizedPlansReady = false;
        if (planResult.status === "fulfilled") {
          setPlans(planResult.value);
          setSelected((current) => planResult.value.some((plan) => plan.id === current) ? current : planResult.value[0]?.id || current);
          localizedPlansReady = planResult.value.some((plan) => plan.displayPrice !== "Shown by store");
          setStorePlansReady(localizedPlansReady);
        }
        const entitlementResult = results[2];
        if (entitlementResult.status === "fulfilled" && entitlementResult.value.isPremium) {
          unlock(entitlementResult.value.productId, entitlementResult.value.checkedAt);
          return;
        }
        setBusy(null);
        setMessage(localizedPlansReady ? paywallText("paywall.message_choose", "Choose a StudyPlanner plan to continue.") : paywallText("paywall.message_unavailable", "Store pricing is not loaded. Restore is still available."));
      })
      .catch((error) => {
        if (!mounted) return;
        setBusy(null);
        setMessage(error instanceof Error ? error.message : paywallText("paywall.message_unavailable", "The store is not available right now."));
      });
    return () => {
      mounted = false;
    };
  }, []);

  const purchase = async () => {
    if (!storePlansReady) {
      setMessage(paywallText("paywall.loading_price", "Store pricing is still loading. Try again in a moment."));
      return;
    }
    setBusy("purchase");
    setMessage(paywallText("paywall.opening", "Opening the purchase sheet..."));
    try {
      await purchasePlan(selected);
      setMessage(paywallText("paywall.opening", "Approve the subscription in the store sheet. StudyPlanner unlocks as soon as the store confirms it."));
      setBusy(null);
    } catch (error) {
      setBusy(null);
      setMessage(error instanceof Error ? error.message : paywallText("paywall.message_unavailable", "The store could not start the purchase."));
    }
  };

  const restore = async () => {
    setBusy("restore");
      setMessage(paywallText("paywall.restoring", "Checking your store account..."));
      try {
        const entitlement = await restoreStudyPlannerPurchases();
        if (entitlement.isPremium) {
          unlock(entitlement.productId, entitlement.checkedAt);
          maybeShowUnlockSuccess("restore_action");
        }
        else {
          setBusy(null);
          setMessage(paywallText("paywall.message_unavailable", "No active StudyPlanner subscription was found for this store account."));
      }
    } catch (error) {
      setBusy(null);
      setMessage(error instanceof Error ? error.message : paywallText("paywall.message_unavailable", "Restore could not be completed."));
    }
  };

  const selectedPlan = plans.find((plan) => plan.id === selected) || plans[0] || initialPlans[0];
  const importCandidates = currentImport?.candidates.filter((candidate) => candidate.approved) || [];
  const importSummary = {
    classes: importCandidates.filter((candidate) => candidate.kind === "class").length,
    assignments: importCandidates.filter((candidate) => candidate.kind === "task").length,
    exams: importCandidates.filter((candidate) => candidate.kind === "exam").length,
    firstAction: importCandidates.find((candidate) => candidate.kind === "task" || candidate.kind === "exam")?.title,
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close paywall" onPress={nav.back} style={{ position: "absolute", top: 56, right: 18, zIndex: 3, width: 44, height: 44, borderRadius: 999, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.hairline }}>
        <X color={theme.label} size={20} />
      </Pressable>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 68, paddingHorizontal: 20, paddingBottom: 34 }}>
        <RNImage source={require("./assets/icon.png")} style={{ width: 62, height: 62, borderRadius: 19, marginBottom: 18 }} />
        <Text selectable style={{ color: theme.label, fontSize: 36, lineHeight: 39, fontWeight: "900", marginBottom: 10 }}>{paywallText("paywall.title", "{name}, build your live semester.", { name: firstName })}</Text>
        <Text selectable style={{ color: theme.label2, fontSize: 16, lineHeight: 22, marginBottom: 20 }}>{currentImport ? paywallText("paywall.sub_import", "Your preview is ready. Unlock to apply it to the live dashboard, reminders, and widgets.") : paywallText("paywall.sub_no_import", "Unlock first, then scan to keep your semester visible across dashboard, widgets, reminders, and next moves.")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <Pressable onPress={busy ? undefined : restore} style={{ paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.surface2 }}><Text style={{ color: theme.accent, fontSize: 12, fontWeight: "900" }}>{textFor("common.restore", "Restore Purchases")}</Text></Pressable>
          <Pressable onPress={() => nav.push("terms")} style={{ paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.surface2 }}><Text style={{ color: theme.accent, fontSize: 12, fontWeight: "900" }}>{textFor("common.terms", "Terms")}</Text></Pressable>
          <Pressable onPress={() => nav.push("privacy")} style={{ paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.surface2 }}><Text style={{ color: theme.accent, fontSize: 12, fontWeight: "900" }}>{textFor("common.privacy", "Privacy")}</Text></Pressable>
          <Pressable onPress={() => openExternal(SUPPORT_URL)} style={{ paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.surface2 }}><Text style={{ color: theme.accent, fontSize: 12, fontWeight: "900" }}>{textFor("common.support", "Support")}</Text></Pressable>
        </View>
        <Card theme={theme} style={{ padding: 15, marginBottom: 14, backgroundColor: "#111114" }}>
          {currentImport ? (
            <View>
              <Text selectable style={{ color: "rgba(255,255,255,0.66)", fontSize: 12, fontWeight: "900", marginBottom: 10 }}>{paywallText("paywall.ready_apply", "READY TO APPLY")}</Text>
              <View style={{ flexDirection: "row", gap: 9, marginBottom: 12 }}>
                <View style={{ flex: 1 }}><Text selectable style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>{importSummary.classes}</Text><Text selectable style={{ color: "rgba(255,255,255,0.66)", fontSize: 12, fontWeight: "800" }}>{textFor("review.classes", "classes")}</Text></View>
                <View style={{ flex: 1 }}><Text selectable style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>{importSummary.assignments}</Text><Text selectable style={{ color: "rgba(255,255,255,0.66)", fontSize: 12, fontWeight: "800" }}>{textFor("review.assignments", "assignments")}</Text></View>
                <View style={{ flex: 1 }}><Text selectable style={{ color: "#fff", fontSize: 24, fontWeight: "900" }}>{importSummary.exams}</Text><Text selectable style={{ color: "rgba(255,255,255,0.66)", fontSize: 12, fontWeight: "800" }}>{textFor("review.exams", "exams")}</Text></View>
              </View>
              <Text selectable style={{ color: "#fff", fontSize: 17, lineHeight: 22, fontWeight: "900" }}>{importSummary.firstAction || textFor("review.title", "Review your imported semester")}</Text>
              <Text selectable style={{ color: "rgba(255,255,255,0.72)", marginTop: 4, lineHeight: 19 }}>{paywallText("paywall.sub_import", "Unlock to save this plan, schedule reminders, and sync widgets.")}</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
                <Icon name="lock" color="#fff" size={25} />
              </View>
              <View style={{ flex: 1 }}>
	                <Text selectable style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>{optionText(data.prefs.mainGoal || data.prefs.semesterGoal || "Everything")}</Text>
	                <Text selectable style={{ color: "rgba(255,255,255,0.7)", marginTop: 3, lineHeight: 19 }}>{optionText(data.prefs.studentType || data.prefs.studentPersona || "School semester")} · {textFor("option.everything", data.prefs.workloadStyle || "Balanced")} · {optionText(data.prefs.scanIntent || "Upload PDF")}</Text>
              </View>
            </View>
          )}
        </Card>
        <View style={{ gap: 10, marginBottom: 18 }}>
          {plans.map((plan) => {
            const on = selected === plan.id;
            return (
              <Pressable key={plan.id} onPress={() => setSelected(plan.id)}>
                <Card theme={theme} style={{ padding: 15, borderWidth: on ? 2 : 1, borderColor: on ? theme.accent : theme.hairline }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 26, height: 26, borderRadius: 99, borderWidth: on ? 0 : 2, borderColor: theme.label3, backgroundColor: on ? theme.accent : "transparent", alignItems: "center", justifyContent: "center" }}>
                      {on ? <Check color="#fff" size={16} strokeWidth={3} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
	                        <Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900" }}>{paywallText(plan.id.toLowerCase().includes("year") ? "paywall.yearly" : plan.id.toLowerCase().includes("week") ? "paywall.weekly" : "paywall.monthly", plan.cadence)}</Text>
                        {plan.recommended ? <Pill text={paywallText("paywall.best_value", "Best value")} color={COLORS.green} theme={theme} icon="star" /> : null}
                      </View>
	                      <Text selectable style={{ color: theme.label2, marginTop: 4 }}>{paywallText(plan.id.toLowerCase().includes("year") ? "paywall.benefit_apply" : "paywall.benefit_health", plan.description)}</Text>
                    </View>
                    <Text selectable style={{ color: theme.label, fontWeight: "900" }}>{plan.displayPrice}</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
        <Card theme={theme} style={{ padding: 15, backgroundColor: theme.dark ? "#18222A" : "#EEF7FF", marginBottom: 14 }}>
          {[
            ["file", paywallText("paywall.benefit_apply", "Apply your syllabus")],
            ["heart", paywallText("paywall.benefit_health", "Track Semester Health")],
            ["target", paywallText("paywall.benefit_exams", "Stay ahead of exams")],
            ["bell", paywallText("paywall.benefit_reminders", "Get reminder timing")],
            ["grid", paywallText("paywall.benefit_widgets", "Keep widgets current")],
          ].map(([icon, text]) => (
            <View key={text} style={{ flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 6 }}>
              <Icon name={icon} color={theme.accent} size={18} />
              <Text selectable style={{ color: theme.label, flex: 1, fontWeight: "800" }}>{text}</Text>
            </View>
          ))}
        </Card>
        <Text selectable style={{ color: theme.label2, lineHeight: 19, marginBottom: 10 }}>{message}</Text>
        <Button label={busy === "purchase" ? paywallText("paywall.opening", "Opening purchase sheet...") : storePlansReady ? paywallText("paywall.unlock", "Unlock {plan}", { plan: selectedPlan.cadence }) : paywallText("paywall.loading_price", "Loading store price")} theme={theme} icon="crown" onPress={busy || !storePlansReady ? undefined : purchase} />
        <Button label={busy === "restore" ? paywallText("paywall.restoring", "Restoring...") : textFor("common.restore", "Restore Purchases")} theme={theme} secondary icon="refresh" onPress={busy ? undefined : restore} />
        <Text selectable style={{ color: theme.label3, fontSize: 12, lineHeight: 17, marginTop: 14 }}>{paywallText("paywall.legal", "Auto-renewing subscription. Price and terms are shown by the store before purchase. Manage or cancel in your subscription settings.")}</Text>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 18, marginTop: 12 }}>
          <Pressable onPress={() => nav.push("terms")}><Text style={{ color: theme.accent, fontSize: 12, fontWeight: "900" }}>{textFor("common.terms", "Terms of Use")}</Text></Pressable>
          <Pressable onPress={() => nav.push("privacy")}><Text style={{ color: theme.accent, fontSize: 12, fontWeight: "900" }}>{textFor("common.privacy", "Privacy Policy")}</Text></Pressable>
          <Pressable onPress={() => openExternal(SUPPORT_URL)}><Text style={{ color: theme.accent, fontSize: 12, fontWeight: "900" }}>{textFor("common.support", "Support")}</Text></Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Today({ data, mutate, nav, theme, recordReviewTrigger }: ScreenProps) {
  const liveData = useMemo(() => activeSemesterData(data), [data]);
  const snapshot = useMemo(() => buildDashboardSnapshot(liveData), [liveData]);
  const semester = useMemo(() => buildSemesterSnapshot(liveData), [liveData]);
  const narrative = useMemo(() => buildSemesterNarrative(liveData, semester), [liveData, semester]);
  const loop = useMemo(() => buildSemesterLoop(liveData), [liveData]);
  const hasSemesterData = hasRealSemesterData(liveData);
  const activeTasks = liveData.tasks.filter((t) => !t.done);
  const dueNow = activeTasks.filter((t) => !t.missing && daysUntilTask(t) <= 0);
  const awaitingDate = activeTasks.filter((t) => t.missing).length;
  const upcomingAssessments = liveData.exams.slice().sort((a, b) => daysUntilExam(a) - daysUntilExam(b)).slice(0, 3);
  const insight = deadlineInsight(liveData);
  const risks = semester.riskFactors;
  const firstBlock = semester.schedulePlan.blocks.find((block) => !block.completed);
  const firstPulse = semester.classPulses[0];
  const firstPulseClass = safeClassFor(liveData, firstPulse?.classId);
  const preparedness = semester.semesterHealth.dimensions.preparedness;
  const todayTitle = previewText("user", snapshot.greeting);
  const timeline = useMemo(() => {
    const within30 = (iso: string) => {
      const days = Math.ceil((new Date(`${iso}T12:00:00`).getTime() - new Date().setHours(12, 0, 0, 0)) / 86400000);
      return days >= 0 && days <= 30;
    };
    return {
      assignments: liveData.tasks.filter((task) => !task.done && hasTaskDate(task) && within30(task.dueDate)).length,
      exams: liveData.exams.filter((exam) => within30(exam.dueDate)).length,
      pressureDays: semester.pressureForecast.weekLoads.filter((load) => load >= 64).length,
    };
  }, [liveData.tasks, liveData.exams, semester.pressureForecast.weekLoads]);
  const toggle = (id: string) => {
    const taskToToggle = liveData.tasks.find((item) => item.id === id);
    if (taskToToggle && !taskToToggle.done) recordReviewTrigger("assignment_completed");
    mutate((d) => {
    const task = d.tasks.find((item) => item.id === id);
    const tasks = d.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t);
    const updated = { ...d, tasks, studyBlocks: buildStudyPlan({ ...d, tasks }) };
    return withFeedback(d, updated, "completeTask", { classId: task?.classId, actionId: id, dimension: "workload" });
  });
  };

  if (!hasSemesterData) {
    return (
      <Screen theme={theme}>
        <Header title={todayTitle} sub={todayHeaderLabel()} theme={theme} right={<Pressable onPress={() => nav.tab("profile")}><View style={{ width: 42, height: 42, borderRadius: 99, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#fff", fontWeight: "900", fontSize: 17 }}>{userInitial(data)}</Text></View></Pressable>} />
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <SemesterHealthHero semester={semester} narrative={narrative} theme={theme} hasSemesterData={false} />
          <Card theme={theme} style={{ padding: 18, backgroundColor: "#111114" }}>
            <View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Icon name="scan" color="#FFFFFF" size={25} />
            </View>
            <Text selectable style={{ color: "rgba(255,255,255,0.62)", fontSize: 12, fontWeight: "900", marginBottom: 7 }}>{textFor("today.empty_kicker", "BUILD YOUR SEMESTER")}</Text>
            <Text selectable style={{ color: "#FFFFFF", fontSize: 26, lineHeight: 30, fontWeight: "900" }}>{textFor("today.empty_title", "Add a class or scan a syllabus.")}</Text>
            <Text selectable style={{ color: "rgba(255,255,255,0.72)", lineHeight: 20, marginTop: 8 }}>{textFor("locked.sub", "Build your semester first.")}</Text>
            <Button label={textFor("locked.scan", "Scan syllabus")} theme={theme} icon="scan" onPress={() => nav.tab("scan")} />
            <View style={{ flexDirection: "row", gap: 9 }}>
              <View style={{ flex: 1 }}>
                <Button label={textFor("classes.add", "Add class")} theme={theme} secondary icon="classes" onPress={() => nav.tab("classes")} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label={textFor("scan.paste_text", "Paste text")} theme={theme} secondary icon="file" onPress={() => nav.push("paste", { mode: "syllabus" })} />
              </View>
            </View>
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen theme={theme}>
      <Header title={todayTitle} sub={todayHeaderLabel()} theme={theme} right={<Pressable onPress={() => nav.tab("profile")}><View style={{ width: 42, height: 42, borderRadius: 99, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#fff", fontWeight: "900", fontSize: 17 }}>{userInitial(data)}</Text></View></Pressable>} />
      <View style={{ paddingHorizontal: 16, gap: 18 }}>
        <SemesterHealthHero semester={semester} narrative={narrative} theme={theme} hasSemesterData={hasSemesterData} />
        {semester.feedbackEvents[0] ? <FeedbackLoopCard event={semester.feedbackEvents[0]} theme={theme} /> : null}
        <Card theme={theme} style={{ padding: 18, backgroundColor: theme.dark ? "#17171C" : "#FFFFFF" }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${theme.accent}1C`, alignItems: "center", justifyContent: "center" }}><Sparkles color={theme.accent} size={21} /></View>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: theme.label, fontSize: 18, fontWeight: "900" }}>{textFor("today.next_move", "Next Move")}</Text>
              <Text selectable style={{ color: theme.label2, marginTop: 2 }}>{localizedNarrativeText("next", narrative.nextMoveLabel)}</Text>
            </View>
          </View>
          <View style={{ gap: 9 }}>
            <Pressable onPress={() => snapshot.nextClass ? nav.push("classDetail", { id: snapshot.nextClass.classId }) : nav.tab("classes")} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Icon name="classes" color={snapshot.nextClass?.color || COLORS.blue} size={18} />
              <Text selectable style={{ color: theme.label2, width: 86, fontWeight: "800" }}>{textFor("today.next_class", "Next class")}</Text>
              <Text selectable numberOfLines={1} style={{ color: theme.label, flex: 1, fontWeight: "900" }}>{snapshot.nextClass ? `${snapshot.nextClass.code} · ${new Date(snapshot.nextClass.startsAt).toLocaleTimeString(appLocale(), { hour: "numeric", minute: "2-digit" })}` : textFor("classes.add", "Add a class")}</Text>
            </Pressable>
            <Pressable onPress={() => snapshot.nearestDeadline ? nav.push("taskDetail", { id: snapshot.nearestDeadline.taskId }) : nav.tab("scan")} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Icon name="target" color={COLORS.orange} size={18} />
              <Text selectable style={{ color: theme.label2, width: 86, fontWeight: "800" }}>{textFor("today.deadline", "Deadline")}</Text>
              <Text selectable numberOfLines={1} style={{ color: theme.label, flex: 1, fontWeight: "900" }}>{snapshot.nearestDeadline ? `${snapshot.nearestDeadline.dueLabel} · ${snapshot.nearestDeadline.title}` : textFor("plan.clear_day", "No active deadline")}</Text>
            </Pressable>
            <Pressable onPress={() => firstBlock ? nav.push("studySession", { id: firstBlock.id }) : nav.tab("scan")} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Icon name="clock" color={COLORS.purple} size={18} />
              <Text selectable style={{ color: theme.label2, width: 86, fontWeight: "800" }}>{textFor("today.focus", "Focus")}</Text>
              <Text selectable numberOfLines={1} style={{ color: theme.label, flex: 1, fontWeight: "900" }}>{firstBlock ? `${firstBlock.time} · ${firstBlock.title}` : textFor("scan.quick_title", "Scan or quick add to plan")}</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", gap: 9, marginTop: 14 }}>
            <Pressable onPress={() => nav.tab("plan")} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10 }}><Text style={{ color: "#fff", fontWeight: "900" }}>{textFor("today.open_plan", "Open plan")}</Text></Pressable>
            <Pressable onPress={() => firstBlock ? nav.push("studySession", { id: firstBlock.id }) : nav.tab("scan")} style={{ backgroundColor: theme.surface2, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10 }}><Text style={{ color: theme.label, fontWeight: "900" }}>{firstBlock ? textFor("today.start_focus", "Start focus") : textFor("locked.scan", "Scan first")}</Text></Pressable>
          </View>
        </Card>
        {preparedness.score < 75 || !liveData.notes.length ? (
          <Pressable onPress={() => nav.tab("scan")}>
            <Card theme={theme} style={{ padding: 15, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.dark ? "#211E2B" : "#F7F0FF" }}>
              <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: `${COLORS.purple}20`, alignItems: "center", justifyContent: "center" }}><NotebookPen color={COLORS.purple} size={21} /></View>
              <View style={{ flex: 1 }}>
                <Text selectable style={{ color: theme.label, fontWeight: "900" }}>{localizedNarrativeText("notes", narrative.notesNudge)}</Text>
                <Text selectable numberOfLines={1} style={{ color: theme.label2, marginTop: 2 }}>{`${textFor("notes.title", "Notes")} / ${textFor("locked.preparedness", "Preparedness")} / ${textFor("class.pulse", "Class Pulse")}`}</Text>
              </View>
              <ChevronRight color={theme.label3} size={18} />
            </Card>
          </Pressable>
        ) : null}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Stat n={snapshot.nextClass ? 1 : 0} label={previewMetricLabel("nextClass", "next class")} icon="classes" color={COLORS.blue} theme={theme} />
          <Stat n={dueNow.length} label={previewMetricLabel("dueToday", "due today")} icon="target" color={COLORS.orange} theme={theme} />
          <Stat n={minutesLabel(snapshot.todayPressure.studyMinutes)} label={previewMetricLabel("studyToday", "study today")} icon="clock" color={COLORS.purple} theme={theme} />
        </View>
        {awaitingDate ? (
          <Pressable onPress={() => nav.push("tasks")}>
            <Card theme={theme} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.dark ? "#2A2018" : "#FFF7E8" }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: `${COLORS.orange}1F`, alignItems: "center", justifyContent: "center" }}><CalendarDays color={COLORS.orange} size={19} /></View>
              <View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{awaitingDate} item{awaitingDate === 1 ? "" : "s"} need dates</Text><Text selectable style={{ color: theme.label2, marginTop: 2 }}>They stay visible until you set real due dates.</Text></View>
              <ChevronRight color={theme.label3} size={18} />
            </Card>
          </Pressable>
        ) : null}
        <Card theme={theme} style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View>
              <Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 18 }}>{textFor("today.next_30", "Next 30 Days")}</Text>
              <Text selectable style={{ color: theme.label2, marginTop: 3 }}>{timeline.pressureDays ? `${timeline.pressureDays} ${previewMetricLabel("pressureLabel", "pressure")}` : previewMetricLabel("clear", "Clear runway")}</Text>
            </View>
            <Pill text={localizedNarrativeText("pressure", narrative.pressureLabel)} color={colorForState(semester.pressureForecast.colorState)} theme={theme} />
          </View>
          <View style={{ flexDirection: "row", gap: 9 }}>
            <MiniMetric value={timeline.assignments} label={previewMetricLabel("assignments", "assignments")} color={COLORS.orange} theme={theme} />
            <MiniMetric value={timeline.exams} label={previewMetricLabel("exams", "exams")} color={COLORS.purple} theme={theme} />
            <MiniMetric value={timeline.pressureDays} label={previewMetricLabel("pressureLabel", "pressure")} color={timeline.pressureDays ? COLORS.orange : COLORS.green} theme={theme} />
          </View>
        </Card>
        <Card theme={theme} style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
            <View style={{ width: 74, height: 74, borderRadius: 99, borderWidth: 8, borderColor: loop.status === "strained" ? COLORS.red : loop.status === "steady" ? COLORS.orange : COLORS.green, alignItems: "center", justifyContent: "center" }}>
              <Text selectable style={{ color: theme.label, fontSize: 22, fontWeight: "900" }}>{loop.score}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: theme.label, fontSize: 18, fontWeight: "900" }}>{localizedNarrativeText("pressure", narrative.pressureLabel)}</Text>
              <Text selectable style={{ color: theme.label2, marginTop: 4, lineHeight: 19 }}>{localizedNarrativeText("driver", narrative.primaryDriver)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
            {loop.rings.map((ring) => <View key={ring.label} style={{ flex: 1 }}><Text selectable style={{ color: ring.color, fontWeight: "900", fontSize: 12 }}>{ring.label}</Text><ProgressBar value={ring.value} color={ring.color} theme={theme} height={7} /></View>)}
          </View>
        </Card>
        <View>
          <Section title={textFor("today.risk_radar", "Risk Radar")} action={textFor("plan.rebuild", "Replan")} onAction={() => mutate((d) => ({ ...d, studyBlocks: buildStudyPlan(d) }))} theme={theme} />
          <View style={{ gap: 9 }}>{risks.slice(0, 3).map((risk) => (
            <Pressable key={risk.id} onPress={() => risk.taskId ? nav.push("taskDetail", { id: risk.taskId }) : risk.examId ? nav.push("assessmentDetail", { id: risk.examId }) : risk.classId ? nav.push("classDetail", { id: risk.classId }) : nav.tab("plan")}>
              <Card theme={theme} style={{ padding: 13, flexDirection: "row", gap: 12, alignItems: "center" }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: `${risk.color}20`, alignItems: "center", justifyContent: "center" }}><AlertTriangle color={risk.color} size={19} /></View>
                <View style={{ flex: 1 }}><Text selectable numberOfLines={1} style={{ color: theme.label, fontWeight: "900" }}>{risk.label}</Text><Text selectable numberOfLines={1} style={{ color: theme.label2 }}>{risk.detail}</Text></View>
                <Text selectable style={{ color: risk.color, fontWeight: "900" }}>{risk.score}</Text>
              </Card>
            </Pressable>
          ))}</View>
        </View>
        <View>
          <Section title={textFor("today.upcoming_deadlines", "Upcoming Deadlines")} action={textFor("notes.all", "All")} onAction={() => nav.push("tasks")} theme={theme} />
          <Card theme={theme} style={{ overflow: "hidden" }}>{activeTasks.slice().sort((a, b) => (a.missing ? -1 : b.missing ? 1 : daysUntilTask(a) - daysUntilTask(b))).slice(0, 3).map((t) => <TaskRow key={t.id} task={t} data={liveData} theme={theme} onToggle={() => toggle(t.id)} onOpen={() => nav.push("taskDetail", { id: t.id })} />)}</Card>
        </View>
        {upcomingAssessments.length ? (
          <View>
            <Section title={textFor("today.upcoming_assessments", "Upcoming Assessments")} action={`${upcomingAssessments.length}`} theme={theme} />
            <Card theme={theme} style={{ overflow: "hidden" }}>{upcomingAssessments.map((exam) => { const klass = safeClassFor(liveData, exam.classId); return <Pressable key={exam.id} onPress={() => nav.push("assessmentDetail", { id: exam.id })} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}><ClassGlyph c={klass} size={34} /><View style={{ flex: 1 }}><Text selectable numberOfLines={1} style={{ color: theme.label, fontWeight: "900" }}>{exam.title}</Text><Text selectable style={{ color: theme.label2 }}>{klass.code} · {localizedDueLabel(daysUntilExam(exam))} · {exam.time}</Text></View><Pill text={localizedExamKind(exam.kind)} color={COLORS.purple} theme={theme} /></Pressable>; })}</Card>
          </View>
        ) : null}
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#241E33" : "#F7F0FF" }}>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 }}><Icon name="sparkles" color={COLORS.purple} size={18} /><Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 16 }}>{insight.headline}</Text></View>
          <Text selectable style={{ color: theme.label, lineHeight: 21 }}>{insight.body}</Text>
          <View style={{ flexDirection: "row", gap: 9, marginTop: 13 }}>
            <Pressable onPress={() => nav.tab("plan")} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10 }}><Text style={{ color: "#fff", fontWeight: "900" }}>{previewText("viewPlan", "View plan")}</Text></Pressable>
            <Pressable onPress={() => {
              if (data.studyBlocks[0]) nav.push("studySession", { id: data.studyBlocks[0].id });
              else mutate((d) => ({ ...d, studyBlocks: buildStudyPlan(d) }));
            }} style={{ backgroundColor: theme.surface, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 10 }}><Text style={{ color: theme.label, fontWeight: "900" }}>{textFor("today.start_focus", "Start focus")}</Text></Pressable>
          </View>
        </Card>
        <Card theme={theme} style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <ClassGlyph c={firstPulseClass} size={42} />
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900" }}>{firstPulseClass.code} {textFor("class.forecast", "forecast")} · {localizedPulseText("forecast", firstPulse?.forecastLabel || "")}</Text>
              <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 3 }}>{localizedPulseText("reason", firstPulse?.reason || "Add grades, tasks, or notes for a tighter forecast.")}</Text>
            </View>
            <Pill text={localizedPulseText("mode", firstPulse?.mode || "unknown")} color={firstPulse ? colorForState(firstPulse.colorState) : theme.label2} theme={theme} />
          </View>
        </Card>
        <Card theme={theme} style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 17 }}>{textFor("today.next_30", "Pressure Forecast")}</Text>
            <Pill text={localizedNarrativeText("pressure", semester.pressureForecast.label)} color={colorForState(semester.pressureForecast.colorState)} theme={theme} />
          </View>
          <View style={{ flexDirection: "row", gap: 7 }}>{semester.pressureForecast.weekLoads.map((load, index) => <View key={`${load}${index}`} style={{ flex: 1, alignItems: "center", gap: 5 }}><View style={{ width: "100%", height: 46, borderRadius: 10, backgroundColor: theme.surface2, justifyContent: "flex-end", overflow: "hidden" }}><View style={{ height: `${Math.max(8, Math.min(100, load))}%`, backgroundColor: load > 85 ? COLORS.red : load > 64 ? COLORS.orange : load > 38 ? COLORS.yellow : COLORS.green }} /></View><Text style={{ color: theme.label2, fontSize: 11, fontWeight: "900" }}>{localizedWeekdayNarrow(index)}</Text></View>)}</View>
          {semester.pressureForecast.recoverySuggestion ? <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 10 }}>{localizedNarrativeText("detail", semester.pressureForecast.recoverySuggestion)}</Text> : null}
        </Card>
        <View>
          <Section title={previewText("classPulse", "Class Pulse")} action={previewText("classes", "Classes")} onAction={() => nav.tab("classes")} theme={theme} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 11 }}>{semester.classPulses.map((pulse) => { const c = safeClassFor(data, pulse.classId); return <Pressable key={c.id} onPress={() => nav.push("classDetail", { id: c.id })}><Card theme={theme} style={{ width: 158, padding: 13 }}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}><ClassGlyph c={c} size={34} /><View style={{ alignItems: "flex-end" }}><Text style={{ color: colorForState(pulse.colorState), fontWeight: "900" }}>{localizedPulseText("forecast", pulse.forecastLabel)}</Text><Text style={{ color: theme.label2, fontSize: 10, fontWeight: "900" }}>{localizedPulseText("trend", pulse.trend)}</Text></View></View><Text selectable numberOfLines={1} style={{ color: theme.label, fontWeight: "900" }}>{c.code}</Text><Text selectable numberOfLines={2} style={{ color: theme.label2, marginTop: 2, minHeight: 34 }}>{localizedPulseText("reason", pulse.reason)}</Text><Text selectable numberOfLines={1} style={{ color: colorForState(pulse.colorState), marginTop: 9, fontWeight: "800" }}>{localizedPulseText("nudge", pulse.nudge)}</Text></Card></Pressable>; })}</ScrollView>
        </View>
        <View>
          <Section title={textFor("today.notes_activity", "Notes Activity")} action={previewText("allNotes", "All notes")} onAction={() => nav.push("notes")} theme={theme} />
          <View style={{ gap: 10 }}>{data.notes.slice(0, 2).map((n) => <NoteCard key={n.id} note={n} data={data} theme={theme} onOpen={() => nav.push("noteDetail", { id: n.id })} />)}</View>
        </View>
      </View>
    </Screen>
  );
}

function Stat({ n, label, icon, color, theme }: { n: string | number; label: string; icon: string; color: string; theme: ReturnType<typeof palette> }) {
  return <Card theme={theme} style={{ flex: 1, padding: 13 }}><Icon name={icon} color={color} size={18} /><Text selectable style={{ color: theme.label, fontSize: 24, fontWeight: "900", marginTop: 7 }}>{n}</Text><Text selectable numberOfLines={1} style={{ color: theme.label2, fontSize: 12 }}>{label}</Text></Card>;
}

function MiniMetric({ value, label, color, theme }: { value: string | number; label: string; color: string; theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ flex: 1, borderRadius: 16, backgroundColor: theme.surface2, padding: 12 }}>
      <Text selectable style={{ color, fontSize: 23, fontWeight: "900" }}>{value}</Text>
      <Text selectable numberOfLines={1} style={{ color: theme.label2, fontSize: 12, fontWeight: "800", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle as any);

function HealthRing({ score, color, theme, size = 122 }: { score: number; color: string; theme: ReturnType<typeof palette>; size?: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: Math.max(0, Math.min(100, score)),
      duration: 760,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, score]);
  const dashOffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <SvgCircle cx={size / 2} cy={size / 2} r={radius} stroke={theme.surface2} strokeWidth={stroke} fill="none" />
        <AnimatedSvgCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset as any}
        />
      </Svg>
      <Text selectable style={{ color: theme.label, fontSize: size > 100 ? 31 : 22, lineHeight: size > 100 ? 35 : 26, fontWeight: "900" }}>{score}</Text>
      <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "800" }}>{textFor("health.score", "score")}</Text>
    </View>
  );
}

function SemesterHealthHero({ semester, narrative, theme, hasSemesterData = true }: { semester: ReturnType<typeof buildSemesterSnapshot>; narrative: ReturnType<typeof buildSemesterNarrative>; theme: ReturnType<typeof palette>; hasSemesterData?: boolean }) {
  const statusColor = colorForState(narrative.colorState);
  const dims = narrative.dimensions;
  if (!hasSemesterData) {
    return (
      <Card theme={theme} style={{ padding: 20, backgroundColor: theme.surface }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "900", marginBottom: 4 }}>{textFor("locked.health", "SEMESTER HEALTH")}</Text>
            <Text selectable style={{ color: theme.label, fontSize: 31, lineHeight: 34, fontWeight: "900" }}>{textFor("locked.scan", "Scan syllabus")}</Text>
            <Text selectable style={{ color: theme.label2, fontSize: 15, lineHeight: 20, marginTop: 5, fontWeight: "900" }}>{textFor("health.no_semester", "No semester loaded.")}</Text>
          </View>
          <Pill text={textFor("health.start_here", "Start here")} color={theme.accent} theme={theme} />
        </View>
        <View style={{ flexDirection: "row", gap: 18, alignItems: "center" }}>
          <HealthRing score={0} color={theme.accent} theme={theme} />
          <View style={{ flex: 1, gap: 9 }}>
            {[textFor("locked.workload", "Workload"), textFor("locked.grades", "Grades"), textFor("locked.preparedness", "Preparedness"), textFor("locked.consistency", "Consistency")].map((label) => (
              <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: label === "Consistency" ? 0 : 1, borderBottomColor: theme.hairline }}>
                <Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 13 }}>{label}</Text>
                <Text selectable style={{ color: theme.label3, fontWeight: "900", fontSize: 13 }}>--</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ marginTop: 16, padding: 13, borderRadius: 16, backgroundColor: theme.surface2 }}>
          <Text selectable style={{ color: theme.label, fontWeight: "900" }}>{textFor("today.next_move", "Next Move")}</Text>
          <Text selectable style={{ color: theme.accent, lineHeight: 20, marginTop: 4, fontWeight: "900" }}>{textFor("locked.scan", "Scan syllabus")}</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 4 }}>{textFor("locked.sub", "Build your semester first.")}</Text>
        </View>
      </Card>
    );
  }
  return (
    <Card theme={theme} style={{ padding: 20, backgroundColor: theme.surface }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "900", marginBottom: 4 }}>{textFor("locked.health", "SEMESTER HEALTH")}</Text>
          <Text selectable style={{ color: theme.label, fontSize: 31, lineHeight: 34, fontWeight: "900" }}>{localizedNarrativeText("state", narrative.state)}</Text>
          <Text selectable style={{ color: statusColor, fontSize: 15, lineHeight: 20, marginTop: 5, fontWeight: "900" }}>{localizedNarrativeText("driver", narrative.primaryDriver)}</Text>
        </View>
        <Pill text={localizedNarrativeText("health", narrative.healthLabel)} color={statusColor} theme={theme} />
      </View>
      <View style={{ flexDirection: "row", gap: 18, alignItems: "center" }}>
        <HealthRing score={semester.semesterHealth.overallScore} color={statusColor} theme={theme} />
        <View style={{ flex: 1, gap: 10 }}>
          {dims.map((dim) => (
            <View key={dim.key}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 13 }}>{dim.trend} {textFor(`locked.${dim.key}`, dim.label)}</Text>
                <Text selectable style={{ color: colorForState(dim.colorState), fontWeight: "900", fontSize: 13 }}>{dim.score}</Text>
              </View>
              <ProgressBar value={dim.score / 100} color={colorForState(dim.colorState)} theme={theme} height={7} />
            </View>
          ))}
        </View>
      </View>
      <View style={{ marginTop: 16, padding: 13, borderRadius: 16, backgroundColor: theme.surface2 }}>
        <Text selectable style={{ color: theme.label, fontWeight: "900" }}>{textFor("today.next_move", "Next Move")}</Text>
        <Text selectable style={{ color: statusColor, lineHeight: 20, marginTop: 4, fontWeight: "900" }}>{localizedNarrativeText("next", narrative.nextMoveLabel)}</Text>
        <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 4 }}>{localizedNarrativeText("detail", narrative.nextMoveDetail)}</Text>
      </View>
    </Card>
  );
}

function FeedbackLoopCard({ event, theme }: { event: FeedbackEvent; theme: ReturnType<typeof palette> }) {
  const positive = event.delta >= 0;
  const color = positive ? COLORS.green : COLORS.orange;
  const dimension = event.dimension || "semester";
  const before = event.dimension ? event.before[event.dimension] : event.before.semesterHealth;
  const after = event.dimension ? event.after[event.dimension] : event.after.semesterHealth;
  const reviewEligible = positive && (event.action === "importSyllabus" || event.action === "completeStudyBlock" || event.delta >= 3);
  return (
    <Card theme={theme} style={{ padding: 15, borderColor: `${color}55`, backgroundColor: theme.dark ? "#172019" : positive ? "#F1FFF6" : "#FFF8EF" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: `${color}22`, alignItems: "center", justifyContent: "center" }}>
          <Icon name={positive ? "check" : "refresh"} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text selectable style={{ color: theme.label, fontWeight: "900" }}>Impact</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 2 }}>{event.message}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text selectable style={{ color, fontSize: 18, fontWeight: "900" }}>{before}{" -> "}{after}</Text>
          <Text selectable style={{ color: theme.label2, fontSize: 11, fontWeight: "800" }}>{dimension}</Text>
        </View>
      </View>
      {reviewEligible ? (
        <Pressable onPress={() => openExternal(APP_STORE_REVIEW_URL)} style={{ marginTop: 12, alignSelf: "flex-start", borderRadius: 999, backgroundColor: "#FFFFFF", paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1, borderColor: `${color}33` }}>
          <Text style={{ color: theme.label, fontWeight: "900" }}>Review StudyPlanner</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

function classPulse(data: AppData, c: ClassItem) {
  const semesterPulse = buildSemesterSnapshot(data).classPulses.find((item) => item.classId === c.id);
  const pulse = buildClassPulseBreakdowns(data).find((item) => item.classId === c.id);
  const active = data.tasks.filter((task) => task.classId === c.id && !task.done);
  const nextExam = data.exams.filter((exam) => exam.classId === c.id).sort((a, b) => daysUntilExam(a) - daysUntilExam(b))[0];
  return {
    score: semesterPulse?.forecastScore || pulse?.score || Math.round(c.health * 100),
    label: localizedPulseText("forecast", semesterPulse?.forecastLabel || pulse?.label || "On track"),
    nextMove: localizedPulseText("nudge", semesterPulse?.nudge || pulse?.nextMove || "Add a review block"),
    active: active.length,
    nextExam,
    causes: semesterPulse ? [localizedPulseText("reason", semesterPulse.reason)] : (pulse?.causes || []).map((cause) => localizedPulseText("reason", cause)),
    colorState: semesterPulse?.colorState || "blue",
    mode: localizedPulseText("mode", semesterPulse?.mode || "estimated"),
  };
}

function Classes({ data, mutate, nav, theme }: ScreenProps) {
  const liveData = useMemo(() => activeSemesterData(data), [data]);
  const semester = buildSemesterSnapshot(liveData);
  const sortedClasses = semester.classPulses.map((pulse) => liveData.classes.find((klass) => klass.id === pulse.classId)).filter(Boolean) as ClassItem[];
  const archivedClasses = data.classes.filter((klass) => klass.archivedAt);
  const [adding, setAdding] = useState(!liveData.classes.length);
  const [draft, setDraft] = useState({
    code: "",
    name: "",
    professor: "",
    room: "",
    days: "Mon Wed",
    time: "10:00 AM",
    notes: "",
  });
  const createClass = () => {
    const code = draft.code.trim() || draft.name.trim() || "New Class";
    const name = draft.name.trim() || code;
    const [color, color2] = classColors(data.classes.length);
    const klass: ClassItem = {
      id: makeOwnershipId("class"),
      code,
      name,
      professor: draft.professor.trim() || textFor("class.professor", "Professor"),
      room: draft.room.trim() || previewFixtureText("roomTbd", "Room TBD"),
      days: draft.days.trim() || previewFixtureText("daysTbd", "Days TBD"),
      time: draft.time.trim() || previewFixtureText("timeTbd", "Time TBD"),
      next: textFor("today.next_class", "Next meeting"),
      health: 0.72,
      grade: previewFixtureText("tbd", "Not set"),
      color,
      color2,
      icon: "book-open",
      notes: draft.notes.trim(),
    };
    mutate((current) => ({ ...current, classes: [...current.classes, klass], prefs: { ...current.prefs, osLive: true } }));
    setDraft({ code: "", name: "", professor: "", room: "", days: previewFixtureText("daysMw", "Mon Wed"), time: "10:00 AM", notes: "" });
    setAdding(false);
  };
  const restoreClass = (id: string) => mutate((current) => ({ ...current, classes: current.classes.map((klass) => klass.id === id ? { ...klass, archivedAt: undefined } : klass), studyBlocks: buildStudyPlan({ ...current, classes: current.classes.map((klass) => klass.id === id ? { ...klass, archivedAt: undefined } : klass) }) }));
  return (
    <Screen theme={theme}>
      <Header title={textFor("classes.title", "Manage Semester")} sub={`${liveData.classes.length} ${textFor("profile.active_semester", "active")} · ${archivedClasses.length} ${textFor("classes.archived", "archived")}`} theme={theme} right={<Pressable onPress={() => setAdding((value) => !value)} style={{ width: 42, height: 42, borderRadius: 99, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }}><Plus color="#fff" size={21} strokeWidth={3} /></Pressable>} />
      <View style={{ paddingHorizontal: 16, gap: 13 }}>
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#18222A" : "#EEF7FF" }}>
          <Text selectable style={{ color: theme.label, fontSize: 18, fontWeight: "900" }}>{textFor("classes.truth", "Single source of truth")}</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 5 }}>{textFor("classes.truth_body", "Fix imports, add missing work, drop classes, and keep Today, Plan, reminders, and widgets aligned.")}</Text>
          <View style={{ flexDirection: "row", gap: 9, marginTop: 10 }}>
            <View style={{ flex: 1 }}><Button label={textFor("classes.add", "Add class")} theme={theme} icon="plus" onPress={() => setAdding(true)} /></View>
            <View style={{ flex: 1 }}><Button label={textFor("classes.import", "Import")} theme={theme} secondary icon="scan" onPress={() => nav.tab("scan")} /></View>
          </View>
        </Card>
        {adding ? (
          <Card theme={theme} style={{ padding: 16 }}>
            <Text selectable style={{ color: theme.label, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>{textFor("classes.add_manual", "Add class manually")}</Text>
            <FieldInput label={textFor("class.code", "Code")} value={draft.code} onChangeText={(code) => setDraft((current) => ({ ...current, code }))} placeholder="BIO 101" theme={theme} />
            <FieldInput label={textFor("class.name", "Name")} value={draft.name} onChangeText={(name) => setDraft((current) => ({ ...current, name }))} placeholder={textFor("class.name", "Biology")} theme={theme} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><FieldInput label={textFor("class.days", "Days")} value={draft.days} onChangeText={(days) => setDraft((current) => ({ ...current, days }))} placeholder={previewFixtureText("daysMw", "Mon Wed")} theme={theme} /></View>
              <View style={{ flex: 1 }}><FieldInput label={textFor("class.time", "Time")} value={draft.time} onChangeText={(time) => setDraft((current) => ({ ...current, time }))} placeholder="10:00 AM" theme={theme} /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><FieldInput label={textFor("assessment.room", "Room")} value={draft.room} onChangeText={(room) => setDraft((current) => ({ ...current, room }))} placeholder={previewFixtureText("roomTbd", "Room TBD")} theme={theme} /></View>
              <View style={{ flex: 1 }}><FieldInput label={textFor("class.professor", "Professor")} value={draft.professor} onChangeText={(professor) => setDraft((current) => ({ ...current, professor }))} placeholder={textFor("class.professor", "Professor")} theme={theme} /></View>
            </View>
            <FieldInput label={textFor("class.notes_label", "Notes")} value={draft.notes} onChangeText={(notes) => setDraft((current) => ({ ...current, notes }))} placeholder={textFor("class.notes_label", "Notes")} theme={theme} />
            <Button label={textFor("class.create", "Create class")} theme={theme} icon="classes" onPress={createClass} />
            <Button label={textFor("common.cancel", "Cancel")} theme={theme} secondary onPress={() => setAdding(false)} />
          </Card>
        ) : null}
        {!sortedClasses.length ? (
          <Card theme={theme} style={{ padding: 18 }}>
            <Text selectable style={{ color: theme.label, fontSize: 21, lineHeight: 25, fontWeight: "900" }}>{textFor("classes.empty_title", "No active classes yet.")}</Text>
            <Text selectable style={{ color: theme.label2, lineHeight: 21, marginTop: 6 }}>{textFor("classes.empty_body", "Start manually if the syllabus is missing, unreadable, or wrong. You can import later and merge the useful rows.")}</Text>
            <Button label={textFor("classes.add_manual", "Add class manually")} theme={theme} icon="plus" onPress={() => setAdding(true)} />
          </Card>
        ) : null}
        {sortedClasses.map((c) => (
        <Pressable key={c.id} onPress={() => nav.push("classDetail", { id: c.id })}>
          {(() => {
            const pulse = classPulse(liveData, c);
            const pulseColor = colorForState(pulse.colorState as any);
            return (
          <Card theme={theme} style={{ overflow: "hidden" }}>
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 13 }}>
                <ClassGlyph c={c} size={46} />
                <View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900" }}>{c.code}</Text><Text selectable numberOfLines={1} style={{ color: theme.label2 }}>{c.name}</Text></View>
                <View style={{ alignItems: "flex-end" }}><Text selectable style={{ color: pulseColor, fontSize: 24, fontWeight: "900" }}>{pulse.label}</Text><Text selectable style={{ color: theme.label2, fontSize: 11, fontWeight: "900" }}>{pulse.mode}</Text></View>
              </View>
              <ProgressBar value={pulse.score / 100} color={pulseColor} theme={theme} height={7} />
              <View style={{ gap: 5, marginTop: 12, marginBottom: 12 }}><Text selectable numberOfLines={2} style={{ color: theme.label2, lineHeight: 19 }}>{pulse.causes[0]}</Text><Text selectable numberOfLines={1} style={{ color: pulseColor, fontWeight: "900" }}>{pulse.nextMove}</Text></View>
              <View style={{ flexDirection: "row", gap: 8 }}><Pill text={`${liveData.tasks.filter((t) => t.classId === c.id && !t.done).length} ${textFor("class.due", "due")}`} color={COLORS.orange} theme={theme} /><Pill text={`${liveData.exams.filter((e) => e.classId === c.id).length} ${textFor("review.exams", "exam")}`} color={COLORS.purple} theme={theme} /><Pill text={`${liveData.notes.filter((n) => n.classId === c.id).length} ${textFor("notes.title", "notes")}`} theme={theme} /></View>
            </View>
          </Card>
            );
          })()}
        </Pressable>
      ))}
      {archivedClasses.length ? (
        <View>
          <Section title={textFor("classes.archived", "Archived")} action={`${archivedClasses.length}`} theme={theme} />
          <Card theme={theme} style={{ overflow: "hidden" }}>{archivedClasses.map((klass) => (
            <View key={klass.id} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12, opacity: 0.75 }}>
              <ClassGlyph c={klass} size={34} />
              <View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{klass.code}</Text><Text selectable style={{ color: theme.label2 }}>{klass.name}</Text></View>
              <Pressable onPress={() => restoreClass(klass.id)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.surface2 }}><Text style={{ color: theme.accent, fontWeight: "900" }}>{textFor("common.restore", "Restore")}</Text></Pressable>
            </View>
          ))}</Card>
        </View>
      ) : null}
      </View>
    </Screen>
  );
}

function ClassDetail({ data, mutate, nav, theme, params }: ScreenProps) {
  const c = data.classes.find((item) => item.id === params.id);
  if (!c) return <RecoveryScreen title={textFor("class.not_found", "Class not found")} body={textFor("class.not_found_body", "That class is not in this semester anymore.")} action={textFor("class.open_dashboard", "Open dashboard")} nav={nav} theme={theme} />;
  const tasks = data.tasks.filter((t) => t.classId === c.id && !t.done);
  const exams = data.exams.filter((e) => e.classId === c.id);
  const notes = data.notes.filter((n) => n.classId === c.id);
  const pulse = classPulse(data, c);
  const [editing, setEditing] = useState(params.edit === "1");
  const [addingWork, setAddingWork] = useState<"assignment" | "exam" | null>(null);
  const [classDraft, setClassDraft] = useState({
    code: c.code,
    name: c.name,
    professor: c.professor,
    room: c.room,
    days: c.days,
    time: c.time,
    color: c.color,
    icon: c.icon,
    notes: c.notes || "",
  });
  const [workDraft, setWorkDraft] = useState({
    title: "",
    dueDate: "",
    time: "11:59 PM",
    type: textFor("class.assignment", "Assignment"),
    effort: "45",
    priority: previewFixtureText("medium", "Medium"),
    description: "",
    recurring: false,
  });
  const toggle = (id: string) => mutate((d) => {
    const tasksNext = d.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t);
    return withFeedback(d, { ...d, tasks: tasksNext }, "completeTask", { classId: c.id, actionId: id, dimension: "grades" });
  });
  const saveClass = () => {
    mutate((d) => {
      const classes = d.classes.map((klass) => klass.id === c.id ? { ...klass, ...classDraft, updatedAt: new Date().toISOString(), userEditedAt: new Date().toISOString() } as ClassItem : klass);
      return { ...d, classes, studyBlocks: buildStudyPlan({ ...d, classes }) };
    });
    setEditing(false);
  };
  const archiveClass = () => Alert.alert(textFor("class.archive_title", "Archive class?"), textFor("class.archive_body", "{code} will leave Today, Plan, reminders, and widgets. Its work stays recoverable from Manage Semester.", { code: c.code }), [
    { text: textFor("common.cancel", "Cancel"), style: "cancel" },
    { text: textFor("common.archive", "Archive"), style: "destructive", onPress: () => {
      mutate((d) => ({ ...d, classes: d.classes.map((klass) => klass.id === c.id ? { ...klass, archivedAt: new Date().toISOString() } : klass), studyBlocks: buildStudyPlan(activeSemesterData({ ...d, classes: d.classes.map((klass) => klass.id === c.id ? { ...klass, archivedAt: new Date().toISOString() } : klass) })) }));
      nav.tab("classes");
    } },
  ]);
  const deleteClass = () => Alert.alert(textFor("class.delete_title", "Delete class permanently?"), textFor("class.delete_body", "This deletes {code}, {tasks} open assignments, {exams} exams, notes, reminders, and study blocks for this class. Archive is safer.", { code: c.code, tasks: tasks.length, exams: exams.length }), [
    { text: textFor("common.cancel", "Cancel"), style: "cancel" },
    { text: textFor("class.archive_instead", "Archive instead"), onPress: archiveClass },
    { text: textFor("common.delete", "Delete"), style: "destructive", onPress: () => {
      mutate((d) => {
        const next = {
          ...d,
          classes: d.classes.filter((klass) => klass.id !== c.id),
          tasks: d.tasks.filter((task) => task.classId !== c.id),
          exams: d.exams.filter((exam) => exam.classId !== c.id),
          notes: d.notes.filter((note) => note.classId !== c.id),
          reminders: d.reminders.filter((reminder) => reminder.classId !== c.id),
          studyBlocks: d.studyBlocks.filter((block) => block.classId !== c.id),
        };
        return { ...next, studyBlocks: buildStudyPlan(next) };
      });
      nav.tab("classes");
    } },
  ]);
  const createWork = () => {
    const dueDate = workDraft.dueDate.trim();
    const missingDate = !/^\d{4}-\d{2}-\d{2}$/.test(dueDate);
    if (addingWork === "exam") {
      const exam = {
        id: makeOwnershipId("exam"),
        classId: c.id,
        title: workDraft.title.trim() || workDraft.type,
        dueOffset: 0,
        dueDate: missingDate ? isoFromOffset(0) : dueDate,
        time: workDraft.time.trim() || "9:00 AM",
        room: c.room,
        kind: workDraft.type as any,
        description: workDraft.description.trim(),
        topics: workDraft.description.trim() ? [workDraft.description.trim()] : ["Confirm topics"],
      };
      mutate((d) => ({ ...d, exams: [exam, ...d.exams], studyBlocks: buildStudyPlan({ ...d, exams: [exam, ...d.exams] }) }));
    } else {
      const baseDate = missingDate ? isoFromOffset(0) : dueDate;
      const recurringId = workDraft.recurring ? makeOwnershipId("recurring") : undefined;
      const count = workDraft.recurring ? 12 : 1;
      const tasksToAdd = Array.from({ length: count }, (_item, index): TaskItem => {
        const date = new Date(`${baseDate}T12:00:00`);
        date.setDate(date.getDate() + index * 7);
        const dateText = date.toISOString().slice(0, 10);
        return {
          id: makeOwnershipId("task"),
          title: workDraft.title.trim() || (workDraft.recurring ? textFor("class.weekly_discussion", "Weekly discussion") : textFor("class.new_assignment", "New assignment")),
          classId: c.id,
          type: workDraft.type.trim() || textFor("class.assignment", "Assignment"),
          dueOffset: 0,
          dueDate: missingDate ? isoFromOffset(0) : dateText,
          time: workDraft.time.trim() || "11:59 PM",
          estimateMinutes: Math.max(5, Number(workDraft.effort) || 45),
          done: false,
          urgent: workDraft.priority === "High" || workDraft.priority === previewFixtureText("high", "High"),
          priority: workDraft.priority as TaskItem["priority"],
          description: workDraft.description.trim(),
          source: workDraft.recurring ? `${textFor("review.manual", "Manual")} · ${textFor("task.repeats_weekly", "weekly")}` : textFor("review.manual", "Manual"),
          recurringId,
          recurrenceIndex: workDraft.recurring ? index : undefined,
          recurrenceEndDate: workDraft.recurring ? addDaysLocal(baseDate, 77) : undefined,
          missing: missingDate,
          subtasks: workDraft.description.trim() ? [{ title: workDraft.description.trim(), done: false }] : [],
        };
      });
      mutate((d) => ({ ...d, tasks: [...tasksToAdd, ...d.tasks], studyBlocks: buildStudyPlan({ ...d, tasks: [...tasksToAdd, ...d.tasks] }) }));
    }
    setWorkDraft({ title: "", dueDate: "", time: "11:59 PM", type: textFor("class.assignment", "Assignment"), effort: "45", priority: previewFixtureText("medium", "Medium"), description: "", recurring: false });
    setAddingWork(null);
  };
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingTop: 58, paddingHorizontal: 20, paddingBottom: 22, backgroundColor: c.color }}>
          <Pressable onPress={nav.back} style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: "rgba(255,255,255,.24)", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><ChevronLeft color="#fff" /></Pressable>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}><View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: "rgba(255,255,255,.22)", alignItems: "center", justifyContent: "center" }}><Icon name={c.icon} color="#fff" size={28} /></View><View><Text selectable style={{ color: "#fff", fontSize: 29, fontWeight: "900" }}>{c.code}</Text><Text selectable style={{ color: "rgba(255,255,255,.9)", fontWeight: "800" }}>{c.name}</Text></View></View>
          <View style={{ flexDirection: "row", gap: 18, marginTop: 20 }}>{[{ l: textFor("class.forecast", "Forecast"), v: pulse.label }, { l: textFor("class.pulse", "Pulse"), v: pulse.score }, { l: textFor("class.due", "Due"), v: tasks.length }, { l: textFor("class.exams", "Exams"), v: exams.length }].map((s) => <View key={s.l}><Text selectable style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>{s.v}</Text><Text selectable style={{ color: "rgba(255,255,255,.84)", fontSize: 12, fontWeight: "800" }}>{s.l}</Text></View>)}</View>
        </View>
        <View style={{ padding: 16, gap: 16 }}>
          <Card theme={theme} style={{ padding: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 16 }}>{textFor("class.schedule", "Schedule")}</Text>
              <Pressable onPress={() => setEditing((value) => !value)} style={{ paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: theme.surface2 }}><Text style={{ color: theme.accent, fontWeight: "900" }}>{editing ? textFor("common.close", "Close") : textFor("common.edit", "Edit")}</Text></Pressable>
            </View>
            <Text selectable style={{ color: theme.label2, marginTop: 4, lineHeight: 20 }}>{c.days} · {c.time} · {c.room}</Text>
            <Text selectable style={{ color: theme.label2, marginTop: 3 }}>{c.professor}</Text>
            {c.notes ? <Text selectable style={{ color: theme.label2, marginTop: 8, lineHeight: 19 }}>{c.notes}</Text> : null}
          </Card>
          {editing ? (
            <Card theme={theme} style={{ padding: 16 }}>
              <Text selectable style={{ color: theme.label, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>{textFor("common.edit", "Edit")}</Text>
              <FieldInput label={textFor("class.code", "Code")} value={classDraft.code} onChangeText={(code) => setClassDraft((current) => ({ ...current, code }))} theme={theme} />
              <FieldInput label={textFor("class.name", "Name")} value={classDraft.name} onChangeText={(name) => setClassDraft((current) => ({ ...current, name }))} theme={theme} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}><FieldInput label={textFor("class.days", "Days")} value={classDraft.days} onChangeText={(days) => setClassDraft((current) => ({ ...current, days }))} theme={theme} /></View>
                <View style={{ flex: 1 }}><FieldInput label={textFor("class.time", "Time")} value={classDraft.time} onChangeText={(time) => setClassDraft((current) => ({ ...current, time }))} theme={theme} /></View>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}><FieldInput label={textFor("assessment.room", "Room")} value={classDraft.room} onChangeText={(room) => setClassDraft((current) => ({ ...current, room }))} theme={theme} /></View>
                <View style={{ flex: 1 }}><FieldInput label={textFor("class.professor", "Professor")} value={classDraft.professor} onChangeText={(professor) => setClassDraft((current) => ({ ...current, professor }))} theme={theme} /></View>
              </View>
            <FieldInput label={textFor("class.notes_label", "Notes")} value={classDraft.notes} onChangeText={(notes) => setClassDraft((current) => ({ ...current, notes }))} theme={theme} multiline />
              <View style={{ flexDirection: "row", gap: 9 }}>
                <View style={{ flex: 1 }}><Button label={textFor("common.save", "Save")} theme={theme} icon="target" onPress={saveClass} /></View>
                <View style={{ flex: 1 }}><Button label={textFor("common.archive", "Archive")} theme={theme} secondary icon="archive" onPress={archiveClass} /></View>
              </View>
              <Button label={textFor("common.delete", "Delete")} theme={theme} secondary icon="trash" onPress={deleteClass} />
            </Card>
          ) : null}
          <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#18222A" : "#EEF7FF" }}>
            <Text selectable style={{ color: theme.label, fontSize: 18, fontWeight: "900" }}>{textFor("class.add_work", "Add missing work")}</Text>
            <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 5 }}>{textFor("class.add_work_body", "Add a surprise quiz, recurring discussion, project, or undated assignment without re-importing.")}</Text>
            <View style={{ flexDirection: "row", gap: 9, marginTop: 10 }}>
              <View style={{ flex: 1 }}><Button label={textFor("class.assignment", "Assignment")} theme={theme} icon="plus" onPress={() => { setAddingWork("assignment"); setWorkDraft((current) => ({ ...current, type: textFor("class.assignment", "Assignment") })); }} /></View>
              <View style={{ flex: 1 }}><Button label={textFor("class.assessment", "Assessment")} theme={theme} secondary icon="flask-conical" onPress={() => { setAddingWork("exam"); setWorkDraft((current) => ({ ...current, type: textFor("class.assessment", "Exam"), time: "9:00 AM" })); }} /></View>
            </View>
          </Card>
          {addingWork ? (
            <Card theme={theme} style={{ padding: 16 }}>
              <Text selectable style={{ color: theme.label, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>{addingWork === "exam" ? textFor("class.add_assessment", "Add assessment") : textFor("class.add_assignment", "Add assignment")}</Text>
              <FieldInput label={textFor("class.title", "Title")} value={workDraft.title} onChangeText={(title) => setWorkDraft((current) => ({ ...current, title }))} placeholder={addingWork === "exam" ? textFor("class.assessment", "Quiz") : textFor("class.weekly_discussion", "Weekly discussion")} theme={theme} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}><FieldInput label={textFor("task.due", "Due date")} value={workDraft.dueDate} onChangeText={(dueDate) => setWorkDraft((current) => ({ ...current, dueDate }))} placeholder="YYYY-MM-DD" theme={theme} /></View>
                <View style={{ flex: 1 }}><FieldInput label={textFor("class.time", "Time")} value={workDraft.time} onChangeText={(time) => setWorkDraft((current) => ({ ...current, time }))} theme={theme} /></View>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}><FieldInput label={textFor("assessment.type", "Type")} value={workDraft.type} onChangeText={(type) => setWorkDraft((current) => ({ ...current, type }))} placeholder={addingWork === "exam" ? textFor("class.assessment", "Exam") : textFor("class.assignment", "Assignment")} theme={theme} /></View>
                {addingWork === "assignment" ? <View style={{ flex: 1 }}><FieldInput label={textFor("class.effort", "Effort")} value={workDraft.effort} onChangeText={(effort) => setWorkDraft((current) => ({ ...current, effort }))} placeholder="45" theme={theme} /></View> : null}
              </View>
              <FieldInput label={textFor("class.description", "Description")} value={workDraft.description} onChangeText={(description) => setWorkDraft((current) => ({ ...current, description }))} theme={theme} multiline />
              {addingWork === "assignment" ? (
                <Pressable onPress={() => setWorkDraft((current) => ({ ...current, recurring: !current.recurring, title: current.title || textFor("class.weekly_discussion", "Weekly discussion") }))} style={{ flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 8 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 99, borderWidth: workDraft.recurring ? 0 : 2, borderColor: theme.label3, backgroundColor: workDraft.recurring ? theme.accent : "transparent", alignItems: "center", justifyContent: "center" }}>{workDraft.recurring ? <Check color="#fff" size={15} strokeWidth={3} /> : null}</View>
                  <Text selectable style={{ color: theme.label, fontWeight: "900" }}>{textFor("class.repeat_weekly", "Repeat weekly for 12 weeks")}</Text>
                </Pressable>
              ) : null}
              <Button label={workDraft.dueDate.trim() ? textFor("class.create_work", "Create") : textFor("class.create_awaiting", "Create as Awaiting Date")} theme={theme} icon="plus" onPress={createWork} />
              <Button label={textFor("common.cancel", "Cancel")} theme={theme} secondary onPress={() => setAddingWork(null)} />
            </Card>
          ) : null}
          <Card theme={theme} style={{ padding: 16 }}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{textFor("class.pulse", "Class pulse")}</Text><Text selectable style={{ color: colorForState(pulse.colorState as any), fontWeight: "900" }}>{pulse.label}</Text></View><ProgressBar value={pulse.score / 100} color={colorForState(pulse.colorState as any)} theme={theme} /><Text selectable style={{ color: theme.label2, marginTop: 8 }}>{pulse.nextMove} · {pulse.causes[0]}</Text></Card>
          {tasks.length ? <View><Section title={textFor("class.assignments", "Assignments")} action={textFor("notes.all", "All")} onAction={() => nav.push("tasks")} theme={theme} /><Card theme={theme} style={{ overflow: "hidden" }}>{tasks.map((t) => <TaskRow key={t.id} task={t} data={data} theme={theme} onToggle={() => toggle(t.id)} onOpen={() => nav.push("taskDetail", { id: t.id })} />)}</Card></View> : null}
          {exams.length ? <View><Section title={textFor("class.exams", "Upcoming exams")} theme={theme} /><View style={{ gap: 10 }}>{exams.map((e) => <Pressable key={e.id} onPress={() => nav.push("assessmentDetail", { id: e.id })}><Card theme={theme} style={{ padding: 15 }}><View style={{ flexDirection: "row", justifyContent: "space-between" }}><View><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{e.title}</Text><Text selectable style={{ color: theme.label2, marginTop: 2 }}>{localizedExamKind(e.kind)} · {e.room} · {e.time}</Text></View><Text selectable style={{ color: c.color, fontSize: 20, fontWeight: "900" }}>{localizedDaysShort(daysUntilExam(e))}</Text></View><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>{e.topics.map((topic) => <Pill key={topic} text={topic} theme={theme} />)}</View></Card></Pressable>)}</View></View> : null}
          {notes.length ? <View><Section title={textFor("class.notes", "Recent notes")} action={textFor("notes.all", "All")} onAction={() => nav.push("notes")} theme={theme} /><View style={{ gap: 10 }}>{notes.slice(0, 2).map((n) => <NoteCard key={n.id} note={n} data={data} theme={theme} onOpen={() => nav.push("noteDetail", { id: n.id })} />)}</View></View> : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Tasks({ data, mutate, nav, theme, recordReviewTrigger }: ScreenProps) {
  const liveData = useMemo(() => activeSemesterData(data), [data]);
  const done = liveData.tasks.filter((t) => t.done).length;
  const groups = [
    [textFor("task.awaiting_date", "Awaiting Date"), COLORS.orange, liveData.tasks.filter((t) => !t.done && t.missing)],
    [textFor("tasks.overdue", "Overdue"), COLORS.red, liveData.tasks.filter((t) => !t.done && !t.missing && daysUntilTask(t) < 0)],
    [textFor("tasks.today", "Today"), COLORS.orange, liveData.tasks.filter((t) => !t.done && !t.missing && daysUntilTask(t) === 0)],
    [textFor("tasks.upcoming", "Upcoming"), COLORS.blue, liveData.tasks.filter((t) => !t.done && !t.missing && daysUntilTask(t) > 0 && daysUntilTask(t) <= 3)],
    [textFor("tasks.later", "Later"), theme.label2, liveData.tasks.filter((t) => !t.done && !t.missing && daysUntilTask(t) > 3)],
    [textFor("tasks.completed", "Completed"), COLORS.green, liveData.tasks.filter((t) => t.done)],
  ] as const;
  const toggle = (id: string) => {
    const taskToToggle = liveData.tasks.find((item) => item.id === id);
    if (taskToToggle && !taskToToggle.done) recordReviewTrigger("assignment_completed");
    mutate((d) => {
    const task = d.tasks.find((item) => item.id === id);
    const tasks = d.tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t);
    const updated = { ...d, tasks, studyBlocks: buildStudyPlan({ ...d, tasks }) };
    return withFeedback(d, updated, "completeTask", { classId: task?.classId, actionId: id, dimension: "workload" });
  });
  };
  return (
    <Screen theme={theme}>
      <Header title="Tasks" sub={`${liveData.tasks.length - done} active · ${done} done`} theme={theme} />
      <View style={{ paddingHorizontal: 16, gap: 18 }}>
        <Card theme={theme} style={{ padding: 15 }}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>This week</Text><Text selectable style={{ color: theme.label2 }}>{done}/{liveData.tasks.length} complete</Text></View><ProgressBar value={liveData.tasks.length ? done / liveData.tasks.length : 0} color={theme.accent} theme={theme} height={9} /></Card>
        {groups.filter((g) => g[2].length).map(([name, color, items]) => <View key={name}><View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 9 }}><View style={{ width: 9, height: 9, borderRadius: 99, backgroundColor: color }} /><Text selectable style={{ color: theme.label, fontSize: 18, fontWeight: "900" }}>{name}</Text><Text selectable style={{ color: theme.label2 }}>{items.length}</Text></View><Card theme={theme} style={{ overflow: "hidden", opacity: name === "Completed" ? 0.7 : 1 }}>{items.map((t) => <TaskRow key={t.id} task={t} data={liveData} theme={theme} onToggle={() => toggle(t.id)} onOpen={() => nav.push("taskDetail", { id: t.id })} />)}</Card></View>)}
      </View>
    </Screen>
  );
}

function TaskDetail({ data, mutate, nav, theme, params, recordReviewTrigger }: ScreenProps) {
  const task = data.tasks.find((t) => t.id === params.id) || data.tasks[0];
  const [subs, setSubs] = useState(task?.subtasks || []);
  const [editing, setEditing] = useState(params.edit === "1");
  const [draft, setDraft] = useState<{
    title: string;
    classId: string;
    dueDate: string;
    time: string;
    type: string;
    estimateMinutes: string;
    description: string;
  }>({
    title: task?.title || "",
    classId: task?.classId || data.classes[0]?.id || "",
    type: task?.type || "Assignment",
    dueDate: task?.missing ? "" : task?.dueDate || "",
    time: task?.time || "11:59 PM",
    estimateMinutes: String(task?.estimateMinutes || 45),
    description: task?.description || "",
  });
  const recurrenceLabel = task?.recurringId ? `${textFor("task.repeats_weekly", "Repeats weekly")}${task.recurrenceEndDate ? ` · ${task.recurrenceEndDate}` : ""}` : "";
  if (!task) return <RecoveryScreen title={textFor("task.delete_title", "Task not found")} body={textFor("task.delete_body", "That task is not in this semester anymore.", { title: "" })} action={textFor("tabs.classes", "Open tasks")} nav={nav} theme={theme} />;
  const c = safeClassFor(data, task.classId);
  const dueDays = hasTaskDate(task) ? daysUntilTask(task) : 99;
  const markComplete = () => {
    if (!task.done) recordReviewTrigger("assignment_completed");
    mutate((d) => {
    const updated = { ...d, tasks: d.tasks.map((t) => t.id === task.id ? { ...t, done: !t.done, subtasks: subs } : t) };
    return withFeedback(d, updated, "completeTask", { classId: task.classId, actionId: task.id, dimension: "workload" });
  });
  };
  const addBlock = () => mutate((d) => {
    const updated = { ...d, studyBlocks: buildStudyPlan(d).filter((block) => block.taskId === task.id).concat(d.studyBlocks.filter((block) => block.taskId !== task.id)) };
    return withFeedback(d, updated, "reschedulePlan", { classId: task.classId, actionId: task.id, dimension: "preparedness" });
  });
  const buildTaskPatch = (): Partial<TaskItem> => {
    const missing = !/^\d{4}-\d{2}-\d{2}$/.test(draft.dueDate.trim());
    return {
      title: draft.title.trim() || task.title,
      classId: draft.classId || task.classId,
      type: draft.type.trim() || textFor("class.assignment", "Assignment"),
      dueDate: missing ? isoFromOffset(0) : draft.dueDate.trim(),
      time: draft.time.trim() || "11:59 PM",
      estimateMinutes: Math.max(5, Number(draft.estimateMinutes) || task.estimateMinutes),
      description: draft.description.trim(),
      missing,
      source: task.source === "AI syllabus import" ? `${previewFixtureText("aiImport", "AI syllabus import")} · ${textFor("common.edit", "edited")}` : task.source,
      userEditedAt: new Date().toISOString(),
      subtasks: subs,
    };
  };
  const saveTaskWithScope = (scope: RecurrenceScope = "single") => mutate((d) => {
    const patch = buildTaskPatch();
    const tasks = task.recurringId ? applyTaskRecurrencePatch(d.tasks, task, patch, scope) : d.tasks.map((item) => item.id === task.id ? { ...item, ...patch } : item);
    const updated = { ...d, tasks, studyBlocks: buildStudyPlan({ ...d, tasks }) };
    setEditing(false);
    return withFeedback(d, updated, "reschedulePlan", { classId: draft.classId || task.classId, actionId: task.id, dimension: "workload" });
  });
  const saveTask = () => {
    if (!task.recurringId) {
      saveTaskWithScope("single");
      return;
    }
    Alert.alert(textFor("task.delete_recurring_body", "Update recurring work?"), recurrenceLabel, [
      { text: textFor("common.cancel", "Cancel"), style: "cancel" },
      { text: textFor("task.this_occurrence", "This occurrence"), onPress: () => saveTaskWithScope("single") },
      { text: textFor("task.this_future", "This and future"), onPress: () => saveTaskWithScope("future") },
    ]);
  };
  const duplicateTask = () => mutate((d) => {
    const copy: TaskItem = { ...task, id: makeOwnershipId("task"), title: `${task.title} ${textFor("task.copy_suffix", "copy")}`, done: false, recurringId: undefined, recurrenceIndex: undefined, source: textFor("task.manual_duplicate", "Manual duplicate"), subtasks: task.subtasks.map((subtask) => ({ ...subtask, done: false })) };
    const tasks = [copy, ...d.tasks];
    return { ...d, tasks, studyBlocks: buildStudyPlan({ ...d, tasks }) };
  });
  const deleteTaskWithScope = (scope: RecurrenceScope) => {
    mutate((d) => {
      const tasks = task.recurringId ? deleteTaskRecurrence(d.tasks, task, scope) : d.tasks.filter((item) => item.id !== task.id);
      const remainingIds = new Set(tasks.map((item) => item.id));
      const studyBlocks = d.studyBlocks.filter((block) => !block.taskId || remainingIds.has(block.taskId));
      return { ...d, tasks, studyBlocks: buildStudyPlan({ ...d, tasks, studyBlocks }) };
    });
    nav.back();
  };
  const deleteTask = () => Alert.alert(textFor("task.delete_title", "Delete assignment?"), task.recurringId ? textFor("task.delete_recurring_body", "Choose how much of this recurring work to remove.") : textFor("task.delete_body", "{title} will be removed from Today, Plan, reminders, and widgets.", { title: task.title }), [
    { text: textFor("common.cancel", "Cancel"), style: "cancel" },
    ...(task.recurringId ? [
      { text: textFor("task.this_occurrence", "This occurrence"), style: "destructive" as const, onPress: () => deleteTaskWithScope("single") },
      { text: textFor("task.this_future", "This and future"), style: "destructive" as const, onPress: () => deleteTaskWithScope("future") },
    ] : [{ text: textFor("common.delete", "Delete"), style: "destructive" as const, onPress: () => deleteTaskWithScope("single") }]),
  ]);
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label={c.code} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        <View><View style={{ flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" }}><Pill text={c.code} color={c.color} theme={theme} /><Pill text={task.type} theme={theme} />{task.missing ? <Pill text={textFor("task.awaiting_date", "Awaiting Date")} color={COLORS.orange} theme={theme} /> : null}{task.recurringId ? <Pill text={textFor("task.repeats_weekly", "Repeats weekly")} color={COLORS.purple} theme={theme} /> : null}</View><Text selectable style={{ color: theme.label, fontSize: 26, lineHeight: 30, fontWeight: "900", marginBottom: 14 }}>{task.title}</Text>{recurrenceLabel ? <Text selectable style={{ color: theme.label2, lineHeight: 20, marginBottom: 10 }}>{recurrenceLabel}</Text> : null}<View style={{ flexDirection: "row", gap: 9 }}><View style={{ flex: 1 }}><Button label={task.done ? textFor("task.reopen", "Reopen task") : textFor("task.mark_complete", "Mark complete")} theme={theme} icon="target" onPress={() => { markComplete(); nav.back(); }} /></View><View style={{ flex: 1 }}><Button label={editing ? textFor("task.close_edit", "Close edit") : textFor("common.edit", "Edit")} theme={theme} secondary icon="pencil" onPress={() => setEditing((value) => !value)} /></View></View></View>
        {editing ? (
          <Card theme={theme} style={{ padding: 16 }}>
            <Text selectable style={{ color: theme.label, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>{textFor("task.edit", "Edit assignment")}</Text>
            <FieldInput label={textFor("class.title", "Title")} value={draft.title} onChangeText={(title) => setDraft((current) => ({ ...current, title }))} theme={theme} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><FieldInput label={textFor("task.due", "Due date")} value={draft.dueDate} onChangeText={(dueDate) => setDraft((current) => ({ ...current, dueDate }))} placeholder="YYYY-MM-DD" theme={theme} /></View>
              <View style={{ flex: 1 }}><FieldInput label={textFor("class.time", "Time")} value={draft.time} onChangeText={(time) => setDraft((current) => ({ ...current, time }))} theme={theme} /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><FieldInput label={textFor("assessment.type", "Type")} value={draft.type} onChangeText={(type) => setDraft((current) => ({ ...current, type }))} theme={theme} /></View>
              <View style={{ flex: 1 }}><FieldInput label={textFor("class.effort", "Effort")} value={draft.estimateMinutes} onChangeText={(estimateMinutes) => setDraft((current) => ({ ...current, estimateMinutes }))} theme={theme} /></View>
            </View>
            <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "900", marginBottom: 7 }}>{textFor("task.move_to_class", "Move to class")}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>{data.classes.filter((klass) => !klass.archivedAt).map((klass) => (
              <Pressable key={klass.id} onPress={() => setDraft((current) => ({ ...current, classId: klass.id }))} style={{ paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: draft.classId === klass.id ? klass.color : theme.surface2 }}><Text style={{ color: draft.classId === klass.id ? "#fff" : theme.label, fontWeight: "900" }}>{klass.code}</Text></Pressable>
            ))}</View>
            <FieldInput label={textFor("class.description", "Description")} value={draft.description} onChangeText={(description) => setDraft((current) => ({ ...current, description }))} theme={theme} multiline />
            <Button label={draft.dueDate.trim() ? textFor("task.save", "Save assignment") : textFor("task.save_awaiting", "Save as Awaiting Date")} theme={theme} icon="target" onPress={saveTask} />
            <View style={{ flexDirection: "row", gap: 9 }}>
              <View style={{ flex: 1 }}><Button label={textFor("common.edit", "Duplicate")} theme={theme} secondary icon="copy" onPress={duplicateTask} /></View>
              <View style={{ flex: 1 }}><Button label={textFor("common.delete", "Delete")} theme={theme} secondary icon="trash" onPress={deleteTask} /></View>
            </View>
          </Card>
        ) : null}
        <Card theme={theme} style={{ overflow: "hidden" }}>{[[Clock, textFor("task.due", "Due"), taskDueLabel(task), task.missing || dueDays <= 0 ? COLORS.orange : theme.label], [Timer, textFor("task.estimated", "Estimated"), minutesLabel(task.estimateMinutes), theme.label], [FileText, textFor("task.source", "Source"), task.source, theme.label], [CalendarDays, textFor("task.on_calendar", "On calendar"), data.studyBlocks.find((b) => b.taskId === task.id)?.time || textFor("task.not_scheduled", "Not scheduled"), theme.label]].map(([I, l, v, color]: any) => <View key={l} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: l === textFor("task.on_calendar", "On calendar") ? 0 : 1, borderBottomColor: theme.hairline }}><I color={theme.label2} size={18} /><Text selectable style={{ color: theme.label2, flex: 1 }}>{l}</Text><Text selectable style={{ color, fontWeight: "900", maxWidth: 180, textAlign: "right" }}>{v}</Text></View>)}</Card>
        {subs.length ? <View><Section title="Subtasks" action={`${subs.filter((s) => s.done).length}/${subs.length}`} theme={theme} /><Card theme={theme} style={{ overflow: "hidden" }}>{subs.map((s, i) => <Pressable key={s.title} onPress={() => setSubs((list) => list.map((item, j) => j === i ? { ...item, done: !item.done } : item))} style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 14 }}><View style={{ width: 23, height: 23, borderRadius: 99, borderWidth: s.done ? 0 : 2, borderColor: c.color, backgroundColor: s.done ? c.color : "transparent", alignItems: "center", justifyContent: "center" }}>{s.done ? <Check color="#fff" size={14} strokeWidth={3} /> : null}</View><Text selectable style={{ color: s.done ? theme.label3 : theme.label, textDecorationLine: s.done ? "line-through" : "none", fontWeight: "700" }}>{s.title}</Text></Pressable>)}</Card></View> : null}
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#241E33" : "#F7F0FF" }}><View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}><Icon name="sparkles" color={COLORS.purple} /><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{textFor("today.next_move", "Next Move")}</Text></View><Text selectable style={{ color: theme.label, lineHeight: 21 }}>{minutesLabel(task.estimateMinutes)} · {taskDueLabel(task)}.</Text><Button label={textFor("assessment.rebuild", "Add study block")} theme={theme} icon="clock" onPress={addBlock} /></Card>
      </ScrollView>
    </View>
  );
}

function AssessmentDetail({ data, mutate, nav, theme, params }: ScreenProps) {
  const exam = data.exams.find((item) => item.id === params.id) || data.exams[0];
  const [editing, setEditing] = useState(params.edit === "1");
  const [draft, setDraft] = useState<{
    title: string;
    classId: string;
    date: string;
    time: string;
    type: string;
    effort: string;
    priority: string;
    room: string;
    notes: string;
  }>({
    title: exam?.title || "",
    classId: exam?.classId || data.classes[0]?.id || "",
    date: exam?.dueDate || isoFromOffset(1),
    time: exam?.time || "9:00 AM",
    type: exam?.kind || textFor("class.assessment", "Exam"),
    effort: String(exam?.effortMinutes || 120),
    priority: exam?.priority || previewFixtureText("high", "High"),
    room: exam?.room || previewFixtureText("roomTbd", "Room TBD"),
    notes: exam?.notes || exam?.description || "",
  });
  if (!exam) return <RecoveryScreen title={textFor("class.assessment", "Assessment")} body={textFor("class.not_found_body", "That assessment is not in this semester anymore.")} action={textFor("today.open_plan", "Open plan")} nav={nav} theme={theme} />;
  const c = safeClassFor(data, exam.classId);
  const dueDays = daysUntilExam(exam);
  const saveAssessment = () => mutate((d) => {
    const exams = d.exams.map((item) => item.id === exam.id ? {
      ...item,
      title: draft.title.trim() || item.title,
      classId: draft.classId || item.classId,
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(draft.date.trim()) ? draft.date.trim() : item.dueDate,
      time: draft.time.trim() || "9:00 AM",
      room: draft.room.trim() || previewFixtureText("roomTbd", "Room TBD"),
      kind: draft.type as ExamItem["kind"],
      effortMinutes: Math.max(15, Number(draft.effort) || item.effortMinutes || 120),
      priority: draft.priority as ExamItem["priority"],
      notes: draft.notes.trim(),
      userEditedAt: new Date().toISOString(),
      description: draft.notes.trim(),
      topics: draft.notes.trim() ? [draft.notes.trim()] : item.topics,
    } : item);
    setEditing(false);
    return withFeedback(d, { ...d, exams, studyBlocks: buildStudyPlan({ ...d, exams }) }, "reschedulePlan", { classId: draft.classId || exam.classId, actionId: exam.id, dimension: "preparedness" });
  });
  const duplicateAssessment = () => mutate((d) => {
    const copy: ExamItem = { ...exam, id: makeOwnershipId("exam"), title: `${exam.title} ${textFor("task.copy_suffix", "copy")}` };
    const exams = [copy, ...d.exams];
    return { ...d, exams, studyBlocks: buildStudyPlan({ ...d, exams }) };
  });
  const deleteAssessment = () => Alert.alert(textFor("assessment.delete_title", "Delete assessment?"), textFor("assessment.delete_body", "{title} will be removed from Today, Plan, reminders, and widgets.", { title: exam.title }), [
    { text: textFor("common.cancel", "Cancel"), style: "cancel" },
    { text: textFor("common.delete", "Delete"), style: "destructive", onPress: () => {
      mutate((d) => {
        const exams = d.exams.filter((item) => item.id !== exam.id);
        const studyBlocks = d.studyBlocks.filter((block) => block.examId !== exam.id);
        return { ...d, exams, studyBlocks: buildStudyPlan({ ...d, exams, studyBlocks }) };
      });
      nav.back();
    } },
  ]);
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label={c.code} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        <View>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" }}><Pill text={c.code} color={c.color} theme={theme} /><Pill text={localizedExamKind(exam.kind)} color={COLORS.purple} theme={theme} /><Pill text={localizedPriority(exam.priority)} color={exam.priority === "Low" ? COLORS.blue : exam.priority === "Medium" ? COLORS.orange : COLORS.red} theme={theme} /></View>
          <Text selectable style={{ color: theme.label, fontSize: 26, lineHeight: 30, fontWeight: "900", marginBottom: 14 }}>{exam.title}</Text>
          <View style={{ flexDirection: "row", gap: 9 }}>
            <View style={{ flex: 1 }}><Button label={editing ? textFor("task.close_edit", "Close edit") : textFor("common.edit", "Edit")} theme={theme} icon="pencil" onPress={() => setEditing((value) => !value)} /></View>
            <View style={{ flex: 1 }}><Button label={textFor("common.edit", "Duplicate")} theme={theme} secondary icon="copy" onPress={duplicateAssessment} /></View>
          </View>
        </View>
        {editing ? (
          <Card theme={theme} style={{ padding: 16 }}>
            <Text selectable style={{ color: theme.label, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>{textFor("class.assessment", "Assessment")}</Text>
            <FieldInput label={textFor("class.title", "Title")} value={draft.title} onChangeText={(title) => setDraft((current) => ({ ...current, title }))} theme={theme} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><FieldInput label={textFor("assessment.date", "Date")} value={draft.date} onChangeText={(date) => setDraft((current) => ({ ...current, date }))} placeholder="YYYY-MM-DD" theme={theme} /></View>
              <View style={{ flex: 1 }}><FieldInput label={textFor("class.time", "Time")} value={draft.time} onChangeText={(time) => setDraft((current) => ({ ...current, time }))} theme={theme} /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><FieldInput label={textFor("assessment.type", "Type")} value={draft.type} onChangeText={(type) => setDraft((current) => ({ ...current, type }))} placeholder={textFor("class.assessment", "Exam")} theme={theme} /></View>
              <View style={{ flex: 1 }}><FieldInput label={textFor("class.effort", "Effort")} value={draft.effort} onChangeText={(effort) => setDraft((current) => ({ ...current, effort }))} placeholder="120" theme={theme} /></View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><FieldInput label={textFor("assessment.room", "Room")} value={draft.room} onChangeText={(room) => setDraft((current) => ({ ...current, room }))} theme={theme} /></View>
              <View style={{ flex: 1 }}><FieldInput label={textFor("assessment.priority", "Priority")} value={draft.priority} onChangeText={(priority) => setDraft((current) => ({ ...current, priority }))} placeholder={previewFixtureText("high", "High")} theme={theme} /></View>
            </View>
            <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "900", marginBottom: 7 }}>{textFor("task.move_to_class", "Move to class")}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>{data.classes.filter((klass) => !klass.archivedAt).map((klass) => (
              <Pressable key={klass.id} onPress={() => setDraft((current) => ({ ...current, classId: klass.id }))} style={{ paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: draft.classId === klass.id ? klass.color : theme.surface2 }}><Text style={{ color: draft.classId === klass.id ? "#fff" : theme.label, fontWeight: "900" }}>{klass.code}</Text></Pressable>
            ))}</View>
            <FieldInput label={textFor("class.notes_label", "Notes")} value={draft.notes} onChangeText={(notes) => setDraft((current) => ({ ...current, notes }))} theme={theme} multiline />
            <Button label={textFor("assessment.save", "Save assessment")} theme={theme} icon="target" onPress={saveAssessment} />
            <Button label={textFor("assessment.delete_title", "Delete assessment?")} theme={theme} secondary icon="trash" onPress={deleteAssessment} />
          </Card>
        ) : null}
        <Card theme={theme} style={{ overflow: "hidden" }}>{[[Clock, textFor("assessment.date", "Date"), `${localizedDueLabel(dueDays)} · ${exam.time}`, dueDays <= 3 ? COLORS.orange : theme.label], [Timer, textFor("class.effort", "Effort"), minutesLabel(exam.effortMinutes || 120), theme.label], [MapPin, textFor("assessment.room", "Room"), exam.room, theme.label], [FileText, textFor("class.notes_label", "Notes"), exam.notes || exam.description || textFor("assessment.no_notes", "No notes yet"), theme.label]].map(([I, l, v, color]: any) => <View key={l} style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: l === textFor("class.notes_label", "Notes") ? 0 : 1, borderBottomColor: theme.hairline }}><I color={theme.label2} size={18} /><Text selectable style={{ color: theme.label2, flex: 1 }}>{l}</Text><Text selectable numberOfLines={2} style={{ color, fontWeight: "900", maxWidth: 190, textAlign: "right" }}>{v}</Text></View>)}</Card>
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#241E33" : "#F7F0FF" }}><Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 18 }}>{textFor("assessment.prep_plan", "Prep plan")}</Text><Text selectable style={{ color: theme.label2, lineHeight: 21, marginTop: 5 }}>{textFor("assessment.prep_body", "{minutes} of prep. Due {due}.", { minutes: minutesLabel(exam.effortMinutes || 120), due: localizedDueLabel(dueDays) })}</Text><Button label={textFor("assessment.rebuild", "Rebuild study blocks")} theme={theme} icon="refresh" onPress={() => mutate((d) => ({ ...d, studyBlocks: buildStudyPlan(d) }))} /></Card>
      </ScrollView>
    </View>
  );
}

function Scan({ data, mutate, nav, theme, params, setCurrentImport }: ScreenProps) {
  const previewOnly = !data.prefs.premium;
  const autoActionHandled = useRef(false);
  const [quickTask, setQuickTask] = useState(textFor("scan.quick_seed", "chem lab report due tomorrow, estimate 2 hours"));
  const [scanStatus, setScanStatus] = useState(hasNativeImageTextRecognition() ? textFor("scan.status_ready", "On-device text scan is ready.") : textFor("scan.status_backup", "Camera and photo scan are ready on iPhone. Paste is available as a backup."));
  const [working, setWorking] = useState<"syllabusCamera" | "syllabusLibrary" | "syllabusPdf" | "notesCamera" | "notesLibrary" | null>(null);

  const analyzeText = (sourceText: string, sourceName: string, mode: "syllabus" | "notes") => {
    const batch = mode === "notes" ? analyzeNotes(sourceText, data) : analyzeSyllabus(sourceText, data);
    setCurrentImport({ ...batch, sourceName });
    nav.push("review");
  };

  const runImageOcr = async (source: "camera" | "library", mode: "syllabus" | "notes") => {
    if (source === "camera") {
      nav.push("cameraScanner", { mode });
      return;
    }
    const workKey = `${mode}Library` as typeof working;
    setWorking(workKey);
    setScanStatus(textFor("scan.opening_photos", "Opening photos..."));
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        const target = "photo library";
        setScanStatus(textFor("scan.permission", "Permission is needed to read {mode} pages from the {target}.", { mode: mode === "notes" ? textFor("notes.title", "notes") : textFor("scan.header_preview", "syllabus"), target }));
        Alert.alert(textFor("scan.permission", "Permission needed", { mode: "", target: "" }), textFor("scan.permission", "Permission is needed to read {mode} pages from the {target}.", { mode: mode === "notes" ? textFor("notes.title", "notes") : textFor("scan.header_preview", "syllabus"), target }), [
          { text: textFor("scan.paste_text", "Paste text"), onPress: () => nav.push("paste", { mode }) },
          { text: textFor("scan.open_settings", "Open Settings"), onPress: () => Linking.openSettings().catch(() => {}) },
          { text: textFor("common.cancel", "Cancel"), style: "cancel" },
        ]);
        setWorking(null);
        return;
      }
      if (permission.accessPrivileges === "limited") {
        setScanStatus(textFor("scan.limited_photos", "Photo access is limited. Pick an allowed image, open Settings for more access, or paste text."));
      }

      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1, allowsEditing: false });
      if (result.canceled || !result.assets[0]?.uri) {
        setScanStatus(textFor("scan.canceled", "Scan canceled."));
        setWorking(null);
        return;
      }

      setScanStatus(mode === "notes" ? textFor("scan.reading_notes", "Reading note text on this iPhone...") : textFor("scan.reading_syllabus", "Reading syllabus text on this iPhone..."));
      const text = await extractTextFromImage(result.assets[0].uri);
      setScanStatus(textFor("scan.found_words", "Found {count} words. Review before saving.", { count: countOcrWords(text) }));
      analyzeText(text, `Photo ${mode} scan`, mode);
    } catch (error) {
      setScanStatus(error instanceof Error ? error.message : textFor("scan.image_failed", "That image could not be scanned."));
    } finally {
      setWorking(null);
    }
  };

  const runPdfImport = async () => {
    setWorking("syllabusPdf");
    setScanStatus(textFor("scan.opening_pdf", "Opening PDF..."));
    try {
      const result = await pickAndExtractPdf();
      if (!result) {
        setScanStatus(textFor("scan.pdf_canceled", "PDF import canceled."));
        return;
      }
      if (result.fallbackNeeded) {
        setScanStatus(textFor("scan.pdf_unreadable", "PDF opened. Text was not readable here. Paste text or scan pages."));
        Alert.alert(textFor("review.needs_review", "Needs review"), textFor("scan.pdf_unreadable", "PDF opened. Text was not readable here. Paste text or scan pages."), [
          { text: textFor("scan.scan_pages", "Scan pages"), onPress: () => runImageOcr("camera", "syllabus") },
          { text: textFor("scan.paste_text", "Paste text"), onPress: () => nav.push("paste", { mode: "syllabus" }) },
          { text: textFor("common.close", "Close") },
        ]);
        return;
      }
      setScanStatus(textFor("scan.pdf_read", "PDF read: {count} words. Review before saving.", { count: result.wordCount }));
      analyzeText(result.text, `PDF · ${result.fileName}`, "syllabus");
    } catch (error) {
      setScanStatus(error instanceof Error ? error.message : textFor("scan.pdf_failed", "That PDF could not be imported."));
      Alert.alert(textFor("scan.pdf_failed_title", "PDF import failed"), textFor("scan.pdf_failed_body", "Paste syllabus text or scan the PDF pages with the camera."));
    } finally {
      setWorking(null);
    }
  };

  const captureTask = () => {
    if (previewOnly) {
      nav.push("paywall");
      return;
    }
    const task = createNaturalLanguageTask(quickTask, data);
    mutate((d) => {
      const tasks = [task, ...d.tasks];
      const updated = { ...d, tasks, studyBlocks: buildStudyPlan({ ...d, tasks }) };
      return withFeedback(d, updated, "reschedulePlan", { classId: task.classId, actionId: task.id, dimension: "workload" });
    });
    nav.push("tasks");
  };
  useEffect(() => {
    if (autoActionHandled.current) return;
    if (params.action === "pdf") {
      autoActionHandled.current = true;
      runPdfImport();
    }
    if (params.action === "camera") {
      autoActionHandled.current = true;
      runImageOcr("camera", "syllabus");
    }
  }, [params.action]);

  const isWorking = Boolean(working);
  const approvedImports = data.imports.filter((imp) => imp.status === "applied").length;
  const latestImport = data.imports[0];
  const scannerReady = hasNativeImageTextRecognition();
  const primaryActions = [
    {
      key: "pdf",
      icon: "upload",
      label: textFor("scan.upload_pdf", "Upload syllabus PDF"),
      detail: textFor("scan.pdf_action_body", "Best for full syllabi and multi-page handouts."),
      color: COLORS.blue,
      busy: working === "syllabusPdf",
      onPress: runPdfImport,
      featured: true,
    },
    {
      key: "camera",
      icon: "camera",
      label: textFor("scan.camera", "Camera"),
      detail: textFor("scan.camera_action_body", "Capture pages, boards, packets, and printed schedules."),
      color: COLORS.green,
      busy: working === "syllabusCamera",
      onPress: () => nav.push("cameraScanner", { mode: "syllabus" }),
    },
    {
      key: "photo",
      icon: "image",
      label: textFor("scan.photo", "Photo"),
      detail: textFor("scan.photo_action_body", "Use screenshots or saved syllabus pages."),
      color: COLORS.purple,
      busy: working === "syllabusLibrary",
      onPress: () => runImageOcr("library", "syllabus"),
    },
    {
      key: "paste",
      icon: "file",
      label: textFor("scan.paste_text", "Paste text"),
      detail: textFor("scan.paste_action_body", "Fallback for locked PDFs or copied LMS text."),
      color: COLORS.orange,
      busy: false,
      onPress: () => nav.push("paste", { mode: "syllabus" }),
    },
  ];

  return (
    <Screen theme={theme} bottom={132}>
      <Header
        title={previewOnly ? textFor("scan.header_preview", "Preview syllabus") : textFor("scan.header", "Scan")}
        sub={previewOnly ? textFor("scan.sub_preview", "Preview before you unlock") : textFor("scan.sub", "Capture anything")}
        theme={theme}
        right={<ScannerModeBadge label={previewOnly ? textFor("review.guard_preview", "Preview only.") : textFor("widgets.ready", "Ready")} theme={theme} locked={previewOnly} />}
      />
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        <View style={{ borderRadius: 28, overflow: "hidden", backgroundColor: theme.dark ? "#0D1422" : "#FFFFFF", borderWidth: 1, borderColor: theme.hairline, boxShadow: theme.dark ? "0 16px 32px rgba(0,0,0,0.42)" : "0 16px 34px rgba(18,36,74,0.12)" }}>
          <View style={{ padding: 18, gap: 16 }}>
            <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
              <View style={{ width: 70, height: 92, borderRadius: 22, backgroundColor: theme.dark ? "#101A2C" : "#EEF4FF", borderWidth: 1, borderColor: theme.dark ? "rgba(255,255,255,0.10)" : "#D7E4FF", alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 46, height: 58, borderRadius: 12, backgroundColor: theme.dark ? "#172238" : "#FFFFFF", borderWidth: 2, borderColor: scannerReady ? COLORS.green : COLORS.orange, alignItems: "center", justifyContent: "center" }}>
                  {isWorking ? <ActivityIndicator color={scannerReady ? COLORS.green : COLORS.orange} /> : <ScanLine color={scannerReady ? COLORS.green : COLORS.orange} size={27} strokeWidth={2.4} />}
                </View>
              </View>
              <View style={{ flex: 1, gap: 7 }}>
                <Text selectable style={{ color: scannerReady ? COLORS.green : COLORS.orange, fontSize: 12, fontWeight: "900" }}>{scannerReady ? textFor("scan.status_ready", "On-device text scan is ready.") : textFor("scan.status_backup", "Camera and photo scan are ready on iPhone. Paste is available as a backup.")}</Text>
                <Text selectable style={{ color: theme.label, fontSize: 26, lineHeight: 29, fontWeight: "900" }}>{previewOnly ? textFor("scan.title_preview", "Preview. Then unlock.") : textFor("scan.title", "Import. Review. Start.")}</Text>
                <Text selectable style={{ color: theme.label2, lineHeight: 20 }}>{scanStatus}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <ScannerMetric value={scannerReady ? textFor("widgets.ready", "Ready") : textFor("scan.paste_text", "Paste text")} label={textFor("scan.metric_ocr", "OCR")} color={scannerReady ? COLORS.green : COLORS.orange} theme={theme} />
              <ScannerMetric value={previewOnly ? textFor("review.guard_preview", "Preview") : textFor("review.guard_active", "Review")} label={textFor("scan.metric_gate", "Save gate")} color={previewOnly ? COLORS.orange : COLORS.blue} theme={theme} />
              <ScannerMetric value={String(data.imports.length)} label={textFor("scan.history", "Import history")} color={COLORS.purple} theme={theme} />
            </View>
          </View>
          <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
            <ScannerStatusRail theme={theme} activeIndex={isWorking ? 1 : latestImport ? 3 : 0} />
          </View>
        </View>

        <View style={{ gap: 10 }}>
          {primaryActions.map((action) => (
            <ScannerActionButton
              key={action.key}
              theme={theme}
              icon={action.icon}
              label={action.label}
              detail={action.detail}
              color={action.color}
              busy={action.busy}
              disabled={isWorking}
              featured={action.featured}
              onPress={action.onPress}
            />
          ))}
        </View>

        {!previewOnly ? (
          <ScannerPanel theme={theme} icon="notebook-pen" color={COLORS.purple} title={textFor("scan.notes_title", "Scan notes")} body={textFor("scan.notes_body", "Summaries, terms, flashcards, quizzes, and review tasks.")}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <ScannerCompactButton theme={theme} label={textFor("scan.camera", "Camera")} icon="camera" color={COLORS.purple} busy={working === "notesCamera"} disabled={isWorking} onPress={() => nav.push("cameraScanner", { mode: "notes" })} />
              <ScannerCompactButton theme={theme} label={textFor("scan.photo", "Photo")} icon="image" color={COLORS.blue} busy={working === "notesLibrary"} disabled={isWorking} onPress={() => runImageOcr("library", "notes")} />
            </View>
          </ScannerPanel>
        ) : null}

        {!previewOnly ? (
          <ScannerPanel theme={theme} icon="wand" color={COLORS.green} title={textFor("scan.quick_title", "Fast capture")} body={textFor("scan.quick_body", "Type class, task, due date, estimate.")}>
            <TextInput
              value={quickTask}
              onChangeText={setQuickTask}
              placeholder={textFor("scan.quick_seed", "chem lab report due tomorrow, estimate 2 hours")}
              placeholderTextColor={theme.label3}
              style={{ minHeight: 52, borderRadius: 16, backgroundColor: theme.surface2, color: theme.label, paddingHorizontal: 14, paddingVertical: 11, fontWeight: "800", borderWidth: 1, borderColor: theme.hairline }}
            />
            <Button label={textFor("scan.quick_button", "Create task + replan")} theme={theme} icon="sparkles" onPress={captureTask} />
          </ScannerPanel>
        ) : null}

        {!previewOnly ? (
          <View style={{ gap: 10 }}>
            <Section title={textFor("scan.more", "More captures")} theme={theme} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {[
                ["syllabus", textFor("scan.more_assignment", "Assignment sheet"), textFor("scan.more_assignment_body", "Extract task details"), COLORS.orange, "file"],
                ["syllabus", textFor("scan.more_exam", "Exam review"), textFor("scan.more_exam_body", "Build a study set"), COLORS.pink, "flask-conical"],
                ["syllabus", textFor("scan.upload_pdf", "Upload PDF"), textFor("scan.more_upload_body", "Pick syllabus PDF"), COLORS.green, "upload"],
              ].map(([mode, name, sub, color, icon]) => (
                <ScannerCaptureTile
                  key={name}
                  theme={theme}
                  title={name}
                  body={sub}
                  icon={icon}
                  color={color}
                  disabled={isWorking}
                  onPress={() => icon === "upload" ? runPdfImport() : nav.push("paste", { mode })}
                />
              ))}
            </View>
          </View>
        ) : null}

        {!previewOnly ? (
          <View style={{ gap: 10 }}>
            <Section title={textFor("scan.history", "Import history")} action={approvedImports ? `${approvedImports} ${textFor("widgets.ready", "Ready")}` : undefined} theme={theme} />
            <View style={{ borderRadius: 18, overflow: "hidden", backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline }}>
              {data.imports.length ? data.imports.slice(0, 5).map((imp, index) => (
                <ScannerImportHistoryRow key={imp.id} imp={imp} index={index} theme={theme} />
              )) : (
                <View style={{ padding: 16, gap: 8 }}>
                  <Text selectable style={{ color: theme.label, fontSize: 16, fontWeight: "900" }}>{textFor("scan.history_empty_title", "No imports reviewed yet")}</Text>
                  <Text selectable style={{ color: theme.label2, lineHeight: 20 }}>{textFor("scan.empty_history", "No imports yet. Paste a syllabus or notes to create the first one.")}</Text>
                </View>
              )}
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function ScannerModeBadge({ label, theme, locked }: { label: string; theme: ReturnType<typeof palette>; locked?: boolean }) {
  const color = locked ? COLORS.orange : COLORS.green;
  return (
    <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: `${color}18`, borderWidth: 1, borderColor: `${color}34` }}>
      <Icon name={locked ? "lock" : "shield"} size={14} color={color} />
      <Text style={{ color, fontSize: 12, fontWeight: "900" }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{label}</Text>
    </View>
  );
}

function ScannerMetric({ value, label, color, theme }: { value: string; label: string; color: string; theme: ReturnType<typeof palette> }) {
  return (
    <View style={{ flex: 1, minHeight: 62, borderRadius: 16, padding: 10, backgroundColor: theme.surface2, borderWidth: 1, borderColor: theme.hairline, justifyContent: "center" }}>
      <Text selectable numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ color, fontSize: 16, fontWeight: "900" }}>{value}</Text>
      <Text selectable numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ color: theme.label2, fontSize: 11, fontWeight: "800", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function ScannerStatusRail({ theme, activeIndex }: { theme: ReturnType<typeof palette>; activeIndex: number }) {
  const steps = [
    [textFor("scan.rail_capture", "Capture"), "camera"],
    [textFor("scan.rail_read", "Read text"), "scan"],
    [textFor("scan.rail_review", "Review"), "shield"],
    [textFor("scan.rail_plan", "Plan"), "target"],
  ];
  return (
    <View style={{ flexDirection: "row", gap: 7 }}>
      {steps.map(([label, icon], index) => {
        const active = index <= activeIndex;
        const color = active ? [COLORS.green, COLORS.blue, COLORS.purple, COLORS.orange][index] : theme.label3;
        return (
          <View key={label} style={{ flex: 1, minHeight: 58, borderRadius: 14, padding: 9, backgroundColor: active ? `${color}14` : theme.surface2, borderWidth: 1, borderColor: active ? `${color}30` : theme.hairline, justifyContent: "center", alignItems: "center", gap: 5 }}>
            <Icon name={icon} color={color} size={16} />
            <Text selectable numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.64} style={{ color: active ? theme.label : theme.label2, fontSize: 11, fontWeight: "900", textAlign: "center" }}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ScannerActionButton({ theme, icon, label, detail, color, busy, disabled, featured, onPress }: { theme: ReturnType<typeof palette>; icon: string; label: string; detail: string; color: string; busy?: boolean; disabled?: boolean; featured?: boolean; onPress: () => void }) {
  const inactive = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => ({
        minHeight: featured ? 82 : 72,
        borderRadius: featured ? 22 : 18,
        padding: 14,
        backgroundColor: featured ? color : theme.surface,
        borderWidth: 1,
        borderColor: featured ? color : theme.hairline,
        opacity: inactive ? 0.58 : pressed ? 0.82 : 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        boxShadow: featured ? (theme.dark ? "0 12px 24px rgba(0,0,0,0.34)" : "0 12px 24px rgba(47,107,255,0.20)") : "none",
      })}
    >
      <View style={{ width: featured ? 48 : 42, height: featured ? 48 : 42, borderRadius: featured ? 16 : 14, backgroundColor: featured ? "rgba(255,255,255,0.18)" : `${color}18`, alignItems: "center", justifyContent: "center" }}>
        {busy ? <ActivityIndicator color={featured ? "#fff" : color} /> : <Icon name={icon} color={featured ? "#fff" : color} size={featured ? 24 : 21} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text selectable numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={{ color: featured ? "#fff" : theme.label, fontSize: featured ? 18 : 16, fontWeight: "900" }}>{label}</Text>
        <Text selectable numberOfLines={2} style={{ color: featured ? "rgba(255,255,255,0.82)" : theme.label2, lineHeight: 18, marginTop: 3 }}>{detail}</Text>
      </View>
      <ChevronRight color={featured ? "rgba(255,255,255,0.76)" : theme.label3} size={20} />
    </Pressable>
  );
}

function ScannerPanel({ theme, icon, color, title, body, children }: { theme: ReturnType<typeof palette>; icon: string; color: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <View style={{ borderRadius: 22, padding: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline, gap: 13 }}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: `${color}18`, alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} color={color} size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text selectable style={{ color: theme.label, fontSize: 17, fontWeight: "900" }}>{title}</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 19, marginTop: 2 }}>{body}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function ScannerCompactButton({ theme, label, icon, color, busy, disabled, onPress }: { theme: ReturnType<typeof palette>; label: string; icon: string; color: string; busy?: boolean; disabled?: boolean; onPress: () => void }) {
  const inactive = disabled || busy;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: inactive, busy }} disabled={inactive} onPress={() => { tap(); onPress(); }} style={({ pressed }) => ({ flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: `${color}18`, borderWidth: 1, borderColor: `${color}34`, opacity: inactive ? 0.58 : pressed ? 0.82 : 1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, paddingHorizontal: 10 })}>
      {busy ? <ActivityIndicator color={color} /> : <Icon name={icon} color={color} size={18} />}
      <Text style={{ color, fontWeight: "900", flexShrink: 1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.74}>{label}</Text>
    </Pressable>
  );
}

function ScannerCaptureTile({ theme, title, body, icon, color, disabled, onPress }: { theme: ReturnType<typeof palette>; title: string; body: string; icon: string; color: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} onPress={() => { tap(); onPress(); }} style={({ pressed }) => ({ width: "48%", minHeight: 118, borderRadius: 18, padding: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline, opacity: disabled ? 0.54 : pressed ? 0.82 : 1, gap: 10 })}>
      <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: `${color}18`, alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} color={color} size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text selectable numberOfLines={2} style={{ color: theme.label, fontWeight: "900", lineHeight: 18 }}>{title}</Text>
        <Text selectable numberOfLines={2} style={{ color: theme.label2, marginTop: 3, lineHeight: 17, fontSize: 12.5 }}>{body}</Text>
      </View>
    </Pressable>
  );
}

function ScannerImportHistoryRow({ imp, index, theme }: { imp: ImportBatch; index: number; theme: ReturnType<typeof palette> }) {
  const color = imp.status === "applied" ? COLORS.green : COLORS.orange;
  return (
    <View style={{ padding: 14, flexDirection: "row", gap: 12, alignItems: "center", borderTopWidth: index === 0 ? 0 : 1, borderTopColor: theme.hairline }}>
      <View style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: `${color}18`, alignItems: "center", justifyContent: "center" }}>
        <CheckCircle2 color={color} size={20} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text selectable numberOfLines={1} style={{ color: theme.label, fontWeight: "900" }}>{imp.sourceName}</Text>
        <Text selectable numberOfLines={1} style={{ color: theme.label2, marginTop: 2 }}>{imp.status} - {imp.candidates.length} {textFor("plan.items", "items")}</Text>
      </View>
    </View>
  );
}

function CameraScanner({ data, nav, theme, params, setCurrentImport }: ScreenProps) {
  const mode = data.prefs.premium && params.mode === "notes" ? "notes" : "syllabus";
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [torch, setTorch] = useState(false);
  const [guidanceIndex, setGuidanceIndex] = useState(0);
  const [captureState, setCaptureState] = useState<"aiming" | "capturing" | "reading" | "ready">("aiming");
  const [capturedText, setCapturedText] = useState("");
  const [capturedWordCount, setCapturedWordCount] = useState(0);
  const [feedback, setFeedback] = useState(textFor("scanner.guide_start", "Place the full page inside the frame."));
  const guidance = mode === "notes"
    ? [
        textFor("scanner.note_tip_1", "Fill the frame with one notes page."),
        textFor("scanner.note_tip_2", "Flatten curved notebook pages."),
        textFor("scanner.note_tip_3", "Avoid shadows across handwriting."),
        textFor("scanner.note_tip_4", "Hold still until the capture finishes."),
      ]
    : [
        textFor("scanner.tip_1", "Get all four page corners inside the frame."),
        textFor("scanner.tip_2", "Move closer until the text looks crisp."),
        textFor("scanner.tip_3", "Use bright, even light. Avoid glare."),
        textFor("scanner.tip_4", "Keep the phone parallel to the page."),
      ];
  const readyScore = (permission?.granted ? 34 : 0) + (cameraReady ? 33 : 0) + (captureState === "aiming" || captureState === "ready" ? 33 : 0);
  const busy = captureState === "capturing" || captureState === "reading";

  useEffect(() => {
    if (!permission?.granted || busy) return;
    const id = setInterval(() => {
      setGuidanceIndex((current) => {
        const next = (current + 1) % guidance.length;
        setFeedback(guidance[next]);
        return next;
      });
    }, 1800);
    return () => clearInterval(id);
  }, [busy, guidance, permission?.granted]);

  const analyzeCapturedText = (sourceText: string, sourceName: string) => {
    const batch = mode === "notes" ? analyzeNotes(sourceText, data) : analyzeSyllabus(sourceText, data);
    setCurrentImport({ ...batch, sourceName });
    nav.push("review");
  };

  const resetCapture = () => {
    setCapturedText("");
    setCapturedWordCount(0);
    setCaptureState("aiming");
    setFeedback(guidance[guidanceIndex] || textFor("scanner.guide_start", "Place the full page inside the frame."));
  };

  const useCapturedText = (text: string, wordCount: number) => {
    setFeedback(textFor("scanner.ready_review", "Text found. Review every row before anything saves."));
    analyzeCapturedText(text, `${mode === "notes" ? "Guided notes" : "Guided syllabus"} camera scan - ${wordCount} words`);
  };

  const capture = async () => {
    if (!cameraReady || busy) return;
    setCaptureState("capturing");
    setFeedback(textFor("scanner.hold", "Hold still. Capturing the page..."));
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.96, skipProcessing: false });
      if (!photo?.uri) throw new Error(textFor("scanner.capture_failed", "The camera did not return a photo."));
      setCaptureState("reading");
      setFeedback(textFor("scanner.reading", "Reading text. This works best with crisp, flat pages."));
      const text = await extractTextFromImage(photo.uri);
      const wordCount = countOcrWords(text);
      if (wordCount < 35) {
        setCaptureState("aiming");
        setFeedback(textFor("scanner.weak", "Text looks thin. Retake with the page closer and brighter."));
        Alert.alert(
          textFor("scanner.weak_title", "Retake recommended"),
          textFor("scanner.weak_body", "Only {count} words were found. Move closer, keep all corners visible, and avoid shadows.", { count: wordCount }),
          [
            { text: textFor("scanner.use_anyway", "Use anyway"), onPress: () => useCapturedText(text, wordCount) },
            { text: textFor("scan.paste_text", "Paste text"), onPress: () => nav.push("paste", { mode }) },
            { text: textFor("scanner.retake", "Retake"), style: "cancel" },
          ]
        );
        return;
      }
      setCapturedText(text);
      setCapturedWordCount(wordCount);
      setCaptureState("ready");
      setFeedback(textFor("scanner.ready_review_count", "{count} words found. Review the extracted rows before saving.", { count: wordCount }));
    } catch (error) {
      setCaptureState("aiming");
      setFeedback(error instanceof Error ? error.message : textFor("scan.image_failed", "That image could not be scanned."));
    }
  };

  const pickPhotoFallback = async () => {
    if (busy) return;
    setCaptureState("reading");
    setFeedback(textFor("scan.opening_photos", "Opening photos..."));
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setCaptureState("aiming");
        setFeedback(textFor("scan.permission", "Permission is needed to read {mode} pages from the {target}.", { mode: mode === "notes" ? textFor("notes.title", "notes") : textFor("scan.header_preview", "syllabus"), target: "photo library" }));
        Alert.alert(textFor("scan.permission", "Permission needed", { mode: "", target: "" }), textFor("scan.permission", "Permission is needed to read {mode} pages from the {target}.", { mode: mode === "notes" ? textFor("notes.title", "notes") : textFor("scan.header_preview", "syllabus"), target: "photo library" }), [
          { text: textFor("scan.paste_text", "Paste text"), onPress: () => nav.push("paste", { mode }) },
          { text: textFor("scan.open_settings", "Open Settings"), onPress: () => Linking.openSettings().catch(() => {}) },
          { text: textFor("common.cancel", "Cancel"), style: "cancel" },
        ]);
        return;
      }
      if (permission.accessPrivileges === "limited") {
        setFeedback(textFor("scan.limited_photos", "Photo access is limited. Pick an allowed image, open Settings for more access, or paste text."));
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1, allowsEditing: false });
      if (result.canceled || !result.assets[0]?.uri) {
        resetCapture();
        return;
      }
      setFeedback(mode === "notes" ? textFor("scan.reading_notes", "Reading note text on this iPhone...") : textFor("scan.reading_syllabus", "Reading syllabus text on this iPhone..."));
      const text = await extractTextFromImage(result.assets[0].uri);
      const wordCount = countOcrWords(text);
      if (wordCount < 35) {
        setCaptureState("aiming");
        setFeedback(textFor("scanner.weak", "Text looks thin. Retake with the page closer and brighter."));
        Alert.alert(
          textFor("scanner.weak_title", "Retake recommended"),
          textFor("scanner.weak_body", "Only {count} words were found. Move closer, keep all corners visible, and avoid shadows.", { count: wordCount }),
          [
            { text: textFor("scanner.use_anyway", "Use anyway"), onPress: () => useCapturedText(text, wordCount) },
            { text: textFor("scan.paste_text", "Paste text"), onPress: () => nav.push("paste", { mode }) },
            { text: textFor("scanner.retake", "Retake"), style: "cancel" },
          ]
        );
        return;
      }
      setCapturedText(text);
      setCapturedWordCount(wordCount);
      setCaptureState("ready");
      setFeedback(textFor("scanner.ready_review_count", "{count} words found. Review the extracted rows before saving.", { count: wordCount }));
    } catch (error) {
      setCaptureState("aiming");
      setFeedback(error instanceof Error ? error.message : textFor("scan.image_failed", "That image could not be scanned."));
    }
  };

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: "#050507", alignItems: "center", justifyContent: "center" }}><ActivityIndicator color="#fff" /><Text selectable style={{ color: "#fff", fontWeight: "900", marginTop: 14 }}>{textFor("scanner.loading_camera", "Preparing camera...")}</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <BackHeader nav={nav} theme={theme} label={textFor("scan.camera", "Camera")} />
        <View style={{ padding: 18, gap: 14 }}>
          <Card theme={theme} style={{ padding: 18 }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: `${COLORS.orange}18`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}><Camera color={COLORS.orange} size={26} /></View>
            <Text selectable style={{ color: theme.label, fontSize: 24, lineHeight: 28, fontWeight: "900" }}>{textFor("scanner.permission_title", "Camera access is needed")}</Text>
            <Text selectable style={{ color: theme.label2, lineHeight: 21, marginTop: 8 }}>{textFor("scan.permission", "Permission is needed to read {mode} pages from the {target}.", { mode: mode === "notes" ? textFor("notes.title", "notes") : textFor("scan.header_preview", "syllabus"), target: "camera" })}</Text>
            <Button label={textFor("scanner.allow_camera", "Allow camera")} theme={theme} icon="camera" onPress={requestPermission} />
            <Button label={textFor("scan.open_settings", "Open Settings")} theme={theme} secondary icon="shield" onPress={() => Linking.openSettings()} />
            <Button label={textFor("scan.paste_text", "Paste text")} theme={theme} secondary icon="file" onPress={() => nav.push("paste", { mode })} />
          </Card>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#050507" }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        mode="picture"
        enableTorch={torch}
        animateShutter
        onCameraReady={() => {
          setCameraReady(true);
          setFeedback(guidance[guidanceIndex]);
        }}
        onMountError={(event) => setFeedback(event.message)}
      />
      <View pointerEvents="none" style={{ position: "absolute", left: 18, right: 18, top: 216, bottom: 230, borderRadius: 26, borderWidth: 2, borderColor: captureState === "ready" ? "rgba(74,222,128,0.95)" : cameraReady ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.60)", backgroundColor: "rgba(255,255,255,0.03)" }}>
        {[["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].map(([vertical, horizontal]) => (
          <View key={`${vertical}-${horizontal}`} style={{ position: "absolute", [vertical]: -2, [horizontal]: -2, width: 54, height: 54, borderColor: "#FFFFFF", borderTopWidth: vertical === "top" ? 5 : 0, borderBottomWidth: vertical === "bottom" ? 5 : 0, borderLeftWidth: horizontal === "left" ? 5 : 0, borderRightWidth: horizontal === "right" ? 5 : 0, borderRadius: 16 }} />
        ))}
        <View style={{ position: "absolute", left: 18, right: 18, top: "47%", height: 2, backgroundColor: "rgba(74,222,128,0.72)", borderRadius: 999 }} />
      </View>
      <View style={{ position: "absolute", left: 16, right: 16, top: 54, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={nav.back} style={{ width: 42, height: 42, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.54)", alignItems: "center", justifyContent: "center" }}><ChevronLeft color="#fff" size={23} /></Pressable>
          <View style={{ flex: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: "rgba(0,0,0,0.54)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }}>
            <Shield color={readyScore >= 100 ? COLORS.green : COLORS.orange} size={16} />
            <Text style={{ color: "#fff", fontWeight: "900" }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}>{mode === "notes" ? textFor("scanner.notes_mode", "Guided notes scan") : textFor("scanner.syllabus_mode", "Guided syllabus scan")}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Toggle torch" onPress={() => { tap(); setTorch((value) => !value); }} style={{ width: 42, height: 42, borderRadius: 999, backgroundColor: torch ? COLORS.orange : "rgba(0,0,0,0.54)", alignItems: "center", justifyContent: "center" }}><Zap color="#fff" size={21} /></Pressable>
        </View>
        <View style={{ borderRadius: 18, padding: 13, backgroundColor: "rgba(0,0,0,0.62)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: readyScore >= 100 ? `${COLORS.green}2A` : `${COLORS.orange}2A`, alignItems: "center", justifyContent: "center" }}>{busy ? <ActivityIndicator color="#fff" /> : <ScanLine color={readyScore >= 100 ? COLORS.green : COLORS.orange} size={22} />}</View>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>{captureState === "ready" ? textFor("scanner.ready_title", "Ready to review") : feedback}</Text>
              <Text selectable style={{ color: "rgba(255,255,255,0.72)", marginTop: 3, lineHeight: 18 }}>{textFor("scanner.promise", "Nothing saves until you review and approve the extracted rows.")}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 7, marginTop: 12 }}>
            <CameraChecklistPill label={textFor("scanner.check_corners", "Corners")} active={cameraReady} />
            <CameraChecklistPill label={textFor("scanner.check_light", "Light")} active={torch || cameraReady} />
            <CameraChecklistPill label={captureState === "ready" ? `${capturedWordCount}` : textFor("scanner.check_steady", "Steady")} active={!busy} />
          </View>
        </View>
      </View>
      <View style={{ position: "absolute", left: 16, right: 16, bottom: 34, gap: 12 }}>
        <View style={{ borderRadius: 18, padding: 13, backgroundColor: "rgba(0,0,0,0.62)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" }}>
          <Text selectable style={{ color: "#fff", fontWeight: "900", marginBottom: 8 }}>{captureState === "ready" ? textFor("scanner.after_capture", "Captured text") : textFor("scanner.before_capture", "Before capture")}</Text>
          {(captureState === "ready" ? [
            textFor("scanner.ready_rule_1", "{count} words found.", { count: capturedWordCount }),
            textFor("scanner.ready_rule_2", "Next screen lets you edit, approve, or remove every row."),
            textFor("scanner.ready_rule_3", "Retake if the page was cropped or blurry."),
          ] : [
            textFor("scanner.rule_1", "Page edges visible, not cropped."),
            textFor("scanner.rule_2", "Text is sharp enough to read on screen."),
            textFor("scanner.rule_3", "No fingers, glare, or dark shadows over text."),
          ]).map((item) => (
            <View key={item} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 }}>
              <CheckCircle2 color={COLORS.green} size={15} />
              <Text selectable style={{ color: "rgba(255,255,255,0.84)", flex: 1 }}>{item}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={captureState === "ready" ? textFor("scanner.retake", "Retake") : textFor("scan.paste_text", "Paste text")} disabled={busy} onPress={() => captureState === "ready" ? resetCapture() : nav.push("paste", { mode })} style={{ width: 58, height: 58, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center", opacity: busy ? 0.5 : 1 }}>{captureState === "ready" ? <RefreshCw color="#fff" size={23} /> : <FileText color="#fff" size={23} />}</Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={captureState === "ready" ? textFor("review.title", "Review Import") : textFor("scanner.capture", "Capture page")} accessibilityState={{ disabled: !cameraReady || busy, busy }} disabled={!cameraReady || busy} onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); captureState === "ready" ? useCapturedText(capturedText, capturedWordCount) : capture(); }} style={({ pressed }) => ({ width: 82, height: 82, borderRadius: 999, backgroundColor: "#FFFFFF", borderWidth: 6, borderColor: captureState === "ready" ? COLORS.green : readyScore >= 100 ? COLORS.green : COLORS.orange, alignItems: "center", justifyContent: "center", opacity: !cameraReady || busy ? 0.6 : pressed ? 0.78 : 1 })}>
            {busy ? <ActivityIndicator color="#111" /> : captureState === "ready" ? <Check color={COLORS.green} size={42} strokeWidth={3} /> : <View style={{ width: 54, height: 54, borderRadius: 999, backgroundColor: readyScore >= 100 ? COLORS.green : COLORS.orange }} />}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={textFor("scan.photo", "Photo")} disabled={busy} onPress={pickPhotoFallback} style={{ width: 58, height: 58, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center", opacity: busy ? 0.5 : 1 }}><Image color="#fff" size={23} /></Pressable>
        </View>
      </View>
    </View>
  );
}

function CameraChecklistPill({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={{ flex: 1, minHeight: 31, borderRadius: 999, backgroundColor: active ? "rgba(74,222,128,0.20)" : "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: active ? "rgba(74,222,128,0.42)" : "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center", paddingHorizontal: 7 }}>
      <Text style={{ color: active ? "#BDFBD3" : "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: "900" }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.66}>{label}</Text>
    </View>
  );
}

function PasteImport({ data, nav, theme, params, setCurrentImport }: ScreenProps) {
  const mode = data.prefs.premium && params.mode === "notes" ? "notes" : "syllabus";
  const [text, setText] = useState("");
  const [working, setWorking] = useState(false);
  const analyze = () => {
    if (!text.trim()) {
      Alert.alert(textFor("paste.add_text_title", "Add text first"), mode === "notes" ? textFor("paste.notes_required", "Paste notes to summarize and turn into study assets.") : textFor("paste.syllabus_required", "Paste syllabus text to extract classes, assignments, and exams."));
      return;
    }
    setWorking(true);
    setTimeout(() => {
      const batch = mode === "notes" ? analyzeNotes(text, data) : analyzeSyllabus(text, data);
      setCurrentImport(batch);
      setWorking(false);
      nav.push("review");
    }, 650);
  };
  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label={mode === "notes" ? textFor("notes.paste", "Paste notes") : textFor("option.paste_syllabus", "Paste syllabus")} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text selectable style={{ color: theme.label, fontSize: 26, fontWeight: "900", marginBottom: 8 }}>{mode === "notes" ? textFor("paste.notes_title", "Notes become a study set.") : textFor("paste.syllabus_title", "syllabus becomes a semester.")}</Text>
        <Text selectable style={{ color: theme.label2, lineHeight: 21, marginBottom: 14 }}>{data.prefs.premium ? textFor("paste.premium_sub", "Review everything before it saves.") : textFor("paste.preview_sub", "Preview what StudyPlanner finds before you unlock.")}</Text>
        <TextInput multiline value={text} onChangeText={setText} placeholder={mode === "notes" ? textFor("paste.notes_placeholder", "Paste lecture notes, reading notes, or review material...") : textFor("paste.syllabus_placeholder", "Paste syllabus text, assignment sheets, or extracted PDF text...")} placeholderTextColor={theme.label3} textAlignVertical="top" style={{ minHeight: 290, borderRadius: 18, backgroundColor: theme.surface, color: theme.label, borderWidth: 1, borderColor: theme.hairline, padding: 16, fontSize: 15, lineHeight: 22 }} />
        <Button label={working ? textFor("paste.reading", "Reading...") : textFor("review.title", "Review import")} icon="sparkles" theme={theme} onPress={working ? undefined : analyze} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ReviewImport({ data, mutate, nav, theme, currentImport, setCurrentImport, recordReviewTrigger }: ScreenProps) {
  const batch = currentImport;
  const [applying, setApplying] = useState(false);
  if (!batch) return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label={textFor("review.title", "Review Import")} />
      <View style={{ padding: 18 }}>
        <Card theme={theme} style={{ padding: 18 }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: `${COLORS.blue}18`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <ScanLine color={COLORS.blue} size={26} />
          </View>
          <Text selectable style={{ color: theme.label, fontSize: 24, lineHeight: 28, fontWeight: "900" }}>{textFor("review.empty_title", "No import is waiting")}</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 21, marginTop: 8 }}>{textFor("review.empty_body", "Scan, paste, or upload a syllabus first. Nothing saves until you approve the review rows.")}</Text>
          <Button label={textFor("scan.camera", "Camera")} theme={theme} icon="camera" onPress={() => nav.push("cameraScanner", { mode: "syllabus" })} />
          <Button label={textFor("scan.paste_text", "Paste text")} theme={theme} secondary icon="file" onPress={() => nav.push("paste", { mode: "syllabus" })} />
          <Button label={textFor("scan.header", "Scan")} theme={theme} secondary icon="scan" onPress={() => nav.push("scan")} />
        </Card>
      </View>
    </View>
  );
  const update = (id: string, patch: Partial<ImportCandidate>) => setCurrentImport({ ...batch, candidates: batch.candidates.map((c) => c.id === id ? { ...c, ...patch } : c) });
  const updateTitle = (item: ImportCandidate, title: string) => {
    const payload: any = { ...item.payload };
    if (item.kind === "class") {
      const [codePart, namePart] = title.split("·").map((part) => part.trim());
      payload.code = codePart || payload.code;
      payload.name = namePart || codePart || payload.name;
    } else {
      payload.title = title;
    }
    update(item.id, { title, payload });
  };
  const updatePayload = (item: ImportCandidate, patch: Record<string, unknown>, candidatePatch: Partial<ImportCandidate> = {}) => {
    const payload: any = { ...item.payload, ...patch };
    let meta = item.meta;
    if (item.kind === "task") {
      meta = `${payload.type || textFor("class.assignment", "Assignment")} · ${payload.missing ? textFor("task.awaiting_date", "Awaiting Date") : `${previewFixtureText("due", "due")} ${payload.dueDate || previewFixtureText("tbd", "TBD")}`} · ${payload.time || previewFixtureText("tbd", "TBD")}`;
    }
    if (item.kind === "exam") {
      meta = `${payload.missing ? textFor("task.awaiting_date", "Awaiting Date") : payload.dueDate || previewFixtureText("tbd", "TBD")} · ${payload.time || previewFixtureText("tbd", "TBD")} · ${payload.room || previewFixtureText("roomTbd", "Room TBD")}`;
    }
    if (item.kind === "class") {
      meta = `${payload.days || previewFixtureText("daysTbd", "Days TBD")} · ${payload.time || previewFixtureText("timeTbd", "Time TBD")} · ${payload.room || previewFixtureText("roomTbd", "Room TBD")}`;
    }
    update(item.id, { payload, meta, classId: typeof payload.classId === "string" ? payload.classId : item.classId, ...candidatePatch });
  };
  const updateDueDate = (item: ImportCandidate, value: string) => {
    const clean = value.trim();
    if (!clean) {
      updatePayload(item, { dueDate: "", missing: true, invalidDate: undefined });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      updatePayload(item, { dueDate: "", missing: true, invalidDate: clean }, { approved: false });
      return;
    }
    updatePayload(item, { dueDate: clean, missing: false, invalidDate: undefined });
  };
  const approveTrusted = () => setCurrentImport({
    ...batch,
    candidates: batch.candidates.map((candidate) => candidate.confidence >= 0.85 && !(candidate.payload as any).invalidDate ? { ...candidate, approved: true } : candidate),
  });
  const apply = () => {
    if (applying) return;
    const approvedCount = batch.candidates.filter((candidate) => candidate.approved).length;
    if (!approvedCount) {
      Alert.alert(textFor("review.none_selected_title", "Nothing selected"), textFor("review.none_selected_body", "Approve at least one class, assignment, exam, or note before continuing."));
      return;
    }
    if (!data.prefs.premium) {
      nav.push("paywall");
      return;
    }
    setApplying(true);
    mutate((d) => {
      const reconciledData = batch.candidates.reduce((current, candidate) => {
        if (!candidate.approved || candidate.reconciliationChoice !== "update") return current;
        const match = findImportMatch(current, candidate);
        return match ? applyImportUpdateToData(current, candidate, match) : current;
      }, d);
      const candidates = batch.candidates.map((candidate) => {
        const match = findImportMatch(reconciledData, candidate);
        if (!candidate.approved || !match) return candidate;
        if (candidate.reconciliationChoice === "duplicate") return candidate;
        return { ...candidate, approved: false };
      });
      return applyImport(reconciledData, { ...batch, candidates });
    });
    setCurrentImport(null);
    nav.push("success");
    recordReviewTrigger("import_applied");
  };
  const groups = ["class", "task", "exam", "note"] as const;
  const approved = batch.candidates.filter((candidate) => candidate.approved);
  const approvedCount = approved.length;
  const classesFound = approved.filter((candidate) => candidate.kind === "class").length;
  const assignmentsFound = approved.filter((candidate) => candidate.kind === "task").length;
  const examsFound = approved.filter((candidate) => candidate.kind === "exam").length;
  const pressureWeek = assignmentsFound + examsFound >= 5 ? previewText("busy", "Heavy") : assignmentsFound + examsFound >= 2 ? localizedNarrativeText("pressure", "Moderate") : previewText("clear", "Light");
  const firstAction = approved.find((candidate) => candidate.kind === "task" || candidate.kind === "exam")?.title || textFor("review.first_deadline", "Review your first deadline");
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label={textFor("review.title", "Review Import")} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 118 }}>
        <Card theme={theme} style={{ padding: 14, flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 16 }}><Lock color={COLORS.green} size={19} /><Text selectable style={{ color: theme.label, flex: 1, lineHeight: 20 }}><Text style={{ fontWeight: "900" }}>{data.prefs.premium ? textFor("review.guard_active", "Nothing saves until you approve.") : textFor("review.guard_preview", "Preview only.")}</Text> {data.prefs.premium ? textFor("review.guard_active_body", "Edit, remove, or confirm each item.") : textFor("review.guard_preview_body", "Unlock to apply this semester to the real app.")}</Text></Card>
        <Card theme={theme} style={{ padding: 16, marginBottom: 16, backgroundColor: theme.dark ? "#17171C" : "#FFFFFF" }}>
          <Text selectable style={{ color: theme.label, fontSize: 19, fontWeight: "900", marginBottom: 12 }}>{textFor("review.found", "StudyPlanner found your semester.")}</Text>
          <View style={{ flexDirection: "row", gap: 9, marginBottom: 12 }}>
            <MiniMetric value={classesFound} label={textFor("review.classes", "classes")} color={COLORS.blue} theme={theme} />
            <MiniMetric value={assignmentsFound} label={textFor("review.assignments", "assignments")} color={COLORS.orange} theme={theme} />
            <MiniMetric value={examsFound} label={textFor("review.exams", "exams")} color={COLORS.purple} theme={theme} />
          </View>
          <View style={{ padding: 13, borderRadius: 16, backgroundColor: theme.surface2 }}>
            <Text selectable style={{ color: theme.label, fontWeight: "900" }}>{textFor("review.pressure_preview", "Pressure preview")}: {pressureWeek}</Text>
            <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 4 }}>{textFor("review.first_action", "First recommended action")}: {firstAction}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 9, marginTop: 12 }}>
            <View style={{ flex: 1 }}><Button label={textFor("review.approve", "Approve trusted")} theme={theme} icon="target" onPress={approveTrusted} /></View>
            <View style={{ flex: 1 }}><Button label={textFor("review.manual", "Manual setup")} theme={theme} secondary icon="plus" onPress={() => nav.tab("classes")} /></View>
          </View>
        </Card>
        {batch.candidates.length === 0 || batch.candidates.every((candidate) => candidate.confidence < 0.75) ? (
          <Card theme={theme} style={{ padding: 16, marginBottom: 16, backgroundColor: theme.dark ? "#2A2018" : "#FFF7E8" }}>
            <Text selectable style={{ color: theme.label, fontSize: 18, fontWeight: "900" }}>{textFor("review.weak_title", "Extraction looks weak.")}</Text>
            <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 5 }}>{textFor("review.weak_body", "Use the rows below only if they match the syllabus. You can retry, paste text, or build the semester manually.")}</Text>
            <View style={{ flexDirection: "row", gap: 9, marginTop: 10 }}>
              <View style={{ flex: 1 }}><Button label={textFor("review.retry", "Retry")} theme={theme} icon="refresh" onPress={() => nav.tab("scan")} /></View>
              <View style={{ flex: 1 }}><Button label={textFor("scan.paste_text", "Paste text")} theme={theme} secondary icon="file" onPress={() => nav.push("paste", { mode: "syllabus" })} /></View>
            </View>
          </Card>
        ) : null}
        {groups.map((kind) => {
          const items = batch.candidates.filter((c) => c.kind === kind);
          if (!items.length) return null;
          return <View key={kind} style={{ marginBottom: 18 }}><Section title={textFor("review.items_found", "{kind} found", { kind: localizedKindLabel(kind) })} action={`${items.filter((i) => i.approved).length}/${items.length}`} theme={theme} /><Card theme={theme} style={{ overflow: "hidden" }}>{items.map((item) => {
            const rowClass = safeClassFor(data, item.classId);
            const payload: any = item.payload;
            const match = findImportMatch(data, item);
            const choice = item.reconciliationChoice || (match ? "keep" : "duplicate");
            const confColor = item.confidence >= 0.9 ? COLORS.green : item.confidence >= 0.75 ? COLORS.blue : COLORS.orange;
            const invalidDate = typeof payload.invalidDate === "string" && payload.invalidDate.trim();
            return (
              <View key={item.id} style={{ padding: 13, opacity: item.approved ? 1 : 0.45, borderBottomWidth: 1, borderBottomColor: theme.hairline }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
                  <ClassGlyph c={rowClass} size={32} />
                  <View style={{ flex: 1 }}>
                    <TextInput accessibilityLabel={`${localizedKindLabel(item.kind)} title`} accessibilityHint="Edit the imported row title before approving it." value={item.title} onChangeText={(title) => updateTitle(item, title)} style={{ color: theme.label, fontSize: 14.5, fontWeight: "900", padding: 0 }} />
                    <Text selectable numberOfLines={1} style={{ color: theme.label2 }}>{item.meta}</Text>
                  </View>
                  <Pill text={item.confidence >= 0.9 ? textFor("review.high", "High") : item.confidence >= 0.75 ? textFor("review.good", "Good") : textFor("review.title", "Review")} color={confColor} theme={theme} />
                  <Pressable accessibilityRole="checkbox" accessibilityLabel={`${item.approved ? "Unapprove" : "Approve"} ${item.title}`} accessibilityHint={invalidDate ? textFor("review.invalid_date", "Enter a valid YYYY-MM-DD date before approving this row.") : "Toggle whether this row will be applied."} accessibilityState={{ checked: item.approved, disabled: Boolean(invalidDate) }} disabled={Boolean(invalidDate)} onPress={() => update(item.id, { approved: !item.approved })}>{item.approved ? <CheckCircle2 color={COLORS.green} /> : <Circle color={invalidDate ? COLORS.orange : theme.label3} />}</Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.title}`} accessibilityHint="Deletes this row from the import review." onPress={() => setCurrentImport({ ...batch, candidates: batch.candidates.filter((c) => c.id !== item.id) })}><Trash2 color={theme.label3} size={19} /></Pressable>
                </View>
                {item.confidence < 0.75 ? <Text selectable style={{ color: COLORS.orange, marginTop: 8, fontWeight: "800" }}>{textFor("review.needs_review", "Needs review")}: {textFor("review.needs_review_body", "StudyPlanner is not confident this row is complete.")}</Text> : null}
                {invalidDate ? <Text selectable accessibilityRole="alert" style={{ color: COLORS.orange, marginTop: 8, fontWeight: "900" }}>{textFor("review.invalid_date", "Enter a valid YYYY-MM-DD date before approving this row.")}</Text> : null}
                {match ? (
                  <View style={{ marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: theme.surface2 }}>
	                    <Text selectable style={{ color: theme.label, fontWeight: "900" }}>{textFor("review.needs_review", "Needs review")}: {match.label}</Text>
                    {match.oldDate && match.newDate && match.oldDate !== match.newDate ? <Text selectable style={{ color: COLORS.orange, fontWeight: "900", marginTop: 4 }}>{match.oldDate} to {match.newDate}</Text> : null}
                    <Text selectable style={{ color: theme.label2, lineHeight: 19, marginTop: 4 }}>{textFor("review.reconcile_hint", "Choose how to handle this import row. StudyPlanner will not overwrite or duplicate it silently.")}</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                      {[
	                        ["keep", textFor("common.close", "Keep existing")],
	                        ["update", textFor("common.edit", "Update existing")],
	                        ["duplicate", textFor("common.save", "Create duplicate")],
                      ].map(([value, label]) => (
                        <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${label} for ${item.title}`} accessibilityState={{ selected: choice === value }} onPress={() => update(item.id, { reconciliationChoice: value as ImportCandidate["reconciliationChoice"], approved: !invalidDate })} style={{ paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: choice === value ? theme.accent : theme.surface }}>
                          <Text style={{ color: choice === value ? "#fff" : theme.label, fontWeight: "900" }}>{label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}
                {item.kind === "class" ? (
                  <View style={{ marginTop: 10 }}>
                    <View style={{ flexDirection: "row", gap: 8 }}>
	                      <View style={{ flex: 1 }}><FieldInput label={textFor("class.schedule", "Days")} value={payload.days || ""} onChangeText={(days) => updatePayload(item, { days })} theme={theme} /></View>
	                      <View style={{ flex: 1 }}><FieldInput label={textFor("class.schedule", "Time")} value={payload.time || ""} onChangeText={(time) => updatePayload(item, { time })} theme={theme} /></View>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
	                      <View style={{ flex: 1 }}><FieldInput label={textFor("assessment.room", "Room")} value={payload.room || ""} onChangeText={(room) => updatePayload(item, { room })} theme={theme} /></View>
	                      <View style={{ flex: 1 }}><FieldInput label={textFor("class.schedule", "Professor")} value={payload.professor || ""} onChangeText={(professor) => updatePayload(item, { professor })} theme={theme} /></View>
                    </View>
                  </View>
                ) : null}
                {(item.kind === "task" || item.kind === "exam") ? (
                  <View style={{ marginTop: 10 }}>
                    <View style={{ flexDirection: "row", gap: 8 }}>
	                      <View style={{ flex: 1 }}><FieldInput label={textFor("task.due", "Due date")} value={payload.missing ? "" : payload.dueDate || ""} onChangeText={(dueDate) => updateDueDate(item, dueDate)} placeholder="YYYY-MM-DD" theme={theme} /></View>
	                      <View style={{ flex: 1 }}><FieldInput label={textFor("class.schedule", "Time")} value={payload.time || ""} onChangeText={(time) => updatePayload(item, { time })} theme={theme} /></View>
                    </View>
	                    {payload.missing ? <Text selectable style={{ color: COLORS.orange, fontWeight: "900", marginBottom: 8 }}>{textFor("task.save_awaiting", "Awaiting Date")}</Text> : null}
                    {item.kind === "task" ? (
                      <View style={{ flexDirection: "row", gap: 8 }}>
	                        <View style={{ flex: 1 }}><FieldInput label={textFor("class.assignment", "Type")} value={payload.type || ""} onChangeText={(type) => updatePayload(item, { type })} theme={theme} /></View>
              <View style={{ flex: 1 }}><FieldInput label={textFor("class.effort", "Effort")} value={String(payload.estimateMinutes || "")} onChangeText={(estimateMinutes) => updatePayload(item, { estimateMinutes: Number(estimateMinutes) || 45 })} theme={theme} /></View>
                      </View>
                    ) : null}
                    {data.classes.length ? (
                      <View>
	                        <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "900", marginBottom: 7 }}>{textFor("tabs.classes", "Class")}</Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{data.classes.filter((klass) => !klass.archivedAt).map((klass) => (
                          <Pressable key={klass.id} accessibilityRole="button" accessibilityLabel={`Assign ${item.title} to ${klass.code}`} accessibilityState={{ selected: (payload.classId || item.classId) === klass.id }} onPress={() => updatePayload(item, { classId: klass.id })} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: (payload.classId || item.classId) === klass.id ? klass.color : theme.surface2 }}><Text style={{ color: (payload.classId || item.classId) === klass.id ? "#fff" : theme.label, fontWeight: "900" }}>{klass.code}</Text></Pressable>
                        ))}</View>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}</Card></View>;
        })}
      </ScrollView>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 34, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.hairline }}><Button label={applying ? textFor("review.applying", "Applying...") : data.prefs.premium ? textFor("review.apply", "Apply schedule") : textFor("review.unlock", "Unlock my semester")} icon={data.prefs.premium ? "target" : "crown"} theme={theme} onPress={approvedCount ? apply : undefined} /><Text selectable style={{ color: approvedCount ? theme.label2 : COLORS.orange, textAlign: "center", marginTop: 8 }}>{approvedCount ? textFor("review.approved_footer", "{count} approved items · {state}", { count: approvedCount, state: data.prefs.premium ? textFor("review.editable_later", "editable later") : textFor("review.locked_until_premium", "locked until premium") }) : textFor("review.approve_one", "Approve at least one item to continue")}</Text></View>
    </View>
  );
}

function ApplySuccess({ data, nav, theme }: ScreenProps) {
  const semester = buildSemesterSnapshot(data);
  const narrative = buildSemesterNarrative(data, semester);
  const [step, setStep] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const steps = [textFor("success.step_reading", "Reading syllabus"), textFor("success.step_deadlines", "Finding deadlines"), textFor("success.step_schedule", "Building schedule"), textFor("success.step_health", "Calculating Semester Health"), textFor("success.step_next", "Preparing next move")];
  useEffect(() => {
    if (step >= steps.length) return;
    const id = setTimeout(() => setStep((current) => current + 1), 360);
    return () => clearTimeout(id);
  }, [step]);
  const ready = step >= steps.length;
  useEffect(() => {
    if (!ready) return;
    pulse.setValue(0);
    Animated.timing(pulse, { toValue: 1, duration: 760, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [pulse, ready]);
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.18] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0] });
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: 80, paddingHorizontal: 22, paddingBottom: 34, gap: 16 }}>
        <View style={{ alignItems: "center", marginBottom: 4 }}>
          <View style={{ width: 104, height: 104, marginBottom: 22, alignItems: "center", justifyContent: "center" }}>
            {ready ? <Animated.View style={{ position: "absolute", width: 104, height: 104, borderRadius: 34, backgroundColor: COLORS.green, opacity: pulseOpacity, transform: [{ scale: pulseScale }] }} /> : null}
            <View style={{ width: 104, height: 104, borderRadius: 34, backgroundColor: ready ? COLORS.green : theme.surface, borderWidth: 1, borderColor: ready ? COLORS.green : theme.hairline, alignItems: "center", justifyContent: "center" }}>
            {ready ? <Check color="#fff" size={58} strokeWidth={2.4} /> : <ActivityIndicator color={theme.accent} />}
            </View>
          </View>
          <Text selectable style={{ color: theme.label, fontSize: 34, lineHeight: 37, fontWeight: "900", textAlign: "center" }}>{ready ? textFor("success.ready", "Semester Ready") : steps[Math.min(step, steps.length - 1)]}</Text>
          <Text selectable style={{ color: theme.label2, textAlign: "center", lineHeight: 21, marginTop: 8 }}>{ready ? textFor("success.built", "Built from your syllabus.") : textFor("success.building", "One local plan is taking shape.")}</Text>
        </View>
        {ready ? (
          <>
            <Card theme={theme} style={{ padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                {[
	                  [narrative.importSummary.classes, textFor("review.classes", "classes"), COLORS.blue],
	                  [narrative.importSummary.assignments, textFor("review.assignments", "assignments"), COLORS.orange],
	                  [narrative.importSummary.exams, textFor("review.exams", "exams"), COLORS.purple],
	                  [narrative.importSummary.highPressureWeeks, textFor("today.next_30", "pressure weeks"), COLORS.red],
                ].map(([value, label, color]) => (
                  <View key={label as string} style={{ flex: 1 }}>
                    <Text selectable style={{ color: color as string, fontSize: 24, fontWeight: "900" }}>{value}</Text>
                    <Text selectable numberOfLines={1} style={{ color: theme.label2, fontSize: 12, fontWeight: "800" }}>{label}</Text>
                  </View>
                ))}
              </View>
            </Card>
            <Card theme={theme} style={{ padding: 18 }}>
	              <Text selectable style={{ color: theme.label2, fontSize: 12, fontWeight: "900", marginBottom: 6 }}>{textFor("locked.health", "SEMESTER HEALTH")}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{ flex: 1 }}>
	                  <Text selectable style={{ color: theme.label, fontSize: 24, fontWeight: "900" }}>{localizedNarrativeText("state", narrative.state)}</Text>
	                  <Text selectable style={{ color: colorForState(narrative.colorState), lineHeight: 20, marginTop: 4, fontWeight: "900" }}>{localizedNarrativeText("driver", narrative.primaryDriver)}</Text>
                </View>
                <View style={{ width: 72, height: 72, borderRadius: 999, borderWidth: 8, borderColor: colorForState(narrative.colorState), alignItems: "center", justifyContent: "center" }}>
                  <Text selectable style={{ color: theme.label, fontSize: 24, fontWeight: "900" }}>{semester.semesterHealth.overallScore}</Text>
                  <Text selectable style={{ color: theme.label2, fontSize: 11, fontWeight: "800" }}>{textFor("health.score", "score")}</Text>
                </View>
              </View>
            </Card>
            <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#17171C" : "#FFFFFF" }}>
	              <Text selectable style={{ color: theme.label, fontWeight: "900", fontSize: 18 }}>{textFor("today.next_move", "Next Move")}</Text>
	              <Text selectable style={{ color: theme.label2, lineHeight: 21, marginTop: 5 }}>{localizedNarrativeText("next", narrative.nextMoveLabel)}. {localizedNarrativeText("detail", narrative.nextMoveDetail)}</Text>
            </Card>
	            {!data.prefs.premium ? <Text selectable style={{ color: theme.label2, textAlign: "center", lineHeight: 20 }}>{textFor("paywall.sub_import", "Your preview is ready. Unlock to apply it to the live dashboard, reminders, and widgets.")}</Text> : null}
	            <Button label={data.prefs.premium ? textFor("success.open_dashboard", "Open dashboard") : textFor("success.continue", "Continue")} theme={theme} onPress={() => data.prefs.premium ? nav.tab("today") : nav.push("paywall")} />
          </>
        ) : (
          <Card theme={theme} style={{ padding: 16 }}>
            {steps.map((label, index) => (
              <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 }}>
                {index < step ? <CheckCircle2 color={COLORS.green} size={18} /> : <Circle color={theme.label3} size={18} />}
                <View style={{ flex: 1 }}>
                  <Text selectable style={{ color: index <= step ? theme.label : theme.label2, fontWeight: "800" }}>{label}</Text>
                  {index === step ? <SkeletonLine theme={theme} width="84%" /> : null}
                </View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function SkeletonLine({ theme, width = "100%", height = 7 }: { theme: ReturnType<typeof palette>; width?: string | number; height?: number }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      Animated.timing(shimmer, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [shimmer]);
  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0.9] });
  return <Animated.View style={{ width: width as any, height, borderRadius: 999, backgroundColor: theme.surface2, opacity, marginTop: 7 }} />;
}

function Plan({ data, mutate, nav, theme, recordReviewTrigger }: ScreenProps) {
  const liveData = useMemo(() => activeSemesterData(data), [data]);
  const rebuild = () => mutate((d) => {
    const updated = { ...d, studyBlocks: buildStudyPlan(activeSemesterData(d)) };
    return withFeedback(d, updated, "reschedulePlan", { dimension: "workload" });
  });
  const complete = (id: string) => {
    const blockToToggle = liveData.studyBlocks.find((item) => item.id === id);
    if (blockToToggle && !blockToToggle.completed) recordReviewTrigger("focus_completed");
    mutate((d) => {
    const block = d.studyBlocks.find((item) => item.id === id);
    const updated = { ...d, studyBlocks: d.studyBlocks.map((b) => b.id === id ? { ...b, completed: !b.completed } : b) };
    return withFeedback(d, updated, "completeStudyBlock", { classId: block?.classId, actionId: id, dimension: "preparedness" });
  });
  };
  const semester = buildSemesterSnapshot(liveData);
  const narrative = buildSemesterNarrative(liveData, semester);
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthLabel = today.toLocaleDateString(appLocale(), { month: "long", year: "numeric" });
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const leading = (monthStart.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, index) => index - leading + 1);
  const isoForDay = (day: number) => new Date(today.getFullYear(), today.getMonth(), day).toISOString().slice(0, 10);
  const selectedIso = isoForDay(selectedDay);
  const itemsForDay = (day: number) => {
    if (day < 1 || day > daysInMonth) return { tasks: [], exams: [], notes: [], blocks: [] as StudyBlock[] };
    const iso = isoForDay(day);
    return {
      tasks: liveData.tasks.filter((task) => !task.missing && task.dueDate === iso && !task.done),
      exams: liveData.exams.filter((exam) => exam.dueDate === iso),
      notes: liveData.notes.filter((note) => note.createdAt.slice(0, 10) === iso),
      blocks: liveData.studyBlocks.filter((block) => block.date === iso || (!block.date && day === today.getDate() && (block.day === "Tonight" || block.day === "Today"))),
    };
  };
  const selectedItems = itemsForDay(selectedDay);
  const monthPressure = cells.reduce((sum, day) => {
    const items = itemsForDay(day);
    return sum + items.tasks.length + items.exams.length * 2 + items.blocks.length;
  }, 0);
  return (
    <Screen theme={theme}>
      <Header title={textFor("plan.title", "Plan")} sub={`${localizedNarrativeText("state", narrative.state)} · ${textFor("plan.sub_suffix", "semester autopilot")}`} theme={theme} right={<Pressable onPress={rebuild} style={{ padding: 10, backgroundColor: theme.surface, borderRadius: 99 }}><RefreshCw color={theme.accent} size={20} /></Pressable>} />
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        <Card theme={theme} style={{ padding: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View><Text selectable style={{ color: theme.label, fontSize: 22, fontWeight: "900" }}>{monthLabel}</Text><Text selectable style={{ color: theme.label2, marginTop: 2 }}>{monthPressure} {previewMetricLabel("signals", "signals")} · {localizedNarrativeText("pressure", narrative.pressureLabel)}</Text></View>
            <Pill text={textFor("plan.notes_feed", "{count} notes feed plan", { count: liveData.notes.length })} color={COLORS.purple} theme={theme} icon="note" />
          </View>
          <View style={{ flexDirection: "row", marginBottom: 6 }}>{Array.from({ length: 7 }, (_value, index) => localizedWeekdayNarrow(index)).map((d, index) => <Text key={`${d}${index}`} style={{ flex: 1, textAlign: "center", color: theme.label2, fontWeight: "900", fontSize: 12 }}>{d}</Text>)}</View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {cells.map((day, index) => {
              const inMonth = day >= 1 && day <= daysInMonth;
              const selected = day === selectedDay;
              const isToday = day === today.getDate();
              const items = itemsForDay(day);
              const pressure = items.tasks.length + items.exams.length * 2 + items.blocks.length + items.notes.length;
              return (
                <Pressable key={index} onPress={() => inMonth && setSelectedDay(day)} style={{ width: "14.285%", padding: 3 }}>
                  <View style={{ minHeight: 50, borderRadius: 12, padding: 5, alignItems: "center", justifyContent: "center", backgroundColor: selected ? theme.accent : isToday ? `${theme.accent}22` : "transparent", opacity: inMonth ? 1 : 0.25 }}>
                    <Text style={{ color: selected ? "#fff" : theme.label, fontWeight: selected || isToday ? "900" : "700", fontSize: 13 }}>{inMonth ? day : ""}</Text>
                    <View style={{ flexDirection: "row", gap: 2, minHeight: 6, marginTop: 4 }}>
                      {items.exams.length ? <View style={{ width: 5, height: 5, borderRadius: 99, backgroundColor: selected ? "#fff" : COLORS.purple }} /> : null}
                      {items.tasks.length ? <View style={{ width: 5, height: 5, borderRadius: 99, backgroundColor: selected ? "#fff" : COLORS.orange }} /> : null}
                      {items.blocks.length ? <View style={{ width: 5, height: 5, borderRadius: 99, backgroundColor: selected ? "#fff" : COLORS.green }} /> : null}
                      {items.notes.length ? <View style={{ width: 5, height: 5, borderRadius: 99, backgroundColor: selected ? "#fff" : COLORS.blue }} /> : null}
                    </View>
                    {pressure > 3 ? <Text style={{ color: selected ? "#fff" : COLORS.red, fontSize: 9, fontWeight: "900", marginTop: 1 }}>{previewMetricLabel("busy", "busy")}</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#241E33" : "#F7F0FF" }}><View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}><Icon name="sparkles" color={COLORS.purple} /><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{textFor("plan.autopilot", "Autopilot")}</Text></View><Text selectable style={{ color: theme.label, lineHeight: 21 }}>{localizedNarrativeText("next", narrative.nextMoveLabel)}. {localizedNarrativeText("detail", narrative.nextMoveDetail)}</Text><Text selectable style={{ color: theme.label2, marginTop: 7 }}>{localizedNarrativeText("driver", narrative.primaryDriver)}</Text>{semester.schedulePlan.changedSinceLastPlan.slice(0, 2).map((change) => <Text selectable key={change} style={{ color: theme.label2, marginTop: 7 }}>- {localizedNarrativeText("detail", change)}</Text>)}<View style={{ flexDirection: "row", gap: 7, marginTop: 12 }}>{semester.pressureForecast.weekLoads.map((load, index) => <View key={`${index}${load}`} style={{ flex: 1 }}><ProgressBar value={load / 100} color={load > 85 ? COLORS.red : load > 64 ? COLORS.orange : load > 38 ? COLORS.yellow : COLORS.green} theme={theme} height={8} /><Text style={{ color: theme.label2, textAlign: "center", fontSize: 10, marginTop: 4, fontWeight: "900" }}>{localizedWeekdayNarrow(index)}</Text></View>)}</View><Button label={textFor("plan.rebuild", "Rebuild plan")} theme={theme} icon="refresh" onPress={rebuild} /></Card>
        <View>
          <Section title={new Date(selectedIso).toLocaleDateString(appLocale(), { weekday: "short", month: "short", day: "numeric" })} action={`${selectedItems.tasks.length + selectedItems.exams.length + selectedItems.notes.length + selectedItems.blocks.length} ${previewMetricLabel("signals", "items")}`} theme={theme} />
          <Card theme={theme} style={{ overflow: "hidden" }}>
            {selectedItems.exams.map((exam) => { const c = safeClassFor(liveData, exam.classId); return <Pressable key={exam.id} onPress={() => nav.push("assessmentDetail", { id: exam.id })} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}><ClassGlyph c={c} size={34} /><View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{exam.title}</Text><Text selectable style={{ color: theme.label2 }}>{exam.time} · {exam.room}</Text></View><Pill text={localizedExamKind(exam.kind)} color={COLORS.purple} theme={theme} /></Pressable>; })}
            {selectedItems.tasks.map((task) => <TaskRow key={task.id} task={task} data={liveData} theme={theme} onToggle={() => {
              if (!task.done) recordReviewTrigger("assignment_completed");
              mutate((d) => {
                const updated = { ...d, tasks: d.tasks.map((t) => t.id === task.id ? { ...t, done: !t.done } : t) };
                return withFeedback(d, updated, "completeTask", { classId: task.classId, actionId: task.id, dimension: "workload" });
              });
            }} onOpen={() => nav.push("taskDetail", { id: task.id })} />)}
            {selectedItems.blocks.map((block) => { const c = safeClassFor(liveData, block.classId); return <Pressable key={block.id} onPress={() => nav.push("studySession", { id: block.id })} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}><ClassGlyph c={c} size={34} /><View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{block.title}</Text><Text selectable style={{ color: theme.label2 }}>{block.time} · {minutesLabel(block.minutes)}</Text></View><Pill text={textFor("plan.study", "Study")} color={COLORS.green} theme={theme} /></Pressable>; })}
            {selectedItems.notes.map((note) => <Pressable key={note.id} onPress={() => nav.push("noteDetail", { id: note.id })} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}><NotebookPen color={COLORS.blue} size={22} /><View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{note.title}</Text><Text selectable style={{ color: theme.label2 }}>{note.suggestedTasks.length} {textFor("plan.suggested_tasks", "suggested tasks")}</Text></View><ChevronRight color={theme.label3} size={16} /></Pressable>)}
            {!selectedItems.tasks.length && !selectedItems.exams.length && !selectedItems.blocks.length && !selectedItems.notes.length ? <View style={{ padding: 16 }}><Text selectable style={{ color: theme.label2 }}>{textFor("plan.clear_day", "Clear day.")}</Text></View> : null}
          </Card>
        </View>
        <Section title={textFor("plan.focus_blocks", "Focus blocks")} action={textFor("plan.regenerate", "Regenerate")} onAction={rebuild} theme={theme} />
        <View style={{ gap: 10 }}>{liveData.studyBlocks.map((b) => { const c = safeClassFor(liveData, b.classId); return <Pressable key={b.id} onPress={() => nav.push("studySession", { id: b.id })}><Card theme={theme} style={{ padding: 15, flexDirection: "row", gap: 12, alignItems: "center" }}><ClassGlyph c={c} size={40} /><View style={{ flex: 1 }}><View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 2 }}><Text selectable style={{ color: theme.label, fontWeight: "900", flex: 1 }}>{b.title}</Text>{b.source ? <Pill text={localizedStudyBlockSource(b.source)} color={b.source === "exam_prep" ? COLORS.purple : b.source === "missed_repair" ? COLORS.orange : COLORS.blue} theme={theme} /> : null}</View><Text selectable style={{ color: theme.label2 }}>{localizedStudyBlockDay(b.day)} · {b.time} · {minutesLabel(b.minutes)}</Text><Text selectable numberOfLines={2} style={{ color: theme.label2, marginTop: 5, lineHeight: 18 }}><Text style={{ fontWeight: "900", color: theme.label }}>{textFor("plan.why", "Why")}: </Text>{b.reason}</Text><Pressable onPress={(e) => { e.stopPropagation(); mutate((d) => {
          const updated = replanAfterMissedBlock({ ...d, studyBlocks: d.studyBlocks.map((block) => block.id === b.id ? { ...block, missed: true } : block) }, b);
          return withFeedback(d, updated, "missStudyBlock", { classId: b.classId, actionId: b.id, dimension: "consistency" });
        }); }}><Text style={{ color: COLORS.orange, fontWeight: "900", marginTop: 6 }}>{textFor("plan.missed", "Missed? make up tomorrow")}</Text></Pressable></View><Pressable onPress={(e) => { e.stopPropagation(); complete(b.id); }}>{b.completed ? <CheckCircle2 color={COLORS.green} /> : <Play color={theme.accent} />}</Pressable></Card></Pressable>; })}</View>
      </View>
    </Screen>
  );
}

function StudySession({ data, mutate, nav, theme, params, recordReviewTrigger }: ScreenProps) {
  const block = data.studyBlocks.find((b) => b.id === params.id) || data.studyBlocks[0];
  const task = data.tasks.find((t) => t.id === block?.taskId);
  const c = safeClassFor(data, block?.classId);
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const semester = buildSemesterSnapshot(data);
  const pulse = semester.classPulses.find((item) => item.classId === block?.classId);
  if (!block) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <BackHeader nav={nav} theme={theme} label={textFor("study.focus_session", "Focus Session")} />
        <View style={{ padding: 20, gap: 14 }}>
          <Text selectable style={{ color: theme.label, fontSize: 26, fontWeight: "900" }}>{textFor("study.no_blocks", "No blocks yet")}</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 21 }}>{textFor("study.no_blocks_body", "Import work, then rebuild.")}</Text>
          <Button label={textFor("plan.regenerate", "Regenerate plan")} theme={theme} icon="sparkles" onPress={() => mutate((d) => ({ ...d, studyBlocks: buildStudyPlan(d) }))} />
        </View>
      </View>
    );
  }
  const finish = () => mutate((d) => {
    const updated = {
      ...d,
      studyBlocks: d.studyBlocks.map((b) => b.id === block.id ? { ...b, completed: true } : b),
      tasks: task ? d.tasks.map((t) => t.id === task.id && answer.length > 30 ? { ...t, subtasks: t.subtasks.map((s, i) => i === 0 ? { ...s, done: true } : s) } : t) : d.tasks,
    };
    return withFeedback(d, updated, "completeStudyBlock", {
      classId: block.classId,
      actionId: block.id,
      dimension: "preparedness",
      message: `${c.code} prep saved.`,
    });
  });
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label={textFor("study.focus_session", "Focus Session")} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        <Card theme={theme} style={{ padding: 18 }}><View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}><ClassGlyph c={c} size={50} /><View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontSize: 22, fontWeight: "900" }}>{block.title}</Text><Text selectable style={{ color: theme.label2, marginTop: 3 }}>{localizedStudyBlockDay(block.day)} · {block.time} · {minutesLabel(block.minutes)}</Text></View></View></Card>
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#172019" : "#F1FFF6" }}><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 8 }}>{textFor("study.impact", "Impact")}</Text><Text selectable style={{ color: theme.label2, lineHeight: 21 }}>{c.code} {textFor("locked.preparedness", "preparedness")}. {pulse ? `${localizedPulseText("forecast", pulse.forecastLabel)} ${textFor("class.forecast", "forecast")}.` : localizedNarrativeText("detail", "Risk reduced.")}</Text></Card>
        <Card theme={theme} style={{ padding: 16 }}><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 8 }}>{textFor("study.goal", "Goal")}</Text><Text selectable style={{ color: theme.label2, lineHeight: 21 }}>{textFor("study.goal_body", "One item. Then recall.")}</Text></Card>
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#18222A" : "#EEF7FF" }}><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 8 }}>{textFor("study.active_recall", "Active recall")}</Text><Text selectable style={{ color: theme.label, lineHeight: 21 }}>{textFor("study.recall_body", "Explain it without looking.")}</Text><TextInput multiline value={answer} onChangeText={setAnswer} placeholder={textFor("study.recall_placeholder", "Type your recall answer...")} placeholderTextColor={theme.label3} style={{ minHeight: 120, backgroundColor: theme.surface, color: theme.label, borderRadius: 14, padding: 12, marginTop: 12, textAlignVertical: "top" }} /><Button label={score == null ? textFor("study.score_recall", "Score recall") : textFor("study.recall_score", "Recall score: {score}/10", { score })} theme={theme} icon="brain" onPress={() => setScore(Math.min(10, Math.max(3, Math.round(answer.split(/\s+/).filter(Boolean).length / 6))))} /></Card>
        <Button label={textFor("study.complete", "Complete session")} theme={theme} icon="check" onPress={() => { finish(); if (!block.completed) recordReviewTrigger("focus_completed"); nav.back(); }} />
      </ScrollView>
    </View>
  );
}

function Notes({ data, nav, theme }: ScreenProps) {
  const [filter, setFilter] = useState("all");
  const notes = filter === "all" ? data.notes : data.notes.filter((n) => n.classId === filter);
  const semester = buildSemesterSnapshot(data);
  const narrative = buildSemesterNarrative(data, semester);
  return (
    <Screen theme={theme}>
      <Header title={textFor("notes.title", "Notes")} sub={textFor("notes.sub", "{score} preparedness · {count} notes", { score: semester.semesterHealth.dimensions.preparedness.score, count: data.notes.length })} theme={theme} right={<Pressable onPress={() => nav.tab("scan")} style={{ width: 42, height: 42, borderRadius: 99, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }}><Camera color="#fff" /></Pressable>} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}><Card theme={theme} style={{ padding: 14 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{localizedNarrativeText("notes", narrative.notesNudge)}</Text><Text selectable style={{ color: theme.label2, marginTop: 4, lineHeight: 20 }}>{textFor("notes.body", "Notes raise Preparedness and sharpen Class Pulse.")}</Text></Card></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 14 }}>{[{ id: "all", code: textFor("notes.all", "All") }, ...data.classes].map((c: any) => <Pressable key={c.id} onPress={() => setFilter(c.id)} style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: filter === c.id ? theme.accent : theme.surface }}><Text style={{ color: filter === c.id ? "#fff" : theme.label2, fontWeight: "800" }}>{c.code}</Text></Pressable>)}</ScrollView>
      <View style={{ paddingHorizontal: 16, gap: 11 }}>{notes.length ? notes.map((n) => <NoteCard key={n.id} note={n} data={data} theme={theme} onOpen={() => nav.push("noteDetail", { id: n.id })} />) : (
        <Card theme={theme} style={{ padding: 18 }}>
          <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: `${COLORS.purple}1C`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}><NotebookPen color={COLORS.purple} size={24} /></View>
          <Text selectable style={{ color: theme.label, fontSize: 22, lineHeight: 26, fontWeight: "900" }}>{textFor("notes.empty_title", "No notes loaded")}</Text>
          <Text selectable style={{ color: theme.label2, lineHeight: 21, marginTop: 6 }}>{textFor("notes.empty_body", "Scan or paste lecture notes to build summaries, flashcards, quizzes, and review tasks.")}</Text>
          <Button label={textFor("notes.scan", "Scan notes")} theme={theme} icon="camera" onPress={() => nav.tab("scan")} />
          <Button label={textFor("notes.paste", "Paste notes")} theme={theme} secondary icon="file" onPress={() => nav.push("paste", { mode: "notes" })} />
        </Card>
      )}</View>
    </Screen>
  );
}

function NoteDetail({ data, mutate, nav, theme, params }: ScreenProps) {
  const note = data.notes.find((n) => n.id === params.id) || data.notes[0];
  if (!note) return <RecoveryScreen title={textFor("note.not_found", "Note not found")} body={textFor("note.not_found_body", "That note is not in this semester anymore.")} action={textFor("note.open_notes", "Open notes")} nav={nav} theme={theme} />;
  const c = safeClassFor(data, note.classId);
  const assets = generateStudyAssets(note, data);
  const insight = parseNoteInsights(note, data);
  const semester = buildSemesterSnapshot(data);
  const pulse = semester.classPulses.find((item) => item.classId === note.classId);
  const addTask = (title: string) => mutate((d) => {
    if (d.tasks.some((task) => task.title.toLowerCase() === title.toLowerCase() && task.classId === note.classId)) return d;
    const tasks = [{ id: `t_${Date.now()}`, title, classId: note.classId, type: "Review", dueOffset: 1, dueDate: isoFromOffset(1), time: "7:00 PM", estimateMinutes: 30, done: false, urgent: true, source: `Note · ${note.title}`, subtasks: [] }, ...d.tasks];
    const updated = { ...d, tasks };
    return withFeedback(d, { ...updated, studyBlocks: buildStudyPlan(updated) }, "reviewWeakConcept", { classId: note.classId, actionId: note.id, dimension: "preparedness" });
  });
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label={c.code} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}>
        <View><Pill text={c.code} color={c.color} theme={theme} /><Text selectable style={{ color: theme.label, fontSize: 26, fontWeight: "900", marginTop: 10 }}>{note.title}</Text></View>
        <Card theme={theme} style={{ padding: 16 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{textFor("note.effect", "Effect on {code}", { code: c.code })}</Text><Text selectable style={{ color: theme.label2, marginTop: 7, lineHeight: 20 }}>{pulse ? `${localizedPulseText("forecast", pulse.forecastLabel)}. ${localizedPulseText("nudge", pulse.nudge)}` : textFor("note.readiness_up", "Readiness up.")}</Text></Card>
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#241E33" : "#F7F0FF" }}><View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}><Icon name="sparkles" color={COLORS.purple} /><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{textFor("note.summary", "Summary")}</Text></View><Text selectable style={{ color: theme.label, lineHeight: 21 }}>{note.summary}</Text></Card>
        <View><Text selectable style={{ color: theme.label2, fontWeight: "900", marginBottom: 8 }}>{textFor("note.key_terms", "KEY TERMS")}</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{note.terms.map((t) => <Pill key={t} text={t} theme={theme} />)}</View></View>
        <View><Section title={textFor("note.signals", "Signals")} action={`${Math.round(insight.confidence * 100)}%`} theme={theme} /><Card theme={theme} style={{ padding: 15, gap: 12 }}><View><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 6 }}>{textFor("note.exam_topics", "Exam topics")}</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{insight.likelyExamTopics.slice(0, 6).map((topic) => <Pill key={topic} text={topic} color={COLORS.orange} theme={theme} />)}</View></View>{insight.formulas.length ? <View><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 6 }}>{textFor("note.formulas", "Formulas")}</Text>{insight.formulas.slice(0, 3).map((formula) => <Text selectable key={formula} style={{ color: theme.label2, marginTop: 3 }}>{formula}</Text>)}</View> : null}<View><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 6 }}>{textFor("note.weak_area", "Weak area")}</Text><Text selectable style={{ color: theme.label2, lineHeight: 20 }}>{insight.weakAreas[0]}</Text></View></Card></View>
        <View><Section title={textFor("note.suggested_tasks", "Suggested study tasks")} theme={theme} /><Card theme={theme} style={{ overflow: "hidden" }}>{note.suggestedTasks.map((t) => <View key={t} style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 14 }}><Icon name="target" color={COLORS.blue} /><Text selectable style={{ color: theme.label, flex: 1, fontWeight: "800" }}>{t}</Text><Pressable onPress={() => addTask(t)}><Pill text={textFor("note.add", "Add")} color={theme.accent} theme={theme} /></Pressable></View>)}</Card></View>
        <View><Section title={textFor("note.generated_assets", "Generated study assets")} action={`${assets.flashcards.length} ${textFor("note.cards", "cards")}`} theme={theme} /><Card theme={theme} style={{ padding: 15, gap: 12 }}>
          <View><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 8 }}>{textFor("note.flashcards", "Flashcards")}</Text>{assets.flashcards.slice(0, 3).map((card) => <View key={card.front} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.hairline }}><Text selectable style={{ color: theme.label, fontWeight: "800" }}>{card.front}</Text><Text selectable style={{ color: theme.label2, marginTop: 3 }}>{card.back}</Text></View>)}</View>
          <View><Text selectable style={{ color: theme.label, fontWeight: "900", marginBottom: 8 }}>{textFor("note.quiz", "Quiz")}</Text>{assets.quiz.slice(0, 2).map((q) => <View key={q.prompt} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.hairline }}><Text selectable style={{ color: theme.label, fontWeight: "800" }}>{q.prompt}</Text><Text selectable style={{ color: theme.label2, marginTop: 3 }}>{q.answer}</Text></View>)}</View>
          <Button label={textFor("note.add_review_task", "Add review task")} theme={theme} icon="target" onPress={() => addTask(`${textFor("review.title", "Review")} ${note.title}`)} />
        </Card></View>
        <Card theme={theme} style={{ padding: 16 }}><Text selectable style={{ color: theme.label2, fontWeight: "900", marginBottom: 8 }}>{textFor("note.source_text", "SOURCE TEXT")}</Text><Text selectable style={{ color: theme.label2, lineHeight: 21 }}>{note.sourceText}</Text></Card>
      </ScrollView>
    </View>
  );
}

function WidgetsScreen({ data, nav, theme, recordReviewTrigger }: ScreenProps) {
  const loop = buildSemesterLoop(data);
  const widgetRows = [
    [textFor("widgets.row_today", "StudyPlanner Today"), textFor("widgets.row_today_body", "Health, next deadline, and focus block"), "home", COLORS.blue],
    [textFor("widgets.row_upcoming", "Upcoming"), textFor("widgets.row_upcoming_body", "Assignments and exams coming soon"), "target", COLORS.orange],
    [textFor("widgets.row_week", "Week Load"), textFor("widgets.row_week_body", "Pressure by week"), "bar-chart-3", COLORS.purple],
    [textFor("widgets.row_class", "Class Progress"), textFor("widgets.row_class_body", "Selected class pulse"), "classes", COLORS.green],
  ];
  return (
    <Screen theme={theme}>
      <Header title={textFor("widgets.title", "Widgets")} sub={data.prefs.premium ? textFor("widgets.sub_ready", "Home Screen snapshots") : textFor("widgets.sub_locked", "Locked preview")} theme={theme} />
      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        <Card theme={theme} style={{ padding: 18, backgroundColor: theme.dark ? "#17171C" : "#FFFFFF" }}>
          <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
            <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: "#111114", alignItems: "center", justifyContent: "center" }}><Grid2X2 color="#fff" size={30} /></View>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: theme.label, fontSize: 21, lineHeight: 25, fontWeight: "900" }}>{data.prefs.premium ? textFor("widgets.ready_title", "Widgets are synced") : textFor("widgets.locked_title", "Unlock widgets")}</Text>
              <Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 4 }}>{data.prefs.premium ? textFor("widgets.ready_body", "{score} loop score ready for iOS widgets.", { score: loop.score }) : textFor("widgets.locked_body", "Apply a syllabus and unlock to keep widgets current.")}</Text>
            </View>
          </View>
          <Button label={data.prefs.premium ? textFor("widgets.sync", "Sync from dashboard") : textFor("widgets.locked_title", "Unlock widgets")} theme={theme} icon={data.prefs.premium ? "refresh" : "crown"} onPress={() => {
            if (data.prefs.premium) {
              recordReviewTrigger("widget_saved");
              nav.tab("today");
            } else {
              nav.push("paywall");
            }
          }} />
        </Card>
        {widgetRows.map(([title, body, icon, color]) => (
          <Card key={title as string} theme={theme} style={{ padding: 15, flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: `${color}1C`, alignItems: "center", justifyContent: "center" }}><Icon name={icon as string} color={color as string} /></View>
            <View style={{ flex: 1 }}>
              <Text selectable style={{ color: theme.label, fontWeight: "900" }}>{title}</Text>
              <Text selectable style={{ color: theme.label2, marginTop: 3 }}>{body}</Text>
            </View>
            <Pill text={data.prefs.premium ? textFor("widgets.ready", "ready") : textFor("widgets.locked", "locked")} color={data.prefs.premium ? COLORS.green : COLORS.orange} theme={theme} />
          </Card>
        ))}
      </View>
    </Screen>
  );
}

function Profile({ data, mutate, nav, theme }: ScreenProps) {
  const subscriptionAccountLabel = Platform.OS === "android" ? "Google Play account" : textFor("profile.apple_account", "Apple account");
  const rows = [
    ["bell", COLORS.red, textFor("profile.reminders", "Reminders"), textFor("profile.active_count", "{count} active", { count: data.reminders.filter((r) => r.enabled).length }), "reminders"],
    ["scan", COLORS.purple, textFor("profile.import_history", "Import history"), textFor("profile.import_count", "{count} imports", { count: data.imports.length }), "scan"],
    ["refresh", COLORS.blue, textFor("profile.manage_subscription", "Manage subscription"), subscriptionAccountLabel, "manage"],
    ["shield", COLORS.green, textFor("profile.privacy_policy", "Privacy Policy"), textFor("profile.studyplanner_data", "StudyPlanner data"), "privacy"],
    ["file", COLORS.orange, textFor("profile.terms_use", "Terms of Use"), textFor("profile.subscription_terms", "Subscription terms"), "terms"],
    ["file", COLORS.orange, textFor("common.support", "Support"), textFor("profile.email_help", "Email help"), "support"],
  ] as const;
  return (
    <Screen theme={theme}>
      <Header title={textFor("tabs.profile", "Profile")} sub={textFor("profile.active_semester", "Active semester")} theme={theme} />
      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        <Card theme={theme} style={{ padding: 18 }}><View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}><View style={{ width: 62, height: 62, borderRadius: 99, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#fff", fontSize: 26, fontWeight: "900" }}>{userInitial(data)}</Text></View><View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontSize: 24, fontWeight: "900" }}>{firstNameFromPrefs(data)}</Text><Text selectable style={{ color: theme.label2 }}>{optionText(data.prefs.level)} · {optionText(data.prefs.studentPersona || "School semester")}</Text><View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}><Pill text={data.prefs.premium ? textFor("profile.subscribed", "Subscribed") : textFor("profile.locked", "Locked")} color={data.prefs.premium ? COLORS.green : COLORS.orange} icon="crown" theme={theme} /><Pill text={textFor("profile.on_device", "On device")} color={COLORS.green} icon="shield" theme={theme} /></View></View></View><View style={{ marginTop: 18 }}><View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 7 }}><Text selectable style={{ color: theme.label2, fontWeight: "900" }}>{textFor("profile.semester_progress", "SEMESTER PROGRESS")}</Text><Text selectable style={{ color: theme.label2 }}>{data.classes.length ? textFor("profile.classes_count", "{count} classes", { count: data.classes.length }) : textFor("profile.no_semester", "No semester yet")}</Text></View><ProgressBar value={data.tasks.length ? data.tasks.filter((task) => task.done).length / data.tasks.length : 0} color={theme.accent} theme={theme} /></View></Card>
        <Pressable onPress={() => nav.push("paywall")}><View style={{ borderRadius: 22, padding: 18, backgroundColor: "#282139" }}><View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}><Crown color={COLORS.yellow} size={19} /><Text selectable style={{ color: "#fff", fontWeight: "900" }}>{textFor("profile.subscription", "StudyPlanner subscription")}</Text></View><Text selectable style={{ color: "rgba(255,255,255,.85)" }}>{textFor("profile.subscription_body", "Scans, reminders, study sets, and planning are active.")}</Text></View></Pressable>
        <Card theme={theme} style={{ overflow: "hidden" }}>{rows.map(([icon, color, title, value, route]) => <Pressable key={title} onPress={() => {
          if (route === "scan") nav.tab("scan");
          else if (route === "manage") openExternal(MANAGE_SUBSCRIPTION_URL);
          else if (route === "privacy" || route === "terms") nav.push(route);
          else if (route === "support") openExternal(SUPPORT_URL);
          else nav.push(route as Route);
        }} style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 14 }}><View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: `${color}1C`, alignItems: "center", justifyContent: "center" }}><Icon name={icon} color={color} size={18} /></View><Text selectable style={{ color: theme.label, flex: 1, fontWeight: "900" }}>{title}</Text><Text selectable style={{ color: theme.label2 }}>{value}</Text><ChevronRight color={theme.label3} size={16} /></Pressable>)}</Card>
      </View>
    </Screen>
  );
}

function Reminders({ data, mutate, nav, theme, params }: ScreenProps) {
  const semester = buildSemesterSnapshot(data);
  const initialReminderStatus = semester.notificationPlan.items[0]?.explanation
    ? localizedNarrativeText("detail", semester.notificationPlan.items[0].explanation)
    : textFor("reminders.default_status", "Enable reminders when you want this iPhone to schedule them.");
  const [status, setStatus] = useState(initialReminderStatus);
  const [scheduling, setScheduling] = useState(false);
  const validationStarted = useRef(false);
  const toggle = (id: string) => mutate((d) => {
    const reminder = d.reminders.find((item) => item.id === id);
    if (reminder?.enabled) cancelReminderNotificationIds(reminder.notificationIds || []).catch(() => {});
    return { ...d, reminders: d.reminders.map((r) => r.id === id ? { ...r, enabled: !r.enabled, notificationIds: r.enabled ? [] : r.notificationIds, scheduledFor: r.enabled ? [] : r.scheduledFor } : r) };
  });
  const addSmart = () => mutate((d) => ({ ...d, reminders: [...suggestSmartReminders(d).map((r, index) => ({ id: `r_${Date.now()}_${index}`, enabled: true, ...r })), ...d.reminders] }));
  const schedule = async (validation = false) => {
    setScheduling(true);
    try {
      const result = await scheduleLocalReminders(data, validation ? { includeValidationNotification: true, validationDelaySeconds: 60 } : {});
      setStatus(result.message);
      if (result.state === "scheduled" && result.reminders) {
        mutate((d) => ({ ...d, reminders: [...result.reminders!, ...d.reminders.filter((r) => !(r.notificationIds || []).length)] }));
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : textFor("reminders.schedule_failed", "Could not schedule reminders."));
    } finally {
      setScheduling(false);
    }
  };
  useEffect(() => {
    if (params.validation === "1" && !validationStarted.current) {
      validationStarted.current = true;
      schedule(true).catch(() => setScheduling(false));
    }
  }, [params.validation]);
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <BackHeader nav={nav} theme={theme} label={textFor("reminders.title", "Reminders")} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 18 }}>
        <Card theme={theme} style={{ padding: 16, backgroundColor: theme.dark ? "#241E33" : "#F7F0FF" }}><View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}><Icon name="sparkles" color={COLORS.purple} /><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{textFor("reminders.smart", "Smart reminders")}</Text></View><Text selectable style={{ color: theme.label, lineHeight: 21 }}>{status}</Text><Text selectable style={{ color: theme.label2, lineHeight: 20, marginTop: 8 }}>{localizedNarrativeText("next", semester.coachCopy.nextAction)}</Text><Button label={scheduling ? textFor("reminders.scheduling", "Scheduling...") : textFor("reminders.schedule", "Schedule")} theme={theme} onPress={scheduling ? undefined : schedule} /><Button label={textFor("reminders.add_suggestions", "Add suggestions")} secondary theme={theme} onPress={addSmart} /></Card>
        <Section title={textFor("reminders.active", "Active reminders")} theme={theme} />
        <Card theme={theme} style={{ overflow: "hidden" }}>{data.reminders.map((r) => { const c = safeClassFor(data, r.classId); return <View key={r.id} style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 14 }}><ClassGlyph c={c} size={34} /><View style={{ flex: 1 }}><Text selectable style={{ color: theme.label, fontWeight: "900" }}>{r.title}</Text><Text selectable style={{ color: theme.label2 }}>{r.lead}{r.room ? ` · ${r.room}` : ""}</Text></View><Pressable onPress={() => toggle(r.id)} style={{ width: 48, height: 29, borderRadius: 99, backgroundColor: r.enabled ? COLORS.green : theme.surface3, padding: 2, alignItems: r.enabled ? "flex-end" : "flex-start" }}><View style={{ width: 25, height: 25, borderRadius: 99, backgroundColor: "#fff" }} /></Pressable></View>; })}</Card>
      </ScrollView>
    </View>
  );
}

function HomePreview({ nav, theme }: ScreenProps) {
  useEffect(() => {
    nav.tab("today");
  }, [nav]);
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );
}

function LockPreview({ nav, theme }: ScreenProps) {
  useEffect(() => {
    nav.tab("today");
  }, [nav]);
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={theme.accent} />
    </View>
  );
}
