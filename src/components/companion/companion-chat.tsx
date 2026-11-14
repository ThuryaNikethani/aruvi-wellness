"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LifeBuoy, Plus, Send, Trash2 } from "lucide-react";
import { CountrySelect, HelplineButtons } from "@/components/help/helplines";
import { useHelplineCountry } from "@/components/help/use-country";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/client";
import { ui } from "@/components/ui/styles";

type Turn = { role: "user" | "assistant"; content: string };

const SENTINELS = new Set(["refusal", "unavailable", "error"]);

export function CompanionChat({
  initialMessages,
  initialConversationId,
  keepHistory,
}: {
  initialMessages: Turn[];
  initialConversationId?: string;
  keepHistory: boolean;
}) {
  const t = useTranslations("companion");
  const locale = useLocale();
  const { country } = useHelplineCountry();
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>(initialMessages);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setInput("");
    setNotice(null);
    setBusy(true);
    const history = turns;
    setTurns([...history, { role: "user", content: message }, { role: "assistant", content: "" }]);

    let res: Response;
    try {
      res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, locale, country, history, message }),
      });
    } catch {
      setTurns(history);
      setInput(message);
      setNotice(t("errors.network"));
      setBusy(false);
      return;
    }

    if (!res.ok || !res.body) {
      setTurns(history);
      setInput(message);
      setNotice(res.status === 429 ? t("errors.limit") : t("errors.generic"));
      setBusy(false);
      return;
    }

    if (res.headers.get("X-Aruvi-Crisis") === "1") setCrisis(true);
    const id = res.headers.get("X-Conversation-Id");
    if (id) setConversationId(id);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      setTurns((ts) => [...ts.slice(0, -1), { role: "assistant", content: text }]);
    }

    const sentinel = text.startsWith("\u0000") ? text.slice(1) : null;
    if (sentinel && SENTINELS.has(sentinel)) {
      setTurns((ts) => [...ts.slice(0, -1), { role: "assistant", content: t(`errors.${sentinel}`) }]);
    }
    setBusy(false);
  }

  async function clear() {
    if (keepHistory) await api("/api/ai/conversations", "DELETE");
    setTurns([]);
    setConversationId(undefined);
    setCrisis(false);
    router.refresh();
  }

  function newChat() {
    setTurns([]);
    setConversationId(undefined);
    setCrisis(false);
  }

  return (
    <div className="space-y-4">
      {crisis && (
        <aside role="alert" className="space-y-3 rounded-3xl border border-clay bg-clay-soft p-5">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <LifeBuoy className="h-5 w-5 text-clay" aria-hidden />
            {t("crisisTitle")}
          </p>
          <p className="text-ink">{t("crisisBody")}</p>
          <HelplineButtons />
          <CountrySelect id="crisis-country" />
        </aside>
      )}

      <div className={`${ui.card} flex min-h-[24rem] flex-col`}>
        <div className="flex-1 space-y-4" aria-live="polite" aria-busy={busy}>
          {turns.length === 0 && (
            <div className="space-y-2 py-8 text-center">
              <p className="font-display text-2xl text-ink">{t("emptyTitle")}</p>
              <p className="text-ink-soft">{t("emptyBody")}</p>
            </div>
          )}
          {turns.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <p
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 ${
                  m.role === "user" ? "bg-leaf text-on-leaf" : "bg-surface-2 text-ink"
                }`}
              >
                <span className="sr-only">{m.role === "user" ? t("you") : t("companion")}: </span>
                {m.content || <span className="text-ink-soft">{t("thinking")}</span>}
              </p>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {notice && <p role="alert" className="mt-3 rounded-xl bg-clay-soft px-4 py-2 text-sm text-ink">{notice}</p>}

        <form onSubmit={send} className="mt-4 flex items-end gap-2 border-t border-line pt-4">
          <label htmlFor="chat-input" className="sr-only">{t("inputLabel")}</label>
          <textarea
            id="chat-input"
            rows={2}
            maxLength={4000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={t("placeholder")}
            className={`${ui.input} flex-1 resize-none`}
          />
          <button type="submit" disabled={busy || !input.trim()} className={`${ui.btnPrimary} h-12 w-12 p-0`} aria-label={t("send")}>
            <Send className="h-5 w-5" aria-hidden />
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={newChat} className={ui.btnSecondary}>
          <Plus className="h-4 w-4" aria-hidden />
          {t("newChat")}
        </button>
        <button type="button" onClick={clear} className={ui.btnSecondary}>
          <Trash2 className="h-4 w-4" aria-hidden />
          {keepHistory ? t("deleteHistory") : t("clear")}
        </button>
        <p className="text-sm text-ink-soft">{keepHistory ? t("historyOn") : t("historyOff")}</p>
      </div>
    </div>
  );
}
