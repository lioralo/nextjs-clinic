import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "./prisma";
import { verifyUserSecondFactor } from "./totp-service";

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
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        const username = credentials?.username;
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
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.patientId = user.patientId ?? null;
        token.forcePasswordChange = Boolean(user.forcePasswordChange);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : session.user.id;
        session.user.username =
          typeof token.username === "string" ? token.username : "";
        session.user.role = typeof token.role === "string" ? token.role : "";
        session.user.patientId =
          typeof token.patientId === "string" ? token.patientId : null;
        session.user.forcePasswordChange = Boolean(token.forcePasswordChange);
      }
      return session;
    },
  },
};
