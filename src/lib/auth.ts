import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "./prisma";
import { verifyUserSecondFactor } from "./totp-service";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim();
        const password = credentials?.password;
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !user.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        const second = await verifyUserSecondFactor({
          totpEnabled: user.totpEnabled,
          totpSecret: user.totpSecret,
          totpRecoveryHashes: user.totpRecoveryHashes,
          otp: String(credentials?.otp ?? ""),
          userId: user.id,
        });
        if (!second.ok) return null;

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
