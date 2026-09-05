import { randomBytes } from "node:crypto";

type PortalGrant = {
  username: string;
  tempPassword: string;
  expiresAt: number;
};

const grants = new Map<string, PortalGrant>();

export function stashPortalGrant(username: string, tempPassword: string) {
  const token = randomBytes(18).toString("base64url");
  grants.set(token, {
    username,
    tempPassword,
    expiresAt: Date.now() + 5 * 60_000,
  });
  return token;
}

export function consumePortalGrant(token: string | undefined | null) {
  if (!token) return null;
  const entry = grants.get(token);
  grants.delete(token);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return { username: entry.username, tempPassword: entry.tempPassword };
}
