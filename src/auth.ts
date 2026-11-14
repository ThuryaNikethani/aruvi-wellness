import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/database/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signInSchema } from "@/lib/validation/schemas";

const providers: Provider[] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = signInSchema.safeParse(raw);
      if (!parsed.success) return null;
      const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      // verifyPassword always runs, so unknown emails take the same time as wrong passwords.
      const ok = await verifyPassword(user?.passwordHash, parsed.data.password);
      if (!user || !ok) return null;
      return { id: user.id, name: user.name, email: user.email };
    },
  }),
];

// Google sign-in is optional: enabled only when credentials are configured.
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) providers.push(Google);

export const googleEnabled = providers.length > 1;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  providers,
  pages: { signIn: "/en/sign-in" },
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
