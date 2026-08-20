"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";

import { ClinicBrand } from "@/components/clinic-brand";
import { LocaleToggle } from "@/components/locale-toggle";
import { LogoutButton } from "@/components/logout-button";
import { SiteFooter } from "@/components/site-footer";
import { SkipLink } from "@/components/skip-link";
import { clinicName } from "@/lib/brand";
import { clinicNav, isNavActive, pageTitleFromPath } from "@/lib/clinic-nav";
import { t } from "@/lib/copy";
import type { AppLocale } from "@/lib/locale";

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export default function AppShell({
  children,
  locale,
}: {
  children: ReactNode;
  locale: AppLocale;
}) {
  const pathname = usePathname() || `/${locale}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const navId = useId();
  const groups = clinicNav(locale);
  const title = pageTitleFromPath(locale, pathname);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("nav-open", menuOpen);
    return () => document.documentElement.classList.remove("nav-open");
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="min-h-screen w-full bg-[var(--color-background)] text-[var(--color-foreground)]">
      <SkipLink locale={locale} />
      <div className="flex min-h-screen w-full">
        {menuOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            aria-label={t(locale, "Close menu", "סגירת תפריט")}
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <aside
          id={navId}
          data-testid="clinic-sidebar"
          className={[
            "fixed start-0 inset-y-0 z-40 flex w-72 shrink-0 flex-col bg-[var(--color-surface)] transition-transform duration-300",
            "border-transparent md:static md:translate-x-0 md:rtl:translate-x-0",
            menuOpen
              ? "translate-x-0"
              : "-translate-x-full rtl:translate-x-full md:translate-x-0",
          ].join(" ")}
          style={{
            borderInlineEnd: "1px solid var(--color-border)",
            inlineSize: "var(--sidebar-width)",
          }}
        >
          <div className="flex items-center justify-between gap-2 p-5">
            <ClinicBrand locale={locale} href={`/${locale}`} />
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl md:hidden"
              onClick={() => setMenuOpen(false)}
              aria-label={t(locale, "Close menu", "סגירת תפריט")}
            >
              <CloseIcon />
            </button>
          </div>
          <nav
            className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-6"
            aria-label={t(locale, "Main navigation", "ניווט ראשי")}
          >
            {groups.map((group) => (
              <div key={group.id} className="flex flex-col gap-1">
                <div className="px-3 text-xs font-semibold text-[var(--color-foreground)]/55">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const active = isNavActive(
                    pathname,
                    item.href,
                    item.match ?? "prefix"
                  );
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "min-h-11 rounded-xl px-3 py-2 font-medium",
                        active
                          ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-fg)]"
                          : "hover:bg-[var(--nav-hover-bg)] hover:text-[var(--color-primary)]",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            role="banner"
            className="sticky top-0 z-20 flex min-h-[var(--admin-topbar-height)] flex-wrap items-center justify-between gap-3 bg-[var(--color-surface)]/90 px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur"
            style={{ borderBlockEnd: "1px solid var(--color-border)" }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                data-testid="open-menu"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl md:hidden"
                aria-expanded={menuOpen}
                aria-controls={navId}
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={
                  menuOpen
                    ? t(locale, "Close menu", "סגירת תפריט")
                    : t(locale, "Open menu", "פתיחת תפריט")
                }
              >
                <MenuIcon />
              </button>
              <div className="md:hidden">
                <ClinicBrand
                  locale={locale}
                  href={`/${locale}`}
                  size="sm"
                  showName={false}
                />
              </div>
              <div className="min-w-0">
                <div className="hidden text-sm text-[var(--color-foreground)]/70 sm:block">
                  {t(locale, "Hello", "שלום")}
                </div>
                <div className="truncate text-lg font-semibold">{title}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
      </div>
      <span className="sr-only">{clinicName(locale)}</span>
    </div>
  );
}
