import Link from "next/link";
import React from "react";

import { LogoutButton } from "@/components/logout-button";

export default function AppShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: "en" | "he";
}) {
  const otherLocale = locale === "he" ? "en" : "he";

  return (
    <div className="min-h-screen w-full bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="flex min-h-screen w-full">
        <aside
          data-testid="clinic-sidebar"
          className="hidden w-72 shrink-0 border border-transparent bg-[var(--color-surface)] md:block"
          style={{
            borderInlineEnd: "1px solid var(--color-border)",
          }}
        >
          <div className="p-5">
            <div className="text-lg font-semibold mb-4">Clinic</div>
            <nav className="flex flex-col gap-2">
              <Link
                className="rounded-xl px-3 py-2 hover:bg-[var(--color-primary-container)] hover:text-[var(--color-primary)]"
                href={`/${locale}`}
              >
                {locale === "he" ? "לוח בקרה" : "Dashboard"}
              </Link>
              <Link
                className="rounded-xl px-3 py-2 hover:bg-[var(--color-primary-container)] hover:text-[var(--color-primary)]"
                href={`/${locale}/patients`}
              >
                {locale === "he" ? "מטופלים" : "Patients"}
              </Link>
              <Link
                className="rounded-xl px-3 py-2 hover:bg-[var(--color-primary-container)] hover:text-[var(--color-primary)]"
                href={`/${locale}/calendar`}
              >
                {locale === "he" ? "יומן" : "Calendar"}
              </Link>
              <Link
                className="rounded-xl px-3 py-2 hover:bg-[var(--color-primary-container)] hover:text-[var(--color-primary)]"
                href={`/${locale}/cancel-requests`}
              >
                {locale === "he" ? "בקשות ביטול" : "Cancel requests"}
              </Link>
              <Link
                className="rounded-xl px-3 py-2 hover:bg-[var(--color-primary-container)] hover:text-[var(--color-primary)]"
                href={`/${locale}/messages`}
              >
                {locale === "he" ? "הודעות" : "Messages"}
              </Link>
              <Link
                className="rounded-xl px-3 py-2 hover:bg-[var(--color-primary-container)] hover:text-[var(--color-primary)]"
                href={`/${locale}/groups`}
              >
                {locale === "he" ? "קבוצות" : "Groups"}
              </Link>
              <Link
                className="rounded-xl px-3 py-2 hover:bg-[var(--color-primary-container)] hover:text-[var(--color-primary)]"
                href={`/${locale}/resources`}
              >
                {locale === "he" ? "משאבים" : "Resources"}
              </Link>
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="flex items-center justify-between gap-3 px-4 py-3 border-b"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <div className="min-w-0">
              <div className="text-sm text-[var(--color-foreground)]/70">
                {locale === "he" ? "ברוך הבא" : "Welcome"}
              </div>
              <div className="text-lg font-semibold">Clinic</div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/${otherLocale}`}
                className="rounded-full px-3 py-1.5 text-sm border"
                style={{
                  borderColor: "var(--color-border)",
                }}
              >
                {otherLocale === "he" ? "עברית" : "EN"}
              </a>
              <LogoutButton
                locale={locale}
                label={locale === "he" ? "התנתק" : "Log out"}
              />
            </div>
          </header>

          <main className="flex-1 p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}

