import AppIntents

// App Shortcuts: zero-setup Siri phrases and Spotlight / Action button tiles.
// Every phrase contains \(.applicationName) exactly once. Localized phrases live
// in AppShortcuts.xcstrings (keys use ${applicationName}); titles live in
// Localizable.xcstrings. Keep the English literals here and the catalog keys
// in sync: scripts/check-app-intents-plugin.mjs enforces it.

@available(iOS 16.0, *)
struct StudyPlannerShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: StudyNowIntent(),
      phrases: [
        "What should I study now in \(.applicationName)",
        "What should I study in \(.applicationName)",
        "\(.applicationName) study now",
        "Ask \(.applicationName) what to study",
      ],
      shortTitle: "Study Now",
      systemImageName: "brain.head.profile"
    )
    AppShortcut(
      intent: WhatsDueIntent(),
      phrases: [
        "What's due in \(.applicationName)",
        "What's due next in \(.applicationName)",
        "\(.applicationName) what's due",
        "Show my deadlines in \(.applicationName)",
      ],
      shortTitle: "What's Due",
      systemImageName: "calendar.badge.clock"
    )
    AppShortcut(
      intent: AddAssignmentIntent(),
      phrases: [
        "Add an assignment in \(.applicationName)",
        "Add an assignment to \(.applicationName)",
        "\(.applicationName) add assignment",
        "Add homework in \(.applicationName)",
      ],
      shortTitle: "Add Assignment",
      systemImageName: "plus.circle"
    )
    AppShortcut(
      intent: OpenScannerIntent(),
      phrases: [
        "Scan a syllabus in \(.applicationName)",
        "Open the scanner in \(.applicationName)",
        "\(.applicationName) scan",
      ],
      shortTitle: "Scan Syllabus",
      systemImageName: "doc.viewfinder"
    )
  }
}
