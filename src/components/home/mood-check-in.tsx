"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { MOODS } from "@/features/mood/moods";

const BREATHE_FIRST = new Set(["anxious", "overwhelmed", "irritated"]);

export function MoodCheckIn() {
  const t = useTranslations("mood");
  const uid = useId();
  const [mood, setMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (!mood) return;
    try {
      const key = "aruvi-checkins";
      const list = JSON.parse(localStorage.getItem(key) ?? "[]");
      list.push({ mood, intensity, at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(list.slice(-60)));
    } catch {
      /* private mode / storage blocked – check-in still acknowledged */
    }
    setSaved(true);
  };

  const reset = () => {
    setSaved(false);
    setMood(null);
    setIntensity(3);
  };

  return (
    <section id="checkin" aria-labelledby="checkin-title" className="bg-surface-2/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 max-w-2xl space-y-2">
          <h2 id="checkin-title" className="font-display text-3xl font-medium text-ink">{t("title")}</h2>
          <p className="text-ink-soft">{t("subtitle")}</p>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-5 sm:p-8">
          {saved && mood ? (
            <div role="status" className="space-y-4">
              <p className="font-display text-2xl text-ink">{t("saved")}</p>
              <p className="max-w-2xl text-lg text-ink-soft">{t(`responses.${mood}`)}</p>
              <div className="flex flex-wrap gap-3">
                {BREATHE_FIRST.has(mood) && (
                  <a href="#calm" className="rounded-full bg-leaf px-5 py-2.5 font-semibold text-on-leaf hover:opacity-90">
                    {t("suggestBreathe")}
                  </a>
                )}
                <button type="button" onClick={reset} className="rounded-full border border-line px-5 py-2.5 font-semibold text-ink hover:bg-surface-2">
                  {t("again")}
                </button>
              </div>
              <p className="text-sm text-ink-soft">{t("savedNote")}</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
              className="space-y-8"
            >
              <fieldset>
                <legend className="mb-4 font-semibold text-ink">{t("legend")}</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {MOODS.map(({ key, icon: Icon }) => {
                    const checked = mood === key;
                    return (
                      <label
                        key={key}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] ${
                          checked ? "border-leaf bg-leaf-soft text-ink" : "border-line text-ink-soft hover:bg-surface-2"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`${uid}-mood`}
                          value={key}
                          checked={checked}
                          onChange={() => setMood(key)}
                          className="sr-only"
                        />
                        <Icon className={`h-5 w-5 shrink-0 ${checked ? "text-leaf" : ""}`} aria-hidden />
                        <span className="font-medium">{t(`options.${key}`)}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {mood && (
                <div className="max-w-md space-y-2">
                  <label htmlFor={`${uid}-intensity`} className="font-semibold text-ink">
                    {t("intensity")}
                  </label>
                  <input
                    id={`${uid}-intensity`}
                    type="range"
                    min={1}
                    max={5}
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    aria-valuetext={`${intensity} / 5`}
                    className="w-full accent-[var(--leaf)]"
                  />
                  <div className="flex justify-between text-sm text-ink-soft">
                    <span>{t("intensityLow")}</span>
                    <span>{t("intensityHigh")}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={!mood}
                  className="rounded-full bg-leaf px-6 py-3 font-semibold text-on-leaf hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("save")}
                </button>
                <p className="text-sm text-ink-soft">{t("privacy")}</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
