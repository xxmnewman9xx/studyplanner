// swift-tools-version: 5.9
//
// Mac eval harness for StudyPlanner's on-device syllabus extraction.
// Sources/FMEval/Schemas.swift and Features.swift are SYMLINKS to
// modules/studyplanner-apple-intelligence/ios/, so the harness runs the exact
// schemas, instructions and generation options that ship in the app.

import PackageDescription

let package = Package(
  name: "FMEval",
  platforms: [.macOS("26.0")],
  targets: [
    .executableTarget(
      name: "FMEval",
      path: "Sources/FMEval"
    ),
  ]
)
