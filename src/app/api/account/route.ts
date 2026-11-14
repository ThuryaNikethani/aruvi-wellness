import { prisma } from "@/lib/database/prisma";
import { handle, json, parseJson, requireUserId } from "@/lib/api";
import { deleteAccountSchema } from "@/lib/validation/schemas";

/** Permanently deletes the account. Every related record is removed by cascade. */
export const DELETE = handle(async (req) => {
  const userId = await requireUserId();
  await parseJson(req, deleteAccountSchema);
  await prisma.user.delete({ where: { id: userId } });
  return json({ ok: true });
}, { limit: 3 });
