import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppTheme, getTheme, ThemeMode } from "./theme";
import { loadJson, saveJson } from "./services/storage";

const themeStorageKey = "study-planner-theme-mode-v1";

type ThemeContextValue = {
  mode: ThemeMode;
  theme: AppTheme;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const theme = useMemo(() => getTheme(mode), [mode]);

  useEffect(() => {
    let mounted = true;

    loadJson<ThemeMode>(themeStorageKey).then((storedMode) => {
      if (mounted && (storedMode === "light" || storedMode === "dark")) {
        setMode(storedMode);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    saveJson(themeStorageKey, mode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      theme,
      setMode,
      toggleMode: () => setMode((current) => (current === "light" ? "dark" : "light"))
    }),
    [mode, theme]
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
