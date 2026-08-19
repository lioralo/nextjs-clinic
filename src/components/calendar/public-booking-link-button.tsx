import { t } from "@/lib/copy";
import type { AppLocale } from "@/lib/locale";

export function PublicBookingLinkButton({
  locale,
  bookLink,
}: {
  locale: AppLocale;
  bookLink?: string | null;
}) {
  const url = bookLink ? `/${locale}/book/${bookLink}` : null;

  return (
    <div className="mb-4 flex flex-col gap-2">
      <form method="post" action="/api/calendar">
        <input type="hidden" name="intent" value="public-link" />
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          data-testid="copy-public-booking-link"
          className="w-fit rounded-xl border border-[var(--color-border)] px-4 py-2 font-medium"
        >
          {t(locale, "Copy public booking link", "העתק קישור קביעה ציבורי")}
        </button>
      </form>
      {url ? (
        <p className="text-sm break-all" data-testid="public-booking-url">
          {url}
        </p>
      ) : null}
    </div>
  );
}
