"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MOODS } from "@/features/mood/moods";
import { api } from "@/lib/client";
import { ui } from "@/components/ui/styles";

export function MoodLogger() {
  const t = useTranslations("mood");
  const tj = useTranslations("journal");
  const tc = useTranslations("common");
  const router = useRouter();
  const uid = useId();
  const [mood, setMood] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!mood) return;
    setState("saving");
    const res = await api("/api/mood", "POST", { mood, intensity, note: note || undefined });
    if (!res.ok) return setState("error");
    setState("saved");
    setMood(null);
    setNote("");
    setIntensity(3);
    router.refresh();
  }

  return (
    <form onSubmit={save} className={`${ui.card} space-y-5`}>
      <fieldset>
        <legend className={ui.h2}>{t("title")}</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {MOODS.map(({ key, icon: Icon }) => (
            <label key={key} className={`${ui.chip} gap-2 ${mood === key ? ui.chipOn : ui.chipOff}`}>
              <input
                type="radio"
                name={`${uid}-mood`}
                value={key}
                checked={mood === key}
                onChange={() => {
                  setMood(key);
                  setState("idle");
                }}
                className="sr-only"
              />
              <Icon className="h-4 w-4" aria-hidden />
              {t(`options.${key}`)}
            </label>
          ))}
        </div>
      </fieldset>

      {mood && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-int`} className={ui.label}>{t("intensity")}</label>
            <input
              id={`${uid}-int`}
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
          <div>
            <label htmlFor={`${uid}-note`} className={ui.label}>
              {tj("moodNote")} <span className="font-normal text-ink-soft">({tc("optional")})</span>
            </label>
            <input id={`${uid}-note`} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} className={ui.input} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!mood || state === "saving"} className={ui.btnPrimary}>
          {state === "saving" ? tc("saving") : t("save")}
        </button>
        <span role="status" className="text-sm text-ink-soft">
          {state === "saved" && t("saved")}
          {state === "error" && tc("error")}
        </span>
      </div>
    </form>
  );
}
