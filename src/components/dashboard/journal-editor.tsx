"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/client";
import { ui } from "@/components/ui/styles";

const PROMPT_COUNT = 8;

export function JournalEditor() {
  const t = useTranslations("journal");
  const tc = useTranslations("common");
  const router = useRouter();
  const [promptIndex, setPromptIndex] = useState(() => new Date().getDate() % PROMPT_COUNT);
  const [usePrompt, setUsePrompt] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const prompt = t(`prompts.${promptIndex}`);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setState("saving");
    const res = await api("/api/journal", "POST", {
      title: title || undefined,
      content,
      prompt: usePrompt ? prompt : undefined,
    });
    if (!res.ok) return setState("error");
    setTitle("");
    setContent("");
    setState("saved");
    router.refresh();
  }

  return (
    <form onSubmit={save} className={`${ui.card} space-y-4`}>
      <h2 className={ui.h2}>{t("writeTitle")}</h2>

      {usePrompt && (
        <div className="flex items-start justify-between gap-3 rounded-2xl bg-stream-soft p-4">
          <p className="text-ink">
            <span className="block text-sm font-semibold text-ink-soft">{t("promptLabel")}</span>
            {prompt}
          </p>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setPromptIndex((i) => (i + 1) % PROMPT_COUNT)}
              aria-label={t("newPrompt")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-surface"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={usePrompt} onChange={(e) => setUsePrompt(e.target.checked)} className="h-4 w-4 accent-[var(--leaf)]" />
        {t("showPrompt")}
      </label>

      <div>
        <label htmlFor="j-title" className={ui.label}>
          {t("titleLabel")} <span className="font-normal text-ink-soft">({tc("optional")})</span>
        </label>
        <input id="j-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} className={ui.input} />
      </div>
      <div>
        <label htmlFor="j-content" className={ui.label}>{t("contentLabel")}</label>
        <textarea
          id="j-content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setState("idle");
          }}
          rows={7}
          maxLength={20000}
          required
          className={`${ui.input} resize-y leading-relaxed`}
        />
        <p className={ui.hint}>{t("privateNote")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!content.trim() || state === "saving"} className={ui.btnPrimary}>
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
