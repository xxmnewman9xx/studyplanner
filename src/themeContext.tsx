import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AppTheme,
  defaultThemePaletteId,
  getTheme,
  isThemePaletteId,
  ThemeMode,
  ThemePalette,
  ThemePaletteId,
  themePalettes
} from "./theme";
import { loadJson, saveJson } from "./services/storage";

const themeStorageKey = "study-planner-theme-mode-v1";
const paletteStorageKey = "study-planner-theme-palette-v1";

type ThemeContextValue = {
  mode: ThemeMode;
  paletteId: ThemePaletteId;
  palettes: ThemePalette[];
  theme: AppTheme;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  setPalette: (paletteId: ThemePaletteId) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [paletteId, setPaletteId] = useState<ThemePaletteId>(defaultThemePaletteId);
  const theme = useMemo(() => getTheme(mode, paletteId), [mode, paletteId]);

  useEffect(() => {
    let mounted = true;

    void Promise.all([
      loadJson<ThemeMode>(themeStorageKey),
      loadJson<ThemePaletteId>(paletteStorageKey)
    ]).then(([storedMode, storedPaletteId]) => {
      if (!mounted) return;

      if (storedMode === "light" || storedMode === "dark") {
        setMode(storedMode);
      }

      if (storedPaletteId && isThemePaletteId(storedPaletteId)) {
        setPaletteId(storedPaletteId);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    saveJson(themeStorageKey, mode);
  }, [mode]);

  useEffect(() => {
    saveJson(paletteStorageKey, paletteId);
  }, [paletteId]);

  const value = useMemo(
    () => ({
      mode,
      paletteId,
      theme,
      palettes: themePalettes,
      setMode,
      setPalette: setPaletteId,
      toggleMode: () => setMode((current) => (current === "light" ? "dark" : "light"))
    }),
    [mode, paletteId, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useAppTheme must be used inside AppThemeProvider");
  }
  return value;
}
