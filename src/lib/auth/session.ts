import { cache } from "react";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/database/prisma";

// The dashboard layout and each page both ask for the user: fetch once per request.
const loadUser = cache((id: string) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, emailVerified: true, preferences: true },
  }),
);

/**
 * For server pages: returns the signed-in user, or redirects to sign-in.
 * Accounts without a completed profile (e.g. first Google sign-in) go to /welcome first.
 */
export async function requirePageUser(locale: string) {
  const session = await auth();
  const id = session?.user?.id;
  const user = id ? await loadUser(id) : null;
  if (!user) return redirect({ href: "/sign-in", locale });
  if (!user.preferences?.birthYear) return redirect({ href: "/welcome", locale });
  return user;
}
