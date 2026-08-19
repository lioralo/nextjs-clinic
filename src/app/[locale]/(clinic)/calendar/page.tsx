import { ClinicCalendarLoader } from "@/components/calendar/clinic-calendar-loader";
import { PublicBookingLinkButton } from "@/components/calendar/public-booking-link-button";
import {
  listAppointmentsInRange,
  toCalendarEvent,
} from "@/lib/appointment-service";
import { t } from "@/lib/copy";
import { listPatients } from "@/lib/patient-service";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: "en" | "he" }>;
}) {
  const { locale } = await params;

  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setMonth(rangeStart.getMonth() - 2);
  const rangeEnd = new Date(now);
  rangeEnd.setMonth(rangeEnd.getMonth() + 6);

  const [patients, appointments] = await Promise.all([
    listPatients(),
    listAppointmentsInRange(rangeStart, rangeEnd),
  ]);

  return (
    <div className="max-w-7xl">
      <h1 className="text-2xl font-semibold mb-1">
        {t(locale, "Weekly Snapshot Calendar", "יומן תמונת מצב שבועית")}
      </h1>
      <p className="mb-4 text-[var(--color-foreground)]/70">
        {t(
          locale,
          "Plan meetings, expose vacant times to patients, and review follow-up pressure from one scheduling workspace.",
          "תכנן פגישות, חשוף זמנים פנויים למטופלים, וסקור לחץ מעקב מסביבת תזמון אחת."
        )}
      </p>

      <PublicBookingLinkButton locale={locale} />

      <ClinicCalendarLoader
        locale={locale}
        patients={patients.map((patient) => ({
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          status: patient.status,
          patientType: patient.patientType,
        }))}
        appointments={appointments.map(toCalendarEvent)}
      />
    </div>
  );
}
