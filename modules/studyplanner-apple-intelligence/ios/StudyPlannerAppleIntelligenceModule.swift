import ExpoModulesCore
import Foundation
import UIKit
#if canImport(FoundationModels)
import FoundationModels
#endif

// Expo module for StudyPlanner 2.2 on-device intelligence.
//
// Rules:
// - The app target stays at iOS 16.4. FoundationModels is weak-linked and every
//   FM-touching type is `@available(iOS 26.0, *)`. The module never stores an FM
//   type directly: the engine actor lives behind `Any?` in `EngineHolder`.
// - Inference only runs while the app is in the foreground (checked here AND in
//   the TS client), one request at a time, fresh LanguageModelSession per request.
// - Every error reaching JS carries `code` = one of the TS AIErrorCode strings.

public class StudyPlannerAppleIntelligenceModule: Module {
  private static let holder = EngineHolder()

  public func definition() -> ModuleDefinition {
    Name("StudyPlannerAppleIntelligence")

    AsyncFunction("availability") { (localeId: String) async -> [String: Any] in
      return Self.availability(localeId: localeId)
    }

    AsyncFunction("prewarm") { (feature: String) async -> Bool in
      #if canImport(FoundationModels)
      if #available(iOS 26.0, *) {
        guard case .available = SystemLanguageModel.default.availability else { return false }
        guard let engine = Self.holder.engine() as? AIEngine else { return false }
        await engine.prewarm(feature: feature)
        return true
      }
      #endif
      return false
    }

    AsyncFunction("run") { (feature: String, inputJson: String, requestId: String) async throws -> String in
      #if canImport(FoundationModels)
      if #available(iOS 26.0, *) {
        let state = await MainActor.run { UIApplication.shared.applicationState }
        guard state == .active else {
          throw Self.exception(AIBridgeError.background, "On-device AI only runs while StudyPlanner is open.")
        }
        guard case .available = SystemLanguageModel.default.availability else {
          throw Self.exception(AIBridgeError.unavailable, "The on-device model is not available.")
        }
        guard let engine = Self.holder.engine() as? AIEngine else {
          throw Self.exception(AIBridgeError.unavailable, "The on-device model is not available.")
        }
        do {
          return try await engine.run(feature: feature, inputJson: inputJson, requestId: requestId)
        } catch {
          throw Self.exception(AIFeatures.errorCode(for: error), String(describing: error))
        }
      }
      #endif
      throw Self.exception(AIBridgeError.unavailable, "On-device AI requires iOS 26.")
    }

    AsyncFunction("cancel") { (requestId: String) async -> Bool in
      #if canImport(FoundationModels)
      if #available(iOS 26.0, *) {
        guard let engine = Self.holder.existingEngine() as? AIEngine else { return false }
        return await engine.cancel(requestId: requestId)
      }
      #endif
      return false
    }

    AsyncFunction("readDocument") { (uri: String) async throws -> [String: Any] in
      do {
        return try await DocumentReader.read(uri: uri).dictionary
      } catch let error as AIBridgeError {
        throw Self.exception(error.code, error.message)
      } catch {
        throw Self.exception(AIBridgeError.decoding, "That document could not be read.")
      }
    }

    AsyncFunction("writeAppGroupJSON") { (name: String, json: String) async -> Bool in
      return AppGroupStore.write(name: name, json: json)
    }

    AsyncFunction("readAppGroupJSON") { (name: String) async -> String? in
      return AppGroupStore.read(name: name)
    }

    AsyncFunction("deleteAppGroupJSON") { (name: String) async -> Bool in
      return AppGroupStore.delete(name: name)
    }

    AsyncFunction("indexSpotlight") { (json: String) async -> Int in
      return await SpotlightIndexer.index(json: json)
    }

    AsyncFunction("clearSpotlight") { () async -> Bool in
      return await SpotlightIndexer.clearAll()
    }
  }

  // MARK: - Availability

  static func availability(localeId: String) -> [String: Any] {
    let osVersion = ProcessInfo.processInfo.operatingSystemVersion
    let osString = "\(osVersion.majorVersion).\(osVersion.minorVersion).\(osVersion.patchVersion)"
    var documentReader = false
    #if compiler(>=6.2)
    if #available(iOS 26.0, *) { documentReader = true }
    #endif

    var result: [String: Any] = [
      "state": "unsupportedOS",
      "contextSize": 4096,
      "osVersion": osString,
      "documentReader": documentReader,
    ]

    #if canImport(FoundationModels)
    if #available(iOS 26.0, *) {
      let model = SystemLanguageModel.default
      // contextSize is @backDeployed(before: iOS 26.4) to 26.0 (needs the 26.4+ SDK).
      let contextSize = model.contextSize
      result["contextSize"] = contextSize > 0 ? contextSize : 4096
      switch model.availability {
      case .available:
        let trimmed = localeId.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.isEmpty && !model.supportsLocale(Locale(identifier: trimmed)) {
          result["state"] = "unavailable"
          result["reason"] = "localeUnsupported"
        } else {
          result["state"] = "available"
        }
      case .unavailable(let reason):
        result["state"] = "unavailable"
        switch reason {
        case .deviceNotEligible: result["reason"] = "deviceNotEligible"
        case .appleIntelligenceNotEnabled: result["reason"] = "appleIntelligenceNotEnabled"
        case .modelNotReady: result["reason"] = "modelNotReady"
        @unknown default: result["reason"] = "modelNotReady"
        }
      }
    }
    #endif
    return result
  }

  static func exception(_ code: String, _ message: String) -> Exception {
    Exception(name: "StudyPlannerAppleIntelligenceError", description: message, code: code)
  }
}

