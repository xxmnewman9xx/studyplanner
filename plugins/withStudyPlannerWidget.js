const fs = require("fs");
const path = require("path");

const {
  withEntitlementsPlist,
  withXcodeProject
} = require("@expo/config-plugins");

const APP_GROUP_IDENTIFIER = "group.com.mattnewman.studyplanner";
const SNAPSHOT_KEY = "study-planner-widget-snapshot-v1";
const WIDGET_TARGET_NAME = "StudyPlannerWidgetExtension";
const WIDGET_BUNDLE_IDENTIFIER = "com.mattnewman.studyplanner.widget";
const WIDGET_SWIFT_FILE = "StudyPlannerWidget.swift";
const WIDGET_INFO_PLIST = `${WIDGET_TARGET_NAME}-Info.plist`;
const WIDGET_ENTITLEMENTS = `${WIDGET_TARGET_NAME}.entitlements`;
const APP_BRIDGE_SWIFT = "StudyPlannerWidgetBridge.swift";
const APP_BRIDGE_OBJC = "StudyPlannerWidgetBridge.m";

function withStudyPlannerWidget(config, props = {}) {
  const appGroupIdentifier = props.appGroupIdentifier || APP_GROUP_IDENTIFIER;
  const snapshotKey = props.snapshotKey || SNAPSHOT_KEY;
  const widgetTargetName = props.widgetTargetName || WIDGET_TARGET_NAME;
  const widgetBundleIdentifier =
    props.widgetBundleIdentifier || WIDGET_BUNDLE_IDENTIFIER;

  config = withEntitlementsPlist(config, (modConfig) => {
    const groups =
      modConfig.modResults["com.apple.security.application-groups"] || [];
    modConfig.modResults["com.apple.security.application-groups"] =
      uniqueStrings([...groups, appGroupIdentifier]);
    return modConfig;
  });

  return withXcodeProject(config, (modConfig) => {
    const iosRoot = modConfig.modRequest.platformProjectRoot;
    const projectName = modConfig.modRequest.projectName;
    const project = modConfig.modResults;
    const appTargetUuid = project.getFirstTarget().uuid;

    writeAppBridgeFiles({
      iosRoot,
      projectName,
      appGroupIdentifier,
      snapshotKey
    });
    writeWidgetFiles({
      iosRoot,
      widgetTargetName,
      appGroupIdentifier,
      snapshotKey
    });

    addAppBridgeToProject(project, projectName, appTargetUuid);
    addWidgetTargetToProject(project, {
      widgetTargetName,
      widgetBundleIdentifier,
      appVersion: modConfig.version || "1.0.0",
      buildNumber: modConfig.ios?.buildNumber || "1"
    });
    setSwiftBuildSettings(project, appTargetUuid);

    return modConfig;
  });
}

function writeAppBridgeFiles({
  iosRoot,
  projectName,
  appGroupIdentifier,
  snapshotKey
}) {
  const appDir = path.join(iosRoot, projectName);
  fs.mkdirSync(appDir, { recursive: true });
  writeFileIfChanged(
    path.join(appDir, APP_BRIDGE_SWIFT),
    appBridgeSwift({ appGroupIdentifier, snapshotKey })
  );
  writeFileIfChanged(path.join(appDir, APP_BRIDGE_OBJC), appBridgeObjC());
}

function writeWidgetFiles({
  iosRoot,
  widgetTargetName,
  appGroupIdentifier,
  snapshotKey
}) {
  const widgetDir = path.join(iosRoot, widgetTargetName);
  fs.mkdirSync(widgetDir, { recursive: true });
  writeFileIfChanged(
    path.join(widgetDir, WIDGET_SWIFT_FILE),
    widgetSwift({ appGroupIdentifier, snapshotKey })
  );
  writeFileIfChanged(
    path.join(widgetDir, WIDGET_INFO_PLIST),
    widgetInfoPlist()
  );
  writeFileIfChanged(
    path.join(widgetDir, WIDGET_ENTITLEMENTS),
    entitlementsPlist(appGroupIdentifier)
  );
}

