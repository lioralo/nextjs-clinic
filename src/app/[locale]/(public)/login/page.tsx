import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { normalizeLocale } from "@/lib/locale";
import { getSessionUser } from "@/lib/session";

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
    <div className="mx-auto max-w-md" data-testid="login-page">
      <LoginForm locale={locale} />
    </div>
  );
}