/// Holds the engine actor as `Any?` so the module class itself never references
/// an iOS 26-only type in a stored property.
final class EngineHolder: @unchecked Sendable {
  private let lock = NSLock()
  private var storage: Any?

  func engine() -> Any? {
    lock.lock()
    defer { lock.unlock() }
    #if canImport(FoundationModels)
    if #available(iOS 26.0, *) {
      if storage == nil { storage = AIEngine() }
    }
    #endif
    return storage
  }

  func existingEngine() -> Any? {
    lock.lock()
    defer { lock.unlock() }
    return storage
  }
}

#if canImport(FoundationModels)
/// Serial executor for on-device requests. Requests run strictly one after another
/// (each awaits the previous one's completion), each on a fresh session.
@available(iOS 26.0, *)
actor AIEngine {
  /// Queue depth beyond which new requests are rejected with `busy`.
  static let maxPending = 4
  /// Native safety ceiling; the TS client normally cancels much earlier.
  static let hardTimeoutSeconds: UInt64 = 60

  private var tasks: [String: Task<String, Error>] = [:]
  private var timedOut: Set<String> = []
  private var cancelled: Set<String> = []
  private var tail: Task<Void, Never>?
  private var prewarmed: [String: LanguageModelSession] = [:]

  func prewarm(feature: String) {
    guard AIFeatures.supported.contains(feature), prewarmed[feature] == nil else { return }
    let session = AIFeatures.makeSession(for: feature)
    session.prewarm()
    prewarmed[feature] = session
  }

  func run(feature: String, inputJson: String, requestId: String) async throws -> String {
    guard AIFeatures.supported.contains(feature) else {
      throw AIBridgeError(AIBridgeError.unavailable, "Unknown feature.")
    }
    guard tasks.count < AIEngine.maxPending else {
      throw AIBridgeError(AIBridgeError.busy, "Too many on-device requests are waiting.")
    }
    if tasks[requestId] != nil {
      throw AIBridgeError(AIBridgeError.busy, "Duplicate request id.")
    }

    // Use a prewarmed session once (then drop it), otherwise a fresh one.
    let session = prewarmed.removeValue(forKey: feature) ?? AIFeatures.makeSession(for: feature)
    let previous = tail
    let task = Task<String, Error> {
      if let previous { await previous.value }
      try Task.checkCancellation()
      return try await AIFeatures.execute(feature: feature, inputJson: inputJson, session: session)
    }
    tasks[requestId] = task
    tail = Task { _ = try? await task.value }

    let watchdog = Task { [weak self] in
      try? await Task.sleep(nanoseconds: AIEngine.hardTimeoutSeconds * 1_000_000_000)
      if Task.isCancelled { return }
      await self?.expire(requestId: requestId)
    }
    defer { watchdog.cancel() }

    do {
      let value = try await task.value
      finish(requestId)
      return value
    } catch {
      let wasTimedOut = timedOut.contains(requestId)
      let wasCancelled = cancelled.contains(requestId)
      finish(requestId)
      if wasTimedOut { throw AIBridgeError(AIBridgeError.timeout, "The on-device model took too long.") }
      if wasCancelled || error is CancellationError { throw AIBridgeError(AIBridgeError.cancelled, "Cancelled.") }
      throw error
    }
  }

  @discardableResult
  func cancel(requestId: String) -> Bool {
    guard let task = tasks[requestId] else { return false }
    cancelled.insert(requestId)
    task.cancel()
    return true
  }

  private func expire(requestId: String) {
    guard let task = tasks[requestId] else { return }
    timedOut.insert(requestId)
    task.cancel()
  }

  private func finish(_ requestId: String) {
    tasks[requestId] = nil
    timedOut.remove(requestId)
    cancelled.remove(requestId)
  }
}
#endif
