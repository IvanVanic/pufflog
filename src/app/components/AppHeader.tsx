"use client";

import { useEntries } from "../providers/EntriesProvider";

export function AppHeader() {
  return (
    <div className="px-4 py-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="size-6 bg-emerald-600 mask-weed" aria-hidden />
        <div className="text-xl font-semibold tracking-tight">pufflog</div>
      </div>
      <SampleButton />
    </div>
  );
}

function SampleButton() {
  const { seedSampleEntries } = useEntries();
  return (
    <button
      onClick={seedSampleEntries}
      className="rounded-lg px-3 py-2 bg-black/[.04] dark:bg-white/[.06] hover:bg-black/[.08] dark:hover:bg-white/[.1] text-sm"
      title="Add sample data for testing"
    >
      SAMPLE
    </button>
  );
}
