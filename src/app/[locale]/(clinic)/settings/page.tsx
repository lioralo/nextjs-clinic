import { TotpSetup } from "@/components/totp-setup";
import { t } from "@/lib/copy";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: "en" | "he" }>;
}) {
  const { locale } = await params;
  const session = await getSessionUser();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return null;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-1">
        {t(locale, "Settings", "הגדרות")}
      </h1>
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-semibold mb-2">
          {t(locale, "Two-factor authentication", "אימות דו-שלבי")}
        </h2>
        <TotpSetup
          locale={locale}
          enabled={user.totpEnabled}
          username={user.username}
        />
      </section>
    </div>
  );
}
