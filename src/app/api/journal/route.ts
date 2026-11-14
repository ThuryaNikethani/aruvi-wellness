import { prisma } from "@/lib/database/prisma";
import { handle, json, parseJson, parseQuery, requireUserId } from "@/lib/api";
import { journalEntrySchema, rangeQuerySchema } from "@/lib/validation/schemas";

export const GET = handle(async (req) => {
  const userId = await requireUserId();
  const { days, limit } = parseQuery(req, rangeQuerySchema);
  const since = new Date(Date.now() - days * 86_400_000);
  const entries = await prisma.journalEntry.findMany({
    where: { userId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return json({ entries });
});

export const POST = handle(async (req) => {
  const userId = await requireUserId();
  const data = await parseJson(req, journalEntrySchema);
  const entry = await prisma.journalEntry.create({ data: { ...data, userId } });
  return json({ entry }, 201);
}, { limit: 30 });
