"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

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
      username,
      password,
      otp,
      redirect: false,
    });
    if (!res?.ok) {
      setError(
        locale === "he"
          ? needsTotp
            ? "קוד אימות לא תקין."
            : "פרטי התחברות לא נכונים."
          : needsTotp
            ? "Invalid authentication code."
            : "Invalid username or password."
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

    if (!needsTotp) {
      const preflight = await fetch("/api/auth/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = (await preflight.json()) as {
        ok?: boolean;
        needsTotp?: boolean;
      };
      if (!result.ok) {
        setSubmitting(false);
        setError(
          locale === "he"
            ? "פרטי התחברות לא נכונים."
            : "Invalid username or password."
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
        {locale === "he" ? "התחברות" : "Login"}
      </h1>
      <p className="text-[var(--color-foreground)]/70 mb-4">
        {needsTotp
          ? locale === "he"
            ? "הזינו את קוד היישומון או קוד שחזור."
            : "Enter the authenticator or recovery code."
          : locale === "he"
            ? "היכנס/י למערכת עם שם משתמש וסיסמה."
            : "Sign in with your username and password."}
      </p>

      <form
        onSubmit={onSubmit}
        data-testid="login-form"
        className="rounded-2xl border p-4 border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1 text-sm">
          {locale === "he" ? "שם משתמש" : "Username"}
          <input
            name="username"
            className="rounded-xl border px-3 py-2 border-[var(--color-border)] bg-transparent outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            disabled={needsTotp}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {locale === "he" ? "סיסמה" : "Password"}
          <input
            name="password"
            type="password"
            className="rounded-xl border px-3 py-2 border-[var(--color-border)] bg-transparent outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={needsTotp}
          />
        </label>

        {needsTotp ? (
          <label className="flex flex-col gap-1 text-sm">
            {locale === "he" ? "קוד אימות" : "Authentication code"}
            <input
              name="otp"
              data-testid="otp-code"
              className="rounded-xl border px-3 py-2 border-[var(--color-border)] bg-transparent outline-none"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoComplete="one-time-code"
              inputMode="numeric"
            />
          </label>
        ) : null}

        {error ? (
          <div className="text-sm text-[var(--color-primary-dark)]">{error}</div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] py-2 px-3 font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {submitting
            ? locale === "he"
              ? "מתחבר..."
              : "Signing in..."
            : locale === "he"
              ? "התחבר"
              : "Sign in"}
        </button>
      </form>
    </>
  );
}
