"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { LogEntry } from "@/types/log";
import {
  ActivePlan,
  BaselineResult,
  DerivedTaperState,
  DailyTotal,
  Suggestion,
  aggregateDailyTotals,
  computeBaseline,
  computeDerived,
  generateLinearPctPlan,
  trendFlags,
  makeEaseSuggestions,
  generatePlanFromGoal,
} from "@/lib/taper";
import { useEntries } from "./EntriesProvider";
import { useSettings } from "./SettingsProvider";

type TaperContextValue = {
  activePlan: ActivePlan | null;
  derived: DerivedTaperState;
  dailyTotals: DailyTotal[];
  baseline: BaselineResult;
  suggestionQueue: Suggestion[];
  createPlan: (p: {
    baseline_g: number;
    strategy: "linear" | "exponential" | "sigmoid" | "fixed" | "hybrid";
    weekly_pct?: number; // legacy input supported
    goal_g?: number; // preferred new input
    length_weeks: number;
    sessionsPerDay?: number;
    startDate?: Date;
  }) => void;
  editPlan: (updates: Partial<ActivePlan>) => void;
  pausePlan: () => void;
  resumePlan: () => void;
  cancelPlan: () => void;
  applySuggestion: (s: Suggestion) => void;
  dismissSuggestion: (id: string) => void;
  onLog: (entry: LogEntry) => void;
};

const STORAGE_KEY = "pufflog_taper_v1";

const TaperContext = createContext<TaperContextValue | undefined>(undefined);

