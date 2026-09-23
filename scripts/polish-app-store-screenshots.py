#!/usr/bin/env python3
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
STORE_CONFIG = ROOT / "store.config.json"
APP_CONFIG = ROOT / "app.json"
SOURCE_ROOT = ROOT / "store/apple/screenshot"
OUTPUT_ROOT = ROOT / "store/apple/screenshot-pop"
PLATE = ROOT / "assets/AppPreviews/gpt-image2/backgrounds/apple-clear-pop-plate.png"


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def resized_plate(size: tuple[int, int]) -> Image.Image:
    width, height = size
    plate = Image.open(PLATE).convert("RGB")
    scale = max(width / plate.width, height / plate.height)
    next_size = (int(plate.width * scale) + 2, int(plate.height * scale) + 2)
    plate = plate.resize(next_size, Image.Resampling.LANCZOS)
    left = max(0, (plate.width - width) // 2)
    top = max(0, (plate.height - height) // 2)
    return plate.crop((left, top, left + width, top + height))


def polish_image(source: Path, out: Path) -> None:
    src = Image.open(source).convert("RGB")
    width, height = src.size
    plate = resized_plate((width, height))
    red, green, blue = src.split()
    min_channel = ImageChops.darker(ImageChops.darker(red, green), blue)
    max_channel = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    saturation = ImageChops.subtract(max_channel, min_channel)

    white_lut = [max(0, min(255, round(((value - 238) / 18) * 255))) for value in range(256)]
    neutral_lut = [max(0, min(255, round(((20 - value) / 20) * 255))) for value in range(256)]
    white_mask = min_channel.point(white_lut)
    neutral_mask = saturation.point(neutral_lut)

    vertical_values = []
    for y in range(height):
        yn = y / max(1, height - 1)
        top_space = 1.0 if yn < 0.34 else max(0.0, 1.0 - ((yn - 0.34) / 0.24))
        bottom_space = max(0.0, (yn - 0.82) / 0.18)
        vertical_values.append(round(255 * (0.055 + 0.19 * top_space + 0.10 * bottom_space)))
    vertical = Image.new("L", (1, height))
    vertical.putdata(vertical_values)
    vertical = vertical.resize((width, height))

    edge_values = []
    for x in range(width):
        xn = x / max(1, width - 1)
        edge_strength = max(0.0, abs(xn - 0.5) * 2 - 0.35) / 0.65
        edge_values.append(round(255 * 0.045 * edge_strength))
    edge = Image.new("L", (width, 1))
    edge.putdata(edge_values)
    edge = edge.resize((width, height))

    strength = ImageChops.add(vertical, edge)
    mask = ImageChops.multiply(ImageChops.multiply(white_mask, neutral_mask), strength)
    polished = Image.composite(plate, src, mask)

    polished = ImageEnhance.Color(polished).enhance(1.02)
    polished = ImageEnhance.Contrast(polished).enhance(1.018)
    polished = ImageEnhance.Sharpness(polished).enhance(1.035)
    out.parent.mkdir(parents=True, exist_ok=True)
    polished.save(out, optimize=True, compress_level=7)


def pop_path(source: str) -> str:
    source_path = Path(source)
    try:
        relative = source_path.relative_to("store/apple/screenshot")
    except ValueError:
        try:
            relative = source_path.relative_to("store/apple/screenshot-pop")
        except ValueError as exc:
            raise ValueError(f"Unexpected screenshot path: {source}") from exc
    return str(Path("store/apple/screenshot-pop") / relative)


def source_file_path(source: str) -> Path:
    path = Path(source)
    try:
        relative = path.relative_to("store/apple/screenshot-pop")
    except ValueError:
        return ROOT / path
    return SOURCE_ROOT / relative


def main() -> None:
    if not PLATE.exists():
        raise SystemExit(f"Missing generated background plate: {PLATE}")

    store_config = load_json(STORE_CONFIG)
    app_config = load_json(APP_CONFIG)
    app_version = app_config["expo"]["version"]
    store_config["apple"]["version"] = app_version

    manifest: dict[str, Any] = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceRoot": str(SOURCE_ROOT.relative_to(ROOT)),
        "outputRoot": str(OUTPUT_ROOT.relative_to(ROOT)),
        "backgroundPlate": str(PLATE.relative_to(ROOT)),
        "appVersion": app_version,
        "screenshots": [],
    }

    info = store_config["apple"]["info"]
    for locale, locale_info in sorted(info.items()):
        screenshots = locale_info.get("screenshots", {})
        iphone = screenshots.get("APP_IPHONE_65")
        real_widgets = SOURCE_ROOT / locale / "APP_IPHONE_65" / "07-real-home-screen-widgets.png"
        if iphone and real_widgets.exists():
            iphone[-1] = str(real_widgets.relative_to(ROOT))

        for device, paths in sorted(screenshots.items()):
            updated_paths: list[str] = []
            for source in paths:
                source_path = source_file_path(source)
                if not source_path.exists():
                    raise SystemExit(f"Missing source screenshot: {source}")
                out_relative = pop_path(source)
                out_path = ROOT / out_relative
                polish_image(source_path, out_path)
                updated_paths.append(out_relative)
                manifest["screenshots"].append(
                    {
                        "locale": locale,
                        "device": device,
                        "source": source,
                        "output": out_relative,
                        "bytes": out_path.stat().st_size,
                    }
                )
            screenshots[device] = updated_paths

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    (OUTPUT_ROOT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    STORE_CONFIG.write_text(
        json.dumps(store_config, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Polished {len(manifest['screenshots'])} screenshots for version {app_version}.")
    print(f"Wrote {OUTPUT_ROOT / 'manifest.json'}")


if __name__ == "__main__":
    main()
