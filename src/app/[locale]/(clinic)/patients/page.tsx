import Link from "next/link";

import { nextOccurrenceAt } from "@/lib/appointment-service";
import { calendarFocusHref } from "@/lib/datetime";
import {
  parseCrmStatusFilter,
  listCrmPatients,
} from "@/lib/patient-service";
import { t, type CrmStatusFilter, statusLabel, typeLabel } from "@/lib/copy";
import type { AppLocale } from "@/lib/locale";

const FILTERS: { id: CrmStatusFilter; en: string; he: string }[] = [
  { id: "all", en: "All", he: "הכל" },
  { id: "candidate", en: "Candidate/Waiting", he: "מועמד/ממתין" },
  { id: "ongoing", en: "Ongoing", he: "פעיל" },
  { id: "archived", en: "Archived", he: "בארכיון" },
];

function filterHref(
  locale: AppLocale,
  status: CrmStatusFilter,
  q: string
) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  const query = params.toString();
  return `/${locale}/patients${query ? `?${query}` : ""}`;
}

export default async function PatientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "en" | "he" }>;
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const status = parseCrmStatusFilter(query.status);
  const q = String(query.q ?? "").trim();
  const patients = await listCrmPatients({ status, q });

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold mb-1">
            {t(locale, "Patients", "מטופלים")}
          </h1>
          <p className="text-[var(--color-foreground)]/70">
            {t(
              locale,
              "Search, narrow the roster, and sort it for the next action.",
              "חפש, צמצם את הרשימה ומיין לפעולה הבאה."
            )}
          </p>
        </div>
        <Link
          href={`/${locale}/patients/new`}
          className="rounded-xl bg-[var(--color-primary)] text-[var(--color-surface)] px-4 py-2 font-semibold hover:opacity-90"
        >
          {t(locale, "New patient", "מטופל חדש")}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2" data-testid="crm-status-filters">
        {FILTERS.map((filter) => {
          const active = status === filter.id;
          return (
            <Link
              key={filter.id}
              href={filterHref(locale, filter.id, q)}
              data-testid={`crm-status-${filter.id}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border ${
                active
                  ? "bg-[var(--color-primary)] text-[var(--color-surface)] border-transparent"
                  : "border-[var(--color-border)] hover:bg-[var(--color-primary-container)]"
              }`}
            >
              {locale === "he" ? filter.he : filter.en}
            </Link>
          );
        })}
      </div>

      <form
        className="mb-4 flex flex-wrap gap-2"
        action={`/${locale}/patients`}
        method="get"
      >
        {status !== "all" ? (
          <input type="hidden" name="status" value={status} />
        ) : null}
        <input
          name="q"
          defaultValue={q}
          placeholder={t(locale, "Name, email, or phone", "שם, אימייל או טלפון")}
          className="min-w-64 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 outline-none"
        />
        <button
          type="submit"
          className="rounded-xl border border-[var(--color-border)] px-4 py-2 font-medium"
        >
          {t(locale, "Search", "חיפוש")}
        </button>
      </form>

      <div className="rounded-2xl border bg-[var(--color-surface)] border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-primary-container)]/40">
              <th className="text-start px-4 py-3 font-semibold">
                {t(locale, "Name", "שם")}
              </th>
              <th className="text-start px-4 py-3 font-semibold">
                {t(locale, "Type", "סוג")}
              </th>
              <th className="text-start px-4 py-3 font-semibold">
                {t(locale, "Status", "סטטוס")}
              </th>
              <th className="text-start px-4 py-3 font-semibold">
                {t(locale, "Next Appt", "פגישה הבאה")}
              </th>
              <th className="text-start px-4 py-3 font-semibold">
                {t(locale, "Phone", "טלפון")}
              </th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-[var(--color-foreground)]/70"
                >
                  {t(locale, "No patients yet.", "אין עדיין מטופלים.")}
                </td>
              </tr>
            ) : (
              patients.map((patient) => {
                const next = patient.appointments
                  .map((appointment) => nextOccurrenceAt(appointment))
                  .filter((value): value is Date => Boolean(value))
                  .sort((a, b) => a.getTime() - b.getTime())[0];
                return (
                  <tr
                    key={patient.id}
                    className="border-t border-[var(--color-border)]"
                  >
                    <td className="px-4 py-3 font-medium">
                      <Link
                        className="hover:underline"
                        href={`/${locale}/patients/${patient.id}`}
                      >
                        {patient.firstName} {patient.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {typeLabel(locale, patient.patientType)}
                    </td>
                    <td className="px-4 py-3">
                      {statusLabel(locale, patient.status)}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-foreground)]/80">
                      {next ? (
                        <Link
                          href={calendarFocusHref(locale, patient.id, next)}
                          data-testid={`next-appt-${patient.id}`}
                          className="hover:underline"
                        >
                          {next.toLocaleString(locale, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </Link>
                      ) : (
                        t(locale, "Not scheduled", "לא מתוכנן")
                      )}
                    </td>
                    <td className="px-4 py-3">{patient.phone ?? "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
