import {
  deleteInquiryAction,
  markInquiryReadAction,
} from "@/app/[locale]/(clinic)/inquiries/actions";
import { t } from "@/lib/copy";
import { listContactInquiries } from "@/lib/contact-service";

export default async function InquiriesPage({
  params,
}: {
  params: Promise<{ locale: "en" | "he" }>;
}) {
  const { locale } = await params;
  const inquiries = await listContactInquiries();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">
        {t(locale, "Contact inquiries", "פניות מהאתר")}
      </h1>
      {inquiries.length === 0 ? (
        <p className="text-[var(--color-foreground)]/70">
          {t(locale, "No inquiries yet.", "אין פניות עדיין.")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="inquiry-list">
          {inquiries.map((inquiry) => (
            <li
              key={inquiry.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="font-medium">{inquiry.name}</div>
              <div className="text-sm text-[var(--color-foreground)]/70">
                {inquiry.email ?? inquiry.phone}
                {inquiry.readAt
                  ? ` · ${t(locale, "Read", "נקראה")}`
                  : ` · ${t(locale, "Unread", "לא נקראה")}`}
              </div>
              <p className="mt-2 whitespace-pre-wrap">{inquiry.message}</p>
              <div className="mt-3 flex gap-2">
                {!inquiry.readAt ? (
                  <form action={markInquiryReadAction.bind(null, locale, inquiry.id)}>
                    <button
                      type="submit"
                      data-testid="mark-inquiry-read"
                      className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm"
                    >
                      {t(locale, "Mark read", "סמן כנקרא")}
                    </button>
                  </form>
                ) : null}
                <form action={deleteInquiryAction.bind(null, locale, inquiry.id)}>
                  <button type="submit" className="text-sm hover:underline">
                    {t(locale, "Delete", "מחיקה")}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
