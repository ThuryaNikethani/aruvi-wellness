import { useTranslations } from "next-intl";
import { Gift, Feather, Lock, Stethoscope, type LucideIcon } from "lucide-react";

const ITEMS: { key: string; icon: LucideIcon }[] = [
  { key: "free", icon: Gift },
  { key: "private", icon: Lock },
  { key: "gentle", icon: Feather },
  { key: "notMedical", icon: Stethoscope },
];

export function OurPromise() {
  const t = useTranslations("promise");
  return (
    <section aria-labelledby="promise-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 id="promise-title" className="mb-8 font-display text-3xl font-medium text-ink">{t("title")}</h2>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ key, icon: Icon }) => (
          <li key={key} className="space-y-2">
            <Icon className="h-6 w-6 text-stream" aria-hidden />
            <h3 className="font-semibold text-ink">{t(`items.${key}.title`)}</h3>
            <p className="text-ink-soft">{t(`items.${key}.body`)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
