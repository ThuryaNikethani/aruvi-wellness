import { useTranslations } from "next-intl";
import { Phone, LifeBuoy } from "lucide-react";

// Sri Lanka support lines. Verify periodically – see docs/safety.md.
const LINES = [
  { key: "national", number: "1926" },
  { key: "ambulance", number: "1990" },
  { key: "police", number: "119" },
] as const;

export function HelpSection() {
  const t = useTranslations("help");
  return (
    <section id="support" aria-labelledby="support-title" className="bg-clay-soft">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex max-w-2xl items-start gap-3">
          <LifeBuoy className="mt-1 h-7 w-7 shrink-0 text-clay" aria-hidden />
          <div className="space-y-2">
            <h2 id="support-title" className="font-display text-3xl font-medium text-ink">{t("title")}</h2>
            <p className="text-ink">{t("body")}</p>
          </div>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {LINES.map(({ key, number }) => (
            <li key={key} className="rounded-3xl border border-line bg-surface p-5">
              <p className="text-sm font-semibold text-ink-soft">{t(`lines.${key}`)}</p>
              <a
                href={`tel:${number}`}
                className="mt-2 inline-flex items-center gap-2 font-display text-3xl font-semibold text-ink hover:text-leaf"
                aria-label={t("call", { number, name: t(`lines.${key}`) })}
              >
                <Phone className="h-6 w-6" aria-hidden />
                {number}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-3xl text-sm text-ink">{t("note")}</p>
      </div>
    </section>
  );
}
