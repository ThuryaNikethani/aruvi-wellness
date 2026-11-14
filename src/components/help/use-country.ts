"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { guessCountry, languageHasCountry } from "@/lib/helplines";

const EVENT = "aruvi-country-change";
// The user's pick is remembered per language, so switching language switches country.
const keyFor = (locale: string) => `aruvi-country:${locale}`;

/**
 * The country used for helpline numbers, shared by every component on the page.
 * Order: the user's pick for this language → the language's country
 * → (English, Arabic…) the detected country → default.
 */
export function useHelplineCountry() {
  const locale = useLocale();
  const [country, setCountryState] = useState(() => guessCountry(locale));

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(keyFor(locale));
    } catch {
      /* storage unavailable */
    }
    setCountryState(saved ?? guessCountry(locale));
    if (!saved && !languageHasCountry(locale)) {
      fetch("/api/geo")
        .then((r) => r.json())
        .then((d: { country: string | null }) => {
          if (d.country) setCountryState(guessCountry(locale, d.country));
        })
        .catch(() => {});
    }
    const sync = (e: Event) => setCountryState((e as CustomEvent<string>).detail);
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, [locale]);

  const setCountry = useCallback(
    (value: string) => {
      try {
        localStorage.setItem(keyFor(locale), value);
      } catch {
        /* storage unavailable – choice lasts this visit */
      }
      setCountryState(value);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
    },
    [locale],
  );

  return { country, setCountry };
}
