import { createAppointmentFormAction } from "@/app/[locale]/calendar/actions";
import { ClinicCalendarLoader } from "@/components/calendar/clinic-calendar-loader";
import {
  listAppointmentsInRange,
  toCalendarEvent,
} from "@/lib/appointment-service";
import { toDatetimeLocalValue } from "@/lib/datetime";
import { listPatients } from "@/lib/patient-service";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: "en" | "he" }>;
}) {
  const { locale } = await params;
  const isHe = locale === "he";

  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setMonth(rangeStart.getMonth() - 2);
  const rangeEnd = new Date(now);
  rangeEnd.setMonth(rangeEnd.getMonth() + 6);

  const [patients, appointments] = await Promise.all([
    listPatients(),
    listAppointmentsInRange(rangeStart, rangeEnd),
  ]);

  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000);
  const defaultEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  return (
    <div className="max-w-7xl">
      <h1 className="text-2xl font-semibold mb-3">
        {isHe ? "יומן" : "Calendar"}
      </h1>
      <p className="mb-4 text-[var(--color-foreground)]/70">
        {isHe
          ? "גררו פגישות לשינוי מועד, שנו את משכן, או לחצו על זמן פנוי כדי לקבוע."
          : "Drag appointments to reschedule, resize their duration, or click an empty slot to book."}
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border bg-[var(--color-surface)] border-[var(--color-border)] p-4 overflow-x-auto">
          <ClinicCalendarLoader
            locale={locale}
            patients={patients.map((patient) => ({
              id: patient.id,
              firstName: patient.firstName,
              lastName: patient.lastName,
            }))}
            appointments={appointments.map(toCalendarEvent)}
          />
        </div>

        <div>
          <div className="rounded-2xl border bg-[var(--color-surface)] border-[var(--color-border)] p-4">
            <div className="font-semibold mb-3">
              {isHe ? "הוספת פגישה" : "Add appointment"}
            </div>

            <form
              action={createAppointmentFormAction}
              className="flex flex-col gap-3"
            >
              <input type="hidden" name="locale" value={locale} />
              <label className="flex flex-col gap-1 text-sm">
                {isHe ? "מטופל" : "Patient"}
                <select
                  name="patientId"
                  className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                  defaultValue={patients[0]?.id ?? ""}
                >
                  {patients.length === 0 ? (
                    <option value="" disabled>
                      {isHe ? "אין מטופלים" : "No patients yet."}
                    </option>
                  ) : (
                    patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                {isHe ? "שעת התחלה" : "Start Time"}
                <input
                  type="datetime-local"
                  name="startAt"
                  defaultValue={toDatetimeLocalValue(defaultStart)}
                  className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                {isHe ? "שעת סיום" : "End Time"}
                <input
                  type="datetime-local"
                  name="endAt"
                  defaultValue={toDatetimeLocalValue(defaultEnd)}
                  className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={patients.length === 0}
                className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] py-2 px-3 font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {isHe ? "שמור פגישה" : "Save appointment"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
