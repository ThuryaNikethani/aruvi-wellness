import { prisma } from "@/lib/database/prisma";
import { handle, json, requireUserId } from "@/lib/api";

/** The signed-in user and their preferences (used by the mobile app on launch). */
export const GET = handle(async () => {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, emailVerified: true, preferences: true },
  });
  return json({ user });
});
