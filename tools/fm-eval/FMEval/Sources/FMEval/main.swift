// FMEval: runs the shipping `syllabusExtract` feature over fixture files and
// writes one output per fixture for scripts/eval-extraction.ts.
//
//   swift run -c release FMEval --fixtures ../fixtures --out ../outputs [--language en-US] [--only <id>]
//
// Input:  <fixtures>/*.json = { "id": string, "text": string, "language"?: string, ... }
// Output: <out>/<id>.json   = { "id", "chunks": [ { "chunkText", "raw": RawSyllabusChunk, "error"?, "elapsedMs" } ], "meta" }

import Foundation
import FoundationModels

// MARK: - Arguments

struct Arguments {
  var fixtures = "../fixtures"
  var out = "../outputs"
  var language = "en-US"
  var only: String?

  init(_ argv: [String]) {
    var index = 1
    while index < argv.count {
      let flag = argv[index]
      let value = index + 1 < argv.count ? argv[index + 1] : nil
      switch flag {
      case "--fixtures": if let value { fixtures = value; index += 1 }
      case "--out": if let value { out = value; index += 1 }
      case "--language": if let value { language = value; index += 1 }
      case "--only": if let value { only = value; index += 1 }
      case "-h", "--help":
        print("usage: FMEval --fixtures <dir> --out <dir> [--language en-US] [--only <id>]")
        exit(0)
      default:
        FileHandle.standardError.write(Data("Unknown argument \(flag)\n".utf8))
      }
      index += 1
    }
  }
}

// MARK: - Chunking (keep in sync with the TS chunker in src/appleIntelligence/context.ts)
//
// Rule: split on blank-line groups; greedily pack paragraphs into chunks of at
// most `limit` characters; a single paragraph longer than `limit` is split on
// line boundaries (and a single over-long line is hard-split).

func chunkText(_ text: String, limit: Int = 2500) -> [String] {
  let lines = text.replacingOccurrences(of: "\r\n", with: "\n").replacingOccurrences(of: "\r", with: "\n")
    .components(separatedBy: "\n")

  var paragraphs: [String] = []
  var current: [String] = []
  for line in lines {
    if line.trimmingCharacters(in: .whitespaces).isEmpty {
      if !current.isEmpty { paragraphs.append(current.joined(separator: "\n")); current = [] }
    } else {
      current.append(line)
    }
  }
  if !current.isEmpty { paragraphs.append(current.joined(separator: "\n")) }

  // Break over-long paragraphs into line groups.
  var pieces: [String] = []
  for paragraph in paragraphs {
    if paragraph.count <= limit { pieces.append(paragraph); continue }
    var buffer = ""
    for line in paragraph.components(separatedBy: "\n") {
      var rest = Substring(line)
      while rest.count > limit {
        if !buffer.isEmpty { pieces.append(buffer); buffer = "" }
        pieces.append(String(rest.prefix(limit)))
        rest = rest.dropFirst(limit)
      }
      let candidate = buffer.isEmpty ? String(rest) : buffer + "\n" + rest
      if candidate.count > limit {
        pieces.append(buffer)
        buffer = String(rest)
      } else {
        buffer = candidate
      }
    }
    if !buffer.isEmpty { pieces.append(buffer) }
  }

  var chunks: [String] = []
  var chunk = ""
  for piece in pieces {
    let candidate = chunk.isEmpty ? piece : chunk + "\n\n" + piece
    if candidate.count > limit, !chunk.isEmpty {
      chunks.append(chunk)
      chunk = piece
    } else {
      chunk = candidate
    }
  }
  if !chunk.isEmpty { chunks.append(chunk) }
  return chunks
}

// MARK: - Output

struct ChunkOutput: Encodable {
  var chunkText: String
  var raw: RawSyllabusChunkDTO
  var error: String?
  var elapsedMs: Int
}

struct Meta: Encodable {
  var osVersion: String
  var schemaVersion: Int
  var instructionsVersion: Int
  var contextSize: Int
  var language: String
  var generatedAt: String
}

struct FixtureOutput: Encodable {
  var id: String
  var chunks: [ChunkOutput]
  var meta: Meta
}

// MARK: - Main

let args = Arguments(CommandLine.arguments)
let fileManager = FileManager.default
let fixturesURL = URL(fileURLWithPath: args.fixtures, isDirectory: true)
let outURL = URL(fileURLWithPath: args.out, isDirectory: true)

let model = SystemLanguageModel.default
switch model.availability {
case .available:
  break
case .unavailable(let reason):
  FileHandle.standardError.write(Data("On-device model unavailable: \(reason). Turn on Apple Intelligence and let the model download.\n".utf8))
  exit(2)
}

try fileManager.createDirectory(at: outURL, withIntermediateDirectories: true)
let fixtureFiles = ((try? fileManager.contentsOfDirectory(at: fixturesURL, includingPropertiesForKeys: nil)) ?? [])
  .filter { $0.pathExtension == "json" }
  .sorted { $0.lastPathComponent < $1.lastPathComponent }

if fixtureFiles.isEmpty {
  FileHandle.standardError.write(Data("No fixtures found in \(fixturesURL.path)\n".utf8))
  exit(1)
}

let os = ProcessInfo.processInfo.operatingSystemVersion
let osVersion = "\(os.majorVersion).\(os.minorVersion).\(os.patchVersion)"
let isoFormatter = ISO8601DateFormatter()
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]

var written = 0
var failedChunks = 0
for file in fixtureFiles {
  guard
    let data = try? Data(contentsOf: file),
    let object = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
    let id = object["id"] as? String,
    let text = object["text"] as? String
  else {
    FileHandle.standardError.write(Data("Skipping \(file.lastPathComponent): needs { id, text }\n".utf8))
    continue
  }
  if let only = args.only, only != id { continue }
  let language = (object["language"] as? String) ?? (object["locale"] as? String) ?? args.language

  var outputs: [ChunkOutput] = []
  for chunk in chunkText(text) {
    let started = Date()
    do {
      let raw = try await AIFeatures.syllabusExtract(text: chunk, language: language)
      outputs.append(ChunkOutput(chunkText: chunk, raw: raw, error: nil, elapsedMs: Int(Date().timeIntervalSince(started) * 1000)))
    } catch {
      failedChunks += 1
      outputs.append(ChunkOutput(
        chunkText: chunk,
        raw: RawSyllabusChunkDTO(courses: [], items: []),
        error: AIFeatures.errorCode(for: error),
        elapsedMs: Int(Date().timeIntervalSince(started) * 1000)
      ))
    }
  }

  let output = FixtureOutput(
    id: id,
    chunks: outputs,
    meta: Meta(
      osVersion: osVersion,
      schemaVersion: AIVersions.schema,
      instructionsVersion: AIVersions.instructions,
      contextSize: model.contextSize,
      language: language,
      generatedAt: isoFormatter.string(from: Date())
    )
  )
  let target = outURL.appendingPathComponent("\(id).json")
  try encoder.encode(output).write(to: target, options: [.atomic])
  written += 1
  let items = outputs.reduce(0) { $0 + $1.raw.items.count }
  print("\(id): \(outputs.count) chunk(s), \(items) item(s)")
}

print("Wrote \(written) file(s) to \(outURL.path) on macOS \(osVersion); \(failedChunks) chunk error(s).")
