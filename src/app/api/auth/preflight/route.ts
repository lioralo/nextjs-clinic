import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

const preflightAttempts = new Map<string, number[]>();

function tooManyPreflightAttempts(key: string, now = Date.now()) {
  const windowStart = now - 60_000;
  const recent = (preflightAttempts.get(key) ?? []).filter(
    (stamp) => stamp > windowStart
  );
  if (recent.length >= 10) {
    preflightAttempts.set(key, recent);
    return true;
  }
  recent.push(now);
  preflightAttempts.set(key, recent);
  return false;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;
  const username = body?.username?.trim();
  const password = body?.password ?? "";
  if (!username || !password) {
    return NextResponse.json({ ok: false });
  }

  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = `${forwarded || "local"}:${username.toLowerCase()}`;
  if (tooManyPreflightAttempts(key)) {
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) {
    return NextResponse.json({ ok: false });
  }
  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return NextResponse.json({ ok: false });
  }
  return NextResponse.json({ ok: true, needsTotp: Boolean(user.totpEnabled) });
}
