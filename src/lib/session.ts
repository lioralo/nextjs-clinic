import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";

import { authOptions } from "./auth";

export type SessionUser = {
  id: string;
  username?: string;
  role?: string;
};

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

  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
  if (!cookieHeader || !process.env.NEXTAUTH_SECRET) return null;

  const token = await getToken({
    req: {
      headers: { cookie: cookieHeader },
      cookies: Object.fromEntries(
        cookieStore.getAll().map((cookie) => [cookie.name, cookie.value])
      ),
    } as Parameters<typeof getToken>[0] extends { req?: infer R } ? R : never,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const id = typeof token?.id === "string" ? token.id : token?.sub;
  if (!id) return null;

  return {
    id,
    username: typeof token?.username === "string" ? token.username : undefined,
    role: typeof token?.role === "string" ? token.role : undefined,
  };
}
