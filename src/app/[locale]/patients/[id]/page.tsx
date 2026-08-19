import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addNoteAction,
  updatePatientAction,
} from "@/app/[locale]/patients/actions";
import { getPatient, listNotes } from "@/lib/patient-service";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ locale: "en" | "he"; id: string }>;
}) {
  const { locale, id } = await params;
  const isHe = locale === "he";

  const patient = await getPatient(id);
  if (!patient) notFound();

  const notes = await listNotes(patient.id);
  const savePatient = updatePatientAction.bind(null, locale, patient.id);
  const saveNote = addNoteAction.bind(null, locale, patient.id);

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold mb-1">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-[var(--color-foreground)]/70">
            {isHe ? "פרטי מטופל" : "Patient details"}
          </p>
        </div>

        <Link
          href={`/${locale}/patients`}
          className="rounded-xl border border-[var(--color-border)] px-4 py-2"
        >
          {isHe ? "חזרה למטופלים" : "Back to Patients"}
        </Link>
      </div>

      <form
        action={savePatient}
        className="rounded-2xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5 flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {isHe ? "שם פרטי" : "First name"}
            <input
              name="firstName"
              defaultValue={patient.firstName}
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {isHe ? "שם משפחה" : "Last name"}
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
            {isHe ? "טלפון" : "Phone"}
            <input
              name="phone"
              defaultValue={patient.phone ?? ""}
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {isHe ? "אימייל" : "Email"}
            <input
              name="email"
              type="email"
              defaultValue={patient.email ?? ""}
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          {isHe ? "הערות" : "Notes"}
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
            {isHe ? "שמירת תיק מטופל" : "Save Patient Record"}
          </button>
        </div>
      </form>

      <section className="mt-5 rounded-2xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5">
        <h2 className="text-lg font-semibold mb-1">
          {isHe ? "רשומות מפגש" : "Encounter Notes"}
        </h2>
        <p className="text-sm text-[var(--color-foreground)]/70 mb-4">
          {isHe
            ? "תעד כל שיחה, עדכון או מפגש שאינו טיפולי."
            : "Document any call, update, or non-session encounter."}
        </p>

        <form
          action={saveNote}
          data-testid="patient-notes-form"
          className="flex flex-col gap-3 mb-5"
        >
          <label className="flex flex-col gap-1 text-sm">
            {isHe ? "רשומת מפגש" : "Encounter Note"}
            <textarea
              name="content"
              required
              className="min-h-24 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              placeholder={
                isHe ? "כתוב הערה..." : "Write a note..."
              }
            />
          </label>
          <div>
            <button
              type="submit"
              className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] py-2 px-4 font-semibold hover:opacity-90"
            >
              {isHe ? "שמור רשומת מפגש" : "Save Encounter"}
            </button>
          </div>
        </form>

        {notes.length === 0 ? (
          <div className="text-[var(--color-foreground)]/70">
            {isHe ? "אין עדיין רשומות מפגש." : "No encounter notes yet."}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-primary-container)]/30 p-3"
              >
                <div className="whitespace-pre-wrap">{note.content}</div>
                <div className="mt-2 text-sm text-[var(--color-foreground)]/70">
                  {note.createdAt.toLocaleString(locale)}
                  {note.author.username ? ` · ${note.author.username}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
