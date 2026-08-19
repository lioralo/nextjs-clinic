"use client";

import { ClinicCalendar } from "@/components/calendar/clinic-calendar";
import type {
  CalendarEventDTO,
  PatientOptionDTO,
} from "@/lib/appointment-service";
import type { AppLocale } from "@/lib/locale";

export function ClinicCalendarLoader(props: {
  locale: AppLocale;
  patients: PatientOptionDTO[];
  appointments: CalendarEventDTO[];
  formError?: string | null;
}) {
  return <ClinicCalendar {...props} />;
}