export function TaperProvider({ children }: { children: React.ReactNode }) {
  const { entries } = useEntries();
  const { settings } = useSettings();
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [suggestionQueue, setSuggestionQueue] = useState<Suggestion[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as ActivePlan;
        setActivePlan(saved);
      }
    } catch {}
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      if (activePlan)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activePlan));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [activePlan]);

  // Compute usage aggregates
  const dailyTotals = useMemo(
    () => aggregateDailyTotals(entries, 30),
    [entries]
  );
  const baseline = useMemo(() => computeBaseline(dailyTotals), [dailyTotals]);

  // Derived state
  const derived = useMemo(
    () => computeDerived(activePlan, dailyTotals),
    [activePlan, dailyTotals]
  );

  // Suggest easing plan if adherence is poor or trend is rising
  useEffect(() => {
    if (!activePlan || activePlan.status !== "active") return;
    const values = dailyTotals.map((d) => d.grams);
    const { rising, strongRising } = trendFlags(
      values,
      activePlan.baseline_g || baseline.baseline_g
    );
    const badAdherence =
      (derived.adherencePct7 ?? 100) < 70 || (derived.misses7 ?? 0) >= 3;
    if (badAdherence || rising) {
      const suggestions = makeEaseSuggestions(
        activePlan,
        activePlan.baseline_g || baseline.baseline_g
      );
      // If strong rising, prefer the conservative suggestion order (halve + extend later)
      const ordered = strongRising ? suggestions : suggestions;
      setSuggestionQueue(ordered);
    } else {
      setSuggestionQueue([]);
    }
  }, [
    activePlan,
    dailyTotals,
    baseline.baseline_g,
    derived.adherencePct7,
    derived.misses7,
  ]);

  const createPlan: TaperContextValue["createPlan"] = useCallback((p) => {
    const startDate = p.startDate ?? new Date();
    let dailyTargets_g: number[] = [];
    // Prefer goal-based generation when goal is provided
    if (p.goal_g !== undefined) {
      const strat = (
        p.strategy === "exponential" || p.strategy === "sigmoid"
          ? p.strategy
          : "linear"
      ) as "linear" | "exponential" | "sigmoid";
      dailyTargets_g = generatePlanFromGoal(
        p.baseline_g,
        p.goal_g,
        p.length_weeks,
        strat
      );
    } else {
      // Legacy weekly percentage based generation
      dailyTargets_g = generateLinearPctPlan(
        p.baseline_g,
        p.weekly_pct ?? 0.2,
        p.length_weeks
      );
    }
    if (settings.roundTaperTargets) {
      const step = 0.05;
      dailyTargets_g = dailyTargets_g.map((v) =>
        parseFloat((Math.round(v / step) * step).toFixed(2))
      );
    }
    const plan: ActivePlan = {
      baseline_g: p.baseline_g,
      strategy: p.strategy,
      weekly_pct: p.weekly_pct ?? 0.2,
      length_weeks: p.length_weeks,
      sessionsPerDay: p.sessionsPerDay,
      startDateISO: startDate.toISOString(),
      dailyTargets_g,
      status: "active",
      adjustments: [],
      goal_g: p.goal_g,
    };
    setActivePlan(plan);
  }, [settings.roundTaperTargets]);

  const editPlan: TaperContextValue["editPlan"] = useCallback((updates) => {
    setActivePlan((prev) => {
      if (!prev) return prev;
      const merged: ActivePlan = { ...prev, ...updates } as ActivePlan;
      if (
        updates.weekly_pct !== undefined ||
        updates.length_weeks !== undefined ||
        updates.baseline_g !== undefined ||
        updates.goal_g !== undefined ||
        updates.strategy !== undefined
      ) {
        // Regenerate targets using the best available info
        if (merged.goal_g !== undefined) {
          const strat =
            merged.strategy === "exponential" || merged.strategy === "sigmoid"
              ? merged.strategy
              : "linear";
          let targets = generatePlanFromGoal(
            merged.baseline_g,
            merged.goal_g,
            merged.length_weeks,
            strat as TaperStrategy
          );
          if (settings.roundTaperTargets) {
            const step = 0.05;
            targets = targets.map((v) =>
              parseFloat((Math.round(v / step) * step).toFixed(2))
            );
          }
          merged.dailyTargets_g = targets;
        } else {
          let targets = generateLinearPctPlan(
            merged.baseline_g,
            merged.weekly_pct ?? prev.weekly_pct ?? 0.2,
            merged.length_weeks
          );
          if (settings.roundTaperTargets) {
            const step = 0.05;
            targets = targets.map((v) =>
              parseFloat((Math.round(v / step) * step).toFixed(2))
            );
          }
          merged.dailyTargets_g = targets;
        }
      }
      return { ...merged };
    });
  }, [settings.roundTaperTargets]);

  const pausePlan = useCallback(() => {
    setActivePlan((p) => (p ? { ...p, status: "paused" } : p));
  }, []);

  const resumePlan = useCallback(() => {
    setActivePlan((p) => (p ? { ...p, status: "active" } : p));
  }, []);

  const cancelPlan = useCallback(() => {
    setActivePlan(null);
  }, []);

  const applySuggestion: TaperContextValue["applySuggestion"] = useCallback(
    (s) => {
      if (!activePlan) return;
      const prev = activePlan;
      setActivePlan((p) => {
        if (!p) return p;
        const newWeekly = s.newWeeklyPct ?? p.weekly_pct ?? 0.2;
        const newWeeks = s.newLengthWeeks ?? p.length_weeks;
        const newTargets = generateLinearPctPlan(
          p.baseline_g,
          newWeekly,
          newWeeks
        );
        return {
          ...p,
          weekly_pct: newWeekly,
          length_weeks: newWeeks,
          dailyTargets_g: newTargets,
          adjustments: [
            ...p.adjustments,
            {
              dateISO: new Date().toISOString(),
              reason: s.title,
              previousWeeklyPct: prev.weekly_pct,
              previousLengthWeeks: prev.length_weeks,
              newWeeklyPct: newWeekly,
              newLengthWeeks: newWeeks,
            },
          ],
        };
      });
      setSuggestionQueue([]);
    },
    [activePlan]
  );

  const dismissSuggestion = useCallback((id: string) => {
    setSuggestionQueue((q) => q.filter((s) => s.id !== id));
  }, []);

  const onLog = useCallback((_entry: LogEntry) => {
    // Nothing to do here beyond derived recompute; the consumer can display relapse UI if needed
  }, []);

  const value: TaperContextValue = {
    activePlan,
    derived,
    dailyTotals,
    baseline,
    suggestionQueue,
    createPlan,
    editPlan,
    pausePlan,
    resumePlan,
    cancelPlan,
    applySuggestion,
    dismissSuggestion,
    onLog,
  };

  return (
    <TaperContext.Provider value={value}>{children}</TaperContext.Provider>
  );
}

export function useTaper() {
  const ctx = useContext(TaperContext);
  if (!ctx) throw new Error("useTaper must be used within TaperProvider");
  return ctx;
}
