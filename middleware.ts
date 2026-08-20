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
  "/settings",
  "/inquiries",
];

function nextWithLocale(req: NextRequest, locale: string) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-locale", locale);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const parts = pathname.split("/");
  const locale = parts[1] === "en" || parts[1] === "he" ? parts[1] : "he";
  const pass = () => nextWithLocale(req, locale);

  if (parts[1] !== "he" && parts[1] !== "en") {
    return pass();
  }

  if (
    pathname === `/${locale}/login` ||
    pathname.startsWith(`/${locale}/login`) ||
    pathname.startsWith(`/${locale}/api/auth`) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/resources")
  ) {
    return pass();
  }

  const isStaff =
    pathname === `/${locale}` ||
    pathname === `/${locale}/` ||
    staffPrefixes.some((p) => pathname.startsWith(`/${locale}${p}`));
  const isPatient = pathname.startsWith(`/${locale}/patient`);

  if (!isStaff && !isPatient) return pass();

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

  return pass();
}
