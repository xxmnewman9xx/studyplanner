import {
  closeSyllabusOcrWorkerForTests,
  handleSyllabusParseRequest
} from "../server/syllabus-parser/handler";

declare const require: any;
declare const process: {
  exit(code?: number): never;
};

const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const failures: string[] = [];

function assert(condition: unknown, message: string) {
  if (!condition) failures.push(message);
}

async function run() {
  try {
    const imagePath = createSyllabusImageFixture();
    const imageBytes = fs.readFileSync(imagePath);
    const form = new FormData();
    form.append("kind", "photo");
    form.append("file", new Blob([imageBytes], { type: "image/png" }), "bio-101-syllabus-photo.png");

    const response = await handleSyllabusParseRequest(
      new Request("https://parser.example.test/v1/syllabus/parse", {
        method: "POST",
        body: form
      })
    );
    const parsed = await response.json() as any;
    const titles = (parsed.assignments || []).map((assignment: any) => assignment.title);

    assert(response.status === 200, `Photo OCR parser should return 200, got ${response.status}.`);
    assert(titles.some((title: string) => /lab report/i.test(title)), "Photo OCR should extract Lab Report.");
    assert(titles.some((title: string) => /final exam/i.test(title)), "Photo OCR should extract Final Exam.");
    assert(
      parsed.assignments?.some((assignment: any) => assignment.dueAt?.startsWith("2026-09-12")),
      "Photo OCR should preserve the Lab Report due date."
    );
    assert(
      parsed.assignments?.some((assignment: any) => assignment.dueAt?.startsWith("2026-12-10")),
      "Photo OCR should preserve the Final Exam due date."
    );

    if (failures.length) {
      console.error("Photo OCR import failures:");
      for (const failure of failures) console.error(`- ${failure}`);
      console.error(JSON.stringify(parsed, null, 2));
      await closeSyllabusOcrWorkerForTests();
      process.exit(1);
    }

    console.log("photo OCR import fixture passed");
    console.log(`source: ${parsed.sourceName}`);
    console.log(`assignments: ${titles.join(", ")}`);
  } finally {
    await closeSyllabusOcrWorkerForTests();
  }
}

function createSyllabusImageFixture() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "studyplanner-photo-ocr-"));
  const htmlPath = path.join(tmp, "syllabus.html");
  fs.writeFileSync(
    htmlPath,
    [
      "<html>",
      "<body style=\"font: 48px Helvetica; width: 1100px; padding: 72px; color: black; background: white;\">",
      "BIO 101 Fall 2026<br>",
      "Lab Report due September 12, 2026<br>",
      "Final Exam December 10, 2026",
      "</body>",
      "</html>"
    ].join("")
  );

  try {
    childProcess.execFileSync("qlmanage", ["-t", "-s", "1400", "-o", tmp, htmlPath], {
      stdio: "pipe"
    });
  } catch {
    console.error("Photo OCR fixture generation requires macOS qlmanage.");
    process.exit(1);
  }

  const imagePath = `${htmlPath}.png`;
  if (!fs.existsSync(imagePath)) {
    console.error(`Photo OCR fixture image was not created at ${imagePath}.`);
    process.exit(1);
  }
  return imagePath;
}

void run();
