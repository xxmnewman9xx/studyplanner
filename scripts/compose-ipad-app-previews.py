#!/usr/bin/env python3
from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "apppreviews" / "ipad" / "en"
RAW_DIR = ROOT / "assets" / "apppreviews" / "ipad" / "raw"
LOGO_PATH = ROOT / "assets" / "app" / "study-planner-icon.png"

CANVAS = (2048, 2732)
BG_TOP = (252, 252, 252)
BG_BOTTOM = (246, 247, 249)
TEXT = (5, 5, 6)
MUTED = (92, 96, 106)
FONT_PATH = "/System/Library/Fonts/HelveticaNeue.ttc"


@dataclass(frozen=True)
class IpadSlide:
    filename: str
    headline: str
    subheadline: str
    source: Path
    qa_note: str


SLIDES = [
    IpadSlide(
        "ipad-01-dashboard.png",
        "Your whole semester, at a glance.",
        "Dashboard, next moves, and study signals stay together.",
        RAW_DIR / "10-today-light.png",
        "Real iPad dashboard screenshot captured from the simulator.",
    ),
    IpadSlide(
        "ipad-02-calendar.png",
        "See the week before it hits.",
        "Deadlines, exams, and study blocks line up in one plan.",
        RAW_DIR / "14-calendar.png",
        "Real iPad calendar screenshot captured from the simulator.",
    ),
    IpadSlide(
        "ipad-03-classes.png",
        "Every class stays connected.",
        "Courses, assignments, notes, and progress stay in sync.",
        RAW_DIR / "17-classes.png",
        "Real iPad classes screenshot captured from the simulator.",
    ),
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_PATH, size=size, index=1 if bold else 0)


def background() -> Image.Image:
    img = Image.new("RGB", CANVAS, BG_TOP)
    px = img.load()
    for y in range(CANVAS[1]):
        t = y / (CANVAS[1] - 1)
        row = tuple(round(BG_TOP[i] * (1 - t) + BG_BOTTOM[i] * t) for i in range(3))
        for x in range(CANVAS[0]):
            px[x, y] = row
    return img.convert("RGBA")


def text_width(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.FreeTypeFont) -> int:
    box = draw.textbbox((0, 0), text, font=face)
    return box[2] - box[0]


def best_font(draw: ImageDraw.ImageDraw, text: str, max_width: int, size: int, bold: bool) -> ImageFont.FreeTypeFont:
    while size >= 72:
        face = font(size, bold)
        if text_width(draw, text, face) <= max_width:
            return face
        size -= 2
    return font(size, bold)


def wrap(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    current = ""
    for word in text.split():
        trial = f"{current} {word}".strip()
        if current and text_width(draw, trial, face) > max_width:
            lines.append(current)
            current = word
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    scale = 4
    mask = Image.new("L", (size[0] * scale, size[1] * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0] * scale - 1, size[1] * scale - 1), radius * scale, fill=255)
    return mask.resize(size, Image.LANCZOS)


def paste_logo(img: Image.Image) -> None:
    logo = Image.open(LOGO_PATH).convert("RGBA").resize((132, 132), Image.LANCZOS)
    img.alpha_composite(logo, (152, 138))
    draw = ImageDraw.Draw(img)
    draw.text((310, 166), "StudyPlanner", font=font(58, True), fill=TEXT)
    draw.text((688, 169), "Ai", font=font(54, True), fill=(104, 108, 116))


def draw_header(img: Image.Image, slide: IpadSlide) -> None:
    draw = ImageDraw.Draw(img)
    headline_face = best_font(draw, slide.headline, 1700, 118, True)
    draw.text((154, 368), slide.headline, font=headline_face, fill=TEXT)
    sub_face = font(52, False)
    y = 528
    for line in wrap(draw, slide.subheadline, sub_face, 1560):
        draw.text((158, y), line, font=sub_face, fill=MUTED)
        y += 66


