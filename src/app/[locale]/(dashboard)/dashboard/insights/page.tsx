import { getTranslations, setRequestLocale } from "next-intl/server";
import { Info } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { loadInsights, type Observation } from "@/lib/insights";
import { InsightsCharts } from "@/components/dashboard/insights-charts";
import { ui } from "@/components/ui/styles";

const RANGES = [7, 30, 90] as const;

export default async function InsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { locale } = await params;
  const { days: rawDays } = await searchParams;
  setRequestLocale(locale);
  const user = await requirePageUser(locale);
  const t = await getTranslations("insights");
  const tm = await getTranslations("mood.options");
  const tmi = await getTranslations("migraine.triggers");

  const days = RANGES.find((r) => String(r) === rawDays) ?? 30;
  const insights = await loadInsights(user.id, days);

  const describe = (o: Observation) => {
    switch (o.key) {
      case "topTrigger":
        return t("obs.topTrigger", { trigger: tmi(o.trigger.toLowerCase()), count: o.count, total: o.total });
      case "lowSleepMigraine":
        return t("obs.lowSleepMigraine", { share: o.lowSleepShare, overall: o.overallLowSleepShare });
      case "steadyMood":
        return t("obs.steadyMood", { mood: tm(o.mood.toLowerCase()), count: o.count });
    }
  };

  const stats = [
    { label: t("stats.checkIns"), value: insights.mood.total },
    { label: t("stats.migraines"), value: insights.migraine.count },
    { label: t("stats.avgDuration"), value: insights.migraine.avgDurationHours ?? "—" },
    { label: t("stats.avgSleep"), value: insights.sleep.avgHours ?? "—" },
  ];

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className={ui.h1}>{t("title")}</h1>
          <p className="text-ink-soft">{t("subtitle")}</p>
        </div>
        <nav aria-label={t("rangeLabel")} className="inline-flex rounded-full border border-line bg-surface p-1">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={{ pathname: "/dashboard/insights", query: { days: r } }}
              aria-current={r === days ? "page" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${r === days ? "bg-leaf text-on-leaf" : "text-ink-soft hover:bg-surface-2"}`}
            >
              {t("range", { days: r })}
            </Link>
          ))}
        </nav>
      </header>

      <p className="flex items-start gap-3 rounded-2xl bg-stream-soft px-4 py-3 text-sm text-ink">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t("disclaimer")}
      </p>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={ui.card}>
            <dt className="text-sm text-ink-soft">{s.label}</dt>
            <dd className="font-display text-3xl tabular-nums text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>

      <section className={`${ui.card} space-y-2`} aria-labelledby="obs-title">
        <h2 id="obs-title" className={ui.h2}>{t("observationsTitle")}</h2>
        {insights.observations.length ? (
          <ul className="list-disc space-y-1.5 ps-5 text-ink">
            {insights.observations.map((o) => <li key={o.key}>{describe(o)}</li>)}
          </ul>
        ) : (
          <p className="text-ink-soft">{t("notEnough")}</p>
        )}
      </section>

      <InsightsCharts insights={insights} />
    </>
  );
}
