"use client";

import { useState } from "react";

import { ensurePublicBookingLinkAction } from "@/app/[locale]/(clinic)/calendar/actions";
import { t } from "@/lib/copy";
import type { AppLocale } from "@/lib/locale";

export function PublicBookingLinkButton({ locale }: { locale: AppLocale }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onCopy() {
    setBusy(true);
    setError(null);
    const result = await ensurePublicBookingLinkAction();
    setBusy(false);
    if (!result.ok || !result.token) {
      setError(
        t(locale, "Could not create booking link.", "לא ניתן ליצור קישור לקביעה.")
      );
      return;
    }
    const next = `${window.location.origin}/${locale}/book/${result.token}`;
    setUrl(next);
    try {
      await navigator.clipboard.writeText(next);
    } catch {
      // clipboard may be unavailable in tests; the URL is still shown
    }
  }

  return (
    <div className="mb-4 flex flex-col gap-2">
      <button
        type="button"
        data-testid="copy-public-booking-link"
        onClick={() => void onCopy()}
        disabled={busy}
        className="w-fit rounded-xl border border-[var(--color-border)] px-4 py-2 font-medium disabled:opacity-60"
      >
        {t(locale, "Copy public booking link", "העתק קישור קביעה ציבורי")}
      </button>
      {url ? (
        <p className="text-sm break-all" data-testid="public-booking-url">
          {url}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-[var(--color-primary-dark)]">{error}</p>
      ) : null}
    </div>
  );
}
