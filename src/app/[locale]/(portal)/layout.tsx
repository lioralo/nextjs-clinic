import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { ClinicBrand } from "@/components/clinic-brand";
import { LocaleToggle } from "@/components/locale-toggle";
import { LogoutButton } from "@/components/logout-button";
import { SiteFooter } from "@/components/site-footer";
import { SkipLink } from "@/components/skip-link";
import { t } from "@/lib/copy";
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
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
      <SkipLink locale={locale} />
      <header
        role="banner"
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 pt-[max(0.5rem,env(safe-area-inset-top))]"
        style={{ borderBlockEnd: "1px solid var(--color-border)" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <ClinicBrand
            locale={locale}
            href={`/${locale}/patient`}
            showName={false}
          />
          <div className="min-w-0">
            <div className="text-sm text-[var(--color-foreground)]/70">
              {t(locale, "Patient portal", "פורטל מטופל")}
            </div>
            <div className="truncate text-lg font-semibold">
              <bdi>
                {portal.patient.firstName} {portal.patient.lastName}
              </bdi>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LocaleToggle locale={locale} />
          <LogoutButton
            locale={locale}
            label={t(locale, "Log out", "יציאה")}
          />
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] outline-none"
      >
        {children}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
