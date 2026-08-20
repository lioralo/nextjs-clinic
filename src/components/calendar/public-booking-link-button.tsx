"use client";

import { useState } from "react";

import { t } from "@/lib/copy";
import type { AppLocale } from "@/lib/locale";

const WEEKDAYS = [
  { value: "0", en: "Sun", he: "א׳" },
  { value: "1", en: "Mon", he: "ב׳" },
  { value: "2", en: "Tue", he: "ג׳" },
  { value: "3", en: "Wed", he: "ד׳" },
  { value: "4", en: "Thu", he: "ה׳" },
  { value: "5", en: "Fri", he: "ו׳" },
  { value: "6", en: "Sat", he: "ש׳" },
];

export function PublicBookingLinkButton({
  locale,
  bookLink,
}: {
  locale: AppLocale;
  bookLink?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const url = bookLink ? `/${locale}/book/${bookLink}` : null;

  return (
    <div className="mb-4 flex flex-col gap-2">
      <button
        type="button"
        data-testid="copy-public-booking-link"
        onClick={() => setOpen(true)}
        className="w-fit rounded-xl border border-[var(--color-border)] px-4 py-2 font-medium"
      >
        {t(locale, "Publish public booking", "פרסם יומן לקביעה עצמית")}
      </button>
      {url ? (
        <p className="text-sm break-all" data-testid="public-booking-url">
          {url}
        </p>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
          data-testid="publish-overlay"
          onClick={() => setOpen(false)}
        >
          <form
            method="post"
            action="/api/calendar"
            data-testid="publish-vacancies-form"
            onClick={(event) => event.stopPropagation()}
            className="mt-8 w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-3"
          >
            <input type="hidden" name="intent" value="publish" />
            <input type="hidden" name="locale" value={locale} />
            <h2 className="text-lg font-semibold">
              {t(locale, "Publish vacant slots", "פרסום משבצות פנויות")}
            </h2>
            <p className="text-sm text-[var(--color-foreground)]/70">
              {t(
                locale,
                "Choose weekdays and a time. Conflicting hours are skipped, then a public booking link is created.",
                "בחרו ימים ושעה. שעות חופפות ידולגו, ואז ייווצר קישור קביעה ציבורי."
              )}
            </p>
            <fieldset className="flex flex-wrap gap-2">
              <legend className="text-sm mb-1">
                {t(locale, "Weekdays", "ימים")}
              </legend>
              {WEEKDAYS.map((day) => (
                <label key={day.value} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    name="weekday"
                    value={day.value}
                    defaultChecked={Number(day.value) <= 4}
                  />
                  {locale === "he" ? day.he : day.en}
                </label>
              ))}
            </fieldset>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Start time", "שעת התחלה")}
              <input
                type="time"
                name="startTime"
                defaultValue="10:00"
                required
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Duration (minutes)", "משך (דקות)")}
              <input
                type="number"
                name="durationMinutes"
                defaultValue={60}
                min={15}
                step={15}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isRecurring" value="1" defaultChecked />
              {t(locale, "Weekly recurring", "חוזר שבועית")}
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Repeat until", "חזור עד")}
              <input
                type="date"
                name="recurrenceEndDate"
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Title", "כותרת")}
              <input
                name="title"
                defaultValue={t(locale, "Vacant Slot", "משבצת פנויה")}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                data-testid="publish-vacancies"
                className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
              >
                {t(locale, "Publish and copy link", "פרסם והעתק קישור")}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2"
              >
                {t(locale, "Cancel", "ביטול")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
