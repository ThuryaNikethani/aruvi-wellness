"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { Download } from "lucide-react";
import { api } from "@/lib/client";
import { ui } from "@/components/ui/styles";

type Prefs = {
  displayName: string | null;
  trackMigraine: boolean;
  trackMenstrual: boolean;
  keepAiHistory: boolean;
};

export function SettingsPanel({ initial }: { initial: Prefs }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [prefs, setPrefs] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    const res = await api("/api/preferences", "PATCH", { ...prefs, displayName: prefs.displayName ?? undefined });
    setState(res.ok ? "saved" : "error");
  }

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError(false);
    const res = await api("/api/account", "DELETE", { confirm: "DELETE" });
    if (!res.ok) {
      setDeleting(false);
      setDeleteError(true);
      return;
    }
    await signOut({ redirectTo: "/" });
  }

  const toggle = (key: "trackMigraine" | "trackMenstrual" | "keepAiHistory") => (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={prefs[key]}
        onChange={(e) => {
          setPrefs({ ...prefs, [key]: e.target.checked });
          setState("idle");
        }}
        className="mt-1 h-4 w-4 accent-[var(--leaf)]"
      />
      <span>
        <span className="block font-medium text-ink">{t(`${key}.title`)}</span>
        <span className="block text-sm text-ink-soft">{t(`${key}.body`)}</span>
      </span>
    </label>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={savePrefs} className={`${ui.card} space-y-5`}>
        <h2 className={ui.h2}>{t("prefsTitle")}</h2>
        <div className="max-w-sm">
          <label htmlFor="displayName" className={ui.label}>{t("displayName")}</label>
          <input
            id="displayName"
            value={prefs.displayName ?? ""}
            maxLength={80}
            onChange={(e) => setPrefs({ ...prefs, displayName: e.target.value })}
            className={ui.input}
          />
        </div>
        {toggle("trackMigraine")}
        {toggle("trackMenstrual")}
        {toggle("keepAiHistory")}
        <p className="text-sm text-ink-soft">{t("comfortNote")}</p>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={state === "saving"} className={ui.btnPrimary}>
            {state === "saving" ? tc("saving") : tc("save")}
          </button>
          <span role="status" className="text-sm text-ink-soft">
            {state === "saved" && tc("saved")}
            {state === "error" && tc("error")}
          </span>
        </div>
      </form>

      <section className={`${ui.card} space-y-3`} aria-labelledby="export-title">
        <h2 id="export-title" className={ui.h2}>{t("exportTitle")}</h2>
        <p className="text-ink-soft">{t("exportBody")}</p>
        <a href="/api/account/export" download className={ui.btnSecondary}>
          <Download className="h-4 w-4" aria-hidden />
          {t("exportButton")}
        </a>
      </section>

      <section className="space-y-3 rounded-3xl border border-clay/50 bg-clay-soft p-5 sm:p-6" aria-labelledby="delete-title">
        <h2 id="delete-title" className={ui.h2}>{t("deleteTitle")}</h2>
        <p className="text-ink">{t("deleteBody")}</p>
        <div className="max-w-xs">
          <label htmlFor="confirm-delete" className={ui.label}>{t("deleteConfirmLabel")}</label>
          <input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            className={ui.input}
          />
        </div>
        {deleteError && <p role="alert" className="text-sm text-ink">{tc("error")}</p>}
        <button type="button" disabled={confirmText !== "DELETE" || deleting} onClick={deleteAccount} className={ui.btnDanger}>
          {deleting ? tc("saving") : t("deleteButton")}
        </button>
      </section>
    </div>
  );
}
