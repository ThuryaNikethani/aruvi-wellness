import { useTranslations } from "next-intl";
import { BarChart3, BedDouble, Brain, MessageCircleHeart, NotebookPen, Sprout, type LucideIcon } from "lucide-react";

const ITEMS: { key: string; icon: LucideIcon; ready?: boolean }[] = [
  { key: "calm", icon: Sprout, ready: true },
  { key: "journal", icon: NotebookPen },
  { key: "companion", icon: MessageCircleHeart },
  { key: "migraine", icon: Brain },
  { key: "sleep", icon: BedDouble },
  { key: "insights", icon: BarChart3 },
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
          {ITEMS.map(({ key, icon: Icon, ready }) => (
            <li key={key} className="rounded-3xl border border-line bg-surface p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-leaf-soft text-leaf">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ready ? "bg-leaf-soft text-leaf" : "bg-sand text-ink-soft"}`}>
                  {ready ? t("preview") : t("soon")}
                </span>
              </div>
              <h3 className="mb-1 text-lg font-semibold text-ink">{t(`items.${key}.title`)}</h3>
              <p className="text-ink-soft">{t(`items.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
