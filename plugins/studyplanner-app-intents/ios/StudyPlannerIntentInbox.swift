import Foundation

/// Append-only queue of raw capture text for the app to review.
///
/// Shape: `{ "entries": [{ "id", "text", "createdAt" }] }`.
/// The text is stored exactly as spoken or typed (trimmed and length-capped).
/// The app drains it on foreground, runs its own parsers and validators, and
/// shows a confirm sheet. Nothing here interprets the text.
enum StudyPlannerIntentInbox {
  static let fileName = "intent-inbox.json"
  static let maxEntries = 20
  static let maxTextLength = 500

  enum InboxError: Error {
    case emptyText
    case appGroupUnavailable
    case writeFailed
  }

  private static let lock = NSLock()

  /// Appends one entry and returns its id. Keeps the newest `maxEntries`.
  @discardableResult
  static func append(text rawText: String, now: Date = Date()) throws -> String {
    let text = String(rawText.trimmingCharacters(in: .whitespacesAndNewlines).prefix(maxTextLength))
    guard !text.isEmpty else { throw InboxError.emptyText }

    lock.lock()
    defer { lock.unlock() }

    guard let url = StudyPlannerAppGroup.fileURL(fileName) else { throw InboxError.appGroupUnavailable }

    var root: [String: Any] = [:]
    if let existing = try? Data(contentsOf: url) {
      if let object = (try? JSONSerialization.jsonObject(with: existing)) as? [String: Any] {
        root = object
      } else {
        // Keep an unreadable inbox for support instead of silently dropping it.
        let backup = url.deletingLastPathComponent().appendingPathComponent("intent-inbox.corrupt.json")
        try? existing.write(to: backup, options: [.atomic])
      }
    }

    var entries = (root["entries"] as? [[String: Any]]) ?? []
    let id = UUID().uuidString
    entries.append([
      "id": id,
      "text": text,
      "createdAt": now.formatted(.iso8601),
    ])
    if entries.count > maxEntries {
      entries = Array(entries.suffix(maxEntries))
    }
    root["entries"] = entries

    do {
      let data = try JSONSerialization.data(withJSONObject: root, options: [.sortedKeys])
      try data.write(to: url, options: [.atomic])
    } catch {
      throw InboxError.writeFailed
    }
    return id
  }
}
