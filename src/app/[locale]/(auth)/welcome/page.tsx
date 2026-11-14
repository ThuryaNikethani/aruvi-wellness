import { ConsentType } from "@prisma/client";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/database/prisma";
import { WelcomeForm } from "@/components/auth/welcome-form";

/** One-time step for accounts without a completed profile, e.g. the first Google sign-in. */
export default async function WelcomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const id = (await auth())?.user?.id;
  const user = id
    ? await prisma.user.findUnique({
        where: { id },
        select: {
          preferences: { select: { birthYear: true } },
          consents: { where: { type: ConsentType.HEALTH_DATA, granted: true }, select: { id: true }, take: 1 },
        },
      })
    : null;
  if (!user) return redirect({ href: "/sign-in", locale });
  if (user.preferences?.birthYear) return redirect({ href: "/dashboard", locale });
  return <WelcomeForm needsConsent={user.consents.length === 0} />;
}