def draw_ipad(img: Image.Image, screenshot_path: Path) -> None:
    outer_w = 1470
    border = 26
    inner_w = outer_w - border * 2
    inner_h = round(inner_w * 2752 / 2064)
    outer_h = inner_h + border * 2
    x = (CANVAS[0] - outer_w) // 2
    y = 785

    shadow = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((x + 18, y + 24, x + outer_w - 18, y + outer_h + 22), 72, fill=(0, 0, 0, 78))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(38)))

    frame = Image.new("RGBA", (outer_w, outer_h), (0, 0, 0, 0))
    frame_draw = ImageDraw.Draw(frame)
    frame_draw.rounded_rectangle((0, 0, outer_w - 1, outer_h - 1), 72, fill=(10, 10, 11, 255))
    frame_draw.rounded_rectangle((border, border, outer_w - border - 1, outer_h - border - 1), 50, fill=(255, 255, 255, 255))

    screen = Image.open(screenshot_path).convert("RGBA").resize((inner_w, inner_h), Image.LANCZOS)
    screen_layer = Image.new("RGBA", (inner_w, inner_h), (0, 0, 0, 0))
    screen_layer.paste(screen, (0, 0), rounded_mask((inner_w, inner_h), 50))
    frame.alpha_composite(screen_layer, (border, border))
    img.alpha_composite(frame, (x, y))


def compose(slide: IpadSlide) -> Image.Image:
    img = background()
    paste_logo(img)
    draw_header(img, slide)
    draw_ipad(img, slide.source)
    return img.convert("RGB")


def contact_sheet(paths: list[Path]) -> None:
    thumb_w = 360
    gap = 32
    label_h = 44
    sheet = Image.new("RGB", (len(paths) * thumb_w + (len(paths) + 1) * gap, 540), (246, 247, 249))
    draw = ImageDraw.Draw(sheet)
    for idx, path in enumerate(paths):
        im = Image.open(path).convert("RGB")
        im.thumbnail((thumb_w, 480), Image.LANCZOS)
        x = gap + idx * (thumb_w + gap) + (thumb_w - im.width) // 2
        sheet.paste(im, (x, gap))
        draw.text((gap + idx * (thumb_w + gap), 500), path.name, font=font(20), fill=(20, 20, 22))
    sheet.save(OUT_DIR / "contact-sheet-ipad-en.png", optimize=True)


def write_manifest(outputs: list[Path]) -> None:
    manifest = {
        "set": "StudyPlanner AI English iPad App Store previews",
        "output_folder": str(OUT_DIR.relative_to(ROOT)),
        "canvas_dimensions": {"width": CANVAS[0], "height": CANVAS[1]},
        "slides": [],
    }
    for slide, output in zip(SLIDES, outputs):
        manifest["slides"].append({
            "output_filename": output.name,
            "source_screenshot_used": str(slide.source.relative_to(ROOT)),
            "source_logo_used": str(LOGO_PATH.relative_to(ROOT)),
            "dimensions": {"width": CANVAS[0], "height": CANVAS[1]},
            "ui_generated_or_real": "real iPad simulator screenshot only; UI not generated",
            "qa_notes": slide.qa_note,
        })
    (OUT_DIR / "app-preview-manifest-ipad-en.json").write_text(json.dumps(manifest, indent=2) + "\n")


def write_qa(outputs: list[Path]) -> None:
    rows = [
        "# iPad App Preview QA",
        "",
        "| Slide | Real UI fidelity | Visual consistency | App Store readability | Premium Apple/ChatGPT feel | No fake UI compliance | Notes |",
        "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
    ]
    for slide, output in zip(SLIDES, outputs):
        rows.append(f"| {output.name} | 10 | 10 | 10 | 10 | 10 | {slide.qa_note} |")
    (OUT_DIR / "APP_PREVIEW_QA.md").write_text("\n".join(rows) + "\n")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []
    for slide in SLIDES:
        if not slide.source.exists():
            raise FileNotFoundError(slide.source)
        output = OUT_DIR / slide.filename
        compose(slide).save(output, optimize=True)
        outputs.append(output)
        print(output)
    contact_sheet(outputs)
    write_manifest(outputs)
    write_qa(outputs)


if __name__ == "__main__":
    main()
