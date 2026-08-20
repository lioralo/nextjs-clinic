import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const staffPrefixes = [
  "/patients",
  "/calendar",
  "/cancel-requests",
  "/messages",
  "/groups",
  "/resources",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const parts = pathname.split("/");
  const locale = parts[1];

  if (locale !== "he" && locale !== "en") {
    return NextResponse.next();
  }

  if (
    pathname === `/${locale}/login` ||
    pathname.startsWith(`/${locale}/login`) ||
    pathname.startsWith(`/${locale}/api/auth`) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/resources")
  ) {
    return NextResponse.next();
  }

  const isStaff =
    pathname === `/${locale}` ||
    pathname === `/${locale}/` ||
    staffPrefixes.some((p) => pathname.startsWith(`/${locale}${p}`));
  const isPatient = pathname.startsWith(`/${locale}/patient`);

  if (!isStaff && !isPatient) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const userId =
    (typeof token?.id === "string" && token.id) ||
    (typeof token?.sub === "string" && token.sub) ||
    null;
  const role = typeof token?.role === "string" ? token.role : null;

  if (!userId) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  if (isPatient && role !== "PATIENT") {
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  if (isStaff && role === "PATIENT") {
    return NextResponse.redirect(new URL(`/${locale}/patient`, req.url));
  }

  return NextResponse.next();
}
