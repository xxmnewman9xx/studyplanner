#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const sourceRoot = path.join(repoRoot, "artifacts/post-goal-aso-submission");
const exportRoot = path.join(sourceRoot, "app-store-export");
const iphoneDir = path.join(exportRoot, "iphone-6-9");
const ipadDir = path.join(exportRoot, "ipad-13");
const targetIphone = { width: 1290, height: 2796 };
const targetIpad = { width: 2064, height: 2752 };
const appleScreenshotSpecUrl =
  "https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications";

const iphoneStory = [
  ["01", "01-onboarding-welcome.png"],
  ["02", "10-add-school-stuff.png"],
  ["03", "16-check-new-work-needs-check.png"],
  ["04", "21-calendar-month.png"],
  ["05", "07-today-populated.png"],
  ["06", "24-week-plan.png"],
  ["07", "26-classes-list.png"],
  ["08", "29-widget-setup.png"],
  ["09", "30-small-widget-home-screen.png"],
  ["10", "31-medium-widget-home-screen.png"]
];

const ipadStory = [
  ["01", "ipad-01-onboarding-welcome.png"],
  ["02", "ipad-02-today-populated.png"],
  ["03", "ipad-03-add-school-stuff.png"],
  ["04", "ipad-04-check-new-work-edit.png"],
  ["05", "ipad-05-calendar-month.png"],
  ["06", "ipad-06-week-plan.png"],
  ["07", "ipad-07-classes-list.png"],
  ["08", "ipad-08-widget-setup.png"],
  ["09", "ipad-10-settings-restore.png"],
  ["10", "ipad-11-assignment-detail.png"]
];

function readPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);

  if (buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`${filePath} is not a PNG`);
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function cleanDirectory(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory, { recursive: true });
}

function assertFileExists(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing screenshot source: ${filePath}`);
  }
}

function exportIphoneScreenshot(index, sourceFileName) {
  const source = path.join(sourceRoot, sourceFileName);
  const output = path.join(iphoneDir, `${index}-${sourceFileName}`);
  assertFileExists(source);

  execFileSync("sips", [
    "-z",
    String(targetIphone.height),
    String(targetIphone.width),
    source,
    "--out",
    output
  ], { stdio: "pipe" });

  const dimensions = readPngDimensions(output);
  if (dimensions.width !== targetIphone.width || dimensions.height !== targetIphone.height) {
    throw new Error(
      `${output} exported as ${dimensions.width}x${dimensions.height}, expected ${targetIphone.width}x${targetIphone.height}`
    );
  }

  return {
    slot: index,
    source: path.relative(repoRoot, source),
    output: path.relative(repoRoot, output),
    dimensions
  };
}

function exportIpadScreenshot(index, sourceFileName) {
  const source = path.join(sourceRoot, "ipad", sourceFileName);
  const output = path.join(ipadDir, `${index}-${sourceFileName}`);
  assertFileExists(source);

  const sourceDimensions = readPngDimensions(source);
  if (sourceDimensions.width !== targetIpad.width || sourceDimensions.height !== targetIpad.height) {
    throw new Error(
      `${source} is ${sourceDimensions.width}x${sourceDimensions.height}, expected ${targetIpad.width}x${targetIpad.height}`
    );
  }

  fs.copyFileSync(source, output);
  const outputDimensions = readPngDimensions(output);

  return {
    slot: index,
    source: path.relative(repoRoot, source),
    output: path.relative(repoRoot, output),
    dimensions: outputDimensions
  };
}

function assertUploadCount(kind, exported) {
  if (exported.length < 1 || exported.length > 10) {
    throw new Error(`${kind} export has ${exported.length} screenshots; App Store Connect supports 1 to 10`);
  }
}

function main() {
  cleanDirectory(iphoneDir);
  cleanDirectory(ipadDir);

  const iphone = iphoneStory.map(([index, fileName]) => exportIphoneScreenshot(index, fileName));
  const ipad = ipadStory.map(([index, fileName]) => exportIpadScreenshot(index, fileName));

  assertUploadCount("iPhone", iphone);
  assertUploadCount("iPad", ipad);

  const manifest = {
    generatedAt: new Date().toISOString(),
    appleScreenshotSpecUrl,
    note:
      "Local accepted-size candidate export. Final App Store Connect upload still requires manual upload/status confirmation.",
    iphone: {
      display: "6.9-inch",
      acceptedPortraitSize: targetIphone,
      strategy: "Scaled from real 1179x2556 simulator PNGs to an Apple-accepted 1290x2796 portrait size.",
      screenshots: iphone
    },
    ipad: {
      display: "13-inch",
      acceptedPortraitSize: targetIpad,
      strategy: "Copied real 2064x2752 iPad simulator PNGs after dimension validation.",
      screenshots: ipad
    }
  };

  fs.writeFileSync(path.join(exportRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Exported ${iphone.length} iPhone screenshots to ${path.relative(repoRoot, iphoneDir)}`);
  console.log(`Exported ${ipad.length} iPad screenshots to ${path.relative(repoRoot, ipadDir)}`);
  console.log(`Wrote ${path.relative(repoRoot, path.join(exportRoot, "manifest.json"))}`);
}

main();
