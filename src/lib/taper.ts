import type { LogEntry } from "@/types/log";

// Expanded strategies supported by the engine. "fixed" and "hybrid" remain
// for backward-compat but are treated as linear unless specialized later.
export type TaperStrategy =
  | "linear"
  | "exponential"
  | "sigmoid"
  | "fixed"
  | "hybrid";

export type PlanAdjustment = {
  dateISO: string;
  reason: string;
  previousWeeklyPct?: number;
  previousLengthWeeks?: number;
  newWeeklyPct?: number;
  newLengthWeeks?: number;
};

export type ActivePlan = {
  baseline_g: number;
  strategy: TaperStrategy;
  // legacy control (kept for backward compatibility when hydrating old plans)
  weekly_pct?: number;
  length_weeks: number;
  sessionsPerDay?: number;
  startDateISO: string;
  dailyTargets_g: number[]; // explicit per-day allowances for entire plan length
  status: "active" | "paused" | "completed";
  adjustments: PlanAdjustment[];
  // new goal-based engine field to make intent explicit
  goal_g?: number;
};

export type DerivedTaperState = {
  todayTarget_g: number | null;
  todayTotal_g: number;
  remainingToday_g: number | null;
  adherencePct7: number | null;
  misses7: number | null;
  streakDays: number;
};

export type Suggestion = {
  id: string;
  title: string;
  details: string;
  newWeeklyPct?: number;
  newLengthWeeks?: number;
  previewDailyTargets?: number[];
};

export type BaselineResult = {
  baseline_g: number;
  daysUsed: number;
  lowConfidence: boolean;
};

export type DailyTotal = { date: string; grams: number };

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function aggregateDailyTotals(
  entries: LogEntry[],
  days = 30
): DailyTotal[] {
  const map = new Map<string, number>();
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    map.set(toDateKey(d), 0);
  }
  for (const e of entries) {
    const k = toDateKey(new Date(e.date));
    if (map.has(k)) map.set(k, (map.get(k) || 0) + e.grams);
  }
  return Array.from(map.entries()).map(([date, grams]) => ({ date, grams }));
}

export function computeBaseline(daily: DailyTotal[]): BaselineResult {
  const withUse = daily.filter((d) => d.grams > 0);
  const recent14 = withUse.slice(-14);
  const used = recent14.length > 0 ? recent14 : withUse;
  const sum = used.reduce((s, d) => s + d.grams, 0);
  const baseline_g = used.length
    ? parseFloat((sum / used.length).toFixed(2))
    : 0;
  // Consider low confidence if we have less than 7 days of data, not 14
  const lowConfidence = used.length < 7;
  return { baseline_g, daysUsed: used.length, lowConfidence };
}

export function rollingMean(values: number[], window = 7): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const avg = slice.reduce((s, v) => s + v, 0) / slice.length;
    out.push(parseFloat(avg.toFixed(3)));
  }
  return out;
}

export function ema(values: number[], alpha = 0.2): number[] {
  const out: number[] = [];
  let prev = values[0] ?? 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const e = alpha * v + (1 - alpha) * prev;
    out.push(parseFloat(e.toFixed(3)));
    prev = e;
  }
  return out;
}

export function linearRegressionSlope(values: number[]): number {
  // slope of y over x=0..n-1 in units per day
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  const numerator = n * sumXY - sumX * sumY;
  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;
  const slope = numerator / denominator;
  return parseFloat(slope.toFixed(4));
}

export function trendFlags(values: number[], baseline_g: number) {
  const last7 = values.slice(-7);
  const slope = linearRegressionSlope(last7);
  const rising = slope > 0.1 * baseline_g;
  const strongRising = slope > 0.2 * baseline_g;
  return { slope, rising, strongRising };
}

export function generateLinearPctPlan(
  baseline_g: number,
  weekly_pct: number,
  length_weeks: number
): number[] {
  const daily: number[] = [];
  for (let i = 1; i <= length_weeks; i++) {
    const weekTarget = baseline_g * Math.pow(1 - weekly_pct, i);
    const clamped = weekTarget < 0.005 ? 0 : parseFloat(weekTarget.toFixed(2));
    for (let d = 0; d < 7; d++) daily.push(clamped);
  }
  return daily;
}

/**
 * Generate a plan that starts at baseline and ends at goal using a specified
 * curve across a given number of weeks. Returns per-day targets for the entire
 * plan length.
 */
