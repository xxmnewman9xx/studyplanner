import test from "node:test";
import assert from "node:assert/strict";

import {
  classColorPalette,
  createWidgetStyleSnapshot,
  getTheme,
  themePalettes,
  widgetStylePresets
} from "../src/theme";

type Rgb = [number, number, number];

function rgbFromHex(hex: string): Rgb {
  const value = hex.replace("#", "");

  assert.equal(value.length, 6, `Expected 6-digit hex color, got ${hex}`);

  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255) as Rgb;
}

function relativeLuminance(hex: string) {
  const channels = rgbFromHex(hex).map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
  ) as Rgb;
  const [red, green, blue] = channels;

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function assertContrast(
  foreground: string,
  background: string,
  minimumRatio: number,
  label: string
) {
  const ratio = contrastRatio(foreground, background);

  assert.ok(
    ratio >= minimumRatio,
    `${label} contrast ${ratio.toFixed(2)} is below ${minimumRatio}: ${foreground} on ${background}`
  );
}

test("theme text tokens keep readable contrast on core surfaces", () => {
  for (const palette of themePalettes) {
    for (const mode of ["light", "dark"] as const) {
      const { colors } = getTheme(mode, palette.id);
      const label = `${mode} ${palette.id}`;

      assertContrast(colors.ink, colors.surface, 7, `${label} ink on surface`);
      assertContrast(colors.ink, colors.canvas, 7, `${label} ink on canvas`);
      assertContrast(colors.muted, colors.surface, 4.5, `${label} muted on surface`);
      assertContrast(colors.faint, colors.surface, 4.5, `${label} faint on surface`);
      assertContrast(colors.heroText, colors.heroSurface, 4.5, `${label} hero text on hero surface`);
    }
  }
});

test("theme accent backgrounds stay readable with hero text", () => {
  for (const palette of themePalettes) {
    for (const mode of ["light", "dark"] as const) {
      const { colors } = getTheme(mode, palette.id);
      const label = `${mode} ${palette.id}`;

      assertContrast(colors.heroText, colors.brandPurple, 4.5, `${label} primary action`);
      assertContrast(colors.heroText, colors.brandBlue, 4.5, `${label} secondary action`);
      assertContrast(colors.heroText, colors.brandCoral, 4.5, `${label} warning action`);
      assertContrast(colors.heroText, colors.calendarToday, 4.5, `${label} selected calendar day`);
      assertContrast(colors.heroText, colors.calendarHeavy, 4.5, `${label} heavy calendar day`);
    }
  }
});

test("class color swatches remain readable behind glyphs", () => {
  const heroText = getTheme("light").colors.heroText;

  for (const [index, color] of classColorPalette.entries()) {
    assertContrast(heroText, color, 4.5, `class color ${index + 1}`);
  }
});

test("widget presets keep readable text in small native surfaces", () => {
  for (const preset of widgetStylePresets) {
    assertContrast(preset.text, preset.background, 4.5, `${preset.id} widget text`);
    assertContrast(preset.muted, preset.background, 4.5, `${preset.id} widget muted text`);
    assertContrast(preset.accent, preset.background, 3, `${preset.id} widget accent`);
  }
});

test("widget snapshots keep palette customization readable on every preset", () => {
  for (const palette of themePalettes) {
    for (const preset of widgetStylePresets) {
      const snapshot = createWidgetStyleSnapshot(palette.id, preset.id);
      assertContrast(snapshot.text, snapshot.background, 4.5, `${palette.id}/${preset.id} text`);
      assertContrast(snapshot.muted, snapshot.background, 4.5, `${palette.id}/${preset.id} muted`);
      assertContrast(snapshot.accent, snapshot.background, 3, `${palette.id}/${preset.id} accent`);
      assertContrast(snapshot.secondary, snapshot.background, 3, `${palette.id}/${preset.id} secondary`);
    }
  }
});
