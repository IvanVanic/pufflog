"use client";

import { useMemo, useState, useEffect } from "react";
import { useEntries } from "../providers/EntriesProvider";
import { useSettings } from "../providers/SettingsProvider";
import type { LogEntry } from "@/types/log";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
} from "recharts";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DayPoint = {
  date: string;
  grams: number;
  spend: number;
  sessions: number;
};
type Metric = "grams" | "spend" | "sessions";

export default function StatsPage() {
  const { entries } = useEntries();
  const { settings } = useSettings();
  const [rangeDays, setRangeDays] = useState<number>(14);
  const [metric, setMetric] = useState<Metric>("grams");

  const stats = useMemo(
    () => buildStats(entries, rangeDays),
    [entries, rangeDays]
  );

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: settings.currency,
    }).format(v);

  const changePercent = useMemo(() => {
    const series = stats.byDay.map((d) => d[metric]);
    const half = Math.floor(series.length / 2);
    const first = series.slice(0, half).reduce((s, v) => s + v, 0);
    const second = series.slice(half).reduce((s, v) => s + v, 0);
    return first === 0 ? 0 : ((second - first) / first) * 100;
  }, [stats.byDay, metric]);

  const avgForMetric = useMemo(() => {
    const total = stats.byDay.reduce((s, d) => s + d[metric], 0);
    return total / Math.max(1, rangeDays);
  }, [stats.byDay, metric, rangeDays]);

  const totalForMetric = useMemo(() => {
    return stats.byDay.reduce((s, d) => s + d[metric], 0);
  }, [stats.byDay, metric]);

  return (
    <main className="flex-1 p-4 pt-6 pb-32 max-w-md w-full mx-auto space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-medium mb-4">Stats</h2>
        <div className="flex items-center justify-center gap-2">
          <MetricSelect value={metric} onChange={setMetric} />
          <RangeTabs value={rangeDays} onChange={setRangeDays} />
        </div>
      </div>

      {/* Big chart-centric card with animated visuals and inline KPIs */}
      <Card className="animate-fade-in-up">
        <div className="mb-3 flex items-center justify-between">
          <CardTitle>
            {metric === "grams" && "Usage (g)"}
            {metric === "spend" && "Spending"}
            {metric === "sessions" && "Sessions"}
          </CardTitle>
          <div className="hidden sm:flex gap-2">
            <KpiPill label="Avg/day">
              {metric === "spend"
                ? formatCurrency(avgForMetric)
                : `${avgForMetric.toFixed(2)}${metric === "grams" ? "g" : ""}`}
            </KpiPill>
            <KpiPill label="Total">
              {metric === "spend"
                ? formatCurrency(totalForMetric)
                : `${totalForMetric.toFixed(2)}${
                    metric === "grams" ? "g" : ""
                  }`}
            </KpiPill>
            <KpiPill label="Change">
              {changePercent >= 0 ? "+" : ""}
              {changePercent.toFixed(1)}%
            </KpiPill>
          </div>
        </div>

        <div className="h-72 relative overflow-hidden rounded-lg">
          {stats.byDay.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">No data yet</div>
                <div className="text-sm">Add some entries to see your stats</div>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
              data={stats.byDay}
              margin={{ left: 0, right: 0, top: 15, bottom: 15 }}
            >
              <defs>
                <linearGradient id="gramsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="40%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="40%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
                </linearGradient>
                
                <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="40%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                </linearGradient>

                <filter id="enhancedGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="coloredBlur"/>
                  <feColorMatrix 
                    in="coloredBlur" 
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.6 0"
                  />
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>

                <filter id="subtleShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2"/>
                </filter>
              </defs>

              <CartesianGrid
                stroke="hsl(var(--border))"
                strokeOpacity={0.2}
                vertical={false}
                strokeDasharray="2 6"
              />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                fontSize={10}
                tick={{ 
                  fill: "hsl(var(--muted-foreground))", 
                  fontWeight: 500 
                }}
                interval="preserveStartEnd"
                tickMargin={10}
                height={40}
              />

              {stats.byDay.some(d => d[metric] > 0) && (
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  tick={{ 
                    fill: "hsl(var(--muted-foreground))", 
                    fontWeight: 500 
                  }}
                  width={35}
                  tickMargin={5}
                  domain={['dataMin', 'dataMax']}
                  tickCount={3}
                  tickFormatter={(value) => {
                    if (metric === "spend") return `€${value.toFixed(0)}`;
                    if (metric === "grams") return `${value.toFixed(1)}`;
                    return Math.round(value).toString();
                  }}
                />
              )}

              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  const data = payload[0].payload;
                  const value = data[metric];
                  
                  return (
                    <div className="bg-background/98 backdrop-blur-sm border border-border/60 rounded-xl p-4 shadow-2xl">
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        {label}
                      </div>
                      <div className="text-xl font-bold tracking-tight" style={{ 
                        color: metric === "grams" ? "#10b981" : 
                               metric === "spend" ? "#f59e0b" : "#8b5cf6" 
                      }}>
                        {metric === "spend" 
                          ? new Intl.NumberFormat(undefined, {
                              style: "currency",
                              currency: settings.currency,
                            }).format(value)
                          : metric === "grams"
                          ? `${value.toFixed(2)}g`
                          : `${Math.round(value)} sessions`
                        }
                      </div>
                    </div>
                  );
                }}
                cursor={{ 
                  stroke: "hsl(var(--border))", 
                  strokeWidth: 1, 
                  strokeDasharray: "4 4",
                  strokeOpacity: 0.6 
                }}
                allowEscapeViewBox={{ x: false, y: true }}
              />

              <Area
                type="monotone"
                dataKey={metric}
                stroke={
                  metric === "grams" ? "#10b981" : 
                  metric === "spend" ? "#f59e0b" : "#8b5cf6"
                }
                fill={
                  metric === "grams" ? "url(#gramsGradient)" : 
                  metric === "spend" ? "url(#spendGradient)" : "url(#sessionsGradient)"
                }
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: metric === "grams" ? "#10b981" : 
                          metric === "spend" ? "#f59e0b" : "#8b5cf6",
                  strokeWidth: 2,
                  fill: "hsl(var(--background))",
                  filter: "url(#subtleShadow)"
                }}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
                filter="url(#enhancedGlow)"
              />
              </AreaChart>
            </ResponsiveContainer>
          )}
          
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/3 rounded-lg" />
        </div>

        {/* Mobile KPI pills under chart */}
        <div className="mt-3 flex gap-2 sm:hidden">
          <KpiPill label="Avg/day">
            {metric === "spend"
              ? formatCurrency(avgForMetric)
              : `${avgForMetric.toFixed(2)}${metric === "grams" ? "g" : ""}`}
          </KpiPill>
          <KpiPill label="Total">
            {metric === "spend"
              ? formatCurrency(totalForMetric)
              : `${totalForMetric.toFixed(2)}${metric === "grams" ? "g" : ""}`}
          </KpiPill>
          <KpiPill label="Change">
            {changePercent >= 0 ? "+" : ""}
            {changePercent.toFixed(1)}%
          </KpiPill>
        </div>
      </Card>

      {/* Time of day usage graph */}
      <Card className="animate-fade-in-up">
        <CardTitle>Time of day usage</CardTitle>
        <HeatSummary data={stats.byHour} />
        <TimeOfDayGraph data={stats.byHour} />
        <p className="mt-2 text-xs text-foreground/60">
          Shows usage patterns across time periods and average daily usage
        </p>
      </Card>
    </main>
  );
}

