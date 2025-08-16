"use client";

import { useMemo } from "react";
import { useTaper } from "../providers/TaperProvider";

export function TaperCard({
  onStart,
  onView,
}: {
  onStart: () => void;
  onView: () => void;
}) {
  const { activePlan, derived, baseline } = useTaper();

  const thisWeekAvg = useMemo(() => {
    // Placeholder; computed in graphs elsewhere. Keep simple here.
    return null as number | null;
  }, []);

  return (
    <div className="rounded-2xl p-4 bg-black/[.04] dark:bg-white/[.04]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-foreground/60">Baseline</div>
        <div className="text-sm font-medium">
          {baseline.baseline_g.toFixed(2)}g/day
        </div>
      </div>
      {activePlan ? (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-foreground/60">Today</div>
            <div className="text-xl font-semibold">
              {derived.todayTotal_g.toFixed(2)}g
              {derived.todayTarget_g !== null && (
                <span className="text-sm text-foreground/60 ml-2">
                  / {derived.todayTarget_g.toFixed(2)}g
                </span>
              )}
            </div>
            {typeof derived.adherencePct7 === "number" && (
              <div className="text-xs text-foreground/60 mt-1">
                7-day adherence: {derived.adherencePct7}%
              </div>
            )}
          </div>
          <button
            className="px-3 py-2 rounded-lg border-2 border-emerald-600 text-emerald-600 text-sm font-medium hover:bg-emerald-600 hover:text-white transition-colors"
            onClick={onView}
          >
            View taper
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-foreground/60">This week avg</div>
            <div className="text-xl font-semibold">
              {thisWeekAvg?.toFixed(2) ?? "—"}g
            </div>
          </div>
          <button
            className="px-3 py-2 rounded-lg border-2 border-emerald-600 text-emerald-600 text-sm font-medium hover:bg-emerald-600 hover:text-white transition-colors"
            onClick={onStart}
          >
            Start taper
          </button>
        </div>
      )}
    </div>
  );
}
