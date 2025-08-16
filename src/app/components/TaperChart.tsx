"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { useTaper } from "../providers/TaperProvider";
import { rollingMean } from "@/lib/taper";

type ChartDatum = { date: string; grams: number; mean7: number };

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function TaperChart() {
  const { dailyTotals, derived, activePlan } = useTaper();

  const data = useMemo<ChartDatum[]>(() => {
    const values = dailyTotals.map((d) => d.grams);
    const means = rollingMean(values, 7);
    return dailyTotals.map((d, i) => ({
      date: d.date,
      grams: parseFloat(d.grams.toFixed(2)),
      mean7: parseFloat((means[i] ?? 0).toFixed(2)),
    }));
  }, [dailyTotals]);

  const todayTarget = derived.todayTarget_g ?? undefined;
  const goalTarget = useMemo(() => {
    if (!activePlan) return undefined;
    if (typeof activePlan.goal_g === "number") return activePlan.goal_g;
    const last = activePlan.dailyTargets_g.at(-1);
    return typeof last === "number" ? last : undefined;
  }, [activePlan]);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.08)"
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
            }}
            labelStyle={{ color: "#e5e7eb" }}
            formatter={(value: any, name: any) => [
              Number(value).toFixed(2) + " g",
              name === "mean7" ? "7-day avg" : name,
            ]}
            labelFormatter={(label) =>
              `Date: ${formatShortDate(label as string)}`
            }
          />
          <Line
            type="monotone"
            dataKey="mean7"
            stroke="#10b981"
            strokeWidth={4}
            dot={false}
          />
          {typeof todayTarget === "number" && (
            <ReferenceLine
              y={todayTarget}
              stroke="#10b981"
              strokeDasharray="4 4"
              label={{
                value: "Today",
                position: "right",
                fill: "#9ca3af",
                fontSize: 12,
              }}
            />
          )}
          {typeof goalTarget === "number" && (
            <ReferenceLine
              y={goalTarget}
              stroke="#10b981"
              strokeOpacity={0.5}
              strokeDasharray="2 6"
              label={{
                value: "Goal",
                position: "right",
                fill: "#9ca3af",
                fontSize: 12,
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
