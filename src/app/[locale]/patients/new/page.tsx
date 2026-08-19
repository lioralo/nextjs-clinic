import { createPatientAction } from "@/app/[locale]/patients/actions";

export default async function NewPatientPage({
  params,
}: {
  params: Promise<{ locale: "en" | "he" }>;
}) {
  const { locale } = await params;
  const isHe = locale === "he";
  const action = createPatientAction.bind(null, locale);

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold mb-1">
          {isHe ? "מטופל חדש" : "New patient"}
        </h1>
        <p className="text-[var(--color-foreground)]/70">
          {isHe
            ? "יצירת רשומת מטופל בסיסית"
            : "Create a basic patient record."}
        </p>
      </div>

      <form
        action={action}
        className="rounded-2xl border bg-[var(--color-surface)] border-[var(--color-border)] p-5 flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {isHe ? "שם פרטי" : "First name"}
            <input
              name="firstName"
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {isHe ? "שם משפחה" : "Last name"}
            <input
              name="lastName"
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
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {isHe ? "אימייל" : "Email"}
            <input
              name="email"
              type="email"
              className="rounded-xl border border-[var(--color-border)] bg-transparent px-3 py-2 outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          {isHe ? "הערות" : "Notes"}
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
            {isHe ? "שמור" : "Save"}
          </button>

          <a
            href={`/${locale}/patients`}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2"
          >
            {isHe ? "ביטול" : "Cancel"}
          </a>
        </div>
      </form>
    </div>
  );
}
