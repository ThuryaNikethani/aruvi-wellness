import { prisma } from "@/lib/database/prisma";
import { ApiError, handle, json, parseJson } from "@/lib/api";
import { verifyPassword } from "@/lib/auth/password";
import { issueMobileToken } from "@/lib/auth/mobile-token";
import { signInSchema } from "@/lib/validation/schemas";

/** Mobile sign-in: exchanges email + password for a 30-day bearer token. */
export const POST = handle(
  async (req) => {
    const { email, password } = await parseJson(req, signInSchema);
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, passwordHash: true } });
    const ok = await verifyPassword(user?.passwordHash, password);
    if (!user || !ok) throw new ApiError(401, "invalid_credentials");
    const token = await issueMobileToken(user.id);
    return json({ token, user: { id: user.id, name: user.name, email: user.email } });
  },
  { limit: 10, windowMs: 15 * 60_000, cookieless: true },
);
