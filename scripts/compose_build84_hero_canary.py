#!/usr/bin/env python3
import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


CANVAS_SIZE = (852, 1847)
FINAL_SIZE = (1242, 2688)
LEFT_QUAD = [(92, 501), (454, 502), (454, 1378), (91, 1372)]
RIGHT_QUAD = [(463, 578), (774, 584), (713, 1460), (378, 1417)]


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
    matrix = []
    values = []
    for (x, y), (u, v) in zip(destination, source):
        matrix.append([x, y, 1, 0, 0, 0, -x * u, -y * u])
        values.append(u)
        matrix.append([0, 0, 0, x, y, 1, -x * v, -y * v])
        values.append(v)
    return solve_linear(matrix, values)


def warp_ui(source_path: Path, quad):
    with Image.open(source_path) as source:
        source = source.convert("RGB")
        source_corners = [(0, 0), (source.width - 1, 0), (source.width - 1, source.height - 1), (0, source.height - 1)]
        coefficients = perspective_coefficients(quad, source_corners)
        return source.transform(
            CANVAS_SIZE,
            Image.Transform.PERSPECTIVE,
            coefficients,
            resample=Image.Resampling.BICUBIC,
        )


def chroma_mask(base, quad):
    pixels = base.load()
    mask = Image.new("L", CANVAS_SIZE, 0)
    mask_pixels = mask.load()
    for y in range(base.height):
        for x in range(base.width):
            red, green, blue = pixels[x, y]
            if green > 80 and green > red * 1.45 and green > blue * 1.08:
                mask_pixels[x, y] = 255
    mask = mask.filter(ImageFilter.MaxFilter(7))
    polygon = Image.new("L", CANVAS_SIZE, 0)
    ImageDraw.Draw(polygon).polygon(quad, fill=255)
    return ImageChops.multiply(mask, polygon)


def rounded_icon(icon_path: Path, size=74):
    with Image.open(icon_path) as source:
        icon = source.convert("RGB").resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=17, fill=255)
    return icon, mask


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", type=Path, required=True)
    parser.add_argument("--light-ui", type=Path, required=True)
    parser.add_argument("--dark-ui", type=Path, required=True)
    parser.add_argument("--icon", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    with Image.open(args.base) as source:
        base = source.convert("RGB").resize(CANVAS_SIZE, Image.Resampling.LANCZOS)

    light_ui = warp_ui(args.light_ui, LEFT_QUAD)
    dark_ui = warp_ui(args.dark_ui, RIGHT_QUAD)
    base.paste(light_ui, (0, 0), chroma_mask(base, LEFT_QUAD))
    base.paste(dark_ui, (0, 0), chroma_mask(base, RIGHT_QUAD))

    draw = ImageDraw.Draw(base)
    brand_font = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 31, index=1)
    tagline_font = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 20, index=0)
    headline_font = ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", 73, index=1)
    icon, icon_mask = rounded_icon(args.icon)
    base.paste(icon, (58, 58), icon_mask)
    draw.text((151, 70), "StudyPlanner AI", font=brand_font, fill="#111114")
    draw.text((151, 108), "Your day. Your plan. On track.", font=tagline_font, fill="#5D5D64")
    draw.text((58, 185), "Your day.", font=headline_font, fill="#111114")
    draw.text((58, 262), "Your plan.", font=headline_font, fill="#111114")
    draw.text((58, 339), "On track.", font=headline_font, fill="#188A3B")

    final = base.resize(FINAL_SIZE, Image.Resampling.LANCZOS)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    final.save(args.output, format="PNG", optimize=True)


if __name__ == "__main__":
    main()
