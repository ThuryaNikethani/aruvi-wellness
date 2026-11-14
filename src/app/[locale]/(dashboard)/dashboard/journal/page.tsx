import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/database/prisma";
import { requirePageUser } from "@/lib/auth/session";
import { moodIcon } from "@/features/mood/moods";
import { MoodLogger } from "@/components/dashboard/mood-logger";
import { JournalEditor } from "@/components/dashboard/journal-editor";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { ui } from "@/components/ui/styles";

export default async function JournalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requirePageUser(locale);
  const t = await getTranslations("journal");
  const tm = await getTranslations("mood.options");
  const format = await getFormatter();

  const [entries, moods] = await Promise.all([
    prisma.journalEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.moodEntry.findMany({ where: { userId: user.id }, orderBy: { recordedAt: "desc" }, take: 14 }),
  ]);

  return (
    <>
      <header className="space-y-1">
        <h1 className={ui.h1}>{t("title")}</h1>
        <p className="text-ink-soft">{t("subtitle")}</p>
      </header>

      <MoodLogger />

      {moods.length > 0 && (
        <section className={ui.card} aria-labelledby="mood-history">
          <h2 id="mood-history" className={`${ui.h2} mb-3`}>{t("moodHistory")}</h2>
          <ul className="divide-y divide-line">
            {moods.map((m) => {
              const Icon = moodIcon(m.mood);
              return (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <Icon className="h-5 w-5 shrink-0 text-leaf" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-ink">{tm(m.mood.toLowerCase())}</span>
                    <span className="ms-2 text-sm text-ink-soft">{m.intensity} / 5</span>
                    {m.note && <span className="block truncate text-sm text-ink-soft">{m.note}</span>}
                  </span>
                  <span className="text-sm text-ink-soft">{format.dateTime(m.recordedAt, { dateStyle: "medium", timeStyle: "short" })}</span>
                  <DeleteButton endpoint={`/api/mood/${m.id}`} label={t("deleteMood")} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <JournalEditor />

      <section aria-labelledby="entries" className="space-y-3">
        <h2 id="entries" className={ui.h2}>{t("entries")}</h2>
        {entries.length === 0 && <p className="text-ink-soft">{t("empty")}</p>}
        {entries.map((e) => (
          <article key={e.id} className={`${ui.card} space-y-2`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-ink-soft">{format.dateTime(e.createdAt, { dateStyle: "full", timeStyle: "short" })}</p>
                {e.title && <h3 className="text-lg font-semibold text-ink">{e.title}</h3>}
              </div>
              <DeleteButton endpoint={`/api/journal/${e.id}`} label={t("deleteEntry")} />
            </div>
            {e.prompt && <p className="text-sm italic text-ink-soft">{e.prompt}</p>}
            <p className="whitespace-pre-wrap text-ink">{e.content}</p>
          </article>
        ))}
      </section>
    </>
  );
}
