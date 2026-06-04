import ExpoModulesCore
import ImageIO
import Vision
import UIKit

public class StudyPlannerVisionOcrModule: Module {
  public func definition() -> ModuleDefinition {
    Name("StudyPlannerVisionOcr")

    AsyncFunction("recognizeText") { (uri: String) async throws -> String in
      let image = try Self.loadImage(uri)
      guard let cgImage = image.cgImage else {
        throw NSError(domain: "StudyPlannerVisionOcr", code: 2, userInfo: [
          NSLocalizedDescriptionKey: "That photo could not be decoded for text recognition."
        ])
      }

      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      request.usesLanguageCorrection = true
      request.recognitionLanguages = ["en-US"]
      request.minimumTextHeight = 0.015

      let handler = VNImageRequestHandler(
        cgImage: cgImage,
        orientation: Self.cgOrientation(from: image.imageOrientation),
        options: [:]
      )
      try handler.perform([request])

      let text = (request.results ?? [])
        .compactMap { $0.topCandidates(1).first?.string }
        .joined(separator: "\n")
        .trimmingCharacters(in: .whitespacesAndNewlines)

      if text.isEmpty {
        throw NSError(domain: "StudyPlannerVisionOcr", code: 3, userInfo: [
          NSLocalizedDescriptionKey: "No readable school material text was found in that photo."
        ])
      }

      return text
    }
  }

  private static func loadImage(_ uri: String) throws -> UIImage {
    let url = URL(string: uri) ?? URL(fileURLWithPath: uri)
    if url.isFileURL, let image = UIImage(contentsOfFile: url.path) {
      return image
    }

    let data = try Data(contentsOf: url)
    guard let image = UIImage(data: data) else {
      throw NSError(domain: "StudyPlannerVisionOcr", code: 1, userInfo: [
        NSLocalizedDescriptionKey: "That photo could not be opened for text recognition."
      ])
    }
    return image
  }

  private static func cgOrientation(from orientation: UIImage.Orientation) -> CGImagePropertyOrientation {
    switch orientation {
    case .up: return .up
    case .down: return .down
    case .left: return .left
    case .right: return .right
    case .upMirrored: return .upMirrored
    case .downMirrored: return .downMirrored
    case .leftMirrored: return .leftMirrored
    case .rightMirrored: return .rightMirrored
    @unknown default: return .up
    }
  }
}
