import { readFileSync, renameSync, writeFileSync } from "node:fs";

const path = "store.config.json";
const root = "store/apple/screenshot-build86-creative-production";
const devices = ["APP_IPHONE_65", "APP_IPAD_PRO_3GEN_129"];
const slides = [
  "01-syllabus-to-plan.png",
  "02-needs-you-today.png",
  "03-before-you-open.png",
  "04-heavy-weeks.png",
  "05-deadlines-to-focus.png",
  "06-every-class-moving.png",
  "07-review-uncertain-dates.png",
];

const config = JSON.parse(readFileSync(path, "utf8"));
config.apple.version = "2.0.9";
for (const locale of Object.keys(config.apple.info || {})) {
  config.apple.info[locale].screenshots ||= {};
  for (const device of devices) {
    config.apple.info[locale].screenshots[device] = slides.map((slide) => `${root}/${locale}/${device}/${slide}`);
  }
}

const temporary = `${path}.${process.pid}.tmp`;
writeFileSync(temporary, `${JSON.stringify(config, null, 2)}\n`);
renameSync(temporary, path);
