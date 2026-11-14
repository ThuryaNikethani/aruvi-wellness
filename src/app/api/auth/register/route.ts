import { handle, json, parseJson } from "@/lib/api";
import { registerUser } from "@/lib/auth/register";
import { registerSchema } from "@/lib/validation/schemas";

export const POST = handle(
  async (req) => {
    const data = await parseJson(req, registerSchema);
    await registerUser(data, new URL(req.url).origin);
    return json({ ok: true }, 201);
  },
  { limit: 5, windowMs: 15 * 60_000 },
);
