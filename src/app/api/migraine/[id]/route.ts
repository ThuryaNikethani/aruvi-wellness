import { prisma } from "@/lib/database/prisma";
import { ApiError, handle, json, requireUserId, type IdParams } from "@/lib/api";

export const GET = handle(async (_req, { params }: IdParams) => {
  const userId = await requireUserId();
  const { id } = await params;
  const episode = await prisma.migraineEpisode.findFirst({
    where: { id, userId },
    include: { symptoms: true, triggers: true },
  });
  if (!episode) throw new ApiError(404, "not_found");
  return json({ episode });
});

export const DELETE = handle(async (_req, { params }: IdParams) => {
  const userId = await requireUserId();
  const { id } = await params;
  const { count } = await prisma.migraineEpisode.deleteMany({ where: { id, userId } });
  if (!count) throw new ApiError(404, "not_found");
  return json({ ok: true });
});
