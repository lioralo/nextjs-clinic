import { createPatientAction } from "@/app/[locale]/patients/actions";
import { t, PATIENT_STATUSES, PATIENT_TYPES, statusLabel, typeLabel } from "@/lib/copy";

export default async function NewPatientPage({
  params,
}: {
  params: Promise<{ locale: "en" | "he" }>;
}) {
  const { locale } = await params;
  const action = createPatientAction.bind(null, locale);

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-1">
          {t(locale, "New patient", "מטופל חדש")}
        </h1>
        <p className="text-[var(--color-foreground)]/70">
          {t(
            locale,
            "Create a basic patient record.",
            "יצירת רשומת מטופל בסיסית"
          )}
        </p>
      </div>

      <form
        action={action}
        className="rounded-2xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5 flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {t(locale, "First name", "שם פרטי")}
            <input
              name="firstName"
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t(locale, "Last name", "שם משפחה")}
            <input
              name="lastName"
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
              defaultValue="CANDIDATE"
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
              defaultValue="PRIVATE"
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
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t(locale, "Email", "אימייל")}
            <input
              name="email"
              type="email"
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
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t(locale, "ID Number", "מספר תעודת זהות")}
            <input
              name="idNumber"
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          {t(locale, "Notes", "הערות")}
          <textarea
            name="notesText"
            className="min-h-28 rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
          />
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] py-2 px-4 font-semibold hover:opacity-90"
          >
            {t(locale, "Save", "שמור")}
          </button>
          <a
            href={`/${locale}/patients`}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2"
          >
            {t(locale, "Cancel", "ביטול")}
          </a>
        </div>
      </form>
    </div>
  );
}
