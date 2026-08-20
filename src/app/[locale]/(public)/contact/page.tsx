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
        {t(locale, "Contact the clinic", "יצירת קשר עם הקליניקה")}
      </h1>
      <p className="mb-4 text-[var(--color-foreground)]/70">
        {t(
          locale,
          "Leave a message and the clinic will follow up.",
          "השאירו הודעה והקליניקה תחזור אליכם."
        )}
      </p>
      {query.sent ? (
        <p className="mb-4" data-testid="contact-success">
          {t(locale, "Message received. Thank you.", "ההודעה התקבלה. תודה.")}
        </p>
      ) : null}
      {query.error ? (
        <p className="mb-4 text-[var(--color-primary-dark)]">
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
        <input
          name="name"
          required
          data-testid="contact-name"
          placeholder={t(locale, "Name", "שם")}
          className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
        />
        <input
          name="email"
          type="email"
          data-testid="contact-email"
          placeholder={t(locale, "Email", "אימייל")}
          className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
        />
        <input
          name="phone"
          data-testid="contact-phone"
          placeholder={t(locale, "Phone", "טלפון")}
          className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
        />
        <textarea
          name="message"
          required
          data-testid="contact-message"
          placeholder={t(locale, "Message", "הודעה")}
          className="min-h-28 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
        />
        <button
          type="submit"
          data-testid="contact-submit"
          className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
        >
          {t(locale, "Send", "שלח")}
        </button>
      </form>
    </div>
  );
}