function addAppBridgeToProject(project, projectName, appTargetUuid) {
  const appGroupKey = findPbxGroupKeyByName(project, projectName);
  if (!appGroupKey) {
    throw new Error(`Could not find iOS app group "${projectName}"`);
  }

  addSourceFileOnce(
    project,
    `${projectName}/${APP_BRIDGE_SWIFT}`,
    appTargetUuid,
    appGroupKey
  );
  addSourceFileOnce(
    project,
    `${projectName}/${APP_BRIDGE_OBJC}`,
    appTargetUuid,
    appGroupKey
  );
}

function addWidgetTargetToProject(project, {
  widgetTargetName,
  widgetBundleIdentifier,
  appVersion,
  buildNumber
}) {
  const existingTargetUuid = project.findTargetKey(widgetTargetName);
  const target =
    existingTargetUuid ||
    project.addTarget(
      widgetTargetName,
      "app_extension",
      widgetTargetName,
      widgetBundleIdentifier
    ).uuid;

  const widgetGroupKey = ensurePbxGroup(project, widgetTargetName);
  ensureBuildPhase(project, target, "PBXSourcesBuildPhase", "Sources");
  ensureBuildPhase(project, target, "PBXFrameworksBuildPhase", "Frameworks");
  ensureBuildPhase(project, target, "PBXResourcesBuildPhase", "Resources");

  addSourceFileOnce(project, WIDGET_SWIFT_FILE, target, widgetGroupKey);
  addFileToGroupOnce(project, WIDGET_INFO_PLIST, widgetGroupKey);
  addFileToGroupOnce(project, WIDGET_ENTITLEMENTS, widgetGroupKey);
  addFrameworkOnce(project, "WidgetKit.framework", target);
  addFrameworkOnce(project, "SwiftUI.framework", target);
  setWidgetBuildSettings(project, target, {
    widgetTargetName,
    widgetBundleIdentifier,
    appVersion,
    buildNumber
  });
}

function addSourceFileOnce(project, fileName, targetUuid, groupKey) {
  if (hasBuildFile(project, fileName, targetUuid)) return;
  project.addSourceFile(fileName, { target: targetUuid }, groupKey);
}

function addFileToGroupOnce(project, fileName, groupKey) {
  if (project.hasFile(fileName)) return;
  project.addFile(fileName, groupKey);
}

function addFrameworkOnce(project, frameworkName, targetUuid) {
  if (hasBuildFile(project, frameworkName, targetUuid)) return;
  project.addFramework(frameworkName, { target: targetUuid });
}

function ensureBuildPhase(project, targetUuid, buildPhaseType, comment) {
  const target = project.pbxNativeTargetSection()[targetUuid];
  if (target.buildPhases.some((phase) => phase.comment === comment)) return;
  project.addBuildPhase([], buildPhaseType, comment, targetUuid);
}

function ensurePbxGroup(project, groupName) {
  const existingKey = findPbxGroupKeyByName(project, groupName);
  if (existingKey) return existingKey;

  const { uuid } = project.addPbxGroup([], groupName, groupName);
  const projectSection = project.pbxProjectSection()[project.getFirstProject().uuid];
  const mainGroup = project.hash.project.objects.PBXGroup[projectSection.mainGroup];
  mainGroup.children.push({ value: uuid, comment: groupName });
  return uuid;
}

function setSwiftBuildSettings(project, targetUuid) {
  for (const config of getBuildConfigurations(project, targetUuid)) {
    config.buildSettings.SWIFT_VERSION = "5.0";
  }
}

function setWidgetBuildSettings(project, targetUuid, {
  widgetTargetName,
  widgetBundleIdentifier,
  appVersion,
  buildNumber
}) {
  for (const config of getBuildConfigurations(project, targetUuid)) {
    config.buildSettings.APPLICATION_EXTENSION_API_ONLY = "YES";
    config.buildSettings.CODE_SIGN_ENTITLEMENTS = `${widgetTargetName}/${WIDGET_ENTITLEMENTS}`;
    config.buildSettings.CURRENT_PROJECT_VERSION = buildNumber;
    config.buildSettings.GENERATE_INFOPLIST_FILE = "NO";
    config.buildSettings.INFOPLIST_FILE = `${widgetTargetName}/${WIDGET_INFO_PLIST}`;
    config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "16.0";
    config.buildSettings.MARKETING_VERSION = appVersion;
    config.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = widgetBundleIdentifier;
    config.buildSettings.PRODUCT_NAME = '"$(TARGET_NAME)"';
    config.buildSettings.SKIP_INSTALL = "YES";
    config.buildSettings.SWIFT_VERSION = "5.0";
    config.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
  }
}

