import { prisma } from "@/lib/database/prisma";
import { handle, json, parseJson, parseQuery, requireUserId } from "@/lib/api";
import { dateOnly, energyEntrySchema, rangeQuerySchema } from "@/lib/validation/schemas";

export const GET = handle(async (req) => {
  const userId = await requireUserId();
  const { days, limit } = parseQuery(req, rangeQuerySchema);
  const since = new Date(Date.now() - days * 86_400_000);
  const entries = await prisma.energyEntry.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "desc" },
    take: limit,
  });
  return json({ entries });
});

/** One energy record per day: saving again for the same date updates it. */
export const POST = handle(async (req) => {
  const userId = await requireUserId();
  const { date, ...data } = await parseJson(req, energyEntrySchema);
  const day = dateOnly(date);
  const entry = await prisma.energyEntry.upsert({
    where: { userId_date: { userId, date: day } },
    create: { ...data, date: day, userId },
    update: data,
  });
  return json({ entry }, 201);
}, { limit: 30 });
