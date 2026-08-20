import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username;
        const password = credentials?.password;
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !user.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          username: user.username,
          role: user.role,
          patientId: user.patientId,
          forcePasswordChange: user.forcePasswordChange,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as {
          id: string;
          username: string;
          role: string;
          patientId?: string | null;
          forcePasswordChange?: boolean;
        };
        token.id = u.id;
        token.username = u.username;
        token.role = u.role;
        token.patientId = u.patientId ?? null;
        token.forcePasswordChange = Boolean(u.forcePasswordChange);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id;
        (session.user as any).username = (token as any).username;
        (session.user as any).role = (token as any).role;
        (session.user as any).patientId = (token as any).patientId ?? null;
        (session.user as any).forcePasswordChange = Boolean(
          (token as any).forcePasswordChange
        );
      }
      return session;
    },
  },
};

