import { prisma } from "@/lib/database/prisma";
import { handle, json, parseJson, requireUserId } from "@/lib/api";
import { preferencesSchema } from "@/lib/validation/schemas";

export const GET = handle(async () => {
  const userId = await requireUserId();
  const preferences = await prisma.userPreferences.upsert({ where: { userId }, create: { userId }, update: {} });
  return json({ preferences });
});

export const PATCH = handle(async (req) => {
  const userId = await requireUserId();
  const data = await parseJson(req, preferencesSchema);
  const preferences = await prisma.userPreferences.upsert({
    where: { userId },
    create: { ...data, userId },
    update: data,
  });
  return json({ preferences });
});
