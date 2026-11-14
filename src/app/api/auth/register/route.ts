import { ConsentType } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { handle, json, parseJson } from "@/lib/api";
import { hashPassword } from "@/lib/auth/password";
import { createVerificationToken, sendVerificationEmail } from "@/lib/auth/verification";
import { registerSchema } from "@/lib/validation/schemas";

const CONSENT_VERSION = "2026-11";

export const POST = handle(
  async (req) => {
    const data = await parseJson(req, registerSchema);

    // Same response whether or not the email exists, so accounts can't be discovered.
    const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
    if (!existing) {
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
      await sendVerificationEmail(data.email, token, new URL(req.url).origin, data.locale);
    }
    return json({ ok: true }, 201);
  },
  { limit: 5, windowMs: 15 * 60_000 },
);
