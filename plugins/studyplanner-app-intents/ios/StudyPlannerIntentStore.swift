import Foundation

// StudyPlanner App Intents: shared App Group I/O.
//
// Ground rules for every file in this folder:
// - No model inference. Intents only read what the app already wrote
//   (`intelligence-snapshot.json`) or append to the queue the app drains
//   (`intent-inbox.json`).
// - Works with the app killed. Nothing here touches React Native.
// - No parsing of what the student said. The app parses and validates later.

enum StudyPlannerAppGroup {
  static let identifier = "group.com.mattnewman.studyplanner"

  static func fileURL(_ name: String) -> URL? {
    FileManager.default
      .containerURL(forSecurityApplicationGroupIdentifier: identifier)?
      .appendingPathComponent(name, isDirectory: false)
  }
}

/// Mirror of the JSON the app writes after each save (`version: 1`).
/// Every optional field is tolerated so an older or partial file never crashes an intent.
struct StudyPlannerIntelligenceSnapshot: Decodable {
  struct StudyNow: Decodable {
    let line: String
    let reason: String?
  }

  struct Due: Decodable {
    let title: String
    let classCode: String?
    let dueDate: String
    let daysUntil: Int?
  }

  struct ClassRow: Decodable {
    let id: String
    let code: String
    let name: String?
  }

  struct Deadline: Decodable {
    let id: String
    let title: String
    let classCode: String?
    let dueDate: String
    let kind: String?
  }

  static let fileName = "intelligence-snapshot.json"

  let version: Int
  let generatedAt: String?
  let dateKey: String?
  let studyNow: StudyNow?
  let due: [Due]?
  let classes: [ClassRow]?
  let deadlines: [Deadline]?

  static func load() -> StudyPlannerIntelligenceSnapshot? {
    guard let url = StudyPlannerAppGroup.fileURL(fileName),
          let data = try? Data(contentsOf: url),
          let snapshot = try? JSONDecoder().decode(StudyPlannerIntelligenceSnapshot.self, from: data),
          snapshot.version == 1
    else { return nil }
    return snapshot
  }

  /// True only when the app wrote this snapshot for the current local day.
  var isFromToday: Bool {
    dateKey == StudyPlannerCalendar.todayKey()
  }
}

/// Local-day math that matches the app's `dateKey()` (Gregorian, device time zone, YYYY-MM-DD).
enum StudyPlannerCalendar {
  private static var calendar: Calendar {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = .current
    return calendar
  }

  static func todayKey(now: Date = Date()) -> String {
    let parts = calendar.dateComponents([.year, .month, .day], from: now)
    return "\(pad(parts.year ?? 0, 4))-\(pad(parts.month ?? 0, 2))-\(pad(parts.day ?? 0, 2))"
  }

  /// Whole local days from today to a `YYYY-MM-DD` key written by the app. Nil when the key is malformed.
  static func daysFromToday(to dateKey: String, now: Date = Date()) -> Int? {
    let numbers = dateKey.prefix(10).split(separator: "-").compactMap { Int($0) }
    guard numbers.count == 3,
          let target = calendar.date(from: DateComponents(year: numbers[0], month: numbers[1], day: numbers[2], hour: 12))
    else { return nil }
    return calendar.dateComponents([.day], from: calendar.startOfDay(for: now), to: calendar.startOfDay(for: target)).day
  }

  private static func pad(_ value: Int, _ width: Int) -> String {
    let digits = String(value)
    return String(repeating: "0", count: max(0, width - digits.count)) + digits
  }
}

/// `studyplanner://` links the app's deep-link router understands.
enum StudyPlannerDeepLink {
  static let scan = URL(string: "studyplanner://scan")!

  static func classURL(id: String) -> URL? { make("class", id) }
  static func taskURL(id: String) -> URL? { make("task", id) }
  static func examURL(id: String) -> URL? { make("exam", id) }

  /// Spotlight item identifiers are written by the app as `<kind>:<id>`.
  static func url(forSearchableIdentifier identifier: String) -> URL? {
    guard let separator = identifier.firstIndex(of: ":") else { return nil }
    let kind = identifier[..<separator].lowercased()
    let id = String(identifier[identifier.index(after: separator)...])
    switch kind {
    case "class": return classURL(id: id)
    case "task", "deadline", "assignment": return taskURL(id: id)
    case "exam": return examURL(id: id)
    default: return nil
    }
  }

  static func url(forDeadlineId id: String, kind: String?) -> URL? {
    kind?.lowercased() == "exam" ? examURL(id: id) : taskURL(id: id)
  }

  private static let idCharacters = CharacterSet(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~")

  private static func make(_ host: String, _ id: String) -> URL? {
    guard !id.isEmpty, let encoded = id.addingPercentEncoding(withAllowedCharacters: idCharacters) else { return nil }
    return URL(string: "studyplanner://\(host)/\(encoded)")
  }
}

/// A route the app should open the next time JavaScript is ready.
/// Written for cold launches, where a `studyplanner://` URL delivered before
/// React Native loads would otherwise be lost. The app reads and deletes it.
enum StudyPlannerPendingRoute {
  static let fileName = "pending-route.json"

  static func write(_ url: URL, source: String, now: Date = Date()) {
    guard let fileURL = StudyPlannerAppGroup.fileURL(fileName) else { return }
    let payload: [String: Any] = [
      "url": url.absoluteString,
      "source": source,
      "createdAt": now.formatted(.iso8601),
    ]
    guard let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]) else { return }
    try? data.write(to: fileURL, options: [.atomic])
  }
}
