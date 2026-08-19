"use client";

import dynamic from "next/dynamic";

import type {
  CalendarEventDTO,
  PatientOptionDTO,
} from "@/lib/appointment-service";
import type { AppLocale } from "@/lib/locale";

const ClinicCalendar = dynamic(
  () =>
    import("@/components/calendar/clinic-calendar").then(
      (mod) => mod.ClinicCalendar
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[32rem] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[var(--color-foreground)]/70">
        Loading calendar...
      </div>
    ),
  }
);

export function ClinicCalendarLoader(props: {
  locale: AppLocale;
  patients: PatientOptionDTO[];
  appointments: CalendarEventDTO[];
}) {
  return <ClinicCalendar {...props} />;
}
