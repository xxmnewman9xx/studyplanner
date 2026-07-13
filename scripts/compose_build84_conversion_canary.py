#!/usr/bin/env python3
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


TARGET_SIZE = (1242, 2688)
SOURCE_SIZE = (853, 1844)
JOBS = {
    "scanner": {
        "base": "b84-redesign-en-US-iphone-scanner-a1.png",
        "headline": "Scan. Import. Start ahead.",
        "subhead": "Turn a syllabus or notes into a plan you review.",
        "dark": False,
        "layers": [
            ("L4", [(82, 635), (292, 653), (298, 1354), (84, 1358)]),
            ("L3", [(318, 500), (699, 492), (714, 1498), (318, 1488)]),
        ],
    },
    "calendar": {
        "base": "b84-redesign-en-US-iphone-calendar-a1.png",
        "headline": "Make time for what matters.",
        "subhead": "Turn every due date into a calm study block.",
        "dark": True,
        "layers": [
            ("L5", [(263, 500), (669, 486), (622, 1605), (163, 1550)]),
        ],
    },
    "focus": {
        "base": "b84-redesign-en-US-iphone-focus-a1.png",
        "headline": "Focus without the friction.",
        "subhead": "Know what to do now—and make the time count.",
        "dark": False,
        "layers": [
            ("L6", [(255, 765), (608, 777), (613, 1588), (257, 1585)]),
        ],
    },
    "widgets": {
        "base": "b84-redesign-en-US-iphone-widgets-a1.png",
        "headline": "Your plan. Right on Home.",
        "subhead": "See priorities, deadlines, and progress at a glance.",
        "dark": False,
        "layers": [
            ("L1", [(655, 950), (690, 961), (724, 1572), (655, 1583)]),
            ("L7", [(211, 595), (650, 595), (658, 1584), (209, 1580)]),
        ],
    },
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def solve_linear(matrix, values):
    size = len(values)
    augmented = [list(map(float, matrix[row])) + [float(values[row])] for row in range(size)]
    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(augmented[row][column]))
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        divisor = augmented[column][column]
        if abs(divisor) < 1e-12:
            raise RuntimeError("Perspective transform is singular")
        augmented[column] = [value / divisor for value in augmented[column]]
        for row in range(size):
            if row == column:
                continue
            factor = augmented[row][column]
            augmented[row] = [
                augmented[row][index] - factor * augmented[column][index]
                for index in range(size + 1)
            ]
    return [augmented[row][-1] for row in range(size)]


def perspective_coefficients(destination, source):
    matrix, values = [], []
    for (x, y), (u, v) in zip(destination, source):
        matrix.append([x, y, 1, 0, 0, 0, -x * u, -y * u])
        values.append(u)
        matrix.append([0, 0, 0, x, y, 1, -x * v, -y * v])
        values.append(v)
    return solve_linear(matrix, values)


def scale_quad(quad):
    return [
        (round(x * TARGET_SIZE[0] / SOURCE_SIZE[0]), round(y * TARGET_SIZE[1] / SOURCE_SIZE[1]))
        for x, y in quad
    ]


def warp_ui(source_path: Path, quad):
    with Image.open(source_path) as source:
        source = source.convert("RGB")
        padding = 96
        padded = Image.new("RGB", (source.width + padding * 2, source.height + padding * 2))
        padded.paste(source, (padding, padding))
        padded.paste(source.crop((0, 0, source.width, 1)).resize((source.width, padding)), (padding, 0))
        padded.paste(source.crop((0, source.height - 1, source.width, source.height)).resize((source.width, padding)), (padding, padding + source.height))
        padded.paste(source.crop((0, 0, 1, source.height)).resize((padding, source.height)), (0, padding))
        padded.paste(source.crop((source.width - 1, 0, source.width, source.height)).resize((padding, source.height)), (padding + source.width, padding))
        padded.paste(source.getpixel((0, 0)), (0, 0, padding, padding))
        padded.paste(source.getpixel((source.width - 1, 0)), (padding + source.width, 0, padded.width, padding))
        padded.paste(source.getpixel((0, source.height - 1)), (0, padding + source.height, padding, padded.height))
        padded.paste(source.getpixel((source.width - 1, source.height - 1)), (padding + source.width, padding + source.height, padded.width, padded.height))
        corners = [
            (padding, padding),
            (padding + source.width - 1, padding),
            (padding + source.width - 1, padding + source.height - 1),
            (padding, padding + source.height - 1),
        ]
        coefficients = perspective_coefficients(quad, corners)
        return padded.transform(
            TARGET_SIZE,
            Image.Transform.PERSPECTIVE,
            coefficients,
            resample=Image.Resampling.BICUBIC,
        )


