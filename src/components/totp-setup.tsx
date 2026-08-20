"use client";

import { useState } from "react";

import type { AppLocale } from "@/lib/locale";
import { t } from "@/lib/copy";
import {
  beginTotpSetupAction,
  confirmTotpSetupAction,
  disableTotpAction,
} from "@/app/[locale]/(clinic)/settings/actions";

export function TotpSetup({
  locale,
  enabled,
  username,
}: {
  locale: AppLocale;
  enabled: boolean;
  username: string;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const start = beginTotpSetupAction.bind(null, locale);
  const confirm = confirmTotpSetupAction.bind(null, locale);
  const disable = disableTotpAction.bind(null, locale);

  return (
    <div className="flex flex-col gap-3" data-testid="totp-setup">
      <p className="text-sm text-[var(--color-foreground)]/70">
        {enabled
          ? t(locale, "Two-factor authentication is on.", "אימות דו-שלבי פעיל.")
          : t(
              locale,
              "Protect this account with an authenticator app.",
              "הגנו על החשבון עם יישומון אימות."
            )}
      </p>
      {error ? (
        <p className="text-sm text-[var(--color-primary-dark)]">{error}</p>
      ) : null}
      {qr ? (
        <div className="flex flex-col gap-2">
          <img src={qr} alt="TOTP QR" className="w-44 h-44" data-testid="totp-qr" />
          <form
            action={async (formData) => {
              const result = await confirm(formData);
              if (!result.ok) {
                setError(t(locale, "Invalid code.", "קוד לא תקין."));
                return;
              }
              setQr(null);
              setCodes(result.codes);
            }}
            className="flex flex-col gap-2"
          >
            <input
              name="code"
              required
              data-testid="totp-verify"
              placeholder={t(locale, "6-digit code", "קוד בן 6 ספרות")}
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
            >
              {t(locale, "Verify and enable", "אמת והפעל")}
            </button>
          </form>
        </div>
      ) : null}
      {codes ? (
        <div
          data-testid="totp-recovery-codes"
          className="rounded-xl border border-[var(--color-border)] p-3 text-sm"
        >
          <p className="font-medium mb-2">
            {t(locale, "Save these recovery codes.", "שמרו את קודי השחזור.")}
          </p>
          <ul className="font-mono flex flex-col gap-1">
            {codes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <form
        action={async () => {
          const result = await start();
          if (result.ok) {
            setCodes(null);
            setQr(result.qrDataUrl);
            setError(null);
          }
        }}
      >
        <button
          type="submit"
          data-testid="totp-start"
          className="rounded-xl border border-[var(--color-border)] px-4 py-2"
        >
          {enabled
            ? t(locale, "Reset authenticator", "אפס יישומון")
            : t(locale, "Set up authenticator", "הגדר יישומון")}
        </button>
      </form>
      {enabled ? (
        <form action={disable}>
          <button
            type="submit"
            data-testid="totp-disable"
            className="text-sm hover:underline"
          >
            {t(locale, "Disable 2FA", "כבה אימות דו-שלבי")}
          </button>
        </form>
      ) : null}
      <p className="text-xs text-[var(--color-foreground)]/50">{username}</p>
    </div>
  );
}
