import AppIntents
import Foundation

// Classes and deadlines as App Entities, read from `intelligence-snapshot.json`.
// Spotlight indexing itself is done by the app (Core Spotlight items with
// identifiers `class:<id>` / `task:<id>` / `exam:<id>`); see
// StudyPlannerSpotlightRouter.swift for how a tapped result is routed.

@available(iOS 16.0, *)
struct ClassEntity: AppEntity {
  static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Class")
  static let defaultQuery = ClassEntityQuery()

  let id: String
  let code: String
  let name: String

  var displayRepresentation: DisplayRepresentation {
    if name.isEmpty || name == code {
      return DisplayRepresentation(title: "\(code)")
    }
    return DisplayRepresentation(title: "\(code)", subtitle: "\(name)")
  }

  init(id: String, code: String, name: String) {
    self.id = id
    self.code = code
    self.name = name
  }

  init(row: StudyPlannerIntelligenceSnapshot.ClassRow) {
    self.init(id: row.id, code: row.code, name: row.name ?? "")
  }
}

@available(iOS 16.0, *)
struct ClassEntityQuery: EntityStringQuery {
  init() {}

  private func all() -> [ClassEntity] {
    (StudyPlannerIntelligenceSnapshot.load()?.classes ?? []).map(ClassEntity.init(row:))
  }

  func entities(for identifiers: [ClassEntity.ID]) async throws -> [ClassEntity] {
    let wanted = Set(identifiers)
    return all().filter { wanted.contains($0.id) }
  }

  func entities(matching string: String) async throws -> [ClassEntity] {
    let needle = string.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !needle.isEmpty else { return all() }
    return all().filter {
      $0.code.localizedCaseInsensitiveContains(needle) || $0.name.localizedCaseInsensitiveContains(needle)
    }
  }

  func suggestedEntities() async throws -> [ClassEntity] {
    all()
  }
}

@available(iOS 16.0, *)
struct DeadlineEntity: AppEntity {
  static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Deadline")
  static let defaultQuery = DeadlineEntityQuery()

  let id: String
  let title: String
  let classCode: String
  let dueDate: String
  let kind: String

  var displayRepresentation: DisplayRepresentation {
    let when = StudyPlannerCalendar.daysFromToday(to: dueDate).map { StudyPlannerIntentCopy.dueWhen(days: $0) } ?? dueDate
    let subtitle = classCode.isEmpty ? when : "\(classCode) · \(when)"
    return DisplayRepresentation(title: "\(title)", subtitle: "\(subtitle)")
  }

  init(row: StudyPlannerIntelligenceSnapshot.Deadline) {
    id = row.id
    title = row.title
    classCode = row.classCode ?? ""
    dueDate = row.dueDate
    kind = row.kind ?? "task"
  }
}

@available(iOS 16.0, *)
struct DeadlineEntityQuery: EntityStringQuery {
  init() {}

  private func all() -> [DeadlineEntity] {
    (StudyPlannerIntelligenceSnapshot.load()?.deadlines ?? []).map(DeadlineEntity.init(row:))
  }

  func entities(for identifiers: [DeadlineEntity.ID]) async throws -> [DeadlineEntity] {
    let wanted = Set(identifiers)
    return all().filter { wanted.contains($0.id) }
  }

  func entities(matching string: String) async throws -> [DeadlineEntity] {
    let needle = string.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !needle.isEmpty else { return try await suggestedEntities() }
    return all().filter {
      $0.title.localizedCaseInsensitiveContains(needle) || $0.classCode.localizedCaseInsensitiveContains(needle)
    }
  }

  /// Upcoming deadlines first (the app writes them sorted; keep at most 20 for pickers).
  func suggestedEntities() async throws -> [DeadlineEntity] {
    Array(
      all()
        .filter { (StudyPlannerCalendar.daysFromToday(to: $0.dueDate) ?? 0) >= 0 }
        .prefix(20)
    )
  }
}

// Spotlight semantic index support (iOS 18+). The conformance only adds the
// entity types to Apple Intelligence / Spotlight's entity schema; the default
// `attributeSet` comes from `displayRepresentation`. The app decides what is
// actually indexed.
@available(iOS 18.0, *)
extension ClassEntity: IndexedEntity {}

@available(iOS 18.0, *)
extension DeadlineEntity: IndexedEntity {}

/// Opens a class, e.g. from a Spotlight entity result or a Shortcuts action.
@available(iOS 16.0, *)
struct OpenClassIntent: OpenIntent {
  static let title: LocalizedStringResource = "Open Class"

  @Parameter(title: "Class")
  var target: ClassEntity

  @MainActor
  func perform() async throws -> some IntentResult {
    if let url = StudyPlannerDeepLink.classURL(id: target.id) {
      StudyPlannerRouteDelivery.deliver(url, source: "entity")
    }
    return .result()
  }
}

/// Opens a task or exam from a deadline entity.
@available(iOS 16.0, *)
struct OpenDeadlineIntent: OpenIntent {
  static let title: LocalizedStringResource = "Open Deadline"

  @Parameter(title: "Deadline")
  var target: DeadlineEntity

  @MainActor
  func perform() async throws -> some IntentResult {
    if let url = StudyPlannerDeepLink.url(forDeadlineId: target.id, kind: target.kind) {
      StudyPlannerRouteDelivery.deliver(url, source: "entity")
    }
    return .result()
  }
}

@available(iOS 16.0, *)
@available(*, deprecated)
extension OpenClassIntent {
  static var openAppWhenRun: Bool { true }
}

@available(iOS 16.0, *)
@available(*, deprecated)
extension OpenDeadlineIntent {
  static var openAppWhenRun: Bool { true }
}
