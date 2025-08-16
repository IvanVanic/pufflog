"use client";

import { useEntries } from "../providers/EntriesProvider";
import { LogEntry } from "../../types/log";

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
      {/* Gradient background from 100% black to transparent */}
      <div className="pointer-events-none absolute inset-0 -z-10 h-[72px] bg-gradient-to-b from-black to-transparent opacity-90" />
      <div className="flex items-center justify-between px-4 py-4 w-full">
        {/* Left wordmark */}
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 mask-weed bg-emerald-600"></div>
          <span className="text-3xl font-medium text-foreground">PuffLog</span>
        </div>

        {/* Dev buttons */}
        <div className="flex gap-2">
          <button
            onClick={generateSampleData}
            className="px-2 py-1 text-xs bg-black text-white rounded-md hover:bg-black/80 transition-colors"
            title="Generate sample data"
            aria-label="Generate sample data for testing"
          >
            Sample
          </button>
          <button
            onClick={clearLogs}
            className="px-2 py-1 text-xs bg-black text-white rounded-md hover:bg-black/80 transition-colors"
            title="Clear all logs"
            aria-label="Clear all logged entries"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
