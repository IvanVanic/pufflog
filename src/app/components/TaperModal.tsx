"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTaper } from "../providers/TaperProvider";
import type { ActivePlan } from "@/lib/taper";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

type Preset = {
  id: string;
  name: string;
  weekly_pct: number;
  length_weeks: number;
};

const PRESETS: Preset[] = [
  { id: "light", name: "Light", weekly_pct: 0.1, length_weeks: 6 },
  { id: "medium", name: "Medium", weekly_pct: 0.2, length_weeks: 4 },
  { id: "aggressive", name: "Aggressive", weekly_pct: 0.35, length_weeks: 3 },
];

export function TaperModal({
  isOpen,
  onClose,
  existingPlan,
}: {
  isOpen: boolean;
  onClose: () => void;
  existingPlan?: ActivePlan;
}) {
  const { baseline, dailyTotals, createPlan, editPlan } = useTaper();
  const [dailyUse, setDailyUse] = useState<string>("0");
  const [goalDailyUse, setGoalDailyUse] = useState<string>("0");
  const [aggression, setAggression] = useState<number>(50);
  const [curveType, setCurveType] = useState<
    "linear" | "exponential" | "sigmoid"
  >("linear");
  const [showDailyUseInfo, setShowDailyUseInfo] = useState(false);
  const [showSpeedInfo, setShowSpeedInfo] = useState(false);
  const [showCurveInfo, setShowCurveInfo] = useState(false);
  const [animWeeks, setAnimWeeks] = useState<
    { week: number; target: number }[]
  >([]);
  const animFrameRef = useRef<number | null>(null);
  const lastWeeksRef = useRef<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (existingPlan) {
        setDailyUse(existingPlan.baseline_g.toFixed(2));
        const g = existingPlan.goal_g ?? existingPlan.baseline_g * 0.1;
        setGoalDailyUse(g.toFixed(2));
        setAggression(50);
        setCurveType(
          existingPlan.strategy === "exponential" ||
            existingPlan.strategy === "sigmoid"
            ? existingPlan.strategy
            : "linear"
        );
      } else {
        // Daily use = average of the last up-to-7 use days within the past 14 days
        const last14 = dailyTotals.slice(-14).filter((d) => d.grams > 0);
        const lastUseDays = last14.slice(-7);
        const avg = lastUseDays.length
          ? lastUseDays.reduce((s, d) => s + d.grams, 0) / lastUseDays.length
          : baseline.baseline_g;
        setDailyUse(avg.toFixed(2));
        setGoalDailyUse((avg * 0.1).toFixed(2));
        setAggression(50);
        setCurveType("linear");
      }
    }
  }, [isOpen, baseline, existingPlan, dailyTotals]);

  const preview = useMemo(() => {
    const current = parseFloat(dailyUse || "0") || 0;
    const goal = parseFloat(goalDailyUse || "0") || 0;
    const aggressionFactor = aggression / 100;

    // Calculate taper duration based on aggression (more aggressive = shorter duration)
    const baseDuration = 12; // weeks
    const duration = Math.max(
      4,
      Math.min(26, baseDuration * (1 - aggressionFactor * 0.6))
    );

    const weeks: { week: number; target: number }[] = [];

    for (let i = 1; i <= Math.ceil(duration); i++) {
      let target: number;

      switch (curveType) {
        case "linear":
          target = current - (current - goal) * (i / duration);
          break;
        case "exponential":
          target = current * Math.pow(goal / current, i / duration);
          break;
        case "sigmoid":
          const progress = i / duration;
          const sigmoid = 1 / (1 + Math.exp(-10 * (progress - 0.5)));
          target = current - (current - goal) * sigmoid;
          break;
        default:
          target = current - (current - goal) * (i / duration);
      }

      weeks.push({
        week: i,
        target: Math.max(
          goal,
          target < 0.005 ? 0 : parseFloat(target.toFixed(2))
        ),
      });
    }

    return {
      weeks,
      end: weeks.at(-1)?.target ?? goal,
      duration: Math.ceil(duration),
      current,
      goal,
      aggression: aggressionFactor,
    };
  }, [dailyUse, goalDailyUse, aggression, curveType]);

  // Smoothly interpolate the preview curve for nicer slider interaction
  useEffect(() => {
    const next = preview.weeks.map((w) => w.target);
    const nextLen = next.length;
    const prev = lastWeeksRef.current.length ? lastWeeksRef.current : next;

    // Resample an array to a target length using linear interpolation
    function resample(values: number[], length: number): number[] {
      if (values.length === length) return values.slice();
      const out: number[] = [];
      for (let i = 0; i < length; i++) {
        const pos = (i * (values.length - 1)) / Math.max(1, length - 1);
        const i0 = Math.floor(pos);
        const i1 = Math.min(values.length - 1, i0 + 1);
        const t = pos - i0;
        const v = values[i0] + (values[i1] - values[i0]) * t;
        out.push(parseFloat(v.toFixed(2)));
      }
      return out;
    }

    const from = resample(prev, nextLen);
    const to = next;
    const durationMs = 220;
    const start = performance.now();
    const ease = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function step(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const tt = ease(t);
      const mix = from.map((v, i) => v + (to[i] - v) * tt);
      setAnimWeeks(
        mix.map((m, i) => ({ week: i + 1, target: parseFloat(m.toFixed(2)) }))
      );
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        lastWeeksRef.current = to;
        animFrameRef.current = null;
      }
    }

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [preview.weeks]);

  function startPlan() {
    const goal = parseFloat(goalDailyUse || "0") || 0;
    if (existingPlan) {
      editPlan({
        baseline_g: preview.current,
        goal_g: goal,
        strategy: curveType,
        weekly_pct: preview.aggression,
        length_weeks: preview.duration,
        sessionsPerDay: 3, // Default
      });
    } else {
      createPlan({
        baseline_g: preview.current,
        goal_g: goal,
        strategy: curveType,
        weekly_pct: preview.aggression,
        length_weeks: preview.duration,
        sessionsPerDay: 3, // Default
      });
    }
    onClose();
  }

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-background" onClick={onClose}>
      <div
        className="h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/10 dark:border-white/10 bg-background/80 backdrop-blur-sm">
          <div className="text-2xl font-semibold">
            {existingPlan ? "Edit taper" : "Start taper"}
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8 max-w-lg mx-auto">
            {/* Daily Use Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="text-base font-medium text-foreground/80">
                  Daily Use
                </div>
                <button
                  onClick={() => setShowDailyUseInfo(true)}
                  className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <InformationCircleIcon className="w-4 h-4 text-foreground/60" />
                </button>
              </div>
              <input
                inputMode="decimal"
                className="w-full rounded-2xl border-2 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-6 py-4 text-lg outline-none focus:border-emerald-500/50 focus:bg-black/10 dark:focus:bg-white/10 transition-all"
                value={dailyUse}
                onChange={(e) => setDailyUse(e.target.value)}
                placeholder="0.00"
              />
              {parseFloat(dailyUse || "0") && baseline.daysUsed < 14 && (
                <div className="text-xs text-amber-500/80 mt-1 flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Low confidence (under 14 days of data)
                </div>
              )}
            </div>

            {/* Goal Daily Use Section */}
            <div className="space-y-3">
              <div className="text-base font-medium text-foreground/80">
                Goal Daily Use
              </div>
              <input
                inputMode="decimal"
                className="w-full rounded-2xl border-2 border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-6 py-4 text-lg outline-none focus:border-emerald-500/50 focus:bg-black/10 dark:focus:bg-white/10 transition-all"
                value={goalDailyUse}
                onChange={(e) => setGoalDailyUse(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Aggression Slider */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="text-base font-medium text-foreground/80">
                  Taper Speed: {aggression}%
                </div>
                <button
                  onClick={() => setShowSpeedInfo(true)}
                  className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <InformationCircleIcon className="w-4 h-4 text-foreground/60" />
                </button>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={aggression}
                  onChange={(e) => setAggression(parseInt(e.target.value))}
                  className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-foreground/60 mt-2">
                  <span>Steady</span>
                  <span>Intense</span>
                </div>
              </div>
            </div>

            {/* Curve Type Selector */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="text-base font-medium text-foreground/80">
                  Taper Curve
                </div>
                <button
                  onClick={() => setShowCurveInfo(true)}
                  className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                >
                  <InformationCircleIcon className="w-4 h-4 text-foreground/60" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setCurveType("linear")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    curveType === "linear"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                      : "border-black/10 dark:border-white/10 text-foreground/60 hover:border-emerald-500/30"
                  }`}
                >
                  <div className="text-sm font-medium">Linear</div>
                </button>
                <button
                  onClick={() => setCurveType("exponential")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    curveType === "exponential"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                      : "border-black/10 dark:border-white/10 text-foreground/60 hover:border-emerald-500/30"
                  }`}
                >
                  <div className="text-sm font-medium">Exponential</div>
                </button>
                <button
                  onClick={() => setCurveType("sigmoid")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    curveType === "sigmoid"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                      : "border-black/10 dark:border-white/10 text-foreground/60 hover:border-emerald-500/30"
                  }`}
                >
                  <div className="text-sm font-medium">Sigmoid</div>
                </button>
              </div>
            </div>

            {/* Projection Graph */}
            <div className="space-y-3">
              <div className="text-base font-medium text-foreground/80">
                Projected Usage
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-foreground/60">
                    {preview.duration} weeks • {preview.end.toFixed(2)}g/day
                    goal
                  </div>
                  <div className="text-sm font-medium text-emerald-500">
                    {preview.current.toFixed(2)}g → {preview.goal.toFixed(2)}g
                  </div>
                </div>

                {/* Graph */}
                <div className="h-44">
                  <svg className="w-full h-full" viewBox="0 0 400 150">
                    <defs>
                      <linearGradient
                        id="taperGradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="#10b981"
                          stopOpacity="0.3"
                        />
                        <stop
                          offset="100%"
                          stopColor="#10b981"
                          stopOpacity="0.1"
                        />
                      </linearGradient>
                    </defs>

                    {/* Subtle grid */}
                    {[0, 50, 100, 150].map((y) => (
                      <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2="400"
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity="0.06"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Taper curve */}
                    <path
                      d={(animWeeks.length ? animWeeks : preview.weeks)
                        .map((week, i) => {
                          const x = (i / (preview.weeks.length - 1)) * 380 + 10;
                          const y =
                            140 -
                            ((week.target - preview.goal) /
                              (preview.current - preview.goal)) *
                              120;
                          return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                        })
                        .join(" ")}
                      stroke="#10b981"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Area under curve */}
                    <path
                      d={`M 10 140 ${(animWeeks.length
                        ? animWeeks
                        : preview.weeks
                      )
                        .map((week, i) => {
                          const x = (i / (preview.weeks.length - 1)) * 380 + 10;
                          const y =
                            140 -
                            ((week.target - preview.goal) /
                              (preview.current - preview.goal)) *
                              120;
                          return `L ${x} ${y}`;
                        })
                        .join(" ")} L 390 140 Z`}
                      fill="url(#taperGradient)"
                    />
                  </svg>
                </div>

                {/* Week breakdown */}
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {(animWeeks.length ? animWeeks : preview.weeks)
                    .slice(0, 8)
                    .map((w) => (
                      <div
                        key={w.week}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-foreground/70">
                          Week {w.week}
                        </span>
                        <span className="font-medium">
                          {w.target.toFixed(2)}g/day
                        </span>
                      </div>
                    ))}
                  {preview.weeks.length > 8 && (
                    <div className="text-xs text-foreground/50 text-center">
                      +{preview.weeks.length - 8} more weeks
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-sm text-foreground/60 text-center p-4 bg-black/5 dark:bg-white/5 rounded-xl">
              This is a suggestion. You can pause or change anytime.
            </div>

            <button
              onClick={startPlan}
              className="w-full rounded-xl border border-emerald-600/60 text-emerald-500 py-4 font-semibold text-base hover:bg-emerald-600 hover:text-black dark:hover:text-white active:scale-[0.99] transition-all"
            >
              {existingPlan ? "Save changes" : "Start Plan"}
            </button>
          </div>
        </div>
      </div>

      {/* Daily Use Info Popup */}
      {showDailyUseInfo && (
        <div
          className="fixed inset-0 z-60"
          onClick={() => setShowDailyUseInfo(false)}
        >
          <div
            className="absolute top-20 left-1/2 transform -translate-x-1/2 w-80 bg-background rounded-xl border border-black/10 dark:border-white/10 shadow-lg p-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Daily Use Calculation</h3>
              <button
                onClick={() => setShowDailyUseInfo(false)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="text-sm text-foreground/80 space-y-2">
              <p>
                Calculated from your recent usage patterns over the past 7-14
                days, weighted by recency for accuracy.
              </p>
              <p>
                You can adjust this value to better reflect your current usage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Taper Speed Info */}
      {showSpeedInfo && (
        <div
          className="fixed inset-0 z-60"
          onClick={() => setShowSpeedInfo(false)}
        >
          <div
            className="absolute top-24 left-1/2 transform -translate-x-1/2 w-80 bg-background rounded-xl border border-black/10 dark:border-white/10 shadow-lg p-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Taper speed</h3>
              <button
                onClick={() => setShowSpeedInfo(false)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="text-sm text-foreground/80 space-y-2">
              <p>
                Controls overall pace. Steady = longer plan; Intense = shorter
                plan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Taper Curve Info */}
      {showCurveInfo && (
        <div
          className="fixed inset-0 z-60"
          onClick={() => setShowCurveInfo(false)}
        >
          <div
            className="absolute top-24 left-1/2 transform -translate-x-1/2 w-80 bg-background rounded-xl border border-black/10 dark:border-white/10 shadow-lg p-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Taper curve</h3>
              <button
                onClick={() => setShowCurveInfo(false)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="text-sm text-foreground/80 space-y-2">
              <p>Linear reduces evenly each week.</p>
              <p>Exponential starts higher and drops faster later.</p>
              <p>Sigmoid eases in and out for a smoother feel.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
