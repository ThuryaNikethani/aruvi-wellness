import { Concern, ConsentType } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { ApiError, handle, json, parseJson, requireUserId } from "@/lib/api";
import { consentRecords } from "@/lib/auth/register";
import { completeProfileSchema } from "@/lib/validation/schemas";

/** Completes the profile: birth year, what the person wants support with, and consent if missing. */
export const POST = handle(
  async (req) => {
    const userId = await requireUserId();
    const data = await parseJson(req, completeProfileSchema);

    const hasConsent = await prisma.userConsent.count({
      where: { userId, type: ConsentType.HEALTH_DATA, granted: true },
    });
    if (!hasConsent && !(data.acceptTerms && data.acceptHealthData)) throw new ApiError(400, "consent_required");

    const concerns = [...new Set(data.concerns)];
    const migraine = concerns.includes(Concern.MIGRAINE);
    const profile = {
      birthYear: data.birthYear,
      concerns,
      ...(migraine ? { trackMigraine: true } : {}),
      ...(data.trackMenstrual !== undefined ? { trackMenstrual: migraine && data.trackMenstrual } : {}),
    };

    await prisma.$transaction([
      prisma.userPreferences.upsert({
        where: { userId },
        create: { userId, ...(data.locale ? { locale: data.locale } : {}), ...profile },
        update: profile,
      }),
      ...(hasConsent ? [] : [prisma.userConsent.createMany({ data: consentRecords().map((c) => ({ ...c, userId })) })]),
    ]);
    return json({ ok: true });
  },
  { limit: 10, windowMs: 60_000 },
);
