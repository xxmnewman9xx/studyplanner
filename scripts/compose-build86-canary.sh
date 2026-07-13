#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROOF_ROOT="$ROOT/outputs/build86-native-proof"
OUTPUT_ROOT="$ROOT/outputs/imagegen/generative-polish/build86-widget-led-conversion/canary-draft/en-US"
REVIEW_PATH="$ROOT/outputs/imagegen/generative-polish/build86-widget-led-conversion/canary-review.json"
PROVENANCE_PATH="$ROOT/outputs/imagegen/generative-polish/build86-widget-led-conversion/canary-provenance.json"
FONT="/System/Library/Fonts/SFNS.ttf"

SLUGS=(
  "01-syllabus-to-plan.png"
  "02-needs-you-today.png"
  "03-before-you-open.png"
  "04-heavy-weeks.png"
  "05-deadlines-to-focus.png"
  "06-every-class-moving.png"
  "07-review-uncertain-dates.png"
)
HEADLINES=(
  "Turn your syllabus into a plan."
  "Know what needs you today."
  "Your next move—before you open the app."
  "See heavy weeks before they hit."
  "Turn deadlines into focus time."
  "Keep every class moving."
  "Review uncertain dates before they count."
)
FAMILIES=("hero" "loop-light" "widgets-home-screen" "schedule" "focus" "loop-dark" "review")
SOURCE_KEYS=("scan-light" "today-light" "home-screen-widgets-final" "plan-dark" "focus-dark" "today-dark" "review-light")
PALETTE_A=("#F7F4EE" "#F7F4EE" "#F2EEE5" "#050507" "#0A0712" "#050507" "#F7F4EE")
PALETTE_B=("#EAF7EE" "#ECE8FF" "#FFF1E5" "#1B1128" "#271040" "#0E2B1C" "#FFF4E8")
FOREGROUNDS=("#050507" "#050507" "#050507" "#FFFFFF" "#FFFFFF" "#FFFFFF" "#050507")
ACCENTS=("#16883B" "#7453E6" "#A45D00" "#F28A00" "#7453E6" "#16883B" "#F28A00")

mkdir -p "$OUTPUT_ROOT/APP_IPHONE_65" "$OUTPUT_ROOT/APP_IPAD_PRO_3GEN_129"

compose_build86_canary_slide() {
  local source="$1" output="$2" headline="$3" width="$4" height="$5" index="$6"
  local panel_width panel_height headline_width point_size headline_height panel_y border_radius
  if [[ "$width" == "1242" ]]; then
    panel_width=1110
    panel_height=2240
    headline_width=1080
    point_size=82
    headline_height=300
    panel_y=370
    border_radius=54
  else
    panel_width=1840
    panel_height=2240
    headline_width=1740
    point_size=104
    headline_height=330
    panel_y=410
    border_radius=64
  fi

  local work
  work="$(mktemp -d)"
  magick -size "${width}x${height}" "gradient:${PALETTE_A[$index]}-${PALETTE_B[$index]}" \
    -fill "${ACCENTS[$index]}" -draw "rectangle 0,0 ${width},24" "$work/background.png"

  magick "$source" -resize "${panel_width}x" -gravity north \
    -crop "${panel_width}x${panel_height}+0+0" +repage \
    -bordercolor "${ACCENTS[$index]}" -border 4 "$work/panel-square.png"

  magick -size "${panel_width}x${panel_height}" xc:none \
    -fill white -draw "roundrectangle 0,0 $((panel_width - 1)),$((panel_height - 1)),${border_radius},${border_radius}" \
    "$work/mask.png"
  magick "$work/panel-square.png" "$work/mask.png" -alpha off -compose CopyOpacity -composite \
    "$work/panel.png"
  magick "$work/panel.png" \( +clone -background '#00000066' -shadow 42x22+0+28 \) \
    +swap -background none -layers merge +repage "$work/framed-panel.png"

  magick -background none -fill "${FOREGROUNDS[$index]}" -font "$FONT" -pointsize "$point_size" \
    -gravity center -size "${headline_width}x${headline_height}" "caption:${headline}" "$work/headline.png"

  magick "$work/background.png" \
    "$work/framed-panel.png" -gravity north -geometry "+0+${panel_y}" -compose over -composite \
    "$work/headline.png" -gravity north -geometry "+0+54" -compose over -composite \
    -strip -define png:exclude-chunk=time "$output"
  rm -rf "$work"
}

resolve_source() {
  local device="$1" key="$2"
  if [[ "$key" == "home-screen-widgets-final" ]]; then
    printf '%s/%s/en-US/%s.png' "$PROOF_ROOT" "$device" "$key"
  else
    printf '%s/%s/en-US/app-atlas/%s.png' "$PROOF_ROOT" "$device" "$key"
  fi
}

