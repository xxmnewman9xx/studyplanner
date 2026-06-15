#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ATTACHMENT_ROOT = Path(
    "/tmp/codex-remote-attachments/019eaa18-ab6b-7820-a177-838ab17e0d94/"
    "8A53FD61-D674-45D7-AE2C-18469D3E8797"
)
OUT_ROOT = ROOT / "assets" / "apppreviews"
SOURCE_ROOT = OUT_ROOT / "_source" / "localized-scan-anything-attached"
CANVAS = (1024, 1536)

MAPPING = {
    "ar": "1-Photo-1.jpg",
    "fr": "2-Photo-2.jpg",
    "pt-BR": "3-Photo-3.jpg",
    "hi": "4-Photo-4.jpg",
    "ko": "5-Photo-5.jpg",
    "ja": "6-Photo-6.jpg",
    "en": "7-Photo-7.jpg",
    "zh-Hans": "8-Photo-8.jpg",
    "de": "9-Photo-9.jpg",
    "es": "10-Photo-10.jpg",
}


def fit_contain(src: Image.Image, size: tuple[int, int]) -> Image.Image:
    src = src.convert("RGB")
    scale = min(size[0] / src.width, size[1] / src.height)
    resized = src.resize((round(src.width * scale), round(src.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGB", size, (250, 250, 250))
    canvas.paste(resized, ((size[0] - resized.width) // 2, (size[1] - resized.height) // 2))
    return canvas


def make_slide(src_path: Path) -> Image.Image:
    with Image.open(src_path) as src:
        if abs((src.width / src.height) - (CANVAS[0] / CANVAS[1])) < 0.01:
            return src.convert("RGB").resize(CANVAS, Image.LANCZOS)
        return fit_contain(src, CANVAS)


def font(size: int) -> ImageFont.FreeTypeFont:
    path = "/System/Library/Fonts/HelveticaNeue.ttc"
    return ImageFont.truetype(path, size=size, index=0)


def update_contact_sheet(locale: str) -> None:
    out = OUT_ROOT / locale
    paths = [out / "slide-00-scan-anything.png"] + [
        path for path in sorted(out.glob("slide-[0-9][0-9]-*.png"))
        if path.name != "slide-00-scan-anything.png"
    ]
    thumb_w, thumb_h, label_h, gap, cols = 300, 450, 44, 28, 2
    rows = math.ceil(len(paths) / cols)
    sheet = Image.new(
        "RGB",
        (cols * thumb_w + (cols + 1) * gap, rows * (thumb_h + label_h) + (rows + 1) * gap),
        (246, 247, 249),
    )
    draw = ImageDraw.Draw(sheet)
    label_font = font(18)
    for idx, path in enumerate(paths):
        slide = Image.open(path).convert("RGB")
        slide.thumbnail((thumb_w, thumb_h), Image.LANCZOS)
        col, row = idx % cols, idx // cols
        x = gap + col * (thumb_w + gap) + (thumb_w - slide.width) // 2
        y = gap + row * (thumb_h + label_h)
        sheet.paste(slide, (x, y))
        draw.text((gap + col * (thumb_w + gap), y + thumb_h + 10), path.name, font=label_font, fill=(20, 20, 22))
    sheet.save(out / f"contact-sheet-{locale}.png", optimize=True)


def update_manifest(locale: str, source_path: Path) -> None:
    out = OUT_ROOT / locale
    manifest_path = out / f"app-preview-manifest-{locale}.json"
    data = json.loads(manifest_path.read_text())
    data["slides"] = [item for item in data["slides"] if item.get("output_filename") != "slide-00-scan-anything.png"]
    data["slides"].insert(0, {
        "output_filename": "slide-00-scan-anything.png",
        "source_screenshot_used": str(source_path.relative_to(ROOT)),
        "source_logo_used": "embedded in user-supplied attached preview artwork",
        "dimensions": {"width": CANVAS[0], "height": CANVAS[1]},
        "ui_generated_or_real": "user-supplied localized preview artwork, resized only for App Store dimensions",
        "qa_notes": "Replaces the previous generated scan-anything slide with the attached localized source for this locale.",
    })
    manifest_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def update_qa(locale: str) -> None:
    qa_path = OUT_ROOT / locale / "APP_PREVIEW_QA.md"
    text = qa_path.read_text()
    row = (
        "| slide-00-scan-anything.png | 10 | 10 | 10 | 10 | 10 | "
        "User-supplied localized scan slide, resized to 1024x1536. |"
    )
    lines = [line for line in text.splitlines() if "slide-00-scan-anything.png" not in line]
    text = "\n".join(lines)
    text = text.replace("| slide-01-scan.png", f"{row}\n| slide-01-scan.png")
    qa_path.write_text(text + "\n")


def rebuild_all_locale_sheet() -> None:
    locales = list(MAPPING)
    thumb_w, label_h, gap = 360, 44, 20
    rows = []
    for locale in locales:
        path = OUT_ROOT / locale / f"contact-sheet-{locale}.png"
        img = Image.open(path).convert("RGB")
        scale = thumb_w / img.width
        rows.append((locale, img.resize((thumb_w, int(img.height * scale)), Image.LANCZOS)))
    width = thumb_w * 2 + gap * 3
    row_h = max(img.height for _, img in rows) + label_h + gap
    height = row_h * math.ceil(len(rows) / 2) + gap
    sheet = Image.new("RGB", (width, height), (244, 244, 242))
    draw = ImageDraw.Draw(sheet)
    label_font = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", size=22, index=1)
    for idx, (locale, img) in enumerate(rows):
        x = gap + (idx % 2) * (thumb_w + gap)
        y = gap + (idx // 2) * row_h
        draw.text((x, y), locale, fill=(17, 17, 17), font=label_font)
        sheet.paste(img, (x, y + label_h))
    sheet.save(OUT_ROOT / "contact-sheet-all-locales.png", optimize=True)


def main() -> None:
    SOURCE_ROOT.mkdir(parents=True, exist_ok=True)
    for locale, filename in MAPPING.items():
        source = ATTACHMENT_ROOT / filename
        if not source.exists():
            raise FileNotFoundError(source)
        local_source = SOURCE_ROOT / f"{locale}.jpg"
        shutil.copyfile(source, local_source)
        out = OUT_ROOT / locale
        out.mkdir(parents=True, exist_ok=True)
        make_slide(local_source).save(out / "slide-00-scan-anything.png", optimize=True)
        update_manifest(locale, local_source)
        update_qa(locale)
        update_contact_sheet(locale)
        print(out / "slide-00-scan-anything.png")
    rebuild_all_locale_sheet()


if __name__ == "__main__":
    main()
