import { submitContactAction } from "@/app/[locale]/(public)/contact/actions";
import { t } from "@/lib/copy";

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "en" | "he" }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const submit = submitContactAction.bind(null, locale);

  return (
    <div className="mx-auto max-w-lg" data-testid="contact-page">
      <h1 className="text-2xl font-semibold mb-1">
        {t(locale, "Contact the clinic", "יצירת קשר")}
      </h1>
      <p className="mb-4 text-[var(--color-foreground)]/70">
        {t(
          locale,
          "Leave a message and the clinic will get back to you.",
          "השאירו הודעה. נחזור אליכם."
        )}
      </p>
      {query.sent ? (
        <p className="mb-4" data-testid="contact-success" role="status">
          {t(locale, "Message received. Thank you.", "ההודעה התקבלה. תודה.")}
        </p>
      ) : null}
      {query.error ? (
        <p className="mb-4 text-[var(--color-primary-dark)]" role="alert">
          {query.error === "contact"
            ? t(locale, "Email or phone is required.", "נדרש אימייל או טלפון.")
            : t(locale, "Name and message are required.", "נדרשים שם והודעה.")}
        </p>
      ) : null}
      <form
        action={submit}
        data-testid="contact-form"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3"
      >
        <label className="flex flex-col gap-1 text-sm" htmlFor="contact-name">
          {t(locale, "Name", "שם")}
          <input
            id="contact-name"
            name="name"
            required
            dir="auto"
            data-testid="contact-name"
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm" htmlFor="contact-email">
          {t(locale, "Email", "אימייל")}
          <input
            id="contact-email"
            name="email"
            type="email"
            dir="ltr"
            data-testid="contact-email"
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm" htmlFor="contact-phone">
          {t(locale, "Phone", "טלפון")}
          <input
            id="contact-phone"
            name="phone"
            dir="ltr"
            inputMode="tel"
            data-testid="contact-phone"
            className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm" htmlFor="contact-message">
          {t(locale, "Message", "הודעה")}
          <textarea
            id="contact-message"
            name="message"
            required
            dir="auto"
            data-testid="contact-message"
            className="min-h-28 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
        </label>
        <button
          type="submit"
          data-testid="contact-submit"
          className="min-h-11 rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
        >
          {t(locale, "Send", "שליחה")}
        </button>
      </form>
    </div>
  );
}
