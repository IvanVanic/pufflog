"use client";

import { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      // Default to dark theme
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="relative w-10 h-10 rounded-lg bg-muted flex items-center justify-center transition-colors hover:bg-accent"
        aria-label="Toggle theme"
        disabled
      >
        <div className="w-5 h-5 bg-muted-foreground/50 rounded animate-pulse" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-lg bg-muted flex items-center justify-center transition-all duration-300 hover:bg-accent hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <div className="relative w-5 h-5">
        <SunIcon
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDark
              ? "text-yellow-400 opacity-100 rotate-0 scale-100"
              : "text-muted-foreground opacity-0 -rotate-90 scale-75"
          }`}
        />
        <MoonIcon
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDark
              ? "text-muted-foreground opacity-0 rotate-90 scale-75"
              : "text-blue-400 opacity-100 rotate-0 scale-100"
          }`}
        />
      </div>
    </button>
  );
}
