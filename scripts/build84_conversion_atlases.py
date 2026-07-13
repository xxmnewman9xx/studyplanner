#!/usr/bin/env python3
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


PANELS = [
    ("L1", "dashboard-light", "verified-existing", "today-light"),
    ("L2", "dashboard-dark", "verified-existing", "today-dark"),
    ("L3", "scanner-ready", "verified-existing", "scanner-ready-dark"),
    ("L4", "review", "verified-existing", "review-light"),
    ("L5", "calendar", "verified-existing", "plan-dark"),
    ("L6", "focus", "verified-existing", "focus-light"),
    ("L7", "widgets", "widgets", "widgets-light"),
]
DEVICES = ("iphone", "ipad")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def font(size: int, bold: bool = False):
    return ImageFont.truetype(
        "/System/Library/Fonts/HelveticaNeue.ttc",
        size=size,
        index=1 if bold else 0,
    )


def build_atlas(raw_root: Path, icon_path: Path, output_root: Path, locale: str, device: str):
    canvas = Image.new("RGB", (2400, 3000), "#F2F2F4")
    draw = ImageDraw.Draw(canvas)
    title_font = font(34, True)
    label_font = font(28, True)
    records = []

    cells = [(column * 800, row * 1000, column * 800 + 800, row * 1000 + 1000)
             for row in range(3) for column in range(3)]

    for cell_index, (panel_id, role, source_group, source_name) in enumerate(PANELS):
        cell = cells[cell_index]
        draw.rectangle(cell, fill="#FAFAFB", outline="#CFCFD4", width=2)
        draw.rectangle((cell[0], cell[1], cell[2], cell[1] + 64), fill="#151517")
        draw.text((cell[0] + 20, cell[1] + 15), f"{panel_id}  {role}", font=label_font, fill="white")
        source_path = raw_root / source_group / device / locale / f"{source_name}.png"
        sidecar_path = source_path.with_suffix(".json")
        if not source_path.exists() or not sidecar_path.exists():
            raise RuntimeError(f"Missing localized Build 84 source: {source_path}")
        sidecar = read_json(sidecar_path)
        actual_hash = sha256(source_path)
        if sidecar.get("screenshotSha256") != actual_hash:
            raise RuntimeError(f"Hash mismatch: {source_path}")
        if sidecar.get("resolvedLocale") != locale or str(sidecar.get("buildNumber")) != "84":
            raise RuntimeError(f"Wrong locale or build: {source_path}")
        with Image.open(source_path) as source:
            rendered = source.convert("RGB")
            rendered.thumbnail((730, 900), Image.Resampling.LANCZOS)
            x = cell[0] + (800 - rendered.width) // 2
            y = cell[1] + 76 + (912 - rendered.height) // 2
            canvas.paste(rendered, (x, y))
        records.append({
            "id": panel_id,
            "role": role,
            "sourcePath": str(source_path),
            "sourceSha256": actual_hash,
            "sourceSize": {"width": sidecar["width"], "height": sidecar["height"]},
            "atlasRect": {"x": x, "y": y, "width": rendered.width, "height": rendered.height},
        })

    brand_cell = cells[7]
    draw.rectangle(brand_cell, fill="#FFFFFF", outline="#CFCFD4", width=2)
    draw.rectangle((brand_cell[0], brand_cell[1], brand_cell[2], brand_cell[1] + 64), fill="#151517")
    draw.text((brand_cell[0] + 20, brand_cell[1] + 15), "B1  locked real icon", font=label_font, fill="white")
    with Image.open(icon_path) as source:
        icon = source.convert("RGB").resize((560, 560), Image.Resampling.LANCZOS)
    icon_x = brand_cell[0] + 120
    icon_y = brand_cell[1] + 220
    canvas.paste(icon, (icon_x, icon_y))
    records.append({
        "id": "B1",
        "role": "real-app-icon",
        "sourcePath": str(icon_path),
        "sourceSha256": sha256(icon_path),
        "atlasRect": {"x": icon_x, "y": icon_y, "width": 560, "height": 560},
    })

    note_cell = cells[8]
    draw.rectangle(note_cell, fill="#FFFFFF", outline="#CFCFD4", width=2)
    draw.rectangle((note_cell[0], note_cell[1], note_cell[2], note_cell[1] + 64), fill="#151517")
    draw.text((note_cell[0] + 20, note_cell[1] + 15), "REFERENCE CONTRACT", font=label_font, fill="white")
    note = "BUILD 84\nLOCKED UI\n\nLOCALE\n" + locale + "\n\nDEVICE\n" + device.upper()
    draw.multiline_text((note_cell[0] + 70, note_cell[1] + 160), note, font=title_font, fill="#151517", spacing=22)

    atlas_path = output_root / locale / f"{device}-conversion-atlas.png"
    atlas_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(atlas_path, format="PNG", optimize=True)
    if atlas_path.stat().st_size >= 20 * 1024 * 1024:
        raise RuntimeError(f"Atlas exceeds 20 MB: {atlas_path}")
    record = {
        "schemaVersion": 1,
        "locale": locale,
        "rtl": locale == "ar-SA",
        "device": device,
        "buildNumber": "84",
        "atlasPath": str(atlas_path),
        "atlasSha256": sha256(atlas_path),
        "atlasBytes": atlas_path.stat().st_size,
        "panels": records,
    }
    write_json(atlas_path.with_suffix(".json"), record)
    return record


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw-root", type=Path, required=True)
    parser.add_argument("--icon", type=Path, required=True)
    parser.add_argument("--copy", type=Path, required=True)
    parser.add_argument("--output-root", type=Path, required=True)
    args = parser.parse_args()

    copy = read_json(args.copy)
    locales = list(copy["localizations"].keys())
    if len(locales) != 17:
        raise RuntimeError(f"Expected 17 locales, found {len(locales)}")
    records = []
    for locale in locales:
        for device in DEVICES:
            records.append(build_atlas(args.raw_root, args.icon, args.output_root, locale, device))
            print(f"{len(records)}/34 {locale}/{device}")
    write_json(args.output_root / "manifest.json", {"schemaVersion": 1, "atlasCount": len(records), "records": records})


if __name__ == "__main__":
    main()
