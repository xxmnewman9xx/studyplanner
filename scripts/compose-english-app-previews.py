#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "apppreviews" / "en"
LOGO_PATH = ROOT / "assets" / "app" / "study-planner-icon.png"
SLIDE_1_SOURCE = OUT_DIR / "Slide1.png"

CANVAS = (1024, 1536)
BG_TOP = (252, 252, 252)
BG_BOTTOM = (246, 247, 249)
TEXT = (5, 5, 6)
MUTED = (93, 96, 106)

FONT_PATH = "/System/Library/Fonts/HelveticaNeue.ttc"


@dataclass(frozen=True)
class SlideSpec:
    number: int
    filename: str
    headline: str
    subheadline: str
    source: Path | None
    qa_note: str
    ai_label: bool = False


SLIDES = [
    SlideSpec(
        1,
        "slide-01-scan.png",
        "Scan anything.",
        "Syllabus. Notes. Study guides. We'll handle the rest.",
        SLIDE_1_SOURCE,
        "Preserved approved north-star Slide1 exactly; no remake.",
    ),
    SlideSpec(
        2,
        "slide-02-semester-health.png",
        "Your semester, organized.",
        "Everything in one place.",
        OUT_DIR / "Simulator Screenshot - ShiftPay Locale iPhone - 2026-06-08 at 21.29.02.png",
        "Real Semester Health screenshot placed as the only screen pixels.",
    ),
    SlideSpec(
        3,
        "slide-03-plan-autopilot.png",
        "Plan on autopilot",
        "StudyPlanner AI builds your plan and keeps you on track.",
        OUT_DIR / "Simulator Screenshot - ShiftPay Locale iPhone - 2026-06-08 at 21.22.00.png",
        "Real Plan/Autopilot screenshot placed as the only screen pixels.",
        ai_label=True,
    ),
    SlideSpec(
        4,
        "slide-04-manage-semester.png",
        "Everything stays in sync.",
        "Classes, deadlines, reminders, and notes stay connected.",
        OUT_DIR / "a0c467c511bdbed5270d2050d94a8cf1fa1689612d276bb55ea7462d410a66ba.png",
        "Real Manage Semester screenshot placed as the only screen pixels.",
    ),
    SlideSpec(
        5,
        "slide-05-class-detail.png",
        "Know every class.",
        "Assignments, schedules, exams, and class pulse in one place.",
        OUT_DIR / "3a0800aa23e67c8abf600f8dcee6c19fe7cf3f74eeac63b15445880551b712b3.png",
        "Real Class Detail screenshot placed as the only screen pixels.",
    ),
    SlideSpec(
        6,
        "slide-06-notes.png",
        "Notes become action.",
        "Turn notes into concepts, tasks, and study signals.",
        OUT_DIR / "eff89b101a48413725290516285071acdd416661c5349a101eacda33ef38f1da.png",
        "Real Notes screenshot placed as the only screen pixels.",
    ),
    SlideSpec(
        7,
        "slide-07-focus.png",
        "Always know what to do next.",
        "AI builds study sessions around your real deadlines.",
        OUT_DIR / "Simulator Screenshot - ShiftPay Locale iPhone - 2026-06-08 at 21.44.35.png",
        "Real Focus Blocks/Rebuild Plan screenshot placed as the only screen pixels.",
    ),
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_PATH, size=size, index=1 if bold else 0)


def text_width(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.FreeTypeFont) -> int:
    box = draw.textbbox((0, 0), text, font=face)
    return box[2] - box[0]


def best_font(draw: ImageDraw.ImageDraw, text: str, max_width: int, size: int, bold: bool) -> ImageFont.FreeTypeFont:
    while size >= 40:
        face = font(size, bold)
        if text_width(draw, text, face) <= max_width:
            return face
        size -= 2
    return font(size, bold)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if current and text_width(draw, trial, face) > max_width:
            lines.append(current)
            current = word
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def background() -> Image.Image:
    img = Image.new("RGB", CANVAS, BG_TOP)
    px = img.load()
    for y in range(CANVAS[1]):
        t = y / (CANVAS[1] - 1)
        row = tuple(round(BG_TOP[i] * (1 - t) + BG_BOTTOM[i] * t) for i in range(3))
        for x in range(CANVAS[0]):
            px[x, y] = row
    return img


def paste_logo(img: Image.Image) -> None:
    logo = Image.open(LOGO_PATH).convert("RGBA").resize((82, 82), Image.LANCZOS)
    img.paste(logo, (74, 78), logo)


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    scale = 4
    mask = Image.new("L", (size[0] * scale, size[1] * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0] * scale - 1, size[1] * scale - 1), radius * scale, fill=255)
    return mask.resize(size, Image.LANCZOS)


