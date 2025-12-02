"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const defaultContext: ThemeContextType = {
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // Get theme from localStorage or default to dark (Superteam aesthetic)
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const initialTheme = savedTheme || "dark";
    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    // Remove both classes first
    root.classList.remove("dark", "light");
    // Add the correct class
    root.classList.add(newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    // Update state immediately
    setThemeState(newTheme);
    // Apply theme immediately
    applyTheme(newTheme);
    // Save to localStorage
    localStorage.setItem("theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    // Update state immediately
    setThemeState(newTheme);
    // Apply theme immediately without waiting for state update
    applyTheme(newTheme);
    // Save to localStorage
    localStorage.setItem("theme", newTheme);
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

