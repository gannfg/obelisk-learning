"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0"
        aria-label="Toggle theme"
        disabled
      >
        <Moon className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  // Get the appropriate icon based on current theme
  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Moon className="h-4 w-4" />;
      case "dark":
        return <Sun className="h-4 w-4" />;
      case "blue":
        return <Palette className="h-4 w-4" />;
      default:
        return <Moon className="h-4 w-4" />;
    }
  };

  // Get the next theme name for aria-label
  const getNextTheme = () => {
    switch (theme) {
      case "light":
        return "dark";
      case "dark":
        return "blue";
      case "blue":
        return "light";
      default:
        return "dark";
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0"
      aria-label={`Switch to ${getNextTheme()} theme`}
      title={`Current: ${theme}. Click to switch to ${getNextTheme()}`}
    >
      {getIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

