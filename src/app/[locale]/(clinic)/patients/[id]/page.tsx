import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addNoteAction,
  deleteNoteAction,
  updateNoteAction,
} from "@/app/[locale]/(clinic)/patients/actions";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { PatientCarePanel } from "@/components/patient-care-panel";
import { PatientOpsDialogs } from "@/components/patient-ops-dialogs";
import {
  listPatientAppointments,
  toCalendarEvent,
} from "@/lib/appointment-service";
import {
  listAssessmentTypes,
  listPatientAssessments,
  resolveDefinition,
} from "@/lib/assessment-service";
import { statusLabel, t, typeLabel } from "@/lib/copy";
import { calendarFocusHref, toDateInputValue } from "@/lib/datetime";
import {
  getPatient,
  listNotes,
  nextSessionNumber,
} from "@/lib/patient-service";
import { listPatientResources, listResources } from "@/lib/resource-service";
import { listPatientPlans } from "@/lib/treatment-plan-service";

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "en" | "he"; id: string }>;
  searchParams: Promise<{
    section?: string;
    editNote?: string;
    portalUser?: string;
    tempPassword?: string;
    portalError?: string;
  }>;
}) {
  const { locale, id } = await params;
  const { section, editNote, portalUser, tempPassword, portalError } =
    await searchParams;
  const activeSection =
    section === "logs" ? "logs" : section === "care" ? "care" : "info";

  const patient = await getPatient(id);
  if (!patient) notFound();

  const [notes, suggestedSession, meetings, resources, assigned, plans, assessments, questionnaireTypesRaw] =
    await Promise.all([
      listNotes(patient.id),
      nextSessionNumber(patient.id),
      listPatientAppointments(patient.id),
      listResources(),
      listPatientResources(patient.id),
      listPatientPlans(patient.id),
      listPatientAssessments(patient.id),
      listAssessmentTypes(),
    ]);
  const questionnaireTypes = questionnaireTypesRaw
    .map((type) => {
      const definition = resolveDefinition(type);
      if (!definition) return null;
      return {
        key: type.key,
        name: type.name,
        description: type.description,
        descriptionHe: type.descriptionHe,
        definition,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const saveNote = addNoteAction.bind(null, locale, patient.id);
  const editing = notes.find((note) => note.id === editNote);

  return (
    <div className="w-full min-w-0">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
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
          className="inline-flex min-h-11 items-center rounded-xl border border-[var(--color-border)] px-4 py-2"
        >
          {t(locale, "Back to Patients", "חזרה למטופלים")}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/${locale}/patients/${patient.id}`}
          className={`inline-flex min-h-11 items-center rounded-full border px-4 py-1.5 text-sm font-medium ${
            activeSection === "info"
              ? "border-transparent bg-[var(--color-primary)] text-[var(--color-surface)]"
              : "border-[var(--color-border)]"
          }`}
        >
          {t(locale, "Details", "פרטים")}
        </Link>
        <Link
          href={`/${locale}/patients/${patient.id}?section=logs`}
          className={`inline-flex min-h-11 items-center rounded-full border px-4 py-1.5 text-sm font-medium ${
            activeSection === "logs"
              ? "border-transparent bg-[var(--color-primary)] text-[var(--color-surface)]"
              : "border-[var(--color-border)]"
          }`}
        >
          {t(locale, "Meeting Logs", "יומני מפגש")}
        </Link>
        <Link
          href={`/${locale}/patients/${patient.id}?section=care`}
          className={`inline-flex min-h-11 items-center rounded-full border px-4 py-1.5 text-sm font-medium ${
            activeSection === "care"
              ? "border-transparent bg-[var(--color-primary)] text-[var(--color-surface)]"
              : "border-[var(--color-border)]"
          }`}
        >
          {t(locale, "Care", "טיפול")}
        </Link>
      </div>

      {activeSection === "care" ? (
        <PatientCarePanel
          locale={locale}
          patientId={patient.id}
          plans={plans}
          assessments={assessments}
          questionnaireTypes={questionnaireTypes}
        />
      ) : activeSection === "info" ? (
        <>
          <PatientOpsDialogs
            locale={locale}
            patient={{
              id: patient.id,
              firstName: patient.firstName,
              lastName: patient.lastName,
              status: patient.status,
              patientType: patient.patientType,
              phone: patient.phone,
              email: patient.email,
              birthDate: patient.birthDate,
              idNumber: patient.idNumber,
              notesText: patient.notesText,
              reminderEmailEnabled: patient.reminderEmailEnabled,
              portalUsername: patient.portalUser?.username ?? null,
            }}
            resources={resources.map((resource) => ({
              id: resource.id,
              title: resource.title,
            }))}
            assignedResourceIds={assigned.map((row) => row.resourceId)}
            portalUser={portalUser}
            tempPassword={tempPassword}
            portalError={portalError}
          />
          <section
            data-testid="patient-meetings"
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <h2 className="mb-1 text-lg font-semibold">
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
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-1 text-lg font-semibold">
            {t(locale, "Meeting Logs", "יומני מפגש")}
          </h2>
          <p className="mb-4 text-sm text-[var(--color-foreground)]/70">
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
            className="mb-5 flex flex-col gap-3"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                {t(locale, "Session Number", "מספר מפגש")}
                <input
                  name="sessionNumber"
                  type="number"
                  min={1}
                  defaultValue={editing?.sessionNumber ?? suggestedSession}
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
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="shareWithPatient"
                value="1"
                defaultChecked={editing?.shareWithPatient}
              />
              {t(locale, "Share with patient", "שתף עם המטופל")}
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-surface)] hover:opacity-90"
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
                      <ConfirmActionDialog
                        locale={locale}
                        title={t(locale, "Delete log?", "למחוק יומן?")}
                        description={t(
                          locale,
                          "This meeting log will be removed.",
                          "יומן המפגש יימחק."
                        )}
                        confirmLabel={t(locale, "Delete", "מחיקה")}
                        triggerLabel={t(locale, "Delete", "מחיקה")}
                        danger
                        action={deleteNoteAction.bind(
                          null,
                          locale,
                          patient.id,
                          note.id
                        )}
                      />
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
