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
import { kindLabel, t } from "@/lib/copy";
import { toDatetimeLocalValue } from "@/lib/datetime";
import type { AppLocale } from "@/lib/locale";

type Props = {
  locale: AppLocale;
  patients: PatientOptionDTO[];
  appointments: CalendarEventDTO[];
};

type Draft = {
  kind: "APPOINTMENT" | "VACANCY" | "BLOCK";
  patientId: string;
  startAt: string;
  endAt: string;
  title: string;
  meetingType: "IN_PERSON" | "ONLINE";
  meetingLink: string;
  isRecurring: boolean;
  recurrenceEndDate: string;
};

type SelectedEvent = CalendarEventDTO;

function eventTimes(event: {
  start: Date | null;
  end: Date | null;
}): { start: Date; end: Date } | null {
  if (!event.start) return null;
  const end = event.end ?? new Date(event.start.getTime() + 60 * 60 * 1000);
  return { start: event.start, end };
}

function defaultRecurring(patient: PatientOptionDTO | undefined) {
  return patient?.status === "ONGOING";
}

function emptyDraft(patients: PatientOptionDTO[]): Draft {
  const first = patients[0];
  const now = new Date();
  const start = new Date(now.getTime() + 60 * 60 * 1000);
  const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return {
    kind: "APPOINTMENT",
    patientId: first?.id ?? "",
    startAt: toDatetimeLocalValue(start),
    endAt: toDatetimeLocalValue(end),
    title: "",
    meetingType: "IN_PERSON",
    meetingLink: "",
    isRecurring: defaultRecurring(first),
    recurrenceEndDate: "",
  };
}

