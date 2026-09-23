import AppIntents
import Foundation
import UIKit

// Siri / Shortcuts / Spotlight actions. None of these run model inference:
// they read the snapshot the app wrote, or queue raw text for the app.

@available(iOS 16.0, *)
struct StudyNowIntent: AppIntent {
  static let title: LocalizedStringResource = "What Should I Study Now?"
  static let description: IntentDescription? = IntentDescription("Hear the next study step from today's plan.")

  func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
    let answer = StudyPlannerIntentAnswers.studyNow(snapshot: StudyPlannerIntelligenceSnapshot.load())
    return .result(value: answer, dialog: "\(answer)")
  }
}

@available(iOS 16.0, *)
struct WhatsDueIntent: AppIntent {
  static let title: LocalizedStringResource = "What's Due?"
  static let description: IntentDescription? = IntentDescription("Hear your next three deadlines.")

  func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
    let answer = StudyPlannerIntentAnswers.whatsDue(snapshot: StudyPlannerIntelligenceSnapshot.load())
    return .result(value: answer, dialog: "\(answer)")
  }
}

/// Opens the syllabus scanner.
///
/// `OpenURLIntent` (iOS 18) only opens universal links, so it cannot open
/// `studyplanner://scan`. Instead the intent runs inside the app with
/// `openAppWhenRun`, writes `pending-route.json` into the App Group for a cold
/// launch, and hands the URL to the running app for a warm one.
@available(iOS 16.0, *)
struct OpenScannerIntent: AppIntent {
  static let title: LocalizedStringResource = "Open Scanner"
  static let description: IntentDescription? = IntentDescription("Open StudyPlanner's syllabus scanner.")

  @MainActor
  func perform() async throws -> some IntentResult {
    StudyPlannerRouteDelivery.deliver(StudyPlannerDeepLink.scan, source: "siri")
    return .result()
  }
}

// `openAppWhenRun` is deprecated on iOS 26 in favor of `supportedModes`, which
// does not exist on iOS 16-25. Apple's documented back-compat pattern:
@available(iOS 16.0, *)
@available(*, deprecated)
extension OpenScannerIntent {
  static var openAppWhenRun: Bool { true }
}

enum StudyPlannerRouteDelivery {
  /// Cold launch: JavaScript is not listening yet, so the App Group file carries the route.
  /// Warm launch: the running app receives the URL through its normal Linking handler.
  /// The app should treat both as the same navigation (see plugin README notes).
  @MainActor
  static func deliver(_ url: URL, source: String) {
    StudyPlannerPendingRoute.write(url, source: source)
    UIApplication.shared.open(url, options: [:], completionHandler: nil)
  }
}
