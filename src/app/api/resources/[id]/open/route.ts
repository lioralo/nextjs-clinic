import { NextRequest, NextResponse } from "next/server";

import { canAccessResource } from "@/lib/resource-service";
import { getSessionUserFromRequest } from "@/lib/session";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const user = await getSessionUserFromRequest(req);
  const access = await canAccessResource({
    resourceId: id,
    action: "view",
    user,
  });
  if (!access.ok) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return NextResponse.redirect(access.resource.url);
}
