"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { Insights } from "@/lib/insights";
import { MOODS } from "@/features/mood/moods";
import { ui } from "@/components/ui/styles";

const axis = { stroke: "var(--ink-soft)", fontSize: 12, tickLine: false, axisLine: false } as const;
const grid = <CartesianGrid stroke="var(--line)" strokeDasharray="0" vertical={false} />;
const tooltipStyle = {
  contentStyle: { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)" },
  labelStyle: { color: "var(--ink)", fontWeight: 600 },
  itemStyle: { color: "var(--ink)" },
  cursor: { fill: "var(--surface-2)", stroke: "var(--line)" },
};

function ChartCard({ title, children, table }: { title: string; children: React.ReactNode; table: React.ReactNode }) {
  const t = useTranslations("insights");
  return (
    <section className={`${ui.card} space-y-3`}>
      <h2 className={ui.h2}>{title}</h2>
      <div className="h-56 w-full" aria-hidden="true">{children}</div>
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold text-ink-soft">{t("showTable")}</summary>
        <div className="mt-2 max-h-64 overflow-auto">{table}</div>
      </details>
    </section>
  );
}

function DataTable({ head, rows }: { head: [string, string]; rows: [string, string | number][] }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-line text-ink-soft">
          <th scope="col" className="py-1.5 pr-4 font-semibold">{head[0]}</th>
          <th scope="col" className="py-1.5 font-semibold">{head[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([a, b]) => (
          <tr key={a} className="border-b border-line/60">
            <td className="py-1.5 pr-4 text-ink">{a}</td>
            <td className="py-1.5 tabular-nums text-ink">{b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function InsightsCharts({ insights }: { insights: Insights }) {
  const t = useTranslations("insights");
  const tm = useTranslations("mood.options");
  const format = useFormatter();
  const short = (d: string) => format.dateTime(new Date(`${d}T00:00:00Z`), { day: "numeric", month: "short", timeZone: "UTC" });

  const moodData = MOODS.map(({ key }) => ({
    name: tm(key),
    count: insights.mood.counts[key.toUpperCase() as keyof typeof insights.mood.counts] ?? 0,
  })).filter((m) => m.count > 0);

  const daily = insights.daily.map((d) => ({ ...d, label: short(d.date) }));
  const sleepRows = daily.filter((d) => d.sleepHours !== null);
  const energyRows = daily.filter((d) => d.energy !== null);
  const migraineRows = daily.filter((d) => d.migraines > 0);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ChartCard
        title={t("moodChart")}
        table={<DataTable head={[t("mood"), t("count")]} rows={moodData.map((m) => [m.name, m.count])} />}
      >
        {moodData.length ? (
          <ResponsiveContainer>
            <BarChart data={moodData} layout="vertical" margin={{ left: 8, right: 16 }} barCategoryGap={6}>
              {grid}
              <XAxis type="number" allowDecimals={false} {...axis} />
              <YAxis type="category" dataKey="name" width={110} {...axis} />
              <Tooltip {...tooltipStyle} formatter={(v) => [v, t("count")]} />
              <Bar dataKey="count" fill="var(--leaf)" radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="pt-16 text-center text-ink-soft">{t("noData")}</p>
        )}
      </ChartCard>

      <ChartCard
        title={t("migraineChart")}
        table={<DataTable head={[t("date"), t("episodes")]} rows={migraineRows.map((d) => [d.label, d.migraines])} />}
      >
        <ResponsiveContainer>
          <BarChart data={daily} margin={{ right: 8 }} barCategoryGap={2}>
            {grid}
            <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} {...axis} />
            <YAxis allowDecimals={false} width={28} {...axis} />
            <Tooltip {...tooltipStyle} formatter={(v) => [v, t("episodes")]} />
            <Bar dataKey="migraines" fill="var(--stream)" radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={t("sleepChart")}
        table={<DataTable head={[t("date"), t("hours")]} rows={sleepRows.map((d) => [d.label, d.sleepHours ?? ""])} />}
      >
        <ResponsiveContainer>
          <LineChart data={daily} margin={{ right: 8 }}>
            {grid}
            <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} {...axis} />
            <YAxis domain={[0, 12]} width={28} {...axis} />
            <Tooltip {...tooltipStyle} cursor={{ stroke: "var(--ink-soft)" }} formatter={(v) => [v, t("hours")]} />
            <Line dataKey="sleepHours" stroke="var(--leaf)" strokeWidth={2} dot={{ r: 4, fill: "var(--leaf)", stroke: "var(--surface)", strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title={t("energyChart")}
        table={<DataTable head={[t("date"), t("energyLevel")]} rows={energyRows.map((d) => [d.label, d.energy ?? ""])} />}
      >
        <ResponsiveContainer>
          <LineChart data={daily} margin={{ right: 8 }}>
            {grid}
            <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} {...axis} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} width={28} {...axis} />
            <Tooltip {...tooltipStyle} cursor={{ stroke: "var(--ink-soft)" }} formatter={(v) => [v, t("energyLevel")]} />
            <Line dataKey="energy" stroke="var(--stream)" strokeWidth={2} dot={{ r: 4, fill: "var(--stream)", stroke: "var(--surface)", strokeWidth: 2 }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
