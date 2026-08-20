import { ClinicBrand } from "@/components/clinic-brand";
import { LoginForm } from "@/components/login-form";
import { clinicTagline } from "@/lib/brand";
import { t } from "@/lib/copy";
import { normalizeLocale } from "@/lib/locale";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = normalizeLocale(raw) ?? "he";
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === "PATIENT" ? `/${locale}/patient` : `/${locale}`);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-stretch gap-4 py-6" data-testid="login-page">
      <div className="flex justify-center">
        <ClinicBrand
          locale={locale}
          href={`/${locale}/login`}
          size="lg"
          showName={false}
          preload
        />
      </div>
      <p className="text-center text-[var(--color-foreground)]/70">
        {clinicTagline(locale)}
      </p>
      <p className="sr-only">
        {t(locale, "Sign in to the clinic", "כניסה למערכת הקליניקה")}
      </p>
      <LoginForm locale={locale} />
    </div>
  );
}
