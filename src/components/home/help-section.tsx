import { useTranslations } from "next-intl";
import { ExternalLink, LifeBuoy } from "lucide-react";
import { CountrySelect, HelplineCards } from "@/components/help/helplines";
import { HELPLINE_DIRECTORY } from "@/lib/helplines";

export function HelpSection() {
  const t = useTranslations("help");
  return (
    <section id="support" aria-labelledby="support-title" className="bg-clay-soft">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-6 flex max-w-2xl items-start gap-3">
          <LifeBuoy className="mt-1 h-7 w-7 shrink-0 text-clay" aria-hidden />
          <div className="space-y-2">
            <h2 id="support-title" className="font-display text-3xl font-medium text-ink">{t("title")}</h2>
            <p className="text-ink">{t("body")}</p>
          </div>
        </div>
        <div className="mb-4">
          <CountrySelect id="help-country" />
        </div>
        <HelplineCards />
        <p className="mt-6 max-w-3xl text-sm text-ink">
          {t("note")}{" "}
          <a href={HELPLINE_DIRECTORY} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
            {t("findMore")}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </p>
      </div>
    </section>
  );
}
