"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { allLocales, curatedLocales, nativeName, type Locale } from "@/i18n/locales";

const others = allLocales
  .filter((l) => !(curatedLocales as readonly string[]).includes(l))
  .map((l) => ({ code: l, name: nativeName(l) }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function LanguageSwitcher({ id = "language" }: { id?: string }) {
  const t = useTranslations("nav");
  const active = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor={id} className="sr-only">
        {t("language")}
      </label>
      <Globe className="pointer-events-none absolute left-3 h-4 w-4 text-ink-soft" aria-hidden />
      <select
        id={id}
        value={active}
        aria-busy={pending}
        onChange={(e) => {
          const locale = e.target.value as Locale;
          startTransition(() => router.replace(pathname, { locale }));
        }}
        className="h-10 max-w-[11rem] appearance-none rounded-full border border-line bg-surface py-0 pl-9 pr-8 text-sm font-semibold text-ink hover:bg-surface-2"
      >
        <optgroup label={t("languagesFull")}>
          {curatedLocales.map((l) => (
            <option key={l} value={l} lang={l}>
              {nativeName(l)}
            </option>
          ))}
        </optgroup>
        <optgroup label={t("languagesMore")}>
          {others.map((l) => (
            <option key={l.code} value={l.code} lang={l.code}>
              {l.name}
            </option>
          ))}
        </optgroup>
      </select>
      <span className="pointer-events-none absolute right-3 text-xs text-ink-soft" aria-hidden>
        ▾
      </span>
    </div>
  );
}
