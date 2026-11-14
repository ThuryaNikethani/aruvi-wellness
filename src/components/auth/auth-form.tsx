"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/client";
import { ui } from "@/components/ui/styles";

export function AuthForm({ mode, googleEnabled }: { mode: "sign-in" | "sign-up"; googleEnabled: boolean }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    if (mode === "sign-up") {
      const res = await api("/api/auth/register", "POST", {
        name: String(form.get("name") ?? ""),
        email,
        password,
        locale,
        acceptTerms: form.get("acceptTerms") === "on",
        acceptHealthData: form.get("acceptHealthData") === "on",
      });
      if (!res.ok) {
        setBusy(false);
        setError(res.status === 429 ? t("errors.rateLimited") : res.status === 400 ? t("errors.checkFields") : t("errors.generic"));
        return;
      }
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (!result || result.error) {
      setError(mode === "sign-up" ? t("errors.exists") : t("errors.invalid"));
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  const isUp = mode === "sign-up";

  return (
    <div className={`${ui.card} mx-auto w-full max-w-md`}>
      <h1 className={ui.h1}>{isUp ? t("signUpTitle") : t("signInTitle")}</h1>
      <p className="mt-2 text-ink-soft">{isUp ? t("signUpSubtitle") : t("signInSubtitle")}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate={false}>
        {isUp && (
          <div>
            <label htmlFor="name" className={ui.label}>
              {t("name")} <span className="font-normal text-ink-soft">({t("optional")})</span>
            </label>
            <input id="name" name="name" autoComplete="nickname" maxLength={80} className={ui.input} />
          </div>
        )}
        <div>
          <label htmlFor="email" className={ui.label}>{t("email")}</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={ui.input} />
        </div>
        <div>
          <label htmlFor="password" className={ui.label}>{t("password")}</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={isUp ? 10 : 1}
            autoComplete={isUp ? "new-password" : "current-password"}
            aria-describedby={isUp ? "password-hint" : undefined}
            className={ui.input}
          />
          {isUp && <p id="password-hint" className={ui.hint}>{t("passwordHint")}</p>}
        </div>

        {isUp && (
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
          {busy ? t("wait") : isUp ? t("signUp") : t("signIn")}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-5 flex items-center gap-3 text-sm text-ink-soft">
            <span className="h-px flex-1 bg-line" />
            {t("or")}
            <span className="h-px flex-1 bg-line" />
          </div>
          <button
            type="button"
            onClick={() => signIn("google", { redirectTo: `/${locale}/dashboard` })}
            className={`${ui.btnSecondary} w-full`}
          >
            {t("google")}
          </button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        {isUp ? t("haveAccount") : t("noAccount")}{" "}
        <Link href={isUp ? "/sign-in" : "/sign-up"} className="font-semibold text-leaf underline-offset-4 hover:underline">
          {isUp ? t("signIn") : t("signUp")}
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-ink-soft">
        <a href={`/${locale}#calm`} className="underline-offset-4 hover:underline">{t("tryWithout")}</a>
      </p>
    </div>
  );
}
