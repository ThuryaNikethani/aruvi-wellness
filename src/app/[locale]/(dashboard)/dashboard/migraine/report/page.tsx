import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/database/prisma";
import { requirePageUser } from "@/lib/auth/session";
import { computeInsights } from "@/lib/insights";
import { PrintButton } from "@/components/dashboard/print-button";
import { ui } from "@/components/ui/styles";

/**
 * Printable headache diary. Uses the browser's "Save as PDF", which renders
 * every script (Sinhala, Tamil, Arabic…) correctly — unlike client PDF libraries.
 */
export default async function MigraineReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requirePageUser(locale);
  const t = await getTranslations("migraine");
  const tr = await getTranslations("report");
  const format = await getFormatter();

  const days = 90;
  const since = new Date(Date.now() - days * 86_400_000);
  const episodes = await prisma.migraineEpisode.findMany({
    where: { userId: user.id, startedAt: { gte: since } },
    orderBy: { startedAt: "asc" },
    include: { symptoms: true, triggers: true },
  });
  const summary = computeInsights({ moods: [], episodes, sleep: [], energy: [] }, days).migraine;

  return (
    <article className="space-y-6 print:text-black">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={ui.h1}>{tr("title")}</h1>
          <p className="text-ink-soft">
            {user.preferences?.displayName || user.name || user.email} · {tr("period", { days })} ·{" "}
            {format.dateTime(new Date(), { dateStyle: "long" })}
          </p>
        </div>
        <PrintButton label={tr("print")} />
      </header>

      <p className="rounded-2xl border border-line px-4 py-3 text-sm text-ink">{tr("disclaimer")}</p>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className={ui.card}>
          <p className="text-sm text-ink-soft">{tr("episodes")}</p>
          <p className="font-display text-3xl text-ink">{summary.count}</p>
        </div>
        <div className={ui.card}>
          <p className="text-sm text-ink-soft">{tr("avgDuration")}</p>
          <p className="font-display text-3xl text-ink">{summary.avgDurationHours ?? "—"}</p>
        </div>
        <div className={ui.card}>
          <p className="text-sm text-ink-soft">{tr("avgIntensity")}</p>
          <p className="font-display text-3xl text-ink">{summary.avgIntensity ?? "—"}</p>
        </div>
      </section>

      {summary.triggers.length > 0 && (
        <section>
          <h2 className={`${ui.h2} mb-2`}>{tr("triggers")}</h2>
          <p className="text-ink">
            {summary.triggers.map((x) => `${t(`triggers.${x.category.toLowerCase()}`)} (${x.count})`).join(" · ")}
          </p>
        </section>
      )}

      <section>
        <h2 className={`${ui.h2} mb-2`}>{tr("log")}</h2>
        {episodes.length === 0 ? (
          <p className="text-ink-soft">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b-2 border-line text-ink-soft">
                  <th scope="col" className="py-2 pr-3">{t("start")}</th>
                  <th scope="col" className="py-2 pr-3">{tr("hours")}</th>
                  <th scope="col" className="py-2 pr-3">{t("intensity")}</th>
                  <th scope="col" className="py-2 pr-3">{t("symptomsLabel")}</th>
                  <th scope="col" className="py-2 pr-3">{t("triggersLabel")}</th>
                  <th scope="col" className="py-2">{t("medication")}</th>
                </tr>
              </thead>
              <tbody>
                {episodes.map((e) => (
                  <tr key={e.id} className="border-b border-line align-top text-ink">
                    <td className="py-2 pr-3">{format.dateTime(e.startedAt, { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="py-2 pr-3 tabular-nums">
                      {e.endedAt ? Math.round(((e.endedAt.getTime() - e.startedAt.getTime()) / 3_600_000) * 10) / 10 : "—"}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{e.intensity}/10</td>
                    <td className="py-2 pr-3">{e.symptoms.map((s) => t(`symptoms.${s.symptom}`)).join(", ")}</td>
                    <td className="py-2 pr-3">{e.triggers.map((x) => t(`triggers.${x.category.toLowerCase()}`)).join(", ")}</td>
                    <td className="py-2">{e.medicationNote ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </article>
  );
}