function getBuildConfigurations(project, targetUuid) {
  const target = project.pbxNativeTargetSection()[targetUuid];
  const configList = project.pbxXCConfigurationList()[target.buildConfigurationList];
  return configList.buildConfigurations.map(
    (item) => project.pbxXCBuildConfigurationSection()[item.value]
  );
}

function findPbxGroupKeyByName(project, name) {
  const groups = project.hash.project.objects.PBXGroup;
  for (const key of Object.keys(groups)) {
    if (key.endsWith("_comment")) continue;
    const group = groups[key];
    if (groups[`${key}_comment`] === name || group.name === name || group.path === name) {
      return key;
    }
  }
  return null;
}

function hasBuildFile(project, fileName, targetUuid) {
  const target = project.pbxNativeTargetSection()[targetUuid];
  const basename = path.basename(fileName);
  const buildPhaseIds = new Set(target.buildPhases.map((phase) => phase.value));

  for (const phaseId of buildPhaseIds) {
    const phase = findBuildPhaseById(project, phaseId);
    if (!phase) continue;
    if (
      phase.files.some((file) => {
        const comment = file.comment || "";
        return comment.includes(`${basename} in `) || comment === basename;
      })
    ) {
      return true;
    }
  }

  return false;
}

function findBuildPhaseById(project, phaseId) {
  const objects = project.hash.project.objects;
  for (const sectionName of [
    "PBXSourcesBuildPhase",
    "PBXFrameworksBuildPhase",
    "PBXResourcesBuildPhase",
    "PBXCopyFilesBuildPhase"
  ]) {
    if (objects[sectionName]?.[phaseId]) {
      return objects[sectionName][phaseId];
    }
  }
  return null;
}

function writeFileIfChanged(filePath, contents) {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === contents) {
    return;
  }
  fs.writeFileSync(filePath, contents);
}

