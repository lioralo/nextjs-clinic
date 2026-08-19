"use client";

import heLocale from "@fullcalendar/core/locales/he";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { RecurrenceScope } from "@/lib/calendar-mutations";
import type {
  CalendarEventDTO,
  PatientOptionDTO,
} from "@/lib/appointment-service";
import { kindLabel, t } from "@/lib/copy";
import { snapToClinicHours, toDatetimeLocalValue } from "@/lib/datetime";
import type { AppLocale } from "@/lib/locale";

type Props = {
  locale: AppLocale;
  patients: PatientOptionDTO[];
  appointments: CalendarEventDTO[];
  formError?: string | null;
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
  const { start, end } = snapToClinicHours();
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

function actionMessage(locale: AppLocale, error: string | undefined) {
  if (error === "conflict") {
    return t(
      locale,
      "That time overlaps another meeting, vacancy, or block.",
      "הזמן חופף לפגישה, זמינות או חסימה אחרת."
    );
  }
  if (error === "unauthorized") {
    return t(locale, "Please sign in again.", "יש להתחבר מחדש.");
  }
  return t(locale, "Booking failed.", "הקביעה נכשלה.");
}

function askScope(
  locale: AppLocale,
  isRecurring: boolean
): RecurrenceScope | null {
  if (!isRecurring) return "series";
  const thisOnly = window.confirm(
    t(
      locale,
      "Apply to this meeting only?\nOK = this meeting\nCancel = entire series",
      "להחיל רק על הפגישה הזו?\nאישור = פגישה זו\nביטול = כל הסדרה"
    )
  );
  return thisOnly ? "this" : "series";
}

export function ClinicCalendar({
  locale,
  patients,
  appointments,
  formError,
}: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(patients));
  const [selected, setSelected] = useState<SelectedEvent | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editMeetingType, setEditMeetingType] = useState<"IN_PERSON" | "ONLINE">(
    "IN_PERSON"
  );
  const [editMeetingLink, setEditMeetingLink] = useState("");
  const [occupyPatientId, setOccupyPatientId] = useState(patients[0]?.id ?? "");
  const [error, setError] = useState<string | null>(
    formError ? actionMessage(locale, formError) : null
  );

  useEffect(() => {
    if (!formError) return;
    setError(actionMessage(locale, formError));
  }, [formError, locale]);

  useEffect(() => {
    if (!selected) return;
    setEditStart(toDatetimeLocalValue(new Date(selected.start)));
    setEditEnd(toDatetimeLocalValue(new Date(selected.end)));
    setEditMeetingType(selected.meetingType === "ONLINE" ? "ONLINE" : "IN_PERSON");
    setEditMeetingLink(selected.meetingLink ?? "");
  }, [selected]);

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
          meetingType: appointment.meetingType,
          meetingLink: appointment.meetingLink,
        },
      })),
    [appointments]
  );

  const selectedPatient = patients.find((patient) => patient.id === draft.patientId);

  async function persistMove(
    id: string,
    start: Date,
    end: Date,
    revert: () => void,
    isRecurring: boolean
  ) {
    const scope = askScope(locale, isRecurring);
    if (!scope) {
      revert();
      return;
    }
    const body = new FormData();
    body.set("intent", "move");
    body.set("ajax", "1");
    body.set("locale", locale);
    body.set("appointmentId", id);
    body.set("startAt", start.toISOString());
    body.set("endAt", end.toISOString());
    body.set("scope", scope);
    const response = await fetch("/api/calendar", {
      method: "POST",
      body,
      credentials: "same-origin",
    });
    const result = (await response.json()) as {
      ok: boolean;
      error?: string;
    };
    if (!result.ok) {
      revert();
      setError(actionMessage(locale, result.error));
      return;
    }
    router.refresh();
  }

  return (
    <div
      data-testid="clinic-calendar"
      className="clinic-calendar grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_20rem] gap-4"
    >
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 overflow-x-auto">
        {error ? (
          <div
            className="mb-3 text-sm text-[var(--color-primary-dark)]"
            data-testid="calendar-error"
          >
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
          slotMaxTime="21:00:00"
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
            setError(null);
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
              meetingType:
                info.event.extendedProps.meetingType === "ONLINE"
                  ? "ONLINE"
                  : "IN_PERSON",
              meetingLink: info.event.extendedProps.meetingLink
                ? String(info.event.extendedProps.meetingLink)
                : null,
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
            void persistMove(
              info.event.id,
              range.start,
              range.end,
              info.revert,
              Boolean(info.event.extendedProps.isRecurring)
            );
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
            void persistMove(
              info.event.id,
              range.start,
              range.end,
              info.revert,
              Boolean(info.event.extendedProps.isRecurring)
            );
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

            {selected.kind === "VACANCY" ? (
              <form method="post" action="/api/calendar" className="flex flex-col gap-3">
                <input type="hidden" name="intent" value="occupy" />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="vacancyEventId" value={selected.id} />
                <label className="flex flex-col gap-1 text-sm">
                  {t(locale, "Book this vacancy for", "קבע זמינות זו עבור")}
                  <select
                    name="patientId"
                    data-testid="occupy-patient"
                    value={occupyPatientId}
                    onChange={(e) => setOccupyPatientId(e.target.value)}
                    className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                  >
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  data-testid="occupy-vacancy"
                  disabled={patients.length === 0}
                  className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold disabled:opacity-60"
                >
                  {t(locale, "Occupy slot", "תפוס משבצת")}
                </button>
              </form>
            ) : (
              <form method="post" action="/api/calendar" className="flex flex-col gap-3">
                <input type="hidden" name="intent" value="save" />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="appointmentId" value={selected.id} />
                <label className="flex flex-col gap-1 text-sm">
                  {t(locale, "Start Time", "שעת התחלה")}
                  <input
                    type="datetime-local"
                    name="startAt"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  {t(locale, "End Time", "שעת סיום")}
                  <input
                    type="datetime-local"
                    name="endAt"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                  />
                </label>
                {selected.kind === "APPOINTMENT" ? (
                  <label className="flex flex-col gap-1 text-sm">
                    {t(locale, "Meeting Type", "סוג פגישה")}
                    <select
                      name="meetingType"
                      value={editMeetingType}
                      onChange={(e) =>
                        setEditMeetingType(
                          e.target.value as "IN_PERSON" | "ONLINE"
                        )
                      }
                      className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                    >
                      <option value="IN_PERSON">
                        {t(locale, "In-person", "פרונטלי")}
                      </option>
                      <option value="ONLINE">
                        {t(locale, "Online", "אונליין")}
                      </option>
                    </select>
                  </label>
                ) : null}
                <input type="hidden" name="meetingLink" value={editMeetingLink} />
                {selected.isRecurring ? (
                  <div className="flex flex-col gap-2">
                    <button
                      type="submit"
                      name="scope"
                      value="this"
                      data-testid="save-this-occurrence"
                      className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
                    >
                      {t(locale, "Save this meeting", "שמור פגישה זו")}
                    </button>
                    <button
                      type="submit"
                      name="scope"
                      value="series"
                      className="rounded-xl border border-[var(--color-border)] px-4 py-2"
                    >
                      {t(locale, "Save entire series", "שמור את כל הסדרה")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="submit"
                    name="scope"
                    value="series"
                    className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold"
                  >
                    {t(locale, "Save changes", "שמור שינויים")}
                  </button>
                )}
              </form>
            )}

            <div className="flex flex-col gap-2">
              {selected.patientId ? (
                <Link
                  href={`/${locale}/patients/${selected.patientId}`}
                  className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-center"
                >
                  {t(locale, "Open Patient Profile", "פתח פרופיל מטופל")}
                </Link>
              ) : null}
              {selected.isRecurring ? (
                <>
                  <form
                    method="post"
                    action="/api/calendar"
                    onSubmit={(event) => {
                      if (
                        !window.confirm(
                          t(locale, "Delete this meeting?", "למחוק את הפגישה הזו?")
                        )
                      ) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="appointmentId" value={selected.id} />
                    <input type="hidden" name="scope" value="this" />
                    <button
                      type="submit"
                      data-testid="delete-this-occurrence"
                      className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2"
                    >
                      {t(locale, "Delete this meeting", "מחק פגישה זו")}
                    </button>
                  </form>
                  <form
                    method="post"
                    action="/api/calendar"
                    onSubmit={(event) => {
                      if (
                        !window.confirm(
                          t(locale, "Delete entire series?", "למחוק את כל הסדרה?")
                        )
                      ) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="appointmentId" value={selected.id} />
                    <input type="hidden" name="scope" value="series" />
                    <button
                      type="submit"
                      className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2"
                    >
                      {t(locale, "Delete entire series", "מחק את כל הסדרה")}
                    </button>
                  </form>
                </>
              ) : (
                <form
                  method="post"
                  action="/api/calendar"
                  onSubmit={(event) => {
                    if (
                      !window.confirm(
                        t(locale, "Delete Meeting?", "למחוק פגישה?")
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="appointmentId" value={selected.id} />
                  <input type="hidden" name="scope" value="series" />
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2"
                  >
                    {t(locale, "Delete Meeting", "מחק פגישה")}
                  </button>
                </form>
              )}
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
          <form
            method="post"
            action="/api/calendar"
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="intent" value="create" />
            <input type="hidden" name="locale" value={locale} />
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
                name="kind"
                value={draft.kind}
                onChange={(e) =>
                  setDraft((current) => {
                    const kind = e.target.value as Draft["kind"];
                    return {
                      ...current,
                      kind,
                      isRecurring:
                        kind === "APPOINTMENT"
                          ? defaultRecurring(
                              patients.find((patient) => patient.id === current.patientId)
                            )
                          : false,
                    };
                  })
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
                  name="patientId"
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
                  name="title"
                  data-testid="draft-title"
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
                name="startAt"
                required
                data-testid="draft-start"
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
                name="endAt"
                required
                data-testid="draft-end"
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
                  name="meetingType"
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
                  name="meetingLink"
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
                name="isRecurring"
                value="1"
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
                  name="recurrenceEndDate"
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
              data-testid="create-booking"
              disabled={draft.kind === "APPOINTMENT" && patients.length === 0}
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