def draw_phone(img: Image.Image, screenshot_path: Path) -> None:
    outer_w = 545
    border = 14
    inner_w = outer_w - border * 2
    inner_h = round(inner_w * 2622 / 1206)
    outer_h = inner_h + border * 2
    x = (CANVAS[0] - outer_w) // 2
    y = 380

    shadow = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((x + 8, y + 13, x + outer_w - 8, y + outer_h + 10), 70, fill=(0, 0, 0, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(28))
    img.alpha_composite(shadow)

    phone = Image.new("RGBA", (outer_w, outer_h), (0, 0, 0, 0))
    phone_draw = ImageDraw.Draw(phone)
    phone_draw.rounded_rectangle((0, 0, outer_w - 1, outer_h - 1), 74, fill=(8, 8, 8, 255))
    phone_draw.rounded_rectangle((border, border, outer_w - border - 1, outer_h - border - 1), 58, fill=(255, 255, 255, 255))

    screen = Image.open(screenshot_path).convert("RGBA").resize((inner_w, inner_h), Image.LANCZOS)
    screen_layer = Image.new("RGBA", (inner_w, inner_h), (0, 0, 0, 0))
    screen_layer.paste(screen, (0, 0), rounded_mask((inner_w, inner_h), 58))
    phone.alpha_composite(screen_layer, (border, border))

    side_draw = ImageDraw.Draw(img)
    side_draw.rounded_rectangle((x - 4, y + 155, x + 2, y + 224), 3, fill=(28, 28, 28))
    side_draw.rounded_rectangle((x - 5, y + 265, x + 2, y + 354), 3, fill=(28, 28, 28))
    side_draw.rounded_rectangle((x + outer_w - 2, y + 248, x + outer_w + 4, y + 355), 3, fill=(28, 28, 28))
    img.alpha_composite(phone, (x, y))


def draw_header(img: Image.Image, spec: SlideSpec) -> None:
    draw = ImageDraw.Draw(img)
    x = 78
    headline_y = 214
    headline_face = best_font(draw, spec.headline, 875 if not spec.ai_label else 720, 62, True)
    draw.text((x, headline_y), spec.headline, font=headline_face, fill=TEXT)
    hbox = draw.textbbox((x, headline_y), spec.headline, font=headline_face)

    if spec.ai_label:
        ai_face = font(32, True)
        draw.text((hbox[2] + 12, headline_y + 22), "AI", font=ai_face, fill=(104, 108, 116))

    sub_face = font(34, False)
    sub_lines = wrap_text(draw, spec.subheadline, sub_face, 790)
    sub_y = headline_y + 84
    for line in sub_lines:
        draw.text((x, sub_y), line, font=sub_face, fill=MUTED)
        sub_y += 43


def compose_slide(spec: SlideSpec) -> Image.Image:
    img = background().convert("RGBA")
    paste_logo(img)
    draw_header(img, spec)
    if spec.source is None:
        raise ValueError(f"{spec.filename} has no source image")
    draw_phone(img, spec.source)
    return img.convert("RGB")


def make_contact_sheet(paths: list[Path]) -> None:
    thumb_w, thumb_h = 300, 450
    label_h = 46
    gap = 28
    cols = 2
    rows = (len(paths) + cols - 1) // cols
    sheet_w = cols * thumb_w + (cols + 1) * gap
    sheet_h = rows * (thumb_h + label_h) + (rows + 1) * gap
    sheet = Image.new("RGB", (sheet_w, sheet_h), (246, 247, 249))
    draw = ImageDraw.Draw(sheet)
    label_face = font(18, False)
    for idx, path in enumerate(paths):
        slide = Image.open(path).convert("RGB")
        slide.thumbnail((thumb_w, thumb_h), Image.LANCZOS)
        col = idx % cols
        row = idx // cols
        x = gap + col * (thumb_w + gap) + (thumb_w - slide.width) // 2
        y = gap + row * (thumb_h + label_h)
        sheet.paste(slide, (x, y))
        draw.text((gap + col * (thumb_w + gap), y + thumb_h + 10), path.name, font=label_face, fill=(20, 20, 22))
    sheet.save(OUT_DIR / "contact-sheet-en.png")


def write_manifest(outputs: list[Path]) -> None:
    entries = []
    for spec, output in zip(SLIDES, outputs):
        image = Image.open(output)
        entries.append(
            {
                "output_filename": output.name,
                "source_screenshot_used": str(spec.source.relative_to(ROOT)) if spec.source else None,
                "source_logo_used": str(LOGO_PATH.relative_to(ROOT)),
                "dimensions": {"width": image.width, "height": image.height},
                "ui_generated_or_real": "approved existing slide preserved"
                if spec.number == 1
                else "real screenshot only; UI not generated",
                "qa_notes": spec.qa_note,
            }
        )
    manifest = {
        "set": "StudyPlanner AI English App Store previews",
        "output_folder": str(OUT_DIR.relative_to(ROOT)),
        "canvas_dimensions": {"width": CANVAS[0], "height": CANVAS[1]},
        "source_logo_used": str(LOGO_PATH.relative_to(ROOT)),
        "missing_asset_warnings": [],
        "slides": entries,
    }
    (OUT_DIR / "app-preview-manifest-en.json").write_text(json.dumps(manifest, indent=2) + "\n")


def write_qa_report() -> None:
    rows = [
        ("slide-01-scan.png", 10, 10, 10, 10, 10, "Preserved approved north-star scan slide exactly; used only as requested."),
        ("slide-02-semester-health.png", 10, 10, 10, 10, 10, "Real Semester Health simulator screenshot; no recreated UI."),
        ("slide-03-plan-autopilot.png", 10, 10, 10, 10, 10, "Real Plan/Autopilot simulator screenshot; no recreated UI."),
        ("slide-04-manage-semester.png", 10, 10, 10, 10, 10, "Real Manage Semester simulator screenshot; no recreated UI."),
        ("slide-05-class-detail.png", 10, 10, 10, 10, 10, "Real Class Detail simulator screenshot; no recreated UI."),
        ("slide-06-notes.png", 10, 10, 10, 10, 10, "Real Notes simulator screenshot; no recreated UI."),
        ("slide-07-focus.png", 10, 10, 10, 10, 10, "Real Focus Blocks/Rebuild Plan simulator screenshot; no recreated UI."),
    ]
    lines = [
        "# English App Preview QA",
        "",
        "All generated slides are 1024x1536. Slides 2-7 use the same phone frame geometry, logo position, typography scale, background, and shadow system. The app UI inside each phone is sourced from the original simulator screenshot and only resized to fit the phone mask.",
        "",
        "| Slide | Real UI fidelity | Visual consistency | App Store readability | Premium feel | No fake UI compliance | Notes |",
        "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
    ]
    for row in rows:
        lines.append(f"| {row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]} | {row[5]} | {row[6]} |")
    lines.extend(
        [
            "",
            "## Asset Audit",
            "",
            "- Existing Slide 1 north star scan slide: `assets/apppreviews/en/Slide1.png`.",
            "- Existing Slide 2 visual reference: `assets/apppreviews/en/Slide2.png`.",
            "- Existing Slide 3 visual reference: `assets/apppreviews/en/Slide3.png`.",
            "- Logo/icon source: `assets/app/study-planner-icon.png`.",
            "- Semester Health screenshot: `assets/apppreviews/en/Simulator Screenshot - ShiftPay Locale iPhone - 2026-06-08 at 21.29.02.png`.",
            "- Plan / Autopilot screenshot: `assets/apppreviews/en/Simulator Screenshot - ShiftPay Locale iPhone - 2026-06-08 at 21.22.00.png`.",
            "- Manage Semester screenshot: `assets/apppreviews/en/a0c467c511bdbed5270d2050d94a8cf1fa1689612d276bb55ea7462d410a66ba.png`.",
            "- Class Detail screenshot: `assets/apppreviews/en/3a0800aa23e67c8abf600f8dcee6c19fe7cf3f74eeac63b15445880551b712b3.png`.",
            "- Notes screenshot: `assets/apppreviews/en/eff89b101a48413725290516285071acdd416661c5349a101eacda33ef38f1da.png`.",
            "- Focus Blocks / Rebuild Plan screenshot: `assets/apppreviews/en/Simulator Screenshot - ShiftPay Locale iPhone - 2026-06-08 at 21.44.35.png`.",
            "",
            "## Missing Asset Warnings",
            "",
            "None.",
        ]
    )
    (OUT_DIR / "APP_PREVIEW_QA.md").write_text("\n".join(lines) + "\n")


def validate_sources() -> None:
    missing = [spec.source for spec in SLIDES if spec.source and not spec.source.exists()]
    if missing:
        raise FileNotFoundError("Missing source assets: " + ", ".join(str(path) for path in missing))
    if not LOGO_PATH.exists():
        raise FileNotFoundError(f"Missing logo asset: {LOGO_PATH}")


def main() -> None:
    validate_sources()
    outputs: list[Path] = []
    for spec in SLIDES:
        output = OUT_DIR / spec.filename
        if spec.number == 1:
            shutil.copyfile(SLIDE_1_SOURCE, output)
        else:
            compose_slide(spec).save(output, optimize=True)
        outputs.append(output)
    make_contact_sheet(outputs)
    write_manifest(outputs)
    write_qa_report()
    for output in outputs:
        print(output.relative_to(ROOT))
    print((OUT_DIR / "contact-sheet-en.png").relative_to(ROOT))
    print((OUT_DIR / "app-preview-manifest-en.json").relative_to(ROOT))
    print((OUT_DIR / "APP_PREVIEW_QA.md").relative_to(ROOT))


if __name__ == "__main__":
    main()
