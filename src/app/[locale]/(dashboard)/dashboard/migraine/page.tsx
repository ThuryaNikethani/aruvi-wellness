import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { FileText, Info } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/database/prisma";
import { requirePageUser } from "@/lib/auth/session";
import { MigraineForm } from "@/components/dashboard/migraine-form";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { ui } from "@/components/ui/styles";

export default async function MigrainePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requirePageUser(locale);
  const t = await getTranslations("migraine");
  const format = await getFormatter();

  const episodes = await prisma.migraineEpisode.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    take: 30,
    include: { symptoms: true, triggers: true },
  });

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className={ui.h1}>{t("title")}</h1>
          <p className="text-ink-soft">{t("subtitle")}</p>
        </div>
        <Link href="/dashboard/migraine/report" className={ui.btnSecondary}>
          <FileText className="h-4 w-4" aria-hidden />
          {t("report")}
        </Link>
      </header>

      <p className="flex items-start gap-3 rounded-2xl bg-stream-soft px-4 py-3 text-sm text-ink">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t("disclaimer")}
      </p>

      <MigraineForm showMenstrual={user.preferences?.trackMenstrual ?? false} />

      <section aria-labelledby="history" className="space-y-3">
        <h2 id="history" className={ui.h2}>{t("history")}</h2>
        {episodes.length === 0 && <p className="text-ink-soft">{t("empty")}</p>}
        {episodes.map((e) => {
          const hours = e.endedAt ? Math.round(((e.endedAt.getTime() - e.startedAt.getTime()) / 3_600_000) * 10) / 10 : null;
          return (
            <article key={e.id} className={`${ui.card} space-y-2`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{format.dateTime(e.startedAt, { dateStyle: "full", timeStyle: "short" })}</p>
                  <p className="text-sm text-ink-soft">
                    {t("intensity")}: {e.intensity}/10 · {hours === null ? t("ongoingShort") : t("duration", { hours })}
                  </p>
                </div>
                <DeleteButton endpoint={`/api/migraine/${e.id}`} label={t("deleteEpisode")} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {e.locations.map((l) => (
                  <span key={l} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-sm text-ink">{t(`locations.${l}`)}</span>
                ))}
                {e.symptoms.map((s) => (
                  <span key={s.id} className="rounded-full bg-stream-soft px-2.5 py-0.5 text-sm text-ink">{t(`symptoms.${s.symptom}`)}</span>
                ))}
                {e.triggers.map((tr) => (
                  <span key={tr.id} className="rounded-full bg-clay-soft px-2.5 py-0.5 text-sm text-ink">{t(`triggers.${tr.category.toLowerCase()}`)}</span>
                ))}
              </div>
              {e.medicationNote && <p className="text-sm text-ink-soft"><span className="font-semibold">{t("medication")}:</span> {e.medicationNote}</p>}
              {e.recoveryNote && <p className="text-sm text-ink-soft"><span className="font-semibold">{t("recovery")}:</span> {e.recoveryNote}</p>}
            </article>
          );
        })}
      </section>
    </>
  );
}
