"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/client";

/** Two-step delete: first press asks, second press confirms. */
export function DeleteButton({ endpoint, label }: { endpoint: string; label: string }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        aria-label={label}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-clay-soft hover:text-clay"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="text-ink-soft">{t("confirmDelete")}</span>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await api(endpoint, "DELETE");
          setBusy(false);
          setAsking(false);
          router.refresh();
        }}
        className="rounded-full bg-clay px-3 py-1 font-semibold text-surface"
      >
        {t("yes")}
      </button>
      <button type="button" onClick={() => setAsking(false)} className="rounded-full px-3 py-1 font-semibold text-ink-soft hover:bg-surface-2">
        {t("cancel")}
      </button>
    </span>
  );
}
