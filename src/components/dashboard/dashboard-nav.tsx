"use client";

import { useLocale, useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { BarChart3, BedDouble, Brain, Home, LogOut, MessageCircleHeart, NotebookPen, Settings, Sprout } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

const ITEMS = [
  { href: "/dashboard", key: "overview", icon: Home },
  { href: "/dashboard/journal", key: "journal", icon: NotebookPen },
  { href: "/dashboard/companion", key: "companion", icon: MessageCircleHeart },
  { href: "/dashboard/migraine", key: "migraine", icon: Brain },
  { href: "/dashboard/sleep", key: "sleep", icon: BedDouble },
  { href: "/dashboard/insights", key: "insights", icon: BarChart3 },
  { href: "/dashboard/settings", key: "settings", icon: Settings },
] as const;

export function DashboardNav() {
  const t = useTranslations("dash.nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className="print:hidden lg:sticky lg:top-20">
      <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {ITEMS.map(({ href, key, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={key} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${
                  active ? "bg-leaf-soft text-ink" : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-leaf" : ""}`} aria-hidden />
                <span className="whitespace-nowrap">{t(key)}</span>
              </Link>
            </li>
          );
        })}
        <li className="shrink-0">
          <a href={`/${locale}#calm`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-ink-soft hover:bg-surface-2 hover:text-ink">
            <Sprout className="h-5 w-5" aria-hidden />
            <span className="whitespace-nowrap">{t("calm")}</span>
          </a>
        </li>
        <li className="shrink-0 lg:mt-4 lg:border-t lg:border-line lg:pt-4">
          <button
            type="button"
            onClick={() => signOut({ redirectTo: "/" })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-ink-soft hover:bg-surface-2 hover:text-ink"
          >
            <LogOut className="h-5 w-5" aria-hidden />
            <span className="whitespace-nowrap">{t("signOut")}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
