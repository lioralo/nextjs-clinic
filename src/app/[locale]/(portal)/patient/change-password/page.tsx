import { redirect } from "next/navigation";

import { changePasswordAction } from "@/app/[locale]/(portal)/patient/actions";
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
      <h1 className="text-2xl font-semibold mb-2">
        {t(locale, "Change password", "שינוי סיסמה")}
      </h1>
      {query.error === "weak" ? (
        <p className="mb-3 text-sm text-[var(--color-primary-dark)]">
          {t(locale, "Use at least 8 characters.", "יש להשתמש ב-8 תווים לפחות.")}
        </p>
      ) : null}
      <form action={change} className="flex flex-col gap-3">
        <input
          type="password"
          name="password"
          required
          minLength={8}
          data-testid="new-password"
          className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
        >
          {t(locale, "Save password", "שמור סיסמה")}
        </button>
      </form>
    </div>
  );
}