def chroma_mask(base: Image.Image, quad):
    pixels = base.load()
    mask = Image.new("L", TARGET_SIZE, 0)
    mask_pixels = mask.load()
    for y in range(base.height):
        for x in range(base.width):
            red, green, blue = pixels[x, y]
            if green > 75 and green > red * 1.38 and green > blue * 1.06:
                mask_pixels[x, y] = 255
    mask = mask.filter(ImageFilter.MaxFilter(7))
    center_x = sum(point[0] for point in quad) / 4
    center_y = sum(point[1] for point in quad) / 4
    expanded_quad = [
        (round(center_x + (x - center_x) * 1.10), round(center_y + (y - center_y) * 1.01))
        for x, y in quad
    ]
    polygon = Image.new("L", TARGET_SIZE, 0)
    ImageDraw.Draw(polygon).polygon(expanded_quad, fill=255)
    return ImageChops.multiply(mask, polygon)


def wrap_lines(draw, text, font, max_width):
    lines, current = [], ""
    for word in text.split():
        candidate = word if not current else f"{current} {word}"
        if current and draw.textbbox((0, 0), candidate, font=font)[2] > max_width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def draw_copy(canvas, job):
    draw = ImageDraw.Draw(canvas)
    headline_font = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 126, index=1)
    subhead_font = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 49, index=0)
    headline_color = "#FFFFFF" if job["dark"] else "#111114"
    subhead_color = "#D4D4DC" if job["dark"] else "#505058"
    margin, max_width = 88, 1066
    y = 112
    for line in wrap_lines(draw, job["headline"], headline_font, max_width):
        draw.text((margin, y), line, font=headline_font, fill=headline_color)
        y += 136
    y += 20
    for line in wrap_lines(draw, job["subhead"], subhead_font, max_width):
        draw.text((margin, y), line, font=subhead_font, fill=subhead_color)
        y += 64


def compose(job, panel_paths, bases_dir: Path, output_path: Path):
    base_path = bases_dir / job["base"]
    with Image.open(base_path) as source:
        canvas = source.convert("RGB").resize(TARGET_SIZE, Image.Resampling.LANCZOS)
    placed = []
    for panel_id, source_quad in job["layers"]:
        quad = scale_quad(source_quad)
        warped = warp_ui(panel_paths[panel_id], quad)
        mask = chroma_mask(canvas, quad)
        canvas.paste(warped, (0, 0), mask)
        placed.append({"panelId": panel_id, "sourcePath": str(panel_paths[panel_id]), "sourceSha256": sha256(panel_paths[panel_id]), "quad": quad})
    draw_copy(canvas, job)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, format="PNG", optimize=True)
    return {
        "outputPath": str(output_path),
        "outputSha256": sha256(output_path),
        "pixelSignature": hashlib.sha256(canvas.tobytes()).hexdigest(),
        "basePath": str(base_path),
        "baseSha256": sha256(base_path),
        "placedUi": placed,
        "dimensions": {"width": canvas.width, "height": canvas.height},
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--atlas-json", type=Path, required=True)
    parser.add_argument("--bases-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    atlas = json.loads(args.atlas_json.read_text(encoding="utf-8"))
    panel_paths = {panel["id"]: Path(panel["sourcePath"]) for panel in atlas["panels"]}
    records = []
    for index, (name, job) in enumerate(JOBS.items(), start=2):
        output_path = args.output_dir / f"{index:02d}-{name}.png"
        records.append({"slide": index, "name": name, **compose(job, panel_paths, args.bases_dir, output_path)})
        print(output_path)
    manifest = {"schemaVersion": 1, "locale": "en-US", "device": "iphone", "records": records}
    (args.output_dir / "canary-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
