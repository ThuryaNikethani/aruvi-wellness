import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePageUser } from "@/lib/auth/session";
import { SettingsPanel } from "@/components/dashboard/settings-panel";
import { ui } from "@/components/ui/styles";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requirePageUser(locale);
  const t = await getTranslations("settings");
  const p = user.preferences;

  return (
    <>
      <header className="space-y-1">
        <h1 className={ui.h1}>{t("title")}</h1>
        <p className="text-ink-soft">{user.email}</p>
      </header>
      <SettingsPanel
        initial={{
          displayName: p?.displayName ?? user.name ?? null,
          trackMigraine: p?.trackMigraine ?? false,
          trackMenstrual: p?.trackMenstrual ?? false,
          keepAiHistory: p?.keepAiHistory ?? false,
        }}
      />
    </>
  );
}
