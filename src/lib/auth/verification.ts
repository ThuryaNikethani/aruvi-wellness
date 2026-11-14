import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/database/prisma";

const TTL_MS = 24 * 60 * 60 * 1000;

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

/** Creates a one-time email verification token (only its hash is stored). */
export async function createVerificationToken(email: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: { identifier: email, token: sha256(token), expires: new Date(Date.now() + TTL_MS) },
  });
  return token;
}

export async function consumeVerificationToken(email: string, token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token: sha256(token) } },
  });
  if (!record) return false;
  await prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token: record.token } } });
  if (record.expires < new Date()) return false;
  await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  return true;
}

/**
 * Sends the verification link with Resend when RESEND_API_KEY is set.
 * In development without a key, the link is printed to the server console instead.
 */
export async function sendVerificationEmail(email: string, token: string, origin: string, locale: string) {
  const url = `${origin}/api/auth/verify?email=${encodeURIComponent(email)}&token=${token}&locale=${locale}`;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") console.info(`[dev] Verify email: ${url}`);
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "ARUVI <hello@aruvi.app>",
      to: email,
      subject: "Confirm your ARUVI email",
      text: `Welcome to ARUVI.\n\nPlease confirm your email by opening this link (valid for 24 hours):\n${url}\n\nIf you didn't create an account, you can ignore this message.`,
    }),
  });
}
