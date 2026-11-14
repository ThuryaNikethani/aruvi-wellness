import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "./language-switcher";

export function SiteFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="text-ink-soft">{t("tagline")}</p>
          <p className="max-w-prose text-sm text-ink-soft">{t("disclaimer")}</p>
        </div>
        <div className="space-y-3 md:justify-self-end">
          <p className="text-sm font-semibold text-ink">{t("languages")}</p>
          <LanguageSwitcher id="language-footer" />
          <p className="text-sm text-ink-soft">{t("made")}</p>
        </div>
      </div>
    </footer>
  );
}