function RangeTabs({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const options = [7, 14, 30, 60, 90];
  return (
    <div className="inline-flex rounded-xl border-2 border-gray-400 p-0.5 h-10">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 text-sm rounded-lg transition-colors flex items-center",
            value === opt
              ? "text-emerald-600 px-4 text-base font-bold"
              : "text-white hover:text-foreground hover:bg-accent/50"
          )}
        >
          {opt}d
        </button>
      ))}
    </div>
  );
}

function MetricSelect({
  value,
  onChange,
}: {
  value: Metric;
  onChange: (m: Metric) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".metric-select")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const opts: { key: Metric; label: string }[] = [
    { key: "grams", label: "Usage(g)" },
    { key: "spend", label: "Spend(€)" },
    { key: "sessions", label: "Frequency" },
  ];

  const currentLabel = opts.find((o) => o.key === value)?.label || "Usage(g)";

  return (
    <div className="relative metric-select">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-36 h-10 text-base justify-between px-3 py-2 rounded-xl border-2 border-gray-400 transition-colors hover:bg-accent/50"
        )}
      >
        <span className="flex-1 text-left">{currentLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-card/90 backdrop-blur rounded-md shadow-lg z-10">
          {opts.map((o) => (
            <button
              key={o.key}
              onClick={() => {
                onChange(o.key);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors",
                value === o.key && "bg-accent"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("rounded-xl p-4 border-2 border-gray-400", className)}
      style={style}
    >
      {children}
    </div>
  );
}

function CardHeader({ label }: { label: string }) {
  return <div className="text-xs text-foreground/60">{label}</div>;
}

function CardValue({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mt-1 text-2xl font-medium", className)}>{children}</div>
  );
}

function KpiPill({
  label,
  tone,
  children,
}: {
  label: string;
  tone?: "pos" | "neg";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "pos" ? "text-emerald-500" : tone === "neg" ? "text-red-400" : "";
  return (
    <div className={cn("rounded-full px-3 py-1 text-sm", toneClass)}>
      <span className="mr-2 text-foreground/60 text-xs">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

function CardTitle({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-2">
      {subtitle && <div className="text-sm text-foreground/60">{subtitle}</div>}
      <div className="text-lg font-medium tracking-tight">{children}</div>
    </div>
  );
}

function ChartTooltip(
  props: { labelSuffix?: string; isCurrency?: boolean; currency?: string } & any
) {
  const { active, payload, label, labelSuffix, isCurrency } = props;
  const currency = props.currency || (isCurrency ? "EUR" : undefined);
  if (!active || !payload || !payload.length) return null;
  const val: number = payload[0].value;
  const formatted = isCurrency
    ? new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
        val
      )
    : `${Number(val).toFixed(2)}${labelSuffix ?? ""}`;
  return (
    <div className="rounded-md border border-border bg-popover/90 p-2 text-xs shadow-sm backdrop-blur">
      <div className="mb-0.5 opacity-70">{label}</div>
      <div className="font-medium">{formatted}</div>
    </div>
  );
}

function HeatSummary({ data }: { data: number[][] }) {
  // Group columns: Morning (0-8), Daytime (8-16), Night (16-24)
  const sums = { morning: 0, daytime: 0, night: 0 };
  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      const v = data[r][c];
      if (c <= 1) sums.morning += v; // 0-4, 4-8
      else if (c <= 3) sums.daytime += v; // 8-12, 12-16
      else sums.night += v; // 16-20, 20-24
    }
  }
  const total = Math.max(1, sums.morning + sums.daytime + sums.night);
  const pct = (x: number) => Math.round((x / total) * 100);
  const maxKey = Object.entries(sums).sort((a, b) => b[1] - a[1])[0][0] as
    | "morning"
    | "daytime"
    | "night";
  const labelMap: Record<string, string> = {
    morning: "mornings",
    daytime: "daytime",
    night: "night",
  };

  // Get the second highest for proper ordering
  const sorted = Object.entries(sums).sort((a, b) => b[1] - a[1]);
  const second = sorted[1][0] as "morning" | "daytime" | "night";
  const third = sorted[2][0] as "morning" | "daytime" | "night";

  return (
    <div className="mb-3 text-sm text-foreground/80">
      Based on your usage metrics, your most active time is{" "}
      <span className="font-medium">{labelMap[maxKey]}</span> (
      <span>{pct(sums[maxKey])}%</span> of total), followed by{" "}
      <span>
        {labelMap[second]} {pct(sums[second])}%
      </span>
      , and{" "}
      <span>
        {labelMap[third]} {pct(sums[third])}%
      </span>
      .
    </div>
  );
}

function TimeOfDayGraph({ data }: { data: number[][] }) {
  // Process data: aggregate by time periods (Morning, Daytime, Night)
  const timePeriodData = useMemo(() => {
    const periods = [
      { name: "Morning", color: "#10b981", range: "0-8h" },
      { name: "Daytime", color: "#34d399", range: "8-16h" },
      { name: "Night", color: "#059669", range: "16-24h" },
    ];

    return periods.map((period, periodIndex) => {
      // Sum all values for this time period across all days
      let totalUsage = 0;
      let dayCount = 0;

      data.forEach((row, dayIndex) => {
        const periodValues =
          periodIndex === 0
            ? row.slice(0, 2) // Morning: 0-4h, 4-8h
            : periodIndex === 1
            ? row.slice(2, 4) // Daytime: 8-12h, 12-16h
            : row.slice(4, 6); // Night: 16-20h, 20-24h

        const dayTotal = periodValues.reduce((sum, val) => sum + val, 0);
        if (dayTotal > 0) {
          totalUsage += dayTotal;
          dayCount++;
        }
      });

      const avgUsage = dayCount > 0 ? totalUsage / dayCount : 0;

      return {
        period: period.name,
        range: period.range,
        totalUsage: parseFloat(totalUsage.toFixed(2)),
        avgUsage: parseFloat(avgUsage.toFixed(2)),
        color: period.color,
        dayCount,
      };
    });
  }, [data]);

  const maxUsage = Math.max(...timePeriodData.map((d) => d.avgUsage), 1);

  return (
    <div className="space-y-4">
      {/* Bar Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={timePeriodData}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <defs>
              <filter
                id="softGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="2"
                  result="blur"
                />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid
              stroke="var(--border)"
              strokeOpacity={0.3}
              vertical={false}
            />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tick={{ fill: "var(--foreground)", opacity: 0.7 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-card/90 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
                      <div className="font-medium text-sm">
                        {data.period} ({data.range})
                      </div>
                      <div className="text-xs text-foreground/70 mt-1">
                        Avg: {data.avgUsage}g/day
                      </div>
                      <div className="text-xs text-foreground/70">
                        Total: {data.totalUsage}g
                      </div>
                      <div className="text-xs text-foreground/70">
                        Active days: {data.dayCount}/7
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="avgUsage"
              radius={[4, 4, 0, 0]}
              filter="url(#softGlow)"
            >
              {timePeriodData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        {timePeriodData.map((period) => (
          <div key={period.period} className="text-center">
            <div className="text-xs text-foreground/60 mb-1">
              {period.period}
            </div>
            <div
              className="text-lg font-medium"
              style={{ color: period.color }}
            >
              {period.avgUsage}g
            </div>
            <div className="text-xs text-foreground/50">{period.range}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildStats(entries: LogEntry[], days: number) {
  const now = new Date();
  const since = new Date(now);
  since.setDate(now.getDate() - (days - 1));

  const dayMap = new Map<
    string,
    { grams: number; spend: number; sessions: number }
  >();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dayMap.set(key, { grams: 0, spend: 0, sessions: 0 });
  }

  const hourly: number[][] = Array.from({ length: 7 }, () => Array(6).fill(0));

  entries.forEach((e) => {
    const dt = new Date(e.date);
    if (dt < since || dt > now) return;
    const key = dt.toISOString().slice(0, 10);
    const bucket = dayMap.get(key);
    if (bucket) {
      bucket.grams += e.grams;
      bucket.spend += e.priceEUR ?? 0;
      bucket.sessions += 1;
    }
    const weekday = (dt.getDay() + 6) % 7; // Mon=0
    const col = Math.floor(dt.getHours() / 4); // 6 columns
    hourly[weekday][col] += e.grams;
  });

  const byDay: DayPoint[] = Array.from(dayMap.entries()).map(([k, v]) => ({
    date: k.slice(5),
    grams: v.grams,
    spend: v.spend,
    sessions: v.sessions,
  }));

  const sumGrams = byDay.reduce((s, d) => s + d.grams, 0);
  const sumSpend = byDay.reduce((s, d) => s + d.spend, 0);
  const avgPerDay = sumGrams / Math.max(1, days);

  return {
    byDay,
    byHour: hourly,
    avgPerDay,
    totalSpend: sumSpend,
  };
}
