import { useTranslations } from "next-intl";
import { ArrowRight, BarChart3, BedDouble, Brain, MessageCircleHeart, NotebookPen, Sprout, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";

// Calm works without an account (it's on this page). The rest open in "My space";
// signed-out visitors are sent to sign-in first.
const ITEMS: { key: string; icon: LucideIcon; href: string }[] = [
  { key: "calm", icon: Sprout, href: "#calm" },
  { key: "journal", icon: NotebookPen, href: "/dashboard/journal" },
  { key: "companion", icon: MessageCircleHeart, href: "/dashboard/companion" },
  { key: "migraine", icon: Brain, href: "/dashboard/migraine" },
  { key: "sleep", icon: BedDouble, href: "/dashboard/sleep" },
  { key: "insights", icon: BarChart3, href: "/dashboard/insights" },
];

export function Features() {
  const t = useTranslations("features");
  return (
    <section id="features" aria-labelledby="features-title" className="bg-surface-2/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 max-w-2xl space-y-2">
          <h2 id="features-title" className="font-display text-3xl font-medium text-ink">{t("title")}</h2>
          <p className="text-ink-soft">{t("subtitle")}</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(({ key, icon: Icon, href }) => {
            const inner = (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-leaf-soft text-leaf">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft px-2.5 py-0.5 text-xs font-semibold text-leaf">
                    {t("preview")}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden />
                  </span>
                </div>
                <h3 className="mb-1 text-lg font-semibold text-ink">{t(`items.${key}.title`)}</h3>
                <p className="text-ink-soft">{t(`items.${key}.body`)}</p>
              </>
            );
            const cls =
              "group block h-full rounded-3xl border border-line bg-surface p-6 transition-colors hover:border-leaf hover:bg-surface-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]";
            return (
              <li key={key}>
                {href.startsWith("#") ? (
                  <a href={href} className={cls}>{inner}</a>
                ) : (
                  <Link href={href} className={cls}>{inner}</Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
