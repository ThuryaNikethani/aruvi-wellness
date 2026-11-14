import { prisma } from "@/lib/database/prisma";
import { handle, json, requireUserId } from "@/lib/api";

export const GET = handle(async () => {
  const userId = await requireUserId();
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, updatedAt: true },
  });
  return json({ conversations });
});

/** Deletes every stored conversation. */
export const DELETE = handle(async () => {
  const userId = await requireUserId();
  await prisma.conversation.deleteMany({ where: { userId } });
  return json({ ok: true });
});
