"use client";

import { useEntries } from "../providers/EntriesProvider";
import { LogEntry } from "../../types/log";
import { ThemeToggle } from "./ThemeToggle";

export function AppBar() {
  const { entries, seedSampleEntries, clearAll } = useEntries();

  const generateSampleData = () => {
    seedSampleEntries();
  };

  const clearLogs = () => {
    clearAll();
  };

  return (
    <div className="sticky top-0 z-40 w-full overflow-hidden">
      {/* Enhanced gradient background with better dark mode support */}
      <div className="pointer-events-none absolute inset-0 -z-10 h-[72px] bg-gradient-to-b from-background/95 via-background/80 to-transparent" />
      <div className="flex items-center justify-between px-4 py-4 w-full">
        {/* Left wordmark with enhanced styling */}
        <div className="flex items-center gap-3 animate-fade-in-up">
          <div className="w-12 h-12 mask-weed bg-emerald-600 rounded-lg shadow-lg transition-transform hover:scale-105"></div>
          <span className="text-3xl font-medium text-foreground tracking-tight">
            PuffLog
          </span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <ThemeToggle />

          {/* Dev buttons with enhanced styling */}
          <div className="flex gap-2">
            <button
              onClick={generateSampleData}
              className="px-3 py-2 text-xs bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              title="Generate sample data"
              aria-label="Generate sample data for testing"
            >
              Sample
            </button>
            <button
              onClick={clearLogs}
              className="px-3 py-2 text-xs bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/80 transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              title="Clear all logs"
              aria-label="Clear all logged entries"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
