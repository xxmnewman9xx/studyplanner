import AppIntents
import Foundation

/// "Add an assignment in StudyPlanner": "Lab report Friday, 10%".
///
/// The text is queued verbatim in `intent-inbox.json`. This intent never
/// interprets it: the app runs its own parsers, validators, and a confirm sheet
/// the next time the student opens it.
@available(iOS 16.0, *)
struct AddAssignmentIntent: AppIntent {
  static let title: LocalizedStringResource = "Add Assignment"
  static let description: IntentDescription? = IntentDescription("Save an assignment for StudyPlanner to review when you open the app.")

  @Parameter(title: "Assignment", requestValueDialog: "What's the assignment? Include the class and due date.")
  var text: String

  func perform() async throws -> some IntentResult & ProvidesDialog {
    do {
      try StudyPlannerIntentInbox.append(text: text)
    } catch StudyPlannerIntentInbox.InboxError.emptyText {
      throw $text.needsValueError("What's the assignment? Include the class and due date.")
    } catch {
      return .result(dialog: "\(StudyPlannerIntentCopy.saveFailed)")
    }
    return .result(dialog: "\(StudyPlannerIntentCopy.saved)")
  }
}
