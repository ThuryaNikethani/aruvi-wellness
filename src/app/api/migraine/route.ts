import { prisma } from "@/lib/database/prisma";
import { handle, json, parseJson, parseQuery, requireUserId } from "@/lib/api";
import { migraineEpisodeSchema, rangeQuerySchema } from "@/lib/validation/schemas";

export const GET = handle(async (req) => {
  const userId = await requireUserId();
  const { days, limit } = parseQuery(req, rangeQuerySchema);
  const since = new Date(Date.now() - days * 86_400_000);
  const episodes = await prisma.migraineEpisode.findMany({
    where: { userId, startedAt: { gte: since } },
    orderBy: { startedAt: "desc" },
    take: limit,
    include: { symptoms: true, triggers: true },
  });
  return json({ episodes });
});

export const POST = handle(async (req) => {
  const userId = await requireUserId();
  const { symptoms, triggers, ...data } = await parseJson(req, migraineEpisodeSchema);
  const episode = await prisma.migraineEpisode.create({
    data: {
      ...data,
      userId,
      symptoms: { create: [...new Set(symptoms)].map((symptom) => ({ symptom })) },
      triggers: {
        create: [...new Map(triggers.map((t) => [t.category, t])).values()].map((t) => ({
          category: t.category,
          note: t.note,
        })),
      },
    },
    include: { symptoms: true, triggers: true },
  });
  return json({ episode }, 201);
}, { limit: 30 });
