"use client";

import { useMemo, useState } from "react";
import type { LogEntry } from "@/types/log";

type Props = {
  entries: LogEntry[];
};

export function StatsSection({ entries }: Props) {
  const [days, setDays] = useState<number>(7);

  const {
    gramsPerDayAvg,
    spendPerWeek,
    changePercent,
    byHour,
    byHourLast3,
    last3RowLabels,
    timeColLabels,
    byDay,
  } = useMemo(() => computeStats(entries, days), [entries, days]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Stats</h2>
        <RangeSelector value={days} onChange={setDays} />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <StatCard
          title="7-Day Average"
          value={`${gramsPerDayAvg.toFixed(2)}g/day`}
        />
        <StatCard title="Weekly Cost" value={`€${spendPerWeek.toFixed(2)}`} />
        <StatCard
          title="Weekly Change"
          value={`${changePercent.toFixed(1)}%`}
        />
      </div>

      <div className="space-y-3">
        <GraphCard
          title="Usage (g)"
          subtitle="per day"
          kind="bar"
          data={byDay}
        />
        <GraphCard
          title="Spending (€)"
          subtitle="per day"
          kind="bar"
          data={byDay.map((d) => ({ label: d.label, value: d.spend }))}
        />
        <HeatmapCard
          title="Time of day (last 3 days)"
          data={byHourLast3}
          rowLabels={last3RowLabels}
          colLabels={timeColLabels}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl p-4 bg-black/[.04] dark:bg-white/[.04] border border-black/10 dark:border-white/10">
      <div className="text-sm text-foreground/70">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function RangeSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={value === 7 ? "font-medium" : "text-foreground/70"}>
        7d
      </span>
      <input
        type="range"
        min={7}
        max={30}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-28 accent-emerald-600"
      />
      <span className={value === 30 ? "font-medium" : "text-foreground/70"}>
        30d
      </span>
    </div>
  );
}

type SimplePoint = { label: string; value: number; spend?: number };

function GraphCard({
  title,
  subtitle,
  kind,
  data,
}: {
  title: string;
  subtitle?: string;
  kind: "bar" | "line";
  data: SimplePoint[];
}) {
  return (
    <div className="rounded-2xl p-4 bg-black/[.04] dark:bg-white/[.04] border border-black/10 dark:border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm text-foreground/70">{subtitle}</div>
          <div className="text-lg font-medium">{title}</div>
        </div>
      </div>
      <MiniBars data={data} kind={kind} />
    </div>
  );
}

function HeatmapCard({
  title,
  data,
  rowLabels,
  colLabels,
}: {
  title: string;
  data: number[][];
  rowLabels?: string[];
  colLabels?: string[];
}) {
  return (
    <div className="rounded-2xl p-4 bg-black/[.04] dark:bg-white/[.04] border border-black/10 dark:border-white/10">
      <div className="text-lg font-medium mb-2">{title}</div>
      <TimeOfDayHeatmap
        data={data}
        rowLabels={rowLabels}
        colLabels={colLabels}
      />
    </div>
  );
}

function MiniBars({
  data,
  kind,
}: {
  data: SimplePoint[];
  kind: "bar" | "line";
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1">
          <div
            className="rounded-t bg-emerald-600 transition-[height] duration-500 ease-out"
            style={{ height: `${(d.value / max) * 100}%` }}
            title={`${d.label}: ${d.value.toFixed(2)}`}
          />
        </div>
      ))}
    </div>
  );
}

function TimeOfDayHeatmap({
  data,
  rowLabels,
  colLabels,
}: {
  data: number[][];
  rowLabels?: string[];
  colLabels?: string[];
}) {
  const flatMax = Math.max(1, ...data.flat());
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[320px]">
        {colLabels && (
          <div className="grid grid-cols-[64px_repeat(6,_1fr)] text-xs text-foreground/60 px-1 mb-1">
            <div />
            {colLabels.map((c, i) => (
              <div key={i} className="text-center">
                {c}
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-[64px_repeat(6,_1fr)] gap-1">
          {data.map((row, r) => (
            <>
              <div
                key={`label-${r}`}
                className="text-xs text-foreground/60 h-6 flex items-center"
              >
                {rowLabels?.[r] ?? `D${r + 1}`}
              </div>
              {row.map((v, c) => {
                const intensity = v / flatMax;
                const bg = `rgba(16,185,129,${Math.max(0.08, intensity)})`;
                return (
                  <div
                    key={`${r}-${c}`}
                    className="h-6 rounded"
                    style={{ backgroundColor: bg }}
                    title={`${v.toFixed(2)}g`}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

function computeStats(entries: LogEntry[], days: number) {
  const now = new Date();
  const since = new Date(now);
  since.setDate(now.getDate() - (days - 1));

  const dailyMap = new Map<string, { grams: number; spend: number }>();
  const hourly: number[][] = Array.from({ length: 7 }, () => Array(6).fill(0));
  const last3: number[][] = Array.from({ length: 3 }, () => Array(6).fill(0));

  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { grams: 0, spend: 0 });
  }

  entries.forEach((e) => {
    const d = new Date(e.date);
    if (d < since || d > now) return;
    const key = d.toISOString().slice(0, 10);
    const bucket = dailyMap.get(key);
    if (bucket) {
      bucket.grams += e.grams;
      bucket.spend += e.priceEUR ?? 0;
    }
    const weekday = (d.getDay() + 6) % 7; // Mon=0
    const col = Math.floor(d.getHours() / 4); // 6 cols: 0-3,4-7,...
    hourly[weekday][col] += e.grams;
    // last 3 calendar days (0 = two days ago, 2 = today)
    const daysAgo = Math.floor(
      (now.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) /
        (24 * 60 * 60 * 1000)
    );
    if (daysAgo >= 0 && daysAgo <= 2) {
      const row = 2 - daysAgo; // oldest at top
      last3[row][col] += e.grams;
    }
  });

  const byDay: SimplePoint[] = Array.from(dailyMap.entries()).map(([k, v]) => ({
    label: k.slice(5),
    value: v.grams,
    spend: v.spend,
  }));

  const totalGrams = byDay.reduce((s, d) => s + d.value, 0);
  const gramsPerDayAvg = totalGrams / Math.max(1, days);
  const spendPerWeek = byDay.reduce((s, d) => s + (d.spend ?? 0), 0);

  const half = Math.floor(byDay.length / 2);
  const firstHalf = byDay.slice(0, half).reduce((s, d) => s + d.value, 0);
  const secondHalf = byDay.slice(half).reduce((s, d) => s + d.value, 0);
  const changePercent =
    firstHalf === 0 ? 0 : ((secondHalf - firstHalf) / firstHalf) * 100;

  // labels for the 3-day heatmap
  const last3RowLabels = [
    getDayLabel(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2)),
    getDayLabel(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)),
    "Today",
  ];
  const timeColLabels = ["0-4", "4-8", "8-12", "12-16", "16-20", "20-24"];

  return {
    gramsPerDayAvg,
    spendPerWeek,
    changePercent,
    byDay,
    byHour: hourly,
    byHourLast3: last3,
    last3RowLabels,
    timeColLabels,
  };
}

function getDayLabel(d: Date) {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return names[d.getDay()];
}
