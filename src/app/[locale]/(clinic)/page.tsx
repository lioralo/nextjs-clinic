import { sendDueAppointmentReminders } from "@/lib/cancel-service";
import { smtpConfigured } from "@/lib/mail";
import { countPendingCancelRequests } from "@/lib/cancel-service";
import { t } from "@/lib/copy";
import { formatDateTime } from "@/lib/datetime";
import { listAppointmentsInRange } from "@/lib/appointment-service";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: "en" | "he" }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  if (smtpConfigured()) {
    await sendDueAppointmentReminders();
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const rangeEnd = new Date(start);
  rangeEnd.setDate(rangeEnd.getDate() + 26 * 7);

  const [patientCount, waitingCount, pendingCancels, range] = await Promise.all([
    prisma.patient.count(),
    prisma.patient.count({ where: { status: "WAITING" } }),
    countPendingCancelRequests(),
    listAppointmentsInRange(start, rangeEnd),
  ]);
  const today = range.filter(
    (row) =>
      row.kind === "APPOINTMENT" &&
      row.startAt >= start &&
      row.startAt < end
  );
  const upcomingAll = range.filter(
    (row) => row.kind === "APPOINTMENT" && row.startAt >= new Date()
  );
  const upcomingCount = upcomingAll.length;
  const upcoming = upcomingAll.slice(0, 5);

  return (
    <div className="w-full min-w-0">
      <h1 className="text-2xl font-semibold mb-2">
        {t(locale, "Dashboard", "לוח הבקרה")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5">
          <div className="text-sm text-[var(--color-foreground)]/70">
            {t(locale, "Total patients", "סך הכל מטופלים")}
          </div>
          <div className="text-3xl font-semibold">{patientCount}</div>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5">
          <div className="text-sm text-[var(--color-foreground)]/70">
            {t(locale, "Upcoming appointments", "פגישות קרובות")}
          </div>
          <div className="text-3xl font-semibold" data-testid="upcoming-count">
            {upcomingCount}
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5">
          <div className="text-sm text-[var(--color-foreground)]/70">
            {t(locale, "Waiting list", "רשימת המתנה")}
          </div>
          <div className="text-3xl font-semibold" data-testid="waiting-count">
            {waitingCount}
          </div>
        </div>
        <a
          href={`/${locale}/cancel-requests`}
          className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5"
        >
          <div className="text-sm text-[var(--color-foreground)]/70">
            {t(locale, "Pending cancellations", "ביטולים ממתינים")}
          </div>
          <div className="text-3xl font-semibold" data-testid="pending-cancels">
            {pendingCancels}
          </div>
        </a>
      </div>

      <div className="mt-5 rounded-2xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5">
        <div className="text-lg font-semibold mb-3">
          {t(locale, "Today", "היום")}
        </div>
        {today.length === 0 ? (
          <div className="text-[var(--color-foreground)]/70">
            {t(locale, "No meetings today.", "אין פגישות היום.")}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {today.map((a) => (
              <li
                key={`${a.id}__${a.startAt.toISOString()}`}
                className="rounded-xl bg-[var(--color-primary-container)]/40 border border-[var(--color-border)] p-3"
              >
                <div className="font-medium">
                  {a.patient
                    ? `${a.patient.firstName} ${a.patient.lastName}`
                    : a.title?.trim() || t(locale, "Appointment", "פגישה")}
                </div>
                <div className="text-sm text-[var(--color-foreground)]/70" dir="ltr">
                  {formatDateTime(a.startAt, locale)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 rounded-2xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5">
        <div className="text-lg font-semibold mb-3">
          {t(locale, "Appointments", "רשימת פגישות")}
        </div>
        {upcoming.length === 0 ? (
          <div className="text-[var(--color-foreground)]/70">
            {t(locale, "No upcoming appointments.", "אין פגישות קרובות.")}
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((a) => (
              <li
                key={`${a.id}__${a.startAt.toISOString()}`}
                className="rounded-xl bg-[var(--color-primary-container)]/40 border border-[var(--color-border)] p-3"
              >
                <div className="font-medium">
                  {a.patient
                    ? `${a.patient.firstName} ${a.patient.lastName}`
                    : a.title?.trim() || t(locale, "Appointment", "פגישה")}
                </div>
                <div className="text-sm text-[var(--color-foreground)]/70" dir="ltr">
                  {formatDateTime(a.startAt, locale)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
