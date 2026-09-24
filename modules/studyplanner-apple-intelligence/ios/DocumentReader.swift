// Document reading for syllabus import.
//
// iOS 26+: Vision `RecognizeDocumentsRequest` (Swift API) keeps table structure:
//   table rows are emitted as `cell | cell | cell` lines; paragraphs and tables
//   are interleaved in reading order (top to bottom).
// Older OS or failure: VNRecognizeTextRequest (.accurate), flat lines.
// PDFs: per page, use the embedded text layer (PDFPage.string) when present,
//   otherwise render the page at 2x with PDFKit and OCR it. Capped at 20 pages.

import Foundation
import ImageIO
import PDFKit
import UIKit
import Vision

struct DocumentReadResult {
  var text: String
  var pages: Int
  var usedDocumentReader: Bool

  var dictionary: [String: Any] {
    ["text": text, "pages": pages, "usedDocumentReader": usedDocumentReader]
  }
}

enum DocumentReader {
  static let maxPages = 20
  /// A page whose text layer has fewer characters than this is treated as scanned.
  static let minimumTextLayerCharacters = 40

  static func read(uri: String) async throws -> DocumentReadResult {
    let url = fileURL(from: uri)
    if isPDF(url) {
      return try await readPDF(url)
    }
    let image = try loadImage(url)
    guard let cgImage = image.cgImage else {
      throw AIBridgeError(AIBridgeError.decoding, "That image could not be decoded.")
    }
    let (text, usedDocumentReader) = try await recognize(cgImage: cgImage, orientation: cgOrientation(from: image.imageOrientation))
    return DocumentReadResult(text: text, pages: 1, usedDocumentReader: usedDocumentReader)
  }

  // MARK: PDF

