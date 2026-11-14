import { ConsentType } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createVerificationToken, sendVerificationEmail } from "@/lib/auth/verification";
import type { registerSchema } from "@/lib/validation/schemas";

const CONSENT_VERSION = "2026-11";

/**
 * Creates the account if the email is new. Does nothing otherwise, so callers
 * can answer the same way either way and accounts can't be discovered.
 */
export async function registerUser(data: z.infer<typeof registerSchema>, origin: string) {
  const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (existing) return;
  await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: await hashPassword(data.password),
      preferences: { create: { locale: data.locale } },
      consents: {
        create: [
          { type: ConsentType.TERMS, version: CONSENT_VERSION, granted: true },
          { type: ConsentType.PRIVACY, version: CONSENT_VERSION, granted: true },
          { type: ConsentType.HEALTH_DATA, version: CONSENT_VERSION, granted: true },
        ],
      },
    },
  });
  const token = await createVerificationToken(data.email);
  await sendVerificationEmail(data.email, token, origin, data.locale);
}
