"use client";

import heLocale from "@fullcalendar/core/locales/he";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import {
  createAppointmentRecord,
  deleteAppointmentAction,
  updateAppointmentTimesAction,
} from "@/app/[locale]/calendar/actions";
import type {
  CalendarEventDTO,
  PatientOptionDTO,
} from "@/lib/appointment-service";
import { toDatetimeLocalValue } from "@/lib/datetime";
import type { AppLocale } from "@/lib/locale";

type Props = {
  locale: AppLocale;
  patients: PatientOptionDTO[];
  appointments: CalendarEventDTO[];
};

type DraftAppointment = {
  patientId: string;
  startAt: string;
  endAt: string;
};

type SelectedEvent = CalendarEventDTO & { title: string };

function eventTimes(event: {
  start: Date | null;
  end: Date | null;
}): { start: Date; end: Date } | null {
  if (!event.start) return null;
  const end = event.end ?? new Date(event.start.getTime() + 60 * 60 * 1000);
  return { start: event.start, end };
}

export function ClinicCalendar({ locale, patients, appointments }: Props) {
  const router = useRouter();
  const isHe = locale === "he";
  const [draft, setDraft] = useState<DraftAppointment | null>(null);
  const [selected, setSelected] = useState<SelectedEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const events = useMemo(
    () =>
      appointments.map((appointment) => ({
        id: appointment.id,
        title: appointment.title,
        start: appointment.start,
        end: appointment.end,
        extendedProps: { patientId: appointment.patientId },
      })),
    [appointments]
  );

  async function persistMove(
    id: string,
    start: Date,
    end: Date,
    revert: () => void
  ) {
    const result = await updateAppointmentTimesAction(
      id,
      start.toISOString(),
      end.toISOString()
    );
    if (!result.ok) {
      revert();
      setError(
        isHe ? "לא ניתן לשמור את שינויי הפגישה." : "Could not save meeting changes."
      );
      return;
    }
    router.refresh();
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!draft?.patientId) return;
    setSaving(true);
    setError(null);
    const result = await createAppointmentRecord({
      patientId: draft.patientId,
      startAt: draft.startAt,
      endAt: draft.endAt,
      locale,
    });
    setSaving(false);
    if (!result.ok) {
      setError(isHe ? "הקביעה נכשלה." : "Booking failed.");
      return;
    }
    setDraft(null);
    router.refresh();
  }

  async function onDelete() {
    if (!selected) return;
    const confirmed = window.confirm(
      isHe ? "למחוק פגישה?" : "Delete appointment?"
    );
    if (!confirmed) return;
    setSaving(true);
    const result = await deleteAppointmentAction(selected.id);
    setSaving(false);
    if (!result.ok) {
      setError(isHe ? "לא ניתן למחוק את הפגישה." : "Could not delete meeting.");
      return;
    }
    setSelected(null);
    router.refresh();
  }

  return (
    <div data-testid="clinic-calendar" className="clinic-calendar">
      {error ? (
        <div className="mb-3 text-sm text-[var(--color-primary-dark)]">
          {error}
        </div>
      ) : null}

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,timeGridDay,dayGridMonth",
        }}
        buttonText={{
          today: isHe ? "היום" : "Today",
          week: isHe ? "שבועי" : "Week",
          day: isHe ? "יום" : "Day",
          month: isHe ? "חודש" : "Month",
        }}
        locales={[heLocale]}
        locale={isHe ? "he" : "en"}
        direction={isHe ? "rtl" : "ltr"}
        firstDay={isHe ? 0 : 1}
        events={events}
        editable
        selectable
        selectMirror
        nowIndicator
        dayMaxEvents
        expandRows
        height="auto"
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        slotDuration="00:30:00"
        snapDuration="00:15:00"
        allDaySlot={false}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        select={(info) => {
          setSelected(null);
          setError(null);
          setDraft({
            patientId: patients[0]?.id ?? "",
            startAt: toDatetimeLocalValue(info.start),
            endAt: toDatetimeLocalValue(info.end),
          });
        }}
        eventClick={(info) => {
          const range = eventTimes(info.event);
          if (!range) return;
          setDraft(null);
          setSelected({
            id: info.event.id,
            patientId: String(info.event.extendedProps.patientId ?? ""),
            title: info.event.title,
            start: range.start.toISOString(),
            end: range.end.toISOString(),
          });
        }}
        eventDrop={(info) => {
          if (info.event.allDay) {
            info.revert();
            return;
          }
          const range = eventTimes(info.event);
          if (!range) {
            info.revert();
            return;
          }
          void persistMove(info.event.id, range.start, range.end, info.revert);
        }}
        eventResize={(info) => {
          const range = eventTimes(info.event);
          if (!range) {
            info.revert();
            return;
          }
          void persistMove(info.event.id, range.start, range.end, info.revert);
        }}
      />

      {draft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={onCreate}
            className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col gap-3"
          >
            <h2 className="text-lg font-semibold">
              {isHe ? "קבע פגישה" : "Book an Appointment"}
            </h2>
            <label className="flex flex-col gap-1 text-sm">
              {isHe ? "מטופל" : "Patient"}
              <select
                required
                value={draft.patientId}
                onChange={(e) =>
                  setDraft((current) =>
                    current ? { ...current, patientId: e.target.value } : current
                  )
                }
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
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
                required
                value={draft.startAt}
                onChange={(e) =>
                  setDraft((current) =>
                    current ? { ...current, startAt: e.target.value } : current
                  )
                }
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {isHe ? "שעת סיום" : "End Time"}
              <input
                type="datetime-local"
                required
                value={draft.endAt}
                onChange={(e) =>
                  setDraft((current) =>
                    current ? { ...current, endAt: e.target.value } : current
                  )
                }
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2"
              >
                {isHe ? "ביטול" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={saving || patients.length === 0}
                className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {saving
                  ? isHe
                    ? "שומר..."
                    : "Saving..."
                  : isHe
                    ? "שמירה"
                    : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{selected.title}</h2>
            <p className="text-sm text-[var(--color-foreground)]/70">
              {new Date(selected.start).toLocaleString(locale)} –{" "}
              {new Date(selected.end).toLocaleString(locale)}
            </p>
            <div className="flex flex-wrap gap-2 justify-end">
              {selected.patientId ? (
                <Link
                  href={`/${locale}/patients/${selected.patientId}`}
                  className="rounded-xl border border-[var(--color-border)] px-4 py-2"
                >
                  {isHe ? "פתח פרופיל מטופל" : "Open Patient Profile"}
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => void onDelete()}
                disabled={saving}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 disabled:opacity-60"
              >
                {isHe ? "מחק פגישה" : "Delete Meeting"}
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
              >
                {isHe ? "סגור" : "Close"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
