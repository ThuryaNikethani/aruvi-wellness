import { handle, json, parseJson } from "@/lib/api";
import { registerUser } from "@/lib/auth/register";
import { registerSchema } from "@/lib/validation/schemas";

/** Mobile sign-up. Same generic response as the web; the app then calls /api/mobile/auth/login. */
export const POST = handle(
  async (req) => {
    const data = await parseJson(req, registerSchema);
    await registerUser(data, process.env.AUTH_URL ?? new URL(req.url).origin);
    return json({ ok: true }, 201);
  },
  { limit: 5, windowMs: 15 * 60_000, cookieless: true },
);
