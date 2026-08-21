"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { t } from "@/lib/copy";
import type { AppLocale } from "@/lib/locale";

function loginMessage(locale: AppLocale, code: string) {
  switch (code) {
    case "empty":
      return t(
        locale,
        "Enter a username and password.",
        "יש להזין שם משתמש וסיסמה."
      );
    case "unseeded":
      return t(
        locale,
        "No staff account in the database. Stop the server, run npm run db:seed, then npm run dev. Use http://localhost:3000/he/login",
        "אין חשבון צוות במסד הנתונים. עצרו את השרת, הריצו npm run db:seed ואז npm run dev. היכנסו דרך http://localhost:3000/he/login"
      );
    case "server":
      return t(
        locale,
        "Could not reach the login service. Confirm npm run dev is running, then try again.",
        "לא ניתן להתחבר לשירות הכניסה. ודאו ש-npm run dev רץ, ונסו שוב."
      );
    case "session":
      return t(
        locale,
        "Password was accepted but the session cookie was not saved. Open http://localhost:3000 (not 127.0.0.1), check NEXTAUTH_SECRET in .env.local, and restart npm run dev.",
        "הסיסמה התקבלה אבל עוגיית ההתחברות לא נשמרה. פתחו http://localhost:3000 (לא 127.0.0.1), בדקו NEXTAUTH_SECRET ב-.env.local, והפעילו מחדש את npm run dev."
      );
    case "otp":
      return t(locale, "The authentication code is incorrect.", "קוד האימות שגוי.");
    default:
      return t(
        locale,
        "Username or password is incorrect.",
        "שם המשתמש או הסיסמה שגויים."
      );
  }
}

export function LoginForm({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function completeSignIn() {
    setStatus(t(locale, "Signing in…", "מתחברים…"));
    const res = await signIn("credentials", {
      username: username.trim(),
      password,
      otp,
      redirect: false,
    });
    if (!res?.ok) {
      setError(loginMessage(locale, needsTotp ? "otp" : "credentials"));
      return false;
    }

    const sessionRes = await fetch("/api/auth/session");
    const session = (await sessionRes.json().catch(() => null)) as {
      user?: { role?: string; forcePasswordChange?: boolean };
    } | null;
    if (!session?.user) {
      setError(loginMessage(locale, "session"));
      return false;
    }
    if (session.user.role === "PATIENT") {
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
    setError(null);
    setStatus(null);

    const usernameTrimmed = username.trim();
    if (!usernameTrimmed || !password) {
      setError(loginMessage(locale, "empty"));
      return;
    }

    setSubmitting(true);
    try {
      if (!needsTotp) {
        setStatus(t(locale, "Checking username and password…", "בודקים שם משתמש וסיסמה…"));
        const preflight = await fetch("/api/auth/preflight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: usernameTrimmed, password }),
        });
        const result = (await preflight.json().catch(() => null)) as {
          ok?: boolean;
          needsTotp?: boolean;
          error?: string;
        } | null;
        if (!result?.ok) {
          const code = !preflight.ok
            ? result?.error ?? "server"
            : result?.error ?? "credentials";
          setError(loginMessage(locale, code));
          return;
        }
        if (result.needsTotp) {
          setNeedsTotp(true);
          setStatus(
            t(
              locale,
              "Password is correct. Enter the authenticator code.",
              "הסיסמה נכונה. יש להזין את קוד היישומון."
            )
          );
          return;
        }
      }

      await completeSignIn();
    } catch {
      setError(loginMessage(locale, "server"));
    } finally {
      setSubmitting(false);
      setStatus(null);
    }
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
        aria-busy={submitting}
        className="rounded-2xl border p-4 border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1 text-sm" htmlFor="username">
          {t(locale, "Username", "שם משתמש")}
          <input
            id="username"
            name="username"
            dir="auto"
            required
            className="rounded-xl border px-3 py-2 border-[var(--color-border)] bg-transparent outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            disabled={needsTotp || submitting}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm" htmlFor="password">
          {t(locale, "Password", "סיסמה")}
          <input
            id="password"
            name="password"
            type="password"
            dir="ltr"
            required
            className="rounded-xl border px-3 py-2 border-[var(--color-border)] bg-transparent outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={needsTotp || submitting}
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

        {status && !error ? (
          <div
            data-testid="login-status"
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          >
            {status}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            data-testid="login-error"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
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
