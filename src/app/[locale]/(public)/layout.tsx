import { t } from "@/lib/copy";
import { normalizeLocale } from "@/lib/locale";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw) ?? "he";
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header
        className="px-4 py-3"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between">
          <a href={`/${locale}/login`} className="text-lg font-semibold">
            Clinic
          </a>
          <a href={`/${locale}/contact`} className="text-sm hover:underline">
            {t(locale, "Contact", "צור קשר")}
          </a>
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
