import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { handle, json, parseJson, requireUserId } from "@/lib/api";

const calmSessionSchema = z.object({
  activity: z.string().regex(/^[a-z0-9_]{2,40}$/),
  durationSec: z.number().int().min(0).max(4 * 3600),
  completed: z.boolean().default(false),
});

export const POST = handle(async (req) => {
  const userId = await requireUserId();
  const data = await parseJson(req, calmSessionSchema);
  const session = await prisma.calmSession.create({ data: { ...data, userId } });
  return json({ session }, 201);
}, { limit: 30 });
