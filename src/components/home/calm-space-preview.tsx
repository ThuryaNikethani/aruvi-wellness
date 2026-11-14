"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Pause, Play, Square } from "lucide-react";

type Phase = "in" | "hold" | "out" | "rest";
type Step = { phase: Phase; seconds: number };

const PATTERNS: Record<string, Step[]> = {
  gentle: [
    { phase: "in", seconds: 4 },
    { phase: "out", seconds: 6 },
  ],
  box: [
    { phase: "in", seconds: 4 },
    { phase: "hold", seconds: 4 },
    { phase: "out", seconds: 4 },
    { phase: "rest", seconds: 4 },
  ],
};
const SCENES = ["forest", "ocean", "dusk"] as const;
const MIN = 0.62;
const MAX = 1;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function CalmSpacePreview() {
  const t = useTranslations("calm");
  const reduced = useReducedMotion();
  const [pattern, setPattern] = useState<keyof typeof PATTERNS>("gentle");
  const [scene, setScene] = useState<(typeof SCENES)[number]>("forest");
  const [status, setStatus] = useState<"idle" | "running" | "paused">("idle");
  const [clock, setClock] = useState({ stepIndex: 0, elapsed: 0, rounds: 0 });
  const { stepIndex, elapsed, rounds } = clock;
  const scaleRef = useRef(MIN);

  const steps = PATTERNS[pattern];
  const step = steps[stepIndex];

  // One gentle tick per second. Scale is interpolated per tick, so pausing freezes it in place.
  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => {
      setClock((c) => {
        if (c.elapsed + 1 < steps[c.stepIndex].seconds) return { ...c, elapsed: c.elapsed + 1 };
        const next = (c.stepIndex + 1) % steps.length;
        return { stepIndex: next, elapsed: 0, rounds: next === 0 ? c.rounds + 1 : c.rounds };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [status, steps]);

  const progress = status === "idle" ? 0 : Math.min(1, (elapsed + 1) / step.seconds);
  let scale = scaleRef.current;
  if (status === "idle") scale = MIN;
  else if (status === "running") {
    if (step.phase === "in") scale = MIN + (MAX - MIN) * progress;
    else if (step.phase === "out") scale = MAX - (MAX - MIN) * progress;
  }
  scaleRef.current = scale;

  const stop = () => {
    setStatus("idle");
    setClock((c) => ({ ...c, stepIndex: 0, elapsed: 0 }));
  };

  const choosePattern = (p: keyof typeof PATTERNS) => {
    setPattern(p);
    setStatus("idle");
    setClock({ stepIndex: 0, elapsed: 0, rounds: 0 });
  };

  const remaining = step.seconds - elapsed;

  return (
    <section id="calm" aria-labelledby="calm-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-8 max-w-2xl space-y-2">
        <h2 id="calm-title" className="font-display text-3xl font-medium text-ink">{t("title")}</h2>
        <p className="text-ink-soft">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className={`scene-${scene} relative flex min-h-[22rem] flex-col items-center justify-center rounded-3xl border border-line p-6`}>
          <div
            className="flex h-56 w-56 items-center justify-center rounded-full bg-surface/70 shadow-[0_0_0_18px_color-mix(in_srgb,var(--surface)_35%,transparent)] sm:h-64 sm:w-64"
            style={{
              transform: reduced ? undefined : `scale(${scale})`,
              transition: reduced ? undefined : "transform 1s linear",
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p aria-live="polite" className="font-display text-2xl text-ink">
              {status === "idle" ? t("idle") : t(`phases.${step.phase}`)}
            </p>
            {status !== "idle" && (
              <p className="mt-1 text-lg tabular-nums text-ink-soft">{t("seconds", { seconds: remaining })}</p>
            )}
            {status === "paused" && <p className="mt-1 text-sm font-semibold text-ink-soft">{t("pausedLabel")}</p>}
          </div>
        </div>

        <div className="space-y-6 rounded-3xl border border-line bg-surface p-6">
          <div className="flex flex-wrap gap-3">
            {status !== "running" ? (
              <button type="button" onClick={() => setStatus("running")} className="inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-2.5 font-semibold text-on-leaf hover:opacity-90">
                <Play className="h-4 w-4" aria-hidden />
                {status === "paused" ? t("resume") : t("start")}
              </button>
            ) : (
              <button type="button" onClick={() => setStatus("paused")} className="inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-2.5 font-semibold text-on-leaf hover:opacity-90">
                <Pause className="h-4 w-4" aria-hidden />
                {t("pause")}
              </button>
            )}
            <button type="button" onClick={stop} disabled={status === "idle"} className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 font-semibold text-ink hover:bg-surface-2 disabled:opacity-50">
              <Square className="h-4 w-4" aria-hidden />
              {t("stop")}
            </button>
          </div>

          <fieldset>
            <legend className="mb-2 font-semibold text-ink">{t("patternLabel")}</legend>
            <div className="flex flex-col gap-2">
              {(Object.keys(PATTERNS) as (keyof typeof PATTERNS)[]).map((p) => (
                <label key={p} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-surface-2">
                  <input type="radio" name="pattern" checked={pattern === p} onChange={() => choosePattern(p)} className="h-4 w-4 accent-[var(--leaf)]" />
                  <span className="text-ink">{t(`patterns.${p}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 font-semibold text-ink">{t("sceneLabel")}</legend>
            <div className="flex gap-3">
              {SCENES.map((s) => (
                <label key={s} className="cursor-pointer text-center">
                  <input type="radio" name="scene" checked={scene === s} onChange={() => setScene(s)} className="peer sr-only" />
                  <span className={`scene-${s} block h-12 w-16 rounded-xl border-2 border-line peer-checked:border-leaf peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]`} aria-hidden />
                  <span className="mt-1 block text-sm text-ink-soft">{t(`scenes.${s}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="text-sm text-ink-soft">{t("rounds", { count: rounds })}</p>
          <p className="border-t border-line pt-4 text-sm text-ink-soft">{t("note")}</p>
        </div>
      </div>
    </section>
  );
}
