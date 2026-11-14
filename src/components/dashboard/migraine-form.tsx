"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api, toDateTimeLocal } from "@/lib/client";
import { CHARACTERISTICS, LOCATIONS, SYMPTOMS, TRIGGERS } from "@/features/migraine/options";
import { ui } from "@/components/ui/styles";

function ChipGroup({
  legend, options, values, onToggle, label,
}: {
  legend: string;
  options: readonly string[];
  values: string[];
  onToggle: (v: string) => void;
  label: (v: string) => string;
}) {
  return (
    <fieldset>
      <legend className={ui.label}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = values.includes(o);
          return (
            <label key={o} className={`${ui.chip} ${on ? ui.chipOn : ui.chipOff}`}>
              <input type="checkbox" checked={on} onChange={() => onToggle(o)} className="sr-only" />
              {label(o)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function MigraineForm({ showMenstrual }: { showMenstrual: boolean }) {
  const t = useTranslations("migraine");
  const tc = useTranslations("common");
  const router = useRouter();
  const [startedAt, setStartedAt] = useState(() => toDateTimeLocal(new Date()));
  const [ongoing, setOngoing] = useState(true);
  const [endedAt, setEndedAt] = useState("");
  const [intensity, setIntensity] = useState(5);
  const [locations, setLocations] = useState<string[]>([]);
  const [characteristics, setCharacteristics] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [medicationNote, setMedicationNote] = useState("");
  const [recoveryNote, setRecoveryNote] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const toggle = (set: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) =>
    set((xs) => (xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v]));

  const triggerOptions = TRIGGERS.filter((tr) => tr !== "menstrual" || showMenstrual);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    const res = await api("/api/migraine", "POST", {
      startedAt: new Date(startedAt).toISOString(),
      endedAt: !ongoing && endedAt ? new Date(endedAt).toISOString() : undefined,
      intensity,
      locations,
      characteristics,
      symptoms,
      triggers: triggers.map((category) => ({ category })),
      medicationNote: medicationNote || undefined,
      recoveryNote: recoveryNote || undefined,
    });
    if (!res.ok) return setState("error");
    setState("saved");
    setLocations([]);
    setCharacteristics([]);
    setSymptoms([]);
    setTriggers([]);
    setMedicationNote("");
    setRecoveryNote("");
    router.refresh();
  }

  return (
    <form onSubmit={save} className={`${ui.card} space-y-6`}>
      <h2 className={ui.h2}>{t("formTitle")}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="m-start" className={ui.label}>{t("start")}</label>
          <input id="m-start" type="datetime-local" required value={startedAt} onChange={(e) => setStartedAt(e.target.value)} className={ui.input} />
        </div>
        <div>
          <label htmlFor="m-end" className={ui.label}>{t("end")}</label>
          <input
            id="m-end"
            type="datetime-local"
            value={endedAt}
            min={startedAt}
            disabled={ongoing}
            onChange={(e) => setEndedAt(e.target.value)}
            className={`${ui.input} disabled:opacity-50`}
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={ongoing} onChange={(e) => setOngoing(e.target.checked)} className="h-4 w-4 accent-[var(--leaf)]" />
            {t("ongoing")}
          </label>
        </div>
      </div>

      <div className="max-w-md">
        <label htmlFor="m-int" className={ui.label}>
          {t("intensity")}: <span className="tabular-nums">{intensity}</span> / 10
        </label>
        <input
          id="m-int"
          type="range"
          min={0}
          max={10}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          aria-valuetext={`${intensity} / 10`}
          className="w-full accent-[var(--leaf)]"
        />
        <p className={ui.hint}>{t("intensityHint")}</p>
      </div>

      <ChipGroup legend={t("locationsLabel")} options={LOCATIONS} values={locations} onToggle={toggle(setLocations)} label={(v) => t(`locations.${v}`)} />
      <ChipGroup legend={t("characteristicsLabel")} options={CHARACTERISTICS} values={characteristics} onToggle={toggle(setCharacteristics)} label={(v) => t(`characteristics.${v}`)} />
      <ChipGroup legend={t("symptomsLabel")} options={SYMPTOMS} values={symptoms} onToggle={toggle(setSymptoms)} label={(v) => t(`symptoms.${v}`)} />
      <div>
        <ChipGroup legend={t("triggersLabel")} options={triggerOptions} values={triggers} onToggle={toggle(setTriggers)} label={(v) => t(`triggers.${v}`)} />
        <p className={ui.hint}>{t("triggersHint")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="m-med" className={ui.label}>
            {t("medication")} <span className="font-normal text-ink-soft">({tc("optional")})</span>
          </label>
          <textarea id="m-med" rows={3} maxLength={1000} value={medicationNote} onChange={(e) => setMedicationNote(e.target.value)} className={ui.input} />
          <p className={ui.hint}>{t("medicationHint")}</p>
        </div>
        <div>
          <label htmlFor="m-rec" className={ui.label}>
            {t("recovery")} <span className="font-normal text-ink-soft">({tc("optional")})</span>
          </label>
          <textarea id="m-rec" rows={3} maxLength={2000} value={recoveryNote} onChange={(e) => setRecoveryNote(e.target.value)} className={ui.input} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={state === "saving"} className={ui.btnPrimary}>
          {state === "saving" ? tc("saving") : t("save")}
        </button>
        <span role="status" className="text-sm text-ink-soft">
          {state === "saved" && tc("saved")}
          {state === "error" && tc("error")}
        </span>
      </div>
    </form>
  );
}
