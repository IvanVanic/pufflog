"use client";

import { useTaper } from "../providers/TaperProvider";

export function SuggestionBanner() {
  const { suggestionQueue, applySuggestion, dismissSuggestion } = useTaper();
  if (suggestionQueue.length === 0) return null;
  return (
    <div className="rounded-2xl p-3 bg-amber-500/10 border border-amber-500/30 text-amber-200">
      <div className="text-sm font-medium mb-2">
        Your recent pattern shows you’re struggling with this pace. Would you
        like to ease the plan?
      </div>
      <div className="space-y-2">
        {suggestionQueue.map((s) => (
          <div key={s.id} className="rounded-xl bg-black/20 p-3">
            <div className="flex items-center justify-between">
              <div className="font-medium text-foreground">{s.title}</div>
              <div className="text-xs text-foreground/60">{s.details}</div>
            </div>
            {s.previewDailyTargets && (
              <div className="text-xs text-foreground/60 mt-1">
                End target: {s.previewDailyTargets.at(-1)?.toFixed(2)} g/day •
                Weeks: {Math.ceil((s.previewDailyTargets.length || 0) / 7)}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button
                className="px-3 py-1 rounded-lg border-2 border-emerald-600 text-emerald-600 text-xs font-medium hover:bg-emerald-600 hover:text-white transition-colors"
                onClick={() => applySuggestion(s)}
              >
                Apply
              </button>
              <button
                className="px-3 py-1 rounded-lg border border-black/20 text-xs"
                onClick={() => dismissSuggestion(s.id)}
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
