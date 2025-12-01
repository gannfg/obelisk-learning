"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "blue";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const defaultContext: ThemeContextType = {
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // Get theme from localStorage or default to light
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const initialTheme = savedTheme || "light";
    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    // Remove all theme classes first
    root.classList.remove("dark", "blue");
    
    // Add the appropriate theme class
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else if (newTheme === "blue") {
      root.classList.add("blue");
    }
    // light theme doesn't need a class
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    // Cycle through: light -> dark -> blue -> light
    const themeOrder: Theme[] = ["light", "dark", "blue"];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const newTheme = themeOrder[nextIndex];
    setTheme(newTheme);
  };

  // Always provide the context, even before mounting
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

