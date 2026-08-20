import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { normalizeLocale } from "@/lib/locale";
import { getPortalPatient } from "@/lib/portal-service";
import { getSessionUser } from "@/lib/session";

export default async function PortalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw) ?? "he";
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  if (user.role !== "PATIENT") redirect(`/${locale}`);

  const portal = await getPortalPatient(user.id);
  if (!portal) redirect(`/${locale}/login`);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div>
          <div className="text-sm text-[var(--color-foreground)]/70">
            {locale === "he" ? "פורטל מטופל" : "Patient portal"}
          </div>
          <div className="text-lg font-semibold">
            {portal.patient.firstName} {portal.patient.lastName}
          </div>
        </div>
        <LogoutButton
          locale={locale}
          label={locale === "he" ? "התנתק" : "Log out"}
        />
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
