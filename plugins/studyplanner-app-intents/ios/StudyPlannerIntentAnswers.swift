import Foundation

/// Localized, template-built dialog copy. Keys live in `Localizable.xcstrings`.
enum StudyPlannerIntentCopy {
  static var refresh: String {
    String(localized: "intent.refresh", defaultValue: "Open StudyPlanner to refresh today's plan.")
  }

  static var studyNowClear: String {
    String(localized: "intent.studyNow.clear", defaultValue: "Nothing needs studying right now. You're all caught up.")
  }

  static var nothingDue: String {
    String(localized: "intent.due.none", defaultValue: "Nothing is due soon.")
  }

  static var saved: String {
    String(localized: "intent.inbox.saved", defaultValue: "Saved. Open StudyPlanner to confirm.")
  }

  static var saveFailed: String {
    String(localized: "intent.inbox.failed", defaultValue: "Couldn't save that. Open StudyPlanner and add it there.")
  }

  static var dueSeparator: String {
    String(localized: "intent.due.separator", defaultValue: "; ")
  }

  static func dueWhen(days: Int) -> String {
    if days < 0 { return String(localized: "intent.due.overdue", defaultValue: "overdue") }
    if days == 0 { return String(localized: "intent.due.today", defaultValue: "due today") }
    if days == 1 { return String(localized: "intent.due.tomorrow", defaultValue: "due tomorrow") }
    return String(localized: "intent.due.inDays", defaultValue: "due in \(days) days")
  }

  static func dueItem(classCode: String?, title: String, when: String) -> String {
    if let classCode, !classCode.isEmpty {
      return String(localized: "intent.due.item", defaultValue: "\(classCode) \(title), \(when)")
    }
    return String(localized: "intent.due.itemNoClass", defaultValue: "\(title), \(when)")
  }

  static func dueSummary(_ list: String) -> String {
    String(localized: "intent.due.summary", defaultValue: "Next up: \(list).")
  }
}

/// Deterministic answers built only from the snapshot the app wrote.
enum StudyPlannerIntentAnswers {
  static let dueLimit = 3

  static func studyNow(snapshot: StudyPlannerIntelligenceSnapshot?, now: Date = Date()) -> String {
    guard let snapshot, snapshot.dateKey == StudyPlannerCalendar.todayKey(now: now) else {
      return StudyPlannerIntentCopy.refresh
    }
    guard let studyNow = snapshot.studyNow else {
      return StudyPlannerIntentCopy.studyNowClear
    }
    let line = studyNow.line.trimmingCharacters(in: .whitespacesAndNewlines)
    let reason = (studyNow.reason ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
    if line.isEmpty { return StudyPlannerIntentCopy.studyNowClear }
    return reason.isEmpty ? line : "\(line)\n\(reason)"
  }

  static func whatsDue(snapshot: StudyPlannerIntelligenceSnapshot?, now: Date = Date()) -> String {
    guard let snapshot else { return StudyPlannerIntentCopy.refresh }
    let fresh = snapshot.dateKey == StudyPlannerCalendar.todayKey(now: now)

    // Days are recomputed from the due date so a snapshot from yesterday never says "today".
    let upcoming = (snapshot.due ?? [])
      .compactMap { item -> (item: StudyPlannerIntelligenceSnapshot.Due, days: Int)? in
        guard let days = StudyPlannerCalendar.daysFromToday(to: item.dueDate, now: now) ?? (fresh ? item.daysUntil : nil) else { return nil }
        // A stale snapshot cannot know what was finished, so it only speaks about future items.
        if !fresh && days < 0 { return nil }
        return (item, days)
      }
      .sorted { $0.days < $1.days }
      .prefix(dueLimit)

    if upcoming.isEmpty {
      return fresh ? StudyPlannerIntentCopy.nothingDue : StudyPlannerIntentCopy.refresh
    }

    let parts = upcoming.map { entry in
      StudyPlannerIntentCopy.dueItem(
        classCode: entry.item.classCode,
        title: entry.item.title,
        when: StudyPlannerIntentCopy.dueWhen(days: entry.days)
      )
    }
    return StudyPlannerIntentCopy.dueSummary(parts.joined(separator: StudyPlannerIntentCopy.dueSeparator))
  }
}
