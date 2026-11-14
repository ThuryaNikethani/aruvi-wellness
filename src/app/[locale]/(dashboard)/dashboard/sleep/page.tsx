import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/database/prisma";
import { requirePageUser } from "@/lib/auth/session";
import { SleepEnergyForm } from "@/components/dashboard/sleep-energy-form";
import { ui } from "@/components/ui/styles";

export default async function SleepPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requirePageUser(locale);
  const t = await getTranslations("sleep");
  const format = await getFormatter();

  const [sleep, energy] = await Promise.all([
    prisma.sleepEntry.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 14 }),
    prisma.energyEntry.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 14 }),
  ]);
  const energyByDay = new Map(energy.map((e) => [e.date.toISOString().slice(0, 10), e]));
  const days = [...new Set([...sleep, ...energy].map((x) => x.date.toISOString().slice(0, 10)))].sort().reverse().slice(0, 14);
  const sleepByDay = new Map(sleep.map((s) => [s.date.toISOString().slice(0, 10), s]));

  return (
    <>
      <header className="space-y-1">
        <h1 className={ui.h1}>{t("title")}</h1>
        <p className="text-ink-soft">{t("subtitle")}</p>
      </header>

      <SleepEnergyForm />

      <section className={ui.card} aria-labelledby="sleep-history">
        <h2 id="sleep-history" className={`${ui.h2} mb-3`}>{t("history")}</h2>
        {days.length === 0 ? (
          <p className="text-ink-soft">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left">
              <thead>
                <tr className="border-b border-line text-sm text-ink-soft">
                  <th scope="col" className="py-2 pr-3 font-semibold">{t("date")}</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">{t("hours")}</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">{t("quality")}</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">{t("energy")}</th>
                  <th scope="col" className="py-2 font-semibold">{t("fatigue")}</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => {
                  const s = sleepByDay.get(d);
                  const e = energyByDay.get(d);
                  return (
                    <tr key={d} className="border-b border-line/60 text-ink">
                      <td className="py-2 pr-3">{format.dateTime(new Date(`${d}T00:00:00Z`), { dateStyle: "medium", timeZone: "UTC" })}</td>
                      <td className="py-2 pr-3 tabular-nums">{s?.hours ?? "—"}</td>
                      <td className="py-2 pr-3 tabular-nums">{s ? `${s.quality}/5` : "—"}</td>
                      <td className="py-2 pr-3 tabular-nums">{e ? `${e.energy}/5` : "—"}</td>
                      <td className="py-2 tabular-nums">{e?.fatigue ? `${e.fatigue}/5` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
