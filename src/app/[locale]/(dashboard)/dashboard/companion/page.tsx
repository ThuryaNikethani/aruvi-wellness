import { getTranslations, setRequestLocale } from "next-intl/server";
import { Info } from "lucide-react";
import { MessageRole } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { requirePageUser } from "@/lib/auth/session";
import { CompanionChat } from "@/components/companion/companion-chat";
import { ui } from "@/components/ui/styles";

export default async function CompanionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requirePageUser(locale);
  const t = await getTranslations("companion");
  const keep = user.preferences?.keepAiHistory ?? false;

  const latest = keep
    ? await prisma.conversation.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 60, select: { role: true, content: true } } },
      })
    : null;

  return (
    <>
      <header className="space-y-1">
        <h1 className={ui.h1}>{t("title")}</h1>
        <p className="text-ink-soft">{t("subtitle")}</p>
      </header>

      <p className="flex items-start gap-3 rounded-2xl bg-stream-soft px-4 py-3 text-sm text-ink">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t("disclaimer")}
      </p>

      <CompanionChat
        keepHistory={keep}
        initialConversationId={latest?.id}
        initialMessages={(latest?.messages ?? []).map((m) => ({
          role: m.role === MessageRole.USER ? "user" : "assistant",
          content: m.content,
        }))}
      />
    </>
  );
}
