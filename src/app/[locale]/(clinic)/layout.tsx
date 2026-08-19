import AppShell from "@/components/app-shell";
import { normalizeLocale } from "@/lib/locale";

export default async function ClinicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale) ?? "he";
  return <AppShell locale={locale}>{children}</AppShell>;
}
