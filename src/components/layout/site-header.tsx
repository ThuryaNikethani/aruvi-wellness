"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitcher } from "./language-switcher";
import { ComfortControls } from "./comfort-controls";

const LINKS = [
  { href: "#checkin", key: "checkin" },
  { href: "#calm", key: "calm" },
  { href: "#features", key: "features" },
  { href: "#support", key: "support" },
] as const;

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const section = (hash: string) => `/${locale}${hash}`;
  const account = signedIn ? (
    <Link href="/dashboard" className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-on-leaf hover:opacity-90">
      {t("mySpace")}
    </Link>
  ) : (
    <Link href="/sign-in" className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-on-leaf hover:opacity-90">
      {t("signIn")}
    </Link>
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-leaf focus:px-4 focus:py-2 focus:text-on-leaf"
      >
        {t("skip")}
      </a>
      <header className="sticky top-0 z-40 border-b print:hidden border-line/70 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label={t("home")} className="shrink-0">
            <Logo />
          </Link>

          <nav aria-label={t("primary")} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {LINKS.map((l) => (
                <li key={l.key}>
                  <a
                    href={section(l.href)}
                    className="rounded-full px-3 py-2 text-[0.95rem] font-medium text-ink-soft hover:bg-surface-2 hover:text-ink"
                  >
                    {t(l.key)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageSwitcher />
            <ComfortControls />
            {account}
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>

        {open && (
          <div id="mobile-menu" className="border-t border-line bg-bg lg:hidden">
            <nav aria-label={t("primary")} className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
              <ul className="flex flex-col">
                {LINKS.map((l) => (
                  <li key={l.key}>
                    <a
                      href={section(l.href)}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-3 text-base font-medium text-ink hover:bg-surface-2"
                    >
                      {t(l.key)}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                <LanguageSwitcher id="language-mobile" />
                <ComfortControls />
                {account}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
