"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Phone } from "lucide-react";
import { HELPLINE_COUNTRIES, HELPLINE_DIRECTORY, OTHER_COUNTRY, helplinesFor, lineName } from "@/lib/helplines";
import { useHelplineCountry } from "./use-country";

function countryName(code: string, locale: string) {
  try {
    return new Intl.DisplayNames([locale, "en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function CountrySelect({ id }: { id: string }) {
  const t = useTranslations("help");
  const locale = useLocale();
  const { country, setCountry } = useHelplineCountry();
  const options = useMemo(
    () => HELPLINE_COUNTRIES.map((c) => ({ code: c, name: countryName(c, locale) })).sort((a, b) => a.name.localeCompare(b.name, locale)),
    [locale],
  );

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label htmlFor={id} className="font-semibold text-ink">{t("countryLabel")}</label>
      <select
        id={id}
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="h-9 rounded-full border border-line bg-surface px-3 text-ink"
      >
        {options.map((o) => (
          <option key={o.code} value={o.code}>{o.name}</option>
        ))}
        <option value={OTHER_COUNTRY}>{t("otherCountry")}</option>
      </select>
    </div>
  );
}

/** Helpline cards for the selected country, or the international directory. */
export function HelplineCards() {
  const t = useTranslations("help");
  const locale = useLocale();
  const { country } = useHelplineCountry();
  const lines = helplinesFor(country);

  if (!lines.length) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-5">
        <p className="text-ink">{t("noList")}</p>
        <a href={HELPLINE_DIRECTORY} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 font-semibold text-leaf hover:underline">
          {t("findMore")}
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {lines.map((l) => (
        <li key={l.tel} className="rounded-3xl border border-line bg-surface p-5">
          <p className="text-sm font-semibold text-ink-soft">{lineName(l, locale)}</p>
          <a
            href={`tel:${l.tel}`}
            className="mt-2 inline-flex items-center gap-2 font-display text-3xl font-semibold text-ink hover:text-leaf"
            aria-label={t("call", { number: l.number, name: lineName(l, locale) })}
          >
            <Phone className="h-6 w-6" aria-hidden />
            {l.number}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Compact call buttons (companion crisis card). Falls back to the directory link. */
export function HelplineButtons({ className = "" }: { className?: string }) {
  const t = useTranslations("help");
  const locale = useLocale();
  const { country } = useHelplineCountry();
  const lines = helplinesFor(country).slice(0, 2);

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {lines.map((l) => (
        <a
          key={l.tel}
          href={`tel:${l.tel}`}
          className="inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-2.5 font-semibold text-on-leaf hover:opacity-90"
          aria-label={t("call", { number: l.number, name: lineName(l, locale) })}
        >
          <Phone className="h-4 w-4" aria-hidden />
          {l.number} · {lineName(l, locale)}
        </a>
      ))}
      {!lines.length && (
        <a href={HELPLINE_DIRECTORY} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-2.5 font-semibold text-on-leaf">
          {t("findMore")}
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      )}
    </div>
  );
}