export function ClinicCalendar({ locale, patients, appointments }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(patients));
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
        classNames: [`fc-kind-${appointment.kind.toLowerCase()}`],
        editable: appointment.kind === "APPOINTMENT",
        extendedProps: {
          patientId: appointment.patientId,
          kind: appointment.kind,
          seriesId: appointment.seriesId,
          isRecurring: appointment.isRecurring,
        },
      })),
    [appointments]
  );

  const selectedPatient = patients.find((patient) => patient.id === draft.patientId);

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
        t(locale, "Could not save meeting changes.", "לא ניתן לשמור את שינויי הפגישה.")
      );
      return;
    }
    router.refresh();
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (draft.kind === "APPOINTMENT" && !draft.patientId) return;
    setSaving(true);
    setError(null);
    const result = await createAppointmentRecord({
      kind: draft.kind,
      patientId: draft.patientId,
      startAt: draft.startAt,
      endAt: draft.endAt,
      title: draft.title,
      meetingType: draft.meetingType,
      meetingLink: draft.meetingLink,
      isRecurring: draft.isRecurring,
      recurrenceEndDate: draft.recurrenceEndDate,
      locale,
    });
    setSaving(false);
    if (!result.ok) {
      setError(t(locale, "Booking failed.", "הקביעה נכשלה."));
      return;
    }
    setSelected(null);
    router.refresh();
  }

  async function onDelete() {
    if (!selected) return;
    const confirmed = window.confirm(
      t(locale, "Delete appointment?", "למחוק פגישה?")
    );
    if (!confirmed) return;
    setSaving(true);
    const result = await deleteAppointmentAction(selected.id);
    setSaving(false);
    if (!result.ok) {
      setError(t(locale, "Could not delete meeting.", "לא ניתן למחוק את הפגישה."));
      return;
    }
    setSelected(null);
    router.refresh();
  }

  return (
    <div
      data-testid="clinic-calendar"
      className="clinic-calendar grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] gap-4"
    >
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 overflow-x-auto">
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
            today: t(locale, "Today", "היום"),
            week: t(locale, "Weekly", "שבועי"),
            day: t(locale, "Day", "יום"),
            month: t(locale, "Date", "תאריך"),
          }}
          locales={[heLocale]}
          locale={locale === "he" ? "he" : "en"}
          direction={locale === "he" ? "rtl" : "ltr"}
          firstDay={locale === "he" ? 0 : 1}
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
            setDraft((current) => ({
              ...current,
              startAt: toDatetimeLocalValue(info.start),
              endAt: toDatetimeLocalValue(info.end),
            }));
          }}
          eventClick={(info) => {
            const range = eventTimes(info.event);
            if (!range) return;
            const kind = String(info.event.extendedProps.kind ?? "APPOINTMENT");
            setSelected({
              id: info.event.id,
              seriesId: String(info.event.extendedProps.seriesId ?? info.event.id),
              patientId: info.event.extendedProps.patientId
                ? String(info.event.extendedProps.patientId)
                : null,
              title: info.event.title,
              start: range.start.toISOString(),
              end: range.end.toISOString(),
              kind:
                kind === "VACANCY" || kind === "BLOCK" ? kind : "APPOINTMENT",
              isRecurring: Boolean(info.event.extendedProps.isRecurring),
              meetingType: "IN_PERSON",
            });
          }}
          eventDrop={(info) => {
            if (info.event.allDay || info.event.extendedProps.kind !== "APPOINTMENT") {
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
            if (info.event.extendedProps.kind !== "APPOINTMENT") {
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
        />
      </div>

      <aside
        data-testid="booking-panel"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 h-fit"
      >
        {selected ? (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{selected.title}</h2>
            <p className="text-sm text-[var(--color-foreground)]/70">
              {kindLabel(locale, selected.kind)}
              {selected.isRecurring
                ? ` · ${t(locale, "Recurring", "חוזר")}`
                : ""}
            </p>
            <p className="text-sm text-[var(--color-foreground)]/70">
              {new Date(selected.start).toLocaleString(locale)} –{" "}
              {new Date(selected.end).toLocaleString(locale)}
            </p>
            <div className="flex flex-col gap-2">
              {selected.patientId ? (
                <Link
                  href={`/${locale}/patients/${selected.patientId}`}
                  className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-center"
                >
                  {t(locale, "Open Patient Profile", "פתח פרופיל מטופל")}
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => void onDelete()}
                disabled={saving}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 disabled:opacity-60"
              >
                {t(locale, "Delete Meeting", "מחק פגישה")}
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
              >
                {t(locale, "Close", "סגור")}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onCreate} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">
              {t(locale, "Booking Panel", "לוח קביעות")}
            </h2>
            <p className="text-sm text-[var(--color-foreground)]/70">
              {t(
                locale,
                "Click a slot, then confirm in the panel",
                "לחץ על משבצת, לאחר מכן אשר בלוח"
              )}
            </p>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Calendar Action", "פעולת יומן")}
              <select
                value={draft.kind}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    kind: e.target.value as Draft["kind"],
                  }))
                }
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              >
                <option value="APPOINTMENT">
                  {t(locale, "Appointment", "פגישה")}
                </option>
                <option value="VACANCY">
                  {t(locale, "Vacant Slot", "משבצת פנויה")}
                </option>
                <option value="BLOCK">{t(locale, "Blocked", "חסום")}</option>
              </select>
            </label>

            {draft.kind === "APPOINTMENT" ? (
              <label className="flex flex-col gap-1 text-sm">
                {t(locale, "Patient", "מטופל")}
                <select
                  required
                  value={draft.patientId}
                  onChange={(e) => {
                    const next = patients.find((patient) => patient.id === e.target.value);
                    setDraft((current) => ({
                      ...current,
                      patientId: e.target.value,
                      isRecurring: defaultRecurring(next),
                    }));
                  }}
                  className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                >
                  {patients.length === 0 ? (
                    <option value="" disabled>
                      {t(locale, "No patients yet.", "אין עדיין מטופלים.")}
                    </option>
                  ) : (
                    patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))
                  )}
                </select>
                <span className="text-[var(--color-foreground)]/70">
                  {selectedPatient?.status === "ONGOING"
                    ? t(
                        locale,
                        "Ongoing patient: this booking will be created as a recurring weekly meeting.",
                        "מטופל פעיל: הקביעה תיווצר כפגישה שבועית חוזרת."
                      )
                    : t(
                        locale,
                        "Candidate/Waiting patient: this booking will be created as a one-time meeting.",
                        "מטופל מועמד/ממתין: הקביעה תיווצר כפגישה חד-פעמית."
                      )}
                </span>
              </label>
            ) : (
              <label className="flex flex-col gap-1 text-sm">
                {t(locale, "Title", "כותרת")}
                <input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((current) => ({ ...current, title: e.target.value }))
                  }
                  className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                />
              </label>
            )}

            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Start Time", "שעת התחלה")}
              <input
                type="datetime-local"
                required
                value={draft.startAt}
                onChange={(e) =>
                  setDraft((current) => ({ ...current, startAt: e.target.value }))
                }
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "End Time", "שעת סיום")}
              <input
                type="datetime-local"
                required
                value={draft.endAt}
                onChange={(e) =>
                  setDraft((current) => ({ ...current, endAt: e.target.value }))
                }
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>

            {draft.kind === "APPOINTMENT" ? (
              <label className="flex flex-col gap-1 text-sm">
                {t(locale, "Meeting Type", "סוג פגישה")}
                <select
                  value={draft.meetingType}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      meetingType: e.target.value as Draft["meetingType"],
                    }))
                  }
                  className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                >
                  <option value="IN_PERSON">
                    {t(locale, "In-person", "פרונטלי")}
                  </option>
                  <option value="ONLINE">{t(locale, "Online", "אונליין")}</option>
                </select>
              </label>
            ) : null}

            {draft.kind === "APPOINTMENT" && draft.meetingType === "ONLINE" ? (
              <label className="flex flex-col gap-1 text-sm">
                {t(locale, "Meeting Link", "קישור לפגישה")}
                <input
                  type="url"
                  value={draft.meetingLink}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      meetingLink: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                />
              </label>
            ) : null}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isRecurring}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    isRecurring: e.target.checked,
                  }))
                }
              />
              {t(locale, "Weekly recurring", "חוזר שבועית")}
            </label>

            {draft.isRecurring ? (
              <label className="flex flex-col gap-1 text-sm">
                {t(locale, "Repeat Until", "חזור עד")}
                <input
                  type="date"
                  value={draft.recurrenceEndDate}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      recurrenceEndDate: e.target.value,
                    }))
                  }
                  className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                />
              </label>
            ) : null}

            <button
              type="submit"
              disabled={saving || (draft.kind === "APPOINTMENT" && patients.length === 0)}
              className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] py-2 px-3 font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {draft.kind === "VACANCY"
                ? t(locale, "Create Vacancy", "צור זמינות")
                : draft.kind === "BLOCK"
                  ? t(locale, "Save Block", "שמירת חסימה")
                  : t(locale, "Book Selected Slot", "קבע משבצת נבחרת")}
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
