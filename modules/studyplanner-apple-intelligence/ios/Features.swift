// StudyPlanner 2.2 on-device features: instructions, generation options, prompt
// building, execution and error mapping.
//
// Shared verbatim (symlink) with tools/fm-eval/FMEval, so it must only import
// Foundation + FoundationModels (no UIKit / ExpoModulesCore).
//
// Instructions are feature-static (no per-request text) so a session can be
// prewarmed before the request arrives; the response language goes in the prompt.
// Any change to the text below => bump AIVersions.instructions in Schemas.swift.

import Foundation

/// Error carrying one of the TS `AIErrorCode` strings (src/appleIntelligence/types.ts).
struct AIBridgeError: Error, Sendable {
  let code: String
  let message: String

  init(_ code: String, _ message: String = "") {
    self.code = code
    self.message = message.isEmpty ? code : message
  }

  static let contextOverflow = "contextOverflow"
  static let guardrail = "guardrail"
  static let refusal = "refusal"
  static let unsupportedLocale = "unsupportedLocale"
  static let rateLimited = "rateLimited"
  static let busy = "busy"
  static let decoding = "decoding"
  static let assetsUnavailable = "assetsUnavailable"
  static let timeout = "timeout"
  static let cancelled = "cancelled"
  static let background = "background"
  static let unavailable = "unavailable"
}

enum AIFeatureInput {
  /// Parses the bridge input JSON. Throws `decoding` on malformed input.
  static func parse(_ inputJson: String) throws -> [String: Any] {
    guard
      let data = inputJson.data(using: .utf8),
      let object = try? JSONSerialization.jsonObject(with: data, options: []),
      let dict = object as? [String: Any]
    else {
      throw AIBridgeError(AIBridgeError.decoding, "Input is not a JSON object.")
    }
    return dict
  }

  /// "es-MX" -> "Spanish"; free-form names pass through; default English.
  static func languageName(_ raw: Any?) -> String {
    guard let value = (raw as? String)?.trimmingCharacters(in: .whitespacesAndNewlines), !value.isEmpty else {
      return "English"
    }
    let looksLikeIdentifier = value.count <= 16 && value.range(of: "^[A-Za-z]{2,3}([-_][A-Za-z0-9]{2,8})*$", options: .regularExpression) != nil
    if looksLikeIdentifier {
      let english = Locale(identifier: "en_US")
      let code = value.replacingOccurrences(of: "_", with: "-").split(separator: "-").first.map(String.init) ?? value
      if let name = english.localizedString(forLanguageCode: code), !name.isEmpty {
        return name
      }
    }
    return value
  }

  /// Builds the user prompt: language line, then TEXT, then every other key
  /// (sorted, compact). String arrays become numbered lines starting at 0 so
  /// indexes line up with `focusIndex`.
  static func prompt(feature: String, input: [String: Any]) -> String {
    let language = languageName(input["language"] ?? input["locale"])
    var parts: [String] = []
    switch feature {
    case "syllabusExtract", "taskProposal":
      parts.append("Write any new words in \(language). Copy titles, dates, times and source lines exactly as written in the text.")
    default:
      parts.append("Respond in \(language).")
    }

    for key in input.keys.sorted() where !["language", "locale", "text", "ref"].contains(key) {
      let value = input[key]
      if let string = value as? String {
        parts.append("\(key.uppercased()): \(string)")
      } else if let list = value as? [String] {
        let lines = list.enumerated().map { "\($0.offset). \($0.element)" }.joined(separator: "\n")
        parts.append("\(key.uppercased()):\n\(lines)")
      } else if let value, JSONSerialization.isValidJSONObject(value),
                let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]),
                let json = String(data: data, encoding: .utf8) {
        parts.append("\(key.uppercased()): \(json)")
      } else if let value {
        parts.append("\(key.uppercased()): \(value)")
      }
    }

    if let text = input["text"] as? String {
      let label = feature == "noteStudySet" ? "NOTES" : "TEXT"
      parts.append("\(label):\n\(text)")
    }
    return parts.joined(separator: "\n\n")
  }
}

enum AIJSON {
  static func encode<T: Encodable>(_ value: T) throws -> String {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys]
    guard let data = try? encoder.encode(value), let json = String(data: data, encoding: .utf8) else {
      throw AIBridgeError(AIBridgeError.decoding, "Could not encode the generated result.")
    }
    return json
  }
}

#if canImport(FoundationModels)
import FoundationModels

@available(iOS 26.0, macOS 26.0, *)
enum AIFeatures {
  static let supported: Set<String> = ["syllabusExtract", "noteStudySet", "dailyBrief", "taskProposal"]

  // MARK: Instructions (short: the whole 4K window is shared with schema + output)