for device in iphone ipad; do
  if [[ "$device" == "iphone" ]]; then
    store_device="APP_IPHONE_65"
    width=1242
    height=2688
  else
    store_device="APP_IPAD_PRO_3GEN_129"
    width=2048
    height=2732
  fi
  for index in "${!SLUGS[@]}"; do
    source="$(resolve_source "$device" "${SOURCE_KEYS[$index]}")"
    output="$OUTPUT_ROOT/$store_device/${SLUGS[$index]}"
    [[ -f "$source" ]] || { echo "missing source: $source" >&2; exit 1; }
    if [[ -f "$output" && "${STUDYPLANNER_FORCE_CANARY_COMPOSE:-0}" != "1" ]]; then
      echo "reused $store_device/${SLUGS[$index]}"
    else
      compose_build86_canary_slide "$source" "$output" "${HEADLINES[$index]}" "$width" "$height" "$index"
      echo "composed $store_device/${SLUGS[$index]}"
    fi
  done
done

magick montage \
  "$OUTPUT_ROOT/APP_IPHONE_65/"*.png "$OUTPUT_ROOT/APP_IPAD_PRO_3GEN_129/"*.png \
  -thumbnail 230x500 -font "$FONT" -background '#D9D9DE' -geometry +12+12 -tile 7x2 \
  "$OUTPUT_ROOT/build86-en-US-canary-contact-sheet.png"

ROOT="$ROOT" OUTPUT_ROOT="$OUTPUT_ROOT" REVIEW_PATH="$REVIEW_PATH" PROVENANCE_PATH="$PROVENANCE_PATH" \
node --input-type=module <<'NODE'
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const root = process.env.ROOT;
const outputRoot = process.env.OUTPUT_ROOT;
const reviewPath = process.env.REVIEW_PATH;
const provenancePath = process.env.PROVENANCE_PATH;
const devices = ["APP_IPHONE_65", "APP_IPAD_PRO_3GEN_129"];
const deviceFolders = { APP_IPHONE_65: "iphone", APP_IPAD_PRO_3GEN_129: "ipad" };
const slugs = [
  "01-syllabus-to-plan.png", "02-needs-you-today.png", "03-before-you-open.png",
  "04-heavy-weeks.png", "05-deadlines-to-focus.png", "06-every-class-moving.png",
  "07-review-uncertain-dates.png",
];
const headlines = [
  "Turn your syllabus into a plan.", "Know what needs you today.",
  "Your next move—before you open the app.", "See heavy weeks before they hit.",
  "Turn deadlines into focus time.", "Keep every class moving.",
  "Review uncertain dates before they count.",
];
const families = ["hero", "loop-light", "widgets-home-screen", "schedule", "focus", "loop-dark", "review"];
const sourceKeys = ["scan-light", "today-light", "home-screen-widgets-final", "plan-dark", "focus-dark", "today-dark", "review-light"];
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const assets = [];
for (const device of devices) {
  for (let index = 0; index < slugs.length; index += 1) {
    const deviceFolder = deviceFolders[device];
    const source = sourceKeys[index] === "home-screen-widgets-final"
      ? join(root, "outputs/build86-native-proof", deviceFolder, "en-US", `${sourceKeys[index]}.png`)
      : join(root, "outputs/build86-native-proof", deviceFolder, "en-US", "app-atlas", `${sourceKeys[index]}.png`);
    const output = join(outputRoot, device, slugs[index]);
    assets.push({
      locale: "en-US",
      device,
      slideIndex: index + 1,
      family: families[index],
      headline: headlines[index],
      path: relative(root, output),
      sha256: sha256(output),
      sourcePath: relative(root, source),
      sourceHash: sha256(source),
      prompt: "Bold Academic Editorial generative polish: preserve the supplied Build 86 simulator app pixels; add only calm poster framing, exact deterministic headline typography, safe zones, and a restrained StudyPlanner color atmosphere.",
      generationMetadata: {
        workflow: "claude_creative_production_generative_polish",
        method: "deterministic_imagemagick_composite",
        aiImageGenerations: 0,
        visualReferenceWeight: "near_90_percent_current_live_preview_system",
      },
      uiTreatment: "immutable_build86_simulator_pixels",
      textTreatment: "deterministic_en_US_typography",
      reviewStatus: "pending_human_canary_review",
      releaseEligible: false,
    });
  }
}
mkdirSync(dirname(reviewPath), { recursive: true });
writeFileSync(reviewPath, `${JSON.stringify({
  schemaVersion: 1,
  status: "pending_review",
  locale: "en-US",
  assetCount: assets.length,
  note: "Draft canary only. These are signed Build 86 simulator QA captures, not exact production-IPA media provenance.",
  assets,
}, null, 2)}\n`);
writeFileSync(provenancePath, `${JSON.stringify({
  schemaVersion: 1,
  workflow: "claude_creative_production_generative_polish",
  status: "canary_draft",
  sourceBinary: {
    version: "2.0.9",
    buildNumber: "86",
    provenanceClass: "signed_release_simulator_qa_not_production_ipa",
    productionIpaSha256: "3cfc2d4c482fd088fba2b00e9ab8e39487b8edfc3b772dbb4b97176ab482888a",
  },
  aiImageGenerations: 0,
  jobs: assets,
}, null, 2)}\n`);
NODE

echo "Canary draft: $OUTPUT_ROOT"
echo "Review manifest: $REVIEW_PATH"
