import { NextRequest, NextResponse } from "next/server";

import {
  applyCalendarIntent,
  calendarPath,
} from "@/lib/calendar-mutations";
import { getSessionUserFromRequest } from "@/lib/session";

export async function GET() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const locale = String(formData.get("locale") ?? "he");
  const ajax = String(formData.get("ajax") ?? "") === "1";

  const user = await getSessionUserFromRequest(req);

  if (!user) {
    if (ajax) {
      return NextResponse.json({ ok: false, error: "unauthorized" });
    }
    return NextResponse.redirect(
      new URL(calendarPath(locale, { error: "unauthorized" }), req.url),
      303
    );
  }

  const result = await applyCalendarIntent(user.id, formData);

  if (ajax) {
    return NextResponse.json(result);
  }

  if (result.ok && result.token) {
    return NextResponse.redirect(
      new URL(calendarPath(locale, { bookLink: result.token }), req.url),
      303
    );
  }

  if (result.ok) {
    return NextResponse.redirect(new URL(calendarPath(locale), req.url), 303);
  }

  return NextResponse.redirect(
    new URL(calendarPath(locale, { error: result.error }), req.url),
    303
  );
}
