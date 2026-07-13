#!/usr/bin/env python3
import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

PANELS = [
    "scan-light",
    "scanner-ready-dark",
    "import-options-light",
    "manual-input-light",
    "review-light",
    "plan-dark",
    "today-light",
    "widgets-light",
]
SLIDES = [
    {"index": 1, "id": "01-scan-material", "panels": ["scan-light", "scanner-ready-dark"], "palette": "luminous white, controlled mint, sky-blue spectral energy", "mode": "light"},
    {"index": 2, "id": "02-add-your-way", "panels": ["import-options-light", "manual-input-light"], "palette": "three restrained mint, sky-blue, and soft-violet spectral streams converging into a calm white field", "mode": "light"},
    {"index": 3, "id": "03-approve-deadlines", "panels": ["review-light"], "palette": "warm white clarity with a restrained emerald confirmation glow", "mode": "light"},
    {"index": 4, "id": "04-make-time", "panels": ["plan-dark"], "palette": "deep ink with subtle cobalt and violet edge light", "mode": "dark"},
    {"index": 5, "id": "05-next-move", "panels": ["today-light", "widgets-light"], "palette": "warm morning white with mint, peach, and pale-blue spectral depth", "mode": "light"},
]
DEVICES = {
    "iphone": {"slot": "APP_IPHONE_65", "size": (1242, 2688)},
    "ipad": {"slot": "APP_IPAD_PRO_3GEN_129", "size": (2048, 2732)},
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def font_path(locale: str, bold: bool) -> tuple[str, int]:
    if locale == "hi":
        return "/System/Library/Fonts/Supplemental/Devanagari Sangam MN.ttc", 1 if bold else 0
    if locale.startswith("ar"):
        return "/System/Library/Fonts/Supplemental/Arial Unicode.ttf", 0
    if locale.startswith("ko"):
        return "/System/Library/Fonts/AppleSDGothicNeo.ttc", 6 if bold else 0
    if locale.startswith(("ja", "zh")):
        return "/System/Library/Fonts/Hiragino Sans GB.ttc", 2 if bold else 0
    return "/System/Library/Fonts/HelveticaNeue.ttc", 1 if bold else 0


def load_font(locale: str, size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path, index = font_path(locale, bold)
    return ImageFont.truetype(path, size=size, index=index)


def source_for(original_root: Path, missing_root: Path, widget_root: Path, device: str, locale: str, panel: str) -> tuple[Path, dict]:
    root = widget_root if panel == "widgets-light" else missing_root if panel in {"import-options-light", "manual-input-light"} else original_root
    image_path = root / device / locale / f"{panel}.png"
    sidecar_path = image_path.with_suffix(".json")
    if not image_path.exists() or not sidecar_path.exists():
        raise RuntimeError(f"missing source pair: {image_path}")
    sidecar = read_json(sidecar_path)
    actual_hash = sha256_file(image_path)
    if sidecar.get("screenshotSha256") != actual_hash:
        raise RuntimeError(f"source hash mismatch: {image_path}")
    if sidecar.get("appVersion") != "2.0.8" or str(sidecar.get("buildNumber")) != "84":
        raise RuntimeError(f"source is not Build 84: {image_path}")
    if sidecar.get("resolvedLocale") != locale or bool(sidecar.get("rtl")) != locale.startswith("ar"):
        raise RuntimeError(f"locale/direction mismatch: {image_path}")
    return image_path, sidecar


def build_atlases(args: argparse.Namespace) -> None:
    copy = read_json(args.copy)
    locales = list(copy["localizations"].keys())
    atlas_root = args.artifact_root / "atlases"
    records = []
    for locale in locales:
        for device in DEVICES:
            canvas = Image.new("RGB", (2400, 3000), "#ECECF1")
            draw = ImageDraw.Draw(canvas)
            label_font = load_font("en-US", 34, True)
            panels = []
            for index, panel in enumerate(PANELS):
                col, row = index % 3, index // 3
                cell = (col * 800, row * 1000, col * 800 + 800, row * 1000 + 1000)
                draw.rectangle(cell, fill="#F7F7F9", outline="#C8C8CF", width=2)
                draw.rectangle((cell[0], cell[1], cell[2], cell[1] + 64), fill="#17171B")
                draw.text((cell[0] + 18, cell[1] + 16), f"P{index + 1} · {panel}", font=label_font, fill="white")
                source_path, sidecar = source_for(args.original_root, args.missing_root, args.widget_root, device, locale, panel)
                with Image.open(source_path) as source:
                    source = source.convert("RGB")
                    source.thumbnail((740, 890), Image.Resampling.LANCZOS)
                    x = cell[0] + (800 - source.width) // 2
                    y = cell[1] + 78 + (908 - source.height) // 2
                    canvas.paste(source, (x, y))
                    atlas_rect = {"x": x, "y": y, "width": source.width, "height": source.height}
                panels.append({
                    "id": f"P{index + 1}",
                    "role": panel,
                    "atlasRect": atlas_rect,
                    "sourcePath": str(source_path),
                    "sourceSha256": sidecar["screenshotSha256"],
                    "sourceSize": {"width": sidecar["width"], "height": sidecar["height"]},
                    "sourceCandidateBundleSha256": sidecar["candidateBundleSha256"],
                })
            atlas_path = atlas_root / locale / f"{device}-build84-ui-atlas.png"
            atlas_path.parent.mkdir(parents=True, exist_ok=True)
            canvas.save(atlas_path, format="PNG", optimize=True)
            if atlas_path.stat().st_size >= 20 * 1024 * 1024:
                raise RuntimeError(f"atlas exceeds 20 MB: {atlas_path}")
            record = {
                "schemaVersion": 1,
                "locale": locale,
                "rtl": locale.startswith("ar"),
                "device": device,
                "atlasPath": str(atlas_path),
                "atlasSha256": sha256_file(atlas_path),
                "atlasBytes": atlas_path.stat().st_size,
                "panels": panels,
            }
            write_json(atlas_path.with_suffix(".json"), record)
            records.append(record)
            print(f"atlas {len(records)}/34 {locale}/{device}")
    write_json(args.artifact_root / "atlas-manifest.json", {"schemaVersion": 1, "atlasCount": len(records), "records": records})


def placements(device: str, count: int) -> list[dict]:
    if device == "iphone":
        return ([{"x": 48, "y": 1030, "width": 550}, {"x": 644, "y": 1030, "width": 550}]
                if count == 2 else [{"x": 186, "y": 770, "width": 870}])
    return ([{"x": 124, "y": 1280, "width": 850}, {"x": 1074, "y": 1280, "width": 850}]
            if count == 2 else [{"x": 284, "y": 735, "width": 1480}])


def build_queue(args: argparse.Namespace) -> None:
    copy = read_json(args.copy)
    atlas_manifest = read_json(args.artifact_root / "atlas-manifest.json")
    atlas_by_key = {(item["locale"], item["device"]): item for item in atlas_manifest["records"]}
    jobs = []
    for locale, localized_slides in copy["localizations"].items():
        localized_by_id = {slide["id"]: slide for slide in localized_slides}
        for device, device_spec in DEVICES.items():
            atlas = atlas_by_key[(locale, device)]
            panel_by_role = {panel["role"]: panel for panel in atlas["panels"]}
            for slide in SLIDES:
                localized = localized_by_id[slide["id"]]
                job_id = f"b84-if-{locale}-{device}-s{slide['index']:02d}"
                refs = [panel_by_role[role] for role in slide["panels"]]
                geometry = placements(device, len(refs))
                width, height = device_spec["size"]
                prompt = f"""Use case: ads-marketing
Asset type: App Store screenshot background plate
Primary request: Use the attached Build 84 UI atlas as locked product truth and as a palette and placement reference. Generate only the surrounding background treatment. Do not redraw, reproduce, crop, interpret, or include any UI, text, status bar, icons, screens, devices, or claims from the reference.
Style/medium: premium Intelligence Flow treatment with Apple-like product clarity, ChatGPT-like spectral warmth, generous whitespace, translucent depth, and controlled edge lighting; original art direction, no copied trade dress.
Composition/framing: portrait {width}:{height}; reserve the top 24% as calm headline space. Keep these final-product UI rectangles quiet and high contrast: {json.dumps(geometry, separators=(',', ':'))}. Referenced atlas panels: {', '.join(f"{item['id']}={item['role']}" for item in refs)}.
Lighting/mood: {slide['palette']}.
Constraints: background only; abstract light and depth only. Arabic locale reverses visual motion naturally with no cultural motif. No text, letters, numbers, logos, UI, devices, screens, charts, people, objects, plants, paper stationery, watercolor, cultural symbols, flags, or watermarks. Job: {job_id}."""
                jobs.append({
                    "jobId": job_id,
                    "locale": locale,
                    "rtl": locale.startswith("ar"),
                    "device": device,
                    "screenSlot": device_spec["slot"],
                    "slide": slide,
                    "copy": {"headline": localized["headline"], "subhead": localized["subhead"]},
                    "atlasPath": atlas["atlasPath"],
                    "atlasSha256": atlas["atlasSha256"],
                    "referencedPanels": refs,
                    "requiredOutputSize": {"width": width, "height": height},
                    "placements": geometry,
                    "prompt": prompt,
                    "promptSha256": hashlib.sha256(prompt.encode("utf-8")).hexdigest(),
                    "attempt": 1,
                    "status": "queued",
                    "generationSurface": "GPT Image 2.0",
                })
    if len(jobs) != 170 or len({job["promptSha256"] for job in jobs}) != 170:
        raise RuntimeError("queue must contain 170 unique prompts")
    payload = {"schemaVersion": 1, "copyStatus": copy["status"], "jobCount": len(jobs), "jobs": jobs}
    write_json(args.artifact_root / "intelligence-flow-job-queue.json", payload)
    write_json(args.artifact_root / "provenance-ledger.json", payload)
    print(f"queued {len(jobs)} unique Image 2.0 jobs")


def wrap_lines(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = list(text) if " " not in text else text.split()
    separator = "" if " " not in text else " "
    lines, current = [], ""
    for word in words:
        candidate = word if not current else current + separator + word
        if current and draw.textbbox((0, 0), candidate, font=font)[2] > max_width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def fit_cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    scale = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    return resized.crop((left, top, left + size[0], top + size[1]))


def compose_one(job: dict, background: Path, final: Path) -> dict:
    size = (job["requiredOutputSize"]["width"], job["requiredOutputSize"]["height"])
    with Image.open(background) as source_background:
        canvas = fit_cover(source_background.convert("RGB"), size)
    draw = ImageDraw.Draw(canvas)
    dark = job["slide"]["mode"] == "dark"
    headline_color = "#FFFFFF" if dark else "#111114"
    subhead_color = "#D7D7DF" if dark else "#42424A"
    headline_size = 92 if job["device"] == "iphone" else 104
    subhead_size = 40 if job["device"] == "iphone" else 44
    margin = 84 if job["device"] == "iphone" else 132
    max_width = size[0] - 2 * margin
    headline_font = load_font(job["locale"], headline_size, True)
    subhead_font = load_font(job["locale"], subhead_size)
    headline_lines = wrap_lines(draw, job["copy"]["headline"], headline_font, max_width)
    subhead_lines = wrap_lines(draw, job["copy"]["subhead"], subhead_font, max_width)
    rtl = job["rtl"]
    anchor_x = size[0] - margin if rtl else margin
    anchor = "ra" if rtl else "la"
    y = 104 if job["device"] == "iphone" else 118
    for line in headline_lines:
        rendered_line = get_display(arabic_reshaper.reshape(line)) if rtl else line
        draw.text((anchor_x, y), rendered_line, font=headline_font, fill=headline_color, anchor=anchor)
        y += round(headline_size * 1.08)
    y += 24
    for line in subhead_lines:
        rendered_line = get_display(arabic_reshaper.reshape(line)) if rtl else line
        draw.text((anchor_x, y), rendered_line, font=subhead_font, fill=subhead_color, anchor=anchor)
        y += round(subhead_size * 1.3)
    placed = []
    ui_layers = []
    combined_shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(combined_shadow)
    for ref, box in zip(job["referencedPanels"], job["placements"]):
        source_path = Path(ref["sourcePath"])
        with Image.open(source_path) as source:
            source = source.convert("RGB")
            height = round(box["width"] * source.height / source.width)
            resized = source.resize((box["width"], height), Image.Resampling.LANCZOS)
        shadow_draw.rounded_rectangle((box["x"] - 12, box["y"] - 12, box["x"] + box["width"] + 12, box["y"] + height + 12), radius=28, fill=(0, 0, 0, 70))
        ui_layers.append((resized, box["x"], box["y"]))
        placed.append({**box, "height": height, "sourcePath": str(source_path), "resizedSha256": hashlib.sha256(resized.tobytes()).hexdigest()})
    combined_shadow = combined_shadow.filter(ImageFilter.GaussianBlur(22))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), combined_shadow).convert("RGB")
    for resized, x, y in ui_layers:
        canvas.paste(resized, (x, y))
    final.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(final, format="PNG", optimize=True, icc_profile=None)
    return {"placedUi": placed, "finalSha256": sha256_file(final), "pixelSignature": hashlib.sha256(canvas.tobytes()).hexdigest()}


def compose(args: argparse.Namespace) -> None:
    ledger_path = args.artifact_root / "provenance-ledger.json"
    ledger = read_json(ledger_path)
    selected = set(args.jobs.split(",")) if args.jobs else None
    count = 0
    for job in ledger["jobs"]:
        if selected and job["jobId"] not in selected:
            continue
        background = args.artifact_root / "backgrounds" / f"{job['jobId']}-a{job['attempt']}.png"
        if not background.exists():
            raise RuntimeError(f"missing background: {background}")
        final = args.artifact_root / "finals" / job["locale"] / job["screenSlot"] / f"{job['slide']['id']}.png"
        result = compose_one(job, background, final)
        job.update({
            "backgroundPath": str(background),
            "backgroundSha256": sha256_file(background),
            "downloadPath": str(final),
            "dimensions": job["requiredOutputSize"],
            "status": "composed_pending_qa",
            **result,
        })
        count += 1
    write_json(ledger_path, ledger)
    print(f"composed {count} finals")


def validate(args: argparse.Namespace) -> None:
    ledger = read_json(args.artifact_root / "provenance-ledger.json")
    selected = set(args.jobs.split(",")) if args.jobs else None
    findings, hashes, pixels = [], set(), set()
    for job in ledger["jobs"]:
        if selected and job["jobId"] not in selected:
            continue
        if "downloadPath" not in job:
            findings.append({"jobId": job["jobId"], "pass": False, "errors": ["not composed"]})
            continue
        final = Path(job["downloadPath"])
        errors = []
        with Image.open(final) as image:
            image = image.convert("RGB")
            expected = (job["requiredOutputSize"]["width"], job["requiredOutputSize"]["height"])
            if image.size != expected:
                errors.append(f"dimensions {image.size} != {expected}")
            pixel = hashlib.sha256(image.tobytes()).hexdigest()
            if pixel in pixels:
                errors.append("duplicate decoded pixel signature")
            pixels.add(pixel)
            for placed in job["placedUi"]:
                with Image.open(placed["sourcePath"]) as source:
                    expected_ui = source.convert("RGB").resize((placed["width"], placed["height"]), Image.Resampling.LANCZOS)
                actual = image.crop((placed["x"], placed["y"], placed["x"] + placed["width"], placed["y"] + placed["height"]))
                if ImageChops.difference(actual, expected_ui).getbbox() is not None:
                    errors.append(f"UI mismatch: {placed['sourcePath']}")
        digest = sha256_file(final)
        if digest in hashes:
            errors.append("duplicate file hash")
        hashes.add(digest)
        findings.append({"jobId": job["jobId"], "pass": not errors, "errors": errors})
    report = {"schemaVersion": 1, "assetCount": len(findings), "passCount": sum(item["pass"] for item in findings), "hardFailureCount": sum(not item["pass"] for item in findings), "findings": findings}
    write_json(args.artifact_root / "machine-qa.json", report)
    print(json.dumps({key: report[key] for key in ("assetCount", "passCount", "hardFailureCount")}, indent=2))
    if report["hardFailureCount"]:
        raise SystemExit(1)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["atlases", "queue", "compose", "validate"])
    parser.add_argument("--original-root", type=Path, default=Path("/private/tmp/StudyPlanner-build84-media-raw"))
    parser.add_argument("--missing-root", type=Path, default=Path("/private/tmp/StudyPlanner-build84-media-missing-accepted"))
    parser.add_argument("--widget-root", type=Path, default=Path("/private/tmp/StudyPlanner-build84-media-widgets-accepted"))
    parser.add_argument("--artifact-root", type=Path, default=Path("/Users/mattnewman/work/StudyPlanner-release-artifacts/build84/intelligence-flow"))
    parser.add_argument("--copy", type=Path, default=Path("docs/launch/back-to-school-2026/build84-intelligence-flow-copy.json"))
    parser.add_argument("--jobs", default="")
    args = parser.parse_args()
    {"atlases": build_atlases, "queue": build_queue, "compose": compose, "validate": validate}[args.command](args)


if __name__ == "__main__":
    main()
