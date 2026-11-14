import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/database/prisma";

/** For server pages: returns the signed-in user, or redirects to sign-in. */
export async function requirePageUser(locale: string) {
  const session = await auth();
  const id = session?.user?.id;
  const user = id
    ? await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, emailVerified: true, preferences: true },
      })
    : null;
  if (!user) return redirect({ href: "/sign-in", locale });
  return user;
}
