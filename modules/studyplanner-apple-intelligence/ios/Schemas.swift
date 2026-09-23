// StudyPlanner 2.2 on-device intelligence schemas.
//
// These @Generable structs mirror the Raw* types in src/appleIntelligence/types.ts
// 1:1 (same property names, same optionality). The Encodable *DTO structs below
// are what gets serialized to JSON for React Native, so the JSON keys are exactly
// the TS keys. scripts/check-apple-intelligence-native-contract.ts enforces this.
//
// This file is shared verbatim (symlink) with the Mac eval harness in
// tools/fm-eval/FMEval, so it must only import Foundation + FoundationModels.
//
// Schemas count against the 4K context window: keep guide descriptions short.

import Foundation

// MARK: - Versions (the single place to bump when schemas or instructions change)

enum AIVersions {
  /// Bump when any @Generable shape or guide changes. Mirrored by AI_SCHEMA_VERSION in native.ts.
  static let schema = 1
  /// Bump when any instructions/prompt text in Features.swift changes. Mirrored by AI_INSTRUCTIONS_VERSION.
  static let instructions = 1
}

// MARK: - JSON DTOs (plain Encodable; no FoundationModels dependency)

struct RawSyllabusCourseDTO: Encodable, Sendable {
  var code: String
  var title: String?
  var meetingText: String?
  var sourceSpan: String
}

struct RawSyllabusItemDTO: Encodable, Sendable {
  var kind: String
  var title: String
  var courseCode: String?
  var dateText: String
  var timeText: String?
  var weightPercent: Int?
  var sourceSpan: String
}

struct RawSyllabusChunkDTO: Encodable, Sendable {
  var courses: [RawSyllabusCourseDTO]
  var items: [RawSyllabusItemDTO]
}

struct RawStudyCardDTO: Encodable, Sendable {
  var front: String
  var back: String
  var sourceSpan: String
}

struct RawStudyQuestionDTO: Encodable, Sendable {
  var stem: String
  var options: [String]
  var answerIndex: Int
  var why: String
  var sourceSpan: String
}

struct RawNoteStudySetDTO: Encodable, Sendable {
  var summary: String
  var concepts: [String]
  var cards: [RawStudyCardDTO]
  var questions: [RawStudyQuestionDTO]
}

struct RawDailyBriefDTO: Encodable, Sendable {
  var headline: String
  var body: String
  var focusIndex: Int
}

struct RawTaskProposalDTO: Encodable, Sendable {
  var title: String
  var courseHint: String
  var dateText: String
  var timeText: String?
  var kind: String
  var estimateMinutes: Int
}

#if canImport(FoundationModels)
import FoundationModels

// MARK: - SyllabusChunk (RawSyllabusChunk)

@available(iOS 26.0, macOS 26.0, *)
@Generable(description: "A course listed in the syllabus text")
struct SyllabusCourse {
  @Guide(description: "Course code exactly as written, e.g. BIO 101")
  var code: String
  @Guide(description: "Course title as written")
  var title: String?
  @Guide(description: "Meeting days/times as written")
  var meetingText: String?
  @Guide(description: "The exact source line, copied verbatim")
  var sourceSpan: String
}

@available(iOS 26.0, macOS 26.0, *)
@Generable(description: "One dated piece of coursework")
struct SyllabusItem {
  @Guide(description: "Category", .anyOf(["assignment", "exam", "quiz", "midterm", "final", "project", "reading", "lab", "presentation"]))
  var kind: String
  @Guide(description: "Short title from the text")
  var title: String
  @Guide(description: "Course code as written, if stated")
  var courseCode: String?
  @Guide(description: "Date copied verbatim from the text. Never invent or reformat.")
  var dateText: String
  @Guide(description: "Time copied verbatim, if stated")
  var timeText: String?
  @Guide(description: "Grade weight percent 0-100, only if stated")
  var weightPercent: Int?
  @Guide(description: "The exact source line, copied verbatim")
  var sourceSpan: String
}

@available(iOS 26.0, macOS 26.0, *)
@Generable(description: "Courses and dated coursework found in one syllabus excerpt")
struct SyllabusChunk {
  @Guide(description: "Courses in the excerpt", .maximumCount(6))
  var courses: [SyllabusCourse]
  @Guide(description: "Dated coursework in the excerpt", .maximumCount(30))
  var items: [SyllabusItem]
}

// MARK: - NoteStudySet (RawNoteStudySet)

