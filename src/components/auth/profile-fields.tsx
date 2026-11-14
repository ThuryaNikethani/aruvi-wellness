"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ui } from "@/components/ui/styles";

export const CONCERNS = ["migraine", "depression", "anxiety", "stress", "sleep", "other"] as const;
const MIN_AGE = 16;
const UNDER = "under";

export type ProfileValues = { birthYear: number; concerns: string[]; trackMenstrual: boolean };

/** Reads the profile fields from a submitted form. Returns null when the person is under the minimum age. */
export function readProfile(form: FormData): ProfileValues | null {
  const year = Number(form.get("birthYear"));
  if (!year) return null;
  return {
    birthYear: year,
    concerns: form.getAll("concerns").map(String),
    trackMenstrual: form.get("trackMenstrual") === "on",
  };
}

/** Year of birth (16+), what the person wants support with, and the optional menstrual-trigger choice. */
export function ProfileFields() {
  const t = useTranslations("auth");
  const ts = useTranslations("settings");
  const locale = useLocale();
  const [year, setYear] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);

  const latest = new Date().getFullYear() - MIN_AGE;
  const years = Array.from({ length: 90 }, (_, i) => latest - i);
  const tooYoung = year === UNDER;

  const toggle = (c: string) => setConcerns((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  return (
    <>
      <div>
        <label htmlFor="birthYear" className={ui.label}>{t("birthYear")}</label>
        <select
          id="birthYear"
          name="birthYear"
          required
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-describedby="birthYear-hint"
          className={ui.input}
        >
          <option value="" disabled>{t("birthYearPlaceholder")}</option>
          <option value={UNDER}>{t("under16")}</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <p id="birthYear-hint" className={ui.hint}>{t("birthYearHint")}</p>
        {tooYoung && (
          <p role="alert" className="mt-2 rounded-xl bg-clay-soft px-4 py-3 text-sm text-ink">
            {t("tooYoung")}{" "}
            <a href={`/${locale}#support`} className="font-semibold underline underline-offset-4">{t("seeHelp")}</a>
          </p>
        )}
      </div>

      <fieldset aria-describedby="concerns-hint">
        <legend className={ui.label}>
          {t("concernsLabel")} <span className="font-normal text-ink-soft">({t("optional")})</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {CONCERNS.map((c) => {
            const on = concerns.includes(c);
            return (
              <label key={c} className={`${ui.chip} ${on ? ui.chipOn : ui.chipOff}`}>
                <input type="checkbox" name="concerns" value={c} checked={on} onChange={() => toggle(c)} className="sr-only" />
                {t(`concerns.${c}`)}
              </label>
            );
          })}
        </div>
        <p id="concerns-hint" className={ui.hint}>{t("concernsHint")}</p>
      </fieldset>

      {concerns.includes("migraine") && (
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="trackMenstrual" className="mt-1 h-4 w-4 accent-[var(--leaf)]" />
          <span className="text-ink">
            {ts("trackMenstrual.title")} <span className="text-ink-soft">({t("optional")})</span>
          </span>
        </label>
      )}
    </>
  );
}

export function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