  private static func readPDF(_ url: URL) async throws -> DocumentReadResult {
    guard let document = PDFDocument(url: url) else {
      throw AIBridgeError(AIBridgeError.decoding, "That PDF could not be opened.")
    }
    let pageCount = min(document.pageCount, maxPages)
    var pageTexts: [String] = []
    var usedDocumentReader = false

    for index in 0..<pageCount {
      try Task.checkCancellation()
      guard let page = document.page(at: index) else { continue }
      let embedded = (page.string ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
      if embedded.count >= minimumTextLayerCharacters {
        pageTexts.append(embedded)
        continue
      }
      guard let cgImage = render(page: page) else {
        if !embedded.isEmpty { pageTexts.append(embedded) }
        continue
      }
      let (text, used) = (try? await recognize(cgImage: cgImage, orientation: .up)) ?? ("", false)
      usedDocumentReader = usedDocumentReader || used
      let best = text.count >= embedded.count ? text : embedded
      if !best.isEmpty { pageTexts.append(best) }
    }

    return DocumentReadResult(
      text: pageTexts.joined(separator: "\n\n"),
      pages: pageCount,
      usedDocumentReader: usedDocumentReader
    )
  }

  private static func render(page: PDFPage) -> CGImage? {
    let bounds = page.bounds(for: .mediaBox)
    guard bounds.width > 0, bounds.height > 0 else { return nil }
    // 2x, but keep the long edge <= 3000 px to bound memory.
    let scale = min(2.0, 3000.0 / max(bounds.width, bounds.height))
    let size = CGSize(width: bounds.width * scale, height: bounds.height * scale)
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    format.opaque = true
    let renderer = UIGraphicsImageRenderer(size: size, format: format)
    let image = renderer.image { context in
      UIColor.white.setFill()
      context.fill(CGRect(origin: .zero, size: size))
      // PDF space has a bottom-left origin: flip into UIKit space, then scale.
      context.cgContext.translateBy(x: 0, y: size.height)
      context.cgContext.scaleBy(x: scale, y: -scale)
      page.draw(with: .mediaBox, to: context.cgContext)
    }
    return image.cgImage
  }

  // MARK: Recognition

  static func recognize(cgImage: CGImage, orientation: CGImagePropertyOrientation) async throws -> (String, Bool) {
    #if compiler(>=6.2)
    if #available(iOS 26.0, *) {
      if let structured = try? await StructuredDocumentReader.read(cgImage: cgImage, orientation: orientation),
         !structured.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
        return (structured, true)
      }
    }
    #endif
    return (try legacyRecognize(cgImage: cgImage, orientation: orientation), false)
  }

  static func legacyRecognize(cgImage: CGImage, orientation: CGImagePropertyOrientation) throws -> String {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.minimumTextHeight = 0.012
    if let supported = try? VNRecognizeTextRequest.supportedRecognitionLanguages(for: .accurate, revision: request.revision) {
      let preferred = ["en-US", "en-GB", "es-ES", "es-MX", "fr-FR", "fr-CA", "de-DE", "pt-BR", "pt-PT", "ja-JP", "ko-KR", "zh-Hans", "zh-Hant"]
      let filtered = preferred.filter { supported.contains($0) }
      if !filtered.isEmpty { request.recognitionLanguages = filtered }
    }
    let handler = VNImageRequestHandler(cgImage: cgImage, orientation: orientation, options: [:])
    try handler.perform([request])
    return (request.results ?? [])
      .compactMap { $0.topCandidates(1).first?.string }
      .joined(separator: "\n")
      .trimmingCharacters(in: .whitespacesAndNewlines)
  }

  // MARK: Helpers

  static func fileURL(from uri: String) -> URL {
    if let url = URL(string: uri), url.scheme != nil { return url }
    return URL(fileURLWithPath: uri)
  }

  private static func isPDF(_ url: URL) -> Bool {
    if url.pathExtension.lowercased() == "pdf" { return true }
    guard url.isFileURL, let handle = try? FileHandle(forReadingFrom: url) else { return false }
    defer { try? handle.close() }
    let header = handle.readData(ofLength: 5)
    return header == Data("%PDF-".utf8)
  }

  private static func loadImage(_ url: URL) throws -> UIImage {
    if url.isFileURL, let image = UIImage(contentsOfFile: url.path) {
      return image
    }
    guard url.isFileURL else {
      throw AIBridgeError(AIBridgeError.decoding, "Only local files can be read.")
    }
    let data = try Data(contentsOf: url)
    guard let image = UIImage(data: data) else {
      throw AIBridgeError(AIBridgeError.decoding, "That image could not be opened.")
    }
    return image
  }

  static func cgOrientation(from orientation: UIImage.Orientation) -> CGImagePropertyOrientation {
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

#if compiler(>=6.2)
/// iOS 26 table-aware reader (Vision Swift API).
@available(iOS 26.0, *)
enum StructuredDocumentReader {
  private struct Block {
    let top: CGFloat
    let text: String
  }

  static func read(cgImage: CGImage, orientation: CGImagePropertyOrientation) async throws -> String {
    var request = RecognizeDocumentsRequest()
    request.textRecognitionOptions.useLanguageCorrection = true
    let handler = ImageRequestHandler(cgImage, orientation: orientation)
    let observations = try await handler.perform(request)

    var blocks: [Block] = []
    for observation in observations {
      let container = observation.document
      var tableTexts = Set<String>()

      for table in container.tables {
        var lines: [String] = []
        for row in table.rows {
          let cells = row.map { cell in
            cell.content.text.transcript
              .replacingOccurrences(of: "\n", with: " ")
              .trimmingCharacters(in: .whitespacesAndNewlines)
          }
          for cell in cells where !cell.isEmpty { tableTexts.insert(normalized(cell)) }
          if cells.contains(where: { !$0.isEmpty }) {
            lines.append(cells.joined(separator: " | "))
          }
        }
        if !lines.isEmpty {
          blocks.append(Block(top: table.boundingRegion.boundingBox.cgRect.maxY, text: lines.joined(separator: "\n")))
        }
      }

      for paragraph in container.paragraphs {
        let text = paragraph.transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { continue }
        // Skip paragraphs that are just a table cell we already emitted as a row.
        if tableTexts.contains(normalized(text)) { continue }
        blocks.append(Block(top: paragraph.boundingRegion.boundingBox.cgRect.maxY, text: text))
      }
    }

    // Normalized coordinates have a lower-left origin: larger maxY = higher on the page.
    // Stable sort keeps Vision's own order for blocks on the same line.
    let ordered = blocks.enumerated().sorted { lhs, rhs in
      if abs(lhs.element.top - rhs.element.top) > 0.004 { return lhs.element.top > rhs.element.top }
      return lhs.offset < rhs.offset
    }
    return ordered.map { $0.element.text }.joined(separator: "\n")
  }

  private static func normalized(_ text: String) -> String {
    text.lowercased().components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }.joined(separator: " ")
  }
}
#endif
