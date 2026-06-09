import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const outDir = path.join(root, "test-results", "android-screenshots");
const adb = process.env.ADB || path.join(process.env.LOCALAPPDATA || "", "Android", "Sdk", "platform-tools", "adb.exe");
const packageName = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8")).expo.android.package;

fs.mkdirSync(outDir, { recursive: true });

const devices = run(adb, ["devices"]).split(/\r?\n/).filter((line) => /\tdevice$/.test(line));
if (!devices.length) fail("No authorized Android emulator or device is connected.");

const serial = process.env.ANDROID_SERIAL || devices[0].split(/\s+/)[0];
if (process.env.ANDROID_SCREENSHOT_KEEP_DATA !== "1") {
  run(adb, ["-s", serial, "shell", "pm", "clear", packageName]);
}
run(adb, ["-s", serial, "shell", "monkey", "-p", packageName, "-c", "android.intent.category.LAUNCHER", "1"]);
sleep(3000);
if (process.env.ANDROID_DISMISS_DEV_WARNING === "1") {
  dismissDevWarning();
}

const shots = [
  { name: "01-onboarding-name.png", before: null },
  {
    name: "02-student-type.png",
    before: () => {
      run(adb, ["-s", serial, "shell", "input", "tap", "540", "960"]);
      sleep(250);
      run(adb, ["-s", serial, "shell", "input", "text", "Alex"]);
      sleep(250);
      run(adb, ["-s", serial, "shell", "input", "keyevent", "ENTER"]);
      sleep(1600);
    }
  },
  {
    name: "03-main-goal.png",
    before: () => {
      run(adb, ["-s", serial, "shell", "input", "tap", "540", "690"]);
      sleep(350);
      run(adb, ["-s", serial, "shell", "input", "tap", "540", "2160"]);
      sleep(1600);
    }
  }
];

const manifest = { generatedAt: new Date().toISOString(), serial, packageName, shots: [] };

for (const shot of shots) {
  if (shot.before) shot.before();

  const devicePath = `/sdcard/${shot.name}`;
  const localPath = path.join(outDir, shot.name);
  run(adb, ["-s", serial, "shell", "screencap", "-p", devicePath]);
  run(adb, ["-s", serial, "pull", devicePath, localPath]);
  run(adb, ["-s", serial, "shell", "rm", devicePath]);

  const stat = fs.statSync(localPath);
  const dimensions = readPngDimensions(localPath);
  manifest.shots.push({
    name: shot.name,
    path: path.relative(root, localPath),
    bytes: stat.size,
    width: dimensions.width,
    height: dimensions.height,
    score: scoreShot(stat.size, dimensions)
  });
}

fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`Captured ${manifest.shots.length} Android screenshots to ${path.relative(root, outDir)}.`);
console.log(JSON.stringify(manifest, null, 2));

function run(command, args) {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const stderr = error?.stderr ? String(error.stderr) : "";
    fail(`${command} ${args.join(" ")} failed.${stderr ? `\n${stderr}` : ""}`);
  }
}

function readPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fail(`${filePath} is not a PNG screenshot.`);
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function scoreShot(bytes, dimensions) {
  let score = 100;
  if (bytes < 30_000) score -= 40;
  if (dimensions.width < 1080) score -= 20;
  if (dimensions.height < 1920) score -= 20;
  return Math.max(0, score);
}

function dismissDevWarning() {
  run(adb, ["-s", serial, "shell", "input", "tap", "1010", "2205"]);
  sleep(250);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
