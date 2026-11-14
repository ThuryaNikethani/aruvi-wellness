"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, todayLocal } from "@/lib/client";
import { ui } from "@/components/ui/styles";

function Scale({ id, label, value, onChange, low, high }: {
  id: string; label: string; value: number; onChange: (v: number) => void; low: string; high: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={ui.label}>{label}: <span className="tabular-nums">{value}</span> / 5</label>
      <input id={id} type="range" min={1} max={5} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={`${value} / 5`} className="w-full accent-[var(--leaf)]" />
      <div className="flex justify-between text-sm text-ink-soft"><span>{low}</span><span>{high}</span></div>
    </div>
  );
}

export function SleepEnergyForm() {
  const t = useTranslations("sleep");
  const tc = useTranslations("common");
  const router = useRouter();
  const [date, setDate] = useState(todayLocal);
  const [hours, setHours] = useState(7);
  const [quality, setQuality] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [fatigue, setFatigue] = useState(3);
  const [restMinutes, setRestMinutes] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    const [s, en] = await Promise.all([
      api("/api/sleep", "POST", { date, hours, quality, note: note || undefined }),
      api("/api/energy", "POST", {
        date,
        energy,
        fatigue,
        restMinutes: restMinutes ? Number(restMinutes) : undefined,
      }),
    ]);
    if (!s.ok || !en.ok) return setState("error");
    setState("saved");
    router.refresh();
  }

  return (
    <form onSubmit={save} className={`${ui.card} space-y-6`}>
      <div className="max-w-xs">
        <label htmlFor="s-date" className={ui.label}>{t("date")}</label>
        <input id="s-date" type="date" required value={date} max={todayLocal()} onChange={(e) => setDate(e.target.value)} className={ui.input} />
        <p className={ui.hint}>{t("dateHint")}</p>
      </div>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className={`${ui.h2} mb-3`}>{t("sleepTitle")}</legend>
        <div>
          <label htmlFor="s-hours" className={ui.label}>{t("hours")}</label>
          <input id="s-hours" type="number" min={0} max={24} step={0.5} required value={hours} onChange={(e) => setHours(Number(e.target.value))} className={ui.input} />
        </div>
        <Scale id="s-quality" label={t("quality")} value={quality} onChange={setQuality} low={t("poor")} high={t("restful")} />
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className={`${ui.h2} mb-3`}>{t("energyTitle")}</legend>
        <Scale id="e-energy" label={t("energy")} value={energy} onChange={setEnergy} low={t("veryLow")} high={t("high")} />
        <Scale id="e-fatigue" label={t("fatigue")} value={fatigue} onChange={setFatigue} low={t("little")} high={t("aLot")} />
        <div>
          <label htmlFor="e-rest" className={ui.label}>
            {t("rest")} <span className="font-normal text-ink-soft">({tc("optional")})</span>
          </label>
          <input id="e-rest" type="number" min={0} max={1440} value={restMinutes} onChange={(e) => setRestMinutes(e.target.value)} className={ui.input} />
        </div>
        <div>
          <label htmlFor="s-note" className={ui.label}>
            {t("note")} <span className="font-normal text-ink-soft">({tc("optional")})</span>
          </label>
          <input id="s-note" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={ui.input} />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={state === "saving"} className={ui.btnPrimary}>
          {state === "saving" ? tc("saving") : tc("save")}
        </button>
        <span role="status" className="text-sm text-ink-soft">
          {state === "saved" && tc("saved")}
          {state === "error" && tc("error")}
        </span>
      </div>
    </form>
  );
}
