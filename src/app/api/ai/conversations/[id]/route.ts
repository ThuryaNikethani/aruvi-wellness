import { prisma } from "@/lib/database/prisma";
import { ApiError, handle, json, requireUserId, type IdParams } from "@/lib/api";

export const GET = handle(async (_req, { params }: IdParams) => {
  const userId = await requireUserId();
  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: "asc" }, select: { id: true, role: true, content: true, createdAt: true } } },
  });
  if (!conversation) throw new ApiError(404, "not_found");
  return json({ conversation });
});

export const DELETE = handle(async (_req, { params }: IdParams) => {
  const userId = await requireUserId();
  const { id } = await params;
  const { count } = await prisma.conversation.deleteMany({ where: { id, userId } });
  if (!count) throw new ApiError(404, "not_found");
  return json({ ok: true });
});
