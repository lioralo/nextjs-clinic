"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { t } from "@/lib/copy";
import type { AppLocale } from "@/lib/locale";

export function LoginForm({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function completeSignIn() {
    const res = await signIn("credentials", {
      username: username.trim(),
      password,
      otp,
      redirect: false,
    });
    if (!res?.ok) {
      setError(
        needsTotp
          ? t(locale, "The authentication code is incorrect.", "קוד האימות שגוי.")
          : t(
              locale,
              "Username or password is incorrect.",
              "שם המשתמש או הסיסמה שגויים."
            )
      );
      return false;
    }

    const sessionRes = await fetch("/api/auth/session");
    const session = (await sessionRes.json()) as {
      user?: { role?: string; forcePasswordChange?: boolean };
    };
    if (session.user?.role === "PATIENT") {
      router.push(
        session.user.forcePasswordChange
          ? `/${locale}/patient/change-password`
          : `/${locale}/patient`
      );
      return true;
    }
    router.push(`/${locale}`);
    return true;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const usernameTrimmed = username.trim();

    if (!needsTotp) {
      const preflight = await fetch("/api/auth/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameTrimmed, password }),
      });
      const result = (await preflight.json().catch(() => null)) as {
        ok?: boolean;
        needsTotp?: boolean;
      } | null;
      if (!result?.ok) {
        setSubmitting(false);
        setError(
          t(
            locale,
            "Username or password is incorrect.",
            "שם המשתמש או הסיסמה שגויים."
          )
        );
        return;
      }
      if (result.needsTotp) {
        setNeedsTotp(true);
        setSubmitting(false);
        return;
      }
    }

    await completeSignIn();
    setSubmitting(false);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold mb-2">
        {t(locale, "Sign in", "כניסה")}
      </h1>
      <p className="text-[var(--color-foreground)]/70 mb-4">
        {needsTotp
          ? t(
              locale,
              "Enter the authenticator or recovery code.",
              "יש להזין את קוד היישומון או קוד השחזור."
            )
          : t(
              locale,
              "Enter a username and password to continue.",
              "יש להזין שם משתמש וסיסמה כדי להמשיך."
            )}
      </p>

      <form
        onSubmit={onSubmit}
        data-testid="login-form"
        className="rounded-2xl border p-4 border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1 text-sm" htmlFor="username">
          {t(locale, "Username", "שם משתמש")}
          <input
            id="username"
            name="username"
            dir="auto"
            className="rounded-xl border px-3 py-2 border-[var(--color-border)] bg-transparent outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            disabled={needsTotp}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm" htmlFor="password">
          {t(locale, "Password", "סיסמה")}
          <input
            id="password"
            name="password"
            type="password"
            dir="ltr"
            className="rounded-xl border px-3 py-2 border-[var(--color-border)] bg-transparent outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={needsTotp}
          />
        </label>

        {needsTotp ? (
          <label className="flex flex-col gap-1 text-sm" htmlFor="otp">
            {t(locale, "Authentication code", "קוד אימות")}
            <input
              id="otp"
              name="otp"
              data-testid="otp-code"
              dir="ltr"
              className="rounded-xl border px-3 py-2 border-[var(--color-border)] bg-transparent outline-none"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoComplete="one-time-code"
              inputMode="numeric"
            />
          </label>
        ) : null}

        {error ? (
          <div role="alert" className="text-sm text-[var(--color-primary-dark)]">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] py-2 px-3 font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {submitting
            ? t(locale, "Signing in...", "מתחברים...")
            : t(locale, "Sign in", "התחבר")}
        </button>
      </form>
    </>
  );
}
