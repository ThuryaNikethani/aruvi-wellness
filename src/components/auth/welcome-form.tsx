"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/client";
import { ui } from "@/components/ui/styles";
import { ProfileFields, readProfile } from "@/components/auth/profile-fields";

export function WelcomeForm({ needsConsent }: { needsConsent: boolean }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const profile = readProfile(form);
    if (!profile) return setError(t("tooYoung"));
    setBusy(true);
    const res = await api("/api/profile", "POST", {
      ...profile,
      locale,
      acceptTerms: form.get("acceptTerms") === "on",
      acceptHealthData: form.get("acceptHealthData") === "on",
    });
    if (!res.ok) {
      setBusy(false);
      setError(res.status === 429 ? t("errors.rateLimited") : res.status === 400 ? t("errors.checkFields") : t("errors.generic"));
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className={`${ui.card} mx-auto w-full max-w-md`}>
      <h1 className={ui.h1}>{t("welcomeTitle")}</h1>
      <p className="mt-2 text-ink-soft">{t("welcomeSubtitle")}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <ProfileFields />

        {needsConsent && (
          <div className="space-y-3 rounded-2xl bg-surface-2 p-4 text-sm">
            <label className="flex items-start gap-3">
              <input type="checkbox" name="acceptTerms" required className="mt-1 h-4 w-4 accent-[var(--leaf)]" />
              <span className="text-ink">{t("acceptTerms")}</span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" name="acceptHealthData" required className="mt-1 h-4 w-4 accent-[var(--leaf)]" />
              <span className="text-ink">{t("acceptHealth")}</span>
            </label>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-clay-soft px-4 py-3 text-sm text-ink">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className={`${ui.btnPrimary} w-full`}>
          {busy ? t("wait") : t("continue")}
        </button>
      </form>
    </div>
  );
}
