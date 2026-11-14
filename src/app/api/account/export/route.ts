import { prisma } from "@/lib/database/prisma";
import { handle, json, requireUserId } from "@/lib/api";

/** Downloads everything ARUVI stores about the user as JSON. */
export const GET = handle(async () => {
  const userId = await requireUserId();
  const data = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      emailVerified: true,
      createdAt: true,
      preferences: true,
      consents: true,
      moodEntries: true,
      journalEntries: true,
      migraineEpisodes: { include: { symptoms: true, triggers: true } },
      sleepEntries: true,
      energyEntries: true,
      conversations: { include: { messages: true } },
      calmSessions: true,
    },
  });
  const stamp = new Date().toISOString().slice(0, 10);
  return json({ exportedAt: new Date().toISOString(), data }, 200, {
    "Content-Disposition": `attachment; filename="aruvi-export-${stamp}.json"`,
  });
}, { limit: 5 });
