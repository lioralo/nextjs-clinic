import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export type PreflightError = "empty" | "credentials" | "unseeded" | "server";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      username?: string;
      password?: string;
    } | null;
    const username = body?.username?.trim();
    const password = body?.password ?? "";
    if (!username || !password) {
      return NextResponse.json({ ok: false, error: "empty" satisfies PreflightError });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) {
      const staffCount = await prisma.user.count({
        where: { role: { in: ["ADMIN", "CLINICIAN"] } },
      });
      return NextResponse.json({
        ok: false,
        error: (staffCount === 0 ? "unseeded" : "credentials") satisfies PreflightError,
      });
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return NextResponse.json({
        ok: false,
        error: "credentials" satisfies PreflightError,
      });
    }
    return NextResponse.json({ ok: true, needsTotp: Boolean(user.totpEnabled) });
  } catch (error) {
    console.error("[auth preflight]", error);
    return NextResponse.json(
      { ok: false, error: "server" satisfies PreflightError },
      { status: 503 }
    );
  }
}
