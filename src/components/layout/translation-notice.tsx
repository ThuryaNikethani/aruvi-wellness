import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { isCurated, nativeName } from "@/i18n/locales";

/** Shown only for languages that don't yet have a complete human translation. */
export function TranslationNotice() {
  const locale = useLocale();
  const t = useTranslations("i18n");
  if (isCurated(locale)) return null;
  return (
    <div role="note" className="border-b border-line bg-stream-soft">
      <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm text-ink sm:px-6">
        <Languages className="h-4 w-4 shrink-0" aria-hidden />
        {t("partial", { language: nativeName(locale) })}
      </p>
    </div>
  );
}