export function generatePlanFromGoal(
  baseline_g: number,
  goal_g: number,
  length_weeks: number,
  strategy: Exclude<TaperStrategy, "fixed" | "hybrid">
): number[] {
  const weeks = Math.max(1, Math.floor(length_weeks));
  const current = Math.max(0, baseline_g);
  const goal = Math.max(0, Math.min(goal_g, current));

  const weekTargets: number[] = [];
  for (let i = 1; i <= weeks; i++) {
    const t = i / weeks; // 0..1 progress at week resolution
    let w: number;
    switch (strategy) {
      case "exponential":
        // smooth exponential interpolation between current -> goal
        w = current * Math.pow(goal / Math.max(current, 1e-9), t);
        break;
      case "sigmoid": {
        // Centered logistic style easing: slower start and tail
        const s = 1 / (1 + Math.exp(-10 * (t - 0.5)));
        w = current - (current - goal) * s;
        break;
      }
      case "linear":
      default:
        w = current - (current - goal) * t;
        break;
    }
    const clamped = w < 0.005 ? 0 : parseFloat(w.toFixed(2));
    for (let d = 0; d < 7; d++) weekTargets.push(clamped);
  }
  return weekTargets;
}

export function getPlanDayIndex(
  plan: ActivePlan,
  date = new Date()
): number | null {
  const start = new Date(plan.startDateISO);
  const diffMs =
    new Date(date).setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  if (diffMs < 0) return null;
  const idx = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (idx >= plan.dailyTargets_g.length) return null;
  return idx;
}

export function computeAdherence(
  plan: ActivePlan,
  dailyTotals: DailyTotal[]
): { adherencePct7: number; misses7: number } {
  const idxToday = getPlanDayIndex(plan);
  if (idxToday === null) return { adherencePct7: 100, misses7: 0 };
  const startWindow = Math.max(0, idxToday - 6);
  let daysWithTargets = 0;
  let daysMet = 0;
  for (let i = startWindow; i <= idxToday; i++) {
    const date = new Date(plan.startDateISO);
    date.setDate(date.getDate() + i);
    const key = toDateKey(date);
    const total = dailyTotals.find((d) => d.date === key)?.grams ?? 0;
    const target = plan.dailyTargets_g[i] ?? 0;
    if (i <= idxToday && target > 0) {
      daysWithTargets++;
      if (total <= target + 1e-9) daysMet++;
    }
  }
  const adherencePct7 = daysWithTargets
    ? Math.round((daysMet / daysWithTargets) * 100)
    : 100;
  const misses7 = daysWithTargets - daysMet;
  return { adherencePct7, misses7 };
}

export function makeEaseSuggestions(
  plan: ActivePlan,
  baseline_g: number
): Suggestion[] {
  // Prefer goal/length based easing suggestions in the new engine
  const goal = plan.goal_g ?? Math.min(baseline_g * 0.5, baseline_g);
  const extendWeeks = Math.ceil(plan.length_weeks * 1.5);
  const easeGoal = Math.max(goal, (goal + baseline_g) / 2); // ease by raising goal halfway back
  const opt1Targets = generatePlanFromGoal(
    baseline_g,
    easeGoal,
    plan.length_weeks,
    (plan.strategy === "exponential" || plan.strategy === "sigmoid")
      ? plan.strategy
      : "linear"
  );
  const opt2Targets = generatePlanFromGoal(
    baseline_g,
    goal,
    extendWeeks,
    (plan.strategy === "exponential" || plan.strategy === "sigmoid")
      ? plan.strategy
      : "linear"
  );
  return [
    {
      id: "ease-raise-goal",
      title: "Ease pace (raise goal)",
      details: `Temporarily raise the daily goal to ${easeGoal.toFixed(
        2
      )}g/day to reduce pressure.`,
      previewDailyTargets: opt1Targets,
    },
    {
      id: "extend-length",
      title: "Extend plan by 50%",
      details: `Extend length from ${plan.length_weeks} to ${extendWeeks} weeks to lower daily targets.`,
      newLengthWeeks: extendWeeks,
      previewDailyTargets: opt2Targets,
    },
  ];
}

export function computeDerived(
  plan: ActivePlan | null,
  dailyTotals: DailyTotal[]
): DerivedTaperState {
  const todayTotal_g = dailyTotals.at(-1)?.grams ?? 0;
  if (!plan || plan.status !== "active") {
    return {
      todayTarget_g: null,
      todayTotal_g,
      remainingToday_g: null,
      adherencePct7: null,
      misses7: null,
      streakDays: 0,
    };
  }
  const idx = getPlanDayIndex(plan);
  const todayTarget_g = idx !== null ? plan.dailyTargets_g[idx] ?? 0 : null;
  const remainingToday_g =
    todayTarget_g !== null
      ? parseFloat((todayTarget_g - todayTotal_g).toFixed(2))
      : null;
  const { adherencePct7, misses7 } = computeAdherence(plan, dailyTotals);

  // streak: consecutive days meeting target up to today
  let streakDays = 0;
  if (idx !== null) {
    for (let i = idx; i >= 0; i--) {
      const date = new Date(plan.startDateISO);
      date.setDate(date.getDate() + i);
      const key = toDateKey(date);
      const total = dailyTotals.find((d) => d.date === key)?.grams ?? 0;
      const target = plan.dailyTargets_g[i] ?? 0;
      if (total <= target + 1e-9) streakDays++;
      else break;
    }
  }

  return {
    todayTarget_g,
    todayTotal_g,
    remainingToday_g,
    adherencePct7,
    misses7,
    streakDays,
  };
}