function uniqueStrings(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function appBridgeSwift({ appGroupIdentifier, snapshotKey }) {
  return `import Foundation
import WidgetKit

@objc(StudyPlannerWidgetBridge)
final class StudyPlannerWidgetBridge: NSObject {
  private let suiteName = "${appGroupIdentifier}"
  private let snapshotKey = "${snapshotKey}"

  @objc(writeSnapshot:)
  func writeSnapshot(_ snapshotJson: String) {
    guard let defaults = UserDefaults(suiteName: suiteName) else {
      return
    }

    defaults.set(snapshotJson, forKey: snapshotKey)
    defaults.synchronize()

    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}
`;
}

function appBridgeObjC() {
  return `#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(StudyPlannerWidgetBridge, NSObject)
RCT_EXTERN_METHOD(writeSnapshot:(NSString *)snapshotJson)
@end
`;
}

function widgetSwift({ appGroupIdentifier, snapshotKey }) {
  return `import WidgetKit
import SwiftUI

private let appGroupIdentifier = "${appGroupIdentifier}"
private let snapshotStorageKey = "${snapshotKey}"
private let widgetBackground = Color(red: 0.09, green: 0.07, blue: 0.17)
private let widgetText = Color(red: 0.97, green: 0.98, blue: 1.00)
private let widgetMuted = Color(red: 0.70, green: 0.73, blue: 0.82)
private let widgetAccent = Color(red: 0.74, green: 0.66, blue: 1.00)

struct StudyPlannerEntry: TimelineEntry {
  let date: Date
  let snapshot: StudyPlannerWidgetSnapshot?
}

struct StudyPlannerProvider: TimelineProvider {
  func placeholder(in context: Context) -> StudyPlannerEntry {
    StudyPlannerEntry(date: Date(), snapshot: StudyPlannerWidgetSnapshot.placeholder)
  }

  func getSnapshot(in context: Context, completion: @escaping (StudyPlannerEntry) -> Void) {
    completion(StudyPlannerEntry(date: Date(), snapshot: loadSnapshot() ?? StudyPlannerWidgetSnapshot.placeholder))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<StudyPlannerEntry>) -> Void) {
    let entry = StudyPlannerEntry(date: Date(), snapshot: loadSnapshot())
    let refreshDate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
    completion(Timeline(entries: [entry], policy: .after(refreshDate)))
  }

  private func loadSnapshot() -> StudyPlannerWidgetSnapshot? {
    guard
      let defaults = UserDefaults(suiteName: appGroupIdentifier),
      let json = defaults.string(forKey: snapshotStorageKey),
      let data = json.data(using: .utf8)
    else {
      return nil
    }

    return try? JSONDecoder().decode(StudyPlannerWidgetSnapshot.self, from: data)
  }
}

struct StudyPlannerWidgetView: View {
  @Environment(\\.widgetFamily) private var family
  let entry: StudyPlannerEntry

  var body: some View {
    Group {
      switch family {
      case .systemMedium:
        MediumWidgetView(snapshot: entry.snapshot)
      default:
        SmallWidgetView(snapshot: entry.snapshot)
      }
    }
    .studyPlannerWidgetBackground(entry.snapshot?.widgetStyle)
  }
}

struct SmallWidgetView: View {
  let snapshot: StudyPlannerWidgetSnapshot?

  var body: some View {
    ZStack {
      WidgetAuroraBands(style: snapshot?.widgetStyle)
      VStack(alignment: .leading, spacing: 7) {
        HeaderView(title: "Next", snapshot: snapshot)

        if let snapshot, snapshot.emptyState.isEmpty {
          EmptyStateView(title: snapshot.emptyState.title, message: snapshot.emptyState.message)
        } else if let item = snapshot?.surfaces.small.item ?? snapshot?.nextDue {
          VStack(alignment: .leading, spacing: 5) {
            Text(compactCourseName(item.courseName))
              .font(.system(size: 10, weight: .semibold))
              .foregroundStyle(widgetMuted)
              .lineLimit(1)
              .minimumScaleFactor(0.7)
            Text(item.title)
              .font(.system(size: 18, weight: .black))
              .foregroundStyle(widgetText)
              .lineLimit(2)
              .minimumScaleFactor(0.78)
            Spacer(minLength: 0)
            DuePill(item: item)
            if let overdueCount = snapshot?.overdueCount, overdueCount > 1 {
              Text("\\(overdueCount) overdue")
                .font(.system(size: 9, weight: .semibold))
                .foregroundStyle(widgetMuted)
                .lineLimit(1)
            }
          }
        } else {
          EmptyStateView(title: "Open Study Planner", message: "Launch the app to sync your widget.")
        }
      }
      .padding(12)
    }
  }
}

struct MediumWidgetView: View {
  let snapshot: StudyPlannerWidgetSnapshot?

  var items: [StudyPlannerWidgetSnapshotItem] {
    snapshot?.surfaces.medium.items ?? []
  }

  var body: some View {
    ZStack {
      WidgetAuroraBands(style: snapshot?.widgetStyle)
      VStack(alignment: .leading, spacing: 7) {
        HeaderView(title: "This Week", snapshot: snapshot)

        if let snapshot, snapshot.emptyState.isEmpty {
          EmptyStateView(title: snapshot.emptyState.title, message: snapshot.emptyState.message)
        } else if items.isEmpty {
          EmptyStateView(title: "No upcoming work", message: "New deadlines will appear here after your next sync.")
        } else {
          VStack(alignment: .leading, spacing: 5) {
            ForEach(items.prefix(4)) { item in
              HStack(alignment: .center, spacing: 7) {
                UrgencyDot(urgency: item.urgency)
                VStack(alignment: .leading, spacing: 1) {
                  Text(item.title)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(widgetText)
                    .lineLimit(1)
                    .minimumScaleFactor(0.82)
                  Text("\\(compactCourseName(item.courseName)) - \\(item.dueLabel)")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(widgetMuted)
                    .lineLimit(1)
                }
                Spacer(minLength: 2)
              }
            }
          }

          Spacer(minLength: 0)

          FooterView(snapshot: snapshot)
        }
      }
      .padding(12)
      .padding(.top, 2)
    }
  }
}

struct HeaderView: View {
  let title: String
  let snapshot: StudyPlannerWidgetSnapshot?

  var body: some View {
    HStack(alignment: .center, spacing: 6) {
      Text(title)
        .font(.system(size: 11, weight: .black))
        .foregroundStyle(widgetText)
        .lineLimit(1)
        .layoutPriority(1)
      Spacer(minLength: 4)
      if snapshot?.demoState?.enabled == true {
        Text(snapshot?.demoState?.label ?? "Demo")
          .font(.system(size: 9, weight: .bold))
          .padding(.horizontal, 5)
          .padding(.vertical, 2)
          .background(Color.white.opacity(0.12))
          .foregroundStyle(Color(red: 0.78, green: 0.93, blue: 0.80))
          .clipShape(Capsule())
      }
    }
  }
}

struct FooterView: View {
  let snapshot: StudyPlannerWidgetSnapshot?

  var body: some View {
    HStack(spacing: 8) {
      if let warning = snapshot?.heavyWeekWarning, warning.isHeavy {
        Text(warning.label)
          .font(.system(size: 9, weight: .bold))
          .fontWeight(.semibold)
          .foregroundStyle(Color(red: 1.00, green: 0.66, blue: 0.44))
          .lineLimit(1)
      } else if let reviewCount = snapshot?.reviewQueueCount, reviewCount > 0 {
        Text("\\(reviewCount) to review")
          .font(.system(size: 9, weight: .bold))
          .fontWeight(.semibold)
          .foregroundStyle(widgetAccent)
          .lineLimit(1)
      }

      Spacer(minLength: 4)

      if let overflow = snapshot?.surfaces.medium.overflowCount, overflow > 0 {
        Text("+\\(overflow) more")
          .font(.system(size: 9, weight: .bold))
          .fontWeight(.bold)
          .foregroundStyle(widgetMuted)
      }
    }
  }
}

struct EmptyStateView: View {
  let title: String
  let message: String

  var body: some View {
    VStack(alignment: .leading, spacing: 5) {
      Spacer(minLength: 0)
      Text(title)
        .font(.system(size: 15, weight: .black))
        .fontWeight(.bold)
        .foregroundStyle(widgetText)
        .lineLimit(2)
        .minimumScaleFactor(0.8)
      Text(message)
        .font(.system(size: 10, weight: .semibold))
        .foregroundStyle(widgetMuted)
        .lineLimit(3)
      Spacer(minLength: 0)
    }
  }
}

struct UrgencyDot: View {
  let urgency: String

  var body: some View {
    Circle()
      .fill(urgencyColor(urgency))
      .frame(width: 7, height: 7)
  }
}

struct DuePill: View {
  let item: StudyPlannerWidgetSnapshotItem

  var body: some View {
    HStack(spacing: 5) {
      UrgencyDot(urgency: item.urgency)
      Text(item.dueLabel)
        .font(.system(size: 12, weight: .black))
        .foregroundStyle(urgencyColor(item.urgency))
        .lineLimit(1)
    }
    .padding(.horizontal, 8)
    .padding(.vertical, 5)
    .background(Color.white.opacity(0.10))
    .clipShape(Capsule())
  }
}

struct WidgetAuroraBands: View {
  let style: WidgetStyle?

  var body: some View {
    ZStack {
      RoundedRectangle(cornerRadius: 28)
        .fill((style?.secondaryColor ?? Color(red: 0.23, green: 0.43, blue: 0.86)).opacity(0.34))
        .frame(width: 150, height: 62)
        .rotationEffect(.degrees(24))
        .offset(x: 54, y: -54)
      RoundedRectangle(cornerRadius: 26)
        .fill((style?.accentColor ?? Color(red: 0.66, green: 0.22, blue: 0.55)).opacity(0.28))
        .frame(width: 150, height: 58)
        .rotationEffect(.degrees(-18))
        .offset(x: -58, y: 58)
    }
  }
}

func compactCourseName(_ name: String) -> String {
  switch name {
  case "Differential Calculus":
    return "Calculus II"
  case "Intro to Psychology":
    return "Psychology"
  case "Intro to Biology":
    return "Biology"
  case "Academic Writing":
    return "Writing"
  default:
    return name
  }
}

func urgencyColor(_ urgency: String) -> Color {
  switch urgency {
  case "overdue":
    return Color(red: 0.78, green: 0.12, blue: 0.13)
  case "today":
    return Color(red: 0.18, green: 0.43, blue: 0.92)
  case "soon":
    return Color(red: 0.85, green: 0.48, blue: 0.06)
  default:
    return Color(red: 0.12, green: 0.55, blue: 0.32)
  }
}

extension View {
  @ViewBuilder
  func studyPlannerWidgetBackground(_ style: WidgetStyle?) -> some View {
    let background = style?.backgroundColor ?? widgetBackground

    if #available(iOSApplicationExtension 17.0, *) {
      self.containerBackground(background, for: .widget)
    } else {
      self.background(background)
    }
  }
}

struct WidgetStyle: Decodable {
  let paletteId: String?
  let paletteName: String?
  let styleId: String?
  let styleName: String?
  let background: String?
  let text: String?
  let muted: String?
  let accent: String?
  let secondary: String?

  var backgroundColor: Color { colorFromHex(background) ?? widgetBackground }
  var accentColor: Color { colorFromHex(accent) ?? widgetAccent }
  var secondaryColor: Color { colorFromHex(secondary) ?? Color(red: 0.23, green: 0.43, blue: 0.86) }
}

func colorFromHex(_ value: String?) -> Color? {
  guard let value else { return nil }
  let trimmed = value.trimmingCharacters(in: CharacterSet(charactersIn: "#"))

  guard trimmed.count == 6, let number = UInt64(trimmed, radix: 16) else {
    return nil
  }

  let red = Double((number >> 16) & 0xFF) / 255.0
  let green = Double((number >> 8) & 0xFF) / 255.0
  let blue = Double(number & 0xFF) / 255.0

  return Color(red: red, green: green, blue: blue)
}

struct StudyPlannerWidgetSnapshot: Decodable {
  let version: Int
  let generatedAt: String
  let lastUpdated: String
  let semesterId: String
  let semesterName: String
  let nextDue: StudyPlannerWidgetSnapshotItem?
  let thisWeek: [StudyPlannerWidgetSnapshotItem]
  let overdueCount: Int
  let reviewQueueCount: Int
  let heavyWeekWarning: HeavyWeekWarning?
  let emptyState: EmptyState
  let widgetStyle: WidgetStyle?
  let demoState: DemoState?
  let surfaces: Surfaces

  static let placeholder = StudyPlannerWidgetSnapshot(
    version: 1,
    generatedAt: "2026-10-05T16:00:00.000Z",
    lastUpdated: "2026-10-05T16:00:00.000Z",
    semesterId: "placeholder",
    semesterName: "Fall Preview",
    nextDue: StudyPlannerWidgetSnapshotItem(
      assignmentId: "placeholder",
      title: "Discussion board: primary source post",
      courseId: "hist-204",
      courseName: "Modern World History",
      dueAt: "2026-10-05T18:00:00",
      type: "assignment",
      dueLabel: "Today",
      urgency: "today",
      urgencyLabel: "Due today",
      reviewStatus: "needsReview",
      completionStatus: "open"
    ),
    thisWeek: [],
    overdueCount: 0,
    reviewQueueCount: 3,
    heavyWeekWarning: HeavyWeekWarning(isHeavy: true, label: "Heavy week ahead", itemCount: 5, examCount: 1),
    emptyState: EmptyState(isEmpty: false, title: "No plan yet", message: "Scan a syllabus or add coursework to fill your widget."),
    widgetStyle: WidgetStyle(
      paletteId: "violetGlow",
      paletteName: "Violet Glow",
      styleId: "darkGlass",
      styleName: "Dark Glass",
      background: "#17152D",
      text: "#F8FAFC",
      muted: "#BCC7D8",
      accent: "#B7A7FF",
      secondary: "#3B82F6"
    ),
    demoState: DemoState(enabled: true, label: "Preview"),
    surfaces: Surfaces(
      small: SmallSurface(kind: "nextDue", item: StudyPlannerWidgetSnapshotItem(
        assignmentId: "placeholder",
        title: "Discussion board: primary source post",
        courseId: "hist-204",
        courseName: "Modern World History",
        dueAt: "2026-10-05T18:00:00",
        type: "assignment",
        dueLabel: "Today",
        urgency: "today",
        urgencyLabel: "Due today",
        reviewStatus: "needsReview",
        completionStatus: "open"
      ), emptyTitle: nil),
      medium: MediumSurface(kind: "thisWeek", items: [
        StudyPlannerWidgetSnapshotItem(
          assignmentId: "hist-forum-week-6",
          title: "Discussion board: primary source post",
          courseId: "hist-204",
          courseName: "Modern World History",
          dueAt: "2026-10-05T18:00:00",
          type: "assignment",
          dueLabel: "Today",
          urgency: "today",
          urgencyLabel: "Due today",
          reviewStatus: "needsReview",
          completionStatus: "open"
        ),
        StudyPlannerWidgetSnapshotItem(
          assignmentId: "bio-lab-prep-cells",
          title: "Lab prep: cells and microscopes",
          courseId: "bio-101",
          courseName: "Intro Biology",
          dueAt: "2026-10-06T21:00:00",
          type: "assignment",
          dueLabel: "Tomorrow",
          urgency: "soon",
          urgencyLabel: "Due soon",
          reviewStatus: "accepted",
          completionStatus: "open"
        )
      ], overflowCount: 1),
      large: LargeSurface(kind: "weeklyWorkload", items: [], heavyWeekWarning: nil),
      lockScreen: LockScreenSurface(kind: "countdown", item: nil, countdownLabel: nil)
    )
  )
}

struct StudyPlannerWidgetSnapshotItem: Decodable, Identifiable {
  let assignmentId: String
  let title: String
  let courseId: String
  let courseName: String
  let dueAt: String
  let type: String
  let dueLabel: String
  let urgency: String
  let urgencyLabel: String
  let reviewStatus: String
  let completionStatus: String

  var id: String { assignmentId }
}

struct HeavyWeekWarning: Decodable {
  let isHeavy: Bool
  let label: String
  let itemCount: Int
  let examCount: Int
}

struct EmptyState: Decodable {
  let isEmpty: Bool
  let title: String
  let message: String
}

struct DemoState: Decodable {
  let enabled: Bool
  let label: String
}

struct Surfaces: Decodable {
  let small: SmallSurface
  let medium: MediumSurface
  let large: LargeSurface
  let lockScreen: LockScreenSurface
}

struct SmallSurface: Decodable {
  let kind: String
  let item: StudyPlannerWidgetSnapshotItem?
  let emptyTitle: String?
}

struct MediumSurface: Decodable {
  let kind: String
  let items: [StudyPlannerWidgetSnapshotItem]
  let overflowCount: Int
}

struct LargeSurface: Decodable {
  let kind: String
  let items: [StudyPlannerWidgetSnapshotItem]
  let heavyWeekWarning: HeavyWeekWarning?
}

struct LockScreenSurface: Decodable {
  let kind: String
  let item: StudyPlannerWidgetSnapshotItem?
  let countdownLabel: String?
}

struct StudyPlannerWidget: Widget {
  let kind = "StudyPlannerWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: StudyPlannerProvider()) { entry in
      StudyPlannerWidgetView(entry: entry)
    }
    .configurationDisplayName("Study Planner")
    .description("See your next due item and this week's coursework.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct StudyPlannerWidgetBundle: WidgetBundle {
  var body: some Widget {
    StudyPlannerWidget()
  }
}
`;
}

function widgetInfoPlist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>$(DEVELOPMENT_LANGUAGE)</string>
  <key>CFBundleDisplayName</key>
  <string>Study Planner</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>Study Planner</string>
  <key>CFBundlePackageType</key>
  <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
  <key>CFBundleShortVersionString</key>
  <string>$(MARKETING_VERSION)</string>
  <key>CFBundleVersion</key>
  <string>$(CURRENT_PROJECT_VERSION)</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
  </dict>
</dict>
</plist>
`;
}

function entitlementsPlist(appGroupIdentifier) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.application-groups</key>
  <array>
    <string>${appGroupIdentifier}</string>
  </array>
</dict>
</plist>
`;
}

module.exports = withStudyPlannerWidget;