  static func instructions(for feature: String) -> String {
    switch feature {
    case "syllabusExtract":
      return """
      You extract coursework from an excerpt of a student's syllabus.
      Use only facts written in TEXT. Include only items that have a date in TEXT.
      Copy each date into dateText exactly as written. Never invent, compute or reformat a date.
      Copy the exact line each course or item came from into sourceSpan.
      Keep titles short. Do not add anything that is not in TEXT.
      """
    case "noteStudySet":
      return """
      You make study material from a student's own notes.
      Use only facts stated in NOTES; never add outside knowledge.
      Every card and question must be answerable from NOTES.
      Each question has 4 options with exactly one correct; answerIndex is its position (0-3).
      Copy the supporting note line exactly into sourceSpan.
      """
    case "dailyBrief":
      return """
      You write a short, friendly study nudge for a student.
      Use only the facts given. Set focusIndex to the number of the best candidate.
      Never add numbers, dates, names or times that are not in the facts.
      """
    case "taskProposal":
      return """
      You turn a student's quick note into one task.
      Copy date words into dateText exactly as written (for example "next Friday" or "Oct 3"); use "" if there is none.
      Never invent a date. courseHint is the class name or code as written, or "".
      """
    default:
      return "Answer using only the facts provided."
    }
  }

  // MARK: Options

  static func options(for feature: String) -> GenerationOptions {
    switch feature {
    case "syllabusExtract":
      return GenerationOptions(sampling: .greedy, temperature: nil, maximumResponseTokens: 1400)
    case "noteStudySet":
      return GenerationOptions(sampling: .greedy, temperature: nil, maximumResponseTokens: 1400)
    case "dailyBrief":
      return GenerationOptions(sampling: nil, temperature: 0.3, maximumResponseTokens: 160)
    case "taskProposal":
      return GenerationOptions(sampling: .greedy, temperature: nil, maximumResponseTokens: 200)
    default:
      return GenerationOptions(sampling: .greedy, temperature: nil, maximumResponseTokens: 200)
    }
  }

  static func makeSession(for feature: String) -> LanguageModelSession {
    LanguageModelSession(model: SystemLanguageModel.default, tools: [], instructions: instructions(for: feature))
  }

  // MARK: Execution

  /// Runs one feature on `session` (fresh per request) and returns the DTO JSON.
  static func execute(feature: String, inputJson: String, session: LanguageModelSession) async throws -> String {
    guard supported.contains(feature) else {
      throw AIBridgeError(AIBridgeError.unavailable, "Unknown feature \(feature).")
    }
    let input = try AIFeatureInput.parse(inputJson)
    let prompt = AIFeatureInput.prompt(feature: feature, input: input)
    let generationOptions = Self.options(for: feature)
    try Task.checkCancellation()

    switch feature {
    case "syllabusExtract":
      let response = try await session.respond(to: prompt, generating: SyllabusChunk.self, includeSchemaInPrompt: true, options: generationOptions)
      return try AIJSON.encode(RawSyllabusChunkDTO(response.content))
    case "noteStudySet":
      let response = try await session.respond(to: prompt, generating: NoteStudySet.self, includeSchemaInPrompt: true, options: generationOptions)
      return try AIJSON.encode(RawNoteStudySetDTO(response.content))
    case "dailyBrief":
      let response = try await session.respond(to: prompt, generating: DailyBrief.self, includeSchemaInPrompt: true, options: generationOptions)
      return try AIJSON.encode(RawDailyBriefDTO(response.content))
    default:
      let response = try await session.respond(to: prompt, generating: TaskProposal.self, includeSchemaInPrompt: true, options: generationOptions)
      return try AIJSON.encode(RawTaskProposalDTO(response.content))
    }
  }

  /// Typed entry point used by the Mac eval harness.
  static func syllabusExtract(text: String, language: String) async throws -> RawSyllabusChunkDTO {
    let session = makeSession(for: "syllabusExtract")
    let prompt = AIFeatureInput.prompt(feature: "syllabusExtract", input: ["text": text, "language": language])
    let response = try await session.respond(
      to: prompt,
      generating: SyllabusChunk.self,
      includeSchemaInPrompt: true,
      options: Self.options(for: "syllabusExtract")
    )
    return RawSyllabusChunkDTO(response.content)
  }

  // MARK: Error mapping -> TS AIErrorCode

  static func errorCode(for error: Error) -> String {
    if let bridge = error as? AIBridgeError { return bridge.code }
    if error is CancellationError { return AIBridgeError.cancelled }
    if let generation = error as? LanguageModelSession.GenerationError {
      switch generation {
      case .exceededContextWindowSize: return "contextOverflow"
      case .guardrailViolation: return "guardrail"
      case .refusal: return "refusal"
      case .unsupportedLanguageOrLocale: return "unsupportedLocale"
      case .rateLimited: return "rateLimited"
      case .concurrentRequests: return "busy"
      case .decodingFailure: return "decoding"
      case .unsupportedGuide: return "decoding"
      case .assetsUnavailable: return "assetsUnavailable"
      @unknown default: return "unavailable"
      }
    }
    return AIBridgeError.unavailable
  }
}
#endif