@available(iOS 26.0, macOS 26.0, *)
@Generable(description: "A flashcard built from the notes")
struct StudyCard {
  @Guide(description: "Question or term")
  var front: String
  @Guide(description: "Answer stated in the notes")
  var back: String
  @Guide(description: "The supporting note line, copied verbatim")
  var sourceSpan: String
}

@available(iOS 26.0, macOS 26.0, *)
@Generable(description: "A multiple-choice question built from the notes")
struct StudyQuestion {
  @Guide(description: "Question")
  var stem: String
  @Guide(description: "Four options, exactly one correct", .count(4))
  var options: [String]
  @Guide(description: "Position of the correct option", .range(0...3))
  var answerIndex: Int
  @Guide(description: "One sentence: why it is correct, from the notes")
  var why: String
  @Guide(description: "The supporting note line, copied verbatim")
  var sourceSpan: String
}

@available(iOS 26.0, macOS 26.0, *)
@Generable(description: "Study material made only from the student's notes")
struct NoteStudySet {
  @Guide(description: "At most 3 sentences")
  var summary: String
  @Guide(description: "Key concept names from the notes", .maximumCount(8))
  var concepts: [String]
  @Guide(description: "Flashcards", .maximumCount(12))
  var cards: [StudyCard]
  @Guide(description: "Practice questions", .maximumCount(6))
  var questions: [StudyQuestion]
}

// MARK: - DailyBrief (RawDailyBrief)

@available(iOS 26.0, macOS 26.0, *)
@Generable(description: "A short study nudge for today")
struct DailyBrief {
  @Guide(description: "At most 60 characters")
  var headline: String
  @Guide(description: "One sentence, at most 140 characters")
  var body: String
  @Guide(description: "Number of the chosen candidate", .range(0...4))
  var focusIndex: Int
}

// MARK: - TaskProposal (RawTaskProposal)

@available(iOS 26.0, macOS 26.0, *)
@Generable(description: "One task from a student's quick note")
struct TaskProposal {
  @Guide(description: "Short task title")
  var title: String
  @Guide(description: "Class name or code as written, or empty")
  var courseHint: String
  @Guide(description: "Date words copied verbatim, or empty. Never invent.")
  var dateText: String
  @Guide(description: "Time copied verbatim, if stated")
  var timeText: String?
  @Guide(description: "Category", .anyOf(["assignment", "exam", "quiz", "midterm", "final", "project", "reading", "lab", "presentation"]))
  var kind: String
  @Guide(description: "Realistic minutes of work", .range(15...240))
  var estimateMinutes: Int
}

// MARK: - Generable -> DTO mapping

@available(iOS 26.0, macOS 26.0, *)
extension RawSyllabusChunkDTO {
  init(_ g: SyllabusChunk) {
    self.courses = g.courses.map {
      RawSyllabusCourseDTO(code: $0.code, title: $0.title, meetingText: $0.meetingText, sourceSpan: $0.sourceSpan)
    }
    self.items = g.items.map {
      RawSyllabusItemDTO(
        kind: $0.kind,
        title: $0.title,
        courseCode: $0.courseCode,
        dateText: $0.dateText,
        timeText: $0.timeText,
        weightPercent: $0.weightPercent,
        sourceSpan: $0.sourceSpan
      )
    }
  }
}

@available(iOS 26.0, macOS 26.0, *)
extension RawNoteStudySetDTO {
  init(_ g: NoteStudySet) {
    self.summary = g.summary
    self.concepts = g.concepts
    self.cards = g.cards.map { RawStudyCardDTO(front: $0.front, back: $0.back, sourceSpan: $0.sourceSpan) }
    self.questions = g.questions.map {
      RawStudyQuestionDTO(stem: $0.stem, options: $0.options, answerIndex: $0.answerIndex, why: $0.why, sourceSpan: $0.sourceSpan)
    }
  }
}

@available(iOS 26.0, macOS 26.0, *)
extension RawDailyBriefDTO {
  init(_ g: DailyBrief) {
    self.headline = g.headline
    self.body = g.body
    self.focusIndex = g.focusIndex
  }
}

@available(iOS 26.0, macOS 26.0, *)
extension RawTaskProposalDTO {
  init(_ g: TaskProposal) {
    self.title = g.title
    self.courseHint = g.courseHint
    self.dateText = g.dateText
    self.timeText = g.timeText
    self.kind = g.kind
    self.estimateMinutes = g.estimateMinutes
  }
}
#endif
