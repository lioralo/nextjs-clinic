import { redirect } from "next/navigation";

import { changePasswordAction } from "@/app/[locale]/(portal)/patient/actions";
import { ClinicBrand } from "@/components/clinic-brand";
import { t } from "@/lib/copy";
import { getPortalPatient } from "@/lib/portal-service";
import { getSessionUser } from "@/lib/session";

export default async function ChangePasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "en" | "he" }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  const portal = await getPortalPatient(user.id);
  if (!portal) redirect(`/${locale}/login`);
  const change = changePasswordAction.bind(null, locale);

  return (
    <div className="mx-auto max-w-md">
      <ClinicBrand locale={locale} href={`/${locale}/patient`} size="md" />
      <h1 className="mt-4 text-2xl font-semibold mb-2">
        {t(locale, "Change password", "שינוי סיסמה")}
      </h1>
      {query.error === "weak" ? (
        <p className="mb-3 text-sm text-[var(--color-primary-dark)]" role="alert">
          {t(locale, "Use at least 8 characters.", "יש להשתמש ב-8 תווים לפחות.")}
        </p>
      ) : null}
      <form action={change} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm" htmlFor="new-password">
          {t(locale, "New password", "סיסמה חדשה")}
          <input
            id="new-password"
            type="password"
            name="password"
            required
            minLength={8}
            dir="ltr"
            data-testid="new-password"
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
        </label>
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
        >
          {t(locale, "Save password", "שמירת סיסמה")}
        </button>
      </form>
    </div>
  );
}
