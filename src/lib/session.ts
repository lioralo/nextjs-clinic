import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

import { authOptions } from "./auth";

export type SessionUser = {
  id: string;
  username?: string;
  role?: string;
};

function userFromToken(token: {
  id?: unknown;
  sub?: unknown;
  username?: unknown;
  role?: unknown;
} | null): SessionUser | null {
  const id = typeof token?.id === "string" ? token.id : token?.sub;
  if (typeof id !== "string" || !id) return null;
  return {
    id,
    username: typeof token?.username === "string" ? token.username : undefined,
    role: typeof token?.role === "string" ? token.role : undefined,
  };
}

export async function getSessionUserFromRequest(
  req: NextRequest
): Promise<SessionUser | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  const fromRequest = userFromToken(await getToken({ req, secret }));
  if (fromRequest) return fromRequest;

  const headerCookies: Record<string, string> = {};
  const cookieHeader = req.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const splitAt = trimmed.indexOf("=");
    if (splitAt === -1) continue;
    headerCookies[trimmed.slice(0, splitAt)] = decodeURIComponent(
      trimmed.slice(splitAt + 1)
    );
  }

  const token = await getToken({
    req: {
      headers: { cookie: cookieHeader },
      cookies: {
        ...headerCookies,
        getAll: () =>
          Object.entries(headerCookies).map(([name, value]) => ({ name, value })),
        get: (name: string) => headerCookies[name],
      },
    } as unknown as Parameters<typeof getToken>[0] extends { req?: infer R }
      ? R
      : never,
    secret,
  });
  return userFromToken(token);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { id?: string; username?: string; role?: string }
    | undefined;

  if (user?.id) {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  const all = cookieStore.getAll();
  const cookieHeader = all
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  if (!cookieHeader || !process.env.NEXTAUTH_SECRET) return null;

  const token = await getToken({
    req: {
      headers: { cookie: cookieHeader },
      cookies: {
        ...Object.fromEntries(all.map((cookie) => [cookie.name, cookie.value])),
        getAll: () => all,
        get: (name: string) => all.find((cookie) => cookie.name === name)?.value,
      },
    } as unknown as Parameters<typeof getToken>[0] extends { req?: infer R }
      ? R
      : never,
    secret: process.env.NEXTAUTH_SECRET,
  });
  return userFromToken(token);
}
