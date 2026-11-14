import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { MessageCircleHeart, Sprout } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/database/prisma";
import { requirePageUser } from "@/lib/auth/session";
import { MoodLogger } from "@/components/dashboard/mood-logger";
import { ui } from "@/components/ui/styles";

const SUGGESTIONS = 6;

export default async function OverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ verified?: string }>;
}) {
  const { locale } = await params;
  const { verified } = await searchParams;
  setRequestLocale(locale);
  const user = await requirePageUser(locale);
  const t = await getTranslations("overview");
  const format = await getFormatter();

  const since = new Date(Date.now() - 30 * 86_400_000);
  const [journal, migraineCount, lastSleep, todayMoods] = await Promise.all([
    prisma.journalEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, title: true, content: true, createdAt: true } }),
    prisma.migraineEpisode.count({ where: { userId: user.id, startedAt: { gte: since } } }),
    prisma.sleepEntry.findFirst({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    prisma.moodEntry.count({ where: { userId: user.id, recordedAt: { gte: new Date(Date.now() - 86_400_000) } } }),
  ]);

  const name = user.preferences?.displayName || user.name;
  const dayOfYear = Math.floor(Date.now() / 86_400_000);
  const suggestion = t(`suggestions.${dayOfYear % SUGGESTIONS}`);

  return (
    <>
      {verified === "1" && <p role="status" className="rounded-2xl bg-leaf-soft px-4 py-3 text-ink">{t("verified")}</p>}
      {verified === "0" && <p role="status" className="rounded-2xl bg-clay-soft px-4 py-3 text-ink">{t("verifyFailed")}</p>}
      {!user.emailVerified && verified !== "1" && (
        <p className="rounded-2xl bg-stream-soft px-4 py-3 text-sm text-ink">{t("verifyPending")}</p>
      )}

      <header className="space-y-1">
        <h1 className={ui.h1}>{name ? t("greetingName", { name }) : t("greeting")}</h1>
        <p className="text-ink-soft">{todayMoods ? t("subtitleCheckedIn") : t("subtitle")}</p>
      </header>

      <MoodLogger />

      <div className="grid gap-4 md:grid-cols-2">
        <a href={`/${locale}#calm`} className={`${ui.card} flex items-start gap-4 hover:bg-surface-2`}>
          <Sprout className="mt-1 h-6 w-6 shrink-0 text-leaf" aria-hidden />
          <span>
            <span className="block font-semibold text-ink">{t("calmTitle")}</span>
            <span className="block text-ink-soft">{t("calmBody")}</span>
          </span>
        </a>
        <Link href="/dashboard/companion" className={`${ui.card} flex items-start gap-4 hover:bg-surface-2`}>
          <MessageCircleHeart className="mt-1 h-6 w-6 shrink-0 text-stream" aria-hidden />
          <span>
            <span className="block font-semibold text-ink">{t("companionTitle")}</span>
            <span className="block text-ink-soft">{t("companionBody")}</span>
          </span>
        </Link>
      </div>

      <section className={`${ui.card} bg-surface-2`} aria-labelledby="suggestion-title">
        <h2 id="suggestion-title" className="text-sm font-semibold text-ink-soft">{t("suggestionTitle")}</h2>
        <p className="mt-1 text-lg text-ink">{suggestion}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <section className={`${ui.card} md:col-span-2`} aria-labelledby="recent-journal">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recent-journal" className={ui.h2}>{t("recentJournal")}</h2>
            <Link href="/dashboard/journal" className="text-sm font-semibold text-leaf hover:underline">{t("openJournal")}</Link>
          </div>
          {journal.length ? (
            <ul className="divide-y divide-line">
              {journal.map((j) => (
                <li key={j.id} className="py-3">
                  <p className="text-sm text-ink-soft">{format.dateTime(j.createdAt, { dateStyle: "medium" })}</p>
                  <p className="font-medium text-ink">{j.title || j.content.slice(0, 80)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-soft">{t("noJournal")}</p>
          )}
        </section>

        <section className={`${ui.card} space-y-4`} aria-labelledby="summary-title">
          <h2 id="summary-title" className={ui.h2}>{t("summaryTitle")}</h2>
          <div>
            <p className="text-sm text-ink-soft">{t("migraine30")}</p>
            <p className="font-display text-3xl text-ink">{migraineCount}</p>
          </div>
          <div>
            <p className="text-sm text-ink-soft">{t("lastSleep")}</p>
            <p className="font-display text-3xl text-ink">
              {lastSleep ? t("hours", { hours: lastSleep.hours }) : "—"}
            </p>
          </div>
          <Link href="/dashboard/insights" className="inline-block text-sm font-semibold text-leaf hover:underline">{t("seeInsights")}</Link>
        </section>
      </div>
    </>
  );
}
