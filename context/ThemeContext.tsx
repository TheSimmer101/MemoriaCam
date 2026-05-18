import React, { createContext, useContext, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";

type ColorScheme = "light" | "dark";

const ThemeContext = createContext<{
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}>({
  colorScheme: "light",
  setColorScheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useSystemColorScheme() ?? "light";
  const [colorScheme, setColorScheme] = useState<ColorScheme>(system);

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppColorScheme() {
  return useContext(ThemeContext);
}