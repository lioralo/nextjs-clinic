import type { ReactNode } from "react";

import { ClinicBrand } from "@/components/clinic-brand";
import { LocaleToggle } from "@/components/locale-toggle";
import { SiteFooter } from "@/components/site-footer";
import { SkipLink } from "@/components/skip-link";
import { t } from "@/lib/copy";
import { normalizeLocale } from "@/lib/locale";

export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw) ?? "he";
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
      <SkipLink locale={locale} />
      <header
        role="banner"
        className="px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
        style={{ borderBlockEnd: "1px solid var(--color-border)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ClinicBrand locale={locale} href={`/${locale}/login`} />
          <nav
            className="flex flex-wrap items-center justify-end gap-2"
            aria-label={t(locale, "Public navigation", "ניווט ציבורי")}
          >
            <a
              href={`/${locale}/contact`}
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium hover:bg-[var(--nav-hover-bg)]"
            >
              {t(locale, "Contact", "צור קשר")}
            </a>
            <a
              href={`/${locale}/login`}
              className="inline-flex min-h-11 items-center rounded-xl bg-[var(--color-primary)] px-3 text-sm font-semibold text-[var(--color-surface)]"
            >
              {t(locale, "Sign in", "כניסה")}
            </a>
            <LocaleToggle locale={locale} />
          </nav>
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
