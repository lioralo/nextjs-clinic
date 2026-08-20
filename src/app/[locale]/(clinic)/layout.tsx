import { redirect } from "next/navigation";

import AppShell from "@/components/app-shell";
import { normalizeLocale } from "@/lib/locale";
import { getSessionUser } from "@/lib/session";

export default async function ClinicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale) ?? "he";
  const user = await getSessionUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }
  if (user.role === "PATIENT") {
    redirect(`/${locale}/patient`);
  }
  return <AppShell locale={locale}>{children}</AppShell>;
}
