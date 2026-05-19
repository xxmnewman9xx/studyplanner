import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppTheme, getTheme, ThemeAccent, ThemeMode } from "./theme";
import { loadJson, saveJson } from "./services/storage";

const themeStorageKey = "study-planner-theme-mode-v1";
const accentStorageKey = "study-planner-theme-accent-v1";

type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  accent: ThemeAccent;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: ThemeAccent) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [accent, setAccent] = useState<ThemeAccent>("campus");
  const theme = useMemo(() => getTheme(mode, accent), [accent, mode]);

  useEffect(() => {
    let mounted = true;

    loadJson<ThemeMode>(themeStorageKey).then((storedMode) => {
      if (mounted && (storedMode === "light" || storedMode === "dark")) {
        setMode(storedMode);
      }
    });

    loadJson<ThemeAccent>(accentStorageKey).then((storedAccent) => {
      if (mounted && isThemeAccent(storedAccent)) {
        setAccent(storedAccent);
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
    saveJson(accentStorageKey, accent);
  }, [accent]);

  const value = useMemo(
    () => ({
      mode,
      theme,
      accent,
      setMode,
      setAccent,
      toggleMode: () => setMode((current) => (current === "light" ? "dark" : "light"))
    }),
    [accent, mode, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function isThemeAccent(value: unknown): value is ThemeAccent {
  return value === "campus" || value === "classic" || value === "slate" || value === "mint";
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useAppTheme must be used inside AppThemeProvider");
  }
  return value;
}
