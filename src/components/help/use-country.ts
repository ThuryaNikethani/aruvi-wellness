"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { guessCountry } from "@/lib/helplines";

const KEY = "aruvi-country";
const EVENT = "aruvi-country-change";

/**
 * The country used for helpline numbers, shared by every component on the page.
 * Order: the user's own choice → detected country → language → default.
 */
export function useHelplineCountry() {
  const locale = useLocale();
  const [country, setCountryState] = useState(() => guessCountry(locale));

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {
      /* storage unavailable */
    }
    if (saved) {
      setCountryState(saved);
    } else {
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

  const setCountry = useCallback((value: string) => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* storage unavailable – choice lasts this visit */
    }
    setCountryState(value);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
  }, []);

  return { country, setCountry };
}
