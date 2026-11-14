"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Moon, Sun, Type } from "lucide-react";

type Theme = "light" | "dark";
type TextSize = "normal" | "large" | "larger";
const SIZES: TextSize[] = ["normal", "large", "larger"];

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable – preference lasts this visit only */
  }
}

export function ComfortControls() {
  const t = useTranslations("comfort");
  const [theme, setTheme] = useState<Theme>("light");
  const [size, setSize] = useState<TextSize>("normal");

  useEffect(() => {
    const d = document.documentElement;
    const explicit = d.dataset.theme as Theme | undefined;
    setTheme(explicit ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
    setSize((d.dataset.textSize as TextSize | undefined) ?? "normal");
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    save("aruvi-theme", next);
    setTheme(next);
  };

  const cycleSize = () => {
    const next = SIZES[(SIZES.indexOf(size) + 1) % SIZES.length];
    const d = document.documentElement;
    if (next === "normal") delete d.dataset.textSize;
    else d.dataset.textSize = next;
    save("aruvi-text-size", next);
    setSize(next);
  };

  const btn =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink";

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={toggleTheme} className={btn} aria-label={theme === "dark" ? t("toLight") : t("toDark")}>
        {theme === "dark" ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
      </button>
      <button type="button" onClick={cycleSize} className={btn} aria-label={t("textSize", { size: t(`sizes.${size}`) })}>
        <Type className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
