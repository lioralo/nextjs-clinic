import { getServerSession } from "next-auth";

import { authOptions } from "./auth";

export type SessionUser = {
  id: string;
  username?: string;
  role?: string;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { id?: string; username?: string; role?: string }
    | undefined;

  if (!user?.id) return null;

  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
}
