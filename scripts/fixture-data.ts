import { AppData } from "../src/types";
import { isoFromOffset, TODAY } from "../src/seed";

export { isoFromOffset, TODAY };

export const fixtureData: AppData = {
  prefs: {
    name: "Maya Chen",
    level: "Undergrad",
    semesterType: "Semesters",
    workloadStyle: "Balanced",
    studyPersonality: "Need a nudge",
    reminderStyle: "Standard",
    studentPersona: "College",
    semesterGoal: "Stay ahead",
    theme: "light",
    presetId: "academic",
    widgetTheme: "liquidLight",
    widgetDensity: "balanced",
    widgetClassId: "bio",
    osLive: true,
    premium: true,
  },
  classes: [
    { id: "bio", code: "BIO 101", name: "Introductory Biology", professor: "Dr. Alvarez", room: "Ryder Hall 204", days: "Mon Wed Fri", time: "9:00 AM", next: "Today · 9:00 AM", health: 0.86, grade: "A-", color: "#30D158", color2: "#1FA346", icon: "flask-conical" },
    { id: "fin", code: "FIN 250", name: "Corporate Finance", professor: "Prof. Chen", room: "Shillman 315", days: "Tue Thu", time: "11:00 AM", next: "Tomorrow · 11:00 AM", health: 0.72, grade: "B+", color: "#0A84FF", color2: "#0768CC", icon: "bar-chart-3" },
    { id: "chem", code: "CHEM 311", name: "Organic Chemistry", professor: "Dr. Okafor", room: "Richards 458", days: "Mon Wed", time: "1:00 PM", next: "Today · 1:00 PM", health: 0.58, grade: "B-", color: "#BF5AF2", color2: "#9A3FCB", icon: "flask-conical" },
    { id: "hist", code: "HIST 180", name: "World History to 1500", professor: "Prof. Bauer", room: "Online", days: "Tue Thu", time: "2:30 PM", next: "Tomorrow · 2:30 PM", health: 0.91, grade: "A", color: "#FF9F0A", color2: "#D97E00", icon: "globe-2" },
    { id: "cs", code: "CS 214", name: "Data Structures", professor: "Dr. Park", room: "Snell 168", days: "Mon Wed Fri", time: "3:30 PM", next: "Today · 3:30 PM", health: 0.64, grade: "B", color: "#FF375F", color2: "#D4234A", icon: "layers" },
  ],
  tasks: [
    { id: "t1", title: "Problem Set 3", classId: "cs", type: "Assignment", dueOffset: -1, dueDate: isoFromOffset(-1), time: "11:59 PM", estimateMinutes: 120, done: false, urgent: true, source: "CS 214 Syllabus", subtasks: [{ title: "Implement linked list", done: true }, { title: "Big-O write-up", done: false }, { title: "Edge case tests", done: false }] },
    { id: "t2", title: "Lab Report: Mitosis", classId: "bio", type: "Lab", dueOffset: 0, dueDate: isoFromOffset(0), time: "5:00 PM", estimateMinutes: 90, done: false, urgent: true, source: "BIO 101 Syllabus", subtasks: [{ title: "Results table", done: true }, { title: "Discussion", done: false }] },
    { id: "t3", title: "Reaction Mechanisms Set", classId: "chem", type: "Assignment", dueOffset: 0, dueDate: isoFromOffset(0), time: "11:59 PM", estimateMinutes: 120, done: false, urgent: true, source: "Notes suggested", subtasks: [] },
    { id: "t4", title: "Case Study: Tesla WACC", classId: "fin", type: "Assignment", dueOffset: 2, dueDate: isoFromOffset(2), time: "11:59 PM", estimateMinutes: 180, done: false, urgent: false, source: "FIN 250 Syllabus", subtasks: [{ title: "Pull financials", done: false }, { title: "Compute WACC", done: false }, { title: "Memo", done: false }] },
    { id: "t5", title: "WWI Essay Outline", classId: "hist", type: "Essay", dueOffset: 3, dueDate: isoFromOffset(3), time: "2:30 PM", estimateMinutes: 60, done: false, urgent: false, source: "Notes suggested", subtasks: [] },
    { id: "t6", title: "Midterm Review Packet", classId: "chem", type: "Review", dueOffset: 4, dueDate: isoFromOffset(4), time: "1:00 PM", estimateMinutes: 150, done: false, urgent: false, source: "Exam reminder", subtasks: [] },
    { id: "t7", title: "Final Project Milestone", classId: "cs", type: "Project", dueOffset: 9, dueDate: isoFromOffset(9), time: "11:59 PM", estimateMinutes: 240, done: false, urgent: false, source: "CS 214 Syllabus", subtasks: [] },
    { id: "t8", title: "Reading: Ch. 4 Enzymes", classId: "bio", type: "Reading", dueOffset: -2, dueDate: isoFromOffset(-2), time: "9:00 AM", estimateMinutes: 40, done: true, urgent: false, source: "BIO 101 Syllabus", subtasks: [] },
    { id: "t9", title: "Discussion Post 2", classId: "hist", type: "Discussion", dueOffset: -3, dueDate: isoFromOffset(-3), time: "11:59 PM", estimateMinutes: 30, done: true, urgent: false, source: "HIST 180 Syllabus", subtasks: [] },
  ],
  exams: [
    { id: "e1", classId: "chem", title: "Organic Chem Midterm", dueOffset: 4, dueDate: isoFromOffset(4), time: "1:00 PM", room: "Richards 458", topics: ["Reaction mechanisms", "Stereochemistry", "Spectroscopy"] },
    { id: "e2", classId: "bio", title: "Biology Unit Exam 2", dueOffset: 6, dueDate: isoFromOffset(6), time: "9:00 AM", room: "Ryder Hall 204", topics: ["Cell division", "Genetics", "Enzymes"] },
    { id: "e3", classId: "fin", title: "Finance Midterm", dueOffset: 8, dueDate: isoFromOffset(8), time: "11:00 AM", room: "Shillman 315", topics: ["Time value of money", "CAPM", "WACC"] },
    { id: "e4", classId: "cs", title: "Data Structures Quiz 3", dueOffset: 5, dueDate: isoFromOffset(5), time: "3:30 PM", room: "Snell 168", topics: ["Trees", "Hash maps"] },
  ],
  notes: [
    { id: "n1", classId: "bio", title: "Mitosis Lecture Notes", createdAt: new Date().toISOString(), terms: ["Prophase", "Metaphase", "Anaphase", "Telophase", "Spindle fibers"], summary: "The four phases of mitosis with checkpoint regulation.", suggestedTasks: ["Make flashcards for 4 phases", "Review checkpoint regulation before Exam 2"], examId: "e2", pages: 3, sourceText: "Prophase, metaphase, anaphase and telophase are the four phases of mitosis." },
    { id: "n2", classId: "fin", title: "CAPM & WACC Formula Review", createdAt: new Date().toISOString(), terms: ["Beta", "Risk-free rate", "Market premium", "Cost of equity"], summary: "CAPM estimates expected return from risk-free rate, beta, and market premium.", suggestedTasks: ["Practice 5 WACC problems", "Memorize CAPM derivation"], examId: "e3", pages: 2, sourceText: "CAPM: E(R)=Rf + beta(Rm-Rf). WACC weights equity and debt." },
    { id: "n3", classId: "chem", title: "Organic Reaction Mechanisms", createdAt: new Date().toISOString(), terms: ["Nucleophile", "Electrophile", "SN1", "SN2", "Carbocation"], summary: "SN1 proceeds via carbocation; SN2 is concerted with backside attack.", suggestedTasks: ["Draw 6 mechanisms from memory", "Quiz yourself on SN1 vs SN2"], examId: "e1", pages: 5, sourceText: "SN1 and SN2 mechanisms depend on substrate, nucleophile, and solvent." },
  ],
  reminders: [
    { id: "r1", kind: "Class", title: "BIO 101 starts soon", classId: "bio", lead: "15 min before", room: "Ryder Hall 204", enabled: true },
    { id: "r2", kind: "Assignment", title: "Lab Report due", classId: "bio", lead: "2 hours before", enabled: true },
    { id: "r3", kind: "Exam", title: "Organic Chem Midterm", classId: "chem", lead: "1 day before", room: "Richards 458", enabled: true },
    { id: "r4", kind: "Class", title: "Data Structures starts soon", classId: "cs", lead: "10 min before", room: "Snell 168", enabled: false },
  ],
  studyBlocks: [
    { id: "sb1", day: "Tonight", time: "7:00 - 8:00 PM", taskId: "t3", classId: "chem", title: "Reaction Mechanisms Set", minutes: 60, reason: "Due today and linked to the next exam.", completed: false, date: isoFromOffset(0) },
    { id: "sb2", day: "Friday", time: "2:00 - 3:00 PM", taskId: "t5", classId: "hist", title: "WWI Essay Outline", minutes: 60, reason: "Short writing task before weekend load rises.", completed: false, date: isoFromOffset(1) },
    { id: "sb3", day: "Sunday", time: "10:00 AM - 12:30 PM", taskId: "t6", classId: "chem", title: "Organic Chem Midterm review", minutes: 150, reason: "Exam is in four days; active recall block added.", completed: false, date: isoFromOffset(3) },
  ],
  imports: [],
};

export const defaultData = fixtureData;
