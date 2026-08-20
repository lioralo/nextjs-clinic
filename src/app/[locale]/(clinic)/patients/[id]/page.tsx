import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addNoteAction,
  deleteNoteAction,
  updateNoteAction,
  updatePatientAction,
} from "@/app/[locale]/(clinic)/patients/actions";
import {
  PATIENT_STATUSES,
  PATIENT_TYPES,
  statusLabel,
  t,
  typeLabel,
} from "@/lib/copy";
import { toDateInputValue } from "@/lib/datetime";
import { calendarFocusHref } from "@/lib/datetime";
import {
  getPatient,
  listNotes,
  nextSessionNumber,
} from "@/lib/patient-service";
import {
  listPatientAppointments,
  toCalendarEvent,
} from "@/lib/appointment-service";

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "en" | "he"; id: string }>;
  searchParams: Promise<{ section?: string; editNote?: string }>;
}) {
  const { locale, id } = await params;
  const { section, editNote } = await searchParams;
  const activeSection = section === "logs" ? "logs" : "info";

  const patient = await getPatient(id);
  if (!patient) notFound();

  const [notes, suggestedSession, meetings] = await Promise.all([
    listNotes(patient.id),
    nextSessionNumber(patient.id),
    listPatientAppointments(patient.id),
  ]);
  const savePatient = updatePatientAction.bind(null, locale, patient.id);
  const saveNote = addNoteAction.bind(null, locale, patient.id);
  const editing = notes.find((note) => note.id === editNote);

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold mb-1">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-[var(--color-foreground)]/70">
            {statusLabel(locale, patient.status)} ·{" "}
            {typeLabel(locale, patient.patientType)}
          </p>
        </div>
        <Link
          href={`/${locale}/patients`}
          className="rounded-xl border border-[var(--color-border)] px-4 py-2"
        >
          {t(locale, "Back to Patients", "חזרה למטופלים")}
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <Link
          href={`/${locale}/patients/${patient.id}`}
          className={`rounded-full px-4 py-1.5 text-sm font-medium border ${
            activeSection === "info"
              ? "bg-[var(--color-primary)] text-[var(--color-surface)] border-transparent"
              : "border-[var(--color-border)]"
          }`}
        >
          {t(locale, "Details", "פרטים")}
        </Link>
        <Link
          href={`/${locale}/patients/${patient.id}?section=logs`}
          className={`rounded-full px-4 py-1.5 text-sm font-medium border ${
            activeSection === "logs"
              ? "bg-[var(--color-primary)] text-[var(--color-surface)] border-transparent"
              : "border-[var(--color-border)]"
          }`}
        >
          {t(locale, "Meeting Logs", "יומני מפגש")}
        </Link>
      </div>

      {activeSection === "info" ? (
        <>
        <form
          action={savePatient}
          className="rounded-2xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5 flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "First name", "שם פרטי")}
              <input
                name="firstName"
                defaultValue={patient.firstName}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Last name", "שם משפחה")}
              <input
                name="lastName"
                defaultValue={patient.lastName}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Status", "סטטוס")}
              <select
                name="status"
                defaultValue={patient.status}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              >
                {PATIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(locale, status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Patient Type", "סוג מטופל")}
              <select
                name="patientType"
                defaultValue={patient.patientType}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              >
                {PATIENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {typeLabel(locale, type)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Phone", "טלפון")}
              <input
                name="phone"
                defaultValue={patient.phone ?? ""}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Email", "אימייל")}
              <input
                name="email"
                type="email"
                defaultValue={patient.email ?? ""}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Date of Birth", "תאריך לידה")}
              <input
                name="birthDate"
                type="date"
                defaultValue={
                  patient.birthDate ? toDateInputValue(patient.birthDate) : ""
                }
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "ID Number", "מספר תעודת זהות")}
              <input
                name="idNumber"
                defaultValue={patient.idNumber ?? ""}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            {t(locale, "Notes", "הערות")}
            <textarea
              name="notesText"
              defaultValue={patient.notesText ?? ""}
              className="min-h-28 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
          </label>

          <div>
            <button
              type="submit"
              className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] py-2 px-4 font-semibold hover:opacity-90"
            >
              {t(locale, "Save Patient Record", "שמירת תיק מטופל")}
            </button>
          </div>
        </form>
        <section
          data-testid="patient-meetings"
          className="mt-4 rounded-2xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5"
        >
          <h2 className="text-lg font-semibold mb-1">
            {t(locale, "Meetings", "פגישות")}
          </h2>
          {meetings.length === 0 ? (
            <p className="text-sm text-[var(--color-foreground)]/70">
              {t(locale, "No meetings scheduled.", "אין פגישות מתוכננות.")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {meetings.map((meeting) => {
                const event = toCalendarEvent(meeting);
                return (
                  <li key={event.id}>
                    <Link
                      href={calendarFocusHref(
                        locale,
                        patient.id,
                        meeting.startAt
                      )}
                      className="block rounded-xl border border-[var(--color-border)] px-3 py-2 hover:bg-[var(--color-primary-container)]"
                    >
                      {new Date(event.start).toLocaleString(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        </>
      ) : (
        <section className="rounded-2xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5">
          <h2 className="text-lg font-semibold mb-1">
            {t(locale, "Meeting Logs", "יומני מפגש")}
          </h2>
          <p className="text-sm text-[var(--color-foreground)]/70 mb-4">
            {t(
              locale,
              "Document any call, update, or non-session encounter.",
              "תעד כל שיחה, עדכון או מפגש שאינו טיפולי."
            )}
          </p>

          <form
            action={
              editing
                ? updateNoteAction.bind(null, locale, patient.id, editing.id)
                : saveNote
            }
            data-testid="patient-notes-form"
            className="flex flex-col gap-3 mb-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                {t(locale, "Session Number", "מספר מפגש")}
                <input
                  name="sessionNumber"
                  type="number"
                  min={1}
                  defaultValue={
                    editing?.sessionNumber ?? suggestedSession
                  }
                  className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                {t(locale, "Date", "תאריך")}
                <input
                  name="noteDate"
                  type="date"
                  defaultValue={
                    editing?.noteDate
                      ? toDateInputValue(editing.noteDate)
                      : toDateInputValue(new Date())
                  }
                  className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Key Topics", "נושאים מרכזיים")}
              <input
                name="keyTopics"
                defaultValue={editing?.keyTopics ?? ""}
                className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t(locale, "Meeting Log", "יומן מפגש")}
              <textarea
                name="content"
                required
                defaultValue={editing?.content ?? ""}
                className="min-h-24 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] py-2 px-4 font-semibold hover:opacity-90"
              >
                {editing
                  ? t(locale, "Save Log", "שמור יומן")
                  : t(locale, "Add Meeting Log", "הוסף יומן מפגש")}
              </button>
              {editing ? (
                <Link
                  href={`/${locale}/patients/${patient.id}?section=logs`}
                  className="rounded-xl border border-[var(--color-border)] px-4 py-2"
                >
                  {t(locale, "Cancel", "ביטול")}
                </Link>
              ) : null}
            </div>
          </form>

          {notes.length === 0 ? (
            <div className="text-[var(--color-foreground)]/70">
              {t(locale, "No meeting logs yet.", "אין עדיין יומני מפגש.")}
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-primary-container)]/30 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {t(locale, "Session", "מפגש")}{" "}
                        {note.sessionNumber ?? "—"}
                      </div>
                      <div className="text-sm text-[var(--color-foreground)]/70">
                        {(note.noteDate ?? note.createdAt).toLocaleDateString(
                          locale
                        )}
                        {note.author.username ? ` · ${note.author.username}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/${locale}/patients/${patient.id}?section=logs&editNote=${note.id}`}
                        className="text-sm hover:underline"
                      >
                        {t(locale, "Edit", "עריכה")}
                      </Link>
                      <form
                        action={deleteNoteAction.bind(
                          null,
                          locale,
                          patient.id,
                          note.id
                        )}
                      >
                        <button
                          type="submit"
                          className="text-sm hover:underline"
                        >
                          {t(locale, "Delete", "מחיקה")}
                        </button>
                      </form>
                    </div>
                  </div>
                  {note.keyTopics ? (
                    <div className="mt-2 text-sm text-[var(--color-foreground)]/80">
                      {note.keyTopics}
                    </div>
                  ) : null}
                  <div className="mt-2 whitespace-pre-wrap">{note.content}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
