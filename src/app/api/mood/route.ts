import { prisma } from "@/lib/database/prisma";
import { handle, json, parseJson, parseQuery, requireUserId } from "@/lib/api";
import { moodEntrySchema, rangeQuerySchema } from "@/lib/validation/schemas";

export const GET = handle(async (req) => {
  const userId = await requireUserId();
  const { days, limit } = parseQuery(req, rangeQuerySchema);
  const since = new Date(Date.now() - days * 86_400_000);
  const entries = await prisma.moodEntry.findMany({
    where: { userId, recordedAt: { gte: since } },
    orderBy: { recordedAt: "desc" },
    take: limit,
  });
  return json({ entries });
});

export const POST = handle(async (req) => {
  const userId = await requireUserId();
  const data = await parseJson(req, moodEntrySchema);
  const entry = await prisma.moodEntry.create({ data: { ...data, userId } });
  return json({ entry }, 201);
}, { limit: 30 });
