import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { useColorScheme as useSystemColorScheme } from "react-native";

type ColorScheme = "light" | "dark";

const STORAGE_KEY = "memoriacams_color_scheme";

function getInitialScheme(system: ColorScheme): ColorScheme {
  if (Platform.OS === "web") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch {}
  }
  return system;
}

function applyWebClass(scheme: ColorScheme) {
  if (Platform.OS === "web") {
    document.documentElement.classList.toggle("dark", scheme === "dark");
  }
}

const ThemeContext = createContext<{
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}>({
  colorScheme: "light",
  setColorScheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useSystemColorScheme() ?? "light";
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() =>
    getInitialScheme(system)
  );

  // Sync the DOM class on mount and whenever scheme changes
  useEffect(() => {
    applyWebClass(colorScheme);
  }, [colorScheme]);

  function setColorScheme(scheme: ColorScheme) {
    setColorSchemeState(scheme);
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(STORAGE_KEY, scheme);
      } catch {}
    }
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppColorScheme() {
  return useContext(ThemeContext);
}