// App Group JSON files and Core Spotlight indexing. Works on every supported OS
// (iOS 16.4+); none of this touches Foundation Models. Nothing here throws to JS:
// failures return false / nil / 0.

import CoreSpotlight
import Foundation
import UniformTypeIdentifiers

enum AppGroupStore {
  /// Must match app.json ios.entitlements and plugins/with-studyplanner-watch.js.
  static let groupIdentifier = "group.com.mattnewman.studyplanner"
  static let allowedNames: Set<String> = ["intelligence-snapshot", "intent-inbox", "pending-route"]

  private static func fileURL(_ name: String) -> URL? {
    guard allowedNames.contains(name) else { return nil }
    guard let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupIdentifier) else {
      return nil
    }
    return container.appendingPathComponent("\(name).json", isDirectory: false)
  }

  static func write(name: String, json: String) -> Bool {
    guard let url = fileURL(name), let data = json.data(using: .utf8) else { return false }
    do {
      // .atomic writes to a temp file and renames, so readers (App Intents,
      // widgets) never see a half-written file.
      try data.write(to: url, options: [.atomic])
      return true
    } catch {
      return false
    }
  }

  static func read(name: String) -> String? {
    guard let url = fileURL(name), FileManager.default.fileExists(atPath: url.path) else { return nil }
    guard let data = try? Data(contentsOf: url) else { return nil }
    return String(data: data, encoding: .utf8)
  }

  static func delete(name: String) -> Bool {
    guard let url = fileURL(name) else { return false }
    guard FileManager.default.fileExists(atPath: url.path) else { return true }
    do {
      try FileManager.default.removeItem(at: url)
      return true
    } catch {
      return false
    }
  }
}

enum SpotlightIndexer {
  static let classDomain = "com.mattnewman.studyplanner.class"
  static let deadlineDomain = "com.mattnewman.studyplanner.deadline"
  static let maxClasses = 100
  static let maxDeadlines = 500

  /// Replaces all StudyPlanner items with the classes and deadlines in `json`:
  /// `{ classes: [{id, code, name}], deadlines: [{id, title, classCode, dueDate, kind}] }`.
  /// Returns the number of items indexed (0 on failure).
  static func index(json: String) async -> Int {
    guard
      CSSearchableIndex.isIndexingAvailable(),
      let data = json.data(using: .utf8),
      let root = (try? JSONSerialization.jsonObject(with: data, options: [])) as? [String: Any]
    else {
      return 0
    }

    var items: [CSSearchableItem] = []
    let classes = (root["classes"] as? [[String: Any]]) ?? []
    for entry in classes.prefix(maxClasses) {
      guard let id = string(entry["id"]), !id.isEmpty else { continue }
      let code = string(entry["code"]) ?? ""
      let name = string(entry["name"]) ?? ""
      let attributes = CSSearchableItemAttributeSet(contentType: UTType.text)
      attributes.title = [code, name].filter { !$0.isEmpty }.joined(separator: " · ")
      attributes.displayName = attributes.title
      attributes.contentDescription = name.isEmpty ? code : name
      attributes.keywords = [code, name].filter { !$0.isEmpty }
      attributes.contentURL = deepLink("class", id)
      let item = CSSearchableItem(uniqueIdentifier: "class:\(id)", domainIdentifier: classDomain, attributeSet: attributes)
      item.expirationDate = Date.distantFuture
      items.append(item)
    }

    let deadlines = (root["deadlines"] as? [[String: Any]]) ?? []
    for entry in deadlines.prefix(maxDeadlines) {
      guard let id = string(entry["id"]), !id.isEmpty, let title = string(entry["title"]), !title.isEmpty else { continue }
      let classCode = string(entry["classCode"]) ?? ""
      let kind = string(entry["kind"]) ?? ""
      let due = parseDay(string(entry["dueDate"]))
      let attributes = CSSearchableItemAttributeSet(contentType: UTType.text)
      attributes.title = title
      attributes.displayName = title
      var description: [String] = []
      if !classCode.isEmpty { description.append(classCode) }
      if let due { description.append(dayFormatter.string(from: due)) }
      attributes.contentDescription = description.joined(separator: " · ")
      attributes.keywords = [classCode, kind].filter { !$0.isEmpty }
      attributes.dueDate = due
      attributes.contentURL = deepLink("task", id)
      let item = CSSearchableItem(uniqueIdentifier: "deadline:\(id)", domainIdentifier: deadlineDomain, attributeSet: attributes)
      // Keep past deadlines searchable for two weeks, then let Spotlight drop them.
      item.expirationDate = due.map { $0.addingTimeInterval(14 * 24 * 60 * 60) } ?? Date.distantFuture
      items.append(item)
    }

    let index = CSSearchableIndex.default()
    let cleared = await clear(index)
    guard cleared, !items.isEmpty else { return 0 }
    return await withCheckedContinuation { (continuation: CheckedContinuation<Int, Never>) in
      index.indexSearchableItems(items) { error in
        continuation.resume(returning: error == nil ? items.count : 0)
      }
    }
  }

  static func clearAll() async -> Bool {
    guard CSSearchableIndex.isIndexingAvailable() else { return true }
    return await clear(CSSearchableIndex.default())
  }

  private static func clear(_ index: CSSearchableIndex) async -> Bool {
    await withCheckedContinuation { (continuation: CheckedContinuation<Bool, Never>) in
      index.deleteSearchableItems(withDomainIdentifiers: [classDomain, deadlineDomain]) { error in
        continuation.resume(returning: error == nil)
      }
    }
  }

  private static func deepLink(_ kind: String, _ id: String) -> URL? {
    let encoded = id.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed.subtracting(CharacterSet(charactersIn: "/"))) ?? id
    return URL(string: "studyplanner://\(kind)/\(encoded)")
  }

  private static func string(_ value: Any?) -> String? {
    guard let text = value as? String else { return nil }
    let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
    return trimmed.isEmpty ? nil : trimmed
  }

  private static func parseDay(_ value: String?) -> Date? {
    guard let value, value.count >= 10 else { return nil }
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone.current
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.date(from: String(value.prefix(10)))
  }

  private static var dayFormatter: DateFormatter {
    let formatter = DateFormatter()
    formatter.dateStyle = .medium
    formatter.timeStyle = .none
    return formatter
  }
}
