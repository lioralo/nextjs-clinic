import type { Metadata } from "next";
import React from "react";
import { notFound } from "next/navigation";

import SessionProviderWrapper from "@/components/session-provider";
import { clinicDescription, clinicName } from "@/lib/brand";
import { localeToDir, normalizeLocale } from "@/lib/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}): Promise<Metadata> {
  const resolved = await params;
  const locale = normalizeLocale(resolved.locale) ?? "he";
  return {
    title: clinicName(locale),
    description: clinicDescription(locale),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = normalizeLocale(resolvedParams.locale);
  if (!locale) notFound();

  return (
    <SessionProviderWrapper>
      <div dir={localeToDir(locale)} lang={locale}>
        {children}
      </div>
    </SessionProviderWrapper>
  );
}
