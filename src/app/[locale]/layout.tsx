import React from "react";
import { notFound } from "next/navigation";
import SessionProviderWrapper from "@/components/session-provider";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;

  const locale =
    resolvedParams.locale === "he"
      ? "he"
      : resolvedParams.locale === "en"
        ? "en"
        : null;
  if (!locale) notFound();

  const dir = locale === "he" ? "rtl" : "ltr";

  return (
    <SessionProviderWrapper>
      <div dir={dir} lang={locale}>
        {children}
      </div>
    </SessionProviderWrapper>
  );
}
