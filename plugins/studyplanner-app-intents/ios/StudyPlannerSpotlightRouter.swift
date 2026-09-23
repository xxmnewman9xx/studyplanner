import CoreSpotlight
import Foundation

/// Converts a tapped Core Spotlight result into a `studyplanner://` deep link.
///
/// The app indexes `CSSearchableItem`s whose `uniqueIdentifier` is
/// `class:<id>`, `task:<id>`, or `exam:<id>`. iOS hands a tap back as an
/// `NSUserActivity` of type `CSSearchableItemActionType`, which React Native's
/// `RCTLinkingManager` ignores (it only forwards web-browsing activities). The
/// config plugin patches `AppDelegate.application(_:continue:restorationHandler:)`
/// to call this router first.
enum StudyPlannerSpotlightRouter {
  static func deepLink(for userActivity: NSUserActivity) -> URL? {
    guard userActivity.activityType == CSSearchableItemActionType,
          let identifier = userActivity.userInfo?[CSSearchableItemActivityIdentifier] as? String
    else { return nil }
    return StudyPlannerDeepLink.url(forSearchableIdentifier: identifier)
  }

  /// Records the route for a cold launch (JavaScript not loaded yet) and returns the URL
  /// for the caller to hand to `RCTLinkingManager` for a warm launch.
  static func handle(_ userActivity: NSUserActivity) -> URL? {
    guard let url = deepLink(for: userActivity) else { return nil }
    StudyPlannerPendingRoute.write(url, source: "spotlight")
    return url
  }
}
