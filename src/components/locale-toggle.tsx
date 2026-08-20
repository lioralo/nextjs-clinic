"use client";

import { usePathname } from "next/navigation";

import { t } from "@/lib/copy";
import { otherLocale, type AppLocale } from "@/lib/locale";

export function LocaleToggle({ locale }: { locale: AppLocale }) {
  const pathname = usePathname() || `/${locale}`;
  const next = otherLocale(locale);
  const href = pathname.replace(/^\/(he|en)(?=\/|$)/, `/${next}`) || `/${next}`;

  return (
    <a
      href={href}
      data-testid="locale-toggle"
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--color-border)] px-3 text-sm font-medium"
      hrefLang={next}
      lang={next}
    >
      {next === "he" ? "עברית" : "EN"}
      <span className="sr-only">
        {t(locale, "Switch language", "החלפת שפה")}
      </span>
    </a>
  );
}
