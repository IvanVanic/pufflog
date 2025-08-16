"use client";

import { useState } from "react";
import { useTaper } from "../providers/TaperProvider";
import { TaperModal } from "../components/TaperModal";
import dynamic from "next/dynamic";
const TaperChart = dynamic(
  () => import("../components/TaperChart").then((m) => m.TaperChart),
  { ssr: false }
);

export default function TaperPage() {
  const { activePlan, derived, baseline, pausePlan, resumePlan, cancelPlan } =
    useTaper();
  const [isTaperModalOpen, setIsTaperModalOpen] = useState(false);

  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground overflow-hidden">
      <main className="flex-1 p-4 pt-8 max-w-md w-full mx-auto pb-24 overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="text-2xl font-bold">Taper</div>
          <button
            className="px-6 py-3 rounded-xl bg-black text-emerald-500 border-2 border-emerald-500 text-base font-semibold hover:bg-emerald-500 hover:text-black transition-colors"
            onClick={() => setIsTaperModalOpen(true)}
          >
            {activePlan ? "View plan" : "Start taper"}
          </button>
        </div>

        <div className="rounded-2xl p-4 bg-black/[.04] dark:bg-white/[.04] mb-6">
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <div className="text-xs text-foreground/60">Baseline</div>
              <div className="text-xl font-semibold">
                {baseline.baseline_g.toFixed(2)} g/day
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-foreground/60">Today</div>
              <div className="text-xl font-semibold">
                {derived.todayTotal_g.toFixed(2)}g
                {derived.todayTarget_g !== null && (
                  <span className="text-sm text-foreground/60 ml-2">
                    / {derived.todayTarget_g.toFixed(2)}g
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-foreground/60">
            {typeof derived.adherencePct7 === "number" && (
              <span>7-day adherence: {derived.adherencePct7}%</span>
            )}
            {derived.streakDays > 0 && (
              <span>
                Streak: {derived.streakDays} day
                {derived.streakDays === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        <TaperChart />

        {activePlan && (
          <div className="flex items-center gap-2 mb-6">
            <div className="text-sm text-foreground/60 flex-1">
              {activePlan.length_weeks} weeks • {activePlan.strategy}
              {typeof activePlan.goal_g === "number" && (
                <span className="ml-2">→ {activePlan.goal_g.toFixed(2)}g</span>
              )}
            </div>
            <button
              className="px-3 py-2 rounded-lg border border-black/20 text-sm"
              onClick={() => setIsTaperModalOpen(true)}
            >
              Edit
            </button>
            {activePlan.status === "active" ? (
              <button
                className="px-3 py-2 rounded-lg border border-black/20 text-sm"
                onClick={pausePlan}
              >
                Pause
              </button>
            ) : (
              <button
                className="px-3 py-2 rounded-lg border border-black/20 text-sm"
                onClick={resumePlan}
              >
                Resume
              </button>
            )}
            <button
              className="px-3 py-2 rounded-lg border border-black/20 text-sm text-red-400"
              onClick={cancelPlan}
            >
              End
            </button>
          </div>
        )}

        <TaperModal
          isOpen={isTaperModalOpen}
          onClose={() => setIsTaperModalOpen(false)}
          existingPlan={activePlan ?? undefined}
        />
      </main>
    </div>
  );
}
