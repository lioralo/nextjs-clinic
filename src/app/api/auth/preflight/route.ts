import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

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
