import { notFound } from "next/navigation";

import { bookPublicVacancyAction } from "@/app/[locale]/(public)/book/actions";
import {
  listPublicVacancies,
  toCalendarEvent,
} from "@/lib/appointment-service";
import { t } from "@/lib/copy";
import { getActivePublicBookingLink } from "@/lib/public-booking-service";

export default async function PublicBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "en" | "he"; token: string }>;
  searchParams: Promise<{ booked?: string; error?: string }>;
}) {
  const { locale, token } = await params;
  const query = await searchParams;
  const link = await getActivePublicBookingLink(token);
  if (!link) notFound();

  const vacancies = (await listPublicVacancies(10)).map(toCalendarEvent);
  const book = bookPublicVacancyAction.bind(null, locale, token);

  const errorText =
    query.error === "conflict"
      ? t(
          locale,
          "That slot is no longer available.",
          "המשבצת הזו כבר אינה פנויה."
        )
      : query.error === "contact"
        ? t(
            locale,
            "Phone or email is required.",
            "נדרש טלפון או אימייל."
          )
        : query.error === "name"
          ? t(locale, "Name is required.", "נדרש שם.")
          : query.error === "slot"
            ? t(locale, "Please choose an available slot.", "בחרו משבצת פנויה.")
            : query.error === "rate"
              ? t(locale, "Please wait and try again.", "המתינו ונסו שוב.")
              : query.error
                ? t(locale, "Booking failed.", "הקביעה נכשלה.")
                : null;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold mb-1">
        {t(locale, "Book an available slot", "קביעת משבצת פנויה")}
      </h1>
      <p className="mb-4 text-[var(--color-foreground)]/70">
        {t(
          locale,
          "Choose a vacancy, then leave your name and a way to reach you.",
          "בחרו זמינות, ואז השאירו שם ואמצעי יצירת קשר."
        )}
      </p>

      {query.booked === "1" ? (
        <div
          data-testid="public-book-success"
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
        >
          {t(
            locale,
            "Booking received. We created a pending patient record and reserved the slot.",
            "הקביעה התקבלה. נוצר תיק מטופל ממתין והמשבצת נשמרה."
          )}
        </div>
      ) : (
        <form
          action={book}
          data-testid="public-book-form"
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col gap-3"
        >
          {errorText ? (
            <p className="text-sm text-[var(--color-primary-dark)]">{errorText}</p>
          ) : null}

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium mb-1">
              {t(locale, "Available times", "זמנים פנויים")}
            </legend>
            {vacancies.length === 0 ? (
              <p className="text-[var(--color-foreground)]/70">
                {t(locale, "No vacant slots right now.", "אין כרגע משבצות פנויות.")}
              </p>
            ) : (
              vacancies.map((slot) => (
                <label
                  key={slot.id}
                  className="flex items-start gap-2 rounded-xl border border-[var(--color-border)] p-3"
                >
                  <input
                    type="radio"
                    name="vacancyEventId"
                    value={slot.id}
                    required
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium">{slot.title}</span>
                    <span className="block text-sm text-[var(--color-foreground)]/70">
                      {new Date(slot.start).toLocaleString(locale)} –{" "}
                      {new Date(slot.end).toLocaleTimeString(locale, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                </label>
              ))
            )}
          </fieldset>

          <label className="flex flex-col gap-1 text-sm">
            {t(locale, "Full name", "שם מלא")}
            <input
              name="name"
              required
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t(locale, "Phone", "טלפון")}
            <input
              name="phone"
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t(locale, "Email", "אימייל")}
            <input
              name="email"
              type="email"
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t(locale, "Date of birth", "תאריך לידה")}
            <input
              name="birthDate"
              type="date"
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t(locale, "Notes", "הערות")}
            <textarea
              name="notes"
              className="min-h-20 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
          </label>
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          <button
            type="submit"
            disabled={vacancies.length === 0}
            className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] py-2 px-4 font-semibold disabled:opacity-60"
          >
            {t(locale, "Book slot", "קבע משבצת")}
          </button>
        </form>
      )}
    </div>
  );
}
